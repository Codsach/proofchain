import { NextRequest, NextResponse } from "next/server";
import { logAction } from "@/lib/audit";
import { getIp, verifyAuth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { EvidenceModel } from "@/lib/models/Evidence";
import { uploadToIPFS } from "@/lib/ipfs";
import { sha256 as computeSHA256 } from "@/lib/hash";
import { queueAIAnalysis } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "investigator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const caseId = formData.get("caseId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const captureMethod = formData.get("captureMethod") as string; // "camera" | "upload"
    const latitude = formData.get("latitude") as string | null;
    const longitude = formData.get("longitude") as string | null;
    const altitude = formData.get("altitude") as string | null;
    const gpsAccuracy = formData.get("gpsAccuracy") as string | null;
    const capturedAt = formData.get("capturedAt") as string | null;
    const deviceInfo = formData.get("deviceInfo") as string | null;
    const offlineQueueId = formData.get("offlineQueueId") as string | null;

    if (!file || !caseId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: file, caseId, title" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Max 200MB
    if (file.size > 200 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum 200MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute SHA-256 server-side
    const fileHash = await computeSHA256(buffer);

    // Check for duplicate hash within same case
    const duplicate = await EvidenceModel.findOne({ caseId, fileHash });
    if (duplicate) {
      return NextResponse.json(
        { error: "Duplicate evidence: identical file already exists in this case" },
        { status: 409 }
      );
    }

    // Upload to IPFS
    const ipfsResult = await uploadToIPFS(buffer, file.name, file.type);
    const ipfsCid = ipfsResult.cid;

    // Build GPS metadata object
    const gpsMetadata =
      latitude && longitude
        ? {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            altitude: altitude ? parseFloat(altitude) : null,
            accuracy: gpsAccuracy ? parseFloat(gpsAccuracy) : null,
            capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
          }
        : null;

    // Parse device info
    let parsedDeviceInfo = null;
    if (deviceInfo) {
      try {
        parsedDeviceInfo = JSON.parse(deviceInfo);
      } catch {
        parsedDeviceInfo = { raw: deviceInfo };
      }
    }

    // Create evidence record
    const evidence = await EvidenceModel.create({
      caseId,
      title,
      description,
      uploadedBy: user.userId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileHash,
      ipfsCid,
      status: "pending_ai_review",
      captureMethod: (captureMethod as "camera" | "upload") || "upload",
      gpsMetadata,
      deviceInfo: parsedDeviceInfo,
      offlineQueueId: offlineQueueId || null,
      submittedAt: new Date(),
    });

    // Queue AI analysis
    await queueAIAnalysis(evidence._id.toString(), caseId, buffer, file.name, file.type);

    // Audit log
    await logAction({
      actionType: "evidence.submit",
      actorId: user.userId,
      actorRole: user.role,
      targetId: evidence._id.toString(),
      targetType: "Evidence",
      ipAddress: getIp(req),
      metadata: {
        caseId,
        fileHash,
        ipfsCid,
        captureMethod,
        hasGPS: !!gpsMetadata,
        offlineQueueId,
      },
    });

    return NextResponse.json({
      success: true,
      evidenceId: evidence._id.toString(),
      fileHash,
      ipfsCid,
      status: evidence.status,
    });
  } catch (error) {
    console.error("Evidence upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}