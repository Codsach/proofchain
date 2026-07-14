import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAiReport extends Document {
  caseId: string;
  fileId: string;
  analysedAt: Date;
  exifData: {
    software: string | null;
    gps_present: boolean;
    creation_timestamp: string | null;
    modification_timestamp: string | null;
    device: string | null;
    flags: string[];
  };
  geminiResult: {
    manipulation_likelihood: "low" | "medium" | "high" | "inconclusive";
    ai_generation_likelihood?: "low" | "medium" | "high" | "inconclusive";
    findings: string[];
    confidence: "low" | "medium" | "high" | "inconclusive";
  };
  aiDetection: {
    is_ai_generated: boolean | null;
    confidence: number | null;
    detector_available: boolean;
    error: string | null;
  } | null;
  tamperScore: number;
  riskLevel: "low" | "medium" | "high";
  scoreBreakdown: Record<string, unknown>;
  plainNotesSummary: string;
  status: "complete" | "inconclusive" | "timeout";
}

const AiReportSchema = new Schema<IAiReport>(
  {
    caseId: { type: String, required: true, index: true },
    fileId: { type: String, required: true },
    analysedAt: { type: Date, required: true },
    exifData: {
      software: { type: String, default: null },
      gps_present: { type: Boolean, default: false },
      creation_timestamp: { type: String, default: null },
      modification_timestamp: { type: String, default: null },
      device: { type: String, default: null },
      flags: [{ type: String }],
    },
    geminiResult: {
      manipulation_likelihood: {
        type: String,
        enum: ["low", "medium", "high", "inconclusive"],
        default: "inconclusive",
      },
      ai_generation_likelihood: {
        type: String,
        enum: ["low", "medium", "high", "inconclusive"],
        default: "inconclusive",
      },
      findings: [{ type: String }],
      confidence: {
        type: String,
        enum: ["low", "medium", "high", "inconclusive"],
        default: "inconclusive",
      },
    },
    aiDetection: {
      is_ai_generated: { type: Boolean, default: null },
      confidence: { type: Number, default: null },
      detector_available: { type: Boolean, default: false },
      error: { type: String, default: null },
    },
    tamperScore: { type: Number, min: 0, max: 100, required: true },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    scoreBreakdown: { type: Schema.Types.Mixed, default: {} },
    plainNotesSummary: { type: String, default: "" },
    status: {
      type: String,
      enum: ["complete", "inconclusive", "timeout"],
      default: "complete",
    },
  },
  { timestamps: false }
);

const AiReport: Model<IAiReport> =
  mongoose.models.AiReport ||
  mongoose.model<IAiReport>("AiReport", AiReportSchema);

export default AiReport;