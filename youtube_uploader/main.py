"""
main.py — YouTube Shorts/Video Uploader Entry Point
====================================================
This is the orchestration layer that ties together all modules:
  1. Loads and validates configuration.
  2. Initializes file logging.
  3. Authenticates with YouTube Data API v3 via OAuth 2.0.
  4. Discovers all MP4 files in the videos/ directory (alphabetical order).
  5. Reads or auto-generates metadata for each video from videos.csv.
  6. Probes each video with ffprobe to determine dimensions and duration.
  7. Skips already-uploaded videos using uploaded.json tracker.
  8. Uploads each video with progress bar, retry logic, and scheduling.
  9. Marks each successful upload in the tracker log.

Usage:
    python main.py [--dry-run] [--limit N]

Flags:
    --dry-run    Preview what would be uploaded without actually uploading.
    --limit N    Only process the first N videos (useful for testing).
"""

import argparse
import logging
import sys
from pathlib import Path

from uploader.auth import get_youtube_service
from uploader.config import Config
from uploader.csv_reader import get_video_metadata, load_metadata_map
from uploader.tracker import UploadTracker
from uploader.video_utils import probe_video
from uploader.youtube import upload_video


def setup_logging() -> None:
    """
    Configures dual logging:
    - Console handler: INFO level with concise format.
    - File handler: DEBUG level with full timestamp, level, module, and message.
    """
    Config.validate_paths()
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # Console formatter — clean output for terminal
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(
        logging.Formatter("%(asctime)s  %(levelname)-8s  %(message)s", "%H:%M:%S")
    )

    # File formatter — verbose for debugging
    file_handler = logging.FileHandler(Config.LOG_FILE, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(
        logging.Formatter(
            "%(asctime)s  %(levelname)-8s  [%(name)s:%(lineno)d]  %(message)s",
            "%Y-%m-%d %H:%M:%S",
        )
    )

    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)


def discover_videos(videos_dir: Path) -> list[Path]:
    """
    Scans the videos/ folder for all MP4 files sorted alphabetically.

    Args:
        videos_dir: Path to the directory containing MP4 files.

    Returns:
        Sorted list of Path objects for each .mp4 file.
    """
    mp4_files = sorted(videos_dir.glob("*.mp4"), key=lambda p: p.name.lower())
    if not mp4_files:
        logging.getLogger(__name__).warning(
            f"No MP4 files found in '{videos_dir}'. Nothing to upload."
        )
    return mp4_files


def parse_args() -> argparse.Namespace:
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Upload PlayMix game videos to YouTube as Shorts or regular videos.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                  # Upload all videos (scheduled per CSV)
  python main.py --dry-run        # Preview without uploading
  python main.py --limit 5        # Upload first 5 videos only
  python main.py --now --limit 2  # Upload 2 videos RIGHT NOW as public
        """,
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="Preview which videos would be uploaded without actually uploading.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit the number of videos to process (useful for testing).",
    )
    parser.add_argument(
        "--now",
        action="store_true",
        default=False,
        help="Upload videos immediately as PUBLIC, ignoring CSV schedule. Use for testing.",
    )
    return parser.parse_args()


def main() -> None:
    """Main orchestration function."""
    args = parse_args()
    setup_logging()
    logger = logging.getLogger(__name__)

    # ── Banner ──────────────────────────────────────────────────────────────
    print()
    print("=" * 60)
    print("  📺  PlayMix Games — YouTube Video Uploader")
    print("=" * 60)
    if args.dry_run:
        print("  🔍  DRY-RUN MODE: No videos will be uploaded.")
        print("=" * 60)
    print()

    # ── Step 1: Validate config paths ───────────────────────────────────────
    Config.validate_paths()
    logger.info("Configuration loaded and paths validated.")
    logger.info(f"Videos directory : {Config.VIDEOS_DIR}")
    logger.info(f"CSV path         : {Config.CSV_PATH}")
    logger.info(f"Tracker file     : {Config.TRACKER_FILE}")
    logger.info(f"Log file         : {Config.LOG_FILE}")

    # ── Step 2: Discover MP4 files ───────────────────────────────────────────
    video_files = discover_videos(Config.VIDEOS_DIR)
    if not video_files:
        print("No MP4 files found to upload. Exiting.")
        sys.exit(0)

    if args.limit:
        video_files = video_files[: args.limit]
        logger.info(f"Limiting to first {args.limit} video(s).")

    total = len(video_files)
    logger.info(f"Discovered {total} MP4 file(s) to process.")

    # ── Step 3: Load CSV metadata map ────────────────────────────────────────
    metadata_map = load_metadata_map(Config.CSV_PATH)

    # ── Step 4: Load upload tracker ──────────────────────────────────────────
    tracker = UploadTracker()
    summary = tracker.summary()
    logger.info(
        f"Tracker loaded: {summary['total_uploaded']} video(s) already uploaded."
    )

    # ── Step 5: Authenticate with YouTube ───────────────────────────────────
    if not args.dry_run:
        logger.info("Authenticating with YouTube Data API v3...")
        try:
            service = get_youtube_service()
            logger.info("Authentication successful.")
        except SystemExit:
            raise
        except Exception as e:
            logger.critical(f"Authentication failed: {e}")
            sys.exit(1)
    else:
        service = None

    # ── Step 6: Process each video ───────────────────────────────────────────
    uploaded_count = 0
    skipped_count = 0
    failed_count = 0

    for idx, video_path in enumerate(video_files, start=1):
        filename = video_path.name
        print(f"\n[{idx}/{total}] 🎮 {filename}")

        # Skip duplicates
        if tracker.is_uploaded(filename):
            logger.info(f"  ⏭  Already uploaded '{filename}'. Skipping.")
            print(f"       ⏭  Skipped (already uploaded)")
            skipped_count += 1
            continue

        # Probe video
        try:
            video_info = probe_video(video_path)
        except RuntimeError as e:
            logger.error(f"  ❌  Failed to probe '{filename}': {e}")
            print(f"       ❌  Error probing video: {e}")
            failed_count += 1
            continue

        # Get metadata
        meta = get_video_metadata(filename, metadata_map, is_short=video_info.is_short)

        # --now override: upload immediately as public, ignore CSV schedule
        if getattr(args, "now", False):
            meta.privacy_status = "public"
            meta.publish_date = None
            meta.publish_time = None
            logger.info(f"  --now flag: overriding to public, no schedule.")

        # Log preview info
        logger.info(
            f"  Title     : {meta.title}\n"
            f"  Short     : {video_info.is_short}\n"
            f"  Duration  : {video_info.duration_seconds:.1f}s\n"
            f"  Dimensions: {video_info.width}x{video_info.height}\n"
            f"  Privacy   : {meta.privacy_status}\n"
            f"  Scheduled : {meta.scheduled_at_iso or 'Immediate'}\n"
            f"  Auto-gen  : {meta.is_auto_generated}"
        )

        if args.dry_run:
            print(f"       📋  Title    : {meta.title}")
            print(f"       📐  Size     : {video_info.width}x{video_info.height}")
            print(f"       ⏱   Duration : {video_info.duration_seconds:.1f}s")
            print(f"       🏷   Short    : {video_info.is_short}")
            print(f"       📅  Schedule : {meta.scheduled_at_iso or 'Immediate'}")
            print(f"       🔐  Privacy  : {meta.privacy_status}")
            continue

        # Upload
        try:
            video_id = upload_video(service, meta, video_info)
        except Exception as e:
            logger.error(f"  ❌  Unexpected error uploading '{filename}': {e}", exc_info=True)
            print(f"       ❌  Unexpected error: {e}")
            failed_count += 1
            continue

        if video_id:
            tracker.mark_uploaded(
                filename=filename,
                video_id=video_id,
                title=meta.title,
                privacy_status=meta.privacy_status,
                is_short=video_info.is_short,
            )
            print(f"       ✅  Uploaded: https://www.youtube.com/watch?v={video_id}")
            uploaded_count += 1
        else:
            logger.error(f"  ❌  Upload failed for '{filename}'.")
            print(f"       ❌  Upload failed.")
            failed_count += 1

    # ── Step 7: Final Summary ────────────────────────────────────────────────
    print()
    print("=" * 60)
    print("  📊  Upload Summary")
    print("=" * 60)
    print(f"  Total found  : {total}")
    print(f"  ✅ Uploaded  : {uploaded_count}")
    print(f"  ⏭  Skipped   : {skipped_count}")
    print(f"  ❌ Failed    : {failed_count}")
    print(f"  📂 Videos dir: {Config.VIDEOS_DIR}")
    print(f"  📝 Log file  : {Config.LOG_FILE}")
    print("=" * 60)
    print()

    logger.info(
        f"Done. Uploaded={uploaded_count}, Skipped={skipped_count}, Failed={failed_count}"
    )


if __name__ == "__main__":
    main()
