"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ExternalLink, FileClock, Search, ShieldAlert, XCircle } from "lucide-react";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/StatCard";

type HistoricalCase = {
  _id: string;
  caseId: string;
  title: string;
  incidentType: string;
  status: "verified" | "rejected" | "archived";
  overallTamperScore: number | null;
  overallRiskLevel: "low" | "medium" | "high" | null;
  createdAt: string;
  updatedAt: string;
};

type HistoryResponse = {
  cases: HistoricalCase[];
  summary: { total: number; verified: number; rejected: number; archived: number };
  pagination: { page: number; limit: number; total: number; pages: number };
  error?: string;
};

const INCIDENT_TYPES: Record<string, string> = {
  data_breach: "Data Breach", insider_threat: "Insider Threat", malware: "Malware / Ransomware", phishing: "Phishing", other: "Other",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function caseHref(role: string, caseId: string) {
  return role === "admin" ? `/admin/cases/${caseId}` : `/${role}/cases/${caseId}`;
}

export default function HistoryPage() {
  const { user, getToken } = useAuth();
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [incidentType, setIncidentType] = useState("all");
  const [riskLevel, setRiskLevel] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Please log in again.");
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (submittedSearch) params.set("search", submittedSearch);
      if (status !== "all") params.set("status", status);
      if (incidentType !== "all") params.set("incidentType", incidentType);
      if (riskLevel !== "all") params.set("riskLevel", riskLevel);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const response = await fetch(`/api/history?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const payload = await response.json() as HistoryResponse;
      if (!response.ok) throw new Error(payload.error ?? "Unable to load case history.");
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load case history.");
    } finally { setLoading(false); }
  }, [from, getToken, incidentType, page, riskLevel, status, submittedSearch, to, user]);

  useEffect(() => {
    const requestId = window.setTimeout(() => { void loadHistory(); }, 0);
    return () => window.clearTimeout(requestId);
  }, [loadHistory]);

  const filtersActive = useMemo(() => Boolean(submittedSearch || status !== "all" || incidentType !== "all" || riskLevel !== "all" || from || to), [from, incidentType, riskLevel, status, submittedSearch, to]);
  const clearFilters = () => { setSearch(""); setSubmittedSearch(""); setStatus("all"); setIncidentType("all"); setRiskLevel("all"); setFrom(""); setTo(""); setPage(1); };
  const summary = data?.summary ?? { total: 0, verified: 0, rejected: 0, archived: 0 };

  return <div className="flex w-full flex-col gap-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-1">
        <div className="mb-0.5 flex items-center gap-2"><div className="h-px w-6 bg-slate-400/40" /><p className="type-eyebrow">Resolved Case Registry</p></div>
        <h1 className="type-display-xl">Case History</h1>
        <p className="mt-0.5 max-w-lg text-sm font-medium text-dash-muted">Review closed investigations, final verdicts, and their immutable evidence records.</p>
      </motion.div>
      <div className="flex items-center gap-2 text-xs font-mono text-dash-muted"><Clock3 size={15} className="text-dash-accent" /> Resolution time shown from the latest case update</div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Resolved Cases" value={summary.total} icon={FileClock} variantKey="blue" />
      <StatCard label="Verdict Passed" value={summary.verified} icon={CheckCircle2} variantKey="green" />
      <StatCard label="Verdict Rejected" value={summary.rejected} icon={XCircle} variantKey="orange" />
      <StatCard label="Archived" value={summary.archived} icon={Archive} variantKey="purple" />
    </div>

    <div className="rounded-2xl border border-dash-border bg-dash-card p-5 shadow-sm">
      <form onSubmit={(event) => { event.preventDefault(); setSubmittedSearch(search.trim()); setPage(1); }} className="flex flex-col gap-4">
        <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-muted" size={17} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search case ID, title, or description" className="h-11 border-dash-border bg-dash-input pl-10 text-dash-text placeholder:text-dash-muted" /></div>
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect label="Verdict" value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} items={[["all", "All verdicts"], ["verified", "Verdict passed"], ["rejected", "Verdict rejected"], ["archived", "Archived"]]} />
          <FilterSelect label="Incident Type" value={incidentType} onValueChange={(value) => { setIncidentType(value); setPage(1); }} items={[["all", "All incident types"], ...Object.entries(INCIDENT_TYPES)]} />
          <FilterSelect label="Risk Level" value={riskLevel} onValueChange={(value) => { setRiskLevel(value); setPage(1); }} items={[["all", "All risk levels"], ["low", "Low risk"], ["medium", "Medium risk"], ["high", "High risk"]]} />
          <DateFilter label="From" value={from} onChange={(value) => { setFrom(value); setPage(1); }} />
          <DateFilter label="To" value={to} onChange={(value) => { setTo(value); setPage(1); }} />
          <Button type="submit" className="h-10 bg-dash-accent px-5 text-white hover:bg-dash-accent/90">Apply</Button>
          <AnimatePresence>{filtersActive && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Button type="button" variant="ghost" onClick={clearFilters} className="h-10 text-xs font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-500/5 hover:text-rose-400">Clear filters</Button></motion.div>}</AnimatePresence>
        </div>
      </form>
    </div>

    {loading ? <div className="space-y-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-16 w-full rounded-2xl bg-dash-hover" />)}</div> : error ? <div className="rounded-3xl border border-rose-500/20 bg-rose-500/[0.03] p-12 text-center"><ShieldAlert className="mx-auto mb-3 text-rose-400" /><p className="font-medium text-dash-text">{error}</p><Button variant="outline" onClick={() => void loadHistory()} className="mt-5 border-dash-border bg-dash-card">Try again</Button></div> : data?.cases.length === 0 ? <div className="rounded-3xl border border-dash-border bg-dash-card p-20 text-center shadow-sm"><FileClock className="mx-auto mb-4 text-dash-muted" size={38} /><p className="text-sm font-medium text-dash-muted">No resolved cases match the current criteria.</p></div> : <>
      <HistoryTable cases={data?.cases ?? []} role={user?.role ?? "investigator"} />
      <div className="flex flex-col items-center justify-between gap-4 px-2 pt-2 sm:flex-row"><p className="text-[10px] font-bold uppercase tracking-widest text-dash-muted">{data?.pagination.total ?? 0} resolved records</p><div className="flex items-center gap-2"><Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="text-dash-muted hover:bg-dash-hover"><ChevronLeft size={16} /> Previous</Button><span className="font-mono text-[10px] text-dash-muted">Page <span className="text-dash-text">{page}</span> of {data?.pagination.pages ?? 1}</span><Button variant="ghost" size="sm" disabled={page >= (data?.pagination.pages ?? 1)} onClick={() => setPage((current) => current + 1)} className="text-dash-muted hover:bg-dash-hover">Next <ChevronRight size={16} /></Button></div></div>
    </>}
  </div>;
}

function HistoryTable({ cases, role }: { cases: HistoricalCase[]; role: string }) {
  return <div className="overflow-hidden rounded-2xl border border-dash-border bg-dash-card shadow-sm"><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-dash-border bg-dash-card"><th className="px-6 py-5 text-left type-table-header text-dash-muted">Case Record</th><th className="hidden px-6 py-5 text-left type-table-header text-dash-muted md:table-cell">Verdict</th><th className="hidden px-6 py-5 text-left type-table-header text-dash-muted lg:table-cell">Integrity Score</th><th className="hidden px-6 py-5 text-left type-table-header text-dash-muted sm:table-cell">Resolved</th><th className="px-6 py-5 text-right type-table-header text-dash-muted">Record</th></tr></thead><tbody className="divide-y divide-dash-border font-medium"><AnimatePresence>{cases.map((caseItem, index) => <motion.tr key={caseItem._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }} className="group transition-colors hover:bg-emerald-500/[0.02]"><td className="px-6 py-5"><p className="text-dash-text">{caseItem.title}</p><p className="mt-1 font-mono text-[10px] text-dash-muted">{caseItem.caseId.slice(0, 12)}… <span className="ml-2 font-sans">{INCIDENT_TYPES[caseItem.incidentType] ?? caseItem.incidentType}</span></p></td><td className="hidden px-6 py-5 md:table-cell"><CaseStatusBadge status={caseItem.status} /></td><td className="hidden px-6 py-5 lg:table-cell"><span className={caseItem.overallRiskLevel === "high" ? "text-rose-400" : caseItem.overallRiskLevel === "medium" ? "text-amber-400" : "text-emerald-400"}>{caseItem.overallTamperScore === null ? "Awaiting score" : `${caseItem.overallTamperScore}% tamper risk`}</span></td><td className="hidden whitespace-nowrap px-6 py-5 font-mono text-dash-muted sm:table-cell">{formatDate(caseItem.updatedAt)}</td><td className="px-6 py-5 text-right"><Button asChild variant="ghost" size="sm" className="text-dash-accent hover:bg-emerald-500/5 hover:text-dash-accent"><Link href={caseHref(role, caseItem.caseId)}>View <ExternalLink size={13} /></Link></Button></td></motion.tr>)}</AnimatePresence></tbody></table></div></div>;
}

function FilterSelect({ label, value, onValueChange, items }: { label: string; value: string; onValueChange: (value: string) => void; items: string[][] }) {
  return <div className="min-w-[155px] space-y-1.5"><p className="ml-1 text-[10px] font-bold uppercase tracking-widest text-dash-muted">{label}</p><Select value={value} onValueChange={onValueChange}><SelectTrigger className="h-10 border-dash-border bg-dash-input text-xs text-dash-text"><SelectValue /></SelectTrigger><SelectContent className="border-dash-border bg-dash-bg text-dash-text">{items.map(([itemValue, itemLabel]) => <SelectItem key={itemValue} value={itemValue}>{itemLabel}</SelectItem>)}</SelectContent></Select></div>;
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="min-w-[135px] space-y-1.5"><p className="ml-1 text-[10px] font-bold uppercase tracking-widest text-dash-muted">{label}</p><Input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 border-dash-border bg-dash-input px-3 text-xs text-dash-text" /></div>;
}
