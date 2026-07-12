"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Smartphone } from "lucide-react";
import { motion } from "framer-motion";

const links = [
  {
    heading: "Platform",
    items: [
      { label: "Features",     href: "#features"      },
      { label: "How It Works", href: "#how-it-works"  },
      { label: "Roles",        href: "#roles"         },
      { label: "Sign In",      href: "/login"         },
    ],
  },
  {
    heading: "Technology",
    items: [
      { label: "Polygon Amoy",      href: "https://amoy.polygonscan.com", external: true  },
      { label: "IPFS / web3.storage", href: "https://web3.storage",       external: true  },
      { label: "Public Verify",     href: "/verify",                       external: false },
    ],
  },
  {
    heading: "Project",
    items: [
      { label: "PRD v2.0",       href: "#" },
      { label: "Audit Log",      href: "#" },
      { label: "Smart Contract", href: "#" },
    ],
  },
];

export default function LandingFooter() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
      return;
    }
    toast({
      title: "Install ProofChain",
      description: "Tap your browser's menu (⋮ or Share) and select 'Add to Home Screen' or 'Install App'.",
    });
  };

  return (
    <footer
      className="lp-footer-dark"
      style={{
        borderTop: "1px solid rgba(5,150,105,0.15)",
        backgroundColor: "var(--footer-dark-bg)",
        padding: "64px 24px 40px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Very soft top ambient */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0, left: "25%", right: "25%", height: 160,
          background: "radial-gradient(ellipse at 50% 0%, rgba(5,150,105,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Top row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr repeat(3, auto)",
            gap: "40px 64px",
            marginBottom: 52,
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <Link
              href="/"
              style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 14 }}
            >
              <img src="/logo.png" alt="ProofChain Logo" width="22" height="22" style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>
                <span style={{ color: "rgba(255, 255, 255, 0.95)" }}>Proof</span>
                <span style={{ color: "#059669" }}>Chain</span>
              </span>
            </Link>

            <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.65, maxWidth: 240, margin: 0 }}>
              Tamper-proof digital forensic evidence. Blockchain-anchored. AI-analysed.
            </p>

            {/* Live network indicator */}
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#059669",
                  boxShadow: "0 0 0 2px rgba(5,150,105,0.30)",
                  display: "inline-block",
                  flexShrink: 0,
                  animation: "badge-glow 2.5s infinite alternate",
                }}
              />
              <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.70)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                Polygon Amoy Testnet
              </span>
            </div>

            {/* Install button — clean emerald, no neon */}
            <motion.button
              onClick={handleInstallClick}
              whileHover={{
                scale: 1.03,
                boxShadow: "0 8px 24px rgba(5,150,105,0.18)",
              }}
              whileTap={{ scale: 0.97 }}
              style={{
                marginTop: 20,
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                border: "1px solid rgba(5,150,105,0.20)",
                color: "#ffffff",
                padding: "9px 16px",
                borderRadius: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 2px 8px rgba(5,150,105,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
                transition: "box-shadow 0.3s ease",
              }}
            >
              <Smartphone size={16} style={{ color: "#ffffff", flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
                <span
                  style={{
                    fontSize: 9, fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.07em", color: "rgba(255,255,255,0.65)",
                    lineHeight: 1, marginBottom: 2,
                  }}
                >
                  Available Now
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>
                  Install Web App
                </span>
              </div>
            </motion.button>
          </div>

          {/* Link columns */}
          {links.map((col) => (
            <div key={col.heading}>
              <p
                style={{
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  color: "#ffffff", marginBottom: 18,
                  fontFamily: "var(--font-geist-mono, monospace)",
                }}
              >
                {col.heading}
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
                {col.items.map((item) => (
                  <li key={item.label}>
                    {"external" in item && item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 13, color: "rgba(255, 255, 255, 0.60)",
                          textDecoration: "none", transition: "color 0.2s ease",
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#059669")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.60)")}
                      >
                        {item.label}
                        <span style={{ fontSize: 10, opacity: 0.45 }}>↗</span>
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        style={{
                          fontSize: 13, color: "rgba(255, 255, 255, 0.60)",
                          textDecoration: "none", transition: "color 0.2s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#059669")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.60)")}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: 22,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <p style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.45)", margin: 0, fontFamily: "var(--font-geist-mono, monospace)" }}>
            © 2026 ProofChain · Sachin R — MCA241221
          </p>
          <p style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.40)", margin: 0, fontFamily: "var(--font-geist-mono, monospace)" }}>
            Not a court-admissible system · Academic &amp; forensic demonstration
          </p>
        </div>
      </div>
    </footer>
  );
}
