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
    <div className="fixed inset-0 -z-10 bg-[var(--dash-bg)] overflow-hidden">
      {/* Noise background */}
      <div className="absolute inset-0 noise-bg pointer-events-none mix-blend-overlay opacity-[0.015]" />
      
      {/* Very large, smooth blended ambient glows */}
      {/* Teal/emerald top-left */}
      <div className="absolute -top-[10%] -left-[10%] w-[65vw] h-[65vw] rounded-full bg-emerald-500/[0.04] blur-[130px] pointer-events-none" />
      
      {/* Cobalt/blue top-right */}
      <div className="absolute top-[10%] -right-[15%] w-[60vw] h-[60vw] rounded-full bg-blue-500/[0.03] blur-[150px] pointer-events-none" />
      
      {/* Teal bottom-center */}
      <div className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[70vw] rounded-full bg-teal-500/[0.035] blur-[140px] pointer-events-none" />
      
      {/* Subtle indigo center-left */}
      <div className="absolute top-[30%] -left-[10%] w-[45vw] h-[45vw] rounded-full bg-indigo-500/[0.02] blur-[120px] pointer-events-none" />
    </div>
  );
}

export function AuthLayout({ leftPanel, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans auth-root sentinel-theme-v2">
      <AuthPageBg />

      {/* LEFT PANEL — pure animated illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        {/* Removed frosted glass backing to eliminate the visual split */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-12">
          {leftPanel}
        </div>
        {/* Bottom tagline */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
          <p className="text-[var(--dash-accent)]/70 text-[11px] font-heading font-bold tracking-[0.28em] uppercase">
            Digital Forensic Evidence Platform
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 lg:w-1/2 flex flex-col items-center justify-center px-6 py-10 min-h-screen z-10"
      >
        {/* Form container */}
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-5 group w-fit">
            <motion.div
              animate={{
                y: [0, -2, 0],
                filter: [
                  "drop-shadow(0px 0px 4px rgba(13,158,110,0.08))",
                  "drop-shadow(0px 0px 12px rgba(13,158,110,0.40))",
                  "drop-shadow(0px 0px 4px rgba(13,158,110,0.08))",
                ],
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Image
                src="/logo.png"
                alt="ProofChain Icon"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </motion.div>
            <div className="flex text-[24px] font-extrabold tracking-tight font-heading">
              <span className="text-[var(--dash-text)]">Proof</span>
              <span className="text-[var(--dash-accent)]">Chain</span>
            </div>
          </Link>

          {/* Form content */}
          {children}
        </div>
      </motion.div>
    </div>
  );
}
