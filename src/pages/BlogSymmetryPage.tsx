import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Bed, Dumbbell, MoveDown, Compass } from 'lucide-react';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeProvider';

export default function BlogSymmetryPage() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const Card = ({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
    <div className={`p-8 md:p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 ${isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:bg-white/[0.07]' : 'bg-white border-zinc-200 shadow-xl hover:shadow-2xl'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
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
        title="How to Improve Face Symmetry | The Ultimate Guide"
        description="Learn how to fix asymmetrical facial features, perform facial exercises, and use an AI face analysis test to track your glow up journey."
        canonical="https://visagex.online/blog/how-to-improve-face-symmetry"
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
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${isDarkMode ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-emerald-200 text-emerald-600 bg-emerald-50'}`}>
              <Sparkles className="w-4 h-4" />
              Glow Up Guide
            </div>
            <h1 className={`text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              How to Improve
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Face Symmetry
              </span>
            </h1>
            <p className={`text-lg md:text-xl font-light max-w-2xl mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Perfect symmetry is rare, but achieving a visually balanced face is absolutely possible. Here's what causes asymmetry and how you can naturally fix it over time.
            </p>
          </header>

          {/* Intro block */}
          <div className={`max-w-3xl mx-auto p-8 rounded-3xl border ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-100/50 border-zinc-200'} text-center`}>
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
              If you want to find out exactly how symmetrical your face is right now, try our free <Link to="/" className="text-emerald-500 font-bold hover:underline">AI face analysis tool</Link> to get a clinical-grade breakdown of your geometry before starting these changes.
            </p>
          </div>

          {/* Causes in Cards */}
          <div className="space-y-8">
            <h2 className={`text-3xl font-display text-center ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>What Actually Causes Asymmetry?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card icon={Bed} title="Sleeping Habits">
                <p>Consistently sleeping on one side of your face puts intense pressure on your tissues, causing volume loss and skin laxity on that side over time. It can actually reshape cartilage in your nose.</p>
              </Card>
              <Card icon={Dumbbell} title="Unbalanced Chewing">
                <p>If you favor one side of your mouth while chewing food (or gum), the masseter muscle on that side will grow larger (hypertrophy), leading to a highly uneven and tilted lower jawline.</p>
              </Card>
              <Card icon={MoveDown} title="Poor Posture & Mewing">
                <p>Neck posture and resting tongue position dictate how your facial bones develop. Incorrect tongue posture reduces upward pressure on the maxilla (upper jaw), leading to a flatter, less defined midface.</p>
              </Card>
              <Card icon={Compass} title="Genetics & Aging">
                <p>Bone structure genetics play a massive baseline role. Additionally, as we age, we experience asymmetric collagen and fat pad breakdown resulting in uneven folds.</p>
              </Card>
            </div>
          </div>

           {/* Solutions */}
           <div className={`p-10 md:p-14 rounded-[3rem] border ${isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white border-zinc-200'}`}>
            <h2 className={`text-3xl md:text-4xl font-display mb-10 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>3 Ways to Fix It</h2>
            
            <div className="space-y-12">
              <div>
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>1. Balance Your Chewing Ratio</h3>
                <p className={`text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  The masseter fix is the fastest way to balance the lower third of your face. Make a conscious effort to chew your food evenly on both sides. If you use jawline exercisers or mastic gum, strictly maintain a 50/50 ratio to prevent one side from outgrowing the other.
                </p>
              </div>

              <div>
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>2. Sleep on Your Back</h3>
                <p className={`text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Train yourself to sleep on your back. This not only prevents asymmetrical volume loss on your cheeks but also stops the formation of "sleep wrinkles." Using a specialized cervical pillow can help keep your head locked in place.
                </p>
              </div>

              <div>
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>3. Practice Proper Oral Posture (Mewing)</h3>
                <p className={`text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  By resting your entire tongue flush against the roof of your mouth (lips sealed, teeth gently touching), you provide upward pressure on the maxilla. Over years, this forces the mid-face forward, creating sharper cheekbones and better overall structural symmetry.
                </p>
              </div>
            </div>
          </div>

          {/* Giant CTA Conversion Block */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`mt-24 p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden group ${isDarkMode ? 'bg-gradient-to-b from-emerald-900/40 to-black border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}
          >
            {/* Background Glow */}
            <div className={`absolute inset-0 opacity-50 transition-opacity duration-700 group-hover:opacity-100 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent'}`} />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className={`text-4xl md:text-5xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Check your exact symmetry score
              </h2>
              <p className={`text-lg md:text-xl font-light ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                Upload a selfie and let our neural network scan 468 facial points to reveal any hidden asymmetries.
              </p>
              <div className="pt-4 flex justify-center">
                <Link 
                  to="/" 
                  className={`inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-2xl hover:scale-105 duration-300 ${isDarkMode ? 'bg-white text-black hover:bg-emerald-400 hover:text-white shadow-white/10' : 'bg-zinc-900 text-white hover:bg-black shadow-black/20'}`}
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
