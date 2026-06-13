import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AuditLog from "@/lib/models/AuditLog";
import { withAuth, JWTPayload } from "@/lib/auth";

async function getAuditLog(
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  _user: JWTPayload
) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 50;
    const skip = (page - 1) * limit;

    const actionType = searchParams.get("actionType");
    const actorId = searchParams.get("actorId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const filter: Record<string, unknown> = {};
    if (actionType) filter.actionType = actionType;
    if (actorId) filter.actorId = actorId;
    if (from || to) {
      filter.timestamp = {};
      if (from) (filter.timestamp as Record<string, Date>).$gte = new Date(from);
      if (to) (filter.timestamp as Record<string, Date>).$lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate("actorId", "email fullName role")
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[admin/audit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getAuditLog, ["admin"]);
