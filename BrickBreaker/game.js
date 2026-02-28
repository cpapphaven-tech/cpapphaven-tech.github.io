// ===== BRICK BREAKER 3D — Three.js r128 Global Build =====
// No ES module imports — uses THREE global loaded via script tags.
// Works on file:// protocol and any server.

(function () {
    'use strict';

    // ===== WORLD CONSTANTS =====
    const GW = 12;          // game world width (units)
    const GH = 20;          // game world height (units)

    const BRICK_ROWS = 6;
    const BRICK_H = 0.55;
    const BRICK_D = 0.5;

    // const ROW_COLORS = [0xff2244, 0xff6600, 0xffcc00, 0xaaee00, 0x00dd88, 0x00aaff];
    // const ROW_EMISSIVE = [0x881122, 0x884400, 0x886600, 0x557700, 0x006644, 0x005588];

    const ROW_COLORS = [
    0x7a0018, // dark red
    0x8c2f00, // burnt orange
    0x9a8400, // mustard
    0x006644, // dark green
    0x005577, // deep cyan
    0x3d0077  // dark purple
];

const ROW_EMISSIVE = [
    0x330008,
    0x402000,
    0x444000,
    0x003322,
    0x002233,
    0x220044
];

    const PADDLE_W_BASE = 2.8;
    const PADDLE_H = 0.22;
    const PADDLE_D = 0.6;
    const PADDLE_Y = 1.0;

    const BALL_R = 0.22;

    const BEST_KEY = 'brickBreaker3D_bestScore';

    // ===== STATE =====
    let state = 'playing';
    let score = 0;
    let lives = 3;
    let level = 1;
    let launched = false;
    let levelTransition = false;
    let bestScore = parseInt(localStorage.getItem(BEST_KEY)) || 0;

    // Physics (game units)
    let paddle = { x: GW / 2, w: PADDLE_W_BASE };
    let ball = { x: GW / 2, y: PADDLE_Y + PADDLE_H / 2 + BALL_R + 0.05, vx: 0, vy: 0, r: BALL_R };
    let mouseGameX = GW / 2;
    let brickData = [];
    let brickMeshes = [];
    let particles = [];
    let shakeTime = 0;

    // THREE objects
    let scene, camera, renderer, composer;
    let bloomPass;
    let paddleMesh, ballMesh, ballLight, starField;

    const cameraBasePos = new THREE.Vector3(GW / 2, GH / 2 - 1.5, 22);

    // ===== DOM =====
    const gameUI = document.getElementById('game-ui');
    const canvas = document.getElementById('game-canvas');
    const mainMenuEl = document.getElementById('main-menu');
    const gameOverEl = document.getElementById('game-over');
    const levelBanner = document.getElementById('level-banner');
    const levelBannerT = document.getElementById('level-banner-text');
    const scoreEl = document.getElementById('score-display');
    const levelNumEl = document.getElementById('level-num');
    const resultTitle = document.getElementById('result-title');
    const resultScore = document.getElementById('result-score');
    const resultBest = document.getElementById('result-best');
    const bestDispEl = document.getElementById('best-score-display');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const bonusBtn = document.getElementById('bonus-btn');
    const tapOverlay = document.getElementById('tap-overlay');

    let gameStartTime = null;
let durationSent = false;
let gameStartedFlag = false;

// --- Supabase Config ---
const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;

// --- Session Tracking ---
let sessionId = null;
let sessionRowId = null;


// Start session on load
async function initSupabase() {
    if (!window.supabase) {
        setTimeout(initSupabase, 500);
        return;
    }

    if (!supabaseClient) {
        const { createClient } = window.supabase;
        supabaseClient = createClient(supabaseUrl, supabaseKey);
        console.log("✅ Supabase ready");
    }
   

     await startGameSession();
     await markSessionStarted();
}




function generateSessionId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).substr(2, 8)
    );
}

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
        window.trackGameEvent(`game_duration_brickbreaker_${seconds}_${reason}_${getBrowser()}`, {
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

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {


        sendDurationOnExit("background_brickbreaker");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_brickbreaker");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        const placementId = getPlacementId();
        window.trackGameEvent(`exit_before_game_brickbreaker_${osKey}`, {
            os: getOS(),
            placement_id: placementId
        });
        // Update session as bounced
        updateGameSession({
            bounced: true,
            placement_id: placementId,
            end_reason: "exit_before_game"
        });
    }
});

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

// --- Supabase Session Tracking Functions ---
async function startGameSession() {
    if (!supabaseClient) return;
    sessionId = generateSessionId();
    const placementId = getPlacementId();
    const os = getOS();
    const browser = getBrowser();
    const userAgent = navigator.userAgent;
    const gameSlug = "brickbreaker";
    const country = await getCountry();
    // Country detection can be added if needed
    try {
        await supabaseClient
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
            ]);
    } catch (e) {}
}

async function markSessionStarted() {
    if (!supabaseClient || !sessionId) return;
    try {
        await supabaseClient
            .from('game_sessions')
            .update({ started_game: true })
            .eq('session_id', sessionId);
    } catch (e) {}
}

async function updateGameSession(fields) {
    if (!supabaseClient || !sessionId) return;
    try {
        await supabaseClient
            .from('game_sessions')
            .update(fields)
            .eq('session_id', sessionId);
    } catch (e) {}
}

    // ========== AUDIO ==========
    let audioCtx;
    function getAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }
    function playTone(freq, type, gain, dur, delay) {
        delay = delay || 0;
        const ctx = getAudio();
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, ctx.currentTime + delay + dur);
        env.gain.setValueAtTime(0.001, ctx.currentTime + delay);
        env.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.connect(env);
        env.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur + 0.05);
    }
    function playNoise(gain, dur, filterFreq) {
        const ctx = getAudio();
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const flt = ctx.createBiquadFilter();
        flt.type = 'bandpass';
        flt.frequency.value = filterFreq || 2000;
        flt.Q.value = 0.8;
        const env = ctx.createGain();
        env.gain.setValueAtTime(gain, ctx.currentTime);
        env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        src.connect(flt); flt.connect(env); env.connect(ctx.destination);
        src.start();
    }
    const sfx = {
        paddleBounce() { playTone(280, 'sine', 0.25, 0.08); playTone(420, 'sine', 0.12, 0.05, 0.02); },
        wallBounce() { playTone(340, 'square', 0.06, 0.05); },
        brickHit() { playNoise(0.15, 0.06, 2500); playTone(500, 'square', 0.06, 0.04); },
        brickBreak() { playNoise(0.28, 0.12, 1200); playTone(180, 'sawtooth', 0.12, 0.1); },
        lifeLost() { [440, 320, 200].forEach((f, i) => playTone(f, 'sine', 0.28, 0.2, i * 0.22)); },
        levelClear() { [523, 659, 784, 1047].forEach((f, i) => playTone(f, 'sine', 0.22, 0.18, i * 0.13)); },
        gameOver() { [440, 370, 300, 220].forEach((f, i) => playTone(f, 'sawtooth', 0.18, 0.25, i * 0.2)); },
        launch() { playTone(600, 'sine', 0.18, 0.1); },
    };

    // ========== THREE.JS SETUP ==========
    function initScene() {
        const W = gameUI.clientWidth || 440;
        const H = gameUI.clientHeight || 680;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020208);
        scene.fog = new THREE.FogExp2(0x020208, 0.025);

        // Camera
        camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
        camera.position.copy(cameraBasePos);
        camera.lookAt(GW / 2, GH / 2 + 0.5, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;
        renderer.outputEncoding = THREE.sRGBEncoding;

        // Post-processing — HDR Bloom (tuned to not wash out colors)
        composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));
        bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(W, H),
            0.9,   // strength (was 1.8 — too intense, washed out white)
            0.4,   // radius
            0.72   // threshold (higher = only very bright surfaces bloom)
        );
        composer.addPass(bloomPass);

        // Lights
        scene.add(new THREE.AmbientLight(0x111133, 2));

        const topLight = new THREE.DirectionalLight(0x8866ff, 4);
        topLight.position.set(GW / 2, GH + 5, 8);
        scene.add(topLight);

        const fillLight = new THREE.DirectionalLight(0xff3399, 2);
        fillLight.position.set(-5, GH / 2, 10);
        scene.add(fillLight);

        // Ball follow light — softer to not overexpose bricks
        ballLight = new THREE.PointLight(0xffffff, 3, 10);
        scene.add(ballLight);

        buildStarField();
        buildSceneDecor();
        buildPaddleMesh();
        buildBallMesh();
    }

    function buildStarField() {
        const count = 400;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = Math.random() * GW;
            pos[i * 3 + 1] = Math.random() * GH;
            pos[i * 3 + 2] = -6 - Math.random() * 8;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.55 });
        starField = new THREE.Points(geo, mat);
        scene.add(starField);
    }

    function buildSceneDecor() {
        // Wall edge lines
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x4422aa });
        [
            [[0, -2, 0.1], [0, GH, 0.1]],
            [[GW, -2, 0.1], [GW, GH, 0.1]],
            [[0, GH, 0.1], [GW, GH, 0.1]],
        ].forEach(([a, b]) => {
            const pts = [new THREE.Vector3(...a), new THREE.Vector3(...b)];
            scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), edgeMat));
        });

        // Glow floor strip
        // const floorGeo = new THREE.PlaneGeometry(GW, 1.2);
        // const floorMat = new THREE.MeshBasicMaterial({ color: 0x6600ff, transparent: true, opacity: 0.1 });
        // const floor = new THREE.Mesh(floorGeo, floorMat);
        // floor.position.set(GW / 2, 0.2, -0.5);
       // scene.add(floor);
    }

    function buildPaddleMesh() {
        if (paddleMesh) scene.remove(paddleMesh);
        const w = getPaddleW();
        // const mat = new THREE.MeshStandardMaterial({
        //     color: 0x88ccff,
        //     emissive: new THREE.Color(0x2244bb),
        //     emissiveIntensity: 1.6,
        //     metalness: 0.88,
        //     roughness: 0.12,
        // });
     const mat = new THREE.MeshPhysicalMaterial({
color: 0x7a00ff,
emissive: 0x330099,
    emissiveIntensity: 1.4,

    metalness: 0.3,
    roughness: 0.2,

    clearcoat: 1,
    clearcoatRoughness: 0.08
});

        paddleMesh = new THREE.Mesh(new THREE.BoxGeometry(w, PADDLE_H, PADDLE_D), mat);
        // paddleMesh = new THREE.CapsuleGeometry(paddle.w / 2, PADDLE_H / 2, 8, 16);
        paddleMesh.position.set(GW / 2, PADDLE_Y, 0);
        scene.add(paddleMesh);
        paddle.w = w;
    }

    function buildBallMesh() {
        if (ballMesh) scene.remove(ballMesh);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 1.5,   // was 3.5 — too bright with bloom
            metalness: 0.3,
            roughness: 0.1,
        });
        ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 24, 24), mat);
        scene.add(ballMesh);
    }

    function getPaddleW() {
        return Math.max(1.5, PADDLE_W_BASE - (level - 1) * 0.04);
    }

    // ========== BRICKS ==========
    function getBrickCols() {
        return Math.min(13, 10 + Math.floor((level - 1) / 5));
    }
    function getBrickHP(row) {
        const base = [3, 3, 2, 2, 1, 1][row] || 1;
        return base + Math.floor((level - 1) / 4);
    }

    function buildBricks() {
        brickMeshes.forEach(m => scene.remove(m));
        brickMeshes = [];
        brickData = [];

        const cols = getBrickCols();
        const bw = (GW - 0.4) / cols - 0.1;
        const startX = (GW - (cols * (bw + 0.1) - 0.1)) / 2;

        for (let r = 0; r < BRICK_ROWS; r++) {
            for (let c = 0; c < cols; c++) {
                const hp = getBrickHP(r);
                const ci = r % ROW_COLORS.length;
                // const mat = new THREE.MeshStandardMaterial({
                //     color: new THREE.Color(ROW_COLORS[ci]),
                //     emissive: new THREE.Color(ROW_EMISSIVE[ci]),
                //     emissiveIntensity: 0.5,   // was 1.2 — caused white-out bloom
                //     metalness: 0.35,
                //     roughness: 0.55,
                // });

//                 const base = new THREE.Color(ROW_COLORS[ci]);
// base.offsetHSL(0, 0, -0.05 * r); 


//                 const mat = new THREE.MeshPhysicalMaterial({
//     color: base,
//     emissive: new THREE.Color(ROW_COLORS[ci]),
//     emissiveIntensity: 0.9,

//     metalness: 0.25,
//     roughness: 0.18,

//     clearcoat: 1,
//     clearcoatRoughness: 0.05,

//     reflectivity: 0.8
// });
const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(ROW_COLORS[ci]),
    emissive: new THREE.Color(ROW_EMISSIVE[ci]),
    emissiveIntensity: 0.6,   // lower glow for dark theme

    metalness: 0.35,
    roughness: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2
});

                const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, BRICK_H, BRICK_D), mat);

                
                const x = startX + c * (bw + 0.1) + bw / 2;
                const y = GH - 4.0 - r * (BRICK_H + 0.1);
                mesh.position.set(x, y, 0);
                mesh.userData.bw = bw;

                // ⭐ ADD EDGE OUTLINE HERE
const edges = new THREE.EdgesGeometry(mesh.geometry);
const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15
    })
);

                scene.add(mesh);
                brickMeshes.push(mesh);
                brickData.push({ row: r, col: c, alive: true, hp, maxHp: hp });
            }
        }
    }

    // ========== PARTICLES ==========
    function spawnParticles(x, y, color) {
        for (let i = 0; i < 14; i++) {
            const sz = 0.05 + Math.random() * 0.1;
            const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
            const m = new THREE.Mesh(new THREE.SphereGeometry(sz, 6, 6), mat);
            m.position.set(x, y, Math.random() * 0.3);
            scene.add(m);
            const ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
            const spd = 0.07 + Math.random() * 0.14;
            particles.push({ mesh: m, mat, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, vz: (Math.random() - 0.5) * 0.06, life: 1 });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= 0.035;
            p.mesh.position.x += p.vx;
            p.mesh.position.y += p.vy;
            p.mesh.position.z += p.vz;
            p.vy -= 0.004;
            p.mat.opacity = Math.max(0, p.life);
            if (p.life <= 0) {
                scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                particles.splice(i, 1);
            }
        }
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



    }, 100);
}

    // ========== GAME LOGIC ==========
    function startGame() {

        tapOverlay.classList.remove('hidden');

        score = 0; lives = 3; level = 1;
        state = 'playing';
        launched = false;
        levelTransition = false;

        mainMenuEl.classList.add('hidden');
        gameOverEl.classList.add('hidden');

         if (!window.DEV_MODE) {
        loadAdsterraBanner();
    }

        buildPaddleMesh();
        buildBricks();
        resetBallOnPaddle();
        updateHUD();
        updateHearts();
        buildPromoScroller();
        if (!animRunning) animate();
    }

    function resetBallOnPaddle() {
        launched = false;
        ball.x = GW / 2;
        ball.y = PADDLE_Y + PADDLE_H / 2 + ball.r + 0.05;
        ball.vx = 0;
        ball.vy = 0;
    }

    function getBallSpeed() {
        // units per SECOND (world is 20 units tall; ball crosses in ~2s at level 1)
        return Math.min(14, 8 + (level - 1) * 0.25);
    }

    function launchBall() {
        if (launched || state !== 'playing') return;

        tapOverlay.classList.add('hidden');

        getAudio();
        launched = true;
        sfx.launch();
        const spd = getBallSpeed();
        // +Math.PI/2 = 90 degrees = straight UP in Three.js Y-axis
        // Without this fix: sin(-PI/2) = -1 → ball launches DOWNWARD and falls off screen instantly
        const ang = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
        ball.vx = Math.cos(ang) * spd;
        ball.vy = Math.sin(ang) * spd;  // positive vy = upward
    }

    function update(dt) {
        if (state !== 'playing') return;

        // Paddle smoothly follows mouse
        const clampedX = Math.max(paddle.w / 2, Math.min(GW - paddle.w / 2, mouseGameX));
        paddle.x += (clampedX - paddle.x) * 0.22;
        paddleMesh.position.x = paddle.x;

        if (!launched) {
            ball.x = paddle.x;
            ball.y = PADDLE_Y + PADDLE_H / 2 + ball.r + 0.05;
            syncBallMesh();
            return;
        }

        // Substep physics — speed is units/SECOND, multiply by dt for correct scaling
        const steps = 3;
        const svx = ball.vx / steps * dt;   // was * dt * 60 which made ball 60x too fast!
        const svy = ball.vy / steps * dt;
        for (let s = 0; s < steps; s++) {
            ball.x += svx;
            ball.y += svy;
            wallCollide();
            paddleCollide();
            brickCollide();
        }

        syncBallMesh();
        updateParticles();

        if (ball.y < -1.2) loseLife();
    }

    function syncBallMesh() {
        ballMesh.position.set(ball.x, ball.y, 0);
        ballLight.position.set(ball.x, ball.y, 3);
    }

    function wallCollide() {
        if (ball.x - ball.r <= 0) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); sfx.wallBounce(); }
        if (ball.x + ball.r >= GW) { ball.x = GW - ball.r; ball.vx = -Math.abs(ball.vx); sfx.wallBounce(); }
        if (ball.y + ball.r >= GH) { ball.y = GH - ball.r; ball.vy = -Math.abs(ball.vy); sfx.wallBounce(); }
    }

    function paddleCollide() {
        const left = paddle.x - paddle.w / 2;
        const right = paddle.x + paddle.w / 2;
        const top = PADDLE_Y + PADDLE_H / 2;

        if (ball.vy < 0 &&
            ball.y - ball.r <= top + 0.02 &&
            ball.y + ball.r >= top - 0.1 &&
            ball.x >= left - ball.r &&
            ball.x <= right + ball.r) {

            const rel = (ball.x - paddle.x) / (paddle.w / 2 + ball.r);
            const ang = rel * (Math.PI * 0.38);
            const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = Math.sin(ang) * spd;
            ball.vy = Math.abs(Math.cos(ang) * spd);
            ball.y = top + ball.r + 0.02;
            sfx.paddleBounce();
            triggerShake(0.04);
        }
    }

    function brickCollide() {
        for (let i = 0; i < brickData.length; i++) {
            const b = brickData[i];
            if (!b.alive) continue;

            const mesh = brickMeshes[i];
            const bx = mesh.position.x;
            const by = mesh.position.y;
            const bw = mesh.userData.bw;

            const bL = bx - bw / 2, bR = bx + bw / 2;
            const bT = by + BRICK_H / 2, bB = by - BRICK_H / 2;

            if (ball.x + ball.r > bL && ball.x - ball.r < bR &&
                ball.y + ball.r > bB && ball.y - ball.r < bT) {

                b.hp--;
                if (b.hp <= 0) {
                    b.alive = false;
                    scene.remove(mesh);
                    spawnParticles(bx, by, ROW_COLORS[b.row % ROW_COLORS.length]);
                    sfx.brickBreak();
                    triggerShake(0.08);
                    addScore(10 * level + (b.row + 1) * 5);
                } else {
                    const frac = b.hp / b.maxHp;
                    mesh.material.emissiveIntensity = 0.25 + frac * 1.0;
                    sfx.brickHit();
                    triggerShake(0.03);
                }

                // Deflect
                const ol = ball.x + ball.r - bL;
                const or2 = bR - (ball.x - ball.r);
                const ot = bT - (ball.y - ball.r);
                const ob = ball.y + ball.r - bB;
                const mn = Math.min(ol, or2, ot, ob);
                if (mn === ot || mn === ob) ball.vy = -ball.vy;
                else ball.vx = -ball.vx;
                break;
            }
        }

        // Level clear?
        if (!levelTransition && brickData.length > 0 && brickData.every(function (b) { return !b.alive; })) {
            nextLevel();
        }
    }

    function nextLevel() {
        if (levelTransition) return;
        levelTransition = true;
        level++;
        sfx.levelClear();
        showLevelBanner('LEVEL ' + level);
        updateHUD();
        buildPaddleMesh();
        buildBricks();
        resetBallOnPaddle();
        setTimeout(function () { levelTransition = false; }, 600);
    }

    function showLevelBanner(text) {
        levelBannerT.textContent = text;
        levelBanner.classList.remove('hidden', 'showing');
        void levelBanner.offsetWidth;
        levelBanner.classList.add('showing');
        setTimeout(function () { levelBanner.classList.add('hidden'); }, 1900);
    }

    function loseLife() {
        sfx.lifeLost();
        lives--;
        triggerShake(0.2);
        updateHearts();
        if (lives <= 0) { endGame(); return; }
        resetBallOnPaddle();
    }

    function addScore(pts) {
        score += pts;
        scoreEl.textContent = score;
        scoreEl.classList.remove('score-flash');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('score-flash');
    }

    function endGame() {
        state = 'over';
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem(BEST_KEY, bestScore);
        }
        sfx.gameOver();
        resultTitle.textContent = 'GAME OVER';
        resultScore.textContent = score;
        resultBest.textContent = 'BEST: ' + bestScore;
        gameOverEl.classList.remove('hidden');
    }

    // ========== CAMERA SHAKE ==========
    function triggerShake(intensity) { shakeTime = intensity; }
    function updateCameraShake() {
        if (shakeTime > 0) {
            camera.position.x = cameraBasePos.x + (Math.random() - 0.5) * shakeTime;
            camera.position.y = cameraBasePos.y + (Math.random() - 0.5) * shakeTime;
            shakeTime -= 0.014;
            if (shakeTime <= 0) { shakeTime = 0; camera.position.copy(cameraBasePos); }
        }
    }

    // ========== HUD ==========
    function updateHUD() {
        scoreEl.textContent = score;
        levelNumEl.textContent = level;
        bestDispEl.textContent = 'BEST: ' + bestScore;
    }
    function updateHearts() {
        ['h1', 'h2', 'h3'].forEach(function (id, i) {
            const el = document.getElementById(id);
            if (!el) return;
            if (i >= lives) { el.classList.add('lost'); }
            else { el.classList.remove('lost'); el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 350); }
        });
    }

    // ========== STARS ==========
    function animateStars() {
        if (!starField) return;
        const pos = starField.geometry.attributes.position.array;
        for (let i = 1; i < pos.length; i += 3) {
            pos[i] -= 0.007;
            if (pos[i] < 0) pos[i] = GH;
        }
        starField.geometry.attributes.position.needsUpdate = true;
    }

    // ========== RENDER LOOP ==========
    let lastTime = 0, animRunning = false;
    function animate(time) {
        animRunning = true;
        requestAnimationFrame(animate);
        const dt = Math.min(((time || 0) - lastTime) / 1000, 0.05);
        lastTime = time || 0;

        update(dt);
        animateStars();
        updateCameraShake();
        composer.render();
    }

    // ========== INPUT ==========
    function screenToGameX(screenX) {
        const rect = canvas.getBoundingClientRect();
        return (screenX - rect.left) / rect.width * GW;
    }
    canvas.addEventListener('mousemove', function (e) { mouseGameX = screenToGameX(e.clientX); });
    canvas.addEventListener('touchmove', function (e) { e.preventDefault(); mouseGameX = screenToGameX(e.touches[0].clientX); }, { passive: false });
    canvas.addEventListener('pointerdown', function () { getAudio(); launchBall(); });
    canvas.addEventListener('touchstart', function (e) {
        e.preventDefault(); getAudio();
        mouseGameX = screenToGameX(e.touches[0].clientX);
        launchBall();
    }, { passive: false });

    // ========== RESIZE ==========
    function onResize() {
        const W = gameUI.clientWidth || 440;
        const H = gameUI.clientHeight || 680;
        if (!camera || !renderer) return;
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
        composer.setSize(W, H);
        if (bloomPass) bloomPass.resolution.set(W, H);
    }
    new ResizeObserver(onResize).observe(gameUI);
    window.addEventListener('resize', onResize);

    // ========== BUTTONS ==========
    startBtn.addEventListener('click', function () { startGame(); });
    restartBtn.addEventListener('click', function () { gameOverEl.classList.add('hidden'); startGame(); });
    bonusBtn.addEventListener('click', function () {
        window.open('https://www.effectivegatecpm.com/gp6cvyi4?key=a90897ce62f2dd15a5aab13ad90b2e66', '_blank');
        lives = Math.min(lives + 1, 3);
        updateHearts();
        state = 'playing';
        gameOverEl.classList.add('hidden');
        resetBallOnPaddle();
        if (!animRunning) animate();
    });

    // ========== CROSS PROMO ==========
    function buildPromoScroller() {
        const el = document.getElementById('game-over-scroller');
        if (!el) return;
        const games = [
            { name: 'Stack 3D', emoji: '🧱', href: '../Stack3D/index.html' },
            { name: 'Helix Bounce', emoji: '🌀', href: '../HelixBounce/index.html' },
            { name: 'Football 3D', emoji: '⚽', href: '../Football3D/index.html' },
            { name: 'Bubble Shooter', emoji: '🫧', href: '../BubbleShooter/index.html' },
            { name: 'Bottle Shoot', emoji: '🍾', href: '../BottleShoot3D/game.html' },
            { name: 'Color Match', emoji: '🎨', href: '../ColorMatch/index.html' },
            { name: 'Ludo', emoji: '🎲', href: '../Ludo/index.html' },
            { name: 'Air Hockey', emoji: '🏒', href: '../AirHockey3D/index.html' },
        ];
        el.innerHTML = games.map(g =>
            '<a class="promo-card" href="' + g.href + '"><span class="promo-emoji">' + g.emoji + '</span><span class="promo-name">' + g.name + '</span></a>'
        ).join('');
    }

    // ========== INIT ==========
    window.addEventListener('load', function () {
        initScene();
       // updateHUD();
        // Animate the background while on main menu
        //animate();

         if (!supabaseClient) {
         initSupabase();
    }

        startGame();   // 👈 auto start
    });

})(); // end IIFE
