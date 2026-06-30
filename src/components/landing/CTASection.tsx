"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

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

  const bgY      = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const headingY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["-2%", "2%"]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden text-center py-36 px-6 font-sans"
      style={{ background: "transparent", borderTop: "1px solid rgba(15,23,42,0.08)" }}
    >
      {/* Top emerald glow — large radial */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: "-5%",
          left: "50%",
          translateX: "-50%",
          width: "80%",
          maxWidth: 900,
          height: 560,
          background: "radial-gradient(ellipse at 50% 0%, rgba(5,150,105,0.09) 0%, rgba(4,120,87,0.04) 40%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
          y: bgY,
          willChange: "transform",
        }}
      />

      {/* Bottom warm amber undertone */}
      <div
        aria-hidden
        style={{
          position: "absolute", bottom: 0, left: "25%", right: "25%", height: 200,
          background: "radial-gradient(ellipse, rgba(217,119,6,0.05) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none", zIndex: 0,
        }}
      />

      {/* Subtle grid */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(15,23,42,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)",
          pointerEvents: "none", zIndex: 0,
        }}
      />

      <div style={{ maxWidth: 620, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Label + Heading */}
        <motion.div
          style={{ y: headingY, willChange: "transform", position: "relative" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.p
            variants={revealVariant}
            custom={0}
            className="lp-section-label mb-6"
          >
            ProofChain
          </motion.p>

          <motion.h2
            variants={revealVariant}
            custom={1}
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            style={{ color: "var(--lp-gray-1)" }}
          >
            Evidence that{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              cannot
            </span>{" "}
            be denied.
          </motion.h2>
        </motion.div>

        {/* Body + buttons */}
        <motion.div
          style={{ y: contentY, willChange: "transform", position: "relative" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.p
            variants={revealVariant}
            custom={0}
            className="font-sans text-base md:text-lg leading-relaxed mb-12 max-w-lg mx-auto"
            style={{ color: "var(--lp-gray-2)" }}
          >
            Built for cybersecurity and digital forensics teams who need
            cryptographically guaranteed chain of custody — not just a file store.
          </motion.p>

          <motion.div
            variants={revealVariant}
            custom={1}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/login"
              id="cta-access"
              className="lp-btn-primary font-sans flex items-center gap-2.5 no-underline"
              style={{ padding: "14px 36px", fontSize: 15, fontWeight: 600 }}
            >
              Request Access <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              id="cta-features"
              className="lp-btn-ghost font-sans no-underline"
              style={{ padding: "14px 28px", fontSize: 15, fontWeight: 600 }}
            >
              View Features
            </a>
          </motion.div>

          <motion.p
            variants={revealVariant}
            custom={2}
            className="mt-10 text-xs tracking-wider font-mono uppercase"
            style={{ color: "#94a3b8" }}
          >
            Designed for law enforcement · Forensic labs · Cyber incident response teams
          </motion.p>
        </motion.div>

      </div>
    </section>
  );
}
