// Elements
const startScreen = document.getElementById('start-screen');
const winScreen = document.getElementById('level-complete-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const goalMessage = document.getElementById('goal-message');
const scoreDisplay = document.getElementById('score-display');
const winnerText = document.getElementById('winner-text');

let playerScore = 0;
let aiScore = 0;
const WIN_SCORE = 7;
let gameState = 'start'; // 'start', 'playing', 'goal', 'gameover'

// Web Audio API for Sound Effects
let audioCtx;

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

        window.trackGameEvent(`game_duration_airhockey_${seconds}_${reason}_${getBrowser()}`, {
            seconds,
            end_reason: reason,
            os: getOS()
        });

        durationSent = true;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {


        sendDurationOnExit("background_airhockey");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_airhockey");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        window.trackGameEvent(`exit_before_game_airhockey_${osKey}`, {
            os: getOS()
        });
    }
});

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!audioCtx || audioCtx.state === 'suspended') return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'hit') {
        // High pitched short beep
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'wall') {
        // Lower, duller bump
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'goal') {
        // Arcade arpeggio up
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    }
}

// Scene Setup
const container = document.getElementById('game-container');
const scene = new THREE.Scene();
// Use very dark grey instead of pure black. Pure black (0x000000) causes intense OLED smearing (motion blur ghosting) on mobile devices for fast-moving bright objects.
scene.background = new THREE.Color(0x0a0a10);
scene.fog = new THREE.FogExp2(0x0a0a10, 0.015);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
// Top down angled view
camera.position.set(0, 22, 28);
camera.lookAt(0, 0, 4);

const isMobile = window.innerWidth <= 768;

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('game-canvas'),
    antialias: !isMobile,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight - 110); // Minus header and banner ad
renderer.setPixelRatio(window.devicePixelRatio); // Let the device dictate full resolution for sharpness
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// HDR Environment
const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.load('../assets/royal_esplanade_1k.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    // Don't set background, keep it dark for neon vibe
});

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = isMobile ? 512 : 1024;
dirLight.shadow.mapSize.height = isMobile ? 512 : 1024;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -15;
dirLight.shadow.camera.right = 15;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -20;
scene.add(dirLight);

// Constants
const BOARD_W = 14;
const BOARD_L = 24;
const GOAL_W = 4.5;
const PUCK_R = 0.6;
const MALLET_R = 1.0;

// Add a central spotlight to highlight the glossy board
const spotLight = new THREE.SpotLight(0xffffff, 4);
spotLight.position.set(0, 30, 0);
spotLight.angle = Math.PI / 4;
spotLight.penumbra = 0.5;
spotLight.decay = 2;
spotLight.distance = 100;
scene.add(spotLight);

// Materials - Using Physical Material for Hyper-Realistic Glossy Look
const neonCyan = new THREE.MeshPhysicalMaterial({
    color: 0x00f2fe, emissive: 0x004488, emissiveIntensity: 0.4,
    roughness: 0.1, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.1
});
const neonMagenta = new THREE.MeshPhysicalMaterial({
    color: 0xff3366, emissive: 0x880022, emissiveIntensity: 0.4,
    roughness: 0.1, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.1
});
const neonYellow = new THREE.MeshPhysicalMaterial({
    color: 0xccff00, emissive: 0x448800, emissiveIntensity: 0.4,
    roughness: 0.1, metalness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.1
});

// Board surface - hyper-glossy ice/acrylic feel
// Fix for WebGL artifacting/blur on mobile web view: The HDR outdoor reflection looks like blocky pixels on the floor. 
// Disabling envMap reflection entirely for the floor and relying on pure specular light glares instead.
const boardMat = new THREE.MeshStandardMaterial({
    color: 0x050510,
    roughness: 0.2, // Smooth enough for clean light glares
    metalness: 0.2, // Low metalness so it acts like dark plastic/acrylic instead of mirror
    envMapIntensity: 0.0 // Do not reflect the HDRI, fixes the blurry surface!
});
// Walls - metallic chrome/brushed metal
const wallMat = new THREE.MeshStandardMaterial({
    color: 0x11111a,
    metalness: 0.9,
    roughness: 0.4
});

// Game Objects
// 1. Board
const boardGeo = new THREE.BoxGeometry(BOARD_W, 0.5, BOARD_L);
const board = new THREE.Mesh(boardGeo, boardMat);
board.position.y = -0.25;
board.receiveShadow = true;
scene.add(board);

// Center line (Neon)
const lineGeo = new THREE.PlaneGeometry(BOARD_W, 0.15);
const lineMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.6 });
const line = new THREE.Mesh(lineGeo, lineMat);
line.rotation.x = -Math.PI / 2;
line.position.y = 0.01;
scene.add(line);

// Center circle (Neon)
const circleRingGeo = new THREE.RingGeometry(2, 2.15, 32);
const circleRing = new THREE.Mesh(circleRingGeo, lineMat);
circleRing.rotation.x = -Math.PI / 2;
circleRing.position.y = 0.01;
scene.add(circleRing);

// Walls
const wallThickness = 1;
const wallH = 1;

function createWall(w, l, x, z) {
    const geo = new THREE.BoxGeometry(w, wallH, l);
    const mesh = new THREE.Mesh(geo, wallMat);
    mesh.position.set(x, wallH / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}

// Side walls
createWall(wallThickness, BOARD_L + wallThickness * 2, -BOARD_W / 2 - wallThickness / 2, 0);
createWall(wallThickness, BOARD_L + wallThickness * 2, BOARD_W / 2 + wallThickness / 2, 0);
// Top/Bottom walls (with gaps for goals)
const sideWallLen = (BOARD_W - GOAL_W) / 2;
// Bottom (Player)
createWall(sideWallLen, wallThickness, -BOARD_W / 2 + sideWallLen / 2, BOARD_L / 2 + wallThickness / 2);
createWall(sideWallLen, wallThickness, BOARD_W / 2 - sideWallLen / 2, BOARD_L / 2 + wallThickness / 2);
// Top (AI)
createWall(sideWallLen, wallThickness, -BOARD_W / 2 + sideWallLen / 2, -BOARD_L / 2 - wallThickness / 2);
createWall(sideWallLen, wallThickness, BOARD_W / 2 - sideWallLen / 2, -BOARD_L / 2 - wallThickness / 2);

// Goals Markers
const goalGeo = new THREE.BoxGeometry(GOAL_W, 0.1, 1);
const playerGoal = new THREE.Mesh(goalGeo, new THREE.MeshBasicMaterial({ color: 0x00f2fe, opacity: 0.5, transparent: true }));
playerGoal.position.set(0, 0, BOARD_L / 2 + 0.5);
scene.add(playerGoal);

const aiGoal = new THREE.Mesh(goalGeo, new THREE.MeshBasicMaterial({ color: 0xff3366, opacity: 0.5, transparent: true }));
aiGoal.position.set(0, 0, -BOARD_L / 2 - 0.5);
scene.add(aiGoal);

// Puck
// Puck
const puckGeo = new THREE.CylinderGeometry(PUCK_R, PUCK_R, 0.3, 32);
const puck = new THREE.Mesh(puckGeo, neonYellow);
puck.position.y = 0.15;
puck.castShadow = true;

// Add glowing point light to puck
const puckLight = new THREE.PointLight(0xccff00, 1.5, 12);
puckLight.position.y = 0.5;
puck.add(puckLight);

scene.add(puck);

// Mallets
// Mallets
function createMallet(mat, lightColor) {
    const group = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(MALLET_R, MALLET_R * 1.1, 0.4, 32);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.2;
    base.castShadow = true;
    group.add(base);

    const handleGeo = new THREE.CylinderGeometry(MALLET_R * 0.4, MALLET_R * 0.5, 0.8, 16);
    const handle = new THREE.Mesh(handleGeo, mat);
    handle.position.y = 0.8;
    handle.castShadow = true;
    group.add(handle);

    // Glowing light for mallet
    const mLight = new THREE.PointLight(lightColor, 1.0, 10);
    mLight.position.y = 1;
    group.add(mLight);

    scene.add(group);
    return group;
}

const player = createMallet(neonCyan, 0x00f2fe);
const ai = createMallet(neonMagenta, 0xff3366);

// Physics State
let puckVel = { x: 0, z: 0 };
let playerVel = { x: 0, z: 0 };
let lastPlayerPos = { x: 0, z: BOARD_L / 4 };

function resetPositions(scorer) {
    player.position.set(0, 0, BOARD_L / 4);
    ai.position.set(0, 0, -BOARD_L / 4);

    // Fix: Ensure puck isn't spawned inside mallet
    if (scorer === 'player') {
        puck.position.set(0, 0.2, -2);
    } else if (scorer === 'ai') {
        puck.position.set(0, 0.2, 2);
    } else {
        puck.position.set(0, 0.2, 0);
    }

    puckVel = { x: 0, z: 0 };
    playerVel = { x: 0, z: 0 };
    lastPlayerPos = { x: player.position.x, z: player.position.z };
}

resetPositions();

// Input Handling
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let isDragging = false;

function getIntersect(event) {
    let clientX, clientY;
    if (event.changedTouches) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);
    return target;
}

const canvasEl = renderer.domElement;

function onDown(e) {
    if (gameState !== 'playing') return;
    const target = getIntersect(e);
    // Only grab if clicking in player's half
    if (target && target.z > 0) {
        isDragging = true;
        movePlayer(target);
    }
}

function onMove(e) {
    if (!isDragging || gameState !== 'playing') return;
    const target = getIntersect(e);
    if (target) {
        movePlayer(target);
    }
}

function onUp() {
    isDragging = false;
}

function movePlayer(target) {
    // Constrain to player's half
    let nx = Math.max(-BOARD_W / 2 + MALLET_R, Math.min(BOARD_W / 2 - MALLET_R, target.x));
    let nz = Math.max(MALLET_R, Math.min(BOARD_L / 2 - MALLET_R, target.z)); // Don't cross center

    player.position.x = nx;
    player.position.z = nz;
}

canvasEl.addEventListener('mousedown', onDown);
canvasEl.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
canvasEl.addEventListener('touchstart', onDown, { passive: false });
canvasEl.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
window.addEventListener('touchend', onUp);

// Progressive Difficulty Setup
let gamesPlayed = parseInt(localStorage.getItem('airHockeyGamesPlayed')) || 0;

// Physics & Game Loop Variables
let maxSpeed = 0.8 + Math.min(gamesPlayed, 15) * 0.04; // Starts slow, caps around 1.4
const friction = 0.995;
let aiSpeed = 0.05 + Math.min(gamesPlayed, 15) * 0.01; // Starts clumsy, gets faster

function updatePhysics() {
    if (gameState !== 'playing') return;

    // Calculate player velocity based on frame-to-frame movement
    playerVel.x = player.position.x - lastPlayerPos.x;
    playerVel.z = player.position.z - lastPlayerPos.z;
    lastPlayerPos.x = player.position.x;
    lastPlayerPos.z = player.position.z;

    // AI Logic
    let aiTargetX = puck.position.x;
    let aiTargetZ = -BOARD_L / 4; // Default resting position

    if (puck.position.z < 0) {
        // Attack/Defend
        aiTargetZ = Math.min(-MALLET_R, Math.max(-BOARD_L / 2 + MALLET_R, puck.position.z - 1.5));

        // Prevent own goals if puck is behind AI
        if (puck.position.z < ai.position.z) {
            aiTargetX = puck.position.x > 0 ? puck.position.x - 2 : puck.position.x + 2;
        }
    }

    // Constrain AI target to its half
    aiTargetX = Math.max(-BOARD_W / 2 + MALLET_R, Math.min(BOARD_W / 2 - MALLET_R, aiTargetX));

    // Move AI smoothly
    ai.position.x += (aiTargetX - ai.position.x) * aiSpeed;
    ai.position.z += (aiTargetZ - ai.position.z) * aiSpeed;

    // Apply friction and cap speed
    puckVel.x *= friction;
    puckVel.z *= friction;

    let speed = Math.sqrt(puckVel.x * puckVel.x + puckVel.z * puckVel.z);
    if (speed > maxSpeed) {
        puckVel.x = (puckVel.x / speed) * maxSpeed;
        puckVel.z = (puckVel.z / speed) * maxSpeed;
    }
    if (speed < 0.01) {
        puckVel.x = 0;
        puckVel.z = 0;
    }

    // Move puck
    puck.position.x += puckVel.x;
    puck.position.z += puckVel.z;

    // Collisions
    checkWallCollisions();
    checkMalletCollision(player, playerVel);
    checkMalletCollision(ai, { x: ai.position.x - aiTargetX, z: ai.position.z - aiTargetZ }); // Approx AI vel

    // Goal Check
    if (puck.position.z > BOARD_L / 2) {
        if (Math.abs(puck.position.x) < GOAL_W / 2) {
            scoreGoal('ai');
        } else {
            puck.position.z = BOARD_L / 2;
            puckVel.z *= -1;
        }
    } else if (puck.position.z < -BOARD_L / 2) {
        if (Math.abs(puck.position.x) < GOAL_W / 2) {
            scoreGoal('player');
        } else {
            puck.position.z = -BOARD_L / 2;
            puckVel.z *= -1;
        }
    }
}

function checkWallCollisions() {
    let hit = false;
    if (puck.position.x > BOARD_W / 2 - PUCK_R) {
        puck.position.x = BOARD_W / 2 - PUCK_R;
        puckVel.x *= -1;
        hit = true;
    } else if (puck.position.x < -BOARD_W / 2 + PUCK_R) {
        puck.position.x = -BOARD_W / 2 + PUCK_R;
        puckVel.x *= -1;
        hit = true;
    }

    // Bounce off back walls if not hitting goal gap
    if (Math.abs(puck.position.x) >= GOAL_W / 2) {
        if (puck.position.z > BOARD_L / 2 - PUCK_R) {
            puck.position.z = BOARD_L / 2 - PUCK_R;
            puckVel.z *= -1;
            hit = true;
        } else if (puck.position.z < -BOARD_L / 2 + PUCK_R) {
            puck.position.z = -BOARD_L / 2 + PUCK_R;
            puckVel.z *= -1;
            hit = true;
        }
    }
    if (hit) playSound('wall');
}

function checkMalletCollision(mallet, mVel) {
    const dx = puck.position.x - mallet.position.x;
    const dz = puck.position.z - mallet.position.z;
    const distSq = dx * dx + dz * dz;
    const minDist = PUCK_R + MALLET_R;

    if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        // Normalize normal vector
        const nx = dx / dist;
        const nz = dz / dist;

        // Push puck out of mallet to prevent sticking
        const overlap = minDist - dist;
        puck.position.x += nx * overlap;
        puck.position.z += nz * overlap;

        // Relative velocity
        const rvx = puckVel.x - mVel.x;
        const rvz = puckVel.z - mVel.z;

        // Dot product
        const velAlongNormal = rvx * nx + rvz * nz;

        if (velAlongNormal > 0) return; // Moving away

        // Restitution (bounciness)
        const e = 0.8;

        // We assume mallet mass is infinite for arcade feel, or much heavier
        // New puck velocity = incoming + reflection + mallet impules
        const j = -(1 + e) * velAlongNormal;

        puckVel.x += j * nx;
        puckVel.z += j * nz;

        // Add a bit of the mallet's momentum directly for a more forceful hit feel
        puckVel.x += mVel.x * 0.8;
        puckVel.z += mVel.z * 0.8;

        playSound('hit');
    }
}

function scoreGoal(scorer) {
    if (gameState !== 'playing') return;
    gameState = 'goal';
    playSound('goal');

    if (scorer === 'player') {
        playerScore++;
    } else {
        aiScore++;
    }

    updateScoreUI();

    goalMessage.classList.remove('hidden');
    goalMessage.style.animation = 'none';
    void goalMessage.offsetWidth; // Trigger reflow
    goalMessage.style.animation = 'goalPop 1.5s ease-out forwards';

    setTimeout(() => {
        goalMessage.classList.add('hidden');
        if (playerScore >= WIN_SCORE || aiScore >= WIN_SCORE) {
            endGame(playerScore >= WIN_SCORE);
        } else {
            resetPositions(scorer);
            gameState = 'playing';
        }
    }, 1500);
}

function updateScoreUI() {
    scoreDisplay.innerHTML = `<span style="color: cyan;">👤 ${playerScore}</span> : <span style="color: magenta;">🤖 ${aiScore}</span>`;
}

function endGame(playerWon) {
    gameState = 'gameover';

    // Increment difficulty
    gamesPlayed++;
    localStorage.setItem('airHockeyGamesPlayed', gamesPlayed.toString());
    maxSpeed = 0.8 + Math.min(gamesPlayed, 15) * 0.04;
    aiSpeed = 0.05 + Math.min(gamesPlayed, 15) * 0.01;

    winScreen.classList.remove('hidden');
    if (playerWon) {
        winnerText.textContent = "YOU WON!";
        winnerText.style.color = "cyan";
    } else {
        winnerText.textContent = "AI WINS!";
        winnerText.style.color = "magenta";
    }
}

// --- Game Control ---
function loadAdsterraBanner() {
    // Desktop only check (using User Agent and Screen Width for safety)
    const osKey = getOSKey();
    if (osKey === "android" || osKey === "ios" || window.innerWidth < 1024) {
        return;
    }

    const container = document.getElementById("adsterra-banner");
    if (!container) return;

    setTimeout(() => {
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



    }, 100);
}

// UI Buttons
startBtn.onclick = () => {
    initAudio(); // MUST be triggered on user action
    startScreen.classList.add('hidden');
    resetPositions();
    playerScore = 0;
    aiScore = 0;
    updateScoreUI();
    gameState = 'playing';

    if (!window.DEV_MODE) {
        loadAdsterraBanner();
    }

    gameStartTime = Date.now();   // ⏱ start timer
    durationSent = false;
    gameStartedFlag = true; // mark started
};

restartBtn.onclick = () => {
    initAudio();
    winScreen.classList.add('hidden');
    resetPositions();
    playerScore = 0;
    aiScore = 0;
    updateScoreUI();
    gameState = 'playing';
};

// Main Loop
function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / (window.innerHeight - 110);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight - 110);
});
