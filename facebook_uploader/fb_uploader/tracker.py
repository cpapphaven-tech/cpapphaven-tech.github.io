import json
import logging
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional
from .config import Config

logger = logging.getLogger(__name__)

_lock = threading.Lock()


class FBTracker:
    """
    Manages a persistent JSON logs tracker (uploaded_fb.json) to prevent
    duplicate Reel uploads to the Facebook Page.
    """

    def __init__(self, tracker_file: Optional[Path] = None) -> None:
        self.tracker_file = tracker_file or Config.TRACKER_FILE
        self._data: dict[str, dict] = {}
        self._load()

    def _load(self) -> None:
        """Loads tracker data from disk. Creates an empty database if missing."""
        if self.tracker_file.exists():
            try:
                with open(self.tracker_file, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
                logger.info(f"Loaded FB tracker with {len(self._data)} scheduled uploads.")
            except (json.JSONDecodeError, OSError) as e:
                logger.warning(f"Could not read tracker file '{self.tracker_file}': {e}. Starting fresh.")
                self._data = {}
        else:
            logger.info("No existing FB tracker file found. Starting fresh.")
            self._data = {}

    def _save(self) -> None:
        """Saves current tracker state to database file."""
        with open(self.tracker_file, "w", encoding="utf-8") as f:
            json.dump(self._data, f, indent=2, ensure_ascii=False)

    def is_uploaded(self, filename: str) -> bool:
        """Returns True if the filename has already been scheduled/uploaded."""
        return filename in self._data

    def mark_uploaded(
        self,
        filename: str,
        video_id: str,
        title: str,
        scheduled_at: Optional[str],
    ) -> None:
        """
        Records a successful upload/scheduling event in the log.

        Args:
            filename: Local video file name.
            video_id: The Facebook Video ID returned by the API.
            title: The title/caption used.
            scheduled_at: ISO date string for scheduling, or None if immediate.
        """
        with _lock:
            self._data[filename] = {
                "fb_video_id": video_id,
                "title": title,
                "scheduled_at": scheduled_at,
                "uploaded_at": datetime.utcnow().isoformat() + "Z",
            }
            self._save()
            logger.info(f"Marked '{filename}' as uploaded to FB (ID: {video_id}).")

    def summary(self) -> dict:
        """Returns statistical overview of the tracker."""
        return {
            "total_uploaded": len(self._data),
            "videos": list(self._data.keys()),
        }
