import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import User from "@/lib/models/User";
import Verdict  from "@/lib/models/Verdict";
import { withAuth, getIp, JWTPayload } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { VerdictSchema } from "@/lib/schemas/case";

const resend = new Resend(process.env.RESEND_API_KEY);

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

async function notifyInvestigator(
  investigatorId: string,
  caseId: string,
  caseTitle: string,
  verdict: string,
  reason: string
) {
  const investigator = await User.findById(investigatorId).select("email fullName");
  if (!investigator) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const statusColor = verdict === "verified" ? "#00C9A7" : "#FF6B6B";
  const statusLabel = verdict === "verified" ? "VERIFIED" : "REJECTED";

  await resend.emails.send({
    from: "ProofChain <noreply@proofchain.app>",
    to: investigator.email,
    subject: `Case ${statusLabel}: ${caseTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0D1B2A;color:#E8E8F0;padding:32px;border-radius:8px;">
        <h2 style="color:#00C9A7;margin-top:0;">ProofChain</h2>
        <p>Hi ${investigator.fullName},</p>
        <p>A verdict has been issued on your case:</p>
        <div style="background:#1C1C28;border-radius:6px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;font-size:12px;color:#8888AA;">Case</p>
          <p style="margin:0 0 16px;font-weight:bold;">${caseTitle}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#8888AA;">Verdict</p>
          <p style="margin:0 0 16px;font-weight:bold;color:${statusColor};">${statusLabel}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#8888AA;">Reason</p>
          <p style="margin:0;color:#E8E8F0;">${reason}</p>
        </div>
        <a href="${appUrl}/investigator/cases/${caseId}"
           style="display:inline-block;background:#00C9A7;color:#000;padding:10px 20px;
                  text-decoration:none;border-radius:6px;font-weight:bold;margin-top:8px;">
          View Case
        </a>
        <p style="font-size:11px;color:#555570;margin-top:24px;">
          ProofChain · Digital Forensic Evidence Platform
        </p>
      </div>
    `,
  });
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