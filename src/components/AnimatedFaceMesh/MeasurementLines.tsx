import React, { useMemo } from 'react';

interface Point {
  x: number;
  y: number;
}

interface MeasurementLinesProps {
  points: Point[];
  width: number;
  height: number;
  metrics?: Record<string, string | number>;
}

const MeasurementLines = React.memo(function MeasurementLines({
  points,
  width,
  height,
  metrics,
}: MeasurementLinesProps) {
  const measurements = useMemo(() => {
    if (points.length < 468) return null;

    const getPt = (idx: number) => ({
      x: points[idx].x * width,
      y: points[idx].y * height,
    });

    const hairline = getPt(10);
    const glabella = getPt(9);
    const noseBase = getPt(2);
    const chin = getPt(152);
    const leftCheek = getPt(132);
    const rightCheek = getPt(361);

    // Facial thirds
    const thirds = [
      { pt: hairline, label: 'HAIRLINE', y: hairline.y },
      { pt: glabella, label: 'BROW LINE', y: glabella.y },
      { pt: noseBase, label: 'NOSE BASE', y: noseBase.y },
      { pt: chin, label: 'CHIN', y: chin.y },
    ];

    // Symmetry axis
    const centerX = (hairline.x + chin.x) / 2;

    return { thirds, centerX, hairline, chin, leftCheek, rightCheek };
  }, [points, width, height]);

  if (!measurements) return null;

  const { thirds, centerX, hairline, chin, leftCheek, rightCheek } = measurements;
  const lineExtend = width * 0.06;

  return (
    <g>
      {/* Vertical symmetry axis */}
      <line
        x1={centerX} y1={hairline.y - 15}
        x2={centerX} y2={chin.y + 15}
        stroke="rgba(34,211,238,0.4)"
        strokeWidth={1}
        strokeDasharray="6,5"
        className="measure-line"
        style={{ animationDelay: '1.5s' }}
      />
      <text
        x={centerX + 6} y={hairline.y - 18}
        fill="rgba(34,211,238,0.6)"
        fontSize={width * 0.012}
        fontFamily="monospace"
        fontWeight="bold"
        style={{ opacity: 0, animation: 'fadeSlideUp 0.5s ease-out forwards', animationDelay: '2s' }}
      >
        SYMMETRY
      </text>

      {/* Facial thirds */}
      {thirds.map((t, i) => (
        <g key={t.label}>
          <line
            x1={leftCheek.x - lineExtend} y1={t.y}
            x2={rightCheek.x + lineExtend} y2={t.y}
            stroke="rgba(236,72,153,0.35)"
            strokeWidth={0.8}
            strokeDasharray="3,3"
            className="measure-line"
            style={{ animationDelay: `${2 + i * 0.15}s` }}
          />
          <text
            x={rightCheek.x + lineExtend + 4} y={t.y + 3}
            fill="rgba(236,72,153,0.5)"
            fontSize={width * 0.01}
            fontFamily="monospace"
            fontWeight="bold"
            style={{ opacity: 0, animation: 'fadeSlideUp 0.5s ease-out forwards', animationDelay: `${2.2 + i * 0.15}s` }}
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* fWHR width line */}
      {metrics?.fWHR && (
        <g>
          <line
            x1={leftCheek.x} y1={leftCheek.y}
            x2={rightCheek.x} y2={rightCheek.y}
            stroke="rgba(52,211,153,0.35)"
            strokeWidth={1}
            strokeDasharray="5,4"
            className="measure-line"
            style={{ animationDelay: '3s' }}
          />
          <text
            x={(leftCheek.x + rightCheek.x) / 2} y={leftCheek.y - 8}
            fill="rgba(52,211,153,0.7)"
            fontSize={width * 0.012}
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
            style={{ opacity: 0, animation: 'fadeSlideUp 0.5s ease-out forwards', animationDelay: '3.2s' }}
          >
            fWHR {typeof metrics.fWHR === 'number' ? metrics.fWHR.toFixed(2) : metrics.fWHR}
          </text>
        </g>
      )}
    </g>
  );
});

export default MeasurementLines;
