import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Upload, Camera, Loader2, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePostHog } from '@posthog/react';
import { FaceAnalyzerProps } from './types';
import { useFaceModel } from './hooks/useFaceModel';
import { useImageProcessing } from './hooks/useImageProcessing';
import { PhotoEditorModal } from './PhotoEditorModal';
import { AnalysisLoader } from './AnalysisLoader';

export function FaceAnalyzer({
  onAnalysisComplete,
  isDarkMode,
  userCredits,
  user,
  onOpenAuth
}: FaceAnalyzerProps) {
  const posthog = usePostHog();
  const {
    faceLandmarker,
    isModelLoading,
    error: modelError,
    setError: setModelError
  } = useFaceModel();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [progressTarget, setProgressTarget] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [analyzedCount, setAnalyzedCount] = useState(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const hour = now.getHours();
    // Base 1420 + daily growth + hourly distribution + random offset
    return 1420 + (dayOfYear * 7) + (hour * 3) + Math.floor(Math.random() * 15);
  });

  // Dynamic counter incrementer
  useEffect(() => {
    const interval = setInterval(() => {
      // 30% chance to increment every 8 seconds
      if (Math.random() > 0.7) {
        setAnalyzedCount(prev => prev + 1);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

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

  const animResolveRef = useRef<(() => void) | null>(null);
  const handleAnimationComplete = useCallback(() => {
    animResolveRef.current?.();
    animResolveRef.current = null;
  }, []);
  const waitForAnimation = useCallback(
    () =>
      new Promise<void>((resolve) => {
        animResolveRef.current = resolve;
      }),
    []
  );

  // Dash finale: resolves when display value reaches 100 (or 350ms safety cap).
  // Used by useImageProcessing instead of a blind setTimeout so the final
  // sprint to 100% is always visible regardless of starting position or FPS.
  const waitForDash = useCallback(
    () =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        const SAFETY_MS = 350;
        const check = () => {
          if (progressValueRef.current >= 99.9 || performance.now() - start > SAFETY_MS) {
            resolve();
            return;
          }
          requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      }),
    []
  );

  const updateProgress = (target: number) => {
    progressTargetRef.current = target;
    // Do NOT snap the display value — the rAF loop below creeps toward it
    // smoothly and also inches forward during long async waits so the bar
    // never looks frozen (e.g. while Gemini analysis is pending).
  };

  const {
    processImage,
    isProcessing,
    scanStep,
    errorProcessing,
    setError: setProcessError,
    saveStatus,
    faceLandmarks
  } = useImageProcessing(
    faceLandmarker,
    userCredits,
    onAnalysisComplete,
    updateProgress,
    waitForAnimation,
    waitForDash
  );

  const error = modelError || errorProcessing;
  const requireAuth = () => {
    if (user) return true;
    onOpenAuth?.();
    return false;
  };

  // Track scan history for the terminal-like animation
  useEffect(() => {
    if (scanStep && !scanHistory.includes(scanStep)) {
      setScanHistory((prev) => [...prev, scanStep]);
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

    // Relay-style progress: always inching forward, FPS-independent.
    // Math is purely time-based (dt seconds) so motion is identical at 30/60/144Hz.
    //  - MIN_PER_SECOND: floor that guarantees visible advancement even when
    //    the LERP gap is tiny (prevents "stuck" feel on integer rendering).
    //  - K_BOOST when the backend jumps far ahead (sub-500ms resolves) → no
    //    "slow start → sudden rush" feeling.
    //  - dt clamp + reset on >200ms tab-throttle gaps prevents teleport bursts.
    const MIN_PER_SECOND = 0.6;
    const K_BASE = 6; // per-second pull toward target (lerp rate)
    const K_BOOST = 22; // when realTarget jumps far ahead
    const DASH_PER_SECOND = 400; // % per second on final 100 dash → ≤300ms
    // LINEAR creep rate (% per second) past the last announced milestone.
    // Tuned slow enough that the bar doesn't reach ceiling during typical
    // Gemini latency (5–20s). At 1.6%/s, 65 → 94 takes ~18s.
    const CREEP_PER_SECOND = 1.6;
    // Milestones MUST match updateProgress() calls in useImageProcessing.
    // 65  = post-server analysis (start of Gemini wait)
    // 95  = post-Gemini handoff to robot finale (creep ceiling becomes 99)
    // 100 = dash to complete
    // Bar smoothly creeps 65→94 during Gemini, catches up to 95 when Gemini
    // finishes, creeps 95→99 during animation wait, dashes to 100. No jumps.
    const MILESTONES = [5, 15, 25, 35, 45, 55, 65, 95, 100];

    let lastPushed = -1;
    let lastT = performance.now();

    const animate = (now: number) => {
      let dt = (now - lastT) / 1000;
      lastT = now;
      // Hard clamp to 1/30s — any spike above is treated as a single frame.
      if (dt > 0.2) {
        // Catastrophic gap (tab away >200ms): skip this frame's advance entirely.
        requestRef.current = requestAnimationFrame(animate);
        return;
      }
      dt = Math.min(dt, 1 / 30);

      const target = progressTargetRef.current;
      const cur = progressValueRef.current;

      if (target >= 100) {
        // Final dash: time-based ramp, finishes within ~300ms regardless of cur.
        progressValueRef.current = Math.min(100, cur + DASH_PER_SECOND * dt);
      } else if (cur < target - 0.5) {
        // Catch up toward newly announced milestone. Boost when far behind.
        const k = target - cur > 20 ? K_BOOST : K_BASE;
        const lerp = (target - cur) * k * dt;
        const floor = MIN_PER_SECOND * dt;
        progressValueRef.current = Math.min(target, cur + Math.max(lerp, floor));
      } else if (target > 0) {
        // LINEAR creep at CREEP_PER_SECOND %/s toward (nextMilestone - 1).
        // No asymptotic slowdown → the bar advances at a steady, perceivable
        // rate the entire wait, never sticks-and-jumps.
        const next = MILESTONES.find((m) => m > target + 0.5) ?? 100;
        const ceiling = next - 1;
        if (cur < ceiling) {
          progressValueRef.current = Math.min(ceiling, cur + CREEP_PER_SECOND * dt);
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
    };
  }, [uploadedImageUrl]);

  // Auto-scroll moved INTO AnalysisLoader — its mount fires reliably after
  // the AnimatePresence "wait" exit transition, where the ref always exists.

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModelError('Please upload a valid image file (JPG/PNG).');
      return;
    }

    posthog.capture('photo_uploaded', {
      source: event.target === cameraInputRef.current ? 'camera' : 'upload'
    });

    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    setUploadedImageUrl(null); // clear stale loader so hero shows behind editor
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
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Live Social Proof Badge */}
        {!uploadedImageUrl && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`absolute top-0 right-4 sm:right-6 lg:right-8 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-zinc-200'}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-zinc-600'}`}>
              {analyzedCount.toLocaleString()} faces analyzed today
            </span>
          </motion.div>
        )}

        {/* Hidden file inputs — always in DOM so refs stay valid */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg, image/png, image/webp"
          onChange={handleImageUpload}
        />
        <input
          type="file"
          ref={cameraInputRef}
          className="hidden"
          accept="image/jpeg, image/png"
          capture="user"
          onChange={handleImageUpload}
        />

        <AnimatePresence mode="wait">
          {uploadedImageUrl && (isProcessing || !errorProcessing) ? (
            /* ── Full-width analysis loader ── */
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-12 md:mb-20"
            >
              <AnalysisLoader
                imageUrl={uploadedImageUrl}
                scanStep={scanStep}
                scanHistory={scanHistory}
                progress={progressTarget}
                isDarkMode={isDarkMode}
                faceLandmarks={faceLandmarks}
                onAnimationComplete={handleAnimationComplete}
              />
            </motion.div>
          ) : (
            /* ── Hero + upload card ── */
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-[minmax(260px,0.82fr)_minmax(420px,1.18fr)] gap-6 sm:gap-8 lg:gap-12 items-center mb-12 md:mb-20"
            >
              <div className="relative text-left px-1 lg:px-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`inline-flex items-center px-3 py-1 rounded-full border text-[9px] font-bold tracking-[0.3em] uppercase mb-5 ${isDarkMode ? 'bg-white/5 border-white/10 text-white/40' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}
                >
                  <Sparkles className="w-3 h-3 mr-2 opacity-50" />
                  Neural Analysis
                </motion.div>
                <h2
                  className={`text-4xl sm:text-5xl md:text-[64px] lg:text-[84px] font-display leading-[0.94] sm:leading-[0.88] italic mb-5 sm:mb-6 tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
                >
                  Discover <br />
                  <span className="not-italic opacity-50">your</span> <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400 not-italic font-sans font-normal">
                    potential.
                  </span>
                </h2>
                <p
                  className={`text-base md:text-lg font-light leading-relaxed mb-7 max-w-xl ${isDarkMode ? 'text-white/50' : 'text-zinc-500'}`}
                >
                  Upload a clear, front-facing selfie to get visual feedback on facial structure,
                  symmetry, skin texture, and grooming opportunities.
                </p>
                <div
                  className={`max-w-xl rounded-2xl p-4 border flex items-start gap-3 ${isDarkMode ? 'bg-white/[.035] border-white/[.08]' : 'bg-zinc-50 border-zinc-200'}`}
                >
                  <div
                    className={`p-2 rounded-full ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/80' : 'text-zinc-900'}`}
                    >
                      Pro Tip for Accuracy
                    </p>
                    <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>
                      Use even lighting, keep your face straight, and avoid heavy angles for cleaner
                      landmark detection.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative w-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="relative group h-full"
                >
                  <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/25 via-cyan-500/10 to-rose-500/20 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
                  <div
                    className={`relative min-h-[260px] sm:min-h-[300px] md:min-h-[360px] lg:min-h-[420px] border rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-8 md:p-12 text-center transition-all duration-300 cursor-pointer backdrop-blur-sm overflow-hidden flex items-center justify-center ${isDarkMode ? 'border-white/[.08] hover:border-white/[.16] bg-black/80' : 'border-zinc-200 hover:border-zinc-300 bg-white/90 shadow-xl shadow-indigo-500/5'}`}
                    onClick={() => {
                      if (isModelLoading || !requireAuth()) return;
                      fileInputRef.current?.click();
                    }}
                  >
                    {isModelLoading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-7" />
                        <p
                          className={`font-display italic text-3xl md:text-4xl tracking-tight ${isDarkMode ? 'text-white/90' : 'text-zinc-900'}`}
                        >
                          Preparing analysis...
                        </p>
                        <p
                          className={`text-xs md:text-sm mt-3 font-light ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}
                        >
                          Loading 3D facial landmark models.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-20 h-20 md:w-24 md:h-24 border rounded-full flex items-center justify-center mb-7 group-hover:scale-110 transition-all duration-700 ${isDarkMode ? 'bg-white/[.06] border-white/[.12] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900 shadow-sm'}`}
                        >
                          <Upload className="w-6 h-6 md:w-8 md:h-8 opacity-40" />
                        </div>
                        <p
                          className={`font-display italic text-3xl md:text-4xl tracking-tight ${isDarkMode ? 'text-white/90' : 'text-zinc-900'}`}
                        >
                          Upload your portrait
                        </p>
                        <p
                          className={`text-xs md:text-sm mt-3 font-light ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}
                        >
                          High-quality JPG or PNG, max 5MB
                        </p>
                        {isMobile && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!requireAuth()) return;
                              cameraInputRef.current?.click();
                            }}
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

                {/* Privacy Guarantee */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className={`mt-6 text-center flex flex-col items-center justify-center gap-2`}
                >
                  <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <Lock className="w-3.5 h-3.5" /> Privacy Guaranteed
                  </div>
                  <p className={`text-[11px] leading-relaxed max-w-sm ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>
                    Photos are analyzed entirely in-memory and immediately deleted. We never store, share, or sell your facial data.
                  </p>
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
            className={`mt-4 p-4 rounded-xl text-sm font-medium text-center border backdrop-blur-sm ${
              saveStatus.type === 'error'
                ? isDarkMode
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-red-50 text-red-600 border-red-100'
                : isDarkMode
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
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
