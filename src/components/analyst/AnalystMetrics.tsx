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
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* 1. Queue Metrics */}
      <motion.div
        variants={itemVariants}
        className="group relative overflow-hidden rounded-2xl border border-dash-border bg-dash-card p-6 hover:border-emerald-500/30 transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Queue Status</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-dash-hover" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{metrics?.assignedThisWeek ?? 0}</span>
                <span className="text-xs text-white/50">pending</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
            <Activity className="h-5 w-5" />
          </div>
        </div>
        {!isLoading && (
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-white/40">Completed this week</span>
            <span className="font-bold text-emerald-400">+{metrics?.completedThisWeek ?? 0}</span>
          </div>
        )}
      </motion.div>

      {/* 2. Verdict Accuracy */}
      {(isLoading || (metrics && metrics.completedThisWeek > 1)) && (
      <motion.div
        variants={itemVariants}
        className="group relative overflow-hidden rounded-2xl border border-dash-border bg-dash-card p-6 hover:border-blue-500/30 transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Accuracy Rate</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-dash-hover" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{metrics?.verdictAccuracyRate ?? 100}</span>
                <span className="text-xl text-white/50">%</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        {!isLoading && (
          <div className="mt-4 pt-4 border-t border-white/5 text-xs">
            <span className="text-white/40">Alignment with AI consensus</span>
          </div>
        )}
      </motion.div>
      )}

      {/* 3. Average Review Time */}
      <motion.div
        variants={itemVariants}
        className="group relative overflow-hidden rounded-2xl border border-dash-border bg-dash-card p-6 hover:border-purple-500/30 transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Avg Review Time</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-dash-hover" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {metrics?.completedThisWeek === 0 ? "N/A" : (metrics?.averageReviewTimeHours ?? 0)}
                </span>
                {metrics?.completedThisWeek !== 0 && (
                  <span className="text-xs text-white/50">hrs / case</span>
                )}
              </div>
            )}
          </div>
          <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        {!isLoading && (
          <div className="mt-4 pt-4 border-t border-white/5 text-xs">
            <span className="text-white/40">Time from ingest to verdict</span>
          </div>
        )}
      </motion.div>

      {/* 4. High-Risk Cases Alert */}
      <motion.div
        variants={itemVariants}
        className="group relative overflow-hidden rounded-2xl border border-dash-border bg-dash-card p-6 hover:border-rose-500/30 transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400/70">High-Risk Alert</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-dash-hover" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-rose-400">{metrics?.highRiskAlerts ?? 0}</span>
                <span className="text-xs text-rose-400/50">critical</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-rose-500/10 p-2 text-rose-500 animate-pulse">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        {!isLoading && (
          <div className="mt-4 pt-4 border-t border-rose-500/10 text-xs">
            <span className="text-rose-400/60">Tamper score {'>'} 70 pending</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
