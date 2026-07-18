"""
main.py — Facebook Reels Uploader and Scheduler
===============================================
Orchestration layer that:
  1. Loads configuration from .env.
  2. Setup consoles and file loggers.
  3. Discovers MP4 video files in alphabetical order.
  4. Matches files against videos.csv and parses metadata.
  5. Skips files already in uploaded_fb.json.
  6. Schedules Reels at 7:00 AM & 9:00 PM IST (using Unix timestamps).
  7. Saves success tracking info to uploaded_fb.json.
"""

import argparse
import logging
import sys
from datetime import datetime
from pathlib import Path

# Add sister folder youtube_uploader to PYTHONPATH to reuse csv_reader & video_utils
sys.path.append(str(Path(__file__).resolve().parent.parent / "youtube_uploader"))

from fb_uploader.api import get_schedule_timestamp, upload_facebook_reel
from fb_uploader.config import Config
from fb_uploader.tracker import FBTracker
from uploader.csv_reader import load_metadata_map, get_video_metadata
from uploader.video_utils import probe_video


def setup_logging() -> None:
    """Configures dual console and file logger."""
    Config.validate()
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # Console Logger (INFO)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(
        logging.Formatter("%(asctime)s  %(levelname)-8s  %(message)s", "%H:%M:%S")
    )

    # File Logger (DEBUG)
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
    """Retrieves sorted list of MP4 files from target directory."""
    mp4_files = sorted(videos_dir.glob("*.mp4"), key=lambda p: p.name.lower())
    if not mp4_files:
        logging.getLogger(__name__).warning(f"No MP4 files found in '{videos_dir}'.")
    return mp4_files


def parse_args() -> argparse.Namespace:
    """Parses command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Upload and schedule PlayMix game Reels to Facebook Page.",
        epilog="""
Examples:
  python main.py                  # Schedule all remaining videos
  python main.py --dry-run        # Dry run preview of schedule
  python main.py --limit 3        # Upload/schedule first 3 videos
        """,
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="Preview schedule plans without making actual API uploads.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit the number of videos processed in this execution run.",
    )
    parser.add_argument(
        "--now",
        action="store_true",
        default=False,
        help="Upload Reels immediately as public, bypassing the schedule. Use for testing.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    setup_logging()
    logger = logging.getLogger(__name__)

    print()
    print("=" * 60)
    print("  💙  PlayMix Games — Facebook Reels Scheduler")
    print("=" * 60)
    if args.dry_run:
        print("  🔍  DRY-RUN MODE: No videos will be uploaded.")
        print("=" * 60)
    print()

    # Step 1: Discover Videos
    video_files = discover_videos(Config.VIDEOS_DIR)
    if not video_files:
        print("No videos found to schedule. Exiting.")
        sys.exit(0)

    if args.limit:
        video_files = video_files[: args.limit]
        logger.info(f"Limiting to first {args.limit} video(s).")

    total = len(video_files)
    logger.info(f"Discovered {total} video files to process.")

    # Step 2: Load CSV Schedule
    # Since our uploader package is in Python PATH, we reuse its metadata parsing logic!
    metadata_map = load_metadata_map(Config.CSV_PATH)

    # Step 3: Load Tracker Log
    tracker = FBTracker()
    logger.info(f"Loaded tracker. {tracker.summary()['total_uploaded']} video(s) already scheduled.")

    # Step 4: Process videos
    uploaded_count = 0
    skipped_count = 0
    failed_count = 0

    for idx, video_path in enumerate(video_files, start=1):
        filename = video_path.name
        print(f"\n[{idx}/{total}] 🎥 {filename}")

        # Skip duplicate uploads
        if tracker.is_uploaded(filename):
            logger.info(f"  ⏭  Already scheduled on Facebook. Skipping.")
            print(f"       ⏭  Skipped (already scheduled)")
            skipped_count += 1
            continue

        # Probe video details
        try:
            video_info = probe_video(video_path)
        except Exception as e:
            logger.error(f"  ❌  Failed probing file: {e}")
            print(f"       ❌  Error probing video: {e}")
            failed_count += 1
            continue

        # Fetch CSV metadata
        meta = get_video_metadata(filename, metadata_map, is_short=video_info.is_short)

        # Parse schedule date and time
        publish_timestamp = get_schedule_timestamp(meta.publish_date, meta.publish_time)

        # If --now is set, clear the timestamp to publish immediately
        if getattr(args, "now", False):
            publish_timestamp = None
            logger.info("  --now flag: overriding schedule to publish immediately.")

        # Build full description containing title, website link, and tags
        description_lines = [
            meta.title,
            "",
            meta.description
        ]
        description = "\n".join(description_lines)

        # Print/log video specifications
        log_time = datetime.fromtimestamp(publish_timestamp).strftime('%Y-%m-%d %H:%M:%S') if publish_timestamp else "Immediate"
        logger.info(
            f"  Title     : {meta.title}\n"
            f"  Dimensions: {video_info.width}x{video_info.height}\n"
            f"  Scheduled : {log_time} (Unix: {publish_timestamp})\n"
            f"  Auto-gen  : {meta.is_auto_generated}"
        )

        if args.dry_run:
            print(f"       📋  Title    : {meta.title}")
            print(f"       📐  Size     : {video_info.width}x{video_info.height}")
            print(f"       ⏱   Duration : {video_info.duration_seconds:.1f}s")
            print(f"       📅  Schedule : {log_time}")
            continue

        # Perform actual upload
        try:
            video_id = upload_facebook_reel(video_path, description, publish_timestamp)
        except Exception as e:
            logger.error(f"  ❌  Unexpected upload error: {e}", exc_info=True)
            print(f"       ❌  Unexpected upload error: {e}")
            failed_count += 1
            continue

        if video_id:
            # Mark upload in tracker file
            tracker.mark_uploaded(
                filename=filename,
                video_id=video_id,
                title=meta.title,
                scheduled_at=meta.scheduled_at_iso,
            )
            print(f"       ✅  Scheduled on Facebook! ID: {video_id}")
            uploaded_count += 1
        else:
            logger.error(f"  ❌  Upload failed.")
            print(f"       ❌  Upload failed.")
            failed_count += 1

    # Print Summary
    print()
    print("=" * 60)
    print("  📊  Upload Summary (Facebook)")
    print("=" * 60)
    print(f"  Total found  : {total}")
    print(f"  ✅ Scheduled : {uploaded_count}")
    print(f"  ⏭  Skipped   : {skipped_count}")
    print(f"  ❌ Failed    : {failed_count}")
    print(f"  📂 Videos dir: {Config.VIDEOS_DIR}")
    print(f"  📝 Log file  : {Config.LOG_FILE}")
    print("=" * 60)
    print()

    logger.info(
        f"Execution done. Scheduled={uploaded_count}, Skipped={skipped_count}, Failed={failed_count}"
    )


if __name__ == "__main__":
    main()
