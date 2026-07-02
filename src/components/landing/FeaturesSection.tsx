"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { Database, Bot, History, Gavel, QrCode, Smartphone } from "lucide-react";

const revealVariant: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

// ── Feature data — same content, richer identity ──
const heroFeatures = [
  {
    label: "01",
    title: "IPFS + Blockchain Anchoring",
    body: "Every submitted file is stored on IPFS and given a content-addressed CID. Its SHA-256 hash, CID, and Unix timestamp are anchored to the Polygon Amoy blockchain within 60 seconds.",
    Icon: Database,
    color: "#059669",
    colorDim: "rgba(5,150,105,0.10)",
    colorLight: "rgba(5,150,105,0.06)",
    iconBg: "rgba(5,150,105,0.10)",
    gradientFrom: "rgba(5,150,105,0.04)",
    tag: "Immutability",
  },
  {
    label: "02",
    title: "AI Tamper Analysis",
    body: "An automated pipeline runs on every submission: ExifTool extracts metadata. Gemini Vision API scans for lighting inconsistencies, cloning artifacts, and splicing boundaries — producing a 0–100 tamper score.",
    Icon: Bot,
    color: "#8b5cf6",
    colorDim: "rgba(139,92,246,0.10)",
    colorLight: "rgba(139,92,246,0.05)",
    iconBg: "rgba(139,92,246,0.10)",
    gradientFrom: "rgba(139,92,246,0.04)",
    tag: "AI Powered",
  },
];

const supportingFeatures = [
  {
    label: "03",
    title: "Chain-of-Custody",
    body: "Every handoff of evidence between investigators and analysts is cryptographically signed and immutably recorded.",
    Icon: History,
    color: "#10b981",
    colorDim: "rgba(16,185,129,0.10)",
    iconBg: "rgba(16,185,129,0.10)",
    tag: "Signed Transfers",
  },
  {
    label: "04",
    title: "On-Chain Verdict",
    body: "Analysts issue a signed verdict with a mandatory written reason. The verdict hash is recorded in the smart contract.",
    Icon: Gavel,
    color: "#3b82f6",
    colorDim: "rgba(59,130,246,0.10)",
    iconBg: "rgba(59,130,246,0.10)",
    tag: "Cryptographic",
  },
  {
    label: "05",
    title: "Public QR Verification",
    body: "Anyone can verify the on-chain hash, submission timestamp, transfer count, and verdict status — no login required.",
    Icon: QrCode,
    color: "#d97706",
    colorDim: "rgba(217,119,6,0.10)",
    iconBg: "rgba(217,119,6,0.10)",
    tag: "Open Verification",
  },
  {
    label: "06",
    title: "Mobile PWA",
    body: "Investigators submit evidence directly from the field using the installed PWA. Camera access and offline queuing built in.",
    Icon: Smartphone,
    color: "#06b6d4",
    colorDim: "rgba(6,182,212,0.10)",
    iconBg: "rgba(6,182,212,0.10)",
    tag: "Field Ready",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY     = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const headerY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const gridY   = useTransform(scrollYProgress, [0, 1], ["-2%", "2%"]);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="py-[128px] px-6 relative overflow-hidden font-sans"
      style={{ background: "transparent" }}
    >
      {/* Very soft section ambient — no heavy circles */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: "0%",
          left: "50%",
          translateX: "-50%",
          width: "55%",
          maxWidth: 680,
          height: 420,
          background: "radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, rgba(5,150,105,0.02) 50%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
          y: bgY,
          willChange: "transform",
        }}
      />

      {/* Decorative node network graphic */}
      <svg
        className="absolute top-12 left-10 w-96 h-96 opacity-[0.025] pointer-events-none"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="3" fill="var(--lp-gray-1)" />
        <circle cx="200" cy="80" r="3" fill="var(--lp-gray-1)" />
        <circle cx="350" cy="120" r="3" fill="var(--lp-gray-1)" />
        <circle cx="100" cy="220" r="3" fill="var(--lp-gray-1)" />
        <circle cx="280" cy="260" r="3" fill="var(--lp-gray-1)" />
        <circle cx="180" cy="350" r="3" fill="var(--lp-gray-1)" />
        <line x1="50" y1="50" x2="200" y2="80" stroke="var(--lp-gray-1)" strokeWidth="1" />
        <line x1="200" y1="80" x2="350" y2="120" stroke="var(--lp-gray-1)" strokeWidth="1" />
        <line x1="50" y1="50" x2="100" y2="220" stroke="var(--lp-gray-1)" strokeWidth="1" />
        <line x1="100" y1="220" x2="280" y2="260" stroke="var(--lp-gray-1)" strokeWidth="1" />
        <line x1="200" y1="80" x2="100" y2="220" stroke="var(--lp-gray-1)" strokeWidth="1" />
        <line x1="280" y1="260" x2="180" y2="350" stroke="var(--lp-gray-1)" strokeWidth="1" />
        <line x1="350" y1="120" x2="280" y2="260" stroke="var(--lp-gray-1)" strokeWidth="1" />
      </svg>

      <div className="max-w-[1200px] mx-auto relative z-10">
        {/* ── Section header ── */}
        <motion.div
          style={{ marginBottom: 80, y: headerY, willChange: "transform" }}
          className="flex flex-col items-center text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p
            variants={revealVariant}
            custom={0}
            className="lp-section-label mb-4"
          >
            Platform Features
          </motion.p>
          <motion.h2
            variants={revealVariant}
            custom={1}
            className="font-heading font-bold max-w-[580px] leading-tight"
            style={{ color: "var(--lp-gray-1)", fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.025em" }}
          >
            Every Layer.{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Cryptographically Proven.
            </span>
          </motion.h2>
          <motion.p
            variants={revealVariant}
            custom={2}
            className="font-sans text-base mt-5 max-w-[460px] leading-relaxed"
            style={{ color: "var(--lp-gray-3)" }}
          >
            Six interlocking layers from capture to verdict — each one immutable, each one verifiable.
          </motion.p>
        </motion.div>

        <motion.div
          style={{ y: gridY, willChange: "transform" }}
        >
          {/* ── Hero feature cards — 2-col, large ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {heroFeatures.map((f, i) => (
              <HeroFeatureCard key={f.label} feature={f} index={i} />
            ))}
          </div>

          {/* ── Supporting cards — 4-col, compact ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {supportingFeatures.map((f, i) => (
              <SupportingCard key={f.label} feature={f} index={i} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Large hero feature card (2 of them) ──
function HeroFeatureCard({ feature, index }: { feature: typeof heroFeatures[0]; index: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="bento-glass-lg group feature-card-border-animated"
      style={{
        padding: "40px 40px 36px",
        background: `linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, ${feature.color}03 60%, ${feature.color}09 100%)`,
        borderColor: `${feature.color}14`,
        "--card-accent-grad": `linear-gradient(135deg, ${feature.color}00 0%, ${feature.color}35 50%, ${feature.color}00 100%)`
      } as React.CSSProperties}
      whileHover="hover"
      animate="rest"
      variants={{
        hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
        visible: {
          opacity: 1, y: 0, filter: "blur(0px)",
          transition: { duration: 0.85, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] as const },
        },
        hover: {
          y: -7,
          scale: 1.012,
          boxShadow: `
            0 2px 6px rgba(15,23,42,0.04),
            0 20px 56px rgba(15,23,42,0.10),
            0 0 0 1px ${feature.color}18,
            inset 0 1px 0 rgba(255,255,255,1)
          `,
          borderColor: `${feature.color}28`,
          transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
        },
        rest: {
          y: 0,
          scale: 1,
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03), 0 8px 24px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 1)",
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
          background: `radial-gradient(circle, ${feature.color}15 0%, transparent 70%)`,
          filter: "blur(24px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Top accent gradient */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, height: 80,
          background: `radial-gradient(ellipse at 50% 0%, ${feature.gradientFrom} 0%, transparent 75%)`,
          borderRadius: "24px 24px 0 0",
          pointerEvents: "none",
        }}
      />

      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0, left: "12%", right: "12%", height: 1,
          background: `linear-gradient(90deg, transparent, ${feature.color}45, transparent)`,
          borderRadius: "50%",
        }}
      />

      <div className="relative z-10 flex flex-col gap-5 h-full">
        {/* Header row */}
        <div className="flex items-start justify-between">
          {/* Icon with colored background */}
          <motion.div
            className="feature-icon-bg"
            style={{
              background: feature.iconBg,
              border: `1px solid ${feature.color}22`,
            }}
            variants={{
              hover: { scale: 1.1, rotate: 6, y: -2, transition: { duration: 0.3 } }
            }}
          >
            <feature.Icon size={22} style={{ color: feature.color }} />
          </motion.div>

          {/* Tag pill */}
          <span
            style={{
              fontSize: 9, fontWeight: 700,
              fontFamily: "var(--font-geist-mono, monospace)",
              color: feature.color,
              background: feature.colorDim,
              border: `1px solid ${feature.color}22`,
              padding: "4px 10px", borderRadius: 99,
              textTransform: "uppercase", letterSpacing: "0.12em",
            }}
          >
            {feature.tag}
          </span>
        </div>

        {/* Number label */}
        <span
          style={{
            fontSize: 9, fontWeight: 700,
            fontFamily: "var(--font-geist-mono, monospace)",
            color: `${feature.color}70`,
            textTransform: "uppercase", letterSpacing: "0.20em",
          }}
        >
          {feature.label}
        </span>

        {/* Title */}
        <h3
          className="font-heading font-bold leading-tight"
          style={{
            color: "var(--lp-gray-1)",
            fontSize: "clamp(1.2rem, 2vw, 1.5rem)",
            letterSpacing: "-0.02em",
            marginTop: -8,
          }}
        >
          {feature.title}
        </h3>

        {/* Body */}
        <p
          className="font-sans leading-relaxed flex-1"
          style={{ color: "var(--lp-gray-2)", fontSize: 14, lineHeight: 1.75 }}
        >
          {feature.body}
        </p>

        {/* Decorative bottom rule */}
        <div
          style={{
            height: 1,
            background: `linear-gradient(90deg, ${feature.color}22, transparent)`,
            marginTop: 8,
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
      </div>
    </motion.div>
  );
}

// ── Compact supporting card (4 of them) ──
function SupportingCard({ feature, index }: { feature: typeof supportingFeatures[0]; index: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="bento-glass group feature-card-border-animated"
      style={{
        padding: "28px 24px",
        background: `linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, ${feature.color}02 60%, ${feature.color}08 100%)`,
        borderColor: `${feature.color}12`,
        "--card-accent-grad": `linear-gradient(135deg, ${feature.color}00 0%, ${feature.color}35 50%, ${feature.color}00 100%)`
      } as React.CSSProperties}
      whileHover="hover"
      animate="rest"
      variants={{
        hidden: { opacity: 0, y: 24, filter: "blur(5px)" },
        visible: {
          opacity: 1, y: 0, filter: "blur(0px)",
          transition: { duration: 0.75, delay: 0.2 + index * 0.08, ease: [0.16, 1, 0.3, 1] as const },
        },
        hover: {
          y: -5,
          scale: 1.02,
          boxShadow: `
            0 2px 6px rgba(15,23,42,0.04),
            0 14px 36px rgba(15,23,42,0.08),
            0 0 0 1px ${feature.color}16,
            inset 0 1px 0 rgba(255,255,255,1)
          `,
          borderColor: `${feature.color}22`,
          transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
        },
        rest: {
          y: 0,
          scale: 1,
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 12px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1)",
          transition: { duration: 0.35 }
        }
      }}
    >
      {/* Glow layer behind card content */}
      <div
        style={{
          position: "absolute",
          bottom: -30,
          right: -30,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${feature.color}12 0%, transparent 70%)`,
          filter: "blur(18px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Top accent */}
      <div
        style={{
          position: "absolute",
          top: 0, left: "18%", right: "18%", height: 1,
          background: `linear-gradient(90deg, transparent, ${feature.color}40, transparent)`,
          borderRadius: "50%",
        }}
      />

      <div className="relative z-10 flex flex-col gap-4 h-full">
        {/* Icon with colored background */}
        <motion.div
          className="feature-icon-bg"
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: feature.iconBg,
            border: `1px solid ${feature.color}20`,
          }}
          variants={{
            hover: { scale: 1.1, rotate: 6, y: -2, transition: { duration: 0.3 } }
          }}
        >
          <feature.Icon size={18} style={{ color: feature.color }} />
        </motion.div>

        <div>
          {/* Number label */}
          <span
            style={{
              display: "block", fontSize: 8, fontWeight: 700,
              fontFamily: "var(--font-geist-mono, monospace)",
              color: `${feature.color}70`,
              textTransform: "uppercase", letterSpacing: "0.18em",
              marginBottom: 6,
            }}
          >
            {feature.label}
          </span>

          {/* Title */}
          <h3
            className="font-heading font-bold leading-tight"
            style={{
              color: "var(--lp-gray-1)",
              fontSize: "1rem",
              letterSpacing: "-0.015em",
              marginBottom: 8,
            }}
          >
            {feature.title}
          </h3>

          {/* Body */}
          <p
            className="font-sans leading-relaxed"
            style={{ color: "var(--lp-gray-3)", fontSize: 12.5, lineHeight: 1.7 }}
          >
            {feature.body}
          </p>
        </div>

        {/* Tag */}
        <div style={{ marginTop: "auto" }}>
          <span
            style={{
              fontSize: 8, fontWeight: 600,
              fontFamily: "var(--font-geist-mono, monospace)",
              color: feature.color,
              background: feature.colorDim,
              border: `1px solid ${feature.color}20`,
              padding: "3px 9px", borderRadius: 99,
              textTransform: "uppercase", letterSpacing: "0.10em",
            }}
          >
            {feature.tag}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
