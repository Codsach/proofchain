"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface AuthLayoutProps {
  leftPanel: React.ReactNode;
  children: React.ReactNode;
}

/** Shared multi-radial gradient background — mirrors the dashboard InspectionBackground */
function AuthPageBg() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#f0f4f8]">
      {/* Teal top-left */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_15%_25%,#a7f3d0_0%,transparent_45%)]" />
      {/* Blue top-right */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_82%_18%,#bfdbfe_0%,transparent_42%)]" />
      {/* Teal bottom-center */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_50%_85%,#99f6e4_0%,transparent_40%)]" />
      {/* Cobalt bottom-right */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_88%_88%,#c7d2fe_0%,transparent_38%)]" />
      {/* Soft emerald mid-left */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_8%_65%,#d1fae5_0%,transparent_35%)]" />
      {/* Dot grid texture */}
      <div
        className="absolute inset-0 opacity-[0.18] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #0D9E6E 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}

export function AuthLayout({ leftPanel, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans auth-root">
      <AuthPageBg />

      {/* LEFT PANEL — pure animated illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        {/* Frosted glass panel backing */}
        <div className="absolute inset-6 rounded-3xl bg-white/30 backdrop-blur-sm border border-white/50 shadow-[0_8px_40px_rgba(13,158,110,0.08)]" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-12">
          {leftPanel}
        </div>
        {/* Bottom tagline */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
          <p className="text-[#0D9E6E]/70 text-[11px] font-heading font-bold tracking-[0.28em] uppercase">
            Digital Forensic Evidence Platform
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 min-h-screen"
      >
        {/* Frosted form container */}
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-8 group w-fit">
            <motion.div
              animate={{
                y: [0, -3, 0],
                filter: [
                  "drop-shadow(0px 0px 4px rgba(13,158,110,0.12))",
                  "drop-shadow(0px 0px 16px rgba(13,158,110,0.50))",
                  "drop-shadow(0px 0px 4px rgba(13,158,110,0.12))",
                ],
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Image
                src="/icon-v2.png"
                alt="ProofChain Icon"
                width={42}
                height={42}
                className="object-contain"
                priority
              />
            </motion.div>
            <div className="flex text-[28px] font-extrabold tracking-tight font-heading">
              <span className="text-[#1e293b]">Proof</span>
              <span className="text-[#10b981]">Chain</span>
            </div>
          </Link>

          {/* Form content */}
          {children}
        </div>
      </motion.div>
    </div>
  );
}
