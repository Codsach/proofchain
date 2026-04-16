import { v4 as uuidv4 } from "uuid";
import { sha256 } from "./hash";
import { uploadToIPFS } from "./ipfs";
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "./schemas/case";

export interface UploadedEvidenceFile {
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  ipfsCid: string;
  uploadedAt: Date;
  url: string;
}

function validateEvidenceFile(file: File): string {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File "${file.name}" exceeds the 50 MB limit`);
  }

  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(
      `File type "${extension}" is not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}`
    );
  }

  const mimeType = file.type || "application/octet-stream";
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new Error(`MIME type "${mimeType}" is not allowed`);
  }

  return mimeType;
}

export async function uploadEvidenceFiles(
  files: File[]
): Promise<UploadedEvidenceFile[]> {
  const uploaded: UploadedEvidenceFile[] = [];

  for (const file of files) {
    const mimeType = validateEvidenceFile(file);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sha256Hash = sha256(buffer);
    const fileId = uuidv4();
    const ipfsResult = await uploadToIPFS(buffer, file.name, mimeType);

    uploaded.push({
      fileId,
      originalName: file.name,
      mimeType,
      sizeBytes: file.size,
      sha256Hash,
      ipfsCid: ipfsResult.cid,
      uploadedAt: new Date(),
      url: ipfsResult.url,
    });
  }

  return uploaded;
}
