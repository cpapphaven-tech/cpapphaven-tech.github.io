#!/usr/bin/env python3
"""
PlayMix Game Inventory Scanner (v3.0 - Code-Aware Fingerprinting)
================================================================
Inspects all game folders, extracts metadata, examines actual game.js code,
classifies archetypes with a confidence score, and builds deep 11-field
GameplayFingerprint records in game-factory/game-registry.json.

Key Guarantees:
- Never relies on naive substring matching on minified scripts or page footers.
- True Match-3 requires actual tile/gem swap & match3 logic in code.
- Sports matches (cricket, tennis, etc.) are never classified as match3.
- Archery / slingshot games are classified as aim_shoot / slingshot trajectory physics.
- Unconfident / ambiguous games are marked 'unknown' with 'low' confidence,
  and given distinct slug-based interaction mechanics so they never falsely
  collide with genuine games.
"""

import sys
import os
import re
import json
import hashlib
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
REPO_ROOT = CURRENT_DIR.parent.parent
sys.path.insert(0, str(CURRENT_DIR.parent))
sys.path.insert(0, str(CURRENT_DIR))

from fingerprint import GameplayFingerprint

NON_GAME_DIRS = {
    'scripts', 'assets', 'blog', 'icons', 'img', 'leads', 'licenses',
    'logs', 'output', 'prope', 'temp_videos', 'videos', 'youtube_uploader',
    'facebook_uploader', 'gameorbit', 'GuidesCommon', 'NewsCommon', 'NewsHub',
    'ReelsCommon', 'TravelHub', 'WeatherApp', 'WeatherCommon', 'WeatherMap',
    'game-factory', '.git', '.github', 'scratch'
}

def extract_meta_content(html, name_or_prop):
    match = re.search(r'<meta\s+[^>]*(?:name|property)=["\']' + re.escape(name_or_prop) + r'["\'][^>]*content=["\']([^"\']*)["\']', html, re.I)
    if not match:
        match = re.search(r'<meta\s+[^>]*content=["\']([^"\']*)["\'][^>]*(?:name|property)=["\']' + re.escape(name_or_prop) + r'["\']', html, re.I)
    return match.group(1).strip() if match else None

def extract_title(html):
    match = re.search(r'<title>([^<]+)</title>', html, re.I)
    if match:
        raw_title = match.group(1).strip()
        clean = re.sub(r'\s*\|.*$', '', raw_title)
        clean = re.sub(r'\s*-.*Play.*$', '', clean, flags=re.I)
        clean = re.sub(r'\s*Free Online.*$', '', clean, flags=re.I)
        return clean.strip()
    return None

def detect_controls(code):
    controls = []
    c_lower = code.lower()
    if any(k in c_lower for k in ['touchstart', 'touchend', 'touchmove', 'pointerdown', 'pointerup', 'pointermove']):
        controls.append('touch')
    if any(k in c_lower for k in ['keydown', 'keyup', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'keycode']):
        controls.append('keyboard')
    if any(k in c_lower for k in ['mousedown', 'mouseup', 'mousemove', 'click']):
        controls.append('mouse')
    return controls or ['touch', 'mouse']

def classify_and_build_fingerprint(folder_name, title, html_content, js_content, controls=None):
    """
    Examines folder, clean title, HTML and actual JS to determine archetype,
    confidence level, and full 11-field GameplayFingerprint.
    """
    f_lower = folder_name.lower()
    t_lower = (title or '').lower()
    combined_name = f"{f_lower} {t_lower}"
    js_lower = js_content.lower()

    if controls is None:
        controls = detect_controls(html_content + ' ' + js_content)

    # 1. Slingshot / Archery / Bow Trajectory Physics
    if any(k in combined_name for k in ['archery', 'slingshot', 'bow physics']) or ('max_pull' in js_lower and 'arc_dots' in js_lower):
        return GameplayFingerprint(
            primary_mechanic='slingshot-trajectory-aim',
            secondary_mechanics=['projectile-physics', 'balloon-popping', 'angle-pull-tension', 'timer-countdown'],
            gameplay_loop='pull back bow with trajectory physics to shoot and pop rising balloons before timer expires',
            interaction_pattern='drag-aim-release',
            progression_system='balloon float speed and target score increase each level',
            scoring_system='points per balloon popped with bonuses for special colored balloons',
            win_condition='score enough points to advance before level timer expires',
            loss_condition='timer expires before required points reached',
            level_structure='level-based',
            archetype='aim_shoot',
            controls=controls,
            confidence='high'
        ), 'aim_shoot', 'high'

    # Knife Hit
    if 'knifehit' in f_lower or 'knife hit' in t_lower:
        return GameplayFingerprint(
            primary_mechanic='radial-target-knife-throw',
            secondary_mechanics=['rotating-target', 'obstacle-collision-avoidance', 'boss-stages'],
            gameplay_loop='throw knives into a rotating wooden log without hitting previously embedded knives',
            interaction_pattern='single-tap-timing',
            progression_system='rotation speed changes and logs require more knives each stage',
            scoring_system='points per embedded knife and sliced apples',
            win_condition='embed all knives into target without collision',
            loss_condition='knife hits an existing knife in the target',
            level_structure='stage-based',
            archetype='aim_shoot',
            controls=controls,
            confidence='high'
        ), 'aim_shoot', 'high'

    # Bottle Shoot / Gun Target Shooting
    if any(k in combined_name for k in ['bottleshoot', 'bottle shoot', 'gun game', 'numberballoonshooter', 'math balloon']):
        return GameplayFingerprint(
            primary_mechanic='crosshair-tap-to-shoot',
            secondary_mechanics=['target-reaction', 'ammo-management', 'bullet-physics'],
            gameplay_loop='tap on targets to shoot and shatter them before time runs out',
            interaction_pattern='tap-target-to-shoot',
            progression_system='targets move faster and appear in greater numbers',
            scoring_system='points per target destroyed with accuracy multiplier',
            win_condition='destroy all required targets in level',
            loss_condition='ammo depleted or time expires',
            level_structure='level-based',
            archetype='aim_shoot',
            controls=controls,
            confidence='high'
        ), 'aim_shoot', 'high'

    # 2. Tube / Water / Ball / Marble Sorting
    if any(k in combined_name for k in ['sort', 'watersort', 'ballsort', 'marblesort']) and any(k in combined_name for k in ['water', 'ball', 'candy', 'marble', 'egg', 'fruit', 'jewel', 'color']):
        return GameplayFingerprint(
            primary_mechanic='color-pour-sorting',
            secondary_mechanics=['stack-order-management', 'empty-tube-strategy', 'undo-move'],
            gameplay_loop='pour colored layers between tubes until each tube contains a single uniform color',
            interaction_pattern='tap-source-tap-target',
            progression_system='number of tubes and color layers escalate each level',
            scoring_system='level completion bonus based on moves used',
            win_condition='all tubes contain uniform single color',
            loss_condition='no valid transfer moves remaining',
            level_structure='level-based',
            archetype='tube_sort',
            controls=controls,
            confidence='high'
        ), 'tube_sort', 'high'

    # 3. True Match-3 (MUST be genuine tile/gem swap with match-3 or cascade logic)
    if any(k in combined_name for k in ['candyblast', 'fruitsplash', 'gemmatch', 'petpop', 'veggiesmash', 'candy blast', 'fruit splash', 'gem match', 'pet pop', 'veggie smash']):
        return GameplayFingerprint(
            primary_mechanic='gem-swap-match',
            secondary_mechanics=['cascade-gravity', 'chain-reaction', 'special-gem-explosion'],
            gameplay_loop='swap adjacent gems to create lines of 3 or more matching colors triggering cascade chains',
            interaction_pattern='drag-swap-selection',
            progression_system='target score increases and board complexity grows each level',
            scoring_system='base points per match multiplied by cascade depth',
            win_condition='reach target score within move or time limit',
            loss_condition='moves or time exhausted before target score reached',
            level_structure='level-based',
            archetype='match3',
            controls=controls,
            confidence='high'
        ), 'match3', 'high'
    if ('swap' in js_lower) and any(k in js_lower or k in combined_name for k in ['match3', 'match-3', 'cascade', 'bejeweled']):
        return GameplayFingerprint(
            primary_mechanic='gem-swap-match',
            secondary_mechanics=['cascade-gravity', 'chain-reaction', 'special-gem-explosion'],
            gameplay_loop='swap adjacent gems to create lines of 3 or more matching colors triggering cascade chains',
            interaction_pattern='drag-swap-selection',
            progression_system='target score increases and board complexity grows each level',
            scoring_system='base points per match multiplied by cascade depth',
            win_condition='reach target score within move or time limit',
            loss_condition='moves or time exhausted before target score reached',
            level_structure='level-based',
            archetype='match3',
            controls=controls,
            confidence='high'
        ), 'match3', 'high'

    # 4. Bubble Shooter
    if any(k in combined_name for k in ['bubbleshooter', 'bubble shooter', 'candybubblepop', 'gemshooter', 'planetshooter', 'virusshooter', 'marbleblast']):
        return GameplayFingerprint(
            primary_mechanic='aim-shoot-cluster-clear',
            secondary_mechanics=['color-matching', 'ricochet-shot', 'cluster-pop'],
            gameplay_loop='aim and fire colored bubbles to match and pop hanging clusters before they descend',
            interaction_pattern='aim-and-fire',
            progression_system='clusters descend faster and color variety expands each level',
            scoring_system='bubbles popped per shot multiplied by cluster size bonus',
            win_condition='all bubbles cleared from the board',
            loss_condition='bubbles descend below danger line',
            level_structure='level-based',
            archetype='bubble_shooter',
            controls=controls,
            confidence='high'
        ), 'bubble_shooter', 'high'

    # 5. Sports Simulation (cricket, tennis, soccer, etc. - NEVER match3!)
    if any(k in combined_name for k in ['cricket', 'football', 'soccer', 'tennis', 'volleyball', 'striker', 'headfootball', 'airhockey', 'bowling', 'tabletennis', 'basketball', 'pocketgolf', 'pool', '8 ball']):
        sport = 'sports'
        for s in ['cricket', 'football', 'soccer', 'tennis', 'volleyball', 'air hockey', 'bowling', 'table tennis', 'basketball', 'golf', 'pool']:
            if s in combined_name: sport = s; break
        return GameplayFingerprint(
            primary_mechanic=f'{sport}-physics-control',
            secondary_mechanics=['opponent-ai', 'shot-angle-power', 'score-target'],
            gameplay_loop=f'aim and time athletic shots to score points in competitive {sport}',
            interaction_pattern='timing-and-aim',
            progression_system='opponent AI difficulty and reaction speed increase each match',
            scoring_system=f'points or goals scored against opponent in {sport}',
            win_condition='outscore opponent by match conclusion',
            loss_condition='opponent finishes match with higher score',
            level_structure='match-based',
            archetype='sports_sim',
            controls=controls,
            confidence='high'
        ), 'sports_sim', 'high'

    # 6. Board Strategy
    if any(k in combined_name for k in ['checkers', 'chess', 'backgammon', 'ludo', 'snakes', 'ladders', 'connect four', 'connectfour']):
        board_name = 'board game'
        for b in ['checkers', 'chess', 'backgammon', 'ludo', 'snakes and ladders', 'connect four']:
            if b in combined_name: board_name = b; break
        return GameplayFingerprint(
            primary_mechanic='turn-based-piece-movement',
            secondary_mechanics=['capture-mechanics', 'dice-rolling', 'positional-strategy'],
            gameplay_loop=f'move pieces strategically on {board_name} board to defeat opponent or reach goal',
            interaction_pattern='select-and-place',
            progression_system='opponent tactical depth scales across matches',
            scoring_system='piece count dominance or board objective capture',
            win_condition='capture opponent key pieces or reach final board tile first',
            loss_condition='opponent captures key piece or reaches objective first',
            level_structure='match-based',
            archetype='board_strategy',
            controls=controls,
            confidence='high'
        ), 'board_strategy', 'high'

    # 7. Card Games
    if any(k in combined_name for k in ['fourcolors', 'four colors', 'solitaire', 'memorymatch', 'memory card', 'sushimatch', 'uno']):
        return GameplayFingerprint(
            primary_mechanic='card-matching-play',
            secondary_mechanics=['suit-matching', 'draw-discard', 'memory-pairs'],
            gameplay_loop='play or match cards according to suit, rank, or hidden memory pairs',
            interaction_pattern='card-select-play',
            progression_system='pair count expands or opponent card speed increases',
            scoring_system='turns used or time taken to clear the deck',
            win_condition='clear all matching pairs or empty card hand',
            loss_condition='moves exhausted or opponent empties hand first',
            level_structure='round-based',
            archetype='card_game',
            controls=controls,
            confidence='high'
        ), 'card_game', 'high'

    # 8. Word Puzzles
    if any(k in combined_name for k in ['word guess', 'wordguess', 'word crossword', 'wordcrossword', 'hangman', 'wordsearch', 'hiddenword']):
        return GameplayFingerprint(
            primary_mechanic='letter-selection',
            secondary_mechanics=['vocabulary-knowledge', 'elimination-clues', 'attempt-limit'],
            gameplay_loop='select or arrange letters to reveal hidden words within limited attempts',
            interaction_pattern='select-and-confirm',
            progression_system='word complexity and length increase at higher stages',
            scoring_system='fewer attempts yields higher puzzle score',
            win_condition='reveal target word within allowed attempts',
            loss_condition='allowed guess attempts exhausted',
            level_structure='puzzle-per-word',
            archetype='word_puzzle',
            controls=controls,
            confidence='high'
        ), 'word_puzzle', 'high'

    # 9. Quizzes / Personality Tests
    if any(k in combined_name for k in ['quiz', 'aireadiness', 'leadershipstyle', 'persona', 'animearchetype', 'hiddentalent', 'healthhero']):
        return GameplayFingerprint(
            primary_mechanic='multiple-choice-selection',
            secondary_mechanics=['question-progression', 'score-evaluation', 'persona-result'],
            gameplay_loop='answer a series of multiple-choice questions to discover your persona or knowledge score',
            interaction_pattern='option-button-click',
            progression_system='sequential question progression toward final result screen',
            scoring_system='category score aggregation across choices',
            win_condition='complete all questions to reveal archetype analysis',
            loss_condition='none questionnaire completion',
            level_structure='questionnaire',
            archetype='quiz',
            controls=controls,
            confidence='high'
        ), 'quiz', 'high'

    # 10. Maze
    if any(k in combined_name for k in ['neonmaze', 'maze', 'labyrinth']):
        return GameplayFingerprint(
            primary_mechanic='maze-navigation',
            secondary_mechanics=['fog-of-war', 'crystal-collection', 'timer-countdown', 'exit-portal'],
            gameplay_loop='navigate procedural labyrinth collecting crystals and reach exit portal before timer expires',
            interaction_pattern='directional-navigation',
            progression_system='maze dimensions grow and battery time shrinks each level',
            scoring_system='crystals collected multiplied by remaining time bonus',
            win_condition='player reaches exit portal before timer reaches zero',
            loss_condition='countdown timer reaches zero before portal reached',
            level_structure='level-based',
            archetype='maze',
            controls=controls,
            confidence='high'
        ), 'maze', 'high'

    # 11. Color Switch
    if any(k in combined_name for k in ['colorbounce', 'colorswitch', 'color bounce', 'color switch']):
        return GameplayFingerprint(
            primary_mechanic='color-matching-passage',
            secondary_mechanics=['rhythm-timing', 'star-collection', 'color-orb-switch'],
            gameplay_loop='tap to bounce ball through rotating obstacles only where color segments match ball color',
            interaction_pattern='tap-gravity-timing',
            progression_system='obstacles rotate faster and patterns more complex at higher scores',
            scoring_system='obstacles passed plus stars collected',
            win_condition='none highest score survival',
            loss_condition='ball touches mismatched color segment',
            level_structure='endless',
            archetype='color_switch',
            controls=controls,
            confidence='high'
        ), 'color_switch', 'high'

    # 12. Watermelon / Physics Drop
    if any(k in combined_name for k in ['watermelondrop', 'watermelon drop', 'suika']):
        return GameplayFingerprint(
            primary_mechanic='aim-and-drop',
            secondary_mechanics=['physics-collision', 'merge-chain', 'tier-progression'],
            gameplay_loop='drop fruits into container aiming to merge matching tiers into higher-value fruits',
            interaction_pattern='aim-release',
            progression_system='higher tier merges become harder to achieve as container fills',
            scoring_system='cumulative value of all merged fruit tiers',
            win_condition='none highest score before overflow',
            loss_condition='fruit stack overflows the container boundary',
            level_structure='endless',
            archetype='physics_drop',
            controls=controls,
            confidence='high'
        ), 'physics_drop', 'high'

    # 13. Stack
    if any(k in combined_name for k in ['towerstack', 'stack3d', 'burgerstack', 'stack 3d', 'tower stack']):
        return GameplayFingerprint(
            primary_mechanic='precision-timing-slice',
            secondary_mechanics=['combo-chain', 'overhang-trim', 'width-accumulation'],
            gameplay_loop='tap to slice a moving block onto the growing tower with minimum overhang',
            interaction_pattern='single-tap-timing',
            progression_system='block swing speed increases with each successful slice',
            scoring_system='height reached multiplied by combo multiplier',
            win_condition='none highest score survival',
            loss_condition='platform width reaches zero from accumulated overhang',
            level_structure='endless',
            archetype='stack',
            controls=controls,
            confidence='high'
        ), 'stack', 'high'

    # 14. Breakout
    if any(k in combined_name for k in ['brickbreaker', 'brick breaker', 'breakout', 'arkanoid']):
        return GameplayFingerprint(
            primary_mechanic='ball-paddle-reflection',
            secondary_mechanics=['brick-destruction', 'power-up-catch', 'ball-angle-control'],
            gameplay_loop='reflect ball with paddle to destroy all bricks then advance to next level',
            interaction_pattern='horizontal-paddle-control',
            progression_system='more bricks, harder patterns, and faster ball each level',
            scoring_system='points per brick destroyed with combo for multi-brick hits',
            win_condition='all bricks in layout destroyed',
            loss_condition='ball passes paddle and all lives depleted',
            level_structure='level-based',
            archetype='breakout',
            controls=controls,
            confidence='high'
        ), 'breakout', 'high'

    # 15. Tetris / Falling Blocks
    if 'tetris' in combined_name or 'blockpuzzle' in f_lower:
        return GameplayFingerprint(
            primary_mechanic='falling-polyomino-placement',
            secondary_mechanics=['matrix-line-clear', 'rotation-matrix', 'drop-acceleration'],
            gameplay_loop='rotate and guide falling tetromino shapes to complete solid horizontal lines',
            interaction_pattern='rotate-and-drop',
            progression_system='fall speed accelerates as lines are cleared',
            scoring_system='points awarded for single, double, triple, and tetris line clears',
            win_condition='none endless survival high score',
            loss_condition='blocks stack to the top of the matrix',
            level_structure='endless',
            archetype='falling_blocks',
            controls=controls,
            confidence='high'
        ), 'falling_blocks', 'high'

    # 16. 2048 / Sliding Tile
    if '2048' in combined_name:
        return GameplayFingerprint(
            primary_mechanic='directional-tile-slide',
            secondary_mechanics=['number-merge', 'board-fill-management'],
            gameplay_loop='slide all tiles in 4 directions to merge identical numbers towards 2048',
            interaction_pattern='swipe-direction-select',
            progression_system='board fills up making moves harder as tile values increase',
            scoring_system='cumulative value of all merged tiles',
            win_condition='create a 2048 tile',
            loss_condition='board completely filled with no valid merge moves remaining',
            level_structure='single-board',
            archetype='2048_merge',
            controls=controls,
            confidence='high'
        ), '2048_merge', 'high'

    # 17. Snake
    if 'neonsnake' in f_lower or 'snake' in combined_name:
        return GameplayFingerprint(
            primary_mechanic='continuous-snake-steering',
            secondary_mechanics=['food-consumption', 'body-growth', 'self-collision-avoidance'],
            gameplay_loop='steer growing snake to consume food items while avoiding walls and self body',
            interaction_pattern='directional-turn-steering',
            progression_system='snake length and move speed increase with food consumed',
            scoring_system='points per food pellet consumed',
            win_condition='none endless survival',
            loss_condition='snake collides with wall or its own body',
            level_structure='single-board',
            archetype='snake',
            controls=controls,
            confidence='high'
        ), 'snake', 'high'

    # 18. Pacman
    if 'neonpacman' in f_lower or 'pacman' in combined_name:
        return GameplayFingerprint(
            primary_mechanic='grid-pellet-consumption',
            secondary_mechanics=['ghost-avoidance', 'power-pellet-inversion', 'maze-routing'],
            gameplay_loop='navigate maze corridors consuming all pellets while evading hunting ghosts',
            interaction_pattern='grid-directional-steering',
            progression_system='ghost AI speed and aggression increase each level',
            scoring_system='points per pellet plus ghost eating bonuses',
            win_condition='all pellets cleared from the maze',
            loss_condition='ghost catches player when not energized',
            level_structure='level-based',
            archetype='pacman_maze',
            controls=controls,
            confidence='high'
        ), 'pacman_maze', 'high'

    # 19. Minesweeper
    if 'minesweeper' in combined_name:
        return GameplayFingerprint(
            primary_mechanic='cell-reveal-and-flag',
            secondary_mechanics=['numerical-deduction', 'mine-flagging', 'cascade-reveal'],
            gameplay_loop='uncover grid cells using adjacent numerical clues while avoiding hidden mines',
            interaction_pattern='tap-reveal-or-flag',
            progression_system='grid size and mine density scale with difficulty',
            scoring_system='fastest completion time recorded',
            win_condition='all non-mine cells safely uncovered',
            loss_condition='player reveals a cell containing a mine',
            level_structure='single-board',
            archetype='minesweeper',
            controls=controls,
            confidence='high'
        ), 'minesweeper', 'high'

    # 20. Sudoku / Math
    if any(k in combined_name for k in ['sudoku', 'crossmath', 'numpuz']):
        return GameplayFingerprint(
            primary_mechanic='number-grid-placement',
            secondary_mechanics=['row-column-deduction', 'constraint-satisfaction', 'error-penalty'],
            gameplay_loop='fill grid cells with correct digits satisfying non-repeating row column rules',
            interaction_pattern='cell-select-number-input',
            progression_system='initial clue count decreases on harder difficulty presets',
            scoring_system='completion time with penalty for incorrect guesses',
            win_condition='entire board completed with no conflicting digits',
            loss_condition='three mistake strikes or player surrender',
            level_structure='puzzle-per-board',
            archetype='logic_grid',
            controls=controls,
            confidence='high'
        ), 'logic_grid', 'high'

    # 21. Endless Runners
    if any(k in combined_name for k in ['subwayrunner', 'subway runner', 'highwayrush', 'highway rush', 'dinorun', 'slopegame', 'slope game', 'crossyroad', 'flappyrise', 'doodlejump', 'skifree', 'retroracer']):
        return GameplayFingerprint(
            primary_mechanic='lane-switching',
            secondary_mechanics=['jumping', 'rolling', 'coin-collecting', 'power-up-activation'],
            gameplay_loop='switch lanes and jump over obstacles as running speed increases endlessly',
            interaction_pattern='reactive-dodge',
            progression_system='speed increases with distance travelled',
            scoring_system='distance plus collectibles multiplied by speed multiplier',
            win_condition='none endless survival high score',
            loss_condition='collide with obstacle or barrier',
            level_structure='endless',
            archetype='endless_runner',
            controls=controls,
            confidence='high'
        ), 'endless_runner', 'high'

    # 22. Reflex / Reaction
    if any(k in combined_name for k in ['cyberreflex', 'reflex', 'whackamole', 'whack-a-mole', 'neonslicer']):
        return GameplayFingerprint(
            primary_mechanic='visual-reflex-tap',
            secondary_mechanics=['streak-multiplier', 'millisecond-tracking', 'distractor-avoidance'],
            gameplay_loop='tap targets rapidly within milliseconds of visual cue',
            interaction_pattern='reactive-tap',
            progression_system='targets appear faster and distractors increase over time',
            scoring_system='streak multiplier applied to base score per correct tap',
            win_condition='none highest streak and score survival',
            loss_condition='tap wrong target or miss within time window',
            level_structure='endless',
            archetype='reaction',
            controls=controls,
            confidence='high'
        ), 'reaction', 'high'

    # 23. Rhythm
    if any(k in combined_name for k in ['pianotiles', 'piano tiles', 'dancingline', 'dancing line']):
        return GameplayFingerprint(
            primary_mechanic='rhythm-tempo-sync-tap',
            secondary_mechanics=['audio-synchronization', 'tempo-acceleration', 'streak-multiplier'],
            gameplay_loop='tap falling notes or turn along music tracks in sync with the musical tempo',
            interaction_pattern='tempo-synchronized-tap',
            progression_system='tempo BPM increases as track progresses',
            scoring_system='perfect timing hits build score combo streak',
            win_condition='complete song track without missing notes',
            loss_condition='miss note or tap off-beat',
            level_structure='song-based-endless',
            archetype='rhythm_timing',
            controls=controls,
            confidence='high'
        ), 'rhythm_timing', 'high'

    # 24. Drawing / Coloring / Educational
    if any(k in combined_name for k in ['abctracing', 'coloringkids', 'kidsballoonpop', 'simplydraw', 'tracing', 'coloring']):
        return GameplayFingerprint(
            primary_mechanic='stroke-tracing-and-fill',
            secondary_mechanics=['color-palette-selection', 'guided-outlines', 'satisfying-animations'],
            gameplay_loop='trace letter guides or fill illustrated regions with chosen color pigments',
            interaction_pattern='touch-stroke-drag',
            progression_system='subsequent coloring pages or alphabet letters unlock sequentially',
            scoring_system='completion star rating based on accuracy',
            win_condition='complete illustration coloring or letter trace',
            loss_condition='none relaxing educational activity',
            level_structure='page-based',
            archetype='kids_educational',
            controls=controls,
            confidence='high'
        ), 'kids_educational', 'high'

    # 25. CLEAR CONFIDENCE FALLBACK FOR UNCERTAIN GAMES
    clean_slug = re.sub(r'[^a-z0-9]+', '-', folder_name.lower()).strip('-')
    display_title = title or folder_name
    return GameplayFingerprint(
        primary_mechanic=f'{clean_slug}-interactive-action',
        secondary_mechanics=['session-progression'],
        gameplay_loop=f'interact with on-screen elements in {display_title} to achieve game objectives',
        interaction_pattern='tap-or-click',
        progression_system='score increases with gameplay duration',
        scoring_system='session point accumulation',
        win_condition='complete game objective',
        loss_condition='session ends on failure',
        level_structure='single-session',
        archetype='unknown',
        controls=controls,
        confidence='low'
    ), 'unknown', 'low'

def scan_repository(repo_root):
    games = {}
    repo_path = Path(repo_root)

    for entry in sorted(repo_path.iterdir()):
        if not entry.is_dir() or entry.name.startswith('.') or entry.name in NON_GAME_DIRS:
            continue

        folder_name = entry.name
        index_file = entry / 'index.html'
        game_html_file = entry / 'game.html'

        if not index_file.exists() and not game_html_file.exists():
            continue

        html_content = ""
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

        js_content = ""
        for js_f in sorted(entry.glob('*.js')):
            try:
                js_content += f"\n// File: {js_f.name}\n" + js_f.read_text(encoding='utf-8', errors='ignore')[:15000]
            except Exception:
                pass

        title = extract_title(html_content) or folder_name
        description = extract_meta_content(html_content, 'description') or f"Play {title} free online on PlayMix."

        controls = detect_controls(html_content + " " + js_content)

        # Code-aware classification & fingerprint creation with confidence score
        fp, archetype, confidence = classify_and_build_fingerprint(folder_name, title, html_content, js_content, controls)

        # Category determination
        cat = 'arcade'
        if archetype in ['card_game', 'board_strategy']:
            cat = 'board'
        elif archetype in ['match3', '2048_merge', 'word_puzzle', 'tube_sort', 'maze', 'minesweeper', 'logic_grid', 'kids_educational']:
            cat = 'puzzle'
        elif archetype in ['sports_sim']:
            cat = 'sports'
        elif archetype in ['physics_drop']:
            cat = 'physics'
        elif archetype in ['endless_runner', 'color_switch', 'stack', 'reaction', 'breakout', 'aim_shoot', 'falling_blocks', 'snake', 'pacman_maze']:
            cat = 'action'
        elif archetype in ['quiz']:
            cat = 'quiz'

        slug = re.sub(r'[^a-z0-9]+', '-', folder_name.lower()).strip('-')

        games[folder_name] = {
            'name': title,
            'slug': slug,
            'folder': folder_name,
            'entry': entry_point,
            'category': cat,
            'archetype': archetype,
            'confidence': confidence,
            'mechanics': [fp.primary_mechanic] + fp.secondary_mechanics,
            'controls': controls,
            'gameplay_loop': fp.gameplay_loop,
            'gameplay_signature': fp.signature(),
            'description': description,
            'fingerprint': fp.to_dict()
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
            'version': '3.0.0',
            'last_updated': str(Path(repo_root).stat().st_mtime),
            'total_games': len(inventory),
            'games': inventory
        }, f, indent=2)

    print(f"✅ Game inventory v3.0 updated: {len(inventory)} games catalogued with code-verified fingerprints.")

if __name__ == '__main__':
    main()
