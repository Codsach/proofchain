import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case, { IFileRecord } from "@/lib/models/Case";
import AiReport from "@/lib/models/AiReport";
import { withAuth } from "@/lib/auth";
import { getIpfsGatewayUrl } from "@/lib/ipfs-gateway";
import { queueAIAnalysis } from "@/lib/ai";

async function handleRescanAll(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: caseId } = await ctx.params;

    // 1. Find the case
    const caseDoc = await Case.findOne({ caseId });
    if (!caseDoc) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (!caseDoc.files || caseDoc.files.length === 0) {
      return NextResponse.json({ error: "Case has no files to scan" }, { status: 400 });
    }

    // 2. Loop through all files and run rescan in parallel
    const promises = caseDoc.files.map(async (file: IFileRecord) => {
      // Fetch the file content from IPFS
      const ipfsUrl = getIpfsGatewayUrl(file.ipfsCid);
      const ipfsRes = await fetch(ipfsUrl);
      if (!ipfsRes.ok) {
        throw new Error(`Failed to download file ${file.originalName} from IPFS`);
      }
      const arrayBuffer = await ipfsRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Find and delete the existing AiReport if it exists
      const existingReport = await AiReport.findOne({ caseId, fileId: file.fileId });
      if (existingReport) {
        await AiReport.deleteOne({ _id: existingReport._id });
        // Remove it from the case's aiReportIds list
        await Case.updateOne(
          { caseId },
          {
            $pull: { aiReportIds: existingReport._id },
          }
        );
      }

      // Trigger the AI queue
      const hasGps = file.gpsLat !== null && file.gpsLng !== null;
      await queueAIAnalysis(
        file.fileId,
        caseId,
        buffer,
        file.originalName,
        file.mimeType,
        hasGps
      );
    });

    await Promise.all(promises);

    // 3. Update the case status to pending_ai_review
    await Case.updateOne(
      { caseId },
      {
        $set: { status: "pending_ai_review" },
      }
    );

    return NextResponse.json({ success: true, message: "AI rescan for all files queued successfully" });
  } catch (err: unknown) {
    console.error("[rescan] Error triggering case-wide rescan:", err);
    const errMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export const POST = withAuth(handleRescanAll, ["analyst", "admin"]);
