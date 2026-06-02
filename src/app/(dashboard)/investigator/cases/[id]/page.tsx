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
  const [isLoading, setIsLoading] = useState(true);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      <div className="rounded-3xl border border-dash-border bg-dash-sidebar p-24 text-center backdrop-blur-2xl">
        <p className="text-white/30 text-sm font-medium">Forensic record not located.</p>
        <Link href="/investigator" className="text-dash-accent text-[10px] font-bold uppercase tracking-widest hover:text-dash-accent mt-4 block transition-colors">
          ← Back to Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/investigator" className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-dash-accent transition-colors flex items-center gap-2 mb-6">
          <span className="text-lg">←</span> Operative Registry
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-bold text-white tracking-tight">{caseData.title}</h1>
          <CaseStatusBadge status={caseData.status} />
        </div>
        <p className="text-[10px] text-white/20 font-mono mt-2 tracking-widest">
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
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Incident Taxonomy</p>
            <p className="text-white font-medium">{INCIDENT_LABELS[caseData.incidentType] ?? caseData.incidentType}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Temporal Log (Origin)</p>
            <p className="text-white font-medium">{new Date(caseData.incidentDate).toLocaleDateString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Submission Sequence</p>
            <p className="text-white font-medium">{new Date(caseData.createdAt).toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">On-Chain Anchor</p>
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
              <p className="text-white/20 italic font-medium">Awaiting cryptographic anchoring…</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-dash-border space-y-2">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Operational Intel</p>
          <p className="text-sm text-white/70 leading-relaxed font-normal">{caseData.description}</p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Enclosed Artifacts</h2>
          <div className="h-px flex-1 bg-dash-border" />
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{caseData.files.length} Modules</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {caseData.files.map((file, idx) => (
              <motion.div 
                key={file.fileId} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className="rounded-2xl border border-dash-border bg-dash-sidebar hover:bg-dash-hover transition-all p-5 space-y-4 group/file"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover/file:text-dash-accent transition-colors uppercase tracking-tight">{file.originalName}</p>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">{file.mimeType} · {formatFileSize(file.sizeBytes)}</p>
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
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Digital Fingerprint (SHA-256)</p>
                  <p className="text-[10px] font-mono text-dash-accent/40 break-all bg-black/40 rounded-xl px-4 py-2 border border-dash-border">
                    {file.sha256Hash}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-1">
          <p className="text-xs font-bold text-white uppercase tracking-tight text-center sm:text-left">Public Verification Signal</p>
          <p className="text-[10px] text-dash-muted font-medium text-center sm:text-left">Distribute this secure link for third-party blockchain validation protocol.</p>
        </div>
        <motion.a
          whileHover={{ x: 5 }}
          href={`/verify/${caseData.caseId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-dash-accent hover:text-emerald-300 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 whitespace-nowrap"
        >
          Verify Interface <span className="text-lg">→</span>
        </motion.a>
      </motion.div>
    </div>
  );
}
