import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Timer, Hand, MoveUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeProvider';

export default function BlogMewingGuidePage() {
  const { isDarkMode } = useTheme();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const Card = ({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) => (
    <div className={`p-8 md:p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-white/[0.07]' : 'bg-white border-zinc-200 shadow-xl hover:shadow-2xl'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 bg-${color}-500/20 text-${color}-400`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className={`text-xl font-display font-bold mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{title}</h3>
      <div className={`space-y-3 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{children}</div>
    </div>
  );

  const steps = [
    {
      n: '01',
      title: 'Full Tongue Contact — Not Just The Tip',
      body: 'The most common mistake. True mewing means your ENTIRE tongue is flat against the palate — not just the tip. Think of it like a suction cup. Raise the back third of your tongue first, then flatten the middle and front.',
    },
    {
      n: '02',
      title: 'Lips Sealed, Teeth Gently Touching',
      body: 'Your mouth should be closed with lips together (not pressed hard) and back molars in light contact. Your front teeth should not be clenching. This is nasal breathing resting position.',
    },
    {
      n: '03',
      title: 'Chin Tucked, Head Upright',
      body: 'Forward head posture cancels out any mewing benefit. Pull your chin slightly back and up (like you\'re making a double chin) to align your cervical spine. This creates the "vertical" facial growth vector.',
    },
    {
      n: '04',
      title: 'Make It Unconscious — Build the Habit',
      body: 'Mewing only works if it becomes your default resting posture — 24/7. Set hourly reminders for the first two weeks. Check your posture every time you look in a mirror.',
    },
    {
      n: '05',
      title: 'Be Patient — This Takes Months to Years',
      body: 'In adults, bone remodeling from mewing takes years, not weeks. However, soft tissue improvements (reduced puffiness, cleaner jaw definition) can appear in 2–3 months from sustained proper posture + hydration.',
    },
  ];

  const myths = [
    { myth: '"Mewing works in 30 days"', reality: 'Bone moves at ~ 1mm per month under sustained force. Visible structural changes take years in adults. Anyone claiming 30 days is selling something.' },
    { myth: '"Just put your tongue tip up"', reality: 'This is incorrect technique. Only the full tongue body against the palate provides enough distributed pressure to have any structural effect.' },
    { myth: '"Mewing only works for teenagers"', reality: 'Adult bone does remodel — more slowly. Soft tissue and posture improvements are achievable at any age. It\'s never useless.' },
    { myth: '"Harder pressing = faster results"', reality: 'You should feel light consistent pressure, not strain. Hard pressing causes jaw pain and bruxism, not faster results.' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
      <SEO
        title="The Complete Mewing Guide for 2026 — Technique, Science & What to Expect | VisageX"
        description="Everything you need to know about mewing: the correct tongue posture, how to build the habit, what science actually says, and how to track your progress with AI face analysis."
        canonical="https://visagex.online/blog/complete-mewing-guide"
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
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${isDarkMode ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-emerald-200 text-emerald-600 bg-emerald-50'}`}>
              <Layers className="w-4 h-4" />
              Mewing & Oral Posture
            </div>
            <h1 className={`text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              The Complete
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Mewing Guide 2026
              </span>
            </h1>
            <p className={`text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              The internet is full of mewing misinformation. This is the no-BS guide — correct technique, realistic expectations, and how to actually build the habit.
            </p>
            <div className={`inline-flex items-center gap-2 text-xs font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span>8 min read</span><span>·</span><span>Updated March 2026</span>
            </div>
          </header>

          {/* What is mewing */}
          <div className={`p-8 md:p-12 rounded-[3rem] border ${isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white border-zinc-200'}`}>
            <h2 className={`text-2xl md:text-3xl font-display font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>What Is Mewing, Actually?</h2>
            <div className={`space-y-4 text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <p>
                Mewing is the practice of resting your tongue flat against the roof of your mouth (the palate) as your default posture. The name comes from Dr. John Mew and his son Dr. Mike Mew, British orthodontists who developed the field of orthotropics — the idea that oral posture shapes facial bone structure over time.
              </p>
              <p>
                The underlying biology is real: your maxilla (upper jaw) is a bone that responds to pressure. Your tongue, positioned correctly, applies ~500 grams of constant upward pressure against the palate. Over years, this promotes <strong>forward and upward</strong> maxillary growth — broader palate, higher cheekbones, better mid-face projection.
              </p>
              <p>
                The controversy is about <strong>speed and degree</strong>. The science confirms the mechanism exists. The internet exaggerates the timeline. The truth is somewhere in between.
              </p>
            </div>
          </div>

          {/* Step by step */}
          <div className="space-y-6">
            <h2 className={`text-3xl md:text-4xl font-display font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              How to Mew Correctly — Step by Step
            </h2>
            <div className="space-y-4">
              {steps.map((step) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  className={`flex gap-6 p-6 md:p-8 rounded-[2rem] border ${isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}
                >
                  <span className={`text-3xl font-display font-bold shrink-0 ${isDarkMode ? 'text-white/10' : 'text-zinc-200'}`}>{step.n}</span>
                  <div>
                    <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{step.title}</h3>
                    <p className={`leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{step.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Science section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card icon={Timer} title="When Do You See Results?" color="emerald">
              <p><strong className={isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}>2–4 weeks:</strong> Better nasal breathing, reduced open-mouth breathing. Reduced tongue tension.</p>
              <p><strong className={isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}>2–3 months:</strong> Softer jaw definition from reduced water retention. Slight posture improvement visible in photos.</p>
              <p><strong className={isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}>1–2 years:</strong> In teenagers, structural bone change is measurable. In adults, slower change but real over time.</p>
            </Card>
            <Card icon={MoveUp} title="Hard Mewing vs Soft Mewing" color="violet">
              <p><strong className={isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}>Soft mewing</strong> = correct resting tongue posture, light pressure. This is the sustainable 24/7 practice.</p>
              <p><strong className={isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}>Hard mewing</strong> = actively pushing tongue up with force. Controversial, not recommended for extended periods. Can cause TMJ issues.</p>
              <p>The consensus: soft mewing as your default posture gives you 95% of the benefit.</p>
            </Card>
          </div>

          {/* Myths */}
          <div className="space-y-6">
            <h2 className={`text-3xl font-display font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>4 Common Mewing Myths — Debunked</h2>
            <div className="space-y-4">
              {myths.map((m, i) => (
                <div key={i} className={`p-6 md:p-8 rounded-[2rem] border ${isDarkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full shrink-0 ${isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-500'}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`font-bold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{m.myth}</p>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <p className={`leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{m.reality}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Track Progress CTA */}
          <div className={`p-8 md:p-12 rounded-[3rem] border ${isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-zinc-100/50 border-zinc-200'} text-center`}>
            <Hand className={`w-8 h-8 mx-auto mb-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <h3 className={`text-2xl font-display font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Track Your Mewing Progress</h3>
            <p className={`text-base leading-relaxed mb-6 max-w-xl mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Use regular AI face analysis scans to objectively measure whether your facial ratios, symmetry, and jaw definition are improving over time. Subjective mirror checks aren't reliable — data is.
            </p>
            <Link
              to="/"
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all hover:scale-105 duration-300 ${isDarkMode ? 'bg-white text-black hover:bg-emerald-400 hover:text-white' : 'bg-zinc-900 text-white hover:bg-black'}`}
            >
              Get Your Baseline Score <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Main CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden group ${isDarkMode ? 'bg-gradient-to-b from-emerald-900/40 to-black border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}
          >
            <div className={`absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity duration-700 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent' : ''}`} />
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className={`text-4xl md:text-5xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Start your glow-up journey today
              </h2>
              <p className={`text-lg font-light ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                Get a free baseline AI facial analysis before you begin mewing, then track changes every 3 months.
              </p>
              <Link
                to="/"
                className={`inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-2xl hover:scale-105 duration-300 ${isDarkMode ? 'bg-white text-black hover:bg-emerald-400 hover:text-white' : 'bg-zinc-900 text-white hover:bg-black'}`}
              >
                Free Face Analysis <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </article>
    </div>
  );
}
