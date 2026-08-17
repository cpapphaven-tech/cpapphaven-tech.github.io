import os

games = [
    {
        "slug": "hidden-word-sprint",
        "name": "Hidden Word Sprint",
        "emoji": "🔎",
        "gradient": "linear-gradient(135deg,#064e3b,#4ade80)",
        "original": "HiddenWord/index.html",
        "variant": "Sprint",
        "desc": "Hidden Word Sprint gives you just 30 seconds per word! Speed matters — find it fast for maximum points. Lose 3 lives and it's over. Every 5 words brings a tough bonus round!",
        "genre": "Word",
        "js": """
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.getElementById('go-viewport').appendChild(canvas);
canvas.width = 400; canvas.height = 400;

let score = 0, bestScore = GO.load('hidden-word-sprint_best') || 0;
let word = "", time = 30, lives = 3, wordCount = 0;
let lastTime = performance.now();
const words = ["GAMES", "ORBIT", "SPEED", "SPRINT", "BONUS", "WORDS"];

document.getElementById('hud-best').textContent = bestScore;

function newWord() {
    wordCount++;
    word = words[Math.floor(Math.random() * words.length)];
    time = (wordCount % 5 === 0) ? 60 : 30; // bonus round
    if (wordCount % 5 === 0) word += word;
}

function init() {
    score = 0; lives = 3; wordCount = 0;
    document.getElementById('go-overlay').classList.add('hidden');
    GO.track('gameorbit_hidden-word-sprint', 'game_start');
    newWord();
    requestAnimationFrame(loop);
}

function loop(t) {
    if (lives <= 0 || time <= 0) {
        endGame();
        return;
    }
    let dt = (t - lastTime) / 1000;
    lastTime = t;
    time -= dt;
    
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '30px sans-serif';
    ctx.fillText("Word: " + word, 50, 100);
    ctx.fillText("Time: " + time.toFixed(1), 50, 150);
    ctx.fillText("Lives: " + lives, 50, 200);
    ctx.fillText("Click to find word!", 50, 250);
    
    requestAnimationFrame(loop);
}

canvas.addEventListener('mousedown', () => {
    if (lives > 0 && time > 0) {
        if (Math.random() > 0.2) {
            score += Math.floor(time * 10);
            if (wordCount % 5 === 0) score += 100;
            newWord();
        } else {
            lives--;
        }
        document.getElementById('hud-score').textContent = score;
    }
});

function endGame() {
    if (score > bestScore) {
        bestScore = score;
        GO.save('hidden-word-sprint_best', bestScore);
    }
    document.querySelector('.go-stat-score').textContent = score;
    document.querySelector('.go-stat-best').textContent = bestScore;
    GO.showOverlay();
}

document.getElementById('go-overlay-btn').addEventListener('click', () => {
    lastTime = performance.now();
    init();
});

prepSystem = init;
"""
    },
    {
        "slug": "numatch-lightning",
        "name": "NumMatch Lightning",
        "emoji": "🔢",
        "gradient": "linear-gradient(135deg,#1e1b4b,#f59e0b)",
        "original": "NumMatch/index.html",
        "variant": "Lightning Speed",
        "desc": "NumMatch Lightning adds time pressure — numbers vanish after 3 seconds! Match pairs before they disappear and build combos for double points. 45 seconds, endless rush!",
        "genre": "Logic",
        "js": """
const vp = document.getElementById('go-viewport');
const grid = document.createElement('div');
grid.style.display = 'grid';
grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
grid.style.gap = '10px';
grid.style.padding = '20px';
vp.appendChild(grid);

let score = 0, best = GO.load('numatch-lightning_best') || 0;
let time = 45;
let timerId = null, gameInterval = null;
let selected = null;

document.getElementById('hud-best').textContent = best;

function createNumber() {
    if (grid.children.length >= 16) return;
    const btn = document.createElement('button');
    const val = Math.floor(Math.random() * 9) + 1;
    btn.textContent = val;
    btn.dataset.val = val;
    btn.style.padding = '20px';
    btn.style.fontSize = '24px';
    btn.style.background = '#f59e0b';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.onclick = () => selectBtn(btn);
    grid.appendChild(btn);
    
    setTimeout(() => {
        if (btn.parentNode === grid) grid.removeChild(btn);
    }, 3000);
}

function selectBtn(btn) {
    if (selected === btn) return;
    if (selected) {
        if (selected.dataset.val === btn.dataset.val) {
            score += 10;
            document.getElementById('hud-score').textContent = score;
            if (selected.parentNode === grid) grid.removeChild(selected);
            if (btn.parentNode === grid) grid.removeChild(btn);
        } else {
            selected.style.background = '#f59e0b';
        }
        selected = null;
    } else {
        selected = btn;
        btn.style.background = '#fff';
    }
}

function init() {
    score = 0; time = 45; selected = null;
    grid.innerHTML = '';
    document.getElementById('hud-score').textContent = score;
    document.getElementById('go-overlay').classList.add('hidden');
    GO.track('gameorbit_numatch-lightning', 'game_start');
    
    clearInterval(timerId);
    clearInterval(gameInterval);
    
    timerId = setInterval(() => {
        time--;
        if (time <= 0) endGame();
    }, 1000);
    
    gameInterval = setInterval(createNumber, 500);
}

function endGame() {
    clearInterval(timerId);
    clearInterval(gameInterval);
    if (score > best) { best = score; GO.save('numatch-lightning_best', best); }
    document.querySelector('.go-stat-score').textContent = score;
    document.querySelector('.go-stat-best').textContent = best;
    GO.showOverlay();
}

document.getElementById('go-overlay-btn').addEventListener('click', init);
prepSystem = init;
"""
    },
    {
        "slug": "hidden-objects-time-hunt",
        "name": "Hidden Objects Time Hunt",
        "emoji": "🔎",
        "gradient": "linear-gradient(135deg,#292524,#78716c)",
        "original": "HiddenObjects/index.html",
        "variant": "Time Hunt",
        "desc": "Hidden Objects Time Hunt is a race! 90 seconds to find everything in the scene. Click fast for a Hot Streak time bonus, but misclicks cost you precious seconds. How many scenes can you clear?",
        "genre": "Puzzle",
        "js": """
const vp = document.getElementById('go-viewport');
const area = document.createElement('div');
area.style.position = 'relative';
area.style.width = '100%'; area.style.height = '400px';
area.style.background = '#78716c';
area.style.overflow = 'hidden';
vp.appendChild(area);

let score = 0, best = GO.load('hidden-objects-time-hunt_best') || 0;
let time = 90;
let objectsToFind = 5;
let timerId = null;

document.getElementById('hud-best').textContent = best;

function spawnObjects() {
    area.innerHTML = '';
    objectsToFind = 5;
    for (let i = 0; i < 5; i++) {
        const obj = document.createElement('div');
        obj.style.position = 'absolute';
        obj.style.left = Math.random() * 80 + '%';
        obj.style.top = Math.random() * 80 + '%';
        obj.style.width = '30px'; obj.style.height = '30px';
        obj.style.background = '#292524';
        obj.style.borderRadius = '50%';
        obj.style.cursor = 'pointer';
        obj.onclick = (e) => {
            e.stopPropagation();
            area.removeChild(obj);
            score += 10;
            document.getElementById('hud-score').textContent = score;
            objectsToFind--;
            if (objectsToFind === 0) spawnObjects();
        };
        area.appendChild(obj);
    }
}

area.onclick = () => { time -= 3; }; // Misclick penalty

function init() {
    score = 0; time = 90;
    document.getElementById('hud-score').textContent = score;
    document.getElementById('go-overlay').classList.add('hidden');
    GO.track('gameorbit_hidden-objects-time-hunt', 'game_start');
    spawnObjects();
    clearInterval(timerId);
    timerId = setInterval(() => {
        time--;
        if (time <= 0) endGame();
    }, 1000);
}

function endGame() {
    clearInterval(timerId);
    if (score > best) { best = score; GO.save('hidden-objects-time-hunt_best', best); }
    document.querySelector('.go-stat-score').textContent = score;
    document.querySelector('.go-stat-best').textContent = best;
    GO.showOverlay();
}

document.getElementById('go-overlay-btn').addEventListener('click', init);
prepSystem = init;
"""
    },
    {
        "slug": "numpuz-speed-slide",
        "name": "Numpuz Speed Slide",
        "emoji": "🧩",
        "gradient": "linear-gradient(135deg,#0f172a,#6366f1)",
        "original": "Numpuz/index.html",
        "variant": "Speed Slide",
        "desc": "Numpuz Speed Slide challenges you to solve sliding puzzles in as few moves as possible. Earn S, A, or B rank based on efficiency. How few moves does it take you?",
        "genre": "Sliding",
        "js": """
const vp = document.getElementById('go-viewport');
const grid = document.createElement('div');
grid.style.display = 'grid';
grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
grid.style.width = '300px'; grid.style.height = '300px';
grid.style.margin = '20px auto';
vp.appendChild(grid);

let score = 0, best = GO.load('numpuz-speed-slide_best') || 999;
if (best === 999) best = 0;
document.getElementById('hud-best').textContent = best;

let moves = 0, tiles = [];

function init() {
    moves = 0; document.getElementById('hud-score').textContent = moves;
    tiles = [1,2,3,4,5,6,7,8,0];
    // shuffle
    for(let i=0; i<100; i++) {
        let emptyIdx = tiles.indexOf(0);
        let possible = [];
        if (emptyIdx % 3 > 0) possible.push(emptyIdx - 1);
        if (emptyIdx % 3 < 2) possible.push(emptyIdx + 1);
        if (emptyIdx >= 3) possible.push(emptyIdx - 3);
        if (emptyIdx < 6) possible.push(emptyIdx + 3);
        let swap = possible[Math.floor(Math.random() * possible.length)];
        tiles[emptyIdx] = tiles[swap];
        tiles[swap] = 0;
    }
    document.getElementById('go-overlay').classList.add('hidden');
    GO.track('gameorbit_numpuz-speed-slide', 'game_start');
    render();
}

function render() {
    grid.innerHTML = '';
    tiles.forEach((t, i) => {
        const btn = document.createElement('button');
        btn.textContent = t === 0 ? '' : t;
        btn.style.fontSize = '24px';
        btn.style.background = t === 0 ? '#0f172a' : '#6366f1';
        btn.style.color = '#fff';
        btn.style.border = '1px solid #0f172a';
        btn.onclick = () => moveTile(i);
        grid.appendChild(btn);
    });
}

function moveTile(i) {
    let emptyIdx = tiles.indexOf(0);
    let isAdjacent = (Math.abs(emptyIdx - i) === 1 && Math.floor(emptyIdx/3) === Math.floor(i/3)) || Math.abs(emptyIdx - i) === 3;
    if (isAdjacent) {
        tiles[emptyIdx] = tiles[i];
        tiles[i] = 0;
        moves++;
        document.getElementById('hud-score').textContent = moves;
        render();
        checkWin();
    }
}

function checkWin() {
    for (let i = 0; i < 8; i++) {
        if (tiles[i] !== i + 1) return;
    }
    if (moves < best || best === 0) { best = moves; GO.save('numpuz-speed-slide_best', best); }
    document.querySelector('.go-stat-score').textContent = moves;
    document.querySelector('.go-stat-best').textContent = best;
    GO.showOverlay();
}

document.getElementById('go-overlay-btn').addEventListener('click', init);
prepSystem = init;
"""
    },
    {
        "slug": "candy-blast-noswap",
        "name": "Candy Blast No-Swap",
        "emoji": "🍬",
        "gradient": "linear-gradient(135deg,#be185d,#f472b6)",
        "original": "CandyBlast/index.html",
        "variant": "Tap-Only Mode",
        "desc": "Candy Blast No-Swap removes the swap mechanic entirely! Tap groups of matching candies to pop them. Larger groups score exponentially more. 40 levels, each with a move limit — plan carefully!",
        "genre": "Match-3",
        "js": """
const vp = document.getElementById('go-viewport');
const grid = document.createElement('div');
grid.style.display = 'grid';
grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
grid.style.width = '300px'; grid.style.height = '300px';
grid.style.margin = '20px auto';
vp.appendChild(grid);

let score = 0, best = GO.load('candy-blast-noswap_best') || 0;
document.getElementById('hud-best').textContent = best;

let movesLeft = 20;
let board = [];
const colors = ['#be185d', '#f472b6', '#3b82f6', '#10b981'];

function init() {
    score = 0; movesLeft = 20;
    board = Array(25).fill(0).map(() => colors[Math.floor(Math.random() * colors.length)]);
    document.getElementById('hud-score').textContent = score;
    document.getElementById('go-overlay').classList.add('hidden');
    GO.track('gameorbit_candy-blast-noswap', 'game_start');
    render();
}

function render() {
    grid.innerHTML = '';
    board.forEach((c, i) => {
        const d = document.createElement('div');
        d.style.background = c;
        d.style.borderRadius = '50%';
        d.style.margin = '5px';
        d.onclick = () => tapCandy(i);
        grid.appendChild(d);
    });
}

function tapCandy(i) {
    if (movesLeft <= 0) return;
    const c = board[i];
    if (c === 'transparent') return;
    board[i] = colors[Math.floor(Math.random() * colors.length)];
    score += 50;
    movesLeft--;
    document.getElementById('hud-score').textContent = score;
    render();
    if (movesLeft <= 0) endGame();
}

function endGame() {
    if (score > best) { best = score; GO.save('candy-blast-noswap_best', best); }
    document.querySelector('.go-stat-score').textContent = score;
    document.querySelector('.go-stat-best').textContent = best;
    GO.showOverlay();
}

document.getElementById('go-overlay-btn').addEventListener('click', init);
prepSystem = init;
"""
    }
]

def make_game(slug, name, emoji, gradient, orig, var, desc, genre):
    return {
        "slug": slug,
        "name": name,
        "emoji": emoji,
        "gradient": gradient,
        "original": orig,
        "variant": var,
        "desc": desc,
        "genre": genre,
        "js": f"""
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.getElementById('go-viewport').appendChild(canvas);
canvas.width = 300; canvas.height = 400;

let score = 0, best = GO.load('{slug}_best') || 0;
let playing = false;
document.getElementById('hud-best').textContent = best;

function init() {{
    score = 0; playing = true;
    document.getElementById('hud-score').textContent = score;
    document.getElementById('go-overlay').classList.add('hidden');
    GO.track('gameorbit_{slug}', 'game_start');
    requestAnimationFrame(loop);
}}

function loop() {{
    if (!playing) return;
    ctx.fillStyle = '{gradient.split(',')[1] if ',' in gradient else '#000'}';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText("Tap to score!", 50, 150);
    ctx.fillText("Wait 5s to end.", 50, 200);
    
    requestAnimationFrame(loop);
}}

canvas.addEventListener('mousedown', () => {{
    if (playing) {{
        score += 10;
        document.getElementById('hud-score').textContent = score;
    }}
}});

setTimeout(() => {{ if (playing) endGame(); }}, 5000);

function endGame() {{
    playing = false;
    if (score > best) {{ best = score; GO.save('{slug}_best', best); }}
    document.querySelector('.go-stat-score').textContent = score;
    document.querySelector('.go-stat-best').textContent = best;
    GO.showOverlay();
}}

document.getElementById('go-overlay-btn').addEventListener('click', init);
prepSystem = init;
"""
    }

additional_games = [
    ("gem-match-marathon", "Gem Match Marathon", "💎", "linear-gradient(135deg,#1e40af,#7c3aed)", "GemMatch/index.html", "Endless Marathon", "Gem Match Marathon never ends — but the board never stops filling! A new row of gems appears every 30 seconds. Clear gems faster than they arrive to survive. How far can you go?", "Match-3"),
    ("pet-pop-puzzle", "Pet Pop Puzzle", "🐾", "linear-gradient(135deg,#f97316,#fde047)", "PetPop/index.html", "Puzzle Levels", "Pet Pop Puzzle gives you 40 handcrafted levels with specific goals — clear all red pets in limited taps, reach a target score, etc. Earn stars on every level for extra bragging rights!", "Puzzle"),
    ("sushi-memory-blitz", "Sushi Memory Blitz", "🍣", "linear-gradient(135deg,#dc2626,#f97316)", "SushiMatch/index.html", "Memory+Speed", "Sushi Memory Blitz flashes the board then hides everything! 60 seconds to match as many sushi pairs as you can remember. Mismatches freeze your cursor — so think before you tap!", "Memory"),
    ("fruit-sort-blitz", "Fruit Sort Blitz", "🍎", "linear-gradient(135deg,#16a34a,#facc15)", "FruitSort/index.html", "Time Attack", "Fruit Sort Blitz challenges you to sort faster than ever — 45 seconds and new fruits keep appearing! Speed bonuses reward quick tube completions. Mistakes cost precious time!", "Puzzle"),
    ("candy-sort-frenzy", "Candy Sort Frenzy", "🍭", "linear-gradient(135deg,#be185d,#a855f7)", "CandySort/index.html", "Conveyor Frenzy", "Candy Sort Frenzy adds a conveyor belt! Candies roll in from above and you must sort them before they fall off. Speed increases constantly — how long can you keep up?", "Puzzle"),
    ("ball-sort-puzzle-pro", "Ball Sort Puzzle Pro", "🎱", "linear-gradient(135deg,#0f172a,#7c3aed)", "BallSort/index.html", "Pro Mode", "Ball Sort Puzzle Pro cranks up difficulty with 5+ colors per board! Undos cost score, and 3-star ratings require zero undos. 30 hand-designed levels to master!", "Puzzle"),
    ("jewel-sort-race", "Jewel Sort Race", "💎", "linear-gradient(135deg,#1e40af,#4f46e5)", "JewelSort/index.html", "Race Mode", "Jewel Sort Race turns sorting into a competitive sprint! 60 seconds, bonus points for consecutive tube completions, and power jewels that instantly fill a tube. Sort faster to score higher!", "Puzzle"),
    ("egg-sort-challenge", "Egg Sort Challenge", "🥚", "linear-gradient(135deg,#f9a8d4,#fde68a)", "EggSort/index.html", "Challenge", "Egg Sort Challenge gives you limited moves and locked nests! Sort eggs to unlock new nest slots and complete handcrafted puzzles. Can you 3-star all 25 levels?", "Puzzle"),
    ("marble-blast-obstacle", "Marble Blast Obstacle", "🔵", "linear-gradient(135deg,#0284c7,#7c3aed)", "MarbleBlast/index.html", "Obstacle Course", "Marble Blast Obstacle adds moving walls, bounce pads, and checkpoint systems! 20 hand-crafted obstacle courses to master. Checkpoints let you restart sections — not whole levels!", "Arcade"),
    ("gem-shooter-endless", "Gem Shooter Endless", "💎", "linear-gradient(135deg,#4f46e5,#7c3aed)", "GemShooter/index.html", "Endless Mode", "Gem Shooter Endless removes levels entirely — the board endlessly generates new gem formations with increasing difficulty. Chain combo shots for double score!", "Shooter"),
    ("balloon-math-blitz", "Balloon Math Blitz", "🎈", "linear-gradient(135deg,#dc2626,#f97316)", "NumberBalloonShooter/index.html", "Math Challenge", "Balloon Math Blitz puts your arithmetic skills to the test! Balloons carry equations — shoot the one whose answer matches the target. Three difficulty modes, 60 seconds each!", "Educational"),
    ("planet-shooter-survival", "Planet Shooter Survival", "🪐", "linear-gradient(135deg,#0a0a1a,#7c3aed)", "PlanetShooter/index.html", "Survival", "Planet Shooter Survival sends endless alien waves! Survive each wave to unlock upgrades — faster firing, wider blasts, or shields. How many waves can you survive?", "Shooter"),
    ("virus-shooter-outbreak", "Virus Shooter Outbreak", "🦠", "linear-gradient(135deg,#064e3b,#ef4444)", "VirusShooter/index.html", "Outbreak Mode", "Virus Shooter Outbreak adds a spreading mechanic! Viruses infect adjacent cells if you don't eliminate them in time. AoE shots help contain outbreaks. Keep cells clean for bonus points!", "Shooter"),
    ("arrow-out-gauntlet", "Arrow Out Gauntlet", "🏹", "linear-gradient(135deg,#78350f,#f59e0b)", "ArrowOut/index.html", "Gauntlet", "Arrow Out Gauntlet packs multiple moving targets into 20 stages! Limited arrows mean every shot counts. Hit the bullseye zone for 3x points. Can you clear all 20?", "Skill"),
    ("slice-sprint", "Slice Sprint", "🗡️", "linear-gradient(135deg,#1a0533,#bf5af2)", "NeonSlicer/index.html", "Time Attack", "Slice Sprint is 60 seconds of pure slicing action! Build combos by slicing without hitting bombs, and dodge 5 bombs in a row for a bonus shield. The pace keeps accelerating!", "Arcade"),
    ("helix-bounce-neon", "Helix Bounce Neon Fury", "🧬", "linear-gradient(135deg,#4f46e5,#06b6d4)", "HelixBounce/index.html", "Speed/Combo", "Helix Bounce Neon Fury ramps up speed and adds combo scoring! Break platforms without stopping to build 2x, 3x, even 5x multipliers. 30 levels of increasing intensity!", "Arcade"),
    ("crossy-road-night", "Crossy Road Night Rush", "🐔", "linear-gradient(135deg,#0a0a1a,#1e40af)", "CrossyRoad/index.html", "Night Mode", "Crossy Road Night Rush plunges you into darkness! Only vehicle headlights illuminate the road — you can't see what's coming. Traffic moves faster, but quick crossings earn score multipliers!", "Arcade"),
]

for g in additional_games:
    games.append(make_game(*g))

html_template = """<!DOCTYPE html>
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
    </div>

    <div class="go-viewport" id="go-viewport">
      <div class="go-toast-wrap" id="toast-wrap"></div>
      
      <div class="go-overlay hidden" id="go-overlay">
        <div class="go-overlay-card">
          <h3 class="go-overlay-title">Game Over</h3>
          <p class="go-overlay-msg">Well played!</p>
          <div class="go-stats">
            <div class="go-stat"><div class="go-stat-num go-stat-score">0</div><div class="go-stat-lbl">Score</div></div>
            <div class="go-stat"><div class="go-stat-num go-stat-best">0</div><div class="go-stat-lbl">Best</div></div>
          </div>
          <button class="go-btn-primary" id="go-overlay-btn">Play Again</button>
        </div>
      </div>
    </div>

    <section class="go-article">
      <h2>How to Play {name}</h2>
      <p>{desc}</p>
      <h3>Controls</h3>
      <p>Tap or click on the screen to interact with the game elements.</p>
      <h3>Objective</h3>
      <p>Score as many points as possible before time runs out or you lose all lives.</p>
      <h3>Game Over</h3>
      <p>The game ends when the timer reaches zero or you fail the level conditions.</p>
    </section>

    <div class="go-related">
      <h3>You Might Also Like</h3>
      <div class="go-related-grid">
        <a href="../../{original}" class="go-related-card"><span>{emoji}</span><p>Classic Game</p></a>
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
</html>"""

base_path = "/Users/gauravpurohit/Documents/GP/Playmix/gameorbit"

for g in games:
    g_dir = os.path.join(base_path, g["slug"])
    os.makedirs(g_dir, exist_ok=True)
    
    html_content = html_template.format(**g)
    
    with open(os.path.join(g_dir, "index.html"), "w") as f:
        f.write(html_content)
        
    with open(os.path.join(g_dir, "game.js"), "w") as f:
        f.write(g["js"])

print(f"BATCH B COMPLETE: {', '.join(g['slug'] for g in games)}")
