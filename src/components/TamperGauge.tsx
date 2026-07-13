"use client";

import { motion } from "framer-motion";

interface Props {
  score: number;
}

export function TamperGauge({ score }: Props) {
  // Determine risk level and colors
  const isLow = score <= 30;
  const isMed = score > 30 && score <= 60;
  
  const riskLabel = isLow ? "Low" : isMed ? "Medium" : "High";
  
  // Dynamic color for text
  const textColor = isLow
    ? "text-emerald-500"
    : isMed
    ? "text-amber-500"
    : "text-red-500";

  // Dynamic gradient reference
  const gradientId = isLow
    ? "lowRiskGrad"
    : isMed
    ? "medRiskGrad"
    : "highRiskGrad";

  // SVG parameters — compact size for sidebar column
  const size = 120;          // square canvas
  const radius = 40;         // arc radius
  const strokeWidth = 7;     // track thickness
  const center = size / 2;   // 60
  const circumference = 2 * Math.PI * radius; // ≈ 251.33

  // 240° arc
  const angleRange = 240;
  const arcLength = (angleRange / 360) * circumference; // ≈ 167.55
  const strokeDasharray = `${arcLength} ${circumference}`;

  const scorePercent = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = arcLength - (scorePercent / 100) * arcLength;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Square container — exactly matches viewBox ratio */}
      <div className="relative w-[120px] h-[120px]">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="lowRiskGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="medRiskGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="highRiskGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
            <filter id="tamperGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke="var(--dash-border)"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            transform={`rotate(150 ${center} ${center})`}
          />
          {/* Score arc */}
          <motion.circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            filter="url(#tamperGlow)"
            transform={`rotate(150 ${center} ${center})`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>

        {/* Center text — nudged up so it sits in the arc opening gap */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginTop: "-6px" }}>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-black font-heading text-dash-text tracking-tighter leading-none"
          >
            {score}
          </motion.span>
          <span className="text-[7px] text-dash-muted uppercase tracking-[0.1em] font-bold mt-0.5">
            / 100
          </span>
        </div>
      </div>
    </div>
  );
}
