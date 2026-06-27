"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Brain, Shield, FolderOpen, Copy } from "lucide-react";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InvestigatorCharts } from "@/components/investigator/InvestigatorCharts";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
type InvestigatorCase = {
  _id: string;
  caseId: string;
  title: string;
  incidentType: string;
  status: string;
  tags: string[];
  files: Array<{ fileId: string }>;
  createdAt: string;
  incidentDate: string;
};

type CasesResponse = {
  cases: InvestigatorCase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  data_breach: "Data Breach",
  insider_threat: "Insider Threat",
  malware: "Malware / Ransomware",
  phishing: "Phishing",
  other: "Other",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getOpenCaseCount(cases: InvestigatorCase[]) {
  return cases.filter((caseItem) =>
    ["pending_ai_review", "pending_review", "ai_timeout", "under_review"].includes(
      caseItem.status
    )
  ).length;
}

export default function InvestigatorPage() {
  const { user, getToken } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<InvestigatorCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [incidentTypeFilter, setIncidentTypeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    let isCancelled = false;

    async function loadCases() {
      if (!user) {
        setIsLoadingCases(false);
        return;
      }

      setIsLoadingCases(true);
      setError(null);

      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Your session expired. Please log in again.");
        }

        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (incidentTypeFilter !== "all") params.set("incidentType", incidentTypeFilter);
        if (tagFilter !== "all") params.set("tag", tagFilter);
        if (debouncedSearch) params.set("search", debouncedSearch);

        const res = await fetch(`/api/cases?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = (await res.json()) as Partial<CasesResponse> & {
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error ?? "Could not load your cases.");
        }

        if (!isCancelled) {
          setCases(data.cases ?? []);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your cases."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingCases(false);
        }
      }
    }

    void loadCases();

    return () => {
      isCancelled = true;
    };
  }, [user, getToken, statusFilter, incidentTypeFilter, tagFilter, debouncedSearch]);

  const openCases = getOpenCaseCount(cases);
  const totalFiles = cases.reduce(
    (sum, caseItem) => sum + caseItem.files.length,
    0
  );

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-slate-400/50" />
            <p className="text-[10px] font-bold text-dash-accent uppercase tracking-[0.3em]">Operative Field Dashboard</p>
          </div>
          <h1 className="text-4xl font-extrabold text-dash-text tracking-tight font-sans">Case Modules</h1>
          <p className="mt-2 text-dash-muted font-medium max-w-lg">
            Monitor evidence submission queues, cryptographic review status, and real-time chain of custody integrity.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              asChild
              className="border border-[var(--dash-border)] bg-transparent hover:bg-dash-hover text-dash-text font-bold h-12 px-8 rounded-xl transition-all"
            >
              <Link href="/investigator/submit">Submit Evidence</Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              asChild
              className="bg-[var(--dash-accent)] hover:bg-[var(--dash-accent)]/90 text-white font-bold h-12 px-8 rounded-xl shadow-sm"
            >
              <Link href="/investigator/cases/new">+ New Case</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          {
            label: "Assigned Cases",
            value: cases.length,
            desc: "Total subjects in registry",
            icon: Folder,
            brand: "PROOFCHAIN",
            brandColor: "bg-indigo-600/10 text-indigo-700 border-indigo-200/50",
            cardStyle: "bg-[linear-gradient(135deg,rgba(79,70,229,0.03)_0%,rgba(255,255,255,1)_100%)] border-indigo-100 hover:border-indigo-200 text-indigo-950",
            sparkline: (
              <svg className="w-16 h-8 text-indigo-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <motion.path 
                  d="M5,22 Q20,10 45,20 T80,8 T95,12" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </svg>
            )
          },
          {
            label: "Pending Analysis",
            value: openCases,
            desc: "Active review queue",
            icon: Brain,
            brand: "AI NODE",
            brandColor: "bg-amber-600/10 text-amber-700 border-amber-200/50",
            cardStyle: "bg-[linear-gradient(135deg,rgba(217,119,6,0.03)_0%,rgba(255,255,255,1)_100%)] border-amber-100 hover:border-amber-200 text-amber-950",
            sparkline: (
              <svg className="w-16 h-8 text-amber-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <motion.path 
                  d="M5,8 Q30,5 55,22 T95,15" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </svg>
            )
          },
          {
            label: "Evidence Integrity",
            value: totalFiles,
            desc: "Validated artifacts",
            icon: Shield,
            brand: "SECURE CUSTODY",
            brandColor: "bg-emerald-600/10 text-emerald-700 border-emerald-200/50",
            cardStyle: "bg-[linear-gradient(135deg,rgba(16,185,129,0.03)_0%,rgba(255,255,255,1)_100%)] border-emerald-100 hover:border-emerald-200 text-emerald-950",
            sparkline: (
              <svg className="w-16 h-8 text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <motion.path 
                  d="M5,15 Q30,12 60,18 T95,10" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </svg>
            )
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover="hover"
              className="h-full"
            >
              <Card className={`rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 h-full ${stat.cardStyle}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-wider ${stat.brandColor}`}>
                    {stat.brand}
                  </span>
                  <span className="text-[10px] text-dash-muted font-bold uppercase tracking-widest">
                    {stat.label}
                  </span>
                </CardHeader>
                <CardContent className="pt-2 px-6 pb-5">
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-dash-text tracking-tight">
                      {stat.value}
                    </p>
                    {stat.sparkline}
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-[10px] text-dash-muted/70 font-semibold tracking-tight">
                    <motion.div
                      variants={{
                        hover: { scale: 1.2, rotate: 10, y: -2 }
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </motion.div>
                    <span className="uppercase tracking-wider">{stat.desc}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="flex gap-4 flex-wrap bg-dash-card border border-dash-border p-4 rounded-xl shadow-sm">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Search Cases</p>
          <Input
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-dash-input border-dash-border hover:border-dash-accent/40 focus-visible:ring-dash-accent/20 transition-all text-dash-text h-11 rounded-full px-5"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Taxonomy</p>
          <Select value={incidentTypeFilter} onValueChange={setIncidentTypeFilter}>
            <SelectTrigger className="w-48 h-11 bg-dash-input border-dash-border hover:border-dash-accent/30 transition-all rounded-lg text-dash-muted">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="bg-dash-bg border-dash-border text-dash-text font-medium">
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(INCIDENT_TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Lifecycle State</p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 h-11 bg-dash-input border-dash-border hover:border-dash-accent/30 transition-all rounded-lg text-dash-muted">
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
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px] space-y-1.5">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest ml-1">Tag Filter</p>
          <Input
            placeholder="Filter by exact tag..."
            value={tagFilter === "all" ? "" : tagFilter}
            onChange={(e) => setTagFilter(e.target.value || "all")}
            className="bg-dash-input border-dash-border hover:border-dash-accent/40 focus-visible:ring-dash-accent/20 transition-all text-dash-text h-11 rounded-lg px-4"
          />
        </div>
      </div>

      {!isLoadingCases && !error && cases.length > 0 && <InvestigatorCharts cases={cases} />}

      {isLoadingCases ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48 bg-dash-hover rounded-lg" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl bg-dash-hover" />)}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-12 text-center backdrop-blur-2xl">
          <h2 className="text-xl font-bold text-white mb-2 underline decoration-rose-500/30">Protocol Execution Error</h2>
          <p className="text-dash-muted mb-6 font-medium">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="border-dash-border hover:bg-dash-border text-white h-10 px-6 rounded-xl">
            Re-Initialize
          </Button>
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-3xl border border-dash-border bg-dash-card p-20 text-center backdrop-blur-2xl shadow-2xl">
          <div className="w-16 h-16 bg-dash-border rounded-full flex items-center justify-center mx-auto mb-6 border border-dash-border">
            <FolderOpen className="w-8 h-8 text-dash-muted" />
          </div>
          <h2 className="text-xl font-bold text-dash-text mb-2">Registry Empty</h2>
          <p className="text-dash-muted mb-8 max-w-xs mx-auto text-sm font-medium">No forensic records detected. Deploy your first evidence package to begin tracking.</p>
          <Button
            asChild
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-11 px-8 rounded-xl"
          >
            <Link href="/investigator/submit">Initiate Submission</Link>
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-dash-border bg-dash-card overflow-hidden shadow-sm"
        >
          <div className="p-6 border-b border-dash-border bg-dash-card flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-dash-text uppercase tracking-[0.2em]">Operational Stream</h2>
              <p className="text-[10px] text-dash-muted font-bold uppercase tracking-widest mt-1 italic">Sorted by temporal priority</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-[var(--dash-accent)] animate-pulse" />
          </div>
          
          <Table>
            <TableHeader className="bg-dash-card hover:bg-transparent">
              <TableRow className="border-b border-dash-border hover:bg-transparent">
                <TableHead className="px-6 py-4 text-left text-[10px] font-bold text-dash-muted uppercase tracking-widest">Target Subject</TableHead>
                <TableHead className="px-6 py-4 text-left text-[10px] font-bold text-dash-muted uppercase tracking-widest">Taxonomy</TableHead>
                <TableHead className="px-6 py-4 text-left text-[10px] font-bold text-dash-muted uppercase tracking-widest">Review State</TableHead>
                <TableHead className="px-6 py-4 text-left text-[10px] font-bold text-dash-muted uppercase tracking-widest">Files</TableHead>
                <TableHead className="px-6 py-4 text-left text-[10px] font-bold text-dash-muted uppercase tracking-widest">Digital Signage</TableHead>
                <TableHead className="px-6 py-4 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-dash-border">
              <AnimatePresence>
                {cases.map((caseItem, idx) => (
                  <TableRow
                    key={caseItem._id}
                    className="border-b border-dash-border hover:bg-dash-hover/40 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/investigator/cases/${caseItem.caseId}`}
                  >
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <p className="font-bold text-dash-text group-hover:text-dash-accent transition-colors">
                          {caseItem.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(caseItem.caseId);
                            toast({ title: "Copied", description: "Case ID copied to clipboard." });
                          }}
                          className="text-[10px] text-dash-muted hover:text-dash-accent font-mono mt-0.5 tracking-tighter flex items-center gap-1 bg-dash-input hover:bg-dash-hover px-1.5 py-0.5 rounded border border-dash-border transition-colors w-fit"
                          title="Copy Case ID"
                        >
                          <span>ID: {caseItem.caseId.slice(0, 8)}...</span>
                          <Copy size={8} />
                        </button>
                        {caseItem.tags && caseItem.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {caseItem.tags.map((tag) => (
                              <span key={tag} className="text-[9px] font-bold uppercase tracking-widest bg-dash-input text-dash-muted px-1.5 py-0.5 rounded border border-dash-border">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <span className="text-[10px] font-bold text-dash-muted uppercase tracking-tight">
                        {INCIDENT_TYPE_LABELS[caseItem.incidentType] ?? "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <CaseStatusBadge status={caseItem.status} />
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <span className="text-[10px] font-bold text-dash-muted bg-dash-card border border-dash-border px-2 py-0.5 rounded italic">
                        {caseItem.files.length} ITEMS
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-dash-muted tracking-tight">{formatDate(caseItem.createdAt)}</p>
                        <p className="text-[9px] text-dash-muted/70 font-medium uppercase tracking-tighter">
                          Incident: {formatDate(caseItem.incidentDate)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/verify/${caseItem.caseId}`}
                          target="_blank"
                          className="text-[10px] font-bold uppercase tracking-widest text-[var(--dash-accent)] hover:text-[var(--dash-accent)]/80 transition-colors border border-[var(--dash-accent)]/20 bg-[var(--dash-accent)]/5 px-3 py-1.5 rounded-lg hover:bg-[var(--dash-accent)]/10"
                        >
                          Verify ↗
                        </Link>
                        <Link
                          href={`/investigator/cases/${caseItem.caseId}`}
                          className="text-[10px] font-bold uppercase tracking-widest text-dash-muted hover:text-dash-text transition-colors border border-dash-border bg-dash-input px-4 py-1.5 rounded-lg"
                        >
                          Inspect →
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </motion.div>
      )}
    </div>
  );
}

