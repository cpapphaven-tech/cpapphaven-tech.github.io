const COLORS = ['red', 'green', 'yellow', 'blue'];
const SAFE_SPOTS = [
    { r: 2, c: 6 }, { r: 6, c: 12 }, { r: 12, c: 8 }, { r: 8, c: 2 },  // Stars
    { r: 6, c: 1 }, { r: 1, c: 8 }, { r: 8, c: 13 }, { r: 13, c: 6 }  // Starts
];

const state = {
    players: [],
    turnIndex: 0,
    diceValue: 0,
    waitingForMove: false,
    rolling: false,
    animating: false,
    gameMode: 2,
    gameOver: false
};

const UI = {
    board: document.getElementById('ludo-board'),
    diceBtn: document.getElementById('dice-btn'),
    message: document.getElementById('message-area'),
    turnDisplay: document.getElementById('turn-display'),
    startScreen: document.getElementById('start-screen'),
    winScreen: document.getElementById('level-complete-screen'),
};

// --- Geometry ---

const mainPath = [
    { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
    { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
    { r: 0, c: 7 }, { r: 0, c: 8 },
    { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
    { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
    { r: 7, c: 14 }, { r: 8, c: 14 },
    { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
    { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
    { r: 14, c: 7 }, { r: 14, c: 6 },
    { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
    { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
    { r: 7, c: 0 }
];

const homeRuns = {
    red: [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }],
    green: [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }],
    yellow: [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }],
    blue: [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }]
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

        window.trackGameEvent(`game_duration_ludo_${seconds}_${reason}_${getBrowser()}`, {
            seconds,
            end_reason: reason,
            os: getOS()
        });

        durationSent = true;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {


        sendDurationOnExit("background_ludo");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_ludo");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        window.trackGameEvent(`exit_before_game_ludo_${osKey}`, {
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



    }, 2000);
}

// --- Initialization ---

function init() {
    renderBoard();

    document.getElementById('mode-2p').addEventListener('click', () => startGame(2));
    document.getElementById('mode-4p').addEventListener('click', () => startGame(4));
    UI.diceBtn.addEventListener('click', rollDice);
    document.getElementById('restart-btn').addEventListener('click', () => location.reload());

    if (!window.DEV_MODE) {
          loadAdsterraBanner();
    }

    gameStartTime = Date.now();   // ⏱ start timer
    durationSent = false;
}

function startGame(mode) {
    state.gameMode = mode;
    state.players = [];

    state.players.push({ color: 'red', type: 'human', tokens: [-1, -1, -1, -1], baseRow: 0, baseCol: 0, startIdx: 0 });
    if (mode === 4) state.players.push({ color: 'green', type: 'cpu', tokens: [-1, -1, -1, -1], baseRow: 0, baseCol: 9, startIdx: 13 });
    state.players.push({ color: 'yellow', type: 'cpu', tokens: [-1, -1, -1, -1], baseRow: 9, baseCol: 9, startIdx: 26 });
    if (mode === 4) state.players.push({ color: 'blue', type: 'cpu', tokens: [-1, -1, -1, -1], baseRow: 9, baseCol: 0, startIdx: 39 });

    UI.startScreen.classList.add('hidden');
    drawTokens();
    startTurn(0);
}

// --- Board Rendering ---

function renderBoard() {
    UI.board.innerHTML = '';

    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            // Check if covered by Base (6x6)
            const isBaseArea = (r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8);
            const isCenterArea = (r >= 6 && r <= 8 && c >= 6 && c <= 8);

            if (isBaseArea) {
                // Only create ONE cell for the top-left of each base
                if (r === 0 && c === 0) createBaseEl('red');
                else if (r === 0 && c === 9) createBaseEl('green');
                else if (r === 9 && c === 0) createBaseEl('blue');
                else if (r === 9 && c === 9) createBaseEl('yellow');
                continue;
            }

            if (isCenterArea) {
                // Only create ONE cell for the center home
                if (r === 6 && c === 6) createCenterEl();
                continue;
            }

            // Create Path Cell
            const cell = document.createElement('div');
            cell.className = 'cell';

            // Coloring Home Runs
            if (r === 7 && c > 0 && c < 6) cell.classList.add('path-red');
            if (c === 7 && r > 0 && r < 6) cell.classList.add('path-green');
            if (r === 7 && c > 8 && c < 14) cell.classList.add('path-yellow');
            if (c === 7 && r > 8 && r < 14) cell.classList.add('path-blue');

            // Set Start Colors (Instead of Stars)
            if (r === 6 && c === 1) cell.classList.add('path-red');
            if (r === 1 && c === 8) cell.classList.add('path-green');
            if (r === 8 && c === 13) cell.classList.add('path-yellow');
            if (r === 13 && c === 6) cell.classList.add('path-blue');

            // Safe Spots (Stars) - Only for stars not on starts
            const isStartPos = (r === 6 && c === 1) || (r === 1 && c === 8) || (r === 8 && c === 13) || (r === 13 && c === 6);
            if (SAFE_SPOTS.some(s => s.r === r && s.c === c) && !isStartPos) {
                cell.classList.add('safe-spot');
            }

            // Arrows
            if (r === 6 && c === 0) cell.classList.add('start-arrow', 'arrow-right');
            if (r === 0 && c === 8) cell.classList.add('start-arrow', 'arrow-down');
            if (r === 8 && c === 14) cell.classList.add('start-arrow', 'arrow-left');
            if (r === 14 && c === 6) cell.classList.add('start-arrow', 'arrow-up');

            UI.board.appendChild(cell);
        }
    }
}

function createBaseEl(color) {
    const base = document.createElement('div');
    base.className = `base base-${color}`;
    const inner = document.createElement('div');
    inner.className = 'base-inner';
    for (let i = 0; i < 4; i++) {
        const circle = document.createElement('div');
        circle.className = 'base-circle';
        inner.appendChild(circle);
    }
    base.appendChild(inner);
    UI.board.appendChild(base);
}

function createCenterEl() {
    const center = document.createElement('div');
    center.className = 'center-home';
    const tris = ['left', 'top', 'right', 'bottom'];
    tris.forEach(side => {
        const tri = document.createElement('div');
        tri.className = `triangle tri-${side}`;
        center.appendChild(tri);
    });
    UI.board.appendChild(center);
}

function drawTokens() {
    document.querySelectorAll('.token').forEach(t => t.remove());

    state.players.forEach((p, pIdx) => {
        p.tokens.forEach((step, tIdx) => {
            const token = document.createElement('div');
            token.className = `token token-${p.color}`;
            token.dataset.player = pIdx;
            token.dataset.token = tIdx;

            const pos = getCoordinates(p, step, tIdx);
            const cellSize = 100 / 15;

            // Align the bottom tip of the pin to the center of the cell
            token.style.left = `calc(${pos.c * cellSize}% + ${cellSize / 2}% - 16px)`;
            token.style.top = `calc(${pos.r * cellSize}% + ${cellSize / 2}% - 40px)`;

            token.onclick = () => handleTokenClick(pIdx, tIdx);
            UI.board.appendChild(token);
        });
    });
}

function getCoordinates(player, step, tokenIndex) {
    if (step === -1) {
        const br = player.baseRow;
        const bc = player.baseCol;
        const offsets = [{ r: 1, c: 1 }, { r: 1, c: 4 }, { r: 4, c: 1 }, { r: 4, c: 4 }];
        return { r: br + offsets[tokenIndex].r, c: bc + offsets[tokenIndex].c };
    }
    if (step === 99) return { r: 7, c: 7 };
    if (step < 51) {
        return mainPath[(player.startIdx + step) % 52];
    } else {
        const hr = homeRuns[player.color];
        const idx = step - 51;
        if (idx < hr.length) return hr[idx];
        return { r: 7, c: 7 };
    }
}

// --- Interaction ---

function rollDice() {
    if (state.rolling || state.waitingForMove || state.animating) return;
    const p = state.players[state.turnIndex];

    state.rolling = true;
    UI.diceBtn.classList.add('rolling');
    UI.diceBtn.textContent = '🎲';

    setTimeout(() => {
        UI.diceBtn.classList.remove('rolling');
        const val = Math.floor(Math.random() * 6) + 1;
        state.diceValue = val;
        UI.diceBtn.textContent = val;
        state.rolling = false;
        checkMoves();
    }, 600);
}

function checkMoves() {
    const p = state.players[state.turnIndex];
    const val = state.diceValue;
    const moves = [];

    p.tokens.forEach((s, i) => {
        if (s === -1 && val === 6) moves.push(i);
        else if (s !== -1 && s !== 99 && s + val <= 56) moves.push(i);
    });

    if (moves.length === 0) {
        updateMessage("No Moves!", 1000, nextTurn);
    } else if (moves.length === 1) {
        // Auto-move if only one option exists (Speed up)
        state.waitingForMove = true; // Briefly block other inputs
        setTimeout(() => moveToken(p, moves[0]), 500);
    } else {
        state.waitingForMove = true;
        updateMessage("Move Token");
        document.querySelectorAll(`.token-${p.color}`).forEach(el => {
            const i = parseInt(el.dataset.token);
            if (moves.includes(i)) el.classList.add('can-move');
        });
        if (p.type === 'cpu') setTimeout(() => aiDecide(moves), 800);
    }
}

function handleTokenClick(pIdx, tIdx) {
    if (!state.waitingForMove || state.turnIndex !== pIdx) return;
    const p = state.players[pIdx];
    const s = p.tokens[tIdx];
    const val = state.diceValue;
    if ((s === -1 && val === 6) || (s !== -1 && s !== 99 && s + val <= 56)) {
        moveToken(p, tIdx);
    }
}

async function moveToken(p, tIndex) {
    state.waitingForMove = false;
    state.animating = true;
    document.querySelectorAll('.can-move').forEach(el => el.classList.remove('can-move'));

    let currentStep = p.tokens[tIndex];
    const diceVal = state.diceValue;
    const stepsToMove = (currentStep === -1) ? 1 : diceVal;

    // Step-by-Step Animation: Move token one cell at a time with smooth animation
    for (let i = 0; i < stepsToMove; i++) {
        if (p.tokens[tIndex] === -1) {
            p.tokens[tIndex] = 0;
        } else {
            p.tokens[tIndex]++;
        }

        drawTokens();
        // Wait for animation to complete (matches CSS transition time)
        // Increased from 250ms to 600ms to show smooth gliding animation
        await new Promise(resolve => setTimeout(resolve, 250));

        // If reached exact home goal
        if (p.tokens[tIndex] === 56) {
            p.tokens[tIndex] = 99;
            break;
        }
    }

    const targetStep = p.tokens[tIndex];

    // Collision Check (After full move)
    if (targetStep < 51 && targetStep !== -1 && targetStep !== 99 && targetStep !== 0) {
        const globalPos = (p.startIdx + targetStep) % 52;
        // Check if globalPos is a safe spot Star
        const isSafeStar = SAFE_SPOTS.some(s => {
            const posIdx = mainPath.findIndex(mp => mp.r === s.r && mp.c === s.c);
            return posIdx === globalPos;
        });

        if (!isSafeStar) {
            killOpponents(p, globalPos);
        }
    }

    drawTokens();
    state.animating = false;

    if (state.diceValue === 6 || targetStep === 99) {
        updateMessage("Bonus Roll", 800, () => {
            UI.diceBtn.textContent = '🎲';
            if (p.type === 'cpu') setTimeout(rollDice, 500);
        });
    } else {
        setTimeout(nextTurn, 800);
    }
}

function killOpponents(activePlayer, pos) {
    state.players.forEach(p => {
        if (p === activePlayer) return;
        p.tokens.forEach((s, i) => {
            if (s !== -1 && s < 51) {
                if ((p.startIdx + s) % 52 === pos) {
                    p.tokens[i] = -1;
                    updateMessage("Captured!");
                }
            }
        });
    });
}

function aiDecide(moves) {
    const p = state.players[state.turnIndex];
    const moveOut = moves.find(m => p.tokens[m] === -1);
    const m = moveOut !== undefined ? moveOut : moves[Math.floor(Math.random() * moves.length)];
    setTimeout(() => moveToken(p, m), 500);
}

function nextTurn() {
    if (checkWin()) return;
    state.turnIndex = (state.turnIndex + 1) % state.players.length;
    startTurn(state.turnIndex);
}

function startTurn(idx) {
    const p = state.players[idx];
    UI.turnDisplay.textContent = `TURN: ${p.color.toUpperCase()}`;
    UI.turnDisplay.style.color = `var(--ludo-${p.color})`;
    UI.diceBtn.textContent = '🎲';

    // Add color class to dice
    UI.diceBtn.classList.remove('red-turn', 'green-turn', 'yellow-turn', 'blue-turn');
    UI.diceBtn.classList.add(`${p.color}-turn`);

    // Change message based on player type
    const message = p.type === 'human' ? "Roll Dice" : `${p.color.toUpperCase()} Turn`;

    updateMessage(message);

    // ✅ Force message color to white
    UI.message.style.color = "#ffffff";

    if (p.type === 'cpu') setTimeout(rollDice, 1000);
}

function updateMessage(txt, delay, cb) {
    UI.message.textContent = txt;
    if (delay) setTimeout(cb, delay);
}

function checkWin() {
    const p = state.players[state.turnIndex];
    if (p.tokens.every(t => t === 99)) {
        document.getElementById('winner-text').textContent = `${p.color.toUpperCase()} WINS!`;
        UI.winScreen.classList.remove('hidden');
        return true;
    }
    return false;
}

init();
