// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import UserProfile from "@/lib/models/UserProfile";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { accessToken: null, user: null },
        { status: 200 }
      );
    }

    // Verify the refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json(
        { accessToken: null, user: null },
        { status: 200 }
      );
    }

    // Re-validate user from DB
    await connectDB();
    const user = await User.findById(payload.userId).select(
      "role isActive isVerified email fullName mfaEnabled landingPage"
    );

    if (!user || !user.isActive || !user.isVerified) {
      return NextResponse.json(
        { accessToken: null, user: null },
        { status: 200 }
      );
    }

    // Issue new tokens (rotation)
    const newPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    const profile = await UserProfile.findOne({ userId: user._id });

    const res = NextResponse.json({
      accessToken: newAccessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: profile?.avatarUrl || null,
        mfaEnabled: user.mfaEnabled || false,
        landingPage: user.landingPage || "dashboard",
      },
    });

    setRefreshCookie(res, newRefreshToken);
    return res;
  } catch (err) {
    console.error("[refresh]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
