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
  },
  {
    label: "02",
    title: "AI Tamper Analysis",
    body: "An automated pipeline runs on every submission: ExifTool extracts metadata. Gemini Vision API scans for lighting inconsistencies, cloning artifacts, and splicing boundaries.",
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-2",
    Icon: Bot,
  },
  {
    label: "03",
    title: "Chain-of-Custody",
    body: "Every handoff of evidence between investigators and analysts is cryptographically signed.",
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
    Icon: History,
  },
  {
    label: "04",
    title: "On-Chain Verdict",
    body: "Analysts issue a signed verdict with a mandatory written reason. The verdict hash is recorded in the smart contract.",
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
    Icon: Gavel,
  },
  {
    label: "05",
    title: "Public QR Verification",
    body: "Every submission has a public verification URL requiring no login. Anyone can verify the on-chain hash, submission timestamp, transfer count, and verdict status.",
    colSpan: "md:col-span-1",
    rowSpan: "md:row-span-1",
    Icon: QrCode,
  },
  {
    label: "06",
    title: "Mobile PWA",
    body: "Investigators submit evidence directly from the field using the installed PWA. The app accesses the device camera and queues submissions offline.",
    colSpan: "md:col-span-2", // Fills the remaining 2 columns in Row 3
    rowSpan: "md:row-span-1",
    Icon: Smartphone,
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
      className="bg-[#041a11] py-[120px] px-6 relative overflow-hidden font-sans"
    >
      <style>
        {`
          .bento-glass {
             background: rgba(255, 255, 255, 0.03);
             backdrop-filter: blur(12px);
             -webkit-backdrop-filter: blur(12px);
             border: 1px solid rgba(255, 255, 255, 0.08);
             border-radius: 24px;
          }
          .bento-glass:hover {
             border-color: rgba(194, 163, 50, 0.3);
             background: rgba(194, 163, 50, 0.05);
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
            "radial-gradient(ellipse at center, rgba(194, 163, 50, 0.05) 0%, rgba(161, 133, 37, 0.03) 50%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
          y: bgY,
          willChange: "transform",
        }}
      />

      <div className="max-w-[1120px] mx-auto relative z-10">
        {/* Layer 2 — Header (medium parallax) */}
        <motion.div
          style={{
            marginBottom: 80,
            y: headerY,
            willChange: "transform",
          }}
          className="flex flex-col items-center text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p variants={revealVariant} custom={0} className="text-[var(--lp-accent)] font-semibold text-sm tracking-wider uppercase mb-4">
            Platform Features
          </motion.p>
          <motion.h2
            variants={revealVariant}
            custom={1}
            className="font-heading text-4xl md:text-5xl font-bold text-white max-w-[520px]"
          >
            Bento Grid Showcase
          </motion.h2>
        </motion.div>

        {/* Layer 3 — Bento Card grid */}
        <motion.div
          style={{
            y: gridY,
            willChange: "transform",
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min"
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
      className={`bento-glass relative p-8 md:p-10 flex flex-col gap-4 transition-colors duration-300 ${feature.colSpan} ${feature.rowSpan}`}
      whileHover={{
        y: -6,
        scale: 1.02,
        boxShadow: "0 24px 48px -12px rgba(194, 163, 50, 0.15), inset 0 1px 1px rgba(194, 163, 50, 0.3)",
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
      }}
    >
      <div className="relative z-10 flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <span className="text-[var(--lp-accent)]/80 font-mono text-sm tracking-widest">{feature.label}</span>
          <feature.Icon className="text-[var(--lp-accent)]/60" size={24} />
        </div>
        <h3 className="font-heading text-xl md:text-2xl font-bold text-white leading-tight">
          {feature.title}
        </h3>
        <p className="font-sans text-slate-300/80 text-sm md:text-base leading-relaxed flex-1">
          {feature.body}
        </p>
      </div>
    </motion.div>
  );
}
