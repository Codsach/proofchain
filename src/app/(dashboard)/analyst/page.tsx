"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { TamperScoreBadge } from "@/components/TamperScoreBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnalystMetrics } from "@/components/analyst/AnalystMetrics";

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
  const [cases, setCases] = useState<QueueCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchQueue = async (status: string, incidentType: string) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (incidentType !== "all") params.set("incidentType", incidentType);

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
    fetchQueue(statusFilter, typeFilter);
  }, [statusFilter, typeFilter]);

  return (
    <div className="space-y-10 pb-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-emerald-500/50" />
          <p className="text-[10px] font-bold text-dash-accent uppercase tracking-[0.3em]">Forensic Authentication Center</p>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Case Queue</h1>
        <p className="mt-2 text-dash-muted font-medium max-w-lg">
          Welcome back, <span className="text-white/70">{user?.fullName}</span>. Please review the pending evidence submissions for cryptographic and visual integrity.
        </p>
      </motion.div>

      {/* Metrics Dashboard */}
      <AnalystMetrics />

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-4 flex-wrap bg-dash-card border border-dash-border p-4 rounded-2xl backdrop-blur-xl"
      >
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Lifecycle State</p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-52 h-11 bg-black/40 border-dash-border hover:border-emerald-500/30 transition-all rounded-xl text-white/70">
              <SelectValue placeholder="System status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-dash-border text-white font-medium">
              <SelectItem value="all">Global (All States)</SelectItem>
              <SelectItem value="pending_review">Awaiting Review</SelectItem>
              <SelectItem value="ai_timeout">Internal Error (Timeout)</SelectItem>
              <SelectItem value="under_review">Active Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Taxonomy</p>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-52 h-11 bg-black/40 border-dash-border hover:border-emerald-500/30 transition-all rounded-xl text-white/70">
              <SelectValue placeholder="Classification" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-dash-border text-white font-medium">
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
          className="rounded-3xl border border-dash-border bg-dash-sidebar p-20 text-center backdrop-blur-2xl shadow-2xl"
        >
          <p className="text-white/30 text-sm font-medium tracking-tight">
            Queue empty. No subjects currently match the selected filtering protocols.
          </p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dash-border bg-dash-sidebar backdrop-blur-xl overflow-hidden shadow-2xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border bg-dash-sidebar">
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/20 uppercase tracking-widest">Case Target</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/20 uppercase tracking-widest hidden md:table-cell">Category</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/20 uppercase tracking-widest">Neural Score</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/20 uppercase tracking-widest">Review Protocol</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/20 uppercase tracking-widest hidden sm:table-cell">Temporal Log</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                  {cases.map((c, idx) => (
                    <motion.tr 
                      key={c.caseId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-dash-accent/[0.02] transition-colors group cursor-pointer"
                      onClick={() => window.location.href = `/analyst/cases/${c.caseId}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <p className="font-bold text-white group-hover:text-dash-accent transition-colors">
                            {c.title}
                          </p>
                          <p className="text-[10px] text-white/20 font-mono tracking-tighter mt-0.5">
                            ID::{c.caseId.slice(0, 16).toUpperCase()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5 hidden md:table-cell">
                        <span className="text-[10px] font-bold text-dash-muted uppercase tracking-widest border border-dash-border bg-dash-border px-2 py-0.5 rounded italic">
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
                      <td className="px-6 py-5 text-white/30 text-[10px] font-bold hidden sm:table-cell uppercase tracking-widest">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/analyst/cases/${c.caseId}`}
                          className="text-[10px] font-bold uppercase tracking-[0.2em] text-dash-accent/80 hover:text-dash-accent transition-colors border border-dash-accent/20 bg-emerald-500/5 px-4 py-1.5 rounded-lg group-hover:bg-dash-accent/10"
                        >
                          Review Target
                        </Link>
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