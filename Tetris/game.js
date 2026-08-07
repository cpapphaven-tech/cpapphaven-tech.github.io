/**
 * Classic Tetris Game Logic - PlayMixGames
 */
"use strict";

const canvas = document.getElementById('tetris-board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas.getContext('2d');

const scoreEl = document.getElementById('score-display');
const levelEl = document.getElementById('level-display');
const linesEl = document.getElementById('lines-display');
const bestEl = document.getElementById('best-display');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const overlayBtn = document.getElementById('overlay-btn');

// Game Constants
const COLS = 10;
const ROWS = 20;
let BLOCK_SIZE = 30; // will be recalculated on resize

// Colors for the 7 Tetrominoes (Cyan, Blue, Orange, Yellow, Green, Purple, Red)
const COLORS = [
    null,
    '#00FFFF', // I
    '#0000FF', // J
    '#FFA500', // L
    '#FFFF00', // O
    '#00FF00', // S
    '#800080', // T
    '#FF0000'  // Z
];

// Tetromino Shapes
const SHAPES = [
    [],
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[2,0,0], [2,2,2], [0,0,0]], // J
    [[0,0,3], [3,3,3], [0,0,0]], // L
    [[4,4], [4,4]], // O
    [[0,5,5], [5,5,0], [0,0,0]], // S
    [[0,6,0], [6,6,6], [0,0,0]], // T
    [[7,7,0], [0,7,7], [0,0,0]]  // Z
];

let board = [];
let score = 0;
let level = 1;
let lines = 0;
let bestScore = parseInt(localStorage.getItem('pmg_tetris_best') || '0', 10);
let isGameOver = true;
let isPaused = false;
let animationId;

let currentPiece = null;
let nextPiece = null;

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// Resize handling for responsive canvas
function resize() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Dynamically calculate available vertical space
        // Subtract approximate heights: TopNav(60) + HUD(60) + Controls(100) + BottomAd(70) + Paddings(40) = ~330px
        let availableHeight = window.innerHeight - 330;
        
        // Clamp height between 300px and 500px
        if (availableHeight > 500) availableHeight = 500;
        if (availableHeight < 300) availableHeight = 300;
        
        // Ensure height is cleanly divisible by ROWS (20) for crisp rendering
        availableHeight = Math.floor(availableHeight / ROWS) * ROWS;
        
        canvas.height = availableHeight;
        canvas.width = availableHeight / 2; // Tetris grid is 10x20 (1:2 ratio)
    } else {
        canvas.width = 300;
        canvas.height = 600;
    }
    
    BLOCK_SIZE = canvas.width / COLS;
    draw();
}
window.addEventListener('resize', resize);
resize();

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece() {
    const typeId = Math.floor(Math.random() * 7) + 1;
    return {
        matrix: SHAPES[typeId],
        pos: { x: Math.floor(COLS / 2) - Math.floor(SHAPES[typeId][0].length / 2), y: 0 },
        typeId: typeId
    };
}

function initGame() {
    board = createMatrix(COLS, ROWS);
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    updateScore();
    
    nextPiece = createPiece();
    spawnPiece();
    
    isGameOver = false;
    isPaused = false;
    overlay.classList.add('hidden');
    
    lastTime = 0;
    cancelAnimationFrame(animationId);
    update();
}

function spawnPiece() {
    currentPiece = nextPiece;
    nextPiece = createPiece();
    
    drawNextPiece();
    
    // Check game over immediately on spawn
    if (collide(board, currentPiece)) {
        gameOver();
    }
}

function collide(board, piece) {
    const m = piece.matrix;
    const o = piece.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(board, piece) {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + piece.pos.y][x + piece.pos.x] = value;
            }
        });
    });
}

function sweepLines() {
    let linesCleared = 0;
    outer: for (let y = board.length - 1; y >= 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        linesCleared++;
    }
    
    if (linesCleared > 0) {
        const lineScores = [0, 100, 300, 500, 800];
        score += lineScores[linesCleared] * level;
        lines += linesCleared;
        
        // Level up every 10 lines
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        
        updateScore();
    }
}

function playerDrop() {
    if (isGameOver) return;
    currentPiece.pos.y++;
    if (collide(board, currentPiece)) {
        currentPiece.pos.y--;
        merge(board, currentPiece);
        sweepLines();
        spawnPiece();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    if (isGameOver) return;
    while (!collide(board, currentPiece)) {
        currentPiece.pos.y++;
    }
    currentPiece.pos.y--;
    merge(board, currentPiece);
    sweepLines();
    spawnPiece();
    dropCounter = 0;
}

function playerMove(dir) {
    if (isGameOver) return;
    currentPiece.pos.x += dir;
    if (collide(board, currentPiece)) {
        currentPiece.pos.x -= dir;
    }
}

function playerRotate() {
    if (isGameOver) return;
    const pos = currentPiece.pos.x;
    let offset = 1;
    
    // Transpose and reverse (Rotate 90deg)
    const m = currentPiece.matrix;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
        }
    }
    m.forEach(row => row.reverse());
    
    // Wall kick
    while (collide(board, currentPiece)) {
        currentPiece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > m[0].length) {
            // Revert rotation if no wall kick found
            m.forEach(row => row.reverse());
            for (let y = 0; y < m.length; ++y) {
                for (let x = 0; x < y; ++x) {
                    [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
                }
            }
            currentPiece.pos.x = pos;
            return;
        }
    }
}

function update(time = 0) {
    if (isGameOver || isPaused) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    
    draw();
    animationId = requestAnimationFrame(update);
}

function drawBlock(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size, size);
    
    // Bevel effect
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x * size, y * size, size, size * 0.15); // Top
    ctx.fillRect(x * size, y * size, size * 0.15, size); // Left
    
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x * size, y * size + size * 0.85, size, size * 0.15); // Bottom
    ctx.fillRect(x * size + size * 0.85, y * size, size * 0.15, size); // Right
}

function drawMatrix(matrix, offset, context, size) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(context, x + offset.x, y + offset.y, size, COLORS[value]);
            }
        });
    });
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const size = 20;
    // Center the piece in the next box
    const m = nextPiece.matrix;
    const offsetX = (nextCanvas.width / size - m[0].length) / 2;
    const offsetY = (nextCanvas.height / size - m.length) / 2;
    
    drawMatrix(m, {x: offsetX, y: offsetY}, nextCtx, size);
}

function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }

    drawMatrix(board, {x: 0, y: 0}, ctx, BLOCK_SIZE);
    
    if (currentPiece) {
        drawMatrix(currentPiece.matrix, currentPiece.pos, ctx, BLOCK_SIZE);
    }
}

function updateScore() {
    scoreEl.innerText = score;
    levelEl.innerText = level;
    linesEl.innerText = lines;
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('pmg_tetris_best', bestScore);
    }
    bestEl.innerText = bestScore;
}

function gameOver() {
    isGameOver = true;
    overlayTitle.innerText = "Game Over!";
    overlayMsg.innerText = `Final Score: ${score}`;
    overlayBtn.innerText = "Play Again";
    overlay.classList.remove('hidden');
}

// Controls
document.addEventListener('keydown', event => {
    if (isGameOver) return;
    
    // Prevent default scrolling for game keys (Arrows and Space)
    if ([32, 37, 38, 39, 40].includes(event.keyCode)) {
        event.preventDefault();
    }
    
    switch (event.keyCode) {
        case 37: // Left
            playerMove(-1);
            break;
        case 39: // Right
            playerMove(1);
            break;
        case 40: // Down
            playerDrop();
            break;
        case 38: // Up
            playerRotate();
            break;
        case 32: // Space
            playerHardDrop();
            break;
    }
});

// Mobile Controls
document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); playerMove(-1); });
document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); playerMove(1); });
document.getElementById('btn-rotate').addEventListener('touchstart', (e) => { e.preventDefault(); playerRotate(); });
document.getElementById('btn-down').addEventListener('touchstart', (e) => { e.preventDefault(); playerDrop(); });
document.getElementById('btn-drop').addEventListener('touchstart', (e) => { e.preventDefault(); playerHardDrop(); });

// Handle mouse clicks for mobile buttons testing on desktop
document.getElementById('btn-left').addEventListener('mousedown', (e) => { e.preventDefault(); playerMove(-1); });
document.getElementById('btn-right').addEventListener('mousedown', (e) => { e.preventDefault(); playerMove(1); });
document.getElementById('btn-rotate').addEventListener('mousedown', (e) => { e.preventDefault(); playerRotate(); });
document.getElementById('btn-down').addEventListener('mousedown', (e) => { e.preventDefault(); playerDrop(); });
document.getElementById('btn-drop').addEventListener('mousedown', (e) => { e.preventDefault(); playerHardDrop(); });


overlayBtn.addEventListener('click', initGame);

// Initial render
bestEl.innerText = bestScore;
draw();
