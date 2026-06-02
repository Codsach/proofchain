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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. My Queue Metrics
    // Cases currently assigned to or available for this analyst
    const assignedThisWeek = await Case.countDocuments({
      status: { $in: ["pending_review", "under_review", "ai_timeout"] },
    });

    // Cases completed by this analyst in the last 7 days
    const completedThisWeek = await Verdict.countDocuments({
      analystId: user.id,
      issuedAt: { $gte: sevenDaysAgo },
    });

    // Fetch all verdicts issued by this analyst for accuracy and time calculations
    const analystVerdicts = await Verdict.find({ analystId: user.id }).lean();
    
    let verdictAccuracyRate = 100; // default if no verdicts
    let averageReviewTimeHours = 0;

    if (analystVerdicts.length > 0) {
      const caseIds = analystVerdicts.map((v) => v.caseId);
      
      // Fetch related AI Reports and Cases
      const [aiReports, relatedCases] = await Promise.all([
        AiReport.find({ caseId: { $in: caseIds } }).lean(),
        Case.find({ caseId: { $in: caseIds } }).lean(),
      ]);

      const aiReportMap = new Map(aiReports.map((r) => [r.caseId, r]));
      const caseMap = new Map(relatedCases.map((c) => [c.caseId, c]));

      // Calculate Accuracy Rate
      let accurateCount = 0;
      let reviewableCount = 0;

      // Calculate Average Review Time
      let totalTimeDiffMs = 0;
      let timeCalcCount = 0;

      for (const verdict of analystVerdicts) {
        // Accuracy Check
        const report = aiReportMap.get(verdict.caseId);
        if (report) {
          reviewableCount++;
          const aiSaysHighRisk = report.tamperScore > 50;
          const analystRejected = verdict.verdict === "rejected";
          
          if (aiSaysHighRisk === analystRejected) {
            accurateCount++;
          }
        }

        // Time Check
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
        averageReviewTimeHours = Math.round((avgMs / (1000 * 60 * 60)) * 10) / 10; // e.g., 2.5
      }
    }

    // 4. High-Risk Cases Alert
    // Find pending cases, then count how many of them have tamperScore > 70
    const pendingCases = await Case.find({
      status: { $in: ["pending_review", "under_review"] },
    }).select("caseId").lean();
    
    const pendingCaseIds = pendingCases.map((c) => c.caseId);
    
    const highRiskAlerts = await AiReport.countDocuments({
      caseId: { $in: pendingCaseIds },
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
