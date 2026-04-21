import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface AnalysisInsightsProps {
  isDarkMode: boolean;
  isLocked: boolean;
  strengths: string[];
  weaknesses: string[];
}

const KEYWORD_GUIDE_MAP = [
  { keyword: 'Canthal Tilt', link: '/blog/what-is-canthal-tilt' },
  { keyword: 'Jawline', link: '/blog/how-to-fix-recessed-jawline' },
  { keyword: 'Symmetry', link: '/blog/how-to-improve-face-symmetry' },
  { keyword: 'Skin', link: '/blog/does-gua-sha-work' },
  { keyword: 'Mewing', link: '/blog/complete-mewing-guide' },
];

export function AnalysisInsights({ isDarkMode, isLocked, strengths, weaknesses }: AnalysisInsightsProps) {
  return (
    <div className="lg:col-span-12 mt-8 md:mt-12">
      <div className="mb-6 md:mb-8">
        <h3 className={cn("text-2xl md:text-3xl font-display italic mb-2", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
          Analysis Summary
        </h3>
        <p className={cn("text-sm md:text-base font-light", isDarkMode ? "text-white/50" : "text-zinc-500")}>
          Key findings from your facial analysis
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <div className={cn(
          "rounded-2xl md:rounded-3xl p-6 md:p-8 border shadow-lg relative overflow-hidden",
          isDarkMode ? "bg-gradient-to-br from-emerald-950/20 to-emerald-900/10 border-emerald-500/30" : "bg-gradient-to-br from-emerald-50 to-white border-emerald-200"
        )}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className={cn("p-2.5 rounded-xl", isDarkMode ? "bg-emerald-500/20" : "bg-emerald-100")}>
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className={cn("text-lg md:text-xl font-display font-bold", isDarkMode ? "text-emerald-400" : "text-emerald-600")}>
                  Key Strengths
                </h3>
                <p className={cn("text-xs", isDarkMode ? "text-emerald-300/50" : "text-emerald-600/50")}>
                  {strengths.length} positive attributes identified
                </p>
              </div>
            </div>
          <ul className="space-y-1.5 md:space-y-2">
              {isLocked ? (
                <li className={cn("flex items-center gap-3 p-3 rounded-xl border", isDarkMode ? "bg-white/5 border-white/10 text-emerald-200/40" : "bg-white border-emerald-100 text-emerald-700/40")}>
                  <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                  <span className="text-sm italic">Unlock to see your key strengths</span>
                </li>
              ) : strengths.map((strength: string, i: number) => {
                const guideMatch = KEYWORD_GUIDE_MAP.find(m => strength.toLowerCase().includes(m.keyword.toLowerCase()));
                return (
                  <li key={i} className={cn(
                    "flex items-center gap-3 p-3 md:p-4 rounded-xl border transition-all duration-300 hover:-translate-y-0.5",
                    isDarkMode ? "bg-white/5 border-emerald-500/20 hover:bg-white/10" : "bg-white border-emerald-200 hover:shadow-md"
                  )}>
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <span className={cn("flex-grow text-sm md:text-base", isDarkMode ? "text-emerald-100" : "text-emerald-900")}>{strength}</span>
                    {guideMatch && (
                      <Link to={guideMatch.link} className={cn(
                        "flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                        isDarkMode ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      )}>
                        Guide →
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className={cn(
          "rounded-2xl md:rounded-3xl p-6 md:p-8 border shadow-lg relative overflow-hidden",
          isDarkMode ? "bg-gradient-to-br from-rose-950/20 to-rose-900/10 border-rose-500/30" : "bg-gradient-to-br from-rose-50 to-white border-rose-200"
        )}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className={cn("p-2.5 rounded-xl", isDarkMode ? "bg-rose-500/20" : "bg-rose-100")}>
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-rose-500" />
              </div>
              <div>
                <h3 className={cn("text-lg md:text-xl font-display font-bold", isDarkMode ? "text-rose-400" : "text-rose-600")}>
                  Areas for Improvement
                </h3>
                <p className={cn("text-xs", isDarkMode ? "text-rose-300/50" : "text-rose-600/50")}>
                  {weaknesses.length} opportunities for enhancement
                </p>
              </div>
            </div>
            <ul className="space-y-3 md:space-y-4">
              {isLocked ? (
                <li className={cn("flex items-center gap-3 p-3 rounded-xl border", isDarkMode ? "bg-white/5 border-white/10 text-rose-200/40" : "bg-white border-rose-100 text-rose-700/40")}>
                  <div className="w-2 h-2 rounded-full bg-rose-500/50" />
                  <span className="text-sm italic">Unlock to see areas for improvement</span>
                </li>
              ) : weaknesses.map((weakness: string, i: number) => {
                const guideMatch = KEYWORD_GUIDE_MAP.find(m => weakness.toLowerCase().includes(m.keyword.toLowerCase()));
                return (
                  <li key={i} className={cn(
                    "flex items-center gap-3 p-3 md:p-4 rounded-xl border transition-all duration-300 hover:-translate-y-0.5",
                    isDarkMode ? "bg-white/5 border-rose-500/20 hover:bg-white/10" : "bg-white border-rose-200 hover:shadow-md"
                  )}>
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                    </div>
                    <span className={cn("flex-grow text-sm md:text-base", isDarkMode ? "text-rose-100" : "text-rose-900")}>{weakness}</span>
                    {guideMatch && (
                      <Link to={guideMatch.link} className={cn(
                        "flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                        isDarkMode ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                      )}>
                        Fix →
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
