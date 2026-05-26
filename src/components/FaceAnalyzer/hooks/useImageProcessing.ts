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
  updateProgress: (target: number) => void,
  waitForAnimation?: () => Promise<void>,
  waitForDash?: () => Promise<void>
) {
  const posthog = usePostHog();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [errorProcessing, setError] = useState<string | null>(null);
  const [faceLandmarks, setFaceLandmarks] = useState<Landmark[] | null>(null);

  const { analyzeImageServerSide, getGeminiAnalysis, saveToHistory, saveStatus } =
    useAnalysis(userCredits);

  const processImage = async (imageUrl: string, canvasRef: RefObject<HTMLCanvasElement | null>) => {
    if (!faceLandmarker) return;

    posthog.capture('scan_started');
    setIsProcessing(true);
    updateProgress(5);
    setScanStep('Calibrating 468-point spatial mesh...');
    setError(null);

    try {
      setScanStep('Loading portrait data...');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      updateProgress(15);

      setScanStep('Mapping structural landmarks...');
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const result = faceLandmarker.detect(img);
      updateProgress(25);

      if (result.faceLandmarks.length === 0) {
        throw new Error('No face detected. Please upload a clear front-facing selfie.');
      }
      if (result.faceLandmarks.length > 1) {
        throw new Error('Multiple faces detected. Please upload a photo with only one person.');
      }

      const landmarks = result.faceLandmarks[0] as unknown as Landmark[];
      setFaceLandmarks(landmarks);
      const blendshapes = result.faceBlendshapes?.[0];

      setScanStep('Checking expression neutral alignment...');
      if (blendshapes) {
        const smileLeft =
          blendshapes.categories.find((c) => c.categoryName === 'mouthSmileLeft')?.score || 0;
        const smileRight =
          blendshapes.categories.find((c) => c.categoryName === 'mouthSmileRight')?.score || 0;

        if (smileLeft > 0.4 || smileRight > 0.4) {
          throw new Error(
            'Please keep a neutral face. Smiling alters your facial ratios and reduces accuracy.'
          );
        }
      }
      updateProgress(35);

      setScanStep('Measuring facial ratios & symmetry...');
      let minX = 1,
        maxX = 0,
        minY = 1,
        maxY = 0;
      landmarks.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });

      const faceWidthRatio = maxX - minX;
      if (faceWidthRatio < 0.25) {
        throw new Error('Move closer to camera for better accuracy');
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

      setScanStep('Calibrating lighting & focus...');
      await checkImageLightingAndBlur(img, cropX, cropY, cropW, cropH);
      updateProgress(45);

      setScanStep('Isolating face geometry...');
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

      setScanStep('Calculating bilateral symmetry & landmark ratios...');
      updateProgress(55);

      let analysisResult = await analyzeImageServerSide(landmarks, croppedImageBase64);

      drawFaceMesh(ctx, landmarks, img.width, img.height, cropX, cropY, analysisResult);

      setScanStep('AI skin & surface texture analysis...');
      updateProgress(65);

      // No geminiPump needed: the rAF loop's milestone-aware creep asymptotes
      // toward the NEXT milestone (92) so the bar keeps inching during the
      // Gemini wait without ever lying about completion.
      analysisResult = await getGeminiAnalysis(croppedImageBase64, analysisResult);

      // Attach landmark data for the animated face mesh overlay in the dashboard
      analysisResult.landmarks = landmarks;
      analysisResult.cropInfo = {
        cropX,
        cropY,
        imgWidth: img.width,
        imgHeight: img.height,
        cropW,
        cropH
      };

      // Post-Gemini handoff: 95 lets the bar catch up smoothly from wherever
      // the creep landed (e.g. 80) and then resumes creeping 95 → 99 during
      // the animation wait. Without this, a fast Gemini would dash 80 → 100
      // in 50ms (jarring), and a slow one would stick at 99 too long.
      setScanStep('Finalizing your aesthetic report...');
      updateProgress(99);

      const finalImageUrl = canvas.toDataURL('image/jpeg', 0.8);
      const isLocked = userCredits <= 0;

      // Always let the robot finish its celebration animation — applies equally
      // for locked (0-credit) and unlocked users. 10s safety cap only fires if
      // the canvas never calls onAnimationComplete (e.g., unmounted early).
      if (waitForAnimation) {
        await Promise.race([
          waitForAnimation(),
          new Promise<void>((resolve) => setTimeout(resolve, 10000))
        ]);
      }

      // Extra 2s polish to let the robot's final wave + ring effects breathe
      // before transitioning to the results dashboard.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Dash finale safeguard (belt-and-suspenders):
      //   1. The progress rAF loop is HARD-CAPPED to ≤300ms via DASH_PER_SECOND.
      //   2. We AWAIT the display reaching 100 (or 350ms safety) before
      //      navigating away — guarantees the final sprint is always visible.
      if (waitForDash) {
        await waitForDash();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      onAnalysisComplete(analysisResult, finalImageUrl, isLocked);

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
      setError(err.message || 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processImage,
    isProcessing,
    scanStep,
    errorProcessing,
    setError,
    saveStatus,
    faceLandmarks
  };
}
