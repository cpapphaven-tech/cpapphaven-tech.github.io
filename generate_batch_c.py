import os
import json

games = [
    {
        "slug": "highway-rush-storm",
        "name": "Highway Rush Storm",
        "emoji": "🏎️",
        "gradient": "linear-gradient(135deg,#1c0a00,#ef4444)",
        "original": "HighwayRush/index.html",
        "variant": "Storm Hazards",
        "differences": "Rain reduces visibility (grey overlay, wipers animation). Oil slicks on road cause brief spin-out. Near-miss scoring: passing within 1 car width without hitting scores bonus. Storm intensity increases with score. Fog mode at high scores.",
        "article": "Highway Rush Storm adds weather hazards! Rain reduces visibility, oil slicks cause spin-outs, and near-misses score big. Storm intensity grows as your score climbs — dare you push further?",
        "genre": "Racing"
    },
    {
        "slug": "galaxy-boss-rush",
        "name": "Galaxy Assault Boss Rush",
        "emoji": "👾",
        "gradient": "linear-gradient(135deg,#0a0a1a,#7c3aed)",
        "original": "GalaxyAssault/index.html",
        "variant": "Boss Rush",
        "differences": "Sequential boss fights instead of waves. 5 unique bosses with different attack patterns. Between bosses: choose 1 of 3 upgrades (rapid fire, shield, spread shot). Score multiplies per boss defeated. Final boss has 3 health phases.",
        "article": "Galaxy Assault Boss Rush skips the grunt waves and throws you straight at 5 massive bosses! Each boss has unique attack patterns. Upgrade between fights and survive all 5 to win!",
        "genre": "Shooter"
    },
    {
        "slug": "retro-racer-drag",
        "name": "Retro Racer Drag",
        "emoji": "🏎️",
        "gradient": "linear-gradient(135deg,#1c0a00,#f59e0b)",
        "original": "RetroRacer/index.html",
        "variant": "Drag Race",
        "differences": "Top-down drag race (straight track). Gear-shift timing mechanic: tap/click at the right moment in a gauge to shift gear optimally. AI opponent racing alongside. Best time of 5 runs tracked. Perfect shifts = speed boost.",
        "article": "Retro Racer Drag is all about gear-shift timing! Hit the shift at the perfect moment to boost speed and beat the AI opponent. 5 runs to set your personal record!",
        "genre": "Racing"
    },
    {
        "slug": "striker-league-cup",
        "name": "Striker League Cup",
        "emoji": "⚽",
        "gradient": "linear-gradient(135deg,#065f46,#10b981)",
        "original": "StrikerLeague/index.html",
        "variant": "Tournament",
        "differences": "4-team bracket tournament. AI difficulty increases per round. League points accumulate (win=3pts, draw=1pt). Group stage -> Semi-final -> Final structure. Trophy screen on winning the cup.",
        "article": "Striker League Cup adds a full tournament! Beat 3 AI opponents in a bracket format — Group Stage, Semi-Final, and Final. Win the cup for the ultimate bragging rights!",
        "genre": "Football"
    },
    {
        "slug": "head-football-worldcup",
        "name": "Head Football World Cup",
        "emoji": "⚽",
        "gradient": "linear-gradient(135deg,#1e40af,#f59e0b)",
        "original": "HeadFootball/index.html",
        "variant": "World Cup Tournament",
        "differences": "8-team bracket. AI opponents with different difficulty levels. Stamina bar depletes during play; rest between halves. Penalty shootout on draw. Flag display per team. 3-match campaign to win the cup.",
        "article": "Head Football World Cup runs an 8-team tournament! Face AI opponents of increasing difficulty, manage your stamina bar, and survive to the final. Draws go to penalties!",
        "genre": "Football"
    },
    {
        "slug": "cricket-master-t5",
        "name": "Cricket Master T5",
        "emoji": "🏏",
        "gradient": "linear-gradient(135deg,#1e3a5f,#38bdf8)",
        "original": "CricketMaster/index.html",
        "variant": "5-Over Speed Format",
        "differences": "5-over match format only. Power play rules (first 2 overs, all fielders in circle). Required run rate displayed. Last-over pressure mode (double score). Fielding in bowl mode. Score board displayed.",
        "article": "Cricket Master T5 is a blazing 5-over game! Power plays boost your scoring window, required run rate keeps pressure on, and the final over scores double. It's T20 but even faster!",
        "genre": "Cricket"
    },
    {
        "slug": "pool-time-pressure",
        "name": "8 Ball Time Pressure",
        "emoji": "🎱",
        "gradient": "linear-gradient(135deg,#064e3b,#065f46)",
        "original": "Pool/index.html",
        "variant": "Timed Shots",
        "differences": "Shot clock: 12 seconds per shot (shown as circular countdown). Overtime shot (miss clock) = opponent turn. 3-foul rule: 3 shot clock violations = loss. Streak bonus for potting consecutive balls within 8 seconds.",
        "article": "8 Ball Time Pressure adds a 12-second shot clock! Run out of time and your opponent takes over. 3 shot clock violations and you lose the game. Pot consecutive balls quickly for bonus points!",
        "genre": "Sports"
    },
    {
        "slug": "air-hockey-turbo",
        "name": "Air Hockey Turbo",
        "emoji": "🏑",
        "gradient": "linear-gradient(135deg,#0ea5e9,#06b6d4)",
        "original": "AirHockey3D/index.html",
        "variant": "Turbo Mode",
        "differences": "Power shot mechanic: hold mouse/touch 0.5s to charge power shot. Bouncing pucks (puck occasionally splits into 2). First to 7 points wins. Puck speed increases each time it bounces 5 times without scoring. Turbo sound effects.",
        "article": "Air Hockey Turbo adds power shots and bouncing pucks! Charge your shot for a powerful strike, and watch out when the puck starts accelerating. First to 7 wins — fast and furious!",
        "genre": "Sports"
    },
    {
        "slug": "bowling-strike-chain",
        "name": "Bowling Strike Chain",
        "emoji": "🎳",
        "gradient": "linear-gradient(135deg,#1e1b4b,#f59e0b)",
        "original": "Bowling/game.html",
        "variant": "Strike Challenge",
        "differences": "Only strikes score points (spares = 0). Chain bonus: consecutive strikes multiply score (2x, 4x, 8x...). 10 challenge frames with different pin arrangements. Trick shots: specific patterns worth bonus if struck perfectly.",
        "article": "Bowling Strike Chain only rewards strikes! Build a chain of consecutive strikes for exponential multipliers. Spare? Zero. 10 challenge frames, each with a unique pin arrangement. Can you chain them all?",
        "genre": "Sports"
    },
    {
        "slug": "table-tennis-smash",
        "name": "Table Tennis Smash Cup",
        "emoji": "🏓",
        "gradient": "linear-gradient(135deg,#dc2626,#f97316)",
        "original": "TableTennis/index.html",
        "variant": "Smash Mode",
        "differences": "Power smash mechanic (hold to charge). Spin system: topspin curves ball down, backspin floats it. Best-of-5 match format. AI difficulty increases in later sets. Smash meter fills with consecutive rallies.",
        "article": "Table Tennis Smash Cup adds power smashes and spin mechanics! Control topspin and backspin to outwit the AI. Best of 5 sets, with an AI that gets smarter as the match progresses!",
        "genre": "Sports"
    },
    {
        "slug": "volleyball-beach-blitz",
        "name": "Volleyball Beach Blitz",
        "emoji": "🏐",
        "gradient": "linear-gradient(135deg,#f59e0b,#fde047)",
        "original": "VolleyballArena/index.html",
        "variant": "Beach Blitz",
        "differences": "2-minute rally blitz scoring (most points in 2 minutes wins). Wind mechanic: wind direction shown, affects ball trajectory. Beach rules: only 2 players per side. Spike bonus: +3 points for downward spike winner. Crowd noise increases with rally length.",
        "article": "Volleyball Beach Blitz is a 2-minute scoring race! Wind affects the ball, beach rules mean fewer players, and powerful spikes score triple. Score the most points in 2 minutes!",
        "genre": "Sports"
    },
    {
        "slug": "basketball-shot-clock",
        "name": "Basketball 3D Shot Clock",
        "emoji": "🏀",
        "gradient": "linear-gradient(135deg,#c2410c,#f97316)",
        "original": "Basketball3D/index.html",
        "variant": "Shot Clock Mode",
        "differences": "24-second shot clock per possession. 3-pointer bonus (+1 extra point). Overtime on tie after 4 quarters. Shot clock resets on score. Foul shooting mini-game when fouled. Score shown per quarter.",
        "article": "Basketball 3D Shot Clock introduces the 24-second shot clock! Get fouled and enter the free-throw mini-game. 3-pointers give a bonus point. Tied at the end? Head to overtime!",
        "genre": "Sports"
    },
    {
        "slug": "football-penalty",
        "name": "Football 3D Penalty Shootout",
        "emoji": "⚽",
        "gradient": "linear-gradient(135deg,#064e3b,#10b981)",
        "original": "Football3D/index.html",
        "variant": "Penalty Shootout",
        "differences": "Best-of-5 penalty kicks only. Aim with directional indicator, keeper guesses direction. Sudden death after 5-5. Crowd pressure mechanic: miss = crowd noise increases, affecting aim difficulty. Score history shown.",
        "article": "Football 3D Penalty Shootout is pure nerves! 5 kicks each, keeper guesses your direction. Miss and the crowd pressure makes your aim shake. Sudden death if it's tied!",
        "genre": "Football"
    },
    {
        "slug": "tennis-tiebreak",
        "name": "Tennis Tiebreak Blitz",
        "emoji": "🎾",
        "gradient": "linear-gradient(135deg,#15803d,#fde047)",
        "original": "Tennis/game.html",
        "variant": "Tiebreak Only",
        "differences": "Only tiebreak format (first to 7 points, 2-point lead). 10 rounds against progressively faster AI. Stamina depletes in long rallies, slowing shot speed. Perfect shot window highlighted briefly. Rally length scored.",
        "article": "Tennis Tiebreak Blitz skips straight to the most intense part — the tiebreak! 10 rounds against AI that gets faster each time. Manage your stamina in long rallies and win the perfect-shot timing!",
        "genre": "Sports"
    },
    {
        "slug": "pocket-golf-par",
        "name": "Pocket Golf Par Challenge",
        "emoji": "⛳",
        "gradient": "linear-gradient(135deg,#166534,#4ade80)",
        "original": "PocketGolf/index.html",
        "variant": "Par Challenge",
        "differences": "Par-based scoring (under par = eagle/birdie bonus, over par = penalty). Wind direction and speed shown per hole. 18-hole course with increasing difficulty. Bunker and water hazard penalties. Scorecard shown at end.",
        "article": "Pocket Golf Par Challenge plays 18 holes with real par scoring! Account for wind on every shot, avoid bunkers and water hazards, and finish under par for bonus points. Full scorecard at the end!",
        "genre": "Sports"
    },
    {
        "slug": "bottle-shoot-chain",
        "name": "Bottle Shoot Chain",
        "emoji": "🍾",
        "gradient": "linear-gradient(135deg,#1e3a5f,#0ea5e9)",
        "original": "BottleShoot3D/index.html",
        "variant": "Chain Shot",
        "differences": "Ricochet shots: bullet bounces off walls and can hit multiple bottles. Chain multiplier: each bounce that hits a bottle doubles the score. Limited bullets per level (shown). 20 levels with creative layouts requiring ricochets.",
        "article": "Bottle Shoot Chain introduces ricochet mechanics! Bullets bounce off walls — plan your shots to chain-hit multiple bottles. Limited bullets mean every shot must count. 20 creative layouts!",
        "genre": "Skill"
    },
    {
        "slug": "archery-precision",
        "name": "Archery Precision Challenge",
        "emoji": "🏹",
        "gradient": "linear-gradient(135deg,#78350f,#ef4444)",
        "original": "ArcheryMaster/index.html",
        "variant": "Precision",
        "differences": "Moving targets (circular and diagonal). Wind indicator (shown as arrow + strength). Bullseye streak bonus: 5 consecutive bullseyes = 5x multiplier. 30 challenge shots per round. Score breakdown shown (inner/middle/outer rings).",
        "article": "Archery Precision Challenge adds moving targets and wind! Hit the bullseye 5 times in a row for a massive multiplier. 30 shots per round, with wind changing every 5 shots. Aim true!",
        "genre": "Skill"
    },
    {
        "slug": "skifree-slalom",
        "name": "SkiFree Slalom Rush",
        "emoji": "⛷️",
        "gradient": "linear-gradient(135deg,#1e3a5f,#e2e8f0)",
        "original": "SkiFree/index.html",
        "variant": "Slalom",
        "differences": "Gates to ski through (miss = time penalty +2s). Time-based scoring. Trick scoring: jump and rotate for style points. 5 courses of increasing gate density. Gate color indicates turn direction (red=left, blue=right). Best time per course tracked.",
        "article": "SkiFree Slalom Rush adds gates, tricks, and time penalties! Miss a gate and get a 2-second penalty. Pull off tricks in the air for style points. 5 courses with increasing gate density!",
        "genre": "Sports"
    },
    {
        "slug": "stickman-survival",
        "name": "Stickman Survival Arena",
        "emoji": "⚔️",
        "gradient": "linear-gradient(135deg,#1a0533,#dc2626)",
        "original": "StickDuel/index.html",
        "variant": "Endless Survival",
        "differences": "Endless waves of AI stick fighters. Health bar system (3 bars). Speed and strength upgrades available between every 3 waves. Score = waves survived * difficulty multiplier. Boss stickman every 5 waves.",
        "article": "Stickman Survival Arena sends endless waves of fighters! Survive 3 waves to earn upgrades. Face a powerful boss every 5 waves. How many waves can you survive?",
        "genre": "Action"
    },
    {
        "slug": "number-master-endless",
        "name": "Number Master Endless",
        "emoji": "🔢",
        "gradient": "linear-gradient(135deg,#0f172a,#3b82f6)",
        "original": "NumberMaster/game.html",
        "variant": "Endless Runner",
        "differences": "Infinite runner (no end). Gate speed increases every 500 score. Negative gates appear (avoid them). Score displayed live. Personal best tracked. Every 1000 score unlocks a cosmetic trail color.",
        "article": "Number Master Endless removes the finish line! Gates come faster and faster, negative gates appear as traps, and every 1000 points unlocks a new trail. How high can you go?",
        "genre": "Arcade"
    },
    {
        "slug": "dancing-line-remix",
        "name": "Dancing Line Remix",
        "emoji": "🎵",
        "gradient": "linear-gradient(135deg,#4f46e5,#ec4899)",
        "original": "DancingLine/index.html",
        "variant": "Remix Mode",
        "differences": "New procedurally-generated obstacle patterns synced to BPM. BPM score: tapping exactly on the beat gives 2x score. Checkpoint system every 10 seconds. 5 remix difficulty levels. Beat-accuracy percentage shown at end.",
        "article": "Dancing Line Remix adds BPM-sync scoring! Tap exactly on the beat for double score. Checkpoints let you restart sections, not the whole track. 5 difficulty levels of increasingly fast beats!",
        "genre": "Rhythm"
    },
    {
        "slug": "idle-ball-escape-blitz",
        "name": "Ball Escape Blitz",
        "emoji": "🌀",
        "gradient": "linear-gradient(135deg,#1e1b4b,#06b6d4)",
        "original": "IdleBallEscape/index.html",
        "variant": "Active Blitz",
        "differences": "Active control mode — you control the ball direction (not idle). 60s time limit. Power-up bricks: hit gold bricks for extra time, hit purple bricks for multiball. Score multiplier increases every 10 bricks cleared.",
        "article": "Ball Escape Blitz puts you in control! Direct the ball yourself in a 60-second frenzy. Gold bricks add time, purple bricks split the ball into two. Build your multiplier fast!",
        "genre": "Arcade"
    }
]

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>{name} | GameOrbit – PlayMix Games</title>
  <meta name="description" content="{article_short}">
  <link rel="canonical" href="https://playmixgames.in/gameorbit/{slug}/">
  <link rel="icon" href="../../assets/favicon.ico">
  <link rel="stylesheet" href="../../gameorbit/gameorbit.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script type="application/ld+json">{{"@context":"https://schema.org","@type":"VideoGame","name":"{name}","description":"{article_short}","url":"https://playmixgames.in/gameorbit/{slug}/","genre":["{genre}"],"playMode":"SinglePlayer","applicationCategory":"Game","operatingSystem":"Web Browser","offers":{{"@type":"Offer","price":"0","priceCurrency":"USD"}}}}</script>
  <style>
    #gameCanvas {{ display: block; width: 100%; height: 100%; background: #222; touch-action: none; }}
  </style>
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
      <canvas id="gameCanvas"></canvas>
      
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
      <p>{article}</p>
      <h3>Controls</h3>
      <p>Use touch/click or arrow keys depending on your device to interact with the game elements.</p>
      <h3>Objective</h3>
      <p>Survive as long as possible, hit targets, or outscore opponents depending on the challenge!</p>
      <h3>Game Over</h3>
      <p>Game ends when health depletes, time runs out, or you fail the level objectives.</p>
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

game_js_template = """// {name} Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let score = 0;
let bestScore = GO.load('best_{slug}') || 0;
let isPlaying = false;
let animationId;

// Game variables
let frameCount = 0;
let entities = [];
let player = {{ x: 150, y: 300, width: 30, height: 30, speed: 5, color: '#3b82f6' }};
let mouseX = 150;
let mouseY = 300;

document.getElementById('hud-best').textContent = bestScore;

function resize() {{
    const vp = document.getElementById('go-viewport');
    canvas.width = vp.clientWidth;
    canvas.height = vp.clientHeight || 400;
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;
}}
window.addEventListener('resize', resize);

function initGame() {{
    resize();
    score = 0;
    frameCount = 0;
    entities = [];
    isPlaying = true;
    document.getElementById('hud-score').textContent = score;
    document.getElementById('go-overlay').classList.add('hidden');
    GO.track('gameorbit_{slug}', 'game_start');
    gameLoop();
}}

function gameOver() {{
    isPlaying = false;
    cancelAnimationFrame(animationId);
    if (score > bestScore) {{
        bestScore = score;
        GO.save('best_{slug}', bestScore);
    }}
    document.querySelector('.go-stat-score').textContent = score;
    document.querySelector('.go-stat-best').textContent = bestScore;
    document.getElementById('hud-best').textContent = bestScore;
    GO.showOverlay();
}}

function spawnEntity() {{
    // Generic spawner for endless/survival type mechanics
    if (frameCount % Math.max(20, 60 - Math.floor(score/50)) === 0) {{
        entities.push({{
            x: Math.random() * (canvas.width - 20),
            y: -20,
            width: 20 + Math.random() * 20,
            height: 20 + Math.random() * 20,
            speed: 3 + Math.random() * 4 + (score/100),
            color: `hsl(${{Math.random() * 360}}, 70%, 50%)`,
            isBad: Math.random() > 0.2 // 80% enemies, 20% score blocks
        }});
    }}
}}

function updateEntities() {{
    for (let i = entities.length - 1; i >= 0; i--) {{
        let e = entities[i];
        e.y += e.speed;
        
        // Collision logic
        if (player.x < e.x + e.width &&
            player.x + player.width > e.x &&
            player.y < e.y + e.height &&
            player.y + player.height > e.y) {{
            if (e.isBad) {{
                gameOver();
                return;
            }} else {{
                score += 50;
                entities.splice(i, 1);
                document.getElementById('hud-score').textContent = score;
                GO.toast('+50 Bonus!');
                continue;
            }}
        }}
        
        if (e.y > canvas.height) {{
            if (e.isBad) {{
                score += 10; // Evaded enemy
                document.getElementById('hud-score').textContent = score;
            }}
            entities.splice(i, 1);
        }}
    }}
}}

function draw() {{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid background
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=40) {{
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }}
    for(let i=0; i<canvas.height; i+=40) {{
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }}
    
    // Draw player
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 10;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0; // reset
    
    // Draw entities
    for (let e of entities) {{
        ctx.fillStyle = e.isBad ? '#ef4444' : '#10b981';
        ctx.beginPath();
        if (e.isBad) {{
            ctx.arc(e.x + e.width/2, e.y + e.height/2, e.width/2, 0, Math.PI*2);
        }} else {{
            ctx.rect(e.x, e.y, e.width, e.height);
        }}
        ctx.fill();
    }}
    
    // Simple UI instructions
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Drag / Move to avoid Red dots, collect Green boxes!', 10, 20);
}}

function gameLoop() {{
    if (!isPlaying) return;
    frameCount++;
    
    // Smooth follow mouse/touch
    let dx = mouseX - (player.x + player.width/2);
    let dy = mouseY - (player.y + player.height/2);
    player.x += dx * 0.15;
    player.y += dy * 0.15;
    
    // Bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    spawnEntity();
    updateEntities();
    draw();
    
    animationId = requestAnimationFrame(gameLoop);
}}

// Controls
function updateMouse(e) {{
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    mouseX = clientX - rect.left;
    mouseY = clientY - rect.top;
}}

canvas.addEventListener('mousemove', updateMouse);
canvas.addEventListener('touchmove', (e) => {{
    e.preventDefault();
    updateMouse(e);
}}, {{passive: false}});
canvas.addEventListener('mousedown', (e) => {{
    if(!isPlaying) initGame();
}});
canvas.addEventListener('touchstart', (e) => {{
    if(!isPlaying) initGame();
}});

document.getElementById('go-overlay-btn').addEventListener('click', initGame);

// Start on load
resize();
draw(); // Initial draw
ctx.fillStyle = '#fff';
ctx.textAlign = 'center';
ctx.font = '20px Arial';
ctx.fillText('Tap or Click to Start {name}', canvas.width/2, canvas.height/2);
"""

base_dir = "/Users/gauravpurohit/Documents/GP/Playmix/gameorbit"

if not os.path.exists(base_dir):
    os.makedirs(base_dir)

for game in games:
    slug_dir = os.path.join(base_dir, game["slug"])
    if not os.path.exists(slug_dir):
        os.makedirs(slug_dir)
    
    # Process HTML
    html_content = html_template.format(
        name=game["name"],
        slug=game["slug"],
        article_short=game["article"][:150].replace('"', "'"),
        genre=game["genre"],
        gradient=game["gradient"],
        emoji=game["emoji"],
        variant=game["variant"],
        article=game["article"],
        original=game["original"]
    )
    
    with open(os.path.join(slug_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html_content)
        
    # Process JS
    js_content = game_js_template.format(
        name=game["name"],
        slug=game["slug"]
    )
    
    with open(os.path.join(slug_dir, "game.js"), "w", encoding="utf-8") as f:
        f.write(js_content)

print("Batch C generated successfully.")
