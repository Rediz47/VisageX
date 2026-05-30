import { useState } from 'react';
import { auth } from '../../../firebase';
import { AnalysisResult, Landmark, SaveStatus } from '../types';
import { getCaptchaToken } from '../../../lib/captcha';

export function useAnalysis(userCredits: number) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);

  const analyzeImageServerSide = async (
    landmarks: Landmark[],
    croppedImageBase64: string
  ): Promise<AnalysisResult> => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landmarks, image: croppedImageBase64 })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze face on the server.');
    }
    return await response.json();
  };

  const getGeminiAnalysis = async (
    croppedImageBase64: string,
    currentAnalysis: AnalysisResult
  ): Promise<AnalysisResult> => {
    if (!auth.currentUser || userCredits <= 0) {
      console.log('Skipping premium AI analysis due to missing auth or credits.');
      return currentAnalysis;
    }

    const MAX_RETRIES = 2;
    const GEMINI_TIMEOUT_MS = 220000;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const idToken = await auth.currentUser!.getIdToken(false);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        };
        const captchaToken = getCaptchaToken();
        if (captchaToken) headers['x-captcha-token'] = captchaToken;

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
        const aiResponse = await fetch('/api/gemini-analysis', {
          method: 'POST',
          headers,
          body: JSON.stringify({ image: croppedImageBase64 }),
          signal: controller.signal
        }).finally(() => {
          window.clearTimeout(timeoutId);
        });

        if (aiResponse.status === 403) {
          console.warn('Insufficient credits for AI analysis.');
          return currentAnalysis;
        }

        if (!aiResponse.ok) {
          // Parse backend error payload so the real reason (missing key, Vertex 429, parse failure, etc.) is visible.
          let backendDetail = '';
          try {
            const errBody = await aiResponse.json();
            backendDetail = [
              errBody?.error,
              errBody?.detail,
              errBody?.statusCode ? `vertex:${errBody.statusCode}` : null
            ]
              .filter(Boolean)
              .join(' — ');
          } catch {
            try {
              backendDetail = (await aiResponse.text()).slice(0, 300);
            } catch {
              /* noop */
            }
          }
          console.error(`[Gemini] ${aiResponse.status} from /api/gemini-analysis:`, backendDetail);
          const error: any = new Error(
            `AI analysis failed (status ${aiResponse.status})${backendDetail ? ': ' + backendDetail : ''}`
          );
          error.statusCode = aiResponse.status;
          throw error;
        }

        const geminiData = await aiResponse.json();
        if (geminiData && typeof geminiData.skin_quality === 'number') {
          const aiAesthetics = geminiData.overall_aesthetics_score || currentAnalysis.overallScore;
          const geometryScore = currentAnalysis.overallScore;
          const aiWeight = 0.5;
          const newOverallScore = geometryScore * (1 - aiWeight) + aiAesthetics * aiWeight;

          currentAnalysis.structuralScore = Number(geometryScore.toFixed(1));
          currentAnalysis.visualScore = Number(aiAesthetics.toFixed(1));

          if (!isNaN(newOverallScore)) {
            currentAnalysis.overallScore = Number(newOverallScore.toFixed(1));
          }

          if (geminiData.potentialScore <= currentAnalysis.overallScore) {
            geminiData.potentialScore = Math.min(10, currentAnalysis.overallScore + 0.5);
          }
          currentAnalysis.breakdown['Skin Quality'] = Number(
            (geminiData.overall_skin_score || 0).toFixed(1)
          );
          currentAnalysis.breakdown['Grooming'] = Number((geminiData.grooming || 0).toFixed(1));
          currentAnalysis.breakdown['Cheekbones'] = Number(
            (geminiData.cheekbone_prominence || 0).toFixed(1)
          );

          if (geminiData.visualStrengths)
            currentAnalysis.analysis.strengths.push(...geminiData.visualStrengths);
          if (geminiData.visualWeaknesses)
            currentAnalysis.analysis.weaknesses.push(...geminiData.visualWeaknesses);

          const landmarkFaceShape = currentAnalysis.visionAnalysis?.faceShape;
          const landmarkFaceShapeConfidence = currentAnalysis.visionAnalysis?.faceShapeConfidence;
          currentAnalysis.visionAnalysis = {
            colorSeason: geminiData.color_season,
            skinAnalysis: geminiData.skinAnalysis,
            aestheticsAnalysis: geminiData.aestheticsAnalysis,
            potentialScore: geminiData.potentialScore,
            improvements: geminiData.improvements,
            recommendedProducts: geminiData.recommendedProducts || [],
            faceShape: landmarkFaceShape || geminiData.faceShape,
            faceShapeConfidence: landmarkFaceShapeConfidence,
            hairRecommendations: geminiData.hairRecommendations,
            insightDescriptions: geminiData.insightDescriptions || {},
            improvementPlan: geminiData.improvementPlan || [],
            surfaceAnalysis: {
              skin_quality: geminiData.skin_quality,
              acne_presence: geminiData.acne_presence,
              wrinkle_visibility: geminiData.wrinkle_visibility,
              skin_texture: geminiData.skin_texture,
              dark_circles: geminiData.dark_circles,
              redness: geminiData.redness,
              oiliness: geminiData.oiliness
            }
          };
        }
        // Success — return immediately
        return currentAnalysis;
      } catch (e: any) {
        lastError = e;
        console.warn(`Gemini analysis attempt ${attempt}/${MAX_RETRIES} failed:`, e);
        const retryableStatus = !e?.statusCode || e.statusCode === 429 || e.statusCode >= 500;
        if (attempt < MAX_RETRIES && retryableStatus) {
          await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
        }
      }
    }

    console.error('Gemini Vision Error: All retries failed.', lastError);
    return currentAnalysis;
  };

  const saveToHistory = async (analysisResult: AnalysisResult, thumbBase64: string) => {
    if (!auth.currentUser) {
      setSaveStatus({ message: 'Not logged in. Scan not saved to history.', type: 'error' });
      setTimeout(() => setSaveStatus(null), 4000);
      return;
    }

    try {
      setSaveStatus({ message: 'Saving to your history...', type: 'success' });

      const saveableResult = JSON.parse(JSON.stringify(analysisResult));
      saveableResult.historyImage = thumbBase64;

      const idToken = await auth.currentUser.getIdToken(false);
      const scanData = {
        overallScore: analysisResult.overallScore,
        imageUrl: 'base64-stored-in-analysisData',
        analysisData: JSON.stringify(saveableResult)
      };

      const response = await fetch('/api/scans/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(scanData)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Save failed with status ${response.status}`);
      }
      console.log('Scan saved to Firebase successfully.');

      setSaveStatus({ message: 'Saved to your history!', type: 'success' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (firebaseError: any) {
      console.error('Error saving scan to Firebase:', firebaseError);
      setSaveStatus({ message: `Failed to save: ${firebaseError.message}`, type: 'error' });
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  return { analyzeImageServerSide, getGeminiAnalysis, saveToHistory, saveStatus };
}
