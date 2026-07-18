# 💙 PlayMix Games — Facebook Reels Scheduler

A production-quality Python 3.12 application that automatically uploads and schedules PlayMix gameplay preview videos to your Facebook Page as Reels using the Meta Graph API.

Features:
- ✅ Uses the official **Page Reels Publishing API**.
- ✅ Integrates a custom `tqdm` byte-streaming progress indicator.
- ✅ Schedules Reels sequentially based on `videos.csv` times (7:00 AM & 9:00 PM IST).
- ✅ Converts schedule times to local Unix timestamps.
- ✅ Prevents duplicates using `uploaded_fb.json` logging database.
- ✅ Features fully functional `--dry-run` and `--limit` command flags.
- ✅ Dual console-and-file logging.

---

## 📁 Project Structure

```
facebook_uploader/
├── main.py                  ← Orchestration script
├── requirements.txt
├── .env.example             ← Example configuration file
├── .env                     ← Credentials (do NOT commit)
├── uploaded_fb.json         ← Success logging tracker (do NOT delete)
└── fb_uploader/
    ├── __init__.py
    ├── config.py            ← Settings parser
    ├── tracker.py           ← Thread-safe progress database
    └── api.py               ← 3-step Reels upload client
```

---

## 🚀 Setup

### 1. Requirements

Install requirements (make sure you are in `facebook_uploader` folder):

```bash
cd facebook_uploader
pip install -r requirements.txt
```

Ensure `ffmpeg` and `ffprobe` are in system path (required for video dimension check).

---

### 2. Credentials Configuration

Create a `.env` file in the `facebook_uploader/` directory:

```ini
FB_PAGE_ID=1170260676175105
FB_PAGE_ACCESS_TOKEN=EAAcV9XBArZC8...
VIDEOS_DIR=../videos
CSV_PATH=../videos.csv
```

---

## 🛠️ Usage

### Dry Run (Preview Schedule)
Print the scheduling details for the next videos without making API calls:
```bash
python3 main.py --dry-run
```

### Limit Testing
Upload and schedule the first 2 videos to test end-to-end publishing:
```bash
python3 main.py --limit 2
```

### Full Run
Upload and schedule all remaining videos to your Facebook Page:
```bash
python3 main.py
```

---

## ⚠️ Notes on Facebook Reels Publishing API

1. **Scheduling Constraints**: Facebook requires scheduled publish times to be between **10 minutes and 75 days** in the future.
2. **API Access Tokens**: Page access tokens generated via Graph Explorer have a standard expiration of 60 days. Keep your token secure.
