"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthContext";
import { AiReportPanel } from "@/components/AiReportPanel";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { VerifyHashButton } from "@/components/VerifyHashButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import { CustodyTimeline, TimelineNode } from "@/components/CustodyTimeline";
import { CommentsPanel } from "@/components/CommentsPanel";
import { TamperScoreBadge } from "@/components/TamperScoreBadge";
import { ShieldAlert, ShieldCheck, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

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
  const [isLoadingVerdict, setIsLoadingVerdict] = useState(true);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);

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
    const load = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/cases/${caseId}/ai-all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 202) {
          setTimeout(load, 5000);
          return;
        }
        if (res.ok) setAiReports(await res.json());
      } catch {
      } finally {
        setIsLoadingAi(false);
      }
    };
    load();
  }, [caseId, getToken]);

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
            ← Return to Archives
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
    <div className="w-full space-y-8 pb-10 overflow-x-hidden">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8 min-w-0">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-sm relative overflow-hidden group"
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

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-dash-border bg-dash-card p-6 space-y-6 shadow-sm relative overflow-hidden group"
          >
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-bold text-dash-text uppercase tracking-[0.2em]">Enclosed Evidence</h2>
              <div className="h-px flex-1 bg-dash-border" />
              <span className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">{caseData.files.length} Modules</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                    <a
                      href={`https://${file.ipfsCid}.ipfs.w3s.link/${encodeURIComponent(file.originalName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-dash-accent/60 hover:text-dash-accent transition-colors border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 rounded"
                    >
                      Gateway
                    </a>
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
                </motion.div>
              ))}
            </div>
            
            {/* Show Map for the first file with GPS data */}
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

          {!isLoadingTransfers && !isLoadingCase && (
            <CustodyTimeline nodes={timelineNodes} className="flex-1" />
          )}
        </div>

        <div className="flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-dash-border bg-dash-card backdrop-blur-xl p-5 space-y-5 shadow-2xl relative overflow-hidden group"
          >
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-bold text-dash-text uppercase tracking-[0.2em]">Neural Review</h2>
              <div className="h-px flex-1 bg-dash-border" />
            </div>

            {/* Overall Risk Card */}
            <div className={`rounded-xl border p-5 relative overflow-hidden group shadow-md transition-all duration-300 ${
              caseData.overallRiskLevel === "high"
                ? "bg-red-500/5 border-red-500/20"
                : caseData.overallRiskLevel === "medium"
                ? "bg-amber-500/5 border-amber-500/20"
                : caseData.overallRiskLevel === "low"
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-dash-input border-dash-border animate-pulse"
            }`}>
              <div className="flex items-start gap-5">
                {/* Left: text info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-[9px] font-bold text-dash-muted uppercase tracking-widest">
                    Overall Risk Assessment
                  </p>
                  <h3 className="text-sm font-bold text-dash-text tracking-tight leading-snug">
                    {caseData.overallRiskLevel ? (
                      <span className="uppercase">{caseData.overallRiskLevel} Risk Detected</span>
                    ) : (
                      <span>Awaiting Scan</span>
                    )}
                  </h3>
                  <p className="text-[11px] text-dash-muted leading-relaxed font-normal">
                    {caseData.overallRiskLevel === "high"
                      ? "High probability of image/metadata manipulation detected. Exercise extreme caution."
                      : caseData.overallRiskLevel === "medium"
                      ? "Potential anomalies detected in image metadata or structure. Further review suggested."
                      : caseData.overallRiskLevel === "low"
                      ? "All assets verified with low tamper indicators. Digital signature authentic."
                      : "Forensic scanner is conducting a deep neural scan on uploaded assets..."}
                  </p>
                </div>
                {/* Right: score badge */}
                <div className={`shrink-0 flex flex-col items-center justify-center p-4 rounded-xl bg-dash-bg border min-w-[90px] ${
                  caseData.overallRiskLevel === "high"
                    ? "border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.08)]"
                    : caseData.overallRiskLevel === "medium"
                    ? "border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                    : caseData.overallRiskLevel === "low"
                    ? "border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.08)]"
                    : "border-dash-border"
                }`}>
                  <span className="text-[8px] font-bold text-dash-muted uppercase tracking-wider mb-1">SCORE</span>
                  <span className={`text-2xl font-extrabold leading-none tracking-tight ${
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
                          <div className="border-t border-dash-border p-4 bg-dash-bg/40 space-y-4">
                            {/* GPS Capture Record */}
                            {file.gpsLat !== null && file.gpsLng !== null && (
                              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 space-y-2">
                                <p className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest">GPS Capture Record</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
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
          </motion.div>

          <AnimatePresence>
            {!isLoadingVerdict && verdict && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-dash-border bg-dash-card backdrop-blur-xl p-5 space-y-4 shadow-2xl"
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
                    "{verdict.reason}"
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

          <CommentsPanel caseId={caseId} className="flex-1" />
        </div>
      </div>
    </div>
  );
}