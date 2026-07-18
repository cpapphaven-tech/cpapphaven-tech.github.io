import os
import sys
import logging
from typing import Any
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build, Resource
from .config import Config

logger = logging.getLogger(__name__)

# Scope required for uploading and managing videos on YouTube
SCOPES = ["https://www.googleapis.com/auth/youtube"]

def get_youtube_service() -> Resource:
    """
    Authenticates the user using OAuth 2.0 and builds the YouTube API client service.
    Caches token in token.json to avoid repeating browser authentication.
    """
    creds = None

    # Try to load cached token credentials
    if Config.TOKEN_FILE.exists():
        logger.info("Loading cached OAuth token from token.json")
        try:
            creds = Credentials.from_authorized_user_file(str(Config.TOKEN_FILE), SCOPES)
        except Exception as e:
            logger.warning(f"Failed to parse cached credentials: {e}. Clean restart initiated.")
            creds = None

    # If no valid credentials found, run authentication flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            logger.info("Credentials expired. Attempting automatic token refresh.")
            try:
                creds.refresh(Request())
            except Exception as e:
                logger.error(f"Auto-refresh failed: {e}. Initiating full user login.")
                creds = None

        # Full browser-based authentication flow if refresh fails or no token
        if not creds:
            if not Config.CLIENT_SECRETS_FILE.exists():
                logger.critical(
                    f"Google API client_secrets.json not found at {Config.CLIENT_SECRETS_FILE}. "
                    "Please download it from Google Cloud Console."
                )
                print("\n=======================================================")
                print(f"ERROR: missing secret configuration file!")
                print(f"Please download your OAuth client secret from Google Console")
                print(f"and save it as: {Config.CLIENT_SECRETS_FILE}")
                print("=======================================================\n")
                sys.exit(1)

            logger.info("Starting browser OAuth flow...")
            flow = InstalledAppFlow.from_client_secrets_file(
                str(Config.CLIENT_SECRETS_FILE), SCOPES
            )
            # Starts local server for redirect URI authentication
            creds = flow.run_local_server(port=0)

        # Cache credentials for next run
        logger.info("Caching new credentials to token.json")
        with open(Config.TOKEN_FILE, "w", encoding="utf-8") as f:
            f.write(creds.to_json())

    # Build the YouTube Data API v3 client service
    logger.info("Initializing YouTube Data API client.")
    return build("youtube", "v3", credentials=creds)
