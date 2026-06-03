"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Brain, Shield, FolderOpen } from "lucide-react";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InvestigatorCharts } from "@/components/investigator/InvestigatorCharts";
type InvestigatorCase = {
  _id: string;
  caseId: string;
  title: string;
  incidentType: string;
  status: string;
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
  const [cases, setCases] = useState<InvestigatorCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const res = await fetch("/api/cases", {
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
  }, [user, getToken]);

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
            <div className="h-px w-8 bg-emerald-500/50" />
            <p className="text-[10px] font-bold text-dash-accent uppercase tracking-[0.3em]">Operative Field Dashboard</p>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Case Modules</h1>
          <p className="mt-2 text-dash-muted font-medium max-w-lg">
            Monitor evidence submission queues, cryptographic review status, and real-time chain of custody integrity.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            asChild
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-12 px-8 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Link href="/investigator/submit">+ Deploy Evidence</Link>
          </Button>
        </motion.div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { label: "Assigned Cases", value: cases.length, desc: "Total subjects in registry", icon: <Folder className="w-6 h-6 text-dash-muted group-hover:text-dash-accent transition-colors" /> },
          { label: "Pending Analysis", value: openCases, desc: "Active neural review", icon: <Brain className="w-6 h-6 text-dash-muted group-hover:text-dash-accent transition-colors" /> },
          { label: "Evidence Integrity", value: totalFiles, desc: "Validated artifacts", icon: <Shield className="w-6 h-6 text-dash-muted group-hover:text-dash-accent transition-colors" /> },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-2xl border border-dash-border bg-dash-card backdrop-blur-xl p-6 shadow-2xl group hover:border-dash-accent/20 transition-all hover:bg-dash-hover"
          >
            <div className="flex justify-between items-start mb-4">
              {stat.icon}
              <p className="text-[10px] font-bold text-dash-accent/40 uppercase tracking-widest">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-tight group-hover:text-dash-muted transition-colors italic">{stat.desc}</p>
          </motion.div>
        ))}
      </div>

      {!isLoadingCases && !error && <InvestigatorCharts cases={cases} />}

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
        <div className="rounded-3xl border border-dash-border bg-dash-sidebar p-20 text-center backdrop-blur-2xl shadow-2xl">
          <div className="w-16 h-16 bg-dash-border rounded-full flex items-center justify-center mx-auto mb-6 border border-dash-border">
            <FolderOpen className="w-8 h-8 text-dash-muted" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Registry Empty</h2>
          <p className="text-white/30 mb-8 max-w-xs mx-auto text-sm font-medium">No forensic records detected. Deploy your first evidence package to begin tracking.</p>
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
          className="rounded-2xl border border-dash-border bg-dash-sidebar backdrop-blur-xl overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-dash-border bg-dash-card flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Operational Stream</h2>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1 italic">Sorted by temporal priority</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border bg-dash-sidebar">
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/20 uppercase tracking-widest">Target Subject</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/20 uppercase tracking-widest">Taxonomy</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/20 uppercase tracking-widest">Review State</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/20 uppercase tracking-widest">Files</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/20 uppercase tracking-widest">Digital Signage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                  {cases.map((caseItem, idx) => (
                    <motion.tr 
                      key={caseItem._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.03 }}
                      className="hover:bg-dash-accent/[0.02] transition-colors group cursor-pointer"
                      onClick={() => window.location.href = `/investigator/cases/${caseItem.caseId}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <p className="font-bold text-white group-hover:text-dash-accent transition-colors">
                            {caseItem.title}
                          </p>
                          <p className="text-[10px] text-white/20 font-mono tracking-tighter mt-0.5">
                            ID::{caseItem.caseId.slice(0, 16)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-dash-muted uppercase tracking-tight">
                        {INCIDENT_TYPE_LABELS[caseItem.incidentType] ?? "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <CaseStatusBadge status={caseItem.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-dash-muted bg-dash-border border border-dash-border px-2 py-0.5 rounded italic">
                          {caseItem.files.length} ITEMS
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <p className="text-[10px] font-bold text-white/50 tracking-tight">{formatDate(caseItem.createdAt)}</p>
                          <p className="text-[9px] text-white/20 font-medium uppercase tracking-tighter">
                            Incident: {formatDate(caseItem.incidentDate)}
                          </p>
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

