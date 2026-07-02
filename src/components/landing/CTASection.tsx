"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

const revealVariant: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

// Magnetic button hook
function useMagnetic(strength = 0.35) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * strength;
      const dy   = (e.clientY - cy) * strength;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const onLeave = () => {
      el.style.transform = "";
      el.style.transition = "transform 0.5s cubic-bezier(0.16,1,0.3,1)";
    };
    const onEnter = () => {
      el.style.transition = "transform 0.15s ease-out";
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("mouseenter", onEnter);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("mouseenter", onEnter);
    };
  }, [strength]);

  return ref;
}

export default function CTASection() {
  const sectionRef   = useRef<HTMLElement>(null);
  const magneticRef  = useMagnetic(0.30);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY      = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const headingY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["-2%", "2%"]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden text-center py-36 px-6 font-sans"
      style={{ background: "transparent", borderTop: "1px solid rgba(15,23,42,0.07)" }}
    >
      {/* ── Soft ambient glow — top center ── */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: "-8%",
          left: "50%",
          translateX: "-50%",
          width: "65%",
          maxWidth: 780,
          height: 460,
          background: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.07) 0%, rgba(5,150,105,0.03) 45%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
          zIndex: 0,
          y: bgY,
          willChange: "transform",
        }}
      />

      {/* Warm amber — bottom */}
      <div
        aria-hidden
        style={{
          position: "absolute", bottom: 0, left: "30%", right: "30%", height: 160,
          background: "radial-gradient(ellipse, rgba(245,158,11,0.04) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none", zIndex: 0,
        }}
      />

      {/* Subtle dot grid */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(15,23,42,0.035) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, black 15%, transparent 100%)",
          pointerEvents: "none", zIndex: 0,
        }}
      />

      {/* Floating decorative elements */}
      <div
        aria-hidden
        className="lp-float"
        style={{
          position: "absolute",
          top: "18%", left: "8%",
          width: 48, height: 48,
          borderRadius: 14,
          border: "1px solid rgba(5,150,105,0.12)",
          background: "rgba(255,255,255,0.60)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
          pointerEvents: "none", zIndex: 1,
        }}
      >
        <ShieldCheck size={20} style={{ color: "#059669", opacity: 0.7 }} />
      </div>

      <div
        aria-hidden
        className="lp-float-delayed"
        style={{
          position: "absolute",
          top: "25%", right: "9%",
          width: 40, height: 40,
          borderRadius: 12,
          border: "1px solid rgba(139,92,246,0.14)",
          background: "rgba(255,255,255,0.60)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
          pointerEvents: "none", zIndex: 1,
        }}
      >
        <Zap size={16} style={{ color: "#8b5cf6", opacity: 0.65 }} />
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", position: "relative", zIndex: 1 }}>

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
            className="font-heading font-bold mb-6 leading-tight"
            style={{
              color: "var(--lp-gray-1)",
              fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
              letterSpacing: "-0.03em",
            }}
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

        {/* Body + Buttons */}
        <motion.div
          style={{ y: contentY, willChange: "transform", position: "relative" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.p
            variants={revealVariant}
            custom={0}
            className="font-sans leading-relaxed mb-12 max-w-md mx-auto"
            style={{ color: "var(--lp-gray-2)", fontSize: "clamp(0.93rem, 1.3vw, 1.04rem)", lineHeight: 1.75 }}
          >
            Built for cybersecurity and digital forensics teams who need
            cryptographically guaranteed chain of custody — not just a file store.
          </motion.p>

          <motion.div
            variants={revealVariant}
            custom={1}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {/* Magnetic primary CTA */}
            <Link
              ref={magneticRef}
              href="/login"
              id="cta-access"
              className="lp-btn-primary font-sans flex items-center gap-2.5 no-underline"
              style={{ padding: "14px 36px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              Request Access <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              id="cta-features"
              className="lp-btn-ghost font-sans no-underline"
              style={{ padding: "14px 28px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              View Features
            </a>
          </motion.div>

          <motion.p
            variants={revealVariant}
            custom={2}
            className="mt-10 text-xs tracking-wider font-mono uppercase"
            style={{ color: "rgba(15,23,42,0.30)" }}
          >
            Designed for law enforcement · Forensic labs · Cyber incident response teams
          </motion.p>
        </motion.div>

      </div>
    </section>
  );
}
