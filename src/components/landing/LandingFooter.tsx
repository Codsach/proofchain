"use client";

import Link from "next/link";

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
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <path
                  d="M11 2L3 6v5.5c0 4.2 3.2 8.1 8 9.5 4.8-1.4 8-5.3 8-9.5V6L11 2Z"
                  fill="url(#footer-shield-gradient)"
                />
                <defs>
                  <linearGradient id="footer-shield-gradient" x1="3" y1="2" x2="19" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00f2fe" />
                    <stop offset="1" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <path d="M8 11l2 2 4-4" stroke="black" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>ProofChain</span>
            </Link>
            <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.45)", lineHeight: 1.65, maxWidth: 240, margin: 0 }}>
              Tamper-proof digital forensic evidence. Blockchain-anchored. AI-analysed.
            </p>
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lp-primary-neon)", boxShadow: "0 0 8px var(--lp-primary-neon)", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.3)" }}>Polygon Amoy Testnet</span>
            </div>
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
