"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Cpu, FileText, Fingerprint, Activity, Search } from "lucide-react";

type Phase = "scanning" | "exif" | "hashing" | "sealed";

const PHASE_SEQUENCE: Phase[] = ["scanning", "exif", "hashing", "sealed"];

const phaseConfig = {
  scanning: {
    label: "AI Vision Scan",
    accentColor: "#d97706",
    borderColor: "rgba(217,119,6,0.20)",
    glowColor: "rgba(217,119,6,0.08)",
    trackColor: "#d97706",
    doneTrackColor: "#92400e",
  },
  exif: {
    label: "EXIF Inspect",
    accentColor: "#059669",
    borderColor: "rgba(5,150,105,0.20)",
    glowColor: "rgba(5,150,105,0.07)",
    trackColor: "#059669",
    doneTrackColor: "#064e3b",
  },
  hashing: {
    label: "SHA-256 Hash",
    accentColor: "#b45309",
    borderColor: "rgba(180,83,9,0.20)",
    glowColor: "rgba(180,83,9,0.08)",
    trackColor: "#b45309",
    doneTrackColor: "#78350f",
  },
  sealed: {
    label: "Chain Seal",
    accentColor: "#059669",
    borderColor: "rgba(5,150,105,0.25)",
    glowColor: "rgba(5,150,105,0.10)",
    trackColor: "#059669",
    doneTrackColor: "#047857",
  },
};

export default function HeroInteractiveWidget() {
  const [phase, setPhase] = useState<Phase>("scanning");
  const [progress, setProgress] = useState(0);
  const [hashCharCount, setHashCharCount] = useState(0);

  const fullHash = "e3b0c44298fc1c149afbf4c8996fb924";

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "scanning") {
      setProgress(0);
      setHashCharCount(0);
      const iv = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) { clearInterval(iv); setPhase("exif"); return 100; }
          return prev + 3.5;
        });
      }, 75);
      return () => clearInterval(iv);

    } else if (phase === "exif") {
      timer = setTimeout(() => setPhase("hashing"), 2800);

    } else if (phase === "hashing") {
      const iv = setInterval(() => {
        setHashCharCount((prev) => {
          if (prev >= fullHash.length) {
            clearInterval(iv);
            timer = setTimeout(() => setPhase("sealed"), 700);
            return fullHash.length;
          }
          return prev + 1;
        });
      }, 55);
      return () => clearInterval(iv);

    } else if (phase === "sealed") {
      timer = setTimeout(() => setPhase("scanning"), 5500);
    }

    return () => clearTimeout(timer);
  }, [phase]);

  const handleReset = () => { setPhase("scanning"); setProgress(0); setHashCharCount(0); };

  const cfg = phaseConfig[phase];

  return (
    <div
      className="relative w-full max-w-[460px] mx-auto lg:mr-0 lg:ml-auto lg:-mt-20 select-none"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.72) 100%)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: `1px solid ${cfg.borderColor}`,
        borderRadius: 28,
        padding: 28,
        boxShadow: `0 24px 64px rgba(15,23,42,0.08), 0 0 32px ${cfg.glowColor}, inset 0 1px 0 rgba(255,255,255,0.95)`,
        transition: "border-color 0.6s ease, box-shadow 0.6s ease",
      }}
    >
      {/* Phase-reactive top light */}
      <div
        aria-hidden
        style={{
          position: "absolute", top: 0, left: "12%", right: "12%", height: 1,
          background: `linear-gradient(90deg, transparent, ${cfg.accentColor}, transparent)`,
          opacity: 0.9,
          transition: "background 0.6s ease",
          borderRadius: "50%",
        }}
      />

      {/* Floating ambient sphere */}
      <div
        aria-hidden
        className="lp-glow-sphere"
        style={{
          top: -32, right: -32,
          background: cfg.accentColor,
          opacity: 0.08,
          transition: "background 0.6s ease",
        }}
      />

      {/* ── Header ── */}
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 22, paddingBottom: 18,
          borderBottom: "1px solid rgba(15,23,42,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: "rgba(255,255,255,0.60)",
              border: `1px solid ${cfg.borderColor}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 16px ${cfg.glowColor}`,
              transition: "all 0.5s ease",
            }}
          >
            <Cpu size={15} style={{ color: cfg.accentColor, transition: "color 0.5s ease" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: 11, fontWeight: 700, color: "var(--lp-gray-1)",
                textTransform: "uppercase", letterSpacing: "0.14em",
                fontFamily: "var(--font-orbitron, monospace)",
              }}
            >
              Evidence Terminal
            </div>
            <div style={{ fontSize: 9, color: "var(--lp-gray-3)", fontFamily: "var(--font-geist-mono, monospace)", marginTop: 2 }}>
              session: pc_9918 · forensic_mode
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          style={{
            fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em",
            background: "rgba(255,255,255,0.60)",
            border: "1px solid rgba(15,23,42,0.12)",
            color: "var(--lp-gray-2)",
            padding: "6px 14px", borderRadius: 99,
            cursor: "pointer", transition: "all 0.25s ease",
            fontFamily: "var(--font-geist-mono, monospace)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = cfg.accentColor;
            (e.currentTarget as HTMLElement).style.borderColor = cfg.borderColor;
            (e.currentTarget as HTMLElement).style.background = `${cfg.glowColor}`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--lp-gray-2)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(15,23,42,0.12)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.60)";
          }}
        >
          Reset
        </button>
      </div>

      {/* ── Content Body ── */}
      <div style={{ minHeight: 288 }}>
        <AnimatePresence mode="wait">

          {/* Phase 1 — Scanning */}
          {phase === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 18 }}
            >
              {/* File preview */}
              <div
                style={{
                  width: "100%", height: 150, borderRadius: 14,
                  border: "1px solid rgba(217,119,6,0.20)",
                  background: "rgba(248,250,252,0.85)",
                  position: "relative", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {/* Background image */}
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "url('https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop')",
                  backgroundSize: "cover", backgroundPosition: "center",
                  opacity: 0.15, filter: "saturate(0.4) sepia(0.3)",
                }} />
                {/* Amber scanline */}
                <div style={{
                  position: "absolute", left: 0, width: "100%", height: 2,
                  background: "linear-gradient(90deg, transparent, #d97706, #fbbf24, #d97706, transparent)",
                  boxShadow: "0 0 10px rgba(217,119,6,0.6), 0 0 20px rgba(217,119,6,0.2)",
                  animation: "scan-vertical 2.5s linear infinite",
                }} />
                <FileText size={38} style={{ color: "rgba(217,119,6,0.35)", position: "absolute" }} />
                {/* Filename badge */}
                <div style={{
                  position: "absolute", bottom: 10, left: 10,
                  background: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(217,119,6,0.3)",
                  padding: "3px 10px", borderRadius: 6,
                  fontSize: 9, fontFamily: "var(--font-geist-mono, monospace)",
                  color: "#d97706", textTransform: "uppercase", letterSpacing: "0.12em",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
                }}>
                  surveillance_092.png
                </div>
                {/* Top-right tag */}
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  background: "rgba(217,119,6,0.08)",
                  border: "1px solid rgba(217,119,6,0.2)",
                  padding: "2px 8px", borderRadius: 4,
                  fontSize: 8, fontFamily: "var(--font-geist-mono, monospace)",
                  color: "#d97706", letterSpacing: "0.1em",
                }}>
                  AI SCANNING
                </div>
              </div>

              {/* Progress */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 10, fontFamily: "var(--font-geist-mono, monospace)" }}>
                  <span style={{ color: "#d97706", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Gemini Vision Analysis...
                  </span>
                  <span style={{ color: "var(--lp-gray-3)" }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ width: "100%", height: 6, background: "rgba(15,23,42,0.06)", borderRadius: 99, overflow: "hidden" }}>
                  <motion.div
                    style={{
                      height: "100%", borderRadius: 99,
                      background: "linear-gradient(90deg, #92400e, #d97706, #fbbf24)",
                      boxShadow: "0 0 6px rgba(217,119,6,0.3)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase 2 — EXIF */}
          {phase === "exif" && (
            <motion.div
              key="exif"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Search size={12} style={{ color: "#059669" }} />
                <span style={{
                  fontSize: 9, fontFamily: "var(--font-geist-mono, monospace)", fontWeight: 700,
                  color: "#059669", textTransform: "uppercase", letterSpacing: "0.18em",
                }}>
                  Extracted EXIF Metadata
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "File Format", val: "PNG · 3.2 MB", highlight: false },
                  { label: "GPS Stamp", val: "34.05°N 118.24°W", highlight: true },
                  { label: "Device", val: "iPhone 15 Pro Max", highlight: false },
                  { label: "Software", val: "Camera Original ✓", highlight: true },
                  { label: "Captured", val: "2026-05-31 23:52", highlight: false },
                  { label: "Tamper Score", val: "2.4% — Safe", highlight: true },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.93 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: item.highlight ? "rgba(5,150,105,0.05)" : "rgba(255,255,255,0.50)",
                      border: `1px solid ${item.highlight ? "rgba(5,150,105,0.20)" : "rgba(15,23,42,0.08)"}`,
                      fontFamily: "var(--font-geist-mono, monospace)",
                    }}
                  >
                    <div style={{
                      fontSize: 8, color: "var(--lp-gray-3)",
                      textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 5,
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
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center", textAlign: "center" }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 54, height: 54, borderRadius: "50%",
                  background: "rgba(180,83,9,0.05)",
                  border: "1px solid rgba(180,83,9,0.20)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 16px rgba(180,83,9,0.15)",
                }}
              >
                <Fingerprint size={24} style={{ color: "#b45309" }} />
              </motion.div>

              <div style={{ width: "100%" }}>
                <div style={{
                  fontSize: 10, fontFamily: "var(--font-geist-mono, monospace)",
                  textTransform: "uppercase", letterSpacing: "0.12em",
                  color: "#b45309", fontWeight: 700, marginBottom: 12,
                }}>
                  Computing SHA-256 Fingerprint...
                </div>
                <div style={{
                  background: "rgba(15,23,42,0.04)",
                  border: "1px solid rgba(180,83,9,0.15)",
                  borderRadius: 12, padding: "14px 16px",
                  fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11,
                  textAlign: "left", wordBreak: "break-all",
                  color: "var(--lp-gray-2)",
                  minHeight: 80, lineHeight: 1.7,
                }}>
                  <span style={{ color: "#b45309", fontWeight: 700 }}>sha256:</span>{" "}
                  {fullHash.substring(0, hashCharCount)}
                  {hashCharCount < fullHash.length && (
                     <motion.span
                       animate={{ opacity: [1, 0] }}
                       transition={{ duration: 0.5, repeat: Infinity }}
                       style={{ color: "#b45309", fontWeight: 900 }}
                     >
                       |
                     </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase 4 — Sealed */}
          {phase === "sealed" && (
            <motion.div
              key="sealed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", textAlign: "center" }}
            >
              {/* Shield icon */}
              <div style={{ position: "relative" }}>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    width: 76, height: 76, borderRadius: "50%",
                    background: "rgba(5,150,105,0.05)",
                    border: "1px solid rgba(5,150,105,0.30)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 32px rgba(5,150,105,0.15)",
                  }}
                >
                  <ShieldCheck size={40} style={{ color: "#059669" }} />
                </motion.div>
                {/* Ping ring */}
                <motion.div
                  animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    position: "absolute", inset: -6,
                    borderRadius: "50%",
                    border: "2px solid rgba(5,150,105,0.30)",
                  }}
                />
              </div>

              <div>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: "#059669",
                  textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
                  fontFamily: "var(--font-orbitron, monospace)",
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
                border: "1px solid rgba(5,150,105,0.15)",
                borderRadius: 12, padding: "10px 14px",
                fontFamily: "var(--font-geist-mono, monospace)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{
                    fontSize: 7, color: "#059669",
                    textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700, marginBottom: 3,
                  }}>
                    Transaction Hash
                  </div>
                  <div style={{ fontSize: 10, color: "#059669" }}>0x3fa5fde72c5b4198bad813...</div>
                </div>
                <span style={{
                  background: "rgba(5,150,105,0.08)",
                  border: "1px solid rgba(5,150,105,0.25)",
                  color: "#059669",
                  fontSize: 8, fontWeight: 700,
                  padding: "5px 12px", borderRadius: 8,
                  textTransform: "uppercase", letterSpacing: "0.12em",
                  boxShadow: "0 0 12px rgba(5,150,105,0.1)",
                }}>
                  Success
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Pipeline tracker ── */}
      <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(15,23,42,0.08)" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", marginBottom: 10,
          fontSize: 8, fontFamily: "var(--font-geist-mono, monospace)",
          textTransform: "uppercase", letterSpacing: "0.15em",
        }}>
          <span style={{ color: "var(--lp-gray-3)" }}>Pipeline</span>
          <span style={{ color: "#059669", fontWeight: 700 }}>100% Secure</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {PHASE_SEQUENCE.map((key, idx) => {
            const p = phaseConfig[key];
            const active = phase === key;
            const phaseIdx = PHASE_SEQUENCE.indexOf(phase);
            const completed = idx < phaseIdx || phase === "sealed";
            return (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
                <div style={{
                  height: 3, width: "100%", borderRadius: 99,
                  background: active ? p.trackColor : completed ? p.doneTrackColor : "rgba(15,23,42,0.06)",
                  boxShadow: active ? `0 0 10px ${p.trackColor}` : "none",
                  transition: "all 0.5s ease",
                }} />
                <span style={{
                  fontSize: 7.5, fontFamily: "var(--font-geist-mono, monospace)",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  color: active ? "var(--lp-gray-1)" : completed ? "var(--lp-gray-3)" : "rgba(15,23,42,0.22)",
                  fontWeight: active ? 700 : 400,
                  transition: "all 0.4s ease",
                }}>
                  {p.label.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
