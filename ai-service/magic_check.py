import logging
from typing import Tuple

logger = logging.getLogger(__name__)

# Safely attempt to import magic. If native DLLs/libraries are missing, do not crash on startup.
try:
    import magic
    HAS_MAGIC = hasattr(magic, 'from_buffer')
    if not HAS_MAGIC:
        logger.warning("[magic_check] Imported 'magic' module does not have 'from_buffer' attribute. Ensure python-magic is installed.")
except Exception as e:
    logger.warning(f"[magic_check] Could not import 'magic' library or native DLLs are missing: {e}")
    HAS_MAGIC = False

def verify_mime(file_bytes: bytes, declared_mime: str) -> Tuple[bool, str]:
    """
    Verify that the actual byte content MIME type matches the declared MIME.
    
    Args:
        file_bytes: Raw bytes of the uploaded file.
        declared_mime: The MIME type declared by the client/form upload.
        
    Returns:
        A tuple of (is_match, detected_mime).
    """
    if not HAS_MAGIC:
        return True, declared_mime

    try:
        # Check first 2048 bytes of the file for byte signatures
        detected_mime = magic.from_buffer(file_bytes[:2048], mime=True)
        
        if not detected_mime:
            return True, declared_mime

        # Normalize comparison (e.g., image/jpg vs image/jpeg, or trailing spaces)
        norm_detected = detected_mime.lower().strip().replace("jpg", "jpeg")
        norm_declared = declared_mime.lower().strip().replace("jpg", "jpeg")
        
        # If the declared mime is application/octet-stream, we don't treat it as a hard mismatch,
        # but we return the true detected MIME type for subsequent routing
        if norm_declared == "application/octet-stream":
            return True, detected_mime
            
        # Treat typical PDF/Office XML sub-types as matching if they are equivalent
        # (e.g., application/x-pdf vs application/pdf)
        if "pdf" in norm_detected and "pdf" in norm_declared:
            return True, detected_mime
            
        is_match = (norm_detected == norm_declared)
        
        logger.info(f"[magic_check] Declared: {declared_mime}, Detected: {detected_mime}, Match: {is_match}")
        return is_match, detected_mime
        
    except Exception as e:
        logger.warning(f"[magic_check] Failed to verify MIME: {e}")
        return True, declared_mime  # Fallback to match if inspection fails
