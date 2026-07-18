#!/usr/bin/env python3
import os
import re
import sys
import json
import time
import ast
from pathlib import Path
import urllib.parse
from dotenv import load_dotenv

# Load env variables from current directory or parent
load_dotenv()
load_dotenv(Path(__file__).parent / ".env")

try:
    import google.generativeai as genai
    HAS_SDK = True
except ImportError:
    HAS_SDK = False

BASE_DIR = Path(__file__).parent.resolve()
BLOG_DIR = BASE_DIR / "blog"
SITEMAP_PATH = BASE_DIR / "sitemap.xml"

# Map category IDs to names & default emojis
CAT_META = {
    "action": {"name": "Action & Arcade", "emoji": "🎮"},
    "sports": {"name": "Sports Games", "emoji": "⚽"},
    "puzzle": {"name": "Puzzle & Brain", "emoji": "🧩"},
    "board": {"name": "Board & Classic", "emoji": "♟"},
    "quiz": {"name": "Quizzes & Tests", "emoji": "🧠"},
    "reels": {"name": "Wisdom & Reels", "emoji": "📜"}
}

def load_seo_data():
    """Extract games_seo dictionary from seo_updater.py"""
    seo_file = BASE_DIR / "seo_updater.py"
    if not seo_file.exists():
        print("⚠️  Warning: seo_updater.py not found. Fallback title/desc will be used.")
        return {}
    
    try:
        with open(seo_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Find games_seo dictionary block using regex and parse with ast.literal_eval
        match = re.search(r'games_seo\s*=\s*(\{.*?\n\s*\})', content, re.DOTALL)
        if match:
            dict_str = match.group(1)
            # Evaluate as safe python literal
            return ast.literal_eval(dict_str)
    except Exception as e:
        print(f"⚠️  Error parsing seo_updater.py metadata: {e}")
    return {}

def slugify(name):
    """Generate clean URL slug for a game name"""
    # Replace special characters and spaces
    name = name.lower()
    name = name.replace("&", "and")
    name = re.sub(r'[^a-z0-9\s-]', '', name)
    name = re.sub(r'[\s_]+', '-', name)
    return name.strip('-')

def parse_games_data():
    """Parse games-data.js to extract all unique games and their category details"""
    js_file = BASE_DIR / "games-data.js"
    if not js_file.exists():
        print("❌ Error: games-data.js not found in current directory.")
        sys.exit(1)
        
    with open(js_file, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Find all sections blocks
    # We will search for sections: [ ... ] and parse the items
    sections_match = re.search(r'sections:\s*\[(.*?)\]\s*,\s*featured:', content, re.DOTALL)
    if not sections_match:
        sections_match = re.search(r'sections:\s*\[(.*?)\]\s*\}\s*;?\s*$', content, re.DOTALL)
        
    if not sections_match:
        print("❌ Could not parse sections block from games-data.js")
        sys.exit(1)
        
    sections_content = sections_match.group(1)
    
    # Split into individual section items
    sections = re.findall(r'\{\s*id:\s*["\'](.*?)["\'],\s*title:\s*["\'](.*?)["\'],.*?items:\s*\[(.*?)\]\s*\}', sections_content, re.DOTALL)
    
    games = {}
    for cat_id, title, items_str in sections:
        # Find all game items in this section
        items = re.findall(r'\{\s*name:\s*["\'](.*?)["\'],\s*genre:\s*["\'](.*?)["\'],\s*(?:icon:\s*["\'](.*?)["\'],\s*)?href:\s*["\'](.*?)["\'],\s*(?:badge:\s*["\'](.*?)["\'],\s*)?emoji:\s*["\'](.*?)["\']\s*\}', items_str)
        
        for name, genre, icon, href, badge, emoji in items:
            # Map clean folder slug
            folder_slug = href.split('/')[0]
            url_slug = slugify(name)
            
            # Skip duplicate entries in terms of unique slug
            if url_slug in games:
                continue
                
            games[url_slug] = {
                "name": name,
                "genre": genre,
                "icon": icon or "",
                "href": href,
                "badge": badge or "",
                "emoji": emoji or "🎮",
                "folder_slug": folder_slug,
                "category_id": cat_id,
                "category_name": CAT_META.get(cat_id, {}).get("name", title),
                "url_slug": url_slug
            }
            
    return games

def get_thumbnail(game):
    """Find appropriate thumbnail for a game"""
    if game["icon"] and os.path.exists(BASE_DIR / game["icon"]):
        return game["icon"]
    
    # Check in game folder
    folder = BASE_DIR / game["folder_slug"]
    if folder.exists():
        for ext in [".png", ".jpg", ".jpeg", ".webp"]:
            thumb = folder / f"thumbnail{ext}"
            if thumb.exists():
                return f"{game['folder_slug']}/thumbnail{ext}"
            # Check for stack3d.png or similar naming
            for f in folder.glob(f"*{ext}"):
                if "thumb" in f.name.lower() or f.name.lower() == f"{game['folder_slug'].lower()}{ext}":
                    return f"{game['folder_slug']}/{f.name}"
                    
    # Fallback to default
    return "img/192.png"

def get_related_games(current_game, all_games, count=4):
    """Get 3-5 related games in the same category or related category"""
    same_cat = [g for g in all_games.values() if g["url_slug"] != current_game["url_slug"] and g["category_id"] == current_game["category_id"]]
    other_cat = [g for g in all_games.values() if g["url_slug"] != current_game["url_slug"] and g["category_id"] != current_game["category_id"]]
    
    # Pick from same category first, fill up with others if needed
    related = same_cat[:count]
    if len(related) < count:
        related += other_cat[:(count - len(related))]
        
    return related

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{seo_title} | PlayMixGames</title>
    <meta name="description" content="{seo_description}">
    <link rel="icon" type="image/png" href="../img/192.png">
    <link rel="canonical" href="https://playmixgames.in/blog/{slug}.html">
    <link rel="stylesheet" href="../portal-style.css">
    
    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://playmixgames.in/blog/{slug}.html">
    <meta property="og:title" content="{seo_title}">
    <meta property="og:description" content="{seo_description}">
    <meta property="og:image" content="https://playmixgames.in/{thumbnail_path}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="{seo_title}">
    <meta property="twitter:description" content="{seo_description}">
    <meta property="twitter:image" content="https://playmixgames.in/{thumbnail_path}">

    <!-- Schemas -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "{seo_title}",
      "description": "{seo_description}",
      "image": "https://playmixgames.in/{thumbnail_path}",
      "author": {{
        "@type": "Organization",
        "name": "PlayMixGames",
        "url": "https://playmixgames.in"
      }},
      "publisher": {{
        "@type": "Organization",
        "name": "PlayMixGames",
        "logo": {{
          "@type": "ImageObject",
          "url": "https://playmixgames.in/img/192.png"
        }}
      }},
      "mainEntityOfPage": {{
        "@type": "WebPage",
        "@id": "https://playmixgames.in/blog/{slug}.html"
      }}
    }}
    </script>

    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{{
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://playmixgames.in/"
      }},{{
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://playmixgames.in/blog/index.html"
      }},{{
        "@type": "ListItem",
        "position": 3,
        "name": "{game_name}",
        "item": "https://playmixgames.in/blog/{slug}.html"
      }}]
    }}
    </script>
    
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6129521314653726" crossorigin="anonymous"></script>
    <script type="module" src="../analytics.js"></script>
    <script defer src="../ads.js"></script>

    <style>
        .blog-content {{
            max-width: 800px;
            margin: 100px auto 40px;
            padding: 0 20px;
            line-height: 1.8;
            font-family: 'Outfit', sans-serif;
            color: #cbd5e1;
        }}
        .blog-content h1 {{ 
            font-size: 2.8rem; 
            font-weight: 900; 
            color: #ffffff; 
            margin-bottom: 20px; 
        }}
        .blog-content h2 {{ 
            font-size: 1.8rem; 
            font-weight: 800; 
            color: #38bdf8; 
            margin-top: 40px; 
            margin-bottom: 15px; 
            border-bottom: 1px solid rgba(255,255,255,0.1); 
            padding-bottom: 8px; 
        }}
        .blog-content h3 {{ 
            font-size: 1.3rem; 
            font-weight: 700; 
            color: #60a5fa; 
            margin-top: 30px; 
            margin-bottom: 10px; 
        }}
        .blog-content p {{ 
            margin-bottom: 20px; 
        }}
        .blog-content ul, .blog-content ol {{
            margin-bottom: 20px;
            padding-left: 25px;
        }}
        .blog-content li {{
            margin-bottom: 10px;
        }}
        .blog-content strong {{
            color: #ffffff;
        }}
        
        /* Premium Play In Browser Box */
        .play-hero-box {{
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            margin: 30px 0;
            backdrop-filter: blur(10px);
        }}
        .play-hero-info {{
            display: flex;
            align-items: center;
            gap: 15px;
        }}
        .play-hero-emoji {{
            font-size: 2.8rem;
        }}
        .play-hero-info h2 {{
            margin: 0 !important;
            font-size: 1.4rem !important;
            font-weight: 800;
            color: #ffffff !important;
            border: none !important;
            padding: 0 !important;
        }}
        .play-hero-info p {{
            margin: 5px 0 0 0 !important;
            font-size: 0.9rem;
            color: #94a3b8;
        }}
        .play-hero-btn {{
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: #ffffff;
            font-weight: 700;
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            white-space: nowrap;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }}
        .play-hero-btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }}
        
        .game-thumb {{ 
            width: 100%; 
            max-width: 400px; 
            border-radius: 16px; 
            margin: 20px 0; 
            border: 1px solid rgba(255,255,255,0.1); 
        }}
        .play-btn-cta {{ 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
            color: #ffffff; 
            font-weight: 800; 
            padding: 15px 30px; 
            border-radius: 12px; 
            text-decoration: none; 
            margin: 30px 0; 
            box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3); 
        }}
        .play-btn-cta:hover {{ 
            transform: translateY(-2px); 
            box-shadow: 0 15px 30px rgba(59, 130, 246, 0.5); 
        }}
        .related-section {{ 
            background: #0f172a; 
            padding: 25px; 
            border-radius: 16px; 
            margin-top: 40px; 
            border: 1px solid rgba(255,255,255,0.05); 
        }}
        .related-grid {{ 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
            gap: 15px; 
            margin-top: 15px; 
        }}
        .related-card {{ 
            background: #1e293b; 
            padding: 15px; 
            border-radius: 12px; 
            text-decoration: none; 
            color: #fff; 
            text-align: center; 
            border: 1px solid rgba(255,255,255,0.05); 
            display: block; 
            transition: transform 0.2s, border-color 0.2s;
        }}
        .related-card:hover {{ 
            border-color: #38bdf8; 
            transform: translateY(-3px);
        }}
        .related-card span {{
            font-size: 2.2rem;
            display: block;
            margin-bottom: 8px;
        }}
        .related-card p {{
            margin: 0;
            font-size: 0.9rem;
            font-weight: 600;
        }}
        .adsterra-slot {{ 
            margin: 40px 0; 
            display: flex; 
            justify-content: center; 
        }}
        
        @media (max-width: 650px) {{
            .play-hero-box {{
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }}
            .play-hero-info {{
                flex-direction: column;
            }}
            .play-hero-btn {{
                text-align: center;
            }}
            .blog-content h1 {{
                font-size: 2.2rem;
            }}
            .blog-content {{
                margin-top: 80px;
            }}
        }}
    </style>
</head>
<body class="as-body">
    <header class="as-header">
        <a href="../index.html" class="as-header-logo">PlayMix</a>
    </header>

    <main class="blog-content">
        <h1>{game_name}</h1>
        
        <!-- App-Store Style Play Hero Box -->
        <div class="play-hero-box">
            <div class="play-hero-info">
                <span class="play-hero-emoji">{game_emoji}</span>
                <div>
                    <h2>Play {game_name} Online</h2>
                    <p>Instant Play in Browser • No Downloads • 100% Free</p>
                </div>
            </div>
            <a href="https://playmixgames.in/{game_href}" class="play-hero-btn">Play in Browser Now →</a>
        </div>

        <img class="game-thumb" src="../{thumbnail_path}" alt="{game_name} gameplay cover thumbnail screenshot">
        
        {generated_article_body}

        <div style="text-align: center; margin-top: 40px;">
            <a href="https://playmixgames.in/{game_href}" class="play-btn-cta">Play {game_name} Instantly on PlayMix Games</a>
        </div>

        <!-- Adsterra slot -->
        <div class="adsterra-slot">
            <div id="container-63208462c4f9ec6018b4ea2e1903489d"></div>
        </div>

        <!-- Related Games -->
        <div class="related-section">
            <h3>Related Games you might like:</h3>
            <div class="related-grid">{related_cards}</div>
        </div>
    </main>

    <footer class="as-footer">
        <div class="as-footer-links">
            <a href="../index.html">Home</a>
            <a href="../about.html">About</a>
            <a href="../privacy.html">Privacy Policy</a>
            <a href="../terms.html">Terms of Service</a>
            <a href="../contact.html">Contact</a>
        </div>
        <p class="as-footer-copy">© 2026 PlayMixGames. All rights reserved.</p>
    </footer>
</body>
</html>
"""

def generate_article_gemini(game_name, genre, category, model_api):
    """Use Gemini API to generate the article body content in clean HTML format"""
    prompt = f"""
You are an expert gaming writer and SEO specialist. Write a comprehensive, high-quality, engaging, and unique SEO-optimized article in HTML format for the browser game '{game_name}'.

The article must be written for humans first, with an enthusiastic and knowledgeable gaming tone. Avoid generic templates or repeating paragraphs from other articles. The game genre is '{genre}', and the category is '{category}'.

Article Structure Requirements:
1. Do not output `<!DOCTYPE html>`, `<html>`, `<head>`, or `<body>` tags. Output ONLY the raw HTML body content starting with an `<h2>` introduction heading.
2. The article must be approximately 1000 to 1200 words long. Keep it detailed, engaging, and rich with explanations.
3. Content sections to include (use `<h2>` for main sections and `<h3>` for subsections):
   - **Introduction** (use a custom, punchy heading): A highly engaging opening about the appeal of the game.
   - **What is {game_name}?**: A deep dive into the theme, visual style, and gameplay concept.
   - **How to Play & Controls**: Detailed step-by-step gameplay instructions and control schemes (mention keyboard/mouse/mobile touch where applicable).
   - **Game Rules**: List of key boundaries, mechanics, scoring systems.
   - **Beginner Tips**: 3–5 practical tips for first-time players to get started.
   - **Advanced Strategies**: In-depth tactics, pattern recognition, high-score techniques.
   - **Common Mistakes**: What players do wrong and how to avoid them.
   - **Why People Enjoy this Game**: Psychological appeal (e.g., flow state, quick dopamine hits, satisfaction).
   - **Cognitive / Physical Benefits**: Coordination, reflex, logic, or math skills trained by this game.
   - **Conclusion**: A strong closing paragraph.
   - **FAQ**: 5 to 7 detailed, unique, and highly relevant questions and answers specifically tailored to '{game_name}'. Use a structured list of questions.

Crucial:
- Ensure the article is highly specific to '{game_name}' and its gameplay. For example, if it's 8 Ball Pool, talk about cue ball spin, billiards physics, pocketing balls, etc. If it's Sudoku, talk about grid numbers, logical deduction, elimination, etc.
- Make the FAQ questions highly specific and unique.
- Do not use repeated sentence structures or templates from other games. Keep the wording fresh.
"""
    try:
        response = model_api.generate_content(prompt)
        text = response.text
        # Strip code fences if returned by model
        text = re.sub(r"^```html\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
        return text.strip()
    except Exception as e:
        print(f"❌ Gemini generation failed for {game_name}: {e}")
        return None

def update_sitemap(blog_slugs):
    """Add new blog URLs to the sitemap.xml"""
    if not SITEMAP_PATH.exists():
        print("⚠️  Warning: sitemap.xml not found. Skipping sitemap update.")
        return
        
    print("Updating sitemap.xml...")
    with open(SITEMAP_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Extract existing URLs to avoid duplicates
    existing_urls = set(re.findall(r'<loc>(.*?)</loc>', content))
    
    # Generate new url blocks
    new_blocks = []
    for slug in blog_slugs:
        url = f"https://playmixgames.in/blog/{slug}.html"
        if url not in existing_urls:
            block = f"""  <url>
    <loc>{url}</loc>
    <priority>0.8</priority>
  </url>"""
            new_blocks.append(block)
            
    if new_blocks:
        # Insert before the closing </urlset> tag
        new_content = re.sub(
            r'</urlset>',
            '\n' + '\n'.join(new_blocks) + '\n</urlset>',
            content,
            flags=re.IGNORECASE
        )
        with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"✅ Added {len(new_blocks)} new URLs to sitemap.xml")
    else:
        print("ℹ️  All blog URLs already present in sitemap.xml")

def generate_blog_index(games):
    """Create a beautiful responsive blog homepage listing all articles"""
    index_path = BLOG_DIR / "index.html"
    print("Generating blog/index.html homepage...")
    
    # Generate cards for each article
    cards_html = []
    for g in games.values():
        thumb = get_thumbnail(g)
        cards_html.append(f"""
        <a href="{g['url_slug']}.html" class="blog-card" data-category="{g['category_id']}">
            <div class="card-thumb-wrap">
                <img src="../{thumb}" alt="{g['name']} gameplay review" loading="lazy">
                <span class="card-cat-badge">{g['category_name']}</span>
            </div>
            <div class="card-body">
                <h3>{g['emoji']} {g['name']}</h3>
                <p>Learn rules, controls, tips, and strategies for {g['name']}. Master this game online for free!</p>
                <span class="read-more">Read Guide →</span>
            </div>
        </a>
        """)
        
    index_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PlayMixGames Official Blog | Free Game Guides & Strategies</title>
    <meta name="description" content="Discover detailed walkthroughs, strategies, tips, rules, and controls for all your favorite free browser games on PlayMixGames.">
    <link rel="icon" type="image/png" href="../img/192.png">
    <link rel="canonical" href="https://playmixgames.in/blog/index.html">
    <link rel="stylesheet" href="../portal-style.css">
    
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6129521314653726" crossorigin="anonymous"></script>
    <script type="module" src="../analytics.js"></script>
    <script defer src="../ads.js"></script>

    <style>
        body.blog-index {{
            background: #0f111a;
            color: #ffffff;
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 0;
            padding-bottom: 70px !important;
        }}
        .index-container {{
            max-width: 1200px;
            margin: 100px auto 40px;
            padding: 0 20px;
        }}
        .blog-header {{
            text-align: center;
            margin-bottom: 50px;
        }}
        .blog-header h1 {{
            font-size: 3rem;
            font-weight: 900;
            color: #ffffff;
            margin-bottom: 10px;
            letter-spacing: -1px;
        }}
        .blog-header p {{
            color: #94a3b8;
            font-size: 1.1rem;
            max-width: 600px;
            margin: 0 auto;
        }}
        
        .filter-bar {{
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 40px;
        }}
        .filter-btn {{
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: #cbd5e1;
            padding: 10px 20px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }}
        .filter-btn:hover, .filter-btn.active {{
            background: #3b82f6;
            color: #ffffff;
            border-color: #3b82f6;
            transform: translateY(-2px);
        }}
        
        .blog-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 25px;
        }}
        .blog-card {{
            background: #1e293b;
            border-radius: 16px;
            overflow: hidden;
            text-decoration: none;
            color: #ffffff;
            border: 1px solid rgba(255,255,255,0.05);
            transition: transform 0.3s, border-color 0.3s;
            display: flex;
            flex-direction: column;
        }}
        .blog-card:hover {{
            transform: translateY(-5px);
            border-color: #38bdf8;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }}
        .card-thumb-wrap {{
            position: relative;
            aspect-ratio: 16/10;
            overflow: hidden;
            background: #0f172a;
        }}
        .card-thumb-wrap img {{
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s;
        }}
        .blog-card:hover .card-thumb-wrap img {{
            transform: scale(1.05);
        }}
        .card-cat-badge {{
            position: absolute;
            bottom: 12px;
            left: 12px;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(5px);
            color: #38bdf8;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 700;
        }}
        .card-body {{
            padding: 20px;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }}
        .card-body h3 {{
            margin: 0 0 10px 0;
            font-size: 1.2rem;
            font-weight: 800;
        }}
        .card-body p {{
            margin: 0 0 20px 0;
            color: #94a3b8;
            font-size: 0.9rem;
            line-height: 1.5;
            flex-grow: 1;
        }}
        .read-more {{
            color: #38bdf8;
            font-weight: 700;
            font-size: 0.95rem;
        }}
        
        .adsterra-index-slot {{
            margin: 50px 0 20px;
            display: flex;
            justify-content: center;
        }}
        
        @media (max-width: 600px) {{
            .blog-header h1 {{ font-size: 2.2rem; }}
            .index-container {{ margin-top: 80px; }}
        }}
    </style>
</head>
<body class="blog-index">
    <header class="as-header">
        <a href="../index.html" class="as-header-logo">PlayMix</a>
    </header>

    <main class="index-container">
        <div class="blog-header">
            <h1>Official PlayMix Blog</h1>
            <p>Master your skills with detailed walkthroughs, strategies, tips, rules, and controls for all free online games on PlayMix.</p>
        </div>

        <div class="filter-bar">
            <button class="filter-btn active" data-filter="all">All Category</button>
            <button class="filter-btn" data-filter="action">Action</button>
            <button class="filter-btn" data-filter="sports">Sports</button>
            <button class="filter-btn" data-filter="puzzle">Puzzle</button>
            <button class="filter-btn" data-filter="board">Board</button>
            <button class="filter-btn" data-filter="quiz">Quiz</button>
            <button class="filter-btn" data-filter="reels">Wisdom</button>
        </div>

        <div class="blog-grid">
            {"".join(cards_html)}
        </div>
        
        <!-- Adsterra slot -->
        <div class="adsterra-index-slot">
            <div id="container-63208462c4f9ec6018b4ea2e1903489d"></div>
        </div>
    </main>

    <footer class="as-footer">
        <div class="as-footer-links">
            <a href="../index.html">Home</a>
            <a href="../about.html">About</a>
            <a href="../privacy.html">Privacy Policy</a>
            <a href="../terms.html">Terms of Service</a>
            <a href="../contact.html">Contact</a>
        </div>
        <p class="as-footer-copy">© 2026 PlayMixGames. All rights reserved.</p>
    </footer>

    <script>
        // Simple client-side category filtering
        document.querySelectorAll('.filter-btn').forEach(btn => {{
            btn.addEventListener('click', () => {{
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                document.querySelectorAll('.blog-card').forEach(card => {{
                    if (filter === 'all' || card.dataset.category === filter) {{
                        card.style.display = 'flex';
                    }} else {{
                        card.style.display = 'none';
                    }}
                }});
            }});
        }});
    </script>
</body>
</html>
"""
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_html)
    print("✅ Successfully generated blog/index.html")

def main():
    BLOG_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Parse games from data structure
    print("Discovering games from games-data.js...")
    games = parse_games_data()
    print(f"Successfully discovered {len(games)} unique games.")
    
    # 2. Load SEO title/description mapping
    print("Loading SEO titles from seo_updater.py...")
    seo_mapping = load_seo_data()
    
    # 3. Setup Gemini API if available
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("\n❌ Error: GEMINI_API_KEY environment variable or .env key not found.")
        print("Please create a .env file containing:")
        print("GEMINI_API_KEY=your_gemini_api_key_here")
        print("\nAlternatively, run the script with:")
        print("GEMINI_API_KEY=your_key python3 generate_blog.py")
        sys.exit(1)
        
    if not HAS_SDK:
        print("❌ Error: google-generativeai python package not found.")
        sys.exit(1)
        
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Generate each game page
    blog_slugs = []
    
    # Limit to batches for rate limits, or run all of them with delay
    print(f"Beginning bulk generation of {len(games)} SEO articles...")
    for idx, (slug, game) in enumerate(games.items(), 1):
        filename = BLOG_DIR / f"{slug}.html"
        
        # Check if already generated (skip existing to allow resuming or running in batches)
        if filename.exists():
            print(f"[{idx}/{len(games)}] ⏭ Skipping {game['name']} (Already exists)")
            blog_slugs.append(slug)
            continue
            
        print(f"[{idx}/{len(games)}] ⚡ Generating article for '{game['name']}'...")
        
        # Extract title/desc from seo_mapping
        seo = seo_mapping.get(game["folder_slug"], {})
        # Fallback to standard templates if missing in seo_updater.py
        seo_title = seo.get("title", f"Play {game['name']} Online Free - Walkthrough, Rules, Tips")
        seo_description = seo.get("description", f"Play {game['name']} online for free in your browser! Discover rules, controls, beginner tips, and advanced high-score strategies for {game['name']}.")
        
        # Strip " | PlayMixGames" suffix if already present in seo title
        seo_title = re.sub(r'\s*\|\s*PlayMixGames\s*', '', seo_title, flags=re.IGNORECASE)
        
        # Call Gemini API to get body content
        body_content = generate_article_gemini(game["name"], game["genre"], game["category_name"], model)
        if not body_content:
            print(f"⚠️  Skipping {game['name']} due to generation failure.")
            continue
            
        # Parse FAQs from the generated content
        # We find any FAQs and format them nicely with css
        # Let's see: we can parse any <li> containing questions and make them structured
        faq_items = []
        faq_matches = re.findall(r'<h3>(?:Q\d*:\s*|Question\s*\d*:\s*)?(.*?)</h3>\s*<p>(.*?)</p>', body_content, re.DOTALL)
        if not faq_matches:
            faq_matches = re.findall(r'<p><strong>(?:Q\d*:\s*|Question\s*\d*:\s*)?(.*?)</strong></p>\s*<p>(.*?)</p>', body_content, re.DOTALL)
            
        if faq_matches:
            for q, a in faq_matches[:7]: # Limit to 7 FAQs
                faq_items.append(f"""
                <div class="faq-item">
                    <div class="faq-q">❓ {q.strip('?').strip()}?</div>
                    <div class="faq-a">{a.strip()}</div>
                </div>
                """)
        
        faq_html = "\n".join(faq_items)
        if not faq_html:
            faq_html = f"""
            <div class="faq-item">
                <div class="faq-q">❓ How do I play {game['name']} online?</div>
                <div class="faq-a">Simply visit PlayMixGames and launch {game['name']} in your web browser. No download or registration required!</div>
            </div>
            <div class="faq-item">
                <div class="faq-q">❓ Can I play {game['name']} on mobile?</div>
                <div class="faq-a">Yes! The game is fully optimized for touch controls on both iPhone, iPad, and Android browsers.</div>
            </div>
            """
            
        # Build related cards
        related_cards = []
        related_games = get_related_games(game, games, count=4)
        for rg in related_games:
            rg_thumb = get_thumbnail(rg)
            related_cards.append(f"""
            <a href="{rg['url_slug']}.html" class="related-card">
                <span>{rg['emoji']}</span>
                <p>{rg['name']}</p>
            </a>
            """)
            
        # Compile full HTML page
        html = HTML_TEMPLATE.format(
            seo_title=seo_title,
            seo_description=seo_description,
            slug=slug,
            thumbnail_path=get_thumbnail(game),
            game_name=game["name"],
            game_emoji=game["emoji"],
            game_href=game["href"],
            generated_article_body=body_content,
            faq_items=faq_html,
            related_cards="".join(related_cards)
        )
        
        with open(filename, "w", encoding="utf-8") as f:
            f.write(html)
            
        blog_slugs.append(slug)
        print(f"✅ Generated blog/{slug}.html successfully!")
        
        # Polite API delay to prevent rate limit
        time.sleep(2)
        
    # 4. Generate blog homepage index
    generate_blog_index(games)
    
    # 5. Update sitemap.xml
    update_sitemap(blog_slugs)
    
    print("\n🎉 Bulk SEO Blog Generation Complete!")

if __name__ == "__main__":
    main()
