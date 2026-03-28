import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { getAdminDb } from '../services/firebase.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// Secure AI Skin & Aesthetics Analysis Endpoint
router.post('/gemini-analysis', requireAuth, async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user!.uid;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
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


    const ai = new GoogleGenAI({ apiKey });

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
- **Recommended Products** (recommendedProducts): Array of 3-5 product recommendations, each with "name", "category", and "reason"`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: prompt }
            ]
          }
        ],
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overall_skin_score: { type: Type.NUMBER },
              acne_presence: { type: Type.NUMBER },
              wrinkle_visibility: { type: Type.NUMBER },
              skin_texture: { type: Type.NUMBER },
              dark_circles: { type: Type.NUMBER },
              redness: { type: Type.NUMBER },
              oiliness: { type: Type.NUMBER },
              skin_quality: { type: Type.NUMBER },
              grooming: { type: Type.NUMBER },
              cheekbone_prominence: { type: Type.NUMBER },
              overall_aesthetics_score: { type: Type.NUMBER },
              faceShape: { type: Type.STRING },
              color_season: { type: Type.STRING },
              skinAnalysis: { type: Type.STRING },
              aestheticsAnalysis: { type: Type.STRING },
              potentialScore: { type: Type.NUMBER },
              visualStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              visualWeaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              hairRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    styleName: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  }
                }
              },
              recommendedProducts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  }
                }
              }
            },
            required: [
              'overall_skin_score', 'skin_quality', 'acne_presence', 'wrinkle_visibility',
              'skin_texture', 'dark_circles', 'redness', 'oiliness', 'grooming',
              'cheekbone_prominence', 'overall_aesthetics_score', 'faceShape',
              'color_season', 'skinAnalysis', 'aestheticsAnalysis', 'potentialScore',
              'visualStrengths', 'visualWeaknesses', 'improvements', 'hairRecommendations',
              'recommendedProducts'
            ]
          }
        }
      });

      const resultText = response.text || '{}';
      let geminiResult;
      try {
        geminiResult = JSON.parse(resultText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', resultText);
        return res.status(500).json({ error: 'Failed to parse AI response' });
      }

      console.log('Gemini analysis completed successfully for user', userId);

      // OPTION A: Deduct credit securely ONLY AFTER successful generation
      try {
        await userRef.update({ credits: FieldValue.increment(-1) });
      } catch (deductError) {
        console.error("Failed to deduct credit, user got a free generation:", deductError);
      }

      return res.json(geminiResult);
    } catch (aiError) {
      console.error('Gemini API call error:', aiError);
      return res.status(500).json({ error: 'AI analysis failed during processing' });
    }

  } catch (error: any) {
    console.error('Gemini analysis error:', error);
    return res.status(500).json({ error: error.message || 'AI analysis failed' });
  }
});

// Celebrity Lookalike Analysis Endpoint (Secure)
router.post('/celebrity-lookalike', requireAuth, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes('data:') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
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
5. Provide a detailed 'reason' for the match based on specific facial features (eye shape, jawline, nose structure).`
            }
          ]
        }
      ],
      config: {
        temperature: 0.3,
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            celebritySimilarity: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                  imageUrl: { type: Type.STRING }
                }
              }
            }
          },
          required: ['celebritySimilarity']
        }
      }
    });

    const resultText = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch (parseError) {
      console.error('Failed to parse celebrity response:', resultText);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    console.log('Celebrity lookalike analysis completed');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Celebrity lookalike error:', error);
    return res.status(500).json({ error: error.message || 'Celebrity analysis failed' });
  }
});

// Glow-Up Coach Chat Endpoint (Secure)
router.post('/glow-coach', requireAuth, async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview';

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

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: 'low' as any }
      }
    });

    const aiText = response.text || "I'm sorry, I couldn't process that. Could you try rephrasing?";
    return res.json({ response: aiText });
  } catch (error: any) {
    console.error('Glow coach error:', error);
    return res.status(500).json({ error: error.message || 'Coach failed to respond' });
  }
});

export default router;
