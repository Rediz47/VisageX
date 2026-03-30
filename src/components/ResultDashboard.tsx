import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, animate } from 'motion/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Activity, User, Maximize2, Target, Sparkles, Share2, Download, TrendingUp, Lock, Sun, Moon, Eye, Scissors, Loader2, Search, Copy, Check, Trophy } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';
import { Tooltip } from './Tooltip';
import { toPng } from 'html-to-image';
import { cn } from '../lib/utils';

// Mapping identifying which traits have educational articles in the /blog library.
const TRAIT_GUIDE_MAP: Record<string, string> = {
  'Eyes': '/blog/what-is-canthal-tilt',
  'Jawline': '/blog/how-to-fix-recessed-jawline',
  'Symmetry': '/blog/how-to-improve-face-symmetry',
  'Skin Health': '/blog/does-gua-sha-work',
  'Skin Quality': '/blog/does-gua-sha-work',
};

// Keywords to look for in analysis text strings to provide contextual links.
const KEYWORD_GUIDE_MAP = [
  { keyword: 'Canthal Tilt', link: '/blog/what-is-canthal-tilt' },
  { keyword: 'Jawline', link: '/blog/how-to-fix-recessed-jawline' },
  { keyword: 'Symmetry', link: '/blog/how-to-improve-face-symmetry' },
  { keyword: 'Skin', link: '/blog/does-gua-sha-work' },
  { keyword: 'Mewing', link: '/blog/complete-mewing-guide' },
];

import { GlowUpCoach } from './GlowUpCoach';


function AnimatedCounter({ value, duration = 1.5, delay = 0, maxDecimals = 1 }: { value: number, duration?: number, delay?: number, maxDecimals?: number }) {
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });
  const displayValue = useTransform(springValue, (latest) => latest.toFixed(maxDecimals));

  useEffect(() => {
    const timeout = setTimeout(() => {
      springValue.set(value);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [value, delay, springValue]);

  return <motion.span>{displayValue}</motion.span>;
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
  const [promoCode, setPromoCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ rank: number; name: string; invites: number; isCurrentUser: boolean }[]>([]);

  // Fetch leaderboard once on mount
  useEffect(() => {
    const uid = user?.uid;
    const url = uid ? `/api/referral/leaderboard?userId=${uid}` : '/api/referral/leaderboard';
    fetch(url)
      .then(r => r.json())
      .then(data => { if (data.leaderboard) setLeaderboard(data.leaderboard); })
      .catch(() => { });
  }, [user?.uid]);
  const [pricingOfferTimeLeft, setPricingOfferTimeLeft] = useState<string>('');

  // 24h Pricing Offer Timer
  useEffect(() => {
    const tick = () => {
      const createdAt = userData?.createdAt?.toDate?.() || new Date();
      const deadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      if (diff <= 0) {
        setPricingOfferTimeLeft('00:00:00');
        return;
      }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setPricingOfferTimeLeft(`${h}:${m}:${s}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [userData]);

  // Confetti dopamine burst
  const fireConfetti = () => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx2 = canvas.getContext('2d')!;
    const pieces: { x: number; y: number; vx: number; vy: number; color: string; r: number; alpha: number }[] = [];
    const colors = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#22d3ee'];
    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        r: Math.random() * 6 + 3,
        alpha: 1,
      });
    }
    let frame = 0;
    const animate = () => {
      ctx2.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.alpha -= 0.012;
        ctx2.globalAlpha = Math.max(0, p.alpha);
        ctx2.fillStyle = p.color;
        ctx2.beginPath();
        ctx2.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx2.fill();
      });
      frame++;
      if (frame < 120) requestAnimationFrame(animate);
      else { canvas.remove(); }
    };
    animate();
  };

  // Fire confetti when invitedCount increases
  const prevInvitedCount = React.useRef(userData?.invitedCount || 0);
  useEffect(() => {
    const count = userData?.invitedCount || 0;
    if (count > prevInvitedCount.current) {
      fireConfetti();
    }
    prevInvitedCount.current = count;
  }, [userData?.invitedCount]);

  const handleApplyReferral = async () => {
    if (!user) {
      onOpenAuth('signup');
      return;
    }
    if (!promoCode.trim()) return;

    setIsApplying(true);
    setPromoError(null);
    setPromoSuccess(null);

    try {
      const fingerprint = `${window.screen.width}x${window.screen.height}-${navigator.userAgent}`;
      const response = await fetch('/api/referral/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          referralCode: promoCode.trim().toUpperCase(),
          fingerprint
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to apply code');

      setPromoSuccess(data.message || 'Code applied successfully!');
      setPromoCode('');
      // Credits will update via onSnapshot in App.tsx
    } catch (err: any) {
      setPromoError(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  const { overallScore, breakdown, metrics, analysis, detailedSymmetry } = result;
  const [isAnalyzingCelebrity, setIsAnalyzingCelebrity] = useState(false);
  const [celebScanStep, setCelebScanStep] = useState<string>("");
  const [celebScanHistory, setCelebScanHistory] = useState<string[]>([]);
  const [celebrityResults, setCelebrityResults] = useState<any[]>(result.visionAnalysis?.celebritySimilarity || []);
  const [celebError, setCelebError] = useState<string | null>(null);

  const springScore = useSpring(0, {
    duration: 1500,
    bounce: 0,
  });
  const displayScore = useTransform(springScore, (latest) => latest.toFixed(1));

  // Track scan history for the celebrity animation
  useEffect(() => {
    if (celebScanStep && !celebScanHistory.includes(celebScanStep)) {
      setCelebScanHistory(prev => [...prev, celebScanStep]);
    }
  }, [celebScanStep]);

  // Reset history when analysis stops
  useEffect(() => {
    if (!isAnalyzingCelebrity) {
      setCelebScanHistory([]);
      setCelebScanStep("");
    }
  }, [isAnalyzingCelebrity]);

  const findCelebrityLookalikes = async () => {
    if (!result.visionAnalysis?.cleanImage) return;

    setIsAnalyzingCelebrity(true);
    setCelebError(null);
    setCelebScanStep("Initializing facial recognition...");

    try {
      setCelebScanStep("Extracting key facial vectors...");

      // Artificial delay to show the steps
      await new Promise(resolve => setTimeout(resolve, 800));

      setCelebScanStep("Searching global celebrity database...");

      const response = await fetch('/api/celebrity-lookalike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: result.visionAnalysis.cleanImage })
      });

      if (!response.ok) throw new Error("Celebrity analysis failed on server.");
      const data = await response.json();

      setCelebScanStep("Retrieving verified image matches...");
      await new Promise(resolve => setTimeout(resolve, 600));

      setCelebScanStep("Finalizing twin profiles...");
      await new Promise(resolve => setTimeout(resolve, 400));

      if (data.celebritySimilarity) {
        setCelebrityResults(data.celebritySimilarity);
        // Update the original result object so it persists if needed
        if (result.visionAnalysis) {
          result.visionAnalysis.celebritySimilarity = data.celebritySimilarity;
        }
      }
    } catch (err) {
      console.error("Celebrity analysis error:", err);
      setCelebError("Failed to identify lookalikes. Please try again.");
    } finally {
      setIsAnalyzingCelebrity(false);
    }
  };
  const handleCelebrityClick = async () => {
    if (!user) {
      onOpenAuth('signup');
      return;
    }

    if (userCredits <= 0) {
      onOpenPricing();
      return;
    }

    // Deduct credit first securely via backend
    setIsAnalyzingCelebrity(true);
    setCelebScanStep("Verifying credits...");
    try {
      const response = await fetch('/api/consume-credit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process credit');
      }

      // If credit deduction succeeds, run the analysis
      await findCelebrityLookalikes();
    } catch (error) {
      console.error("Failed to spend credit for celebrity analysis:", error);
      setCelebError("Failed to process credit. Please try again.");
      setIsAnalyzingCelebrity(false);
    }
  };

  // Calculate exact percentile — weighted to be exclusive/high but feel authentic
  const topPercentile = Math.max(2, Math.round(25 - (overallScore * 2.2)));

  // Calculate dynamic rank based on percentile
  const baseUsers = 168229;
  const daysSinceLaunch = Math.min(365, Math.floor((new Date().getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24)));
  const totalUsers = baseUsers + (daysSinceLaunch * 142);
  const userRank = Math.max(1, Math.floor(totalUsers * (topPercentile / 100)));

  // Calculate potential percentile — make it always high (9.2+) for conversion
  const potentialScore = result.visionAnalysis?.potentialScore || Math.min(10, Math.max(9.2, overallScore + 1.2));
  const potentialPercentile = Math.max(1, Math.round(100 - (potentialScore * 10)));

  useEffect(() => {
    springScore.set(overallScore);
  }, [overallScore, springScore]);

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

  // Make it even
  if (radarData.length % 2 !== 0) {
    radarData.push({ subject: 'Facial Balance', A: 7.5, fullMark: 10 });
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-emerald-400';
    if (score >= 6) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  const getFeatureIcon = (subject: string) => {
    switch (subject) {
      case 'Eyes': return <Eye className="w-5 h-5" />;
      case 'Jawline': return <Activity className="w-5 h-5" />;
      case 'Symmetry': return <Sparkles className="w-5 h-5" />;
      case 'Hair': return <Sparkles className="w-5 h-5" />;
      case 'Dimorphism': return <User className="w-5 h-5" />;
      case 'Skin Health': return <Eye className="w-5 h-5" />;
      case 'Grooming': return <Sparkles className="w-5 h-5" />;
      case 'Cheekbones': return <Target className="w-5 h-5" />;
      case 'Facial Balance': return <Sparkles className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (score: number) => {
    if (score >= 9) return "Elite";
    if (score >= 8) return "Optimal";
    if (score >= 7) return "Strong";
    if (score >= 6) return "Balanced";
    if (score >= 5) return "Average";
    return "Developing";
  };

  const getFeatureDescription = (subject: string) => {
    switch (subject) {
      case 'Eyes': return "Canthal tilt, spacing, and vertical positioning.";
      case 'Jawline': return "Angular definition and mandibular width.";
      case 'Symmetry': return "Bilateral alignment across 468 landmarks.";
      case 'Hair': return "Hairline health, density, and styling.";
      case 'Dimorphism': return "Secondary sex characteristics and structure.";
      case 'Skin Health': return "Texture, clarity, and vascular health.";
      case 'Grooming': return "Eyebrow shape and maintenance.";
      case 'Cheekbones': return "Prominence and definition of zygomatic bones.";
      case 'Facial Balance': return "Overall harmony and distribution of facial features.";
      default: return "Facial metric analysis.";
    }
  };

  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const generateShareCard = async () => {
    if (isGeneratingCard) return;
    setIsGeneratingCard(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1860;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      // 1. Background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, 1860);
      bgGradient.addColorStop(0, '#050505');
      bgGradient.addColorStop(1, '#111111');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1080, 1860);

      // Grid pattern background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 1080; i += 60) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1860); ctx.stroke();
      }
      for (let i = 0; i < 1860; i += 60) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke();
      }

      // 2. Load Image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 3. Draw Image (shifted down to make room for challenge text)
      const imgSize = 760;
      const imgX = (1080 - imgSize) / 2;
      const imgY = 330;

      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(imgX, imgY, imgSize, imgSize, 60);
      } else {
        ctx.rect(imgX, imgY, imgSize, imgSize); // Fallback
      }
      ctx.clip();

      const scale = Math.max(imgSize / img.width, imgSize / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = imgX + (imgSize - w) / 2;
      const y = imgY + (imgSize - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();

      // Image Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(imgX, imgY, imgSize, imgSize, 60); ctx.stroke();
      }

      // 4. Header — Challenge Trigger Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      // Small label
      ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
      ctx.font = 'bold 30px "JetBrains Mono", monospace';
      ctx.fillText('VISAGE AI — FACIAL ANALYSIS', 540, 100);

      // Big challenge hook replaced with website URL
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 84px "Inter", sans-serif';
      ctx.fillText(`visagex.online`, 540, 195);

      // Top % badge pill
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

      // 5. Overall Score Badge (Overlapping image bottom)
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

      // 6. Stats Grid
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

      // 7. Face Shape & Match
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

      // Footer removed as requested

      // Trigger download
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
        // Scroll slightly above the premium card so the header is clearly visible
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

  // Reusable Viral Engine Component for injecting into overlays
  const renderViralEngine = (isGlassy: boolean = false) => {
    const invites = userData?.invitedCount || 0;

    // Simple logic for next reward
    const getNextReward = (count: number) => {
      if (count < 2) return { target: 2, reward: "+1 Scan" };
      if (count < 5) return { target: 5, reward: "+2 Scans" };
      if (count < 10) return { target: 10, reward: "+3 Scans" };
      return { target: count + 5, reward: "+2 Scans" };
    };

    const next = getNextReward(invites);
    const progress = Math.min(100, (invites / next.target) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={cn(
          "w-full max-w-5xl mx-auto rounded-[2.5rem] p-6 md:p-12 border shadow-xl relative overflow-hidden pointer-events-auto",
          isGlassy
            ? (isDarkMode ? "bg-zinc-900/40 border-white/10 backdrop-blur-2xl" : "bg-white/70 border-zinc-200 backdrop-blur-2xl")
            : (isDarkMode ? "bg-zinc-900 border-white/5" : "bg-white border-zinc-100 shadow-indigo-500/5")
        )}
      >
        {/* Decorative Background Glows — lightweight radial gradients instead of blur */}
        <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-stretch">

          {/* Left Side: Brand & Tiers */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-4">
                <Sparkles className="w-3 h-3" />
                Growth Engine
              </div>
              <h3 className={cn("text-4xl md:text-5xl font-display italic tracking-tight leading-tight mb-4", isDarkMode ? "text-white" : "text-zinc-900")}>
                Invite Friends. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 font-sans not-italic">Unlock Results.</span>
              </h3>
              <p className={cn("text-sm font-light opacity-60 max-w-sm mx-auto lg:mx-0", isDarkMode ? "text-white" : "text-zinc-600")}>
                Invite 2 friends → Get <span className="font-bold text-indigo-400">FULL REPORT FREE ($9.99)</span>. Every friend you invite gets +1 scan instantly on signup.
              </p>
            </div>

            {/* Visual Tiers - Mini Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { count: 2, reward: "FREE REPORT", color: "from-cyan-500 to-blue-500", glow: progress > 70 && progress < 100 },
                { count: 5, reward: "+2 Credits", color: "from-indigo-500 to-purple-500", glow: false },
                { count: 10, reward: "+5 Credits", color: "from-rose-500 to-pink-500", glow: false },
              ].map((tier) => (
                <div
                  key={tier.count}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all relative overflow-hidden",
                    invites >= tier.count
                      ? `bg-gradient-to-br ${tier.color} text-white border-transparent`
                      : (isDarkMode ? "bg-white/5 border-white/5 opacity-50" : "bg-zinc-50 border-zinc-100 opacity-50"),
                    tier.glow && "animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.4)] border-cyan-400/50"
                  )}
                >
                  {tier.glow && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
                  <p className="text-lg font-black">{tier.count}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Invites</p>
                  <p className="mt-1 text-[9px] font-black text-center leading-none">{tier.reward}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Progress & Actions */}
          <div className="lg:w-[400px] flex flex-col gap-6">

            {/* Progress Card */}
            <div className={cn("p-8 rounded-[2rem] border relative overflow-hidden", isDarkMode ? "bg-black/40 border-white/10 shadow-inner" : "bg-zinc-50 border-zinc-200")}>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Your Invites</p>
                  <p className={cn("text-4xl font-display italic font-bold", isDarkMode ? "text-white" : "text-zinc-900")}>{invites}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Next Reward</p>
                  <p className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1">
                    <Sparkles className="w-4 h-4" /> {next.target === 2 ? "FULL REPORT" : next.reward}
                  </p>
                </div>
              </div>

              <div className="relative h-3 w-full bg-black/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className={cn(
                    "absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400",
                    progress > 80 && "animate-shimmer"
                  )}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
                <span className="opacity-30">{invites} / {next.target} to next tier</span>
                <span className="text-rose-400 animate-pulse">Next bonus expires in 4h</span>
              </div>
            </div>

            {/* Share & Code Region */}
            <div className="space-y-3">
              {!user ? (
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="w-full py-8 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex flex-col items-center justify-center gap-3 transition-all hover:bg-indigo-500/20 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-1">
                    <Lock className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white">Login to Get Code</p>
                    <p className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest mt-1">Unlock your $9.99 reward</p>
                  </div>
                </button>
              ) : (
                <>
                  <div className={cn("flex items-center justify-between gap-4 p-2 pl-6 rounded-2xl border", isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-zinc-200")}>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Your Invite Code</p>
                      <p className={cn("font-mono font-bold text-xl tracking-wider", isDarkMode ? "text-cyan-400" : "text-cyan-600")}>{userData?.referralCode || "------"}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(userData?.referralCode || "");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", isDarkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900")}
                    >
                      {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const shareText = `I scored ${overallScore?.toFixed(1) || '9.0'}/10 on the VisageX AI Face Analysis (Top ${topPercentile}% globally).`;
                      const shareUrl = `${window.location.origin}?ref=${userData?.referralCode || ''}`;
                      if ((window as any).posthog) {
                        (window as any).posthog.capture('viral_share_clicked', { source: 'growth_engine', score: overallScore.toFixed(1) });
                      }
                      if (navigator.share) {
                        navigator.share({ title: 'My VisageX AI Score', text: shareText, url: shareUrl });
                      } else {
                        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="w-full py-5 rounded-2xl bg-indigo-500 text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.4)] relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Share2 className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{copied ? "Copied Link!" : "Share My Score"}</span>
                  </button>
                </>
              )}
            </div>

            {/* Redeem Box */}
            <div className="relative">
              <div className={cn("flex rounded-2xl border transition-all focus-within:ring-2 ring-indigo-500/20", isDarkMode ? "bg-black/20 border-white/5" : "bg-white border-zinc-200")}>
                <input
                  type="text"
                  placeholder="Redeem code..."
                  value={userData?.referredBy ? "Applied ✅" : promoCode}
                  disabled={!user || !!userData?.referredBy || isApplying}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="bg-transparent border-none outline-none px-6 py-4 text-xs w-full font-bold uppercase tracking-widest placeholder:opacity-30 disabled:opacity-50"
                />
                {!userData?.referredBy && (
                  <button
                    onClick={handleApplyReferral}
                    disabled={!promoCode || isApplying}
                    className="px-6 text-indigo-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-300 disabled:opacity-40 transition-colors"
                  >
                    {isApplying ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Apply"}
                  </button>
                )}
              </div>
              {promoError && <p className="absolute -bottom-5 left-2 text-[9px] text-rose-400 font-bold uppercase tracking-widest">{promoError}</p>}
              {promoSuccess && <p className="absolute -bottom-5 left-2 text-[9px] text-emerald-400 font-bold uppercase tracking-widest">{promoSuccess}</p>}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mx-auto p-4 md:p-6 max-w-[1400px]"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8 md:mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-2xl"
        >
          <button
            onClick={onReset}
            className={cn(
              "flex items-center transition-colors font-bold uppercase tracking-[0.3em] text-[9px] mb-4 md:mb-6 group",
              isDarkMode ? "text-white/40 hover:text-white" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Analyze Another Photo
          </button>
          <h1 className={cn(
            "text-4xl md:text-6xl lg:text-[80px] font-display italic leading-[0.85] tracking-tight mb-3 md:mb-4",
            isDarkMode ? "text-zinc-100" : "text-zinc-900"
          )}>
            Analysis <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400 not-italic font-sans font-normal">Complete.</span>
          </h1>
          <p className={cn(
            "text-lg md:text-xl font-light tracking-wide",
            isDarkMode ? "text-white/40" : "text-zinc-500"
          )}>
            Neural scan processed with clinical precision
          </p>
        </motion.div>

        <div className="flex items-center space-x-4">
          <button
            onClick={generateShareCard}
            disabled={isGeneratingCard}
            className={cn(
              "flex items-center px-5 py-2.5 rounded-xl border text-xs font-bold transition-all group",
              isDarkMode
                ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-900 shadow-sm",
              isGeneratingCard && "opacity-50 cursor-not-allowed"
            )}
          >
            {isGeneratingCard ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
            )}
            {isGeneratingCard ? 'Generating...' : 'Export Card'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

        {/* Left Column: Image & Overall Score */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 md:space-y-4">

          {/* Face Mesh Image (Now Primary at Top) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              "rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border relative group",
              isDarkMode ? "bg-black border-white/10" : "bg-white border-zinc-200"
            )}
          >
            <div className="relative">
              <img
                src={imageUrl}
                alt="Analyzed Face"
                className="w-full h-auto object-cover aspect-square grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />

              {/* Scanning line animation overlay */}
              <motion.div
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[1px] bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)] z-30 pointer-events-none"
                style={{ willChange: "top" }}
              />
            </div>
          </motion.div>

          {/* Unified Hero Score & Rank Section (Now below Image) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className={cn(
              "rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-14 border shadow-2xl relative overflow-hidden text-center flex flex-col items-center justify-center",
              isDarkMode ? "bg-black border-white/10" : "bg-white border-zinc-200"
            )}
          >
            {/* Background Aesthetic Glows */}
            <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-b", isDarkMode ? "from-indigo-500/10 to-rose-500/5" : "from-zinc-50 to-white")} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />

            <div className="relative z-10 flex flex-col items-center w-full">
              <h3 className={cn("text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-4 md:mb-6 opacity-40", isDarkMode ? "text-white" : "text-zinc-900")}>
                Facial Harmony Score
              </h3>

              <div className="relative mb-2 md:mb-4">
                <span className={cn("text-7xl md:text-9xl font-display italic leading-none tracking-tighter", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                  <motion.span>{displayScore}</motion.span>
                </span>
                <span className={cn("absolute -right-6 md:-right-10 bottom-2 md:bottom-4 text-xs md:text-sm font-bold opacity-20", isDarkMode ? "text-white" : "text-zinc-900")}>/10</span>
              </div>

              <div className={cn(
                "px-6 py-2 rounded-full border text-[11px] md:text-xs font-black tracking-widest uppercase flex items-center gap-2 mb-8 shadow-xl",
                isDarkMode ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" : "bg-indigo-50 border-indigo-100 text-indigo-600 shadow-indigo-500/5"
              )}>
                <Sparkles className="w-4 h-4 animate-pulse" />
                Top {topPercentile}% Global Rank
              </div>

              {/* Master CTA - Impossible to Miss */}
              {isLocked ? (
                <button
                  onClick={scrollToPricing}
                  className="w-full max-w-sm group relative px-8 py-6 rounded-[2rem] bg-indigo-500 text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_20px_40px_rgba(99,102,241,0.3)] hover:shadow-[0_25px_50px_rgba(99,102,241,0.4)] overflow-hidden"
                >
                  {/* Glowing Pulse Animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="flex items-center justify-center gap-3">
                    <Lock className="w-4 h-4 md:w-5 md:h-5" />
                    🚀 See How to Reach {potentialScore.toFixed(1)}+
                  </div>
                </button>
              ) : (
                <div className="flex flex-col items-center w-full max-w-sm gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Full Analysis Unlocked</span>
                  </div>
                  
                  <button
                    onClick={() => {
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
                    }}
                    className="w-full relative group px-8 py-5 rounded-[2rem] bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black text-xs md:text-sm uppercase tracking-[0.15em] transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_10px_30px_rgba(6,182,212,0.4)] overflow-hidden flex items-center justify-center gap-3 border border-cyan-400/50"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Share2 className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Brag About Score</span>
                  </button>
                </div>
              )}

              {/* Secondary Sub-metrics / Social Proof */}
              <div className="mt-8 flex flex-wrap justify-center gap-6 opacity-40">
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1">Rank</p>
                  <p className="text-xs font-bold">{userRank.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1">Users</p>
                  <p className="text-xs font-bold">{totalUsers.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1">Daily Scans</p>
                  <p className="text-xs font-bold">1,335+</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Feature Breakdown Cards */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-7 xl:col-span-8"
        >
          <div className="h-full flex flex-col">
            <h3 className={cn("text-xl md:text-2xl font-display italic flex items-center mb-4 md:mb-6 px-2", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
              <Activity className={cn("w-5 h-5 md:w-6 md:h-6 mr-3 md:4 opacity-40", isDarkMode ? "text-zinc-100" : "text-zinc-900")} />
              Feature Breakdown
            </h3>
            <div className="relative flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 h-full">
                {radarData.map((item, index) => {
                  const isItemLocked = isLocked && item.subject !== 'Eyes' && item.subject !== 'Skin Health' && item.subject !== 'Symmetry';
                  return (
                    <motion.div
                      key={item.subject}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, delay: index * 0.05 }}
                      className={cn(
                        "rounded-2xl p-4 md:p-5 shadow-sm border relative overflow-hidden group transition-all duration-700 hover:shadow-xl flex flex-col justify-between",
                        isDarkMode
                          ? "bg-black border-white/5 hover:border-white/10"
                          : "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm",
                        isItemLocked && "relative select-none pointer-events-none"
                      )}
                    >
                      {isItemLocked && (
                        <div className="absolute inset-0 z-20 backdrop-blur-md bg-black/40 flex flex-col items-center justify-center p-4 transition-all group-hover:bg-black/50">
                          <Lock className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                      {/* Decorative Elements */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                      <div className={cn("relative z-10 h-full flex flex-col", isItemLocked && "blur-sm")}>
                        <div className="flex justify-between items-start mb-2 md:mb-3">
                          <div className={cn(
                            "p-1.5 md:p-2 rounded-xl border transition-colors",
                            isDarkMode
                              ? "bg-white/5 border-white/10 text-white/60 group-hover:border-white/20"
                              : "bg-zinc-50 border-zinc-200 text-zinc-500 group-hover:border-zinc-300"
                          )}>
                            {getFeatureIcon(item.subject)}
                          </div>
                          <div className={cn(
                            "px-2 py-1 rounded-full text-[7px] md:text-[8px] font-bold uppercase tracking-widest border backdrop-blur-sm",
                            isItemLocked
                              ? "bg-zinc-500/10 border-zinc-500/20 text-zinc-500"
                              : item.A >= 8
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                : item.A >= 6
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                  : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                          )}>
                            {isItemLocked ? "Locked" : getStatusLabel(item.A)}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h4 className={cn("text-[8px] md:text-[9px] font-extrabold uppercase tracking-[0.2em] mb-1 opacity-70", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                            {item.subject}
                          </h4>
                          <div className="flex items-baseline gap-0.5 mb-1 md:mb-2">
                            <span className={cn("text-2xl md:text-3xl font-display italic", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                              {isItemLocked ? "??" : <AnimatedCounter value={item.A} delay={0.8 + index * 0.1} />}
                            </span>
                            <span className={cn("text-[10px] md:text-xs font-medium opacity-10", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>/10</span>
                          </div>
                          <p className={cn("text-[11px] md:text-[12px] leading-relaxed mb-3 opacity-90 font-medium", isDarkMode ? "text-white/90" : "text-zinc-900")}>
                            {isItemLocked ? "Unlock the full report to see detailed analysis and metrics for this feature." : getFeatureDescription(item.subject)}
                          </p>

                          {!isItemLocked && TRAIT_GUIDE_MAP[item.subject] && (
                            <Link 
                              to={TRAIT_GUIDE_MAP[item.subject]}
                              className={cn(
                                "inline-flex items-center text-[10px] font-bold uppercase tracking-widest mt-auto transition-all",
                                isDarkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"
                              )}
                            >
                              Read Strategy &rarr;
                            </Link>
                          )}
                        </div>

                        {/* Progress Bar removed as per user request */}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>


      {/* Secondary Grid: Details */}
      <div ref={pricingRef} className="relative mt-6 md:mt-8">
        {isLocked && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-start pt-12 pb-24 gap-6 px-4 md:px-10 pointer-events-none overflow-y-auto overflow-x-hidden">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "w-full max-w-5xl p-8 md:p-12 rounded-[3rem] border shadow-[0_30px_100px_rgba(99,102,241,0.2)] relative overflow-hidden group pointer-events-auto -translate-y-12",
                isDarkMode ? "bg-zinc-900/80 border-white/10 backdrop-blur-md" : "bg-white/90 border-zinc-200 backdrop-blur-md"
              )}
            >
              {/* Premium Gradient Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 opacity-40 mix-blend-overlay" />
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="flex-1 text-center lg:text-left">
                  <h3 className={cn("text-4xl md:text-5xl lg:text-6xl font-display italic mb-3 leading-tight", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                    Unlock Your <br /> <span className="text-indigo-500">Full Face Analysis</span>
                  </h3>
                  <p className={cn("text-base md:text-xl opacity-60 font-light mb-8 max-w-lg", isDarkMode ? "text-white" : "text-zinc-600")}>
                    See why you're Top {topPercentile}% & how to reach 9.0+
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto lg:mx-0">
                    {[
                      "All 12+ Advanced Metrics",
                      "Celebrity Lookalikes",
                      "Personalized Glow-up Plan",
                      "High-Res Feature Map",
                      "Symmetry Analysis",
                      "Lifetime Access to Result"
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm opacity-70">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cn(
                  "flex flex-col items-center gap-6 min-w-[340px] p-10 rounded-[2.5rem] border shadow-2xl relative overflow-hidden",
                  isDarkMode ? "bg-black/60 border-white/10" : "bg-white border-zinc-200"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                  <div className="text-center relative z-10">
                    <p className="text-[10px] uppercase tracking-widest opacity-40 mb-1 font-bold">Total Access</p>
                    <p className={cn("text-5xl font-display italic font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                      <span className="text-lg align-top opacity-50 not-italic font-sans mr-1">$</span>1.49
                    </p>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Starting Price</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onUnlock}
                    className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:shadow-[0_25px_50px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                    <Sparkles className="w-4 h-4" />
                    ⚡ See Your Full Potential
                  </motion.button>

                  <div className="flex items-center gap-2 opacity-40 text-[9px] font-bold uppercase tracking-widest">
                    <Lock className="w-3 h-3" />
                    Secure One-Time Payment
                  </div>
                </div>
              </div>
            </motion.div>
            {renderViralEngine(true)}
          </div>
        )}
        <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 transition-all duration-700", isLocked ? "blur-md pointer-events-none select-none" : "")}>
          {/* Radar Chart */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className={cn(
              "rounded-2xl p-4 md:p-5 shadow-2xl border h-full",
              isDarkMode ? "bg-black border-white/10" : "bg-white border-zinc-200 shadow-sm"
            )}>
              <h3 className={cn("text-sm md:text-base font-display font-semibold mb-2 md:mb-3 flex items-center", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                <Target className={cn("w-4 h-4 mr-2", isDarkMode ? "text-cyan-400" : "text-cyan-600")} />
                Harmony Radar
              </h3>
              <div className="h-56 md:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', fontSize: 12, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="A" stroke={isDarkMode ? "#22d3ee" : "#0891b2"} fill={isDarkMode ? "#22d3ee" : "#0891b2"} fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 h-full">
              <div className={cn(
                "rounded-2xl p-4 md:p-5 border h-full",
                isDarkMode ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"
              )}>
                <h3 className="text-emerald-500 font-display font-semibold mb-2 md:mb-3 flex items-center text-sm">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                  Key Strengths
                </h3>
                <ul className="space-y-1.5 md:space-y-2">
                  {isLocked ? (
                    <li className={cn("flex items-start text-[11px] md:text-xs italic", isDarkMode ? "text-emerald-200/40" : "text-emerald-700/40")}>
                      Unlock to see your key strengths
                    </li>
                  ) : analysis.strengths.map((strength: string, i: number) => {
                    const guideMatch = KEYWORD_GUIDE_MAP.find(m => strength.toLowerCase().includes(m.keyword.toLowerCase()));
                    return (
                      <li key={i} className={cn("flex items-center text-[11px] md:text-xs", isDarkMode ? "text-emerald-200/70" : "text-emerald-700/70")}>
                        <span className="w-1 h-1 rounded-full bg-emerald-500 mr-2 flex-shrink-0"></span>
                        <span className="flex-grow">{strength}</span>
                        {guideMatch && (
                          <Link to={guideMatch.link} className="ml-2 whitespace-nowrap text-[8px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md bg-emerald-500/5">
                            Guide &rarr;
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className={cn(
                "rounded-2xl p-4 md:p-5 border h-full",
                isDarkMode ? "bg-rose-500/5 border-rose-500/20" : "bg-rose-50 border-rose-100"
              )}>
                <h3 className="text-rose-500 font-display font-semibold mb-2 md:mb-3 flex items-center text-sm">
                  <AlertCircle className="w-4 h-4 mr-2 text-rose-500" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-1.5 md:space-y-2">
                  {isLocked ? (
                    <li className={cn("flex items-start text-xs md:text-sm italic", isDarkMode ? "text-rose-200/40" : "text-rose-700/40")}>
                      Unlock to see areas for improvement
                    </li>
                  ) : analysis.weaknesses.map((weakness: string, i: number) => {
                    const guideMatch = KEYWORD_GUIDE_MAP.find(m => weakness.toLowerCase().includes(m.keyword.toLowerCase()));
                    return (
                      <li key={i} className={cn("flex items-center text-xs md:text-sm segment-item", isDarkMode ? "text-rose-200/70" : "text-rose-700/70")}>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 flex-shrink-0"></span>
                        <span className="flex-grow">{weakness}</span>
                        {guideMatch && (
                          <Link to={guideMatch.link} className="ml-2 whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-md bg-rose-500/5">
                            Fix &rarr;
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          <div className="lg:col-span-12 space-y-4 md:space-y-6">
            {/* Celebrity Twin Comparison */}
            {celebrityResults?.[0] && celebrityResults[0].percentage >= 80 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "rounded-2xl p-6 md:p-8 shadow-2xl border overflow-hidden relative",
                  isDarkMode ? "bg-black border-white/10" : "bg-white border-zinc-200 shadow-sm"
                )}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Sparkles className="w-32 h-32 text-cyan-400" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className={cn("text-2xl md:text-3xl font-display italic", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Celebrity Twin Match</h3>
                      <p className={cn("text-sm font-bold uppercase tracking-widest", isDarkMode ? "text-white/40" : "text-zinc-500")}>High Similarity Detected</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-4xl md:text-5xl font-display italic text-cyan-400">{Number(celebrityResults[0].percentage || 0).toFixed(0)}%</span>
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest", isDarkMode ? "text-white/30" : "text-zinc-400")}>Match Score</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <img
                          src={imageUrl}
                          alt="You"
                          className={cn("relative w-40 h-40 md:w-56 md:h-56 rounded-3xl object-cover border-2 shadow-2xl", isDarkMode ? "border-white/10" : "border-zinc-200")}
                        />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-4 py-1.5 rounded-full border border-white/10">
                          YOU
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-cyan-400" />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <img
                          src={celebrityResults[0].imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(celebrityResults[0].name)}&background=random&color=fff&size=256`}
                          alt={celebrityResults[0].name}
                          className={cn("relative w-40 h-40 md:w-56 md:h-56 rounded-3xl object-cover border-2 shadow-2xl", isDarkMode ? "border-white/10" : "border-zinc-200")}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('ui-avatars.com')) {
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(celebrityResults[0].name)}&background=random&color=fff&size=256`;
                            }
                          }}
                        />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg">
                          {isLocked ? "LOCKED" : celebrityResults[0].name.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {celebrityResults[0].reason && (
                    <div className={cn("mt-12 p-6 rounded-2xl border text-center", isDarkMode ? "bg-white/5 border-white/5" : "bg-zinc-50 border-zinc-200")}>
                      <p className={cn("text-sm md:text-base leading-relaxed italic", isDarkMode ? "text-white/80" : "text-zinc-700")}>
                        {isLocked ? "Unlock to see why you match with this celebrity." : `"${celebrityResults[0].reason}"`}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Celebrity Similarity */}
            <div className={cn(
              "rounded-2xl p-4 md:p-6 shadow-2xl border overflow-hidden relative",
              isDarkMode ? "bg-black border-white/10" : "bg-white border-zinc-200 shadow-sm"
            )}>
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <User className="w-24 h-24" />
              </div>

              <h3 className={cn("text-lg md:text-xl font-display italic mb-4 md:mb-6 flex items-center", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                <User className={cn("w-5 h-5 mr-3", isDarkMode ? "text-cyan-400" : "text-cyan-600")} />
                Celebrity Lookalikes
                <span className="ml-3 px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-black text-cyan-500 tracking-[0.2em] uppercase leading-none">
                  Beta
                </span>
              </h3>

              {celebrityResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {celebrityResults.map((celeb: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, delay: 0.1 * i }}
                      className={cn(
                        "group relative p-4 rounded-2xl border transition-all duration-500",
                        isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
                      )}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <img
                            src={celeb.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(celeb.name)}&background=random&color=fff&size=128`}
                            alt={celeb.name}
                            className={cn("w-16 h-16 rounded-2xl object-cover border-2", isDarkMode ? "border-white/10" : "border-zinc-200")}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.includes('ui-avatars.com')) {
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(celeb.name)}&background=random&color=fff&size=128`;
                              }
                            }}
                          />
                          <div className="absolute -bottom-2 -right-2 bg-cyan-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                            {isLocked ? "??" : `${Number(celeb.percentage || 0).toFixed(0)}%`}
                          </div>
                        </div>
                        <div>
                          <h4 className={cn("font-display italic text-lg", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                            {isLocked ? "Locked Profile" : celeb.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Sparkles key={star} className={cn("w-3 h-3", star <= Math.round(Number(celeb.percentage || 0) / 20) ? "text-amber-400" : "text-zinc-600 opacity-30")} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {celeb.reason && (
                        <p className={cn("text-xs leading-relaxed opacity-80 italic", isDarkMode ? "text-white/70" : "text-zinc-600")}>
                          "{celeb.reason}"
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={cn(
                  "flex flex-col items-center justify-center py-12 px-6 text-center border rounded-2xl border-dashed transition-all duration-500",
                  isDarkMode ? "border-white/10 bg-white/5" : "border-zinc-200 bg-zinc-50"
                )}>
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h4 className={cn("text-lg font-display italic mb-2", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                    Who is your celebrity twin?
                  </h4>
                  <p className={cn("text-sm mb-8 max-w-md mx-auto", isDarkMode ? "text-white/40" : "text-zinc-500")}>
                    Our AI can identify your exact celebrity lookalikes and models who share your facial structure.
                  </p>

                  {isAnalyzingCelebrity ? (
                    <div className="w-full max-w-sm mx-auto mb-6">
                      <div className="w-full space-y-3 flex flex-col items-start px-4">
                        <AnimatePresence mode="popLayout">
                          {celebScanHistory.slice(-3).map((step, index, arr) => {
                            const isCurrent = index === arr.length - 1;
                            return (
                              <motion.div
                                key={step}
                                initial={{ opacity: 0, x: -10, height: 0 }}
                                animate={{ opacity: isCurrent ? 1 : 0.5, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex items-center gap-3 text-sm font-mono w-full ${isCurrent ? (isDarkMode ? 'text-cyan-400' : 'text-cyan-600') : (isDarkMode ? 'text-zinc-500' : 'text-zinc-400')}`}
                              >
                                {isCurrent ? (
                                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                )}
                                <span className="truncate">{step}</span>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : null}

                  <button
                    onClick={handleCelebrityClick}
                    disabled={isAnalyzingCelebrity}
                    className={cn(
                      "relative group px-8 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden",
                      isDarkMode ? "bg-white text-black hover:bg-cyan-400" : "bg-black text-white hover:bg-cyan-600"
                    )}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isAnalyzingCelebrity ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing Features...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {!user ? "Sign Up to Find Twin" : userCredits > 0 ? "Find My Twin (1 Credit)" : "Get Credits to Find Twin"}
                        </>
                      )}
                    </span>
                  </button>

                  {celebError && (
                    <p className="mt-4 text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {celebError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Vision AI Analysis */}
            {result.visionAnalysis && (
              <div className="space-y-4 md:space-y-6">
                <h3 className={cn("text-sm md:text-base font-display font-semibold flex items-center", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                  <Sparkles className={cn("w-4 h-4 mr-2", isDarkMode ? "text-cyan-400" : "text-cyan-600")} />
                  AI Vision Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Skin Analysis Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn(
                      "rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border relative overflow-hidden group",
                      isDarkMode ? "bg-black border-white/5" : "bg-white border-zinc-200 shadow-sm"
                    )}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Activity className="w-16 h-16 md:w-24 md:h-24" />
                    </div>
                    <div className="relative z-10">
                      <p className={cn("text-[8px] font-bold uppercase tracking-[0.3em] mb-2 md:mb-3 opacity-40", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Skin Health</p>
                      <h4 className={cn("text-xl md:text-2xl font-display italic mb-3 md:mb-4", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Skin & Texture</h4>
                      <p className={cn("text-xs md:text-sm leading-relaxed font-light", isDarkMode ? "text-white/70" : "text-zinc-500")}>
                        {result.visionAnalysis.skinAnalysis}
                      </p>
                    </div>
                  </motion.div>

                  {/* Aesthetics Analysis Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className={cn(
                      "rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border relative overflow-hidden group",
                      isDarkMode ? "bg-black border-white/5" : "bg-white border-zinc-200 shadow-sm"
                    )}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <User className="w-16 h-16 md:w-24 md:h-24" />
                    </div>
                    <div className="relative z-10">
                      <p className={cn("text-[8px] font-bold uppercase tracking-[0.3em] mb-2 md:mb-3 opacity-40", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Overall Look</p>
                      <h4 className={cn("text-xl md:text-2xl font-display italic mb-3 md:mb-4", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Aesthetics & Grooming</h4>
                      <p className={cn("text-xs md:text-sm leading-relaxed font-light", isDarkMode ? "text-white/70" : "text-zinc-500")}>
                        {isLocked ? "Unlock the full report to see your personalized aesthetics and grooming analysis." : result.visionAnalysis.aestheticsAnalysis}
                      </p>
                    </div>
                  </motion.div>

                  {/* Hair & Face Shape Card */}
                  {result.visionAnalysis.faceShape && result.visionAnalysis.hairRecommendations && (
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                      className={cn(
                        "rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border relative overflow-hidden group md:col-span-2",
                        isDarkMode ? "bg-black border-white/5" : "bg-white border-zinc-200 shadow-sm"
                      )}
                    >
                      <div className="absolute -top-12 -right-12 opacity-[0.03] pointer-events-none">
                        <Scissors className="w-64 h-64 md:w-96 md:h-96 transform -rotate-12" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-6">
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className={cn("h-[1px] w-8", isDarkMode ? "bg-white/20" : "bg-black/10")} />
                              <p className={cn("text-[10px] font-bold uppercase tracking-[0.3em] opacity-60", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Barber's Guide</p>
                            </div>
                            <h4 className={cn("text-3xl md:text-4xl font-display italic tracking-tight", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Hair & Face Shape</h4>
                          </div>

                          <div className="flex flex-col items-start md:items-end">
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-2 opacity-40", isDarkMode ? "text-white" : "text-zinc-900")}>Detected Shape</span>
                            <div className={cn(
                              "px-6 py-3 rounded-full border text-sm font-bold tracking-widest uppercase shadow-inner",
                              isDarkMode ? "bg-white/5 border-white/10 text-white shadow-white/5" : "bg-zinc-50 border-zinc-200 text-zinc-900 shadow-black/5"
                            )}>
                              {isLocked ? "Locked" : result.visionAnalysis.faceShape} Face
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          {isLocked ? (
                            <div className={cn("p-8 rounded-3xl border md:col-span-2 italic text-center flex flex-col items-center justify-center min-h-[200px]", isDarkMode ? "bg-white/5 border-white/5 text-white/40" : "bg-zinc-50 border-zinc-200 text-zinc-400")}>
                              <Lock className="w-8 h-8 mb-4 opacity-50" />
                              <p>Unlock the full report to see personalized hair and styling recommendations based on your unique face shape.</p>
                            </div>
                          ) : result.visionAnalysis.hairRecommendations.map((hair: any, i: number) => (
                            <div key={i} className={cn(
                              "p-6 md:p-8 rounded-3xl border transition-all duration-500 hover:-translate-y-1 group/card",
                              isDarkMode ? "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20" : "bg-zinc-50 border-zinc-200 hover:bg-white hover:shadow-xl hover:shadow-zinc-200/50 hover:border-zinc-300"
                            )}>
                              <div className="flex items-start gap-4 md:gap-6">
                                <div className={cn(
                                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500",
                                  isDarkMode ? "bg-indigo-500/20 text-indigo-400 group-hover/card:bg-indigo-500/30" : "bg-indigo-100 text-indigo-600 group-hover/card:bg-indigo-200"
                                )}>
                                  <span className="font-display italic font-bold text-xl">{i + 1}</span>
                                </div>
                                <div>
                                  <h5 className={cn("text-xl font-bold tracking-tight mb-3", isDarkMode ? "text-white" : "text-zinc-900")}>{hair.styleName}</h5>
                                  <p className={cn("text-sm leading-relaxed", isDarkMode ? "text-white/60" : "text-zinc-600")}>{hair.reason}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* Dermatology Analysis */}
            {result.visionAnalysis?.dermatology && (
              <div className={cn(
                "rounded-2xl p-4 md:p-5 shadow-2xl border mt-3 md:mt-4",
                isDarkMode ? "bg-black border-white/10" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <h3 className={cn("text-sm md:text-base font-display font-semibold mb-3 md:mb-4 flex items-center", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                  <Activity className={cn("w-4 h-4 mr-2", isDarkMode ? "text-cyan-400" : "text-cyan-600")} />
                  Dermatology Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                  {[
                    { label: "Skin Health", value: result.visionAnalysis.dermatology.skin_quality },
                    { label: "Acne (Clear)", value: result.visionAnalysis.dermatology.acne_presence },
                    { label: "Wrinkles (Smooth)", value: result.visionAnalysis.dermatology.wrinkle_visibility },
                    { label: "Skin Texture", value: result.visionAnalysis.dermatology.skin_texture },
                    { label: "Dark Circles (Clear)", value: result.visionAnalysis.dermatology.dark_circles },
                    { label: "Redness (Clear)", value: result.visionAnalysis.dermatology.redness },
                    { label: "Oiliness (Balanced)", value: result.visionAnalysis.dermatology.oiliness }
                  ].map((item, i) => (
                    <div key={i} className={cn(
                      "p-2.5 md:p-3 rounded-xl border flex flex-col justify-between",
                      isDarkMode ? "bg-white/5 border-white/5" : "bg-zinc-50 border-zinc-200"
                    )}>
                      <span className={cn("text-[8px] md:text-[10px] uppercase tracking-wider font-semibold mb-1.5 md:mb-2", isDarkMode ? "text-white/50" : "text-zinc-500")}>{item.label}</span>
                      <div>
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className={cn("text-xl md:text-2xl font-display font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                            {isLocked ? "??" : <AnimatedCounter value={item.value} delay={1.2 + i * 0.1} />}
                          </span>
                          <span className={cn("text-[10px] font-medium", isDarkMode ? "text-white/30" : "text-black/10")}>/10</span>
                        </div>
                        <div className={cn("w-full rounded-full h-1 overflow-hidden", isDarkMode ? "bg-white/5" : "bg-zinc-100")}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / 10) * 100}%` }}
                            transition={{ duration: 1, delay: 1.5 + i * 0.1, ease: "easeOut" }}
                            className={cn("h-full rounded-full", getScoreBg(item.value))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Symmetry and Raw Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Detailed Symmetry Analysis */}
              {detailedSymmetry && (
                <div className={cn(
                  "rounded-2xl p-4 md:p-5 shadow-2xl border",
                  isDarkMode ? "bg-black border-white/10" : "bg-white border-zinc-200 shadow-sm"
                )}>
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <h3 className={cn("text-sm md:text-base font-display font-semibold flex items-center", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                      <Target className={cn("w-4 h-4 mr-2", isDarkMode ? "text-cyan-400" : "text-cyan-600")} />
                      Detailed Symmetry Analysis
                    </h3>
                    <div className={cn("flex items-center text-[9px] font-bold uppercase tracking-widest opacity-40", isDarkMode ? "text-white" : "text-zinc-900")}>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Best with straight-on photos
                    </div>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    {detailedSymmetry.map((item: any, i: number) => (
                      <div key={i} className={cn(
                        "flex flex-col md:flex-row md:items-center justify-between p-2.5 md:p-3 rounded-xl border",
                        isDarkMode ? "bg-white/5 border-white/5" : "bg-zinc-50 border-zinc-200"
                      )}>
                        <div className="mb-1.5 md:mb-0">
                          <p className={cn("text-xs md:text-sm font-semibold", isDarkMode ? "text-zinc-100/90" : "text-zinc-900")}>{item.feature}</p>
                          <p className={cn("text-[10px] md:text-xs", isDarkMode ? "text-white/50" : "text-zinc-500")}>
                            {isLocked ? "Unlock to see observation" : item.observation}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className={cn("w-16 md:w-24 rounded-full h-1 mr-2", isDarkMode ? "bg-white/10" : "bg-zinc-100")}>
                            <div
                              className={cn("h-full rounded-full", getScoreBg(item.score / 10))}
                              style={{ width: isLocked ? "0%" : `${item.score}%` }}
                            ></div>
                          </div>
                          <span className={cn("text-[10px] md:text-xs font-bold w-8 md:w-10 text-right", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                            {isLocked ? "??" : `${item.score}%`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pro Tip Box */}
                  <div className={cn(
                    "mt-4 p-3 rounded-xl border flex items-start gap-3",
                    isDarkMode ? "bg-white/5 border-white/10" : "bg-zinc-50 border-zinc-200"
                  )}>
                    <div className={cn("p-1.5 rounded-full", isDarkMode ? "bg-cyan-500/20 text-cyan-400" : "bg-cyan-100 text-cyan-600")}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-0.5", isDarkMode ? "text-white/80" : "text-zinc-900")}>Accuracy Tip</p>
                      <p className={cn("text-[10px] leading-relaxed", isDarkMode ? "text-white/40" : "text-zinc-500")}>
                        Symmetry scores are most accurate when the face is perfectly straight and neutral. Even a slight tilt can affect the results.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw Metrics */}
              <div className={cn(
                "rounded-2xl p-4 md:p-5 shadow-2xl border",
                isDarkMode ? "bg-black border-white/10" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <h3 className={cn("text-sm md:text-base font-display font-semibold mb-2 md:mb-3 flex items-center", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                  <Activity className={cn("w-4 h-4 mr-2", isDarkMode ? "text-cyan-400" : "text-cyan-600")} />
                  Raw Measurements
                </h3>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className={cn("p-2.5 md:p-3 rounded-xl border", isDarkMode ? "bg-white/5 border-white/5" : "bg-zinc-50 border-zinc-200")}>
                    <p className={cn("text-[8px] md:text-[10px] uppercase tracking-wider font-semibold mb-1", isDarkMode ? "text-white/40" : "text-zinc-500")}>Symmetry</p>
                    <p className={cn("text-base md:text-lg font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>{metrics.facialSymmetry}</p>
                  </div>
                  <div className={cn("p-2.5 md:p-3 rounded-xl border", isDarkMode ? "bg-white/5 border-white/5" : "bg-zinc-50 border-zinc-200")}>
                    <div className={cn("text-[8px] md:text-[10px] uppercase tracking-wider font-semibold mb-1", isDarkMode ? "text-white/40" : "text-zinc-500")}>
                      Canthal Tilt
                      <Tooltip content="The angle of the eye's outer corner relative to the inner corner; it influences the perceived alertness or youthfulness of the eyes." isDarkMode={isDarkMode} />
                    </div>
                    <p className={cn("text-base md:text-lg font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                      {isLocked ? "??" : metrics.canthalTilt}
                    </p>
                  </div>
                  <div className={cn("p-2.5 md:p-3 rounded-xl border", isDarkMode ? "bg-white/5 border-white/5" : "bg-zinc-50 border-zinc-200")}>
                    <div className={cn("text-[8px] md:text-[10px] uppercase tracking-wider font-semibold mb-1", isDarkMode ? "text-white/40" : "text-zinc-500")}>
                      fWHR
                      <Tooltip content="The ratio of facial width to facial height; it's often associated with perceived dominance and social traits." isDarkMode={isDarkMode} />
                    </div>
                    <p className={cn("text-base md:text-lg font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                      {isLocked ? "??" : metrics.fWHR}
                    </p>
                  </div>
                  <div className={cn("p-2.5 md:p-3 rounded-xl border", isDarkMode ? "bg-white/5 border-white/5" : "bg-zinc-50 border-zinc-200")}>
                    <div className={cn("text-[8px] md:text-[10px] uppercase tracking-wider font-semibold mb-1", isDarkMode ? "text-white/40" : "text-zinc-500")}>
                      Golden Ratio
                      <Tooltip content="A mathematical ratio (approx. 1.618) found in nature and art, often used as a standard for perceived facial harmony and beauty." isDarkMode={isDarkMode} />
                    </div>
                    <p className={cn("text-base md:text-lg font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                      {isLocked ? "??" : metrics.goldenRatio}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Roadmap CTA */}
            <div className="flex justify-center mt-6 md:mt-8">
              <button
                onClick={() => (window as any).navigateToRoadmap?.()}
                className="w-full sm:w-auto px-8 md:px-12 py-3 md:py-4 rounded-full bg-black text-white font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 md:gap-3 group text-[10px] md:text-sm"
              >
                View Personalized Roadmap
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>

        {/* AI Glow-up Coach */}
        {!isLocked && renderViralEngine(false)}
        {!isLocked && (
          <GlowUpCoach result={result} isDarkMode={isDarkMode} />
        )}
      </div>
    </motion.div>
  );
}
