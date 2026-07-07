import logging
import io
import warnings
from typing import Dict, Any

# Suppress Hugging Face deprecation and legacy model configuration warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="huggingface_hub")
warnings.filterwarnings("ignore", category=UserWarning, module="transformers")
warnings.filterwarnings("ignore", message="Could not find image processor class")

logger = logging.getLogger(__name__)

# Singleton pipeline cache
_classifier_pipeline = None
HAS_DETECTOR = True
_init_error: str = None   # Stores the reason why the detector is unavailable

try:
    from PIL import Image
    import torch
    from transformers import pipeline
except Exception as e:
    logger.warning(f"[ai_detector] Could not import ML dependencies: {e}")
    HAS_DETECTOR = False
    _init_error = f"ML dependencies not installed: {e}"


def init_detector():
    """
    Load the Vision Transformer model into memory.
    This is called on FastAPI startup to cache it locally.
    """
    global _classifier_pipeline, _init_error
    if not HAS_DETECTOR:
        logger.warning(
            f"[ai_detector] Skipping initialization — ML dependencies missing: {_init_error}"
        )
        return

    try:
        logger.info(
            "[ai_detector] Loading open-source AI Image Detector (umm-maybe/AI-image-detector)..."
        )
        # Initialize pipeline on CPU (default)
        _classifier_pipeline = pipeline(
            "image-classification",
            model="umm-maybe/AI-image-detector",
        )
        logger.info("[ai_detector] AI Image Detector model successfully cached.")
    except Exception as e:
        _init_error = str(e)
        logger.error(f"[ai_detector] Failed to pre-load model: {e}")


def get_detector_status() -> Dict[str, Any]:
    """
    Return the current health / availability of the ViT detector.
    Used by the /health endpoint and logged in every analysis run.
    """
    if not HAS_DETECTOR:
        return {"available": False, "reason": _init_error or "ML dependencies not installed"}
    if _classifier_pipeline is None:
        return {"available": False, "reason": _init_error or "Model not loaded yet"}
    return {"available": True, "reason": None}


def detect_ai_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Classify if the input image is AI-generated (Midjourney, DALL-E, SD, etc.) or real.

    Returns:
        A dictionary containing:
        - "is_ai_generated": bool
        - "confidence": float  (0.0 – 1.0 score for the 'artificial' label)
        - "detector_available": bool  (False when model could not be loaded)
        - "error": Optional[str]
    """
    global _classifier_pipeline
    results: Dict[str, Any] = {
        "is_ai_generated": False,
        "confidence": 0.0,
        "detector_available": False,
        "error": None,
    }

    # ── Guard: dependencies missing ──────────────────────────────────────────
    if not HAS_DETECTOR:
        msg = f"ViT AI detector unavailable — ML dependencies not installed ({_init_error})"
        logger.warning(f"[ai_detector] {msg}")
        results["error"] = msg
        return results

    # ── Guard: model not loaded ───────────────────────────────────────────────
    if _classifier_pipeline is None:
        init_detector()
        if _classifier_pipeline is None:
            msg = f"ViT model failed to load — {_init_error or 'unknown error'}"
            logger.error(f"[ai_detector] {msg}")
            results["error"] = msg
            return results

    results["detector_available"] = True

    try:
        # Load bytes into PIL image
        img = Image.open(io.BytesIO(image_bytes))

        # Predictions format: [{'label': 'artificial', 'score': 0.89}, {'label': 'human', 'score': 0.11}]
        predictions = _classifier_pipeline(img)
        logger.debug(f"[ai_detector] Raw predictions: {predictions}")

        for pred in predictions:
            if pred.get("label") == "artificial":
                score = pred.get("score", 0.0)
                results["confidence"] = round(score, 4)
                if score >= 0.70:
                    results["is_ai_generated"] = True
                break

        logger.info(
            f"[ai_detector] Result — is_ai_generated={results['is_ai_generated']}, "
            f"confidence={results['confidence']:.2%}"
        )

    except Exception as e:
        logger.error(f"[ai_detector] Inference error: {e}")
        results["error"] = str(e)
        results["detector_available"] = False

    return results
