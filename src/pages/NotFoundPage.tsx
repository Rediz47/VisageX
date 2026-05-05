import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeProvider';
import SEO from '../components/SEO';

export default function NotFoundPage() {
  const { isDarkMode } = useTheme();

  return (
    <>
      <SEO
        title="404 — Page Not Found | VisageX"
        description="The page you're looking for doesn't exist."
        noindex={true}
      />
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-lg"
        >
          <div className="mb-8">
            <span
              className={`text-[140px] md:text-[200px] font-display italic leading-none tracking-tighter ${isDarkMode ? 'text-zinc-800' : 'text-zinc-200'}`}
            >
              404
            </span>
          </div>
          <h1
            className={`text-3xl md:text-4xl font-display italic mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
          >
            Page not found
          </h1>
          <p
            className={`text-base mb-10 font-light ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}
          >
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all duration-300 shadow-xl shadow-indigo-500/20"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className={`flex items-center gap-2 px-8 py-4 rounded-full border font-bold text-xs uppercase tracking-widest transition-all duration-300 ${isDarkMode ? 'border-white/10 text-white/60 hover:bg-white/5' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
