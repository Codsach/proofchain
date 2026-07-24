import { NextRequest, NextResponse } from "next/server";
import { withAuth, type JWTPayload } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";

const TERMINAL_STATUSES = ["verified", "rejected", "archived"] as const;

async function listHistory(
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  user: JWTPayload
) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20));
    const status = searchParams.get("status");
    const incidentType = searchParams.get("incidentType");
    const riskLevel = searchParams.get("riskLevel");
    const search = searchParams.get("search")?.trim();
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const filter: Record<string, unknown> = {
      status: status && TERMINAL_STATUSES.includes(status as (typeof TERMINAL_STATUSES)[number])
        ? status
        : { $in: TERMINAL_STATUSES },
    };

    if (user.role === "investigator") filter.investigatorId = user.userId;
    if (incidentType && incidentType !== "all") filter.incidentType = incidentType;
    if (riskLevel && riskLevel !== "all") filter.overallRiskLevel = riskLevel;

    if (from || to) {
      const updatedAt: Record<string, Date> = {};
      if (from) updatedAt.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) updatedAt.$lte = new Date(`${to}T23:59:59.999Z`);
      filter.updatedAt = updatedAt;
    }

    if (search) {
      filter.$or = [
        { caseId: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [cases, total, summary] = await Promise.all([
      Case.find(filter)
        .select("caseId title incidentType status overallTamperScore overallRiskLevel onChainTxHash createdAt updatedAt")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Case.countDocuments(filter),
      Case.aggregate([
        { $match: user.role === "investigator" ? { status: { $in: TERMINAL_STATUSES }, investigatorId: user.userId } : { status: { $in: TERMINAL_STATUSES } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const counts = { verified: 0, rejected: 0, archived: 0 };
    for (const item of summary) {
      if (item._id in counts) counts[item._id as keyof typeof counts] = item.count;
    }

    return NextResponse.json({
      cases,
      summary: { total: counts.verified + counts.rejected + counts.archived, ...counts },
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("[history/list]", error);
    return NextResponse.json({ error: "Unable to load case history" }, { status: 500 });
  }
}

export const GET = withAuth(listHistory, ["investigator", "analyst", "admin"]);
