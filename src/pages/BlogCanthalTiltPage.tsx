import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Eye, ArrowRight, Ruler as Rulers, Activity, Sparkles, ImagePlus } from 'lucide-react';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeProvider';

export default function BlogCanthalTiltPage() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const Card = ({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
    <div className={`p-8 md:p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-white/[0.07]' : 'bg-white border-zinc-200 shadow-xl hover:shadow-2xl'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 ${isDarkMode ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className={`text-2xl font-display mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{title}</h3>
      <div className={`space-y-4 text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
        {children}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
      <SEO
        title="What is Canthal Tilt? Positive vs Negative & Hunter Eyes"
        description="Learn the geometry behind canthal tilt, the difference between hunter eyes and prey eyes, and how to accurately measure your eye attractiveness."
        canonical="https://visagex.online/blog/what-is-canthal-tilt"
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
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${isDarkMode ? 'border-sky-500/30 text-sky-400 bg-sky-500/10' : 'border-sky-200 text-sky-600 bg-sky-50'}`}>
              <Eye className="w-4 h-4" />
              Genetic Aesthetics
            </div>
            <h1 className={`text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              What is a
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                Canthal Tilt?
              </span>
            </h1>
            <p className={`text-lg md:text-xl font-light max-w-2xl mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              The mathematical secret to "Hunter Eyes". Discover the absolute clinical truth behind eye geometry and facial dimorphism.
            </p>
          </header>

          <div className={`w-full aspect-[21/9] rounded-[3rem] overflow-hidden flex flex-col items-center justify-center border-2 border-dashed ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-zinc-300 bg-zinc-100'} transition-all hover:border-zinc-500`}>
            <img src="/canthil.png" className="w-full h-full object-cover" alt="Canthal Tilt Guide" />
          </div>

          <div className={`max-w-3xl mx-auto p-8 rounded-3xl border ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-100/50 border-zinc-200'} text-center`}>
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Stop guessing your eye shape in the mirror. Use our <Link to="/" className="text-sky-500 font-bold hover:underline">AI face rater</Link> to generate an exact protractor measurement of your canthal tilt in seconds.
            </p>
          </div>

          <div className="space-y-8">
            <h2 className={`text-3xl font-display text-center ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>The 3 Types of Canthal Tilt</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card icon={Activity} title="Positive Tilt (+)">
                <p>The outer corner (lateral canthus) is sitting higher than the inner corner (medial canthus). This is universally considered the most attractive, high-trust, and dimorphic trait in both men ("Hunter Eyes") and women (feline, siren eyes).</p>
              </Card>
              <Card icon={Rulers} title="Neutral Tilt (0)">
                <p>The inner and outer corners are parallel to the horizon. This is incredibly common and perfectly normal, often leading to a highly friendly "almond" or soft rectangular eye shape. It denotes approachability.</p>
              </Card>
              <Card icon={Sparkles} title="Negative Tilt (-)">
                <p>The outer corner drops lower than the inner corner. While often criticized in looksmaxxing circles as "prey eyes" because it can give off a tired, sad, or highly sympathetic look, it suits certain bone structures beautifully (like Marilyn Monroe).</p>
              </Card>
            </div>
          </div>

          <div className={`p-10 md:p-14 rounded-[3rem] border ${isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white border-zinc-200'}`}>
            <h2 className={`text-3xl md:text-4xl font-display mb-10 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Can You Change Your Canthal Tilt?</h2>
            <div className="space-y-8">
              <div>
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`}>The Hard Truth</h3>
                <p className={`text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Your canthal tilt is determined by your orbital bone socket and the specific attachment of your lateral canthal tendon. Therefore, <strong>pushing on your eyes, "bone-smashing", or Gua Sha will not change your tilt</strong>. The geometry is locked in structurally.
                </p>
              </div>
              <div>
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`}>What Actually Helps</h3>
                <p className={`text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Instead of trying to change the tilt, you should focus on the surrounding tissue. Lowering body fat percentage reduces periocular puffiness. Using cold compresses tightens the skin, revealing more of your natural eyelid fold. Non-surgical options like Botox can slightly lift the tail of the brow, giving the *illusion* of a more positive tilt.
                </p>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`mt-24 p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden group ${isDarkMode ? 'bg-gradient-to-b from-sky-900/40 to-black border border-sky-500/20' : 'bg-sky-50 border border-sky-100'}`}
          >
            <div className={`absolute inset-0 opacity-50 transition-opacity duration-700 group-hover:opacity-100 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500/20 via-transparent to-transparent' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent'}`} />

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className={`text-4xl md:text-5xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Measure Your Tilt Now
              </h2>
              <p className={`text-lg md:text-xl font-light ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                Our 468-point neural mesh will calculate your exact left and right canthal tilt angles to the decimal point for free.
              </p>
              <div className="pt-4 flex justify-center">
                <Link
                  to="/"
                  className={`inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-2xl hover:scale-105 duration-300 ${isDarkMode ? 'bg-white text-black hover:bg-sky-400 hover:text-white shadow-white/10' : 'bg-zinc-900 text-white hover:bg-black shadow-black/20'}`}
                >
                  Start Face Analysis <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </article>
    </div>
  );
}
