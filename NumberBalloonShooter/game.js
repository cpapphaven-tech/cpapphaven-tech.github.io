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
    pop1: () => playSound(600, 'sine', 0.1, 0.1),
    pop5: () => playSound(800, 'triangle', 0.15, 0.15),
    pop10: () => { playSound(1000, 'square', 0.2, 0.2); playSound(1200, 'sine', 0.2, 0.1); },
    gameOver: () => playSound(150, 'sawtooth', 0.8, 0.2),
    win: () => {
        playSound(523.25, 'sine', 0.1);
        setTimeout(() => playSound(659.25, 'sine', 0.15), 100);
        setTimeout(() => playSound(783.99, 'triangle', 0.3), 200);
    },
    combo: (c) => playSound(400 + (c * 50), 'sine', 0.1, 0.1),
    drop: () => playSound(200, 'sawtooth', 0.2, 0.05)
};

// ===================================
// SUPABASE / ANALYTICS
// ===================================
let gameStartTime = null;
let durationSent = false;
let gameStartedFlag = false;
let gameRecordTime = null;

window.addEventListener("beforeunload", () => {
    if (gameStartTime && !durationSent && window.trackGameEvent) {
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);
        window.trackGameEvent(`game_duration_balloon_${seconds}_tab_close_unknown`, { seconds });
        durationSent = true;
    }
});

// ===================================
// THREE.JS GLOBALS
// ===================================
let scene, camera, renderer;
let raycaster, mouse;
let balloons = [];
let CW, CH; // Global dimensions

// ===================================
// GAME STATE
// ===================================
let score = 0;
let level = 1;
let targetScore = 100;
let timeLeft = 60;
let gameState = 'MENU'; // MENU, PLAY, OVER
let lastFrameTime = 0;

// AI Spawning
let spawnTimer = 0;
let spawnRate = 1.0; 

// DOM
const ui = {
    score: document.getElementById('current-score'),
    target: document.getElementById('target-score'),
    time: document.getElementById('time-left'),
    level: document.getElementById('level-display'),
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    resultTitle: document.getElementById('result-title'),
    resultDesc: document.getElementById('result-desc')
};

// ===================================
// INITIALIZATION
// ===================================
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

    ui.startScreen.style.display = 'none';

    const wrapper = document.getElementById('game-wrapper');
    CW = wrapper ? wrapper.clientWidth : window.innerWidth;
    CH = wrapper ? wrapper.clientHeight : window.innerHeight;

    camera = new THREE.PerspectiveCamera(60, CW / CH, 0.1, 1000);
    camera.position.set(0, 0, 15);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(CW, CH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Starfield Background (Parallax effect)
    createStarfield();

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener('resize', onResize);
    
    // Controls
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onPointerDown(e.touches[0]); }, { passive: false });

    // Buttons
    document.getElementById('start-btn').onclick = startGame;
    document.getElementById('restart-btn').onclick = startGame;
    document.getElementById('next-level-btn').onclick = nextLevel;

    lastFrameTime = performance.now();
    requestAnimationFrame(animate);

    setTimeout(() => {
    startGame();
}, 300);


}

function createStarfield() {
    const geo = new THREE.BufferGeometry();
    const pos = [];
    for(let i=0; i<500; i++) {
        pos.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, -20 - Math.random() * 30);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 });
    scene.add(new THREE.Points(geo, mat));
}

function onResize() {
    const wrapper = document.getElementById('game-wrapper');
    if (!wrapper) return;
    CW = wrapper.clientWidth;
    CH = wrapper.clientHeight;
    camera.aspect = CW / CH;
    camera.updateProjectionMatrix();
    renderer.setSize(CW, CH);
}

// ===================================
// BALLOON SYSTEM
// ===================================
function createTextTexture(text, bgColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Solid base color wrapped over entire sphere
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 512, 256);

    // Text Rendering
    ctx.fillStyle = "white";
    ctx.font = "bold 140px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 12;
    
    // Draw on both front and back UV bounds to guarantee visibility from any angle
    ctx.fillText(text, 128, 138); 
    ctx.fillText(text, 384, 138);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}

function spawnBalloon() {
    const colorList = [
        '#94a3b8', '#fb923c', '#facc15', '#a3e635', '#4ade80', 
        '#2dd4bf', '#38bdf8', '#60a5fa', '#818cf8', '#a855f7'
    ];
    let maxVal = Math.min(50, 10 + Math.floor((level - 1) / 2));
    let val = Math.floor(Math.random() * maxVal) + 1; // Scales up to 50 linearly
    
    let isNegative = Math.random() < 0.25; // 25% chance for minus balloon
    
    if (isNegative) {
        val = -Math.max(1, Math.floor(val / 2)); // Subtract proportional chunks
    } else {
        // AI Logic: Help player if struggling
        if (timeLeft < 20 && score < targetScore * 0.8) {
            val = Math.max(val, Math.floor(maxVal * 0.6)); // Force large positive value
        } else if (score < targetScore / 2 && timeLeft < 40) {
            val = Math.max(val, Math.floor(maxVal * 0.4)); // Force mild positive value
        }
    }

    let color = colorList[(Math.abs(val) - 1) % 10]; // Colors match absolute values to disguise minuses
    let radius = CW < 768 ? 0.9 : 1.3; 
    
    // Base speed slightly increased, scales softly with absolute numerical payload
    let speedY = 0.03 + (Math.abs(val) * 0.003) + Math.random() * 0.02; 
    if (isNegative) speedY *= 1.2; // Minuses fall slightly faster to induce panic

    // Pressure Control 
    if (timeLeft < 10) {
        speedY *= 1.3; // Last 10 sec fast balloons
        spawnRate = Math.max(0.1, 0.4 - (level * 0.01));
    } else {
        spawnRate = Math.max(0.15, 0.8 - (level * 0.02));
    }

    const tex = createTextTexture(val.toString(), color);
    
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ 
        map: tex, 
        roughness: 0.2, 
        metalness: 0.1 
    });

    const mesh = new THREE.Mesh(geo, mat);
    
    // Slight wobbling physics
    const swaySpeed = 1 + Math.random() * 2;
    const swayAmount = 0.05 + Math.random() * 0.1;

    const aspect = CW / CH;
    const xRange = Math.max(5, 12 * aspect); // Dynamically scale range based on aspect ratio
    mesh.position.x = (Math.random() - 0.5) * xRange;
    mesh.position.y = 12 + Math.random() * 2; 
    mesh.position.z = (Math.random() - 0.5) * 4; 
    
    // Add "knot" to bottom of balloon
    const knotGeo = new THREE.ConeGeometry(0.15, 0.3, 8);
    const knotMat = new THREE.MeshStandardMaterial({ color: color });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    knot.position.y = -radius;
    knot.rotation.z = Math.PI;
    mesh.add(knot);

    scene.add(mesh);
    balloons.push({ 
        mesh, 
        value: val, 
        speedY, 
        dead: false,
        swaySpeed,
        swayAmount,
        baseX: mesh.position.x,
        timeAlive: 0
    });
}

function createBurstParticles(pos, colorStr, value) {
    const color = new THREE.Color(colorStr);
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 40; // Dense explosion array
    const pPos = new Float32Array(particleCount * 3);
    const pVel = [];

    for(let i=0; i<particleCount; i++) {
        pPos[i*3] = pos.x;
        pPos[i*3+1] = pos.y;
        pPos[i*3+2] = pos.z;
        
        // True spherical 3D burst distribution calculations
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 5 + Math.random() * 15;
        
        pVel.push({
            x: Math.sin(phi) * Math.cos(theta) * speed,
            y: Math.sin(phi) * Math.sin(theta) * speed,
            z: Math.cos(phi) * speed
        });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: color, size: 0.6, transparent: true });
    const particleSystem = new THREE.Points(particleGeo, pMat);
    scene.add(particleSystem);

    let life = 1.0;
    const animateParticles = () => {
        life -= 0.03;
        if(life <= 0) {
            scene.remove(particleSystem);
            particleGeo.dispose();
            pMat.dispose();
            return;
        }
        const attrs = particleSystem.geometry.attributes.position.array;
        for(let i=0; i<particleCount; i++) {
            attrs[i*3] += pVel[i].x * 0.016;
            attrs[i*3+1] += pVel[i].y * 0.016;
            attrs[i*3+2] += pVel[i].z * 0.016;
            pVel[i].y -= 0.3; // Gravity pulling particles
            pVel[i].x *= 0.92; // Atmospheric drag
            pVel[i].z *= 0.92;
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
        particleSystem.material.opacity = life;
        particleSystem.material.size = life * 0.6; // Scale down safely
        requestAnimationFrame(animateParticles);
    };
    animateParticles();
    
    // Interactive HTML Canvas Syncing Pop Animation
    const vector = new THREE.Vector3(pos.x, pos.y, pos.z);
    vector.project(camera);
    
    const wrapper = document.getElementById('game-wrapper');
    if(!wrapper) return;
    CW = wrapper.clientWidth;
    CH = wrapper.clientHeight;
    // Map WebGL -1,1 normalizations space identically to pixel ratios
    const px = (vector.x * .5 + .5) * CW;
    const py = (-(vector.y * .5) + .5) * CH;
    
    const floater = document.createElement('div');
    floater.innerText = value > 0 ? `+${value}` : `${value}`;
    floater.style.position = 'absolute';
    floater.style.left = `${px}px`;
    floater.style.top = `${py}px`;
    floater.style.color = value > 0 ? '#fff' : '#ef4444';
    floater.style.fontWeight = '900';
    floater.style.fontSize = '3.5rem';
    floater.style.pointerEvents = 'none';
    floater.style.textShadow = value > 0 ? `0 0 20px ${colorStr}, 0 4px 8px rgba(0,0,0,0.8)` : `0 0 20px #dc2626, 0 4px 8px rgba(0,0,0,0.8)`;
    floater.style.transform = 'translate(-50%, -50%) scale(0.3)';
    floater.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s linear';
    floater.style.zIndex = '100';
    floater.style.opacity = '1';
    
    wrapper.appendChild(floater);
    
    // Force CSS evaluation break 
    void floater.offsetWidth;
    
    // Shoot up to atmosphere quickly
    floater.style.transform = 'translate(-50%, -150px) scale(1.5)';
    floater.style.opacity = '0';
    
    setTimeout(() => {
        if(floater.parentNode) floater.parentNode.removeChild(floater);
    }, 600);
}

// ===================================
// GAME LOGIC
// ===================================
function popBalloon(b) {
    b.dead = true;
    
    const colorList = [
        '#94a3b8', '#fb923c', '#facc15', '#a3e635', '#4ade80', 
        '#2dd4bf', '#38bdf8', '#60a5fa', '#818cf8', '#a855f7'
    ];
    let colorStr = colorList[(Math.abs(b.value) - 1) % 10] || "#3b82f6";

    createBurstParticles(b.mesh.position, colorStr, b.value);
    scene.remove(b.mesh);
    
    if(b.value < 0) sounds.drop(); // Bad pop sound
    else if(b.value <= 3) sounds.pop1();
    else if(b.value <= 7) sounds.pop5();
    else sounds.pop10();

    score += b.value;
    updateHUD();
    
    // Win check
    if (score >= targetScore && timeLeft > 0) {
        winGame();
    }
}

function onPointerDown(e) {
    if (gameState !== 'PLAY') return;
    
    const wrapper = document.getElementById('game-wrapper');
    if(!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    
    let cx = e.clientX || (e.touches && e.touches[0].clientX);
    let cy = e.clientY || (e.touches && e.touches[0].clientY);
    
    mouse.x = ((cx - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((cy - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const activeMeshes = balloons.filter(b => !b.dead).map(b => b.mesh);
    const intersects = raycaster.intersectObjects(activeMeshes);
    
    if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const b = balloons.find(b => b.mesh === hitMesh);
        if (b) {
            popBalloon(b);
        }
    } else {
        // Miss constraint (Feature Removed)
    }
}

function updateHUD() {
    ui.score.innerText = score;
    ui.target.innerText = targetScore;
    ui.time.innerText = Math.max(0, Math.ceil(timeLeft));
    ui.level.innerText = level;
}

function startGame() {
    if(!gameStartedFlag) {
        gameStartTime = Date.now();
        gameRecordTime = Date.now();
        gameStartedFlag = true;
    }

    score = 0;
    // Scales dynamically by adding +2 per level, clamped at 120s ceiling 
    timeLeft = 60 + Math.min(60, (level - 1) * 2);
    targetScore = 50 + (level - 1) * 20;
    
    balloons.forEach(b => scene.remove(b.mesh));
    balloons = [];
    
   ui.startScreen.classList.add('hidden');
    ui.gameOverScreen.classList.add('hidden');
    document.getElementById('next-level-btn').classList.add('hidden');
    document.getElementById('restart-btn').classList.remove('hidden');
    
    updateHUD();
    gameState = 'PLAY';
    lastFrameTime = performance.now();

}

function nextLevel() {
    level++;
    startGame();
}

function gameOver() {
    gameState = 'OVER';
    sounds.gameOver();
    
    ui.resultTitle.innerText = "TIME'S UP!";
    ui.resultTitle.style.color = "#f43f5e";
    ui.resultDesc.innerHTML = `You reached <span style="color:#00e5ff">${score}</span>, but needed <span style="color:#ffeb3b">${targetScore}</span>!`;
    
    document.getElementById('restart-btn').classList.remove('hidden');
    document.getElementById('next-level-btn').classList.add('hidden');
    ui.gameOverScreen.classList.remove('hidden');
}

function winGame() {
    gameState = 'OVER';
    sounds.win();
    
    ui.resultTitle.innerText = "CONGRATULATIONS! 🎉";
    ui.resultTitle.style.color = "#00e5ff";
    ui.resultDesc.innerHTML = `You crushed the target score of <span style="color:#ffeb3b">${targetScore}</span>!`;
    
    document.getElementById('next-level-btn').classList.remove('hidden');
    document.getElementById('restart-btn').classList.add('hidden');
    ui.gameOverScreen.classList.remove('hidden');
    
     const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
    if (seconds > (window.PMG_TICK_RATE || 60)) {
            // Playmix System Layout Sync Trigger (for ad refreshing)
            if (typeof syncPMGLayout === 'function') syncPMGLayout();
            gameRecordTime = Date.now(); 
    }
    
}

// ===================================
// MAIN LOOP
// ===================================
function animate() {
    requestAnimationFrame(animate);
    
    const now = performance.now();
    const dt = (now - lastFrameTime) / 1000;
    lastFrameTime = now;
    
    if (gameState === 'PLAY') {
        timeLeft -= dt;
        
        // Spawn Spawner
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            spawnBalloon();
            spawnTimer = spawnRate;
        }
        
        // Physics & Balloon Movement
        for (let i = balloons.length - 1; i >= 0; i--) {
            let b = balloons[i];
            if (b.dead) {
                balloons.splice(i, 1);
                continue;
            }
            
            b.timeAlive += dt;
            b.mesh.position.y -= b.speedY * (dt * 60);
            
            // Sway logic
            b.mesh.position.x = b.baseX + Math.sin(b.timeAlive * b.swaySpeed) * b.swayAmount * 10;
            
            // Rotation for realism
            b.mesh.rotation.y += b.swayAmount * dt;
            b.mesh.rotation.z = Math.sin(b.timeAlive * b.swaySpeed) * 0.1;
            
            // Boundary Fail (Hit Ground)
            if (b.mesh.position.y < -12) {
                b.dead = true;
                scene.remove(b.mesh);
                balloons.splice(i, 1);
                
               // sounds.drop();
            }
        }
        
        // Timer display precision update
        if (Math.floor(timeLeft * 10) % 2 === 0) {
            ui.time.innerText = Math.max(0, Math.ceil(timeLeft));
        }
        
        // Time Over Check
        if (timeLeft <= 0 && score < targetScore) {
            gameOver();
        }
    }
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Bootstrapper
init();