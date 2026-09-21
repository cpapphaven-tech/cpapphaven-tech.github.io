#!/usr/bin/env python3
"""
PlayMix Game Validator Suite (v2.0)
Performs strict pre-commit checks:
- Required files and folder structure
- Strict single bottom ad rules (present in index.html, strictly absent in game.html)
- Mobile responsiveness & viewport configuration
- JavaScript syntax and structural checks
- Engine Code Inspection: verifies game.js actually implements declared archetype mechanics
- Gameplay Diversity Check: detects if game uses same engine as an existing game
"""

import sys
import os
import re
import json
import argparse
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(CURRENT_DIR))

from duplicate_detector import DuplicateDetector

ARCHETYPE_CODE_MARKERS = {
    'maze': ['walls', 'cols', 'rows', 'mazegrid', 'crystal', 'portal'],
    'stack': ['stack', 'block', 'slice', 'combo', 'falling'],
    'reaction': ['reflex', 'reaction', 'cue', 'timer', 'streak'],
    'breakout': ['paddle', 'ball', 'brick', 'bounce'],
    'match3': ['grid', 'swap', 'match', 'cascade'],
    'endless_runner': ['lane', 'runner', 'speed', 'obstacle'],
    'color_switch': ['ring', 'angle', 'colors', 'obstacle'],
    'physics_drop': ['circle', 'merge', 'radius', 'gravity']
}

class GameValidator:
    def __init__(self, repo_root=None):
        if repo_root is None:
            repo_root = Path(__file__).resolve().parent.parent.parent
        self.repo_root = Path(repo_root)
        self.registry_path = self.repo_root / 'game-factory' / 'game-registry.json'
        self.detector = DuplicateDetector(self.registry_path)

    def validate(self, folder_name, declared_archetype=None):
        game_dir = self.repo_root / folder_name
        errors = []
        warnings = []

        print(f"🔍 Validating game in: {game_dir}")

        # 1. Folder Existence
        if not game_dir.is_dir():
            errors.append(f"Game folder does not exist: {game_dir}")
            return {'passed': False, 'errors': errors, 'warnings': warnings, 'diversity_status': 'FAIL'}

        # 2. Required Files
        required_files = ['index.html', 'game.html', 'style.css', 'game.js']
        for fname in required_files:
            fpath = game_dir / fname
            if not fpath.exists():
                errors.append(f"Missing required file: {fname}")
            elif fpath.stat().st_size == 0:
                errors.append(f"File is empty: {fname}")

        if errors:
            return {'passed': False, 'errors': errors, 'warnings': warnings, 'diversity_status': 'FAIL'}

        # Read file contents
        index_html = (game_dir / 'index.html').read_text(encoding='utf-8', errors='ignore')
        game_html = (game_dir / 'game.html').read_text(encoding='utf-8', errors='ignore')
        style_css = (game_dir / 'style.css').read_text(encoding='utf-8', errors='ignore')
        game_js = (game_dir / 'game.js').read_text(encoding='utf-8', errors='ignore')

        # 3. Strict Bottom Ad Rules (PlayMix Single Ad Standard)
        if 'id="bottom-ad"' not in index_html and "id='bottom-ad'" not in index_html:
            errors.append("index.html missing bottom ad container: <div id=\"bottom-ad\" class=\"pmg-bottom-ad\"></div>")
        if 'ads.js' not in index_html:
            errors.append("index.html missing required ad loader script: <script defer src=\"../ads.js\"></script>")

        if 'id="bottom-ad"' in game_html or "id='bottom-ad'" in game_html:
            errors.append("Duplicate Ad Bug: game.html MUST NOT contain '#bottom-ad' (ad belongs only on outer screen index.html)")
        if 'ads.js' in game_html:
            errors.append("Duplicate Ad Bug: game.html MUST NOT load 'ads.js' (it creates a duplicate ad banner inside the game frame)")

        # 4. Mobile Responsiveness & Viewport
        if 'viewport' not in index_html.lower():
            errors.append("index.html missing viewport meta tag")
        if 'viewport' not in game_html.lower():
            errors.append("game.html missing viewport meta tag")

        # 5. Bottom Ad Clearance Padding in CSS
        # Check for either explicit padding-bottom or shorthand padding with a bottom value >=50px
        has_bottom_padding = (
            re.search(r'padding-bottom\s*:\s*(?:5[0-9]|[6-9][0-9]|[1-9][0-9]{2,})px', style_css) or
            re.search(r'padding\s*:\s*\S+\s+\S+\s+(?:5[0-9]|[6-9][0-9]|[1-9][0-9]{2,})px', style_css)
        )
        if not has_bottom_padding:
            warnings.append("style.css should have bottom clearance padding (e.g. padding-bottom: 60px) so the bottom ad never obscures game buttons")

        # 6. JavaScript Syntax Checks
        if game_js.count('{') != game_js.count('}'):
            errors.append(f"JavaScript curly brace mismatch in game.js: {game_js.count('{')} '{{' vs {game_js.count('}')} '}}'")
        if game_js.count('(') != game_js.count(')'):
            errors.append(f"JavaScript parenthesis mismatch in game.js: {game_js.count('(')} '(' vs {game_js.count(')')} ')'")

        # 7. Broken Local Assets
        asset_matches = re.findall(r'(?:src|href)=["\']([^"\':#]+)["\']', game_html)
        for asset in asset_matches:
            if asset.startswith('http') or asset.startswith('//') or asset.startswith('data:'):
                continue
            if not (game_dir / asset).resolve().exists():
                errors.append(f"Broken local asset reference in game.html: '{asset}' (file not found)")

        # 8. Extract Title & Determine Archetype
        title_match = re.search(r'<title>([^<]+)</title>', index_html, re.I)
        game_title = title_match.group(1) if title_match else folder_name
        # Strip everything from the first pipe onwards (covers "| PlayMixGames", "| Play Online Free | PlayMixGames", etc.)
        game_title = re.sub(r'\s*\|.*$', '', game_title).strip()

        # Check declared or inferred archetype
        js_lower = game_js.lower()
        detected_archetype = declared_archetype
        if not detected_archetype:
            for arch, markers in ARCHETYPE_CODE_MARKERS.items():
                if all(m in js_lower for m in markers[:2]):
                    detected_archetype = arch
                    break

        if not detected_archetype:
            detected_archetype = 'arcade'

        # 9. Engine Code Authenticity Check
        # Check that game.js actually implements declared archetype markers
        if declared_archetype in ARCHETYPE_CODE_MARKERS:
            expected_markers = ARCHETYPE_CODE_MARKERS[declared_archetype]
            found = [m for m in expected_markers if m in js_lower]
            if len(found) < 2:
                errors.append(f"Engine authenticity failed: game.js does not implement mechanics for archetype '{declared_archetype}' (missing markers: {expected_markers})")

        # 10. Gameplay Diversity & Duplicate Check
        diversity_result = self.detector.check(
            candidate_name=game_title,
            candidate_folder=folder_name,
            candidate_archetype=detected_archetype
        )

        diversity_status = diversity_result['status']
        if not diversity_result['allowed']:
            errors.append(diversity_result['status'])

        passed = len(errors) == 0
        return {
            'passed': passed,
            'errors': errors,
            'warnings': warnings,
            'diversity_status': diversity_status,
            'archetype': detected_archetype
        }

def main():
    parser = argparse.ArgumentParser(description="Validate PlayMix game folder and gameplay diversity.")
    parser.add_argument('folder', help="Target game directory name")
    parser.add_argument('--archetype', help="Declared engine archetype")
    args = parser.parse_args()

    validator = GameValidator()
    result = validator.validate(args.folder, declared_archetype=args.archetype)

    if result['warnings']:
        print("⚠️ Warnings:")
        for w in result['warnings']:
            print(f"  - {w}")

    print(f"\n🎮 Gameplay Engine Diversity Result:")
    print(f"  {result['diversity_status']}")

    if not result['passed']:
        print("\n❌ Validation FAILED:")
        for err in result['errors']:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print(f"✅ Game validation PASSED for '{args.folder}'! (Archetype: {result['archetype']})")

if __name__ == '__main__':
    main()
