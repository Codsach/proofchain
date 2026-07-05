"use client";
 
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts";
import {
  FolderOpen,
  Brain,
  Clock,
  Cpu,
  ShieldAlert,
  Database,
  CheckCircle2,
  ShieldCheck,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusGroup, STATUS_COLORS } from "@/lib/statusConfig";

type InvestigatorCase = {
  _id: string;
  caseId: string;
  title: string;
  incidentType: string;
  status: string;
  createdAt: string;
  overallTamperScore: number | null;
  overallRiskLevel: "low" | "medium" | "high" | null;
  onChainTxHash: string | null;
  files: Array<{
    fileId: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    gpsLat: number | null;
    gpsLng: number | null;
  }>;
};

interface InvestigatorChartsProps {
  cases: InvestigatorCase[];
  aiFilter: string | null;
  onApplyAiFilter: (filter: string | null) => void;
  selectedCaseId: string | null;
  hoveredCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onHoverCase: (caseId: string | null) => void;
}

export function InvestigatorCharts({
  cases,
  aiFilter,
  onApplyAiFilter,
  selectedCaseId,
  hoveredCaseId,
  onSelectCase,
  onHoverCase,
}: InvestigatorChartsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 1. Calculate dynamic AI insights list based on the active filtered cases
  const insights = useMemo(() => {
    // Total Files
    const totalFiles = cases.reduce((sum, c) => sum + (c.files?.length || 0), 0);
    
    // Files missing GPS coordinates
    const missingGps = cases.reduce((sum, c) => sum + (c.files?.filter(f => f.gpsLat === null || f.gpsLng === null).length || 0), 0);
    
    // Medium risk/tamper warnings
    const inconsistencies = cases.filter(c => c.overallRiskLevel === "medium" || (c.overallTamperScore !== null && c.overallTamperScore > 30 && c.overallTamperScore <= 60)).length;
    
    // Critical tampering
    const tampering = cases.filter(c => c.overallRiskLevel === "high" || (c.overallTamperScore !== null && c.overallTamperScore > 60)).length;
    
    // Blockchain verification anchors
    const blockchain = cases.filter(c => c.onChainTxHash !== null).length;
    
    // Authenticity verified files (low tamper scores)
    const validated = cases.filter(c => c.overallRiskLevel === "low" || (c.overallTamperScore !== null && c.overallTamperScore <= 30)).reduce((sum, c) => sum + (c.files?.length || 0), 0);

    // PDF files
    const pdfs = cases.reduce((sum, c) => sum + (c.files?.filter(f => f.mimeType === "application/pdf" || f.originalName.toLowerCase().endsWith(".pdf")).length || 0), 0);

    const list = [];

    // 1. Critical tampering row
    if (tampering > 0) {
      list.push({
        id: "tampering",
        type: "tampering",
        icon: ShieldAlert,
        colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        message: `${tampering} potential evidence tampering detected`,
        severity: "critical" as const,
      });
    }

    // 2. Warning metadata inconsistencies
    if (inconsistencies > 0) {
      list.push({
        id: "inconsistency",
        type: "inconsistency",
        icon: ShieldAlert,
        colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        message: `${inconsistencies} potential metadata inconsistency detected`,
        severity: "warning" as const,
      });
    }

    // 3. Warning missing GPS
    if (missingGps > 0) {
      list.push({
        id: "missing_gps",
        type: "missing_gps",
        icon: MapPin,
        colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        message: `${missingGps} file${missingGps > 1 ? "s" : ""} missing GPS metadata`,
        severity: "warning" as const,
      });
    }

    // 4. Healthy validation row
    if (validated > 0) {
      list.push({
        id: "validated",
        type: "validated",
        icon: CheckCircle2,
        colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        message: `${validated} file${validated > 1 ? "s" : ""} passed authenticity validation`,
        severity: "healthy" as const,
      });
    }

    // 5. Healthy blockchain row
    if (blockchain > 0) {
      list.push({
        id: "blockchain",
        type: "blockchain",
        icon: Database,
        colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        message: `${blockchain} blockchain anchor${blockchain > 1 ? "s" : ""} verified`,
        severity: "healthy" as const,
      });
    }

    // 6. PDF validation check
    if (pdfs > 0) {
      list.push({
        id: "pdf",
        type: "pdf",
        icon: ShieldCheck,
        colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        message: `${pdfs} PDF${pdfs > 1 ? "s" : ""} contain verified text layers`,
        severity: "info" as const,
      });
    }

    // 7. Info general analyzed row (always visible as long as files exist)
    if (totalFiles > 0) {
      list.push({
        id: "processed",
        type: "processed",
        icon: Cpu,
        colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        message: `AI processed ${totalFiles} evidence file${totalFiles > 1 ? "s" : ""}`,
        severity: "info" as const,
      });
    }

    return list.slice(0, 6);
  }, [cases]);

  // Check if cases exist but all of them are pending AI review (score is null)
  const isAiPending = useMemo(() => {
    return cases.length > 0 && cases.every(c => c.overallTamperScore === null);
  }, [cases]);

  // 2. Verdict Outcomes (Pie Chart) - Unified status configuration mapping
  const verdictOutcomes = useMemo(() => {
    let pending = 0;
    let verified = 0;
    let rejected = 0;

    cases.forEach((c) => {
      const group = getStatusGroup(c.status);
      if (group === "verified") verified++;
      else if (group === "rejected") rejected++;
      else pending++;
    });

    return [
      { 
        name: STATUS_COLORS.verified.label, 
        value: verified, 
        color: STATUS_COLORS.verified.hex, 
        group: "verified" as const 
      },
      { 
        name: STATUS_COLORS.rejected.label, 
        value: rejected, 
        color: STATUS_COLORS.rejected.hex, 
        group: "rejected" as const 
      },
      { 
        name: STATUS_COLORS.pending.label, 
        value: pending, 
        color: STATUS_COLORS.pending.hex, 
        group: "pending" as const 
      },
    ];
  }, [cases]);

  const totalVisible = useMemo(() => {
    return verdictOutcomes.reduce((sum, item) => sum + item.value, 0);
  }, [verdictOutcomes]);

  // 3. Gantt Timeline data
  // We'll take the 5 most recent cases, but ensure the selected/hovered case is included if it exists in cases
  const ganttCases = useMemo(() => {
    const sorted = [...cases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limit = 5;
    
    let topCases = sorted.slice(0, limit);
    const activeId = selectedCaseId || hoveredCaseId;
    
    if (activeId) {
      const activeCase = sorted.find(c => c.caseId === activeId);
      if (activeCase && !topCases.some(c => c.caseId === activeId)) {
        topCases = [...topCases, activeCase];
      }
    }

    return topCases.map(c => {
      let progress = 30; // Pending AI
      if (["pending_review", "under_review"].includes(c.status)) progress = 60;
      if (["verified", "resolved", "rejected"].includes(c.status)) progress = 100;

      return {
        ...c,
        progress,
      };
    });
  }, [cases, selectedCaseId, hoveredCaseId]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6 mb-10">
      
      {/* 1. Gantt Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-dash-border border-l-4 border-l-slate-400 bg-dash-card p-6 shadow-sm col-span-1 xl:col-span-2 min-w-0"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="type-card-heading text-dash-text">My Cases Timeline</h3>
          <span className="text-[10px] text-dash-muted font-bold tracking-widest uppercase italic">Live Progression</span>
        </div>
        
        <div className="space-y-6">
          {cases.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {ganttCases.map((c) => {
                const isSelected = c.caseId === selectedCaseId;
                const isHovered = c.caseId === hoveredCaseId;
                const isHighlighted = isSelected || isHovered;
                const group = getStatusGroup(c.status);
                
                const badgeColors = group === "verified"
                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  : group === "rejected"
                    ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
                
                return (
                  <motion.div
                    key={c.caseId}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    onClick={() => onSelectCase(c.caseId)}
                    onMouseEnter={() => onHoverCase(c.caseId)}
                    onMouseLeave={() => onHoverCase(null)}
                    className={cn(
                      "relative p-3.5 rounded-xl border border-transparent transition-all duration-300 cursor-pointer select-none",
                      isHighlighted 
                        ? "bg-[var(--dash-active-bg)] border-[var(--dash-accent)]/20 shadow-sm"
                        : "hover:bg-dash-hover/40 hover:border-dash-border/60"
                    )}
                  >
                    <div className="flex justify-between items-start text-xs mb-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-dash-text truncate pr-4 max-w-[240px] group-hover:text-dash-accent transition-colors">
                          {c.title}
                        </span>
                        <span className="text-[10px] text-dash-muted/70 mt-0.5 font-medium">
                          Submitted {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(c.createdAt))}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border",
                          badgeColors
                        )}>
                          {c.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-[9px] text-dash-muted uppercase font-bold tracking-wider font-mono">
                          Progress: {c.progress}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-dash-input rounded-full overflow-hidden flex relative mt-2.5">
                      <div className="absolute top-0 bottom-0 left-1/3 w-px bg-dash-border/40 z-10"></div>
                      <div className="absolute top-0 bottom-0 left-2/3 w-px bg-dash-border/40 z-10"></div>
                      
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${c.progress}%` }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="h-full rounded-full relative"
                        style={{
                          backgroundColor: STATUS_COLORS[group].var
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
                      </motion.div>
                    </div>

                    <div className="flex justify-between text-[9px] text-dash-muted/40 mt-1.5 uppercase font-bold tracking-widest">
                      <span>Submitted</span>
                      <span>Reviewing</span>
                      <span>Resolved</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-dash-input flex items-center justify-center mb-3">
                <FolderOpen className="w-6 h-6 text-dash-muted/40" />
              </div>
              <p className="text-sm font-bold text-dash-text">No cases matching active filters</p>
              <p className="text-xs text-dash-muted max-w-xs mt-1">
                No records found in the registry for this query. Try resetting filters.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6 col-span-1">
        {/* 2. Verdict Outcomes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-dash-border border-l-4 border-l-amber-500 bg-dash-card p-6 shadow-sm relative min-w-0 flex flex-col min-h-[300px] justify-between animate-in fade-in duration-300"
        >
          <h3 className="type-card-heading text-dash-text mb-2 z-10">Verdict Outcomes</h3>
          
          {totalVisible > 0 ? (
            <div className="h-[180px] w-full relative flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verdictOutcomes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={true}
                    animationDuration={300}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {verdictOutcomes.map((entry, index) => {
                      const isHovered = activeIndex === index;
                      const opacity = activeIndex === null ? 1 : isHovered ? 1 : 0.4;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          opacity={opacity}
                          className="transition-all duration-200 cursor-pointer outline-none"
                          style={{
                            filter: isHovered ? `drop-shadow(0 0 5px ${entry.color}a0)` : 'none',
                          }}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--dash-text)' }}
                    formatter={(value: any, name: any) => [`${value} cases`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Summary */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-2xl font-bold text-dash-text">{totalVisible}</span>
                <span className="text-[9px] text-dash-muted uppercase tracking-widest font-bold">Total</span>
              </div>
            </div>
          ) : (
            <div className="h-[180px] w-full flex flex-col items-center justify-center text-center flex-grow">
              <div className="w-10 h-10 rounded-full bg-dash-input flex items-center justify-center mb-2">
                <Brain className="w-5 h-5 text-dash-muted/40" />
              </div>
              <p className="text-xs font-bold text-dash-text">No verdict data available</p>
              <p className="text-[10px] text-dash-muted mt-1">Adjust filters to see outcomes.</p>
            </div>
          )}
          
          <div className="flex flex-wrap justify-center gap-2 mt-2 pt-2 border-t border-dash-border/40 select-none">
            {verdictOutcomes.map((v, index) => {
              const isHovered = activeIndex === index;
              return (
                <div 
                  key={v.name} 
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded border border-transparent transition-all duration-200 cursor-pointer",
                    isHovered 
                      ? "bg-dash-hover border-dash-border scale-105" 
                      : "hover:bg-dash-hover/40"
                  )}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: v.color }}></div>
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider font-bold",
                    isHovered ? "text-dash-text" : "text-dash-muted"
                  )}>
                    {v.name} ({v.value})
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 3. AI Insights Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-dash-border border-l-4 border-l-emerald-500 bg-dash-card p-6 shadow-sm min-w-0 flex flex-col min-h-[300px] justify-between"
        >
          <div className="flex flex-col gap-1 mb-3">
            <h3 className="type-card-heading text-dash-text">AI Insights</h3>
            <p className="text-[10px] text-dash-muted font-medium">
              Automated analysis of your assigned evidence.
            </p>
          </div>

          {isAiPending ? (
            <div className="h-[185px] w-full flex flex-col items-center justify-center text-center flex-grow select-none">
              <div className="w-10 h-10 rounded-full bg-dash-input flex items-center justify-center mb-2">
                <Brain className="w-5 h-5 text-dash-muted/40 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-dash-text">AI Analysis Pending</p>
              <p className="text-[10px] text-dash-muted mt-1 max-w-[200px] leading-normal mx-auto">
                Upload or process evidence to receive automated forensic insights.
              </p>
            </div>
          ) : insights.length > 0 ? (
            <div className="h-[185px] overflow-y-auto pr-1 space-y-2 custom-scrollbar flex-grow">
              <AnimatePresence mode="popLayout">
                {insights.map((insight) => {
                  const IconComp = insight.icon;
                  const isActive = aiFilter === insight.type;
                  
                  return (
                    <motion.div
                      key={insight.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.28 }}
                      onClick={() => {
                        if (insight.type !== "processed") {
                          onApplyAiFilter(isActive ? null : insight.type);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl transition-all border border-transparent select-none group border-b border-dash-border/30 last:border-0 pb-2.5",
                        insight.type !== "processed" 
                          ? cn(
                              "cursor-pointer hover:bg-dash-hover/40 hover:border-dash-border/40",
                              isActive && "bg-[var(--dash-active-bg)] border-[var(--dash-accent)]/20 shadow-3xs"
                            ) 
                          : "cursor-default"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center border shrink-0",
                        configColorOverrides(insight.type, insight.colorClass, isActive)
                      )}>
                        <IconComp className="w-3.5 h-3.5 stroke-[2.2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs font-bold text-dash-text leading-tight group-hover:text-dash-accent transition-colors",
                          isActive && "text-[var(--dash-active-text)]"
                        )}>
                          {insight.message}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-[185px] w-full flex flex-col items-center justify-center text-center flex-grow select-none">
              <div className="w-10 h-10 rounded-full bg-dash-input flex items-center justify-center mb-2">
                <Brain className="w-5 h-5 text-dash-muted/40" />
              </div>
              <p className="text-xs font-bold text-dash-text">No insights matching filters</p>
              <p className="text-[10px] text-dash-muted mt-1 max-w-[200px] leading-normal mx-auto">
                No active evidence fits the selected filters.
              </p>
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
}

// Subtle override for active state background icons
function configColorOverrides(type: string, colorClass: string, isActive: boolean): string {
  if (!isActive) return colorClass;
  switch (type) {
    case "tampering":
      return "text-rose-600 bg-rose-500/20 border-rose-500/35";
    case "inconsistency":
    case "missing_gps":
      return "text-amber-600 bg-amber-500/20 border-amber-500/35";
    case "validated":
      return "text-emerald-600 bg-emerald-500/20 border-emerald-500/35";
    default:
      return "text-blue-600 bg-blue-500/20 border-blue-500/35";
  }
}
