"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FileUp, BrainCircuit, Network, ClipboardCheck } from "lucide-react";

// Ensure plugins are registered in client side
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
  },
  {
    num: "02",
    heading: "AI pipeline analyses the file",
    body: "ExifTool extracts metadata: GPS, creation timestamp, device, and software. If the software field contains Photoshop, GIMP, or Snapseed — flagged. The file is sent to Gemini Vision API for manipulation scoring. A tamper score 0–100 is computed and stored.",
    detail: "Completes within 30 seconds",
    icon: BrainCircuit,
  },
  {
    num: "03",
    heading: "Hash anchored on blockchain",
    body: "The SHA-256 hash, IPFS CID, and Unix timestamp are written to the EvidenceRegistry smart contract on Polygon Amoy testnet within 60 seconds. This on-chain record is immutable — no admin, analyst, or investigator can alter it.",
    detail: "Polygon Amoy · ~2s finality",
    icon: Network,
  },
  {
    num: "04",
    heading: "Analyst reviews and issues verdict",
    body: "An analyst sees the AI report and EXIF findings. They re-verify the on-chain hash in-app, then issue a signed verdict (Verified or Rejected) with reasoning. The verdict hash is anchored on-chain. Anyone can verify the full record at /verify/[caseId].",
    detail: "Verdict → immutable on-chain",
    icon: ClipboardCheck,
  },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current || !trackRef.current) return;

    const sections = gsap.utils.toArray(".step-panel");

    // Horizontal scroll timeline
    gsap.to(sections, {
      xPercent: -100 * (sections.length - 1),
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1,
        // Make the scroll distance relative to the width of the track
        end: () => "+=" + trackRef.current?.offsetWidth,
      },
    });

  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      id="how-it-works"
      className="bg-slate-900 text-slate-100 overflow-hidden h-screen flex flex-col justify-center border-y border-white/5 relative"
    >
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-[var(--lp-accent)]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute top-12 left-6 md:top-24 md:left-24 z-10 pointer-events-none">
        <p className="text-[var(--lp-accent)] font-mono text-sm tracking-widest uppercase mb-2">Workflow</p>
        <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold">The Journey of Truth</h2>
      </div>

      <div className="flex h-full items-center mt-12 md:mt-0">
        <div ref={trackRef} className="flex px-6 md:px-24">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="step-panel w-[85vw] md:w-[60vw] lg:w-[50vw] flex-shrink-0 pr-8 md:pr-16"
            >
              <div className="group bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-12 hover:border-[var(--lp-accent)]/40 transition-colors duration-500 relative overflow-hidden h-full flex flex-col justify-between">
                {/* Glow on hover */}
                <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-8 h-full">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-white/10 flex items-center justify-center text-[var(--lp-accent)] bg-emerald-950/20 group-hover:scale-110 group-hover:bg-[var(--lp-accent)]/20 group-hover:border-emerald-400 transition-all duration-500">
                      <step.icon size={32} />
                    </div>
                  </div>
                  <div className="flex flex-col flex-grow justify-center">
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold mb-4 group-hover:text-emerald-300 transition-colors duration-300">
                      {step.heading}
                    </h3>
                    <p className="font-sans text-slate-300/80 text-base md:text-lg leading-relaxed mb-8">
                      {step.body}
                    </p>
                    <div className="mt-auto">
                      <span className="inline-block font-mono text-xs md:text-sm uppercase tracking-widest text-[var(--lp-accent)]/80 bg-emerald-950/30 border border-emerald-900/50 py-2.5 px-5 rounded-xl">
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