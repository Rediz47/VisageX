import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, ChevronDown, Clock, DollarSign, Target, Zap,
  Leaf, Syringe, Scissors, Dumbbell, Sparkles, TrendingUp,
  Shield, AlertTriangle
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface PlanItem {
  title: string;
  category: 'Foundational' | 'Non-Invasive' | 'Minimally Invasive' | 'Surgical';
  difficulty: number;
  description: string;
  details: string;
  expectedImpact: string;
  costRange: string;
  timeframe: string;
  recovery: string | null;
  targetAreas: string[];
}

interface TimelinePlanProps {
  items: PlanItem[];
  isDarkMode: boolean;
  isLocked: boolean;
  onUnlock: () => void;
}

const CATEGORY_CONFIG = {
  'Foundational': {
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
    darkBg: 'rgba(34,197,94,0.06)',
    darkBorder: 'rgba(34,197,94,0.15)',
    icon: Leaf,
    label: 'Easy',
    gradient: 'from-emerald-400 to-green-500',
  },
  'Non-Invasive': {
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
    darkBg: 'rgba(59,130,246,0.06)',
    darkBorder: 'rgba(59,130,246,0.15)',
    icon: Dumbbell,
    label: 'Moderate',
    gradient: 'from-blue-400 to-indigo-500',
  },
  'Minimally Invasive': {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    darkBg: 'rgba(245,158,11,0.06)',
    darkBorder: 'rgba(245,158,11,0.15)',
    icon: Syringe,
    label: 'Advanced',
    gradient: 'from-amber-400 to-orange-500',
  },
  'Surgical': {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    darkBg: 'rgba(239,68,68,0.06)',
    darkBorder: 'rgba(239,68,68,0.15)',
    icon: Scissors,
    label: 'Surgical',
    gradient: 'from-rose-400 to-red-500',
  },
} as const;

function DifficultyDots({ difficulty, color }: { difficulty: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full transition-colors"
          style={{
            background: i <= difficulty ? color : 'rgba(128,128,128,0.2)',
          }}
        />
      ))}
    </div>
  );
}

function TimelineItem({
  item,
  index,
  isDarkMode,
  isLocked,
  isExpanded,
  onToggle,
}: {
  item: PlanItem;
  index: number;
  isDarkMode: boolean;
  isLocked: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = CATEGORY_CONFIG[item.category];
  const Icon = config.icon;
  const isBlurred = isLocked && index > 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative flex gap-4 md:gap-6"
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0 w-10 md:w-12">
        {/* Node */}
        <motion.div
          className="relative z-10 flex items-center justify-center rounded-full border-2 shadow-lg"
          style={{
            width: 40,
            height: 40,
            borderColor: config.color,
            background: isDarkMode ? 'rgba(0,0,0,0.8)' : '#fff',
            boxShadow: `0 0 20px ${config.color}33, 0 4px 12px rgba(0,0,0,0.1)`,
          }}
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {isBlurred ? (
            <Lock className="w-4 h-4 text-zinc-400" />
          ) : (
            <span className="text-xs font-black" style={{ color: config.color }}>{index + 1}</span>
          )}
        </motion.div>
        {/* Vertical line */}
        <div
          className="w-px flex-1 min-h-[20px]"
          style={{
            background: `linear-gradient(180deg, ${config.color}40 0%, ${config.color}10 100%)`,
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        className={cn(
          "flex-1 rounded-2xl border overflow-hidden mb-3 cursor-pointer transition-all duration-300",
          isDarkMode
            ? 'bg-zinc-900/80 hover:bg-zinc-900'
            : 'bg-white hover:bg-zinc-50/80',
          isExpanded && !isBlurred && (isDarkMode ? 'ring-1 ring-white/10' : 'ring-1 ring-zinc-200/80 shadow-lg'),
        )}
        style={{
          borderColor: isDarkMode ? config.darkBorder : config.border,
        }}
        onClick={() => !isBlurred && onToggle()}
        whileHover={!isBlurred ? { y: -2 } : {}}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Category badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0"
                style={{
                  color: config.color,
                  background: isDarkMode ? config.darkBg : config.bg,
                  border: `1px solid ${isDarkMode ? config.darkBorder : config.border}`,
                }}
              >
                <Icon className="w-3 h-3" />
                {config.label}
              </div>

              {/* Title + description */}
              <div className="min-w-0">
                <h4 className={cn(
                  "text-sm md:text-base font-bold truncate",
                  isDarkMode ? 'text-white' : 'text-zinc-900',
                  isBlurred && 'blur-[6px] select-none'
                )}>
                  {item.title}
                </h4>
                <p className={cn(
                  "text-[11px] mt-0.5 line-clamp-1 opacity-60",
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-500',
                  isBlurred && 'blur-[6px] select-none'
                )}>
                  {item.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <DifficultyDots difficulty={item.difficulty} color={config.color} />
              <motion.div
                animate={{ rotate: isExpanded && !isBlurred ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isBlurred ? (
                  <Lock className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className={cn('w-4 h-4', isDarkMode ? 'text-zinc-500' : 'text-zinc-400')} />
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && !isBlurred && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className={cn(
                "px-4 md:px-5 pb-5 pt-3 border-t",
                isDarkMode ? 'border-white/5' : 'border-zinc-100'
              )}>
                {/* Details text */}
                <p className={cn(
                  "text-[13px] md:text-sm leading-relaxed mb-5",
                  isDarkMode ? 'text-zinc-200' : 'text-zinc-700'
                )}>
                  {item.details}
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {/* Impact */}
                  <div className={cn(
                    "rounded-xl p-3 text-center",
                    isDarkMode ? 'bg-white/[0.03]' : 'bg-zinc-50'
                  )}>
                    <TrendingUp className="w-4 h-4 mx-auto mb-1.5" style={{ color: config.color }} />
                    <p className={cn('text-[9px] font-bold uppercase tracking-wider opacity-40 mb-0.5', isDarkMode ? 'text-white' : 'text-zinc-900')}>Impact</p>
                    <p className={cn('text-[11px] font-semibold', isDarkMode ? 'text-white' : 'text-zinc-800')}>{item.expectedImpact}</p>
                  </div>

                  {/* Cost */}
                  <div className={cn(
                    "rounded-xl p-3 text-center",
                    isDarkMode ? 'bg-white/[0.03]' : 'bg-zinc-50'
                  )}>
                    <DollarSign className="w-4 h-4 mx-auto mb-1.5 text-emerald-500" />
                    <p className={cn('text-[9px] font-bold uppercase tracking-wider opacity-40 mb-0.5', isDarkMode ? 'text-white' : 'text-zinc-900')}>Cost</p>
                    <p className={cn('text-[11px] font-semibold', isDarkMode ? 'text-white' : 'text-zinc-800')}>{item.costRange}</p>
                  </div>

                  {/* Timeframe */}
                  <div className={cn(
                    "rounded-xl p-3 text-center",
                    isDarkMode ? 'bg-white/[0.03]' : 'bg-zinc-50'
                  )}>
                    <Clock className="w-4 h-4 mx-auto mb-1.5 text-blue-500" />
                    <p className={cn('text-[9px] font-bold uppercase tracking-wider opacity-40 mb-0.5', isDarkMode ? 'text-white' : 'text-zinc-900')}>Results</p>
                    <p className={cn('text-[11px] font-semibold', isDarkMode ? 'text-white' : 'text-zinc-800')}>{item.timeframe}</p>
                  </div>

                  {/* Recovery */}
                  <div className={cn(
                    "rounded-xl p-3 text-center",
                    isDarkMode ? 'bg-white/[0.03]' : 'bg-zinc-50'
                  )}>
                    <Shield className="w-4 h-4 mx-auto mb-1.5 text-violet-500" />
                    <p className={cn('text-[9px] font-bold uppercase tracking-wider opacity-40 mb-0.5', isDarkMode ? 'text-white' : 'text-zinc-900')}>Recovery</p>
                    <p className={cn('text-[11px] font-semibold', isDarkMode ? 'text-white' : 'text-zinc-800')}>{item.recovery || 'None'}</p>
                  </div>
                </div>

                {/* Target areas */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.targetAreas.map(area => (
                    <span
                      key={area}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-semibold",
                        isDarkMode ? 'bg-white/5 text-white/50' : 'bg-zinc-100 text-zinc-500'
                      )}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export function TimelinePlan({ items, isDarkMode, isLocked, onUnlock }: TimelinePlanProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const categories = ['All', 'Foundational', 'Non-Invasive', 'Minimally Invasive', 'Surgical'];

  const filtered = activeFilter === 'All'
    ? items
    : items.filter(item => item.category === activeFilter);

  const categoryCounts = {
    'Foundational': items.filter(i => i.category === 'Foundational').length,
    'Non-Invasive': items.filter(i => i.category === 'Non-Invasive').length,
    'Minimally Invasive': items.filter(i => i.category === 'Minimally Invasive').length,
    'Surgical': items.filter(i => i.category === 'Surgical').length,
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl md:rounded-3xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)' }} />
        </div>
        <div className="relative p-8 md:p-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300">AI-Powered</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Your Improvement Timeline</h2>
          <p className="text-indigo-200/60 text-sm max-w-xl">
            Personalized steps ranked from easiest habits to advanced procedures, tailored to your facial analysis.
          </p>

          {/* Category summary pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              if (count === 0) return null;
              const cfg = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG];
              return (
                <div
                  key={cat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold"
                  style={{
                    color: cfg.color,
                    background: `${cfg.color}15`,
                    border: `1px solid ${cfg.color}30`,
                  }}
                >
                  <cfg.icon className="w-3 h-3" />
                  {count} {cat}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {categories.map(cat => {
          const isActive = activeFilter === cat;
          const cfg = cat !== 'All' ? CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG] : null;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200",
                isActive
                  ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-zinc-900 text-white')
                  : (isDarkMode ? 'text-white/40 hover:text-white/70 hover:bg-white/5' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100')
              )}
              style={isActive && cfg ? { background: `${cfg.color}20`, color: cfg.color } : {}}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="relative pl-1">
        {filtered.map((item, i) => (
          <React.Fragment key={`${item.title}-${i}`}>
            <TimelineItem
              item={item}
              index={i}
              isDarkMode={isDarkMode}
              isLocked={isLocked}
              isExpanded={expandedIndex === i}
              onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Locked CTA */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center pt-4"
        >
          <button
            onClick={onUnlock}
            className="group relative p-0.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-600 rounded-2xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-600 rounded-2xl" />
            <div className={cn(
              "relative rounded-[14px] px-8 py-4 flex items-center gap-3",
              isDarkMode ? 'bg-zinc-950' : 'bg-white'
            )}>
              <Lock className={cn("w-4 h-4", isDarkMode ? "text-indigo-400" : "text-indigo-600")} />
              <span className={cn(
                "font-black text-xs uppercase tracking-[0.15em] bg-clip-text text-transparent bg-gradient-to-r",
                isDarkMode ? "from-emerald-400 to-purple-400" : "from-emerald-600 to-purple-600"
              )}>
                Unlock Full Improvement Plan
              </span>
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
}
