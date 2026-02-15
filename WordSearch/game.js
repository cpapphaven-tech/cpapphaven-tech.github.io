const THEMES = [
    { name: "ANIMALS", words: ["LION", "TIGER", "BEAR", "WOLF", "FOX", "DEER", "ZEBRA", "PANDA"] },
    { name: "FRUITS", words: ["APPLE", "BANANA", "GRAPE", "LEMON", "LIME", "PEACH", "BERRY", "MELON"] },
    { name: "COLORS", words: ["RED", "BLUE", "GREEN", "PINK", "CYAN", "BLACK", "WHITE", "PURPLE"] },
    { name: "SPACE", words: ["MOON", "STAR", "MARS", "SUN", "ORBIT", "COMET", "EARTH", "ALIEN"] },
    { name: "NATURE", words: ["TREE", "RIVER", "RAIN", "SNOW", "WIND", "ROCK", "LAKE", "SAND"] },
    { name: "SPORTS", words: ["SOCCER", "TENNIS", "GOLF", "RUGBY", "SWIM", "RUN", "JUMP", "DIVE"] },
    { name: "HOUSE", words: ["DOOR", "ROOF", "WALL", "FLOOR", "LAMP", "SOFA", "BED", "BATH"] },
    { name: "OCEAN", words: ["FISH", "SHARK", "WHALE", "CRAB", "SAND", "SHIP", "WAVE", "SALT"] }
];

const COLORS = ["#4facfe", "#00f260", "#ff758c", "#ffdb3b", "#ff9a44", "#c471ed"];

const state = {
    level: 1,
    themeIndex: 0,
    gridSize: 10,
    grid: [], // 2D array of chars
    words: [], // { word: "TEST", found: false, color: "#...", start: {r,c}, end: {r,c} }
    selection: null, // { start: {r,c}, end: {r,c}, valid: bool }
    isDragging: false
};

const UI = {
    grid: document.getElementById('word-grid'),
    canvas: document.getElementById('highlight-canvas'),
    ctx: document.getElementById('highlight-canvas').getContext('2d'),
    wordList: document.getElementById('word-list'),
    themeName: document.getElementById('theme-name'),
    levelNum: document.getElementById('current-level'),
    winScreen: document.getElementById('level-complete-screen'),
    nextBtn: document.getElementById('next-level-btn'),
    hintBtn: document.getElementById('hint-btn'),
    resetBtn: document.getElementById('reset-btn')
};

let gameStartTime = null;
let durationSent = false;

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

        window.trackGameEvent(`game_duration_wordsearch_${seconds}_${reason}_${getBrowser()}`, {
            seconds,
            end_reason: reason,
            os: getOS()
        });

        durationSent = true;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {


        sendDurationOnExit("background_wordsearch");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_wordsearch");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        window.trackGameEvent(`exit_before_game_wordsearch_${osKey}`, {
            os: getOS()
        });
    }
});

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



    }, 2000);
}

// --- Game Logic ---

function init() {
    setupInputs();
    setupCanvas();
    startLevel(1);

    window.addEventListener('resize', () => {
        setupCanvas();
        drawHighlights();
    });

    if (!window.DEV_MODE) {
        loadAdsterraBanner();
    }

    gameStartTime = Date.now();   // ⏱ start timer
    durationSent = false;
}

function startLevel(lvl) {
    state.level = lvl;
    state.themeIndex = (lvl - 1) % THEMES.length;
    state.gridSize = Math.min(12, 8 + Math.floor(lvl / 5)); // Increase size slightly

    const theme = THEMES[state.themeIndex];
    UI.themeName.textContent = theme.name;
    UI.levelNum.textContent = lvl;

    // Select random words from theme
    let targetWords = [...theme.words];
    // Shuffle and pick
    targetWords.sort(() => Math.random() - 0.5);
    targetWords = targetWords.slice(0, Math.min(6 + Math.floor(lvl / 3), 8)); // 6-8 words

    generateGrid(targetWords);
    renderGrid();
    renderWordList();
    UI.winScreen.classList.add('hidden');
    drawHighlights();
}

function generateGrid(words) {
    const size = state.gridSize;
    const grid = Array.from({ length: size }, () => Array(size).fill(''));
    const placedWords = [];

    // Sort long words first for better fit
    words.sort((a, b) => b.length - a.length);

    for (let word of words) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 100) {
            const dir = Math.floor(Math.random() * 4); // 0:H, 1:V, 2:D1, 3:D2
            // Directions: [dr, dc]
            const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
            const [dr, dc] = dirs[dir];

            // Random start
            let r = Math.floor(Math.random() * size);
            let c = Math.floor(Math.random() * size);

            // Check bounds
            let endR = r + dr * (word.length - 1);
            let endC = c + dc * (word.length - 1);

            if (endR >= 0 && endR < size && endC >= 0 && endC < size) {
                // Check collisions
                let fit = true;
                for (let i = 0; i < word.length; i++) {
                    const char = grid[r + dr * i][c + dc * i];
                    if (char !== '' && char !== word[i]) {
                        fit = false; break;
                    }
                }

                if (fit) {
                    // Place
                    for (let i = 0; i < word.length; i++) {
                        grid[r + dr * i][c + dc * i] = word[i];
                    }
                    placedWords.push({
                        word: word,
                        found: false,
                        color: COLORS[placedWords.length % COLORS.length],
                        start: { r, c },
                        end: { r: endR, c: endC }
                    });
                    placed = true;
                }
            }
            attempts++;
        }
    }

    // Fill empty
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === '') {
                grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }

    state.grid = grid;
    state.words = placedWords;
}

// --- Rendering ---

function renderGrid() {
    UI.grid.innerHTML = '';
    UI.grid.appendChild(UI.canvas); // Keep canvas on top/bg

    const size = state.gridSize;
    UI.grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    UI.grid.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = state.grid[r][c];
            cell.dataset.r = r;
            cell.dataset.c = c;
            UI.grid.appendChild(cell);
        }
    }

    setupCanvas(); // Resize canvas to grid
}

function renderWordList() {
    UI.wordList.innerHTML = '';
    state.words.forEach(w => {
        const div = document.createElement('div');
        div.className = 'word-item ' + (w.found ? 'found' : '');
        div.textContent = w.word;
        div.style.backgroundColor = w.found ? w.color : ''; // Tint background if found
        if (w.found) div.style.borderColor = w.color;
        UI.wordList.appendChild(div);
    });
}

function setupCanvas() {
    const rect = UI.grid.getBoundingClientRect();
    UI.canvas.width = rect.width;
    UI.canvas.height = rect.height;
}

function drawHighlights() {
    const ctx = UI.ctx;
    ctx.clearRect(0, 0, UI.canvas.width, UI.canvas.height);

    const size = state.gridSize;
    const cellW = UI.canvas.width / size;
    const cellH = UI.canvas.height / size;
    const r = Math.min(cellW, cellH) * 0.4; // Radius/Width

    // Helper to get center
    const getCenter = (row, col) => ({
        x: col * cellW + cellW / 2,
        y: row * cellH + cellH / 2
    });

    // Draw Found Words
    state.words.forEach(w => {
        if (w.found) {
            const start = getCenter(w.start.r, w.start.c);
            const end = getCenter(w.end.r, w.end.c);
            drawCapsule(ctx, start, end, r, w.color);
        }
    });

    // Draw Selection
    if (state.selection) {
        const s = state.selection.start;
        const e = state.selection.end;
        const start = getCenter(s.r, s.c);
        const end = getCenter(e.r, e.c);
        drawCapsule(ctx, start, end, r, 'rgba(79, 172, 254, 0.5)');
    }
}

function drawCapsule(ctx, p1, p2, radius, color) {
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineWidth = radius * 2;
    ctx.strokeStyle = color;
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
}


// --- Interaction ---

function getCellFromEvent(e) {
    // Handle touch or mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Get element under point
    // Since canvas is on top, we might need to rely on bounding rect calc instead of e.target
    const rect = UI.grid.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const size = state.gridSize;
    const c = Math.floor(x / (rect.width / size));
    const r = Math.floor(y / (rect.height / size));

    if (r >= 0 && r < size && c >= 0 && c < size) return { r, c };
    return null;
}

function setupInputs() {
    const handleStart = (e) => {
        e.preventDefault(); // Prevent scroll
        const cell = getCellFromEvent(e);
        if (cell) {
            state.isDragging = true;
            state.selection = { start: cell, end: cell };
            drawHighlights();
        }
    };

    const handleMove = (e) => {
        if (!state.isDragging) return;
        e.preventDefault();
        const cell = getCellFromEvent(e);
        if (cell) {
            // Check alignment (must be horizontal, vertical, or diagonal)
            const dr = Math.abs(cell.r - state.selection.start.r);
            const dc = Math.abs(cell.c - state.selection.start.c);

            // Valid if row match, col match, or dr == dc
            if (dr === 0 || dc === 0 || dr === dc) {
                state.selection.end = cell;
                drawHighlights();
            }
        }
    };

    const handleEnd = (e) => {
        if (!state.isDragging) return;
        state.isDragging = false;
        checkSelection();
        state.selection = null;
        drawHighlights();
    };

    UI.grid.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    UI.grid.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    UI.nextBtn.addEventListener('click', () => startLevel(state.level + 1));
    UI.resetBtn.addEventListener('click', () => { if (confirm('Reset?')) startLevel(state.level); });
    UI.hintBtn.addEventListener('click', giveHint);
}

function checkSelection() {
    if (!state.selection) return;

    const s = state.selection.start;
    const e = state.selection.end;

    // Build word string
    // Determine direction step
    let dr = e.r - s.r;
    let dc = e.c - s.c;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    if (steps === 0) return; // Single cell

    dr = dr / steps;
    dc = dc / steps;

    let wordStr = "";
    for (let i = 0; i <= steps; i++) {
        wordStr += state.grid[s.r + dr * i][s.c + dc * i];
    }

    // Check match
    const match = state.words.find(w => !w.found && (w.word === wordStr || w.word === wordStr.split('').reverse().join('')));

    if (match) {
        match.found = true;
        // Ensure start/end match visual selection (might be reversed)
        if (match.word === wordStr.split('').reverse().join('')) {
            // Dragged backward
            // match store start/end is correct from generation.
            // We don't need to update it unless we want strict visual match.
            // But usually generated start/end is fine.
        }
        renderWordList();

        // Check win
        if (state.words.every(w => w.found)) {
            setTimeout(() => {
                UI.winScreen.classList.remove('hidden');
                UI.winScreen.classList.add('visible');
            }, 500);
        }
    }
}

function giveHint() {
    // Find absolute first unfound word
    const w = state.words.find(x => !x.found);
    if (!w) return;

    // Temporarily highlight it
    state.selection = { start: w.start, end: w.start }; // Highlight first letter
    drawHighlights();

    // Fade out or keep? Let's just flash it?
    // Actually, let's mark the first letter permanently in grid?
    // Or just animate the selection for a second.
    const animInterval = setInterval(() => {
        state.selection = (state.selection ? null : { start: w.start, end: w.start });
        drawHighlights();
    }, 200);

    setTimeout(() => {
        clearInterval(animInterval);
        state.selection = null;
        drawHighlights();
    }, 1000);
}

init();
