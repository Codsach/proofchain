"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
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
  BarChart,
  Bar,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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
}

// Map the existing statuses to logical buckets
const STATUS_BUCKETS = {
  PENDING: ["pending_ai_review", "pending_review", "under_review", "ai_timeout"],
  VERIFIED: ["verified", "resolved"],
  REJECTED: ["rejected"],
};

export function InvestigatorCharts({ cases }: InvestigatorChartsProps) {
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

  // 2. Verdict Outcomes (Pie Chart)
  const verdictOutcomes = useMemo(() => {
    let pending = 0;
    let verified = 0;
    let rejected = 0;

    cases.forEach((c) => {
      if (STATUS_BUCKETS.VERIFIED.includes(c.status)) verified++;
      else if (STATUS_BUCKETS.REJECTED.includes(c.status)) rejected++;
      else pending++;
    });

    return [
      { name: "Verified", value: verified, color: "var(--dash-info)" },
      { name: "Rejected", value: rejected, color: "var(--dash-danger)" },
      { name: "Pending Review", value: pending, color: "var(--dash-accent)" },
    ];
  }, [cases]);

  // 3. Gantt Timeline data
  // We'll take the 5 most recent cases
  const ganttCases = useMemo(() => {
    return [...cases]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(c => {
        // Mock timelines for the visual based on status
        // Assume case timeline takes max 2 hours visually for this mockup
        const start = new Date(c.createdAt).getTime();
        const now = new Date().getTime();
        
        let progress = 30; // Pending AI
        if (["pending_review", "under_review"].includes(c.status)) progress = 60;
        if (["verified", "resolved", "rejected"].includes(c.status)) progress = 100;

        return {
          ...c,
          progress,
        };
      });
  }, [cases]);

  if (cases.length === 0) {
    return null; // Don't render charts if there's no data
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6 mb-10">
      
      {/* 1. Gantt Timeline (Custom HTML/CSS) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-dash-border border-l-4 border-l-slate-400 bg-dash-card p-6 shadow-sm col-span-1 xl:col-span-2 min-w-0"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-dash-text uppercase tracking-widest">My Cases Timeline</h3>
          <span className="text-[10px] text-dash-muted font-bold tracking-widest uppercase italic">Live Progression</span>
        </div>
        
        <div className="space-y-5">
          {ganttCases.length > 0 ? ganttCases.map((c, i) => (
            <div key={c._id} className="relative">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-bold text-dash-text truncate pr-4 max-w-[200px]">{c.title}</span>
                <span className="text-dash-muted uppercase font-mono text-[9px]">{c.status.replace(/_/g, " ")}</span>
              </div>
              <div className="h-3 w-full bg-dash-sidebar rounded-full overflow-hidden flex relative">
                {/* Visual checkpoints */}
                <div className="absolute top-0 bottom-0 left-1/3 w-px bg-dash-border/30 z-10"></div>
                <div className="absolute top-0 bottom-0 left-2/3 w-px bg-dash-border/30 z-10"></div>
                
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${c.progress}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className="h-full rounded-full relative"
                  style={{
                    backgroundColor: STATUS_BUCKETS.REJECTED.includes(c.status) 
                      ? 'var(--dash-danger)' 
                      : STATUS_BUCKETS.VERIFIED.includes(c.status)
                        ? 'var(--dash-info)'
                        : 'var(--dash-accent)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
                </motion.div>
              </div>
              <div className="flex justify-between text-[9px] text-dash-muted/50 mt-1 uppercase font-bold tracking-wider">
                <span>Submitted</span>
                <span>Reviewing</span>
                <span>Resolved</span>
              </div>
            </div>
          )) : (
            <div className="text-center text-dash-muted text-sm py-10">No recent cases to display.</div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6 col-span-1">
        {/* 2. Verdict Outcomes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border border-dash-border border-l-4 border-l-amber-500 bg-dash-card p-6 shadow-sm relative min-w-0 flex flex-col"
        >
          <h3 className="text-sm font-bold text-dash-text uppercase tracking-widest mb-2 z-10">Verdict Outcomes</h3>
          
          <div className="h-[200px] w-full relative flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verdictOutcomes.filter(v => v.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {verdictOutcomes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--dash-text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-2xl font-bold text-dash-text">{cases.length}</span>
              <span className="text-[9px] text-dash-muted uppercase tracking-widest">Total</span>
            </div>
          </div>
          
          {/* Custom Legend */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {verdictOutcomes.map((v) => (
              <div key={v.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }}></div>
                <span className="text-[10px] text-dash-muted uppercase tracking-wider font-bold">{v.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 3. Evidence Submission Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-dash-border border-l-4 border-l-emerald-500 bg-dash-card p-6 shadow-sm min-w-0 flex flex-col"
        >
          <h3 className="text-sm font-bold text-dash-text uppercase tracking-widest mb-6">Submission Trends</h3>
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
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
