import React, { useMemo } from 'react';

// Key landmark indices that get rendered as dots
const KEY_LANDMARKS = [
  // Eye corners
  33, 133, 263, 362,
  // Nose tip & bridge
  1, 4, 6,
  // Chin
  152,
  // Mouth corners
  61, 291,
  // Jaw angles
  132, 361,
  // Forehead center
  10,
  // Cheekbones
  116, 345,
  // Eyebrow peaks
  55, 285
];

interface MeshDotsProps {
  points: { x: number; y: number }[];
  width: number;
  height: number;
}

const MeshDots = React.memo(function MeshDots({ points, width, height }: MeshDotsProps) {
  const dots = useMemo(() => {
    if (points.length < 468) return [];
    return KEY_LANDMARKS.map((idx) => {
      const p = points[idx];
      if (!p) return null;
      return {
        cx: p.x * width,
        cy: p.y * height,
        idx
      };
    }).filter(Boolean) as { cx: number; cy: number; idx: number }[];
  }, [points, width, height]);

  return (
    <g>
      {dots.map((dot) => (
        <circle
          key={dot.idx}
          cx={dot.cx}
          cy={dot.cy}
          r={3}
          fill="rgba(34,211,238,0.8)"
          className="mesh-glow-dot"
        />
      ))}
    </g>
  );
});

export default MeshDots;
