
let score = 0;
let best = 0;
let playing = false;
let extraVal = 0;

function initGame() {
    best = parseInt(GO.load('best_number-balloon-blitz') || '0');
    document.getElementById('hud-best').textContent = best;
    setupGame();
    document.getElementById('go-overlay-btn').addEventListener('click', startGame);
    startGame();
}

function startGame() {
    if(typeof GO !== 'undefined') GO.track('gameorbit_number-balloon-blitz', 'game_start');
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
        if(typeof GO !== 'undefined') GO.save('best_number-balloon-blitz', best);
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
        

window.addEventListener('load', initGame);
