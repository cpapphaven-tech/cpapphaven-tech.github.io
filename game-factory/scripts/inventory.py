#!/usr/bin/env python3
"""
PlayMix Game Inventory Scanner
Crawls the PlayMix repository, inspects all game folders, extracts metadata,
archetypes, gameplay loops, controls, mechanics, and signatures,
and generates game-factory/game-registry.json.
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
    'reaction-tap': ['tap', 'mole', 'slice', 'ninja', 'whack', 'reflex'],
    'aim-shoot': ['shoot', 'bubble', 'cannon', 'knife', 'target', 'archery', 'galaxy', 'bottle'],
    'tube-sort': ['sort', 'water sort', 'ball sort', 'tube', 'pour', 'liquid'],
    'sports-sim': ['football', 'basketball', 'pool', 'tennis', 'hockey', 'bowling', 'cricket', 'golf'],
    'idle-clicker': ['clicker', 'cookie', 'idle', 'cps', 'upgrade', 'bakery'],
    'color-switch': ['color switch', 'color bounce', 'color gate', 'color ring'],
    'maze-pathfinding': ['maze', 'labyrinth', 'fog of war', 'pathfinding'],
    'block-slicing': ['stack', 'tower', 'slice overhang'],
    'paddle-bounce': ['breakout', 'brick breaker', 'paddle', 'ball reflection']
}

ARCHETYPE_RULES = [
    ('color_switch', ['color-switch']),
    ('maze', ['maze-pathfinding']),
    ('stack', ['block-slicing']),
    ('breakout', ['paddle-bounce']),
    ('match3', ['match-3']),
    ('endless_runner', ['lane-runner']),
    ('physics_drop', ['physics-merge']),
    ('2048_merge', ['sliding-tile']),
    ('bubble_shooter', ['aim-shoot']),
    ('card_game', ['card-game']),
    ('board_strategy', ['board-strategy']),
    ('word_puzzle', ['word-puzzle']),
    ('sports_sim', ['sports-sim']),
    ('reaction', ['reaction-tap', 'rhythm-timing']),
    ('idle_clicker', ['idle-clicker']),
]

def extract_meta_content(html, name_or_prop):
    match = re.search(r'<meta\s+[^>]*(?:name|property)=["\']' + re.escape(name_or_prop) + r'["\'][^>]*content=["\']([^"\']*)["\']', html, re.I)
    if not match:
        match = re.search(r'<meta\s+[^>]*content=["\']([^"\']*)["\'][^>]*(?:name|property)=["\']' + re.escape(name_or_prop) + r'["\']', html, re.I)
    return match.group(1).strip() if match else None

def extract_title(html):
    match = re.search(r'<title>([^<]+)</title>', html, re.I)
    if match:
        title = match.group(1).strip()
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

def infer_archetype(folder_name, title, mechanics):
    combined = f"{folder_name} {title}".lower()

    if 'colorbounce' in combined or 'colorswitch' in combined:
        return 'color_switch'
    if 'neonmaze' in combined or 'maze' in combined:
        return 'maze'
    if 'towerstack' in combined or 'stack3d' in combined:
        return 'stack'
    if 'watermelondrop' in combined:
        return 'physics_drop'
    if 'subwayrunner' in combined or 'highwayrush' in combined:
        return 'endless_runner'
    if 'candyblast' in combined or 'fruitsplash' in combined:
        return 'match3'
    if 'game2048' in combined:
        return '2048_merge'
    if 'bubbleshooter' in combined:
        return 'bubble_shooter'
    if 'brickbreaker' in combined:
        return 'breakout'
    if 'whackamole' in combined:
        return 'whack_target'

    for arch, mechs in ARCHETYPE_RULES:
        if any(m in mechanics for m in mechs):
            return arch

    return 'arcade_casual'

def infer_gameplay_loop(archetype, mechanics):
    loops = {
        'color_switch': 'tap to bounce through rotating obstacles of matching color',
        'maze': 'navigate procedural labyrinth, collect crystals, and reach portal before time expires',
        'stack': 'tap to slice moving blocks and stack a tall tower without letting pieces fall',
        'breakout': 'reflect ball with paddle to destroy all bricks in the matrix',
        'match3': 'swap adjacent tiles to create lines of 3 or more matching colors',
        'endless_runner': 'switch lanes and jump over obstacles as speed increases',
        'physics_drop': 'drop and merge matching circle bodies to forge higher tier fruits or planets',
        '2048_merge': 'slide tiles in 4 directions to merge identical numbers towards 2048',
        'bubble_shooter': 'aim cannon and shoot colored bubbles to clear hanging clusters',
        'whack_target': 'tap popup targets while avoiding penalty traps before timer expires',
        'reaction': 'respond to rapidly flashing visual prompts within milliseconds',
        'card_game': 'play matching suit and number cards to clear hand vs opponents',
        'board_strategy': 'take tactical turns capturing opponent pieces on a board'
    }
    return loops.get(archetype, f"interact via {', '.join(mechanics[:2])} to achieve the highest score")

def generate_signature(archetype, mechanics, controls):
    mech_str = '-'.join(sorted(mechanics[:3]))
    ctrl_str = '-'.join(sorted(controls))
    return f"{archetype}:{mech_str}:{ctrl_str}"

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

        archetype = infer_archetype(folder_name, title, mechanics)
        gameplay_loop = infer_gameplay_loop(archetype, mechanics)
        signature = generate_signature(archetype, mechanics, controls)

        # Categorize
        cat = 'arcade'
        if archetype in ['card_game', 'board_strategy']:
            cat = 'board'
        elif archetype in ['match3', '2048_merge', 'word_puzzle', 'tube_sort', 'maze']:
            cat = 'puzzle'
        elif archetype in ['sports_sim']:
            cat = 'sports'
        elif archetype in ['physics_drop']:
            cat = 'physics'
        elif archetype in ['endless_runner', 'color_switch', 'stack', 'reaction', 'breakout']:
            cat = 'action'

        slug = re.sub(r'[^a-z0-9]+', '-', folder_name.lower()).strip('-')

        games[folder_name] = {
            'name': title,
            'slug': slug,
            'folder': folder_name,
            'entry': entry_point,
            'category': cat,
            'archetype': archetype,
            'mechanics': mechanics,
            'controls': controls,
            'gameplay_loop': gameplay_loop,
            'gameplay_signature': signature,
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
            'version': '2.0.0',
            'last_updated': str(Path(repo_root).stat().st_mtime),
            'total_games': len(inventory),
            'games': inventory
        }, f, indent=2)

    print(f"✅ Game inventory v2.0 updated: {len(inventory)} games catalogued with archetypes and signatures.")

if __name__ == '__main__':
    main()
