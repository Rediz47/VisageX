import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Share2, Check, TrendingUp, Users, BarChart3, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';
import AnimatedFaceMesh from '../AnimatedFaceMesh';

/* ─────────────── Score Tier Helper ─────────────── */
function getScoreTier(score: number): { label: string; color: string; glow: string } {
  if (score >= 9.0) return { label: 'Exceptional', color: '#22d3ee', glow: 'rgba(34,211,238,0.3)' };
  if (score >= 8.0) return { label: 'Outstanding', color: '#818cf8', glow: 'rgba(129,140,248,0.3)' };
  if (score >= 7.0) return { label: 'Above Average', color: '#818cf8', glow: 'rgba(129,140,248,0.25)' };
  if (score >= 5.5) return { label: 'Average', color: '#a1a1aa', glow: 'rgba(161,161,170,0.2)' };
  if (score >= 4.0) return { label: 'Below Average', color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' };
  return { label: 'Low', color: '#ef4444', glow: 'rgba(239,68,68,0.2)' };
}

/* ─────────────── Animated Arc Gauge ─────────────── */
function ArcGauge({ score, isLocked, isDarkMode }: { score: number; isLocked: boolean; isDarkMode: boolean }) {
  const size = 160;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const startAngle = 135;
  const endAngle = 405;
  const totalArc = endAngle - startAngle;
  const scoreAngle = startAngle + (score / 10) * totalArc;

  const polarToCart = (a: number) => ({
    x: cx + r * Math.cos((a * Math.PI) / 180),
    y: cy + r * Math.sin((a * Math.PI) / 180),
  });

  const describeArc = (start: number, end: number) => {
    const s = polarToCart(start);
    const e = polarToCart(end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const trackPath = describeArc(startAngle, endAngle);
  const fillPath = describeArc(startAngle, Math.min(scoreAngle, endAngle));
  const circumference = (totalArc / 360) * 2 * Math.PI * r;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 m-auto" style={{ opacity: isLocked ? 0.15 : 0.5 }}>
      <defs>
        <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path d={trackPath} fill="none"
        stroke={isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
        strokeWidth={stroke} strokeLinecap="round" />
      <motion.path d={fillPath} fill="none"
        stroke="url(#arc-grad)" strokeWidth={stroke} strokeLinecap="round"
        initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 1.6, ease: 'easeOut', delay: 0.3 }}
      />
    </svg>
  );
}

/* ─────────────── Bell Curve Distribution Chart ─────────────── */
function BellCurveChart({
  score, isDarkMode, isLocked, topPercentile,
}: { score: number; isDarkMode: boolean; isLocked: boolean; topPercentile: number }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const uid = useRef(`bc${Math.random().toString(36).slice(2, 7)}`);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setAnimated(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const W = 420, H = 210;
  const pL = 28, pR = 28, pT = 58, pB = 34;
  const pw = W - pL - pR, ph = H - pT - pB;
  const mean = 5.2, std = 1.55;
  const gauss = (x: number) => Math.exp(-0.5 * ((x - mean) / std) ** 2);

  const pts: [number, number][] = Array.from({ length: 301 }, (_, i) => {
    const x = (i / 300) * 10;
    return [x, gauss(x)];
  });

  const sx = (x: number) => pL + (x / 10) * pw;
  const sy = (y: number) => H - pB - y * ph;

  const curve = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(2)},${sy(y).toFixed(2)}`).join('');
  const area  = `${curve}L${sx(10).toFixed(2)},${sy(0).toFixed(2)}L${sx(0).toFixed(2)},${sy(0).toFixed(2)}Z`;

  const rightTailPts = pts.filter(([x]) => x >= score - 0.05);
  const rightTail = rightTailPts.map(([x, y], i) =>
    `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(2)},${sy(y).toFixed(2)}`
  ).join('') + `L${sx(10).toFixed(2)},${sy(0).toFixed(2)} L${sx(score).toFixed(2)},${sy(0).toFixed(2)} Z`;

  const ux = sx(score);
  const uy = sy(gauss(score));
  const anchorLeft = score > 6.2;

  // Floating callout dimensions
  const callW = 56, callH = 36, callR = 10;
  const callX = anchorLeft ? ux - callW - 12 : ux + 12;
  const callY = pT - 44;
  const lineEndY = uy - 8;

  return (
    <div ref={ref} className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-[9px] font-bold uppercase tracking-[0.18em]', isDarkMode ? 'text-white/30' : 'text-zinc-900/30')}>
          Score Distribution
        </span>
        {!isLocked && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[9px] font-bold" style={{ color: '#818cf8' }}>
              Top {topPercentile}% globally
            </span>
          </div>
        )}
      </div>

      <div className={cn('rounded-2xl overflow-hidden', isDarkMode ? 'bg-white/[0.02]' : 'bg-zinc-50/60')}
        style={{ border: isDarkMode ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
          <defs>
            {/* Reveal clip */}
            <clipPath id={`${uid.current}-clip`}>
              <motion.rect x={0} y={0} height={H}
                initial={{ width: 0 }}
                animate={animated ? { width: W } : { width: 0 }}
                transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              />
            </clipPath>

            {/* Base fill — indigo to transparent */}
            <linearGradient id={`${uid.current}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={isDarkMode ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.14)'} />
              <stop offset="100%" stopColor="rgba(99,102,241,0)" />
            </linearGradient>

            {/* Right tail — vivid cyan/indigo */}
            <linearGradient id={`${uid.current}-tail`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(34,211,238,0.5)" />
              <stop offset="60%"  stopColor="rgba(99,102,241,0.3)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0.02)" />
            </linearGradient>

            {/* Curve stroke — horizontal gradient */}
            <linearGradient id={`${uid.current}-stroke`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} />
              <stop offset="45%"  stopColor={isDarkMode ? 'rgba(129,140,248,0.5)' : 'rgba(99,102,241,0.4)'} />
              <stop offset="75%"  stopColor="rgba(34,211,238,0.7)" />
              <stop offset="100%" stopColor={isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} />
            </linearGradient>

            {/* Dot glow filter */}
            <filter id={`${uid.current}-glow`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Pill label gradient */}
            <linearGradient id={`${uid.current}-pill`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="rgba(99,102,241,0.9)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.85)" />
            </linearGradient>
          </defs>

          {/* Subtle horizontal grid lines */}
          {[0.25, 0.5, 0.75].map(frac => (
            <line key={frac}
              x1={pL} y1={sy(frac)} x2={W - pR} y2={sy(frac)}
              stroke={isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
              strokeWidth="1"
            />
          ))}

          {/* Base bell fill */}
          <path d={area} fill={`url(#${uid.current}-fill)`} clipPath={`url(#${uid.current}-clip)`} />

          {/* Right tail highlight */}
          {!isLocked && (
            <path d={rightTail} fill={`url(#${uid.current}-tail)`} clipPath={`url(#${uid.current}-clip)`} />
          )}

          {/* Curve stroke */}
          <path d={curve} fill="none"
            stroke={`url(#${uid.current}-stroke)`}
            strokeWidth="2.5" strokeLinecap="round"
            clipPath={`url(#${uid.current}-clip)`} />

          {/* Mean reference line */}
          <line x1={sx(mean)} y1={pT} x2={sx(mean)} y2={H - pB}
            stroke={isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}
            strokeWidth="1" strokeDasharray="3,4" />
          <rect x={sx(mean) - 17} y={pT - 16} width={34} height={13} rx="6"
            fill={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
          <text x={sx(mean)} y={pT - 6} textAnchor="middle" fontSize="7.5"
            fontFamily="system-ui,sans-serif" fontWeight="600"
            fill={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}>
            avg {mean}
          </text>

          {/* Baseline */}
          <line x1={pL} y1={H - pB} x2={W - pR} y2={H - pB}
            stroke={isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'} strokeWidth="1" />

          {/* X-axis ticks */}
          {[0, 2, 4, 6, 8, 10].map(t => (
            <text key={t} x={sx(t)} y={H - pB + 14} textAnchor="middle" fontSize="8"
              fontFamily="system-ui,sans-serif"
              fill={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.22)'}>
              {t}
            </text>
          ))}

          {/* ── User marker (unlocked) ── */}
          {!isLocked && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={animated ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 1.6, duration: 0.8 }}
            >
              {/* Connector line: callout → dot */}
              <line
                x1={anchorLeft ? callX + callW : callX}
                y1={callY + callH / 2}
                x2={ux} y2={lineEndY}
                stroke="rgba(129,140,248,0.25)" strokeWidth="1" strokeDasharray="3,4"
              />

              {/* Vertical dashed score line */}
              <line x1={ux} y1={lineEndY} x2={ux} y2={H - pB}
                stroke="rgba(129,140,248,0.35)" strokeWidth="1.5" strokeDasharray="4,3" />

              {/* Outer pulse ring */}
              <motion.circle cx={ux} cy={uy} r="14"
                fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="1.5"
                animate={{ r: [11, 22], opacity: [0.5, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
              />
              {/* Soft halo */}
              <circle cx={ux} cy={uy} r="11" fill="rgba(99,102,241,0.08)" />
              {/* Glow blur */}
              <circle cx={ux} cy={uy} r="7" fill="rgba(99,102,241,0.28)"
                filter={`url(#${uid.current}-glow)`} />
              {/* Main dot — gradient fill + cyan border */}
              <circle cx={ux} cy={uy} r="5.5"
                fill={`url(#${uid.current}-pill)`} />
              <circle cx={ux} cy={uy} r="5.5"
                fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
              <circle cx={ux} cy={uy} r="2" fill="white" />

              {/* Score badge on x-axis */}
              <rect x={ux - 14} y={H - pB + 2} width={28} height={14} rx="7"
                fill="rgba(99,102,241,0.18)" />
              <text x={ux} y={H - pB + 13} textAnchor="middle" fontSize="9"
                fontFamily="system-ui,sans-serif" fontWeight="800" fill="#818cf8">
                {score.toFixed(1)}
              </text>

              {/* Premium floating callout — glass card */}
              {/* Shadow / depth layer */}
              <rect x={callX + 2} y={callY + 3} width={callW} height={callH} rx={callR}
                fill="rgba(0,0,0,0.35)" />
              {/* Glass background */}
              <rect x={callX} y={callY} width={callW} height={callH} rx={callR}
                fill={isDarkMode ? 'rgba(15,15,25,0.92)' : 'rgba(255,255,255,0.95)'}
                stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
              {/* Inner top highlight */}
              <rect x={callX + 1} y={callY + 1} width={callW - 2} height={callH / 2} rx={callR}
                fill="rgba(255,255,255,0.04)" />
              {/* Score number — gradient via two overlapping texts */}
              <text x={callX + callW / 2} y={callY + 16}
                textAnchor="middle" fontSize="15" fontFamily="system-ui,sans-serif"
                fontWeight="900" fill={isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}>
                {score.toFixed(1)}
              </text>
              <text x={callX + callW / 2} y={callY + 16}
                textAnchor="middle" fontSize="15" fontFamily="system-ui,sans-serif"
                fontWeight="900" fill={`url(#${uid.current}-pill)`}>
                {score.toFixed(1)}
              </text>
              {/* Sub-label */}
              <text x={callX + callW / 2} y={callY + 28}
                textAnchor="middle" fontSize="6.5" fontFamily="system-ui,sans-serif"
                fontWeight="700" fill="rgba(129,140,248,0.7)" letterSpacing="0.06em">
                TOP {topPercentile}%
              </text>
            </motion.g>
          )}

          {/* Locked overlay */}
          {isLocked && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <rect x={pL} y={pT - 12} width={pw} height={ph + 16} rx="12"
                fill={isDarkMode ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.88)'} />
              <text x={W / 2} y={H / 2 + 2} textAnchor="middle" fontSize="9.5"
                fontFamily="system-ui,sans-serif" fontWeight="600"
                fill={isDarkMode ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)'}>
                Unlock to see where you stand
              </text>
            </motion.g>
          )}
        </svg>
      </div>
    </div>
  );
}

interface ScoreSectionProps {
  imageUrl: string;
  landmarks: any;
  cropInfo: any;
  metrics: any;
  isDarkMode: boolean;
  overallScore: number;
  topPercentile: number;
  userRank: number;
  totalUsers: number;
  isLocked: boolean;
  user: any;
  userData?: any;
  onUnlock: () => void;
  scrollToPricing: () => void;
}

export function ScoreSection({
  imageUrl,
  landmarks,
  cropInfo,
  metrics,
  isDarkMode,
  overallScore,
  topPercentile,
  userRank,
  totalUsers,
  isLocked,
  user,
  userData,
  onUnlock,
  scrollToPricing,
}: ScoreSectionProps) {
  const tier = getScoreTier(overallScore);

  const handleShare = () => {
    const shareText = `I scored ${overallScore?.toFixed(1) || '9.0'}/10 on the VisageX AI Face Analysis (Top ${topPercentile}% globally).`;
    const shareUrl = `${window.location.origin}?ref=${userData?.referralCode || ''}`;
    
    if ((window as any).posthog) {
      (window as any).posthog.capture('viral_share_clicked', { source: 'hero_card', score: overallScore.toFixed(1) });
    }

    if (navigator.share) {
      navigator.share({ title: 'My VisageX AI Score', text: shareText, url: shareUrl });
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      alert("Copied share link to clipboard!");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch">

      {/* ── Left: Face Photo ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className={cn(
          "sm:w-[38%] lg:w-[34%] flex-shrink-0 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden relative group flex flex-col",
          isDarkMode ? "bg-black" : "bg-zinc-950"
        )}
        style={{
          border: isDarkMode
            ? '1px solid rgba(99,102,241,0.18)'
            : '1px solid rgba(99,102,241,0.12)',
          boxShadow: isDarkMode
            ? '0 0 0 1px rgba(99,102,241,0.1), 0 20px 60px rgba(0,0,0,0.5)'
            : '0 0 0 1px rgba(99,102,241,0.08), 0 20px 60px rgba(99,102,241,0.08)',
        }}
      >
        {/* Photo — natural size, no stretch */}
        <div className="relative flex-shrink-0">
          <AnimatedFaceMesh
            imageUrl={imageUrl}
            landmarks={landmarks}
            cropInfo={cropInfo}
            metrics={metrics}
            isDarkMode={isDarkMode}
            hideMesh
          />
          {/* Fade photo into bottom panel */}
          <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 100%)' }}
          />
        </div>

        {/* Bottom panel — top facial metrics */}
        <div className="flex-1 flex flex-col justify-center gap-3 px-4 py-4 relative overflow-hidden">
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,1) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
          {/* Bottom ambient glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-20 pointer-events-none blur-2xl rounded-full"
            style={{ background: tier.glow, opacity: 0.5 }} />

          {/* Label */}
          <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-white/25 relative z-10">
            Top Features
          </p>

          {/* 3 metric chips */}
          <div className="flex flex-col gap-2 relative z-10">
            {[
              { label: 'Symmetry',  key: 'Symmetry',      color: '#22d3ee' },
              { label: 'Jawline',   key: 'Jawline',        color: '#818cf8' },
              { label: 'Eyes',      key: 'Eyes',           color: '#a78bfa' },
            ].map(({ label, key, color }) => {
              const val = metrics?.[key] ?? null;
              const locked = isLocked;
              return (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-white/40 font-medium">{label}</span>
                  <div className="flex-1 h-px mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  {locked ? (
                    <span className="text-[10px] text-white/15 font-bold">—</span>
                  ) : val !== null ? (
                    <span className="text-[11px] font-black tabular-nums" style={{ color }}>{Number(val).toFixed(1)}</span>
                  ) : (
                    <span className="text-[10px] text-white/15 font-bold">—</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scan info line */}
          <div className="flex items-center gap-1.5 relative z-10 mt-1">
            <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">468 landmarks · AI scan</span>
          </div>
        </div>
      </motion.div>

      {/* ── Right: Score + CTA + Stats ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 }}
        className={cn(
          "flex-1 rounded-2xl md:rounded-3xl shadow-xl relative overflow-hidden flex flex-col items-center justify-between py-6 px-4 md:px-7 text-center",
          isDarkMode ? "bg-black" : "bg-white"
        )}
        style={{
          border: isDarkMode
            ? '1px solid rgba(99,102,241,0.15)'
            : '1px solid rgba(99,102,241,0.1)',
          boxShadow: isDarkMode
            ? '0 0 0 1px rgba(99,102,241,0.08), 0 20px 60px rgba(0,0,0,0.5)'
            : '0 0 0 1px rgba(99,102,241,0.06), 0 20px 60px rgba(99,102,241,0.08)',
        }}
      >
        {/* Top radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />
        {/* Score-coloured ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none rounded-full blur-3xl"
          style={{ background: isLocked ? 'transparent' : tier.glow, opacity: 0.5 }} />

        <div className="relative z-10 flex flex-col items-center w-full gap-5">
          {/* Score display with arc gauge */}
          <div className="text-center relative">
            <p className={cn('text-[9px] font-bold uppercase tracking-[0.2em] mb-3', isDarkMode ? 'text-white/30' : 'text-zinc-900/30')}>
              Facial Harmony Score
            </p>
            <div className="relative inline-flex items-center justify-center" style={{ width: 160, height: 160 }}>
              <ArcGauge score={overallScore} isLocked={isLocked} isDarkMode={isDarkMode} />
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-baseline gap-0.5">
                  <motion.span
                    className={cn(
                      "text-[56px] md:text-[64px] font-black tabular-nums leading-none tracking-tight select-none",
                      isLocked && "blur-[10px] opacity-60"
                    )}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: isLocked ? 'blur(10px)' : `drop-shadow(0 0 24px ${tier.glow})`,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                  >
                    {overallScore.toFixed(1)}
                  </motion.span>
                  <span className={cn('text-base opacity-20 font-light', isDarkMode ? 'text-zinc-100' : 'text-zinc-900')}>/10</span>
                </div>
                {/* Tier label */}
                <motion.span
                  className={cn("text-[10px] font-bold uppercase tracking-[0.15em] mt-1", isLocked && "blur-[6px] opacity-40")}
                  style={{ color: isLocked ? (isDarkMode ? '#71717a' : '#a1a1aa') : tier.color }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  {isLocked ? '???' : tier.label}
                </motion.span>
              </div>
            </div>

            {/* Percentile badge */}
            <motion.div
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full",
                isLocked && "blur-[6px] opacity-50 select-none"
              )}
              style={{
                background: isDarkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)',
                border: `1px solid ${isDarkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)'}`,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <TrendingUp className="w-3 h-3" style={{ color: '#818cf8' }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#818cf8' }}>
                Top {topPercentile}% Globally
              </span>
            </motion.div>
          </div>

          {/* Bell curve distribution */}
          <div className="w-full">
            <BellCurveChart
              score={overallScore}
              isDarkMode={isDarkMode}
              isLocked={isLocked}
              topPercentile={topPercentile}
            />
          </div>

          {isLocked ? (
            <motion.button
              onClick={scrollToPricing}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative group rounded-full overflow-hidden transition-all duration-300"
            >
              {/* Outer glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
              <div className="relative flex items-center gap-2.5 px-6 py-2.5 rounded-full border overflow-hidden"
                style={{
                  background: isDarkMode
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))'
                    : 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))',
                  borderColor: isDarkMode ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)',
                }}
              >
                {/* Shimmer */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
                <Lock className="w-3.5 h-3.5 text-indigo-400 relative z-10" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 relative z-10">
                  Unlock Report
                </span>
                <div className="w-px h-3 bg-indigo-500/20 relative z-10" />
                <span className="text-[9px] font-bold text-indigo-400/50 relative z-10">$9.99</span>
              </div>
            </motion.button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Unlocked</span>
              </div>
              <motion.button
                onClick={handleShare}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative group flex items-center gap-2 px-5 py-2.5 rounded-full overflow-hidden transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                }}
              >
                <div className="absolute inset-0 bg-white/15 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Share2 className="w-3.5 h-3.5 text-white relative z-10" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.12em] relative z-10">Share</span>
              </motion.button>
            </div>
          )}

          {/* Stats row */}
          <div className={cn(
            "flex items-center justify-center w-full rounded-full py-2 px-1",
            isDarkMode ? "bg-white/[0.02]" : "bg-zinc-50/60"
          )}
            style={{ border: isDarkMode ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)' }}
          >
            {[
              { icon: Trophy, label: 'Rank', value: userRank.toLocaleString() },
              { icon: Users, label: 'Users', value: totalUsers.toLocaleString() },
              { icon: BarChart3, label: 'Scans', value: '1,335+' },
            ].map((stat, idx) => (
              <React.Fragment key={stat.label}>
                {idx > 0 && <div className={cn("w-px h-6", isDarkMode ? "bg-white/[0.05]" : "bg-zinc-200/50")} />}
                <div className="flex-1 flex items-center justify-center gap-1.5">
                  <stat.icon className={cn("w-3 h-3", isDarkMode ? "text-indigo-400/40" : "text-indigo-500/30")} />
                  <span className={cn("text-[10px] font-black tabular-nums", isDarkMode ? "text-white/50" : "text-zinc-600")}>{stat.value}</span>
                  <span className={cn("text-[8px] font-bold uppercase tracking-wider", isDarkMode ? "text-white/20" : "text-zinc-400")}>{stat.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
