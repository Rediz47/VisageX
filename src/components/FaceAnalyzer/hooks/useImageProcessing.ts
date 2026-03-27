import { useState, useRef, RefObject } from 'react';
import { FaceLandmarker } from '@mediapipe/tasks-vision';
import { usePostHog } from '@posthog/react';
import { AnalysisResult, Landmark } from '../types';
import { checkImageLightingAndBlur } from '../utils/imageQuality';
import { drawFaceMesh } from '../utils/geometry';
import { useAnalysis } from './useAnalysis';

export function useImageProcessing(
  faceLandmarker: FaceLandmarker | null,
  userCredits: number,
  onAnalysisComplete: (result: AnalysisResult, imageUrl: string, isLocked: boolean) => void,
  updateProgress: (target: number) => void
) {
  const posthog = usePostHog();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [errorProcessing, setError] = useState<string | null>(null);

  const { analyzeImageServerSide, getGeminiAnalysis, saveToHistory, saveStatus } = useAnalysis(userCredits);

  const processImage = async (imageUrl: string, canvasRef: RefObject<HTMLCanvasElement | null>) => {
    if (!faceLandmarker) return;

    posthog.capture('scan_started');
    setIsProcessing(true);
    updateProgress(5);
    setScanStep("Initializing neural engines...");
    setError(null);

    try {
      setScanStep("Loading portrait data...");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      updateProgress(15);

      setScanStep("Analyzing facial structure...");
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not available");
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context not available");

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const result = faceLandmarker.detect(img);
      updateProgress(25);

      if (result.faceLandmarks.length === 0) {
        throw new Error("No face detected. Please upload a clear front-facing selfie.");
      }
      if (result.faceLandmarks.length > 1) {
        throw new Error("Multiple faces detected. Please upload a photo with only one person.");
      }

      const landmarks = result.faceLandmarks[0] as unknown as Landmark[];
      const blendshapes = result.faceBlendshapes?.[0];

      setScanStep("Analyzing facial expression...");
      if (blendshapes) {
        const smileLeft = blendshapes.categories.find(c => c.categoryName === 'mouthSmileLeft')?.score || 0;
        const smileRight = blendshapes.categories.find(c => c.categoryName === 'mouthSmileRight')?.score || 0;

        if (smileLeft > 0.4 || smileRight > 0.4) {
          throw new Error("Please keep a neutral face. Smiling alters your facial ratios and reduces accuracy.");
        }
      }
      updateProgress(35);

      setScanStep("Verifying image quality...");
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      landmarks.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });

      const faceWidthRatio = maxX - minX;
      if (faceWidthRatio < 0.25) {
        throw new Error("Move closer to camera for better accuracy");
      }

      const paddingX = (maxX - minX) * 0.2;
      const paddingY = (maxY - minY) * 0.2;

      const cropMinX = Math.max(0, minX - paddingX);
      const cropMaxX = Math.min(1, maxX + paddingX);
      const cropMinY = Math.max(0, minY - paddingY);
      const cropMaxY = Math.min(1, maxY + paddingY);

      const cropX = Math.floor(cropMinX * img.width);
      const cropY = Math.floor(cropMinY * img.height);
      const cropW = Math.floor((cropMaxX - cropMinX) * img.width);
      const cropH = Math.floor((cropMaxY - cropMinY) * img.height);

      setScanStep("Analyzing lighting & focus...");
      await checkImageLightingAndBlur(img, cropX, cropY, cropW, cropH);
      updateProgress(45);

      setScanStep("Isolating facial features...");
      canvas.width = cropW;
      canvas.height = cropH;
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const geminiCanvas = document.createElement('canvas');
      const MAX_GEMINI_SIZE = 768;
      let gW = cropW;
      let gH = cropH;
      if (gW > MAX_GEMINI_SIZE || gH > MAX_GEMINI_SIZE) {
        const scale = Math.min(MAX_GEMINI_SIZE / gW, MAX_GEMINI_SIZE / gH);
        gW = Math.floor(gW * scale);
        gH = Math.floor(gH * scale);
      }
      geminiCanvas.width = gW;
      geminiCanvas.height = gH;
      const gCtx = geminiCanvas.getContext('2d');
      if (gCtx) {
        gCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, gW, gH);
      }
      const croppedImageBase64 = geminiCanvas.toDataURL('image/jpeg', 0.7);

      setScanStep("Calculating Golden Ratio & Symmetry...");
      updateProgress(55);
      
      let analysisResult = await analyzeImageServerSide(landmarks, croppedImageBase64);

      drawFaceMesh(ctx, landmarks, img.width, img.height, cropX, cropY, analysisResult);

      setScanStep("AI Skin & Texture Analysis...");
      updateProgress(65);
      
      analysisResult = await getGeminiAnalysis(croppedImageBase64, analysisResult);

      setScanStep("Generating aesthetic report...");
      updateProgress(90);

      await new Promise(resolve => setTimeout(resolve, 800));

      setScanStep("Finalizing results...");
      updateProgress(95);
      
      const finalImageUrl = canvas.toDataURL('image/jpeg', 0.8);
      const isLocked = userCredits <= 0;
      
      onAnalysisComplete(analysisResult, finalImageUrl, isLocked);
      updateProgress(100);

      const thumbCanvas = document.createElement('canvas');
      const MAX_THUMB_SIZE = 400;
      let thumbW = canvas.width;
      let thumbH = canvas.height;
      if (thumbW > MAX_THUMB_SIZE || thumbH > MAX_THUMB_SIZE) {
        const scale = Math.min(MAX_THUMB_SIZE / thumbW, MAX_THUMB_SIZE / thumbH);
        thumbW = Math.floor(thumbW * scale);
        thumbH = Math.floor(thumbH * scale);
      }
      thumbCanvas.width = thumbW;
      thumbCanvas.height = thumbH;
      const thumbCtx = thumbCanvas.getContext('2d');
      if (thumbCtx) {
        thumbCtx.drawImage(canvas, 0, 0, thumbW, thumbH);
        const thumbBase64 = thumbCanvas.toDataURL('image/jpeg', 0.8);
        await saveToHistory(analysisResult, thumbBase64);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  return { processImage, isProcessing, scanStep, errorProcessing, setError, saveStatus };
}
