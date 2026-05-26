/**
 * Virus Shooter 3D - Mobile Optimized & Timer Version
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
let viruss = []; // 2D array [row][col]
let shotVirus = null;
let nextVirus = null;
let score = 0;
let level = parseInt(localStorage.getItem('virus_shooter_current_level')) || 1;
let timeLeft = 60;
let timerInterval = null;
let gamesPlayed = 0;
let bestScore = localStorage.getItem('virus_shooter_best_score') || 0;
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
        window.trackGameEvent(`game_duration_virusshooter_${seconds}_${reason}_${getBrowser()}`, {
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


        sendDurationOnExit("background_virus_shooter");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_virusshooter");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        const placementId = getPlacementId();
        window.trackGameEvent(`exit_before_game_virusshooter_${osKey}`, {
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
    const gameSlug = "virusshooter";
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
function buildVirusMesh(color) {
    const group = new THREE.Group();

    // Core sphere
    const coreGeo = new THREE.SphereGeometry(BUBBLE_RADIUS * 0.7, 16, 16);
    const coreMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.1,
        envMapIntensity: 1.0
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Spikes (12 spikes around the sphere pointing outwards)
    const spikeGeo = new THREE.ConeGeometry(BUBBLE_RADIUS * 0.12, BUBBLE_RADIUS * 0.4, 4);
    // Move geometry center to the base of the cone so we can position it easily
    spikeGeo.translate(0, BUBBLE_RADIUS * 0.2, 0);

    const spikeMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.1,
        envMapIntensity: 1.0
    });

    const numSpikes = 12;
    for (let i = 0; i < numSpikes; i++) {
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        
        // Spherical distribution of points
        const phi = Math.acos(-1 + (2 * i) / numSpikes);
        const theta = Math.sqrt(numSpikes * Math.PI) * phi;
        
        // Position spike at radius BUBBLE_RADIUS * 0.6
        const r = BUBBLE_RADIUS * 0.6;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        spike.position.set(x, y, z);
        
        // Orient spike pointing outwards
        const dir = new THREE.Vector3(x, y, z).normalize();
        const alignAxis = new THREE.Vector3(0, 1, 0); // cone points up in geometry space
        spike.quaternion.setFromUnitVectors(alignAxis, dir);
        
        group.add(spike);
    }

    return group;
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
    viruss.forEach(row => row.forEach(b => { if (b) scene.remove(b.mesh); }));
    viruss = [];

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
        viruss[r] = [];
        if (r >= initialRows) continue;

        for (let c = 0; c < GRID_COLS; c++) {
            if (r % 2 === 1 && c === GRID_COLS - 1) continue;

            const colorIndex = Math.floor(Math.random() * colorsCount);
            const color = BUBBLE_COLORS[colorIndex];

            const b = createVirus(color, r, c);
            viruss[r][c] = b;
            scene.add(b.mesh);
        }
    }
}

function createVirus(color, r, c) {
    const mesh = buildVirusMesh(color);
    const pos = getGridPosition(r, c);
    mesh.position.set(pos.x, pos.y, 0);
    // Give random initial rotation
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.rotation.x = Math.random() * Math.PI * 2;
    return { mesh, color, r, c };
}

function getGridPosition(r, c) {
    const offset = (r % 2 === 1) ? BUBBLE_RADIUS : 0;
    const x = (c - (GRID_COLS - 1) / 2) * BUBBLE_RADIUS * 2 + offset;
    const y = 12 - r * ROW_HEIGHT; // Optimized alignment (shifted to 12)
    return { x, y };
}

function prepareNextVirus() {
    // Pick color that exists in the grid if possible
    let existingColors = new Set();
    viruss.forEach(row => row.forEach(b => { if (b) existingColors.add(b.color); }));
    let colors = Array.from(existingColors);
    if (colors.length === 0) colors = BUBBLE_COLORS;

    const color = colors[Math.floor(Math.random() * colors.length)];
    nextVirus = buildVirusMesh(color);
    nextVirus.color = color;
    nextVirus.position.copy(shooterPos);
    scene.add(nextVirus);
}

function onPointerDown(e) {
    if (!gameStarted || isGameOver || !canShoot || !nextVirus) return;

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
    shotVirus = nextVirus;
    nextVirus = null;
    canShoot = false;

    prepareNextVirus();
}

function animate() {
    requestAnimationFrame(animate);

    // Rotate and wiggle viruses in grid
    const time = Date.now() * 0.003;
    viruss.forEach(row => row.forEach(b => {
        if (b && b.mesh) {
            b.mesh.rotation.y += 0.008;
            b.mesh.rotation.x += 0.004;
            const wiggle = 1.0 + Math.sin(time + b.r * 2 + b.c) * 0.05;
            b.mesh.scale.set(wiggle, wiggle, wiggle);
        }
    }));
    if (nextVirus) {
        nextVirus.rotation.y += 0.008;
        nextVirus.rotation.x += 0.004;
    }

    if (shotVirus) {
        shotVirus.position.add(velocity);
        shotVirus.rotation.y += 0.02;
        shotVirus.rotation.x += 0.01;

        // Wall bounce
        if (Math.abs(shotVirus.position.x) > 11) {
            velocity.x *= -1;
            shotVirus.position.x = Math.sign(shotVirus.position.x) * 11;
        }

        checkCollision();
    }

    renderer.render(scene, camera);
}

function checkCollision() {
    if (!shotVirus) return;

    if (shotVirus.position.y > 12.5) { // Threshold adjusted for Y=12
        snapToGrid(shotVirus);
        return;
    }

    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const b = viruss[r][c];
            if (b) {
                const dist = shotVirus.position.distanceTo(b.mesh.position);
                if (dist < BUBBLE_RADIUS * 1.7) {
                    snapToGrid(shotVirus);
                    return;
                }
            }
        }
    }

    if (shotVirus.position.y < -20 || shotVirus.position.y > 20) {
        scene.remove(shotVirus);
        shotVirus = null;
        canShoot = true;
    }
}

function snapToGrid(virus) {
    let bestR = 0, bestC = 0, minDist = Infinity;
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (viruss[r][c]) continue;
            if (r % 2 === 1 && c === GRID_COLS - 1) continue;
            const pos = getGridPosition(r, c);
            const dist = virus.position.distanceTo(new THREE.Vector3(pos.x, pos.y, 0));
            if (dist < minDist) { minDist = dist; bestR = r; bestC = c; }
        }
    }

    const finalPos = getGridPosition(bestR, bestC);
    virus.position.set(finalPos.x, finalPos.y, 0);
    const b = { mesh: virus, color: virus.color, r: bestR, c: bestC };
    viruss[bestR][bestC] = b;
    shotVirus = null;

    handleMatches(bestR, bestC);

    if (bestR >= GRID_ROWS - 2) {
        gameOver("GAME OVER - STACK TOO LOW!");
    } else {
        canShoot = true;
    }
}

function handleMatches(r, c) {
    const matches = findMatches(r, c, viruss[r][c].color);
    if (matches.length >= 3) {
        matches.forEach(m => {
            scene.remove(m.mesh);
            viruss[m.r][m.c] = null;
            score += 10;
        });
        scoreEl.innerText = score;
        setTimeout(dropFloatingViruss, 50);
        setTimeout(checkWin, 200);
    }
}

function findMatches(r, c, color, visited = new Set()) {
    const key = `${r},${c}`;
    if (visited.has(key)) return [];
    visited.add(key);
    let found = [{ r, c, mesh: viruss[r][c].mesh }];
    getNeighbors(r, c).forEach(n => {
        const b = viruss[n.r][n.c];
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

function dropFloatingViruss() {
    const connected = new Set();
    for (let c = 0; c < GRID_COLS; c++) { if (viruss[0][c]) markConnected(0, c, connected); }
    for (let r = 1; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (viruss[r][c] && !connected.has(`${r},${c}`)) {
                scene.remove(viruss[r][c].mesh);
                viruss[r][c] = null;
                score += 20;
            }
        }
    }
}

function markConnected(r, c, connected) {
    const key = `${r},${c}`;
    if (connected.has(key)) return;
    connected.add(key);
    getNeighbors(r, c).forEach(n => { if (viruss[n.r][n.c]) markConnected(n.r, n.c, connected); });
}

function checkWin() {
    let count = 0;
    viruss.forEach(row => row.forEach(b => { if (b) count++; }));
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
    localStorage.setItem('virus_shooter_current_level', level);
    levelEl.innerText = level;
    gameStarted = true;
    canShoot = true;
    createGrid();
    startTimer();
    if (!nextVirus) prepareNextVirus();
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
    if (!nextVirus) prepareNextVirus();
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
        localStorage.setItem('virus_shooter_best_score', bestScore);
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
