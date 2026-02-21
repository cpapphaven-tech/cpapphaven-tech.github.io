const state = {
    grid: [],     // Current state
    solution: [], // Solved state
    initial: [],  // Immutable start state
    selected: null, // {r, c}
    notesMode: false,
    notes: [],    // 9x9 array of Sets
    history: [],  // Undo stack
    level: 1,
    difficulty: 'Easy'
};

const UI = {
    board: document.getElementById('sudoku-board'),
    controls: {
        undo: document.getElementById('undo-btn'),
        notes: document.getElementById('notes-btn'),
        hint: document.getElementById('hint-btn'),
        restart: document.getElementById('restart-btn'),
        numpad: document.querySelectorAll('.numpad-btn')
    },
    screens: {
        win: document.getElementById('level-complete-screen')
    },
    labels: {
        difficulty: document.getElementById('difficulty-label')
    },
    nextBtn: document.getElementById('next-level-btn')
};

let gameStartTime = null;
let durationSent = false;
let gameStartedFlag = false;

function getOSKey() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    if (/Win/i.test(ua)) return "windows";
    if (/Mac/i.test(ua)) return "mac";
    if (/Linux/i.test(ua)) return "linux";
    return "unknown";
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
    if (/MSIE|Trident/i.test(ua)) return "Internet Explorer";

    return "Unknown";
}

function sendDurationOnExit(reason) {
    if (gameStartTime && !durationSent && window.trackGameEvent) {
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);

        window.trackGameEvent(`game_duration_sudoku_${seconds}_${reason}_${getBrowser()}`, {
            seconds,
            end_reason: reason,
            os: getOS()
        });

        durationSent = true;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {


        sendDurationOnExit("background_sudoku");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_sudoku");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        window.trackGameEvent(`exit_before_game_sudoku_${osKey}`, {
            os: getOS()
        });
    }
});

// --- Game Control ---
function loadAdsterraBanner() {
    // Desktop only check (using User Agent and Screen Width for safety)
    const osKey = getOSKey();
    if (osKey === "android" || osKey === "ios" || window.innerWidth < 1024) {
        return;
    }

    const container = document.getElementById("adsterra-banner");
    if (!container) return;

    setTimeout(() => {
        console.log("Loading Adsterra Banner...");

        // Create an iframe to safely isolate the ad execution
        const iframe = document.createElement('iframe');
        iframe.style.width = "160px";
        iframe.style.height = "600px";
        iframe.style.border = "none";
        iframe.style.overflow = "hidden";
        iframe.scrolling = "no";

        container.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
            <body style="margin:0;padding:0;background:transparent;">
                <script>
                    atOptions = {
                        'key' : '34488dc997487ff336bf5de366c86553',
                        'format' : 'iframe',
                        'height' : 600,
                        'width' : 160,
                        'params' : {}
                    };
                </script>
                <script src="https://www.highperformanceformat.com/34488dc997487ff336bf5de366c86553/invoke.js"></script>
            </body>
            </html>
        `);
        doc.close();



    }, 100);
}

function init() {
    setupEventListeners();
    startNewGame(1);

     if (!window.DEV_MODE) {
                  loadAdsterraBanner();
        }

            gameStartTime = Date.now();   // ⏱ start timer
    durationSent = false;
}

function startNewGame(level = 1) {
    state.level = level;
    state.history = []; // Reset history
    state.selected = null;
    state.notesMode = false;
    updateNotesButton();

    // Difficulty
    let holes = 30; // Easy
    if (level > 5) holes = 40; // Medium
    if (level > 15) holes = 50; // Hard
    if (level > 30) holes = 55; // Expert

    state.difficulty = holes < 35 ? 'Easy' : (holes < 45 ? 'Medium' : 'Hard');
    if (UI.labels.difficulty) UI.labels.difficulty.innerHTML = `| Level ${level} (${state.difficulty})`;

    generateBoard(holes);
    renderBoard();
    UI.screens.win.classList.add('hidden');
    UI.screens.win.classList.remove('visible');
}

function saveHistory() {
    // Deep copy grid and notes (Set -> Array)
    const notesArray = state.notes.map(r => r.map(s => Array.from(s)));
    state.history.push({
        grid: JSON.parse(JSON.stringify(state.grid)),
        notes: notesArray
    });
}

function restoreHistory() {
    if (state.history.length === 0) return;
    const last = state.history.pop();
    state.grid = last.grid;
    // Restore notes (Array -> Set)
    state.notes = last.notes.map(r => r.map(n => new Set(n)));
    renderBoard();
}

// --- Sudoku Logic ---

function generateBoard(holes) {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

    // Fill diagonal 3x3
    for (let i = 0; i < 9; i += 3) fillBox(grid, i, i);

    // Solve remainder
    solveSudoku(grid);
    state.solution = JSON.parse(JSON.stringify(grid));

    // Remove digits
    removeDigits(grid, holes);

    state.initial = JSON.parse(JSON.stringify(grid));
    state.grid = JSON.parse(JSON.stringify(grid));

    // Init notes empty
    state.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
}

function fillBox(grid, row, col) {
    let num;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            do { num = Math.floor(Math.random() * 9) + 1; }
            while (!isSafeBox(grid, row, col, num));
            grid[row + i][col + j] = num;
        }
    }
}

function isSafeBox(grid, rowStart, colStart, num) {
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (grid[rowStart + i][colStart + j] === num) return false;
    return true;
}

function isSafe(grid, row, col, num) {
    for (let x = 0; x < 9; x++) if (grid[row][x] === num) return false;
    for (let x = 0; x < 9; x++) if (grid[x][col] === num) return false;
    const startRow = row - row % 3, startCol = col - col % 3;
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (grid[startRow + i][startCol + j] === num) return false;
    return true;
}

function solveSudoku(grid) {
    let row = -1, col = -1, isEmpty = false;
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (grid[i][j] === 0) { row = i; col = j; isEmpty = true; break; }
        }
        if (isEmpty) break;
    }
    if (!isEmpty) return true;

    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Randomize solve order slightly for variety? No need if diag filled random.
    for (let num of nums) {
        if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid)) return true;
            grid[row][col] = 0;
        }
    }
    return false;
}

function removeDigits(grid, count) {
    while (count > 0) {
        let r = Math.floor(Math.random() * 9);
        let c = Math.floor(Math.random() * 9);
        if (grid[r][c] !== 0) {
            grid[r][c] = 0;
            count--;
        }
    }
}

// --- UI Rendering ---

function renderBoard() {
    UI.board.innerHTML = '';
    // Use CSS Grid so structure is flat divisible by 9
    // But styling 3x3 blocks is easier if we use classes or borders
    // CSS handles borders.

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';

            // Fixed?
            if (state.initial[r][c] !== 0) cell.classList.add('fixed');

            // Content
            const val = state.grid[r][c];
            if (val !== 0) {
                cell.textContent = val;
                // Error check
                if (state.initial[r][c] === 0 && val !== state.solution[r][c]) {
                    cell.classList.add('error');
                }
            } else {
                // Notes
                const ns = state.notes[r][c];
                if (ns.size > 0) {
                    cell.style.fontSize = '0.6rem';
                    cell.style.lineHeight = '1';
                    cell.style.display = 'grid';
                    cell.style.gridTemplateColumns = 'repeat(3, 1fr)';
                    cell.style.alignItems = 'center';
                    cell.style.justifyItems = 'center';
                    // Render mini grid for notes
                    for (let k = 1; k <= 9; k++) {
                        const span = document.createElement('span');
                        span.textContent = ns.has(k) ? k : '';
                        cell.appendChild(span);
                    }
                }
            }

            // Selection / Highlight
            if (state.selected) {
                if (state.selected.r === r && state.selected.c === c) cell.classList.add('selected');
                else if (val !== 0 && val === state.grid[state.selected.r][state.selected.c]) cell.classList.add('highlighted');
            }

            cell.onclick = () => { state.selected = { r, c }; renderBoard(); };
            UI.board.appendChild(cell);
        }
    }
}

function inputNumber(num) {
    if (!state.selected) return;
    const { r, c } = state.selected;
    if (state.initial[r][c] !== 0) return; // Immutable

    // Save history BEFORE change
    saveHistory();

    if (state.notesMode) {
        if (num === 0) state.notes[r][c].clear();
        else {
            if (state.notes[r][c].has(num)) state.notes[r][c].delete(num);
            else state.notes[r][c].add(num);
        }
    } else {
        if (num === 0) state.grid[r][c] = 0;
        else {
            // Set number & Clear notes
            state.grid[r][c] = num;
            state.notes[r][c].clear();

            // Check win
            checkWin();
        }
    }
    renderBoard();
}

function checkWin() {
    let full = true;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (state.grid[r][c] !== state.solution[r][c]) {
                full = false;
                break;
            }
        }
    }
    if (full) {
        UI.screens.win.classList.remove('hidden');
        UI.screens.win.classList.add('visible');
    }
}

// --- Inputs ---

function setupEventListeners() {
    UI.controls.numpad.forEach(btn => {
        btn.addEventListener('click', () => {
            const n = parseInt(btn.dataset.num);
            inputNumber(n);
        });
    });

    document.addEventListener('keydown', (e) => {
        const k = parseInt(e.key);
        if (!isNaN(k) && k >= 0 && k <= 9) inputNumber(k);
        if (e.key === 'Backspace' || e.key === 'Delete') inputNumber(0);
    });

    UI.controls.undo.addEventListener('click', restoreHistory);

    UI.controls.notes.addEventListener('click', () => {
        state.notesMode = !state.notesMode;
        updateNotesButton();
    });

    UI.controls.hint.addEventListener('click', () => {
        if (!state.selected) return;
        const { r, c } = state.selected;
        if (state.grid[r][c] !== 0 && state.grid[r][c] === state.solution[r][c]) return; // Correct already

        saveHistory(); // Save before hint
        state.grid[r][c] = state.solution[r][c];
        state.notes[r][c].clear();
        renderBoard();
        checkWin();
    });

    UI.controls.restart.addEventListener('click', () => {
        if (confirm('Restart level?')) startNewGame(state.level);
    });

    if (UI.nextBtn) {
        UI.nextBtn.addEventListener('click', () => startNewGame(state.level + 1));
    }
}

function updateNotesButton() {
    const icon = UI.controls.notes.querySelector('.icon');
    const label = UI.controls.notes.querySelector('.label');
    if (state.notesMode) {
        icon.textContent = '✏️'; // Change icon?
        label.textContent = 'Notes: ON';
        icon.style.background = 'rgba(0, 242, 96, 0.5)';
    } else {
        icon.textContent = '📝';
        label.textContent = 'Notes: OFF';
        icon.style.background = 'rgba(255,255,255,0.1)';
    }
}

// Init
init();
