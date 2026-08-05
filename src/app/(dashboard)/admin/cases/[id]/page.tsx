"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { AiReportPanel } from "@/components/AiReportPanel";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { VerifyHashButton } from "@/components/VerifyHashButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import { CustodyTimeline, TimelineNode } from "@/components/CustodyTimeline";
import { CaseChatWidget } from "@/components/CaseChatWidget";
import { TamperScoreBadge } from "@/components/TamperScoreBadge";
import { ShieldAlert, ShieldCheck, HelpCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

const EvidenceMap = dynamic(() => import("@/components/evidence/EvidenceMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-2xl bg-dash-hover mt-4" />
});

interface FileRecord {
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  ipfsCid: string;
  gpsLat: number | null;
  gpsLng: number | null;
  gpsAccuracy?: number | null;
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

const INCIDENT_LABELS: Record<string, string> = {
  data_breach: "Data Breach",
  insider_threat: "Insider Threat",
  malware: "Malware",
  phishing: "Phishing",
  other: "Other",
};

const InspectionBackground = () => {
  return (
    <div className="absolute inset-0 h-full w-full bg-transparent">
      {/* Top Left: Teal */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_20%_30%,#99f6e4_0%,transparent_40%)]" />
      {/* Top Right: Blue */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_80%_20%,#bfdbfe_0%,transparent_40%)]" />
      {/* Bottom Center: Teal */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_50%_80%,#99f6e4_0%,transparent_40%)]" />
      {/* Bottom Right: Blue */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_90%_90%,#bfdbfe_0%,transparent_40%)]" />
    </div>
  );
};


export default function AdminCaseDetailPage() {
  const { id: caseId } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [aiReports, setAiReports] = useState<AiReport[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [transfers, setTransfers] = useState<TransferEntry[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState(true);
  const [isLoadingAi, setIsLoadingAi] = useState(true);
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [aiTrigger, setAiTrigger] = useState(0);

  const handleRescanAll = async () => {
    try {
      setIsScanningAll(true);
      const token = await getToken();
      const res = await fetch(`/api/cases/${caseId}/rescan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to trigger rescan");
      }

      toast({
        title: "AI Scan Queued",
        description: "AI analysis has been triggered for all files. Please wait.",
      });

      setIsLoadingAi(true);
      setAiTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Could not trigger AI scan";
      toast({
        title: "Scan Failed",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsScanningAll(false);
    }
  };
  const [isLoadingVerdict, setIsLoadingVerdict] = useState(true);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  useEffect(() => {
    getToken().then(setToken);
  }, [getToken]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/cases/${caseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Not found");
        setCaseData(await res.json());
      } catch {
        toast({ title: "Error", description: "Could not load case", variant: "destructive" });
      } finally {
        setIsLoadingCase(false);
      }
    };
    load();
  }, [caseId, getToken, toast]);

  useEffect(() => {
    let wasScanning = false;
    const load = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/cases/${caseId}/ai-all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 202) {
          wasScanning = true;
          setTimeout(load, 5000);
          return;
        }
        if (res.ok) {
          setAiReports(await res.json());
          if (wasScanning) {
            // Refresh case details to update status badges
            const caseRes = await fetch(`/api/cases/${caseId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (caseRes.ok) {
              setCaseData(await caseRes.json());
            }
            toast({
              title: "AI Scan Completed",
              description: "AI scan completed for this case",
            });
          }
        }
      } catch {
      } finally {
        setIsLoadingAi(false);
      }
    };
    load();
  }, [caseId, getToken, toast, aiTrigger]);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoadingCase) {
    return (
      <div className="flex justify-center w-full">
        <div className="space-y-6 w-full">
          <Skeleton className="h-8 w-48 bg-dash-hover" />
          <Skeleton className="h-96 w-full rounded-2xl bg-dash-hover" />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex justify-center items-center w-full py-20">
        <div className="rounded-3xl border border-dash-border bg-dash-sidebar p-20 text-center">
          <p className="text-dash-muted text-sm font-medium">Case subject not found in secure storage.</p>
          <Link href="/admin/cases" className="text-dash-accent text-xs font-bold uppercase tracking-widest hover:text-dash-accent mt-4 block transition-colors">
            ← Return to Archives
          </Link>
        </div>
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
      actorName: caseData.investigatorId?.fullName || "Investigator",
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
    <div className="w-full space-y-6 pb-10 overflow-x-hidden">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <Link href="/admin/cases" className="text-[10px] font-bold uppercase tracking-widest text-dash-muted hover:text-dash-accent transition-colors flex items-center gap-2">
            <span className="text-lg">←</span> Forensic Archives
          </Link>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <h1 className="type-display-xl">{caseData.title}</h1>
            <CaseStatusBadge status={caseData.status} />
          </div>
          <p className="type-technical text-dash-muted mt-2 tracking-widest uppercase">
            ACCESS_TOKEN::{caseData.caseId}
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
              className="flex items-center gap-2 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors text-xs font-bold uppercase tracking-wider h-11"
            >
              ↓ Download Forensic Certificate
            </motion.a>
          )}
        </div>
      </motion.div>

      {/* ── Row 1: Case Info + Overall Risk ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Details — 2/3 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 rounded-2xl border border-dash-border bg-dash-card p-6 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4">
            <div className="text-[10px] font-bold text-dash-accent/20 uppercase tracking-[0.3em] group-hover:text-dash-accent transition-colors cursor-default">Subject Details</div>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm pt-2">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Incident Category</p>
              <p className="text-dash-text font-medium">{INCIDENT_LABELS[caseData.incidentType] ?? caseData.incidentType}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Temporal Log</p>
              <p className="text-dash-text font-medium">{new Date(caseData.incidentDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Description</p>
            <p className="text-sm text-dash-text/80 leading-relaxed font-normal">{caseData.description}</p>
          </div>
        </motion.div>

        {/* Overall Risk Score — 1/3 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl border p-6 flex flex-col justify-between gap-5 shadow-sm relative overflow-hidden group ${
            caseData.overallRiskLevel === "high"
              ? "bg-red-500/5 border-red-500/20"
              : caseData.overallRiskLevel === "medium"
              ? "bg-amber-500/5 border-amber-500/20"
              : caseData.overallRiskLevel === "low"
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-dash-card border-dash-border animate-pulse"
          }`}
        >
          <div>
            <p className="text-[9px] font-bold text-dash-muted uppercase tracking-widest mb-2">Overall Risk Assessment</p>
            <h3 className="text-base font-bold text-dash-text tracking-tight leading-snug">
              {caseData.overallRiskLevel ? (
                <span className="uppercase">{caseData.overallRiskLevel} Risk Detected</span>
              ) : (
                <span>Awaiting Scan</span>
              )}
            </h3>
            <p className="text-[11px] text-dash-muted leading-relaxed font-normal mt-2">
              {caseData.overallRiskLevel === "high"
                ? "High probability of manipulation detected. Exercise extreme caution."
                : caseData.overallRiskLevel === "medium"
                ? "Potential anomalies detected. Further review suggested."
                : caseData.overallRiskLevel === "low"
                ? "All assets verified with low tamper indicators."
                : "Forensic scanner conducting deep neural analysis..."}
            </p>
          </div>

          {/* Score ring */}
          <div className="flex items-end justify-between">
            <div className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-dash-bg border min-w-[90px] ${
              caseData.overallRiskLevel === "high"
                ? "border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                : caseData.overallRiskLevel === "medium"
                ? "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                : caseData.overallRiskLevel === "low"
                ? "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                : "border-dash-border"
            }`}>
              <span className="text-[8px] font-bold text-dash-muted uppercase tracking-wider mb-1">SCORE</span>
              <span className={`text-3xl font-extrabold leading-none tracking-tight ${
                caseData.overallRiskLevel === "high"
                  ? "text-red-400"
                  : caseData.overallRiskLevel === "medium"
                  ? "text-amber-400"
                  : caseData.overallRiskLevel === "low"
                  ? "text-emerald-400"
                  : "text-dash-muted"
              }`}>
                {caseData.overallTamperScore !== null ? caseData.overallTamperScore : "--"}
              </span>
              <span className="text-[8px] text-dash-muted/60 font-mono mt-1">/ 100</span>
            </div>

            {/* Risk icon */}
            <div className="opacity-10 group-hover:opacity-20 transition-opacity">
              {caseData.overallRiskLevel === "high" ? (
                <ShieldAlert className="w-16 h-16 text-red-400" />
              ) : caseData.overallRiskLevel === "low" ? (
                <ShieldCheck className="w-16 h-16 text-emerald-400" />
              ) : (
                <HelpCircle className="w-16 h-16 text-amber-400" />
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Row 2: Evidence Files (full-width) ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-dash-border bg-dash-card p-6 space-y-6 shadow-sm relative overflow-hidden group"
      >
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-dash-text uppercase tracking-[0.2em]">Enclosed Evidence</h2>
          <div className="h-px flex-1 bg-dash-border" />
          <span className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">{caseData.files.length} Modules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
          {caseData.files.map((file, idx) => (
            <motion.div
              key={file.fileId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              className="rounded-2xl bg-dash-bg border border-dash-border hover:border-emerald-500/20 p-5 space-y-3 transition-all group/file hover:shadow-[0_0_20px_rgba(16,185,129,0.05)]"
            >
              {/* File header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-dash-text truncate group-hover/file:text-dash-accent transition-colors uppercase tracking-tight">{file.originalName}</p>
                  <p className="text-[10px] text-dash-muted font-bold uppercase tracking-widest mt-1">{file.mimeType} · {formatFileSize(file.sizeBytes)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewFileId(previewFileId === file.fileId ? null : file.fileId)}
                    className="text-[9px] font-bold uppercase tracking-widest text-dash-text bg-dash-input border border-dash-border hover:bg-dash-hover px-2.5 py-1 rounded transition-colors flex items-center gap-1"
                  >
                    <span>Preview</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${previewFileId === file.fileId ? "rotate-180" : ""}`} />
                  </button>
                  <a
                    href={`https://${file.ipfsCid}.ipfs.w3s.link/${encodeURIComponent(file.originalName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-dash-accent/60 hover:text-dash-accent transition-colors border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 rounded"
                  >
                    Gateway
                  </a>
                </div>
              </div>

              {/* GPS Capture Info */}
              {file.gpsLat !== null && file.gpsLng !== null ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-2">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" className="shrink-0">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  </svg>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest shrink-0">GPS Captured</span>
                    <span className="text-[10px] font-mono text-emerald-300/80 truncate">
                      {file.gpsLat.toFixed(6)}°, {file.gpsLng.toFixed(6)}°
                      {file.gpsAccuracy != null ? ` ±${Math.round(file.gpsAccuracy)}m` : ""}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Digital Fingerprint */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Digital Fingerprint</p>
                <div className="flex items-center gap-2 bg-dash-input/50 rounded border border-dash-border px-2 py-1.5 group/hash">
                  <p className="type-technical text-dash-accent/60 truncate flex-1 text-[11px]">
                    {file.sha256Hash}
                  </p>
                  <button
                    type="button"
                    title="Copy hash"
                    onClick={() => navigator.clipboard?.writeText(file.sha256Hash)}
                    className="shrink-0 text-dash-muted/40 hover:text-dash-accent transition-colors p-0.5 rounded opacity-0 group-hover/hash:opacity-100"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Collapsible Dropdown Preview Container */}
              <AnimatePresence>
                {previewFileId === file.fileId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pt-2"
                  >
                    {file.mimeType.startsWith("image/") && (
                      <div className="overflow-hidden rounded-xl border border-dash-border/60 bg-dash-input/30 p-1 animate-in fade-in duration-300">
                        <img
                          src={`https://${file.ipfsCid}.ipfs.w3s.link/${encodeURIComponent(file.originalName)}`}
                          alt={file.originalName}
                          className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {file.mimeType.startsWith("video/") && (
                      <div className="overflow-hidden rounded-xl border border-dash-border/60 bg-dash-input/30 p-1 animate-in fade-in duration-300">
                        <video
                          src={`https://${file.ipfsCid}.ipfs.w3s.link/${encodeURIComponent(file.originalName)}`}
                          controls
                          className="w-full h-auto max-h-[300px] rounded-lg"
                        />
                      </div>
                    )}
                    {file.mimeType === "application/pdf" && (
                      <div className="overflow-hidden rounded-xl border border-dash-border/60 bg-dash-input/30 p-1 h-[400px] animate-in fade-in duration-300">
                        <iframe
                          src={`https://${file.ipfsCid}.ipfs.w3s.link/${encodeURIComponent(file.originalName)}`}
                          className="w-full h-full rounded-lg"
                          title={file.originalName}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Map for first GPS file */}
        {caseData.files.find(f => f.gpsLat !== null && f.gpsLng !== null) && (
          <div className="pt-2">
            {(() => {
              const fileWithGps = caseData.files.find(f => f.gpsLat !== null && f.gpsLng !== null)!;
              return (
                <EvidenceMap
                  lat={fileWithGps.gpsLat!}
                  lng={fileWithGps.gpsLng!}
                  accuracy={fileWithGps.gpsAccuracy ?? 8}
                />
              );
            })()}
          </div>
        )}
      </motion.div>

      {/* ── Row 3: Neural Review (2/3) + Timeline & Comments (1/3) ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Neural Review — 2/3 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl border border-dash-border bg-dash-card backdrop-blur-xl p-6 space-y-5 shadow-2xl relative overflow-hidden group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-sm font-bold text-dash-text uppercase tracking-[0.2em]">Neural Review</h2>
              <div className="h-px flex-1 bg-dash-border" />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] font-bold text-dash-muted/50 uppercase tracking-widest">
                {caseData.files.length} File{caseData.files.length !== 1 ? "s" : ""}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRescanAll}
                disabled={isScanningAll || isLoadingAi}
                className="gap-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer py-1 h-7"
              >
                {isScanningAll ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Scanning Case...
                  </>
                ) : (
                  "Rescan All Files"
                )}
              </Button>
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
                  className="rounded-xl border border-dash-border bg-dash-card/50 overflow-hidden transition-all duration-300"
                >
                  {/* Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedFileId(isOpen ? null : file.fileId)}
                    className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-dash-hover transition-colors cursor-pointer focus:outline-none"
                  >
                    <div className="min-w-0 flex-1">
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
                        <span className="inline-flex items-center gap-1.5 text-[10px] text-dash-muted/70 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-dash-muted/30" />
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
                        className="overflow-hidden"
                      >
                        <div className="border-t border-dash-border p-5 bg-dash-bg/40 space-y-4">
                          {/* GPS Capture Record */}
                          {file.gpsLat !== null && file.gpsLng !== null && (
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 space-y-2">
                              <p className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest">GPS Capture Record</p>
                              <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-dash-muted/60 font-bold uppercase tracking-wider text-[9px] shrink-0">Latitude</span>
                                  <span className="font-mono text-emerald-300/90">{file.gpsLat.toFixed(6)}°</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-dash-muted/60 font-bold uppercase tracking-wider text-[9px] shrink-0">Longitude</span>
                                  <span className="font-mono text-emerald-300/90">{file.gpsLng.toFixed(6)}°</span>
                                </div>
                                {file.gpsAccuracy != null && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-dash-muted/60 font-bold uppercase tracking-wider text-[9px] shrink-0">Accuracy</span>
                                    <span className="font-mono text-emerald-300/90">±{Math.round(file.gpsAccuracy)}m</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div>
                            {report ? (
                              <AiReportPanel report={report} isLoading={false} />
                            ) : isLoadingAi ? (
                              <AiReportPanel report={null} isLoading={true} />
                            ) : (
                              <div className="py-6 text-center space-y-2">
                                <p className="text-xs text-dash-muted uppercase tracking-wider font-bold">
                                  No scan report available
                                </p>
                                <p className="text-xs text-dash-muted/70 leading-relaxed max-w-md mx-auto">
                                  The AI analysis was not triggered or encountered an error. Click &quot;Rescan All Files&quot; above to scan.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right column: Timeline — 1/3 */}
        <div className="flex flex-col gap-6">
          {!isLoadingTransfers && !isLoadingCase && (
            <CustodyTimeline nodes={timelineNodes} className="flex-1" />
          )}
        </div>
      </div>

      {/* ── Row 4: Terminal Verdict (full-width, conditional) ─────────────── */}
      <AnimatePresence>
        {!isLoadingVerdict && verdict && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-6 shadow-2xl space-y-4 ${
              verdict.verdict === "verified"
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-rose-500/5 border-rose-500/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-dash-muted uppercase tracking-[0.2em]">Terminal Verdict</h2>
              <div
                className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase tracking-widest ${
                  verdict.verdict === "verified"
                    ? "text-dash-accent bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    : "text-rose-400 bg-rose-500/5 border-rose-500/20"
                }`}
              >
                {verdict.verdict}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-dash-text/80 leading-relaxed font-medium italic border-l-2 border-emerald-500/30 pl-4">
                &ldquo;{verdict.reason}&rdquo;
              </p>
              <div className="flex items-center justify-between pt-2">
                <p className="text-[10px] text-dash-muted font-bold uppercase tracking-widest">
                  Validator Sequence
                </p>
                <p className="text-[10px] text-dash-muted font-mono">
                  {new Date(verdict.issuedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CaseChatWidget caseId={caseId} />
    </div>
  );
}
