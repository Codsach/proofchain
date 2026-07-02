import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { ResetPasswordSchema } from "@/lib/schemas/auth";
import { logAction } from "@/lib/audit";
import { getIp } from "@/lib/auth";
import { notifyPasswordChange } from "@/lib/email";

export const runtime = "nodejs";

// In-memory rate limiting map for resetting password: max 5 requests per 10 minutes per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  if (checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many reset attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    await connectDB();

    const body = await req.json();

    // 1. Validate inputs
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, newPassword } = parsed.data;

    // 2. Hash token to search in DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 3. Find all users matching this token and checking expiration
    const users = await User.find({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link." },
        { status: 400 }
      );
    }

    // 4. Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // 5. Update user records
    for (const user of users) {
      user.passwordHash = newPasswordHash;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    const primaryUser = users[0];

    // 6. Send security alert email
    try {
      await notifyPasswordChange(primaryUser.email, primaryUser.fullName);
    } catch (emailError) {
      // Non-blocking: log the error, but the password change is still successful
      console.error("[reset-password] security alert email failed to send", emailError);
    }

    // 7. Log audit log
    await logAction({
      actorId: primaryUser._id.toString(),
      actorRole: primaryUser.role,
      actionType: "user.reset_password_success",
      targetType: "user",
      targetId: primaryUser._id.toString(),
      ipAddress: ip,
      metadata: { email: primaryUser.email },
    });

    return NextResponse.json(
      { message: "Password has been reset successfully. You can now log in." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
