"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { Database, Bot, History, Gavel, QrCode, Smartphone } from "lucide-react";

const revealVariant: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const features = [
  {
    label: "01",
    title: "IPFS + Blockchain Anchoring",
    body: "Every submitted file is stored on IPFS and given a content-addressed CID. Its SHA-256 hash, CID, and Unix timestamp are anchored to the Polygon Amoy blockchain within 60 seconds.",
    colSpan: "md:col-span-2",
    rowSpan: "md:row-span-1",
    Icon: Database,
    color: "#00f59b",
    glowColor: "rgba(0,245,155,0.1)",
  },
  {
    label: "02",
    title: "AI Tamper Analysis",
    body: "An automated pipeline runs on every submission: ExifTool extracts metadata. Gemini Vision API scans for lighting inconsistencies, cloning artifacts, and splicing boundaries.",
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-2",
    Icon: Bot,
    color: "#f59e0b",
    glowColor: "rgba(245,158,11,0.1)",
  },
  {
    label: "03",
    title: "Chain-of-Custody",
    body: "Every handoff of evidence between investigators and analysts is cryptographically signed.",
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
    Icon: History,
    color: "#10b981",
    glowColor: "rgba(16,185,129,0.1)",
  },
  {
    label: "04",
    title: "On-Chain Verdict",
    body: "Analysts issue a signed verdict with a mandatory written reason. The verdict hash is recorded in the smart contract.",
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
    Icon: Gavel,
    color: "#00f59b",
    glowColor: "rgba(0,245,155,0.1)",
  },
  {
    label: "05",
    title: "Public QR Verification",
    body: "Every submission has a public verification URL requiring no login. Anyone can verify the on-chain hash, submission timestamp, transfer count, and verdict status.",
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
    Icon: QrCode,
    color: "#d97706",
    glowColor: "rgba(217,119,6,0.1)",
  },
  {
    label: "06",
    title: "Mobile PWA",
    body: "Investigators submit evidence directly from the field using the installed PWA. The app accesses the device camera and queues submissions offline.",
    colSpan: "md:col-span-2",
    rowSpan: "md:row-span-1",
    Icon: Smartphone,
    color: "#059669",
    glowColor: "rgba(5,150,105,0.1)",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const headerY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const gridY = useTransform(scrollYProgress, [0, 1], ["-2%", "2%"]);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="py-[120px] px-6 relative overflow-hidden font-sans"
      style={{ background: "transparent" }}
    >
      {/* Ambient emerald glow */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: "5%",
          left: "50%",
          translateX: "-50%",
          width: "65%",
          maxWidth: 800,
          height: 500,
          background:
            "radial-gradient(ellipse at center, rgba(0, 245, 155, 0.06) 0%, rgba(5, 150, 105, 0.03) 50%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
          y: bgY,
          willChange: "transform",
        }}
      />

      <div className="max-w-[1200px] mx-auto relative z-10">
        {/* Header */}
        <motion.div
          style={{ marginBottom: 72, y: headerY, willChange: "transform" }}
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
            className="font-heading text-4xl md:text-5xl font-bold text-white max-w-[600px] leading-tight"
          >
            Every Layer.{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #00f59b 0%, #059669 100%)",
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
            className="font-sans text-white/55 text-base mt-4 max-w-[480px] leading-relaxed"
          >
            Six interlocking layers from capture to verdict — each one immutable, each one verifiable.
          </motion.p>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          style={{ y: gridY, willChange: "transform" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-min"
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
      className={`bento-glass relative p-8 md:p-10 flex flex-col gap-4 ${feature.colSpan} ${feature.rowSpan}`}
      whileHover={{
        y: -6,
        scale: 1.015,
        borderColor: `${feature.color}35`,
        boxShadow: `0 24px 48px -12px ${feature.glowColor}, inset 0 1px 0 ${feature.color}20`,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
      }}
    >
      {/* Top accent light — per card colour */}
      <div
        style={{
          position: "absolute",
          top: 0, left: "15%", right: "15%", height: 1,
          background: `linear-gradient(90deg, transparent, ${feature.color}60, transparent)`,
          borderRadius: "50%",
        }}
      />

      <div className="relative z-10 flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-sm tracking-widest"
            style={{ color: `${feature.color}90` }}
          >
            {feature.label}
          </span>
          <feature.Icon
            size={22}
            style={{ color: feature.color, opacity: 0.88 }}
          />
        </div>
        <h3 className="font-heading text-xl md:text-2xl font-bold text-white leading-tight">
          {feature.title}
        </h3>
        <p className="font-sans text-white/65 text-sm md:text-base leading-relaxed flex-1">
          {feature.body}
        </p>
      </div>
    </motion.div>
  );
}
