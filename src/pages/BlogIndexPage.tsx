import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, Brain, Trophy, Eye, MoveDown, Feather, ImagePlus } from 'lucide-react';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeProvider';

export default function BlogIndexPage() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const featuredArticle = {
    title: "Best AI Face Analysis Tool",
    description: "Compare the top scanners and see why clinic-grade 3D geometry tests are the only way to accurately map your facial harmony and potential before committing to procedures.",
    icon: Trophy,
    color: "amber",
    link: "/blog/best-ai-face-analysis-tool",
    // To add your image, change this line to something like:
    // heroImage: "/images/best-tool-cover.jpg",
    heroImage: "" 
  };

  const articles = [
    {
      title: "How to Improve Face Symmetry",
      description: "Learn how to fix asymmetrical facial features naturally with sleep posture, chewing habits, and mewing.",
      icon: Sparkles,
      color: "emerald",
      link: "/blog/how-to-improve-face-symmetry",
      thumbnail: "" // e.g., "/images/symmetry-thumb.jpg"
    },
    {
      title: "AI Face Analysis Explained",
      description: "Discover the science behind the 468-point neural mesh, golden ratio, and how algorithms rate your face.",
      icon: Brain,
      color: "indigo",
      link: "/blog/ai-face-analysis-explained",
      thumbnail: "" 
    },
    {
      title: "What is Canthal Tilt?",
      description: "The secret to 'Hunter Eyes'. Learn the geometry behind eye attractiveness.",
      icon: Eye,
      color: "sky",
      link: "/blog/what-is-canthal-tilt",
      thumbnail: "" 
    },
    {
      title: "How to Fix a Recessed Jawline",
      description: "Non-surgical ways to build a stronger front profile. The guide to masseter growth.",
      icon: MoveDown,
      color: "rose",
      link: "/blog/how-to-fix-recessed-jawline",
      thumbnail: "" 
    },
    {
      title: "Does Gua Sha Work for Face Fat?",
      description: "Dermatologists break down the truth behind facial massage and lymphatic drainage.",
      icon: Feather,
      color: "purple",
      link: "/blog/does-gua-sha-work",
      thumbnail: "" 
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
      <SEO 
        title="Glow-Up Academy | Aesthetics & AI Face Analysis Guides"
        description="The ultimate resource for facial aesthetics, looksmaxxing techniques, and understanding your facial geometry."
        canonical="https://visagex.online/blog"
      />

      <article className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-16"
        >
          {/* Premium Left-Aligned Header */}
          <header className="max-w-4xl space-y-6 pb-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${isDarkMode ? 'border-zinc-500/30 text-zinc-300 bg-zinc-500/10' : 'border-zinc-200 text-zinc-600 bg-zinc-100'}`}>
              <BookOpen className="w-4 h-4" />
              The Glow-Up Library
            </div>
            <h1 className={`text-5xl md:text-7xl lg:text-8xl font-display font-medium tracking-tight leading-[1.05] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Master Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">
                Aesthetics.
              </span>
            </h1>
            <p className={`text-xl md:text-2xl font-light max-w-2xl leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Clinical guides, AI breakdowns, and proven routines to naturally enhance your facial harmony.
            </p>
          </header>

          <div className="mt-16 border-t border-zinc-500/10 pt-16">
            <h2 className={`text-sm font-bold uppercase tracking-[0.3em] mb-8 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Featured Publication
            </h2>
            
            {/* FEATURED HERO ARTICLE */}
            <Link 
              to={featuredArticle.link}
              className={`group block rounded-[3rem] overflow-hidden border transition-all duration-500 hover:-translate-y-2 ${
                isDarkMode 
                  ? 'bg-zinc-900/50 border-white/5 hover:border-white/10 hover:bg-zinc-800/50' 
                  : 'bg-white border-zinc-200 shadow-xl hover:shadow-2xl'
              }`}
            >
              <div className="flex flex-col lg:flex-row">
                {/* 
                  =======================================================
                  HERO IMAGE PLACEHOLDER:
                  If featuredArticle.heroImage has a URL (e.g. "/images/photo.png"), it will show. 
                  Otherwise, it shows the blank drop-zone.
                  =======================================================
                */}
                <div className={`w-full lg:w-3/5 aspect-video md:aspect-[16/9] lg:aspect-auto flex items-center justify-center relative overflow-hidden ${
                  isDarkMode ? 'bg-black/40' : 'bg-zinc-100'
                }`}>
                  {featuredArticle.heroImage ? (
                    <img 
                      src={featuredArticle.heroImage} 
                      alt={featuredArticle.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`flex flex-col items-center justify-center space-y-3 w-full h-full border-2 border-dashed ${isDarkMode ? 'border-zinc-800 text-zinc-600' : 'border-zinc-300 text-zinc-400'} rounded-3xl m-6`}>
                      <ImagePlus className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-sm font-bold tracking-widest uppercase">Insert Hero Cover</p>
                      <p className="text-xs font-light text-center px-4">Find code: featuredArticle.heroImage</p>
                    </div>
                  )}
                </div>

                {/* Featured Text Content */}
                <div className="w-full lg:w-2/5 p-10 md:p-14 flex flex-col justify-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-500 ${
                    isDarkMode 
                      ? `bg-${featuredArticle.color}-500/20 text-${featuredArticle.color}-400`
                      : `bg-${featuredArticle.color}-50 text-${featuredArticle.color}-600`
                  }`}>
                    <featuredArticle.icon className="w-7 h-7" />
                  </div>
                  <h3 className={`text-4xl md:text-5xl font-display font-medium mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {featuredArticle.title}
                  </h3>
                  <p className={`text-lg leading-relaxed mb-10 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {featuredArticle.description}
                  </p>
                  <div className="mt-auto flex items-center text-sm font-bold uppercase tracking-widest text-amber-500 transition-colors">
                    Read the Guide &rarr;
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* STANDARD GRID ARTICLES */}
          <div className="pt-8">
            <h2 className={`text-sm font-bold uppercase tracking-[0.3em] mb-8 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              The Library
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, i) => (
                <Link 
                  key={i} 
                  to={article.link}
                  className={`group rounded-[2.5rem] overflow-hidden border transition-all duration-500 hover:-translate-y-2 flex flex-col h-full ${
                    isDarkMode 
                      ? 'bg-zinc-900/50 border-white/5 hover:bg-white/[0.05] hover:border-white/10' 
                      : 'bg-white border-zinc-200 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {/* Thumbnail Row */}
                  <div className={`w-full aspect-[16/9] relative overflow-hidden flex items-center justify-center ${
                    isDarkMode ? 'bg-black/60' : 'bg-zinc-100'
                  }`}>
                    {article.thumbnail ? (
                      <img 
                        src={article.thumbnail} 
                        alt={article.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`flex flex-col items-center justify-center space-y-2 w-full h-full border border-dashed ${isDarkMode ? 'border-zinc-800 text-zinc-600' : 'border-zinc-300 text-zinc-400'} rounded-2xl m-4`}>
                        <ImagePlus className="w-8 h-8 opacity-50" />
                        <p className="text-[10px] font-bold tracking-widest uppercase">Insert Thumbnail</p>
                        <p className="text-[10px] opacity-70">articles[{i}].thumbnail</p>
                      </div>
                    )}
                  </div>

                  <div className="p-8 flex-grow flex flex-col">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 ${
                      isDarkMode 
                        ? `bg-${article.color}-500/20 text-${article.color}-400`
                        : `bg-${article.color}-50 text-${article.color}-600`
                    }`}>
                      <article.icon className="w-5 h-5" />
                    </div>
                    <h3 className={`text-2xl font-display font-bold mb-3 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      {article.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {article.description}
                    </p>
                    <div className="mt-8 pt-6 border-t border-zinc-500/10 flex items-center text-xs font-bold uppercase tracking-[0.2em] group-hover:text-indigo-500 transition-colors">
                      View Details &rarr;
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </motion.div>
      </article>
    </div>
  );
}
