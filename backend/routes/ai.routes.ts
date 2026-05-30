import { Router } from 'express';
import { createSharedRateLimiter, createDailyCap } from '../middleware/ratelimit.middleware.js';
import { getAdminDb } from '../services/firebase.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { compressBase64Image } from '../utils/image.js';
import {
  validate,
  geminiAnalysisSchema,
  celebrityLookalikeSchema,
  hairAnalysisSchema,
  glowCoachSchema
} from '../utils/validation.js';
import { deductCreditBestEffort } from '../services/ledger.service.js';
import { fraudCheck } from '../middleware/fraud.middleware.js';
import { checkScanSpike } from '../services/fraud.service.js';
import { hashImage, getCachedResult, storeScanResult } from '../services/scan.service.js';

const router = Router();

// Vertex AI configuration — project + region from env, falling back to firebase config defaults
const GCP_PROJECT = process.env.GCP_PROJECT || 'gen-lang-client-0376848339';
const GCP_REGION = process.env.GCP_REGION || 'us-central1';

// Build the correct endpoint URL for a given model + auth mode.
//
// We support three paths, picked automatically by `callVertexAI` based on the
// API key prefix and env flags:
//
//   1. **Gemini Developer API** — `generativelanguage.googleapis.com`.
//      Works with any `AIzaSy*` or `AQ.Ab*` key issued from Google AI Studio.
//      This is the default for local dev and the only one that reliably works
//      with the free API keys users get from https://aistudio.google.com/apikey.
//
//   2. **Vertex AI regional endpoint** — `${region}-aiplatform.googleapis.com/...`.
//      Requires an OAuth 2 access token from a service account. Enabled with
//      `VERTEX_USE_OAUTH=1`. Used in production on GCP where ADC is available.
//
// The old global `aiplatform.googleapis.com/v1beta1/publishers/...` endpoint
// no longer accepts API keys (returns 401 `ACCESS_TOKEN_TYPE_UNSUPPORTED`) and
// has been removed from the selector.
function vertexUrl(model: string, stream = false, useOAuth = false): string {
  if (useOAuth) {
    const action = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
    return `https://${GCP_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${GCP_REGION}/publishers/google/models/${model}:${action}`;
  }
  // Gemini Developer API — accepts API keys via `x-goog-api-key` header.
  const action = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}`;
}

const analysisLimiter = createSharedRateLimiter(
  5,
  '10 m',
  'Too many analysis requests. Please wait before trying again.'
);
const celebrityLimiter = createSharedRateLimiter(
  3,
  '10 m',
  'Too many celebrity scan requests. Please wait before trying again.'
);
const hairLimiter = createSharedRateLimiter(
  3,
  '10 m',
  'Too many hair analysis requests. Please wait before trying again.'
);
const coachLimiter = createSharedRateLimiter(
  20,
  '10 m',
  'Too many coach requests. Please slow down.'
);

// Daily caps: max scans per user per day (prevents runaway credit burn)
const analysisDailyCap = createDailyCap(50, 'Daily analysis limit reached. Try again tomorrow.');
const celebrityDailyCap = createDailyCap(
  30,
  'Daily celebrity scan limit reached. Try again tomorrow.'
);
const hairDailyCap = createDailyCap(30, 'Daily hair scan limit reached. Try again tomorrow.');

// Default model — override via GEMINI_MODEL env var if needed
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function lookupCelebrityPhoto(name: string): Promise<string> {
  const title = name.trim().replace(/\s+/g, '_');
  if (!title) return '';

  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      {
        headers: {
          'User-Agent': 'VisageX/1.0 celebrity-photo lookup'
        }
      }
    );

    if (!wikiRes.ok) return '';
    const data: any = await wikiRes.json();
    return data?.thumbnail?.source || data?.originalimage?.source || '';
  } catch {
    return '';
  }
}

router.get('/celebrity-photo', async (req, res) => {
  const name = String(req.query.name || '').trim();
  if (!name || name.length > 120) {
    return res.status(400).json({ error: 'Invalid celebrity name' });
  }

  try {
    const imageUrl = await lookupCelebrityPhoto(name);

    if (!imageUrl) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.json({ imageUrl });
  } catch {
    return res.status(502).json({ error: 'Photo lookup failed' });
  }
});

// Retry helper: retries transient failures with exponential backoff.
// Respects 429 retryDelay headers. Skips retries on permanent errors (401, 403).
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 2000
): Promise<T> {
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
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

function parseJsonObject(raw: string): any {
  const attempts: string[] = [];
  const trimmed = raw.trim();
  attempts.push(trimmed);

  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) attempts.push(fence[1].trim());

  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first !== -1 && last > first) {
    attempts.push(trimmed.slice(first, last + 1));
  }

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {
      /* try next candidate */
    }
  }

  throw new Error('JSON parse failed');
}

// Keep analysis responsive in both cloud and local dev.
// Netlify function budget is 26s. We use 24s here so the backend AbortController
// fires before the platform hard-kills the function, leaving 2s for the response
// to flush. Gemini 2.5 Flash vision analysis can take 20–40s on the long
// structured-JSON prompt, so 24s gives it the maximum possible time.
// Local dev has no platform cap — give Gemini a full 60s.
const AI_TIMEOUT_MS = process.env.NETLIFY ? 24000 : 60000;

// Helper: call the Gemini Developer API (or Vertex OAuth endpoint).
//
// Auth selection:
//  - `AIzaSy*` or `AQ.Ab*` key  → Gemini Developer API, `x-goog-api-key` header
//  - OAuth access token (other) → Vertex regional endpoint, `Authorization: Bearer`
//
// The `AQ.*` key format is issued by Google AI Studio and targets the Gemini
// Developer API (`generativelanguage.googleapis.com`). The Vertex endpoint
// rejects it with `ACCESS_TOKEN_TYPE_UNSUPPORTED`.
async function callVertexAI(model: string, apiKey: string, requestBody: any): Promise<any> {
  // Defensive cleanup: some .env parsers leave wrapping quotes, CR/LF, or stray
  // whitespace on the key. Any of these break both the prefix test AND the
  // remote auth check (Gemini then rejects it silently and the request hangs).
  const cleanKey = apiKey.replace(/[\s"'\r\n]/g, '');
  const isApiKey = cleanKey.startsWith('AIza') || cleanKey.startsWith('AQ.');
  const useOAuth = !isApiKey || process.env.VERTEX_USE_OAUTH === '1';
  const baseUrl = vertexUrl(model, false, useOAuth);
  const url = baseUrl;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (useOAuth) {
    headers['Authorization'] = `Bearer ${cleanKey}`;
  } else {
    headers['x-goog-api-key'] = cleanKey;
  }

  // One-shot diagnostic per request: which endpoint did we pick and why?
  console.log(
    `[Vertex] calling ${useOAuth ? 'OAuth/Vertex' : 'Gemini Dev API'} | model=${model} | keyPrefix=${cleanKey.slice(0, 5)} | keyLen=${cleanKey.length}`
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
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
    console.error(
      `[Vertex] ${model} → ${response.status} ${response.statusText}\nURL: ${baseUrl}\nBody: ${errorText.slice(0, 800)}`
    );

    // Parse retryDelay from 429 responses
    const err: any = new Error(`Gemini API returned ${response.status}: ${errorText}`);
    err.statusCode = response.status;
    if (response.status === 429) {
      try {
        const parsed = JSON.parse(errorText);
        const retryInfo = parsed?.error?.details?.find((d: any) =>
          d['@type']?.includes('RetryInfo')
        );
        if (retryInfo?.retryDelay) {
          const seconds = parseInt(retryInfo.retryDelay);
          if (!isNaN(seconds)) err.retryAfterMs = seconds * 1000;
        }
      } catch {
        /* ignore parse errors */
      }
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
//
// CREDIT-SAFE ORDERING (changed from the original deduct-first flow):
//   1. Verify Vertex API key present, DB optional.
//   2. Soft credit check (best-effort read) — returns 403 only when we can prove
//      the user has 0 credits; if Firestore read fails we fail open and rely on
//      the Redis-backed rate limiter + daily cap to bound free-scan abuse.
//   3. Compress the image and consult the scan cache.
//   4. Call Vertex AI. If it fails, no credit is deducted and a full error is
//      surfaced (in dev the response also includes status + body preview).
//   5. Only AFTER a parseable AI result, attempt the transactional deduct via
//      `deductCreditBestEffort`. On transient Firestore failures the deduct is
//      queued in `pending_deducts` for later reconciliation — the user still
//      gets their result. On INSUFFICIENT_CREDITS/USER_NOT_FOUND we log and
//      still return the result (the request already passed the soft check).
router.post(
  '/gemini-analysis',
  analysisLimiter,
  requireAuth,
  analysisDailyCap,
  fraudCheck('analyze', { strict: true }),
  validate(geminiAnalysisSchema),
  async (req, res) => {
    const userId = req.user!.uid;
    const clientIp = (req as any)._fraud?.ip || req.ip || 'unknown';
    const isDev = process.env.NODE_ENV !== 'production' && !process.env.NETLIFY;

    try {
      const { image } = req.body;

      const apiKey = process.env.VERTEX_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Vertex AI API key not configured' });
      }

      const db = getAdminDb(); // may be null — cache/deduct below handle missing DB gracefully

      // Check for scan spike (fraud detection). Failsafe-open on Firestore error.
      const { spikeDetected } = await checkScanSpike(userId);
      if (spikeDetected) {
        return res
          .status(429)
          .json({ error: 'Unusual activity detected. Please slow down.', code: 'SPIKE_DETECTED' });
      }

      // Soft credit check: only reject when we can prove credits < 1. On quota /
      // network failure we log and proceed — Redis rate limiter (5/10min) + daily
      // cap (50/day) bound worst-case free usage.
      if (db) {
        try {
          const snap = await db.collection('users').doc(userId).get();
          if (!snap.exists) {
            return res.status(404).json({ error: 'User not found' });
          }
          const currentCredits = snap.data()?.credits ?? 0;
          if (currentCredits < 1) {
            return res
              .status(403)
              .json({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' });
          }
        } catch (readErr: any) {
          console.warn(
            '[gemini-analysis] Soft credit check failed (continuing):',
            readErr?.message || readErr
          );
        }
      }

      // Extract base64 data from data URL
      const rawBase64 = image.includes(',') ? image.split(',')[1] : image;
      const rawMimeType = image.includes('data:')
        ? image.split(';')[0].split(':')[1]
        : 'image/jpeg';

      // Compress image before sending to Vertex AI (resize to 768px, JPEG 80%)
      const { base64: base64Data, mimeType } = await compressBase64Image(rawBase64, rawMimeType);

      // Check cache: same user + same image → return cached result.
      // Credit is still deducted (policy: every analysis request costs one credit,
      // even when the AI call is skipped thanks to the cache).
      const imageFingerprint = hashImage(base64Data);
      const cached = await getCachedResult(userId, imageFingerprint, 'analysis');
      if (cached) {
        deductCreditBestEffort(
          userId,
          'analyze',
          { endpoint: 'gemini-analysis', cached: true },
          clientIp,
          req.user?.email
        )
          .then((outcome) => {
            if (outcome.success) return;
            if (outcome.statusCode === 403) {
              console.warn(
                `[gemini-analysis][cache] Deduct refused (INSUFFICIENT_CREDITS) for ${userId}.`
              );
            } else if (outcome.deferred) {
              console.warn(
                `[gemini-analysis][cache] Deduct queued in pending_deducts for ${userId}: ${outcome.error}`
              );
            } else {
              console.error(`[gemini-analysis][cache] Deduct lost for ${userId}:`, outcome.error);
            }
          })
          .catch((err) => console.error('[gemini-analysis][cache] Deduct unexpected error:', err));
        return res.json(cached);
      }

      const prompt = `You are an expert aesthetic photography analyst and visual consultant. Analyze this face photo from a purely visual and compositional perspective.

Rate each metric on a scale of 1.0 to 10.0 (one decimal place). Be honest and accurate — do NOT inflate scores.

Analyze:
1. **Surface Quality** (overall_skin_score): Visual clarity, pore visibility, evenness of tone
2. **Surface Clarity** (acne_presence): 10 = very clear surface, 1 = noticeably textured surface
3. **Texture Smoothness** (wrinkle_visibility): 10 = very smooth appearance, 1 = visibly textured
4. **Texture Uniformity** (skin_texture): Smoothness and uniformity of visible surface
5. **Under-Eye Clarity** (dark_circles): 10 = clear under-eye area, 1 = heavily shadowed
6. **Tone Evenness** (redness): 10 = even tone, 1 = noticeably uneven or flushed
7. **Luminance Balance** (oiliness): 10 = balanced matte finish, 1 = high shine
8. **Surface Quality Score** (skin_quality): Combined visual surface quality rating
9. **Grooming** (grooming): Eyebrow grooming, facial hair maintenance
10. **Cheekbone Prominence** (cheekbone_prominence): How defined are the cheekbones
11. **Overall Aesthetics Score** (overall_aesthetics_score): Overall visual harmony rating considering all features

Also provide:
- **Face Shape** (faceShape): One of: oval, round, square, heart, oblong, diamond, triangle
- **Color Season** (color_season): One of: Spring, Summer, Autumn, Winter (based on visible coloring, hair, features)
- **Surface Analysis** (skinAnalysis): 2-3 sentence visual surface assessment based on what is visible in the photo
- **Aesthetics Analysis** (aestheticsAnalysis): 2-3 sentence facial aesthetics assessment
- **Potential Score** (potentialScore): What score this person could reach with improvements (must be higher than overall_aesthetics_score)
- **Visual Strengths** (visualStrengths): Array of 2-4 specific visual strengths observed
- **Visual Weaknesses** (visualWeaknesses): Array of 1-3 areas for visual improvement
- **Improvements** (improvements): Array of 3-5 specific, actionable improvement suggestions
- **Hair Recommendations** (hairRecommendations): Array of 2-3 hair style objects, each with a 'styleName' and 'reason'. These MUST be realistic for the person in the image. Infer visible hair length, current haircut, hairline, hair density, gender presentation, and face shape before recommending. Do NOT suggest ponytails, bobs, waves, or long-hair styles unless the person clearly has long enough hair and that presentation fits the image. For masculine/short-hair presentation, recommend barber-relevant cuts only (e.g. textured crop, low/mid taper, side part, fringe, crew cut, quiff) and explain using this person's actual forehead, jaw, cheekbones, and face shape. Avoid generic face-shape advice.
- **Recommended Products** (recommendedProducts): Array of 3-5 product recommendations, each with "name", "category", and "reason"
- **Insight Descriptions** (insightDescriptions): A JSON object where each key is EXACTLY one of the strings from visualStrengths or visualWeaknesses, and each value is a 2-sentence description. Sentence 1: explain the aesthetic reason WHY this feature matters. Sentence 2: for strengths, describe the visual advantage; for weaknesses, give one specific actionable fix.
- **Improvement Plan** (improvementPlan): An array of 6-10 realistic, evidence-based improvement steps ordered easiest-to-hardest. Use simple everyday language a normal person understands. Be conservative and truthful. Only recommend an item if it is supported by visible evidence in THIS image or by measured geometry from the analysis context. Prefer grooming, haircut, sleep, posture, lighting/photo habits, basic skincare, and non-medical routines. Do NOT invent problems like tear-trough hollowing, nasal tip issues, chin deficiency, or surgery unless they are clearly visible and important. Each object must have:
  - "title": Short simple name (e.g. "Use Sunscreen Daily", "Clean Up Eyebrows", "Get a Low Taper Haircut", "Simple Night Skincare"). Avoid dramatic procedure names unless truly justified.
  - "category": EXACTLY one of "Foundational", "Non-Invasive", "Minimally Invasive", "Surgical"
  - "difficulty": Integer 1-5 (1=daily habit/grooming, 2=lifestyle/skincare, 3=professional non-invasive treatment, 4=minor optional procedure, 5=major surgery)
  - "description": 1 short sentence in simple words
  - "details": 2 short sentences explaining exactly what to do and why. Avoid jargon.
  - "expectedImpact": Simple realistic impact (e.g. "Cleaner look", "Healthier-looking skin", "Sharper face framing")
  - "costRange": Simple realistic cost (e.g. "$10–30", "$25–60/month", "$30–80 haircut")
  - "timeframe": Simple timeframe (e.g. "1–2 weeks", "4–8 weeks", "Same day")
  - "recovery": Simple recovery or null
  - "targetAreas": Array of 1-3 simple areas (e.g. "skin", "hair", "eyebrows", "under eyes", "jawline")
  CATEGORY RULES: Most items should be "Foundational" or "Non-Invasive". Include "Minimally Invasive" only if clearly justified by a visible issue. Include "Surgical" only for severe, obvious structural imbalance; otherwise include zero surgical items. Never force a category mix. Order easiest-first. Do NOT give generic filler advice — every item must feel custom and plausible.

Respond ONLY with valid JSON matching the exact keys listed above. No markdown, no explanation.`;

      // ── Vertex AI call ──────────────────────────────────────────────────────
      // No credit has been deducted yet. A failure here returns 5xx and the user
      // is never charged. The dev error payload includes status + preview so the
      // real Vertex error surfaces in the browser console.
      let resultText: string;
      try {
        resultText = await withRetry(
          () =>
            callVertexAI(GEMINI_MODEL, apiKey, {
              contents: [
                {
                  role: 'user',
                  parts: [{ inlineData: { data: base64Data, mimeType } }, { text: prompt }]
                }
              ],
              generationConfig: {
                temperature: 0.3,
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 0 },
                maxOutputTokens: 8192
              }
            }),
          3,
          1500
        );
      } catch (aiError: any) {
        console.error('Vertex AI call error:', aiError);
        return res.status(502).json({
          error: 'AI analysis failed during processing',
          ...(isDev && {
            detail: aiError?.message || String(aiError),
            statusCode: aiError?.statusCode
          })
        });
      }

      let aiResult: any;
      try {
        aiResult = parseJsonObject(resultText);
      } catch (parseError: any) {
        console.error('Failed to parse Vertex AI response:', resultText?.slice(0, 1000));
        return res.status(502).json({
          error: 'Failed to parse AI response',
          detail: parseError?.message || 'JSON parse failed',
          preview: (resultText || '').slice(0, 240)
        });
      }

      console.log('Vertex AI analysis completed successfully for user', userId);

      const deductOutcome = await deductCreditBestEffort(
        userId,
        'analyze',
        { endpoint: 'gemini-analysis' },
        clientIp,
        req.user?.email
      );

      if (!deductOutcome.success) {
        if (deductOutcome.statusCode === 403) {
          return res
            .status(403)
            .json({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' });
        }

        if (deductOutcome.deferred) {
          console.warn(
            `[gemini-analysis] Deduct queued in pending_deducts for ${userId}: ${deductOutcome.error}`
          );
        } else {
          console.error(`[gemini-analysis] Deduct lost for ${userId}:`, deductOutcome.error);
        }
      }

      storeScanResult(userId, imageFingerprint, 'analysis', aiResult).catch(() => {});

      return res.json({
        ...aiResult,
        creditsDeducted: deductOutcome.success,
        newBalance: deductOutcome.newBalance
      });
    } catch (error: any) {
      console.error('Vertex AI analysis error:', error);
      return res.status(500).json({
        error: isDev ? error.message || 'AI analysis failed' : 'Internal server error',
        ...(isDev && { detail: String(error?.stack || error).slice(0, 400) })
      });
    }
  }
);

// Celebrity Lookalike Analysis Endpoint (Secure)
// Same credit-safe flow as /gemini-analysis: Vertex first, deduct on success.
router.post(
  '/celebrity-lookalike',
  celebrityLimiter,
  requireAuth,
  celebrityDailyCap,
  fraudCheck('celebrity_scan', { strict: true }),
  validate(celebrityLookalikeSchema),
  async (req, res) => {
    const userId = req.user!.uid;
    const clientIp = (req as any)._fraud?.ip || req.ip || 'unknown';
    const isDev = process.env.NODE_ENV !== 'production' && !process.env.NETLIFY;

    try {
      const { image } = req.body;

      const apiKey = process.env.VERTEX_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Vertex AI API key not configured' });
      }

      const db = getAdminDb();

      // Soft credit check — same failsafe-open semantics as gemini-analysis.
      if (db) {
        try {
          const snap = await db.collection('users').doc(userId).get();
          if (!snap.exists) return res.status(404).json({ error: 'User not found' });
          if ((snap.data()?.credits ?? 0) < 1) {
            return res
              .status(403)
              .json({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' });
          }
        } catch (readErr: any) {
          console.warn(
            '[celebrity-lookalike] Soft credit check failed (continuing):',
            readErr?.message || readErr
          );
        }
      }

      // Resolve image into base64.
      let base64Data = '';
      let mimeType = 'image/jpeg';

      if (image.startsWith('http')) {
        // SSRF protection: only allow Firebase Storage URLs
        const ALLOWED_URL_PATTERNS = [
          /^https:\/\/firebasestorage\.googleapis\.com\//,
          /^https:\/\/storage\.googleapis\.com\//
        ];
        const isAllowed = ALLOWED_URL_PATTERNS.some((pattern) => pattern.test(image));
        if (!isAllowed) {
          return res.status(400).json({ error: 'Only Firebase Storage image URLs are allowed' });
        }

        const imgRes = await fetch(image);
        if (!imgRes.ok)
          return res.status(400).json({ error: 'Failed to retrieve image from history URL' });
        const arrayBuffer = await imgRes.arrayBuffer();
        const rawB64 = Buffer.from(arrayBuffer).toString('base64');
        const rawMime = imgRes.headers.get('content-type') || 'image/jpeg';
        const compressed = await compressBase64Image(rawB64, rawMime);
        base64Data = compressed.base64;
        mimeType = compressed.mimeType;
      } else if (image.startsWith('blob:')) {
        return res.status(400).json({ error: 'Cannot process blob URLs directly on the server' });
      } else {
        const rawB64 = image.includes(',') ? image.split(',')[1] : image;
        const rawMime = image.includes('data:') ? image.split(';')[0].split(':')[1] : 'image/jpeg';
        const compressed = await compressBase64Image(rawB64, rawMime);
        base64Data = compressed.base64;
        mimeType = compressed.mimeType;
      }

      // ── Vertex call (no credit spent yet) ──────────────────────────────────
      let resultText: string;
      try {
        resultText = await withRetry(
          () =>
            callVertexAI(GEMINI_MODEL, apiKey, {
              contents: [
                {
                  role: 'user',
                  parts: [
                    { inlineData: { data: base64Data, mimeType } },
                    {
                      text: `You are a facial-similarity analyst for a celebrity lookalike feature. Your job is NOT identity recognition. Compare visible facial structure and choose realistic public-figure lookalikes.

Rules:
- Return exactly 5 public figures, ranked best to weakest.
- Prefer globally recognizable actors, models, musicians, athletes, or creators with public photos.
- Match by stable facial geometry: face shape, cheekbones, jaw width/angle, eye shape/spacing, brow area, nose bridge/tip, lips, chin, facial proportions.
- Do not overfit to hair, makeup, lighting, pose, expression, skin tone, ethnicity, age, or photo style.
- If uncertain, lower the percentage instead of forcing a high score.
- Keep scores realistic: 88-93 = rare very strong match, 78-87 = strong resemblance, 65-77 = moderate resemblance, 55-64 = loose resemblance.
- Do not invent image URLs. Always set imageUrl to an empty string.
- Reasons must sound natural and specific, not generic hype.

For each match provide:
- "name": Full public figure name
- "percentage": integer similarity percentage from 55 to 93
- "reason": 1-2 plain-English sentences explaining the shared visible facial features
- "imageUrl": always ""

Respond ONLY with valid JSON in this exact shape:
{
  "celebritySimilarity": [
    { "name": "Celebrity Name", "percentage": 82, "reason": "Specific feature-based reason.", "imageUrl": "" }
  ]
}`
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.4,
                responseMimeType: 'application/json',
                maxOutputTokens: 2048
              }
            }),
          2,
          1000
        );
      } catch (aiError: any) {
        console.error(
          'Celebrity lookalike Vertex error:',
          aiError?.message || aiError,
          '| status:',
          aiError?.statusCode
        );
        return res.status(502).json({
          error: 'Celebrity analysis failed',
          ...(isDev && {
            detail: aiError?.message || String(aiError),
            statusCode: aiError?.statusCode
          })
        });
      }

      let parsed: any;
      try {
        parsed = JSON.parse(resultText);
      } catch {
        // Fallback: strip markdown fences / prose and extract JSON object
        try {
          let t = resultText.trim();
          const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
          if (fence) t = fence[1].trim();
          const first = t.indexOf('{');
          const last = t.lastIndexOf('}');
          if (first !== -1 && last > first) t = t.slice(first, last + 1);
          parsed = JSON.parse(t);
        } catch (parseError: any) {
          console.error('Failed to parse celebrity response:', resultText?.slice(0, 1000));
          return res.status(502).json({
            error: 'Failed to parse AI response',
            detail: parseError?.message,
            preview: (resultText || '').slice(0, 240)
          });
        }
      }

      const rawMatches = Array.isArray(parsed?.celebritySimilarity)
        ? parsed.celebritySimilarity
        : [];
      const seenNames = new Set<string>();
      const celebritySimilarity = await Promise.all(
        rawMatches
          .map((match: any) => ({
            name: String(match?.name || '').trim(),
            percentage: Math.round(Number(match?.percentage || 0)),
            reason: String(match?.reason || '').trim()
          }))
          .filter((match: any) => {
            if (!match.name || !match.reason) return false;
            const key = match.name.toLowerCase();
            if (seenNames.has(key)) return false;
            seenNames.add(key);
            return true;
          })
          .slice(0, 5)
          .map(async (match: any, index: number) => {
            const boundedScore = Math.max(55, Math.min(93, match.percentage || 65));
            const photoUrl = await lookupCelebrityPhoto(match.name);

            return {
              name: match.name,
              percentage: Math.max(55, Math.min(93, boundedScore - Math.max(0, index - 1))),
              reason: match.reason,
              imageUrl: photoUrl
            };
          })
      );

      parsed = { celebritySimilarity };

      console.log('Celebrity lookalike analysis completed for user', userId);

      // ── Post-success side effects ──────────────────────────────────────────
      if (parsed) {
        storeScanResult(userId, 'celebrity_' + Date.now(), 'celebrity', parsed).catch(() => {});
      }

      deductCreditBestEffort(
        userId,
        'celebrity_scan',
        { endpoint: 'celebrity-lookalike' },
        clientIp,
        req.user?.email
      )
        .then((outcome) => {
          if (outcome.success) return;
          if (outcome.statusCode === 403) {
            console.warn(
              `[celebrity-lookalike] Post-success deduct refused (INSUFFICIENT_CREDITS) for ${userId}.`
            );
          } else if (outcome.deferred) {
            console.warn(
              `[celebrity-lookalike] Deduct queued in pending_deducts for ${userId}: ${outcome.error}`
            );
          } else {
            console.error(`[celebrity-lookalike] Deduct lost for ${userId}:`, outcome.error);
          }
        })
        .catch((err) => console.error('[celebrity-lookalike] Deduct unexpected error:', err));

      return res.json(parsed);
    } catch (error: any) {
      console.error('Celebrity lookalike error:', error);
      return res.status(500).json({
        error: isDev ? error.message || 'Celebrity analysis failed' : 'Internal server error'
      });
    }
  }
);

// Hair Analysis Endpoint (Secure)
// Same credit-safe flow as /celebrity-lookalike: Vertex first, deduct on success.
router.post(
  '/hair-analysis',
  hairLimiter,
  requireAuth,
  hairDailyCap,
  fraudCheck('hair_scan', { strict: true }),
  validate(hairAnalysisSchema),
  async (req, res) => {
    const userId = req.user!.uid;
    const clientIp = (req as any)._fraud?.ip || req.ip || 'unknown';
    const isDev = process.env.NODE_ENV !== 'production' && !process.env.NETLIFY;

    try {
      const { image } = req.body;

      const apiKey = process.env.VERTEX_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Vertex AI API key not configured' });
      }

      const db = getAdminDb();

      // Soft credit check
      if (db) {
        try {
          const snap = await db.collection('users').doc(userId).get();
          if (!snap.exists) return res.status(404).json({ error: 'User not found' });
          if ((snap.data()?.credits ?? 0) < 1) {
            return res
              .status(403)
              .json({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' });
          }
        } catch (readErr: any) {
          console.warn(
            '[hair-analysis] Soft credit check failed (continuing):',
            readErr?.message || readErr
          );
        }
      }

      // Resolve image to base64
      let base64Data = '';
      let mimeType = 'image/jpeg';

      if (image.startsWith('http')) {
        const ALLOWED_URL_PATTERNS = [
          /^https:\/\/firebasestorage\.googleapis\.com\//,
          /^https:\/\/storage\.googleapis\.com\//
        ];
        const isAllowed = ALLOWED_URL_PATTERNS.some((pattern) => pattern.test(image));
        if (!isAllowed) {
          return res.status(400).json({ error: 'Only Firebase Storage image URLs are allowed' });
        }
        const imgRes = await fetch(image);
        if (!imgRes.ok)
          return res.status(400).json({ error: 'Failed to retrieve image from history URL' });
        const arrayBuffer = await imgRes.arrayBuffer();
        const rawB64 = Buffer.from(arrayBuffer).toString('base64');
        const rawMime = imgRes.headers.get('content-type') || 'image/jpeg';
        const compressed = await compressBase64Image(rawB64, rawMime);
        base64Data = compressed.base64;
        mimeType = compressed.mimeType;
      } else if (image.startsWith('blob:')) {
        return res.status(400).json({ error: 'Cannot process blob URLs directly on the server' });
      } else {
        const rawB64 = image.includes(',') ? image.split(',')[1] : image;
        const rawMime = image.includes('data:') ? image.split(';')[0].split(':')[1] : 'image/jpeg';
        const compressed = await compressBase64Image(rawB64, rawMime);
        base64Data = compressed.base64;
        mimeType = compressed.mimeType;
      }

      // ── Vertex call (no credit spent yet) ──────────────────────────────────
      let resultText: string;
      try {
        resultText = await withRetry(
          () =>
            callVertexAI(GEMINI_MODEL, apiKey, {
              contents: [
                {
                  role: 'user',
                  parts: [
                    { inlineData: { data: base64Data, mimeType } },
                    {
                      text: `You are a practical hair stylist. Analyze only the visible hair in this photo and provide a simple, honest assessment.

Evaluate the following based ONLY on what is clearly visible:
- Hair type (Straight / Wavy / Curly / Coily) — pick ONE
- Texture (Fine / Medium / Coarse) — pick ONE
- Density (Thin / Medium / Thick) — pick ONE
- Condition (Healthy / Dry / Oily / Damaged / Mixed) — pick ONE
- Hairline shape (Straight / Rounded / Widow's Peak / M-shaped / Receding / Uneven)
- Visual hair condition label only. Do not treat this as medical health.
- 2-3 simple things that look good
- 1-2 simple things to watch
- 3 recommended hairstyles that would complement THIS person's face shape and hair characteristics
- 5 simple care-routine tips tailored to this visible hair. Use everyday words.

Avoid clinical or fake-scientific wording. Do not mention cuticles, scalp diagnosis, follicle health, medical hair loss, or exact biological health unless clearly visible. Do not overclaim. The output should feel like a helpful barber/stylist, not a doctor.

If hair is not clearly visible (covered by hat, cropped, very low quality), set "visible" to false and only return the visibility flag with a short reason.

Respond ONLY with valid JSON in this exact format:
{
  "visible": true,
  "hairType": "Wavy",
  "texture": "Medium",
  "density": "Medium",
  "condition": "Healthy",
  "hairlineShape": "Rounded",
  "strengths": ["...", "..."],
  "concerns": ["...", "..."],
  "recommendedStyles": [
    { "name": "Textured Crop", "why": "Complements wavy texture and balances facial proportions" }
  ],
  "careRoutine": [
    { "title": "Wash 2-3x weekly", "detail": "Use a sulfate-free shampoo to preserve natural oils." }
  ]
}`
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.4,
                responseMimeType: 'application/json',
                maxOutputTokens: 2048
              }
            }),
          2,
          1000
        );
      } catch (aiError: any) {
        console.error(
          'Hair analysis Vertex error:',
          aiError?.message || aiError,
          '| status:',
          aiError?.statusCode
        );
        return res.status(502).json({
          error: 'Hair analysis failed',
          ...(isDev && {
            detail: aiError?.message || String(aiError),
            statusCode: aiError?.statusCode
          })
        });
      }

      let parsed: any;
      try {
        parsed = JSON.parse(resultText);
      } catch {
        try {
          let t = resultText.trim();
          const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
          if (fence) t = fence[1].trim();
          const first = t.indexOf('{');
          const last = t.lastIndexOf('}');
          if (first !== -1 && last > first) t = t.slice(first, last + 1);
          parsed = JSON.parse(t);
        } catch (parseError: any) {
          console.error('Failed to parse hair response:', resultText?.slice(0, 1000));
          return res.status(502).json({
            error: 'Failed to parse AI response',
            detail: parseError?.message,
            preview: (resultText || '').slice(0, 240)
          });
        }
      }

      // If hair not visible, return without charging credits
      if (parsed?.visible === false) {
        return res
          .status(200)
          .json({ ...parsed, error: 'Hair not clearly visible in this photo.' });
      }

      console.log('Hair analysis completed for user', userId);

      // ── Post-success side effects ──────────────────────────────────────────
      storeScanResult(userId, 'hair_' + Date.now(), 'hair', parsed).catch(() => {});

      deductCreditBestEffort(
        userId,
        'hair_scan',
        { endpoint: 'hair-analysis' },
        clientIp,
        req.user?.email
      )
        .then((outcome) => {
          if (outcome.success) return;
          if (outcome.statusCode === 403) {
            console.warn(
              `[hair-analysis] Post-success deduct refused (INSUFFICIENT_CREDITS) for ${userId}.`
            );
          } else if (outcome.deferred) {
            console.warn(
              `[hair-analysis] Deduct queued in pending_deducts for ${userId}: ${outcome.error}`
            );
          } else {
            console.error(`[hair-analysis] Deduct lost for ${userId}:`, outcome.error);
          }
        })
        .catch((err) => console.error('[hair-analysis] Deduct unexpected error:', err));

      return res.json(parsed);
    } catch (error: any) {
      console.error('Hair analysis error:', error);
      return res.status(500).json({
        error: isDev ? error.message || 'Hair analysis failed' : 'Internal server error'
      });
    }
  }
);

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
router.post(
  '/glow-coach',
  coachLimiter,
  requireAuth,
  validate(glowCoachSchema),
  async (req, res) => {
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
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { temperature: 0.7 }
          }),
          signal: controller.signal
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
            } catch {
              /* skip malformed chunks */
            }
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
  }
);

// Dev-only credit boost — completely disabled in production
if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
  const DEV_EMAILS = new Set(
    (process.env.DEV_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );

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
      if (!DEV_EMAILS.has(String(userEmail || '').toLowerCase())) {
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
