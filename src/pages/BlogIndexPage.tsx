import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Sparkles,
  Trophy,
  Eye,
  MoveDown,
  Feather,
  Search,
  Layers,
  Star,
  ArrowRight
} from 'lucide-react';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeProvider';

export default function BlogIndexPage() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const featuredArticle = {
    title: 'Best AI Face Analysis Tool',
    description:
      'A practical guide to what AI face scanners can measure, what they should not claim, and how to read your results without fake precision.',
    icon: Trophy,
    color: 'amber',
    link: '/blog/best-ai-face-analysis-tool',
    heroImage: '/main-hero.png',
    tag: 'Featured',
    readTime: '7 min read'
  };

  const articles = [
    {
      title: 'How to Improve Face Symmetry',
      description:
        'Simple habits that may help your face look more balanced in photos, without overpromising permanent structural change.',
      icon: Sparkles,
      color: 'emerald',
      link: '/blog/how-to-improve-face-symmetry',
      tag: 'Face balance',
      readTime: '5 min'
    },

    {
      title: 'What is Canthal Tilt?',
      description: 'A clear breakdown of eye angle, how it affects facial expression, and why lighting and pose matter too.',
      icon: Eye,
      color: 'sky',
      link: '/blog/what-is-canthal-tilt',
      tag: 'Eye area',
      readTime: '4 min'
    },
    {
      title: 'How to Fix a Recessed Jawline',
      description:
        'Grooming, posture, body composition, and styling ideas that can make the lower face look sharper.',
      icon: MoveDown,
      color: 'rose',
      link: '/blog/how-to-fix-recessed-jawline',
      tag: 'Jawline',
      readTime: '6 min'
    },
    {
      title: 'Does Gua Sha Work for Face Fat?',
      description:
        'What facial massage can realistically do for puffiness, and what it cannot do for actual fat loss.',
      icon: Feather,
      color: 'purple',
      link: '/blog/does-gua-sha-work',
      tag: 'Skincare',
      readTime: '4 min'
    },
    {
      title: 'Free AI Face Analysis — What Actually Works',
      description:
        'How to spot useful geometry feedback versus apps that only show random-looking scores.',
      icon: Search,
      color: 'indigo',
      link: '/blog/free-ai-face-analysis',
      tag: 'AI tools',
      readTime: '8 min'
    },
    {
      title: 'The Complete Mewing Guide 2026',
      description:
        'Technique, realistic expectations, and how to build better tongue posture as a daily habit.',
      icon: Layers,
      color: 'emerald',
      link: '/blog/complete-mewing-guide',
      tag: 'Habits',
      readTime: '7 min'
    },
    {
      title: 'Looksmaxxing Routine for Beginners',
      description:
        'A beginner-friendly routine built around skincare, grooming, sleep, fitness, hair, and style.',
      icon: Star,
      color: 'rose',
      link: '/blog/looksmaxxing-routine-for-beginners',
      tag: 'Routine',
      readTime: '6 min'
    }
  ];

  const siteUrl = 'https://visagex.online';
  const allArticles = [featuredArticle, ...articles];
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'VisageX',
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/blog?search={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'VisageX',
      url: siteUrl,
      logo: `${siteUrl}/og-default.png`,
      sameAs: []
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Glow-Up Library',
          item: `${siteUrl}/blog`
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Glow-Up Library articles',
      itemListElement: allArticles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}${article.link}`,
        name: article.title,
        description: article.description
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the Glow-Up Library?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The Glow-Up Library is a collection of practical guides about AI face analysis, grooming, skincare, hair, habits, and facial aesthetics.'
          }
        },
        {
          '@type': 'Question',
          name: 'Can AI face analysis give exact scientific scores?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AI face analysis can estimate visible patterns like symmetry, proportions, and texture from a photo, but results depend on lighting, angle, image quality, and what is visible.'
          }
        },
        {
          '@type': 'Question',
          name: 'Are the guides medical advice?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. The guides are educational and focused on visible appearance, grooming, skincare habits, and realistic self-improvement. They are not medical diagnosis or treatment advice.'
          }
        }
      ]
    }
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}
    >
      <SEO
        title="Glow-Up Library | Aesthetics & AI Face Analysis Guides"
        description="Clear guides for facial aesthetics, grooming, skincare, and understanding AI face analysis without fake precision."
        canonical="https://visagex.online/blog"
        keywords="AI face analysis, face symmetry test, facial aesthetics, glow up guide, looksmaxxing routine, canthal tilt, jawline guide, mewing guide, skincare guide"
        jsonLd={jsonLd}
      />

      <article className="pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-12"
        >
          <header
            className={`relative overflow-hidden rounded-[2rem] border p-7 sm:p-10 lg:p-12 ${isDarkMode ? 'bg-white/[.025] border-white/[.07]' : 'bg-white border-zinc-200 shadow-sm'}`}
          >
            <div className="absolute right-0 top-0 w-72 h-72 bg-gradient-to-br from-indigo-500/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
            <div
              className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[.25em] border mb-6 ${isDarkMode ? 'border-white/[.08] text-white/45 bg-white/[.03]' : 'border-zinc-200 text-zinc-500 bg-zinc-50'}`}
            >
              <BookOpen className="w-4 h-4" />
              The Glow-Up Library
            </div>
            <h1
              className={`relative max-w-4xl text-4xl md:text-6xl lg:text-7xl font-display italic tracking-tight leading-[1.02] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              Better guides for{' '}
              <span className="not-italic font-sans font-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
                real glow-ups.
              </span>
            </h1>
            <p
              className={`relative mt-6 text-base md:text-lg font-light max-w-2xl leading-relaxed ${isDarkMode ? 'text-white/50' : 'text-zinc-500'}`}
            >
              Practical articles about face analysis, grooming, skincare, hair, and habits — written
              to be useful, realistic, and easy to understand.
            </p>
          </header>

          <div className="border-t border-zinc-500/10 pt-10">
            <h2
              className={`text-sm font-bold uppercase tracking-[0.3em] mb-8 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
            >
              Featured Publication
            </h2>

            {/* FEATURED HERO ARTICLE */}
            <Link
              to={featuredArticle.link}
              className={`group block rounded-[2rem] overflow-hidden border transition-all duration-500 hover:-translate-y-1 ${
                isDarkMode
                  ? 'bg-white/[.025] border-white/[.07] hover:border-white/[.12]'
                  : 'bg-white border-zinc-200 shadow-sm hover:shadow-xl'
              }`}
            >
              <div className="grid lg:grid-cols-[0.95fr,1.05fr]">
                <div
                  className={`relative min-h-[280px] flex items-center justify-center overflow-hidden p-6 sm:p-8 ${
                    isDarkMode ? 'bg-black/25' : 'bg-zinc-50'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-purple-500/10" />
                  <img
                    src={featuredArticle.heroImage}
                    alt={featuredArticle.title}
                    className="relative w-full max-w-md rounded-[1.75rem] object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="p-8 md:p-10 lg:p-12 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                      <featuredArticle.icon className="w-3.5 h-3.5" />
                      {featuredArticle.tag}
                    </span>
                    <span className={isDarkMode ? 'text-xs text-white/35' : 'text-xs text-zinc-400'}>
                      {featuredArticle.readTime}
                    </span>
                  </div>
                  <h3
                    className={`text-3xl md:text-5xl font-display italic tracking-tight mb-5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
                  >
                    {featuredArticle.title}
                  </h3>
                  <p
                    className={`text-base md:text-lg font-light leading-relaxed mb-8 ${isDarkMode ? 'text-white/50' : 'text-zinc-600'}`}
                  >
                    {featuredArticle.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-500 transition-colors">
                    Read article <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* STANDARD GRID ARTICLES */}
          <div className="pt-8">
            <h2
              className={`text-sm font-bold uppercase tracking-[0.3em] mb-8 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
            >
              The Library
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article, i) => (
                <Link
                  key={i}
                  to={article.link}
                  className={`group rounded-[1.75rem] overflow-hidden border transition-all duration-500 hover:-translate-y-1 flex flex-col h-full p-6 ${
                    isDarkMode
                      ? 'bg-white/[.025] border-white/[.07] hover:bg-white/[0.045] hover:border-white/[.12]'
                      : 'bg-white border-zinc-200 shadow-sm hover:shadow-xl'
                  }`}
                >
                  <div className="flex-grow flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 duration-500 ${
                          isDarkMode
                            ? `bg-${article.color}-500/15 text-${article.color}-400`
                            : `bg-${article.color}-50 text-${article.color}-600`
                        }`}
                      >
                        <article.icon className="w-5 h-5" />
                      </div>
                      <span className={isDarkMode ? 'text-[10px] text-white/30 font-bold' : 'text-[10px] text-zinc-400 font-bold'}>
                        {article.readTime}
                      </span>
                    </div>
                    <span className={isDarkMode ? 'text-[10px] text-white/35 font-black uppercase tracking-widest mb-3' : 'text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-3'}>
                      {article.tag}
                    </span>
                    <h3
                      className={`text-xl font-display font-bold mb-3 leading-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
                    >
                      {article.title}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed mb-8 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                    >
                      {article.description}
                    </p>
                    <div className="mt-auto pt-5 border-t border-zinc-500/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-indigo-500 transition-colors">
                      Read guide <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
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
