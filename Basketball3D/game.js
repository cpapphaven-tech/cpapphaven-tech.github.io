/**
 * Basketball 3D - Three.js + Cannon.js Implementation
 */

// --- Constants ---
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 800;
const BALL_RADIUS = 0.45; // Slightly larger
const COURT_WIDTH = 12;
const COURT_DEPTH = 40;
const HOOP_HEIGHT = 12.0; // Higher as requested
const RING_RADIUS = 1.0;
const RING_Z = 0;

// --- State Variables ---
let scene, camera, renderer, world;
let ballMesh, ballBody;
let hoopMesh, backboardMesh, backboardBody;
let pitchMesh;
let score = 0;
let bestScore = localStorage.getItem('basketball_best_score') || 0;
let isGameOver = false;
let isGoalScored = false;
let gameStarted = false;
let canRevive = true;
let hoopSpeed = 0;
let hoopDirection = 1;
let isHoldingBall = false;
let hasThrown = false;
let pointerVelocity = { x: 0, y: 0 };
let lastPointerPos = { x: 0, y: 0 };
let lastPointerTime = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const dragPlane = new THREE.Plane();
const planeNormal = new THREE.Vector3(0, 0, 1); // Plane facing player

// --- DOM Elements ---
const scoreEl = document.getElementById('score');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const bonusBtn = document.getElementById('bonus-btn');
const submitScoreBtn = document.getElementById('submit-score-btn');
const nameInput = document.getElementById('player-name-gameover');
const joinTgBtn = document.getElementById('join-tg-btn');

// --- Supabase Config ---
const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;

function getOSKey() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    if (/Win/i.test(ua)) return "windows";
    if (/Mac/i.test(ua)) return "mac";
    return "unknown";
}

// --- Initialization ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    camera = new THREE.PerspectiveCamera(60, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 1000);
    camera.position.set(0, 4, 22); // Lower and further back for a high-up view
    camera.lookAt(0, 8, -5); // Looking up at the high basket

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true,
        preserveDrawingBuffer: true
    });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    world = new CANNON.World();
    world.gravity.set(0, -4.5, 0); // Slow-motion gravity

    setupCourt();
    setupHoop();
    setupBall();

    if (window.supabase) {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        loadLeaderboard();
    }

    if (window.renderTopLeftScroller) {
        renderTopLeftScroller();
    }

    // Events
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    submitScoreBtn.addEventListener('click', submitScore);
    if (bonusBtn) {
        bonusBtn.addEventListener('click', () => {
            window.open("https://www.effectivegatecpm.com/gp6cvyi4?key=a90897ce62f2dd15a5aab13ad90b2e66", "_blank");
            if (window.trackGameEvent) {
                window.trackGameEvent(`smartlink_ad_click_${getOSKey()}`, { ad_type: "reward", game: "basketball_3d" });
            }
            revivePlayer();
        });
    }

    if (joinTgBtn) {
        joinTgBtn.addEventListener("click", () => {
            window.open("https://t.me/playmixgamesstack3dtower", "_blank");
        });
    }

    const canvas = document.getElementById('game-canvas');

    // Unified Pointer Events
    canvas.addEventListener('pointerdown', (e) => {
        if (!gameStarted || isGameOver || isGoalScored) return;

        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(ballMesh);

        if (intersects.length > 0) {
            canvas.setPointerCapture(e.pointerId);
            isHoldingBall = true;
            ballBody.mass = 0;
            ballBody.updateMassProperties();
            ballBody.velocity.set(0, 0, 0);
            ballBody.angularVelocity.set(0, 0, 0);

            // Setup drag plane
            dragPlane.setFromNormalAndCoplanarPoint(
                camera.getWorldDirection(new THREE.Vector3()).negate(),
                ballBody.position
            );

            lastPointerPos.x = e.clientX;
            lastPointerPos.y = e.clientY;
            lastPointerTime = Date.now();
            pointerVelocity.x = 0;
            pointerVelocity.y = 0;
        }
    });

    canvas.addEventListener('pointermove', (e) => {
        if (!isHoldingBall) return;

        const now = Date.now();
        const dt = now - lastPointerTime;
        if (dt > 0) {
            const vx = (e.clientX - lastPointerPos.x) / dt;
            const vy = (e.clientY - lastPointerPos.y) / dt;
            pointerVelocity.x = pointerVelocity.x * 0.4 + vx * 0.6;
            pointerVelocity.y = pointerVelocity.y * 0.4 + vy * 0.6;
        }
        lastPointerPos.x = e.clientX;
        lastPointerPos.y = e.clientY;
        lastPointerTime = now;

        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const target = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, target)) {
            const minZ = 8; // Prevent dragging to hoop
            const maxZ = 20;
            const targetZ = Math.max(minZ, Math.min(maxZ, target.z));
            const targetY = Math.max(1, Math.min(4, target.y)); // Drag height limit
            const targetX = Math.max(-8, Math.min(8, target.x));

            ballBody.position.set(targetX, targetY, targetZ);
            ballBody.velocity.set(0, 0, 0);
            ballBody.angularVelocity.set(0, 0, 0);
        }
    });

    canvas.addEventListener('pointerup', (e) => {
        if (!isHoldingBall) return;
        isHoldingBall = false;
        canvas.releasePointerCapture(e.pointerId);

        ballBody.mass = 1;
        ballBody.updateMassProperties();
        handleThrow();
    });

    animate();

    // Auto-start game as requested
    setTimeout(startGame, 500);

    loadAdsterraBanner();
}

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



    }, 2000);
}

function setupCourt() {
    const groundGeo = new THREE.PlaneGeometry(COURT_WIDTH, COURT_DEPTH);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0xc62828 });
    pitchMesh = new THREE.Mesh(groundGeo, groundMat);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.receiveShadow = true;
    scene.add(pitchMesh);

    const groundBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane(),
        material: new CANNON.Material({ friction: 0.5, restitution: 0.7 })
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // Court Lines
    const lineGeo = new THREE.PlaneGeometry(COURT_WIDTH, 0.1);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
    for (let i = -COURT_DEPTH / 2; i <= COURT_DEPTH / 2; i += 5) {
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.01, i);
        scene.add(line);
    }
}

function setupHoop() {
    const hoopGroup = new THREE.Group();

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, HOOP_HEIGHT);
    const poleMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, HOOP_HEIGHT / 2, RING_Z - 1.0);
    hoopGroup.add(pole);

    // Backboard - Changed to dark grey to avoid distraction
    const bbGeo = new THREE.BoxGeometry(4, 3, 0.1);
    const bbMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    backboardMesh = new THREE.Mesh(bbGeo, bbMat);
    backboardMesh.position.set(0, HOOP_HEIGHT, RING_Z - 0.75);
    hoopGroup.add(backboardMesh);

    // Ring
    const ringGeo = new THREE.TorusGeometry(RING_RADIUS, 0.05, 16, 100);
    const ringMat = new THREE.MeshPhongMaterial({ color: 0xff3d00 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, HOOP_HEIGHT - 0.5, RING_Z);
    hoopGroup.add(ring);

    // Visual Net
    const netGeo = new THREE.CylinderGeometry(RING_RADIUS, RING_RADIUS * 0.7, 1.2, 16, 1, true);
    const netMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        wireframe: true
    });
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.set(0, HOOP_HEIGHT - 1.1, RING_Z);
    hoopGroup.add(net);

    hoopMesh = hoopGroup;
    scene.add(hoopMesh);

    // Backboard Physics
    const bbShape = new CANNON.Box(new CANNON.Vec3(2, 1.5, 0.05));
    backboardBody = new CANNON.Body({
        mass: 0,
        shape: bbShape,
        material: new CANNON.Material({ restitution: 0.5 })
    });
    backboardBody.position.set(0, HOOP_HEIGHT, RING_Z - 0.75);
    world.addBody(backboardBody);
}

function setupBall() {
    // Create realistic basketball texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base color
    ctx.fillStyle = '#ff6d00';
    ctx.fillRect(0, 0, 512, 512);

    // Pebbled texture effect
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < 2000; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // Black linings
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(256, 256, 256, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 256);
    ctx.lineTo(512, 256);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 256, 150, 0, Math.PI * 2);
    ctx.stroke();

    // Curved side lines for extra realism
    ctx.beginPath();
    ctx.arc(0, 256, 256, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(512, 256, 256, Math.PI * 0.75, Math.PI * 1.25);
    ctx.stroke();

    const ballTexture = new THREE.CanvasTexture(canvas);
    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballMat = new THREE.MeshPhongMaterial({ map: ballTexture, shininess: 10 });
    ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    const ballShape = new CANNON.Sphere(BALL_RADIUS);
    ballBody = new CANNON.Body({
        mass: 1,
        shape: ballShape,
        material: new CANNON.Material({ friction: 0.1, restitution: 0.8 })
    });
    ballBody.position.set(0, 1, 10); // Moved ball further away (Z decreased from 14 to 10)
    world.addBody(ballBody);
}

function handleThrow() {
    // Basic threshold to ensure a deliberate swipe occurred
    if (Math.abs(pointerVelocity.y) < 0.1) {
        ballBody.velocity.set(0, 0, 0);
        return;
    }

    // --- PROXIMITY CHECK ---
    // Calculate distance to hoop at the moment of release
    const hoopX = hoopMesh ? hoopMesh.position.x : 0;
    const distToHoop = Math.sqrt(
        Math.pow(ballBody.position.x - hoopX, 2) +
        Math.pow(ballBody.position.z - RING_Z, 2)
    );

    // If user moves cursor near to basket (distance < 9.0), make it 100% guaranteed
    const isInSpecialZone = distToHoop < 9.0;
    const usePerfectAim = isInSpecialZone ? true : (Math.random() < 0.9);

    if (usePerfectAim) {
        // --- PERFECT AIM (AUTO-WIN) ---
        const targetX = hoopMesh ? hoopMesh.position.x : 0;
        const targetY = HOOP_HEIGHT + 0.5;
        const targetZ = RING_Z;
        const startPos = ballBody.position;
        const t = 2.4;
        const g = Math.abs(world.gravity.y);

        const vX = (targetX - startPos.x) / t;
        const vZ = (targetZ - startPos.z) / t;
        const vY = ((targetY - startPos.y) + 0.5 * g * Math.pow(t, 2)) / t;

        ballBody.velocity.set(vX, vY, vZ);
    } else {
        // --- REAL PHYSICS (SKILL-BASED) ---
        let swipeY = pointerVelocity.y * 10;
        let swipeX = pointerVelocity.x * 8;

        // Capped for "Slow Motion" consistency
        swipeY = Math.min(Math.max(swipeY, -10), 10);
        swipeX = Math.min(Math.max(swipeX, -5), 5);

        // Higher arc: UP more than FORWARD
        const vY = Math.min(Math.abs(swipeY) * 2.8, 26);
        const vZ = -Math.abs(swipeY) * 1.4;
        const vX = swipeX * 1.0;

        ballBody.velocity.set(vX, vY, vZ);
    }

    // Aesthetic spin
    ballBody.angularVelocity.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
    );

    hasThrown = true;

    const guide = document.getElementById('swipe-guide');
    if (guide) guide.classList.add('hidden');

    // Reset velocity tracking for next time
    pointerVelocity.x = 0;
    pointerVelocity.y = 0;
}

function resetBall() {
    // Randomize start pos slightly
    const rx = (Math.random() - 0.5) * 4;
    ballBody.position.set(rx, 1, 10);
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);
    isGoalScored = false;
    hasThrown = false;
}

function checkScored() {
    const pos = ballBody.position;
    const ringY = HOOP_HEIGHT - 0.5;
    const hoopX = hoopMesh.position.x; // if hoop moves

    // Basic scoring: ball center passes through ring Y with velocity down
    if (!isGoalScored && ballBody.velocity.y < 0 &&
        pos.y > ringY - 0.5 && pos.y < ringY + 0.5 &&
        Math.abs(pos.z - RING_Z) < 0.8 &&
        Math.abs(pos.x - hoopX) < RING_RADIUS
    ) {
        score++;
        scoreEl.innerText = score;
        isGoalScored = true;
        showFeedback("BASKET!");

        // Increase difficulty

        setTimeout(resetBall, 1500);
    }

    // Check miss / ground / out of bounds
    // Game over immediately if missed on the first try after throwing
    if (hasThrown && !isGoalScored) {
        if (pos.y < 0.5 || pos.z < RING_Z - 3 || Math.abs(pos.x) > COURT_WIDTH / 2) {
            gameOver();
        }
    }
}

function showFeedback(text) {
    const feedback = document.getElementById('goal-feedback');
    if (feedback) {
        feedback.innerText = text;
        feedback.classList.remove('hidden');
        feedback.classList.add('goal-pop');
        setTimeout(() => {
            feedback.classList.remove('goal-pop');
            feedback.classList.add('hidden');
        }, 1000);
    }
}

function gameOver() {
    if (isGameOver) return;
    isGameOver = true;
    gameStarted = false;
    isHoldingBall = false; // Fix: ensure we don't stay in "holding" mode

    // Ensure mass is reset if we were holding
    ballBody.mass = 1;
    ballBody.updateMassProperties();

    finalScoreEl.innerText = score;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('basketball_best_score', bestScore);
    }
    bestScoreEl.innerText = bestScore;

    if (bonusBtn) {
        if (canRevive && score > 0) bonusBtn.classList.remove('hidden');
        else bonusBtn.classList.add('hidden');
    }

    // Render Game Scroller
    setTimeout(() => {
    if (window.renderGameScroller) {
        renderGameScroller('game-over-scroller');
    }
    }, 150);


    gameOverMenu.classList.remove('hidden');

     if (submitScoreBtn) {
        submitScoreBtn.textContent = "Submit & Save Score";
        submitScoreBtn.disabled = false;
    }
}

function revivePlayer() {
    isGameOver = false;
    gameStarted = true;
    canRevive = false;
    gameOverMenu.classList.add('hidden');
    resetBall();
}

function startGame() {
    isGameOver = false; // Fix: Reset game over state
    gameStarted = true;
    canRevive = true;
    score = 0;
    scoreEl.innerText = score;
    hoopSpeed = 0;
    hoopMesh.position.x = 0;
    backboardBody.position.x = 0;
    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    resetBall();
    const guide = document.getElementById('swipe-guide');
    if (guide) guide.classList.remove('hidden');
}

function restartGame() {
    startGame();
}

function showMenu() {
    mainMenu.classList.remove('hidden');
}

function animate() {
    requestAnimationFrame(animate);
    world.step(1 / 60);

    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion);

    // Aim Assist: If ball is near hoop and moving down, strongly pull it towards center
    if (hasThrown && !isGoalScored && ballBody.velocity.y < 0) {
        const hoopX = hoopMesh ? hoopMesh.position.x : 0;
        const distToHoopX = ballBody.position.x - hoopX;
        const distToHoopZ = ballBody.position.z - RING_Z;
        const distToHoopY = ballBody.position.y - (HOOP_HEIGHT - 0.5);

        // Magnetic Pull: If ball is within scoring vicinity, force it through the hoop
        if (Math.abs(distToHoopX) < 2.0 && Math.abs(distToHoopZ) < 2.0 && distToHoopY > 0 && distToHoopY < 3) {
            // Apply a strong magnetic pull towards the center
            const pullStrength = 0.35; // Increased from 0.1
            ballBody.velocity.x -= distToHoopX * pullStrength;
            ballBody.velocity.z -= distToHoopZ * pullStrength;

            // Give it a little downward nudge to ensure it goes through
            ballBody.velocity.y -= 2.0;
        }
    }

    // Move Hoop if difficulty up
    if (hoopSpeed > 0 && gameStarted) {
        hoopMesh.position.x += hoopDirection * hoopSpeed * 0.016;
        if (Math.abs(hoopMesh.position.x) > COURT_WIDTH / 2 - 2) hoopDirection *= -1;
        backboardBody.position.x = hoopMesh.position.x;
    }

    if (gameStarted) checkScored();

    renderer.render(scene, camera);
}

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

// --- Leaderboard & Supabase Logic ---
async function submitScore() {
    const name = nameInput.value.trim() || "Shooter";
    submitScoreBtn.disabled = true;
    submitScoreBtn.innerText = 'Saving...';

    const country = await getCountry();

    if (supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('basketball3d_scores')
                .insert([{ username: name || "Guest", score: score, country: country || "NA" }]);
            if (error) throw error;
        } catch (e) { console.error(e); }
    }
    submitScoreBtn.innerText = 'Saved!';
    loadLeaderboard();
}

function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode === "Unknown" || countryCode === "NA") return "🌐";
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

async function loadLeaderboard() {
    if (!supabaseClient) return;
    const sideList = document.getElementById("side-lb-list");
    const fullList = document.getElementById("full-lb-list");

    try {
        const { data, error } = await supabaseClient
            .from("basketball3d_scores")
            .select("*")
            .order("score", { ascending: false })
            .limit(20);

        if (error) throw error;

        if (sideList) {
            const isDesktop = window.innerWidth >= 1024;
            const limitVal = isDesktop ? 10 : 5;
            sideList.innerHTML = data.slice(0, limitVal).map((p, i) => `
                <div class="lb-row">
                    <span class="lb-rank">${["🥇", "🥈", "🥉", "4", "5", "6", "7", "8", "9", "10"][i] || (i + 1)}</span>
                    <span class="lb-user">
                        ${p.username} (${p.country})
                    </span>
                    
                    <span class="lb-score">${p.score}</span>
                </div>
            `).join('');
        }

        if (fullList) {
            fullList.innerHTML = data.map((p, i) => `
                <div class="lb-row">
                    <span class="lb-rank">${i + 1}</span>
                    <span class="lb-user">
                        ${p.username} (${p.country})
                    </span>
                    <span class="lb-score">${p.score}</span>
                </div>
            `).join('');
        }
    } catch (e) { console.error(e); }
}

window.closeFullLeaderboard = () => document.getElementById("full-leaderboard").classList.add("hidden");
const viewFullLb = document.getElementById("view-full-lb");
if (viewFullLb) {
    viewFullLb.addEventListener("click", () => {
        document.getElementById("full-leaderboard").classList.remove("hidden");
        loadLeaderboard();
    });
}

init();
