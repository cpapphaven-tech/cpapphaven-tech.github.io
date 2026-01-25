/**
 * Stack 3D - Three.js Implementation
 * Ported from Swift/SceneKit
 */

// --- Constants & Config ---
const BLOCK_HEIGHT = 0.9;
const INITIAL_BLOCK_SIZE = 5;
const CAMERA_OFFSET = 20;

// --- State Variables ---
let scene, camera, renderer;
let stack = []; // Array of meshes
let currentBlock = null;
let direction = 'x'; // 'x' or 'z'
let gameState = 'MENU';
let score = 0;
let bestScore = localStorage.getItem('stackBestScore') || 0;
let moveSpeed = 2; // Units per second
let baseHue = Math.random();

// --- DOM Elements ---
const scoreEl = document.getElementById('score');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');
const restartBtn = document.getElementById('restart-btn');

// --- Initialization ---
function init() {
    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera (Orthographic for Isometric look)
    const aspect = window.innerWidth / window.innerHeight;
    const size = aspect < 1 ? 12 : 10; // Zoom out slightly on portrait
    camera = new THREE.OrthographicCamera(-size * aspect, size * aspect, size, -size, 1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 5. Initial setup
    resetGame();
    animate();

    // Event Listeners
    window.addEventListener('pointerdown', handleInteraction, { passive: false });
    restartBtn.addEventListener('click', restartGame);
    window.addEventListener('resize', onWindowResize);
}

function handleInteraction(e) {
    if (e.target.tagName === 'BUTTON') return;

    // Prevent double-triggering on some mobile browsers
    if (e.pointerType === 'touch') e.preventDefault();

    if (gameState === 'MENU') {
        startGame();
    } else if (gameState === 'PLAYING') {
        placeBlock();
    }
}

function resetGame() {
    // Clear old blocks
    stack.forEach(b => scene.rootNode ? scene.remove(b) : scene.remove(b));
    stack = [];
    if (currentBlock) scene.remove(currentBlock);
    currentBlock = null;

    score = 0;
    scoreEl.innerText = score;
    gameState = 'MENU';
    direction = 'x';
    moveSpeed = 2;
    baseHue = Math.random();

    // Create Base Block
    const base = createBlock(INITIAL_BLOCK_SIZE, INITIAL_BLOCK_SIZE, -BLOCK_HEIGHT, 0);
    scene.add(base);
    stack.push(base);

    updateBackground();
    resetCamera();
}

function startGame() {
    gameState = 'PLAYING';
    mainMenu.classList.add('hidden');
    spawnBlock();

    if (window.trackGameEvent) {
        window.trackGameEvent("game_start", {
            game_name: "Stack 3D"
        });
    }
}

function spawnBlock() {
    const prev = stack[stack.length - 1];
    const y = prev.position.y + BLOCK_HEIGHT;

    // Switch direction
    direction = (stack.length % 2 === 0) ? 'x' : 'z';

    const width = prev.geometry.parameters.width;
    const depth = prev.geometry.parameters.depth;

    const offset = 6;
    const x = direction === 'x' ? -offset : prev.position.x;
    const z = direction === 'z' ? -offset : prev.position.z;

    currentBlock = createBlock(width, depth, y, stack.length);
    currentBlock.position.set(x, y, z);
    scene.add(currentBlock);
}

function placeBlock() {
    const prev = stack[stack.length - 1];
    const prevPos = prev.position;
    const currentPos = currentBlock.position;

    const width = currentBlock.geometry.parameters.width;
    const depth = currentBlock.geometry.parameters.depth;

    let diff = 0;
    let isSmashed = false;

    if (direction === 'x') {
        diff = currentPos.x - prevPos.x;
        if (Math.abs(diff) >= width) isSmashed = true;
    } else {
        diff = currentPos.z - prevPos.z;
        if (Math.abs(diff) >= depth) isSmashed = true;
    }

    if (isSmashed) {
        gameOver();
        addPhysics(currentBlock);
        return;
    }

    // Success! Prepare new sizes
    let newWidth = width;
    let newDepth = depth;
    let newX = currentPos.x;
    let newZ = currentPos.z;

    if (direction === 'x') {
        newWidth = width - Math.abs(diff);
        newX = prevPos.x + (diff / 2);
    } else {
        newDepth = depth - Math.abs(diff);
        newZ = prevPos.z + (diff / 2);
    }

    // Snap to perfect
    if (Math.abs(diff) < 0.2) {
        newX = prevPos.x;
        newZ = prevPos.z;
        newWidth = width;
        newDepth = depth;
    }

    // 1. Remove current moving block
    scene.remove(currentBlock);

    // 2. Add solid part
    const solid = createBlock(newWidth, newDepth, currentPos.y, stack.length);
    solid.position.set(newX, currentPos.y, newZ);
    scene.add(solid);
    stack.push(solid);

    // 3. Create Rubble (Simplified)
    createRubble(diff, width, depth, currentPos, prevPos);

    score++;
    scoreEl.innerText = score;
    moveSpeed += 0.05;

    moveCameraUp();
    spawnBlock();
}

function createRubble(diff, width, depth, currentPos, prevPos) {
    if (Math.abs(diff) < 0.2) return; // No rubble for perfect hits

    let rWidth = width;
    let rDepth = depth;
    let rX = currentPos.x;
    let rZ = currentPos.z;

    const sign = diff > 0 ? 1 : -1;

    if (direction === 'x') {
        rWidth = Math.abs(diff);
        const overlapWidth = width - rWidth;
        rX = prevPos.x + (overlapWidth / 2 + rWidth / 2) * sign;
    } else {
        rDepth = Math.abs(diff);
        const overlapDepth = depth - rDepth;
        rZ = prevPos.z + (overlapDepth / 2 + rDepth / 2) * sign;
    }

    const rubble = createBlock(rWidth, rDepth, currentPos.y, stack.length - 1);
    rubble.position.set(rX, currentPos.y, rZ);
    scene.add(rubble);
    addPhysics(rubble);
}

function createBlock(w, d, y, index) {
    const geometry = new THREE.BoxGeometry(w, BLOCK_HEIGHT, d);

    // Color logic
    const hue = (baseHue + index * 0.015) % 1;
    const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(hue, 0.65, 0.5),
        shininess: 100
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function addPhysics(mesh) {
    mesh.velocity = new THREE.Vector3(0, -0.2, 0); // Simple gravity
    mesh.isPhysics = true;
}

function moveCameraUp() {
    const targetY = camera.position.y + BLOCK_HEIGHT;
    // Smoother movement could use GSAP, but simple lerp/step works
    camera.position.y = targetY;
}

function resetCamera() {
    camera.position.set(20, 20, 20);
}

let isGameOver = false; // Global variable to track game over state

function gameOver() {
    if (isGameOver) return;
    isGameOver = true;

    gameState = 'GAMEOVER'; // Keep original game state update
    if (score > bestScore) { // Keep original best score logic
        bestScore = score;
        localStorage.setItem('stackBestScore', bestScore);
    }

    finalScoreEl.innerText = score;
    bestScoreEl.innerText = bestScore; // Keep original best score display
    gameOverMenu.classList.remove('hidden');

    if (window.trackGameEvent) {
        window.trackGameEvent("game_over", {
            game_name: "Stack 3D",
            final_score: score // Changed to final_score as per instruction
        });
    }

    // Show interstitial ad on game over
    showInterstitialAd();
}

// Smartlink Interstitial Ad
function showInterstitialAd() {
    const adsDisabled = document.cookie.includes("noads=true");

    if (!adsDisabled) {
        window.open("https://www.effectivegatecpm.com/gp6cvyi4?key=a90897ce62f2dd15a5aab13ad90b2e66", "_blank");
    } else {
        console.log('🚧 Ads disabled via cookie - Interstitial ad skipped');
    }
}

function restartGame() {
    resetGame();
    gameOverMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
}

function updateBackground() {
    scene.background = new THREE.Color().setHSL(baseHue, 0.4, 0.1);
}

function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'PLAYING' && currentBlock) {
        const time = Date.now() * 0.001;
        const limits = 6;
        const pos = Math.sin(time * moveSpeed) * limits;

        if (direction === 'x') {
            currentBlock.position.x = stack[stack.length - 1].position.x + pos;
        } else {
            currentBlock.position.z = stack[stack.length - 1].position.z + pos;
        }
    }

    // Physics Update
    scene.traverse(obj => {
        if (obj.isPhysics) {
            obj.position.add(obj.velocity);
            obj.velocity.y -= 0.01; // Gravity constant
            if (obj.position.y < -20) {
                scene.remove(obj);
            }
        }
    });

    renderer.render(scene, camera);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const size = aspect < 1 ? 12 : 10;
    camera.left = -size * aspect;
    camera.right = size * aspect;
    camera.top = size;
    camera.bottom = -size;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
