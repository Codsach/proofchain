import { callFastAPI } from "./fastapi";

export async function queueAIAnalysis(
  evidenceId: string,
  ipfsCid: string,
  fileType: string
) {
  try {
    return await callFastAPI("/analyze", {
      method: "POST",
      body: JSON.stringify({
        evidenceId,
        ipfsCid,
        fileType,
      }),
    });
  } catch (error) {
    console.error(`AI analysis queuing failed for ${evidenceId}:`, error);
    // We don't throw here to ensure the evidence upload itself is considered successful
    // but the status remains 'pending_ai_review'
    return null;
  }
}
