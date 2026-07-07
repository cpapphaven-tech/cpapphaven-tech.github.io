// Minesweeper Game Logic
// PlayMix Games standard integration

// ⚙️ Configurations
const DIFFICULTIES = {
    easy: { rows: 9, cols: 9, mines: 10, cellSize: 40 },
    medium: { rows: 16, cols: 16, mines: 40, cellSize: 34 },
    hard: { rows: 16, cols: 30, mines: 99, cellSize: 30 }
};

// 🎮 State variables
let currentDiff = 'easy';
let rows, cols, totalMines, cellSize;
let board = []; // Flat 1D array representing grid
let firstClick = true;
let gameOverState = false;
let gameWonState = false;
let mode = 'dig'; // 'dig' or 'flag'
let soundEnabled = true;

// Timing and Stats
let timerInterval = null;
let timeElapsed = 0;
let minesFlagged = 0;

// Web Audio Context for synthesized retro sound effects
let audioCtx = null;

// Touch/Long press state for mobile Devices
let touchTimer = null;
let lastTouchTarget = null;
const LONG_PRESS_DURATION = 400; // ms

// DOM Elements
const boardElement = document.getElementById('board');
const mineCountDisplay = document.getElementById('mine-count');
const timerDisplay = document.getElementById('timer');
const faceBtn = document.getElementById('btn-face');
const btnSound = document.getElementById('btn-sound');
const endModal = document.getElementById('end-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalBtnRestart = document.getElementById('modal-btn-restart');

// Mode toggle buttons
const btnModeDig = document.getElementById('btn-mode-dig');
const btnModeFlag = document.getElementById('btn-mode-flag');

// Initialize Game
function initGame(diffKey) {
    currentDiff = diffKey;
    const config = DIFFICULTIES[currentDiff];
    rows = config.rows;
    cols = config.cols;
    totalMines = config.mines;
    cellSize = config.cellSize;

    // Reset stats & flags
    firstClick = true;
    gameOverState = false;
    gameWonState = false;
    timeElapsed = 0;
    minesFlagged = 0;
    
    // Clear Timer
    clearInterval(timerInterval);
    timerInterval = null;
    timerDisplay.textContent = '000';
    updateMineDisplay();

    // Reset face button
    faceBtn.textContent = '😊';

    // Set active difficulty class
    document.querySelectorAll('.difficulty-select .btn').forEach(btn => {
        if (btn.dataset.diff === diffKey) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Close Modal
    endModal.classList.remove('active');

    // Build Empty Board State
    board = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            board.push({
                r,
                c,
                mine: false,
                revealed: false,
                flagged: false,
                count: 0
            });
        }
    }

    renderBoard();
}

// Format numbers to leading zeros (e.g. 005 or -02)
function padZero(num, size = 3) {
    let s = num + "";
    const isNegative = num < 0;
    if (isNegative) s = s.replace('-', '');
    while (s.length < size) s = "0" + s;
    return (isNegative ? "-" : "") + s;
}

function updateMineDisplay() {
    const displayVal = totalMines - minesFlagged;
    mineCountDisplay.textContent = padZero(displayVal);
}

// Generate Grid HTML Elements
function renderBoard() {
    boardElement.innerHTML = '';
    
    // Setup css grid properties dynamically
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    boardElement.style.width = `${cols * cellSize}px`;

    board.forEach((cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        cellDiv.style.width = `${cellSize}px`;
        cellDiv.style.height = `${cellSize}px`;
        cellDiv.dataset.index = index;

        // Desktop and general mouse click handlers
        cellDiv.addEventListener('mousedown', (e) => handleCellClick(e, index));
        cellDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Disable standard right-click context menu
            toggleFlag(index);
        });

        // Touch event handlers for mobile
        cellDiv.addEventListener('touchstart', (e) => handleTouchStart(e, index));
        cellDiv.addEventListener('touchend', (e) => handleTouchEnd(e, index));
        cellDiv.addEventListener('touchmove', handleTouchMove);

        boardElement.appendChild(cellDiv);
    });
}

// Synthesize audio
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    try {
        initAudio();
        const now = audioCtx.currentTime;

        if (type === 'click') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(700, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } 
        else if (type === 'flag') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.linearRampToValueAtTime(400, now + 0.12);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        }
        else if (type === 'explosion') {
            const bufferSize = audioCtx.sampleRate * 0.5;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(30, now + 0.5);

            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);

            noise.start(now);
            noise.stop(now + 0.5);
        }
        else if (type === 'win') {
            const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C (arpeggio)
            notes.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.09);
                gain.gain.setValueAtTime(0.08, now + idx * 0.09);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);
                osc.start(now + idx * 0.09);
                osc.stop(now + idx * 0.09 + 0.25);
            });
        }
    } catch(e) {
        console.warn("Audio Context blocked or unsupported:", e);
    }
}

// Start game timer
function startTimer() {
    timeElapsed = 0;
    timerDisplay.textContent = '000';
    timerInterval = setInterval(() => {
        timeElapsed++;
        if (timeElapsed > 999) {
            timerDisplay.textContent = '999';
        } else {
            timerDisplay.textContent = padZero(timeElapsed);
        }
    }, 1000);
}

// Generate mines ensuring safe zone on first click
function generateMines(firstIndex) {
    const clickedCell = board[firstIndex];
    const clickedR = clickedCell.r;
    const clickedC = clickedCell.c;

    // Define a safe zone (clicked cell + its direct 8 neighbors)
    const safeIndices = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = clickedR + dr;
            const nc = clickedC + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                safeIndices.push(nr * cols + nc);
            }
        }
    }

    // Distribute mines randomly
    let minesPlaced = 0;
    while (minesPlaced < totalMines) {
        const randomIdx = Math.floor(Math.random() * board.length);
        if (!board[randomIdx].mine && !safeIndices.includes(randomIdx)) {
            board[randomIdx].mine = true;
            minesPlaced++;
        }
    }

    // Calculate cell adjacent counts
    for (let i = 0; i < board.length; i++) {
        if (board[i].mine) continue;
        let count = 0;
        const cell = board[i];
        
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = cell.r + dr;
                const nc = cell.c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    const neighborIdx = nr * cols + nc;
                    if (board[neighborIdx].mine) {
                        count++;
                    }
                }
            }
        }
        board[i].count = count;
    }
}

// Cell interactions
function handleCellClick(e, index) {
    // Only handle left clicks here (buttons 0, or undefined for touch simulations)
    if (e.button !== undefined && e.button !== 0) return;
    
    if (gameOverState || gameWonState) return;

    if (mode === 'flag') {
        toggleFlag(index);
    } else {
        revealCell(index);
    }
}

function revealCell(index) {
    const cell = board[index];
    if (cell.revealed || cell.flagged || gameOverState || gameWonState) return;

    // First click logic
    if (firstClick) {
        firstClick = false;
        generateMines(index);
        startTimer();
    }

    cell.revealed = true;
    const cellDiv = boardElement.children[index];
    cellDiv.classList.add('revealed');

    if (cell.mine) {
        triggerExplosion(index);
        return;
    }

    playSound('click');

    if (cell.count > 0) {
        cellDiv.textContent = cell.count;
        cellDiv.classList.add(`num-${cell.count}`);
    } else {
        // Flood fill empty neighbors
        revealNeighbors(cell.r, cell.c);
    }

    checkWinCondition();
}

function revealNeighbors(r, c) {
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const idx = nr * cols + nc;
                const neighbor = board[idx];
                if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
                    neighbor.revealed = true;
                    const cellDiv = boardElement.children[idx];
                    cellDiv.classList.add('revealed');
                    if (neighbor.count > 0) {
                        cellDiv.textContent = neighbor.count;
                        cellDiv.classList.add(`num-${neighbor.count}`);
                    } else {
                        revealNeighbors(neighbor.r, neighbor.c);
                    }
                }
            }
        }
    }
}

function toggleFlag(index) {
    if (gameOverState || gameWonState) return;
    const cell = board[index];
    if (cell.revealed) return;

    cell.flagged = !cell.flagged;
    const cellDiv = boardElement.children[index];

    if (cell.flagged) {
        cellDiv.classList.add('flagged');
        cellDiv.textContent = '🚩';
        minesFlagged++;
        playSound('flag');
    } else {
        cellDiv.classList.remove('flagged');
        cellDiv.textContent = '';
        minesFlagged--;
        playSound('click');
    }

    updateMineDisplay();
}

function triggerExplosion(clickedIndex) {
    gameOverState = true;
    clearInterval(timerInterval);
    faceBtn.textContent = '😵';
    playSound('explosion');

    // Reveal all mines
    board.forEach((cell, idx) => {
        const cellDiv = boardElement.children[idx];
        if (cell.mine) {
            cellDiv.classList.add('revealed');
            if (idx === clickedIndex) {
                cellDiv.classList.add('mine');
            } else {
                cellDiv.classList.add('mine-revealed');
            }
            cellDiv.textContent = '💣';
        } else if (cell.flagged) {
            // Flagged cell that was NOT a mine (wrong flag)
            cellDiv.textContent = '❌';
            cellDiv.style.color = '#ef4444';
        }
    });

    // Trigger Smartlink or system tracking if available
    if (typeof loadSmartlinkAd === 'function') {
        // Integrate ad counts or popups if standard in ads.js
        console.log("Trigger smartlink hook");
    }

    // Show modal after delay
    setTimeout(() => {
        modalTitle.textContent = "Game Over";
        modalTitle.className = "modal-title lose";
        modalDesc.textContent = `You hit a mine! Time elapsed: ${timeElapsed}s.`;
        endModal.classList.add('active');
    }, 1200);
}

function checkWinCondition() {
    const unrevealedSafeCells = board.filter(c => !c.mine && !c.revealed);
    if (unrevealedSafeCells.length === 0) {
        // Victory!
        gameWonState = true;
        clearInterval(timerInterval);
        faceBtn.textContent = '😎';
        playSound('win');

        // Flag remaining mines automatically
        board.forEach((cell, idx) => {
            if (cell.mine && !cell.flagged) {
                cell.flagged = true;
                const cellDiv = boardElement.children[idx];
                cellDiv.classList.add('flagged');
                cellDiv.textContent = '🚩';
            }
        });
        minesFlagged = totalMines;
        updateMineDisplay();

        setTimeout(() => {
            modalTitle.textContent = "Victory!";
            modalTitle.className = "modal-title win";
            modalDesc.textContent = `Excellent job! Swept the board clean in ${timeElapsed} seconds.`;
            endModal.classList.add('active');
        }, 1200);
    }
}

// Touch controls helper for mobile devices (long press -> flag, quick tap -> dig)
function handleTouchStart(e, index) {
    if (gameOverState || gameWonState) return;
    lastTouchTarget = e.currentTarget;
    
    // Clear any existing timer
    if (touchTimer) clearTimeout(touchTimer);

    // Start timer for long press flag
    touchTimer = setTimeout(() => {
        if (lastTouchTarget) {
            toggleFlag(index);
            touchTimer = null;
        }
    }, LONG_PRESS_DURATION);
}

function handleTouchEnd(e, index) {
    if (touchTimer) {
        // Click was shorter than LONG_PRESS_DURATION -> Treat as normal click (dig or flag based on UI mode)
        clearTimeout(touchTimer);
        touchTimer = null;
        
        if (gameOverState || gameWonState) return;
        
        if (mode === 'flag') {
            toggleFlag(index);
        } else {
            revealCell(index);
        }
    }
    lastTouchTarget = null;
}

function handleTouchMove() {
    // If finger moves, cancel the long press
    if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
    }
    lastTouchTarget = null;
}


// Event Listeners for controls
document.querySelectorAll('.difficulty-select .btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        initGame(e.target.dataset.diff);
    });
});

faceBtn.addEventListener('click', () => {
    initGame(currentDiff);
});

modalBtnRestart.addEventListener('click', () => {
    initGame(currentDiff);
});

// Mode buttons (Dig / Flag toggling for mobile click)
btnModeDig.addEventListener('click', () => {
    mode = 'dig';
    btnModeDig.classList.add('active');
    btnModeFlag.classList.remove('active');
    playSound('click');
});

btnModeFlag.addEventListener('click', () => {
    mode = 'flag';
    btnModeFlag.classList.add('active');
    btnModeDig.classList.remove('active');
    playSound('click');
});

// Sound Toggle
btnSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        btnSound.textContent = '🔊 Sound On';
        btnSound.style.background = 'rgba(255,255,255,0.05)';
        initAudio();
        playSound('click');
    } else {
        btnSound.textContent = '🔇 Sound Off';
        btnSound.style.background = 'rgba(239, 68, 68, 0.1)';
    }
});

// Prevent long-press trigger default options menu on mobile screens
window.addEventListener('contextmenu', (e) => {
    // Check if clicked inside grid
    if (e.target.classList.contains('cell')) {
        e.preventDefault();
    }
}, { passive: false });


// Run Game on startup
initGame('easy');
