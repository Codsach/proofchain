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
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

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
            # ExifTool not available — use Pillow as fallback for images
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
        # ExifTool binary not found — use Pillow fallback
        return _extract_with_pillow(file_path, is_field_incident)
    except Exception as e:
        result.error = str(e)

    return result


def _extract_with_pillow(file_path: str, is_field_incident: bool) -> ExifResult:
    """Fallback EXIF extraction using Pillow for image files."""
    result = ExifResult()
    result.raw = {"_source": "pillow_fallback"}

    try:
        from PIL import Image
        from PIL.ExifTags import TAGS

        img = Image.open(file_path)
        exif_data = img._getexif()

        if exif_data:
            decoded = {TAGS.get(tag, tag): value for tag, value in exif_data.items()}
            result.raw = decoded

            result.software = decoded.get("Software")
            result.creation_timestamp = str(decoded.get("DateTimeOriginal", ""))
            result.modification_timestamp = str(decoded.get("DateTime", ""))
            result.device_make = decoded.get("Make")
            result.device_model = decoded.get("Model")

            gps_info = decoded.get("GPSInfo")
            if gps_info:
                result.gps_present = True

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

    return flags


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