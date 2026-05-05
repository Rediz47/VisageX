/**
 * LerpLineCanvas — GPU-accelerated, lerp-smoothed canvas renderer
 * that draws animated measurement lines on the face photo.
 */
import { useMemo, useEffect, useRef } from 'react';
import type { RatioVisualization } from './types';

/* ── Color helper ── */
const getLineRGB = (color: string, score: number): { r: number; g: number; b: number } => {
  const alpha = getLineAlpha(color);
  if (alpha < 0.7) return { r: 150, g: 150, b: 150 };
  return score >= 8
    ? { r: 52, g: 211, b: 153 }
    : score >= 6
      ? { r: 251, g: 191, b: 36 }
      : { r: 239, g: 68, b: 68 };
};

const getLineAlpha = (color: string) => {
  const m = color.match(/,\s*([\d.]+)\s*\)$/);
  return m ? parseFloat(m[1]) : 0.9;
};

type TargetLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  alpha: number;
  fromIdx: number;
  toIdx: number;
};

export interface LerpLineCanvasProps {
  display: RatioVisualization;
  points: { x: number; y: number }[];
  viewW: number;
  viewH: number;
  isLocked?: boolean;
}

export function LerpLineCanvas({ display, points, viewW, viewH, isLocked = false }: LerpLineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      cx1: number;
      cy1: number;
      cx2: number;
      cy2: number;
    }[];
    progress: number;
    labelOpacity: number;
    prevKey: string;
    dashOffset: number;
  }>({ lines: [], progress: 0, labelOpacity: 0, prevKey: '', dashOffset: 0 });

  const targetLines = useMemo(() => {
    const rawLines = display.lines
      .map((ln) => {
        const a = points[ln.from],
          b = points[ln.to];
        if (!a || !b) return null;
        return {
          x1: a.x * viewW,
          y1: a.y * viewH,
          x2: b.x * viewW,
          y2: b.y * viewH,
          color: ln.color,
          alpha: getLineAlpha(ln.color),
          fromIdx: ln.from,
          toIdx: ln.to
        };
      })
      .filter(Boolean) as TargetLine[];

    const primaryLines = rawLines.filter((line) => line.alpha >= 0.7);

    return rawLines.map((line) => {
      if (line.alpha >= 0.7) return line;

      const dx = line.x2 - line.x1;
      const dy = line.y2 - line.y1;
      const lenSq = dx * dx + dy * dy;
      const len = Math.sqrt(lenSq);
      if (lenSq === 0) return line;

      let trimPoint: { x: number; y: number; t: number } | null = null;

      for (const primary of primaryLines) {
        const candidates = [
          { x: primary.x1, y: primary.y1 },
          { x: primary.x2, y: primary.y2 }
        ];

        for (const point of candidates) {
          const px = point.x - line.x1;
          const py = point.y - line.y1;
          const t = (px * dx + py * dy) / lenSq;
          if (t <= 0.04 || t >= 0.96) continue;

          const projectedX = line.x1 + dx * t;
          const projectedY = line.y1 + dy * t;
          const distance = Math.hypot(point.x - projectedX, point.y - projectedY);
          if (distance > 10) continue;

          if (!trimPoint || t < trimPoint.t) {
            trimPoint = { x: point.x, y: point.y, t };
          }
        }
      }

      if (!trimPoint) return line;

      const gapT = Math.min(0.04, 10 / len);
      const primaryContinuesFromStart = primaryLines.some(
        (primary) =>
          Math.hypot(primary.x1 - trimPoint.x, primary.y1 - trimPoint.y) < 1 &&
          Math.hypot(primary.x2 - line.x2, primary.y2 - line.y2) < 1
      );

      const safeT = primaryContinuesFromStart
        ? Math.min(0.95, trimPoint.t + gapT)
        : Math.max(0.05, trimPoint.t - gapT);

      return {
        ...line,
        ...(primaryContinuesFromStart
          ? {
              x1: line.x1 + dx * safeT,
              y1: line.y1 + dy * safeT
            }
          : {
              x2: line.x1 + dx * safeT,
              y2: line.y1 + dy * safeT
            })
      };
    });
  }, [display, points, viewW, viewH]);

  const lengths = useMemo(
    () => targetLines.map((l) => Math.hypot(l.x2 - l.x1, l.y2 - l.y1)),
    [targetLines]
  );
  const total = useMemo(() => lengths.reduce((a, b) => a + b, 0), [lengths]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const key = display.shortName;
    const st = stateRef.current;

    // Reset on ratio change
    if (st.prevKey !== key) {
      st.prevKey = key;
      st.progress = 0;
      st.labelOpacity = 0;
      st.lines = targetLines.map((t) => ({
        ...t,
        cx1: t.x1,
        cy1: t.y1,
        cx2: t.x1,
        cy2: t.y1
      }));
    }

    // Ensure correct lines count
    while (st.lines.length < targetLines.length) {
      const t = targetLines[st.lines.length];
      st.lines.push({ ...t, cx1: t.x1, cy1: t.y1, cx2: t.x1, cy2: t.y1 });
    }
    st.lines.length = targetLines.length;

    let raf: number;
    const LERP = 0.12; // smoothing factor — lower = smoother/heavier
    const TICK = viewW * 0.018;
    function draw() {
      if (!ctx || !canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const scaleX = w / viewW;
      const scaleY = h / viewH;
      const st = stateRef.current;

      // Advance progress (0→1 over ~1.5s at 60fps)
      st.progress = Math.min(1, st.progress + 0.025);

      // Label fades in after lines are ~80% drawn
      if (st.progress > 0.8) {
        st.labelOpacity = Math.min(1, st.labelOpacity + 0.04);
      }

      const drawProg = st.progress;

      // ── Phase 1: Lerp all endpoints ──
      targetLines.forEach((target, i) => {
        const ln = st.lines[i];
        if (!ln) return;
        const tX2 = target.x1 + (target.x2 - target.x1) * drawProg;
        const tY2 = target.y1 + (target.y2 - target.y1) * drawProg;
        ln.cx1 += (target.x1 - ln.cx1) * LERP;
        ln.cy1 += (target.y1 - ln.cy1) * LERP;
        ln.cx2 += (tX2 - ln.cx2) * LERP;
        ln.cy2 += (tY2 - ln.cy2) * LERP;
      });

      // ── Phase 2: Snap shared endpoints so connected segments are perfectly straight ──
      for (let ii = 0; ii < targetLines.length; ii++) {
        for (let jj = ii + 1; jj < targetLines.length; jj++) {
          const la = st.lines[ii],
            lb = st.lines[jj];
          if (!la || !lb) continue;
          if (targetLines[ii].toIdx === targetLines[jj].fromIdx) {
            const mx = (la.cx2 + lb.cx1) / 2;
            const my = (la.cy2 + lb.cy1) / 2;
            la.cx2 = lb.cx1 = mx;
            la.cy2 = lb.cy1 = my;
          }
        }
      }

      // ── Phase 3: Draw secondaries first so primaries always render on top ──
      const drawOrder = [...targetLines.keys()].sort((a, b) => {
        const aAlpha = parseFloat(
          (targetLines[a]?.color ?? '').match(/,\s*([\d.]+)\s*\)$/)?.[1] ?? '0.9'
        );
        const bAlpha = parseFloat(
          (targetLines[b]?.color ?? '').match(/,\s*([\d.]+)\s*\)$/)?.[1] ?? '0.9'
        );
        return Number(aAlpha >= 0.7) - Number(bAlpha >= 0.7);
      });
      drawOrder.forEach((i) => {
        const target = targetLines[i];
        const ln = st.lines[i];
        if (!ln || !target) return;
        const rgb = getLineRGB(target.color ?? 'rgba(150,150,150,0.5)', display.score);

        const sx1 = ln.cx1 * scaleX,
          sy1 = ln.cy1 * scaleY;
        const sx2 = ln.cx2 * scaleX,
          sy2 = ln.cy2 * scaleY;

        const angle = Math.atan2(sy2 - sy1, sx2 - sx1);
        const perp = angle + Math.PI / 2;
        const tickS = TICK * scaleX;

        // ─── Premium gradient line ───
        const gradient = ctx.createLinearGradient(sx1, sy1, sx2, sy2);
        gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.85)`);
        gradient.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},1)`);
        gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.85)`);

        ctx.save();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 5 * scaleX;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
        ctx.restore();

        // ─── Premium bracket caps at start ───
        const capGradient = ctx.createLinearGradient(
          sx1 + Math.cos(perp) * tickS * 0.8,
          sy1 + Math.sin(perp) * tickS * 0.8,
          sx1 - Math.cos(perp) * tickS * 0.8,
          sy1 - Math.sin(perp) * tickS * 0.8
        );
        capGradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${0.9 * drawProg})`);
        capGradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},${1 * drawProg})`);

        ctx.save();
        ctx.strokeStyle = capGradient;
        ctx.lineWidth = 5 * scaleX;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx1 + Math.cos(perp) * tickS * 0.8, sy1 + Math.sin(perp) * tickS * 0.8);
        ctx.lineTo(sx1 - Math.cos(perp) * tickS * 0.8, sy1 - Math.sin(perp) * tickS * 0.8);
        ctx.stroke();
        ctx.restore();

        // ─── Premium bracket caps at end (only when progress > 0.5) ───
        if (drawProg > 0.5) {
          const capAlpha = Math.min(1, (drawProg - 0.5) * 4);
          const endCapGradient = ctx.createLinearGradient(
            sx2 + Math.cos(perp) * tickS * 0.8,
            sy2 + Math.sin(perp) * tickS * 0.8,
            sx2 - Math.cos(perp) * tickS * 0.8,
            sy2 - Math.sin(perp) * tickS * 0.8
          );
          endCapGradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${0.9 * capAlpha})`);
          endCapGradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},${1 * capAlpha})`);

          ctx.save();
          ctx.strokeStyle = endCapGradient;
          ctx.lineWidth = 5 * scaleX;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(sx2 + Math.cos(perp) * tickS * 0.8, sy2 + Math.sin(perp) * tickS * 0.8);
          ctx.lineTo(sx2 - Math.cos(perp) * tickS * 0.8, sy2 - Math.sin(perp) * tickS * 0.8);
          ctx.stroke();
          ctx.restore();
        }

        // ─── Value / % label with pill background ───
        if (st.labelOpacity > 0.01) {
          const midSx = (sx1 + sx2) / 2;
          const midSy = (sy1 + sy2) / 2;
          const labelOff = 18 * scaleX;
          const lx = midSx + Math.cos(perp) * labelOff;
          const ly = midSy + Math.sin(perp) * labelOff;

          const pct = total > 0 ? ((lengths[i] / total) * 100).toFixed(1) : '100';
          const labelText = isLocked
            ? '???'
            : targetLines.length > 1
              ? `${pct}%`
              : `${typeof display.value === 'number' ? display.value.toFixed(2) : display.value}${display.unit ?? ''}`;

          const fontSize = Math.round(14 * scaleX);
          ctx.save();
          ctx.globalAlpha = st.labelOpacity;
          ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
          const textW = ctx.measureText(labelText).width;
          const padX = 8 * scaleX;
          const padY = 4 * scaleX;
          const pillX = lx - textW / 2 - padX;
          const pillY = ly - fontSize / 2 - padY;
          const pillW = textW + padX * 2;
          const pillH = fontSize + padY * 2;
          ctx.fillStyle = 'rgba(0,0,0,0.72)';
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
          ctx.fill();
          ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},1)`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, lx, ly);
          ctx.restore();
        }
      });

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [targetLines, display, viewW, viewH, lengths, total, isLocked]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ imageRendering: 'auto' }}
    />
  );
}
