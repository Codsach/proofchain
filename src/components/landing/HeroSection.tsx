"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { DottedSurface } from "@/components/ui/dotted-surface";
import HeroInteractiveWidget from "./HeroInteractiveWidget";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(12px)" },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 1.2, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Scroll progress relative to the hero section itself
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Layer 1 — Background video (slowest)
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  // Layer 2 — Grid + glow overlay (mid speed)
  const midY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const midOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Layer 3 — Foreground text content (fastest)
  const fgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const fgOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const fgScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.98]);

  useEffect(() => {
    let hls: any = null;
    const video = videoRef.current;
    if (!video) return;

    const src = "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

    // Dynamic import Hls.js to avoid SSR issues
    import("hls.js").then((HlsModule) => {
      const Hls = HlsModule.default;
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: false });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((err) => console.log("Video auto-play blocked:", err));
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.addEventListener("loadedmetadata", () => {
          video.play().catch((err) => console.log("Video auto-play blocked:", err));
        });
      }
    });

    return () => {
      if (hls) hls.destroy();
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className={`lp-hero-radial noise-overlay relative min-h-screen flex items-center justify-center pt-24 pb-16 lg:py-0 overflow-hidden w-full`}
      style={{
        boxSizing: "border-box",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes textShimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .animate-text-shimmer {
          background: linear-gradient(
            110deg,
            rgba(255, 255, 255, 0.65) 0%,
            rgba(255, 255, 255, 1) 25%,
            rgba(194, 163, 50, 0.8) 50%,
            rgba(161, 133, 37, 0.8) 75%,
            rgba(255, 255, 255, 0.65) 100%
          );
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: textShimmer 8s linear infinite;
        }
      `}} />

      {/* ── Layer 1: Background video (slowest parallax) ── */}
      <motion.div
        style={{
          position: "absolute",
          top: "-5%",
          bottom: "-5%",
          left: 0,
          right: 0,
          y: bgY,
          scale: bgScale,
          zIndex: 0,
          pointerEvents: "none",
          transformOrigin: "center top",
          willChange: "transform",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.18,
          }}
        />
      </motion.div>

      {/* Three.js Animated Dotted Mesh Background */}
      <DottedSurface className="absolute inset-0 z-1 opacity-25" />

      {/* ── Layer 2: Overlays + grid + glow (mid parallax) ── */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          y: midY,
          opacity: midOpacity,
          zIndex: 2,
          pointerEvents: "none",
          willChange: "transform, opacity",
        }}
      >
        {/* Gradient overlays */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, #030307 0%, transparent 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, #030307 0%, transparent 50%)",
          }}
        />

        {/* Grid lines */}
        <div className="lp-hero-grid hidden md:block" style={{ position: "absolute", inset: 0 }}>
          <div style={{ position: "absolute", left: "20%", top: 0, bottom: 0, width: "1px", background: "rgba(15, 23, 42, 0.06)" }} />
          <div style={{ position: "absolute", left: "40%", top: 0, bottom: 0, width: "1px", background: "rgba(15, 23, 42, 0.06)" }} />
          <div style={{ position: "absolute", left: "60%", top: 0, bottom: 0, width: "1px", background: "rgba(15, 23, 42, 0.06)" }} />
          <div style={{ position: "absolute", left: "80%", top: 0, bottom: 0, width: "1px", background: "rgba(15, 23, 42, 0.06)" }} />
        </div>

        {/* Central glowing aurora */}
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            maxWidth: "900px",
            height: "350px",
            pointerEvents: "none",
          }}
        >
          <svg viewBox="0 0 800 300" width="100%" height="100%">
            <defs>
              <filter id="glow-blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
              </filter>
            </defs>
            <ellipse cx="400" cy="150" rx="300" ry="90" fill="rgba(194, 163, 50, 0.08)" filter="url(#glow-blur)" />
            <ellipse cx="450" cy="150" rx="200" ry="70" fill="rgba(161, 133, 37, 0.06)" filter="url(#glow-blur)" />
          </svg>
        </div>
      </motion.div>

      {/* ── Layer 3: Foreground Content (Text + Interactive Widget) ── */}
      <motion.div
        style={{
          y: fgY,
          opacity: fgOpacity,
          scale: fgScale,
          zIndex: 10,
          willChange: "transform, opacity",
          transformOrigin: "center top",
        }}
        className="relative w-full max-w-[1160px] mx-auto px-4 sm:px-6 md:px-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Text and Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Headline */}
            <motion.h1
              className={`font-heading text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.08] tracking-tight mb-6 font-extrabold text-white text-left`}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <span className="block animate-text-shimmer">
                Immutable Integrity.
              </span>
              <span className="block text-slate-100/90">
                Secured on Chain.
              </span>
            </motion.h1>

            {/* Description Subtext */}
            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-[0.9375rem] sm:text-base text-slate-300/80 leading-relaxed max-w-[580px] mb-8 font-normal"
            >
              Every file cryptographically sealed, AI-analysed for alterations, transferred
              with a signed chain of custody, and permanently anchored on a public ledger
              so no party can modify forensic evidence without detection.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link
                href="/login"
                id="hero-cta-primary"
                className={`lp-btn-primary font-sans w-full sm:w-auto flex items-center justify-center gap-2.5 h-12 px-8 text-sm font-semibold no-underline`}
              >
                Access Platform <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                id="hero-cta-secondary"
                className={`lp-btn-ghost font-sans w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-8 text-sm font-semibold no-underline`}
              >
                View Features
              </a>
            </motion.div>

            {/* Bullet Point Specifications */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={4}
              className="mt-10 sm:mt-12 flex flex-row flex-wrap gap-x-6 gap-y-3 justify-start items-center w-full border-t border-white/5 pt-6"
            >
              {[
                { txt: "IPFS Storage", icon: true },
                { txt: "SHA-256 Anchored", icon: true },
                { txt: "Gemini Vision AI", icon: true },
                { txt: "Polygon Registry", icon: true }
              ].map((t) => (
                <span
                  key={t.txt}
                  className={`font-sans flex items-center gap-2`}
                >
                  <Lock size={10} className="text-[var(--lp-accent)]" />
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400/80 tracking-wider uppercase">
                    {t.txt}
                  </span>
                </span>
              ))}
            </motion.div>

          </div>

          {/* Right Column: Interactive Forensic Seal Widget */}
          <motion.div 
            className="lg:col-span-5 w-full flex justify-center items-center relative"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2.5}
          >
            <div className="lp-ambient-sweep-horizontal" style={{ top: "15%", transform: "translateY(-50%) rotate(-3deg)", opacity: 0.8 }} />
            <HeroInteractiveWidget />
          </motion.div>

        </div>
      </motion.div>

      {/* Scroll indicator hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        style={{
          position: "absolute",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          zIndex: 10,
        }}
        className="hidden lg:flex"
      >
        <span className="font-sans" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.2)" }}>
          Scroll
        </span>
        <div
          className="lp-scroll-dot"
          style={{
            width: 1,
            height: 36,
            background: "linear-gradient(to bottom, rgba(0, 242, 254, 0.4), transparent)",
          }}
        />
      </motion.div>
    </div>
  );
}
