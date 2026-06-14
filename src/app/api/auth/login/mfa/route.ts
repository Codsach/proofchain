import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "@/lib/totp";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import {
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
  getIp,
  verifyMfaToken,
  setTrustedDeviceCookie,
} from "@/lib/auth";
import { logAction } from "@/lib/audit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mfaToken, code } = body;

    if (!mfaToken || !code) {
      return NextResponse.json(
        { error: "MFA token and code are required" },
        { status: 400 }
      );
    }

    let payload;
    try {
      payload = verifyMfaToken(mfaToken);
    } catch {
      return NextResponse.json(
        { error: "Session expired or invalid. Please log in again." },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(payload.userId).select("+mfaSecret");

    if (!user || !user.isActive || !user.isVerified) {
      return NextResponse.json(
        { error: "Account unavailable" },
        { status: 403 }
      );
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { error: "MFA is not enabled for this account" },
        { status: 400 }
      );
    }

    // Verify the TOTP code
    const verification = await authenticator.verify(code, { secret: user.mfaSecret });
    if (!verification.valid) {
      return NextResponse.json(
        { error: "Invalid authenticator code" },
        { status: 400 }
      );
    }

    // Login successful
    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const redirectMap: Record<string, string> = {
      admin: "/admin",
      analyst: "/analyst",
      investigator: "/investigator",
    };
    const redirectTo = redirectMap[user.role] ?? "/";

    await logAction({
      actorId: user._id.toString(),
      actorRole: user.role,
      actionType: "user.login",
      targetType: "user",
      targetId: user._id.toString(),
      ipAddress: getIp(req),
    });

    const res = NextResponse.json({
      accessToken,
      redirectTo,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Initialize array if undefined
    if (!user.trustedDevices) {
      user.trustedDevices = [];
    }

    user.trustedDevices.push({
      deviceTokenHash: hashedToken,
      expiresAt,
    });

    // Enforce max 5 devices
    if (user.trustedDevices.length > 5) {
      user.trustedDevices = user.trustedDevices.slice(-5);
    }

    await user.save();
    setTrustedDeviceCookie(res, rawToken);

    setRefreshCookie(res, refreshToken);
    return res;
  } catch (err) {
    console.error("[login/mfa]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
