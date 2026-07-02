import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Safely attempt to import pymediainfo. If native binaries or DLLs are missing, do not crash on startup.
try:
    from pymediainfo import MediaInfo
    HAS_MEDIAINFO = hasattr(MediaInfo, 'parse')
except Exception as e:
    logger.warning(f"[media_check] Could not import 'pymediainfo' library: {e}")
    HAS_MEDIAINFO = False

def analyse_media(file_path: str) -> Dict[str, Any]:
    """
    Analyse video/audio stream properties using MediaInfo.
    
    Args:
        file_path: Absolute path to the media file on disk.
        
    Returns:
        A dictionary containing media forensic flags and details.
    """
    results = {
        "re_encoded": False,
        "timestamp_mismatch": False,
        "duration_mismatch": False,
        "details": []
    }
    
    if not HAS_MEDIAINFO:
        results["details"].append("MediaInfo library not available on host system")
        return results
        
    try:
        
        media_info = MediaInfo.parse(file_path)
        video_tracks = [t for t in media_info.tracks if t.track_type == 'Video']
        audio_tracks = [t for t in media_info.tracks if t.track_type == 'Audio']
        general_tracks = [t for t in media_info.tracks if t.track_type == 'General']
        
        if not general_tracks:
            return results

        # 1. Check for re-encoding tools in libraries
        for track in general_tracks + video_tracks + audio_tracks:
            encoded_app = getattr(track, "encoded_application", None) or ""
            encoded_lib = getattr(track, "encoded_library", None) or ""
            writing_lib = getattr(track, "writing_library", None) or ""
            writing_app = getattr(track, "writing_application", None) or ""
            
            tool_signatures = ["ffmpeg", "handbrake", "premiere", "vegas", "imovie", "lavf", "capcut"]
            for signature in tool_signatures:
                if (signature in str(encoded_app).lower() or 
                    signature in str(encoded_lib).lower() or 
                    signature in str(writing_lib).lower() or
                    signature in str(writing_app).lower()):
                    results["re_encoded"] = True
                    results["details"].append(f"Re-encoding tool footprint detected: {signature}")
                    break
            if results["re_encoded"]:
                break

        # 2. Check duration & timestamp mismatch between Video and Audio streams
        if video_tracks and audio_tracks:
            v_track = video_tracks[0]
            a_track = audio_tracks[0]
            
            # Check duration mismatch (>1500 ms)
            v_dur = getattr(v_track, "duration", 0) or 0
            a_dur = getattr(a_track, "duration", 0) or 0
            try:
                if v_dur and a_dur and abs(float(v_dur) - float(a_dur)) > 1500:
                    results["duration_mismatch"] = True
                    results["details"].append(f"A/V stream duration mismatch (Video: {v_dur}ms, Audio: {a_dur}ms)")
            except (ValueError, TypeError):
                pass

            # Check creation/tagged date mismatch
            v_created = getattr(v_track, "creation_date", None)
            a_created = getattr(a_track, "creation_date", None)
            v_tagged = getattr(v_track, "tagged_date", None)
            a_tagged = getattr(a_track, "tagged_date", None)
            
            # Helper to normalize date strings
            def clean_date(d_val):
                if not d_val:
                    return None
                return str(d_val).replace("UTC", "").strip()

            v_c = clean_date(v_created or v_tagged)
            a_c = clean_date(a_created or a_tagged)
            
            if v_c and a_c and v_c != a_c:
                results["timestamp_mismatch"] = True
                results["details"].append(f"A/V track timestamp mismatch (Video: {v_c}, Audio: {a_c})")

    except Exception as e:
        logger.warning(f"[media_check] MediaInfo analysis failed: {e}")
        results["details"].append(f"MediaInfo check error: {str(e)}")
        
    return results
