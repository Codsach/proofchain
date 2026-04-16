import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import AiReport from "@/lib/models/AiReport";
import { withAuth, JWTPayload } from "@/lib/auth";

async function getCaseQueue(
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  user: JWTPayload
) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const statusFilter = searchParams.get("status");
    const incidentFilter = searchParams.get("incidentType");
    const limit = 20;
    const skip = (page - 1) * limit;

    // Build filter — analysts see reviewable cases
    const filter: Record<string, unknown> = {
      status: statusFilter
        ? statusFilter
        : { $in: ["pending_review", "ai_timeout", "under_review"] },
    };

    if (incidentFilter) filter.incidentType = incidentFilter;

    const [cases, total] = await Promise.all([
      Case.find(filter)
        .select(
          // Strip investigatorId from analyst projection — PRD REV-08
          "-investigatorId -__v"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Case.countDocuments(filter),
    ]);

    // Attach tamper score from AI reports for each case
    const caseIds = cases.map((c) => c.caseId);
    const aiReports = await AiReport.find({ caseId: { $in: caseIds } })
      .select("caseId tamperScore riskLevel")
      .lean();

    const scoreMap: Record<string, { tamperScore: number; riskLevel: string }> = {};
    for (const r of aiReports) {
      scoreMap[r.caseId] = {
        tamperScore: r.tamperScore,
        riskLevel: r.riskLevel,
      };
    }

    const enriched = cases.map((c) => ({
      ...c,
      aiSummary: scoreMap[c.caseId] ?? null,
    }));

    return NextResponse.json({
      cases: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[queue]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getCaseQueue, ["analyst", "admin"]);
