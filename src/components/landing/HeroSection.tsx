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
        @keyframes heroGradientText {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .hero-shimmer {
          background: linear-gradient(
            110deg,
            #ffffff 0%,
            #e2e8f0 22%,
            #10b981 42%,
            #059669 58%,
            #e2e8f0 78%,
            #ffffff 100%
          );
          background-size: 280% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: heroGradientText 10s ease infinite;
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
              variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="font-heading font-black tracking-tight mb-4"
              style={{ lineHeight: 1.0, fontSize: "clamp(3.0rem, 7vw, 5.4rem)" }}
            >
              <span className="block hero-shimmer">
                Immutable
              </span>
              <span className="block" style={{ color: "rgba(255, 255, 255, 0.95)" }}>
                Evidence.
              </span>
              <span
                className="block"
                style={{
                  backgroundImage: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
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
