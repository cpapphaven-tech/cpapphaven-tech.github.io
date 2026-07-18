import csv
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional
from .config import Config

logger = logging.getLogger(__name__)

# Mapping of filename-to-readable game name (strips suffix and underscores)
def _infer_game_name(filename: str) -> str:
    """
    Converts a video filename to a human-readable game name.
    Example: 'Knife_Hit_short.mp4' -> 'Knife Hit'
    """
    stem = Path(filename).stem  # Remove extension
    # Remove trailing _short or _video suffixes
    stem = re.sub(r"_(short|video)$", "", stem, flags=re.IGNORECASE)
    # Replace underscores with spaces, strip extra whitespace
    return stem.replace("_", " ").strip()


@dataclass
class VideoMetadata:
    """Stores all upload metadata for a single video."""
    filename: str
    title: str
    description: str
    tags: list[str]
    publish_date: Optional[str] = None   # ISO date, e.g. '2025-08-01'
    publish_time: Optional[str] = None   # 24h time, e.g. '14:00'
    privacy_status: str = "private"
    is_auto_generated: bool = False      # True if metadata was auto-generated

    @property
    def scheduled_at_iso(self) -> Optional[str]:
        """
        Returns RFC 3339 UTC datetime string for scheduling if both
        publish_date and publish_time are provided, else None.
        YouTube requires private status to schedule.
        """
        if self.publish_date and self.publish_time:
            try:
                dt = datetime.strptime(
                    f"{self.publish_date} {self.publish_time}", "%Y-%m-%d %H:%M"
                )
                return dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            except ValueError as e:
                logger.warning(
                    f"Invalid schedule for '{self.filename}': {e}. Skipping schedule."
                )
        return None


def _generate_metadata(filename: str, is_short: bool = True) -> VideoMetadata:
    """
    Auto-generates SEO-friendly metadata when a CSV row is missing for a video.

    Args:
        filename: The MP4 filename.
        is_short: If True, appends #Shorts to tags and title.

    Returns:
        VideoMetadata with auto-generated content.
    """
    game_name = _infer_game_name(filename)
    short_indicator = " #Shorts" if is_short else ""

    title = f"Play {game_name} Online Free! 🎮{short_indicator}"

    description = (
        f"🎮 Play {game_name} for FREE instantly in your browser!\n\n"
        f"No downloads. No sign-ups. Just tap and play!\n\n"
        f"✅ Play {game_name} and 80+ other free games at:\n"
        f"👉 {Config.WEBSITE_URL}\n\n"
        f"🕹️ More exciting games available:\n"
        f"• Puzzle & Brain Games\n"
        f"• Action & Arcade\n"
        f"• Sports Games\n"
        f"• Board & Classic\n\n"
        f"#gaming #freegames #playmix #mobilegames "
        f"#{game_name.replace(' ', '')} #onlinegames"
    )

    # Build tag list from game name and generic gaming keywords
    tags = [
        game_name,
        f"{game_name} game",
        "free online games",
        "browser games",
        "PlayMix Games",
        "playmixgames",
        "mobile games",
        "casual games",
        "gaming",
    ]
    if is_short:
        tags.extend(["Shorts", "YouTubeShorts", "short video"])

    logger.debug(f"Auto-generated metadata for '{filename}'.")

    return VideoMetadata(
        filename=filename,
        title=title,
        description=description,
        tags=tags,
        privacy_status=Config.DEFAULT_PRIVACY_STATUS,
        is_auto_generated=True,
    )


def load_metadata_map(csv_path: Path) -> dict[str, dict]:
    """
    Reads videos.csv and returns a dict keyed by filename.
    Skips rows with missing filename column, logging warnings.

    Args:
        csv_path: Absolute path to videos.csv.

    Returns:
        dict mapping filename -> raw row dict.
    """
    metadata_map: dict[str, dict] = {}

    if not csv_path.exists():
        logger.info(f"No CSV found at '{csv_path}'. All metadata will be auto-generated.")
        return metadata_map

    try:
        with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=2):  # start=2 to account for header row
                filename = row.get("filename", "").strip()
                if not filename:
                    logger.warning(f"CSV row {i} missing 'filename' column. Skipping.")
                    continue
                metadata_map[filename] = row
        logger.info(f"Loaded {len(metadata_map)} CSV rows from '{csv_path}'.")
    except (OSError, csv.Error) as e:
        logger.error(f"Error reading CSV '{csv_path}': {e}. Defaulting to auto-generation.")

    return metadata_map


def get_video_metadata(
    filename: str,
    metadata_map: dict[str, dict],
    is_short: bool = True,
) -> VideoMetadata:
    """
    Returns VideoMetadata for a given filename:
    - If the filename appears in the CSV, uses that row.
    - If the row fields are missing or blank, auto-generates them.
    - If the filename doesn't appear in the CSV at all, auto-generates everything.

    Args:
        filename: The MP4 filename.
        metadata_map: Dict from load_metadata_map().
        is_short: Whether the video qualifies as a YouTube Short.

    Returns:
        Fully populated VideoMetadata.
    """
    row = metadata_map.get(filename)

    if not row:
        logger.info(f"No CSV row for '{filename}'. Auto-generating metadata.")
        return _generate_metadata(filename, is_short=is_short)

    game_name = _infer_game_name(filename)
    short_indicator = " #Shorts" if is_short else ""

    # Title: use CSV or generate
    title = row.get("title", "").strip()
    if not title:
        title = f"Play {game_name} Online Free! 🎮{short_indicator}"
        logger.debug(f"Auto-generated title for '{filename}'.")

    # Description: use CSV or generate
    description = row.get("description", "").strip()
    if not description:
        description = (
            f"🎮 Play {game_name} for FREE instantly in your browser!\n\n"
            f"👉 {Config.WEBSITE_URL}\n\n"
            f"#gaming #freegames #playmix #{game_name.replace(' ', '')}"
        )

    # Tags: parse comma-separated string or generate defaults
    raw_tags = row.get("tags", "").strip()
    if raw_tags:
        tags = [t.strip().lstrip("#") for t in raw_tags.split(",") if t.strip()]
    else:
        tags = [game_name, "gaming", "PlayMix Games", "free games"]
    if is_short and "Shorts" not in tags:
        tags.append("Shorts")

    privacy_status = row.get("privacy_status", "").strip() or Config.DEFAULT_PRIVACY_STATUS

    return VideoMetadata(
        filename=filename,
        title=title,
        description=description,
        tags=tags,
        publish_date=row.get("publish_date", "").strip() or None,
        publish_time=row.get("publish_time", "").strip() or None,
        privacy_status=privacy_status,
        is_auto_generated=False,
    )
