"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { TamperScoreBadge } from "@/components/TamperScoreBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnalystMetrics } from "@/components/analyst/AnalystMetrics";
import { useToast } from "@/hooks/use-toast";
import { Copy, CheckCircle2, RefreshCw, FolderOpen, History, ArrowRight } from "lucide-react";

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

const getPriority = (c: QueueCase) => {
  const score = c.aiSummary?.tamperScore;
  const risk = c.aiSummary?.riskLevel;
  if (risk === "high" || (score !== undefined && score > 70)) {
    return { label: "High", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
  }
  if (risk === "medium" || (score !== undefined && score > 30)) {
    return { label: "Medium", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
  }
  return { label: "Low", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
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

  // Fast 300ms search debounce for snappy page filters
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
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
      setError("Protocol failure: Could not load the case queue registry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue(statusFilter, typeFilter, debouncedSearch);
  }, [statusFilter, typeFilter, debouncedSearch]);

  const isFilterActive = statusFilter !== "all" || typeFilter !== "all" || searchQuery !== "";

  const resetFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setSearchQuery("");
  };

  const isQueueTrulyEmpty = cases.length === 0 && !isFilterActive;
  const isFilterNoResults = cases.length === 0 && isFilterActive;

  return (
    <div className="w-full space-y-10 pb-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-emerald-500/50" />
          <p className="type-eyebrow">Forensic Authentication Center</p>
        </div>
        <h1 className="type-display-xl">Case Queue</h1>
        <p className="mt-3 text-sm text-dash-muted font-medium max-w-lg leading-relaxed">
          Welcome back, <span className="text-dash-text">{user?.fullName}</span>. Please review the pending evidence submissions for cryptographic and visual integrity.
        </p>
      </motion.div>

      {/* Metrics Dashboard synced with filters */}
      <AnalystMetrics 
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        searchQuery={debouncedSearch}
      />

      {/* Filters bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-4 flex-wrap bg-dash-card border border-dash-border p-6 rounded-2xl shadow-3xs"
      >
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Search Queue</p>
          <Input
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-dash-input border-dash-border hover:border-dash-accent/55 focus-visible:ring-1 focus-visible:ring-dash-accent/20 focus-visible:border-dash-accent transition-all text-dash-text h-11 rounded-xl px-4"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Lifecycle State</p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52 h-11 bg-dash-input border-dash-border hover:border-dash-accent/55 transition-all rounded-xl text-dash-text focus:ring-0 focus:ring-offset-0 focus:outline-none">
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
            <SelectTrigger className="w-full sm:w-52 h-11 bg-dash-input border-dash-border hover:border-dash-accent/55 transition-all rounded-xl text-dash-text focus:ring-0 focus:ring-offset-0 focus:outline-none">
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

        {isFilterActive && (
          <div className="flex items-end pb-0.5 animate-in fade-in slide-in-from-right-2 duration-200">
            <Button
              onClick={resetFilters}
              variant="outline"
              className="border-dash-border hover:border-dash-muted/30 bg-dash-input hover:bg-dash-hover text-dash-muted hover:text-dash-text h-11 px-4 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow-3xs"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </motion.div>

      {/* Main content stream */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48 bg-dash-hover rounded-lg" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-dash-hover animate-pulse" />)}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-12 text-center backdrop-blur-2xl">
          <h2 className="text-xl font-bold text-white mb-2 underline decoration-rose-500/30">Registry Failure</h2>
          <p className="text-dash-muted mb-6 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="border-dash-border hover:bg-dash-border text-white px-6 py-2 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer">
            Re-Initialize
          </button>
        </div>
      ) : isQueueTrulyEmpty ? (
        /* Rich empty queue workspace state */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-dash-border bg-dash-card p-8 md:p-12 text-center shadow-sm relative overflow-hidden select-none flex flex-col justify-center items-center w-full"
          style={{ minHeight: "460px" }}
        >
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center w-full max-w-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-500 shadow-3xs">
              <CheckCircle2 className="w-7 h-7 stroke-[2]" />
            </div>
            
            <h2 className="text-2xl font-bold text-dash-text mb-3 tracking-tight">Queue Clear</h2>
            <p className="text-dash-muted text-sm font-medium leading-relaxed mb-8 max-w-md">
              No pending forensic evidence is currently assigned to you.
              <span className="text-dash-muted/70 text-xs mt-2 block font-normal leading-normal">
                You're all caught up. Use the shortcuts below to review completed investigations or refresh your assignment queue.
              </span>
            </p>

            <div className="w-full border-t border-dash-border/40 pt-8 flex flex-col gap-4">
              <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest text-center">Suggested Workspace Actions</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                <button 
                  onClick={() => {
                    fetchQueue(statusFilter, typeFilter, debouncedSearch);
                    toast({ title: "Queue Refreshed", description: "Forensic queue registry updated." });
                  }}
                  className="flex items-center justify-center p-3.5 rounded-xl border border-dash-border bg-dash-input hover:bg-dash-hover hover:border-dash-border/80 transition-all text-xs font-bold uppercase tracking-wider text-dash-text text-center gap-2 group cursor-pointer w-full select-none"
                >
                  <RefreshCw className="w-4 h-4 text-dash-muted group-hover:rotate-180 transition-transform duration-500" />
                  <span>Refresh Queue</span>
                </button>
                
                <button 
                  onClick={() => {
                    setStatusFilter("verified");
                    toast({ title: "Lifecycle Filter: Verified", description: "Showing completed verified investigations." });
                  }}
                  className="flex items-center justify-center p-3.5 rounded-xl border border-dash-border bg-dash-input hover:bg-dash-hover hover:border-dash-border/80 transition-all text-xs font-bold uppercase tracking-wider text-dash-text text-center gap-2 group cursor-pointer w-full select-none"
                >
                  <FolderOpen className="w-4 h-4 text-dash-muted group-hover:scale-110 transition-transform duration-200" />
                  <span>Review Completed</span>
                </button>
                
                <button 
                  onClick={() => {
                    setStatusFilter("rejected");
                    toast({ title: "Lifecycle Filter: Rejected", description: "Showing completed rejected investigations." });
                  }}
                  className="flex items-center justify-center p-3.5 rounded-xl border border-dash-border bg-dash-input hover:bg-dash-hover hover:border-dash-border/80 transition-all text-xs font-bold uppercase tracking-wider text-dash-text text-center gap-2 group cursor-pointer w-full select-none"
                >
                  <History className="w-4 h-4 text-dash-muted group-hover:translate-x-0.5 transition-transform duration-200" />
                  <span>Decision History</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : isFilterNoResults ? (
        /* Empty state for search filtering mismatch */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-dash-border bg-dash-card p-16 text-center max-w-md mx-auto shadow-sm relative overflow-hidden select-none"
        >
          <div className="w-12 h-12 rounded-full bg-dash-input flex items-center justify-center mb-4 mx-auto border border-dash-border/40">
            <span className="text-lg">🔍</span>
          </div>
          <h2 className="text-base font-bold text-dash-text mb-1.5">No matching cases</h2>
          <p className="text-xs text-dash-muted max-w-xs mx-auto mb-6 leading-normal font-medium">
            No cases match the current filters. Try adjusting your query or resetting filters.
          </p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center justify-center border border-dash-border bg-dash-input hover:bg-dash-hover text-dash-text font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-3xs cursor-pointer"
          >
            Reset Filters
          </button>
        </motion.div>
      ) : (
        /* Operational Queue Cases List */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dash-border bg-dash-card overflow-hidden shadow-sm"
        >
          {/* Table Count Indicator Header */}
          <div className="p-6 border-b border-dash-border bg-dash-card flex items-center justify-between">
            <div className="flex items-baseline gap-4">
              <div>
                <h2 className="text-sm font-bold text-dash-text uppercase tracking-[0.2em]">Operational Queue</h2>
                <p className="text-[10px] text-dash-muted font-bold uppercase tracking-widest mt-1 italic">Active assignments awaiting consensus</p>
              </div>
              {isFilterActive && (
                <div className="flex items-center gap-2 text-xs font-semibold text-dash-muted select-none">
                  <span>Showing {cases.length} case{cases.length > 1 ? "s" : ""}</span>
                  <span className="text-dash-border font-light">|</span>
                  <button
                    onClick={resetFilters}
                    className="text-[10px] font-bold uppercase tracking-wider text-dash-accent hover:text-dash-accent/80 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-dash-border bg-dash-hover/20 select-none">
                  <th className="px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Target Subject</th>
                  <th className="px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Taxonomy</th>
                  <th className="px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden md:table-cell">AI Integrity</th>
                  <th className="px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden md:table-cell">Priority</th>
                  <th className="px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Lifecycle</th>
                  <th className="px-6 py-5 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden sm:table-cell">Submitted</th>
                  <th className="px-6 py-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border/60">
                <AnimatePresence>
                  {cases.map((c) => {
                    const priority = getPriority(c);
                    return (
                      <motion.tr
                        key={c.caseId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-dash-hover/40 transition-colors group cursor-pointer"
                        onClick={() => window.location.href = `/analyst/cases/${c.caseId}`}
                      >
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-dash-text group-hover:text-dash-accent transition-colors duration-250">{c.title}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(c.caseId);
                                toast({ title: "Copied", description: "Case ID copied to clipboard." });
                              }}
                              className="text-[10px] text-dash-muted hover:text-dash-accent font-mono mt-1 tracking-tighter flex items-center gap-1 bg-dash-input hover:bg-dash-hover px-1.5 py-0.5 rounded border border-dash-border transition-colors w-fit select-none"
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
                          <div className="scale-90 origin-left">
                            <TamperScoreBadge
                              score={c.aiSummary?.tamperScore ?? null}
                              showLabel={false}
                            />
                          </div>
                        </td>

                        <td className="px-6 py-5 hidden md:table-cell">
                          <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-md ${priority.color}`}>
                            {priority.label}
                          </span>
                        </td>
                        
                        <td className="px-6 py-5">
                          <CaseStatusBadge status={c.status} />
                        </td>
                        
                        <td className="px-6 py-5 text-dash-muted text-xs hidden sm:table-cell">
                          {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        
                        <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/verify/${c.caseId}`}
                              target="_blank"
                              className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 flex items-center gap-1 cursor-pointer"
                            >
                              Verify ↗
                            </Link>
                            <Link
                              href={`/analyst/cases/${c.caseId}`}
                              className="text-[10px] font-bold uppercase tracking-widest text-dash-muted hover:text-dash-text transition-all border border-dash-border bg-dash-input hover:bg-dash-hover hover:border-dash-border/80 px-4 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <span>Review Target</span>
                              <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}