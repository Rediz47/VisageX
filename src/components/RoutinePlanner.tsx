import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, Droplets, Sparkles, Activity, CheckCircle2, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RoutineItem {
  task: string;
  benefit: string;
  details?: string;
  products?: string;
  icon: React.ReactNode;
}

interface RoutinePlannerProps {
  result: any;
  isDarkMode: boolean;
}

export function RoutinePlanner({ result, isDarkMode }: RoutinePlannerProps) {
  const { visionAnalysis, breakdown } = result;
  const dermatology = visionAnalysis?.dermatology || {};

  const getMorningRoutine = (): RoutineItem[] => {
    if (visionAnalysis?.routine?.am && visionAnalysis.routine.am.length > 0) {
      return visionAnalysis.routine.am.map((item: any) => ({
        task: item.task,
        benefit: item.benefit,
        details: item.details,
        products: item.products,
        icon: <Sun className="w-4 h-4" />
      }));
    }

    const routine: RoutineItem[] = [
      {
        task: 'Gentle Cleansing',
        benefit: 'Remove overnight impurities',
        details: 'Massage into damp skin for 60 seconds, then rinse with lukewarm water.',
        products: 'Look for a low-pH, hydrating cleanser.',
        icon: <Droplets className="w-4 h-4" />
      }
    ];

    if (dermatology.oiliness < 7) {
      routine.push({
        task: 'Oil-Control Serum',
        benefit: 'Balance sebum production',
        details: 'Apply 2-3 drops to dry skin, focusing on the T-zone.',
        products: 'Niacinamide or Zinc PCA.',
        icon: <Activity className="w-4 h-4" />
      });
    } else {
      routine.push({
        task: 'Vitamin C Serum',
        benefit: 'Brighten and protect',
        details: 'Apply 3-4 drops to dry skin and let it absorb fully.',
        products: 'L-ascorbic acid (10-15%).',
        icon: <Sparkles className="w-4 h-4" />
      });
    }

    if (dermatology.skin_quality < 8) {
      routine.push({
        task: 'Hyaluronic Acid',
        benefit: 'Deep hydration boost',
        details: 'Apply to slightly damp skin to lock in moisture.',
        products: 'Multi-molecular weight hyaluronic acid.',
        icon: <Droplets className="w-4 h-4" />
      });
    }

    routine.push({
      task: 'SPF 50+',
      benefit: 'Essential UV protection',
      details: 'Apply two finger-lengths to face and neck as the final step.',
      products: 'Broad-spectrum sunscreen, mineral or chemical.',
      icon: <Sun className="w-4 h-4" />
    });

    return routine;
  };

  const getEveningRoutine = (): RoutineItem[] => {
    if (visionAnalysis?.routine?.pm && visionAnalysis.routine.pm.length > 0) {
      return visionAnalysis.routine.pm.map((item: any) => ({
        task: item.task,
        benefit: item.benefit,
        details: item.details,
        products: item.products,
        icon: <Moon className="w-4 h-4" />
      }));
    }

    const routine: RoutineItem[] = [
      {
        task: 'Double Cleanse',
        benefit: 'Remove SPF and pollutants',
        details:
          'Start with an oil-based cleanser for 60s, rinse, then follow with a water-based cleanser.',
        products: 'Cleansing balm/oil + gentle gel cleanser.',
        icon: <Droplets className="w-4 h-4" />
      }
    ];

    if (dermatology.acne_presence < 8) {
      routine.push({
        task: 'Salicylic Acid',
        benefit: 'Clear pores and prevent acne',
        details: 'Apply to affected areas or full face 2-3 times a week.',
        products: '2% BHA liquid exfoliant.',
        icon: <Zap className="w-4 h-4" />
      });
    }

    if (breakdown.Jawline < 8 || breakdown.Symmetry < 8) {
      routine.push({
        task: 'Gua Sha / Massage',
        benefit: 'Lymphatic drainage & contouring',
        details:
          'Use with a facial oil, gliding upwards and outwards along the jawline and cheekbones.',
        products: 'Rose quartz or jade Gua Sha tool.',
        icon: <Activity className="w-4 h-4" />
      });
    }

    if (dermatology.wrinkle_visibility < 8) {
      routine.push({
        task: 'Retinol (0.5%)',
        benefit: 'Cell turnover & collagen',
        details: 'Apply a pea-sized amount to dry skin. Start 2x a week and build tolerance.',
        products: 'Encapsulated retinol or retinaldehyde.',
        icon: <Sparkles className="w-4 h-4" />
      });
    } else {
      routine.push({
        task: 'Night Repair Cream',
        benefit: 'Barrier restoration',
        details: 'Massage a generous layer into face and neck.',
        products: 'Ceramides, peptides, and squalane.',
        icon: <Moon className="w-4 h-4" />
      });
    }

    return routine;
  };

  const morning = getMorningRoutine();
  const evening = getEveningRoutine();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        'rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border shadow-2xl relative overflow-hidden',
        isDarkMode ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Activity className="w-32 h-32" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-12">
          <div>
            <p
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.3em] mb-2 opacity-40',
                isDarkMode ? 'text-white' : 'text-slate-900'
              )}
            >
              Personalized Routine
            </p>
            <h3
              className={cn(
                'text-3xl md:text-5xl font-display italic',
                isDarkMode ? 'text-white' : 'text-slate-900'
              )}
            >
              Daily Routine.
            </h3>
          </div>
          <div
            className={cn(
              'px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2',
              isDarkMode
                ? 'bg-zinc-800 border-white/10 text-zinc-100'
                : 'bg-zinc-100 border-zinc-200 text-zinc-900'
            )}
          >
            <CheckCircle2 className="w-3 h-3" />
            Optimized for your face
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Morning Routine */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Sun className="w-5 h-5 text-amber-500" />
              </div>
              <h4
                className={cn(
                  'text-xl font-display italic',
                  isDarkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                A.M. Protocol
              </h4>
            </div>
            <div className="space-y-4">
              {morning.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'p-4 rounded-2xl border flex items-start gap-4 group transition-all',
                    isDarkMode
                      ? 'bg-white/5 border-white/5 hover:bg-white/10'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0',
                      isDarkMode
                        ? 'bg-white/5 text-white/40 group-hover:text-white'
                        : 'bg-white text-slate-400 group-hover:text-black'
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <p
                        className={cn(
                          'text-sm font-bold truncate',
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {item.task}
                      </p>
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full w-fit',
                          isDarkMode ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {item.benefit}
                      </span>
                    </div>
                    {item.details && (
                      <p
                        className={cn(
                          'text-xs mt-2 leading-relaxed',
                          isDarkMode ? 'text-white/60' : 'text-slate-600'
                        )}
                      >
                        {item.details}
                      </p>
                    )}
                    {item.products && (
                      <div
                        className={cn(
                          'mt-3 p-2 rounded-lg text-[10px] border flex gap-2 items-start',
                          isDarkMode
                            ? 'bg-white/5 border-white/5 text-white/50'
                            : 'bg-slate-50 border-slate-100 text-slate-500'
                        )}
                      >
                        <Sparkles className="w-3 h-3 shrink-0 mt-0.5 opacity-50" />
                        <span>
                          <strong className={isDarkMode ? 'text-white/70' : 'text-slate-700'}>
                            Look for:
                          </strong>{' '}
                          {item.products}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Evening Routine */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                <Moon className="w-5 h-5 text-indigo-500" />
              </div>
              <h4
                className={cn(
                  'text-xl font-display italic',
                  isDarkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                P.M. Protocol
              </h4>
            </div>
            <div className="space-y-4">
              {evening.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'p-4 rounded-2xl border flex items-start gap-4 group transition-all',
                    isDarkMode
                      ? 'bg-white/5 border-white/5 hover:bg-white/10'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0',
                      isDarkMode
                        ? 'bg-white/5 text-white/40 group-hover:text-white'
                        : 'bg-white text-slate-400 group-hover:text-black'
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <p
                        className={cn(
                          'text-sm font-bold truncate',
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {item.task}
                      </p>
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full w-fit',
                          isDarkMode ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {item.benefit}
                      </span>
                    </div>
                    {item.details && (
                      <p
                        className={cn(
                          'text-xs mt-2 leading-relaxed',
                          isDarkMode ? 'text-white/60' : 'text-slate-600'
                        )}
                      >
                        {item.details}
                      </p>
                    )}
                    {item.products && (
                      <div
                        className={cn(
                          'mt-3 p-2 rounded-lg text-[10px] border flex gap-2 items-start',
                          isDarkMode
                            ? 'bg-white/5 border-white/5 text-white/50'
                            : 'bg-slate-50 border-slate-100 text-slate-500'
                        )}
                      >
                        <Sparkles className="w-3 h-3 shrink-0 mt-0.5 opacity-50" />
                        <span>
                          <strong className={isDarkMode ? 'text-white/70' : 'text-slate-700'}>
                            Look for:
                          </strong>{' '}
                          {item.products}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div
          className={cn(
            'mt-10 pt-6 border-t flex items-center gap-3',
            isDarkMode ? 'border-white/5' : 'border-slate-100'
          )}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p
            className={cn(
              'text-[10px] font-bold uppercase tracking-widest opacity-40',
              isDarkMode ? 'text-white' : 'text-slate-900'
            )}
          >
            Consistency is key. Follow this plan and you can reach your full potential in 4-6 weeks.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
