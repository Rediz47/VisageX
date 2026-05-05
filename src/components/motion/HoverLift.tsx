import React from 'react';
import { motion } from 'motion/react';
import { useMotionTier } from '../../context/MotionProvider';
import { easings } from '../../lib/motion';

export interface HoverLiftProps {
  /** Translate-y on hover (px). Default -2. */
  lift?: number;
  /** Scale on hover. Default 1. Leave 1 to skip scale. */
  scale?: number;
  /** Tactile press scale on active. Default 0.98. */
  pressScale?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * HoverLift — pointer-fine, hover-capable micro-interaction.
 *
 * Gated behind `flags.enableHoverMicro` AND CSS media `(hover: hover) and (pointer: fine)`.
 * On touch / low tier / reduced-motion → passthrough.
 */
export function HoverLift({
  lift = -2,
  scale = 1,
  pressScale = 0.98,
  className,
  style,
  children,
  onClick
}: HoverLiftProps) {
  const { preset, prefersReducedMotion, motionDisabled } = useMotionTier();
  const enabled = !motionDisabled && !prefersReducedMotion && preset.flags.enableHoverMicro;

  if (!enabled) {
    return (
      <div className={className} style={style} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`hover-lift-gate ${className ?? ''}`}
      style={style}
      whileHover={{ y: lift, scale }}
      whileTap={{ scale: pressScale }}
      transition={{ duration: preset.durations.fast, ease: easings.easeOutExpo }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
