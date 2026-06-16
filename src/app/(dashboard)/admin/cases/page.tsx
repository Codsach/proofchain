"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

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
  const { toast } = useToast();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [incidentTypeFilter, setIncidentTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk Assign State
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [analysts, setAnalysts] = useState<Array<{ _id: string; fullName: string }>>([]);
  const [selectedAnalystId, setSelectedAnalystId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load analysts
  useEffect(() => {
    async function loadAnalysts() {
      try {
        const token = await getToken();
        const res = await fetch("/api/admin/users?role=analyst", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAnalysts(data.users ?? []);
        }
      } catch (err) {
        console.error("Failed to load analysts", err);
      }
    }
    loadAnalysts();
  }, [getToken]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchCases = useCallback(async (currentPage: number) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (incidentTypeFilter !== "all") params.set("incidentType", incidentTypeFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
 
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
  }, [getToken, statusFilter, incidentTypeFilter, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, incidentTypeFilter, debouncedSearch]);

  useEffect(() => {
    fetchCases(page);
  }, [page, fetchCases]);

  const toggleSelectAll = () => {
    if (selectedCases.length === cases.length && cases.length > 0) {
      setSelectedCases([]);
    } else {
      setSelectedCases(cases.map((c) => c.caseId));
    }
  };

  const toggleSelectCase = (caseId: string) => {
    setSelectedCases((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId]
    );
  };

  const handleBulkAssign = async () => {
    if (!selectedAnalystId || selectedCases.length === 0) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/cases/bulk-assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          caseIds: selectedCases,
          analystId: selectedAnalystId,
        }),
      });

      if (!res.ok) throw new Error("Bulk assign failed");

      // Success
      setIsAssignModalOpen(false);
      setSelectedCases([]);
      fetchCases(page);
    } catch (err) {
      console.error(err);
      alert("Failed to assign cases.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <div className="flex flex-col sm:flex-row bg-dash-card border border-dash-border p-4 rounded-2xl backdrop-blur-xl shadow-2xl gap-4">
        <div className="flex-1 space-y-1.5">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Search Archives</p>
          <Input
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-dash-hover border-dash-border hover:border-emerald-500/30 focus-visible:ring-emerald-500/30 transition-all text-white h-10 rounded-xl"
          />
        </div>

        <div className="space-y-1.5 sm:min-w-[180px]">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Incident Type</p>
          <Select value={incidentTypeFilter} onValueChange={setIncidentTypeFilter}>
            <SelectTrigger className="bg-dash-hover border-dash-border hover:border-emerald-500/30 transition-all text-white/70 h-10 rounded-xl">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="bg-dash-bg border-dash-border text-dash-text font-medium">
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(INCIDENT_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:min-w-[180px]">
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

      <AnimatePresence>
        {selectedCases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl backdrop-blur-xl shadow-lg"
          >
            <p className="text-sm font-bold text-emerald-400">
              {selectedCases.length} case{selectedCases.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedCases([])}
                className="text-white/60 hover:text-white"
              >
                Clear
              </Button>
              <Button
                onClick={() => setIsAssignModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
              >
                Assign to Analyst
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} className="h-16 w-full rounded-2xl bg-dash-hover" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-3xl border border-dash-border bg-dash-card backdrop-blur-2xl p-20 text-center shadow-2xl">
          <div className="w-12 h-12 bg-dash-border rounded-full flex items-center justify-center mx-auto mb-4 border border-dash-border">
            <span className="text-dash-muted">∅</span>
          </div>
          <p className="text-dash-muted text-sm font-medium">No encrypted records match current query parameters.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dash-border bg-dash-card backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border bg-dash-card">
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={cases.length > 0 && selectedCases.length === cases.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-dash-border bg-dash-bg accent-emerald-500 cursor-pointer"
                    />
                  </th>
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
                      className={`transition-colors group ${
                        selectedCases.includes(c.caseId) ? "bg-emerald-500/[0.05]" : "hover:bg-emerald-500/[0.02]"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCases.includes(c.caseId)}
                          onChange={() => toggleSelectCase(c.caseId)}
                          className="w-4 h-4 rounded border-dash-border bg-dash-bg accent-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <p className="font-semibold text-dash-text group-hover:text-dash-accent transition-colors truncate max-w-[200px]">
                            {c.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(c.caseId);
                              toast({ title: "Copied", description: "Case ID copied to clipboard." });
                            }}
                            className="text-[10px] text-dash-muted hover:text-dash-accent font-mono mt-0.5 tracking-tighter flex items-center gap-1 bg-black/40 hover:bg-black/80 px-1.5 py-0.5 rounded border border-dash-border/40 transition-colors w-fit"
                            title="Copy Case ID"
                          >
                            <span>ID: {c.caseId.slice(0, 8)}...</span>
                            <Copy size={8} />
                          </button>
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
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/verify/${c.caseId}`}
                            target="_blank"
                            className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-all border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10"
                          >
                            Verify ↗
                          </Link>
                          <Link
                            href={`/admin/cases/${c.caseId}`}
                            className="text-[10px] font-bold uppercase tracking-widest text-dash-accent/60 hover:text-dash-accent transition-all border border-white/10 bg-white/5 px-4 py-1.5 rounded-lg hover:border-white/20 outline-none"
                          >
                            Inspect →
                          </Link>
                        </div>
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

      {/* Bulk Assign Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="bg-dash-card border-dash-border text-white p-6 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Assign {selectedCases.length} Cases</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Select Analyst</p>
              <Select value={selectedAnalystId} onValueChange={setSelectedAnalystId}>
                <SelectTrigger className="bg-dash-hover border-dash-border focus-visible:ring-emerald-500/30 transition-all text-white h-12 rounded-xl">
                  <SelectValue placeholder="Choose an analyst" />
                </SelectTrigger>
                <SelectContent className="bg-dash-bg border-dash-border text-white">
                  {analysts.map((analyst) => (
                    <SelectItem key={analyst._id} value={analyst._id}>
                      {analyst.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-white/60 hover:text-white"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkAssign}
                disabled={!selectedAnalystId || isSubmitting}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6"
              >
                {isSubmitting ? "Assigning..." : "Confirm Assignment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}