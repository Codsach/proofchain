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
    <div className="space-y-10 pb-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-emerald-500/50" />
          <p className="text-[10px] font-bold text-dash-accent uppercase tracking-[0.3em]">Forensic Authentication Center</p>
        </div>
        <h1 className="text-4xl font-bold text-dash-text tracking-tight">Case Queue</h1>
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
              <SelectItem value="all">Global (All States)</SelectItem>
              <SelectItem value="pending_review">Awaiting Review</SelectItem>
              <SelectItem value="ai_timeout">Internal Error (Timeout)</SelectItem>
              <SelectItem value="under_review">Active Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Taxonomy</p>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-52 h-11 bg-dash-input border-dash-border hover:border-emerald-500/30 transition-all rounded-xl text-dash-muted">
              <SelectValue placeholder="Classification" />
            </SelectTrigger>
            <SelectContent className="bg-dash-bg border-dash-border text-dash-text font-medium">
              <SelectItem value="all">Global (All Types)</SelectItem>
              {Object.entries(INCIDENT_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-rose-500/5 border border-rose-500/20 px-6 py-4 text-xs font-bold uppercase tracking-widest text-rose-400"
        >
          {error}
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-20 w-full rounded-2xl bg-dash-hover" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border border-dash-border bg-dash-card p-20 text-center backdrop-blur-2xl shadow-2xl"
        >
          <p className="text-dash-muted text-sm font-medium tracking-tight">
            Queue empty. No subjects currently match the selected filtering protocols.
          </p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dash-border bg-dash-bg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border bg-dash-card">
                  <th className="px-6 py-5 text-left text-[10px] font-bold text-dash-muted uppercase tracking-widest">Case Target</th>
                  <th className="px-6 py-5 text-left text-[10px] font-bold text-dash-muted uppercase tracking-widest hidden md:table-cell">Category</th>
                  <th className="px-6 py-5 text-left text-[10px] font-bold text-dash-muted uppercase tracking-widest">Neural Score</th>
                  <th className="px-6 py-5 text-left text-[10px] font-bold text-dash-muted uppercase tracking-widest">Review Protocol</th>
                  <th className="px-6 py-5 text-left text-[10px] font-bold text-dash-muted uppercase tracking-widest hidden sm:table-cell">Temporal Log</th>
                  <th className="px-6 py-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border">
                <AnimatePresence>
                  {cases.map((c, idx) => (
                    <motion.tr 
                      key={c.caseId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-dash-hover/50 transition-colors group cursor-pointer"
                      onClick={() => window.location.href = `/analyst/cases/${c.caseId}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <p className="font-medium text-dash-text transition-colors">
                            {c.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(c.caseId);
                              toast({ title: "Copied", description: "Case ID copied to clipboard." });
                            }}
                            className="text-[10px] text-dash-muted hover:text-dash-accent font-mono mt-0.5 tracking-tighter flex items-center gap-1 bg-dash-input hover:bg-dash-hover px-1.5 py-0.5 rounded border border-dash-border transition-colors w-fit"
                            title="Copy Case ID"
                          >
                            <span>ID: {c.caseId.slice(0, 8)}...</span>
                            <Copy size={8} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-5 hidden md:table-cell">
                        <span className="text-[10px] font-bold text-dash-muted uppercase tracking-widest border border-dash-border bg-dash-bg px-2 py-0.5 rounded">
                          {INCIDENT_LABELS[c.incidentType] ?? c.incidentType}
                        </span>
                      </td>
                      <td className="px-6 py-5">
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
  );
}