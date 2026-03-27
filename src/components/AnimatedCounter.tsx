import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

export function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current * 10) / 10);

  useEffect(() => {
    const timer = setTimeout(() => {
      spring.set(value);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [value, delay, spring]);

  return <motion.span>{display}</motion.span>;
}
