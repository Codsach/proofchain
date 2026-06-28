"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface Metrics {
  assignedThisWeek: number;
  completedThisWeek: number;
  verdictAccuracyRate: number;
  averageReviewTimeHours: number;
  highRiskAlerts: number;
}

export function AnalystMetrics() {
  const { getToken } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/analyst/metrics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch metrics");
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        setError("Failed to load metrics dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [getToken]);

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-6 py-4 text-xs font-bold uppercase tracking-widest text-rose-400">
        {error}
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const sparklineVariants = {
    hidden: { pathLength: 0 },
    visible: {
      pathLength: 1,
      transition: { duration: 1.5, ease: "easeInOut" as const },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* 1. Queue Metrics (Active Cases / Pending Reviews) */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.04) 0%, var(--dash-card) 100%)" }}
        className="group relative overflow-hidden rounded-xl border border-teal-500/20 p-5 shadow-sm transition-all duration-300 hover:border-teal-500/50"
      >
        {/* Top-aligned Brand Label */}
        <div className="flex items-center justify-between mb-4 border-b border-dash-border/40 pb-2">
          <span className="text-[9px] font-bold tracking-[0.2em] text-teal-600 dark:text-teal-400">PROOFCHAIN</span>
          <span className="text-[8px] font-mono text-dash-muted/50">NODE_01</span>
        </div>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-dash-muted">Queue Status</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-dash-hover" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-dash-text">{metrics?.assignedThisWeek ?? 0}</span>
                <span className="text-xs text-dash-muted">pending</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-teal-500/10 p-2 text-teal-600">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* Sparkline & Completed count */}
        <div className="mt-4 pt-3 border-t border-dash-border/40 flex items-center justify-between gap-4">
          <div className="flex-1 h-8 flex items-center">
            <svg className="w-full h-6 text-teal-500/40" viewBox="0 0 100 30" fill="none" preserveAspectRatio="none">
              <motion.path
                d="M0,22 Q25,8 50,18 T100,8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                variants={sparklineVariants}
                initial="hidden"
                animate="visible"
              />
            </svg>
          </div>
          {!isLoading && (
            <div className="text-right whitespace-nowrap min-w-[60px]">
              <p className="text-[8px] font-bold text-dash-muted uppercase tracking-wider">Completed</p>
              <p className="text-xs font-bold text-teal-600">+{metrics?.completedThisWeek ?? 0}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. Verdict Accuracy */}
      {(isLoading || (metrics && metrics.completedThisWeek > 1)) && (
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.04) 0%, var(--dash-card) 100%)" }}
          className="group relative overflow-hidden rounded-xl border border-emerald-500/20 p-5 shadow-sm transition-all duration-300 hover:border-emerald-500/50"
        >
          {/* Top-aligned Brand Label */}
          <div className="flex items-center justify-between mb-4 border-b border-dash-border/40 pb-2">
            <span className="text-[9px] font-bold tracking-[0.2em] text-emerald-600 dark:text-emerald-400">AI VERDICT</span>
            <span className="text-[8px] font-mono text-dash-muted/50">ALIGN_CORE</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-dash-muted">Accuracy Rate</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24 bg-dash-hover" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-dash-text">{metrics?.verdictAccuracyRate ?? 100}</span>
                  <span className="text-xl text-dash-muted">%</span>
                </div>
              )}
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          {/* Sparkline & Detail */}
          <div className="mt-4 pt-3 border-t border-dash-border/40 flex items-center justify-between gap-4">
            <div className="flex-1 h-8 flex items-center">
              <svg className="w-full h-6 text-emerald-500/40" viewBox="0 0 100 30" fill="none" preserveAspectRatio="none">
                <motion.path
                  d="M0,12 Q20,5 40,15 T80,8 T100,5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  variants={sparklineVariants}
                  initial="hidden"
                  animate="visible"
                />
              </svg>
            </div>
            {!isLoading && (
              <div className="text-right whitespace-nowrap min-w-[80px]">
                <p className="text-[8px] font-bold text-dash-muted uppercase tracking-wider">Consensus</p>
                <p className="text-[10px] font-medium text-dash-muted">Stable</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 3. Average Review Time */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.04) 0%, var(--dash-card) 100%)" }}
        className="group relative overflow-hidden rounded-xl border border-indigo-500/20 p-5 shadow-sm transition-all duration-300 hover:border-indigo-500/50"
      >
        {/* Top-aligned Brand Label */}
        <div className="flex items-center justify-between mb-4 border-b border-dash-border/40 pb-2">
          <span className="text-[9px] font-bold tracking-[0.2em] text-indigo-600 dark:text-indigo-400">CHRONOS NODE</span>
          <span className="text-[8px] font-mono text-dash-muted/50">LATENCY_LOG</span>
        </div>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-dash-muted">Avg Review Time</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-dash-hover" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-dash-text">
                  {metrics?.completedThisWeek === 0 ? "N/A" : (metrics?.averageReviewTimeHours ?? 0)}
                </span>
                {metrics?.completedThisWeek !== 0 && (
                  <span className="text-xs text-dash-muted">hrs / case</span>
                )}
              </div>
            )}
          </div>
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Sparkline & Detail */}
        <div className="mt-4 pt-3 border-t border-dash-border/40 flex items-center justify-between gap-4">
          <div className="flex-1 h-8 flex items-center">
            <svg className="w-full h-6 text-indigo-500/40" viewBox="0 0 100 30" fill="none" preserveAspectRatio="none">
              <motion.path
                d="M0,5 C20,12 40,5 60,22 C80,18 90,28 100,25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                variants={sparklineVariants}
                initial="hidden"
                animate="visible"
              />
            </svg>
          </div>
          {!isLoading && (
            <div className="text-right whitespace-nowrap min-w-[80px]">
              <p className="text-[8px] font-bold text-dash-muted uppercase tracking-wider">Velocity</p>
              <p className="text-[10px] font-medium text-emerald-600">Optimal</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* 4. High-Risk Cases Alert */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.04) 0%, var(--dash-card) 100%)" }}
        className="group relative overflow-hidden rounded-xl border border-rose-500/20 p-5 shadow-sm transition-all duration-300 hover:border-rose-500/50"
      >
        {/* Top-aligned Brand Label */}
        <div className="flex items-center justify-between mb-4 border-b border-dash-border/40 pb-2">
          <span className="text-[9px] font-bold tracking-[0.2em] text-rose-600 dark:text-rose-400">TAMPER SCAN</span>
          <span className="text-[8px] font-mono text-dash-muted/50">ANOMALY_DET</span>
        </div>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">High-Risk Alert</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-dash-hover" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-rose-600 dark:text-rose-400">{metrics?.highRiskAlerts ?? 0}</span>
                <span className="text-xs text-rose-500/80 dark:text-rose-400/50">critical</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600 animate-pulse">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* Sparkline & Detail */}
        <div className="mt-4 pt-3 border-t border-dash-border/40 flex items-center justify-between gap-4">
          <div className="flex-1 h-8 flex items-center">
            <svg className="w-full h-6 text-rose-500/40" viewBox="0 0 100 30" fill="none" preserveAspectRatio="none">
              <motion.path
                d="M0,25 C15,25 30,5 45,3 T60,22 T100,25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                variants={sparklineVariants}
                initial="hidden"
                animate="visible"
              />
            </svg>
          </div>
          {!isLoading && (
            <div className="text-right whitespace-nowrap min-w-[60px]">
              <p className="text-[8px] font-bold text-dash-muted uppercase tracking-wider">Severity</p>
              <p className="text-xs font-bold text-rose-600">Elevated</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
