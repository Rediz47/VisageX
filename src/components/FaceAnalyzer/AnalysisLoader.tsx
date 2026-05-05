import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RobotScanCanvas } from './canvas/RobotScanCanvas';

interface Props {
  imageUrl: string;
  scanStep: string;
  scanHistory: string[];
  progress: number;
  isDarkMode: boolean;
  faceLandmarks?: Array<{ x: number; y: number }> | null;
  onAnimationComplete?: () => void;
}

// FPS-independent smoothed progress display.
// Was previously double-smoothing the already-smooth progressTarget with a
// per-frame factor and no time floor — causing the visual bar to lag the
// authoritative value by up to ~1s and masking the dash finale entirely.
// Now: time-based lerp (k per second) + minimum-per-second floor + dt clamp.
function useSmoothed(target: number) {
  const [val, setVal] = useState(0);
  const ref = useRef(0);
  const targetRef = useRef(target);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const K = 12; // per-second lerp pull
    const MIN_PER_SECOND = 1.5; // %/s visual floor — guarantees movement
    const loop = (now: number) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.2) {
        raf = requestAnimationFrame(loop);
        return;
      }
      dt = Math.min(dt, 1 / 30);
      const t = targetRef.current;
      const gap = t - ref.current;
      if (Math.abs(gap) < 0.05) {
        ref.current = t;
      } else {
        const move = Math.max(Math.abs(gap) * K * dt, MIN_PER_SECOND * dt);
        ref.current += Math.sign(gap) * Math.min(Math.abs(gap), move);
      }
      setVal(ref.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return val;
}

// ═══════════════════════════════════════════════════════════════
// AnalysisLoader — Big photo + bot scene, minimal chrome
// ═══════════════════════════════════════════════════════════════
export function AnalysisLoader({
  imageUrl,
  scanStep,
  progress,
  isDarkMode,
  faceLandmarks,
  onAnimationComplete
}: Props) {
  const smooth = useSmoothed(progress);
  const [size, setSize] = useState({ w: 480, h: 640 });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resize = () => {
      const vw = Math.min(window.innerWidth - 32, 560);
      // Portrait aspect ratio 3:4
      const w = vw;
      const h = Math.round(w * 1.33);
      setSize({ w, h });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Auto-scroll the loader to viewport center on mount. Respects user intent:
  // any wheel/touch/keyboard scroll cancels the auto-scroll. Retries up to
  // 1s in case layout isn't settled yet (image loading, motion exit anim).
  useEffect(() => {
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };
    window.addEventListener('wheel', cancel, { passive: true, once: true });
    window.addEventListener('touchmove', cancel, { passive: true, once: true });
    window.addEventListener('keydown', cancel, { once: true });

    let attempts = 0;
    const tryScroll = () => {
      if (cancelled) return;
      const el = rootRef.current;
      if (el && el.offsetHeight > 100) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (attempts++ < 20) setTimeout(tryScroll, 50);
    };
    // Start on next frame so the motion exit/enter has a chance to commit.
    const raf = requestAnimationFrame(tryScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchmove', cancel);
      window.removeEventListener('keydown', cancel);
    };
  }, []);

  return (
    <div ref={rootRef} className="w-full flex flex-col items-center gap-6 md:gap-8">
      {/* ── Title ── */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-[10px] font-mono tracking-[0.35em] uppercase mb-3 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}
        >
          Live Analysis
        </motion.div>
        <h2
          className={`text-3xl md:text-5xl font-display italic tracking-tight leading-[0.95] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
        >
          Pixl is scanning
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-amber-400 not-italic font-sans">
            your portrait.
          </span>
        </h2>
      </div>

      {/* ── Big canvas ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
        style={{ width: size.w, height: size.h }}
      >
        <RobotScanCanvas
          imageUrl={imageUrl}
          progress={smooth}
          isDarkMode={isDarkMode}
          landmarks={faceLandmarks}
          width={size.w}
          height={size.h}
          onAnimationComplete={onAnimationComplete}
        />
      </motion.div>

      {/* ── Advanced Progress ── */}
      <div className="w-full max-w-md">
        {/* Step label + percentage */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={scanStep}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.2 }}
                className={`text-[13px] font-medium truncate ${isDarkMode ? 'text-white/80' : 'text-zinc-700'}`}
              >
                {scanStep || 'Warming up…'}
              </motion.span>
            </AnimatePresence>
          </div>
          <motion.span
            key={Math.floor(smooth)}
            initial={{ opacity: 0.5, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-sm font-mono tabular-nums font-semibold ml-3 shrink-0 ${isDarkMode ? 'text-white/70' : 'text-zinc-600'}`}
          >
            {Math.floor(smooth)}%
          </motion.span>
        </div>

        {/* Bar track */}
        <div
          className={`relative h-[6px] rounded-full overflow-hidden ${isDarkMode ? 'bg-white/[0.06]' : 'bg-zinc-200/80'}`}
        >
          {/* Filled bar */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${smooth}%`,
              background:
                'linear-gradient(90deg, #818cf8 0%, #a78bfa 25%, #f472b6 55%, #fb7185 75%, #fbbf24 100%)'
            }}
            transition={{ type: 'spring', damping: 30 }}
          />
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
            style={{ width: `${smooth}%` }}
            transition={{ type: 'spring', damping: 30 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s ease-in-out infinite'
              }}
            />
          </motion.div>
          {/* Glow pulse on leading edge */}
          {smooth > 1 && smooth < 99.5 && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
              style={{
                left: `${smooth}%`,
                transform: `translate(-50%, -50%)`,
                width: 14,
                height: 14,
                background: 'radial-gradient(circle, rgba(244,114,182,0.7) 0%, transparent 70%)',
                filter: 'blur(3px)'
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        {/* Phase milestone markers */}
        <div className="relative h-4 mt-1">
          {[
            { at: 15, label: 'Detect' },
            { at: 35, label: 'Structure' },
            { at: 55, label: 'Metrics' },
            { at: 75, label: 'AI Scan' },
            { at: 92, label: 'Report' }
          ].map((m) => (
            <div
              key={m.at}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${m.at}%`, transform: 'translateX(-50%)' }}
            >
              <div
                className={`w-1 h-1 rounded-full transition-colors duration-500 ${
                  smooth >= m.at ? 'bg-indigo-400' : isDarkMode ? 'bg-white/15' : 'bg-zinc-300'
                }`}
              />
              <span
                className={`text-[8px] font-mono uppercase tracking-wider mt-[2px] transition-colors duration-500 ${
                  smooth >= m.at
                    ? isDarkMode
                      ? 'text-white/50'
                      : 'text-zinc-500'
                    : isDarkMode
                      ? 'text-white/15'
                      : 'text-zinc-300'
                }`}
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Shimmer keyframe (injected once) */}
      <style>{`@keyframes shimmer{0%,100%{background-position:200% 0}50%{background-position:-200% 0}}`}</style>
    </div>
  );
}
