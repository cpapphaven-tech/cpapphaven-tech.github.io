// ============================================================
// Table Tennis World Tour — Simple & Clean Top-Down View
// YOU = Bottom (Red Paddle) | AI = Top (Blue Paddle)
// ============================================================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const hdrCvs = document.getElementById('hdr-canvas');
const hctx = hdrCvs.getContext('2d');

// HUD
const scorePlayerUI = document.getElementById('score-player');
const scoreAiUI = document.getElementById('score-ai');
const setPlayerUI = document.getElementById('set-player');
const setAiUI = document.getElementById('set-ai');
const setLabelUI = document.getElementById('set-label');
const matchStatusUI = document.getElementById('match-status');
const matchMsgEl = document.getElementById('match-msg');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const resultTitle = document.getElementById('result-title');
const resultSub = document.getElementById('result-sub');
const resultIcon = document.getElementById('result-icon');
const finalScoreDiv = document.getElementById('final-score-display');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// ============================================================
// GAME CONFIG
// ============================================================
const WIN_POINTS = 11;
const WIN_SETS = 3;
const BALL_SPEED = 4.5;
const AI_SPEED = 2.0;   // medium difficulty (was 3.2)
const AI_MISS_CHANCE = 0.20; // 20% chance AI drifts slightly off-target

// ============================================================
// STATE
// ============================================================
let W, H;
let gameState = 'START';

// Paddle velocity tracking for swing speed mechanic
let prevPlayerX = 0, prevPlayerY = 0;
let playerVelX = 0, playerVelY = 0;

// Table area (computed in resize)
let table = { x: 0, y: 0, w: 0, h: 0 };

let scorePlayer = 0, scoreAi = 0;
let setsPlayer = 0, setsAi = 0;
let currentSet = 1;

// Ball — flat 2D, just x/y on table
let ball = {
    x: 0, y: 0,
    vx: 0, vy: 0,
    r: 10,
    active: false,
    lastHitter: 'none',
};

// Paddles
let player = { x: 0, y: 0, w: 90, h: 16 };  // horizontal paddle at bottom
let ai = { x: 0, y: 0, w: 90, h: 16 };  // horizontal paddle at top

// Particles
let particles = [];

let msgTimer = 0;
let aiWiggle = 0;

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
        window.trackGameEvent(`game_duration_tabletennis_${seconds}_${reason}_${getBrowser()}`, {
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


        sendDurationOnExit("background_tabletennis");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_headfootball");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        const placementId = getPlacementId();
        window.trackGameEvent(`exit_before_game_tabletennis_${osKey}`, {
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

    console.log("✅ startGameSession");

    sessionId = generateSessionId();
    const placementId = getPlacementId();
    const os = getOS();
    const browser = getBrowser();
    const userAgent = navigator.userAgent;
    const gameSlug = "tabletennis";
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


// ============================================================
// RESIZE — compute table & paddle positions
// ============================================================
function resize() {
    W = canvas.width = hdrCvs.width = window.innerWidth;
    H = canvas.height = hdrCvs.height = window.innerHeight;

    // Table: centered, padded, max aspect
    const padding = Math.min(W, H) * 0.06;
    const tableW = Math.min(W - padding * 2, (H - padding * 2) * 0.55);
    const tableH = tableW * 1.82;   // standard TT ratio ~1.82

    if (tableH > H - padding * 2) {
        // Re-calculate if too tall
        table.h = H - padding * 2;
        table.w = table.h / 1.82;
    } else {
        table.w = tableW;
        table.h = tableH;
    }

    table.x = (W - table.w) / 2;
    table.y = (H - table.h) / 2;

    // Paddle positions
    player.x = table.x + (table.w - player.w) / 2;
    player.y = table.y + table.h - 30;

    ai.x = table.x + (table.w - ai.w) / 2;
    ai.y = table.y + 14;

    // Re-center ball on resize if not playing
    if (gameState !== 'PLAY') {
        resetBallCenter();
    }
}

function resetBallCenter() {
    ball.x = table.x + table.w / 2;
    ball.y = table.y + table.h / 2;
    ball.vx = 0; ball.vy = 0;
    ball.active = false;
}

window.addEventListener('resize', resize);

// ============================================================
// INPUT — MOUSE
// ============================================================
document.addEventListener('mousemove', e => {
    if (gameState !== 'PLAY') return;
    // X: center paddle on cursor
    const nx = e.clientX - player.w / 2;
    player.x = Math.max(table.x, Math.min(table.x + table.w - player.w, nx));
    // Y: allow movement from net down to bottom edge (player's half)
    const netY = table.y + table.h / 2;
    const maxY = table.y + table.h - player.h - 4;
    player.y = Math.max(netY + 4, Math.min(maxY, e.clientY - player.h / 2));
});

// ============================================================
// INPUT — TOUCH
// ============================================================
document.addEventListener('touchmove', e => {
    e.preventDefault();
    if (gameState !== 'PLAY') return;
    const t = e.touches[0];
    const nx = t.clientX - player.w / 2;
    player.x = Math.max(table.x, Math.min(table.x + table.w - player.w, nx));
    // Y: player's half only
    const netY = table.y + table.h / 2;
    const maxY = table.y + table.h - player.h - 4;
    player.y = Math.max(netY + 4, Math.min(maxY, t.clientY - player.h / 2));
}, { passive: false });

// Track player velocity each frame
function updatePlayerVelocity() {
    playerVelX = player.x - prevPlayerX;
    playerVelY = player.y - prevPlayerY;
    prevPlayerX = player.x;
    prevPlayerY = player.y;
}

function startMatch() {

     initSupabase();

    gameStartTime = Date.now();   // ⏱ start timer
    gameRecordTime = Date.now(); 

    scorePlayer = 0; scoreAi = 0;
    setsPlayer = 0; setsAi = 0;
    currentSet = 1;
    gameState = 'PLAY';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    resize();
    serveBall('player');
    updateHUD();
}

function serveBall(server) {
    ball.x = table.x + table.w / 2;
    ball.y = table.y + table.h / 2;
    ball.active = true;
    ball.lastHitter = 'none';

    const angle = (Math.random() * 40 - 20) * (Math.PI / 180);
    const speed = BALL_SPEED;

    // Reset paddles to default positions on serve
    player.y = table.y + table.h - 30;
    ai.y = table.y + 14;

    if (server === 'player') {
        ball.vy = -speed * Math.cos(angle);
        ball.vx = speed * Math.sin(angle);
        matchStatusUI.textContent = '↑ YOUR SERVE — Move paddle';
    } else {
        ball.vy = speed * Math.cos(angle);
        ball.vx = speed * Math.sin(angle);
        matchStatusUI.textContent = '↓ AI SERVE — Get ready!';
    }
}

function updateBall() {
    if (!ball.active) return;

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall bounce (left/right inside table)
    if (ball.x - ball.r < table.x) {
        ball.x = table.x + ball.r;
        ball.vx = Math.abs(ball.vx);
        createSparks(ball.x, ball.y, '#ffffff', 5);
    }
    if (ball.x + ball.r > table.x + table.w) {
        ball.x = table.x + table.w - ball.r;
        ball.vx = -Math.abs(ball.vx);
        createSparks(ball.x, ball.y, '#ffffff', 5);
    }

    // --- Player paddle collision (bottom) ---
    if (
        ball.vy > 0 &&
        ball.y + ball.r >= player.y &&
        ball.y + ball.r <= player.y + player.h + 6 &&
        ball.x >= player.x - 5 &&
        ball.x <= player.x + player.w + 5
    ) {
        ball.y = player.y - ball.r;
        ball.vy = -Math.abs(ball.vy);
        const hitPos = (ball.x - player.x) / player.w;
        ball.vx = (hitPos - 0.5) * BALL_SPEED * 1.5;
        ball.lastHitter = 'player';

        // Swing speed mechanic: faster swing = faster ball
        const swingSpeed = Math.hypot(playerVelX, playerVelY);
        const swingBoost = Math.min(1.0 + swingSpeed * 0.18, 2.2); // max 2.2× speed
        const baseSpd = BALL_SPEED * swingBoost;
        const spd = Math.hypot(ball.vx, ball.vy);
        ball.vx = ball.vx / spd * baseSpd;
        ball.vy = ball.vy / spd * baseSpd;

        createSparks(ball.x, ball.y, swingBoost > 1.5 ? '#fbbf24' : '#4facfe', swingBoost > 1.5 ? 20 : 12);
        matchStatusUI.textContent = swingBoost > 1.5 ? '⚡ POWER SHOT!' : '↑ Nice hit!';
    }

    // --- AI paddle collision (top) ---
    if (
        ball.vy < 0 &&
        ball.y - ball.r <= ai.y + ai.h &&
        ball.y - ball.r >= ai.y - 6 &&
        ball.x >= ai.x - 5 &&
        ball.x <= ai.x + ai.w + 5
    ) {
        ball.y = ai.y + ai.h + ball.r;
        ball.vy = Math.abs(ball.vy);
        const hitPos2 = (ball.x - ai.x) / ai.w;
        ball.vx = (hitPos2 - 0.5) * BALL_SPEED * 1.3;
        ball.lastHitter = 'ai';
        // AI speed stays fixed
        const spd2 = Math.hypot(ball.vx, ball.vy);
        ball.vx = ball.vx / spd2 * BALL_SPEED;
        ball.vy = ball.vy / spd2 * BALL_SPEED;
        createSparks(ball.x, ball.y, '#f43f5e', 12);
        matchStatusUI.textContent = '↓ AI returns!';
    }

    // --- Ball goes past PLAYER (AI scores) ---
    if (ball.y - ball.r > table.y + table.h + 20) {
        ball.active = false;
        scoreAi++;
        showMsg('AI SCORES ❌', 1200);
        createSparks(ball.x, ball.y, '#f43f5e', 20);
        updateHUD();
        setTimeout(() => checkSetWin('ai'), 1300);
    }

    // --- Ball goes past AI (PLAYER scores) ---
    if (ball.y + ball.r < table.y - 20) {
        ball.active = false;
        scorePlayer++;
        showMsg('YOUR POINT ✅', 1200);
        createSparks(ball.x, ball.y, '#22c55e', 20);
        updateHUD();
        setTimeout(() => checkSetWin('player'), 1300);
    }
}

function updateAI() {
    if (!ball.active) return;

    const netY = table.y + table.h / 2;
    const minY = table.y + 4;          // top edge
    const maxY = netY - ai.h - 4;      // just above net (AI's boundary)
    const aiCX = ai.x + ai.w / 2;
    const aiCY = ai.y + ai.h / 2;

    // --- X tracking with medium difficulty ---
    const missX = (Math.random() < AI_MISS_CHANCE) ? (Math.random() - 0.5) * 50 : 0;
    const targetX = ball.x + missX;
    const diffX = targetX - aiCX;
    ai.x += Math.sign(diffX) * Math.min(Math.abs(diffX), AI_SPEED);
    ai.x = Math.max(table.x, Math.min(table.x + table.w - ai.w, ai.x));

    // --- Y tracking: rush net when ball is in AI half, retreat otherwise ---
    if (ball.vy < 0) {
        // Ball coming toward AI — move to intercept Y position
        const targetY = ball.y - ai.h / 2;
        const diffY = targetY - aiCY;
        ai.y += Math.sign(diffY) * Math.min(Math.abs(diffY), AI_SPEED * 0.8);
    } else {
        // Ball going to player — drift back toward baseline
        const retreatY = table.y + 14;
        ai.y += (retreatY - ai.y) * 0.05;
    }
    // Clamp AI to its half (top edge → just above net)
    ai.y = Math.max(minY, Math.min(maxY, ai.y));

    // Idle X wiggle when waiting
    if (ball.vy > 0) {
        aiWiggle += 0.04;
        ai.x += Math.sin(aiWiggle) * 0.3;
    }
}

function checkSetWin(lastScorer) {
    let setWinner = null;
    if (scorePlayer >= WIN_POINTS && scorePlayer - scoreAi >= 2) {
        setWinner = 'player'; setsPlayer++;
        showMsg(`SET ${currentSet} — YOU WIN! 🏆`, 2000);
    } else if (scoreAi >= WIN_POINTS && scoreAi - scorePlayer >= 2) {
        setWinner = 'ai'; setsAi++;
        showMsg(`SET ${currentSet} — AI WINS`, 2000);
    }

    updateHUD();

    if (setWinner) {
        scorePlayer = 0; scoreAi = 0;
        currentSet++;
        if (setsPlayer >= WIN_SETS || setsAi >= WIN_SETS) {
            setTimeout(endMatch, 2200);
        } else {
            setTimeout(() => serveBall(setWinner === 'player' ? 'ai' : 'player'), 2200);
        }
    } else {
        // Continue: loser of the point serves next
        setTimeout(() => serveBall(lastScorer === 'player' ? 'ai' : 'player'), 1400);
    }
}

function endMatch() {
    gameState = 'OVER';
    const won = setsPlayer > setsAi;
    resultTitle.textContent = won ? 'VICTORY!' : 'DEFEAT!';
    resultIcon.textContent = won ? '🏆' : '😞';
    resultSub.textContent = won ? 'You won the match!' : 'AI took the match!';
    finalScoreDiv.textContent = `${setsPlayer} – ${setsAi} sets`;
    gameOverScreen.classList.remove('hidden');
}

function updateHUD() {
    scorePlayerUI.textContent = scorePlayer;
    scoreAiUI.textContent = scoreAi;
    setPlayerUI.textContent = `Sets: ${setsPlayer}`;
    setAiUI.textContent = `Sets: ${setsAi}`;
    setLabelUI.textContent = `SET ${Math.min(currentSet, WIN_SETS * 2 - 1)}`;
}

// ============================================================
// PARTICLES
// ============================================================
function createSparks(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 3;
        particles.push({ x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, alpha: 1, color, size: 2 + Math.random() * 3 });
    }
}

function updateParticles() {
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.alpha -= 0.03; });
    particles = particles.filter(p => p.alpha > 0);
}

// ============================================================
// MESSAGE
// ============================================================
function showMsg(text, dur = 1000) {
    matchMsgEl.textContent = text;
    matchMsgEl.classList.remove('hidden');
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => matchMsgEl.classList.add('hidden'), dur);
}

// ============================================================
// DRAW
// ============================================================
function draw() {
    ctx.clearRect(0, 0, W, H);
    hctx.clearRect(0, 0, W, H);

    drawBackground();
    drawTable();
    drawNet();
    drawPlayerLabels();
    if (ball.active) drawBall();
    drawRacket(player, '#e63946', true);   // RED = YOU (bottom)
    drawRacket(ai, '#457b9d', false);  // BLUE = AI (top)
    drawParticles();
    drawHDR();
}

function drawBackground() {
    // Wood floor
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2c1a0e');
    g.addColorStop(1, '#4a2e14');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Subtle wood grain lines
    ctx.strokeStyle = 'rgba(255,200,120,0.06)'; ctx.lineWidth = 1;
    for (let i = 0; i < H; i += 18) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
    }
}

function drawTable() {
    const { x, y, w, h } = table;

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#144d23';
    ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
    ctx.shadowBlur = 0;

    // Table surface — dark green
    const tg = ctx.createLinearGradient(x, y, x, y + h);
    tg.addColorStop(0, '#1a6e2e');
    tg.addColorStop(0.5, '#24963d');
    tg.addColorStop(1, '#1a6e2e');
    ctx.fillStyle = tg;
    ctx.fillRect(x, y, w, h);

    // Table outer border (white)
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);

    // Center vertical line
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
    ctx.setLineDash([]);

    // Center horizontal line (where net is)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
}

function drawNet() {
    const { x, y, w, h } = table;
    const netY = y + h / 2;
    const netH = 14;

    // Net bar
    const ng = ctx.createLinearGradient(x, netY - netH / 2, x, netY + netH / 2);
    ng.addColorStop(0, 'rgba(220,220,220,0.9)');
    ng.addColorStop(1, 'rgba(150,150,150,0.7)');
    ctx.fillStyle = ng;
    ctx.fillRect(x - 4, netY - netH / 2, w + 8, netH);

    // Net mesh lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.8;
    const cols = 18;
    for (let i = 0; i <= cols; i++) {
        const nx = x + (w / cols) * i;
        ctx.beginPath(); ctx.moveTo(nx, netY - netH / 2); ctx.lineTo(nx, netY + netH / 2); ctx.stroke();
    }

    // Net post caps
    ctx.fillStyle = '#aaa';
    ctx.beginPath(); ctx.arc(x - 4, netY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w + 4, netY, 5, 0, Math.PI * 2); ctx.fill();
}

function drawPlayerLabels() {
    const { x, y, w, h } = table;
    ctx.save();

    // YOU label (bottom)
    ctx.fillStyle = 'rgba(230,57,70,0.9)';
    ctx.font = 'bold 13px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🔴 YOU', x + 8, y + h - 8);

    // AI label (top)
    ctx.fillStyle = 'rgba(69,123,157,0.9)';
    ctx.fillText('🔵 AI', x + 8, y + 20);

    ctx.restore();
}

function drawBall() {
    const r = ball.r;
    const bg = ctx.createRadialGradient(ball.x - r * 0.3, ball.y - r * 0.3, r * 0.1, ball.x, ball.y, r);
    bg.addColorStop(0, '#fffde7');
    bg.addColorStop(0.5, '#ffd700');
    bg.addColorStop(1, '#c8a200');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2); ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(ball.x - r * 0.3, ball.y - r * 0.3, r * 0.28, 0, Math.PI * 2); ctx.fill();

    // Shadow on table
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(ball.x, ball.y + r, r * 0.8, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
}

function drawRacket(pad, headColor, isPlayer) {
    const cx = pad.x + pad.w / 2;
    const cy = pad.y + pad.h / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Tilt: 45° for player (handle bottom-right), -45° for AI (handle top-left)
    const tiltAngle = isPlayer ? Math.PI * 0.25 : -Math.PI * 0.75;
    ctx.rotate(tiltAngle);

    // Dimensions (scaled to paddle size) - Made more oval (longer)
    const scale = Math.max(pad.w, pad.h) * 0.85;
    const headRX = scale * 0.35;   // narrower
    const headRY = scale * 0.52;   // longer (oval)
    const neckLen = scale * 0.25;
    const gripLen = scale * 0.60;
    const gripW = scale * 0.12;
    const frameW = scale * 0.12;

    // Head center is offset upward (handle extends down)
    const headCY = -neckLen * 0.6;

    // === SHADOW ===
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4;

    // === GRIP HANDLE ===
    const handleTop = headCY + headRY * 0.65;
    const handleBot = handleTop + gripLen;

    // Dark charcoal grip
    const gripGrad = ctx.createLinearGradient(-gripW, 0, gripW, 0);
    gripGrad.addColorStop(0, '#1a1a2e');
    gripGrad.addColorStop(0.5, '#2d2d44');
    gripGrad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gripGrad;
    ctx.beginPath();
    ctx.roundRect(-gripW / 2, handleTop, gripW, gripLen, gripW / 2);
    ctx.fill();

    // Grip tape wrap lines
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5;
    const tapeCount = 7;
    for (let i = 1; i < tapeCount; i++) {
        const ty = handleTop + (gripLen / tapeCount) * i;
        ctx.beginPath(); ctx.moveTo(-gripW / 2, ty); ctx.lineTo(gripW / 2, ty); ctx.stroke();
    }

    // === NECK / THROAT ===
    const throatW = gripW * 1.6;
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.moveTo(-throatW / 2, handleTop);
    ctx.lineTo(-headRX * 0.28, headCY + headRY * 0.6);
    ctx.lineTo(headRX * 0.28, headCY + headRY * 0.6);
    ctx.lineTo(throatW / 2, handleTop);
    ctx.closePath(); ctx.fill();

    // === HEAD FRAME (oval, thick) ===
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;

    // Head frame gradient based on type
    const outerFrame = ctx.createLinearGradient(-headRX, headCY - headRY, headRX, headCY + headRY);
    if (isPlayer) {
        outerFrame.addColorStop(0, '#ff4d4d');
        outerFrame.addColorStop(0.5, '#e63946');
        outerFrame.addColorStop(1, '#990000');
    } else {
        outerFrame.addColorStop(0, '#4facfe');
        outerFrame.addColorStop(0.5, '#457b9d');
        outerFrame.addColorStop(1, '#1d4e6b');
    }

    ctx.strokeStyle = outerFrame;
    ctx.lineWidth = frameW;
    ctx.beginPath();
    ctx.ellipse(0, headCY, headRX, headRY, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

    // Inner frame ridge (lighter color based on type)
    ctx.strokeStyle = isPlayer ? 'rgba(255,180,180,0.5)' : 'rgba(180,220,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, headCY, headRX - frameW * 0.6, headRY - frameW * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // === STRING GRID (clipped inside head) ===
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, headCY, headRX - frameW * 0.7, headRY - frameW * 0.7, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.2;
    // Horizontal strings
    const hRows = 10;
    for (let i = -hRows; i <= hRows; i++) {
        const sy = headCY + (headRY / hRows) * i;
        ctx.beginPath(); ctx.moveTo(-headRX, sy); ctx.lineTo(headRX, sy); ctx.stroke();
    }
    // Vertical strings
    const vCols = 8;
    for (let j = -vCols; j <= vCols; j++) {
        const sx = (headRX / vCols) * j;
        ctx.beginPath(); ctx.moveTo(sx, headCY - headRY); ctx.lineTo(sx, headCY + headRY); ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
}

// Helper: darken a hex color
function shadeColor(hex, amt) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
    const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
    return `rgb(${r},${g},${b})`;
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawHDR() {
    // Overhead lamp bloom
    const g = hctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.7);
    g.addColorStop(0, 'rgba(255,240,200,0.15)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    hctx.fillStyle = g; hctx.fillRect(0, 0, W, H);

    // Table green glow
    const tg = hctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, table.w * 0.7);
    tg.addColorStop(0, 'rgba(34,197,94,0.08)');
    tg.addColorStop(1, 'rgba(0,0,0,0)');
    hctx.fillStyle = tg; hctx.fillRect(0, 0, W, H);
}

// ============================================================
// GAME LOOP
// ============================================================
function tick() {
    requestAnimationFrame(tick);
    if (gameState === 'PLAY') {
        updatePlayerVelocity();
        updateBall();
        updateAI();
        updateParticles();
    } else {
        updateParticles();
    }
    draw();
}

// ============================================================
// BUTTONS
// ============================================================
startBtn.addEventListener('click', startMatch);
restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');

    const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
    if (seconds > 60) {
        initBottomAndSideAds();
        gameRecordTime = Date.now(); 
    }

    startMatch();
});

// ============================================================
// INIT
// ============================================================
resize();
updateHUD();
tick();
