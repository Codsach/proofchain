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
    accent: "#00f59b",
    accentDim: "rgba(194, 163, 50, 0.08)",
    accentHover: "rgba(194, 163, 50, 0.02)",
    borderHover: "rgba(194, 163, 50, 0.35)",
    shadowHover: "rgba(194, 163, 50, 0.15)",
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
    accent: "#059669",
    accentDim: "rgba(161, 133, 37, 0.08)",
    accentHover: "rgba(161, 133, 37, 0.02)",
    borderHover: "rgba(161, 133, 37, 0.35)",
    shadowHover: "rgba(161, 133, 37, 0.15)",
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
    accent: "#e2e2e2",
    accentDim: "rgba(15, 23, 42, 0.06)",
    accentHover: "rgba(15, 23, 42, 0.015)",
    borderHover: "rgba(15, 23, 42, 0.3)",
    shadowHover: "rgba(15, 23, 42, 0.08)",
    Icon: Settings,
  },
];

export default function RolesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Layer 1 — background glow (slowest)
  const bgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  // Layer 2 — header (medium)
  const headerY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  // Layer 3 — cards grid (fastest)
  const cardsY = useTransform(scrollYProgress, [0, 1], ["-2%", "2%"]);

  return (
    <div
      ref={sectionRef}
      id="roles"
      className="bg-[#0B120D]"
      style={{ 
        padding: "120px 24px", 
        position: "relative", 
        overflow: "hidden",
        backgroundImage: `
          radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 60%),
          radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 32px 32px"
      }}
    >
      {/* Layer 1 — decorative background glow (slowest) */}
      <motion.div
        aria-hidden={true}
        style={{
          position: "absolute",
          top: "15%",
          left: "-5%",
          width: 500,
          height: 500,
          background:
            "radial-gradient(ellipse at center, rgba(161, 133, 37, 0.03) 0%, rgba(194, 163, 50, 0.01) 50%, transparent 70%)",
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
            marginBottom: 64,
            y: headerY,
            willChange: "transform",
            position: "relative",
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p variants={revealVariant} custom={0} className="lp-section-label" style={{ marginBottom: 16 }}>
            Access Model
          </motion.p>
          <motion.h2 variants={revealVariant} custom={1} className="lp-section-h2" style={{ color: "#fff", maxWidth: 440 }}>
            Three roles. Clear boundaries.
          </motion.h2>
          <motion.p
            variants={revealVariant}
            custom={2}
            style={{
              marginTop: 16,
              fontSize: 15,
              color: "rgba(255, 255, 255, 0.6)",
              lineHeight: 1.7,
              maxWidth: 480,
            }}
          >
            Every action is scoped to role. No role can delete records. Investigator
            identity is hidden from analysts to prevent bias.
          </motion.p>
        </motion.div>

        {/* Layer 3 — Role cards (fastest inner layer) */}
        <motion.div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
              variants={revealVariant}
              custom={i}
              className="lp-role-card"
              style={{ 
                willChange: "transform, opacity",
                borderRadius: "24px"
              }}
              whileHover={{
                y: -6,
                scale: 1.015,
                borderColor: role.borderHover,
                boxShadow: `0 24px 48px -12px ${role.shadowHover}, inset 0 1px 1px ${role.accentDim}`,
                background: `linear-gradient(180deg, ${role.accentHover} 0%, rgba(3,3,7,0) 100%)`,
                transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }
              }}
            >
              {/* Dynamic decorative top light */}
              <div 
                style={{ 
                  position: "absolute", 
                  top: 0, 
                  left: "10%", 
                  right: "10%", 
                  height: "1px", 
                  background: `linear-gradient(90deg, transparent, ${role.accent}, transparent)`,
                  opacity: 0.3 
                }} 
              />

              {/* Role header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <role.Icon size={18} color={role.accent} />
                  <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{role.name}</span>
                  <span style={{ fontSize: 12, color: role.accent, fontWeight: 500, opacity: 0.7 }}>
                    · {role.subtitle}
                  </span>
                </div>
                <p style={{ fontSize: 13.5, color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.65 }}>
                  {role.description}
                </p>
              </div>

              <div className="lp-divider" style={{ margin: "20px 0", background: "rgba(255, 255, 255, 0.1)" }} />

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {role.permissions.map((p) => (
                  <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.5 }}>
                    <Check size={14} color={role.accent} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, opacity: 0.8 }} />
                    {p}
                  </li>
                ))}
              </ul>

              <div
                style={{
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: 11,
                  color: "rgba(255, 255, 255, 0.4)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
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
