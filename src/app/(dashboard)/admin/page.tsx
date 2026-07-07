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
import { StatCard, StatCardProps } from "@/components/ui/StatCard";
import type {
  VolumeDataPoint,
  AiQueuePoint,
  IncidentTypePoint,
  UserCounts,
  AuditLogEntry,
  AttentionRequiredAlert,
  OperationalSummary,
} from "@/components/admin/DashboardCharts";
import {
  Database,
  Cpu,
  Link2,
  RefreshCw,
  Users,
  FileText,
  Briefcase,
  Clock,
  ShieldAlert,
  CheckCircle2,
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

interface QuickLinkMetrics {
  totalUsers: number;
  logsToday: number;
  archivedCasesCount: number;
}

interface ChartData {
  volumeData: VolumeDataPoint[];
  aiQueueData: AiQueuePoint[];
  incidentTypeData: IncidentTypePoint[];
  userCounts: UserCounts;
  operationalSummary: OperationalSummary;
  quickLinkMetrics: QuickLinkMetrics;
  attentionRequiredAlerts: AttentionRequiredAlert[];
  lastRegisteredUser?: {
    fullName: string;
    role: string;
    createdAt: string;
  } | null;
}

// ─── Animation variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
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
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  ok ? "bg-emerald-500" : "bg-rose-500"
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
      className="flex items-center justify-between rounded-2xl border border-dash-border bg-dash-card px-4 py-2.5 gap-4 shadow-sm"
    >
      <div className="flex items-center gap-1.5">
        <span className="type-eyebrow hidden sm:block">
          System Status
        </span>
        {!isLoading && status && (
          <Badge
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0 h-5 border ${
              allOk
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
  metricText?: string;
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
  metricText,
}: QuickLinkProps) {
  return (
    <Link href={href} className="block cursor-pointer">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.35 }}
        whileHover={{ y: -4, scale: 1.01 }}
        className={`group relative rounded-2xl border border-dash-border bg-dash-card p-5 transition-all duration-300 shadow-sm hover:shadow-md ${hoverBorder}`}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className={`inline-flex p-2.5 rounded-xl ${accentColor} transition-colors shrink-0`}>
              <Icon size={18} className="text-dash-text" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold text-dash-text transition-colors ${hoverText}`}>
                {label}
              </p>
              {metricText ? (
                <p className="text-[10px] font-bold text-dash-accent tracking-wide mt-0.5">
                  {metricText}
                </p>
              ) : (
                <Skeleton className="h-3 w-20 bg-dash-border mt-1" />
              )}
              <p className="text-xs text-dash-muted leading-relaxed mt-2">{desc}</p>
            </div>
          </div>

          <div
            className={`w-full flex items-center justify-between h-10 px-4 bg-dash-border border border-dash-border hover:text-[#050505] text-dash-text transition-all rounded-xl ${btnHover}`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider">Access Module</span>
            <span className="text-lg opacity-50 group-hover:translate-x-1 transition-transform inline-block">
              →
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const DEFAULT_USER_COUNTS: UserCounts = {
  investigator: { total: 0, active: 0 },
  analyst: { total: 0, active: 0 },
  admin: { total: 0, active: 0 },
};

const EMPTY_VOLUME: VolumeDataPoint[] = [];
const EMPTY_QUEUE: AiQueuePoint[] = [];
const EMPTY_INCIDENT: IncidentTypePoint[] = [];

export default function AdminPage() {
  const { user, getToken } = useAuth();

  const [caseStats, setCaseStats] = useState<CaseStats | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
  const [timeframe, setTimeframe] = useState("30d");

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
          fetch(`/api/admin/stats/charts?timeframe=${timeframe}`, {
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
  }, [getToken, timeframe]);

  const isChartsLoading = isLoadingCharts;

  // KPI Dynamic Helper text logic (Enterprise UX Requirement #8)
  const totalCasesDesc = isLoadingStats
    ? "Checking database registry..."
    : caseStats?.total === 0
    ? "No cases indexed in database"
    : `${caseStats?.total} cases indexed in ledger`;

  const pendingReviewDesc = isLoadingStats
    ? "Awaiting pending review..."
    : caseStats?.pending === 0
    ? "No analyst backlog"
    : `${caseStats?.pending} cases awaiting review`;

  const highRiskDesc = isLoadingStats
    ? "Evaluating threat levels..."
    : caseStats?.highRisk === 0
    ? "No high-risk threats detected"
    : `${caseStats?.highRisk} critical security alerts`;

  const verifiedDesc = isLoadingStats
    ? "Validating ledger integrity..."
    : caseStats?.verified && caseStats.verified > 0 && caseStats.verified === caseStats.total
    ? "All cases verified"
    : `${caseStats?.verified} of ${caseStats?.total ?? 0} verified`;

  const statCards: StatCardProps[] = [
    {
      label: "Total Cases",
      value: caseStats?.total ?? 0,
      icon: Briefcase,
      description: totalCasesDesc,
      variantKey: "green",
      isLoading: isLoadingStats,
      metaText: "Synced",
    },
    {
      label: "Pending Review",
      value: caseStats?.pending ?? 0,
      icon: Clock,
      description: pendingReviewDesc,
      variantKey: caseStats?.pending === 0 ? "green" : "amber",
      isLoading: isLoadingStats,
      metaText: caseStats?.pending === 0 ? "Clear" : "Review Queue",
    },
    {
      label: "High Risk",
      value: caseStats?.highRisk ?? 0,
      icon: ShieldAlert,
      description: highRiskDesc,
      variantKey: caseStats?.highRisk === 0 ? "green" : "orange",
      isLoading: isLoadingStats,
      metaText: caseStats?.highRisk === 0 ? "Secure" : "Critical",
    },
    {
      label: "Verified",
      value: caseStats?.verified ?? 0,
      icon: CheckCircle2,
      description: verifiedDesc,
      variantKey: "cyan",
      isLoading: isLoadingStats,
      metaText: "Verified",
    },
  ];

  // Secondary dynamic metrics for Quick Actions (Enterprise UX Requirement #7)
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
      metricText: chartData?.quickLinkMetrics
        ? `${chartData.quickLinkMetrics.totalUsers} registered users`
        : undefined,
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
      metricText: chartData?.quickLinkMetrics
        ? `${chartData.quickLinkMetrics.logsToday} logs today`
        : undefined,
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
      metricText: chartData?.quickLinkMetrics
        ? `${chartData.quickLinkMetrics.archivedCasesCount} archived cases`
        : undefined,
    },
  ];

  return (
    <div className="w-full space-y-6 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="h-px w-8 bg-dash-accent/50" />
          <p className="type-eyebrow">
            System Overview
          </p>
        </div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="type-display-xl">Admin Dashboard</h1>
            <p className="text-dash-muted mt-1 font-medium text-sm">
              Welcome back,{" "}
              <span className="text-dash-text font-semibold">{user?.fullName ?? "Admin"}</span>.
              Here&apos;s your operational overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                asChild
                className="bg-dash-accent hover:bg-dash-accent/90 text-white font-semibold h-11 px-6 rounded-xl shadow-sm transition-all"
              >
                <Link href="/admin/cases/new">+ New Case</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 1. System Health Bar */}
      <SystemHealthBar
        status={systemStatus}
        isLoading={isLoadingSystem}
        onRefresh={() => loadSystemStatus(true)}
        isRefreshing={isRefreshingSystem}
      />

      {/* 2. KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-2 gap-5"
      >
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </motion.div>

      {/* 3. Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {quickLinks.map((link) => (
          <QuickLinkCard key={link.href} {...link} />
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 py-1">
        <div className="h-px flex-1 bg-dash-border" />
        <p className="type-eyebrow flex items-center gap-2">
          {isChartsLoading && <Loader2 size={10} className="animate-spin" />}
          Analytics
        </p>
        <div className="h-px flex-1 bg-dash-border" />
      </div>

      {/* 4 to 7: Charts, Queue, Incident Types, and Attention Required */}
      <DashboardCharts
        volumeData={chartData?.volumeData ?? EMPTY_VOLUME}
        aiQueueData={chartData?.aiQueueData ?? EMPTY_QUEUE}
        incidentTypeData={chartData?.incidentTypeData ?? EMPTY_INCIDENT}
        userCounts={chartData?.userCounts ?? DEFAULT_USER_COUNTS}
        recentActivity={recentActivity}
        isLoading={isChartsLoading}
        systemStatus={systemStatus}
        operationalSummary={chartData?.operationalSummary}
        attentionRequiredAlerts={chartData?.attentionRequiredAlerts ?? []}
        lastRegisteredUser={chartData?.lastRegisteredUser}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        onRefreshSystemStatus={() => loadSystemStatus(true)}
      />
    </div>
  );
}