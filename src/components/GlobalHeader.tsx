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
  BookOpen,
  CheckCircle2,
  ChevronDown
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
  const [accountOpen, setAccountOpen] = useState(false);
  const lastY = useRef(0);
  const userName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
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
    setAccountOpen(false);
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
            <Link to="/" className={navClass(pathname === '/')}>
              Analyzer
            </Link>
            <Link to="/methodology" className={navClass(pathname === '/methodology')}>
              Methodology
            </Link>
            <Link to="/blog" className={navClass(pathname.startsWith('/blog'))}>
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 shadow-lg shadow-amber-950/10' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 shadow-sm'}`}
                >
                  <Coins className="w-4 h-4" />
                  <span className="text-xs font-black">{credits} credits</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setAccountOpen((value) => !value)}
                    className={`group flex items-center gap-3 rounded-2xl border py-2 pl-2 pr-3 transition-all duration-300 ${isDarkMode ? 'border-white/10 bg-white/[0.06] hover:bg-white/[0.1] shadow-2xl shadow-indigo-950/10' : 'border-zinc-200 bg-white/70 hover:bg-white shadow-lg shadow-zinc-200/40'}`}
                  >
                    <div className="relative">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || ''}
                          className="h-9 w-9 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-sm font-black text-white">
                          {userInitial}
                        </div>
                      )}
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
                    </div>
                    <div className="hidden min-w-0 text-left lg:block">
                      <div
                        className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.22em] ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Signed in
                      </div>
                      <p
                        className={`max-w-[120px] truncate text-sm font-black ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}
                      >
                        {userName}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${accountOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-white/40' : 'text-zinc-400'}`}
                    />
                  </button>

                  <AnimatePresence>
                    {accountOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: preset.durations.fast, ease: easings.easeOutExpo }}
                        className={`absolute right-0 top-[calc(100%+0.75rem)] w-72 overflow-hidden rounded-[1.5rem] border p-2 shadow-2xl backdrop-blur-2xl ${isDarkMode ? 'border-white/10 bg-zinc-950/95 shadow-black/40' : 'border-zinc-200 bg-white/95 shadow-zinc-300/40'}`}
                      >
                        <div
                          className={`rounded-[1.25rem] p-4 ${isDarkMode ? 'bg-white/[0.04]' : 'bg-zinc-50'}`}
                        >
                          <p
                            className={`text-[10px] font-black uppercase tracking-[0.25em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                          >
                            Account active
                          </p>
                          <p
                            className={`mt-1 truncate text-base font-black ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}
                          >
                            {user.displayName || userName}
                          </p>
                          <p
                            className={`truncate text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}
                          >
                            {user.email}
                          </p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setAccountOpen(false)}
                          className={`mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${isDarkMode ? 'text-zinc-300 hover:bg-white/10 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'}`}
                        >
                          <UserIcon className="h-4 w-4" />
                          Profile
                        </Link>
                        <Link
                          to="/history"
                          onClick={() => setAccountOpen(false)}
                          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${isDarkMode ? 'text-zinc-300 hover:bg-white/10 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'}`}
                        >
                          <HistoryIcon className="h-4 w-4" />
                          Scan history
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition-colors ${isDarkMode ? 'text-rose-300 hover:bg-rose-500/10' : 'text-rose-600 hover:bg-rose-50'}`}
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
              <>
                <div
                  className={`flex items-center gap-2 rounded-2xl border px-2 py-1.5 ${isDarkMode ? 'border-white/10 bg-white/[0.06]' : 'border-zinc-200 bg-white/80'}`}
                >
                  <div className="relative">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || ''}
                        className="h-8 w-8 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-xs font-black text-white">
                        {userInitial}
                      </div>
                    )}
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
                  </div>
                  <div className="max-w-[82px]">
                    <p
                      className={`truncate text-[10px] font-black leading-none ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}
                    >
                      {userName}
                    </p>
                    <p
                      className={`mt-1 flex items-center gap-1 text-[9px] font-bold leading-none ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`}
                    >
                      <Coins className="h-3 w-3" />
                      {credits}
                    </p>
                  </div>
                </div>
              </>
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
