import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface UnlockOverlayProps {
  isDarkMode: boolean;
  topPercentile: number;
  onUnlock: () => void;
}

export function UnlockOverlay({ isDarkMode, topPercentile, onUnlock }: UnlockOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={cn(
        "w-full max-w-5xl p-8 md:p-12 rounded-[3rem] border shadow-[0_30px_100px_rgba(99,102,241,0.2)] relative overflow-hidden group pointer-events-auto -translate-y-12",
        isDarkMode ? "bg-zinc-900/80 border-white/10 backdrop-blur-md" : "bg-white/90 border-zinc-200 backdrop-blur-md"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 opacity-40 mix-blend-overlay" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="flex-1 text-center lg:text-left">
          <h3 className={cn("text-4xl md:text-5xl lg:text-6xl font-display italic mb-3 leading-tight", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
            Unlock Your <br /> <span className="text-indigo-500">Full Face Analysis</span>
          </h3>
          <p className={cn("text-base md:text-xl opacity-60 font-light mb-8 max-w-lg", isDarkMode ? "text-white" : "text-zinc-600")}>
            See why you're Top {topPercentile}% & how to reach 9.0+
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto lg:mx-0">
            {[
              "All 12+ Advanced Metrics",
              "Celebrity Lookalikes",
              "Personalized Glow-up Plan",
              "High-Res Feature Map",
              "Symmetry Analysis",
              "Lifetime Access to Result"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm opacity-70">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className={cn(
          "flex flex-col items-center gap-6 min-w-[340px] p-10 rounded-[2.5rem] border shadow-2xl relative overflow-hidden",
          isDarkMode ? "bg-black/60 border-white/10" : "bg-white border-zinc-200"
        )}>
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

          <div className="text-center relative z-10">
            <p className="text-[10px] uppercase tracking-widest opacity-40 mb-1 font-bold">Total Access</p>
            <p className={cn("text-5xl font-display italic font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
              <span className="text-lg align-top opacity-50 not-italic font-sans mr-1">$</span>1.50
            </p>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">One-Time Payment</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUnlock}
            className="w-full relative group p-0.5 rounded-2xl transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 rounded-2xl blur-md opacity-40 group-hover:opacity-80 transition-opacity duration-500 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 rounded-2xl" />
            <div className={cn(
              "relative w-full h-full rounded-2xl px-8 py-5 flex items-center justify-center gap-3 overflow-hidden",
              isDarkMode ? "bg-zinc-950" : "bg-white"
            )}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Sparkles className={cn("w-4 h-4", isDarkMode ? "text-cyan-400" : "text-cyan-600")} />
              <span className={cn(
                "font-black text-[10px] md:text-xs uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r",
                isDarkMode ? "from-cyan-400 to-purple-400" : "from-cyan-600 to-purple-600"
              )}>
                See Your Full Potential
              </span>
            </div>
          </motion.button>

          <div className="flex items-center gap-2 opacity-40 text-[9px] font-bold uppercase tracking-widest">
            <Lock className="w-3 h-3" />
            Secure One-Time Payment
          </div>
        </div>
      </div>
    </motion.div>
  );
}
