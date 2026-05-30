import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  AlertTriangle,
  TrendingDown,
  Zap,
  ArrowRight,
  Sparkles,
  Target
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

type Severity = 'extreme' | 'high' | 'moderate' | 'low';
type Category = 'Harmony' | 'Angularity' | 'Dimorphism' | 'Features';

interface ImprovementItem {
  title: string;
  category: Category;
  severity: Severity;
  impact: number; // -3 to +3
  description: string;
  affectedMetrics: { name: string; score: number }[];
  actions: { label: string; type: 'foundational' | 'advanced' | 'surgical' }[];
  guideLink?: string;
}

interface AreaOfImprovementProps {
  improvements: ImprovementItem[];
  isDarkMode: boolean;
  isLocked?: boolean;
  potentialScore?: number;
  currentScore?: number;
}

const CATEGORIES: Category[] = ['Harmony', 'Angularity', 'Dimorphism', 'Features'];

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  extreme: {
    label: 'EXTREME',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20'
  },
  high: {
    label: 'HIGH',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20'
  },
  moderate: {
    label: 'MODERATE',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  low: {
    label: 'LOW',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20'
  }
};

function ImprovementCard({
  item,
  isDarkMode,
  isLocked,
  index
}: {
  item: ImprovementItem;
  isDarkMode: boolean;
  isLocked: boolean;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sev = SEVERITY_CONFIG[item.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className={cn(
        'rounded-xl border overflow-hidden transition-all duration-500',
        isDarkMode
          ? 'bg-white/[0.02] border-white/5 hover:border-white/10'
          : 'bg-white border-zinc-200 hover:border-zinc-300',
        isLocked && 'blur-sm pointer-events-none'
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className={cn(
              'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border whitespace-nowrap',
              sev.color,
              sev.bgColor,
              sev.borderColor,
              item.severity === 'extreme' && 'severity-extreme'
            )}
          >
            {sev.label}
          </span>
          <span
            className={cn(
              'text-xs md:text-sm font-semibold truncate',
              isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
            )}
          >
            {item.title}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className={cn(
              'text-sm font-display italic font-bold',
              item.impact < 0 ? 'text-rose-400' : 'text-emerald-400'
            )}
          >
            {item.impact > 0 ? '+' : ''}
            {item.impact.toFixed(2)}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="opacity-30"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'px-4 pb-5 pt-1 space-y-4 border-t',
                isDarkMode ? 'border-white/5' : 'border-zinc-100'
              )}
            >
              {/* Impact metrics */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3 h-3 text-rose-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                    Impact
                  </span>
                  <span className="text-sm font-bold text-rose-400">
                    {item.impact.toFixed(2)} pts
                  </span>
                </div>
              </div>

              {/* Description */}
              <p
                className={cn(
                  'text-xs leading-relaxed',
                  isDarkMode ? 'text-white/60' : 'text-zinc-600'
                )}
              >
                {item.description}
              </p>

              {/* Affected metrics */}
              {item.affectedMetrics.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target className="w-3 h-3 opacity-40" />
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-widest opacity-40',
                        isDarkMode ? 'text-white' : 'text-zinc-900'
                      )}
                    >
                      Affected Ratios
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {item.affectedMetrics.map((metric) => (
                      <div
                        key={metric.name}
                        className={cn(
                          'flex items-center justify-between p-2.5 rounded-lg border',
                          isDarkMode
                            ? 'bg-white/[0.02] border-white/5'
                            : 'bg-zinc-50 border-zinc-100'
                        )}
                      >
                        <span
                          className={cn(
                            'text-[11px] font-medium',
                            isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
                          )}
                        >
                          {metric.name}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-bold font-display italic',
                            metric.score >= 8
                              ? 'text-emerald-400'
                              : metric.score >= 5
                                ? 'text-amber-400'
                                : 'text-rose-400'
                          )}
                        >
                          {metric.score.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Planned actions */}
              {item.actions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-3 h-3 opacity-40" />
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-widest opacity-40',
                        isDarkMode ? 'text-white' : 'text-zinc-900'
                      )}
                    >
                      Recommended Actions
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {item.actions.map((action, i) => {
                      const typeColors = {
                        foundational: isDarkMode
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-600',
                        advanced: isDarkMode
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                          : 'bg-indigo-50 border-indigo-100 text-indigo-600',
                        surgical: isDarkMode
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : 'bg-rose-50 border-rose-100 text-rose-600'
                      };
                      return (
                        <div
                          key={i}
                          className={cn(
                            'flex items-center justify-between p-2.5 rounded-lg border',
                            typeColors[action.type]
                          )}
                        >
                          <span className="text-[11px] font-medium">{action.label}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-60 px-2 py-0.5 rounded bg-current/10">
                            {action.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Guide link */}
              {item.guideLink && (
                <Link
                  to={item.guideLink}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mt-2 transition-colors',
                    isDarkMode
                      ? 'text-indigo-400 hover:text-indigo-300'
                      : 'text-indigo-600 hover:text-indigo-500'
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  Read Full Guide
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * AreaOfImprovement — Categorized improvement system with tabs
 */
export function AreaOfImprovement({
  improvements,
  isDarkMode,
  isLocked = false,
  potentialScore,
  currentScore
}: AreaOfImprovementProps) {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: improvements.length };
    CATEGORIES.forEach((cat) => {
      counts[cat] = improvements.filter((imp) => imp.category === cat).length;
    });
    return counts;
  }, [improvements]);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return improvements;
    return improvements.filter((imp) => imp.category === activeCategory);
  }, [improvements, activeCategory]);

  const totalImpact = useMemo(() => {
    return filtered.reduce((sum, imp) => sum + Math.abs(imp.impact), 0);
  }, [filtered]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8 }}
      className={cn(
        'rounded-2xl md:rounded-3xl border overflow-hidden',
        isDarkMode ? 'bg-black border-white/5' : 'bg-white border-zinc-200'
      )}
    >
      {/* Header */}
      <div className="p-5 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle
                className={cn('w-4 h-4', isDarkMode ? 'text-rose-400' : 'text-rose-500')}
              />
              <span
                className={cn(
                  'text-[9px] font-black uppercase tracking-[0.3em] opacity-50',
                  isDarkMode ? 'text-white' : 'text-zinc-900'
                )}
              >
                Areas of Improvement
              </span>
            </div>
            <h3
              className={cn(
                'text-2xl md:text-3xl font-display italic tracking-tight',
                isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
              )}
            >
              {improvements.length} areas identified
            </h3>
          </div>

          {/* Score prediction */}
          {potentialScore !== undefined && currentScore !== undefined && (
            <div
              className={cn(
                'flex items-center gap-4 px-5 py-3 rounded-2xl border',
                isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-zinc-50 border-zinc-100'
              )}
            >
              <div className="text-center">
                <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-0.5">
                  Current
                </p>
                <p
                  className={cn(
                    'text-xl font-display italic',
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                  )}
                >
                  {currentScore.toFixed(1)}
                </p>
              </div>
              <ArrowRight
                className={cn('w-4 h-4 opacity-20', isDarkMode ? 'text-white' : 'text-zinc-900')}
              />
              <div className="text-center">
                <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-0.5">
                  Potential
                </p>
                <p className="text-xl font-display italic text-emerald-400">
                  {potentialScore.toFixed(1)}
                </p>
              </div>
              <div className="text-center ml-2">
                <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-0.5">
                  Gain
                </p>
                <p className="text-xl font-display italic text-cyan-400">
                  +{(potentialScore - currentScore).toFixed(1)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {(['All', ...CATEGORIES] as (Category | 'All')[]).map((cat) => {
            const isActive = activeCategory === cat;
            const count = categoryCounts[cat] || 0;
            if (cat !== 'All' && count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'relative px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap',
                  isActive
                    ? isDarkMode
                      ? 'bg-white/10 text-white'
                      : 'bg-zinc-900 text-white'
                    : isDarkMode
                      ? 'text-white/40 hover:text-white/60 hover:bg-white/5'
                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                )}
              >
                {cat}
                {count > 0 && (
                  <span
                    className={cn(
                      'ml-1.5 text-[8px] font-black',
                      isActive ? 'opacity-60' : 'opacity-30'
                    )}
                  >
                    {count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-current rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards list */}
      <div className={cn('px-5 md:px-8 pb-6 md:pb-8 space-y-2', isLocked && 'relative')}>
        {isLocked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-b-2xl">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Unlock to view improvements
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {filtered.map((item, i) => (
            <div key={`${item.title}-${item.category}`}>
              <ImprovementCard item={item} isDarkMode={isDarkMode} isLocked={isLocked} index={i} />
            </div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className={cn('py-12 text-center', isDarkMode ? 'text-white/30' : 'text-zinc-400')}>
            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No improvements in this category</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Helper: Generate improvement items from analysis data
 */
export function generateImprovements(
  analysis: { strengths: string[]; weaknesses: string[] },
  breakdown: Record<string, number>,
  visionAnalysis?: any
): ImprovementItem[] {
  const items: ImprovementItem[] = [];

  // Map weaknesses to structured improvement items
  const weaknessMapping: Record<string, Partial<ImprovementItem>> = {
    jaw: {
      category: 'Angularity',
      affectedMetrics: [{ name: 'Gonial Angle', score: breakdown.Jawline || 5 }],
      actions: [
        { label: 'Mewing exercises (tongue posture)', type: 'foundational' },
        { label: 'Jawline defining exercises', type: 'foundational' },
        { label: 'Strategic facial hair styling', type: 'advanced' }
      ],
      guideLink: '/blog/how-to-fix-recessed-jawline'
    },
    symmetry: {
      category: 'Harmony',
      affectedMetrics: [{ name: 'Bilateral Symmetry', score: breakdown.Symmetry || 5 }],
      actions: [
        { label: 'Sleep position optimization', type: 'foundational' },
        { label: 'Facial massage techniques', type: 'foundational' },
        { label: 'Chewing pattern correction', type: 'advanced' }
      ],
      guideLink: '/blog/how-to-improve-face-symmetry'
    },
    eye: {
      category: 'Features',
      affectedMetrics: [{ name: 'Canthal Tilt', score: breakdown.Eyes || 5 }],
      actions: [
        { label: 'Under‑eye care routine', type: 'foundational' },
        { label: 'Eyebrow shaping optimization', type: 'advanced' }
      ],
      guideLink: '/blog/what-is-canthal-tilt'
    },
    skin: {
      category: 'Features',
      affectedMetrics: [{ name: 'Surface Quality Index', score: breakdown['Skin Quality'] || 5 }],
      actions: [
        { label: 'Daily moisturizing & surface protection', type: 'foundational' },
        { label: 'Hydration & diet optimization', type: 'foundational' },
        { label: 'Advanced non-invasive exfoliating & skin-surface balancing', type: 'advanced' }
      ],
      guideLink: '/blog/does-gua-sha-work'
    },
    hair: {
      category: 'Features',
      affectedMetrics: [{ name: 'Hair Score', score: breakdown.Hair || 5 }],
      actions: [
        { label: 'Face-shape optimized haircut', type: 'foundational' },
        { label: 'Hair density & health supplements', type: 'advanced' }
      ]
    },
    dimorphism: {
      category: 'Dimorphism',
      affectedMetrics: [{ name: 'Dimorphism Score', score: breakdown.Dimorphism || 5 }],
      actions: [
        { label: 'Resistance training for neck/traps', type: 'foundational' },
        { label: 'Body composition optimization', type: 'foundational' }
      ]
    }
  };

  analysis.weaknesses.forEach((weakness, i) => {
    const lc = weakness.toLowerCase();
    let mapping: Partial<ImprovementItem> | undefined;
    let key = '';

    for (const [k, v] of Object.entries(weaknessMapping)) {
      if (lc.includes(k)) {
        mapping = v;
        key = k;
        break;
      }
    }

    if (!mapping) {
      mapping = {
        category: 'Harmony',
        affectedMetrics: [],
        actions: [{ label: 'Consult personalized analysis', type: 'foundational' }]
      };
    }

    // Determine severity based on metric scores
    const avgScore =
      mapping.affectedMetrics && mapping.affectedMetrics.length > 0
        ? mapping.affectedMetrics.reduce((s, m) => s + m.score, 0) / mapping.affectedMetrics.length
        : 5;

    let severity: Severity = 'low';
    if (avgScore < 4) severity = 'extreme';
    else if (avgScore < 6) severity = 'high';
    else if (avgScore < 7.5) severity = 'moderate';

    items.push({
      title: weakness,
      category: mapping.category || 'Harmony',
      severity,
      impact: parseFloat((-(10 - avgScore) * 0.3).toFixed(2)),
      description: `Analysis indicates this area is scoring below optimal levels. ${lc.includes('jaw') ? 'The jaw structure appears softer or less defined than ideal proportions suggest.' : lc.includes('symmetry') ? 'Bilateral asymmetry detected across multiple landmark pairs.' : lc.includes('skin') ? 'Texture irregularities and tone imbalances detected in the surface quality scan.' : 'Improving this metric can significantly boost your overall harmony score.'}`,
      affectedMetrics: mapping.affectedMetrics || [],
      actions: mapping.actions || [],
      guideLink: mapping.guideLink
    });
  });

  // Add improvements from AI vision analysis
  if (visionAnalysis?.improvements) {
    visionAnalysis.improvements.forEach((imp: any, i: number) => {
      const action = typeof imp === 'string' ? imp : imp.action || imp;
      if (
        typeof action === 'string' &&
        !items.some((item) => item.title.toLowerCase() === action.toLowerCase())
      ) {
        items.push({
          title: action,
          category: 'Features',
          severity: 'moderate',
          impact: -0.5,
          description: 'AI vision analysis identified this as an area with improvement potential.',
          affectedMetrics: [],
          actions: [{ label: action, type: 'foundational' }]
        });
      }
    });
  }

  // Sort by severity (extreme first)
  const severityOrder: Record<Severity, number> = { extreme: 0, high: 1, moderate: 2, low: 3 };
  items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return items;
}
