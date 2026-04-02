/**
 * Shared confetti animation utility.
 * Used by ResultDashboard and Pricing components.
 */
export function fireConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d')!;
  const pieces: { x: number; y: number; vx: number; vy: number; color: string; r: number; alpha: number }[] = [];
  const colors = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#22d3ee'];
  for (let i = 0; i < 160; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * 7 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      r: Math.random() * 6 + 3,
      alpha: 1,
    });
  }
  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      p.alpha -= 0.009;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    frame++;
    if (frame < 130) requestAnimationFrame(animate);
    else canvas.remove();
  };
  animate();
}
