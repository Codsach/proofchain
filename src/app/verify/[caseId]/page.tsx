"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { CustodyTimeline, TimelineNode } from "@/components/CustodyTimeline";

interface TransferEntry {
  transferHash: string;
  transferredAt: string;
  fromRole: string;
  toRole: string;
}

interface VerifyData {
  caseId: string;
  onChainHash: string;
  onChainTimestamp: string;
  ipfsCid: string;
  currentFileHash: string | null;
  hashMatch: boolean;
  fileAvailable: boolean;
  verdictIssued: boolean;
  verdictHash: string | null;
  verdictAt: string | null;
  transferCount: number;
  uploaderRole: string;
  currentCustodianRole: string;
  transferLog: TransferEntry[];
  message?: string;
}

export default function PublicVerifyPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [data, setData] = useState<VerifyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
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
          color: { dark: "#00C9A7", light: "#0D1B2A" },
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">
          Querying blockchain…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <p className="text-destructive text-sm">{error ?? "Case not found"}</p>
          <p className="text-xs text-muted-foreground">Case ID: {caseId}</p>
        </div>
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
      txHash: null,
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
        description: `Cryptographic transfer registered under hash: ${t.transferHash.slice(0, 16)}...`,
        timestamp: t.transferredAt,
        txHash: null,
        isActive: isLastTransfer && !data.verdictIssued,
      });
    });

    // 3. Verdict event
    if (data.verdictIssued) {
      timelineNodes.push({
        id: "verdict-" + data.caseId,
        type: "verdict",
        title: `Forensic Verdict Issued`,
        subtitle: `Action taken by analyst`,
        description: `Cryptographic verification status locked on-chain.`,
        timestamp: data.verdictAt!,
        txHash: data.verdictHash,
        verdictType: "verified",
        isActive: true,
      });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">ProofChain · Public Verification</p>
            <h1 className="text-xl font-bold text-foreground">Evidence Integrity Check</h1>
            <p className="text-xs font-mono text-muted-foreground mt-1">{caseId}</p>
          </div>
          {qrUrl && (
            <img src={qrUrl} alt="QR code for this page" className="w-16 h-16 rounded" />
          )}
        </div>

        {/* Hash match result */}
        {data.message ? (
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-5">
            <p className="text-sm text-amber-300">{data.message}</p>
          </div>
        ) : (
          <div
            className={`rounded-xl border p-5 space-y-2 ${
              data.hashMatch
                ? "border-green-900/60 bg-green-950/20"
                : "border-red-900/60 bg-red-950/20"
            }`}
          >
            <p className={`text-base font-semibold ${data.hashMatch ? "text-green-300" : "text-red-300"}`}>
              {data.hashMatch
                ? "✓ File integrity verified — evidence is unmodified"
                : "✗ Hash mismatch — the file may have been altered since submission"}
            </p>
            {!data.fileAvailable && (
              <p className="text-xs text-muted-foreground">
                The file could not be retrieved from IPFS to re-verify.
                The on-chain hash record still exists as permanent proof of what was submitted.
              </p>
            )}
          </div>
        )}

        {/* On-chain details */}
        {data.onChainHash && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">On-chain record</h2>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-border">
                {[
                  ["Anchored at", data.onChainTimestamp ? new Date(data.onChainTimestamp).toLocaleString() : "—"],
                  ["On-chain hash", data.onChainHash],
                  ["IPFS CID", data.ipfsCid],
                  ["Current file hash", data.currentFileHash ?? "Could not retrieve"],
                  ["Transfers recorded", String(data.transferCount)],
                  ["Verdict issued", data.verdictIssued ? `Yes — ${new Date(data.verdictAt!).toLocaleString()}` : "No"],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="py-2 text-muted-foreground pr-4 w-40 shrink-0">{label}</td>
                    <td className="py-2 font-mono text-foreground break-all">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <CustodyTimeline nodes={timelineNodes} isPublic={true} />

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          This verification is powered by the Polygon Amoy blockchain. Hashes are permanent
          and cannot be altered. ProofChain does not store file contents on-chain — only
          cryptographic proofs. This is not a court-admissible forensic certificate.
        </p>
      </div>
    </div>
  );
}