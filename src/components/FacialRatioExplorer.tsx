import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, BookOpen, Zap, ChevronRight, ChevronLeft, BarChart2, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

import type { FacialRatioExplorerProps } from './facial-ratio/types';
import { RATIO_GROUP_MAP, RATIO_GROUPS } from './facial-ratio/types';
import { LerpLineCanvas } from './facial-ratio/LerpLineCanvas';
import { useRatioData } from './facial-ratio/useRatioData';

// LerpLineCanvas, useRatioData, types, and constants extracted to ./facial-ratio/

/**
 * FacialRatioExplorer — Split layout: face with animated lines (left) + ratio details (right)
 * 
 * When a ratio is selected, the corresponding measurement lines animate onto the face,
 * and the right panel shows the detailed explanation.
 */
export function FacialRatioExplorer({
  imageUrl,
  landmarks,
  cropInfo,
  metrics,
  breakdown,
  isDarkMode,
  isLocked = false,
}: FacialRatioExplorerProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Capture wheel events in the ratio list to prevent page scroll
  const handleRatioWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atTop = el.scrollTop <= 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

    // If scrolling down and at bottom, or scrolling up and at top, let page scroll
    // Otherwise, stop propagation to keep scroll in the card
    if ((e.deltaY > 0 && atBottom) || (e.deltaY < 0 && atTop)) {
      return; // Let page scroll
    }
    e.stopPropagation();
  }, []);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const displayIndex = hoverIndex !== null ? hoverIndex : activeIndex;

  // Map landmarks to normalized crop coordinates
  const points = useMemo(() => {
    if (!landmarks || !cropInfo || landmarks.length < 468) return null;
    const { cropX, cropY, imgWidth, imgHeight, cropW, cropH } = cropInfo;
    return landmarks.map((lm) => ({
      x: (lm.x * imgWidth - cropX) / cropW,
      y: (lm.y * imgHeight - cropY) / cropH,
    }));
  }, [landmarks, cropInfo]);

  // Build ratio visualization data from metrics + landmarks (extracted to useRatioData hook)
  const ratios = useRatioData(metrics, breakdown, points);

  // Auto-cycle disabled — user manually selects ratios

  const groupedRatios = useMemo(() =>
    RATIO_GROUPS.map(g => ({
      ...g,
      items: ratios.map((r, idx) => ({ r, idx })).filter(({ r }) => (RATIO_GROUP_MAP[r.shortName] ?? 'Other') === g.name),
    })).filter(g => g.items.length > 0)
  , [ratios]);

  const zoomFocus = useMemo(() => {
    const d = ratios[displayIndex];
    if (!points || !d) return { cx: 0.5, cy: 0.5 };
    const primaryIndices: number[] = [];
    d.lines.forEach(ln => {
      const m = ln.color.match(/,\s*([\d.]+)\s*\)$/);
      const alpha = m ? parseFloat(m[1]) : 0.9;
      if (alpha >= 0.7) primaryIndices.push(ln.from, ln.to);
    });
    if (!primaryIndices.length) return { cx: 0.5, cy: 0.5 };
    const validPts = primaryIndices.map(i => points[i]).filter(Boolean) as {x:number;y:number}[];
    if (!validPts.length) return { cx: 0.5, cy: 0.5 };
    const cx = validPts.reduce((a, p) => a + p.x, 0) / validPts.length;
    const cy = validPts.reduce((a, p) => a + p.y, 0) / validPts.length;
    return { cx: Math.max(0.2, Math.min(0.8, cx)), cy: Math.max(0.2, Math.min(0.8, cy)) };
  }, [ratios, displayIndex, points]);

  const active = ratios[activeIndex];
  const display = ratios[displayIndex] ?? active;
  if (!active || ratios.length === 0) return null;

  const avgScore = ratios.reduce((a, r) => a + r.score, 0) / Math.max(1, ratios.length);

  const numVal = typeof active.value === 'number' ? active.value : parseFloat(String(active.value));
  const isWithinIdeal = numVal >= active.idealRange[0] && numVal <= active.idealRange[1];
  const idealMid = (active.idealRange[0] + active.idealRange[1]) / 2;
  const deltaFromIdeal = numVal - idealMid;
  const absDelta = Math.abs(deltaFromIdeal);
  const isAbove = deltaFromIdeal > 0;

  // SVG viewBox dimensions
  const viewW = 1000;
  const viewH = cropInfo ? Math.round((cropInfo.cropH / cropInfo.cropW) * 1000) : 1200;

  // Scale bar helpers — derive min/max from idealRange
  const scaleMin = active.idealRange[0] * 0.6;
  const scaleMax = active.idealRange[1] * 1.5;
  const scaleRange = scaleMax - scaleMin;
  const markerPct = Math.max(2, Math.min(98, ((numVal - scaleMin) / scaleRange) * 100));
  const idealStartPct = Math.max(0, Math.min(100, ((active.idealRange[0] - scaleMin) / scaleRange) * 100));
  const idealEndPct = Math.max(0, Math.min(100, ((active.idealRange[1] - scaleMin) / scaleRange) * 100));

  // Population percentile estimate from score
  const percentile = Math.round(active.score * 9.5 + 5);

  const getScoreColor = (s: number) => {
    if (s >= 8) return { text: 'text-emerald-400', bg: 'bg-emerald-400', glow: 'shadow-emerald-500/40', border: 'border-emerald-500/30', light: 'text-emerald-600' };
    if (s >= 6) return { text: 'text-amber-400', bg: 'bg-amber-400', glow: 'shadow-amber-500/40', border: 'border-amber-500/30', light: 'text-amber-600' };
    return { text: 'text-rose-400', bg: 'bg-rose-400', glow: 'shadow-rose-500/40', border: 'border-rose-500/30', light: 'text-rose-600' };
  };
  const getScoreLabel = (s: number) => {
    if (s >= 9) return 'Elite';
    if (s >= 8) return 'Optimal';
    if (s >= 7) return 'Good';
    if (s >= 6) return 'Average';
    if (s >= 4) return 'Needs Work';
    return 'Poor';
  };
  const sc = getScoreColor(active.score);
  const [modalOpen, setModalOpen] = useState(false);

  const getBarGradient = (score: number) =>
    score >= 8
      ? 'linear-gradient(to right, #064e3b, #22c55e, #6ee7b7)'
      : score >= 6
        ? 'linear-gradient(to right, #78350f, #f97316, #fde68a)'
        : 'linear-gradient(to right, #7f1d1d, #ef4444, #f87171)';

  // Improvement tip based on direction
  const getImprovementTip = () => {
    if (isWithinIdeal) return 'This ratio is within the ideal range. Maintain your current approach to preserve this result.';
    if (isAbove) return `Your measurement is ${absDelta.toFixed(2)}${active.unit || ''} above the ideal midpoint. Focus on exercises and lifestyle changes that can help bring this closer to ${idealMid.toFixed(2)}${active.unit || ''}.`;
    return `Your measurement is ${absDelta.toFixed(2)}${active.unit || ''} below the ideal midpoint. Targeted interventions may help bring this ratio closer to ${idealMid.toFixed(2)}${active.unit || ''}.`;
  };

  const getQualityLabel = (s: number) => {
    if (s >= 9.5) return 'Perfect';
    if (s >= 9) return 'Elite';
    if (s >= 8) return 'Excellent Harmony';
    if (s >= 7) return 'Strong';
    if (s >= 6) return 'Balanced';
    if (s >= 5) return 'Average';
    return 'Developing';
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className={cn(
        'px-5 md:px-8 py-4 mb-4 rounded-2xl md:rounded-3xl border flex items-center justify-between gap-4',
        isDarkMode ? 'bg-zinc-950 border-white/8' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/50'
      )}>
        <div className="flex items-center gap-3">
          <BarChart2 className={cn('w-4 h-4', isDarkMode ? 'text-cyan-400' : 'text-cyan-600')} />
          <div>
            <h3 className={cn('text-base md:text-lg font-bold tracking-tight', isDarkMode ? 'text-zinc-100' : 'text-zinc-900')}>
              Facial Ratio Analysis
            </h3>
            <p className={cn('text-[10px] opacity-40', isDarkMode ? 'text-white' : 'text-zinc-900')}>
              {ratios.length} ratios measured
            </p>
          </div>
        </div>
        {/* Analysis coverage bar */}
        <div className="hidden md:flex flex-col gap-1.5 min-w-0 max-w-[42%]">
          <div className="flex items-center justify-between gap-3">
            <span className={cn('text-[8px] font-bold uppercase tracking-widest opacity-35 whitespace-nowrap', isDarkMode ? 'text-white' : 'text-zinc-900')}>
              {ratios.length} metrics
            </span>
            <span className={cn('text-[8px] font-bold tabular-nums whitespace-nowrap', getScoreColor(avgScore).text)}>
              avg {avgScore.toFixed(1)}/10
            </span>
          </div>
          <div className={cn('h-[3px] rounded-full overflow-hidden', isDarkMode ? 'bg-white/8' : 'bg-zinc-200')}>
            <motion.div
              className={cn('h-full rounded-full', getScoreColor(avgScore).bg)}
              initial={{ width: 0 }}
              animate={{ width: `${(avgScore / 10) * 100}%` }}
              transition={{ duration: 1.4, ease: 'easeOut', delay: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* ── Two-card split layout ── */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* CARD 1: Face photo with score overlay */}
        <div className={cn(
          'lg:w-[44%] flex-shrink-0 rounded-2xl md:rounded-3xl border overflow-hidden',
          isDarkMode ? 'bg-zinc-950 border-white/8' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/50'
        )}>
          <div className="relative overflow-hidden">
            {/* ── Slide wrapper — pans subtly toward the active measurement centroid ── */}
            <motion.div
              className="relative"
              animate={{
                x: points ? `${(0.5 - zoomFocus.cx) * 7}%` : '0%',
                y: points ? `${(0.5 - zoomFocus.cy) * 5}%` : '0%',
              }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <img
                src={imageUrl}
                alt="Face Analysis"
                className="w-full h-auto"
                referrerPolicy="no-referrer"
                style={{ filter: 'brightness(0.60) contrast(1.15) saturate(0.8)' }}
              />

              {/* gradient vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* ── Advanced Canvas Overlay — Lerp-smoothed lines at 60fps ── */}
              {points && (
                <LerpLineCanvas
                  display={display}
                  points={points}
                  viewW={viewW}
                  viewH={viewH}
                />
              )}
            </motion.div>

            {/* FaceIQ-style bottom score card */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pt-8 pb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-[8px] font-mono tracking-[0.22em] text-white/30 uppercase mb-0.5">
                    VisageX
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white leading-tight">
                        {display.name}
                      </h4>
                      <p className="text-[10px] text-white/40 mt-0.5">Score</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className={cn('text-3xl font-bold tabular-nums leading-none', getScoreColor(display.score).text)}>
                          {isLocked ? '??' : display.score.toFixed(1)}
                        </span>
                        <span className="text-white/25 text-sm">/10</span>
                      </div>
                      <p className={cn('text-[9px] font-semibold mt-0.5', getScoreColor(display.score).text)}>
                        {getQualityLabel(display.score)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* CARD 2: Scrollable ratio list */}
        <div
          className={cn(
            'w-full lg:w-[56%] rounded-2xl border relative',
            isDarkMode ? 'bg-zinc-950 border-white/8' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/50'
          )}
          style={{
            maxHeight: '640px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            isolation: 'isolate',
          }}
          onWheel={handleRatioWheel}
        >
            <div className="pt-1 pb-2">
            {groupedRatios.map(group => {
              const gAvg = group.items.reduce((a, { r }) => a + r.score, 0) / group.items.length;
              const gColor = getScoreColor(gAvg);
              return (
                <div key={group.name} className="mb-2">
                  {/* Group label */}
                  <div className="flex items-center justify-between px-3 md:px-5 pb-1 pt-4 mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] leading-none">{group.icon}</span>
                      <span className={cn('text-[8px] font-black uppercase tracking-[0.18em]', isDarkMode ? 'text-white/35' : 'text-zinc-400')}>
                        {group.name}
                      </span>
                      <span className={cn('text-[7px] font-bold px-1.5 py-0.5 rounded-full', isDarkMode ? 'bg-white/6 text-white/22' : 'bg-zinc-100 text-zinc-400')}>
                        {group.items.length}
                      </span>
                    </div>
                    <span className={cn('text-[8px] font-bold tabular-nums', gColor.text)}>avg {gAvg.toFixed(1)}</span>
                  </div>

                  {/* Premium card-style rows */}
                  <div className="flex flex-col px-2 md:px-3 gap-0.5">
                    {group.items.map(({ r, idx }) => {
                      const c = getScoreColor(r.score);
                      const rNum = typeof r.value === 'number' ? r.value : parseFloat(String(r.value));
                      const rIsWithin = rNum >= r.idealRange[0] && rNum <= r.idealRange[1];
                      const rMin = r.idealRange[0] * 0.6;
                      const rMax = r.idealRange[1] * 1.5;
                      const rPct = Math.max(2, Math.min(98, ((rNum - rMin) / (rMax - rMin)) * 100));
                      const isActive = idx === activeIndex;
                      const isHigh = r.score >= 8;
                      const isLow = r.score < 6;

                      return (
                        <motion.button
                          key={r.shortName}
                          onClick={() => { setActiveIndex(idx); setModalOpen(true); }}
                          onMouseEnter={() => setHoverIndex(idx)}
                          onMouseLeave={() => setHoverIndex(null)}
                          whileTap={{ scale: 0.995 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          className={cn(
                            'w-full flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2.5 md:py-3 text-left group relative rounded-xl border transition-all duration-150',
                            isDarkMode
                              ? (isActive ? 'bg-white/[0.06] border-white/[0.08]' : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.07]')
                              : (isActive ? 'bg-zinc-50 border-zinc-200 shadow-sm' : 'bg-transparent border-zinc-100/60 hover:bg-zinc-50/80 hover:border-zinc-200')
                          )}
                        >
                          {/* Left accent dot */}
                          <motion.div
                            className={cn('absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full', c.bg)}
                            initial={false}
                            animate={{ opacity: isActive ? 1 : 0, scaleY: isActive ? 1 : 0.3 }}
                            transition={{ duration: 0.2, ease: 'circOut' }}
                          />

                          {/* Left: Name + value */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'text-[14px] md:text-[15px] font-normal truncate transition-colors',
                                isActive
                                  ? (isDarkMode ? 'text-white' : 'text-zinc-900')
                                  : (isDarkMode ? 'text-white/70 group-hover:text-white/90' : 'text-zinc-600 group-hover:text-zinc-900')
                              )}>
                                {isLocked && idx > 0 ? '●●●●●●●' : r.name}
                              </span>
                              {rIsWithin && !isLocked && (
                                <span className={cn('text-[8px] font-semibold tracking-wide uppercase flex-shrink-0', isDarkMode ? 'text-emerald-400' : 'text-emerald-600')}>✓ IDEAL</span>
                              )}
                            </div>
                            {!isLocked && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                  'text-[10px] font-mono px-1.5 py-0.5 rounded',
                                  isDarkMode ? 'bg-white/5 text-white/30' : 'bg-zinc-100 text-zinc-400'
                                )}>
                                  {typeof r.value === 'number' ? r.value.toFixed(2) : r.value}{r.unit ?? ''}
                                </span>
                                {rIsWithin && (
                                  <span className={cn('text-[9px] font-medium', isDarkMode ? 'text-emerald-400/60' : 'text-emerald-600/60')}>
                                    {Math.round(((rNum - r.idealRange[0]) / (r.idealRange[1] - r.idealRange[0])) * 100)}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Center: Premium gradient bar with marker */}
                          <div className="w-24 md:w-32 flex-shrink-0">
                            <div className="relative h-[6px] rounded-full" style={{ background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                              {/* Gradient fill */}
                              <div className="absolute inset-0 rounded-full overflow-hidden">
                                <div
                                  className="absolute inset-0 rounded-full"
                                  style={{
                                    background: getBarGradient(r.score),
                                    opacity: isActive ? (isDarkMode ? 0.85 : 0.9) : (isDarkMode ? 0.3 : 0.28),
                                    transition: 'opacity 0.2s',
                                  }}
                                />
                              </div>
                              {/* Ideal range highlight zone */}
                              {(() => {
                                const idealS = Math.max(0, Math.min(100, ((r.idealRange[0] - (r.idealRange[0] * 0.6)) / ((r.idealRange[1] * 1.5) - (r.idealRange[0] * 0.6))) * 100));
                                const idealE = Math.max(0, Math.min(100, ((r.idealRange[1] - (r.idealRange[0] * 0.6)) / ((r.idealRange[1] * 1.5) - (r.idealRange[0] * 0.6))) * 100));
                                return (
                                  <div
                                    className="absolute top-0 bottom-0 rounded-full"
                                    style={{
                                      left: `${idealS}%`,
                                      width: `${idealE - idealS}%`,
                                      background: 'rgba(74,222,128,0.15)',
                                      boxShadow: '0 0 6px rgba(74,222,128,0.2)',
                                    }}
                                  />
                                );
                              })()}
                              {/* Score marker */}
                              {!isLocked && (
                                <motion.div
                                  className="absolute top-1/2 -translate-y-1/2"
                                  style={{ left: `${rPct}%`, marginLeft: '-7px' }}
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: isActive ? 1 : 0.7 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 18, delay: idx * 0.02 }}
                                >
                                  <div
                                    className="w-[14px] h-[14px] rounded-full border-2"
                                    style={{
                                      background: isDarkMode ? '#0f0f0f' : '#ffffff',
                                      borderColor: isHigh ? '#4ade80' : isLow ? '#f87171' : '#fbbf24',
                                      boxShadow: isActive
                                        ? `0 0 10px ${isHigh ? 'rgba(74,222,128,0.6)' : isLow ? 'rgba(248,113,113,0.6)' : 'rgba(251,191,36,0.6)'}, 0 1px 3px rgba(0,0,0,0.4)`
                                        : '0 1px 2px rgba(0,0,0,0.2)',
                                    }}
                                  />
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {/* Right: Score */}
                          <div className="w-14 md:w-16 flex-shrink-0 flex items-center justify-end gap-1.5">
                            {isLocked && idx > 0 ? (
                              <Shield className="w-5 h-5 opacity-25" />
                            ) : (
                              <>
                                <span className={cn(
                                  'text-[20px] md:text-[22px] font-light tabular-nums leading-none tracking-tight',
                                  isActive ? c.text : (isDarkMode ? 'text-white/85' : 'text-zinc-700')
                                )}>
                                  {r.score.toFixed(1)}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Chevron */}
                          <ChevronRight className={cn(
                            'w-4 h-4 flex-shrink-0 transition-colors',
                            isDarkMode ? 'text-white/15 group-hover:text-white/30' : 'text-zinc-200 group-hover:text-zinc-400'
                          )} />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>

            {/* Expanded detail panel for active ratio */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  'border-t px-5 md:px-7 py-5 flex flex-col gap-4',
                  isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-zinc-100 bg-zinc-50/40'
                )}
              >
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Measured', value: isLocked ? '??' : `${typeof active.value === 'number' ? active.value.toFixed(2) : active.value}${active.unit ?? ''}`, color: isDarkMode ? 'text-cyan-400' : 'text-cyan-600' },
                    { label: 'Ideal Range', value: `${active.idealRange[0]}–${active.idealRange[1]}${active.unit ?? ''}`, color: isDarkMode ? 'text-emerald-400' : 'text-emerald-600' },
                    { label: 'Population', value: isLocked ? '??' : `Top ${100 - percentile}%`, color: sc.text },
                  ].map(stat => (
                    <div key={stat.label} className={cn('p-3 rounded-xl border text-center', isDarkMode ? 'bg-white/[0.03] border-white/8' : 'bg-white border-zinc-200')}>
                      <p className={cn('text-[8px] font-bold uppercase tracking-widest mb-1 opacity-40', isDarkMode ? 'text-white' : 'text-zinc-900')}>{stat.label}</p>
                      <p className={cn('text-sm font-bold', stat.color)}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Description + tip in a two-column grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={cn('p-3 rounded-xl border', isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-blue-50/40 border-blue-100')}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BookOpen className={cn('w-3 h-3 opacity-40', isDarkMode ? 'text-indigo-300' : 'text-indigo-600')} />
                      <span className={cn('text-[8px] font-bold uppercase tracking-widest opacity-40', isDarkMode ? 'text-indigo-300' : 'text-indigo-700')}>Research Basis</span>
                    </div>
                    <p className={cn('text-[11px] leading-relaxed', isDarkMode ? 'text-white/55' : 'text-zinc-600')}>
                      {isLocked ? 'Unlock your report to see detailed scientific context.' : active.description}
                    </p>
                  </div>
                  {!isLocked && (
                    <div className={cn(
                      'p-3 rounded-xl border',
                      isWithinIdeal
                        ? (isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')
                        : (isDarkMode ? 'bg-amber-500/5 border-amber-500/15' : 'bg-amber-50 border-amber-200')
                    )}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Zap className={cn('w-3 h-3', isWithinIdeal ? 'text-emerald-400' : 'text-amber-400')} />
                        <span className={cn('text-[8px] font-bold uppercase tracking-widest', isWithinIdeal ? 'text-emerald-400' : 'text-amber-400')}>
                          {isWithinIdeal ? 'Optimal' : 'Improvement Tip'}
                        </span>
                      </div>
                      <p className={cn('text-[11px] leading-relaxed', isDarkMode ? 'text-white/55' : 'text-zinc-700')}>
                        {getImprovementTip()}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {modalOpen && (() => {
          const mo = ratios[activeIndex];
          if (!mo) return null;
          const moNum = typeof mo.value === 'number' ? mo.value : parseFloat(String(mo.value));
          const moWithin = moNum >= mo.idealRange[0] && moNum <= mo.idealRange[1];
          const moMin = 0;
          const moMax = Math.max(mo.idealRange[1] * 1.5, moNum * 1.25);
          const moRange = moMax - moMin;
          const moMarkerPct = Math.max(2, Math.min(97, ((moNum - moMin) / moRange) * 100));
          const moIdealS = Math.max(0, Math.min(100, ((mo.idealRange[0] - moMin) / moRange) * 100));
          const moIdealE = Math.max(0, Math.min(100, ((mo.idealRange[1] - moMin) / moRange) * 100));
          const moSc = getScoreColor(mo.score);
          const moMid = (mo.idealRange[0] + mo.idealRange[1]) / 2;
          const moDelta = moNum - moMid;
          const moAbove = moDelta > 0;
          const moPercentile = Math.round(mo.score * 9.5 + 5);

          // May Indicate data per ratio shortName
          const mayIndicateMap: Record<string, string[]> = {
            'fWHR': ['Perceived dominance & authority', 'Testosterone exposure level', 'Facial masculinity index'],
            'φ Ratio': ['Classical beauty alignment', 'Structural facial balance', 'Natural proportion harmony'],
            'Symmetry': ['Genetic health & stability', 'Developmental quality', 'Baseline attractiveness factor'],
            'Canthal Tilt': ['Youthfulness & alertness', 'Eye attractiveness level', 'Upper-face aesthetic appeal'],
            'Jaw Angle': ['Jawline definition & sharpness', 'Facial masculinity', 'Lower-face structure quality'],
            'Eye Shape': ['Eye shape attractiveness', 'Almond-eye quality', 'Periorbital aesthetics'],
            'Thirds': ['Proportional face balance', 'Classical beauty standard', 'Vertical facial harmony'],
            'Eye Spacing': ['Interpupillary harmony', 'Classical one-eye-width rule', 'Orbital spacing quality'],
            'Eye/Face W': ['Eye prominence & frame', 'Facial width harmony', 'Upper-face proportional balance'],
            'Jaw/Cheek': ['V-line face structure', 'Facial tapering quality', 'Cheekbone-to-jaw definition'],
            'Nose/Mouth': ['Nasal proportion balance', 'Lower-face harmony', 'Golden-ratio conformance'],
            'Mouth/Face': ['Lip-to-face proportion', 'Smile width harmony', 'Lower facial balance'],
            'Philtrum': ['Perceived youthfulness', 'Aging progression marker', 'Upper-lip proportion'],
            'Lip Ratio': ['Lip fullness & attractiveness', 'Youthful lip proportion', 'Sensuality perception'],
            'Lower Face': ['Chin projection adequacy', 'Facial maturity level', 'Lower-third balance'],
            'Midface': ['Midface elongation level', 'Nasal-bridge proportion', 'Central facial aesthetics'],
            'Intercanthal': ['Orbital spacing harmony', 'Neoclassical alignment to alar base', 'Close-set vs wide-set eye classification'],
            'Nasal Index': ['Nasal width-to-length proportion', 'Rhinoplasty candidacy assessment', 'Ethnic & neoclassical canon adherence'],
            'Chin Height': ['Chin projection & vertical balance', 'Genioplasty or chin implant need', 'Lower-face maturity & age perception'],
            'Forehead': ['Upper-face elongation level', 'Hairline and brow position balance', 'Vertical facial thirds harmony'],
            'Jaw/Height': ['Jaw strength relative to face height', 'Mandibular width-to-height balance', 'Lower-face structural dominance'],
            'Nose/Eye W': ['Neoclassical one-eye-width nasal rule', 'Nasal alar width correction need', 'Orbital frame vs nasal width balance'],
            'Face Index': ['Mesoprosopic vs euryprosopic classification', 'Overall face shape proportionality', 'Width-to-height harmony index'],
            'Eye Open': ['Palpebral fissure vertical aperture', 'Hooded eye or ptosis indicator', 'Hunter-eye vs round-eye morphology'],
            'Brow Lift': ['Brow ptosis or over-elevation level', 'Brow lift procedure candidacy', 'Upper-face alertness & expression perception'],
            'Bridge/Alar': ['Nasal bridge-to-base taper ratio', 'Rhinoplasty dorsum width target', 'Narrow vs wide dorsal aesthetic'],
          };
          const moIndicators = mayIndicateMap[mo.shortName] ?? [];

          const scoreColor = moWithin ? '#22c55e' : mo.score >= 6 ? '#f97316' : '#ef4444';
          const scoreGlow = moWithin ? 'rgba(34,197,94,0.4)' : mo.score >= 6 ? 'rgba(249,115,22,0.4)' : 'rgba(239,68,68,0.4)';

          return (
            <motion.div
              key="modal-backdrop"
              className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/65 backdrop-blur-lg"
                initial={{ backdropFilter: 'blur(0px)' }}
                animate={{ backdropFilter: 'blur(16px)' }}
                transition={{ duration: 0.4 }}
                onClick={() => setModalOpen(false)}
              />
              <motion.div
                className="relative w-full max-w-4xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                initial={{ scale: 0.88, y: 40, opacity: 0, rotateX: 4 }}
                animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
                exit={{ scale: 0.92, y: 30, opacity: 0, rotateX: 2 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ maxHeight: '92vh', perspective: '1200px' }}
              >
                {/* ── LEFT: full photo with overlay ── */}
                {points && (
                  <motion.div
                    className="w-full md:w-[46%] flex-shrink-0 relative bg-black overflow-hidden"
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
                  >
                    <motion.div
                      className="relative"
                      initial={{ scale: 1.08 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                      <img
                        src={imageUrl}
                        alt=""
                        className="w-full h-auto block"
                        referrerPolicy="no-referrer"
                        style={{ filter: 'brightness(0.6) contrast(1.12) saturate(0.85)' }}
                      />
                      <LerpLineCanvas display={mo} points={points} viewW={viewW} viewH={viewH} />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />

                    {/* Score overlay on photo */}
                    <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
                      <motion.p
                        className="text-[7px] font-mono tracking-[0.25em] text-white/25 uppercase mb-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        VisageX Analysis
                      </motion.p>
                      <div className="flex items-end justify-between">
                        <motion.div
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: 0.35 }}
                        >
                          <h3 className="text-lg md:text-xl font-bold text-white leading-tight">{mo.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {moWithin && (
                              <motion.span
                                className="text-[8px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.6 }}
                              >
                                ✓ Within Ideal
                              </motion.span>
                            )}
                            <span className={cn('text-[9px] font-medium', isDarkMode ? 'text-white/30' : 'text-white/40')}>
                              {activeIndex + 1} of {ratios.length}
                            </span>
                          </div>
                        </motion.div>
                        <motion.div
                          className="text-right"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.25 }}
                        >
                          <div className="flex items-baseline gap-1 relative">
                            <motion.div
                              className="absolute inset-0 rounded-full blur-2xl -z-10"
                              style={{ background: scoreGlow }}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: [0, 0.6, 0.3], scale: [0.5, 1.3, 1] }}
                              transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
                            />
                            <span className={cn('text-4xl md:text-5xl font-bold tabular-nums leading-none', moSc.text)}>
                              {isLocked ? '??' : mo.score.toFixed(1)}
                            </span>
                            <span className="text-white/20 text-lg">/10</span>
                          </div>
                          <motion.p
                            className={cn('text-[10px] font-semibold mt-1', moSc.text)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.5 }}
                          >
                            {getQualityLabel(mo.score)}
                          </motion.p>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── RIGHT: scrollable details ── */}
                <div className={cn('flex-1 flex flex-col overflow-y-auto', isDarkMode ? 'bg-zinc-900' : 'bg-white')} style={{ maxHeight: '92vh' }}>
                  {/* Navigation bar */}
                  <motion.div
                    className={cn('flex items-center justify-between px-5 py-3 border-b flex-shrink-0', isDarkMode ? 'border-white/6' : 'border-zinc-100')}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                  >
                    <div className="flex items-center gap-2">
                      {mo.contributesTo.map((tag, ti) => (
                        <motion.span
                          key={tag}
                          className={cn('text-[9px] font-medium px-2 py-0.5 rounded-full', isDarkMode ? 'bg-white/6 text-white/40' : 'bg-zinc-100 text-zinc-500')}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.2 + ti * 0.05 }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className={cn('p-1.5 rounded-lg transition-colors', isDarkMode ? 'hover:bg-white/8 text-white/40 hover:text-white/80' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700')} onClick={() => setActiveIndex(i => Math.max(0, i - 1))}><ChevronLeft className="w-4 h-4" /></motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className={cn('p-1.5 rounded-lg transition-colors', isDarkMode ? 'hover:bg-white/8 text-white/40 hover:text-white/80' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700')} onClick={() => setActiveIndex(i => Math.min(ratios.length - 1, i + 1))}><ChevronRight className="w-4 h-4" /></motion.button>
                      <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} className={cn('p-1.5 rounded-lg transition-colors ml-1', isDarkMode ? 'hover:bg-white/8 text-white/40 hover:text-white/80' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700')} onClick={() => setModalOpen(false)}><X className="w-4 h-4" /></motion.button>
                    </div>
                  </motion.div>

                  {/* Stats grid — 4 columns with staggered entrance */}
                  <div className={cn('grid grid-cols-4 gap-px flex-shrink-0 border-b', isDarkMode ? 'bg-white/8 border-white/6' : 'bg-zinc-100 border-zinc-100')}>
                    {[
                      { label: 'YOUR VALUE', value: isLocked ? '??' : `${typeof mo.value === 'number' ? mo.value.toFixed(2) : mo.value}${mo.unit ?? ''}`, sub: moWithin ? 'Within Ideal' : (moAbove ? 'Above Ideal' : 'Below Ideal'), color: isDarkMode ? 'text-cyan-400' : 'text-cyan-700' },
                      { label: 'IDEAL RANGE', value: `${mo.idealRange[0]}–${mo.idealRange[1]}${mo.unit ?? ''}`, sub: `Mid: ${moMid.toFixed(2)}`, color: isDarkMode ? 'text-emerald-400' : 'text-emerald-700' },
                      { label: 'SCORE', value: `${mo.score.toFixed(1)}`, sub: '/10', color: moSc.text },
                      { label: 'PERCENTILE', value: isLocked ? '??' : `Top ${Math.max(1, 100 - moPercentile)}%`, sub: `${mo.confidence}% confidence`, color: isDarkMode ? 'text-violet-400' : 'text-violet-600' },
                    ].map((s, si) => (
                      <motion.div
                        key={s.label}
                        className={cn('px-4 py-4', isDarkMode ? 'bg-zinc-900' : 'bg-white')}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + si * 0.07, ease: 'easeOut' }}
                      >
                        <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1.5 opacity-30', isDarkMode ? 'text-white' : 'text-zinc-900')}>{s.label}</p>
                        <div className="flex items-baseline gap-1">
                          <p className={cn('text-lg font-bold leading-none', s.color)}>{s.value}</p>
                        </div>
                        {s.sub && <span className={cn('text-[8px] opacity-40 mt-0.5 block', isDarkMode ? 'text-white' : 'text-zinc-700')}>{s.sub}</span>}
                      </motion.div>
                    ))}
                  </div>

                  {/* Range bar — animated fill + spring marker */}
                  <motion.div
                    className="px-6 pt-12 pb-7 flex-shrink-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.35 }}
                  >
                    <div className="relative">
                      {!isLocked && (
                        <motion.div
                          className="absolute bottom-full mb-5 pointer-events-none"
                          style={{ left: `${moMarkerPct}%`, transform: `translateX(${moMarkerPct < 10 ? '0%' : moMarkerPct > 90 ? '-100%' : '-50%'})` }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.7 }}
                        >
                          <div className={cn('px-2.5 py-1 rounded-lg text-center', isDarkMode ? 'bg-white/10' : 'bg-zinc-100')}>
                            <span className={cn('text-sm font-bold tabular-nums', moSc.text)}>
                              {typeof mo.value === 'number' ? mo.value.toFixed(2) : mo.value}{mo.unit ?? ''}
                            </span>
                          </div>
                        </motion.div>
                      )}
                      <motion.div
                        className="absolute bottom-full mb-1.5 pointer-events-none"
                        style={{ left: `${(moIdealS + moIdealE) / 2}%`, transform: 'translateX(-50%)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.45 }}
                      >
                        <span className={cn('text-[8px] font-black tracking-widest uppercase', isDarkMode ? 'text-emerald-400/70' : 'text-emerald-600/80')}>IDEAL</span>
                      </motion.div>

                      {/* Bar track */}
                      <div className="relative h-[12px] rounded-full overflow-hidden" style={{ background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                        {/* Animated gradient fill */}
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ background: `linear-gradient(to right, #ef4444 0%, #f97316 ${Math.max(0, moIdealS - 15)}%, #22c55e ${moIdealS}%, #22c55e ${moIdealE}%, #f97316 ${Math.min(100, moIdealE + 15)}%, #ef4444 100%)` }}
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        />
                        {/* Ideal zone glow */}
                        <motion.div
                          className="absolute top-0 bottom-0 rounded-sm bg-emerald-400/30"
                          style={{ left: `${moIdealS}%`, width: `${moIdealE - moIdealS}%` }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.5, 0.3] }}
                          transition={{ duration: 0.8, delay: 0.8 }}
                        />
                      </div>

                      {/* Ideal range markers */}
                      <motion.div
                        className="absolute w-[2px] bg-white rounded-full"
                        style={{ left: `${moIdealS}%`, top: '-6px', bottom: '-6px' }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3, delay: 0.6 }}
                      />
                      <motion.div
                        className="absolute w-[2px] bg-white rounded-full"
                        style={{ left: `${moIdealE}%`, top: '-6px', bottom: '-6px' }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.3, delay: 0.65 }}
                      />

                      {/* Animated score marker */}
                      {!isLocked && (
                        <motion.div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                          initial={{ left: '0%', scale: 0 }}
                          animate={{ left: `${moMarkerPct}%`, scale: 1 }}
                          transition={{
                            left: { type: 'spring', stiffness: 80, damping: 18, delay: 0.5 },
                            scale: { type: 'spring', stiffness: 400, damping: 20, delay: 0.45 },
                          }}
                        >
                          <motion.div
                            className="w-[22px] h-[22px] rounded-full border-[3px] border-white"
                            style={{ background: scoreColor, boxShadow: `0 2px 8px rgba(0,0,0,0.4), 0 0 0 4px ${scoreGlow}` }}
                            animate={{ boxShadow: [`0 2px 8px rgba(0,0,0,0.4), 0 0 0 4px ${scoreGlow}`, `0 2px 12px rgba(0,0,0,0.3), 0 0 0 8px ${scoreGlow}`, `0 2px 8px rgba(0,0,0,0.4), 0 0 0 4px ${scoreGlow}`] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        </motion.div>
                      )}

                      <motion.div
                        className={cn('flex justify-between mt-4 text-[9px]', isDarkMode ? 'text-white/30' : 'text-zinc-400')}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.7 }}
                      >
                        <span>0</span>
                        <span>{mo.idealRange[0]}–{mo.idealRange[1]}{mo.unit ?? ''}</span>
                        <span>{moMax.toFixed(2)}</span>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* May Indicate — staggered items */}
                  {!isLocked && moIndicators.length > 0 && (
                    <motion.div
                      className={cn('mx-5 mb-3 p-4 rounded-xl border', isDarkMode ? 'bg-violet-500/[0.04] border-violet-500/15' : 'bg-violet-50/60 border-violet-200/80')}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.55 }}
                    >
                      <div className="flex items-center gap-1.5 mb-3">
                        <motion.div
                          animate={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5, delay: 0.7 }}
                        >
                          <AlertCircle className={cn('w-3.5 h-3.5', isDarkMode ? 'text-violet-400' : 'text-violet-500')} />
                        </motion.div>
                        <span className={cn('text-[8px] font-black uppercase tracking-widest', isDarkMode ? 'text-violet-400' : 'text-violet-600')}>May Indicate</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {moIndicators.map((tag, ti) => (
                          <motion.div
                            key={ti}
                            className="flex items-center gap-2.5"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.25, delay: 0.65 + ti * 0.08 }}
                          >
                            <motion.div
                              className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isDarkMode ? 'bg-violet-400/60' : 'bg-violet-400')}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.7 + ti * 0.08 }}
                            />
                            <span className={cn('text-[12px] leading-snug', isDarkMode ? 'text-white/60' : 'text-zinc-700')}>
                              {tag}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* About — slide in */}
                  <motion.div
                    className={cn('mx-5 mb-3 p-4 rounded-xl border', isDarkMode ? 'bg-white/[0.03] border-white/6' : 'bg-zinc-50 border-zinc-200')}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.65 }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <BookOpen className={cn('w-3.5 h-3.5 opacity-40', isDarkMode ? 'text-indigo-300' : 'text-indigo-600')} />
                      <span className={cn('text-[8px] font-black uppercase tracking-widest opacity-40', isDarkMode ? 'text-white' : 'text-zinc-900')}>About this ratio</span>
                    </div>
                    <p className={cn('text-[12px] leading-relaxed', isDarkMode ? 'text-white/60' : 'text-zinc-600')}>
                      {isLocked ? 'Unlock your report to see detailed scientific context.' : mo.description}
                    </p>
                  </motion.div>

                  {/* Tip — slide in */}
                  {!isLocked && (
                    <motion.div
                      className={cn('mx-5 mb-5 p-4 rounded-xl border', moWithin ? (isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200') : (isDarkMode ? 'bg-amber-500/5 border-amber-500/15' : 'bg-amber-50 border-amber-200'))}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.75 }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, delay: 0.9 }}
                        >
                          <Zap className={cn('w-3.5 h-3.5', moWithin ? 'text-emerald-400' : 'text-amber-400')} />
                        </motion.div>
                        <span className={cn('text-[8px] font-black uppercase tracking-widest', moWithin ? 'text-emerald-400' : 'text-amber-400')}>{moWithin ? 'Optimal' : 'Improvement Tip'}</span>
                      </div>
                      <p className={cn('text-[12px] leading-relaxed', isDarkMode ? 'text-white/60' : 'text-zinc-700')}>
                        {moWithin ? 'This ratio is within the ideal range. Maintain your current approach to preserve this result.'
                          : moAbove ? `Your measurement is ${Math.abs(moDelta).toFixed(2)}${mo.unit || ''} above the ideal midpoint (${moMid.toFixed(2)}${mo.unit || ''}). Targeted interventions may help optimize this metric.`
                          : `Your measurement is ${Math.abs(moDelta).toFixed(2)}${mo.unit || ''} below the ideal midpoint (${moMid.toFixed(2)}${mo.unit || ''}). Focused adjustments could bring this closer to optimal.`}
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
