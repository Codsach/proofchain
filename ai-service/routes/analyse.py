"""
POST /analyse — main AI analysis endpoint.

Called by Next.js backend after every evidence file upload.
Protected by x-internal-key header.
"""

import os
import tempfile
import logging
import httpx
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from exif import extract_exif
from gemini import analyse_image
from scorer import compute_score
from pdf_check import has_text_layer

logger = logging.getLogger(__name__)
router = APIRouter()

NEXTJS_CALLBACK_URL = os.getenv("NEXTJS_CALLBACK_URL", "http://localhost:3000")
INTERNAL_AI_KEY = os.getenv("INTERNAL_AI_KEY", "")


@router.post("/analyse")
async def analyse_evidence(
    file: UploadFile = File(...),
    case_id: str = Form(...),
    file_id: str = Form(...),
    mime_type: str = Form(...),
):
    """
    Run the full AI analysis pipeline on an evidence file.

    Pipeline:
    1. Save file to temp disk
    2. EXIF metadata extraction
    3. Gemini Vision analysis (images only)
    4. PDF text layer check (PDFs only)
    5. Tamper score computation
    6. Store AI report in MongoDB via Next.js callback
    7. Update case status via Next.js callback
    """
    logger.info(f"[analyse] Starting analysis — caseId={case_id}, fileId={file_id}")

    file_bytes = await file.read()

    # ── 1. EXIF analysis ──────────────────────────────────────────────────────
    exif_result = None
    with tempfile.NamedTemporaryFile(
        delete=False, suffix=_ext_from_mime(mime_type)
    ) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        # is_field_incident — we treat all submissions as potential field incidents
        # A future version can pass this from case metadata
        exif_result = extract_exif(tmp_path, is_field_incident=True)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    # ── 2. Gemini Vision analysis (images only) ───────────────────────────────
    gemini_result = None
    if mime_type.startswith("image/"):
        gemini_result = analyse_image(file_bytes, mime_type)
    else:
        from gemini import GeminiResult
        gemini_result = GeminiResult(
            manipulation_likelihood="inconclusive",
            findings=["Non-image file — visual analysis not applicable"],
            confidence="inconclusive",
        )

    # ── 3. PDF text layer check ───────────────────────────────────────────────
    is_pdf_no_text_layer = False
    if mime_type == "application/pdf":
        text_layer = has_text_layer(file_bytes)
        if text_layer is False:
            is_pdf_no_text_layer = True

    # ── 4. Compute tamper score ───────────────────────────────────────────────
    score_result = compute_score(exif_result, gemini_result, is_pdf_no_text_layer)

    # ── 5. Build AI report payload ────────────────────────────────────────────
    from datetime import datetime, timezone

    ai_report = {
        "caseId": case_id,
        "fileId": file_id,
        "analysedAt": datetime.now(timezone.utc).isoformat(),
        "exif": {
            "software": exif_result.software,
            "gps_present": exif_result.gps_present,
            "creation_timestamp": exif_result.creation_timestamp,
            "modification_timestamp": exif_result.modification_timestamp,
            "device": f"{exif_result.device_make or ''} {exif_result.device_model or ''}".strip() or None,
            "flags": exif_result.flags,
        },
        "gemini": {
            "manipulation_likelihood": gemini_result.manipulation_likelihood,
            "findings": gemini_result.findings,
            "confidence": gemini_result.confidence,
        },
        "tamperScore": score_result.score,
        "riskLevel": score_result.risk_level,
        "scoreBreakdown": score_result.score_breakdown,
        "plainNotesSummary": score_result.plain_notes,
        "status": "complete",
    }

    # ── 6. POST results back to Next.js ───────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # First: store the AI report
            store_res = await client.post(
                f"{NEXTJS_CALLBACK_URL}/api/internal/ai-report",
                json=ai_report,
                headers={"x-internal-key": INTERNAL_AI_KEY},
            )

            report_mongo_id = None
            if store_res.status_code == 201:
                report_mongo_id = store_res.json().get("reportId")

            # Then: update case status
            await client.post(
                f"{NEXTJS_CALLBACK_URL}/api/internal/ai-complete",
                json={
                    "caseId": case_id,
                    "fileId": file_id,
                    "aiReportMongoId": report_mongo_id,
                    "tamperScore": score_result.score,
                    "status": "complete",
                },
                headers={"x-internal-key": INTERNAL_AI_KEY},
            )

    except httpx.RequestError as e:
        logger.error(f"[analyse] Callback to Next.js failed: {e}")
        # Don't raise — analysis succeeded, just callback failed
        # Next.js will check via polling or timeout mechanism

    logger.info(
        f"[analyse] Done — caseId={case_id}, score={score_result.score}, "
        f"risk={score_result.risk_level}"
    )

    return JSONResponse(
        {"message": "Analysis complete", "tamperScore": score_result.score}
    )


def _ext_from_mime(mime_type: str) -> str:
    mapping = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "application/pdf": ".pdf",
        "video/mp4": ".mp4",
        "text/plain": ".log",
        "application/octet-stream": ".bin",
    }
    return mapping.get(mime_type, ".tmp")