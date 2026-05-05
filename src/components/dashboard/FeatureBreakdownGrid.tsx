import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Target, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDashboardContext } from '../../context/DashboardContext';

interface FeatureItem {
  subject: string;
  A: number;
  fullMark?: number; // usually 10
}

interface FeatureBreakdownGridProps {
  data: FeatureItem[];
}

const FeatureBreakdownGrid = React.memo(function FeatureBreakdownGrid({
  data
}: FeatureBreakdownGridProps) {
  const { isDarkMode, isLocked } = useDashboardContext();

  // Filter data down to perfectly round layouts if needed, or just use exactly what's passed
  // (The dashboard dynamically builds radarData which ensures length >= 6 typically)
  const features = data;
  const numDataPoints = features.length;

  // SVG metrics
  const SVG_SIZE = 360;
  const CENTER = SVG_SIZE / 2;
  const MAX_RADIUS = 110;
  const NUM_RINGS = 5;

  // Helper for polar to cartesian
  const getPoint = (value: number, index: number, total: number, maxRadius: number) => {
    // Start at top (-PI/2)
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    // Map value (0-10) to radius
    const r = (value / 10) * maxRadius;
    return {
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle)
    };
  };

  // Generate web grid (concentric polygons)
  const rings = useMemo(() => {
    return Array.from({ length: NUM_RINGS }).map((_, rIdx) => {
      const radius = MAX_RADIUS * ((rIdx + 1) / NUM_RINGS);
      return Array.from({ length: numDataPoints })
        .map((_, i) => {
          const { x, y } = getPoint(10, i, numDataPoints, radius);
          return `${x},${y}`;
        })
        .join(' ');
    });
  }, [numDataPoints, MAX_RADIUS]);

  // Generate axis lines
  const axes = useMemo(() => {
    return Array.from({ length: numDataPoints }).map((_, i) => {
      return getPoint(10, i, numDataPoints, MAX_RADIUS);
    });
  }, [numDataPoints, MAX_RADIUS]);

  // Labels positioning
  const labels = useMemo(() => {
    return features.map((f, i) => {
      // Push labels out slightly past the max radius
      const pt = getPoint(10, i, numDataPoints, MAX_RADIUS + 30);

      // Determine text anchoring based on X coordinate
      let textAnchor: 'middle' | 'start' | 'end' = 'middle';
      if (Math.abs(pt.x - CENTER) < 10) {
        textAnchor = 'middle'; // Top and bottom
      } else if (pt.x > CENTER) {
        textAnchor = 'start'; // Right side
      } else {
        textAnchor = 'end'; // Left side
      }

      return { ...pt, label: f.subject, textAnchor };
    });
  }, [features, numDataPoints, MAX_RADIUS, CENTER]);

  // Actual data polygon
  const finalPoints = useMemo(() => {
    return features
      .map((f, i) => {
        // If locked and not one of the visible defaults, clamp score to 0 or fake it
        const isItemLocked =
          isLocked && f.subject !== 'Symmetry' && f.subject !== 'Jawline' && f.subject !== 'Eyes';
        const renderValue = isItemLocked ? 3 + Math.random() * 2 : f.A; // small dummy shape if locked
        const { x, y } = getPoint(renderValue, i, numDataPoints, MAX_RADIUS);
        return `${x},${y}`;
      })
      .join(' ');
  }, [features, numDataPoints, MAX_RADIUS, isLocked]);

  // Initial animation points (center collapsed)
  const initialPoints = useMemo(() => {
    return features
      .map((_, i) => {
        const { x, y } = getPoint(0, i, numDataPoints, MAX_RADIUS);
        return `${x},${y}`;
      })
      .join(' ');
  }, [numDataPoints, MAX_RADIUS]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="lg:col-span-12"
    >
      <div
        className={cn(
          'rounded-2xl md:rounded-3xl p-6 md:p-10 border overflow-hidden',
          isDarkMode
            ? 'bg-[#0f0f13] border-white/5 shadow-2xl shadow-black/80'
            : 'bg-white border-zinc-100 shadow-xl shadow-zinc-200/50'
        )}
      >
        {/* Header matching screenshot */}
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 bg-cyan-100 dark:bg-cyan-900/40 rounded-2xl flex-shrink-0">
            <Target className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
          </div>
          <div>
            <h3
              className={cn(
                'text-xl md:text-2xl font-bold tracking-tight mb-1',
                isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
              )}
            >
              Harmony Radar
            </h3>
            <p
              className={cn(
                'text-xs md:text-sm',
                isDarkMode ? 'text-cyan-100/50' : 'text-cyan-600/70'
              )}
            >
              Multi-dimensional feature comparison
            </p>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative w-full aspect-square max-w-[320px] mx-auto flex items-center justify-center mt-4">
          {/* Overlay Lock for free users */}
          {isLocked && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center">
              <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 flex flex-col items-center shadow-2xl">
                <Lock className="w-6 h-6 text-cyan-400 mb-2" />
                <p className="text-white font-bold text-sm text-center">Unlock Full Radar</p>
                <p className="text-white/60 text-xs text-center mt-1">
                  Reveal all 16 facial metrics
                </p>
              </div>
            </div>
          )}

          <svg
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="w-full h-full overflow-visible"
            style={{ filter: isLocked ? 'blur(4px)' : 'none', transition: 'filter 0.5s ease' }}
          >
            {/* Defs for gradients & glows */}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={isDarkMode ? 0.6 : 0.5} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={isDarkMode ? 0.3 : 0.2} />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Map / Web */}
            <g>
              {rings.map((pointsStr, i) => (
                <polygon
                  key={i}
                  points={pointsStr}
                  fill={isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.02)'}
                  stroke={isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
                  strokeWidth="1.5"
                />
              ))}

              {/* Axes passing from center to outer points */}
              {axes.map((pt, i) => (
                <line
                  key={i}
                  x1={CENTER}
                  y1={CENTER}
                  x2={pt.x}
                  y2={pt.y}
                  stroke={isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
                  strokeWidth="1.5"
                />
              ))}
            </g>

            {/* Labels */}
            {labels.map((lbl, i) => {
              const isLblLocked =
                isLocked &&
                lbl.label !== 'Symmetry' &&
                lbl.label !== 'Jawline' &&
                lbl.label !== 'Eyes';

              return (
                <text
                  key={i}
                  x={lbl.x}
                  y={lbl.y + 4} // slight optical adjust for baseline
                  textAnchor={lbl.textAnchor}
                  className={cn(
                    'text-[10px] md:text-[11px] font-bold tracking-wide uppercase select-none transition-colors duration-300',
                    isDarkMode ? 'fill-zinc-400' : 'fill-zinc-500',
                    isLblLocked && 'opacity-40'
                  )}
                >
                  {isLblLocked ? 'Locked Area' : lbl.label}
                </text>
              );
            })}

            {/* Animated Data Polygon */}
            <motion.polygon
              initial={{ points: initialPoints }}
              whileInView={{ points: finalPoints }}
              viewport={{ once: true }}
              transition={{ type: 'spring', bounce: 0.3, duration: 1.5, delay: 0.2 }}
              fill="url(#areaGradient)"
              stroke="#22d3ee"
              strokeWidth="2.5"
              filter="url(#glow)"
              style={{ mixBlendMode: isDarkMode ? 'screen' : 'multiply' }}
            />

            {/* Interactive/Decorative Center Dot */}
            <circle cx={CENTER} cy={CENTER} r="4" fill="#22d3ee" />

            {/* Outer Dots for exact metric points */}
            {features.map((f, i) => {
              const isItemLocked =
                isLocked &&
                f.subject !== 'Symmetry' &&
                f.subject !== 'Jawline' &&
                f.subject !== 'Eyes';
              const renderValue = isItemLocked ? 3 + Math.random() * 2 : f.A;
              const pt = getPoint(renderValue, i, numDataPoints, MAX_RADIUS);

              return (
                <motion.circle
                  key={i}
                  initial={{ cx: CENTER, cy: CENTER, opacity: 0 }}
                  whileInView={{ cx: pt.x, cy: pt.y, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', bounce: 0.3, duration: 1.5, delay: 0.2 }}
                  r="4"
                  fill="#fff"
                  stroke="#22d3ee"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
      </div>
    </motion.div>
  );
});

export default FeatureBreakdownGrid;
