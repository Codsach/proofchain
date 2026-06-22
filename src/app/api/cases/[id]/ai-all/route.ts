import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import AiReport from "@/lib/models/AiReport";
import { withAuth, JWTPayload } from "@/lib/auth";

async function getAiReports(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
  user: JWTPayload
) {
  try {
    await connectDB();

    const { id: caseId } = await ctx.params;

    // Verify the case exists and user has access
    const caseDoc = await Case.findOne({ caseId }).select("aiReportIds status investigatorId");
    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const reports = await AiReport.find({ caseId }).lean();
    return NextResponse.json(reports);
  } catch (err) {
    console.error("[ai-all/get]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getAiReports, ["analyst", "admin"]);
