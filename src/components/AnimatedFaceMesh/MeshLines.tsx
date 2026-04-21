import React, { useMemo } from 'react';

/**
 * MediaPipe Face Mesh canonical connection indices.
 */

// Face oval (jawline + forehead contour)
const FACE_OVAL: [number, number][] = [
  [10,338],[338,297],[297,332],[332,284],[284,251],[251,389],[389,356],[356,454],
  [454,323],[323,361],[361,288],[288,397],[397,365],[365,379],[379,378],[378,400],
  [400,377],[377,152],[152,148],[148,176],[176,149],[149,150],[150,136],[136,172],
  [172,58],[58,132],[132,93],[93,234],[234,127],[127,162],[162,21],[21,54],
  [54,103],[103,67],[67,109],[109,10]
];

const LEFT_EYE: [number, number][] = [
  [263,249],[249,390],[390,373],[373,374],[374,380],[380,381],[381,382],[382,362],
  [362,263]
];

const RIGHT_EYE: [number, number][] = [
  [33,7],[7,163],[163,144],[144,145],[145,153],[153,154],[154,155],[155,133],
  [133,33]
];

const LIPS_OUTER: [number, number][] = [
  [61,146],[146,91],[91,181],[181,84],[84,17],[17,314],[314,405],[405,321],[321,375],
  [375,291],[291,409],[409,270],[270,269],[269,267],[267,0],[0,37],[37,39],[39,40],
  [40,185],[185,61]
];

const LEFT_EYEBROW: [number, number][] = [
  [276,283],[283,282],[282,295],[295,285]
];

const RIGHT_EYEBROW: [number, number][] = [
  [46,53],[53,52],[52,65],[65,55]
];

// Nose bridge
const NOSE_BRIDGE: [number, number][] = [
  [168,6],[6,197],[197,195],[195,5],[5,4]
];

interface MeshLinesProps {
  points: { x: number; y: number }[];
  width: number;
  height: number;
}

const MeshLines = React.memo(function MeshLines({ points, width, height }: MeshLinesProps) {
  const lines = useMemo(() => {
    if (points.length < 468) return null;

    const mapPairs = (pairs: [number, number][]) =>
      pairs
        .map(([a, b]) => {
          const pa = points[a];
          const pb = points[b];
          if (!pa || !pb) return null;
          return {
            x1: pa.x * width,
            y1: pa.y * height,
            x2: pb.x * width,
            y2: pb.y * height,
          };
        })
        .filter(Boolean) as { x1: number; y1: number; x2: number; y2: number }[];

    return {
      oval: mapPairs(FACE_OVAL),
      leftEye: mapPairs(LEFT_EYE),
      rightEye: mapPairs(RIGHT_EYE),
      lips: mapPairs(LIPS_OUTER),
      leftBrow: mapPairs(LEFT_EYEBROW),
      rightBrow: mapPairs(RIGHT_EYEBROW),
      nose: mapPairs(NOSE_BRIDGE),
    };
  }, [points, width, height]);

  if (!lines) return null;

  const renderLines = (
    data: { x1: number; y1: number; x2: number; y2: number }[],
    stroke: string,
    strokeWidth: number,
    delay: string
  ) => (
    <g>
      {data.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`mesh-line ${delay}`}
        />
      ))}
    </g>
  );

  return (
    <g>
      {renderLines(lines.oval, 'rgba(34,211,238,0.35)', 1.5, 'mesh-delay-1')}
      {renderLines(lines.leftEye, 'rgba(6,182,212,0.5)', 1.2, 'mesh-delay-2')}
      {renderLines(lines.rightEye, 'rgba(6,182,212,0.5)', 1.2, 'mesh-delay-2')}
      {renderLines(lines.leftBrow, 'rgba(129,140,248,0.4)', 1.0, 'mesh-delay-3')}
      {renderLines(lines.rightBrow, 'rgba(129,140,248,0.4)', 1.0, 'mesh-delay-3')}
      {renderLines(lines.nose, 'rgba(99,102,241,0.35)', 1.0, 'mesh-delay-3')}
      {renderLines(lines.lips, 'rgba(244,63,94,0.4)', 1.2, 'mesh-delay-4')}
    </g>
  );
});

export default MeshLines;
