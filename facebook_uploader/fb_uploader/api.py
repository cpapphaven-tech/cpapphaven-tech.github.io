import logging
import random
import time
from datetime import datetime
from pathlib import Path
from typing import Optional
import requests
from tqdm import tqdm

from .config import Config

logger = logging.getLogger(__name__)


def get_schedule_timestamp(publish_date: Optional[str], publish_time: Optional[str]) -> Optional[int]:
    """
    Parses date and time strings (IST format) and returns a Unix timestamp for scheduling.
    Facebook requires the scheduled timestamp to be between 10 minutes and 75 days in the future.
    If the scheduled timestamp is in the past or under 10 minutes from now, automatically
    bumps it to 15 minutes in the future to prevent API scheduling errors.
    """
    if not publish_date or not publish_time:
        return None
    try:
        dt = datetime.strptime(f"{publish_date} {publish_time}", "%Y-%m-%d %H:%M")
        ts = int(dt.timestamp())

        now = int(time.time())
        if ts < (now + 600):
            bumped_ts = now + 900  # 15 minutes in the future
            bumped_time = datetime.fromtimestamp(bumped_ts).strftime('%Y-%m-%d %H:%M:%S')
            logger.info(
                f"Schedule for {publish_date} {publish_time} is in the past/too soon. "
                f"Auto-bumping to: {bumped_time} (Unix: {bumped_ts})"
            )
            return bumped_ts

        return ts
    except ValueError as e:
        logger.warning(f"Invalid schedule format: {publish_date} {publish_time} -> {e}")
    return None


def upload_facebook_reel(
    video_path: Path,
    description: str,
    publish_timestamp: Optional[int] = None,
) -> Optional[str]:
    """
    Uploads a video to a Facebook Page using the /{page-id}/videos endpoint.
    Facebook automatically treats short vertical videos (9:16) as Reels.
    Requires only the 'publish_video' permission (no pages_manage_posts needed).

    Scheduling support:
      - If publish_timestamp is set, the video is scheduled for that time.
      - If publish_timestamp is None, the video is published immediately.

    Args:
        video_path: Absolute Path to local MP4 video file.
        description: Description / caption for the Reel (can contain hashtags).
        publish_timestamp: Future Unix timestamp for scheduling (or None for immediate).

    Returns:
        The Facebook Video ID string on success, or None on failure.
    """
    filename = video_path.name
    file_size = video_path.stat().st_size

    upload_url = f"https://graph.facebook.com/v19.0/{Config.FB_PAGE_ID}/videos"

    # Build the multipart form fields
    fields = {
        "access_token": Config.FB_PAGE_ACCESS_TOKEN,
        "description": description,
    }

    if publish_timestamp:
        fields["published"] = "false"
        fields["scheduled_publish_time"] = str(publish_timestamp)
        log_time = datetime.fromtimestamp(publish_timestamp).strftime('%Y-%m-%d %H:%M:%S')
        logger.info(f"Will schedule post for: {log_time} (Unix: {publish_timestamp})")
    else:
        fields["published"] = "true"
        logger.info("Will publish Reel immediately.")

    retry_count = 0
    backoff = 2

    while retry_count < Config.MAX_RETRIES:
        try:
            logger.info(f"Uploading '{filename}' to /{Config.FB_PAGE_ID}/videos ...")
            with open(video_path, "rb") as f:
                with tqdm(
                    total=file_size,
                    unit="B",
                    unit_scale=True,
                    unit_divisor=1024,
                    desc=f"📤 {filename} -> FB",
                    colour="magenta",
                ) as progress:
                    class ProgressWrapper:
                        def __init__(self, fp):
                            self.fp = fp
                        def read(self, size=-1):
                            chunk = self.fp.read(size)
                            if chunk:
                                progress.update(len(chunk))
                            return chunk

                    wrapped_f = ProgressWrapper(f)

                    r = requests.post(
                        upload_url,
                        data=fields,
                        files={"source": (filename, wrapped_f, "video/mp4")},
                        timeout=300,  # 5 min timeout for large files
                    )

            res = r.json()

            if "error" in res:
                logger.error(f"Upload failed: {res['error']}")
                retry_count += 1
                if retry_count >= Config.MAX_RETRIES:
                    return None
                wait = backoff + random.uniform(0, 1)
                logger.warning(f"Retrying in {wait:.1f}s (attempt {retry_count}/{Config.MAX_RETRIES})...")
                time.sleep(wait)
                backoff *= 2
                continue

            video_id = res.get("id")
            if video_id:
                if publish_timestamp:
                    log_time = datetime.fromtimestamp(publish_timestamp).strftime('%Y-%m-%d %H:%M:%S')
                    logger.info(f"✅ Scheduled '{filename}' for {log_time}. Video ID: {video_id}")
                else:
                    logger.info(f"✅ Published '{filename}' immediately. Video ID: {video_id}")
                return video_id
            else:
                logger.error(f"Unexpected response (no video id): {res}")
                return None

        except (requests.RequestException, IOError) as e:
            retry_count += 1
            if retry_count >= Config.MAX_RETRIES:
                logger.error(f"Max retries reached for '{filename}'. Aborting.")
                return None
            wait = backoff + random.uniform(0, 1)
            logger.warning(
                f"Network error: {e}. Retrying in {wait:.1f}s "
                f"(attempt {retry_count}/{Config.MAX_RETRIES})..."
            )
            time.sleep(wait)
            backoff *= 2

    return None
