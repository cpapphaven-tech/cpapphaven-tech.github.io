/**
 * Neon Slicer 3D
 * Inspired by classic ninja slicing mechanics, rebuilt natively in Three.js for Playmix.
 */

// ─── SUPABASE / ANALYTICS ─────────────────────────────────────────
const SUPA_URL = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const SUPA_KEY = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let _sb = null, _sessionId = null, _sessionStarted = false, _gameStartTime = null, _durationSent = false;
let _gameRecordTime = null; // for PMG_TICK_RATE ad refresh

function _getOS() { const u=navigator.userAgent; return /android/i.test(u)?'Android':/iPhone|iPad/i.test(u)?'iOS':/Win/i.test(u)?'Windows':/Mac/i.test(u)?'Mac':'Other'; }
function _getBrowser() { const u=navigator.userAgent; return /Edg/i.test(u)?'Edge':/Chrome/i.test(u)?'Chrome':/Safari/i.test(u)?'Safari':/Firefox/i.test(u)?'Firefox':'Other'; }
function _placement() { const p=new URLSearchParams(location.search); return p.get('utm_content')||p.get('placementid')||'unknown'; }
async function _country() { try{const r=await fetch('https://ipapi.co/json/');const d=await r.json();return d.country_name||'Unknown';}catch{return 'Unknown';} }
async function initSupabase() {
    if (!window.supabase) { setTimeout(initSupabase,600); return; }
    const {createClient}=window.supabase; _sb=createClient(SUPA_URL,SUPA_KEY);
    _sessionId=Date.now().toString(36)+Math.random().toString(36).substr(2,8);
    try { await _sb.from('game_sessions').insert([{ session_id:_sessionId, game_slug:'neon_slicer_3d', placement_id:_placement(), user_agent:navigator.userAgent, os:_getOS(), browser:_getBrowser(), country:await _country(), started_game:false, bounced:false }]); } catch(e){}
}
async function _markStarted() { if(!_sb||!_sessionId)return; try{await _sb.from('game_sessions').update({started_game:true}).eq('session_id',_sessionId);}catch(e){} }
async function _updateSess(f) { if(!_sb||!_sessionId)return; try{await _sb.from('game_sessions').update(f).eq('session_id',_sessionId);}catch(e){} }
function _sendDuration(reason) {
    if(_gameStartTime&&!_durationSent&&window.trackGameEvent){
        const s=Math.round((Date.now()-_gameStartTime)/1000);
        window.trackGameEvent(`game_duration_neon_slicer_${s}_${reason}`,{seconds:s,os:_getOS(),placement_id:_placement()});
        _updateSess({duration_seconds:s,bounced:!_sessionStarted,end_reason:reason}); _durationSent=true;
    }
}
window.addEventListener('beforeunload',()=>_sendDuration('tab_close'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)_sendDuration('background');});

// ─── AUDIO SYSTEM ─────────────────────────────────────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration, vol = 0.1, slideFreq = null) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideFreq, audioCtx.currentTime + duration);
    }
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sounds = {
    slice: () => playSound(600 + Math.random()*400, 'sine', 0.1, 0.1),
    bomb: () => { playSound(100, 'sawtooth', 1.0, 0.3, 20); playSound(200, 'square', 0.8, 0.2, 50); },
    throw: () => playSound(200 + Math.random()*100, 'triangle', 0.2, 0.05, 400),
    loseLife: () => playSound(300, 'square', 0.4, 0.1, 100),
    swing: () => playSound(800 + Math.random()*200, 'sine', 0.1, 0.02, 400)
};

// ─── GAME STATE ───────────────────────────────────────────────────
let score = 0;
let level = 1;
let targetScore = 100;
let timeLeft = 60;
let gameState = 'MENU'; // MENU, PLAY, OVER, LEVEL_START
let gameClock = 0;

const ui = {
    timeDisp: document.getElementById('time-display'),
    scoreDisp: document.getElementById('score-display'),
    targetDisp: document.getElementById('target-display'),
    levelDisp: document.getElementById('level-display'),
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    levelCompleteScreen: document.getElementById('level-complete-screen'),
    finalScore: document.getElementById('final-score'),
    comboDisplay: document.getElementById('combo-display')
};

// ─── THREE.JS SETUP ───────────────────────────────────────────────
const wrapper = document.getElementById('game-wrapper');
let CW = wrapper.clientWidth;
let CH = wrapper.clientHeight;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b0f19, 20, 60);

const camera = new THREE.PerspectiveCamera(60, CW / CH, 0.1, 1000);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(CW, CH);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Perf optimization
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1.0, 100);
pointLight.position.set(0, 10, 10);
scene.add(pointLight);

// ─── EFFECTS TRAIL (2D Canvas Overlay) ───────────────────────────
const trailCanvas = document.getElementById('trailCanvas');
const tctx = trailCanvas.getContext('2d');
let points = [];
let isDrawing = false;
let lastProcessPoint = null;

function resizeCanvases() {
    CW = wrapper.clientWidth;
    CH = wrapper.clientHeight;
    renderer.setSize(CW, CH);
    camera.aspect = CW / CH;
    camera.updateProjectionMatrix();
    trailCanvas.width = CW;
    trailCanvas.height = CH;
}
window.addEventListener('resize', resizeCanvases);
resizeCanvases();

// ─── GAME OBJECTS ─────────────────────────────────────────────────
const targets = [];
const particles = [];
let spawnTimer = 0;
let spawnInterval = 1.5; // Starts at 1.5 seconds

const neonColors = [
    0x00e5ff, // Cyan
    0xf43f5e, // Pink/Red
    0x10b981, // Emerald
    0xf59e0b, // Amber
    0x8b5cf6  // Purple
];

const balloonGeo = new THREE.SphereGeometry(1.2, 32, 32);
const tailGeo = new THREE.ConeGeometry(0.3, 0.5, 8);
tailGeo.translate(0, -1.3, 0);

// No merging needed, we will add the tail as a child of the main balloon mesh.

const sharedMaterialOpts = {
    roughness: 0.4,
    metalness: 0.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2
};

function createBalloonTexture(text, colorHex, isNegative) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Fill base color
    ctx.fillStyle = isNegative ? '#dc2626' : '#' + new THREE.Color(colorHex).getHexString();
    ctx.fillRect(0, 0, 512, 512);

    ctx.font = "bold 180px Outfit, sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    // Print text on 4 sides of the equator so it's visible while slowly rotating
    ctx.fillText(text, 128, 256);
    ctx.fillText(text, 384, 256);
    
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text, 128, 256);
    ctx.strokeText(text, 384, 256);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}

function spawnTarget() {
    if (gameState !== 'PLAY') return;

    // Balloon logic
    const isNegative = Math.random() < 0.25; // 25% chance of negative balloon
    let maxVal = Math.min(50, 10 + Math.floor((level - 1) * 5));
    let val = Math.floor(Math.random() * maxVal) + 1;
    if (isNegative) val = -val;
    else if (Math.random() > 0.8) val += 15; // Some high value positives

    const color = neonColors[Math.floor(Math.random() * neonColors.length)];
    const tex = createBalloonTexture(val.toString(), color, isNegative);

    const mat = new THREE.MeshPhysicalMaterial({ 
        ...sharedMaterialOpts, 
        map: tex,
        emissive: isNegative ? 0x440000 : color,
        emissiveIntensity: isNegative ? 0.2 : 0.4
    });
    
    let mesh = new THREE.Mesh(balloonGeo, mat);
    let tailMesh = new THREE.Mesh(tailGeo, mat);
    mesh.add(tailMesh);
    mesh.userData.color = color;
    mesh.userData.value = val;
    mesh.userData.isNegative = isNegative;

    // Spawn completely below screen, throw upwards
    const xPos = (Math.random() - 0.5) * 12; // slightly tighter x-spread so they don't go strictly off-screen
    mesh.position.set(xPos, -15, (Math.random() - 0.5) * 4);
    
    // Calculate throw physics
    const throwStrengthX = -xPos * 0.3 + (Math.random() - 0.5) * 2; // Throw inwards
    const throwStrengthY = 24 + Math.random() * 6; // Perfect height curve, stays visible

    const body = {
        mesh: mesh,
        type: 'balloon',
        vx: throwStrengthX,
        vy: throwStrengthY,
        vz: (Math.random() - 0.5) * 4,
        rotX: 0, // Balloons stay upright!
        rotY: (Math.random() - 0.5) * 2, // Slow twist
        rotZ: 0,
        sliced: false
    };

    scene.add(mesh);
    targets.push(body);
    sounds.throw();
}

function createShatterEffect(pos, color) {
    const pCount = 15;
    const geo = new THREE.TetrahedronGeometry(0.3, 0);
    const mat = new THREE.MeshBasicMaterial({ color: color, blending: THREE.AdditiveBlending });

    for (let i = 0; i < pCount; i++) {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        // explode outward
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        
        scene.add(mesh);
        particles.push({
            mesh: mesh,
            vx: Math.cos(angle1) * speed,
            vy: Math.sin(angle1) * speed,
            vz: Math.sin(angle2) * speed,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.04
        });
    }
}

// ─── INTERACTION ──────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
raycaster.layers.set(0); 

function getMouseVector(screenX, screenY) {
    const vec = new THREE.Vector2();
    vec.x = (screenX / CW) * 2 - 1;
    vec.y = -(screenY / CH) * 2 + 1;
    return vec;
}

function handleInputStart(e) {
    if (gameState !== 'PLAY') return;
    isDrawing = true;
    points = [];
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // adjust for wrapper boundaries
    const rect = wrapper.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    points.push({ x, y, age: 0 });
    lastProcessPoint = { x, y };
}

function handleInputMove(e) {
    if (!isDrawing || gameState !== 'PLAY') return;
    e.preventDefault(); 
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = wrapper.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    points.push({ x, y, age: 0 });

    if (points.length % 3 === 0) {
        sounds.swing(); // slight swoosh sound
    }

    // Raycast continuously between segment
    const dist = Math.hypot(x - lastProcessPoint.x, y - lastProcessPoint.y);
    if (dist > 15) { // Minimum slice distance
        const steps = Math.ceil(dist / 15);
        for(let i=0; i<=steps; i++) {
            const lerpX = lastProcessPoint.x + (x - lastProcessPoint.x) * (i/steps);
            const lerpY = lastProcessPoint.y + (y - lastProcessPoint.y) * (i/steps);
            checkSlice(lerpX, lerpY);
        }
        lastProcessPoint = { x, y };
        
        // Ad layout sync throttle handling here
        if (_gameRecordTime) {
            const s = Math.round((Date.now() - _gameRecordTime) / 1000);
            if(s > (window.PMG_TICK_RATE || 60)) {
                if(typeof syncPMGLayout === 'function') syncPMGLayout();
                _gameRecordTime = Date.now();
            }
        }
    }
}

function handleInputEnd() {
    isDrawing = false;
}

wrapper.addEventListener('mousedown', handleInputStart);
window.addEventListener('mousemove', handleInputMove);
window.addEventListener('mouseup', handleInputEnd);

wrapper.addEventListener('touchstart', handleInputStart, {passive: false});
window.addEventListener('touchmove', handleInputMove, {passive: false});
window.addEventListener('touchend', handleInputEnd);

let currentCombo = 0;
let comboTimer = 0;

function showCombo(count) {
    ui.comboDisplay.innerText = `Combo x${count}!`;
    ui.comboDisplay.classList.remove('show');
    void ui.comboDisplay.offsetWidth; // trigger reflow
    ui.comboDisplay.classList.add('show');
}

function showFloatingScore(pos, value) {
    const vector = pos.clone();
    vector.project(camera);
    
    const px = (vector.x * 0.5 + 0.5) * CW;
    const py = (-(vector.y * 0.5) + 0.5) * CH;
    
    const floater = document.createElement('div');
    floater.innerText = value > 0 ? `+${value}` : `${value}`;
    floater.style.position = 'absolute';
    floater.style.left = `${px}px`;
    floater.style.top = `${py}px`;
    floater.style.color = value > 0 ? '#ffffff' : '#ff3366';
    floater.style.fontWeight = '900';
    floater.style.fontSize = '2.5rem';
    floater.style.pointerEvents = 'none';
    floater.style.textShadow = '0 0 10px rgba(0,0,0,0.5)';
    floater.style.transform = 'translate(-50%, -50%) scale(0.5)';
    floater.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s linear';
    floater.style.zIndex = '100';
    floater.style.opacity = '1';
    
    wrapper.appendChild(floater);
    
    // Force CSS evaluation break 
    void floater.offsetWidth;
    
    // Shoot up
    floater.style.transform = 'translate(-50%, -150px) scale(1.2)';
    floater.style.opacity = '0';
    
    setTimeout(() => {
        if(floater.parentNode) floater.parentNode.removeChild(floater);
    }, 600);
}

function checkSlice(px, py) {
    raycaster.setFromCamera(getMouseVector(px, py), camera);
    
    // Expand raycaster threshold for easier mobile slicing
    raycaster.params.Line = { threshold: 1 };

    const intersectables = targets.filter(t => !t.sliced).map(t => t.mesh);
    const intersects = raycaster.intersectObjects(intersectables, false);

    if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const targetObj = targets.find(t => t.mesh === hitMesh);
        if (targetObj && !targetObj.sliced) {
            processHit(targetObj);
        }
    }
}

function processHit(target) {
    target.sliced = true;
    scene.remove(target.mesh);

    if (target.mesh.userData.isNegative) {
        sounds.loseLife();
        createShatterEffect(target.mesh.position, 0xff0000); // Red shatter for bad
        score += target.mesh.userData.value; // Deduct score
        showFloatingScore(target.mesh.position, target.mesh.userData.value);
        
        // Reset combo
        currentCombo = 0;
        comboTimer = 0;
        ui.comboDisplay.classList.remove('show');
    } else {
        sounds.slice();
        createShatterEffect(target.mesh.position, target.mesh.userData.color);
        
        score += target.mesh.userData.value;
        showFloatingScore(target.mesh.position, target.mesh.userData.value);
        currentCombo++;
        if(currentCombo > 1) {
            score += (currentCombo - 1) * 5; // Combo bonus
            showCombo(currentCombo);
        }
        comboTimer = 0.5; // Half second to maintain combo
    }
    
    // Prevent negative total score visual glitch
    if (score < 0) score = 0;
    
    updateHUD();

    if (score >= targetScore) {
        levelComplete();
    }
}

function updateHUD() {
    ui.scoreDisp.innerText = score;
    ui.targetDisp.innerText = targetScore;
    ui.levelDisp.innerText = level;
    ui.timeDisp.innerText = Math.ceil(Math.max(0, timeLeft)) + 's';
}

// ─── GAME LOOP ────────────────────────────────────────────────────
function startGame() {
    if (!_sessionStarted) {
        _gameStartTime = Date.now();
        _gameRecordTime = Date.now();
        _sessionStarted = true;
        _markStarted();
    }

    score = 0;
    level = 1;
    targetScore = 100;
    startLevelInternal();
    ui.startScreen.classList.add('hidden');
    ui.gameOverScreen.classList.add('hidden');
    ui.levelCompleteScreen.classList.add('hidden');
}

function nextLevel() {
    level++;
    score = 0;
    targetScore += 100; // Increase target
    startLevelInternal();
    ui.levelCompleteScreen.classList.add('hidden');
}

function startLevelInternal() {
    timeLeft = 60;
    spawnTimer = 0;
    spawnInterval = Math.max(0.6, 1.5 - (level * 0.1));
    gameClock = 0;
    currentCombo = 0;
    
    targets.forEach(t => scene.remove(t.mesh));
    targets.length = 0;
    particles.forEach(p => scene.remove(p.mesh));
    particles.length = 0;
    points = [];

    updateHUD();
    gameState = 'PLAY';
}

function levelComplete() {
    gameState = 'LEVEL_START';
    ui.levelCompleteScreen.classList.remove('hidden');
    
    if(typeof syncPMGLayout === 'function') syncPMGLayout();
}

function gameOver() {
    gameState = 'OVER';
    ui.finalScore.innerText = score;
    ui.gameOverScreen.classList.remove('hidden');
    
    if(typeof syncPMGLayout === 'function') syncPMGLayout();
    _updateSess({ bounced: false });
}

document.getElementById('start-btn').onclick = () => startGame();
document.getElementById('restart-btn').onclick = () => startGame();
document.getElementById('next-level-btn').onclick = () => nextLevel();

// Info Modal Handling
const infoModal = document.getElementById('info-modal');
const openInfo = () => { infoModal.classList.remove('hidden'); };
const closeInfo = () => { infoModal.classList.add('hidden'); };

document.getElementById('start-info-btn').onclick = openInfo;
document.getElementById('info-btn-hud').onclick = openInfo;
document.getElementById('close-info').onclick = closeInfo;

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();

    // 1. Draw 2D Blade Trail
    tctx.clearRect(0, 0, CW, CH);
    if (points.length > 0) {
        tctx.beginPath();
        tctx.moveTo(points[0].x, points[0].y);
        for(let i=1; i<points.length; i++) {
            tctx.lineTo(points[i].x, points[i].y);
        }
        tctx.strokeStyle = '#00e5ff';
        tctx.lineWidth = 6;
        tctx.lineCap = 'round';
        tctx.lineJoin = 'round';
        tctx.shadowBlur = 15;
        tctx.shadowColor = '#00e5ff';
        tctx.stroke();

        tctx.strokeStyle = '#ffffff';
        tctx.lineWidth = 2;
        tctx.shadowBlur = 0;
        tctx.stroke();

        // Age points
        for(let i=points.length-1; i>=0; i--) {
            points[i].age += dt;
            if(!isDrawing && points[i].age > 0.15) {
                points.splice(i, 1);
            }
        }
        // Force trim long tails
        if (points.length > 15 && isDrawing) {
            points.shift();
        }
    }

    if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
            currentCombo = 0; // Combo reset
            ui.comboDisplay.classList.remove('show');
        }
    }

    if (gameState === 'PLAY') {
        gameClock += dt;
        spawnTimer -= dt;
        timeLeft -= dt;

        updateHUD(); // For tracking time ticking down

        if (timeLeft <= 0) {
            timeLeft = 0;
            updateHUD();
            gameOver();
        }
        
        // Difficulty scaling
        spawnInterval = Math.max(0.4, 1.5 - (level * 0.1) - (gameClock / 60) * 0.5);

        if (spawnTimer <= 0) {
            spawnTarget();
            // Might double spawn if hard enough
            if(Math.random() > 0.6 && spawnInterval < 1.0) spawnTarget();
            spawnTimer = spawnInterval;
        }

        // Targets Physics
        for (let i = targets.length - 1; i >= 0; i--) {
            const t = targets[i];
            
            // Gravity
            t.vy -= 25 * dt;

            t.mesh.position.x += t.vx * dt;
            t.mesh.position.y += t.vy * dt;
            t.mesh.position.z += t.vz * dt;

            t.mesh.rotation.x += t.rotX * dt;
            t.mesh.rotation.y += t.rotY * dt;
            t.mesh.rotation.z += t.rotZ * dt;

            // Missed balloon check
            if (t.mesh.position.y < -16 && t.vy < 0) {
                scene.remove(t.mesh);
                targets.splice(i, 1);
            }
        }
    }

    // Particles Physics
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy -= 15 * dt; // gravity
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        
        p.mesh.rotation.x += p.vx * dt;
        p.mesh.rotation.y += p.vy * dt;

        p.life -= p.decay;
        p.mesh.scale.setScalar(p.life);
        
        if (p.life <= 0) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

initSupabase();
animate();
