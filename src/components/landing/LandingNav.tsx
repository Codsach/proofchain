"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { useRouter } from "next/navigation";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const getDashboardUrl = () => {
    if (!user) return "/login";
    const map: Record<string, string> = {
      admin: "/admin",
      analyst: "/analyst",
      investigator: "/investigator",
    };
    return map[user.role] || "/";
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`lp-nav ${scrolled ? "scrolled" : ""}`}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo.png" alt="ProofChain Logo" width="26" height="26" style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
            ProofChain
          </span>
        </Link>

        {/* Center links */}
        <nav style={{ display: "flex", gap: 2 }} className="hidden md:flex">
          {["Features", "How It Works", "Roles"].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "rgba(15, 23, 42, 0.5)",
                padding: "6px 14px",
                borderRadius: 8,
                textDecoration: "none",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.textShadow = "0 0 10px rgba(0, 242, 254, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(15, 23, 42, 0.5)";
                e.currentTarget.style.textShadow = "none";
              }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        {!isLoading && (
          <Link
            href={getDashboardUrl()}
            className="lp-btn-primary"
            style={{ 
              padding: "8px 24px", 
              fontSize: 13.5, 
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "36px"
            }}
          >
            {user ? "Dashboard" : "Sign In"}
          </Link>
        )}
      </div>
    </motion.header>
  );
}
