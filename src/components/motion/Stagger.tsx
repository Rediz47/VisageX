import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { useMotionTier } from '../../context/MotionProvider';
import type { MotionPriority } from '../../lib/motion';
import { easings } from '../../lib/motion';

export interface StaggerProps {
  priority?: MotionPriority;
  /** Override stagger (seconds). Defaults to preset.stagger. */
  stagger?: number;
  /** Initial delay before first child (seconds). */
  delayChildren?: number;
  /** Y translate per child (px). */
  y?: number;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  children?: React.ReactNode;
}

/**
 * Stagger — animates each direct child with a staggered fade+translate.
 * Wrap children in <StaggerItem /> to benefit (or any motion.div with
 * variants named 'hidden'/'visible'). On skip / low tier, renders static.
 */
export function Stagger({
  priority = 'decorative',
  stagger,
  delayChildren = 0,
  y = 12,
  className,
  style,
  id,
  children
}: StaggerProps) {
  const {
    preset,
    prefersReducedMotion,
    motionDisabled,
    requestSlot,
    startAnimation,
    endAnimation
  } = useMotionTier();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const [decision, setDecision] = useState<'run' | 'skip' | null>(null);
  const startedRef = useRef(false);

  const shouldSkipAll =
    motionDisabled ||
    preset.durations.med === 0 ||
    (prefersReducedMotion && priority !== 'critical');

  useEffect(() => {
    if (shouldSkipAll) {
      setDecision('skip');
      return;
    }
    if (!inView || decision !== null) return;
    const d = requestSlot(priority);
    setDecision(d);
    if (d === 'run') {
      startAnimation(priority);
      startedRef.current = true;
    }
  }, [inView, decision, requestSlot, startAnimation, priority, shouldSkipAll]);

  useEffect(() => {
    return () => {
      if (startedRef.current) {
        endAnimation();
        startedRef.current = false;
      }
    };
  }, [endAnimation]);

  if (decision !== 'run' || shouldSkipAll) {
    return (
      <div ref={ref} className={className} style={style} id={id}>
        {children}
      </div>
    );
  }

  const staggerChildren = stagger ?? preset.stagger;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren,
            delayChildren
          }
        }
      }}
      className={className}
      style={style}
      id={id}
      onAnimationComplete={() => {
        if (startedRef.current) {
          endAnimation();
          startedRef.current = false;
        }
      }}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: prefersReducedMotion ? 0 : y },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: preset.durations.med,
                ease: easings.easeOutExpo
              }
            }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
