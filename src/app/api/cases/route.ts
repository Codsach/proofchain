import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Case from "@/lib/models/Case";
import { withAuth, getIp } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { v4 as uuidv4 } from "uuid";
import { uploadEvidenceFiles } from "@/lib/evidence-files";
import { getIpfsGatewayUrl } from "@/lib/ipfs-gateway";
import {
  CreateCaseSchema,
  MAX_FILES_PER_CASE,
} from "@/lib/schemas/case";
import type { JWTPayload } from "@/lib/auth";

export const runtime = "nodejs";

// Install uuid: npm install uuid @types/uuid

// ── POST /api/cases — create a new case ──────────────────────────────────────
async function createCase(
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  user: JWTPayload
) {
  try {
    await connectDB();

    // 1. Parse multipart form
    const formData = await req.formData();

    // 2. Extract and validate text fields
    const rawFields = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      incidentDate: formData.get("incidentDate") as string,
      incidentType: formData.get("incidentType") as string,
      gpsLat: formData.get("gpsLat") ? Number(formData.get("gpsLat")) : null,
      gpsLng: formData.get("gpsLng") ? Number(formData.get("gpsLng")) : null,
      gpsAccuracy: formData.get("gpsAccuracy") ? Number(formData.get("gpsAccuracy")) : null,
    };

    const parsed = CreateCaseSchema.safeParse(rawFields);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // 3. Extract files
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "At least one evidence file is required" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_CASE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_CASE} files per submission` },
        { status: 400 }
      );
    }

    // 4. Check rate limit — max 3 active open cases per investigator
    const activeCaseCount = await Case.countDocuments({
      investigatorId: user.userId,
      status: { $in: ["pending_ai_review", "pending_review", "under_review"] },
    });

    if (activeCaseCount >= 3) {
      return NextResponse.json(
        {
          error:
            "You have reached the maximum of 3 active open cases. Wait for an existing case to be resolved.",
        },
        { status: 429 }
      );
    }

    // 5. Process each file
    let uploadedFiles;
    try {
      uploadedFiles = await uploadEvidenceFiles(files);
    } catch (err) {
      console.error("[cases/create] IPFS upload failed:", err);
      const message =
        err instanceof Error ? err.message : "File storage failed. Please try again.";

      return NextResponse.json(
        { error: message },
        { status: message.includes("not allowed") || message.includes("50 MB") ? 400 : 502 }
      );
    }

    const fileRecords = [];

    for (const file of uploadedFiles) {
      fileRecords.push({
        fileId: file.fileId,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        sha256Hash: file.sha256Hash,
        ipfsCid: file.ipfsCid,
        gpsLat: parsed.data.gpsLat ?? null,
        gpsLng: parsed.data.gpsLng ?? null,
        gpsAccuracy: parsed.data.gpsAccuracy ?? null,
        uploadedAt: file.uploadedAt,
      });

      await logAction({
        actorId: user.userId,
        actorRole: user.role,
        actionType: "file.upload",
        targetType: "file",
        targetId: file.fileId,
        ipAddress: getIp(req),
        metadata: {
          fileName: file.originalName,
          sizeBytes: file.sizeBytes,
          ipfsCid: file.ipfsCid,
        },
      });
    }

    // 6. Create case in MongoDB
    const caseId = uuidv4();

    const newCase = await Case.create({
      caseId,
      investigatorId: user.userId,
      currentCustodian: user.userId,
      title: parsed.data.title,
      description: parsed.data.description,
      incidentDate: new Date(parsed.data.incidentDate),
      incidentType: parsed.data.incidentType,
      status: "pending_ai_review",
      files: fileRecords,
      aiReportId: null,
      onChainTxHash: null,
    });

    await logAction({
      actorId: user.userId,
      actorRole: user.role,
      actionType: "case.create",
      targetType: "case",
      targetId: caseId,
      ipAddress: getIp(req),
      metadata: { title: parsed.data.title, fileCount: fileRecords.length },
    });

    // 7. Trigger AI analysis asynchronously — do NOT await
    // This runs after we return the response to the client
    triggerAIAnalysis(caseId, newCase._id.toString(), fileRecords).catch(
      (err) => console.error("[cases/create] AI trigger failed:", err)
    );

    return NextResponse.json(
      {
        message: "Case created successfully",
        caseId,
        status: "pending_ai_review",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[cases/create]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Async AI trigger — fires after response is sent ──────────────────────────
async function triggerAIAnalysis(
  caseId: string,
  mongoId: string,
  fileRecords: Array<{
    fileId: string;
    originalName: string;
    mimeType: string;
    ipfsCid: string;
    sha256Hash: string;
  }>
) {
  const fastApiUrl = process.env.FASTAPI_URL;
  const internalKey = process.env.INTERNAL_AI_KEY;

  if (!fastApiUrl || !internalKey) {
    console.error("[AI trigger] FASTAPI_URL or INTERNAL_AI_KEY not set");
    return;
  }

  for (const file of fileRecords) {
    try {
      // Fetch file from IPFS for analysis
      const ipfsUrl = getIpfsGatewayUrl(file.ipfsCid);
      const fileRes = await fetch(ipfsUrl);

      if (!fileRes.ok) {
        console.error(`[AI trigger] Could not fetch file from IPFS: ${file.ipfsCid}`);
        continue;
      }

      const fileBuffer = Buffer.from(await fileRes.arrayBuffer());

      // Send to FastAPI for analysis
      const aiFormData = new FormData();
      aiFormData.append(
        "file",
        new Blob([fileBuffer], { type: file.mimeType }),
        file.originalName
      );
      aiFormData.append("case_id", caseId);
      aiFormData.append("file_id", file.fileId);
      aiFormData.append("mime_type", file.mimeType);

      await fetch(`${fastApiUrl}/analyse`, {
        method: "POST",
        headers: { "x-internal-key": internalKey },
        body: aiFormData,
      });
    } catch (err) {
      console.error(`[AI trigger] Error for file ${file.fileId}:`, err);
    }
  }
}

// ── GET /api/cases — list investigator's own cases ───────────────────────────
async function listCases(
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  user: JWTPayload
) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 20;
    const skip = (page - 1) * limit;

    // Analysts and admins see all cases; investigators see only their own
    const filter =
      user.role === "investigator" ? { investigatorId: user.userId } : {};

    const [cases, total] = await Promise.all([
      Case.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Case.countDocuments(filter),
    ]);

    return NextResponse.json({
      cases,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[cases/list]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Export routes with auth middleware
export const POST = withAuth(createCase, ["investigator"]);
export const GET = withAuth(listCases, ["investigator", "analyst", "admin"]);
