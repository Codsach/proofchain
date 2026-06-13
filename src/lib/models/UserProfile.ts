import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserProfile extends Document {
  userId: mongoose.Types.ObjectId;
  avatarUrl: string | null;
  phoneNumber: string | null;
  department: string | null;
  location: string | null;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    avatarUrl: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    department: { type: String, default: null },
    location: { type: String, default: null },
  },
  { timestamps: true }
);

const UserProfile: Model<IUserProfile> =
  mongoose.models.UserProfile ||
  mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);

export default UserProfile;
