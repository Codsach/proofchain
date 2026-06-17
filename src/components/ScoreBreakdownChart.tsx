"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

interface ScoreBreakdownValue {
  points: number;
  detail: string;
}

interface Props {
  scoreBreakdown: Record<string, ScoreBreakdownValue>;
}

const SIGNAL_LABELS: Record<string, string> = {
  editing_software: "Editing Software Detected",
  modification_after_creation: "Modified After Creation",
  gps_absent: "GPS Absent (Field Incident)",
  gps_absent_on_field_incident: "GPS Absent (Field Incident)",
  no_creation_timestamp: "No Creation Timestamp",
  gemini_high: "AI Visual Analysis: High Risk",
  gemini_medium: "AI Visual Analysis: Medium Risk",
  pdf_no_text_layer: "PDF: No Text Layer (Scanned)",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-white/10 bg-black/90 p-3 shadow-2xl backdrop-blur-md max-w-[260px] text-[11px] leading-relaxed">
        <p className="font-bold text-white/40 uppercase tracking-widest mb-1.5">{data.name}</p>
        <p className="text-white/80 font-semibold mb-2">{data.detail}</p>
        <div className="flex items-center gap-1.5 font-mono font-bold" style={{ color: data.color }}>
          <span>⚡ severity impact:</span>
          <span>+{data.points} pts</span>
        </div>
      </div>
    );
  }
  return null;
};

export function ScoreBreakdownChart({ scoreBreakdown }: Props) {
  const data = Object.entries(scoreBreakdown)
    .map(([key, value]) => {
      const name = SIGNAL_LABELS[key] || key;
      const color =
        value.points >= 25
          ? "#F43F5E" // Rose/Red
          : value.points >= 15
          ? "#F59E0B" // Amber
          : "#10B981"; // Emerald
      return {
        key,
        name,
        points: value.points,
        detail: value.detail,
        color,
      };
    })
    .sort((a, b) => b.points - a.points);

  if (data.length === 0) {
    return null;
  }

  // Adjust height dynamically based on data rows to prevent squeezing
  const rowHeight = 36;
  const chartHeight = data.length * rowHeight + 30;

  return (
    <div className="w-full rounded-xl bg-white/[0.01] border border-white/5 p-4 shadow-inner">
      <div className="w-full" style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 15, left: -15, bottom: 5 }}
            barSize={12}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.03)"
              horizontal={false}
            />
            
            <XAxis
              type="number"
              domain={[0, 30]}
              tickCount={4}
              stroke="rgba(255, 255, 255, 0.2)"
              tickLine={false}
              axisLine={false}
              fontSize={9}
              className="font-mono text-white/40"
            />
            
            <YAxis
              type="category"
              dataKey="name"
              stroke="rgba(255, 255, 255, 0.4)"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              width={160}
              className="font-sans font-medium text-white/50"
              tick={(props) => {
                const { x, y, payload } = props;
                // Truncate long labels for visual balance
                const text = payload.value;
                const maxLength = 26;
                const truncated = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
                const yVal = typeof y === "number" ? y : parseFloat(y) || 0;
                return (
                  <text
                    x={x}
                    y={yVal + 3}
                    textAnchor="end"
                    fill="rgba(255, 255, 255, 0.5)"
                    className="text-[10px] font-semibold tracking-tight"
                  >
                    {truncated}
                  </text>
                );
              }}
            />
            
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255, 255, 255, 0.02)", radius: 6 }}
            />
            
            <Bar
              dataKey="points"
              radius={[0, 4, 4, 0]}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
