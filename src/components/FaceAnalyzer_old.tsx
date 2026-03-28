import React, { useState, useRef, useEffect } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Upload, Camera, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Type } from '@google/genai';
import { auth, db, storage } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { usePostHog } from '@posthog/react';

// Suppress MediaPipe's internal TFLite logs
const originalInfo = console.info;
console.info = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('TensorFlow Lite XNNPACK delegate')) return;
  originalInfo(...args);
};

const originalLog = console.log;
console.log = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('TensorFlow Lite XNNPACK delegate')) return;
  originalLog(...args);
};

interface FaceAnalyzerProps {
  onAnalysisComplete: (result: any, imageUrl: string, isLocked: boolean) => void;
  userCredits: number;
}

export function FaceAnalyzer({ onAnalysisComplete, isDarkMode, userCredits }: FaceAnalyzerProps & { isDarkMode: boolean }) {
  const posthog = usePostHog();
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState<string>("");
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const progressTargetRef = useRef(0);
  const progressValueRef = useRef(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const requestRef = useRef<number>();
  const [saveStatus, setSaveStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const updateProgress = (target: number) => {
    progressTargetRef.current = target;
  };

  // Track scan history for the terminal-like animation
  useEffect(() => {
    if (scanStep && !scanHistory.includes(scanStep)) {
      setScanHistory(prev => [...prev, scanStep]);
    }
  }, [scanStep]);

  // Progress simulation for smoother bar movement
  useEffect(() => {
    if (!isProcessing) {
      progressValueRef.current = 0;
      progressTargetRef.current = 0;
      setScanHistory([]);
      if (progressBarRef.current) progressBarRef.current.style.width = '0%';
      if (progressTextRef.current) progressTextRef.current.innerText = '0%';
      return;
    }

    const animate = () => {
      if (progressValueRef.current < progressTargetRef.current) {
        progressValueRef.current += 1.2;
      } else if (progressValueRef.current < 99 && progressTargetRef.current > 0 && progressTargetRef.current !== 100) {
        progressValueRef.current += 0.05;
      }

      if (progressValueRef.current > 100) progressValueRef.current = 100;

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${progressValueRef.current}%`;
      }
      if (progressTextRef.current) {
        progressTextRef.current.innerText = `${Math.round(progressValueRef.current)}%`;
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current as number);
  }, [isProcessing]);

  useEffect(() => {
    return () => {
      if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    }
  }, [uploadedImageUrl]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function loadModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "IMAGE",
          numFaces: 1
        });
        setFaceLandmarker(landmarker);
        setIsModelLoading(false);
      } catch (err) {
        console.error("Failed to load FaceLandmarker:", err);
        setError("Failed to load AI model. Please refresh and try again.");
        setIsModelLoading(false);
      }
    }
    loadModel();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file (JPG/PNG).");
      return;
    }

    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    const imageUrl = URL.createObjectURL(file);
    setUploadedImageUrl(imageUrl);
    processImage(imageUrl);
  };

  const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

  const processImage = async (imageUrl: string) => {
    if (!faceLandmarker) return;

    posthog.capture('scan_started');
    setIsProcessing(true);
    updateProgress(5);
    setScanStep("Initializing neural engines...");
    setError(null);

    try {
      // Load image to an HTMLImageElement
      setScanStep("Loading portrait data...");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      updateProgress(15);

      // Draw image to canvas to get its dimensions and display it
      setScanStep("Analyzing facial structure...");
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) throw new Error("Canvas not available");

      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Detect faces
      const result = faceLandmarker.detect(img);
      updateProgress(25);

      if (result.faceLandmarks.length === 0) {
        throw new Error("No face detected. Please upload a clear front-facing selfie.");
      }

      if (result.faceLandmarks.length > 1) {
        throw new Error("Multiple faces detected. Please upload a photo with only one person.");
      }

      const landmarks = result.faceLandmarks[0];
      const blendshapes = result.faceBlendshapes?.[0];

      // --- SMILE DETECTION ---
      setScanStep("Analyzing facial expression...");
      if (blendshapes) {
        const smileLeft = blendshapes.categories.find(c => c.categoryName === 'mouthSmileLeft')?.score || 0;
        const smileRight = blendshapes.categories.find(c => c.categoryName === 'mouthSmileRight')?.score || 0;

        if (smileLeft > 0.4 || smileRight > 0.4) {
          throw new Error("Please keep a neutral face. Smiling alters your facial ratios and reduces accuracy.");
        }
      }
      updateProgress(35);

      // --- FACE DISTANCE CHECK ---
      setScanStep("Verifying image quality...");
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      landmarks.forEach((p: any) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });

      const faceWidthRatio = maxX - minX;
      if (faceWidthRatio < 0.25) {
        throw new Error("Move closer to camera for better accuracy");
      }

      // Calculate crop area (face bounding box + 20% padding)
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

      // --- PHOTO QUALITY CHECKS (Blur & Lighting on CROPPED face) ---
      setScanStep("Analyzing lighting & focus...");
      const checkCanvas = document.createElement('canvas');
      const checkCtx = checkCanvas.getContext('2d');
      if (checkCtx) {
        // Scale down to max 300px for faster processing
        const scale = Math.min(300 / cropW, 300 / cropH, 1);
        checkCanvas.width = Math.floor(cropW * scale);
        checkCanvas.height = Math.floor(cropH * scale);

        // Draw only the cropped face area
        checkCtx.drawImage(
          img,
          cropX, cropY, cropW, cropH, // Source
          0, 0, checkCanvas.width, checkCanvas.height // Destination
        );

        const imageData = checkCtx.getImageData(0, 0, checkCanvas.width, checkCanvas.height);
        const data = imageData.data;

        // 1. Brightness Check
        await yieldToMain();
        let totalLuminance = 0;
        for (let i = 0; i < data.length; i += 4) {
          totalLuminance += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        }
        const avgBrightness = totalLuminance / (data.length / 4);

        if (avgBrightness < 30) {
          throw new Error("Photo is too dark. Please take a photo in better lighting.");
        }
        if (avgBrightness > 220) {
          throw new Error("Photo is too bright or overexposed. Please adjust lighting.");
        }

        // 2. Blur Check (Laplacian Variance)
        const width = checkCanvas.width;
        const height = checkCanvas.height;
        const gray = new Uint8Array(width * height);
        await yieldToMain();

        for (let i = 0; i < data.length; i += 4) {
          gray[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        }

        let sum = 0;
        let sumSq = 0;
        let count = 0;

        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const val =
              gray[idx - width] +
              gray[idx - 1] +
              gray[idx + 1] +
              gray[idx + width] -
              4 * gray[idx];

            sum += val;
            sumSq += val * val;
            count++;
          }
        }

        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);

        // Variance threshold for blur (usually < 50 is very blurry)
        if (variance < 50) {
          throw new Error("Photo is too blurry. Please hold the camera still and try again.");
        }
      }
      updateProgress(45);

      // --- CROP MAIN CANVAS FOR FINAL OUTPUT ---
      setScanStep("Isolating facial features...");
      canvas.width = cropW;
      canvas.height = cropH;
      ctx.drawImage(
        img,
        cropX, cropY, cropW, cropH,
        0, 0, cropW, cropH
      );

      // Get base64 of the cropped face BEFORE drawing the mesh
      // This is what we send to Gemini Vision
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

      // --- CROP SPECIFIC REGIONS FOR BETTER AI ANALYSIS ---
      const getRegionCrop = (landmarkIdx: number, sizeMultiplier: number = 0.3) => {
        const lm = landmarks[landmarkIdx];
        if (!lm) return null;

        const faceWidth = (maxX - minX) * img.width;
        const size = faceWidth * sizeMultiplier;

        const cx = lm.x * img.width;
        const cy = lm.y * img.height;

        const rx = Math.max(0, cx - size / 2);
        const ry = Math.max(0, cy - size / 2);
        const rw = Math.min(img.width - rx, size);
        const rh = Math.min(img.height - ry, size);

        const rCanvas = document.createElement('canvas');
        // Keep region crops small (max 256px)
        const REGION_SIZE = 256;
        rCanvas.width = REGION_SIZE;
        rCanvas.height = REGION_SIZE;
        const rCtx = rCanvas.getContext('2d');
        if (rCtx) {
          rCtx.drawImage(img, rx, ry, rw, rh, 0, 0, REGION_SIZE, REGION_SIZE);
          return rCanvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        }
        return null;
      };

      const foreheadBase64 = getRegionCrop(10, 0.4);
      const chinBase64 = getRegionCrop(152, 0.3);

      setScanStep("Calculating Golden Ratio & Symmetry...");
      updateProgress(55);
      // Send landmarks to backend
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landmarks,
          image: croppedImageBase64
        })
      });

      if (!response.ok) {
        throw new Error("Failed to analyze face on the server.");
      }

      let analysisResult = await response.json();

      // Draw mesh on cropped canvas with analysis data
      drawFaceMesh(ctx, landmarks, img.width, img.height, cropX, cropY, analysisResult);

      // --- GEMINI VISION AI ANALYSIS (BACKEND) ---
      try {
        if (!auth.currentUser) {
          console.log("User not logged in, skipping premium AI analysis.");
        } else if (userCredits <= 0) {
          console.log("User has no credits, skipping premium AI analysis.");
        } else {
          setScanStep("AI Skin & Texture Analysis...");
          updateProgress(65);

          const idToken = await auth.currentUser.getIdToken();
          
          const aiResponse = await fetch('/api/gemini-analysis', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ image: croppedImageBase64 })
          });

          if (!aiResponse.ok) {
            if (aiResponse.status === 403) {
               console.warn("Insufficient credits for AI analysis.");
            } else {
               throw new Error("AI analysis failed on server.");
            }
          } else {
            const geminiData = await aiResponse.json();

            if (geminiData && typeof geminiData.skin_quality === 'number') {
              // Blend Gemini scores into overall score. 
              const aiAesthetics = geminiData.overall_aesthetics_score || analysisResult.overallScore;
              let aiWeight = 0.85;
              const newOverallScore = (analysisResult.overallScore * (1 - aiWeight)) + (aiAesthetics * aiWeight);

              if (!isNaN(newOverallScore)) {
                analysisResult.overallScore = Number(newOverallScore.toFixed(1));
              }

              if (geminiData.potentialScore <= analysisResult.overallScore) {
                geminiData.potentialScore = Math.min(10, analysisResult.overallScore + 0.5);
              }
              analysisResult.breakdown["Skin Quality"] = Number((geminiData.overall_skin_score || 0).toFixed(1));
              analysisResult.breakdown["Grooming"] = Number((geminiData.grooming || 0).toFixed(1));
              analysisResult.breakdown["Cheekbones"] = Number((geminiData.cheekbone_prominence || 0).toFixed(1));

              if (geminiData.visualStrengths) analysisResult.analysis.strengths.push(...geminiData.visualStrengths);
              if (geminiData.visualWeaknesses) analysisResult.analysis.weaknesses.push(...geminiData.visualWeaknesses);

              analysisResult.visionAnalysis = {
                colorSeason: geminiData.color_season,
                skinAnalysis: geminiData.skinAnalysis,
                aestheticsAnalysis: geminiData.aestheticsAnalysis,
                potentialScore: geminiData.potentialScore,
                improvements: geminiData.improvements,
                recommendedProducts: geminiData.recommendedProducts || [],
                celebritySimilarity: [],
                faceShape: geminiData.faceShape,
                hairRecommendations: geminiData.hairRecommendations,
                cleanImage: croppedImageBase64,
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
          }
        }
      } catch (e) {
        console.error("Gemini Vision Error:", e);
      }

      // Pass result and the data URL of the canvas (with mesh) to parent
      setScanStep("Generating aesthetic report...");
      updateProgress(90);

      // Artificial delay to show the final step
      await new Promise(resolve => setTimeout(resolve, 800));

      setScanStep("Finalizing results...");
      updateProgress(95);
      const finalImageUrl = canvas.toDataURL('image/jpeg', 0.8);
      const isLocked = userCredits <= 0;
      onAnalysisComplete(analysisResult, finalImageUrl, isLocked);
      updateProgress(100);

      // Save to Firebase if user is logged in
      if (auth.currentUser) {
        try {
          // Note: Credit decrement is now securely handled inside the Gemini Analysis backend route.
          // We no longer manually call /api/consume-credit from the frontend.
          
          setSaveStatus({ message: "Saving to your history...", type: 'success' });
          // Create a high-quality thumbnail for Firebase history
          const thumbCanvas = document.createElement('canvas');
          const MAX_THUMB_SIZE = 400; // Good quality thumbnail
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

            const saveableResult = JSON.parse(JSON.stringify(analysisResult));
            if (saveableResult.visionAnalysis) {
              delete saveableResult.visionAnalysis.cleanImage;
            }
            // Store the base64 inside analysisData (which has a 1MB limit)
            saveableResult.historyImage = thumbBase64;

            const scanData = {
              userId: auth.currentUser.uid,
              userEmail: auth.currentUser.email || '',
              createdAt: new Date().toISOString(),
              overallScore: analysisResult.overallScore,
              imageUrl: "base64-stored-in-analysisData", // Dummy text to pass the <2048 char rule
              analysisData: JSON.stringify(saveableResult)
            };

            await addDoc(collection(db, 'scans'), scanData);
            console.log("Scan saved to Firebase successfully.");

            // Trigger referral reward logic for inviter
            try {
              await fetch('/api/referral/scan/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: auth.currentUser.uid })
              });
            } catch (e) {
              console.error("Failed to trigger scan completion reward:", e);
            }

            setSaveStatus({ message: "Saved to your history!", type: 'success' });
            setTimeout(() => setSaveStatus(null), 3000);
          }
        } catch (firebaseError: any) {
          console.error("Error saving scan to Firebase:", firebaseError);
          setSaveStatus({ message: `Failed to save: ${firebaseError.message}`, type: 'error' });
        }
      } else {
        setSaveStatus({ message: "Not logged in. Scan not saved to history.", type: 'error' });
        setTimeout(() => setSaveStatus(null), 4000);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during processing.");
      setUploadedImageUrl(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const drawFaceMesh = (ctx: CanvasRenderingContext2D, landmarks: any[], imgWidth: number, imgHeight: number, cropX: number, cropY: number, analysisResult?: any) => {
    // Add a subtle glow effect for that "AI" look
    ctx.shadowColor = "rgba(0, 255, 255, 0.8)";
    ctx.shadowBlur = 8;

    // Draw connections (mesh)
    ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
    ctx.lineWidth = 0.5;

    // A simplified mesh connection logic (connecting nearby points)
    // For a true mediapipe mesh, we'd use the FACEMESH_TESSELATION indices, 
    // but drawing lines between close points creates a cool futuristic effect.
    ctx.beginPath();
    for (let i = 0; i < landmarks.length; i += 3) {
      const p1 = landmarks[i];
      const x1 = (p1.x * imgWidth) - cropX;
      const y1 = (p1.y * imgHeight) - cropY;

      for (let j = i + 1; j < Math.min(i + 15, landmarks.length); j += 2) {
        const p2 = landmarks[j];
        const x2 = (p2.x * imgWidth) - cropX;
        const y2 = (p2.y * imgHeight) - cropY;

        // Only connect if they are relatively close
        const dist = Math.hypot(x2 - x1, y2 - y1);
        if (dist < 30) {
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
      }
    }
    ctx.stroke();

    // Draw all 468 landmarks as high-tech dots
    landmarks.forEach((point: any) => {
      ctx.beginPath();
      const x = (point.x * imgWidth) - cropX;
      const y = (point.y * imgHeight) - cropY;
      ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0, 255, 255, 0.9)";
      ctx.fill();
    });

    // Reset shadow for other drawings
    ctx.shadowBlur = 0;

    // --- ADVANCED OVERLAYS ---
    if (analysisResult && analysisResult.metrics) {
      const getPt = (idx: number) => {
        const p = landmarks[idx];
        return { x: (p.x * imgWidth) - cropX, y: (p.y * imgHeight) - cropY };
      };

      // 1. Facial Thirds
      const hairline = getPt(10);
      const glabella = getPt(9);
      const noseBase = getPt(2);
      const chin = getPt(152);

      ctx.strokeStyle = "rgba(236, 72, 153, 0.9)"; // Pink for thirds
      ctx.lineWidth = 3.5; // Bolder lines
      ctx.setLineDash([6, 6]);

      const drawHorizontalLine = (pt: { x: number, y: number }, label: string) => {
        ctx.beginPath();
        // Shorter ("little") lines
        ctx.moveTo(pt.x - 50, pt.y);
        ctx.lineTo(pt.x + 50, pt.y);
        ctx.stroke();

        ctx.fillStyle = "rgba(236, 72, 153, 1)";
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.fillText(label, pt.x + 55, pt.y + 4);
      };

      drawHorizontalLine(hairline, "HAIRLINE");
      drawHorizontalLine(glabella, "GLABELLA");
      drawHorizontalLine(noseBase, "NOSE BASE");
      drawHorizontalLine(chin, "CHIN");

      // 2. Jawline
      const leftGonion = getPt(132);
      const rightGonion = getPt(361);

      ctx.strokeStyle = "rgba(52, 211, 153, 0.9)"; // Emerald for jawline
      ctx.lineWidth = 3.5; // Bolder lines
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(leftGonion.x, leftGonion.y);
      ctx.lineTo(chin.x, chin.y);
      ctx.lineTo(rightGonion.x, rightGonion.y);
      ctx.stroke();

      // 3. Vertical Symmetry Line
      ctx.strokeStyle = "rgba(34, 211, 238, 0.9)"; // Cyan for symmetry
      ctx.lineWidth = 3.5; // Bolder lines
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.moveTo(hairline.x, hairline.y - 20);
      ctx.lineTo(chin.x, chin.y + 20);
      ctx.stroke();

      // Reset line dash
      ctx.setLineDash([]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center mb-12 md:mb-20">
        <div className="lg:w-1/2 text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`inline-flex items-center px-3 py-1 rounded-full border text-[9px] font-bold tracking-[0.3em] uppercase mb-6 md:mb-8 ${isDarkMode ? 'bg-white/5 border-white/10 text-white/40' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}
          >
            <Sparkles className="w-3 h-3 mr-2 opacity-50" />
            Neural Analysis
          </motion.div>
          <h2 className={`text-4xl md:text-6xl lg:text-8xl font-display leading-[0.85] italic mb-6 md:mb-8 tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Discover <br />
            <span className="not-italic opacity-50">your</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400 not-italic font-sans font-normal">potential.</span>
          </h2>
          <p className={`text-base md:text-lg font-light leading-relaxed mb-8 ${isDarkMode ? 'text-white/50' : 'text-zinc-500'}`}>
            Upload a clear, front-facing selfie for an advanced AI facial breakdown of your facial geometry based on 468 precise landmarks.
          </p>

          {/* Pro Tip Box */}
          <div className={`rounded-2xl p-4 border flex items-start gap-3 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/80' : 'text-zinc-900'}`}>Pro Tip for Accuracy</p>
              <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>
                For the most accurate symmetry analysis, ensure your face is perfectly straight, level with the camera, and maintain a neutral expression.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative group"
          >
            <div className={`relative border rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-center transition-all cursor-pointer backdrop-blur-sm overflow-hidden ${isDarkMode ? 'border-white/5 hover:border-white/10 bg-black/80' : 'border-black/5 hover:border-black/10 bg-white/80 shadow-2xl shadow-indigo-500/5'}`}
              onClick={() => !isModelLoading && !isProcessing && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg, image/png"
                onChange={handleImageUpload}
              />

              {isModelLoading ? (
                <div className="flex flex-col items-center py-8 md:py-12">
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-6 md:mb-8" />
                  <p className={`font-display italic text-2xl md:text-3xl ${isDarkMode ? 'text-white/90' : 'text-zinc-900'}`}>Preparing analysis...</p>
                  <p className={`text-xs md:text-sm mt-3 md:mt-4 font-light ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Loading 3D facial landmark models.</p>
                </div>
              ) : isProcessing && uploadedImageUrl ? (
                <div className="flex flex-col items-center w-full relative">
                  <div className="relative w-full max-w-[240px] md:max-w-xs mx-auto aspect-[3/4] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-black/5 shadow-2xl">
                    <img src={uploadedImageUrl} alt="Processing" className="w-full h-full object-cover opacity-50 grayscale" />
                    <motion.div
                      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_20px_rgba(251,113,133,0.8)] z-10"
                      initial={{ top: "0%" }}
                      animate={{ top: "100%" }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Scanning Grid Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
                  </div>

                  <div className="mt-8 md:mt-10 flex flex-col items-center w-full max-w-sm mx-auto">
                    {/* Multi-step scanning animation */}
                    <div className="w-full space-y-3 mb-6 flex flex-col items-start px-4">
                      <AnimatePresence mode="popLayout">
                        {scanHistory.slice(-3).map((step, index, arr) => {
                          const isCurrent = index === arr.length - 1;
                          return (
                            <motion.div
                              key={step}
                              initial={{ opacity: 0, x: -10, height: 0 }}
                              animate={{ opacity: isCurrent ? 1 : 0.5, x: 0, height: 'auto' }}
                              exit={{ opacity: 0, scale: 0.95, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className={`flex items-center gap-3 text-sm md:text-base font-mono w-full ${isCurrent ? (isDarkMode ? 'text-indigo-400' : 'text-indigo-600') : (isDarkMode ? 'text-zinc-500' : 'text-zinc-400')}`}
                            >
                              {isCurrent ? (
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                              <span className="truncate">{step}</span>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-3 w-full px-4">
                      <div className={`flex-1 h-[2px] rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-zinc-200'}`}>
                        <div
                          ref={progressBarRef}
                          className="h-full bg-gradient-to-r from-indigo-400 to-rose-400"
                          style={{ width: "0%" }}
                        />
                      </div>
                      <span ref={progressTextRef} className={`text-xs font-mono font-bold w-10 text-right ${isDarkMode ? 'text-white/50' : 'text-zinc-500'}`}>
                        0%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 md:py-12">
                  <div className={`w-16 h-16 md:w-24 md:h-24 border rounded-full flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-all duration-700 ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900 shadow-sm'}`}>
                    <Upload className="w-6 h-6 md:w-8 md:h-8 opacity-40" />
                  </div>
                  <p className={`font-display italic text-2xl md:text-3xl ${isDarkMode ? 'text-white/90' : 'text-zinc-900'}`}>Upload your portrait</p>
                  <p className={`text-xs md:text-sm mt-3 md:mt-4 font-light ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>High-quality JPG or PNG, max 5MB</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 p-4 rounded-xl text-sm font-medium text-center border backdrop-blur-sm ${isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-100'}`}
        >
          {error}
        </motion.div>
      )}

      {saveStatus && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-4 rounded-xl text-sm font-medium text-center border backdrop-blur-sm ${saveStatus.type === 'error'
            ? (isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-100')
            : (isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
            }`}
        >
          {saveStatus.message}
        </motion.div>
      )}

      {/* Hidden canvas for processing and drawing mesh */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
