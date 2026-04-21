import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Search, Sparkles, Loader2, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CelebritySectionProps {
  isDarkMode: boolean;
  isLocked: boolean;
  imageUrl: string;
  user: any;
  userCredits: number;
  celebrityResults: any[];
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenPricing: () => void;
  onFindCelebrity: () => Promise<void>;
  result: any;
}

export function CelebritySection({
  isDarkMode,
  isLocked,
  imageUrl,
  user,
  userCredits,
  celebrityResults,
  onOpenAuth,
  onOpenPricing,
  onFindCelebrity,
  result,
}: CelebritySectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scanStep && !scanHistory.includes(scanStep)) {
      setScanHistory(prev => [...prev, scanStep]);
    }
  }, [scanStep]);

  useEffect(() => {
    if (!isAnalyzing) {
      setScanHistory([]);
      setScanStep("");
    }
  }, [isAnalyzing]);

  const handleClick = async () => {
    if (!user) {
      onOpenAuth('signup');
      return;
    }
    if (userCredits <= 0) {
      onOpenPricing();
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setScanStep("Verifying credits...");

    try {
      await onFindCelebrity();
    } catch (err) {
      setError("Failed to process. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={cn(
      "rounded-2xl p-4 md:p-6 shadow-2xl border overflow-hidden relative",
      isDarkMode ? "bg-black border-white/10" : "bg-white border-zinc-200 shadow-sm"
    )}>
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <User className="w-24 h-24" />
      </div>

      <h3 className={cn("text-lg md:text-xl font-display italic mb-4 md:mb-6 flex items-center", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
        <User className={cn("w-5 h-5 mr-3", isDarkMode ? "text-cyan-400" : "text-cyan-600")} />
        Celebrity Lookalikes
        <span className="ml-3 px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-black text-cyan-500 tracking-[0.2em] uppercase leading-none">
          Beta
        </span>
      </h3>

      {celebrityResults.length > 0 ? (
        <>
          {celebrityResults[0] && celebrityResults[0].percentage >= 80 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className={cn("text-xl font-display italic", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Top Match</h4>
                  <p className={cn("text-xs uppercase tracking-widest", isDarkMode ? "text-white/40" : "text-zinc-500")}>High Similarity</p>
                </div>
                <span className="text-3xl font-display italic text-cyan-400">{Number(celebrityResults[0].percentage || 0).toFixed(0)}%</span>
              </div>

              <div className="flex items-center justify-center gap-8">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl blur opacity-25"></div>
                  <img
                    src={imageUrl}
                    alt="You"
                    className={cn("relative w-24 h-24 rounded-2xl object-cover border-2", isDarkMode ? "border-white/10" : "border-zinc-200")}
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] font-bold px-3 py-1 rounded-full">YOU</div>
                </div>

                <TrendingUp className="w-6 h-6 text-cyan-400" />

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-25"></div>
                  <img
                    src={celebrityResults[0].imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(celebrityResults[0].name)}&background=random&color=fff&size=128`}
                    alt={celebrityResults[0].name}
                    className={cn("relative w-24 h-24 rounded-2xl object-cover border-2", isDarkMode ? "border-white/10" : "border-zinc-200")}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('ui-avatars.com')) {
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(celebrityResults[0].name)}&background=random&color=fff&size=128`;
                      }
                    }}
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-[9px] font-bold px-3 py-1 rounded-full">
                    {isLocked ? "LOCKED" : celebrityResults[0].name.toUpperCase()}
                  </div>
                </div>
              </div>

              {celebrityResults[0].reason && (
                <div className={cn("mt-6 p-4 rounded-xl border text-center text-sm italic", isDarkMode ? "bg-white/5 border-white/5 text-white/80" : "bg-zinc-50 border-zinc-200 text-zinc-700")}>
                  {isLocked ? "Unlock to see why you match." : `"${celebrityResults[0].reason}"`}
                </div>
              )}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {celebrityResults.map((celeb: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i }}
                className={cn(
                  "group relative p-4 rounded-2xl border transition-all duration-300",
                  isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
                )}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative">
                    <img
                      src={celeb.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(celeb.name)}&background=random&color=fff&size=128`}
                      alt={celeb.name}
                      className={cn("w-16 h-16 rounded-xl object-cover border-2", isDarkMode ? "border-white/10" : "border-zinc-200")}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('ui-avatars.com')) {
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(celeb.name)}&background=random&color=fff&size=128`;
                        }
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                      {isLocked ? "??" : `${Number(celeb.percentage || 0).toFixed(0)}%`}
                    </div>
                  </div>
                  <div>
                    <h4 className={cn("font-display italic text-base", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                      {isLocked ? "Locked" : celeb.name}
                    </h4>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Sparkles key={star} className={cn("w-3 h-3", star <= Math.round(Number(celeb.percentage || 0) / 20) ? "text-amber-400" : "text-zinc-600 opacity-30")} />
                      ))}
                    </div>
                  </div>
                </div>
                {celeb.reason && (
                  <p className={cn("text-xs leading-relaxed opacity-80 italic", isDarkMode ? "text-white/70" : "text-zinc-600")}>
                    "{celeb.reason}"
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className={cn(
          "flex flex-col items-center justify-center py-12 px-6 text-center border rounded-2xl border-dashed",
          isDarkMode ? "border-white/10 bg-white/5" : "border-zinc-200 bg-zinc-50"
        )}>
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-cyan-400" />
          </div>
          <h4 className={cn("text-lg font-display italic mb-2", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
            Who is your celebrity twin?
          </h4>
          <p className={cn("text-sm mb-8 max-w-md", isDarkMode ? "text-white/40" : "text-zinc-500")}>
            Our AI can identify your exact celebrity lookalikes and models who share your facial structure.
          </p>

          {isAnalyzing && (
            <div className="w-full max-w-sm mb-6">
              <AnimatePresence mode="popLayout">
                {scanHistory.slice(-3).map((step, index, arr) => {
                  const isCurrent = index === arr.length - 1;
                  return (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: isCurrent ? 1 : 0.5, x: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn("flex items-center gap-3 text-sm font-mono mb-2", isCurrent ? (isDarkMode ? 'text-cyan-400' : 'text-cyan-600') : (isDarkMode ? 'text-zinc-500' : 'text-zinc-400'))}
                    >
                      {isCurrent ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      <span>{step}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={handleClick}
            disabled={isAnalyzing}
            className={cn(
              "px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-50 flex items-center gap-2",
              isDarkMode ? "bg-white text-black hover:bg-cyan-400" : "bg-black text-white hover:bg-cyan-600"
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {!user ? "Sign Up to Find Twin" : userCredits > 0 ? "Find My Twin (1 Credit)" : "Get Credits"}
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
