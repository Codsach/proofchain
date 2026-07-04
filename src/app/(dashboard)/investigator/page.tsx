"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Brain, Shield, FolderOpen, Copy, Clock, Cpu, Database } from "lucide-react";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InvestigatorCharts } from "@/components/investigator/InvestigatorCharts";
import { StatCard } from "@/components/ui/StatCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

const STAT_VARIANTS = {
  blue: {
    circleColors: [
      "bg-cyan-500",
      "bg-blue-600",
      "bg-indigo-600",
      "bg-purple-600",
      "bg-teal-400",
      "bg-sky-500"
    ],
    badgeColor: "bg-blue-500/15 text-blue-900 border border-blue-500/30",
    iconBg: "bg-blue-600/15 text-blue-800 border border-blue-500/25",
    trendText: "+5.4%",
    trendUp: true,
    icon: Folder,
    sparkline: (
      <svg className="w-16 h-8 text-blue-800" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <motion.path 
          d="M5,22 Q20,10 45,20 T80,8 T95,12" 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
    )
  },
  purple: {
    circleColors: [
      "bg-pink-500",
      "bg-purple-600",
      "bg-fuchsia-500",
      "bg-violet-600",
      "bg-indigo-600",
      "bg-blue-500"
    ],
    badgeColor: "bg-purple-500/15 text-purple-900 border border-purple-500/30",
    iconBg: "bg-purple-600/15 text-purple-800 border border-purple-500/25",
    trendText: "+8.2%",
    trendUp: true,
    icon: Brain,
    sparkline: (
      <svg className="w-16 h-8 text-purple-800" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <motion.path 
          d="M5,8 Q30,5 55,22 T95,15" 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
    )
  },
  green: {
    circleColors: [
      "bg-emerald-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-green-600",
      "bg-lime-400",
      "bg-yellow-400"
    ],
    badgeColor: "bg-emerald-500/15 text-emerald-900 border border-emerald-500/30",
    iconBg: "bg-emerald-600/15 text-emerald-800 border border-emerald-500/25",
    trendText: "+14.1%",
    trendUp: true,
    icon: Shield,
    sparkline: (
      <svg className="w-16 h-8 text-emerald-800" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <motion.path 
          d="M5,15 Q30,12 60,18 T95,10" 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
    )
  },
  orange: {
    circleColors: [
      "bg-orange-500",
      "bg-rose-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-amber-500",
      "bg-pink-500"
    ],
    badgeColor: "bg-orange-500/15 text-orange-900 border border-orange-500/30",
    iconBg: "bg-orange-600/15 text-orange-800 border border-orange-500/25",
    trendText: "+12.4%",
    trendUp: true,
    icon: FolderOpen,
    sparkline: (
      <svg className="w-16 h-8 text-orange-800" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <motion.path 
          d="M5,12 Q25,25 50,5 T95,18" 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
    )
  },
  amber: {
    circleColors: [
      "bg-yellow-400",
      "bg-amber-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-rose-500",
      "bg-amber-600"
    ],
    badgeColor: "bg-amber-500/15 text-amber-900 border border-amber-500/30",
    iconBg: "bg-amber-605/15 text-amber-900 border border-amber-500/25",
    trendText: "-3.5%",
    trendUp: false,
    icon: Clock,
    sparkline: (
      <svg className="w-16 h-8 text-amber-800" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <motion.path 
          d="M5,20 Q35,8 60,25 T95,12" 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
    )
  },
  cyan: {
    circleColors: [
      "bg-cyan-400",
      "bg-teal-500",
      "bg-sky-400",
      "bg-blue-600",
      "bg-emerald-400",
      "bg-cyan-600"
    ],
    badgeColor: "bg-cyan-500/15 text-cyan-900 border border-cyan-500/30",
    iconBg: "bg-cyan-600/15 text-cyan-800 border border-cyan-500/25",
    trendText: "+22.7%",
    trendUp: true,
    icon: Cpu,
    sparkline: (
      <svg className="w-16 h-8 text-cyan-800" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <motion.path 
          d="M5,10 Q20,22 55,8 T95,15" 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
    )
  }
} as const;

// Variation 5: Multi-point gradient mesh (applied permanently)
const Variation5 = () => {
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
    <div className="relative min-h-[calc(100vh-8rem)] -m-4 sm:-m-6 lg:-m-8 flex flex-col overflow-hidden">
      {/* Background mesh gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Variation5 />
      </div>

      {/* Main Content Pane */}
      <div className="relative z-10 flex-1 flex flex-col gap-10 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-slate-400/50" />
            <p className="text-[10px] font-bold text-dash-accent uppercase tracking-[0.3em]">Operative Field Dashboard</p>
          </div>
          <h1 className="font-heading font-bold tracking-wider text-dash-text uppercase headline-lg">Case Modules</h1>
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
            description: "Assigned to your profile",
            variantKey: "blue" as const,
            metaText: "Active",
          },
          {
            label: "Pending Analysis",
            value: openCases,
            description: "Awaiting consensus review",
            variantKey: "purple" as const,
            metaText: "Awaiting Review",
          },
          {
            label: "Evidence Integrity",
            value: totalFiles,
            description: "On-chain evidence files",
            variantKey: "green" as const,
            metaText: "Verified",
          },
        ].map((stat, idx) => {
          const variant = STAT_VARIANTS[stat.variantKey];
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="h-full w-full"
            >
              <StatCard
                label={stat.label}
                value={stat.value}
                description={stat.description}
                variantKey={stat.variantKey}
                icon={variant.icon}
                metaText={stat.metaText}
                isLoading={isLoadingCases}
              />
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
    </div>
  );
}

