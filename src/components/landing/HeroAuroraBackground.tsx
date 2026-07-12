"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Blob definitions
// Each blob drifts on independent sinusoidal X/Y paths (Lissajous motion).
// Positions (ox, oy) are the orbit centers as fractions of canvas dimensions.
// rx/ry are orbit half-amplitudes as fractions of canvas dimensions.
// freqX/freqY use prime-ratio periods (seconds) so the combined motion
// never aliases into a visibly repeating loop within a human viewing session.
// alpha is the peak center opacity — kept in the 1.5–3% range for Choice A
// (ultra-subtle: "you feel it but you can't describe it").
// ---------------------------------------------------------------------------

const BLOBS = [
  // A — Brand emerald, large, drifts top-left quadrant
  {
    ox: 0.25, oy: 0.25,
    rx: 0.28, ry: 0.22,
    freqX: (2 * Math.PI) / 23,
    freqY: (2 * Math.PI) / 19,
    phaseX: 0,
    phaseY: Math.PI * 0.7,
    radius: 680,
    r: 5, g: 150, b: 105,
    alpha: 0.45,
  },
  // B — Slate-blue, medium, drifts right-center
  {
    ox: 0.76, oy: 0.34,
    rx: 0.20, ry: 0.28,
    freqX: (2 * Math.PI) / 29,
    freqY: (2 * Math.PI) / 17,
    phaseX: Math.PI * 1.2,
    phaseY: 0,
    radius: 520,
    r: 59, g: 130, b: 246,
    alpha: 0.18,
  },
  // C — Warm amber, smaller, drifts lower-left
  {
    ox: 0.15, oy: 0.72,
    rx: 0.18, ry: 0.20,
    freqX: (2 * Math.PI) / 31,
    freqY: (2 * Math.PI) / 23,
    phaseX: Math.PI * 0.4,
    phaseY: Math.PI * 1.5,
    radius: 420,
    r: 245, g: 158, b: 11,
    alpha: 0.16,
  },
  // D — Deep emerald, large, counter-moves relative to A
  {
    ox: 0.65, oy: 0.68,
    rx: 0.22, ry: 0.18,
    freqX: (2 * Math.PI) / 37,
    freqY: (2 * Math.PI) / 29,
    phaseX: Math.PI * 0.9,
    phaseY: Math.PI * 0.3,
    radius: 600,
    r: 4, g: 120, b: 87,
    alpha: 0.35,
  },
] as const;

// Full resolution — gradient edges are smooth at these opacity levels.
const RENDER_SCALE = 1.0;



export default function HeroAuroraBackground() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const startRef   = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // --- Reduced-motion preference -------------------------------------------
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = mq.matches;
    const onMqChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
    };
    mq.addEventListener("change", onMqChange);

    // --- Resize handler -------------------------------------------------------
    // Recalculate physical canvas pixels whenever the layout changes.
    // ResizeObserver fires once immediately, initialising the canvas size.
    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width  = Math.max(1, Math.floor(w * RENDER_SCALE));
      canvas.height = Math.max(1, Math.floor(h * RENDER_SCALE));
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // --- Draw loop ------------------------------------------------------------
    const draw = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const t = (timestamp - startRef.current) / 1000; // elapsed seconds

      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      if (!reducedMotion) {
        for (const blob of BLOBS) {
          // Sinusoidal position in canvas pixel space
          const bx =
            (blob.ox + Math.sin(blob.freqX * t + blob.phaseX) * blob.rx) * W;
          const by =
            (blob.oy + Math.sin(blob.freqY * t + blob.phaseY) * blob.ry) * H;

          // Physical radius after down-scale
          const r = blob.radius * RENDER_SCALE;

          // Radial gradient: centre → mid-point → transparent edge
          const grad = ctx.createRadialGradient(bx, by, 0, bx, by, r);
          grad.addColorStop(
            0,
            `rgba(${blob.r},${blob.g},${blob.b},${blob.alpha})`,
          );
          grad.addColorStop(
            0.3,
            `rgba(${blob.r},${blob.g},${blob.b},${(blob.alpha * 0.72).toFixed(4)})`,
          );
          grad.addColorStop(
            0.65,
            `rgba(${blob.r},${blob.g},${blob.b},${(blob.alpha * 0.22).toFixed(4)})`,
          );
          grad.addColorStop(
            1,
            `rgba(${blob.r},${blob.g},${blob.b},0)`,
          );

          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      mq.removeEventListener("change", onMqChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="hero-aurora-canvas"
    />
  );
}
