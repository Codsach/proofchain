"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CaseRow {
  caseId: string;
  title: string;
  incidentType: string;
  status: string;
  createdAt: string;
  investigatorId?: string;
  aiSummary: { tamperScore: number; riskLevel: string } | null;
}

const INCIDENT_LABELS: Record<string, string> = {
  data_breach: "Data Breach",
  insider_threat: "Insider Threat",
  malware: "Malware",
  phishing: "Phishing",
  other: "Other",
};

export default function AdminCasesPage() {
  const { getToken } = useAuth();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCases = useCallback(async (currentPage: number) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      if (statusFilter !== "all") params.set("status", statusFilter);
 
      const res = await fetch(`/api/admin/cases?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCases(data.cases ?? []);
      setTotalPages(data.pagination?.pages ?? 1);
    } catch {
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchCases(page);
  }, [page, fetchCases]);

  return (
    <div className="space-y-10">
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-emerald-500/50" />
          <p className="text-[10px] font-bold text-dash-accent uppercase tracking-[0.3em]">Evidence Repository</p>
        </div>
        <h1 className="text-4xl font-bold text-dash-text tracking-tight">Global Archives</h1>
        <p className="text-dash-muted mt-2 font-medium">
          Accessing <span className="text-dash-text">{cases.length}</span> forensic subjects in this sector. 
        </p>
      </div>

      <div className="flex bg-dash-card border border-dash-border p-4 rounded-2xl backdrop-blur-xl shadow-2xl items-center gap-4">
        <div className="space-y-1.5 min-w-[200px]">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Lifecycle Status</p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-dash-hover border-dash-border hover:border-emerald-500/30 transition-all text-white/70 h-10 rounded-xl">
              <SelectValue placeholder="All states" />
            </SelectTrigger>
            <SelectContent className="bg-dash-bg border-dash-border text-dash-text font-medium">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending_ai_review">AI Scanning</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="ai_timeout">AI Timeout</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} className="h-16 w-full rounded-2xl bg-dash-hover" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-3xl border border-dash-border bg-dash-sidebar backdrop-blur-2xl p-20 text-center shadow-2xl">
          <div className="w-12 h-12 bg-dash-border rounded-full flex items-center justify-center mx-auto mb-4 border border-dash-border">
            <span className="text-dash-muted">∅</span>
          </div>
          <p className="text-dash-muted text-sm font-medium">No encrypted records match current query parameters.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dash-border bg-dash-sidebar backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border bg-dash-card">
                  <th className="text-left px-6 py-4 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Case Descriptor</th>
                  <th className="text-left px-6 py-4 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden md:table-cell">Incident Taxonomy</th>
                  <th className="text-left px-6 py-4 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Integrity Score</th>
                  <th className="text-left px-6 py-4 font-bold text-dash-muted uppercase tracking-widest text-[10px]">Phase</th>
                  <th className="text-left px-6 py-4 font-bold text-dash-muted uppercase tracking-widest text-[10px] hidden sm:table-cell">Ingestion Date</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                <AnimatePresence>
                  {cases.map((c, idx) => (
                    <motion.tr 
                      key={c.caseId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-emerald-500/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <p className="font-semibold text-dash-text group-hover:text-dash-accent transition-colors truncate max-w-[200px]">
                            {c.title}
                          </p>
                          <p className="text-[10px] text-dash-muted font-mono mt-0.5 tracking-tighter">
                            OBJID::{c.caseId.slice(0, 12)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-dash-muted text-xs">
                        {INCIDENT_LABELS[c.incidentType] ?? c.incidentType}
                      </td>
                      <td className="px-6 py-4 group-hover:scale-105 transition-transform duration-300 origin-left">
                        <TamperScoreBadge
                          score={c.aiSummary?.tamperScore ?? null}
                          showLabel={false}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <CaseStatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-4 text-dash-muted text-xs hidden sm:table-cell font-mono">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/cases/${c.caseId}`}
                          className="text-[10px] font-bold uppercase tracking-widest text-dash-accent/60 hover:text-dash-accent transition-all border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 rounded-lg hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] outline-none"
                        >
                          Inspect →
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="text-[10px] font-bold uppercase tracking-widest text-dash-accent hover:text-dash-accent hover:bg-emerald-500/5 transition-all outline-none"
          >
            ← Previous Channel
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-white/10" />
            <span className="text-[10px] font-bold text-dash-muted uppercase tracking-[0.2em]">
              Sector <span className="text-dash-text">{page}</span> of {totalPages}
            </span>
            <div className="h-px w-8 bg-white/10" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
            className="text-[10px] font-bold uppercase tracking-widest text-dash-accent hover:text-dash-accent hover:bg-emerald-500/5 transition-all outline-none"
          >
            Next Channel →
          </Button>
        </div>
      )}
    </div>
  );
}