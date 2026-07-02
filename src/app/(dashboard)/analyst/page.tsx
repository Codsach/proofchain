"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { TamperScoreBadge } from "@/components/TamperScoreBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnalystMetrics } from "@/components/analyst/AnalystMetrics";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface QueueCase {
  caseId: string;
  title: string;
  incidentType: string;
  status: string;
  createdAt: string;
  aiSummary: { tamperScore: number; riskLevel: string } | null;
}

const INCIDENT_LABELS: Record<string, string> = {
  data_breach: "Data Breach",
  insider_threat: "Insider Threat",
  malware: "Malware",
  phishing: "Phishing",
  other: "Other",
};

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

export default function AnalystPage() {
  const { user, getToken } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<QueueCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchQueue = async (status: string, incidentType: string, search: string) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (incidentType !== "all") params.set("incidentType", incidentType);
      if (search) params.set("search", search);

      const res = await fetch(`/api/cases/queue?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load queue");
      const data = await res.json();
      setCases(data.cases ?? []);
    } catch {
      setError("Protcol failure: Could not load the case queue registry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue(statusFilter, typeFilter, debouncedSearch);
  }, [statusFilter, typeFilter, debouncedSearch]);

  return (
    <div className="relative min-h-[calc(100vh-8rem)] -m-4 sm:-m-6 lg:-m-8 overflow-hidden flex justify-center w-full">
      {/* Background mesh gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <DashboardBackground />
      </div>

      <div className="relative z-10 w-full p-4 sm:p-6 lg:p-8">
        <div className="space-y-10 pb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-emerald-500/50" />
              <p className="text-[10px] font-bold text-dash-accent uppercase tracking-[0.3em]">Forensic Authentication Center</p>
            </div>
            <h1 className="font-heading font-bold tracking-wider text-dash-text uppercase headline-lg">Case Queue</h1>
            <p className="mt-3 text-sm text-dash-muted font-medium max-w-lg leading-relaxed">
              Welcome back, <span className="text-dash-text">{user?.fullName}</span>. Please review the pending evidence submissions for cryptographic and visual integrity.
            </p>
          </motion.div>

          {/* Metrics Dashboard */}
          <AnalystMetrics />

          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 flex-wrap bg-dash-card/50 border border-dash-border p-5 rounded-2xl"
          >
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Search Queue</p>
              <Input
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-dash-input border-dash-border hover:border-dash-accent/55 focus-visible:ring-1 focus-visible:ring-dash-accent/20 focus-visible:border-dash-accent transition-all text-dash-text h-11 rounded-full px-5"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Lifecycle State</p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-52 h-11 bg-dash-input border-dash-border hover:border-emerald-500/30 transition-all rounded-xl text-dash-muted">
                  <SelectValue placeholder="System status" />
                </SelectTrigger>
                <SelectContent className="bg-dash-bg border-dash-border text-dash-text font-medium">
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="pending_ai_review">AI Scanning</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="ai_timeout">AI Timeout</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Taxonomy</p>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-52 h-11 bg-dash-input border-dash-border hover:border-emerald-500/30 transition-all rounded-xl text-dash-muted">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="bg-dash-bg border-dash-border text-dash-text font-medium">
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(INCIDENT_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-48 bg-dash-hover rounded-lg" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-dash-hover" />)}
              </div>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-12 text-center backdrop-blur-2xl">
              <h2 className="text-xl font-bold text-white mb-2 underline decoration-rose-500/30">Registry Failure</h2>
              <p className="text-dash-muted mb-6 font-medium">{error}</p>
              <button onClick={() => window.location.reload()} className="border-dash-border hover:bg-dash-border text-white px-6 py-2 rounded-xl border text-sm font-medium">
                Re-Initialize
              </button>
            </div>
          ) : cases.length === 0 ? (
            <div className="rounded-3xl border border-dash-border bg-dash-card/50 p-20 text-center backdrop-blur-2xl">
              <h2 className="text-xl font-bold text-dash-text mb-2">Queue Clear</h2>
              <p className="text-dash-muted max-w-xs mx-auto text-sm font-medium">No pending forensic targets assigned to your node.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dash-border bg-dash-card/30 overflow-hidden shadow-2xl"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-dash-border bg-dash-hover/20">
                      <th className="px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Target Subject</th>
                      <th className="px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Taxonomy</th>
                      <th className="px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden md:table-cell">AI Risk Level</th>
                      <th className="px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden md:table-cell">AI Integrity</th>
                      <th className="px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Lifecycle</th>
                      <th className="px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden sm:table-cell">Enlisted</th>
                      <th className="px-6 py-5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dash-border/60">
                    <AnimatePresence>
                      {cases.map((c) => (
                        <motion.tr
                          key={c.caseId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-dash-hover/40 transition-colors group cursor-pointer"
                          onClick={() => window.location.href = `/analyst/cases/${c.caseId}`}
                        >
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-dash-text group-hover:text-dash-accent transition-colors">{c.title}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(c.caseId);
                                  toast({ title: "Copied", description: "Case ID copied to clipboard." });
                                }}
                                className="text-[10px] text-dash-muted hover:text-dash-accent font-mono mt-1 tracking-tighter flex items-center gap-1 bg-dash-input hover:bg-dash-hover px-1.5 py-0.5 rounded border border-dash-border transition-colors w-fit"
                                title="Copy Case ID"
                              >
                                <span>ID: {c.caseId.slice(0, 8)}...</span>
                                <Copy size={8} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[10px] font-bold text-dash-muted uppercase tracking-wider">
                              {INCIDENT_LABELS[c.incidentType] ?? c.incidentType}
                            </span>
                          </td>
                          <td className="px-6 py-5 hidden md:table-cell">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${
                              c.aiSummary?.riskLevel === "high" ? "text-rose-400" :
                              c.aiSummary?.riskLevel === "medium" ? "text-amber-400" : "text-emerald-400"
                            }`}>
                              {c.aiSummary?.riskLevel ?? "PENDING"}
                            </span>
                          </td>
                          <td className="px-6 py-5 hidden md:table-cell">
                            <div className="scale-90 origin-left">
                              <TamperScoreBadge
                                score={c.aiSummary?.tamperScore ?? null}
                                showLabel={false}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <CaseStatusBadge status={c.status} />
                          </td>
                          <td className="px-6 py-5 text-dash-muted text-xs hidden sm:table-cell">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/verify/${c.caseId}`}
                                target="_blank"
                                className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10"
                              >
                                Verify ↗
                              </Link>
                              <Link
                                href={`/analyst/cases/${c.caseId}`}
                                className="text-[10px] font-bold uppercase tracking-widest text-dash-muted hover:text-dash-text transition-colors border border-dash-border bg-dash-input px-4 py-1.5 rounded-lg"
                              >
                                Review Target
                              </Link>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}