/**
 * 3D Bowling Clash
 * Three.js + Cannon.js Implementation
 */

// ===================================
// AUDIO SYSTEM
// ===================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration, vol = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sounds = {
    roll: () => {
        // Low rumble simulation (continuous until hit)
        playSound(100, 'sawtooth', 0.5, 0.05);
        setTimeout(() => playSound(110, 'sawtooth', 0.5, 0.05), 200);
        setTimeout(() => playSound(105, 'sawtooth', 0.5, 0.05), 400);
    },
    hit: () => playSound(400, 'triangle', 0.1, 0.1),
    strike: () => {
        playSound(523.25, 'sine', 0.1); // C5
        setTimeout(() => playSound(659.25, 'sine', 0.15), 100); // E5
        setTimeout(() => playSound(783.99, 'triangle', 0.3), 200); // G5 
    },
    gutter: () => playSound(150, 'sawtooth', 0.4, 0.1),
    gameOver: () => playSound(600, 'sine', 0.5),
};

// ===================================
// SUPABASE / ANALYTICS TRACKING
// ===================================
let gameStartTime = null;
let durationSent = false;
let gameStartedFlag = false;
let gameRecordTime = null;

window.addEventListener("beforeunload", () => {
    if (gameStartTime && !durationSent && window.trackGameEvent) {
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);
        window.trackGameEvent(`game_duration_bowling_${seconds}_tab_close_unknown`, { seconds });
        durationSent = true;
    }
});


// ===================================
// THREE.JS & CANNON.JS GLOBALS
// ===================================
let scene, camera, renderer;
let world;

// Materials
let physicsMaterial, ballMaterial, pinMaterial;
let laneContactMat, pinContactMat, ballPinContactMat;

// Meshes & Bodies
let ballMesh, ballBody;
let pins = []; // array of { mesh, body, startPos }
let originalPinPositions = [];

// Game State
const TOTAL_ROUNDS = 10;
let currentRound = 1;
let currentThrow = 1; // 1 or 2
let isPlayerTurn = true;

// Scores
let playerScore = 0;
let aiScore = 0;

let playerFramesData = Array.from({length: 10}, () => ({ throws: [], total: 0 }));
let aiFramesData = Array.from({length: 10}, () => ({ throws: [], total: 0 }));

// Turn State
let gameState = 'START'; // START, AIM, ROLL, WAIT, OVER
let rollTimer = 0;

// Input Variables

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
        window.trackGameEvent(`game_duration_bowling_${seconds}_${reason}_${getBrowser()}`, {
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


        sendDurationOnExit("background_bowling");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_bowling");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        const placementId = getPlacementId();
        window.trackGameEvent(`exit_before_game_bowling_${osKey}`, {
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

    console.log("✅ startGameSession");

    sessionId = generateSessionId();
    const placementId = getPlacementId();
    const os = getOS();
    const browser = getBrowser();
    const userAgent = navigator.userAgent;
    const gameSlug = "bowling";
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
    } catch (e) { }
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




// DOM
const uiObj = {
    playerFrames: document.getElementById('player-frames'),
    aiFrames: document.getElementById('ai-frames'),
    playerTotal: document.getElementById('player-total'),
    aiTotal: document.getElementById('ai-total'),
    pinTriangle: document.getElementById('pin-triangle'),
    msg: document.getElementById('status-text'),
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    resultTitle: document.getElementById('result-title'),
    resultDesc: document.getElementById('result-desc'),
    turnIndicator: document.getElementById('turn-indicator')
};

function initScoreBoard() {
    uiObj.playerFrames.innerHTML = '';
    uiObj.aiFrames.innerHTML = '';
    uiObj.pinTriangle.innerHTML = '';
    
    // Create 10 frames
    for(let i=1; i<=10; i++) {
        const pf = document.createElement('div');
        pf.className = 'frame-box';
        pf.id = `pf-${i}`;
        // frame 10 gets 3 boxes, others get 2
        let topHtml = i === 10 ? `<div></div><div></div><div></div>` : `<div></div><div></div>`;
        
        pf.innerHTML = `<div class="frame-number">${i}</div>
                        <div class="frame-top">${topHtml}</div>
                        <div class="frame-bottom"></div>`;
        uiObj.playerFrames.appendChild(pf);
        
        const af = document.createElement('div');
        af.className = 'frame-box';
        af.id = `af-${i}`;
        af.innerHTML = `<div class="frame-number">${i}</div>
                        <div class="frame-top">${topHtml}</div>
                        <div class="frame-bottom"></div>`;
        uiObj.aiFrames.appendChild(af);
    }
    
    // Create 10 pin icons
    for(let i=1; i<=10; i++) {
        const p = document.createElement('div');
        p.className = 'pin-icon';
        p.id = `pin-icon-${i}`;
        p.innerText = i;
        uiObj.pinTriangle.appendChild(p);
    }
}

// ===================================
// INITIALIZATION
// ===================================
function init() {
    initThree();
    initCannon();
    buildLane();
    setupBall();
    setupPinsPositions();
    setupTrajectory();
    initScoreBoard();
    setupInput();

    window.addEventListener('resize', onResize);
    document.getElementById('start-btn').onclick = startGame;
    document.getElementById('restart-btn').onclick = startGame;

    requestAnimationFrame(animate);
    
    // Auto start to skip start screen
    startGame();
}

function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 20, 100);

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    positionCameraForAim();

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer, better shadows

    const rgbeLoader = new THREE.RGBELoader();
    // Assuming relative path from other games
    // rgbeLoader.load('../assets/royal_esplanade_1k.hdr', (texture) => {
    //     texture.mapping = THREE.EquirectangularReflectionMapping;
    //     scene.environment = texture;
    // }, undefined, (err) => {
    //     console.warn('HDR not loaded, using default lighting.', err);
    // });
    scene.environment = null;
scene.background = new THREE.Color(0x0a0a1a);


    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 20, -10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048; // Increased for better detail
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0005; // Fix shadow acne (white splotches/noise)
    
    // Narrow the shadow camera to focus on the lane area for max resolution
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;

    scene.add(dirLight);

    // Spotlight on pins
    const spotLight = new THREE.SpotLight(0xfff0dd, 1.5, 50, Math.PI/4, 0.5, 1);
    spotLight.position.set(0, 15, -15);
    spotLight.target.position.set(0, 0, -35);
    scene.add(spotLight);
    scene.add(spotLight.target);
}

function positionCameraForAim() {
    // Camera behind the ball
    camera.position.set(0, 3.5, 9); // Pull camera back and down slightly
    camera.lookAt(0, -1, -30); // Look higher up to push the floor bottom upwards
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function initCannon() {
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    // Increase solver iterations for stable pins
    world.solver.iterations = 20;

    physicsMaterial = new CANNON.Material("standard");
    ballMaterial = new CANNON.Material("ball");
    pinMaterial = new CANNON.Material("pin");

    laneContactMat = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, { friction: 0.1, restitution: 0.2 });
    pinContactMat = new CANNON.ContactMaterial(pinMaterial, physicsMaterial, { friction: 0.3, restitution: 0.2 });
    ballPinContactMat = new CANNON.ContactMaterial(ballMaterial, pinMaterial, { friction: 0.3, restitution: 0.6 });
    
    world.addContactMaterial(laneContactMat);
    world.addContactMaterial(pinContactMat);
    world.addContactMaterial(ballPinContactMat);
}

function buildLane() {
    // Visual Lane (Wood)
    const laneGeo = new THREE.BoxGeometry(6, 0.5, 60);
    const laneMat = new THREE.MeshStandardMaterial({ 
        color: 0xe6b381, 
        roughness: 0.2, 
        metalness: 0.1 
    });
    const laneMesh = new THREE.Mesh(laneGeo, laneMat);
    laneMesh.position.set(0, -0.25, -15);
    laneMesh.receiveShadow = true;
    scene.add(laneMesh);

    // Physics Lane
    const laneShape = new CANNON.Box(new CANNON.Vec3(3, 0.25, 30));
    const laneBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
    laneBody.addShape(laneShape);
    laneBody.position.set(0, -0.25, -15);
    world.addBody(laneBody);

    // Gutters Visuals
    const gutterGeo = new THREE.BoxGeometry(1.5, 0.2, 60);
    const gutterMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    
    const leftGutter = new THREE.Mesh(gutterGeo, gutterMat);
    leftGutter.position.set(-3.75, -0.4, -15);
    scene.add(leftGutter);

    const rightGutter = new THREE.Mesh(gutterGeo, gutterMat);
    rightGutter.position.set(3.75, -0.4, -15);
    scene.add(rightGutter);

    // Gutter Physics (Walls angled to catch)
    // Actually we just let them fall off the main box. We add side walls to keep them from flying out totally.
    const sideWallShape = new CANNON.Box(new CANNON.Vec3(0.5, 2, 30));
    const leftWall = new CANNON.Body({ mass: 0, material: physicsMaterial });
    leftWall.addShape(sideWallShape);
    leftWall.position.set(-4.5, 1, -15);
    world.addBody(leftWall);

    const rightWall = new CANNON.Body({ mass: 0, material: physicsMaterial });
    rightWall.addShape(sideWallShape);
    rightWall.position.set(4.5, 1, -15);
    world.addBody(rightWall);
    
    // Back Wall
    const backWallShape = new CANNON.Box(new CANNON.Vec3(6, 3, 1));
    const backWall = new CANNON.Body({ mass: 0, material: physicsMaterial });
    backWall.addShape(backWallShape);
    backWall.position.set(0, 1.5, -45);
    world.addBody(backWall);
}

// Procedural texture to prevent CORS/missing file black screen issues
function createLightningBallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Base dark blue energy
    const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
    gradient.addColorStop(0, '#1d4ed8');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Draw lightning branches
    ctx.strokeStyle = '#60a5fa'; // Glow blue
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        let x = Math.random() * 1024;
        let y = 0;
        ctx.moveTo(x, y);
        ctx.lineWidth = Math.random() * 5 + 2;
        
        while (y < 1024) {
            x += (Math.random() - 0.5) * 120;
            y += Math.random() * 80 + 20;
            ctx.lineTo(x, y);
            
            // Draw branch
            if (Math.random() > 0.75) {
                let bx = x;
                let by = y;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineWidth = ctx.lineWidth * 0.5;
                for (let j = 0; j < 4; j++) {
                    bx += (Math.random() - 0.5) * 90;
                    by += Math.random() * 60 + 10;
                    ctx.lineTo(bx, by);
                }
                ctx.stroke();
                ctx.restore();
            }
        }
        ctx.stroke();
    }
    
    // Inner white hot core of lightning
    ctx.strokeStyle = '#ffffff'; 
    for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        let x = Math.random() * 1024;
        let y = 0;
        ctx.moveTo(x, y);
        ctx.lineWidth = Math.random() * 2 + 1;
        while (y < 1024) {
            x += (Math.random() - 0.5) * 100;
            y += Math.random() * 80 + 20;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 16;
    return tex;
}


function setupBall() {
    const r = 0.6;
    
    // Visual - Procedural Lightning texture
    const lightningTex = createLightningBallTexture();
    
    const geo = new THREE.SphereGeometry(r, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ 
        map: lightningTex,
        roughness: 0.1, 
        metalness: 0.6,
        envMapIntensity: 2.0
    });
    ballMesh = new THREE.Mesh(geo, mat);
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    // Physics
    const shape = new CANNON.Sphere(r);
    ballBody = new CANNON.Body({ 
        mass: 15, // Heavy
        material: ballMaterial,
        linearDamping: 0.25,
        angularDamping: 0.3
    });
    ballBody.addShape(shape);
    // Don't add to world until played!
    
    // Sound Event on impact
    ballBody.addEventListener("collide", function(e){
        if (e.body.material === pinMaterial) {
            
            // Limit sound spam
            if (Math.random() > 0.5) sounds.hit();
        }
    });

    resetBall();
}

function setupPinsPositions() {
    // classic triangle formation at z = -35
    const startZ = -35;
    const spacingX = 0.65;
    const spacingZ = 1.1;

    originalPinPositions = [
        { x: 0, z: startZ }, // Row 1 (1)
        { x: -spacingX, z: startZ - spacingZ }, // Row 2 (2)
        { x: spacingX, z: startZ - spacingZ },
        { x: -spacingX*2, z: startZ - spacingZ*2 }, // Row 3 (3)
        { x: 0, z: startZ - spacingZ*2 },
        { x: spacingX*2, z: startZ - spacingZ*2 },
        { x: -spacingX*3, z: startZ - spacingZ*3 }, // Row 4 (4)
        { x: -spacingX, z: startZ - spacingZ*3 },
        { x: spacingX, z: startZ - spacingZ*3 },
        { x: spacingX*3, z: startZ - spacingZ*3 },
    ];
}

function createPinGeometry() {
    const points = [];
    const profile = [
        [0, 0], [0.15, 0.05], [0.22, 0.2], [0.25, 0.4], [0.22, 0.6], [0.15, 0.8],
        [0.08, 1.0], [0.06, 1.1], [0.06, 1.2], [0.09, 1.35], [0.06, 1.45], [0, 1.5]
    ];
    for (let i = 0; i < profile.length; i++) {
        points.push(new THREE.Vector2(profile[i][0], profile[i][1]));
    }
    return new THREE.LatheGeometry(points, 24);
}

function spawnPins() {
    // Clear old
    pins.forEach(p => {
        scene.remove(p.mesh);
        world.removeBody(p.body);
    });
    pins = [];

    const pinGeo = createPinGeometry();
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xfffcfa, roughness: 0.1, metalness: 0.1 });
    
    const ringGeo = new THREE.TorusGeometry(0.068, 0.012, 8, 24);
    const redMat = new THREE.MeshBasicMaterial({ color: 0xcc0000 });

    originalPinPositions.forEach(pos => {
        const meshWrapper = new THREE.Group();
        
        const visualMesh = new THREE.Mesh(pinGeo, pinMat);
        visualMesh.position.y = -0.75; // Offset to center physics body
        
        const stripe1 = new THREE.Mesh(ringGeo, redMat);
        stripe1.position.y = 1.1; 
        stripe1.rotation.x = Math.PI / 2;
        visualMesh.add(stripe1);
        
        const stripe2 = new THREE.Mesh(ringGeo, redMat);
        stripe2.position.y = 1.25; 
        stripe2.rotation.x = Math.PI / 2;
        visualMesh.add(stripe2);

        visualMesh.castShadow = true;
        meshWrapper.add(visualMesh);
        
        meshWrapper.position.set(pos.x, 0.75, pos.z);
        scene.add(meshWrapper);

        // Cylinder shape natively in cannon acts a bit weird sometimes standing up.
        // A box is historically more stable for pins in simple engines.
        const shape = new CANNON.Cylinder(0.15, 0.22, 1.5, 8);
        const body = new CANNON.Body({
            mass: 1.5,
            material: pinMaterial,
            sleepTimeLimit: 1.0, 
            position: new CANNON.Vec3(pos.x, 0.75, pos.z)
        });
        
        // Cannon Cylinder axis is Z by default in some versions, need to rotate to align with Y visual
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
        body.addShape(shape, new CANNON.Vec3(0,0,0), q);

        body.linearDamping = 0.1;
        body.angularDamping = 0.1;
        
        world.addBody(body);
        pins.push({
            mesh: meshWrapper,
            body: body,
            startPos: { ...pos },
            isDown: false
        });
    });
}

let trajectoryDots = [];
const NUM_DOTS = 18;

function setupTrajectory() {
    const dotGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.8 });
    for (let i = 0; i < NUM_DOTS; i++) {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.visible = false;
        scene.add(dot);
        trajectoryDots.push(dot);
    }
}

function updateTrajectory(dx, dy) {
    if (dy >= -10) {
        hideTrajectory();
        return;
    }

    const swipePower = Math.min(Math.abs(dy), 350);
    const power = swipePower * 0.15 + 15; // Base rolling speed
    const hook = dx * 0.04; 

    const v0z = -power;
    const v0x = hook;

    for (let i = 0; i < NUM_DOTS; i++) {
        const dot = trajectoryDots[i];
        const t = (i + 1) * 0.05;

        const pz = ballMesh.position.z + (v0z * t);
        let px = ballMesh.position.x + (v0x * t);
        px = Math.max(-2.5, Math.min(2.5, px));

        dot.position.set(px, 0.4, pz);
        dot.visible = true;
        const scale = 1 - (i / NUM_DOTS) * 0.5;
        dot.scale.set(scale, scale, scale);
    }
}

function hideTrajectory() {
    for (let i = 0; i < NUM_DOTS; i++) {
        if (trajectoryDots[i]) trajectoryDots[i].visible = false;
    }
}

// ===================================
// INPUT / CONTROLS
// ===================================
let isAiming = false;
let currentX = 0, currentY = 0;
let ballStartX = 0;

function setupInput() {
    const cvs = document.getElementById('game-canvas');
    
    cvs.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    cvs.addEventListener('touchstart', (e) => onDown(e.touches[0]), {passive: false});
    window.addEventListener('touchmove', (e) => onMove(e.touches[0]), {passive: false});
    window.addEventListener('touchend', onUp);
}

function onDown(e) {
    if (gameState !== 'AIM' || !isPlayerTurn) return;
    isDragging = true;
    isAiming = false;
    startX = e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
    startY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
    currentX = startX;
    currentY = startY;
    ballStartX = ballMesh.position.x;
}

function onMove(e) {
    if (!isDragging || gameState !== 'AIM') return;
    
    currentX = e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
    currentY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
    
    const dx = currentX - startX;
    const dy = currentY - startY;
    
    if (!isAiming) {
        // If swiped up roughly, trigger aiming mode
        if (dy < -20 && Math.abs(dy) > Math.abs(dx)*0.5) {
            isAiming = true;
        } else {
            // Horizontal move
            let newX = ballStartX + (dx / window.innerWidth) * 8; // More responsive
            newX = Math.max(-2.5, Math.min(2.5, newX));
            ballMesh.position.x = newX;
            ballBody.position.x = newX;
        }
    }
    
    if (isAiming) {
        updateTrajectory(dx, dy);
    }
}

function onUp() {
    if (!isDragging) return;
    isDragging = false;
    
    if (isAiming) {
        hideTrajectory();
        const dx = currentX - startX;
        const dy = currentY - startY;
        
        if (dy < -30) {
            throwBall(dx, dy);
        }
    }
    isAiming = false;
}

// ===================================
// GAME LOGIC
// ===================================
function startGame() {    
    if(!gameStartedFlag) {
        gameStartedFlag = true;
        gameStartTime = Date.now();
        gameRecordTime = Date.now();
        initSupabase();
    }
    
    playerScore = 0;
    aiScore = 0;
    playerFramesData = Array.from({length: 10}, () => ({ throws: [], total: 0 }));
    aiFramesData = Array.from({length: 10}, () => ({ throws: [], total: 0 }));
    currentRound = 1;
    currentThrow = 1;
    isPlayerTurn = true;
    
    updateHUD();
    uiObj.startScreen.classList.add('hidden');
    uiObj.gameOverScreen.classList.add('hidden');
    
    setupRound();
}

function setupRound() {
    if (currentRound > TOTAL_ROUNDS) {
        endMatch();
        return;
    }
    spawnPins();
    setupTurn();
}

function setupTurn() {
    resetBall();
    updatePinDisplay();
    updateHUD();
    
    if (isPlayerTurn) {
        gameState = 'AIM';
        positionCameraForAim();
        uiObj.turnIndicator.textContent = 'YOUR TURN';
        uiObj.turnIndicator.classList.remove('ai');
        uiObj.turnIndicator.classList.remove('hidden');
    } else {
        gameState = 'AI_TURN';
        uiObj.turnIndicator.textContent = "AI'S TURN";
        uiObj.turnIndicator.classList.add('ai');
        uiObj.turnIndicator.classList.remove('hidden');
        setTimeout(playAITurn, 1000);
    }
}

function resetBall() {
    // Visual reset
    ballMesh.position.set(0, 0.85, 1); // Moved significantly further front (-3) down the lane
    
    // Physics detach
    if (world.bodies.includes(ballBody)) {
        world.removeBody(ballBody);
    }
    
    ballBody.position.copy(ballMesh.position);
    ballBody.velocity.set(0,0,0);
    ballBody.angularVelocity.set(0,0,0);
    
    // Reset camera if needed
    positionCameraForAim();
}

function throwBall(dx, dy) {
    gameState = 'ROLL';
    sounds.roll();
    
    // Sync physics
    ballBody.position.copy(ballMesh.position);
    world.addBody(ballBody);
    
    // Scale power to feel fast and impactful like Football 3D
    const swipePower = Math.min(Math.abs(dy), 600);
    const power = swipePower * 0.1 + 18; 
    const hook = dx * 0.05; 
    
    ballBody.velocity.set(hook, 0, -power);
    
    // Add forward spin based on power loop
    ballBody.angularVelocity.set(-power*0.6, 0, hook*0.5);
    
    // Let it roll and check results
    rollTimer = 0;

    const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
    if (seconds > 90) {
            initBottomAndSideAds();
            gameRecordTime = Date.now(); 
    }
}

function playAITurn() {
    resetBall();
    world.addBody(ballBody);
    
    // AI Logic (Aim roughly center with some variance)
    const aimX = (Math.random() - 0.5) * 1.5;
    ballBody.position.x = aimX;
    ballMesh.position.x = aimX;
    
    const power = 30 + (Math.random() * 5); // Consistently good speed
    const hook = (Math.random() - 0.5) * 1.5;
    
    sounds.roll();
    gameState = 'ROLL';
    ballBody.velocity.set(hook, 0, -power);
    rollTimer = 0;
}


function checkResults() {
    gameState = 'WAIT';
    
    // Count down pins. Pin is "down" if its local Y axis is tilting significantly or if it's fallen in the gutter.
    let knockedThisThrow = 0;
    
    pins.forEach(p => {
        if (p.isDown) return; // already counted
        
        // Check angle. Up vector (0,1,0) dotted with pin's current Up vector.
        const upVec = new CANNON.Vec3(0,1,0);
        // Current up vector for cylinder (which we rotated -Pi/2 on X)
        // Wait, easiest way is to check the Y position -> If it drops, it's down.
        // Also check if its angle changed deeply.
        
        // To be safe, any Y < 0.2 is in gutter. Or if absolute rotation difference is high.
        const euler = new CANNON.Vec3();
        p.body.quaternion.toEuler(euler);
        
        // original was -PI/2 on X if using basic canonical rotation.
        // Let's just use absolute Y position threshold. 0.75 is standing. Less than 0.5 is tipped over usually.
        if (p.body.position.y < 0.6 || Math.abs(p.body.position.x) > 2.8) {
            p.isDown = true;
            knockedThisThrow++;
        }
    });

    handleScoreLogic(knockedThisThrow);
}

function updatePinDisplay() {
    // Top-down pin mapping. 
    // We visually match 1 at the bottom (Row 4), 7,8,9,10 at top (Row 1).
    // Original positions array (1 to 10):
    // 0: row 1 center (front pin) -> visually pin #1
    // 1,2: row 2 -> pins #2, #3
    // 3,4,5: row 3 -> pins #4, #5, #6
    // 6,7,8,9: row 4 -> pins #7, #8, #9, #10
    
    const mapping = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    for(let i=0; i<pins.length; i++) {
        const visualNum = mapping[i];
        const uiPin = document.getElementById(`pin-icon-${visualNum}`);
        if(uiPin) {
            if(pins[i].isDown) {
                uiPin.classList.add('knocked');
            } else {
                uiPin.classList.remove('knocked');
            }
        }
    }
}

function handleScoreLogic(points) {
    let msg = "";
    let endRoundNow = false;

    // Tally total down
    let totalDown = pins.filter(p => p.isDown).length;
    let data = isPlayerTurn ? playerFramesData : aiFramesData;
    let roundIdx = currentRound - 1;

    data[roundIdx].throws.push(points);
    updatePinDisplay();

    if (currentThrow === 1) {
        if (totalDown === 10) {
            msg = "STRIKE!";
            sounds.strike();
            endRoundNow = true;
        } else if (points === 0) {
            msg = "GUTTER!";
            sounds.gutter();
        } else {
            msg = `${points} PINS!`;
        }
    } else {
        if (totalDown === 10) {
            msg = "SPARE!";
            sounds.strike(); // Reuse strike sound
            endRoundNow = true;
        } else {
            msg = `${points} PINS!`;
        }
        endRoundNow = true; // Throw 2 always ends round
    }

    // Keep score logic simple for this version (no complicated look-ahead bonus tracking)
    data[roundIdx].total = data[roundIdx].throws.reduce((a,b)=>a+b, 0);

    if(isPlayerTurn) playerScore = data.reduce((sum, f) => sum + f.total, 0);
    else aiScore = data.reduce((sum, f) => sum + f.total, 0);

    showStatus(msg);
    updateHUD();

    setTimeout(() => {
        if (endRoundNow) {
            // Swap turns
            if (isPlayerTurn) {
                isPlayerTurn = false;
                currentThrow = 1;
                setupTurn(); // Setup AI Turn with full pins
                spawnPins(); // Reset pins for AI
            } else {
                // Round Complete
                isPlayerTurn = true;
                currentThrow = 1;
                currentRound++;
                setupRound();
            }
        } else {
            // Next throw, same player. Remove knocked down pins physically.
            cleanUpFallenPins();
            currentThrow++;
            setupTurn();
        }
    }, 2500);
}

function cleanUpFallenPins() {
    pins.forEach(p => {
        if (p.isDown) {
            p.mesh.visible = false;
            if (world.bodies.includes(p.body)) {
                world.removeBody(p.body);
            }
        }
    });
}

function showStatus(text) {
    uiObj.msg.textContent = text;
    uiObj.msg.classList.remove('hidden');
    setTimeout(() => {
        uiObj.msg.classList.add('hidden');
    }, 2000);
}

function renderFrames(containerId, framesData, isPlayer) {
    let runningTotal = 0;
    
    for(let i=0; i<10; i++) {
        const frame = framesData[i];
        const el = document.getElementById(`${isPlayer ? 'pf' : 'af'}-${i+1}`);
        if(!el) continue;
        
        // Highlight active
        if((i+1) === currentRound && isPlayerTurn === isPlayer) {
            el.classList.add('active-frame');
        } else {
            el.classList.remove('active-frame');
        }
        
        const topDivs = el.querySelectorAll('.frame-top div');
        const bottomDiv = el.querySelector('.frame-bottom');
        
        // Clear
        topDivs.forEach(d => d.textContent = '');
        bottomDiv.textContent = '';
        
        if(frame.throws.length > 0) {
            let throw1 = frame.throws[0];
            let throw2 = frame.throws[1] !== undefined ? frame.throws[1] : '';
            
            if(throw1 === 10) {
                topDivs[1].textContent = 'X';
            } else {
                topDivs[0].textContent = throw1 === 0 ? '-' : throw1;
                if(throw2 !== '') {
                    if((throw1 + throw2) === 10) {
                        topDivs[1].textContent = '/';
                    } else {
                        topDivs[1].textContent = throw2 === 0 ? '-' : throw2;
                    }
                }
            }
            
            runningTotal += frame.total;
            bottomDiv.textContent = runningTotal;
        }
    }
}

function updateHUD() {
    renderFrames('player-frames', playerFramesData, true);
    renderFrames('ai-frames', aiFramesData, false);
    
    uiObj.playerTotal.textContent = playerScore;
    uiObj.aiTotal.textContent = aiScore;
}

function endMatch() {
    gameState = 'OVER';
    sounds.gameOver();
    
    uiObj.turnIndicator.classList.add('hidden');
    
    // UI
    uiObj.gameOverScreen.classList.remove('hidden');
    if (playerScore > aiScore) {
        uiObj.resultTitle.textContent = "YOU WIN! 🏆";
    } else if (aiScore > playerScore) {
        uiObj.resultTitle.textContent = "AI WINS 😞";
    } else {
        uiObj.resultTitle.textContent = "DRAW! 🤝";
    }
    
    uiObj.resultDesc.textContent = `Player: ${playerScore} | AI: ${aiScore}`;
}


// ===================================
// RENDER LOOP
// ===================================
const timeStep = 1 / 60;
function animate() {
    requestAnimationFrame(animate);

    if (gameState !== 'START' && gameState !== 'OVER') {
        world.step(timeStep);
        
        // Sync meshes
        if (gameState === 'ROLL') {
            ballMesh.position.copy(ballBody.position);
            ballMesh.quaternion.copy(ballBody.quaternion);
            
            // Camera follow
            camera.position.z = Math.max(-20, ballMesh.position.z + 10);
            camera.lookAt(ballMesh.position);

            rollTimer += timeStep;
            
            // End roll check (went off back, or stopped moving, or time limit)
            if (ballMesh.position.z < -45 || Math.abs(ballMesh.position.x) > 6 || rollTimer > 5) {
                checkResults();
            }
        }

        // Sync pins
        pins.forEach(p => {
            if (!p.isDown) {
                p.mesh.position.copy(p.body.position);
                p.mesh.quaternion.copy(p.body.quaternion);
            }
        });
    }

    renderer.render(scene, camera);
}

// Kickoff
init();
