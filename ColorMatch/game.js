/**
 * Color Match 3D
 * A simple reaction-based game for PlayMixGames
 */

// --- Constants ---
const COLORS = [
    0xff3333, // Red
    0x33ff33, // Green
    0x3333ff, // Blue
    0xffff33, // Yellow
    0xff33ff, // Magenta
    0x33ffff  // Cyan
];

// --- State ---
let scene, camera, renderer, cubesGroup;
let targetColor;
let score = 0;
let timeLeft = 30;
let timerId = null;
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER

// DOM
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const targetColorEl = document.getElementById('target-color-display');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);

    const container = document.getElementById('game-ui');
    const width = container.clientWidth;
    const height = container.clientHeight;

    const aspect = width / height;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 0, 15);

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    window.addEventListener('resize', onWindowResize);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 10);
    scene.add(dirLight);

    cubesGroup = new THREE.Group();
    scene.add(cubesGroup);

    // Events
    window.addEventListener('pointerdown', onPointerDown);
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', setupGame);

    setupGame();
    animate();
}

function setupGame() {
    gameState = 'MENU';
    score = 0;
    timeLeft = 30;
    scoreEl.innerText = '0';
    timerEl.innerText = '30';
    mainMenu.classList.remove('hidden');
    gameOverMenu.classList.add('hidden');

    // Clear old cubes
    while (cubesGroup.children.length > 0) {
        cubesGroup.remove(cubesGroup.children[0]);
    }

    spawnCubes();
    pickNewTargetColor();
}

function startGame() {
    gameState = 'PLAYING';
    mainMenu.classList.add('hidden');

    if (window.trackGameEvent) {
        window.trackGameEvent("game_start", {
            game_name: "Color Match 3D"
        });
    }

    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function spawnCubes() {
    // Clear existing
    while (cubesGroup.children.length > 0) {
        cubesGroup.remove(cubesGroup.children[0]);
    }

    // Grid of 3x3 cubes
    const spacing = 4;
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            const geom = new THREE.BoxGeometry(2.5, 2.5, 2.5);
            const mat = new THREE.MeshPhongMaterial({ color: color });
            const cube = new THREE.Mesh(geom, mat);

            cube.position.set(x * spacing, y * spacing, 0);
            cube.userData = { color: color };
            cubesGroup.add(cube);
        }
    }
}

function pickNewTargetColor() {
    // Pick a color that actually exists in the current cubes
    const existingColors = cubesGroup.children.map(c => c.userData.color);
    targetColor = existingColors[Math.floor(Math.random() * existingColors.length)];

    // Update UI
    const hexColor = '#' + targetColor.toString(16).padStart(6, '0');
    targetColorEl.style.backgroundColor = hexColor;
}

function onPointerDown(event) {
    if (gameState !== 'PLAYING') return;

    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x, y }, camera);

    const intersects = raycaster.intersectObjects(cubesGroup.children);
    if (intersects.length > 0) {
        const clickedObj = intersects[0].object;
        handleCubeClick(clickedObj);
    }
}

function handleCubeClick(cube) {
    if (cube.userData.color === targetColor) {
        // Match!
        score++;
        scoreEl.innerText = score;

        // Visual feedback
        cube.scale.set(1.2, 1.2, 1.2);
        setTimeout(() => {
            spawnCubes();
            pickNewTargetColor();
        }, 100);
    } else {
        // Mismatch - penalty
        timeLeft = Math.max(0, timeLeft - 2);
        timerEl.innerText = timeLeft;

        // Shake feedback
        cube.position.x += 0.2;
        setTimeout(() => cube.position.x -= 0.4, 50);
        setTimeout(() => cube.position.x += 0.2, 100);
    }
}

function endGame() {
    gameState = 'GAMEOVER';
    clearInterval(timerId);
    finalScoreEl.innerText = score;
    gameOverMenu.classList.remove('hidden');

    if (window.trackGameEvent) {
        window.trackGameEvent("game_over", {
            game_name: "Color Match 3D",
            score: score
        });
    }

    // Show interstitial ad on game over
    showInterstitialAd();
}

// Smartlink Interstitial Ad
function showInterstitialAd() {
    const urlParams = new URLSearchParams(window.location.search);
    const IS_DEV = urlParams.get("dev") === "true";

    if (!IS_DEV) {
        window.open("https://www.effectivegatecpm.com/gp6cvyi4?key=a90897ce62f2dd15a5aab13ad90b2e66", "_blank");
    } else {
        console.log('🚧 Dev mode - Interstitial ad skipped');
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Rotate cubes slightly for 3D effect
    cubesGroup.children.forEach(cube => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
    });

    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('game-ui');
    if (!container || !camera || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

init();
