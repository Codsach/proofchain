"""
PDF forensics — checks whether a PDF has a real text layer.

A PDF with no extractable text is often a scanned image saved as PDF,
or an image-only PDF created to obscure editing artifacts.

Requires: pip install PyMuPDF
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def has_text_layer(file_bytes: bytes) -> Optional[bool]:
    """
    Check if a PDF has an extractable text layer.

    Returns:
        True  — has readable text (normal document)
        False — no text layer (image-only or stripped)
        None  — could not determine (not a PDF or library error)
    """
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total_chars = 0
        pages_checked = min(len(doc), 5)  # check first 5 pages

        for page_num in range(pages_checked):
            page = doc[page_num]
            text = page.get_text("text")
            total_chars += len(text.strip())

        doc.close()

        # If fewer than 50 total characters across 5 pages → no real text layer
        return total_chars >= 50

    except ImportError:
        logger.warning("PyMuPDF not installed — PDF text check skipped")
        return None
    except Exception as e:
        logger.warning(f"PDF text check failed: {e}")
        return None