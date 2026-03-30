import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Shield,
  Zap,
  Target,
  BarChart3,
  Users,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Brain,
  Eye,
  Activity
} from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';

// Refined Color Palette:
// Primary: Cyan-400 (#22d3ee)
// Secondary: Indigo-500 (#6366f1)
// Accent: Emerald-400 (#34d399)

export function Hero({ isDarkMode, onNavigateMethodology }: { isDarkMode: boolean; onNavigateMethodology: (e?: React.MouseEvent) => void }) {
  const scrollToAnalyzer = () => {
    const element = document.getElementById('analyzer-section');
    if (element) {
      if ((window as any).lenis) {
        (window as any).lenis.scrollTo(element, {
          offset: -80, // Offset for the fixed header
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      } else {
        const y = element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <section className={`relative min-h-screen flex items-center pt-20 overflow-hidden transition-colors duration-700 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center -mt-16 lg:-mt-24">
          {/* Left Side: Creative Typography & CTA */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className={`h-[1px] w-12 ${isDarkMode ? 'bg-white/20' : 'bg-black/10'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>
                  Advanced Facial Analysis
                </span>
              </div>

              <h1 className={`text-5xl md:text-7xl lg:text-[110px] font-sans leading-[1.0] tracking-tight mb-4 md:mb-6 pb-2 md:pb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                <span className="block">AI rates</span>
                <span className="block ml-6 md:ml-12 lg:ml-24 font-display italic">your face</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">from 1–10</span>
              </h1>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12 ml-6 md:ml-12 lg:ml-24">
                <p className={`text-lg max-w-xs font-light leading-relaxed ${isDarkMode ? 'text-zinc-100/50' : 'text-zinc-900/70'}`}>
                  Free AI face analysis. Our neural networks decode 468 facial landmarks to reveal your unique structural profile and skin health insights.
                </p>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={scrollToAnalyzer}
                    className={`px-10 py-5 rounded-full font-bold uppercase tracking-widest text-xs transition-all duration-500 shadow-xl ${isDarkMode
                        ? 'bg-white text-black hover:bg-indigo-400 hover:text-white shadow-white/5'
                        : 'bg-zinc-900 text-white hover:bg-black shadow-black/10'
                      }`}
                  >
                    Get My Score
                  </button>
                  <button
                    onClick={onNavigateMethodology}
                    className={`px-10 py-5 rounded-full font-bold uppercase tracking-widest text-xs border transition-all duration-500 ${isDarkMode
                        ? 'border-white/10 text-white hover:bg-white/5'
                        : 'border-zinc-200 text-zinc-900 hover:bg-zinc-900/5'
                      }`}
                  >
                    Our Process
                  </button>
                  <div className={`mt-2 flex items-center gap-2 opacity-40 text-[9px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    <Users className="w-3 h-3" />
                    Over 50,000 scans completed
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Asymmetrical Visual */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[4/5] w-full max-w-md mx-auto"
            >
              {/* Main Image Container */}
              <div className={`absolute inset-0 rounded-[3rem] overflow-hidden border ${isDarkMode ? 'border-white/10' : 'border-zinc-200 shadow-2xl'}`}>
                <img
                  src="/chico.jpg"
                  alt="AI scanning male jawline and facial symmetry results"
                  className="w-full h-full object-cover opacity-90 transition-opacity duration-700 hover:opacity-100"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                {/* Scanning Line — CSS animation for GPU perf */}
                <div
                  className="absolute left-0 right-0 h-[2px] bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-20 pointer-events-none"
                  style={{
                    animation: 'scanLine 4s linear infinite',
                    willChange: 'top',
                  }}
                />

                {/* Technical Grid Overlay */}
                <div className={`absolute inset-0 opacity-10 pointer-events-none ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}
                  style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                />
              </div>

              {/* Floating Data Elements — CSS animation instead of Framer Motion for perf */}
              <div
                className={`absolute -top-4 -right-4 md:-top-10 md:-right-10 p-4 md:p-6 rounded-2xl md:rounded-3xl border md:backdrop-blur-md ${isDarkMode ? 'bg-zinc-900/90 md:bg-white/5 border-white/10' : 'bg-white md:bg-white/80 border-black/5 shadow-xl'} scale-75 md:scale-100 origin-top-right`}
                style={{ animation: 'floatUp 4s ease-in-out infinite', willChange: 'transform' }}
              >
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Symmetry</p>
                <p className={`text-2xl md:text-3xl font-display ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>98.2%</p>
              </div>

              <div
                className={`absolute -bottom-4 -left-4 md:-bottom-10 md:-left-10 p-4 md:p-6 rounded-2xl md:rounded-3xl border md:backdrop-blur-md ${isDarkMode ? 'bg-zinc-900/90 md:bg-white/5 border-white/10' : 'bg-white md:bg-white/80 border-black/5 shadow-xl'} scale-75 md:scale-100 origin-bottom-left`}
                style={{ animation: 'floatDown 5s ease-in-out 1s infinite', willChange: 'transform' }}
              >
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Health Index</p>
                <p className={`text-2xl md:text-3xl font-display ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>Optimal</p>
              </div>
            </motion.div>
          </div>
        </div>


      </div>

      {/* Background Decorative Text */}
      <div className={`absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-[0.03] select-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
        <p className="text-[20vw] font-display whitespace-nowrap leading-none -mb-4 md:-mb-8">
          AESTHETIC INTELLIGENCE • AESTHETIC INTELLIGENCE
        </p>
      </div>
    </section>
  );
}

export function ExampleResult({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <section className={`py-32 transition-colors duration-500 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className={`p-8 md:p-12 rounded-[2.5rem] border transition-all duration-500 ${isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-2xl'}`}>
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

                {/* Overall Score Overlay */}
                <div className={`absolute bottom-6 left-6 right-6 p-6 rounded-2xl backdrop-blur-xl border ${isDarkMode ? 'bg-black/60 border-white/10' : 'bg-white/80 border-black/5 shadow-xl'}`}>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Overall Score</p>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-5xl font-display ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>8.7</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white/20' : 'text-zinc-400'}`}>/ 10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Metrics Grid */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Symmetry', value: '9.3' },
                  { label: 'Skin Quality', value: '8.6' },
                  { label: 'Jawline', value: '9.4' },
                  { label: 'Canthal Tilt', value: '+6.2°' }
                ].map((metric, i) => (
                  <div
                    key={i}
                    className={`p-6 rounded-2xl border transition-all duration-300 ${isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'}`}
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>{metric.label}</p>
                    <p className={`text-3xl font-display ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Improvements Card */}
              <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                <h4 className={`text-sm font-bold uppercase tracking-[0.2em] mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Top Improvements</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className={`px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold`}>+0.4</div>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Targeted masseter hypertrophy protocols to further enhance mandibular angularity and bispinous width.</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={`px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold`}>+0.3</div>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Incorporate 0.025% Tretinoin nightly to refine sub-surface skin micro-texture and promote collagen.</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={`px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold`}>+0.2</div>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Maintain sub-12% body fat to preserve hollow cheekbone (zygomatic) definition and minimize buccal fat.</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={`px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold`}>+0.1</div>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Apply a peptide and caffeine serum to tighten the periocular (under-eye) area and reduce venous pooling.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Features({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <section className={`py-32 transition-colors duration-500 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Small Card: Neural Feedback (Top Left) */}
          <div className={`p-10 rounded-[2.5rem] border flex flex-col justify-between transition-all duration-500 ${isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-xl'}`}>
            <Eye className={`w-12 h-12 mb-12 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} />
            <div>
              <h3 className={`text-3xl font-display leading-tight mb-4 italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Neural Feedback</h3>
              <p className={`text-sm font-light leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Instant insights into facial symmetry and skin health markers.
              </p>
            </div>
          </div>

          {/* Large Card: Privacy (Top Right, 2 cols) */}
          <div className={`md:col-span-2 p-10 rounded-[2.5rem] border relative overflow-hidden group transition-all duration-500 ${isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-xl'}`}>
            <div className="relative z-10 max-w-md">
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 block ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Privacy First</span>
              <h3 className={`text-5xl font-display leading-[0.9] mb-8 italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Bank-level security.</h3>
              <p className={`text-lg font-light leading-relaxed mb-8 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Your biometric data is processed securely. We never sell your photos or data to third parties, ensuring absolute privacy.
              </p>
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 ${isDarkMode ? 'bg-zinc-800 border-black' : 'bg-zinc-200 border-white'}`} />
                ))}
                <div className={`px-4 flex items-center text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Trusted by 100k+ users</div>
              </div>
            </div>
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity duration-700`}>
              <Eye className="w-64 h-64" />
            </div>
          </div>

          {/* Small Card: Precision Mapping (Bottom Left) */}
          <div className={`p-10 rounded-[2.5rem] border flex flex-col justify-between transition-all duration-500 ${isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-xl'}`}>
            <Eye className={`w-12 h-12 mb-12 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} />
            <div>
              <h3 className={`text-3xl font-display leading-tight mb-4 italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Precision Mapping</h3>
              <p className={`text-sm font-light leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                468 landmarks for advanced AI facial analysis.
              </p>
            </div>
          </div>

          {/* Medium Card: Clinical Metrics (Bottom Right, 2 cols) */}
          <div className={`md:col-span-2 p-10 rounded-[2.5rem] border relative overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-xl'}`}>
            <div className="relative z-10">
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 block ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Research Backed</span>
              <h3 className={`text-5xl font-display leading-[0.9] mb-8 italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Advanced AI metrics.</h3>
              <p className={`text-lg font-light leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} max-w-xl`}>
                Our algorithms are trained on diverse datasets to ensure accuracy across all skin types and facial structures.
              </p>
            </div>
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full flex items-center justify-center opacity-5 pointer-events-none`}>
              <Activity className="w-64 h-64" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Testimonials({ isDarkMode }: { isDarkMode: boolean }) {
  const testimonials = [
    {
      quote: "Visage AI completely changed how I approach my skincare and grooming. The personalized routine is incredibly accurate.",
      author: "Michael T.",
      role: "Verified User"
    },
    {
      quote: "As an aesthetician, I'm impressed by the precision of the facial mapping. It's a great tool for understanding facial harmony.",
      author: "Dr. Sarah Jenkins",
      role: "Aesthetician"
    }
  ];

  return (
    <section className={`py-32 border-t transition-colors duration-500 ${isDarkMode ? 'border-white/5 bg-black' : 'border-zinc-200 bg-zinc-50'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              className="relative"
            >
              <p className={`text-4xl md:text-5xl font-display leading-tight mb-10 ${isDarkMode ? 'text-zinc-100/90' : 'text-zinc-900'}`}>
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-[1px] ${isDarkMode ? 'bg-white/20' : 'bg-zinc-900/10'}`} />
                <div>
                  <p className={`font-bold text-sm uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{t.author}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isDarkMode ? 'text-zinc-100/30' : 'text-zinc-500'}`}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer({ isDarkMode, onNavigatePrivacy, onNavigateTerms }: { isDarkMode: boolean, onNavigatePrivacy?: () => void, onNavigateTerms?: () => void }) {
  return (
    <footer className={`py-24 border-t transition-colors duration-500 ${isDarkMode ? 'border-white/5 bg-black' : 'border-zinc-200 bg-zinc-50'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="VisageX Logo" className="w-full h-full object-cover" />
            </div>
            <span className={`font-display font-bold text-2xl tracking-tighter ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
              VISAGE<span className={isDarkMode ? 'text-white/20' : 'text-zinc-900/10'}>X</span>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Legal</h4>
              <ul className={`space-y-4 text-sm font-light flex flex-col ${isDarkMode ? 'text-zinc-100/30' : 'text-zinc-500'}`}>
                <li><Link to="/privacy" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Privacy Policy</Link></li>
                <li><Link to="/terms" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Product</h4>
              <ul className={`space-y-4 text-sm font-light flex flex-col ${isDarkMode ? 'text-zinc-100/30' : 'text-zinc-500'}`}>
                <Link to="/methodology" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Methodology</Link>
                <Link to="/" className={`transition-colors duration-300 ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>Neural Scan</Link>
              </ul>
            </div>
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Resources</h4>
              <ul className={`space-y-4 text-sm font-light flex flex-col ${isDarkMode ? 'text-zinc-100/30' : 'text-zinc-500'}`}>
                <li><Link to="/blog" className={`text-sm font-bold ${isDarkMode ? 'text-zinc-200 hover:text-white' : 'text-zinc-700 hover:text-black'}`}>All Articles (The Hub)</Link></li>
                <li><Link to="/blog/how-to-improve-face-symmetry" className={`text-sm ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Symmetry Guide</Link></li>
                <li><Link to="/blog/ai-face-analysis-explained" className={`text-sm ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>How the AI Works</Link></li>
                <li><Link to="/blog/best-ai-face-analysis-tool" className={`text-sm ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Best Tools Ranked</Link></li>
                <li><Link to="/blog/what-is-canthal-tilt" className={`text-sm ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Canthal Tilt Geometry</Link></li>
                <li><Link to="/blog/how-to-fix-recessed-jawline" className={`text-sm ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Fixing a Weak Jaw</Link></li>
                <li><Link to="/blog/does-gua-sha-work" className={`text-sm ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Gua Sha Facts</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className={`mt-24 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6 ${isDarkMode ? 'border-white/5' : 'border-zinc-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isDarkMode ? 'text-white/20' : 'text-zinc-500'}`}>
            © 2026 VISAGEX NEURAL SYSTEMS. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8">
            <a href="https://twitter.com/visagex" target="_blank" rel="noopener noreferrer" className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-300 ${isDarkMode ? 'text-white/20 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Twitter</a>
            <a href="https://instagram.com/visagex" target="_blank" rel="noopener noreferrer" className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-300 ${isDarkMode ? 'text-white/20 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
