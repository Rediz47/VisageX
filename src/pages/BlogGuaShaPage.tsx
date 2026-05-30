import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Feather, ArrowRight, Droplets, Scale, Hand, ImagePlus } from 'lucide-react';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeProvider';

export default function BlogGuaShaPage() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const Card = ({
    icon: Icon,
    title,
    children
  }: {
    icon: any;
    title: string;
    children: React.ReactNode;
  }) => (
    <div
      className={`p-8 md:p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-white/[0.07]' : 'bg-white border-zinc-200 shadow-xl hover:shadow-2xl'}`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3
        className={`text-2xl font-display mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
      >
        {title}
      </h3>
      <div
        className={`space-y-4 text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
      >
        {children}
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}
    >
      <SEO
        title="Does Gua Sha Work for Face Fat? Science vs Trend"
        description="Aesthetic specialists and photography analysts explain the exact science of Gua Sha, lymphatic drainage, and how to actually lose face fat safely."
        canonical="https://visagex.online/blog/does-gua-sha-work"
      />

      <article className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-16"
        >
          {/* Hero Header */}
          <header className="text-center max-w-3xl mx-auto space-y-6">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${isDarkMode ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' : 'border-purple-200 text-purple-600 bg-purple-50'}`}
            >
              <Feather className="w-4 h-4" />
              Skincare Myths Breakdown
            </div>
            <h1
              className={`text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              Does Gua Sha Work
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                For Face Fat?
              </span>
            </h1>
            <p
              className={`text-lg md:text-xl font-light max-w-2xl mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
            >
              TikTok influencers claim it redesigns your jawline. The reality is far less magical,
              but still incredibly useful for your facial harmony.
            </p>
          </header>

          {/* HERO IMAGE */}
          <div className="w-full max-w-3xl mx-auto h-[260px] md:h-[340px] flex items-center justify-center transition-all hover:scale-[1.01] duration-700 overflow-hidden">
            <img
              src="/gua_sha.webp"
              alt="Gua Sha Tutorial"
              className="w-full h-full object-contain rounded-[2rem] md:rounded-[2.5rem] shadow-xl hover:shadow-2xl"
            />
          </div>

          <div className="space-y-8">
            <h2
              className={`text-3xl font-display text-center ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              The Structural Truth
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card icon={Scale} title="It Does Not Burn Adipose Tissue">
                <p>
                  Let's clear the air immediately.{' '}
                  <strong>
                    Scraping a stone crystal against your skin cannot spot-reduce adipose tissue
                    (fat cells).
                  </strong>{' '}
                  If you have high body fat percentage, Gua Sha will not melt away the fat
                  underneath your chin or cheeks. The only way to lose genetic face fat is to enter
                  a caloric deficit through diet and exercise.
                </p>
              </Card>
              <Card icon={Droplets} title="It Excels at Lymphatic Drainage">
                <p>
                  So why do people go from puffy to sharp in a 3-minute video? Liquid retention. The
                  lymphatic system has no "pump" like the heart.{' '}
                  <strong>Gua Sha physically pushes stagnant fluid buildup</strong> out from under
                  the skin down into the lymph nodes in the neck, instantly "de-puffing" the face
                  and revealing the bone structure that was hiding underneath.
                </p>
              </Card>
            </div>
          </div>

          <div
            className={`p-10 md:p-14 rounded-[3rem] border ${isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white border-zinc-200'}`}
          >
            <h2
              className={`text-3xl md:text-4xl font-display mb-10 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              How to Actually Define Your Jawline
            </h2>
            <div className="space-y-12">
              <div>
                <h3
                  className={`text-xl font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
                >
                  <Hand className="w-5 h-5" /> Step 1: Drain the Inflammation
                </h3>
                <p
                  className={`text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                >
                  Use a Gua Sha in the morning. Apply a facial oil so the stone glides. Anchor your
                  skin with one hand and sweep the stone outwards from your chin to your earlobe.
                  Always drain <strong>down the neck</strong>. This clears morning puffiness.
                </p>
              </div>
              <div>
                <h3
                  className={`text-xl font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
                >
                  <Droplets className="w-5 h-5" /> Step 2: Limit Sodium Intake
                </h3>
                <p
                  className={`text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                >
                  Eating high amounts of sodium and processed carbs late at night binds to water.
                  This pulls water directly into the extracellular space of your face, completely
                  hiding your cheekbones. The "moon face" look is frequently a dietary hydration
                  issue, not a bone structure defect.
                </p>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`mt-24 p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden group ${isDarkMode ? 'bg-gradient-to-b from-purple-900/40 to-black border border-purple-500/20' : 'bg-purple-50 border border-purple-100'}`}
          >
            <div
              className={`absolute inset-0 opacity-50 transition-opacity duration-700 group-hover:opacity-100 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent'}`}
            />

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2
                className={`text-4xl md:text-5xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
              >
                Is it fat or just puffiness?
              </h2>
              <p
                className={`text-lg md:text-xl font-light ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}
              >
                Our system calculates skin density, shadows, and precise jawline geometry so you can
                figure out what is really going on below the skin.
              </p>
              <div className="pt-4 flex justify-center">
                <Link
                  to="/"
                  className={`inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-2xl hover:scale-105 duration-300 ${isDarkMode ? 'bg-white text-black hover:bg-purple-400 hover:text-white shadow-white/10' : 'bg-zinc-900 text-white hover:bg-black shadow-black/20'}`}
                >
                  Start Facial Analysis Scan <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </article>
    </div>
  );
}
