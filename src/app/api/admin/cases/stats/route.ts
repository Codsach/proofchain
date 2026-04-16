import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import AiReport from "@/lib/models/AiReport";
import { withAuth, JWTPayload } from "@/lib/auth";

async function getCaseStats(
  _req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  _user: JWTPayload
) {
  try {
    await connectDB();

    const [total, pending, verified, highRiskCount] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({
        status: { $in: ["pending_review", "ai_timeout", "under_review"] },
      }),
      Case.countDocuments({ status: "verified" }),
      AiReport.countDocuments({ riskLevel: "high" }),
    ]);

    return NextResponse.json({ total, pending, verified, highRisk: highRiskCount });
  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getCaseStats, ["admin"]);
