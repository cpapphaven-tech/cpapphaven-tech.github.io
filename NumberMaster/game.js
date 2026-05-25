const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

// DOM Elements
const hudLevel = document.getElementById('level-num');
const hudNumber = document.getElementById('current-number-display');
const hudTarget = document.getElementById('target-display');
const startMenu = document.getElementById('start-menu');
const gameOverMenu = document.getElementById('game-over');
const levelCompleteMenu = document.getElementById('level-complete');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const nextLevelBtn = document.getElementById('next-level-btn');
const resultScore = document.getElementById('result-score');
const resultReason = document.getElementById('result-reason');
const lcScore = document.getElementById('lc-score');
const lcPlayerValue = document.getElementById('lc-player-value');
const lcTitle = document.getElementById('lc-title');

// Game State
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER, LEVELCOMPLETE
let level = 1;
let score = 0;
let targetValue = 0;
let animationFrameId;
let lastTime = 0;

// Camera / Scrolling
let scrollY = 0;
let scrollSpeed = 300;

function getDifficultyMultiplier() {
    // First 10 levels are easier - ramp up from 0.5 to 1.0
    if (level <= 10) {
        return 0.5 + (level - 1) * 0.055; // 0.5 → 1.0 over 10 levels
    }
    return 1.0;
}

// Player
const player = {
    x: 0,
    y: 0,
    targetX: 0,
    radius: 20,
    value: 1,
    color: '#3b82f6', // Blue
    isDead: false
};

// Entities
let entities = [];
let particles = [];

// Input handling
let isDragging = false;
let previousTouchX = 0;

function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    if (gameState === 'MENU') {
        player.x = canvas.width / 2;
        player.targetX = player.x;
        player.y = canvas.height * 0.75;
    }
}

window.addEventListener('resize', resize);

// Input Events
canvas.addEventListener('pointerdown', (e) => {
    if (gameState !== 'PLAYING') return;
    isDragging = true;
    previousTouchX = e.clientX;
});

window.addEventListener('pointermove', (e) => {
    if (gameState !== 'PLAYING' || !isDragging) return;
    const deltaX = e.clientX - previousTouchX;
    player.targetX += deltaX * 1.5; // Sensitivity
    
    // Clamp to screen bounds
    player.targetX = Math.max(player.radius, Math.min(canvas.width - player.radius, player.targetX));
    previousTouchX = e.clientX;
});

window.addEventListener('pointerup', () => {
    isDragging = false;
});

window.addEventListener('pointercancel', () => {
    isDragging = false;
});

// Entity Classes
class Entity {
    constructor(x, y, value, type, isThreat = false) {
        this.x = x;
        this.y = y; // World Y position
        this.value = value;
        this.type = type; // 'number', 'saw', 'wall', 'minus'
        this.radius = 20 + Math.min(20, Math.log10(value || 1) * 5); // Grow slightly with value
        this.width = canvas.width;
        this.height = 40;
        this.markedForDeletion = false;
        this.collected = false;
        this.isThreat = isThreat; // Red numbers stay red forever
    }

    draw(ctx, screenY) {
        if (this.type === 'number') {
            ctx.beginPath();
            ctx.arc(this.x, screenY, this.radius, 0, Math.PI * 2);
            
            // Threat numbers are always red, safe numbers are always green
            if (this.isThreat) {
                ctx.fillStyle = '#ef4444'; // Red (always dangerous)
            } else {
                ctx.fillStyle = '#10b981'; // Green (always safe)
            }
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = `bold ${this.radius * 0.8}px Outfit`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.value, this.x, screenY);
        } else if (this.type === 'saw') {
            // Draw a spinning saw
            ctx.save();
            ctx.translate(this.x, screenY);
            ctx.rotate(lastTime / 200);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#64748b'; // Gray
            ctx.fill();
            
            // Saw teeth
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this.radius + 5, -5);
                ctx.lineTo(this.radius + 5, 5);
                ctx.closePath();
                ctx.fillStyle = '#94a3b8';
                ctx.fill();
                ctx.rotate(Math.PI / 4);
            }
            
            // Inner circle
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#334155';
            ctx.fill();
            ctx.restore();
        } else if (this.type === 'minus') {
            ctx.beginPath();
            ctx.arc(this.x, screenY, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#8b5cf6'; // Purple
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Minus sign
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${this.radius * 0.8}px Outfit`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`-${this.value}`, this.x, screenY);
        } else if (this.type === 'wall') {
            // Draw wall spanning width
            ctx.fillStyle = '#f59e0b'; // Orange/Yellow wall
            ctx.fillRect(0, screenY - this.height/2, this.width, this.height);
            
            // Wall value text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Outfit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`BREAK: ${this.value}`, canvas.width / 2, screenY);
        }
    }
}

class Particle {
    constructor(x, y, color, text) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.text = text;
        this.life = 1.0;
        this.velocity = { x: (Math.random() - 0.5) * 100, y: -100 - Math.random() * 100 };
    }

    update(dt) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        this.life -= dt * 1.5;
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        if (this.text) {
            ctx.fillStyle = this.color;
            ctx.font = 'bold 20px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
}


function spawnLevel() {
    entities = [];
    scrollY = 0;
    
    const diff = getDifficultyMultiplier();
    const levelLength = Math.floor((2000 + (level * 400)) * diff);
    let spawnY = canvas.height * 0.5;
    
    // 3 lanes: left, center, right
    const lanes = [
        canvas.width * 0.25,
        canvas.width * 0.5,
        canvas.width * 0.75
    ];
    
    // Track how much value the player will need for walls
    const targetWallValue = 5 + level * 3;
    let totalCollectedValue = 0; // Used as guide
    let goodNumberVal = 1;
    
    // How many good number rows to spawn
    const goodRowsNeeded = Math.ceil(targetWallValue / 2);
    const totalRows = goodRowsNeeded + 3 + Math.floor(level * 0.5);
    
    for (let row = 0; row < totalRows; row++) {
        spawnY -= 200 + Math.random() * 100; // reasonable spacing (200-300px)
        
        const shuffled = [...lanes].sort(() => Math.random() - 0.5);
        
        // Each row: 1-2 good numbers (or equal to player value) + optional threat
        const numGood = 1 + Math.floor(Math.random() * 2); // 1 or 2
        
        // Good numbers are always <= what player should have by now
        // Early rows give small numbers, later rows give larger ones
        goodNumberVal = Math.max(1, Math.floor(1 + (row / goodRowsNeeded) * 3));
        
        for (let i = 0; i < numGood; i++) {
            const val = 1 + Math.floor(Math.random() * goodNumberVal);
            entities.push(new Entity(shuffled[i], spawnY, val, 'number'));
            totalCollectedValue += val;
        }
        
        const freeLane = shuffled[numGood % 3]; // Next available lane
        
        // Determine threat
        const r = Math.random();
        if (row < 3) {
            // First 3 rows: only good numbers (guaranteed starter food)
            // already did this above
        } else if (r < 0.3) {
            // Threat number - always red, always dangerous
            const threatVal = goodNumberVal * 2 + Math.floor(Math.random() * 3);
            entities.push(new Entity(freeLane, spawnY, threatVal, 'number', true));
        } else if (r < 0.5 && level > 1) {
            // Saw
            entities.push(new Entity(freeLane, spawnY, 0, 'saw'));
        } else if (r < 0.6 && level > 3) {
            // Minus
            entities.push(new Entity(freeLane, spawnY, 1 + Math.floor(Math.random() * 2), 'minus'));
        }
        // else: just the good numbers, no threat
    }
    
    // Walls at the end
    let wallY = spawnY - 200;
    targetValue = targetWallValue;
    const wallCount = level <= 5 ? 2 : (level <= 10 ? 3 : 5);
    
    // First wall is achievable: ~half of target wall value
    let wallVal = Math.max(2, Math.floor(targetWallValue * 0.4));
    for (let i = 0; i < wallCount; i++) {
        entities.push(new Entity(canvas.width / 2, wallY, wallVal, 'wall'));
        wallY -= 150;
        wallVal = Math.floor(wallVal * 1.5); // Each wall is 50% harder
    }
}

function startGame() {
    resize();
    gameState = 'PLAYING';
    score = 0;
    player.value = 1;
    player.radius = 20;
    player.isDead = false;
    player.x = canvas.width / 2;
    player.targetX = player.x;
    player.y = canvas.height * 0.75;
    
    particles = [];
    spawnLevel();
    
    startMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    levelCompleteMenu.classList.add('hidden');
    
    // Set scroll speed based on level (slower for early levels)
    scrollSpeed = level <= 5 ? 200 : (level <= 10 ? 250 : 300);
    
    updateHUD();
    hudTarget.innerText = targetValue;
    lastTime = performance.now();
    cancelAnimationFrame(animationFrameId);
    gameLoop(lastTime);
}

function updateHUD() {
    hudLevel.innerText = level;
    hudNumber.innerText = player.value;
    
    // Animate HUD pop
    hudNumber.style.transform = 'scale(1.5)';
    setTimeout(() => {
        hudNumber.style.transform = 'scale(1)';
    }, 100);
}

function gameOver(reason) {
    gameState = 'GAMEOVER';
    resultReason.innerText = reason;
    resultScore.innerText = `Score: ${score}`;
    gameOverMenu.classList.remove('hidden');
}

function levelComplete() {
    gameState = 'LEVELCOMPLETE';
    lcTitle.innerHTML = `LEVEL ${level}<br>CLEARED!`;
    lcScore.innerText = `Score: ${score}`;
    lcPlayerValue.innerText = `Final Number: ${player.value}`;
    levelCompleteMenu.classList.remove('hidden');
}

function spawnExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color, null));
    }
}

function update(dt) {
    if (gameState !== 'PLAYING') return;

    // Scroll world
    scrollY += scrollSpeed * dt;
    score += Math.floor(scrollSpeed * dt * 0.1);
    
    // Move player horizontally smoothly
    const dx = player.targetX - player.x;
    player.x += dx * 10 * dt; // Lerp
    
    // Update player radius visually based on value
    player.radius = 20 + Math.min(30, Math.log10(player.value) * 8);

    // Update entities and collisions
    for (let i = 0; i < entities.length; i++) {
        let e = entities[i];
        
        // Calculate screen position of entity
        let screenY = e.y + scrollY;
        
        // Remove if off bottom of screen
        if (screenY > canvas.height + 100) {
            e.markedForDeletion = true;
            continue;
        }

        // Collision logic
        if (!e.markedForDeletion) {
            const dist = Math.hypot(player.x - e.x, player.y - screenY);
            const hitRadius = (player.radius + e.radius) * 1.5;
            
            if (e.type === 'saw' && dist < hitRadius) {
                spawnExplosion(player.x, player.y, '#3b82f6');
                gameOver("Hit a saw!");
            } else if (e.type === 'number' && dist < hitRadius) {
                if (e.isThreat) {
                    // RED number: always penalize, even if you've grown past it
                    const lostValue = Math.floor(e.value * 0.3);
                    player.value = Math.max(1, player.value - lostValue);
                    score = Math.max(0, score - e.value * 15);
                    e.markedForDeletion = true;
                    particles.push(new Particle(e.x, screenY, '#ef4444', `-${lostValue}`));
                    particles.push(new Particle(e.x, screenY - 20, '#ef4444', `-${e.value * 15}★`));
                    updateHUD();
                } else if (player.value >= e.value) {
                    // GREEN number: safe to absorb
                    player.value += e.value;
                    score += e.value * 10;
                    e.markedForDeletion = true;
                    particles.push(new Particle(e.x, screenY, '#10b981', `+${e.value}`));
                    updateHUD();
                } else {
                    // Shouldn't happen (green numbers are always <= player value)
                    player.value += e.value;
                    score += e.value * 10;
                    e.markedForDeletion = true;
                    particles.push(new Particle(e.x, screenY, '#10b981', `+${e.value}`));
                    updateHUD();
                }
            } else if (e.type === 'minus' && dist < hitRadius) {
                // Minus number - subtracts value
                player.value = Math.max(1, player.value - e.value);
                score = Math.max(0, score - e.value * 15);
                e.markedForDeletion = true;
                particles.push(new Particle(e.x, screenY, '#ef4444', `-${e.value}`));
                updateHUD();
            } else if (e.type === 'wall') {
                // AABB / Circle collision
                if (player.y - player.radius < screenY + e.height/2 &&
                    player.y + player.radius > screenY - e.height/2) {
                    
                    if (player.value >= e.value) {
                        // Break wall
                        player.value -= e.value;
                        e.markedForDeletion = true;
                        spawnExplosion(player.x, screenY, '#f59e0b');
                        particles.push(new Particle(player.x, player.y, '#ef4444', `-${e.value}`));
                        updateHUD();
                        
                        // Check if it's the last wall
                        const remainingWalls = entities.filter(ent => ent.type === 'wall' && !ent.markedForDeletion);
                        if (remainingWalls.length === 0) {
                            levelComplete();
                        }
                    } else {
                        // Not enough value to break wall
                        spawnExplosion(player.x, player.y, '#3b82f6');
                        gameOver("Not enough value to break wall!");
                    }
                }
            }
        }
    }

    // Clean up entities
    entities = entities.filter(e => !e.markedForDeletion);
    
    // Update particles
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => p.life > 0);
    
    // Check if passed all entities and no walls (fallback win condition)
    if (entities.length === 0 && gameState === 'PLAYING') {
        levelComplete();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#0f172a'; // Background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid lines for sense of speed
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    const gridSpacing = 50;
    const offset = scrollY % gridSpacing;
    for (let y = offset; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw entities
    for (let e of entities) {
        e.draw(ctx, e.y + scrollY);
    }
    
    // Draw particles
    for (let p of particles) {
        p.draw(ctx);
    }

    // Draw Player
    if (gameState === 'PLAYING' || gameState === 'LEVELCOMPLETE') {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.fill();
        
        ctx.strokeStyle = '#60a5fa'; // lighter blue stroke
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${player.radius * 0.8}px Outfit`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.value, player.x, player.y);
    }
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // Cap dt
    lastTime = timestamp;

    update(dt);
    draw();

    if (gameState === 'PLAYING') {
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        // Draw one last frame for GAMEOVER/LEVELCOMPLETE
        draw();
    }
}

// Button listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
nextLevelBtn.addEventListener('click', () => {
    level++;
    startGame();
});

// Initial Setup
resize();
draw(); // Draw initial static screen
