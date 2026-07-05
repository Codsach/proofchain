import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "investigator" | "analyst" | "admin";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  loginAttempts: number;
  lockUntil: Date | null;
  emailVerifyToken: string | null;
  emailVerifyExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  landingPage?: string;
  timezone?: string;
  notificationPreferences?: {
    securityAlerts: boolean;
    caseReports: boolean;
    systemUpdates: boolean;
  };
  trustedDevices: {
    deviceTokenHash: string;
    expiresAt: Date;
  }[];
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["investigator", "analyst", "admin"],
      default: "investigator",
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    emailVerifyToken: { type: String, default: null },
    emailVerifyExpires: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null, select: false },
    landingPage: { type: String, default: "dashboard" },
    timezone: { type: String, default: "UTC" },
    notificationPreferences: {
      securityAlerts: { type: Boolean, default: true },
      caseReports: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: false }
    },
    trustedDevices: [
      {
        deviceTokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true }
);

UserSchema.index({ email: 1, role: 1 }, { unique: true });

// Prevent model recompilation in Next.js hot reload
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
