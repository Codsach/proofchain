import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AuditActionType =
  | "user.register"
  | "user.login"
  | "user.logout"
  | "user.deactivate"
  | "user.delete"
  | "user.enable_mfa"
  | "user.reset_password_request"
  | "user.reset_password_success"
  | "case.create"
  | "case.view"
  | "case.archive"
  | "file.upload"
  | "evidence.submit"
  | "file.ipfs_pin"
  | "file.hash_anchor"
  | "ai.started"
  | "ai.complete"
  | "ai.timeout"
  | "transfer.initiate"
  | "transfer.complete"
  | "transfer.chain_anchor"
  | "verdict.issue"
  | "verify.public_check"
  | "admin.create_analyst";

export interface IAuditLog extends Document {
  timestamp: Date;
  actorId: Types.ObjectId | null;
  actorRole: string;
  actionType: AuditActionType;
  targetType: string;
  targetId: string;
  ipAddress: string;
  metadata: Record<string, unknown>;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorRole: { type: String, required: true },
    actionType: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    ipAddress: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    // Disable updatedAt — audit logs are append-only
    timestamps: { createdAt: false, updatedAt: false },
  }
);

// Prevent updates on this collection at the schema level
AuditLogSchema.pre("findOneAndUpdate", function () {
  throw new Error("AuditLog records are append-only and cannot be updated");
});

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
