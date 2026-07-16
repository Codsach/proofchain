import unittest
from unittest.mock import MagicMock, patch
import os
import sys

# Ensure ai-service directory is in python path
sys.path.append(os.path.dirname(__file__))

from media_check import analyse_media
from scorer import compute_score
from exif import ExifResult
from gemini import GeminiResult

class TestPhase2Forensics(unittest.TestCase):
    def setUp(self):
        self.exif = ExifResult(creation_timestamp="2026:06:22 12:00:00")
        self.gemini = GeminiResult(manipulation_likelihood="low", findings=[], confidence="high")
        import media_check
        media_check.HAS_MEDIAINFO = True

    @patch("media_check.MediaInfo")
    def test_analyse_media_re_encoded(self, mock_mediainfo_cls):
        mock_track = MagicMock()
        mock_track.track_type = "Video"
        mock_track.encoded_application = "ffmpeg"
        mock_track.encoded_library = ""
        mock_track.writing_library = ""
        
        mock_general = MagicMock()
        mock_general.track_type = "General"
        
        mock_media_info = MagicMock()
        mock_media_info.tracks = [mock_general, mock_track]
        mock_mediainfo_cls.parse.return_value = mock_media_info
        
        result = analyse_media("dummy_path.mp4")
        self.assertTrue(result["re_encoded"])
        self.assertFalse(result["timestamp_mismatch"])
        self.assertTrue(any("ffmpeg" in d for d in result["details"]))

    @patch("media_check.MediaInfo")
    def test_analyse_media_timestamp_mismatch(self, mock_mediainfo_cls):
        mock_track_v = MagicMock()
        mock_track_v.track_type = "Video"
        mock_track_v.creation_date = "UTC 2026-06-22 12:00:00"
        mock_track_v.duration = 5000
        
        mock_track_a = MagicMock()
        mock_track_a.track_type = "Audio"
        mock_track_a.creation_date = "UTC 2026-06-22 12:05:00"
        mock_track_a.duration = 5000
        
        mock_general = MagicMock()
        mock_general.track_type = "General"
        
        mock_media_info = MagicMock()
        mock_media_info.tracks = [mock_general, mock_track_v, mock_track_a]
        mock_mediainfo_cls.parse.return_value = mock_media_info
        
        result = analyse_media("dummy_path.mp4")
        self.assertFalse(result["re_encoded"])
        self.assertTrue(result["timestamp_mismatch"])

    @patch("media_check.MediaInfo")
    def test_analyse_media_duration_mismatch(self, mock_mediainfo_cls):
        mock_track_v = MagicMock()
        mock_track_v.track_type = "Video"
        mock_track_v.creation_date = "UTC 2026-06-22 12:00:00"
        mock_track_v.duration = 5000
        
        mock_track_a = MagicMock()
        mock_track_a.track_type = "Audio"
        mock_track_a.creation_date = "UTC 2026-06-22 12:00:00"
        mock_track_a.duration = 8000
        
        mock_general = MagicMock()
        mock_general.track_type = "General"
        
        mock_media_info = MagicMock()
        mock_media_info.tracks = [mock_general, mock_track_v, mock_track_a]
        mock_mediainfo_cls.parse.return_value = mock_media_info
        
        result = analyse_media("dummy_path.mp4")
        self.assertTrue(result["duration_mismatch"])

    def test_scorer_video_signals(self):
        # 1. Video reencoded flag (+20, escalated to 75 / high risk)
        score_res = compute_score(self.exif, self.gemini, video_reencoded=True)
        self.assertEqual(score_res.score, 75)
        self.assertEqual(score_res.risk_level, "high")
        self.assertIn("video_reencoded", score_res.score_breakdown)
        
        # 2. A/V timestamp mismatch flag (+20, escalated to 75 / high risk)
        score_res = compute_score(self.exif, self.gemini, av_timestamp_mismatch=True)
        self.assertEqual(score_res.score, 75)
        self.assertEqual(score_res.risk_level, "high")
        self.assertIn("av_timestamp_mismatch", score_res.score_breakdown)

        # 3. A/V duration mismatch flag (+20, escalated to 75 / high risk)
        score_res = compute_score(self.exif, self.gemini, av_duration_mismatch=True)
        self.assertEqual(score_res.score, 75)
        self.assertEqual(score_res.risk_level, "high")
        self.assertIn("av_duration_mismatch", score_res.score_breakdown)

        # 4. Multiple triggers capped at 100
        score_res = compute_score(
            self.exif, self.gemini, 
            video_reencoded=True, 
            av_timestamp_mismatch=True,
            av_duration_mismatch=True,
            mime_mismatch=True,
            is_pdf_no_text_layer=True,
            office_macros_detected=True
        )
        self.assertEqual(score_res.score, 100)
        self.assertEqual(score_res.risk_level, "high")

    @patch("google.genai.Client")
    def test_analyse_video_success(self, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        
        mock_file = MagicMock()
        mock_file.name = "files/mock-video-file-id"
        mock_file.state.name = "ACTIVE"
        mock_client.files.upload.return_value = mock_file
        
        mock_response = MagicMock()
        mock_response.text = '{"manipulation_likelihood": "high", "ai_generation_likelihood": "low", "findings": ["Shadow inconsistencies detected", "Frame drops"], "confidence": "high"}'
        mock_client.models.generate_content.return_value = mock_response
        
        from gemini import analyse_video
        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"}):
            res = analyse_video("dummy_path.mp4", "video/mp4")
            
        self.assertEqual(res.manipulation_likelihood, "high")
        self.assertEqual(res.ai_generation_likelihood, "low")
        self.assertEqual(res.confidence, "high")
        self.assertEqual(res.findings, ["Shadow inconsistencies detected", "Frame drops"])
        self.assertIsNone(res.error)
        
        mock_client.files.upload.assert_called_once_with(file="dummy_path.mp4")
        mock_client.files.delete.assert_called_once_with(name="files/mock-video-file-id")

    @patch("google.genai.Client")
    def test_analyse_video_processing_transition(self, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        
        mock_file_proc = MagicMock()
        mock_file_proc.name = "files/mock-video"
        mock_file_proc.state.name = "PROCESSING"
        
        mock_file_active = MagicMock()
        mock_file_active.name = "files/mock-video"
        mock_file_active.state.name = "ACTIVE"
        
        mock_client.files.upload.return_value = mock_file_proc
        mock_client.files.get.side_effect = [mock_file_active]
        
        mock_response = MagicMock()
        mock_response.text = '{"manipulation_likelihood": "low", "ai_generation_likelihood": "low", "findings": [], "confidence": "medium"}'
        mock_client.models.generate_content.return_value = mock_response
        
        from gemini import analyse_video
        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"}), patch("time.sleep") as mock_sleep:
            res = analyse_video("dummy_path.mp4", "video/mp4")
            
        self.assertEqual(res.manipulation_likelihood, "low")
        self.assertEqual(res.confidence, "medium")
        mock_sleep.assert_called_once_with(2)
        mock_client.files.delete.assert_called_once_with(name="files/mock-video")

    @patch("google.genai.Client")
    def test_analyse_video_failed_processing(self, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        
        mock_file = MagicMock()
        mock_file.name = "files/mock-video"
        mock_file.state.name = "FAILED"
        mock_file.error.message = "Codec not supported"
        mock_client.files.upload.return_value = mock_file
        
        from gemini import analyse_video
        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"}):
            res = analyse_video("dummy_path.mp4", "video/mp4")
            
        self.assertEqual(res.manipulation_likelihood, "inconclusive")
        self.assertIn("Video analysis failed: processing error", res.findings[0])
        self.assertIsNotNone(res.error)

    def test_analyse_video_no_api_key(self):
        from gemini import analyse_video
        with patch.dict(os.environ, {}, clear=True):
            res = analyse_video("dummy_path.mp4", "video/mp4")
        self.assertIn("GEMINI_API_KEY not configured", res.error)

if __name__ == "__main__":
    unittest.main()
