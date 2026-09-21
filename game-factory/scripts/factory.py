#!/usr/bin/env python3
"""
PlayMix Game Factory Master Orchestrator
Coordinates the complete automated game creation lifecycle:
1. Inventory scan
2. Trending concept selection
3. Duplicate rejection
4. Game file generation
5. Validation suite execution
6. Site index, sitemap, and blog updates
"""

import sys
import os
import re
import json
import argparse
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
REPO_ROOT = CURRENT_DIR.parent.parent

sys.path.insert(0, str(CURRENT_DIR.parent))  # makes 'engines' package importable
sys.path.insert(0, str(CURRENT_DIR))           # makes sibling scripts importable

from inventory import scan_repository
from duplicate_detector import DuplicateDetector
from ai_generator import AIGameGenerator
from validator import GameValidator
from site_updater import SiteUpdater
from engines import classify_concept, select_underrepresented_archetype

# High-Demand Trending Web Game Candidate Pool (diverse archetypes, not all color_switch)
CANDIDATE_CONCEPTS = [
    {
        'name': 'Neon Maze Escape',
        'folder': 'NeonMaze',
        'slug': 'neon-maze-escape',
        'archetype': 'maze',
        'category': 'puzzle',
        'genre': 'Puzzle',
        'tag': '🔮 Neon Labyrinth',
        'desc': 'Navigate procedurally generated neon labyrinths with fog-of-war lighting, collect power crystals, and escape through the portal!',
        'keywords': 'neon maze, maze game online, escape maze free, labyrinth game, neon maze escape',
        'icon': '🔮',
        'emoji': '🔮',
        'gradient': 'linear-gradient(135deg,#06b6d4,#8b5cf6,#f43f5e)',
        'mechanics': ['maze-pathfinding', 'fog-of-war', 'crystal-collection'],
        'controls': ['touch', 'keyboard', 'mouse']
    },
    {
        'name': 'Tower Stack Blitz',
        'folder': 'TowerStackBlitz',
        'slug': 'tower-stack-blitz',
        'archetype': 'stack',
        'category': 'arcade',
        'genre': 'Arcade',
        'tag': '🏗️ Precision Stacker',
        'desc': 'Slice perfectly timed falling blocks to build the tallest tower! Perfect taps keep the full block width — chain combos for massive scores.',
        'keywords': 'tower stack game, block stacking game online, stack game free, precision tap game',
        'icon': '🏗️',
        'emoji': '🏗️',
        'gradient': 'linear-gradient(135deg,#f59e0b,#ef4444,#a855f7)',
        'mechanics': ['precision-timing', 'block-slicing', 'combo-chain'],
        'controls': ['touch', 'mouse', 'keyboard']
    },
    {
        'name': 'Cyber Reflex Sprint',
        'folder': 'CyberReflexSprint',
        'slug': 'cyber-reflex-sprint',
        'archetype': 'reaction',
        'category': 'arcade',
        'genre': 'Arcade',
        'tag': '⚡ Reflex Test',
        'desc': 'How fast are your reflexes? Tap the correct target the instant it flashes — track your millisecond reaction times and build streaks!',
        'keywords': 'reflex game online, reaction time game, tap reflex test, quick tap game free',
        'icon': '⚡',
        'emoji': '⚡',
        'gradient': 'linear-gradient(135deg,#00ffff,#a855f7,#f43f5e)',
        'mechanics': ['reaction-tap', 'streak-combo', 'millisecond-timing'],
        'controls': ['touch', 'mouse']
    },
    {
        'name': 'Gem Crush Cascade',
        'folder': 'GemCrushCascade',
        'slug': 'gem-crush-cascade',
        'archetype': 'match3',
        'category': 'puzzle',
        'genre': 'Puzzle',
        'tag': '💎 Match & Cascade',
        'desc': 'Swap dazzling gems on an 8x8 grid, trigger gravity cascades, and chain match-3/4/5 combos for monster scores!',
        'keywords': 'gem crush game, match 3 game online, candy crush style game, gem swap puzzle free',
        'icon': '💎',
        'emoji': '💎',
        'gradient': 'linear-gradient(135deg,#ec4899,#f59e0b,#10b981)',
        'mechanics': ['gem-swap', 'match-3', 'cascade-gravity', 'special-gems'],
        'controls': ['touch', 'mouse']
    },
    {
        'name': 'Color Bounce Switch',
        'folder': 'ColorBounce',
        'slug': 'color-bounce',
        'archetype': 'color_switch',
        'category': 'action',
        'genre': 'Arcade',
        'tag': '⚡ Neon Timing Hit',
        'desc': 'Tap to bounce upward through rotating colored obstacles! Match colors to pass through and collect stars.',
        'keywords': 'color bounce, color switch online, play color bounce free, color jump arcade',
        'icon': '⚡',
        'emoji': '⚡',
        'gradient': 'linear-gradient(135deg,#38bdf8,#a855f7,#f43f5e)',
        'mechanics': ['reaction-tap', 'rhythm-timing'],
        'controls': ['touch', 'keyboard', 'mouse']
    },
]

def run_factory(count=1, custom_name=None, custom_folder=None, dry_run=False):
    print("=" * 60)
    print("🚀 PlayMix Game Factory — Automated Game Generator")
    print("=" * 60)

    # Step 1: Ensure inventory is up-to-date
    print("\n[Step 1/6] Scanning current PlayMix game inventory...")
    registry_path = REPO_ROOT / 'game-factory' / 'game-registry.json'
    inventory = scan_repository(REPO_ROOT)
    registry_path.parent.mkdir(parents=True, exist_ok=True)
    with open(registry_path, 'w', encoding='utf-8') as f:
        json.dump({'version': '1.0.0', 'total_games': len(inventory), 'games': inventory}, f, indent=2)
    print(f"Current inventory contains {len(inventory)} games.")

    detector = DuplicateDetector(registry_path)
    generator = AIGameGenerator(REPO_ROOT)
    validator = GameValidator(REPO_ROOT)
    updater = SiteUpdater(REPO_ROOT)

    generated_count = 0
    generated_games = []

    # Select concept
    concepts_to_try = []
    if custom_name:
        folder = custom_folder or re.sub(r'[^a-zA-Z0-9]', '', custom_name)
        slug = re.sub(r'[^a-z0-9]+', '-', custom_name.lower()).strip('-')
        # Auto-classify the archetype from the game name — never blindly default to color_switch
        detected_archetype = classify_concept(custom_name, '')
        if not detected_archetype:
            detected_archetype = 'maze'  # diverse fallback
        print(f"Auto-detected archetype for '{custom_name}': '{detected_archetype}'")
        concepts_to_try.append({
            'name': custom_name,
            'folder': folder,
            'slug': slug,
            'archetype': detected_archetype,
            'category': 'action',
            'genre': 'Arcade',
            'tag': '🔥 New Hit',
            'desc': f'Play {custom_name} free online in your browser. Mobile-friendly, no download required!',
            'keywords': f'{custom_name.lower()}, play online free, arcade, {detected_archetype.replace("_", " ")}',
            'icon': '🎮',
            'emoji': '🎮',
            'gradient': 'linear-gradient(135deg,#38bdf8,#a855f7)',
            'mechanics': [detected_archetype],
            'controls': ['touch', 'mouse', 'keyboard']
        })
    else:
        concepts_to_try = CANDIDATE_CONCEPTS

    for concept in concepts_to_try:
        if generated_count >= count:
            break

        print(f"\n[Step 2/6] Evaluating candidate concept: '{concept['name']}'...")
        check_result = detector.check(
            candidate_name=concept['name'],
            candidate_folder=concept['folder'],
            candidate_category=concept['category'],
            candidate_mechanics=concept['mechanics']
        )

        if not check_result['allowed']:
            print(f"❌ Rejected concept '{concept['name']}': Duplicate or too similar!")
            for reason in check_result['rejection_reasons']:
                print(f"   Reason: {reason}")
            continue

        print(f"✅ Concept '{concept['name']}' approved! (Uniqueness score: {check_result['uniqueness_score']})")

        if dry_run:
            print("Notice: Dry-run mode enabled. Skipping file creation.")
            generated_count += 1
            continue

        # Step 3: Generate Files
        print(f"\n[Step 3/6] Generating game files for '{concept['name']}'...")
        files = generator.generate(concept)

        game_dir = REPO_ROOT / concept['folder']
        game_dir.mkdir(parents=True, exist_ok=True)
        blog_dir = REPO_ROOT / 'blog'
        blog_dir.mkdir(parents=True, exist_ok=True)

        (game_dir / 'index.html').write_text(files['index_html'], encoding='utf-8')
        (game_dir / 'game.html').write_text(files['game_html'], encoding='utf-8')
        (game_dir / 'style.css').write_text(files['style_css'], encoding='utf-8')
        (game_dir / 'game.js').write_text(files['game_js'], encoding='utf-8')
        (blog_dir / f"{concept['slug']}.html").write_text(files['blog_html'], encoding='utf-8')

        print(f"  ✓ Written: {concept['folder']}/index.html")
        print(f"  ✓ Written: {concept['folder']}/game.html")
        print(f"  ✓ Written: {concept['folder']}/style.css")
        print(f"  ✓ Written: {concept['folder']}/game.js")
        print(f"  ✓ Written: blog/{concept['slug']}.html")

        # Step 4: Validate
        print(f"\n[Step 4/6] Running validation suite on '{concept['folder']}'...")
        val_result = validator.validate(concept['folder'])

        if not val_result['passed']:
            print("❌ Validation FAILED! Rolling back generated files...")
            for f in game_dir.iterdir():
                f.unlink()
            game_dir.rmdir()
            (blog_dir / f"{concept['slug']}.html").unlink(missing_ok=True)
            for err in val_result['errors']:
                print(f"   Error: {err}")
            sys.exit(1)

        print(f"✅ All validation checks passed cleanly!")

        # Step 5: Update Platform Data
        print(f"\n[Step 5/6] Updating games-data.js, sitemap.xml, and blog/index.html...")
        updater.update_all(concept)

        generated_count += 1
        generated_games.append(concept)

    # Step 6: Summary
    print("\n" + "=" * 60)
    print(f"🎉 Game Factory Completed: {generated_count} new game(s) generated successfully!")
    print("=" * 60)
    for g in generated_games:
        print(f"🎮 Game: {g['name']} ({g['folder']}/)")
        print(f"   URL: https://playmixgames.in/{g['folder']}/index.html")
        print(f"   Blog: https://playmixgames.in/blog/{g['slug']}.html")
        print(f"   Category: {g['category'].capitalize()}")
    print("=" * 60)

    return generated_games

def main():
    parser = argparse.ArgumentParser(description="PlayMix Game Factory")
    parser.add_argument('--count', type=int, default=1, help="Number of games to generate (default: 1)")
    parser.add_argument('--name', help="Custom game name")
    parser.add_argument('--folder', help="Custom folder name")
    parser.add_argument('--dry-run', action='store_true', help="Test concept without writing files")

    args = parser.parse_args()
    run_factory(count=args.count, custom_name=args.name, custom_folder=args.folder, dry_run=args.dry_run)

if __name__ == '__main__':
    main()
