"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const metrics = [
  {
    value: "< 60s",
    label: "Blockchain Anchoring",
    sub: "Polygon Amoy · ~2s finality",
    color: "#00f59b",
  },
  {
    value: "SHA-256",
    label: "Cryptographic Hash",
    sub: "Industry standard fingerprint",
    color: "#f59e0b",
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
    color: "#00f59b",
  },
  {
    value: "IPFS",
    label: "Decentralised Storage",
    sub: "Content-addressed CID",
    color: "#d97706",
  },
  {
    value: "AI",
    label: "Tamper Detection",
    sub: "Gemini Vision API · ExifTool",
    color: "#059669",
  },
];

const techBadges = [
  { label: "Polygon Amoy", dot: "#8247e5" },
  { label: "IPFS", dot: "#65c2cb" },
  { label: "Gemini AI", dot: "#00f59b" },
  { label: "ERC-721", dot: "#f59e0b" },
  { label: "SHA-256", dot: "#10b981" },
  { label: "ExifTool", dot: "#e2e2e2" },
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
      {/* Top rule with glow */}
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent 0%, rgba(0,245,155,0.3) 30%, rgba(0,245,155,0.3) 70%, transparent 100%)",
          boxShadow: "0 0 16px rgba(0,245,155,0.15)",
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
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 24,
              overflow: "hidden",
              background: "rgba(255,255,255,0.03)",
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
                  background: "rgba(0,0,0,0.4)",
                  borderRight: "1px solid rgba(255,255,255,0.04)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                  cursor: "default",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `${m.color}08`;
                  el.style.borderColor = `${m.color}20`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(0,0,0,0.4)";
                  el.style.borderColor = "rgba(255,255,255,0.04)";
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
                    textShadow: `0 0 20px ${m.color}40`,
                  }}
                >
                  {m.value}
                </div>
                <div
                  style={{
                    fontSize: 12, fontWeight: 600,
                    color: "rgba(255,255,255,0.88)",
                    marginBottom: 4,
                    letterSpacing: "0.01em",
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.50)",
                    fontFamily: "monospace",
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
            borderTop: "1px solid rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            padding: "18px 24px",
            background: "rgba(255,255,255,0.01)",
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
                fontSize: 9, fontFamily: "monospace",
                color: "rgba(255,255,255,0.25)",
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
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <span
                  style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: t.dot,
                    boxShadow: `0 0 6px ${t.dot}`,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11, fontWeight: 500,
                    color: "rgba(255,255,255,0.65)",
                    fontFamily: "monospace",
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
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.05) 70%, transparent 100%)",
        }}
      />
    </div>
  );
}
