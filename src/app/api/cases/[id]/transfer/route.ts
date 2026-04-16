import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import User from "@/lib/models/User";
import { Transfer } from "@/lib/models/Verdict";
import { withAuth, getIp, JWTPayload } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { TransferSchema } from "@/lib/schemas/case";
import { computeTransferHash, anchorTransfer } from "@/lib/blockchain";

async function initiateTransfer(
  req: NextRequest,
  ctx: { params: Record<string, string> },
  user: JWTPayload
) {
  try {
    await connectDB();
    const { caseId } = ctx.params;
    const body = await req.json();

    // 1. Validate input
    const parsed = TransferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { toUserId, reason, notes } = parsed.data;

    // 2. Load case
    const caseDoc = await Case.findOne({ caseId });
    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // 3. Only the current custodian can transfer
    if (caseDoc.currentCustodian.toString() !== user.userId) {
      return NextResponse.json(
        { error: "Only the current custodian can transfer this case" },
        { status: 403 }
      );
    }

    // 4. Case must not be closed
    if (["verified", "rejected", "archived"].includes(caseDoc.status)) {
      return NextResponse.json(
        { error: "Cannot transfer a closed case" },
        { status: 409 }
      );
    }

    // 5. Check transfer limit
    const existingTransfers = await Transfer.countDocuments({ caseId });
    if (existingTransfers >= 10) {
      return NextResponse.json(
        { error: "Transfer limit of 10 reached for this case" },
        { status: 409 }
      );
    }

    // 6. Verify recipient exists and is active
    const recipient = await User.findById(toUserId).select("isActive fullName email");
    if (!recipient || !recipient.isActive) {
      return NextResponse.json(
        { error: "Recipient user not found or inactive" },
        { status: 404 }
      );
    }

    if (toUserId === user.userId) {
      return NextResponse.json(
        { error: "Cannot transfer a case to yourself" },
        { status: 400 }
      );
    }

    // 7. Compute transfer hash
    const ts = Date.now();
    const transferHash = computeTransferHash(user.userId, toUserId, reason, ts);

    // 8. Save transfer record to MongoDB
    const transferDoc = await Transfer.create({
      caseId,
      fromUserId: user.userId,
      toUserId,
      reason,
      notes: notes ?? null,
      transferHash,
      onChainTxHash: null,
      transferredAt: new Date(ts),
    });

    // 9. Update case custodian
    caseDoc.currentCustodian = toUserId as unknown as typeof caseDoc.currentCustodian;
    if (caseDoc.status === "pending_review") {
      caseDoc.status = "under_review";
    }
    await caseDoc.save();

    // 10. Log
    await logAction({
      actorId: user.userId,
      actorRole: user.role,
      actionType: "transfer.initiate",
      targetType: "case",
      targetId: caseId,
      ipAddress: getIp(req),
      metadata: { toUserId, transferHash },
    });

    // 11. Anchor on blockchain (non-blocking)
    anchorTransferAsync(caseId, transferHash, transferDoc._id.toString());

    return NextResponse.json({
      message: "Custody transferred successfully",
      transferHash,
      newCustodian: {
        id: toUserId,
        fullName: recipient.fullName,
        email: recipient.email,
      },
    });
  } catch (err) {
    console.error("[transfer]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getTransferLog(
  _req: NextRequest,
  ctx: { params: Record<string, string> },
  _user: JWTPayload
) {
  try {
    await connectDB();
    const { caseId } = ctx.params;

    const transfers = await Transfer.find({ caseId })
      .sort({ transferredAt: 1 })
      .populate("fromUserId", "fullName email role")
      .populate("toUserId", "fullName email role")
      .lean();

    return NextResponse.json({ transfers });
  } catch (err) {
    console.error("[transfer/get]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function anchorTransferAsync(
  caseId: string,
  transferHash: string,
  mongoId: string
) {
  try {
    const txHash = await anchorTransfer(caseId, transferHash);
    await Transfer.findByIdAndUpdate(mongoId, { onChainTxHash: txHash });
    await logAction({
      actorId: null,
      actorRole: "system",
      actionType: "transfer.chain_anchor",
      targetType: "case",
      targetId: caseId,
      ipAddress: "internal",
      metadata: { txHash },
    });
  } catch (err) {
    console.error("[transfer/anchor]", err);
  }
}

export const POST = withAuth(initiateTransfer, ["investigator", "analyst"]);
export const GET = withAuth(getTransferLog, ["investigator", "analyst", "admin"]);