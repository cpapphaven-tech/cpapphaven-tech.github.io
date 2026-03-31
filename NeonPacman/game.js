// ===================================
// Core game mechanics based on open source 
// Pac-Man by Talha Bin Yousaf (MIT License)
// https://github.com/he-is-talha/02-Pac-Man-Game
// Adapted, styled, and expanded for Playmix Games
// ===================================
// SUPABASE & ANALYTICS SETUP
// ===================================
let gameStartTime = null, durationSent = false, gameStartedFlag = false;
let gameRecordTime = null;

const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;
let sessionId = null;

async function initSupabase() {
    if (!window.supabase) { setTimeout(initSupabase, 500); return; }
    if (!supabaseClient) {
        const { createClient } = window.supabase;
        supabaseClient = createClient(supabaseUrl, supabaseKey);
    }
    await startGameSession();
    await markSessionStarted();
}

async function updSession(f) {
    if (!supabaseClient || !sessionId) return;
    try { await supabaseClient.from('game_sessions').update(f).eq('session_id', sessionId); } catch(e) {}
}

window.addEventListener('beforeunload', () => { 
    if(gameStartTime && !durationSent){ 
        updSession({duration_seconds: Math.round((Date.now()-gameStartTime)/1000), end_reason: 'tab_close'}); 
        durationSent = true; 
    } 
});

document.addEventListener('visibilitychange', () => { 
    if(document.hidden && gameStartTime && !durationSent){ 
        updSession({duration_seconds: Math.round((Date.now()-gameStartTime)/1000), end_reason: 'background'}); 
        durationSent = true; 
    } 
});

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
    if (/MSIE|Trident/i.test(ua)) return "Internet Explorer";
    return "Unknown";
}

function getPlacementId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('utm_content') || urlParams.get('placementid') || "unknown";
}

async function startGameSession() {
    if (!supabaseClient) return;
    sessionId = generateSessionId();
    try {
        await supabaseClient.from('game_sessions').insert([{
            session_id: sessionId,
            game_slug: "neonpacman",
            placement_id: getPlacementId(),
            user_agent: navigator.userAgent,
            os: getOS(),
            browser: getBrowser(),
            country: "Unknown", // Simplified for brevity
            started_game: false,
            bounced: false
        }]);
    } catch (e) { }
}

async function markSessionStarted() {
    if (!supabaseClient || !sessionId) return;
    try { await supabaseClient.from('game_sessions').update({ started_game: true }).eq('session_id', sessionId); } catch (e) { }
}

// ===================================
// AUDIO SYSTEM (Web Audio API)
// ===================================
let audioCtx = null;
let backgroundOsc = null;
let backgroundGain = null;
let backgroundInterval = null;
let backgroundStarted = false;

function getAudioContext() {
    if (audioCtx) return audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    return audioCtx;
}

function startBackgroundSound() {
    if (backgroundStarted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        backgroundOsc = ctx.createOscillator();
        backgroundGain = ctx.createGain();
        backgroundOsc.connect(backgroundGain);
        backgroundGain.connect(ctx.destination);
        backgroundOsc.type = "sawtooth";
        backgroundOsc.frequency.setValueAtTime(200, ctx.currentTime);
        backgroundGain.gain.setValueAtTime(0.015, ctx.currentTime);
        backgroundOsc.start(ctx.currentTime);
        backgroundStarted = true;
        // Siren: slowly rise and fall like original Pac-Man
        backgroundInterval = setInterval(() => {
            if (!backgroundOsc || !ctx) return;
            const t = Date.now() / 1000;
            const freq = 180 + 130 * Math.sin(t * 0.85);
            backgroundOsc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.08);
        }, 80);
    } catch (e) {}
}

function stopBackgroundSound() {
    if (backgroundOsc) {
        try { backgroundOsc.stop(); } catch (e) {}
        backgroundOsc = null;
    }
    if (backgroundInterval) clearInterval(backgroundInterval);
    backgroundStarted = false;
}

function playPelletSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(680, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
}

function playDeathSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
}

function playWinSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            }, i * 150);
        });
    } catch(e) {}
}

// ===================================
// GAME ENGINE
// ===================================
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const tileSize = 20; // Changed for bigger canvas matching
const wallSize = 16;
const cols = 28;
const rows = 31;

canvas.width = cols * tileSize;
canvas.height = rows * tileSize;

// 0: empty, 1: wall, 2: pellet, 3: power pellet, 4: gate
const levelLayout = [
  "1111111111111111111111111111",
  "1222222222112222222222222221",
  "1211112112112112112111112121",
  "1311112112112112112111112131",
  "1222222222222222222222222221",
  "1211112111112111112111112121",
  "1222222112222222211222222221",
  "1111112112111112112111111111",
  "0000012112110002112110000000",
  "1111112112111112112111111111",
  "1222222222222112222222222221",
  "1211112111112111112111112121",
  "1222212222222222222222122221",
  "1111212111114441111122111111",
  "0000212110000000000122110000",
  "1111212110111111101122111111",
  "1222222220222222202222222221",
  "1211112112111112112111112121",
  "1222222112222222211222222221",
  "1111112112111112112111111111",
  "0000012112110002112110000000",
  "1111112112111112112111111111",
  "1222222222222222222222222221",
  "1211112111112111112111112121",
  "1311112222222112222222112131",
  "1222222111112111111122222221",
  "1111112112222222212111111111",
  "1222222222112222112222222221",
  "1211111112112112111111112121",
  "1222222222222222222222222221",
  "1111111111111111111111111111",
];

let map = [];
let pelletsRemaining = 0;

const pacman = { x: 1, y: 29, dirX: 0, dirY: 0, nextDirX: 0, nextDirY: 0, speed: 9, startX: 1, startY: 29 };

const startGhosts = [
    { x: 12, y: 14, startX: 12, startY: 14, dirX: 1, dirY: 0, color: "#ff0055" }, // Blinky (Neon Red/Pink)
    { x: 15, y: 14, startX: 15, startY: 14, dirX: -1, dirY: 0, color: "#00ffff" }, // Inky (Neon Cyan)
    { x: 12, y: 16, startX: 12, startY: 16, dirX: 1, dirY: 0, color: "#ff9900" }, // Clyde (Neon Orange)
    { x: 15, y: 16, startX: 15, startY: 16, dirX: -1, dirY: 0, color: "#ffb8ff" }, // Pinky (Neon Pink)
];
let ghosts = [];

let score = 0;
let lives = 3;
let gameOver = true;
let gamePaused = true;
let lastTime = 0;
let gameTime = 0;
let animationFrameId = null;
let level = 1;
let floatingTexts = [];

// UI Elements
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const finalScoreEl = document.getElementById("final-score");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const levelCompleteScreen = document.getElementById("level-complete-screen");

function initMap() {
    map = [];
    pelletsRemaining = 0;
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            let val = Number(levelLayout[r][c]);
            if (val === 2 || val === 3) pelletsRemaining++;
            row.push(val);
        }
        map.push(row);
    }
}

function resetEntities() {
    pacman.x = pacman.startX;
    pacman.y = pacman.startY;
    pacman.dirX = 0;
    pacman.dirY = 0;
    pacman.nextDirX = 0;
    pacman.nextDirY = 0;

    ghosts = startGhosts.map(g => ({ ...g }));
    
    // Slightly increase speed per level (slowed down overall)
    pacman.speed = Math.min(6 + (level * 0.4), 10);
}

function updateUI() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
}

function startGame() {
    if (!gameStartedFlag) {
        gameStartedFlag = true;
        gameStartTime = Date.now();
        gameRecordTime = Date.now();
        initSupabase();
    }
    
    score = 0;
    lives = 3;
    level = 1;
    initMap();
    startLevel();
    
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    levelCompleteScreen.classList.add("hidden");
    
    getAudioContext()?.resume();
    startBackgroundSound();
}

function startLevel() {
    resetEntities();
    updateUI();
    gameOver = false;
    gamePaused = false;
    lastTime = performance.now();
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(loop);
}

function stopLoop() {
    gamePaused = true;
    cancelAnimationFrame(animationFrameId);
    stopBackgroundSound();
}

function isWall(col, row) {
    if (row < 0 || row >= rows || col < 0 || col >= cols) return false; // Tunnel edges
    const val = map[row][col];
    return val === 1 || val === 4; // Wall or Gate
}

function handleInput() {
    const centerCol = Math.round(pacman.x);
    const centerRow = Math.round(pacman.y);
    const offsetX = Math.abs(pacman.x - centerCol);
    const offsetY = Math.abs(pacman.y - centerRow);

    const aligned = offsetX < 0.35 && offsetY < 0.35;
    const stopped = pacman.dirX === 0 && pacman.dirY === 0;

    if ((aligned || stopped) && (pacman.nextDirX !== 0 || pacman.nextDirY !== 0)) {
        const targetCol = centerCol + pacman.nextDirX;
        const targetRow = centerRow + pacman.nextDirY;
        if (!isWall(targetCol, targetRow)) {
            pacman.dirX = pacman.nextDirX;
            pacman.dirY = pacman.nextDirY;
        }
    }
}

function movePacman(delta) {
    handleInput();

    const speedPerFrame = pacman.speed * delta;
    let newX = pacman.x + pacman.dirX * speedPerFrame;
    let newY = pacman.y + pacman.dirY * speedPerFrame;

    // Tunnel wrap
    if (newX < -0.5) newX = cols - 0.5;
    if (newX >= cols) newX = 0;

    const nextCol = Math.round(newX);
    const nextRow = Math.round(newY);

    if (isWall(nextCol, nextRow)) {
        // Snap to grid
        pacman.dirX = 0;
        pacman.dirY = 0;
        pacman.x = Math.round(pacman.x);
        pacman.y = Math.round(pacman.y);
        return;
    }

    pacman.x = newX;
    pacman.y = newY;

    // Eat pellets
    const col = Math.round(pacman.x);
    const row = Math.round(pacman.y);
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
        if (map[row][col] === 2 || map[row][col] === 3) {
            playPelletSound();
            let pts = 0;
            if (map[row][col] === 2) { score += 10; pts = 10; }
            if (map[row][col] === 3) { score += 50; pts = 50; }
            
            floatingTexts.push({
                x: pacman.x * tileSize + tileSize/2,
                y: pacman.y * tileSize,
                text: '+' + pts,
                life: 1.0,
                isPower: map[row][col] === 3
            });

            map[row][col] = 0;
            pelletsRemaining--;
            updateUI();

            checkAdRefresh(); // Check interval for refresh

            if (pelletsRemaining <= 0) {
                levelComplete();
            }
        }
    }
}

function moveGhost(ghost, delta) {
    const speed = (4.0 + (level * 0.2)) * delta;
    let newX = ghost.x + ghost.dirX * speed;
    let newY = ghost.y + ghost.dirY * speed;

    const nextCol = Math.round(newX);
    const nextRow = Math.round(newY);

    // Tunnel wrap
    if (newX < 0 || newX >= cols) {
        ghost.x = newX < 0 ? cols - 0.5 : 0;
        return;
    }

    if (isWall(nextCol, nextRow)) {
        // Change direction
        const dirs = [
            { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 0, y: 1 }, { x: 0, y: -1 }
        ];
        
        // Don't reverse immediately unless forced
        const oppX = -ghost.dirX;
        const oppY = -ghost.dirY;
        
        const valid = dirs.filter(d => {
            const tc = Math.round(ghost.x + d.x);
            const tr = Math.round(ghost.y + d.y);
            return !isWall(tc, tr) && !(d.x === oppX && d.y === oppY);
        });

        if (valid.length > 0) {
            // Simple random choice (could be A* targeting pacman for higher difficulty)
            const choice = valid[Math.floor(Math.random() * valid.length)];
            ghost.dirX = choice.x;
            ghost.dirY = choice.y;
        } else {
            // Dead end, reverse
            ghost.dirX = oppX;
            ghost.dirY = oppY;
        }
        
        // Snap
        ghost.x = Math.round(ghost.x);
        ghost.y = Math.round(ghost.y);
        return;
    }

    ghost.x = newX;
    ghost.y = newY;
}

function checkCollisions() {
    for (const ghost of ghosts) {
        const dx = ghost.x - pacman.x;
        const dy = ghost.y - pacman.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 0.7) {
            playDeathSound();
            lives--;
            updateUI();
            stopLoop();
            
            if (lives <= 0) {
                gameOver = true;
                setTimeout(showGameOver, 1000);
            } else {
                setTimeout(startLevel, 1500); // Restart level entities
            }
            break;
        }
    }
}

function levelComplete() {
    stopLoop();
    playWinSound();
    level++;
    setTimeout(() => {
        levelCompleteScreen.classList.remove("hidden");
    }, 1000);
}

function showGameOver() {
    stopLoop();
    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove("hidden");
}

function checkAdRefresh() {
    if (!gameRecordTime) return;
    const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
    if (seconds > (window.PMG_TICK_RATE || 60)) {
        if (typeof syncPMGLayout === 'function') syncPMGLayout();
        gameRecordTime = Date.now();
    }
}

// ===================================
// DRAWING (Neon Style)
// ===================================
function drawMap() {
    ctx.shadowBlur = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = map[r][c];
            const x = c * tileSize;
            const y = r * tileSize;

            if (val === 1 || val === 4) {
                // Neon Wall
                const wallColor = val === 4 ? "#ff00ff" : "#0aa";
                const wallX = x + (tileSize - wallSize) / 2;
                const wallY = y + (tileSize - wallSize) / 2;
                
                ctx.strokeStyle = wallColor;
                ctx.lineWidth = 2;
                ctx.shadowColor = wallColor;
                ctx.shadowBlur = 8;
                ctx.strokeRect(wallX + 2, wallY + 2, wallSize - 4, wallSize - 4);
                
                // Subtle fill
                ctx.fillStyle = val === 4 ? "rgba(255,0,255,0.2)" : "rgba(0,170,170,0.15)";
                ctx.shadowBlur = 0;
                ctx.fillRect(wallX, wallY, wallSize, wallSize);
            } else {
                // Dots
                if (val === 2) { // Normal pellet
                    ctx.fillStyle = "#ffea00";
                    ctx.shadowColor = "#ffea00";
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(x + tileSize / 2, y + tileSize / 2, 3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (val === 3) { // Power pellet
                    ctx.fillStyle = "#fff";
                    ctx.shadowColor = "#fff";
                    // Pulse
                    const pulse = 4 + 2 * Math.sin(gameTime * 5);
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(x + tileSize / 2, y + tileSize / 2, pulse, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
}

function drawPacman() {
    const px = pacman.x * tileSize + tileSize / 2;
    const py = pacman.y * tileSize + tileSize / 2;

    const angleOffset =
    pacman.dirX === 1 ? 0 : pacman.dirX === -1 ? Math.PI :
    pacman.dirY === -1 ? -Math.PI / 2 : pacman.dirY === 1 ? Math.PI / 2 : 0;

    const chompSpeed = 15;
    const mouthOpen = 0.08 + 0.28 * (0.5 + 0.5 * Math.sin(gameTime * chompSpeed));

    ctx.fillStyle = "#ffea00";
    ctx.shadowColor = "#ffea00";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, tileSize * 0.6, angleOffset + mouthOpen, angleOffset + Math.PI * 2 - mouthOpen);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawGhost(ghost) {
    const gx = ghost.x * tileSize + tileSize / 2;
    const gy = ghost.y * tileSize + tileSize / 2;
    const r = tileSize * 0.6;

    ctx.fillStyle = ghost.color;
    ctx.shadowColor = ghost.color;
    ctx.shadowBlur = 15;
    
    // Ghost body
    ctx.beginPath();
    ctx.arc(gx, gy, r, Math.PI, 0);
    ctx.lineTo(gx + r, gy + r);
    
    // Wavy bottom
    const waves = 3;
    const waveW = (r * 2) / waves;
    const offset = Math.sin(gameTime * 10) * 1.5;
    
    for (let i = 1; i <= waves; i++) {
        ctx.lineTo(gx + r - (i * waveW) + waveW/2, gy + r + (i % 2 === 0 ? offset : -offset));
        ctx.lineTo(gx + r - (i * waveW), gy + r);
    }
    
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(gx - r / 3, gy - r / 4, r / 3.5, 0, Math.PI * 2);
    ctx.arc(gx + r / 3, gy - r / 4, r / 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (looking in direction)
    const lookX = ghost.dirX * 1.5;
    const lookY = ghost.dirY * 1.5;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(gx - r / 3 + lookX, gy - r / 4 + lookY, r / 8, 0, Math.PI * 2);
    ctx.arc(gx + r / 3 + lookX, gy - r / 4 + lookY, r / 8, 0, Math.PI * 2);
    ctx.fill();
}

function drawFloatingTexts(delta) {
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.life -= delta * 1.5; // lifespan
        ft.y -= delta * 40; // move up 40px per second
        
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
            continue;
        }
        
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.isPower ? "#fff" : "#ffea00";
        ctx.shadowColor = ft.isPower ? "#fff" : "#ffea00";
        ctx.shadowBlur = 10;
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
}

function draw(delta = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    if (lives > 0) drawPacman();
    ghosts.forEach(drawGhost);
    drawFloatingTexts(delta);
}

function loop(timestamp) {
    if (gamePaused) return;
    
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    gameTime = timestamp / 1000;

    movePacman(delta);
    ghosts.forEach(g => moveGhost(g, delta));
    checkCollisions();

    draw(delta);
    if (!gamePaused) animationFrameId = requestAnimationFrame(loop);
}

// ===================================
// CONTROLS
// ===================================
function trySetDirection(dx, dy) {
    if (gamePaused && !gameOver && lives > 0) {
        getAudioContext()?.resume();
        startBackgroundSound();
    }
    pacman.nextDirX = dx;
    pacman.nextDirY = dy;
}

// Keyboard
document.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowUp": case "w": case "W": e.preventDefault(); trySetDirection(0, -1); break;
        case "ArrowDown": case "s": case "S": e.preventDefault(); trySetDirection(0, 1); break;
        case "ArrowLeft": case "a": case "A": e.preventDefault(); trySetDirection(-1, 0); break;
        case "ArrowRight": case "d": case "D": e.preventDefault(); trySetDirection(1, 0); break;
    }
});

// Touch controls (Swipe)
let touchStartX = 0;
let touchStartY = 0;

const touchArea = document.getElementById("game-wrapper");

if (touchArea) {
    touchArea.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: false });

    touchArea.addEventListener("touchmove", (e) => {
        e.preventDefault(); // Prevent scrolling only within the game view to retain swipe integrity
    }, { passive: false });

    touchArea.addEventListener("touchend", (e) => {
        if (!touchStartX || !touchStartY) return;
        
        let touchEndX = e.changedTouches[0].clientX;
        let touchEndY = e.changedTouches[0].clientY;
        
        let dx = touchEndX - touchStartX;
        let dy = touchEndY - touchStartY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > 20) {
                trySetDirection(dx > 0 ? 1 : -1, 0);
            }
        } else {
            if (Math.abs(dy) > 20) {
                trySetDirection(0, dy > 0 ? 1 : -1);
            }
        }
        
        touchStartX = 0;
        touchStartY = 0;
    });
}

// UI Buttons
document.getElementById("restart-btn").addEventListener("click", startGame);
document.getElementById("next-level-btn").addEventListener("click", () => {
    levelCompleteScreen.classList.add("hidden");
    initMap(); // Respawn pellets
    startLevel();
    getAudioContext()?.resume();
    startBackgroundSound();
});

// Auto Start / Tutorial Countdown
let count = 2;
const tutText = document.getElementById("tutorial-countdown");
const startInterval = setInterval(() => {
    count--;
    if (count > 0) {
        if(tutText) tutText.textContent = `GAME STARTS IN ${count}...`;
    } else {
        clearInterval(startInterval);
        startGame();
    }
}, 1000);

// Initial draw (before start)
initMap();
resetEntities();
draw(0);
