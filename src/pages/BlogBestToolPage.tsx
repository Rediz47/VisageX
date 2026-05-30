import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, Zap, ScanFace, Lock, CheckCircle2, ImagePlus } from 'lucide-react';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeProvider';

export default function BlogBestToolPage() {
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
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600'}`}
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
        title="Best AI Face Analysis Tool in 2026 | Free Online Scanner"
        description="Looking for the best AI face analysis tool? Discover why VisageX's 468-point neural mesh is the most accurate online face rater and symmetry tester."
        canonical="https://visagex.online/blog/best-ai-face-analysis-tool"
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
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${isDarkMode ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-amber-200 text-amber-600 bg-amber-50'}`}
            >
              <Trophy className="w-4 h-4" />
              Top Rated Platform
            </div>
            <h1
              className={`text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              The Best AI Face
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                Analysis Tool
              </span>
            </h1>
            <p
              className={`text-lg md:text-xl font-light max-w-2xl mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
            >
              Not all facial scanners are created equal. If you are serious about understanding your
              geometry, symmetry, and looksmaxxing potential, you need precision aesthetic software.
            </p>
          </header>

          {/* HERO IMAGE DROP-ZONE */}
          <div
            className={`w-full aspect-video bg-zinc-100 dark:bg-black/20 rounded-[3rem] overflow-hidden flex flex-col items-center justify-center border-2 border-dashed ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-zinc-300 bg-zinc-100'} transition-all hover:border-zinc-500`}
          >
            <img
              src="/main-hero.png"
              className="w-full h-full object-contain"
              alt="Face Tesselation"
            />
          </div>

          {/* Intro block */}
          <div
            className={`max-w-3xl mx-auto p-8 rounded-3xl border ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-100/50 border-zinc-200'} text-center`}
          >
            <p
              className={`text-lg leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}
            >
              Tired of reading? You can skip the breakdown and{' '}
              <Link to="/" className="text-amber-500 font-bold hover:underline">
                try the best AI face analysis tool right now
              </Link>{' '}
              directly in your browser.
            </p>
          </div>

          {/* Features in Cards */}
          <div className="space-y-8">
            <h2
              className={`text-3xl font-display text-center ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              Why VisageX is the #1 Rated Scanner
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card icon={ScanFace} title="Precision 468-Point Mesh">
                <p>
                  Old apps simply map 20 points (eyes, nose tip, lips). We utilize Google's advanced
                  neural network to anchor exactly <strong>468 tracking points</strong> onto your
                  face in 3D space. This allows for micrometer-accurate symmetry and jawline
                  angularity measurements.
                </p>
              </Card>
              <Card icon={Zap} title="Instant & Ephemeral">
                <p>
                  Unlike competitors that make you wait hours or download shady desktop software,
                  VisageX runs heavily localized and through massive GPU cloud servers to deliver
                  your massive data report in <strong>under 15 seconds</strong>.
                </p>
              </Card>
              <Card icon={CheckCircle2} title="Actionable Glow-Up Routines">
                <p>
                  It's not just a vanity face rater. When you run a scan, our engine outputs a
                  science-backed, actionable "Looksmaxxing" routine. If you lack masseter volume,
                  we tell you how to train it. If you have under-eye puffiness, we give you the
                  visual framing adjustment.
                </p>
              </Card>
              <Card icon={Lock} title="Absolute Privacy">
                <p>
                  Your biometric data does not belong to us. Photos are processed purely for
                  aesthetic analysis and are instantly purged. They are{' '}
                  <strong>never stored, sold, or used to train third-party models</strong>.
                  Bank-level privacy is guaranteed.
                </p>
              </Card>
            </div>
          </div>

          {/* FAQ */}
          <div
            className={`p-10 md:p-14 rounded-[3rem] border ${isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white border-zinc-200'}`}
          >
            <h2
              className={`text-3xl md:text-4xl font-display mb-10 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              Common Questions
            </h2>

            <div className="space-y-8">
              <div>
                <h3
                  className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}
                >
                  Can I use it on my phone?
                </h3>
                <p
                  className={`text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                >
                  Yes. VisageX is a Progressive Web App (PWA). That means the best AI face analysis
                  tool is accessible securely from iOS Safari, Android Chrome, and Desktop without
                  needing to clutter your phone with an App Store download.
                </p>
              </div>

              <div>
                <h3
                  className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}
                >
                  Is the face analysis completely free?
                </h3>
                <p
                  className={`text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                >
                  We offer incredibly deep free scans. Because analyzing 468 massive data points
                  dynamically requires immense server GPU power, we also offer premium packages for
                  users who want daily logging or advanced surface breakdowns.
                </p>
              </div>
            </div>
          </div>

          {/* Giant CTA Conversion Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`mt-24 p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden group ${isDarkMode ? 'bg-gradient-to-b from-amber-900/40 to-black border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}
          >
            {/* Background Glow */}
            <div
              className={`absolute inset-0 opacity-50 transition-opacity duration-700 group-hover:opacity-100 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent'}`}
            />

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2
                className={`text-4xl md:text-5xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
              >
                Try the AI Tool
              </h2>
              <p
                className={`text-lg md:text-xl font-light ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}
              >
                Test your face instantly. Stop guessing what you need to fix and let the precision
                algorithm give you your exact attractiveness blueprint.
              </p>
              <div className="pt-4 flex justify-center">
                <Link
                  to="/"
                  className={`inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-2xl hover:scale-105 duration-300 ${isDarkMode ? 'bg-white text-black hover:bg-amber-400 hover:text-white shadow-white/10' : 'bg-zinc-900 text-white hover:bg-black shadow-black/20'}`}
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
