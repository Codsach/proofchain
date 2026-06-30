"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight, Shield, Zap, Lock, Database } from "lucide-react";
import HeroInteractiveWidget from "./HeroInteractiveWidget";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36, filter: "blur(12px)" },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 1.3, delay: i * 0.13, ease: [0.16, 1, 0.3, 1] },
  }),
};

const stats = [
  { value: "< 60s", label: "Blockchain Anchoring", Icon: Zap },
  { value: "SHA-256", label: "Cryptographic Seal", Icon: Shield },
  { value: "100%", label: "Immutable Records", Icon: Lock },
  { value: "IPFS", label: "Decentralised Store", Icon: Database },
];

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const bgY    = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const midY   = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const midOp  = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const fgY    = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const fgOp   = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const fgSc   = useTransform(scrollYProgress, [0, 0.6], [1, 0.98]);

  useEffect(() => {
    let hls: any = null;
    const video = videoRef.current;
    if (!video) return;
    const src = "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";
    import("hls.js").then((M) => {
      const Hls = M.default;
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: false });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.addEventListener("loadedmetadata", () => video.play().catch(() => {}));
      }
    });
    return () => { if (hls) hls.destroy(); };
  }, []);

  return (
    <div
      ref={sectionRef}
      className="noise-overlay relative min-h-screen flex items-center justify-center overflow-hidden w-full"
      style={{ background: "transparent" }}
    >
      {/* ─── Keyframes ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes heroShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .hero-shimmer {
          background: linear-gradient(
            110deg,
            #334155 0%,
            #0f172a 18%,
            #d97706 38%,
            #059669 58%,
            #0f172a 78%,
            #334155 100%
          );
          background-size: 300% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: heroShimmer 9s linear infinite;
        }
        @keyframes auroraFloat {
          0%, 100% { transform: translateX(-50%) scale(1);   opacity: 0.6; }
          50%       { transform: translateX(-50%) scale(1.1); opacity: 0.9; }
        }
        @keyframes lineSlide {
          0%   { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        .hero-line { animation: lineSlide 1.4s cubic-bezier(0.16,1,0.3,1) forwards; transform-origin: left; }
      ` }} />

      {/* ─── Layer 1: Video ─── */}
      <motion.div
        style={{
          position: "absolute", top: "-5%", bottom: "-5%", left: 0, right: 0,
          y: bgY, scale: bgScale, zIndex: 0, pointerEvents: "none",
          transformOrigin: "center top", willChange: "transform",
        }}
      >
        <video
          ref={videoRef}
          autoPlay muted loop playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.06 }}
        />
      </motion.div>

      {/* ─── Layer 2: Ambient glows ─── */}
      <motion.div
        style={{
          position: "absolute", inset: 0,
          y: midY, opacity: midOp, zIndex: 2,
          pointerEvents: "none", willChange: "transform, opacity",
        }}
      >
        {/* Edge fade — left */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, var(--lp-bg) 0%, rgba(238,242,247,0.4) 15%, transparent 35%, rgba(238,242,247,0.4) 85%, var(--lp-bg) 100%)",
        }} />
        {/* Bottom fade */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, var(--lp-bg) 0%, transparent 55%)",
        }} />

        {/* Primary emerald aurora — top center */}
        <div style={{
          position: "absolute",
          top: "-8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "75%",
          maxWidth: 1000,
          height: 520,
          background: "radial-gradient(ellipse at 50% 0%, rgba(5,150,105,0.12) 0%, rgba(4,120,87,0.05) 40%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
          animation: "auroraFloat 10s ease-in-out infinite",
        }} />

        {/* Warm amber glow — lower right */}
        <div style={{
          position: "absolute",
          bottom: "10%",
          right: "5%",
          width: 440,
          height: 440,
          background: "radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }} />

        {/* Subtle grid */}
        <div className="lp-hero-grid hidden md:block" style={{ position: "absolute", inset: 0 }} />
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center min-h-screen lg:min-h-0 lg:py-36">

          {/* ── Left: Text ── */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">

            {/* Headline */}
            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="font-heading font-black tracking-tight mb-5"
              style={{ lineHeight: 1.0, fontSize: "clamp(3.2rem, 7.5vw, 5.8rem)" }}
            >
              <span className="block hero-shimmer">
                Immutable
              </span>
              <span className="block" style={{ color: "var(--lp-gray-1)" }}>
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

            {/* Accent rule */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: 72, height: 3, borderRadius: 99, marginBottom: 20,
                background: "linear-gradient(90deg, #059669, #047857)",
                boxShadow: "0 0 12px rgba(5,150,105,0.3)",
                transformOrigin: "left",
              }}
            />

            {/* Subtext */}
            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              style={{
                fontSize: "clamp(0.93rem, 1.4vw, 1.05rem)",
                color: "var(--lp-gray-2)",
                lineHeight: 1.75,
                maxWidth: 520,
                marginBottom: 32,
                fontFamily: "var(--font-exo2, sans-serif)",
              }}
            >
              Every file cryptographically sealed, AI‑analysed for alterations,
              transferred with a signed chain of custody, and permanently anchored
              on a public ledger — so no party can modify forensic evidence without detection.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-10"
            >
              <Link
                href="/login"
                id="hero-cta-primary"
                className="lp-btn-primary font-sans flex items-center justify-center gap-2.5 no-underline"
                style={{ height: 52, paddingLeft: 32, paddingRight: 32, fontSize: 14, fontWeight: 600 }}
              >
                Access Platform <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                id="hero-cta-secondary"
                className="lp-btn-ghost font-sans flex items-center justify-center gap-2 no-underline"
                style={{ height: 52, paddingLeft: 32, paddingRight: 32, fontSize: 14, fontWeight: 600 }}
              >
                View Features
              </a>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={4}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full"
              style={{
                borderTop: "1px solid rgba(15,23,42,0.10)",
                paddingTop: 28,
              }}
            >
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="group"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid rgba(15,23,42,0.09)",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(5,150,105,0.25)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.92)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(5,150,105,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(15,23,42,0.09)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.72)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <s.Icon size={11} style={{ color: "#059669", opacity: 0.85 }} />
                    <span
                      className="font-heading"
                      style={{ fontSize: 13, fontWeight: 700, color: "var(--lp-gray-1)" }}
                    >
                      {s.value}
                    </span>
                  </div>
                  <span
                    style={{
                      display: "block",
                      fontSize: 9,
                      color: "var(--lp-gray-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      lineHeight: 1.4,
                      fontFamily: "var(--font-exo2, sans-serif)",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </motion.div>

          </div>

          {/* ── Right: Widget ── */}
          <motion.div
            className="lg:col-span-5 w-full flex justify-center items-center relative"
            variants={fadeUp} initial="hidden" animate="visible" custom={2.5}
          >
            {/* Outer ambient glow ring */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: -40,
                borderRadius: 40,
                background: "radial-gradient(ellipse at 50% 50%, rgba(5,150,105,0.08) 0%, transparent 70%)",
                filter: "blur(24px)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
            {/* Warm bottom accent */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                bottom: -60,
                left: "20%",
                right: "20%",
                height: 120,
                background: "radial-gradient(ellipse, rgba(217,119,6,0.07) 0%, transparent 70%)",
                filter: "blur(30px)",
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
        transition={{ delay: 1.8, duration: 1 }}
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
            fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(15,23,42,0.35)",
            fontFamily: "var(--font-geist-mono, monospace)",
          }}
        >
          Scroll
        </span>
        <div
          className="lp-scroll-dot"
          style={{
            width: 1, height: 36,
            background: "linear-gradient(to bottom, rgba(5,150,105,0.5), transparent)",
          }}
        />
      </motion.div>
    </div>
  );
}
