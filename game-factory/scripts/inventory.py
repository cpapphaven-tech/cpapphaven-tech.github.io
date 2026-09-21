#!/usr/bin/env python3
"""
PlayMix Game Inventory Scanner
Crawls the PlayMix repository, inspects all game folders, extracts metadata,
controls, mechanics, and signatures, and generates game-factory/game-registry.json.
"""

import os
import re
import json
import hashlib
from pathlib import Path

NON_GAME_DIRS = {
    'scripts', 'assets', 'blog', 'icons', 'img', 'leads', 'licenses',
    'logs', 'output', 'prope', 'temp_videos', 'videos', 'youtube_uploader',
    'facebook_uploader', 'gameorbit', 'GuidesCommon', 'NewsCommon', 'NewsHub',
    'ReelsCommon', 'TravelHub', 'WeatherApp', 'WeatherCommon', 'WeatherMap',
    'game-factory', '.git', '.github', 'scratch'
}

MECHANIC_KEYWORDS = {
    'lane-runner': ['lane', 'speed', 'subway', 'dodge', 'train', 'highway', 'traffic'],
    'platform-jump': ['jump', 'platform', 'doodle', 'rise', 'fall', 'gravity'],
    'physics-merge': ['merge', 'drop', 'suika', 'watermelon', 'circle', 'bounce'],
    'sliding-tile': ['2048', 'tile', 'slide', 'grid', 'numpuz'],
    'falling-blocks': ['tetris', 'block', 'line clear', 'matrix'],
    'match-3': ['match', 'swap', 'candy', 'gem', 'fruit splash'],
    'card-game': ['card', 'deck', 'suit', 'four colors', 'solitaire', 'uno'],
    'board-strategy': ['chess', 'checkers', 'ludo', 'connect four', 'turn', 'board', 'pawn'],
    'word-puzzle': ['word', 'letter', 'guess', 'crossword', 'search', 'hangman'],
    'rhythm-timing': ['piano', 'tile', 'rhythm', 'beat', 'tempo', 'note'],
    'reaction-tap': ['tap', 'mole', 'slice', 'ninja', 'whack', 'reflex', 'color switch'],
    'aim-shoot': ['shoot', 'bubble', 'cannon', 'knife', 'target', 'archery', 'galaxy', 'bottle'],
    'tube-sort': ['sort', 'water sort', 'ball sort', 'tube', 'pour', 'liquid'],
    'sports-sim': ['football', 'basketball', 'pool', 'tennis', 'hockey', 'bowling', 'cricket', 'golf'],
    'idle-clicker': ['clicker', 'cookie', 'idle', 'cps', 'upgrade', 'bakery']
}

def extract_meta_content(html, name_or_prop):
    match = re.search(r'<meta\s+[^>]*(?:name|property)=["\']' + re.escape(name_or_prop) + r'["\'][^>]*content=["\']([^"\']*)["\']', html, re.I)
    if not match:
        match = re.search(r'<meta\s+[^>]*content=["\']([^"\']*)["\'][^>]*(?:name|property)=["\']' + re.escape(name_or_prop) + r'["\']', html, re.I)
    return match.group(1).strip() if match else None

def extract_title(html):
    match = re.search(r'<title>([^<]+)</title>', html, re.I)
    if match:
        title = match.group(1).strip()
        # Clean title suffix
        title = re.sub(r'\s*\|\s*PlayMix.*$', '', title, flags=re.I)
        title = re.sub(r'\s*-\s*Play.*$', '', title, flags=re.I)
        title = re.sub(r'\s*Free Online.*$', '', title, flags=re.I)
        return title.strip()
    return None

def detect_controls(code):
    controls = []
    code_lower = code.lower()
    if any(k in code_lower for k in ['touchstart', 'touchend', 'touchmove', 'pointerdown', 'pointerup', 'pointermove']):
        controls.append('touch')
    if any(k in code_lower for k in ['keydown', 'keyup', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'keycode']):
        controls.append('keyboard')
    if any(k in code_lower for k in ['mousedown', 'mouseup', 'mousemove', 'click']):
        controls.append('mouse')
    return controls or ['touch', 'mouse']

def detect_mechanics(text):
    text_lower = text.lower()
    detected = []
    for mechanic, keywords in MECHANIC_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            detected.append(mechanic)
    return detected or ['casual-arcade']

def generate_signature(category, mechanics, controls):
    mech_str = '-'.join(sorted(mechanics[:3]))
    ctrl_str = '-'.join(sorted(controls))
    raw = f"{category}:{mech_str}:{ctrl_str}"
    return hashlib.sha1(raw.encode('utf-8')).hexdigest()[:12]

def scan_repository(repo_root):
    games = {}
    repo_path = Path(repo_root)

    for entry in sorted(repo_path.iterdir()):
        if not entry.is_dir() or entry.name.startswith('.') or entry.name in NON_GAME_DIRS:
            continue

        folder_name = entry.name
        index_file = entry / 'index.html'
        game_html_file = entry / 'game.html'
        game_js_file = entry / 'game.js'

        if not index_file.exists() and not game_html_file.exists():
            continue

        html_content = ""
        js_content = ""
        entry_point = "index.html" if index_file.exists() else "game.html"

        if index_file.exists():
            try:
                html_content += index_file.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                pass

        if game_html_file.exists():
            try:
                html_content += "\n" + game_html_file.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                pass

        if game_js_file.exists():
            try:
                js_content = game_js_file.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                pass

        # Fallback: scan any .js in folder
        if not js_content:
            for js_f in entry.glob('*.js'):
                try:
                    js_content += "\n" + js_f.read_text(encoding='utf-8', errors='ignore')
                except Exception:
                    pass

        title = extract_title(html_content) or folder_name
        description = extract_meta_content(html_content, 'description') or f"Play {title} free online on PlayMix."
        keywords = extract_meta_content(html_content, 'keywords') or ""

        combined_text = f"{folder_name} {title} {description} {keywords} {js_content[:4000]}"
        mechanics = detect_mechanics(combined_text)
        controls = detect_controls(html_content + " " + js_content)

        # Categorize
        cat = 'arcade'
        if any(m in mechanics for m in ['card-game', 'board-strategy']):
            cat = 'board'
        elif any(m in mechanics for m in ['sliding-tile', 'falling-blocks', 'match-3', 'word-puzzle', 'tube-sort']):
            cat = 'puzzle'
        elif any(m in mechanics for m in ['sports-sim']):
            cat = 'sports'
        elif any(m in mechanics for m in ['physics-merge']):
            cat = 'physics'
        elif any(m in mechanics for m in ['lane-runner', 'aim-shoot', 'reaction-tap', 'platform-jump']):
            cat = 'action'

        slug = re.sub(r'[^a-z0-9]+', '-', folder_name.lower()).strip('-')
        signature = generate_signature(cat, mechanics, controls)

        games[folder_name] = {
            'name': title,
            'slug': slug,
            'folder': folder_name,
            'entry': entry_point,
            'category': cat,
            'mechanics': mechanics,
            'controls': controls,
            'signature': signature,
            'description': description
        }

    return games

def main():
    repo_root = Path(__file__).resolve().parent.parent.parent
    registry_path = repo_root / 'game-factory' / 'game-registry.json'

    print(f"Scanning repository for games: {repo_root}")
    inventory = scan_repository(repo_root)

    registry_path.parent.mkdir(parents=True, exist_ok=True)
    with open(registry_path, 'w', encoding='utf-8') as f:
        json.dump({
            'version': '1.0.0',
            'last_updated': str(Path(repo_root).stat().st_mtime),
            'total_games': len(inventory),
            'games': inventory
        }, f, indent=2)

    print(f"✅ Game inventory updated: {len(inventory)} games catalogued in {registry_path}")

if __name__ == '__main__':
    main()
