export async function queueAIAnalysis(
  evidenceId: string,
  caseId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  hasGps: boolean = false
) {
  try {
    const fastApiUrl = process.env.FASTAPI_URL;
    const internalKey = process.env.INTERNAL_AI_KEY;

    if (!fastApiUrl || !internalKey) {
      console.error("[AI queue] FASTAPI_URL or INTERNAL_AI_KEY not set");
      return null;
    }

    const aiFormData = new FormData();
    aiFormData.append(
      "file",
      new Blob([new Uint8Array(fileBuffer)], { type: mimeType }),
      fileName
    );
    aiFormData.append("case_id", caseId);
    aiFormData.append("file_id", evidenceId);
    aiFormData.append("mime_type", mimeType);
    aiFormData.append("has_gps", hasGps ? "true" : "false");

    const res = await fetch(`${fastApiUrl}/analyse`, {
      method: "POST",
      headers: { "x-internal-key": internalKey },
      body: aiFormData,
    });

    if (!res.ok) {
      throw new Error(`FastAPI request failed: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`AI analysis queuing failed for ${evidenceId}:`, error);
    // We don't throw here to ensure the evidence upload itself is considered successful
    // but the status remains 'pending_ai_review'
    return null;
  }
}
