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

CANONICAL_PROMPT = """You are a digital forensics assistant. Analyse the provided file for two distinct threats: (A) digital manipulation/tampering and (B) AI generation.

For MANIPULATION, check for:
1. Inconsistent lighting or shadows between objects
2. Cloning or copy-paste artifacts (repeated textures or patterns)
3. Splicing boundaries (hard edges where image regions have different noise profiles)
4. Compression inconsistencies (different JPEG quality blocks within one image)
5. Unnatural text or UI overlays (added text, doctored screenshots)
6. Metadata inconsistency clues visible in the image content

For AI GENERATION, check for ALL of these — including digital art and illustrations:
7. Photographic AI artifacts: unnaturally perfect or plastic-looking skin/surfaces, dreamlike backgrounds, uncanny valley facial features, synthetic and overly uniform noise, hallucinated or nonsensical text/signage/logos, inconsistent finger counts or limb geometry
8. AI-generated DIGITAL ART artifacts: perfectly smooth and uniform brush strokes with no natural variation, unnaturally perfect symmetry in facial features or body proportions, backgrounds that are rendered with repetitive or procedural-looking texture, lighting that is technically correct but has no natural imperfections, line art that is too clean and consistent to be hand-drawn, shading gradients that are perfectly smooth without any organic variation, unnaturally perfect hair or fabric rendering, absence of the micro-errors and idiosyncrasies typical of human artists
9. DALL-E / ChatGPT / Midjourney / Stable Diffusion signatures: stylistically over-polished rendering even in "anime" or "cartoon" style, perfectly balanced composition that looks algorithmically generated, text within images that is slightly distorted or non-standard, overly consistent color palette without the spontaneous color choices of a human artist

IMPORTANT: Do NOT assume that because an image looks like "digital art" or "anime/manga style" it must be human-made. AI image generators like DALL-E, Midjourney, and Stable Diffusion are widely used to create digital illustrations and anime-style art. Evaluate the visual characteristics carefully.

Respond in this exact JSON format and nothing else:
{
  "manipulation_likelihood": "low" | "medium" | "high",
  "ai_generation_likelihood": "low" | "medium" | "high",
  "findings": ["finding 1", "finding 2"],
  "confidence": "low" | "medium" | "high"
}

Do not include any text, markdown, or explanation outside the JSON object."""


@dataclass
class GeminiResult:
    manipulation_likelihood: str = "inconclusive"
    ai_generation_likelihood: str = "inconclusive"
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
                max_output_tokens=8192,  # Raised from 1024 to accommodate reasoning/thinking tokens and prevent truncation
                response_mime_type="application/json",
            ),
        )

        raw_text = response.text.strip()

        # Strip markdown code fences if Gemini wraps output in ```json ... ```
        # This can happen even when response_mime_type="application/json" is set.
        if raw_text.startswith("```"):
            # Remove opening fence (```json or ```)
            raw_text = raw_text.split("\n", 1)[-1]
            # Remove closing fence
            if raw_text.endswith("```"):
                raw_text = raw_text.rsplit("```", 1)[0]
            raw_text = raw_text.strip()

        # Parse and validate JSON
        parsed = json.loads(raw_text)

        likelihood = parsed.get("manipulation_likelihood", "inconclusive")
        if likelihood not in ("low", "medium", "high"):
            likelihood = "inconclusive"

        ai_gen_likelihood = parsed.get("ai_generation_likelihood", "inconclusive")
        if ai_gen_likelihood not in ("low", "medium", "high"):
            ai_gen_likelihood = "inconclusive"

        confidence = parsed.get("confidence", "inconclusive")
        if confidence not in ("low", "medium", "high"):
            confidence = "inconclusive"

        findings = parsed.get("findings", [])
        if not isinstance(findings, list):
            findings = []

        return GeminiResult(
            manipulation_likelihood=likelihood,
            ai_generation_likelihood=ai_gen_likelihood,
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