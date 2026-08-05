"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getIpfsGatewayUrl } from "@/lib/ipfs-gateway";
import { Copy, Check, ExternalLink, FileText, Video, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EvidenceFile {
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  ipfsCid: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  file: EvidenceFile | null;
}

export function EvidencePreviewDialog({ open, onClose, file }: Props) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedCid, setCopiedCid] = useState(false);

  if (!file) return null;

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(file.sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyCid = () => {
    navigator.clipboard?.writeText(file.ipfsCid);
    setCopiedCid(true);
    setTimeout(() => setCopiedCid(false), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImage = file.mimeType.startsWith("image/");
  const isVideo = file.mimeType.startsWith("video/");
  const isPdf = file.mimeType === "application/pdf";
  const fileUrl = getIpfsGatewayUrl(file.ipfsCid);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[95vh] bg-dash-card border-dash-border text-dash-text flex flex-col p-6 overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader className="border-b border-dash-border pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pr-8">
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-base font-bold uppercase tracking-wider text-dash-text truncate flex items-center gap-2">
                {isImage && <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isVideo && <Video className="w-4 h-4 text-amber-400 shrink-0" />}
                {isPdf && <FileText className="w-4 h-4 text-sky-400 shrink-0" />}
                <span className="truncate">{file.originalName}</span>
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-dash-muted uppercase tracking-widest">
                <span>{file.mimeType}</span>
                <span>·</span>
                <span>{formatFileSize(file.sizeBytes)}</span>
              </div>
            </div>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-dash-accent/80 hover:text-dash-accent bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-lg transition-all shrink-0 self-start md:self-center"
            >
              <span>Open in Gateway</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </DialogHeader>

        {/* Core Media Analyzer Pane */}
        <div className="flex-1 min-h-0 bg-dash-bg/60 border border-dash-border/60 rounded-xl my-4 flex items-center justify-center overflow-hidden relative group/pane">
          {isImage && (
            <div className="w-full h-full p-4 flex items-center justify-center">
              <img
                src={fileUrl}
                alt={file.originalName}
                className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-lg select-none"
              />
            </div>
          )}

          {isVideo && (
            <div className="w-full h-full p-4 flex items-center justify-center">
              <video
                src={fileUrl}
                controls
                className="max-w-full max-h-[55vh] rounded-lg shadow-lg"
              />
            </div>
          )}

          {isPdf && (
            <iframe
              src={fileUrl}
              className="w-full h-full min-h-[55vh] rounded-lg border-0"
              title={file.originalName}
            />
          )}

          {!isImage && !isVideo && !isPdf && (
            <div className="p-8 text-center space-y-3">
              <FileText className="w-12 h-12 text-dash-muted/40 mx-auto" />
              <p className="text-sm font-bold uppercase tracking-wider text-dash-muted">No Direct Preview Available</p>
              <p className="text-xs text-dash-muted/70 max-w-sm mx-auto">
                This file format is not supported for inline visualization. Use the Gateway button to download or open the file.
              </p>
            </div>
          )}
        </div>

        {/* Forensic Metadata Strip */}
        <div className="border-t border-dash-border pt-4 space-y-3 text-xs bg-dash-card">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* SHA-256 Hash */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-dash-muted uppercase tracking-widest block">Digital Fingerprint (SHA-256)</span>
              <div className="flex items-center gap-2 bg-dash-input/60 rounded-lg border border-dash-border/80 px-3 py-2 group/field">
                <span className="font-mono text-dash-accent/90 break-all select-all text-[11px] flex-1">
                  {file.sha256Hash}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopyHash}
                  className="shrink-0 text-dash-muted hover:text-dash-accent"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {/* IPFS CID */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-dash-muted uppercase tracking-widest block">IPFS Content Identifier (CID)</span>
              <div className="flex items-center gap-2 bg-dash-input/60 rounded-lg border border-dash-border/80 px-3 py-2 group/field">
                <span className="font-mono text-dash-accent/90 break-all select-all text-[11px] flex-1">
                  {file.ipfsCid}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopyCid}
                  className="shrink-0 text-dash-muted hover:text-dash-accent"
                >
                  {copiedCid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
