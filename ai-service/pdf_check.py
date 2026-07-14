"""
PDF forensics — checks for text layers, hidden OCG layers, and embedded scripts.

Requires: pip install PyMuPDF
"""

import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


def has_text_layer(file_bytes: bytes) -> Optional[bool]:
    """
    Check if a PDF has an extractable text layer (Backward compatibility wrapper).
    """
    res = check_pdf_anomalies(file_bytes)
    return not res["no_text_layer"]


def check_pdf_anomalies(file_bytes: bytes) -> Dict[str, Any]:
    """
    Check PDF for text layers, hidden OCG layers, and embedded scripts.
    
    Returns:
        A dictionary containing:
        - "no_text_layer": bool
        - "has_javascript": bool
        - "has_hidden_layers": bool
        - "details": list of string comments
    """
    results = {
        "no_text_layer": False,
        "has_javascript": False,
        "has_hidden_layers": False,
        "details": []
    }
    
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        
        # 1. Text layer check — sample up to 10 pages
        total_chars = 0
        pages_checked = min(len(doc), 10)  # Check first 10 pages
        for page_num in range(pages_checked):
            page = doc[page_num]
            text = page.get_text("text")
            total_chars += len(text.strip())

        if total_chars < 100:
            results["no_text_layer"] = True
            results["details"].append("No extractable text layer (scanned page or image-only PDF)")

        # 2. Check for optional content groups (hidden/interactive layers)
        ocgs = doc.get_ocgs()
        if ocgs:
            results["has_hidden_layers"] = True
            results["details"].append(f"PDF contains {len(ocgs)} Optional Content Groups (hidden layers)")

        # 3. Check for Embedded JavaScript
        js_list = []
        if hasattr(doc, "get_javascript"):
            try:
                js_list = doc.get_javascript()
            except Exception:
                pass

        if js_list:
            results["has_javascript"] = True
            results["details"].append("Embedded PDF JavaScript elements detected in doc context")
        else:
            # Fallback byte signature search
            raw_pdf = file_bytes.lower()
            if b"/js" in raw_pdf or b"/javascript" in raw_pdf:
                results["has_javascript"] = True
                results["details"].append("Embedded PDF JavaScript signature detected in content stream")

        doc.close()

    except ImportError:
        logger.warning("PyMuPDF not installed — PDF forensics skipped")
        results["details"].append("PyMuPDF dependency is not installed")
    except Exception as e:
        logger.warning(f"PDF check failed: {e}")
        results["details"].append(f"PDF check failed: {e}")

    return results