/**
 * Block Puzzle Dash — game.js
 * Logic, Rendering, and Interaction for Block Puzzle
 */
(function () {
    'use strict';

    // --- CONFIG ---
    const GRID_SIZE = 10;
    const LEVEL_TIME = 60; // seconds
    const BEST_KEY = 'blockPuzzle_best';

    const SHAPES = [
        [[1]], // 1x1 dot
        [[1, 1]], // 1x2 horizontal
        [[1], [1]], // 1x2 vertical
        [[1, 1, 1]], // 1x3 horizontal
        [[1], [1], [1]], // 1x3 vertical
        [[1, 1, 1, 1]], // 1x4 horizontal
        [[1], [1], [1], [1]], // 1x4 vertical
        [[1, 1, 1, 1, 1]], // 1x5 horizontal
        [[1], [1], [1], [1], [1]], // 1x5 vertical
        [[1, 1], [1, 1]], // 2x2 square
        [[1, 1, 1], [1, 1, 1], [1, 1, 1]], // 3x3 square
        [[1, 0], [1, 1]], // small L
        [[0, 1], [1, 1]], // reflected small L
        [[1, 1], [1, 0]], // inverted small L
        [[1, 1], [0, 1]], // inverted reflected small L
        [[1, 0, 0], [1, 0, 0], [1, 1, 1]], // big L
        [[0, 0, 1], [0, 0, 1], [1, 1, 1]], // reflected big L
        [[1, 1, 1], [0, 0, 1], [0, 0, 1]], // inverted big L
        [[1, 1, 1], [1, 0, 0], [1, 0, 0]], // reflected inverted big L
        [[1, 1, 1], [0, 1, 0]], // T shape
    ];

    // Weighting SHAPES for easier game (more small pieces)
    const EASY_SHAPE_WEIGHTS = [
        0, 0, 0, 0, // 4x 1x1
        1, 1, 2, 2, // 4x 1x2
        11, 12, 13, 14, // small Ls
        9, 9, // 2x 2x2
        3, 4, // 1x3
        5, 6, // 1x4
        10, // 3x3 (rare)
        15, 16, 17, 18 // big Ls
    ];

    // Total moves per level
    const MOVES_PER_LEVEL = 40;

    const COLORS = [
        '#312e81', // Deep Indigo
        '#581c87', // Deep Purple
        '#831843', // Deep Rose
        '#1e3a8a', // Deep Blue
        '#064e3b', // Deep Green
        '#78350f', // Deep Amber/Brown
        '#7c2d12', // Deep Orange
        '#7f1d1d'  // Deep Red
    ];

     let gameStartTime = null;
let durationSent = false;
let gameStartedFlag = false;

// --- Supabase Config ---
const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;

// --- Session Tracking ---
let sessionId = null;
let sessionRowId = null;

let tutorialShown = false;

// Start session on load
async function initSupabase() {
    if (!window.supabase) {
        setTimeout(initSupabase, 500);
        return;
    }

    if (!supabaseClient) {
        const { createClient } = window.supabase;
        supabaseClient = createClient(supabaseUrl, supabaseKey);
        console.log("✅ Supabase ready");
    }
   

     await startGameSession();
     await markSessionStarted();
}




function generateSessionId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).substr(2, 8)
    );
}

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


function getPlacementId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('utm_content') || 
           urlParams.get('placementid') || 
           "unknown";
}

function sendDurationOnExit(reason) {
    if (gameStartTime && !durationSent && window.trackGameEvent) {
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);
        const placementId = getPlacementId();
        window.trackGameEvent(`game_duration_blockpuzzle_${seconds}_${reason}_${getBrowser()}`, {
            seconds,
            end_reason: reason,
            os: getOS(),
            placement_id: placementId
        });
        // Update session in Supabase
        updateGameSession({
            duration_seconds: seconds,
            bounced: !gameStartedFlag,
            placement_id: placementId,
            end_reason: reason
        });
        durationSent = true;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {


        sendDurationOnExit("background_blockpuzzle");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_blockpuzzle");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        const placementId = getPlacementId();
        window.trackGameEvent(`exit_before_game_blockpuzzle_${osKey}`, {
            os: getOS(),
            placement_id: placementId
        });
        // Update session as bounced
        updateGameSession({
            bounced: true,
            placement_id: placementId,
            end_reason: "exit_before_game"
        });
    }
});

async function getCountry() {
    try {
        // Direct fetch to ipapi.co which is CORS friendly
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        return data.country_name || data.country || "Unknown";
    } catch (error) {
        console.warn("Primary country detection failed, trying fallback...", error);
        try {
            // Fallback to Cloudflare's trace which is extremely reliable
            const cfResp = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
            const cfText = await cfResp.text();
            const locLine = cfText.split("\n").find(line => line.startsWith("loc="));
            return locLine ? locLine.split("=")[1] : "Unknown";
        } catch (e) {
            return "Unknown";
        }
    }
}

// --- Supabase Session Tracking Functions ---
async function startGameSession() {
    if (!supabaseClient) return;
    sessionId = generateSessionId();
    const placementId = getPlacementId();
    const os = getOS();
    const browser = getBrowser();
    const userAgent = navigator.userAgent;
    const gameSlug = "blockpuzzle";
    const country = await getCountry();
    // Country detection can be added if needed
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


    // --- STATE ---
    let grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(null));
    let score = 0;
    let level = 1;
    let movesLeft = MOVES_PER_LEVEL;
    let bestScore = parseInt(localStorage.getItem(BEST_KEY)) || 0;
    let gameState = 'playing'; // playing, levelup, over
    let pieces = []; // 3 pieces currently available
    let draggingPiece = null; // { idx, shape, color, x, y, offsetX, offsetY, startX, startY }
    let lastTime = 0;
    let gridOffset = { x: 0, y: 0, size: 0, cellSize: 0 };
    let pieceSelectorOffset = { x: 0, y: 0, size: 400, cellSize: 0 };

    // --- DOM ---
    const gameCanvas = document.getElementById('game-canvas');
    const pieceCanvas = document.getElementById('piece-canvas');
    const gctx = gameCanvas.getContext('2d');
    const pctx = pieceCanvas.getContext('2d');

    const ui = {
        level: document.getElementById('level-val'),
        moves: document.getElementById('moves-val'),
        score: document.getElementById('score-val'),
        target: document.getElementById('target-val'),
        scoreProgress: document.getElementById('score-progress'),
        lcOverlay: document.getElementById('level-complete'),
        goOverlay: document.getElementById('game-over'),
        lcScoreText: document.getElementById('lc-score-text'),
        goScore: document.getElementById('go-score'),
        goBest: document.getElementById('go-best'),
        goLevelNum: document.getElementById('go-level-num'),
        goTitle: document.getElementById('go-title'),
        restartBtn: document.getElementById('restart-btn'),
        nextLevelBtn: document.getElementById('next-level-btn'),
        promoScroller: document.getElementById('promo-scroller')
    };

    // --- AUDIO ---
    let audioCtx = null;
    function playSfx(freq, type, dur, gainValue = 0.1) {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(gainValue, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + dur);
    }

    const sfx = {
        place: () => playSfx(440, 'sine', 0.1),
        clear: () => playSfx(880, 'sine', 0.3, 0.2),
        error: () => playSfx(220, 'square', 0.2, 0.05),
        levelup: () => {
            playSfx(523, 'sine', 0.2);
            setTimeout(() => playSfx(659, 'sine', 0.2), 100);
            setTimeout(() => playSfx(784, 'sine', 0.4), 200);
        },
        gameover: () => playSfx(110, 'sawtooth', 0.5, 0.1)
    };

    function showTutorial() {
    if (tutorialShown) return;

    const el = document.getElementById('tutorial-popup');
    if (!el) return;

    el.classList.remove('hidden');

    setTimeout(() => {
        el.classList.add('hidden');
    }, 3000);

    tutorialShown = true;
}

    // --- INITIALIZATION ---
    function init() {
        resize();

        showTutorial();

        initSupabase();

        setupInput();
        startGame();
        requestAnimationFrame(gameLoop);

    }

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


    function startGame() {
        grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(null));
        score = 0;
        level = 1;
        movesLeft = MOVES_PER_LEVEL;
        gameState = 'playing';
        generatePieces();
        updateUI();
        ui.lcOverlay.classList.add('hidden');
        ui.goOverlay.classList.add('hidden');
        buildPromoScroller();

         if (!window.DEV_MODE) {
            loadAdsterraBanner();
        }

    }

    function startNextLevel() {
        level++;
        score = 0;
        movesLeft = MOVES_PER_LEVEL;
        grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(null)); // Clear board for new level
        gameState = 'playing';
        generatePieces(); // Generate new pieces for the new level
        updateUI();
        ui.lcOverlay.classList.add('hidden');
        sfx.levelup();
    }

    function generatePieces() {
        pieces = [];
        for (let i = 0; i < 3; i++) {
            const index = Math.floor(Math.random() * EASY_SHAPE_WEIGHTS.length);
            const shapeIdx = EASY_SHAPE_WEIGHTS[index];
            const colorIdx = Math.floor(Math.random() * COLORS.length);
            pieces.push({
                shape: SHAPES[shapeIdx],
                color: COLORS[colorIdx],
                placed: false
            });
        }

        // If no moves left for any piece, reshuffle once
        if (movesLeft > 0 && !canAnyPieceBePlaced()) {
            generatePieces();
        }
    }

    function canAnyPieceBePlaced() {
        return pieces.some(p => {
            if (p.placed) return false;
            return canFitInGrid(p.shape);
        });
    }

    function canFitInGrid(shape) {
        const rows = shape.length;
        const cols = shape[0].length;
        for (let r = 0; r <= GRID_SIZE - rows; r++) {
            for (let c = 0; c <= GRID_SIZE - cols; c++) {
                if (isValidPlacement(shape, r, c)) return true;
            }
        }
        return false;
    }

    function isValidPlacement(shape, row, col) {
        const rows = shape.length;
        const cols = shape[0].length;
        if (row < 0 || col < 0 || row + rows > GRID_SIZE || col + cols > GRID_SIZE) return false;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c] && grid[row + r][col + c]) return false;
            }
        }
        return true;
    }

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = gameCanvas.getBoundingClientRect();
        gameCanvas.width = rect.width * dpr;
        gameCanvas.height = rect.height * dpr;
        gctx.scale(dpr, dpr);

        gridOffset.size = Math.min(rect.width, rect.height);
        gridOffset.cellSize = gridOffset.size / GRID_SIZE;

        const prect = pieceCanvas.getBoundingClientRect();
        pieceCanvas.width = prect.width * dpr;
        pieceCanvas.height = prect.height * dpr;
        pctx.scale(dpr, dpr);

        pieceSelectorOffset.size = prect.width;
        pieceSelectorOffset.cellSize = pieceSelectorOffset.size / 15; // wide enough
    }

    // --- GAME LOGIC ---
    function update(dt) {
        if (gameState !== 'playing') return;

        const targetScore = getTargetScore();
        if (score >= targetScore) {
            score = targetScore; // cap for progress bar
            triggerLevelComplete();
        }
    }

    function getTargetScore() {
        return 300 + (level - 1) * 200;
    }

    function triggerLevelComplete() {
        gameState = 'levelup';
        ui.lcScoreText.textContent = `Target ${getTargetScore()} reached!`;
        ui.lcOverlay.classList.remove('hidden');
        sfx.levelup();
    }

    function triggerGameOver(reason) {
        if (gameState === 'over') return;
        gameState = 'over';
        ui.goTitle.textContent = reason;
        ui.goScore.textContent = score;
        ui.goLevelNum.textContent = level;
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem(BEST_KEY, bestScore);
        }
        ui.goBest.textContent = `BEST: ${bestScore}`;
        ui.goOverlay.classList.remove('hidden');
        sfx.gameover();
    }

    function setupInput() {
        const handleDown = (e) => {
            if (gameState !== 'playing') return;
            const x = e.clientX || (e.touches && e.touches[0].clientX);
            const y = e.clientY || (e.touches && e.touches[0].clientY);

            const prect = pieceCanvas.getBoundingClientRect();
            if (x >= prect.left && x <= prect.right && y >= prect.top && y <= prect.bottom) {
                const rx = x - prect.left;
                const pSlotWidth = prect.width / 3;
                const pieceIdx = Math.floor(rx / pSlotWidth);

                if (pieces[pieceIdx] && !pieces[pieceIdx].placed) {
                    const activePiece = pieces[pieceIdx];
                    const rows = activePiece.shape.length;
                    const cols = activePiece.shape[0].length;

                    draggingPiece = {
                        idx: pieceIdx,
                        shape: activePiece.shape,
                        color: activePiece.color,
                        x: x,
                        y: y,
                        offsetX: (cols * gridOffset.cellSize) / 2, // center it
                        offsetY: (rows * gridOffset.cellSize) * 1.5, // float above finger
                        startX: x,
                        startY: y
                    };
                    playSfx(600, 'sine', 0.05);
                }
            }
        };

        const handleMove = (e) => {
            if (!draggingPiece) return;
            e.preventDefault();
            const x = e.clientX || (e.touches && e.touches[0].clientX);
            const y = e.clientY || (e.touches && e.touches[0].clientY);
            draggingPiece.x = x;
            draggingPiece.y = y;
        };

        const handleUp = (e) => {
            if (!draggingPiece) return;

            const grect = gameCanvas.getBoundingClientRect();
            const x = draggingPiece.x - grect.left - draggingPiece.offsetX;
            const y = draggingPiece.y - grect.top - draggingPiece.offsetY;

            const col = Math.round(x / gridOffset.cellSize);
            const row = Math.round(y / gridOffset.cellSize);

            if (isValidPlacement(draggingPiece.shape, row, col)) {
                placePiece(draggingPiece.idx, row, col);
                sfx.place();
            } else {
                sfx.error();
            }

            draggingPiece = null;
        };

        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchstart', handleDown, { passive: false });
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);
        window.addEventListener('resize', resize);
    }

    function placePiece(idx, row, col) {
        const piece = pieces[idx];
        const rows = piece.shape.length;
        const cols = piece.shape[0].length;

        let blocksPlaced = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (piece.shape[r][c]) {
                    grid[row + r][col + c] = piece.color;
                    blocksPlaced++;
                }
            }
        }

        piece.placed = true;
        score += blocksPlaced * 10;
        movesLeft--;

        checkLineClears();

        const targetScore = getTargetScore();
        if (score >= targetScore) {
            triggerLevelComplete();
            return;
        }

        if (movesLeft <= 0) {
            triggerGameOver("OUT OF MOVES!");
            return;
        }

        if (pieces.every(p => p.placed)) {
            generatePieces();
        } else if (!canAnyAvailablePieceBePlaced()) {
            triggerGameOver("NO MORE MOVES!");
        }

        updateUI();
    }

    function canAnyAvailablePieceBePlaced() {
        return pieces.some(p => !p.placed && canFitInGrid(p.shape));
    }

    function checkLineClears() {
        let rowsToClear = [];
        let colsToClear = [];

        // Rows
        for (let r = 0; r < GRID_SIZE; r++) {
            if (grid[r].every(cell => cell !== null)) rowsToClear.push(r);
        }

        // Cols
        for (let c = 0; c < GRID_SIZE; c++) {
            let full = true;
            for (let r = 0; r < GRID_SIZE; r++) {
                if (grid[r][c] === null) {
                    full = false;
                    break;
                }
            }
            if (full) colsToClear.push(c);
        }

        if (rowsToClear.length > 0 || colsToClear.length > 0) {
            // Apply score
            const count = rowsToClear.length + colsToClear.length;
            score += count * 100 * count; // bonus for combos

            // Clear rows
            rowsToClear.forEach(r => {
                for (let c = 0; c < GRID_SIZE; c++) grid[r][c] = null;
            });

            // Clear cols
            colsToClear.forEach(c => {
                for (let r = 0; r < GRID_SIZE; r++) grid[r][c] = null;
            });

            sfx.clear();
        }
    }

    // --- RENDERING ---
    function draw() {
        gctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

// Background gradient
const gradient = gctx.createLinearGradient(0, 0, 0, gameCanvas.height);
gradient.addColorStop(0, '#0f172a');   // Dark slate
gradient.addColorStop(1, '#020617');   // Deep night
gctx.fillStyle = gradient;
gctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

        pctx.clearRect(0, 0, pieceCanvas.width, pieceCanvas.height);

        drawGrid();
        drawActivePiece(); // The one being dragged
        drawPieceSelector();
    }

    function drawGrid() {
        const cs = gridOffset.cellSize;
        const padding = 2;

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const x = c * cs;
                const y = r * cs;

                // Base cell
               // Glass-style cell
gctx.fillStyle = 'rgba(255,255,255,0.05)';
gctx.strokeStyle = 'rgba(255,255,255,0.08)';
gctx.lineWidth = 1;

drawRoundedRect(gctx, x + padding, y + padding, cs - padding * 2, cs - padding * 2, 6);
gctx.fill();
gctx.stroke();

                if (grid[r][c]) {
                    drawBlock(gctx, x, y, cs, grid[r][c]);
                }
            }
        }

        // Drop preview (Ghost)
        if (draggingPiece) {
            const grect = gameCanvas.getBoundingClientRect();
            const px = draggingPiece.x - grect.left - draggingPiece.offsetX;
            const py = draggingPiece.y - grect.top - draggingPiece.offsetY;

            const col = Math.round(px / cs);
            const row = Math.round(py / cs);

            if (row >= 0 && col >= 0 && row + draggingPiece.shape.length <= GRID_SIZE && col + draggingPiece.shape[0].length <= GRID_SIZE) {
                const isValid = isValidPlacement(draggingPiece.shape, row, col);
                gctx.save();
                // gctx.globalAlpha = 0.3;
                // gctx.fillStyle = isValid ? '#fff' : '#ef4444';
                gctx.globalAlpha = 0.35;
gctx.fillStyle = isValid ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)';

                for (let r = 0; r < draggingPiece.shape.length; r++) {
                    for (let c = 0; c < draggingPiece.shape[0].length; c++) {
                        if (draggingPiece.shape[r][c]) {
                            drawRoundedRect(gctx, (col + c) * cs + padding, (row + r) * cs + padding, cs - padding * 2, cs - padding * 2, 4);
                        }
                    }
                }
                gctx.restore();
            }
        }
    }

    function drawPieceSelector() {

        // Piece panel background
pctx.fillStyle = 'rgba(255,255,255,0.04)';
pctx.fillRect(0, 0, pieceCanvas.width, pieceCanvas.height);

const slotWidth = pieceCanvas.width / 3;
pctx.strokeStyle = 'rgba(255,255,255,0.08)';
pctx.lineWidth = 1;

for (let i = 1; i < 3; i++) {
    pctx.beginPath();
    pctx.moveTo(i * slotWidth, 10);
    pctx.lineTo(i * slotWidth, pieceCanvas.height - 10);
    pctx.stroke();
}


        const rect = pieceCanvas.getBoundingClientRect();
        const pSlotWidth = rect.width / 3;
        const maxPieceSize = pSlotWidth * 0.7;

        pieces.forEach((p, i) => {
            if (p.placed) return;

            const centerX = i * pSlotWidth + pSlotWidth / 2;
            const centerY = rect.height / 2;

            const rows = p.shape.length;
            const cols = p.shape[0].length;
            const blockSize = Math.min(maxPieceSize / rows, maxPieceSize / cols, 25);

            const startX = centerX - (cols * blockSize) / 2;
            const startY = centerY - (rows * blockSize) / 2;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (p.shape[r][c]) {
                        drawBlock(pctx, startX + c * blockSize, startY + r * blockSize, blockSize, p.color);
                    }
                }
            }
        });
    }

    function drawActivePiece() {
        if (!draggingPiece) return;

        const grect = gameCanvas.getBoundingClientRect();
        const startX = draggingPiece.x - grect.left - draggingPiece.offsetX;
        const startY = draggingPiece.y - grect.top - draggingPiece.offsetY;
        const cs = gridOffset.cellSize;

        for (let r = 0; r < draggingPiece.shape.length; r++) {
            for (let c = 0; c < draggingPiece.shape[0].length; c++) {
                if (draggingPiece.shape[r][c]) {
                    drawBlock(gctx, startX + c * cs, startY + r * cs, cs, draggingPiece.color);
                }
            }
        }
    }

    function drawBlock(ctx, x, y, size, color) {
    const padding = 3;
    const r = 8;

    const innerX = x + padding;
    const innerY = y + padding;
    const innerSize = size - padding * 2;

    ctx.save();

    // Soft shadow for depth
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // Base block
    ctx.fillStyle = color;
    drawRoundedRect(ctx, innerX, innerY, innerSize, innerSize, r);
    ctx.fill();

    ctx.restore();

    // Gloss highlight
    const grad = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerSize);
    grad.addColorStop(0, 'rgba(255,255,255,0.5)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.15)');
    grad.addColorStop(1, 'rgba(0,0,0,0.2)');

    ctx.fillStyle = grad;
    drawRoundedRect(ctx, innerX, innerY, innerSize, innerSize, r);
    ctx.fill();

    // Subtle inner glow
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, innerX + 1, innerY + 1, innerSize - 2, innerSize - 2, r - 1);
    ctx.stroke();
}

    function drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    // --- UI HELPERS ---
    function updateUI() {
        ui.level.textContent = level;
        ui.moves.textContent = movesLeft;
        ui.score.textContent = score;

        if (movesLeft < 10) {
            ui.moves.className = 'value red';
        } else if (movesLeft < 20) {
            ui.moves.className = 'value yellow';
        } else {
            ui.moves.className = 'value green';
        }

        const target = getTargetScore();
        ui.target.textContent = `TARGET: ${target}`;
        ui.scoreProgress.style.width = `${Math.min(100, (score / target) * 100)}%`;
    }

    function buildPromoScroller() {
        const games = [
            { name: 'Word Search', emoji: '🔍', href: '../WordSearch/index.html' },
            { name: 'Flow Connect', emoji: '🌈', href: '../FlowConnect/game.html' },
            { name: 'Merge Numbers', emoji: '🔢', href: '../MergeNumbers/game.html' },
            { name: 'Stack 3D', emoji: '🧊', href: '../Stack3D/index.html' },
            { name: 'Brick Breaker', emoji: '💥', href: '../BrickBreaker/game.html' }
        ];

        ui.promoScroller.innerHTML = games.map(g => `
            <a href="${g.href}" class="promo-card" style="min-width: 100px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; text-decoration: none; color: #fff; text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 5px;">${g.emoji}</div>
                <div style="font-size: 0.7rem; font-weight: bold; opacity: 0.8;">${g.name}</div>
            </a>
        `).join('');
    }

    // --- LOOP ---
    function gameLoop(time) {
        const dt = (time - lastTime) / 1000;
        lastTime = time;

        if (dt < 0.2) { // avoid large spikes
            update(dt);
        }
        draw();
        requestAnimationFrame(gameLoop);
    }

    // --- EVENTS ---
    ui.restartBtn.addEventListener('click', startGame);
    ui.nextLevelBtn.addEventListener('click', startNextLevel);

    init();
})();
