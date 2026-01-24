/**
 * Helix Bounce - Three.js Implementation
 * Ported from Swift/SceneKit
 */

// --- Constants ---
const TOWER_RADIUS = 2;
const BALL_RADIUS = 0.3;
const FLOOR_HEIGHT = 4.0;
const SEGMENTS_PER_FLOOR = 12;
const NUM_FLOORS = 20;

// --- State ---
let scene, camera, renderer, tower;
let ball;
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
let score = 0;
let currentFloorIdx = 0;
let rotationSpeed = 0;
let isDragging = false;
let previousMouseX = 0;

// Physics helper
let ballVelocityY = 0;
const gravity = -0.015;
const bounceVelocity = 0.35;

// DOM
const scoreEl = document.getElementById('score');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);

    const aspect = 360 / 600;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true
    });
    renderer.setSize(360, 600);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Initial setup
    setupGame();
    animate();

    // Events
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', setupGame);
}

function setupGame() {
    gameState = 'MENU';
    score = 0;
    currentFloorIdx = 0;
    ballVelocityY = 0;
    scoreEl.innerText = '0';
    mainMenu.classList.remove('hidden');
    gameOverMenu.classList.add('hidden');

    if (tower) scene.remove(tower);
    if (ball) scene.remove(ball);

    // Create Tower
    tower = new THREE.Group();
    scene.add(tower);

    // Central Pillar
    const pillarGeom = new THREE.CylinderGeometry(TOWER_RADIUS * 0.7, TOWER_RADIUS * 0.7, NUM_FLOORS * FLOOR_HEIGHT + 10, 16);
    const pillarMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const pillar = new THREE.Mesh(pillarGeom, pillarMat);
    pillar.position.y = -(NUM_FLOORS * FLOOR_HEIGHT) / 2 + 5;
    tower.add(pillar);

    // Floors
    for (let i = 0; i < NUM_FLOORS; i++) {
        createFloor(i);
    }

    // Ball
    const ballGeom = new THREE.SphereGeometry(BALL_RADIUS, 16, 16);
    const ballMat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    ball = new THREE.Mesh(ballGeom, ballMat);
    ball.position.set(0, 3, TOWER_RADIUS + 0.2);
    scene.add(ball);

    resetCamera();
}

function createFloor(index) {
    const floorGroup = new THREE.Group();
    floorGroup.position.y = -index * FLOOR_HEIGHT;
    tower.add(floorGroup);

    const gapStart = Math.floor(Math.random() * SEGMENTS_PER_FLOOR);
    const gapSize = 2; // 2 segments wide gap

    for (let i = 0; i < SEGMENTS_PER_FLOOR; i++) {
        // Skip for gap
        let inGap = false;
        for (let g = 0; g < gapSize; g++) {
            if (i === (gapStart + g) % SEGMENTS_PER_FLOOR) inGap = true;
        }
        if (inGap && index > 0) continue;

        const angle = (i / SEGMENTS_PER_FLOOR) * Math.PI * 2;
        const segmentGeom = new THREE.BoxGeometry(TOWER_RADIUS * 1.2, 0.2, TOWER_RADIUS * 0.8);

        // Random death zones
        const isDeath = Math.random() < 0.15 && index > 0;
        const color = isDeath ? 0xff3333 : (index % 2 === 0 ? 0x00ffff : 0x00cccc);

        const mat = new THREE.MeshPhongMaterial({ color: color });
        const segment = new THREE.Mesh(segmentGeom, mat);

        // Position on ring
        segment.position.x = Math.sin(angle) * TOWER_RADIUS;
        segment.position.z = Math.cos(angle) * TOWER_RADIUS;
        segment.rotation.y = angle;

        segment.userData = { isDeath: isDeath, floorIdx: index };
        floorGroup.add(segment);
    }
}

function startGame() {
    gameState = 'PLAYING';
    mainMenu.classList.add('hidden');
}

function onPointerDown(e) {
    if (gameState !== 'PLAYING') return;
    isDragging = true;
    previousMouseX = e.clientX;
}

function onPointerMove(e) {
    if (!isDragging) return;
    const deltaX = e.clientX - previousMouseX;
    tower.rotation.y += deltaX * 0.01;
    previousMouseX = e.clientX;
}

function onPointerUp() {
    isDragging = false;
}

function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'PLAYING') {
        updatePhysics();
        updateCamera();
    }

    renderer.render(scene, camera);
}

function updatePhysics() {
    ballVelocityY += gravity;
    ball.position.y += ballVelocityY;

    // Check collision with floors
    const floorY = -currentFloorIdx * FLOOR_HEIGHT;
    const relativeBallY = ball.position.y - floorY;

    // Detection zone
    if (ballVelocityY < 0 && relativeBallY < BALL_RADIUS && relativeBallY > -0.5) {
        checkFloorCollision();
    }

    // Win condition - reach bottom
    if (ball.position.y < -(NUM_FLOORS - 1) * FLOOR_HEIGHT) {
        gameOver(true);
    }
}

function checkFloorCollision() {
    // Determine which segment the ball is over
    // Ball is at fixed world X, Z. Tower is rotating.
    // Calculate ball angle relative to tower rotation
    let angle = Math.atan2(ball.position.x, ball.position.z) - tower.rotation.y;
    while (angle < 0) angle += Math.PI * 2;
    while (angle > Math.PI * 2) angle -= Math.PI * 2;

    const segmentIdx = Math.floor((angle / (Math.PI * 2)) * SEGMENTS_PER_FLOOR);

    // Check if the floor has a segment here
    const currentFloor = tower.children[currentFloorIdx + 1]; // +1 because pillar is index 0
    let landed = false;
    let hitDeath = false;

    currentFloor.children.forEach(seg => {
        // We approximate hit by checking if seg exists near this angle
        // In this implementation, we just check if it's NOT a gap.
        landed = true;
        if (seg.userData && seg.userData.isDeath) {
            // Simplified check: if hit segment exists and marked death
            // Actually, we need to know IF hit. 
        }
    });

    // Real Gap Logic: If ball is falling and no segments are under it
    // For simplicity in this Three.js prototype, we use Raycasting or distance checks
    const raycaster = new THREE.Raycaster(ball.position, new THREE.Vector3(0, -1, 0));
    const intersects = raycaster.intersectObjects(tower.children, true);

    if (intersects.length > 0 && intersects[0].distance < BALL_RADIUS + 0.1) {
        const hitObj = intersects[0].object;
        if (hitObj.userData.isDeath) {
            gameOver(false);
        } else {
            // Bounce
            ball.position.y = hitObj.parent.position.y + 0.2 + BALL_RADIUS;
            ballVelocityY = bounceVelocity;
        }
    } else {
        // Falling through gap?
        // Fall logic is automatic. If depth increases beyond a point, update score.
        const newFloorIdx = Math.floor(-ball.position.y / FLOOR_HEIGHT);
        if (newFloorIdx > currentFloorIdx) {
            currentFloorIdx = newFloorIdx;
            score = currentFloorIdx;
            scoreEl.innerText = score;
        }
    }
}

function updateCamera() {
    const targetY = ball.position.y + 5;
    camera.position.y += (targetY - camera.position.y) * 0.1;
}

function resetCamera() {
    camera.position.set(0, 5, 12);
}

function gameOver(win) {
    gameState = 'GAMEOVER';
    finalScoreEl.innerText = score;
    gameOverMenu.classList.remove('hidden');
    if (win) {
        gameOverMenu.querySelector('h2').innerText = "LEVEL COMPLETE!";
        gameOverMenu.querySelector('h2').style.color = "#00ff00";
    } else {
        gameOverMenu.querySelector('h2').innerText = "CRASHED!";
        gameOverMenu.querySelector('h2').style.color = "#ff3333";
    }
}

init();
