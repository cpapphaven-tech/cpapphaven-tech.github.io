// --- Game Setup & Constant Configuration ---
const BOARD_SIZE = 10;
const LADDERS = [
    { start: 2, end: 38 },
    { start: 7, end: 14 },
    { start: 8, end: 31 },
    { start: 15, end: 26 },
    { start: 21, end: 82 },
    { start: 36, end: 44 },
    { start: 51, end: 67 },
    { start: 71, end: 91 },
    { start: 74, end: 97 }
];

const SNAKES = [
    { start: 99, end: 80 },
    { start: 95, end: 75 },
    { start: 92, end: 53 },
    { start: 87, end: 24 },
    { start: 62, end: 19 },
    { start: 54, end: 34 },
    { start: 47, end: 26 },
    { start: 32, end: 10 },
    { start: 17, end: 4 }
];

const state = {
    gameMode: 'vsAi', // 'vsAi' or 'vsFriend'
    p1Pos: 1,
    p2Pos: 1,
    currentPlayer: 1,
    consecutiveSixes: 0,
    isRolling: false,
    isAnimating: false,
    gameOver: false,
    gameRecordTime: null,
    gameStartTime: null,
    durationSent: false
};

const UI = {
    modeScreen: document.getElementById('modeScreen'),
    gameScreen: document.getElementById('gameScreen'),
    gameOverOverlay: document.getElementById('gameOverOverlay'),
    vsAiBtn: document.getElementById('vsAiBtn'),
    vsFriendBtn: document.getElementById('vsFriendBtn'),
    changeModeBtn: document.getElementById('changeModeBtn'),
    rollBtn: document.getElementById('rollBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    turnLabel: document.getElementById('turnLabel'),
    modeBadge: document.getElementById('modeBadge'),
    gameMessage: document.getElementById('gameMessage'),
    p1PosVal: document.getElementById('p1PosVal'),
    p2PosVal: document.getElementById('p2PosVal'),
    p2NameVal: document.getElementById('p2NameVal'),
    p2Avatar: document.getElementById('p2Avatar'),
    player1Panel: document.getElementById('player1Panel'),
    player2Panel: document.getElementById('player2Panel'),
    tokenP1: document.getElementById('tokenP1'),
    tokenP2: document.getElementById('tokenP2'),
    canvas: document.getElementById('boardCanvas'),
    dice3d: document.getElementById('dice3d'),
    winTitle: document.getElementById('gameOverTitle'),
    winMsg: document.getElementById('gameOverMessage'),
    winIcon: document.getElementById('gameOverIcon')
};

let ctx = UI.canvas.getContext('2d');
let audioCtx = null;

// --- Supabase Config ---
const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;
let sessionId = null;

// --- Initialize Game ---
function init() {
    resizeCanvas();
    window.addEventListener('resize', () => {
        resizeCanvas();
        drawBoard();
        updateTokenPositions();
    });

    // Event Listeners
    UI.vsAiBtn.addEventListener('click', () => startGame('vsAi'));
    UI.vsFriendBtn.addEventListener('click', () => startGame('vsFriend'));
    UI.changeModeBtn.addEventListener('click', showMenu);
    UI.rollBtn.addEventListener('click', rollDice);
    UI.playAgainBtn.addEventListener('click', restartGame);

    // Track initialization times
    state.gameStartTime = Date.now();
    state.gameRecordTime = Date.now();
    initSupabase();
}

// --- Canvas & Math Helpers ---
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = UI.canvas.getBoundingClientRect();
    UI.canvas.width = rect.width * dpr;
    UI.canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
}

// Convert tile number (1-100) to grid coordinates (row, col)
function getTileGridCoords(tileNum) {
    const idx = tileNum - 1;
    const rowFromBottom = Math.floor(idx / 10);
    const r = 9 - rowFromBottom;
    const c = (rowFromBottom % 2 === 0) ? (idx % 10) : (9 - (idx % 10));
    return { r, c };
}

// Convert tile number to actual pixel center positions on canvas
function getTileCoords(tileNum) {
    const { r, c } = getTileGridCoords(tileNum);
    const rect = UI.canvas.getBoundingClientRect();
    const cellSize = rect.width / 10;
    return {
        x: (c + 0.5) * cellSize,
        y: (r + 0.5) * cellSize
    };
}

// --- Drawing Board, Snakes, and Ladders ---
function drawBoard() {
    const rect = UI.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const cellSize = w / 10;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Grid Cells
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
            const rowFromBottom = 9 - r;
            const tileNum = (rowFromBottom % 2 === 0) 
                ? (rowFromBottom * 10 + c + 1) 
                : (rowFromBottom * 10 + (9 - c) + 1);

            // Alternate premium tile backgrounds (Dark Slate / Deep Navy)
            ctx.fillStyle = ((r + c) % 2 === 0) ? '#111827' : '#1e293b';
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);

            // Draw border lines
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 1;
            ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);

            // Draw tile numbers
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 10px Outfit, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(tileNum, c * cellSize + 6, r * cellSize + 6);
        }
    }

    // Decorate Tile 100 with flag / target look
    const tile100Pos = getTileCoords(100);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆', tile100Pos.x, tile100Pos.y);

    // 2. Draw Ladders
    LADDERS.forEach(ladder => {
        const start = getTileCoords(ladder.start);
        const end = getTileCoords(ladder.end);

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Perpendicular vector for offset rails
        const nx = -dy / dist;
        const ny = dx / dist;
        const railOffset = cellSize * 0.15;

        // Apply shadow to ladders for 3D look
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;

        // Rails Gradient
        const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        grad.addColorStop(0, '#fbbf24'); // Amber gold
        grad.addColorStop(1, '#f59e0b');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        // Rail 1
        ctx.beginPath();
        ctx.moveTo(start.x + nx * railOffset, start.y + ny * railOffset);
        ctx.lineTo(end.x + nx * railOffset, end.y + ny * railOffset);
        ctx.stroke();

        // Rail 2
        ctx.beginPath();
        ctx.moveTo(start.x - nx * railOffset, start.y - ny * railOffset);
        ctx.lineTo(end.x - nx * railOffset, end.y - ny * railOffset);
        ctx.stroke();

        // Reset shadow for rungs to avoid double shadowing
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Rungs
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        const numRungs = Math.max(3, Math.floor(dist / 24));
        for (let i = 1; i < numRungs; i++) {
            const t = i / numRungs;
            const rx = start.x + dx * t;
            const ry = start.y + dy * t;
            ctx.beginPath();
            ctx.moveTo(rx + nx * railOffset, ry + ny * railOffset);
            ctx.lineTo(rx - nx * railOffset, ry - ny * railOffset);
            ctx.stroke();
        }
    });

    // 3. Draw Snakes
    SNAKES.forEach(snake => {
        const start = getTileCoords(snake.start); // Head
        const end = getTileCoords(snake.end);     // Tail

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        const nx = -dy / dist;
        const ny = dx / dist;

        // Generate control points for curved wavy body
        const offset = dist * 0.16;
        const cp1 = {
            x: start.x + dx * 0.33 + nx * offset,
            y: start.y + dy * 0.33 + ny * offset
        };
        const cp2 = {
            x: start.x + dx * 0.66 - nx * offset,
            y: start.y + dy * 0.66 - ny * offset
        };

        // Shadow for snake depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;

        // Snake Body Gradient
        const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        grad.addColorStop(0, '#10b981'); // Emerald green
        grad.addColorStop(0.5, '#22c55e'); // Green
        grad.addColorStop(1, '#047857'); // Dark green

        ctx.strokeStyle = grad;
        ctx.lineWidth = cellSize * 0.22;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
        ctx.stroke();

        // Scale spots pattern
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#fbbf24'; // Golden scales
        ctx.lineWidth = cellSize * 0.06;
        ctx.setLineDash([4, 10]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // Draw snake Head
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(start.x, start.y, cellSize * 0.16, 0, Math.PI * 2);
        ctx.fill();

        // Glowing red split tongue
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        const tongueLen = 12;
        // Direction from head to cp1
        const thx = cp1.x - start.x;
        const thy = cp1.y - start.y;
        const thDist = Math.sqrt(thx*thx + thy*thy);
        const tx = -(thx / thDist);
        const ty = -(thy / thDist);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        const tEnd = { x: start.x + tx * tongueLen, y: start.y + ty * tongueLen };
        ctx.lineTo(tEnd.x, tEnd.y);
        // Fork
        ctx.lineTo(tEnd.x + (tx - ty)*3, tEnd.y + (ty + tx)*3);
        ctx.moveTo(tEnd.x, tEnd.y);
        ctx.lineTo(tEnd.x + (tx + ty)*3, tEnd.y + (ty - tx)*3);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = 'white';
        const eyeOffsetR = cellSize * 0.08;
        // Draw left and right eyes based on normal vector
        ctx.beginPath();
        ctx.arc(start.x + nx * eyeOffsetR - tx * 2, start.y + ny * eyeOffsetR - ty * 2, 3.5, 0, Math.PI * 2);
        ctx.arc(start.x - nx * eyeOffsetR - tx * 2, start.y - ny * eyeOffsetR - ty * 2, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(start.x + nx * eyeOffsetR - tx * 2, start.y + ny * eyeOffsetR - ty * 2, 1.5, 0, Math.PI * 2);
        ctx.arc(start.x - nx * eyeOffsetR - tx * 2, start.y - ny * eyeOffsetR - ty * 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
    });
}

// --- Player Token UI Placement ---
function updateTokenPositions() {
    if (state.p1Pos < 1) state.p1Pos = 1;
    if (state.p2Pos < 1) state.p2Pos = 1;

    UI.p1PosVal.textContent = state.p1Pos;
    UI.p2PosVal.textContent = state.p2Pos;

    const c1 = getTileCoords(state.p1Pos);
    const c2 = getTileCoords(state.p2Pos);

    const tokenSize = 20;

    if (state.p1Pos === state.p2Pos) {
        // Offset slightly to prevent complete overlay block
        UI.tokenP1.style.left = `calc(${c1.x}px - ${tokenSize/2}px - 5px)`;
        UI.tokenP1.style.top = `calc(${c1.y}px - ${tokenSize/2}px - 5px)`;

        UI.tokenP2.style.left = `calc(${c2.x}px - ${tokenSize/2}px + 5px)`;
        UI.tokenP2.style.top = `calc(${c2.y}px - ${tokenSize/2}px + 5px)`;
    } else {
        UI.tokenP1.style.left = `calc(${c1.x}px - ${tokenSize/2}px)`;
        UI.tokenP1.style.top = `calc(${c1.y}px - ${tokenSize/2}px)`;

        UI.tokenP2.style.left = `calc(${c2.x}px - ${tokenSize/2}px)`;
        UI.tokenP2.style.top = `calc(${c2.y}px - ${tokenSize/2}px)`;
    }
}

// --- synthesized Sound Generator (Web Audio) ---
function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    
    if (type === 'roll') {
        // Roll rolling vibration rattle
        const duration = 0.5;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(50, now + duration);
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    } else if (type === 'step') {
        // Clean move beep
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550, now);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'snake') {
        // Hissing slide downward pitch sweep
        const duration = 0.8;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + duration);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    } else if (type === 'ladder') {
        // Bright upward chord scale climb
        const notes = [293.66, 329.63, 392.00, 440.00, 523.25, 587.33]; // D4, E4, G4, A4, C5, D5
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            
            gain.gain.setValueAtTime(0.12, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.15);
            
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.15);
        });
    } else if (type === 'win') {
        // High-pitched victory chime fanfare
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            
            gain.gain.setValueAtTime(0.18, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.4);
            
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.4);
        });
    } else if (type === 'bonus') {
        // Dual happy beeps for 6
        [0, 0.12].forEach((delay) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(783.99, now + delay); // G5
            
            gain.gain.setValueAtTime(0.12, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.08);
            
            osc.start(now + delay);
            osc.stop(now + delay + 0.08);
        });
    }
}

// --- Game Control & Transitions ---
function startGame(mode) {
    state.gameMode = mode;
    state.p1Pos = 1;
    state.p2Pos = 1;
    state.currentPlayer = 1;
    state.consecutiveSixes = 0;
    state.gameOver = false;
    
    // UI adjustment
    UI.modeBadge.textContent = (mode === 'vsAi') ? 'vs Computer' : '2 Players';
    UI.p2NameVal.textContent = (mode === 'vsAi') ? 'AI Opponent' : 'Player 2';
    UI.p2Avatar.textContent = (mode === 'vsAi') ? '🤖' : '🔴';

    UI.modeScreen.classList.add('hidden');
    UI.gameScreen.classList.remove('hidden');
    UI.gameOverOverlay.classList.add('hidden');

    UI.tokenP1.style.display = 'block';
    UI.tokenP2.style.display = 'block';

    resizeCanvas();
    drawBoard();
    updateTokenPositions();
    updateHUD();

    state.gameStartTime = Date.now();
    state.durationSent = false;
    markSessionStarted();
    
    // Initial audio activation
    initAudio();
}

function showMenu() {
    UI.modeScreen.classList.remove('hidden');
    UI.gameScreen.classList.add('hidden');
    UI.tokenP1.style.display = 'none';
    UI.tokenP2.style.display = 'none';
}

function restartGame() {
    startGame(state.gameMode);
}

function updateHUD() {
    // Glow player panels based on active state
    if (state.currentPlayer === 1) {
        UI.player1Panel.classList.add('active');
        UI.player2Panel.classList.remove('active');
        UI.tokenP1.classList.add('bouncing');
        UI.tokenP2.classList.remove('bouncing');
        UI.turnLabel.textContent = "Your Turn";
        UI.turnLabel.style.color = "#3b82f6";
    } else {
        UI.player1Panel.classList.remove('active');
        UI.player2Panel.classList.add('active');
        UI.tokenP1.classList.remove('bouncing');
        UI.tokenP2.classList.add('bouncing');
        UI.turnLabel.textContent = (state.gameMode === 'vsAi') ? "AI's Turn" : "P2's Turn";
        UI.turnLabel.style.color = "#ef4444";
    }

    // Roll button status
    if (state.gameOver || state.isRolling || state.isAnimating || (state.gameMode === 'vsAi' && state.currentPlayer === 2)) {
        UI.rollBtn.disabled = true;
    } else {
        UI.rollBtn.disabled = false;
    }
}

// --- Roll Dice & Cube Physics ---
function rollDice() {
    if (state.isRolling || state.isAnimating || state.gameOver) return;

    // Verify AI state blocks clicks
    if (state.gameMode === 'vsAi' && state.currentPlayer === 2) return;

    triggerRoll();
}

function triggerRoll() {
    state.isRolling = true;
    updateHUD();
    playSound('roll');

    // Trigger cube spin class
    UI.dice3d.classList.add('rolling');
    UI.dice3d.className = 'dice-cube rolling';
    UI.gameMessage.textContent = `${state.currentPlayer === 1 ? 'Player 1' : (state.gameMode === 'vsAi' ? 'AI' : 'Player 2')} is rolling...`;
    UI.gameMessage.classList.remove('important');

    setTimeout(() => {
        // Generate random roll
        const val = Math.floor(Math.random() * 6) + 1;
        
        // Remove rolling and snap to face
        UI.dice3d.classList.remove('rolling');
        UI.dice3d.className = `dice-cube show-${val}`;

        UI.gameMessage.textContent = `Rolled a ${val}!`;
        state.isRolling = false;

        setTimeout(() => {
            processMove(val);
        }, 300);

    }, 700);
}

// --- Process Movement Path ---
async function processMove(rollVal) {
    state.isAnimating = true;
    updateHUD();

    let startPos = (state.currentPlayer === 1) ? state.p1Pos : state.p2Pos;
    let targetPos = startPos + rollVal;
    
    // Generate individual movement path coordinates
    const movePath = [];
    if (targetPos <= 100) {
        for (let step = startPos + 1; step <= targetPos; step++) {
            movePath.push(step);
        }
    } else {
        // Bounce back from 100
        const overshoot = targetPos - 100;
        for (let step = startPos + 1; step <= 100; step++) {
            movePath.push(step);
        }
        for (let step = 99; step >= 100 - overshoot; step--) {
            movePath.push(step);
        }
    }

    // Step-by-step glide animation
    for (let i = 0; i < movePath.length; i++) {
        const nextPos = movePath[i];
        if (state.currentPlayer === 1) {
            state.p1Pos = nextPos;
        } else {
            state.p2Pos = nextPos;
        }
        playSound('step');
        updateTokenPositions();
        await new Promise(resolve => setTimeout(resolve, 320));
    }

    let endPos = movePath[movePath.length - 1];

    // Check ladder bottom or snake head landing
    const ladder = LADDERS.find(l => l.start === endPos);
    const snake = SNAKES.find(s => s.start === endPos);

    if (ladder) {
        UI.gameMessage.textContent = `Climbing a ladder from ${ladder.start} to ${ladder.end}! 🚀`;
        UI.gameMessage.classList.add('important');
        playSound('ladder');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (state.currentPlayer === 1) {
            state.p1Pos = ladder.end;
        } else {
            state.p2Pos = ladder.end;
        }
        updateTokenPositions();
        await new Promise(resolve => setTimeout(resolve, 400));
    } else if (snake) {
        UI.gameMessage.textContent = `Oh no! A snake bit you from ${snake.start} to ${snake.end}! 🐍`;
        UI.gameMessage.classList.add('important');
        playSound('snake');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (state.currentPlayer === 1) {
            state.p1Pos = snake.end;
        } else {
            state.p2Pos = snake.end;
        }
        updateTokenPositions();
        await new Promise(resolve => setTimeout(resolve, 400));
    }

    // Winning check
    const finalPos = (state.currentPlayer === 1) ? state.p1Pos : state.p2Pos;
    if (finalPos === 100) {
        endGame();
        return;
    }

    // Handle Roll 6 bonus rules
    if (rollVal === 6) {
        state.consecutiveSixes++;
        if (state.consecutiveSixes < 2) {
            UI.gameMessage.textContent = `Rolled a 6! You get a Bonus Roll! 🎲`;
            UI.gameMessage.classList.add('important');
            playSound('bonus');
            state.isAnimating = false;
            updateHUD();

            // Auto-trigger AI bonus roll
            if (state.gameMode === 'vsAi' && state.currentPlayer === 2) {
                setTimeout(triggerAiTurn, 1000);
            }
            return;
        } else {
            // Turn passes if they roll three sixes (treated as turn skipped)
            UI.gameMessage.textContent = `Rolled multiple 6s! Passing turn...`;
            state.consecutiveSixes = 0;
        }
    } else {
        state.consecutiveSixes = 0;
    }

    // Pass turn to next player
    state.currentPlayer = (state.currentPlayer === 1) ? 2 : 1;
    state.isAnimating = false;
    updateHUD();

    // Trigger AI if needed
    if (state.gameMode === 'vsAi' && state.currentPlayer === 2 && !state.gameOver) {
        setTimeout(triggerAiTurn, 1000);
    }
}

// --- AI Player Turn ---
function triggerAiTurn() {
    if (state.gameOver || state.currentPlayer !== 2) return;
    triggerRoll();
}

// --- End Match Overlay & Promotions ---
function endGame() {
    state.gameOver = true;
    updateHUD();
    playSound('win');

    const winnerName = (state.currentPlayer === 1) ? "Player 1" : (state.gameMode === 'vsAi' ? "AI Opponent" : "Player 2");
    
    // Customize text details
    UI.winTitle.textContent = "Victory!";
    UI.winMsg.textContent = `${winnerName} reached Tile 100 and wins the match!`;
    if (state.gameMode === 'vsAi' && state.currentPlayer === 2) {
        UI.winTitle.textContent = "Defeat!";
        UI.winIcon.textContent = "💀";
        UI.winMsg.textContent = `The AI reached Tile 100 first! Better luck next time.`;
    } else {
        UI.winIcon.textContent = "🏆";
    }

    // Display overlay
    UI.gameOverOverlay.classList.remove('hidden');

    // Portal Ads: increment score counters / game over count inside localStorage to open Smartlink
    try {
        let gameCount = parseInt(localStorage.getItem('pmg_snakes_gameover_count') || '0') + 1;
        localStorage.setItem('pmg_snakes_gameover_count', gameCount.toString());
        if (gameCount % 3 === 0 && typeof window.loadSmartlinkAd === 'function') {
            window.loadSmartlinkAd();
        }
    } catch (e) {}

    // Load portal game promotion scroller in game over screen
    if (typeof window.renderGameScroller === 'function') {
        window.renderGameScroller('game-over-more-games');
    }

    // Sync session duration update in Supabase
    sendDurationOnExit("game_over_snakesladders");
}

// --- Supabase Session Tracking & Portal Ads Integration ---
function initSupabase() {
    if (!window.supabase) {
        setTimeout(initSupabase, 500);
        return;
    }

    if (!supabaseClient) {
        const { createClient } = window.supabase;
        supabaseClient = createClient(supabaseUrl, supabaseKey);
    }
    
    startGameSession();
}

function getPlacementId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('utm_content') || urlParams.get('placementid') || "unknown";
}

async function getCountry() {
    try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("API call failed");
        const data = await response.json();
        return data.country_name || data.country || "Unknown";
    } catch (error) {
        try {
            const cfResp = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
            const cfText = await cfResp.text();
            const locLine = cfText.split("\n").find(line => line.startsWith("loc="));
            return locLine ? locLine.split("=")[1] : "Unknown";
        } catch (e) {
            return "Unknown";
        }
    }
}

function getOS() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    if (/Win/i.test(ua)) return "Windows";
    if (/Mac/i.test(ua)) return "Mac";
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown";
}

function getBrowser() {
    const ua = navigator.userAgent;
    if (/Edg/i.test(ua)) return "Edge";
    if (/OPR|Opera/i.test(ua)) return "Opera";
    if (/Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)) return "Chrome";
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
    if (/Firefox/i.test(ua)) return "Firefox";
    return "Unknown";
}

function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

async function startGameSession() {
    if (!supabaseClient) return;

    sessionId = generateSessionId();
    const placementId = getPlacementId();
    const os = getOS();
    const browser = getBrowser();
    const userAgent = navigator.userAgent;
    const gameSlug = "snakesladders";
    const country = await getCountry();

    try {
        await supabaseClient
            .from('game_sessions')
            .insert([
                {
                    session_id: sessionId,
                    game_slug: gameSlug,
                    placement_id: placementId,
                    user_agent: userAgent,
                    os: os,
                    browser: browser,
                    country: country,
                    started_game: false,
                    bounced: false
                }
            ]);
    } catch (e) {}
}

async function markSessionStarted() {
    if (!supabaseClient || !sessionId) return;
    try {
        await supabaseClient
            .from('game_sessions')
            .update({ started_game: true })
            .eq('session_id', sessionId);
    } catch (e) {}
}

async function updateGameSession(fields) {
    if (!supabaseClient || !sessionId) return;
    try {
        await supabaseClient
            .from('game_sessions')
            .update(fields)
            .eq('session_id', sessionId);
    } catch (e) {}
}

function sendDurationOnExit(reason) {
    if (state.gameStartTime && !state.durationSent) {
        const seconds = Math.round((Date.now() - state.gameStartTime) / 1000);
        
        // Update session duration
        updateGameSession({
            duration_seconds: seconds,
            bounced: false,
            end_reason: reason
        });

        // Trigger analytics event track
        if (typeof window.trackGameEvent === 'function') {
            window.trackGameEvent(`game_duration_snakesladders_${seconds}_${reason}_${getBrowser()}`, {
                seconds,
                end_reason: reason,
                os: getOS()
            });
        }

        state.durationSent = true;
    }
}

// Exit listeners for tracking duration
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        sendDurationOnExit("background_snakesladders");
    }
});

window.addEventListener("beforeunload", () => {
    sendDurationOnExit("tab_close_snakesladders");
});

// Periodic system ad sync as defined in portal framework
setInterval(() => {
    if (typeof window.syncPMGLayout === 'function') {
        const seconds = Math.round((Date.now() - state.gameRecordTime) / 1000);
        if (seconds > 60) {
            window.syncPMGLayout();
            state.gameRecordTime = Date.now();
        }
    }
}, 5000);

// --- Boot Game Engine ---
init();
drawBoard();
updateTokenPositions();
updateHUD();
showMenu();
