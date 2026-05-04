import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2, Eye, Cpu, BrainCircuit, FileBarChart2, UploadCloud } from 'lucide-react';
import { cn } from '../../lib/utils';
import { RobotScanCanvas } from './canvas/RobotScanCanvas';

const PHASES = [
  { id: 'upload',    label: 'Upload',     Icon: UploadCloud,    maxProgress: 18  },
  { id: 'detect',    label: 'Detection',  Icon: Eye,            maxProgress: 45  },
  { id: 'metrics',   label: 'Biometrics', Icon: Cpu,            maxProgress: 65  },
  { id: 'ai',        label: 'AI Analysis',Icon: BrainCircuit,   maxProgress: 88  },
  { id: 'report',    label: 'Report',     Icon: FileBarChart2,  maxProgress: 100 },
];

interface StepEntry {
  text: string;
  ts: number;
}

interface Props {
  imageUrl: string;
  scanStep: string;
  scanHistory: string[];
  progress: number;
  isDarkMode: boolean;
}

function useSmoothedProgress(target: number) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const tick = () => {
      const diff = target - displayRef.current;
      if (Math.abs(diff) < 0.15) {
        displayRef.current = target;
      } else {
        displayRef.current += diff * 0.07;
      }
      setDisplay(Math.min(100, Math.round(displayRef.current * 10) / 10));
      if (Math.abs(target - displayRef.current) > 0.1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return display;
}

export function AnalysisLoader({ imageUrl, scanStep, scanHistory, progress, isDarkMode }: Props) {
  const smoothProgress = useSmoothedProgress(progress);

  const currentPhaseIdx = PHASES.findIndex((p, i) => {
    const prev = PHASES[i - 1]?.maxProgress ?? 0;
    return smoothProgress >= prev && smoothProgress < p.maxProgress;
  });
  const safePhaseIdx = currentPhaseIdx === -1 ? PHASES.length - 1 : currentPhaseIdx;

  // Build step entries with timestamps
  const [stepEntries, setStepEntries] = useState<StepEntry[]>([]);
  const startRef = useRef(Date.now());
  useEffect(() => {
    if (!scanStep) return;
    setStepEntries(prev => {
      if (prev.length > 0 && prev[prev.length - 1].text === scanStep) return prev;
      return [...prev, { text: scanStep, ts: Date.now() - startRef.current }];
    });
  }, [scanStep]);

  const dark = isDarkMode;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Phase bar ── */}
      <div className="flex items-center gap-0 mb-8">
        {PHASES.map((phase, i) => {
          const done = i < safePhaseIdx;
          const active = i === safePhaseIdx;
          const { Icon } = phase;
          return (
            <React.Fragment key={phase.id}>
              <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 relative",
                  done  ? (dark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600') :
                  active ? (dark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600') :
                           (dark ? 'bg-white/5 text-white/20' : 'bg-zinc-100 text-zinc-300')
                )}>
                  {done ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : active ? (
                    <>
                      <motion.div
                        className={cn("absolute inset-0 rounded-full", dark ? 'bg-indigo-500/20' : 'bg-indigo-200/60')}
                        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <Icon className="w-4 h-4 relative z-10" />
                    </>
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-widest text-center leading-none",
                  done  ? (dark ? 'text-emerald-400/70' : 'text-emerald-600/70') :
                  active ? (dark ? 'text-indigo-400' : 'text-indigo-600') :
                           (dark ? 'text-white/15' : 'text-zinc-300')
                )}>{phase.label}</span>
              </div>
              {i < PHASES.length - 1 && (
                <div className="flex-1 h-px mx-1 relative overflow-hidden" style={{ maxWidth: 48 }}>
                  <div className={cn("absolute inset-0", dark ? 'bg-white/8' : 'bg-zinc-200')} />
                  {i < safePhaseIdx && (
                    <motion.div
                      className={cn("absolute inset-0", dark ? 'bg-emerald-400' : 'bg-emerald-500')}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      style={{ transformOrigin: 'left' }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Main grid ── */}
      <div className="flex flex-col md:flex-row gap-6 items-start">

        {/* ── Left: image with scan overlay ── */}
        <div className="w-full md:w-auto md:shrink-0 flex items-center justify-center">
          <RobotScanCanvas imageUrl={imageUrl} progress={smoothProgress} isDarkMode={dark} />
        </div>

        {/* ── Right: log + stats ── */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">

          {/* Current step hero */}
          <div className={cn("rounded-2xl p-4 border", dark ? 'bg-white/3 border-white/5' : 'bg-zinc-50 border-zinc-200/80')}>
            <p className={cn("text-[9px] font-black uppercase tracking-[0.25em] mb-2", dark ? 'text-white/25' : 'text-zinc-400')}>
              {PHASES[safePhaseIdx]?.label}
            </p>
            <div className="flex items-center gap-3">
              <Loader2 className={cn("w-4 h-4 shrink-0 animate-spin", dark ? 'text-indigo-400' : 'text-indigo-500')} />
              <AnimatePresence mode="wait">
                <motion.p
                  key={scanStep}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className={cn("text-sm font-medium", dark ? 'text-white/90' : 'text-zinc-900')}
                >
                  {scanStep || 'Initializing…'}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Step log */}
          <div className={cn("rounded-2xl border overflow-hidden", dark ? 'border-white/5 bg-black/30' : 'border-zinc-200/80 bg-white')}>
            <div className={cn("px-4 py-2.5 border-b flex items-center gap-2", dark ? 'border-white/5' : 'border-zinc-100')}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <span className={cn("text-[10px] font-mono ml-1", dark ? 'text-white/20' : 'text-zinc-400')}>scan_log</span>
            </div>
            <div className="p-3 space-y-1.5 min-h-[120px] max-h-[160px] overflow-hidden">
              <AnimatePresence initial={false}>
                {stepEntries.slice(-6).map((entry, i, arr) => {
                  const isCurrent = i === arr.length - 1;
                  const elapsed = (entry.ts / 1000).toFixed(1);
                  return (
                    <motion.div
                      key={entry.text}
                      initial={{ opacity: 0, x: -8, height: 0 }}
                      animate={{ opacity: isCurrent ? 1 : 0.45, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35 }}
                      className="flex items-center gap-2.5 overflow-hidden"
                    >
                      <span className={cn("text-[10px] font-mono tabular-nums shrink-0 w-10 text-right", dark ? 'text-white/15' : 'text-zinc-300')}>
                        +{elapsed}s
                      </span>
                      {isCurrent ? (
                        <Loader2 className={cn("w-3 h-3 shrink-0 animate-spin", dark ? 'text-indigo-400' : 'text-indigo-500')} />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-500" />
                      )}
                      <span className={cn("text-[11px] font-mono truncate", isCurrent ? (dark ? 'text-indigo-300' : 'text-indigo-600') : (dark ? 'text-white/40' : 'text-zinc-500'))}>
                        {entry.text}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Landmarks',    value: smoothProgress >= 35 ? '468 pts' : null, color: 'emerald' },
              { label: 'Face Quality', value: smoothProgress >= 46 ? 'Verified' : null, color: 'sky' },
              { label: 'Symmetry',     value: smoothProgress >= 56 ? 'Measuring' : null, color: 'violet' },
              { label: 'AI Engine',    value: 'Gemini Flash', color: 'amber', always: true },
            ].map(stat => (
              <div key={stat.label} className={cn(
                "rounded-xl p-3 border",
                dark ? 'bg-white/2 border-white/5' : 'bg-zinc-50 border-zinc-200/80'
              )}>
                <p className={cn("text-[9px] font-bold uppercase tracking-widest mb-1", dark ? 'text-white/25' : 'text-zinc-400')}>{stat.label}</p>
                {(stat.value || stat.always) ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      stat.color === 'emerald' && (dark ? 'text-emerald-400' : 'text-emerald-600'),
                      stat.color === 'sky'     && (dark ? 'text-sky-400'     : 'text-sky-600'),
                      stat.color === 'violet'  && (dark ? 'text-violet-400'  : 'text-violet-600'),
                      stat.color === 'amber'   && (dark ? 'text-amber-400'   : 'text-amber-600'),
                    )}
                  >
                    {stat.value}
                  </motion.p>
                ) : (
                  <div className={cn("h-3 w-12 rounded animate-pulse", dark ? 'bg-white/8' : 'bg-zinc-200')} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom progress bar ── */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className={cn("text-[10px] font-mono", dark ? 'text-white/25' : 'text-zinc-400')}>
            {PHASES[safePhaseIdx]?.label ?? 'Processing'}
          </span>
          <span className={cn("text-[10px] font-mono tabular-nums font-bold", dark ? 'text-white/40' : 'text-zinc-500')}>
            {Math.round(smoothProgress)}%
          </span>
        </div>
        <div className={cn("w-full h-[3px] rounded-full overflow-hidden", dark ? 'bg-white/5' : 'bg-zinc-200')}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400"
            style={{ width: `${smoothProgress}%` }}
            transition={{ type: 'spring', damping: 30, stiffness: 120 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

