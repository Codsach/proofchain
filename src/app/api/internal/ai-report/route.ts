import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AiReport from "@/lib/models/AiReport";
import { logAction } from "@/lib/audit";

// Called by FastAPI to store the AI analysis report in MongoDB.
// Protected by the internal key — not public.

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-internal-key");
  if (!key || key !== process.env.INTERNAL_AI_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();

    const {
      caseId,
      fileId,
      analysedAt,
      exif,
      gemini,
      tamperScore,
      riskLevel,
      scoreBreakdown,
      plainNotesSummary,
      status,
    } = body;

    if (!caseId || !fileId || tamperScore === undefined) {
      return NextResponse.json(
        { error: "caseId, fileId and tamperScore are required" },
        { status: 400 }
      );
    }

    const report = await AiReport.create({
      caseId,
      fileId,
      analysedAt: analysedAt ? new Date(analysedAt) : new Date(),
      exifData: exif ?? {},
      geminiResult: gemini ?? {},
      tamperScore,
      riskLevel: riskLevel ?? "low",
      scoreBreakdown: scoreBreakdown ?? {},
      plainNotesSummary: plainNotesSummary ?? "",
      status: status ?? "complete",
    });

    await logAction({
      actorId: null,
      actorRole: "system",
      actionType: "ai.complete",
      targetType: "case",
      targetId: caseId,
      ipAddress: "internal",
      metadata: { fileId, tamperScore, riskLevel },
    });

    return NextResponse.json(
      { message: "AI report stored", reportId: report._id.toString() },
      { status: 201 }
    );
  } catch (err) {
    console.error("[ai-report]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
