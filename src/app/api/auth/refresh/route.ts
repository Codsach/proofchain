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
      "role isActive isVerified email fullName"
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

    const res = NextResponse.json({
      accessToken: newAccessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });

    setRefreshCookie(res, newRefreshToken);
    return res;
  } catch (err) {
    console.error("[refresh]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
