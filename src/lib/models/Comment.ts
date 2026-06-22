import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IComment extends Document {
  caseId: string;
  authorId: Types.ObjectId;
  authorRole: string;
  authorName: string;
  content: string;
  isInternal: boolean;
  deletedAt: Date | null;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    caseId: { type: String, required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorRole: { type: String, required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true, maxlength: 2000 },
    isInternal: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
