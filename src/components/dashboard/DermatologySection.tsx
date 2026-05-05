import React from 'react';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DermatologySectionProps {
  isDarkMode: boolean;
  isLocked: boolean;
  dermatology: any;
}

function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  return <span>{value.toFixed(1)}</span>;
}

const getScoreBg = (score: number) => {
  if (score >= 8) return 'bg-emerald-400';
  if (score >= 6) return 'bg-amber-400';
  return 'bg-rose-400';
};

export function DermatologySection({ isDarkMode, isLocked, dermatology }: DermatologySectionProps) {
  if (!dermatology) return null;

  return (
    <div
      className={cn(
        'rounded-2xl p-4 md:p-5 shadow-2xl border mt-3 md:mt-4',
        isDarkMode ? 'bg-black border-white/10' : 'bg-white border-zinc-200 shadow-sm'
      )}
    >
      <h3
        className={cn(
          'text-sm md:text-base font-display font-semibold mb-3 md:mb-4 flex items-center',
          isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
        )}
      >
        <Activity className={cn('w-4 h-4 mr-2', isDarkMode ? 'text-cyan-400' : 'text-cyan-600')} />
        Dermatology Analysis
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
        {[
          { label: 'Skin Health', value: dermatology.skin_quality },
          { label: 'Acne (Clear)', value: dermatology.acne_presence },
          { label: 'Wrinkles (Smooth)', value: dermatology.wrinkle_visibility },
          { label: 'Skin Texture', value: dermatology.skin_texture },
          { label: 'Dark Circles (Clear)', value: dermatology.dark_circles },
          { label: 'Redness (Clear)', value: dermatology.redness },
          { label: 'Oiliness (Balanced)', value: dermatology.oiliness }
        ].map((item, i) => (
          <div
            key={i}
            className={cn(
              'p-2.5 md:p-3 rounded-xl border flex flex-col justify-between',
              isDarkMode ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-200'
            )}
          >
            <span
              className={cn(
                'text-[8px] md:text-[10px] uppercase tracking-wider font-semibold mb-1.5 md:mb-2',
                isDarkMode ? 'text-white/50' : 'text-zinc-500'
              )}
            >
              {item.label}
            </span>
            <div>
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  className={cn(
                    'text-xl md:text-2xl font-display font-bold',
                    isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                  )}
                >
                  {isLocked ? '??' : <AnimatedCounter value={item.value} delay={1.2 + i * 0.1} />}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    isDarkMode ? 'text-white/30' : 'text-black/10'
                  )}
                >
                  /10
                </span>
              </div>
              <div
                className={cn(
                  'w-full rounded-full h-1 overflow-hidden',
                  isDarkMode ? 'bg-white/5' : 'bg-zinc-100'
                )}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / 10) * 100}%` }}
                  transition={{ duration: 1, delay: 1.5 + i * 0.1, ease: 'easeOut' }}
                  className={cn('h-full rounded-full', getScoreBg(item.value))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
