"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { CustodyTimeline, TimelineNode } from "@/components/CustodyTimeline";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ArrowLeft, 
  ExternalLink, 
  Share2, 
  FileDown, 
  Search, 
  HelpCircle,
  Check,
  AlertTriangle,
  Loader2
} from "lucide-react";

interface TransferEntry {
  transferHash: string;
  transferredAt: string;
  fromRole: string;
  toRole: string;
  txHash?: string | null;
}

interface VerifyData {
  caseId: string;
  onChainHash: string;
  onChainTimestamp: string;
  onChainTxHash?: string | null;
  ipfsCid: string;
  currentFileHash: string | null;
  hashMatch: boolean;
  fileAvailable: boolean;
  verdictIssued: boolean;
  verdictHash: string | null;
  verdictTxHash?: string | null;
  verdictAt: string | null;
  transferCount: number;
  uploaderRole: string;
  currentCustodianRole: string;
  transferLog: TransferEntry[];
  message?: string;
}

export default function PublicVerifyPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  
  const [data, setData] = useState<VerifyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [searchId, setSearchId] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/verify/${caseId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Verification failed");
        setData(json);

        // Generate QR code for this page URL
        const pageUrl = `${window.location.origin}/verify/${caseId}`;
        const qr = await QRCode.toDataURL(pageUrl, {
          width: 160,
          margin: 1,
          color: { dark: "#1E293B", light: "#FFFFFF" },
        });
        setQrUrl(qr);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Verification failed");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [caseId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      router.push(`/verify/${encodeURIComponent(searchId.trim())}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--dash-bg)] text-[var(--dash-text)] sentinel-theme-v2 flex flex-col justify-between relative overflow-hidden">
        {/* Background grids */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-70" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[var(--dash-accent)]/5 rounded-full blur-[120px] pointer-events-none" />
        </div>

        <header className="relative z-10 max-w-4xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-[var(--dash-border)]">
          <Link href="/verify" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--dash-muted)] hover:text-[var(--dash-accent)] transition-colors">
            <ArrowLeft size={14} /> Back to Lookup
          </Link>
          <span className="text-[10px] font-bold text-[var(--dash-muted)]/60 uppercase tracking-widest">PROOFCHAIN PROTOCOL</span>
        </header>

        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin text-[var(--dash-accent)] size-10 mx-auto" />
            <p className="text-sm font-medium text-[var(--dash-muted)] tracking-wider uppercase">Querying Polygon Ledger…</p>
          </div>
        </main>

        <footer className="relative z-10 max-w-4xl mx-auto w-full px-6 py-6 text-center border-t border-[var(--dash-border)]">
          <p className="text-[10px] text-[var(--dash-muted)]/60 tracking-wider">
            PROOFCHAIN INCIDENT PROTOCOL · POWERED BY POLYGON AMOY
          </p>
        </footer>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--dash-bg)] text-[var(--dash-text)] sentinel-theme-v2 flex flex-col justify-between relative overflow-hidden">
        {/* Background grids */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-70" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />
        </div>

        <header className="relative z-10 max-w-4xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-[var(--dash-border)]">
          <Link href="/verify" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--dash-muted)] hover:text-rose-500 transition-colors">
            <ArrowLeft size={14} /> Back to Lookup
          </Link>
          <span className="text-[10px] font-bold text-[var(--dash-muted)]/60 uppercase tracking-widest">VERIFICATION SYSTEM</span>
        </header>

        <main className="relative z-10 flex-1 max-w-md mx-auto w-full px-6 flex flex-col justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 bg-[var(--dash-card)] border border-rose-500/25 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
            <div className="size-12 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex items-center justify-center mx-auto">
              <AlertTriangle className="text-rose-500 size-6" />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-[var(--dash-text)]">Verification Failed</h1>
              <p className="text-xs text-[var(--dash-muted)] leading-relaxed max-w-xs mx-auto">
                {error || "The requested case could not be retrieved from the decentralized ledger."}
              </p>
              <p className="text-[10px] text-[var(--dash-muted)] font-mono bg-[var(--dash-bg)] px-2 py-1 rounded border border-[var(--dash-border)] w-fit mx-auto mt-2">
                ID: {caseId}
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-3 pt-2">
              <p className="text-[10px] font-bold text-[var(--dash-muted)] uppercase tracking-widest ml-1">Query Another ID</p>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[var(--dash-muted)] group-focus-within:text-rose-500 transition-colors" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Case ID (e.g. CASE-12345)"
                  required
                  className="w-full h-11 pl-11 pr-4 bg-[var(--dash-bg)] border border-[var(--dash-border)] rounded-xl text-sm font-mono placeholder:text-[var(--dash-muted)]/50 focus:outline-none focus:border-rose-500/50 focus:bg-white transition-all text-[var(--dash-text)]"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 bg-[var(--dash-text)] hover:bg-[var(--dash-text)]/90 text-[var(--dash-bg)] font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <span>Find Records</span>
              </button>
            </form>
          </motion.div>
        </main>

        <footer className="relative z-10 max-w-4xl mx-auto w-full px-6 py-6 text-center border-t border-[var(--dash-border)]">
          <p className="text-[10px] text-[var(--dash-muted)]/60 tracking-wider">
            PROOFCHAIN INCIDENT PROTOCOL · POWERED BY POLYGON AMOY
          </p>
        </footer>
      </div>
    );
  }

  const timelineNodes: TimelineNode[] = [];
  if (data) {
    // 1. Initial Upload event
    timelineNodes.push({
      id: "upload-" + data.caseId,
      type: "upload",
      title: "Evidence Uploaded & Sealed",
      subtitle: `Action taken by ${data.uploaderRole || "investigator"}`,
      description: `Cryptographic fingerprint registered on-chain: ${data.onChainHash.slice(0, 16)}...`,
      timestamp: data.onChainTimestamp,
      txHash: data.onChainTxHash,
      isActive: data.transferLog.length === 0 && !data.verdictIssued,
    });

    // 2. Transfer events
    data.transferLog.forEach((t, index) => {
      const isLastTransfer = index === data.transferLog.length - 1;
      timelineNodes.push({
        id: t.transferHash,
        type: "transfer",
        title: "Custody Hand-off",
        subtitle: `${t.fromRole || "analyst"} ➔ ${t.toRole || "analyst"}`,
        description: `Cryptographic transfer registered on the ledger under transfer hash: ${t.transferHash.slice(0, 16)}...`,
        timestamp: t.transferredAt,
        txHash: t.txHash || t.transferHash,
        isActive: isLastTransfer && !data.verdictIssued,
      });
    });

    // 3. Verdict event
    if (data.verdictIssued) {
      timelineNodes.push({
        id: "verdict-" + data.caseId,
        type: "verdict",
        title: `Forensic Verdict Issued`,
        subtitle: `Action taken by forensic analyst`,
        description: `Cryptographic verification status locked on-chain. Verdict: Verified`,
        timestamp: data.verdictAt!,
        txHash: data.verdictTxHash || data.verdictHash,
        verdictType: "verified",
        isActive: true,
      });
    }
  }

  return (
    <div className="min-h-screen bg-[var(--dash-bg)] text-[var(--dash-text)] sentinel-theme-v2 flex flex-col justify-between relative overflow-hidden">
      {/* Background grids */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-70" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-[var(--dash-accent)]/5 rounded-full blur-[140px] pointer-events-none" />
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-4xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-[var(--dash-border)]">
        <Link href="/verify" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--dash-muted)] hover:text-[var(--dash-accent)] transition-colors">
          <ArrowLeft size={14} /> Back to Lookup
        </Link>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex size-8 items-center justify-center rounded-lg border border-[var(--dash-accent)]/20 bg-[var(--dash-accent)]/5 overflow-hidden">
            <Image src="/logo.png" alt="ProofChain Icon" width={18} height={18} className="object-contain rounded-md" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            <span className="text-[var(--dash-text)]">Proof</span>
            <span className="text-[var(--dash-accent)] group-hover:text-[var(--dash-accent)]/80 transition-colors">Chain</span>
          </span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-3xl mx-auto w-full px-6 py-12 space-y-8">
        
        {/* Verification Status Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-3xl p-6 shadow-xl animate-fade-in">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[var(--dash-muted)] uppercase tracking-widest">Polygon Public Audit</p>
            <h1 className="text-xl font-bold tracking-tight text-[var(--dash-text)] flex items-center gap-2">
              Case Verification
            </h1>
            <p className="text-xs font-mono text-[var(--dash-accent)] mt-1 tracking-tight">{data.caseId}</p>
          </div>
          <div className="flex items-center gap-4">
            {qrUrl && (
              <div className="bg-white p-1.5 rounded-xl border border-[var(--dash-border)] shadow-lg">
                <img src={qrUrl} alt="Verification QR Code" className="w-16 h-16 rounded-lg" />
              </div>
            )}
          </div>
        </div>

        {/* Big Alert Banner */}
        {data.message ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-start gap-4 animate-fade-in">
            <AlertTriangle className="text-amber-500 size-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-700">Blockchain Sync Pending</p>
              <p className="text-xs text-[var(--dash-muted)] leading-relaxed">{data.message}</p>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-2xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl animate-fade-in ${
              data.hashMatch
                ? "border-[var(--dash-accent)]/20 bg-[var(--dash-accent)]/[0.03]"
                : "border-rose-500/20 bg-rose-500/[0.03]"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`size-2 rounded-full animate-pulse ${data.hashMatch ? "bg-[var(--dash-accent)]" : "bg-rose-500"}`} />
                <p className={`text-base font-bold uppercase tracking-wide text-sm ${data.hashMatch ? "text-[var(--dash-accent)]" : "text-rose-500"}`}>
                  {data.hashMatch ? "Integrity Verified" : "Verification Mismatch"}
                </p>
              </div>
              <p className="text-xs text-[var(--dash-muted)] leading-relaxed max-w-xl">
                {data.hashMatch
                  ? "The cryptographic fingerprint matches the blockchain record perfectly. The evidence remains unchanged since it was sealed."
                  : "The current hash of the file stored on IPFS does not match the blockchain records. The evidence may have been modified."}
              </p>
              {!data.fileAvailable && (
                <p className="text-[10px] text-[var(--dash-muted)]/80 italic mt-1">
                  Note: The file could not be fetched from the public IPFS gateway to compute the live hash check. However, the anchored immutable record remains.
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleShare}
                className={`h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2 cursor-pointer ${
                  isCopied
                    ? "bg-[var(--dash-accent)]/10 border-[var(--dash-accent)]/30 text-[var(--dash-accent)]"
                    : "bg-[var(--dash-bg)] border-[var(--dash-border)] hover:bg-[var(--dash-hover)] text-[var(--dash-text)]"
                }`}
              >
                {isCopied ? <Check size={14} /> : <Share2 size={14} />}
                <span>{isCopied ? "Copied" : "Share"}</span>
              </button>

              {data.verdictIssued && data.hashMatch && (
                <a
                  href={`/api/cases/${data.caseId}/certificate`}
                  download
                  className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[var(--dash-accent)] hover:bg-[var(--dash-accent)]/90 text-white transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileDown size={14} />
                  <span>Certificate</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Ledger Details Card */}
        <div className="rounded-3xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[var(--dash-accent)] size-4" />
            <h2 className="text-xs font-bold text-[var(--dash-text)] uppercase tracking-[0.25em]">On-Chain Metadata</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-[var(--dash-border)] font-medium">
                
                {/* Submitted At */}
                <tr>
                  <td className="py-3.5 text-[var(--dash-muted)]/80 uppercase tracking-widest text-[9px] w-40 shrink-0">Submitted At</td>
                  <td className="py-3.5 text-[var(--dash-text)]">
                    {data.onChainTimestamp ? new Date(data.onChainTimestamp).toLocaleString() : "Pending sync"}
                  </td>
                </tr>

                {/* On Chain Hash */}
                <tr>
                  <td className="py-3.5 text-[var(--dash-muted)]/80 uppercase tracking-widest text-[9px] w-40 shrink-0">On-Chain Hash</td>
                  <td className="py-3.5 font-mono text-[var(--dash-text)] break-all select-all flex items-center gap-2">
                    <span className="text-[var(--dash-text)]">{data.onChainHash}</span>
                    {data.onChainTxHash && (
                      <a
                        href={`https://amoy.polygonscan.com/tx/${data.onChainTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--dash-accent)] hover:text-[var(--dash-accent)]/80 transition-colors"
                        title="View anchoring transaction on Polygonscan"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                </tr>

                {/* IPFS CID */}
                <tr>
                  <td className="py-3.5 text-[var(--dash-muted)]/80 uppercase tracking-widest text-[9px] w-40 shrink-0">Decentralized IPFS CID</td>
                  <td className="py-3.5 font-mono break-all text-[var(--dash-text)] flex items-center gap-2">
                    <span className="text-[var(--dash-text)]">{data.ipfsCid}</span>
                    <a
                      href={`https://${data.ipfsCid}.ipfs.w3s.link/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--dash-accent)] hover:text-[var(--dash-accent)]/80 transition-colors"
                      title="Open file from IPFS Gateway"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </td>
                </tr>

                {/* Current File Hash */}
                <tr>
                  <td className="py-3.5 text-[var(--dash-muted)]/80 uppercase tracking-widest text-[9px] w-40 shrink-0">Live Computed Hash</td>
                  <td className="py-3.5 font-mono break-all text-[var(--dash-muted)]">
                    {data.currentFileHash ?? "Fetch failed — unavailable"}
                  </td>
                </tr>

                {/* Transferred Count */}
                <tr>
                  <td className="py-3.5 text-[var(--dash-muted)]/80 uppercase tracking-widest text-[9px] w-40 shrink-0">Hand-off Count</td>
                  <td className="py-3.5 text-[var(--dash-text)]">{data.transferCount} custody transfers recorded</td>
                </tr>

                {/* Verdict Info */}
                {data.verdictIssued && (
                  <tr>
                    <td className="py-3.5 text-[var(--dash-muted)]/80 uppercase tracking-widest text-[9px] w-40 shrink-0">On-Chain Verdict</td>
                    <td className="py-3.5 font-mono break-all text-[var(--dash-text)] flex items-center gap-2">
                      <span className="text-[var(--dash-text)]">VERIFIED — Sealed {data.verdictAt ? new Date(data.verdictAt).toLocaleString() : ""}</span>
                      {data.verdictTxHash && (
                        <a
                          href={`https://amoy.polygonscan.com/tx/${data.verdictTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--dash-accent)] hover:text-[var(--dash-accent)]/80 transition-colors"
                          title="View verdict transaction on Polygonscan"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline */}
        <CustodyTimeline nodes={timelineNodes} isPublic={true} />

        {/* How it Works explainer card */}
        <div className="border border-[var(--dash-border)] bg-[var(--dash-card)] rounded-2xl overflow-hidden shadow-lg">
          <button 
            onClick={() => setExplainerOpen(!explainerOpen)}
            className="w-full flex items-center justify-between p-5 text-xs font-bold uppercase tracking-wider text-[var(--dash-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-hover)] transition-all"
          >
            <span className="flex items-center gap-2"><HelpCircle size={14} className="text-[var(--dash-accent)]" /> How Verification Works</span>
            <span>{explainerOpen ? "Hide Details" : "Show Details"}</span>
          </button>
          {explainerOpen && (
            <div className="p-5 border-t border-[var(--dash-border)] text-xs text-[var(--dash-muted)] space-y-3 leading-relaxed">
              <p>
                <strong>1. Cryptographic Sealing:</strong> When evidence is uploaded, it is cryptographically hashed (SHA-256) and anchored to the Polygon Blockchain. This creates a permanent, immutable seal of the evidence's exact original state.
              </p>
              <p>
                <strong>2. Decentralized Storage:</strong> The evidence is stored securely on IPFS (InterPlanetary File System), a decentralized content-addressed network. It can never be silently altered because changing even a single pixel in an image changes its IPFS address (CID) and SHA-256 hash completely.
              </p>
              <p>
                <strong>3. On-Demand Audit:</strong> This verification page downloads the file from IPFS in real-time, recomputes its SHA-256 fingerprint, and compares it to the original hash stored immutably on the Polygon blockchain. If they match, it verifies that the file is 100% genuine and unmodified.
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full px-6 py-6 text-center border-t border-[var(--dash-border)]">
        <p className="text-[10px] text-[var(--dash-muted)]/60 tracking-wider">
          PROOFCHAIN INCIDENT PROTOCOL · POWERED BY POLYGON AMOY
        </p>
      </footer>
    </div>
  );
}