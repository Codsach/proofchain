import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "@/lib/totp";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { withAuth, JWTPayload, getIp } from "@/lib/auth";
import { logAction } from "@/lib/audit";

async function verifySetupMfa(
  req: NextRequest,
  _ctx: unknown,
  user: JWTPayload
) {
  void _ctx;
  try {
    const body = await req.json();
    const { secret, code } = body;

    if (!secret || !code) {
      return NextResponse.json(
        { error: "Secret and code are required" },
        { status: 400 }
      );
    }

    // Verify the provided code against the provided secret
    const verification = await authenticator.verify(code, { secret });
    
    if (!verification.valid) {
      return NextResponse.json(
        { error: "Invalid authenticator code" },
        { status: 400 }
      );
    }

    await connectDB();
    
    const dbUser = await User.findById(user.userId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Save the secret and enable MFA
    dbUser.mfaSecret = secret;
    dbUser.mfaEnabled = true;
    await dbUser.save();

    await logAction({
      actorId: user.userId,
      actorRole: user.role,
      actionType: "user.enable_mfa",
      targetType: "user",
      targetId: user.userId,
      ipAddress: getIp(req),
    });

    return NextResponse.json({
      success: true,
      message: "MFA has been successfully enabled",
    });
  } catch (err) {
    console.error("[mfa/verify-setup]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow all logged in users to verify their MFA setup
export const POST = withAuth(verifySetupMfa, ["admin", "analyst", "investigator"]);
