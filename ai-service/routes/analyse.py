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
from pdf_check import check_pdf_anomalies
from magic_check import verify_mime
from office_check import analyse_office_doc
from media_check import analyse_media
from ai_detector import detect_ai_image

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

    # Run Magic MIME Check first
    is_mime_match, detected_mime = verify_mime(file_bytes, mime_type)
    mime_mismatch = not is_mime_match
    
    # Use detected MIME type for pipeline routing
    analysis_mime = detected_mime

    # ── 1. EXIF & Office analysis ─────────────────────────────────────────────
    exif_result = None
    office_result = None
    media_result = None
    ai_gen_result = None
    with tempfile.NamedTemporaryFile(
        delete=False, suffix=_ext_from_mime(analysis_mime)
    ) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        # is_field_incident — we treat all submissions as potential field incidents
        # A future version can pass this from case metadata
        exif_result = extract_exif(tmp_path, is_field_incident=True)
        
        # Check for Office files using detected MIME type
        office_mimes = [
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ]
        is_office = any(om in analysis_mime for om in office_mimes)
        if is_office:
            office_result = analyse_office_doc(tmp_path)

        # Check for media files (video/audio) using detected MIME type
        is_media = analysis_mime.startswith("video/") or analysis_mime.startswith("audio/")
        if is_media:
            media_result = analyse_media(tmp_path)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    # ── 2. Gemini Vision & Local AI-Generated check (images only, based on detected MIME) ──
    gemini_result = None
    ai_gen_result = None
    if analysis_mime.startswith("image/"):
        gemini_result = analyse_image(file_bytes, analysis_mime)
        ai_gen_result = detect_ai_image(file_bytes)
    else:
        from gemini import GeminiResult
        gemini_result = GeminiResult(
            manipulation_likelihood="inconclusive",
            findings=["Non-image file — visual analysis not applicable"],
            confidence="inconclusive",
        )

    # ── 3. PDF anomalies check (PDFs only, based on detected MIME) ────────────
    is_pdf_no_text_layer = False
    pdf_javascript_detected = False
    pdf_hidden_layers_detected = False
    if analysis_mime == "application/pdf":
        pdf_res = check_pdf_anomalies(file_bytes)
        is_pdf_no_text_layer = pdf_res.get("no_text_layer", False)
        pdf_javascript_detected = pdf_res.get("has_javascript", False)
        pdf_hidden_layers_detected = pdf_res.get("has_hidden_layers", False)

    # Append forensic flags to exif_result so they propagate automatically to frontend
    if exif_result:
        if mime_mismatch:
            exif_result.flags.append(f"mime_mismatch_detected:{detected_mime}")
        if office_result and office_result.get("has_macros"):
            macro_status = office_result.get("macro_status", "suspicious")
            exif_result.flags.append(f"office_macros_detected:{macro_status}")
        if media_result:
            if media_result.get("re_encoded"):
                exif_result.flags.append("video_reencoded_detected")
            if media_result.get("timestamp_mismatch"):
                exif_result.flags.append("av_timestamp_mismatch_detected")
            if media_result.get("duration_mismatch"):
                exif_result.flags.append("av_duration_mismatch_detected")
        if ai_gen_result and ai_gen_result.get("is_ai_generated"):
            exif_result.flags.append("ai_generated_image_detected")
        if pdf_javascript_detected:
            exif_result.flags.append("pdf_javascript_detected")
        if pdf_hidden_layers_detected:
            exif_result.flags.append("pdf_hidden_layers_detected")

    # ── 4. Compute tamper score ───────────────────────────────────────────────
    office_macros_detected = False
    office_macros_malicious = False
    if office_result and office_result.get("has_macros"):
        office_macros_detected = True
        if office_result.get("macro_status") == "malicious":
            office_macros_malicious = True

    video_reencoded = False
    av_timestamp_mismatch = False
    av_duration_mismatch = False
    if media_result:
        if media_result.get("re_encoded"):
            video_reencoded = True
        if media_result.get("timestamp_mismatch"):
            av_timestamp_mismatch = True
        if media_result.get("duration_mismatch"):
            av_duration_mismatch = True

    ai_gen_detected = False
    if ai_gen_result and ai_gen_result.get("is_ai_generated"):
        ai_gen_detected = True

    score_result = compute_score(
        exif=exif_result,
        gemini=gemini_result,
        is_pdf_no_text_layer=is_pdf_no_text_layer,
        mime_mismatch=mime_mismatch,
        office_macros_detected=office_macros_detected,
        office_macros_malicious=office_macros_malicious,
        video_reencoded=video_reencoded,
        av_timestamp_mismatch=av_timestamp_mismatch,
        av_duration_mismatch=av_duration_mismatch,
        ai_gen_detected=ai_gen_detected,
        pdf_javascript_detected=pdf_javascript_detected,
        pdf_hidden_layers_detected=pdf_hidden_layers_detected,
    )

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
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.ms-excel": ".xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
        "application/vnd.ms-powerpoint": ".ppt",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    }
    return mapping.get(mime_type, ".tmp")