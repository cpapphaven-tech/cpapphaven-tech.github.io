/**
 * Helix Bounce - Three.js + Cannon.js Implementation
 * Ported from Swift/SceneKit (HelixBounceViewController.swift)
 */

// --- Constants (Matching Swift) ---
const BALL_RADIUS = 0.3;
const CYLINDER_RADIUS = 2.0;
const PLATFORM_HEIGHT = 0.45;
const LEVEL_HEIGHT = 4.0;
let numFloors = 20; // Will be calculated based on current level

// Physics Categories (Bitmasks)
const CATEGORY_BALL = 1;
const CATEGORY_PLATFORM = 2;
const CATEGORY_LAST_PLATFORM = 4;
const CATEGORY_DEATH = 10;

// Game State
let scene, camera, renderer;
let world; // Cannon.js world
let ballMesh, ballBody;
let towerGroup; // For rotation logic
let towerBody; // Not used as a single body, but logic grouping

let isGameOver = false;
let score = 0;
let currentLevel = 1;
let canStabilizeBall = true;
let stabilizeCooldown = 400; // ms

// DOM Elements
const levelEl = document.getElementById('level');
const scoreEl = document.getElementById('score');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const resumeBtn = document.getElementById('resume-btn');
const resumeLevelSpan = document.getElementById('resume-level');
const restartBtn = document.getElementById('restart-btn');
const nextLevelBtn = document.getElementById('next-level-btn');

const rewardBtn = document.getElementById("bonus-btn");
let lastSafeFloorIndex = 0;


// Input State
let isDraggingTower = false;
let previousPointerX = 0;

// Materials
let ballMaterial, platformMaterial, deathMaterial, lastPlatformMaterial;
let physicsMaterial; // Cannon material

// 🔧 DEVELOPMENT MODE
const DEV_MODE = false; // true = no ads, false = live ads

let lastSafeTowerRotation = 0;


function init() {
    // Load saved level from localStorage
    const savedLevel = localStorage.getItem('helixBounceLevel');
    if (savedLevel) {
        currentLevel = parseInt(savedLevel);
        resumeLevelSpan.innerText = currentLevel;
        resumeBtn.classList.remove('hidden');
    }

    // 1. Setup Three.js
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a33); // UIColor(0.1, 0.1, 0.2)

    const aspect = 360 / 600; // Fixed aspect ratio for container mostly
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(0, 5, 12);
    camera.rotation.x = -0.3;

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true
    });
    renderer.setSize(360, 600);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 50, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 2. Setup Cannon.js
    world = new CANNON.World();
    world.gravity.set(0, -6.0, 0); // Matching Swift SCNVector3(0, -6.0, 0)
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    physicsMaterial = new CANNON.Material("physics");
    const physicsContactMaterial = new CANNON.ContactMaterial(
        physicsMaterial,
        physicsMaterial,
        {
            friction: 0.5,
            restitution: 0.8 // Bounciness
        }
    );
    world.addContactMaterial(physicsContactMaterial);

    // 3. Materials
    ballMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 }); // Yellow
    platformMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffff }); // Cyan
    deathMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red
    lastPlatformMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 }); // Green

    // 4. Events
    setupInputs();

    // Loop
    requestAnimationFrame(animate);
}

function openRewardAd() {
    if (DEV_MODE) {
        console.log("🛠 DEV MODE: Smartlink blocked");
        revivePlayer(); // still revive so you can test
        return;
    }

    window.open(
        "https://www.effectivegatecpm.com/gp6cvyi4?key=a90897ce62f2dd15a5aab13ad90b2e66",
        "_blank"
    );

    revivePlayer();
}

function revivePlayer() {
    isGameOver = false;
    gameOverMenu.classList.add("hidden");

    // Reposition ball at last safe platform
    const targetY = -lastSafeFloorIndex * LEVEL_HEIGHT + 2.0;

    
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);

     // Restore safe rotation
    towerGroup.rotation.y = lastSafeTowerRotation;

    ballBody.position.set(0, targetY, CYLINDER_RADIUS);

    console.log("🔄 Revived at floor:", lastSafeFloorIndex);
}



function startNewGame() {
    currentLevel = 1;
    startGame();
}

function resumeGame() {
    startGame();
}

function startGame() {
    isGameOver = false;
    score = 0;
    scoreEl.innerText = "0";
    levelEl.innerText = `Level ${currentLevel}`;

    // Save current level to localStorage
    localStorage.setItem('helixBounceLevel', currentLevel);

    // UI
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    restartBtn.classList.remove('hidden');
    nextLevelBtn.classList.add('hidden');

    // Clean up old tower and ball
    if (towerGroup) {
        scene.remove(towerGroup);
    }
    if (ballBody) {
        world.removeBody(ballBody);
    }
    if (ballMesh) {
        scene.remove(ballMesh);
    }

    // Clear all physics bodies from world
    const bodiesToRemove = world.bodies.slice();
    bodiesToRemove.forEach(body => {
        world.removeBody(body);
    });

    buildTower();
    spawnBall();
}

function buildTower() {
    towerGroup = new THREE.Group();
    scene.add(towerGroup);

    // Calculate number of floors based on level: Level 1 = 3, Level 2 = 5, Level 3 = 7, etc.
    numFloors = 3 + (currentLevel - 1) * 2;

    // Central Cylinder (Visual)
    const cylinderGeo = new THREE.CylinderGeometry(CYLINDER_RADIUS * 0.8, CYLINDER_RADIUS * 0.8, numFloors * LEVEL_HEIGHT * 1.5, 32);
    const cylinderMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
    // Position y: - (numFloors * levelHeight) / 2
    // Swift: cylinderNode.position.y = Float(-CGFloat(numFloors) * levelHeight / 2)
    cylinderMesh.position.y = -(numFloors * LEVEL_HEIGHT) / 2;
    towerGroup.add(cylinderMesh);

    // Add invisible inner cylinder wall to keep ball from going inside
    const innerWallRadius = CYLINDER_RADIUS * 0.8;
    const wallHeight = numFloors * LEVEL_HEIGHT * 1.5;
    const wallBody = new CANNON.Body({ mass: 0 }); // Static body

    // Create cylinder collision shape using a composite of boxes (cylinder approximation)
    const segments = 12;
    const angle = (2 * Math.PI) / segments;
    const thickness = 0.15;

    for (let i = 0; i < segments; i++) {
        const currentAngle = i * angle;
        const nextAngle = (i + 1) * angle;

        // Use box shape to approximate cylinder
        const wallMidX = (innerWallRadius + thickness / 2) * Math.cos(currentAngle + angle / 2);
        const wallMidZ = (innerWallRadius + thickness / 2) * Math.sin(currentAngle + angle / 2);

        const wallShape = new CANNON.Box(
            new CANNON.Vec3(thickness / 2, wallHeight / 2, (innerWallRadius * angle) / 2)
        );

        wallBody.addShape(wallShape, new CANNON.Vec3(wallMidX, 0, wallMidZ));
    }

    wallBody.collisionFilterGroup = CATEGORY_PLATFORM;
    wallBody.collisionFilterMask = CATEGORY_BALL;
    world.addBody(wallBody);

    // Floors
    for (let i = 0; i < numFloors; i++) {
        const yPos = -i * LEVEL_HEIGHT;
        const isLast = (i === numFloors - 1);
        createFloor(yPos, isLast);
    }
}

function createFloor(y, isLast) {
    const gapSizeDeg = 45.0;
    const gapStartDeg = Math.random() * 360;
    const segmentCount = 12;
    const anglePerSegment = 360 / segmentCount;

    for (let i = 0; i < segmentCount; i++) {
        const startAngle = i * anglePerSegment;

        // Gap check
        const diff = Math.abs(angleDifference(startAngle, gapStartDeg));
        if (diff < gapSizeDeg && !isLast) {
            continue; // Create gap
        }

        createSegmentBlock(y, startAngle, isLast);
    }
}

function angleDifference(a1, a2) {
    let diff = a1 - a2;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    return diff;
}

function createSegmentBlock(y, angleDeg, isLast) {
    // Swift: SCNBox(width: width, height: platformHeight, length: outerR - innerR)
    // Pivot at center.
    // Three.js BoxGeometry is centered.
    // We need to match Swift "pivot" logic by positioning the mesh offset from the group center.

    const outerR = CYLINDER_RADIUS + 1.2;
    const innerR = CYLINDER_RADIUS * 0.8;
    const width = 2 * Math.PI * CYLINDER_RADIUS / 12.0;
    const length = outerR - innerR; // Depth in 3D terms

    // Visual Mesh
    const geometry = new THREE.BoxGeometry(width, PLATFORM_HEIGHT, length);

    // Mat
    let mat = platformMaterial;
    let collisionFilterGroup = CATEGORY_PLATFORM;

    // Random Death (Swift logic: !isLast && y < 0 && Bool.random... 1/8 chance)
    // Simplifying for JS port to keep it consistent
    // Swift: let isDeath = !isLast && y < 0 && Bool.random() && ...
    // Let's implement roughly 10% death panels
    const isDeath = !isLast && (y < 0) && (Math.random() < 0.1);

    if (isLast) {
        mat = lastPlatformMaterial;
        collisionFilterGroup = CATEGORY_LAST_PLATFORM;
    } else if (isDeath) {
        mat = deathMaterial;
        collisionFilterGroup = CATEGORY_DEATH;
    }

    const mesh = new THREE.Mesh(geometry, mat);

    // Position logic
    // Swift: node.pivot = Translation(0, 0, -offset)
    // This moves the box OUT.
    const offset = (outerR + innerR) / 2.0;

    // We need to rotate the segment around the TOWER center (0,0).
    // The segment itself is at distance `offset`.
    // Angle: angleDeg.

    const rad = THREE.MathUtils.degToRad(angleDeg);
    // In Three.js, x/z plane.
    // Swift eulerAngles.y = angle.

    mesh.position.set(Math.sin(rad) * offset, y, Math.cos(rad) * offset);
    mesh.rotation.y = rad;

    towerGroup.add(mesh); // Add to rotating tower group

    // Physics Body
    // Cannon.js Box shape is half-extents
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, PLATFORM_HEIGHT / 2, length / 2));
    const body = new CANNON.Body({
        mass: 0, // Static
        material: physicsMaterial,
        type: CANNON.Body.KINEMATIC
    });
    body.addShape(shape);

    // Match position/rotation of visual mesh
    body.position.copy(mesh.position);
    body.quaternion.copy(mesh.quaternion);

    body.collisionFilterGroup = collisionFilterGroup;
    body.collisionFilterMask = CATEGORY_BALL; // Collides with ball

    // custom property to identify type in collision handler
    body.gameType = isDeath ? 'DEATH' : (isLast ? 'LAST' : 'PLATFORM');
    body.visualMesh = mesh; // Link for rotation updates? 
    // Wait, if tower rotates, we need to manually update KINEMATIC bodies every frame.
    // Or, we can make the tower valid rigid bodies and rotate them?
    // Swift uses "Child Nodes".
    // In Cannon, we can't easily parent bodies. We must update their position/rotation manually if the parent rotates.
    // OR we put the ball in a world that doesn't verify rotation, but here interaction is key.
    // Easier approach: The TOWER rotates visually. The BODIES must rotate physically.
    // We will store these segment bodies in an array `towerBodies` and update their quaternions/positions based on tower rotation angle.

    if (!towerGroup.userData.bodies) towerGroup.userData.bodies = [];
    towerGroup.userData.bodies.push({
        body: body,
        initialPos: new THREE.Vector3(Math.sin(rad) * offset, y, Math.cos(rad) * offset),
        initialRot: rad
    });

    world.addBody(body);
}

function spawnBall() {
    // Visual
    const geometry = new THREE.SphereGeometry(BALL_RADIUS, 16, 16);
    ballMesh = new THREE.Mesh(geometry, ballMaterial);
    scene.add(ballMesh);

    // Body
    const shape = new CANNON.Sphere(BALL_RADIUS);
    ballBody = new CANNON.Body({
        mass: 0.6, // Swift: 0.6
        material: physicsMaterial,
        linearDamping: 0.4, // Swift: damping = 0.4
        angularDamping: 0.8, // Swift: 0.8
        position: new CANNON.Vec3(0, 3, CYLINDER_RADIUS) // Start pos
    });
    ballBody.addShape(shape);

    ballBody.collisionFilterGroup = CATEGORY_BALL;
    ballBody.collisionFilterMask = CATEGORY_PLATFORM | CATEGORY_DEATH | CATEGORY_LAST_PLATFORM;

    // Swift values
    // friction 0.5 (set in material contact)
    // restitution 0.8 (set in material contact)

    world.addBody(ballBody);

    // Collision Listener
    ballBody.addEventListener("collide", (e) => {
    if (isGameOver) return;

    const type = e.body.gameType;

    if (type === 'DEATH') {
        gameOver(false);
    } else if (type === 'LAST') {
        gameOver(true);
    } else if (type === 'PLATFORM') {
        // Save last safe floor
        const platformY = e.body.position.y;
        const floorIndex = Math.round(-platformY / LEVEL_HEIGHT);
        if (floorIndex < numFloors) {
            lastSafeFloorIndex = floorIndex;
            lastSafeTowerRotation = towerGroup.rotation.y; // 🔒 save safe angle
        }
    }
});

}

function updatePhysics() {
    if (isGameOver) return;

    world.step(1 / 60);

    // Sync Ball Visuals
    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion);

    // Keep ball from going inside the inner cylinder
    // Calculate horizontal distance from center (x, z plane)
    const ballDistFromCenter = Math.sqrt(
        ballBody.position.x * ballBody.position.x +
        ballBody.position.z * ballBody.position.z
    );
    const minDistance = CYLINDER_RADIUS * 0.8 + BALL_RADIUS;

    if (ballDistFromCenter < minDistance) {
        // Ball is too close to center, push it outward
        const angle = Math.atan2(ballBody.position.z, ballBody.position.x);
        const pushDistance = minDistance - ballDistFromCenter + 0.1;

        ballBody.position.x += Math.cos(angle) * pushDistance;
        ballBody.position.z += Math.sin(angle) * pushDistance;

        // Also push velocity outward to prevent it from being pushed back in
        const velocityAngle = Math.atan2(ballBody.velocity.z, ballBody.velocity.x);
        const velocityMagnitude = Math.sqrt(
            ballBody.velocity.x * ballBody.velocity.x +
            ballBody.velocity.z * ballBody.velocity.z
        );

        // If velocity is pointing inward, reverse it to point outward
        const velAngleDiff = Math.abs(velocityAngle - angle);
        if (velAngleDiff > Math.PI) {
            // Angles wrap, check the other way
            if (Math.abs(velAngleDiff - 2 * Math.PI) < Math.PI / 2) {
                // Velocity is inward, push outward
                ballBody.velocity.x = Math.cos(angle) * velocityMagnitude;
                ballBody.velocity.z = Math.sin(angle) * velocityMagnitude;
            }
        } else if (velAngleDiff < Math.PI / 2) {
            // Velocity is inward, push outward
            ballBody.velocity.x = Math.cos(angle) * velocityMagnitude;
            ballBody.velocity.z = Math.sin(angle) * velocityMagnitude;
        }
    }

    // Check Fall off
    // Last floor is at y = -(numFloors - 1) * LEVEL_HEIGHT
    // Allow ball to fall 3-4 floors below last floor before game over
    const lastFloorY = -(numFloors - 1) * LEVEL_HEIGHT;
    const limitY = lastFloorY - (3.5 * LEVEL_HEIGHT); // 3-4 floors below last floor
    if (ballBody.position.y < limitY) {
        gameOver(false);
    }

    // Update Score
    // Swift: depth = -ball.y; score = depth / levelHeight
    const depth = -ballBody.position.y;
    const newScore = Math.floor(depth / LEVEL_HEIGHT);
    if (newScore > score) {
        score = newScore;
        scoreEl.innerText = score;
    }

    // Camera Follow
    const targetY = ballBody.position.y + 5;
    camera.position.y += (targetY - camera.position.y) * 0.1;

    // Update Tower Rotation (Kinematic Bodies)
    if (towerGroup && towerGroup.userData.bodies) {
        const rotationY = towerGroup.rotation.y;

        towerGroup.userData.bodies.forEach(item => {
            const body = item.body;
            const initPos = item.initialPos;
            const initRot = item.initialRot;

            // Rotate position around Y axis
            // x' = x cos θ - z sin θ
            // z' = x sin θ + z cos θ
            // The tower rotates, so the "box" moves in world space.

            const cos = Math.cos(rotationY);
            const sin = Math.sin(rotationY);

            const x = initPos.x * cos + initPos.z * sin;
            const z = -initPos.x * sin + initPos.z * cos;

            body.position.set(x, initPos.y, z);

            // Update rotation
            // The box was structurally rotated by `initRot` initially.
            // Now we add `rotationY`.
            // Cannon uses quaternions.

            // New Angle = initRot + rotationY
            const totalAngle = initRot + rotationY;
            body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), totalAngle);
        });
    }
}

function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    renderer.render(scene, camera);
}

function gameOver(win) {
    if (isGameOver) return;
    isGameOver = true;

    // Update score to current depth when game over
    const depth = -ballBody.position.y;
    score = Math.floor(depth / LEVEL_HEIGHT);
    scoreEl.innerText = score;

    gameOverMenu.classList.remove('hidden');

    const h2 = gameOverMenu.querySelector('h2');
    if (win) {
    h2.innerText = "Level Complete!";
    h2.style.color = "#00ff00";
    restartBtn.classList.add('hidden');
    nextLevelBtn.classList.remove('hidden');
    rewardBtn.classList.add("hidden"); // ❌ no reward on win
    currentLevel++;
} else {
    h2.innerText = "Game Over";
    h2.style.color = "#ff3333";
    restartBtn.classList.remove('hidden');
    nextLevelBtn.classList.add('hidden');
    rewardBtn.classList.remove("hidden"); // ✅ only here
}


   
}


// --- Inputs ---

function setupInputs() {
    // 1. Tower Rotation (Pan)
    // Desktop: Mouse Drag
    // Mobile: Touch Drag

    const canvas = document.getElementById('game-ui'); // Listen on container

    canvas.addEventListener('pointerdown', (e) => {
        isDraggingTower = true;
        previousPointerX = e.clientX;
    });

    window.addEventListener('pointermove', (e) => {
        if (isDraggingTower && !isGameOver) {
            const deltaX = e.clientX - previousPointerX;
            towerGroup.rotation.y += deltaX * 0.01;
            previousPointerX = e.clientX;
        }
    });

    window.addEventListener('pointerup', () => {
        isDraggingTower = false;
    });

    // 2. Swipe Up (Jump)
    let touchStartY = 0;
    canvas.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchStartY - touchEndY > 50) {
            // Swipe Up
            handleSwipeUp();
        }
    }, { passive: true });
}

function handleSwipeUp() {
    if (!canStabilizeBall || isGameOver) return;
    canStabilizeBall = false;

    // Swift: ballBody.applyForce(SCNVector3(0, 3.5, 0), asImpulse: true)
    // Cannon applyImpulse takes world point.
    // Cancel downward velocity first? Swift: if velocity.y < 0 { velocity.y = 0 }
    if (ballBody.velocity.y < 0) ballBody.velocity.y = 0;

    ballBody.applyImpulse(new CANNON.Vec3(0, 3.5, 0), ballBody.position);

    setTimeout(() => { canStabilizeBall = true; }, stabilizeCooldown);
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    init();
    startBtn.addEventListener('click', startNewGame);
    resumeBtn.addEventListener('click', resumeGame);
    restartBtn.addEventListener('click', startGame);
    nextLevelBtn.addEventListener('click', startGame);
    rewardBtn.addEventListener("click", openRewardAd);

});
