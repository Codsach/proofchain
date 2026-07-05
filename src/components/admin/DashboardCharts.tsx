"use client";

import React from "react";
import { motion } from "framer-motion";

// Simple relative-time helper (no external dep required)
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

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ShieldAlert,
  CheckCircle2,
  Clock,
  User,
  Users,
  UserCog,
  TrendingUp,
  AlertCircle,
} from "lucide-react";


// ---- Types ----

export interface VolumeDataPoint {
  name: string;
  cases: number;
}

export interface RiskDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface StatusDataPoint {
  date: string;
  pending: number;
  verified: number;
  rejected: number;
}

export interface TamperDataPoint {
  range: string;
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
  ipAddress: string;
}

export interface DashboardChartsProps {
  volumeData: VolumeDataPoint[];
  riskData: RiskDataPoint[];
  statusData: StatusDataPoint[];
  tamperData: TamperDataPoint[];
  userCounts: UserCounts;
  recentActivity: AuditLogEntry[];
  isLoading: boolean;
}

// ---- Helpers ----



function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h3 className="type-card-heading text-dash-text">{title}</h3>
      {subtitle && <p className="type-helper text-dash-muted mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ChartSkeleton({ height = 250 }: { height?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-40 bg-dash-border" />
      <Skeleton className={`w-full bg-dash-border rounded-xl`} style={{ height }} />
    </div>
  );
}

// ---- Action type → icon + colour mapping ----

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  "case.create":          { label: "Case Created",       icon: Activity,    color: "text-emerald-400" },
  "case.archive":         { label: "Case Archived",      icon: AlertCircle, color: "text-zinc-400" },
  "evidence.submit":      { label: "Evidence Submitted", icon: CheckCircle2,color: "text-emerald-400" },
  "verdict.issue":        { label: "Verdict Issued",     icon: ShieldAlert, color: "text-amber-400" },
  "user.login":           { label: "User Login",         icon: User,        color: "text-blue-400" },
  "user.deactivate":      { label: "User Deactivated",   icon: UserCog,     color: "text-rose-400" },
  "admin.create_analyst": { label: "Analyst Created",    icon: Users,       color: "text-purple-400" },
  "file.upload":          { label: "File Uploaded",      icon: Activity,    color: "text-cyan-400" },
  "ai.complete":          { label: "AI Analysis Done",   icon: CheckCircle2,color: "text-emerald-400" },
  "transfer.complete":    { label: "Transfer Complete",  icon: TrendingUp,  color: "text-emerald-400" },
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

// ---- Sub-components ----

function UserRosterCards({
  userCounts,
  isLoading,
}: {
  userCounts: UserCounts;
  isLoading: boolean;
}) {
  const roster = [
    {
      role: "Investigators",
      icon: User,
      counts: userCounts.investigator,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      glow: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    },
    {
      role: "Analysts",
      icon: Users,
      counts: userCounts.analyst,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      glow: "group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    },
    {
      role: "Admins",
      icon: UserCog,
      counts: userCounts.admin,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      glow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {roster.map(({ role, icon: Icon, counts, color, bg, border, glow }) => (
        <div
          key={role}
          className={`group relative rounded-xl border ${border} bg-dash-card p-4 space-y-2 transition-all duration-300 ${glow}`}
        >
          <div className={`inline-flex p-2 rounded-lg ${bg}`}>
            <Icon size={16} className={color} />
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-12 bg-dash-border" />
          ) : (
            <p className={`text-2xl font-bold ${color}`}>{counts.total}</p>
          )}
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">{role}</p>
          {!isLoading && counts.total > 0 && (
            <p className="text-[10px] text-dash-muted">
              {counts.active} active
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function RecentActivityFeed({
  activity,
  isLoading,
}: {
  activity: AuditLogEntry[];
  isLoading: boolean;
}) {
  return (
    <div className="space-y-1 h-full overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-dash-border">
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="h-7 w-7 rounded-lg bg-dash-border shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32 bg-dash-border" />
              <Skeleton className="h-2.5 w-20 bg-dash-border" />
            </div>
          </div>
        ))
      ) : activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-dash-muted">
          <Clock size={24} className="mb-2 opacity-40" />
          <p className="text-xs">No activity yet</p>
        </div>
      ) : (
        activity.map((entry, idx) => {
          const meta = getActionMeta(entry.actionType);
          const Icon = meta.icon;
          const actor =
            typeof entry.actorId === "object" && entry.actorId !== null
              ? (entry.actorId as { fullName?: string; email?: string }).fullName ??
                (entry.actorId as { email?: string }).email ??
                entry.actorRole
              : entry.actorRole;

          return (
            <motion.div
              key={entry._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.25 }}
              className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-dash-hover/60 transition-colors group cursor-default"
            >
              <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-dash-border/60">
                <Icon size={13} className={meta.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-dash-text truncate">{meta.label}</p>
                <p className="text-[10px] text-dash-muted truncate">
                  {actor} · {entry.ipAddress}
                </p>
              </div>
              <span className="text-[10px] text-dash-muted shrink-0 pt-0.5">
                {timeAgo(entry.timestamp)}
              </span>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

// ---- Main component ----

export function DashboardCharts({
  volumeData,
  riskData,
  statusData,
  tamperData,
  userCounts,
  recentActivity,
  isLoading,
}: DashboardChartsProps) {
  const totalRisk = riskData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6 mt-2">

      {/* Row 1: User Roster + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* User Roster */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl"
        >
          <SectionHeader title="User Roster" subtitle="Active accounts by role" />
          <UserRosterCards userCounts={userCounts} isLoading={isLoading} />
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl flex flex-col"
        >
          <SectionHeader title="Recent Activity" subtitle="Latest system events" />
          <div className="flex-1 min-h-0">
            <RecentActivityFeed activity={recentActivity} isLoading={isLoading} />
          </div>
        </motion.div>
      </div>

      {/* Row 2: Case Volume Over Time — full width */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl min-w-0"
      >
        {isLoading ? (
          <ChartSkeleton height={300} />
        ) : (
          <>
            <div className="flex items-start justify-between mb-6">
              <SectionHeader title="Case Volume Over Time" subtitle="New cases submitted per month" />
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest">
                Last 9 months
              </Badge>
            </div>
            <div className="h-[280px] w-full min-w-0 overflow-hidden">
              <ChartContainer
                config={{ cases: { label: "Cases", color: "var(--dash-accent)" } }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--dash-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--dash-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="cases"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "var(--dash-card)", strokeWidth: 2, stroke: "#10b981" }}
                      activeDot={{ r: 7, fill: "#10b981", stroke: "#065f46", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </>
        )}
      </motion.div>

      {/* Row 3: Risk Distribution + Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Risk Distribution Donut */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl"
        >
          {isLoading ? (
            <ChartSkeleton height={220} />
          ) : (
            <>
              <SectionHeader title="Risk Distribution" subtitle="Across all AI-analysed reports" />
              <div className="flex items-center gap-6">
                <div className="h-[180px] w-[180px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        animationBegin={200}
                        animationDuration={800}
                      >
                        {riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--dash-card)",
                          borderColor: "var(--dash-border)",
                          borderRadius: "8px",
                        }}
                        itemStyle={{ color: "var(--dash-text)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centre label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-dash-text">{totalRisk}</span>
                    <span className="text-[10px] text-dash-muted uppercase tracking-wider">Reports</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex-1 space-y-3">
                  {riskData.map((d) => (
                    <div key={d.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-xs text-dash-muted font-medium">{d.name}</span>
                        </div>
                        <span className="text-xs font-bold text-dash-text">{d.value}</span>
                      </div>
                      <div className="h-1 rounded-full bg-dash-border overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: totalRisk > 0 ? `${(d.value / totalRisk) * 100}%` : "0%" }}
                          transition={{ duration: 0.7, delay: 0.3 }}
                          className="h-full rounded-full"
                          style={{ background: d.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Status Breakdown (stacked bar) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl min-w-0"
        >
          {isLoading ? (
            <ChartSkeleton height={220} />
          ) : (
            <>
              <div className="flex items-start justify-between mb-6">
                <SectionHeader title="Status Breakdown" subtitle="Cases by outcome, last 4 weeks" />
                <div className="flex flex-col gap-1.5 shrink-0 mt-0.5">
                  {[
                    { label: "Verified", color: "#10b981" },
                    { label: "Pending", color: "#f59e0b" },
                    { label: "Rejected", color: "#f43f5e" },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />
                      <span className="text-[10px] text-dash-muted">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-[200px] w-full min-w-0 overflow-hidden">
                <ChartContainer
                  config={{
                    verified: { label: "Verified", color: "#10b981" },
                    pending: { label: "Pending", color: "#f59e0b" },
                    rejected: { label: "Rejected", color: "#f43f5e" },
                  }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--dash-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--dash-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="verified" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} maxBarSize={36} />
                      <Bar dataKey="pending" stackId="a" fill="#f59e0b" maxBarSize={36} />
                      <Bar dataKey="rejected" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Row 4: Tamper Score Histogram — full width */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl min-w-0"
      >
        {isLoading ? (
          <ChartSkeleton height={230} />
        ) : (
          <>
            <div className="flex items-start justify-between mb-6">
              <SectionHeader
                title="Tamper Score Distribution"
                subtitle="Evidence files scored by AI integrity analysis"
              />
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-sm bg-emerald-500" />
                  <span className="text-[10px] text-dash-muted">Clean (0-30)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-sm bg-amber-500" />
                  <span className="text-[10px] text-dash-muted">Medium (31-70)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-sm bg-rose-500" />
                  <span className="text-[10px] text-dash-muted">High (71-100)</span>
                </div>
              </div>
            </div>
            <div className="h-[230px] w-full min-w-0 overflow-hidden">
              <ChartContainer
                config={{ count: { label: "Files", color: "#8b5cf6" } }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tamperData}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    barCategoryGap={3}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
                    <XAxis dataKey="range" stroke="var(--dash-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--dash-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={40}>
                      {tamperData.map((entry, index) => {
                        const rangeStart = index * 10;
                        const color =
                          rangeStart < 31
                            ? "#10b981"
                            : rangeStart < 71
                            ? "#f59e0b"
                            : "#f43f5e";
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </>
        )}
      </motion.div>

    </div>
  );
}
