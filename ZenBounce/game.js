// --- Matter.js Aliases ---
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Events = Matter.Events,
      Vector = Matter.Vector;

// --- Game State & Elements ---
const canvas = document.getElementById('game-canvas');
const wrapper = document.getElementById('game-wrapper');
const levelIndicator = document.getElementById('level-indicator');
const hintText = document.getElementById('hint-text');
const messageOverlay = document.getElementById('message-overlay');
const messageTitle = document.getElementById('message-title');
const gameOverScreen = document.getElementById('game-over-screen');
const restartBtn = document.getElementById('restart-btn');

let engine, render, runner;
let ball = null;
let targets = [];
let obstacles = [];
let isDragging = false;
let dragStart = null;
let hasShot = false;
let currentLevel = 0;
let targetsHit = 0;

// Colors
const COLOR_BG = '#222222';
const COLOR_TARGET = '#ffffff';
const COLOR_TARGET_HIT = '#4facfe';
const COLOR_OBSTACLE = '#444444';
const COLOR_BALL = '#ff453a';

// Audio Context
let audioCtx = null;
const notes = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    349.23, // F4
    392.00, // G4
    440.00, // A4
    493.88, // B4
    523.25  // C5
];

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playNote(noteIndex) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = notes[noteIndex % notes.length];
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1);
    osc.stop(audioCtx.currentTime + 1);
}

// --- Level Design ---
// Coords are percentages (0 to 100) to allow responsive resizing
// type: 'target' or 'obstacle'
const levels = [
    // Level 1: Simple straight bounce
    {
        ballStart: { x: 50, y: 80 },
        entities: [
            { type: 'target', x: 50, y: 20, w: 20, h: 5, angle: 0 }
        ]
    },
    // Level 2: Angle bounce
    {
        ballStart: { x: 20, y: 80 },
        entities: [
            { type: 'target', x: 80, y: 40, w: 5, h: 20, angle: 0 },
            { type: 'obstacle', x: 50, y: 10, w: 40, h: 5, angle: 0 }
        ]
    },
    // Level 3: Multiple targets
    {
        ballStart: { x: 50, y: 80 },
        entities: [
            { type: 'target', x: 20, y: 40, w: 5, h: 20, angle: 0 },
            { type: 'target', x: 80, y: 40, w: 5, h: 20, angle: 0 },
            { type: 'obstacle', x: 50, y: 10, w: 30, h: 5, angle: 0 }
        ]
    },
    // Level 4: Bounce off obstacle
    {
        ballStart: { x: 50, y: 90 },
        entities: [
            { type: 'target', x: 20, y: 50, w: 5, h: 20, angle: 0 },
            { type: 'obstacle', x: 50, y: 50, w: 20, h: 5, angle: -Math.PI / 4 }
        ]
    },
    // Level 5: The box
    {
        ballStart: { x: 50, y: 50 },
        entities: [
            { type: 'target', x: 20, y: 20, w: 5, h: 10, angle: 0 },
            { type: 'target', x: 80, y: 20, w: 5, h: 10, angle: 0 },
            { type: 'target', x: 20, y: 80, w: 5, h: 10, angle: 0 },
            { type: 'target', x: 80, y: 80, w: 5, h: 10, angle: 0 },
            { type: 'obstacle', x: 50, y: 10, w: 80, h: 5, angle: 0 },
            { type: 'obstacle', x: 50, y: 90, w: 80, h: 5, angle: 0 },
            { type: 'obstacle', x: 10, y: 50, w: 5, h: 80, angle: 0 },
            { type: 'obstacle', x: 90, y: 50, w: 5, h: 80, angle: 0 },
        ]
    }
];

// --- Initialization ---
function init() {
    engine = Engine.create();
    engine.world.gravity.y = 0; // Top-down view, no gravity

    // Get wrapper dimensions
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;

    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false,
            background: COLOR_BG,
            pixelRatio: window.devicePixelRatio
        }
    });

    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);

    setupInput();
    setupCollisions();
    
    // Override render to draw trajectory and text
    const originalRender = Render.world;
    Render.world = function(render) {
        originalRender(render);
        const ctx = render.context;
        
        // Draw text on targets
        targets.forEach(t => {
            if (!t.hit) {
                ctx.font = "bold 14px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
                ctx.fillStyle = "#222222"; // Dark color for contrast against white target
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.save();
                ctx.translate(t.position.x, t.position.y);
                ctx.rotate(t.angle);
                // Only draw text if the target is wide/tall enough
                const w = t.bounds.max.x - t.bounds.min.x;
                const h = t.bounds.max.y - t.bounds.min.y;
                if (w > 40 || h > 40) {
                    ctx.fillText("HIT", 0, 0);
                }
                ctx.restore();
            }
        });
        
        obstacles.forEach(o => {
            ctx.font = "bold 12px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
            ctx.fillStyle = "#888888";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.save();
            ctx.translate(o.position.x, o.position.y);
            ctx.rotate(o.angle);
            const w = o.bounds.max.x - o.bounds.min.x;
            const h = o.bounds.max.y - o.bounds.min.y;
            if (w > 40 || h > 40) {
                ctx.fillText("WALL", 0, 0);
            }
            ctx.restore();
        });

        if (isDragging && dragStart && !hasShot) {
            drawTrajectory(ctx);
        }
    };

    loadLevel(currentLevel);

    window.addEventListener('resize', () => {
        render.canvas.width = wrapper.clientWidth;
        render.canvas.height = wrapper.clientHeight;
        render.options.width = wrapper.clientWidth;
        render.options.height = wrapper.clientHeight;
        loadLevel(currentLevel); // Reload level to reposition based on new %
    });
    
    restartBtn.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        currentLevel = 0;
        loadLevel(currentLevel);
    });
}

function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        gameOverScreen.classList.remove('hidden');
        return;
    }

    World.clear(engine.world);
    Engine.clear(engine);
    
    const levelData = levels[levelIndex];
    const width = render.options.width;
    const height = render.options.height;
    
    targets = [];
    obstacles = [];
    targetsHit = 0;
    hasShot = false;
    isDragging = false;
    
    levelIndicator.innerText = `LEVEL ${levelIndex + 1}`;
    hintText.style.display = 'block';

    // Create Ball
    const bx = (levelData.ballStart.x / 100) * width;
    const by = (levelData.ballStart.y / 100) * height;
    
    ball = Bodies.circle(bx, by, 10, {
        restitution: 1.0,  // Perfectly bouncy
        friction: 0,
        frictionAir: 0,
        frictionStatic: 0,
        inertia: Infinity, // Don't spin
        render: { fillStyle: COLOR_BALL }
    });
    ball.label = 'ball';
    World.add(engine.world, ball);

    // Create Entities
    levelData.entities.forEach(ent => {
        const x = (ent.x / 100) * width;
        const y = (ent.y / 100) * height;
        const w = (ent.w / 100) * width;
        const h = (ent.h / 100) * height;
        
        const body = Bodies.rectangle(x, y, w, h, {
            isStatic: true,
            angle: ent.angle || 0,
            restitution: 1.0,
            friction: 0,
            render: {
                fillStyle: ent.type === 'target' ? COLOR_TARGET : COLOR_OBSTACLE
            }
        });
        
        body.label = ent.type;
        body.hit = false;
        
        if (ent.type === 'target') {
            targets.push(body);
        } else {
            obstacles.push(body);
        }
        
        World.add(engine.world, body);
    });
    
    // Add Game Loop Check
    Events.on(engine, 'beforeUpdate', checkGameState);
}

// --- Input & Shooting ---
let mousePos = { x: 0, y: 0 };

function setupInput() {
    // Mouse
    wrapper.addEventListener('mousedown', onPointerDown);
    wrapper.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    
    // Touch
    wrapper.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        onPointerDown({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });
    wrapper.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        onPointerMove({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });
    window.addEventListener('touchend', onPointerUp);
}

function onPointerDown(e) {
    if (hasShot || gameOverScreen.classList.contains('hidden') === false) return;
    initAudio();
    isDragging = true;
    const rect = wrapper.getBoundingClientRect();
    dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    hintText.style.display = 'none';
}

function onPointerMove(e) {
    if (!isDragging) return;
    const rect = wrapper.getBoundingClientRect();
    mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onPointerUp(e) {
    if (!isDragging || hasShot) return;
    isDragging = false;
    
    const dx = dragStart.x - mousePos.x;
    const dy = dragStart.y - mousePos.y;
    
    // Require a minimum drag distance to shoot
    if (Math.hypot(dx, dy) < 10) return;

    // Apply force opposite to drag direction
    const forceMagnitude = 0.005; // Adjust for speed
    
    // Normalize and scale
    const angle = Math.atan2(dy, dx);
    const force = {
        x: Math.cos(angle) * forceMagnitude,
        y: Math.sin(angle) * forceMagnitude
    };
    
    Body.applyForce(ball, ball.position, force);
    hasShot = true;
}

function drawTrajectory(ctx) {
    const dx = dragStart.x - mousePos.x;
    const dy = dragStart.y - mousePos.y;
    
    if (Math.hypot(dx, dy) < 10) return;
    
    const angle = Math.atan2(dy, dx);
    const length = Math.min(Math.hypot(dx, dy) * 2, 300); // Visual length capping
    
    ctx.beginPath();
    ctx.moveTo(ball.position.x, ball.position.y);
    ctx.lineTo(
        ball.position.x + Math.cos(angle) * length,
        ball.position.y + Math.sin(angle) * length
    );
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
}

// --- Collisions & Game Logic ---
function setupCollisions() {
    Events.on(engine, 'collisionStart', (event) => {
        const pairs = event.pairs;
        
        for (let i = 0; i < pairs.length; i++) {
            const bodyA = pairs[i].bodyA;
            const bodyB = pairs[i].bodyB;
            
            // Check if ball hit a target
            if (bodyA.label === 'ball' && bodyB.label === 'target') {
                hitTarget(bodyB);
            } else if (bodyB.label === 'ball' && bodyA.label === 'target') {
                hitTarget(bodyA);
            }
        }
    });
}

function hitTarget(targetBody) {
    if (targetBody.hit) return; // Already hit
    
    targetBody.hit = true;
    targetBody.render.fillStyle = COLOR_TARGET_HIT;
    targetsHit++;
    
    playNote(targetsHit - 1);
}

function checkGameState() {
    if (!hasShot) return;
    
    const width = render.options.width;
    const height = render.options.height;
    const margin = 50; // allow it to go slightly off screen before resetting
    
    // Check if ball is completely off screen
    if (ball.position.x < -margin || ball.position.x > width + margin ||
        ball.position.y < -margin || ball.position.y > height + margin) {
        
        Events.off(engine, 'beforeUpdate', checkGameState);
        
        if (targetsHit === targets.length) {
            // Level cleared
            showMessage("CLEARED!", COLOR_TARGET_HIT);
            setTimeout(() => {
                currentLevel++;
                loadLevel(currentLevel);
            }, 1500);
        } else {
            // Failed
            showMessage("TRY AGAIN", COLOR_BALL);
            setTimeout(() => {
                loadLevel(currentLevel);
            }, 1000);
        }
    }
}

function showMessage(text, color) {
    messageTitle.innerText = text;
    messageTitle.style.color = color;
    messageOverlay.classList.remove('hidden');
    
    setTimeout(() => {
        messageOverlay.classList.add('hidden');
    }, 1000);
}

// Start Game
init();
