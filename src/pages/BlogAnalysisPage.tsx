import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Brain, Camera, Settings, Activity, ArrowRight, ScanFace, ImagePlus } from 'lucide-react';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeProvider';

export default function BlogAnalysisPage() {
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
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}
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
        title="AI Face Analysis Explained: How Looksmaxxing Bots Work"
        description="Discover the science behind AI face analysis, facial symmetry tests, and how neural networks scan your face to provide glow-up routines."
        canonical="https://visagex.online/blog/ai-face-analysis-explained"
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
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${isDarkMode ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' : 'border-indigo-200 text-indigo-600 bg-indigo-50'}`}
            >
              <Brain className="w-4 h-4" />
              Inside The Tech
            </div>
            <h1
              className={`text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              AI Face Analysis
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                Explained
              </span>
            </h1>
            <p
              className={`text-lg md:text-xl font-light max-w-2xl mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
            >
              Ever wondered how bots actually map your face? We break down the aesthetic geometry and
              the science of the 468-point neural mesh.
            </p>
          </header>

          {/* HERO IMAGE DROP-ZONE */}
          <div
            className={`w-full aspect-video bg-zinc-100 dark:bg-black/20 rounded-[3rem] overflow-hidden flex flex-col items-center justify-center border-2 border-dashed ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-zinc-300 bg-zinc-100'} transition-all hover:border-zinc-500`}
          >
            {/* If you have a photo, delete this entire <div> block and replace with: 
                <img src="/my-analysis-cover.jpg" className="w-full h-full object-contain" /> 
            */}
            <ImagePlus
              className={`w-12 h-12 mb-4 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}
            />
            <p
              className={`text-lg font-bold tracking-widest uppercase ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}
            >
              [ Insert Face Map Photo ]
            </p>
            <p
              className={`text-sm mt-2 font-mono ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}
            >
              &lt;img src="/face-mesh.jpg" /&gt;
            </p>
          </div>

          {/* Core Steps in Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card icon={ScanFace} title="Step 1: The 468-Point Mesh">
              <p>
                When you upload a photo to an{' '}
                <Link to="/" className="text-indigo-500 font-bold hover:underline">
                  AI face analysis tool
                </Link>
                , the neural network bypasses basic detection. Standard tech just finds your eyes.
                Modern AI drops exactly <strong>468 geometric anchors</strong> onto your features.
              </p>
              <p>
                These points track the exact curve of your jawline, the width of your nose base, and
                the resting tilt of your eyes. This dense mesh forms the foundation of every
                subsequent aesthetic calculation.
              </p>
            </Card>

            <Card icon={Activity} title="Step 2: Golden Ratio Geometry">
              <p>
                With the geometry locked in, the AI calculates the spatial relationships between
                your features:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>
                  <strong>Symmetry:</strong> Measures the delta (in millimeters) between the left
                  and right sides of your jaw and cheekbones.
                </li>
                <li>
                  <strong>Facial Thirds:</strong> Checks if hairline-to-brow, brow-to-nose, and
                  nose-to-chin are perfectly balanced.
                </li>
                <li>
                  <strong>Canthal Tilt:</strong> Calculates the angle of your eyes to determine
                  dominance.
                </li>
              </ul>
            </Card>

            <Card icon={Camera} title="Step 3: Surface & Clarity Analysis">
              <p>
                Beyond bone structure geometry, specialized vision models analyze the actual texture
                of your photo's pixels. The AI scans for contrast irregularities that indicate{' '}
                <strong>dark circles, redness variation, and surface clarity</strong>.
              </p>
              <p>
                It generates a density map measuring lighting reflections and tone evenness to output a final,
                objective "Surface Quality Score".
              </p>
            </Card>

            <Card icon={Settings} title="Step 4: The Glow-Up Engine">
              <p>
                The real magic of looksmaxxing AI is the synthesis. By processing your structural
                weaknesses and skin flaws, the AI creates a customized aesthetic routine.
              </p>
              <p>
                For example, if it detects a high forehead and a triangle face shape, it
                automatically triggers specific hairstyle recommendations that add volume exactly
                where your face needs balancing.
              </p>
            </Card>
          </div>

          {/* Giant CTA Conversion Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`mt-24 p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden group ${isDarkMode ? 'bg-gradient-to-b from-indigo-900/40 to-black border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}
          >
            {/* Background Glow */}
            <div
              className={`absolute inset-0 opacity-50 transition-opacity duration-700 group-hover:opacity-100 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent'}`}
            />

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2
                className={`text-4xl md:text-5xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
              >
                Test your face instantly
              </h2>
              <p
                className={`text-lg md:text-xl font-light ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}
              >
                Experience the 468-point neural mesh yourself. Discover your symmetry score, surface
                quality metrics, and personalized glow-up routine.
              </p>
              <div className="pt-4 flex justify-center">
                <Link
                  to="/"
                  className={`inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-2xl hover:scale-105 duration-300 ${isDarkMode ? 'bg-white text-black hover:bg-indigo-400 hover:text-white shadow-white/10' : 'bg-zinc-900 text-white hover:bg-black shadow-black/20'}`}
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
