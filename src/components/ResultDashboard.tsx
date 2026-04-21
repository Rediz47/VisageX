import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, BarChart2, Activity, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { fireConfetti } from '../lib/confetti';
import { useDashboardController } from '../features/dashboard/useDashboardController';
import { DashboardProvider } from '../context/DashboardContext';

// Dashboard Components
import { ResultHeader } from './dashboard/ResultHeader';
import { TabNavigation } from './dashboard/TabNavigation';
import { ScoreSection } from './dashboard/ScoreSection';
import FeatureBreakdownGrid from './dashboard/FeatureBreakdownGrid';
import { ViralReferralEngine } from './dashboard/ViralReferralEngine';
import { StrengthsAndWeaknesses } from './dashboard/StrengthsAndWeaknesses';
import { CelebritySection } from './dashboard/CelebritySection';
import { VisionAnalysisSection } from './dashboard/VisionAnalysisSection';
import { DermatologySection } from './dashboard/DermatologySection';
import { MetricsGrid } from './dashboard/MetricsGrid';
import { UnlockOverlay } from './dashboard/UnlockOverlay';
import { FacialRatioExplorer } from './FacialRatioExplorer';
import { useRatioData } from './facial-ratio/useRatioData';
import { GlowUpCoach } from './GlowUpCoach';
import { TimelinePlan } from './dashboard/TimelinePlan';
import { BreakdownCards } from './dashboard/BreakdownCards';

/* ── Ratio Summary Card (overview) ── */
function RatioAnalysisTeaser({
  imageUrl, isDarkMode, overallScore
}: {
  imageUrl: string; isDarkMode: boolean; overallScore: number;
}) {
  const sc = overallScore >= 8 ? { hex: '#22c55e', label: 'Excellent', glow: 'rgba(34,197,94,0.3)' }
    : overallScore >= 6 ? { hex: '#f59e0b', label: 'Good', glow: 'rgba(245,158,11,0.3)' }
      : { hex: '#ef4444', label: 'Developing', glow: 'rgba(239,68,68,0.3)' };
  const pct = Math.max(1, Math.min(99, Math.round(((overallScore - 5) / 5) * 100)));

  const stats = [
    { label: 'Ratio Score', value: overallScore.toFixed(1), sub: sc.label, color: sc.hex, glow: sc.glow },
    { label: 'Percentile', value: `Top ${pct}%`, sub: 'vs all users', color: '#f59e0b', glow: 'rgba(245,158,11,0.25)' },
    { label: 'Metrics', value: '16', sub: 'measurements', color: '#818cf8', glow: 'rgba(129,140,248,0.25)' },
    { label: 'Landmarks', value: '468', sub: 'data points', color: '#22d3ee', glow: 'rgba(34,211,238,0.25)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl md:rounded-3xl overflow-hidden"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #09090b 0%, #0f0f1a 40%, #0a0a14 100%)'
          : 'linear-gradient(135deg, #f8faff 0%, #eef2ff 40%, #faf5ff 100%)',
        boxShadow: isDarkMode
          ? '0 0 0 1px rgba(255,255,255,0.07), 0 24px 48px -8px rgba(0,0,0,0.7)'
          : '0 0 0 1px rgba(99,102,241,0.15), 0 24px 48px -8px rgba(99,102,241,0.15)',
      }}
    >
      <div className="absolute top-0 left-1/4 w-96 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(20px)' }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(168,85,247,0.10) 0%, transparent 70%)', filter: 'blur(20px)' }} />

      <div className="relative flex flex-col lg:flex-row items-stretch gap-0">
        {/* Face preview */}
        <div className="relative lg:w-64 xl:w-72 flex-shrink-0 overflow-hidden">
          <div className="relative h-52 lg:h-full min-h-[200px]">
            <img src={imageUrl} alt="Face" className="w-full h-full object-cover object-top" style={{ filter: 'brightness(0.75) contrast(1.1) saturate(0.85)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 50%, ' + (isDarkMode ? '#09090b' : '#f8faff') + ' 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-base text-white border-2 border-white/20"
                style={{ background: `conic-gradient(${sc.hex} ${overallScore * 36}deg, rgba(255,255,255,0.08) 0deg)`, boxShadow: `0 0 16px ${sc.glow}` }}>
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
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Facial Ratio Analysis</span>
            </div>
            <h2 className={cn('text-xl md:text-2xl font-black tracking-tight', isDarkMode ? 'text-white' : 'text-zinc-900')}>Deep Structural Analysis</h2>
            <p className={cn('text-[12px] mt-1 opacity-50', isDarkMode ? 'text-white' : 'text-zinc-700')}>16 measurements · 468 landmarks · ideal range comparison</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.07 }}
                className={cn('rounded-xl p-3.5 border flex flex-col gap-1', isDarkMode ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-white shadow-sm')}
                style={{ boxShadow: `inset 0 0 20px ${stat.glow}` }}>
                <p className={cn('text-[8px] font-bold uppercase tracking-widest opacity-40', isDarkMode ? 'text-white' : 'text-zinc-600')}>{stat.label}</p>
                <p className="text-2xl font-black tabular-nums leading-none" style={{ color: stat.color, textShadow: `0 0 16px ${stat.glow}` }}>{stat.value}</p>
                <p className={cn('text-[9px] opacity-40', isDarkMode ? 'text-white' : 'text-zinc-500')}>{stat.sub}</p>
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
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'plan'>('overview');

  // Wire up shared controller — single source of truth for memoized data & shared state
  const ctrl = useDashboardController(result);
  const { overallScore, breakdown, metrics, analysis, detailedSymmetry, improvementData, potentialScore } = ctrl;

  // Normalize landmarks to crop-space for ratio computation
  const ratioPoints = useMemo(() => {
    const lms = result.landmarks;
    const ci = result.cropInfo;
    if (!lms || !ci || lms.length < 468) return null;
    const { cropX, cropY, imgWidth, imgHeight, cropW, cropH } = ci as any;
    return lms.map((lm: any) => ({
      x: (lm.x * imgWidth - cropX) / cropW,
      y: (lm.y * imgHeight - cropY) / cropH,
    }));
  }, [result.landmarks, result.cropInfo]);

  const ratios = useRatioData(metrics, breakdown, ratioPoints);

  const RATIO_WEAKNESS_LABEL: Record<string, (v: number, u: string) => string> = {
    'Facial Thirds Balance':      (v) => `Unbalanced facial thirds (${v}x — ideal ≥ 0.88)`,
    'Canthal Tilt Angle':         (v) => `Below-ideal canthal tilt angle (${v}°)`,
    'Eye Spacing Ratio':          (v) => v < 0.85 ? `Close-set eye spacing ratio (${v}x)` : `Wide-set eye spacing ratio (${v}x)`,
    'Eye-to-Face Width Ratio':    (v) => `Eye-to-face width imbalance (${v}x)`,
    'Jaw-to-Cheekbone Width':     (v) => `Sub-ideal jaw-to-cheekbone ratio (${v}x)`,
    'Nose-to-Mouth Width':        (v) => `Nose-to-mouth width disproportion (${v}x)`,
    'Mouth-to-Face Width':        (v) => `Narrow mouth-to-face width (${v}x)`,
    'Philtrum-to-Nose Length':    (v) => `Long philtrum ratio (${v}x)`,
    'Lip Thickness Ratio':        (v) => `Suboptimal lip thickness ratio (${v}x)`,
    'Lower Face Ratio':           (v) => v > 0.38 ? `Long lower face ratio (${v}x)` : `Short lower face ratio (${v}x)`,
    'Midface Ratio':              (v) => v > 0.38 ? `Elevated midface ratio — long nose bridge (${v}x)` : `Compressed midface ratio (${v}x)`,
    'Facial Width-to-Height Ratio': (v) => `Low facial width-to-height ratio (${v}x)`,
    'Golden Ratio Adherence':     (v) => `Golden ratio deviation (φ ${v})`,
    'Gonial Angle':               (v) => `Sub-ideal gonial angle (${v}°)`,
    'Palpebral Fissure Ratio':    (v) => `Below-ideal palpebral fissure ratio`,
  };

  const RATIO_STRENGTH_LABEL: Record<string, (v: number, u: string) => string> = {
    'Facial Thirds Balance':         () => 'Well-balanced facial thirds',
    'Canthal Tilt Angle':            (v) => `Strong positive canthal tilt (${v}°)`,
    'Eye Spacing Ratio':             () => 'Ideal eye spacing ratio',
    'Jaw-to-Cheekbone Width':        () => 'Ideal jaw-to-cheekbone ratio',
    'Midface Ratio':                 () => 'Balanced midface ratio',
    'Lower Face Ratio':              () => 'Balanced lower face ratio',
    'Golden Ratio Adherence':        () => 'Excellent golden ratio proportions',
    'Facial Width-to-Height Ratio':  (v) => `Ideal fWHR (${v}x)`,
  };

  const ratioInsights = useMemo(() => {
    const existingW = new Set(analysis.weaknesses.map(w => w.toLowerCase()));
    const existingS = new Set(analysis.strengths.map(s => s.toLowerCase()));
    const addW: string[] = [];
    const addS: string[] = [];
    for (const r of ratios) {
      const v = typeof r.value === 'number' ? r.value : parseFloat(String(r.value));
      if (r.score < 6.5) {
        const fn = RATIO_WEAKNESS_LABEL[r.name];
        if (fn) {
          const label = fn(v, r.unit);
          const key = label.toLowerCase();
          if (!existingW.has(key) && !addW.some(w => w.toLowerCase() === key)) addW.push(label);
        }
      } else if (r.score >= 8.5) {
        const fn = RATIO_STRENGTH_LABEL[r.name];
        if (fn) {
          const label = fn(v, r.unit);
          const key = label.toLowerCase();
          if (!existingS.has(key) && !addS.some(s => s.toLowerCase() === key)) addS.push(label);
        }
      }
    }
    return { weaknesses: addW, strengths: addS };
  }, [ratios, analysis]);
  const { isGeneratingCard, setIsGeneratingCard } = ctrl.uiState;
  const { celebrityResults, setCelebrityResults } = ctrl.celebState;

  // Calculate percentile and rank
  const topPercentile = Math.max(2, Math.round(25 - (overallScore * 2.2)));
  const baseUsers = 168229;
  const daysSinceLaunch = Math.min(365, Math.floor((new Date().getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24)));
  const totalUsers = baseUsers + (daysSinceLaunch * 142);
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

  // Build radar data
  const radarData = [
    { subject: 'Eyes', A: breakdown.Eyes || 5, fullMark: 10 },
  ];
  if (breakdown['Skin Quality'] !== undefined) {
    radarData.push({ subject: 'Skin Health', A: breakdown['Skin Quality'] || 5, fullMark: 10 });
  }
  radarData.push(
    { subject: 'Symmetry', A: breakdown.Symmetry || 5, fullMark: 10 },
    { subject: 'Jawline', A: breakdown.Jawline || 5, fullMark: 10 },
    { subject: 'Hair', A: breakdown.Hair || 7.5, fullMark: 10 },
    { subject: 'Dimorphism', A: breakdown.Dimorphism || 5, fullMark: 10 }
  );
  if (breakdown['Grooming'] !== undefined) {
    radarData.push({ subject: 'Grooming', A: breakdown['Grooming'] || 5, fullMark: 10 });
  }
  if (breakdown['Cheekbones'] !== undefined) {
    radarData.push({ subject: 'Cheekbones', A: breakdown['Cheekbones'] || 5, fullMark: 10 });
  }
  if (radarData.length % 2 !== 0) {
    radarData.push({ subject: 'Facial Balance', A: 7.5, fullMark: 10 });
  }

  const generateShareCard = async () => {
    if (isGeneratingCard) return;
    setIsGeneratingCard(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1860;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      // Background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, 1860);
      bgGradient.addColorStop(0, '#050505');
      bgGradient.addColorStop(1, '#111111');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1080, 1860);

      // Grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 1080; i += 60) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1860); ctx.stroke();
      }
      for (let i = 0; i < 1860; i += 60) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke();
      }

      // Load and draw image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const imgSize = 760;
      const imgX = (1080 - imgSize) / 2;
      const imgY = 330;

      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(imgX, imgY, imgSize, imgSize, 60);
      } else {
        ctx.rect(imgX, imgY, imgSize, imgSize);
      }
      ctx.clip();

      const scale = Math.max(imgSize / img.width, imgSize / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = imgX + (imgSize - w) / 2;
      const y = imgY + (imgSize - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(imgX, imgY, imgSize, imgSize, 60); ctx.stroke();
      }

      // Header
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
      ctx.font = 'bold 30px "JetBrains Mono", monospace';
      ctx.fillText('VISAGE AI — FACIAL ANALYSIS', 540, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 84px "Inter", sans-serif';
      ctx.fillText(`visagex.online`, 540, 195);

      // Top % badge
      const pctText = `TOP ${topPercentile}% GLOBALLY`;
      const pctWidth = 340;
      ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(540 - pctWidth / 2, 250, pctWidth, 60, 30);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a5b4fc';
      ctx.font = 'bold 26px "JetBrains Mono", monospace';
      ctx.fillText(pctText, 540, 290);

      // Score badge
      const badgeY = imgY + imgSize;
      ctx.beginPath();
      ctx.arc(540, badgeY, 140, 0, Math.PI * 2);
      ctx.fillStyle = '#050505';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(540, badgeY, 130, 0, Math.PI * 2);
      const scoreGradient = ctx.createLinearGradient(410, badgeY - 130, 670, badgeY + 130);
      scoreGradient.addColorStop(0, '#22d3ee');
      scoreGradient.addColorStop(1, '#818cf8');
      ctx.fillStyle = scoreGradient;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 100px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(overallScore.toFixed(1), 540, badgeY - 10);

      ctx.font = 'bold 24px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('OVERALL', 540, badgeY + 60);

      // Stats grid
      const drawStat = (label: string, value: string, sx: number, sy: number) => {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        if (ctx.roundRect) {
          ctx.beginPath(); ctx.roundRect(sx, sy, 410, 140, 40); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillRect(sx, sy, 410, 140);
        }

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '28px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, sx + 50, sy + 70);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 52px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(value, sx + 360, sy + 70);
      };

      const gridY = badgeY + 180;
      drawStat('SYMMETRY', breakdown['Symmetry']?.toFixed(1) || '-', 110, gridY);
      drawStat('JAWLINE', breakdown['Jawline']?.toFixed(1) || '-', 560, gridY);
      drawStat('SKIN', breakdown['Skin Quality']?.toFixed(1) || '-', 110, gridY + 170);
      drawStat('CHEEKBONES', breakdown['Cheekbones']?.toFixed(1) || '-', 560, gridY + 170);

      // Face shape & match
      const bottomY = gridY + 380;
      ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
      if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(110, bottomY, 860, 100, 50); ctx.fill();
      }

      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 32px "Inter", sans-serif';
      ctx.textAlign = 'center';

      let bottomText = `FACE SHAPE: ${result.visionAnalysis?.faceShape?.toUpperCase() || 'UNKNOWN'}`;
      if (result.visionAnalysis?.celebritySimilarity?.[0]) {
        bottomText += `  •  MATCH: ${result.visionAnalysis.celebritySimilarity[0].name.toUpperCase()}`;
      }
      ctx.fillText(bottomText, 540, bottomY + 50);

      // Download
      const link = document.createElement('a');
      link.download = `looksmax-card-${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (err) {
      console.error("Failed to generate card:", err);
      alert("Failed to generate trading card. Please try again.");
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const scrollToPricing = (e?: React.MouseEvent) => {
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
        console.error("Scroll error:", err);
      }
    }
  };

  const handleApplyReferral = async (code: string) => {
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
  };

  const findCelebrityLookalikes = async () => {
    if (!imageUrl) {
      throw new Error('No image available to analyze.');
    }

    const idToken = await user.getIdToken();
    const response = await fetch('/api/celebrity-lookalike', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ image: imageUrl })
    });

    if (!response.ok) throw new Error("Celebrity analysis failed on server.");
    const data = await response.json();

    if (data.celebritySimilarity) {
      setCelebrityResults(data.celebritySimilarity);
    }
  };

  return (
    <DashboardProvider
      value={{
        isDarkMode,
        isLocked,
        scrollToPricing,
        pricingRef,
        isGeneratingCard,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
                  <h3 className="text-2xl font-display italic text-white">Generating Neural Card</h3>
                  <p className="text-zinc-400 text-sm font-medium tracking-widest uppercase">Analyzing 468 landmarks...</p>
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
          onTabChange={setActiveTab}
          isDarkMode={isDarkMode}
        />

        <AnimatePresence mode="wait">

          {/* ════════════ OVERVIEW TAB ════════════ */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-8 md:space-y-10"
            >
              <ScoreSection
                imageUrl={imageUrl}
                landmarks={result.landmarks}
                cropInfo={result.cropInfo}
                metrics={metrics}
                isDarkMode={isDarkMode}
                overallScore={overallScore}
                topPercentile={topPercentile}
                userRank={userRank}
                totalUsers={totalUsers}
                isLocked={isLocked}
                user={user}
                userData={userData}
                onUnlock={onUnlock}
                scrollToPricing={scrollToPricing}
              />
              <BreakdownCards
                breakdown={breakdown}
                isDarkMode={isDarkMode}
                isLocked={isLocked}
              />
              <div id="strengths-section" className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6 items-start w-full">
                {/* Left: Strengths + Friend Invite */}
                <div className="flex flex-col gap-5 w-full">
                  <StrengthsAndWeaknesses
                    isDarkMode={isDarkMode}
                    isLocked={isLocked}
                    show="strengths"
                    strengths={[...analysis.strengths, ...ratioInsights.strengths]}
                    weaknesses={[...analysis.weaknesses, ...ratioInsights.weaknesses]}
                    breakdown={breakdown}
                    onUnlock={onUnlock}
                    insightDescriptions={result.visionAnalysis?.insightDescriptions}
                    imageUrl={imageUrl}
                    ratios={ratios}
                    ratioPoints={ratioPoints}
                    cropInfo={result.cropInfo}
                  />
                  {!isLocked && (
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
                  )}
                </div>

                {/* Right: Weaknesses + Harmony Radar */}
                <div className="flex flex-col gap-5 w-full">
                  <StrengthsAndWeaknesses
                    isDarkMode={isDarkMode}
                    isLocked={isLocked}
                    show="weaknesses"
                    strengths={[...analysis.strengths, ...ratioInsights.strengths]}
                    weaknesses={[...analysis.weaknesses, ...ratioInsights.weaknesses]}
                    breakdown={breakdown}
                    onUnlock={onUnlock}
                    insightDescriptions={result.visionAnalysis?.insightDescriptions}
                    imageUrl={imageUrl}
                    ratios={ratios}
                    ratioPoints={ratioPoints}
                    cropInfo={result.cropInfo}
                  />
                  <FeatureBreakdownGrid data={radarData} />
                </div>
              </div>

              <RatioAnalysisTeaser
                imageUrl={imageUrl}
                isDarkMode={isDarkMode}
                overallScore={overallScore}
              />

              {!isLocked && (
                <GlowUpCoach result={result} isDarkMode={isDarkMode} />
              )}
            </motion.div>
          )}

          {/* ════════════ ANALYSIS TAB ════════════ */}
          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div ref={pricingRef} className="relative">
                {isLocked && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-start pt-10 pb-20 gap-6 px-4 md:px-10 pointer-events-none overflow-y-auto overflow-x-hidden">
                    <UnlockOverlay
                      isDarkMode={isDarkMode}
                      topPercentile={topPercentile}
                      onUnlock={onUnlock}
                    />
                    <div className="w-full max-w-5xl mt-8 mb-24">
                      <ViralReferralEngine
                        isDarkMode={isDarkMode}
                        isGlassy={true}
                        user={user}
                        userData={userData}
                        overallScore={overallScore}
                        topPercentile={topPercentile}
                        onOpenAuth={onOpenAuth}
                        onApplyReferral={handleApplyReferral}
                      />
                    </div>
                  </div>
                )}
                <div className={cn("space-y-6 md:space-y-8 transition-all duration-700", isLocked ? "blur-md pointer-events-none select-none" : "")}>
                  <FacialRatioExplorer
                    imageUrl={imageUrl}
                    landmarks={result.landmarks}
                    cropInfo={result.cropInfo}
                    metrics={metrics}
                    breakdown={breakdown}
                    isDarkMode={isDarkMode}
                    isLocked={isLocked}
                  />
                  <CelebritySection
                    isDarkMode={isDarkMode}
                    isLocked={isLocked}
                    imageUrl={imageUrl}
                    user={user}
                    userCredits={userCredits}
                    celebrityResults={celebrityResults}
                    onOpenAuth={onOpenAuth}
                    onOpenPricing={onOpenPricing}
                    onFindCelebrity={findCelebrityLookalikes}
                    result={result}
                  />
                  {result.visionAnalysis && (
                    <VisionAnalysisSection
                      isDarkMode={isDarkMode}
                      isLocked={isLocked}
                      visionAnalysis={result.visionAnalysis}
                    />
                  )}
                  {result.visionAnalysis?.dermatology && (
                    <DermatologySection
                      isDarkMode={isDarkMode}
                      isLocked={isLocked}
                      dermatology={result.visionAnalysis.dermatology}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════ PLAN TAB ════════════ */}
          {activeTab === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
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
