#!/usr/bin/env python3
"""
PlayMix Site Data Updater
Safely updates:
- games-data.js (featured and category sections)
- sitemap.xml (game URL and blog URL with valid XML verification)
- blog/index.html (adds article card to blog-grid)
- game-factory/game-registry.json
"""

import sys
import os
import re
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime

class SiteUpdater:
    def __init__(self, repo_root=None):
        if repo_root is None:
            repo_root = Path(__file__).resolve().parent.parent.parent
        self.repo_root = Path(repo_root)

    def update_all(self, game_info):
        """
        game_info dict:
        {
            'name': 'Color Bounce Switch',
            'folder': 'ColorBounce',
            'slug': 'color-bounce',
            'tag': '⚡ Neon Timing Hit',
            'desc': 'Tap to bounce upward through rotating colored obstacles...',
            'category': 'action', # action, puzzle, sports, board
            'genre': 'Arcade',
            'icon': '⚡',
            'emoji': '⚡',
            'badge': 'new',
            'gradient': 'linear-gradient(135deg,#38bdf8,#a855f7,#f43f5e)',
            'mechanics': ['reaction-tap', 'rhythm-timing'],
            'controls': ['touch', 'keyboard']
        }
        """
        print(f"🔄 Updating PlayMix platform records for: {game_info['name']}")

        self.update_games_data(game_info)
        self.update_sitemap(game_info)
        self.update_blog_index(game_info)
        self.update_registry(game_info)

        print(f"✅ Successfully updated all platform data for {game_info['name']}")

    def update_games_data(self, g):
        games_data_path = self.repo_root / 'games-data.js'
        if not games_data_path.exists():
            print("Warning: games-data.js not found", file=sys.stderr)
            return

        content = games_data_path.read_text(encoding='utf-8')

        # Check if already present
        if f'"{g["folder"]}/index.html"' in content or f"'{g['folder']}/index.html'" in content:
            print(f"Notice: {g['folder']} already referenced in games-data.js")
            return

        # 1. Insert into featured array (at top)
        featured_entry = (
            f'    {{ name: "{g["name"]}", tag: "{g.get("tag", "🔥 New Hit")}", '
            f'desc: "{g.get("desc", "")}", href: "{g["folder"]}/index.html", '
            f'gradient: "{g.get("gradient", "linear-gradient(135deg,#38bdf8,#a855f7)")}", '
            f'icon: "{g.get("icon", "🎮")}", badge: "{g.get("badge", "new")}", image: "" }},\n'
        )

        featured_match = re.search(r'featured\s*:\s*\[', content)
        if featured_match:
            insert_pos = featured_match.end()
            content = content[:insert_pos] + "\n" + featured_entry + content[insert_pos:]
        else:
            print("Warning: Could not find 'featured: [' in games-data.js", file=sys.stderr)

        # 2. Insert into category items (e.g. action, puzzle, board, etc.)
        cat = g.get('category', 'action').lower()
        if cat not in ['action', 'sports', 'puzzle', 'board', 'quiz']:
            cat = 'action'

        cat_entry = (
            f'        {{ name: "{g["name"]}", genre: "{g.get("genre", "Arcade")}", '
            f'icon: "", href: "{g["folder"]}/index.html", badge: "{g.get("badge", "new")}", '
            f'emoji: "{g.get("emoji", "🎮")}" }},\n'
        )

        # Find category section
        cat_pattern = rf'id\s*:\s*["\']{cat}["\'][^\]]*items\s*:\s*\['
        match = re.search(cat_pattern, content, re.DOTALL)
        if match:
            insert_pos = match.end()
            content = content[:insert_pos] + "\n" + cat_entry + content[insert_pos:]
        else:
            print(f"Notice: Category section '{cat}' not found; adding to first section items")
            first_items = re.search(r'items\s*:\s*\[', content)
            if first_items:
                insert_pos = first_items.end()
                content = content[:insert_pos] + "\n" + cat_entry + content[insert_pos:]

        games_data_path.write_text(content, encoding='utf-8')
        print(f"  ✓ Added to games-data.js (featured and {cat} sections)")

    def update_sitemap(self, g):
        sitemap_path = self.repo_root / 'sitemap.xml'
        if not sitemap_path.exists():
            print("Warning: sitemap.xml not found", file=sys.stderr)
            return

        content = sitemap_path.read_text(encoding='utf-8')
        today = datetime.now().strftime('%Y-%m-%d')
        folder = g['folder']
        slug = g['slug']

        # Check if URL already present
        if f'https://playmixgames.in/{folder}/index.html' in content:
            print(f"Notice: {folder} URL already in sitemap.xml")
            return

        new_urls = f'''  <url>
    <loc>https://playmixgames.in/{folder}/index.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://playmixgames.in/{folder}/index.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://playmixgames.in/{folder}/index.html"/>
  </url>
  <url>
    <loc>https://playmixgames.in/blog/{slug}.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://playmixgames.in/blog/{slug}.html"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://playmixgames.in/blog/{slug}.html"/>
  </url>
'''

        if '</urlset>' in content:
            content = content.replace('</urlset>', new_urls + '</urlset>')
            sitemap_path.write_text(content, encoding='utf-8')

            # Verify XML syntax
            try:
                ET.parse(str(sitemap_path))
                print(f"  ✓ Added to sitemap.xml and verified valid XML")
            except Exception as e:
                print(f"Error: sitemap.xml corrupted after edit: {e}", file=sys.stderr)
                raise

    def update_blog_index(self, g):
        blog_index = self.repo_root / 'blog' / 'index.html'
        if not blog_index.exists():
            return

        content = blog_index.read_text(encoding='utf-8')
        slug = g['slug']

        if f'{slug}.html' in content:
            print(f"Notice: {slug}.html card already in blog/index.html")
            return

        card_html = f'''        <a href="{slug}.html" class="blog-card" data-category="{g.get('category', 'action')}">
            <div class="card-thumb-wrap">
                <img src="https://playmixgames.in/img/covers/puzzle.png" alt="{g['name']} Strategy Guide" loading="lazy">
                <span class="card-cat-badge">{g.get('genre', 'Arcade')}</span>
            </div>
            <div class="card-body">
                <h3>{g.get('emoji', '🎮')} {g['name']}</h3>
                <p>{g.get('desc', 'Read the full guide, pro tips, and play free online!')}</p>
                <span class="read-more">Read Guide →</span>
            </div>
        </a>
'''

        grid_match = re.search(r'<div class=["\']blog-grid["\']>', content)
        if grid_match:
            insert_pos = grid_match.end()
            content = content[:insert_pos] + "\n" + card_html + content[insert_pos:]
            blog_index.write_text(content, encoding='utf-8')
            print(f"  ✓ Added strategy card to blog/index.html")

    def update_registry(self, g):
        registry_path = self.repo_root / 'game-factory' / 'game-registry.json'
        if not registry_path.exists():
            return

        try:
            with open(registry_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception:
            data = {'games': {}}

        games = data.get('games', {})
        games[g['folder']] = {
            'name': g['name'],
            'slug': g['slug'],
            'folder': g['folder'],
            'entry': 'index.html',
            'category': g.get('category', 'action'),
            'mechanics': g.get('mechanics', []),
            'controls': g.get('controls', ['touch', 'mouse']),
            'signature': g.get('signature', 'generated'),
            'description': g.get('desc', ''),
            'created_at': datetime.now().isoformat()
        }

        data['games'] = games
        data['total_games'] = len(games)

        with open(registry_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

        print(f"  ✓ Updated game-factory/game-registry.json (total: {len(games)} games)")

def main():
    print("SiteUpdater utility module.")

if __name__ == '__main__':
    main()
