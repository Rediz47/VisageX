/**
 * LerpLineCanvas — GPU-accelerated, lerp-smoothed canvas renderer
 * that draws animated measurement lines on the face photo.
 */
import { useMemo, useEffect, useRef } from 'react';
import type { RatioVisualization } from './types';

/* ── Color helper ── */
const getLineRGB = (color: string, score: number): { r: number; g: number; b: number } => {
  const m = color.match(/,\s*([\d.]+)\s*\)$/);
  const alpha = m ? parseFloat(m[1]) : 0.9;
  if (alpha < 0.7) return { r: 150, g: 150, b: 150 };
  return score >= 8 ? { r: 52, g: 211, b: 153 }
    : score >= 6 ? { r: 251, g: 191, b: 36 }
      : { r: 239, g: 68, b: 68 };
};

export interface LerpLineCanvasProps {
  display: RatioVisualization;
  points: { x: number; y: number }[];
  viewW: number;
  viewH: number;
}

export function LerpLineCanvas({ display, points, viewW, viewH }: LerpLineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    lines: { x1: number; y1: number; x2: number; y2: number; cx1: number; cy1: number; cx2: number; cy2: number }[];
    progress: number;
    labelOpacity: number;
    prevKey: string;
    dashOffset: number;
  }>({ lines: [], progress: 0, labelOpacity: 0, prevKey: '', dashOffset: 0 });

  // Resolve target line positions
  const targetLines = useMemo(() => {
    return display.lines.map((ln) => {
      const a = points[ln.from], b = points[ln.to];
      if (!a || !b) return null;
      return { x1: a.x * viewW, y1: a.y * viewH, x2: b.x * viewW, y2: b.y * viewH, color: ln.color, fromIdx: ln.from, toIdx: ln.to };
    }).filter(Boolean) as { x1: number; y1: number; x2: number; y2: number; color: string; fromIdx: number; toIdx: number }[];
  }, [display, points, viewW, viewH]);

  const lengths = useMemo(() => targetLines.map(l => Math.hypot(l.x2 - l.x1, l.y2 - l.y1)), [targetLines]);
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
      st.lines = targetLines.map(t => ({
        ...t,
        cx1: t.x1, cy1: t.y1, cx2: t.y1, cy2: t.y1, // start collapsed at point 1
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
          const la = st.lines[ii], lb = st.lines[jj];
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
        const aAlpha = parseFloat((targetLines[a]?.color ?? '').match(/,\s*([\d.]+)\s*\)$/)?.[1] ?? '0.9');
        const bAlpha = parseFloat((targetLines[b]?.color ?? '').match(/,\s*([\d.]+)\s*\)$/)?.[1] ?? '0.9');
        return Number(aAlpha >= 0.7) - Number(bAlpha >= 0.7);
      });
      drawOrder.forEach((i) => {
        const target = targetLines[i];
        const ln = st.lines[i];
        if (!ln || !target) return;
        const rgb = getLineRGB(target.color ?? 'rgba(150,150,150,0.5)', display.score);

        const sx1 = ln.cx1 * scaleX, sy1 = ln.cy1 * scaleY;
        const sx2 = ln.cx2 * scaleX, sy2 = ln.cy2 * scaleY;

        const angle = Math.atan2(sy2 - sy1, sx2 - sx1);
        const perp = angle + Math.PI / 2;
        const tickS = TICK * scaleX;

        // ─── Layer 1: Outer aura ───
        ctx.save();
        ctx.shadowBlur = 24 * scaleX;
        ctx.shadowColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`;
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`;
        ctx.lineWidth = 20 * scaleX;
        ctx.lineCap = 'round';
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
        ctx.restore();

        // ─── Layer 2: Inner glow ───
        ctx.save();
        ctx.shadowBlur = 12 * scaleX;
        ctx.shadowColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.65)`;
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`;
        ctx.lineWidth = 8 * scaleX;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
        ctx.restore();

        // ─── Layer 3: Core line ───
        ctx.save();
        ctx.shadowBlur = 6 * scaleX;
        ctx.shadowColor = `rgba(${rgb.r},${rgb.g},${rgb.b},1)`;
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},1)`;
        ctx.lineWidth = 4 * scaleX;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
        ctx.restore();

        // ─── Layer 4: White center highlight ───
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = 'rgba(255,255,255,1)';
        ctx.lineWidth = 1.5 * scaleX;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
        ctx.restore();

        // ─── Bracket caps at start ───
        ctx.save();
        ctx.shadowBlur = 8 * scaleX;
        ctx.shadowColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.8)`;
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${1 * drawProg})`;
        ctx.lineWidth = 3.5 * scaleX;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx1 + Math.cos(perp) * tickS * 0.8, sy1 + Math.sin(perp) * tickS * 0.8);
        ctx.lineTo(sx1 - Math.cos(perp) * tickS * 0.8, sy1 - Math.sin(perp) * tickS * 0.8);
        ctx.stroke();
        ctx.restore();

        // ─── Bracket caps at end (only when progress > 0.5) ───
        if (drawProg > 0.5) {
          const capAlpha = Math.min(1, (drawProg - 0.5) * 4);
          ctx.save();
          ctx.shadowBlur = 8 * scaleX;
          ctx.shadowColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.8)`;
          ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${1 * capAlpha})`;
          ctx.lineWidth = 3.5 * scaleX;
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
          const labelText = targetLines.length > 1
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
  }, [targetLines, display, viewW, viewH, lengths, total]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ imageRendering: 'auto' }}
    />
  );
}
