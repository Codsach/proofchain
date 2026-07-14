"use client";
 
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { Activity, Clock, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

interface Metrics {
  assignedThisWeek: number;
  completedThisWeek: number;
  verdictAccuracyRate: number;
  averageReviewTimeHours: number;
  highRiskAlerts: number;
}

interface AnalystMetricsProps {
  statusFilter: string;
  typeFilter: string;
  searchQuery: string;
}

export function AnalystMetrics({
  statusFilter,
  typeFilter,
  searchQuery,
}: AnalystMetricsProps) {
  const { getToken } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (typeFilter !== "all") params.set("incidentType", typeFilter);
        if (searchQuery) params.set("search", searchQuery);

        const res = await fetch(`/api/analyst/metrics?${params}`, {
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
  }, [statusFilter, typeFilter, searchQuery, getToken]);

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

  const hasNoCompletedVerdicts = !metrics || metrics.completedThisWeek === 0;

  const statCards = [
    {
      label: "Queue Status",
      value: metrics?.assignedThisWeek ?? 0,
      brand: "QUEUE",
      description: "Awaiting consensus review",
      subValue: "cases",
      variantKey: "cyan" as const,
      icon: Activity,
      metaText: "Active",
    },
    {
      label: "Avg Review Time",
      value: hasNoCompletedVerdicts ? "--" : metrics.averageReviewTimeHours,
      brand: "LATENCY",
      description: "Average case verdict latency",
      subValue: hasNoCompletedVerdicts ? "" : "hrs",
      variantKey: "purple" as const,
      icon: Clock,
      metaText: "Performance",
    },
    {
      label: "High-Risk Alerts",
      value: metrics?.highRiskAlerts ?? 0,
      brand: "ALERTS",
      description: "Flagged anomalous events",
      subValue: "critical",
      variantKey: "orange" as const,
      icon: AlertTriangle,
      metaText: "Urgent",
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-5"
    >
      {statCards.map((card) => {
        return (
          <motion.div
            key={card.label}
            variants={itemVariants}
            className="h-full w-full"
          >
            <StatCard
              label={card.label}
              value={card.value}
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
