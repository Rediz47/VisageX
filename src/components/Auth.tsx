import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  ArrowRight, 
  Github, 
  Chrome,
  X,
  AlertCircle,
  Users
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  initialMode?: 'signin' | 'signup';
  initialReferralCode?: string;
}

export function Auth({ isOpen, onClose, isDarkMode, initialMode = 'signin', initialReferralCode = '' }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Sync state with initialMode when modal opens
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          role: 'user',
          credits: 0, // 0 free scans for new users
          referralCode: myReferralCode,
          invitedCount: 0
        });
        
        try {
          await fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, name: user.displayName, userId: user.uid })
          });
        } catch (e) {
          console.error("Failed to send welcome email", e);
        }
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fingerprint = `${window.screen.width}x${window.screen.height}-${navigator.userAgent}`;
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: name,
          referredBy: null, // Initial state
          createdAt: serverTimestamp(),
          role: 'user',
          credits: 0,
          referralCode: myReferralCode,
          invitedCount: 0
        });
        
        // If a referral code was entered, redeem it
        const referralInput = (e.target as any).referralCode?.value;
        if (referralInput) {
          try {
            await fetch('/api/referral/redeem', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                userId: result.user.uid, 
                referralCode: referralInput,
                fingerprint
              })
            });
          } catch (e) {
            console.error("Failed to redeem referral code", e);
          }
        }

        try {
          await fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: result.user.email, name, userId: result.user.uid })
          });
        } catch (e) {
          console.error("Failed to send welcome email", e);
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

  // --- FORGOT PASSWORD VIEW ---
  if (isForgotPassword) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-full max-w-md overflow-hidden rounded-[2.5rem] border shadow-2xl ${
            isDarkMode ? 'bg-black border-white/10' : 'bg-white border-zinc-200'
          }`}
        >
          <button
            onClick={onClose}
            className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-black/5 text-[#86868b]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 mb-6 shadow-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h2 className={`text-3xl font-display font-bold tracking-tight mb-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {resetSent ? 'Check your email' : 'Reset Password'}
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>
                {resetSent
                  ? 'A password reset link has been sent. Check your inbox (and spam folder).'
                  : 'Enter your email and we\'ll send a reset link.'}
              </p>
            </div>
            {!resetSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-white/20 group-focus-within:text-white' : 'text-zinc-500 group-focus-within:text-black'}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none transition-all duration-300 text-sm ${
                      isDarkMode
                        ? 'bg-white/5 border-white/10 text-white focus:border-white/50 focus:bg-white/10'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-black/50 focus:bg-white'
                    }`}
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
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-500 ${
                    isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-black'
                  }`}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            ) : (
              <button
                onClick={() => { setIsForgotPassword(false); setResetSent(false); }}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-500 ${
                  isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-black'
                }`}
              >
                Back to Sign In
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`relative w-full max-w-md overflow-hidden rounded-[2.5rem] border shadow-2xl ${
          isDarkMode ? 'bg-black border-white/10' : 'bg-white border-zinc-200'
        }`}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${
            isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-black/5 text-[#86868b]'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
              <img src="/logo.png" alt="VisageX Logo" className="w-full h-full object-contain drop-shadow-xl" />
            </div>
            <h2 className={`text-3xl font-display font-extrabold tracking-tight mb-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>
              {isSignUp ? 'Join Visage for personalized neural insights.' : 'Sign in to access your facial analysis history.'}
            </p>
          </div>

          {/* Social Login */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border font-bold text-sm transition-all duration-300 mb-6 ${
              isDarkMode 
                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm'
            }`}
          >
            <Chrome className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} />
            Continue with Google
          </button>

          <div className="relative mb-8">
            <div className={`absolute inset-0 flex items-center ${isDarkMode ? 'opacity-10' : 'opacity-10'}`}>
              <div className="w-full border-t border-current" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-bold">
              <span className={`px-4 ${isDarkMode ? 'bg-black text-white/30' : 'bg-white text-zinc-500'}`}>
                Or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-white/20 group-focus-within:text-white' : 'text-zinc-500 group-focus-within:text-black'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <input 
                  type="text"
                  placeholder="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none transition-all duration-300 text-sm ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white focus:border-white/50 focus:bg-white/10' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-black/50 focus:bg-white'
                  }`}
                />
              </div>
            )}
            <div className="relative group">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-white/20 group-focus-within:text-white' : 'text-zinc-500 group-focus-within:text-black'}`}>
                <Mail className="w-4 h-4" />
              </div>
              <input 
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none transition-all duration-300 text-sm ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 text-white focus:border-white/50 focus:bg-white/10' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-black/50 focus:bg-white'
                }`}
              />
            </div>
            {/* Password field + forgot password link */}
            <div className="relative group">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-white/20 group-focus-within:text-white' : 'text-zinc-500 group-focus-within:text-black'}`}>
                <Lock className="w-4 h-4" />
              </div>
              <input 
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none transition-all duration-300 text-sm ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 text-white focus:border-white/50 focus:bg-white/10' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-black/50 focus:bg-white'
                }`}
              />
            </div>
            {!isSignUp && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setError(null); }}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    isDarkMode ? 'text-white/30 hover:text-white' : 'text-zinc-400 hover:text-zinc-800'
                  }`}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {isSignUp && (
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-white/20 group-focus-within:text-white' : 'text-zinc-500 group-focus-within:text-black'}`}>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <input 
                  type="text"
                  name="referralCode"
                  placeholder="Referral Code (Optional)"
                  defaultValue={initialReferralCode}
                  className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none transition-all duration-300 text-sm ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white focus:border-white/50 focus:bg-white/10' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-black/50 focus:bg-white'
                  }`}
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
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-white text-black hover:bg-zinc-200' 
                  : 'bg-zinc-900 text-white hover:bg-black'
              }`}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                isDarkMode ? 'text-white/40 hover:text-white' : 'text-zinc-500 hover:text-black'
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
