import React, { useRef, useEffect, useState } from 'react';
import { Upload, Camera, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePostHog } from '@posthog/react';
import { FaceAnalyzerProps } from './types';
import { useFaceModel } from './hooks/useFaceModel';
import { useImageProcessing } from './hooks/useImageProcessing';
import { PhotoEditorModal } from './PhotoEditorModal';
import { AnalysisLoader } from './AnalysisLoader';


export function FaceAnalyzer({ onAnalysisComplete, isDarkMode, userCredits }: FaceAnalyzerProps) {
  const posthog = usePostHog();
  const { faceLandmarker, isModelLoading, error: modelError, setError: setModelError } = useFaceModel();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [progressTarget, setProgressTarget] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile once on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const progressTargetRef = useRef(0);
  const progressValueRef = useRef(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const requestRef = useRef<number>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const updateProgress = (target: number) => {
    progressTargetRef.current = target;
    // Do NOT snap the display value — the rAF loop below creeps toward it
    // smoothly and also inches forward during long async waits so the bar
    // never looks frozen (e.g. while Gemini analysis is pending).
  };

  const { processImage, isProcessing, scanStep, errorProcessing, setError: setProcessError, saveStatus, faceLandmarks } = useImageProcessing(
    faceLandmarker,
    userCredits,
    onAnalysisComplete,
    updateProgress
  );

  const error = modelError || errorProcessing;

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
      setProgressTarget(0);
      setScanHistory([]);
      if (progressBarRef.current) progressBarRef.current.style.width = '0%';
      if (progressTextRef.current) progressTextRef.current.innerText = '0%';
      return;
    }

    // Relay-style progress: always inching forward. While below the latest
    // milestone target, catch up quickly; once caught up, keep creeping at a
    // slow pace (capped just below the next expected milestone) so async
    // waits (Gemini, server calls) never freeze the UI.
    let lastPushed = -1;
    const animate = () => {
      const target = progressTargetRef.current;
      const cur = progressValueRef.current;
      if (target >= 100) {
        // Final dash to 100 is quick.
        progressValueRef.current = Math.min(100, cur + 1.8);
      } else if (cur < target - 0.5) {
        // Catch up toward the newly announced milestone.
        progressValueRef.current = Math.min(target, cur + 1.4);
      } else if (target > 0) {
        // Creep slowly past the milestone but never overtake the next one.
        // We don't know the next milestone exactly, so asymptote toward
        // (target + 8) with diminishing speed — feels alive without lying.
        const ceiling = Math.min(98, target + 8);
        if (cur < ceiling) {
          const gap = ceiling - cur;
          progressValueRef.current = cur + Math.max(0.04, gap * 0.008);
        }
      }
      if (progressValueRef.current > 100) progressValueRef.current = 100;

      // Only push state when the displayed integer changes — avoids render flood.
      const rounded = Math.floor(progressValueRef.current);
      if (rounded !== lastPushed) {
        lastPushed = rounded;
        setProgressTarget(progressValueRef.current);
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isProcessing]);

  useEffect(() => {
    return () => {
      if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    }
  }, [uploadedImageUrl]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModelError('Please upload a valid image file (JPG/PNG).');
      return;
    }

    posthog.capture('photo_uploaded', { source: event.target === cameraInputRef.current ? 'camera' : 'upload' });

    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    setUploadedImageUrl(null);   // clear stale loader so hero shows behind editor
    const imageUrl = URL.createObjectURL(file);
    // Show editor first — user crops/rotates before analysis
    setPendingUrl(imageUrl);
    // Reset inputs so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleEditorConfirm = (editedUrl: string) => {
    setPendingUrl(null);
    setUploadedImageUrl(editedUrl);
    processImage(editedUrl, canvasRef).catch(() => setUploadedImageUrl(null));
  };

  const handleEditorCancel = () => {
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    setPendingUrl(null);
  };

  return (
    <>
    <AnimatePresence>
      {pendingUrl && (
        <PhotoEditorModal
          imageUrl={pendingUrl}
          isDarkMode={isDarkMode}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      )}
    </AnimatePresence>
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      {/* Hidden file inputs — always in DOM so refs stay valid */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} />
      <input type="file" ref={cameraInputRef} className="hidden" accept="image/jpeg, image/png" capture="user" onChange={handleImageUpload} />

      <AnimatePresence mode="wait">
      {uploadedImageUrl && (isProcessing || !errorProcessing) ? (
        /* ── Full-width analysis loader ── */
        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-12 md:mb-20">
          <AnalysisLoader
            imageUrl={uploadedImageUrl}
            scanStep={scanStep}
            scanHistory={scanHistory}
            progress={progressTarget}
            isDarkMode={isDarkMode}
            faceLandmarks={faceLandmarks}
          />
        </motion.div>
      ) : (
        /* ── Hero + upload card ── */
        <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center mb-12 md:mb-20"
        >
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
              <div
                className={`relative border rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-center transition-all duration-300 cursor-pointer backdrop-blur-sm overflow-hidden ${isDarkMode ? 'border-white/5 hover:border-white/10 bg-black/80' : 'border-black/5 hover:border-black/10 bg-white/80 shadow-2xl shadow-indigo-500/5'}`}
                onClick={() => !isModelLoading && fileInputRef.current?.click()}
              >
                {isModelLoading ? (
                  <div className="flex flex-col items-center py-8 md:py-12">
                    <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-6 md:mb-8" />
                    <p className={`font-display italic text-2xl md:text-3xl ${isDarkMode ? 'text-white/90' : 'text-zinc-900'}`}>Preparing analysis...</p>
                    <p className={`text-xs md:text-sm mt-3 md:mt-4 font-light ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Loading 3D facial landmark models.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 md:py-12">
                    <div className={`w-16 h-16 md:w-24 md:h-24 border rounded-full flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-all duration-700 ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900 shadow-sm'}`}>
                      <Upload className="w-6 h-6 md:w-8 md:h-8 opacity-40" />
                    </div>
                    <p className={`font-display italic text-2xl md:text-3xl ${isDarkMode ? 'text-white/90' : 'text-zinc-900'}`}>Upload your portrait</p>
                    <p className={`text-xs md:text-sm mt-3 md:mt-4 font-light ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>High-quality JPG or PNG, max 5MB</p>
                    {isMobile && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                        className={`mt-6 flex items-center gap-2 px-6 py-3 rounded-full border font-bold text-sm transition-all duration-300 ${isDarkMode ? 'border-white/20 text-white/70 bg-white/5 hover:bg-white/10 hover:text-white' : 'border-zinc-300 text-zinc-700 bg-zinc-50 hover:bg-zinc-100'}`}
                      >
                        <Camera className="w-4 h-4" />
                        Take Selfie
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

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
    </>
  );
}
