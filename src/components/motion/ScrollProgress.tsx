import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { useMotionTier } from '../../context/MotionProvider';

/**
 * ScrollProgress — fixed gradient bar at the top of the viewport that fills
 * proportionally to the page scroll. Compositor-friendly (transform: scaleX).
 *
 * Skipped entirely on low-tier devices and when the user prefers reduced motion.
 */
export function ScrollProgress() {
  const { preset, prefersReducedMotion, motionDisabled } = useMotionTier();
  const { scrollYProgress } = useScroll();
  // Spring-smoothed for a buttery feel; cheap because it runs on the compositor.
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    mass: 0.4,
    restDelta: 0.001
  });

  const enabled = !motionDisabled && !prefersReducedMotion && preset.flags.enableScrollHooks;

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{
        scaleX,
        transformOrigin: '0% 50%',
        background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #22d3ee 100%)'
      }}
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none shadow-[0_0_10px_rgba(99,102,241,0.6)]"
    />
  );
}
