// ===== DOT CONNECT — Two Dots Style =====
(function () {
    'use strict';

    // ===== CONFIG =====
    const COLS = 6, ROWS = 6, GAP = 15;
    const LEVEL_TIME = 60;     // seconds per level
    const BEST_KEY = 'dotConnect_bestScore';
    const BEST_LVL_KEY = 'dotConnect_bestLevel';

    // Dot colors
    const DOT_COLORS = [
        '#ef4444', // Red
        '#3b82f6', // Blue
        '#22c55e', // Green
        '#eab308', // Yellow
        '#a855f7'  // Purple
    ];

    function getTarget(lvl) {
        return 150 + (lvl - 1) * 100;
    }

    // ===== STATE =====
    let grid = [], selected = [], selColor = null;
    let isLoop = false;
    let score = 0, levelScore = 0;
    let level = 1, timeLeft = LEVEL_TIME;
    let bestScore = parseInt(localStorage.getItem(BEST_KEY)) || 0;
    let bestLevel = parseInt(localStorage.getItem(BEST_LVL_KEY)) || 1;
    let gameState = 'idle'; // 'idle'|'playing'|'levelup'|'over'
    let adUsed = false;

    // ===== DOM =====
    const gameUI = document.getElementById('game-ui');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const goEl = document.getElementById('game-over');
    const lcEl = document.getElementById('level-complete');
    const scoreEl = document.getElementById('score-display');
    const timerEl = document.getElementById('timer-num');
    const timerBar = document.getElementById('timer-bar');
    const scoreBar = document.getElementById('score-bar');
    const levelEl = document.getElementById('level-num');
    const targetLbl = document.getElementById('target-label');
    const rScore = document.getElementById('result-score');
    const rBest = document.getElementById('result-best');
    const goLvlEl = document.getElementById('go-level-num');
    const lcTitle = document.getElementById('lc-title');
    const lcScore = document.getElementById('lc-score');
    const lcNext = document.getElementById('lc-next');
    const restBtn = document.getElementById('restart-btn');
    const bonusBtn = document.getElementById('bonus-btn');
    const mergeDemo = document.getElementById("merge-demo");

    // ===== CANVAS SIZING =====
    let W, H, cellSize, gx, gy, dpr;

    let gameStartTime = null;
    let durationSent = false;
    let gameStartedFlag = false;
    let gameRecordTime = null;

    // --- Supabase Config ---
    const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
    const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
    let supabaseClient = null;

    // --- Session Tracking ---
    let sessionId = null;

    async function initSupabase() {
        if (!window.supabase) {
            setTimeout(initSupabase, 500);
            return;
        }
        if (!supabaseClient) {
            const { createClient } = window.supabase;
            supabaseClient = createClient(supabaseUrl, supabaseKey);
        }
        await startGameSession();
        await markSessionStarted();
    }

    function generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
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
        return "Unknown";
    }

    function getPlacementId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('utm_content') || urlParams.get('placementid') || "unknown";
    }

    function sendDurationOnExit(reason) {
        if (gameStartTime && !durationSent && window.trackGameEvent) {
            const seconds = Math.round((Date.now() - gameStartTime) / 1000);
            const placementId = getPlacementId();
            window.trackGameEvent(`game_duration_dotconnect_${seconds}_${reason}_${getBrowser()}`, {
                seconds,
                end_reason: reason,
                os: getOS(),
                placement_id: placementId
            });
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
        if (document.hidden) sendDurationOnExit("background_dotconnect");
    });

    window.addEventListener("beforeunload", () => {
        sendDurationOnExit("tab_close_dotconnect");
        if (!gameStartedFlag && window.trackGameEvent) {
            const placementId = getPlacementId();
            window.trackGameEvent(`exit_before_game_dotconnect`, { os: getOS(), placement_id: placementId });
            updateGameSession({ bounced: true, placement_id: placementId, end_reason: "exit_before_game" });
        }
    });

    async function startGameSession() {
        if (!supabaseClient) return;
        sessionId = generateSessionId();
        try {
            await supabaseClient.from('game_sessions').insert([{
                session_id: sessionId,
                game_slug: "dotconnect",
                placement_id: getPlacementId(),
                user_agent: navigator.userAgent,
                os: getOS(),
                browser: getBrowser(),
                started_game: false,
                bounced: false
            }]);
        } catch (e) {}
    }

    async function markSessionStarted() {
        if (!supabaseClient || !sessionId) return;
        try { await supabaseClient.from('game_sessions').update({ started_game: true }).eq('session_id', sessionId); } catch (e) {}
    }

    async function updateGameSession(fields) {
        if (!supabaseClient || !sessionId) return;
        try { await supabaseClient.from('game_sessions').update(fields).eq('session_id', sessionId); } catch (e) {}
    }

    function resize() {
        dpr = window.devicePixelRatio || 1;
        const r = canvas.getBoundingClientRect();
        W = r.width; H = r.height;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cellSize = Math.floor((Math.min(W, H) - GAP * (COLS + 1)) / COLS);
        const gW = COLS * cellSize + (COLS - 1) * GAP;
        const gH = ROWS * cellSize + (ROWS - 1) * GAP;
        gx = (W - gW) / 2;
        gy = Math.max(GAP, (H - gH) / 2 + 10);
        redraw();
    }
    new ResizeObserver(resize).observe(canvas);
    window.addEventListener('resize', resize);

    // ===== AUDIO =====
    let audioCtx;
    function audio() {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            return audioCtx;
        } catch (e) {
            return null;
        }
    }
    function tone(f, type, g, dur, delay = 0) {
        try {
            const a = audio();
            if (!a) return;
            const osc = a.createOscillator(), env = a.createGain();
            osc.type = type; osc.frequency.setValueAtTime(f, a.currentTime + delay);
            env.gain.setValueAtTime(0.001, a.currentTime + delay);
            env.gain.linearRampToValueAtTime(g, a.currentTime + delay + 0.01);
            env.gain.exponentialRampToValueAtTime(0.001, a.currentTime + delay + dur);
            osc.connect(env); env.connect(a.destination);
            osc.start(a.currentTime + delay); osc.stop(a.currentTime + delay + dur + 0.05);
        } catch (e) {}
    }
    const sfx = {
        connect(idx) { tone(300 + idx * 40, 'sine', 0.1, 0.1); },
        merge(count, loop) { 
            tone(400 + count * 20, loop ? 'triangle' : 'sine', 0.2, 0.15); 
            if(loop) tone(600, 'square', 0.1, 0.2, 0.05);
        },
        deselect() { tone(250, 'sine', 0.05, 0.05); },
        tick() { tone(880, 'square', 0.06, 0.04); },
        levelUp() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', 0.22, 0.16, i * 0.12)); },
        over() { [440, 370, 300, 220].forEach((f, i) => tone(f, 'sawtooth', 0.14, 0.2, i * 0.18)); },
    };

    // ===== GRID HELPERS =====
    function spawnColor() {
        return Math.floor(Math.random() * DOT_COLORS.length);
    }
    function initGrid() {
        grid = [];
        for (let r = 0; r < ROWS; r++) { grid.push([]); for (let c = 0; c < COLS; c++) grid[r].push(spawnColor()); }
    }
    function applyGravity() {
        for (let c = 0; c < COLS; c++) {
            const col = [];
            for (let r = ROWS - 1; r >= 0; r--) if (grid[r][c] !== null) col.push(grid[r][c]);
            for (let r = ROWS - 1; r >= 0; r--) grid[r][c] = col.length ? col.shift() : null;
        }
    }
    function fillEmpty() {
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === null) grid[r][c] = spawnColor();
    }
    function isAdj(a, b) { 
        return Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1 && !(a.r === b.r && a.c === b.c); 
    }
    function inSel(r, c) { return selected.findIndex(s => s.r === r && s.c === c); }
    
    // Check if any moves exist
    function hasMove() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const color = grid[r][c];
                if (r < ROWS - 1 && grid[r + 1][c] === color) return true;
                if (c < COLS - 1 && grid[r][c + 1] === color) return true;
            }
        }
        return false;
    }

    // ===== HUD UPDATE =====
    function updateHUD() {
        const target = getTarget(level);
        scoreEl.textContent = levelScore;
        levelEl.textContent = level;
        targetLbl.textContent = 'TARGET: ' + target;

        const spct = Math.min(100, Math.round(levelScore / target * 100));
        scoreBar.style.width = spct + '%';

        const t = Math.max(0, Math.ceil(timeLeft));
        timerEl.textContent = t;
        timerBar.style.width = (timeLeft / LEVEL_TIME * 100) + '%';
        timerBar.style.background = t > 20 ? '#22c55e' : t > 10 ? '#fbbf24' : '#ef4444';
        timerEl.className = 'hud-big ' + (t > 20 ? 'timer-ok' : t > 10 ? 'timer-warn' : 'timer-danger');
    }

    // ===== MERGE =====
    function executeMerge() {
        if (selected.length < 2) { selected = []; redraw(); return; }
        
        let count = selected.length;
        
        // Eliminate selected
        selected.forEach(({ r, c }) => {
            grid[r][c] = null;
        });

        const pts = count * 10;
        score += pts;
        levelScore += pts;
        
        if (levelScore > bestScore) { bestScore = levelScore; localStorage.setItem(BEST_KEY, bestScore); }

        sfx.merge(count, false);
        
        selected = []; selColor = null;
        applyGravity(); fillEmpty();
        
        // ensure moves exist
        while(!hasMove()) {
            initGrid();
        }

        updateHUD();

        if (levelScore >= getTarget(level)) { levelComplete(); return; }
    }

    // ===== LEVEL COMPLETE =====
    function levelComplete() {
        const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
        if (seconds > (window.PMG_TICK_RATE || 60)) {
            if (window.syncPMGLayout) window.syncPMGLayout();
            gameRecordTime = Date.now(); 
        }
        
        gameState = 'levelup';
        sfx.levelUp();
        const prevLevel = level;
        level++;
        if (level > bestLevel) { bestLevel = level; localStorage.setItem(BEST_LVL_KEY, bestLevel); }
        lcTitle.innerHTML = `LEVEL ${prevLevel}<br>COMPLETE!`;
        lcScore.textContent = `Score this level: ${levelScore}`;
        lcNext.textContent = `LEVEL ${level} →`;
        lcEl.classList.remove('hidden');
        setTimeout(() => {
            lcEl.classList.add('hidden');
            startLevel();
        }, 2200);
    }

    function startLevel() {
        gameState = 'playing';
        timeLeft = LEVEL_TIME;
        levelScore = 0;
        adUsed = false;
        if (!grid.length) initGrid(); else fillEmpty();
        while(!hasMove()) initGrid();
        updateHUD();
        redraw();
    }

    // ===== GAME OVER =====
    function triggerGameOver() {
        gameState = 'over';
        sfx.over();
        rScore.textContent = levelScore;
        rBest.textContent = 'BEST LEVEL SCORE: ' + bestScore;
        goLvlEl.textContent = level;
        bonusBtn.style.display = adUsed ? 'none' : 'block';
        goEl.classList.remove('hidden');
    }

    function startGame() {
        gameStartTime = Date.now();
        gameRecordTime = Date.now(); 
        gameStartedFlag = true;
        
        score = 0; levelScore = 0;
        level = 1; timeLeft = LEVEL_TIME;
        selected = []; selColor = null; isLoop = false; adUsed = false;
        goEl.classList.add('hidden'); lcEl.classList.add('hidden');
        initGrid();
        while(!hasMove()) initGrid();
        gameState = 'playing';
        updateHUD(); buildPromoScroller(); redraw();
    }

    // ===== INPUT =====
    function screenToCell(x, y) {
        const col = Math.floor((x - gx) / (cellSize + GAP));
        const row = Math.floor((y - gy) / (cellSize + GAP));
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
        const cx = gx + col * (cellSize + GAP), cy = gy + row * (cellSize + GAP);
        if (x < cx || x > cx + cellSize || y < cy || y > cy + cellSize) return null;
        return { r: row, c: col };
    }
    function getXY(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onDown(e) {
        if (gameState !== 'playing') return;
        audio();
        const { x, y } = getXY(e);
        const cell = screenToCell(x, y);
        if (!cell || grid[cell.r][cell.c] === null) return;
        selected = [cell]; selColor = grid[cell.r][cell.c]; isLoop = false;
        sfx.connect(0); redraw();
    }
    function onMove(e) {
        if (gameState !== 'playing' || !selected.length) return;
        e.preventDefault();
        const { x, y } = getXY(e);
        const cell = screenToCell(x, y);
        if (!cell) return;
        
        const last = selected[selected.length - 1];
        const prev = selected[selected.length - 2];
        if (prev && cell.r === prev.r && cell.c === prev.c) { selected.pop(); sfx.deselect(); redraw(); return; }
        
        if (!isAdj(last, cell)) return;
        if (grid[cell.r][cell.c] !== selColor) return;
        if (inSel(cell.r, cell.c) !== -1) return;
        
        selected.push(cell);
        sfx.connect(selected.length - 1);
        redraw();
    }
    function onUp() {
        if (gameState !== 'playing') return;
        executeMerge();
    }
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: true });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);

    // ===== DRAW =====
    function drawConnections() {
        if (selected.length < 2) return;
        ctx.save();
        ctx.strokeStyle = DOT_COLORS[selColor];
        ctx.lineWidth = cellSize * 0.25;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        selected.forEach(({ r, c }, i) => {
            const cx = gx + c * (cellSize + GAP) + cellSize / 2, cy = gy + r * (cellSize + GAP) + cellSize / 2;
            i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
        });
        ctx.stroke();
        ctx.restore();
    }
    
    function drawDot(r, c, colorIdx, isSel, highlightLoop) {
        const cx = gx + c * (cellSize + GAP) + cellSize / 2;
        const cy = gy + r * (cellSize + GAP) + cellSize / 2;
        const radius = cellSize * 0.45;
        
        ctx.save();
        
        if (highlightLoop) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fill();
        }
        
        ctx.beginPath();
        ctx.arc(cx, cy, isSel ? radius * 1.1 : radius, 0, Math.PI * 2);
        ctx.fillStyle = DOT_COLORS[colorIdx];
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
        ctx.fill();
        
        // Inner highlight for 3D effect
        ctx.beginPath();
        ctx.arc(cx - radius*0.2, cy - radius*0.2, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.shadowColor = 'transparent';
        ctx.fill();
        
        ctx.restore();
    }

    function redraw() {
        if (!W) return;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0a18'; ctx.fillRect(0, 0, W, H);
        
        // Ghost cells
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cx = gx + c * (cellSize + GAP) + cellSize / 2;
                const cy = gy + r * (cellSize + GAP) + cellSize / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.45, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        drawConnections();
        
        // Dots
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const val = grid[r] ? grid[r][c] : null;
                if (val === null || val === undefined) continue;
                const isSel = inSel(r, c) !== -1;
                const highlight = isLoop && val === selColor;
                drawDot(r, c, val, isSel, highlight);
            }
        }
    }

    // ===== TIMER LOOP =====
    let lastT = 0, prevSecond = 60;
    function loop(t) {
        requestAnimationFrame(loop);
        const dt = Math.min((t - lastT) / 1000, 0.05); lastT = t;

        if (gameState === 'playing') {
            timeLeft -= dt;
            const sec = Math.ceil(timeLeft);
            if (sec <= 10 && sec < prevSecond && sec > 0) sfx.tick();
            prevSecond = sec;

            if (timeLeft <= 0) {
                timeLeft = 0;
                triggerGameOver();
            }
            updateHUD();
        }
        redraw();
    }
    requestAnimationFrame(loop);

    // ===== BUTTONS =====
    restBtn.addEventListener('click', () => { audio(); startGame(); });
    bonusBtn.addEventListener('click', () => {
        if (adUsed) return;
        adUsed = true;
        window.open('https://www.effectivegatecpm.com/gp6cvyi4?key=a90897ce62f2dd15a5aab13ad90b2e66', '_blank');
        timeLeft = 30;
        goEl.classList.add('hidden');
        gameState = 'playing';
        bonusBtn.style.display = 'none';
    });

    // ===== PROMO SCROLLER =====
    function buildPromoScroller() {
        const el = document.getElementById('game-over-scroller'); if (!el) return;
        const games = [
            { name: 'Merge Numbers', emoji: '🔢', href: '../MergeNumbers/index.html' },
            { name: 'Stack 3D', emoji: '🧱', href: '../Stack3D/index.html' },
            { name: 'Helix Bounce', emoji: '🌀', href: '../HelixBounce/index.html' },
            { name: 'Football 3D', emoji: '⚽', href: '../Football3D/index.html' },
            { name: 'Bubble Shooter', emoji: '🫧', href: '../BubbleShooter/index.html' },
            { name: 'Ludo', emoji: '🎲', href: '../Ludo/index.html' },
        ];
        el.innerHTML = games.map(g => `<a class="promo-card" href="${g.href}"><span class="promo-emoji">${g.emoji}</span><span class="promo-name">${g.name}</span></a>`).join('');
    }

    function showDemo() {
        mergeDemo.classList.remove("hidden");
        setTimeout(() => {
            mergeDemo.classList.add("hidden");
        }, 3000);
    }

    // ===== AUTO-START =====
    function initApp() {
        showDemo();
        resize();
        initSupabase();
        startGame();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

})();
