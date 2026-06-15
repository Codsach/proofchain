"use client";

import { useState } from "react";
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
}

export function CustodyTimeline({ nodes, isPublic = false }: CustodyTimelineProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getIcon = (type: TimelineNode["type"], verdictType?: TimelineNode["verdictType"]) => {
    switch (type) {
      case "upload":
        return <UploadCloud className="w-4 h-4 text-emerald-400" />;
      case "verdict":
        return verdictType === "verified" ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <XCircle className="w-4 h-4 text-rose-400" />
        );
      case "transfer":
      default:
        return <ArrowRightLeft className="w-4 h-4 text-blue-400" />;
    }
  };

  const formatRole = (role?: string) => {
    if (!role) return "";
    return role.toUpperCase();
  };

  return (
    <div className="rounded-2xl border border-dash-border bg-dash-sidebar backdrop-blur-xl p-6 shadow-xl space-y-6">
      {/* Widget Header with Pulse */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">
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
          <div className="text-center py-12 text-xs text-white/30">
            No custody events recorded.
          </div>
        ) : (
          <div className="relative pl-6 border-l border-white/10 space-y-6 py-2">
            {nodes.slice().reverse().map((node, index) => {
              const isExpanded = expandedNodes[node.id];
              const isLatest = index === 0;

              return (
                <div key={node.id} className="relative group">
                  {/* Timeline Node Point */}
                  <div className={`absolute -left-[30px] top-1.5 flex items-center justify-center w-5 h-5 rounded-full border bg-black/80 transition-all ${
                    isLatest 
                      ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] scale-110" 
                      : "border-white/20 group-hover:border-white/40"
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
                          <span className="text-[10px] text-white/40 font-medium">
                            {new Date(node.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-white uppercase tracking-tight mt-1.5">
                          {node.title}
                        </p>
                      </div>

                      {/* Expand Button */}
                      {(node.description || node.txHash || node.subtitle) && (
                        <button
                          onClick={() => toggleExpand(node.id)}
                          className="text-white/40 hover:text-white transition-colors p-1"
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
                          className="overflow-hidden mt-3 pt-3 border-t border-white/5 space-y-3"
                        >
                          {node.subtitle && (
                            <p className="text-[11px] font-medium text-white/80">
                              {node.subtitle}
                            </p>
                          )}

                          {node.description && (
                            <p className="text-[11px] text-white/50 leading-relaxed italic">
                              "{node.description}"
                            </p>
                          )}

                          {/* Actors info */}
                          {!isPublic && (node.actorName || node.recipientName) && (
                            <div className="grid grid-cols-2 gap-4 text-[10px] bg-black/20 p-2.5 rounded-lg border border-white/5">
                              {node.actorName && (
                                <div>
                                  <span className="text-white/30 uppercase font-bold tracking-wider block">Actor</span>
                                  <span className="text-white font-medium">{node.actorName}</span>
                                  <span className="text-white/40 block mt-0.5">{formatRole(node.actorRole)}</span>
                                </div>
                              )}
                              {node.recipientName && (
                                <div>
                                  <span className="text-white/30 uppercase font-bold tracking-wider block">Recipient</span>
                                  <span className="text-white font-medium">{node.recipientName}</span>
                                  <span className="text-white/40 block mt-0.5">{formatRole(node.recipientRole)}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Transaction hash link */}
                          {node.txHash && (
                            <div className="flex items-center justify-between text-[9px] bg-black/40 p-2 rounded-lg border border-white/5 font-mono">
                              <span className="text-white/30 uppercase font-bold tracking-wider">Anchor Tx</span>
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
