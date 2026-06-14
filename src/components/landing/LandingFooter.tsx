"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
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
      if (outcome === 'accepted') setDeferredPrompt(null);
      return;
    }

    // Fallback if prompt is not available
    toast({
      title: "Install ProofChain",
      description: "Tap your browser's menu (⋮ or Share) and select 'Add to Home Screen' or 'Install App'.",
    });
  };

  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        padding: "64px 24px 40px",
        background: "#080A09",
        backgroundImage: "radial-gradient(120% 100% at 50% 0%, rgba(255, 255, 255, 0.04) 0%, transparent 100%)",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Top row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr repeat(3, auto)",
            gap: "40px 64px",
            marginBottom: 56,
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 14 }}>
              <img src="/icon-v2.png" alt="ProofChain Logo" width="22" height="22" style={{ objectFit: 'contain' }} />
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
                <span style={{ color: "#ffffff" }}>Proof</span>
                <span style={{ color: "#07A572" }}>Chain</span>
              </span>
            </Link>
            <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.45)", lineHeight: 1.65, maxWidth: 240, margin: 0 }}>
              Tamper-proof digital forensic evidence. Blockchain-anchored. AI-analysed.
            </p>
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lp-primary-neon)", boxShadow: "0 0 8px var(--lp-primary-neon)", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.3)" }}>Polygon Amoy Testnet</span>
            </div>
            <motion.button 
              onClick={handleInstallClick}
              animate={{ 
                scale: [1, 1.02, 1],
                boxShadow: [
                  "0 4px 14px rgba(7, 165, 114, 0.2)",
                  "0 8px 24px rgba(7, 165, 114, 0.4)",
                  "0 4px 14px rgba(7, 165, 114, 0.2)"
                ]
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{ 
                marginTop: 24, 
                background: "linear-gradient(135deg, #07A572 0%, #047857 100%)",
                border: "1px solid rgba(255, 255, 255, 0.1)", 
                color: "#ffffff", 
                padding: "8px 16px", 
                borderRadius: 12, 
                cursor: "pointer", 
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-6 h-6" />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.8)", lineHeight: 1, marginBottom: 3 }}>
                  Available Now
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>
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
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255, 255, 255, 0.3)",
                  marginBottom: 16,
                }}
              >
                {col.heading}
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {col.items.map((item) => (
                  <li key={item.label}>
                    {"external" in item && item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.45)", textDecoration: "none", transition: "all 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.45)")}
                      >
                        {item.label} ↗
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.45)", textDecoration: "none", transition: "all 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.45)")}
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

        {/* Bottom */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.25)", margin: 0 }}>
            © 2026 ProofChain · Sachin R — MCA241221
          </p>
          <p style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.2)", margin: 0 }}>
            Not a court-admissible evidence system · For academic and forensic demonstration
          </p>
        </div>
      </div>
    </footer>
  );
}
