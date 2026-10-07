#!/usr/bin/env python3
"""
PlayMix Trending Games Generator
Generates and updates https://playmixgames.in/TrendingGames/index.html
by matching genuine Google search trend signals to playable games on PlayMix.

Adheres strictly to:
- Google Search Essentials & Spam Policies (no doorway pages, no keyword stuffing)
- Single stable URL: https://playmixgames.in/TrendingGames/
- Real game inventory verification (data/games.json)
- Strict anti-spam relevance filters (rejection of news, politics, celebrity, crypto)
- Weighted relevance scoring
- Non-destructive error handling & fallback dataset
"""

import os
import sys
import json
import re
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
GAMES_JSON_PATH = REPO_ROOT / 'data' / 'games.json'
FALLBACK_JSON_PATH = REPO_ROOT / 'data' / 'trending-games-fallback.json'
LOG_JSON_PATH = REPO_ROOT / 'data' / 'trending-games-log.json'
OUTPUT_HTML_PATH = REPO_ROOT / 'TrendingGames' / 'index.html'

# Prohibited news / non-gaming categories (HARD REJECTION)
PROHIBITED_TERMS = {
    # Politics & Government
    'election', 'vote', 'voting', 'ballot', 'president', 'prime minister', 'minister',
    'senate', 'senator', 'congress', 'parliament', 'democrat', 'republican', 'gop',
    'biden', 'trump', 'harris', 'modi', 'putin', 'zelensky', 'supreme court',
    'campaign', 'poll', 'governor', 'white house', 'pentagon',
    
    # War & Conflicts
    'war', 'missile', 'attack', 'bomb', 'military', 'army', 'gaza', 'israel', 'hamas',
    'ukraine', 'russia', 'strike', 'ceasefire', 'invasion', 'airstrike', 'terror',

    # Crime & Legal
    'arrest', 'murder', 'killer', 'police', 'shooting', 'custody', 'prison', 'jail',
    'verdict', 'lawsuit', 'indicted', 'crime', 'suspect', 'guilty', 'trial',

    # Celebrity & Entertainment Gossip
    'divorce', 'dating', 'marriage', 'married', 'rumor', 'tmz', 'boyfriend', 'girlfriend',
    'box office', 'actor', 'actress', 'hollywood', 'met gala', 'red carpet', 'grammy',
    'oscar', 'emmy', 'paparazzi', 'scandal',

    # Finance, Stocks & Crypto
    'stock', 'stocks', 'nasdaq', 'dow jones', 's&p', 'crypto', 'bitcoin', 'btc',
    'ethereum', 'shares', 'dividend', 'fed rate', 'interest rate', 'inflation',
    'quarterly revenue', 'ipo', 'earnings report', 'wall street',

    # Disasters & Weather
    'earthquake', 'hurricane', 'cyclone', 'typhoon', 'flood', 'tornado', 'wildfire',
    'tsunami', 'landslide', 'emergency', 'evacuation',

    # Medical & Health News
    'covid', 'vaccine', 'outbreak', 'variant', 'hospital', 'disease', 'cancer',
    'surgery', 'death toll', 'fatal', 'fda approved', 'prescription',

    # Sports News / Trades (distinguish from playable sports games)
    'transfer news', 'injury report', 'press conference', 'contract extension',
    'traded to', 'coach fired', 'manager sacked', 'match highlights', 'score update'
}

# Gaming intent indicator terms
GAMING_INDICATORS = {
    'game', 'games', 'gaming', 'play', 'online', 'puzzle', 'arcade', 'runner',
    'racing', 'simulator', 'crossword', 'solitaire', 'board game', 'card game',
    'unblocked', 'trivia', 'match 3', 'chess', 'sudoku', 'quiz', 'billiards',
    'multiplayer', 'physics', 'shooter', 'slither', 'platformer', 'tetris',
    '2048', 'snake', 'subway', 'pool', 'football', 'soccer', 'pacman', 'dino'
}

def load_game_inventory():
    """Loads and verifies game inventory from data/games.json."""
    if not GAMES_JSON_PATH.exists():
        print("games.json missing, rebuilding...")
        from build_games_inventory import build_inventory
        build_inventory()

    with open(GAMES_JSON_PATH, 'r', encoding='utf-8') as f:
        games = json.load(f)

    # Verify that every game's entry file actually exists on disk
    verified_games = []
    for g in games:
        folder = g['folder']
        entry = g['entry']
        disk_path = REPO_ROOT / folder / entry
        if disk_path.exists():
            verified_games.append(g)
        else:
            print(f"⚠️ Warning: game entry file not found on disk, skipping: {disk_path}")

    print(f"Loaded {len(verified_games)} verified playable games.")
    return verified_games

def fetch_google_trends_rss(regions=('US', 'IN', 'GB', 'CA', 'AU')):
    """Fetches real-time trending search items from Google Trends public Daily Trends RSS."""
    raw_trends = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
    }

    for geo in regions:
        url = f"https://trends.google.com/trending/rss?geo={geo}"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                content = resp.read()
                root = ET.fromstring(content)
                items = root.findall('.//item')
                print(f"Fetched {len(items)} raw trend items for region {geo}")
                for idx, item in enumerate(items):
                    title_el = item.find('title')
                    traffic_el = item.find('{https://trends.google.com/trending/rss}approx_traffic')
                    pubdate_el = item.find('pubDate')

                    # Also extract news snippet if available to understand context
                    news_snippets = []
                    for news in item.findall('{https://trends.google.com/trending/rss}news_item'):
                        news_title = news.find('{https://trends.google.com/trending/rss}news_item_title')
                        if news_title is not None and news_title.text:
                            news_snippets.append(news_title.text)

                    if title_el is not None and title_el.text:
                        raw_trends.append({
                            'query': title_el.text.strip(),
                            'approx_traffic': traffic_el.text.strip() if traffic_el is not None and traffic_el.text else '10,000+',
                            'region': geo,
                            'rank': idx + 1,
                            'pub_date': pubdate_el.text.strip() if pubdate_el is not None and pubdate_el.text else '',
                            'context': " ".join(news_snippets)
                        })
        except Exception as e:
            print(f"Note: Could not fetch Google Trends RSS for {geo}: {e}")

    return raw_trends

def filter_trend(candidate):
    """
    Evaluates candidate query against hard anti-spam and prohibited category filters.
    Returns (is_valid, reason).
    """
    query = candidate['query'].lower()
    context = candidate.get('context', '').lower()
    full_text = f"{query} {context}"

    # 1. Reject prohibited news / non-gaming categories
    for term in PROHIBITED_TERMS:
        # Check boundary match or word match
        pattern = r'\b' + re.escape(term) + r'\b'
        if re.search(pattern, full_text):
            return False, f"Prohibited topic category: '{term}' detected"

    # 2. Check for gaming intent
    has_gaming_intent = False
    for term in GAMING_INDICATORS:
        if re.search(r'\b' + re.escape(term) + r'\b', full_text):
            has_gaming_intent = True
            break

    if not has_gaming_intent:
        return False, "No gaming intent detected in search query"

    # 3. Reject overly short or malformed queries
    if len(query.strip()) < 3:
        return False, "Query too short"

    return True, "Valid gaming trend"

def score_relevance(trend, game, max_traffic=100000):
    """
    Calculates weighted relevance score between a trend query and a PlayMix game.
    Formula: score = 0.40 * (T_k / max_T) + 0.30 * (V_k / max_V) + 0.30 * R_k
    """
    query = trend['query'].lower()
    game_name = game['name'].lower()
    game_keywords = [k.lower() for k in game.get('keywords', [])]
    game_categories = [c.lower() for c in game.get('categories', [])]

    # --- 1. Relevance Factor R_k (0.0 to 1.0) ---
    r_k = 0.0

    # Exact or near-exact game name match
    if game_name in query or query in game_name:
        r_k = 1.0
    # Exact keyword match in game's keyword inventory
    elif any(kw in query or query in kw for kw in game_keywords):
        r_k = 0.85
    # Mechanics or archetype match
    elif any(cat in query for cat in game_categories) and any(w in query for w in ['game', 'online', 'play', '3d']):
        r_k = 0.65
    elif any(kw_part in query for kw in game_keywords for kw_part in kw.split() if len(kw_part) > 3):
        r_k = 0.50
    else:
        r_k = 0.0

    if r_k < 0.50:
        return 0.0, r_k  # Not relevant enough to feature

    # --- 2. Trend Popularity T_k (0.0 to 1.0) ---
    # Inverted rank (rank 1 is highest)
    rank = trend.get('rank', 10)
    t_k = max(0.2, (21 - min(rank, 20)) / 20.0)

    # --- 3. Search Volume V_k (0.0 to 1.0) ---
    raw_traffic_str = trend.get('approx_traffic', '10000')
    digits = re.sub(r'[^0-9]', '', raw_traffic_str)
    traffic_val = int(digits) if digits else 10000
    v_k = min(1.0, traffic_val / float(max_traffic))

    # --- Final Weighted Score ---
    score = 0.40 * t_k + 0.30 * v_k + 0.30 * r_k
    return round(score, 4), r_k

def generate_relevance_explanation(query, game):
    """Generates an honest, non-deceptive, user-first explanation of why this game is relevant."""
    name = game['name']
    genre = game.get('genre', 'browser')
    
    templates = [
        f"Search interest is rising for {query}. You can play {name} instantly on PlayMix with no download required.",
        f"Players searching for {query} will enjoy {name}, featuring fast-paced {genre.lower()} gameplay directly in your browser.",
        f"{name} matches recent player interest in {query}, offering responsive controls and instant WebGL play.",
        f"Looking for {query}? Dive into {name} on PlayMix for an authentic, ad-light {genre.lower()} experience."
    ]
    # Use deterministic hash based on query length for consistency
    idx = len(query) % len(templates)
    return templates[idx]

def get_fallback_results(games_inventory):
    """Loads fallback results from data/trending-games-fallback.json."""
    if not FALLBACK_JSON_PATH.exists():
        return []

    with open(FALLBACK_JSON_PATH, 'r', encoding='utf-8') as f:
        fallback_data = json.load(f)

    folder_map = {g['folder']: g for g in games_inventory}
    results = []

    for item in fallback_data:
        folder = item.get('game_folder')
        if folder in folder_map:
            game = folder_map[folder]
            results.append({
                'trend_topic': item.get('trend_topic', game['name']),
                'search_intent': item.get('search_intent', f"{game['name']} online"),
                'relevance_reason': item.get('relevance_reason', game.get('description', '')),
                'relevance_score': item.get('relevance_score', 0.85),
                'game': game,
                'play_cta': item.get('play_cta', f"Play {game['name']} Online")
            })

    return results

def render_html(selected_items, update_timestamp, is_fallback=False):
    """
    Renders high-quality, mobile-first, semantic HTML for /TrendingGames/index.html
    conforming with all PlayMix visual styles, canonical tags, and schema.org JSON-LD.
    """
    date_display = update_timestamp.strftime("%B %d, %Y")
    iso_date = update_timestamp.strftime("%Y-%m-%d")

    # Build Schema ItemList
    item_list_elements = []
    for idx, item in enumerate(selected_items, start=1):
        g = item['game']
        img_url = f"https://playmixgames.in/{g['image']}" if g['image'] else "https://playmixgames.in/img/192.png"
        item_list_elements.append({
            "@type": "ListItem",
            "position": idx,
            "name": g['name'],
            "url": g['url'],
            "image": img_url,
            "description": item['relevance_reason']
        })

    schema_graph = [
        {
            "@type": "CollectionPage",
            "@id": "https://playmixgames.in/TrendingGames/#webpage",
            "url": "https://playmixgames.in/TrendingGames/",
            "name": "Trending Games Online | PlayMix Games",
            "description": "Discover currently trending browser games and play popular arcade, puzzle, racing, sports and casual games online at PlayMix Games.",
            "isPartOf": {
                "@type": "WebSite",
                "@id": "https://playmixgames.in/#website",
                "name": "PlayMixGames",
                "url": "https://playmixgames.in/"
            },
            "datePublished": "2026-10-02",
            "dateModified": iso_date
        },
        {
            "@type": "BreadcrumbList",
            "@id": "https://playmixgames.in/TrendingGames/#breadcrumb",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://playmixgames.in/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Trending Games",
                    "item": "https://playmixgames.in/TrendingGames/"
                }
            ]
        },
        {
            "@type": "ItemList",
            "@id": "https://playmixgames.in/TrendingGames/#itemlist",
            "name": "Currently Trending Online Games",
            "numberOfItems": len(selected_items),
            "itemListElement": item_list_elements
        }
    ]

    json_ld_str = json.dumps({"@context": "https://schema.org", "@graph": schema_graph}, indent=2)

    # Render Game Cards
    cards_html = []
    for rank, item in enumerate(selected_items, start=1):
        g = item['game']
        topic = item['trend_topic']
        explanation = item['relevance_reason']
        cta = item['play_cta']
        genre = g.get('genre', 'Arcade')
        emoji = g.get('emoji', '🎮')
        image = g.get('image', '')

        # Image or fallback styled icon
        if image and (REPO_ROOT / image).exists():
            media_html = f'''
            <div class="tg-card-img-wrap">
                <img src="../{image}" alt="Play {g['name']} online game" width="220" height="150" loading="lazy" class="tg-card-img" />
                <span class="tg-rank-badge">#{rank}</span>
            </div>'''
        else:
            media_html = f'''
            <div class="tg-card-img-wrap tg-card-fallback-bg" style="background:{g.get('gradient', 'linear-gradient(135deg,#1c1c1e,#2c2c2e)')};">
                <span class="tg-card-emoji">{emoji}</span>
                <span class="tg-rank-badge">#{rank}</span>
            </div>'''

        card = f'''
        <article class="tg-game-card">
            {media_html}
            <div class="tg-card-content">
                <div class="tg-card-meta">
                    <span class="tg-topic-pill"><span class="tg-pulse-dot"></span> Trend: <strong>{topic}</strong></span>
                    <span class="tg-genre-tag">{genre}</span>
                </div>
                <h2 class="tg-game-title"><a href="../{g['folder']}/{g['entry']}">{g['name']}</a></h2>
                <p class="tg-game-desc">{explanation}</p>
                <div class="tg-card-footer">
                    <a href="../{g['folder']}/{g['entry']}" class="as-get-btn tg-play-btn" title="{cta}">{cta} &rarr;</a>
                </div>
            </div>
        </article>'''
        cards_html.append(card)

    cards_block = "\n".join(cards_html)

    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Trending Games Online | PlayMix Games</title>
<meta name="description" content="Discover currently trending browser games and play popular arcade, puzzle, racing, sports and casual games online at PlayMix Games.">
<meta name="robots" content="index, follow">
<meta name="keywords" content="trending games online, popular browser games, free online games no download, trending web games, casual games to play, playmix games">
<link rel="canonical" href="https://playmixgames.in/TrendingGames/">
<link rel="icon" type="image/png" href="../img/192.png">

<!-- Open Graph / Social Sharing -->
<meta property="og:title" content="Trending Games Online | PlayMix Games">
<meta property="og:description" content="Discover currently trending browser games and play popular arcade, puzzle, racing, sports and casual games online at PlayMix Games.">
<meta property="og:url" content="https://playmixgames.in/TrendingGames/">
<meta property="og:type" content="website">
<meta property="og:image" content="https://playmixgames.in/img/600.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Trending Games Online | PlayMix Games">
<meta name="twitter:description" content="Discover currently trending browser games and play popular arcade, puzzle, racing, sports and casual games online at PlayMix Games.">
<meta name="twitter:image" content="https://playmixgames.in/img/600.png">

<!-- Fonts & Design System -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../appstore-style.css">

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json">
{json_ld_str}
</script>

<!-- Scripts -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6129521314653726" crossorigin="anonymous"></script>
<script defer src="../analytics.js" type="module"></script>
<script defer src="../ads.js"></script>

<style>
/* Page-Specific Styles for TrendingGames */
.tg-container {{
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px 16px 60px;
}}
.tg-breadcrumb {{
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: var(--as-text3);
    margin-bottom: 16px;
}}
.tg-breadcrumb a {{
    color: var(--as-text2);
    text-decoration: none;
    transition: color 0.2s;
}}
.tg-breadcrumb a:hover {{
    color: var(--as-blue);
}}
.tg-hero {{
    text-align: left;
    padding: 24px 0 32px;
    border-bottom: 1px solid var(--as-border);
    margin-bottom: 32px;
}}
.tg-hero h1 {{
    font-size: 2.4rem;
    font-weight: 900;
    letter-spacing: -0.03em;
    margin-bottom: 12px;
    background: linear-gradient(135deg, #ffffff 40%, var(--as-text2) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}}
.tg-hero-desc {{
    font-size: 1.15rem;
    color: var(--as-text2);
    max-width: 820px;
    line-height: 1.6;
    margin-bottom: 16px;
}}
.tg-meta-bar {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    font-size: 0.85rem;
    color: var(--as-text3);
}}
.tg-badge-live {{
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(48, 209, 88, 0.15);
    color: var(--as-green);
    border: 1px solid rgba(48, 209, 88, 0.3);
    border-radius: 20px;
    font-weight: 600;
}}
.tg-pulse-dot {{
    width: 8px;
    height: 8px;
    background-color: var(--as-green);
    border-radius: 50%;
    display: inline-block;
    box-shadow: 0 0 0 0 rgba(48, 209, 88, 0.7);
    animation: tgPulse 2s infinite;
}}
@keyframes tgPulse {{
    0% {{ box-shadow: 0 0 0 0 rgba(48, 209, 88, 0.7); }}
    70% {{ box-shadow: 0 0 0 6px rgba(48, 209, 88, 0); }}
    100% {{ box-shadow: 0 0 0 0 rgba(48, 209, 88, 0); }}
}}
.tg-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
    margin-bottom: 48px;
}}
.tg-game-card {{
    background: var(--as-card);
    border: 1px solid var(--as-border);
    border-radius: var(--as-radius);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}}
.tg-game-card:hover {{
    transform: translateY(-3px);
    border-color: rgba(255,255,255,0.2);
    box-shadow: 0 12px 28px rgba(0,0,0,0.5);
}}
.tg-card-img-wrap {{
    position: relative;
    width: 100%;
    height: 180px;
    background: var(--as-bg2);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}}
.tg-card-img {{
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}}
.tg-card-fallback-bg {{
    display: flex;
    align-items: center;
    justify-content: center;
}}
.tg-card-emoji {{
    font-size: 4rem;
}}
.tg-rank-badge {{
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #ffd60a;
    font-weight: 800;
    font-size: 0.85rem;
    padding: 4px 10px;
    border-radius: 8px;
    border: 1px solid rgba(255, 214, 10, 0.3);
}}
.tg-card-content {{
    padding: 18px 20px 20px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}}
.tg-card-meta {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
}}
.tg-topic-pill {{
    font-size: 0.8rem;
    color: var(--as-blue-lt);
    background: rgba(10, 132, 255, 0.12);
    padding: 3px 8px;
    border-radius: 6px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}}
.tg-genre-tag {{
    font-size: 0.75rem;
    color: var(--as-text3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
}}
.tg-game-title {{
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 8px;
    line-height: 1.3;
}}
.tg-game-title a {{
    color: var(--as-text);
    text-decoration: none;
}}
.tg-game-title a:hover {{
    color: var(--as-blue);
}}
.tg-game-desc {{
    font-size: 0.95rem;
    color: var(--as-text2);
    line-height: 1.5;
    margin-bottom: 16px;
    flex-grow: 1;
}}
.tg-card-footer {{
    margin-top: auto;
    display: flex;
    align-items: center;
}}
.tg-play-btn {{
    width: 100%;
    text-align: center;
    display: block;
    text-decoration: none;
    padding: 10px 16px;
    font-size: 0.9rem;
    font-weight: 700;
}}
.tg-info-section {{
    background: var(--as-bg2);
    border: 1px solid var(--as-border);
    border-radius: var(--as-radius);
    padding: 32px 24px;
    margin-bottom: 32px;
}}
.tg-info-section h2 {{
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 16px;
    color: var(--as-text);
}}
.tg-category-pills {{
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
}}
.tg-cat-pill {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--as-bg3);
    color: var(--as-text2);
    border-radius: 12px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s;
}}
.tg-cat-pill:hover {{
    background: var(--as-blue);
    color: #ffffff;
}}
.tg-features-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-top: 24px;
}}
.tg-feature-card {{
    background: var(--as-card);
    border: 1px solid var(--as-border);
    border-radius: var(--as-radius-sm);
    padding: 20px;
}}
.tg-feature-card h3 {{
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}}
.tg-feature-card p {{
    font-size: 0.9rem;
    color: var(--as-text3);
    line-height: 1.5;
}}
@media (max-width: 640px) {{
    .tg-hero h1 {{ font-size: 1.8rem; }}
    .tg-hero-desc {{ font-size: 1rem; }}
    .tg-grid {{ grid-template-columns: 1fr; }}
}}
</style>
</head>

<body class="as-body">

<!-- Ad slots -->
<div id="adsterra-banner" class="pmg-side-ad"></div>
<div id="bottom-ad" class="pmg-bottom-ad"></div>

<!-- HEADER -->
<header class="as-header">
  <a href="../index.html" class="as-header-logo">PlayMix</a>

  <div class="as-desktop-tabs">
    <a href="../index.html" class="as-desktop-tab-btn" style="text-decoration:none;">🎮 Games</a>
    <a href="index.html" class="as-desktop-tab-btn active" style="text-decoration:none;">🔥 Trending</a>
  </div>

  <div class="as-header-search">
    <span class="as-header-search-icon">🔍</span>
    <input type="text" placeholder="Search PlayMix games…" autocomplete="off" onfocus="location.href='../index.html'">
  </div>
</header>

<!-- MAIN CONTENT -->
<main class="tg-container">

    <!-- BREADCRUMB -->
    <nav class="tg-breadcrumb" aria-label="Breadcrumb">
        <a href="../index.html">Home</a>
        <span>&rsaquo;</span>
        <span aria-current="page">Trending Games</span>
    </nav>

    <!-- HERO HEADER -->
    <header class="tg-hero">
        <h1>Trending Games</h1>
        <p class="tg-hero-desc">Discover games currently gaining interest and popular browser games you can play on Playmixgames.in. Free online play, zero downloads, and instant loading on any mobile, tablet, or desktop device.</p>
        <div class="tg-meta-bar">
            <span class="tg-badge-live"><span class="tg-pulse-dot"></span> Freshly Curated</span>
            <span>Last updated: <strong>{date_display}</strong></span>
            <span>&bull;</span>
            <span>{len(selected_items)} Games Featured</span>
            <span>&bull;</span>
            <span>100% Free Browser Play</span>
        </div>
    </header>

    <!-- TRENDING SECTION -->
    <section>
        <div class="as-section-header" style="margin-bottom: 20px;">
            <h2 class="as-section-title" style="font-size: 1.5rem; font-weight: 800;">🔥 Trending Right Now</h2>
        </div>

        <div class="tg-grid">
{cards_block}
        </div>
    </section>

    <!-- BROWSE CATEGORIES -->
    <section class="tg-info-section">
        <h2>Explore Trending Categories on PlayMix</h2>
        <p style="color:var(--as-text2); line-height:1.5;">Jump straight into your favorite game style. Every category features lightweight, responsive WebGL and HTML5 web games ready to play in seconds.</p>
        <div class="tg-category-pills">
            <a href="../index.html" class="tg-cat-pill">🎮 Action & Arcade</a>
            <a href="../index.html" class="tg-cat-pill">🧩 Puzzle & Logic</a>
            <a href="../index.html" class="tg-cat-pill">⚽ Sports & Racing</a>
            <a href="../index.html" class="tg-cat-pill">♟️ Board & Classic</a>
            <a href="../index.html" class="tg-cat-pill">🧠 Quizzes & Trivia</a>
        </div>
    </section>

    <!-- VALUE PILLARS -->
    <section class="tg-info-section">
        <h2>Why Play Trending Games on PlayMix?</h2>
        <div class="tg-features-grid">
            <div class="tg-feature-card">
                <h3>⚡ Instant Browser Play</h3>
                <p>No downloads, app stores, or file installations. Click any game to start playing immediately in your web browser.</p>
            </div>
            <div class="tg-feature-card">
                <h3>📱 Optimized for Mobile & PWA</h3>
                <p>Smooth responsive touch controls and WebGL graphics optimized for quick sessions on iPhone, Android, tablets, and desktop.</p>
            </div>
            <div class="tg-feature-card">
                <h3>🛡️ Safe, Clean & Distraction-Free</h3>
                <p>Curated titles verified for performance and user safety. No intrusive popups or disruptive software requirements.</p>
            </div>
        </div>
    </section>

    <!-- FREQUENTLY ASKED QUESTIONS -->
    <section class="tg-info-section" style="margin-bottom: 0;">
        <h2>Frequently Asked Questions</h2>
        <div style="display:flex; flex-direction:column; gap:16px; margin-top:16px;">
            <div>
                <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:4px; color:var(--as-text);">How are trending games selected?</h3>
                <p style="font-size:0.92rem; color:var(--as-text2); line-height:1.5;">We monitor genuine online search interest and player trends across gaming topics, then match those signals with real, verified games available in the PlayMix library.</p>
            </div>
            <div>
                <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:4px; color:var(--as-text);">Are all games free to play?</h3>
                <p style="font-size:0.92rem; color:var(--as-text2); line-height:1.5;">Yes. All games featured on PlayMix are 100% free to play directly in your web browser with no subscriptions or mandatory registration.</p>
            </div>
            <div>
                <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:4px; color:var(--as-text);">How often is this page updated?</h3>
                <p style="font-size:0.92rem; color:var(--as-text2); line-height:1.5;">Our automated discovery pipeline refreshes trend indicators regularly to keep recommendations fresh, relevant, and engaging.</p>
            </div>
        </div>
    </section>

</main>

<!-- FOOTER -->
<footer class="as-footer">
  <div class="as-footer-links">
    <a href="../index.html">Home</a>
    <a href="index.html">Trending Games</a>
    <a href="../about.html">About</a>
    <a href="../privacy.html">Privacy Policy</a>
    <a href="../terms.html">Terms of Service</a>
    <a href="../licenses.html">Licenses</a>
    <a href="../contact.html">Contact</a>
  </div>
  <p class="as-footer-copy">&copy; 2026 PlayMixGames. All rights reserved.</p>
</footer>

<script>
window.addEventListener('load', function () {{
  if (typeof prepSystem === 'function') prepSystem();
}});
</script>
</body>
</html>
'''
    return html_content

def has_meaningful_change(existing_html, new_items):
    """
    Compares the core featured games in existing HTML with new items.
    Prevents empty daily commits if the list of featured games has not changed.
    """
    if not existing_html:
        return True

    # Extract existing game links
    existing_links = re.findall(r'href=["\']\.\./([^"\']+/index\.html|[^"\']+/game\.html)["\']', existing_html)
    new_links = [f"{item['game']['folder']}/{item['game']['entry']}" for item in new_items]

    # Compare set of featured game links
    return set(existing_links[:len(new_items)]) != set(new_links)

def update_trending_games():
    """Main pipeline execution."""
    print("=" * 60)
    print("Starting PlayMix Trending Games Pipeline")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    # 1. Load game inventory
    games_inventory = load_game_inventory()
    if not games_inventory:
        print("❌ Error: No games found in inventory. Exiting.")
        sys.exit(1)

    # 2. Fetch raw trends from Google Trends RSS
    print("\n[Step 1] Fetching live Google Trends signals...")
    raw_trends = fetch_google_trends_rss()
    print(f"Total raw trends collected: {len(raw_trends)}")

    # 3. Filter trends through strict relevance & anti-spam rules
    print("\n[Step 2] Applying hard anti-spam & gaming filters...")
    qualified_trends = []
    rejected_trends = []

    for cand in raw_trends:
        is_valid, reason = filter_trend(cand)
        if is_valid:
            qualified_trends.append(cand)
        else:
            rejected_trends.append({'query': cand['query'], 'reason': reason})

    print(f"Qualified gaming trends: {len(qualified_trends)}, Rejected: {len(rejected_trends)}")

    # 4. Score and match trends to PlayMix games
    print("\n[Step 3] Scoring relevance against PlayMix catalog...")
    scored_candidates = []
    seen_games = set()

    for trend in qualified_trends:
        best_game = None
        best_score = 0.0

        for game in games_inventory:
            score, r_k = score_relevance(trend, game)
            if score > best_score:
                best_score = score
                best_game = game

        # Minimum relevance threshold (0.45 score & matching game)
        if best_game and best_score >= 0.45:
            # Deduplicate by game: keep highest scoring trend per game
            if best_game['folder'] not in seen_games:
                seen_games.add(best_game['folder'])
                scored_candidates.append({
                    'trend_topic': trend['query'].title(),
                    'search_intent': trend['query'],
                    'relevance_reason': generate_relevance_explanation(trend['query'], best_game),
                    'relevance_score': best_score,
                    'game': best_game,
                    'play_cta': best_game.get('play_cta') or f"Play {best_game['name']} Online"
                })

    scored_candidates.sort(key=lambda x: x['relevance_score'], reverse=True)
    selected_items = scored_candidates[:12] # Publish 5 to 12 top trends

    # 5. Fallback determination (Requirement 20 & 28)
    data_source = "google_trends_rss"
    if len(selected_items) < 3:
        print("⚠️ Notice: Fewer than 3 valid gaming trends from live feed. Activating stable fallback dataset...")
        selected_items = get_fallback_results(games_inventory)
        data_source = "fallback"

    print(f"Selected {len(selected_items)} games to publish (Source: {data_source}).")
    for idx, item in enumerate(selected_items, start=1):
        print(f"  {idx}. [{item['relevance_score']}] {item['trend_topic']} -> {item['game']['name']} ({item['game']['folder']})")

    # 6. Check for meaningful change
    existing_html = OUTPUT_HTML_PATH.read_text(encoding='utf-8') if OUTPUT_HTML_PATH.exists() else ""
    now_dt = datetime.now(timezone.utc)

    if existing_html and not has_meaningful_change(existing_html, selected_items):
        print("\nℹ️ No meaningful change detected in featured games. Preserving existing HTML to prevent redundant commits.")
        content_changed = False
    else:
        # Generate new HTML
        new_html = render_html(selected_items, now_dt, is_fallback=(data_source == "fallback"))
        OUTPUT_HTML_PATH.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_HTML_PATH.write_text(new_html, encoding='utf-8')
        print(f"\n✅ Successfully generated {OUTPUT_HTML_PATH}")
        content_changed = True

    # 7. Write execution log (Requirement 27)
    log_entry = {
        "update_timestamp": now_dt.isoformat(),
        "data_source": data_source,
        "content_changed": content_changed,
        "total_raw_trends": len(raw_trends),
        "qualified_gaming_trends": len(qualified_trends),
        "rejected_count": len(rejected_trends),
        "selected_count": len(selected_items),
        "selected_trends": [
            {
                "topic": it['trend_topic'],
                "game_name": it['game']['name'],
                "game_folder": it['game']['folder'],
                "url": it['game']['url'],
                "score": it['relevance_score']
            }
            for it in selected_items
        ],
        "sample_rejected_trends": rejected_trends[:15],
        "error_status": None
    }

    LOG_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(log_entry, f, indent=2)
    print(f"✅ Log written to {LOG_JSON_PATH}")

    return content_changed

if __name__ == '__main__':
    try:
        update_trending_games()
    except Exception as e:
        print(f"❌ Pipeline encountered error: {e}", file=sys.stderr)
        # Log error gracefully without destroying existing files
        try:
            err_log = {
                "update_timestamp": datetime.now(timezone.utc).isoformat(),
                "error_status": str(e),
                "data_source": "error"
            }
            with open(LOG_JSON_PATH, 'w', encoding='utf-8') as f:
                json.dump(err_log, f, indent=2)
        except Exception:
            pass
        sys.exit(1)
