import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sun, Dumbbell, Droplets, Moon, Scissors, Star, Layers } from 'lucide-react';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeProvider';

export default function BlogLooksmaxRoutinePage() {
  const { isDarkMode } = useTheme();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const pillars = [
    {
      icon: Dumbbell,
      color: 'indigo',
      label: 'Foundation',
      title: 'Body Composition',
      desc: 'The single highest-ROI looksmaxxing action. Body fat percentage directly affects face fat, cheekbone visibility, jaw definition, and neck thickness. Get to 12–15% BF (male), 20–24% (female) before optimizing anything else. Lifting also increases testosterone and broadens the shoulder-to-waist ratio — the genetic lottery of perceived attractiveness.',
      actions: ['Compound lifting 3–4x per week (bench, squat, deadlift, overhead press)', 'Caloric deficit of 300–500kcal if cutting', 'Protein at 2g per kg bodyweight minimum', 'Track progress — body fat scan or weekly photos in same lighting'],
    },
    {
      icon: Sun,
      color: 'amber',
      label: 'Skin',
      title: 'Skincare Routine',
      desc: 'Clear, even-toned skin is one of the strongest signals of health and youth. A basic consistent routine beats an expensive complicated one. Most people\'s skin problems are caused by skipping SPF and using harsh cleansers.',
      actions: ['AM — gentle cleanser, Vitamin C serum (L-ascorbic acid 10–20%), SPF 50+ (non-negotiable)', 'PM — gentle cleanser, retinol or retinoid (start 0.025%, build up), moisturiser', 'Weekly — exfoliant (AHA/BHA, not physical scrubs)', 'Get an AI skin analysis to see your specific acne/texture/oiliness baseline'],
    },
    {
      icon: Scissors,
      color: 'sky',
      label: 'Grooming',
      title: 'Hair & Facial Hair',
      desc: 'Hairstyle is the fastest visible change you can make. The right cut frames your face shape and creates volume where you need it. Facial hair can sharpen a weak jawline or balance a long face.',
      actions: ['Get a face shape analysis to know what haircut actually suits you', 'Hair — wash 2–3x per week max, use heat protectant, trim every 6 weeks', 'Eyebrows — clean up strays, don\'t over-pluck. Thick groomed brows are masculine and attractive', 'Beard — if you\'re growing one, commit for 90 days before judging. Shape the neckbeard from day one'],
    },
    {
      icon: Droplets,
      color: 'cyan',
      label: 'Hydration',
      title: 'Sleep, Water & Stress',
      desc: 'These affect your face more than any product. Poor sleep causes cortisol spikes which break down collagen and cause dark circles, puffiness, and dull skin. Dehydration makes skin look older and eyes look smaller.',
      actions: ['8+ hours sleep per night — non-negotiable for testosterone and skin repair', '3L+ water per day. More if you train or sweat', 'Reduce alcohol — it bloats the face, causes redness, and accelerates aging', 'Cold showers or face icing in the morning to reduce puffiness'],
    },
    {
      icon: Layers,
      color: 'violet',
      label: 'Structure',
      title: 'Jaw & Oral Posture',
      desc: 'Mewing, chewing, and jaw training target the structural definition of your lower face. These improvements come slowly but compound over time. Combine with good posture for maximum effect.',
      actions: ['Practice correct mewing posture (full tongue on palate, lips sealed)', 'Use mastic gum or a Jawzrsize to grow masseter muscle symmetrically', 'Fix forward head posture — stretch hip flexors, strengthen neck and upper back', 'Take regular AI face scans to track jaw definition improvement over time'],
    },
    {
      icon: Moon,
      color: 'rose',
      label: 'Advanced',
      title: 'Styling & Aesthetics',
      desc: 'Once your foundation is solid, clothing fit and style amplifies everything. Well-fitting clothes that match your body type can increase perceived attractiveness significantly — for zero cost if you already own the clothes.',
      actions: ['Wear clothes that fit — no baggy shoulders, no too-short sleeves', 'V-necks and open collars elongate the neck and show the jaw', 'Wear darker colors on bottom, lighter on top to appear taller', 'Fragrance — a good scent adds to first impressions. Start with one quality cologne'],
    },
  ];


  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
      <SEO
        title="Looksmaxxing Routine for Beginners — The Complete 2026 Guide | VisageX"
        description="The beginner's guide to looksmaxxing. Build a routine that actually works: body composition, skincare, grooming, jaw training, and sleep. No gimmicks, just compounding habits."
        canonical="https://visagex.online/blog/looksmaxxing-routine-for-beginners"
      />

      <article className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-16"
        >
          {/* Header */}
          <header className="text-center max-w-3xl mx-auto space-y-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${isDarkMode ? 'border-rose-500/30 text-rose-400 bg-rose-500/10' : 'border-rose-200 text-rose-600 bg-rose-50'}`}>
              <Star className="w-4 h-4" />
              Looksmaxxing
            </div>
            <h1 className={`text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Looksmaxxing Routine
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">
                For Beginners
              </span>
            </h1>
            <p className={`text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              No surgery, no gimmicks, no pseudoscience. Just 6 compounding pillars that actually move the needle on how you look — and more importantly, how you present yourself.
            </p>
            <div className={`inline-flex items-center gap-2 text-xs font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span>10 min read</span><span>·</span><span>Updated March 2026</span>
            </div>
          </header>

          {/* Intro */}
          <div className={`p-8 md:p-12 rounded-[3rem] border ${isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white border-zinc-200'}`}>
            <h2 className={`text-2xl font-display font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>What is Looksmaxxing?</h2>
            <div className={`space-y-4 text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <p>
                Looksmaxxing is the systematic optimization of your physical appearance using science-backed, non-surgical methods. It's not about vanity — it's about understanding that looks affect how the world treats you, and using that knowledge to your advantage.
              </p>
              <p>
                The core thesis: <strong className={isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}>most people are operating at 60–70% of their genetic potential.</strong> The gap is closed not with surgery, but with sleep, training, skincare, and grooming done consistently.
              </p>
              <p>
                Before building a routine, <Link to="/" className="text-rose-500 font-bold hover:underline">get a free AI face analysis</Link> to understand your current baseline — which specific features are strong, which need work, and what your improvement potential score is.
              </p>
            </div>
          </div>

          {/* 6 Pillars */}
          <div className="space-y-8">
            <h2 className={`text-3xl md:text-4xl font-display font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              The 6 Pillars — In Priority Order
            </h2>
            <p className={`text-base ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Most beginners make the mistake of starting with skincare or haircuts while ignoring body composition and sleep. Fix these in order.
            </p>
            <div className="space-y-6">
              {pillars.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-8 md:p-10 rounded-[2.5rem] border ${isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-lg'}`}
                  >
                    <div className="flex items-start gap-6">
                      <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center bg-${p.color}-500/20 text-${p.color}-400`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? `text-${p.color}-400` : `text-${p.color}-600`}`}>{p.label}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-zinc-300'}`}>Pillar {i + 1}</span>
                        </div>
                        <h3 className={`text-2xl font-display font-bold mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{p.title}</h3>
                        <p className={`mb-6 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{p.desc}</p>
                        <div className="space-y-2">
                          {p.actions.map((action, j) => (
                            <div key={j} className="flex items-start gap-3">
                              <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-${p.color}-400`} />
                              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{action}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 30 day plan */}
          <div className={`p-10 md:p-14 rounded-[3rem] border ${isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white border-zinc-200'}`}>
            <h2 className={`text-3xl md:text-4xl font-display mb-8 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Your First 30 Days</h2>
            <div className="space-y-6">
              {[
                { period: 'Week 1', title: 'Baseline & Habits', tasks: ['Get your AI face analysis baseline score', 'Start basic AM/PM skincare (cleanser + SPF only, no more)', 'Fix your sleep schedule — bed at same time every night', 'Take weekly progress photos in same conditions'] },
                { period: 'Week 2', title: 'Training & Nutrition', tasks: ['Start a 3x/week lifting program (Starting Strength, GZCLP, or 5/3/1)', 'Track your calories for 1 week to understand your baseline intake', 'Hit 2g protein per kg bodyweight', 'Add hydration — minimum 3L water per day'] },
                { period: 'Week 3', title: 'Grooming & Style', tasks: ['Get a haircut at a good barber — show them your face shape', 'Audit your wardrobe — identify 3 items that don\'t fit well and remove them', 'Start mewing — build the habit with hourly reminders', 'Add retinol to your PM skincare (low dose: 0.025%)'] },
                { period: 'Week 4', title: 'Review & Optimize', tasks: ['Compare week 4 photos to week 1. Note visible changes', 'Get a second AI face analysis scan to measure objective change', 'Identify your biggest bottleneck from the 6 pillars', 'Set 90-day goals based on your weakest pillar'] },
              ].map((week, i) => (
                <div key={i} className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>{week.period}</span>
                    <h3 className={`font-bold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{week.title}</h3>
                  </div>
                  <div className="space-y-2">
                    {week.tasks.map((task, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${isDarkMode ? 'border-white/20' : 'border-zinc-300'}`} />
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{task}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden group ${isDarkMode ? 'bg-gradient-to-b from-rose-900/40 to-black border border-rose-500/20' : 'bg-rose-50 border border-rose-100'}`}
          >
            <div className={`absolute inset-0 opacity-40 group-hover:opacity-80 transition-opacity duration-700 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent' : ''}`} />
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className={`text-4xl md:text-5xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Start with your baseline score
              </h2>
              <p className={`text-lg font-light ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                You can't track a glow-up without data. Get your free AI face analysis — 468-point geometry, skin assessment, and a personalized improvement roadmap.
              </p>
              <Link
                to="/"
                className={`inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-2xl hover:scale-105 duration-300 ${isDarkMode ? 'bg-white text-black hover:bg-rose-400 hover:text-white' : 'bg-zinc-900 text-white hover:bg-black'}`}
              >
                Get My Free Score <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </article>
    </div>
  );
}
