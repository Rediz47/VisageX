import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getAdminDb } from '../services/firebase.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

const VERTEX_BASE = 'https://aiplatform.googleapis.com/v1/publishers/google/models';

// Rate limiters — per IP, returns JSON so frontend can handle gracefully
const analysisLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analysis requests. Please wait before trying again.', code: 'RATE_LIMITED' },
  skip: (req) => req.method === 'OPTIONS',
});

const celebrityLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many celebrity scan requests. Please wait before trying again.', code: 'RATE_LIMITED' },
  skip: (req) => req.method === 'OPTIONS',
});

const coachLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many coach requests. Please slow down.', code: 'RATE_LIMITED' },
  skip: (req) => req.method === 'OPTIONS',
});

// Retry helper: retries a function up to maxRetries times with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelayMs: number = 1000): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error.message || error);
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// Helper: call Vertex AI REST API directly (SDK doesn't support API key auth for Vertex)
async function callVertexAI(model: string, apiKey: string, requestBody: any): Promise<any> {
  const url = `${VERTEX_BASE}/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Vertex AI ${model} error (${response.status}):`, errorText);
    throw new Error(`Vertex AI returned ${response.status}: ${errorText}`);
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
router.post('/gemini-analysis', analysisLimiter, requireAuth, async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user!.uid;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const apiKey = process.env.VERTEX_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Vertex AI API key not configured' });
    }

    const db = getAdminDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    // Verify user has credits BEFORE processing
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentCredits = userSnap.data()?.credits || 0;
    if (currentCredits < 1) {
      return res.status(403).json({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' });
    }

    // Extract base64 data from data URL
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes('data:') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

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

Respond ONLY with valid JSON matching the exact keys listed above. No markdown, no explanation.`;

    try {
      // Retry the Vertex AI call up to 3 times to handle transient failures
      const resultText = await withRetry(() => callVertexAI('gemini-3.0-flash-preview', apiKey, {
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
        }
      }));

      let aiResult;
      try {
        aiResult = JSON.parse(resultText);
      } catch (parseError) {
        console.error('Failed to parse Vertex AI response:', resultText);
        return res.status(500).json({ error: 'Failed to parse AI response' });
      }

      console.log('Vertex AI analysis completed successfully for user', userId);

      // Deduct credit securely ONLY AFTER successful generation
      try {
        await userRef.update({ credits: FieldValue.increment(-1) });
      } catch (deductError) {
        console.error("Failed to deduct credit, user got a free generation:", deductError);
      }

      return res.json(aiResult);
    } catch (aiError) {
      console.error('Vertex AI call error:', aiError);
      return res.status(500).json({ error: 'AI analysis failed during processing' });
    }

  } catch (error: any) {
    console.error('Vertex AI analysis error:', error);
    return res.status(500).json({ error: error.message || 'AI analysis failed' });
  }
});

// Celebrity Lookalike Analysis Endpoint (Secure)
router.post('/celebrity-lookalike', celebrityLimiter, requireAuth, async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user!.uid;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const db = getAdminDb();
    if (!db) return res.status(500).json({ error: 'Database error' });

    // Verify credits
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const currentCredits = userSnap.data()?.credits || 0;

    if (currentCredits < 1) {
      return res.status(403).json({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' });
    }

    const apiKey = process.env.VERTEX_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Vertex AI API key not configured' });
    }

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes('data:') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

    const resultText = await callVertexAI('gemini-3.0-flash-preview', apiKey, {
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
      tools: [{ googleSearchRetrieval: {} }]
    });

    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch (parseError) {
      console.error('Failed to parse celebrity response:', resultText);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    console.log('Celebrity lookalike analysis completed');

    // Deduct credit after success
    try {
      await userRef.update({ credits: FieldValue.increment(-1) });
    } catch (err) {
      console.error('Failed to deduct celebrity credit:', err);
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Celebrity lookalike error:', error);
    return res.status(500).json({ error: error.message || 'Celebrity analysis failed' });
  }
});

// Glow-Up Coach Chat Endpoint (Secure)
router.post('/glow-coach', coachLimiter, requireAuth, async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const apiKey = process.env.VERTEX_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Vertex AI API key not configured' });
    }

    const systemInstruction = `You are an expert facial aesthetics and looksmaxxing coach for Visage AI. 
    The user has just completed a facial analysis scan.
    
    USER DATA:
    - Overall Score: ${context?.overallScore || 'N/A'}/10
    - Face Shape: ${context?.faceShape || 'Unknown'}
    - Strengths: ${context?.strengths || 'N/A'}
    - Weaknesses: ${context?.weaknesses || 'N/A'}
    - Potential Score: ${context?.potentialScore || 'N/A'}
    - Recommended Improvements: ${context?.improvements || 'N/A'}
    
    GOAL:
    Provide specific, actionable, and encouraging advice to help the user improve their facial aesthetics. 
    Be scientific but approachable. Use terms like 'canthal tilt', 'fWHR', 'symmetry', and 'skin texture' where appropriate.
    Keep responses concise (under 100 words). If they ask for a routine, refer to their personalized roadmap.
    If they ask about surgery, be cautious and suggest non-invasive alternatives first.`;

    const contents = [
      ...(history || []).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const resultText = await callVertexAI('gemini-3.0-flash-preview', apiKey, {
      contents,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.7,
      }
    });

    return res.json({ response: resultText });
  } catch (error: any) {
    console.error('Glow coach error:', error);
    return res.status(500).json({ error: error.message || 'Coach failed to respond' });
  }
});

export default router;
