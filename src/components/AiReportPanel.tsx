import { motion } from "framer-motion";
import { TamperGauge } from "./TamperGauge";
import { ScoreBreakdownChart } from "./ScoreBreakdownChart";

interface ExifData {
  software: string | null;
  gps_present: boolean;
  creation_timestamp: string | null;
  modification_timestamp: string | null;
  device: string | null;
  flags: string[];
}

interface GeminiResult {
  manipulation_likelihood: string;
  findings: string[];
  confidence: string;
}

interface AiReport {
  tamperScore: number;
  riskLevel: string;
  plainNotesSummary: string;
  exifData: ExifData;
  geminiResult: GeminiResult;
  scoreBreakdown: Record<string, { points: number; detail: string }>;
  analysedAt: string;
  status: string;
}

export const SIGNAL_LABELS: Record<string, string> = {
  editing_software: "Editing Software Detected",
  modification_after_creation: "Modified After Creation",
  gps_absent: "GPS Absent (Field Incident)",
  gps_absent_on_field_incident: "GPS Absent (Field Incident)",
  no_creation_timestamp: "No Creation Timestamp",
  gemini_high: "AI Visual Analysis: High Risk",
  gemini_medium: "AI Visual Analysis: Medium Risk",
  pdf_no_text_layer: "PDF: No Text Layer (Scanned)",
  thumbnail_dimension_mismatch: "Thumbnail Dimension Mismatch",
  gps_precision_anomaly: "GPS Precision Anomaly",
  future_timestamp: "Future Creation Timestamp",
  software_field_contradiction: "Software Field Contradiction",
  screenshot_tool_detected: "Screenshot Tool Detected",
  instant_modification: "Instant Modification",
  device_make_contradiction: "Device Make Contradiction",
  uncalibrated_color_space: "Uncalibrated Color Space",
  mime_mismatch: "MIME Type Spoofing Detected",
  office_macros_detected: "Office Document Macro Detected",
  video_reencoded: "Re-encoded Video Detection",
  av_timestamp_mismatch: "A/V Stream Timestamp Mismatch",
  av_duration_mismatch: "A/V Stream Duration Mismatch",
  ai_generated_image: "AI-Generated Image Analysis",
  pdf_javascript_detected: "PDF Embedded JavaScript Risk",
  pdf_hidden_layers_detected: "PDF Hidden Layers Detected",
};

interface Props {
  report: AiReport | null;
  isLoading?: boolean;
}

export function AiReportPanel({ report, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dash-border bg-dash-card/50 p-6 space-y-4 animate-pulse">
        <div className="h-4 bg-dash-input rounded-full w-1/3" />
        <div className="h-3 bg-dash-input rounded-full w-full" />
        <div className="h-3 bg-dash-input rounded-full w-2/3" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-2xl border border-dash-border bg-dash-card/50 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] font-bold text-dash-muted uppercase tracking-widest">
            Analysis Protocol In Progress...
          </p>
        </div>
      </div>
    );
  }

  const flagLabels: Record<string, string> = {
    editing_software_detected: "Editing software in metadata",
    modification_after_creation: "Modified after creation",
    gps_absent_on_field_incident: "GPS absent",
    no_creation_timestamp: "No creation timestamp",
    thumbnail_dimension_mismatch: "Thumbnail dimensions mismatch",
    gps_precision_anomaly: "GPS precision anomaly",
    future_timestamp: "Future creation timestamp",
    software_field_contradiction: "Software field contradiction",
    screenshot_tool_detected: "Screenshot tool detected",
    instant_modification: "Instant modification after creation",
    device_make_contradiction: "Device make contradiction",
    uncalibrated_color_space: "Uncalibrated color space",
    mime_mismatch_detected: "MIME type signature spoofed",
    office_macros_detected: "VBA Macro or OLE trigger detected",
    video_reencoded_detected: "Video re-encoded multiple times / modified",
    av_timestamp_mismatch_detected: "Audio/Video streams have timestamp mismatch",
    av_duration_mismatch_detected: "Audio/Video stream durations differ significantly",
    ai_generated_image_detected: "Image is likely AI-Generated (ViT Heuristics)",
    pdf_javascript_detected: "Embedded PDF JavaScript elements detected",
    pdf_hidden_layers_detected: "PDF Optional Content Groups (hidden layers) detected",
  };

  return (
    <div className="rounded-2xl border border-dash-border bg-dash-card backdrop-blur-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden group">
      {/* Background Decorative Element */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 blur-[100px] rounded-full group-hover:bg-emerald-500/10 transition-colors duration-700" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 relative">
        <div className="-ml-3">
          <TamperGauge score={report.tamperScore} />
        </div>
        <div className="text-right self-start pt-2">
          <p className="text-[10px] font-bold text-dash-muted/40 uppercase tracking-widest mb-1">Temporal Scan</p>
          <p className="text-[10px] font-mono text-emerald-500/60 font-medium">
            {new Date(report.analysedAt).toLocaleString(undefined, {
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Neural Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-dash-input/30 border border-dash-border px-4 py-4 relative group/summary"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20 group-hover/summary:bg-emerald-500/40 transition-colors" />
        <p className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-widest mb-2 ml-1">AI Executive Summary</p>
        <p className="text-sm text-dash-text/80 leading-relaxed font-medium ml-1">
          {report.plainNotesSummary}
        </p>
      </motion.div>

      {/* Score Breakdown Chart */}
      {report.scoreBreakdown && Object.keys(report.scoreBreakdown).length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-[10px] font-bold text-dash-muted/40 uppercase tracking-widest ml-1">
            Forensic Risk Breakdown
          </p>
          <ScoreBreakdownChart scoreBreakdown={report.scoreBreakdown} />
        </div>
      )}

      {/* EXIF flags */}
      {report.exifData.flags && report.exifData.flags.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-dash-muted/40 uppercase tracking-widest ml-1">
            Anomalous Metadata
          </p>
          <div className="space-y-2">
            {report.exifData.flags.map((flag, i) => {
              const key = flag.split(":")[0];
              const label = flagLabels[key] ?? flag;
              const detail = flag.includes(":") ? flag.split(":").slice(1).join(":") : null;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-3"
                >
                  <span className="mt-0.5 shrink-0 text-amber-500/60">⚡</span>
                  <div className="flex flex-col gap-0.5">
                    <span>{label}</span>
                    {detail && (
                      <span className="text-[9px] text-amber-600/60 lowercase tracking-tight">source::{detail}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gemini visual findings */}
      {report.geminiResult.findings && report.geminiResult.findings.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-[10px] font-bold text-dash-muted/40 uppercase tracking-widest ml-1 flex justify-between">
            <span>Visual Neural Findings</span>
            <span className="text-emerald-500/40 text-[9px]">CONF::{report.geminiResult.confidence}</span>
          </p>
          <div className="space-y-2">
            {report.geminiResult.findings.map((f, i) => (
              <div key={i} className="text-[11px] text-dash-text/70 font-medium flex gap-3 px-1 group/finding">
                <span className="text-emerald-500/20 group-hover:text-emerald-500/50 transition-colors shrink-0">■</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXIF metadata table */}
      <div className="pt-4 border-t border-dash-border space-y-3">
        <p className="text-[10px] font-bold text-dash-muted/40 uppercase tracking-widest ml-1">
          Raw Metadata Registry
        </p>
        <div className="rounded-xl overflow-hidden border border-dash-border bg-dash-bg/30">
          <table className="w-full text-[10px] font-bold uppercase tracking-tight">
            <tbody className="divide-y divide-dash-border">
              {[
                ["Software", report.exifData.software],
                ["Device", report.exifData.device],
                ["Created", report.exifData.creation_timestamp],
                ["Modified", report.exifData.modification_timestamp],
                ["GPS", report.exifData.gps_present ? "Present" : "Absent"],
              ].map(([label, value]) => (
                <tr key={label as string} className="hover:bg-dash-hover/20 transition-colors">
                  <td className="py-2.5 px-4 text-dash-muted/60 w-32">{label}</td>
                  <td
                    className={`py-2.5 px-4 font-mono tracking-tighter ${
                      value ? "text-dash-text/80" : "text-dash-muted/20 italic"
                    }`}
                  >
                    {value ?? "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}