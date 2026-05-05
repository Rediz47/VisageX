import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, X, Download, Copy, Check, Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { fireConfetti } from '../lib/confetti';

interface ViralShareOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  overallScore: number;
  topPercentile: number;
  referralCode?: string;
  onGenerateCard: () => void;
  isGeneratingCard: boolean;
  user: any;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export function ViralShareOverlay({
  isVisible,
  onClose,
  isDarkMode,
  overallScore,
  topPercentile,
  referralCode,
  onGenerateCard,
  isGeneratingCard,
  user,
  onOpenAuth
}: ViralShareOverlayProps) {
  const [copied, setCopied] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Fire confetti once on first appearance
  useEffect(() => {
    if (isVisible && !hasTriggered) {
      setHasTriggered(true);
      setTimeout(() => fireConfetti(), 300);
    }
  }, [isVisible, hasTriggered]);

  const shareText = `I scored ${overallScore.toFixed(1)}/10 on the VisageX AI Face Analysis. Can you beat me?`;
  const shareUrl = `${window.location.origin}${referralCode ? `?ref=${referralCode}` : ''}`;

  const handleShare = async () => {
    if ((window as any).posthog) {
      (window as any).posthog.capture('viral_share_overlay_clicked', {
        score: overallScore.toFixed(1)
      });
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My VisageX AI Score', text: shareText, url: shareUrl });
      } catch {
        /* noop */
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getEmotionalMessage = () => {
    if (overallScore >= 8.5)
      return {
        emoji: '🔥',
        headline: "You're absolutely stunning.",
        sub: 'Your facial harmony is in the elite tier. Share it — make them wonder.'
      };
    if (overallScore >= 7)
      return {
        emoji: '✨',
        headline: 'Impressive results.',
        sub: "You scored higher than most people. Show the world what you're working with."
      };
    if (overallScore >= 5.5)
      return {
        emoji: '💪',
        headline: 'Solid foundation detected.',
        sub: 'You have real potential. Share your score and challenge your friends.'
      };
    return {
      emoji: '🚀',
      headline: 'Your journey starts here.',
      sub: 'Everyone starts somewhere. Challenge your friends to beat your score.'
    };
  };

  const msg = getEmotionalMessage();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 backdrop-blur-2xl bg-black/80"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 border shadow-2xl overflow-hidden',
              isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'
            )}
          >
            {/* Background decoration */}
            <div
              className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)'
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%)'
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close sharing overlay"
              className={cn(
                'absolute top-6 right-6 p-2 rounded-full border transition-all z-20',
                isDarkMode
                  ? 'border-white/10 text-white/40 hover:bg-white/5'
                  : 'border-zinc-200 text-zinc-400 hover:bg-zinc-100'
              )}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Emotional score reveal */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="mb-6"
              >
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                    <span className="text-4xl font-display italic text-white font-bold">
                      {overallScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
                    <Trophy className="w-5 h-5 text-amber-900" />
                  </div>
                </div>
              </motion.div>

              {/* Emotional text */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-4xl mb-2">{msg.emoji}</p>
                <h2
                  className={cn(
                    'text-2xl md:text-3xl font-display italic mb-3 tracking-tight',
                    isDarkMode ? 'text-white' : 'text-zinc-900'
                  )}
                >
                  {msg.headline}
                </h2>
                <p
                  className={cn(
                    'text-sm font-light mb-2 max-w-sm',
                    isDarkMode ? 'text-white/50' : 'text-zinc-500'
                  )}
                >
                  {msg.sub}
                </p>
                <p
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8',
                    isDarkMode
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  Facial Harmony Score
                </p>
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full space-y-3"
              >
                {/* Primary: Share */}
                <button
                  onClick={handleShare}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(99,102,241,0.35)] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <Share2 className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">
                    {copied ? 'Copied to Clipboard!' : 'Challenge Your Friends'}
                  </span>
                </button>

                {/* Secondary: Download card */}
                <button
                  onClick={onGenerateCard}
                  disabled={isGeneratingCard}
                  className={cn(
                    'w-full py-4 rounded-2xl border font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300',
                    isDarkMode
                      ? 'border-white/10 text-white/70 hover:bg-white/5'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100',
                    isGeneratingCard && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingCard ? 'Generating...' : 'Download Share Card'}
                </button>

                {/* Tertiary: Skip */}
                <button
                  onClick={onClose}
                  className={cn(
                    'w-full py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-300',
                    isDarkMode
                      ? 'text-white/20 hover:text-white/40'
                      : 'text-zinc-300 hover:text-zinc-500'
                  )}
                >
                  Skip for now
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
