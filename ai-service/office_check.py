import logging
from typing import Dict, Any
from oletools.olevba import VBA_Parser
from oletools.mraptor import MacroRaptor

logger = logging.getLogger(__name__)

def analyse_office_doc(file_path: str) -> Dict[str, Any]:
    """
    Inspect Office document files (.doc, .docx, .xls, .xlsx, .ppt, .pptx) for suspicious VBA macros.
    
    Args:
        file_path: Absolute path to the document file on disk.
        
    Returns:
        A dictionary containing macro analysis results.
    """
    results = {
        "has_macros": False,
        "macro_status": "clean",  # "clean" | "suspicious" | "malicious"
        "details": []
    }
    
    try:
        
        vba_parser = VBA_Parser(file_path)
        if vba_parser.detect_macros():
            results["has_macros"] = True
            results["macro_status"] = "suspicious"
            results["details"].append("VBA Macros detected inside the document")
            
            # Scan each macro block using MacroRaptor
            for _, _, _, code in vba_parser.extract_macros():
                if not code:
                    continue
                # MacroRaptor expects a string of VBA code
                r = MacroRaptor(code)
                r.scan()
                if r.suspicious:
                    results["macro_status"] = "malicious"
                    matches = getattr(r, "matches", [])
                    matches_str = ", ".join(matches) if matches else "auto-execution or write trigger"
                    results["details"].append(f"Suspicious macro heuristics matched: {matches_str}")
                    # Stop parsing once we know it has malicious heuristics
                    break
            
        vba_parser.close()
    except Exception as e:
        logger.info(f"[office_check] Not an OLE/OpenXML file or parsing skipped: {e}")
        # This is expected for non-office files or if they cannot be parsed as OLE/Zip
        results["details"].append(f"Not a valid Office container or parse error: {str(e)}")
        
    return results
