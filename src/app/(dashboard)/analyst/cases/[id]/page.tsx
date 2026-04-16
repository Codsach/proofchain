"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { AiReportPanel } from "@/components/AiReportPanel";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { VerdictDialog } from "@/components/VerdictDialog";
import { VerifyHashButton } from "@/components/VerifyHashButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getIpfsGatewayUrl } from "@/lib/ipfs-gateway";

interface FileRecord {
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  ipfsCid: string;
  gpsLat: number | null;
  gpsLng: number | null;
}

interface CaseDetail {
  caseId: string;
  title: string;
  description: string;
  incidentDate: string;
  incidentType: string;
  status: string;
  files: FileRecord[];
  createdAt: string;
  onChainTxHash: string | null;
}

interface AiReport {
  tamperScore: number;
  riskLevel: string;
  plainNotesSummary: string;
  exifData: {
    software: string | null;
    gps_present: boolean;
    creation_timestamp: string | null;
    modification_timestamp: string | null;
    device: string | null;
    flags: string[];
  };
  geminiResult: {
    manipulation_likelihood: string;
    findings: string[];
    confidence: string;
  };
  scoreBreakdown: Record<string, { points: number; detail: string }>;
  analysedAt: string;
  status: string;
}

const INCIDENT_LABELS: Record<string, string> = {
  data_breach: "Data Breach",
  insider_threat: "Insider Threat",
  malware: "Malware",
  phishing: "Phishing",
  other: "Other",
};

export default function AnalystCaseReviewPage() {
  const { id: caseId } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState(true);
  const [isLoadingAi, setIsLoadingAi] = useState(true);
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [isSubmittingVerdict, setIsSubmittingVerdict] = useState(false);

  const canVerdict =
    caseData &&
    ["pending_review", "ai_timeout", "under_review"].includes(caseData.status);

  // Load case
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/cases/${caseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Case not found");
        setCaseData(await res.json());
      } catch {
        toast({ title: "Error", description: "Could not load case", variant: "destructive" });
      } finally {
        setIsLoadingCase(false);
      }
    };
    load();
  }, [caseId, getToken, toast]);

  // Load AI report
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/cases/${caseId}/ai`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 202) {
          // Still running — poll after 5 seconds
          setTimeout(load, 5000);
          return;
        }
        if (res.ok) setAiReport(await res.json());
      } catch {
        // Non-fatal — AI report may not exist yet
      } finally {
        setIsLoadingAi(false);
      }
    };
    load();
  }, [caseId, getToken]);

  const handleVerdict = async (verdict: string, reason: string) => {
    setIsSubmittingVerdict(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/cases/${caseId}/verdict`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ verdict, reason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue verdict");

      toast({
        title: "Verdict issued",
        description: `Case marked as ${verdict.toUpperCase()}`,
      });
      setVerdictOpen(false);
      router.push("/analyst");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to issue verdict";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSubmittingVerdict(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoadingCase) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-10 w-64 bg-white/[0.03] rounded-lg" />
        <Skeleton className="h-96 w-full bg-white/[0.03] rounded-2xl" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-24 text-center backdrop-blur-2xl">
        <p className="text-white/30 text-sm font-medium">Authentication required: Subject not accessible.</p>
        <Link href="/analyst" className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest hover:text-emerald-400 mt-4 block transition-colors">
          ← Back to Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <Link href="/analyst" className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-emerald-500 transition-colors flex items-center gap-2 mb-4">
            <span className="text-lg">←</span> Authentication Queue
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">{caseData.title}</h1>
            <CaseStatusBadge status={caseData.status} />
          </div>
          <p className="text-[10px] text-white/20 font-mono mt-2 tracking-widest">
            TARGET_ID::{caseData.caseId}
          </p>
        </div>

        <div className="flex gap-4">
          <AnimatePresence>
            {caseData.onChainTxHash && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <VerifyHashButton caseId={caseData.caseId} />
              </motion.div>
            )}
          </AnimatePresence>
          {canVerdict && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => setVerdictOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-11 px-8 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                Issue Verdict
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className="text-[10px] font-bold text-emerald-500/20 uppercase tracking-[0.3em] group-hover:text-emerald-500 transition-colors">Target Spec</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Category</p>
                    <p className="text-white font-medium">{INCIDENT_LABELS[caseData.incidentType] ?? caseData.incidentType}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Temporal Log</p>
                    <p className="text-white font-medium">{new Date(caseData.incidentDate).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Forensic Narrative</p>
              <p className="text-sm text-white/70 leading-relaxed font-normal">
                {caseData.description}
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Enclosed Evidence</h2>
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{caseData.files.length} Modules</span>
            </div>
            
            <div className="space-y-4">
              {caseData.files.map((file, idx) => (
                <motion.div
                  key={file.fileId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  className="rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all p-5 space-y-4 group/file"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate group-hover/file:text-emerald-400 transition-colors uppercase tracking-tight">
                        {file.originalName}
                      </p>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
                        {file.mimeType} · {formatFileSize(file.sizeBytes)}
                      </p>
                    </div>
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={getIpfsGatewayUrl(file.ipfsCid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80 bg-emerald-500/5 border border-emerald-500/20 px-4 py-1.5 rounded-lg transition-colors hover:bg-emerald-500/10"
                    >
                      Gateway
                    </motion.a>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">SHA-256 Fingerprint</p>
                    <p className="text-[10px] font-mono text-emerald-500/40 break-all bg-black/40 rounded-xl px-4 py-2 border border-white/5">
                      {file.sha256Hash}
                    </p>
                  </div>
                  {file.gpsLat && file.gpsLng && (
                    <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-emerald-500/30" />
                      Spatial: {file.gpsLat.toFixed(5)}, {file.gpsLng.toFixed(5)}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Neural Intelligence</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <AiReportPanel report={aiReport} isLoading={isLoadingAi} />
        </motion.div>
      </div>

      <VerdictDialog
        open={verdictOpen}
        onClose={() => setVerdictOpen(false)}
        onSubmit={handleVerdict}
        isLoading={isSubmittingVerdict}
      />
    </div>
  );
}
