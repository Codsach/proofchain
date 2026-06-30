"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const metrics = [
  {
    value: "< 60s",
    label: "Blockchain Anchoring",
    sub: "Polygon Amoy · ~2s finality",
    color: "#059669",
  },
  {
    value: "SHA-256",
    label: "Cryptographic Hash",
    sub: "Industry standard fingerprint",
    color: "#d97706",
  },
  {
    value: "Zero",
    label: "Evidence Deletions",
    sub: "Hard-blocked at API layer",
    color: "#10b981",
  },
  {
    value: "3",
    label: "Access Roles",
    sub: "Investigator · Analyst · Admin",
    color: "#059669",
  },
  {
    value: "IPFS",
    label: "Decentralised Storage",
    sub: "Content-addressed CID",
    color: "#b45309",
  },
  {
    value: "AI",
    label: "Tamper Detection",
    sub: "Gemini Vision API · ExifTool",
    color: "#047857",
  },
];

const techBadges = [
  { label: "Polygon Amoy", dot: "#8247e5" },
  { label: "IPFS", dot: "#0ea5e9" },
  { label: "Gemini AI", dot: "#059669" },
  { label: "ERC-721", dot: "#d97706" },
  { label: "SHA-256", dot: "#10b981" },
  { label: "ExifTool", dot: "#64748b" },
];

export default function TrustSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <div
      ref={sectionRef}
      style={{ background: "transparent", position: "relative", overflow: "hidden" }}
    >
      {/* Top rule with emerald accent */}
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent 0%, rgba(5,150,105,0.3) 30%, rgba(5,150,105,0.3) 70%, transparent 100%)",
          boxShadow: "0 0 12px rgba(5,150,105,0.10)",
        }}
      />

      <motion.div style={{ y, willChange: "transform" }}>
        {/* ── Metrics grid ── */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "72px 24px 60px",
          }}
        >
          {/* Section label */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lp-section-label text-center mb-10"
          >
            Platform Guarantees
          </motion.p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 1,
              border: "1px solid rgba(15,23,42,0.08)",
              borderRadius: 24,
              overflow: "hidden",
              background: "rgba(15,23,42,0.05)",
            }}
          >
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  padding: "32px 28px",
                  background: "rgba(255,255,255,0.75)",
                  borderRight: "1px solid rgba(15,23,42,0.06)",
                  borderBottom: "1px solid rgba(15,23,42,0.06)",
                  transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                  cursor: "default",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `rgba(255,255,255,0.95)`;
                  el.style.boxShadow = `inset 0 0 0 1px ${m.color}22`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.75)";
                  el.style.boxShadow = "none";
                }}
              >
                {/* Top micro-accent */}
                <div
                  style={{
                    position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
                    background: `linear-gradient(90deg, transparent, ${m.color}60, transparent)`,
                  }}
                />
                <div
                  className="font-heading"
                  style={{
                    fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                    fontWeight: 800,
                    color: m.color,
                    lineHeight: 1,
                    marginBottom: 8,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {m.value}
                </div>
                <div
                  style={{
                    fontSize: 12, fontWeight: 600,
                    color: "var(--lp-gray-1)",
                    marginBottom: 4,
                    letterSpacing: "0.01em",
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--lp-gray-3)",
                    fontFamily: "var(--font-geist-mono, monospace)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {m.sub}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Tech badge strip ── */}
        <div
          style={{
            borderTop: "1px solid rgba(15,23,42,0.07)",
            borderBottom: "1px solid rgba(15,23,42,0.07)",
            padding: "18px 24px",
            background: "rgba(255,255,255,0.50)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px 16px",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 9, fontFamily: "var(--font-geist-mono, monospace)",
                color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.2em",
                marginRight: 8,
                whiteSpace: "nowrap",
              }}
            >
              Built with
            </span>
            {techBadges.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px",
                  borderRadius: 99,
                  border: "1px solid rgba(15,23,42,0.08)",
                  background: "rgba(255,255,255,0.72)",
                }}
              >
                <span
                  style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: t.dot,
                    boxShadow: `0 0 5px ${t.dot}80`,
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

      {/* Bottom rule */}
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent 0%, rgba(15,23,42,0.08) 30%, rgba(15,23,42,0.08) 70%, transparent 100%)",
        }}
      />
    </div>
  );
}
