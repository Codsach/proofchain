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
  RadialBarChart,
  RadialBar,
  Legend
} from "recharts";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// --- Mock Data ---

const volumeData = [
  { name: "Jan", cases: 120 }, { name: "Feb", cases: 210 }, { name: "Mar", cases: 180 },
  { name: "Apr", cases: 290 }, { name: "May", cases: 350 }, { name: "Jun", cases: 420 },
  { name: "Jul", cases: 380 }, { name: "Aug", cases: 490 }, { name: "Sep", cases: 550 },
];

const riskData = [
  { name: "Low Risk", value: 65, color: "#10b981" },
  { name: "Medium Risk", value: 25, color: "#f59e0b" },
  { name: "High Risk", value: 10, color: "#f43f5e" },
];

const tamperScoreData = [
  { range: "0-10", count: 400 }, { range: "11-20", count: 120 },
  { range: "21-30", count: 80 }, { range: "31-40", count: 40 },
  { range: "41-50", count: 20 }, { range: "51-60", count: 15 },
  { range: "61-70", count: 25 }, { range: "71-80", count: 45 },
  { range: "81-90", count: 90 }, { range: "91-100", count: 150 },
];

const statusBreakdownData = [
  { date: "Week 1", pending: 40, verified: 120, rejected: 10 },
  { date: "Week 2", pending: 50, verified: 150, rejected: 15 },
  { date: "Week 3", pending: 30, verified: 180, rejected: 20 },
  { date: "Week 4", pending: 60, verified: 200, rejected: 25 },
];

const aiPerformanceData = [
  { name: "Analysts", fill: "#3b82f6", value: 85 },
  { name: "AI Agent", fill: "#10b981", value: 96 },
];

// Map markers
const markers = [
  { markerOffset: -15, name: "New York", coordinates: [-74.006, 40.7128] as [number, number] },
  { markerOffset: -15, name: "London", coordinates: [-0.1276, 51.5072] as [number, number] },
  { markerOffset: -15, name: "Tokyo", coordinates: [139.6917, 35.6895] as [number, number] },
  { markerOffset: 15, name: "Singapore", coordinates: [103.8198, 1.3521] as [number, number] },
  { markerOffset: 15, name: "Sydney", coordinates: [151.2093, -33.8688] as [number, number] },
];

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Heatmap Data (Days x Hours)
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const heatmapData = days.map((day) =>
  Array.from({ length: 24 }).map((_, hour) => ({
    day,
    hour,
    value: Math.floor(Math.random() * 100), // Random intensity
  }))
);

// --- Component ---

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
      
      {/* 1. Case Volume Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-dash-border bg-dash-card p-6 col-span-1 xl:col-span-2 shadow-xl"
      >
        <h3 className="text-sm font-bold text-dash-text uppercase tracking-widest mb-6">Case Volume Over Time</h3>
        <div className="h-[300px] w-full">
          <ChartContainer config={{ cases: { label: "Cases", color: "var(--dash-accent)" } }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="cases"
                  stroke="var(--dash-accent)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--dash-card)", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "var(--dash-accent)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </motion.div>

      {/* 2. Risk Distribution & 5. Avg Resolution Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-dash-text uppercase tracking-widest mb-2">Risk Distribution</h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-dash-text">100%</span>
              <span className="text-[10px] text-dash-muted uppercase">Analyzed</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-dash-accent/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-dash-accent/20 transition-all" />
          <h3 className="text-sm font-bold text-dash-text uppercase tracking-widest mb-2 z-10">Avg Resolution Time</h3>
          <div className="flex flex-col gap-1 z-10 mt-4">
            <span className="text-5xl font-black text-dash-text tracking-tighter">1.4<span className="text-2xl text-dash-muted font-bold ml-1">hrs</span></span>
            <span className="text-sm text-dash-accent font-medium flex items-center gap-1">
              <span className="text-lg">↓</span> 12% faster than last week
            </span>
          </div>
          <div className="h-[60px] w-full mt-4 z-10 opacity-50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{v: 2.1}, {v: 1.8}, {v: 1.9}, {v: 1.6}, {v: 1.4}]}>
                <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* 4. Case Status Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl"
      >
        <h3 className="text-sm font-bold text-dash-text uppercase tracking-widest mb-6">Status Breakdown</h3>
        <div className="h-[250px] w-full">
          <ChartContainer config={{ 
            verified: { label: "Verified", color: "#10b981" },
            pending: { label: "Pending", color: "#f59e0b" },
            rejected: { label: "Rejected", color: "#f43f5e" }
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBreakdownData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="verified" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="pending" stackId="a" fill="#f59e0b" />
                <Bar dataKey="rejected" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </motion.div>

      {/* 3. Tamper Score Histogram */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl"
      >
        <h3 className="text-sm font-bold text-dash-text uppercase tracking-widest mb-6">Tamper Score Spread</h3>
        <div className="h-[250px] w-full">
          <ChartContainer config={{ count: { label: "Cases", color: "#8b5cf6" } }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tamperScoreData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap={1}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="range" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </motion.div>

      {/* 6. AI Analysis Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="rounded-2xl border border-dash-border bg-dash-card p-6 shadow-xl flex flex-col items-center justify-center relative"
      >
        <h3 className="text-sm font-bold text-dash-text uppercase tracking-widest absolute top-6 left-6">AI vs Human Accuracy</h3>
        <div className="h-[250px] w-full mt-6 flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={24} data={aiPerformanceData} startAngle={180} endAngle={-180}>
              <RadialBar background={{ fill: '#1f1f1f' }} dataKey="value" cornerRadius={10} />
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0, color: '#fff' }} />
              <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 7. Peak Submission Hours Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="rounded-2xl border border-dash-border bg-dash-card p-6 col-span-1 xl:col-span-2 shadow-xl overflow-x-auto"
      >
        <h3 className="text-sm font-bold text-dash-text uppercase tracking-widest mb-6">Peak Submission Hours</h3>
        <div className="min-w-[600px]">
          <div className="flex mb-2">
            <div className="w-10"></div>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 text-center text-[10px] text-dash-muted">{i}</div>
            ))}
          </div>
          <div className="space-y-1">
            {heatmapData.map((dayData, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-10 text-xs font-medium text-dash-muted text-right pr-2">{dayData[0].day}</div>
                {dayData.map((h, j) => {
                  const intensity = h.value;
                  let bg = "bg-dash-sidebar";
                  if (intensity > 80) bg = "bg-dash-accent";
                  else if (intensity > 60) bg = "bg-emerald-500/80";
                  else if (intensity > 40) bg = "bg-emerald-600/60";
                  else if (intensity > 20) bg = "bg-emerald-800/40";
                  return (
                    <div 
                      key={j} 
                      className={`flex-1 aspect-square rounded-sm ${bg} hover:ring-2 ring-white/50 transition-all cursor-crosshair`}
                      title={`${h.day} ${h.hour}:00 - ${h.value} cases`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 8. Geographic Distribution Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="rounded-2xl border border-dash-border bg-dash-card p-6 col-span-1 xl:col-span-2 shadow-xl"
      >
        <h3 className="text-sm font-bold text-dash-text uppercase tracking-widest mb-6">Geographic Case Origins</h3>
        <div className="h-[400px] w-full bg-[#050505] rounded-xl overflow-hidden relative">
          <ComposableMap projectionConfig={{ scale: 140 }}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#151515"
                    stroke="#2a2a2a"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#1f1f1f", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
            {markers.map(({ name, coordinates, markerOffset }) => (
              <Marker key={name} coordinates={coordinates}>
                <circle r={4} fill="var(--dash-accent)" stroke="#fff" strokeWidth={1} className="animate-pulse" />
                <text
                  textAnchor="middle"
                  y={markerOffset}
                  style={{ fontFamily: "system-ui", fill: "#888", fontSize: "10px", fontWeight: "bold" }}
                >
                  {name}
                </text>
              </Marker>
            ))}
          </ComposableMap>
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-dash-card/50 to-transparent pointer-events-none" />
        </div>
      </motion.div>

    </div>
  );
}
