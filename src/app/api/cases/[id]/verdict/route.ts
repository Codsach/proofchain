import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import User from "@/lib/models/User";
import Verdict  from "@/lib/models/Verdict";
import { withAuth, getIp, JWTPayload } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { VerdictSchema } from "@/lib/schemas/case";
import { NotificationModel } from "@/lib/models/Notification";
import { notifyInvestigator } from "@/lib/email";

async function issueVerdict(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
  user: JWTPayload
) {
  try {
    await connectDB();

    const { id: caseId } = await ctx.params;
    const body = await req.json();

    // 1. Validate input
    const parsed = VerdictSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { verdict, reason } = parsed.data;

    // 2. Load case
    const caseDoc = await Case.findOne({ caseId });
    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // 3. Check case is in a reviewable state
    const reviewableStatuses = ["pending_review", "ai_timeout", "under_review"];
    if (!reviewableStatuses.includes(caseDoc.status)) {
      return NextResponse.json(
        { error: `Cannot issue verdict on a case with status: ${caseDoc.status}` },
        { status: 409 }
      );
    }

    // 4. Check no verdict already exists
    const existing = await Verdict.findOne({ caseId });
    if (existing) {
      return NextResponse.json(
        { error: "A verdict has already been issued for this case" },
        { status: 409 }
      );
    }

    // 5. Compute verdict hash — keccak256(analystId + verdict + reason)
    // Using SHA-256 as Node.js equivalent of keccak256 for storage
    // The actual keccak256 is computed in blockchain.ts for on-chain use
    const verdictHash = crypto
      .createHash("sha256")
      .update(`${user.userId}:${verdict}:${reason}:${Date.now()}`)
      .digest("hex");

    // 6. Save verdict to MongoDB
    const verdictDoc = await Verdict.create({
      caseId,
      analystId: user.userId,
      verdict,
      reason,
      verdictHash,
      onChainTxHash: null, // filled in after blockchain anchoring
      issuedAt: new Date(),
    });

    // 7. Update case status
    caseDoc.status = verdict === "verified" ? "verified" : "rejected";
    await caseDoc.save();

    // 8. Log the action
    await logAction({
      actorId: user.userId,
      actorRole: user.role,
      actionType: "verdict.issue",
      targetType: "case",
      targetId: caseId,
      ipAddress: getIp(req),
      metadata: { verdict, verdictHash },
    });

    // 9. Notify investigator by email (non-blocking)
    notifyInvestigator(caseDoc.investigatorId.toString(), caseId, caseDoc.title, verdict, reason).catch(
      (err) => console.error("[verdict] Email notification failed:", err)
    );

    // 9.1 In-app Notification
    await NotificationModel.create({
      recipientId: caseDoc.investigatorId.toString(),
      type: "verdict_issued",
      title: "Verdict Issued",
      message: `A verdict of ${verdict.toUpperCase()} was issued for ${caseDoc.title}.`,
      link: `/investigator/cases/${caseId}`,
    });

    // 10. Anchor verdict on blockchain (non-blocking)
    anchorVerdictOnChain(caseId, verdictHash, verdictDoc._id.toString()).catch(
      (err) => console.error("[verdict] Blockchain anchor failed:", err)
    );

    return NextResponse.json({
      message: "Verdict issued successfully",
      verdict,
      verdictHash,
    });
  } catch (err) {
    console.error("[verdict]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function anchorVerdictOnChain(
  caseId: string,
  verdictHash: string,
  verdictMongoId: string
) {
  try {
    const { anchorVerdict } = await import("@/lib/blockchain");
    const { default: VerdictModel } = await import("@/lib/models/Verdict");
    
    const txHash = await anchorVerdict(caseId, verdictHash);
    await VerdictModel.findByIdAndUpdate(verdictMongoId, { onChainTxHash: txHash });
 
    console.log(`[blockchain] Verdict anchored — caseId=${caseId}, txHash=${txHash}`);
  } catch (err) {
    console.error(`[blockchain/verdict] Failed for caseId=${caseId}:`, err);
  }
}
export const GET = withAuth(
  async (req: NextRequest, context, user) => {
    const verdicts = await Verdict.find(); // or filter based on user

    return NextResponse.json(verdicts);
  },
  ["admin", "analyst", "investigator"]
);
export const POST = withAuth(issueVerdict, ["analyst"]);
export {};