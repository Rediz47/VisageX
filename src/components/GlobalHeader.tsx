import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Menu, X, Sun, Moon, LogOut, User as UserIcon, History as HistoryIcon, Coins } from 'lucide-react';
import { useTheme } from '../context/ThemeProvider';
import { useAuth } from '../context/AuthProvider';
import { useCredits } from '../context/CreditsProvider';
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
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut(auth);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-50 border-b backdrop-blur-xl transition-all duration-500 ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-zinc-200 bg-white/40'}`}>
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-4 group" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className={`font-display font-bold text-2xl tracking-tighter ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
              VISAGE<span className={isDarkMode ? 'text-white/20' : 'text-zinc-900/10'}>X</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-zinc-100/90 hover:text-white' : 'text-zinc-900/80 hover:text-black'}`}>
              Analyzer
            </Link>
            <Link to="/methodology" className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-zinc-100/50 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>
              Methodology
            </Link>
            <Link to="/blog" className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-zinc-100/50 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>
              The Hub
            </Link>

            <button onClick={toggleTheme} className={`p-2.5 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-white/5 text-zinc-100/70 hover:text-white hover:bg-white/10' : 'bg-zinc-900/5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-900/10'}`}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <button onClick={onOpenPricing} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'}`}>
                  <Coins className="w-4 h-4" />
                  <span className="text-xs font-bold">{credits}</span>
                </button>
                <Link to="/history" title="View History" className={`p-2.5 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-white/5 text-zinc-100/70 hover:text-white hover:bg-white/10' : 'bg-zinc-900/5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-900/10'}`}>
                  <HistoryIcon className="w-5 h-5" />
                </Link>
                <Link to="/profile" className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-zinc-900/5 border-zinc-200 hover:bg-zinc-900/10'}`}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded-full" />
                  ) : (
                    <UserIcon className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`} />
                  )}
                  <span className={`text-xs font-bold uppercase tracking-widest hidden lg:block ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    {user.displayName?.split(' ')[0] || 'User'}
                  </span>
             </Link>
                <button onClick={handleSignOut} className={`p-2.5 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-white/5 text-zinc-100/70 hover:text-rose-400 hover:bg-rose-500/10' : 'bg-zinc-900/5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50'}`}>
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <button onClick={() => onOpenAuth('signin')} className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-colors ${isDarkMode ? 'text-white/40 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}>
                  Sign In
                </button>
                <button onClick={() => onOpenAuth('signup')} className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-black'}`}>
                  Sign Up
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center space-x-4 md:hidden">
            {user && (
              <button onClick={onOpenPricing} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${isDarkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                <Coins className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{credits}</span>
              </button>
            )}
            <button onClick={toggleTheme} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 text-zinc-100/70 hover:text-white' : 'bg-zinc-900/5 text-zinc-500 hover:text-zinc-900'}`}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className={`p-2 transition-colors ${isDarkMode ? 'text-zinc-100/70 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed inset-x-0 top-20 z-40 border-b md:hidden ${isDarkMode ? 'bg-black border-white/5' : 'bg-white border-zinc-200'}`}
          >
            <div className="flex flex-col p-6 space-y-4">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium text-left ${isDarkMode ? 'text-zinc-100/90' : 'text-zinc-900'}`}>
                Analyzer
              </Link>
              <Link to="/methodology" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium text-left ${isDarkMode ? 'text-zinc-100/50' : 'text-zinc-500'}`}>
                Methodology
              </Link>
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium text-left ${isDarkMode ? 'text-zinc-100/50' : 'text-zinc-500'}`}>
                The Hub
              </Link>
              {user ? (
                <>
                  <Link to="/history" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium text-left ${isDarkMode ? 'text-zinc-100/50' : 'text-zinc-500'}`}>
                    History
                  </Link>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium text-left ${isDarkMode ? 'text-zinc-100/50' : 'text-zinc-500'}`}>
                    Profile
                  </Link>
                  <button onClick={handleSignOut} className="mt-4 px-5 py-3 rounded-xl bg-rose-500/10 text-rose-500 font-bold flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3 mt-4">
                  <button onClick={() => { onOpenAuth('signin'); setMobileMenuOpen(false); }} className={`w-full py-3 rounded-xl font-bold text-sm border ${isDarkMode ? 'border-white/10 text-zinc-100' : 'border-zinc-200 text-zinc-900'}`}>
                    Sign In
                  </button>
                  <button onClick={() => { onOpenAuth('signup'); setMobileMenuOpen(false); }} className={`w-full py-3 rounded-xl font-bold text-sm ${isDarkMode ? 'bg-white text-black' : 'bg-zinc-900 text-white'}`}>
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
