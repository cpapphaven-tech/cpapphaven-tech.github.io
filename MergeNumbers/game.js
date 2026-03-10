// ===== MERGE NUMBERS 2248 — Level Edition =====
// Auto-starts immediately. 60s per level. Reach target to advance (unlimited levels).
(function () {
    'use strict';

    // ===== CONFIG =====
    const COLS = 5, ROWS = 7, GAP = 7;
    const LEVEL_TIME = 60;     // seconds per level
    const BEST_KEY = 'mergeNumbers_bestScore';
    const BEST_LVL_KEY = 'mergeNumbers_bestLevel';

    // Tile colors [top, bottom]
    const COLORS = {
        2: ['#4ade80', '#16a34a'], 4: ['#facc15', '#ca8a04'],
        8: ['#38bdf8', '#0369a1'], 16: ['#f472b6', '#be185d'],
        32: ['#fb923c', '#c2410c'], 64: ['#a78bfa', '#6d28d9'],
        128: ['#2dd4bf', '#0f766e'], 256: ['#f87171', '#991b1b'],
        512: ['#86efac', '#15803d'], 1024: ['#fcd34d', '#b45309'],
        2048: ['#f9a8d4', '#9d174d'], 4096: ['#93c5fd', '#1d4ed8'],
    };
    function getTileColor(v) {
        if (COLORS[v]) return COLORS[v];
        const h = (Math.log2(v) * 47) % 360;
        return [`hsl(${h},70%,55%)`, `hsl(${h},70%,38%)`];
    }

    // Target score per level — MEDIUM difficulty
    // ~15–20 merges possible in 60s; target requires consistent chaining
    // function getTarget(lvl) {
    //     const targets = [0, 100, 150, 200, 260, 320, 400, 500, 600, 720, 850];
    //     if (lvl <= 10) return targets[lvl];
    //     return 850 + (lvl - 10) * 200; // 1050, 1250, 1450 ... unlimited
    // }
    function getTarget(lvl) {
        return 100 + (lvl - 1) * 40;
    }

    // ===== STATE =====
    let grid = [], selected = [], selVal = 0;
    let score = 0, levelScore = 0, levelScoreStart = 0;
    let level = 1, timeLeft = LEVEL_TIME;
    let bestScore = parseInt(localStorage.getItem(BEST_KEY)) || 0;
    let bestLevel = parseInt(localStorage.getItem(BEST_LVL_KEY)) || 1;
    let gameState = 'idle'; // 'idle'|'playing'|'levelup'|'over'
    let flashCell = null, flashTimer = 0;
    let adUsed = false; // only 1 ad-bonus per game over

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

    // --- Supabase Config ---
    const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
    const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
    let supabaseClient = null;

    // --- Session Tracking ---
    let sessionId = null;
    let sessionRowId = null;


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
            window.trackGameEvent(`game_duration_mergenumbers_${seconds}_${reason}_${getBrowser()}`, {
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


            sendDurationOnExit("background_mergenumbers");
        }
    });

    window.addEventListener("beforeunload", () => {

        sendDurationOnExit("tab_close_mergenumbers");

        if (!gameStartedFlag && window.trackGameEvent) {
            const osKey = getOSKey();
            const placementId = getPlacementId();
            window.trackGameEvent(`exit_before_game_mergenumbers_${osKey}`, {
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
        const gameSlug = "mergenumbers";
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
        } catch (e) { }
    }

    async function markSessionStarted() {
        if (!supabaseClient || !sessionId) return;
        try {
            await supabaseClient
                .from('game_sessions')
                .update({ started_game: true })
                .eq('session_id', sessionId);
        } catch (e) { }
    }

    async function updateGameSession(fields) {
        if (!supabaseClient || !sessionId) return;
        try {
            await supabaseClient
                .from('game_sessions')
                .update(fields)
                .eq('session_id', sessionId);
        } catch (e) { }
    }

    function resize() {
        dpr = window.devicePixelRatio || 1;
        const r = canvas.getBoundingClientRect();
        W = r.width; H = r.height;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cellSize = Math.floor((W - GAP * (COLS + 1)) / COLS);
        const gW = COLS * cellSize + (COLS - 1) * GAP;
        const gH = ROWS * cellSize + (ROWS - 1) * GAP;
        gx = (W - gW) / 2;
        gy = Math.max(GAP, (H - gH) / 2);
        redraw();
    }
    new ResizeObserver(resize).observe(canvas);
    window.addEventListener('resize', resize);

    // ===== AUDIO =====
    let audioCtx;
    function audio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }
    function tone(f, type, g, dur, delay) {
        delay = delay || 0;
        try {
            const a = audio(), osc = a.createOscillator(), env = a.createGain();
            osc.type = type; osc.frequency.setValueAtTime(f, a.currentTime + delay);
            env.gain.setValueAtTime(0.001, a.currentTime + delay);
            env.gain.linearRampToValueAtTime(g, a.currentTime + delay + 0.01);
            env.gain.exponentialRampToValueAtTime(0.001, a.currentTime + delay + dur);
            osc.connect(env); env.connect(a.destination);
            osc.start(a.currentTime + delay); osc.stop(a.currentTime + delay + dur + 0.05);
        } catch (e) { }
    }
    const sfx = {
        connect(idx) { tone(280 + idx * 55, 'sine', 0.10, 0.05); },
        merge(val) { tone(Math.min(900, 200 + Math.log2(val) * 65), 'sine', 0.28, 0.14); tone(380, 'triangle', 0.08, 0.08, 0.04); },
        deselect() { tone(200, 'sine', 0.05, 0.04); },
        tick() { tone(880, 'square', 0.06, 0.04); },
        levelUp() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', 0.22, 0.16, i * 0.12)); },
        over() { [440, 370, 300, 220].forEach((f, i) => tone(f, 'sawtooth', 0.14, 0.2, i * 0.18)); },
    };

    // ===== GRID HELPERS =====
    function spawnVal() {
        // Weight span based on level: higher levels can introduce bigger tiles
        const cap = Math.min(9, 1 + Math.floor(level / 5)); // max log2 of spawned value
        const weights = [];
        for (let i = 1; i <= cap; i++) {
            const w = Math.max(1, cap - i + 2);
            for (let j = 0; j < w; j++) weights.push(Math.pow(2, i));
        }
        return weights[Math.floor(Math.random() * weights.length)];
    }
    function initGrid() {
        grid = [];
        for (let r = 0; r < ROWS; r++) { grid.push([]); for (let c = 0; c < COLS; c++) grid[r].push(spawnVal()); }
    }
    function getMax() { let m = 0; grid.forEach(row => row.forEach(v => { if (v > m) m = v; })); return m; }
    function applyGravity() {
        for (let c = 0; c < COLS; c++) {
            const col = [];
            for (let r = ROWS - 1; r >= 0; r--) if (grid[r][c]) col.push(grid[r][c]);
            for (let r = ROWS - 1; r >= 0; r--) grid[r][c] = col.length ? col.shift() : 0;
        }
    }
    function fillEmpty() {
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!grid[r][c]) grid[r][c] = spawnVal();
    }
    function isAdj(a, b) { return Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1 && !(a.r === b.r && a.c === b.c); }
    function inSel(r, c) { return selected.some(s => s.r === r && s.c === c); }
    function hasMove() {
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
            const v = grid[r][c];
            for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                if (!dr && !dc) continue;
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === v) return true;
            }
        }
        return false;
    }

    // ===== HUD UPDATE =====
    function updateHUD() {
        const target = getTarget(level);
        // Show LEVEL score (resets each level), not cumulative
        scoreEl.textContent = levelScore;
        levelEl.textContent = level;
        targetLbl.textContent = 'TARGET: ' + target;

        // Score progress bar
        const spct = Math.min(100, Math.round(levelScore / target * 100));
        scoreBar.style.width = spct + '%';

        // Timer display
        const t = Math.max(0, Math.ceil(timeLeft));
        timerEl.textContent = t;
        timerBar.style.width = (timeLeft / LEVEL_TIME * 100) + '%';
        timerBar.style.background = t > 20 ? '#22c55e' : t > 10 ? '#fbbf24' : '#ef4444';
        timerEl.className = 'hud-big ' + (t > 20 ? 'timer-ok' : t > 10 ? 'timer-warn' : 'timer-danger');
    }

    // ===== MERGE =====
    function executeMerge() {
        if (selected.length < 2) { selected = []; redraw(); return; }
        const val = selVal, merged = val * 2;
        const last = selected[selected.length - 1];

        score += val * selected.length;
        levelScore += val * selected.length;
        // Track best single-level score
        if (levelScore > bestScore) { bestScore = levelScore; localStorage.setItem(BEST_KEY, bestScore); }

        selected.forEach(({ r, c }) => grid[r][c] = 0);
        grid[last.r][last.c] = merged;
        sfx.merge(merged);
        flashCell = { r: last.r, c: last.c }; flashTimer = 0;
        selected = []; selVal = 0;
        applyGravity(); fillEmpty();
        updateHUD();

        // Level complete check
        if (levelScore >= getTarget(level)) { levelComplete(); return; }

        // No moves left → reshuffle (not game over — just refresh tiles)
        if (!hasMove()) fillEmpty();
    }

    // ===== LEVEL COMPLETE =====
    function levelComplete() {

      const seconds = Math.round((Date.now() - gameStartTime) / 1000);
    if (seconds > 60) {
        initBottomAndSideAds();
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
        levelScore = 0;   // reset score for this level
        adUsed = false;
        // Keep existing grid, just fill any empties and refresh
        if (!grid.length) initGrid(); else fillEmpty();
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



    // ===== START NEW GAME =====
    function startGame() {

         gameStartTime = Date.now();   // ⏱ start timer
        
        score = 0; levelScore = 0;
        level = 1; timeLeft = LEVEL_TIME;
        selected = []; selVal = 0; flashCell = null; adUsed = false;
        goEl.classList.add('hidden'); lcEl.classList.add('hidden');
        initGrid();
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
        if (!cell || !grid[cell.r][cell.c]) return;
        selected = [cell]; selVal = grid[cell.r][cell.c];
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
        if (grid[cell.r][cell.c] !== selVal) return;
        if (inSel(cell.r, cell.c)) return;
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
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: true });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);

    // ===== DRAW =====
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
    }
    function drawTile(x, y, val, isSel, scale) {
        scale = scale || 1;
        const [top, bot] = getTileColor(val);
        const pad = cellSize * (1 - scale) / 2;
        const tx = x + pad, ty = y + pad, ts = cellSize * scale, tr = 12 * scale;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        const g = ctx.createLinearGradient(tx, ty, tx, ty + ts);
        g.addColorStop(0, top); g.addColorStop(1, bot);
        ctx.fillStyle = g; roundRect(tx, ty, ts, ts, tr); ctx.fill();
        ctx.shadowColor = 'transparent';
        const sg = ctx.createLinearGradient(tx, ty + 2, tx, ty + ts * 0.45);
        sg.addColorStop(0, 'rgba(255,255,255,0.38)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sg; roundRect(tx + 2, ty + 2, ts - 4, ts * 0.42, tr - 2); ctx.fill();
        if (isSel) { ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3; roundRect(tx + 1.5, ty + 1.5, ts - 3, ts - 3, tr); ctx.stroke(); }
        const n = String(val), fs = ts * (n.length >= 4 ? 0.24 : n.length === 3 ? 0.30 : 0.36);
        ctx.font = `900 ${fs}px 'Outfit',sans-serif`;
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 5;
        ctx.fillText(n, tx + ts / 2, ty + ts / 2);
        ctx.restore();
    }
    function drawConnections() {
        if (selected.length < 2) return;
        const [topC] = getTileColor(selVal);
        ctx.save();
        ctx.strokeStyle = topC; ctx.lineWidth = cellSize * 0.18;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.55;
        ctx.beginPath();
        selected.forEach(({ r, c }, i) => {
            const cx = gx + c * (cellSize + GAP) + cellSize / 2, cy = gy + r * (cellSize + GAP) + cellSize / 2;
            i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
        selected.forEach(({ r, c }) => {
            const cx = gx + c * (cellSize + GAP) + cellSize / 2, cy = gy + r * (cellSize + GAP) + cellSize / 2;
            ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.1, 0, Math.PI * 2);
            ctx.fillStyle = '#fff'; ctx.fill();
        });
        // Chain count badge
        if (selected.length >= 2) {
            const last = selected[selected.length - 1];
            const bx = gx + last.c * (cellSize + GAP) + cellSize + 6;
            const by = gy + last.r * (cellSize + GAP) + cellSize * 0.15;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath(); ctx.arc(bx, by, 14, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.font = '900 11px Outfit,sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('×' + selected.length, bx, by);
        }
        ctx.restore();
    }
    function redraw() {
        if (!W) return;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0a18'; ctx.fillRect(0, 0, W, H);
        // Ghost cells
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { roundRect(gx + c * (cellSize + GAP), gy + r * (cellSize + GAP), cellSize, cellSize, 12); ctx.fill(); }
        // Tiles
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
            const val = grid[r]?.[c]; if (!val) continue;
            const x = gx + c * (cellSize + GAP), y = gy + r * (cellSize + GAP);
            let scale = 1;
            if (flashCell && flashCell.r === r && flashCell.c === c && flashTimer < 0.35)
                scale = 0.72 + 0.35 * Math.sin(flashTimer / 0.35 * Math.PI);
            drawTile(x, y, val, inSel(r, c), scale);
        }
        drawConnections();
    }

    // ===== TIMER LOOP =====
    let lastT = 0, prevSecond = 60;
    function loop(t) {
        requestAnimationFrame(loop);
        const dt = Math.min((t - lastT) / 1000, 0.05); lastT = t;

        if (gameState === 'playing') {
            timeLeft -= dt;
            const sec = Math.ceil(timeLeft);
            // Tick sound in last 10 seconds
            if (sec <= 10 && sec < prevSecond && sec > 0) sfx.tick();
            prevSecond = sec;

            if (timeLeft <= 0) {
                timeLeft = 0;
                triggerGameOver();
            }
            updateHUD();
        }

        if (flashCell) {
            flashTimer += dt;
            if (flashTimer >= 0.5) flashCell = null;
        }
        redraw();
    }
    requestAnimationFrame(loop);

    // ===== BUTTONS =====
    restBtn.addEventListener('click', () => { audio(); startGame(); });
    bonusBtn.addEventListener('click', () => {
        if (adUsed) return;
        adUsed = true;
        // Smartlink ad (same pattern as HelixBounce)
        window.open('https://www.effectivegatecpm.com/gp6cvyi4?key=a90897ce62f2dd15a5aab13ad90b2e66', '_blank');
        // Give 30 extra seconds and continue
        timeLeft = 30;
        goEl.classList.add('hidden');
        gameState = 'playing';
        bonusBtn.style.display = 'none';
    });

    // ===== PROMO SCROLLER =====
    function buildPromoScroller() {
        const el = document.getElementById('game-over-scroller'); if (!el) return;
        const games = [
            { name: 'Stack 3D', emoji: '🧱', href: '../Stack3D/index.html' },
            { name: 'Helix Bounce', emoji: '🌀', href: '../HelixBounce/index.html' },
            { name: 'Brick Breaker', emoji: '💥', href: '../BrickBreaker/game.html' },
            { name: 'Football 3D', emoji: '⚽', href: '../Football3D/index.html' },
            { name: 'Bubble Shooter', emoji: '🫧', href: '../BubbleShooter/index.html' },
            { name: 'Color Match', emoji: '🎨', href: '../ColorMatch/index.html' },
            { name: 'Ludo', emoji: '🎲', href: '../Ludo/index.html' },
        ];
        el.innerHTML = games.map(g => `<a class="promo-card" href="${g.href}"><span class="promo-emoji">${g.emoji}</span><span class="promo-name">${g.name}</span></a>`).join('');
    }


    function showMergeDemo() {
        mergeDemo.classList.remove("hidden");

        setTimeout(() => {
            mergeDemo.classList.add("hidden");
        }, 3000);
    }

    // ===== AUTO-START =====
    window.addEventListener('load', () => {

        showMergeDemo();

        

        resize();

        const mergeDemo = document.getElementById("merge-demo");



        initSupabase();


        startGame();   // Skip "Play Now" screen — start immediately
    });

})();
