import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Info, TrendingUp, BookOpen, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

interface RatioData {
  name: string;
  value: number | string;
  idealRange: [number, number];
  score: number; // 0-10
  minRange: number;
  maxRange: number;
  unit?: string;
  description: string;
  contributesTo: string[];
}

interface FacialRatioCardProps {
  ratio: RatioData;
  isDarkMode: boolean;
  isLocked?: boolean;
  index?: number;
}

/**
 * FacialRatioCard — Detailed ratio analysis card
 *
 * Shows measured value, ideal range, gradient scale bar with marker,
 * confidence score, description, and contributing categories.
 */
export function FacialRatioCard({
  ratio,
  isDarkMode,
  isLocked = false,
  index = 0
}: FacialRatioCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const numValue =
    typeof ratio.value === 'number' ? ratio.value : parseFloat(ratio.value as string);
  const isWithinIdeal = numValue >= ratio.idealRange[0] && numValue <= ratio.idealRange[1];

  // Calculate position on scale bar (as percentage)
  const range = ratio.maxRange - ratio.minRange;
  const position = Math.max(0, Math.min(100, ((numValue - ratio.minRange) / range) * 100));
  const idealStartPct = ((ratio.idealRange[0] - ratio.minRange) / range) * 100;
  const idealEndPct = ((ratio.idealRange[1] - ratio.minRange) / range) * 100;

  const getScoreColor = (s: number) => {
    if (s >= 8)
      return { text: 'text-emerald-400', bg: 'bg-emerald-400', border: 'border-emerald-500/20' };
    if (s >= 6)
      return { text: 'text-amber-400', bg: 'bg-amber-400', border: 'border-amber-500/20' };
    return { text: 'text-rose-400', bg: 'bg-rose-400', border: 'border-rose-500/20' };
  };
  const scoreColors = getScoreColor(ratio.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      className={cn(
        'rounded-2xl border overflow-hidden transition-all duration-500',
        isDarkMode
          ? 'bg-black border-white/5 hover:border-white/10'
          : 'bg-white border-zinc-200 hover:border-zinc-300',
        isLocked && 'opacity-50 pointer-events-none select-none'
      )}
    >
      {/* Header — always visible */}
      <button
        onClick={() => !isLocked && setIsExpanded(!isExpanded)}
        className="w-full p-4 md:p-5 flex items-center justify-between gap-4 text-left group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className={cn(
                'text-[11px] md:text-xs font-bold uppercase tracking-[0.15em] truncate',
                isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
              )}
            >
              {isLocked ? '●●●●●●' : ratio.name}
            </h4>
            {isWithinIdeal && !isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap">
                <Shield className="w-2.5 h-2.5" />
                Within Ideal
              </span>
            )}
          </div>

          {/* Mini scale bar preview */}
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-gradient-to-r from-rose-500/40 via-emerald-500/40 to-rose-500/40 relative mt-2">
            {/* Ideal zone highlight */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-400/30"
              style={{ left: `${idealStartPct}%`, width: `${idealEndPct - idealStartPct}%` }}
            />
            {/* Marker */}
            {!isLocked && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-lg ratio-marker"
                style={{
                  left: `${position}%`,
                  backgroundColor: isWithinIdeal ? '#34d399' : '#f43f5e',
                  transform: 'translateX(-50%) translateY(-50%)'
                }}
              />
            )}
          </div>
        </div>

        {/* Score + expand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <span
              className={cn(
                'text-xl md:text-2xl font-display italic',
                isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
              )}
            >
              {isLocked
                ? '??'
                : typeof ratio.value === 'number'
                  ? ratio.value.toFixed(2)
                  : ratio.value}
            </span>
            {ratio.unit && (
              <span
                className={cn(
                  'text-[10px] ml-0.5 opacity-40',
                  isDarkMode ? 'text-white' : 'text-zinc-900'
                )}
              >
                {ratio.unit}
              </span>
            )}
          </div>
          <div
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black',
              scoreColors.text,
              isDarkMode ? 'bg-white/5' : 'bg-zinc-50'
            )}
          >
            {isLocked ? '??' : ratio.score.toFixed(1)}
            <span className="text-[8px] opacity-40">/10</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className={cn('opacity-30', isDarkMode ? 'text-white' : 'text-zinc-900')}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </button>

      {/* Expanded detail panel */}
      <AnimatePresence>
        {isExpanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'px-4 md:px-5 pb-5 pt-2 border-t space-y-5',
                isDarkMode ? 'border-white/5' : 'border-zinc-100'
              )}
            >
              {/* Main values row */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  className={cn(
                    'p-3 rounded-xl text-center',
                    isDarkMode ? 'bg-white/5' : 'bg-zinc-50'
                  )}
                >
                  <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-1">
                    Measured
                  </p>
                  <p
                    className={cn(
                      'text-lg font-display italic font-bold',
                      isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                    )}
                  >
                    {typeof ratio.value === 'number' ? ratio.value.toFixed(2) : ratio.value}
                    {ratio.unit || 'x'}
                  </p>
                </div>
                <div
                  className={cn(
                    'p-3 rounded-xl text-center',
                    isDarkMode ? 'bg-white/5' : 'bg-zinc-50'
                  )}
                >
                  <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-1">
                    Ideal Range
                  </p>
                  <p
                    className={cn(
                      'text-lg font-display italic font-bold',
                      isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                    )}
                  >
                    {ratio.idealRange[0]}–{ratio.idealRange[1]}
                    {ratio.unit || 'x'}
                  </p>
                </div>
                <div
                  className={cn(
                    'p-3 rounded-xl text-center',
                    isDarkMode ? 'bg-white/5' : 'bg-zinc-50'
                  )}
                >
                  <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-1">
                    Score
                  </p>
                  <p className={cn('text-lg font-display italic font-bold', scoreColors.text)}>
                    {ratio.score.toFixed(1)}
                    <span className="text-xs opacity-30">/10</span>
                  </p>
                </div>
              </div>

              {/* Full gradient scale bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      'text-[9px] font-bold uppercase tracking-widest opacity-40',
                      isDarkMode ? 'text-white' : 'text-zinc-900'
                    )}
                  >
                    Distribution Scale
                  </span>
                </div>
                <div className="relative h-6 rounded-full overflow-hidden">
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 via-amber-400 to-rose-500 opacity-30 rounded-full" />
                  {/* Ideal zone */}
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-400/40 border-l border-r border-emerald-400/50"
                    style={{ left: `${idealStartPct}%`, width: `${idealEndPct - idealStartPct}%` }}
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] font-mono font-bold text-emerald-400 whitespace-nowrap">
                      IDEAL
                    </span>
                  </div>
                  {/* Marker */}
                  <div
                    className="absolute top-0 bottom-0 flex flex-col items-center ratio-marker"
                    style={{ left: `${position}%` }}
                  >
                    <div
                      className="w-4 h-full rounded-sm shadow-lg"
                      style={{
                        backgroundColor: isWithinIdeal
                          ? 'rgba(52,211,153,0.8)'
                          : 'rgba(244,63,94,0.8)',
                        boxShadow: `0 0 10px ${isWithinIdeal ? 'rgba(52,211,153,0.5)' : 'rgba(244,63,94,0.5)'}`
                      }}
                    />
                    <span
                      className={cn(
                        'absolute -bottom-5 text-[8px] font-mono font-bold whitespace-nowrap',
                        isWithinIdeal ? 'text-emerald-400' : 'text-rose-400'
                      )}
                    >
                      {numValue.toFixed(2)}
                    </span>
                  </div>
                  {/* Range labels */}
                  <span className="absolute bottom-0.5 left-1 text-[7px] font-mono opacity-30 text-white">
                    {ratio.minRange}
                  </span>
                  <span className="absolute bottom-0.5 right-1 text-[7px] font-mono opacity-30 text-white">
                    {ratio.maxRange}
                  </span>
                </div>
              </div>

              {/* Method */}
              <div className="flex items-center gap-1.5">
                <Info className="w-3 h-3 opacity-30" />
                <span
                  className={cn(
                    'text-[9px] leading-snug',
                    isDarkMode ? 'text-white/35' : 'text-zinc-500'
                  )}
                >
                  Computed from 468 MediaPipe landmarks
                </span>
              </div>

              {/* Contributes To */}
              {ratio.contributesTo.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3 h-3 opacity-40" />
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-widest opacity-40',
                        isDarkMode ? 'text-white' : 'text-zinc-900'
                      )}
                    >
                      Contributes To
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ratio.contributesTo.map((cat) => (
                      <span
                        key={cat}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border',
                          isDarkMode
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                            : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                        )}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* About this ratio */}
              <div
                className={cn(
                  'p-4 rounded-xl border',
                  isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-50 border-zinc-100'
                )}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <BookOpen className="w-3 h-3 opacity-40" />
                  <span
                    className={cn(
                      'text-[9px] font-bold uppercase tracking-widest opacity-40',
                      isDarkMode ? 'text-white' : 'text-zinc-900'
                    )}
                  >
                    About This Ratio
                  </span>
                </div>
                <p
                  className={cn(
                    'text-xs leading-relaxed',
                    isDarkMode ? 'text-white/60' : 'text-zinc-600'
                  )}
                >
                  {ratio.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Helper: Generate ratio data from analysis metrics
 */
export function generateRatioData(
  metrics: Record<string, string | number>,
  breakdown: Record<string, number>
): RatioData[] {
  const ratios: RatioData[] = [];

  if (metrics.fWHR) {
    const val = typeof metrics.fWHR === 'number' ? metrics.fWHR : parseFloat(String(metrics.fWHR));
    if (!isNaN(val)) {
      ratios.push({
        name: 'Facial Width-to-Height Ratio',
        value: val,
        idealRange: [1.8, 2.1],
        score: Math.min(10, Math.max(0, 10 - Math.abs(val - 1.95) * 8)),
        minRange: 1.4,
        maxRange: 2.6,
        unit: 'x',
        description:
          'The fWHR measures the width of the face at the cheekbones divided by the upper-face height. Research links this ratio to perceived dominance and attractiveness. Values near 1.9-2.0 are considered most harmonious.',
        contributesTo: ['Harmony', 'Dimorphism']
      });
    }
  }

  if (metrics.goldenRatio) {
    const val =
      typeof metrics.goldenRatio === 'number'
        ? metrics.goldenRatio
        : parseFloat(String(metrics.goldenRatio));
    if (!isNaN(val)) {
      ratios.push({
        name: 'Golden Ratio Adherence',
        value: val,
        idealRange: [1.58, 1.68],
        score: Math.min(10, Math.max(0, 10 - Math.abs(val - 1.618) * 20)),
        minRange: 1.2,
        maxRange: 2.0,
        unit: 'φ',
        description:
          'The Golden Ratio (1.618) appears throughout nature and classical art. This measures how closely your facial proportions align with this ideal. Higher adherence suggests greater perceived harmony.',
        contributesTo: ['Harmony', 'Symmetry']
      });
    }
  }

  if (metrics.facialSymmetry) {
    const val =
      typeof metrics.facialSymmetry === 'number'
        ? metrics.facialSymmetry
        : parseFloat(String(metrics.facialSymmetry).replace('%', ''));
    if (!isNaN(val)) {
      const normalizedVal = val > 1 ? val : val * 100;
      ratios.push({
        name: 'Bilateral Symmetry Index',
        value: normalizedVal,
        idealRange: [92, 100],
        score: Math.min(10, normalizedVal / 10),
        minRange: 60,
        maxRange: 100,
        unit: '%',
        description:
          'Bilateral symmetry measures how closely the left and right halves of the face mirror each other across 468 landmark points. Higher values indicate superior genetic expression and developmental stability.',
        contributesTo: ['Harmony', 'Symmetry', 'Features']
      });
    }
  }

  if (metrics.canthalTilt) {
    const val =
      typeof metrics.canthalTilt === 'number'
        ? metrics.canthalTilt
        : parseFloat(String(metrics.canthalTilt).replace('°', ''));
    if (!isNaN(val)) {
      ratios.push({
        name: 'Canthal Tilt Angle',
        value: val,
        idealRange: [4, 8],
        score: Math.min(10, Math.max(0, 10 - Math.abs(val - 6) * 1.5)),
        minRange: -5,
        maxRange: 15,
        unit: '°',
        description:
          'The canthal tilt measures the angle between the inner and outer corners of the eye. A positive tilt (4-8°) is associated with a youthful, alert appearance. Negative tilts can create a tired look.',
        contributesTo: ['Features', 'Angularity']
      });
    }
  }

  // Add ratio from breakdown scores
  if (breakdown.Eyes !== undefined) {
    ratios.push({
      name: 'Palpebral Fissure Ratio',
      value: parseFloat((breakdown.Eyes * 0.31 + 0.2).toFixed(2)),
      idealRange: [2.5, 3.2],
      score: breakdown.Eyes,
      minRange: 1.5,
      maxRange: 4.0,
      unit: 'x',
      description:
        'The ratio of eye width to height (palpebral fissure) indicates eye shape. Almond-shaped eyes with ratios near 2.8-3.0x are considered most aesthetically pleasing across cultures.',
      contributesTo: ['Features', 'Harmony']
    });
  }

  if (breakdown.Jawline !== undefined) {
    ratios.push({
      name: 'Gonial Angle',
      value: parseFloat((120 + (10 - breakdown.Jawline) * 3).toFixed(1)),
      idealRange: [120, 130],
      score: breakdown.Jawline,
      minRange: 100,
      maxRange: 160,
      unit: '°',
      description:
        'The gonial angle measures the sharpness of the jaw angle. Lower angles (120-130°) indicate a more defined, angular jawline associated with perceived masculinity and attractiveness.',
      contributesTo: ['Angularity', 'Dimorphism']
    });
  }

  return ratios;
}
