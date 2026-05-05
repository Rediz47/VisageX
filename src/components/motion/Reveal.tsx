import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, type Variants } from 'motion/react';
import { useMotionTier } from '../../context/MotionProvider';
import type { MotionPriority } from '../../lib/motion';
import { easings } from '../../lib/motion';

type AsTag =
  | 'div'
  | 'section'
  | 'header'
  | 'article'
  | 'li'
  | 'ul'
  | 'span'
  | 'p'
  | 'h1'
  | 'h2'
  | 'h3';

export interface RevealProps {
  priority?: MotionPriority;
  /** Y translate distance in px. Default 16. */
  y?: number;
  /** Optional enter delay in seconds. */
  delay?: number;
  /** Element tag. Default 'div'. */
  as?: AsTag;
  /** Run immediately on mount instead of on scroll into view. */
  onMount?: boolean;
  /** Run once then stop observing. Default true. */
  once?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  children?: React.ReactNode;
}

/**
 * Reveal — scroll (or mount) triggered fade+translate.
 * Honors device tier, budget and concurrency limits.
 */
export function Reveal({
  priority = 'secondary',
  y = 16,
  delay = 0,
  as = 'div',
  onMount = false,
  once = true,
  children,
  style,
  className,
  id
}: RevealProps) {
  const {
    preset,
    prefersReducedMotion,
    motionDisabled,
    requestSlot,
    startAnimation,
    endAnimation
  } = useMotionTier();
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once, amount: 0.2 });
  const [decision, setDecision] = useState<'run' | 'skip' | null>(null);
  const startedRef = useRef(false);

  const shouldSkipAll = motionDisabled || (prefersReducedMotion && priority === 'decorative');
  const trigger = onMount ? true : inView;

  useEffect(() => {
    if (shouldSkipAll) {
      setDecision('skip');
      return;
    }
    if (!trigger || decision !== null) return;
    const d = requestSlot(priority);
    setDecision(d);
    if (d === 'run') {
      startAnimation(priority);
      startedRef.current = true;
    }
  }, [trigger, decision, requestSlot, startAnimation, priority, shouldSkipAll]);

  useEffect(() => {
    return () => {
      if (startedRef.current) {
        endAnimation();
        startedRef.current = false;
      }
    };
  }, [endAnimation]);

  // With reduced-motion, critical animations still run but as fade-only.
  const effectiveY = prefersReducedMotion ? 0 : y;

  const variants: Variants = {
    hidden: { opacity: 0, y: effectiveY },
    visible: { opacity: 1, y: 0 }
  };

  // When skipped or disabled, render static.
  if (decision === 'skip' || shouldSkipAll || preset.durations.med === 0) {
    const Tag = as as React.ElementType;
    return (
      <Tag ref={ref as React.Ref<HTMLElement>} style={style} className={className} id={id}>
        {children}
      </Tag>
    );
  }

  const MotionTag = (motion as unknown as Record<string, React.ElementType>)[as] ?? motion.div;

  return (
    <MotionTag
      ref={ref as React.Ref<HTMLElement>}
      initial="hidden"
      animate={decision === 'run' && trigger ? 'visible' : 'hidden'}
      variants={variants}
      transition={{
        duration: preset.durations.med,
        ease: easings.easeOutExpo,
        delay
      }}
      onAnimationComplete={() => {
        if (startedRef.current) {
          endAnimation();
          startedRef.current = false;
        }
      }}
      style={style}
      className={className}
      id={id}
    >
      {children}
    </MotionTag>
  );
}
