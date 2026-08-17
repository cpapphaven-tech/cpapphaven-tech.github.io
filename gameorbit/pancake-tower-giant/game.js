
let score = 0;
let best = 0;
let playing = false;
let extraVal = 0;

function initGame() {
    best = parseInt(GO.load('best_pancake-tower-giant') || '0');
    document.getElementById('hud-best').textContent = best;
    setupGame();
    document.getElementById('go-overlay-btn').addEventListener('click', startGame);
    startGame();
}

function startGame() {
    if(typeof GO !== 'undefined') GO.track('gameorbit_pancake-tower-giant', 'game_start');
    score = 0;
    playing = true;
    updateHUD();
    document.getElementById('go-overlay').classList.add('hidden');
    resetGame();
}

function endGame() {
    playing = false;
    if (score > best) {
        best = score;
        if(typeof GO !== 'undefined') GO.save('best_pancake-tower-giant', best);
    }
    document.querySelector('.go-stat-score').textContent = score;
    document.querySelector('.go-stat-best').textContent = best;
    if(typeof GO !== 'undefined') GO.showOverlay();
}

function updateHUD() {
    document.getElementById('hud-score').textContent = score;
    document.getElementById('hud-extra').textContent = extraVal;
}

// Game Specific Implementation below

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
        

window.addEventListener('load', initGame);
