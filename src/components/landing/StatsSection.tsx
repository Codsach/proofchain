"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

// ── KPI Card data — brand-labeled, colour-coordinated ──
const kpiCards = [
  {
    tag: "INTEGRITY",
    value: "100%",
    label: "Evidence Integrity",
    sublabel: "Cryptographically guaranteed",
    color: "#059669",
    colorDim: "rgba(5,150,105,0.10)",
    colorMid: "rgba(5,150,105,0.06)",
    colorGlow: "rgba(5,150,105,0.18)",
    shadowGlow: "rgba(5,150,105,0.15)",
    // Mini sparkline data: trending upward to 100%
    sparkPath: "M0,28 C8,26 16,22 24,18 C32,14 40,10 48,6 C56,2 62,1 68,0",
    sparkWidth: 68,
    sparkHeight: 30,
    trend: "+100%",
    trendUp: true,
  },
  {
    tag: "LATENCY",
    value: "< 2s",
    label: "Hash Verification",
    sublabel: "Real-time audit trail",
    color: "#d97706",
    colorDim: "rgba(217,119,6,0.10)",
    colorMid: "rgba(217,119,6,0.06)",
    colorGlow: "rgba(217,119,6,0.18)",
    shadowGlow: "rgba(217,119,6,0.15)",
    // Mini sparkline data: fast drop (good = low latency)
    sparkPath: "M0,28 C8,26 14,22 20,16 C28,8 36,4 48,3 C58,2 62,2 68,2",
    sparkWidth: 68,
    sparkHeight: 30,
    trend: "< 2s",
    trendUp: true,
  },
  {
    tag: "IMMUTABILITY",
    value: "∞",
    label: "Immutable Record",
    sublabel: "Blockchain anchored forever",
    color: "#6366f1",
    colorDim: "rgba(99,102,241,0.10)",
    colorMid: "rgba(99,102,241,0.06)",
    colorGlow: "rgba(99,102,241,0.18)",
    shadowGlow: "rgba(99,102,241,0.15)",
    // Mini sparkline data: flat perfect line (immutable = no change)
    sparkPath: "M0,14 C10,14 20,14 30,14 C42,14 54,14 68,14",
    sparkWidth: 68,
    sparkHeight: 30,
    trend: "Forever",
    trendUp: true,
  },
  {
    tag: "SECURITY",
    value: "3-Layer",
    label: "Security Model",
    sublabel: "Encrypt · Hash · Chain",
    color: "#10b981",
    colorDim: "rgba(16,185,129,0.10)",
    colorMid: "rgba(16,185,129,0.06)",
    colorGlow: "rgba(16,185,129,0.18)",
    shadowGlow: "rgba(16,185,129,0.15)",
    // Mini sparkline data: stacked layers rising
    sparkPath: "M0,28 C10,24 16,20 24,15 C34,9 44,6 54,3 C60,2 64,1 68,0",
    sparkWidth: 68,
    sparkHeight: 30,
    trend: "↑ Layered",
    trendUp: true,
  },
];

const logos = [
  { name: "Polygon", icon: "⬡", color: "#8247e5" },
  { name: "IPFS", icon: "⊕", color: "#0ea5e9" },
  { name: "Gemini AI", icon: "◯", color: "#059669" },
  { name: "SHA-256", icon: "⬢", color: "#d97706" },
  { name: "ERC-721", icon: "◈", color: "#10b981" },
];

const cardVariant = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const logoVariant = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: 0.3 + i * 0.07, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      ref={sectionRef}
      className="py-20 px-6 relative overflow-hidden"
    >
      {/* Top separator */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(5,150,105,0.25), transparent)" }}
      />

      <div className="max-w-6xl mx-auto">

        {/* ── Section label ── */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lp-section-label text-center mb-12"
        >
          Platform Metrics
        </motion.p>

        {/* ── KPI Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {kpiCards.map((card, i) => (
            <KpiCard key={card.tag} card={card} index={i} isInView={isInView} />
          ))}
        </div>

        {/* ── Tech Logo Strip ── */}
        <div
          className="flex items-center justify-center flex-wrap gap-3"
          style={{
            padding: "16px 24px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(15,23,42,0.07)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontFamily: "var(--font-geist-mono, monospace)",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginRight: 8,
              whiteSpace: "nowrap",
            }}
          >
            Powered by
          </span>
          {logos.map((l, i) => (
            <motion.div
              key={l.name}
              custom={i}
              variants={logoVariant}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="flex items-center gap-2"
              style={{
                padding: "5px 14px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.80)",
                border: "1px solid rgba(15,23,42,0.08)",
                transition: "all 0.3s ease",
              }}
              whileHover={{
                background: "rgba(255,255,255,0.98)",
                borderColor: `${l.color}30`,
                y: -2,
                transition: { duration: 0.2 },
              }}
            >
              <span style={{ color: l.color, fontSize: "1rem", lineHeight: 1 }}>{l.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--lp-gray-2)",
                  fontFamily: "var(--font-geist-mono, monospace)",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                {l.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom separator */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(15,23,42,0.07), transparent)" }}
      />
    </section>
  );
}

// ── Individual KPI Card ──
function KpiCard({
  card,
  index,
  isInView,
}: {
  card: typeof kpiCards[0];
  index: number;
  isInView: boolean;
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariant}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="kpi-card group"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid rgba(15,23,42,0.09)`,
        borderRadius: 20,
        padding: "28px 24px 24px",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        boxShadow: "0 4px 20px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}
      whileHover={{
        y: -7,
        scale: 1.02,
        boxShadow: `0 20px 48px -12px ${card.shadowGlow}, 0 0 0 1px ${card.color}22, inset 0 1px 0 rgba(255,255,255,1)`,
        borderColor: `${card.color}35`,
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
      }}
    >
      {/* Top accent line — per-card colour */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "15%",
          right: "15%",
          height: 2,
          background: `linear-gradient(90deg, transparent, ${card.color}, transparent)`,
          borderRadius: "0 0 4px 4px",
          opacity: 0.75,
          transition: "opacity 0.4s ease",
        }}
        className="group-hover:opacity-100"
      />

      {/* Inner glow wash on hover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 0%, ${card.colorMid} 0%, transparent 65%)`,
          opacity: 0,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
          borderRadius: 20,
        }}
        className="group-hover:opacity-100"
      />

      {/* Shimmer sweep on hover */}
      <div className="kpi-shimmer-sweep" />

      {/* ── Brand Tag ── */}
      <div className="relative z-10">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 9px",
            borderRadius: 6,
            background: card.colorDim,
            border: `1px solid ${card.color}25`,
            marginBottom: 18,
          }}
        >
          {/* Pulsing dot */}
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: card.color,
              boxShadow: `0 0 6px ${card.color}`,
              display: "inline-block",
              flexShrink: 0,
              animation: "badge-glow 2.2s infinite alternate",
            }}
          />
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: card.color,
              fontFamily: "var(--font-geist-mono, monospace)",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
            }}
          >
            {card.tag}
          </span>
        </div>

        {/* ── Metric Value ── */}
        <div
          className="font-heading"
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            marginBottom: 8,
            background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}bb 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {card.value}
        </div>

        {/* ── Label ── */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--lp-gray-1)",
            marginBottom: 4,
            letterSpacing: "-0.005em",
          }}
        >
          {card.label}
        </div>

        {/* ── Sublabel ── */}
        <div
          style={{
            fontSize: 10,
            color: "var(--lp-gray-3)",
            fontFamily: "var(--font-geist-mono, monospace)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 20,
          }}
        >
          {card.sublabel}
        </div>

        {/* ── Divider ── */}
        <div
          style={{
            height: 1,
            background: "rgba(15,23,42,0.07)",
            marginBottom: 16,
          }}
        />

        {/* ── Sparkline Row ── */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {/* SVG mini sparkline */}
          <svg
            width={card.sparkWidth}
            height={card.sparkHeight}
            viewBox={`0 0 ${card.sparkWidth} ${card.sparkHeight}`}
            fill="none"
            style={{ overflow: "visible" }}
          >
            {/* Gradient fill below line */}
            <defs>
              <linearGradient id={`spark-fill-${card.tag}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={card.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={card.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Fill area */}
            <path
              d={`${card.sparkPath} L${card.sparkWidth},${card.sparkHeight} L0,${card.sparkHeight} Z`}
              fill={`url(#spark-fill-${card.tag})`}
            />
            {/* Line */}
            <path
              d={card.sparkPath}
              stroke={card.color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* End dot */}
            <circle
              cx={card.sparkWidth}
              cy={card.sparkPath.split(" ").pop()?.replace("L","").replace("C","") === undefined ? 14 : (() => {
                // Parse last Y from path
                const parts = card.sparkPath.split(",");
                return parseFloat(parts[parts.length - 1] || "14");
              })()}
              r={2.5}
              fill={card.color}
              style={{ filter: `drop-shadow(0 0 3px ${card.color})` }}
            />
          </svg>

          {/* Trend badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 6,
              background: card.colorDim,
              border: `1px solid ${card.color}20`,
            }}
          >
            <span style={{ fontSize: 9, color: card.color, fontWeight: 700 }}>↑</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: card.color,
                fontFamily: "var(--font-geist-mono, monospace)",
                letterSpacing: "0.05em",
              }}
            >
              {card.trend}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
