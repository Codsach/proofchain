"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, 
  ArrowRightLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export interface TimelineNode {
  id: string;
  type: "upload" | "transfer" | "verdict";
  title: string;
  subtitle?: string;
  description?: string;
  timestamp: string;
  txHash?: string | null;
  actorName?: string;
  actorRole?: string;
  recipientName?: string;
  recipientRole?: string;
  verdictType?: "verified" | "rejected";
  isActive?: boolean;
}

interface CustodyTimelineProps {
  nodes: TimelineNode[];
  isPublic?: boolean;
  className?: string;
}

export function CustodyTimeline({ nodes, isPublic = false, className }: CustodyTimelineProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getIcon = (type: TimelineNode["type"], verdictType?: TimelineNode["verdictType"]) => {
    switch (type) {
      case "upload":
        return <UploadCloud className="w-[15px] h-[15px] text-emerald-400" />;
      case "verdict":
        return verdictType === "verified" ? (
          <CheckCircle2 className="w-[15px] h-[15px] text-emerald-400" />
        ) : (
          <XCircle className="w-[15px] h-[15px] text-rose-400" />
        );
      case "transfer":
      default:
        return <ArrowRightLeft className="w-[15px] h-[15px] text-blue-400" />;
    }
  };

  const formatRole = (role?: string) => {
    if (!role) return "";
    return role.toUpperCase();
  };

  return (
    <div className={cn("rounded-2xl border border-dash-border bg-dash-card backdrop-blur-xl p-6 shadow-2xl space-y-6", className)}>
      {/* Widget Header with Pulse */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="type-section-heading text-dash-text">
            Custody Chain Flow
          </h2>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <span className="text-[10px] font-bold text-dash-accent/60 uppercase tracking-widest">
          {nodes.length} Events
        </span>
      </div>

      {/* Timeline Scroll Container */}
      <div className="max-h-[480px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {nodes.length === 0 ? (
          <div className="text-center py-12 text-xs text-dash-muted/40">
            No custody events recorded.
          </div>
        ) : (
          <div className="relative ml-4 pl-6 border-l border-dash-border/30 space-y-6 py-2">
            {nodes.slice().reverse().map((node, index) => {
              const isExpanded = expandedNodes[node.id];
              const isLatest = index === 0;

              return (
                <div key={node.id} className="relative group">
                  {/* Timeline Node Point */}
                  <div className={`absolute -left-[38px] top-[4px] flex items-center justify-center w-7 h-7 rounded-full border bg-dash-bg transition-all ${
                    isLatest 
                      ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] scale-110" 
                      : "border-dash-border/60 group-hover:border-dash-accent/50"
                  }`}>
                    {getIcon(node.type, node.verdictType)}
                  </div>

                  {/* Node Card */}
                  <div className={`rounded-xl border p-4 transition-all duration-300 ${
                    isLatest 
                      ? "border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.02)]" 
                      : "border-dash-border bg-dash-card/50 hover:bg-dash-card"
                  }`}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            node.type === "upload" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : node.type === "verdict"
                                ? node.verdictType === "verified"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                            {node.type}
                          </span>
                          <span className="text-[10px] text-dash-muted font-medium">
                            {new Date(node.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-dash-text uppercase tracking-tight mt-1.5">
                          {node.title}
                        </p>
                      </div>

                      {/* Expand Button */}
                      {(node.description || node.txHash || node.subtitle) && (
                        <button
                          onClick={() => toggleExpand(node.id)}
                          className="text-dash-muted hover:text-dash-text transition-colors p-1"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>

                    {/* Collapsible Content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden mt-3 pt-3 border-t border-dash-border/40 space-y-3"
                        >
                          {node.subtitle && (
                            <p className="text-[11px] font-medium text-dash-text/80">
                              {node.subtitle}
                            </p>
                          )}

                          {node.description && (
                            <p className="text-[11px] text-dash-muted leading-relaxed italic">
                              "{node.description}"
                            </p>
                          )}

                          {/* Actors info */}
                          {!isPublic && (node.actorName || node.recipientName) && (
                            <div className="grid grid-cols-2 gap-4 text-[10px] bg-dash-bg/40 p-2.5 rounded-lg border border-dash-border">
                              {node.actorName && (
                                <div>
                                  <span className="text-dash-muted/80 uppercase font-bold tracking-wider block">Actor</span>
                                  <span className="text-dash-text font-medium">{node.actorName}</span>
                                  <span className="text-dash-muted block mt-0.5">{formatRole(node.actorRole)}</span>
                                </div>
                              )}
                              {node.recipientName && (
                                <div>
                                  <span className="text-dash-muted/80 uppercase font-bold tracking-wider block">Recipient</span>
                                  <span className="text-dash-text font-medium">{node.recipientName}</span>
                                  <span className="text-dash-muted block mt-0.5">{formatRole(node.recipientRole)}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Transaction hash link */}
                          {node.txHash && (
                            <div className="flex items-center justify-between bg-dash-bg/50 p-2 rounded-lg border border-dash-border type-technical text-dash-muted">
                              <span className="text-[11px] font-sans text-dash-muted/80 uppercase font-bold tracking-wider">Anchor Tx</span>
                              <a
                                href={`https://amoy.polygonscan.com/tx/${node.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-dash-accent hover:text-emerald-300 transition-colors flex items-center gap-1"
                              >
                                <span className="truncate max-w-[150px]">{node.txHash}</span>
                                <ExternalLink size={10} />
                              </a>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
