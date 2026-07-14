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
    color: "#3b82f6",
    colorDim: "rgba(59,130,246,0.10)",
    colorGlow: "rgba(59,130,246,0.08)",
  },
  {
    num: "02",
    heading: "AI pipeline analyses the file",
    body: "ExifTool extracts metadata: GPS, creation timestamp, device, and software. If the software field contains Photoshop, GIMP, or Snapseed — flagged. The file is sent to Gemini Vision API for manipulation scoring. A tamper score 0–100 is computed and stored.",
    detail: "Completes within 30 seconds",
    icon: BrainCircuit,
    color: "#8b5cf6",
    colorDim: "rgba(139,92,246,0.10)",
    colorGlow: "rgba(139,92,246,0.08)",
  },
  {
    num: "03",
    heading: "Hash anchored on blockchain",
    body: "The SHA-256 hash, IPFS CID, and Unix timestamp are written to the EvidenceRegistry smart contract on Polygon Amoy testnet within 60 seconds. This on-chain record is immutable — no admin, analyst, or investigator can alter it.",
    detail: "Polygon Amoy · ~2s finality",
    icon: Network,
    color: "#d97706",
    colorDim: "rgba(217,119,6,0.10)",
    colorGlow: "rgba(217,119,6,0.08)",
  },
  {
    num: "04",
    heading: "Analyst reviews and issues verdict",
    body: "An analyst sees the AI report and EXIF findings. They re-verify the on-chain hash in-app, then issue a signed verdict (Verified or Rejected) with reasoning. The verdict hash is anchored on-chain. Anyone can verify the full record at /verify/[caseId].",
    detail: "Verdict → immutable on-chain",
    icon: ClipboardCheck,
    color: "#10b981",
    colorDim: "rgba(16,185,129,0.10)",
    colorGlow: "rgba(16,185,129,0.08)",
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
  const [activeStep, setActiveStep] = useState(0);

  // GSAP horizontal scroll — desktop only using matchMedia
  useGSAP(
    () => {
      if (!containerRef.current || !trackRef.current) return;

      const mm = gsap.matchMedia();
      const sections = gsap.utils.toArray<HTMLElement>(".step-panel");
      if (sections.length === 0) return;

      mm.add("(min-width: 768px)", () => {
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
            onUpdate: (self) => {
              const idx = Math.min(
                steps.length - 1,
                Math.max(0, Math.floor(self.progress * 1.05 * steps.length))
              );
              setActiveStep(idx);
            },
          },
        });
      });

      return () => {
        mm.revert();
      };
    },
    { scope: containerRef }
  );

  const mobileRef = useRef<HTMLDivElement>(null);
  const mobileInView = useInView(mobileRef, { once: true, margin: "-60px" });

  return (
    <div id="how-it-works" className="lp-section-howitworks-dark">
      {/* ── MOBILE: Vertical Timeline (hidden on desktop) ── */}
      <div className="md:hidden block">
        <section
          ref={mobileRef}
          style={{
            borderTop: "1px solid rgba(5,150,105,0.20)",
            borderBottom: "1px solid rgba(5,150,105,0.20)",
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
              background: "radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)",
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
              style={{ fontSize: "clamp(1.8rem, 7vw, 2.8rem)", color: "#ffffff", lineHeight: 1.1 }}
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
                background: "linear-gradient(180deg, transparent, rgba(5,150,105,0.30) 20%, rgba(5,150,105,0.30) 80%, transparent)",
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
                    background: "rgba(14, 22, 38, 0.92)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 20,
                    padding: "20px 20px 18px",
                    boxShadow: "0 4px 32px rgba(0, 0, 0, 0.28)",
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
                      color: "#ffffff",
                      marginBottom: 8,
                      lineHeight: 1.3,
                      fontFamily: "var(--font-manrope), sans-serif",
                    }}
                  >
                    {step.heading}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: "rgba(255, 255, 255, 0.70)",
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
      </div>

      {/* ── DESKTOP: Horizontal GSAP Scroll (hidden on mobile) ── */}
      <div className="hidden md:block">
        <section
          ref={containerRef}
          className="overflow-hidden h-screen flex flex-col relative"
          style={{
            borderTop: "1px solid rgba(5,150,105,0.20)",
            borderBottom: "1px solid rgba(5,150,105,0.20)",
          }}
        >
          {/* Central emerald glow */}
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: "70vw", height: "70vw",
              maxWidth: 720, maxHeight: 720,
              background: "radial-gradient(circle, rgba(5,150,105,0.12) 0%, rgba(4,120,87,0.04) 40%, transparent 70%)",
              filter: "blur(60px)",
              borderRadius: "50%",
            }}
          />

          {/* Section label + heading row */}
          <div className="w-full pt-24 md:pt-28 px-6 md:px-24 pb-4 flex flex-col md:flex-row md:items-end justify-between z-10 pointer-events-none gap-4">
            <div>
              <p className="lp-section-label mb-2">Workflow</p>
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: "#ffffff", lineHeight: 1.15 }}>
                The Journey of Truth
              </h2>
              {/* Scroll hint */}
              <p
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  fontFamily: "var(--font-geist-mono, monospace)",
                  color: "rgba(255, 255, 255, 0.70)",
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
                    background: "rgba(255, 255, 255, 0.70)",
                    borderRadius: 1,
                  }}
                />
                Scroll to explore
              </p>
            </div>

            {/* Step counter indicator */}
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                paddingBottom: 4,
              }}
            >
              {steps.map((step, i) => (
                <div
                  key={step.num}
                  style={{
                    width: i === activeStep ? 24 : 8,
                    height: 3,
                    borderRadius: 99,
                    background: i === activeStep ? step.color : "rgba(255,255,255,0.25)",
                    transition: "all 0.4s ease",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Horizontal scroll track */}
          <div className="flex-1 flex items-center min-h-0 py-4 md:py-8 relative">
            {/* Subtle decorative connection line behind track */}
            <div
              style={{
                position: "absolute",
                left: 0, right: 0, top: "50%",
                height: 1.5,
                background: "linear-gradient(90deg, transparent, rgba(5,150,105,0.30) 20%, rgba(139,92,246,0.30) 80%, transparent)",
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            <div ref={trackRef} className="flex px-6 md:px-24 relative z-10">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className="step-panel w-[85vw] md:w-[60vw] lg:w-[45vw] xl:w-[40vw] flex-shrink-0 pr-8 md:pr-12"
                >
                  <motion.div
                    className="group backdrop-blur-xl rounded-[32px] p-6 md:p-10 relative overflow-hidden flex flex-col justify-between feature-card-border-animated"
                    style={{
                      height: "calc(100vh - 340px)",
                      minHeight: "380px",
                      maxHeight: "480px",
                      background: `linear-gradient(135deg, rgba(14, 22, 38, 0.92) 0%, ${step.color}02 60%, ${step.color}08 100%)`,
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      boxShadow: "0 4px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)",
                      "--card-accent-grad": `linear-gradient(135deg, ${step.color}00 0%, ${step.color}35 50%, ${step.color}00 100%)`
                    } as React.CSSProperties}
                    whileHover="hover"
                    animate="rest"
                    variants={{
                      hover: {
                        y: -6,
                        borderColor: `${step.color}30`,
                        background: `linear-gradient(135deg, rgba(20, 30, 52, 0.94) 0%, ${step.color}04 60%, ${step.color}0d 100%)`,
                        boxShadow: `0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px ${step.color}18, inset 0 1px 0 rgba(255,255,255,0.1)`,
                        transition: { duration: 0.4 }
                      },
                      rest: {
                        y: 0,
                        borderColor: "rgba(255, 255, 255, 0.08)",
                        background: `linear-gradient(135deg, rgba(14, 22, 38, 0.92) 0%, ${step.color}02 60%, ${step.color}08 100%)`,
                        boxShadow: "0 4px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)",
                        transition: { duration: 0.4 }
                      }
                    }}
                  >
                    {/* Glow layer behind card content */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: -40,
                        right: -40,
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${step.color}12 0%, transparent 70%)`,
                        filter: "blur(24px)",
                        pointerEvents: "none",
                        zIndex: 0,
                      }}
                    />

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

                    <div className="relative z-10 flex flex-col gap-6 h-full">
                      {/* Step number + Icon row */}
                      <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between" }}>
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
                        <motion.div
                          className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center"
                          style={{
                            border: `1px solid ${step.color}30`,
                            background: `${step.colorDim}`,
                            boxShadow: `0 0 24px ${step.color}15`,
                          }}
                          variants={{
                            hover: { scale: 1.1, rotate: 6, transition: { duration: 0.3 } },
                            rest: { scale: 1, rotate: 0, transition: { duration: 0.3 } }
                          }}
                        >
                          <step.icon size={28} style={{ color: step.color }} />
                        </motion.div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-grow justify-center">
                        <h3
                          className="text-xl md:text-2xl lg:text-3xl font-heading font-bold mb-3 transition-colors duration-300"
                          style={{ color: "#ffffff" }}
                        >
                          {step.heading}
                        </h3>
                        <p className="font-sans text-sm md:text-base leading-relaxed mb-6" style={{ color: "rgba(255, 255, 255, 0.70)" }}>
                          {step.body}
                        </p>
                        <div className="mt-auto">
                          <span
                            className="inline-block font-mono text-[10px] md:text-xs uppercase tracking-widest py-2 px-4 rounded-xl border"
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
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}