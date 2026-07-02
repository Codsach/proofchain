"use client";

import { motion } from "framer-motion";

/* ShieldMaterialize — Reset Password illustration
   A shield assembling from converging particles. */

// Particle origins (scatter positions)
const particles = [
  { sx: 60, sy: 80 }, { sx: 320, sy: 60 }, { sx: 40, sy: 200 },
  { sx: 340, sy: 200 }, { sx: 80, sy: 340 }, { sx: 300, sy: 350 },
  { sx: 180, sy: 40 }, { sx: 180, sy: 380 }, { sx: 20, sy: 280 },
  { sx: 360, sy: 280 }, { sx: 120, sy: 50 }, { sx: 240, sy: 50 },
];

export function ShieldMaterialize() {
  return (
    <div className="flex flex-col items-center gap-8 w-full select-none">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center space-y-1.5"
      >
        <h2 className="headline-sm font-heading font-bold text-[#1e293b] tracking-wider uppercase">
          Secure Reset
        </h2>
        <p className="body-sm text-[#64748b] font-sans">
          Establish a new secure credential
        </p>
      </motion.div>

      <div className="relative w-[380px] h-[400px] max-w-full flex items-center justify-center">
        <svg
          viewBox="0 0 380 400"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="shieldGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#d1fae5" />
              <stop offset="100%" stopColor="#0D9E6E" stopOpacity="0.5" />
            </radialGradient>
            <radialGradient id="shieldGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0D9E6E" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0D9E6E" stopOpacity="0" />
            </radialGradient>
            <filter id="shieldFilter">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background pulse */}
          <motion.ellipse
            cx="190" cy="210" rx="100" ry="80"
            fill="url(#shieldGlow)"
            animate={{ rx: [90, 115, 90], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
          />

          {/* Converging particles */}
          {particles.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.sx} cy={p.sy} r="4"
              fill="#0D9E6E"
              fillOpacity="0.7"
              filter="url(#shieldFilter)"
              animate={{
                cx: [p.sx, 190, p.sx],
                cy: [p.sy, 200, p.sy],
                r: [4, 2, 4],
                fillOpacity: [0.7, 0.15, 0.7],
              }}
              transition={{
                delay: i * 0.12,
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut",
                times: [0, 0.5, 1],
              }}
            />
          ))}

          {/* Shield outline */}
          <motion.path
            d="M190 100 L280 130 L280 200 Q280 270 190 310 Q100 270 100 200 L100 130 Z"
            fill="url(#shieldGrad)"
            stroke="#0D9E6E"
            strokeWidth="2"
            strokeOpacity="0.7"
            filter="url(#shieldFilter)"
            animate={{
              strokeOpacity: [0.5, 1, 0.5],
              fillOpacity: [0.8, 1, 0.8],
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />

          {/* Checkmark inside shield */}
          <motion.path
            d="M162 205 L180 225 L218 185"
            fill="none"
            stroke="#0D9E6E"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
            transition={{
              delay: 0.6,
              repeat: Infinity,
              duration: 5,
              repeatDelay: 0.5,
              ease: "easeOut",
              times: [0, 0.3, 0.85, 1],
            }}
          />

          {/* Corner accent sparks */}
          {[
            { x: 100, y: 130 }, { x: 280, y: 130 },
            { x: 100, y: 200 }, { x: 280, y: 200 },
          ].map((pt, i) => (
            <motion.circle
              key={i}
              cx={pt.x} cy={pt.y} r="3"
              fill="#0D9E6E"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
              transition={{ delay: i * 0.2, repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
            />
          ))}
        </svg>

        {/* Status strip */}
        <motion.div
          className="absolute bottom-2 label-sm font-heading font-semibold tracking-[0.2em] text-[#059669] bg-white/60 border border-[#10b981]/30 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        >
          256-BIT ENCRYPTION ACTIVE
        </motion.div>
      </div>
    </div>
  );
}
