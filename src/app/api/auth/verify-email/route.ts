import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { buildAppUrl } from "@/lib/email";

function redirectToLogin(
  req: NextRequest,
  key: "message" | "error",
  value: string
) {
  return NextResponse.redirect(new URL(buildAppUrl("/login", req, { [key]: value })));
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const id = searchParams.get("id");

    if (!token || !id) {
      return redirectToLogin(req, "error", "invalid_link");
    }

    const user = await User.findById(id);

    if (!user) {
      return redirectToLogin(req, "error", "invalid_link");
    }

    if (user.isVerified) {
      return redirectToLogin(req, "message", "already_verified");
    }

    // Check token matches and hasn't expired
    if (
      user.emailVerifyToken !== token ||
      !user.emailVerifyExpires ||
      user.emailVerifyExpires < new Date()
    ) {
      return redirectToLogin(req, "error", "link_expired");
    }

    // Mark as verified
    user.isVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;
    await user.save();

    return redirectToLogin(req, "message", "verified");
  } catch (err) {
    console.error("[verify-email]", err);
    return redirectToLogin(req, "error", "server_error");
  }
}
