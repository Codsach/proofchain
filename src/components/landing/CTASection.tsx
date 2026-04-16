"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";

const revealVariant: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Layer 1 — large background glow (slowest)
  const bgY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  // Layer 2 — label + heading (medium)
  const headingY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  // Layer 3 — body text + buttons (fastest, most responsive)
  const contentY = useTransform(scrollYProgress, [0, 1], ["-2%", "2%"]);

  return (
    <section
      ref={sectionRef}
      className="lp-cta-glow"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "140px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Layer 1 — large central glow blob (slowest) */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          translateX: "-50%",
          width: "70%",
          maxWidth: 800,
          height: 500,
          background:
            "radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
          y: bgY,
          willChange: "transform",
        }}
      />

      <div style={{ maxWidth: 600, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Layer 2 — Label + Heading (medium parallax) */}
        <motion.div
          style={{ y: headingY, willChange: "transform", position: "relative" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.p
            variants={revealVariant}
            custom={0}
            className="lp-section-label"
            style={{ marginBottom: 24 }}
          >
            ProofChain
          </motion.p>

          <motion.h2
            variants={revealVariant}
            custom={1}
            className="lp-section-h2"
            style={{ color: "#fff", marginBottom: 20 }}
          >
            Evidence that cannot be denied.
          </motion.h2>
        </motion.div>

        {/* Layer 3 — Body + Buttons (fastest inner layer) */}
        <motion.div
          style={{ y: contentY, willChange: "transform", position: "relative" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.p
            variants={revealVariant}
            custom={0}
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.38)",
              lineHeight: 1.7,
              marginBottom: 44,
            }}
          >
            Built for cybersecurity and digital forensics teams who need
            cryptographically guaranteed chain of custody — not just a file store.
          </motion.p>

          <motion.div
            variants={revealVariant}
            custom={1}
            style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link
              href="/login"
              id="cta-access"
              className="lp-btn-primary-emer"
              style={{ padding: "14px 32px", fontSize: 15, textDecoration: "none", display: "inline-block" }}
            >
              Request Access
            </Link>
            <a
              href="#features"
              id="cta-features"
              className="lp-btn-ghost-emer"
              style={{ padding: "14px 28px", fontSize: 15, textDecoration: "none", display: "inline-block" }}
            >
              View Features
            </a>
          </motion.div>

          <motion.p
            variants={revealVariant}
            custom={2}
            style={{ marginTop: 36, fontSize: 12, color: "rgba(255,255,255,0.16)", letterSpacing: "0.04em" }}
          >
            Designed for law enforcement · Forensic labs · Cyber incident response teams
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
