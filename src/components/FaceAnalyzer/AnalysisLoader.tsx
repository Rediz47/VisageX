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
}

// Smoothed progress
function useSmoothed(target: number) {
  const [val, setVal] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      ref.current = ref.current + (target - ref.current) * 0.06;
      if (Math.abs(target - ref.current) < 0.05) ref.current = target;
      setVal(ref.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

// ═══════════════════════════════════════════════════════════════
// AnalysisLoader — Big photo + bot scene, minimal chrome
// ═══════════════════════════════════════════════════════════════
export function AnalysisLoader({ imageUrl, scanStep, progress, isDarkMode, faceLandmarks }: Props) {
  const smooth = useSmoothed(progress);
  const [size, setSize] = useState({ w: 480, h: 640 });

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

  return (
    <div className="w-full flex flex-col items-center gap-6 md:gap-8">
      {/* ── Title ── */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-[10px] font-mono tracking-[0.35em] uppercase mb-3 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}
        >
          Live Analysis
        </motion.div>
        <h2 className={`text-3xl md:text-5xl font-display italic tracking-tight leading-[0.95] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
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
        />
      </motion.div>

      {/* ── Progress + step ── */}
      <div className="w-full max-w-md">
        <div className="flex items-end justify-between mb-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={scanStep}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`text-sm font-medium ${isDarkMode ? 'text-white/80' : 'text-zinc-700'}`}
            >
              {scanStep || 'Warming up…'}
            </motion.span>
          </AnimatePresence>
          <span className={`text-sm font-mono tabular-nums ${isDarkMode ? 'text-white/60' : 'text-zinc-500'}`}>
            {Math.floor(smooth)}%
          </span>
        </div>

        <div className={`h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-zinc-200'}`}>
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${smooth}%`,
              background: 'linear-gradient(90deg, #818cf8, #f472b6, #fbbf24)',
            }}
            transition={{ type: 'spring', damping: 30 }}
          />
        </div>
      </div>
    </div>
  );
}
