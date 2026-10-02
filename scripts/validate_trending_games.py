#!/usr/bin/env python3
"""
PlayMix Trending Games Validation Suite
Enforces quality, SEO integrity, structured data correctness,
and anti-spam standards on /TrendingGames/index.html.

Exits with code 0 on success, code 1 on failure.
"""

import sys
import os
import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TG_HTML_PATH = REPO_ROOT / 'TrendingGames' / 'index.html'
LOG_PATH = REPO_ROOT / 'data' / 'trending-games-log.json'
EXPECTED_CANONICAL = "https://playmixgames.in/TrendingGames/"

PROHIBITED_TERMS = [
    'election', 'vote', 'ballot', 'president', 'prime minister', 'senate', 'congress',
    'biden', 'trump', 'harris', 'modi', 'putin', 'zelensky',
    'war', 'missile', 'attack', 'bomb', 'military', 'army', 'gaza', 'israel', 'ukraine',
    'arrest', 'murder', 'killer', 'police', 'shooting', 'custody', 'prison', 'jail',
    'divorce', 'dating', 'marriage', 'tmz', 'box office', 'hollywood',
    'stock', 'stocks', 'nasdaq', 'dow jones', 'crypto', 'bitcoin', 'btc', 'ethereum',
    'earthquake', 'hurricane', 'cyclone', 'flood', 'tornado', 'wildfire',
    'covid', 'vaccine', 'outbreak', 'hospital', 'disease', 'cancer',
    '#1 game in the world', 'most searched game in the world', 'millions of people are searching'
]

def validate():
    print("=" * 60)
    print("Running PlayMix Trending Games Validation Suite")
    print("=" * 60)

    errors = []
    warnings = []

    # Check 1: TrendingGames/index.html exists and is not empty
    if not TG_HTML_PATH.exists():
        errors.append(f"TrendingGames/index.html is missing at {TG_HTML_PATH}")
        return False, errors, warnings
    
    html = TG_HTML_PATH.read_text(encoding='utf-8')
    if len(html.strip()) < 1000:
        errors.append("TrendingGames/index.html is unexpectedly small (< 1000 bytes).")

    # Check 2: Canonical URL check
    canonical_match = re.search(r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']', html, re.I)
    if not canonical_match:
        # Check reverse order of attributes
        canonical_match = re.search(r'<link[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\']canonical["\']', html, re.I)

    if not canonical_match:
        errors.append("Canonical tag is missing from <head>.")
    elif canonical_match.group(1).strip() != EXPECTED_CANONICAL:
        errors.append(f"Canonical URL mismatch: Expected '{EXPECTED_CANONICAL}', found '{canonical_match.group(1)}'")
    else:
        print("✓ Canonical URL validated: https://playmixgames.in/TrendingGames/")

    # Check 3: Robots tag check (MUST NOT contain noindex)
    robots_match = re.search(r'<meta[^>]*name=["\']robots["\'][^>]*content=["\']([^"\']+)["\']', html, re.I)
    if robots_match:
        content = robots_match.group(1).lower()
        if 'noindex' in content:
            errors.append(f"CRITICAL: Accidental 'noindex' found in robots directive: '{content}'")
        else:
            print(f"✓ Robots meta directive valid: '{content}'")
    else:
        warnings.append("No explicit robots meta tag found (default is index, follow, but explicit is better).")

    # Check 4: Check title and description
    title_match = re.search(r'<title>([^<]+)</title>', html, re.I)
    if not title_match or not title_match.group(1).strip():
        errors.append("Missing or empty <title> tag.")
    else:
        title = title_match.group(1).strip()
        print(f"✓ Title valid: '{title}' ({len(title)} chars)")
        if len(title) > 75:
            warnings.append(f"Title is slightly long ({len(title)} chars): consider <= 60 chars.")

    desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', html, re.I)
    if not desc_match or not desc_match.group(1).strip():
        errors.append("Missing or empty meta description.")
    else:
        desc = desc_match.group(1).strip()
        print(f"✓ Meta description valid ({len(desc)} chars)")

    # Check 5: Game URLs verification on disk
    game_links = re.findall(r'href=["\']\.\./([^"\']+/index\.html|[^"\']+/game\.html)["\']', html)
    if not game_links:
        errors.append("No game links matching '../<Folder>/index.html' found in page.")
    else:
        unique_games = set()
        broken_links = []
        for gl in game_links:
            disk_target = REPO_ROOT / gl
            if not disk_target.exists():
                broken_links.append(gl)
            unique_games.add(gl)

        if broken_links:
            errors.append(f"Broken game links detected: {broken_links}")
        else:
            print(f"✓ All {len(game_links)} game links ({len(unique_games)} unique games) verified to exist on disk.")

        if len(unique_games) < 3:
            errors.append(f"Fewer than 3 unique games found on page (found {len(unique_games)}).")
        elif len(unique_games) > 20:
            warnings.append(f"More than 20 games featured ({len(unique_games)}). Recommended is 5-15.")

    # Check 6: Duplicate card titles / game entries
    article_titles = re.findall(r'<h2 class="tg-game-title"><a[^>]*>([^<]+)</a></h2>', html)
    if len(article_titles) != len(set(article_titles)):
        dupes = [t for t in article_titles if article_titles.count(t) > 1]
        errors.append(f"Duplicate game card entries found on page: {set(dupes)}")
    else:
        print(f"✓ Zero duplicate game entries found ({len(article_titles)} unique game cards).")

    # Check 7: JSON-LD Structured Data Validation
    json_ld_blocks = re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.DOTALL)
    if not json_ld_blocks:
        errors.append("No application/ld+json structured data block found in HTML.")
    else:
        for idx, block in enumerate(json_ld_blocks, start=1):
            try:
                data = json.loads(block.strip())
                print(f"✓ JSON-LD block #{idx} parsed successfully as valid JSON.")
                
                # Check for @graph or direct schema
                nodes = data.get('@graph', [data])
                types = [n.get('@type') for n in nodes if isinstance(n, dict)]
                print(f"  Schema types identified: {types}")
                
                if 'CollectionPage' not in types and 'WebPage' not in types:
                    warnings.append("Expected CollectionPage or WebPage schema in JSON-LD.")
                if 'ItemList' not in types:
                    warnings.append("Expected ItemList schema in JSON-LD.")

            except Exception as e:
                errors.append(f"Malformed JSON in application/ld+json block #{idx}: {e}")

    # Check 8: Prohibited categories / keyword spam check
    prohibited_found = []
    html_lower = html.lower()
    for term in PROHIBITED_TERMS:
        pattern = r'\b' + re.escape(term) + r'\b'
        if re.search(pattern, html_lower):
            # Only error if found in the main content / cards, ignore if in script or legal footer
            cards_section = re.search(r'<div class="tg-grid">(.*?)</div>', html, re.DOTALL)
            if cards_section and re.search(pattern, cards_section.group(1).lower()):
                prohibited_found.append(term)

    if prohibited_found:
        errors.append(f"Prohibited non-gaming/news terms found in featured cards: {prohibited_found}")
    else:
        print("✓ Zero prohibited terms detected in featured content.")

    # Check 9: Verify data/trending-games-log.json exists and is valid JSON
    if not LOG_PATH.exists():
        errors.append(f"Log file missing: {LOG_PATH}")
    else:
        try:
            with open(LOG_PATH, 'r', encoding='utf-8') as f:
                log_data = json.load(f)
            if 'update_timestamp' not in log_data or 'selected_count' not in log_data:
                errors.append("trending-games-log.json is missing required fields.")
            else:
                print(f"✓ Log validated (Source: {log_data.get('data_source')}, {log_data.get('selected_count')} items).")
        except Exception as e:
            errors.append(f"Error parsing trending-games-log.json: {e}")

    # Results summary
    print("\nValidation Results:")
    print(f"  Errors:   {len(errors)}")
    print(f"  Warnings: {len(warnings)}")

    if warnings:
        print("\nWarnings:")
        for w in warnings:
            print(f"  ⚠️  {w}")

    if errors:
        print("\nErrors:")
        for e in errors:
            print(f"  ❌ {e}")
        return False

    print("\n✅ ALL VALIDATION CHECKS PASSED PERFECTLY!\n")
    return True

if __name__ == '__main__':
    success = validate()
    sys.exit(0 if success else 1)
