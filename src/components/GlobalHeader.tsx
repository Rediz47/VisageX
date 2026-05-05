import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react';
import {
  Sparkles,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  History as HistoryIcon,
  Coins,
  BookOpen
} from 'lucide-react';
import { useTheme } from '../context/ThemeProvider';
import { useAuth } from '../context/AuthProvider';
import { useCredits } from '../context/CreditsProvider';
import { useMotionTier } from '../context/MotionProvider';
import { easings } from '../lib/motion';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export function GlobalHeader({
  onOpenAuth,
  onOpenPricing
}: {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenPricing: () => void;
}) {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { credits } = useCredits();
  const { preset, prefersReducedMotion } = useMotionTier();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navClass = (active: boolean) =>
    `text-sm font-medium transition-colors duration-300 ${
      active
        ? isDarkMode
          ? 'text-zinc-100 border-b border-white/70 pb-1'
          : 'text-zinc-950 border-b border-zinc-950 pb-1'
        : isDarkMode
          ? 'text-zinc-100/50 hover:text-white'
          : 'text-zinc-500 hover:text-black'
    }`;

  // Header hide-on-scroll-down / reveal-on-scroll-up.
  // Critical-priority, throttled via scroll hook, transform-only (compositor-safe).
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (prefersReducedMotion) {
      setHidden(false);
      return;
    }
    const delta = latest - lastY.current;
    if (latest < 120) {
      if (hidden) setHidden(false);
    } else if (delta > 8 && !hidden) {
      setHidden(true);
    } else if (delta < -8 && hidden) {
      setHidden(false);
    }
    lastY.current = latest;
  });

  const handleSignOut = () => {
    signOut(auth);
    navigate('/');
  };

  const handleLogoClick = () => {
    if ((window as any).lenis) {
      (window as any).lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.header
        animate={{ y: hidden ? -100 : 0 }}
        transition={{ duration: preset.durations.med, ease: easings.easeOutExpo }}
        className={`fixed top-0 inset-x-0 z-50 border-b backdrop-blur-xl transition-colors ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-zinc-200 bg-white/40'}`}
        style={{ transitionDuration: 'var(--dur-slow)' }}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group" onClick={handleLogoClick}>
            <div className="w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <img
                src="/logo.png"
                alt="VisageX Logo"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
            <span
              className={`font-display font-extrabold text-3xl tracking-tighter ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
            >
              VISAGE<span className={isDarkMode ? 'text-white/20' : 'text-zinc-900/10'}>X</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={navClass(pathname === '/')}
            >
              Analyzer
            </Link>
            <Link
              to="/methodology"
              className={navClass(pathname === '/methodology')}
            >
              Methodology
            </Link>
            <Link
              to="/blog"
              className={navClass(pathname.startsWith('/blog'))}
            >
              The Hub
            </Link>

            <button
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`p-2.5 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-white/5 text-zinc-100/70 hover:text-white hover:bg-white/10' : 'bg-zinc-900/5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-900/10'}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={onOpenPricing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'}`}
                >
                  <Coins className="w-4 h-4" />
                  <span className="text-xs font-bold">{credits}</span>
                </button>
                <Link
                  to="/history"
                  title="View History"
                  className={`p-2.5 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-white/5 text-zinc-100/70 hover:text-white hover:bg-white/10' : 'bg-zinc-900/5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-900/10'}`}
                >
                  <HistoryIcon className="w-5 h-5" />
                </Link>
                <Link
                  to="/profile"
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-colors duration-300 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-zinc-900/5 border-zinc-200 hover:bg-zinc-900/10'}`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || ''}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <UserIcon
                      className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                    />
                  )}
                  <span
                    className={`text-xs font-bold uppercase tracking-widest hidden lg:block ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
                  >
                    {user.displayName?.split(' ')[0] || 'User'}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className={`p-2.5 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-white/5 text-zinc-100/70 hover:text-rose-400 hover:bg-rose-500/10' : 'bg-zinc-900/5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50'}`}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <button
                  onClick={() => onOpenAuth('signin')}
                  className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-300 ${isDarkMode ? 'text-white/40 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-black'}`}
                >
                  Sign Up
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Actions Container (Top Right) */}
          <div className="flex items-center space-x-3 md:hidden">
            {user ? (
              <button
                onClick={onOpenPricing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${isDarkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">{credits}</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth('signup')}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-black'}`}
              >
                Sign Up
              </button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Modern Mobile Bottom Navigation Bar */}
      <div
        className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-[90%] max-w-[400px] px-6 py-3 rounded-[2rem] shadow-2xl border backdrop-blur-md transition-all duration-300 ${isDarkMode ? 'bg-zinc-900/80 border-white/10' : 'bg-white/90 border-zinc-200'}`}
      >
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 p-2 ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-widest uppercase">Scan</span>
        </Link>
        <Link
          to="/blog"
          className={`flex flex-col items-center gap-1 p-2 ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-widest uppercase">Hub</span>
        </Link>
        {user ? (
          <>
            <Link
              to="/history"
              className={`flex flex-col items-center gap-1 p-2 ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <HistoryIcon className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-widest uppercase">Past</span>
            </Link>
            <Link
              to="/profile"
              className={`flex flex-col items-center gap-1 p-2 ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="w-5 h-5 rounded-full ring-2 ring-transparent"
                />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
              <span className="text-[9px] font-bold tracking-widest uppercase">Me</span>
            </Link>
          </>
        ) : (
          <button
            onClick={() => onOpenAuth('signin')}
            className={`flex flex-col items-center gap-1 p-2 ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-widest uppercase">Log In</span>
          </button>
        )}
      </div>
    </>
  );
}
