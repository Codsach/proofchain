"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Cpu, FileText, Fingerprint,
  Upload, Search, Brain, Link2,
} from "lucide-react";

// 6-phase forensic pipeline
type Phase = "uploading" | "metadata" | "hashing" | "ai_analysis" | "anchoring" | "verified";

const PHASE_SEQUENCE: Phase[] = [
  "uploading", "metadata", "hashing", "ai_analysis", "anchoring", "verified",
];

const phaseConfig: Record<Phase, {
  label: string;
  shortLabel: string;
  accentColor: string;
  borderColor: string;
  glowColor: string;
  trackColor: string;
  doneTrackColor: string;
  icon: React.ElementType;
}> = {
  uploading: {
    label: "File Upload",
    shortLabel: "Upload",
    accentColor: "#3b82f6",
    borderColor: "rgba(59,130,246,0.20)",
    glowColor: "rgba(59,130,246,0.07)",
    trackColor: "#3b82f6",
    doneTrackColor: "#1d4ed8",
    icon: Upload,
  },
  metadata: {
    label: "Metadata Extraction",
    shortLabel: "Metadata",
    accentColor: "#059669",
    borderColor: "rgba(5,150,105,0.20)",
    glowColor: "rgba(5,150,105,0.07)",
    trackColor: "#059669",
    doneTrackColor: "#047857",
    icon: Search,
  },
  hashing: {
    label: "SHA-256 Hash",
    shortLabel: "SHA-256",
    accentColor: "#d97706",
    borderColor: "rgba(217,119,6,0.20)",
    glowColor: "rgba(217,119,6,0.07)",
    trackColor: "#d97706",
    doneTrackColor: "#b45309",
    icon: Fingerprint,
  },
  ai_analysis: {
    label: "AI Analysis",
    shortLabel: "AI Scan",
    accentColor: "#8b5cf6",
    borderColor: "rgba(139,92,246,0.20)",
    glowColor: "rgba(139,92,246,0.07)",
    trackColor: "#8b5cf6",
    doneTrackColor: "#6d28d9",
    icon: Brain,
  },
  anchoring: {
    label: "Blockchain Anchor",
    shortLabel: "Anchor",
    accentColor: "#10b981",
    borderColor: "rgba(16,185,129,0.20)",
    glowColor: "rgba(16,185,129,0.07)",
    trackColor: "#10b981",
    doneTrackColor: "#059669",
    icon: Link2,
  },
  verified: {
    label: "Verified",
    shortLabel: "Verified",
    accentColor: "#059669",
    borderColor: "rgba(5,150,105,0.25)",
    glowColor: "rgba(5,150,105,0.10)",
    trackColor: "#059669",
    doneTrackColor: "#047857",
    icon: ShieldCheck,
  },
};

export default function HeroInteractiveWidget() {
  const [phase,        setPhase]        = useState<Phase>("uploading");
  const [progress,     setProgress]     = useState(0);
  const [hashCharCount, setHashCharCount] = useState(0);

  const fullHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "uploading") {
      setProgress(0);
      setHashCharCount(0);
      const iv = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) { clearInterval(iv); timer = setTimeout(() => setPhase("metadata"), 400); return 100; }
          return prev + 4;
        });
      }, 65);
      return () => clearInterval(iv);

    } else if (phase === "metadata") {
      timer = setTimeout(() => setPhase("hashing"), 2600);

    } else if (phase === "hashing") {
      const iv = setInterval(() => {
        setHashCharCount((prev) => {
          if (prev >= fullHash.length) {
            clearInterval(iv);
            timer = setTimeout(() => setPhase("ai_analysis"), 500);
            return fullHash.length;
          }
          return prev + 1;
        });
      }, 40);
      return () => clearInterval(iv);

    } else if (phase === "ai_analysis") {
      setProgress(0);
      const iv = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) { clearInterval(iv); timer = setTimeout(() => setPhase("anchoring"), 400); return 100; }
          return prev + 2.5;
        });
      }, 80);
      return () => clearInterval(iv);

    } else if (phase === "anchoring") {
      timer = setTimeout(() => setPhase("verified"), 2200);

    } else if (phase === "verified") {
      timer = setTimeout(() => {
        setPhase("uploading");
        setProgress(0);
        setHashCharCount(0);
      }, 5000);
    }

    return () => clearTimeout(timer);
  }, [phase]);

  const handleReset = () => { setPhase("uploading"); setProgress(0); setHashCharCount(0); };

  const cfg = phaseConfig[phase];
  const currentIdx = PHASE_SEQUENCE.indexOf(phase);

  return (
    <div
      className="relative w-full max-w-[440px] mx-auto lg:mr-0 lg:ml-auto select-none"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.88) 100%)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: `1px solid ${cfg.borderColor}`,
        borderRadius: 24,
        padding: 24,
        boxShadow: `
          0 1px 3px rgba(15,23,42,0.04),
          0 8px 24px rgba(15,23,42,0.07),
          0 24px 56px rgba(15,23,42,0.06),
          inset 0 1px 0 rgba(255,255,255,1)
        `,
        transition: "border-color 0.5s ease, box-shadow 0.5s ease",
      }}
    >
      {/* Phase-reactive top accent line */}
      <div
        aria-hidden
        style={{
          position: "absolute", top: 0, left: "15%", right: "15%", height: 1,
          background: `linear-gradient(90deg, transparent, ${cfg.accentColor}, transparent)`,
          opacity: 0.8,
          transition: "background 0.5s ease",
          borderRadius: "50%",
        }}
      />

      {/* Ambient sphere */}
      <div
        aria-hidden
        className="lp-glow-sphere"
        style={{
          top: -28, right: -28,
          background: cfg.accentColor,
          opacity: 0.07,
          transition: "background 0.5s ease",
        }}
      />

      {/* ── Header ── */}
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 20, paddingBottom: 16,
          borderBottom: "1px solid rgba(15,23,42,0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: "rgba(255,255,255,0.70)",
              border: `1px solid ${cfg.borderColor}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 2px 8px ${cfg.glowColor}`,
              transition: "all 0.4s ease",
            }}
          >
            <Cpu size={14} style={{ color: cfg.accentColor, transition: "color 0.4s ease" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: 11, fontWeight: 700, color: "var(--lp-gray-1)",
                textTransform: "uppercase", letterSpacing: "0.12em",
                fontFamily: "var(--font-geist-mono, monospace)",
              }}
            >
              Evidence Terminal
            </div>
            <div style={{ fontSize: 9, color: "var(--lp-gray-3)", fontFamily: "var(--font-geist-mono, monospace)", marginTop: 1 }}>
              session: pc_9918 · forensic_mode
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          style={{
            fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em",
            background: "rgba(255,255,255,0.70)",
            border: "1px solid rgba(15,23,42,0.10)",
            color: "var(--lp-gray-3)",
            padding: "5px 12px", borderRadius: 99,
            cursor: "pointer", transition: "all 0.2s ease",
            fontFamily: "var(--font-geist-mono, monospace)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = cfg.accentColor;
            (e.currentTarget as HTMLElement).style.borderColor = cfg.borderColor;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--lp-gray-3)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(15,23,42,0.10)";
          }}
        >
          Reset
        </button>
      </div>

      {/* ── Content Body ── */}
      <div style={{ minHeight: 268 }}>
        <AnimatePresence mode="wait">

          {/* Phase 1 — Uploading */}
          {phase === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* File preview */}
              <div
                style={{
                  width: "100%", height: 140, borderRadius: 14,
                  border: "1px solid rgba(59,130,246,0.20)",
                  background: "rgba(248,250,252,0.90)",
                  position: "relative", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "url('https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop')",
                  backgroundSize: "cover", backgroundPosition: "center",
                  opacity: 0.12, filter: "saturate(0.3)",
                }} />
                {/* Blue upload scanline */}
                <div style={{
                  position: "absolute", left: 0, width: "100%", height: 2,
                  background: "linear-gradient(90deg, transparent, #3b82f6, #93c5fd, #3b82f6, transparent)",
                  animation: "scan-vertical 2s linear infinite",
                }} />
                <FileText size={34} style={{ color: "rgba(59,130,246,0.30)", position: "absolute" }} />
                <div style={{
                  position: "absolute", bottom: 10, left: 10,
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  padding: "3px 10px", borderRadius: 6,
                  fontSize: 9, fontFamily: "var(--font-geist-mono, monospace)",
                  color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.10em",
                }}>
                  surveillance_092.png
                </div>
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.20)",
                  padding: "2px 8px", borderRadius: 4,
                  fontSize: 8, fontFamily: "var(--font-geist-mono, monospace)",
                  color: "#3b82f6", letterSpacing: "0.10em",
                }}>
                  UPLOADING
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 10, fontFamily: "var(--font-geist-mono, monospace)" }}>
                  <span style={{ color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em" }}>
                    Uploading to IPFS...
                  </span>
                  <span style={{ color: "var(--lp-gray-3)" }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ width: "100%", height: 5, background: "rgba(15,23,42,0.05)", borderRadius: 99, overflow: "hidden" }}>
                  <motion.div
                    style={{
                      height: "100%", borderRadius: 99,
                      background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase 2 — Metadata */}
          {phase === "metadata" && (
            <motion.div
              key="metadata"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Search size={11} style={{ color: "#059669" }} />
                <span style={{
                  fontSize: 9, fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 700,
                  color: "#059669", textTransform: "uppercase", letterSpacing: "0.16em",
                }}>
                  Extracted EXIF Metadata
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {[
                  { label: "File Format",  val: "PNG · 3.2 MB",      highlight: false },
                  { label: "GPS Stamp",    val: "34.05°N 118.24°W",  highlight: true  },
                  { label: "Device",       val: "iPhone 15 Pro Max", highlight: false },
                  { label: "Software",     val: "Camera Original ✓", highlight: true  },
                  { label: "Captured",     val: "2026-05-31 23:52",  highlight: false },
                  { label: "Tamper Score", val: "2.4% — Safe",       highlight: true  },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      padding: "9px 10px",
                      borderRadius: 10,
                      background: item.highlight ? "rgba(5,150,105,0.05)" : "rgba(248,250,252,0.80)",
                      border: `1px solid ${item.highlight ? "rgba(5,150,105,0.18)" : "rgba(15,23,42,0.07)"}`,
                      fontFamily: "var(--font-geist-mono, monospace)",
                    }}
                  >
                    <div style={{
                      fontSize: 8, color: "var(--lp-gray-3)",
                      textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 4,
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: item.highlight ? "#059669" : "var(--lp-gray-2)",
                      fontWeight: item.highlight ? 700 : 400,
                    }}>
                      {item.val}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase 3 — Hashing */}
          {phase === "hashing" && (
            <motion.div
              key="hashing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", textAlign: "center" }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 50, height: 50, borderRadius: "50%",
                  background: "rgba(217,119,6,0.05)",
                  border: "1px solid rgba(217,119,6,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 16px rgba(217,119,6,0.10)",
                }}
              >
                <Fingerprint size={22} style={{ color: "#d97706" }} />
              </motion.div>

              <div style={{ width: "100%" }}>
                <div style={{
                  fontSize: 10, fontFamily: "var(--font-geist-mono, monospace)",
                  textTransform: "uppercase", letterSpacing: "0.12em",
                  color: "#d97706", fontWeight: 700, marginBottom: 10,
                }}>
                  Computing SHA-256 Fingerprint...
                </div>
                <div style={{
                  background: "rgba(15,23,42,0.03)",
                  border: "1px solid rgba(217,119,6,0.14)",
                  borderRadius: 12, padding: "12px 14px",
                  fontFamily: "var(--font-geist-mono, monospace)", fontSize: 10,
                  textAlign: "left", wordBreak: "break-all",
                  color: "var(--lp-gray-2)",
                  minHeight: 76, lineHeight: 1.7,
                }}>
                  <span style={{ color: "#d97706", fontWeight: 700 }}>sha256:</span>{" "}
                  {fullHash.substring(0, hashCharCount)}
                  {hashCharCount < fullHash.length && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      style={{ color: "#d97706", fontWeight: 900 }}
                    >
                      |
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase 4 — AI Analysis */}
          {phase === "ai_analysis" && (
            <motion.div
              key="ai_analysis"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(139,92,246,0.08)",
                    border: "1px solid rgba(139,92,246,0.20)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Brain size={13} style={{ color: "#8b5cf6" }} />
                </motion.div>
                <span style={{
                  fontSize: 9, fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 700,
                  color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.14em",
                }}>
                  Gemini Vision Analysis
                </span>
              </div>

              {/* AI signal rows */}
              {[
                { label: "Editing Software",    score: 0,  status: "PASS" },
                { label: "Lighting Consistency", score: 4,  status: "PASS" },
                { label: "Clone Detection",       score: 2,  status: "PASS" },
                { label: "Splice Boundaries",     score: 1,  status: "PASS" },
                { label: "Visual Tamper Score",   score: 2.4, status: "SAFE" },
              ].map((sig, idx) => (
                <motion.div
                  key={sig.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.12 }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "7px 10px",
                    borderRadius: 9,
                    background: "rgba(248,250,252,0.80)",
                    border: "1px solid rgba(15,23,42,0.06)",
                    fontFamily: "var(--font-geist-mono, monospace)",
                  }}
                >
                  <span style={{ fontSize: 9, color: "var(--lp-gray-2)" }}>{sig.label}</span>
                  <span style={{
                    fontSize: 8, fontWeight: 700,
                    color: sig.status === "SAFE" ? "#059669" : "#8b5cf6",
                    background: sig.status === "SAFE" ? "rgba(5,150,105,0.08)" : "rgba(139,92,246,0.08)",
                    border: `1px solid ${sig.status === "SAFE" ? "rgba(5,150,105,0.20)" : "rgba(139,92,246,0.20)"}`,
                    padding: "2px 7px", borderRadius: 5,
                    letterSpacing: "0.08em",
                  }}>
                    {sig.status}
                  </span>
                </motion.div>
              ))}

              {/* Progress */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 9, fontFamily: "var(--font-geist-mono, monospace)" }}>
                  <span style={{ color: "#8b5cf6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em" }}>
                    Analysis Progress
                  </span>
                  <span style={{ color: "var(--lp-gray-3)" }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ width: "100%", height: 4, background: "rgba(15,23,42,0.05)", borderRadius: 99, overflow: "hidden" }}>
                  <motion.div
                    style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #6d28d9, #8b5cf6, #a78bfa)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase 5 — Blockchain Anchoring */}
          {phase === "anchoring" && (
            <motion.div
              key="anchoring"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}
            >
              {/* Chain animation */}
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(16,185,129,0.06)",
                  border: "1.5px dashed rgba(16,185,129,0.30)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Link2 size={22} style={{ color: "#10b981" }} />
              </motion.div>

              <div style={{
                fontSize: 10, fontFamily: "var(--font-geist-mono, monospace)",
                textTransform: "uppercase", letterSpacing: "0.12em",
                color: "#10b981", fontWeight: 700,
              }}>
                Anchoring to Polygon Amoy...
              </div>

              {[
                { label: "Network",   val: "Polygon Amoy (Testnet)" },
                { label: "Hash",      val: "sha256:e3b0c44298fc..." },
                { label: "IPFS CID",  val: "bafybeig8l4r..." },
                { label: "Gas Est.",  val: "~0.0021 MATIC" },
              ].map((row, idx) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  style={{
                    width: "100%", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    padding: "7px 12px", borderRadius: 9,
                    background: "rgba(248,250,252,0.80)",
                    border: "1px solid rgba(15,23,42,0.06)",
                    fontFamily: "var(--font-geist-mono, monospace)",
                  }}
                >
                  <span style={{ fontSize: 9, color: "var(--lp-gray-3)", textTransform: "uppercase", letterSpacing: "0.10em" }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: 9, color: "#10b981", fontWeight: 600 }}>
                    {row.val}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Phase 6 — Verified */}
          {phase === "verified" && (
            <motion.div
              key="verified"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}
            >
              {/* Shield icon */}
              <div style={{ position: "relative" }}>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "rgba(5,150,105,0.06)",
                    border: "1px solid rgba(5,150,105,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 24px rgba(5,150,105,0.12)",
                  }}
                >
                  <ShieldCheck size={36} style={{ color: "#059669" }} />
                </motion.div>
                {/* Ping ring */}
                <motion.div
                  animate={{ scale: [1, 1.55], opacity: [0.5, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  style={{
                    position: "absolute", inset: -6,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(5,150,105,0.25)",
                  }}
                />
              </div>

              <div>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: "#059669",
                  textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6,
                  fontFamily: "var(--font-geist-mono, monospace)",
                }}>
                  Evidence Sealed
                </div>
                <p style={{
                  fontSize: 10, color: "var(--lp-gray-3)",
                  fontFamily: "var(--font-geist-mono, monospace)", lineHeight: 1.75, padding: "0 8px",
                }}>
                  Anchored to Polygon Amoy. Block #199482.
                  Immutable, transparent, custody locked.
                </p>
              </div>

              {/* Tx row */}
              <div style={{
                width: "100%",
                background: "rgba(5,150,105,0.04)",
                border: "1px solid rgba(5,150,105,0.14)",
                borderRadius: 12, padding: "9px 12px",
                fontFamily: "var(--font-geist-mono, monospace)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{
                    fontSize: 7, color: "#059669",
                    textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 700, marginBottom: 3,
                  }}>
                    Transaction Hash
                  </div>
                  <div style={{ fontSize: 9, color: "#059669" }}>0x3fa5fde72c5b4198bad813...</div>
                </div>
                <span style={{
                  background: "rgba(5,150,105,0.08)",
                  border: "1px solid rgba(5,150,105,0.22)",
                  color: "#059669",
                  fontSize: 8, fontWeight: 700,
                  padding: "4px 10px", borderRadius: 7,
                  textTransform: "uppercase", letterSpacing: "0.10em",
                }}>
                  Success
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 6-Node Pipeline tracker ── */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(15,23,42,0.07)" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", marginBottom: 8,
          fontSize: 8, fontFamily: "var(--font-geist-mono, monospace)",
          textTransform: "uppercase", letterSpacing: "0.14em",
        }}>
          <span style={{ color: "var(--lp-gray-3)" }}>Pipeline</span>
          <span style={{ color: "#059669", fontWeight: 700 }}>100% Secure</span>
        </div>

        {/* Nodes row */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 0 }}>
          {/* Connecting track */}
          <div style={{
            position: "absolute",
            left: 10, right: 10, top: "50%",
            height: 1.5,
            background: "rgba(15,23,42,0.06)",
            transform: "translateY(-50%)",
            zIndex: 0,
          }} />

          {/* Animated fill track */}
          <motion.div
            style={{
              position: "absolute",
              left: 10, top: "50%",
              height: 1.5,
              background: "linear-gradient(90deg, #059669, #10b981)",
              transform: "translateY(-50%)",
              transformOrigin: "left",
              zIndex: 1,
            }}
            animate={{ width: currentIdx === 0 ? "0%" : `${Math.min(((currentIdx) / (PHASE_SEQUENCE.length - 1)) * 100, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {PHASE_SEQUENCE.map((key, idx) => {
            const p          = phaseConfig[key];
            const isActive   = phase === key;
            const isCompleted = idx < currentIdx;
            const PhaseIcon  = p.icon;

            return (
              <div
                key={key}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {/* Node circle */}
                <div
                  className={isActive ? "lp-pipeline-node" : ""}
                  style={{
                    width: isActive ? 24 : 18,
                    height: isActive ? 24 : 18,
                    borderRadius: "50%",
                    background: isActive
                      ? p.accentColor
                      : isCompleted
                        ? "#059669"
                        : "rgba(255,255,255,0.95)",
                    border: `1.5px solid ${isActive ? p.accentColor : isCompleted ? "#059669" : "rgba(15,23,42,0.12)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
                    boxShadow: isActive ? `0 0 0 3px ${p.accentColor}22` : "none",
                    color: isActive || isCompleted ? "#fff" : "rgba(15,23,42,0.20)",
                  }}
                >
                  {isCompleted ? (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <PhaseIcon size={isActive ? 10 : 8} />
                  )}
                </div>

                {/* Label */}
                <span style={{
                  fontSize: 7, fontFamily: "var(--font-geist-mono, monospace)",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  color: isActive ? "var(--lp-gray-1)" : isCompleted ? "var(--lp-gray-3)" : "rgba(15,23,42,0.18)",
                  fontWeight: isActive ? 700 : 400,
                  transition: "all 0.4s ease",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}>
                  {p.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
