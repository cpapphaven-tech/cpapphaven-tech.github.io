/**
 * Cyber Dino: Downhill Slope & Triple Jump Runner – PlayMixGames
 * Downward Slope Physics, Triple Jump Flips, Neon Cyber Spikes & Energy Crystals (No Birds)
 */
(function () {
    'use strict';

    // --- Web Audio Synthesizer ---
    var audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function playSound(type) {
        try {
            var ctx = getAudioCtx();
            if (!ctx) return;
            var now = ctx.currentTime;

            if (type === 'jump') {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'doublejump') {
                var oscD = ctx.createOscillator();
                var gainD = ctx.createGain();
                oscD.type = 'sine';
                oscD.frequency.setValueAtTime(550, now);
                oscD.frequency.exponentialRampToValueAtTime(1100, now + 0.16);
                gainD.gain.setValueAtTime(0.25, now);
                gainD.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
                oscD.connect(gainD);
                gainD.connect(ctx.destination);
                oscD.start(now);
                oscD.stop(now + 0.16);
            } else if (type === 'triplejump') {
                [659.25, 880, 1174.66, 1567.98].forEach(function (f, i) {
                    var oscT = ctx.createOscillator();
                    var gainT = ctx.createGain();
                    oscT.type = 'sine';
                    oscT.frequency.setValueAtTime(f, now + i * 0.04);
                    gainT.gain.setValueAtTime(0.3, now + i * 0.04);
                    gainT.gain.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.22);
                    oscT.connect(gainT);
                    gainT.connect(ctx.destination);
                    oscT.start(now + i * 0.04);
                    oscT.stop(now + i * 0.04 + 0.22);
                });
            } else if (type === 'crystal') {
                [783.99, 1046.50, 1567.98].forEach(function (f, i) {
                    var oscC = ctx.createOscillator();
                    var gainC = ctx.createGain();
                    oscC.type = 'sine';
                    oscC.frequency.setValueAtTime(f, now + i * 0.04);
                    gainC.gain.setValueAtTime(0.2, now + i * 0.04);
                    gainC.gain.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.2);
                    oscC.connect(gainC);
                    gainC.connect(ctx.destination);
                    oscC.start(now + i * 0.04);
                    oscC.stop(now + i * 0.04 + 0.2);
                });
            } else if (type === 'score') {
                var oscS = ctx.createOscillator();
                var gainS = ctx.createGain();
                oscS.type = 'square';
                oscS.frequency.setValueAtTime(880, now);
                oscS.frequency.setValueAtTime(1174.66, now + 0.08);
                gainS.gain.setValueAtTime(0.2, now);
                gainS.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                oscS.connect(gainS);
                gainS.connect(ctx.destination);
                oscS.start(now);
                oscS.stop(now + 0.25);
            } else if (type === 'crash') {
                var oscK = ctx.createOscillator();
                var gainK = ctx.createGain();
                oscK.type = 'sawtooth';
                oscK.frequency.setValueAtTime(180, now);
                oscK.frequency.exponentialRampToValueAtTime(35, now + 0.35);
                gainK.gain.setValueAtTime(0.35, now);
                gainK.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                oscK.connect(gainK);
                gainK.connect(ctx.destination);
                oscK.start(now);
                oscK.stop(now + 0.35);
            }
        } catch (e) {}
    }

    // --- State Variables ---
    var canvas = document.getElementById('dino-canvas');
    var ctx = canvas.getContext('2d');
    var isPlaying = false;
    var isGameOver = false;
    var score = 0;
    var lastScoreMilestone = 0;
    var highScore = parseInt(localStorage.getItem('pmg_cyberdino_high') || '0', 10);
    var speed = 7.0;
    var currentTheme = 'cyber'; // 'cyber', 'sunset', 'emerald'

    // --- Downhill Slope Geometry ---
    var slopeAngle = 0.11; // ~6.5 degrees tilt
    var slopeStartY = 175;
    var slopeEndY = 265;

    function getGroundY(x) {
        return slopeStartY + (x / 800) * (slopeEndY - slopeStartY);
    }

    // --- DOM Elements ---
    var scoreEl = document.getElementById('score-val');
    var highEl = document.getElementById('high-val');
    var speedEl = document.getElementById('speed-val');
    var startOverlay = document.getElementById('start-overlay');
    var winModal = document.getElementById('win-modal');
    var winScoreEl = document.getElementById('win-score');
    var winHighEl = document.getElementById('win-high');
    var playAgainBtn = document.getElementById('play-again-btn');
    var btnJump = document.getElementById('btn-jump');
    var btnDuck = document.getElementById('btn-duck');

    highEl.textContent = String(highScore).padStart(5, '0');

    // --- Cyber Dino Player Object (Triple Jump Engine) ---
    var dino = {
        x: 80,
        y: getGroundY(80) - 50,
        w: 48,
        h: 50,
        vy: 0,
        jumpPower: -12.5,
        doubleJumpPower: -11.5,
        tripleJumpPower: -12.5,
        gravity: 0.65,
        isGrounded: true,
        jumpsLeft: 3, // 1st Jump, 2nd Double, 3rd Triple!
        isDucking: false,
        legFrame: 0,
        animTimer: 0,
        jumpAura: 0,
        auraType: 'double'
    };

    // --- Scenery, Obstacles & Crystals ---
    var obstacles = [];
    var crystals = [];
    var clouds = [];
    var nextObstacleDist = 100;

    // --- Theme Palettes ---
    var PALETTES = {
        cyber: { bg: '#080c18', ground: '#06b6d4', grid: '#1e293b', dinoBody: '#10b981', dinoVisor: '#38bdf8', obs: '#ef4444', crystal: '#fbbf24' },
        sunset: { bg: '#180d28', ground: '#ec4899', grid: '#3b0764', dinoBody: '#f43f5e', dinoVisor: '#fde047', obs: '#f97316', crystal: '#38bdf8' },
        emerald: { bg: '#062016', ground: '#34d399', grid: '#064e3b', dinoBody: '#22c55e', dinoVisor: '#a7f3d0', obs: '#e11d48', crystal: '#facc15' }
    };

    // --- Scenery Init ---
    function initScenery() {
        clouds = [
            { x: 100, y: 35, w: 75, h: 22, speed: 0.4 },
            { x: 380, y: 55, w: 90, h: 24, speed: 0.35 },
            { x: 650, y: 30, w: 65, h: 20, speed: 0.5 }
        ];
    }

    // --- Draw Cyber Dino ---
    function drawDino() {
        var pal = PALETTES[currentTheme];
        var dx = dino.x;
        var dy = dino.y;

        ctx.save();
        ctx.translate(dx + 24, dy + 25);
        if (dino.isGrounded) {
            ctx.rotate(slopeAngle);
        }

        // Jump particle auras
        if (dino.jumpAura > 0) {
            ctx.strokeStyle = (dino.auraType === 'triple') ? '#fbbf24' : '#38bdf8';
            ctx.lineWidth = (dino.auraType === 'triple') ? 4 : 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.beginPath();
            ctx.arc(0, 0, 32 - dino.jumpAura * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            dino.jumpAura--;
        }

        ctx.fillStyle = pal.dinoBody;

        if (dino.isDucking && dino.isGrounded) {
            // Cyber Jet Slide Form
            ctx.fillRect(-24, -5, 56, 24);
            ctx.fillRect(6, -11, 28, 16);
            ctx.fillStyle = pal.dinoVisor;
            ctx.fillRect(20, -9, 10, 5);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-28, 1, 6, 6);
            ctx.fillStyle = pal.dinoBody;

            ctx.fillRect(-12, 19, 12, 4);
            ctx.fillRect(14, 19, 12, 4);
        } else {
            // Standing / Downhill Sprinting
            ctx.fillRect(-24, 1, 8, 10);
            ctx.fillRect(-16, -5, 10, 14);
            ctx.fillRect(-8, -13, 26, 26);
            ctx.fillRect(12, -3, 10, 4);
            ctx.fillRect(18, -1, 4, 6);
            ctx.fillRect(2, -25, 24, 18);
            ctx.fillRect(6, -11, 18, 10);
            ctx.fillStyle = pal.dinoVisor;
            ctx.fillRect(14, -21, 10, 5);
            ctx.fillRect(-6, -17, 4, 4);
            ctx.fillRect(0, -17, 4, 4);
            ctx.fillStyle = pal.dinoBody;

            if (!dino.isGrounded) {
                ctx.fillRect(-6, 13, 8, 8);
                ctx.fillRect(6, 13, 8, 8);
            } else if (dino.legFrame === 0) {
                ctx.fillRect(-6, 13, 8, 10);
                ctx.fillRect(-6, 23, 10, 2);
                ctx.fillRect(8, 13, 8, 6);
            } else {
                ctx.fillRect(-6, 13, 8, 6);
                ctx.fillRect(8, 13, 8, 10);
                ctx.fillRect(8, 23, 10, 2);
            }
        }

        ctx.restore();
    }

    // --- Draw Cyber Obstacles & Crystals on Slope ---
    function drawObstacle(obs) {
        var pal = PALETTES[currentTheme];
        ctx.fillStyle = pal.obs;

        for (var s = 0; s < obs.count; s++) {
            var sx = obs.x + s * 22;
            var sgy = getGroundY(sx);
            var sh = obs.h;

            if (obs.isTower) {
                // Cyber Energy Pillar / Tower
                ctx.fillRect(sx, sgy - sh, 18, sh);
                ctx.fillStyle = '#fff';
                ctx.fillRect(sx + 4, sgy - sh + 6, 10, 4);
                ctx.fillStyle = pal.obs;
            } else {
                // Triangular Cyber Spikes
                ctx.beginPath();
                ctx.moveTo(sx, sgy);
                ctx.lineTo(sx + 11, sgy - sh);
                ctx.lineTo(sx + 22, sgy);
                ctx.closePath();
                ctx.fill();

                // Core glowing pulse line
                ctx.fillStyle = '#fff';
                ctx.fillRect(sx + 10, sgy - sh * 0.6, 2, sh * 0.4);
                ctx.fillStyle = pal.obs;
            }
        }
    }

    function drawCrystal(c) {
        var pal = PALETTES[currentTheme];
        ctx.save();
        ctx.fillStyle = pal.crystal;
        ctx.shadowBlur = 10;
        ctx.shadowColor = pal.crystal;
        ctx.beginPath();
        ctx.moveTo(c.x + 10, c.y);
        ctx.lineTo(c.x + 20, c.y + 12);
        ctx.lineTo(c.x + 10, c.y + 24);
        ctx.lineTo(c.x, c.y + 12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // --- Spawn ONLY Ground-Based Neon Obstacles on Downward Slope ---
    function spawnObstacle() {
        var spawnX = 830;
        var sgy = getGroundY(spawnX);

        var count = Math.min(3, Math.floor(Math.random() * (score > 350 ? 3 : 2)) + 1);
        var isTower = (score > 250 && Math.random() < 0.4);
        var isTall = Math.random() < 0.5;
        var sh = isTower ? 56 : (isTall ? 50 : 38);

        obstacles.push({
            type: 'spikes',
            x: spawnX,
            y: sgy - sh,
            w: count * 22,
            h: sh,
            count: count,
            isTower: isTower
        });

        // Spawn Energy Crystals to harvest with Triple Jumps
        if (Math.random() < 0.65) {
            crystals.push({
                x: spawnX + 45,
                y: sgy - (Math.random() * 60 + 65),
                w: 20,
                h: 24,
                collected: false
            });
        }
    }

    // --- Collision Detection ---
    function checkCollision(obs) {
        var dw = dino.isDucking ? 52 : 38;
        var dh = dino.isDucking ? 24 : 46;
        var dy = dino.isDucking ? (dino.y + 20) : (dino.y + 4);
        var dx = dino.x + 6;

        var obsY = getGroundY(obs.x) - obs.h;

        return (
            dx < obs.x + obs.w - 4 &&
            dx + dw > obs.x + 4 &&
            dy < obsY + obs.h - 4 &&
            dy + dh > obsY + 4
        );
    }

    // --- Main Game Loop ---
    function gameLoop() {
        if (!isPlaying || isGameOver) return;

        var currentGroundY = getGroundY(dino.x);

        // Dino Physics & Gravity
        if (!dino.isGrounded) {
            dino.vy += dino.gravity;
            dino.y += dino.vy;

            if (dino.y >= currentGroundY - dino.h) {
                dino.y = currentGroundY - dino.h;
                dino.vy = 0;
                dino.isGrounded = true;
                dino.jumpsLeft = 3; // Reset Triple Jumps on landing!
            }
        } else {
            dino.y = currentGroundY - dino.h;
        }

        // Animate Legs
        dino.animTimer++;
        if (dino.animTimer % 5 === 0) {
            dino.legFrame = (dino.legFrame === 0) ? 1 : 0;
        }

        // Move Background Clouds
        clouds.forEach(function (c) {
            c.x -= c.speed;
            if (c.x < -90) c.x = 840 + Math.random() * 50;
        });

        // Spawn & Move Ground Obstacles
        nextObstacleDist -= speed;
        if (nextObstacleDist <= 0) {
            spawnObstacle();
            var minGap = Math.max(170, 320 - speed * 11);
            nextObstacleDist = minGap + Math.random() * 220;
        }

        for (var i = 0; i < obstacles.length; i++) {
            var obs = obstacles[i];
            obs.x -= speed;

            // Check Collision
            if (checkCollision(obs)) {
                handleGameOver();
                return;
            }
        }

        // Move & Collect Energy Crystals
        for (var j = 0; j < crystals.length; j++) {
            var cry = crystals[j];
            cry.x -= speed;

            if (!cry.collected) {
                var cdx = dino.x;
                var cdy = dino.y;
                if (cdx < cry.x + cry.w && cdx + dino.w > cry.x && cdy < cry.y + cry.h && cdy + dino.h > cry.y) {
                    cry.collected = true;
                    score += 50;
                    playSound('crystal');
                }
            }
        }

        // Clean off-screen objects
        obstacles = obstacles.filter(function (o) { return o.x > -80; });
        crystals = crystals.filter(function (c) { return c.x > -40 && !c.collected; });

        // Update Score & Downhill Acceleration
        score++;
        speed = Math.min(15, 7.0 + score * 0.004);
        scoreEl.textContent = String(score).padStart(5, '0');
        speedEl.textContent = Math.round(speed * 4.5);

        // Milestone chime every 100 points
        if (score - lastScoreMilestone >= 100) {
            lastScoreMilestone = Math.floor(score / 100) * 100;
            playSound('score');
        }

        // Render Canvas
        render();

        requestAnimationFrame(gameLoop);
    }

    // --- Render Downhill Canvas Scene ---
    function render() {
        var pal = PALETTES[currentTheme];

        // Background
        ctx.fillStyle = pal.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Downward Angled Grid Lines
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        for (var yOffset = -40; yOffset < 260; yOffset += 40) {
            ctx.beginPath();
            ctx.moveTo(0, slopeStartY + yOffset);
            ctx.lineTo(canvas.width, slopeEndY + yOffset);
            ctx.stroke();
        }

        // Vertical Perspective Grid Slices
        for (var gx = 0; gx < canvas.width; gx += 60) {
            var gy = getGroundY(gx);
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx - 40, canvas.height);
            ctx.stroke();
        }

        // Neon Clouds
        ctx.fillStyle = pal.grid;
        clouds.forEach(function (c) {
            ctx.beginPath();
            ctx.roundRect(c.x, c.y, c.w, c.h, 10);
            ctx.fill();
        });

        // Glowing Downward Slope Ground Line
        ctx.strokeStyle = pal.ground;
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = pal.ground;
        ctx.beginPath();
        ctx.moveTo(0, slopeStartY);
        ctx.lineTo(canvas.width, slopeEndY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Ground Fill Below Slope
        ctx.fillStyle = pal.grid;
        ctx.beginPath();
        ctx.moveTo(0, slopeStartY);
        ctx.lineTo(canvas.width, slopeEndY);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Obstacles & Crystals
        obstacles.forEach(drawObstacle);
        crystals.forEach(drawCrystal);

        // Cyber Dino
        drawDino();
    }

    // --- Triple Jump System ---
    function triggerJump() {
        if (!isPlaying && !isGameOver) {
            startGame();
            return;
        }
        if (isGameOver) return;

        if (dino.isGrounded && dino.jumpsLeft === 3) {
            // 1st Jump (from slope)
            dino.vy = dino.jumpPower;
            dino.isGrounded = false;
            dino.jumpsLeft = 2;
            dino.auraType = 'normal';
            playSound('jump');
        } else if (dino.jumpsLeft === 2) {
            // 2nd Jump (Double Jump in air!)
            dino.vy = dino.doubleJumpPower;
            dino.jumpsLeft = 1;
            dino.jumpAura = 18;
            dino.auraType = 'double';
            playSound('doublejump');
        } else if (dino.jumpsLeft === 1) {
            // 3rd Jump (TRIPLE JUMP Super Boost!)
            dino.vy = dino.tripleJumpPower;
            dino.jumpsLeft = 0;
            dino.jumpAura = 26;
            dino.auraType = 'triple';
            playSound('triplejump');
        }
    }

    function setDucking(val) {
        if (!isPlaying || isGameOver) return;
        dino.isDucking = val;
        if (val && !dino.isGrounded) {
            dino.vy += 9; // Fast fall drop to slope
        }
    }

    function handleGameOver() {
        isGameOver = true;
        isPlaying = false;
        playSound('crash');

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('pmg_cyberdino_high', highScore);
            highEl.textContent = String(highScore).padStart(5, '0');
        }

        winScoreEl.textContent = String(score).padStart(5, '0');
        winHighEl.textContent = String(highScore).padStart(5, '0');

        render();

        setTimeout(function () {
            winModal.classList.add('active');
        }, 400);
    }

    function startGame() {
        startOverlay.style.display = 'none';
        winModal.classList.remove('active');

        score = 0;
        lastScoreMilestone = 0;
        speed = 7.0;
        scoreEl.textContent = '00000';
        speedEl.textContent = '31';

        dino.y = getGroundY(dino.x) - dino.h;
        dino.vy = 0;
        dino.isGrounded = true;
        dino.jumpsLeft = 3;
        dino.isDucking = false;
        dino.jumpAura = 0;

        obstacles = [];
        crystals = [];
        nextObstacleDist = 100;
        initScenery();

        isGameOver = false;
        isPlaying = true;
        getAudioCtx();

        requestAnimationFrame(gameLoop);
    }

    // --- Listeners ---
    window.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            triggerJump();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            setDucking(true);
        }
    });

    window.addEventListener('keyup', function (e) {
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            setDucking(false);
        }
    });

    // Mobile Touch Buttons
    btnJump.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        btnJump.classList.add('active');
        triggerJump();
    });
    btnJump.addEventListener('pointerup', function () { btnJump.classList.remove('active'); });
    btnJump.addEventListener('pointerleave', function () { btnJump.classList.remove('active'); });

    btnDuck.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        btnDuck.classList.add('active');
        setDucking(true);
    });
    btnDuck.addEventListener('pointerup', function () {
        btnDuck.classList.remove('active');
        setDucking(false);
    });
    btnDuck.addEventListener('pointerleave', function () {
        btnDuck.classList.remove('active');
        setDucking(false);
    });

    // Touch on Canvas (Tap for Triple Jump, Swipe Down for Fast Drop)
    var touchStartY = 0;
    canvas.addEventListener('touchstart', function (e) {
        if (!isPlaying && !isGameOver) {
            startGame();
            return;
        }
        if (e.touches.length > 0) {
            touchStartY = e.touches[0].clientY;
        }
        triggerJump();
    }, { passive: true });

    canvas.addEventListener('touchmove', function (e) {
        if (e.touches.length > 0) {
            var diffY = e.touches[0].clientY - touchStartY;
            if (diffY > 25) setDucking(true);
        }
    }, { passive: true });

    canvas.addEventListener('touchend', function () {
        setDucking(false);
    });

    startOverlay.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', startGame);

    // Theme selector
    document.querySelectorAll('.theme-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.theme-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentTheme = btn.getAttribute('data-theme');
            render();
        });
    });

    // Initial render
    initScenery();
    render();
})();
