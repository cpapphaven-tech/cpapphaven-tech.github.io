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
let startTime = 0;

let gameStartTime = null;
let durationSent = false;
let gameStartedFlag = false;



function createFootballTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#111111';
    const size = 64;
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if ((x + y) % 2 === 0) {
                const cx = x * size + size / 2;
                const cy = y * size + size / 2;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    ctx.lineTo(cx + Math.cos(angle) * (size / 2.2), cy + Math.sin(angle) * (size / 2.2));
                }
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

// --- Supabase Config ---
const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;

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

    // 4. Supabase
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        loadLeaderboard();
    }

    if (window.renderTopLeftScroller) {
        renderTopLeftScroller();
    }

    // 5. Events
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
                const osKey = getOSKey();
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
        startTime = Date.now();
    });

    canvas.addEventListener('touchend', (e) => {
        touchEnd.x = e.changedTouches[0].clientX;
        touchEnd.y = e.changedTouches[0].clientY;
        if (gameStarted && !isGoalScored && !isGameOver) {
            handleKick();
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        touchStart.x = e.clientX;
        touchStart.y = e.clientY;
        startTime = Date.now();
    });

    canvas.addEventListener('mouseup', (e) => {
        touchEnd.x = e.clientX;
        touchEnd.y = e.clientY;
        if (gameStarted && !isGoalScored && !isGameOver) {
            handleKick();
        }
    });

    animate();
    startGame();

    // Load Ads
    if (!window.DEV_MODE) {
        loadAdsterraBanner();
    }
}

function loadAdsterraBanner() {
    const osKey = getOSKey();
    if (osKey === "android" || osKey === "ios" || window.innerWidth < 1024) return;

    const container = document.getElementById("adsterra-banner");
    if (!container) return;

    if (container.dataset.loaded === "true") return;
    container.dataset.loaded = "true";

    setTimeout(() => {
        container.innerHTML = "";
        const optionsScript = document.createElement("script");
        optionsScript.type = "text/javascript";
        optionsScript.text = `
            atOptions = {
                key: "34488dc997487ff336bf5de366c86553",
                format: "iframe",
                height: 600,
                width: 160,
                params: {}
            };
        `;
        const invokeScript = document.createElement("script");
        invokeScript.type = "text/javascript";
        invokeScript.src = "https://www.highperformanceformat.com/34488dc997487ff336bf5de366c86553/invoke.js";

        container.appendChild(optionsScript);
        container.appendChild(invokeScript);
    }, 2000);
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
    // Visual - Football Texture
    const geometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        map: createFootballTexture(),
        shininess: 10
    });
    ballMesh = new THREE.Mesh(geometry, material);
    ballMesh.castShadow = true;
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

function resetBall() {
    ballBody.position.set(0, 0.5, 6); // Closer to net as requested
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);
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
    durationSent = false;


    if (bonusBtn) bonusBtn.classList.add('hidden');

    const guide = document.getElementById('swipe-guide');
    if (guide) guide.classList.remove('hidden');

    resetBall();
}

function restartGame() {
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

     if (window.trackGameEvent) {
        const osKey = getOSKey();
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

function sendDurationOnExit(reason) {
    if (gameStartTime && !durationSent && window.trackGameEvent) {
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);

        window.trackGameEvent(`game_duration_football_${seconds}_${reason}_${getOS()}`, {
            seconds,
            end_reason: reason,
            os: getOS()
        });

        durationSent = true;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        sendDurationOnExit("background_football");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_football");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        window.trackGameEvent(`exit_before_game_football_${osKey}`, {
            os: getOS()
        });
    }
});


// Start
init();

showTutorial();

showPartyWelcome();
