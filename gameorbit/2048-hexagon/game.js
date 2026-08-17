/**
 * 2048 Game Logic – PlayMixGames
 * Fixed version:
 *   - Arrow key + WASD (desktop keyboard)
 *   - Mouse drag swipe (desktop)
 *   - Touch swipe (mobile)
 *   - Tile appear + merge animations
 *   - Local best-score persistence
 *   - Win (2048) detection & keep-going mode
 *   - Game over detection
 */

"use strict";

const GRID_SIZE = 4;
const WIN_TILE  = 2048;
const GAP       = 10;  // px — must match CSS gap
const PADDING   = 10;  // px — must match CSS board padding

let board     = [];
let score     = 0;
let best      = parseInt(localStorage.getItem("pmg_2048_best") || "0", 10);
let won       = false;
let keepGoing = false;
let gameOver  = false;

// Track which cells were merged this move (for animation)
let mergedCells = new Set();

const boardEl    = document.getElementById("board");
const scoreEl    = document.getElementById("score-display");
const bestEl     = document.getElementById("best-display");
const overlay    = document.getElementById("overlay");
const oTitle     = document.getElementById("overlay-title");
const oMsg       = document.getElementById("overlay-msg");
const oContinue  = document.getElementById("overlay-continue");
const oRestart   = document.getElementById("overlay-restart");
const newGameBtn = document.getElementById("new-game-btn");

// ──────────────────────────────────────
// CELL SIZE — computed from board dimensions (no RAF needed)
// ──────────────────────────────────────
function cellSize() {
    const boardW = boardEl.clientWidth;  // includes padding
    const size = (boardW - 2 * PADDING - GAP * (GRID_SIZE - 1)) / GRID_SIZE;
    return Math.max(size, 40); // fallback min 40px
}

// ──────────────────────────────────────
// INIT
// ──────────────────────────────────────
function initBoard() {
    board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    score = 0;
    won = false;
    keepGoing = false;
    gameOver = false;
    mergedCells = new Set();
    overlay.classList.add("hidden");
    addRandomTile();
    addRandomTile();
    renderBoard(null);
    updateScores();
}

// ──────────────────────────────────────
// RANDOM TILE (value 2 or 4, 90/10 split)
// ──────────────────────────────────────
function addRandomTile() {
    const empty = [];
    for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++)
            if (board[r][c] === 0) empty.push({ r, c });
    if (!empty.length) return null;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return { r, c };
}

// ──────────────────────────────────────
// SLIDE & MERGE (single row, left direction)
// Returns { result: number[], mergedIndices: Set<number> }
// ──────────────────────────────────────
function slideRow(row) {
    const nums = row.filter(v => v !== 0);
    const mergedIdx = new Set();

    for (let i = 0; i < nums.length - 1; i++) {
        if (!mergedIdx.has(i) && nums[i] === nums[i + 1]) {
            nums[i] *= 2;
            score += nums[i];
            nums.splice(i + 1, 1);
            mergedIdx.add(i);
        }
    }

    while (nums.length < GRID_SIZE) nums.push(0);
    return nums;
}

// ──────────────────────────────────────
// MOVE
// ──────────────────────────────────────
function move(dir) {
    if (gameOver) return;
    const prev = board.map(r => r.slice());

    mergedCells = new Set();

    for (let i = 0; i < GRID_SIZE; i++) {
        let row;
        if (dir === "left")  row = board[i].slice();
        if (dir === "right") row = board[i].slice().reverse();
        if (dir === "up")    row = [board[0][i], board[1][i], board[2][i], board[3][i]];
        if (dir === "down")  row = [board[3][i], board[2][i], board[1][i], board[0][i]];

        const slid = slideRow(row);

        if (dir === "left")  board[i] = slid;
        if (dir === "right") board[i] = slid.reverse();
        if (dir === "up")    [board[0][i], board[1][i], board[2][i], board[3][i]] = slid;
        if (dir === "down")  [board[3][i], board[2][i], board[1][i], board[0][i]] = slid;
    }

    // Check if anything actually changed
    let changed = false;
    for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++)
            if (board[r][c] !== prev[r][c]) { changed = true; break; }

    if (!changed) return;

    // Update best score
    if (score > best) {
        best = score;
        localStorage.setItem("pmg_2048_best", best);
    }

    const newTile = addRandomTile();
    renderBoard(newTile);
    updateScores();
    checkState();
}

// ──────────────────────────────────────
// CHECK WIN / GAME OVER
// ──────────────────────────────────────
function checkState() {
    // Win check
    if (!won && !keepGoing) {
        for (let r = 0; r < GRID_SIZE; r++)
            for (let c = 0; c < GRID_SIZE; c++)
                if (board[r][c] >= WIN_TILE) {
                    won = true;
                    setTimeout(() => showOverlay("🎉 You Win!", "You reached 2048! Keep going for a higher score.", true), 200);
                    return;
                }
    }

    // Game over: board full + no adjacent merges possible
    const full = board.every(row => row.every(v => v !== 0));
    if (!full) return;

    for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++) {
            if (c + 1 < GRID_SIZE && board[r][c] === board[r][c + 1]) return;
            if (r + 1 < GRID_SIZE && board[r][c] === board[r + 1][c]) return;
        }

    gameOver = true;
    setTimeout(() => showOverlay("😞 Game Over", `No more moves! Your score: ${score.toLocaleString()}`, false), 200);
}

function showOverlay(title, msg, isWin) {
    oTitle.textContent = title;
    oMsg.textContent   = msg;
    oContinue.style.display = isWin ? "inline-block" : "none";
    overlay.classList.remove("hidden");
}

// ──────────────────────────────────────
// SCORES
// ──────────────────────────────────────
function updateScores() {
    scoreEl.textContent = score.toLocaleString();
    bestEl.textContent  = best.toLocaleString();
}

// ──────────────────────────────────────
// RENDER — fully synchronous, no RAF
// ──────────────────────────────────────
function renderBoard(newTile) {
    const cs = cellSize();
    boardEl.innerHTML = "";

    // Background grid cells
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.style.width  = cs + "px";
        cell.style.height = cs + "px";
        boardEl.appendChild(cell);
    }

    // Numbered tiles — positioned absolute over the grid
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const val = board[r][c];
            if (!val) continue;

            const tile = document.createElement("div");
            tile.className = "tile";
            tile.dataset.val = val > 8192 ? "8192" : val; // cap for CSS colours
            tile.textContent = val;

            const top  = PADDING + r * (cs + GAP);
            const left = PADDING + c * (cs + GAP);
            tile.style.top    = top  + "px";
            tile.style.left   = left + "px";
            tile.style.width  = cs + "px";
            tile.style.height = cs + "px";

            // Font size scaling
            if (val >= 1000)  tile.style.fontSize = cs < 80 ? "1rem"  : "1.3rem";
            if (val >= 10000) tile.style.fontSize = cs < 80 ? "0.8rem": "1rem";

            if (newTile && newTile.r === r && newTile.c === c) {
                tile.classList.add("new");
            }

            boardEl.appendChild(tile);
        }
    }
}

// ──────────────────────────────────────
// KEYBOARD CONTROLS
// ──────────────────────────────────────
const keyMap = {
    ArrowLeft: "left",  ArrowRight: "right",
    ArrowUp:   "up",    ArrowDown:  "down",
    a: "left", d: "right", w: "up", s: "down",
};

document.addEventListener("keydown", e => {
    const dir = keyMap[e.key];
    if (!dir) return;
    e.preventDefault();
    move(dir);
});

// ──────────────────────────────────────
// SWIPE — TOUCH (mobile)
// ──────────────────────────────────────
const MIN_TOUCH = 20;  // px — small threshold for deliberate finger swipe
let touchStartX = null, touchStartY = null;

boardEl.addEventListener("touchstart", e => {
    if (!e.target.classList.contains("tile")) {
        touchStartX = null;
        touchStartY = null;
        return; // Only start swipe on a tile
    }
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    // Don't prevent default here so clicks still work, but track the start
}, { passive: false });

boardEl.addEventListener("touchend", e => {
    if (touchStartX === null || touchStartY === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < MIN_TOUCH) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
    else                              move(dy > 0 ? "down"  : "up");
    e.preventDefault();
}, { passive: false });

// ──────────────────────────────────────
// SWIPE — MOUSE DRAG (desktop)
// Uses mousemove to confirm the user is truly dragging,
// not just clicking or slightly wobbling the mouse.
// ──────────────────────────────────────
const MIN_MOUSE = 50;  // px — larger threshold for mouse (easier to overshoot)
let mouseStartX  = 0;
let mouseStartY  = 0;
let mouseDown    = false;   // button is held
let mouseDragged = false;   // moved far enough to count as drag

boardEl.addEventListener("mousedown", e => {
    if (e.button !== 0) return; // left button only
    if (!e.target.classList.contains("tile")) return; // Only start swipe on a tile
    mouseStartX  = e.clientX;
    mouseStartY  = e.clientY;
    mouseDown    = true;
    mouseDragged = false;
    e.preventDefault();
});

// Track movement while button is held
document.addEventListener("mousemove", e => {
    if (!mouseDown) return;
    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) >= MIN_MOUSE) {
        mouseDragged = true; // confirmed intentional drag
    }
});

// Only fire move if a real drag happened
document.addEventListener("mouseup", e => {
    if (!mouseDown) return;
    const wasDragged = mouseDragged;
    mouseDown    = false;
    mouseDragged = false;
    if (!wasDragged) return; // just a click — ignore

    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
    else                              move(dy > 0 ? "down"  : "up");
});

// Cancel drag if mouse leaves the window
document.addEventListener("mouseleave", () => {
    mouseDown = false;
    mouseDragged = false;
});

// Prevent default drag image
boardEl.addEventListener("dragstart", e => e.preventDefault());

// ──────────────────────────────────────
// SWIPE — TRACKPAD (Mac/Windows precision touchpad)
// ──────────────────────────────────────
let trackpadCooldown = false;

boardEl.addEventListener("wheel", e => {
    if (trackpadCooldown) return;
    
    const dx = e.deltaX;
    const dy = e.deltaY;
    
    // Ignore small scrolls
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 15) return;
    
    e.preventDefault(); // Prevent page scroll
    
    if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? "right" : "left");
    } else {
        move(dy > 0 ? "down" : "up");
    }
    
    // Set a cooldown so one physical swipe doesn't fire multiple moves
    trackpadCooldown = true;
    setTimeout(() => {
        trackpadCooldown = false;
    }, 300);
}, { passive: false });

// ──────────────────────────────────────
// BUTTON HANDLERS
// ──────────────────────────────────────
newGameBtn.addEventListener("click", initBoard);

oContinue.addEventListener("click", () => {
    keepGoing = true;
    overlay.classList.add("hidden");
});

oRestart.addEventListener("click", initBoard);

// Re-render on window resize so tiles stay aligned
window.addEventListener("resize", () => renderBoard(null));

// ──────────────────────────────────────
// START
// ──────────────────────────────────────
updateScores();
initBoard();
