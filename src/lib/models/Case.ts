import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type CaseStatus =
  | "pending_ai_review"
  | "pending_review"
  | "ai_timeout"
  | "under_review"
  | "verified"
  | "rejected"
  | "archived";

export type IncidentType =
  | "data_breach"
  | "insider_threat"
  | "malware"
  | "phishing"
  | "other";

export interface IFileRecord {
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  ipfsCid: string;
  gpsLat: number | null;
  gpsLng: number | null;
  gpsAccuracy: number | null;
  uploadedAt: Date;
}

export interface ICase extends Document {
  caseId: string;
  investigatorId: Types.ObjectId;
  currentCustodian: Types.ObjectId;
  title: string;
  description: string;
  incidentDate: Date;
  incidentType: IncidentType;
  status: CaseStatus;
  files: IFileRecord[];
  tags: string[];
  aiReportId: Types.ObjectId | null;
  onChainTxHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const FileRecordSchema = new Schema<IFileRecord>(
  {
    fileId: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    sha256Hash: { type: String, required: true },
    ipfsCid: { type: String, required: true },
    gpsLat: { type: Number, default: null },
    gpsLng: { type: Number, default: null },
    gpsAccuracy: { type: Number, default: null },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CaseSchema = new Schema<ICase>(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    investigatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    currentCustodian: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    incidentDate: { type: Date, required: true },
    incidentType: {
      type: String,
      enum: ["data_breach", "insider_threat", "malware", "phishing", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: [
        "pending_ai_review",
        "pending_review",
        "ai_timeout",
        "under_review",
        "verified",
        "rejected",
        "archived",
      ],
      default: "pending_ai_review",
    },
    files: [FileRecordSchema],
    tags: [{ type: String, trim: true }],
    aiReportId: { type: Schema.Types.ObjectId, ref: "AiReport", default: null },
    onChainTxHash: { type: String, default: null },
  },
  { timestamps: true }
);

const Case: Model<ICase> =
  mongoose.models.Case || mongoose.model<ICase>("Case", CaseSchema);

export default Case;