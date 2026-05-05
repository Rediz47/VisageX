import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Sparkles,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
  Users,
  ChevronRight,
  ChevronLeft,
  Crown,
  Dna,
  RotateCcw,
  Award
} from 'lucide-react';
import { useTheme } from '../context/ThemeProvider';
import { useAuth } from '../context/AuthProvider';
import { useCredits } from '../context/CreditsProvider';
import { cn } from '../lib/utils';
import SEO from '../components/SEO';

interface CelebMatch {
  name: string;
  percentage: number;
  reason: string;
  imageUrl: string;
}

const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=512&bold=true`;

function CelebrityPhoto({
  name,
  className
}: {
  name: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (src || failed) return;
    let cancelled = false;
    fetch(`/api/celebrity-photo?name=${encodeURIComponent(name)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.imageUrl) setSrc(data.imageUrl);
        else setFailed(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [failed, name, src]);

  if (!src && !failed) {
    return (
      <div
        className={cn(
          className,
          'flex items-center justify-center animate-pulse',
          'bg-gradient-to-br from-cyan-500/15 to-purple-500/15'
        )}
      >
        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={src || avatarUrl(name)}
      alt={name}
      className={className}
      referrerPolicy="no-referrer"
      onError={(e) => {
        const t = e.target as HTMLImageElement;
        if (!t.src.includes('ui-avatars')) {
          setFailed(true);
          t.src = avatarUrl(name);
        }
      }}
    />
  );
}

const tierColor = (pct: number) =>
  pct >= 85
    ? {
        badge: 'bg-emerald-500',
        text: 'text-emerald-400',
        glow: 'rgba(52,211,153,.3)',
        label: 'Elite Match'
      }
    : pct >= 70
      ? {
          badge: 'bg-cyan-500',
          text: 'text-cyan-400',
          glow: 'rgba(34,211,238,.25)',
          label: 'Strong Match'
        }
      : pct >= 55
        ? {
            badge: 'bg-amber-500',
            text: 'text-amber-400',
            glow: 'rgba(251,191,36,.25)',
            label: 'Notable Match'
          }
        : {
            badge: 'bg-rose-500',
            text: 'text-rose-400',
            glow: 'rgba(244,63,94,.25)',
            label: 'Loose Match'
          };

const stars = (pct: number) => Math.round(pct / 20);

const SCAN_STEPS = [
  'Verifying credits…',
  'Uploading image…',
  'Analyzing facial geometry…',
  'Comparing bone structure…',
  'Matching against celebrity database…',
  'Ranking lookalikes…'
];

export default function CelebrityPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { credits } = useCredits();

  const imageUrl: string | null = location.state?.imageUrl ?? null;
  const isLocked: boolean = location.state?.isLocked ?? false;

  const [results, setResults] = useState<CelebMatch[]>(location.state?.celebrityResults ?? []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanIdx, setScanIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAnalyzing) return;
    const id = setInterval(() => setScanIdx((i) => Math.min(i + 1, SCAN_STEPS.length - 1)), 2200);
    return () => clearInterval(id);
  }, [isAnalyzing]);

  const handleScan = async () => {
    if (!user || !imageUrl) return;
    if (credits <= 0) {
      window.dispatchEvent(new Event('visagex:open-pricing'));
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setScanIdx(0);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/celebrity-lookalike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ image: imageUrl })
      });
      if (!res.ok) throw new Error('Celebrity analysis failed.');
      const data = await res.json();
      if (data.celebritySimilarity) setResults(data.celebritySimilarity);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const w = carouselRef.current.clientWidth * 0.8;
    carouselRef.current.scrollBy({ left: dir === 'right' ? w : -w, behavior: 'smooth' });
  };

  const topMatch = results[0] ?? null;
  const otherMatches = results.slice(1);
  const topTier = topMatch ? tierColor(topMatch.percentage) : null;

  return (
    <>
      <SEO title="Celebrity Lookalike" noindex />

      <div className={cn('min-h-screen pb-32', isDarkMode ? 'bg-[#050508]' : 'bg-[#f8f8fc]')}>
        {/* Background mesh */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute -top-60 left-1/4 w-[800px] h-[800px] rounded-full"
            style={{
              background: isDarkMode
                ? 'radial-gradient(circle,rgba(34,211,238,.08),transparent 60%)'
                : 'radial-gradient(circle,rgba(34,211,238,.05),transparent 60%)'
            }}
          />
          <div
            className="absolute top-40 -right-40 w-[600px] h-[600px] rounded-full"
            style={{
              background: isDarkMode
                ? 'radial-gradient(circle,rgba(99,102,241,.07),transparent 60%)'
                : 'radial-gradient(circle,rgba(99,102,241,.04),transparent 60%)'
            }}
          />
        </div>

        {/* Sticky breadcrumb */}
        <div
          className={cn(
            'sticky top-16 z-30 backdrop-blur-xl border-b',
            isDarkMode ? 'bg-[#050508]/70 border-white/[.04]' : 'bg-white/70 border-zinc-200/50'
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className={cn(
                'flex items-center gap-2 text-sm font-medium transition-colors',
                isDarkMode ? 'text-white/50 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <ArrowLeft className="w-4 h-4" /> Back to results
            </button>
            <div className="flex items-center gap-2">
              <Dna className="w-3.5 h-3.5 text-cyan-400" />
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-[.25em]',
                  isDarkMode ? 'text-white/40' : 'text-zinc-500'
                )}
              >
                Celebrity Lookalike
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-black text-cyan-400 tracking-[.2em] uppercase">
                Beta
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
          {/* ════════ EMPTY STATE — split hero ════════ */}
          {results.length === 0 && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'relative rounded-3xl border overflow-hidden flex flex-col md:flex-row md:items-center min-h-[340px]',
                isDarkMode ? 'border-white/[.08]' : 'border-zinc-200 shadow-2xl shadow-cyan-500/5'
              )}
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #0a0a14 0%, #0f1424 50%, #0a0e1a 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #faf5ff 100%)'
              }}
            >
              <div
                className="absolute -top-28 left-1/2 -translate-x-1/2 w-[520px] h-72 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse,rgba(34,211,238,.18),transparent 70%)',
                  filter: 'blur(40px)'
                }}
              />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

              {/* LEFT — copy block */}
              <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col justify-center md:w-[54%]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-px bg-cyan-400/70" />
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-[.3em]',
                      isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                    )}
                  >
                    Step 01 · Scan
                  </span>
                </div>
                <h1
                  className={cn(
                    'text-3xl sm:text-4xl lg:text-5xl font-display italic tracking-tight leading-[1.05] mb-4',
                    isDarkMode ? 'text-white' : 'text-zinc-900'
                  )}
                >
                  Discover your{' '}
                  <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    celebrity twin
                  </span>
                </h1>
                <p
                  className={cn(
                    'text-sm leading-relaxed mb-6 max-w-sm',
                    isDarkMode ? 'text-white/55' : 'text-zinc-500'
                  )}
                >
                  Neural facial-geometry matching against thousands of public figures — based on
                  bone structure, eye shape, jawline & nose profile.
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleScan}
                  disabled={!imageUrl}
                  className={cn(
                    'self-start relative px-7 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-40 overflow-hidden group',
                    isDarkMode ? 'bg-white text-black' : 'bg-zinc-900 text-white'
                  )}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {!user
                      ? 'Sign in to scan'
                      : credits > 0
                        ? 'Find my twin · 1 credit'
                        : 'Get credits'}
                  </span>
                </motion.button>

                {!imageUrl && (
                  <p
                    className={cn(
                      'mt-4 text-xs flex items-center gap-2',
                      isDarkMode ? 'text-white/30' : 'text-zinc-400'
                    )}
                  >
                    <AlertCircle className="w-3 h-3" /> Run a face analysis first.
                  </p>
                )}
              </div>

              {/* RIGHT — face photo + decorative */}
              <div
                className={cn(
                  'relative flex items-center justify-center p-6 lg:p-8 border-t md:border-t-0 md:border-l overflow-hidden md:w-[46%] md:self-stretch',
                  isDarkMode ? 'border-white/[.06]' : 'border-zinc-100'
                )}
              >
                {imageUrl ? (
                  <div className="relative flex flex-col items-center">
                    <img
                      src={imageUrl}
                      alt=""
                      className={cn(
                        'w-52 h-52 rounded-[2rem] object-cover border',
                        isDarkMode ? 'border-white/15' : 'border-white'
                      )}
                    />
                    <p className={cn('mt-4 text-xs font-medium', isDarkMode ? 'text-white/35' : 'text-zinc-500')}>
                      Face shape · eyes · jawline
                    </p>
                  </div>
                ) : (
                  <div className="w-44 h-44 rounded-[28px] bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 flex items-center justify-center">
                    <Search
                      className={cn('w-12 h-12', isDarkMode ? 'text-white/20' : 'text-zinc-300')}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════════ SCANNING ════════ */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                'rounded-[28px] border p-10 sm:p-20 flex flex-col items-center text-center mx-auto max-w-3xl',
                isDarkMode
                  ? 'bg-white/[.02] border-white/[.08]'
                  : 'bg-white border-zinc-200 shadow-xl'
              )}
            >
              {imageUrl && (
                <div className="relative mb-12 overflow-hidden rounded-3xl">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 blur-2xl"
                  />
                  <img
                    src={imageUrl}
                    alt=""
                    className={cn(
                      'relative w-32 h-32 rounded-3xl object-cover border-2',
                      isDarkMode ? 'border-white/15' : 'border-white shadow-2xl'
                    )}
                  />
                  <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400/40 animate-ping" />
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [0, 128, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)] rounded-full"
                  />
                </div>
              )}
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-8" />
              <div className="w-full max-w-sm space-y-3">
                <AnimatePresence mode="popLayout">
                  {SCAN_STEPS.slice(0, scanIdx + 1).map((step, i) => {
                    const isCurrent = i === scanIdx;
                    return (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: isCurrent ? 1 : 0.4, x: 0 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          'flex items-center gap-3 text-sm font-mono',
                          isCurrent
                            ? 'text-cyan-400'
                            : isDarkMode
                              ? 'text-zinc-600'
                              : 'text-zinc-400'
                        )}
                      >
                        {isCurrent ? (
                          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        )}
                        <span>{step}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ════════ RESULTS — split hero with top match ════════ */}
          {results.length > 0 && !isAnalyzing && topMatch && topTier && (
            <>
              {/* HERO: top match IS the hero, split 2-col */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'relative rounded-[28px] border overflow-hidden grid lg:grid-cols-[1fr,1.1fr]',
                  isDarkMode ? 'border-white/[.08]' : 'border-zinc-200 shadow-2xl shadow-cyan-500/5'
                )}
                style={{
                  background: isDarkMode
                    ? 'linear-gradient(135deg, #0a0a14 0%, #0f1424 50%, #0a0e1a 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #faf5ff 100%)'
                }}
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />
                <div
                  className="absolute -top-32 right-0 w-96 h-96 rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(circle,${topTier.glow},transparent 70%)`,
                    filter: 'blur(40px)'
                  }}
                />

                {/* LEFT — face stack showcase */}
                <div
                  className={cn(
                    'relative flex items-center justify-center p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r min-h-[440px]',
                    isDarkMode ? 'border-white/[.06]' : 'border-zinc-100'
                  )}
                >
                  <div className="relative flex items-center gap-3">
                    {/* You */}
                    {imageUrl && (
                      <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10"
                      >
                        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 blur-xl" />
                        <img
                          src={imageUrl}
                          alt="You"
                          className={cn(
                            'relative w-32 h-40 sm:w-36 sm:h-44 rounded-3xl object-cover border-2',
                            isDarkMode ? 'border-white/15' : 'border-white shadow-2xl'
                          )}
                        />
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-black px-3 py-1 rounded-full tracking-widest shadow-lg">
                          YOU
                        </span>
                      </motion.div>
                    )}
                    {/* Match meter overlap */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className={cn(
                        'relative z-20 -mx-3 w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md flex-shrink-0',
                        isDarkMode
                          ? 'bg-black/80 border-2 border-white/20'
                          : 'bg-white border-2 border-zinc-200 shadow-xl'
                      )}
                    >
                      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          fill="none"
                          stroke={isDarkMode ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'}
                          strokeWidth="4"
                        />
                        <motion.circle
                          cx="40"
                          cy="40"
                          r="34"
                          fill="none"
                          stroke="url(#celeb-grad)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 34}
                          initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                          animate={{
                            strokeDashoffset: 2 * Math.PI * 34 * (1 - topMatch.percentage / 100)
                          }}
                          transition={{ duration: 1.5, delay: 0.6 }}
                        />
                        <defs>
                          <linearGradient id="celeb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className={cn('text-base font-display italic z-10', topTier.text)}>
                        {isLocked ? '??' : `${topMatch.percentage}%`}
                      </span>
                    </motion.div>
                    {/* Celeb */}
                    <motion.div
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="relative z-10"
                    >
                      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 blur-xl" />
                      <CelebrityPhoto
                        name={topMatch.name}
                        className={cn(
                          'relative w-32 h-40 sm:w-36 sm:h-44 rounded-3xl object-cover border-2',
                          isDarkMode ? 'border-white/15' : 'border-white shadow-2xl'
                        )}
                      />
                      <span
                        className={cn(
                          'absolute -bottom-2 left-1/2 -translate-x-1/2 text-white text-[9px] font-black px-3 py-1 rounded-full tracking-widest shadow-lg whitespace-nowrap max-w-[140px] truncate',
                          topTier.badge
                        )}
                      >
                        {isLocked ? 'LOCKED' : topMatch.name.toUpperCase()}
                      </span>
                    </motion.div>
                  </div>
                </div>

                {/* RIGHT — copy + meta */}
                <div className="relative p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center gap-2 mb-5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span
                        className={cn(
                          'text-[10px] font-black uppercase tracking-[.3em]',
                          isDarkMode ? 'text-amber-400' : 'text-amber-600'
                        )}
                      >
                        #1 Top Match
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white',
                          topTier.badge
                        )}
                      >
                        {topTier.label}
                      </span>
                    </div>

                    <h1
                      className={cn(
                        'text-4xl sm:text-5xl lg:text-6xl font-display italic tracking-tight leading-[1.02] mb-3',
                        isDarkMode ? 'text-white' : 'text-zinc-900'
                      )}
                    >
                      You match{' '}
                      <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {isLocked ? '———' : topMatch.name}
                      </span>
                    </h1>

                    <p className={cn('text-lg font-display italic mb-6', topTier.text)}>
                      {isLocked ? '??%' : `${topMatch.percentage}%`} similarity · {topTier.label}
                    </p>

                    {/* Stars row */}
                    <div className="flex items-center gap-1 mb-6">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className={cn(
                            'w-5 h-5',
                            s < stars(topMatch.percentage)
                              ? 'text-amber-400 fill-amber-400'
                              : isDarkMode
                                ? 'text-zinc-700'
                                : 'text-zinc-300'
                          )}
                        />
                      ))}
                    </div>

                    {topMatch.reason && !isLocked && (
                      <div
                        className={cn(
                          'p-5 rounded-2xl border',
                          isDarkMode
                            ? 'bg-white/[.03] border-white/[.06]'
                            : 'bg-white/60 border-zinc-100'
                        )}
                      >
                        <span
                          className={cn(
                            'block text-[9px] font-black uppercase tracking-[.25em] mb-2',
                            isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                          )}
                        >
                          Why it matches
                        </span>
                        <p
                          className={cn(
                            'text-sm italic leading-relaxed',
                            isDarkMode ? 'text-white/75' : 'text-zinc-700'
                          )}
                        >
                          "{topMatch.reason}"
                        </p>
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>

              {/* ── OTHER MATCHES — horizontal scroll ── */}
              {otherMatches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <span
                        className={cn(
                          'text-[10px] font-black uppercase tracking-[.3em] block',
                          isDarkMode ? 'text-white/40' : 'text-zinc-500'
                        )}
                      >
                        Also looking like
                      </span>
                      <h3
                        className={cn(
                          'text-2xl font-display italic mt-1',
                          isDarkMode ? 'text-white' : 'text-zinc-900'
                        )}
                      >
                        {otherMatches.length} more matches
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => scrollCarousel('left')}
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center border transition-all',
                          isDarkMode
                            ? 'bg-white/[.04] border-white/[.08] hover:bg-white/[.08] text-white'
                            : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600 shadow-sm'
                        )}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => scrollCarousel('right')}
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center border transition-all',
                          isDarkMode
                            ? 'bg-white/[.04] border-white/[.08] hover:bg-white/[.08] text-white'
                            : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600 shadow-sm'
                        )}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div
                    ref={carouselRef}
                    className="flex gap-5 overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 snap-x snap-mandatory scroll-smooth"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    <style>{`div::-webkit-scrollbar{display:none}`}</style>
                    {otherMatches.map((celeb, i) => {
                      const tc = tierColor(celeb.percentage);
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + 0.08 * i }}
                          className={cn(
                            'snap-start flex-shrink-0 w-[300px] sm:w-[340px] rounded-2xl border p-5 transition-all duration-300 group',
                            isDarkMode
                              ? 'bg-white/[.02] border-white/[.06] hover:bg-white/[.05] hover:border-white/[.12]'
                              : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-xl'
                          )}
                        >
                          {/* Photo at top */}
                          <div className="relative mb-4 rounded-xl overflow-hidden aspect-[4/3]">
                            <CelebrityPhoto
                              name={celeb.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
                            <span
                              className={cn(
                                'absolute top-3 left-3 text-white text-[9px] font-black px-2.5 py-1 rounded-md tracking-widest shadow-md',
                                tc.badge
                              )}
                            >
                              #{i + 2} · {isLocked ? '??' : `${celeb.percentage}%`}
                            </span>
                            <span
                              className={cn(
                                'absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md',
                                isDarkMode
                                  ? 'bg-white/10 text-white backdrop-blur-md'
                                  : 'bg-white/80 text-zinc-700 backdrop-blur-md'
                              )}
                            >
                              {tc.label}
                            </span>
                          </div>

                          <h4
                            className={cn(
                              'font-display italic text-xl mb-2 leading-tight',
                              isDarkMode ? 'text-white' : 'text-zinc-900'
                            )}
                          >
                            {isLocked ? 'Locked' : celeb.name}
                          </h4>
                          <div className="flex items-center gap-0.5 mb-3">
                            {Array.from({ length: 5 }).map((_, s) => (
                              <Star
                                key={s}
                                className={cn(
                                  'w-3 h-3',
                                  s < stars(celeb.percentage)
                                    ? 'text-amber-400 fill-amber-400'
                                    : isDarkMode
                                      ? 'text-zinc-700'
                                      : 'text-zinc-300'
                                )}
                              />
                            ))}
                          </div>
                          {celeb.reason && !isLocked && (
                            <p
                              className={cn(
                                'text-xs italic leading-relaxed',
                                isDarkMode ? 'text-white/55' : 'text-zinc-500'
                              )}
                            >
                              "{celeb.reason}"
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── 3-COLUMN INFO ROW (replaces methodology block) ── */}
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: Dna,
                    label: '468',
                    sub: 'Facial landmarks analyzed',
                    color: 'text-cyan-400'
                  },
                  {
                    icon: Award,
                    label: `${results.length}`,
                    sub: 'Top celebrity matches',
                    color: 'text-purple-400'
                  },
                  {
                    icon: Sparkles,
                    label: 'AI',
                    sub: 'Trained on public-figure dataset',
                    color: 'text-amber-400'
                  }
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      'rounded-2xl border p-5 flex items-center gap-4',
                      isDarkMode
                        ? 'bg-white/[.02] border-white/[.06]'
                        : 'bg-white border-zinc-200 shadow-sm'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        isDarkMode ? 'bg-white/[.04]' : 'bg-zinc-50'
                      )}
                    >
                      <s.icon className={cn('w-6 h-6', s.color)} />
                    </div>
                    <div>
                      <div
                        className={cn(
                          'text-2xl font-display italic leading-none',
                          isDarkMode ? 'text-white' : 'text-zinc-900'
                        )}
                      >
                        {s.label}
                      </div>
                      <div
                        className={cn(
                          'text-xs mt-1',
                          isDarkMode ? 'text-white/40' : 'text-zinc-500'
                        )}
                      >
                        {s.sub}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mt-6 text-sm text-rose-400"
            >
              <AlertCircle className="w-4 h-4" /> {error}
            </motion.div>
          )}
        </div>

        {/* Floating action bar */}
        {results.length > 0 && !isAnalyzing && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
            <div
              className={cn(
                'flex items-center gap-2 p-2 rounded-2xl border backdrop-blur-xl shadow-2xl',
                isDarkMode ? 'bg-black/60 border-white/[.08]' : 'bg-white/80 border-zinc-200'
              )}
            >
              <button
                onClick={handleScan}
                disabled={isAnalyzing || !imageUrl}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40',
                  isDarkMode
                    ? 'bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30'
                    : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'
                )}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Scan again
              </button>
              <button
                onClick={() => navigate(-1)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all',
                  isDarkMode
                    ? 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                )}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Results
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
