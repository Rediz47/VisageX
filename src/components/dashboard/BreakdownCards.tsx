import React from 'react';
import { motion } from 'motion/react';
import { Eye, ShieldCheck, Sparkles, Activity, Gem, UserRound } from 'lucide-react';
import { cn } from '../../lib/utils';

/* ?? Tier config matching website palette ?? */
interface Tier {
  label: string;
  color: string;
  glow: string;
  glowLight: string;
}

function getTier(score: number): Tier {
  if (score >= 9)
    return {
      label: 'Elite',
      color: '#22d3ee',
      glow: 'rgba(34,211,238,0.2)',
      glowLight: 'rgba(34,211,238,0.08)'
    };
  if (score >= 8)
    return {
      label: 'Superior',
      color: '#818cf8',
      glow: 'rgba(129,140,248,0.2)',
      glowLight: 'rgba(129,140,248,0.08)'
    };
  if (score >= 7)
    return {
      label: 'Strong',
      color: '#a78bfa',
      glow: 'rgba(167,139,250,0.18)',
      glowLight: 'rgba(167,139,250,0.07)'
    };
  if (score >= 5)
    return {
      label: 'Average',
      color: '#71717a',
      glow: 'rgba(113,113,122,0.1)',
      glowLight: 'rgba(113,113,122,0.05)'
    };
  return {
    label: 'Low',
    color: '#f87171',
    glow: 'rgba(248,113,113,0.15)',
    glowLight: 'rgba(248,113,113,0.06)'
  };
}

/* ?? Feature metadata ?? */
const META: Record<string, { icon: React.ElementType; description: string; label: string }> = {
  Eyes: {
    icon: Eye,
    description: 'Canthal tilt, spacing, and vertical positioning.',
    label: 'Eyes'
  },
  'Skin Quality': {
    icon: ShieldCheck,
    description: 'Texture, clarity, and vascular health.',
    label: 'Skin Quality'
  },
  Symmetry: {
    icon: Gem,
    description: 'Bilateral harmonic alignment across 468 neural nodes.',
    label: 'Symmetry'
  },
  Jawline: {
    icon: Activity,
    description: 'Angular definition and mandibular width.',
    label: 'Jawline'
  },
  Hair: { icon: Sparkles, description: 'Hairline health, density, and styling.', label: 'Hair' },
  Dimorphism: {
    icon: UserRound,
    description: 'Secondary sex characteristics and structure.',
    label: 'Dimorphism'
  },
  Grooming: {
    icon: Sparkles,
    description: 'Facial hair, skincare, and overall presentation.',
    label: 'Grooming'
  },
  Cheekbones: {
    icon: Gem,
    description: 'Zygomatic prominence and midface structure.',
    label: 'Cheekbones'
  }
};

const CORE_ORDER = ['Eyes', 'Skin Quality', 'Symmetry', 'Jawline', 'Hair', 'Dimorphism'];
const FREE_KEYS = new Set(['Eyes']);

interface BreakdownCardsProps {
  breakdown: Record<string, number | undefined>;
  isDarkMode: boolean;
  isLocked: boolean;
}

export function BreakdownCards({ breakdown, isDarkMode, isLocked }: BreakdownCardsProps) {
  const extras = Object.keys(breakdown).filter(
    (k) => !CORE_ORDER.includes(k) && breakdown[k] !== undefined && META[k]
  );
  const cards = [...CORE_ORDER, ...extras]
    .filter((k) => breakdown[k] !== undefined)
    .map((k) => ({
      key: k,
      score: breakdown[k] as number,
      meta: META[k] ?? { icon: Sparkles, description: '', label: k }
    }));

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6"
      >
        <p
          className={cn(
            'text-[10px] font-bold uppercase tracking-[0.3em] mb-2',
            isDarkMode ? 'text-indigo-400' : 'text-indigo-500'
          )}
        >
          Metrics
        </p>
        <h3
          className={cn(
            'text-3xl md:text-4xl font-display italic tracking-tight',
            isDarkMode ? 'text-white' : 'text-zinc-900'
          )}
        >
          Feature{' '}
          <span className="gradient-text-brand not-italic font-sans font-black">Breakdown</span>
        </h3>
      </motion.div>

      {(() => {
        const cols = 3;
        const remainder = cards.length % cols;
        const mainCards = remainder === 0 ? cards : cards.slice(0, cards.length - remainder);
        const bottomCards = remainder === 0 ? [] : cards.slice(cards.length - remainder);

        const renderCard = (card: (typeof cards)[0], i: number, isWide: boolean) => {
          const tier = getTier(card.score);
          const Icon = card.meta.icon;
          const locked = isLocked && !FREE_KEYS.has(card.key);
          const blurDescription = isLocked;

          const scoreStyle =
            card.score >= 8
              ? {
                  background: `linear-gradient(135deg, ${tier.color}, #6366f1)`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }
              : { color: tier.color };

          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              className={cn(
                'group relative rounded-2xl md:rounded-[1.75rem] border overflow-hidden hover-glow-card transition-all duration-300',
                isWide ? 'flex flex-row items-center gap-4 p-4 md:p-5' : 'flex flex-col p-4 md:p-5',
                isDarkMode
                  ? 'bg-white/[0.03] border-white/[0.07]'
                  : 'bg-white border-zinc-200/80 shadow-xl shadow-zinc-900/[0.04]'
              )}
              style={{
                boxShadow: locked
                  ? undefined
                  : `inset 0 0 40px ${isDarkMode ? tier.glow : tier.glowLight}`
              }}
            >
              {locked && (
                <div
                  className={cn(
                    'absolute inset-0 z-20 pointer-events-none backdrop-blur-[4px]',
                    isDarkMode ? 'bg-black/18' : 'bg-white/28'
                  )}
                />
              )}
              <div className="absolute -right-4 -bottom-4 pointer-events-none opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
                <Icon className="w-24 h-24 md:w-28 md:h-28" />
              </div>

              {isWide ? (
                <>
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50',
                      locked && 'blur-[8px] opacity-45 grayscale'
                    )}
                  >
                    <Icon className="w-5 h-5" style={{ color: tier.color }} />
                  </div>

                  <div className={cn('flex-1 min-w-0 relative z-10', locked && 'blur-[8px] opacity-45 grayscale select-none')}>
                    <div className="flex items-center gap-2.5 mb-1">
                      <p
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-[0.2em]',
                          isDarkMode ? 'text-white/40' : 'text-zinc-500'
                        )}
                      >
                        {card.meta.label}
                      </p>
                      {!locked && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full"
                          style={{
                            color: tier.color,
                            background: `${tier.color}12`,
                            border: `1px solid ${tier.color}20`
                          }}
                        >
                          {tier.label}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        'text-[11px] md:text-xs font-light leading-relaxed',
                        isDarkMode ? 'text-zinc-400' : 'text-zinc-600',
                        blurDescription && 'blur-[6px] opacity-60 select-none'
                      )}
                    >
                      {card.meta.description}
                    </p>
                    <div className="mt-3">
                      <div
                        className={cn(
                          'h-1 w-full rounded-full overflow-hidden',
                          isDarkMode ? 'bg-white/[0.05]' : 'bg-zinc-100'
                        )}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${tier.color}, #6366f1)` }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(card.score / 10) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 1.2,
                            delay: 0.2 + i * 0.06,
                            ease: [0.22, 1, 0.36, 1]
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={cn('flex items-baseline gap-1 flex-shrink-0 relative z-10', locked && 'blur-[10px] opacity-38 grayscale select-none')}>
                    <span className="text-4xl md:text-5xl font-display font-black leading-none tracking-tighter" style={scoreStyle}>
                      {card.score.toFixed(1)}
                    </span>
                    <span className={cn('text-[10px] font-bold uppercase tracking-widest opacity-40', isDarkMode ? 'text-white' : 'text-zinc-500')}>
                      / 10
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 md:mb-5 relative z-10">
                    <div
                      className={cn(
                        'w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center',
                        isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50',
                        locked && 'blur-[8px] opacity-45 grayscale'
                      )}
                    >
                      <Icon className="w-4 h-4" style={{ color: tier.color }} />
                    </div>
                    {!locked && (
                      <span
                        className="text-[8px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                        style={{
                          color: tier.color,
                          background: `${tier.color}12`,
                          border: `1px solid ${tier.color}20`
                        }}
                      >
                        {tier.label}
                      </span>
                    )}
                  </div>

                  <p
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-[0.2em] mb-2 relative z-10',
                      isDarkMode ? 'text-white/40' : 'text-zinc-500',
                      locked && 'blur-[8px] opacity-45 grayscale select-none'
                    )}
                  >
                    {card.meta.label}
                  </p>

                  <div className={cn('flex items-baseline gap-1 mb-3 relative z-10', locked && 'blur-[10px] opacity-38 grayscale select-none')}>
                    <span className="text-4xl md:text-[44px] font-display font-black leading-none" style={scoreStyle}>
                      {card.score.toFixed(1)}
                    </span>
                    <span className={cn('text-sm font-medium', isDarkMode ? 'text-white/15' : 'text-zinc-300')}>
                      / 10
                    </span>
                  </div>

                  <p
                    className={cn(
                      'text-[11px] md:text-xs font-light leading-relaxed flex-1 relative z-10',
                      isDarkMode ? 'text-zinc-400' : 'text-zinc-600',
                      locked
                        ? 'blur-[8px] opacity-45 grayscale select-none'
                        : blurDescription && 'blur-[6px] opacity-60 select-none'
                    )}
                  >
                    {card.meta.description}
                  </p>

                  <div className={cn('mt-4 relative z-10', locked && 'blur-[8px] opacity-38 grayscale select-none')}>
                    <div
                      className={cn(
                        'h-1 w-full rounded-full overflow-hidden',
                        isDarkMode ? 'bg-white/[0.05]' : 'bg-zinc-100'
                      )}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${tier.color}, #6366f1)` }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(card.score / 10) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 1.2,
                          delay: 0.2 + i * 0.06,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          );
        };

        return (
          <div className="space-y-4 md:space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {mainCards.map((card, i) => renderCard(card, i, false))}
            </div>

            {bottomCards.length > 0 && (
              <div
                className={cn(
                  'grid gap-4 md:gap-5',
                  bottomCards.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                )}
              >
                {bottomCards.map((card, i) =>
                  renderCard(card, mainCards.length + i, bottomCards.length === 1)
                )}
              </div>
            )}
          </div>
        );
      })()}
    </section>
  );
}
