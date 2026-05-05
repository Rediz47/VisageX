import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Activity, User, Scissors, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VisionAnalysisSectionProps {
  isDarkMode: boolean;
  isLocked: boolean;
  visionAnalysis: any;
}

const LONG_HAIR_STYLE_PATTERN = /\b(ponytail|bob|waves|wave|curls|curl|braid|bun|lob|layers|layered|side part)\b/i;

const getSafeHairRecommendations = (visionAnalysis: any) => {
  const recommendations = Array.isArray(visionAnalysis?.hairRecommendations)
    ? visionAnalysis.hairRecommendations
    : [];
  const hasMismatchedLongHairAdvice = recommendations.some((hair: any) =>
    LONG_HAIR_STYLE_PATTERN.test(`${hair?.styleName || ''} ${hair?.reason || ''}`)
  );

  if (!hasMismatchedLongHairAdvice) return recommendations;

  const faceShape = String(visionAnalysis?.faceShape || 'oval').toLowerCase();
  return [
    {
      styleName: 'Textured Crop with Low Taper',
      reason: `A textured crop keeps the top controlled while a low taper sharpens the sides, which suits a ${faceShape} face without making the face look longer. It is a realistic barber cut that adds structure around the forehead and cheekbone area.`
    },
    {
      styleName: 'Clean Side Part with Mid Fade',
      reason:
        'A clean side part creates a polished frame and adds directional balance without covering the strongest facial features. The mid fade keeps the sides tight so the jawline and cheekbones stay visually defined.'
    },
    {
      styleName: 'Short Quiff with Tapered Sides',
      reason:
        'A short quiff adds controlled height and makes the upper third look intentional, while tapered sides keep the silhouette sharp. This works well when you want a cleaner, more masculine profile without relying on long-hair styling.'
    }
  ];
};

export function VisionAnalysisSection({
  isDarkMode,
  isLocked,
  visionAnalysis
}: VisionAnalysisSectionProps) {
  if (!visionAnalysis) return null;
  const safeHairRecommendations = getSafeHairRecommendations(visionAnalysis);
  const faceShapeConfidence =
    typeof visionAnalysis.faceShapeConfidence === 'number'
      ? Math.round(visionAnalysis.faceShapeConfidence * 100)
      : null;

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl md:rounded-3xl border p-4 md:p-6',
        isDarkMode
          ? 'bg-gradient-to-br from-cyan-500/[0.08] via-zinc-950 to-violet-500/[0.08] border-cyan-400/15'
          : 'bg-gradient-to-br from-cyan-50 via-white to-violet-50 border-cyan-100 shadow-xl shadow-cyan-100/40'
      )}
    >
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 70%)',
          filter: 'blur(18px)'
        }}
      />
      <div
        className="absolute -bottom-28 -left-24 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)',
          filter: 'blur(22px)'
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5 md:mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 bg-cyan-500/10 border-cyan-400/20">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.24em] text-cyan-400">
              AI Vision Summary
            </span>
          </div>
          <h3
            className={cn(
              'text-2xl md:text-3xl font-display italic tracking-tight',
              isDarkMode ? 'text-white' : 'text-zinc-950'
            )}
          >
            What the vision model noticed
          </h3>
          <p className={cn('text-sm mt-1 max-w-2xl', isDarkMode ? 'text-white/45' : 'text-zinc-500')}>
            Qualitative observations from the image model: skin texture, grooming, presentation, and overall visual impression.
          </p>
        </div>
        <div
          className={cn(
            'px-3 py-2 rounded-2xl border text-right',
            isDarkMode ? 'bg-white/[0.04] border-white/8' : 'bg-white/80 border-zinc-200'
          )}
        >
          <p className={cn('text-[8px] font-black uppercase tracking-widest', isDarkMode ? 'text-white/35' : 'text-zinc-400')}>
            Source
          </p>
          <p className={cn('text-xs font-bold', isDarkMode ? 'text-white/80' : 'text-zinc-800')}>
            AI-generated visual read
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn(
            'rounded-2xl md:rounded-3xl p-5 md:p-6 border relative overflow-hidden group',
            isDarkMode ? 'bg-black/45 border-white/8' : 'bg-white/85 border-zinc-200 shadow-sm'
          )}
        >
          <div className="absolute top-4 right-4 opacity-10">
            <Activity className="w-16 h-16 md:w-20 md:h-20 text-cyan-400" />
          </div>
          <div className="relative z-10">
            <p
              className={cn(
                'text-[9px] font-black uppercase tracking-[0.24em] mb-2',
                isDarkMode ? 'text-cyan-300/70' : 'text-cyan-600'
              )}
            >
              Skin Health
            </p>
            <h4
              className={cn(
                'text-xl md:text-2xl font-display italic mb-3 md:mb-4',
                isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
              )}
            >
              Skin & Texture
            </h4>
            <p
              className={cn(
                'text-xs md:text-sm leading-relaxed font-light',
                isDarkMode ? 'text-white/70' : 'text-zinc-500'
              )}
            >
              {isLocked
                ? 'Unlock the full report to see your personalized skin and texture analysis.'
                : visionAnalysis.skinAnalysis}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className={cn(
            'rounded-2xl md:rounded-3xl p-5 md:p-6 border relative overflow-hidden group',
            isDarkMode ? 'bg-black/45 border-white/8' : 'bg-white/85 border-zinc-200 shadow-sm'
          )}
        >
          <div className="absolute top-4 right-4 opacity-10">
            <User className="w-16 h-16 md:w-20 md:h-20 text-violet-400" />
          </div>
          <div className="relative z-10">
            <p
              className={cn(
                'text-[9px] font-black uppercase tracking-[0.24em] mb-2',
                isDarkMode ? 'text-violet-300/70' : 'text-violet-600'
              )}
            >
              Overall Look
            </p>
            <h4
              className={cn(
                'text-xl md:text-2xl font-display italic mb-3 md:mb-4',
                isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
              )}
            >
              Aesthetics & Grooming
            </h4>
            <p
              className={cn(
                'text-xs md:text-sm leading-relaxed font-light',
                isDarkMode ? 'text-white/70' : 'text-zinc-500'
              )}
            >
              {isLocked
                ? 'Unlock the full report to see your personalized aesthetics and grooming analysis.'
                : visionAnalysis.aestheticsAnalysis}
            </p>
          </div>
        </motion.div>

        {visionAnalysis.faceShape && safeHairRecommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className={cn(
              'rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border relative overflow-hidden group md:col-span-2',
              isDarkMode
                ? 'bg-gradient-to-br from-black via-zinc-950 to-indigo-950/20 border-indigo-400/15'
                : 'bg-gradient-to-br from-white via-indigo-50/40 to-cyan-50/50 border-indigo-100 shadow-xl shadow-indigo-100/50'
            )}
          >
            <div className="absolute -top-20 -right-16 opacity-[0.04] pointer-events-none">
              <Scissors className="w-64 h-64 md:w-96 md:h-96 transform -rotate-12" />
            </div>
            <div
              className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
              style={{
                background: isDarkMode
                  ? 'radial-gradient(circle, rgba(99,102,241,0.22), transparent 68%)'
                  : 'radial-gradient(circle, rgba(99,102,241,0.14), transparent 68%)'
              }}
            />
            <div
              className="absolute inset-x-8 top-0 h-px pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(129,140,248,0.65), rgba(34,211,238,0.45), transparent)'
              }}
            />
            <div className="absolute bottom-5 right-6 hidden md:block pointer-events-none">
              <span
                className={cn(
                  'text-[120px] font-black leading-none tracking-tighter',
                  isDarkMode ? 'text-white/[0.025]' : 'text-indigo-950/[0.035]'
                )}
              >
                {String(visionAnalysis.faceShape || '').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 md:mb-8 gap-5">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn('h-[1px] w-8', isDarkMode ? 'bg-indigo-300/35' : 'bg-indigo-400/35')}
                    />
                    <p
                      className={cn(
                        'text-[10px] font-black uppercase tracking-[0.3em]',
                        isDarkMode ? 'text-indigo-200/70' : 'text-indigo-600'
                      )}
                    >
                      Barber's Guide
                    </p>
                  </div>
                  <h4
                    className={cn(
                      'text-3xl md:text-4xl font-display italic tracking-tight',
                      isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                    )}
                  >
                    Hair & Face Shape
                  </h4>
                  <p className={cn('text-xs md:text-sm mt-2 max-w-2xl', isDarkMode ? 'text-white/45' : 'text-zinc-500')}>
                    Hair recommendations are matched to your landmark-calculated face shape and visual framing.
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2">
                  <span
                    className={cn(
                      'text-[9px] font-black uppercase tracking-widest',
                      isDarkMode ? 'text-white/35' : 'text-zinc-400'
                    )}
                  >
                    Landmark Shape
                  </span>
                  <div
                    className={cn(
                      'px-5 py-3 rounded-2xl border text-sm font-black tracking-widest uppercase shadow-inner flex items-center gap-2',
                      isDarkMode
                        ? 'bg-indigo-400/10 border-indigo-300/20 text-white shadow-indigo-500/10'
                        : 'bg-white/85 border-indigo-100 text-indigo-950 shadow-indigo-100/70'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.75)]" />
                    {isLocked ? 'Locked' : visionAnalysis.faceShape} Face
                  </div>
                  {faceShapeConfidence != null && !isLocked && (
                    <span className={cn('text-[10px] font-bold', isDarkMode ? 'text-white/35' : 'text-zinc-400')}>
                      {faceShapeConfidence}% geometry confidence
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isLocked ? (
                  <div
                    className={cn(
                      'p-8 rounded-3xl border md:col-span-2 italic text-center flex flex-col items-center justify-center min-h-[200px]',
                      isDarkMode
                        ? 'bg-white/5 border-white/5 text-white/40'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                    )}
                  >
                    <Lock className="w-8 h-8 mb-4 opacity-50" />
                    <p>
                      Unlock the full report to see personalized hair and styling recommendations
                      based on your unique face shape.
                    </p>
                  </div>
                ) : (
                  safeHairRecommendations.map((hair: any, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        'p-5 md:p-6 rounded-3xl border transition-all duration-500 hover:-translate-y-1 group/card relative overflow-hidden',
                        isDarkMode
                          ? 'bg-white/[0.035] border-white/10 hover:bg-white/[0.06] hover:border-indigo-300/25'
                          : 'bg-white/80 border-zinc-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/70 hover:border-indigo-200'
                      )}
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/45 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500',
                            isDarkMode
                              ? 'bg-indigo-500/20 text-indigo-300 group-hover/card:bg-indigo-500/30'
                              : 'bg-indigo-100 text-indigo-600 group-hover/card:bg-indigo-200'
                          )}
                        >
                          <span className="font-black text-sm tabular-nums">0{i + 1}</span>
                        </div>
                        <div>
                          <h5
                            className={cn(
                              'text-base md:text-lg font-black tracking-tight mb-2',
                              isDarkMode ? 'text-white' : 'text-zinc-900'
                            )}
                          >
                            {hair.styleName}
                          </h5>
                          <p
                            className={cn(
                              'text-xs md:text-sm leading-relaxed',
                              isDarkMode ? 'text-white/55' : 'text-zinc-600'
                            )}
                          >
                            {hair.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
