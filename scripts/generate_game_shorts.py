import os
import re
import sys
import time
import random
import argparse
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
from playwright.sync_api import sync_playwright

# Configuration
DEFAULT_PORT = 8123
WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(WORKSPACE_DIR, "videos")
TEMP_DIR = os.path.join(WORKSPACE_DIR, "temp_videos")

# Ensure output directories exist
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# 1. Multi-threaded local HTTP server
class SilentHTTPRequestHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass # Suppress server logging to keep terminal output clean

def start_server(port):
    server = HTTPServer(('127.0.0.1', port), SilentHTTPRequestHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server

# 2. Parse games from games-data.js
def parse_games():
    js_path = os.path.join(WORKSPACE_DIR, "games-data.js")
    if not os.path.exists(js_path):
        print(f"Error: games-data.js not found at {js_path}")
        sys.exit(1)
        
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Extract blocks matching {...}
    blocks = re.findall(r'\{[^{}]*\}', content)
    games = []
    seen_hrefs = set()
    
    for block in blocks:
        name_match = re.search(r'name:\s*["\']([^"\']+)["\']', block)
        href_match = re.search(r'href:\s*["\']([^"\']+)["\']', block)
        emoji_match = re.search(r'emoji:\s*["\']([^"\']+)["\']', block)
        
        if name_match and href_match:
            name = name_match.group(1).strip()
            href = href_match.group(1).strip()
            # Default emojis if none are listed in the block
            emoji = emoji_match.group(1).strip() if emoji_match else "🎮"
            
            # De-duplicate by relative href
            if href not in seen_hrefs:
                seen_hrefs.add(href)
                games.append({
                    "name": name,
                    "href": href,
                    "emoji": emoji
                })
                
    return games

# 3. Inject vertical YouTube Shorts banners into page
def inject_banners(page, game):
    js_code = """
    (function() {
        // Clean existing video banners if re-injected
        const existingTop = document.getElementById('yt-top-banner');
        const existingBottom = document.getElementById('yt-bottom-banner');
        if (existingTop) existingTop.remove();
        if (existingBottom) existingBottom.remove();

        // Ensure Outfit/Inter font is loaded for nice styling
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&family=Inter:wght@600;700&display=swap';
        document.head.appendChild(link);

        // 1. Create Top Header banner
        const topBanner = document.createElement('div');
        topBanner.id = 'yt-top-banner';
        topBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 95px;
            background: linear-gradient(180deg, rgba(8, 9, 17, 0.98) 0%, rgba(8, 9, 17, 0.88) 100%);
            border-bottom: 3px solid #00f2fe;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 2147483647;
            font-family: 'Outfit', 'Inter', sans-serif;
            box-shadow: 0 6px 25px rgba(0, 242, 254, 0.3);
            color: white;
            box-sizing: border-box;
            padding: 0 10px;
        `;
        topBanner.innerHTML = `
            <div style="font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 10px rgba(0, 242, 254, 0.2); text-align: center;">
                __GAME_EMOJI__ __GAME_NAME__ __GAME_EMOJI__
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #8892b0; margin-top: 5px; letter-spacing: 2px;">
                PLAY FREE ONLINE GAME
            </div>
        `;
        document.body.appendChild(topBanner);

        // 2. Create Bottom Footer banner
        const bottomBanner = document.createElement('div');
        bottomBanner.id = 'yt-bottom-banner';
        bottomBanner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 110px;
            background: linear-gradient(0deg, rgba(8, 9, 17, 0.98) 0%, rgba(8, 9, 17, 0.88) 100%);
            border-top: 3px solid #ef4444;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 2147483647;
            font-family: 'Outfit', 'Inter', sans-serif;
            box-shadow: 0 -6px 25px rgba(239, 68, 68, 0.25);
            color: white;
            box-sizing: border-box;
            padding: 0 10px;
        `;
        bottomBanner.innerHTML = `
            <div style="font-size: 12px; font-weight: 800; color: #ef4444; letter-spacing: 1.5px; margin-bottom: 8px; animation: yt-pulse 1.4s infinite ease-in-out;">
                👇 PLAY INSTANTLY ON MOBILE & PC 👇
            </div>
            <div style="font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #fff; text-shadow: 0 0 8px rgba(255,255,255,0.2);">
                PLAYMIXGAMES.IN
            </div>
        `;
        
        // Add pulse animation stylesheet
        const style = document.createElement('style');
        style.textContent = `
            @keyframes yt-pulse {
                0% { transform: scale(1); opacity: 0.9; }
                50% { transform: scale(1.04); opacity: 1; }
                100% { transform: scale(1); opacity: 0.9; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(bottomBanner);
    })();
    """
    # Replace variables in the template string
    js_code = js_code.replace("__GAME_EMOJI__", game['emoji'])
    js_code = js_code.replace("__GAME_NAME__", game['name'].upper())
    
    try:
        page.evaluate(js_code)
    except Exception as e:
        print(f"Warning: Banner injection failed: {e}")

# 4. Playwright recording engine
def record_gameplay(game, port, duration=15):
    safe_name = re.sub(r'[^a-zA-Z0-9]', '_', game['name'])
    temp_webm = os.path.join(TEMP_DIR, f"{safe_name}_temp.webm")
    
    print(f"🎬 Starting recording for '{game['name']}'...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use mobile settings with 9:16 layout
        context = browser.new_context(
            viewport={"width": 450, "height": 800},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            is_mobile=True,
            has_touch=True,
            record_video_dir=TEMP_DIR,
            record_video_size={"width": 450, "height": 800}
        )
        
        page = context.new_page()
        url = f"http://localhost:{port}/{game['href']}"
        page.goto(url)
        
        # Wait for the loading wrapper to disappear or a few seconds
        time.sleep(3.5)
        
        # Inject our custom top/bottom overlays
        inject_banners(page, game)
        
        # Simulating interactions
        start_time = time.time()
        
        # First click center-bottom to bypass potential start splash buttons
        page.mouse.click(225, 450)
        time.sleep(0.8)
        page.mouse.click(225, 520)
        time.sleep(0.8)
        
        while time.time() - start_time < duration:
            # Inject banners again in case page navigates internally
            inject_banners(page, game)
            
            # Interactive bounds (keep click inside gameplay zone, avoiding header/footer overlays)
            x = random.randint(30, 420)
            y = random.randint(120, 660)
            action = random.choice(["tap", "swipe", "idle"])
            
            if action == "tap":
                page.mouse.click(x, y)
            elif action == "swipe":
                x2 = random.randint(30, 420)
                y2 = random.randint(120, 660)
                page.mouse.move(x, y)
                page.mouse.down()
                page.mouse.move(x2, y2, steps=8)
                page.mouse.up()
            else:
                time.sleep(0.4)
                
            time.sleep(random.uniform(0.3, 0.7))
            
        video_path = page.video.path()
        context.close()
        browser.close()
        
        # Move the video to our custom temp filename
        if os.path.exists(video_path):
            if os.path.exists(temp_webm):
                os.remove(temp_webm)
            os.rename(video_path, temp_webm)
            return temp_webm
        else:
            return None

# 5. Post-process video with FFmpeg into high-quality vertical MP4
def process_video(webm_path, game_name):
    if not webm_path or not os.path.exists(webm_path):
        print(f"Error: WebM file not found for processing: {webm_path}")
        return False
        
    safe_name = re.sub(r'[^a-zA-Z0-9]', '_', game_name)
    final_mp4 = os.path.join(OUTPUT_DIR, f"{safe_name}_short.mp4")
    
    print(f"⚙️ Processing '{game_name}' via FFmpeg...")
    
    # FFmpeg args: Convert WebM to MP4, upscale to 1080x1920 vertical, and compile
    cmd = [
        "ffmpeg", "-y",
        "-i", webm_path,
        "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black",
        "-c:v", "libx264",
        "-profile:v", "high",
        "-level", "4.0",
        "-crf", "20",
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        final_mp4
    ]
    
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Delete temporary webm
        os.remove(webm_path)
        print(f"✅ Created: {final_mp4}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ FFmpeg processing failed for '{game_name}': {e}")
        return False

# Main Workflow
if __name__ == "__main__":
    # Change current working directory to project root
    os.chdir(WORKSPACE_DIR)
    
    parser = argparse.ArgumentParser(description="Generate YouTube Shorts videos for PlayMix games.")
    parser.add_argument("--test", type=str, help="Name of a single game to test the pipeline (e.g. 'Knife Hit' or 'Minesweeper')")
    parser.add_argument("--limit", type=int, help="Limit the number of games to process")
    args = parser.parse_args()
    
    # 1. Parse games from data registry
    games = parse_games()
    print(f"🔍 Discovered {len(games)} unique games from games-data.js")
    
    if args.test:
        filtered_games = [g for g in games if args.test.lower() in g['name'].lower()]
        if not filtered_games:
            print(f"Error: Game matching '{args.test}' not found.")
            sys.exit(1)
        games = filtered_games
        print(f"🧪 Running in TEST mode. Selected game: '{games[0]['name']}'")
    elif args.limit:
        games = games[:args.limit]
        print(f"🔢 Limited processing to first {args.limit} games.")
        
    # 2. Start HTTP server
    server = start_server(DEFAULT_PORT)
    print(f"📡 Local server started at http://localhost:{DEFAULT_PORT}")
    
    try:
        success_count = 0
        for idx, game in enumerate(games):
            print(f"\n[{idx+1}/{len(games)}] Processing game: {game['name']}")
            try:
                webm_path = record_gameplay(game, DEFAULT_PORT)
                if webm_path:
                    if process_video(webm_path, game['name']):
                        success_count += 1
                else:
                    print(f"❌ Failed to record video for '{game['name']}'")
            except Exception as e:
                print(f"❌ Error processing '{game['name']}': {e}")
                
        print(f"\n🎉 Generation complete! Successfully generated {success_count}/{len(games)} videos.")
        print(f"📂 Output videos are located in: {OUTPUT_DIR}")
        
    finally:
        # Shutdown server
        server.shutdown()
        print("🔌 Local server shut down.")
