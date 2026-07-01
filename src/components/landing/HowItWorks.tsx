"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FileUp, BrainCircuit, Network, ClipboardCheck } from "lucide-react";
import { motion, useInView } from "framer-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const steps = [
  {
    num: "01",
    heading: "Investigator submits evidence",
    body: "An investigator uploads files (JPEG, PNG, PDF, MP4, .log, .pcap — up to 50 MB) or captures directly from the mobile PWA with GPS tagging. The server computes the SHA-256 hash and uploads the file to IPFS, returning a content-addressed CID.",
    detail: "Status → pending_ai_review",
    icon: FileUp,
    color: "#059669",
    colorDim: "rgba(5,150,105,0.10)",
    colorGlow: "rgba(5,150,105,0.08)",
  },
  {
    num: "02",
    heading: "AI pipeline analyses the file",
    body: "ExifTool extracts metadata: GPS, creation timestamp, device, and software. If the software field contains Photoshop, GIMP, or Snapseed — flagged. The file is sent to Gemini Vision API for manipulation scoring. A tamper score 0–100 is computed and stored.",
    detail: "Completes within 30 seconds",
    icon: BrainCircuit,
    color: "#d97706",
    colorDim: "rgba(217,119,6,0.10)",
    colorGlow: "rgba(217,119,6,0.08)",
  },
  {
    num: "03",
    heading: "Hash anchored on blockchain",
    body: "The SHA-256 hash, IPFS CID, and Unix timestamp are written to the EvidenceRegistry smart contract on Polygon Amoy testnet within 60 seconds. This on-chain record is immutable — no admin, analyst, or investigator can alter it.",
    detail: "Polygon Amoy · ~2s finality",
    icon: Network,
    color: "#10b981",
    colorDim: "rgba(16,185,129,0.10)",
    colorGlow: "rgba(16,185,129,0.08)",
  },
  {
    num: "04",
    heading: "Analyst reviews and issues verdict",
    body: "An analyst sees the AI report and EXIF findings. They re-verify the on-chain hash in-app, then issue a signed verdict (Verified or Rejected) with reasoning. The verdict hash is anchored on-chain. Anyone can verify the full record at /verify/[caseId].",
    detail: "Verdict → immutable on-chain",
    icon: ClipboardCheck,
    color: "#059669",
    colorDim: "rgba(5,150,105,0.10)",
    colorGlow: "rgba(5,150,105,0.08)",
  },
];

// ── Vertical mobile card variant ──
const cardVariant = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size on mount and resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  // GSAP horizontal scroll — desktop only
  useGSAP(
    () => {
      if (!containerRef.current || !trackRef.current) return;
      if (isMobile) return; // skip pinning on mobile

      const sections = gsap.utils.toArray<HTMLElement>(".step-panel");
      if (sections.length === 0) return;

      // Kill any existing ScrollTriggers in this scope first
      ScrollTrigger.getAll()
        .filter((t) => t.trigger === containerRef.current)
        .forEach((t) => t.kill());

      gsap.to(sections, {
        xPercent: -100 * (sections.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 0.8,
          end: () => "+=" + (trackRef.current?.offsetWidth ?? 0),
          invalidateOnRefresh: true,
        },
      });
    },
    { scope: containerRef, dependencies: [isMobile] }
  );

  const mobileRef = useRef<HTMLDivElement>(null);
  const mobileInView = useInView(mobileRef, { once: true, margin: "-60px" });

  // ── MOBILE: Vertical Timeline ──
  if (isMobile) {
    return (
      <section
        id="how-it-works"
        ref={mobileRef}
        style={{
          background: "transparent",
          borderTop: "1px solid rgba(15,23,42,0.08)",
          borderBottom: "1px solid rgba(15,23,42,0.08)",
          padding: "72px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "80vw",
            height: "60vw",
            maxWidth: 500,
            background: "radial-gradient(circle, rgba(5,150,105,0.06) 0%, transparent 70%)",
            filter: "blur(50px)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={mobileInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 48, position: "relative", zIndex: 1 }}
        >
          <p className="lp-section-label" style={{ marginBottom: 12 }}>Workflow</p>
          <h2
            className="font-heading font-bold"
            style={{ fontSize: "clamp(1.8rem, 7vw, 2.8rem)", color: "var(--lp-gray-1)", lineHeight: 1.1 }}
          >
            The Journey of Truth
          </h2>
        </motion.div>

        {/* Vertical step cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 1 }}>
          {/* Connecting line */}
          <div
            style={{
              position: "absolute",
              left: 28,
              top: 16,
              bottom: 16,
              width: 1,
              background: "linear-gradient(180deg, transparent, rgba(15,23,42,0.10) 20%, rgba(15,23,42,0.10) 80%, transparent)",
            }}
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              custom={i}
              variants={cardVariant}
              initial="hidden"
              animate={mobileInView ? "visible" : "hidden"}
              style={{
                display: "flex",
                gap: 16,
                position: "relative",
              }}
            >
              {/* Step number bubble */}
              <div
                style={{
                  flexShrink: 0,
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: `${step.colorDim}`,
                  border: `1px solid ${step.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 16px ${step.color}15`,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <step.icon size={22} style={{ color: step.color }} />
              </div>

              {/* Card content */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.88)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(15,23,42,0.09)",
                  borderRadius: 20,
                  padding: "20px 20px 18px",
                  boxShadow: "0 4px 20px rgba(15,23,42,0.05)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top accent */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "12%",
                    right: "12%",
                    height: 1.5,
                    background: `linear-gradient(90deg, transparent, ${step.color}60, transparent)`,
                  }}
                />

                {/* Step num label */}
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: step.color,
                    fontFamily: "var(--font-geist-mono, monospace)",
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    marginBottom: 6,
                  }}
                >
                  Step {step.num}
                </div>

                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--lp-gray-1)",
                    marginBottom: 8,
                    lineHeight: 1.3,
                    fontFamily: "var(--font-inter), sans-serif",
                  }}
                >
                  {step.heading}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--lp-gray-2)",
                    lineHeight: 1.65,
                    marginBottom: 12,
                  }}
                >
                  {step.body}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 9,
                    fontFamily: "var(--font-geist-mono, monospace)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: step.color,
                    background: `${step.colorDim}`,
                    border: `1px solid ${step.color}25`,
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  {step.detail}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  // ── DESKTOP: Horizontal GSAP Scroll ──
  return (
    <section
      ref={containerRef}
      id="how-it-works"
      className="overflow-hidden h-screen flex flex-col justify-center relative"
      style={{
        background: "transparent",
        borderTop: "1px solid rgba(15,23,42,0.08)",
        borderBottom: "1px solid rgba(15,23,42,0.08)",
      }}
    >
      {/* Central emerald glow */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: "70vw", height: "70vw",
          maxWidth: 720, maxHeight: 720,
          background: "radial-gradient(circle, rgba(5,150,105,0.06) 0%, rgba(4,120,87,0.02) 40%, transparent 70%)",
          filter: "blur(60px)",
          borderRadius: "50%",
        }}
      />

      {/* Section label + heading */}
      <div className="absolute top-12 left-6 md:top-24 md:left-24 z-10 pointer-events-none">
        <p className="lp-section-label mb-3">Workflow</p>
        <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold" style={{ color: "var(--lp-gray-1)" }}>
          The Journey of Truth
        </h2>
        {/* Scroll hint */}
        <p
          style={{
            marginTop: 12,
            fontSize: 10,
            fontFamily: "var(--font-geist-mono, monospace)",
            color: "var(--lp-gray-3)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 1,
              background: "var(--lp-gray-3)",
              borderRadius: 1,
            }}
          />
          Scroll to explore
        </p>
      </div>

      {/* Step counter indicator (top-right) */}
      <div
        className="absolute top-12 right-8 md:top-24 md:right-24 z-10 pointer-events-none"
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        {steps.map((step, i) => (
          <div
            key={step.num}
            style={{
              width: i === 0 ? 24 : 8,
              height: 3,
              borderRadius: 99,
              background: i === 0 ? steps[0].color : "rgba(15,23,42,0.12)",
              transition: "all 0.4s ease",
            }}
          />
        ))}
      </div>

      {/* Horizontal scroll track */}
      <div className="flex h-full items-center mt-12 md:mt-0">
        <div ref={trackRef} className="flex px-6 md:px-24">
          {steps.map((step) => (
            <div
              key={step.num}
              className="step-panel w-[85vw] md:w-[60vw] lg:w-[50vw] flex-shrink-0 pr-8 md:pr-16"
            >
              <div
                className="group backdrop-blur-xl rounded-[32px] p-8 md:p-12 relative overflow-hidden h-full flex flex-col justify-between transition-all duration-500"
                style={{
                  background: "rgba(255,255,255,0.82)",
                  borderColor: "rgba(15,23,42,0.09)",
                  border: "1px solid rgba(15,23,42,0.09)",
                  boxShadow: "0 4px 32px rgba(15,23,42,0.07), inset 0 1px 0 rgba(255,255,255,0.95)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${step.color}35`;
                  e.currentTarget.style.boxShadow = `0 12px 48px rgba(15,23,42,0.10), 0 0 0 1px ${step.color}22, inset 0 1px 0 rgba(255,255,255,1)`;
                  e.currentTarget.style.background = "rgba(255,255,255,0.95)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(15,23,42,0.09)";
                  e.currentTarget.style.boxShadow = "0 4px 32px rgba(15,23,42,0.07), inset 0 1px 0 rgba(255,255,255,0.95)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.82)";
                }}
              >
                {/* Top accent line */}
                <div
                  style={{
                    position: "absolute", top: 0, left: "12%", right: "12%", height: 1.5,
                    background: `linear-gradient(90deg, transparent, ${step.color}60, transparent)`,
                    borderRadius: "0 0 3px 3px",
                  }}
                />

                {/* Hover glow sweep */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at 30% 0%, ${step.color}06 0%, transparent 55%)`,
                  }}
                />

                <div className="relative z-10 flex flex-col gap-8 h-full">
                  {/* Step number + Icon row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: `${step.color}`,
                        fontFamily: "var(--font-geist-mono, monospace)",
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        background: step.colorDim,
                        border: `1px solid ${step.color}25`,
                        padding: "4px 10px",
                        borderRadius: 8,
                      }}
                    >
                      Step {step.num}
                    </span>
                    <div
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                      style={{
                        border: `1px solid ${step.color}30`,
                        background: `${step.colorDim}`,
                        boxShadow: `0 0 24px ${step.color}15`,
                      }}
                    >
                      <step.icon size={32} style={{ color: step.color }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-grow justify-center">
                    <h3
                      className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-4 transition-colors duration-300"
                      style={{ color: "var(--lp-gray-1)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = step.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--lp-gray-1)")}
                    >
                      {step.heading}
                    </h3>
                    <p className="font-sans text-base md:text-lg leading-relaxed mb-8" style={{ color: "var(--lp-gray-2)" }}>
                      {step.body}
                    </p>
                    <div className="mt-auto">
                      <span
                        className="inline-block font-mono text-xs md:text-sm uppercase tracking-widest py-2.5 px-5 rounded-xl border"
                        style={{
                          color: step.color,
                          background: `${step.colorDim}`,
                          borderColor: `${step.color}28`,
                          fontWeight: 600,
                        }}
                      >
                        {step.detail}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}