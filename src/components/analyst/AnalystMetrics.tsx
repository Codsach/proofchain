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

const STAT_VARIANTS = {
  blue: {
    circleColors: [
      "bg-cyan-500",
      "bg-blue-600",
      "bg-indigo-600",
      "bg-purple-600",
      "bg-teal-400",
      "bg-sky-500"
    ],
    badgeColor: "bg-blue-500/15 text-blue-900 border border-blue-500/30",
    iconBg: "bg-blue-606/15 text-blue-800 border border-blue-500/25",
    trendText: "+5.4%",
    trendUp: true,
  },
  purple: {
    circleColors: [
      "bg-pink-500",
      "bg-purple-600",
      "bg-fuchsia-500",
      "bg-violet-600",
      "bg-indigo-600",
      "bg-blue-500"
    ],
    badgeColor: "bg-purple-500/15 text-purple-900 border border-purple-500/30",
    iconBg: "bg-purple-606/15 text-purple-800 border border-purple-500/25",
    trendText: "+8.2%",
    trendUp: true,
  },
  green: {
    circleColors: [
      "bg-emerald-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-green-600",
      "bg-lime-400",
      "bg-yellow-400"
    ],
    badgeColor: "bg-emerald-500/15 text-emerald-900 border border-emerald-500/30",
    iconBg: "bg-emerald-606/15 text-emerald-800 border border-emerald-500/25",
    trendText: "+14.1%",
    trendUp: true,
  },
  orange: {
    circleColors: [
      "bg-orange-500",
      "bg-rose-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-amber-500",
      "bg-pink-500"
    ],
    badgeColor: "bg-orange-500/15 text-orange-900 border border-orange-500/30",
    iconBg: "bg-orange-606/15 text-orange-800 border border-orange-500/25",
    trendText: "+12.4%",
    trendUp: true,
  },
  amber: {
    circleColors: [
      "bg-yellow-400",
      "bg-amber-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-rose-500",
      "bg-amber-600"
    ],
    badgeColor: "bg-amber-500/15 text-amber-900 border border-amber-500/30",
    iconBg: "bg-amber-606/15 text-amber-900 border border-amber-500/25",
    trendText: "-3.5%",
    trendUp: false,
  },
  cyan: {
    circleColors: [
      "bg-cyan-400",
      "bg-teal-500",
      "bg-sky-400",
      "bg-blue-600",
      "bg-emerald-400",
      "bg-cyan-600"
    ],
    badgeColor: "bg-cyan-500/15 text-cyan-900 border border-cyan-500/30",
    iconBg: "bg-cyan-606/15 text-cyan-800 border border-cyan-500/25",
    trendText: "+22.7%",
    trendUp: true,
  }
} as const;

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

  const statCards = [
    {
      label: "Queue Status",
      value: metrics?.assignedThisWeek,
      brand: "QUEUE",
      desc: "Pending review submissions",
      subValue: "pending",
      variantKey: "cyan" as const,
      icon: Activity,
      sparkline: (
        <svg className="w-16 h-8 text-cyan-800 dark:text-cyan-300 animate-pulse" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <motion.path
            d="M0,22 Q25,8 50,18 T100,8"
            variants={sparklineVariants}
            initial="hidden"
            animate="visible"
          />
        </svg>
      )
    },
    {
      label: "Accuracy Rate",
      value: metrics?.verdictAccuracyRate !== undefined ? `${metrics.verdictAccuracyRate}%` : "100%",
      brand: "RATING",
      desc: "Consensus stability rating",
      subValue: "stable",
      variantKey: "green" as const,
      icon: CheckCircle2,
      sparkline: (
        <svg className="w-16 h-8 text-emerald-800 dark:text-emerald-300" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <motion.path
            d="M0,12 Q20,5 40,15 T80,8 T100,5"
            variants={sparklineVariants}
            initial="hidden"
            animate="visible"
          />
        </svg>
      )
    },
    {
      label: "Avg Review Time",
      value: metrics?.completedThisWeek === 0 ? "N/A" : `${metrics?.averageReviewTimeHours ?? 0} hrs`,
      brand: "LATENCY",
      desc: "Average review latency",
      subValue: "hrs / case",
      variantKey: "purple" as const,
      icon: Clock,
      sparkline: (
        <svg className="w-16 h-8 text-purple-800 dark:text-purple-300" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <motion.path
            d="M0,5 C20,12 40,5 60,22 C80,18 90,28 100,25"
            variants={sparklineVariants}
            initial="hidden"
            animate="visible"
          />
        </svg>
      )
    },
    {
      label: "High-Risk Alert",
      value: metrics?.highRiskAlerts,
      brand: "ALERTS",
      desc: "Critical anomaly warnings",
      subValue: "critical",
      variantKey: "orange" as const,
      icon: AlertTriangle,
      sparkline: (
        <svg className="w-16 h-8 text-orange-800 dark:text-orange-300" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <motion.path
            d="M0,25 C15,25 30,5 45,3 T60,22 T100,25"
            variants={sparklineVariants}
            initial="hidden"
            animate="visible"
          />
        </svg>
      )
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
        const variant = STAT_VARIANTS[card.variantKey];
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.01 }}
            className="h-full flex justify-center"
          >
            <div className="relative overflow-hidden w-full h-[180px] rounded-[20px] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] select-none group">
              {/* Layer 1: Solid Card Base (z-0) */}
              <div className="absolute inset-0 bg-white/25 rounded-[20px] z-0 pointer-events-none" />

              {/* Layer 2: Blurred liquid background circles (z-10) */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none select-none rounded-[20px] z-10">
                <div 
                  className="absolute -inset-16 flex flex-wrap opacity-85 transition-opacity duration-300 transform-gpu will-change-[filter]"
                  style={{ filter: "blur(130px)" }}
                >
                  {/* Circle 1 - Top Left */}
                  <div className={`absolute top-[5%] left-[5%] w-[170px] h-[170px] rounded-full ${variant.circleColors[0]}`} />
                  {/* Circle 2 - Top Right */}
                  <div className={`absolute top-[2%] right-[10%] w-[150px] h-[150px] rounded-full ${variant.circleColors[1]}`} />
                  {/* Circle 3 - Center */}
                  <div className={`absolute top-[25%] left-[25%] w-[160px] h-[160px] rounded-full ${variant.circleColors[2]}`} />
                  {/* Circle 4 - Bottom Right */}
                  <div className={`absolute bottom-[5%] right-[5%] w-[180px] h-[180px] rounded-full ${variant.circleColors[3]}`} />
                  {/* Circle 5 - Bottom Left */}
                  <div className={`absolute bottom-[2%] left-[10%] w-[140px] h-[140px] rounded-full ${variant.circleColors[4]}`} />
                  {/* Circle 6 - Mid Right */}
                  <div className={`absolute top-[15%] right-[2%] w-[130px] h-[130px] rounded-full ${variant.circleColors[5]}`} />
                </div>
                {/* Subtle frosted backdrop filter cover */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
                {/* Stripes pattern overlay for premium tech look */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] mix-blend-overlay" />
              </div>
              
              {/* Layer 3: Card Content (z-20) */}
              <div className="relative z-20 flex flex-col justify-between h-full w-full p-5">
                {/* Card Content Header */}
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-[10px] ${variant.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Card Content Value */}
                <div className="flex flex-col mt-2">
                  <span className="text-[9px] text-slate-900 font-extrabold uppercase tracking-[0.2em] border-b border-white/10 pb-0.5 w-fit">
                    {card.brand}
                  </span>
                  {isLoading ? (
                    <Skeleton className="h-9 w-16 bg-white/30 mt-1" />
                  ) : (
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-3xl font-extrabold text-slate-955 tracking-tight font-sans">
                        {card.value}
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 lowercase">
                        {card.subValue}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content Footer */}
                <div className="flex items-end justify-between mt-auto">
                  <span className="text-[10px] text-slate-800 font-bold uppercase tracking-wider">
                    {card.label}
                  </span>
                  <div className="opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                    {card.sparkline}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
