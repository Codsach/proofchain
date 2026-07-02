"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

// ── Count-up hook ──
function useCountUp(target: number, duration: number = 1800, isActive: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    let start = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, isActive]);

  return count;
}

const stats = [
  {
    value: 99.98,
    displayValue: "99.98",
    suffix: "%",
    label: "Evidence Integrity",
    sub: "Cryptographically guaranteed",
    color: "#059669",
    isDecimal: true,
  },
  {
    value: 60,
    displayValue: "<60",
    suffix: "s",
    label: "Blockchain Anchoring",
    sub: "Polygon Amoy · ~2s finality",
    color: "#3b82f6",
    isDecimal: false,
    prefix: "<",
    noCount: true,
  },
  {
    value: 100,
    displayValue: "100",
    suffix: "%",
    label: "Chain of Custody",
    sub: "Immutable transfer records",
    color: "#10b981",
    isDecimal: false,
  },
  {
    value: 12,
    displayValue: "12",
    suffix: "+",
    label: "AI Detection Signals",
    sub: "EXIF · Gemini Vision · Heuristics",
    color: "#8b5cf6",
    isDecimal: false,
  },
  {
    value: 24,
    displayValue: "24/7",
    suffix: "",
    label: "Public Verification",
    sub: "No login required",
    color: "#d97706",
    isDecimal: false,
    noCount: true,
  },
  {
    value: 0,
    displayValue: "Zero",
    suffix: "",
    label: "Evidence Deletions",
    sub: "Hard-blocked at API layer",
    color: "#059669",
    isDecimal: false,
    noCount: true,
  },
];

const techBadges = [
  { label: "Polygon Amoy", dot: "#8247e5" },
  { label: "IPFS",         dot: "#0ea5e9" },
  { label: "Gemini AI",    dot: "#059669" },
  { label: "ERC-721",      dot: "#d97706" },
  { label: "SHA-256",      dot: "#10b981" },
  { label: "ExifTool",     dot: "#64748b" },
];

export default function TrustSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView   = useInView(sectionRef, { once: true, margin: "-80px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-3%", "3%"]);

  return (
    <div
      ref={sectionRef}
      style={{ background: "transparent", position: "relative", overflow: "hidden" }}
    >
      {/* Top separator */}
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.20) 30%, rgba(16,185,129,0.20) 70%, transparent 100%)",
        }}
      />

      <motion.div style={{ y, willChange: "transform" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "96px 24px 72px",
          }}
        >
          {/* Section label */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lp-section-label text-center mb-4"
          >
            Platform Guarantees
          </motion.p>

          {/* Section heading */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading font-bold text-center mb-20"
            style={{
              color: "var(--lp-gray-1)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}
          >
            Numbers that define{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              trust.
            </span>
          </motion.h2>

          {/* ── Editorial stats grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 0,
            }}
            className="stats-grid"
          >
            {stats.map((stat, i) => (
              <StatItem key={stat.label} stat={stat} index={i} isInView={isInView} />
            ))}
          </div>

          {/* Bottom sub-text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mt-16"
            style={{
              fontSize: 11,
              color: "rgba(15,23,42,0.32)",
              fontFamily: "var(--font-geist-mono, monospace)",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
            }}
          >
            Every number is cryptographically enforced — not a marketing claim
          </motion.p>
        </div>

        {/* ── Tech badge strip ── */}
        <div
          style={{
            borderTop: "1px solid rgba(15,23,42,0.06)",
            borderBottom: "1px solid rgba(15,23,42,0.06)",
            padding: "16px 24px",
            background: "rgba(255,255,255,0.40)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px 14px",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 9, fontFamily: "var(--font-geist-mono, monospace)",
                color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.20em",
                marginRight: 8, whiteSpace: "nowrap",
              }}
            >
              Built with
            </span>
            {techBadges.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.45, delay: 0.5 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px",
                  borderRadius: 99,
                  border: "1px solid rgba(15,23,42,0.07)",
                  background: "rgba(255,255,255,0.80)",
                  transition: "all 0.2s ease",
                  cursor: "default",
                }}
                whileHover={{
                  background: "rgba(255,255,255,0.98)",
                  y: -1,
                  transition: { duration: 0.2 },
                }}
              >
                <span
                  style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: t.dot,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11, fontWeight: 500,
                    color: "var(--lp-gray-2)",
                    fontFamily: "var(--font-geist-mono, monospace)",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bottom separator */}
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent 0%, rgba(15,23,42,0.07) 30%, rgba(15,23,42,0.07) 70%, transparent 100%)",
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
}

function StatItem({
  stat,
  index,
  isInView,
}: {
  stat: typeof stats[0];
  index: number;
  isInView: boolean;
}) {
  const count = useCountUp(
    stat.isDecimal ? 9998 : Math.round(stat.value),
    1800 + index * 120,
    isInView && !stat.noCount
  );

  const isTop    = index < 3;
  const isLeft   = index % 3 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay: 0.15 + index * 0.10, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: "48px 40px",
        textAlign: "center",
        borderRight: (index % 3 !== 2) ? "1px solid rgba(15,23,42,0.07)" : "none",
        borderBottom: isTop ? "1px solid rgba(15,23,42,0.07)" : "none",
        position: "relative",
        transition: "background 0.3s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.60)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {/* Micro top accent on hover — per stat color */}
      <div
        style={{
          position: "absolute",
          top: 0, left: "25%", right: "25%",
          height: 1.5,
          background: `linear-gradient(90deg, transparent, ${stat.color}50, transparent)`,
          opacity: 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        }}
        className="stat-top-accent"
      />

      {/* Big number */}
      <div
        className="font-heading stat-number"
        style={{
          fontSize: "clamp(2.8rem, 5vw, 4rem)",
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: stat.color,
          marginBottom: 12,
          transition: "transform 0.3s ease",
        }}
      >
        {stat.noCount
          ? stat.displayValue
          : stat.isDecimal
            ? `${(count / 100).toFixed(2)}`
            : stat.prefix
              ? `${stat.prefix}${count}`
              : `${count}`
        }
        {stat.suffix && (
          <span
            style={{
              fontSize: "0.55em",
              fontWeight: 700,
              marginLeft: 2,
              opacity: 0.75,
            }}
          >
            {stat.suffix}
          </span>
        )}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--lp-gray-1)",
          marginBottom: 6,
          letterSpacing: "-0.01em",
        }}
      >
        {stat.label}
      </div>

      {/* Sublabel */}
      <div
        style={{
          fontSize: 11,
          color: "var(--lp-gray-3)",
          fontFamily: "var(--font-geist-mono, monospace)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {stat.sub}
      </div>
    </motion.div>
  );
}
