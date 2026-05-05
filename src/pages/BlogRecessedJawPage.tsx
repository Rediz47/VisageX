import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  MoveDown,
  ArrowRight,
  ShieldCheck,
  Dumbbell,
  ActivitySquare,
  ImagePlus
} from 'lucide-react';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeProvider';

export default function BlogRecessedJawPage() {
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
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600'}`}
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
        title="How to Fix a Recessed Jawline & Weak Chin Facts"
        description="The ultimate guide to building a stronger, wider jawline. Discover if mewing, masseter hypertrophy, or orthotropics can fix a recessed chin naturally."
        canonical="https://visagex.online/blog/how-to-fix-recessed-jawline"
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
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${isDarkMode ? 'border-rose-500/30 text-rose-400 bg-rose-500/10' : 'border-rose-200 text-rose-600 bg-rose-50'}`}
            >
              <MoveDown className="w-4 h-4" />
              Structural Guide
            </div>
            <h1
              className={`text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              How to Fix a
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-fuchsia-400">
                Recessed Jawline
              </span>
            </h1>
            <p
              className={`text-lg md:text-xl font-light max-w-2xl mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
            >
              Is it possible to correct a "weak chin" without surgery? The medical truth behind
              mewing, chewing habits, and orthotropics.
            </p>
          </header>

          {/* HERO IMAGE */}
          <div className="w-full max-w-3xl mx-auto h-[260px] md:h-[340px] flex items-center justify-center transition-all hover:scale-[1.01] duration-700 overflow-hidden">
            <img
              src="/jawline.jpg"
              alt="Jawline Profile"
              className="w-full h-full object-contain rounded-[2rem] md:rounded-[2.5rem] shadow-xl hover:shadow-2xl"
            />
          </div>

          <div className="space-y-8">
            <h2
              className={`text-3xl font-display text-center ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              What Causes a Recessed Jawline?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card icon={ActivitySquare} title="Mouth Breathing (During Childhood)">
                <p>
                  The number one cause of a recessed jawline is mouth breathing during developmental
                  years. When the mouth is open, the tongue drops and fails to support the maxilla.
                  The facial bones grow long and downwards rather than horizontally forward.
                </p>
              </Card>
              <Card icon={ShieldCheck} title="Genetic Underbite / Overbite">
                <p>
                  Structural malocclusions (how your teeth fit together) often dictate the
                  positioning of the mandible. A severe overbite pushes the lower jaw backward in
                  relation to the rest of the face, leading to a weak chin profile.
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
              Three Non-Surgical Solutions
            </h2>
            <div className="space-y-12">
              <div>
                <h3
                  className={`text-xl font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}
                >
                  <Dumbbell className="w-5 h-5" /> Masseter Hypertrophy
                </h3>
                <p
                  className={`text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                >
                  If your jawline lacks *width* rather than forward projection, you can build the
                  masseter muscles through tough chewing (Mastic gum). However, if your jaw is
                  severely recessed backwards, building the muscle without fixing projection can
                  make the face look abnormally blocky.
                </p>
              </div>
              <div>
                <h3
                  className={`text-xl font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}
                >
                  <ShieldCheck className="w-5 h-5" /> Correct Orthodontics
                </h3>
                <p
                  className={`text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                >
                  For adults, clear aligners or braces can fix the bite, which subtly changes how
                  your lower jaw pulls against the joint. While it won't give you model-tier bone
                  structure on its own, fixing an overbite provides a noticeable improvement to
                  jawline projection.
                </p>
              </div>
              <div>
                <h3
                  className={`text-xl font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}
                >
                  <MoveDown className="w-5 h-5" /> Posture Tucking (Mewing)
                </h3>
                <p
                  className={`text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                >
                  Correcting your neck posture immediately stretches the skin under the chin,
                  reducing the appearance of a double chin. Mewing (pressing the tongue to the roof
                  of the mouth) lifts the submental tissue rapidly, making the jawline appear much
                  sharper in side profile immediately, even before structural bone changes occur.
                </p>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`mt-24 p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden group ${isDarkMode ? 'bg-gradient-to-b from-rose-900/40 to-black border border-rose-500/20' : 'bg-rose-50 border border-rose-100'}`}
          >
            <div
              className={`absolute inset-0 opacity-50 transition-opacity duration-700 group-hover:opacity-100 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent'}`}
            />

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2
                className={`text-4xl md:text-5xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
              >
                Analyze your jawline projection
              </h2>
              <p
                className={`text-lg md:text-xl font-light ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}
              >
                Stop holding your phone above your head to hide your jawline. Upload a raw selfie to
                our engine and instantly get your exact jawline angularity matrix.
              </p>
              <div className="pt-4 flex justify-center">
                <Link
                  to="/"
                  className={`inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-2xl hover:scale-105 duration-300 ${isDarkMode ? 'bg-white text-black hover:bg-rose-400 hover:text-white shadow-white/10' : 'bg-zinc-900 text-white hover:bg-black shadow-black/20'}`}
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
