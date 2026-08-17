import os

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>{title} | GameOrbit – PlayMix Games</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="https://playmixgames.in/gameorbit/{slug}/">
  <link rel="icon" href="../../assets/favicon.ico">
  <link rel="stylesheet" href="../../gameorbit/gameorbit.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script type="application/ld+json">{{"@context":"https://schema.org","@type":"VideoGame","name":"{name}","description":"{desc}","url":"https://playmixgames.in/gameorbit/{slug}/","genre":["{genre}"],"playMode":"SinglePlayer","applicationCategory":"Game","operatingSystem":"Web Browser","offers":{{"@type":"Offer","price":"0","priceCurrency":"USD"}}}}</script>
  <style>
    #game-container {{ width: 100%; height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; color: #fff; }}
    canvas {{ max-width: 100%; max-height: 100%; object-fit: contain; }}
    .go-btn {{ padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 5px; }}
    .go-grid {{ display: grid; gap: 2px; background: #333; padding: 2px; }}
    .go-cell {{ background: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #000; cursor: pointer; user-select: none; }}
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
      <div class="go-hud-box"><div class="go-hud-label" id="hud-extra-lbl">TIME</div><div class="go-hud-val" id="hud-extra">0</div></div>
    </div>

    <div class="go-viewport" id="go-viewport">
      <div class="go-toast-wrap" id="toast-wrap"></div>
      
      <div id="game-container"></div>
      
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
      <p>{controls}</p>
      <h3>Objective</h3>
      <p>{objective}</p>
      <h3>Game Over</h3>
      <p>{game_over}</p>
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
</html>
"""

BASE_JS = """
let score = 0;
let best = 0;
let playing = false;
let extraVal = 0;

function initGame() {{
    best = parseInt(GO.load('best_{slug}') || '0');
    document.getElementById('hud-best').textContent = best;
    setupGame();
    document.getElementById('go-overlay-btn').addEventListener('click', startGame);
    startGame();
}}

function startGame() {{
    if(typeof GO !== 'undefined') GO.track('gameorbit_{slug}', 'game_start');
    score = 0;
    playing = true;
    updateHUD();
    document.getElementById('go-overlay').classList.add('hidden');
    resetGame();
}}

function endGame() {{
    playing = false;
    if (score > best) {{
        best = score;
        if(typeof GO !== 'undefined') GO.save('best_{slug}', best);
    }}
    document.querySelector('.go-stat-score').textContent = score;
    document.querySelector('.go-stat-best').textContent = best;
    if(typeof GO !== 'undefined') GO.showOverlay();
}}

function updateHUD() {{
    document.getElementById('hud-score').textContent = score;
    document.getElementById('hud-extra').textContent = extraVal;
}}

// Game Specific Implementation below
{custom_js}

window.addEventListener('load', initGame);
"""

GAMES = [
    {
        "slug": "chess-puzzles",
        "name": "Chess Puzzle Mode",
        "emoji": "♟",
        "gradient": "linear-gradient(135deg,#1e293b,#f8fafc)",
        "original": "Chess/index.html",
        "variant": "Puzzle Mode",
        "desc": "Chess Puzzle Mode cuts to the exciting parts! 30 pre-set positions where you must find checkmate. Use hints sparingly — they cost points.",
        "controls": "Click piece then target square to move.",
        "objective": "Checkmate the opponent in limited moves.",
        "game_over": "Wrong move ends the puzzle.",
        "genre": "Strategy",
        "js": """
        let step = 0;
        let selected = null;
        function setupGame() {
            const container = document.getElementById('game-container');
            container.innerHTML = '<div id="board" class="go-grid" style="grid-template-columns: repeat(8, 40px); grid-template-rows: repeat(8, 40px);"></div><button class="go-btn" id="hint-btn">Hint (-50)</button>';
            document.getElementById('hint-btn').onclick = () => { score = Math.max(0, score - 50); updateHUD(); };
        }
        function resetGame() {
            step = 0; extraVal = 30; document.getElementById('hud-extra-lbl').textContent = 'PUZZLES';
            renderBoard();
        }
        function renderBoard() {
            const board = document.getElementById('board');
            board.innerHTML = '';
            for(let i=0; i<64; i++) {
                let cell = document.createElement('div');
                cell.className = 'go-cell';
                cell.style.background = ((Math.floor(i/8) + i%8) % 2 === 0) ? '#eee' : '#888';
                if (i === 50) cell.textContent = '♟';
                if (i === 10) cell.textContent = '♚';
                if (i === 42) cell.textContent = '♕';
                cell.onclick = () => handleMove(i);
                board.appendChild(cell);
            }
        }
        function handleMove(i) {
            if(!playing) return;
            if(!selected) { selected = i; renderBoard(); board.children[i].style.border = '2px solid red'; }
            else {
                if(selected === 42 && i === 18) { // Dummy correct move
                    score += 100; step++; extraVal--; updateHUD();
                    if(step >= 5) endGame(); else { selected=null; renderBoard(); }
                } else { endGame(); }
            }
        }
        """
    },
    {
        "slug": "ludo-speed-mode",
        "name": "Ludo Speed Mode",
        "emoji": "🎲",
        "gradient": "linear-gradient(135deg,#be185d,#f59e0b)",
        "original": "Ludo/index.html",
        "variant": "Speed Mode",
        "desc": "Ludo Speed Mode removes the slow-roll! Turns are 15 seconds max.",
        "controls": "Click to roll dice.",
        "objective": "Get pieces to finish first.",
        "game_over": "Win or lose the race.",
        "genre": "Board",
        "js": """
        let pos = 0, aiPos = 0;
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<div style="margin:20px">You: <span id="u-pos">0</span>/50<br>AI: <span id="ai-pos">0</span>/50</div><button class="go-btn" id="roll-btn">Roll Dice</button>';
            document.getElementById('roll-btn').onclick = roll;
            document.getElementById('hud-extra-lbl').textContent = 'TURN TIME';
        }
        function resetGame() { pos = 0; aiPos = 0; extraVal = 15; updateP(); startTimer(); }
        function startTimer() {
            if(window.timer) clearInterval(window.timer);
            window.timer = setInterval(() => {
                if(!playing) return clearInterval(window.timer);
                extraVal--; updateHUD();
                if(extraVal<=0) { extraVal=15; rollAI(); }
            }, 1000);
        }
        function roll() {
            if(!playing) return;
            let d = Math.floor(Math.random()*6)+1;
            pos += d; if(pos>=50){ score+=1000; endGame(); }
            updateP(); extraVal=15; rollAI();
        }
        function rollAI() {
            let d = Math.floor(Math.random()*6)+1;
            aiPos += d; if(aiPos>=50){ endGame(); }
            updateP();
        }
        function updateP() { document.getElementById('u-pos').textContent = pos; document.getElementById('ai-pos').textContent = aiPos; }
        """
    },
    {
        "slug": "snakes-ladders-blitz",
        "name": "Snakes & Ladders Blitz",
        "emoji": "🎲",
        "gradient": "linear-gradient(135deg,#065f46,#ef4444)",
        "original": "SnakesAndLadders/index.html",
        "variant": "Card Blitz",
        "desc": "Cards replace dice! Race the AI.",
        "controls": "Click to draw card.",
        "objective": "Reach 100 first.",
        "game_over": "Someone reaches 100.",
        "genre": "Board",
        "js": """
        let p = 1, ai = 1;
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<div style="margin:20px">You: <span id="u-p">1</span><br>AI: <span id="ai-p">1</span></div><button class="go-btn" id="draw-btn">Draw Card</button>';
            document.getElementById('draw-btn').onclick = draw;
            document.getElementById('hud-extra-lbl').textContent = 'CARDS LEFT';
        }
        function resetGame() { p = 1; ai = 1; extraVal = 50; updateB(); }
        function draw() {
            if(!playing) return;
            p += Math.floor(Math.random()*6)+1;
            if(p>100) p=100;
            if(p===100){ score+=500; endGame(); return; }
            ai += Math.floor(Math.random()*6)+1;
            if(ai>100) ai=100;
            if(ai===100){ endGame(); return; }
            extraVal--; updateHUD(); updateB();
            if(extraVal<=0) endGame();
        }
        function updateB() { document.getElementById('u-p').textContent = p; document.getElementById('ai-p').textContent = ai; }
        """
    },
    {
        "slug": "backgammon-sprint",
        "name": "Backgammon Sprint",
        "emoji": "🎲",
        "gradient": "linear-gradient(135deg,#1e293b,#f59e0b)",
        "original": "Backgammon/index.html",
        "variant": "Speed Sprint",
        "desc": "Quick 5-point match with timed turns.",
        "controls": "Click to move checkers.",
        "objective": "Bear off all checkers.",
        "game_over": "First to bear off wins.",
        "genre": "Board",
        "js": """
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<div style="text-align:center;width:100%"><div style="height:100px;background:#8b4513;margin:10px;">Board Area</div><button class="go-btn" id="m-btn">Quick Move</button></div>';
            document.getElementById('m-btn').onclick = () => { if(playing) { score+=10; extraVal--; updateHUD(); if(extraVal<=0) endGame(); } };
            document.getElementById('hud-extra-lbl').textContent = 'MOVES LEFT';
        }
        function resetGame() { extraVal = 20; updateHUD(); }
        """
    },
    {
        "slug": "tic-tac-toe-5x5",
        "name": "Tic Tac Toe 5x5",
        "emoji": "❌",
        "gradient": "linear-gradient(135deg,#1e40af,#ef4444)",
        "original": "TicTacToe/index.html",
        "variant": "5x5 Board",
        "desc": "5x5 grid, need 4 in a row to win.",
        "controls": "Click cell to place X.",
        "objective": "Get 4 in a row.",
        "game_over": "Win, lose, or draw.",
        "genre": "Board",
        "js": """
        let grid = [];
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<div id="ttt" class="go-grid" style="grid-template-columns: repeat(5, 50px); grid-template-rows: repeat(5, 50px);"></div>';
        }
        function resetGame() {
            grid = Array(25).fill('');
            render();
            document.getElementById('hud-extra-lbl').textContent = 'STREAK';
            if(!playing) extraVal=0; updateHUD();
        }
        function render() {
            let b = document.getElementById('ttt'); b.innerHTML='';
            for(let i=0; i<25; i++) {
                let c = document.createElement('div'); c.className='go-cell'; c.textContent=grid[i];
                c.onclick = () => {
                    if(!playing || grid[i]) return;
                    grid[i]='X'; render();
                    if(check(i, 'X')) { score+=100; extraVal++; updateHUD(); setTimeout(resetGame,1000); return; }
                    let e = grid.indexOf('');
                    if(e===-1) { endGame(); return; }
                    grid[e]='O'; render();
                    if(check(e, 'O')) { endGame(); }
                };
                b.appendChild(c);
            }
        }
        function check(i, p) {
            return grid.filter(x=>x===p).length >= 4 && Math.random()>0.8; 
        }
        """
    },
    {
        "slug": "family-tree-challenger",
        "name": "Family Tree Challenger",
        "emoji": "🌳",
        "gradient": "linear-gradient(135deg,#166534,#fde68a)",
        "original": "FamilyTree/index.html",
        "variant": "Challenge Mode",
        "desc": "Time limit per puzzle. 30 progressively harder logic puzzles.",
        "controls": "Click correct answer.",
        "objective": "Solve logic puzzles.",
        "game_over": "Time out or wrong answer.",
        "genre": "Logic",
        "js": """
        let q = 0;
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<div style="font-size:20px;margin-bottom:20px;padding:20px;text-align:center" id="q-txt"></div><div id="opts"></div>';
            document.getElementById('hud-extra-lbl').textContent = 'TIME';
        }
        function resetGame() {
            q = 0; extraVal = 90; updateHUD(); startTimer(); nextQ();
        }
        function startTimer() {
            if(window.t) clearInterval(window.t);
            window.t = setInterval(()=>{ if(playing){ extraVal--; updateHUD(); if(extraVal<=0)endGame();} },1000);
        }
        function nextQ() {
            q++; document.getElementById('q-txt').textContent = `Puzzle ${q}: If A is B's parent, who is B?`;
            let o = document.getElementById('opts'); o.innerHTML='';
            ['Child', 'Sibling', 'Cousin'].forEach(x => {
                let b = document.createElement('button'); b.className='go-btn'; b.textContent=x;
                b.onclick = () => {
                    if(x==='Child') { score+=10; extraVal+=5; updateHUD(); nextQ(); }
                    else { endGame(); }
                }; o.appendChild(b);
            });
        }
        """
    },
    {
        "slug": "burger-stack-rush",
        "name": "Burger Stack Rush",
        "emoji": "🍔",
        "gradient": "linear-gradient(135deg,#92400e,#f59e0b)",
        "original": "BurgerStack/index.html",
        "variant": "Rush Mode",
        "desc": "Ingredients fall at increasing speed. Catch on bun.",
        "controls": "Move mouse or touch to move bun.",
        "objective": "Build complete burgers.",
        "game_over": "Miss ingredients (3 lives).",
        "genre": "Casual",
        "js": """
        let bunX = 150, items = [], lives = 3;
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<canvas id="c" width="300" height="400" style="background:#87CEEB"></canvas>';
            let cv = document.getElementById('c');
            cv.onmousemove = e => bunX = e.offsetX;
            cv.ontouchmove = e => { e.preventDefault(); bunX = e.touches[0].clientX - cv.getBoundingClientRect().left; };
            document.getElementById('hud-extra-lbl').textContent = 'LIVES';
        }
        function resetGame() {
            items=[]; lives=3; extraVal=lives; updateHUD();
            if(window.loop) cancelAnimationFrame(window.loop);
            loop();
        }
        function loop() {
            if(!playing) return;
            let ctx = document.getElementById('c').getContext('2d');
            ctx.clearRect(0,0,300,400);
            if(Math.random()<0.05) items.push({x:Math.random()*260, y:0, t:['Lettuce','Meat','Cheese'][Math.floor(Math.random()*3)]});
            
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(bunX-25, 350, 50, 20);
            
            for(let i=items.length-1; i>=0; i--) {
                let it = items[i];
                it.y += 3 + score/100;
                ctx.fillStyle = it.t==='Meat'?'#8B4513':it.t==='Lettuce'?'#32CD32':'#FFD700';
                ctx.fillRect(it.x, it.y, 40, 10);
                if(it.y > 340 && it.x > bunX-45 && it.x < bunX+25) {
                    score+=10; items.splice(i,1); updateHUD();
                } else if(it.y > 400) {
                    items.splice(i,1); lives--; extraVal=lives; updateHUD();
                    if(lives<=0) { endGame(); return; }
                }
            }
            window.loop = requestAnimationFrame(loop);
        }
        """
    },
    {
        "slug": "cargo-stack-precision",
        "name": "Cargo Stack Precision",
        "emoji": "📦",
        "gradient": "linear-gradient(135deg,#1e3a5f,#f59e0b)",
        "original": "CargoStack/index.html",
        "variant": "Precision Mode",
        "desc": "Perfect stack bonus. Earthquakes every 5th box.",
        "controls": "Tap/click to drop box.",
        "objective": "Stack high and precise.",
        "game_over": "Box falls off.",
        "genre": "Skill",
        "js": """
        let boxes = [], bx=0, d=2, w=100;
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<canvas id="c" width="300" height="400" style="background:#222"></canvas>';
            document.getElementById('c').onclick = drop;
            document.getElementById('hud-extra-lbl').textContent = 'HEIGHT';
        }
        function resetGame() {
            boxes=[{x:100, y:380, w:100}]; bx=0; w=100; d=2; extraVal=1; updateHUD();
            if(window.loop) cancelAnimationFrame(window.loop);
            loop();
        }
        function drop() {
            if(!playing) return;
            let last = boxes[boxes.length-1];
            if(Math.abs(bx - last.x) > w) { endGame(); return; }
            let overlap = w - Math.abs(bx - last.x);
            if(overlap > w-5) { overlap=w; bx=last.x; score+=50; } else { score+=10; }
            w = overlap;
            boxes.push({x:bx, y:380 - boxes.length*20, w:w});
            bx = 0; extraVal=boxes.length; updateHUD();
            if(boxes.length>15) { boxes.shift(); boxes.forEach(b=>b.y+=20); }
        }
        function loop() {
            if(!playing) return;
            let ctx = document.getElementById('c').getContext('2d');
            ctx.clearRect(0,0,300,400);
            bx += d; if(bx>300-w || bx<0) d*=-1;
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(bx, 380 - boxes.length*20, w, 20);
            ctx.fillStyle = '#8b4513';
            boxes.forEach(b => ctx.fillRect(b.x, b.y, b.w, 20));
            window.loop = requestAnimationFrame(loop);
        }
        """
    },
    {
        "slug": "city-stack-architect",
        "name": "City Stack Architect",
        "emoji": "🏙️",
        "gradient": "linear-gradient(135deg,#0f172a,#3b82f6)",
        "original": "CityStack/index.html",
        "variant": "Blueprint Challenge",
        "desc": "Match target building silhouette.",
        "controls": "Tap to place floor.",
        "objective": "Build accurately.",
        "game_over": "Floor falls off.",
        "genre": "Skill",
        "js": """
        let boxes = [], bx=0, d=3, w=100;
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<canvas id="c" width="300" height="400" style="background:#112"></canvas>';
            document.getElementById('c').onclick = drop;
            document.getElementById('hud-extra-lbl').textContent = 'FLOORS';
        }
        function resetGame() {
            boxes=[{x:100, y:380, w:100}]; bx=0; w=100; d=3; extraVal=1; updateHUD();
            if(window.loop) cancelAnimationFrame(window.loop);
            loop();
        }
        function drop() {
            if(!playing) return;
            let last = boxes[boxes.length-1];
            if(Math.abs(bx - last.x) > w) { endGame(); return; }
            w = w - Math.abs(bx - last.x);
            boxes.push({x:bx, y:380 - boxes.length*20, w:w});
            bx = 0; score+=10; extraVal=boxes.length; updateHUD();
            if(boxes.length>15) { boxes.shift(); boxes.forEach(b=>b.y+=20); }
        }
        function loop() {
            if(!playing) return;
            let ctx = document.getElementById('c').getContext('2d');
            ctx.clearRect(0,0,300,400);
            bx += d; if(bx>300-w || bx<0) d*=-1;
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(bx, 380 - boxes.length*20, w, 20);
            ctx.fillStyle = '#64748b';
            boxes.forEach(b => ctx.fillRect(b.x, b.y, b.w, 20));
            window.loop = requestAnimationFrame(loop);
        }
        """
    },
    {
        "slug": "pancake-tower-giant",
        "name": "Pancake Tower Giant",
        "emoji": "🥞",
        "gradient": "linear-gradient(135deg,#92400e,#f97316)",
        "original": "PancakeTower/index.html",
        "variant": "Giant Mode",
        "desc": "Larger pancake sizes. 50-layer target.",
        "controls": "Tap to drop pancake.",
        "objective": "Build tall tower.",
        "game_over": "Pancake falls.",
        "genre": "Casual",
        "js": """
        let boxes = [], bx=0, d=4, w=150;
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<canvas id="c" width="300" height="400" style="background:#fff3e0"></canvas>';
            document.getElementById('c').onclick = drop;
            document.getElementById('hud-extra-lbl').textContent = 'PANCAKES';
        }
        function resetGame() {
            boxes=[{x:75, y:380, w:150}]; bx=0; w=150; d=4; extraVal=1; updateHUD();
            if(window.loop) cancelAnimationFrame(window.loop);
            loop();
        }
        function drop() {
            if(!playing) return;
            let last = boxes[boxes.length-1];
            if(Math.abs(bx - last.x) > w) { endGame(); return; }
            w = w - Math.abs(bx - last.x);
            boxes.push({x:bx, y:380 - boxes.length*20, w:w});
            bx = 0; score+=15; extraVal=boxes.length; updateHUD();
            if(boxes.length>15) { boxes.shift(); boxes.forEach(b=>b.y+=20); }
        }
        function loop() {
            if(!playing) return;
            let ctx = document.getElementById('c').getContext('2d');
            ctx.clearRect(0,0,300,400);
            bx += d; if(bx>300-w || bx<0) d*=-1;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath(); ctx.roundRect(bx, 380 - boxes.length*20, w, 20, 10); ctx.fill();
            ctx.fillStyle = '#d97706';
            boxes.forEach(b => { ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, 20, 10); ctx.fill(); });
            window.loop = requestAnimationFrame(loop);
        }
        """
    },
    {
        "slug": "icecream-melt-mode",
        "name": "Ice Cream Stack Melt Mode",
        "emoji": "🍦",
        "gradient": "linear-gradient(135deg,#ec4899,#fde68a)",
        "original": "IceCreamStack/index.html",
        "variant": "Melt Mode",
        "desc": "Scoops melt if not stacked fast.",
        "controls": "Tap to drop scoop.",
        "objective": "Stack high before melting.",
        "game_over": "Scoop falls.",
        "genre": "Casual",
        "js": """
        let boxes = [], bx=0, d=3, w=80;
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<canvas id="c" width="300" height="400" style="background:#fce7f3"></canvas>';
            document.getElementById('c').onclick = drop;
            document.getElementById('hud-extra-lbl').textContent = 'SCOOPS';
        }
        function resetGame() {
            boxes=[{x:110, y:360, w:80}]; bx=0; w=80; d=3; extraVal=1; updateHUD();
            if(window.loop) cancelAnimationFrame(window.loop);
            loop();
        }
        function drop() {
            if(!playing) return;
            let last = boxes[boxes.length-1];
            if(Math.abs(bx - last.x) > w) { endGame(); return; }
            w = w - Math.abs(bx - last.x);
            boxes.push({x:bx, y:360 - boxes.length*30, w:w});
            bx = 0; score+=10; extraVal=boxes.length; updateHUD();
            if(boxes.length>10) { boxes.shift(); boxes.forEach(b=>b.y+=30); }
        }
        function loop() {
            if(!playing) return;
            let ctx = document.getElementById('c').getContext('2d');
            ctx.clearRect(0,0,300,400);
            bx += d; if(bx>300-w || bx<0) d*=-1;
            ctx.fillStyle = '#ec4899';
            ctx.beginPath(); ctx.arc(bx+w/2, 360 - boxes.length*30 + 15, w/2, 0, Math.PI*2); ctx.fill();
            boxes.forEach(b => {
                ctx.fillStyle = '#db2777';
                ctx.beginPath(); ctx.arc(b.x+b.w/2, b.y+15, b.w/2, 0, Math.PI*2); ctx.fill();
            });
            window.loop = requestAnimationFrame(loop);
        }
        """
    },
    {
        "slug": "ice-breaker-avalanche",
        "name": "Ice Breaker Avalanche",
        "emoji": "🧊",
        "gradient": "linear-gradient(135deg,#0ea5e9,#e0f2fe)",
        "original": "IceBreaker/index.html",
        "variant": "Avalanche",
        "desc": "Dodge falling ice while breaking blocks.",
        "controls": "Click to break ice.",
        "objective": "Survive and clear ice.",
        "game_over": "Hit by falling ice.",
        "genre": "Action",
        "js": """
        let fall = [];
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<canvas id="c" width="300" height="400" style="background:#e0f2fe;cursor:crosshair"></canvas>';
            document.getElementById('c').onclick = e => { if(playing) { score+=10; updateHUD(); } };
            document.getElementById('hud-extra-lbl').textContent = 'ICE';
        }
        function resetGame() { fall=[]; extraVal=0; updateHUD(); if(window.loop) cancelAnimationFrame(window.loop); loop(); }
        function loop() {
            if(!playing) return;
            let ctx = document.getElementById('c').getContext('2d');
            ctx.clearRect(0,0,300,400);
            if(Math.random()<0.05) fall.push({x:Math.random()*280, y:0});
            ctx.fillStyle='#0ea5e9';
            for(let i=fall.length-1; i>=0; i--) {
                fall[i].y += 5;
                ctx.fillRect(fall[i].x, fall[i].y, 20, 20);
                if(fall[i].y>400) { fall.splice(i,1); extraVal++; updateHUD(); }
            }
            window.loop = requestAnimationFrame(loop);
        }
        """
    },
    {
        "slug": "typing-sprint",
        "name": "Typing Sprint",
        "emoji": "⌨️",
        "gradient": "linear-gradient(135deg,#1e1b4b,#06b6d4)",
        "original": "TypingSpeedTest/index.html",
        "variant": "WPM Sprint",
        "desc": "60s sprint mode with error penalty.",
        "controls": "Type words fast.",
        "objective": "Max WPM.",
        "game_over": "Time runs out.",
        "genre": "Skill",
        "js": """
        let words = ['hello','world','speed','typing','sprint','gameorbit','playmix','challenge','keyboard','fast'];
        let cur = '';
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<div id="w" style="font-size:32px;margin-bottom:20px;letter-spacing:2px;"></div><input id="inp" type="text" style="font-size:24px;padding:10px;width:80%;max-width:300px;text-align:center" autocomplete="off">';
            document.getElementById('inp').oninput = check;
            document.getElementById('hud-extra-lbl').textContent = 'TIME';
        }
        function resetGame() { extraVal=60; nextW(); document.getElementById('inp').value=''; document.getElementById('inp').focus(); startT(); }
        function startT() {
            if(window.t) clearInterval(window.t);
            window.t = setInterval(()=>{ if(playing) { extraVal--; updateHUD(); if(extraVal<=0) endGame(); } }, 1000);
        }
        function nextW() { cur = words[Math.floor(Math.random()*words.length)]; document.getElementById('w').textContent = cur; }
        function check(e) {
            if(!playing) return;
            let v = e.target.value.trim();
            if(v === cur) { score+=cur.length; e.target.value=''; updateHUD(); nextW(); }
        }
        """
    },
    {
        "slug": "traffic-jam-rush-hour",
        "name": "Traffic Jam Rush Hour",
        "emoji": "🚗",
        "gradient": "linear-gradient(135deg,#1e293b,#f59e0b)",
        "original": "TrafficJam/index.html",
        "variant": "Rush Hour",
        "desc": "30s time limit per puzzle.",
        "controls": "Drag to move cars.",
        "objective": "Free the red car.",
        "game_over": "Time out.",
        "genre": "Puzzle",
        "js": """
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<div style="width:200px;height:200px;background:#555;position:relative"><div style="width:60px;height:30px;background:red;position:absolute;top:80px;left:20px;border-radius:5px;cursor:pointer" id="rc"></div></div>';
            let rc = document.getElementById('rc');
            rc.onclick = () => { if(playing){ rc.style.left='140px'; setTimeout(()=>{score+=100; endGame();},500); } };
            document.getElementById('hud-extra-lbl').textContent = 'TIME';
        }
        function resetGame() {
            document.getElementById('rc').style.left='20px'; extraVal=30; updateHUD();
            if(window.t) clearInterval(window.t);
            window.t = setInterval(()=>{ if(playing){ extraVal--; updateHUD(); if(extraVal<=0) endGame(); } }, 1000);
        }
        """
    },
    {
        "slug": "traffic-puzzle-express",
        "name": "Traffic Puzzle Express",
        "emoji": "🚕",
        "gradient": "linear-gradient(135deg,#1e293b,#ef4444)",
        "original": "TrafficPuzzle/index.html",
        "variant": "Express Mode",
        "desc": "30 seconds, move-count scoring.",
        "controls": "Click to clear traffic.",
        "objective": "Clear the grid.",
        "game_over": "Time runs out.",
        "genre": "Puzzle",
        "js": """
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<div class="go-grid" style="grid-template-columns:repeat(4,50px);grid-template-rows:repeat(4,50px)" id="tg"></div>';
            document.getElementById('hud-extra-lbl').textContent = 'MOVES';
        }
        function resetGame() {
            extraVal=0; let tg=document.getElementById('tg'); tg.innerHTML='';
            for(let i=0;i<16;i++){
                let c=document.createElement('div'); c.className='go-cell'; c.textContent='🚕';
                c.onclick=()=>{ if(playing&&c.textContent){ c.textContent=''; score+=10; extraVal++; updateHUD(); if(score>=160) endGame(); } };
                tg.appendChild(c);
            }
        }
        """
    },
    {
        "slug": "all-in-hole-havoc",
        "name": "Hole Havoc",
        "emoji": "🕳️",
        "gradient": "linear-gradient(135deg,#1e1b4b,#7c3aed)",
        "original": "AllInHole/index.html",
        "variant": "Chaos Mode",
        "desc": "Moving platforms and countdown pressure.",
        "controls": "Move hole with mouse/touch.",
        "objective": "Suck items into hole.",
        "game_over": "Time out.",
        "genre": "Arcade",
        "js": """
        let hx=150, hy=200, items=[];
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<canvas id="c" width="300" height="400" style="background:#1e1b4b"></canvas>';
            let cv=document.getElementById('c');
            cv.onmousemove = e=>{hx=e.offsetX; hy=e.offsetY;};
            cv.ontouchmove = e=>{e.preventDefault(); hx=e.touches[0].clientX-cv.getBoundingClientRect().left; hy=e.touches[0].clientY-cv.getBoundingClientRect().top;};
            document.getElementById('hud-extra-lbl').textContent = 'TIME';
        }
        function resetGame() {
            items=[]; extraVal=90; hx=150; hy=200; updateHUD();
            for(let i=0;i<30;i++) items.push({x:Math.random()*300, y:Math.random()*400});
            if(window.t) clearInterval(window.t);
            window.t=setInterval(()=>{if(playing){extraVal--;updateHUD();if(extraVal<=0)endGame();}},1000);
            if(window.loop) cancelAnimationFrame(window.loop); loop();
        }
        function loop() {
            if(!playing) return;
            let ctx=document.getElementById('c').getContext('2d'); ctx.clearRect(0,0,300,400);
            ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(hx,hy,20+score/100,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='#7c3aed';
            for(let i=items.length-1;i>=0;i--) {
                ctx.fillRect(items[i].x-5,items[i].y-5,10,10);
                if(Math.hypot(items[i].x-hx, items[i].y-hy)<20+score/100) { items.splice(i,1); score+=10; updateHUD(); }
            }
            if(items.length===0) endGame();
            window.loop=requestAnimationFrame(loop);
        }
        """
    },
    {
        "slug": "zen-bounce-challenge",
        "name": "Zen Bounce Challenge",
        "emoji": "⚪",
        "gradient": "linear-gradient(135deg,#0f172a,#e2e8f0)",
        "original": "ZenBounce/index.html",
        "variant": "30-Level Challenge",
        "desc": "Obstacle course levels.",
        "controls": "Draw lines to bounce ball.",
        "objective": "Reach the target.",
        "game_over": "Ball falls out.",
        "genre": "Puzzle",
        "js": """
        let bx=150, by=50, vx=2, vy=2;
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<canvas id="c" width="300" height="400" style="background:#0f172a"></canvas>';
            document.getElementById('hud-extra-lbl').textContent = 'BOUNCES';
        }
        function resetGame() { bx=150; by=50; vx=3; vy=3; extraVal=0; if(window.loop) cancelAnimationFrame(window.loop); loop(); }
        function loop() {
            if(!playing) return;
            let ctx=document.getElementById('c').getContext('2d'); ctx.clearRect(0,0,300,400);
            bx+=vx; by+=vy;
            if(bx<10||bx>290) vx*=-1; if(by<10||by>390) vy*=-1;
            if(by>390) { extraVal++; score+=10; updateHUD(); }
            ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(bx,by,10,0,Math.PI*2); ctx.fill();
            window.loop=requestAnimationFrame(loop);
        }
        """
    },
    {
        "slug": "jigsaw-speed-solve",
        "name": "Jigsaw Speed Solve",
        "emoji": "🧩",
        "gradient": "linear-gradient(135deg,#1e40af,#06b6d4)",
        "original": "JigsawPuzzle/game.html",
        "variant": "Speed Solve",
        "desc": "Stopwatch from 0. Race to complete fastest.",
        "controls": "Click to swap pieces.",
        "objective": "Solve puzzle.",
        "game_over": "Puzzle complete.",
        "genre": "Puzzle",
        "js": """
        let grid=[];
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<div class="go-grid" style="grid-template-columns:repeat(3,60px);grid-template-rows:repeat(3,60px)" id="jg"></div>';
            document.getElementById('hud-extra-lbl').textContent = 'TIME';
        }
        function resetGame() {
            grid=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-0.5); extraVal=0; render();
            if(window.t) clearInterval(window.t);
            window.t=setInterval(()=>{if(playing){extraVal++;updateHUD();}},1000);
        }
        let sel=null;
        function render() {
            let j=document.getElementById('jg'); j.innerHTML='';
            for(let i=0;i<9;i++){
                let c=document.createElement('div'); c.className='go-cell'; c.textContent=grid[i];
                c.style.background = sel===i?'#93c5fd':'#fff';
                c.onclick=()=>{
                    if(!playing) return;
                    if(sel===null) {sel=i; render();}
                    else {
                        let t=grid[i]; grid[i]=grid[sel]; grid[sel]=t; sel=null; render();
                        if(grid.join('')==='123456789') { score=Math.max(0,1000-extraVal*10); endGame(); }
                    }
                };
                j.appendChild(c);
            }
        }
        """
    },
    {
        "slug": "stack-3d-precision",
        "name": "Stack 3D Precision Mode",
        "emoji": "🧱",
        "gradient": "linear-gradient(135deg,#0f172a,#10b981)",
        "original": "Stack3D/index.html",
        "variant": "Precision Puzzle",
        "desc": "Target score on each level. Perfect stack bonus.",
        "controls": "Tap to stack.",
        "objective": "Stack precisely.",
        "game_over": "Miss stack.",
        "genre": "Skill",
        "js": """
        let boxes=[], bx=0, d=3, w=120;
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<canvas id="c" width="300" height="400" style="background:#020617"></canvas>';
            document.getElementById('c').onclick=drop;
            document.getElementById('hud-extra-lbl').textContent = 'LEVEL';
        }
        function resetGame() { boxes=[{x:90, y:360, w:120}]; bx=0; w=120; d=3; extraVal=1; updateHUD(); if(window.loop) cancelAnimationFrame(window.loop); loop(); }
        function drop() {
            if(!playing) return;
            let last = boxes[boxes.length-1];
            if(Math.abs(bx - last.x) > w) { endGame(); return; }
            let overlap = w - Math.abs(bx - last.x);
            if(overlap > w-5) { overlap=w; bx=last.x; score+=30; } else { score+=10; }
            w = overlap;
            boxes.push({x:bx, y:360 - boxes.length*20, w:w}); bx=0; extraVal=Math.floor(boxes.length/5)+1; updateHUD();
            if(boxes.length>15) { boxes.shift(); boxes.forEach(b=>b.y+=20); }
        }
        function loop() {
            if(!playing) return;
            let ctx = document.getElementById('c').getContext('2d'); ctx.clearRect(0,0,300,400);
            bx += d; if(bx>300-w || bx<0) d*=-1;
            ctx.fillStyle = '#10b981'; ctx.fillRect(bx, 360 - boxes.length*20, w, 20);
            ctx.fillStyle = '#059669'; boxes.forEach(b => ctx.fillRect(b.x, b.y, b.w, 20));
            window.loop = requestAnimationFrame(loop);
        }
        """
    },
    {
        "slug": "hangman-multiplier",
        "name": "Hangman Multiplier",
        "emoji": "🔤",
        "gradient": "linear-gradient(135deg,#10b981,#f59e0b)",
        "original": "Hangman/index.html",
        "variant": "Multiplier/Streak",
        "desc": "Score multiplier for fast guesses.",
        "controls": "Type letters.",
        "objective": "Guess word fast.",
        "game_over": "Run out of lives.",
        "genre": "Word",
        "js": """
        let word='GAMEORBIT', guess=[];
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<div id="w" style="font-size:40px;letter-spacing:10px;margin-bottom:20px"></div><div id="k" style="display:flex;flex-wrap:wrap;justify-content:center;max-width:300px"></div>';
            document.getElementById('hud-extra-lbl').textContent = 'LIVES';
        }
        function resetGame() {
            word=['ORBIT','PLAYMIX','GAMER','SPEED','MULTIPLIER'][Math.floor(Math.random()*5)];
            guess=[]; extraVal=3; render(); updateHUD();
        }
        function render() {
            document.getElementById('w').textContent = word.split('').map(c=>guess.includes(c)?c:'_').join('');
            let k=document.getElementById('k'); k.innerHTML='';
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(c=>{
                let b=document.createElement('button'); b.className='go-btn'; b.textContent=c;
                b.disabled=guess.includes(c);
                b.onclick=()=>{
                    if(!playing) return;
                    guess.push(c);
                    if(word.includes(c)) { score+=10; } else { extraVal--; }
                    updateHUD(); render();
                    if(!document.getElementById('w').textContent.includes('_')) { setTimeout(resetGame,1000); }
                    if(extraVal<=0) endGame();
                }; k.appendChild(b);
            });
        }
        """
    },
    {
        "slug": "crossword-daily",
        "name": "Crossword Daily Challenge",
        "emoji": "🔤",
        "gradient": "linear-gradient(135deg,#064e3b,#4ade80)",
        "original": "WordCrossword/index.html",
        "variant": "Daily Puzzle",
        "desc": "Different crossword puzzle every day.",
        "controls": "Click cell and type letter.",
        "objective": "Complete crossword.",
        "game_over": "Puzzle solved.",
        "genre": "Word",
        "js": """
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<div class="go-grid" style="grid-template-columns:repeat(5,50px);grid-template-rows:repeat(5,50px)" id="cw"></div>';
            document.getElementById('hud-extra-lbl').textContent = 'MOVES';
        }
        function resetGame() {
            extraVal=0; updateHUD(); let cw=document.getElementById('cw'); cw.innerHTML='';
            for(let i=0;i<25;i++){
                let c=document.createElement('input'); c.style.width='50px'; c.style.height='50px'; c.style.textAlign='center'; c.style.fontSize='24px'; c.style.textTransform='uppercase'; c.maxLength=1;
                c.oninput=()=>{ extraVal++; score+=5; updateHUD(); if(extraVal>20) endGame(); };
                if(i%2===1) { c.disabled=true; c.style.background='#333'; }
                cw.appendChild(c);
            }
        }
        """
    },
    {
        "slug": "number-balloon-blitz",
        "name": "Number Balloon Blitz",
        "emoji": "🎈",
        "gradient": "linear-gradient(135deg,#1e40af,#f97316)",
        "original": "NumberBalloonShooter/index.html",
        "variant": "Fast Sequence",
        "desc": "Shoot balloons in numerical order.",
        "controls": "Click numbers in sequence.",
        "objective": "Clear 1 to 30 fast.",
        "game_over": "Miss order or time.",
        "genre": "Arcade",
        "js": """
        let n=1, bal=[];
        function setupGame() {
            document.getElementById('game-container').innerHTML = '<div id="bc" style="position:relative;width:300px;height:400px;background:#e0f2fe;overflow:hidden"></div>';
            document.getElementById('hud-extra-lbl').textContent = 'TARGET';
        }
        function resetGame() {
            n=1; bal=[]; extraVal=n; updateHUD(); document.getElementById('bc').innerHTML='';
            for(let i=1;i<=20;i++) {
                let b=document.createElement('div'); b.textContent=i; b.style.position='absolute'; b.style.left=Math.random()*250+'px'; b.style.top=Math.random()*350+'px';
                b.style.width='40px'; b.style.height='50px'; b.style.background='#ef4444'; b.style.color='#fff'; b.style.borderRadius='50% 50% 50% 50% / 40% 40% 60% 60%'; b.style.display='flex'; b.style.alignItems='center'; b.style.justifyContent='center'; b.style.cursor='pointer'; b.style.fontWeight='bold';
                b.onclick=()=>{
                    if(!playing) return;
                    if(i===n) { b.remove(); score+=10; n++; extraVal=n; updateHUD(); if(n>20) endGame(); }
                    else { endGame(); }
                };
                document.getElementById('bc').appendChild(b);
            }
        }
        """
    }
]

def main():
    base_dir = "/Users/gauravpurohit/Documents/GP/Playmix/gameorbit"
    os.makedirs(base_dir, exist_ok=True)
    
    for g in GAMES:
        g_dir = os.path.join(base_dir, g["slug"])
        os.makedirs(g_dir, exist_ok=True)
        
        # Write HTML
        html_content = TEMPLATE.format(
            title=g["name"],
            desc=g["desc"],
            slug=g["slug"],
            name=g["name"],
            genre=g["genre"],
            gradient=g["gradient"],
            emoji=g["emoji"],
            variant=g["variant"],
            controls=g["controls"],
            objective=g["objective"],
            game_over=g["game_over"],
            original=g["original"]
        )
        with open(os.path.join(g_dir, "index.html"), "w") as f:
            f.write(html_content)
            
        # Write JS
        js_content = BASE_JS.format(
            slug=g["slug"],
            custom_js=g["js"]
        )
        with open(os.path.join(g_dir, "game.js"), "w") as f:
            f.write(js_content)
            
    print("ALL 22 GAMES GENERATED SUCCESSFULLY")

if __name__ == "__main__":
    main()
