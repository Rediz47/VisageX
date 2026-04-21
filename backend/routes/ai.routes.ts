import { Router } from 'express';
import { createSharedRateLimiter, createDailyCap } from '../middleware/ratelimit.middleware.js';
import { getAdminDb } from '../services/firebase.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { FieldValue } from 'firebase-admin/firestore';
import { compressBase64Image } from '../utils/image.js';
import { validate, geminiAnalysisSchema, celebrityLookalikeSchema, glowCoachSchema } from '../utils/validation.js';
import { deductCreditWithLedger, refundCreditWithLedger, recordLedgerEntry } from '../services/ledger.service.js';
import { fraudCheck } from '../middleware/fraud.middleware.js';
import { checkScanSpike, isHighRiskForExpensiveOp } from '../services/fraud.service.js';
import { hashImage, getCachedResult, storeScanResult } from '../services/scan.service.js';

const router = Router();

// Vertex AI configuration — project + region from env, falling back to firebase config defaults
const GCP_PROJECT = process.env.GCP_PROJECT || 'gen-lang-client-0376848339';
const GCP_REGION = process.env.GCP_REGION || 'us-central1';

// Build Vertex AI endpoint URL for a given model
function vertexUrl(model: string, stream = false): string {
  const action = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
  return `https://${GCP_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${GCP_REGION}/publishers/google/models/${model}:${action}`;
}

const analysisLimiter = createSharedRateLimiter(5, "10 m", 'Too many analysis requests. Please wait before trying again.');
const celebrityLimiter = createSharedRateLimiter(3, "10 m", 'Too many celebrity scan requests. Please wait before trying again.');
const coachLimiter = createSharedRateLimiter(20, "10 m", 'Too many coach requests. Please slow down.');

// Daily caps: max scans per user per day (prevents runaway credit burn)
const analysisDailyCap = createDailyCap(50, 'Daily analysis limit reached. Try again tomorrow.');
const celebrityDailyCap = createDailyCap(30, 'Daily celebrity scan limit reached. Try again tomorrow.');

// Default model — override via GEMINI_MODEL env var if needed
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Retry helper: retries transient failures with exponential backoff.
// Respects 429 retryDelay headers. Skips retries on permanent errors (401, 403).
async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelayMs: number = 2000): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error.message || error);

      // Don't retry permanent errors
      const status = error.statusCode || 0;
      if (status === 401 || status === 403) {
        console.error(`Permanent error (${status}) — not retrying.`);
        throw error;
      }

      if (attempt < maxRetries) {
        // Use suggested retry delay from 429 response, or exponential backoff
        const suggestedDelay = error.retryAfterMs || 0;
        const delay = Math.max(suggestedDelay, baseDelayMs * Math.pow(2, attempt - 1));
        console.log(`Waiting ${(delay / 1000).toFixed(1)}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// Timeout: 25s on Netlify (must finish before 26s function limit), 120s locally
const AI_TIMEOUT_MS = process.env.NETLIFY ? 25000 : 120000;

// Helper: call Vertex AI REST API with API key auth (Express Mode)
async function callVertexAI(model: string, apiKey: string, requestBody: any): Promise<any> {
  const url = vertexUrl(model);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Vertex AI request to ${model} timed out after ${AI_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API ${model} error (${response.status}):`, errorText);

    // Parse retryDelay from 429 responses
    const err: any = new Error(`Gemini API returned ${response.status}: ${errorText}`);
    err.statusCode = response.status;
    if (response.status === 429) {
      try {
        const parsed = JSON.parse(errorText);
        const retryInfo = parsed?.error?.details?.find((d: any) => d['@type']?.includes('RetryInfo'));
        if (retryInfo?.retryDelay) {
          const seconds = parseInt(retryInfo.retryDelay);
          if (!isNaN(seconds)) err.retryAfterMs = seconds * 1000;
        }
      } catch { /* ignore parse errors */ }
    }
    throw err;
  }

  const data = await response.json();

  // Extract text from Vertex AI response format
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('Unexpected Vertex AI response structure:', JSON.stringify(data).slice(0, 500));
    throw new Error('No text in Vertex AI response');
  }

  return text;
}

// Secure AI Skin & Aesthetics Analysis Endpoint
router.post('/gemini-analysis', analysisLimiter, requireAuth, analysisDailyCap, fraudCheck('analyze'), validate(geminiAnalysisSchema), async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user!.uid;
    const clientIp = (req as any)._fraud?.ip || req.ip || 'unknown';

    const apiKey = process.env.VERTEX_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Vertex AI API key not configured' });
    }

    const db = getAdminDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    // Preemptive risk gate: block high-risk users BEFORE burning AI credits
    const riskGate = await isHighRiskForExpensiveOp(userId);
    if (riskGate.blocked) {
      return res.status(403).json({ error: riskGate.reason, code: 'HIGH_RISK_BLOCKED' });
    }

    // Check for scan spike (fraud detection)
    const { spikeDetected } = await checkScanSpike(userId);
    if (spikeDetected) {
      return res.status(429).json({ error: 'Unusual activity detected. Please slow down.', code: 'SPIKE_DETECTED' });
    }

    // Atomically deduct credit with ledger audit trail
    const userRef = db.collection('users').doc(userId);
    try {
      await deductCreditWithLedger(userId, 'analyze', { endpoint: 'gemini-analysis' }, clientIp);
    } catch (txErr: any) {
      if (txErr.statusCode === 404) return res.status(404).json({ error: 'User not found' });
      if (txErr.statusCode === 403) return res.status(403).json({ error: 'Insufficient credits', code: txErr.code });
      throw txErr;
    }
    let creditRefunded = false;

    // Extract base64 data from data URL
    const rawBase64 = image.includes(',') ? image.split(',')[1] : image;
    const rawMimeType = image.includes('data:') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

    // Compress image before sending to Vertex AI (resize to 768px, JPEG 80%)
    const { base64: base64Data, mimeType } = await compressBase64Image(rawBase64, rawMimeType);

    // Check cache: same user + same image → return cached result (saves $$$)
    const imageFingerprint = hashImage(base64Data);
    const cached = await getCachedResult(userId, imageFingerprint, 'analysis');
    if (cached) {
      // Refund the credit since we're serving from cache
      await refundCreditWithLedger(userId, 'refund_ai_fail', { reason: 'cache_hit', imageHash: imageFingerprint });
      return res.json(cached);
    }

    const prompt = `You are an expert dermatologist and facial aesthetics analyst. Analyze this face photo with extreme clinical precision.

Rate each metric on a scale of 1.0 to 10.0 (one decimal place). Be honest and accurate — do NOT inflate scores.

Analyze:
1. **Skin Quality** (overall_skin_score): Clarity, pore visibility, evenness
2. **Acne Presence** (acne_presence): 10 = no acne, 1 = severe acne
3. **Wrinkle Visibility** (wrinkle_visibility): 10 = no wrinkles, 1 = deep wrinkles
4. **Skin Texture** (skin_texture): Smoothness and uniformity
5. **Dark Circles** (dark_circles): 10 = none, 1 = severe
6. **Redness** (redness): 10 = no redness, 1 = very red/irritated
7. **Oiliness** (oiliness): 10 = balanced, 1 = extremely oily
8. **Skin Quality Score** (skin_quality): Combined skin health rating
9. **Grooming** (grooming): Eyebrow grooming, facial hair maintenance
10. **Cheekbone Prominence** (cheekbone_prominence): How defined are the cheekbones
11. **Overall Aesthetics Score** (overall_aesthetics_score): Overall facial attractiveness rating considering all features

Also provide:
- **Face Shape** (faceShape): One of: oval, round, square, heart, oblong, diamond, triangle
- **Color Season** (color_season): One of: Spring, Summer, Autumn, Winter (based on skin tone, hair, features)
- **Skin Analysis** (skinAnalysis): 2-3 sentence clinical skin assessment
- **Aesthetics Analysis** (aestheticsAnalysis): 2-3 sentence facial aesthetics assessment
- **Potential Score** (potentialScore): What score this person could reach with improvements (must be higher than overall_aesthetics_score)
- **Visual Strengths** (visualStrengths): Array of 2-4 specific facial strengths observed
- **Visual Weaknesses** (visualWeaknesses): Array of 1-3 areas for improvement
- **Improvements** (improvements): Array of 3-5 specific, actionable improvement suggestions
- **Hair Recommendations** (hairRecommendations): Array of 2-3 hair style objects, each with a 'styleName' (short name e.g. "Textured Crop") and 'reason' (1-2 sentences explaining why it suits this face shape)
- **Recommended Products** (recommendedProducts): Array of 3-5 product recommendations, each with "name", "category", and "reason"
- **Insight Descriptions** (insightDescriptions): A JSON object where each key is EXACTLY one of the strings from visualStrengths or visualWeaknesses, and each value is a 2-sentence description. Sentence 1: explain the scientific/aesthetic reason WHY this feature matters. Sentence 2: for strengths, describe the visual advantage; for weaknesses, give one specific actionable fix.
- **Improvement Plan** (improvementPlan): An array of EXACTLY 14-18 highly personalized, clinically precise improvement steps ordered easiest-to-hardest. Be SPECIFIC to THIS person's actual face — reference exact features you see (e.g. "your slightly convex nasal profile", "your obtuse gonial angle", "your mild infraorbital hollowing"). Each object must have:
  - "title": Specific clinical name (NOT generic — e.g. "Retinol + Niacinamide AM/PM Protocol" not "Skincare Routine"; "Lateral Canthoplasty" not "Eye Surgery"; "Genioplasty vs. Chin Implant" for chin; "Rhinoplasty — Dorsal Hump Reduction" if applicable)
  - "category": EXACTLY one of "Foundational", "Non-Invasive", "Minimally Invasive", "Surgical"
  - "difficulty": Integer 1-5 (1=daily habit, 2=lifestyle change, 3=professional treatment, 4=minor procedure, 5=major surgery)
  - "description": 1 sentence — name the EXACT feature being targeted on THIS face
  - "details": 3-4 sentences — be clinically specific: name exact products/techniques/measurements/angles. Reference THIS person's specific weaknesses. Include what to tell the provider, what outcome to expect, and any risks or alternatives.
  - "expectedImpact": Quantified if possible (e.g. "+0.4–0.6 to overall score", "Canthal tilt improvement of ~3°", "Jaw width increase of 4–6mm")
  - "costRange": Realistic current market cost (e.g. "$25–60/month", "$600–1,200 per session", "$12,000–22,000")
  - "timeframe": Specific (e.g. "Visible in 6–8 weeks", "Results at 3 months post-op", "Permanent after 1 session")
  - "recovery": Precise recovery (e.g. "7–10 days bruising", "6 weeks no strenuous activity", null)
  - "targetAreas": Array of 1-3 specific facial areas targeted
  REQUIRED MIX: at least 4 Foundational (habits/grooming/lifestyle), 3 Non-Invasive (exercise/devices/skincare actives), 3 Minimally Invasive (fillers/botox/threads/lasers), 3 Surgical (rhinoplasty/jaw/chin/eyes/cheeks). Order easiest-first. Do NOT give generic advice — every item must feel custom to this specific face.

Respond ONLY with valid JSON matching the exact keys listed above. No markdown, no explanation.`;

    try {
      // Retry the Vertex AI call up to 2 times (thinking disabled — failures should be rare)
      const resultText = await withRetry(() => callVertexAI(GEMINI_MODEL, apiKey, {
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
          // 4096 tokens truncates the 14–18-item improvementPlan; 16k is safely within gemini-2.5-flash limits.
          maxOutputTokens: 16384,
        }
      }), 2, 1000);

      // Robust parse: strip markdown fences and leading/trailing noise, then try to extract the outermost JSON object.
      const cleanJson = (raw: string): string => {
        let t = raw.trim();
        // Strip ```json ... ``` or ``` ... ``` fences
        const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
        if (fence) t = fence[1].trim();
        // If the model still added prose before/after, grab the outermost { ... } block.
        const first = t.indexOf('{');
        const last = t.lastIndexOf('}');
        if (first !== -1 && last > first) t = t.slice(first, last + 1);
        return t;
      };

      let aiResult;
      try {
        aiResult = JSON.parse(resultText);
      } catch {
        try {
          aiResult = JSON.parse(cleanJson(resultText));
        } catch (parseError: any) {
          console.error('Failed to parse Vertex AI response:', resultText?.slice(0, 1000));
          return res.status(500).json({
            error: 'Failed to parse AI response',
            detail: parseError?.message || 'JSON parse failed',
            preview: (resultText || '').slice(0, 240),
          });
        }
      }

      console.log('Vertex AI analysis completed successfully for user', userId);

      // Store result for history + future cache hits
      storeScanResult(userId, imageFingerprint, 'analysis', aiResult).catch(() => {});

      return res.json(aiResult);
    } catch (aiError: any) {
      console.error('Vertex AI call error:', aiError);
      // Refund the pre-deducted credit since AI call failed (with ledger entry)
      if (!creditRefunded) {
        creditRefunded = true;
        await refundCreditWithLedger(userId, 'refund_ai_fail', { endpoint: 'gemini-analysis', error: aiError?.message });
      }
      const isDev = process.env.NODE_ENV !== 'production' && !process.env.NETLIFY;
      return res.status(500).json({
        error: 'AI analysis failed during processing',
        ...(isDev && { detail: aiError?.message || String(aiError), statusCode: aiError?.statusCode }),
      });
    }

  } catch (error: any) {
    console.error('Vertex AI analysis error:', error);
    const isDev = process.env.NODE_ENV !== 'production' && !process.env.NETLIFY;
    return res.status(500).json({
      error: isDev ? (error.message || 'AI analysis failed') : 'Internal server error',
      ...(isDev && { detail: String(error?.stack || error).slice(0, 400) }),
    });
  }
});

// Celebrity Lookalike Analysis Endpoint (Secure)
router.post('/celebrity-lookalike', celebrityLimiter, requireAuth, celebrityDailyCap, fraudCheck('celebrity_scan'), validate(celebrityLookalikeSchema), async (req, res) => {
  const userId = req.user!.uid;
  const clientIp = (req as any)._fraud?.ip || req.ip || 'unknown';
  let creditDeducted = false;

  try {
    const { image } = req.body;

    const db = getAdminDb();
    if (!db) return res.status(500).json({ error: 'Database error' });

    // Preemptive risk gate: block high-risk users BEFORE burning AI credits
    const riskGate = await isHighRiskForExpensiveOp(userId);
    if (riskGate.blocked) {
      return res.status(403).json({ error: riskGate.reason, code: 'HIGH_RISK_BLOCKED' });
    }

    // Atomically deduct credit with ledger audit trail
    const userRef = db.collection('users').doc(userId);
    try {
      await deductCreditWithLedger(userId, 'celebrity_scan', { endpoint: 'celebrity-lookalike' }, clientIp);
      creditDeducted = true;
    } catch (txErr: any) {
      if (txErr.statusCode === 404) return res.status(404).json({ error: 'User not found' });
      if (txErr.statusCode === 403) return res.status(403).json({ error: 'Insufficient credits', code: txErr.code });
      throw txErr;
    }

    const apiKey = process.env.VERTEX_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Vertex AI API key not configured' });
    }

    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (image.startsWith('http')) {
      // SSRF protection: only allow Firebase Storage URLs
      const ALLOWED_URL_PATTERNS = [
        /^https:\/\/firebasestorage\.googleapis\.com\//,
        /^https:\/\/storage\.googleapis\.com\//,
      ];
      const isAllowed = ALLOWED_URL_PATTERNS.some(pattern => pattern.test(image));
      if (!isAllowed) {
        return res.status(400).json({ error: 'Only Firebase Storage image URLs are allowed' });
      }

      // Fetch image from URL (e.g. Firebase Storage for History Page)
      const imgRes = await fetch(image);
      if (!imgRes.ok) return res.status(400).json({ error: 'Failed to retrieve image from history URL' });
      const arrayBuffer = await imgRes.arrayBuffer();
      const rawB64 = Buffer.from(arrayBuffer).toString('base64');
      const rawMime = imgRes.headers.get('content-type') || 'image/jpeg';
      const compressed = await compressBase64Image(rawB64, rawMime);
      base64Data = compressed.base64;
      mimeType = compressed.mimeType;
    } else if (image.startsWith('blob:')) {
      return res.status(400).json({ error: 'Cannot process blob URLs directly on the server' });
    } else {
      // Parse data URL or raw base64
      const rawB64 = image.includes(',') ? image.split(',')[1] : image;
      const rawMime = image.includes('data:') ? image.split(';')[0].split(':')[1] : 'image/jpeg';
      const compressed = await compressBase64Image(rawB64, rawMime);
      base64Data = compressed.base64;
      mimeType = compressed.mimeType;
    }

    const resultText = await withRetry(() => callVertexAI(GEMINI_MODEL, apiKey, {
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            {
              text: `You are a world-class celebrity recognition and lookalike AI.
1. Identify the person or find 3 celebrity/model lookalikes.
2. For EACH lookalike, you MUST use Google Search to find a DIRECT image URL (ending in .jpg, .jpeg, or .png).
3. The image MUST be a high-quality, clear portrait or headshot suitable for a profile picture. Prefer images from Wikimedia Commons, Wikipedia, or official talent agency sites as they are most likely to allow hotlinking.
4. Do NOT provide links to search results or general webpages.
5. Provide a detailed 'reason' for the match based on specific facial features (eye shape, jawline, nose structure).

Respond ONLY with valid JSON in this format:
{
  "celebritySimilarity": [
    { "name": "Celebrity Name", "percentage": 85, "reason": "Detailed reason...", "imageUrl": "https://..." }
  ]
}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
      tools: [{ googleSearch: {} }]
    }), 2, 1000);

    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch (parseError) {
      console.error('Failed to parse celebrity response:', resultText);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    console.log('Celebrity lookalike analysis completed');

    // Store result for history
    if (parsed) {
      storeScanResult(userId, 'celebrity_' + Date.now(), 'celebrity', parsed).catch(() => {});
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Celebrity lookalike error:', error);
    // Refund the pre-deducted credit since the request failed (with ledger entry)
    if (creditDeducted) {
      await refundCreditWithLedger(userId, 'refund_ai_fail', { endpoint: 'celebrity-lookalike', error: error?.message });
    }
    return res.status(500).json({ error: error.message || 'Celebrity analysis failed' });
  }
});

// Sanitize context fields to prevent prompt injection
function sanitizeCoachField(val: unknown, maxLen = 200): string {
  if (val == null) return 'N/A';
  const s = typeof val === 'string' ? val : JSON.stringify(val);
  return s.replace(/[\r\n`${}]/g, ' ').slice(0, maxLen);
}

function buildCoachSystemPrompt(context: any): string {
  return `You are an expert facial aesthetics and looksmaxxing coach for Visage AI. 
    The user has just completed a facial analysis scan.
    
    USER DATA:
    - Overall Score: ${sanitizeCoachField(context?.overallScore, 10)}/10
    - Face Shape: ${sanitizeCoachField(context?.faceShape, 30)}
    - Strengths: ${sanitizeCoachField(context?.strengths)}
    - Weaknesses: ${sanitizeCoachField(context?.weaknesses)}
    - Potential Score: ${sanitizeCoachField(context?.potentialScore, 10)}
    - Recommended Improvements: ${sanitizeCoachField(context?.improvements)}
    
    GOAL:
    Provide specific, actionable, and encouraging advice to help the user improve their facial aesthetics. 
    Be scientific but approachable. Use terms like 'canthal tilt', 'fWHR', 'symmetry', and 'skin texture' where appropriate.
    Keep responses concise (under 100 words). If they ask for a routine, refer to their personalized roadmap.
    If they ask about surgery, be cautious and suggest non-invasive alternatives first.`;
}

// Glow-Up Coach Chat Endpoint — streaming SSE for live response
router.post('/glow-coach', coachLimiter, requireAuth, validate(glowCoachSchema), async (req, res) => {
  try {
    const { message, history, context } = req.body;

    const apiKey = process.env.VERTEX_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Vertex AI API key not configured' });
    }

    const systemInstruction = buildCoachSystemPrompt(context);

    const contents = [
      ...(history || []).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const url = vertexUrl(GEMINI_MODEL, true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let streamResponse;
    try {
      streamResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { temperature: 0.7 },
        }),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return res.status(504).json({ error: 'Coach request timed out' });
      }
      throw err;
    }

    if (!streamResponse.ok || !streamResponse.body) {
      clearTimeout(timeoutId);
      const errText = await streamResponse.text();
      console.error('Coach stream error:', streamResponse.status, errText);
      return res.status(500).json({ error: 'Coach failed to respond' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const reader = streamResponse.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Vertex AI SSE sends lines like "data: {json}\n\n"
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fullText += text;
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    } finally {
      clearTimeout(timeoutId);
      reader.releaseLock();
    }

    // Send final done event
    res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Glow coach error:', error);
    // If headers already sent (streaming started), just end
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    } else {
      return res.status(500).json({ error: error.message || 'Coach failed to respond' });
    }
  }
});

// Dev-only credit boost — completely disabled in production
if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
  const DEV_EMAILS = ['choxeliluka43@gmail.com', 'lukachoxeli918@gmail.com'];

  router.post('/dev/boost-credits', requireAuth, async (req: any, res) => {
    try {
      const uid = req.user?.uid;
      let userEmail = req.user?.email;
      const db = getAdminDb();
      if (!userEmail) {
        const snap = await db.collection('users').doc(uid).get();
        userEmail = snap.data()?.email;
      }
      console.log(`[dev/boost-credits] uid=${uid} email=${userEmail}`);
      if (!DEV_EMAILS.includes(userEmail)) {
        return res.status(403).json({ error: 'Not a dev account' });
      }
      await db.collection('users').doc(uid).update({ credits: 9999 });
      console.log(`[dev/boost-credits] Set 9999 credits for ${userEmail}`);
      return res.json({ ok: true, credits: 9999 });
    } catch (err: any) {
      console.error('[dev/boost-credits] error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });
}

export default router;
