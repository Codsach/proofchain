"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const stats = [
  { value: "100%", label: "Evidence Integrity", sublabel: "Cryptographically guaranteed" },
  { value: "< 2s", label: "Hash Verification", sublabel: "Real-time audit trail" },
  { value: "∞", label: "Immutable Record", sublabel: "Blockchain anchored forever" },
  { value: "3-Layer", label: "Security Model", sublabel: "Encrypt · Hash · Chain" },
];

const logos = [
  { name: "Ethereum", icon: "⬡" },
  { name: "IPFS", icon: "⊕" },
  { name: "OpenAI", icon: "◯" },
  { name: "SHA-256", icon: "⬢" },
  { name: "JWT Auth", icon: "◈" },
];

export default function StatsSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>({ threshold: 0.2 });

  return (
    <section
      ref={ref}
      className="py-24 px-6 relative overflow-hidden"
      style={{ background: "#04040a" }}
    >
      {/* Border top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)" }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Logo Ticker */}
        <div className={`flex items-center justify-center flex-wrap gap-8 mb-16 reveal ${isVisible ? "visible" : ""}`}>
          <span className="text-xs uppercase tracking-widest mr-2" style={{ color: "rgba(255,255,255,0.25)" }}>
            Powered by
          </span>
          {logos.map((l, i) => (
            <div
              key={l.name}
              className={`flex items-center gap-2 reveal reveal-delay-${i + 1} ${isVisible ? "visible" : ""}`}
            >
              <span className="text-xl" style={{ color: "rgba(99,102,241,0.7)" }}>{l.icon}</span>
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                {l.name}
              </span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ background: "rgba(255,255,255,0.04)", borderRadius: "20px", overflow: "hidden" }}
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center text-center py-10 px-6 stat-visible reveal reveal-delay-${i + 1} ${isVisible ? "visible" : ""}`}
              style={{ background: "#04040a" }}
            >
              <span
                className="stat-value text-4xl md:text-5xl font-bold mb-2 num-animate gradient-text-primary"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                {s.value}
              </span>
              <span className="text-sm font-semibold text-white mb-1">{s.label}</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{s.sublabel}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
