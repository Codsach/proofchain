import unittest
from datetime import datetime, timedelta
import os
import sys

# Ensure ai-service directory is in python path
sys.path.append(os.path.dirname(__file__))

from exif import ExifResult, _compute_flags
from scorer import compute_score, FLAG_SCORES_NEW
from gemini import GeminiResult

class TestExifForensics(unittest.TestCase):
    def setUp(self):
        # Default empty result
        self.result = ExifResult()
        # Prevent the no_creation_timestamp flag (10 points) from triggering on all tests
        self.result.creation_timestamp = "2026:06:22 12:00:00"
        self.gemini = GeminiResult(
            manipulation_likelihood="low",
            findings=[],
            confidence="high"
        )

    def test_thumbnail_dimension_mismatch(self):
        # 4:3 vs 16:9 aspect ratio mismatch
        self.result.raw = {
            "EXIF:ImageWidth": 4000,
            "EXIF:ImageHeight": 3000,
            "EXIF:ThumbnailImageWidth": 160,
            "EXIF:ThumbnailImageHeight": 90,
        }
        flags = _compute_flags(self.result, is_field_incident=False)
        self.assertTrue(any(f.startswith("thumbnail_dimension_mismatch") for f in flags))

        # Test scorer
        self.result.flags = flags
        score_res = compute_score(self.result, self.gemini)
        self.assertEqual(score_res.score, 15)
        self.assertIn("thumbnail_dimension_mismatch", score_res.score_breakdown)

    def test_gps_precision_anomaly(self):
        # Latitude has 8 decimal places
        self.result.gps_lat = 37.77492928
        self.result.gps_lng = -122.4194
        flags = _compute_flags(self.result, is_field_incident=False)
        self.assertTrue(any(f.startswith("gps_precision_anomaly") for f in flags))

        # Test scorer
        self.result.flags = flags
        score_res = compute_score(self.result, self.gemini)
        self.assertEqual(score_res.score, 10)
        self.assertIn("gps_precision_anomaly", score_res.score_breakdown)

    def test_future_timestamp(self):
        # Future creation timestamp (1 day in the future)
        future_dt = datetime.now() + timedelta(days=1)
        self.result.creation_timestamp = future_dt.strftime("%Y:%m:%d %H:%M:%S")
        flags = _compute_flags(self.result, is_field_incident=False)
        self.assertTrue(any(f.startswith("future_timestamp") for f in flags))

        # Test scorer
        self.result.flags = flags
        score_res = compute_score(self.result, self.gemini)
        self.assertEqual(score_res.score, 25)
        self.assertIn("future_timestamp", score_res.score_breakdown)

    def test_software_field_contradiction(self):
        self.result.raw = {
            "EXIF:Software": "iPhone 12 Pro",
            "XMP:CreatorTool": "Adobe Photoshop CC 2019",
        }
        flags = _compute_flags(self.result, is_field_incident=False)
        self.assertTrue(any(f.startswith("software_field_contradiction") for f in flags))

        # Test scorer
        self.result.flags = flags
        score_res = compute_score(self.result, self.gemini)
        self.assertEqual(score_res.score, 20)
        self.assertIn("software_field_contradiction", score_res.score_breakdown)

    def test_screenshot_tool_detected(self):
        self.result.software = "Greenshot v1.2"
        flags = _compute_flags(self.result, is_field_incident=False)
        self.assertTrue(any(f.startswith("screenshot_tool_detected") for f in flags))

        # Test scorer
        self.result.flags = flags
        score_res = compute_score(self.result, self.gemini)
        self.assertEqual(score_res.score, 15)
        self.assertIn("screenshot_tool_detected", score_res.score_breakdown)

    def test_instant_modification(self):
        # 3 seconds modification delta
        self.result.creation_timestamp = "2026:06:22 12:00:00"
        self.result.modification_timestamp = "2026:06:22 12:00:03"
        flags = _compute_flags(self.result, is_field_incident=False)
        self.assertTrue(any(f.startswith("instant_modification") for f in flags))

        # Test scorer
        self.result.flags = flags
        score_res = compute_score(self.result, self.gemini)
        self.assertEqual(score_res.score, 10)
        self.assertIn("instant_modification", score_res.score_breakdown)

    def test_device_make_contradiction(self):
        self.result.raw = {
            "EXIF:Make": "Apple",
            "Composite:Make": "Samsung",
        }
        flags = _compute_flags(self.result, is_field_incident=False)
        self.assertTrue(any(f.startswith("device_make_contradiction") for f in flags))

        # Test scorer
        self.result.flags = flags
        score_res = compute_score(self.result, self.gemini)
        self.assertEqual(score_res.score, 15)
        self.assertIn("device_make_contradiction", score_res.score_breakdown)

    def test_uncalibrated_color_space(self):
        self.result.raw = {
            "EXIF:ColorSpace": 65535,
        }
        flags = _compute_flags(self.result, is_field_incident=False)
        self.assertTrue("uncalibrated_color_space" in flags)

        # Test scorer
        self.result.flags = flags
        score_res = compute_score(self.result, self.gemini)
        self.assertEqual(score_res.score, 10)
        self.assertIn("uncalibrated_color_space", score_res.score_breakdown)

    def test_error_path_sanitization(self):
        from scorer import sanitize_error_message
        err1 = "C:\\Users\\rsach\\AppData\\Local\\Temp\\tmpymhpnuh8.mp4 is not a valid file path."
        sanitized1 = sanitize_error_message(err1)
        self.assertEqual(sanitized1, "tmpymhpnuh8.mp4 is not a valid file path.")

        err2 = "/tmp/some_dir/file.png is not a valid file path."
        sanitized2 = sanitize_error_message(err2)
        self.assertEqual(sanitized2, "file.png is not a valid file path.")

        # Test within plain notes
        self.gemini.error = err1
        self.result.error = err2
        score_res = compute_score(self.result, self.gemini)
        self.assertNotIn("C:\\Users\\rsach\\AppData\\Local\\Temp", score_res.plain_notes)
        self.assertNotIn("/tmp/some_dir", score_res.plain_notes)
        self.assertIn("tmpymhpnuh8.mp4", score_res.plain_notes)
        self.assertIn("file.png", score_res.plain_notes)

if __name__ == "__main__":
    unittest.main()
