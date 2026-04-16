"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const technologies = [
  {
    category: "Blockchain",
    color: "#6366f1",
    items: [
      { name: "Ethereum", desc: "Immutable transaction anchoring" },
      { name: "Smart Contracts", desc: "Trustless on-chain logic" },
      { name: "Ethers.js v6", desc: "Wallet & contract interface" },
      { name: "Sepolia Testnet", desc: "Network compatibility" },
    ],
  },
  {
    category: "Decentralized Storage",
    color: "#22d3ee",
    items: [
      { name: "IPFS", desc: "Content-addressed file storage" },
      { name: "w3up-client", desc: "Web3.Storage integration" },
      { name: "CID Pinning", desc: "Persistent availability" },
      { name: "Off-chain metadata", desc: "Rich file provenance" },
    ],
  },
  {
    category: "AI & Analysis",
    color: "#8b5cf6",
    items: [
      { name: "GPT-4o Vision", desc: "Visual tamper detection" },
      { name: "Metadata Parsing", desc: "EXIF & format inspection" },
      { name: "Tamper Scoring", desc: "0–100 integrity rating" },
      { name: "Anomaly Detection", desc: "Statistical outlier analysis" },
    ],
  },
  {
    category: "Security",
    color: "#10b981",
    items: [
      { name: "JWT Authentication", desc: "Stateless, short-lived tokens" },
      { name: "bcrypt Hashing", desc: "Zero-knowledge passwords" },
      { name: "AES-256", desc: "File-level encryption at rest" },
      { name: "RBAC", desc: "Granular role enforcement" },
    ],
  },
];

const techPills = [
  "Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4",
  "MongoDB", "Mongoose", "Ethers.js", "IPFS", "GPT-4o",
  "Resend", "Zod", "React Hook Form", "Sonner", "shadcn/ui",
];

export default function TechSection() {
  const { ref: headRef, isVisible: headVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section
      id="technology"
      className="py-28 px-6 relative overflow-hidden"
      style={{ background: "#04040a" }}
    >
      {/* Top border */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)" }}
      />

      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: "-200px",
          top: "20%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div ref={headRef} className="text-center mb-16">
          <div className={`reveal ${headVisible ? "visible" : ""} mb-4`}>
            <span
              className="inline-block text-xs font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
              style={{
                color: "#8b5cf6",
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              Tech Stack
            </span>
          </div>
          <h2
            className={`text-4xl md:text-5xl font-bold text-white mb-4 reveal reveal-delay-1 ${headVisible ? "visible" : ""}`}
          >
            Built on{" "}
            <span className="gradient-text-accent">battle-tested</span>{" "}
            technology
          </h2>
          <p
            className={`text-lg max-w-xl mx-auto reveal reveal-delay-2 ${headVisible ? "visible" : ""}`}
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Every layer of ProofChain is engineered for cryptographic security, legal admissibility,
            and forensic-grade reliability.
          </p>
        </div>

        {/* Tech Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          {technologies.map((tech, i) => (
            <TechCard key={tech.category} tech={tech} index={i} />
          ))}
        </div>

        {/* Tech Pills */}
        <TechPills headVisible={headVisible} />
      </div>
    </section>
  );
}

function TechCard({ tech, index }: { tech: (typeof technologies)[0]; index: number }) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });
  const delay = (index % 2) * 0.1;

  return (
    <div
      ref={ref}
      className={`glass-card-emer rounded-2xl p-7 reveal ${isVisible ? "visible" : ""}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {/* Category header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: tech.color,
            boxShadow: `0 0 10px ${tech.color}80`,
          }}
        />
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: tech.color }}>
          {tech.category}
        </h3>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3">
        {tech.items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between py-2.5 border-b last:border-0"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            <span className="text-sm font-medium text-white">{item.name}</span>
            <span className="text-xs ml-4 text-right" style={{ color: "rgba(255,255,255,0.35)" }}>
              {item.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TechPills({ headVisible }: { headVisible: boolean }) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`glass-card-emer rounded-2xl p-8 reveal ${isVisible ? "visible" : ""}`}
    >
      <p className="text-xs uppercase tracking-widest mb-5 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
        Full Technology Stack
      </p>
      <div className="flex flex-wrap gap-2.5 justify-center">
        {techPills.map((pill, i) => (
          <span
            key={pill}
            className={`tech-pill text-xs font-medium px-3.5 py-1.5 rounded-full reveal ${isVisible ? "visible" : ""}`}
            style={{
              color: "rgba(255,255,255,0.6)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              transitionDelay: `${i * 0.03}s`,
            }}
          >
            {pill}
          </span>
        ))}
      </div>
    </div>
  );
}
