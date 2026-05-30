import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  ChevronDown,
  Clock,
  DollarSign,
  Target,
  Zap,
  Leaf,
  Syringe,
  Scissors,
  Dumbbell,
  Sparkles,
  TrendingUp,
  Shield,
  AlertTriangle
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

const CLINICAL_OVERREACH_PATTERN =
  /\b(rhinoplasty|blepharoplasty|implant|surgical|surgery|botulinum|botox|filler|dermal filler|tear trough|fat repositioning|augmentation|canthoplasty|thread lift)\b/i;

const getSafePlanItems = (items: PlanItem[]) => {
  return items
    .filter((item) => {
      const text = `${item.title} ${item.description} ${item.details}`;
      if (item.category === 'Surgical') return false;
      if (CLINICAL_OVERREACH_PATTERN.test(text)) return false;
      return true;
    })
    .slice(0, 10);
};

const CATEGORY_CONFIG = {
  Foundational: {
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
    darkBg: 'rgba(34,197,94,0.06)',
    darkBorder: 'rgba(34,197,94,0.15)',
    icon: Leaf,
    label: 'Easy',
    display: 'Basics',
    gradient: 'from-emerald-400 to-green-500'
  },
  'Non-Invasive': {
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
    darkBg: 'rgba(59,130,246,0.06)',
    darkBorder: 'rgba(59,130,246,0.15)',
    icon: Dumbbell,
    label: 'Moderate',
    display: 'At Home',
    gradient: 'from-blue-400 to-indigo-500'
  },
  'Minimally Invasive': {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    darkBg: 'rgba(245,158,11,0.06)',
    darkBorder: 'rgba(245,158,11,0.15)',
    icon: Syringe,
    label: 'Advanced',
    display: 'Pro Help',
    gradient: 'from-amber-400 to-orange-500'
  },
  Surgical: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    darkBg: 'rgba(239,68,68,0.06)',
    darkBorder: 'rgba(239,68,68,0.15)',
    icon: Scissors,
    label: 'Specialist',
    display: 'Specialist',
    gradient: 'from-rose-400 to-red-500'
  }
} as const;

function DifficultyDots({ difficulty, color }: { difficulty: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full transition-colors"
          style={{
            background: i <= difficulty ? color : 'rgba(128,128,128,0.2)'
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
  onToggle
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative"
    >
      {/* Timeline spine */}
      <div className="absolute top-4 right-4 z-20">
        {/* Node */}
        <motion.div
          className="relative z-10 flex items-center justify-center rounded-full border"
          style={{
            width: 34,
            height: 34,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,27,0.08)',
            background: isDarkMode ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.85)'
          }}
          transition={{ duration: 0.2 }}
        >
          {isBlurred ? (
            <Lock className="w-4 h-4 text-zinc-400" />
          ) : (
            <span
              className={cn(
                'text-[11px] font-black',
                isDarkMode ? 'text-white/45' : 'text-zinc-400'
              )}
            >
              {index + 1}
            </span>
          )}
        </motion.div>
        {/* Vertical line */}
        <div
          className="hidden"
          style={{
            background: `linear-gradient(180deg, ${config.color}40 0%, ${config.color}10 100%)`
          }}
        />
        <div
          className="hidden"
          style={{
            background: `linear-gradient(180deg, ${config.color}40 0%, ${config.color}10 100%)`
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        className={cn(
          'rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 h-full relative',
          isDarkMode ? 'bg-white/[0.025] hover:bg-white/[0.04]' : 'bg-white hover:bg-zinc-50/60',
          isExpanded &&
            !isBlurred &&
            (isDarkMode ? 'border-white/14 bg-white/[0.04]' : 'border-zinc-300 shadow-sm')
        )}
        style={{
          borderColor: isDarkMode ? 'rgba(255,255,255,0.075)' : 'rgba(24,24,27,0.09)'
        }}
        onClick={() => !isBlurred && onToggle()}
        whileHover={!isBlurred ? { y: -1 } : {}}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="p-5 md:p-6 pr-14">
          <div className="flex flex-col items-start gap-4">
            <div className="flex flex-col gap-3 min-w-0 flex-1">
              {/* Category badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 w-fit"
                style={{
                  color: isDarkMode ? 'rgba(255,255,255,0.52)' : 'rgba(63,63,70,0.72)',
                  background: isDarkMode ? 'rgba(255,255,255,0.035)' : 'rgba(244,244,245,0.9)',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(24,24,27,0.06)'}`
                }}
              >
                <Icon className="w-3 h-3" />
                {config.label}
              </div>

              {/* Title + description */}
              <div className="min-w-0">
                <h4
                  className={cn(
                    'text-base md:text-lg font-bold tracking-tight leading-tight',
                    isDarkMode ? 'text-white/90' : 'text-zinc-900',
                    isBlurred && 'blur-[6px] select-none'
                  )}
                >
                  {item.title}
                </h4>
                <p
                  className={cn(
                    'text-xs md:text-sm mt-2 line-clamp-2 leading-relaxed',
                    isDarkMode ? 'text-white/42' : 'text-zinc-500',
                    isBlurred && 'blur-[6px] select-none'
                  )}
                >
                  {item.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 shrink-0 w-full">
              <DifficultyDots difficulty={item.difficulty} color={config.color} />
              <motion.div
                animate={{ rotate: isExpanded && !isBlurred ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isBlurred ? (
                  <Lock className="w-4 h-4 text-zinc-400" />
                ) : (
                  <div
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5',
                      isDarkMode ? 'border-white/8 text-white/35' : 'border-zinc-200 text-zinc-400'
                    )}
                  >
                    Details
                    <ChevronDown className="w-3 h-3" />
                  </div>
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
              <div
                className={cn(
                  'px-5 md:px-6 pb-6 pt-4 border-t',
                  isDarkMode ? 'border-white/[0.06]' : 'border-zinc-100'
                )}
              >
                {/* Details text */}
                <p
                  className={cn(
                    'text-[13px] md:text-sm leading-relaxed mb-5',
                    isDarkMode ? 'text-white/58' : 'text-zinc-600'
                  )}
                >
                  {item.details}
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Impact */}
                  <div
                    className={cn(
                      'rounded-xl p-3 text-center',
                      isDarkMode ? 'bg-white/[0.03]' : 'bg-zinc-50'
                    )}
                  >
                    <TrendingUp
                      className="w-4 h-4 mx-auto mb-1.5"
                      style={{ color: config.color }}
                    />
                    <p
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider opacity-40 mb-0.5',
                        isDarkMode ? 'text-white' : 'text-zinc-900'
                      )}
                    >
                      Impact
                    </p>
                    <p
                      className={cn(
                        'text-[11px] font-semibold',
                        isDarkMode ? 'text-white' : 'text-zinc-800'
                      )}
                    >
                      {item.expectedImpact}
                    </p>
                  </div>

                  {/* Cost */}
                  <div
                    className={cn(
                      'rounded-xl p-3 text-center',
                      isDarkMode ? 'bg-white/[0.03]' : 'bg-zinc-50'
                    )}
                  >
                    <DollarSign className="w-4 h-4 mx-auto mb-1.5 text-emerald-500" />
                    <p
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider opacity-40 mb-0.5',
                        isDarkMode ? 'text-white' : 'text-zinc-900'
                      )}
                    >
                      Cost
                    </p>
                    <p
                      className={cn(
                        'text-[11px] font-semibold',
                        isDarkMode ? 'text-white' : 'text-zinc-800'
                      )}
                    >
                      {item.costRange}
                    </p>
                  </div>

                  {/* Timeframe */}
                  <div
                    className={cn(
                      'rounded-xl p-3 text-center',
                      isDarkMode ? 'bg-white/[0.03]' : 'bg-zinc-50'
                    )}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1.5 text-blue-500" />
                    <p
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider opacity-40 mb-0.5',
                        isDarkMode ? 'text-white' : 'text-zinc-900'
                      )}
                    >
                      Results
                    </p>
                    <p
                      className={cn(
                        'text-[11px] font-semibold',
                        isDarkMode ? 'text-white' : 'text-zinc-800'
                      )}
                    >
                      {item.timeframe}
                    </p>
                  </div>

                  {/* Recovery */}
                  <div
                    className={cn(
                      'rounded-xl p-3 text-center',
                      isDarkMode ? 'bg-white/[0.03]' : 'bg-zinc-50'
                    )}
                  >
                    <Shield className="w-4 h-4 mx-auto mb-1.5 text-violet-500" />
                    <p
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider opacity-40 mb-0.5',
                        isDarkMode ? 'text-white' : 'text-zinc-900'
                      )}
                    >
                      Recovery
                    </p>
                    <p
                      className={cn(
                        'text-[11px] font-semibold',
                        isDarkMode ? 'text-white' : 'text-zinc-800'
                      )}
                    >
                      {item.recovery || 'None'}
                    </p>
                  </div>
                </div>

                {/* Target areas */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.targetAreas.map((area) => (
                    <span
                      key={area}
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[9px] font-semibold',
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
  const safeItems = getSafePlanItems(items);
  const previewItems: PlanItem[] = safeItems.length
    ? safeItems.slice(0, 4)
    : [
        {
          title: 'Skin texture optimization',
          category: 'Foundational',
          difficulty: 2,
          description: 'Personalized skincare priorities based on your scan.',
          details: '',
          expectedImpact: 'Medium',
          costRange: '$',
          timeframe: '2-6 weeks',
          recovery: null,
          targetAreas: ['Skin', 'Texture']
        },
        {
          title: 'Hair and grooming frame',
          category: 'Non-Invasive',
          difficulty: 2,
          description: 'Face-shape specific styling and grooming adjustments.',
          details: '',
          expectedImpact: 'High',
          costRange: '$$',
          timeframe: 'Instant',
          recovery: null,
          targetAreas: ['Hair', 'Grooming']
        },
        {
          title: 'Jawline presentation routine',
          category: 'Foundational',
          difficulty: 3,
          description: 'Low-risk posture, leanness, and photo-angle improvements.',
          details: '',
          expectedImpact: 'Medium',
          costRange: '$',
          timeframe: '4-8 weeks',
          recovery: null,
          targetAreas: ['Jawline', 'Posture']
        },
        {
          title: 'Professional enhancement options',
          category: 'Minimally Invasive',
          difficulty: 4,
          description: 'Optional expert-led paths ranked by effort and impact.',
          details: '',
          expectedImpact: 'Variable',
          costRange: '$$$',
          timeframe: 'Consult',
          recovery: 'Varies',
          targetAreas: ['Advanced']
        }
      ];

  const categories = ['All', 'Foundational', 'Non-Invasive', 'Minimally Invasive'];
  const getCategoryLabel = (cat: string) =>
    cat === 'All' ? 'All' : CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.display || cat;

  const filtered =
    activeFilter === 'All' ? safeItems : safeItems.filter((item) => item.category === activeFilter);

  const categoryCounts = {
    Foundational: safeItems.filter((i) => i.category === 'Foundational').length,
    'Non-Invasive': safeItems.filter((i) => i.category === 'Non-Invasive').length,
    'Minimally Invasive': safeItems.filter((i) => i.category === 'Minimally Invasive').length
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-2xl md:rounded-3xl overflow-hidden relative border',
          isDarkMode ? 'bg-white/[0.025] border-white/[0.07]' : 'bg-white border-zinc-200'
        )}
        style={{
          boxShadow: isDarkMode ? 'none' : '0 18px 50px rgba(24,24,27,0.04)'
        }}
      >
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className={cn('w-4 h-4', isDarkMode ? 'text-white/35' : 'text-zinc-400')} />
            <span
              className={cn(
                'text-[9px] font-black uppercase tracking-[0.2em]',
                isDarkMode ? 'text-white/35' : 'text-zinc-400'
              )}
            >
              Action Plan
            </span>
          </div>
          <h2
            className={cn(
              'text-2xl md:text-4xl font-display italic tracking-tight mb-2',
              isDarkMode ? 'text-white/90' : 'text-zinc-950'
            )}
          >
            Personalized improvement plan
          </h2>
          <p
            className={cn(
              'text-sm max-w-2xl leading-relaxed',
              isDarkMode ? 'text-white/45' : 'text-zinc-500'
            )}
          >
            A realistic action plan focused on grooming, skin maintenance, presentation, and small
            evidence-based upgrades from your scan.
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
                    border: `1px solid ${cfg.color}30`
                  }}
                >
                  <cfg.icon className="w-3 h-3" />
                  {count} {cfg.display}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-2xl border p-2',
          isDarkMode ? 'bg-white/[0.025] border-white/[0.06]' : 'bg-zinc-50 border-zinc-200'
        )}
      >
        {categories.map((cat) => {
          const isActive = activeFilter === cat;
          const cfg = cat !== 'All' ? CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG] : null;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200',
                isActive
                  ? isDarkMode
                    ? 'bg-white/10 text-white'
                    : 'bg-zinc-900 text-white'
                  : isDarkMode
                    ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
                    : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
              )}
              style={isActive && cfg ? { background: `${cfg.color}20`, color: cfg.color } : {}}
            >
              {getCategoryLabel(cat)}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      {isLocked ? (
        <div
          className={cn(
            'relative overflow-hidden rounded-3xl border p-5 md:p-7',
            isDarkMode
              ? 'bg-gradient-to-br from-white/[0.035] via-indigo-500/[0.035] to-purple-500/[0.04] border-white/[0.08]'
              : 'bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/60 border-zinc-200 shadow-xl shadow-indigo-100/50'
          )}
        >
          <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-28 right-10 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 md:gap-7 items-stretch">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {previewItems.map((item, i) => {
                const cfg = CATEGORY_CONFIG[item.category];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={`${item.title}-${i}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      'relative overflow-hidden rounded-2xl border p-4 md:p-5 min-h-[150px]',
                      isDarkMode ? 'bg-black/30 border-white/[0.07]' : 'bg-white/80 border-zinc-200'
                    )}
                  >
                    <div className="absolute inset-0 backdrop-blur-[1px]" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-xl"
                          style={{ background: `${cfg.color}18`, color: cfg.color }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <Lock
                          className={cn('h-4 w-4', isDarkMode ? 'text-white/20' : 'text-zinc-300')}
                        />
                      </div>
                      <div className="blur-[5px] select-none">
                        <h4
                          className={cn(
                            'text-base font-bold mb-2',
                            isDarkMode ? 'text-white/90' : 'text-zinc-900'
                          )}
                        >
                          {item.title}
                        </h4>
                        <p
                          className={cn(
                            'text-xs leading-relaxed',
                            isDarkMode ? 'text-white/45' : 'text-zinc-500'
                          )}
                        >
                          {item.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {item.targetAreas.slice(0, 2).map((area) => (
                            <span
                              key={area}
                              className={cn(
                                'px-2 py-1 rounded-lg text-[9px] font-bold',
                                isDarkMode
                                  ? 'bg-white/5 text-white/35'
                                  : 'bg-zinc-100 text-zinc-500'
                              )}
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div
              className={cn(
                'relative rounded-3xl border p-6 flex flex-col justify-center items-center text-center overflow-hidden',
                isDarkMode ? 'bg-black/35 border-white/[0.08]' : 'bg-white/85 border-zinc-200'
              )}
            >
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-purple-500/20 border border-white/10">
                <Lock className="h-6 w-6 text-emerald-400" />
              </div>
              <h3
                className={cn(
                  'text-2xl font-display italic mb-2',
                  isDarkMode ? 'text-white' : 'text-zinc-950'
                )}
              >
                Your plan is ready
              </h3>
              <p
                className={cn(
                  'text-sm leading-relaxed mb-6 max-w-xs',
                  isDarkMode ? 'text-white/45' : 'text-zinc-500'
                )}
              >
                Unlock the full roadmap with prioritized steps, cost ranges, timelines, and exact
                areas to improve.
              </p>
              <button
                onClick={onUnlock}
                className="group relative w-full max-w-[280px] p-0.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-600 rounded-2xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative rounded-[14px] px-5 py-4 bg-zinc-950 flex items-center justify-center gap-3">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="font-black text-[10px] uppercase tracking-[0.16em] bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-purple-400">
                    Unlock Full Plan
                  </span>
                </div>
              </button>
              <div
                className={cn(
                  'mt-4 text-[10px] font-bold uppercase tracking-[0.16em]',
                  isDarkMode ? 'text-white/25' : 'text-zinc-400'
                )}
              >
                Includes {previewItems.length}+ personalized actions
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
      )}
    </div>
  );
}
