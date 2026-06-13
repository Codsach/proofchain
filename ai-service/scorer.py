"""
Tamper score computation.

Combines EXIF flags and Gemini result into a 0-100 composite score.
Score thresholds: 0-30 = Low, 31-60 = Medium, 61-100 = High
"""

from dataclasses import dataclass
from exif import ExifResult
from gemini import GeminiResult


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
) -> ScoreResult:
    """
    Compute a composite tamper score from all analysis signals.

    Args:
        exif: Result from exif.extract_exif()
        gemini: Result from gemini.analyse_image()
        is_pdf_no_text_layer: True if PDF has no extractable text layer

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

    # ── PDF signal ────────────────────────────────────────────────────────────
    if is_pdf_no_text_layer:
        score += 25
        breakdown["pdf_no_text_layer"] = {
            "points": 25,
            "detail": "PDF contains no extractable text layer — may be a manipulated image saved as PDF",
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

    # ── Plain English summary ─────────────────────────────────────────────────
    plain_notes = _build_plain_notes(score, risk_level, breakdown, gemini, exif)

    return ScoreResult(
        score=score,
        risk_level=risk_level,
        score_breakdown=breakdown,
        plain_notes=plain_notes,
    )


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
        parts.append(f" Note: AI analysis was inconclusive ({gemini.error}).")

    if exif.error:
        parts.append(f" Note: Metadata extraction encountered an issue ({exif.error}).")

    return " ".join(parts).strip()