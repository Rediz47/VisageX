import React, { useEffect, useRef } from 'react';
import { detectDeviceTier, type MotionTier } from '../../../lib/motion';

// Cinematic humanoid scan system (v3): 14 landmarks, sub-FSM, wireframe pass,
// summary pose, progress-paced timing, hybrid ground/levitate robot, rich HUD,
// personality layers (idle fidgets, reactive emotions, environmental reactions).

interface Vec2 {
  x: number;
  y: number;
}
interface Ring {
  x: number;
  y: number;
  r: number;
  maxR: number;
  a: number;
  col: string;
  w: number;
  alive: boolean;
}
interface Dot {
  id: number;
  x: number;
  y: number;
  born: number;
  col: string;
  alive: boolean;
}
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  col: string;
  kind: 'soft' | 'data' | 'burst';
  alive: boolean;
}
interface Wireframe {
  name: string;
  pts: Float32Array;
  count: number;
  cumLen: Float32Array;
  totalLen: number;
  col: string;
  closed: boolean;
  coreWidth: number;
  glowWidth: number;
  startAt: number;
  prog: number;
  alive: boolean;
}

interface Props {
  imageUrl: string;
  progress: number;
  isDarkMode: boolean;
  landmarks?: Array<{ x: number; y: number }> | null;
  width?: number;
  height?: number;
  onAnimationComplete?: () => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rng = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

function hexA(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function ik2(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  u: number,
  l: number,
  sign: number
): Vec2 {
  const dx = tx - sx,
    dy = ty - sy;
  const d = Math.max(0.01, Math.hypot(dx, dy));
  const cd = Math.min(d, u + l - 0.01);
  const a2 = (u * u - l * l + cd * cd) / (2 * cd);
  const h = Math.sqrt(Math.max(0, u * u - a2 * a2));
  const px = sx + (dx * a2) / cd;
  const py = sy + (dy * a2) / cd;
  return { x: px + (-dy / cd) * h * sign, y: py + (dx / cd) * h * sign };
}

function spring(value: number, velocity: number, target: number, k: number, d: number) {
  velocity += (target - value) * k;
  velocity *= d;
  return { v: value + velocity, vel: velocity };
}

function coverFitRect(px: number, py: number, pw: number, ph: number, imgW: number, imgH: number) {
  const ir = imgW / imgH,
    pr = pw / ph;
  let dw = pw,
    dh = ph,
    dx = px,
    dy = py;
  if (ir > pr) {
    dw = ph * ir;
    dx = px - (dw - pw) / 2;
  } else {
    dh = pw / ir;
    dy = py - (dh - ph) / 2;
  }
  return { dx, dy, dw, dh };
}

// Nose-tip (id 1) intentionally excluded from visit order to avoid a redundant
// middle-nose dot, but kept in LANDMARK_META / FB for safe pt() fallback.
const VISIT_ORDER = [10, 9, 70, 300, 33, 263, 168, 2, 234, 454, 61, 291, 152];

const LANDMARK_META: Record<number, { label: string; col: string }> = {
  10: { label: 'CRANIUM', col: '#a78bfa' },
  9: { label: 'GLABELLA', col: '#f0abfc' },
  70: { label: 'L-BROW', col: '#818cf8' },
  300: { label: 'R-BROW', col: '#60a5fa' },
  33: { label: 'L-EYE', col: '#22d3ee' },
  263: { label: 'R-EYE', col: '#38bdf8' },
  168: { label: 'N-BRIDGE', col: '#2dd4bf' },
  1: { label: 'NOSE-TIP', col: '#34d399' },
  2: { label: 'N-BASE', col: '#6ee7b7' },
  234: { label: 'L-CHEEK', col: '#fbbf24' },
  454: { label: 'R-CHEEK', col: '#fb7185' },
  61: { label: 'L-LIP', col: '#f472b6' },
  291: { label: 'R-LIP', col: '#ec4899' },
  152: { label: 'CHIN', col: '#fda4af' }
};

const FB: Record<number, Vec2> = {
  10: { x: 0.5, y: 0.18 },
  9: { x: 0.5, y: 0.33 },
  70: { x: 0.4, y: 0.32 },
  300: { x: 0.6, y: 0.32 },
  33: { x: 0.38, y: 0.4 },
  263: { x: 0.62, y: 0.4 },
  168: { x: 0.5, y: 0.42 },
  1: { x: 0.5, y: 0.55 },
  2: { x: 0.5, y: 0.6 },
  234: { x: 0.3, y: 0.57 },
  454: { x: 0.7, y: 0.57 },
  61: { x: 0.42, y: 0.68 },
  291: { x: 0.58, y: 0.68 },
  152: { x: 0.5, y: 0.82 }
};
const FB_EXTRA: Record<number, Vec2> = {
  107: { x: 0.44, y: 0.29 },
  55: { x: 0.47, y: 0.31 },
  285: { x: 0.53, y: 0.31 },
  6: { x: 0.5, y: 0.37 },
  197: { x: 0.5, y: 0.42 },
  195: { x: 0.5, y: 0.47 },
  5: { x: 0.5, y: 0.5 },
  4: { x: 0.5, y: 0.52 },
  132: { x: 0.26, y: 0.63 },
  172: { x: 0.28, y: 0.7 },
  136: { x: 0.32, y: 0.75 },
  150: { x: 0.38, y: 0.79 },
  149: { x: 0.44, y: 0.81 },
  176: { x: 0.48, y: 0.82 },
  148: { x: 0.5, y: 0.82 },
  0: { x: 0.5, y: 0.7 }
};

type Phase = 'idle' | 'moving' | 'scanning' | 'analyzing' | 'wireframe' | 'summary' | 'finale';
type SubPhase = null | 'calibrate' | 'primaryBeam' | 'crossCheck' | 'readout';
type Fidget = null | 'look' | 'stretch' | 'checkWrist' | 'tap' | 'glance';

const SUB_BASE = { calibrate: 80, primaryBeam: 200, crossCheck: 100, readout: 90 };
const T_ANALYZE_BASE = 100;
const T_WIREFRAME_BASE = 320;
const T_SUMMARY_BASE = 550;
const T_IDLE_HOP = 200;
// Stagger: next wireframe group starts when previous is 30% through (70% overlap).
const WIREFRAME_STAGGER = 0.3;

interface WireframeGroup {
  name: string;
  ids: number[];
  col: string;
  closed: boolean;
  coreWidth: number;
  glowWidth: number;
}

const WIREFRAME_GROUPS: WireframeGroup[] = [
  // Face oval — closed loop around the whole face (reuses FACE_OVAL below)
  { name: 'faceOval', ids: [], col: '#7dd3fc', closed: true, coreWidth: 1.5, glowWidth: 4.0 },
  // Left eye — closed MediaPipe left-eye ring
  {
    name: 'leftEye',
    ids: [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7],
    col: '#22d3ee',
    closed: true,
    coreWidth: 1.3,
    glowWidth: 3.2
  },
  // Right eye — closed MediaPipe right-eye ring
  {
    name: 'rightEye',
    ids: [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249],
    col: '#38bdf8',
    closed: true,
    coreWidth: 1.3,
    glowWidth: 3.2
  },
  // Left brow
  {
    name: 'leftBrow',
    ids: [70, 63, 105, 66, 107],
    col: '#818cf8',
    closed: false,
    coreWidth: 1.2,
    glowWidth: 3.0
  },
  // Right brow
  {
    name: 'rightBrow',
    ids: [336, 296, 334, 293, 300],
    col: '#a78bfa',
    closed: false,
    coreWidth: 1.2,
    glowWidth: 3.0
  },
  // Nose bridge
  {
    name: 'noseBridge',
    ids: [168, 6, 197, 195, 5, 4],
    col: '#2dd4bf',
    closed: false,
    coreWidth: 1.2,
    glowWidth: 3.0
  },
  // Outer lips — closed loop
  {
    name: 'outerLips',
    ids: [
      61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146
    ],
    col: '#f472b6',
    closed: true,
    coreWidth: 1.3,
    glowWidth: 3.4
  }
];

const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148,
  176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];
const _ovalX = new Float32Array(FACE_OVAL.length);
const _ovalY = new Float32Array(FACE_OVAL.length);

export function RobotScanCanvas({
  imageUrl,
  progress,
  isDarkMode,
  landmarks,
  width = 430,
  height = 573,
  onAnimationComplete
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastT = useRef<number>(0);
  const animDoneFired = useRef(false);
  const onAnimCompleteRef = useRef(onAnimationComplete);
  useEffect(() => {
    onAnimCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  const progressRef = useRef(progress);
  const darkRef = useRef(isDarkMode);
  const landmarksRef = useRef(landmarks);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  useEffect(() => {
    darkRef.current = isDarkMode;
  }, [isDarkMode]);
  useEffect(() => {
    landmarksRef.current = landmarks;
  }, [landmarks]);

  // Cache tier ONCE on mount — runtime detection is stable per session.
  const tierRef = useRef<MotionTier>('high');
  useEffect(() => {
    tierRef.current = detectDeviceTier();
  }, []);

  const S = useRef({
    init: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    tx: 0,
    ty: 0,
    // Raw landmark target (stepped) — tx/ty smoothly lerps toward this so the
    // spring downstream never sees a discontinuous step. On high tier we also
    // bias toward a Catmull-Rom midpoint during the first half of each hop.
    landmarkTx: 0,
    landmarkTy: 0,
    midTx: 0,
    midTy: 0,
    useMid: false,
    moveStartT: 0,
    moveDist: 0,
    facing: 1 as 1 | -1,
    // Bumped from 0.7 → 1.0 — the bot was visibly small relative to the
    // canvas. New base scale is ~43% bigger and reads as a real character.
    scale: 1.0,
    vScale: 0,
    tScale: 1.0,
    gait: 0,
    speed: 0,
    levitate: 0,
    vLevitate: 0,
    tLevitate: 0,
    headRot: 0,
    vHeadRot: 0,
    tHeadRot: 0,
    eyeX: 0,
    vEyeX: 0,
    eyeY: 0,
    vEyeY: 0,
    armExtend: 0,
    vArmExtend: 0,
    tArmExtend: 0,
    handX: 0,
    handY: 0,
    crossHandX: 0,
    crossHandY: 0,
    crossTargetX: 0,
    crossTargetY: 0,
    phase: 'idle' as Phase,
    phaseT: 0,
    subPhase: null as SubPhase,
    subT: 0,
    subDuration: 0,
    visitIdx: 0,
    focusX: 0,
    focusY: 0,
    focusCol: '#22d3ee',
    attention: 0,
    vAttention: 0,
    energy: 0,
    primaryBeamOn: false,
    crossBeamOn: false,
    readoutOn: false,
    blink: 0,
    blinkTimer: 0,
    antX: 0,
    antY: 0,
    antVx: 0,
    antVy: 0,
    antX2: 0,
    antY2: 0,
    antVx2: 0,
    antVy2: 0,
    paraX: 0,
    vParaX: 0,
    rings: [] as Ring[],
    dots: [] as Dot[],
    sparks: [] as Spark[],
    wireframes: [] as Wireframe[],
    wireframeIdx: 0,
    wireframeDur: 0,
    celebrate: false,
    grid: null as null | { cols: number; rows: number; step: number; ox: number; oy: number },
    paceScale: 1,
    progHistory: { p: 0, t: 0, sampledAt: 0 },
    stallTimer: 0,
    speedMult: 1,
    hudWave: new Float32Array(32),
    hudWaveHead: 0,
    displayText: 'BOOT',
    browTilt: 0,
    vBrowTilt: 0,
    tBrowTilt: 0,
    eyeWide: 0,
    vEyeWide: 0,
    tEyeWide: 0,
    mouthCurve: 0,
    vMouthCurve: 0,
    tMouthCurve: 0,
    fidget: null as Fidget,
    fidgetT: 0,
    fidgetNext: 1800,
    fidgetValue: 0,
    nodImpulse: 0,
    recoilImpulse: 0,
    startleImpulse: 0,
    shakeImpulse: 0,
    lastVisitIdx: -1,
    lastSummaryBeat: -1,
    // Finale
    finaleT: 0,
    finaleStage: 0,
    finaleSpin: 0,
    finaleLift: 0,
    flashAlpha: 0,
    showHoloDone: 0,
    finaleBurstSpawned: false,
    // Visible polish v3.1:
    //  - trail: ring-buffer of recent (x,y,t) for afterimage ghosts when fast.
    //  - thinkPhase: rolling phase for the 3-dot bubble during analyze/wireframe.
    //  - auraPulse: independent pulse counter for the scan aura ring.
    trail: new Float32Array(30), // 10 samples × (x, y, age)
    trailHead: 0,
    thinkPhase: 0,
    auraPulse: 0,
    armWave: 0 // 0..1, decays per frame; drives arm forward-thrust
  });

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const d = window.devicePixelRatio || 1;
    c.width = Math.floor(width * d);
    c.height = Math.floor(height * d);
    c.style.width = width + 'px';
    c.style.height = height + 'px';
  }, [width, height]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
    };
  }, [imageUrl]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const s = S.current;

    const PM = 12;
    const photoX = PM,
      photoY = PM,
      photoW = width - PM * 2,
      photoH = height - PM * 2;

    const GRID_STEP = 26;
    s.grid = {
      step: GRID_STEP,
      cols: Math.ceil(photoW / GRID_STEP) + 1,
      rows: Math.ceil(photoH / GRID_STEP) + 1,
      ox: photoX,
      oy: photoY
    };

    if (!s.init) {
      s.x = photoX + photoW * 0.5;
      s.y = photoY + photoH * 0.78;
      s.tx = s.x;
      s.ty = s.y;
      s.landmarkTx = s.x;
      s.landmarkTy = s.y;
      s.antX = s.x;
      s.antY = s.y - 52;
      s.antX2 = s.x;
      s.antY2 = s.y - 48;
      s.init = true;
    }

    const pt = (id: number): Vec2 => {
      const lm = landmarksRef.current;
      if (lm && lm.length > id && lm[id]) {
        const img = imgRef.current;
        if (img) {
          const cf = coverFitRect(photoX, photoY, photoW, photoH, img.width, img.height);
          return { x: cf.dx + lm[id].x * cf.dw, y: cf.dy + lm[id].y * cf.dh };
        }
        return { x: photoX + lm[id].x * photoW, y: photoY + lm[id].y * photoH };
      }
      const fb = FB[id] || FB_EXTRA[id];
      if (fb) return { x: photoX + fb.x * photoW, y: photoY + fb.y * photoH };
      return { x: width * 0.5, y: height * 0.5 };
    };

    const RING_CAP = 40;
    const DOT_CAP = VISIT_ORDER.length;
    const SPARK_CAP = 96;
    const WIREFRAME_CAP = WIREFRAME_GROUPS.length;

    const pushRing = (x: number, y: number, maxR: number, col: string, w: number) => {
      let slot: Ring | null = null;
      for (const r of s.rings)
        if (!r.alive) {
          slot = r;
          break;
        }
      if (!slot && s.rings.length < RING_CAP) {
        s.rings.push({ x, y, r: 0, maxR, a: 1, col, w, alive: true });
        return;
      }
      if (!slot) return;
      slot.x = x;
      slot.y = y;
      slot.r = 0;
      slot.maxR = maxR;
      slot.a = 1;
      slot.col = col;
      slot.w = w;
      slot.alive = true;
    };
    const pushDot = (id: number, x: number, y: number, col: string, now: number) => {
      for (const d of s.dots)
        if (d.alive && d.id === id) {
          d.x = x;
          d.y = y;
          d.born = now;
          d.col = col;
          return;
        }
      let slot: Dot | null = null;
      for (const d of s.dots)
        if (!d.alive) {
          slot = d;
          break;
        }
      if (!slot && s.dots.length < DOT_CAP) {
        s.dots.push({ id, x, y, born: now, col, alive: true });
        return;
      }
      if (!slot) return;
      slot.id = id;
      slot.x = x;
      slot.y = y;
      slot.born = now;
      slot.col = col;
      slot.alive = true;
    };
    const pushSpark = (
      x: number,
      y: number,
      col: string,
      kind: 'soft' | 'data' | 'burst' = 'soft'
    ) => {
      let slot: Spark | null = null;
      for (const sp of s.sparks)
        if (!sp.alive) {
          slot = sp;
          break;
        }
      let vx: number, vy: number;
      if (kind === 'data') {
        vy = rng(-2.0, -1.0);
        vx = rng(-0.25, 0.25);
      } else if (kind === 'burst') {
        const ang = rng(0, Math.PI * 2);
        const sp = rng(2.0, 4.5);
        vx = Math.cos(ang) * sp;
        vy = Math.sin(ang) * sp;
      } else {
        vy = rng(-1.2, 0.2);
        vx = rng(-0.8, 0.8);
      }
      if (!slot && s.sparks.length < SPARK_CAP) {
        s.sparks.push({ x, y, vx, vy, life: 1, col, kind, alive: true });
        return;
      }
      if (!slot) return;
      slot.x = x;
      slot.y = y;
      slot.vx = vx;
      slot.vy = vy;
      slot.life = 1;
      slot.col = col;
      slot.kind = kind;
      slot.alive = true;
    };
    // Build a smoothed polyline via Catmull-Rom → cubic-bezier interpolation.
    // Runs ONCE per wireframe phase; per-frame render only strokes the cached points.
    const SAMPLES_PER_SEG = 10;
    const buildSmoothedPath = (
      ids: number[],
      closed: boolean
    ): { pts: Float32Array; count: number; cumLen: Float32Array; totalLen: number } | null => {
      const n = ids.length;
      if (n < 2) return null;
      const A: Vec2[] = new Array(n);
      for (let i = 0; i < n; i++) A[i] = pt(ids[i]);
      const getA = (i: number): Vec2 => {
        if (closed) return A[((i % n) + n) % n];
        return A[clamp(i, 0, n - 1)];
      };
      const segCount = closed ? n : n - 1;
      const totalSamples = segCount * SAMPLES_PER_SEG + 1;
      const pts = new Float32Array(totalSamples * 2);
      const cumLen = new Float32Array(totalSamples);
      let idx = 0;
      let totalLen = 0;
      for (let i = 0; i < segCount; i++) {
        const P0 = getA(i - 1),
          P1 = getA(i),
          P2 = getA(i + 1),
          P3 = getA(i + 2);
        const cp1x = P1.x + (P2.x - P0.x) / 6;
        const cp1y = P1.y + (P2.y - P0.y) / 6;
        const cp2x = P2.x - (P3.x - P1.x) / 6;
        const cp2y = P2.y - (P3.y - P1.y) / 6;
        for (let k = 0; k < SAMPLES_PER_SEG; k++) {
          const t = k / SAMPLES_PER_SEG;
          const mt = 1 - t;
          const x =
            mt * mt * mt * P1.x + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * P2.x;
          const y =
            mt * mt * mt * P1.y + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * P2.y;
          pts[idx * 2] = x;
          pts[idx * 2 + 1] = y;
          if (idx > 0) totalLen += Math.hypot(x - pts[(idx - 1) * 2], y - pts[(idx - 1) * 2 + 1]);
          cumLen[idx] = totalLen;
          idx++;
        }
      }
      // Final anchor (closing the loop for closed, or the last endpoint for open)
      const last = closed ? A[0] : A[n - 1];
      pts[idx * 2] = last.x;
      pts[idx * 2 + 1] = last.y;
      if (idx > 0)
        totalLen += Math.hypot(last.x - pts[(idx - 1) * 2], last.y - pts[(idx - 1) * 2 + 1]);
      cumLen[idx] = totalLen;
      idx++;
      return { pts, count: idx, cumLen, totalLen };
    };

    // Build all wireframe groups in one pass on phase entry. Staggered startAt
    // so only ~2-3 groups animate concurrently (caps overdraw).
    const buildAllWireframes = () => {
      // Clear any stale wireframes first
      for (const w of s.wireframes) w.alive = false;
      s.wireframes.length = 0;
      const dur = Math.min(4000, T_WIREFRAME_BASE * s.paceScale);
      for (let i = 0; i < WIREFRAME_GROUPS.length; i++) {
        const g = WIREFRAME_GROUPS[i];
        const ids = g.name === 'faceOval' && g.ids.length === 0 ? FACE_OVAL : g.ids;
        const built = buildSmoothedPath(ids, g.closed);
        if (!built) continue;
        if (s.wireframes.length >= WIREFRAME_CAP) break;
        s.wireframes.push({
          name: g.name,
          pts: built.pts,
          count: built.count,
          cumLen: built.cumLen,
          totalLen: built.totalLen,
          col: g.col,
          closed: g.closed,
          coreWidth: g.coreWidth,
          glowWidth: g.glowWidth,
          startAt: i * dur * WIREFRAME_STAGGER,
          prog: 0,
          alive: true
        });
      }
      return dur;
    };

    const enterSub = (sub: SubPhase) => {
      s.subPhase = sub;
      s.subT = 0;
      const base = sub ? SUB_BASE[sub] : 0;
      s.subDuration = Math.min(4000, base * s.paceScale);
      s.primaryBeamOn = sub === 'primaryBeam' || sub === 'crossCheck';
      s.crossBeamOn = sub === 'crossCheck';
      s.readoutOn = sub === 'readout';
      s.displayText =
        sub === 'calibrate'
          ? 'CALIB'
          : sub === 'primaryBeam'
            ? 'SCAN'
            : sub === 'crossCheck'
              ? 'XCHK'
              : sub === 'readout'
                ? 'READ'
                : s.displayText;
      if (sub === 'crossCheck') s.shakeImpulse = 1;
    };

    const nextTarget = () => {
      const id = VISIT_ORDER[s.visitIdx % VISIT_ORDER.length];
      const meta = LANDMARK_META[id];
      const p = pt(id);
      s.focusX = p.x;
      s.focusY = p.y;
      s.focusCol = meta.col;
      const side = p.x < photoX + photoW * 0.5 ? 1 : -1;
      const offsetX = side * 46;
      const offsetY = Math.min(60, photoY + photoH - 30 - p.y) < 20 ? -40 : 40;
      // Write to LANDMARK target — actual tx/ty lerps toward this each frame
      // (continuous, no step discontinuity → no micro-jumps).
      s.landmarkTx = clamp(p.x + offsetX, photoX + 30, photoX + photoW - 30);
      s.landmarkTy = clamp(p.y + offsetY, photoY + 40, photoY + photoH - 24);
      s.facing = p.x >= s.landmarkTx ? 1 : -1;
      const dx = s.landmarkTx - s.x,
        dy = s.landmarkTy - s.y;
      const mag = Math.hypot(dx, dy);
      if (mag > 1) {
        s.vx -= (dx / mag) * 0.6;
        s.vy -= (dy / mag) * 0.4;
      }
      if (mag > 200) {
        s.startleImpulse = 1;
        s.vy -= 1.5;
      }
      // Dash-leap on long hops: launch the bot upward so it ARCS to the next
      // landmark instead of crawling. The arc apex naturally clears obstacles
      // and reads as a deliberate, athletic move (vs. walking through air).
      if (mag > 110) {
        s.vy -= clamp(mag * 0.022, 2.4, 5.5);
        s.vx += (dx / mag) * clamp(mag * 0.025, 1.5, 4.5);
        s.armWave = 1; // throw an arm forward like a leap
      }
      // Catmull-Rom mid-waypoint on HIGH tier for curved approach paths.
      // Uses prev/cur/next/next+1 visit landmarks as 4-point CR control.
      if (tierRef.current === 'high' && mag > 60) {
        const prevId = VISIT_ORDER[(s.visitIdx - 1 + VISIT_ORDER.length) % VISIT_ORDER.length];
        const nextId = VISIT_ORDER[(s.visitIdx + 1) % VISIT_ORDER.length];
        const P0 = pt(prevId),
          P1 = { x: s.x, y: s.y },
          P2 = { x: s.landmarkTx, y: s.landmarkTy },
          P3 = pt(nextId);
        // Sample CR at t=0.5 (midpoint) using uniform formulation.
        const t = 0.5,
          t2 = t * t,
          t3 = t2 * t;
        const a = -0.5 * t3 + t2 - 0.5 * t;
        const b = 1.5 * t3 - 2.5 * t2 + 1;
        const c = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
        const d = 0.5 * t3 - 0.5 * t2;
        s.midTx = clamp(
          a * P0.x + b * P1.x + c * P2.x + d * P3.x,
          photoX + 30,
          photoX + photoW - 30
        );
        s.midTy = clamp(
          a * P0.y + b * P1.y + c * P2.y + d * P3.y,
          photoY + 40,
          photoY + photoH - 24
        );
        s.useMid = true;
      } else {
        s.useMid = false;
      }
      s.moveStartT = 0;
      s.moveDist = mag;
      s.phase = 'moving';
      s.phaseT = 0;
      s.subPhase = null;
      s.lastVisitIdx = s.visitIdx;
      s.fidget = null;
      s.displayText = 'SEEK';
    };

    const tryStartFidget = () => {
      if (s.phase !== 'idle' || s.celebrate) return;
      const options: Fidget[] = ['look', 'stretch', 'checkWrist', 'tap', 'glance'];
      s.fidget = options[Math.floor(Math.random() * options.length)];
      s.fidgetT = 0;
      s.fidgetValue = 0;
      s.fidgetNext = 1800 + Math.random() * 2000;
      s.displayText =
        s.fidget === 'checkWrist' ? 'WRIST' : s.fidget === 'glance' ? 'HI :)' : 'IDLE';
    };

    const updatePace = (now: number, progress: number) => {
      if (s.progHistory.sampledAt === 0) {
        s.progHistory.p = progress;
        s.progHistory.t = now;
        s.progHistory.sampledAt = now;
      }
      if (now - s.progHistory.sampledAt > 250) {
        const dp = progress - s.progHistory.p;
        const dtp = Math.max(1, now - s.progHistory.t);
        const rate = dp / dtp;
        s.progHistory.p = progress;
        s.progHistory.t = now;
        s.progHistory.sampledAt = now;
        if (rate < 1e-5) s.stallTimer += 250;
        else s.stallTimer = 0;
        let paceTarget: number;
        if (s.stallTimer > 3000 || rate < 1e-5) paceTarget = 1.5;
        else {
          const remainMs = clamp((100 - progress) / Math.max(rate, 1e-4), 4000, 90000);
          const remainingLandmarks = Math.max(0, VISIT_ORDER.length - s.visitIdx);
          const subTotal =
            SUB_BASE.calibrate +
            SUB_BASE.primaryBeam +
            SUB_BASE.crossCheck +
            SUB_BASE.readout +
            T_ANALYZE_BASE;
          const workMs =
            remainingLandmarks * subTotal +
            T_WIREFRAME_BASE * (1 + (WIREFRAME_GROUPS.length - 1) * WIREFRAME_STAGGER) +
            T_SUMMARY_BASE;
          paceTarget = clamp(remainMs / Math.max(1, workMs), 0.5, 3.0);
        }
        s.paceScale = s.paceScale + (paceTarget - s.paceScale) * 0.35;
      }
    };

    const tick = (now: number) => {
      // dt hardening: clamp to 1/30s ceiling. Catastrophic gaps (>200ms,
      // typical of tab-throttle return) are treated as a single frame and
      // transient velocity state is reset to prevent teleport bursts.
      const rawDt = now - (lastT.current || now - 16);
      lastT.current = now;
      let dt: number;
      if (rawDt > 200) {
        // Reset transient motion state on big gaps so we don't burst.
        s.vx = 0;
        s.vy = 0;
        s.speedMult = 1;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      dt = clamp(rawDt, 1, 1000 / 30);

      const progress = progressRef.current;
      const isDarkMode = darkRef.current;
      s.energy = Math.sin(now * 0.002) * 0.5 + 0.5;
      updatePace(now, progress);

      const robotExpected = 5 + (s.visitIdx / VISIT_ORDER.length) * 60;
      const ahead = clamp(progress - robotExpected, 0, 80);
      const smTarget =
        ahead > 30
          ? clamp(1 + ahead * 0.15, 1, 6)
          : ahead > 10
            ? clamp(0.8 + ahead * 0.06, 0.8, 3)
            : clamp(0.4 + ahead * 0.04, 0.4, 1.2);
      s.speedMult = s.speedMult + (smTarget - s.speedMult) * 0.35;

      const sMult = s.speedMult;
      s.phaseT += dt * sMult;
      s.subT += dt * sMult;
      s.fidgetT += dt;

      s.nodImpulse *= 0.9;
      s.recoilImpulse *= 0.88;
      s.startleImpulse *= 0.87;
      s.shakeImpulse *= 0.86;
      s.armWave *= 0.93; // decay leap-arm flag

      const atAllDone = s.visitIdx >= VISIT_ORDER.length;
      const progressGate = 5 + (s.visitIdx / VISIT_ORDER.length) * 60;
      if (!atAllDone && s.phase === 'idle') {
        if (
          progress >= progressGate &&
          s.phaseT > (s.lastVisitIdx < 0 ? 400 : T_IDLE_HOP * Math.max(0.15, 1 / sMult))
        )
          nextTarget();
        else if (s.fidget === null && s.fidgetT > s.fidgetNext) tryStartFidget();
      } else if (atAllDone && s.phase === 'idle' && !s.celebrate) {
        // Guard against race: only enter wireframe once landmarks are actually
        // populated (>=468 MediaPipe points). Otherwise stay in idle and fidget.
        const lm = landmarksRef.current;
        const landmarksReady = !!lm && lm.length >= 468;
        if (landmarksReady && progress >= 70) {
          // Only enter wireframe/summary/finale ONCE — never re-loop after celebrate.
          s.phase = 'wireframe';
          s.phaseT = 0;
          s.wireframeIdx = 0;
          s.displayText = 'MESH';
          s.tx = photoX + photoW * 0.5;
          s.ty = photoY + photoH * 0.32;
          // Build all smoothed paths ONCE on phase entry. Per-frame cost is then
          // pure stroke + dash math — no geometry work.
          const dur = buildAllWireframes();
          s.wireframeDur = dur;
        } else if (s.fidget === null && s.fidgetT > s.fidgetNext) {
          tryStartFidget();
        }
      } else if (atAllDone && s.phase === 'idle' && s.celebrate) {
        // Post-celebration ambient mode: gentle breathing, occasional soft fidgets.
        if (s.fidget === null && s.fidgetT > s.fidgetNext * 1.5) tryStartFidget();
      } else if (s.phase === 'moving') {
        const dist = Math.hypot(s.tx - s.x, s.ty - s.y);
        if (dist < 2.5 && Math.hypot(s.vx, s.vy) < 0.4) {
          s.phase = 'scanning';
          s.phaseT = 0;
          enterSub('calibrate');
        }
      } else if (s.phase === 'scanning') {
        if (s.subT > s.subDuration) {
          if (s.subPhase === 'calibrate') enterSub('primaryBeam');
          else if (s.subPhase === 'primaryBeam') enterSub('crossCheck');
          else if (s.subPhase === 'crossCheck') enterSub('readout');
          else if (s.subPhase === 'readout') {
            const id = VISIT_ORDER[s.visitIdx];
            pushDot(id, s.focusX, s.focusY, s.focusCol, now);
            pushRing(s.focusX, s.focusY, 42, s.focusCol, 2);
            pushRing(s.focusX, s.focusY, 70, '#ffffff', 1);
            s.nodImpulse = 1;
            s.shakeImpulse = 0.6;
            s.armWave = 1; // celebrate the captured landmark with a wave
            s.phase = 'analyzing';
            s.phaseT = 0;
            s.subPhase = null;
            s.primaryBeamOn = false;
            s.crossBeamOn = false;
            s.readoutOn = false;
            s.displayText = 'OK';
          }
        }
        if (s.subPhase === 'calibrate') s.tx += Math.sign(s.focusX - s.x) * 0.06;
        // Tier-aware particle work: low disables data sparks; mid halves rate.
        const _tier = tierRef.current;
        const _sparkRate = _tier === 'low' ? 0 : _tier === 'mid' ? 0.28 : 0.55;
        if (s.subPhase === 'readout' && _sparkRate > 0 && Math.random() < _sparkRate)
          pushSpark(s.focusX + rng(-3, 3), s.focusY + rng(-3, 3), s.focusCol, 'data');
        if (s.subPhase === 'primaryBeam' && Math.random() < 0.04) {
          pushRing(s.focusX, s.focusY, 26, s.focusCol, 1);
          s.recoilImpulse = Math.max(s.recoilImpulse, 0.6);
        }
        const pdx = s.focusX - s.handX,
          pdy = s.focusY - s.handY;
        const pl = Math.hypot(pdx, pdy) || 1;
        s.crossTargetX = s.focusX + (-pdy / pl) * 14;
        s.crossTargetY = s.focusY + (pdx / pl) * 14;
      } else if (s.phase === 'analyzing') {
        const dur = Math.min(4000, T_ANALYZE_BASE * s.paceScale);
        if (s.phaseT > dur) {
          s.visitIdx += 1;
          s.phase = 'idle';
          s.phaseT = 0;
        }
      } else if (s.phase === 'wireframe') {
        const dur = s.wireframeDur || Math.min(4000, T_WIREFRAME_BASE * s.paceScale);
        // Advance every alive group in parallel using its own startAt offset.
        let allDone = true;
        let leading: Wireframe | null = null;
        for (const w of s.wireframes)
          if (w.alive) {
            const local = s.phaseT - w.startAt;
            w.prog = clamp(local / dur, 0, 1);
            if (w.prog < 1) allDone = false;
            if (w.prog > 0 && w.prog < 1 && (!leading || w.prog > leading.prog)) leading = w;
          }
        // Drive robot focus along the currently-leading group's scan tip.
        if (leading) {
          const visible = leading.totalLen * easeInOutCubic(leading.prog);
          let lo = 0,
            hi = leading.count - 1;
          while (lo < hi) {
            const m = (lo + hi) >> 1;
            if (leading.cumLen[m] < visible) lo = m + 1;
            else hi = m;
          }
          s.focusX = leading.pts[lo * 2];
          s.focusY = leading.pts[lo * 2 + 1];
          s.focusCol = leading.col;
        }
        s.tx = photoX + photoW * 0.5 + Math.sin(now * 0.001) * 8;
        s.ty = photoY + photoH * 0.28;
        s.primaryBeamOn = true;
        // Phase ends once all groups finished AND at least one full tail duration
        // has elapsed past the last group's startAt.
        const lastStartAt = (WIREFRAME_GROUPS.length - 1) * dur * WIREFRAME_STAGGER;
        if (allDone && s.phaseT > lastStartAt + dur) {
          for (const w of s.wireframes) w.alive = false;
          s.phase = 'summary';
          s.phaseT = 0;
          s.displayText = 'ANLYZ';
          s.primaryBeamOn = false;
          s.tx = photoX + photoW * 0.5;
          s.ty = photoY + photoH * 0.5;
          s.focusX = photoX + photoW * 0.5;
          s.focusY = photoY + photoH * 0.5;
        }
      } else if (s.phase === 'summary') {
        // Hard cap at 1.4s so it never drags regardless of paceScale.
        const dur = Math.min(1400, T_SUMMARY_BASE * s.paceScale);
        const beats = Math.floor(s.phaseT / 500);
        if (beats > s.lastSummaryBeat) {
          s.lastSummaryBeat = beats;
          pushRing(s.focusX, s.focusY, 80, '#ffffff', 1.6);
          pushRing(s.focusX, s.focusY, 120, '#38bdf8', 1.2);
        }
        if (s.phaseT > dur) {
          s.phase = 'finale';
          s.phaseT = 0;
          s.finaleT = 0;
          s.finaleStage = 1;
          s.finaleBurstSpawned = false;
          s.tx = photoX + photoW * 0.5;
          s.ty = photoY + photoH * 0.55;
          s.displayText = 'COMPL';
        }
      } else if (s.phase === 'finale') {
        s.finaleT += dt;
        const T_STAGES = [600, 1000, 1800, 2500, 2900];
        // Stage 1: Triumphant (0 .. 1400)
        if (s.finaleT < T_STAGES[0]) {
          s.finaleStage = 1;
          if (!s.finaleBurstSpawned && s.finaleT > 300) {
            const cx = s.x,
              cy = s.y - 14;
            // Tier-aware burst count: high=48, mid=24, low=12.
            const _t = tierRef.current;
            const burstN = _t === 'low' ? 12 : _t === 'mid' ? 24 : 48;
            for (let i = 0; i < burstN; i++)
              pushSpark(cx + rng(-1, 1), cy + rng(-1, 1), i % 2 ? '#ffffff' : '#7dd3fc', 'burst');
            s.finaleBurstSpawned = true;
            // Dot flare rings
            for (const d of s.dots)
              if (d.alive) {
                pushRing(d.x, d.y, 26, '#ffffff', 1.4);
                pushRing(d.x, d.y, 46, d.col, 1);
              }
          }
          s.displayText = 'COMPL';
        }
        // Stage 2: Flash lockdown (1400 .. 2100)
        else if (s.finaleT < T_STAGES[1]) {
          s.finaleStage = 2;
          const t = (s.finaleT - T_STAGES[0]) / (T_STAGES[1] - T_STAGES[0]);
          // Flash peaks at t=0.2, fades by t=0.7
          s.flashAlpha = t < 0.2 ? (t / 0.2) * 0.85 : t < 0.7 ? 0.85 * (1 - (t - 0.2) / 0.5) : 0;
          s.displayText = 'SECURE';
        }
        // Stage 3: DONE holo (2100 .. 3400)
        else if (s.finaleT < T_STAGES[2]) {
          s.finaleStage = 3;
          s.flashAlpha = 0;
          const t = (s.finaleT - T_STAGES[1]) / (T_STAGES[2] - T_STAGES[1]);
          // scale-in 0..0.14, hold, fade after 0.77
          let target: number;
          if (t < 0.14) target = easeInOutCubic(t / 0.14) * 1.05;
          else if (t < 0.77) target = 1;
          else target = 1 - (t - 0.77) / 0.23;
          s.showHoloDone = clamp(target, 0, 1.05);
          s.displayText = 'DONE';
        }
        // Stage 4: Backflip (3400 .. 4400)
        else if (s.finaleT < T_STAGES[3]) {
          s.finaleStage = 4;
          s.showHoloDone = 0;
          const t = (s.finaleT - T_STAGES[2]) / (T_STAGES[3] - T_STAGES[2]);
          s.finaleSpin = -t * Math.PI * 2;
          s.finaleLift = Math.sin(t * Math.PI) * 14;
          // particle trail every ~50ms
          if (Math.random() < 0.35)
            pushSpark(s.x + rng(-4, 4), s.y - 8 + rng(-4, 4), '#7dd3fc', 'soft');
          s.displayText = ':)';
        }
        // Stage 5: Settle (4400 .. 5000)
        else if (s.finaleT < T_STAGES[4]) {
          s.finaleStage = 5;
          s.finaleSpin = 0;
          s.finaleLift = 0;
          s.tx = photoX + photoW * 0.5;
          s.ty = photoY + photoH * 0.78;
          s.displayText = 'ONLINE';
        }
        // HOLD stage 5 if real progress hasn't reached 99 yet — prevents the
        // "robot done but bar still loading" complaint. Bot stays ACTIVELY busy:
        //   - waves arm every 1.6s
        //   - drifts head between captured dots looking around
        //   - rotates "FINAL", "POLISH", "PROCESS" displayText every 1.2s
        //   - emits sparks toward chest core every ~250ms (data-ingest loop)
        else if (progress < 99) {
          s.finaleStage = 5;
          s.finaleSpin = 0;
          s.finaleLift = 0;
          // Wander the rest position with sin/cos lissajous so it looks alive.
          s.tx = photoX + photoW * 0.5 + Math.sin(now * 0.001) * 14;
          s.ty = photoY + photoH * 0.74 + Math.cos(now * 0.0013) * 6;
          // Display text cycle.
          const phase = Math.floor((now / 1200) % 3);
          s.displayText = phase === 0 ? 'FINAL' : phase === 1 ? 'POLISH' : 'PROCESS';
          // Periodic celebratory wave while we wait.
          if (Math.sin(now * 0.0039) > 0.97) s.armWave = 1;
          // Look at a random captured dot — head naturally tracks via headRot
          // because we set focusX/Y here.
          const aliveDots = s.dots.filter((d: any) => d.alive);
          if (aliveDots.length) {
            const lookIdx = Math.floor((now / 800) % aliveDots.length);
            s.focusX = aliveDots[lookIdx].x;
            s.focusY = aliveDots[lookIdx].y;
            s.focusCol = aliveDots[lookIdx].col;
          }
          // Data-ingest sparks: fly from each captured dot toward the chest core.
          if (Math.random() < 0.18 && aliveDots.length) {
            const d = aliveDots[Math.floor(Math.random() * aliveDots.length)];
            pushSpark(d.x, d.y, d.col, 'data');
          }
        } else {
          s.celebrate = true;
          s.phase = 'idle';
          s.phaseT = 0;
          s.finaleStage = 0;
          s.finaleSpin = 0;
          s.finaleLift = 0;
          s.flashAlpha = 0;
          s.showHoloDone = 0;
          s.displayText = 'ONLINE';
          if (!animDoneFired.current) {
            animDoneFired.current = true;
            onAnimCompleteRef.current?.();
          }
        }
      }

      // Motion springs
      const hovering =
        s.phase === 'scanning' ||
        s.phase === 'analyzing' ||
        s.phase === 'wireframe' ||
        s.phase === 'summary' ||
        (s.phase === 'finale' && s.finaleStage >= 1 && s.finaleStage <= 3);
      const levitateY = hovering ? -8 : 0;
      if (s.recoilImpulse > 0.05) {
        const dx = s.x - s.focusX,
          dy = s.y - s.focusY;
        const l = Math.hypot(dx, dy) || 1;
        s.vx += (dx / l) * 0.25 * s.recoilImpulse;
        s.vy += (dy / l) * 0.15 * s.recoilImpulse;
      }
      // Continuously lerp tx/ty toward landmarkTx/Y so the spring sees a
      // smooth target instead of a stepped one. Tier-gated rate:
      //   - high: slower lerp (0.18) + CR midpoint bias for curved paths
      //   - mid/low: faster direct lerp (0.24/0.32) for snappier feel
      // Only applied during idle/moving — wireframe/summary/finale phases set
      // tx/ty directly and must remain authoritative.
      if (
        s.phase === 'idle' ||
        s.phase === 'moving' ||
        s.phase === 'scanning' ||
        s.phase === 'analyzing'
      ) {
        const tier = tierRef.current;
        // Dynamic speed-by-progress: when speedMult > 1 (robot lagging the
        // progress bar) we scale the lerp so the bot visibly RACES across
        // the canvas to catch up. Capped so it never teleports.
        const baseLerp = tier === 'high' ? 0.18 : tier === 'mid' ? 0.24 : 0.32;
        const lerpRate = clamp(baseLerp * (0.6 + s.speedMult * 0.5), baseLerp, baseLerp * 3.5);
        let targetX = s.landmarkTx,
          targetY = s.landmarkTy;
        if (s.useMid && s.phase === 'moving' && s.moveDist > 0) {
          const remaining = Math.hypot(s.landmarkTx - s.x, s.landmarkTy - s.y);
          // Use mid waypoint while still > 50% from goal; switch closer in.
          if (remaining > s.moveDist * 0.5) {
            targetX = s.midTx;
            targetY = s.midTy;
          }
        }
        s.tx += (targetX - s.tx) * lerpRate;
        s.ty += (targetY - s.ty) * lerpRate;
      }
      const txFinal = s.tx;
      const tyFinal = s.ty + levitateY + (s.levitate > 0.3 ? Math.sin(now * 0.004) * 1.4 : 0);
      {
        const r = spring(s.x, s.vx, txFinal, 0.05, 0.82);
        s.x = r.v;
        s.vx = r.vel;
      }
      {
        const r = spring(s.y, s.vy, tyFinal, 0.05, 0.82);
        s.y = r.v;
        s.vy = r.vel;
      }
      s.speed = clamp(Math.hypot(s.vx, s.vy) * 0.6, 0, 1);

      // Subtle scale-down during scan (concentration) — both raised in lockstep
      // with the new base scale of 1.0 (was 0.7).
      s.tScale = s.phase === 'scanning' ? 0.95 : 1.0;
      {
        const r = spring(s.scale, s.vScale, s.tScale, 0.08, 0.78);
        s.scale = r.v;
        s.vScale = r.vel;
      }

      s.tLevitate = hovering ? 1 : 0;
      {
        const r = spring(s.levitate, s.vLevitate, s.tLevitate, 0.07, 0.8);
        s.levitate = r.v;
        s.vLevitate = r.vel;
      }

      const hy = s.y - 34;
      const hx = s.x + s.facing * 2;
      s.tHeadRot = Math.atan2(s.focusY - hy, s.focusX - hx);
      {
        const r = spring(s.headRot, s.vHeadRot, s.tHeadRot, 0.12, 0.72);
        s.headRot = r.v;
        s.vHeadRot = r.vel;
      }
      {
        const r = spring(s.eyeX, s.vEyeX, Math.cos(s.headRot) * 1.6, 0.08, 0.78);
        s.eyeX = r.v;
        s.vEyeX = r.vel;
      }
      {
        const r = spring(s.eyeY, s.vEyeY, Math.sin(s.headRot) * 1.2, 0.08, 0.78);
        s.eyeY = r.v;
        s.vEyeY = r.vel;
      }

      s.tArmExtend = s.primaryBeamOn ? 1 : s.phase === 'wireframe' ? 1 : 0;
      {
        const r = spring(s.armExtend, s.vArmExtend, s.tArmExtend, 0.12, 0.75);
        s.armExtend = r.v;
        s.vArmExtend = r.vel;
      }

      const tAtt =
        s.subPhase === 'primaryBeam' || s.subPhase === 'crossCheck' || s.phase === 'wireframe'
          ? 1
          : s.subPhase === 'readout'
            ? 0.6
            : 0;
      {
        const r = spring(s.attention, s.vAttention, tAtt, 0.08, 0.8);
        s.attention = r.v;
        s.vAttention = r.vel;
      }

      const tPara = (s.focusX - width * 0.5) * 0.02;
      {
        const r = spring(s.paraX, s.vParaX, tPara, 0.04, 0.88);
        s.paraX = r.v;
        s.vParaX = r.vel;
      }

      s.tBrowTilt =
        s.phase === 'scanning'
          ? -0.22
          : s.phase === 'moving'
            ? 0.14
            : s.celebrate
              ? 0.25
              : s.fidget === 'glance'
                ? 0.1
                : 0;
      s.tEyeWide =
        s.phase === 'scanning'
          ? -0.3
          : s.phase === 'moving'
            ? 0.25
            : s.startleImpulse > 0.3
              ? 0.8
              : s.nodImpulse > 0.5
                ? 0.6
                : s.celebrate
                  ? -0.15
                  : 0;
      s.tMouthCurve = s.celebrate
        ? 0.45
        : s.phase === 'scanning'
          ? -0.1
          : s.fidget === 'glance'
            ? 0.3
            : 0;
      {
        const r = spring(s.browTilt, s.vBrowTilt, s.tBrowTilt, 0.12, 0.75);
        s.browTilt = r.v;
        s.vBrowTilt = r.vel;
      }
      {
        const r = spring(s.eyeWide, s.vEyeWide, s.tEyeWide, 0.12, 0.7);
        s.eyeWide = r.v;
        s.vEyeWide = r.vel;
      }
      {
        const r = spring(s.mouthCurve, s.vMouthCurve, s.tMouthCurve, 0.1, 0.78);
        s.mouthCurve = r.v;
        s.vMouthCurve = r.vel;
      }

      // Walk cycle stride: clamp to [0.5, 2.0] strides/sec equivalent so a
      // velocity spike (post-throttle catch-up, recoil impulses) can't crank
      // the legs into a glitchy fast-cycle. Time-based: cycles depend on dt.
      const strideRate = clamp(0.4 + s.speed * 1.4, 0.5, 2.0);
      s.gait += dt * 0.012 * strideRate * (1 - s.levitate * 0.7);

      s.blinkTimer += dt;
      if (s.blinkTimer > 3200 + Math.random() * 2400) {
        s.blink = 1;
        s.blinkTimer = 0;
      }
      s.blink *= 0.82;

      // v3.1: rolling phase counters for new visible animations.
      s.thinkPhase = (s.thinkPhase + dt * 0.004) % (Math.PI * 2);
      s.auraPulse = (s.auraPulse + dt * 0.003) % (Math.PI * 2);

      // Motion trail: sample current position into 10-slot ring buffer.
      // Each slot stores (x, y, time-of-sample). drawMotionTrail uses age for fade.
      const TRAIL_SLOTS = 10;
      // Sample at most every ~30ms so the trail spans ~300ms of motion.
      const lastTrailIdx = (s.trailHead - 1 + TRAIL_SLOTS) % TRAIL_SLOTS;
      const lastSampleT = s.trail[lastTrailIdx * 3 + 2];
      if (now - lastSampleT > 30) {
        s.trail[s.trailHead * 3] = s.x;
        s.trail[s.trailHead * 3 + 1] = s.y;
        s.trail[s.trailHead * 3 + 2] = now;
        s.trailHead = (s.trailHead + 1) % TRAIL_SLOTS;
      }

      const antTX = s.x + s.facing * 0.5,
        antTY = s.y - 56 - s.levitate * 4;
      s.antVx += (antTX - s.antX) * 0.05;
      s.antVx *= 0.82;
      s.antVy += (antTY - s.antY) * 0.05;
      s.antVy *= 0.82;
      s.antX += s.antVx;
      s.antY += s.antVy;
      const antTX2 = s.x + s.facing * 4,
        antTY2 = s.y - 50 - s.levitate * 4;
      s.antVx2 += (antTX2 - s.antX2) * 0.06;
      s.antVx2 *= 0.82;
      s.antVy2 += (antTY2 - s.antY2) * 0.06;
      s.antVy2 *= 0.82;
      s.antX2 += s.antVx2;
      s.antY2 += s.antVy2;

      if (s.fidget && s.phase === 'idle') {
        const maxMs = 900;
        s.fidgetValue = clamp(s.fidgetT / maxMs, 0, 1);
        if (s.fidgetT > maxMs) {
          s.fidget = null;
          s.fidgetT = 0;
          s.fidgetValue = 0;
        }
      } else {
        s.fidget = null;
      }

      const hbPhase = (now * 0.004) % (Math.PI * 2);
      const pulse =
        Math.max(0, Math.sin(hbPhase * 3)) * 0.9 + Math.sin(hbPhase) * 0.2 + s.attention * 0.4;
      s.hudWave[s.hudWaveHead] = pulse;
      s.hudWaveHead = (s.hudWaveHead + 1) % s.hudWave.length;

      for (const r of s.rings)
        if (r.alive) {
          r.r += (r.maxR - r.r) * 0.12;
          r.a *= 0.935;
          if (r.a < 0.02) r.alive = false;
        }
      for (const sp of s.sparks)
        if (sp.alive) {
          sp.x += sp.vx;
          sp.y += sp.vy;
          if (sp.kind === 'data') {
            sp.vy += -0.02;
            sp.vx *= 0.98;
          } else if (sp.kind === 'burst') {
            sp.vx *= 0.97;
            sp.vy *= 0.97;
            sp.vy += 0.02;
          } else {
            sp.vy += 0.04;
            sp.vx *= 0.95;
          }
          sp.life -= sp.kind === 'data' ? 0.025 : sp.kind === 'burst' ? 0.018 : 0.05;
          if (sp.life <= 0) sp.alive = false;
        }

      const shoulderY = s.y - 26;
      const shoulderX = s.x + s.facing * 6;
      const baseLen = 14;
      const extLen = 18 * s.armExtend;
      const reachAng = Math.atan2(s.focusY - shoulderY, s.focusX - shoulderX);
      s.handX = shoulderX + Math.cos(reachAng) * (baseLen + extLen);
      s.handY = shoulderY + Math.sin(reachAng) * (baseLen + extLen);
      const crossShX = s.x - s.facing * 6,
        crossShY = s.y - 26;
      const crossAng = Math.atan2(s.crossTargetY - crossShY, s.crossTargetX - crossShX);
      const crossExt = s.crossBeamOn ? 1 : 0;
      s.crossHandX = crossShX + Math.cos(crossAng) * (baseLen + 18 * crossExt);
      s.crossHandY = crossShY + Math.sin(crossAng) * (baseLen + 18 * crossExt);

      // RENDER
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createLinearGradient(0, 0, 0, height);
      if (isDarkMode) {
        bg.addColorStop(0, '#070712');
        bg.addColorStop(1, '#02020a');
      } else {
        bg.addColorStop(0, '#f4f5f8');
        bg.addColorStop(1, '#e7e8ee');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      drawPhoto(ctx, imgRef.current, photoX, photoY, photoW, photoH, isDarkMode, s.paraX);
      drawGrid(ctx, s, photoX, photoY, photoW, photoH, isDarkMode);
      drawDistortion(ctx, s, photoX, photoY, photoW, photoH);
      drawFaceRing(
        ctx,
        s,
        photoX,
        photoY,
        photoW,
        photoH,
        landmarksRef.current,
        imgRef.current,
        now
      );
      // v3.1: pulsing scan aura BEHIND the robot during scanning/wireframe.
      if (s.phase === 'scanning' || s.phase === 'wireframe' || s.phase === 'analyzing') {
        drawScanAura(ctx, s, now);
      }
      // v3.2: motion-trail afterimages BEHIND the robot. Lower threshold
      // so it's visible during normal movement, not just dashes.
      if (s.speed > 0.05 && tierRef.current !== 'low') {
        drawMotionTrail(ctx, s, now, TRAIL_SLOTS);
      }
      // v3.2: orbiting scanner satellites — 3 small drone-orbs circling the
      // robot's head, each pulsing on a different phase. Always visible during
      // active phases; very visible new motion element.
      if (s.phase !== 'idle' || s.celebrate) {
        drawOrbitalSatellites(ctx, s, now);
      }
      if (s.levitate > 0.1) drawThrusterWash(ctx, s, now);
      drawRobot(ctx, s, now, isDarkMode);
      // Holo accessories only during active scan phases
      if (
        s.phase === 'scanning' ||
        s.phase === 'analyzing' ||
        s.phase === 'wireframe' ||
        s.phase === 'summary'
      ) {
        drawHoloAccessories(ctx, s, now);
      }
      if (s.attention > 0.05 && s.primaryBeamOn)
        drawBeam(ctx, s.handX, s.handY, s.focusX, s.focusY, s.focusCol, s.attention, now, 1.0);
      if (s.crossBeamOn && s.attention > 0.2)
        drawBeam(
          ctx,
          s.crossHandX,
          s.crossHandY,
          s.crossTargetX,
          s.crossTargetY,
          '#ffffff',
          s.attention * 0.7,
          now,
          0.55
        );
      drawDots(ctx, s, now);
      drawWireframes(ctx, s, now);
      drawGlowPass(ctx, s, now);
      // v3.1: thinking-dots speech bubble. Now also shown during the finale
      // wait stage so the user always knows the bot is "still thinking".
      const inFinaleWait = s.phase === 'finale' && s.finaleStage === 5 && progress < 99;
      if (
        s.phase === 'analyzing' ||
        s.phase === 'wireframe' ||
        s.phase === 'summary' ||
        inFinaleWait
      ) {
        drawThinkingBubble(ctx, s, now);
      }
      if (s.showHoloDone > 0.01) drawDoneHolo(ctx, s, now);
      if (s.flashAlpha > 0.001) drawFlashOverlay(ctx, width, height, s.flashAlpha);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [width, height]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}

// RENDER HELPERS below
// ---

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  isDarkMode: boolean,
  paraX: number
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  rr(ctx, x, y, w, h, 20);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();
  if (img) {
    ctx.save();
    rr(ctx, x, y, w, h, 20);
    ctx.clip();
    const ir = img.width / img.height,
      pr = w / h;
    let dw = w,
      dh = h,
      dx = x + paraX,
      dy = y;
    if (ir > pr) {
      dw = h * ir;
      dx = x - (dw - w) / 2 + paraX;
    } else {
      dh = w / ir;
      dy = y - (dh - h) / 2;
    }
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }
  ctx.strokeStyle = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  rr(ctx, x, y, w, h, 20);
  ctx.stroke();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  s: any,
  px: number,
  py: number,
  pw: number,
  ph: number,
  isDarkMode: boolean
) {
  const g = s.grid;
  if (!g) return;
  const step = g.step;
  const rx = s.x,
    ry = s.y;
  const baseA = isDarkMode ? 0.07 : 0.09;
  const hotA = isDarkMode ? 0.28 : 0.3;
  const col = isDarkMode ? '#7dd3fc' : '#0ea5e9';
  ctx.save();
  rr(ctx, px, py, pw, ph, 20);
  ctx.clip();
  ctx.lineWidth = 0.7;
  for (let i = 0; i < g.cols; i++) {
    const gx = px + i * step;
    const my = py + ph * 0.5;
    const dx = gx - rx,
      dy = my - ry;
    const dist = Math.hypot(dx, dy);
    const warp = clamp(60 / (dist * 0.6 + 30), 0, 2.2) * Math.sign(dx || 1) * 0.9;
    const a = baseA + clamp(1 - dist / 140, 0, 1) * (hotA - baseA) * (0.5 + s.energy * 0.5);
    ctx.strokeStyle = hexA(col, a);
    ctx.beginPath();
    ctx.moveTo(gx + warp * 0.3, py);
    ctx.quadraticCurveTo(gx + warp, py + ph * 0.5, gx + warp * 0.3, py + ph);
    ctx.stroke();
  }
  for (let j = 0; j < g.rows; j++) {
    const gy = py + j * step;
    const mx = px + pw * 0.5;
    const dx = mx - rx,
      dy = gy - ry;
    const dist = Math.hypot(dx, dy);
    const warp = clamp(60 / (dist * 0.6 + 30), 0, 2.2) * Math.sign(dy || 1) * 0.9;
    const a = baseA + clamp(1 - dist / 140, 0, 1) * (hotA - baseA) * (0.5 + s.energy * 0.5);
    ctx.strokeStyle = hexA(col, a);
    ctx.beginPath();
    ctx.moveTo(px, gy + warp * 0.3);
    ctx.quadraticCurveTo(px + pw * 0.5, gy + warp, px + pw, gy + warp * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDistortion(
  ctx: CanvasRenderingContext2D,
  s: any,
  px: number,
  py: number,
  pw: number,
  ph: number
) {
  ctx.save();
  rr(ctx, px, py, pw, ph, 20);
  ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  const r = 120;
  const gr = ctx.createRadialGradient(s.x, s.y - 20, 0, s.x, s.y - 20, r);
  gr.addColorStop(0, hexA(s.focusCol, 0.1 * (0.5 + s.energy * 0.5)));
  gr.addColorStop(1, 'transparent');
  ctx.fillStyle = gr;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
}

function drawFaceRing(
  ctx: CanvasRenderingContext2D,
  s: any,
  px: number,
  py: number,
  pw: number,
  ph: number,
  landmarks: Array<{ x: number; y: number }> | null | undefined,
  img: HTMLImageElement | null,
  now: number
) {
  if (!landmarks || landmarks.length < 400) return;
  let lx = px,
    ly = py,
    lw = pw,
    lh = ph;
  if (img) {
    const cf = coverFitRect(px, py, pw, ph, img.width, img.height);
    lx = cf.dx;
    ly = cf.dy;
    lw = cf.dw;
    lh = cf.dh;
  }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; i < FACE_OVAL.length; i++) {
    const lm = landmarks[FACE_OVAL[i]];
    if (!lm) return;
    const x = lx + lm.x * lw,
      y = ly + lm.y * lh;
    _ovalX[i] = x;
    _ovalY[i] = y;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const cx = (minX + maxX) * 0.5,
    cy = (minY + maxY) * 0.5;
  const breath = 1 + Math.sin(now * 0.0015) * 0.008;
  const n = FACE_OVAL.length;
  const buildPath = () => {
    ctx.beginPath();
    const p0x = cx + (_ovalX[0] - cx) * breath,
      p0y = cy + (_ovalY[0] - cy) * breath;
    const p1x = cx + (_ovalX[1] - cx) * breath,
      p1y = cy + (_ovalY[1] - cy) * breath;
    ctx.moveTo((p0x + p1x) * 0.5, (p0y + p1y) * 0.5);
    for (let i = 1; i <= n; i++) {
      const curX = cx + (_ovalX[i % n] - cx) * breath,
        curY = cy + (_ovalY[i % n] - cy) * breath;
      const nxtX = cx + (_ovalX[(i + 1) % n] - cx) * breath,
        nxtY = cy + (_ovalY[(i + 1) % n] - cy) * breath;
      ctx.quadraticCurveTo(curX, curY, (curX + nxtX) * 0.5, (curY + nxtY) * 0.5);
    }
    ctx.closePath();
  };
  const col = '#7dd3fc',
    glow = '#38bdf8';
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = hexA(glow, 0.18 + s.energy * 0.12);
  ctx.lineWidth = 3.2;
  ctx.setLineDash([]);
  buildPath();
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = hexA(col, 0.9);
  ctx.lineWidth = 1.1;
  ctx.setLineDash([2.2, 4]);
  ctx.lineDashOffset = -(now * 0.02) % 6.2;
  buildPath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = hexA(col, 0.85);
  ctx.lineWidth = 1.3;
  const pad = 6;
  const bLx = minX - pad,
    bRx = maxX + pad,
    bTy = minY - pad,
    bBy = maxY + pad;
  const k = 10;
  ctx.beginPath();
  ctx.moveTo(bLx + k, bTy);
  ctx.lineTo(bLx, bTy);
  ctx.lineTo(bLx, bTy + k);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bRx - k, bTy);
  ctx.lineTo(bRx, bTy);
  ctx.lineTo(bRx, bTy + k);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bLx + k, bBy);
  ctx.lineTo(bLx, bBy);
  ctx.lineTo(bLx, bBy - k);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bRx - k, bBy);
  ctx.lineTo(bRx, bBy);
  ctx.lineTo(bRx, bBy - k);
  ctx.stroke();
  ctx.restore();
}

function drawThrusterWash(ctx: CanvasRenderingContext2D, s: any, now: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const r = 40 * s.levitate;
  const gr = ctx.createRadialGradient(s.x, s.y + 14, 0, s.x, s.y + 14, r);
  const flick = 0.8 + Math.sin(now * 0.04) * 0.2;
  gr.addColorStop(0, hexA('#22d3ee', 0.35 * s.levitate * flick));
  gr.addColorStop(1, 'transparent');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(s.x, s.y + 14, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRobot(ctx: CanvasRenderingContext2D, s: any, now: number, isDarkMode: boolean) {
  const accent = s.focusCol;
  const bx = s.x + (s.shakeImpulse > 0.1 ? rng(-0.5, 0.5) : 0);
  const by = s.y + (s.shakeImpulse > 0.1 ? rng(-0.5, 0.5) : 0);
  const face = s.facing;
  const moving = s.phase === 'moving' && s.speed > 0.08;
  const levitate = s.levitate;
  const bob = moving ? Math.abs(Math.sin(s.gait)) * 2.2 : Math.sin(now * 0.003) * 0.6;
  const scale = s.scale;

  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${0.38 * (1 - levitate * 0.8)})`;
  const shW = (22 - bob * 0.6) * (1 - levitate * 0.3);
  ctx.beginPath();
  ctx.ellipse(bx, by + 4 + levitate * 6, shW, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const nodY = -s.nodImpulse * 2.5 + s.startleImpulse * -2;

  ctx.save();
  ctx.translate(bx, by + bob - s.finaleLift);
  ctx.scale(scale, scale);
  // Finale backflip rotation (applied around body center so arms/head stay attached).
  if (s.finaleSpin !== 0) ctx.rotate(s.finaleSpin);
  if (levitate < 0.95 && s.finaleStage !== 4) drawLegs(ctx, s, face, moving, levitate);
  if (levitate > 0.08 || s.finaleStage === 4) drawThrusterRing(ctx, s, now);
  const hipY = -22;
  drawTorso(ctx, s, 0, hipY, face, now, accent);
  drawArm(ctx, s, 0, hipY - 4, -1, now, accent, face === -1);
  drawArm(ctx, s, 0, hipY - 4, 1, now, accent, face === 1);
  drawHead(ctx, s, 0, hipY - 20 + nodY, face, now, accent, isDarkMode);
  ctx.restore();
}

function drawThrusterRing(ctx: CanvasRenderingContext2D, s: any, now: number) {
  const lev = s.levitate;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const ringR = 10,
    rot = now * 0.004;
  for (let i = 0; i < 6; i++) {
    const a = rot + (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * ringR,
      y = -18 + Math.sin(a) * 3.5;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, 4.5);
    gr.addColorStop(0, hexA('#22d3ee', 0.85 * lev));
    gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const cg = ctx.createRadialGradient(0, -14, 0, 0, -14, 14);
  cg.addColorStop(0, hexA('#38bdf8', 0.4 * lev));
  cg.addColorStop(1, 'transparent');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, -14, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLegs(
  ctx: CanvasRenderingContext2D,
  s: any,
  face: number,
  moving: boolean,
  levitate: number
) {
  const UL = 12,
    LL = 13,
    hipY = -20,
    tuck = levitate;
  for (const dir of [-1, 1] as const) {
    const hx = dir * 5,
      hy = hipY;
    const ph = s.gait + (dir > 0 ? Math.PI : 0);
    const stride = moving ? 9 : 0;
    const lift = moving ? Math.max(0, -Math.cos(ph)) * 7 : 0;
    const footXraw = hx + Math.sin(ph) * stride;
    const footYraw = -lift;
    const footX = footXraw * (1 - tuck) + dir * 2 * tuck;
    const footY = footYraw * (1 - tuck) + -10 * tuck;
    const knee = ik2(hx, hy, footX, footY, UL, LL, face);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(hx, hy, 3, 0, Math.PI * 2);
    ctx.fill();
    drawMechLimb(ctx, hx, hy, knee.x, knee.y, 6, s.focusCol);
    drawMechLimb(ctx, knee.x, knee.y, footX, footY, 5.4, s.focusCol);
    ctx.save();
    ctx.translate(knee.x, knee.y);
    ctx.rotate(Math.atan2(footY - knee.y, footX - knee.x) + Math.PI / 2);
    ctx.fillStyle = '#0f172a';
    rr(ctx, -3, -3, 6, 6, 1.5);
    ctx.fill();
    ctx.fillStyle = hexA(s.focusCol, 0.85);
    ctx.beginPath();
    ctx.arc(0, 0, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (tuck < 0.9) {
      ctx.save();
      ctx.globalAlpha = 1 - tuck * 0.8;
      ctx.translate(footX, footY);
      ctx.rotate(lift > 1 ? face * 0.22 : 0);
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(9 * face, -1);
      ctx.lineTo(10 * face, 2.2);
      ctx.lineTo(-5, 2.5);
      ctx.closePath();
      ctx.fill();
      const bootGr = ctx.createLinearGradient(0, -4, 0, 0);
      bootGr.addColorStop(0, '#64748b');
      bootGr.addColorStop(1, '#1e293b');
      ctx.fillStyle = bootGr;
      rr(ctx, -4.5, -4, 12, 4, 1.5);
      ctx.fill();
      ctx.fillStyle = hexA(s.focusCol, 0.8);
      ctx.fillRect(-3.5, -0.8, 10, 0.9);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-3 + i * 3, 0.5);
        ctx.lineTo(-3 + i * 3 + 1.5, 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

function drawMechLimb(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  thickness: number,
  accent: string
) {
  const ang = Math.atan2(by - ay, bx - ax);
  const len = Math.hypot(bx - ax, by - ay);
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(ang);
  ctx.fillStyle = '#020617';
  rr(ctx, 0, -thickness / 2 - 0.5, len, thickness + 1, thickness / 2);
  ctx.fill();
  const gr = ctx.createLinearGradient(0, -thickness / 2, 0, thickness / 2);
  gr.addColorStop(0, '#f1f5f9');
  gr.addColorStop(0.5, '#94a3b8');
  gr.addColorStop(1, '#475569');
  ctx.fillStyle = gr;
  rr(ctx, 0.5, -thickness / 2, len - 1, thickness, thickness / 2 - 0.5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(15,23,42,0.4)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(1, 0);
  ctx.lineTo(len - 1, 0);
  ctx.stroke();
  ctx.fillStyle = hexA(accent, 0.75);
  ctx.fillRect(len * 0.28, -thickness / 2 + 0.8, len * 0.42, 0.7);
  ctx.restore();
}

function drawTorso(
  ctx: CanvasRenderingContext2D,
  s: any,
  cx: number,
  cy: number,
  face: number,
  now: number,
  accent: string
) {
  ctx.save();
  ctx.translate(cx, cy - 1);
  // Body lean: scaled up (was 0.05 — barely visible) and weighted by armWave
  // so leaping bot tilts ~12° forward into the arc, then unwinds on landing.
  if (s.speed > 0.05) ctx.rotate(face * (s.speed * 0.18 + s.armWave * 0.12));

  // Torso outline (premium: slightly larger for more HUD room)
  ctx.fillStyle = '#020617';
  rr(ctx, -13, -17, 26, 24, 6.5);
  ctx.fill();
  // Chrome 4-stop gradient (premium material polish)
  const tg = ctx.createLinearGradient(0, -17, 0, 7);
  tg.addColorStop(0, '#f8fafc');
  tg.addColorStop(0.35, '#c7cdd7');
  tg.addColorStop(0.65, '#5e6775');
  tg.addColorStop(1, '#20242d');
  ctx.fillStyle = tg;
  rr(ctx, -12, -16, 24, 22, 5.5);
  ctx.fill();
  // Central edge seam (vertical hairline)
  ctx.strokeStyle = 'rgba(8,12,20,0.35)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(0, 5);
  ctx.stroke();
  // Titanium trim horizontal line across upper chest
  ctx.strokeStyle = hexA('#d4af37', 0.7);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-11, -11.5);
  ctx.lineTo(11, -11.5);
  ctx.stroke();
  // Dark HUD inset
  ctx.fillStyle = '#020617';
  rr(ctx, -8, -14, 16, 17, 3);
  ctx.fill();

  // rotating tick-ring
  ctx.save();
  ctx.translate(0, -5);
  ctx.rotate(now * 0.002);
  ctx.strokeStyle = hexA(accent, 0.55);
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 6.2, Math.sin(a) * 6.2);
    ctx.lineTo(Math.cos(a) * 7.2, Math.sin(a) * 7.2);
    ctx.stroke();
  }
  ctx.restore();

  // core glow
  const pulse = 0.55 + s.energy * 0.4 + s.attention * 0.2;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cg = ctx.createRadialGradient(0, -5, 0, 0, -5, 10);
  cg.addColorStop(0, hexA(accent, pulse));
  cg.addColorStop(1, 'transparent');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, -5, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, -5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(0, -5, 1.3, 0, Math.PI * 2);
  ctx.fill();

  // HUD row 1: state text
  ctx.save();
  ctx.beginPath();
  rr(ctx, -7.5, -13.5, 15, 3.2, 0.8);
  ctx.clip();
  ctx.fillStyle = '#050910';
  ctx.fillRect(-7.5, -13.5, 15, 3.2);
  ctx.font = '600 3.4px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const flicker = 0.85 + Math.sin(now * 0.08) * 0.15;
  ctx.fillStyle = hexA(accent, flicker);
  ctx.fillText(String(s.displayText || '').slice(0, 6), 0, -11.9);
  ctx.restore();

  // HUD row 2: heartbeat waveform
  ctx.save();
  ctx.beginPath();
  rr(ctx, -7.5, -9.8, 15, 3.4, 0.6);
  ctx.clip();
  ctx.fillStyle = '#050910';
  ctx.fillRect(-7.5, -9.8, 15, 3.4);
  ctx.strokeStyle = hexA(accent, 0.9);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  const wave: Float32Array = s.hudWave;
  const head: number = s.hudWaveHead;
  for (let i = 0; i < wave.length; i++) {
    const idx = (head + i) % wave.length;
    const x = -7 + (i / (wave.length - 1)) * 14;
    const y = -8.1 - wave[idx] * 1.2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  // HUD row 3: bars
  ctx.save();
  ctx.beginPath();
  rr(ctx, -7.5, -6.0, 15, 2.0, 0.5);
  ctx.clip();
  ctx.fillStyle = '#050910';
  ctx.fillRect(-7.5, -6.0, 15, 2.0);
  const barVals = [s.attention, s.energy, clamp(s.paceScale / 3, 0, 1)];
  for (let i = 0; i < 3; i++) {
    const x0 = -7 + i * 5;
    ctx.fillStyle = hexA(accent, 0.85);
    ctx.fillRect(x0, -5.6, 4 * barVals[i], 1.1);
    ctx.strokeStyle = hexA(accent, 0.3);
    ctx.lineWidth = 0.3;
    ctx.strokeRect(x0, -5.6, 4, 1.1);
  }
  ctx.restore();

  // Pauldrons (curved shoulder armor — premium structural)
  for (const dir of [-1, 1] as const) {
    ctx.save();
    ctx.translate(dir * 11, -13);
    // underplate
    ctx.fillStyle = '#0b1220';
    ctx.beginPath();
    ctx.moveTo(-3.5, 1.5);
    ctx.lineTo(-3.5, -2.5);
    ctx.quadraticCurveTo(-3.5, -4.5, 0, -4.5);
    ctx.quadraticCurveTo(3.5, -4.5, 3.5, -2.5);
    ctx.lineTo(3.5, 1.5);
    ctx.closePath();
    ctx.fill();
    // chrome armor overplate
    const pg = ctx.createLinearGradient(0, -4, 0, 1);
    pg.addColorStop(0, '#f1f5f9');
    pg.addColorStop(0.55, '#8b93a1');
    pg.addColorStop(1, '#334155');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(-2.8, 0.8);
    ctx.lineTo(-2.8, -2.2);
    ctx.quadraticCurveTo(-2.8, -3.9, 0, -3.9);
    ctx.quadraticCurveTo(2.8, -3.9, 2.8, -2.2);
    ctx.lineTo(2.8, 0.8);
    ctx.closePath();
    ctx.fill();
    // titanium trim edge
    ctx.strokeStyle = hexA('#d4af37', 0.8);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.arc(0, -2.2, 2.8, Math.PI, 0);
    ctx.stroke();
    // Accent LED
    const isBeamSide = (dir === s.facing && s.primaryBeamOn) || (dir !== s.facing && s.crossBeamOn);
    ctx.fillStyle = hexA(accent, isBeamSide ? 0.95 : 0.4);
    ctx.beginPath();
    ctx.arc(0, -2, 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Side heat vents
  for (const dir of [-1, 1] as const) {
    ctx.save();
    ctx.translate(dir * 11, -4);
    const heat = s.readoutOn ? 0.8 : 0.2;
    ctx.fillStyle = hexA('#fb923c', heat);
    for (let i = 0; i < 3; i++) ctx.fillRect(-1.2, -2 + i * 1.4, 2.4, 0.6);
    ctx.restore();
  }
  ctx.restore();
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  s: any,
  _cx: number,
  hipY: number,
  side: -1 | 1,
  _now: number,
  accent: string,
  isBeamArm: boolean
) {
  const shoulderX = side * 6,
    shoulderY = hipY;
  let handTX: number, handTY: number;
  // Finale pose overrides take priority
  if (s.finaleStage === 1) {
    // V-pose: both arms raised outward
    handTX = side * 18;
    handTY = hipY - 18;
  } else if (s.finaleStage === 2 || s.finaleStage === 3) {
    // Salute: dominant-facing arm to temple, other at side
    if (side === s.facing) {
      handTX = side * 5;
      handTY = hipY - 20;
    } else {
      handTX = side * 10;
      handTY = hipY + 6;
    }
  } else if (s.armWave > 0.05 && !isBeamArm && side === s.facing) {
    // Forward-thrust leap-arm OR celebratory wave on scan complete.
    // Anim: arm punches forward + slightly up, scaled by wave intensity.
    const w = s.armWave;
    handTX = side * (10 + w * 18);
    handTY = hipY - 10 - w * 10 + Math.sin(_now * 0.02) * 2 * w;
  } else if (!isBeamArm && s.fidget === 'stretch' && side === -s.facing) {
    const v = s.fidgetValue;
    const raised = Math.sin(v * Math.PI) * 20;
    handTX = -s.facing * 14;
    handTY = hipY - 4 - raised;
  } else if (!isBeamArm && s.fidget === 'checkWrist' && side === -s.facing) {
    handTX = -s.facing * 4;
    handTY = hipY - 8;
  } else if (isBeamArm) {
    handTX = s.handX - s.x;
    handTY = s.handY - s.y;
  } else if (!isBeamArm && s.crossBeamOn) {
    handTX = s.crossHandX - s.x;
    handTY = s.crossHandY - s.y;
  } else {
    const swing = Math.sin(s.gait + (side > 0 ? Math.PI : 0)) * (s.speed > 0.1 ? 6 : 1.5);
    handTX = side * 11;
    handTY = hipY + 16 + swing;
  }
  const UA = 10,
    FA = 11;
  const elbow = ik2(shoulderX, shoulderY, handTX, handTY, UA, FA, -side);
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(shoulderX, shoulderY, 3, 0, Math.PI * 2);
  ctx.fill();
  drawMechLimb(ctx, shoulderX, shoulderY, elbow.x, elbow.y, 5.4, accent);
  drawMechLimb(ctx, elbow.x, elbow.y, handTX, handTY, 4.8, accent);
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(elbow.x, elbow.y, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexA(accent, 0.85);
  ctx.beginPath();
  ctx.arc(elbow.x, elbow.y, 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(handTX, handTY);
  ctx.rotate(Math.atan2(handTY - elbow.y, handTX - elbow.x));
  ctx.fillStyle = '#0f172a';
  rr(ctx, -2, -3.2, 6.5, 6.4, 1.5);
  ctx.fill();
  if (isBeamArm) {
    const spread = s.armExtend;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      const offs = (i - 1) * 0.6 * spread;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(4 + 3 * spread, offs * 2.2);
      ctx.stroke();
    }
    if (s.armExtend > 0.1) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.6 + s.energy * 0.4 + (s.primaryBeamOn ? 0.3 : 0);
      const gr = ctx.createRadialGradient(4, 0, 0, 4, 0, 7);
      gr.addColorStop(0, hexA(accent, pulse));
      gr.addColorStop(1, 'transparent');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(4, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    ctx.fillStyle = '#334155';
    rr(ctx, -1.5, -2.5, 4, 5, 1.2);
    ctx.fill();
    if (s.crossBeamOn) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(2, 0, 0, 2, 0, 5);
      gr.addColorStop(0, hexA('#ffffff', 0.8));
      gr.addColorStop(1, 'transparent');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(2, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  s: any,
  cx: number,
  cy: number,
  face: number,
  now: number,
  accent: string,
  _isDarkMode: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);
  const localYaw = clamp(Math.atan2(s.focusY - s.y, s.focusX - s.x) - Math.PI / 2, -0.6, 0.6) * 0.4;
  ctx.rotate(localYaw);

  // Neck (wider + 2 servo rings glow when blinking — premium structural)
  ctx.fillStyle = '#0b1220';
  rr(ctx, -3.5, 0, 7, 5, 1.4);
  ctx.fill();
  ctx.strokeStyle = hexA(accent, 0.3 + s.blink * 0.7);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(-3, 1.6);
  ctx.lineTo(3, 1.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3, 3.3);
  ctx.lineTo(3, 3.3);
  ctx.stroke();

  // Head shell
  ctx.fillStyle = '#020617';
  rr(ctx, -12, -14, 24, 18, 6);
  ctx.fill();
  // Chrome 4-stop gradient for head plate
  const hg = ctx.createLinearGradient(0, -14, 0, 4);
  hg.addColorStop(0, '#f8fafc');
  hg.addColorStop(0.35, '#c7cdd7');
  hg.addColorStop(0.65, '#5e6775');
  hg.addColorStop(1, '#2a2f38');
  ctx.fillStyle = hg;
  rr(ctx, -11, -13, 22, 16, 5);
  ctx.fill();

  // Crown ridge — a raised wedge centered on top of head (premium structural)
  ctx.save();
  const cg = ctx.createLinearGradient(0, -16, 0, -11);
  cg.addColorStop(0, '#f8fafc');
  cg.addColorStop(1, '#64748b');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(-5, -13.2);
  ctx.lineTo(-2.5, -16);
  ctx.lineTo(2.5, -16);
  ctx.lineTo(5, -13.2);
  ctx.closePath();
  ctx.fill();
  // Titanium trim on crown
  ctx.strokeStyle = hexA('#d4af37', 0.85);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-2.5, -16);
  ctx.lineTo(2.5, -16);
  ctx.stroke();
  ctx.restore();

  // Edge seam down the middle of head
  ctx.strokeStyle = 'rgba(8,12,20,0.3)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, -10);
  ctx.stroke();

  for (const dir of [-1, 1] as const) {
    ctx.save();
    ctx.translate(dir * 11, -5);
    const heat = s.readoutOn ? 0.9 : 0.2;
    ctx.fillStyle = hexA('#fb923c', heat);
    for (let i = 0; i < 2; i++) ctx.fillRect(-1.2, -1.5 + i * 1.4, 2.4, 0.5);
    ctx.restore();
  }

  ctx.fillStyle = '#020617';
  rr(ctx, -9, -9, 18, 8, 2.5);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  rr(ctx, -9, -9, 18, 8, 2.5);
  ctx.clip();
  const slideT = ((now * 0.00025) % 1) * 30 - 12;
  const sg = ctx.createLinearGradient(slideT - 4, -9, slideT + 4, -1);
  sg.addColorStop(0, 'rgba(255,255,255,0)');
  sg.addColorStop(0.5, 'rgba(255,255,255,0.18)');
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(-10, -10, 20, 10);
  ctx.restore();

  // brows
  ctx.strokeStyle = hexA(accent, 0.9);
  ctx.lineWidth = 1.2;
  const browOff = s.browTilt;
  for (const dir of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(dir * 7, -10 + dir * browOff * 2);
    ctx.lineTo(dir * 3, -10 - dir * browOff * 2);
    ctx.stroke();
  }

  const ox = clamp(s.eyeX, -1.8, 1.8);
  const oy = clamp(s.eyeY, -1.4, 1.4);
  const eyeBaseY = -5;
  const eyeH = clamp(1.6 + s.eyeWide * 1.4 - s.blink * 1.6, 0.2, 3.2);
  const eyeW = clamp(3.2 - s.eyeWide * 0.4, 2.2, 3.8);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const ex of [-4, 4]) {
    const gr = ctx.createRadialGradient(ex + ox, eyeBaseY + oy, 0, ex + ox, eyeBaseY + oy, 4.5);
    gr.addColorStop(0, hexA(accent, 0.95));
    gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(ex + ox, eyeBaseY + oy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  for (const ex of [-4, 4]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex + ox, eyeBaseY + oy, eyeW * 0.5, eyeH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (s.crossBeamOn) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(ex + ox - 0.6, eyeBaseY + oy, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + ox + 0.6, eyeBaseY + oy, 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.ellipse(
        ex + ox,
        eyeBaseY + oy,
        Math.min(eyeW * 0.25, 0.8),
        Math.min(eyeH * 0.55, 0.9),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  if (Math.abs(s.mouthCurve) > 0.05) {
    ctx.strokeStyle = hexA(accent, 0.75);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    const mc = s.mouthCurve;
    ctx.moveTo(-3, 0.5 - mc * 0.6);
    ctx.quadraticCurveTo(0, 0.5 + mc * 1.2, 3, 0.5 - mc * 0.6);
    ctx.stroke();
  }

  const ax = s.antX - s.x;
  const ay = s.antY - s.y - cy;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.quadraticCurveTo(ax * 0.3, -20, ax, ay);
  ctx.stroke();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const ap = 0.5 + s.energy * 0.5;
  const ag = ctx.createRadialGradient(ax, ay, 0, ax, ay, 4);
  ag.addColorStop(0, hexA(accent, ap));
  ag.addColorStop(1, 'transparent');
  ctx.fillStyle = ag;
  ctx.beginPath();
  ctx.arc(ax, ay, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ax, ay, 1.1, 0, Math.PI * 2);
  ctx.fill();

  const ax2 = s.antX2 - s.x - face * 2;
  const ay2 = s.antY2 - s.y - cy;
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(face * 4, -11);
  ctx.quadraticCurveTo(ax2 * 0.5, -16, ax2, ay2);
  ctx.stroke();
  const blink2 = 0.3 + Math.sin(now * 0.01 + 1.7) * 0.3 + (s.crossBeamOn ? 0.4 : 0);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const ag2 = ctx.createRadialGradient(ax2, ay2, 0, ax2, ay2, 2.8);
  ag2.addColorStop(0, hexA('#22d3ee', clamp(blink2, 0, 1)));
  ag2.addColorStop(1, 'transparent');
  ctx.fillStyle = ag2;
  ctx.beginPath();
  ctx.arc(ax2, ay2, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  tx: number,
  ty: number,
  accent: string,
  attention: number,
  now: number,
  intensity: number
) {
  const att = clamp(attention, 0, 1) * intensity;
  const flicker = 0.9 + Math.random() * 0.1;
  const width = (10 + Math.sin(now * 0.01) * 4) * att;
  const alpha = (0.55 + Math.sin(now * 0.02) * 0.25) * att * flicker;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.strokeStyle = hexA(accent, alpha * 0.35);
  ctx.lineWidth = width * 2.2;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.strokeStyle = hexA(accent, alpha * 0.7);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.strokeStyle = hexA('#ffffff', alpha);
  ctx.lineWidth = Math.max(1.2, width * 0.3);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  const tg = ctx.createRadialGradient(tx, ty, 0, tx, ty, 14);
  tg.addColorStop(0, hexA(accent, alpha));
  tg.addColorStop(1, 'transparent');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.arc(tx, ty, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDots(ctx: CanvasRenderingContext2D, s: any, now: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const d of s.dots)
    if (d.alive) {
      const age = (now - d.born) / 600;
      const pulse = 1 + Math.sin(now * 0.005 + d.id) * 0.08;
      const r = (2.2 + Math.min(1.5, age * 1.5)) * pulse;
      const gr = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 2.8);
      gr.addColorStop(0, hexA(d.col, 0.6));
      gr.addColorStop(1, 'transparent');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(d.x, d.y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hexA('#ffffff', 0.9);
      ctx.beginPath();
      ctx.arc(d.x, d.y, Math.max(1.2, r * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = d.col;
      ctx.beginPath();
      ctx.arc(d.x, d.y, Math.max(0.8, r * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
  ctx.restore();
}

function drawWireframes(ctx: CanvasRenderingContext2D, s: any, now: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const w of s.wireframes as Wireframe[]) {
    if (!w.alive || w.prog <= 0) continue;
    const eased = easeInOutCubic(clamp(w.prog, 0, 1));
    const visible = w.totalLen * eased;

    // Build path ONCE per group per frame — cached points, no geometry math.
    ctx.beginPath();
    ctx.moveTo(w.pts[0], w.pts[1]);
    for (let i = 1; i < w.count; i++) ctx.lineTo(w.pts[i * 2], w.pts[i * 2 + 1]);

    // Dash reveal: visible portion then huge gap so only [0..visible] is drawn.
    ctx.setLineDash([visible, w.totalLen + 1]);
    ctx.lineDashOffset = 0;

    // Pass 1: outer glow (blurred, low alpha, wide).
    ctx.shadowBlur = 10;
    ctx.shadowColor = w.col;
    ctx.strokeStyle = hexA(w.col, 0.38);
    ctx.lineWidth = w.glowWidth;
    ctx.stroke();

    // Pass 2: crisp core (no shadow, high alpha, thin).
    ctx.shadowBlur = 0;
    ctx.strokeStyle = hexA(w.col, 0.95);
    ctx.lineWidth = w.coreWidth;
    ctx.stroke();

    // Travelling scan-tip at the current draw head (only while still drawing).
    if (w.prog < 1) {
      // Binary-search cumLen for the sample at `visible`.
      let lo = 0,
        hi = w.count - 1;
      while (lo < hi) {
        const m = (lo + hi) >> 1;
        if (w.cumLen[m] < visible) lo = m + 1;
        else hi = m;
      }
      const hx = w.pts[lo * 2],
        hy = w.pts[lo * 2 + 1];
      ctx.setLineDash([]);
      const gr = ctx.createRadialGradient(hx, hy, 0, hx, hy, 7);
      gr.addColorStop(0, hexA(w.col, 0.9));
      gr.addColorStop(1, 'transparent');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(hx, hy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx, hy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.setLineDash([]);
  }
  ctx.shadowBlur = 0;
  ctx.restore();
  void now;
}

function drawGlowPass(ctx: CanvasRenderingContext2D, s: any, now: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const r of s.rings)
    if (r.alive) {
      ctx.strokeStyle = hexA(r.col, r.a);
      ctx.lineWidth = r.w;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }
  for (const sp of s.sparks)
    if (sp.alive) {
      if (sp.kind === 'data') {
        ctx.fillStyle = hexA(sp.col, sp.life * 0.9);
        ctx.fillRect(sp.x - 1, sp.y - 1, 2, 2);
      } else if (sp.kind === 'burst') {
        const r = 2.2 + (1 - sp.life) * 4;
        const gr = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, r);
        gr.addColorStop(0, hexA(sp.col, sp.life * 0.95));
        gr.addColorStop(0.5, hexA(sp.col, sp.life * 0.45));
        gr.addColorStop(1, 'transparent');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const gr = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 3);
        gr.addColorStop(0, hexA(sp.col, sp.life * 0.9));
        gr.addColorStop(1, 'transparent');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  // Focus hotspot bloom
  if (s.attention > 0.05) {
    const gr = ctx.createRadialGradient(s.focusX, s.focusY, 0, s.focusX, s.focusY, 22);
    gr.addColorStop(0, hexA(s.focusCol, 0.35 * s.attention));
    gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(s.focusX, s.focusY, 22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  void now;
}

// ── Holo accessories (data-glyph ring + stat badges + orbiting probe) ──────
function drawHoloAccessories(ctx: CanvasRenderingContext2D, s: any, now: number) {
  const bx = s.x,
    by = s.y;
  const alpha = clamp(0.35 + s.attention * 0.55, 0, 0.9);

  // 1) Data-glyph ring around hips
  ctx.save();
  ctx.translate(bx, by - 14);
  const rot = now * 0.0015;
  ctx.strokeStyle = hexA('#7dd3fc', alpha * 0.35);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = rot + (i / 8) * Math.PI * 2;
    const gx = Math.cos(a) * 14,
      gy = Math.sin(a) * 14;
    ctx.fillStyle = hexA(
      '#7dd3fc',
      alpha * (0.6 + (0.4 * ((i + Math.floor(now * 0.004)) % 3)) / 2)
    );
    // tiny glyph: short vertical bar
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillRect(-0.5, -1.2, 1, 2.4);
    ctx.restore();
  }
  ctx.restore();

  // 2) Stat badges
  const drawBadge = (bxp: number, byp: number, text: string) => {
    ctx.save();
    const w = 26,
      h = 7;
    ctx.fillStyle = hexA('#0b1220', 0.72 * alpha);
    rr(ctx, bxp - w / 2, byp - h / 2, w, h, 1.5);
    ctx.fill();
    ctx.strokeStyle = hexA('#7dd3fc', 0.9 * alpha);
    ctx.lineWidth = 0.6;
    rr(ctx, bxp - w / 2, byp - h / 2, w, h, 1.5);
    ctx.stroke();
    ctx.font = '600 4px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = hexA('#e0f2fe', 0.95 * alpha);
    ctx.fillText(text, bxp, byp);
    ctx.restore();
  };
  const bob = Math.sin(now * 0.003) * 1.2;
  drawBadge(bx - 28, by - 44 + bob, `LOCK ${s.visitIdx}/${VISIT_ORDER.length}`);
  drawBadge(bx + 28, by - 44 - bob, `ACC ${Math.floor(s.energy * 100)}%`);

  // 3) Orbiting probe around head
  const probeT = now * 0.002;
  const rx = 22,
    ry = 12;
  const headY = by - 54;
  const probeX = bx + Math.cos(probeT) * rx;
  const probeY = headY + Math.sin(probeT) * ry;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const gr = ctx.createRadialGradient(probeX, probeY, 0, probeX, probeY, 4);
  gr.addColorStop(0, hexA('#22d3ee', 0.9 * alpha));
  gr.addColorStop(1, 'transparent');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(probeX, probeY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexA('#ffffff', 0.95 * alpha);
  ctx.beginPath();
  ctx.arc(probeX, probeY, 0.9, 0, Math.PI * 2);
  ctx.fill();
  // short emitter line pointing along velocity tangent
  const tanX = -Math.sin(probeT) * rx,
    tanY = Math.cos(probeT) * ry;
  const tl = Math.hypot(tanX, tanY) || 1;
  ctx.strokeStyle = hexA('#7dd3fc', 0.7 * alpha);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(probeX, probeY);
  ctx.lineTo(probeX - (tanX / tl) * 4, probeY - (tanY / tl) * 4);
  ctx.stroke();
  ctx.restore();
}

// ── DONE holo badge (finale stage 3) ───────────────────────────────────────
function drawDoneHolo(ctx: CanvasRenderingContext2D, s: any, now: number) {
  const scale = clamp(s.showHoloDone, 0, 1.05);
  if (scale < 0.01) return;
  const cx = s.x;
  const cy = s.y - 72 + Math.sin(now * 0.003) * 1.5;
  const w = 78 * scale,
    h = 18 * scale;
  ctx.save();
  ctx.translate(cx, cy);
  // Outer glow
  ctx.globalCompositeOperation = 'lighter';
  const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 40 * scale);
  gr.addColorStop(0, hexA('#38bdf8', 0.4 * clamp(scale, 0, 1)));
  gr.addColorStop(1, 'transparent');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(0, 0, 40 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // Glass card
  ctx.fillStyle = 'rgba(11, 22, 36, 0.78)';
  rr(ctx, -w / 2, -h / 2, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = hexA('#7dd3fc', 0.95);
  ctx.lineWidth = 1;
  rr(ctx, -w / 2, -h / 2, w, h, 4);
  ctx.stroke();
  // Inner highlight
  ctx.fillStyle = 'rgba(125, 211, 252, 0.10)';
  rr(ctx, -w / 2 + 1.5, -h / 2 + 1.5, w - 3, (h - 3) * 0.4, 3);
  ctx.fill();
  // Text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(8 * scale)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.fillText('\u2713  ANALYSIS DONE', 0, 0.5);
  ctx.restore();
}

// ── White flash overlay (finale stage 2) ───────────────────────────────────
function drawFlashOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${clamp(alpha, 0, 1)})`;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// ═════════════════════════════════════════════════════════════════════════
//  v3.1 visible upgrades
// ═════════════════════════════════════════════════════════════════════════

// ── Motion trail: fading silhouette ghosts behind the robot ────────────────
// Reads the ring buffer of recent (x, y, t) samples and renders each as a
// soft accent-colored disc whose alpha decays with age. Cheap (≤10 fills),
// huge perceived motion smear when the bot races between landmarks.
function drawMotionTrail(ctx: CanvasRenderingContext2D, s: any, now: number, slots: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < slots; i++) {
    // Walk ring buffer from oldest → newest so alpha builds up.
    const slot = (s.trailHead + i) % slots;
    const tx = s.trail[slot * 3];
    const ty = s.trail[slot * 3 + 1];
    const tt = s.trail[slot * 3 + 2];
    if (tt === 0) continue; // empty slot
    const age = now - tt;
    if (age > 400) continue;
    const a = clamp(1 - age / 400, 0, 1);
    const r = 8 + (1 - a) * 6;
    const gr = ctx.createRadialGradient(tx, ty - 18, 0, tx, ty - 18, r);
    gr.addColorStop(0, hexA(s.focusCol, 0.35 * a * a));
    gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(tx, ty - 18, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Pulsing scan aura: dual concentric rings around the robot ──────────────
// Uses additive blend so it reads as light, not paint. Pulse phase decoupled
// from grid energy so it has its own rhythm. Color tracks the active landmark.
function drawScanAura(ctx: CanvasRenderingContext2D, s: any, now: number) {
  const cx = s.x,
    cy = s.y - 18;
  const pulse = 0.5 + Math.sin(s.auraPulse * 4) * 0.5;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // Inner ring — tight, bright, fast pulse.
  const r1 = 28 + pulse * 6;
  ctx.strokeStyle = hexA(s.focusCol, 0.25 + s.attention * 0.25);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r1, 0, Math.PI * 2);
  ctx.stroke();
  // Outer ring — wider, softer, opposite phase.
  const r2 = 48 + (1 - pulse) * 8;
  ctx.strokeStyle = hexA('#7dd3fc', 0.1 + (1 - pulse) * 0.15);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(cx, cy, r2, 0, Math.PI * 2);
  ctx.stroke();
  // Sweep arc — rotating accent slice.
  const sweepStart = (now * 0.002) % (Math.PI * 2);
  ctx.strokeStyle = hexA(s.focusCol, 0.55);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, r1, sweepStart, sweepStart + Math.PI * 0.35);
  ctx.stroke();
  ctx.restore();
}

// ── Orbital satellites: 3 mini-drones circling the robot's head ───────────
// Each orbit has a different radius, angular speed, and phase. Pulses with a
// soft glow on additive blend. Reads as a halo of agentic helpers — the
// MOST visible "advanced animation" upgrade for the robot.
function drawOrbitalSatellites(ctx: CanvasRenderingContext2D, s: any, now: number) {
  const cx = s.x;
  const cy = s.y - 32;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const orbits = [
    { r: 24, w: 0.0035, phase: 0, col: s.focusCol, size: 2.4 },
    { r: 30, w: -0.0028, phase: Math.PI * 0.66, col: '#7dd3fc', size: 2.0 },
    { r: 36, w: 0.0022, phase: Math.PI * 1.33, col: '#f472b6', size: 1.8 }
  ];
  for (const o of orbits) {
    const a = now * o.w + o.phase;
    // Tilt the orbit ellipse for a 3D feel (compress y).
    const ox = cx + Math.cos(a) * o.r;
    const oy = cy + Math.sin(a) * o.r * 0.35;
    // Trailing tail — 4 fading micro-dots behind each satellite.
    for (let i = 1; i <= 4; i++) {
      const ta = a - o.w * 80 * i;
      const tx = cx + Math.cos(ta) * o.r;
      const ty = cy + Math.sin(ta) * o.r * 0.35;
      ctx.fillStyle = hexA(o.col, 0.3 * (1 - i / 5));
      ctx.beginPath();
      ctx.arc(tx, ty, o.size * (1 - i * 0.12), 0, Math.PI * 2);
      ctx.fill();
    }
    // Glow halo
    const gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.size * 4);
    gr.addColorStop(0, hexA(o.col, 0.85));
    gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(ox, oy, o.size * 4, 0, Math.PI * 2);
    ctx.fill();
    // Solid core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ox, oy, o.size, 0, Math.PI * 2);
    ctx.fill();
    // Micro halo ring
    ctx.strokeStyle = hexA(o.col, 0.6);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(ox, oy, o.size + 1.4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Thinking bubble: 3 animated dots above the robot's head ────────────────
// Classic "typing" indicator. Communicates "the AI is thinking" during the
// long Gemini await — directly addresses the "stuck at 93%" feeling by giving
// a clear visual cue that work is in progress.
function drawThinkingBubble(ctx: CanvasRenderingContext2D, s: any, now: number) {
  const cx = s.x + 22; // offset right of head
  const cy = s.y - 60; // above head
  const w = 26,
    h = 14,
    r = 7;
  ctx.save();
  // Bubble body — semi-transparent white card with subtle border.
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.strokeStyle = hexA(s.focusCol, 0.55);
  ctx.lineWidth = 0.8;
  rr(ctx, cx - w / 2, cy - h / 2, w, h, r);
  ctx.fill();
  ctx.stroke();
  // Bubble tail — small triangle pointing toward head.
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + h / 2 - 0.5);
  ctx.lineTo(cx - 11, cy + h / 2 + 4);
  ctx.lineTo(cx - 4, cy + h / 2 - 0.5);
  ctx.closePath();
  ctx.fill();
  // Three pulsing dots — staggered phases for typing rhythm.
  for (let i = 0; i < 3; i++) {
    const phase = now * 0.006 - i * 0.6;
    const scale = 0.5 + Math.max(0, Math.sin(phase)) * 0.5;
    const dx = cx - 7 + i * 7;
    ctx.fillStyle = hexA(s.focusCol, 0.55 + scale * 0.45);
    ctx.beginPath();
    ctx.arc(dx, cy, 1.6 + scale * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
