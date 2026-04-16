"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

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

  // Layer 1 — Background video (slowest, ~30% of scroll distance)
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  // Layer 2 — Grid + glow overlay (mid speed)
  const midY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const midOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Layer 3 — Foreground text content (fastest)
  const fgY = useTransform(scrollYProgress, [0, 1], ["0%", "55%"]);
  const fgOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const fgScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);

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
      className={`lp-hero-radial noise-overlay ${inter.className} flex flex-col items-center justify-center pt-28 sm:pt-32 md:pt-[140px]`}
      style={{
        position: "relative",
        height: "100dvh",
        overflow: "hidden",
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
            rgba(255, 255, 255, 0.6) 0%,
            rgba(255, 255, 255, 1) 25%,
            rgba(255, 255, 255, 0.6) 50%,
            rgba(255, 255, 255, 1) 75%,
            rgba(255, 255, 255, 0.6) 100%
          );
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: textShimmer 6s linear infinite;
        }
      `}} />

      {/* ── Layer 1: Background video (slowest parallax) ── */}
      <motion.div
        style={{
          position: "absolute",
          top: "-10%",
          bottom: "-10%",
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
            opacity: 0.6,
          }}
        />
      </motion.div>

      {/* ── Layer 2: Overlays + grid + glow (mid parallax) ── */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          y: midY,
          opacity: midOpacity,
          zIndex: 1,
          pointerEvents: "none",
          willChange: "transform, opacity",
        }}
      >
        {/* Gradient overlays */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, #070b0a 0%, transparent 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, #070b0a 0%, transparent 50%)",
          }}
        />

        {/* Grid lines */}
        <div className="lp-hero-grid hidden md:block" style={{ position: "absolute", inset: 0 }}>
          <div style={{ position: "absolute", left: "25%", top: 0, bottom: 0, width: "1px", background: "rgba(255,255,255,0.1)" }} />
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "rgba(255,255,255,0.1)" }} />
          <div style={{ position: "absolute", left: "75%", top: 0, bottom: 0, width: "1px", background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Central Glow */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            maxWidth: "800px",
            height: "300px",
            pointerEvents: "none",
          }}
        >
          <svg viewBox="0 0 800 300" width="100%" height="100%">
            <defs>
              <filter id="glow-blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
              </filter>
            </defs>
            <ellipse cx="400" cy="150" rx="300" ry="80" fill="rgba(0, 255, 200, 0.15)" filter="url(#glow-blur)" />
          </svg>
        </div>
      </motion.div>

      {/* ── Layer 3: Foreground text content (fastest parallax) ── */}
      <motion.div
        style={{
          y: fgY,
          opacity: fgOpacity,
          scale: fgScale,
          zIndex: 10,
          willChange: "transform, opacity",
          transformOrigin: "center top",
        }}
        className="relative flex flex-col items-center w-full px-4 sm:px-6"
      >
        <div className="w-full max-w-[880px] mx-auto text-center flex flex-col items-center">

          {/* Badge */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="mb-8 md:mb-10 w-full flex justify-center"
          >
            <span className={`lp-badge ${plusJakartaSans.className} text-[11px] sm:text-xs md:text-sm py-1.5 px-3 sm:py-2 sm:px-4 max-w-full h-auto text-center !whitespace-normal sm:!whitespace-nowrap leading-tight`}>
              <span className="lp-badge-dot" />
              Digital Forensics Platform · Polygon Blockchain
            </span>
          </motion.div>

          {/* Headline */}
  <motion.h1
  className={`${inter.className} text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[5.5rem] leading-[1.1] md:leading-[1.05] tracking-tight mb-5 sm:mb-6 text-center mx-auto w-full max-w-full md:max-w-[900px] font-normal text-white`}
  variants={fadeUp}
  initial="hidden"
  animate="visible"
  custom={2}
>
  <span className="block animate-text-shimmer">
    Immutable Integrity.
  </span>
  <span className="block animate-text-shimmer">
    Secured by Cryptography.
  </span>

  
</motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="text-[0.9375rem] sm:text-base lg:text-[1.0625rem] text-white/70 leading-relaxed w-full max-w-full sm:max-w-[580px] mb-8 sm:mb-10 md:mb-12 text-center mx-auto font-normal px-2 sm:px-0"
          >
            Every file cryptographically sealed, AI-analysed for integrity, transferred
            with a signed chain of custody, and permanently anchored on a public
            blockchain — so no party can alter evidence without detection.
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center mx-auto"
          >
            <Link
              href="/login"
              id="hero-cta-primary"
              className={`lp-btn-primary ${plusJakartaSans.className} w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-7 rounded-full text-sm font-medium no-underline`}
            >
              Get Access <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              id="hero-cta-secondary"
              className={`lp-btn-ghost ${plusJakartaSans.className} w-full sm:w-auto flex items-center justify-center h-12 px-7 rounded-full text-sm font-medium no-underline`}
            >
              See how it works
            </a>
          </motion.div>

          {/* Trust row */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={5}
            className="mt-10 sm:mt-12 md:mt-16 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 md:gap-7 justify-center items-center w-full"
          >
            {[
              "IPFS File Storage",
              "SHA-256 Hash Anchored",
              "Gemini AI Analysis",
              "Polygon Amoy Testnet",
            ].map((t, i) => (
              <span
                key={t}
                className={`${plusJakartaSans.className} flex items-center`}
              >
                {i > 0 && (
                  <span className="hidden sm:inline-block mr-4 md:mr-7 opacity-20 text-white font-medium">·</span>
                )}
                <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-white/25 tracking-[0.06em] uppercase text-center w-full sm:w-auto block">
                  {t}
                </span>
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        style={{
          position: "absolute",
          bottom: 36,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          zIndex: 10,
        }}
      >
        <span className={plusJakartaSans.className} style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
          Scroll
        </span>
        <div
          className="lp-scroll-dot"
          style={{
            width: 1,
            height: 40,
            background: "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)",
          }}
        />
      </motion.div>
    </div>
  );
}
