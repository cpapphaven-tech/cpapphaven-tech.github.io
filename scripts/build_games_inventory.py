#!/usr/bin/env python3
"""
PlayMix Game Inventory Builder
Builds data/games.json from verified playable games in the PlayMix repository.
Ensures every URL points to a real entry file on disk.
"""

import os
import sys
import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

NON_GAME_DIRS = {
    'scripts', 'assets', 'blog', 'icons', 'img', 'leads', 'licenses',
    'logs', 'output', 'prope', 'temp_videos', 'videos', 'youtube_uploader',
    'facebook_uploader', 'gameorbit', 'GuidesCommon', 'NewsCommon', 'NewsHub',
    'ReelsCommon', 'TravelHub', 'WeatherApp', 'WeatherCommon', 'WeatherMap',
    'game-factory', '.git', '.github', 'scratch', 'TrendingGames', 'data'
}

# Explicit image mappings for high-res thumbnails in img/
EXPLICIT_IMAGES = {
    'SnakesAndLadders': 'img/snakelad600.png',
    'NeonSnake': 'img/snake600.png',
    'CrossyRoad': 'img/crossroad600.png',
    'NeonSlicer': 'img/ninja600.png',
    'SubwayRunner': 'img/image600.png',
    'Tetris': 'img/Tetris600.png',
    'Game2048': 'img/Mergenumber600.png',
    'MergeNumbers': 'img/Mergenumber600.png',
    'BubbleShooter': 'img/buublefinal.png',
    'Chess': 'img/chess600.png',
    'Sudoku': 'img/Sudoku600.png',
    'Pool': 'img/pool600.png',
    'Bowling': 'img/Bowling600.png',
    'ArcheryMaster': 'img/Archery600.png',
    'Tennis': 'img/Tennis600.png',
    'Stack3D': 'img/Stack600.png',
    'AirHockey3D': 'img/airhockey600.png',
    'BlockPuzzle': 'img/blockpuzzle600.png',
    'BottleShoot3D': 'img/bootle600.png',
    'BrickBreaker': 'img/brickbreaker600.png',
    'Football3D': 'img/football600.png',
    'HeadFootball': 'img/Headfootball600.png',
    'VolleyballArena': 'img/volley600.png',
    'WaterSort3D': 'img/WaterSort600.png',
    'WatermelonDrop': 'img/fruits600.png',
    'FruitSplash': 'img/fruits600.png',
    'HelixBounce': 'img/helix600.png',
    'Ludo': 'img/ludo600.png',
    'NeonPacman': 'img/pacman600.png',
    'PocketGolf': 'img/pocketgolf600.png',
    'TypingSpeedTest': 'img/typingtest600.png',
    'WordCrossword': 'img/wordcrossword600.png',
    'WordSearch': 'img/wordsrarch200.png',
    'DoodleJump': 'img/doodlejump600.png',
    'FlappyRise': 'img/flappy600.png',
    'NumberBalloonShooter': 'img/numberballoon600.png',
    'RetroRacer': 'img/carrace600.png',
    'HighwayRush': 'img/carrace600.png',
    'Crossmath': 'img/crossmath600.png',
    'EnglishGrammarQuiz': 'img/enggrammer600.png',
    'FitnessReels': 'img/fitnessreels600.png',
    'FootballReels': 'img/footballreels600.png',
    'KnowledgeReels': 'img/knowledgereels600.png',
    'HealthHeroTrivia': 'img/healthhero600.png',
}

# Curated search synonyms and trend keywords for top game archetypes
KEYWORD_SEEDS = {
    'SnakesAndLadders': ['snake game', 'snakes and ladders', 'snake online', 'snakes & ladders', 'board game snake', 'chutes and ladders', 'snake ladder online', 'classic board game'],
    'NeonSnake': ['snake game', 'neon snake', 'classic snake', 'snake io', 'retro snake', 'snake game online', 'snake arcade'],
    'SubwayRunner': ['subway runner', 'subway runner 3d', 'subway surfer game', 'train runner', 'endless runner 3d', 'running game online', 'subway surf online'],
    'Tetris': ['tetris', 'tetris game', 'tetris online', 'classic tetris', 'block puzzle', 'falling blocks', 'brick puzzle game', 'tetris free'],
    'Game2048': ['2048', '2048 game', '2048 online', 'number merge', 'math puzzle', '2048 puzzle game', 'sliding tile game'],
    'MergeNumbers': ['merge numbers', 'number merge game', '2048 merge', 'math puzzle game', 'merge tiles', 'numbers game'],
    'BubbleShooter': ['bubble shooter', 'bubble shooter game', 'bubble pop', 'bubble blast', 'bubble match 3', 'bubble shooter online', 'bubble game'],
    'Chess': ['chess', 'chess game', 'chess online', 'play chess free', 'chess against computer', 'board game chess', 'chess multiplayer'],
    'Sudoku': ['sudoku', 'sudoku game', 'sudoku online', 'daily sudoku', 'number puzzle sudoku', 'sudoku brain game', 'easy sudoku'],
    'Pool': ['pool', '8 ball pool', 'billiards', 'pool game', '8 ball pool online', 'billiards game', 'pool 3d online'],
    'Football3D': ['football game', 'football 3d', 'penalty shootout', 'soccer game online', 'football game online', 'free soccer game', 'penalty kick game'],
    'HeadFootball': ['head football', 'soccer heads', 'football head game', 'head soccer online', 'fun football game'],
    'CrossyRoad': ['crossy road', 'crossy road online', 'road crossing game', 'chicken road game', 'endless hopper', 'cross the road'],
    'NeonSlicer': ['ninja slice', 'balloon ninja slice', 'fruit ninja style', 'knife slice', 'balloon slice', 'slicer game online', 'blade reflex'],
    'Solitaire': ['solitaire', 'solitaire game', 'solitaire online', 'classic solitaire', 'klondike solitaire', 'free solitaire card game', 'card games online'],
    'BlockPuzzle': ['block puzzle', 'block puzzle game', 'wood block puzzle', 'grid puzzle', 'block blast game', 'tetris block puzzle'],
    'WaterSort3D': ['water sort', 'water sort puzzle', 'color sort puzzle', 'liquid sort', 'tube sort online', 'water sort 3d'],
    'RetroRacer': ['car racing game', 'car game', 'racing games online', 'drag racer', 'speed racing game', 'retro racing game'],
    'HighwayRush': ['highway rush', 'highway racing', 'traffic racer', 'car rush 3d', 'highway driver game', 'traffic dodge'],
    'Bowling': ['bowling', 'bowling game', '3d bowling', 'bowling strike', 'bowling online free', 'ten pin bowling'],
    'TableTennis': ['table tennis', 'ping pong', 'ping pong game', 'table tennis online', 'ping pong 3d', 'paddle game'],
    'WordGuess': ['wordle', 'word guess', '5 letter word game', 'word puzzle', 'word guessing game', 'wordle free online'],
    'WordCrossword': ['crossword', 'crossword puzzle', 'daily crossword', 'word crossword', 'crossword puzzle online', 'mini crossword'],
    'WordSearch': ['word search', 'word find', 'word search puzzle', 'word search online', 'hidden word game'],
    'Checkers': ['checkers', 'draughts', 'checkers online', 'play checkers free', 'classic checkers board game'],
    'ConnectFour': ['connect four', 'connect 4', 'four in a row', 'connect four online', '4 in a row game'],
    'Ludo': ['ludo', 'ludo game', 'ludo online', 'play ludo free', 'ludo board game', 'parcheesi online'],
    'NeonPacman': ['pacman', 'pac-man', 'pacman online', 'pacman retro game', 'maze runner arcade', 'classic pacman'],
    'DinoRun': ['dino run', 'chrome dino', 'dinosaur runner', 't-rex runner', 'dino jump game', 'google dino game'],
    'SlopeGame': ['slope game', 'slope 3d', 'slope ball game', 'slope unblocked', 'speed slope 3d', 'rolling ball 3d'],
    'PianoTiles': ['piano tiles', 'magic tiles', 'piano rhythm game', 'music tiles online', 'piano keys game'],
    'ArcheryMaster': ['archery', 'archery game', 'bow and arrow game', 'target shooting', 'archery 3d online'],
    'Basketball3D': ['basketball', 'basketball game', 'basketball 3d', 'hoop shooter', 'basketball shootout online'],
    'CricketMaster': ['cricket game', 'cricket 3d', 't20 cricket online', 'batting cricket game', 'cricket simulator'],
    'WatermelonDrop': ['suika game', 'watermelon drop', 'fruit merge game', 'watermelon game online', 'suika drop'],
    'CandyBlast': ['candy crush style', 'match 3 game', 'candy blast', 'jewel match 3', 'candy puzzle online'],
    'Minesweeper': ['minesweeper', 'classic minesweeper', 'minesweeper online', 'retro minesweeper free'],
    'Hangman': ['hangman', 'hangman game', 'classic hangman', 'guess the word hangman', 'word hangman free'],
    'Stack3D': ['stack 3d', 'tower builder', 'block stacker', 'stacking game online', 'tower stack 3d'],
    'AirHockey3D': ['air hockey', 'air hockey 3d', 'table air hockey', 'air hockey online free'],
    'BottleShoot3D': ['bottle shoot', 'bottle shooting game', 'target shooter 3d', 'bottle break game'],
    'BrickBreaker': ['brick breaker', 'breakout game', 'arkanoid style', 'brick smash online'],
    'VolleyballArena': ['volleyball', 'volleyball game', 'beach volleyball 3d', 'volleyball arena online'],
    'TicTacToe': ['tic tac toe', 'noughts and crosses', 'tic tac toe online', 'xo game free'],
    'TypingSpeedTest': ['typing speed test', 'typing game', 'wpm test online', 'fast typing practice'],
    'DancingLine': ['dancing line', 'line runner', 'music line game', 'tap rhythm runner'],
    'KnifeHit': ['knife hit', 'knife throw game', 'blade throw', 'target knife hit'],
    'FourColors': ['four colors', 'uno card game', 'uno online free', 'colors card game', 'matching card game']
}

def clean_game_name(raw_name, folder):
    if not raw_name:
        return folder
    # Clean common suffixes like " - Microscopic Hexa Puzzle!" or " | Play Online"
    cleaned = re.sub(r'\s*[\-|–]\s*(?:Free|Play|Online|Puzzle|Classic|Microscopic|Sweet|Sparkling|Brain).*$', '', raw_name, flags=re.I)
    cleaned = re.sub(r'\s*\(.*?\)', '', cleaned)
    cleaned = re.sub(r'Game Online.*$', '', cleaned, flags=re.I)
    cleaned = cleaned.strip()
    return cleaned if len(cleaned) >= 3 else folder

def build_inventory():
    print(f"Scanning repository for games: {REPO_ROOT}")
    
    # 1. Load registry
    reg_path = REPO_ROOT / 'game-factory' / 'game-registry.json'
    reg_games = {}
    if reg_path.exists():
        try:
            with open(reg_path, 'r', encoding='utf-8') as f:
                reg_games = json.load(f).get('games', {})
        except Exception as e:
            print(f"Warning: could not read game-registry.json: {e}")

    # 2. Load games-data.js for friendly metadata
    games_data_path = REPO_ROOT / 'games-data.js'
    featured_map = {}
    section_map = {}
    if games_data_path.exists():
        content = games_data_path.read_text(encoding='utf-8')
        feat_matches = re.findall(
            r'\{\s*name:\s*[\"\']([^\"\']+)[\"\'],\s*tag:\s*[\"\']([^\"\']*)[\"\'],\s*desc:\s*[\"\']([^\"\']*)[\"\'],\s*href:\s*[\"\']([^\"\']+)[\"\'](?:,\s*gradient:\s*[\"\']([^\"\']*)[\"\'])?(?:,\s*icon:\s*[\"\']([^\"\']*)[\"\'])?(?:,\s*badge:\s*[\"\']([^\"\']*)[\"\'])?(?:,\s*image:\s*[\"\']([^\"\']*)[\"\'])?',
            content
        )
        for m in feat_matches:
            folder = m[3].split('/')[0]
            featured_map[folder] = {
                'name': m[0], 'tag': m[1], 'desc': m[2],
                'gradient': m[4] if len(m) > 4 else '',
                'emoji': m[5] if len(m) > 5 else '',
                'badge': m[6] if len(m) > 6 else '',
                'image': m[7] if len(m) > 7 else ''
            }

        sec_matches = re.findall(
            r'\{\s*name:\s*[\"\']([^\"\']+)[\"\'],\s*genre:\s*[\"\']([^\"\']*)[\"\'],\s*icon:\s*[\"\']([^\"\']*)[\"\'],\s*href:\s*[\"\']([^\"\']+)[\"\'](?:,\s*badge:\s*[\"\']([^\"\']*)[\"\'])?(?:,\s*emoji:\s*[\"\']([^\"\']*)[\"\'])?',
            content
        )
        for m in sec_matches:
            folder = m[3].split('/')[0]
            section_map[folder] = {
                'name': m[0], 'genre': m[1],
                'badge': m[4] if len(m) > 4 else '',
                'emoji': m[5] if len(m) > 5 else ''
            }

    # 3. Discover all valid playable game folders in root
    inventory = []
    for d in sorted(REPO_ROOT.iterdir()):
        if not d.is_dir() or d.name.startswith('.') or d.name in NON_GAME_DIRS:
            continue

        folder = d.name
        idx = d / 'index.html'
        gm = d / 'game.html'
        
        if not idx.exists() and not gm.exists():
            continue

        entry_point = "index.html" if idx.exists() else "game.html"
        
        # Verify file actually exists on disk
        entry_file = d / entry_point
        assert entry_file.exists(), f"File {entry_file} does not exist!"

        # Determine clean name
        reg_info = reg_games.get(folder, {})
        feat_info = featured_map.get(folder, {})
        sec_info = section_map.get(folder, {})

        display_name = (
            feat_info.get('name') or
            sec_info.get('name') or
            reg_info.get('name') or
            folder
        )
        clean_name = clean_game_name(display_name, folder)

        # Slug
        slug = re.sub(r'[^a-z0-9]+', '-', clean_name.lower()).strip('-')

        # Category & Genre
        category = reg_info.get('category', 'action').lower()
        genre = sec_info.get('genre') or category.capitalize()
        categories = list(set([category, genre.lower()]))

        # Emoji & Gradient
        emoji = feat_info.get('emoji') or sec_info.get('emoji') or '🎮'
        gradient = feat_info.get('gradient') or 'linear-gradient(135deg, #1c1c1e, #2c2c2e)'
        badge = feat_info.get('badge') or sec_info.get('badge') or 'hot'

        # Image selection: prioritize explicit images verified to exist
        image_path = ""
        if folder in EXPLICIT_IMAGES and (REPO_ROOT / EXPLICIT_IMAGES[folder]).exists():
            image_path = EXPLICIT_IMAGES[folder]
        elif feat_info.get('image') and (REPO_ROOT / feat_info['image']).exists():
            image_path = feat_info['image']

        # Description
        description = (
            feat_info.get('desc') or
            reg_info.get('description') or
            f"Play {clean_name} free online in your browser on PlayMix. Instant play, no download required."
        )

        # Keywords list: seed keywords + variants + category
        keywords = set(KEYWORD_SEEDS.get(folder, []))
        keywords.add(clean_name.lower())
        keywords.add(f"{clean_name.lower()} online")
        keywords.add(f"{clean_name.lower()} game")
        keywords.add(f"play {clean_name.lower()}")
        keywords.add(category)
        if 'mechanics' in reg_info and isinstance(reg_info['mechanics'], list):
            for m in reg_info['mechanics'][:4]:
                keywords.add(m.replace('-', ' '))

        play_cta = f"Play {clean_name} Online"

        inventory.append({
            "id": slug,
            "name": clean_name,
            "folder": folder,
            "entry": entry_point,
            "url": f"https://playmixgames.in/{folder}/{entry_point}",
            "relative_url": f"/{folder}/{entry_point}",
            "categories": sorted(list(categories)),
            "genre": genre,
            "keywords": sorted(list(keywords)),
            "image": image_path,
            "emoji": emoji,
            "gradient": gradient,
            "badge": badge,
            "description": description,
            "play_cta": play_cta
        })

    # Sort inventory by name
    inventory.sort(key=lambda x: x['name'])

    out_file = REPO_ROOT / 'data' / 'games.json'
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(inventory, f, indent=2, ensure_ascii=False)

    print(f"✅ Successfully compiled {len(inventory)} verified PlayMix games to {out_file}")
    return inventory

if __name__ == '__main__':
    build_inventory()
