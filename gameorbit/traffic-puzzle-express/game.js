
let score = 0;
let best = 0;
let playing = false;
let extraVal = 0;

function initGame() {
    best = parseInt(GO.load('best_traffic-puzzle-express') || '0');
    document.getElementById('hud-best').textContent = best;
    setupGame();
    document.getElementById('go-overlay-btn').addEventListener('click', startGame);
    startGame();
}

function startGame() {
    if(typeof GO !== 'undefined') GO.track('gameorbit_traffic-puzzle-express', 'game_start');
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
        if(typeof GO !== 'undefined') GO.save('best_traffic-puzzle-express', best);
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
        

window.addEventListener('load', initGame);
