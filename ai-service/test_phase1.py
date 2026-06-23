import unittest
from unittest.mock import MagicMock, patch
import os
import sys

# Ensure ai-service directory is in python path
sys.path.append(os.path.dirname(__file__))

from magic_check import verify_mime
from office_check import analyse_office_doc
from scorer import compute_score
from exif import ExifResult
from gemini import GeminiResult

class TestPhase1Forensics(unittest.TestCase):
    def setUp(self):
        self.exif = ExifResult(creation_timestamp="2026:06:22 12:00:00")
        self.gemini = GeminiResult(manipulation_likelihood="low", findings=[], confidence="high")

    def test_verify_mime_matching(self):
        # Sample PDF bytes
        pdf_bytes = b'%PDF-1.4\n' + b'\x00' * 100
        is_match, detected = verify_mime(pdf_bytes, "application/pdf")
        self.assertTrue(is_match)
        self.assertEqual(detected, "application/pdf")

    def test_verify_mime_mismatched(self):
        # PDF bytes spoofed with a jpeg declared type
        pdf_bytes = b'%PDF-1.4\n' + b'\x00' * 100
        is_match, detected = verify_mime(pdf_bytes, "image/jpeg")
        self.assertFalse(is_match)
        self.assertEqual(detected, "application/pdf")

    def test_verify_mime_generic_stream(self):
        # PDF bytes with generic application/octet-stream declared type
        pdf_bytes = b'%PDF-1.4\n' + b'\x00' * 100
        is_match, detected = verify_mime(pdf_bytes, "application/octet-stream")
        # Should not flag as mismatch, but should detect true MIME type
        self.assertTrue(is_match)
        self.assertEqual(detected, "application/pdf")

    def test_scorer_mime_mismatch(self):
        # MIME mismatch alone should add 25 points
        score_res = compute_score(self.exif, self.gemini, mime_mismatch=True)
        self.assertEqual(score_res.score, 25)
        self.assertIn("mime_mismatch", score_res.score_breakdown)
        self.assertEqual(score_res.score_breakdown["mime_mismatch"]["points"], 25)

    def test_scorer_office_macros(self):
        # Suspicious macro
        score_res = compute_score(
            self.exif, 
            self.gemini, 
            office_macros_detected=True, 
            office_macros_malicious=False
        )
        self.assertEqual(score_res.score, 30)
        self.assertIn("office_macros_detected", score_res.score_breakdown)
        self.assertIn("suspicious", score_res.score_breakdown["office_macros_detected"]["detail"])

        # Malicious macro
        score_res = compute_score(
            self.exif, 
            self.gemini, 
            office_macros_detected=True, 
            office_macros_malicious=True
        )
        self.assertEqual(score_res.score, 30)
        self.assertIn("malicious", score_res.score_breakdown["office_macros_detected"]["detail"])

    @patch("office_check.VBA_Parser")
    def test_analyse_office_doc_macros_suspicious(self, mock_vba_parser_class):
        # Mock VBA_Parser returning macros detected
        mock_parser = MagicMock()
        mock_parser.detect_macros.return_value = True
        mock_parser.extract_macros.return_value = [
            ("file", "dir", "macro1", "Sub AutoOpen()\nEnd Sub")
        ]
        mock_vba_parser_class.return_value = mock_parser

        # We also mock MacroRaptor inside office_check
        with patch("oletools.mraptor.MacroRaptor") as mock_raptor_class:
            mock_raptor = MagicMock()
            mock_raptor.suspicious = False  # Not matching malicious heuristics
            mock_raptor_class.return_value = mock_raptor
            
            result = analyse_office_doc("dummy_path.docx")
            self.assertTrue(result["has_macros"])
            self.assertEqual(result["macro_status"], "suspicious")

    @patch("office_check.VBA_Parser")
    def test_analyse_office_doc_macros_malicious(self, mock_vba_parser_class):
        # Mock VBA_Parser returning macros detected
        mock_parser = MagicMock()
        mock_parser.detect_macros.return_value = True
        mock_parser.extract_macros.return_value = [
            ("file", "dir", "macro1", "Sub AutoOpen()\nShell('cmd.exe')\nEnd Sub")
        ]
        mock_vba_parser_class.return_value = mock_parser

        # We mock MacroRaptor as suspicious = True
        with patch("oletools.mraptor.MacroRaptor") as mock_raptor_class:
            mock_raptor = MagicMock()
            mock_raptor.suspicious = True
            mock_raptor.matches = ["autoexec", "execute"]
            mock_raptor_class.return_value = mock_raptor
            
            result = analyse_office_doc("dummy_path.docx")
            self.assertTrue(result["has_macros"])
            self.assertEqual(result["macro_status"], "malicious")
            self.assertTrue(any("heuristics matched" in d for d in result["details"]))

if __name__ == "__main__":
    unittest.main()
