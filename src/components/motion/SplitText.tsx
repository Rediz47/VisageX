import React from 'react';
import { motion, type Variants } from 'motion/react';
import { useMotionTier } from '../../context/MotionProvider';
import { easings } from '../../lib/motion';

export interface SplitTextProps {
  text: string;
  className?: string;
  /** Delay before the first word animates in (seconds). */
  delay?: number;
  /** Stagger between words (seconds). Defaults to preset.stagger * 1.5. */
  stagger?: number;
  /** Y translate per word (px). Default 24. */
  y?: number;
  /** HTML tag. Default `span` so it can sit inside an `<h1>`. */
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p';
}

/**
 * SplitText — word-level fade+translate reveal.
 *
 *  - Words wrapped in inline-block spans so transforms don't break line layout.
 *  - Whitespace preserved as plain text so wrapping still works.
 *  - Skipped (rendered as static text) on reduced-motion / off / low-tier.
 */
export function SplitText({
  text,
  className,
  delay = 0,
  stagger,
  y = 24,
  as = 'span'
}: SplitTextProps) {
  const { preset, prefersReducedMotion, motionDisabled } = useMotionTier();
  const Tag = as as React.ElementType;

  const skip = motionDisabled || prefersReducedMotion || preset.tier === 'low';
  if (skip) {
    return <Tag className={className}>{text}</Tag>;
  }

  const words = text.split(/(\s+)/); // keep whitespace tokens
  const childStagger = stagger ?? Math.max(preset.stagger * 1.5, 0.05);

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: childStagger,
        delayChildren: delay
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y, filter: 'blur(6px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: preset.durations.slow, ease: easings.easeOutExpo }
    }
  };

  return (
    <Tag className={className}>
      <motion.span
        initial="hidden"
        animate="visible"
        variants={container}
        style={{ display: 'inline' }}
      >
        {words.map((w, i) =>
          /\s+/.test(w) ? (
            <React.Fragment key={i}>{w}</React.Fragment>
          ) : (
            <motion.span
              key={i}
              variants={item}
              style={{ display: 'inline-block', willChange: 'transform, opacity' }}
            >
              {w}
            </motion.span>
          )
        )}
      </motion.span>
    </Tag>
  );
}
