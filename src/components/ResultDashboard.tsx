import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BarChart2,
  Activity,
  ChevronRight,
  Users,
  Scissors,
  Calendar,
  CheckCircle2,
  Award
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatedCounter } from './AnimatedCounter';
import { TiltCard, GlowSweep } from './motion';
import { fireConfetti } from '../lib/confetti';
import { useDashboardController } from '../features/dashboard/useDashboardController';
import { DashboardProvider } from '../context/DashboardContext';
import { useMotionTier } from '../context/MotionProvider';
import { easings } from '../lib/motion';

// Dashboard Components
import { ResultHeader } from './dashboard/ResultHeader';
import { TabNavigation } from './dashboard/TabNavigation';
import { ScoreSection } from './dashboard/ScoreSection';
import { ViralReferralEngine } from './dashboard/ViralReferralEngine';
import { StrengthsAndWeaknesses } from './dashboard/StrengthsAndWeaknesses';
import { VisionAnalysisSection } from './dashboard/VisionAnalysisSection';
import { MetricsGrid } from './dashboard/MetricsGrid';
import { FacialRatioExplorer } from './FacialRatioExplorer';
import { useRatioData } from './facial-ratio/useRatioData';
import { GlowUpCoach } from './GlowUpCoach';
import { TimelinePlan } from './dashboard/TimelinePlan';
import { BreakdownCards } from './dashboard/BreakdownCards';

/* ── Ratio Summary Card (overview) ── */
function RatioAnalysisTeaser({
  imageUrl,
  isDarkMode,
  overallScore
}: {
  imageUrl: string;
  isDarkMode: boolean;
  overallScore: number;
}) {
  const sc =
    overallScore >= 8
      ? { hex: '#22c55e', label: 'Excellent', glow: 'rgba(34,197,94,0.3)' }
      : overallScore >= 6
        ? { hex: '#f59e0b', label: 'Good', glow: 'rgba(245,158,11,0.3)' }
        : { hex: '#ef4444', label: 'Developing', glow: 'rgba(239,68,68,0.3)' };
  // Stats with separate numeric values so AnimatedCounter can tick up.
  // NOTE: Percentile removed — it was a UI heuristic, not a real population stat.
  const stats = [
    {
      label: 'Ratio Score',
      numeric: overallScore,
      decimals: 1,
      prefix: '',
      suffix: '',
      sub: sc.label,
      color: sc.hex,
      glow: sc.glow
    },
    {
      label: 'Metrics',
      numeric: 16,
      decimals: 0,
      prefix: '',
      suffix: '',
      sub: 'measurements',
      color: '#818cf8',
      glow: 'rgba(129,140,248,0.25)'
    },
    {
      label: 'Landmarks',
      numeric: 468,
      decimals: 0,
      prefix: '',
      suffix: '',
      sub: 'data points',
      color: '#22d3ee',
      glow: 'rgba(34,211,238,0.25)'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl md:rounded-3xl overflow-hidden"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #09090b 0%, #0f0f1a 40%, #0a0a14 100%)'
          : 'linear-gradient(135deg, #f8faff 0%, #eef2ff 40%, #faf5ff 100%)',
        boxShadow: isDarkMode
          ? '0 0 0 1px rgba(255,255,255,0.07), 0 24px 48px -8px rgba(0,0,0,0.7)'
          : '0 0 0 1px rgba(99,102,241,0.15), 0 24px 48px -8px rgba(99,102,241,0.15)'
      }}
    >
      <div
        className="absolute top-0 left-1/4 w-96 h-40 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
          filter: 'blur(20px)'
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-80 h-40 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(168,85,247,0.10) 0%, transparent 70%)',
          filter: 'blur(20px)'
        }}
      />

      <div className="relative flex flex-col lg:flex-row items-stretch gap-0">
        {/* Face preview */}
        <div className="relative lg:w-64 xl:w-72 flex-shrink-0 overflow-hidden">
          <div className="relative h-52 lg:h-full min-h-[200px]">
            <img
              src={imageUrl}
              alt="Face"
              className="w-full h-full object-cover object-top"
              style={{ filter: 'brightness(0.75) contrast(1.1) saturate(0.85)' }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, transparent 50%, ' +
                  (isDarkMode ? '#09090b' : '#f8faff') +
                  ' 100%)'
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}
            />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-black text-base text-white border-2 border-white/20"
                style={{
                  background: `conic-gradient(${sc.hex} ${overallScore * 36}deg, rgba(255,255,255,0.08) 0deg)`,
                  boxShadow: `0 0 16px ${sc.glow}`
                }}
              >
                {overallScore.toFixed(1)}
              </div>
              <div>
                <p className="text-white text-[10px] font-bold">{sc.label}</p>
                <p className="text-white/50 text-[9px]">Ratio Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 flex flex-col justify-center p-6 md:p-8 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">
                Facial Ratio Analysis
              </span>
            </div>
            <h2
              className={cn(
                'text-xl md:text-2xl font-black tracking-tight',
                isDarkMode ? 'text-white' : 'text-zinc-900'
              )}
            >
              Deep Structural Analysis
            </h2>
            <p
              className={cn(
                'text-[12px] mt-1 opacity-50',
                isDarkMode ? 'text-white' : 'text-zinc-700'
              )}
            >
              16 measurements · 468 landmarks · ideal range comparison
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30, scale: 0.7, rotate: i % 2 === 0 ? -3 : 3 }}
                whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'rounded-xl p-3.5 border flex flex-col gap-1',
                  isDarkMode
                    ? 'bg-white/[0.04] border-white/[0.06]'
                    : 'bg-white/70 border-white shadow-sm'
                )}
                style={{ boxShadow: `inset 0 0 20px ${stat.glow}` }}
              >
                <p
                  className={cn(
                    'text-[8px] font-bold uppercase tracking-widest opacity-40',
                    isDarkMode ? 'text-white' : 'text-zinc-600'
                  )}
                >
                  {stat.label}
                </p>
                <p
                  className="text-2xl font-black tabular-nums leading-none"
                  style={{ color: stat.color, textShadow: `0 0 16px ${stat.glow}` }}
                >
                  {stat.prefix}
                  <AnimatedCounter
                    value={stat.numeric}
                    maxDecimals={stat.decimals}
                    delay={0.45 + i * 0.12}
                  />
                  {stat.suffix}
                </p>
                <p
                  className={cn(
                    'text-[9px] opacity-40',
                    isDarkMode ? 'text-white' : 'text-zinc-500'
                  )}
                >
                  {stat.sub}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface ResultDashboardProps {
  result: any;
  imageUrl: string;
  onReset: () => void;
  isDarkMode: boolean;
  userCredits: number;
  onUnlock: () => void;
  isLocked?: boolean;
  user: any;
  userData?: any;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenPricing: () => void;
}

const RATIO_WEAKNESS_LABELS: Record<string, (v: number, u: string) => string> = {
  'Facial Thirds Balance': (v) => `Unbalanced facial thirds (${v}x — ideal ≥ 0.88)`,
  'Canthal Tilt Angle': (v) => `Below-ideal canthal tilt angle (${v}°)`,
  'Eye Spacing Ratio': (v) =>
    v < 0.85 ? `Close-set eye spacing ratio (${v}x)` : `Wide-set eye spacing ratio (${v}x)`,
  'Eye-to-Face Width Ratio': (v) => `Eye-to-face width imbalance (${v}x)`,
  'Jaw-to-Cheekbone Width': (v) => `Sub-ideal jaw-to-cheekbone ratio (${v}x)`,
  'Nose-to-Mouth Width': (v) => `Nose-to-mouth width disproportion (${v}x)`,
  'Mouth-to-Face Width': (v) => `Narrow mouth-to-face width (${v}x)`,
  'Philtrum-to-Nose Length': (v) => `Long philtrum ratio (${v}x)`,
  'Lip Thickness Ratio': (v) => `Suboptimal lip thickness ratio (${v}x)`,
  'Lower Face Ratio': (v) =>
    v > 0.38 ? `Long lower face ratio (${v}x)` : `Short lower face ratio (${v}x)`,
  'Midface Ratio': (v) =>
    v > 0.38
      ? `Elevated midface ratio — long nose bridge (${v}x)`
      : `Compressed midface ratio (${v}x)`,
  'Facial Width-to-Height Ratio': (v) => `Low facial width-to-height ratio (${v}x)`,
  'Golden Ratio Adherence': (v) => `Golden ratio deviation (φ ${v})`,
  'Gonial Angle': (v) => `Sub-ideal gonial angle (${v}°)`,
  'Palpebral Fissure Ratio': () => `Below-ideal palpebral fissure ratio`
};

const RATIO_STRENGTH_LABELS: Record<string, (v: number, u: string) => string> = {
  'Facial Thirds Balance': () => 'Well-balanced facial thirds',
  'Canthal Tilt Angle': (v) => `Strong positive canthal tilt (${v}°)`,
  'Eye Spacing Ratio': () => 'Ideal eye spacing ratio',
  'Jaw-to-Cheekbone Width': () => 'Ideal jaw-to-cheekbone ratio',
  'Midface Ratio': () => 'Balanced midface ratio',
  'Lower Face Ratio': () => 'Balanced lower face ratio',
  'Golden Ratio Adherence': () => 'Excellent golden ratio proportions',
  'Facial Width-to-Height Ratio': (v) => `Ideal fWHR (${v}x)`
};

// Topic-keyword index per ratio. Used to suppress contradictory insights
// (e.g. don't add "Balanced lower face ratio" as a strength if a weakness
// already says "Long lower face — disproportionate chin-to-nose distance").
// First match wins on either side: whichever pipeline (server analysis,
// ratio insights) produces the first hit "owns" that anatomy topic.
const RATIO_TOPIC_KEYWORDS_BY_NAME: Record<string, string[]> = {
  'Lower Face Ratio': ['lower face', 'lower facial third', 'chin-to-nose', 'chin to nose'],
  'Midface Ratio': ['midface', 'middle facial third', 'middle third'],
  'Facial Thirds Balance': [
    'facial thirds',
    'three thirds',
    'upper third',
    'middle third',
    'lower third'
  ],
  'Golden Ratio Adherence': ['golden ratio', 'φ', 'phi ratio'],
  'Facial Width-to-Height Ratio': ['fwhr', 'facial width-to-height', 'face width-to-height'],
  'Jaw-to-Cheekbone Width': ['jaw-to-cheekbone', 'jaw to cheekbone', 'cheek-to-jaw'],
  'Eye Spacing Ratio': ['eye spacing', 'interocular', 'intercanthal'],
  'Eye-to-Face Width Ratio': ['eye-to-face', 'eye to face width'],
  'Canthal Tilt Angle': ['canthal tilt', 'canthus'],
  'Nose-to-Mouth Width': ['nose-to-mouth', 'nasal-to-mouth'],
  'Mouth-to-Face Width': ['mouth-to-face', 'mouth width'],
  'Philtrum-to-Nose Length': ['philtrum', 'philtral'],
  'Lip Thickness Ratio': ['lip thickness', 'lip fullness', 'upper-to-lower lip'],
  'Gonial Angle': ['gonial angle', 'jaw angle', 'mandibular angle'],
  'Palpebral Fissure Ratio': ['palpebral', 'eye opening']
};

/* ── Gorgeous 30-Day Glow-Up Loop & Milestone Banner ── */
function GlowUpLoopBanner({
  isDarkMode,
  isLocked,
  overallScore,
  onImproveClick
}: {
  isDarkMode: boolean;
  isLocked: boolean;
  overallScore: number;
  onImproveClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-[2rem] border overflow-hidden p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10',
        isDarkMode
          ? 'bg-gradient-to-r from-[#07070f] via-[#0b0c16] to-[#04050a] border-white/[0.08]'
          : 'bg-gradient-to-r from-indigo-50/40 via-white to-zinc-50 border-zinc-200 shadow-md'
      )}
    >
      {/* Glow */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20 shadow-lg">
          <Calendar className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
              Continuous Improvement
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> Next Scan Ready In 30 Days
            </span>
          </div>
          <h3
            className={cn(
              'text-xl font-display font-bold',
              isDarkMode ? 'text-white' : 'text-zinc-900'
            )}
          >
            Track Your 30-Day Glow-Up Progress
          </h3>
          <p
            className={cn(
              'text-sm font-light max-w-xl leading-relaxed',
              isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
            )}
          >
            True structural improvements require consistent routines. Take a baseline scan today,
            implement your AI-customized improvement roadmap, and re-scan next month to lock in your
            progress milestones.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch lg:items-center gap-3 shrink-0">
        {/* Milestone preview badges */}
        <div className="flex items-center justify-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs font-mono">
          <div className="flex items-center gap-1.5 opacity-60">
            <Award className="w-4 h-4 text-amber-400" />
            <span>
              Best Harmony:{' '}
              <strong className={isDarkMode ? 'text-white font-black' : 'text-zinc-900 font-black'}>
                {overallScore.toFixed(1)}/10
              </strong>
            </span>
          </div>
        </div>
        <button
          onClick={onImproveClick}
          className="px-6 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group"
        >
          <span>Improve Your Score</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

export function ResultDashboard({
  result,
  imageUrl,
  onReset,
  isDarkMode,
  userCredits,
  onUnlock,
  isLocked = false,
  user,
  userData,
  onOpenAuth,
  onOpenPricing
}: ResultDashboardProps) {
  const pricingRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { preset, resetBudget } = useMotionTier();
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'plan'>('overview');

  // Reset screen budget whenever the user switches tabs, so the newly-mounted
  // panel's critical + secondary animations are not starved by earlier ones.
  const handleTabChange = useCallback(
    (tab: 'overview' | 'analysis' | 'plan') => {
      resetBudget('tab');
      setActiveTab(tab);
    },
    [resetBudget]
  );

  // Wire up shared controller — single source of truth for memoized data & shared state
  const ctrl = useDashboardController(result);
  const {
    overallScore,
    structuralScore,
    visualScore,
    breakdown,
    metrics,
    analysis,
    detailedSymmetry,
    improvementData,
    potentialScore
  } = ctrl;

  // Normalize landmarks to crop-space for ratio computation
  const ratioPoints = useMemo(() => {
    const lms = result.landmarks;
    const ci = result.cropInfo;
    if (!lms || !ci || lms.length < 468) return null;
    const { cropX, cropY, imgWidth, imgHeight, cropW, cropH } = ci as any;
    return lms.map((lm: any) => ({
      x: (lm.x * imgWidth - cropX) / cropW,
      y: (lm.y * imgHeight - cropY) / cropH
    }));
  }, [result.landmarks, result.cropInfo]);

  const ratios = useRatioData(metrics, breakdown, ratioPoints);

  const ratioInsights = useMemo(() => {
    const existingW = analysis.weaknesses.map((w) => w.toLowerCase());
    const existingS = analysis.strengths.map((s) => s.toLowerCase());
    const existingWSet = new Set(existingW);
    const existingSSet = new Set(existingS);
    const addW: string[] = [];
    const addS: string[] = [];

    // Check whether any item (in either list) already covers this ratio's topic
    const topicAlreadyCovered = (ratioName: string): boolean => {
      const kws = RATIO_TOPIC_KEYWORDS_BY_NAME[ratioName];
      if (!kws) return false;
      const all = [
        ...existingW,
        ...existingS,
        ...addW.map((s) => s.toLowerCase()),
        ...addS.map((s) => s.toLowerCase())
      ];
      return all.some((line) => kws.some((kw) => line.includes(kw)));
    };

    for (const r of ratios) {
      const v = typeof r.value === 'number' ? r.value : parseFloat(String(r.value));
      if (r.score < 6.5) {
        const fn = RATIO_WEAKNESS_LABELS[r.name];
        if (fn) {
          const label = fn(v, r.unit);
          const key = label.toLowerCase();
          if (
            !existingWSet.has(key) &&
            !addW.some((w) => w.toLowerCase() === key) &&
            !topicAlreadyCovered(r.name)
          ) {
            addW.push(label);
          }
        }
      } else if (r.score >= 8.5) {
        const fn = RATIO_STRENGTH_LABELS[r.name];
        if (fn) {
          const label = fn(v, r.unit);
          const key = label.toLowerCase();
          if (
            !existingSSet.has(key) &&
            !addS.some((s) => s.toLowerCase() === key) &&
            !topicAlreadyCovered(r.name)
          ) {
            addS.push(label);
          }
        }
      }
    }
    return { weaknesses: addW, strengths: addS };
  }, [ratios, analysis]);
  const { isGeneratingCard, setIsGeneratingCard } = ctrl.uiState;
  const { celebrityResults } = ctrl.celebState;

  // Calculate percentile and rank
  const topPercentile = Math.max(2, Math.round(25 - overallScore * 2.2));
  const baseUsers = 168229;
  const daysSinceLaunch = Math.min(
    365,
    Math.floor((new Date().getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24))
  );
  const totalUsers = baseUsers + daysSinceLaunch * 142;
  const userRank = Math.max(1, Math.floor(totalUsers * (topPercentile / 100)));

  // Fire confetti when invitedCount increases
  const prevInvitedCount = useRef(userData?.invitedCount || 0);
  useEffect(() => {
    const count = userData?.invitedCount || 0;
    if (count > prevInvitedCount.current) {
      fireConfetti();
    }
    prevInvitedCount.current = count;
  }, [userData?.invitedCount]);

  const radarData = useMemo(() => {
    const data = [{ subject: 'Eyes', A: breakdown.Eyes || 5, fullMark: 10 }];
    if (breakdown['Skin Quality'] !== undefined) {
      data.push({ subject: 'Surface Quality', A: breakdown['Skin Quality'] || 5, fullMark: 10 });
    }
    data.push(
      { subject: 'Symmetry', A: breakdown.Symmetry || 5, fullMark: 10 },
      { subject: 'Jawline', A: breakdown.Jawline || 5, fullMark: 10 },
      { subject: 'Hair', A: breakdown.Hair || 7.5, fullMark: 10 },
      { subject: 'Dimorphism', A: breakdown.Dimorphism || 5, fullMark: 10 }
    );
    if (breakdown['Grooming'] !== undefined) {
      data.push({ subject: 'Grooming', A: breakdown['Grooming'] || 5, fullMark: 10 });
    }
    if (breakdown['Cheekbones'] !== undefined) {
      data.push({ subject: 'Cheekbones', A: breakdown['Cheekbones'] || 5, fullMark: 10 });
    }
    if (data.length % 2 !== 0) {
      data.push({ subject: 'Facial Balance', A: 7.5, fullMark: 10 });
    }
    return data;
  }, [breakdown]);

  const strengthsWithRatioInsights = useMemo(
    () => [...analysis.strengths, ...ratioInsights.strengths],
    [analysis.strengths, ratioInsights.strengths]
  );
  const weaknessesWithRatioInsights = useMemo(
    () => [...analysis.weaknesses, ...ratioInsights.weaknesses],
    [analysis.weaknesses, ratioInsights.weaknesses]
  );

  const generateShareCard = useCallback(async () => {
    if (isGeneratingCard) return;
    setIsGeneratingCard(true);

    try {
      const referralCode = userData?.referralCode || '';
      const shareUrl = `${window.location.origin}${referralCode ? `?ref=${referralCode}` : ''}`;

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // 1. Futuristic Dark Gradient Background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
      bgGradient.addColorStop(0, '#030208');
      bgGradient.addColorStop(0.5, '#0b0916');
      bgGradient.addColorStop(1, '#010103');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Cybernetic Background Grid (Tech HUD feel)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 1080; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1920);
        ctx.stroke();
      }
      for (let y = 0; y <= 1920; y += 120) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1080, y);
        ctx.stroke();
      }

      // Neon Ambient Backdrops
      const glow1 = ctx.createRadialGradient(200, 400, 100, 200, 400, 900);
      glow1.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
      glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, 1080, 1920);

      const glow2 = ctx.createRadialGradient(880, 1500, 100, 880, 1500, 800);
      glow2.addColorStop(0, 'rgba(0, 240, 255, 0.1)');
      glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, 1080, 1920);

      // Load scanned face photo
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Load QR Code
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}&color=ffffff&bgcolor=030208`;
      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.onerror = () => {
          console.warn('QR Code generation failed, continuing without QR');
          resolve(null);
        };
      });

      // 2. Technical Viewfinder Image Frame
      const destW = 880;
      const destH = 880;
      const destX = 100;
      const destY = 160;

      // Draw subtle neon corner brackets around image box
      const drawCornerBrackets = (x: number, y: number, w: number, h: number, len: number) => {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        
        // Top-Left
        ctx.beginPath();
        ctx.moveTo(x + len, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + len);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(x + w - len, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + len);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(x, y + h - len);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + len, y + h);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(x + w, y + h - len);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w - len, y + h);
        ctx.stroke();
      };

      ctx.save();
      // Card container drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;

      // Rounded clip for face picture
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(destX, destY, destW, destH, 40);
      else ctx.rect(destX, destY, destW, destH);
      ctx.fill();
      ctx.clip();
      ctx.shadowBlur = 0;

      const scale = Math.max(destW / img.width, destH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = destX - (drawW - destW) / 2;
      const drawY = destY - (drawH - destH) / 2;

      // Blurred Background
      ctx.filter = 'blur(15px) brightness(0.4) saturate(0.7)';
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.filter = 'none';

      // Draw Sharp Eyes Strip with target rings
      if (ratioPoints && ratioPoints.length > 263) {
        const leftEye = ratioPoints[33];
        const rightEye = ratioPoints[263];
        const eyeY = (leftEye.y + rightEye.y) / 2;

        const eyeStripH = 240;
        const eyeStripY = drawY + eyeY * drawH - eyeStripH / 2;

        ctx.save();
        ctx.beginPath();
        ctx.rect(
          destX,
          Math.max(destY, eyeStripY),
          destW,
          Math.min(eyeStripH, destY + destH - Math.max(destY, eyeStripY))
        );
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        // Neon border on eye strip
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(
          destX,
          Math.max(destY, eyeStripY),
          destW,
          Math.min(eyeStripH, destY + destH - Math.max(destY, eyeStripY))
        );

        // Draw biometric crosshair target circles on the eyes
        const lex = drawX + leftEye.x * drawW;
        const ley = drawY + leftEye.y * drawH;
        const rex = drawX + rightEye.x * drawW;
        const rey = drawY + rightEye.y * drawH;

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;

        // Left Eye Target
        ctx.beginPath();
        ctx.arc(lex, ley, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(lex, ley, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#00f0ff';
        ctx.fill();

        // Right Eye Target
        ctx.beginPath();
        ctx.arc(rex, rey, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(rex, rey, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#00f0ff';
        ctx.fill();

        ctx.restore();
      } else {
        // Fallback: sharp center strip
        ctx.save();
        ctx.beginPath();
        ctx.rect(destX, destY + destH * 0.35, destW, destH * 0.3);
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(destX, destY + destH * 0.35, destW, destH * 0.3);
        ctx.restore();
      }

      // HUD Text overlay inside image box
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('SCAN_VIEWPORT // AUTOMATIC_LANDMARK_DETECTION', destX + 25, destY + 35);

      ctx.restore();

      // Draw neon brackets around the image frame
      drawCornerBrackets(destX, destY, destW, destH, 40);

      // 3. Technical Top Header (Above Image)
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.letterSpacing = '3px';
      ctx.fillText('// VISAGEX NEURAL HARMONY ENGINE', 100, 70);

      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.fillText('BIOMETRIC REPORT // VER. 2.5', 980, 70);

      // Neon separator line
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(100, 105);
      ctx.lineTo(980, 105);
      ctx.stroke();

      // 4. Circular HUD Score Gauge (Center Placement)
      const scoreX = 540;
      const scoreY = 1110;
      const radius = 100;

      // Outer dotted frame
      ctx.beginPath();
      ctx.arc(scoreX, scoreY, radius + 15, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]); // clear dash

      // Gauge background track
      ctx.beginPath();
      ctx.arc(scoreX, scoreY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 12;
      ctx.stroke();

      // Glowing score arc
      ctx.beginPath();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (overallScore / 10) * Math.PI * 2;
      ctx.arc(scoreX, scoreY, radius, startAngle, endAngle);
      
      const arcGrad = ctx.createLinearGradient(scoreX - radius, scoreY - radius, scoreX + radius, scoreY + radius);
      arcGrad.addColorStop(0, '#6366f1');
      arcGrad.addColorStop(0.5, '#a855f7');
      arcGrad.addColorStop(1, '#00f0ff');
      
      ctx.strokeStyle = arcGrad;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      
      ctx.save();
      ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();

      // Inner dark core
      ctx.beginPath();
      ctx.arc(scoreX, scoreY, radius - 6, 0, Math.PI * 2);
      ctx.fillStyle = '#06050b';
      ctx.fill();

      // Score Value
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 86px "Inter", sans-serif';
      ctx.letterSpacing = '-2px';
      ctx.fillText(overallScore.toFixed(1), scoreX, scoreY - 10);

      // Label under score
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.letterSpacing = '3px';
      ctx.fillText('OVERALL', scoreX, scoreY + 45);

      // 5. Redesigned Stats Grid with Progress Bars
      const drawPremiumStat = (label: string, value: string, sx: number, sy: number) => {
        const w = 420;
        const h = 130;
        
        ctx.save();
        // Dark premium backdrop card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
        if (ctx.roundRect) ctx.roundRect(sx, sy, w, h, 24);
        ctx.fill();
        
        // Subtle outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Left accent neon border strip
        ctx.beginPath();
        const isLocked = value === 'LOCKED';
        const accentGrad = ctx.createLinearGradient(sx, sy, sx, sy + h);
        if (isLocked) {
          accentGrad.addColorStop(0, '#a855f7');
          accentGrad.addColorStop(1, '#3b0764');
        } else {
          accentGrad.addColorStop(0, '#00f0ff');
          accentGrad.addColorStop(1, '#6366f1');
        }
        ctx.fillStyle = accentGrad;
        if (ctx.roundRect) ctx.roundRect(sx, sy, 5, h, [24, 0, 0, 24]);
        ctx.fill();
        
        // Stat Label
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = 'bold 18px "JetBrains Mono", monospace';
        ctx.letterSpacing = '1px';
        ctx.fillText(label, sx + 30, sy + 38);
        
        // Stat Value / Locked Badge
        ctx.textAlign = 'right';
        if (isLocked) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.9)';
          ctx.font = 'bold 20px "JetBrains Mono", monospace';
          ctx.fillText('LOCKED 🔒', sx + w - 30, sy + 38);
          
          // Draw diagonal warning stripes on the progress bar space
          const barX = sx + 30;
          const barY = sy + 85;
          const barW = w - 60;
          const barH = 8;
          
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(barX, barY, barW, barH, 4);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
          ctx.lineWidth = 1;
          for (let offset = 0; offset < barW; offset += 16) {
            ctx.beginPath();
            ctx.moveTo(barX + offset, barY + barH);
            ctx.lineTo(barX + offset + 8, barY);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 48px "Inter", sans-serif';
          ctx.fillText(value, sx + w - 30, sy + 38);
          
          // Draw score progress gauge bar
          const scoreNum = parseFloat(value) || 0;
          const barX = sx + 30;
          const barY = sy + 85;
          const barW = w - 60;
          const barH = 8;
          
          // Gray track
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(barX, barY, barW, barH, 4);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.fill();
          
          // Filled neon gradient progress
          const fillW = Math.max(8, barW * (scoreNum / 10));
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(barX, barY, fillW, barH, 4);
          const barFillGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
          barFillGrad.addColorStop(0, '#6366f1');
          barFillGrad.addColorStop(1, '#00f0ff');
          ctx.fillStyle = barFillGrad;
          ctx.fill();
        }
        
        ctx.restore();
      };

      const getStatValue = (key: string) => {
        const val = breakdown[key];
        if (val === undefined || val === null) return 'LOCKED';
        return val.toFixed(1);
      };

      const gridY = 1270;
      drawPremiumStat('SYMMETRY', getStatValue('Symmetry'), 100, gridY);
      drawPremiumStat('JAWLINE', getStatValue('Jawline'), 560, gridY);
      drawPremiumStat('SURFACE QUALITY', getStatValue('Skin Quality'), 100, gridY + 160);
      drawPremiumStat('EYES BALANCE', getStatValue('Eyes'), 560, gridY + 160);

      // 6. Cybernetic Footer with Branding and QR
      const footerY = gridY + 330;

      // Divider line
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(100, footerY);
      ctx.lineTo(980, footerY);
      ctx.stroke();

      // Brand text (Left column)
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.letterSpacing = '4px';
      ctx.fillText('SCAN OR REFER TO RE-CALCULATE', 100, footerY + 50);

      const brandFooterGrad = ctx.createLinearGradient(100, 0, 450, 0);
      brandFooterGrad.addColorStop(0, '#6366f1');
      brandFooterGrad.addColorStop(1, '#00f0ff');
      ctx.fillStyle = brandFooterGrad;
      ctx.font = '900 56px "Inter", sans-serif';
      ctx.letterSpacing = '-2px';
      ctx.fillText('visagex.online', 100, footerY + 115);

      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.letterSpacing = '1px';
      let bottomText = `FACE SHAPE: ${result.visionAnalysis?.faceShape?.toUpperCase() || 'UNKNOWN'}`;
      if (result.visionAnalysis?.celebritySimilarity?.[0]) {
        bottomText += `  •  MATCH: ${result.visionAnalysis.celebritySimilarity[0].name.toUpperCase()}`;
      }
      ctx.fillText(bottomText, 100, footerY + 175);

      // QR Code block sitting in frame (Right column)
      if (qrImg && qrImg.complete) {
        const qrX = 820;
        const qrY = footerY + 25;
        const qrSize = 160;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 240, 255, 0.2)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#06050b';
        if (ctx.roundRect) ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Draw QR
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // QR label
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.letterSpacing = '2px';
        ctx.fillText('SCAN ME', qrX + qrSize / 2, qrY + qrSize + 28);
      }

      // Download trigger
      const link = document.createElement('a');
      link.download = `visagex-harmony-score-${overallScore.toFixed(1)}-${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (err) {
      console.error('Failed to generate premium card:', err);
      alert('Failed to generate premium card. Please try again.');
    } finally {
      setIsGeneratingCard(false);
    }
  }, [
    breakdown,
    imageUrl,
    isGeneratingCard,
    overallScore,
    ratioPoints,
    result.visionAnalysis,
    setIsGeneratingCard,
    userData
  ]);

  const scrollToPricing = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (pricingRef.current) {
      try {
        const offset = -60;
        if ((window as any).lenis) {
          (window as any).lenis.scrollTo(pricingRef.current, {
            offset: offset,
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        } else {
          const y = pricingRef.current.getBoundingClientRect().top + window.scrollY + offset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      } catch (err) {
        console.error('Scroll error:', err);
      }
    }
  }, []);

  const handleApplyReferral = useCallback(
    async (code: string) => {
      if (!user?.uid) throw new Error('Please sign in to apply a referral code');
      const fingerprint = `${window.screen.width}x${window.screen.height}-${navigator.userAgent}`;
      const response = await fetch('/api/referral/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          referralCode: code,
          fingerprint
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to apply code');
      return data;
    },
    [user?.uid]
  );

  const dashboardContextValue = useMemo(
    () => ({
      isDarkMode,
      isLocked,
      scrollToPricing,
      onOpenPricing,
      pricingRef,
      isGeneratingCard
    }),
    [isDarkMode, isLocked, scrollToPricing, onOpenPricing, isGeneratingCard]
  );

  return (
    <DashboardProvider value={dashboardContextValue}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="w-full mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-[1400px]"
      >
        <AnimatePresence>
          {isGeneratingCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center gap-6 text-center"
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-white/5 border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display italic text-white">
                    Generating Neural Card
                  </h3>
                  <p className="text-zinc-400 text-sm font-medium tracking-widest uppercase">
                    Analyzing 468 landmarks...
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ResultHeader
          isDarkMode={isDarkMode}
          onReset={onReset}
          onGenerateCard={generateShareCard}
          isGeneratingCard={isGeneratingCard}
        />

        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isDarkMode={isDarkMode}
          imageUrl={imageUrl}
          isLocked={isLocked}
          celebrityResults={celebrityResults}
        />

        <AnimatePresence mode="wait">
          {/* ════════════ OVERVIEW TAB ════════════ */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: preset.durations.fast, ease: easings.easeOutExpo }}
              className="flex flex-col gap-8 md:gap-10"
            >
              <ScoreSection
                imageUrl={imageUrl}
                landmarks={result.landmarks}
                cropInfo={result.cropInfo}
                metrics={metrics}
                isDarkMode={isDarkMode}
                overallScore={overallScore}
                structuralScore={structuralScore}
                visualScore={visualScore}
                topPercentile={topPercentile}
                userRank={userRank}
                totalUsers={totalUsers}
                isLocked={isLocked}
                user={user}
                userData={userData}
                onUnlock={onUnlock}
                scrollToPricing={scrollToPricing}
                onOpenPricing={onOpenPricing}
                radarData={radarData}
              />
              <BreakdownCards breakdown={breakdown} isDarkMode={isDarkMode} isLocked={isLocked} />
              {result.visionAnalysis && (
                <div className="order-[12]">
                  <VisionAnalysisSection
                    isDarkMode={isDarkMode}
                    isLocked={isLocked}
                    visionAnalysis={result.visionAnalysis}
                  />
                </div>
              )}

              {!isLocked && (
                <div className="order-[15]">
                  <GlowUpLoopBanner
                    isDarkMode={isDarkMode}
                    isLocked={isLocked}
                    overallScore={overallScore}
                    onImproveClick={() => setActiveTab('plan')}
                  />
                </div>
              )}

              {/* ── Premium Discovery Cards: Celebrity + Hair ── */}
              <div className="order-[30] grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                {/* Celebrity Lookalike Card */}
                <motion.button
                  onClick={() =>
                    navigate('/celebrity', { state: { imageUrl, isLocked, celebrityResults } })
                  }
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  className={cn(
                    'group relative w-full text-left rounded-3xl overflow-hidden border transition-all duration-500',
                    isDarkMode ? 'border-white/[.08]' : 'border-zinc-200 shadow-lg hover:shadow-2xl'
                  )}
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #0a0a14 0%, #0f1424 40%, #0a0e1a 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 50%, #faf5ff 100%)'
                  }}
                >
                  {/* ambient glows */}
                  <div
                    className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 70%)',
                      filter: 'blur(20px)'
                    }}
                  />
                  <div
                    className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(168,85,247,0.16) 0%, transparent 70%)',
                      filter: 'blur(24px)'
                    }}
                  />

                  {/* shimmer line on top */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

                  {/* shimmer sweep on hover */}
                  <div
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)'
                    }}
                  />

                  <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                    {/* Left — face stack collage */}
                    <div className="relative flex-shrink-0 flex items-center">
                      {/* Your face */}
                      <div className="relative z-20">
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 opacity-40 blur-md" />
                        <img
                          src={imageUrl}
                          alt="You"
                          className={cn(
                            'relative w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2',
                            isDarkMode ? 'border-white/15' : 'border-white shadow-lg'
                          )}
                        />
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-widest">
                          YOU
                        </span>
                      </div>

                      {/* match indicator */}
                      <div className="relative z-10 -mx-3 md:-mx-4 flex flex-col items-center">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md',
                            isDarkMode
                              ? 'bg-white/10 border border-white/20'
                              : 'bg-white border border-zinc-200 shadow'
                          )}
                        >
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                        </div>
                      </div>

                      {/* Mystery celebrity silhouettes */}
                      <div className="relative z-0 flex">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              'relative -ml-4 w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 flex items-center justify-center overflow-hidden',
                              isDarkMode
                                ? 'bg-white/[.04] border-white/10'
                                : 'bg-zinc-100 border-white shadow'
                            )}
                            style={{ zIndex: 3 - i, opacity: 1 - i * 0.2 }}
                          >
                            {celebrityResults[i]?.imageUrl ? (
                              <img
                                src={celebrityResults[i].imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Users
                                className={cn(
                                  'w-7 h-7',
                                  isDarkMode ? 'text-white/20' : 'text-zinc-300'
                                )}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right — copy */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                      <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-black text-cyan-400 tracking-[0.25em] uppercase">
                          Beta · AI Match
                        </span>
                        {celebrityResults.length > 0 && (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[9px] font-black tracking-[0.2em] uppercase',
                              isDarkMode
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                            )}
                          >
                            {celebrityResults.length} found
                          </span>
                        )}
                      </div>

                      <h3
                        className={cn(
                          'text-2xl md:text-3xl font-display italic mb-2 tracking-tight',
                          isDarkMode ? 'text-white' : 'text-zinc-900'
                        )}
                      >
                        Who's your celebrity twin?
                      </h3>
                      <p
                        className={cn(
                          'text-sm leading-relaxed max-w-md mx-auto md:mx-0',
                          isDarkMode ? 'text-white/50' : 'text-zinc-500'
                        )}
                      >
                        {celebrityResults.length > 0
                          ? `Top match: ${celebrityResults[0]?.name} · ${celebrityResults[0]?.percentage}% similarity. Tap to explore all matches.`
                          : 'Discover the public figures who share your facial structure — analyzed by neural facial geometry matching.'}
                      </p>

                      <div
                        className={cn(
                          'mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all',
                          isDarkMode
                            ? 'text-cyan-400 group-hover:text-cyan-300'
                            : 'text-cyan-600 group-hover:text-cyan-700'
                        )}
                      >
                        {celebrityResults.length > 0 ? 'View Matches' : 'Run Scan'}
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </motion.button>

                {/* Hair Analysis Card */}
                <motion.button
                  onClick={() => navigate('/hair', { state: { imageUrl } })}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  className={cn(
                    'group relative w-full text-left rounded-3xl overflow-hidden border transition-all duration-500',
                    isDarkMode ? 'border-white/[.08]' : 'border-zinc-200 shadow-lg hover:shadow-2xl'
                  )}
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #0a0a14 0%, #1a0f24 40%, #14091e 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #faf5ff 50%, #fdf2f8 100%)'
                  }}
                >
                  {/* ambient glows */}
                  <div
                    className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)',
                      filter: 'blur(20px)'
                    }}
                  />
                  <div
                    className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(236,72,153,0.16) 0%, transparent 70%)',
                      filter: 'blur(24px)'
                    }}
                  />

                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

                  <div
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)'
                    }}
                  />

                  <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    {/* Left — face + scissors visual */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 opacity-50 blur-lg" />
                      <img
                        src={imageUrl}
                        alt="Your face"
                        className={cn(
                          'relative w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2',
                          isDarkMode ? 'border-white/15' : 'border-white shadow-lg'
                        )}
                      />
                      <div
                        className={cn(
                          'absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md border-2 shadow-lg',
                          isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white border-zinc-200'
                        )}
                      >
                        <Scissors className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>

                    {/* Right — copy */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                      <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-[9px] font-black text-purple-400 tracking-[0.25em] uppercase">
                          New · Trichology AI
                        </span>
                      </div>

                      <h3
                        className={cn(
                          'text-2xl md:text-3xl font-display italic mb-2 tracking-tight',
                          isDarkMode ? 'text-white' : 'text-zinc-900'
                        )}
                      >
                        Decode your hair
                      </h3>
                      <p
                        className={cn(
                          'text-sm leading-relaxed max-w-md mx-auto md:mx-0',
                          isDarkMode ? 'text-white/50' : 'text-zinc-500'
                        )}
                      >
                        Hair type, density, hairline, recommended styles & a personalized care
                        routine — built from a single photo.
                      </p>

                      <div
                        className={cn(
                          'mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all',
                          isDarkMode
                            ? 'text-purple-400 group-hover:text-purple-300'
                            : 'text-purple-600 group-hover:text-purple-700'
                        )}
                      >
                        Run Hair Scan
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </motion.button>
              </div>
              {/* /grid */}

              <div
                id="strengths-section"
                className="order-[20] grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6 items-start w-full"
              >
                {/* Left: Strengths + Friend Invite */}
                <div className="flex flex-col gap-5 w-full">
                  <StrengthsAndWeaknesses
                    isDarkMode={isDarkMode}
                    isLocked={isLocked}
                    show="strengths"
                    strengths={strengthsWithRatioInsights}
                    weaknesses={weaknessesWithRatioInsights}
                    breakdown={breakdown}
                    onUnlock={onUnlock}
                    insightDescriptions={result.visionAnalysis?.insightDescriptions}
                    imageUrl={imageUrl}
                    ratios={ratios}
                    ratioPoints={ratioPoints}
                    cropInfo={result.cropInfo}
                  />
                </div>

                {/* Right: Weaknesses */}
                <div className="flex flex-col gap-5 w-full">
                  <StrengthsAndWeaknesses
                    isDarkMode={isDarkMode}
                    isLocked={isLocked}
                    show="weaknesses"
                    strengths={strengthsWithRatioInsights}
                    weaknesses={weaknessesWithRatioInsights}
                    breakdown={breakdown}
                    onUnlock={onUnlock}
                    insightDescriptions={result.visionAnalysis?.insightDescriptions}
                    imageUrl={imageUrl}
                    ratios={ratios}
                    ratioPoints={ratioPoints}
                    cropInfo={result.cropInfo}
                  />
                </div>
              </div>

              {!isLocked && (
                <div className="order-[40]">
                  <ViralReferralEngine
                    isDarkMode={isDarkMode}
                    isGlassy={false}
                    user={user}
                    userData={userData}
                    overallScore={overallScore}
                    topPercentile={topPercentile}
                    onOpenAuth={onOpenAuth}
                    onApplyReferral={handleApplyReferral}
                  />
                </div>
              )}

              {!isLocked && (
                <div className="order-[25]">
                  <GlowUpCoach result={result} isDarkMode={isDarkMode} />
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════ ANALYSIS TAB ════════════ */}
          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: preset.durations.fast, ease: easings.easeOutExpo }}
            >
              <div ref={pricingRef} className="relative">
                <div
                  className={cn(
                    'space-y-6 md:space-y-8 transition-all duration-700',
                    isLocked ? 'select-none' : ''
                  )}
                >
                  <FacialRatioExplorer
                    imageUrl={imageUrl}
                    landmarks={result.landmarks}
                    cropInfo={result.cropInfo}
                    metrics={metrics}
                    breakdown={breakdown}
                    isDarkMode={isDarkMode}
                    isLocked={isLocked}
                  />
                  {/* Celebrity Lookalike — navigates to dedicated page */}
                  <motion.button
                    onClick={() =>
                      navigate('/celebrity', { state: { imageUrl, isLocked, celebrityResults } })
                    }
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      'w-full rounded-2xl p-5 md:p-6 border text-left transition-all duration-300 group flex items-center gap-5',
                      isDarkMode
                        ? 'bg-white/[.02] border-white/[.06] hover:bg-white/[.05]'
                        : 'bg-white border-zinc-200 shadow-sm hover:shadow-md'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-50'
                      )}
                    >
                      <Users className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={cn(
                          'text-base font-display italic',
                          isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                        )}
                      >
                        Celebrity Lookalike
                      </h3>
                      <p
                        className={cn(
                          'text-xs mt-0.5',
                          isDarkMode ? 'text-white/40' : 'text-zinc-500'
                        )}
                      >
                        {celebrityResults.length > 0
                          ? `${celebrityResults.length} matches found`
                          : 'Find your celebrity twin with AI'}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        'w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1',
                        isDarkMode ? 'text-white/20' : 'text-zinc-300'
                      )}
                    />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════ PLAN TAB ════════════ */}
          {activeTab === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: preset.durations.fast, ease: easings.easeOutExpo }}
              className="space-y-6"
            >
              <TimelinePlan
                items={result.visionAnalysis?.improvementPlan || []}
                isDarkMode={isDarkMode}
                isLocked={isLocked}
                onUnlock={onUnlock}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardProvider>
  );
}
