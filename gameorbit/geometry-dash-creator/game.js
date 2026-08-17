const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

// DOM Elements
const hudLevel = document.getElementById('level-num');
const hudBest = document.getElementById('best-score-display');
const progressBar = document.getElementById('progress-bar-fill');
const progressText = document.getElementById('progress-text');
const startMenu = document.getElementById('start-menu');
const gameOverMenu = document.getElementById('game-over');
const levelCompleteMenu = document.getElementById('level-complete');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const nextLevelBtn = document.getElementById('next-level-btn');
const crashProgress = document.getElementById('crash-progress');
const resultReason = document.getElementById('result-reason');
const lcTitle = document.getElementById('lc-title');

// Game Settings
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER, LEVELCOMPLETE
let level = 1;
let bestProgress = {}; // Level -> % progress
let animationFrameId;
let lastTime = 0;

// World & Speed
let worldX = 0;
let levelLength = 5000; // world units
let speed = 350;        // world scroll speed
let gravity = 1800;     // px/s^2
let groundY = 0;        // Set on resize
let cameraShake = 0;

// Web Audio API Sound Synthesizer
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'jump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'crash') {
        // Noise explosion
        const bufferSize = audioCtx.sampleRate * 0.4;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        
        noise.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noise.start(now);
        noise.stop(now + 0.4);
    } else if (type === 'complete') {
        // Fanfare arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
        notes.forEach((freq, idx) => {
            const noteOsc = audioCtx.createOscillator();
            const noteGain = audioCtx.createGain();
            noteOsc.connect(noteGain);
            noteGain.connect(audioCtx.destination);
            
            noteOsc.type = 'sine';
            noteOsc.frequency.setValueAtTime(freq, now + idx * 0.1);
            noteGain.gain.setValueAtTime(0.12, now + idx * 0.1);
            noteGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
            
            noteOsc.start(now + idx * 0.1);
            noteOsc.stop(now + idx * 0.1 + 0.35);
        });
    }
}

// Player (neon cube)
const player = {
    x: 0, // Visual X offset (static)
    y: 0,
    vy: 0,
    width: 30,
    height: 30,
    color: '#06b6d4', // Cyan
    isGrounded: true,
    rotation: 0,
    jumpTimer: 0,
    isDead: false
};

// Controls
let isTapping = false;

// Entities (Obstacles)
let obstacles = [];
let particles = [];
let trail = [];

// Deterministic Random Generator for levels consistency
let seed = 1;
function seededRandom() {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Spawns obstacles procedurally based on level
function generateLevel() {
    obstacles = [];
    particles = [];
    trail = [];
    
    seed = level * 133.7; // unique seed per level
    levelLength = 3500 + level * 1000; // level gets longer
    speed = 320 + level * 20; // speed gets slightly faster
    
    let spawnWorldX = 500; // Starting safe zone
    
    while (spawnWorldX < levelLength - 400) {
        const rand = seededRandom();
        
        if (rand < 0.35) {
            // Single Spikes
            obstacles.push({
                x: spawnWorldX,
                y: 0,
                width: 26,
                height: 28,
                type: 'spike'
            });
            spawnWorldX += 300 + seededRandom() * 250;
        } else if (rand < 0.55) {
            // Double Spikes
            obstacles.push({ x: spawnWorldX, y: 0, width: 24, height: 26, type: 'spike' });
            obstacles.push({ x: spawnWorldX + 22, y: 0, width: 24, height: 26, type: 'spike' });
            spawnWorldX += 350 + seededRandom() * 250;
        } else if (rand < 0.75) {
            // Single block to jump on
            const blockH = 32;
            obstacles.push({
                x: spawnWorldX,
                y: 0,
                width: 32,
                height: blockH,
                type: 'block'
            });
            
            // Spike right after the block or on top of it
            if (seededRandom() < 0.5) {
                obstacles.push({
                    x: spawnWorldX + 6,
                    y: blockH,
                    width: 20,
                    height: 22,
                    type: 'spike'
                });
            }
            spawnWorldX += 320 + seededRandom() * 200;
        } else {
            // Step structures: block and higher block
            obstacles.push({ x: spawnWorldX, y: 0, width: 32, height: 32, type: 'block' });
            obstacles.push({ x: spawnWorldX + 32, y: 0, width: 32, height: 64, type: 'block' });
            
            if (seededRandom() < 0.6) {
                obstacles.push({ x: spawnWorldX + 90, y: 0, width: 24, height: 26, type: 'spike' });
            }
            spawnWorldX += 450 + seededRandom() * 250;
        }
    }
}

// Particle bursts
function createExplosion(x, y, color) {
    playSound('crash');
    cameraShake = 15;
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 400,
            vy: (Math.random() - 0.7) * 450,
            size: 2 + Math.random() * 4,
            color: color,
            alpha: 1.0,
            life: 0.6 + Math.random() * 0.4
        });
    }
}

function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    groundY = canvas.height * 0.75;
    player.x = canvas.width * 0.25;
}

window.addEventListener('resize', resize);

// Input handlers
function jumpPress() {
    initAudio();
    isTapping = true;
}

function jumpRelease() {
    isTapping = false;
}

canvas.addEventListener('pointerdown', jumpPress);
window.addEventListener('pointerup', jumpRelease);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jumpPress(); }, { passive: false });
canvas.addEventListener('touchend', jumpRelease);
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        jumpPress();
    }
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        jumpRelease();
    }
});

function startGame() {
    resize();
    gameState = 'PLAYING';
    worldX = 0;
    cameraShake = 0;
    
    player.y = groundY - player.height;
    player.vy = 0;
    player.rotation = 0;
    player.isGrounded = true;
    player.isDead = false;
    
    generateLevel();
    
    startMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    levelCompleteMenu.classList.add('hidden');
    
    updateHUD();
    
    lastTime = performance.now();
    cancelAnimationFrame(animationFrameId);
    gameLoop(lastTime);
}

function updateHUD() {
    hudLevel.innerText = level;
    const best = bestProgress[level] || 0;
    hudBest.innerText = `${best}%`;
}

function triggerGameOver() {
    gameState = 'GAMEOVER';
    player.isDead = true;
    
    const progress = Math.min(99, Math.floor((worldX / levelLength) * 100));
    bestProgress[level] = Math.max(bestProgress[level] || 0, progress);
    
    crashProgress.innerText = `${progress}%`;
    gameOverMenu.classList.remove('hidden');
    updateHUD();
}

function triggerLevelComplete() {
    gameState = 'LEVELCOMPLETE';
    playSound('complete');
    
    bestProgress[level] = 100;
    lcTitle.innerHTML = `LEVEL ${level}<br>CLEARED!`;
    levelCompleteMenu.classList.remove('hidden');
    updateHUD();
}

// AABB Collision utility
function intersects(r1, r2) {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.height > r2.y;
}

// Update game calculations
function update(dt) {
    if (gameState !== 'PLAYING') return;

    if (cameraShake > 0) cameraShake -= dt * 30;

    // Scroll forward
    worldX += speed * dt;
    
    // Check win condition
    if (worldX >= levelLength) {
        triggerLevelComplete();
        return;
    }

    // Apply player physics
    // Jump mechanics (support continuous hold jumping)
    if (isTapping && player.isGrounded) {
        player.vy = -600;
        player.isGrounded = false;
        playSound('jump');
    }

    // Apply gravity
    player.vy += gravity * dt;
    player.y += player.vy * dt;
    
    // Rotation logic: continuous spin when airborne, snap to 90 degrees on ground
    if (!player.isGrounded) {
        player.rotation += 350 * dt; // spin speed
    } else {
        // Snap rotation smoothly to nearest 90-degree block (Math.PI / 2)
        const snapTarget = Math.round(player.rotation / 90) * 90;
        player.rotation += (snapTarget - player.rotation) * 15 * dt;
    }

    // Floor collision
    if (player.y >= groundY - player.height) {
        player.y = groundY - player.height;
        player.vy = 0;
        player.isGrounded = true;
    }

    // Manage neon trails
    if (!player.isDead) {
        trail.push({ x: player.x + player.width/2, y: player.y + player.height/2 });
        if (trail.length > 15) trail.shift();
    }

    // Obstacles collisions & update
    const playerRect = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height
    };

    let landedOnBlock = false;

    for (let obs of obstacles) {
        // Screen X position of obstacle
        const obsScreenX = obs.x - worldX + player.x;
        
        if (obsScreenX > canvas.width + 100 || obsScreenX < -100) continue;
        
        const obsRect = {
            x: obsScreenX,
            y: groundY - obs.y - obs.height,
            width: obs.width,
            height: obs.height
        };

        if (intersects(playerRect, obsRect)) {
            if (obs.type === 'spike') {
                // Spikes kill instantly
                createExplosion(player.x + player.width/2, player.y + player.height/2, player.color);
                triggerGameOver();
                return;
            } else if (obs.type === 'block') {
                // Landing on block top or crashing into side
                const pBottom = playerRect.y + playerRect.height;
                const oTop = obsRect.y;
                
                // Allow a small vertical threshold to register landing rather than side crash
                if (pBottom - player.vy * dt <= oTop + 8 && player.vy >= 0) {
                    player.y = obsRect.y - player.height;
                    player.vy = 0;
                    player.isGrounded = true;
                    landedOnBlock = true;
                } else {
                    // Crashing into block side
                    createExplosion(player.x + player.width/2, player.y + player.height/2, player.color);
                    triggerGameOver();
                    return;
                }
            }
        }
    }

    if (!landedOnBlock && player.y < groundY - player.height && player.vy === 0) {
        // Walked off a platform block
        player.isGrounded = false;
    }

    // Update particles
    for (let p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 800 * dt; // gravity
        p.life -= dt;
        p.alpha = Math.max(0, p.life);
    }
    particles = particles.filter(p => p.life > 0);

    // Update HUD progress bar
    const progress = Math.min(100, Math.floor((worldX / levelLength) * 100));
    progressBar.style.width = `${progress}%`;
    progressText.innerText = `${progress}%`;
}

// Render loop
function draw() {
    ctx.save();
    
    // Camera shake displacement
    if (cameraShake > 0) {
        const dx = (Math.random() - 0.5) * cameraShake;
        const dy = (Math.random() - 0.5) * cameraShake;
        ctx.translate(dx, dy);
    }

    // Clear Canvas
    ctx.fillStyle = '#090a0f'; // Dark spatial base
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines moving backwards
    ctx.strokeStyle = '#1e1b4b'; // Subtle dark indigo
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    const scrollOffset = -(worldX % gridSpacing);
    
    for (let x = scrollOffset; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, groundY);
        ctx.stroke();
    }
    for (let y = 0; y < groundY; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw visual neon trail
    if (trail.length > 1) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.stroke();
    }

    // Draw neon floor line
    ctx.strokeStyle = '#a855f7'; // Neon purple
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadows

    // Floor fill
    ctx.fillStyle = '#040508';
    ctx.fillRect(0, groundY + 2, canvas.width, canvas.height - groundY - 2);

    // Draw obstacles (Spikes, Blocks)
    for (let obs of obstacles) {
        const obsScreenX = obs.x - worldX + player.x;
        
        // Skip rendering if off-screen
        if (obsScreenX > canvas.width + 50 || obsScreenX < -50) continue;
        
        const obsScreenY = groundY - obs.y - obs.height;
        
        if (obs.type === 'spike') {
            // Spikes (glowing red triangles)
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ef4444';
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(obsScreenX, obsScreenY + obs.height);
            ctx.lineTo(obsScreenX + obs.width / 2, obsScreenY);
            ctx.lineTo(obsScreenX + obs.width, obsScreenY + obs.height);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0; // reset
            
            // Inner spike details
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.moveTo(obsScreenX + 4, obsScreenY + obs.height);
            ctx.lineTo(obsScreenX + obs.width / 2, obsScreenY + 6);
            ctx.lineTo(obsScreenX + obs.width - 4, obsScreenY + obs.height);
            ctx.closePath();
            ctx.fill();
            
        } else if (obs.type === 'block') {
            // Solid block (neon border)
            ctx.fillStyle = '#111827';
            ctx.fillRect(obsScreenX, obsScreenY, obs.width, obs.height);
            
            ctx.strokeStyle = '#a855f7'; // Purple neon borders
            ctx.lineWidth = 2;
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#a855f7';
            ctx.strokeRect(obsScreenX, obsScreenY, obs.width, obs.height);
            ctx.shadowBlur = 0;
            
            // Diagonal decoration
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
            ctx.beginPath();
            ctx.moveTo(obsScreenX + 4, obsScreenY + 4);
            ctx.lineTo(obsScreenX + obs.width - 4, obsScreenY + obs.height - 4);
            ctx.stroke();
        }
    }

    // Draw particles
    for (let p of particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        ctx.restore();
    }

    // Draw Player cube
    if (gameState === 'PLAYING' && !player.isDead) {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.rotate((player.rotation * Math.PI) / 180);
        
        // Cube body fill
        ctx.fillStyle = player.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = player.color;
        ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
        ctx.shadowBlur = 0;
        
        // White border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-player.width / 2, -player.height / 2, player.width, player.height);
        
        // Inner face details
        ctx.fillStyle = '#0f172a';
        // Left Eye
        ctx.fillRect(-player.width*0.3, -player.height*0.25, player.width*0.18, player.height*0.18);
        // Right Eye
        ctx.fillRect(player.width*0.12, -player.height*0.25, player.width*0.18, player.height*0.18);
        // Mouth
        ctx.fillRect(-player.width*0.2, player.width*0.15, player.width*0.4, player.height*0.1);
        
        ctx.restore();
    }

    ctx.restore();
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    draw();

    if (gameState === 'PLAYING') {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Button Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
nextLevelBtn.addEventListener('click', () => {
    level++;
    startGame();
});

// Setup Initial State
resize();
draw();
updateHUD();
