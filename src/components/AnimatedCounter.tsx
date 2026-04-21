import React, { useEffect } from 'react';
import { useSpring, useTransform, motion } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  maxDecimals?: number;
}

export const AnimatedCounter = React.memo(function AnimatedCounter({ 
  value, 
  duration = 1.5, 
  delay = 0, 
  maxDecimals = 1 
}: AnimatedCounterProps) {
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });
  
  const displayValue = useTransform(springValue, (latest) => latest.toFixed(maxDecimals));

  useEffect(() => {
    const timeout = setTimeout(() => {
      springValue.set(value);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [value, delay, springValue]);

  return <motion.span>{displayValue}</motion.span>;
});
