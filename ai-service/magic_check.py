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

# Canonical aliases — normalize libmagic variants to standard IANA MIME types
# so that format variants from different OS/libmagic builds don't produce false mismatches.
MIME_ALIASES: dict[str, str] = {
    # Image aliases
    "image/jpg": "image/jpeg",
    "image/x-jpeg": "image/jpeg",
    "image/pjpeg": "image/jpeg",
    "image/x-png": "image/png",
    "image/x-bmp": "image/bmp",
    "image/x-ms-bmp": "image/bmp",
    "image/x-bitmap": "image/bmp",
    "image/x-tiff": "image/tiff",
    "image/x-webp": "image/webp",
    "image/x-gif": "image/gif",
    # PDF aliases
    "application/x-pdf": "application/pdf",
    "application/acrobat": "application/pdf",
    # Video aliases
    "video/x-msvideo": "video/avi",
    "video/avi": "video/avi",
    "video/x-matroska": "video/x-matroska",
    # Audio aliases
    "audio/x-mpeg": "audio/mpeg",
    "audio/x-mp3": "audio/mpeg",
    # Office aliases
    "application/vnd.ms-office": "application/msword",
    "application/x-ole-storage": "application/msword",
}


def _normalize_mime(mime: str) -> str:
    """Normalize a MIME type string to its canonical form."""
    normalized = mime.lower().strip()
    return MIME_ALIASES.get(normalized, normalized)


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

        # Normalize both sides through the alias table (covers jpg/jpeg, x-png, x-bmp, etc.)
        norm_detected = _normalize_mime(detected_mime)
        norm_declared = _normalize_mime(declared_mime)

        # If the declared mime is application/octet-stream, we don't treat it as a hard mismatch,
        # but we return the true detected MIME type for subsequent routing
        if norm_declared == "application/octet-stream":
            return True, detected_mime

        # Treat typical PDF/Office XML sub-types as matching if they are equivalent
        # (e.g., application/x-pdf vs application/pdf — handled by alias table above)
        if "pdf" in norm_detected and "pdf" in norm_declared:
            return True, detected_mime

        is_match = (norm_detected == norm_declared)

        logger.info(f"[magic_check] Declared: {declared_mime} → {norm_declared}, Detected: {detected_mime} → {norm_detected}, Match: {is_match}")
        return is_match, detected_mime

    except Exception as e:
        logger.warning(f"[magic_check] Failed to verify MIME: {e}")
        return True, declared_mime  # Fallback to match if inspection fails
