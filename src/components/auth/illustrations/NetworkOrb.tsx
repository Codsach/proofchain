"use client";

import { motion } from "framer-motion";

/* NetworkOrb — Login illustration
   Rich animated scene: spinning orbital rings, a pulsing core,
   animated graph edges with travelling dot packets, floating hexagons. */

// Graph nodes
const nodes = [
  { cx: 220, cy: 220, r: 7, primary: true },
  { cx: 96,  cy: 130, r: 4.5 },
  { cx: 344, cy: 108, r: 4 },
  { cx: 374, cy: 268, r: 3.5 },
  { cx: 78,  cy: 308, r: 3.5 },
  { cx: 158, cy: 374, r: 3 },
  { cx: 314, cy: 376, r: 3 },
  { cx: 48,  cy: 220, r: 3 },
  { cx: 392, cy: 168, r: 3 },
  { cx: 262, cy: 56,  r: 3 },
  { cx: 140, cy: 60,  r: 2.5 },
  { cx: 300, cy: 170, r: 3 },
  { cx: 130, cy: 290, r: 2.5 },
];

const edges = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 11],
  [1, 7], [1, 4], [1, 10], [2, 8], [2, 9],
  [3, 6], [4, 5], [5, 6], [3, 8], [11, 3],
  [12, 4], [12, 5], [0, 12],
];

// Hexagons floating around
const hexagons = [
  { cx: 60,  cy: 80,  size: 18, delay: 0 },
  { cx: 380, cy: 60,  size: 14, delay: 1.2 },
  { cx: 30,  cy: 360, size: 16, delay: 0.7 },
  { cx: 400, cy: 340, size: 12, delay: 1.8 },
  { cx: 200, cy: 30,  size: 10, delay: 0.4 },
];

function hexPath(cx: number, cy: number, size: number) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`;
  });
  return `M${pts.join("L")}Z`;
}

// Travelling packet dots on edges
const packets = [
  { edge: 0, delay: 0 },
  { edge: 2, delay: 0.8 },
  { edge: 5, delay: 1.6 },
  { edge: 9, delay: 2.4 },
  { edge: 14, delay: 0.4 },
];

export function NetworkOrb() {
  return (
    <div className="flex flex-col items-center gap-6 w-full select-none">
      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6 }}
        className="text-center space-y-1.5"
      >
        <h2 className="headline-sm font-heading font-bold text-[#1e293b] tracking-wider uppercase">
          Welcome Back, Agent
        </h2>
        <p className="body-sm text-[#64748b] font-sans">
          Access your forensic workspace
        </p>
      </motion.div>

      {/* SVG canvas */}
      <div className="relative w-[440px] h-[450px] max-w-full">
        <svg
          viewBox="0 0 440 450"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <defs>
            {/* Core radial gradient */}
            <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ffffff" />
              <stop offset="35%"  stopColor="#d1fae5" />
              <stop offset="75%"  stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
            </radialGradient>
            {/* Glow halo */}
            <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="60%"  stopColor="#10b981" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            {/* Orbital ring gradient */}
            <linearGradient id="ringGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="50%"  stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="ringGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>
            {/* Soft node glow filter */}
            <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="coreGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Halo pulse ── */}
          <motion.circle
            cx="220" cy="225" r="115"
            fill="url(#haloGrad)"
            animate={{ r: [100, 125, 100], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
          />

          {/* ── Spinning orbital ring 1 ── */}
          <motion.ellipse
            cx="220" cy="225"
            rx="145" ry="40"
            fill="none"
            stroke="url(#ringGrad1)"
            strokeWidth="1.5"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
            style={{ transformOrigin: "220px 225px" }}
          />

          {/* ── Spinning orbital ring 2 (tilted) ── */}
          <motion.ellipse
            cx="220" cy="225"
            rx="40" ry="145"
            fill="none"
            stroke="url(#ringGrad2)"
            strokeWidth="1.2"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            style={{ transformOrigin: "220px 225px" }}
          />

          {/* ── Hexagon decorations ── */}
          {hexagons.map((h, i) => (
            <motion.path
              key={i}
              d={hexPath(h.cx, h.cy, h.size)}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.2"
              strokeOpacity="0.35"
              animate={{
                y: [0, -10, 0],
                strokeOpacity: [0.2, 0.55, 0.2],
              }}
              transition={{
                delay: h.delay,
                repeat: Infinity,
                duration: 5 + i * 0.6,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* ── Edges ── */}
          {edges.map(([a, b], i) => (
            <motion.line
              key={i}
              x1={nodes[a].cx} y1={nodes[a].cy}
              x2={nodes[b].cx} y2={nodes[b].cy}
              stroke={i % 3 === 0 ? "#3b82f6" : "#10b981"}
              strokeWidth={i < 5 ? 1.2 : 0.8}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: [0.12, i < 5 ? 0.5 : 0.3, 0.12],
              }}
              transition={{
                pathLength: { delay: 0.4 + i * 0.06, duration: 0.9, ease: "easeOut" },
                opacity: {
                  delay: 1.2 + i * 0.07,
                  repeat: Infinity,
                  duration: 3.2 + (i % 4) * 0.5,
                  ease: "easeInOut",
                },
              }}
            />
          ))}

          {/* ── Travelling packet dots ── */}
          {packets.map((p, i) => {
            const a = nodes[edges[p.edge][0]];
            const b = nodes[edges[p.edge][1]];
            return (
              <motion.circle
                key={i}
                r="3.5"
                fill="#3b82f6"
                filter="url(#nodeGlow)"
                animate={{
                  cx: [a.cx, b.cx, a.cx],
                  cy: [a.cy, b.cy, a.cy],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  delay: p.delay,
                  repeat: Infinity,
                  duration: 2.8,
                  ease: "easeInOut",
                  times: [0, 0.45, 0.55, 1],
                }}
              />
            );
          })}

          {/* ── Satellite nodes ── */}
          {nodes.slice(1).map((n, i) => (
            <motion.circle
              key={i}
              cx={n.cx} cy={n.cy} r={n.r}
              fill={i % 4 === 1 ? "#3b82f6" : "#10b981"}
              filter="url(#nodeGlow)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1.15, 0.85] }}
              transition={{
                opacity: { delay: 0.8 + i * 0.1, repeat: Infinity, duration: 2.8 + i * 0.25, ease: "easeInOut" },
                scale:   { delay: 0.8 + i * 0.1, repeat: Infinity, duration: 2.8 + i * 0.25, ease: "easeInOut" },
              }}
            />
          ))}

          {/* ── Central core ── */}
          <motion.circle
            cx="220" cy="225" r="26"
            fill="url(#coreGrad)"
            filter="url(#coreGlow)"
            animate={{ r: [23, 28, 23], opacity: [0.9, 1, 0.9] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          {/* Inner white sparkle */}
          <motion.circle
            cx="220" cy="225" r="9"
            fill="white"
            animate={{ opacity: [0.5, 1, 0.5], r: [8, 10, 8] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          />
        </svg>

        {/* ── Floating data pills ── */}
        {[
          { label: "HASH VERIFIED",  delay: 1.0, x: "5%",  y: "15%" },
          { label: "CHAIN INTACT",   delay: 1.5, x: "63%", y: "6%"  },
          { label: "ENCRYPTED",      delay: 2.0, x: "68%", y: "80%" },
          { label: "IMMUTABLE",      delay: 2.5, x: "2%",  y: "75%" },
          { label: "BLOCK #8291",    delay: 1.2, x: "36%", y: "92%" },
        ].map((pill, i) => (
          <motion.div
            key={i}
            className="absolute label-sm font-heading font-semibold tracking-[0.16em] text-[#059669] bg-white/60 border border-[#10b981]/30 backdrop-blur-sm px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm"
            style={{ left: pill.x, top: pill.y }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -8] }}
            transition={{
              delay: pill.delay,
              duration: 4.5,
              repeat: Infinity,
              repeatDelay: 1.8,
              ease: "easeInOut",
              times: [0, 0.18, 0.82, 1],
            }}
          >
            {pill.label}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
