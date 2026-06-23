import logging
import io
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Singleton pipeline cache
_classifier_pipeline = None
HAS_DETECTOR = True

try:
    from PIL import Image
    import torch
    from transformers import pipeline
except Exception as e:
    logger.warning(f"[ai_detector] Could not import ML dependencies: {e}")
    HAS_DETECTOR = False

def init_detector():
    """
    Load the Vision Transformer model into memory.
    This is called on FastAPI startup to cache it locally.
    """
    global _classifier_pipeline
    if not HAS_DETECTOR:
        logger.warning("[ai_detector] Skipping initialization: ML dependencies missing.")
        return

    try:
        logger.info("[ai_detector] Loading open-source AI Image Detector (umm-maybe/AI-image-detector)...")
        # Initialize pipeline on CPU (default)
        _classifier_pipeline = pipeline(
            "image-classification",
            model="umm-maybe/AI-image-detector"
        )
        logger.info("[ai_detector] AI Image Detector model successfully cached.")
    except Exception as e:
        logger.error(f"[ai_detector] Failed to pre-load model: {e}")

def detect_ai_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Classify if the input image is AI-generated (Midjourney, DALL-E, SD, etc.) or real.
    
    Returns:
        A dictionary containing:
        - "is_ai_generated": bool
        - "confidence": float
        - "error": Optional[str]
    """
    global _classifier_pipeline
    results = {
        "is_ai_generated": False,
        "confidence": 0.0,
        "error": None
    }

    if not HAS_DETECTOR:
        results["error"] = "Machine learning dependencies are not installed/available"
        return results

    try:
        # Lazy load if startup hook didn't run or failed
        if _classifier_pipeline is None:
            init_detector()
            if _classifier_pipeline is None:
                results["error"] = "Failed to load ViT model pipeline"
                return results

        # Load bytes into PIL image
        img = Image.open(io.BytesIO(image_bytes))
        
        # Predictions format: [{'label': 'artificial', 'score': 0.89}, {'label': 'human', 'score': 0.11}]
        predictions = _classifier_pipeline(img)
        
        for pred in predictions:
            if pred.get('label') == 'artificial':
                score = pred.get('score', 0.0)
                results["confidence"] = score
                if score >= 0.70:
                    results["is_ai_generated"] = True
                break
                
    except Exception as e:
        logger.error(f"[ai_detector] Inference error: {e}")
        results["error"] = str(e)

    return results
