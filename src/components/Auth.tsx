import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  Chrome,
  X,
  AlertCircle,
  Users,
  Brain,
  Shield,
  Zap
} from 'lucide-react';
import { Turnstile } from './Turnstile';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  browserPopupRedirectResolver
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  initialMode?: 'signin' | 'signup';
  initialReferralCode?: string;
}

const PERKS = [
  { icon: <Brain className="w-4 h-4" />, text: '468-landmark facial mapping' },
  { icon: <Shield className="w-4 h-4" />, text: 'Bank-level data privacy' },
  { icon: <Zap className="w-4 h-4" />, text: 'Instant AI-generated reports' },
  { icon: <Sparkles className="w-4 h-4" />, text: 'Personalised glow-up pipeline' }
];

export function Auth({
  isOpen,
  onClose,
  isDarkMode,
  initialMode = 'signin',
  initialReferralCode = ''
}: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === 'signup');
      setIsForgotPassword(false);
      setResetSent(false);
      setResetEmail('');
    }
  }, [isOpen, initialMode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Shared post-signin logic: runs init-user + welcome email
  const postGoogleSignIn = async (user: any) => {
    let isNew = false;
    try {
      const idToken = await user.getIdToken();
      const initRes = await fetch('/api/auth/init-user', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` }
      });
      isNew = initRes.status === 201;
    } catch (e) {
      console.error('init-user failed, continuing:', e);
    }

    if (isNew) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (turnstileToken) headers['x-captcha-token'] = turnstileToken;
        await fetch('/api/email/welcome', {
          method: 'POST',
          headers,
          body: JSON.stringify({ email: user.email, name: user.displayName, userId: user.uid })
        });
      } catch (e) {
        console.error('Failed to send welcome email', e);
      }
    }
  };

  // Handle Google redirect result on component mount (if user came back from redirect flow)
  React.useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await postGoogleSignIn(result.user);
          onClose();
        }
      })
      .catch((err) => {
        console.error('Redirect sign-in error:', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignIn = async () => {
    if (isSignUp && !turnstileToken) {
      setError('Please complete the verification challenge.');
      return;
    }
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      await postGoogleSignIn(result.user);
      onClose();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const code = err?.code || '';

      // Popup was closed/cancelled by user — no need to show a scary error
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setError('Sign-in was cancelled. Please try again.');
        setLoading(false);
        return;
      }

      // Popup blocked by browser — automatically fall back to redirect flow
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await signInWithRedirect(auth, provider);
          // Page will redirect; loading state stays true until return
          return;
        } catch (redirectErr: any) {
          console.error('Redirect fallback failed:', redirectErr);
          setError(
            'Unable to open Google sign-in. Please check your browser settings or try email sign-in.'
          );
        }
      } else if (code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google sign-in. Contact support.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Check your internet connection and try again.');
      } else {
        setError(err?.message || 'Google sign-in failed. Please try email sign-in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !turnstileToken) {
      setError('Please complete the verification challenge.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fingerprint = `${window.screen.width}x${window.screen.height}-${navigator.userAgent}`;
      const captchaHeaders: Record<string, string> = {};
      if (turnstileToken) captchaHeaders['x-captcha-token'] = turnstileToken;

      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: name,
          referredBy: null,
          createdAt: serverTimestamp(),
          role: 'user',
          credits: 0,
          referralCode: myReferralCode,
          invitedCount: 0
        });
        const referralInput = (e.target as any).referralCode?.value;
        if (referralInput) {
          try {
            await fetch('/api/referral/redeem', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...captchaHeaders },
              body: JSON.stringify({
                userId: result.user.uid,
                referralCode: referralInput,
                fingerprint
              })
            });
          } catch (e) {
            console.error('Failed to redeem referral code', e);
          }
        }
        try {
          await fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...captchaHeaders },
            body: JSON.stringify({ email: result.user.email, name, userId: result.user.uid })
          });
        } catch (e) {
          console.error('Failed to send welcome email', e);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Shared input style
  const inputClass = `input-glow w-full pl-12 pr-6 py-4 rounded-2xl border outline-none text-sm ${
    isDarkMode
      ? 'bg-white/[0.05] border-white/[0.08] text-white placeholder-white/25'
      : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
  }`;

  const iconClass = `absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
    isDarkMode
      ? 'text-white/25 group-focus-within:text-indigo-400'
      : 'text-zinc-400 group-focus-within:text-indigo-500'
  }`;

  // ── Forgot Password ──────────────────────────────────────────────────────────
  if (isForgotPassword) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-full max-w-md overflow-hidden rounded-[2.5rem] border shadow-2xl ${
            isDarkMode
              ? 'bg-[#050508] border-white/[0.08]'
              : 'bg-white border-indigo-100 shadow-indigo-500/10'
          }`}
        >
          <button
            onClick={onClose}
            className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-white/10 text-white/30' : 'hover:bg-zinc-100 text-zinc-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))',
                  border: '1px solid rgba(99,102,241,0.2)'
                }}
              >
                <Mail className="w-6 h-6 text-indigo-400" />
              </div>
              <h2
                className={`text-3xl font-display font-extrabold tracking-tight mb-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
              >
                {resetSent ? 'Check your email' : 'Reset Password'}
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>
                {resetSent
                  ? 'A password reset link has been sent. Check your inbox (and spam folder).'
                  : "Enter your email and we'll send a reset link."}
              </p>
            </div>
            {!resetSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative group">
                  <div className={iconClass}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center !rounded-2xl"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetSent(false);
                }}
                className="btn-primary w-full justify-center !rounded-2xl"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main Auth Modal ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`relative w-full max-w-4xl overflow-hidden rounded-[2.5rem] border shadow-2xl flex flex-col md:flex-row ${
          isDarkMode ? 'bg-[#050508] border-white/[0.08]' : 'bg-white border-indigo-100'
        }`}
        style={{
          boxShadow: isDarkMode
            ? '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.1)'
            : '0 40px 120px rgba(99,102,241,0.15), 0 0 0 1px rgba(99,102,241,0.12)'
        }}
      >
        {/* LEFT PANEL — brand/perks (desktop only) */}
        <div
          className="hidden md:flex md:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #1e1b4b 0%, #0f0a2a 40%, #050508 100%)'
          }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-0 left-0 w-72 h-72 rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 70%)',
                filter: 'blur(30px)'
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-56 h-56 rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(34,211,238,0.15) 0%, transparent 70%)',
                filter: 'blur(30px)'
              }}
            />
          </div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-12">
              <div className="w-9 h-9">
                <img src="/logo.png" alt="VisageX" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-extrabold text-xl tracking-tighter text-white">
                VISAGE
                <span
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  X
                </span>
              </span>
            </div>

            <h2 className="text-3xl font-display font-black text-white leading-tight mb-4 italic">
              Discover your
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                true potential.
              </span>
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-10">
              Join thousands who already know their score and are actively improving.
            </p>

            {/* Perks list */}
            <ul className="space-y-4">
              {PERKS.map((perk, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.2)'
                    }}
                  >
                    <span className="text-indigo-400">{perk.icon}</span>
                  </div>
                  <span className="text-sm text-zinc-300 font-medium">{perk.text}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-[10px] text-white/20 font-bold uppercase tracking-widest">
            Trusted by 100,000+ users
          </p>
        </div>

        {/* RIGHT PANEL — form */}
        <div className={`flex-1 flex flex-col p-8 md:p-12 ${isDarkMode ? '' : ''}`}>
          {/* Close */}
          <button
            onClick={onClose}
            className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-white/10 text-white/30' : 'hover:bg-zinc-100 text-zinc-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-8">
            {/* Mobile logo only */}
            <div className="flex md:hidden items-center gap-2 mb-6">
              <div className="w-8 h-8">
                <img src="/logo.png" alt="VisageX" className="w-full h-full object-contain" />
              </div>
            </div>
            <h2
              className={`text-2xl font-display font-extrabold tracking-tight mb-1 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
            >
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>
              {isSignUp
                ? 'Join VisageX for personalized neural insights.'
                : 'Sign in to access your facial analysis history.'}
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border font-bold text-sm transition-all duration-300 mb-6 ${
              isDarkMode
                ? 'bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.08] hover:border-white/[0.15]'
                : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:border-indigo-200 shadow-sm'
            }`}
          >
            {/* Google icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className={`absolute inset-0 flex items-center`}>
              <div
                className={`w-full border-t ${isDarkMode ? 'border-white/[0.06]' : 'border-zinc-200'}`}
              />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black">
              <span
                className={`px-4 ${isDarkMode ? 'bg-[#050508] text-white/25' : 'bg-white text-zinc-400'}`}
              >
                Or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5 flex-1">
            {isSignUp && (
              <div className="relative group">
                <div className={iconClass}>
                  <Users className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}
            <div className="relative group">
              <div className={iconClass}>
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="relative group">
              <div className={iconClass}>
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                  }}
                  className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                    isDarkMode
                      ? 'text-white/25 hover:text-indigo-400'
                      : 'text-zinc-400 hover:text-indigo-500'
                  }`}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {isSignUp && (
              <div className="relative group">
                <div className={iconClass}>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="referralCode"
                  placeholder="Referral Code (Optional)"
                  defaultValue={initialReferralCode}
                  className={inputClass}
                />
              </div>
            )}

            {isSignUp && (
              <div className="flex justify-center">
                <Turnstile
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                  theme={isDarkMode ? 'dark' : 'light'}
                  size="normal"
                />
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || (isSignUp && !turnstileToken)}
              className="btn-primary w-full justify-center !rounded-2xl !py-4 mt-2"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className={`text-xs font-black uppercase tracking-widest transition-colors ${
                isDarkMode
                  ? 'text-white/30 hover:text-indigo-400'
                  : 'text-zinc-400 hover:text-indigo-500'
              }`}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
