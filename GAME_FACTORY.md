# 🏭 PlayMix Automated Game Factory

The **PlayMix Game Factory** is an automated game generation, validation, cataloging, and publishing engine integrated directly into your GitHub repository. It allows you or GitHub Actions to generate brand-new, mobile-friendly HTML5 games with zero manual coding.

---

## 🚀 Quick Start: Generate a Game in One Click

To generate a new game automatically from your GitHub web interface:

1. Open your repository on GitHub: `https://github.com/<owner>/Playmix`
2. Navigate to the **Actions** tab.
3. In the left sidebar, click **Generate PlayMix Game**.
4. Click the **Run workflow** dropdown on the right.
5. (Optional) Set `generate_count` (Default is `1`).
6. Click the green **Run workflow** button.

GitHub Actions will automatically:
- Crawl the repository and refresh the game inventory.
- Evaluate trending web game concepts and reject any duplicates or clones.
- Build the game files (`index.html`, `game.html`, `style.css`, `game.js`, and `blog/<slug>.html`).
- Run the strict validation suite (checking structure, JS syntax, mobile touch support, and the single bottom ad rule).
- Update `games-data.js`, `sitemap.xml`, and `blog/index.html`.
- Commit and push the new game directly to your main branch!

---

## 🛠️ Architecture & Folder Structure

```
PlayMix/
├── .github/workflows/
│   └── generate-playmix-game.yml      # GitHub Actions workflow definition
├── game-factory/
│   ├── game-registry.json             # Live database of all PlayMix games & uniqueness signatures
│   ├── engines/                       # Modular game archetype templates
│   │   ├── color_switch_engine.py     # Rotating obstacle & color timing engine
│   │   └── physics_drop_engine.py     # Rigid body circle merge & drop engine
│   ├── templates/                     # Shell templates for consistent branding & SEO
│   │   ├── index_shell.html           # Outer shell with tracking, SEO, loader, and bottom ad
│   │   ├── game_shell.html            # Clean iframe viewport (no ads.js, no #bottom-ad)
│   │   └── blog_shell.html            # Strategy guide article & Schema.org markup
│   └── scripts/                       # Core Python scripts (uses Python 3 standard library only)
│       ├── inventory.py               # Discovers all repository games and generates signatures
│       ├── duplicate_detector.py      # Fuzzy token, string distance, & mechanic clone blocker
│       ├── ai_generator.py            # Multi-provider generator (Gemini, GitHub Models, Procedural)
│       ├── validator.py               # Pre-commit test suite (ad rules, syntax, assets)
│       ├── site_updater.py            # Updates games-data.js, sitemap.xml, blog/index.html
│       └── factory.py                 # Master pipeline CLI orchestrator
└── GAME_FACTORY.md                    # This documentation file
```

---

## 🔑 AI Provider Configuration (100% Free)

The Game Factory is designed to operate completely **FREE of charge** and requires **zero paid subscriptions**.

### Supported Generation Modes:
1. **Zero-API-Key Mode (Default Fallback)**:
   - Requires NO API keys or external services.
   - Generates fully functional, 60 FPS HTML5 canvas arcade and puzzle games using the procedural engines in `game-factory/engines/`.
   - Guaranteed to work out-of-the-box on any machine or GitHub Actions runner.

2. **Google Gemini API Free Tier (Recommended for custom AI mechanics)**:
   - Google provides a 100% free Gemini API tier (15 requests per minute, free forever).
   - Get a free key at: [Google AI Studio](https://aistudio.google.com/)
   - Add it to GitHub:
     1. Go to your repository on GitHub.
     2. Click **Settings** ➔ **Secrets and variables** ➔ **Actions**.
     3. Click **New repository secret**.
     4. Name: `GEMINI_API_KEY`
     5. Value: Your Gemini API key.

3. **GitHub Models / OpenRouter Free Models**:
   - The workflow automatically passes the repository's `GITHUB_TOKEN`.
   - If configured, you can also add `OPENROUTER_API_KEY` with free models (e.g. `meta-llama/llama-3-8b-instruct:free`).

---

## 🚫 Duplicate Detection System

The factory strictly prevents duplicate games, near-clones, and re-skins:

- **Exact Title & Slug Check**: Blocks any game matching an existing title or folder slug.
- **Fuzzy Token Similarity**: Compares word sets and character sequences (Levenshtein distance). Rejects titles with $\ge 70\%$ similarity (e.g. rejects "Jungle Runner" if "Subway Runner" exists).
- **Mechanics & Signature Overlap**: Evaluates gameplay loop, input mechanics, and category. If mechanics overlap by $\ge 75\%$ in the same category, the concept is rejected.
- **Uniqueness Score**: Every concept must achieve a uniqueness score $\ge 0.35$ against all 115+ catalogued games.

---

## 🎯 PlayMix Ad Placement Rules

The PlayMix portal uses an `iframe` game architecture (`index.html` loading `game.html`). To prevent duplicate ads, the factory enforces the **Single Bottom Ad Rule**:

| Rule | `index.html` (Outer Shell) | `game.html` (Inner Game Viewport) |
|---|---|---|
| **`<div id="bottom-ad">`** | ✅ REQUIRED (`.pmg-bottom-ad`) | ❌ STRICTLY FORBIDDEN |
| **`ads.js`** | ✅ REQUIRED (`<script defer src="../ads.js">`) | ❌ STRICTLY FORBIDDEN |
| **`prepSystem()`** | ✅ REQUIRED on `window.load` | ❌ STRICTLY FORBIDDEN |
| **Bottom Clearance** | Handled by fixed positioning | ✅ `padding-bottom: 60px+` in `style.css` |

The validator automatically runs on every generated game. If a game has `ads.js` or `#bottom-ad` inside `game.html`, **validation fails and the commit is aborted**.

---

## 📅 Scheduling Automated Game Releases

By default, the GitHub Action only runs when triggered manually (`workflow_dispatch`), so games are never generated unexpectedly.

To enable a recurring schedule (for example, generating 1 new game every Monday at 03:00 UTC):
1. Open `.github/workflows/generate-playmix-game.yml`.
2. Locate the `schedule` section and uncomment the cron line:
   ```yaml
   schedule:
     - cron: "0 3 * * 1"
   ```
3. Commit and push the workflow file.

---

## 💻 Manual CLI Usage

You can also run the Game Factory locally on your machine:

```bash
# 1. Generate 1 new game automatically
python3 game-factory/scripts/factory.py --count 1

# 2. Test a concept without writing files (dry-run)
python3 game-factory/scripts/factory.py --dry-run

# 3. Check if a proposed title already exists
python3 game-factory/scripts/duplicate_detector.py --name "Your Game Name"

# 4. Validate an existing game folder
python3 game-factory/scripts/validator.py ColorBounce

# 5. Refresh the game inventory registry
python3 game-factory/scripts/inventory.py
```

---

## 🧩 Adding New Game Engines / Templates

To add a new game archetype:
1. Create a Python generator file in `game-factory/engines/my_new_engine.py`.
2. Define a function returning a dictionary with `game_html`, `style_css`, and `game_js`.
3. Add your concept definition to `CANDIDATE_CONCEPTS` in `game-factory/scripts/factory.py`.
4. Run `python3 game-factory/scripts/factory.py --count 1` to test it!

---

## 🛡️ Cost & Quota Safety

- The factory stops immediately if a duplicate is encountered.
- The factory halts immediately if validation fails, rolling back any created files so the repository stays 100% clean.
- When an AI API key runs out of quota or encounters network failure, the system falls back seamlessly to the procedural engine, guaranteeing that games are never published in a broken state.
