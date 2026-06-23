"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const NAV_LINKS = [
  { label: "Features",     href: "#features",     id: "features"     },
  { label: "How It Works", href: "#how-it-works", id: "how-it-works" },
  { label: "Roles",        href: "#roles",         id: "roles"        },
];

export default function LandingNav() {
  const [scrolled,       setScrolled]       = useState(false);
  const [activeSection,  setActiveSection]  = useState<string>("");
  const [hoveredIndex,   setHoveredIndex]   = useState<number | null>(null);
  const { user, isLoading } = useAuth();

  // Scroll progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 300, damping: 38, restDelta: 0.001,
  });

  // Scroll detection (transparent → frosted)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Scroll spy — IntersectionObserver per section
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: "-25% 0px -65% 0px" },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const getDashboardUrl = () => {
    if (!user) return "/login";
    const map: Record<string, string> = {
      admin: "/admin", analyst: "/analyst", investigator: "/investigator",
    };
    return map[user.role] || "/";
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`lp-nav ${scrolled ? "scrolled" : ""}`}
    >
      {/* ── Scroll progress bar ── */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 1.5,
          background: "linear-gradient(90deg, #00f59b, #059669, #00f59b)",
          transformOrigin: "left",
          scaleX,
          opacity: scrolled ? 1 : 0,
          transition: "opacity 0.5s ease",
          boxShadow: "0 0 8px rgba(0,245,155,0.5)",
          borderRadius: "0 0 1px 0",
        }}
      />

      <div
        style={{
          width: "100%", padding: "0 20px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "relative"
        }}
      >
        {/* Left Side: Logo */}
        <div style={{ display: "flex", alignItems: "center", flex: "1 1 0%", minWidth: 0 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/icon-v2.png" alt="ProofChain Logo" width="24" height="24" style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>
              <span style={{ color: "#ffffff" }}>Proof</span>
              <span style={{ color: "#00f59b" }}>Chain</span>
            </span>
          </Link>
        </div>

        {/* Centre links with scroll spy — mathematically centered via absolute centering */}
        <nav 
          style={{ 
            display: "flex", 
            gap: 4, 
            position: "absolute", 
            left: "50%", 
            transform: "translateX(-50%)",
            zIndex: 10 
          }} 
          className="hidden md:flex"
        >
          {NAV_LINKS.map((link, index) => {
            const isActive = activeSection === link.id;
            const isHovered = hoveredIndex === index;
            return (
              <a
                key={link.label}
                href={link.href}
                style={{
                  position: "relative",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#00f59b" : (isHovered ? "#ffffff" : "rgba(255,255,255,0.55)"),
                  padding: "6px 14px",
                  borderRadius: 8,
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                  background: isActive ? "rgba(0,245,155,0.06)" : "transparent",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Gliding hover background */}
                {isHovered && !isActive && (
                  <motion.div
                    layoutId="nav-hover-bg"
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderRadius: 8,
                      zIndex: -1,
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 26 }}
                  />
                )}

                {link.label}
                {/* Active underline indicator */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-indicator"
                    style={{
                      position: "absolute",
                      bottom: 1, left: "18%", right: "18%",
                      height: 1.5,
                      background: "linear-gradient(90deg, transparent, #00f59b, transparent)",
                      borderRadius: 99,
                      boxShadow: "0 0 8px rgba(0,245,155,0.7)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right Side: CTA + mobile (aligned to the right with flexbox) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 0%", justifyContent: "flex-end" }}>
          <Link
            href={getDashboardUrl()}
            className="lp-btn-primary"
            style={{
              padding: "7px 18px", fontSize: 13, fontWeight: 600,
              textDecoration: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 36,
            }}
          >
            {user ? "Dashboard" : "Sign In"}
          </Link>

          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <button className="text-white p-2 flex items-center justify-center cursor-pointer">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black border-white/10">
                <SheetTitle className="text-white mb-8 font-heading text-lg">Menu</SheetTitle>
                <nav className="flex flex-col gap-1">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      style={{
                        display: "block", padding: "10px 12px",
                        color: activeSection === link.id ? "#00f59b" : "rgba(255,255,255,0.6)",
                        fontSize: 15, fontWeight: 500,
                        textDecoration: "none",
                        borderRadius: 8,
                        background: activeSection === link.id ? "rgba(0,245,155,0.06)" : "transparent",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
                <Link
                  href={getDashboardUrl()}
                  className="lp-btn-primary"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: 24, padding: "12px 20px",
                    fontSize: 14, fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {user ? "Dashboard" : "Sign In"}
                </Link>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
