import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useMotionTier } from '../../context/MotionProvider';

export interface ScrollScaleProps {
  /**
   * Effects to apply, scroll-linked. Each maps the element's progress through
   * the viewport (0 = below, 1 = above) to the listed property range.
   */
  scale?: [number, number];
  rotateX?: [number, number];
  rotateY?: [number, number];
  y?: [number, number];
  opacity?: [number, number];
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * ScrollScale — a scroll-linked container that smoothly transforms its child
 * as the element passes through the viewport. Driven by `useScroll` so motion
 * is tied 1:1 to the scroll position rather than time.
 *
 *  - High-tier: full effect.
 *  - Mid: amplitudes halved (scale closer to 1, rotateX divided).
 *  - Low / reduced-motion: passthrough (no transform).
 */
export function ScrollScale({
  scale,
  rotateX,
  rotateY,
  y,
  opacity,
  className,
  style,
  children
}: ScrollScaleProps) {
  const { preset, prefersReducedMotion, motionDisabled } = useMotionTier();
  const ref = useRef<HTMLDivElement | null>(null);
  const enabled =
    !motionDisabled &&
    !prefersReducedMotion &&
    preset.tier !== 'low' &&
    preset.flags.enableScrollHooks;

  const tier = preset.tier;
  const damp = (range: [number, number] | undefined, identity: number): [number, number] => {
    if (!range) return [identity, identity];
    if (tier === 'high') return range;
    // mid → blend halfway toward identity
    return [identity + (range[0] - identity) * 0.5, identity + (range[1] - identity) * 0.5];
  };

  const sRange = damp(scale, 1);
  const rxRange = damp(rotateX, 0);
  const ryRange = damp(rotateY, 0);
  const yRange = damp(y, 0);
  const oRange = damp(opacity, 1);

  // useScroll already produces 60Hz-smooth progress; the previous useSpring
  // smoothing layer was just extra work for negligible visual benefit.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const mScale = useTransform(scrollYProgress, [0, 0.5, 1], [sRange[0], 1, sRange[1]]);
  const mRotX = useTransform(scrollYProgress, [0, 0.5, 1], [rxRange[0], 0, rxRange[1]]);
  const mRotY = useTransform(scrollYProgress, [0, 0.5, 1], [ryRange[0], 0, ryRange[1]]);
  const mY = useTransform(scrollYProgress, [0, 0.5, 1], [yRange[0], 0, yRange[1]]);
  const mOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [oRange[0], 1, oRange[1]]);

  if (!enabled) {
    return (
      <div ref={ref} className={className} style={{ position: 'relative', ...style }}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        position: 'relative',
        ...style,
        scale: mScale,
        rotateX: mRotX,
        rotateY: mRotY,
        y: mY,
        opacity: mOpacity,
        transformPerspective: 1200,
        willChange: 'transform, opacity'
      }}
    >
      {children}
    </motion.div>
  );
}
