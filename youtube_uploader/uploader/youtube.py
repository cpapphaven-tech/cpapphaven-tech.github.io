import http.client
import logging
import random
import socket
import time
from typing import Optional

from googleapiclient.discovery import Resource
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from tqdm import tqdm

from .config import Config
from .csv_reader import VideoMetadata
from .video_utils import VideoInfo

logger = logging.getLogger(__name__)

# HTTP status codes that warrant a retry
RETRIABLE_STATUS_CODES = {500, 502, 503, 504, 429, 408}
# Python exceptions that indicate transient network errors
RETRIABLE_EXCEPTIONS = (
    http.client.NotConnected,
    http.client.IncompleteRead,
    http.client.ImproperConnectionState,
    http.client.CannotSendRequest,
    http.client.CannotSendHeader,
    http.client.ResponseNotReady,
    http.client.BadStatusLine,
    socket.error,
    IOError,
    OSError,
)

# Category ID 20 = Gaming (standard YouTube category for gameplay videos)
GAMING_CATEGORY_ID = "20"


def build_video_body(
    metadata: VideoMetadata,
    video_info: VideoInfo,
) -> dict:
    """
    Constructs the 'body' dict for the videos.insert API call.

    Handles #Shorts classification by appending '#Shorts' to the title
    so YouTube's algorithm auto-classifies the video in the Shorts feed.
    Sets publishAt if a schedule is defined (requires private status).

    Args:
        metadata: Fully populated VideoMetadata from csv_reader.
        video_info: Probe results from video_utils (dimensions, duration, is_short).

    Returns:
        dict suitable for the 'body' parameter of the YouTube API insert call.
    """
    title = metadata.title
    # Ensure Shorts are tagged in title for YouTube algorithm recognition
    if video_info.is_short and "#Shorts" not in title and "#shorts" not in title:
        title = f"{title} #Shorts"

    # Truncate title to YouTube's 100-character limit
    if len(title) > 100:
        title = title[:97] + "..."

    # Truncate description to YouTube's 5000-character limit
    description = metadata.description
    if len(description) > 5000:
        description = description[:4997] + "..."

    # Build snippet
    snippet: dict = {
        "title": title,
        "description": description,
        "tags": metadata.tags[:500],  # YouTube allows up to 500 tags
        "categoryId": GAMING_CATEGORY_ID,
        "defaultLanguage": "en",
    }

    # Build status
    privacy_status = metadata.privacy_status
    status: dict = {
        "privacyStatus": privacy_status,
        "selfDeclaredMadeForKids": False,
    }

    # Add schedule if defined (scheduling requires privacyStatus=private)
    scheduled_at = metadata.scheduled_at_iso
    if scheduled_at:
        if privacy_status != "private":
            logger.warning(
                f"Scheduling requires privacyStatus='private'. "
                f"Overriding '{privacy_status}' -> 'private' for '{metadata.filename}'."
            )
            status["privacyStatus"] = "private"
        status["publishAt"] = scheduled_at
        logger.info(f"Video '{metadata.filename}' scheduled for: {scheduled_at}")

    return {"snippet": snippet, "status": status}


def upload_video(
    service: Resource,
    metadata: VideoMetadata,
    video_info: VideoInfo,
) -> Optional[str]:
    """
    Uploads a single video to YouTube with chunked streaming, progress bar,
    and exponential-backoff retry on transient failures.

    Args:
        service: Authenticated YouTube API Resource object.
        metadata: Fully populated VideoMetadata.
        video_info: VideoInfo with path, dimensions, and short classification.

    Returns:
        YouTube Video ID string on success, or None on failure.
    """
    body = build_video_body(metadata, video_info)
    logger.info(
        f"Uploading '{metadata.filename}' | title='{body['snippet']['title']}' | "
        f"short={video_info.is_short} | schedule={metadata.scheduled_at_iso or 'immediate'}"
    )

    # Configure chunked MediaFileUpload (resumable)
    media = MediaFileUpload(
        str(video_info.path),
        mimetype="video/mp4",
        chunksize=Config.CHUNK_SIZE,
        resumable=True,
    )

    request = service.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    file_size = video_info.path.stat().st_size
    video_id: Optional[str] = None
    retry_count = 0
    backoff = 2  # initial backoff in seconds

    with tqdm(
        total=file_size,
        unit="B",
        unit_scale=True,
        unit_divisor=1024,
        desc=f"📤 {metadata.filename}",
        colour="cyan",
    ) as progress:
        while video_id is None:
            try:
                status_obj, response = request.next_chunk()
                if status_obj:
                    uploaded = int(status_obj.resumable_progress)
                    progress.update(uploaded - progress.n)
                if response is not None:
                    # Upload complete
                    progress.update(file_size - progress.n)
                    video_id = response.get("id")
                    logger.info(
                        f"✅ Upload complete: '{metadata.filename}' -> "
                        f"https://www.youtube.com/watch?v={video_id}"
                    )

            except HttpError as e:
                if e.resp.status in RETRIABLE_STATUS_CODES:
                    if retry_count >= Config.MAX_RETRIES:
                        logger.error(
                            f"Max retries ({Config.MAX_RETRIES}) exceeded for "
                            f"'{metadata.filename}'. Giving up."
                        )
                        return None
                    wait = backoff + random.uniform(0, 1)
                    logger.warning(
                        f"HTTP {e.resp.status} error. Retrying in {wait:.1f}s "
                        f"(attempt {retry_count + 1}/{Config.MAX_RETRIES})..."
                    )
                    time.sleep(wait)
                    backoff = min(backoff * 2, 64)  # Exponential cap at 64s
                    retry_count += 1
                else:
                    logger.error(f"Non-retriable HTTP error for '{metadata.filename}': {e}")
                    return None

            except RETRIABLE_EXCEPTIONS as e:
                if retry_count >= Config.MAX_RETRIES:
                    logger.error(
                        f"Max retries ({Config.MAX_RETRIES}) exceeded for "
                        f"'{metadata.filename}' due to network error. Giving up."
                    )
                    return None
                wait = backoff + random.uniform(0, 1)
                logger.warning(
                    f"Transient network error: {e}. Retrying in {wait:.1f}s "
                    f"(attempt {retry_count + 1}/{Config.MAX_RETRIES})..."
                )
                time.sleep(wait)
                backoff = min(backoff * 2, 64)
                retry_count += 1

    return video_id
