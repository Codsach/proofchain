import mongoose, { Schema, Document, Model, Types } from "mongoose";

// ── Verdict ──────────────────────────────────────────────────────────────────
export interface IVerdict extends Document {
  caseId: string;
  analystId: Types.ObjectId;
  verdict: "verified" | "rejected";
  reason: string;
  verdictHash: string;
  onChainTxHash: string | null;
  issuedAt: Date;
}

const VerdictSchema = new Schema<IVerdict>(
  {
    caseId: { type: String, required: true, index: true },
    analystId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    verdict: { type: String, enum: ["verified", "rejected"], required: true },
    reason: { type: String, required: true, minlength: 20 },
    verdictHash: { type: String, required: true },
    onChainTxHash: { type: String, default: null },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

  const Verdict: Model<IVerdict> =
  mongoose.models.Verdict ||
  mongoose.model<IVerdict>("Verdict", VerdictSchema);
  export default Verdict;

// ── Transfer ─────────────────────────────────────────────────────────────────
export interface ITransfer extends Document {
  caseId: string;
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  reason: string;
  notes: string | null;
  transferHash: string;
  onChainTxHash: string | null;
  transferredAt: Date;
}

const TransferSchema = new Schema<ITransfer>(
  {
    caseId: { type: String, required: true, index: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, minlength: 20 },
    notes: { type: String, default: null },
    transferHash: { type: String, required: true },
    onChainTxHash: { type: String, default: null },
    transferredAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const Transfer: Model<ITransfer> =
  mongoose.models.Transfer ||
  mongoose.model<ITransfer>("Transfer", TransferSchema);