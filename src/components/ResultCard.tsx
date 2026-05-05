import React from 'react';
import { Sparkles } from 'lucide-react';

interface ResultCardProps {
  score: number;
  topPercentile: number;
  imageUrl: string;
  isDarkMode: boolean;
}

export const ResultCard = React.forwardRef<HTMLDivElement, ResultCardProps>(
  ({ score, topPercentile, imageUrl, isDarkMode }, ref) => {
    return (
      <div
        ref={ref}
        className={`w-[400px] h-[711px] p-8 flex flex-col items-center justify-between relative overflow-hidden ${
          isDarkMode ? 'bg-black text-white' : 'bg-white text-zinc-900'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-black/80 z-0" />

        <div className="relative z-10 w-full flex justify-between items-center">
          <span className="font-display font-bold text-2xl tracking-tighter">
            VISAGE<span className="opacity-50">X</span>
          </span>
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>

        <div className="relative z-10 w-full flex-grow flex flex-col items-center justify-center gap-6">
          <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-indigo-500 shadow-2xl">
            <img src={imageUrl} alt="Analyzed Face" className="w-full h-full object-cover" />
          </div>

          <div className="text-center">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-2">
              Facial Harmony Score
            </h3>
            <div className="text-7xl font-display italic font-bold">{score.toFixed(1)}</div>
            <p className="text-lg font-bold text-indigo-400 mt-2">out of 10</p>
          </div>
        </div>

        <div className="relative z-10 w-full text-center opacity-60 text-xs uppercase tracking-widest">
          Get your full report at visagex.online
        </div>
      </div>
    );
  }
);

ResultCard.displayName = 'ResultCard';
