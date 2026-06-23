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
    color: "#00f59b",
  },
  {
    num: "02",
    heading: "AI pipeline analyses the file",
    body: "ExifTool extracts metadata: GPS, creation timestamp, device, and software. If the software field contains Photoshop, GIMP, or Snapseed — flagged. The file is sent to Gemini Vision API for manipulation scoring. A tamper score 0–100 is computed and stored.",
    detail: "Completes within 30 seconds",
    icon: BrainCircuit,
    color: "#f59e0b",
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
    color: "#00f59b",
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
      className="text-white overflow-hidden h-screen flex flex-col justify-center border-y border-white/5 relative"
      style={{ background: "transparent" }}
    >
      {/* Central emerald glow */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: "70vw", height: "70vw",
          maxWidth: 720, maxHeight: 720,
          background: "radial-gradient(circle, rgba(0,245,155,0.05) 0%, rgba(5,150,105,0.02) 40%, transparent 70%)",
          filter: "blur(60px)",
          borderRadius: "50%",
        }}
      />

      {/* Section label + heading */}
      <div className="absolute top-12 left-6 md:top-24 md:left-24 z-10 pointer-events-none">
        <p className="lp-section-label mb-3">Workflow</p>
        <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white">
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
                className="group backdrop-blur-xl border border-white/8 rounded-[32px] p-8 md:p-12 relative overflow-hidden h-full flex flex-col justify-between transition-all duration-500"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${step.color}35`;
                  e.currentTarget.style.boxShadow = `0 0 40px ${step.color}12`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Top accent line */}
                <div
                  style={{
                    position: "absolute", top: 0, left: "12%", right: "12%", height: 1,
                    background: `linear-gradient(90deg, transparent, ${step.color}50, transparent)`,
                  }}
                />

                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at 30% 0%, ${step.color}08 0%, transparent 60%)`,
                    filter: "blur(20px)",
                  }}
                />

                <div className="relative z-10 flex flex-col gap-8 h-full">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                      style={{
                        border: `1px solid ${step.color}25`,
                        background: `${step.color}08`,
                        color: step.color,
                        boxShadow: `0 0 20px ${step.color}15`,
                      }}
                    >
                      <step.icon size={32} style={{ color: step.color }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-grow justify-center">
                    <h3
                      className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-4 transition-colors duration-300"
                      style={{ color: "#ffffff" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = step.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}
                    >
                      {step.heading}
                    </h3>
                    <p className="font-sans text-white/65 text-base md:text-lg leading-relaxed mb-8">
                      {step.body}
                    </p>
                    <div className="mt-auto">
                      <span
                        className="inline-block font-mono text-xs md:text-sm uppercase tracking-widest py-2.5 px-5 rounded-xl border"
                        style={{
                          color: step.color,
                          background: `${step.color}0d`,
                          borderColor: `${step.color}25`,
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