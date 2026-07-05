import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import Verdict from "@/lib/models/Verdict";
import AiReport from "@/lib/models/AiReport";
import { withAuth, JWTPayload } from "@/lib/auth";

async function getAnalystMetrics(
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  user: JWTPayload
) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const incidentFilter = searchParams.get("incidentType");
    const searchQuery = searchParams.get("search");

    // Build filter based on active dashboard selections
    const filter: Record<string, any> = {
      status: statusFilter
        ? statusFilter
        : { $in: ["pending_review", "ai_timeout", "under_review"] },
    };

    if (incidentFilter && incidentFilter !== "all") filter.incidentType = incidentFilter;
    if (searchQuery) {
      filter.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
      ];
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. My Queue Metrics matching the filter
    const assignedThisWeek = await Case.countDocuments(filter);

    // 2. Completed Cases by this analyst matching the filter
    const completedFilter: Record<string, any> = {
      analystId: user.userId,
      issuedAt: { $gte: sevenDaysAgo },
    };
    if (statusFilter && ["verified", "rejected"].includes(statusFilter)) {
      completedFilter.verdict = statusFilter;
    }
    const completedThisWeek = await Verdict.countDocuments(completedFilter);

    // Fetch verdicts issued by this analyst for time calculations
    const analystVerdicts = await Verdict.find({ analystId: user.userId }).lean();
    
    let verdictAccuracyRate = 100;
    let averageReviewTimeHours = 0;

    if (analystVerdicts.length > 0) {
      const caseIds = analystVerdicts.map((v) => v.caseId);
      
      const [aiReports, relatedCases] = await Promise.all([
        AiReport.find({ caseId: { $in: caseIds } }).lean(),
        Case.find({ caseId: { $in: caseIds } }).lean(),
      ]);

      const aiReportMap = new Map(aiReports.map((r) => [r.caseId, r]));
      const caseMap = new Map(relatedCases.map((c) => [c.caseId, c]));

      let accurateCount = 0;
      let reviewableCount = 0;
      let totalTimeDiffMs = 0;
      let timeCalcCount = 0;

      for (const verdict of analystVerdicts) {
        const report = aiReportMap.get(verdict.caseId);
        if (report) {
          reviewableCount++;
          const aiSaysHighRisk = report.tamperScore > 50;
          const analystRejected = verdict.verdict === "rejected";
          
          if (aiSaysHighRisk === analystRejected) {
            accurateCount++;
          }
        }

        const relatedCase = caseMap.get(verdict.caseId);
        if (relatedCase && verdict.issuedAt && relatedCase.createdAt) {
          const diff = new Date(verdict.issuedAt).getTime() - new Date(relatedCase.createdAt).getTime();
          if (diff > 0) {
            totalTimeDiffMs += diff;
            timeCalcCount++;
          }
        }
      }

      if (reviewableCount > 0) {
        verdictAccuracyRate = Math.round((accurateCount / reviewableCount) * 100);
      }
      
      if (timeCalcCount > 0) {
        const avgMs = totalTimeDiffMs / timeCalcCount;
        averageReviewTimeHours = Math.round((avgMs / (1000 * 60 * 60)) * 10) / 10;
      }
    }

    // 3. High-Risk Cases Alert matching active filters
    const matchedCases = await Case.find(filter).select("caseId").lean();
    const matchedCaseIds = matchedCases.map((c) => c.caseId);
    
    const highRiskAlerts = await AiReport.countDocuments({
      caseId: { $in: matchedCaseIds },
      tamperScore: { $gt: 70 },
    });

    return NextResponse.json({
      assignedThisWeek,
      completedThisWeek,
      verdictAccuracyRate,
      averageReviewTimeHours,
      highRiskAlerts,
    });
  } catch (err) {
    console.error("[analyst metrics]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getAnalystMetrics, ["analyst", "admin"]);
