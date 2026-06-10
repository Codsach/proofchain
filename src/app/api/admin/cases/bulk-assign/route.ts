import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import User from "@/lib/models/User";
import { Transfer } from "@/lib/models/Verdict";
import { withAuth, getIp, JWTPayload } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { computeTransferHash, anchorTransfer } from "@/lib/blockchain";
import { z } from "zod";

const BulkAssignSchema = z.object({
  caseIds: z.array(z.string()).min(1),
  analystId: z.string().min(1),
});

async function anchorTransferAsync(
  caseId: string,
  transferHash: string,
  mongoId: string
) {
  try {
    const txHash = await anchorTransfer(caseId, transferHash);
    await Transfer.findByIdAndUpdate(mongoId, { onChainTxHash: txHash });
  } catch (err) {
    console.error("[bulk-transfer/anchor]", err);
  }
}

async function bulkAssignCases(
  req: NextRequest,
  _ctx: any,
  user: JWTPayload
) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = BulkAssignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { caseIds, analystId } = parsed.data;

    const recipient = await User.findById(analystId).select("isActive role");
    if (!recipient || !recipient.isActive || recipient.role !== "analyst") {
      return NextResponse.json({ error: "Invalid or inactive analyst" }, { status: 400 });
    }

    const cases = await Case.find({ caseId: { $in: caseIds } });
    if (cases.length === 0) {
      return NextResponse.json({ error: "No valid cases found" }, { status: 404 });
    }

    const ts = Date.now();
    let assignedCount = 0;

    for (const caseDoc of cases) {
      if (["verified", "rejected", "archived"].includes(caseDoc.status)) {
        continue; // skip closed cases
      }

      if (caseDoc.currentCustodian.toString() === analystId) {
        continue; // already assigned
      }

      const transferHash = computeTransferHash(user.userId, analystId, "Admin Bulk Assignment", ts);

      const transferDoc = await Transfer.create({
        caseId: caseDoc.caseId,
        fromUserId: user.userId,
        toUserId: analystId,
        reason: "Admin Bulk Assignment",
        notes: null,
        transferHash,
        onChainTxHash: null,
        transferredAt: new Date(ts),
      });

      caseDoc.currentCustodian = analystId as any;
      if (caseDoc.status === "pending_review") {
        caseDoc.status = "under_review";
      }
      await caseDoc.save();

      await logAction({
        actorId: user.userId,
        actorRole: user.role,
        actionType: "transfer.initiate",
        targetType: "case",
        targetId: caseDoc.caseId,
        ipAddress: getIp(req),
        metadata: { toUserId: analystId, transferHash },
      });

      anchorTransferAsync(caseDoc.caseId, transferHash, transferDoc._id.toString());
      assignedCount++;
    }

    return NextResponse.json({ message: `Assigned ${assignedCount} cases successfully` });

  } catch (err) {
    console.error("[bulk-assign]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withAuth(bulkAssignCases, ["admin"]);
