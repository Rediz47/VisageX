import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { cn } from '../lib/utils';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
  label?: string;
  sublabel?: string;
  isDarkMode: boolean;
  delay?: number;
}

/**
 * ScoreGauge — Premium animated arc gauge
 * 
 * Features:
 * - Animated arc fill with gradient stroke
 * - Glowing tip at the arc end
 * - Animated counter in center
 * - Percentile display
 */
export function ScoreGauge({
  score,
  maxScore = 10,
  size = 240,
  label = 'Facial Harmony Score',
  sublabel,
  isDarkMode,
  delay = 0,
}: ScoreGaugeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Intersection observer for triggering animation
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Gauge geometry
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcAngle = 270; // 270 degrees of arc (not full circle)
  const arcLength = (arcAngle / 360) * circumference;
  const normalizedScore = Math.min(score / maxScore, 1);
  const filledLength = arcLength * normalizedScore;
  const dashOffset = arcLength - filledLength;
  const startAngle = 135; // Start from bottom-left

  // Color based on score
  const getGaugeColor = (s: number) => {
    if (s >= 8) return { start: '#22d3ee', end: '#818cf8', glow: '#22d3ee' }; // cyan → indigo
    if (s >= 6) return { start: '#fbbf24', end: '#f59e0b', glow: '#fbbf24' }; // amber
    return { start: '#f43f5e', end: '#e11d48', glow: '#f43f5e' }; // rose
  };
  const colors = getGaugeColor(score);

  // Animated counter
  const springValue = useSpring(0, { duration: 2000, bounce: 0 });
  const displayValue = useTransform(springValue, (v) => v.toFixed(1));

  useEffect(() => {
    if (isVisible) {
      const timeout = setTimeout(() => {
        springValue.set(score);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, score, delay, springValue]);

  const gradientId = `gauge-gradient-${Math.random().toString(36).slice(2, 9)}`;
  const glowId = `gauge-glow-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-[135deg]"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Tick marks */}
          {Array.from({ length: 11 }).map((_, i) => {
            const angle = startAngle + (arcAngle / 10) * i;
            const rad = (angle * Math.PI) / 180;
            const innerR = radius - strokeWidth - 4;
            const outerR = radius - strokeWidth - (i % 5 === 0 ? 12 : 8);
            return (
              <line
                key={i}
                x1={size / 2 + Math.cos(rad) * innerR}
                y1={size / 2 + Math.sin(rad) * innerR}
                x2={size / 2 + Math.cos(rad) * outerR}
                y2={size / 2 + Math.sin(rad) * outerR}
                stroke={isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}
                strokeWidth={i % 5 === 0 ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}

          {/* Animated filled arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
            style={{
              '--gauge-circumference': `${arcLength}`,
              '--gauge-offset': `${dashOffset}`,
              '--gauge-color': colors.glow,
              strokeDashoffset: isVisible ? undefined : arcLength,
            } as React.CSSProperties}
            className={isVisible ? 'gauge-arc' : ''}
          />

          {/* Glow tip dot */}
          {isVisible && (
            <circle
              cx={size / 2 + Math.cos(((arcAngle * normalizedScore) * Math.PI) / 180) * radius}
              cy={size / 2 + Math.sin(((arcAngle * normalizedScore) * Math.PI) / 180) * radius}
              r={5}
              fill={colors.start}
              className="gauge-glow"
              style={{ '--gauge-color': colors.glow } as React.CSSProperties}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-40',
              isDarkMode ? 'text-white' : 'text-zinc-900'
            )}
          >
            {label}
          </span>
          <motion.span
            className={cn(
              'text-6xl md:text-7xl font-display italic leading-none tracking-tighter',
              isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
            )}
          >
            {displayValue}
          </motion.span>
          <span
            className={cn(
              'text-xs font-bold opacity-15 mt-1',
              isDarkMode ? 'text-white' : 'text-zinc-900'
            )}
          >
            / {maxScore}
          </span>

          {sublabel && (
            <div
              className={cn(
                'mt-4 px-4 py-1.5 rounded-full border text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5',
                isDarkMode
                  ? 'bg-indigo-500/15 border-indigo-500/25 text-indigo-400'
                  : 'bg-indigo-50 border-indigo-100 text-indigo-600'
              )}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
