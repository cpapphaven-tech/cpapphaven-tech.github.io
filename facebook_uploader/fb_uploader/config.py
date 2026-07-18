import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the current directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Config:
    """Loads and validates Facebook reels uploader configurations."""

    FB_PAGE_ID = os.getenv("FB_PAGE_ID", "").strip()
    FB_PAGE_ACCESS_TOKEN = os.getenv("FB_PAGE_ACCESS_TOKEN", "").strip()

    # Paths (relative to the facebook_uploader workspace directory)
    VIDEOS_DIR = Path(os.getenv("VIDEOS_DIR", "../videos")).resolve()
    CSV_PATH = Path(os.getenv("CSV_PATH", "../videos.csv")).resolve()
    TRACKER_FILE = Path(os.getenv("TRACKER_FILE", "uploaded_fb.json")).resolve()
    LOG_FILE = Path(os.getenv("LOG_FILE", "logs/fb_upload.log")).resolve()

    # Upload configuration
    MAX_RETRIES = 5

    @classmethod
    def validate(cls) -> None:
        """
        Validates critical configuration keys. Exits application on failure.
        """
        errors = []
        if not cls.FB_PAGE_ID:
            errors.append("FB_PAGE_ID is missing or empty in .env.")
        if not cls.FB_PAGE_ACCESS_TOKEN:
            errors.append("FB_PAGE_ACCESS_TOKEN is missing or empty in .env.")

        if errors:
            print("\n=======================================================")
            print("❌ CONFIGURATION ERROR:")
            for err in errors:
                print(f"  - {err}")
            print("=======================================================\n")
            sys.exit(1)

        # Create logs directory if missing
        cls.LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
