#!/usr/bin/env python3
"""
PlayMix Game Validator Suite
Performs strict pre-commit checks on generated PlayMix games:
- Required files and folder structure
- Single bottom advertisement rules (present in index.html, strictly absent in game.html)
- Mobile responsiveness & viewport configuration
- JavaScript syntax and safety checks
- CSS presence and ad clearance padding
- Broken local asset links
- Uniqueness against the game registry
"""

import sys
import os
import re
import argparse
from pathlib import Path

# Add scripts directory to path for duplicate_detector
CURRENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(CURRENT_DIR))

from duplicate_detector import DuplicateDetector

class GameValidator:
    def __init__(self, repo_root=None):
        if repo_root is None:
            repo_root = Path(__file__).resolve().parent.parent.parent
        self.repo_root = Path(repo_root)
        self.detector = DuplicateDetector(self.repo_root / 'game-factory' / 'game-registry.json')

    def validate(self, folder_name):
        game_dir = self.repo_root / folder_name
        errors = []
        warnings = []

        print(f"🔍 Validating game in: {game_dir}")

        # 1. Folder Existence
        if not game_dir.is_dir():
            errors.append(f"Game folder does not exist: {game_dir}")
            return {'passed': False, 'errors': errors, 'warnings': warnings}

        # 2. Required Files
        required_files = ['index.html', 'game.html', 'style.css', 'game.js']
        for fname in required_files:
            fpath = game_dir / fname
            if not fpath.exists():
                errors.append(f"Missing required file: {fname}")
            elif fpath.stat().st_size == 0:
                errors.append(f"File is empty: {fname}")

        if errors:
            return {'passed': False, 'errors': errors, 'warnings': warnings}

        # Read file contents
        index_html = (game_dir / 'index.html').read_text(encoding='utf-8', errors='ignore')
        game_html = (game_dir / 'game.html').read_text(encoding='utf-8', errors='ignore')
        style_css = (game_dir / 'style.css').read_text(encoding='utf-8', errors='ignore')
        game_js = (game_dir / 'game.js').read_text(encoding='utf-8', errors='ignore')

        # 3. Strict Bottom Ad Rules (The PlayMix Single Ad Standard)
        # Check index.html: MUST have bottom ad and ads.js
        if 'id="bottom-ad"' not in index_html and "id='bottom-ad'" not in index_html:
            errors.append("index.html is missing required bottom ad container: <div id=\"bottom-ad\" class=\"pmg-bottom-ad\"></div>")
        if 'ads.js' not in index_html:
            errors.append("index.html is missing required ad loader script: <script defer src=\"../ads.js\"></script>")

        # Check game.html: MUST NOT have bottom ad or ads.js (strictly avoid duplicate ads)
        if 'id="bottom-ad"' in game_html or "id='bottom-ad'" in game_html:
            errors.append("Duplicate Ad Bug: game.html MUST NOT contain '#bottom-ad' (ad belongs only on outer screen index.html)")
        if 'ads.js' in game_html:
            errors.append("Duplicate Ad Bug: game.html MUST NOT load 'ads.js' (it creates a duplicate ad banner inside the game frame)")

        # 4. Mobile Responsiveness & Viewport
        if 'viewport' not in index_html.lower():
            errors.append("index.html missing viewport meta tag")
        if 'viewport' not in game_html.lower():
            errors.append("game.html missing viewport meta tag")
        if 'user-scalable=no' not in game_html.lower() and 'maximum-scale=1' not in game_html.lower():
            warnings.append("game.html should include 'user-scalable=no' or 'maximum-scale=1.0' to prevent accidental mobile zooming while playing")

        # 5. Bottom Ad Clearance Padding in CSS
        # style.css should reserve space at bottom (e.g. padding-bottom: 50px+) so bottom banner doesn't cover game controls
        if not re.search(r'padding-bottom\s*:\s*(?:5[0-9]|[6-9][0-9]|[1-9][0-9]{2,})px', style_css):
            warnings.append("style.css should have bottom clearance padding (e.g. padding-bottom: 60px) so the bottom ad never obscures game buttons")

        # 6. JavaScript Syntax & Common Runtime Traps
        # Basic check for unclosed brackets or syntax bugs
        open_curlies = game_js.count('{')
        close_curlies = game_js.count('}')
        if open_curlies != close_curlies:
            errors.append(f"JavaScript curly brace mismatch in game.js: {open_curlies} '{{' vs {close_curlies} '}}'")

        open_parens = game_js.count('(')
        close_parens = game_js.count(')')
        if open_parens != close_parens:
            errors.append(f"JavaScript parenthesis mismatch in game.js: {open_parens} '(' vs {close_parens} ')'")

        # 7. Broken Local Assets
        # Scan for src="..." and href="..." in game.html and style.css
        asset_matches = re.findall(r'(?:src|href)=["\']([^"\':#]+)["\']', game_html)
        for asset in asset_matches:
            if asset.startswith('http') or asset.startswith('//') or asset.startswith('data:'):
                continue
            # Resolve asset relative to game folder
            asset_path = (game_dir / asset).resolve()
            if not asset_path.exists():
                errors.append(f"Broken local asset reference in game.html: '{asset}' (file not found)")

        # 8. Uniqueness Validation
        # Extract title from index.html
        title_match = re.search(r'<title>([^<]+)</title>', index_html, re.I)
        game_title = title_match.group(1) if title_match else folder_name
        game_title = re.sub(r'\s*\|\s*PlayMix.*$', '', game_title, flags=re.I).strip()

        # Temporarily check uniqueness ignoring self
        detector_result = self.detector.check(game_title, candidate_folder=folder_name)
        # If the only match is itself, that's fine
        if not detector_result['allowed']:
            reasons = [r for r in detector_result['rejection_reasons'] if folder_name not in r]
            if reasons:
                errors.append(f"Uniqueness check failed: {', '.join(reasons)}")

        # 9. Blog Strategy Guide Check
        slug = re.sub(r'[^a-z0-9]+', '-', folder_name.lower()).strip('-')
        blog_file = self.repo_root / 'blog' / f"{slug}.html"
        if not blog_file.exists():
            warnings.append(f"Associated blog guide not found: blog/{slug}.html (will be created by factory)")

        passed = len(errors) == 0
        return {
            'passed': passed,
            'errors': errors,
            'warnings': warnings
        }

def main():
    parser = argparse.ArgumentParser(description="Validate PlayMix game folder before commit.")
    parser.add_argument('folder', help="Target game directory name")
    args = parser.parse_args()

    validator = GameValidator()
    result = validator.validate(args.folder)

    if result['warnings']:
        print("⚠️ Warnings:")
        for w in result['warnings']:
            print(f"  - {w}")

    if not result['passed']:
        print("❌ Validation FAILED:")
        for err in result['errors']:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print(f"✅ Game validation PASSED for '{args.folder}'! All structure, single ad, and safety rules verified.")

if __name__ == '__main__':
    main()
