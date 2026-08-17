
let score = 0;
let best = 0;
let playing = false;
let extraVal = 0;

function initGame() {
    best = parseInt(GO.load('best_icecream-melt-mode') || '0');
    document.getElementById('hud-best').textContent = best;
    setupGame();
    document.getElementById('go-overlay-btn').addEventListener('click', startGame);
    startGame();
}

function startGame() {
    if(typeof GO !== 'undefined') GO.track('gameorbit_icecream-melt-mode', 'game_start');
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
        if(typeof GO !== 'undefined') GO.save('best_icecream-melt-mode', best);
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
        

window.addEventListener('load', initGame);
