#!/usr/bin/env python3
"""
PlayMix AI & Procedural Game Generator
Zero external dependencies (uses Python standard library urllib).
Supports:
1. Google Gemini API (Free tier: gemini-1.5-flash via GEMINI_API_KEY)
2. High-Fidelity Standalone Procedural Fallback (100% free, 0 API keys required!)
"""

import sys
import os
import json
import urllib.request
import urllib.error
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = CURRENT_DIR.parent / 'templates'

# Add game-factory/ to path so 'engines' package is importable
sys.path.insert(0, str(CURRENT_DIR.parent))

from engines import get_engine, classify_concept, select_underrepresented_archetype


# ---------------------------------------------------------------------------
# Archetype-specific SEO content (avoids generic color-switch copy for all games)
# ---------------------------------------------------------------------------
_ARCHETYPE_SEO = {
    'maze': {
        'intro': 'Navigate procedural neon labyrinths, collect power crystals, and find the escape portal before your battery runs out!',
        'features': 'Procedurally generated mazes, fog-of-war dynamic lighting, crystal collection, D-pad & keyboard controls, and high score tracking.',
        'steps': [
            ('<strong>Navigate:</strong>', 'Use the D-pad, swipe gestures, or arrow keys to move through glowing corridors.'),
            ('<strong>Collect Crystals:</strong>', 'Gather power crystals to boost score and slow battery drain.'),
            ('<strong>Find the Portal:</strong>', 'Reach the neon exit portal before your battery hits zero.'),
            ('<strong>Watch the Fog:</strong>', 'Fog of war reveals only nearby corridors — explore carefully.'),
        ],
        'blog_heading': 'Mastering Procedural Mazes',
        'blog_intro': '{name} generates a unique neon labyrinth every run using recursive backtracking. Fog-of-war means careful exploration is key.',
        'tips': [
            ('Hug the Right Wall', "Follow the right wall consistently and you'll find most exits."),
            ('Grab Every Crystal', 'Crystals add score AND slow battery drain — always worth the detour.'),
            ('Memorise Junctions', 'Note dead ends when fog clears to avoid backtracking.'),
            ('Use the Minimap', 'The corner minimap shows visited cells — find unexplored branches quickly.'),
        ],
    },
    'stack': {
        'intro': 'Slice falling blocks to build the tallest, most precise tower — perfect timing rewards bigger blocks!',
        'features': 'Physics-based block slicing, precision combo system, progressive speed, chime feedback, and high score tracking.',
        'steps': [
            ('<strong>Tap to Slice:</strong>', 'Tap when the moving block aligns with the platform below.'),
            ('<strong>Perfect = No Slice:</strong>', 'A perfectly aligned tap keeps the full block width.'),
            ('<strong>Build High:</strong>', 'The platform shrinks with each imprecise tap until it disappears.'),
            ('<strong>Chain Combos:</strong>', 'Consecutive perfect taps restore width and multiply score.'),
        ],
        'blog_heading': 'Stacking to the Top',
        'blog_intro': '{name} is a precision timing test. Each block swings wider as you climb higher.',
        'tips': [
            ('Focus on the Edge', 'Watch only the front edge of the moving block vs the platform edge.'),
            ('Slow Down', 'Rushing causes early taps. Wait for perfect alignment.'),
            ('Use Audio Cues', 'The chime pitch shifts near the centre — let your ears guide the tap.'),
            ('Recover with Combos', 'A narrow platform can be widened back with perfect combo taps.'),
        ],
    },
    'reaction': {
        'intro': 'Test your reflexes with lightning-fast visual prompts — tap the correct target the instant it appears!',
        'features': 'Millisecond response tracking, escalating difficulty, streak multipliers, and global leaderboard.',
        'steps': [
            ('<strong>Watch for Prompts:</strong>', 'A coloured target or symbol flashes on screen — react immediately.'),
            ('<strong>Tap the Right Target:</strong>', 'Only tap the correct shape/colour — wrong taps break streaks.'),
            ('<strong>Build Streaks:</strong>', 'Consecutive correct taps increase your score multiplier.'),
            ('<strong>Beat Your Time:</strong>', 'Each round tracks your average reaction time — aim for sub-200ms.'),
        ],
        'blog_heading': 'Sharpening Your Reflexes',
        'blog_intro': '{name} trains pure visual reaction speed. Prompts appear randomly to prevent anticipation.',
        'tips': [
            ('Relax Your Hand', 'Tense muscles slow response. Keep your finger lightly hovering.'),
            ('Focus on the Centre', 'Keep your gaze locked at screen centre where prompts appear.'),
            ("Don't Guess", 'Premature taps break streaks. Wait for the actual cue.'),
            ('Practice Daily', '5 minutes a day makes a measurable improvement within a week.'),
        ],
    },
    'breakout': {
        'intro': 'Control the paddle, fire the ball, and smash every brick to clear the board!',
        'features': 'Smooth paddle physics, multi-row brick matrix, lives system, power-up bricks, and progressive speed.',
        'steps': [
            ('<strong>Move the Paddle:</strong>', 'Drag or use arrow keys to position the paddle under the bouncing ball.'),
            ('<strong>Smash Bricks:</strong>', 'The ball destroys bricks on contact — clear the board to advance.'),
            ("<strong>Don't Miss:</strong>", 'If the ball passes the paddle, you lose a life. Three lives and it is over.'),
            ('<strong>Catch Power-Ups:</strong>', 'Special bricks drop power-ups — catch them with the paddle for bonuses.'),
        ],
        'blog_heading': 'Brick by Brick',
        'blog_intro': '{name} is a modern breakout — smooth physics and escalating speed keep every level fresh.',
        'tips': [
            ('Aim for Corners', 'Angling into corners clears large brick clusters quickly.'),
            ('Use Paddle Angle', 'Ball reflection angle depends on where it hits the paddle — use this for precision.'),
            ('Target Power-Up Bricks', 'Glowing bricks have power-ups — hit them early.'),
            ('Stay Centred', "Keep the paddle near the ball's X position rather than chasing it."),
        ],
    },
    'match3': {
        'intro': 'Swap and match colourful gems to create chain reactions and clear the board!',
        'features': '8x8 gem grid, match-3/4/5 detection, gravity cascade chains, special gem explosions, and high score tracking.',
        'steps': [
            ('<strong>Swap Gems:</strong>', 'Tap a gem then tap a neighbour to swap positions.'),
            ('<strong>Match 3+:</strong>', 'Line up 3+ identical gems horizontally or vertically to clear them.'),
            ('<strong>Chain Cascades:</strong>', 'Cleared gems let others fall, triggering automatic chain matches.'),
            ('<strong>Match 4 or 5:</strong>', 'Longer matches create special gems that explode rows or columns.'),
        ],
        'blog_heading': 'Chaining Matches Like a Pro',
        'blog_intro': '{name} rewards strategic thinking. Setting up cascades scores far more than rapid individual matches.',
        'tips': [
            ('Plan for Cascades', 'Look for swaps that set off falling chain reactions rather than the first match you see.'),
            ('Go for L and T Shapes', 'Matching in L or T shapes creates powerful special gems.'),
            ('Work Bottom-Up', 'Clearing lower gems causes uppers to fall, creating more opportunities.'),
            ("Don't Rush", 'Taking a moment to spot a 5-gem match is always worth it.'),
        ],
    },
    'endless_runner': {
        'intro': 'Dash through 3 lanes, dodge obstacles, and jump over barriers in an ever-accelerating neon runner!',
        'features': '3-lane system, jump and roll mechanics, accelerating speed, coin collection, and distance-based scoring.',
        'steps': [
            ('<strong>Swipe to Change Lane:</strong>', 'Swipe left/right or use arrow keys to dodge obstacles.'),
            ('<strong>Swipe Up to Jump:</strong>', 'Jump over low barriers and gaps.'),
            ('<strong>Swipe Down to Roll:</strong>', 'Duck under overhanging obstacles.'),
            ('<strong>Collect Coins:</strong>', 'Coins boost your score and unlock power-ups.'),
        ],
        'blog_heading': 'Running Further Every Time',
        'blog_intro': '{name} gets faster every second. Muscle memory for lane-switch patterns is the key to high scores.',
        'tips': [
            ('Stay Middle Lane', 'The centre lane gives you an escape route in both directions.'),
            ('React Early', "Don't wait until the last moment — obstacles give you time to react."),
            ('Survival Over Coins', 'Skip a coin to dodge an obstacle — always worth it.'),
            ('Use Sound Cues', 'Obstacle spawn sounds give you extra reaction time.'),
        ],
    },
    'physics_drop': {
        'intro': 'Drop and merge falling fruits — combine matching ones to create bigger fruits and reach the legendary watermelon!',
        'features': 'Real-time physics, fruit merging chain reactions, progressive difficulty, and leaderboard scoring.',
        'steps': [
            ('<strong>Aim and Drop:</strong>', 'Move to aim, then release to drop the fruit.'),
            ('<strong>Match to Merge:</strong>', 'Two identical fruits touching merge into the next larger fruit.'),
            ('<strong>Chain Merges:</strong>', 'A merge can trigger neighbour merges — set up chain reactions.'),
            ("<strong>Don't Overflow:</strong>", 'If the pile reaches the top line, the game ends.'),
        ],
        'blog_heading': 'Merging to the Watermelon',
        'blog_intro': '{name} is about controlled chaos — physics makes fruits roll unpredictably, so precise drops matter.',
        'tips': [
            ('Drop Near Matches', 'Scan the pile for matching fruit before dropping.'),
            ('Use the Walls', 'Dropping near a wall keeps fruits in a predictable column.'),
            ('Keep the Pile Low', "Don't chase high merges if the pile is near the top."),
            ('Plan 2 Drops Ahead', 'You can see the next fruit — plan both drops simultaneously.'),
        ],
    },
    'color_switch': {
        'intro': 'Tap to bounce your coloured ball through spinning obstacles — only pass through matching colour segments!',
        'features': 'Procedural 60 FPS neon obstacles, star collectible scoring, dynamic colour-switching orbs, and high score tracking.',
        'steps': [
            ('<strong>Tap to Bounce:</strong>', 'Tap anywhere to bounce the ball upward against gravity.'),
            ('<strong>Match Colours:</strong>', 'The ball can only pass through obstacle segments matching its colour.'),
            ('<strong>Collect Stars:</strong>', 'Pick up golden stars inside obstacles to increase your score.'),
            ('<strong>Hit Colour Switchers:</strong>', "Colour-switch orbs change your ball's colour — adjust timing instantly!"),
        ],
        'blog_heading': 'Mastering the Colour Switch',
        'blog_intro': '{name} is a test of rhythm, patience, and colour recognition. One wrong tap ends the run.',
        'tips': [
            ("Don't Spam Taps", 'Rhythmic single taps let you hover beneath an obstacle until the right gap opens.'),
            ('Anticipate Colour Changes', 'Prepare for your ball colour to change near an orb.'),
            ('Aim for Stars', 'Stars sit dead-centre of obstacles — clean colour-matched entry grabs them.'),
            ('Use Soft Resting Taps', 'Inside large rings, tap gently to wait for the gap to rotate into position.'),
        ],
    },
}


def _build_seo_body(concept):
    archetype = concept.get('archetype', 'color_switch')
    data = _ARCHETYPE_SEO.get(archetype, _ARCHETYPE_SEO['color_switch'])
    name = concept['name']
    steps_html = ''.join(f'<li>{label} {text}</li>' for label, text in data['steps'])
    return f'''
        <p>Welcome to <strong>{name}</strong> &#8212; {data['intro']}</p>
        <div class="highlight-box">
            <strong>&#10024; Game Features:</strong> {data['features']}
        </div>
        <h2>&#127918; How to Play {name}</h2>
        <ol>{steps_html}</ol>
        '''


def _build_blog_content(concept):
    archetype = concept.get('archetype', 'color_switch')
    data = _ARCHETYPE_SEO.get(archetype, _ARCHETYPE_SEO['color_switch'])
    name = concept['name']
    intro = data['blog_intro'].replace('{name}', name)
    tips_html = ''.join(
        f'<h3>{i+1}. {title}</h3><p>{body}</p>'
        for i, (title, body) in enumerate(data['tips'])
    )
    return f'''
        <h2>{data['blog_heading']}</h2>
        <p>{intro}</p>
        <h2>Top {len(data['tips'])} Pro Tips</h2>
        {tips_html}
        '''


class AIGameGenerator:
    def __init__(self, repo_root=None):
        if repo_root is None:
            repo_root = Path(__file__).resolve().parent.parent.parent
        self.repo_root = Path(repo_root)
        self.gemini_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('AI_API_KEY')

    def generate(self, concept_info):
        """
        concept_info must contain: name, folder, slug, archetype, category,
        genre, tag, desc, keywords, icon, emoji, gradient, mechanics, controls

        Supported archetypes:
            maze | stack | reaction | breakout | match3
            | endless_runner | physics_drop | color_switch
        """
        archetype = concept_info.get('archetype')

        # Auto-classify if archetype is missing or a generic placeholder
        if not archetype or archetype in ('ai_custom', 'custom', '', 'auto', None):
            archetype = classify_concept(
                concept_info['name'],
                concept_info.get('desc', '')
            )
            if not archetype:
                archetype = 'maze'  # diverse safe default -- NOT color_switch
            concept_info['archetype'] = archetype
            print(f"Auto-classified archetype: '{archetype}' (from game name/description)")

        # Gemini AI path (optional)
        if archetype == 'ai_custom' and self.gemini_key:
            try:
                print("Calling Google Gemini API...")
                ai_files = self._call_gemini(concept_info)
                if ai_files:
                    return self._assemble_game(concept_info, ai_files)
            except Exception as e:
                print(f"Gemini call failed ({e}). Falling back to procedural engine.")

        # Modular Engine Dispatch
        print(f"Generating game using '{archetype}' engine...")
        engine_module = get_engine(archetype)
        if engine_module is None:
            print(f"Warning: No engine for '{archetype}'. Using 'maze' engine.")
            from engines import maze_engine as engine_module
            archetype = 'maze'
            concept_info['archetype'] = archetype

        engine_output = engine_module.generate(
            game_title=concept_info['name'],
            folder_name=concept_info['folder']
        )
        return self._assemble_game(concept_info, engine_output)

    def _assemble_game(self, concept, engine_output):
        """Assembles final game files from engine output + templates."""
        index_template = (TEMPLATES_DIR / 'index_shell.html').read_text(encoding='utf-8')
        blog_template = (TEMPLATES_DIR / 'blog_shell.html').read_text(encoding='utf-8')

        archetype = concept.get('archetype', 'arcade')

        index_html = index_template
        index_html = index_html.replace('{{GAME_TITLE}}', concept['name'])
        index_html = index_html.replace('{{GAME_DESCRIPTION}}', concept['desc'])
        index_html = index_html.replace('{{GAME_KEYWORDS}}', concept.get('keywords', ''))
        index_html = index_html.replace('{{FOLDER_NAME}}', concept['folder'])
        index_html = index_html.replace('{{GENRE}}', concept.get('genre', 'Arcade'))
        index_html = index_html.replace('{{LOADER_TIP}}', f"Loading {concept['name']}...")
        index_html = index_html.replace('{{SEO_HEADING}}',
            f"{concept.get('icon', chr(127918))} Play {concept['name']} Free Online")
        index_html = index_html.replace('{{SEO_BODY}}', _build_seo_body(concept))
        index_html = index_html.replace('{{FAQ_SECTION}}', (
            f'<div class="faq-card">'
            f'<h4>Q: Can I play {concept["name"]} on my smartphone?</h4>'
            f'<p>A: Yes! {concept["name"]} is 100% mobile-friendly with responsive touch controls for iOS and Android.</p>'
            f'</div>'
            f'<div class="faq-card">'
            f'<h4>Q: Does the game save my best score?</h4>'
            f'<p>A: Yes, your all-time high score is preserved in your browser\'s local storage.</p>'
            f'</div>'
        ))

        blog_html = blog_template
        blog_html = blog_html.replace('{{BLOG_TITLE}}', f"{concept['name']} Strategy Guide & Tips")
        blog_html = blog_html.replace('{{BLOG_DESCRIPTION}}',
            f"Master {concept['name']}! Expert tips for this free online {archetype.replace('_', ' ')} game.")
        blog_html = blog_html.replace('{{BLOG_SLUG}}', concept['slug'])
        blog_html = blog_html.replace('{{GAME_TITLE}}', concept['name'])
        blog_html = blog_html.replace('{{FOLDER_NAME}}', concept['folder'])
        blog_html = blog_html.replace('{{GAME_DESCRIPTION}}', concept['desc'])
        blog_html = blog_html.replace('{{PUBLISH_DATE}}', '2026-09-21T00:00:00+05:30')
        blog_html = blog_html.replace('{{PUBLISH_DATE_FORMATTED}}', 'September 2026')
        blog_html = blog_html.replace('{{BLOG_CONTENT}}', _build_blog_content(concept))

        return {
            'index_html': index_html,
            'game_html': engine_output['game_html'],
            'style_css': engine_output['style_css'],
            'game_js': engine_output['game_js'],
            'blog_html': blog_html
        }

    def _call_gemini(self, concept):
        """Calls Gemini free tier via urllib."""
        url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
               f"gemini-1.5-flash:generateContent?key={self.gemini_key}")
        data = {
            "contents": [{"parts": [{"text": f"Create game logic for {concept['name']}"}]}],
            "generationConfig": {"temperature": 0.3}
        }
        req = urllib.request.Request(
            url, data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            json.loads(resp.read().decode('utf-8'))
        return None  # placeholder — full AI pipeline TBD


def main():
    print("AIGameGenerator module ready.")
    print("Supported archetypes:", list(_ARCHETYPE_SEO.keys()))


if __name__ == '__main__':
    main()
