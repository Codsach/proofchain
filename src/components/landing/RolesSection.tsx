"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ShieldAlert, FileSearch, Settings, Check } from "lucide-react";

const revealVariant: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const roles = [
  {
    name: "Investigator",
    subtitle: "First Responder",
    description:
      "Submits digital evidence files collected during cyber incident response. Creates cases with incident type, date, and description. Cannot view other investigators' submissions. Cannot edit or delete any submission after creation.",
    permissions: [
      "Submit evidence files",
      "View own submissions",
      "Verify own on-chain hash",
      "Transfer evidence custody",
      "Receive verdict notifications",
    ],
    note: "Self-registration with email verification",
    accent: "#059669",
    accentDim: "rgba(5,150,105,0.10)",
    accentHover: "rgba(5,150,105,0.04)",
    borderHover: "rgba(5,150,105,0.28)",
    shadowHover: "rgba(5,150,105,0.12)",
    Icon: ShieldAlert,
  },
  {
    name: "Analyst",
    subtitle: "Forensic Examiner",
    description:
      "Reviews submissions, AI tamper reports, and EXIF analysis across all cases. Issues a signed verdict (Verified or Rejected) anchored on-chain. Cannot see investigator identity — only case content — to eliminate bias.",
    permissions: [
      "View all case submissions",
      "Access full AI tamper report",
      "Verify on-chain hash in-app",
      "Issue signed verdict",
      "Transfer evidence custody",
    ],
    note: "Account created by Admin only",
    accent: "#10b981",
    accentDim: "rgba(16,185,129,0.10)",
    accentHover: "rgba(16,185,129,0.04)",
    borderHover: "rgba(16,185,129,0.28)",
    shadowHover: "rgba(16,185,129,0.12)",
    Icon: FileSearch,
  },
  {
    name: "Admin",
    subtitle: "Evidence Custodian",
    description:
      "Manages platform accounts and views the complete audit log. Cannot modify, delete, or re-open any submission, transfer, or verdict — hard-blocked at the API layer by design. No role can delete evidence.",
    permissions: [
      "Create and deactivate analyst accounts",
      "View all cases across all statuses",
      "View full audit log with filters",
      "Receive daily summary email",
      "Cannot alter any evidence record",
    ],
    note: "Seeded at deployment · No self-registration",
    accent: "#64748b",
    accentDim: "rgba(100,116,139,0.10)",
    accentHover: "rgba(100,116,139,0.04)",
    borderHover: "rgba(100,116,139,0.25)",
    shadowHover: "rgba(100,116,139,0.12)",
    Icon: Settings,
  },
];

export default function RolesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY     = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const headerY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const cardsY  = useTransform(scrollYProgress, [0, 1], ["-2%", "2%"]);

  return (
    <div
      ref={sectionRef}
      id="roles"
      style={{
        padding: "120px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle blockchain connection graphic */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full opacity-[0.015] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="80" cy="180" r="3" fill="var(--lp-gray-1)" />
        <circle cx="240" cy="100" r="3" fill="var(--lp-gray-1)" />
        <circle cx="480" cy="220" r="3" fill="var(--lp-gray-1)" />
        <circle cx="880" cy="120" r="3" fill="var(--lp-gray-1)" />
        <circle cx="1080" cy="240" r="3" fill="var(--lp-gray-1)" />
        <circle cx="680" cy="380" r="3" fill="var(--lp-gray-1)" />
        <circle cx="920" cy="400" r="3" fill="var(--lp-gray-1)" />
        <circle cx="340" cy="420" r="3" fill="var(--lp-gray-1)" />
        
        <line x1="80" y1="180" x2="240" y2="100" stroke="var(--lp-gray-1)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="240" y1="100" x2="480" y2="220" stroke="var(--lp-gray-1)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="480" y1="220" x2="680" y2="380" stroke="var(--lp-gray-1)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="680" y1="380" x2="920" y2="400" stroke="var(--lp-gray-1)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="920" y1="400" x2="1080" y2="240" stroke="var(--lp-gray-1)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="880" y1="120" x2="1080" y2="240" stroke="var(--lp-gray-1)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="480" y1="220" x2="880" y2="120" stroke="var(--lp-gray-1)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="240" y1="100" x2="340" y2="420" stroke="var(--lp-gray-1)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="340" y1="420" x2="680" y2="380" stroke="var(--lp-gray-1)" strokeWidth="1" strokeDasharray="4 4" />
      </svg>

      {/* Emerald ambient glow — top left */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: "10%", left: "-5%",
          width: 500, height: 500,
          background: "radial-gradient(ellipse at center, rgba(5,150,105,0.07) 0%, rgba(4,120,87,0.02) 50%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
          y: bgY,
          willChange: "transform",
        }}
      />

      {/* Amber glow — bottom right */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "5%", right: "0%",
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(217,119,6,0.05) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div
          style={{ marginBottom: 64, y: headerY, willChange: "transform", position: "relative" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p variants={revealVariant} custom={0} className="lp-section-label" style={{ marginBottom: 16 }}>
            Access Model
          </motion.p>
          <motion.h2
            variants={revealVariant}
            custom={1}
            className="lp-section-h2"
            style={{ color: "var(--lp-gray-1)", maxWidth: 440 }}
          >
            Three roles.{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Clear boundaries.
            </span>
          </motion.h2>
          <motion.p
            variants={revealVariant}
            custom={2}
            style={{ marginTop: 16, fontSize: 15, color: "var(--lp-gray-3)", lineHeight: 1.7, maxWidth: 480 }}
          >
            Every action is scoped to role. No role can delete records.
            Investigator identity is hidden from analysts to prevent bias.
          </motion.p>
        </motion.div>

        {/* Role cards */}
        <motion.div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
            y: cardsY,
            willChange: "transform",
            position: "relative",
          }}
        >
          {roles.map((role, i) => (
            <motion.div
              key={role.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              custom={i}
              className="lp-role-card"
              style={{
                willChange: "transform, opacity",
                borderRadius: 24,
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, ${role.accent}02 60%, ${role.accent}08 100%)`,
                borderColor: `${role.accent}14`,
                position: "relative",
                overflow: "hidden",
              }}
              whileHover="hover"
              animate="rest"
              variants={{
                hidden: revealVariant.hidden,
                visible: revealVariant.visible,
                hover: {
                  y: -6,
                  scale: 1.015,
                  borderColor: role.accent,
                  boxShadow: `0 24px 56px -12px ${role.shadowHover}, 0 0 0 1px ${role.accent}10, inset 0 1px 0 rgba(255,255,255,1)`,
                  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.97) 0%, ${role.accent}05 60%, ${role.accent}0c 100%)`,
                  transition: { duration: 0.4 }
                },
                rest: {
                  y: 0,
                  scale: 1,
                  borderColor: `${role.accent}14`,
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1)",
                  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, ${role.accent}02 60%, ${role.accent}08 100%)`,
                  transition: { duration: 0.4 }
                }
              }}
            >
              {/* Top accent line */}
              <div
                style={{
                  position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
                  background: `linear-gradient(90deg, transparent, ${role.accent}55, transparent)`,
                  opacity: 0.7,
                }}
              />

              {/* Role header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <motion.div
                    style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: `${role.accentDim}`,
                      border: `1px solid ${role.accent}28`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    variants={{
                      hover: { scale: 1.1, rotate: 5, transition: { duration: 0.3 } },
                      rest: { scale: 1, rotate: 0, transition: { duration: 0.3 } }
                    }}
                  >
                    <role.Icon size={17} color={role.accent} />
                  </motion.div>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--lp-gray-1)" }}>{role.name}</span>
                    <span style={{ fontSize: 11, color: role.accent, fontWeight: 500, opacity: 0.8, marginLeft: 6 }}>
                      · {role.subtitle}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 13.5, color: "var(--lp-gray-2)", lineHeight: 1.7 }}>
                  {role.description}
                </p>
              </div>

              <div className="lp-divider" style={{ margin: "18px 0" }} />

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                {role.permissions.map((p) => (
                  <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--lp-gray-2)", lineHeight: 1.5 }}>
                    <Check size={13} color={role.accent} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, opacity: 0.85 }} />
                    {p}
                  </li>
                ))}
              </ul>

              <div
                style={{
                  marginTop: 22, paddingTop: 14,
                  borderTop: "1px solid rgba(15,23,42,0.08)",
                  fontSize: 10, color: "var(--lp-gray-3)",
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  fontFamily: "var(--font-geist-mono, monospace)",
                }}
              >
                {role.note}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
