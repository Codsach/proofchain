import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case, { CaseStatus } from "@/lib/models/Case";
import AiReport from "@/lib/models/AiReport";
import { EvidenceModel } from "@/lib/models/Evidence";
import { logAction } from "@/lib/audit";
import { Types } from "mongoose";

// This route is called by FastAPI after AI analysis completes.
// It is NOT exposed to the public — protected by the internal key.

export async function POST(req: NextRequest) {
  // Validate internal key
  const key = req.headers.get("x-internal-key");
  if (!key || key !== process.env.INTERNAL_AI_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await req.json();
    const { caseId, fileId, aiReportMongoId, tamperScore, status } = body;

    if (!caseId || !fileId) {
      return NextResponse.json(
        { error: "caseId and fileId are required" },
        { status: 400 }
      );
    }

    // 1. Find the case
    const caseDoc = await Case.findOne({ caseId });
    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // 2. Add report ID to caseDoc.aiReportIds if provided and valid
    if (aiReportMongoId && Types.ObjectId.isValid(aiReportMongoId)) {
      const reportObjId = new Types.ObjectId(aiReportMongoId);
      if (!caseDoc.aiReportIds.some((id) => id.toString() === reportObjId.toString())) {
        caseDoc.aiReportIds.push(reportObjId);
      }
    }

    // 3. Retrieve all reports for this case to compute overall values
    const reports = await AiReport.find({ caseId }).lean();

    let overallScore: number | null = null;
    let overallRisk: "low" | "medium" | "high" | null = null;

    if (reports.length > 0) {
      const scores = reports
        .map((r) => r.tamperScore)
        .filter((s): s is number => s !== null && s !== undefined);
      if (scores.length > 0) {
        overallScore = Math.max(...scores);
        if (overallScore <= 30) overallRisk = "low";
        else if (overallScore <= 60) overallRisk = "medium";
        else overallRisk = "high";
      }
    }

    // 4. Determine status
    // If unique analyzed file count matches caseDoc.files.length, all files are done.
    // If not all done, keep pending_ai_review.
    const uniqueAnalyzedFileIds = new Set(reports.map((r) => r.fileId));
    const totalCaseFiles = caseDoc.files?.length ?? 0;

    let newStatus: CaseStatus = caseDoc.status;
    if (totalCaseFiles === 0 || uniqueAnalyzedFileIds.size >= totalCaseFiles) {
      const hasTimeout = reports.some((r) => r.status === "timeout") || status === "timeout";
      newStatus = hasTimeout ? "ai_timeout" : "pending_review";
    } else {
      newStatus = "pending_ai_review";
    }

    caseDoc.status = newStatus;
    caseDoc.overallTamperScore = overallScore;
    caseDoc.overallRiskLevel = overallRisk;
    await caseDoc.save();

    // 5. Update the individual Evidence document status so UI evidence lists
    //    no longer show stale "pending_ai_review" after analysis finishes.
    const evidenceStatus = status === "timeout" ? "ai_timeout" : "pending_review";
    if (Types.ObjectId.isValid(fileId)) {
      await EvidenceModel.findByIdAndUpdate(fileId, { $set: { status: evidenceStatus } });
    }

    await logAction({
      actorId: null,
      actorRole: "system",
      actionType: status === "timeout" ? "ai.timeout" : "ai.complete",
      targetType: "case",
      targetId: caseId,
      ipAddress: "internal",
      metadata: { fileId, tamperScore, status, overallScore, overallRisk },
    });

    return NextResponse.json({ message: "Case updated", status: newStatus });
  } catch (err) {
    console.error("[ai-complete]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
