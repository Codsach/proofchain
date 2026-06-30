"use client";

import { motion } from "framer-motion";

/* ChainRings — Register illustration
   Concentric blockchain chain-link rings expanding outward. */

const rings = [
  { r: 30, delay: 0, duration: 3.2, strokeOpacity: 0.7 },
  { r: 65, delay: 0.3, duration: 3.8, strokeOpacity: 0.55 },
  { r: 100, delay: 0.6, duration: 4.4, strokeOpacity: 0.40 },
  { r: 138, delay: 0.9, duration: 5.0, strokeOpacity: 0.28 },
  { r: 175, delay: 1.2, duration: 5.6, strokeOpacity: 0.16 },
];

const linkCount = 8;

export function ChainRings() {
  return (
    <div className="flex flex-col items-center gap-8 w-full select-none">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center space-y-1.5"
      >
        <h2 className="headline-sm font-heading font-bold text-[#1e293b] tracking-wider uppercase">
          Join the Chain
        </h2>
        <p className="body-sm text-[#64748b] font-sans">
          Create your forensic account
        </p>
      </motion.div>

      <div className="relative w-[420px] h-[420px] max-w-full flex items-center justify-center">
        <svg
          viewBox="0 0 420 420"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="chainCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#d1fae5" />
              <stop offset="100%" stopColor="#0D9E6E" />
            </radialGradient>
            <filter id="chainGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Concentric pulsing rings */}
          {rings.map((ring, i) => (
            <motion.circle
              key={i}
              cx="210" cy="210"
              r={ring.r}
              fill="none"
              stroke="#0D9E6E"
              strokeWidth="1.5"
              strokeDasharray="6 8"
              strokeOpacity={ring.strokeOpacity}
              animate={{
                strokeOpacity: [ring.strokeOpacity, ring.strokeOpacity * 2, ring.strokeOpacity],
                strokeDashoffset: [0, -56],
              }}
              transition={{
                strokeOpacity: { delay: ring.delay, repeat: Infinity, duration: ring.duration, ease: "easeInOut" },
                strokeDashoffset: { delay: ring.delay, repeat: Infinity, duration: ring.duration * 1.5, ease: "linear" },
              }}
            />
          ))}

          {/* Orbit link nodes on the 2nd ring */}
          {Array.from({ length: linkCount }).map((_, i) => {
            const angle = (i / linkCount) * Math.PI * 2 - Math.PI / 2;
            const cx = 210 + 65 * Math.cos(angle);
            const cy = 210 + 65 * Math.sin(angle);
            return (
              <motion.rect
                key={i}
                x={cx - 5} y={cy - 3}
                width="10" height="6"
                rx="3"
                fill="#0D9E6E"
                fillOpacity="0.7"
                filter="url(#chainGlow)"
                animate={{
                  fillOpacity: [0.4, 0.9, 0.4],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{
                  delay: i * 0.15,
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />
            );
          })}

          {/* Central core */}
          <motion.circle
            cx="210" cy="210" r="22"
            fill="url(#chainCore)"
            filter="url(#chainGlow)"
            animate={{ r: [19, 24, 19] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          {/* Link icon in center */}
          <text
            x="210" y="215"
            textAnchor="middle"
            fontSize="16"
            fill="#0D9E6E"
            fontWeight="bold"
          >⛓</text>
        </svg>

        {/* Block labels */}
        {[
          { label: "BLOCK #1024", delay: 0.8, x: "5%", y: "20%" },
          { label: "BLOCK #1025", delay: 1.3, x: "68%", y: "12%" },
          { label: "BLOCK #1026", delay: 1.8, x: "72%", y: "74%" },
          { label: "BLOCK #1027", delay: 2.3, x: "2%", y: "70%" },
        ].map((pill, i) => (
          <motion.div
            key={i}
            className="absolute label-sm font-heading font-semibold tracking-[0.15em] text-[#059669] bg-white/60 border border-[#10b981]/30 backdrop-blur-sm px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm"
            style={{ left: pill.x, top: pill.y }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
            transition={{
              delay: pill.delay,
              duration: 4.5,
              repeat: Infinity,
              repeatDelay: 1.5,
              ease: "easeInOut",
              times: [0, 0.15, 0.85, 1],
            }}
          >
            {pill.label}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
