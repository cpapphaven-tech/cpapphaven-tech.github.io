#!/usr/bin/env python3
"""
PlayMix Pinterest Automation Tool
================================
Generates 1000x1500 vertical Pinterest Pin images, titles, keyword-rich descriptions,
hashtags, board assignments, and bulk upload manifests (CSV + JSON) for PlayMix games.

Usage:
  python scripts/generate_pinterest_pins.py [options]

Options:
  --limit N          Limit processing to N games
  --pins-per-game N  Number of pins per game (default: 3, max: 5)
  --game GAMENAME    Process only a specific game folder name
  --output-dir PATH  Output directory (default: output/pinterest_pins)
"""

import os
import sys
import re
import csv
import json
import math
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

# Workspace paths
WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_URL = "https://playmixgames.in"
DEFAULT_OUTPUT_DIR = os.path.join(WORKSPACE_DIR, "output", "pinterest_pins")

# Fonts configuration with fallbacks
FONT_PATHS = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Trebuchet MS.ttf",
    "/System/Library/Fonts/Supplemental/Impact.ttf",
    "/System/Library/Fonts/SFNS.ttf",
]

def load_font(size, bold=False, title_style=False):
    """Load a truetype font with fallback to PIL default."""
    if title_style and os.path.exists("/System/Library/Fonts/Supplemental/Impact.ttf"):
        try:
            return ImageFont.truetype("/System/Library/Fonts/Supplemental/Impact.ttf", size)
        except Exception:
            pass
            
    for font_path in FONT_PATHS:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except Exception:
                continue
    return ImageFont.load_default()

# Pinterest Boards Definition
BOARDS = {
    "Puzzle Games": {
        "description": "Fun and challenging puzzle games you can play free online directly in your browser.",
        "hashtags": ["#PuzzleGames", "#BrowserGames", "#OnlineGames", "#PlayMix", "#FreeGames", "#LogicPuzzles"],
        "keywords": ["puzzle", "sort", "match", "block", "splash", "jigsaw", "hole", "merge"]
    },
    "Hidden Object Games": {
        "description": "Find hidden items, words, and clues in free browser hidden object and search games.",
        "hashtags": ["#HiddenObjectGames", "#WordGames", "#BrowserGames", "#OnlineGames", "#PlayMix", "#SearchGames"],
        "keywords": ["hidden", "search", "word", "crossword", "object", "odd"]
    },
    "Brain Games": {
        "description": "Train your brain and test your IQ with daily math, logic, sudoku, and memory games.",
        "hashtags": ["#BrainGames", "#MathGames", "#Sudoku", "#LogicPuzzles", "#MindGames", "#PlayMix"],
        "keywords": ["math", "sudoku", "num", "crossmath", "equator", "numpuz", "minesweeper", "quiz", "typing"]
    },
    "Relaxing Games": {
        "description": "Relax, unwind, and de-stress with peaceful color sorting, bouncing, and casual browser games.",
        "hashtags": ["#RelaxingGames", "#CasualGames", "#AntiStress", "#BrowserGames", "#PlayMix", "#FunGames"],
        "keywords": ["zen", "color", "connect", "dot", "solitaire", "bubble", "tracing", "coloring", "pancake", "ice"]
    },
    "Family Games": {
        "description": "Classic board games and family-friendly casual games to play together for free.",
        "hashtags": ["#FamilyGames", "#BoardGames", "#ClassicGames", "#Ludo", "#Chess", "#PlayMix"],
        "keywords": ["ludo", "chess", "snake", "tic", "family", "kids", "pet", "trivia", "balloon"]
    },
    "Free Browser Games": {
        "description": "Action-packed arcade, sports, racing, and skill games you can play with zero downloads.",
        "hashtags": ["#BrowserGames", "#ArcadeGames", "#FreeGames", "#OnlineGames", "#PlayMix", "#ActionGames"],
        "keywords": ["dash", "hit", "ninja", "rush", "crossy", "galaxy", "flappy", "jump", "pool", "cricket", "football", "tennis", "bowling", "hockey", "racer", "bottle", "archery"]
    }
}

# Color Gradients for Pin Backgrounds (Top, Middle, Bottom)
GRADIENTS = [
    # Dark Violet & Cyan
    ((15, 23, 42), (88, 28, 135), (6, 182, 212)),
    # Ocean Teal & Blue
    ((15, 23, 42), (13, 148, 136), (56, 189, 248)),
    # Sunset Flame
    ((24, 9, 38), (194, 65, 12), (251, 146, 60)),
    # Emerald Neon
    ((6, 44, 32), (16, 185, 129), (52, 211, 153)),
    # Royal Magenta & Pink
    ((30, 10, 60), (192, 38, 211), (244, 114, 182)),
    # Midnight Indigo & Amber
    ((17, 24, 39), (79, 70, 229), (245, 158, 11)),
]


def parse_games_data():
    """Parse game definitions from games-data.js and inspect directory structures."""
    js_path = os.path.join(WORKSPACE_DIR, "games-data.js")
    games_dict = {}

    if os.path.exists(js_path):
        with open(js_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Find object blocks in games-data.js
        blocks = re.findall(r"\{[^{}]*name:[^{}]*href:[^{}]*\}", content, re.DOTALL)
        for b in blocks:
            nm = re.search(r"name:\s*[\"']([^\"']+)[\"']", b)
            hr = re.search(r"href:\s*[\"']([^\"']+)[\"']", b)
            ic = re.search(r"icon:\s*[\"']([^\"']*)[\"']", b)
            gn = re.search(r"genre:\s*[\"']([^\"']+)[\"']", b)
            ds = re.search(r"desc:\s*[\"']([^\"']+)[\"']", b)
            
            if nm and hr:
                name = nm.group(1).strip()
                href = hr.group(1).strip()
                icon = ic.group(1).strip() if ic else ""
                genre = gn.group(1).strip() if gn else "Casual"
                desc = ds.group(1).strip() if ds else ""
                
                folder = href.split("/")[0] if "/" in href else href
                if folder not in games_dict:
                    games_dict[folder] = {
                        "name": name,
                        "href": href,
                        "folder": folder,
                        "icon": icon,
                        "genre": genre,
                        "desc": desc
                    }

    # Also scan candidate directories in workspace if missing
    for d in os.listdir(WORKSPACE_DIR):
        full_d = os.path.join(WORKSPACE_DIR, d)
        if os.path.isdir(full_d) and not d.startswith(".") and not d.startswith("_"):
            if d not in ["assets", "img", "icons", "blog", "leads", "licenses", "logs", "prope", "scripts", "temp_videos", "videos", "output", "facebook_uploader", "youtube_uploader", "GuidesCommon", "NewsCommon", "ReelsCommon", "WeatherCommon", ".venv"]:
                has_index = os.path.exists(os.path.join(full_d, "index.html")) or os.path.exists(os.path.join(full_d, "game.html"))
                if has_index and d not in games_dict:
                    clean_name = re.sub(r"([a-z])([A-Z])", r"\1 \2", d)
                    games_dict[d] = {
                        "name": clean_name,
                        "href": f"{d}/index.html" if os.path.exists(os.path.join(full_d, "index.html")) else f"{d}/game.html",
                        "folder": d,
                        "icon": "",
                        "genre": "Casual",
                        "desc": f"Play {clean_name} online free in your browser."
                    }

    return list(games_dict.values())


def assign_board(game):
    """Determine the best Pinterest board for a game based on name, genre, and keywords."""
    text = (game["name"] + " " + game["genre"] + " " + game["folder"]).lower()
    
    for board_name, data in BOARDS.items():
        for kw in data["keywords"]:
            if kw in text:
                return board_name
                
    # Default matching based on genre
    genre = game["genre"].lower()
    if "puzzle" in genre or "match" in genre:
        return "Puzzle Games"
    elif "math" in genre or "logic" in genre or "word" in genre:
        return "Brain Games"
    elif "board" in genre or "classic" in genre or "kids" in genre:
        return "Family Games"
    elif "action" in genre or "arcade" in genre or "sports" in genre or "racing" in genre:
        return "Free Browser Games"
        
    return "Free Browser Games"


def find_game_image(game):
    """Find the highest quality available image for a game."""
    folder = game["folder"]
    icon_path = game["icon"]

    # 1. Specified icon in games-data.js
    if icon_path:
        full_p = os.path.join(WORKSPACE_DIR, icon_path)
        if os.path.exists(full_p):
            return full_p

    # 2. Check img/ folder for 600 or 200 or exact match
    img_dir = os.path.join(WORKSPACE_DIR, "img")
    candidates = [
        os.path.join(img_dir, f"{folder}600.png"),
        os.path.join(img_dir, f"{folder.lower()}600.png"),
        os.path.join(img_dir, f"{folder}200.png"),
        os.path.join(img_dir, f"{folder}.png"),
        os.path.join(img_dir, f"{folder.lower()}.png")
    ]
    for c in candidates:
        if os.path.exists(c):
            return c

    # 3. Check inside game directory
    game_dir = os.path.join(WORKSPACE_DIR, folder)
    if os.path.exists(game_dir):
        for img_name in ["icon.png", "thumbnail.png", "logo.png", "preview.png", "cover.png"]:
            p = os.path.join(game_dir, img_name)
            if os.path.exists(p):
                return p
        # Check any png inside game folder
        pngs = [f for f in os.listdir(game_dir) if f.endswith(".png") and not f.startswith(".")]
        if pngs:
            return os.path.join(game_dir, pngs[0])

    # 4. Fallback to PlayMix logo or icon
    fallback_icon = os.path.join(WORKSPACE_DIR, "icons", "icon-512x512.png")
    if os.path.exists(fallback_icon):
        return fallback_icon
        
    return os.path.join(WORKSPACE_DIR, "img", "playmix600.png")


def generate_pin_copies(game, board_name):
    """Generate 5 distinct Pin title, description, and hashtag variations."""
    name = game["name"]
    desc = game["desc"] if game["desc"] else f"Play {name} free in your browser."
    board_hashtags = BOARDS[board_name]["hashtags"]
    
    # Specific hashtag for the game name
    game_hashtag = "#" + re.sub(r"[^a-zA-Z0-9]", "", name)
    all_hashtags = [game_hashtag] + board_hashtags[:4]
    hashtag_str = " ".join(all_hashtags)

    copies = [
        # Pin 1: Direct Play Hook
        {
            "hook_type": "Direct Play",
            "title": f"Play {name} Online Free",
            "description": f"Play {name} online free in your browser. {desc} No download or registration required! {hashtag_str}",
            "cta": "PLAY FREE NOW ➔",
            "badge": "100% FREE BROWSER GAME"
        },
        # Pin 2: Challenge Hook
        {
            "hook_type": "Challenge",
            "title": f"Can You Master {name}?",
            "description": f"Test your skills with {name}! {desc} Can you solve every level and get the high score? Play free on PlayMix now. {hashtag_str}",
            "cta": "TAKE THE CHALLENGE ➔",
            "badge": "BRAIN & SKILL TEST"
        },
        # Pin 3: Relaxation / Fun Hook
        {
            "hook_type": "Relaxation",
            "title": f"Relax With {name}",
            "description": f"Unwind and have fun with {name} online. {desc} Perfect for a quick gaming break anytime! {hashtag_str}",
            "cta": "PLAY & RELAX NOW ➔",
            "badge": "FUN & ADDICTIVE"
        },
        # Pin 4: No Download Hook
        {
            "hook_type": "Instant Play",
            "title": "No Download Needed!",
            "description": f"Play {name} instantly in your browser with zero installs or waiting. {desc} Free online gaming on PlayMix. {hashtag_str}",
            "cta": "START PLAYING INSTANTLY ➔",
            "badge": "INSTANT BROWSER PLAY"
        },
        # Pin 5: Strategy / High Score Hook
        {
            "hook_type": "Strategy",
            "title": f"Best {name} Strategy & Tips",
            "description": f"Discover top strategies and beat your high scores in {name}. {desc} Play free online on PlayMix today. {hashtag_str}",
            "cta": "SEE STRATEGY & PLAY ➔",
            "badge": "TOP GAME GUIDE"
        }
    ]
    return copies


def draw_vertical_gradient(width, height, colors):
    """Draw a smooth 3-point vertical gradient background image."""
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)
    
    c1, c2, c3 = colors
    mid = height // 2
    
    for y in range(height):
        if y < mid:
            ratio = y / mid
            r = int(c1[0] + (c2[0] - c1[0]) * ratio)
            g = int(c1[1] + (c2[1] - c1[1]) * ratio)
            b = int(c1[2] + (c2[2] - c1[2]) * ratio)
        else:
            ratio = (y - mid) / (height - mid)
            r = int(c2[0] + (c3[0] - c2[0]) * ratio)
            g = int(c2[1] + (c3[1] - c2[1]) * ratio)
            b = int(c3[2] + (c3[2] - c2[2]) * ratio)
            
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    return img


def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    """Draw a rounded rectangle using PIL ImageDraw."""
    x1, y1, x2, y2 = bbox
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill, outline=outline, width=width)


def render_pin_image(game, pin_copy, pin_index, output_path):
    """Render a high-resolution 1000x1500 px vertical Pin image."""
    W, H = 1000, 1500
    
    # Pick a gradient based on game name & pin_index
    grad_idx = (hash(game["name"]) + pin_index) % len(GRADIENTS)
    bg_img = draw_vertical_gradient(W, H, GRADIENTS[grad_idx])
    
    draw = ImageDraw.Draw(bg_img)
    
    # 1. Overlay subtle dark vignette overlay for depth
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    ov_draw.rectangle([0, 0, W, 140], fill=(0, 0, 0, 100))
    ov_draw.rectangle([0, H - 160, W, H], fill=(0, 0, 0, 120))
    bg_img = Image.alpha_composite(bg_img.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(bg_img)

    # 2. Header Branding (PlayMix Logo & Domain Tag)
    header_y = 60
    logo_file = os.path.join(WORKSPACE_DIR, "img", "playmix600.png")
    if not os.path.exists(logo_file):
        logo_file = os.path.join(WORKSPACE_DIR, "icons", "icon-512x512.png")
        
    if os.path.exists(logo_file):
        try:
            logo_img = Image.open(logo_file).convert("RGBA")
            logo_img.thumbnail((70, 70), Image.Resampling.LANCZOS)
            bg_img.paste(logo_img, (70, header_y), logo_img)
        except Exception:
            pass

    font_brand = load_font(38, bold=True)
    draw.text((155, header_y + 8), "PLAYMIX", font=font_brand, fill=(255, 255, 255, 255))
    
    font_domain = load_font(24)
    draw.text((325, header_y + 20), "•  playmixgames.in", font=font_domain, fill=(200, 220, 255, 220))

    # Badge Pill (Top Right Header)
    font_badge = load_font(20, bold=True)
    badge_text = pin_copy["badge"]
    badge_w = font_badge.getlength(badge_text) if hasattr(font_badge, 'getlength') else 200
    badge_rect = [W - 90 - badge_w, header_y + 10, W - 60, header_y + 50]
    draw_rounded_rect(draw, badge_rect, radius=20, fill=(255, 255, 255, 40), outline=(255, 255, 255, 120), width=2)
    draw.text((badge_rect[0] + 15, badge_rect[1] + 8), badge_text, font=font_badge, fill=(255, 255, 255, 240))

    # 3. Central Glassmorphism Card housing Game Artwork
    card_margin = 80
    card_top = 180
    card_bottom = 980
    card_w = W - 2 * card_margin
    card_h = card_bottom - card_top

    # Glass Card Background Layer
    card_bg = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card_bg)
    draw_rounded_rect(card_draw, [0, 0, card_w, card_h], radius=32, fill=(15, 23, 42, 160), outline=(255, 255, 255, 80), width=3)
    bg_img.paste(card_bg, (card_margin, card_top), card_bg)

    # Render Game Thumbnail inside Card
    game_img_path = find_game_image(game)
    if os.path.exists(game_img_path):
        try:
            g_img = Image.open(game_img_path).convert("RGBA")
            # Square thumbnail aspect
            thumb_size = 460
            g_img = g_img.resize((thumb_size, thumb_size), Image.Resampling.LANCZOS)
            
            # Rounded corner mask for thumbnail
            mask = Image.new("L", (thumb_size, thumb_size), 0)
            mask_draw = ImageDraw.Draw(mask)
            mask_draw.rounded_rectangle([0, 0, thumb_size, thumb_size], radius=28, fill=255)
            
            thumb_x = card_margin + (card_w - thumb_size) // 2
            thumb_y = card_top + 45
            
            # Thumbnail Shadow
            shadow = Image.new("RGBA", (thumb_size + 20, thumb_size + 20), (0, 0, 0, 0))
            sh_draw = ImageDraw.Draw(shadow)
            sh_draw.rounded_rectangle([10, 10, thumb_size + 10, thumb_size + 10], radius=28, fill=(0, 0, 0, 180))
            shadow = shadow.filter(ImageFilter.GaussianBlur(15))
            bg_img.paste(shadow, (thumb_x - 10, thumb_y - 5), shadow)

            bg_img.paste(g_img, (thumb_x, thumb_y), mask)
            draw = ImageDraw.Draw(bg_img)
            
            # Thumbnail Border Frame
            draw_rounded_rect(draw, [thumb_x, thumb_y, thumb_x + thumb_size, thumb_y + thumb_size], radius=28, outline=(255, 255, 255, 140), width=3)
        except Exception as e:
            print(f"Warning: Could not process game image {game_img_path}: {e}")

    # 4. Main Pin Title Text Rendering
    title_text = pin_copy["title"]
    font_title = load_font(58, bold=True, title_style=True)
    
    # Text Wrapping
    words = title_text.split()
    lines = []
    curr_line = ""
    for w in words:
        test_line = f"{curr_line} {w}".strip()
        w_len = font_title.getlength(test_line) if hasattr(font_title, 'getlength') else len(test_line) * 28
        if w_len <= card_w - 60:
            curr_line = test_line
        else:
            lines.append(curr_line)
            curr_line = w
    if curr_line:
        lines.append(curr_line)

    title_y = card_top + 535
    for line in lines:
        line_w = font_title.getlength(line) if hasattr(font_title, 'getlength') else len(line) * 28
        tx = card_margin + (card_w - line_w) // 2
        
        # Text Drop Shadow
        draw.text((tx + 3, title_y + 3), line, font=font_title, fill=(0, 0, 0, 200))
        # Text Main Fill
        draw.text((tx, title_y), line, font=font_title, fill=(255, 255, 255, 255))
        title_y += 68

    # Game Subtitle Pill
    font_sub = load_font(26, bold=True)
    sub_text = f"{game['name']}  •  {game['genre']} Game"
    sub_w = font_sub.getlength(sub_text) if hasattr(font_sub, 'getlength') else len(sub_text) * 14
    sub_rect = [card_margin + (card_w - sub_w - 40) // 2, card_bottom - 75, card_margin + (card_w + sub_w + 40) // 2, card_bottom - 25]
    draw_rounded_rect(draw, sub_rect, radius=20, fill=(255, 255, 255, 30), outline=(255, 255, 255, 80), width=1)
    draw.text((sub_rect[0] + 20, sub_rect[1] + 10), sub_text, font=font_sub, fill=(220, 235, 255, 255))

    # 5. Bottom Call-To-Action (CTA) Button
    cta_text = pin_copy["cta"]
    cta_y = 1040
    cta_h = 100
    cta_w = W - 2 * 120
    cta_x = 120

    # CTA Button Shadow
    cta_shadow = Image.new("RGBA", (cta_w + 30, cta_h + 30), (0, 0, 0, 0))
    csh_draw = ImageDraw.Draw(cta_shadow)
    csh_draw.rounded_rectangle([15, 15, cta_w + 15, cta_h + 15], radius=50, fill=(0, 0, 0, 160))
    cta_shadow = cta_shadow.filter(ImageFilter.GaussianBlur(12))
    bg_img.paste(cta_shadow, (cta_x - 15, cta_y - 5), cta_shadow)

    # CTA Pill Fill (Vibrant Yellow Accent)
    cta_rect = [cta_x, cta_y, cta_x + cta_w, cta_y + cta_h]
    draw_rounded_rect(draw, cta_rect, radius=50, fill=(234, 179, 8, 255), outline=(255, 255, 255, 220), width=4)

    font_cta = load_font(36, bold=True)
    cta_text_w = font_cta.getlength(cta_text) if hasattr(font_cta, 'getlength') else len(cta_text) * 20
    cx = cta_x + (cta_w - cta_text_w) // 2
    cy = cta_y + (cta_h - 40) // 2
    
    # CTA Text Shadow & Text
    draw.text((cx + 2, cy + 2), cta_text, font=font_cta, fill=(15, 23, 42, 120))
    draw.text((cx, cy), cta_text, font=font_cta, fill=(15, 23, 42, 255))

    # 6. Bottom Footer Tagline
    font_foot = load_font(24)
    foot_text = "Free Online Browser Games  •  No Installation Required"
    foot_w = font_foot.getlength(foot_text) if hasattr(font_foot, 'getlength') else len(foot_text) * 12
    fx = (W - foot_w) // 2
    draw.text((fx, H - 90), foot_text, font=font_foot, fill=(255, 255, 255, 210))

    # Save output image
    bg_img.convert("RGB").save(output_path, "PNG", quality=95)


def main():
    parser = argparse.ArgumentParser(description="PlayMix Pinterest Automation Tool")
    parser.add_argument("--limit", type=int, default=None, help="Limit processing to N games")
    parser.add_argument("--pins-per-game", type=int, default=3, choices=[1, 2, 3, 4, 5], help="Number of pins per game (1-5)")
    parser.add_argument("--game", type=str, default=None, help="Process specific game folder name")
    parser.add_argument("--output-dir", type=str, default=DEFAULT_OUTPUT_DIR, help="Output folder path")
    args = parser.parse_args()

    # Create output structure
    output_dir = args.output_dir
    images_dir = os.path.join(output_dir, "images")
    os.makedirs(images_dir, exist_ok=True)

    print("🚀 Starting PlayMix Pinterest Automation Tool...")
    games = parse_games_data()
    print(f"📦 Total PlayMix games discovered: {len(games)}")

    if args.game:
        games = [g for g in games if g["folder"].lower() == args.game.lower()]
        if not games:
            print(f"❌ Game '{args.game}' not found.")
            sys.exit(1)

    if args.limit:
        games = games[:args.limit]
        print(f"🔍 Limiting run to {len(games)} games")

    csv_records = []
    json_records = []
    total_pins_generated = 0

    for idx, game in enumerate(games, start=1):
        board = assign_board(game)
        game_url = f"{BASE_URL}/{game['folder']}/"
        pin_copies = generate_pin_copies(game, board)[:args.pins_per_game]

        print(f"[{idx}/{len(games)}] 🎨 Processing '{game['name']}' ({game['folder']}) -> Board: '{board}'")

        game_pins = []
        for p_idx, pin_copy in enumerate(pin_copies, start=1):
            img_filename = f"{game['folder']}_pin_{p_idx}.png"
            img_path = os.path.join(images_dir, img_filename)
            rel_img_path = os.path.relpath(img_path, output_dir)

            # Render 1000x1500 Image
            render_pin_image(game, pin_copy, p_idx, img_path)
            total_pins_generated += 1

            record = {
                "Game Name": game["name"],
                "Game Folder": game["folder"],
                "Title": pin_copy["title"],
                "Description": pin_copy["description"],
                "Destination Link": game_url,
                "Board": board,
                "Media Path": img_path,
                "Media File": rel_img_path,
                "Hook Type": pin_copy["hook_type"],
                "CTA": pin_copy["cta"]
            }
            csv_records.append(record)
            game_pins.append(record)

        json_records.append({
            "game_name": game["name"],
            "game_folder": game["folder"],
            "board": board,
            "url": game_url,
            "pins": game_pins
        })

    # Save Bulk Upload CSV
    csv_path = os.path.join(output_dir, "pinterest_bulk_upload.csv")
    csv_headers = ["Title", "Description", "Destination Link", "Board", "Media File", "Media Path", "Game Name", "Hook Type"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_headers, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(csv_records)

    # Save JSON Manifest
    json_path = os.path.join(output_dir, "pinterest_manifest.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "total_games": len(games),
            "total_pins": total_pins_generated,
            "base_url": BASE_URL,
            "games": json_records
        }, f, indent=2)

    print("\n✅ Generation Complete!")
    print(f"📊 Summary:")
    print(f"   • Total Games Processed: {len(games)}")
    print(f"   • Total Pins Generated: {total_pins_generated}")
    print(f"   • Images Output: {images_dir}")
    print(f"   • CSV Bulk Manifest: {csv_path}")
    print(f"   • JSON Manifest: {json_path}")

if __name__ == "__main__":
    main()
