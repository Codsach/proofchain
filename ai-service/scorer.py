"""
Tamper score computation.

Combines EXIF flags and Gemini result into a 0-100 composite score.
Score thresholds: 0-30 = Low, 31-60 = Medium, 61-100 = High
"""

from dataclasses import dataclass
from exif import ExifResult
from gemini import GeminiResult


FLAG_SCORES_NEW = {
    "thumbnail_dimension_mismatch": 15,
    "gps_precision_anomaly": 10,
    "future_timestamp": 25,
    "software_field_contradiction": 20,
    "screenshot_tool_detected": 15,
    "instant_modification": 10,
    "device_make_contradiction": 15,
    "uncalibrated_color_space": 10,
}


@dataclass
class ScoreResult:
    score: int
    risk_level: str          # "low" | "medium" | "high"
    score_breakdown: dict
    plain_notes: str


def compute_score(
    exif: ExifResult,
    gemini: GeminiResult,
    is_pdf_no_text_layer: bool = False,
    mime_mismatch: bool = False,
    office_macros_detected: bool = False,
    office_macros_malicious: bool = False,
    video_reencoded: bool = False,
    av_timestamp_mismatch: bool = False,
    av_duration_mismatch: bool = False,
    ai_gen_detected: bool = False,
    possible_ai_gen: bool = False,
    pdf_javascript_detected: bool = False,
    pdf_hidden_layers_detected: bool = False,
) -> ScoreResult:
    """
    Compute a composite tamper score from all analysis signals.

    Args:
        exif: Result from exif.extract_exif()
        gemini: Result from gemini.analyse_image()
        is_pdf_no_text_layer: True if PDF has no extractable text layer
        mime_mismatch: True if detected MIME type differs from declared MIME type
        office_macros_detected: True if VBA macros are detected in the Office document
        office_macros_malicious: True if the macros have malicious heuristics

    Returns:
        ScoreResult with 0-100 score, risk level, and breakdown
    """
    score = 0
    breakdown = {}

    # ── EXIF signals ──────────────────────────────────────────────────────────
    exif_flags = exif.flags or []

    editing_flag = next(
        (f for f in exif_flags if f.startswith("editing_software_detected")), None
    )
    if editing_flag:
        score += 30
        software_name = editing_flag.split(":", 1)[-1] if ":" in editing_flag else "unknown"
        breakdown["editing_software"] = {
            "points": 30,
            "detail": f"Editing software detected in metadata: {software_name}",
        }

    if any(f.startswith("modification_after_creation") for f in exif_flags):
        score += 20
        flag = next(f for f in exif_flags if f.startswith("modification_after_creation"))
        detail = flag.split(":", 1)[-1] if ":" in flag else ""
        breakdown["modification_after_creation"] = {
            "points": 20,
            "detail": f"File was modified after creation ({detail})",
        }

    if "gps_absent_on_field_incident" in exif_flags:
        score += 20
        breakdown["gps_absent"] = {
            "points": 20,
            "detail": "GPS data absent on a field incident submission",
        }

    if "no_creation_timestamp" in exif_flags:
        score += 10
        breakdown["no_creation_timestamp"] = {
            "points": 10,
            "detail": "No creation timestamp found — metadata may have been stripped",
        }

    # ── New EXIF signals ──────────────────────────────────────────────────────
    for flag_name, points in FLAG_SCORES_NEW.items():
        matching_flag = next(
            (f for f in exif_flags if f.startswith(flag_name)), None
        )
        if matching_flag:
            score += points
            detail = matching_flag.split(":", 1)[-1] if ":" in matching_flag else ""
            
            if flag_name == "thumbnail_dimension_mismatch":
                msg = f"Embedded thumbnail dimensions don't match main image: {detail}"
            elif flag_name == "gps_precision_anomaly":
                msg = f"GPS coordinate has suspicious precision (>6 decimals): {detail}"
            elif flag_name == "future_timestamp":
                msg = f"Creation timestamp is in the future: {detail}"
            elif flag_name == "software_field_contradiction":
                msg = f"Software field contradiction detected: {detail}"
            elif flag_name == "screenshot_tool_detected":
                msg = f"Screenshot tool signature detected: {detail}"
            elif flag_name == "instant_modification":
                msg = f"File modified within 5 seconds of creation: {detail}"
            elif flag_name == "device_make_contradiction":
                msg = f"Device make contradiction detected: {detail}"
            elif flag_name == "uncalibrated_color_space":
                msg = "Uncalibrated color space without ICC profile (synthetic image signature)"
            else:
                msg = f"Forensic flag triggered: {flag_name} {detail}".strip()

            breakdown[flag_name] = {
                "points": points,
                "detail": msg,
            }

    # ── Gemini signals ────────────────────────────────────────────────────────
    if gemini.manipulation_likelihood == "high":
        score += 30
        breakdown["gemini_high"] = {
            "points": 30,
            "detail": f"AI rated manipulation likelihood as HIGH (confidence: {gemini.confidence})",
        }
    elif gemini.manipulation_likelihood == "medium":
        score += 15
        breakdown["gemini_medium"] = {
            "points": 15,
            "detail": f"AI rated manipulation likelihood as MEDIUM (confidence: {gemini.confidence})",
        }
    elif gemini.manipulation_likelihood == "inconclusive" and not gemini.error:
        # Inconclusive without error means API returned unexpected data
        pass

    # ── Gemini AI-Generation signals ──────────────────────────────────────────
    if gemini.ai_generation_likelihood == "high":
        score += 30
        breakdown["gemini_ai_generation_high"] = {
            "points": 30,
            "detail": f"AI visual analysis is HIGHLY CONFIDENT this image was AI-generated (confidence: {gemini.confidence})",
        }
    elif gemini.ai_generation_likelihood == "medium":
        score += 15
        breakdown["gemini_ai_generation_medium"] = {
            "points": 15,
            "detail": f"AI visual analysis flagged this image as POSSIBLY AI-generated (confidence: {gemini.confidence})",
        }

    # ── PDF signal ────────────────────────────────────────────────────────────
    if is_pdf_no_text_layer:
        score += 25
        breakdown["pdf_no_text_layer"] = {
            "points": 25,
            "detail": "PDF contains no extractable text layer — may be a manipulated image saved as PDF",
        }

    # ── MIME check signal ─────────────────────────────────────────────────────
    if mime_mismatch:
        score += 25
        breakdown["mime_mismatch"] = {
            "points": 25,
            "detail": "True MIME type signature does not match declared file extension",
        }

    # ── Office Macros signal ──────────────────────────────────────────────────
    if office_macros_detected:
        points = 30
        status = "suspicious"
        if office_macros_malicious:
            status = "malicious"
        score += points
        breakdown["office_macros_detected"] = {
            "points": points,
            "detail": f"Office document contains {status} VBA macro code or OLE triggers",
        }

    # ── Video re-encoded signal ───────────────────────────────────────────────
    if video_reencoded:
        score += 20
        breakdown["video_reencoded"] = {
            "points": 20,
            "detail": "Video contains metadata signatures of re-encoding or editing tools",
        }

    # ── Audio/Video stream timestamp mismatch ─────────────────────────────────
    if av_timestamp_mismatch:
        score += 20
        breakdown["av_timestamp_mismatch"] = {
            "points": 20,
            "detail": "Audio and Video stream creation dates do not match (potential stream injection/tampering)",
        }

    # ── Audio/Video track duration mismatch ───────────────────────────────────
    if av_duration_mismatch:
        score += 20
        breakdown["av_duration_mismatch"] = {
            "points": 20,
            "detail": "Audio and Video track durations differ significantly (tampering or splicing indicator)",
        }

    # ── AI-Generated Image signal ─────────────────────────────────────────────
    if ai_gen_detected:
        score += 25
        breakdown["ai_generated_image"] = {
            "points": 25,
            "detail": "Local open-source Vision Transformer classified this image as AI-Generated",
        }

    # ── PDF JavaScript signal ─────────────────────────────────────────────────
    if pdf_javascript_detected:
        score += 20
        breakdown["pdf_javascript_detected"] = {
            "points": 20,
            "detail": "PDF contains embedded JavaScript code blocks (dynamic content execution risk)",
        }

    # ── PDF Hidden Layers signal ──────────────────────────────────────────────
    if pdf_hidden_layers_detected:
        score += 10
        breakdown["pdf_hidden_layers_detected"] = {
            "points": 10,
            "detail": "PDF contains hidden optional content groups/layers",
        }

    # Cap at 100
    score = min(score, 100)

    # ── Risk level ────────────────────────────────────────────────────────────
    if score <= 30:
        risk_level = "low"
    elif score <= 60:
        risk_level = "medium"
    else:
        risk_level = "high"

    # ── Minimum risk overrides ──────────────────────────────────────────────────
    # 1. Manipulation overrides:
    if gemini.manipulation_likelihood == "high" and risk_level in ("low", "medium"):
        risk_level = "high"
        breakdown["manipulation_override"] = {
            "points": 0,
            "detail": "Risk level escalated to HIGH — Digital manipulation confirmed by Gemini visual analysis",
        }
    elif gemini.manipulation_likelihood == "medium" and risk_level == "low":
        risk_level = "medium"
        breakdown["manipulation_override"] = {
            "points": 0,
            "detail": "Risk level escalated to MEDIUM — Suspected digital manipulation flagged by Gemini visual analysis",
        }

    # 2. AI Generation overrides:
    ai_generation_high = gemini.ai_generation_likelihood == "high"
    ai_generation_medium = (
        ai_gen_detected
        or possible_ai_gen
        or gemini.ai_generation_likelihood == "medium"
    )

    if ai_generation_high and risk_level in ("low", "medium"):
        risk_level = "high"
        breakdown["ai_generation_override"] = {
            "points": 0,
            "detail": "Risk level escalated to HIGH — AI generation confirmed by Gemini visual analysis",
        }
    elif ai_generation_medium and risk_level == "low":
        risk_level = "medium"
        detail_msg = "Risk level escalated to MEDIUM — AI generation detected by "
        detectors = []
        if ai_gen_detected:
            detectors.append("local ViT detector (high confidence)")
        elif possible_ai_gen:
            detectors.append("local ViT detector (soft signal — possible AI art/illustration)")
        if gemini.ai_generation_likelihood == "medium":
            detectors.append("Gemini visual analysis")
        breakdown["ai_generation_override"] = {
            "points": 0,
            "detail": detail_msg + " and ".join(detectors),
        }

    # 3. Video tampering overrides:
    # Gemini cannot analyse video, so visual analysis always returns "inconclusive".
    # Confirmed video tampering signals (re-encoding tools / A/V stream mismatches)
    # must override to HIGH — they are hard forensic evidence.
    video_tamper_confirmed = video_reencoded or av_timestamp_mismatch or av_duration_mismatch
    if video_tamper_confirmed:
        escalation_points = 0
        if score < 75:
            escalation_points = 75 - score
            score = 75
        risk_level = "high"
        signals = []
        if video_reencoded:
            signals.append("re-encoding tool footprint")
        if av_timestamp_mismatch:
            signals.append("A/V stream timestamp mismatch")
        if av_duration_mismatch:
            signals.append("A/V track duration mismatch")
        breakdown["video_tamper_override"] = {
            "points": escalation_points,
            "detail": "Risk level escalated to HIGH — confirmed video tampering signals: " + ", ".join(signals),
        }

    # ── Plain English summary ─────────────────────────────────────────────────
    plain_notes = _build_plain_notes(score, risk_level, breakdown, gemini, exif)

    return ScoreResult(
        score=score,
        risk_level=risk_level,
        score_breakdown=breakdown,
        plain_notes=plain_notes,
    )


def sanitize_error_message(msg: str) -> str:
    if not msg:
        return msg
    import re
    import os
    # Regex to match Windows absolute paths (e.g. C:\Users\...\file.mp4)
    # and Unix absolute/relative paths with folders (e.g. /tmp/file.mp4)
    win_path_rx = r'[a-zA-Z]:\\[^\s:|]+(?:\\[^\s:|]+)*'
    unix_path_rx = r'/[^\s:|]+(?:/[^\s:|]+)+'
    
    def replace_path(match):
        path_str = match.group(0)
        return os.path.basename(path_str)
        
    sanitized = re.sub(win_path_rx, replace_path, msg)
    sanitized = re.sub(unix_path_rx, replace_path, sanitized)
    return sanitized


def _build_plain_notes(
    score: int,
    risk_level: str,
    breakdown: dict,
    gemini: GeminiResult,
    exif: ExifResult,
) -> str:
    parts = []

    parts.append(
        f"Tamper score: {score}/100 ({risk_level.upper()} RISK). "
    )

    if not breakdown:
        parts.append("No integrity concerns detected in metadata or visual analysis.")
    else:
        parts.append("Concerns found: ")
        concerns = [v["detail"] for v in breakdown.values()]
        parts.append(" | ".join(concerns) + ".")

    if gemini.findings:
        visible = gemini.findings[:3]
        parts.append(
            f" AI visual findings: {'; '.join(visible)}"
            + (" [and more]" if len(gemini.findings) > 3 else "") + "."
        )

    if gemini.error:
        sanitized_err = sanitize_error_message(gemini.error)
        parts.append(f" Note: AI analysis was inconclusive ({sanitized_err}).")

    if exif.error:
        sanitized_err = sanitize_error_message(exif.error)
        parts.append(f" Note: Metadata extraction encountered an issue ({sanitized_err}).")

    return " ".join(parts).strip()