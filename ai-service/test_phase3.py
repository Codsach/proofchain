import unittest
from unittest.mock import MagicMock, patch
import os
import sys

# Ensure ai-service directory is in python path
sys.path.append(os.path.dirname(__file__))

# Mock out heavy ML libraries at sys.modules to decouple unit tests from package installation time
mock_transformers = MagicMock()
mock_pipeline = MagicMock()
mock_transformers.pipeline = mock_pipeline
sys.modules['transformers'] = mock_transformers

mock_torch = MagicMock()
sys.modules['torch'] = mock_torch

import ai_detector
from ai_detector import detect_ai_image, init_detector
from scorer import compute_score
from exif import ExifResult
from gemini import GeminiResult

class TestPhase3Forensics(unittest.TestCase):
    def setUp(self):
        self.exif = ExifResult(creation_timestamp="2026:06:22 12:00:00")
        self.gemini = GeminiResult(manipulation_likelihood="low", findings=[], confidence="high")

    def test_init_detector(self):
        # Reset cached pipeline
        ai_detector._classifier_pipeline = None
        ai_detector.HAS_DETECTOR = True
        
        mock_pipeline.reset_mock()
        init_detector()
        mock_pipeline.assert_called_once_with("image-classification", model="umm-maybe/AI-image-detector")
        self.assertIsNotNone(ai_detector._classifier_pipeline)

    def test_detect_ai_image_true(self):
        ai_detector.HAS_DETECTOR = True
        mock_pipeline_inst = MagicMock()
        mock_pipeline_inst.return_value = [
            {"label": "artificial", "score": 0.89},
            {"label": "human", "score": 0.11}
        ]
        ai_detector._classifier_pipeline = mock_pipeline_inst
        
        gif_bytes = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        result = detect_ai_image(gif_bytes)
        
        self.assertTrue(result["is_ai_generated"])
        self.assertAlmostEqual(result["confidence"], 0.89)

    def test_detect_ai_image_false(self):
        ai_detector.HAS_DETECTOR = True
        mock_pipeline_inst = MagicMock()
        mock_pipeline_inst.return_value = [
            {"label": "artificial", "score": 0.15},
            {"label": "human", "score": 0.85}
        ]
        ai_detector._classifier_pipeline = mock_pipeline_inst
        
        gif_bytes = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        result = detect_ai_image(gif_bytes)
        
        self.assertFalse(result["is_ai_generated"])
        self.assertAlmostEqual(result["confidence"], 0.15)

    def test_scorer_ai_gen_flag(self):
        score_res = compute_score(self.exif, self.gemini, ai_gen_detected=True)
        self.assertEqual(score_res.score, 25)
        self.assertIn("ai_generated_image", score_res.score_breakdown)

if __name__ == "__main__":
    unittest.main()
