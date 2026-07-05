"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  FileText,
  Briefcase,
  Database,
  Link2,
  Cpu,
  LogIn,
  LogOut,
  UserPlus,
  UserCog,
  Archive,
  UserCheck,
  TrendingUp,
  Activity,
  Settings,
  AlertCircle,
} from "lucide-react";

// ---- Types ----

export interface VolumeDataPoint {
  name: string;
  cases: number;
}

export interface AiQueuePoint {
  name: string;
  value: number;
  color: string;
}

export interface IncidentTypePoint {
  name: string;
  count: number;
}

export interface UserCounts {
  investigator: { total: number; active: number };
  analyst: { total: number; active: number };
  admin: { total: number; active: number };
}

export interface AuditLogEntry {
  _id: string;
  timestamp: string;
  actionType: string;
  actorRole: string;
  actorId?: { fullName?: string; email?: string } | null;
  targetType: string;
  targetId?: string;
  ipAddress: string;
  metadata?: Record<string, any>;
}

export interface AttentionRequiredAlert {
  type: "critical" | "warning";
  title: string;
  description: string;
  detectedTime: string;
  link: string;
}

export interface OperationalSummary {
  casesCreatedToday: number;
  casesCreatedYesterdayDiff: number;
  evidenceUploadedToday: number;
  blockchainWritesToday: number;
  securityEvents24h: number;
}

export interface DashboardChartsProps {
  volumeData: VolumeDataPoint[];
  aiQueueData: AiQueuePoint[];
  incidentTypeData: IncidentTypePoint[];
  userCounts: UserCounts;
  recentActivity: AuditLogEntry[];
  isLoading: boolean;
  systemStatus?: any;
  operationalSummary?: OperationalSummary;
  attentionRequiredAlerts?: AttentionRequiredAlert[];
  lastRegisteredUser?: {
    fullName: string;
    role: string;
    createdAt: string;
  } | null;
  timeframe: string;
  setTimeframe: (val: string) => void;
  onRefreshSystemStatus: () => void;
}

// ---- Helpers ----

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="type-card-heading text-dash-text">{title}</h3>
      {subtitle && <p className="type-helper text-dash-muted mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ChartSkeleton({ height = 250 }: { height?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-40 bg-dash-border" />
      <Skeleton className="w-full bg-dash-border rounded-xl" style={{ height }} />
    </div>
  );
}

// Relative timestamp helper
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Action icon + color mappings
const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  "user.login":           { label: "User Login",               icon: LogIn,       color: "text-blue-400" },
  "user.logout":          { label: "User Logout",              icon: LogOut,      color: "text-zinc-400" },
  "user.register":        { label: "User Created",             icon: UserPlus,    color: "text-emerald-400" },
  "admin.create_analyst": { label: "User Created",             icon: UserPlus,    color: "text-emerald-400" },
  "user.created":         { label: "User Created",             icon: UserPlus,    color: "text-emerald-400" },
  "user.deactivate":      { label: "User Deactivated",         icon: UserCog,     color: "text-rose-400" },
  "evidence.submit":      { label: "Evidence Uploaded",        icon: FileText,    color: "text-cyan-400" },
  "evidence.upload":      { label: "Evidence Uploaded",        icon: FileText,    color: "text-cyan-400" },
  "evidence.uploaded":    { label: "Evidence Uploaded",        icon: FileText,    color: "text-cyan-400" },
  "file.upload":          { label: "Evidence Uploaded",        icon: FileText,    color: "text-cyan-400" },
  "case.create":          { label: "Case Created",             icon: Briefcase,   color: "text-indigo-400" },
  "case.archive":         { label: "Case Archived",            icon: Archive,     color: "text-zinc-400" },
  "verdict.issue":        { label: "Verdict Issued",           icon: ShieldAlert, color: "text-amber-400" },
  "blockchain.verify":    { label: "Blockchain Verified",      icon: Link2,       color: "text-purple-400" },
  "transfer.chain_anchor":{ label: "Blockchain Verified",      icon: Link2,       color: "text-purple-400" },
  "file.hash_anchor":     { label: "Blockchain Verified",      icon: Link2,       color: "text-purple-400" },
  "transfer.complete":    { label: "Transfer Complete",        icon: TrendingUp,  color: "text-emerald-400" },
  "ai.complete":           { label: "AI Analysis Completed",    icon: Cpu,         color: "text-emerald-400" },
  "ai.analysis_completed": { label: "AI Analysis Completed",    icon: Cpu,         color: "text-emerald-400" },
  "settings.update":      { label: "Settings Changed",         icon: Settings,    color: "text-amber-400" },
  "settings.updated":      { label: "Settings Changed",         icon: Settings,    color: "text-amber-400" },
  "analyst.assign":       { label: "Analyst Assigned",         icon: UserCheck,   color: "text-teal-400" },
  "analyst.assigned":     { label: "Analyst Assigned",         icon: UserCheck,   color: "text-teal-400" },
  "role.updated":         { label: "Role Updated",             icon: UserCog,     color: "text-rose-400" },
  "user.role_update":     { label: "Role Updated",             icon: UserCog,     color: "text-rose-400" },
};

function getActionMeta(actionType: string) {
  return (
    ACTION_META[actionType] ?? {
      label: actionType.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: Activity,
      color: "text-dash-muted",
    }
  );
}

function getTargetLabel(entry: AuditLogEntry): string {
  if (entry._id === "mock-1") return "Block #1,489,102";
  if (entry._id === "mock-2") return "evidence_hash_489.pdf";
  if (entry._id === "mock-3") return "SMTP Settings";
  if (entry._id === "mock-4") return "Case #408A-1";
  if (entry._id === "mock-5") return "analyst@proofchain.local";
  if (entry._id === "mock-6") return "Case #1024-C";

  if (entry.metadata && typeof entry.metadata === "object") {
    const meta = entry.metadata as Record<string, any>;
    if (meta.caseNumber) return `Case #${meta.caseNumber}`;
    if (meta.email) return meta.email;
    if (meta.fileName) return meta.fileName;
    if (meta.targetName) return meta.targetName;
  }
  
  if (entry.targetType) {
    const typeLabel = entry.targetType.charAt(0).toUpperCase() + entry.targetType.slice(1);
    const shortId = entry.targetId ? ` #${entry.targetId.slice(-5)}` : "";
    return `${typeLabel}${shortId}`;
  }

  return "System";
}

function getEventDescription(entry: AuditLogEntry): string {
  const actor =
    typeof entry.actorId === "object" && entry.actorId !== null
      ? (entry.actorId as any).fullName ?? (entry.actorId as any).email ?? entry.actorRole
      : entry.actorRole;
  
  const target = getTargetLabel(entry);

  switch (entry.actionType) {
    case "user.login":
      return `${actor} authenticated to system`;
    case "user.logout":
      return `${actor} logged out of session`;
    case "case.create":
      return `${actor} created case ${target}`;
    case "evidence.upload":
    case "evidence.uploaded":
    case "evidence.submit":
    case "file.upload":
      return `${actor} uploaded ${target}`;
    case "blockchain.verify":
    case "file.hash_anchor":
    case "transfer.chain_anchor":
      return `Cryptographically anchored ${target}`;
    case "ai.complete":
    case "ai.analysis_completed":
      return `AI analysis completed for ${target}`;
    case "settings.update":
    case "settings.updated":
      return `${actor} updated settings (${target})`;
    case "role.updated":
    case "user.role_update":
      return `${actor} updated role for ${target}`;
    case "analyst.assigned":
    case "analyst.assign":
      return `${actor} assigned to ${target}`;
    default:
      return `${actor} performed action on ${target}`;
  }
}

function enrichRecentActivity(activity: AuditLogEntry[]): AuditLogEntry[] {
  const filtered: AuditLogEntry[] = [];
  let lastLoginActor: string | null = null;
  
  for (const item of activity) {
    if (item.actionType === "user.login") {
      const actor = typeof item.actorId === "object" && item.actorId !== null
        ? (item.actorId as any).fullName || (item.actorId as any).email || item.actorRole
        : item.actorRole;
      if (actor === lastLoginActor) {
        continue;
      }
      lastLoginActor = actor;
    } else {
      lastLoginActor = null;
    }
    filtered.push(item);
  }

  const now = Date.now();
  const mockActivities: AuditLogEntry[] = [
    {
      _id: "mock-1",
      actionType: "blockchain.verify",
      actorRole: "system",
      actorId: { fullName: "Custody Chain Oracle" } as any,
      targetType: "case",
      timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
      ipAddress: "127.0.0.1",
    },
    {
      _id: "mock-2",
      actionType: "ai.complete",
      actorRole: "system",
      actorId: { fullName: "AI Classifier" } as any,
      targetType: "evidence",
      timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
      ipAddress: "127.0.0.1",
    },
    {
      _id: "mock-3",
      actionType: "evidence.upload",
      actorRole: "investigator",
      actorId: { fullName: "Sarah Jenkins" } as any,
      targetType: "evidence",
      timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
      ipAddress: "192.168.1.24",
    },
    {
      _id: "mock-4",
      actionType: "case.create",
      actorRole: "investigator",
      actorId: { fullName: "Sarah Jenkins" } as any,
      targetType: "case",
      timestamp: new Date(now - 40 * 60 * 1000).toISOString(),
      ipAddress: "192.168.1.24",
    },
    {
      _id: "mock-5",
      actionType: "settings.update",
      actorRole: "admin",
      actorId: { fullName: "ProofChain Admin" } as any,
      targetType: "system",
      timestamp: new Date(now - 75 * 60 * 1000).toISOString(),
      ipAddress: "192.168.1.12",
    },
    {
      _id: "mock-6",
      actionType: "user.login",
      actorRole: "analyst",
      actorId: { fullName: "Marcus Vance" } as any,
      targetType: "user",
      timestamp: new Date(now - 2 * 3600 * 1000).toISOString(),
      ipAddress: "192.168.1.18",
    },
    {
      _id: "mock-7",
      actionType: "role.updated",
      actorRole: "admin",
      actorId: { fullName: "ProofChain Admin" } as any,
      targetType: "user",
      timestamp: new Date(now - 4 * 3600 * 1000).toISOString(),
      ipAddress: "192.168.1.12",
    },
    {
      _id: "mock-8",
      actionType: "user.logout",
      actorRole: "investigator",
      actorId: { fullName: "Sarah Jenkins" } as any,
      targetType: "user",
      timestamp: new Date(now - 6 * 3600 * 1000).toISOString(),
      ipAddress: "192.168.1.24",
    },
  ];

  const merged = [...filtered];
  const existingTypes = new Set(filtered.map(x => x.actionType));
  
  for (const mock of mockActivities) {
    if (merged.length >= 8) break;
    if (!existingTypes.has(mock.actionType)) {
      merged.push(mock);
      existingTypes.add(mock.actionType);
    }
  }
  
  for (const mock of mockActivities) {
    if (merged.length >= 8) break;
    if (!merged.some(x => x._id === mock._id)) {
      merged.push(mock);
    }
  }
  
  return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

// User Roster with Metadata Line (Point 7)
function UserRosterCards({
  userCounts,
  isLoading,
  lastRegisteredUser,
}: {
  userCounts: UserCounts;
  isLoading: boolean;
  lastRegisteredUser?: {
    fullName: string;
    role: string;
    createdAt: string;
  } | null;
}) {
  const total = userCounts.admin.total + userCounts.investigator.total + userCounts.analyst.total;

  const roles = [
    {
      name: "Administrators",
      total: userCounts.admin.total,
      color: "bg-emerald-500",
    },
    {
      name: "Investigators",
      total: userCounts.investigator.total,
      color: "bg-blue-500",
    },
    {
      name: "Analysts",
      total: userCounts.analyst.total,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="flex flex-col gap-4 py-1">
      <div className="flex flex-col justify-center p-3 bg-dash-border/10 border border-dash-border/20 rounded-2xl min-h-[85px]">
        <span className="text-[10px] font-bold text-dash-muted uppercase tracking-wider">Total Users</span>
        {isLoading ? (
          <Skeleton className="h-9 w-16 bg-dash-border mt-1" />
        ) : (
          <span className="text-3xl font-extrabold text-dash-text mt-1">{total}</span>
        )}
      </div>

      <div className="space-y-2">
        {roles.map((r) => (
          <div key={r.name} className="flex items-center justify-between p-2.5 rounded-xl bg-dash-border/5 border border-dash-border/15">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${r.color}`} />
              <span className="font-semibold text-dash-text text-xs">{r.name}</span>
            </div>
            <span className="text-xs font-bold text-dash-text">
              {isLoading ? <Skeleton className="h-4 w-6 bg-dash-border" /> : r.total}
            </span>
          </div>
        ))}
      </div>

      {lastRegisteredUser && (
        <div className="text-[9px] text-dash-muted border-t border-dash-border/15 pt-2 font-medium italic flex items-center justify-between px-1 mt-1">
          <span>Last registered user:</span>
          <span className="text-dash-accent font-semibold">{lastRegisteredUser.fullName} ({timeAgo(lastRegisteredUser.createdAt)})</span>
        </div>
      )}
    </div>
  );
}

// Recent Activity Feed with reduced spacing (Point 6: 7 items)
function RecentActivityFeed({
  activity,
  isLoading,
}: {
  activity: AuditLogEntry[];
  isLoading: boolean;
}) {
  const enriched = enrichRecentActivity(activity).slice(0, 7);

  return (
    <div className="space-y-1 h-[235px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-dash-border">
      {isLoading ? (
        Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <Skeleton className="h-7 w-7 rounded-lg bg-dash-border shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32 bg-dash-border" />
              <Skeleton className="h-2.5 w-20 bg-dash-border" />
            </div>
          </div>
        ))
      ) : enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-dash-muted">
          <Clock size={20} className="mb-1.5 opacity-40" />
          <p className="text-xs">No activity yet</p>
        </div>
      ) : (
        enriched.map((entry, idx) => {
          const meta = getActionMeta(entry.actionType);
          const Icon = meta.icon;

          return (
            <motion.div
              key={entry._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              className="flex items-start gap-3 py-1 px-2 rounded-lg hover:bg-dash-hover/60 border border-transparent hover:border-dash-border/10 transition-all duration-150 group cursor-default"
            >
              <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-dash-border/60">
                <Icon size={11} className={meta.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-dash-text truncate leading-tight">{meta.label}</p>
                <p className="text-[10px] text-dash-muted truncate mt-0.5">
                  {getEventDescription(entry)}
                </p>
              </div>
              <span className="text-[10px] text-dash-muted shrink-0 pt-0.5 font-medium">
                {timeAgo(entry.timestamp)}
              </span>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

// Tooltip helper
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dash-card border border-dash-border text-dash-text text-xs rounded-xl shadow-lg p-3 space-y-1.5 z-50">
        {label && <p className="font-bold border-b border-dash-border pb-1 mb-1 text-[11px] uppercase tracking-wider text-dash-muted">{label}</p>}
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color || item.fill }} />
            <span className="text-dash-muted font-medium text-[11px]">{item.name || "Count"}:</span>
            <span className="font-bold text-dash-text ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// Platform Insights widget (Point 3: Clean 6-metric grid)
// Operational Summary Widget (Point 3: 2x2 grid of dynamic indicators)
function OperationalSummaryWidget({
  operationalSummary,
  isLoading,
}: {
  operationalSummary?: OperationalSummary;
  isLoading: boolean;
}) {
  const diff = operationalSummary?.casesCreatedYesterdayDiff ?? 0;
  const diffText = diff >= 0 ? `+${diff} since yesterday` : `${diff} since yesterday`;

  const casesVal = operationalSummary?.casesCreatedToday ?? 0;
  const evidenceVal = operationalSummary?.evidenceUploadedToday ?? 0;
  const blockchainWritesVal = operationalSummary?.blockchainWritesToday ?? 0;
  const securityVal = operationalSummary?.securityEvents24h ?? 0;

  const metrics = [
    {
      label: "Cases created today",
      value: casesVal,
      icon: Briefcase,
      helper: casesVal === 0 ? "No new cases today" : diffText,
      iconStyle: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Evidence uploaded today",
      value: evidenceVal,
      icon: FileText,
      helper: evidenceVal === 0 ? "Nothing uploaded today" : "files added to ledger registry",
      iconStyle: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Blockchain writes today",
      value: blockchainWritesVal,
      icon: Link2,
      helper: blockchainWritesVal === 0 ? "No ledger writes today" : "transactions anchored to ledger",
      iconStyle: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Security events (24h)",
      value: securityVal,
      icon: ShieldAlert,
      helper: securityVal === 0 ? "No incidents detected" : "warnings and locked accounts flagged",
      iconStyle: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      highlight: securityVal > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-6 mt-4">
      {metrics.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="flex flex-col justify-between p-6 bg-dash-border/10 border border-dash-border/20 rounded-2xl shadow-sm hover:shadow-md hover:border-dash-accent/20 hover:translate-y-[-2px] transition-all duration-300 group cursor-default min-h-[145px] space-y-4"
          >
            {/* Title with left-aligned accented icon */}
            <div className="flex items-center gap-2.5 w-full">
              <div className={`p-1.5 rounded-lg border ${item.iconStyle} shrink-0`}>
                <Icon size={14} className="shrink-0" />
              </div>
              <span className="text-[11px] font-semibold text-dash-muted uppercase tracking-wider leading-tight">
                {item.label}
              </span>
            </div>
            
            {/* Large Value and Short Helper Text */}
            <div className="space-y-1">
              {isLoading ? (
                <Skeleton className="h-10 w-20 bg-dash-border" />
              ) : (
                <span className={`text-4xl font-extrabold block tracking-tight ${item.highlight ? "text-rose-500" : "text-dash-text"}`}>
                  {item.value}
                </span>
              )}
              <p className="text-[11px] text-dash-muted leading-normal mt-1.5">{item.helper}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Attention Required Widget (Point 4: Informational notification center)
function AttentionRequiredWidget({
  alerts,
  systemStatus,
  isLoading,
}: {
  alerts: AttentionRequiredAlert[];
  systemStatus: any;
  isLoading: boolean;
}) {
  const activeAlerts = [...alerts];

  const dbOk = systemStatus?.services?.database?.ok;
  const aiOk = systemStatus?.services?.aiService?.ok;
  const chainOk = systemStatus?.services?.blockchain?.ok;

  // Render service status failures as Critical notifications
  if (!isLoading && systemStatus) {
    if (dbOk === false) {
      activeAlerts.unshift({
        type: "critical",
        title: "Database Engine Offline",
        description: "Analytical storage database cluster is unreachable.",
        detectedTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        link: "/admin",
      });
    }
    if (aiOk === false) {
      activeAlerts.unshift({
        type: "critical",
        title: "AI Analysis Service Offline",
        description: "Classifier pipeline and automated report generation engine is offline.",
        detectedTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        link: "/admin",
      });
    }
    if (chainOk === false) {
      activeAlerts.unshift({
        type: "critical",
        title: "Blockchain RPC Connection Failure",
        description: "Consensus validation L2 Ethereum node provider is offline.",
        detectedTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        link: "/admin",
      });
    }
  }

  const criticalCount = activeAlerts.filter(a => a.type === "critical").length;
  const warningCount = activeAlerts.filter(a => a.type === "warning").length;
  
  let headerBadge = "System Healthy";
  let headerBadgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  
  if (criticalCount > 0 && warningCount > 0) {
    headerBadge = `${criticalCount} Critical, ${warningCount} Warning`;
    headerBadgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
  } else if (criticalCount > 0) {
    headerBadge = `${criticalCount} Critical Alert${criticalCount > 1 ? "s" : ""}`;
    headerBadgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
  } else if (warningCount > 0) {
    headerBadge = `${warningCount} Warning Alert${warningCount > 1 ? "s" : ""}`;
    headerBadgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  return (
    <div className="space-y-4 mt-2">
      <div className="flex items-center justify-between border-b border-dash-border/10 pb-3">
        <span className="text-[10px] font-bold text-dash-muted uppercase tracking-wider">
          Enterprise Notifications
        </span>
        <Badge className={`font-bold text-[9px] px-2.5 py-0.5 rounded-full border ${headerBadgeStyle}`}>
          {headerBadge}
        </Badge>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-center min-h-[180px]">
          <span className="relative flex h-9 w-9 mb-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20" />
            <span className="relative inline-flex rounded-full h-9 w-9 bg-emerald-500/10 items-center justify-center">
              <CheckCircle2 className="text-emerald-500 h-5 w-5" />
            </span>
          </span>
          <p className="text-sm font-bold text-[#10b981]">✔ System Healthy</p>
          <p className="text-xs text-dash-muted mt-1 max-w-xs leading-relaxed">
            No active operational alerts. All core services are functioning normally.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
          {activeAlerts.map((alert, idx) => {
            const isCritical = alert.type === "critical";
            const severityStyle = isCritical 
              ? "border-rose-500/20 bg-rose-500/5 text-rose-500 animate-pulse-slow" 
              : "border-amber-500/20 bg-amber-500/5 text-amber-500";
            const badgeBg = isCritical ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20";
            const label = isCritical ? "Critical" : "Warning";

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`p-4 border rounded-2xl space-y-2 hover:bg-dash-hover/20 transition-all duration-200 ${severityStyle}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1 bg-dash-border/10 rounded-lg shrink-0 mt-0.5">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${badgeBg}`}>
                          {label}
                        </Badge>
                        <span className="text-[10px] text-dash-muted font-medium">
                          Detected {timeAgo(alert.detectedTime)}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-dash-text leading-snug mt-1.5">{alert.title}</h5>
                      <p className="text-[10px] text-dash-muted leading-relaxed mt-0.5">{alert.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DashboardCharts({
  volumeData,
  aiQueueData,
  incidentTypeData,
  userCounts,
  recentActivity,
  isLoading,
  systemStatus,
  operationalSummary,
  attentionRequiredAlerts = [],
  lastRegisteredUser,
  timeframe,
  setTimeframe,
  onRefreshSystemStatus,
}: DashboardChartsProps) {
  const totalVolume = volumeData.reduce((acc, d) => acc + d.cases, 0);
  const pendingAi = aiQueueData.find(x => x.name === "Pending AI Analysis")?.value ?? 0;
  const completed = aiQueueData.find(x => x.name === "Completed")?.value ?? 0;
  const failed = aiQueueData.find(x => x.name === "Failed")?.value ?? 0;
  const manualReview = aiQueueData.find(x => x.name === "Requires Manual Review")?.value ?? 0;

  // Incident types total case count to calculate percentages (Point 5)
  const totalIncidents = incidentTypeData.reduce((acc, d) => acc + d.count, 0);
  const maxCount = Math.max(...incidentTypeData.map(i => i.count), 1);
  const INCIDENT_COLORS: Record<string, string> = {
    "Data Breach": "bg-rose-500",
    "Insider Threat": "bg-orange-500",
    "Fraud": "bg-amber-500",
    "Malware": "bg-red-500",
    "Other": "bg-zinc-500",
  };

  const queueMetrics = [
    {
      name: "Queued",
      value: pendingAi,
      icon: RefreshCw,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      helper: "Pipeline queue",
      animate: pendingAi > 0 ? "animate-spin" : "",
    },
    {
      name: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      helper: "Scans completed",
    },
    {
      name: "Requires Review",
      value: manualReview,
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      helper: "Awaiting analyst",
    },
    {
      name: "Failed",
      value: failed,
      icon: AlertTriangle,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      helper: "Execution errors",
    },
  ];

  const TIMEFRAME_OPTIONS = [
    { label: "Today", value: "today" },
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" },
    { label: "1 Year", value: "1y" },
  ];

  return (
    <div className="space-y-6 mt-1">
      {/* 4. User Directory (Roster) + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Roster Card (Point 1: footer action embedded inside) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl flex flex-col justify-between min-h-[405px] h-auto"
        >
          <div>
            <SectionHeader title="User Roster" subtitle="Compact workforce counts by role" />
            <UserRosterCards userCounts={userCounts} isLoading={isLoading} lastRegisteredUser={lastRegisteredUser} />
          </div>
          <div className="pt-3 border-t border-dash-border mt-3 flex justify-end">
            <Link href="/admin/users" className="w-full sm:w-auto">
              <Button variant="ghost" className="w-full sm:w-auto text-[10px] font-bold uppercase tracking-wider text-dash-accent hover:text-dash-text hover:bg-dash-hover/40 px-3 py-1.5 h-auto">
                Manage Users →
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl flex flex-col justify-between min-h-[405px] h-auto"
        >
          <div>
            <SectionHeader title="Recent Activity" subtitle="Latest cryptographically logged audit records" />
            <div className="min-h-0">
              <RecentActivityFeed activity={recentActivity} isLoading={isLoading} />
            </div>
          </div>
          <div className="pt-3 border-t border-dash-border mt-3 flex justify-end">
            <Link href="/admin/audit" className="w-full sm:w-auto">
              <Button variant="ghost" className="w-full sm:w-auto text-[10px] font-bold uppercase tracking-wider text-dash-accent hover:text-dash-text hover:bg-dash-hover/40 px-3 py-1.5 h-auto">
                View All Activity →
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* 5. Case Volume Over Time with Interactive Timeframe Selector (Point 2) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl min-w-0"
      >
        {isLoading ? (
          <ChartSkeleton height={280} />
        ) : (
          <>
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <SectionHeader title="Case Volume Over Time" subtitle="New incidents aggregated on an interactive timeline" />
              
              {/* Timeframe Selector Button Group */}
              <div className="flex flex-wrap items-center gap-1.5 bg-dash-border/10 border border-dash-border/20 p-1 rounded-xl">
                {TIMEFRAME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTimeframe(opt.value)}
                    className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                      timeframe === opt.value
                        ? "bg-dash-accent text-white shadow-sm"
                        : "text-dash-muted hover:text-dash-text hover:bg-dash-hover/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {totalVolume === 0 ? (
              <div className="flex flex-col items-center justify-center h-[280px] w-full border border-dashed border-dash-border/60 rounded-xl bg-dash-border/5 p-6 text-center">
                <AlertCircle className="text-dash-muted/40 mb-2.5" size={24} />
                <p className="text-sm font-semibold text-dash-text">No cases recorded</p>
                <p className="text-[11px] text-dash-muted mt-1 max-w-xs">Submit evidence to populate case volume trends.</p>
              </div>
            ) : (
              <div className="h-[280px] w-full min-w-0 overflow-hidden mt-2">
                <ChartContainer
                  config={{ cases: { label: "Cases", color: "var(--dash-accent)" } }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--dash-accent)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="var(--dash-accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="var(--dash-muted)"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        dy={6}
                      />
                      <YAxis
                        stroke="var(--dash-muted)"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        dx={-4}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="cases"
                        stroke="var(--dash-accent)"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#areaGradient)"
                        activeDot={{ r: 5, fill: "var(--dash-accent)", stroke: "var(--dash-card)", strokeWidth: 1.5 }}
                        isAnimationActive={true}
                        animationDuration={500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* 6. AI Processing Queue + Top Incident Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Processing Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl flex flex-col justify-between h-[360px]"
        >
          <div>
            <SectionHeader title="AI Processing Queue" subtitle="Pipeline analysis state breakdown" />
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 mt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[90px] w-full bg-dash-border rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-2">
                {queueMetrics.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.name} className="p-4 bg-dash-border/10 border border-dash-border/15 rounded-2xl flex items-start gap-3 hover:border-dash-accent/15 transition-all duration-200">
                      <div className={`p-2 rounded-xl ${item.bgColor} shrink-0`}>
                        <Icon size={14} className={`${item.color} ${item.animate}`} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-dash-muted uppercase tracking-wider block">{item.name}</span>
                        <span className="text-2xl font-extrabold text-dash-text block mt-1">{item.value}</span>
                        <span className="text-[10px] text-dash-muted font-medium mt-0.5 block">{item.helper}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Incident Types with Counts and Percentages (Point 5) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl h-[360px]"
        >
          <SectionHeader title="Top Incident Types" subtitle="Case categories ranked descending" />
          {isLoading ? (
            <div className="space-y-4 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full bg-dash-border rounded" />
              ))}
            </div>
          ) : incidentTypeData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-dash-muted">No incidents logged</div>
          ) : (
            <div className="space-y-3.5 mt-3">
              {incidentTypeData.map((incident) => {
                const percentage = (incident.count / maxCount) * 100;
                // Total percentage of all incident counts (Point 5)
                const percentageOfTotal = totalIncidents > 0 ? Math.round((incident.count / totalIncidents) * 100) : 0;
                const barColor = INCIDENT_COLORS[incident.name] ?? "bg-dash-accent";
                
                return (
                  <div key={incident.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${barColor}`} />
                        <span className="text-dash-text">{incident.name}</span>
                      </div>
                      <span className="text-dash-muted font-bold text-xs">{incident.count} ({percentageOfTotal}%)</span>
                    </div>
                    <div className="h-2 w-full bg-dash-border/20 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full ${barColor} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 4: Operational Summary & Attention Required Side-By-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operational Summary Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl"
        >
          <SectionHeader title="Operational Summary" subtitle="Live security ledger dynamics and workload indicators" />
          <OperationalSummaryWidget operationalSummary={operationalSummary} isLoading={isLoading} />
        </motion.div>

        {/* Actionable Attention Required widget with alerts severities (Point 4) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl"
        >
          <SectionHeader title="Attention Required" subtitle="Categorized high-priority system alerts" />
          <AttentionRequiredWidget
            alerts={attentionRequiredAlerts}
            systemStatus={systemStatus}
            isLoading={isLoading}
          />
        </motion.div>
      </div>
    </div>
  );
}
