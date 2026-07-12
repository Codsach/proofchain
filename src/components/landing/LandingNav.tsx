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
  const [scrolled,      setScrolled]      = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [hoveredIndex,  setHoveredIndex]  = useState<number | null>(null);
  const { user, isLoading } = useAuth();

  // Scroll progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 300, damping: 38, restDelta: 0.001,
  });

  // Scroll detection — transparent → frosted glass
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Scroll spy
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
      {/* ── Scroll progress bar — clean emerald, no neon glow ── */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 1.5,
          background: "linear-gradient(90deg, #059669, #047857, #059669)",
          transformOrigin: "left",
          scaleX,
          opacity: scrolled ? 1 : 0,
          transition: "opacity 0.5s ease",
          borderRadius: "0 0 1px 0",
        }}
      />

      <div
        style={{
          width: "100%",
          padding: scrolled ? "0 24px" : "0 20px",
          height: scrolled ? 52 : 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "relative",
          transition: "height 0.5s cubic-bezier(0.16,1,0.3,1), padding 0.5s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Left: Logo */}
        <div style={{ display: "flex", alignItems: "center", flex: "1 1 0%", minWidth: 0 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/logo.png" alt="ProofChain Logo" width="24" height="24" style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>
              <span style={{ color: "var(--lp-gray-1)" }}>Proof</span>
              <span style={{ color: "#059669" }}>Chain</span>
            </span>
          </Link>
        </div>

        {/* Centre links — absolutely centered */}
        <nav
          style={{
            display: "flex",
            gap: 2,
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
          }}
          className="hidden md:flex"
        >
          {NAV_LINKS.map((link, index) => {
            const isActive  = activeSection === link.id;
            const isHovered = hoveredIndex === index;
            return (
              <a
                key={link.label}
                href={link.href}
                style={{
                  position: "relative",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#059669" : (isHovered ? "#0f172a" : "rgba(15,23,42,0.50)"),
                  padding: "6px 16px",
                  borderRadius: 10,
                  textDecoration: "none",
                  transition: "color 0.25s ease",
                  background: isActive ? "rgba(5,150,105,0.07)" : "transparent",
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
                      backgroundColor: "rgba(15,23,42,0.04)",
                      borderRadius: 10,
                      zIndex: -1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
                {link.label}
                {/* Active underline */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-indicator"
                    style={{
                      position: "absolute",
                      bottom: 2, left: "20%", right: "20%",
                      height: 1.5,
                      background: "linear-gradient(90deg, transparent, #059669, transparent)",
                      borderRadius: 99,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: CTA + mobile */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 0%", justifyContent: "flex-end" }}>
          <Link
            href={getDashboardUrl()}
            className="lp-btn-primary"
            style={{
              padding: "7px 20px", fontSize: 13, fontWeight: 600,
              textDecoration: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 36, letterSpacing: "-0.01em",
            }}
          >
            {user ? "Dashboard" : "Sign In"}
          </Link>

          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <button className="text-slate-600 p-2 flex items-center justify-center cursor-pointer">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white border-slate-100">
                <SheetTitle className="text-slate-900 mb-8 font-heading text-lg">Menu</SheetTitle>
                <nav className="flex flex-col gap-1">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      style={{
                        display: "block", padding: "10px 14px",
                        color: activeSection === link.id ? "#059669" : "rgba(15,23,42,0.55)",
                        fontSize: 15, fontWeight: 500,
                        textDecoration: "none",
                        borderRadius: 10,
                        background: activeSection === link.id ? "rgba(5,150,105,0.07)" : "transparent",
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
