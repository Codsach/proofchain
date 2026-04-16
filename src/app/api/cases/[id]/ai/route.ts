import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import AiReport from "@/lib/models/AiReport";
import { withAuth, JWTPayload } from "@/lib/auth";

async function getAiReport(
  _req: NextRequest,
  ctx: { params: Record<string, string> },
  user: JWTPayload
) {
  try {
    await connectDB();

    const { caseId } = ctx.params;

    // Verify the case exists and user has access
    const caseDoc = await Case.findOne({ caseId }).select("aiReportId status investigatorId");
    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (!caseDoc.aiReportId) {
      return NextResponse.json(
        { message: "AI analysis is still running", status: caseDoc.status },
        { status: 202 }
      );
    }

    const report = await AiReport.findById(caseDoc.aiReportId).lean();
    if (!report) {
      return NextResponse.json(
        { error: "AI report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (err) {
    console.error("[ai/get]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getAiReport, ["analyst", "admin"]);