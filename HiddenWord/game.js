const GRID_SIZE = 8;
const WORDS = [
    "APPLE", "BANANA", "ORANGE", "GRAPE", "MELON",
    "TIGER", "LION", "ZEBRA", "PANDA", "BEAR",
    "OCEAN", "RIVER", "MOUNTAIN", "FOREST", "DESERT",
    "PIZZA", "BURGER", "PASTA", "SALAD", "TACO",
    "GUITAR", "PIANO", "DRUMS", "FLUTE", "VIOLIN",
    "SUMMER", "WINTER", "SPRING", "AUTUMN", "SEASON",
    "PLANET", "STAR", "GALAXY", "COMET", "METEOR"
];

let grid = [];
let currentWords = [];
let targetWordIndex = 0;
let score = 0;

let isDragging = false;
let selectedCells = [];
let startCell = null;

const gridElement = document.getElementById("word-grid");
const canvas = document.getElementById("line-canvas");
const ctx = canvas.getContext("2d");
const targetWordElement = document.getElementById("target-word");
const scoreElement = document.getElementById("current-score");
const targetDisplay = document.getElementById("target-display");
const levelCompleteScreen = document.getElementById("level-complete-screen");

function initGame() {
    score = 0;
    updateScore();
    startLevel();
}

function startLevel() {
    targetWordIndex = 0;
    currentWords = getRandomWords(5);
    
    // Sort words by length descending for better placement
    let wordsToPlace = [...currentWords].sort((a, b) => b.length - a.length);
    
    generateGrid(wordsToPlace);
    renderGrid();
    updateTargetWord();
    
    levelCompleteScreen.classList.add("hidden");
    resizeCanvas();
}

function getRandomWords(count) {
    const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function generateGrid(words) {
    grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
    
    // Directions: right, down, diagonal right-down, diagonal right-up
    const dirs = [
        [0, 1], [1, 0], [1, 1], [-1, 1]
    ];
    
    for (let word of words) {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            let dir = dirs[Math.floor(Math.random() * dirs.length)];
            let row = Math.floor(Math.random() * GRID_SIZE);
            let col = Math.floor(Math.random() * GRID_SIZE);
            
            if (canPlaceWord(word, row, col, dir)) {
                placeWord(word, row, col, dir);
                placed = true;
            }
            attempts++;
        }
        
        // If couldn't place, just skip or handle (simple fallback)
        if (!placed) {
            console.log("Could not place:", word);
        }
    }
    
    // Fill empty spaces
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === '') {
                grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }
}

function canPlaceWord(word, row, col, dir) {
    let r = row;
    let c = col;
    
    for (let i = 0; i < word.length; i++) {
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) return false;
        r += dir[0];
        c += dir[1];
    }
    return true;
}

function placeWord(word, row, col, dir) {
    let r = row;
    let c = col;
    for (let i = 0; i < word.length; i++) {
        grid[r][c] = word[i];
        r += dir[0];
        c += dir[1];
    }
}

function renderGrid() {
    gridElement.innerHTML = '';
    gridElement.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
    
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.textContent = grid[r][c];
            cell.dataset.row = r;
            cell.dataset.col = c;
            gridElement.appendChild(cell);
        }
    }
}

function updateTargetWord() {
    if (targetWordIndex < currentWords.length) {
        targetWordElement.textContent = currentWords[targetWordIndex];
        
        // Pulse animation
        targetDisplay.classList.remove("pulse");
        void targetDisplay.offsetWidth; // trigger reflow
        targetDisplay.classList.add("pulse");
    } else {
        targetWordElement.textContent = "COMPLETED!";
        setTimeout(() => {
            levelCompleteScreen.classList.remove("hidden");
        }, 1000);
    }
}

function updateScore() {
    scoreElement.textContent = score;
}

// Interaction
const gridContainer = document.getElementById("word-grid-container");

gridContainer.addEventListener("mousedown", handleStart);
gridContainer.addEventListener("touchstart", handleStart, { passive: false });

window.addEventListener("mousemove", handleMove);
window.addEventListener("touchmove", handleMove, { passive: false });

window.addEventListener("mouseup", handleEnd);
window.addEventListener("touchend", handleEnd);

function getCellFromEvent(e) {
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const element = document.elementFromPoint(clientX, clientY);
    if (element && element.classList.contains("cell")) {
        return {
            row: parseInt(element.dataset.row),
            col: parseInt(element.dataset.col),
            element: element
        };
    }
    return null;
}

function handleStart(e) {
    if (targetWordIndex >= currentWords.length) return;
    
    const cell = getCellFromEvent(e);
    if (cell && !cell.element.classList.contains("found")) {
        e.preventDefault();
        isDragging = true;
        startCell = cell;
        selectedCells = [cell];
        cell.element.classList.add("selected");
        drawLine();
    }
}

function handleMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const currentCell = getCellFromEvent(e);
    if (currentCell) {
        // Calculate direction and valid cells
        const dr = currentCell.row - startCell.row;
        const dc = currentCell.col - startCell.col;
        
        // Check if it's a straight line (horizontal, vertical, diagonal)
        if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
            // Clear previous selection
            document.querySelectorAll(".cell.selected").forEach(el => el.classList.remove("selected"));
            selectedCells = [];
            
            const steps = Math.max(Math.abs(dr), Math.abs(dc));
            const stepR = steps === 0 ? 0 : dr / steps;
            const stepC = steps === 0 ? 0 : dc / steps;
            
            for (let i = 0; i <= steps; i++) {
                const r = startCell.row + i * stepR;
                const c = startCell.col + i * stepC;
                const element = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                if (element) {
                    element.classList.add("selected");
                    selectedCells.push({ row: r, col: c, element });
                }
            }
            drawLine();
        }
    }
}

function handleEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    
    // Check if word matches target
    let formedWord = selectedCells.map(c => grid[c.row][c.col]).join('');
    let target = currentWords[targetWordIndex];
    let targetReverse = target.split('').reverse().join('');
    
    if (formedWord === target || formedWord === targetReverse) {
        // Word found!
        selectedCells.forEach(c => {
            c.element.classList.remove("selected");
            c.element.classList.add("found");
        });
        
        score += target.length * 10;
        updateScore();
        
        targetWordIndex++;
        updateTargetWord();
    } else {
        // Invalid, clear selection
        selectedCells.forEach(c => c.element.classList.remove("selected"));
    }
    
    selectedCells = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Canvas line drawing
function resizeCanvas() {
    canvas.width = gridElement.offsetWidth;
    canvas.height = gridElement.offsetHeight;
}

window.addEventListener("resize", resizeCanvas);

function drawLine() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (selectedCells.length < 2) return;
    
    const start = selectedCells[0].element;
    const end = selectedCells[selectedCells.length - 1].element;
    
    const startRect = start.getBoundingClientRect();
    const endRect = end.getBoundingClientRect();
    const gridRect = gridElement.getBoundingClientRect();
    
    const startX = startRect.left - gridRect.left + startRect.width / 2;
    const startY = startRect.top - gridRect.top + startRect.height / 2;
    const endX = endRect.left - gridRect.left + endRect.width / 2;
    const endY = endRect.top - gridRect.top + endRect.height / 2;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = startRect.height * 0.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
    ctx.stroke();
}

// Controls
document.getElementById("reset-btn").addEventListener("click", () => {
    startLevel();
});

document.getElementById("next-level-btn").addEventListener("click", () => {
    startLevel();
});

document.getElementById("hint-btn").addEventListener("click", () => {
    if (targetWordIndex >= currentWords.length) return;
    
    const target = currentWords[targetWordIndex];
    
    // Find the word in the grid to give a hint
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === target[0]) {
                const element = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                if (element && !element.classList.contains("found")) {
                    element.style.animation = "pulse 1s";
                    setTimeout(() => element.style.animation = "", 1000);
                    // Minimal hint: just pulse the first letter
                    // Add point penalty
                    score = Math.max(0, score - 5);
                    updateScore();
                    return;
                }
            }
        }
    }
});

// Initialize
initGame();
