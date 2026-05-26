import React from 'react';
import { motion } from 'motion/react';
import {
  useDashboardContext,
  stageReached,
  type RevealStage
} from '../../context/DashboardContext';

/**
 * RevealGate — non-invasive wrapper that participates in the post-unlock
 * dissolve sequence.
 *
 * While the dashboard's reveal-stage machine is mid-sequence and has *not*
 * yet reached this gate's `at` stage, the wrapper applies a soft blur +
 * dim over its children — so the panel reads as still-sealed even though
 * `isLocked` is already false. Once the stage reaches `at`, the wrapper
 * dissolves the blur over 600ms.
 *
 * This is the mechanism the v5 plan calls for in section B2 ("How children
 * consume the stage machine") — the components themselves keep their
 * `isLocked`-driven rendering untouched, and we just overlay a final
 * dissolve on top.
 *
 *   <RevealGate at="PRIMARY">
 *     <BreakdownCards ... />
 *   </RevealGate>
 *
 * When the surface is unlocked normally (no reveal sequence in progress,
 * `revealStage === 'IDLE'`), the wrapper is a no-op pass-through — no
 * filter applied, no extra layout, no extra DOM cost beyond a wrapping div.
 */
export function RevealGate({
  at,
  children,
  className
}: {
  at: RevealStage;
  children: React.ReactNode;
  className?: string;
}) {
  const { revealStage } = useDashboardContext();
  const sequenceActive = revealStage !== 'IDLE';
  const dissolved = !sequenceActive || stageReached(revealStage, at);

  return (
    <motion.div
      className={className}
      initial={false}
      animate={{
        filter: dissolved ? 'blur(0px)' : 'blur(8px)',
        opacity: dissolved ? 1 : 0.55
      }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      // Don't intercept interaction while sealed — the user shouldn't be
      // able to click through to half-revealed UI mid-sequence.
      style={{ pointerEvents: dissolved ? 'auto' : 'none' }}
    >
      {children}
    </motion.div>
  );
}
