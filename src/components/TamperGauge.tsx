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

  // SVG parameters
  const size = 160;
  const radius = 55;
  const strokeWidth = 8;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius; // ~345.57
  
  // 240-degree arc parameters
  const angleRange = 240;
  const arcLength = (angleRange / 360) * circumference; // ~230.38
  const strokeDasharray = `${arcLength} ${circumference}`;
  
  // Compute dash offset for score
  const scorePercent = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = arcLength - (scorePercent / 100) * arcLength;

  return (
    <div className="flex flex-col items-center justify-center p-2 relative select-none">
      <div className="relative w-40 h-36">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} 140`}
          className="overflow-visible"
        >
          <defs>
            {/* Gradients */}
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

            {/* Glow Filters */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--dash-border)"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            transform={`rotate(150 ${center} ${center})`}
          />

          {/* Animated Active Stroke */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            filter="url(#glow)"
            transform={`rotate(150 ${center} ${center})`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>

        {/* Center Text Panel */}
        <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
          {/* Score Number */}
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl font-black font-heading text-dash-text tracking-tighter"
          >
            {score}
          </motion.span>
          
          {/* Scale Label */}
          <span className="text-[9px] text-dash-muted uppercase tracking-[0.15em] font-bold mt-0.5">
            integrity score
          </span>
          
          {/* Risk Level Badge */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className={`mt-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-widest bg-black/40 backdrop-blur-md ${
              isLow
                ? "text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                : isMed
                ? "text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                : "text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
            }`}
          >
            {riskLabel} Risk
          </motion.div>
        </div>
      </div>
    </div>
  );
}
