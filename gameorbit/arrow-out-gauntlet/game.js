
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.getElementById('go-viewport').appendChild(canvas);
canvas.width = 300; canvas.height = 400;

let score = 0, best = GO.load('arrow-out-gauntlet_best') || 0;
let playing = false;
document.getElementById('hud-best').textContent = best;

function init() {
    score = 0; playing = true;
    document.getElementById('hud-score').textContent = score;
    document.getElementById('go-overlay').classList.add('hidden');
    GO.track('gameorbit_arrow-out-gauntlet', 'game_start');
    requestAnimationFrame(loop);
}

function loop() {
    if (!playing) return;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText("Tap to score!", 50, 150);
    ctx.fillText("Wait 5s to end.", 50, 200);
    
    requestAnimationFrame(loop);
}

canvas.addEventListener('mousedown', () => {
    if (playing) {
        score += 10;
        document.getElementById('hud-score').textContent = score;
    }
});

setTimeout(() => { if (playing) endGame(); }, 5000);

function endGame() {
    playing = false;
    if (score > best) { best = score; GO.save('arrow-out-gauntlet_best', best); }
    document.querySelector('.go-stat-score').textContent = score;
    document.querySelector('.go-stat-best').textContent = best;
    GO.showOverlay();
}

document.getElementById('go-overlay-btn').addEventListener('click', init);
prepSystem = init;
