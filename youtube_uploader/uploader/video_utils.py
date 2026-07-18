import json
import logging
import subprocess
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class VideoInfo:
    """Stores parsed video metadata extracted via ffprobe."""
    path: Path
    duration_seconds: float
    width: int
    height: int
    is_vertical: bool
    is_short: bool  # True if under 60s and vertical


def probe_video(filepath: Path) -> VideoInfo:
    """
    Uses ffprobe to extract duration, width, and height of a video file.
    Determines if the video qualifies as a YouTube Short (vertical + under 60s).

    Args:
        filepath: Absolute path to the MP4 file.

    Returns:
        VideoInfo dataclass with parsed metadata.

    Raises:
        RuntimeError: If ffprobe fails to parse the file.
    """
    logger.debug(f"Probing video metadata for: {filepath.name}")

    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        "-show_format",
        str(filepath),
    ]

    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=30,
        )
    except subprocess.TimeoutExpired as e:
        raise RuntimeError(f"ffprobe timed out for '{filepath.name}'.") from e
    except FileNotFoundError as e:
        raise RuntimeError(
            "ffprobe binary not found. Please install ffmpeg: https://ffmpeg.org/download.html"
        ) from e

    if result.returncode != 0:
        raise RuntimeError(
            f"ffprobe failed for '{filepath.name}': {result.stderr.strip()}"
        )

    probe_data = json.loads(result.stdout)

    # Parse duration from format section
    try:
        duration = float(probe_data["format"]["duration"])
    except (KeyError, ValueError, TypeError):
        logger.warning(f"Could not parse duration for '{filepath.name}'. Defaulting to 0.")
        duration = 0.0

    # Parse width and height from first video stream
    width, height = 0, 0
    for stream in probe_data.get("streams", []):
        if stream.get("codec_type") == "video":
            width = int(stream.get("width", 0))
            height = int(stream.get("height", 0))
            break

    is_vertical = height > width
    is_short = is_vertical and duration < 60.0

    logger.info(
        f"Probed '{filepath.name}': {width}x{height}, {duration:.1f}s, "
        f"vertical={is_vertical}, short={is_short}"
    )

    return VideoInfo(
        path=filepath,
        duration_seconds=duration,
        width=width,
        height=height,
        is_vertical=is_vertical,
        is_short=is_short,
    )
