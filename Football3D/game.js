/**
 * Football 3D - Three.js + Cannon.js Implementation
 */

// --- Constants ---
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 800;
const BALL_RADIUS = 0.35;
const PITCH_WIDTH = 12;
const PITCH_DEPTH = 50; // Keep it long but ball starts closer
const GOAL_WIDTH = 7; // Wider net
const GOAL_HEIGHT = 3.5;

// --- State Variables ---
let scene, camera, renderer, world;
let ballMesh, ballBody;
let goalkeeperMesh, goalkeeperBody;
let pitchMesh;
let score = 0;
let bestScore = localStorage.getItem('football_best_score') || 0;
let isGameOver = false;
let isGoalScored = false;
let gameStarted = false;
let goalkeeperSpeed = 0.5; // Slower start
let touchStart = { x: 0, y: 0 };
let touchEnd = { x: 0, y: 0 };
let touchCurrent = { x: 0, y: 0 };
let isDragging = false;
let startTime = 0;
let trajectoryDots = [];
const NUM_DOTS = 18;

let gameStartTime = null;
let durationSent = false;
let gameStartedFlag = false;
let gameRecordTime = null;

// --- Audio ---
const SOUNDS = {
    kick: '../assets/ball_kick.mp3',
    goal: '../assets/stadium_crowd.mp3',
    fail: '../assets/audience_fail.mp3'
};

const audioCache = {};
let isMuted = localStorage.getItem('pmg_football_muted') === 'true';

function initAudio() {
    Object.keys(SOUNDS).forEach(key => {
        const audio = new Audio(SOUNDS[key]);
        audio.preload = 'auto';
        audioCache[key] = audio;
    });

    const soundBtn = document.getElementById('sound-toggle');
    if (soundBtn) {
        soundBtn.innerText = isMuted ? '🔇' : '🔊';
        soundBtn.onclick = toggleMute;
    }
}

function playSound(name, volume = 0.1) {
    if (isMuted || !audioCache[name]) return;
    const s = audioCache[name].cloneNode();
    s.volume = volume;
    s.play().catch(() => { });
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('pmg_football_muted', isMuted);
    const soundBtn = document.getElementById('sound-toggle');
    if (soundBtn) soundBtn.innerText = isMuted ? '🔇' : '🔊';
}



function createFootballTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // White base (background for hexagons)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 2048, 2048);

    // Draw classic soccer ball pattern (black pentagons + white hexagons)
    const centerX = 1024;
    const centerY = 1024;
    const radius = 950;

    // Function to draw polygons
    function drawPolygon(sides, cx, cy, radius, fillColor, strokeColor, strokeWidth) {
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;

        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // Create a grid of pentagons and hexagons
    // This creates the classic soccer ball truncated icosahedron pattern
    const panelSize = 256;
    const strokeWidth = 6;

    // Draw in rows with offset pattern
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const x = col * panelSize + panelSize / 2;
            const y = row * panelSize + panelSize / 2;

            // Create alternating pentagon and hexagon pattern
            // Pentagons are black, hexagons are white
            if ((row + col) % 3 === 0) {
                // Black pentagon
                drawPolygon(5, x, y, panelSize * 0.32, '#000000', '#000000', strokeWidth);
            } else {
                // White hexagon
                drawPolygon(6, x, y, panelSize * 0.30, '#ffffff', '#000000', strokeWidth);
            }
        }
    }

    // Add diagonal offset panels for complete coverage
    for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 7; col++) {
            const x = col * panelSize + panelSize;
            const y = row * panelSize + panelSize;

            if ((row + col) % 3 !== 0) {
                drawPolygon(5, x, y, panelSize * 0.32, '#000000', '#000000', strokeWidth);
            } else {
                drawPolygon(6, x, y, panelSize * 0.30, '#ffffff', '#000000', strokeWidth);
            }
        }
    }

    // Add subtle shading for 3D effect
    const radialGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.2);
    radialGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    radialGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');

    ctx.fillStyle = radialGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Add glossy shine spot
    const shineGradient = ctx.createRadialGradient(centerX - 300, centerY - 300, 50, centerX - 300, centerY - 300, 400);
    shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
    shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = shineGradient;
    ctx.beginPath();
    ctx.arc(centerX - 300, centerY - 300, 400, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = 16;
    return tex;
}

// --- Supabase Config ---
const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;

// --- Session Tracking ---
let sessionId = null;
let sessionRowId = null;

function generateSessionId() {
    // Simple random string for session (could use uuid lib for more robust)
    return (
        Date.now().toString(36) +
        Math.random().toString(36).substr(2, 8)
    );
}

// --- DOM Elements ---
const scoreEl = document.getElementById('score');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const nameInput = document.getElementById('player-name-gameover');
const submitScoreBtn = document.getElementById('submit-score-btn');
const bonusBtn = document.getElementById('bonus-btn');

let canRevive = true; // Only allow one revival per game session

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

// --- Initialization ---
function init() {
    // 1. Three.js Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    camera = new THREE.PerspectiveCamera(60, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 1000);
    camera.position.set(0, 2.5, 12);
    camera.lookAt(0, 1.5, -17);


    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true,
        preserveDrawingBuffer: true
    });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 2. Cannon.js World
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);

    // 3. Game Objects
    setupPitch();
    setupGoal();
    setupBall();
    setupGoalkeeper();
    setupTrajectory();

    // 4. Supabase
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        loadLeaderboard();
        // Start session tracking
        startGameSession();
    }

    // if (window.renderTopLeftScroller) {
    //     renderTopLeftScroller();
    // }

    // 5. Events
    initAudio();
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    submitScoreBtn.addEventListener('click', submitScore);

    if (bonusBtn) {
        bonusBtn.addEventListener('click', () => {
            // Open ad
            window.open(
                "https://www.effectivegatecpm.com/gp6cvyi4?key=a90897ce62f2dd15a5aab13ad90b2e66",
                "_blank"
            );

            // Track click event
            if (window.trackGameEvent) {
                const osKey = getBrowser();
                window.trackGameEvent(`smartlink_ad_click_football_${osKey}`, {
                    ad_type: "reward",
                    game: "football_3d",
                    page: location.pathname
                });
            }

            revivePlayer();
        });
    }

    // Swipe handling
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('touchstart', (e) => {
        touchStart.x = e.touches[0].clientX;
        touchStart.y = e.touches[0].clientY;
        touchCurrent.x = touchStart.x;
        touchCurrent.y = touchStart.y;
        isDragging = true;
        startTime = Date.now();
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!isDragging || !gameStarted || isGoalScored || isGameOver) return;
        touchCurrent.x = e.touches[0].clientX;
        touchCurrent.y = e.touches[0].clientY;
        updateTrajectory();
    });

    canvas.addEventListener('touchend', (e) => {
        isDragging = false;
        hideTrajectory();
        touchEnd.x = e.changedTouches[0].clientX;
        touchEnd.y = e.changedTouches[0].clientY;
        if (gameStarted && !isGoalScored && !isGameOver) {
            handleKick();
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        touchStart.x = e.clientX;
        touchStart.y = e.clientY;
        touchCurrent.x = touchStart.x;
        touchCurrent.y = touchStart.y;
        isDragging = true;
        startTime = Date.now();
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging || !gameStarted || isGoalScored || isGameOver) return;
        touchCurrent.x = e.clientX;
        touchCurrent.y = e.clientY;
        updateTrajectory();
    });

    canvas.addEventListener('mouseup', (e) => {
        isDragging = false;
        hideTrajectory();
        touchEnd.x = e.clientX;
        touchEnd.y = e.clientY;
        if (gameStarted && !isGoalScored && !isGameOver) {
            handleKick();
        }
    });

    animate();
    startGame();

    // Load Ads

}



function setupPitch() {
    // Visual - Darker grass
    const geometry = new THREE.PlaneGeometry(PITCH_WIDTH, PITCH_DEPTH);
    const material = new THREE.MeshPhongMaterial({ color: 0x1b5e20 });
    pitchMesh = new THREE.Mesh(geometry, material);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.receiveShadow = true;
    scene.add(pitchMesh);

    // Field Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Halfway line
    const halfway = new THREE.Mesh(new THREE.PlaneGeometry(PITCH_WIDTH, 0.1), lineMat);
    halfway.rotation.x = -Math.PI / 2;
    halfway.position.y = 0.01;
    scene.add(halfway);

    // Goal area (box)
    const boxGeo = new THREE.PlaneGeometry(GOAL_WIDTH + 4, 0.1);

    // Front line of box
    const boxFront = new THREE.Mesh(boxGeo, lineMat);
    boxFront.rotation.x = -Math.PI / 2;
    boxFront.position.set(0, 0.01, -PITCH_DEPTH / 2 + 6);
    scene.add(boxFront);

    // Physics
    const groundBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane(),
        material: new CANNON.Material("ground")
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);
}

function setupGoal() {
    const poleMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, GOAL_HEIGHT);

    // Left post
    const leftPost = new THREE.Mesh(poleGeo, poleMat);
    leftPost.position.set(-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, -PITCH_DEPTH / 2 + 1);
    scene.add(leftPost);

    // Right post
    const rightPost = new THREE.Mesh(poleGeo, poleMat);
    rightPost.position.set(GOAL_WIDTH / 2, GOAL_HEIGHT / 2, -PITCH_DEPTH / 2 + 1);
    scene.add(rightPost);

    // Crossbar
    const barGeo = new THREE.CylinderGeometry(0.08, 0.08, GOAL_WIDTH);
    const bar = new THREE.Mesh(barGeo, poleMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, GOAL_HEIGHT, -PITCH_DEPTH / 2 + 1);
    scene.add(bar);

    // Actual Net Design
    const netMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });

    // Back of net
    const netBack = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_WIDTH, GOAL_HEIGHT, 10, 10), netMat);
    netBack.position.set(0, GOAL_HEIGHT / 2, -PITCH_DEPTH / 2 - 1);
    scene.add(netBack);

    // Sides/Top of net
    const netSideGeo = new THREE.PlaneGeometry(2, GOAL_HEIGHT, 4, 10);
    const leftNet = new THREE.Mesh(netSideGeo, netMat);
    leftNet.rotation.y = Math.PI / 2;
    leftNet.position.set(-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, -PITCH_DEPTH / 2);
    scene.add(leftNet);

    const rightNet = new THREE.Mesh(netSideGeo, netMat);
    rightNet.rotation.y = -Math.PI / 2;
    rightNet.position.set(GOAL_WIDTH / 2, GOAL_HEIGHT / 2, -PITCH_DEPTH / 2);
    scene.add(rightNet);

    const topNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_WIDTH, 2, 10, 4), netMat);
    topNet.rotation.x = Math.PI / 2;
    topNet.position.set(0, GOAL_HEIGHT, -PITCH_DEPTH / 2);
    scene.add(topNet);

    // Physics for posts
    const postShape = new CANNON.Cylinder(0.08, 0.08, GOAL_HEIGHT, 8);
    const lpBody = new CANNON.Body({ mass: 0 });
    lpBody.addShape(postShape);
    lpBody.position.set(-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, -PITCH_DEPTH / 2 + 1);
    world.addBody(lpBody);

    const rpBody = new CANNON.Body({ mass: 0 });
    rpBody.addShape(postShape);
    rpBody.position.set(GOAL_WIDTH / 2, GOAL_HEIGHT / 2, -PITCH_DEPTH / 2 + 1);
    world.addBody(rpBody);
}

function setupBall() {
    // Visual - Realistic Football Texture
    const geometry = new THREE.SphereGeometry(BALL_RADIUS, 64, 64);
    const material = new THREE.MeshPhongMaterial({
        map: createFootballTexture(),
        shininess: 80,
        specularMap: null,
        emissive: 0x222222,
        emissiveIntensity: 0.2,
        side: THREE.FrontSide,
        wireframe: false
    });
    ballMesh = new THREE.Mesh(geometry, material);
    ballMesh.castShadow = true;
    ballMesh.receiveShadow = true;
    scene.add(ballMesh);

    // Physics
    const shape = new CANNON.Sphere(BALL_RADIUS);
    ballBody = new CANNON.Body({
        mass: 1,
        shape: shape,
        material: new CANNON.Material("ball"),
        linearDamping: 0.1,
        angularDamping: 0.1
    });

    ballBody.ccdSpeedThreshold = 1;
    ballBody.ccdIterations = 10;


    world.addBody(ballBody);

    resetBall();

    // Collision detection
    ballBody.addEventListener("collide", (e) => {
        if (e.body === goalkeeperBody && !isGoalScored && gameStarted) {
            gameOver();
        }
    });
}

function setupGoalkeeper() {
    // Visual - Glowing Neon Shield (Outer)
    const geometry = new THREE.BoxGeometry(1.4, GOAL_HEIGHT, 0.2);

    const material = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.4
    });
    goalkeeperMesh = new THREE.Mesh(geometry, material);
    goalkeeperMesh.castShadow = true;

    // Core (Inner)
    const coreGeo = new THREE.BoxGeometry(
        0.8,
        GOAL_HEIGHT * 0.9, // slightly smaller than shield
        0.4
    );

    const coreMat = new THREE.MeshPhongMaterial({ color: 0x0088ff });
    const core = new THREE.Mesh(coreGeo, coreMat);
    goalkeeperMesh.add(core);

    // Add glowing edges
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
    goalkeeperMesh.add(line);

    scene.add(goalkeeperMesh);

    // Physics
    const shape = new CANNON.Box(new CANNON.Vec3(0.7, 1.0, 0.5));
    goalkeeperBody = new CANNON.Body({
        mass: 0,
        shape: shape
    });
    goalkeeperBody.position.set(0, 1.0, -PITCH_DEPTH / 2 + 3);
    world.addBody(goalkeeperBody);
}

function setupTrajectory() {
    const dotGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    for (let i = 0; i < NUM_DOTS; i++) {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.visible = false;
        scene.add(dot);
        trajectoryDots.push(dot);
    }
}

function updateTrajectory() {
    const dx = touchCurrent.x - touchStart.x;
    const dy = touchCurrent.y - touchStart.y;

    if (dy >= -10) {
        hideTrajectory();
        return;
    }

    const swipePower = Math.min(Math.abs(dy), 160);
    const forceY = swipePower * 0.035 + 1.2;
    const forceZ = -swipePower * 0.28;
    const forceX = dx * 0.03;

    const aimAssist = -ballBody.position.x * 0.15;
    const finalForceX = forceX + aimAssist;

    const v0x = finalForceX;
    const v0y = forceY;
    const v0z = forceZ;
    const gravity = -9.82;

    for (let i = 0; i < NUM_DOTS; i++) {
        const dot = trajectoryDots[i];

        // Compute predicted position (0.04s per step)
        const t = (i + 1) * 0.04;

        // Apply a small drag compensation factor to match cannon.js realistic trajectory 
        const dragFactor = (1 - (0.05 * t));

        const px = ballBody.position.x + (v0x * t * dragFactor);
        const py = ballBody.position.y + (v0y * t + 0.5 * gravity * t * t);
        const pz = ballBody.position.z + (v0z * t * dragFactor);

        // Ground collision for trajectory dots (so they don't go heavily under ground)
        if (py < 0) {
            dot.visible = false;
        } else {
            dot.position.set(px, py, pz);
            dot.visible = true;
        }

        // Scale down the dots as they get further
        const scale = 1 - (i / NUM_DOTS) * 0.5;
        dot.scale.set(scale, scale, scale);
    }
}

function hideTrajectory() {
    for (let i = 0; i < NUM_DOTS; i++) {
        if (trajectoryDots[i]) trajectoryDots[i].visible = false;
    }
}

function resetBall() {
    // Randomize position with increased distance for side angles
    const rangeX = 5.5;
    const startX = (Math.random() - 0.5) * 2 * rangeX;

    // Maintain a better distance: base 18-30 units + extra for side angles
    const distToBaseline = 18 + Math.random() * 12 + (Math.abs(startX) * 1.2);
    const startZ = -22 + distToBaseline;

    ballBody.position.set(startX, 0.5, startZ);
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);

    // Smoothly adjust camera to follow ball position
    if (camera) {
        camera.position.x = startX;
        camera.position.z = startZ + 6; // Maintain relative Z offset
        camera.lookAt(0, 1.5, -PITCH_DEPTH / 2); // Always look towards goal center
    }

    isGoalScored = false;
}

function handleKick() {
    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    const duration = Date.now() - startTime;

    // Minimum swipe check
    if (Math.abs(dy) < 30) return;

    // Calculate impulse
    // dy is negative for swipe up
    const swipePower = Math.min(Math.abs(dy), 160); // lower cap

    const forceY = swipePower * 0.035 + 1.2; // less vertical lift
    const forceZ = -swipePower * 0.28; // slower forward speed

    const forceX = dx * 0.03;


    ballBody.applyImpulse(new CANNON.Vec3(forceX, forceY, forceZ), ballBody.position);
    playSound('kick', 0.4); // Specific lower volume for kick

    // Soft aim assist toward center of goal
    const aimAssist = -ballBody.position.x * 0.15;
    ballBody.velocity.x += aimAssist;


    // Hide swipe guide after first kick
    const guide = document.getElementById('swipe-guide');
    if (guide) guide.classList.add('hidden');
}



function revivePlayer() {
    isGameOver = false;
    gameStarted = true;
    canRevive = false; // Disable for the rest of this run
    gameOverMenu.classList.add('hidden');

    // Reset ball position
    resetBall();
}

function showPartyWelcome() {
    const container = document.getElementById("party-welcome");
    const canvas = document.getElementById("confetti-canvas");

    if (!container || !canvas) return;

    container.classList.remove("hidden");

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti = [];

    for (let i = 0; i < 120; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 2,
            d: Math.random() * 40,
            color: `hsl(${Math.random() * 360}, 80%, 60%)`,
            tilt: Math.random() * 10 - 10
        });
    }

    let frame = 0;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        confetti.forEach(c => {
            ctx.beginPath();
            ctx.fillStyle = c.color;
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.fill();

            c.y += Math.cos(frame + c.d) + 2;
            c.x += Math.sin(frame) * 1.5;

            if (c.y > canvas.height) {
                c.y = -10;
            }
        });

        frame += 0.05;
    }

    const interval = setInterval(draw, 16);

    setTimeout(() => {
        clearInterval(interval);
        container.classList.add("hidden");
        container.style.display = "none"; // force hide
    }, 3000);
}


function showTutorial() {
    const overlay = document.getElementById("tutorial-overlay");
    const video = document.getElementById("tutorial-video");

    if (!overlay || !video) return;

    overlay.classList.remove("hidden");

    video.currentTime = 0;

    video.play().catch(err => {
        console.log("Autoplay blocked:", err);
    });

    const endTutorial = () => {
        overlay.classList.add("hidden");
        video.pause();
        overlay.style.display = "none"; // force hide
    };

    const timer = setTimeout(endTutorial, 8000);

    video.onended = endTutorial;
}


document.addEventListener("DOMContentLoaded", () => {
    const joinTgBtn = document.getElementById("join-tg-btn");
    if (joinTgBtn) {
        joinTgBtn.addEventListener("click", () => {
            document.getElementById("full-leaderboard").classList.remove("hidden");
            loadLeaderboard();
        });
    }
});

function startGame() {
    gameStarted = true;
    canRevive = true; // Reset revival for new game
    mainMenu.classList.add('hidden');
    score = 0;
    gameStartedFlag = true; // mark started
    scoreEl.innerText = score;
    goalkeeperSpeed = 0.5; // Slower start

    gameStartTime = Date.now();   // ⏱ start timer
    gameRecordTime = Date.now();
    durationSent = false;

    // Mark session as started
    markSessionStarted();

    // Show challenge message
    showChallengeMessage();

    if (bonusBtn) bonusBtn.classList.add('hidden');

    const guide = document.getElementById('swipe-guide');
    if (guide) guide.classList.remove('hidden');

    resetBall();
}

// Show Challenge Message at Game Start
function showChallengeMessage() {
    if (window.challengeShown) return;
    const challengeMsg = document.getElementById('challenge-message');
    if (!challengeMsg) return;

    challengeMsg.classList.remove('hidden');
    window.challengeShown = true;

    // Fade out and hide after 3.5 seconds
    setTimeout(() => {
        challengeMsg.classList.add('hidden');
    }, 3500);
}

function restartGame() {

    const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
    if (seconds > (window.PMG_TICK_RATE || 60)) {
        syncPMGLayout();
        gameRecordTime = Date.now(); 
    }

    isGameOver = false;
    gameOverMenu.classList.add('hidden');

    const guide = document.getElementById('swipe-guide');
    if (guide) guide.classList.remove('hidden');

    startGame();
}

function gameOver() {
    isGameOver = true;
    isGoalScored = false;
    gameStarted = false;

    // Show/Hide bonus button based on revival usage
    if (bonusBtn) {
        if (canRevive && score > 0) {
            bonusBtn.classList.remove('hidden');
        } else {
            bonusBtn.classList.add('hidden');
        }
    }

    // Hide goal feedback if active
    const feedback = document.getElementById('goal-feedback');
    if (feedback) feedback.classList.add('hidden');

    // Reset submit button state for new score
    submitScoreBtn.disabled = false;
    submitScoreBtn.innerText = 'Submit Score';

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('football_best_score', bestScore);
    }

    finalScoreEl.innerText = score;
    bestScoreEl.innerText = bestScore;

    // Render Game Scroller
    if (window.renderGameScroller) {
        renderGameScroller('game-over-scroller');
    }

    gameOverMenu.classList.remove('hidden');
    playSound('fail', 0.3); // Reduced from 0.6

    if (window.trackGameEvent) {
        const osKey = getBrowser();
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);


        window.trackGameEvent(`game_over_football_${osKey}_${seconds}`, {
            game_name: "Football 3D",
            final_score: score,
            duration_seconds: seconds
        });
    }

}

function showGoalFeedback() {
    const feedback = document.getElementById('goal-feedback');
    if (!feedback) return;
    feedback.innerText = "GOAL IT!";
    feedback.classList.remove('hidden');
    feedback.classList.add('goal-pop');
    setTimeout(() => {
        feedback.classList.add('hidden');
        feedback.classList.remove('goal-pop');
    }, 1000);
}

function checkGoal() {
    if (isGoalScored || !gameStarted || isGameOver) return;

    const bPos = ballBody.position;

    // --- ✅ Goalkeeper collision detection ---
    const gPos = goalkeeperBody.position;

    const gHalfWidth = 0.7;
    const gHalfHeight = GOAL_HEIGHT / 2;
    const gHalfDepth = 0.5;

    const hitGoalkeeper =
        Math.abs(bPos.x - gPos.x) < gHalfWidth &&
        Math.abs(bPos.y - gPos.y) < gHalfHeight &&
        Math.abs(bPos.z - gPos.z) < gHalfDepth;

    if (hitGoalkeeper) {
        gameOver();
        return;
    }

    // --- Goal scored ---
    if (bPos.z < -PITCH_DEPTH / 2 + 1 && bPos.z > -PITCH_DEPTH / 2 - 1) {
        if (Math.abs(bPos.x) < GOAL_WIDTH / 2 && bPos.y < GOAL_HEIGHT) {
            score++;
            scoreEl.innerText = score;
            isGoalScored = true;
            showGoalFeedback();
            playSound('goal', 0.5); // Specific balanced volume for goal cheer
            goalkeeperSpeed += 0.08;
            setTimeout(resetBall, 1500);
        }
    }

    // --- Miss detection ---
    if (bPos.z < -PITCH_DEPTH / 2 - 2) {
        if (!isGoalScored) {
            gameOver();
        }
    }

    // --- Out of bounds ---
    if (Math.abs(bPos.x) > PITCH_WIDTH / 2 + 2) {
        gameOver();
    }
}


function updateGoalkeeper() {
    const time = Date.now() * 0.001;
    const limit = GOAL_WIDTH / 2 - 0.5;
    const x = Math.sin(time * goalkeeperSpeed) * limit;
    goalkeeperBody.position.x = x;
    goalkeeperMesh.position.copy(goalkeeperBody.position);
}

function animate() {
    requestAnimationFrame(animate);

    if (gameStarted && !isGameOver) {
        world.step(1 / 60);

        // Sync Visuals
        ballMesh.position.copy(ballBody.position);
        ballMesh.quaternion.copy(ballBody.quaternion);

        updateGoalkeeper();
        checkGoal();
    }

    renderer.render(scene, camera);
}

// --- Leaderboard Functions ---
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

async function submitScore() {
    const name = nameInput.value.trim() || 'Player';
    if (!supabaseClient) return;

    submitScoreBtn.disabled = true;
    submitScoreBtn.innerText = 'Saving...';
    const country = await getCountry();

    const { error } = await supabaseClient
        .from('football3d_scores')
        .insert([{
            username: name || 'Guest',
            score: score,
            country: country || 'NA'
        }]);

    if (error) {
        console.error("Score submission error:", error);
        alert("Failed to save score. Please try again.");
        submitScoreBtn.disabled = false;
        submitScoreBtn.innerText = 'Submit Score';
    } else {
        submitScoreBtn.innerText = 'Saved!';
        loadLeaderboard();
    }
}

async function loadLeaderboard() {
    if (!supabaseClient) return;

    const sideList = document.getElementById("side-lb-list");
    const fullList = document.getElementById("full-lb-list");

    try {
        const { data, error } = await supabaseClient
            .from("football3d_scores")
            .select("*")
            .order("score", { ascending: false })
            .limit(20);

        if (error) throw error;

        if (sideList) {
            const isDesktop = window.innerWidth >= 1024;
            const limitVal = isDesktop ? 10 : 5;

            sideList.innerHTML = data.slice(0, limitVal).map((p, i) => `
                <div class="lb-row">
                    <span class="lb-rank">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"][i] || (i + 1)}</span>
                    <span class="lb-user">${p.username} (${p.country})</span>
                    <span class="lb-score">${p.score}</span>
                </div>
            `).join('');
        }

        if (fullList) {
            fullList.innerHTML = data.map((p, i) => `
                <div class="lb-row">
                    <span class="lb-rank">${i + 1}</span>
                    <span class="lb-user">${p.username} (${p.country})</span>
                
                    <span class="lb-score">${p.score}</span>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error(e);
    }
}

window.closeFullLeaderboard = function () {
    document.getElementById("full-leaderboard").classList.add("hidden");
};

const viewFullLb = document.getElementById("view-full-lb");
if (viewFullLb) {
    viewFullLb.addEventListener("click", () => {
        document.getElementById("full-leaderboard").classList.remove("hidden");
        loadLeaderboard();
    });
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
        window.trackGameEvent(`game_duration_football_${seconds}_${reason}_${getBrowser()}`, {
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
// --- Session Tracking Functions ---
async function startGameSession() {
    if (!supabaseClient) return;
    sessionId = generateSessionId();
    const placementId = getPlacementId();
    const os = getOS();
    const browser = getBrowser();
    const userAgent = navigator.userAgent;
    const gameSlug = "football3d";
    const country = await getCountry();
    try {
        const { data, error } = await supabaseClient
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
            ])
            .select('id');
        if (!error && data && data.length > 0) {
            sessionRowId = data[0].id;
        }
    } catch (e) {
        // Ignore errors for now
    }
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

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        sendDurationOnExit("background_football");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_football");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getBrowser();
        const placementId = getPlacementId();
        window.trackGameEvent(`exit_before_game_football_${osKey}`, {
            os: getOS(),
            placement_id: placementId
        });
    }
});


// Start
init();

showTutorial();

showPartyWelcome();
