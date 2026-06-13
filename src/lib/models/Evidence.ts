import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGPSMetadata {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  capturedAt: Date;
}

export interface IDeviceInfo {
  userAgent?: string;
  platform?: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface IEvidence extends Document {
  caseId: string;
  title: string;
  description?: string;
  uploadedBy: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileHash: string;
  ipfsCid: string;
  blockchainTxHash?: string;
  status:
    | "pending_ai_review"
    | "pending_review"
    | "under_review"
    | "verified"
    | "rejected"
    | "ai_timeout"
    | "archived";
  captureMethod: "camera" | "upload";
  gpsMetadata?: IGPSMetadata | null;
  deviceInfo?: IDeviceInfo | null;
  offlineQueueId?: string | null;
  aiAnalysisId?: string;
  tamperScore?: number;
  verdictId?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GPSMetadataSchema = new Schema<IGPSMetadata>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    altitude: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    capturedAt: { type: Date, required: true },
  },
  { _id: false }
);

const DeviceInfoSchema = new Schema<IDeviceInfo>(
  {
    userAgent: String,
    platform: String,
    model: String,
    osVersion: String,
    appVersion: String,
  },
  { _id: false }
);

const EvidenceSchema = new Schema<IEvidence>(
  {
    caseId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    uploadedBy: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileHash: { type: String, required: true, index: true },
    ipfsCid: { type: String, required: true },
    blockchainTxHash: { type: String },
    status: {
      type: String,
      enum: [
        "pending_ai_review",
        "pending_review",
        "under_review",
        "verified",
        "rejected",
        "ai_timeout",
        "archived",
      ],
      default: "pending_ai_review",
    },
    captureMethod: {
      type: String,
      enum: ["camera", "upload"],
      default: "upload",
    },
    gpsMetadata: { type: GPSMetadataSchema, default: null },
    deviceInfo: { type: DeviceInfoSchema, default: null },
    offlineQueueId: { type: String, default: null },
    aiAnalysisId: { type: String },
    tamperScore: { type: Number },
    verdictId: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index to detect duplicates within a case
EvidenceSchema.index({ caseId: 1, fileHash: 1 }, { unique: true });

export const EvidenceModel: Model<IEvidence> =
  mongoose.models.Evidence ||
  mongoose.model<IEvidence>("Evidence", EvidenceSchema);