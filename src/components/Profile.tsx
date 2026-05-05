import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  CreditCard,
  Trash2,
  LogOut,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

export function Profile({
  onBack,
  isDarkMode,
  userCredits
}: {
  onBack: () => void;
  isDarkMode: boolean;
  userCredits: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onBack();
    } catch (err) {
      console.error('Sign out error', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone and all your history and credits will be permanently lost.'
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (user) {
        // Delete user document from Firestore
        await deleteDoc(doc(db, 'users', user.uid));
        // Delete user from Firebase Auth
        await deleteUser(user);
        onBack();
      }
    } catch (err: any) {
      console.error('Delete account error', err);
      if (err.code === 'auth/requires-recent-login') {
        setError(
          'For security reasons, please sign out and sign in again before deleting your account.'
        );
      } else {
        setError(err.message || 'Failed to delete account.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!auth.currentUser) {
    return (
      <div
        className={`min-h-screen pt-24 pb-20 px-6 lg:px-8 max-w-4xl mx-auto ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
      >
        <button
          onClick={onBack}
          className={`flex items-center gap-2 mb-12 transition-colors ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Home</span>
        </button>
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pt-24 pb-20 px-6 lg:px-8 max-w-2xl mx-auto ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
    >
      <button
        onClick={onBack}
        className={`flex items-center gap-2 mb-12 transition-colors ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Back to Home</span>
      </button>

      <h1 className="text-4xl md:text-5xl font-display italic mb-8">Your Account</h1>

      {error && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm mb-8 ${isDarkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'}`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div
          className={`p-6 rounded-3xl border flex items-center gap-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'}`}
          >
            <User className="w-6 h-6" />
          </div>
          <div>
            <p
              className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}
            >
              Email Address
            </p>
            <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {auth.currentUser.email}
            </p>
          </div>
        </div>

        <div
          className={`p-6 rounded-3xl border flex items-center gap-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}
          >
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p
              className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}
            >
              Available Credits
            </p>
            <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {userCredits} Scans
            </p>
          </div>
        </div>

        <div
          className={`mt-12 pt-8 border-t space-y-4 ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}
        >
          <button
            onClick={handleSignOut}
            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-900'}`}
          >
            <span className="font-medium">Sign Out</span>
            <LogOut className="w-5 h-5 opacity-50" />
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-colors ${isDarkMode ? 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-600'}`}
          >
            <span className="font-medium">Delete Account</span>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5 opacity-50" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
