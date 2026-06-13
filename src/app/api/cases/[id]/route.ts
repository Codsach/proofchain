import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import { withAuth, getIp, JWTPayload } from "@/lib/auth";
import { logAction } from "@/lib/audit";

async function getCase(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
  user: JWTPayload
) {
  try {
    await connectDB();

    const { id: caseId } = await ctx.params;

    const query = Case.findOne({ caseId }).select("-__v");

    // Investigators can only see their own cases
    if (user.role === "investigator") {
      query.where({ investigatorId: user.userId });
    }

    const caseDoc = await query.lean();

    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Strip investigator identity from analyst view — PRD REV-08
    let responseDoc: Record<string, unknown> = { ...caseDoc as unknown as Record<string, unknown> };
    if (user.role === "analyst") {
      delete responseDoc.investigatorId;
    }

    await logAction({
      actorId: user.userId,
      actorRole: user.role,
      actionType: "case.view",
      targetType: "case",
      targetId: caseId,
      ipAddress: getIp(req),
    });

    return NextResponse.json(responseDoc);
  } catch (err) {
    console.error("[case/get]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(getCase, ["investigator", "analyst", "admin"]);