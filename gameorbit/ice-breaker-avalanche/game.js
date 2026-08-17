
let score = 0;
let best = 0;
let playing = false;
let extraVal = 0;

function initGame() {
    best = parseInt(GO.load('best_ice-breaker-avalanche') || '0');
    document.getElementById('hud-best').textContent = best;
    setupGame();
    document.getElementById('go-overlay-btn').addEventListener('click', startGame);
    startGame();
}

function startGame() {
    if(typeof GO !== 'undefined') GO.track('gameorbit_ice-breaker-avalanche', 'game_start');
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
        if(typeof GO !== 'undefined') GO.save('best_ice-breaker-avalanche', best);
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
        

window.addEventListener('load', initGame);
