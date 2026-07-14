"""
EXIF metadata extraction and forensic flag analysis.

Requires: pip install PyExifTool pillow
ExifTool binary must be installed on the system:
  Ubuntu/Debian: sudo apt-get install libimage-exiftool-perl
  Mac:           brew install exiftool
  Windows:       https://exiftool.org (add to PATH)
"""

import subprocess
import json
import os
import logging
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Known editing software — any match raises a flag
EDITING_SOFTWARE = [
    "adobe photoshop",
    "photoshop",
    "gimp",
    "lightroom",
    "adobe lightroom",
    "snapseed",
    "picsart",
    "pixlr",
    "facetune",
    "vsco",
    "afterlight",
    "canva",
    "paint.net",
    "corel",
    "inkscape",
]

MEDIA_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv", ".m4v", ".mp3", ".aac", ".wav", ".m4a", ".ogg"}


@dataclass
class ExifResult:
    raw: dict = field(default_factory=dict)
    software: Optional[str] = None
    creation_timestamp: Optional[str] = None
    modification_timestamp: Optional[str] = None
    gps_present: bool = False
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    device_make: Optional[str] = None
    device_model: Optional[str] = None
    flags: list[str] = field(default_factory=list)
    error: Optional[str] = None


def extract_exif(file_path: str, is_field_incident: bool = False) -> ExifResult:
    """
    Run ExifTool on a file and return structured forensic metadata.

    Args:
        file_path: Path to the evidence file on disk
        is_field_incident: Whether this was submitted as a field capture
                           (if True, missing GPS is flagged)
    """
    result = ExifResult()

    if not os.path.exists(file_path):
        result.error = f"File not found: {file_path}"
        return result

    try:
        # Run ExifTool with JSON output
        proc = subprocess.run(
            ["exiftool", "-json", "-a", "-G1", file_path],
            capture_output=True,
            text=True,
            timeout=15,
        )

        if proc.returncode != 0 or not proc.stdout.strip():
            # ExifTool not available — route to the right fallback by file type
            ext = os.path.splitext(file_path)[1].lower()
            if ext == ".pdf":
                return _extract_pdf_metadata(file_path, is_field_incident)
            if ext in MEDIA_EXTENSIONS:
                return _extract_media_metadata(file_path, is_field_incident)
            return _extract_with_pillow(file_path, is_field_incident)

        data_list = json.loads(proc.stdout)
        if not data_list:
            result.error = "No EXIF data returned"
            return result

        raw = data_list[0]
        result.raw = raw

        # ── Extract fields ────────────────────────────────────────────────
        result.software = _get(raw, ["EXIF:Software", "XMP:CreatorTool", "Software"])
        result.creation_timestamp = _get(
            raw,
            [
                "EXIF:DateTimeOriginal",
                "EXIF:CreateDate",
                "File:FileCreateDate",
                "XMP:CreateDate",
            ],
        )
        result.modification_timestamp = _get(
            raw,
            [
                "EXIF:ModifyDate",
                "File:FileModifyDate",
                "XMP:ModifyDate",
            ],
        )
        result.device_make = _get(raw, ["EXIF:Make"])
        result.device_model = _get(raw, ["EXIF:Model"])

        # GPS
        gps_lat = _get(raw, ["EXIF:GPSLatitude", "Composite:GPSLatitude"])
        gps_lng = _get(raw, ["EXIF:GPSLongitude", "Composite:GPSLongitude"])
        if gps_lat is not None and gps_lng is not None:
            result.gps_present = True
            try:
                result.gps_lat = float(gps_lat)
                result.gps_lng = float(gps_lng)
            except (ValueError, TypeError):
                pass

        # ── Forensic flags ────────────────────────────────────────────────
        result.flags = _compute_flags(result, is_field_incident)

    except subprocess.TimeoutExpired:
        result.error = "ExifTool timed out"
    except json.JSONDecodeError:
        result.error = "Failed to parse ExifTool output"
    except FileNotFoundError:
        # ExifTool binary not found — route to the right fallback by file type
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            return _extract_pdf_metadata(file_path, is_field_incident)
        if ext in MEDIA_EXTENSIONS:
            return _extract_media_metadata(file_path, is_field_incident)
        return _extract_with_pillow(file_path, is_field_incident)
    except Exception as e:
        result.error = str(e)

    return result


def _extract_pdf_metadata(file_path: str, is_field_incident: bool) -> ExifResult:
    """Extract metadata from PDF files using PyMuPDF (fitz) as a fallback."""
    result = ExifResult()
    result.raw = {"_source": "pymupdf_fallback"}

    try:
        import fitz  # PyMuPDF

        doc = fitz.open(file_path)
        meta = doc.metadata or {}
        doc.close()

        # PDF metadata keys: title, author, subject, keywords, creator, producer, creationDate, modDate, format, encryption
        creator = meta.get("creator") or meta.get("producer")
        result.software = creator or None

        creation_raw = meta.get("creationDate") or ""
        modification_raw = meta.get("modDate") or ""

        # PDF dates look like "D:20230601120000+05'30'" — strip the prefix and timezone
        def _parse_pdf_date(d: str) -> Optional[str]:
            if not d:
                return None
            d = d.strip()
            if d.startswith("D:"):
                d = d[2:]
            # Take first 14 chars: YYYYMMDDHHmmss
            d = d[:14]
            if len(d) >= 8:
                try:
                    from datetime import datetime as _dt
                    if len(d) >= 14:
                        return _dt.strptime(d, "%Y%m%d%H%M%S").strftime("%Y:%m:%d %H:%M:%S")
                    return _dt.strptime(d[:8], "%Y%m%d").strftime("%Y:%m:%d %H:%M:%S")
                except ValueError:
                    return None
            return None

        result.creation_timestamp = _parse_pdf_date(creation_raw)
        result.modification_timestamp = _parse_pdf_date(modification_raw)

        # Populate raw dict for flag computation
        result.raw["EXIF:Software"] = creator
        result.raw["EXIF:DateTimeOriginal"] = result.creation_timestamp
        result.raw["EXIF:ModifyDate"] = result.modification_timestamp

    except ImportError:
        result.error = "PDF metadata fallback unavailable: PyMuPDF not installed"
    except Exception as e:
        result.error = f"PDF metadata extraction failed: {e}"

    result.flags = _compute_flags(result, is_field_incident)
    return result


def _extract_media_metadata(file_path: str, is_field_incident: bool) -> ExifResult:
    """Extract metadata from video/audio files using pymediainfo as a fallback."""
    result = ExifResult()
    result.raw = {"_source": "pymediainfo_fallback"}

    try:
        from pymediainfo import MediaInfo

        media_info = MediaInfo.parse(file_path)
        general_tracks = [t for t in media_info.tracks if t.track_type == "General"]

        if general_tracks:
            g = general_tracks[0]

            # Software / encoder
            software = (
                getattr(g, "encoded_application", None)
                or getattr(g, "writing_application", None)
                or getattr(g, "writing_library", None)
                or getattr(g, "encoded_library", None)
            )
            result.software = str(software).strip() if software else None

            # Timestamps — MediaInfo uses UTC strings like "UTC 2023-06-01 12:00:00"
            def _norm_media_date(d) -> Optional[str]:
                if not d:
                    return None
                d = str(d).replace("UTC", "").strip()
                for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
                    try:
                        from datetime import datetime as _dt
                        return _dt.strptime(d, fmt).strftime("%Y:%m:%d %H:%M:%S")
                    except ValueError:
                        continue
                return None

            result.creation_timestamp = _norm_media_date(
                getattr(g, "recorded_date", None)
                or getattr(g, "tagged_date", None)
                or getattr(g, "encoded_date", None)
            )
            result.modification_timestamp = _norm_media_date(
                getattr(g, "file_last_modification_date", None)
            )

            # Populate raw dict for flag computation
            if result.software:
                result.raw["EXIF:Software"] = result.software
            if result.creation_timestamp:
                result.raw["EXIF:DateTimeOriginal"] = result.creation_timestamp
            if result.modification_timestamp:
                result.raw["EXIF:ModifyDate"] = result.modification_timestamp

    except ImportError:
        result.error = "Media metadata fallback unavailable: pymediainfo not installed"
    except Exception as e:
        result.error = f"Media metadata extraction failed: {e}"

    result.flags = _compute_flags(result, is_field_incident)
    return result


def _extract_with_pillow(file_path: str, is_field_incident: bool) -> ExifResult:
    """Fallback EXIF extraction using Pillow for image files."""
    result = ExifResult()
    result.raw = {"_source": "pillow_fallback"}

    try:
        from PIL import Image
        from PIL.ExifTags import TAGS

        img = Image.open(file_path)
        # Use public getexif() API (works for JPEG, PNG, TIFF, WebP)
        # _getexif() is JPEG-only and returns None for all other formats
        raw_exif = img.getexif()

        decoded = {}
        if raw_exif:
            decoded = {TAGS.get(tag, tag): value for tag, value in raw_exif.items()}
            result.software = decoded.get("Software")
            result.creation_timestamp = str(decoded.get("DateTimeOriginal", ""))
            result.modification_timestamp = str(decoded.get("DateTime", ""))
            result.device_make = decoded.get("Make")
            result.device_model = decoded.get("Model")

            gps_info = decoded.get("GPSInfo")
            if gps_info:
                result.gps_present = True

        # Check for ICC profile in img.info
        if img.info.get("icc_profile"):
            decoded["ICC_Profile"] = "present"

        # Also store image size from Pillow if available
        if hasattr(img, "width") and hasattr(img, "height"):
            decoded["ImageWidth"] = img.width
            decoded["ImageHeight"] = img.height

        result.raw = decoded

    except Exception as e:
        result.error = f"Pillow fallback failed: {e}"

    result.flags = _compute_flags(result, is_field_incident)
    return result


def _compute_flags(result: ExifResult, is_field_incident: bool) -> list[str]:
    """Evaluate forensic flags from extracted metadata."""
    flags = []

    # Flag 1: Known editing software
    if result.software:
        sw_lower = result.software.lower()
        for tool in EDITING_SOFTWARE:
            if tool in sw_lower:
                flags.append(
                    f"editing_software_detected:{result.software}"
                )
                break

    # Flag 2: Modification timestamp newer than creation timestamp
    if result.creation_timestamp and result.modification_timestamp:
        try:
            create_dt = _parse_exif_date(result.creation_timestamp)
            modify_dt = _parse_exif_date(result.modification_timestamp)
            if create_dt and modify_dt:
                diff_seconds = (modify_dt - create_dt).total_seconds()
                if diff_seconds > 60:
                    flags.append(
                        f"modification_after_creation:{int(diff_seconds)}s"
                    )
        except Exception:
            pass

    # Flag 3: Missing GPS on field incident
    if is_field_incident and not result.gps_present:
        flags.append("gps_absent_on_field_incident")

    # Flag 4: No creation timestamp at all (metadata stripped)
    if not result.creation_timestamp:
        flags.append("no_creation_timestamp")

    # Flag 5: Thumbnail dimension mismatch (aspect ratio difference > 0.05)
    main_w = _get_number(result.raw, ["EXIF:ImageWidth", "EXIF:ExifImageWidth", "File:ImageWidth", "ImageWidth"])
    main_h = _get_number(result.raw, ["EXIF:ImageHeight", "EXIF:ExifImageHeight", "File:ImageHeight", "ImageHeight", "EXIF:ImageLength", "ImageLength"])
    thumb_w = _get_number(result.raw, ["EXIF:ThumbnailImageWidth", "EXIF:ThumbnailWidth", "ThumbnailImageWidth", "ThumbnailWidth"])
    thumb_h = _get_number(result.raw, ["EXIF:ThumbnailImageHeight", "EXIF:ThumbnailHeight", "ThumbnailImageHeight", "ThumbnailHeight"])
    if main_w and main_h and thumb_w and thumb_h:
        if main_h > 0 and thumb_h > 0:
            main_ratio = main_w / main_h
            thumb_ratio = thumb_w / thumb_h
            if abs(main_ratio - thumb_ratio) > 0.05:
                flags.append(f"thumbnail_dimension_mismatch:{int(main_w)}x{int(main_h)} vs {int(thumb_w)}x{int(thumb_h)}")

    # Flag 6: GPS Precision Anomaly (>6 decimal places)
    for val in [result.gps_lat, result.gps_lng]:
        if val is not None:
            # Round to 10 decimal places to filter float representation noise,
            # then check if it can be represented with 6 or fewer decimal places.
            rounded = round(val, 10)
            if abs(rounded - round(val, 6)) > 1e-9:
                flags.append(f"gps_precision_anomaly:{val}")
                break

    # We also check raw coordinates if they are string decimals
    raw_lat = _get(result.raw, ["EXIF:GPSLatitude", "Composite:GPSLatitude"])
    raw_lng = _get(result.raw, ["EXIF:GPSLongitude", "Composite:GPSLongitude"])
    for raw_coord in [raw_lat, raw_lng]:
        if raw_coord is not None:
            try:
                val = float(raw_coord)
                rounded = round(val, 10)
                if abs(rounded - round(val, 6)) > 1e-9:
                    if not any(f.startswith("gps_precision_anomaly") for f in flags):
                        flags.append(f"gps_precision_anomaly:{val}")
                        break
            except (ValueError, TypeError):
                pass

    # Flag 7: Future timestamp
    if result.creation_timestamp:
        try:
            create_dt = _parse_exif_date(result.creation_timestamp)
            if create_dt:
                now = datetime.now()
                if create_dt.tzinfo is not None and now.tzinfo is None:
                    create_dt = create_dt.replace(tzinfo=None)
                if (create_dt - now).total_seconds() > 60:
                    flags.append(f"future_timestamp:{result.creation_timestamp}")
        except Exception:
            pass

    # Flag 8: Software field contradiction (EXIF:Software vs XMP:CreatorTool)
    software_exif = _get(result.raw, ["EXIF:Software", "Software"])
    creator_tool = _get(result.raw, ["XMP:CreatorTool", "CreatorTool"])
    if software_exif and creator_tool:
        sw_norm = str(software_exif).strip().lower()
        ct_norm = str(creator_tool).strip().lower()
        if sw_norm != ct_norm and sw_norm not in ct_norm and ct_norm not in sw_norm:
            flags.append(f"software_field_contradiction:{software_exif} vs {creator_tool}")

    # Flag 9: Screenshot tool detected
    SCREENSHOT_TOOLS = [
        "snagit",
        "greenshot",
        "sharex",
        "snipping tool",
        "lightshot",
        "skitch",
        "gyazo",
        "nimbus",
        "screenshot",
    ]
    if result.software:
        sw_lower = result.software.lower()
        for tool in SCREENSHOT_TOOLS:
            if tool in sw_lower:
                flags.append(f"screenshot_tool_detected:{result.software}")
                break

    # Flag 10: Instant modification
    if result.creation_timestamp and result.modification_timestamp:
        try:
            create_dt = _parse_exif_date(result.creation_timestamp)
            modify_dt = _parse_exif_date(result.modification_timestamp)
            if create_dt and modify_dt:
                diff_seconds = (modify_dt - create_dt).total_seconds()
                # Flag if modified within 5 seconds, excluding identical timestamps
                if 0 < diff_seconds <= 5:
                    flags.append(f"instant_modification:{int(diff_seconds)}s")
        except Exception:
            pass

    # Flag 11: Device make contradiction (EXIF:Make vs Composite:Make)
    exif_make = _get(result.raw, ["EXIF:Make", "Make"])
    composite_make = _get(result.raw, ["Composite:Make"])
    if exif_make and composite_make:
        exif_make_norm = str(exif_make).strip().lower()
        comp_make_norm = str(composite_make).strip().lower()
        if exif_make_norm != comp_make_norm and exif_make_norm not in comp_make_norm and comp_make_norm not in exif_make_norm:
            flags.append(f"device_make_contradiction:{exif_make} vs {composite_make}")

    # Flag 12: Uncalibrated color space without ICC profile
    color_space = _get(result.raw, ["EXIF:ColorSpace", "ColorSpace"])
    is_uncalibrated = False
    if color_space is not None:
        cs_str = str(color_space).strip().lower()
        if cs_str == "65535" or "uncalibrated" in cs_str:
            is_uncalibrated = True
    has_icc_profile = any("ICC_Profile" in k or "ICCProfile" in k for k in result.raw.keys())
    if is_uncalibrated and not has_icc_profile:
        flags.append("uncalibrated_color_space")

    return flags


def _get_number(data: dict, keys: list[str]) -> Optional[float]:
    """Try multiple key names, return first found value as a float."""
    val = _get(data, keys)
    if val is not None:
        try:
            return float(val)
        except (ValueError, TypeError):
            pass
    return None


def _get(data: dict, keys: list[str]):
    """Try multiple key names, return first found value."""
    for key in keys:
        val = data.get(key)
        if val is not None and val != "":
            return val
    return None


def _parse_exif_date(date_str: str) -> Optional[datetime]:
    """Parse common EXIF date formats."""
    if not date_str:
        return None
    formats = [
        "%Y:%m:%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return None