import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Scissors,
  Droplets,
  Wind,
  Heart,
  Shield,
  BookOpen,
  Star,
  Sun,
  Activity,
  ChevronRight,
  RotateCcw,
  Flame
} from 'lucide-react';
import { useTheme } from '../context/ThemeProvider';
import { useAuth } from '../context/AuthProvider';
import { useCredits } from '../context/CreditsProvider';
import { cn } from '../lib/utils';
import SEO from '../components/SEO';

interface HairResult {
  visible: boolean;
  hairType?: string;
  texture?: string;
  density?: string;
  condition?: string;
  hairlineShape?: string;
  healthScore?: number;
  strengths?: string[];
  concerns?: string[];
  recommendedStyles?: { name: string; why: string }[];
  careRoutine?: { title: string; detail: string }[];
  error?: string;
}

const SCAN_STEPS = [
  'Verifying credits…',
  'Analyzing strand pattern…',
  'Measuring density & texture…',
  'Evaluating scalp & hairline…',
  'Assessing hair health…',
  'Generating personalized routine…'
];

const HAIR_TYPE_GUIDE = [
  {
    type: 'Straight',
    icon: Wind,
    color: 'text-cyan-400',
    desc: 'Smooth, flat strands. Shiny but greases quickly.',
    tips: 'Wash 2-3x/week, volumize, skip heavy oils.'
  },
  {
    type: 'Wavy',
    icon: Activity,
    color: 'text-indigo-400',
    desc: 'Loose S-shape pattern. Frizz-prone in humidity.',
    tips: 'Lightweight curl creams, scrunch + plop.'
  },
  {
    type: 'Curly',
    icon: Sparkles,
    color: 'text-purple-400',
    desc: 'Defined ringlets. Drier by nature.',
    tips: 'Co-wash, deep condition weekly, finger-coil.'
  },
  {
    type: 'Coily',
    icon: Star,
    color: 'text-amber-400',
    desc: 'Tight zigzag pattern. Most prone to dryness.',
    tips: 'Rich butters, low-manipulation, satin pillow.'
  }
];

const CARE_PILLARS = [
  { icon: Droplets, label: 'Hydration', detail: 'Deep condition 1-2x/week.' },
  { icon: Shield, label: 'Protection', detail: 'Heat protectant + silk pillow.' },
  { icon: Sun, label: 'Scalp', detail: 'Daily massage, monthly exfoliation.' },
  { icon: Heart, label: 'Nutrition', detail: 'Biotin, zinc, iron, omega-3s.' }
];

const FAQ = [
  {
    q: 'How fast does hair grow?',
    a: '~1.25 cm (½ inch)/month, ~15 cm/year. Genetics, age, nutrition matter most.'
  },
  {
    q: 'Are sulfates really bad?',
    a: 'Not inherently — they cleanse aggressively. Curly/dry hair → avoid; oily straight → fine.'
  },
  {
    q: 'Does cutting hair speed growth?',
    a: 'No, growth happens at the follicle. Trims preserve length by preventing breakage.'
  },
  {
    q: 'Does mewing affect hairline?',
    a: 'No — mewing affects bone (jaw/midface), hairline is genetic.'
  }
];

const TYPE_ICON: Record<string, any> = {
  Straight: Wind,
  Wavy: Activity,
  Curly: Sparkles,
  Coily: Star
};

const simplifyHairText = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.includes('shine') || lower.includes('luster') || lower.includes('cuticle')) {
    return 'Hair looks shiny and healthy.';
  }
  if (lower.includes('density') || lower.includes('coverage') || lower.includes('thinning')) {
    return 'Hair looks evenly dense with no clear thinning.';
  }
  if (lower.includes('scalp') || lower.includes('hairline')) {
    return 'Hairline and scalp area look clear in this photo.';
  }
  if (lower.includes('wave') && (lower.includes('defined') || lower.includes('enhanced'))) {
    return 'Waves could look cleaner with a light styling product.';
  }
  if (lower.includes('product buildup') || lower.includes('buildup')) {
    return 'Too much product can make hair look dull over time.';
  }
  return text
    .replace(/\bluster\b/gi, 'shine')
    .replace(/\bcuticles\b/gi, 'hair surface')
    .replace(/\bintegrity\b/gi, 'shape')
    .replace(/\bpotential for\b/gi, '')
    .replace(/\bspecific\b/gi, 'simple');
};

export default function HairPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { credits } = useCredits();

  const imageUrl: string | null = location.state?.imageUrl ?? null;

  const [result, setResult] = useState<HairResult | null>(location.state?.hairResult ?? null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanIdx, setScanIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!isAnalyzing) return;
    const id = setInterval(() => setScanIdx((i) => Math.min(i + 1, SCAN_STEPS.length - 1)), 2000);
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
      const res = await fetch('/api/hair-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ image: imageUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hair analysis failed.');
      if (data.visible === false) setError(data.error || 'Hair is not clearly visible.');
      else setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const TypeIcon = result?.hairType ? TYPE_ICON[result.hairType] || Wind : Wind;

  return (
    <>
      <SEO title="Hair Analysis & Care Guide" noindex />

      <div className={cn('min-h-screen pb-32', isDarkMode ? 'bg-[#050508]' : 'bg-[#f8f8fc]')}>
        {/* bg mesh */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute -top-60 left-1/4 w-[800px] h-[800px] rounded-full"
            style={{
              background: isDarkMode
                ? 'radial-gradient(circle,rgba(168,85,247,.08),transparent 60%)'
                : 'radial-gradient(circle,rgba(168,85,247,.05),transparent 60%)'
            }}
          />
          <div
            className="absolute top-40 -right-40 w-[600px] h-[600px] rounded-full"
            style={{
              background: isDarkMode
                ? 'radial-gradient(circle,rgba(236,72,153,.07),transparent 60%)'
                : 'radial-gradient(circle,rgba(236,72,153,.04),transparent 60%)'
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
              <Scissors className="w-3.5 h-3.5 text-purple-400" />
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-[.25em]',
                  isDarkMode ? 'text-white/40' : 'text-zinc-500'
                )}
              >
                Hair Analysis
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-[9px] font-black text-purple-400 tracking-[.2em] uppercase">
                New
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
          {/* ════════ EMPTY STATE — split hero ════════ */}
          {!result && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'relative rounded-3xl border overflow-hidden flex flex-col md:flex-row md:items-center min-h-[340px]',
                isDarkMode ? 'border-white/[.08]' : 'border-zinc-200 shadow-2xl shadow-purple-500/5'
              )}
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #0a0a14 0%, #1a0f24 50%, #14091e 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #faf5ff 50%, #fdf2f8 100%)'
              }}
            >
              <div
                className="absolute -top-28 left-1/2 -translate-x-1/2 w-[520px] h-72 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse,rgba(168,85,247,.18),transparent 70%)',
                  filter: 'blur(40px)'
                }}
              />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

              <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col justify-center md:w-[54%]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-px bg-purple-400/70" />
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-[.3em]',
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    )}
                  >
                    Trichology AI
                  </span>
                </div>
                <h1
                  className={cn(
                    'text-3xl sm:text-4xl lg:text-5xl font-display italic tracking-tight leading-[1.05] mb-4',
                    isDarkMode ? 'text-white' : 'text-zinc-900'
                  )}
                >
                  Decode your{' '}
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                    unique hair
                  </span>
                </h1>
                <p
                  className={cn(
                    'text-sm leading-relaxed mb-6 max-w-sm',
                    isDarkMode ? 'text-white/55' : 'text-zinc-500'
                  )}
                >
                  Type, density, hairline & a 5-step routine engineered for your specific hair from
                  a single photo.
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
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {!user ? 'Sign in' : credits > 0 ? 'Analyze hair · 1 credit' : 'Get credits'}
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
                {error && (
                  <p className="mt-5 text-sm text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </p>
                )}
              </div>

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
                    <p
                      className={cn(
                        'mt-4 text-xs font-medium',
                        isDarkMode ? 'text-white/35' : 'text-zinc-500'
                      )}
                    >
                      Hair type · density · hairline
                    </p>
                  </div>
                ) : (
                  <div className="w-44 h-44 rounded-[28px] bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                    <Scissors
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
                    className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-2xl"
                  />
                  <img
                    src={imageUrl}
                    alt=""
                    className={cn(
                      'relative w-32 h-32 rounded-3xl object-cover border-2',
                      isDarkMode ? 'border-white/15' : 'border-white shadow-2xl'
                    )}
                  />
                  <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/40 animate-ping" />
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [0, 128, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_20px_rgba(168,85,247,0.8)] rounded-full"
                  />
                </div>
              )}
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-8" />
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
                            ? 'text-purple-400'
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

          {/* ════════ RESULTS — BENTO LAYOUT ════════ */}
          {result && !isAnalyzing && (
            <>
              {/* ── BENTO HERO: condition + profile ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
                {/* Cell A — Visual condition */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'lg:col-span-5 relative rounded-[24px] border p-7 flex flex-col justify-between overflow-hidden min-h-[300px]',
                    isDarkMode
                      ? 'bg-white/[.02] border-white/[.08]'
                      : 'bg-white border-zinc-200 shadow-sm'
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span
                        className={cn(
                          'text-[10px] font-black uppercase tracking-[.25em]',
                          isDarkMode ? 'text-white/35' : 'text-zinc-400'
                        )}
                      >
                        Visual Hair Condition
                      </span>
                    </div>
                    <h2
                      className={cn(
                        'text-4xl md:text-5xl font-display italic tracking-tight mb-3',
                        isDarkMode ? 'text-white' : 'text-zinc-950'
                      )}
                    >
                      {result.condition ? `${result.condition}-looking` : 'Visible condition'}
                    </h2>
                    <p
                      className={cn(
                        'text-sm leading-relaxed max-w-sm',
                        isDarkMode ? 'text-white/45' : 'text-zinc-500'
                      )}
                    >
                      Based on visible hair in this photo, not a medical scalp diagnosis.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-8">
                    {[
                      { label: 'Type', value: result.hairType },
                      { label: 'Density', value: result.density },
                      { label: 'Hairline', value: result.hairlineShape }
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={cn(
                          'rounded-2xl border p-3',
                          isDarkMode
                            ? 'bg-white/[.025] border-white/[.06]'
                            : 'bg-zinc-50 border-zinc-100'
                        )}
                      >
                        <p
                          className={cn(
                            'text-[9px] font-black uppercase tracking-widest mb-1',
                            isDarkMode ? 'text-white/30' : 'text-zinc-400'
                          )}
                        >
                          {item.label}
                        </p>
                        <p
                          className={cn(
                            'text-xs font-bold truncate',
                            isDarkMode ? 'text-white/75' : 'text-zinc-800'
                          )}
                        >
                          {item.value || '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Cell B — Headline (lg:col-7) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={cn(
                    'lg:col-span-7 relative rounded-[24px] border p-8 lg:p-10 overflow-hidden',
                    isDarkMode
                      ? 'bg-white/[.02] border-white/[.08]'
                      : 'bg-white border-zinc-200 shadow-sm'
                  )}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-px bg-purple-400" />
                    <span
                      className={cn(
                        'text-[10px] font-black uppercase tracking-[.3em]',
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      )}
                    >
                      Profile Summary
                    </span>
                  </div>
                  <h1
                    className={cn(
                      'text-3xl sm:text-4xl lg:text-5xl font-display italic tracking-tight leading-[1.05] mb-3',
                      isDarkMode ? 'text-white' : 'text-zinc-900'
                    )}
                  >
                    Your hair appears{' '}
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                      {result.hairType?.toLowerCase()}
                    </span>{' '}
                    &amp;{' '}
                    <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                      {result.condition?.toLowerCase()}
                    </span>
                  </h1>
                  <p
                    className={cn(
                      'text-sm leading-relaxed mb-6',
                      isDarkMode ? 'text-white/55' : 'text-zinc-500'
                    )}
                  >
                    {result.density} density · {result.texture} texture · {result.hairlineShape}{' '}
                    hairline
                  </p>

                  {/* 5 mini stat chips */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Type', value: result.hairType, Icon: TypeIcon, color: 'purple' },
                      { label: 'Texture', value: result.texture, Icon: Wind, color: 'pink' },
                      { label: 'Density', value: result.density, Icon: Activity, color: 'cyan' },
                      { label: 'Condition', value: result.condition, Icon: Heart, color: 'rose' },
                      {
                        label: 'Hairline',
                        value: result.hairlineShape,
                        Icon: Flame,
                        color: 'amber'
                      }
                    ].map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 + i * 0.05 }}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs',
                          isDarkMode
                            ? 'bg-white/[.03] border-white/[.06]'
                            : 'bg-zinc-50 border-zinc-100'
                        )}
                      >
                        <s.Icon className={cn('w-3.5 h-3.5', `text-${s.color}-400`)} />
                        <span
                          className={cn('font-bold', isDarkMode ? 'text-white' : 'text-zinc-900')}
                        >
                          {s.value || '—'}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] uppercase tracking-widest',
                            isDarkMode ? 'text-white/30' : 'text-zinc-400'
                          )}
                        >
                          · {s.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div
                className={cn(
                  'rounded-2xl border px-5 py-4 text-xs leading-relaxed',
                  isDarkMode
                    ? 'bg-white/[.02] border-white/[.06] text-white/45'
                    : 'bg-white border-zinc-200 text-zinc-500'
                )}
              >
                Based on visible features in this image — not a medical or scalp diagnosis.
              </div>

              {/* ── 3-COL INSIGHTS (above-fold) — good points | watch points | hairline ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* What looks good */}
                {result.strengths && result.strengths.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={cn(
                      'relative rounded-2xl border p-5 overflow-hidden',
                      isDarkMode
                        ? 'bg-white/[.02] border-white/[.06]'
                        : 'bg-white border-zinc-200 shadow-sm'
                    )}
                  >
                    <div
                      className="absolute -top-12 -right-12 w-32 h-32 rounded-full"
                      style={{
                        background: 'radial-gradient(circle,rgba(34,197,94,.2),transparent 70%)',
                        filter: 'blur(20px)'
                      }}
                    />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span
                          className={cn(
                            'text-[10px] font-black uppercase tracking-[.25em]',
                            isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                          )}
                        >
                          What looks good
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {result.strengths.map((s, i) => (
                          <li
                            key={i}
                            className={cn(
                              'text-sm flex gap-2 leading-relaxed',
                              isDarkMode ? 'text-white/70' : 'text-zinc-600'
                            )}
                          >
                            <span className="text-emerald-500 mt-1 flex-shrink-0">●</span>
                            <span>{simplifyHairText(s)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
                {/* What to watch */}
                {result.concerns && result.concerns.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                      'relative rounded-2xl border p-5 overflow-hidden',
                      isDarkMode
                        ? 'bg-white/[.02] border-white/[.06]'
                        : 'bg-white border-zinc-200 shadow-sm'
                    )}
                  >
                    <div
                      className="absolute -top-12 -right-12 w-32 h-32 rounded-full"
                      style={{
                        background: 'radial-gradient(circle,rgba(245,158,11,.2),transparent 70%)',
                        filter: 'blur(20px)'
                      }}
                    />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span
                          className={cn(
                            'text-[10px] font-black uppercase tracking-[.25em]',
                            isDarkMode ? 'text-amber-400' : 'text-amber-600'
                          )}
                        >
                          What to watch
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {result.concerns.map((c, i) => (
                          <li
                            key={i}
                            className={cn(
                              'text-sm flex gap-2 leading-relaxed',
                              isDarkMode ? 'text-white/70' : 'text-zinc-600'
                            )}
                          >
                            <span className="text-amber-500 mt-1 flex-shrink-0">●</span>
                            <span>{simplifyHairText(c)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
                {/* Hairline / Quick fact */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    'relative rounded-2xl border p-5 overflow-hidden',
                    isDarkMode
                      ? 'bg-white/[.02] border-white/[.06]'
                      : 'bg-white border-zinc-200 shadow-sm'
                  )}
                >
                  <div
                    className="absolute -top-12 -right-12 w-32 h-32 rounded-full"
                    style={{
                      background: 'radial-gradient(circle,rgba(168,85,247,.2),transparent 70%)',
                      filter: 'blur(20px)'
                    }}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Flame className="w-4 h-4 text-purple-500" />
                      <span
                        className={cn(
                          'text-[10px] font-black uppercase tracking-[.25em]',
                          isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        )}
                      >
                        Hairline
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-2xl font-display italic mb-2',
                        isDarkMode ? 'text-white' : 'text-zinc-900'
                      )}
                    >
                      {result.hairlineShape}
                    </p>
                    <p
                      className={cn(
                        'text-xs leading-relaxed',
                        isDarkMode ? 'text-white/55' : 'text-zinc-500'
                      )}
                    >
                      Your hairline shape is largely genetic. It frames the face and influences
                      which hairstyles flatter best.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* ── RECOMMENDED STYLES — 2-col asymmetric ── */}
              {result.recommendedStyles && result.recommendedStyles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <span
                        className={cn(
                          'text-[10px] font-black uppercase tracking-[.3em] block',
                          isDarkMode ? 'text-white/40' : 'text-zinc-500'
                        )}
                      >
                        For your hair type
                      </span>
                      <h3
                        className={cn(
                          'text-2xl font-display italic mt-1',
                          isDarkMode ? 'text-white' : 'text-zinc-900'
                        )}
                      >
                        Recommended styles
                      </h3>
                    </div>
                  </div>
                  <div className="grid lg:grid-cols-3 gap-4">
                    {result.recommendedStyles.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -4 }}
                        className={cn(
                          'group relative rounded-2xl border p-6 overflow-hidden transition-all',
                          isDarkMode
                            ? 'bg-white/[.02] border-white/[.06] hover:border-purple-500/40'
                            : 'bg-white border-zinc-200 hover:border-purple-300 shadow-sm hover:shadow-xl'
                        )}
                      >
                        <div
                          className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-50 group-hover:opacity-80 transition-opacity"
                          style={{
                            background:
                              'radial-gradient(circle,rgba(168,85,247,.3),transparent 70%)',
                            filter: 'blur(20px)'
                          }}
                        />
                        <div className="relative">
                          <div className="flex items-start justify-between mb-4">
                            <div
                              className={cn(
                                'w-12 h-12 rounded-xl flex items-center justify-center font-display italic text-2xl',
                                isDarkMode
                                  ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300'
                                  : 'bg-purple-50 border border-purple-200 text-purple-600'
                              )}
                            >
                              {i + 1}
                            </div>
                            <span
                              className={cn(
                                'text-[9px] font-black uppercase tracking-widest',
                                isDarkMode ? 'text-white/30' : 'text-zinc-400'
                              )}
                            >
                              Style #{i + 1}
                            </span>
                          </div>
                          <h4
                            className={cn(
                              'font-display italic text-xl mb-3',
                              isDarkMode ? 'text-white' : 'text-zinc-900'
                            )}
                          >
                            {s.name}
                          </h4>
                          <p
                            className={cn(
                              'text-sm leading-relaxed',
                              isDarkMode ? 'text-white/55' : 'text-zinc-500'
                            )}
                          >
                            {s.why}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ROUTINE — 2-COL grid (was vertical timeline) ── */}
              {result.careRoutine && result.careRoutine.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <span
                        className={cn(
                          'text-[10px] font-black uppercase tracking-[.3em] block',
                          isDarkMode ? 'text-white/40' : 'text-zinc-500'
                        )}
                      >
                        Built for you
                      </span>
                      <h3
                        className={cn(
                          'text-2xl font-display italic mt-1',
                          isDarkMode ? 'text-white' : 'text-zinc-900'
                        )}
                      >
                        Your daily routine
                      </h3>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {result.careRoutine.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        className={cn(
                          'relative rounded-2xl border p-5 flex gap-4',
                          isDarkMode
                            ? 'bg-white/[.02] border-white/[.06]'
                            : 'bg-white border-zinc-200 shadow-sm'
                        )}
                      >
                        <div
                          className={cn(
                            'w-11 h-11 rounded-2xl flex items-center justify-center font-display italic text-lg flex-shrink-0',
                            isDarkMode
                              ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300'
                              : 'bg-gradient-to-br from-pink-100 to-purple-100 border border-pink-200 text-pink-600'
                          )}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className={cn(
                              'font-bold text-sm mb-1',
                              isDarkMode ? 'text-white' : 'text-zinc-900'
                            )}
                          >
                            {item.title}
                          </h4>
                          <p
                            className={cn(
                              'text-xs leading-relaxed',
                              isDarkMode ? 'text-white/60' : 'text-zinc-600'
                            )}
                          >
                            {item.detail}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CARE PILLARS strip (4 horizontal compact cards) ── */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CARE_PILLARS.map((p, i) => (
                  <motion.div
                    key={p.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      'rounded-xl border p-4 flex items-center gap-3',
                      isDarkMode
                        ? 'bg-white/[.02] border-white/[.06]'
                        : 'bg-white border-zinc-200 shadow-sm'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        isDarkMode
                          ? 'bg-pink-500/10 border border-pink-500/20'
                          : 'bg-pink-50 border border-pink-100'
                      )}
                    >
                      <p.icon className="w-5 h-5 text-pink-500" />
                    </div>
                    <div className="min-w-0">
                      <h4
                        className={cn(
                          'text-[10px] uppercase tracking-widest font-black',
                          isDarkMode ? 'text-white/80' : 'text-zinc-700'
                        )}
                      >
                        {p.label}
                      </h4>
                      <p
                        className={cn(
                          'text-xs leading-tight mt-0.5 truncate',
                          isDarkMode ? 'text-white/40' : 'text-zinc-500'
                        )}
                      >
                        {p.detail}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* ════════════ EDU GUIDE — collapsed when results exist ════════════ */}
          <section className="pt-6">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span
                className={cn(
                  'text-[10px] font-black uppercase tracking-[.3em]',
                  isDarkMode ? 'text-white/40' : 'text-zinc-500'
                )}
              >
                Knowledge Base
              </span>
              <div className={cn('flex-1 h-px', isDarkMode ? 'bg-white/[.08]' : 'bg-zinc-200')} />
            </div>

            {/* hair types horizontal scroll */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {HAIR_TYPE_GUIDE.map((h, i) => {
                const isMine = result?.hairType === h.type;
                return (
                  <motion.div
                    key={h.type}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      'relative rounded-xl border p-4 transition-all',
                      isMine
                        ? isDarkMode
                          ? 'bg-purple-500/[.06] border-purple-500/40 ring-1 ring-purple-500/30'
                          : 'bg-purple-50 border-purple-300 ring-1 ring-purple-200'
                        : isDarkMode
                          ? 'bg-white/[.02] border-white/[.06]'
                          : 'bg-white border-zinc-200 shadow-sm'
                    )}
                  >
                    {isMine && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-[8px] font-black text-purple-400 tracking-[.2em] uppercase">
                        Yours
                      </span>
                    )}
                    <h.icon className={cn('w-5 h-5 mb-2', h.color)} />
                    <h3
                      className={cn(
                        'font-display italic text-base mb-1',
                        isDarkMode ? 'text-white' : 'text-zinc-900'
                      )}
                    >
                      {h.type}
                    </h3>
                    <p
                      className={cn(
                        'text-[11px] leading-snug',
                        isDarkMode ? 'text-white/50' : 'text-zinc-500'
                      )}
                    >
                      {h.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* FAQ */}
            <div className="space-y-2 max-w-3xl">
              {FAQ.map((item, i) => {
                const open = openFaq === i;
                return (
                  <button
                    key={i}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className={cn(
                      'w-full text-left rounded-xl border p-4 transition-all',
                      isDarkMode
                        ? 'bg-white/[.02] border-white/[.06] hover:bg-white/[.04]'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm'
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span
                        className={cn(
                          'text-sm font-bold',
                          isDarkMode ? 'text-white' : 'text-zinc-900'
                        )}
                      >
                        {item.q}
                      </span>
                      <ChevronRight
                        className={cn(
                          'w-4 h-4 transition-transform flex-shrink-0',
                          open && 'rotate-90',
                          isDarkMode ? 'text-white/30' : 'text-zinc-400'
                        )}
                      />
                    </div>
                    <AnimatePresence>
                      {open && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className={cn(
                            'text-sm leading-relaxed pt-3 mt-3 border-t overflow-hidden',
                            isDarkMode
                              ? 'text-white/60 border-white/[.06]'
                              : 'text-zinc-600 border-zinc-100'
                          )}
                        >
                          {item.a}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Floating action bar */}
        {result && !isAnalyzing && (
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
                    ? 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
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
