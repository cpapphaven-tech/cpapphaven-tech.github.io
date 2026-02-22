// --- Game State & Variables ---
const SAVED_LEVEL_KEY = 'bottleShoot3D_level';
let round = parseInt(localStorage.getItem(SAVED_LEVEL_KEY)) || 1;
let lives = 3;
let gameState = 'start'; // 'start', 'playing', 'animating', 'gameover'

// UI Elements
const winScreen = document.getElementById('win-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const bonusBtn = document.getElementById('bonus-btn');
const restartLevel1Btn = document.getElementById('restart-level1-btn');
const statusMessage = document.getElementById('status-message');
const livesDisplay = document.getElementById('lives-display');
const roundText = document.getElementById('round-text');
const winnerText = document.getElementById('winner-text');
const scoreText = document.getElementById('score-text');

let gameStartTime = null;
let durationSent = false;
let gameStartedFlag = false;

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

function sendDurationOnExit(reason) {
    if (gameStartTime && !durationSent && window.trackGameEvent) {
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);

        window.trackGameEvent(`game_duration_bottleshoot_${seconds}_${reason}_${getBrowser()}`, {
            seconds,
            end_reason: reason,
            os: getOS()
        });

        durationSent = true;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {


        sendDurationOnExit("background_bottleshoot");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_bottleshoot");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        window.trackGameEvent(`exit_before_game_bottleshoot_${osKey}`, {
            os: getOS()
        });
    }
});



// --- Game Control ---
function loadAdsterraBanner() {
    try {
        // Desktop only check (using User Agent and Screen Width for safety)
        const osKey = getOSKey();
        if (osKey === "android" || osKey === "ios" || window.innerWidth < 1024) {
            return;
        }

        const container = document.getElementById("adsterra-banner");
        if (!container) return;

        setTimeout(() => {
            try {
                console.log("Loading Adsterra Banner...");

                // Create an iframe to safely isolate the ad execution
                const iframe = document.createElement('iframe');
                iframe.style.width = "160px";
                iframe.style.height = "600px";
                iframe.style.border = "none";
                iframe.style.overflow = "hidden";
                iframe.scrolling = "no";

                container.appendChild(iframe);

                const doc = iframe.contentWindow.document;
                doc.open();
                doc.write(`
                    <html>
                    <body style="margin:0;padding:0;background:transparent;">
                        <script>
                            atOptions = {
                                'key' : '34488dc997487ff336bf5de366c86553',
                                'format' : 'iframe',
                                'height' : 600,
                                'width' : 160,
                                'params' : {}
                            };
                        </script>
                        <script src="https://www.highperformanceformat.com/34488dc997487ff336bf5de366c86553/invoke.js"></script>
                    </body>
                    </html>
                `);
                doc.close();
            } catch (e) {
                console.warn("Banner init failed:", e);
            }
        }, 1000); // 1s delay for stability
    } catch (e) {
        console.warn("loadAdsterraBanner crashed:", e);
    }
}


// Simple Sound Effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, duration, vol) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}
function playShootSound() { playTone(200, 'triangle', 0.2, 0.5); }
function playHitSound() { playTone(800, 'square', 0.1, 0.3); playTone(1200, 'sine', 0.15, 0.2); }
function playWinSound() { playTone(400, 'sine', 0.2, 0.5); setTimeout(() => playTone(600, 'sine', 0.4, 0.5), 200); }

// --- Setup Three.js ---
const container = document.getElementById('game-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky Blue
scene.fog = new THREE.FogExp2(0x87CEEB, 0.015);

const isMobile = window.innerWidth <= 768;
// Stronger camera pull-back and angle for mobile to see the full scene
const camera = new THREE.PerspectiveCamera(isMobile ? 60 : 50, window.innerWidth / (window.innerHeight - 110), 0.1, 200);
camera.position.set(-15, 12, isMobile ? 35 : 22);
camera.lookAt(5, 3, 0);

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('game-canvas'),
    antialias: !isMobile,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight - 110);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// --- Load HDR ---
if (THREE.RGBELoader) {
    const rgbeLoader = new THREE.RGBELoader();
    rgbeLoader.load('../assets/royal_esplanade_1k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
    }, undefined, function (err) {
        console.warn("HDR Load failed, using fallback lighting:", err);
    });
} else {
    console.warn("RGBELoader not found, using fallback lighting.");
}

// --- Lights ---
// Lower ambient so Phong colors stay saturated (not bleached white)
const ambientLight = new THREE.AmbientLight(0xffd9a0, 0.25); // Warm, soft fill light
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff5e0, 1.4); // Warm sun
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = isMobile ? 512 : 1024;
dirLight.shadow.mapSize.height = isMobile ? 512 : 1024;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -15;
dirLight.shadow.camera.right = 15;
dirLight.shadow.camera.top = 15;
dirLight.shadow.camera.bottom = -15;
scene.add(dirLight);

// --- Cannon-es Setup ---
const world = new CANNON.World();
world.gravity.set(0, -15, 0); // slightly higher gravity for snappier play
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver.iterations = 30; // Increased to prevent tunneling
world.defaultContactMaterial.friction = 0.5;
world.defaultContactMaterial.restitution = 0.1;

// Global collision listener for sounds
world.addEventListener('postStep', function () {
    // Basic hit sound based on contact forces
    if (world.contacts.length > 0) {
        let maxForce = 0;
        for (let i = 0; i < world.contacts.length; i++) {
            // approximate contact velocity
            maxForce = Math.max(maxForce, Math.abs(world.contacts[i].getImpactVelocityAlongNormal()));
        }
        if (maxForce > 5) playHitSound();
    }
});

// Arrays to map physics bodies to visual meshes
const meshes = [];
const bodies = [];
let bottles = []; // Store bottle objects specifically to track if they fell

// Ground
const groundMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.8 }); // Green grass
const groundGeo = new THREE.BoxGeometry(100, 2, 100);
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.position.y = -1;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(50, 1, 50)),
    position: new CANNON.Vec3(0, -1, 0)
});
world.addBody(groundBody);

// Slingshot visuals (Not physical, just visual)
// Use MeshPhongMaterial for wood so it looks correctly brown even without HDR
const woodMat = new THREE.MeshPhongMaterial({ color: 0x7B4A1E, shininess: 10, specular: 0x331100 });
const slingGroup = new THREE.Group();
slingGroup.position.set(-10, 0, 0);

const postGeo = new THREE.CylinderGeometry(0.3, 0.4, 3);
const post = new THREE.Mesh(postGeo, woodMat);
post.position.y = 1.5;
post.castShadow = true;
slingGroup.add(post);

// Fork branches facing Z axis (Left & Right relative to shooting path)
const forkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2);
const forkL = new THREE.Mesh(forkGeo, woodMat);
forkL.position.set(0, 3.5, -0.8);
forkL.rotation.x = -Math.PI / 6;
forkL.castShadow = true;
slingGroup.add(forkL);

const forkR = new THREE.Mesh(forkGeo, woodMat);
forkR.position.set(0, 3.5, 0.8);
forkR.rotation.x = Math.PI / 6;
forkR.castShadow = true;
slingGroup.add(forkR);

scene.add(slingGroup);

// Rubber Bands
const bandMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const bandL = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]), bandMat);
const bandR = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]), bandMat);
scene.add(bandL);
scene.add(bandR);

function updateBands(ballPos) {
    if (!ballPos) {
        // Just span a straight line between the forks if empty
        bandL.geometry.setFromPoints([new THREE.Vector3(-10, 4.3, -1.3), new THREE.Vector3(-10, 4.3, 1.3)]);
        bandR.visible = false;
        return;
    }
    bandR.visible = true;
    bandL.geometry.setFromPoints([new THREE.Vector3(-10, 4.3, -1.3), ballPos]);
    bandR.geometry.setFromPoints([new THREE.Vector3(-10, 4.3, 1.3), ballPos]);
}

// Trajectory Line
const trajectoryMat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.8 }); // Dark Gray / Black
const trajectoryGeo = new THREE.SphereGeometry(0.12, 8, 8);
const trajectoryDots = [];
for (let i = 0; i < 7; i++) { // Shorter preview
    const dot = new THREE.Mesh(trajectoryGeo, trajectoryMat);
    dot.visible = false;
    scene.add(dot);
    trajectoryDots.push(dot);
}

// Ensure the bands are idle at startup before a ball is ever spawned
updateBands(null);


// Platforms for Bottles dynamically sized
let platformMeshes = [];
let platformBodies = [];

function clearPlatforms() {
    platformBodies.forEach(b => world.removeBody(b));
    platformMeshes.forEach(m => scene.remove(m));
    platformBodies = [];
    platformMeshes = [];
}

function createPlatform(x, width, height) {
    const platformGeo = new THREE.BoxGeometry(width, 0.5, 3.5);
    const pMesh = new THREE.Mesh(platformGeo, woodMat);
    pMesh.position.set(x, height, 0);
    pMesh.castShadow = true;
    pMesh.receiveShadow = true;
    scene.add(pMesh);

    const pBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(width / 2, 0.25, 1.75)),
        position: new CANNON.Vec3(x, height, 0)
    });
    world.addBody(pBody);

    const pillarGeo = new THREE.BoxGeometry(1, height, 2);
    const pillarMesh = new THREE.Mesh(pillarGeo, woodMat);
    pillarMesh.position.set(x, height / 2, 0);
    pillarMesh.castShadow = true;
    pillarMesh.receiveShadow = true;
    scene.add(pillarMesh);

    const pillarBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(0.5, height / 2, 1.0)),
        position: new CANNON.Vec3(x, height / 2, 0)
    });
    world.addBody(pillarBody);

    platformMeshes.push(pMesh, pillarMesh);
    platformBodies.push(pBody, pillarBody);
}

// Ball Reference
let currentBallMesh = null;
let currentBallBody = null;

// Materials for Bottles
// Deep, fully saturated bottle colors—look great without HDR
const bottleColors = [
    0xd62728, // Deep Red
    0x2ca02c, // Deep Green
    0x1f77b4, // Deep Blue
    0x8B00CC, // Deep Violet
    0xFFAA00, // Deep Amber / Yellow
    0xFF5500, // Deep Orange
    0x00879E, // Deep Teal
];

function makeBottleMat(color) {
    return new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,        // Use own color as emissive so dark areas stay colorful
        emissiveIntensity: 0.15, // Subtle — doesn't glow, just prevents black shadows
        shininess: 120,
        specular: 0xffffff,
    });
}

function createBottle(x, y, z) {
    const col = bottleColors[Math.floor(Math.random() * bottleColors.length)];
    const mat = makeBottleMat(col);

    // Bottle shape - height 2.8
    const points = [];
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(0.42, 0));
    points.push(new THREE.Vector2(0.42, 1.7));
    points.push(new THREE.Vector2(0.16, 2.2));
    points.push(new THREE.Vector2(0.16, 2.8));
    points.push(new THREE.Vector2(0, 2.8));
    const geo = new THREE.LatheGeometry(points, 16);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Physics cylinder height = 2.8, half = 1.4
    const shape = new CANNON.Cylinder(0.40, 0.40, 2.8, 8);
    const body = new CANNON.Body({
        mass: 0.5,
        position: new CANNON.Vec3(x, y + 1.4, z) // half of 2.8
    });

    // Rotate cylinder to stand up
    const q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);

    body.linearDamping = 0.5;
    body.angularDamping = 0.5;

    world.addBody(body);

    meshes.push(mesh);
    bodies.push(body);

    const b = { mesh, body, initialY: y + 1.4, felled: false };
    bottles.push(b);
}

function spawnPyramid(baseX, baseY, rows) {
    // Bottle height = 2.0. Horizontal spread just wider than bottle diameter (0.76).
    const BOTTLE_H = 2.8;  // must match physics cylinder above
    const spread = 0.90;   // center-to-center horizontal gap
    for (let r = 0; r < rows; r++) {
        // Each row sits on top of the previous. Step = exactly BOTTLE_H + tiny gap
        const y = baseY + r * (BOTTLE_H + 0.05);
        const bottlesInRow = rows - r;
        const rowWidth = (bottlesInRow - 1) * spread;
        const startX = baseX - rowWidth / 2;
        for (let c = 0; c < bottlesInRow; c++) {
            createBottle(startX + c * spread, y, 0);
        }
    }
}

function spawnLevel() {
    // Reset old bottles
    bottles.forEach(b => {
        world.removeBody(b.body);
        scene.remove(b.mesh);
        const idx = bodies.indexOf(b.body);
        if (idx > -1) {
            bodies.splice(idx, 1);
            meshes.splice(idx, 1);
        }
    });
    bottles = [];

    // Reset tables
    clearPlatforms();

    // Spawn completely different sets of tables and pyramids per round
    if (round === 1) {
        createPlatform(10, 6, 3);
        spawnPyramid(10, 3.25, 3);
    } else if (round === 2) {
        createPlatform(8, 4, 3);
        spawnPyramid(8, 3.25, 2);

        createPlatform(16, 5, 3);
        spawnPyramid(16, 3.25, 3);
    } else if (round === 3) {
        createPlatform(6, 4, 2);
        spawnPyramid(6, 2.25, 2);

        createPlatform(14, 5, 4);
        spawnPyramid(14, 4.25, 4);
    } else if (round === 4) {
        createPlatform(10, 6, 4);
        spawnPyramid(10, 4.25, 3);

        createPlatform(22, 6, 3);
        spawnPyramid(22, 3.25, 4);
    } else if (round === 5) {
        createPlatform(6, 4, 3);
        spawnPyramid(6, 3.25, 1);

        createPlatform(14, 8, 4);
        spawnPyramid(14, 4.25, 5);

        createPlatform(25, 5, 5);
        spawnPyramid(25, 5.25, 2);
    } else {
        // Endless mode randomly adds more tables and unpredictable pyramids scaling with round!
        const numTables = Math.min(3 + Math.floor(round / 4), 6);
        for (let i = 0; i < numTables; i++) {
            const rx = 6 + (i * 8) + (Math.random() * 2 - 1);
            const rHeight = 2 + (Math.random() * 4);
            const rows = 1 + Math.floor(Math.random() * 5); // 1 to 5 rows tall
            const rWidth = Math.max(rows * 1.5 + 1.5, 3); // Table wide enough to support base

            createPlatform(rx, rWidth, rHeight);
            spawnPyramid(rx, rHeight + 0.25, rows);
        }
    }
}

function spawnBall() {
    if (currentBallBody) {
        world.removeBody(currentBallBody);
        scene.remove(currentBallMesh);
        const idx = bodies.indexOf(currentBallBody);
        if (idx > -1) {
            bodies.splice(idx, 1);
            meshes.splice(idx, 1);
        }
    }

    const r = 0.35;
    const geo = new THREE.SphereGeometry(r, 16, 16);
    // Red rubber ball
    const mat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });
    currentBallMesh = new THREE.Mesh(geo, mat);
    currentBallMesh.castShadow = true;
    scene.add(currentBallMesh);

    currentBallBody = new CANNON.Body({
        mass: 2,
        shape: new CANNON.Sphere(r),
        position: new CANNON.Vec3(-10, 4, 0), // Start inside slingshot
        type: CANNON.Body.KINEMATIC // Static while aiming
    });
    world.addBody(currentBallBody);

    meshes.push(currentBallMesh);
    bodies.push(currentBallBody);

    // Threejs meshes default to 0,0,0. We MUST copy the cannon position immediately
    // Otherwise updateBands will draw the strings to the origin (0,0,0)!
    currentBallMesh.position.copy(currentBallBody.position);
    updateBands(currentBallMesh.position);
}

// --- Input Handling ---
let isDragging = false;
let dragStartPos = new THREE.Vector2();
let dragCurrentPos = new THREE.Vector2();
const anchorPoint = new THREE.Vector3(-10, 4, 0);

function onDown(e) {
    if (gameState !== 'playing') return;

    let clientX, clientY;
    if (e.changedTouches) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    isDragging = true;
    dragStartPos.set(clientX, clientY);
    dragCurrentPos.set(clientX, clientY);
}

function onMove(e) {
    if (!isDragging) return;

    let clientX, clientY;
    if (e.changedTouches) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    dragCurrentPos.set(clientX, clientY);

    // Calculate generic drag pixel distance (adjust sensitivity for web/mobile)
    let dx = (dragCurrentPos.x - dragStartPos.x) * 0.05;
    let dy = -(dragCurrentPos.y - dragStartPos.y) * 0.05; // Screen Y is flipped

    // Limit pulling back max distance
    const distSq = dx * dx + dy * dy;
    const maxPull = 4;
    if (distSq > maxPull * maxPull) {
        const factor = maxPull / Math.sqrt(distSq);
        dx *= factor;
        dy *= factor;
    }

    // Move ball visually
    // Positive screen right is positive world X, negative screen down is negative world Y
    currentBallBody.position.set(anchorPoint.x + dx, anchorPoint.y + dy, anchorPoint.z);
    currentBallMesh.position.copy(currentBallBody.position);
    updateBands(currentBallMesh.position);

    // Update Trajectory helper
    const forceFactor = -15;
    const velocityX = dx * forceFactor;
    const velocityY = dy * forceFactor;
    const g = world.gravity.y;

    for (let i = 0; i < trajectoryDots.length; i++) {
        // Draw the dots closer together in time, meaning a shorter projected arc
        const t = (i + 1) * 0.08;
        const px = currentBallBody.position.x + velocityX * t;
        const py = currentBallBody.position.y + velocityY * t + 0.5 * g * t * t;
        const pz = currentBallBody.position.z;

        trajectoryDots[i].position.set(px, py, pz);
        trajectoryDots[i].visible = true;
    }
}

function onUp(e) {
    if (!isDragging) return;
    isDragging = false;

    // Hide Trajectory calculation when playing
    trajectoryDots.forEach(dot => dot.visible = false);

    // Deduct Life visually immediately upon shooting!
    lives--;
    livesDisplay.textContent = lives;
    playShootSound();

    // Shoot!
    currentBallBody.type = CANNON.Body.DYNAMIC;

    // Calculate force based on physical displacement from anchor
    const displacement = new CANNON.Vec3();
    currentBallBody.position.vsub(new CANNON.Vec3(anchorPoint.x, anchorPoint.y, anchorPoint.z), displacement);

    // Reduced forceFactor prevents bullet-through-paper and provides a better arc
    const forceFactor = -15;
    const velocity = new CANNON.Vec3(displacement.x * forceFactor, displacement.y * forceFactor, 0);

    currentBallBody.velocity.copy(velocity);

    gameState = 'animating';

    // Snapping bands back to empty visual
    updateBands(null);

    // Wait for physics to settle, evaluate, and switch turn
    setTimeout(endTurn, 4000);
}

const canvasEl = renderer.domElement;
canvasEl.addEventListener('mousedown', onDown);
canvasEl.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
canvasEl.addEventListener('touchstart', onDown, { passive: false });
canvasEl.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
window.addEventListener('touchend', onUp);

function checkLevelClear() {
    bottles.forEach(b => {
        if (!b.felled) {
            // Check if off the table completely
            if (b.body.position.y < 1.0) {
                b.felled = true;
            } else {
                // Check if knocked over but resting on the table!
                // The body's local upright axis is always Y
                const upVec = new CANNON.Vec3(0, 1, 0);
                b.body.quaternion.vmult(upVec, upVec);
                // If the up vector's Y component drops, it means it is tilted more than 45-60 degrees.
                if (upVec.y < 0.6) {
                    b.felled = true;
                }
            }
        }
    });

    // Check if all bottles are down
    const remaining = bottles.filter(b => !b.felled).length;
    return remaining === 0;
}

function endTurn() {
    const allDown = checkLevelClear();

    if (allDown) {
        playWinSound();
        winScreen.classList.remove('hidden');
        winnerText.textContent = "LEVEL CLEAR!";
        winnerText.style.color = "#00f2fe";
        scoreText.textContent = `Completed Level ${round}!`;
        // Level Clear: show only Next Level button
        restartBtn.style.display = 'block';
        restartBtn.textContent = "Next Level";
        bonusBtn.style.display = 'none';
        restartLevel1Btn.style.display = 'none';
        gameState = 'gameover'; // Uses gameover state to wait for button click

        // Prep the next level info and save
        round++;
        localStorage.setItem(SAVED_LEVEL_KEY, round);
    } else {
        if (lives <= 0) {
            endGame();
        } else {
            statusMessage.textContent = "Try Again!";
            statusMessage.classList.remove('hidden');
            setTimeout(() => {
                statusMessage.classList.add('hidden');
                gameState = 'playing';
                spawnBall();
            }, 1000);
        }
    }
}

function endGame() {
    gameState = 'gameover';
    winScreen.classList.remove('hidden');
    winnerText.textContent = "GAME OVER";
    winnerText.style.color = "#ff3366";
    scoreText.textContent = `You reached Level ${round}!`;

    // Game Over: show only Watch Ad + Level 1 buttons, hide Next Level
    restartBtn.style.display = 'none';
    bonusBtn.style.display = 'block';
    restartLevel1Btn.style.display = 'block';

    // Store the level we died on so revive can continue from it
    window._diedOnRound = round;
    localStorage.removeItem(SAVED_LEVEL_KEY);
}

// ---- AUTO START (no dialog needed) ----
function startGame() {
    // Resume audio context on first user interaction
    document.addEventListener('pointerdown', () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }, { once: true });

    lives = 3;
    livesDisplay.textContent = '3';
    roundText.textContent = round;
    gameState = 'playing';

    spawnLevel();
    spawnBall();

    // Show pull-to-shoot hint briefly
    statusMessage.textContent = "✊ Pull the ball to shoot!";
    statusMessage.classList.remove('hidden');
    setTimeout(() => { statusMessage.classList.add('hidden'); }, 3000);

    if (!window.DEV_MODE) {
        loadAdsterraBanner();
    }
}

// Also keep startBtn for the restartBtn flow (level clear uses it)
startBtn.onclick = () => {
    startGame();
};

restartBtn.onclick = () => {
    winScreen.classList.add('hidden');
    restartBtn.style.display = 'none';

    // restartBtn is only shown on level clear — continue to next round
    startBtn.onclick();
};


// Watch Ad → revive with +1 life
bonusBtn.onclick = () => {
    // Open Adsterra smart link
    window.open(
        'https://www.effectivegatecpm.com/gp6cvyi4?key=a90897ce62f2dd15a5aab13ad90b2e66',
        '_blank'
    );

    // Revive! Restore the round we died on and give 1 life
    round = window._diedOnRound || round;
    lives = 3;
    winScreen.classList.add('hidden');
    bonusBtn.style.display = 'none';
    restartLevel1Btn.style.display = 'none';
    livesDisplay.textContent = lives;
    roundText.textContent = round;

    statusMessage.textContent = '❤️ You got 1 life!';
    statusMessage.classList.remove('hidden');
    setTimeout(() => { statusMessage.classList.add('hidden'); }, 1500);

    spawnLevel();
    spawnBall();
    gameState = 'playing';
};

// Start from Level 1 button
restartLevel1Btn.onclick = () => {
    winScreen.classList.add('hidden');
    bonusBtn.style.display = 'none';
    restartLevel1Btn.style.display = 'none';
    round = 1;
    localStorage.removeItem(SAVED_LEVEL_KEY);
    startBtn.onclick();
};

// --- Main Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'playing' || gameState === 'animating') {
        const dt = clock.getDelta();
        world.step(1 / 60, Math.min(dt, 0.1), 3);

        // Sync visual meshes with Physics bodies
        for (let i = 0; i < meshes.length; i++) {
            // Three.js Lathe geometries need a specific offset based on Cannon Cylinder integration
            // Since we tied mesh to body locally, we directly copy except for bottles which have Lathe orientation
            if (bottles.some(b => b.body === bodies[i])) {
                meshes[i].position.copy(bodies[i].position);
                // The LatheGeometry has origin at bottom, but cannon cylinder origin at center. 
                // We offset it so the mesh base aligns with cannon base
                meshes[i].quaternion.copy(bodies[i].quaternion);

                // Adjust position manually along its up vector for the half-height offset
                const up = new THREE.Vector3(0, -1, 0).applyQuaternion(meshes[i].quaternion);
                meshes[i].position.add(up.multiplyScalar(1.4)); // half of bottle height 2.8

            } else {
                meshes[i].position.copy(bodies[i].position);
                meshes[i].quaternion.copy(bodies[i].quaternion);
            }
        }
    }

    renderer.render(scene, camera);
}
animate();

// Auto-start the game immediately on load with safety delay
setTimeout(() => {
    try {
        startGame();
    } catch (e) {
        console.error("Critical: startGame failed", e);
    }
}, 100);

// Resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / (window.innerHeight - 110);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight - 110);
});
