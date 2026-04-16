"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const revealVariant = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const features = [
  {
    label: "01",
    title: "IPFS + Blockchain Anchoring",
    body: "Every submitted file is stored on IPFS and given a content-addressed CID. Its SHA-256 hash, CID, and Unix timestamp are anchored to the Polygon Amoy blockchain within 60 seconds — making any post-submission alteration mathematically detectable.",
    tag: "SUB-03 · SUB-04 · SUB-05",
  },
  {
    label: "02",
    title: "AI Tamper Analysis",
    body: "An automated pipeline runs on every submission: ExifTool extracts metadata (GPS, device, software, timestamps). Gemini Vision API scans for lighting inconsistencies, cloning artifacts, and splicing boundaries. A composite tamper score 0–100 is produced within 30 seconds.",
    tag: "AI-02 · AI-04 · AI-05",
  },
  {
    label: "03",
    title: "Chain-of-Custody Transfer Log",
    body: "Every handoff of evidence between investigators and analysts is cryptographically signed. Each transfer records a keccak256 hash of (from + to + reason + timestamp) on-chain — proving the handoff occurred without exposing user identities. Maximum 10 transfers per case.",
    tag: "TRF-01 · TRF-04 · TRF-07",
  },
  {
    label: "04",
    title: "Analyst Verdict — On-Chain",
    body: "Analysts review the AI report, EXIF findings, and on-chain hash. They issue a signed verdict (Verified or Rejected) with a mandatory written reason. The verdict hash is recorded in the smart contract — immutable, timestamped, and publicly auditable.",
    tag: "REV-03 · REV-04 · REV-05",
  },
  {
    label: "05",
    title: "Public QR Verification",
    body: "Every submission has a public verification URL — /verify/[caseId] — requiring no login. Anyone can verify the on-chain hash, submission timestamp, transfer count, and verdict status. A QR code is generated for each submission at the point of creation.",
    tag: "VER-01 · VER-02 · VER-04",
  },
  {
    label: "06",
    title: "Mobile PWA — Camera + GPS",
    body: "Investigators submit evidence directly from the field using the installed PWA on iOS or Android. The app accesses the device camera for photo and video capture, embeds GPS coordinates, and queues submissions offline if connectivity is interrupted.",
    tag: "MOB-02 · MOB-03 · MOB-04",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // Track section through the viewport — from entering bottom to leaving top
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Layer 1 — background glow blob (slowest, barely moves)
  const bgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  // Layer 2 — section header (medium speed)
  const headerY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  // Layer 3 — card grid (fastest inner layer)
  const gridY = useTransform(scrollYProgress, [0, 1], ["-2%", "2%"]);

  return (
    <section
      ref={sectionRef}
      id="features"
      style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}
    >
      <style>
        {`
          .liquid-glass-border::before {
             content: "";
             position: absolute;
             inset: 0;
             padding: 1.4px;
             border-radius: inherit;
             background: linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0));
             -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
             -webkit-mask-composite: xor;
             mask-composite: exclude;
             pointer-events: none;
          }
        `}
      </style>

      {/* Layer 1 — decorative background glow (slowest) */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          translateX: "-50%",
          width: "60%",
          maxWidth: 700,
          height: 400,
          background:
            "radial-gradient(ellipse at center, rgba(16,185,129,0.07) 0%, transparent 70%)",
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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            y: headerY,
            willChange: "transform",
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p variants={revealVariant} custom={0} className="lp-section-label" style={{ margin: 0 }}>
            Platform Features
          </motion.p>
          <motion.h2
            variants={revealVariant}
            custom={1}
            className="lp-section-h2"
            style={{ color: "#fff", maxWidth: 520, margin: "16px auto 0" }}
          >
            Everything the forensic workflow requires
          </motion.h2>
        </motion.div>

        {/* Layer 3 — Card grid (fastest inner layer) */}
        <motion.div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
            y: gridY,
            willChange: "transform",
          }}
        >
          {features.map((f, i) => (
            <FeatureCell key={f.label} feature={f} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCell({ feature, index }: { feature: typeof features[0]; index: number }) {
  const col = index % 3;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={revealVariant}
      custom={col}
      style={{
        background: "rgba(255, 255, 255, 0.01)",
        backgroundBlendMode: "luminosity",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        borderRadius: "24px",
        position: "relative",
        padding: "40px 36px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        willChange: "transform, opacity",
      }}
      whileHover={{
        backgroundColor: "rgba(16,185,129,0.03)",
        y: -6,
        scale: 1.02,
        boxShadow: "0 16px 40px -12px rgba(16,185,129,0.2), inset 0 1px 1px rgba(16,185,129,0.3)",
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      }}
    >
      <motion.div
        className="liquid-glass-border"
        style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none" }}
        initial={{ opacity: 1 }}
        whileHover={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        style={{
          content: '""',
          position: "absolute",
          inset: 0,
          padding: "1.4px",
          borderRadius: "inherit",
          background: "linear-gradient(180deg, rgba(16,185,129,0.6), rgba(16,185,129,0))",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none",
          opacity: 0,
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <span className="lp-step-num">{feature.label}</span>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: "#fff", lineHeight: 1.3, margin: 0 }}>
          {feature.title}
        </h3>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.42)", lineHeight: 1.7, margin: 0, flex: 1 }}>
          {feature.body}
        </p>
        <span
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.04em",
            marginTop: 8,
          }}
        >
          {feature.tag}
        </span>
      </div>
    </motion.div>
  );
}
