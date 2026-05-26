/**
 * Candy Candy Pop 3D - Mobile Optimized & Timer Version
 * Simplified: Removed Leaderboard functionality
 */

// --- Constants ---
const BUBBLE_RADIUS = 1.0;
const ROW_HEIGHT = BUBBLE_RADIUS * 1.732;
const GRID_COLS = 11;
const GRID_ROWS = 15;
const SHOOTER_Y = -12;
const BUBBLE_COLORS = [
    0x2196f3, // Blue
    0xf44336, // Red
    0x4caf50, // Green
    0xffeb3b, // Yellow
    0x9c27ff  // Purple
];

// --- State Variables ---
let scene, camera, renderer;
let candys = []; // 2D array [row][col]
let shotCandy = null;
let nextCandy = null;
let score = 0;
let level = parseInt(localStorage.getItem('candy_shooter_current_level')) || 1;
let timeLeft = 60;
let timerInterval = null;
let gamesPlayed = 0;
let bestScore = localStorage.getItem('candy_shooter_best_score') || 0;
let isGameOver = false;
let gameStarted = false;
let canShoot = true;
let shooterPos = new THREE.Vector3(0, SHOOTER_Y, 0);
let velocity = new THREE.Vector3(0, 0, 0);

// --- DOM Elements ---
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const timerEl = document.getElementById('timer');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over');
const gameOverTitle = document.getElementById('game-over-title');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const levelCompleteMenu = document.getElementById('level-complete');
const nextLevelBtn = document.getElementById('next-level-btn');
const completedLevelEl = document.getElementById('completed-level');
const levelScoreEl = document.getElementById('level-score');

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

// Wait for Supabase to load safely
function initSupabase() {
    if (!window.supabase) {
        console.warn("⏳ Waiting for Supabase...");
        setTimeout(initSupabase, 500);
        return;
    }

    if (!supabaseClient) {
        const { createClient } = window.supabase;
        supabaseClient = createClient(supabaseUrl, supabaseKey);
        console.log("✅ Supabase ready");
    }

    startGameSession();
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
        window.trackGameEvent(`game_duration_candycandypop_${seconds}_${reason}_${getBrowser()}`, {
            seconds,
            end_reason: reason,
            os: getOS(),
            placement_id: placementId
        });
        // Update session in Supabase
        updateGameSession({
            duration_seconds: seconds,
            bounced: !gameStartedFlag,
            end_reason: reason
        });
        durationSent = true;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {


        sendDurationOnExit("background_candy_shooter");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_candycandypop");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        const placementId = getPlacementId();
        window.trackGameEvent(`exit_before_game_candycandypop_${osKey}`, {
            os: getOS(),
            placement_id: placementId
        });
        // Update session as bounced
        updateGameSession({
            bounced: true,
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
    if (!window.supabase) return;

    sessionId = generateSessionId();
    const placementId = getPlacementId();
    const os = getOS();
    const browser = getBrowser();
    const userAgent = navigator.userAgent;
    const gameSlug = "candycandypop";
    const country = await getCountry();

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






// --- Initialization ---
const textureCache = {};

function getCandyTexture(colorHex) {
    if (textureCache[colorHex]) {
        return textureCache[colorHex];
    }

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base color is white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Swirl stripes of the candy's color
    const colorStr = '#' + colorHex.toString(16).padStart(6, '0');
    ctx.fillStyle = colorStr;

    // Draw spiral swirl wings
    const cx = size / 2;
    const cy = size / 2;
    const numStripes = 8;
    const maxRadius = size * 0.7;

    for (let i = 0; i < numStripes; i++) {
        const startAngle = (i * 2 * Math.PI) / numStripes;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        
        // Draw one spiral arm
        for (let r = 0; r <= maxRadius; r += 5) {
            const angle = startAngle + (r / maxRadius) * (Math.PI / 2);
            const x1 = cx + Math.cos(angle) * r;
            const y1 = cy + Math.sin(angle) * r;
            ctx.lineTo(x1, y1);
        }
        // Draw back with a thicker width
        for (let r = maxRadius; r >= 0; r -= 5) {
            const angle = startAngle + 0.35 + (r / maxRadius) * (Math.PI / 2);
            const x2 = cx + Math.cos(angle) * r;
            const y2 = cy + Math.sin(angle) * r;
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fill();
    }

    // Add a gloss overlay highlight
    const grad = ctx.createRadialGradient(size*0.35, size*0.35, size*0.05, size*0.5, size*0.5, size*0.5);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    textureCache[colorHex] = texture;
    return texture;
}

function init() {

    gameStartedFlag = true;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 35);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true,
        preserveDrawingBuffer: true,
        alpha: true
    });
    // Removed sRGB and ACES mapping to match live version's high-contrast look
    updateSize();

    // HDR / EnvMap
    const rgbeLoader = new THREE.RGBELoader();
    rgbeLoader.load('../assets/royal_esplanade_1k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 10);
    scene.add(dirLight);

    // if (window.renderTopRightScroller) renderTopRightScroller();

    // Events
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    if (nextLevelBtn) nextLevelBtn.addEventListener('click', nextLevel);

    window.addEventListener('resize', updateSize);

    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('pointerdown', onPointerDown);

    animate();

    // Auto-start
    setTimeout(startGame, 100);

    initSupabase();

    durationSent = false;

}

function updateSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Maintain aspect ratio logic for game-wrapper
    const actualWidth = Math.min(width, 480);
    const actualHeight = Math.min(height, 800);

    camera.aspect = actualWidth / actualHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(actualWidth, actualHeight);

    // Adjust camera position based on height for mobile
    if (actualHeight < 600) {
        camera.position.z = 45;
    } else {
        camera.position.z = 35;
    }
}

function createGrid() {
    // Clear existing
    candys.forEach(row => row.forEach(b => { if (b) scene.remove(b.mesh); }));
    candys = [];

    // Difficulty Logic
    let colorsCount = 5;
    let initialRows = 7;

    if (level <= 10) {
        colorsCount = 3; // First 10 levels very easy colors
        initialRows = 3 + Math.floor(level / 4); // Fewer rows
        timeLeft = 90; // Generous time for easy levels
    } else {
        colorsCount = 5;
        initialRows = 7 + Math.min(5, Math.floor((level - 10) / 2));
        timeLeft = Math.max(30, 70 - (level - 10) * 2);
    }

    timerEl.innerText = timeLeft;

    for (let r = 0; r < GRID_ROWS; r++) {
        candys[r] = [];
        if (r >= initialRows) continue;

        for (let c = 0; c < GRID_COLS; c++) {
            if (r % 2 === 1 && c === GRID_COLS - 1) continue;

            const colorIndex = Math.floor(Math.random() * colorsCount);
            const color = BUBBLE_COLORS[colorIndex];

            const b = createCandy(color, r, c);
            candys[r][c] = b;
            scene.add(b.mesh);
        }
    }
}

function createCandy(color, r, c) {
    const geo = new THREE.SphereGeometry(BUBBLE_RADIUS, 32, 32);
    const texture = getCandyTexture(color);
    const mat = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.05,
        roughness: 0.1,
        envMapIntensity: 1.2
    });
    const mesh = new THREE.Mesh(geo, mat);
    const pos = getGridPosition(r, c);
    mesh.position.set(pos.x, pos.y, 0);
    return { mesh, color, r, c };
}

function getGridPosition(r, c) {
    const offset = (r % 2 === 1) ? BUBBLE_RADIUS : 0;
    const x = (c - (GRID_COLS - 1) / 2) * BUBBLE_RADIUS * 2 + offset;
    const y = 12 - r * ROW_HEIGHT; // Optimized alignment (shifted to 12)
    return { x, y };
}

function prepareNextCandy() {
    // Pick color that exists in the grid if possible
    let existingColors = new Set();
    candys.forEach(row => row.forEach(b => { if (b) existingColors.add(b.color); }));
    let colors = Array.from(existingColors);
    if (colors.length === 0) colors = BUBBLE_COLORS;

    const color = colors[Math.floor(Math.random() * colors.length)];
    const geo = new THREE.SphereGeometry(BUBBLE_RADIUS, 32, 32);
    const texture = getCandyTexture(color);
    const mat = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.05,
        roughness: 0.1,
        envMapIntensity: 1.2
    });
    nextCandy = new THREE.Mesh(geo, mat);
    nextCandy.color = color;
    nextCandy.position.copy(shooterPos);
    scene.add(nextCandy);
}

function onPointerDown(e) {
    if (!gameStarted || isGameOver || !canShoot || !nextCandy) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const mouse = new THREE.Vector3(x, y, 0.5);
    mouse.unproject(camera);
    const dir = mouse.sub(camera.position).normalize();
    const dist = -camera.position.z / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(dist));

    const shootDir = pos.sub(shooterPos);
    shootDir.z = 0;
    shootDir.normalize();

    // Safety: Ensure it always shoots at least slightly upwards
    if (shootDir.y < 0.1) {
        shootDir.y = 0.1;
        shootDir.normalize();
    }

    velocity.copy(shootDir).multiplyScalar(1.2); // Faster, more responsive shots
    shotCandy = nextCandy;
    nextCandy = null;
    canShoot = false;

    prepareNextCandy();
}

function animate() {
    requestAnimationFrame(animate);

    if (shotCandy) {
        shotCandy.position.add(velocity);

        // Wall bounce
        if (Math.abs(shotCandy.position.x) > 11) {
            velocity.x *= -1;
            shotCandy.position.x = Math.sign(shotCandy.position.x) * 11;
        }

        checkCollision();
    }

    renderer.render(scene, camera);
}

function checkCollision() {
    if (!shotCandy) return;

    if (shotCandy.position.y > 12.5) { // Threshold adjusted for Y=12
        snapToGrid(shotCandy);
        return;
    }

    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const b = candys[r][c];
            if (b) {
                const dist = shotCandy.position.distanceTo(b.mesh.position);
                if (dist < BUBBLE_RADIUS * 1.7) {
                    snapToGrid(shotCandy);
                    return;
                }
            }
        }
    }

    if (shotCandy.position.y < -20 || shotCandy.position.y > 20) {
        scene.remove(shotCandy);
        shotCandy = null;
        canShoot = true;
    }
}

function snapToGrid(candy) {
    let bestR = 0, bestC = 0, minDist = Infinity;
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (candys[r][c]) continue;
            if (r % 2 === 1 && c === GRID_COLS - 1) continue;
            const pos = getGridPosition(r, c);
            const dist = candy.position.distanceTo(new THREE.Vector3(pos.x, pos.y, 0));
            if (dist < minDist) { minDist = dist; bestR = r; bestC = c; }
        }
    }

    const finalPos = getGridPosition(bestR, bestC);
    candy.position.set(finalPos.x, finalPos.y, 0);
    const b = { mesh: candy, color: candy.color, r: bestR, c: bestC };
    candys[bestR][bestC] = b;
    shotCandy = null;

    handleMatches(bestR, bestC);

    if (bestR >= GRID_ROWS - 2) {
        gameOver("GAME OVER - STACK TOO LOW!");
    } else {
        canShoot = true;
    }
}

function handleMatches(r, c) {
    const matches = findMatches(r, c, candys[r][c].color);
    if (matches.length >= 3) {
        matches.forEach(m => {
            scene.remove(m.mesh);
            candys[m.r][m.c] = null;
            score += 10;
        });
        scoreEl.innerText = score;
        setTimeout(dropFloatingCandys, 50);
        setTimeout(checkWin, 200);
    }
}

function findMatches(r, c, color, visited = new Set()) {
    const key = `${r},${c}`;
    if (visited.has(key)) return [];
    visited.add(key);
    let found = [{ r, c, mesh: candys[r][c].mesh }];
    getNeighbors(r, c).forEach(n => {
        const b = candys[n.r][n.c];
        if (b && b.color === color) found = found.concat(findMatches(n.r, n.c, color, visited));
    });
    return found;
}

function getNeighbors(r, c) {
    const res = [];
    const even = (r % 2 === 0);
    const offsets = even ? [{ dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 0 }] : [{ dr: -1, dc: 0 }, { dr: -1, dc: 1 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }];
    offsets.forEach(o => {
        const nr = r + o.dr, nc = c + o.dc;
        if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) res.push({ r: nr, c: nc });
    });
    return res;
}

function dropFloatingCandys() {
    const connected = new Set();
    for (let c = 0; c < GRID_COLS; c++) { if (candys[0][c]) markConnected(0, c, connected); }
    for (let r = 1; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (candys[r][c] && !connected.has(`${r},${c}`)) {
                scene.remove(candys[r][c].mesh);
                candys[r][c] = null;
                score += 20;
            }
        }
    }
}

function markConnected(r, c, connected) {
    const key = `${r},${c}`;
    if (connected.has(key)) return;
    connected.add(key);
    getNeighbors(r, c).forEach(n => { if (candys[n.r][n.c]) markConnected(n.r, n.c, connected); });
}

function checkWin() {
    let count = 0;
    candys.forEach(row => row.forEach(b => { if (b) count++; }));
    if (count === 0) {
        clearInterval(timerInterval);

        // Show Level Complete Dialog
        completedLevelEl.innerText = level;
        levelScoreEl.innerText = score;
        levelCompleteMenu.classList.remove('hidden');
        gameStarted = false;
    }
}

function nextLevel() {

     const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
    if (seconds > (window.PMG_TICK_RATE || 60)) {
        syncPMGLayout();
         gameRecordTime = Date.now();   // ⏱ start timer
    }
    
    levelCompleteMenu.classList.add('hidden');
    level++;
    localStorage.setItem('candy_shooter_current_level', level);
    levelEl.innerText = level;
    gameStarted = true;
    canShoot = true;
    createGrid();
    startTimer();
    if (!nextCandy) prepareNextCandy();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameStarted || isGameOver) return;
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 10) {
            timerEl.classList.add('timer-low');
        } else {
            timerEl.classList.remove('timer-low');
        }
        if (timeLeft <= 0) {
            gameOver("TIME'S UP!");
        }
    }, 1000);
}

function startGame() {

 gameStartTime = Date.now();   // ⏱ start timer
 gameRecordTime = Date.now(); 
    
    score = 0;
    scoreEl.innerText = score;
    levelEl.innerText = level;
    isGameOver = false;
    gameStarted = true;
    canShoot = true;
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    levelCompleteMenu.classList.add('hidden');
    timerEl.classList.remove('timer-low');
    createGrid();
    startTimer();
    if (!nextCandy) prepareNextCandy();
}

function gameOver(title) {
    isGameOver = true;
    gameStarted = false;
    clearInterval(timerInterval);
    gamesPlayed++;
    gameOverTitle.innerText = title;
    finalScoreEl.innerText = score;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('candy_shooter_best_score', bestScore);
    }
    bestScoreEl.innerText = bestScore;
    gameOverMenu.classList.remove('hidden');
    if (window.renderGameScroller) renderGameScroller('game-over-scroller');
    if (gamesPlayed % 3 === 0 && typeof loadSmartlinkAd === 'function') loadSmartlinkAd();
}

function restartGame() {
    startGame();
}

init();
