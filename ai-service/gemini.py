"""
Gemini Vision API integration for image tamper detection.

Requires: pip install google-generativeai
"""

import os
import json
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

CANONICAL_PROMPT = """You are a digital forensics assistant. Analyse the provided image for signs of digital manipulation.

Check for:
1. Inconsistent lighting or shadows between objects
2. Cloning or copy-paste artifacts (repeated textures or patterns)
3. Splicing boundaries (hard edges where image regions have different noise profiles)
4. Compression inconsistencies (different JPEG quality blocks within one image)
5. Unnatural text or UI overlays (added text, doctored screenshots)
6. Metadata inconsistency clues visible in the image content

Respond in this exact JSON format and nothing else:
{
  "manipulation_likelihood": "low" | "medium" | "high",
  "findings": ["finding 1", "finding 2"],
  "confidence": "low" | "medium" | "high"
}

Do not include any text, markdown, or explanation outside the JSON object."""


@dataclass
class GeminiResult:
    manipulation_likelihood: str = "inconclusive"
    findings: list[str] = None
    confidence: str = "inconclusive"
    error: Optional[str] = None

    def __post_init__(self):
        if self.findings is None:
            self.findings = []


def analyse_image(image_bytes: bytes, mime_type: str) -> GeminiResult:
    """
    Send an image to Gemini Vision API for tamper detection.

    Args:
        image_bytes: Raw image bytes
        mime_type: MIME type e.g. "image/jpeg"

    Returns:
        GeminiResult with manipulation likelihood, findings, confidence
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY not configured")
        return GeminiResult(error="GEMINI_API_KEY not configured")

    # Only process image types
    if not mime_type.startswith("image/"):
        return GeminiResult(
            manipulation_likelihood="inconclusive",
            findings=["Non-image file — visual analysis not applicable"],
            confidence="inconclusive",
        )

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        # Upload image inline
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[CANONICAL_PROMPT, image_part],
            config=types.GenerateContentConfig(
                temperature=0.1,  # Low temperature for consistent forensic analysis
                max_output_tokens=512,
                response_mime_type="application/json",
            ),
        )

        raw_text = response.text.strip()

        # Parse and validate JSON
        parsed = json.loads(raw_text)

        likelihood = parsed.get("manipulation_likelihood", "inconclusive")
        if likelihood not in ("low", "medium", "high"):
            likelihood = "inconclusive"

        confidence = parsed.get("confidence", "inconclusive")
        if confidence not in ("low", "medium", "high"):
            confidence = "inconclusive"

        findings = parsed.get("findings", [])
        if not isinstance(findings, list):
            findings = []

        return GeminiResult(
            manipulation_likelihood=likelihood,
            findings=findings[:10],  # cap at 10 findings
            confidence=confidence,
        )

    except json.JSONDecodeError as e:
        logger.warning(f"Gemini returned non-JSON response: {e}")
        return GeminiResult(
            manipulation_likelihood="inconclusive",
            findings=["AI response could not be parsed — manual review required"],
            confidence="inconclusive",
            error=f"JSON parse error: {e}",
        )
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return GeminiResult(
            manipulation_likelihood="inconclusive",
            findings=[],
            confidence="inconclusive",
            error=str(e),
        )