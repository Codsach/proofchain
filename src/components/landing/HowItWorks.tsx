"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";

const revealVariant: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

const steps = [
  {
    num: "01",
    heading: "Investigator submits evidence",
    body: "An investigator uploads files (JPEG, PNG, PDF, MP4, .log, .pcap — up to 50 MB) or captures directly from the mobile PWA with GPS tagging. The server computes the SHA-256 hash and uploads the file to IPFS, returning a content-addressed CID.",
    detail: "Status → pending_ai_review",
  },
  {
    num: "02",
    heading: "AI pipeline analyses the file",
    body: "ExifTool extracts metadata: GPS, creation timestamp, device, and software. If the software field contains Photoshop, GIMP, or Snapseed — flagged. The file is sent to Gemini Vision API for manipulation scoring. A tamper score 0–100 is computed and stored.",
    detail: "Completes within 30 seconds",
  },
  {
    num: "03",
    heading: "Hash anchored on blockchain",
    body: "The SHA-256 hash, IPFS CID, and Unix timestamp are written to the EvidenceRegistry smart contract on Polygon Amoy testnet within 60 seconds. This on-chain record is immutable — no admin, analyst, or investigator can alter it.",
    detail: "Polygon Amoy · ~2s finality",
  },
  {
    num: "04",
    heading: "Analyst reviews and issues verdict",
    body: "An analyst sees the AI report and EXIF findings. They re-verify the on-chain hash in-app, then issue a signed verdict (Verified or Rejected) with reasoning. The verdict hash is anchored on-chain. Anyone can verify the full record at /verify/[caseId].",
    detail: "Verdict → immutable on-chain",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Layer 1 — background glow (slowest)
  const bgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  // Layer 2 — header block (medium)
  const headerY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  // Layer 3 — steps list (fastest)
  const stepsY = useTransform(scrollYProgress, [0, 1], ["-2%", "2%"]);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.015)",
        padding: "120px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Layer 1 — decorative background glow (slowest) */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: "20%",
          right: "-10%",
          width: 500,
          height: 500,
          background:
            "radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
          y: bgY,
          willChange: "transform",
        }}
      />

      <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Layer 2 — Header (medium parallax) */}
        <motion.div
          style={{
            marginBottom: 80,
            y: headerY,
            willChange: "transform",
            position: "relative",
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p variants={revealVariant} custom={0} className="lp-section-label" style={{ marginBottom: 16 }}>
            Workflow
          </motion.p>
          <motion.h2
            variants={revealVariant}
            custom={1}
            className="lp-section-h2"
            style={{ color: "#fff", maxWidth: 460 }}
          >
            From submission to verified verdict
          </motion.h2>
        </motion.div>

        {/* Layer 3 — Steps (fastest inner layer) */}
        <motion.div
          style={{
            display: "flex",
            flexDirection: "column",
            y: stepsY,
            willChange: "transform",
            position: "relative",
          }}
        >
          {steps.map((step, i) => (
            <Step
              key={step.num}
              step={step}
              index={i}
              isLast={i === steps.length - 1}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Step({
  step,
  index,
  isLast,
}: {
  step: typeof steps[0];
  index: number;
  isLast: boolean;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={revealVariant}
      custom={index * 0.5}
      whileHover={{ y: -2, transition: { duration: 0.3 } }}
      style={{
        display: "grid",
        gridTemplateColumns: "100px 1fr",
        padding: "16px 0",
        willChange: "transform, opacity",
      }}
      className="group"
    >
      {/* Left */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 4,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.03)",
            letterSpacing: "0.08em",
            transition: "all 0.3s ease",
          }}
          className="group-hover:border-emerald-400/40 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:text-emerald-300"
        >
          {step.num}
        </div>

        {!isLast && (
          <div
            style={{
              width: 1,
              flex: 1,
              minHeight: 60,
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(16,185,129,0.15))",
              margin: "12px 0",
            }}
          />
        )}
      </div>

      {/* Right */}
      <div style={{ paddingBottom: isLast ? 0 : 56, paddingTop: 8 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#fff",
            marginBottom: 12,
            letterSpacing: "-0.01em",
            transition: "color 0.3s ease",
          }}
          className="group-hover:text-emerald-300"
        >
          {step.heading}
        </h3>

        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.42)",
            lineHeight: 1.75,
            maxWidth: 580,
            marginBottom: 14,
          }}
        >
          {step.body}
        </p>

        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "4px 10px",
            borderRadius: 6,
            transition: "all 0.3s ease",
          }}
          className="group-hover:border-emerald-400/30 group-hover:text-emerald-300"
        >
          {step.detail}
        </span>
      </div>
    </motion.div>
  );
}