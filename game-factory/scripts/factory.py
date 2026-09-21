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

sys.path.insert(0, str(CURRENT_DIR))

from inventory import scan_repository
from duplicate_detector import DuplicateDetector
from ai_generator import AIGameGenerator
from validator import GameValidator
from site_updater import SiteUpdater

# High-Demand Trending Web Game Candidate Pool
# Checked against the live registry during generation
CANDIDATE_CONCEPTS = [
    {
        'name': 'Color Bounce Switch',
        'folder': 'ColorBounce',
        'slug': 'color-bounce',
        'archetype': 'color_switch',
        'category': 'action',
        'genre': 'Arcade',
        'tag': '⚡ Neon Timing Hit',
        'desc': 'Tap to bounce upward through rotating colored obstacles! Match colors to pass through and collect stars.',
        'keywords': 'color bounce, color switch online, play color bounce free, color jump arcade, neon reflex game',
        'icon': '⚡',
        'emoji': '⚡',
        'gradient': 'linear-gradient(135deg,#38bdf8,#a855f7,#f43f5e)',
        'mechanics': ['reaction-tap', 'rhythm-timing'],
        'controls': ['touch', 'keyboard', 'mouse']
    },
    {
        'name': 'Hexa Sort 3D',
        'folder': 'HexaSort3D',
        'slug': 'hexa-sort-3d',
        'archetype': 'puzzle',
        'category': 'puzzle',
        'genre': 'Puzzle',
        'tag': '🧩 Trending Hex Stack',
        'desc': 'Stack and merge colorful hexagonal tiles on a honeycomb board!',
        'keywords': 'hexa sort, hexagon stack, puzzle merge online, hexa sort 3d free',
        'icon': '🧩',
        'emoji': '🧩',
        'gradient': 'linear-gradient(135deg,#10b981,#06b6d4,#6366f1)',
        'mechanics': ['sliding-tile', 'physics-merge'],
        'controls': ['touch', 'mouse']
    }
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
        concepts_to_try.append({
            'name': custom_name,
            'folder': folder,
            'slug': slug,
            'archetype': 'color_switch',
            'category': 'action',
            'genre': 'Arcade',
            'tag': '🔥 New Hit',
            'desc': f'Play {custom_name} free online in your browser.',
            'keywords': f'{custom_name.lower()}, play online free, arcade',
            'icon': '🎮',
            'emoji': '🎮',
            'gradient': 'linear-gradient(135deg,#38bdf8,#a855f7)',
            'mechanics': ['reaction-tap'],
            'controls': ['touch', 'mouse']
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
