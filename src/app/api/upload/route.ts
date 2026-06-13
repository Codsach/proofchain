import { NextRequest, NextResponse } from "next/server";
import { logAction } from "@/lib/audit";
import { getIp, withAuth } from "@/lib/auth";
import type { JWTPayload } from "@/lib/auth";
import { uploadEvidenceFiles } from "@/lib/evidence-files";
import { MAX_FILES_PER_CASE } from "@/lib/schemas/case";

export const runtime = "nodejs";

async function uploadFiles(
  req: NextRequest,
  _ctx: { params: Promise<Record<string, string>> },
  user: JWTPayload
) {
  try {
    const formData = await req.formData();
    const filesFromList = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);
    const singleFile = formData.get("file");
    const files =
      filesFromList.length > 0
        ? filesFromList
        : singleFile instanceof File
          ? [singleFile]
          : [];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "At least one file is required" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_CASE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_CASE} files per upload` },
        { status: 400 }
      );
    }

    const uploadedFiles = await uploadEvidenceFiles(files);

    for (const file of uploadedFiles) {
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
          source: "api.upload",
        },
      });
    }

    return NextResponse.json(
      {
        files: uploadedFiles.map((file) => ({
          fileId: file.fileId,
          originalName: file.originalName,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          sha256Hash: file.sha256Hash,
          ipfsCid: file.ipfsCid,
          url: file.url,
          uploadedAt: file.uploadedAt.toISOString(),
        })),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[upload]", err);
    const message =
      err instanceof Error ? err.message : "File upload failed. Please try again.";

    return NextResponse.json(
      { error: message },
      { status: message.includes("not allowed") || message.includes("50 MB") ? 400 : 502 }
    );
  }
}

export const POST = withAuth(uploadFiles, ["investigator"]);
