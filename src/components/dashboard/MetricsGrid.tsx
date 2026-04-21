import React from 'react';
import { Activity } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Target } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { cn } from '../../lib/utils';

interface MetricsGridProps {
  isDarkMode: boolean;
  isLocked: boolean;
  radarData: any[];
  detailedSymmetry: any[];
  metrics: any;
}


export function MetricsGrid({ isDarkMode, isLocked, radarData, detailedSymmetry, metrics }: MetricsGridProps) {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="mb-6 md:mb-8">
        <h3 className={cn("text-2xl md:text-3xl font-display italic mb-2", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
          Measurements & Metrics
        </h3>
        <p className={cn("text-sm md:text-base font-light", isDarkMode ? "text-white/50" : "text-zinc-500")}>
          Precise facial measurements and symmetry analysis
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <div className={cn(
          "rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border relative overflow-hidden",
          isDarkMode ? "bg-gradient-to-br from-zinc-900 to-black border-white/10" : "bg-gradient-to-br from-white to-zinc-50 border-zinc-200"
        )}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className={cn("p-2.5 rounded-xl", isDarkMode ? "bg-cyan-500/20" : "bg-cyan-100")}>
                <Target className="w-5 h-5 md:w-6 md:h-6 text-cyan-500" />
              </div>
              <div>
                <h3 className={cn("text-lg md:text-xl font-display font-bold", isDarkMode ? "text-cyan-400" : "text-cyan-600")}>
                  Harmony Radar
                </h3>
                <p className={cn("text-xs", isDarkMode ? "text-cyan-300/50" : "text-cyan-600/50")}>
                  Multi-dimensional feature comparison
                </p>
              </div>
            </div>
            <div className="h-64 md:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', fontSize: 12, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke={isDarkMode ? "#22d3ee" : "#0891b2"} fill={isDarkMode ? "#22d3ee" : "#0891b2"} fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      <div className={cn(
        "rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border relative overflow-hidden",
        isDarkMode ? "bg-gradient-to-br from-zinc-900 to-black border-white/10" : "bg-gradient-to-br from-white to-zinc-50 border-zinc-200"
      )}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn("p-2.5 rounded-xl", isDarkMode ? "bg-purple-500/20" : "bg-purple-100")}>
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
            </div>
            <div>
              <h3 className={cn("text-lg md:text-xl font-display font-bold", isDarkMode ? "text-purple-400" : "text-purple-600")}>
                Raw Measurements
              </h3>
              <p className={cn("text-xs", isDarkMode ? "text-purple-300/50" : "text-purple-600/50")}>
                Precise facial ratios and metrics
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className={cn("p-4 md:p-5 rounded-xl border transition-all duration-300 hover:-translate-y-0.5", isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-zinc-200 hover:shadow-md")}>
              <p className={cn("text-[10px] uppercase tracking-wider font-bold mb-2", isDarkMode ? "text-white/50" : "text-zinc-500")}>Symmetry</p>
              <p className={cn("text-xl md:text-2xl font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>{metrics.facialSymmetry}</p>
            </div>
            <div className={cn("p-4 md:p-5 rounded-xl border transition-all duration-300 hover:-translate-y-0.5", isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-zinc-200 hover:shadow-md")}>
              <div className="flex items-center gap-1 mb-2">
                <p className={cn("text-[10px] uppercase tracking-wider font-bold", isDarkMode ? "text-white/50" : "text-zinc-500")}>Canthal Tilt</p>
                <Tooltip content="The angle of the eye's outer corner relative to the inner corner." isDarkMode={isDarkMode} />
              </div>
              <p className={cn("text-xl md:text-2xl font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                {isLocked ? "??" : metrics.canthalTilt}
              </p>
            </div>
            <div className={cn("p-4 md:p-5 rounded-xl border transition-all duration-300 hover:-translate-y-0.5", isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-zinc-200 hover:shadow-md")}>
              <div className="flex items-center gap-1 mb-2">
                <p className={cn("text-[10px] uppercase tracking-wider font-bold", isDarkMode ? "text-white/50" : "text-zinc-500")}>fWHR</p>
                <Tooltip content="The ratio of facial width to facial height." isDarkMode={isDarkMode} />
              </div>
              <p className={cn("text-xl md:text-2xl font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                {isLocked ? "??" : metrics.fWHR}
              </p>
            </div>
            <div className={cn("p-4 md:p-5 rounded-xl border transition-all duration-300 hover:-translate-y-0.5", isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-zinc-200 hover:shadow-md")}>
              <div className="flex items-center gap-1 mb-2">
                <p className={cn("text-[10px] uppercase tracking-wider font-bold", isDarkMode ? "text-white/50" : "text-zinc-500")}>Golden Ratio</p>
                <Tooltip content="A mathematical ratio (1.618) used as a standard for facial harmony." isDarkMode={isDarkMode} />
              </div>
              <p className={cn("text-xl md:text-2xl font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                {isLocked ? "??" : metrics.goldenRatio}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
