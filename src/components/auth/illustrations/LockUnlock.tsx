"use client";

import { motion } from "framer-motion";

/* LockUnlock — Forgot Password illustration
   A padlock SVG whose shackle lifts and a keyhole glows. */

export function LockUnlock() {
  return (
    <div className="flex flex-col items-center gap-8 w-full select-none">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center space-y-1.5"
      >
        <h2 className="headline-sm font-heading font-bold text-[#1e293b] tracking-wider uppercase">
          Identity Verification
        </h2>
        <p className="body-sm text-[#64748b] font-sans">
          Recover your secure access
        </p>
      </motion.div>

      <div className="relative flex items-center justify-center w-[360px] h-[380px] max-w-full">
        <svg
          viewBox="0 0 360 380"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="lockGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0D9E6E" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0D9E6E" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="keyholeGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#0D9E6E" />
            </radialGradient>
            <filter id="lockFilter">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background glow halo */}
          <motion.ellipse
            cx="180" cy="230" rx="90" ry="70"
            fill="url(#lockGlow)"
            animate={{ rx: [80, 100, 80], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />

          {/* Lock body */}
          <rect x="110" y="185" width="140" height="110" rx="16" fill="#e8f5f0" stroke="#0D9E6E" strokeWidth="2.5" />
          <rect x="116" y="191" width="128" height="98" rx="12" fill="#f5fbf8" opacity="0.7" />

          {/* Shackle — animates up on loop */}
          <motion.path
            d="M148 185 L148 148 Q148 118 180 118 Q212 118 212 148 L212 185"
            fill="none"
            stroke="#0D9E6E"
            strokeWidth="14"
            strokeLinecap="round"
            filter="url(#lockFilter)"
            animate={{ translateY: [0, -18, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", times: [0, 0.4, 1] }}
          />

          {/* Keyhole circle */}
          <motion.circle
            cx="180" cy="232" r="16"
            fill="url(#keyholeGrad)"
            animate={{ r: [14, 18, 14], opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          {/* Keyhole slot */}
          <motion.rect
            x="176" y="240" width="8" height="18" rx="4"
            fill="#0D9E6E"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />

          {/* Tick marks around the lock */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const x1 = 180 + 108 * Math.cos(angle);
            const y1 = 240 + 108 * Math.sin(angle);
            const x2 = 180 + 116 * Math.cos(angle);
            const y2 = 240 + 116 * Math.sin(angle);
            return (
              <motion.line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#0D9E6E"
                strokeWidth="1.5"
                strokeOpacity="0.35"
                animate={{ strokeOpacity: [0.2, 0.6, 0.2] }}
                transition={{ delay: i * 0.15, repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
            );
          })}

          {/* Security dots orbiting */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const cx = 180 + 140 * Math.cos(angle);
            const cy = 240 + 70 * Math.sin(angle);
            return (
              <motion.circle
                key={i}
                cx={cx} cy={cy} r="3"
                fill="#0D9E6E"
                animate={{ opacity: [0.2, 0.8, 0.2], r: [2, 3.5, 2] }}
                transition={{ delay: i * 0.25, repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              />
            );
          })}
        </svg>

        {/* Status pill */}
        <motion.div
          className="absolute bottom-4 label-sm font-heading font-semibold tracking-[0.2em] text-[#059669] bg-white/60 border border-[#10b981]/30 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          SECURE RECOVERY PROTOCOL
        </motion.div>
      </div>
    </div>
  );
}
