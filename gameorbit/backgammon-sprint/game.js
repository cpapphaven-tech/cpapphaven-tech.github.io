// ============================================================
//  BACKGAMMON — Fixed Game Engine
//  Bugs fixed:
//   1. ctx.scale() accumulation on resize → use setTransform
//   2. No touch events → added touchstart on canvas
//   3. No point-number labels on board
//   4. showMenu() left stale isRolling/isAnimating flags
//   5. AI could double-schedule via pending flag
//   6. Canvas size = 0 on first init → guard + defer draw
//   7. Turn-switch message not updated
//   8. Bear-off tray click zone was too narrow
//   9. 'bar' clickTarget returned no idx → move destination check broken
//  10. Missing "no moves" skip message for human player
// ============================================================

// --- State ---
const STATE = {
    gameMode: 'vsAi',
    currentPlayer: 'white',
    points: Array.from({ length: 24 }, () => ({ count: 0, color: null })),
    bar: { white: 0, dark: 0 },
    borneOff: { white: 0, dark: 0 },
    dice: [],
    unusedMoves: [],
    selectedPoint: null,
    validDestinations: [],
    isRolling: false,
    isAnimating: false,
    gameOver: false,
    aiPending: false,          // Bug #5 guard
    gameRecordTime: null,
    gameStartTime: null,
    durationSent: false,
    diceAnimFrames: 0,
    diceAnimValues: [1, 1],
    dicePositions: [{ x: 0, y: 0 }, { x: 0, y: 0 }]
};

// Standard Backgammon starting position
// White moves: index 23→0 (high to low). Home board: indices 0-5.
// Dark  moves: index 0→23 (low to high). Home board: indices 18-23.
function resetBoardState() {
    STATE.points = Array.from({ length: 24 }, () => ({ count: 0, color: null }));

    // White setup (moves 23→0)
    STATE.points[23] = { count: 2, color: 'white' };
    STATE.points[12] = { count: 5, color: 'white' };
    STATE.points[7]  = { count: 3, color: 'white' };
    STATE.points[5]  = { count: 5, color: 'white' };

    // Dark setup (moves 0→23)
    STATE.points[0]  = { count: 2, color: 'dark' };
    STATE.points[11] = { count: 5, color: 'dark' };
    STATE.points[16] = { count: 3, color: 'dark' };
    STATE.points[18] = { count: 5, color: 'dark' };

    STATE.bar        = { white: 0, dark: 0 };
    STATE.borneOff   = { white: 0, dark: 0 };
    STATE.dice       = [];
    STATE.unusedMoves = [];
    STATE.selectedPoint = null;
    STATE.validDestinations = [];
    STATE.isRolling  = false;
    STATE.isAnimating = false;
    STATE.gameOver   = false;
    STATE.aiPending  = false;
}

// --- UI refs ---
const UI = {
    modeScreen:     document.getElementById('modeScreen'),
    gameScreen:     document.getElementById('gameScreen'),
    gameOverOverlay:document.getElementById('gameOverOverlay'),
    vsAiBtn:        document.getElementById('vsAiBtn'),
    vsFriendBtn:    document.getElementById('vsFriendBtn'),
    changeModeBtn:  document.getElementById('changeModeBtn'),
    rollBtn:        document.getElementById('rollBtn'),
    playAgainBtn:   document.getElementById('playAgainBtn'),
    turnLabel:      document.getElementById('turnLabel'),
    modeBadge:      document.getElementById('modeBadge'),
    gameMessage:    document.getElementById('gameMessage'),
    p1OutVal:       document.getElementById('p1OutVal'),
    p2OutVal:       document.getElementById('p2OutVal'),
    p2NameVal:      document.getElementById('p2NameVal'),
    p2Avatar:       document.getElementById('p2Avatar'),
    player1Panel:   document.getElementById('player1Panel'),
    player2Panel:   document.getElementById('player2Panel'),
    canvas:         document.getElementById('boardCanvas'),
    winTitle:       document.getElementById('gameOverTitle'),
    winMsg:         document.getElementById('gameOverMessage'),
    winIcon:        document.getElementById('gameOverIcon')
};

let ctx = UI.canvas.getContext('2d');
let audioCtx = null;

// --- Supabase ---
const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;
let sessionId = null;

// ============================================================
//  INIT
// ============================================================
function init() {
    // Bug #6: canvas may be 0×0 on first paint; use ResizeObserver for reliable sizing
    resizeCanvas();

    // Resize observer – more reliable than window resize on mobile
    if (window.ResizeObserver) {
        new ResizeObserver(() => { resizeCanvas(); if (!UI.gameScreen.classList.contains('hidden')) drawBoard(); }).observe(UI.canvas);
    } else {
        window.addEventListener('resize', () => { resizeCanvas(); if (!UI.gameScreen.classList.contains('hidden')) drawBoard(); });
    }

    UI.vsAiBtn.addEventListener('click',       () => startGame('vsAi'));
    UI.vsFriendBtn.addEventListener('click',   () => startGame('vsFriend'));
    UI.changeModeBtn.addEventListener('click', showMenu);
    UI.rollBtn.addEventListener('click',       () => triggerRoll());
    UI.playAgainBtn.addEventListener('click',  restartGame);

    // Bug #2: Touch support for mobile
    UI.canvas.addEventListener('click',      handleBoardClick);
    UI.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        handleBoardClick({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: false });

    STATE.gameStartTime  = Date.now();
    STATE.gameRecordTime = Date.now();
    initSupabase();
}

// Bug #1: Use setTransform instead of scale() to prevent accumulation on every resize
function resizeCanvas() {
    const dpr  = window.devicePixelRatio || 1;
    const rect = UI.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return; // Bug #6: skip if not laid out
    UI.canvas.width  = rect.width  * dpr;
    UI.canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // replaces ctx.scale(); no accumulation
}

// ============================================================
//  RULE ENGINE
// ============================================================

// All of a color's checkers inside their home board?
function isHomeBoardReady(color) {
    if (color === 'white') {
        if (STATE.bar.white > 0) return false;
        for (let i = 6; i < 24; i++) {
            if (STATE.points[i].color === 'white' && STATE.points[i].count > 0) return false;
        }
        return true;
    } else {
        if (STATE.bar.dark > 0) return false;
        for (let i = 0; i < 18; i++) {
            if (STATE.points[i].color === 'dark' && STATE.points[i].count > 0) return false;
        }
        return true;
    }
}

function getValidMoves(startIdx, color) {
    if (STATE.gameOver || STATE.isRolling || STATE.isAnimating) return [];
    if (STATE.unusedMoves.length === 0) return [];
    if (color === 'white' && STATE.bar.white > 0 && startIdx !== 'bar') return [];
    if (color === 'dark'  && STATE.bar.dark  > 0 && startIdx !== 'bar') return [];

    const destinations = new Set();
    const homeReady    = isHomeBoardReady(color);
    const uniqueMoves  = [...new Set(STATE.unusedMoves)];

    uniqueMoves.forEach(step => {
        if (color === 'white') {
            const dest = (startIdx === 'bar') ? (24 - step) : (startIdx - step);

            if (dest >= 0) {
                const pt = STATE.points[dest];
                if (!pt.color || pt.color === 'white' || pt.count <= 1) destinations.add(dest);
            } else if (homeReady) {
                // Bear-off: exact roll
                if (startIdx === step - 1) {
                    destinations.add('off');
                } else if (startIdx < step - 1) {
                    // Over-roll only if no white checker sits on a higher home-board point
                    let blocked = false;
                    for (let i = startIdx + 1; i < 6; i++) {
                        if (STATE.points[i].color === 'white' && STATE.points[i].count > 0) { blocked = true; break; }
                    }
                    if (!blocked) destinations.add('off');
                }
            }
        } else {
            const dest = (startIdx === 'bar') ? (step - 1) : (startIdx + step);

            if (dest <= 23) {
                const pt = STATE.points[dest];
                if (!pt.color || pt.color === 'dark' || pt.count <= 1) destinations.add(dest);
            } else if (homeReady) {
                const stepsLeft = 24 - startIdx;
                if (stepsLeft === step) {
                    destinations.add('off');
                } else if (stepsLeft < step) {
                    let blocked = false;
                    for (let i = 18; i < startIdx; i++) {
                        if (STATE.points[i].color === 'dark' && STATE.points[i].count > 0) { blocked = true; break; }
                    }
                    if (!blocked) destinations.add('off');
                }
            }
        }
    });

    return [...destinations];
}

function hasAnyValidMoves(color) {
    if (color === 'white' && STATE.bar.white > 0) return getValidMoves('bar', 'white').length > 0;
    if (color === 'dark'  && STATE.bar.dark  > 0) return getValidMoves('bar', 'dark').length  > 0;
    for (let i = 0; i < 24; i++) {
        const pt = STATE.points[i];
        if (pt.color === color && pt.count > 0 && getValidMoves(i, color).length > 0) return true;
    }
    return false;
}

// ============================================================
//  EXECUTE MOVE
// ============================================================
function executeMove(startIdx, endIdx, color) {
    if (STATE.gameOver) return;

    // Remove from origin
    if (startIdx === 'bar') {
        if (color === 'white') STATE.bar.white--;
        else                   STATE.bar.dark--;
    } else {
        const pt = STATE.points[startIdx];
        pt.count--;
        if (pt.count === 0) pt.color = null;
    }

    // Determine which die value was consumed
    let stepUsed = 0;
    if (color === 'white') {
        if      (startIdx === 'bar') stepUsed = 24 - endIdx;
        else if (endIdx   === 'off') stepUsed = startIdx + 1;
        else                         stepUsed = startIdx - endIdx;
    } else {
        if      (startIdx === 'bar') stepUsed = endIdx + 1;
        else if (endIdx   === 'off') stepUsed = 24 - startIdx;
        else                         stepUsed = endIdx - startIdx;
    }

    let moveIdx = STATE.unusedMoves.indexOf(stepUsed);
    if (moveIdx === -1 && endIdx === 'off') {
        // Over-roll: use smallest die >= stepUsed
        let bestVal = Infinity, bestIdx = -1;
        STATE.unusedMoves.forEach((val, i) => {
            if (val >= stepUsed && val < bestVal) { bestVal = val; bestIdx = i; }
        });
        if (bestIdx !== -1) moveIdx = bestIdx;
    }
    if (moveIdx !== -1) STATE.unusedMoves.splice(moveIdx, 1);

    // Place at destination
    if (endIdx === 'off') {
        if (color === 'white') STATE.borneOff.white++;
        else                   STATE.borneOff.dark++;
        playSound('bear');
    } else {
        const pt = STATE.points[endIdx];
        if (pt.color && pt.color !== color) {
            // Hit blot
            if (pt.color === 'white') STATE.bar.white++;
            else                      STATE.bar.dark++;
            playSound('hit');
            pt.count = 1;
            pt.color = color;
        } else {
            pt.color = color;
            pt.count++;
            playSound('click');
        }
    }

    // Win?
    if (STATE.borneOff.white === 15 || STATE.borneOff.dark === 15) {
        endGame();
        return;
    }

    UI.p1OutVal.textContent = STATE.borneOff.white;
    UI.p2OutVal.textContent = STATE.borneOff.dark;

    STATE.selectedPoint     = null;
    STATE.validDestinations = [];

    checkTurnProgress();
}

// ============================================================
//  TURN MANAGEMENT
// ============================================================
function checkTurnProgress() {
    drawBoard();
    updateHUD();
    if (STATE.gameOver) return;

    const noMoves = STATE.unusedMoves.length === 0 || !hasAnyValidMoves(STATE.currentPlayer);

    if (noMoves) {
        // Bug #10: inform human player when their moves are skipped
        if (STATE.unusedMoves.length > 0 && STATE.currentPlayer === 'white' && STATE.gameMode === 'vsAi') {
            UI.gameMessage.textContent = "No valid moves — turn passed!";
        }

        STATE.currentPlayer     = STATE.currentPlayer === 'white' ? 'dark' : 'white';
        STATE.unusedMoves       = [];
        STATE.dice              = [];
        STATE.selectedPoint     = null;
        STATE.validDestinations = [];

        updateHUD();
        drawBoard();

        // Bug #7: show roll prompt when turn switches
        if (!(STATE.gameMode === 'vsAi' && STATE.currentPlayer === 'dark')) {
            const who = STATE.currentPlayer === 'white' ? "White" : "Dark (Player 2)";
            UI.gameMessage.textContent = `${who}'s turn — roll the dice!`;
        }

        if (STATE.gameMode === 'vsAi' && STATE.currentPlayer === 'dark') {
            scheduleAiTurn(1000);
        }
    } else {
        if (STATE.gameMode === 'vsAi' && STATE.currentPlayer === 'dark') {
            scheduleAiTurn(750);
        }
    }
}

// Bug #5: AI scheduling guard — prevents stacking multiple AI timeouts
function scheduleAiTurn(delay) {
    if (STATE.aiPending) return;
    STATE.aiPending = true;
    setTimeout(() => {
        STATE.aiPending = false;
        triggerAiTurn();
    }, delay);
}

// ============================================================
//  AI ENGINE
// ============================================================
function triggerAiTurn() {
    if (STATE.gameOver || STATE.currentPlayer !== 'dark') return;

    if (STATE.dice.length === 0) {
        triggerRoll();
        return;
    }

    const color       = 'dark';
    const activeMoves = [];

    if (STATE.bar.dark > 0) {
        getValidMoves('bar', color).forEach(dest => activeMoves.push({ start: 'bar', end: dest }));
    } else {
        for (let i = 0; i < 24; i++) {
            if (STATE.points[i].color === color && STATE.points[i].count > 0) {
                getValidMoves(i, color).forEach(dest => activeMoves.push({ start: i, end: dest }));
            }
        }
    }

    if (activeMoves.length === 0) {
        STATE.unusedMoves = [];
        checkTurnProgress();
        return;
    }

    let bestMove = null, bestScore = -Infinity;

    activeMoves.forEach(mv => {
        let score = 0;
        if (mv.end === 'off') {
            score += 100;
        } else {
            const dp = STATE.points[mv.end];
            if (dp.color === 'white' && dp.count === 1) score += 85; // hit blot
            if (dp.color === 'dark'  && dp.count >  0)  score += 30; // make point
            if (!dp.color) {
                // Penalty: leaving an exposed blot
                for (let step = 1; step <= 6; step++) {
                    const tp = mv.end + step;
                    if (tp <= 23 && STATE.points[tp].color === 'white' && STATE.points[tp].count > 0) {
                        score -= 25; break;
                    }
                }
            }
            // Escape from deep anchor
            if (mv.start !== 'bar' && mv.start < 6) score += (6 - mv.start) * 2;
        }
        score += Math.random() * 3;
        if (score > bestScore) { bestScore = score; bestMove = mv; }
    });

    if (bestMove) {
        STATE.isAnimating       = true;
        STATE.selectedPoint     = bestMove.start;
        STATE.validDestinations = [bestMove.end];
        drawBoard();
        setTimeout(() => {
            STATE.isAnimating = false;
            executeMove(bestMove.start, bestMove.end, 'dark');
        }, 600);
    }
}

// ============================================================
//  PLAYER INTERACTION
// ============================================================
function handleBoardClick(e) {
    if (STATE.gameOver || STATE.isRolling || STATE.isAnimating) return;
    if (STATE.gameMode === 'vsAi' && STATE.currentPlayer === 'dark') return;

    if (STATE.dice.length === 0) {
        UI.gameMessage.textContent = "Roll the dice first!";
        return;
    }

    const rect = UI.canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;

    const target = getClickedRegion(mx, my, rect.width, rect.height);
    if (!target) { clearSelection(); return; }

    const pColor = STATE.currentPlayer;

    // Bug #9 fix: handle 'off' destination clicks via 'off' type returned from getClickedRegion
    if (target.type === 'off' && STATE.selectedPoint !== null && STATE.validDestinations.includes('off')) {
        executeMove(STATE.selectedPoint, 'off', pColor);
        return;
    }

    // Clicked on a valid destination point
    if (target.type === 'point' && STATE.selectedPoint !== null && STATE.validDestinations.includes(target.idx)) {
        executeMove(STATE.selectedPoint, target.idx, pColor);
        return;
    }

    // Select a piece from the bar
    if (target.type === 'bar') {
        if (pColor === 'white' && STATE.bar.white > 0) {
            STATE.selectedPoint     = 'bar';
            STATE.validDestinations = getValidMoves('bar', 'white');
            if (STATE.validDestinations.length === 0) UI.gameMessage.textContent = "No entry available — all points blocked!";
            drawBoard();
        } else if (pColor === 'dark' && STATE.bar.dark > 0) {
            STATE.selectedPoint     = 'bar';
            STATE.validDestinations = getValidMoves('bar', 'dark');
            if (STATE.validDestinations.length === 0) UI.gameMessage.textContent = "No entry available — all points blocked!";
            drawBoard();
        } else {
            clearSelection();
        }
        return;
    }

    // Select a piece from a point
    if (target.type === 'point') {
        const pt = STATE.points[target.idx];
        if (pt.color === pColor && pt.count > 0) {
            STATE.selectedPoint     = target.idx;
            STATE.validDestinations = getValidMoves(target.idx, pColor);
            drawBoard();
        } else {
            clearSelection();
        }
        return;
    }

    clearSelection();
}

function clearSelection() {
    STATE.selectedPoint     = null;
    STATE.validDestinations = [];
    drawBoard();
}

// Hit-test: returns { type: 'point'|'bar'|'off', idx? }
function getClickedRegion(x, y, w, h) {
    const lTray = w * 0.06;
    const lFld  = w * 0.40;
    const bar   = w * 0.08;
    const rFld  = w * 0.40;

    // Bug #8 fix: wider bear-off tray zones
    if (STATE.selectedPoint !== null && STATE.validDestinations.includes('off')) {
        if (STATE.currentPlayer === 'white' && x >= w * 0.92) return { type: 'off' };
        if (STATE.currentPlayer === 'dark'  && x <= w * 0.08) return { type: 'off' };
    }

    // Central bar
    if (x >= w * 0.45 && x <= w * 0.55) return { type: 'bar' };

    let c = -1;
    if (x >= lTray && x < lTray + lFld) {
        c = Math.floor((x - lTray) / (lFld / 6));
    } else if (x >= lTray + lFld + bar && x < w - (w * 0.06)) {
        c = 6 + Math.floor((x - (lTray + lFld + bar)) / (rFld / 6));
    }
    if (c < 0 || c > 11) return null;

    const isTop = y < h * 0.5;
    const idx   = isTop ? (12 + c) : (11 - c);
    return { type: 'point', idx };
}

// ============================================================
//  CANVAS COORDINATE HELPER
// ============================================================
function getPointCenterCoords(idx, w, h) {
    const lTray = w * 0.06;
    const lFld  = w * 0.40;
    const barW  = w * 0.08;

    const isTop = idx >= 12;
    const c     = isTop ? (idx - 12) : (11 - idx);
    const segW  = w * 0.40 / 6;

    let cx = (c < 6)
        ? lTray + (c + 0.5) * segW
        : lTray + lFld + barW + (c - 6 + 0.5) * segW;

    return { x: cx, y: isTop ? h * 0.05 : h * 0.95 };
}

// ============================================================
//  BOARD RENDERING
// ============================================================
function drawBoard() {
    const dpr = window.devicePixelRatio || 1;
    const w   = UI.canvas.width  / dpr;
    const h   = UI.canvas.height / dpr;
    if (w === 0 || h === 0) return; // Bug #6 guard

    ctx.clearRect(0, 0, w, h);

    // Outer wood border
    ctx.fillStyle = '#2c1608';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth   = 2;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    const lTray = w * 0.06;
    const lFld  = w * 0.40;
    const barW  = w * 0.08;
    const rFld  = w * 0.40;

    // Playing fields
    ctx.fillStyle = '#ebcc9b';
    ctx.fillRect(lTray, h * 0.05, lFld, h * 0.90);
    ctx.fillRect(lTray + lFld + barW, h * 0.05, rFld, h * 0.90);

    // Central bar
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(lTray + lFld, h * 0.05, barW, h * 0.90);

    // Bear-off trays
    ctx.fillStyle = '#160902';
    ctx.fillRect(2,           h * 0.05, lTray - 4, h * 0.90); // left (dark bears off here)
    ctx.fillRect(w - lTray + 2, h * 0.05, lTray - 4, h * 0.90); // right (white bears off here)

    // Tray labels
    ctx.fillStyle   = 'rgba(255,255,255,0.35)';
    ctx.font        = `bold ${Math.max(7, w * 0.018)}px Outfit,sans-serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OFF', lTray / 2, h / 2);
    ctx.fillText('OFF', w - lTray / 2, h / 2);

    // Highlight active bear-off tray
    if (STATE.validDestinations.includes('off')) {
        ctx.fillStyle = 'rgba(245,158,11,0.30)';
        if (STATE.currentPlayer === 'white') ctx.fillRect(w - lTray + 2, h * 0.05, lTray - 4, h * 0.90);
        else                                 ctx.fillRect(2, h * 0.05, lTray - 4, h * 0.90);
    }

    // Decorative mandalas
    drawMandala(lTray + lFld / 2,            h / 2, w * 0.08);
    drawMandala(lTray + lFld + barW + rFld / 2, h / 2, w * 0.08);

    // Dividing line (mid-board)
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(lTray, h * 0.5);
    ctx.lineTo(lTray + lFld, h * 0.5);
    ctx.moveTo(lTray + lFld + barW, h * 0.5);
    ctx.lineTo(w - (w * 0.06), h * 0.5);
    ctx.stroke();

    // Triangular points
    const segW  = w * 0.40 / 6;
    const triH  = h * 0.38;

    for (let i = 0; i < 24; i++) {
        const center = getPointCenterCoords(i, w, h);
        const isTop  = i >= 12;

        let fill = (i % 2 === 0) ? '#8b5a2b' : '#faf0e6';
        if (STATE.selectedPoint === i)        fill = '#60a5fa';
        else if (STATE.validDestinations.includes(i)) fill = '#f59e0b';

        ctx.fillStyle = fill;
        ctx.beginPath();
        if (isTop) {
            ctx.moveTo(center.x - segW / 2 + 1, h * 0.05);
            ctx.lineTo(center.x + segW / 2 - 1, h * 0.05);
            ctx.lineTo(center.x,                 h * 0.05 + triH);
        } else {
            ctx.moveTo(center.x - segW / 2 + 1, h * 0.95);
            ctx.lineTo(center.x + segW / 2 - 1, h * 0.95);
            ctx.lineTo(center.x,                 h * 0.95 - triH);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth   = 0.5;
        ctx.stroke();
    }

    // Bug #3: Point number labels (1-24, from white's perspective: index+1)
    drawPointLabels(w, h, lTray, lFld, barW);

    // Checkers
    const r = segW * 0.42;
    for (let i = 0; i < 24; i++) {
        const pt = STATE.points[i];
        if (pt.count > 0) drawCheckerStack(i, pt.count, pt.color, r, w, h);
    }
    if (STATE.bar.white > 0) drawBarStack('white', STATE.bar.white, r, w, h);
    if (STATE.bar.dark  > 0) drawBarStack('dark',  STATE.bar.dark,  r, w, h);
    if (STATE.borneOff.white > 0) drawTrayStack('white', STATE.borneOff.white, r, w, h);
    if (STATE.borneOff.dark  > 0) drawTrayStack('dark',  STATE.borneOff.dark,  r, w, h);

    // Dice on board
    if (STATE.dice.length > 0 || STATE.isRolling) drawBoardDice(w, h);
}

// Bug #3: Draw point numbers along the edges of the board
function drawPointLabels(w, h, lTray, lFld, barW) {
    const segW   = w * 0.40 / 6;
    const fSize  = Math.max(7, Math.min(10, segW * 0.35));
    ctx.font     = `bold ${fSize}px Outfit,sans-serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 24; i++) {
        const center = getPointCenterCoords(i, w, h);
        const isTop  = i >= 12;
        // Point label = index + 1 (white's perspective)
        const label  = (i + 1).toString();

        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        const ly = isTop ? h * 0.025 : h * 0.975;
        ctx.fillText(label, center.x, ly);
    }
}

function drawMandala(cx, cy, r) {
    ctx.strokeStyle = 'rgba(217,119,6,0.18)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r,       0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
    }
}

function drawCheckerStack(idx, count, color, r, w, h) {
    const center    = getPointCenterCoords(idx, w, h);
    const isTop     = idx >= 12;
    const maxH      = h * 0.37;
    const spacing   = Math.min(r * 2, maxH / Math.max(count, 1));

    for (let i = 0; i < count; i++) {
        const cy        = isTop
            ? h * 0.05 + r + i * spacing
            : h * 0.95 - r - i * spacing;
        const highlight = STATE.selectedPoint === idx && i === count - 1;
        drawChecker(center.x, cy, r, color, highlight);
    }

    // Stack count badge when > 5
    if (count > 5) {
        const topY = isTop
            ? h * 0.05 + r + (count - 1) * spacing
            : h * 0.95 - r - (count - 1) * spacing;
        ctx.fillStyle   = 'rgba(0,0,0,0.75)';
        ctx.font        = `bold ${r * 0.9}px Outfit,sans-serif`;
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(count, center.x, topY);
    }
}

function drawBarStack(color, count, r, w, h) {
    const cx      = w / 2;
    const maxH    = h * 0.35;
    const spacing = Math.min(r * 2, maxH / Math.max(count, 1));

    for (let i = 0; i < count; i++) {
        const cy = (color === 'white')
            ? h * 0.25 + r + i * spacing
            : h * 0.75 - r - i * spacing;
        const hi = STATE.selectedPoint === 'bar' && STATE.currentPlayer === color && i === count - 1;
        drawChecker(cx, cy, r, color, hi);
    }
}

function drawTrayStack(color, count, r, w, h) {
    const lTray  = w * 0.06;
    const cx     = (color === 'white') ? w - lTray / 2 : lTray / 2;
    const spacing = Math.min(r * 0.45, (h * 0.84) / Math.max(count, 1));
    for (let i = 0; i < count; i++) {
        drawFlatChecker(cx, h * 0.92 - r - i * spacing, r, color);
    }
}

function drawChecker(x, y, r, color, highlight) {
    ctx.shadowColor   = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur    = 4;
    ctx.shadowOffsetY = 2;

    let grad;
    if (color === 'white') {
        grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.7, '#f1f5f9');
        grad.addColorStop(1, '#cbd5e1');
    } else {
        grad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.1, x, y, r);
        grad.addColorStop(0, '#5d4037');
        grad.addColorStop(0.7, '#3e2723');
        grad.addColorStop(1, '#1b0c02');
    }
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    if (highlight) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth   = 2.5;
        ctx.beginPath(); ctx.arc(x, y, r - 1, 0, Math.PI * 2); ctx.stroke();
    } else {
        ctx.strokeStyle = (color === 'white') ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)';
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.strokeStyle = (color === 'white') ? '#cbd5e1' : '#5d4037';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.arc(x, y, r * 0.65, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.30, 0, Math.PI * 2); ctx.stroke();
}

function drawFlatChecker(x, y, r, color) {
    ctx.fillStyle   = (color === 'white') ? '#e2e8f0' : '#2d1502';
    ctx.strokeStyle = (color === 'white') ? '#94a3b8' : '#5a2e0c';
    ctx.lineWidth   = 1;
    ctx.fillRect(x - r * 0.8, y - 2, r * 1.6, 4);
    ctx.strokeRect(x - r * 0.8, y - 2, r * 1.6, 4);
}

// Dice drawn on the board canvas
function drawBoardDice(w, h) {
    const diceW  = Math.min(w * 0.09, 36);
    const radius = 5;

    for (let i = 0; i < 2; i++) {
        const val = STATE.isRolling ? STATE.diceAnimValues[i] : STATE.dice[i];
        const pos = STATE.dicePositions[i];
        if (!val) continue;

        // Clamp positions inside board
        const px = Math.max(diceW / 2 + 2, Math.min(w - diceW / 2 - 2, pos.x));
        const py = Math.max(diceW / 2 + 2, Math.min(h - diceW / 2 - 2, pos.y));

        ctx.shadowColor   = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur    = 6;
        ctx.shadowOffsetY = 3;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(px - diceW/2, py - diceW/2, diceW, diceW, radius);
        ctx.fill();

        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.roundRect(px - diceW/2, py - diceW/2, diceW, diceW, radius);
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        drawPips(px, py, diceW, val);

        // Strikethrough used dice
        if (!STATE.isRolling && !STATE.unusedMoves.includes(val)) {
            ctx.strokeStyle = 'rgba(239,68,68,0.7)';
            ctx.lineWidth   = 2;
            ctx.beginPath();
            ctx.moveTo(px - diceW/2 + 4, py - diceW/2 + 4);
            ctx.lineTo(px + diceW/2 - 4, py + diceW/2 - 4);
            ctx.stroke();
        }
    }

    // Remaining moves label
    if (STATE.unusedMoves.length > 0 && !STATE.isRolling) {
        ctx.fillStyle    = 'rgba(255,255,255,0.75)';
        ctx.font         = `bold ${Math.max(9, w * 0.022)}px Outfit,sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Moves: ' + STATE.unusedMoves.join(', '), w / 2, h * 0.53);
    }
}

function drawPips(cx, cy, size, val) {
    const r   = size * 0.08;
    const off = size * 0.28;
    const p = {
        tl: {x: cx-off, y: cy-off}, tc: {x: cx,    y: cy-off},
        tr: {x: cx+off, y: cy-off}, cl: {x: cx-off, y: cy},
        cc: {x: cx,     y: cy},     cr: {x: cx+off, y: cy},
        bl: {x: cx-off, y: cy+off}, bc: {x: cx,     y: cy+off},
        br: {x: cx+off, y: cy+off}
    };
    const dot = (q) => { ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI*2); ctx.fill(); };

    switch(val) {
        case 1: dot(p.cc); break;
        case 2: dot(p.tl); dot(p.br); break;
        case 3: dot(p.tl); dot(p.cc); dot(p.br); break;
        case 4: dot(p.tl); dot(p.tr); dot(p.bl); dot(p.br); break;
        case 5: dot(p.tl); dot(p.tr); dot(p.cc); dot(p.bl); dot(p.br); break;
        case 6: dot(p.tl); dot(p.tc); dot(p.tr); dot(p.bl); dot(p.bc); dot(p.br); break;
    }
}

// ============================================================
//  SOUND (Web Audio)
// ============================================================
function initAudio() {
    if (audioCtx) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
}

function playSound(type) {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const mk  = (type, freq1, freq2, dur, vol, wave) => {
        const osc = audioCtx.createOscillator();
        const g   = audioCtx.createGain();
        osc.connect(g); g.connect(audioCtx.destination);
        osc.type = wave || 'sine';
        osc.frequency.setValueAtTime(freq1, now);
        if (freq2) osc.frequency.exponentialRampToValueAtTime(freq2, now + dur);
        g.gain.setValueAtTime(vol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.start(now); osc.stop(now + dur);
    };
    if (type === 'roll')  mk(null, 150, 40,  0.5, 0.18, 'triangle');
    if (type === 'click') mk(null, 250, 100, 0.08,0.15);
    if (type === 'hit')   mk(null, 350, 10,  0.15,0.25, 'triangle');
    if (type === 'bear')  mk(null, 440, 880, 0.25,0.12);
    if (type === 'win') {
        [261.63,329.63,392,523.25,659.25,783.99,1046.5].forEach((f, i) => {
            const osc = audioCtx.createOscillator();
            const g   = audioCtx.createGain();
            osc.connect(g); g.connect(audioCtx.destination);
            osc.frequency.value = f;
            g.gain.setValueAtTime(0.15, now + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
            osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.5);
        });
    }
}

// ============================================================
//  DICE ROLL
// ============================================================
function triggerRoll() {
    if (STATE.isRolling || STATE.isAnimating || STATE.dice.length > 0 || STATE.gameOver) return;

    STATE.isRolling = true;
    updateHUD();
    playSound('roll');

    const dpr = window.devicePixelRatio || 1;
    const w   = UI.canvas.width  / dpr;
    const h   = UI.canvas.height / dpr;
    const lTray = w * 0.06, lFld = w * 0.40, barW = w * 0.08;

    // Place dice in mid-board areas, avoiding overlap
    STATE.dicePositions = [
        { x: lTray + 0.15 * lFld + Math.random() * (lFld * 0.5), y: h * 0.38 + Math.random() * h * 0.24 },
        { x: lTray + lFld + barW + 0.15 * lFld + Math.random() * (lFld * 0.5), y: h * 0.38 + Math.random() * h * 0.24 }
    ];

    STATE.diceAnimFrames = 0;
    animateDiceRoll();
}

function animateDiceRoll() {
    STATE.diceAnimFrames++;
    STATE.diceAnimValues = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
    ];
    // Slight jitter
    STATE.dicePositions[0].x += (Math.random() - 0.5) * 5;
    STATE.dicePositions[0].y += (Math.random() - 0.5) * 5;
    STATE.dicePositions[1].x += (Math.random() - 0.5) * 5;
    STATE.dicePositions[1].y += (Math.random() - 0.5) * 5;

    drawBoard();

    if (STATE.diceAnimFrames < 18) {
        requestAnimationFrame(animateDiceRoll);
    } else {
        STATE.isRolling = false;
        const r1 = Math.floor(Math.random() * 6) + 1;
        const r2 = Math.floor(Math.random() * 6) + 1;
        STATE.dice = [r1, r2];

        if (r1 === r2) {
            STATE.unusedMoves = [r1, r1, r1, r1];
            UI.gameMessage.textContent = `Doubles! Rolled ${r1}+${r1}+${r1}+${r1} — 4 moves!`;
            UI.gameMessage.classList.add('important');
        } else {
            STATE.unusedMoves = [r1, r2];
            UI.gameMessage.textContent = `Rolled a ${r1} and a ${r2}`;
            UI.gameMessage.classList.remove('important');
        }

        updateHUD();
        checkTurnProgress();
    }
}

// ============================================================
//  GAME CONTROL
// ============================================================
function startGame(mode) {
    STATE.gameMode = mode;
    resetBoardState();

    UI.modeBadge.textContent  = (mode === 'vsAi') ? 'vs Computer' : '2 Players';
    UI.p2NameVal.textContent  = (mode === 'vsAi') ? 'AI Opponent' : 'Player 2 (Dark)';
    UI.p2Avatar.textContent   = (mode === 'vsAi') ? '🤖' : '⚫';

    UI.modeScreen.classList.add('hidden');
    UI.gameScreen.classList.remove('hidden');
    UI.gameOverOverlay.classList.add('hidden');

    UI.p1OutVal.textContent = '0';
    UI.p2OutVal.textContent = '0';
    UI.gameMessage.textContent = "White's turn — roll the dice!";
    UI.gameMessage.classList.remove('important');

    resizeCanvas();
    drawBoard();
    updateHUD();

    STATE.gameStartTime  = Date.now();
    STATE.durationSent   = false;
    markSessionStarted();
    initAudio();
}

// Bug #4: Reset ALL state flags when going back to menu
function showMenu() {
    STATE.isRolling     = false;
    STATE.isAnimating   = false;
    STATE.gameOver      = false;
    STATE.aiPending     = false;
    STATE.dice          = [];
    STATE.unusedMoves   = [];
    STATE.selectedPoint = null;
    STATE.validDestinations = [];

    UI.modeScreen.classList.remove('hidden');
    UI.gameScreen.classList.add('hidden');
    UI.gameOverOverlay.classList.add('hidden');
}

function restartGame() {
    startGame(STATE.gameMode);
}

function updateHUD() {
    if (STATE.currentPlayer === 'white') {
        UI.player1Panel.classList.add('active');
        UI.player2Panel.classList.remove('active');
        UI.turnLabel.textContent = "White's Turn";
        UI.turnLabel.style.color = '#3b82f6';
    } else {
        UI.player1Panel.classList.remove('active');
        UI.player2Panel.classList.add('active');
        UI.turnLabel.textContent = (STATE.gameMode === 'vsAi') ? "AI's Turn" : "Dark's Turn";
        UI.turnLabel.style.color = '#ef4444';
    }

    const rollDisabled = STATE.gameOver
        || STATE.isRolling
        || STATE.isAnimating
        || STATE.dice.length > 0
        || (STATE.gameMode === 'vsAi' && STATE.currentPlayer === 'dark');

    UI.rollBtn.disabled = rollDisabled;
}

function endGame() {
    STATE.gameOver = true;
    updateHUD();
    playSound('win');

    const whiteWon  = STATE.borneOff.white === 15;
    const aiGame    = STATE.gameMode === 'vsAi';

    if (whiteWon) {
        UI.winTitle.textContent   = 'Victory! 🏆';
        UI.winIcon.textContent    = '🏆';
        UI.winMsg.textContent     = aiGame
            ? 'You won! All your checkers are home!'
            : 'White (Player 1) wins — all checkers borne off!';
    } else {
        UI.winTitle.textContent   = aiGame ? 'Defeated! 💀' : 'Dark Wins! 🎉';
        UI.winIcon.textContent    = aiGame ? '💀' : '🎉';
        UI.winMsg.textContent     = aiGame
            ? 'The AI bore off all its checkers first!'
            : 'Dark (Player 2) wins — all checkers borne off!';
    }

    UI.gameOverOverlay.classList.remove('hidden');

    try {
        let gc = parseInt(localStorage.getItem('pmg_backgammon_gameover_count') || '0') + 1;
        localStorage.setItem('pmg_backgammon_gameover_count', gc.toString());
        if (gc % 3 === 0 && typeof window.loadSmartlinkAd === 'function') window.loadSmartlinkAd();
    } catch(e) {}

    if (typeof window.renderGameScroller === 'function') window.renderGameScroller('game-over-more-games');

    sendDurationOnExit('game_over_backgammon');
}

// ============================================================
//  SUPABASE TRACKING
// ============================================================
function initSupabase() {
    if (!window.supabase) { setTimeout(initSupabase, 500); return; }
    if (!supabaseClient) {
        const { createClient } = window.supabase;
        supabaseClient = createClient(supabaseUrl, supabaseKey);
    }
    startGameSession();
}

function getPlacementId() {
    const p = new URLSearchParams(window.location.search);
    return p.get('utm_content') || p.get('placementid') || 'unknown';
}

async function getCountry() {
    try {
        const r = await fetch('https://ipapi.co/json/');
        if (!r.ok) throw new Error();
        const d = await r.json();
        return d.country_name || d.country || 'Unknown';
    } catch {
        try {
            const t = await (await fetch('https://www.cloudflare.com/cdn-cgi/trace')).text();
            const l = t.split('\n').find(x => x.startsWith('loc='));
            return l ? l.split('=')[1] : 'Unknown';
        } catch { return 'Unknown'; }
    }
}

function getOS() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua))     return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Win/i.test(ua))         return 'Windows';
    if (/Mac/i.test(ua))         return 'Mac';
    return 'Unknown';
}

function getBrowser() {
    const ua = navigator.userAgent;
    if (/Edg/i.test(ua))            return 'Edge';
    if (/OPR|Opera/i.test(ua))      return 'Opera';
    if (/Chrome/i.test(ua))         return 'Chrome';
    if (/Safari/i.test(ua))         return 'Safari';
    if (/Firefox/i.test(ua))        return 'Firefox';
    return 'Unknown';
}

function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

async function startGameSession() {
    if (!supabaseClient) return;
    sessionId = generateSessionId();
    const country = await getCountry();
    try {
        await supabaseClient.from('game_sessions').insert([{
            session_id:   sessionId,
            game_slug:    'backgammon',
            placement_id: getPlacementId(),
            user_agent:   navigator.userAgent,
            os:           getOS(),
            browser:      getBrowser(),
            country,
            started_game: false,
            bounced:      false
        }]);
    } catch(e) {}
}

async function markSessionStarted() {
    if (!supabaseClient || !sessionId) return;
    try { await supabaseClient.from('game_sessions').update({ started_game: true }).eq('session_id', sessionId); } catch(e) {}
}

async function updateGameSession(fields) {
    if (!supabaseClient || !sessionId) return;
    try { await supabaseClient.from('game_sessions').update(fields).eq('session_id', sessionId); } catch(e) {}
}

function sendDurationOnExit(reason) {
    if (STATE.gameStartTime && !STATE.durationSent) {
        const seconds = Math.round((Date.now() - STATE.gameStartTime) / 1000);
        updateGameSession({ duration_seconds: seconds, bounced: false, end_reason: reason });
        if (typeof window.trackGameEvent === 'function') {
            window.trackGameEvent(`game_duration_backgammon_${seconds}_${reason}_${getBrowser()}`, { seconds, end_reason: reason, os: getOS() });
        }
        STATE.durationSent = true;
    }
}

document.addEventListener('visibilitychange', () => { if (document.hidden) sendDurationOnExit('background_backgammon'); });
window.addEventListener('beforeunload',        () => sendDurationOnExit('tab_close_backgammon'));

setInterval(() => {
    if (typeof window.syncPMGLayout === 'function') {
        const s = Math.round((Date.now() - STATE.gameRecordTime) / 1000);
        if (s > 60) { window.syncPMGLayout(); STATE.gameRecordTime = Date.now(); }
    }
}, 5000);

// ============================================================
//  BOOTSTRAP
// ============================================================
init();
resetBoardState();
// Defer first draw so canvas has a real layout rect (Bug #6)
requestAnimationFrame(() => { resizeCanvas(); drawBoard(); updateHUD(); showMenu(); });
