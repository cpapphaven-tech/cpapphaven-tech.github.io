/* =========================================
   Knife Hit: Target Throw Arcade
   Core Game Engine (Target Tap & Smooth flight)
   ========================================= */

// Game Configuration & State
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const logX = 240;
const logY = 180;
const logRadius = 75;
const knifeLength = 60;
const minAngleOverlap = 0.18; // ~10.3 degrees
const appleHitTolerance = 0.25; // ~14.3 degrees

let gameState = 'start'; // 'start', 'playing', 'complete', 'gameover', 'shattering'
let stage = 1;
let score = 0;
let knivesLeft = 0;
let knivesTarget = 0;
let frameIndex = 0;

let targetRotation = 0;
let targetSpeed = 0.03;
let baseSpeed = 0.03;
let direction = 1;
let rotationType = 'normal'; // 'normal', 'pulse', 'reverse', 'jerky'

let pinnedKnives = []; // Array of { angle: Number }
let apples = []; // Array of { angle: Number, active: Boolean }

// Active Knife details for traveling flight
let activeKnife = { 
    startX: logX, 
    startY: 480, 
    targetX: logX, 
    targetY: logY + logRadius, 
    progress: 0, 
    duration: 30, // 30 frames = ~0.5 second flight travel time
    active: false,
    travelAngle: -Math.PI / 2,
    targetWorldAngle: Math.PI / 2
};

let nextKnifeY = 480;
let nextKnifeReady = true;

let particles = [];
let shatteredPieces = [];
let bouncingKnife = null;
let shakeIntensity = 0;

// Game Over counter for Ads
let gameOverCount = parseInt(localStorage.getItem('pmg_knifehit_go_count') || '0');

// Web Audio API Synthesizer
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    initAudio();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    if (type === 'throw') {
        // Whoosh sound
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'hit') {
        // Wood hit thud
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'clank') {
        // Metal clank (knife hits knife)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1000, now);
        osc1.frequency.linearRampToValueAtTime(800, now + 0.2);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1400, now);
        osc2.frequency.linearRampToValueAtTime(1100, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);
    } else if (type === 'apple') {
        // Apple slice squish
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'shatter') {
        // Log shatter
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }
}

// UI Elements
const elLevelNum = document.getElementById('header-level-num');
const elHudLevel = document.getElementById('hud-level');
const elHudKnives = document.getElementById('hud-knives');
const elHudScore = document.getElementById('hud-score');
const elOverlayStart = document.getElementById('overlay-start');
const elOverlayComplete = document.getElementById('overlay-complete');
const elOverlayGameOver = document.getElementById('overlay-gameover');
const elLcScore = document.getElementById('lc-score');
const elGoScore = document.getElementById('go-score');
const elLcNextBadge = document.getElementById('lc-next-badge');
const elStartBtn = document.getElementById('start-btn');
const elNextLevelBtn = document.getElementById('next-level-btn');
const elRetryBtn = document.getElementById('retry-btn');
const elRestartBtn = document.getElementById('restart-btn');
const elGoHomeBtn = document.getElementById('go-home-btn');
const elToast = document.getElementById('ms-toast');

// Toast feedback
function showToast(message) {
    elToast.textContent = message;
    elToast.classList.add('show');
    setTimeout(() => {
        elToast.classList.remove('show');
    }, 1800);
}

// Particle system
function triggerWoodSplash(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 2,
            color: ['#b45309', '#d97706', '#f59e0b', '#fed7aa'][Math.floor(Math.random() * 4)],
            radius: 2 + Math.random() * 4,
            alpha: 1,
            decay: 0.02 + Math.random() * 0.03,
            rotation: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.2
        });
    }
}

function triggerAppleSplash(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 4,
            color: ['#ef4444', '#f87171', '#dc2626', '#a855f7'][Math.floor(Math.random() * 4)],
            radius: 2 + Math.random() * 5,
            alpha: 1,
            decay: 0.03 + Math.random() * 0.03,
            rotation: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.3
        });
    }
}

// Setup Level Config
function setupLevel() {
    pinnedKnives = [];
    apples = [];
    activeKnife.active = false;
    bouncingKnife = null;
    shatteredPieces = [];
    particles = [];
    
    // Knives target logic
    knivesTarget = 5 + Math.min(Math.floor(stage / 2), 6); // Max 11 knives
    knivesLeft = knivesTarget;

    // Pre-pinned knives count
    let prepinnedCount = 0;
    if (stage > 1) {
        prepinnedCount = Math.min(Math.floor((stage - 1) / 2), 4);
    }

    // Distribute pre-pinned knives evenly/randomly ensuring no collisions
    for (let i = 0; i < prepinnedCount; i++) {
        let attempts = 0;
        let validAngle = false;
        let testAngle = 0;
        while (!validAngle && attempts < 100) {
            attempts++;
            testAngle = Math.random() * Math.PI * 2;
            validAngle = true;
            for (let pk of pinnedKnives) {
                let diff = Math.abs(testAngle - pk.angle) % (Math.PI * 2);
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                if (diff < 0.35) {
                    validAngle = false;
                    break;
                }
            }
        }
        if (validAngle) {
            pinnedKnives.push({ angle: testAngle });
        }
    }

    // Apples spawn logic
    let applesCount = 1;
    if (stage > 2) {
        applesCount = Math.floor(Math.random() * 3) + 1;
    }
    for (let i = 0; i < applesCount; i++) {
        let attempts = 0;
        let validAngle = false;
        let testAngle = 0;
        while (!validAngle && attempts < 100) {
            attempts++;
            testAngle = Math.random() * Math.PI * 2;
            validAngle = true;
            for (let app of apples) {
                let diff = Math.abs(testAngle - app.angle) % (Math.PI * 2);
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                if (diff < 0.45) {
                    validAngle = false;
                    break;
                }
            }
            for (let pk of pinnedKnives) {
                let diff = Math.abs(testAngle - pk.angle) % (Math.PI * 2);
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                if (diff < 0.25) {
                    validAngle = false;
                    break;
                }
            }
        }
        if (validAngle) {
            apples.push({ angle: testAngle, active: true });
        }
    }

    // Rotation style config
    const rotationModes = ['normal', 'pulse', 'reverse', 'jerky'];
    if (stage === 1) {
        rotationType = 'normal';
        baseSpeed = 0.025;
    } else if (stage === 2) {
        rotationType = 'pulse';
        baseSpeed = 0.03;
    } else if (stage === 3) {
        rotationType = 'reverse';
        baseSpeed = 0.03;
    } else {
        rotationType = rotationModes[stage % rotationModes.length];
        baseSpeed = 0.02 + Math.min(stage * 0.003, 0.025);
    }
    direction = Math.random() < 0.5 ? 1 : -1;
    targetSpeed = baseSpeed * direction;

    // Update HUD
    elLevelNum.textContent = stage;
    elHudLevel.textContent = stage;
    elHudKnives.textContent = knivesLeft;
    elHudScore.textContent = score;

    nextKnifeY = 480;
    nextKnifeReady = true;
}

// Log Shattering Logic on victory
function shatterLog() {
    playSound('shatter');
    const pieceCount = 8;
    for (let i = 0; i < pieceCount; i++) {
        let startAngle = (i * Math.PI * 2) / pieceCount;
        let endAngle = ((i + 1) * Math.PI * 2) / pieceCount;
        let midAngle = (startAngle + endAngle) / 2;
        let dist = 35;
        shatteredPieces.push({
            x: logX + Math.cos(midAngle + targetRotation) * dist,
            y: logY + Math.sin(midAngle + targetRotation) * dist,
            vx: Math.cos(midAngle + targetRotation) * (4 + Math.random() * 4),
            vy: Math.sin(midAngle + targetRotation) * (4 + Math.random() * 4) - 3,
            startAngle: startAngle + targetRotation,
            endAngle: endAngle + targetRotation,
            rotation: targetRotation,
            vr: (Math.random() - 0.5) * 0.1,
            gravity: 0.25
        });
    }

    // Pinned knives fly off
    pinnedKnives.forEach(pk => {
        let pkAngle = pk.angle + targetRotation;
        let cos = Math.cos(pkAngle);
        let sin = Math.sin(pkAngle);
        shatteredPieces.push({
            isKnife: true,
            x: logX + logRadius * cos,
            y: logY + logRadius * sin,
            vx: cos * (3 + Math.random() * 3),
            vy: sin * (3 + Math.random() * 3) - 2,
            rotation: pkAngle,
            vr: (Math.random() - 0.5) * 0.15,
            gravity: 0.3
        });
    });

    // Apples fall off
    apples.forEach(app => {
        if (app.active) {
            let appAngle = app.angle + targetRotation;
            shatteredPieces.push({
                isApple: true,
                x: logX + logRadius * Math.cos(appAngle),
                y: logY + logRadius * Math.sin(appAngle),
                vx: Math.cos(appAngle) * (2 + Math.random() * 2),
                vy: Math.sin(appAngle) * (2 + Math.random() * 2) - 4,
                rotation: appAngle,
                vr: (Math.random() - 0.5) * 0.1,
                gravity: 0.25
            });
        }
    });

    gameState = 'shattering';
    
    setTimeout(() => {
        elLcScore.textContent = score;
        elLcNextBadge.textContent = `NEXT: STAGE ${stage + 1}`;
        elOverlayComplete.classList.remove('hidden');
        gameState = 'complete';
    }, 1000);
}

// Drawing shapes procedurally
function drawKnife(c, x, y) {
    c.save();
    c.translate(x, y);

    // Blade
    const grad = c.createLinearGradient(-4, 0, 4, 0);
    grad.addColorStop(0, '#e2e8f0');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(1, '#94a3b8');
    c.fillStyle = grad;
    c.beginPath();
    c.moveTo(0, 0);       // Tip
    c.lineTo(-4, 8);      // Left edge
    c.lineTo(-3, 38);     // Left lower
    c.lineTo(3, 38);      // Right lower
    c.lineTo(4, 8);       // Right edge
    c.closePath();
    c.fill();

    // Hilt
    c.fillStyle = '#fbbf24';
    c.fillRect(-6, 38, 12, 4);
    
    // Handle
    c.fillStyle = '#451a03';
    c.fillRect(-3, 42, 6, 18);

    c.restore();
}

function drawApple(c, x, y) {
    c.save();
    c.translate(x, y);

    // Main red circle fruit
    c.fillStyle = '#ef4444';
    c.beginPath();
    c.arc(0, -6, 10, 0, Math.PI * 2);
    c.fill();
    
    // Highlight
    c.fillStyle = '#f87171';
    c.beginPath();
    c.arc(-4, -9, 3, 0, Math.PI * 2);
    c.fill();

    // Leaf
    c.fillStyle = '#22c55e';
    c.beginPath();
    c.ellipse(4, -16, 5, 2.5, Math.PI / 4, 0, Math.PI * 2);
    c.fill();

    // Stem
    c.strokeStyle = '#78350f';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, -6);
    c.quadraticCurveTo(2, -14, 0, -18);
    c.stroke();

    c.restore();
}

function drawShatteredAppleHalf(c, x, y, angle, isLeft) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    
    c.fillStyle = '#ef4444';
    c.beginPath();
    if (isLeft) {
        c.arc(0, 0, 10, Math.PI/2, Math.PI*1.5);
    } else {
        c.arc(0, 0, 10, Math.PI*1.5, Math.PI/2);
    }
    c.closePath();
    c.fill();

    c.fillStyle = '#fef08a';
    c.beginPath();
    if (isLeft) {
        c.moveTo(0, -10);
        c.lineTo(0, 10);
        c.quadraticCurveTo(-8, 5, -8, 0);
        c.quadraticCurveTo(-8, -5, 0, -10);
    } else {
        c.moveTo(0, -10);
        c.lineTo(0, 10);
        c.quadraticCurveTo(8, 5, 8, 0);
        c.quadraticCurveTo(8, -5, 0, -10);
    }
    c.closePath();
    c.fill();

    c.fillStyle = '#451a03';
    c.beginPath();
    c.arc(isLeft ? -2 : 2, 0, 1.5, 0, Math.PI * 2);
    c.fill();

    c.restore();
}

function drawLog(c, rot) {
    c.save();
    c.translate(logX, logY);
    c.rotate(rot);

    c.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    c.lineWidth = 6;
    c.beginPath();
    c.arc(0, 0, logRadius + 1, 0, Math.PI * 2);
    c.stroke();

    c.fillStyle = '#7c2d12';
    c.beginPath();
    c.arc(0, 0, logRadius, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#b45309';
    c.beginPath();
    c.arc(0, 0, logRadius - 8, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = '#92400e';
    c.lineWidth = 2;
    for (let r = 20; r < logRadius - 10; r += 16) {
        c.beginPath();
        c.arc(0, 0, r, 0, Math.PI * 2);
        c.stroke();
    }

    c.strokeStyle = '#78350f';
    c.lineWidth = 3;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        c.beginPath();
        c.moveTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
        c.lineTo(Math.cos(angle) * (logRadius - 12), Math.sin(angle) * (logRadius - 12));
        c.stroke();
    }

    c.fillStyle = '#78350f';
    c.beginPath();
    c.arc(0, 0, 8, 0, Math.PI * 2);
    c.fill();

    c.restore();
}

// Core loop update
function update() {
    frameIndex++;

    // Rotation logic
    let currentSpeed = baseSpeed;
    if (rotationType === 'pulse') {
        currentSpeed = baseSpeed + 0.02 * Math.sin(frameIndex * 0.025);
    } else if (rotationType === 'reverse') {
        if (frameIndex % 150 === 0) {
            direction *= -1;
        }
        currentSpeed = baseSpeed * direction;
    } else if (rotationType === 'jerky') {
        let cycle = frameIndex % 180;
        if (cycle < 60) {
            currentSpeed = 0;
        } else if (cycle < 100) {
            currentSpeed = baseSpeed * 1.8 * direction;
        } else {
            currentSpeed = baseSpeed * 0.6 * direction;
        }
    } else {
        currentSpeed = baseSpeed * direction;
    }
    
    targetSpeed = currentSpeed;
    targetRotation += targetSpeed;

    // Flying thrown knife update
    if (activeKnife.active) {
        activeKnife.progress += 1 / activeKnife.duration;

        if (activeKnife.progress >= 1) {
            activeKnife.progress = 1;
            activeKnife.active = false;
            
            // Trigger collision math at target point
            const landingWorldAngle = activeKnife.targetWorldAngle;
            const landingRelativeAngle = landingWorldAngle - targetRotation;

            // Check overlap with existing pinned knives
            let hitKnife = false;
            for (let pk of pinnedKnives) {
                let diff = Math.abs(landingRelativeAngle - pk.angle) % (Math.PI * 2);
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                if (diff < minAngleOverlap) {
                    hitKnife = true;
                    break;
                }
            }

            if (hitKnife) {
                playSound('clank');
                bouncingKnife = {
                    x: activeKnife.targetX,
                    y: activeKnife.targetY,
                    vx: -3 + Math.random() * 6,
                    vy: 6,
                    rotation: activeKnife.targetWorldAngle,
                    vr: 0.15 + Math.random() * 0.1
                };
                shakeIntensity = 10;
                
                gameState = 'gameover';
                if (window.trackGameEvent) {
                    window.trackGameEvent('game_over', { score: score, stage: stage });
                }

                gameOverCount++;
                localStorage.setItem('pmg_knifehit_go_count', gameOverCount.toString());
                if (gameOverCount % 3 === 0) {
                    setTimeout(() => {
                        if (typeof loadSmartlinkAd === 'function') loadSmartlinkAd();
                    }, 500);
                }

                setTimeout(() => {
                    elGoScore.textContent = score;
                    elOverlayGameOver.classList.remove('hidden');
                    if (typeof renderGameScroller === 'function') {
                        renderGameScroller('gameover-scroller');
                    }
                }, 800);
            } else {
                playSound('hit');
                pinnedKnives.push({ angle: landingRelativeAngle });
                shakeIntensity = 4;

                // Spawn splash at target coordinates
                triggerWoodSplash(activeKnife.targetX, activeKnife.targetY);

                // Check Apple Collision
                let appleSliced = false;
                for (let apple of apples) {
                    if (apple.active) {
                        let diff = Math.abs(landingRelativeAngle - apple.angle) % (Math.PI * 2);
                        if (diff > Math.PI) diff = Math.PI * 2 - diff;
                        if (diff < appleHitTolerance) {
                            apple.active = false;
                            score += 5;
                            playSound('apple');
                            triggerAppleSplash(activeKnife.targetX, activeKnife.targetY);
                            appleSliced = true;
                        }
                    }
                }

                // If an apple was sliced, check if ALL apples on this stage are now gone
                const allApplesCleared = appleSliced && apples.every(a => !a.active);

                knivesLeft--;
                score++;
                elHudScore.textContent = score;
                elHudKnives.textContent = knivesLeft;

                if (allApplesCleared) {
                    // All apples sliced — stage complete! Show bonus toast then clear
                    showToast('🍎 All Apples! Stage Clear!');
                    if (window.trackGameEvent) {
                        window.trackGameEvent('stage_clear_apple', { stage: stage, score: score });
                    }
                    setTimeout(() => shatterLog(), 600);
                } else if (knivesLeft === 0) {
                    if (window.trackGameEvent) {
                        window.trackGameEvent('stage_clear', { stage: stage });
                    }
                    shatterLog();
                } else {
                    if (appleSliced) showToast('+5 🍎 Apple Sliced!');
                    nextKnifeY = 560;
                    nextKnifeReady = false;
                }
            }
        }
    }

    // Slide up next knife queue
    if (!nextKnifeReady && !activeKnife.active && knivesLeft > 0) {
        nextKnifeY -= 12;
        if (nextKnifeY <= 480) {
            nextKnifeY = 480;
            nextKnifeReady = true;
        }
    }

    // Update particles
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.alpha -= p.decay;
        p.rotation += p.vr;
    });
    particles = particles.filter(p => p.alpha > 0);

    // Update shattered pieces
    shatteredPieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.vr;
    });
    shatteredPieces = shatteredPieces.filter(p => p.y < 700);

    // Update bouncing knife
    if (bouncingKnife) {
        bouncingKnife.x += bouncingKnife.vx;
        bouncingKnife.y += bouncingKnife.vy;
        bouncingKnife.vy += 0.35;
        bouncingKnife.rotation += bouncingKnife.vr;
        if (bouncingKnife.y > 700) {
            bouncingKnife = null;
        }
    }
}

// Render canvas components
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    
    // Screen shake
    if (shakeIntensity > 0) {
        let dx = (Math.random() - 0.5) * shakeIntensity;
        let dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeIntensity *= 0.88;
        if (shakeIntensity < 0.3) shakeIntensity = 0;
    }

    // 1. Draw log and attachments
    if (gameState !== 'shattering' && gameState !== 'complete') {
        drawLog(ctx, targetRotation);

        // Apples (rotate and align)
        apples.forEach(apple => {
            if (apple.active) {
                ctx.save();
                ctx.translate(logX, logY);
                // Rotate by world angle (targetRotation + relative angle) - 90 degrees offset to align Y axis
                ctx.rotate(targetRotation + apple.angle - Math.PI / 2);
                drawApple(ctx, 0, logRadius);
                ctx.restore();
            }
        });

        // Pinned knives (rotate and align outward)
        pinnedKnives.forEach(pk => {
            ctx.save();
            ctx.translate(logX, logY);
            // Rotate by world angle (targetRotation + relative angle) - 90 degrees offset
            ctx.rotate(targetRotation + pk.angle - Math.PI / 2);
            drawKnife(ctx, 0, logRadius);
            ctx.restore();
        });
    }

    // 2. Draw flying knife
    if (activeKnife.active) {
        let x = activeKnife.startX + (activeKnife.targetX - activeKnife.startX) * activeKnife.progress;
        let y = activeKnife.startY + (activeKnife.targetY - activeKnife.startY) * activeKnife.progress;

        ctx.save();
        ctx.translate(x, y);
        // Align tip pointing in direction of travel
        ctx.rotate(activeKnife.travelAngle + Math.PI / 2);
        drawKnife(ctx, 0, 0);
        ctx.restore();
    }

    // 3. Draw wait knife queue
    if (knivesLeft > 0 && gameState === 'playing') {
        drawKnife(ctx, logX, nextKnifeY);
    }

    // 4. Draw failure bouncing knife
    if (bouncingKnife) {
        ctx.save();
        ctx.translate(bouncingKnife.x, bouncingKnife.y);
        ctx.rotate(bouncingKnife.rotation + Math.PI / 2);
        drawKnife(ctx, 0, 0);
        ctx.restore();
    }

    // 5. Draw log shatters
    if (gameState === 'shattering' || gameState === 'complete') {
        shatteredPieces.forEach(p => {
            if (p.isKnife) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation - Math.PI / 2);
                drawKnife(ctx, 0, 0);
                ctx.restore();
            } else if (p.isApple) {
                drawShatteredAppleHalf(ctx, p.x - 6, p.y, p.rotation, true);
                drawShatteredAppleHalf(ctx, p.x + 6, p.y, p.rotation, false);
            } else {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = '#b45309';
                ctx.strokeStyle = '#7c2d12';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, logRadius - 5, p.startAngle - p.rotation, p.endAngle - p.rotation);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        });
    }

    // 6. Draw particles
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();
    });

    // 7. Draw left panel HUD indicator
    if (gameState === 'playing' || gameState === 'shattering') {
        const startY = 560;
        ctx.save();
        for (let i = 0; i < knivesTarget; i++) {
            let itemY = startY - i * 16;
            ctx.translate(24, itemY);
            
            ctx.fillStyle = i < knivesLeft ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-2, -3);
            ctx.lineTo(-1, -12);
            ctx.lineTo(1, -12);
            ctx.lineTo(2, -3);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = i < knivesLeft ? '#ffffff' : 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(-1, 0, 2, 4);

            ctx.translate(-24, -itemY);
        }
        ctx.restore();
    }

    ctx.restore();
}

function loop() {
    if (gameState === 'playing' || gameState === 'shattering') {
        update();
    }
    render();
    requestAnimationFrame(loop);
}

// Tap Throw Logic
function throwKnife(tx, ty) {
    if (gameState !== 'playing') return;
    if (activeKnife.active || !nextKnifeReady) return;
    if (knivesLeft <= 0) return;

    // Determine the absolute angle from log center to tap coordinates
    let dx = tx - logX;
    let dy = ty - logY;
    let targetWorldAngle = Math.atan2(dy, dx);

    // Target coordinate on log boundary
    let hx = logX + logRadius * Math.cos(targetWorldAngle);
    let hy = logY + logRadius * Math.sin(targetWorldAngle);

    playSound('throw');
    activeKnife.active = true;
    activeKnife.startX = logX;
    activeKnife.startY = 480;
    activeKnife.targetX = hx;
    activeKnife.targetY = hy;
    activeKnife.progress = 0;
    // Set travel duration. For ~1 second travel at 60fps, we use 60.
    activeKnife.duration = 60; 
    activeKnife.travelAngle = Math.atan2(hy - activeKnife.startY, hx - activeKnife.startX);
    activeKnife.targetWorldAngle = targetWorldAngle;

    nextKnifeReady = false;
}

// User Actions Bindings
canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    initAudio();
    
    // Convert client coordinates to canvas coordinate space (480x640)
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const tx = (e.clientX - rect.left) * scaleX;
    const ty = (e.clientY - rect.top) * scaleY;
    
    throwKnife(tx, ty);
});

elStartBtn.addEventListener('click', () => {
    initAudio();
    elOverlayStart.classList.add('hidden');
    gameState = 'playing';
    setupLevel();
    if (window.trackGameEvent) {
        window.trackGameEvent('game_start', { stage: stage });
    }
});

elNextLevelBtn.addEventListener('click', () => {
    stage++;
    setupLevel();
    elOverlayComplete.classList.add('hidden');
    gameState = 'playing';
});

elRetryBtn.addEventListener('click', () => {
    setupLevel();
    elOverlayGameOver.classList.add('hidden');
    gameState = 'playing';
});

elRestartBtn.addEventListener('click', () => {
    setupLevel();
    elOverlayStart.classList.add('hidden');
    elOverlayComplete.classList.add('hidden');
    elOverlayGameOver.classList.add('hidden');
    gameState = 'playing';
});

elGoHomeBtn.addEventListener('click', () => {
    window.location.href = '../index.html';
});

function init() {
    canvas.width = 480;
    canvas.height = 640;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    setupLevel();
    loop();
}

document.addEventListener('DOMContentLoaded', () => {
    init();
});
