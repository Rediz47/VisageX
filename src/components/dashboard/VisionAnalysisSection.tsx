import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Activity, User, Scissors, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VisionAnalysisSectionProps {
  isDarkMode: boolean;
  isLocked: boolean;
  visionAnalysis: any;
}

export function VisionAnalysisSection({ isDarkMode, isLocked, visionAnalysis }: VisionAnalysisSectionProps) {
  if (!visionAnalysis) return null;

  return (
    <div className="space-y-4 md:space-y-6">
      <h3 className={cn("text-sm md:text-base font-display font-semibold flex items-center", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
        <Sparkles className={cn("w-4 h-4 mr-2", isDarkMode ? "text-cyan-400" : "text-cyan-600")} />
        AI Vision Analysis
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border relative overflow-hidden group",
            isDarkMode ? "bg-black border-white/5" : "bg-white border-zinc-200 shadow-sm"
          )}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity className="w-16 h-16 md:w-24 md:h-24" />
          </div>
          <div className="relative z-10">
            <p className={cn("text-[8px] font-bold uppercase tracking-[0.3em] mb-2 md:mb-3 opacity-40", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Skin Health</p>
            <h4 className={cn("text-xl md:text-2xl font-display italic mb-3 md:mb-4", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Skin & Texture</h4>
            <p className={cn("text-xs md:text-sm leading-relaxed font-light", isDarkMode ? "text-white/70" : "text-zinc-500")}>
              {visionAnalysis.skinAnalysis}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className={cn(
            "rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border relative overflow-hidden group",
            isDarkMode ? "bg-black border-white/5" : "bg-white border-zinc-200 shadow-sm"
          )}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <User className="w-16 h-16 md:w-24 md:h-24" />
          </div>
          <div className="relative z-10">
            <p className={cn("text-[8px] font-bold uppercase tracking-[0.3em] mb-2 md:mb-3 opacity-40", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Overall Look</p>
            <h4 className={cn("text-xl md:text-2xl font-display italic mb-3 md:mb-4", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Aesthetics & Grooming</h4>
            <p className={cn("text-xs md:text-sm leading-relaxed font-light", isDarkMode ? "text-white/70" : "text-zinc-500")}>
              {isLocked ? "Unlock the full report to see your personalized aesthetics and grooming analysis." : visionAnalysis.aestheticsAnalysis}
            </p>
          </div>
        </motion.div>

        {visionAnalysis.faceShape && visionAnalysis.hairRecommendations && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className={cn(
              "rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border relative overflow-hidden group md:col-span-2",
              isDarkMode ? "bg-black border-white/5" : "bg-white border-zinc-200 shadow-sm"
            )}
          >
            <div className="absolute -top-12 -right-12 opacity-[0.03] pointer-events-none">
              <Scissors className="w-64 h-64 md:w-96 md:h-96 transform -rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("h-[1px] w-8", isDarkMode ? "bg-white/20" : "bg-black/10")} />
                    <p className={cn("text-[10px] font-bold uppercase tracking-[0.3em] opacity-60", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Barber's Guide</p>
                  </div>
                  <h4 className={cn("text-3xl md:text-4xl font-display italic tracking-tight", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Hair & Face Shape</h4>
                </div>

                <div className="flex flex-col items-start md:items-end">
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-2 opacity-40", isDarkMode ? "text-white" : "text-zinc-900")}>Detected Shape</span>
                  <div className={cn(
                    "px-6 py-3 rounded-full border text-sm font-bold tracking-widest uppercase shadow-inner",
                    isDarkMode ? "bg-white/5 border-white/10 text-white shadow-white/5" : "bg-zinc-50 border-zinc-200 text-zinc-900 shadow-black/5"
                  )}>
                    {isLocked ? "Locked" : visionAnalysis.faceShape} Face
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {isLocked ? (
                  <div className={cn("p-8 rounded-3xl border md:col-span-2 italic text-center flex flex-col items-center justify-center min-h-[200px]", isDarkMode ? "bg-white/5 border-white/5 text-white/40" : "bg-zinc-50 border-zinc-200 text-zinc-400")}>
                    <Lock className="w-8 h-8 mb-4 opacity-50" />
                    <p>Unlock the full report to see personalized hair and styling recommendations based on your unique face shape.</p>
                  </div>
                ) : visionAnalysis.hairRecommendations.map((hair: any, i: number) => (
                  <div key={i} className={cn(
                    "p-6 md:p-8 rounded-3xl border transition-all duration-500 hover:-translate-y-1 group/card",
                    isDarkMode ? "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20" : "bg-zinc-50 border-zinc-200 hover:bg-white hover:shadow-xl hover:shadow-zinc-200/50 hover:border-zinc-300"
                  )}>
                    <div className="flex items-start gap-4 md:gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500",
                        isDarkMode ? "bg-indigo-500/20 text-indigo-400 group-hover/card:bg-indigo-500/30" : "bg-indigo-100 text-indigo-600 group-hover/card:bg-indigo-200"
                      )}>
                        <span className="font-display italic font-bold text-xl">{i + 1}</span>
                      </div>
                      <div>
                        <h5 className={cn("text-xl font-bold tracking-tight mb-3", isDarkMode ? "text-white" : "text-zinc-900")}>{hair.styleName}</h5>
                        <p className={cn("text-sm leading-relaxed", isDarkMode ? "text-white/60" : "text-zinc-600")}>{hair.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
