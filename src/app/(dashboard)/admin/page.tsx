"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import type {
  VolumeDataPoint,
  RiskDataPoint,
  StatusDataPoint,
  TamperDataPoint,
  UserCounts,
  AuditLogEntry,
} from "@/components/admin/DashboardCharts";
import {
  Database,
  Cpu,
  Link2,
  RefreshCw,
  Users,
  FileText,
  Briefcase,
  TrendingUp,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CaseStats {
  total: number;
  pending: number;
  highRisk: number;
  verified: number;
}

interface ServiceStatus {
  ok: boolean;
  latencyMs: number;
}

interface SystemStatus {
  timestamp: string;
  services: {
    database: ServiceStatus;
    aiService: ServiceStatus;
    blockchain: ServiceStatus;
  };
}

interface ChartData {
  volumeData: VolumeDataPoint[];
  riskData: RiskDataPoint[];
  statusData: StatusDataPoint[];
  tamperData: TamperDataPoint[];
  userCounts: UserCounts;
}

// ─── Animation variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ─── System Health Bar ───────────────────────────────────────────────────────

function ServiceDot({
  label,
  icon: Icon,
  status,
  isLoading,
}: {
  label: string;
  icon: React.ElementType;
  status?: ServiceStatus;
  isLoading: boolean;
}) {
  const ok = status?.ok ?? false;
  const latency = status?.latencyMs ?? 0;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-default">
            <Icon size={13} className="text-dash-muted shrink-0" />
            {isLoading ? (
              <Skeleton className="h-2 w-2 rounded-full bg-dash-border" />
            ) : (
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-500"
                  }`}
              >
                {ok && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                )}
              </span>
            )}
            <span className="text-xs text-dash-muted font-medium hidden sm:block">{label}</span>
            {!isLoading && latency > 0 && (
              <span className="text-[10px] text-dash-muted/60 hidden md:block">
                {latency}ms
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-dash-card border-dash-border text-dash-text text-xs"
        >
          {isLoading
            ? "Checking…"
            : ok
              ? `${label} operational · ${latency}ms`
              : `${label} unreachable`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SystemHealthBar({
  status,
  isLoading,
  onRefresh,
  isRefreshing,
}: {
  status: SystemStatus | null;
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const services = [
    { label: "Database", icon: Database, key: "database" as const },
    { label: "AI Service", icon: Cpu, key: "aiService" as const },
    { label: "Blockchain", icon: Link2, key: "blockchain" as const },
  ];

  const allOk =
    status?.services &&
    Object.values(status.services).every((s) => s.ok);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between rounded-xl border border-dash-border bg-dash-card/60 backdrop-blur-sm px-4 py-2.5 gap-4"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-dash-muted uppercase tracking-[0.2em] hidden sm:block">
          System Status
        </span>
        {!isLoading && status && (
          <Badge
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0 h-5 border ${allOk
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
          >
            {allOk ? "Nominal" : "Degraded"}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4 sm:gap-6 flex-1 justify-center">
        {services.map(({ label, icon, key }) => (
          <ServiceDot
            key={key}
            label={label}
            icon={icon}
            status={status?.services[key]}
            isLoading={isLoading}
          />
        ))}
      </div>

      <button
        onClick={onRefresh}
        disabled={isRefreshing || isLoading}
        className="flex items-center gap-1.5 text-[10px] font-bold text-dash-muted hover:text-dash-text uppercase tracking-wider transition-colors disabled:opacity-40"
      >
        <RefreshCw
          size={12}
          className={isRefreshing ? "animate-spin" : ""}
        />
        <span className="hidden sm:block">Refresh</span>
      </button>
    </motion.div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 1;
  const pathD = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 52 + 4;
      const y = 26 - ((p - minVal) / range) * 22;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg className="w-16 h-8 opacity-80" viewBox="0 0 60 30">
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
    </svg>
  );
}

interface StatCardProps {
  label: string;
  value?: number;
  icon: React.ElementType;
  brandLabel: string;
  sparklinePoints: number[];
  variantKey: 'blue' | 'purple' | 'green' | 'orange' | 'amber' | 'cyan';
  isLoading: boolean;
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
  },
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  brandLabel,
  sparklinePoints,
  variantKey,
  isLoading,
}: StatCardProps) {
  const variant = STAT_VARIANTS[variantKey];
  const strokeColor = variantKey === "blue" ? "#1d4ed8" :
    variantKey === "purple" ? "#7e22ce" :
      variantKey === "green" ? "#047857" :
        variantKey === "orange" ? "#c2410c" :
          variantKey === "amber" ? "#b45309" : "#0e7490";

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative overflow-hidden w-full h-[180px] rounded-[20px] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] select-none group"
    >
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
        {/* Top Bar: Icon */}
        <div className="flex items-center justify-between">
          <div className={`w-9 h-9 rounded-[10px] ${variant.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
            <Icon size={18} />
          </div>
        </div>

        {/* Middle row: Brand & Metric */}
        <div className="flex flex-col mt-2">
          <span className="text-[10px] text-slate-900 font-extrabold uppercase tracking-[0.15em]">
            {brandLabel}
          </span>
          {isLoading ? (
            <Skeleton className="h-9 w-16 bg-white/30 mt-1" />
          ) : (
            <p className="text-3xl font-extrabold text-slate-955 tracking-tight mt-0.5 font-sans">
              {value ?? 0}
            </p>
          )}
        </div>

        {/* Bottom Row: Label & Sparkline */}
        <div className="flex items-end justify-between mt-auto">
          <p className="text-[10px] text-slate-800 font-bold uppercase tracking-wider">
            {label}
          </p>
          {!isLoading && (
            <div className="opacity-90 group-hover:opacity-100 transition-opacity duration-300">
              <Sparkline points={sparklinePoints} color={strokeColor} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Quick Link Card ─────────────────────────────────────────────────────────

interface QuickLinkProps {
  label: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  accentColor: string;
  hoverBorder: string;
  hoverText: string;
  btnHover: string;
  delay: number;
}

function QuickLinkCard({
  label,
  desc,
  href,
  icon: Icon,
  accentColor,
  hoverBorder,
  hoverText,
  btnHover,
  delay,
}: QuickLinkProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -3 }}
      className={`group relative rounded-2xl border border-dash-border bg-dash-card p-1 transition-all duration-300 shadow-xl ${hoverBorder}`}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`inline-flex p-2.5 rounded-xl ${accentColor} transition-colors`}>
            <Icon size={18} className="text-dash-text" />
          </div>
          <div>
            <p className={`text-sm font-bold text-dash-text transition-colors ${hoverText}`}>
              {label}
            </p>
            <p className="text-xs text-dash-muted leading-relaxed mt-0.5">{desc}</p>
          </div>
        </div>

        <Button
          asChild
          variant="ghost"
          className={`w-full justify-between h-10 px-4 bg-dash-border border border-dash-border hover:text-[#050505] text-dash-text transition-all rounded-xl ${btnHover}`}
        >
          <Link href={href}>
            <span className="text-[10px] font-bold uppercase tracking-wider">Access Module</span>
            <span className="text-lg opacity-50 group-hover:translate-x-1 transition-transform inline-block">
              →
            </span>
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const DEFAULT_USER_COUNTS: UserCounts = {
  investigator: { total: 0, active: 0 },
  analyst: { total: 0, active: 0 },
  admin: { total: 0, active: 0 },
};

const EMPTY_VOLUME: VolumeDataPoint[] = [];
const EMPTY_RISK: RiskDataPoint[] = [];
const EMPTY_STATUS: StatusDataPoint[] = [];
const EMPTY_TAMPER: TamperDataPoint[] = [];

const DashboardBackground = () => {
  return (
    <div className="absolute inset-0 h-full w-full bg-transparent">
      {/* Top Left: Blue */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_20%_30%,#bfdbfe_0%,transparent_40%)]" />
      {/* Top Right: Indigo */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_80%_20%,#c7d2fe_0%,transparent_40%)]" />
      {/* Bottom Center: Blue */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_50%_80%,#bfdbfe_0%,transparent_40%)]" />
      {/* Bottom Right: Indigo */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_90%_90%,#c7d2fe_0%,transparent_40%)]" />
    </div>
  );
};

export default function AdminPage() {
  const { user, getToken } = useAuth();

  const [caseStats, setCaseStats] = useState<CaseStats | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingSystem, setIsLoadingSystem] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [isRefreshingSystem, setIsRefreshingSystem] = useState(false);

  // ── Fetch case stats ──
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/admin/cases/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setCaseStats(await res.json());
      } catch {
        /* non-critical */
      } finally {
        setIsLoadingStats(false);
      }
    };
    load();
  }, [getToken]);

  // ── Fetch system status ──
  const loadSystemStatus = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshingSystem(true);
      else setIsLoadingSystem(true);
      try {
        const token = await getToken();
        const res = await fetch("/api/admin/system-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setSystemStatus(await res.json());
      } catch {
        /* non-critical */
      } finally {
        setIsLoadingSystem(false);
        setIsRefreshingSystem(false);
      }
    },
    [getToken]
  );

  useEffect(() => {
    loadSystemStatus();
  }, [loadSystemStatus]);

  // ── Fetch chart data + recent activity ──
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const [chartsRes, activityRes] = await Promise.all([
          fetch("/api/admin/stats/charts", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/admin/audit-log?limit=8", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (chartsRes.ok) setChartData(await chartsRes.json());
        if (activityRes.ok) {
          const data = await activityRes.json();
          setRecentActivity(data.logs ?? []);
        }
      } catch {
        /* non-critical */
      } finally {
        setIsLoadingCharts(false);
      }
    };
    load();
  }, [getToken]);

  const isChartsLoading = isLoadingCharts;

  const statCards: StatCardProps[] = [
    {
      label: "Total Cases",
      value: caseStats?.total,
      icon: Briefcase,
      brandLabel: "REGISTRY",
      sparklinePoints: [8, 14, 10, 18, 15, 24],
      variantKey: "green",
      isLoading: isLoadingStats,
    },
    {
      label: "Pending Review",
      value: caseStats?.pending,
      icon: Clock,
      brandLabel: "AI SCANNER",
      sparklinePoints: [15, 8, 12, 5, 10, 7],
      variantKey: "amber",
      isLoading: isLoadingStats,
    },
    {
      label: "High Risk",
      value: caseStats?.highRisk,
      icon: ShieldAlert,
      brandLabel: "THREAT DETECT",
      sparklinePoints: [2, 6, 3, 8, 4, 5],
      variantKey: "orange",
      isLoading: isLoadingStats,
    },
    {
      label: "Verified",
      value: caseStats?.verified,
      icon: CheckCircle2,
      brandLabel: "LEDGER SEAL",
      sparklinePoints: [6, 12, 9, 15, 12, 19],
      variantKey: "cyan",
      isLoading: isLoadingStats,
    },
  ];

  const quickLinks: QuickLinkProps[] = [
    {
      label: "Identity & Access",
      desc: "Manage analysts, investigators and admin accounts",
      href: "/admin/users",
      icon: Users,
      accentColor: "bg-blue-500/15 group-hover:bg-blue-500/25",
      hoverBorder: "hover:border-blue-500/30",
      hoverText: "group-hover:text-blue-400",
      btnHover: "hover:bg-blue-500 hover:border-blue-500 hover:text-black group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]",
      delay: 0.4,
    },
    {
      label: "Operational Audit",
      desc: "Cryptographically signed log of all system events",
      href: "/admin/audit",
      icon: FileText,
      accentColor: "bg-amber-500/15 group-hover:bg-amber-500/25",
      hoverBorder: "hover:border-amber-500/30",
      hoverText: "group-hover:text-amber-400",
      btnHover: "hover:bg-amber-500 hover:border-amber-500 hover:text-black group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]",
      delay: 0.5,
    },
    {
      label: "Global Repository",
      desc: "Full access to all evidence cases and metadata",
      href: "/admin/cases",
      icon: Briefcase,
      accentColor: "bg-emerald-500/15 group-hover:bg-emerald-500/25",
      hoverBorder: "hover:border-emerald-500/30",
      hoverText: "group-hover:text-emerald-400",
      btnHover: "hover:bg-emerald-500 hover:border-emerald-500 hover:text-black group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      delay: 0.6,
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-8rem)] -m-4 sm:-m-6 lg:-m-8 overflow-hidden flex justify-center w-full">
      {/* Background mesh gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <DashboardBackground />
      </div>

      <div className="relative z-10 w-full p-4 sm:p-6 lg:p-8">
        <div className="space-y-8 pb-10">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-dash-accent/50" />
              <p className="text-[10px] font-bold text-dash-accent uppercase tracking-[0.3em]">
                System Overview
              </p>
            </div>
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h1 className="font-heading font-bold tracking-wider text-dash-text uppercase headline-lg">Admin Dashboard</h1>
                <p className="text-dash-muted mt-1.5 font-medium text-sm">
                  Welcome back,{" "}
                  <span className="text-dash-text font-semibold">{user?.fullName ?? "Admin"}</span>.
                  Here&apos;s your operational overview.
                </p>
              </div>
              <AnimatePresence>
                {!isLoadingStats && caseStats && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest px-3 h-7">
                      <span className="relative flex h-2 w-2 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Live
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* System Health Bar */}
          <SystemHealthBar
            status={systemStatus}
            isLoading={isLoadingSystem}
            onRefresh={() => loadSystemStatus(true)}
            isRefreshing={isRefreshingSystem}
          />

          {/* Stat Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-2 gap-6"
          >
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </motion.div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {quickLinks.map((link) => (
              <QuickLinkCard key={link.href} {...link} />
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-dash-border" />
            <p className="text-[10px] font-bold text-dash-muted uppercase tracking-[0.3em] flex items-center gap-2">
              {isChartsLoading && <Loader2 size={10} className="animate-spin" />}
              Analytics
            </p>
            <div className="h-px flex-1 bg-dash-border" />
          </div>

          {/* Charts Section */}
          <DashboardCharts
            volumeData={chartData?.volumeData ?? EMPTY_VOLUME}
            riskData={chartData?.riskData ?? EMPTY_RISK}
            statusData={chartData?.statusData ?? EMPTY_STATUS}
            tamperData={chartData?.tamperData ?? EMPTY_TAMPER}
            userCounts={chartData?.userCounts ?? DEFAULT_USER_COUNTS}
            recentActivity={recentActivity}
            isLoading={isChartsLoading}
          />
        </div>
      </div>
    </div>
  );
}