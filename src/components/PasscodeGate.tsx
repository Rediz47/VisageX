import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function PasscodeGate({
  children,
  isDarkMode
}: {
  children: React.ReactNode;
  isDarkMode: boolean;
}) {
  // Check if a password is set in the environment variables
  const expectedPassword = import.meta.env.VITE_SITE_PASSWORD;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    // If no password is set in the environment, the site is public
    if (!expectedPassword) {
      setIsAuthenticated(true);
      return;
    }

    // Check if they already entered the password previously
    const saved = localStorage.getItem('site_auth');
    if (saved === expectedPassword) {
      setIsAuthenticated(true);
    }
  }, [expectedPassword]);

  if (isAuthenticated || !expectedPassword) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === expectedPassword) {
      localStorage.setItem('site_auth', password);
      setIsAuthenticated(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center p-6',
        isDarkMode ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'w-full max-w-md p-8 rounded-3xl border shadow-2xl',
          isDarkMode ? 'bg-zinc-900/50 border-white/10' : 'bg-white border-zinc-200'
        )}
      >
        <div className="flex justify-center mb-6">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center',
              isDarkMode ? 'bg-white/5' : 'bg-zinc-100'
            )}
          >
            <Lock className={cn('w-8 h-8', isDarkMode ? 'text-white/70' : 'text-zinc-600')} />
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-center mb-2">Private Access</h2>
        <p
          className={cn('text-center mb-8 text-sm', isDarkMode ? 'text-white/50' : 'text-zinc-500')}
        >
          This website is password protected. Please enter the passcode to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter passcode"
              className={cn(
                'w-full px-4 py-3 rounded-xl border outline-none transition-all text-center tracking-widest',
                isDarkMode
                  ? 'bg-black/50 border-white/10 focus:border-indigo-500 text-white'
                  : 'bg-zinc-50 border-zinc-200 focus:border-indigo-500 text-zinc-900',
                error && 'border-rose-500 focus:border-rose-500'
              )}
            />
            {error && <p className="text-rose-500 text-xs text-center mt-2">Incorrect passcode</p>}
          </div>

          <button
            type="submit"
            className={cn(
              'w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all',
              isDarkMode
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-zinc-900 text-white hover:bg-black'
            )}
          >
            Enter <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
