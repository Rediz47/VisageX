import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, RotateCcw, RotateCw, FlipHorizontal2, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  imageUrl: string;
  isDarkMode: boolean;
  onConfirm: (url: string) => void;
  onCancel: () => void;
}

type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'move' | null;

const MIN_CROP = 0.08;

export function PhotoEditorModal({ imageUrl, isDarkMode, onConfirm, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [coarseRot, setCoarseRot] = useState(0); // multiples of 90
  const [fineRot, setFineRot] = useState(0); // −15 to +15
  const [flipH, setFlipH] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 340, h: 430 });
  const [cropBox, setCropBox] = useState({ x: 0.04, y: 0.04, w: 0.92, h: 0.92 });

  const totalRot = coarseRot + fineRot;

  const dragState = useRef<{
    handle: Handle;
    startPx: number;
    startPy: number;
    startCrop: typeof cropBox;
  } | null>(null);

  // ── Draw rotated/flipped image to canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const rad = (totalRot * Math.PI) / 180;
      const cosA = Math.abs(Math.cos(rad));
      const sinA = Math.abs(Math.sin(rad));
      const W = img.naturalWidth,
        H = img.naturalHeight;
      const cW = Math.round(W * cosA + H * sinA);
      const cH = Math.round(W * sinA + H * cosA);

      canvas.width = cW;
      canvas.height = cH;

      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, cW, cH);
      ctx.save();
      ctx.translate(cW / 2, cH / 2);
      ctx.rotate(rad);
      if (flipH) ctx.scale(-1, 1);
      ctx.drawImage(img, -W / 2, -H / 2);
      ctx.restore();

      // Recompute display size
      const parent = wrapperRef.current?.parentElement;
      const maxW = (parent?.clientWidth ?? 420) - 32;
      const maxH = Math.min(window.innerHeight * 0.52, 460);
      const ar = cW / cH;
      let dw = maxW,
        dh = maxW / ar;
      if (dh > maxH) {
        dh = maxH;
        dw = maxH * ar;
      }
      setCanvasSize({ w: Math.round(dw), h: Math.round(dh) });
    };
  }, [imageUrl, totalRot, flipH]);

  // ── Pointer events ──
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const { x, y, w, h } = cropBox;
      const hs = 0.055;

      const nearL = px >= x - hs && px <= x + hs;
      const nearR = px >= x + w - hs && px <= x + w + hs;
      const nearT = py >= y - hs && py <= y + hs;
      const nearB = py >= y + h - hs && py <= y + h + hs;

      let handle: Handle = null;
      if (nearL && nearT) handle = 'nw';
      else if (nearR && nearT) handle = 'ne';
      else if (nearL && nearB) handle = 'sw';
      else if (nearR && nearB) handle = 'se';
      else if (px > x && px < x + w && py > y && py < y + h) handle = 'move';

      if (!handle) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = { handle, startPx: px, startPy: py, startCrop: { ...cropBox } };
    },
    [cropBox]
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const dx = px - dragState.current.startPx;
    const dy = py - dragState.current.startPy;
    const sc = dragState.current.startCrop;

    let nx = sc.x,
      ny = sc.y,
      nw = sc.w,
      nh = sc.h;

    switch (dragState.current.handle) {
      case 'move':
        nx = Math.max(0, Math.min(1 - sc.w, sc.x + dx));
        ny = Math.max(0, Math.min(1 - sc.h, sc.y + dy));
        break;
      case 'nw':
        nx = sc.x + dx;
        ny = sc.y + dy;
        nw = sc.x + sc.w - nx;
        nh = sc.y + sc.h - ny;
        break;
      case 'ne':
        ny = sc.y + dy;
        nw = sc.w + dx;
        nh = sc.y + sc.h - ny;
        break;
      case 'sw':
        nx = sc.x + dx;
        nw = sc.x + sc.w - nx;
        nh = sc.h + dy;
        break;
      case 'se':
        nw = sc.w + dx;
        nh = sc.h + dy;
        break;
    }

    nw = Math.max(MIN_CROP, Math.min(1 - nx, nw));
    nh = Math.max(MIN_CROP, Math.min(1 - ny, nh));
    nx = Math.max(0, Math.min(1 - nw, nx));
    ny = Math.max(0, Math.min(1 - nh, ny));

    setCropBox({ x: nx, y: ny, w: nw, h: nh });
  }, []);

  const onPointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  // ── Confirm: export crop from canvas ──
  const handleConfirm = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scaleX = canvas.width / canvasSize.w;
    const scaleY = canvas.height / canvasSize.h;

    const cx = Math.round(cropBox.x * canvasSize.w * scaleX);
    const cy = Math.round(cropBox.y * canvasSize.h * scaleY);
    const cw = Math.round(cropBox.w * canvasSize.w * scaleX);
    const ch = Math.round(cropBox.h * canvasSize.h * scaleY);

    const out = document.createElement('canvas');
    out.width = Math.max(1, cw);
    out.height = Math.max(1, ch);
    out.getContext('2d')!.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);
    out.toBlob(
      (blob) => {
        if (blob) onConfirm(URL.createObjectURL(blob));
      },
      'image/jpeg',
      0.95
    );
  }, [cropBox, canvasSize, onConfirm]);

  const handleReset = () => {
    setCoarseRot(0);
    setFineRot(0);
    setFlipH(false);
    setCropBox({ x: 0.04, y: 0.04, w: 0.92, h: 0.92 });
  };

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && !e.shiftKey) handleConfirm();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onCancel, handleConfirm]);

  const { x, y, w, h } = cropBox;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onCancel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      <motion.div
        className={cn(
          'relative z-10 w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden',
          isDarkMode
            ? 'bg-[#111114] border border-white/[0.06]'
            : 'bg-white border border-zinc-200/80'
        )}
        initial={{ scale: 0.93, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.93, y: 24, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
      >
        {/* ── Header ── */}
        <div
          className={cn(
            'flex items-center justify-between px-5 py-3.5 border-b',
            isDarkMode ? 'border-white/5' : 'border-zinc-100'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center',
                isDarkMode ? 'bg-indigo-500/15' : 'bg-indigo-50'
              )}
            >
              <svg
                className="w-3.5 h-3.5 text-indigo-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"
                />
              </svg>
            </div>
            <div>
              <p
                className={cn(
                  'text-sm font-semibold leading-none',
                  isDarkMode ? 'text-white' : 'text-zinc-900'
                )}
              >
                Adjust Photo
              </p>
              <p
                className={cn('text-[11px] mt-0.5', isDarkMode ? 'text-white/30' : 'text-zinc-400')}
              >
                Crop & rotate before analysis
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-full transition-colors',
              isDarkMode ? 'hover:bg-white/8 text-white/40' : 'hover:bg-zinc-100 text-zinc-400'
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Canvas editor area ── */}
        <div className={cn('p-4', isDarkMode ? 'bg-[#0a0a0d]' : 'bg-zinc-50')}>
          <div
            ref={wrapperRef}
            className="flex items-center justify-center rounded-xl overflow-hidden"
            style={{ minHeight: 200, background: isDarkMode ? '#050507' : '#e4e4e7' }}
          >
            <div
              className="relative select-none"
              style={{ width: canvasSize.w, height: canvasSize.h, touchAction: 'none' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {/* Image canvas */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ display: 'block', imageRendering: 'auto' }}
              />

              {/* Dark scrim outside crop — box-shadow trick */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  width: `${w * 100}%`,
                  height: `${h * 100}%`,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.58)',
                  zIndex: 10
                }}
              />

              {/* Crop box border */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  width: `${w * 100}%`,
                  height: `${h * 100}%`,
                  border: '1.5px solid rgba(255,255,255,0.75)',
                  zIndex: 11
                }}
              >
                {/* Rule-of-thirds grid */}
                {[1 / 3, 2 / 3].map((t) => (
                  <React.Fragment key={t}>
                    <div
                      className="absolute w-full"
                      style={{
                        height: 1,
                        top: `${t * 100}%`,
                        background: 'rgba(255,255,255,0.13)'
                      }}
                    />
                    <div
                      className="absolute h-full"
                      style={{
                        width: 1,
                        left: `${t * 100}%`,
                        background: 'rgba(255,255,255,0.13)'
                      }}
                    />
                  </React.Fragment>
                ))}
              </div>

              {/* Corner handles — L-shaped */}
              {(
                [
                  {
                    id: 'nw',
                    cx: x,
                    cy: y,
                    t: 'translate(-1px,-1px)',
                    bl: '0 0 0 0',
                    bw: '2.5px 0 0 2.5px'
                  },
                  {
                    id: 'ne',
                    cx: x + w,
                    cy: y,
                    t: 'translate(calc(-100% + 1px),-1px)',
                    bl: '0 0 0 0',
                    bw: '2.5px 2.5px 0 0'
                  },
                  {
                    id: 'sw',
                    cx: x,
                    cy: y + h,
                    t: 'translate(-1px,calc(-100% + 1px))',
                    bl: '0 0 0 0',
                    bw: '0 0 2.5px 2.5px'
                  },
                  {
                    id: 'se',
                    cx: x + w,
                    cy: y + h,
                    t: 'translate(calc(-100% + 1px),calc(-100% + 1px))',
                    bl: '0 0 0 0',
                    bw: '0 2.5px 2.5px 0'
                  }
                ] as const
              ).map(({ id, cx: hx, cy: hy, t: transform, bw }) => (
                <div
                  key={id}
                  className="absolute pointer-events-auto"
                  style={{
                    left: `${hx * 100}%`,
                    top: `${hy * 100}%`,
                    width: 20,
                    height: 20,
                    transform,
                    zIndex: 12,
                    cursor: `${id}-resize`,
                    border: `solid rgba(255,255,255,0.9)`,
                    borderWidth: bw
                  }}
                />
              ))}

              {/* Drag interior — center cursor */}
              <div
                className="absolute pointer-events-auto"
                style={{
                  left: `${(x + 0.08) * 100}%`,
                  top: `${(y + 0.08) * 100}%`,
                  width: `${(w - 0.16) * 100}%`,
                  height: `${(h - 0.16) * 100}%`,
                  cursor: 'move',
                  zIndex: 12
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Rotation controls ── */}
        <div
          className={cn(
            'px-5 pt-3 pb-2 space-y-3 border-t',
            isDarkMode ? 'border-white/5' : 'border-zinc-100'
          )}
        >
          <div className="flex items-center gap-2.5">
            {/* Coarse rotate buttons */}
            <button
              onClick={() => setCoarseRot((r) => r - 90)}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-sm font-medium',
                isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 text-white/60'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
              )}
              title="Rotate −90°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCoarseRot((r) => r + 90)}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg transition-colors',
                isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 text-white/60'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
              )}
              title="Rotate +90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFlipH((f) => !f)}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg transition-colors',
                flipH
                  ? isDarkMode
                    ? 'bg-indigo-500/25 text-indigo-400'
                    : 'bg-indigo-100 text-indigo-600'
                  : isDarkMode
                    ? 'bg-white/5 hover:bg-white/10 text-white/60'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
              )}
              title="Flip horizontal"
            >
              <FlipHorizontal2 className="w-3.5 h-3.5" />
            </button>

            <div className="flex-1" />

            {(coarseRot !== 0 || fineRot !== 0 || flipH) && (
              <button
                onClick={handleReset}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium transition-colors',
                  isDarkMode
                    ? 'text-white/30 hover:text-white/60'
                    : 'text-zinc-400 hover:text-zinc-600'
                )}
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            )}

            {totalRot !== 0 && (
              <span
                className={cn(
                  'text-[11px] tabular-nums font-mono w-10 text-right',
                  isDarkMode ? 'text-white/30' : 'text-zinc-400'
                )}
              >
                {((totalRot % 360) + 360) % 360}°
              </span>
            )}
          </div>

          {/* Fine rotation slider */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'text-[9px] font-bold uppercase tracking-widest shrink-0',
                isDarkMode ? 'text-white/20' : 'text-zinc-400'
              )}
            >
              Fine
            </span>
            <input
              type="range"
              min={-15}
              max={15}
              step={0.5}
              value={fineRot}
              onChange={(e) => setFineRot(parseFloat(e.target.value))}
              className="flex-1 h-0.5 cursor-pointer rounded-full appearance-none"
              style={{ accentColor: '#6366f1' }}
            />
            <span
              className={cn(
                'text-[10px] tabular-nums font-mono w-9 text-right shrink-0',
                isDarkMode ? 'text-white/25' : 'text-zinc-400'
              )}
            >
              {fineRot > 0 ? `+${fineRot}` : fineRot}°
            </span>
          </div>
        </div>

        {/* ── Footer buttons ── */}
        <div
          className={cn(
            'px-5 py-4 flex items-center gap-3 border-t',
            isDarkMode ? 'border-white/5' : 'border-zinc-100'
          )}
        >
          <button
            onClick={onCancel}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors',
              isDarkMode
                ? 'border-white/8 text-white/40 hover:bg-white/5 hover:text-white/60'
                : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-[2] py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            Analyze Photo
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
