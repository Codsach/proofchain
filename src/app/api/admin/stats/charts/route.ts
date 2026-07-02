import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import AiReport from "@/lib/models/AiReport";
import User from "@/lib/models/User";
import { withAuth, JWTPayload } from "@/lib/auth";

async function getChartStats(
  _req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  _user: JWTPayload
) {
  try {
    await connectDB();

    const now = new Date();
    // Start of the month 9 months ago
    const nineMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 8, 1);
    // Start of 4 weeks ago
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    const [
      volumeRaw,
      riskRaw,
      statusRaw,
      tamperRaw,
      userCountsRaw,
    ] = await Promise.all([
      // 1. Case volume per month (last 9 months)
      Case.aggregate([
        { $match: { createdAt: { $gte: nineMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            cases: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // 2. Risk distribution from AiReports
      AiReport.aggregate([
        { $group: { _id: "$riskLevel", value: { $sum: 1 } } },
      ]),

      // 3. Case status breakdown by week (last 4 weeks)
      Case.aggregate([
        { $match: { createdAt: { $gte: fourWeeksAgo } } },
        {
          $group: {
            _id: {
              week: { $ceil: { $divide: [{ $dayOfMonth: "$createdAt" }, 7] } },
              status: "$status",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.week": 1 } },
      ]),

      // 4. Tamper score histogram (buckets 0-10, 11-20, ..., 91-100)
      AiReport.aggregate([
        {
          $bucket: {
            groupBy: "$tamperScore",
            boundaries: [0, 11, 21, 31, 41, 51, 61, 71, 81, 91, 101],
            default: "other",
            output: { count: { $sum: 1 } },
          },
        },
      ]),

      // 5. User counts by role
      User.aggregate([
        {
          $group: {
            _id: "$role",
            total: { $sum: 1 },
            active: { $sum: { $cond: ["$isActive", 1, 0] } },
          },
        },
      ]),
    ]);

    // --- Shape volume data ---
    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // Build a map for quick lookup
    const volumeMap: Record<string, number> = {};
    for (const v of volumeRaw) {
      volumeMap[`${v._id.year}-${v._id.month}`] = v.cases;
    }
    const volumeData = Array.from({ length: 9 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 8 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      return { name: MONTH_NAMES[d.getMonth()], cases: volumeMap[key] ?? 0 };
    });

    // --- Shape risk data ---
    const RISK_COLORS: Record<string, string> = {
      low: "#10b981",
      medium: "#f59e0b",
      high: "#f43f5e",
    };
    const riskData = riskRaw.map((r) => ({
      name: r._id.charAt(0).toUpperCase() + r._id.slice(1) + " Risk",
      value: r.value,
      color: RISK_COLORS[r._id] ?? "#6b7280",
    }));
    if (riskData.length === 0) {
      riskData.push(
        { name: "Low Risk", value: 0, color: "#10b981" },
        { name: "Medium Risk", value: 0, color: "#f59e0b" },
        { name: "High Risk", value: 0, color: "#f43f5e" }
      );
    }

    // --- Shape status breakdown by week ---
    const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];
    const statusMap: Record<number, { pending: number; verified: number; rejected: number }> = {
      1: { pending: 0, verified: 0, rejected: 0 },
      2: { pending: 0, verified: 0, rejected: 0 },
      3: { pending: 0, verified: 0, rejected: 0 },
      4: { pending: 0, verified: 0, rejected: 0 },
    };
    for (const s of statusRaw) {
      const week = Math.min(4, Math.max(1, s._id.week as number));
      const bucket = statusMap[week];
      const status: string = s._id.status;
      if (status === "verified") bucket.verified += s.count;
      else if (status === "rejected") bucket.rejected += s.count;
      else bucket.pending += s.count; // pending_review, under_review, ai_timeout, etc.
    }
    const statusData = weekLabels.map((label, i) => ({
      date: label,
      ...statusMap[i + 1],
    }));

    // --- Shape tamper histogram ---
    const rangeLabels = ["0-10", "11-20", "21-30", "31-40", "41-50", "51-60", "61-70", "71-80", "81-90", "91-100"];
    const tamperData = rangeLabels.map((range, i) => {
      const bucket = tamperRaw.find((b) => b._id === i * 10) as { _id: number; count: number } | undefined;
      return { range, count: bucket?.count ?? 0 };
    });

    // --- Shape user counts ---
    const userMap: Record<string, { total: number; active: number }> = {
      investigator: { total: 0, active: 0 },
      analyst: { total: 0, active: 0 },
      admin: { total: 0, active: 0 },
    };
    for (const u of userCountsRaw) {
      if (u._id in userMap) {
        userMap[u._id] = { total: u.total, active: u.active };
      }
    }

    return NextResponse.json({
      volumeData,
      riskData,
      statusData,
      tamperData,
      userCounts: userMap,
    });
  } catch (err) {
    console.error("[admin/stats/charts]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getChartStats, ["admin"]);
