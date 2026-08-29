"use client";

const COLORS = ["#0e8983", "#4fb3ac", "#a82328", "#f3e6da", "#d2f1f1"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  size: number;
  color: string;
};

/** Brief celebratory confetti burst. No-op if the visitor prefers reduced motion. */
export function fireConfetti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.zIndex = "9999";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const count = 140;
  const particles: Particle[] = Array.from({ length: count }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 120,
    y: canvas.height * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -14 - 4,
    rotation: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.3,
    size: Math.random() * 8 + 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  const gravity = 0.35;
  const start = performance.now();
  const duration = 2200;
  let frameId: number;

  function frame(now: number) {
    const elapsed = now - start;
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx!.restore();
    }

    if (elapsed < duration) {
      frameId = requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  frameId = requestAnimationFrame(frame);

  // Safety net in case the tab is backgrounded and rAF stalls.
  setTimeout(() => {
    cancelAnimationFrame(frameId);
    canvas.remove();
  }, duration + 1000);
}
