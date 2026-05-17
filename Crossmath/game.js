const levels = [
    {
        id: 1,
        rows: 5,
        cols: 5,
        bank: [2, 3],
        grid: [
            [{type: 'empty', val: null, ans: 3}, {type: 'op', val: '+'}, {type: 'fixed', val: 4}, {type: 'eq', val: '='}, {type: 'res', val: 7}],
            [{type: 'op', val: '+'}, null, {type: 'op', val: '-'}, null, null],
            [{type: 'fixed', val: 5}, {type: 'op', val: '-'}, {type: 'empty', val: null, ans: 2}, {type: 'eq', val: '='}, {type: 'res', val: 3}],
            [{type: 'eq', val: '='}, null, {type: 'eq', val: '='}, null, null],
            [{type: 'res', val: 8}, null, {type: 'res', val: 2}, null, null]
        ]
    },
    {
        id: 2,
        rows: 5,
        cols: 5,
        bank: [2, 5, 6],
        grid: [
            [{type: 'empty', val: null, ans: 6}, {type: 'op', val: '/'}, {type: 'empty', val: null, ans: 2}, {type: 'eq', val: '='}, {type: 'res', val: 3}],
            [{type: 'op', val: '-'}, null, {type: 'op', val: '+'}, null, null],
            [{type: 'fixed', val: 1}, {type: 'op', val: '*'}, {type: 'empty', val: null, ans: 5}, {type: 'eq', val: '='}, {type: 'res', val: 5}],
            [{type: 'eq', val: '='}, null, {type: 'eq', val: '='}, null, null],
            [{type: 'res', val: 5}, null, {type: 'res', val: 7}, null, null]
        ]
    },
    {
        id: 3,
        rows: 5,
        cols: 5,
        bank: [2, 4, 8],
        grid: [
            [{type: 'empty', val: null, ans: 8}, {type: 'op', val: '-'}, {type: 'fixed', val: 3}, {type: 'eq', val: '='}, {type: 'res', val: 5}],
            [{type: 'op', val: '/'}, null, {type: 'op', val: '*'}, null, null],
            [{type: 'empty', val: null, ans: 2}, {type: 'op', val: '+'}, {type: 'empty', val: null, ans: 4}, {type: 'eq', val: '='}, {type: 'res', val: 6}],
            [{type: 'eq', val: '='}, null, {type: 'eq', val: '='}, null, null],
            [{type: 'res', val: 4}, null, {type: 'res', val: 12}, null, null]
        ]
    }
];

let currentLevelIndex = 0;
let currentGrid = [];
let currentBank = [];
let moveHistory = []; // {r, c, oldVal, newVal}
let selectedBankIndex = -1;

// DOM Elements
const boardEl = document.getElementById('crossmath-board');
const bankEl = document.getElementById('number-bank');
const levelDisplay = document.getElementById('level-display');
const undoBtn = document.getElementById('undo-btn');
const themeBtn = document.getElementById('theme-btn');
const hintBtn = document.getElementById('hint-btn');
const levelCompleteEl = document.getElementById('level-complete');
const nextLevelBtn = document.getElementById('next-level-btn');
const lcLevelNum = document.getElementById('lc-level-num');

// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'place') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }
}

function initGame() {
    // Check theme (Dark mode default)
    if (localStorage.getItem('crossmath-theme') === 'light') {
        document.body.removeAttribute('data-theme');
    } else {
        document.body.setAttribute('data-theme', 'dark');
    }
    
    // Check saved progress
    const savedLevel = localStorage.getItem('crossmath-level');
    if (savedLevel) {
        currentLevelIndex = Math.min(parseInt(savedLevel), levels.length - 1);
    }

    loadLevel(currentLevelIndex);
    
    // Event listeners
    undoBtn.addEventListener('click', undoMove);
    themeBtn.addEventListener('click', toggleTheme);
    hintBtn.addEventListener('click', showHint);
    nextLevelBtn.addEventListener('click', nextLevel);
    
    // Click outside bank to deselect
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#number-bank') && !e.target.closest('#crossmath-board')) {
            deselectBank();
        }
    });
}

function loadLevel(index) {
    if (index >= levels.length) {
        index = 0; // Loop back to start or show game finished
    }
    currentLevelIndex = index;
    const levelData = levels[index];
    
    // Deep clone grid
    currentGrid = JSON.parse(JSON.stringify(levelData.grid));
    currentBank = [...levelData.bank];
    moveHistory = [];
    selectedBankIndex = -1;
    
    levelDisplay.textContent = levelData.id;
    levelCompleteEl.classList.add('hidden');
    
    renderBoard();
    renderBank();
}

function renderBoard() {
    boardEl.innerHTML = '';
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;
    
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cellData = currentGrid[r][c];
            const cellDiv = document.createElement('div');
            cellDiv.className = 'board-cell';
            
            if (!cellData) {
                cellDiv.classList.add('cell-none');
            } else {
                if (cellData.type === 'empty') {
                    if (cellData.val !== null) {
                        cellDiv.classList.add('cell-filled');
                        cellDiv.textContent = cellData.val;
                    } else {
                        cellDiv.classList.add('cell-empty');
                    }
                    cellDiv.addEventListener('click', () => handleBoardClick(r, c));
                } else if (cellData.type === 'fixed') {
                    cellDiv.classList.add('cell-fixed');
                    cellDiv.textContent = cellData.val;
                } else if (cellData.type === 'op') {
                    cellDiv.classList.add('cell-op');
                    cellDiv.textContent = cellData.val === '*' ? '×' : (cellData.val === '/' ? '÷' : cellData.val);
                } else if (cellData.type === 'eq') {
                    cellDiv.classList.add('cell-eq');
                    cellDiv.textContent = '=';
                } else if (cellData.type === 'res') {
                    cellDiv.classList.add('cell-res');
                    cellDiv.textContent = cellData.val;
                }
            }
            
            boardEl.appendChild(cellDiv);
        }
    }
}

function renderBank() {
    bankEl.innerHTML = '';
    currentBank.forEach((num, index) => {
        const btn = document.createElement('div');
        btn.className = 'bank-number';
        btn.textContent = num;
        
        // Check if this number is already fully used on the board
        const totalNeeded = currentBank.filter(n => n === num).length;
        const totalUsed = currentGrid.flat().filter(cell => cell && cell.type === 'empty' && cell.val === num).length;
        
        if (totalUsed >= totalNeeded) {
            btn.classList.add('used');
        } else {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectBankItem(index);
            });
            
            if (index === selectedBankIndex) {
                btn.classList.add('selected');
            }
        }
        
        bankEl.appendChild(btn);
    });
}

function selectBankItem(index) {
    playSound('select');
    if (selectedBankIndex === index) {
        selectedBankIndex = -1; // Deselect
    } else {
        selectedBankIndex = index;
    }
    renderBank();
}

function deselectBank() {
    if (selectedBankIndex !== -1) {
        selectedBankIndex = -1;
        renderBank();
    }
}

function handleBoardClick(r, c) {
    const cell = currentGrid[r][c];
    if (cell.type !== 'empty') return;
    
    if (selectedBankIndex !== -1) {
        // Place number
        const valToPlace = currentBank[selectedBankIndex];
        playSound('place');
        
        // Save history
        moveHistory.push({r, c, oldVal: cell.val, newVal: valToPlace});
        
        cell.val = valToPlace;
        selectedBankIndex = -1;
        
        renderBoard();
        renderBank();
        
        checkWinCondition();
    } else if (cell.val !== null) {
        // Remove number
        playSound('select');
        moveHistory.push({r, c, oldVal: cell.val, newVal: null});
        cell.val = null;
        renderBoard();
        renderBank();
    }
}

function undoMove() {
    if (moveHistory.length === 0) return;
    const lastMove = moveHistory.pop();
    currentGrid[lastMove.r][lastMove.c].val = lastMove.oldVal;
    playSound('select');
    renderBoard();
    renderBank();
}

function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('crossmath-theme', 'light');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('crossmath-theme', 'dark');
    }
}

function showHint() {
    // Find an empty cell or incorrect cell and fill it with correct answer
    // In a real app, this would show a rewarded ad first
    let targetCell = null;
    let targetR = -1;
    let targetC = -1;
    
    // First try to find a wrong placed number
    for (let r=0; r<currentGrid.length; r++) {
        for (let c=0; c<currentGrid[r].length; c++) {
            const cell = currentGrid[r][c];
            if (cell && cell.type === 'empty' && cell.val !== null && cell.val !== cell.ans) {
                targetCell = cell;
                targetR = r; targetC = c;
                break;
            }
        }
        if (targetCell) break;
    }
    
    // If no wrong numbers, find empty
    if (!targetCell) {
        for (let r=0; r<currentGrid.length; r++) {
            for (let c=0; c<currentGrid[r].length; c++) {
                const cell = currentGrid[r][c];
                if (cell && cell.type === 'empty' && cell.val === null) {
                    targetCell = cell;
                    targetR = r; targetC = c;
                    break;
                }
            }
            if (targetCell) break;
        }
    }
    
    if (targetCell) {
        moveHistory.push({r: targetR, c: targetC, oldVal: targetCell.val, newVal: targetCell.ans});
        targetCell.val = targetCell.ans;
        playSound('place');
        renderBoard();
        renderBank();
        checkWinCondition();
    }
}

function checkWinCondition() {
    // Check if all empty cells are filled
    const allFilled = currentGrid.flat().every(cell => {
        if (!cell || cell.type !== 'empty') return true;
        return cell.val !== null;
    });
    
    if (!allFilled) return;
    
    // Verify equations
    let allCorrect = true;
    let wrongCells = [];
    
    // In this simple prototype, we just check if every filled value matches its answer
    // For a more robust system, we would parse rows and columns and eval them
    for (let r=0; r<currentGrid.length; r++) {
        for (let c=0; c<currentGrid[r].length; c++) {
            const cell = currentGrid[r][c];
            if (cell && cell.type === 'empty') {
                if (cell.val !== cell.ans) {
                    allCorrect = false;
                    wrongCells.push({r, c});
                }
            }
        }
    }
    
    if (allCorrect) {
        playSound('win');
        setTimeout(() => {
            lcLevelNum.textContent = levels[currentLevelIndex].id;
            levelCompleteEl.classList.remove('hidden');
            // Save progress
            localStorage.setItem('crossmath-level', currentLevelIndex + 1);
        }, 500);
    } else {
        playSound('wrong');
        // Animate wrong cells
        const boardDivs = boardEl.children;
        const cols = currentGrid[0].length;
        wrongCells.forEach(({r, c}) => {
            const index = r * cols + c;
            const div = boardDivs[index];
            div.classList.add('wrong-anim');
            setTimeout(() => div.classList.remove('wrong-anim'), 500);
        });
    }
}

function nextLevel() {
    loadLevel(currentLevelIndex + 1);
}

// Start game
initGame();
