import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import { logAction } from "@/lib/audit";

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

    // Update case status
    const newStatus =
      status === "timeout" ? "ai_timeout" : "pending_review";

    await Case.findOneAndUpdate(
      { caseId },
      {
        status: newStatus,
        ...(aiReportMongoId ? { aiReportId: aiReportMongoId } : {}),
      }
    );

    await logAction({
      actorId: null,
      actorRole: "system",
      actionType: status === "timeout" ? "ai.timeout" : "ai.complete",
      targetType: "case",
      targetId: caseId,
      ipAddress: "internal",
      metadata: { fileId, tamperScore, status },
    });

    return NextResponse.json({ message: "Case updated" });
  } catch (err) {
    console.error("[ai-complete]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
