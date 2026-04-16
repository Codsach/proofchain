import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import { getOnChainRecord, getOnChainTransferLog } from "@/lib/blockchain";
import { logAction } from "@/lib/audit";
import { fetchAndHashFromIPFS } from "@/lib/ipfs";

export const runtime = "nodejs";

// Rate-limit store — simple in-memory, resets on server restart
// For production use Upstash Redis
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const { caseId } = params;

    await connectDB();

    // 1. Load case from MongoDB
    const caseDoc = await Case.findOne({ caseId }).select(
      "caseId files onChainTxHash status"
    );

    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // 2. Fetch on-chain record
    const onChainRecord = await getOnChainRecord(caseId);

    if (!onChainRecord) {
      return NextResponse.json({
        caseId,
        onChainRecord: null,
        message: "This case has not been anchored on-chain yet, or the blockchain is unreachable.",
        status: caseDoc.status,
      });
    }

    // 3. Fetch current file hash from IPFS and compare to on-chain hash
    // We check the first file only for the primary verification
    const primaryFile = caseDoc.files[0];
    let hashMatch = false;
    let currentFileHash: string | null = null;

    if (primaryFile) {
      try {
        currentFileHash = await fetchAndHashFromIPFS(
          primaryFile.ipfsCid,
          primaryFile.originalName
        );

        if (currentFileHash) {
          const onChainHex = onChainRecord.fileHash.replace("0x", "").toLowerCase();
          hashMatch = onChainHex === currentFileHash.toLowerCase();
        }
      } catch {
        // IPFS may be unavailable — still return on-chain data
      }
    }

    // 4. Get transfer log
    const transferLog = await getOnChainTransferLog(caseId);

    // 5. Log public verification
    await logAction({
      actorId: null,
      actorRole: "public",
      actionType: "verify.public_check",
      targetType: "case",
      targetId: caseId,
      ipAddress: ip,
      metadata: { hashMatch },
    });

    return NextResponse.json({
      caseId,
      onChainHash: onChainRecord.fileHash,
      onChainTimestamp: new Date(onChainRecord.submittedAt * 1000).toISOString(),
      ipfsCid: onChainRecord.ipfsCid,
      currentFileHash,
      hashMatch,
      fileAvailable: currentFileHash !== null,
      verdictIssued: onChainRecord.verdictIssued,
      verdictHash: onChainRecord.verdictIssued ? onChainRecord.verdictHash : null,
      verdictAt: onChainRecord.verdictIssued
        ? new Date(onChainRecord.verdictAt * 1000).toISOString()
        : null,
      transferCount: onChainRecord.transferCount,
      transferLog: transferLog.map((t) => ({
        transferHash: t.transferHash,
        transferredAt: new Date(t.transferredAt * 1000).toISOString(),
      })),
    });
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
