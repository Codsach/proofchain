"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FileUp, BrainCircuit, Network, ClipboardCheck } from "lucide-react";

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
  },
  {
    num: "02",
    heading: "AI pipeline analyses the file",
    body: "ExifTool extracts metadata: GPS, creation timestamp, device, and software. If the software field contains Photoshop, GIMP, or Snapseed — flagged. The file is sent to Gemini Vision API for manipulation scoring. A tamper score 0–100 is computed and stored.",
    detail: "Completes within 30 seconds",
    icon: BrainCircuit,
    color: "#d97706",
  },
  {
    num: "03",
    heading: "Hash anchored on blockchain",
    body: "The SHA-256 hash, IPFS CID, and Unix timestamp are written to the EvidenceRegistry smart contract on Polygon Amoy testnet within 60 seconds. This on-chain record is immutable — no admin, analyst, or investigator can alter it.",
    detail: "Polygon Amoy · ~2s finality",
    icon: Network,
    color: "#10b981",
  },
  {
    num: "04",
    heading: "Analyst reviews and issues verdict",
    body: "An analyst sees the AI report and EXIF findings. They re-verify the on-chain hash in-app, then issue a signed verdict (Verified or Rejected) with reasoning. The verdict hash is anchored on-chain. Anyone can verify the full record at /verify/[caseId].",
    detail: "Verdict → immutable on-chain",
    icon: ClipboardCheck,
    color: "#059669",
  },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current || !trackRef.current) return;
    const sections = gsap.utils.toArray(".step-panel");
    gsap.to(sections, {
      xPercent: -100 * (sections.length - 1),
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1,
        end: () => "+=" + trackRef.current?.offsetWidth,
      },
    });
  }, { scope: containerRef });

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
                  background: "rgba(255,255,255,0.78)",
                  borderColor: "rgba(15,23,42,0.09)",
                  border: "1px solid rgba(15,23,42,0.09)",
                  boxShadow: "0 4px 24px rgba(15,23,42,0.06)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${step.color}35`;
                  e.currentTarget.style.boxShadow = `0 8px 40px rgba(15,23,42,0.08), 0 0 0 1px ${step.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(15,23,42,0.09)";
                  e.currentTarget.style.boxShadow = "0 4px 24px rgba(15,23,42,0.06)";
                }}
              >
                {/* Top accent line */}
                <div
                  style={{
                    position: "absolute", top: 0, left: "12%", right: "12%", height: 1,
                    background: `linear-gradient(90deg, transparent, ${step.color}55, transparent)`,
                  }}
                />

                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at 30% 0%, ${step.color}06 0%, transparent 60%)`,
                    filter: "blur(20px)",
                  }}
                />

                <div className="relative z-10 flex flex-col gap-8 h-full">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                      style={{
                        border: `1px solid ${step.color}30`,
                        background: `${step.color}10`,
                        color: step.color,
                        boxShadow: `0 0 20px ${step.color}12`,
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
                          background: `${step.color}0d`,
                          borderColor: `${step.color}28`,
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