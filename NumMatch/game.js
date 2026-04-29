const gridEl    = document.getElementById('grid');
const scoreEl   = document.getElementById('score-display');
const levelEl   = document.getElementById('level-display');
const hintBtn   = document.getElementById('hint-btn');
const instrEl   = document.getElementById('instruction-text');
const progressEl = document.getElementById('progress-bar-fill');

let numbers     = [];
let cols        = 9;
let score       = 0;
let level       = 1;
let selectedIdx = -1;
let totalPairs  = 0; // pairs to clear this level
let clearedPairs = 0;

// ─── Level Initialisation ───────────────────────────────────────────────────
// All valid pairs: equal numbers OR two numbers that sum to 10
const VALID_PAIRS = [
    [1,9],[2,8],[3,7],[4,6],[5,5],
    [1,1],[2,2],[3,3],[4,4],[6,6],[7,7],[8,8],[9,9]
];

function initLevel() {
    numbers      = [];
    selectedIdx  = -1;
    clearedPairs = 0;

    // Each level adds 1 row: Level 1 = 3 rows, Level 2 = 4 rows, ... capped at 10
    let rows = Math.min(2 + level, 10);
    let numPairs = Math.floor((cols * rows) / 2); // always even

    // Build board from valid pairs only → every number is guaranteed a match
    const pool = [];
    for (let i = 0; i < numPairs; i++) {
        const pair = VALID_PAIRS[Math.floor(Math.random() * VALID_PAIRS.length)];
        pool.push(pair[0], pair[1]);
    }

    // Fisher-Yates shuffle so pairs are scattered around the grid
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    pool.forEach(v => numbers.push({ value: v, cleared: false }));
    totalPairs = numPairs;

    renderGrid();
    updateUI();
    updateProgress();
}

// ─── Rendering ──────────────────────────────────────────────────────────────
function renderGrid() {
    gridEl.innerHTML = '';
    numbers.forEach((num, idx) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        if (num.cleared)        cell.classList.add('cleared');
        if (idx === selectedIdx) cell.classList.add('selected');
        cell.innerText = num.cleared ? '' : num.value;
        cell.onclick = () => handleCellClick(idx);
        gridEl.appendChild(cell);
    });
}

// ─── Click / Match Logic ────────────────────────────────────────────────────
function handleCellClick(idx) {
    if (numbers[idx].cleared) return;

    clearHints();

    if (selectedIdx === -1) {
        selectedIdx = idx;
        renderGrid();
        return;
    }

    if (selectedIdx === idx) {
        selectedIdx = -1; // deselect
        renderGrid();
        return;
    }

    // Attempt match
    if (isValidMatch(selectedIdx, idx)) {
        numbers[selectedIdx].cleared = true;
        numbers[idx].cleared         = true;
        score        += 10;
        clearedPairs += 1;
        selectedIdx   = -1;

        renderGrid();
        updateUI();
        updateProgress();

        // Check win AFTER render so user sees the last clear
        checkWin();
    } else {
        // Invalid match — flash instruction bar and move selection
        instrEl.classList.add('error-flash');
        setTimeout(() => instrEl.classList.remove('error-flash'), 600);

        selectedIdx = idx; // move selection to new tap
        renderGrid();
    }
}

// ─── Match Rules: OPEN — any two cells anywhere, no path check ───────────────
function isValidMatch(i1, i2) {
    const n1 = numbers[i1];
    const n2 = numbers[i2];
    return (n1.value === n2.value) || (n1.value + n2.value === 10);
}

// ─── Hint ────────────────────────────────────────────────────────────────────
function findHint() {
    const active = [];
    numbers.forEach((n, i) => { if (!n.cleared) active.push(i); });

    for (let a = 0; a < active.length; a++) {
        for (let b = a + 1; b < active.length; b++) {
            if (isValidMatch(active[a], active[b])) return [active[a], active[b]];
        }
    }
    return null;
}

function clearHints() {
    Array.from(gridEl.children).forEach(el => el.classList.remove('hinted'));
}

hintBtn.onclick = () => {
    clearHints();
    const match = findHint();
    if (match) {
        const cells = gridEl.children;
        if (cells[match[0]]) cells[match[0]].classList.add('hinted');
        if (cells[match[1]]) cells[match[1]].classList.add('hinted');
        cells[match[0]]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        // Soft-lock: no valid pairs left — shouldn't happen with open rules
        instrEl.textContent = '🎉 No more pairs! Great job clearing this board!';
    }
};

// ─── Progress Bar ────────────────────────────────────────────────────────────
function updateProgress() {
    const pct = totalPairs > 0 ? (clearedPairs / totalPairs) * 100 : 0;
    progressEl.style.width = pct + '%';
}

// ─── Win Check ───────────────────────────────────────────────────────────────
function checkWin() {
    const anyLeft = numbers.some(n => !n.cleared);
    if (!anyLeft) {
        setTimeout(() => {
            document.getElementById('modal').classList.add('active');
        }, 350);
    }
}

// ─── UI Update ───────────────────────────────────────────────────────────────
function updateUI() {
    scoreEl.textContent = 'Score: ' + score;
    levelEl.textContent = 'Level ' + level;
}

// ─── Next Level Modal ─────────────────────────────────────────────────────────
document.getElementById('modal-btn').onclick = () => {
    document.getElementById('modal').classList.remove('active');
    level++;
    if (window.Adsterra) window.Adsterra.showAd();
    initLevel();
};

// ─── Start ────────────────────────────────────────────────────────────────────
initLevel();
