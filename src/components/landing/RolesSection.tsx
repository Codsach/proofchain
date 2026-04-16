"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";

const revealVariant: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
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
      style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}
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
            "radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)",
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
              color: "rgba(255,255,255,0.38)",
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
            gap: 16,
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
              style={{ willChange: "transform, opacity" }}
            >
              {/* Role header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{role.name}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
                    · {role.subtitle}
                  </span>
                </div>
                <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                  {role.description}
                </p>
              </div>

              <div className="lp-divider" style={{ margin: "20px 0" }} />

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {role.permissions.map((p) => (
                  <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                      <path d="M2.5 7l3 3 6-6" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>

              <div
                style={{
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.22)",
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
