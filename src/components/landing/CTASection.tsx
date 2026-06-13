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
      className="bg-gradient-to-b from-[#022c22] to-[#021810] relative overflow-hidden text-center py-36 px-6 border-t border-white/5 font-sans"
    >
      {/* Premium ambient light sweep matching reference mockup */}
      <div className="lp-ambient-sweep-horizontal-bottom" style={{ bottom: "-15%", opacity: 0.85 }} />
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
            "radial-gradient(ellipse at center, rgba(161, 133, 37, 0.06) 0%, rgba(194, 163, 50, 0.03) 50%, transparent 65%)",
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
            className="text-[var(--lp-accent)] font-mono text-sm tracking-widest uppercase mb-6"
          >
            ProofChain
          </motion.p>

          <motion.h2
            variants={revealVariant}
            custom={1}
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
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
            className="font-sans text-slate-200/80 text-base md:text-lg leading-relaxed mb-12 max-w-lg mx-auto"
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
              className="font-sans bg-[var(--lp-accent)] hover:bg-emerald-400 text-black font-semibold py-4 px-10 rounded-full transition-colors duration-300"
            >
              Request Access
            </Link>
            <a
              href="#features"
              id="cta-features"
              className="font-sans bg-white/5 hover:bg-white/10 text-white font-semibold py-4 px-8 rounded-full border border-white/10 transition-colors duration-300"
            >
              View Features
            </a>
          </motion.div>

          <motion.p
            variants={revealVariant}
            custom={2}
            className="mt-10 text-xs text-white/40 tracking-wider font-mono uppercase"
          >
            Designed for law enforcement · Forensic labs · Cyber incident response teams
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
