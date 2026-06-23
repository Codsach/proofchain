"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Download, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

const links = [
  {
    heading: "Platform",
    items: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Roles", href: "#roles" },
      { label: "Sign In", href: "/login" },
    ],
  },
  {
    heading: "Technology",
    items: [
      { label: "Polygon Amoy", href: "https://amoy.polygonscan.com", external: true },
      { label: "IPFS / web3.storage", href: "https://web3.storage", external: true },
      { label: "Public Verify", href: "/verify", external: false },
    ],
  },
  {
    heading: "Project",
    items: [
      { label: "PRD v2.0", href: "#" },
      { label: "Audit Log", href: "#" },
      { label: "Smart Contract", href: "#" },
    ],
  },
];

export default function LandingFooter() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
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
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "64px 24px 40px",
        background: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle top ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0, left: "25%", right: "25%", height: 200,
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,245,155,0.04) 0%, transparent 70%)",
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
              <img src="/icon-v2.png" alt="ProofChain Logo" width="22" height="22" style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
                <span style={{ color: "#ffffff" }}>Proof</span>
                <span style={{ color: "#00f59b" }}>Chain</span>
              </span>
            </Link>

            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.65, maxWidth: 240, margin: 0 }}>
              Tamper-proof digital forensic evidence. Blockchain-anchored. AI-analysed.
            </p>

            {/* Live network indicator */}
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--lp-primary-neon)",
                  boxShadow: "0 0 8px var(--lp-primary-neon)",
                  display: "inline-block",
                  flexShrink: 0,
                  animation: "badge-glow 2s infinite alternate",
                }}
              />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                Polygon Amoy Testnet
              </span>
            </div>

            {/* Install button — hover only, no continuous animation */}
            <motion.button
              onClick={handleInstallClick}
              whileHover={{
                scale: 1.04,
                boxShadow: "0 8px 24px rgba(0,245,155,0.25)",
              }}
              whileTap={{ scale: 0.97 }}
              style={{
                marginTop: 20,
                background: "linear-gradient(135deg, #00f59b 0%, #059669 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#030307",
                padding: "9px 16px",
                borderRadius: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 4px 16px rgba(0,245,155,0.2)",
                transition: "box-shadow 0.3s ease",
              }}
            >
              <Smartphone size={18} style={{ color: "#030307", flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
                <span
                  style={{
                    fontSize: 9, fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.07em", color: "rgba(3,3,7,0.65)",
                    lineHeight: 1, marginBottom: 2,
                  }}
                >
                  Available Now
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#030307", lineHeight: 1 }}>
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
                  color: "rgba(255,255,255,0.28)", marginBottom: 18,
                  fontFamily: "monospace",
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
                          fontSize: 13, color: "rgba(255,255,255,0.4)",
                          textDecoration: "none", transition: "color 0.2s ease",
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#00f59b")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                      >
                        {item.label}
                        <span style={{ fontSize: 10, opacity: 0.5 }}>↗</span>
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        style={{
                          fontSize: 13, color: "rgba(255,255,255,0.4)",
                          textDecoration: "none", transition: "color 0.2s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
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
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: 22,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", margin: 0, fontFamily: "monospace" }}>
            © 2026 ProofChain · Sachin R — MCA241221
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", margin: 0, fontFamily: "monospace" }}>
            Not a court-admissible system · Academic & forensic demonstration
          </p>
        </div>
      </div>
    </footer>
  );
}
