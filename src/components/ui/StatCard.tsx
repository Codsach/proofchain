"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCardProps {
  label: string; // Card title
  value: React.ReactNode; // Large metric value
  subValue?: string; // Optional metric state prefix/suffix
  description?: string; // Context description
  brandLabel?: string; // Alternate fallback context description
  brand?: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  variantKey?: 'blue' | 'purple' | 'green' | 'orange' | 'amber' | 'cyan' | 'red';
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
  metaText?: string; // Bottom-right live status / action metadata
}

const VARIANT_CONFIGS = {
  blue: {
    bgTint: "bg-blue-500/[0.015] group-hover:bg-blue-500/[0.03]",
    glowColor: "rgba(59, 130, 246, 0.10)",
    iconBg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    hoverBorder: "group-hover:border-blue-500/30",
    strokeColor: "#2563eb",
    textColor: "text-blue-500",
  },
  purple: {
    bgTint: "bg-purple-500/[0.015] group-hover:bg-purple-500/[0.03]",
    glowColor: "rgba(168, 85, 247, 0.10)",
    iconBg: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    hoverBorder: "group-hover:border-purple-500/30",
    strokeColor: "#9333ea",
    textColor: "text-purple-500",
  },
  green: {
    bgTint: "bg-emerald-500/[0.015] group-hover:bg-emerald-500/[0.03]",
    glowColor: "rgba(16, 185, 129, 0.10)",
    iconBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    hoverBorder: "group-hover:border-emerald-500/30",
    strokeColor: "#059669",
    textColor: "text-emerald-500",
  },
  orange: {
    bgTint: "bg-orange-500/[0.015] group-hover:bg-orange-500/[0.03]",
    glowColor: "rgba(249, 115, 22, 0.10)",
    iconBg: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    hoverBorder: "group-hover:border-orange-500/30",
    strokeColor: "#ea580c",
    textColor: "text-orange-500",
  },
  amber: {
    bgTint: "bg-amber-500/[0.015] group-hover:bg-amber-500/[0.03]",
    glowColor: "rgba(245, 158, 11, 0.10)",
    iconBg: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    hoverBorder: "group-hover:border-amber-500/30",
    strokeColor: "#d97706",
    textColor: "text-amber-600",
  },
  cyan: {
    bgTint: "bg-cyan-500/[0.015] group-hover:bg-cyan-500/[0.03]",
    glowColor: "rgba(6, 182, 212, 0.10)",
    iconBg: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    hoverBorder: "group-hover:border-cyan-500/30",
    strokeColor: "#0891b2",
    textColor: "text-cyan-500",
  },
  red: {
    bgTint: "bg-rose-500/[0.015] group-hover:bg-rose-500/[0.03]",
    glowColor: "rgba(244, 63, 94, 0.10)",
    iconBg: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    hoverBorder: "group-hover:border-rose-500/30",
    strokeColor: "#e11d48",
    textColor: "text-rose-500",
  },
};

export function StatCard({
  label,
  value,
  subValue,
  description,
  brandLabel,
  brand,
  icon: Icon,
  variantKey = "blue",
  isLoading = false,
  className,
  onClick,
  metaText,
}: StatCardProps) {
  const config = VARIANT_CONFIGS[variantKey] || VARIANT_CONFIGS.blue;
  const displayBrand = brand || brandLabel;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden w-full h-[200px] rounded-[24px] border border-dash-border bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)] transition-all duration-300 group flex flex-col justify-between p-6 select-none",
        config.hoverBorder,
        onClick ? "cursor-pointer" : "cursor-default",
        className
      )}
    >
      {/* Soft color tint overlay */}
      <div className={cn("absolute inset-0 transition-colors duration-300 pointer-events-none z-0", config.bgTint)} />

      {/* Subtle corner radial gradient glow */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 pointer-events-none z-0 opacity-40 blur-xl transition-opacity duration-300 group-hover:opacity-60"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* Background Oversized Icon for visual balance (5% - 7% opacity) */}
      <div className={cn(
        "absolute right-4 bottom-2 opacity-[0.05] group-hover:opacity-[0.07] transition-all duration-300 pointer-events-none z-0 scale-95 group-hover:scale-100",
        config.textColor
      )}>
        <Icon size={100} strokeWidth={1} />
      </div>

      {/* Main card content wrapper (z-10) */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        
        {/* Row 1: Icon container */}
        <div className="flex items-center justify-between w-full">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center border border-current/10 shadow-3xs transition-transform duration-300 group-hover:scale-105",
            config.iconBg
          )}>
            <Icon size={16} className="stroke-[2.2]" />
          </div>
        </div>

        {/* Row 2: Title + Metric + Description */}
        <div className="flex flex-col mt-4 gap-1 flex-grow">
          {/* Card Title: Medium weight, slate-600 */}
          <span className="text-xs font-medium text-slate-600/90 tracking-tight font-heading">
            {label}
          </span>
          {isLoading ? (
            <Skeleton className="h-10 w-24 bg-slate-200 mt-1" />
          ) : (
            <div className="flex items-baseline gap-1">
              {/* Number size increased to text-[42px] and heavier font-black weight */}
              <span className="text-[42px] font-black text-slate-900 leading-none tracking-tight">
                {value}
              </span>
              {subValue && (
                <span className="text-[10px] font-bold text-slate-400 ml-1 font-mono uppercase">
                  {subValue}
                </span>
              )}
            </div>
          )}
          {/* Description: Lower contrast slate-400, shortened to 3-6 words */}
          <span className="text-xs text-slate-400 font-normal line-clamp-1 mt-0.5">
            {description || displayBrand}
          </span>
        </div>

        {/* Row 3: Compact status chip with generous 12-16px spacing */}
        {metaText && (
          <div className="flex items-center justify-end mt-auto pt-3 pr-1">
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 flex items-center gap-1.5 uppercase tracking-wider bg-slate-50/50 border border-slate-100 px-2.5 py-1 rounded-md shadow-3xs">
              {metaText === "Synced" || metaText === "Live" || metaText === "Active" || metaText === "Verified" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              ) : null}
              {metaText}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
