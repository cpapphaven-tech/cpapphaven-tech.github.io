# 📺 PlayMix Games — YouTube Video Uploader

A production-quality, multi-module Python 3.12 application that automatically uploads PlayMix Games gameplay videos to YouTube using the YouTube Data API v3.

Features:
- ✅ OAuth 2.0 authentication (authorize once, reuse forever via token cache)
- ✅ Auto-generates SEO-friendly titles, descriptions, and hashtags when CSV metadata is missing
- ✅ Detects YouTube Shorts automatically (vertical + under 60 seconds)
- ✅ Schedules uploads via `publishAt` if a date/time is in the CSV
- ✅ Skips already-uploaded videos using `uploaded.json` tracker
- ✅ Chunked upload with live `tqdm` progress bars
- ✅ Exponential-backoff retry on transient network/HTTP errors
- ✅ Dual logging: clean terminal output + verbose `logs/upload.log`
- ✅ Environment-variable configuration with `.env` support

---

## 📁 Project Structure

```
youtube_uploader/
├── main.py                  ← Entry point / orchestration
├── requirements.txt
├── .env.example             ← Copy to .env and fill in your values
├── client_secrets.json      ← Download from Google Cloud Console (see below)
├── token.json               ← Auto-generated on first auth (do NOT commit)
├── uploaded.json            ← Auto-generated upload tracker (do NOT delete)
├── logs/
│   └── upload.log           ← Verbose file logs
└── uploader/
    ├── __init__.py
    ├── config.py            ← Configuration loader (env vars + defaults)
    ├── auth.py              ← OAuth 2.0 flow and YouTube API service builder
    ├── tracker.py           ← Duplicate-upload tracker (uploaded.json)
    ├── video_utils.py       ← ffprobe metadata extractor
    ├── csv_reader.py        ← CSV parser + auto-generator
    └── youtube.py           ← YouTube Data API v3 uploader with retry logic
```

---

## 🚀 Quick Setup

### 1. Prerequisites

```bash
# Python 3.12+
python3 --version

# ffmpeg/ffprobe (required for video analysis)
ffmpeg -version
```

Install dependencies:

```bash
cd youtube_uploader
pip install -r requirements.txt
```

---

### 2. Google Cloud Console Setup

> You need a Google account. This app uses `cpapphaven@gmail.com`.

**Step 1: Create or select a Google Cloud project**
1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project** → give it a name (e.g., `PlayMix Uploader`).

**Step 2: Enable the YouTube Data API v3**
1. In the left sidebar, go to **APIs & Services** → **Library**.
2. Search for `YouTube Data API v3` → Click **Enable**.

**Step 3: Create OAuth 2.0 Credentials**
1. Go to **APIs & Services** → **Credentials**.
2. Click **+ Create Credentials** → **OAuth client ID**.
3. If prompted, click **Configure Consent Screen** first:
   - Select **External** → **Create**.
   - Fill in App name (`PlayMix Uploader`), User support email (`cpapphaven@gmail.com`), Developer email (`cpapphaven@gmail.com`).
   - Under **Scopes**, add `https://www.googleapis.com/auth/youtube.upload`.
   - Under **Test users**, add `cpapphaven@gmail.com`.
   - Click **Save and Continue** until done.
4. Back in Credentials → **+ Create Credentials** → **OAuth client ID**.
5. Application type: **Desktop app** → Name it → **Create**.
6. Click **Download JSON** on the modal that appears.
7. Rename the downloaded file to `client_secrets.json`.
8. Move it into the `youtube_uploader/` folder.

> ⚠️ **Never commit `client_secrets.json` or `token.json` to Git!** Add them to `.gitignore`.

---

### 3. Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Edit `.env` as needed. The defaults work out-of-the-box if your folder structure matches.

Key variables:

| Variable | Default | Description |
|---|---|---|
| `VIDEOS_DIR` | `../videos` | Path to your MP4 files |
| `CSV_PATH` | `../videos.csv` | Path to your metadata CSV |
| `TRACKER_FILE` | `uploaded.json` | Tracks already-uploaded videos |
| `CLIENT_SECRETS_FILE` | `client_secrets.json` | OAuth client secret from Google |
| `CHUNK_SIZE_MB` | `5` | Upload chunk size (MB) |
| `MAX_RETRIES` | `5` | Max retry attempts on failure |

---

### 4. Prepare `videos.csv` (Optional)

Place a `videos.csv` file in the **parent folder** (e.g., `Playmix/videos.csv`).

The CSV must have these column headers:

```
filename,title,description,tags,publish_date,publish_time,privacy_status
```

Example row:

```csv
filename,title,description,tags,publish_date,publish_time,privacy_status
Knife_Hit_short.mp4,Play Knife Hit Free! 🎯 #Shorts,"Play Knife Hit and 80+ games at https://playmixgames.in","Knife Hit,gaming,Shorts",2025-09-01,10:00,private
```

> 💡 **Any video not in the CSV will have its title, description, and tags auto-generated** based on the filename. You never need to write a CSV at all!

**Column Details:**
| Column | Required | Notes |
|---|---|---|
| `filename` | Yes | Must exactly match the MP4 filename |
| `title` | No | Auto-generated if blank |
| `description` | No | Auto-generated if blank |
| `tags` | No | Comma-separated. Auto-generated if blank |
| `publish_date` | No | Format: `YYYY-MM-DD` |
| `publish_time` | No | Format: `HH:MM` (24h) |
| `privacy_status` | No | `private`, `public`, or `unlisted` |

---

### 5. First-Time Authentication

Run the uploader once. A browser window will open automatically:

```bash
cd youtube_uploader
python main.py --limit 1
```

1. The browser opens the Google OAuth consent screen.
2. Sign in with `cpapphaven@gmail.com`.
3. Grant permissions to upload videos.
4. The browser shows "Authentication successful".
5. `token.json` is saved automatically for all future runs.

---

### 6. Upload All Videos

**Preview (dry run — no uploads happen):**
```bash
python main.py --dry-run
```

**Upload all videos:**
```bash
python main.py
```

**Upload first 5 videos only (testing):**
```bash
python main.py --limit 5
```

---

## 📅 Scheduling Videos

To schedule a video for a future date/time, set `publish_date` and `publish_time` in the CSV:

```csv
filename,title,description,tags,publish_date,publish_time,privacy_status
Sudoku_Daily_short.mp4,Play Sudoku Daily Free! 🧩 #Shorts,"https://playmixgames.in","Sudoku,gaming,Shorts",2025-08-15,09:00,private
```

> ⚠️ **YouTube requirement**: scheduled videos must have `privacy_status=private`. The script automatically overrides other privacy settings to `private` when a schedule is detected.

---

## 🔁 Re-running Safely

The script checks `uploaded.json` before every upload. If a video filename is already in the tracker, it will be **skipped entirely**. This means you can:
- Re-run after a crash to pick up where you left off.
- Add new videos to the `videos/` folder and re-run — only new files get uploaded.

---

## 🔍 Monitoring Logs

```bash
# Live tail of the log file
tail -f logs/upload.log

# Check uploaded tracker
cat uploaded.json | python3 -m json.tool
```

---

## 🎬 YouTube Shorts Detection

A video is automatically classified as a **YouTube Short** if:
- **Duration is under 60 seconds**, AND
- **Height > Width** (vertical/portrait orientation)

When detected, the script:
1. Appends `#Shorts` to the video title (required for YouTube's Shorts algorithm).
2. Adds `Shorts` and `YouTubeShorts` to the tags list.

---

## ⚠️ Important Notes

- **YouTube API quota**: The free YouTube Data API v3 quota is 10,000 units/day. Each video upload costs 1,600 units, so you can upload approximately **6 videos per day** on the free tier. Consider applying for higher quota in Google Cloud Console for bulk uploads.
- **Token security**: `token.json` and `client_secrets.json` contain sensitive credentials. Add both to `.gitignore`.
- **First login only**: After the first successful OAuth flow, all subsequent runs use the cached token silently.

---

## 🤝 Support

For issues, open an issue or contact: **cpapphaven@gmail.com**
