/**
 * Arcade Tennis 2D – Enhanced
 * ✅ Player moves FREELY (left/right/front/back) like Table Tennis game
 * ✅ Symmetric rectangular court — equal space each side
 * ✅ Score above court, doesn't overlap AI player
 * ✅ Ball speed ramps up over time (plays.org mechanic)
 */

// ===================================
// AUDIO
// ===================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, dur, vol = 0.1) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        osc.start(); osc.stop(audioCtx.currentTime + dur);
    } catch(e) {}
}
const SFX = {
    hit:      () => { playSound(620,'triangle',0.09,0.14); playSound(310,'triangle',0.04,0.07); },
    aiHit:    () => playSound(400,'triangle',0.09,0.11),
    score:    () => { [523,659,784].forEach((f,i)=>setTimeout(()=>playSound(f,'sine',0.22),i*120)); },
    miss:     () => playSound(150,'sawtooth',0.35,0.1),
    gameOver: () => { [587,659,784,1047].forEach((f,i)=>setTimeout(()=>playSound(f,'sine',0.38),i*125)); }
};

// ===================================
// SUPABASE
// ===================================
let gameStartTime=null, durationSent=false, gameStartedFlag=false;
let gameRecordTime = null;

// --- Supabase Config ---
const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;

// --- Session Tracking ---
let sessionId = null;
let sessionRowId = null;

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
async function updSession(f) {
    if (!supabase_c||!sessionId) return;
    try { await supabase_c.from('game_sessions').update(f).eq('session_id',sessionId); } catch(e) {}
}
window.addEventListener('beforeunload', ()=>{ if(gameStartTime&&!durationSent){ updSession({duration_seconds:Math.round((Date.now()-gameStartTime)/1000),end_reason:'tab_close'}); durationSent=true; } });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&gameStartTime&&!durationSent){ updSession({duration_seconds:Math.round((Date.now()-gameStartTime)/1000),end_reason:'background'}); durationSent=true; } });



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
        window.trackGameEvent(`game_duration_tennis_${seconds}_${reason}_${getBrowser()}`, {
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


        sendDurationOnExit("background_tennis");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_tennis");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        const placementId = getPlacementId();
        window.trackGameEvent(`exit_before_game_tennis_${osKey}`, {
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
    const gameSlug = "tennis";
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


// ===================================
// CANVAS + LAYOUT
// ===================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let W, H;

// Court object (computed in resize — symmetric rectangle)
let court = { x:0, y:0, w:0, h:0 };
let netY = 0;   // net centre Y (absolute screen coords)

// Hit zones for player and AI (can move freely in their HALF)
// Player half: netY → court.y + court.h
// AI half:     court.y → netY

const CHAR_R    = 22;   // character radius (for collision/drawing)
const RACKET_W  = 72;   // hit box half-width around character x
const RACKET_H  = 18;   // hit detection zone height
const BALL_R    = 11;
const WIN_SCORE = 15;

// ===================================
// GAME STATE
// ===================================
// Player + AI positions (absolute screen coords)
let player = { x:0, y:0 };
let ai     = { x:0, y:0 };
let targetAiX = 0;  // AI smooth-tracks ball
let prevPlayer = { x:0, y:0 };
let playerVel  = { x:0, y:0 };

// Ball
const ball = { x:0, y:0, vx:0, vy:0 };

let playerScore=0, aiScore=0;
let playerSets=0, aiSets=0;
let gameState = 'play';  // 'play' | 'gameover'
let servingPlayer = 'player';
let speedBase = 360;     // lower starting ball speed (was 480)
let speedTimer = 0;

// Animation
let playerSwing = 0, aiSwing = 0;
let pointPending = false;
let ballTrail = [];

// ===================================
// RESIZE — compute symmetric court with bottom ad space
// ===================================
const AD_BOTTOM_H = 65;  // reserve this many px at bottom for ad banner

function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;

    // Score HUD at top, ad at bottom
    const HUD_H = 88; // increased to accommodate new compact scoreboard and turn indicator
    const pad   = 10;

    // Available area is between HUD and ad banner
    const availH = H - HUD_H - AD_BOTTOM_H - pad * 2;
    const availW = W - pad * 2;
    const targetRatio = 0.8;  // widened court width / height (was 0.56)

    let cH = availH;
    let cW = cH * targetRatio;
    if (cW > availW) { cW = availW; cH = cW / targetRatio; }

    court.w = cW;
    court.h = cH;
    court.x = (W - cW) / 2;
    court.y = HUD_H + pad + (availH - cH) / 2;

    netY = court.y + court.h / 2;

    // Default positions — racket head centered, player in lower half
    player.x = court.x + court.w / 2;
    player.y = netY + court.h * 0.22;

    ai.x = court.x + court.w / 2;
    ai.y = court.y + court.h * 0.13;
    targetAiX = ai.x;
}

// ===================================
// INPUT — mouse/touch moves RACKET FREELY in PLAYER HALF
// Exactly like the Table Tennis game — direct X+Y mapping
// ===================================
const RACKET_INPUT_MARGIN = 42;  // keep racket inside court boundaries

function applyInput(screenX, screenY) {
    if (gameState !== 'play') return;

    // X: constrained so racket stays inside court
    player.x = Math.max(court.x + RACKET_INPUT_MARGIN, Math.min(court.x + court.w - RACKET_INPUT_MARGIN, screenX));

    // Y: constrained to player's half (below net), up to near the bottom edge
    const minY = netY + RACKET_INPUT_MARGIN;
    const maxY = court.y + court.h - RACKET_INPUT_MARGIN;
    player.y = Math.max(minY, Math.min(maxY, screenY));
}

// Mouse
canvas.addEventListener('mousemove', e => applyInput(e.clientX, e.clientY));
canvas.addEventListener('mousedown', e => applyInput(e.clientX, e.clientY));

// Touch
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    applyInput(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    applyInput(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

window.addEventListener('resize', () => { resize(); });

// ===================================
// DRAWING
// ===================================
function drawCourt() {
    // Full-page dark bg
    ctx.fillStyle = '#111a11';
    ctx.fillRect(0, 0, W, H);

    // Grass checkerboard outside court
    const ckS = 36;
    for (let gx = 0; gx < W; gx += ckS)
        for (let gy = 0; gy < H; gy += ckS) {
            const even = (Math.floor(gx/ckS)+Math.floor(gy/ckS))%2===0;
            ctx.fillStyle = even ? 'rgba(20,60,20,0.7)' : 'rgba(15,45,15,0.7)';
            ctx.fillRect(gx, gy, ckS, ckS);
        }

    const {x, y, w, h} = court;

    // ---- Court stripes (symmetric – same stripe height both halves) ----
    const STRIPE_N = 14;  // must be even so both halves match
    const sh = h / STRIPE_N;
    for (let i = 0; i < STRIPE_N; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#3aaa3a' : '#2e8a2e';
        ctx.fillRect(x, y + i * sh, w, sh);
    }

    // ---- Court lines ----
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);  // outer boundary

    ctx.lineWidth = 2;
    const alley = w * 0.055;

    // Doubles sidelines
    ctx.beginPath();
    ctx.moveTo(x + alley, y);       ctx.lineTo(x + alley, y + h);
    ctx.moveTo(x + w - alley, y);  ctx.lineTo(x + w - alley, y + h);
    ctx.stroke();

    // Service lines (each 25% from baseline)
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.25);    ctx.lineTo(x + w, y + h * 0.25);
    ctx.moveTo(x, y + h * 0.75);    ctx.lineTo(x + w, y + h * 0.75);
    ctx.stroke();

    // Centre service line (between service lines)
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + h * 0.25); ctx.lineTo(x + w/2, y + h * 0.75);
    ctx.stroke();

    // ---- NET ----
    const netW_px = w + 20;
    const netH_px = 24;
    const netX = x - 10;

    // Net posts
    ctx.fillStyle = '#aaa';
    ctx.fillRect(netX - 10, netY - netH_px/2 - 5, 10, netH_px + 10);
    ctx.fillRect(netX + netW_px, netY - netH_px/2 - 5, 10, netH_px + 10);

    // Net body
    const ng = ctx.createLinearGradient(0, netY - netH_px/2, 0, netY + netH_px/2);
    ng.addColorStop(0,'#e0e0e0'); ng.addColorStop(0.5,'#aaa'); ng.addColorStop(1,'#e0e0e0');
    ctx.fillStyle = ng;
    ctx.fillRect(netX, netY - netH_px/2, netW_px, netH_px);

    // Net mesh
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.7;
    for (let nx = netX+6; nx < netX+netW_px; nx += 9) {
        ctx.beginPath(); ctx.moveTo(nx, netY-netH_px/2); ctx.lineTo(nx, netY+netH_px/2); ctx.stroke();
    }
    for (let ny2 = netY-netH_px/2+5; ny2 < netY+netH_px/2; ny2 += 5) {
        ctx.beginPath(); ctx.moveTo(netX, ny2); ctx.lineTo(netX+netW_px, ny2); ctx.stroke();
    }
    // White top band
    ctx.fillStyle = '#fff'; ctx.fillRect(netX-8, netY-netH_px/2-3, netW_px+16, 5);

    // ---- YOU / AI labels (subtle, inside court near baselines) ----
    ctx.save();
    ctx.font = `bold ${Math.floor(w * 0.045)}px "Segoe UI", Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,220,255,0.4)';
    ctx.fillText('YOU', x + w/2, y + h * 0.88);
    ctx.fillStyle = 'rgba(255,70,100,0.4)';
    ctx.fillText('AI',  x + w/2, y + h * 0.12);
    ctx.restore();
}

// Draw a player/AI character with racket
function drawCharacter(cx, cy, isPlayer, swingAmt) {
    const bodyColor  = isPlayer ? '#3a7fff' : '#ff4444';
    const shirtLight = isPlayer ? '#6699ff' : '#ff7777';
    const hair       = isPlayer ? '#3a1a00' : '#111111';

    ctx.save();
    ctx.translate(cx, cy);

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(0, CHAR_R-2, CHAR_R*0.9, CHAR_R*0.28, 0, 0, Math.PI*2); ctx.fill();

    // Shoes
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.ellipse(-9, CHAR_R-4, 10, 5, 0.25, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 9, CHAR_R-4, 10, 5,-0.25, 0, Math.PI*2); ctx.fill();

    // Shorts
    ctx.fillStyle = isPlayer ? '#eee' : '#1a1a1a';
    ctx.beginPath(); ctx.ellipse(0, CHAR_R*0.3, 14, 11, 0, 0, Math.PI*2); ctx.fill();

    // Shirt (radial gradient)
    const sg = ctx.createRadialGradient(-3,-12,0, 0,-10, 18);
    sg.addColorStop(0, shirtLight); sg.addColorStop(1, bodyColor);
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.ellipse(0, -10, 15, 19, 0, 0, Math.PI*2); ctx.fill();

    // Head
    ctx.fillStyle = '#f5c882';
    ctx.beginPath(); ctx.arc(0, -38, 15, 0, Math.PI*2); ctx.fill();

    // Hair
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.ellipse(0, -47, 15, 9, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-5,-52, 6, 5,-0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 5,-52, 6, 5, 0.3, 0, Math.PI*2); ctx.fill();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(-5,-38, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 5,-38, 2, 0, Math.PI*2); ctx.fill();

    // Racket (on the right)
    drawRacket(20, -14, isPlayer, swingAmt);

    ctx.restore();
}

function drawRacket(rx, ry, isPlayer, swing) {
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(swing * 0.85);

    const fc = isPlayer ? '#dd1a1a' : '#1a44cc';
    const fd = isPlayer ? '#880000' : '#001188';

    // Handle
    const hg = ctx.createLinearGradient(-3.5,0,3.5,0);
    hg.addColorStop(0,'#111'); hg.addColorStop(0.5,'#444'); hg.addColorStop(1,'#111');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.roundRect(-3.5, 2, 7, 26, 2); ctx.fill();
    ctx.strokeStyle='rgba(55,55,55,0.7)'; ctx.lineWidth=0.9;
    for(let g=5;g<24;g+=6){ ctx.beginPath(); ctx.moveTo(-3.5,g); ctx.lineTo(3.5,g+2); ctx.stroke(); }
    ctx.fillStyle='#0a0a0a'; ctx.beginPath(); ctx.roundRect(-4.5,26,9,5,2); ctx.fill();

    // Throat
    ctx.fillStyle = fc;
    ctx.beginPath();
    ctx.moveTo(-4.5,2); ctx.lineTo(4.5,2); ctx.lineTo(7.5,-4); ctx.lineTo(-7.5,-4);
    ctx.closePath(); ctx.fill();

    // Head oval
    const HX=9, HY=12, headCY=-15;
    ctx.shadowColor='rgba(0,0,0,0.3)'; ctx.shadowBlur=4;
    const fg=ctx.createLinearGradient(-HX,headCY,HX,headCY);
    fg.addColorStop(0,fd); fg.addColorStop(0.4,fc); fg.addColorStop(0.6,fc); fg.addColorStop(1,fd);
    ctx.strokeStyle=fg; ctx.lineWidth=6.5;
    ctx.beginPath(); ctx.ellipse(0,headCY,HX,HY,0,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0;

    // Highlight
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.ellipse(0,headCY,HX-2,HY-2,0,Math.PI*1.1,Math.PI*1.85); ctx.stroke();

    // Strings (clipped)
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0,headCY,HX-3,HY-3,0,0,Math.PI*2); ctx.clip();
    ctx.fillStyle='rgba(245,245,220,0.1)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=0.6;
    for(let sx=-(HX-4);sx<=(HX-4);sx+=3.8){
        const hw=(HY-3)*Math.sqrt(Math.max(0,1-(sx/HX)**2));
        ctx.beginPath(); ctx.moveTo(sx,headCY-hw+1); ctx.lineTo(sx,headCY+hw-1); ctx.stroke();
    }
    for(let sy=-(HY-4);sy<=(HY-4);sy+=3.8){
        const hw=(HX-3)*Math.sqrt(Math.max(0,1-(sy/HY)**2));
        ctx.beginPath(); ctx.moveTo(-hw,headCY+sy); ctx.lineTo(hw,headCY+sy); ctx.stroke();
    }
    ctx.fillStyle=isPlayer?'rgba(255,200,0,0.65)':'rgba(0,220,255,0.55)';
    ctx.font=`bold 7px Arial Black`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Y',0,headCY);
    ctx.restore();

    ctx.restore();
}

function drawBall() {
    const {x, y} = ball;

    // Trail
    ballTrail.forEach((p, i) => {
        const a = (i / ballTrail.length) * 0.28;
        const r = BALL_R * (0.3 + i / ballTrail.length * 0.55);
        ctx.fillStyle = `rgba(200,250,0,${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2); ctx.fill();
    });

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(x+2, y+4, BALL_R*0.65, BALL_R*0.32, 0, 0, Math.PI*2); ctx.fill();

    // Ball
    const bg = ctx.createRadialGradient(x-BALL_R*0.33, y-BALL_R*0.33, BALL_R*0.1, x, y, BALL_R);
    bg.addColorStop(0,'#effe88'); bg.addColorStop(0.55,'#ccee00'); bg.addColorStop(1,'#7a9400');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(x, y, BALL_R, 0, Math.PI*2); ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.beginPath(); ctx.ellipse(x-3.5, y-3.5, BALL_R*0.36, BALL_R*0.24, -0.5, 0, Math.PI*2); ctx.fill();

    // Seam
    ctx.strokeStyle='rgba(100,130,0,0.42)'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.arc(x, y, BALL_R-1.5, 0.5, 2.7); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, BALL_R-1.5, 3.8, 6.0); ctx.stroke();
}

// ===================================
// GAME LOGIC
// ===================================
function getRandomTargetX() {
    const margin = court.w * 0.12;
    return court.x + margin + Math.random() * (court.w - margin * 2);
}

function resetBall() {
    pointPending = false;
    ballTrail = [];
    const sp = (servingPlayer === 'player');

    // Ball starts near the serving player
    ball.x = sp ? player.x : ai.x;
    ball.y = sp ? player.y - CHAR_R - BALL_R - 4 : ai.y + CHAR_R + BALL_R + 4;

    const targetX = getRandomTargetX();
    const targetY = sp ? ai.y : player.y;
    const dist = Math.hypot(targetX - ball.x, targetY - ball.y);
    ball.vx = (targetX - ball.x) / dist * speedBase;
    ball.vy = (targetY - ball.y) / dist * speedBase;

    // Serve indicator
    const uiTI = document.getElementById('turn-indicator');
    uiTI.textContent = sp ? 'YOUR SERVE 🎾' : 'AI SERVING 🎾';
    uiTI.classList.remove('hidden','ai');
    if(!sp) uiTI.classList.add('ai');
    setTimeout(()=>uiTI.classList.add('hidden'), 1700);
}

function updateSetUI() {
    document.getElementById('player-sets-val').textContent = playerSets;
    document.getElementById('ai-sets-val').textContent     = aiSets;
}

function awardPoint(winner) {
    if (pointPending) return;
    pointPending = true;
    SFX.miss();

    if (winner === 'player') { playerScore++; }
    else                     { aiScore++;     }

    document.getElementById('player-score').textContent = playerScore;
    document.getElementById('ai-score').textContent     = aiScore;

    // Check for Set win (15 pts)
    if (playerScore >= WIN_SCORE) {
        playerSets++;
        updateSetUI();
        SFX.score();
        if (playerSets >= 3) {
            setTimeout(endGame, 1000);
        } else {
            // Start next set after delay
            playerScore = 0; aiScore = 0;
            document.getElementById('player-score').textContent = '0';
            document.getElementById('ai-score').textContent = '0';
            servingPlayer = 'player';
            setTimeout(() => { resetBall(); }, 1500);
        }

        const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
        if (seconds > (window.PMG_TICK_RATE || 60)) {
            if (typeof syncPMGLayout === 'function') syncPMGLayout();
            gameRecordTime = Date.now(); 
        }

    } else if (aiScore >= WIN_SCORE) {
        aiSets++;
        updateSetUI();
        SFX.score();
        if (aiSets >= 3) {
            setTimeout(endGame, 1000);
        } else {
            // Start next set after delay
            playerScore = 0; aiScore = 0;
            document.getElementById('player-score').textContent = '0';
            document.getElementById('ai-score').textContent = '0';
            servingPlayer = 'ai';
            setTimeout(() => { resetBall(); }, 1500);
        }
    } else {
        SFX.score();
        setTimeout(() => { resetBall(); }, 1200);
    }
}

function updateGame(dt) {
    if (gameState !== 'play' || pointPending) return;

    // Track player velocity (px/sec)
    playerVel.x = (player.x - prevPlayer.x) / dt;
    playerVel.y = (player.y - prevPlayer.y) / dt;
    prevPlayer.x = player.x;
    prevPlayer.y = player.y;

    // Speed ramp (every 3 sec)
    speedTimer += dt;
    if (speedTimer >= 3) {
        speedTimer -= 3;
        if (speedBase < 800) speedBase += 8; // slower ramp (was 12)
    }

    // AI — MEDIUM DIFFICULTY: tracks ball with reasonable error + speed cap
    if (ball.vy < 0) {
        // Reduced positional error (±11% of court width) — Medium
        const aiError = (Math.random() - 0.5) * court.w * 0.22;
        const diff = (ball.x + aiError) - targetAiX;
        targetAiX += diff * 0.055;  // Faster reaction (Medium) vs previously 0.038
    } else {
        // When ball is coming to player, AI drifts back toward centre slowly
        targetAiX += (court.x + court.w / 2 - targetAiX) * 0.012;
    }
    // AI max speed = 48% of ball speed, capped at 280px/s (Medium)
    const aiSpd = Math.min(speedBase * 0.48, 280);
    const aiDiff = targetAiX - ai.x;
    if (Math.abs(aiDiff) > 3) ai.x += Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), aiSpd * dt);

    // Clamp AI to its half
    ai.x = Math.max(court.x + CHAR_R, Math.min(court.x + court.w - CHAR_R, ai.x));
    ai.y = Math.max(court.y + CHAR_R, Math.min(netY - CHAR_R - 4, ai.y));

    // Move ball
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Trail
    ballTrail.push({ x: ball.x, y: ball.y });
    if (ballTrail.length > 7) ballTrail.shift();

    // ---- Side wall bounce (left/right) ----
    if (ball.x - BALL_R < court.x)         { ball.x = court.x + BALL_R;         ball.vx = Math.abs(ball.vx); }
    if (ball.x + BALL_R > court.x + court.w){ ball.x = court.x + court.w - BALL_R; ball.vx = -Math.abs(ball.vx); }

    // ---- PLAYER RACKET COLLISION ----
    // Ball must be moving toward player (vy > 0), and ball Y is near player Y
    if (ball.vy > 0
        && ball.y + BALL_R >= player.y - RACKET_H
        && ball.y - BALL_R <= player.y + RACKET_H
        && ball.x >= player.x - RACKET_W
        && ball.x <= player.x + RACKET_W)
    {
        SFX.hit();
        playerSwing = 1.1;

        // Dynamic speed: if player moves racket fast, ball goes faster (table tennis style)
        const racketSpeed = Math.hypot(playerVel.x, playerVel.y);
        const boost = Math.min(racketSpeed * 0.35, 350); // cap boost at 350
        const hitSpeed = speedBase + boost;

        const targetX = getRandomTargetX();
        const dist = Math.hypot(targetX - ball.x, ai.y - ball.y);
        ball.vx = (targetX - ball.x) / dist * hitSpeed;
        ball.vy = (ai.y - ball.y)    / dist * hitSpeed;
        ball.y  = player.y - RACKET_H - BALL_R - 1;
        targetAiX = targetX;
    }

    // ---- AI RACKET COLLISION ----
    if (ball.vy < 0
        && ball.y - BALL_R <= ai.y + RACKET_H
        && ball.y + BALL_R >= ai.y - RACKET_H
        && ball.x >= ai.x - RACKET_W
        && ball.x <= ai.x + RACKET_W)
    {
        SFX.aiHit();
        aiSwing = 1.1;
        const targetX = getRandomTargetX();
        const dist = Math.hypot(targetX - ball.x, player.y - ball.y);
        ball.vx = (targetX - ball.x)  / dist * speedBase;
        ball.vy = (player.y - ball.y) / dist * speedBase;
        ball.y  = ai.y + RACKET_H + BALL_R + 1;
    }

    // ---- SCORING ----
    if (ball.y - BALL_R > court.y + court.h + 15) awardPoint('ai');
    if (ball.y + BALL_R < court.y - 15)            awardPoint('player');
}

// ===================================
// START / END
// ===================================
function startGame() {
    if (!gameStartedFlag) { gameStartedFlag=true; gameStartTime=Date.now(); initSupabase(); 

        gameRecordTime = Date.now(); 
    }
    playerScore=0; aiScore=0;
    playerSets=0; aiSets=0; updateSetUI();
    speedBase=360; speedTimer=0;
    servingPlayer='player';
    gameState='play';
    pointPending=false; ballTrail=[];
    prevPlayer.x = player.x; prevPlayer.y = player.y;
    playerVel.x = 0; playerVel.y = 0;

    document.getElementById('player-score').textContent='0';
    document.getElementById('ai-score').textContent='0';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');

    resize();
    resetBall();
}

function endGame() {
    gameState='gameover'; SFX.gameOver();
    const win = playerSets >= 3;
    document.getElementById('result-title').textContent = win ? 'SERIES VICTORY! 🏆' : 'AI WINS SERIES!';
    document.getElementById('result-emoji').textContent = win ? '🏆' : '😤';
    document.getElementById('result-desc').textContent  = win
        ? `Match Champion! You won ${playerSets}–${aiSets} sets.`
        : `AI won the match ${aiSets}–${playerSets}. Good effort!`;
    document.getElementById('game-over-screen').classList.remove('hidden');
    updSession({ player_score:playerSets, ai_score:aiSets, winner:win?'player':'ai' });
}

// ===================================
// ANIMATION LOOP
// ===================================
let lastTS = 0;
function loop(ts) {
    requestAnimationFrame(loop);
    const dt = Math.min((ts - lastTS) / 1000, 0.05);
    lastTS = ts;

    ctx.clearRect(0, 0, W, H);
    drawCourt();
    updateGame(dt);

    // Draw AI character (top half)
    drawCharacter(ai.x, ai.y, false, -aiSwing);
    // Draw ball
    drawBall();
    // Draw player on top (near side)
    drawCharacter(player.x, player.y, true, playerSwing);

    // Decay swing animations
    playerSwing = Math.max(0, playerSwing - dt * 4);
    aiSwing     = Math.max(0, aiSwing - dt * 4);
}

// ===================================
// BOOT
// ===================================
document.getElementById('start-btn').onclick  = startGame;
document.getElementById('restart-btn').onclick = startGame;

resize();
requestAnimationFrame(loop);
startGame();
