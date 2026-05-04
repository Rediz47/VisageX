import React, { useEffect, useMemo, useRef } from 'react';

type Phase = 'BASE' | 'WALK_IN' | 'INSPECT' | 'SCAN' | 'STAND_UP' | 'WALK_OUT' | 'DONE';

interface Landmark {
  x: number;
  y: number;
}

interface RobotState {
  x: number;
  y: number;
  scale: number;
  torsoTilt: number;
  armL: number;
  armR: number;
  legL: number;
  legR: number;
  headRot: number;
  energy: number;
  hover: number;
  shoulderSway: number;
  antennaWave: number;
  scanKick: number;
  bodyYaw: number;
}

interface ScanState {
  startTs: number;
  phase: Phase;
  phaseStartTs: number;
  visitIndex: number;
  visitStartTs: number;
  visited: Set<number>;
  revealAtByIndex: Map<number, number>;
  beamPulse: number;
  pulseCenter: { x: number; y: number } | null;
  pulseStartedAt: number;
  microShake: number;
}

interface Props {
  imageUrl: string;
  progress: number;
  isDarkMode: boolean;
  landmarks?: Landmark[] | null;
}

const TOTAL_DURATION_MS = 12000;
const VISIT_ORDER = [10, 33, 263, 1, 9, 234, 454, 152];
const VISIT_MS = 520;
const STABILIZE_MS = 220;
const DOT_REVEAL_DELAY_MS = 120;

const FALLBACK_LANDMARKS: Record<number, Landmark> = {
  10: { x: 0.5, y: 0.2 },
  33: { x: 0.35, y: 0.38 },
  263: { x: 0.65, y: 0.38 },
  1: { x: 0.5, y: 0.5 },
  9: { x: 0.5, y: 0.32 },
  234: { x: 0.28, y: 0.58 },
  454: { x: 0.72, y: 0.58 },
  152: { x: 0.5, y: 0.78 },
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function getPhaseFromProgress(progress: number): Phase {
  if (progress < 8) return 'BASE';
  if (progress < 26) return 'WALK_IN';
  if (progress < 34) return 'INSPECT';
  if (progress < 72) return 'SCAN';
  if (progress < 84) return 'STAND_UP';
  if (progress < 98) return 'WALK_OUT';
  return 'DONE';
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

export function RobotScanCanvas({ imageUrl, progress, isDarkMode, landmarks }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dprRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const detectedLandmarksRef = useRef<Landmark[] | null>(null);
  const handTipRef = useRef({ x: 0, y: 0 });

  const robotRef = useRef<RobotState>({
    x: 0,
    y: 0,
    scale: 1,
    torsoTilt: 0,
    armL: 0,
    armR: 0,
    legL: 0,
    legR: 0,
    headRot: 0,
    energy: 0.5,
    hover: 0,
    shoulderSway: 0,
    antennaWave: 0,
    scanKick: 0,
    bodyYaw: 0,
  });

  const scanRef = useRef<ScanState>({
    startTs: performance.now(),
    phase: 'BASE',
    phaseStartTs: performance.now(),
    visitIndex: 0,
    visitStartTs: performance.now(),
    visited: new Set<number>(),
    revealAtByIndex: new Map<number, number>(),
    beamPulse: 0,
    pulseCenter: null,
    pulseStartedAt: 0,
    microShake: 0,
  });

  useEffect(() => {
    detectedLandmarksRef.current = landmarks ?? null;
  }, [landmarks]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
    };
    return () => {
      imageRef.current = null;
    };
  }, [imageUrl]);

  const size = useMemo(() => ({ width: 220, height: Math.round((220 * 4) / 3) }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    dprRef.current = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * dprRef.current);
    canvas.height = Math.floor(size.height * dprRef.current);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
  }, [size.height, size.width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resolveLandmark = (id: number): Landmark => {
      const all = detectedLandmarksRef.current;
      if (all && all[id]) return all[id];
      return FALLBACK_LANDMARKS[id] ?? { x: 0.5, y: 0.5 };
    };

    const getFaceBounds = () => {
      const points = VISIT_ORDER.map(resolveLandmark);
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return {
        minX: minX * size.width,
        maxX: maxX * size.width,
        minY: minY * size.height,
        maxY: maxY * size.height,
        centerX: ((minX + maxX) * 0.5) * size.width,
        centerY: ((minY + maxY) * 0.5) * size.height,
      };
    };

    const updateScanBrain = (now: number, phase: Phase) => {
      const scan = scanRef.current;
      if (scan.phase !== phase) {
        scan.phase = phase;
        scan.phaseStartTs = now;
      }
      if (phase !== 'SCAN') return;

      const elapsed = now - scan.visitStartTs;
      const settled = elapsed > STABILIZE_MS;
      const currentLandmark = VISIT_ORDER[scan.visitIndex];
      if (settled && !scan.revealAtByIndex.has(currentLandmark)) {
        scan.revealAtByIndex.set(currentLandmark, now + DOT_REVEAL_DELAY_MS);
        const target = resolveLandmark(currentLandmark);
        scan.pulseCenter = { x: target.x * size.width, y: target.y * size.height };
        scan.pulseStartedAt = now;
        scan.beamPulse = 1;
      }
      if (elapsed >= VISIT_MS && scan.visitIndex < VISIT_ORDER.length - 1) {
        scan.visited.add(currentLandmark);
        scan.visitIndex += 1;
        scan.visitStartTs = now;
      }

      for (const [index, revealAt] of scan.revealAtByIndex.entries()) {
        if (now >= revealAt) scan.visited.add(index);
      }
      scan.beamPulse = lerp(scan.beamPulse, 0, 0.08);
      scan.microShake = Math.sin(now * 0.1) * 0.35;
    };

    const updateRobotState = (now: number, phase: Phase) => {
      const robot = robotRef.current;
      const scan = scanRef.current;
      const face = getFaceBounds();
      const timelineT = clamp((now - scan.startTs) / TOTAL_DURATION_MS, 0, 1);
      const baseX = size.width - 28;
      const baseY = size.height - 34;

      const faceWidth = face.maxX - face.minX;
      const robotHeight = clamp(faceWidth * 0.28, 56, 96);
      const targetScale = robotHeight / 90;
      const walkSwing = Math.sin(now * 0.006);
      const walkBounce = Math.abs(Math.sin(now * 0.012));
      const energy = Math.sin(now * 0.002) * 0.5 + 0.5;
      const activeLandmark = resolveLandmark(VISIT_ORDER[scan.visitIndex]);
      const targetLandX = activeLandmark.x * size.width + 40;
      const targetLandY = activeLandmark.y * size.height;

      let tx = baseX;
      let ty = baseY;
      let torsoTilt = 0;
      let armL = -walkSwing * 0.7;
      let armR = walkSwing * 0.7;
      let legL = walkSwing;
      let legR = -walkSwing;

      if (phase === 'WALK_IN') {
        tx = lerp(baseX, face.centerX + 32, clamp((progress - 8) / 18, 0, 1));
        ty = lerp(baseY, face.centerY + 70, clamp((progress - 8) / 18, 0, 1));
        ty -= walkBounce * 2.4;
      } else if (phase === 'INSPECT') {
        tx = face.centerX + 32;
        ty = face.centerY + 70;
        torsoTilt = 0.44;
        armL = -0.48;
        armR = 0.28;
      } else if (phase === 'SCAN') {
        tx = targetLandX;
        ty = targetLandY;
        torsoTilt = 0.44;
        armL = -0.56;
        armR = 0.24 + Math.sin(now * 0.01) * 0.06;
        legL *= 0.2;
        legR *= 0.2;
      } else if (phase === 'STAND_UP') {
        tx = face.centerX + 42;
        ty = face.centerY + 74;
        torsoTilt = 0.12;
      } else if (phase === 'WALK_OUT') {
        tx = lerp(face.centerX + 42, baseX, clamp((progress - 84) / 14, 0, 1));
        ty = lerp(face.centerY + 74, baseY, clamp((progress - 84) / 14, 0, 1));
        ty -= walkBounce * 1.8;
      } else if (phase === 'DONE') {
        tx = baseX;
        ty = baseY;
      } else if (phase === 'BASE') {
        ty += Math.sin(now * 0.003) * 2;
      }

      robot.x = lerp(robot.x || baseX, tx, 0.08);
      robot.y = lerp(robot.y || baseY, ty, 0.08);
      robot.scale = lerp(robot.scale, targetScale + timelineT * 0.04, 0.08);
      robot.torsoTilt = lerp(robot.torsoTilt, torsoTilt, 0.1);
      robot.armL = lerp(robot.armL, armL, 0.1);
      robot.armR = lerp(robot.armR, armR, 0.1);
      robot.legL = lerp(robot.legL, legL, 0.1);
      robot.legR = lerp(robot.legR, legR, 0.1);
      robot.energy = energy;
      robot.headRot = lerp(robot.headRot, Math.atan2(targetLandY - robot.y, targetLandX - robot.x) * 0.2, 0.12);
      robot.hover = Math.sin(now * 0.0035) * 1.6;
      robot.shoulderSway = Math.sin(now * 0.004 + 0.8) * 0.14;
      robot.antennaWave = Math.sin(now * 0.009) * 0.28;
      robot.scanKick = phase === 'SCAN' ? Math.sin(now * 0.023) * 0.35 : 0;
      robot.bodyYaw = Math.atan2(targetLandX - robot.x, Math.abs(targetLandY - robot.y) + 90) * 0.06;
    };

    const drawScene = () => {
      const img = imageRef.current;
      ctx.clearRect(0, 0, size.width, size.height);
      if (img) {
        ctx.drawImage(img, 0, 0, size.width, size.height);
      } else {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, size.width, size.height);
      }

      ctx.fillStyle = 'rgba(10, 14, 24, 0.22)';
      ctx.fillRect(0, 0, size.width, size.height);

      ctx.strokeStyle = isDarkMode ? 'rgba(34,211,238,0.12)' : 'rgba(34,211,238,0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= size.width; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size.height);
        ctx.stroke();
      }
      for (let y = 0; y <= size.height; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size.width, y);
        ctx.stroke();
      }
    };

    const drawBeam = (phase: Phase) => {
      if (phase !== 'SCAN' && phase !== 'INSPECT') return;
      const robot = robotRef.current;
      const scanState = scanRef.current;
      const target = resolveLandmark(VISIT_ORDER[scanState.visitIndex]);
      const tx = target.x * size.width;
      const ty = target.y * size.height;
      const hx = handTipRef.current.x;
      const hy = handTipRef.current.y;
      const beamW = 10 + Math.sin(performance.now() * 0.01) * 4 + scanState.beamPulse * 3;

      const gradient = ctx.createLinearGradient(hx, hy, tx, ty);
      gradient.addColorStop(0, `rgba(34,211,238,${0.55 + robot.energy * 0.2})`);
      gradient.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = beamW;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(tx, ty, 4 + robot.energy * 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34,211,238,0.85)';
      ctx.fill();

      const radial = ctx.createRadialGradient(hx, hy, 2, hx, hy, 24 + scanState.beamPulse * 8);
      radial.addColorStop(0, 'rgba(34,211,238,0.45)');
      radial.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(hx, hy, 24 + scanState.beamPulse * 8, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawLandmarkGuides = (phase: Phase, now: number) => {
      if (phase !== 'SCAN' && phase !== 'STAND_UP' && phase !== 'WALK_OUT' && phase !== 'DONE') return;
      const anchors = {
        hairline: resolveLandmark(10),
        brow: resolveLandmark(9),
        nose: resolveLandmark(1),
        chin: resolveLandmark(152),
        leftCheek: resolveLandmark(234),
        rightCheek: resolveLandmark(454),
      };

      const lines: Array<[number, number, number, number, string]> = [
        [anchors.hairline.x * size.width, anchors.hairline.y * size.height, anchors.chin.x * size.width, anchors.chin.y * size.height, '#22d3ee'],
        [0.2 * size.width, anchors.hairline.y * size.height, 0.8 * size.width, anchors.hairline.y * size.height, '#f472b6'],
        [0.2 * size.width, anchors.brow.y * size.height, 0.8 * size.width, anchors.brow.y * size.height, '#f472b6'],
        [0.2 * size.width, anchors.nose.y * size.height, 0.8 * size.width, anchors.nose.y * size.height, '#f472b6'],
        [anchors.leftCheek.x * size.width, ((anchors.leftCheek.y + anchors.rightCheek.y) / 2) * size.height, anchors.rightCheek.x * size.width, ((anchors.leftCheek.y + anchors.rightCheek.y) / 2) * size.height, '#4ade80'],
      ];

      const scan = scanRef.current;
      const revealIdx = Math.floor((now - scan.phaseStartTs) / 600);
      ctx.setLineDash([4, 4]);
      lines.forEach(([x1, y1, x2, y2, color], i) => {
        if (i > revealIdx) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    };

    const drawLandmarkInteractions = () => {
      const scan = scanRef.current;
      for (const id of VISIT_ORDER) {
        if (!scan.visited.has(id)) continue;
        const p = resolveLandmark(id);
        const x = p.x * size.width;
        const y = p.y * size.height;
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = '#22d3ee';
        ctx.fill();
        ctx.strokeStyle = 'rgba(34,211,238,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 4, y - 4, 8, 8);
      }

      if (scan.pulseCenter) {
        const pulseAge = performance.now() - scan.pulseStartedAt;
        if (pulseAge < 520) {
          const t = pulseAge / 520;
          const r = lerp(4, 22, t);
          ctx.beginPath();
          ctx.arc(scan.pulseCenter.x, scan.pulseCenter.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34,211,238,${(1 - t) * 0.7})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }
    };

    const drawScanFx = (phase: Phase, now: number) => {
      if (phase !== 'SCAN' && phase !== 'INSPECT') return;
      const scan = scanRef.current;
      const phaseTime = now - scan.phaseStartTs;
      const alpha = 0.08 + Math.sin(now * 0.009) * 0.03;
      ctx.fillStyle = `rgba(34,211,238,${alpha})`;
      const sweepX = ((phaseTime * 0.12) % (size.width + 60)) - 30;
      ctx.fillRect(sweepX, 0, 30, size.height);
    };

    const drawRobot = () => {
      const robot = robotRef.current;
      ctx.save();
      ctx.translate(robot.x + scanRef.current.microShake, robot.y + robot.hover);
      ctx.scale(robot.scale, robot.scale);
      ctx.rotate(robot.bodyYaw);

      // glow pass
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(34,211,238,${0.2 + robot.energy * 0.25})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(0, -62);
      ctx.lineTo(0, -14);
      ctx.stroke();

      // base wireframe pass
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#22d3ee';
      ctx.fillStyle = 'rgba(34,211,238,0.14)';
      ctx.lineWidth = 1;

      // torso
      ctx.save();
      ctx.translate(0, robot.shoulderSway * 2);
      ctx.rotate(-robot.torsoTilt);
      drawRoundedRect(ctx, -11, -40, 22, 30, 5);
      ctx.stroke();
      drawRoundedRect(ctx, -8, -33, 16, 12, 3);
      ctx.stroke();
      ctx.restore();

      // neck/head
      ctx.beginPath();
      ctx.moveTo(0, -40);
      ctx.lineTo(0, -48);
      ctx.stroke();
      ctx.save();
      ctx.translate(0, -56);
      ctx.rotate(robot.headRot);
      drawRoundedRect(ctx, -10, -8, 20, 16, 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-4, -1, 1.4, 0, Math.PI * 2);
      ctx.arc(4, -1, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(robot.antennaWave, -13 - Math.abs(robot.antennaWave));
      ctx.stroke();
      ctx.restore();

      // legs
      const drawLeg = (dir: number, swing: number) => {
        ctx.beginPath();
        ctx.moveTo(dir * 5, -10);
        ctx.lineTo(dir * (5 + 7 * Math.sin(swing * 0.6)), 11);
        ctx.lineTo(dir * (8 + 8 * Math.sin(swing * 0.6)), 32);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(dir * (8 + 8 * Math.sin(swing * 0.6)), 32);
        ctx.lineTo(dir * (14 + 8 * Math.sin(swing * 0.6)), 32);
        ctx.stroke();
      };
      drawLeg(-1, robot.legL);
      drawLeg(1, robot.legR);

      // arms
      const drawArm = (dir: number, swing: number) => {
        const shX = dir * 12;
        const shY = -34 + robot.shoulderSway;
        const elX = shX + dir * (9 + 7 * Math.sin(swing));
        const elY = shY + 14;
        const handX = elX + dir * (10 + 4 * Math.sin(swing) + (dir < 0 ? robot.scanKick : 0));
        const handY = elY + 8 - (dir < 0 ? Math.abs(robot.scanKick) * 2 : 0);
        ctx.beginPath();
        ctx.moveTo(shX, shY);
        ctx.lineTo(elX, elY);
        ctx.lineTo(handX, handY);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(handX, handY, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#22d3ee';
        ctx.fill();
        if (dir < 0) {
          handTipRef.current = { x: robot.x + handX * robot.scale, y: robot.y + handY * robot.scale };
        }
      };
      drawArm(-1, robot.armL);
      drawArm(1, robot.armR);

      // status led
      ctx.beginPath();
      ctx.arc(14, -58, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = scanRef.current.phase === 'DONE' ? '#4ade80' : '#22d3ee';
      ctx.fill();
      ctx.restore();
    };

    const render = (now: number) => {
      const phase = getPhaseFromProgress(progress);
      ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
      updateScanBrain(now, phase);
      updateRobotState(now, phase);
      drawScene();
      drawScanFx(phase, now);
      drawLandmarkGuides(phase, now);
      drawLandmarkInteractions();
      drawRobot();
      drawBeam(phase);
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isDarkMode, progress, size.height, size.width]);

  return (
    <div className="relative rounded-2xl overflow-hidden select-none" style={{ width: size.width, aspectRatio: '3/4' }}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
