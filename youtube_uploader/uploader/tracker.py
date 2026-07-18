import json
import logging
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional
from .config import Config

logger = logging.getLogger(__name__)

# Thread lock ensures concurrent-safe reads/writes to uploaded.json
_lock = threading.Lock()


class UploadTracker:
    """
    Manages a persistent JSON log (uploaded.json) to track completed uploads.
    Prevents duplicate uploads when the script is re-run.
    """

    def __init__(self, tracker_file: Optional[Path] = None) -> None:
        self.tracker_file = tracker_file or Config.TRACKER_FILE
        self._data: dict[str, dict] = {}
        self._load()

    def _load(self) -> None:
        """Loads existing uploaded.json into memory. Creates empty file if missing."""
        if self.tracker_file.exists():
            try:
                with open(self.tracker_file, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
                logger.info(f"Loaded tracker with {len(self._data)} existing uploads.")
            except (json.JSONDecodeError, OSError) as e:
                logger.warning(f"Could not read tracker file '{self.tracker_file}': {e}. Starting fresh.")
                self._data = {}
        else:
            logger.info("No existing tracker file found. Starting fresh.")
            self._data = {}

    def _save(self) -> None:
        """Persists the in-memory tracker data to uploaded.json."""
        with open(self.tracker_file, "w", encoding="utf-8") as f:
            json.dump(self._data, f, indent=2, ensure_ascii=False)

    def is_uploaded(self, filename: str) -> bool:
        """Returns True if a video filename has already been uploaded."""
        return filename in self._data

    def mark_uploaded(
        self,
        filename: str,
        video_id: str,
        title: str,
        privacy_status: str,
        is_short: bool,
    ) -> None:
        """
        Records a successful upload to the tracker file.

        Args:
            filename: Local MP4 filename (e.g., 'KnifeHit_short.mp4').
            video_id: The YouTube Video ID returned by the API.
            title: The video title used during upload.
            privacy_status: The privacy status ('public', 'private', or 'unlisted').
            is_short: Whether the video qualified as a YouTube Short.
        """
        with _lock:
            self._data[filename] = {
                "video_id": video_id,
                "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
                "title": title,
                "privacy_status": privacy_status,
                "is_short": is_short,
                "uploaded_at": datetime.utcnow().isoformat() + "Z",
            }
            self._save()
            logger.info(f"Marked '{filename}' as uploaded (ID: {video_id}).")

    def summary(self) -> dict:
        """Returns a dictionary summary of all tracked uploads."""
        return {
            "total_uploaded": len(self._data),
            "videos": list(self._data.keys()),
        }
