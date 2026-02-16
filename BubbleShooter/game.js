/**
 * Bubble Shooter 3D - Mobile Optimized & Timer Version
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
let bubbles = []; // 2D array [row][col]
let shotBubble = null;
let nextBubble = null;
let score = 0;
let level = 1;
let timeLeft = 60;
let timerInterval = null;
let gamesPlayed = 0;
let bestScore = localStorage.getItem('bubble_shooter_best_score') || 0;
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
const submitScoreBtn = document.getElementById('submit-score-btn');
const nameInput = document.getElementById('player-name-gameover');
const levelCompleteMenu = document.getElementById('level-complete');
const nextLevelBtn = document.getElementById('next-level-btn');
const completedLevelEl = document.getElementById('completed-level');
const levelScoreEl = document.getElementById('level-score');

// --- Supabase Config ---
const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;

// --- Initialization ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1a2a);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 35);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true,
        preserveDrawingBuffer: true
    });
    updateSize();

    // HDR / EnvMap
    const rgbeLoader = new THREE.RGBELoader();
    rgbeLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/royal_esplanade_1k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 10);
    scene.add(dirLight);

    if (window.supabase) {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        loadLeaderboard();
    }

    if (window.renderTopRightScroller) renderTopRightScroller();

    // Events
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    submitScoreBtn.addEventListener('click', submitScore);
    if (nextLevelBtn) nextLevelBtn.addEventListener('click', nextLevel);

    window.addEventListener('resize', updateSize);

    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('pointerdown', onPointerDown);

    animate();

    // Auto-start
    setTimeout(startGame, 500);
}

function updateSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Maintain aspect ratio logic for game-wrapper
    const wrapper = document.getElementById('game-wrapper');
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
    bubbles.forEach(row => row.forEach(b => { if (b) scene.remove(b.mesh); }));
    bubbles = [];

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
        bubbles[r] = [];
        if (r >= initialRows) continue;

        for (let c = 0; c < GRID_COLS; c++) {
            if (r % 2 === 1 && c === GRID_COLS - 1) continue;

            const colorIndex = Math.floor(Math.random() * colorsCount);
            const color = BUBBLE_COLORS[colorIndex];

            const b = createBubble(color, r, c);
            bubbles[r][c] = b;
            scene.add(b.mesh);
        }
    }
}

function createBubble(color, r, c) {
    const geo = new THREE.SphereGeometry(BUBBLE_RADIUS, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.2,
        roughness: 0.1,
        envMapIntensity: 1.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    const pos = getGridPosition(r, c);
    mesh.position.set(pos.x, pos.y, 0);
    return { mesh, color, r, c };
}

function getGridPosition(r, c) {
    const offset = (r % 2 === 1) ? BUBBLE_RADIUS : 0;
    const x = (c - (GRID_COLS - 1) / 2) * BUBBLE_RADIUS * 2 + offset;
    const y = 14 - r * ROW_HEIGHT;
    return { x, y };
}

function prepareNextBubble() {
    // Pick color that exists in the grid if possible
    let existingColors = new Set();
    bubbles.forEach(row => row.forEach(b => { if (b) existingColors.add(b.color); }));
    let colors = Array.from(existingColors);
    if (colors.length === 0) colors = BUBBLE_COLORS;

    const color = colors[Math.floor(Math.random() * colors.length)];
    const geo = new THREE.SphereGeometry(BUBBLE_RADIUS, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.2, roughness: 0.1 });
    nextBubble = new THREE.Mesh(geo, mat);
    nextBubble.color = color;
    nextBubble.position.copy(shooterPos);
    scene.add(nextBubble);
}

function onPointerDown(e) {
    if (!gameStarted || isGameOver || !canShoot || !nextBubble) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const mouse = new THREE.Vector3(x, y, 0.5);
    mouse.unproject(camera);
    const dir = mouse.sub(camera.position).normalize();
    const dist = -camera.position.z / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(dist));

    const shootDir = pos.sub(shooterPos).normalize();
    shootDir.z = 0;

    velocity.copy(shootDir).multiplyScalar(0.9); // Faster shots
    shotBubble = nextBubble;
    nextBubble = null;
    canShoot = false;

    prepareNextBubble();
}

function animate() {
    requestAnimationFrame(animate);

    if (shotBubble) {
        shotBubble.position.add(velocity);

        // Wall bounce
        if (Math.abs(shotBubble.position.x) > 11) {
            velocity.x *= -1;
            shotBubble.position.x = Math.sign(shotBubble.position.x) * 11;
        }

        checkCollision();
    }

    renderer.render(scene, camera);
}

function checkCollision() {
    if (!shotBubble) return;

    if (shotBubble.position.y > 14.5) {
        snapToGrid(shotBubble);
        return;
    }

    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const b = bubbles[r][c];
            if (b) {
                const dist = shotBubble.position.distanceTo(b.mesh.position);
                if (dist < BUBBLE_RADIUS * 1.7) {
                    snapToGrid(shotBubble);
                    return;
                }
            }
        }
    }

    if (shotBubble.position.y < -20 || shotBubble.position.y > 20) {
        scene.remove(shotBubble);
        shotBubble = null;
        canShoot = true;
    }
}

function snapToGrid(bubble) {
    let bestR = 0, bestC = 0, minDist = Infinity;
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (bubbles[r][c]) continue;
            if (r % 2 === 1 && c === GRID_COLS - 1) continue;
            const pos = getGridPosition(r, c);
            const dist = bubble.position.distanceTo(new THREE.Vector3(pos.x, pos.y, 0));
            if (dist < minDist) { minDist = dist; bestR = r; bestC = c; }
        }
    }

    const finalPos = getGridPosition(bestR, bestC);
    bubble.position.set(finalPos.x, finalPos.y, 0);
    const b = { mesh: bubble, color: bubble.color, r: bestR, c: bestC };
    bubbles[bestR][bestC] = b;
    shotBubble = null;

    handleMatches(bestR, bestC);

    if (bestR >= GRID_ROWS - 2) {
        gameOver("GAME OVER - STACK TOO LOW!");
    } else {
        canShoot = true;
    }
}

function handleMatches(r, c) {
    const matches = findMatches(r, c, bubbles[r][c].color);
    if (matches.length >= 3) {
        matches.forEach(m => {
            scene.remove(m.mesh);
            bubbles[m.r][m.c] = null;
            score += 10;
        });
        scoreEl.innerText = score;
        setTimeout(dropFloatingBubbles, 50);
        setTimeout(checkWin, 200);
    }
}

function findMatches(r, c, color, visited = new Set()) {
    const key = `${r},${c}`;
    if (visited.has(key)) return [];
    visited.add(key);
    let found = [{ r, c, mesh: bubbles[r][c].mesh }];
    getNeighbors(r, c).forEach(n => {
        const b = bubbles[n.r][n.c];
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

function dropFloatingBubbles() {
    const connected = new Set();
    for (let c = 0; c < GRID_COLS; c++) { if (bubbles[0][c]) markConnected(0, c, connected); }
    for (let r = 1; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (bubbles[r][c] && !connected.has(`${r},${c}`)) {
                scene.remove(bubbles[r][c].mesh);
                bubbles[r][c] = null;
                score += 20;
            }
        }
    }
}

function markConnected(r, c, connected) {
    const key = `${r},${c}`;
    if (connected.has(key)) return;
    connected.add(key);
    getNeighbors(r, c).forEach(n => { if (bubbles[n.r][n.c]) markConnected(n.r, n.c, connected); });
}

function checkWin() {
    let count = 0;
    bubbles.forEach(row => row.forEach(b => { if (b) count++; }));
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
    levelCompleteMenu.classList.add('hidden');
    level++;
    levelEl.innerText = level;
    gameStarted = true;
    canShoot = true;
    createGrid();
    startTimer();
    if (!nextBubble) prepareNextBubble();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameStarted || isGameOver) return;
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            gameOver("TIME'S UP!");
        }
    }, 1000);
}

function startGame() {
    score = 0;
    level = 1;
    scoreEl.innerText = score;
    levelEl.innerText = level;
    isGameOver = false;
    gameStarted = true;
    canShoot = true;
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    createGrid();
    startTimer();
    if (!nextBubble) prepareNextBubble();
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
        localStorage.setItem('bubble_shooter_best_score', bestScore);
    }
    bestScoreEl.innerText = bestScore;
    gameOverMenu.classList.remove('hidden');
    if (window.renderGameScroller) renderGameScroller('game-over-scroller');
    if (gamesPlayed % 3 === 0 && typeof loadSmartlinkAd === 'function') loadSmartlinkAd();
}

function restartGame() {
    startGame();
}

async function submitScore() {
    const name = nameInput.value.trim() || "Guest";
    submitScoreBtn.disabled = true;
    submitScoreBtn.innerText = 'Saving...';
    if (supabaseClient) {
        try {
            await supabaseClient.from('bubble_shooter_scores').insert([{ username: name, score: score, country: "NA" }]);
        } catch (e) { console.error(e); }
    }
    submitScoreBtn.innerText = 'Saved!';
    loadLeaderboard();
}

async function loadLeaderboard() {
    if (!supabaseClient) return;
    const sideList = document.getElementById("side-lb-list"), fullList = document.getElementById("full-lb-list");
    try {
        const { data, error } = await supabaseClient.from("bubble_shooter_scores").select("*").order("score", { ascending: false }).limit(20);
        if (error) throw error;
        const html = data.map((p, i) => `<div class="lb-row"><span>${i + 1}. ${p.username}</span><span>${p.score}</span></div>`).join('');
        if (sideList) sideList.innerHTML = html;
        if (fullList) fullList.innerHTML = html;
    } catch (e) { console.error(e); }
}

init();
