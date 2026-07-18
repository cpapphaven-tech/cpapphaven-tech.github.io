import os
from pathlib import Path
from dotenv import load_dotenv

# Load environmental variables from .env if present
load_dotenv()

class Config:
    """Manages application configurations using environment variables with safe defaults."""
    
    # Root paths relative to uploader package
    APP_ROOT = Path(__file__).resolve().parent.parent

    # Local Directory Settings
    VIDEOS_DIR = Path(os.getenv("VIDEOS_DIR", APP_ROOT.parent / "videos")).resolve()
    CSV_PATH = Path(os.getenv("CSV_PATH", APP_ROOT.parent / "videos.csv")).resolve()
    TRACKER_FILE = Path(os.getenv("TRACKER_FILE", APP_ROOT / "uploaded.json")).resolve()
    LOG_FILE = Path(os.getenv("LOG_FILE", APP_ROOT / "logs" / "upload.log")).resolve()

    # Google Console Credentials
    CLIENT_SECRETS_FILE = Path(os.getenv("CLIENT_SECRETS_FILE", APP_ROOT / "client_secrets.json")).resolve()
    TOKEN_FILE = Path(os.getenv("TOKEN_FILE", APP_ROOT / "token.json")).resolve()

    # YouTube Upload Constants
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE_MB", "5")) * 1024 * 1024  # Convert MB to bytes
    MAX_RETRIES = int(os.getenv("MAX_RETRIES", "5"))

    # Fallback Metadata Settings
    WEBSITE_URL = os.getenv("WEBSITE_URL", "https://playmixgames.in")
    DEFAULT_HASHTAGS = os.getenv("DEFAULT_HASHTAGS", "#shorts #gaming #minigames #playmix")
    DEFAULT_PRIVACY_STATUS = os.getenv("DEFAULT_PRIVACY_STATUS", "private")

    @classmethod
    def validate_paths(cls) -> None:
        """Pre-creates output directories (logs, videos) if missing."""
        cls.LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        cls.TRACKER_FILE.parent.mkdir(parents=True, exist_ok=True)
        # Ensure videos directory exists (where we read videos from)
        cls.VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
