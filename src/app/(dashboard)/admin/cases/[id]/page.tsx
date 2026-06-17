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

export default function AdminCaseDetailPage() {
  const { id: caseId } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [transfers, setTransfers] = useState<TransferEntry[]>([]);
  const [isLoadingCase, setIsLoadingCase] = useState(true);
  const [isLoadingAi, setIsLoadingAi] = useState(true);
  const [isLoadingVerdict, setIsLoadingVerdict] = useState(true);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);

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
        const res = await fetch(`/api/cases/${caseId}/ai`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 202) {
          setTimeout(load, 5000);
          return;
        }
        if (res.ok) setAiReport(await res.json());
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-dash-hover" />
        <Skeleton className="h-96 w-full rounded-2xl bg-dash-hover" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="rounded-3xl border border-dash-border bg-dash-sidebar backdrop-blur-2xl p-20 text-center shadow-2xl">
        <p className="text-dash-muted text-sm font-medium">Case subject not found in secure storage.</p>
        <Link href="/admin/cases" className="text-dash-accent text-xs font-bold uppercase tracking-widest hover:text-dash-accent mt-4 block transition-colors">
          ← Return to Archives
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
    <div className="space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <Link href="/admin/cases" className="text-[10px] font-bold uppercase tracking-widest text-dash-muted hover:text-dash-accent transition-colors flex items-center gap-2">
            <span className="text-lg">←</span> Forensic Archives
          </Link>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <h1 className="text-3xl font-bold text-dash-text tracking-tight">{caseData.title}</h1>
            <CaseStatusBadge status={caseData.status} />
          </div>
          <p className="text-[10px] text-dash-muted font-mono mt-2 tracking-widest">
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
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-dash-border bg-dash-card backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className="text-[10px] font-bold text-dash-accent/20 uppercase tracking-[0.3em] group-hover:text-dash-accent transition-colors cursor-default">Subject Details</div>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm pt-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Incident Category</p>
                <p className="text-dash-text font-medium">{INCIDENT_LABELS[caseData.incidentType] ?? caseData.incidentType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Temporal Log</p>
                <p className="text-dash-text font-medium">{new Date(caseData.incidentDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-8 space-y-2">
              <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Description</p>
              <p className="text-sm text-white/70 leading-relaxed font-normal">{caseData.description}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
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
                  className="rounded-2xl bg-dash-card border border-dash-border hover:border-emerald-500/20 p-5 space-y-4 transition-all group/file hover:shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-dash-text truncate group-hover/file:text-dash-accent transition-colors uppercase tracking-tight">{file.originalName}</p>
                      <p className="text-[10px] text-dash-muted font-bold uppercase tracking-widest mt-0.5">{file.mimeType} · {formatFileSize(file.sizeBytes)}</p>
                    </div>
                    <a
                      href={`https://${file.ipfsCid}.ipfs.w3s.link/${encodeURIComponent(file.originalName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-[0.2em] text-dash-accent/60 hover:text-dash-accent transition-colors border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 rounded"
                    >
                      Gateway
                    </a>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Digital Fingerprint</p>
                    <p className="text-[10px] font-mono text-dash-accent/40 break-all bg-black/40 rounded px-2 py-1.5 border border-dash-border font-medium">
                      {file.sha256Hash}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Show Map for the first file with GPS data */}
            {caseData.files.find(f => f.gpsLat !== null && f.gpsLng !== null) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-6"
              >
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
              </motion.div>
            )}
          </motion.div>
        </div>

        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-bold text-dash-text uppercase tracking-[0.2em]">Neural Review</h2>
              <div className="h-px flex-1 bg-dash-border" />
            </div>
            <AiReportPanel report={aiReport} isLoading={isLoadingAi} />
          </motion.div>

          <AnimatePresence>
            {!isLoadingVerdict && verdict && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-dash-border bg-dash-card backdrop-blur-xl p-6 space-y-4 shadow-xl"
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
                  <p className="text-sm text-white/70 leading-relaxed font-medium italic border-l-2 border-emerald-500/30 pl-4">
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

          {!isLoadingTransfers && !isLoadingCase && (
            <CustodyTimeline nodes={timelineNodes} />
          )}
        </div>
      </div>
    </div>
  );
}