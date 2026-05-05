import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  beforeImagePosition?: string;
  afterImagePosition?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Raw Scan',
  afterLabel = 'AI Analysis',
  className,
  beforeImagePosition = 'center',
  afterImagePosition = 'center'
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleMove = (clientX: number) => {
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) {
        rafRef.current = null;
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = (x / rect.width) * 100;
      setSliderPosition(percent);
      rafRef.current = null;
    });
  };

  const onMouseDown = () => setIsDragging(true);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative aspect-[3/4] w-full overflow-hidden rounded-2xl cursor-ew-resize select-none group',
        className
      )}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
      onMouseDown={onMouseDown}
    >
      {/* After Image (The base) */}
      <div className="absolute inset-0">
        <img
          src={afterImage}
          alt="After"
          className="w-full h-full object-cover"
          style={{ objectPosition: afterImagePosition }}
          referrerPolicy="no-referrer"
        />
        {/* Analysis Overlay (Mesh/Landmarks) */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGw0MCA0ME00MCAwbC00MCA0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-40 mix-blend-overlay" />

        {/* Landmark Points Simulation */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
              className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`
              }}
            />
          ))}
        </div>
      </div>

      {/* Before Image (The overlay) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
        <img
          src={beforeImage}
          alt="Before"
          className="absolute inset-0 w-full h-full object-cover grayscale"
          style={{
            width: `${100 / (sliderPosition / 100)}%`,
            maxWidth: 'none',
            objectPosition: beforeImagePosition
          }}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute inset-y-0 z-30 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-black/10">
          <div className="flex gap-1">
            <div className="w-0.5 h-4 bg-slate-400 rounded-full" />
            <div className="w-0.5 h-4 bg-slate-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 z-20">
        <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
          {beforeLabel}
        </span>
      </div>
      <div className="absolute top-4 right-4 z-20">
        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
          {afterLabel}
        </span>
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
          Drag to compare
        </p>
      </div>
    </div>
  );
}
