import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Share2, Copy, Check, Lock, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ViralReferralEngineProps {
  isDarkMode: boolean;
  isGlassy?: boolean;
  user: any;
  userData?: any;
  overallScore: number;
  topPercentile: number;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onApplyReferral: (code: string) => Promise<void>;
}

export function ViralReferralEngine({
  isDarkMode,
  isGlassy = false,
  user,
  userData,
  overallScore,
  topPercentile,
  onOpenAuth,
  onApplyReferral
}: ViralReferralEngineProps) {
  const [promoCode, setPromoCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const invites = userData?.invitedCount || 0;

  const getNextReward = (count: number) => {
    if (count < 2) return { target: 2, reward: '+1 Scan' };
    if (count < 5) return { target: 5, reward: '+2 Scans' };
    if (count < 10) return { target: 10, reward: '+3 Scans' };
    return { target: count + 5, reward: '+2 Scans' };
  };

  const next = getNextReward(invites);
  const progress = Math.min(100, (invites / next.target) * 100);

  const handleApplyReferral = async () => {
    if (!user) {
      onOpenAuth('signup');
      return;
    }
    if (!promoCode.trim()) return;

    setIsApplying(true);
    setPromoError(null);
    setPromoSuccess(null);

    try {
      await onApplyReferral(promoCode.trim().toUpperCase());
      setPromoSuccess('Code applied successfully!');
      setPromoCode('');
    } catch (err: any) {
      setPromoError(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleShare = () => {
    const shareText = `I scored ${overallScore?.toFixed(1) || '9.0'}/10 on the VisageX AI Face Analysis.`;
    const shareUrl = `${window.location.origin}?ref=${userData?.referralCode || ''}`;

    if ((window as any).posthog) {
      (window as any).posthog.capture('viral_share_clicked', {
        source: 'growth_engine',
        score: overallScore.toFixed(1)
      });
    }

    if (navigator.share) {
      navigator.share({ title: 'My VisageX AI Score', text: shareText, url: shareUrl });
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        'w-full rounded-[2.5rem] p-6 md:p-12 border shadow-xl relative overflow-hidden pointer-events-auto',
        isGlassy
          ? isDarkMode
            ? 'bg-zinc-900/40 border-white/10 backdrop-blur-md'
            : 'bg-white/70 border-zinc-200 backdrop-blur-md'
          : isDarkMode
            ? 'bg-zinc-900 border-white/5'
            : 'bg-white border-zinc-100 shadow-indigo-500/5'
      )}
    >
      <div
        className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-stretch">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-4">
              <Sparkles className="w-3 h-3" />
              Growth Engine
            </div>
            <h3
              className={cn(
                'text-4xl md:text-5xl font-display italic tracking-tight leading-tight mb-4',
                isDarkMode ? 'text-white' : 'text-zinc-900'
              )}
            >
              Invite Friends. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 font-sans not-italic">
                Unlock Results.
              </span>
            </h3>
            <p
              className={cn(
                'text-sm font-light opacity-60 max-w-sm mx-auto lg:mx-0',
                isDarkMode ? 'text-white' : 'text-zinc-600'
              )}
            >
              Invite 2 friends → Get{' '}
              <span className="font-bold text-indigo-400">FULL REPORT FREE ($9.99)</span>. Every
              friend you invite gets +1 scan instantly on signup.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                count: 2,
                reward: 'FREE REPORT',
                color: 'from-cyan-500 to-blue-500',
                glow: progress > 70 && progress < 100
              },
              {
                count: 5,
                reward: '+2 Credits',
                color: 'from-indigo-500 to-purple-500',
                glow: false
              },
              { count: 10, reward: '+5 Credits', color: 'from-rose-500 to-pink-500', glow: false }
            ].map((tier) => (
              <div
                key={tier.count}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden',
                  invites >= tier.count
                    ? `bg-gradient-to-br ${tier.color} text-white border-transparent`
                    : isDarkMode
                      ? 'bg-white/5 border-white/5 opacity-50'
                      : 'bg-zinc-50 border-zinc-100 opacity-50',
                  tier.glow &&
                    'animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.4)] border-cyan-400/50'
                )}
              >
                {tier.glow && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
                <p className="text-lg font-black">{tier.count}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  Invites
                </p>
                <p className="mt-1 text-[9px] font-black text-center leading-none">{tier.reward}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-[400px] flex flex-col gap-6">
          <div
            className={cn(
              'p-8 rounded-[2rem] border relative overflow-hidden',
              isDarkMode ? 'bg-black/40 border-white/10 shadow-inner' : 'bg-zinc-50 border-zinc-200'
            )}
          >
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  Your Invites
                </p>
                <p
                  className={cn(
                    'text-4xl font-display italic font-bold',
                    isDarkMode ? 'text-white' : 'text-zinc-900'
                  )}
                >
                  {invites}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">
                  Next Reward
                </p>
                <p className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1">
                  <Sparkles className="w-4 h-4" /> {next.target === 2 ? 'FULL REPORT' : next.reward}
                </p>
              </div>
            </div>

            <div className="relative h-3 w-full bg-black/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: 'circOut' }}
                className={cn(
                  'absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400',
                  progress > 80 && 'animate-shimmer'
                )}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
              <span className="opacity-30">
                {invites} / {next.target} to next tier
              </span>
              <span className="text-rose-400 animate-pulse">Next bonus expires in 4h</span>
            </div>
          </div>

          <div className="space-y-3">
            {!user ? (
              <button
                onClick={() => onOpenAuth('signup')}
                className="w-full py-8 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:bg-indigo-500/20 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-1">
                  <Lock className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white">
                    Login to Get Code
                  </p>
                  <p className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest mt-1">
                    Unlock your $9.99 reward
                  </p>
                </div>
              </button>
            ) : (
              <>
                <div
                  className={cn(
                    'flex items-center justify-between gap-4 p-2 pl-6 rounded-2xl border',
                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
                  )}
                >
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                      Your Invite Code
                    </p>
                    <p
                      className={cn(
                        'font-mono font-bold text-xl tracking-wider',
                        isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                      )}
                    >
                      {userData?.referralCode || '------'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(userData?.referralCode || '');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                      isDarkMode
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                    )}
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <button
                  onClick={handleShare}
                  className="w-full py-5 rounded-2xl bg-indigo-500 text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.4)] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <Share2 className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">
                    {copied ? 'Copied Link!' : 'Share My Score'}
                  </span>
                </button>
              </>
            )}
          </div>

          <div className="relative">
            <div
              className={cn(
                'flex rounded-2xl border transition-all duration-300 focus-within:ring-2 ring-indigo-500/20',
                isDarkMode ? 'bg-black/20 border-white/5' : 'bg-white border-zinc-200'
              )}
            >
              <input
                type="text"
                placeholder="Redeem code..."
                value={userData?.referredBy ? 'Applied ✅' : promoCode}
                disabled={!user || !!userData?.referredBy || isApplying}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="bg-transparent border-none outline-none px-6 py-4 text-xs w-full font-bold uppercase tracking-widest placeholder:opacity-30 disabled:opacity-50"
              />
              {!userData?.referredBy && (
                <button
                  onClick={handleApplyReferral}
                  disabled={!promoCode || isApplying}
                  className="px-6 text-indigo-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-300 disabled:opacity-40 transition-colors"
                >
                  {isApplying ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Apply'}
                </button>
              )}
            </div>
            {promoError && (
              <p className="absolute -bottom-5 left-2 text-[9px] text-rose-400 font-bold uppercase tracking-widest">
                {promoError}
              </p>
            )}
            {promoSuccess && (
              <p className="absolute -bottom-5 left-2 text-[9px] text-emerald-400 font-bold uppercase tracking-widest">
                {promoSuccess}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
