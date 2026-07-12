"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import HeroInteractiveWidget from "./HeroInteractiveWidget";
import HeroAuroraBackground from "./HeroAuroraBackground";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.2, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

const headlineEntrance: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] },
  },
};

// Very subtle mouse parallax
function useMouseParallax(strength = 0.012) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setOffset({
        x: (e.clientX - cx) * strength,
        y: (e.clientY - cy) * strength,
      });
    };
    window.addEventListener("mousemove", fn, { passive: true });
    return () => window.removeEventListener("mousemove", fn);
  }, [strength]);
  return offset;
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const parallax = useMouseParallax(0.010);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const midY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const midOp = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const fgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const fgOp = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const fgSc = useTransform(scrollYProgress, [0, 0.6], [1, 0.98]);

  return (
    <div
      ref={sectionRef}
      className="noise-overlay relative min-h-screen flex items-center justify-center overflow-hidden w-full"
      style={{ backgroundColor: "var(--hero-dark-bg)" }}
    >
      {/* ─── Keyframes ─── */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes metallicSweep {
          0% {
            background-position: 200% 0, 0 0;
          }
          100% {
            background-position: -200% 0, 0 0;
          }
        }
        @keyframes livingMotion {
          0%, 100% {
            transform: translateY(0) translateZ(0);
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35)) drop-shadow(0 1px 1px rgba(255, 255, 255, 0.05)) brightness(1);
          }
          50% {
            transform: translateY(-0.8px) translateZ(0);
            filter: drop-shadow(0 3.5px 7px rgba(0, 0, 0, 0.42)) drop-shadow(0 1.5px 1.5px rgba(255, 255, 255, 0.06)) brightness(1.03);
          }
        }
        .line-base {
          display: block;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          will-change: transform, filter, background-position;
          background-repeat: no-repeat, no-repeat;
        }
        .line-immutable {
          background-image: 
            linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.15) 50%, transparent 70%),
            linear-gradient(to bottom, #ffffff 10%, #e2e8f0 50%, #cbd5e1 90%);
          background-size: 200% 100%, 100% 100%;
          animation: 
            metallicSweep 6.6s ease-in-out infinite,
            livingMotion 12s ease-in-out infinite;
          animation-delay: 0s, 0s;
        }
        .line-evidence {
          background-image: 
            linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.12) 50%, transparent 70%),
            linear-gradient(to bottom, #ffffff 10%, #cbd5e1 55%, #94a3b8 90%);
          background-size: 200% 100%, 100% 100%;
          animation: 
            metallicSweep 7.2s ease-in-out infinite,
            livingMotion 12s ease-in-out infinite;
          animation-delay: 0s, 0s;
        }
        .line-onchain {
          background-image: 
            linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.16) 50%, transparent 70%),
            linear-gradient(to bottom, #34d399 10%, #059669 50%, #047857 90%);
          background-size: 200% 100%, 100% 100%;
          animation: 
            metallicSweep 7.8s ease-in-out infinite,
            livingMotion 12s ease-in-out infinite;
          animation-delay: 0s, 0s;
        }
        @media (prefers-reduced-motion: reduce) {
          .line-immutable, .line-evidence, .line-onchain {
            animation: none !important;
            background-position: -200% 0, 0 0 !important;
            transform: none !important;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35)) !important;
          }
        }
      `}} />

      {/* ─── Layer 2: Chromatic aurora + edge fades ─── */}
      <motion.div
        style={{
          position: "absolute", inset: 0,
          y: midY, opacity: midOp, zIndex: 2,
          pointerEvents: "none", willChange: "transform, opacity",
        }}
      >
        {/* Aurora canvas — sits below the edge fades in DOM order */}
        <HeroAuroraBackground />

        {/* Left + right edge fades — keep text columns crisp */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, var(--hero-dark-bg) 0%, transparent 18%, transparent 82%, var(--hero-dark-bg) 100%)",
          pointerEvents: "none",
        }} />

        {/* Bottom edge fade — only 20% to avoid washing out lower aurora blobs */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, var(--hero-dark-bg) 0%, transparent 20%)",
          pointerEvents: "none",
        }} />
      </motion.div>

      {/* ─── Layer 3: Foreground ─── */}
      <motion.div
        style={{
          y: fgY, opacity: fgOp, scale: fgSc,
          zIndex: 10, willChange: "transform, opacity",
          transformOrigin: "center top",
        }}
        className="relative w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center pt-28 pb-16 lg:py-24">

          {/* ── Left: Text ── */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">

            {/* Headline */}
            <motion.h1
              variants={headlineEntrance} initial="hidden" animate="visible"
              className="font-heading mb-4"
              style={{
                lineHeight: 1.08,
                fontSize: "clamp(3.0rem, 7vw, 5.4rem)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <span className="line-base line-immutable" style={{ fontWeight: 900, letterSpacing: "-0.035em", fontSize: "1.02em" }}>
                Immutable
              </span>
              <span className="line-base line-evidence" style={{ fontWeight: 900, letterSpacing: "-0.03em", fontSize: "1.0em" }}>
                Evidence.
              </span>
              <span className="line-base line-onchain" style={{ fontWeight: 800, letterSpacing: "-0.025em", fontSize: "0.95em" }}>
                On Chain.
              </span>
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: 56, height: 2.5, borderRadius: 99, marginBottom: 16,
                background: "linear-gradient(90deg, #059669, #047857)",
                transformOrigin: "left",
                boxShadow: "0 0 8px rgba(5,150,105,0.20)",
              }}
            />

            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              style={{
                fontSize: "clamp(0.92rem, 1.35vw, 1.03rem)",
                color: "rgba(255, 255, 255, 0.70)",
                lineHeight: 1.75,
                maxWidth: 500,
                marginBottom: 24,
                fontFamily: "var(--font-geist), sans-serif",
              }}
            >
              Every file cryptographically sealed, AI‑analysed for alterations,
              transferred with a signed chain of custody, and permanently anchored
              on a public ledger — so no party can modify forensic evidence without detection.
            </motion.p>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-0"
            >
              <Link
                href="/login"
                id="hero-cta-primary"
                className="lp-btn-primary font-sans flex items-center justify-center gap-2.5 no-underline"
                style={{ height: 52, paddingLeft: 32, paddingRight: 32, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}
              >
                Access Platform <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                id="hero-cta-secondary"
                className="lp-btn-ghost-dark font-sans flex items-center justify-center gap-2 no-underline"
                style={{ height: 52, paddingLeft: 28, paddingRight: 28, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}
              >
                View Features
              </a>
            </motion.div>

          </div>

          {/* ── Right: Widget ── */}
          <motion.div
            className="lg:col-span-6 w-full flex justify-center lg:justify-end items-center relative"
            variants={fadeUp} initial="hidden" animate="visible" custom={1.5}
            style={{
              x: parallax.x * 8,
              y: parallax.y * 8,
              transition: "x 0.6s ease-out, y 0.6s ease-out",
            } as React.CSSProperties}
          >
            {/* Soft ambient glow behind widget */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: -32,
                borderRadius: 40,
                background: "radial-gradient(ellipse at 50% 50%, rgba(5,150,105,0.07) 0%, transparent 70%)",
                filter: "blur(32px)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
            <HeroInteractiveWidget />
          </motion.div>

        </div>
      </motion.div>

      {/* ─── Scroll cue ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0, duration: 1 }}
        className="hidden lg:flex"
        style={{
          position: "absolute", bottom: 28, left: "50%",
          transform: "translateX(-50%)",
          flexDirection: "column", alignItems: "center", gap: 6,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase",
            color: "rgba(255, 255, 255, 0.45)",
            fontFamily: "var(--font-geist-mono, monospace)",
          }}
        >
          Scroll
        </span>
        <div
          className="lp-scroll-dot"
          style={{
            width: 1, height: 32,
            background: "linear-gradient(to bottom, rgba(5,150,105,0.40), transparent)",
          }}
        />
      </motion.div>
    </div>
  );
}
