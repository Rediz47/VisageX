import { useState } from 'react';
import { auth, db } from '../../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { AnalysisResult, Landmark, SaveStatus } from '../types';

export function useAnalysis(userCredits: number) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);

  const analyzeImageServerSide = async (landmarks: Landmark[], croppedImageBase64: string): Promise<AnalysisResult> => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landmarks, image: croppedImageBase64 })
    });

    if (!response.ok) {
      throw new Error("Failed to analyze face on the server.");
    }
    return await response.json();
  };

  const getGeminiAnalysis = async (croppedImageBase64: string, currentAnalysis: AnalysisResult): Promise<AnalysisResult> => {
    if (!auth.currentUser || userCredits <= 0) {
      console.log("Skipping premium AI analysis due to missing auth or credits.");
      return currentAnalysis;
    }

    const MAX_RETRIES = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const idToken = await auth.currentUser!.getIdToken(attempt > 1); // Force refresh on retry
        const aiResponse = await fetch('/api/gemini-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ image: croppedImageBase64 })
        });

        if (aiResponse.status === 403) {
          console.warn("Insufficient credits for AI analysis.");
          return currentAnalysis;
        }

        if (!aiResponse.ok) {
          throw new Error(`AI analysis failed (status ${aiResponse.status})`);
        }

        const geminiData = await aiResponse.json();
        if (geminiData && typeof geminiData.skin_quality === 'number') {
          const aiAesthetics = geminiData.overall_aesthetics_score || currentAnalysis.overallScore;
          const aiWeight = 0.85;
          const newOverallScore = (currentAnalysis.overallScore * (1 - aiWeight)) + (aiAesthetics * aiWeight);

          if (!isNaN(newOverallScore)) {
            currentAnalysis.overallScore = Number(newOverallScore.toFixed(1));
          }

          if (geminiData.potentialScore <= currentAnalysis.overallScore) {
            geminiData.potentialScore = Math.min(10, currentAnalysis.overallScore + 0.5);
          }
          currentAnalysis.breakdown["Skin Quality"] = Number((geminiData.overall_skin_score || 0).toFixed(1));
          currentAnalysis.breakdown["Grooming"] = Number((geminiData.grooming || 0).toFixed(1));
          currentAnalysis.breakdown["Cheekbones"] = Number((geminiData.cheekbone_prominence || 0).toFixed(1));

          if (geminiData.visualStrengths) currentAnalysis.analysis.strengths.push(...geminiData.visualStrengths);
          if (geminiData.visualWeaknesses) currentAnalysis.analysis.weaknesses.push(...geminiData.visualWeaknesses);

          currentAnalysis.visionAnalysis = {
            colorSeason: geminiData.color_season,
            skinAnalysis: geminiData.skinAnalysis,
            aestheticsAnalysis: geminiData.aestheticsAnalysis,
            potentialScore: geminiData.potentialScore,
            improvements: geminiData.improvements,
            recommendedProducts: geminiData.recommendedProducts || [],
            faceShape: geminiData.faceShape,
            hairRecommendations: geminiData.hairRecommendations,
            dermatology: {
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
      } catch (e) {
        lastError = e;
        console.warn(`Gemini analysis attempt ${attempt}/${MAX_RETRIES} failed:`, e);
        if (attempt < MAX_RETRIES) {
          // Wait before retrying (2s, then 4s)
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    console.error("Gemini Vision Error: All retries failed.", lastError);
    return currentAnalysis;
  };

  const saveToHistory = async (analysisResult: AnalysisResult, thumbBase64: string) => {
    if (!auth.currentUser) {
      setSaveStatus({ message: "Not logged in. Scan not saved to history.", type: 'error' });
      setTimeout(() => setSaveStatus(null), 4000);
      return;
    }

    try {
      setSaveStatus({ message: "Saving to your history...", type: 'success' });
      
      const saveableResult = JSON.parse(JSON.stringify(analysisResult));
      saveableResult.historyImage = thumbBase64;

      const scanData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || '',
        createdAt: new Date().toISOString(),
        overallScore: analysisResult.overallScore,
        imageUrl: "base64-stored-in-analysisData",
        analysisData: JSON.stringify(saveableResult)
      };

      await addDoc(collection(db, 'scans'), scanData);
      console.log("Scan saved to Firebase successfully.");

      try {
        const idToken = await auth.currentUser.getIdToken();
        await fetch('/api/referral/scan/complete', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ userId: auth.currentUser.uid })
        });
      } catch (e) {
        console.error("Failed to trigger scan completion reward:", e);
      }

      setSaveStatus({ message: "Saved to your history!", type: 'success' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (firebaseError: any) {
      console.error("Error saving scan to Firebase:", firebaseError);
      setSaveStatus({ message: `Failed to save: ${firebaseError.message}`, type: 'error' });
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  return { analyzeImageServerSide, getGeminiAnalysis, saveToHistory, saveStatus };
}
