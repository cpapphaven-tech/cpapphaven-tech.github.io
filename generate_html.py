import os

games = [
    {
        "slug": "bubble-shooter-time-attack", "name": "Bubble Shooter Time Attack", "emoji": "🔵", "gradient": "linear-gradient(135deg,#0ea5e9,#6366f1)", "original": "BubbleShooter/index.html", "variant": "Time Attack",
        "desc": "Play Bubble Shooter against the clock! Unlike classic Bubble Shooter, Time Attack gives you 90 seconds and rewards speed — popping clusters gives time back. Race through levels as bubbles fall faster!", "genre": "Arcade",
        "controls": "Click or tap to aim and shoot.", "objective": "Clear bubbles, earn time bonuses.", "gameover": "Time runs out."
    },
    {
        "slug": "marble-sort-race", "name": "Marble Sort Race", "emoji": "🔮", "gradient": "linear-gradient(135deg,#8b5cf6,#ec4899)", "original": "MarbleSort/game.html", "variant": "Race/Timer",
        "desc": "Sort marbles against the clock in 20 escalating levels. Stars are awarded based on how fast you complete each stage. Bonus marbles mid-sort keep you on your toes!", "genre": "Puzzle",
        "controls": "Tap tube to select top marble, tap another to drop it.", "objective": "Sort all colors before time runs out.", "gameover": "Time runs out or out of moves."
    },
    {
        "slug": "water-sort-limited-moves", "name": "Water Sort Limited Moves", "emoji": "🧪", "gradient": "linear-gradient(135deg,#06b6d4,#10b981)", "original": "WaterSort3D/index.html", "variant": "Limited Moves",
        "desc": "Water Sort gets a strategic overhaul! You have a limited number of moves to sort all the colors. Locked tubes add a new layer of strategy. Can you complete every level with 3 stars?", "genre": "Puzzle",
        "controls": "Tap to pour water.", "objective": "Sort colors within the move limit.", "gameover": "Run out of moves."
    },
    {
        "slug": "tetris-blitz", "name": "Tetris Blitz", "emoji": "🧩", "gradient": "linear-gradient(135deg,#a855f7,#00ffff)", "original": "Tetris/index.html", "variant": "Blitz",
        "desc": "Tetris Blitz is pure intensity — 2 minutes, score multipliers, and special power-up pieces. Clear back-to-back lines to build your multiplier, and survive the 2x speed finale!", "genre": "Puzzle",
        "controls": "Arrow keys or swipe to move/rotate blocks.", "objective": "Score max points in 2 minutes.", "gameover": "Blocks reach the top or time expires."
    },
    {
        "slug": "2048-hexagon", "name": "2048 Hexagon", "emoji": "🔢", "gradient": "linear-gradient(135deg,#f59e0b,#ef4444)", "original": "Game2048/index.html", "variant": "New Layout",
        "desc": "2048 on a hexagonal grid! Tiles now slide in 6 directions, not 4, completely changing the strategy. Can you reach 2048 on the honeycomb board?", "genre": "Puzzle",
        "controls": "Swipe in 6 directions.", "objective": "Reach the 2048 tile.", "gameover": "No valid moves left."
    },
    {
        "slug": "word-guess-sprint", "name": "Word Guess Sprint", "emoji": "🅰️", "gradient": "linear-gradient(135deg,#10b981,#3b82f6)", "original": "WordGuess/index.html", "variant": "Speed Sprint",
        "desc": "Word Guess Sprint is a race against time! 90 seconds to guess as many 5-letter words as you can. Nail it quickly for time bonuses, but wrong guesses cost you seconds. Build your word streak!", "genre": "Word",
        "controls": "Type 5-letter words.", "objective": "Guess words quickly to extend time.", "gameover": "Time runs out."
    },
    {
        "slug": "minesweeper-speed-run", "name": "Minesweeper Speed Run", "emoji": "💣", "gradient": "linear-gradient(135deg,#64748b,#1e293b)", "original": "Minesweeper/index.html", "variant": "Speed Run",
        "desc": "How fast can you clear the minefield? Minesweeper Speed Run tracks your time to the millisecond. Earn Beginner, Intermediate, or Expert rank. Auto-chord helps you move faster — but one mistake ends it all!", "genre": "Puzzle",
        "controls": "Click to reveal, right-click/long-press to flag.", "objective": "Clear the board fast without hitting mines.", "gameover": "Clicking a mine."
    },
    {
        "slug": "solitaire-challenge", "name": "Solitaire Challenge", "emoji": "♠️", "gradient": "linear-gradient(135deg,#1e293b,#334155)", "original": "Solitaire/index.html", "variant": "Challenge Mode",
        "desc": "Solitaire Challenge gives you a fixed daily deal and only 40 moves to win it. No undos, no second chances — pure strategy. Complete the tableau with the fewest moves for the top score!", "genre": "Cards",
        "controls": "Drag and drop cards.", "objective": "Complete the foundation in under 40 moves.", "gameover": "Run out of moves."
    },
    {
        "slug": "sudoku-sprint", "name": "Sudoku Sprint", "emoji": "🧩", "gradient": "linear-gradient(135deg,#0f172a,#4f46e5)", "original": "Sudoku/index.html", "variant": "Speed Sprint",
        "desc": "Sudoku Sprint races your fingers against the clock! Every mistake adds a 30-second penalty. Choose your difficulty and beat your personal best time. Can you go mistake-free?", "genre": "Logic",
        "controls": "Tap cell, tap number to fill.", "objective": "Fill the grid as fast as possible.", "gameover": "Grid successfully filled."
    },
    {
        "slug": "snake-survival", "name": "Snake Survival", "emoji": "🐍", "gradient": "linear-gradient(135deg,#065f46,#10b981)", "original": "NeonSnake/index.html", "variant": "Survival",
        "desc": "Snake Survival adds a shrinking arena! The walls close in over time, forcing you into tighter and tighter spaces. Grab power-ups to boost your score and shield yourself. Survive as long as you can!", "genre": "Arcade",
        "controls": "Swipe or use arrow keys to turn.", "objective": "Eat food, survive shrinking walls.", "gameover": "Hit wall or yourself."
    },
    {
        "slug": "pacman-maze-rush", "name": "Pac-Man Maze Rush", "emoji": "👾", "gradient": "linear-gradient(135deg,#1a0a2e,#f59e0b)", "original": "NeonPacman/game.html", "variant": "Speed/Maze",
        "desc": "Pac-Man Maze Rush sends you through 5 different neon mazes, each with a tighter time limit. Ghosts get faster every level. Grab vanishing bonus pellets for big points!", "genre": "Arcade",
        "controls": "Swipe or arrow keys.", "objective": "Clear maze of pellets before time runs out.", "gameover": "Caught by ghost or time runs out."
    },
    {
        "slug": "flappy-gauntlet", "name": "Flappy Gauntlet", "emoji": "🐦", "gradient": "linear-gradient(135deg,#0ea5e9,#a855f7)", "original": "FlappyRise/index.html", "variant": "Gauntlet",
        "desc": "Flappy Gauntlet is tougher than Flappy Rise! Pipes move vertically, wind zones push you off course, and coin rings tempt you into risky paths. Checkpoints save your progress every 5 pipes.", "genre": "Arcade",
        "controls": "Tap or spacebar to fly.", "objective": "Fly as far as possible.", "gameover": "Hit a pipe or the ground."
    },
    {
        "slug": "knife-hit-frenzy", "name": "Knife Hit Frenzy", "emoji": "🎯", "gradient": "linear-gradient(135deg,#1e1b4b,#f59e0b)", "original": "KnifeHit/game.html", "variant": "Frenzy",
        "desc": "Knife Hit Frenzy throws multiple spinning logs at you simultaneously! Hit all targets before the timer runs out. Slice apples for bonus knives and build a no-miss combo for massive score!", "genre": "Arcade",
        "controls": "Tap to throw knife.", "objective": "Hit logs with knives without hitting other knives.", "gameover": "Hit an existing knife or time expires."
    },
    {
        "slug": "doodle-jump-dark", "name": "Doodle Jump Dark Zone", "emoji": "😊", "gradient": "linear-gradient(135deg,#0a0a1a,#4f46e5)", "original": "DoodleJump/index.html", "variant": "Dark/Survival",
        "desc": "Doodle Jump in the Dark Zone! Your flashlight reveals platforms — but the torch fuel depletes over time. Collect torch refills to stay illuminated, and jump higher for a score multiplier!", "genre": "Platform",
        "controls": "Tilt device or use arrow keys.", "objective": "Jump as high as possible.", "gameover": "Fall off the screen or run out of light."
    },
    {
        "slug": "brick-breaker-precision", "name": "Brick Breaker Precision", "emoji": "🧱", "gradient": "linear-gradient(135deg,#dc2626,#f97316)", "original": "BrickBreaker/game.html", "variant": "Precision",
        "desc": "Brick Breaker Precision changes the game completely — you only get 3 balls! An aiming guide shows your shot trajectory, and chain-reaction bricks score big. Every shot counts!", "genre": "Arcade",
        "controls": "Drag to move paddle.", "objective": "Break all bricks with only 3 balls.", "gameover": "Lose all 3 balls."
    },
    {
        "slug": "color-match-reflex", "name": "Color Match Reflex", "emoji": "🎨", "gradient": "linear-gradient(135deg,#8b5cf6,#f59e0b)", "original": "ColorMatch/index.html", "variant": "Reflex",
        "desc": "Color Match Reflex is pure reaction speed! Colors flash for under a second — tap the matching color or lose a life. How fast can your eyes and fingers work? Beat your reaction time record!", "genre": "Reaction",
        "controls": "Tap the matching color.", "objective": "Match colors quickly.", "gameover": "Lose all lives or time runs out."
    },
    {
        "slug": "fruit-splash-frenzy", "name": "Fruit Splash Frenzy", "emoji": "🍉", "gradient": "linear-gradient(135deg,#dc2626,#f97316)", "original": "FruitSplash/index.html", "variant": "Frenzy",
        "desc": "Fruit Splash Frenzy cranks up the pressure with a 60s timer! Chain matches give you time back, and triple-combo streaks trigger Frenzy Fever — double points for 5 seconds!", "genre": "Match-3",
        "controls": "Swipe to match 3+ fruits.", "objective": "Score points before time runs out.", "gameover": "Time runs out."
    },
    {
        "slug": "block-puzzle-blitz", "name": "Block Puzzle Blitz", "emoji": "🧩", "gradient": "linear-gradient(135deg,#7c3aed,#1e40af)", "original": "BlockPuzzle/game.html", "variant": "Blitz",
        "desc": "Block Puzzle Blitz is a 90-second race! Place pieces fast for speed multipliers, and cascade line clears for huge bonuses. The final 20 seconds go into Rush Mode — double points!", "genre": "Puzzle",
        "controls": "Drag and drop blocks.", "objective": "Clear lines and score points in 90 seconds.", "gameover": "Time runs out or board is full."
    },
    {
        "slug": "merge-numbers-chain", "name": "Merge Numbers Chain", "emoji": "🔢", "gradient": "linear-gradient(135deg,#0f172a,#3b82f6)", "original": "MergeNumbers/game.html", "variant": "Chain Reaction",
        "desc": "Merge Numbers Chain adds cascade reactions! When tiles merge, nearby equal tiles chain-merge automatically. Bomb tiles add explosive clearing. How high can you chain?", "genre": "Puzzle",
        "controls": "Drag matching numbers together.", "objective": "Merge high numbers.", "gameover": "Board full and no moves."
    },
    {
        "slug": "crossmath-speed-quiz", "name": "Crossmath Speed Quiz", "emoji": "➕", "gradient": "linear-gradient(135deg,#065f46,#10b981)", "original": "Crossmath/game.html", "variant": "Speed Quiz",
        "desc": "Crossmath Speed Quiz drills your mental math under pressure! One equation at a time, 60 seconds, and a difficulty ladder that gets harder every 5 correct answers. Beat your streak!", "genre": "Math",
        "controls": "Tap numbers to complete equation.", "objective": "Solve as many equations as possible.", "gameover": "Time runs out."
    },
    {
        "slug": "word-search-blitz", "name": "Word Search Blitz", "emoji": "🔍", "gradient": "linear-gradient(135deg,#064e3b,#4ade80)", "original": "WordSearch/index.html", "variant": "Time Attack",
        "desc": "Word Search Blitz gives you 90 seconds and a twist — found words fade slowly, keeping you guessing about used letters. Find bonus mystery words for double points!", "genre": "Word",
        "controls": "Drag across letters to form words.", "objective": "Find all words fast.", "gameover": "Time runs out."
    },
    {
        "slug": "dot-connect-marathon", "name": "Dot Connect Marathon", "emoji": "🔴", "gradient": "linear-gradient(135deg,#7f1d1d,#ef4444)", "original": "DotConnect/index.html", "variant": "Marathon",
        "desc": "Dot Connect Marathon never ends! Connect all the dots on an infinite series of boards. Complete a board without lifting your finger for the no-lift bonus. How many levels can you beat today?", "genre": "Puzzle",
        "controls": "Drag to connect matching dots.", "objective": "Complete as many boards as possible.", "gameover": "You quit or run out of time (if applicable)."
    }
]

template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>{name} | GameOrbit – PlayMix Games</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="https://playmixgames.in/gameorbit/{slug}/">
  <link rel="icon" href="../../assets/favicon.ico">
  <link rel="stylesheet" href="../../gameorbit/gameorbit.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    #game-canvas {{ width: 100%; height: 100%; display: block; }}
  </style>
  <script type="application/ld+json">{{"@context":"https://schema.org","@type":"VideoGame","name":"{name}","description":"{desc}","url":"https://playmixgames.in/gameorbit/{slug}/","genre":["{genre}"],"playMode":"SinglePlayer","applicationCategory":"Game","operatingSystem":"Web Browser","offers":{{"@type":"Offer","price":"0","priceCurrency":"USD"}}}}</script>
</head>
<body>
  <nav class="go-nav">
    <a href="../../index.html" class="go-nav-logo">
      <span class="logo-emoji">🎮</span>
      <div class="logo-text"><h1>PlayMix</h1><span>GameOrbit</span></div>
    </a>
    <span class="go-nav-badge">GameOrbit</span>
    <div class="go-nav-actions">
      <button class="go-nav-btn" id="go-menu-btn" aria-label="Home"><i class="fa-solid fa-house"></i></button>
    </div>
  </nav>

  <main class="go-main">
    <a href="../../gameorbit/" class="go-back-link"><i class="fa-solid fa-arrow-left"></i> GameOrbit</a>

    <div class="go-game-header">
      <div class="go-game-icon" style="background:{gradient}">{emoji}</div>
      <div class="go-game-title">
        <h2>{name} <span class="go-badge go-badge-hot">GameOrbit</span></h2>
        <div class="go-game-tag">{variant}</div>
      </div>
    </div>

    <div class="go-hud">
      <div class="go-hud-box"><div class="go-hud-label">SCORE</div><div class="go-hud-val accent" id="hud-score">0</div></div>
      <div class="go-hud-box"><div class="go-hud-label">BEST</div><div class="go-hud-val" id="hud-best">0</div></div>
      <div class="go-hud-box"><div class="go-hud-label">INFO</div><div class="go-hud-val" id="hud-extra">-</div></div>
    </div>

    <div class="go-viewport" id="go-viewport">
      <div class="go-toast-wrap" id="toast-wrap"></div>
      <canvas id="game-canvas"></canvas>
      
      <!-- OVERLAY -->
      <div class="go-overlay hidden" id="go-overlay">
        <div class="go-overlay-card">
          <h3 class="go-overlay-title">Game Over</h3>
          <p class="go-overlay-msg" id="overlay-msg">Well played!</p>
          <div class="go-stats">
            <div class="go-stat"><div class="go-stat-num go-stat-score" id="overlay-score">0</div><div class="go-stat-lbl">Score</div></div>
            <div class="go-stat"><div class="go-stat-num go-stat-best" id="overlay-best">0</div><div class="go-stat-lbl">Best</div></div>
          </div>
          <button class="go-btn-primary" id="go-overlay-btn">Play Again</button>
        </div>
      </div>
    </div>

    <section class="go-article">
      <h2>How to Play {name}</h2>
      <p>{desc}</p>
      <h3>Controls</h3>
      <p>{controls}</p>
      <h3>Objective</h3>
      <p>{objective}</p>
      <h3>Game Over</h3>
      <p>{gameover}</p>
    </section>

    <div class="go-related">
      <h3>You Might Also Like</h3>
      <div class="go-related-grid">
        <a href="../../{original}" class="go-related-card"><span>{emoji}</span><p>Classic Version</p></a>
        <a href="../../gameorbit/" class="go-related-card"><span>🚀</span><p>GameOrbit Hub</p></a>
      </div>
    </div>
  </main>

  <div id="pmg-bottom-ad"></div>
  <script src="../../gameorbit/gameorbit.js"></script>
  <script src="game.js"></script>
  <script src="../../ads.js"></script>
  <script src="../../analytics.js"></script>
  <script>window.addEventListener('load',function(){{if(typeof prepSystem==='function')prepSystem();}});</script>
</body>
</html>
"""

base_dir = "/Users/gauravpurohit/Documents/GP/Playmix/gameorbit"

os.makedirs(base_dir, exist_ok=True)

for g in games:
    slug_dir = os.path.join(base_dir, g['slug'])
    os.makedirs(slug_dir, exist_ok=True)
    html_path = os.path.join(slug_dir, "index.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(template.format(**g))
    
    # Also write a placeholder game.js to be overwritten
    js_path = os.path.join(slug_dir, "game.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("/* placeholder */")

print("HTML and JS placeholders generated.")
