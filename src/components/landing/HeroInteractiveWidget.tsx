"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldCheck, Cpu, HardDrive, Binary, Compass, FileText } from "lucide-react";

export default function HeroInteractiveWidget() {
  const [phase, setPhase] = useState<"scanning" | "exif" | "hashing" | "sealed">("scanning");
  const [progress, setProgress] = useState(0);
  const [hashCharCount, setHashCharCount] = useState(0);

  const fullHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  useEffect(() => {
    let timer: any;
    if (phase === "scanning") {
      setProgress(0);
      setHashCharCount(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setPhase("exif");
            return 100;
          }
          return prev + 4;
        });
      }, 80);
      return () => clearInterval(interval);
    } else if (phase === "exif") {
      timer = setTimeout(() => {
        setPhase("hashing");
      }, 2500);
    } else if (phase === "hashing") {
      const interval = setInterval(() => {
        setHashCharCount((prev) => {
          if (prev >= fullHash.length) {
            clearInterval(interval);
            timer = setTimeout(() => {
              setPhase("sealed");
            }, 800);
            return fullHash.length;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    } else if (phase === "sealed") {
      timer = setTimeout(() => {
        setPhase("scanning");
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [phase]);

  const handleManualTrigger = () => {
    setPhase("scanning");
    setProgress(0);
    setHashCharCount(0);
  };

  return (
    <div className="lp-liquid-glass p-6 md:p-8 w-full max-w-[480px] mx-auto min-h-[460px] flex flex-col justify-between relative group select-none">
      {/* Decorative Aurora Spheres Inside Card */}
      <div 
        className="lp-glow-sphere" 
        style={{ 
          top: "-20px", 
          right: "-20px", 
          background: "var(--lp-primary-neon)" 
        }} 
      />
      <div 
        className="lp-glow-sphere" 
        style={{ 
          bottom: "-30px", 
          left: "-30px", 
          background: "var(--lp-secondary-neon)",
          animationDelay: "-3s" 
        }} 
      />

      {/* Widget Header */}
      <div className="flex justify-between items-center z-10 border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[var(--lp-accent)]">
            <Cpu size={16} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest leading-none">Evidence Terminal</h4>
            <span className="text-[10px] text-white/40 font-mono">active_session: pc_9918</span>
          </div>
        </div>
        <button 
          onClick={handleManualTrigger}
          className="text-[9px] uppercase tracking-wider bg-white/5 hover:bg-[var(--lp-accent)]/10 border border-white/10 hover:border-[var(--lp-accent)]/30 text-white/60 hover:text-[var(--lp-accent)] py-1.5 px-3 rounded-full transition-all duration-300 active:scale-95"
        >
          Reset Scan
        </button>
      </div>

      {/* Widget Content Body */}
      <div className="flex-1 flex flex-col justify-center py-2 z-10 relative">
        <AnimatePresence mode="wait">
          {/* Phase 1: Scanning Visualizer */}
          {phase === "scanning" && (
            <motion.div 
              key="scanning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4 text-center items-center py-4"
            >
              <div className="w-full h-36 bg-transparent/40 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                {/* Simulated file photo */}
                <div className="absolute inset-0 bg-cover bg-center filter saturate-50 opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop')" }} />
                <div className="scanline-glow" />
                <FileText size={42} className="text-[var(--lp-accent)]/50 absolute" />
                <div className="absolute bottom-3 left-3 bg-transparent/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono text-[var(--lp-accent)] uppercase tracking-widest">
                  surveillance_092.png
                </div>
              </div>
              <div className="w-full">
                <div className="flex justify-between items-center mb-1 text-[11px] font-mono">
                  <span className="text-[var(--lp-accent)] font-bold uppercase tracking-wider animate-pulse">Running Gemini AI Analysis...</span>
                  <span className="text-white/60">{progress}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-400" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeInOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase 2: EXIF Metadata extraction */}
          {phase === "exif" && (
            <motion.div 
              key="exif"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-3 py-2 text-left"
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--lp-accent)] font-bold flex items-center gap-1.5 mb-1">
                <Compass size={12} className="animate-spin" style={{ animationDuration: "3s" }} />
                EXTRACTED EXIF METADATA
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "File Format", val: "PNG Image (3.2 MB)" },
                  { label: "GPS Stamp", val: "34.0522° N, 118.2437° W" },
                  { label: "Capture Device", val: "iPhone 15 Pro Max" },
                  { label: "Software Marker", val: "Camera Original (No Photoshop)" },
                  { label: "Timestamp", val: "2026-05-31 23:52:12" },
                  { label: "AI Alteration Score", val: "2.4% (Highly Safe)" }
                ].map((item, idx) => (
                  <motion.div 
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/5 font-mono"
                  >
                    <span className="block text-[8px] text-white/40 uppercase tracking-widest leading-none mb-1">{item.label}</span>
                    <span className="block text-[10px] text-white/80 truncate">{item.val}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase 3: Cryptographic Hashing */}
          {phase === "hashing" && (
            <motion.div 
              key="hashing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4 text-center items-center py-4"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--lp-accent)]/10 border border-[var(--lp-accent)]/30 flex items-center justify-center text-[var(--lp-accent)]">
                <Binary size={20} className="animate-pulse" />
              </div>
              <div className="w-full">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--lp-accent)] font-bold mb-2 block">
                  Computing SHA-256 Fingerprint...
                </span>
                <div className="bg-transparent/40 border border-white/5 rounded-xl p-4 font-mono text-[11px] text-left break-all text-white/60 min-h-[72px] leading-relaxed select-text">
                  <span className="text-[var(--lp-accent)]">hash:</span> {fullHash.substring(0, hashCharCount)}
                  {hashCharCount < fullHash.length && <span className="animate-ping text-[var(--lp-accent)] font-extrabold">|</span>}
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase 4: Sealed and Anchored */}
          {phase === "sealed" && (
            <motion.div 
              key="sealed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-4 text-center items-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--lp-accent)]/10 border border-[var(--lp-accent)]/30 flex items-center justify-center text-[var(--lp-accent)] relative">
                <ShieldCheck size={36} />
                <span className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-ping" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-white uppercase tracking-widest">Evidence Cryptographically Sealed</h5>
                <p className="text-[10px] text-white/60 font-mono mt-1 px-4 leading-normal">
                  Permanently anchored to the Polygon Amoy blockchain. Block #199482. Immutable, transparent, custody locked.
                </p>
              </div>

              {/* Holographic transaction link */}
              <div className="bg-white/5 border border-white/5 w-full rounded-lg py-2.5 px-4 font-mono text-[9px] text-left flex justify-between items-center">
                <div>
                  <span className="block text-white/40 uppercase tracking-widest">TRANSACTION HASH</span>
                  <span className="text-[var(--lp-accent)] truncate block max-w-[200px]">0x3fa5fde72c5b4198bad813ad9d...</span>
                </div>
                <span className="bg-[var(--lp-accent)]/10 border border-[var(--lp-accent)]/25 text-[var(--lp-accent)] font-bold px-2 py-1 rounded text-[8px] tracking-widest uppercase">
                  SUCCESS
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Widget Footer Pipeline State Tracker */}
      <div className="z-10 mt-4 border-t border-white/5 pt-4">
        <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-white/50">
          <span>Pipeline Status</span>
          <span className="text-white/80 font-bold">100% SECURE</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {[
            { key: "scanning", label: "Analyze" },
            { key: "exif", label: "Inspect" },
            { key: "hashing", label: "Hash" },
            { key: "sealed", label: "Secure" }
          ].map((item, idx) => {
            const active = phase === item.key;
            const completed = 
              (phase === "exif" && idx === 0) ||
              (phase === "hashing" && idx <= 1) ||
              (phase === "sealed" && idx <= 2) ||
              phase === "sealed";
            return (
              <div key={item.key} className="flex flex-col gap-1 items-center">
                <div className={`h-1 w-full rounded-full transition-all duration-500 ${
                  active 
                    ? "bg-emerald-400 shadow-[0_0_8px_#00f59b]" 
                    : completed 
                      ? "bg-emerald-600" 
                      : "bg-white/5"
                }`} />
                <span className={`text-[8px] transition-all duration-300 ${
                  active 
                    ? "text-[var(--lp-accent)] font-bold" 
                    : completed 
                      ? "text-[var(--lp-accent)]" 
                      : "text-white/30"
                }`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
