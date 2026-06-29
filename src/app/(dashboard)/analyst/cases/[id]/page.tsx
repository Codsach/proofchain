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
import { CustodyTimeline, TimelineNode } from "@/components/CustodyTimeline";
import { CommentsPanel } from "@/components/CommentsPanel";
import { TamperScoreBadge } from "@/components/TamperScoreBadge";
import { ShieldAlert, ShieldCheck, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

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

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  role: string;
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
  investigatorId: UserProfile | null;
  currentCustodian: UserProfile;
  onChainTxHash: string | null;
  overallTamperScore: number | null;
  overallRiskLevel: "low" | "medium" | "high" | null;
}

interface Verdict {
  _id: string;
  verdict: "verified" | "rejected";
  reason: string;
  analystId: string;
  issuedAt: string;
  onChainTxHash: string | null;
}

interface TransferEntry {
  _id: string;
  fromUserId: UserProfile;
  toUserId: UserProfile;
  reason: string;
  transferredAt: string;
  onChainTxHash: string | null;
}

interface AiReport {
  fileId: string;
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
  const [aiReports, setAiReports] = useState<AiReport[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [transfers, setTransfers] = useState<TransferEntry[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState(true);
  const [isLoadingAi, setIsLoadingAi] = useState(true);
  const [isLoadingVerdict, setIsLoadingVerdict] = useState(true);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [isSubmittingVerdict, setIsSubmittingVerdict] = useState(false);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);

  useEffect(() => {
    getToken().then(setToken);
  }, [getToken]);

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

  // Load AI reports
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/cases/${caseId}/ai-all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 202) {
          // Still running — poll after 5 seconds
          setTimeout(load, 5000);
          return;
        }
        if (res.ok) setAiReports(await res.json());
      } catch {
        // Non-fatal
      } finally {
        setIsLoadingAi(false);
      }
    };
    load();
  }, [caseId, getToken]);

  // Load Verdict
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/cases/${caseId}/verdict`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setVerdict(await res.json());
      } catch {
      } finally {
        setIsLoadingVerdict(false);
      }
    };
    load();
  }, [caseId, getToken]);

  // Load Transfers
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/cases/${caseId}/transfer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTransfers(data.transfers ?? []);
        }
      } catch {
      } finally {
        setIsLoadingTransfers(false);
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
        <Skeleton className="h-10 w-64 bg-dash-hover rounded-lg" />
        <Skeleton className="h-96 w-full bg-dash-hover rounded-2xl" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="rounded-3xl border border-dash-border bg-dash-card p-24 text-center backdrop-blur-2xl">
        <p className="text-dash-muted text-sm font-medium">Authentication required: Subject not accessible.</p>
        <Link href="/analyst" className="text-dash-accent text-[10px] font-bold uppercase tracking-widest hover:text-dash-accent mt-4 block transition-colors">
          ← Back to Queue
        </Link>
      </div>
    );
  }

  const timelineNodes: TimelineNode[] = [];
  if (caseData) {
    // 1. Initial Upload event
    timelineNodes.push({
      id: "upload-" + caseData.caseId,
      type: "upload",
      title: "Evidence Uploaded & Sealed",
      subtitle: caseData.files.map((f) => f.originalName).join(", "),
      description: "Evidence files originally registered and anchored to blockchain.",
      timestamp: caseData.createdAt,
      txHash: caseData.onChainTxHash,
      actorName: caseData.investigatorId?.fullName || "Investigator (Anonymized)",
      actorRole: "investigator",
      isActive: transfers.length === 0 && !verdict,
    });

    // 2. Transfer events
    transfers.forEach((t, index) => {
      const isLastTransfer = index === transfers.length - 1;
      timelineNodes.push({
        id: t._id,
        type: "transfer",
        title: "Custody Hand-off",
        subtitle: `${t.fromUserId?.fullName || "Custodian"} ➔ ${t.toUserId?.fullName || "Custodian"}`,
        description: t.reason,
        timestamp: t.transferredAt,
        txHash: t.onChainTxHash,
        actorName: t.fromUserId?.fullName,
        actorRole: t.fromUserId?.role,
        recipientName: t.toUserId?.fullName,
        recipientRole: t.toUserId?.role,
        isActive: isLastTransfer && !verdict,
      });
    });

    // 3. Verdict event
    if (verdict) {
      timelineNodes.push({
        id: verdict._id,
        type: "verdict",
        title: `Forensic Verdict: ${verdict.verdict.toUpperCase()}`,
        subtitle: `Analyzed and sealed by Verification Protocol`,
        description: verdict.reason,
        timestamp: verdict.issuedAt,
        txHash: verdict.onChainTxHash,
        verdictType: verdict.verdict,
        isActive: true,
      });
    }
  }

  return (
    <div className="space-y-10 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <Link href="/analyst" className="text-[10px] font-bold uppercase tracking-widest text-dash-muted hover:text-dash-accent transition-colors flex items-center gap-2 mb-4">
            <span className="text-lg">←</span> Authentication Queue
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="font-heading font-bold tracking-wider text-dash-text uppercase headline-lg">{caseData.title}</h1>
            <CaseStatusBadge status={caseData.status} />
          </div>
          <p className="text-[10px] text-dash-muted/60 font-mono mt-2 tracking-widest">
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
          {caseData.status === "verified" && token && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={`/api/cases/${caseData.caseId}/certificate?token=${token}`}
              download
              className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors text-xs font-bold uppercase tracking-wider h-11"
            >
              ↓ Download Forensic Certificate
            </motion.a>
          )}
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
            className="rounded-2xl border border-dash-border bg-dash-card backdrop-blur-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className="text-[10px] font-bold text-dash-accent/20 uppercase tracking-[0.3em] group-hover:text-dash-accent transition-colors">Target Spec</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Category</p>
                    <p className="text-dash-text font-medium">{INCIDENT_LABELS[caseData.incidentType] ?? caseData.incidentType}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Temporal Log</p>
                    <p className="text-dash-text font-medium">{new Date(caseData.incidentDate).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="pt-4 border-t border-dash-border space-y-2">
              <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Forensic Narrative</p>
              <p className="text-sm text-dash-muted leading-relaxed font-normal">
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
              <h2 className="text-sm font-bold text-dash-text uppercase tracking-[0.2em]">Enclosed Evidence</h2>
              <div className="h-px flex-1 bg-dash-border" />
              <span className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">{caseData.files.length} Modules</span>
            </div>
            
            <div className="space-y-4">
              {caseData.files.map((file, idx) => (
                <motion.div
                  key={file.fileId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  className="rounded-2xl border border-dash-border bg-dash-card hover:bg-dash-hover transition-all p-5 space-y-4 group/file"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-dash-text truncate group-hover/file:text-dash-accent transition-colors uppercase tracking-tight">
                        {file.originalName}
                      </p>
                      <p className="text-[10px] text-dash-muted font-bold uppercase tracking-widest mt-0.5">
                        {file.mimeType} · {formatFileSize(file.sizeBytes)}
                      </p>
                    </div>
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={getIpfsGatewayUrl(file.ipfsCid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-widest text-dash-accent/80 bg-emerald-500/5 border border-dash-accent/20 px-4 py-1.5 rounded-lg transition-colors hover:bg-dash-accent/10"
                    >
                      Gateway
                    </motion.a>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-dash-muted uppercase tracking-widest">SHA-256 Fingerprint</p>
                    <p className="text-[10px] font-mono text-dash-accent/80 dark:text-dash-accent/40 break-all bg-dash-input rounded-xl px-4 py-2 border border-dash-border">
                      {file.sha256Hash}
                    </p>
                  </div>
                  {file.gpsLat && file.gpsLng && (
                    <p className="text-[9px] font-bold text-dash-muted/80 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                      Spatial: {file.gpsLat.toFixed(5)}, {file.gpsLng.toFixed(5)}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <CommentsPanel caseId={caseId} />
        </div>

        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-dash-text uppercase tracking-[0.2em]">Neural Intelligence</h2>
            <div className="h-px flex-1 bg-dash-border" />
          </div>

          {/* Overall Risk Card */}
          <div className={`rounded-2xl border p-5 relative overflow-hidden group shadow-lg transition-all duration-300 ${
            caseData.overallRiskLevel === "high"
              ? "bg-red-500/5 border-red-500/20"
              : caseData.overallRiskLevel === "medium"
              ? "bg-amber-500/5 border-amber-500/20"
              : caseData.overallRiskLevel === "low"
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-dash-input border-dash-border animate-pulse"
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-dash-muted uppercase tracking-widest">
                  Overall Risk Assessment
                </p>
                <h3 className="text-base font-bold text-dash-text tracking-tight">
                  {caseData.overallRiskLevel ? (
                    <span className="uppercase">{caseData.overallRiskLevel} RISK</span>
                  ) : (
                    <span>PENDING SCAN</span>
                  )}
                </h3>
                <p className="text-[11px] text-dash-muted leading-relaxed font-normal">
                  {caseData.overallRiskLevel === "high"
                    ? "High probability of image/metadata manipulation detected. Exercise extreme caution."
                    : caseData.overallRiskLevel === "medium"
                    ? "Potential anomalies detected in image metadata or structure. Further review suggested."
                    : caseData.overallRiskLevel === "low"
                    ? "All assets verified with low tamper indicators. Digital signature authentic."
                    : "Forensic scanner is conducting deep neural scan on uploaded assets..."}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-center justify-center p-3 rounded-xl bg-dash-bg border border-dash-border min-w-[70px]">
                <span className="text-[8px] font-bold text-dash-muted uppercase tracking-wider mb-0.5">SCORE</span>
                <span className={`text-lg font-extrabold ${
                  caseData.overallRiskLevel === "high"
                    ? "text-red-400"
                    : caseData.overallRiskLevel === "medium"
                    ? "text-amber-400"
                    : caseData.overallRiskLevel === "low"
                    ? "text-emerald-400"
                    : "text-dash-muted"
                }`}>
                  {caseData.overallTamperScore !== null ? `${caseData.overallTamperScore}/100` : "--"}
                </span>
              </div>
            </div>
          </div>

          {/* Accordion of reports per file */}
          <div className="space-y-3">
            {caseData.files.map((file) => {
              const report = aiReports.find((r) => r.fileId === file.fileId);
              const isOpen = expandedFileId === file.fileId;
              return (
                <div
                  key={file.fileId}
                  className="rounded-xl border border-dash-border bg-dash-card/30 overflow-hidden transition-all duration-300"
                >
                  {/* Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedFileId(isOpen ? null : file.fileId)}
                    className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-dash-hover/40 transition-colors cursor-pointer focus:outline-none"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-dash-text truncate uppercase tracking-tight">
                        {file.originalName}
                      </p>
                      <p className="text-[9px] text-dash-muted font-bold uppercase tracking-widest mt-0.5">
                        {file.mimeType}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {report ? (
                        <TamperScoreBadge score={report.tamperScore} />
                      ) : isLoadingAi ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] text-dash-muted animate-pulse uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Scanning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] text-dash-muted uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-dash-border" />
                          Pending
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-dash-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-dash-muted" />
                      )}
                    </div>
                  </button>

                  {/* Body */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="border-t border-dash-border p-4 bg-dash-input/50">
                          {report ? (
                            <AiReportPanel report={report} isLoading={false} />
                          ) : (
                            <AiReportPanel report={null} isLoading={true} />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          
          {!isLoadingTransfers && !isLoadingCase && (
            <CustodyTimeline nodes={timelineNodes} />
          )}
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
