"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getIpfsGatewayUrl } from "@/lib/ipfs-gateway";
import { Share2 } from "lucide-react";
import { CustodyTimeline, TimelineNode } from "@/components/CustodyTimeline";
import { CommentsPanel } from "@/components/CommentsPanel";

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
  tags: string[];
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

const INCIDENT_LABELS: Record<string, string> = {
  data_breach: "Data Breach",
  insider_threat: "Insider Threat",
  malware: "Malware",
  phishing: "Phishing",
  other: "Other",
};

export default function InvestigatorCaseDetailPage() {
  const { id: caseId } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [transfers, setTransfers] = useState<TransferEntry[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVerdict, setIsLoadingVerdict] = useState(true);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);

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
        setIsLoading(false);
      }
    };
    load();
  }, [caseId, getToken, toast]);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleShare = async () => {
    if (!caseData) return;
    const url = `${window.location.origin}/verify/${caseData.caseId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ProofChain Verification: ${caseData.title}`,
          text: `View cryptographic verification for forensic case: ${caseData.title}`,
          url,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Copied!", description: "Verification link copied to clipboard." });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-64 bg-dash-hover rounded-lg" />
        <Skeleton className="h-64 w-full bg-dash-hover rounded-2xl" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="rounded-3xl border border-dash-border bg-dash-card p-24 text-center backdrop-blur-2xl">
        <p className="text-dash-muted text-sm font-medium">Forensic record not located.</p>
        <Link href="/investigator" className="text-dash-accent text-[10px] font-bold uppercase tracking-widest hover:text-dash-accent mt-4 block transition-colors">
          ← Back to Registry
        </Link>
      </div>
    );
  }

  const timelineNodes: TimelineNode[] = [];
  if (caseData) {
    // 1. Initial Upload event (investigator already knows they uploaded it, so we show it)
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
    <div className="space-y-10 pb-10 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/investigator" className="text-[10px] font-bold uppercase tracking-widest text-dash-muted hover:text-dash-accent transition-colors flex items-center gap-2 mb-6">
          <span className="text-lg">←</span> Operative Registry
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-bold text-dash-text tracking-tight">{caseData.title}</h1>
            <CaseStatusBadge status={caseData.status} />
          </div>
          {caseData.status === "verified" && token && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={`/api/cases/${caseData.caseId}/certificate?token=${token}`}
              download
              className="flex items-center gap-2 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors text-xs font-bold uppercase tracking-wider self-start sm:self-auto"
            >
              ↓ Download Forensic Certificate
            </motion.a>
          )}
        </div>
        <p className="text-[10px] text-dash-muted/60 font-mono mt-2 tracking-widest">
          SYSTEM_UID::{caseData.caseId}
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-dash-border bg-dash-card backdrop-blur-2xl p-8 space-y-8 shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-6">
          <div className="text-[10px] font-bold text-dash-accent/20 uppercase tracking-[0.3em] group-hover:text-dash-accent transition-colors">Subject Profile</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 text-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Incident Taxonomy</p>
            <p className="text-dash-text font-medium">{INCIDENT_LABELS[caseData.incidentType] ?? caseData.incidentType}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Temporal Log (Origin)</p>
            <p className="text-dash-text font-medium">{new Date(caseData.incidentDate).toLocaleDateString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Submission Sequence</p>
            <p className="text-dash-text font-medium">{new Date(caseData.createdAt).toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">On-Chain Anchor</p>
            {caseData.onChainTxHash ? (
              <a
                href={`https://amoy.polygonscan.com/tx/${caseData.onChainTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dash-accent font-mono hover:text-dash-accent transition-colors flex items-center gap-2 group/link"
              >
                <span className="truncate max-w-[140px]">{caseData.onChainTxHash}</span>
                <span className="text-[10px] opacity-0 group-hover/link:opacity-100 transition-opacity">↗</span>
              </a>
            ) : (
              <p className="text-dash-muted/40 italic font-medium">Awaiting cryptographic anchoring…</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Tags / Labels</p>
            {caseData.tags && caseData.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {caseData.tags.map((tag) => (
                  <span key={tag} className="text-[10px] font-bold uppercase tracking-widest bg-dash-input text-dash-muted px-2 py-1 rounded border border-dash-border">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-dash-muted italic font-medium text-sm">None assigned</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-dash-border space-y-2">
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">Operational Intel</p>
          <p className="text-sm text-dash-muted leading-relaxed font-normal">{caseData.description}</p>
        </div>
      </motion.div>

      {/* Neural Scan Diagnostics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-dash-text uppercase tracking-[0.2em]">Neural Intelligence</h2>
          <div className="h-px flex-1 bg-dash-border" />
        </div>

        {caseData.status === "pending_ai_review" ? (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 relative overflow-hidden group shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 flex-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Neural Diagnostics Scanning in Progress
                </p>
                <p className="text-xs text-dash-muted leading-relaxed font-normal">
                  The automated AI system is executing deep forensic scans on metadata, EXIF profiles, software fingerprints, and spatial geotags for all uploaded assets. Please stand by...
                </p>
              </div>
              <div className="shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-dash-input border border-blue-500/20">
                <span className="text-xs font-bold text-blue-400 animate-pulse">SCAN</span>
              </div>
            </div>
            {/* Animated scanning bar overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500/20">
              <div className="h-full bg-blue-500 w-1/3 rounded-full animate-pulse" />
            </div>
          </div>
        ) : caseData.overallRiskLevel ? (
          <div className={`rounded-2xl border p-6 relative overflow-hidden group shadow-lg transition-all duration-300 ${
            caseData.overallRiskLevel === "high"
              ? "bg-red-500/5 border-red-500/20"
              : caseData.overallRiskLevel === "medium"
              ? "bg-amber-500/5 border-amber-500/20"
              : "bg-emerald-500/5 border-emerald-500/20"
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <p className="text-[9px] font-bold text-dash-muted uppercase tracking-widest">
                  Overall Risk Assessment
                </p>
                <h3 className="text-base font-bold text-dash-text tracking-tight">
                  <span className="uppercase">{caseData.overallRiskLevel} RISK IDENTIFIED</span>
                </h3>
                <p className="text-xs text-dash-muted leading-relaxed font-normal">
                  {caseData.overallRiskLevel === "high"
                    ? "High probability of image/metadata manipulation detected. Discrepancies found in file structures."
                    : caseData.overallRiskLevel === "medium"
                    ? "Minor anomalies flagged in file structures or metadata edits. Manual analyst review suggested."
                    : "Digital signatures, EXIF timestamps, and structure formats verified authentic with low tamper flags."}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-center justify-center p-3 rounded-xl bg-dash-bg border border-dash-border min-w-[75px]">
                <span className="text-[8px] font-bold text-dash-muted uppercase tracking-wider mb-0.5">SCORE</span>
                <span className={`text-base font-extrabold ${
                  caseData.overallRiskLevel === "high"
                    ? "text-red-400"
                    : caseData.overallRiskLevel === "medium"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}>
                  {caseData.overallTamperScore !== null ? `${caseData.overallTamperScore}/100` : "--"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dash-border bg-dash-input/50 p-6 text-center">
            <p className="text-xs text-dash-muted">AI Analysis not executed or awaiting upload process.</p>
          </div>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-dash-text uppercase tracking-[0.2em]">Enclosed Artifacts</h2>
          <div className="h-px flex-1 bg-dash-border" />
          <span className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">{caseData.files.length} Modules</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {caseData.files.map((file, idx) => (
              <motion.div 
                key={file.fileId} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className="rounded-2xl border border-dash-border bg-dash-card hover:bg-dash-hover transition-all p-5 space-y-4 group/file"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-dash-text truncate group-hover/file:text-dash-accent transition-colors uppercase tracking-tight">{file.originalName}</p>
                    <p className="text-[10px] text-dash-muted font-bold uppercase tracking-widest mt-0.5">{file.mimeType} · {formatFileSize(file.sizeBytes)}</p>
                  </div>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={getIpfsGatewayUrl(file.ipfsCid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold uppercase tracking-widest text-dash-accent/80 bg-emerald-500/5 border border-dash-accent/20 px-4 py-1.5 rounded-lg transition-colors hover:bg-dash-accent/10"
                  >
                    Gateway Link
                  </motion.a>
                </div>
                <div className="space-y-1.5 pt-1">
                  <p className="text-[9px] font-bold text-dash-muted uppercase tracking-widest">Digital Fingerprint (SHA-256)</p>
                  <p className="text-[10px] font-mono text-dash-accent/80 dark:text-dash-accent/40 break-all bg-dash-input rounded-xl px-4 py-2 border border-dash-border">
                    {file.sha256Hash}
                  </p>
                  {file.gpsLat !== null && file.gpsLng !== null && (
                    <div className="pt-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                      <span className="text-[9px] font-bold text-dash-muted/70 uppercase tracking-widest">
                        Geotag Signature: {file.gpsLat.toFixed(5)}°, {file.gpsLng.toFixed(5)}°
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {!isLoadingTransfers && !isLoadingVerdict && (
        <CustodyTimeline nodes={timelineNodes} />
      )}

      <CommentsPanel caseId={caseId} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-1">
          <p className="text-xs font-bold text-dash-text uppercase tracking-tight text-center sm:text-left">Public Verification Signal</p>
          <p className="text-[10px] text-dash-muted font-medium text-center sm:text-left">Distribute this secure link for third-party blockchain validation protocol.</p>
        </div>
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex items-center justify-center size-8 rounded-full bg-emerald-500/10 text-dash-accent hover:bg-emerald-500/20 transition-colors"
            title="Share Case Link"
          >
            <Share2 size={14} />
          </motion.button>
          <motion.a
            whileHover={{ x: 5 }}
            href={`/verify/${caseData.caseId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-dash-accent hover:text-emerald-300 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 whitespace-nowrap"
          >
            Verify Interface <span className="text-lg">→</span>
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
}
