import { Landmark, AnalysisResult, Point2D } from '../types';

export function drawFaceMesh(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  imgWidth: number,
  imgHeight: number,
  cropX: number,
  cropY: number,
  analysisResult?: AnalysisResult
) {
  // Add a subtle glow effect for that "AI" look
  ctx.shadowColor = "rgba(0, 255, 255, 0.8)";
  ctx.shadowBlur = 8;

  // Draw connections (mesh)
  ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
  ctx.lineWidth = 0.5;

  ctx.beginPath();
  for (let i = 0; i < landmarks.length; i += 3) {
    const p1 = landmarks[i];
    const x1 = (p1.x * imgWidth) - cropX;
    const y1 = (p1.y * imgHeight) - cropY;

    for (let j = i + 1; j < Math.min(i + 15, landmarks.length); j += 2) {
      const p2 = landmarks[j];
      const x2 = (p2.x * imgWidth) - cropX;
      const y2 = (p2.y * imgHeight) - cropY;

      // Only connect if they are relatively close
      const dist = Math.hypot(x2 - x1, y2 - y1);
      if (dist < 30) {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
    }
  }
  ctx.stroke();

  // Draw all 468 landmarks as high-tech dots
  landmarks.forEach((point) => {
    ctx.beginPath();
    const x = (point.x * imgWidth) - cropX;
    const y = (point.y * imgHeight) - cropY;
    ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 255, 255, 0.9)";
    ctx.fill();
  });

  // Reset shadow for other drawings
  ctx.shadowBlur = 0;

  // --- ADVANCED OVERLAYS ---
  if (analysisResult && analysisResult.metrics) {
    const getPt = (idx: number): Point2D => {
      const p = landmarks[idx];
      return { x: (p.x * imgWidth) - cropX, y: (p.y * imgHeight) - cropY };
    };

    // 1. Facial Thirds
    const hairline = getPt(10);
    const glabella = getPt(9);
    const noseBase = getPt(2);
    const chin = getPt(152);

    ctx.strokeStyle = "rgba(236, 72, 153, 0.9)"; // Pink for thirds
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 6]);

    const drawHorizontalLine = (pt: Point2D, label: string) => {
      ctx.beginPath();
      ctx.moveTo(pt.x - 50, pt.y);
      ctx.lineTo(pt.x + 50, pt.y);
      ctx.stroke();

      ctx.fillStyle = "rgba(236, 72, 153, 1)";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.fillText(label, pt.x + 55, pt.y + 4);
    };

    drawHorizontalLine(hairline, "HAIRLINE");
    drawHorizontalLine(glabella, "GLABELLA");
    drawHorizontalLine(noseBase, "NOSE BASE");
    drawHorizontalLine(chin, "CHIN");

    // 2. Jawline
    const leftGonion = getPt(132);
    const rightGonion = getPt(361);

    ctx.strokeStyle = "rgba(52, 211, 153, 0.9)"; // Emerald for jawline
    ctx.lineWidth = 3.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(leftGonion.x, leftGonion.y);
    ctx.lineTo(chin.x, chin.y);
    ctx.lineTo(rightGonion.x, rightGonion.y);
    ctx.stroke();

    // 3. Vertical Symmetry Line
    ctx.strokeStyle = "rgba(34, 211, 238, 0.9)"; // Cyan for symmetry
    ctx.lineWidth = 3.5;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(hairline.x, hairline.y - 20);
    ctx.lineTo(chin.x, chin.y + 20);
    ctx.stroke();

    // Reset line dash
    ctx.setLineDash([]);
  }
}
