import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, Brain, Trophy, Eye, MoveDown, Feather } from 'lucide-react';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeProvider';

export default function BlogIndexPage() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const articles = [
    {
      title: "How to Improve Face Symmetry",
      description: "Learn how to fix asymmetrical facial features naturally with sleep posture, chewing habits, and mewing.",
      icon: Sparkles,
      color: "emerald",
      link: "/blog/how-to-improve-face-symmetry"
    },
    {
      title: "AI Face Analysis Explained",
      description: "Discover the science behind the 468-point neural mesh, golden ratio, and how bots rate your face.",
      icon: Brain,
      color: "indigo",
      link: "/blog/ai-face-analysis-explained"
    },
    {
      title: "Best AI Face Analysis Tool",
      description: "Compare the top scanners and see why clinical-grade 3D geometry tests are the only way to accurately looksmax.",
      icon: Trophy,
      color: "amber",
      link: "/blog/best-ai-face-analysis-tool"
    },
    {
      title: "What is Canthal Tilt?",
      description: "The secret to 'Hunter Eyes'. Learn the geometry behind eye attractiveness and if you can actually change it.",
      icon: Eye,
      color: "sky",
      link: "/blog/what-is-canthal-tilt"
    },
    {
      title: "How to Fix a Recessed Jawline",
      description: "Non-surgical ways to build a stronger, wider jawline. The ultimate guide to masseter hypertrophy.",
      icon: MoveDown,
      color: "rose",
      link: "/blog/how-to-fix-recessed-jawline"
    },
    {
      title: "Does Gua Sha Work for Face Fat?",
      description: "Dermatologists break down the truth behind facial massage, lymphatic drainage, and de-puffing your face.",
      icon: Feather,
      color: "purple",
      link: "/blog/does-gua-sha-work"
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
      <SEO 
        title="The Glow-Up Blog | Aesthetics & AI Face Analysis Guides"
        description="The ultimate resource for facial aesthetics, looksmaxxing techniques, and understanding your facial geometry."
        canonical="https://visagex.online/blog"
      />

      <article className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-16"
        >
          {/* Header */}
          <header className="text-center max-w-3xl mx-auto space-y-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${isDarkMode ? 'border-zinc-500/30 text-zinc-300 bg-zinc-500/10' : 'border-zinc-200 text-zinc-600 bg-zinc-100'}`}>
              <BookOpen className="w-4 h-4" />
              The Glow-Up Library
            </div>
            <h1 className={`text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Master Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">
                Aesthetics
              </span>
            </h1>
            <p className={`text-lg md:text-xl font-light max-w-2xl mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Clinical guides, AI breakdowns, and proven routines to naturally enhance your facial harmony.
            </p>
          </header>

          {/* Grid Index */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {articles.map((article, i) => (
              <Link 
                key={i} 
                to={article.link}
                className={`group p-8 rounded-[2rem] border transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between h-full ${
                  isDarkMode 
                    ? 'bg-zinc-900/50 border-white/5 hover:bg-white/[0.05] hover:border-white/10' 
                    : 'bg-white border-zinc-200 shadow-lg hover:shadow-xl'
                }`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 ${
                    isDarkMode 
                      ? `bg-${article.color}-500/20 text-${article.color}-400`
                      : `bg-${article.color}-50 text-${article.color}-600`
                  }`}>
                    <article.icon className="w-6 h-6" />
                  </div>
                  <h3 className={`text-2xl font-display font-bold mb-3 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    {article.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {article.description}
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-zinc-500/10 flex items-center text-xs font-bold uppercase tracking-widest group-hover:text-indigo-500 transition-colors">
                  Read Article &rarr;
                </div>
              </Link>
            ))}
          </div>

        </motion.div>
      </article>
    </div>
  );
}
