import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Shield,
  Zap,
  Eye,
  Activity,
  Users,
  Sparkles,
  ArrowRight,
  Brain,
  Star,
  Lock,
  BarChart3
} from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';

/* ─── Hero ─────────────────────────────────────────────────────────────────── */
export function Hero({ isDarkMode, onNavigateMethodology }: { isDarkMode: boolean; onNavigateMethodology: (e?: React.MouseEvent) => void }) {
  const scrollToAnalyzer = () => {
    const element = document.getElementById('analyzer-section');
    if (element) {
      if ((window as any).lenis) {
        (window as any).lenis.scrollTo(element, { offset: -80, duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      } else {
        const y = element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      className="relative min-h-screen flex items-center pt-20 overflow-hidden transition-colors duration-700"
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse 100% 80% at 20% -10%, rgba(99,102,241,0.18) 0%, transparent 55%), radial-gradient(ellipse 70% 60% at 80% 110%, rgba(124,58,237,0.14) 0%, transparent 50%), #050508'
          : 'radial-gradient(ellipse 100% 80% at 20% -10%, rgba(99,102,241,0.1) 0%, transparent 55%), radial-gradient(ellipse 70% 60% at 80% 110%, rgba(124,58,237,0.08) 0%, transparent 50%), #f8f8fc',
      }}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center -mt-16 lg:-mt-24">

          {/* Left: Typography + CTA */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Badge pill */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7 }}
                className="flex items-center gap-4 mb-8"
              >
                <div
                  className={`badge-glow ${isDarkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}
                >
                  <Sparkles className="w-3 h-3" />
                  Powered by Gemini AI · 468 Landmarks
                </div>
              </motion.div>

              {/* H1 */}
              <h1 className={`text-5xl md:text-7xl lg:text-[108px] font-sans leading-[1.0] tracking-tight mb-6 pb-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                <span className="block">AI rates</span>
                <span
                  className="block ml-6 md:ml-12 lg:ml-24 font-display italic"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  your face
                </span>
                <span className={`block ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>from 1–10</span>
              </h1>

              {/* Subtext + CTAs */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12 ml-6 md:ml-12 lg:ml-24">
                <p className={`text-lg max-w-xs font-light leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Free AI face analysis. Our neural networks decode 468 facial landmarks to reveal your unique structural profile and skin health insights.
                </p>
                <div className="flex flex-col gap-4">
                  <button onClick={scrollToAnalyzer} className="btn-primary animate-glow-pulse">
                    Get My Score
                  </button>
                  <button
                    onClick={onNavigateMethodology}
                    className={isDarkMode ? 'btn-ghost-dark' : 'btn-ghost-light'}
                  >
                    Our Process
                  </button>
                  <div className={`mt-1 flex items-center gap-2 opacity-50 text-[9px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-white' : 'text-zinc-700'}`}>
                    <Users className="w-3 h-3" />
                    Over 50,000 scans completed
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Image with chromatic frame */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: 4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[4/5] w-full max-w-md mx-auto"
            >
              {/* Glow behind image */}
              <div
                className="absolute inset-0 rounded-[3rem] blur-2xl opacity-40 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(34,211,238,0.3))' }}
              />

              {/* Chromatic border frame */}
              <div
                className="absolute -inset-[2px] rounded-[3rem] pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.6), rgba(124,58,237,0.4), rgba(34,211,238,0.5))', zIndex: 1 }}
              />

              {/* Main Image */}
              <div className="absolute inset-0 rounded-[3rem] overflow-hidden" style={{ zIndex: 2 }}>
                <img
                  src="/chico.jpg"
                  alt="AI scanning male jawline and facial symmetry results"
                  className="w-full h-full object-cover opacity-90 transition-opacity duration-700 hover:opacity-100"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                {/* Scanning line */}
                <div
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.8)] z-20 pointer-events-none"
                  style={{ animation: 'scanLine 4s linear infinite', willChange: 'top' }}
                />

                {/* Grid overlay */}
                <div
                  className="absolute inset-0 opacity-[0.07] pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,1) 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                />
              </div>

              {/* Floating stat: Symmetry */}
              <div
                className={`absolute -top-4 -right-4 md:-top-10 md:-right-10 p-4 md:p-5 rounded-2xl md:rounded-3xl border backdrop-blur-md scale-75 md:scale-100 origin-top-right ${isDarkMode ? 'bg-zinc-900/90 border-white/10' : 'bg-white/95 border-indigo-200/60 shadow-xl shadow-indigo-500/10'}`}
                style={{ animation: 'floatUp 4s ease-in-out infinite', willChange: 'transform', zIndex: 10 }}
              >
                <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Symmetry</p>
                <p
                  className="text-2xl md:text-3xl font-display font-black"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  98.2%
                </p>
              </div>

              {/* Floating stat: Health */}
              <div
                className={`absolute -bottom-4 -left-4 md:-bottom-10 md:-left-10 p-4 md:p-5 rounded-2xl md:rounded-3xl border backdrop-blur-md scale-75 md:scale-100 origin-bottom-left ${isDarkMode ? 'bg-zinc-900/90 border-white/10' : 'bg-white/95 border-indigo-200/60 shadow-xl shadow-indigo-500/10'}`}
                style={{ animation: 'floatDown 5s ease-in-out 1s infinite', willChange: 'transform', zIndex: 10 }}
              >
                <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Health Index</p>
                <p
                  className="text-2xl md:text-3xl font-display font-black"
                  style={{ background: 'linear-gradient(135deg, #22d3ee, #34d399)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  Optimal
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Background watermark text */}
      <div className={`absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-[0.03] select-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
        <p className="text-[20vw] font-display whitespace-nowrap leading-none -mb-4 md:-mb-8">
          AESTHETIC INTELLIGENCE • AESTHETIC INTELLIGENCE
        </p>
      </div>
    </section>
  );
}

/* ─── Example Result ────────────────────────────────────────────────────────── */
export function ExampleResult({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <section
      className="py-32 transition-colors duration-500"
      style={{
        background: isDarkMode ? '#050508' : '#f8f8fc',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="section-divider mb-16" />
        <div
          className={`p-8 md:p-12 rounded-[2.5rem] border transition-all duration-500 ${
            isDarkMode
              ? 'bg-white/[0.03] border-white/[0.07]'
              : 'bg-white border-indigo-100 shadow-2xl shadow-indigo-500/5'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Scan Preview */}
            <div className="lg:col-span-5">
              <div className="relative">
                <BeforeAfterSlider
                  beforeImage="/left.png"
                  afterImage="/right.png"
                  beforeImagePosition="50% center"
                  afterImagePosition="66% center"
                  className="rounded-3xl shadow-2xl"
                />
                {/* Score overlay */}
                <div className={`absolute bottom-6 left-6 right-6 p-6 rounded-2xl backdrop-blur-xl border ${isDarkMode ? 'bg-black/60 border-white/10' : 'bg-white/85 border-indigo-100 shadow-xl'}`}>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Overall Score</p>
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-5xl font-display font-black"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                        >
                          8.7
                        </span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white/20' : 'text-zinc-400'}`}>/ 10</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Metrics */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Symmetry',     value: '9.3', color: '#6366f1', glow: 'rgba(99,102,241,0.2)' },
                  { label: 'Skin Quality', value: '8.6', color: '#22d3ee', glow: 'rgba(34,211,238,0.2)' },
                  { label: 'Jawline',      value: '9.4', color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)' },
                  { label: 'Canthal Tilt', value: '+6.2°', color: '#34d399', glow: 'rgba(52,211,153,0.2)' },
                ].map((metric, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className={`p-6 rounded-2xl border hover-glow-card transition-all duration-300 ${isDarkMode ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-zinc-50/80 border-zinc-200'}`}
                    style={{ boxShadow: `inset 0 0 30px ${metric.glow}` }}
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>{metric.label}</p>
                    <p className="text-3xl font-display font-black" style={{ color: metric.color }}>{metric.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Improvements */}
              <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-gradient-to-br from-indigo-50/60 to-violet-50/40 border-indigo-100'}`}>
                <h4 className={`text-sm font-bold uppercase tracking-[0.2em] mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Top Improvements</h4>
                <div className="space-y-4">
                  {[
                    { gain: '+0.4', text: 'Targeted masseter hypertrophy protocols to further enhance mandibular angularity and bispinous width.' },
                    { gain: '+0.3', text: 'Incorporate 0.025% Tretinoin nightly to refine sub-surface skin micro-texture and promote collagen.' },
                    { gain: '+0.2', text: 'Maintain sub-12% body fat to preserve hollow cheekbone (zygomatic) definition and minimize buccal fat.' },
                    { gain: '+0.1', text: 'Apply a peptide and caffeine serum to tighten the periocular area and reduce venous pooling.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black flex-shrink-0">{item.gain}</div>
                      <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ──────────────────────────────────────────────────────────────── */
export function Features({ isDarkMode }: { isDarkMode: boolean }) {
  const bg = isDarkMode ? '#050508' : '#f8f8fc';
  const cardBg = isDarkMode ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-white border-zinc-200/80 shadow-xl shadow-zinc-900/[0.04]';

  return (
    <section className="py-32 transition-colors duration-500" style={{ background: bg }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <p className={`text-[10px] font-bold uppercase tracking-[0.35em] mb-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>
            Why VisageX
          </p>
          <h2 className={`text-4xl md:text-5xl font-display font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            Science meets <span className="font-display italic gradient-text-brand">aesthetics</span>
          </h2>
        </motion.div>

        {/* Stat bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={`mb-8 px-8 py-5 rounded-2xl border flex flex-wrap items-center justify-center gap-8 md:gap-16 text-center ${isDarkMode ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-indigo-50/60 border-indigo-100'}`}
        >
          {[
            { value: '468', label: 'Landmarks', color: '#6366f1' },
            { value: '16',  label: 'Ratios Computed', color: '#22d3ee' },
            { value: '<3s', label: 'Analysis Time', color: '#8b5cf6' },
            { value: '100k+', label: 'Users Trusted', color: '#34d399' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-3xl font-display font-black" style={{ color: s.color }}>{s.value}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/30' : 'text-zinc-500'}`}>{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1: Neural Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0 }}
            className={`p-10 rounded-[2.5rem] border hover-glow-card flex flex-col justify-between ${cardBg}`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-10 ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
              <Brain className="w-7 h-7 text-indigo-500" />
            </div>
            <div>
              <h3 className={`text-3xl font-display leading-tight mb-3 italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Neural Feedback</h3>
              <p className={`text-sm font-light leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Instant AI insights into facial symmetry and skin health markers, powered by 468-point landmark detection.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Privacy (wide) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className={`md:col-span-2 p-10 rounded-[2.5rem] border hover-glow-card relative overflow-hidden group ${cardBg}`}
          >
            <div className="relative z-10 max-w-md">
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Privacy First</span>
              <h3 className={`text-5xl font-display leading-[0.9] mb-6 italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Bank-level security.</h3>
              <p className={`text-lg font-light leading-relaxed mb-8 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Your biometric data is processed securely. We never sell your photos or data to third parties, ensuring absolute privacy.
              </p>
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 ${isDarkMode ? 'bg-indigo-900/60 border-black' : 'bg-indigo-100 border-white'}`} />
                ))}
                <div className={`px-4 flex items-center text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Trusted by 100k+ users</div>
              </div>
            </div>
            {/* Decorative background icon */}
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full flex items-center justify-center opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-700 pointer-events-none`}>
              <Shield className="w-64 h-64 text-indigo-500" />
            </div>
          </motion.div>

          {/* Card 3: Precision (wide) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className={`md:col-span-2 p-10 rounded-[2.5rem] border hover-glow-card relative overflow-hidden ${cardBg}`}
          >
            <div className="relative z-10">
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Research Backed</span>
              <h3 className={`text-5xl font-display leading-[0.9] mb-6 italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Advanced AI metrics.</h3>
              <p className={`text-lg font-light leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} max-w-xl`}>
                Our algorithms are trained on diverse datasets to ensure accuracy across all skin types and facial structures. Backed by peer-reviewed research.
              </p>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full flex items-center justify-center opacity-[0.05] pointer-events-none">
              <Activity className="w-64 h-64 text-cyan-500" />
            </div>
          </motion.div>

          {/* Card 4: Precision Mapping */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className={`p-10 rounded-[2.5rem] border hover-glow-card flex flex-col justify-between ${cardBg}`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-10 ${isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-50'}`}>
              <BarChart3 className="w-7 h-7 text-cyan-500" />
            </div>
            <div>
              <h3 className={`text-3xl font-display leading-tight mb-3 italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Precision Mapping</h3>
              <p className={`text-sm font-light leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                468 landmarks for advanced AI facial analysis with sub-millimetre precision across all feature points.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ──────────────────────────────────────────────────────────── */
export function Testimonials({ isDarkMode }: { isDarkMode: boolean }) {
  const testimonials = [
    {
      quote: "Visage AI completely changed how I approach my skincare and grooming. The personalized routine is incredibly accurate.",
      author: "Michael T.",
      role: "Verified User",
      initials: "MT",
      color: "#6366f1",
    },
    {
      quote: "As an aesthetician, I'm impressed by the precision of the facial mapping. It's a great tool for understanding facial harmony.",
      author: "Dr. Sarah Jenkins",
      role: "Aesthetician",
      initials: "SJ",
      color: "#22d3ee",
    },
  ];

  return (
    <section
      className="py-32 transition-colors duration-500"
      style={{
        background: isDarkMode
          ? 'linear-gradient(180deg, #050508 0%, #0a0a12 100%)'
          : 'linear-gradient(180deg, #f8f8fc 0%, #f0f0fa 100%)',
        borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(99,102,241,0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className={`text-[10px] font-bold uppercase tracking-[0.35em] mb-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>
            Testimonials
          </p>
          <h2 className={`text-4xl md:text-5xl font-display font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            What our users <span className="font-display italic gradient-text-brand">say</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              className={`relative p-10 rounded-[2.5rem] border hover-glow-card ${
                isDarkMode
                  ? 'bg-white/[0.03] border-white/[0.07]'
                  : 'bg-white border-zinc-200 shadow-xl shadow-zinc-900/[0.04]'
              }`}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className={`text-2xl md:text-3xl font-display leading-tight mb-10 ${isDarkMode ? 'text-zinc-100/90' : 'text-zinc-900'}`}>
                "{t.quote}"
              </p>

              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${t.color}, rgba(99,102,241,0.5))` }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className={`font-black text-sm ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{t.author}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.25em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────────────────────── */
export function Footer({ isDarkMode, onNavigatePrivacy, onNavigateTerms }: { isDarkMode: boolean, onNavigatePrivacy?: () => void, onNavigateTerms?: () => void }) {
  return (
    <footer
      className="py-24 transition-colors duration-500"
      style={{
        background: isDarkMode
          ? 'linear-gradient(180deg, #050508 0%, #020204 100%)'
          : 'linear-gradient(180deg, #f0f0fa 0%, #f8f8fc 100%)',
        borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(99,102,241,0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Top: Logo + tagline + links */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/logo.png" alt="VisageX Logo" className="w-full h-full object-contain drop-shadow-lg" />
              </div>
              <span className={`font-display font-extrabold text-2xl tracking-tighter ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                VISAGE<span className="gradient-text-brand">X</span>
              </span>
            </div>
            <p className={`text-sm font-light max-w-[220px] leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
              AI-powered aesthetic intelligence for the modern era.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${isDarkMode ? 'text-indigo-400/70' : 'text-indigo-500'}`}>Legal</h4>
              <ul className={`space-y-4 text-sm font-light flex flex-col ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                <li><Link to="/privacy" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>Privacy Policy</Link></li>
                <li><Link to="/terms" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>Terms of Service</Link></li>
                <li><Link to="/refund" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>Refund Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${isDarkMode ? 'text-indigo-400/70' : 'text-indigo-500'}`}>Product</h4>
              <ul className={`space-y-4 text-sm font-light flex flex-col ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                <li><Link to="/methodology" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>Methodology</Link></li>
                <li><Link to="/" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>Neural Scan</Link></li>
              </ul>
            </div>
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${isDarkMode ? 'text-indigo-400/70' : 'text-indigo-500'}`}>Resources</h4>
              <ul className={`space-y-4 text-sm font-light flex flex-col ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                <li><Link to="/blog" className={`font-bold transition-colors duration-300 ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-700 hover:text-indigo-600'}`}>All Articles (The Hub)</Link></li>
                <li><Link to="/blog/how-to-improve-face-symmetry" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>Symmetry Guide</Link></li>
                <li><Link to="/blog/ai-face-analysis-explained" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>How the AI Works</Link></li>
                <li><Link to="/blog/best-ai-face-analysis-tool" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>Best Tools Ranked</Link></li>
                <li><Link to="/blog/what-is-canthal-tilt" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>Canthal Tilt Geometry</Link></li>
                <li><Link to="/blog/does-gua-sha-work" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>Gua Sha Facts</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="section-divider mb-10" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isDarkMode ? 'text-white/20' : 'text-zinc-400'}`}>
            © 2026 VISAGEX NEURAL SYSTEMS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6">
            <a
              href="https://twitter.com/visagex"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-9 h-9 rounded-full border flex items-center justify-center text-[10px] font-black transition-all duration-300 ${isDarkMode ? 'border-white/10 text-white/30 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10' : 'border-zinc-200 text-zinc-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
              aria-label="Twitter"
            >
              𝕏
            </a>
            <a
              href="https://instagram.com/visagex"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-9 h-9 rounded-full border flex items-center justify-center text-[10px] font-black transition-all duration-300 ${isDarkMode ? 'border-white/10 text-white/30 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10' : 'border-zinc-200 text-zinc-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
              aria-label="Instagram"
            >
              ig
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
