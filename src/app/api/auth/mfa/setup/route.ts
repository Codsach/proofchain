import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { withAuth, JWTPayload } from "@/lib/auth";

async function setupMfa(
  req: NextRequest,
  _ctx: { params: Promise<Record<string, never>> },
  user: JWTPayload
) {
  try {
    await connectDB();
    
    const dbUser = await User.findById(user.userId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (dbUser.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA is already enabled" },
        { status: 400 }
      );
    }

    // Generate a secure secret
    const secret = authenticator.generateSecret();
    
    // Create the otpauth URI
    const otpauthUrl = authenticator.keyuri(
      dbUser.email,
      "ProofChain",
      secret
    );

    // Generate a QR code as a Data URL
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

    // We do NOT save the secret to the DB yet. The user must verify it first.
    return NextResponse.json({
      secret,
      qrCodeUrl,
    });
  } catch (err) {
    console.error("[mfa/setup]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow all logged in users to set up MFA
export const POST = withAuth(setupMfa, ["admin", "analyst", "investigator"]);
