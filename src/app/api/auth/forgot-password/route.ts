import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { ForgotPasswordSchema, normalizeEmail } from "@/lib/schemas/auth";
import { logAction } from "@/lib/audit";
import { getIp } from "@/lib/auth";
import { buildAppUrl, sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

// In-memory rate limiting map: max 3 requests per hour per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

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
      { error: "Too many reset attempts. Please wait an hour." },
      { status: 429 }
    );
  }

  try {
    await connectDB();

    const body = await req.json();

    // 1. Validate email input
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const email = normalizeEmail(parsed.data.email);

    // 2. Query user by email (we look for any matching user)
    // If multiple roles exist for the same email, we can reset them or choose standard one.
    // In this app, User.find({ email }) gets all matching users. Let's find first user or all users.
    const users = await User.find({ email });

    if (!users || users.length === 0) {
      // Return 200 to prevent email enumeration
      return NextResponse.json(
        { message: "If an account with that email exists, we have sent a password reset link." },
        { status: 200 }
      );
    }

    // 3. Generate token & hash
    const plainToken = crypto.randomUUID();
    const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL

    // Store in all user documents matching this email (in case same email has multiple roles)
    for (const user of users) {
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = expiry;
      await user.save();
    }

    const primaryUser = users[0];

    // 4. Construct reset link
    const resetUrl = buildAppUrl("/reset-password", req, {
      token: plainToken,
    });

    // 5. Send email
    try {
      await sendPasswordResetEmail(email, primaryUser.fullName, resetUrl);
    } catch (error) {
      console.error("[forgot-password] Email send failed", error);
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again later." },
        { status: 502 }
      );
    }

    // 6. Log audit action
    await logAction({
      actorId: primaryUser._id.toString(),
      actorRole: primaryUser.role,
      actionType: "user.reset_password_request",
      targetType: "user",
      targetId: primaryUser._id.toString(),
      ipAddress: ip,
      metadata: { email },
    });

    return NextResponse.json(
      { message: "If an account with that email exists, we have sent a password reset link." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
