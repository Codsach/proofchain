"use client";
 
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { FolderOpen, Brain, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusGroup, STATUS_COLORS } from "@/lib/statusConfig";

type InvestigatorCase = {
  _id: string;
  caseId: string;
  title: string;
  incidentType: string;
  status: string;
  createdAt: string;
};

interface InvestigatorChartsProps {
  cases: InvestigatorCase[];
  selectedCaseId: string | null;
  hoveredCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onHoverCase: (caseId: string | null) => void;
}

export function InvestigatorCharts({
  cases,
  selectedCaseId,
  hoveredCaseId,
  onSelectCase,
  onHoverCase,
}: InvestigatorChartsProps) {
  // Keep track of active segment for accessible legend and chart interaction
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 1. Evidence Submission Trends
  const submissionTrends = useMemo(() => {
    const countsByDate: Record<string, number> = {};
    
    // Sort cases by date ascending so the chart goes left-to-right
    const sorted = [...cases].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    sorted.forEach((c) => {
      const d = new Date(c.createdAt);
      // Format as MM/DD
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    });

    return Object.entries(countsByDate).map(([date, count]) => ({
      date,
      submissions: count,
    }));
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

    // We maintain a strict, stable ordering for index-based highlight mapping
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

  // Calculate center total based on sum of visible segment values
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
        // Append active case to the timeline so the user can interact with it
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
      
      {/* 1. Gantt Timeline (Custom HTML/CSS) */}
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
          className="rounded-2xl border border-dash-border border-l-4 border-l-amber-500 bg-dash-card p-6 shadow-sm relative min-w-0 flex flex-col min-h-[300px] justify-between"
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
          
          {/* Reusable legend generated from matching segments, fully interactive */}
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

        {/* 3. Evidence Submission Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-dash-border border-l-4 border-l-emerald-500 bg-dash-card p-6 shadow-sm min-w-0 flex flex-col min-h-[220px]"
        >
          <h3 className="type-card-heading text-dash-text mb-6">Submission Trends</h3>
          {cases.length > 0 ? (
            <div className="h-[150px] w-full flex-grow min-w-0 overflow-hidden">
              <ChartContainer config={{ submissions: { label: "Submissions", color: "var(--dash-accent)" } }} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={submissionTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--dash-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--dash-muted)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="submissions"
                      stroke="var(--dash-accent)"
                      strokeWidth={3}
                      dot={{ r: 3, fill: "var(--dash-card)", strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: "var(--dash-accent)" }}
                      isAnimationActive={true}
                      animationDuration={300}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center flex-grow">
              <div className="w-10 h-10 rounded-full bg-dash-input flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-dash-muted/40" />
              </div>
              <p className="text-xs font-bold text-dash-text">No submission trends</p>
              <p className="text-[10px] text-dash-muted mt-1">No data matches current search parameters.</p>
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
}
