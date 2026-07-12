import unittest
from unittest.mock import MagicMock
import os
import sys

# Ensure ai-service directory is in python path
sys.path.append(os.path.dirname(__file__))

# Mock out fitz/PyMuPDF to avoid DLL load blocks under Application Control policy
mock_fitz = MagicMock()
mock_open = MagicMock()
mock_fitz.open = mock_open
sys.modules['fitz'] = mock_fitz

from pdf_check import check_pdf_anomalies
from scorer import compute_score
from exif import ExifResult
from gemini import GeminiResult

class TestPhase4Forensics(unittest.TestCase):
    def setUp(self):
        self.exif = ExifResult(creation_timestamp="2026:06:22 12:00:00")
        self.gemini = GeminiResult(manipulation_likelihood="low", findings=[], confidence="high")

    def test_check_pdf_anomalies_clean(self):
        mock_doc = MagicMock()
        mock_doc.__len__.return_value = 1
        
        mock_page = MagicMock()
        mock_page.get_text.return_value = "This is a clean PDF document with more than fifty characters to pass the text layer threshold. And here is some more text to push the total character count well over one hundred."
        mock_doc.__getitem__.return_value = mock_page
        
        mock_doc.get_ocgs.return_value = None
        mock_doc.get_javascript.return_value = None
        
        mock_open.return_value = mock_doc
        mock_open.reset_mock()
        
        res = check_pdf_anomalies(b"dummy_pdf_bytes")
        mock_open.assert_called_once_with(stream=b"dummy_pdf_bytes", filetype="pdf")
        self.assertFalse(res["no_text_layer"])
        self.assertFalse(res["has_javascript"])
        self.assertFalse(res["has_hidden_layers"])

    def test_check_pdf_anomalies_no_text_layer(self):
        mock_doc = MagicMock()
        mock_doc.__len__.return_value = 1
        
        mock_page = MagicMock()
        mock_page.get_text.return_value = "Short text"
        mock_doc.__getitem__.return_value = mock_page
        
        mock_doc.get_ocgs.return_value = None
        mock_doc.get_javascript.return_value = None
        
        mock_open.return_value = mock_doc
        mock_open.reset_mock()
        
        res = check_pdf_anomalies(b"dummy_pdf_bytes")
        self.assertTrue(res["no_text_layer"])

    def test_check_pdf_anomalies_ocg_layers(self):
        mock_doc = MagicMock()
        mock_doc.__len__.return_value = 1
        
        mock_page = MagicMock()
        mock_page.get_text.return_value = "This is a clean PDF document with more than fifty characters to pass the text layer threshold."
        mock_doc.__getitem__.return_value = mock_page
        
        mock_doc.get_ocgs.return_value = {"ocg1": "hidden_layer"}
        mock_doc.get_javascript.return_value = None
        
        mock_open.return_value = mock_doc
        mock_open.reset_mock()
        
        res = check_pdf_anomalies(b"dummy_pdf_bytes")
        self.assertTrue(res["has_hidden_layers"])

    def test_check_pdf_anomalies_javascript(self):
        mock_doc = MagicMock()
        mock_doc.__len__.return_value = 1
        
        mock_page = MagicMock()
        mock_page.get_text.return_value = "This is a clean PDF document with more than fifty characters to pass the text layer threshold."
        mock_doc.__getitem__.return_value = mock_page
        
        mock_doc.get_ocgs.return_value = None
        mock_doc.get_javascript.return_value = ["app.alert('hello')"]
        
        mock_open.return_value = mock_doc
        mock_open.reset_mock()
        
        res = check_pdf_anomalies(b"dummy_pdf_bytes")
        self.assertTrue(res["has_javascript"])

    def test_check_pdf_anomalies_javascript_bytes_fallback(self):
        mock_doc = MagicMock()
        mock_doc.__len__.return_value = 1
        
        mock_page = MagicMock()
        mock_page.get_text.return_value = "This is a clean PDF document with more than fifty characters to pass the text layer threshold."
        mock_doc.__getitem__.return_value = mock_page
        
        mock_doc.get_ocgs.return_value = None
        mock_doc.get_javascript.return_value = None
        
        mock_open.return_value = mock_doc
        mock_open.reset_mock()
        
        res = check_pdf_anomalies(b"some headers /JavaScript some other script data")
        self.assertTrue(res["has_javascript"])

    def test_scorer_pdf_checks(self):
        # 1. PDF JS detected (+20)
        score_res = compute_score(self.exif, self.gemini, pdf_javascript_detected=True)
        self.assertEqual(score_res.score, 20)
        self.assertIn("pdf_javascript_detected", score_res.score_breakdown)

        # 2. PDF hidden layers detected (+10)
        score_res = compute_score(self.exif, self.gemini, pdf_hidden_layers_detected=True)
        self.assertEqual(score_res.score, 10)
        self.assertIn("pdf_hidden_layers_detected", score_res.score_breakdown)

if __name__ == "__main__":
    unittest.main()
