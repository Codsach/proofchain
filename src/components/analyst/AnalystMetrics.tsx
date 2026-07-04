"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

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

  const statCards = [
    {
      label: "Queue Status",
      value: metrics?.assignedThisWeek ?? 0,
      brand: "QUEUE",
      description: "Awaiting analyst consensus review",
      subValue: "pending",
      variantKey: "cyan" as const,
      icon: Activity,
      metaText: "Active",
    },
    {
      label: "Accuracy Rate",
      value: metrics?.verdictAccuracyRate !== undefined ? `${metrics.verdictAccuracyRate}%` : "100%",
      brand: "RATING",
      description: "Consensus integrity stability rating",
      subValue: "stable",
      variantKey: "green" as const,
      icon: CheckCircle2,
      metaText: "Live",
    },
    {
      label: "Avg Review Time",
      value: metrics?.completedThisWeek === 0 ? "N/A" : `${metrics?.averageReviewTimeHours ?? 0} hrs`,
      brand: "LATENCY",
      description: "Average case verdict latency",
      subValue: "hrs / case",
      variantKey: "purple" as const,
      icon: Clock,
      metaText: "Updated just now",
    },
    {
      label: "High-Risk Alert",
      value: metrics?.highRiskAlerts ?? 0,
      brand: "ALERTS",
      description: "Anomalous events flagged manually",
      subValue: "critical",
      variantKey: "orange" as const,
      icon: AlertTriangle,
      metaText: "Awaiting Review",
    }
  ];

  // Filter out Accuracy Rate card if conditions are not met
  const activeStatCards = statCards.filter(card => {
    if (card.label === "Accuracy Rate") {
      return isLoading || (metrics && metrics.completedThisWeek > 1);
    }
    return true;
  });

  const gridColsClass =
    activeStatCards.length === 3
      ? "grid-cols-1 md:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`grid ${gridColsClass} gap-5`}
    >
      {activeStatCards.map((card, idx) => {
        return (
          <motion.div
            key={card.label}
            variants={itemVariants}
            className="h-full w-full"
          >
            <StatCard
              label={card.label}
              value={card.value ?? 0}
              subValue={card.subValue}
              description={card.description}
              brand={card.brand}
              variantKey={card.variantKey}
              icon={card.icon}
              metaText={card.metaText}
              isLoading={isLoading}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
