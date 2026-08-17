/**
 * All in Hole: Black Hole Games — game.js
 * Twist: Only eat target items. Eating anything else = instant game over.
 * Compact layout with header bar like Air Hockey.
 */
(function () {
    'use strict';

    // ─── CONFIG ───────────────────────────────────────────
    const BEST_KEY = 'allInHole_best_v2';
    const LEVEL_TIME = 60; // seconds per level - more forgiving

    // Level definitions: easier first levels
    const LEVELS = [
        { target: '🍎', targetName: 'Apple', targetCount: 3, wrongItems: ['🍇', '🫐'], spawnInterval: 1200, bgColor: '#0d1b2a' },
        { target: '🍕', targetName: 'Pizza', targetCount: 3, wrongItems: ['🧀', '🍄'], spawnInterval: 1100, bgColor: '#1a0a2e' },
        { target: '🍦', targetName: 'Ice Cream', targetCount: 4, wrongItems: ['🍪', '🍫', '🍬'], spawnInterval: 1000, bgColor: '#0a1a2e' },
        { target: '🍔', targetName: 'Burger', targetCount: 4, wrongItems: ['🥬', '🧅', '🍅'], spawnInterval: 950, bgColor: '#2e0a0a' },
        { target: '🎂', targetName: 'Cake', targetCount: 4, wrongItems: ['🍓', '🍒', '🍫', '🍬'], spawnInterval: 900, bgColor: '#1a1a2e' },
        { target: '🍩', targetName: 'Donut', targetCount: 5, wrongItems: ['🍪', '🍬', '🍫', '🍭'], spawnInterval: 850, bgColor: '#2e1a0a' },
        { target: '🍉', targetName: 'Watermelon', targetCount: 5, wrongItems: ['🍇', '🫐', '🍓', '🍒'], spawnInterval: 800, bgColor: '#0a2e0a' },
        { target: '🍣', targetName: 'Sushi', targetCount: 5, wrongItems: ['🍚', '🥒', '🫘', '🧂'], spawnInterval: 750, bgColor: '#0a0a2e' },
        { target: '🧁', targetName: 'Cupcake', targetCount: 6, wrongItems: ['🍫', '🍬', '🍭', '🍪'], spawnInterval: 700, bgColor: '#2e0a1a' },
        { target: '🥧', targetName: 'Pie', targetCount: 6, wrongItems: ['🫐', '🍓', '🍒', '🍎'], spawnInterval: 650, bgColor: '#1a2e0a' },
    ];

    // ─── STATE ────────────────────────────────────────────
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    let W, H;
    let pixelRatio = 1;
    let score = 0;
    let level = 0;
    let timer = LEVEL_TIME;
    let targetCount = 0;
    let targetEaten = 0;
    let hole = { x: 0, y: 0, radius: 30 };
    let items = [];
    let particles = [];
    let floatingTexts = [];
    let gameRunning = false;
    let levelComplete = false;
    let gameOver = false;
    let animFrame = null;
    let lastSpawn = 0;
    let dragging = false;
    let mouseX = 0, mouseY = 0;
    let bgStars = [];
    let wrongFlashTimer = 0;

    // DOM refs
    const hdrLevel = document.getElementById('hdr-level');
    const hdrTarget = document.getElementById('hdr-target');
    const bestMenu = document.getElementById('best-menu');
    const startScreen = document.getElementById('start-screen');
    const levelCompleteScreen = document.getElementById('level-complete-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const completedLevelEl = document.getElementById('completed-level');
    const levelScoreEl = document.getElementById('level-score');
    const finalScoreEl = document.getElementById('final-score');
    const bestScoreEl = document.getElementById('best-score');
    const gameOverTitle = document.getElementById('game-over-title');
    const wrongFlashEl = document.getElementById('wrong-flash');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const nextLevelBtn = document.getElementById('next-level-btn');

    // ─── RESIZE ───────────────────────────────────────────
    const playArea = document.getElementById('play-area');

    function resize() {
        const rect = playArea.getBoundingClientRect();
        W = canvas.width = rect.width;
        H = canvas.height = rect.height;
        if (!gameRunning && !gameOver && !levelComplete) {
            hole.x = W / 2;
            hole.y = H / 2;
        }
        generateStars();
    }

    function generateStars() {
        bgStars = [];
        for (let i = 0; i < 80; i++) {
            bgStars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: 0.5 + Math.random() * 1.5,
                a: 0.3 + Math.random() * 0.7,
                speed: 0.2 + Math.random() * 0.5
            });
        }
    }

    window.addEventListener('resize', resize);

    // ─── UTILITY ──────────────────────────────────────────
    function dist(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function randInt(min, max) {
        return Math.floor(rand(min, max + 1));
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    // ─── PARTICLES ────────────────────────────────────────
    function spawnParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = rand(0, Math.PI * 2);
            const speed = rand(1, 4);
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.015 + rand(0, 0.02),
                radius: rand(2, 5),
                color: color
            });
        }
    }

    function spawnFloatingText(x, y, text, color = '#fff', size = 24) {
        floatingTexts.push({
            x, y,
            text,
            color,
            size,
            life: 1,
            vy: -2,
            decay: 0.018
        });
    }

    // ─── ITEMS ────────────────────────────────────────────
    function createItem() {
        const levelData = LEVELS[level];
        const isTarget = Math.random() < 0.35; // 35% chance target
        const type = isTarget ? 'target' : 'wrong';
        const emoji = isTarget ? levelData.target : levelData.wrongItems[randInt(0, levelData.wrongItems.length - 1)];
        const size = isTarget ? rand(18, 26) : rand(10, 18);
        const margin = 50;
        const x = rand(margin, W - margin);
        const y = rand(margin, H - margin);

        // Don't spawn on hole
        if (dist(x, y, hole.x, hole.y) < hole.radius + size + 40) {
            return null;
        }

        // Don't spawn too close to other items
        for (const item of items) {
            if (dist(x, y, item.x, item.y) < size + item.radius + 20) {
                return null;
            }
        }

        return {
            x, y,
            radius: size,
            emoji,
            type,
            alive: true,
            bobPhase: rand(0, Math.PI * 2),
            bobSpeed: 0.02 + rand(0, 0.02),
            bobAmount: 1 + rand(0, 2)
        };
    }

    function spawnInitialItems() {
        items = [];
        const levelData = LEVELS[level];
        // Spawn 2 targets and a few wrong items
        let targetsSpawned = 0;
        let attempts = 0;
        while (targetsSpawned < 2 && attempts < 50) {
            const item = createItem();
            if (item && item.type === 'target') {
                items.push(item);
                targetsSpawned++;
            }
            attempts++;
        }
        // Spawn 4-5 wrong items
        for (let i = 0; i < 4 + level; i++) {
            const item = createItem();
            if (item) items.push(item);
        }
    }

    // ─── HOLE ─────────────────────────────────────────────
    function updateHole() {
        // Hole radius grows slightly with progress but stays modest for compact play
        const baseRadius = 22;
        const growthPerTarget = 2;
        hole.radius = Math.min(baseRadius + targetEaten * growthPerTarget, 70);
    }

    // ─── TIMER HUD (drawn on canvas - small badge) ──────
    function drawTimerHUD() {
        const secs = Math.ceil(timer);
        if (secs < 0) return;

        const text = `${secs}s`;
        const textW = 42;
        const textH = 26;
        const x = W - textW - 10;
        const y = 10;

        // Background
        ctx.fillStyle = secs <= 10 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 0, 0, 0.5)';
        const r = 13;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + textW - r, y);
        ctx.quadraticCurveTo(x + textW, y, x + textW, y + r);
        ctx.lineTo(x + textW, y + textH - r);
        ctx.quadraticCurveTo(x + textW, y + textH, x + textW - r, y + textH);
        ctx.lineTo(x + r, y + textH);
        ctx.quadraticCurveTo(x, y + textH, x, y + textH - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();

        // Timer text
        ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = secs <= 10 ? '#fff' : '#fbbf24';
        ctx.fillText(text, x + textW / 2, y + textH / 2);
    }

    // ─── DRAWING ──────────────────────────────────────────
    function drawBackground() {
        const levelData = LEVELS[level] || LEVELS[0];
        const bgColor = levelData.bgColor;

        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
        grad.addColorStop(0, bgColor);
        grad.addColorStop(1, '#050515');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Stars
        bgStars.forEach(star => {
            const twinkle = 0.5 + 0.5 * Math.sin(Date.now() * 0.001 * star.speed + star.x);
            ctx.globalAlpha = star.a * twinkle;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function drawHole() {
        const r = hole.radius;

        // Outer glow
        const glowGrad = ctx.createRadialGradient(hole.x, hole.y, r * 0.3, hole.x, hole.y, r * 2.5);
        glowGrad.addColorStop(0, 'rgba(168, 85, 247, 0.15)');
        glowGrad.addColorStop(0.5, 'rgba(124, 58, 237, 0.05)');
        glowGrad.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(hole.x, hole.y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Main hole body
        const bodyGrad = ctx.createRadialGradient(
            hole.x - r * 0.3, hole.y - r * 0.3, r * 0.1,
            hole.x, hole.y, r
        );
        bodyGrad.addColorStop(0, '#1a0533');
        bodyGrad.addColorStop(0.4, '#0d0d3a');
        bodyGrad.addColorStop(0.8, '#050515');
        bodyGrad.addColorStop(1, '#000000');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(hole.x, hole.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Accretion ring
        if (r > 12) {
            const ringGrad = ctx.createRadialGradient(hole.x, hole.y, r * 0.7, hole.x, hole.y, r);
            ringGrad.addColorStop(0, 'rgba(147, 51, 234, 0)');
            ringGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.25)');
            ringGrad.addColorStop(0.85, 'rgba(124, 58, 237, 0.4)');
            ringGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
            ctx.fillStyle = ringGrad;
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, r, 0, Math.PI * 2);
            ctx.fill();

            // Swirling particles
            const time = Date.now() * 0.001;
            for (let i = 0; i < 6; i++) {
                const angle = time * (0.5 + i * 0.1) + (i / 6) * Math.PI * 2;
                const swirlR = r * (0.8 + 0.2 * Math.sin(time * 2 + i));
                const px = hole.x + Math.cos(angle) * swirlR;
                const py = hole.y + Math.sin(angle) * swirlR;
                ctx.globalAlpha = 0.3 + 0.2 * Math.sin(time * 3 + i);
                ctx.fillStyle = '#a855f7';
                ctx.beginPath();
                ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Ring outline
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, r * 0.9, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    function drawItems() {
        const time = Date.now() * 0.001;
        items.forEach(item => {
            if (!item.alive) return;
            const bobY = Math.sin(time * item.bobSpeed * 10 + item.bobPhase) * item.bobAmount;

            // Target glow effect
            if (item.type === 'target') {
                const glowPulse = 0.4 + 0.3 * Math.sin(time * 3 + item.x);
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 25 * glowPulse;
            } else {
                // Wrong items have a subtle red tint when close to hole
                const d = dist(hole.x, hole.y, item.x, item.y);
                if (d < hole.radius + item.radius + 40) {
                    ctx.shadowColor = '#ef4444';
                    ctx.shadowBlur = 10;
                }
            }

            // Draw emoji
            ctx.font = `${item.radius * 2.2}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.emoji, item.x, item.y + bobY);
            ctx.shadowBlur = 0;

            // Target ring indicator
            if (item.type === 'target') {
                const pulse = 0.3 + 0.2 * Math.sin(time * 3 + item.x);
                ctx.strokeStyle = `rgba(251, 191, 36, ${pulse})`;
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(item.x, item.y + bobY, item.radius + 8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);

                // Sparkle dots
                for (let s = 0; s < 3; s++) {
                    const sa = time * 2 + (s / 3) * Math.PI * 2;
                    const sr = item.radius + 12 + 2 * Math.sin(time * 4 + s);
                    ctx.fillStyle = `rgba(251, 191, 36, ${0.4 + 0.3 * Math.sin(time * 5 + s)})`;
                    ctx.beginPath();
                    ctx.arc(item.x + Math.cos(sa) * sr, item.y + bobY + Math.sin(sa) * sr, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
    }

    function drawParticles() {
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function drawFloatingTexts() {
        floatingTexts.forEach(ft => {
            ctx.globalAlpha = ft.life;
            ctx.font = `bold ${ft.size}px "Segoe UI", system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 8;
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.shadowBlur = 0;
        });
        ctx.globalAlpha = 1;
    }

    function drawTimerWarning() {
        if (timer <= 10 && timer > 0 && gameRunning) {
            const pulse = 0.3 + 0.3 * Math.sin(Date.now() * 0.008);
            ctx.fillStyle = `rgba(239, 68, 68, ${pulse * 0.08})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    // ─── COLLISION / EATING ──────────────────────────────
    function checkEating() {
        const r = hole.radius;
        const eatDist = r * 0.6;

        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            if (!item.alive) continue;

            const d = dist(hole.x, hole.y, item.x, item.y);

            // Suck effect when close
            if (d < r + item.radius + 25) {
                if (d < eatDist || d < r + item.radius) {
                    // Eating this item
                    item.alive = false;
                    items.splice(i, 1);

                    if (item.type === 'target') {
                        // Correct! Eat target
                        targetEaten++;
                        score += 100;
                        spawnParticles(item.x, item.y, '#fbbf24', 20);
                        spawnFloatingText(item.x, item.y, '+100', '#fbbf24', 28);
                        updateHole();
                        updateHeaderUI();

                        if (targetEaten >= targetCount) {
                            completeLevel();
                            return;
                        }
                    } else {
                        // WRONG! Ate a non-target item - GAME OVER
                        spawnParticles(item.x, item.y, '#ef4444', 30);
                        spawnFloatingText(item.x, item.y, '💀 WRONG!', '#ef4444', 32);
                        triggerWrongFlash();
                        endGame(false);
                        return;
                    }
                } else {
                    // Suck toward hole
                    const angle = Math.atan2(hole.y - item.y, hole.x - item.x);
                    const speed = 2 + (r - item.radius) * 0.04;
                    item.x += Math.cos(angle) * speed;
                    item.y += Math.sin(angle) * speed;
                }
            }
        }
    }

    function triggerWrongFlash() {
        if (wrongFlashEl) {
            wrongFlashEl.classList.add('active');
            setTimeout(() => {
                wrongFlashEl.classList.remove('active');
            }, 150);
        }
    }

    // ─── SPAWNING ─────────────────────────────────────────
    function updateSpawning() {
        const levelData = LEVELS[level];
        const now = Date.now();
        if (now - lastSpawn > levelData.spawnInterval) {
            const item = createItem();
            if (item) items.push(item);
            lastSpawn = now;

            // Maintain minimum items on screen
            const targets = items.filter(it => it.alive && it.type === 'target').length;
            const wrong = items.filter(it => it.alive && it.type === 'wrong').length;

            if (targets < 1 && targetEaten < targetCount) {
                for (let i = 0; i < 2; i++) {
                    const t = createItem();
                    if (t && t.type === 'target') items.push(t);
                }
            }
            if (wrong < 3) {
                for (let i = 0; i < 2; i++) {
                    const w = createItem();
                    if (w) items.push(w);
                }
            }
        }
    }

    // ─── LEVEL COMPLETE / GAME OVER ──────────────────────
    function completeLevel() {
        levelComplete = true;
        gameRunning = false;
        if (animFrame) {
            cancelAnimationFrame(animFrame);
            animFrame = null;
        }

        completedLevelEl.textContent = level + 1;
        levelScoreEl.textContent = score;
        levelCompleteScreen.classList.remove('hidden');

        // Star rating
        const stars = levelCompleteScreen.querySelectorAll('.star');
        let starCount = targetEaten >= targetCount ? 3 : (targetEaten >= targetCount * 0.6 ? 2 : 1);
        stars.forEach((s, i) => {
            setTimeout(() => {
                s.classList.toggle('active', i < starCount);
            }, i * 200);
        });
    }

    function endGame(won = false) {
        gameRunning = false;
        if (animFrame) {
            cancelAnimationFrame(animFrame);
            animFrame = null;
        }

        const best = parseInt(localStorage.getItem(BEST_KEY) || '0');
        if (score > best) {
            localStorage.setItem(BEST_KEY, score.toString());
        }

        finalScoreEl.textContent = score;
        bestScoreEl.textContent = Math.max(score, best);

        if (won) {
            gameOverTitle.textContent = '🎉 YOU WIN!';
            gameOverTitle.style.color = '#10b981';
        } else {
            gameOverTitle.textContent = '💀 GAME OVER';
            gameOverTitle.style.color = '#ef4444';
        }

        gameOverScreen.classList.remove('hidden');
    }

    // ─── UI UPDATES ──────────────────────────────────────
    function updateHeaderUI() {
        hdrLevel.textContent = `Lv.${level + 1}`;
        hdrTarget.textContent = `🎯 ${targetEaten}/${targetCount}`;
    }

    // ─── GAME LOOP ────────────────────────────────────────
    function gameLoop(timestamp) {
        if (!gameRunning) return;

        const dt = 1 / 60;
        timer -= dt;
        if (timer <= 0) {
            timer = 0;
            updateHeaderUI();
            endGame(false);
            return;
        }
        updateHeaderUI();

        updateSpawning();
        checkEating();

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) particles.splice(i, 1);
        }

        // Update floating texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.y += ft.vy;
            ft.life -= ft.decay;
            if (ft.life <= 0) floatingTexts.splice(i, 1);
        }

        // Limit total items
        if (items.filter(it => it.alive).length > 25) {
            const oldest = items.filter(it => it.alive)[0];
            if (oldest) oldest.alive = false;
        }
        items = items.filter(it => it.alive);

        // Draw
        drawBackground();
        drawTimerHUD();
        drawTimerWarning();
        drawItems();
        drawHole();
        drawParticles();
        drawFloatingTexts();

        animFrame = requestAnimationFrame(gameLoop);
    }

    // ─── GAME CONTROL ─────────────────────────────────────
    function startGame() {
        score = 0;
        level = 0;
        timer = LEVEL_TIME;
        targetEaten = 0;
        items = [];
        particles = [];
        floatingTexts = [];
        gameRunning = true;
        levelComplete = false;
        gameOver = false;
        lastSpawn = 0;

        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        levelCompleteScreen.classList.add('hidden');

        const levelData = LEVELS[0];
        targetCount = levelData.targetCount;

        hole.x = W / 2;
        hole.y = H / 2;
        updateHole();
        spawnInitialItems();

        updateHeaderUI();

        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(gameLoop);
    }

    function nextLevel() {
        level++;
        if (level >= LEVELS.length) {
            endGame(true);
            return;
        }

        timer = LEVEL_TIME;
        targetEaten = 0;
        items = [];
        particles = [];
        floatingTexts = [];
        levelComplete = false;
        gameRunning = true;
        lastSpawn = 0;

        const levelData = LEVELS[level];
        targetCount = levelData.targetCount;

        updateHole();
        spawnInitialItems();

        updateHeaderUI();
        levelCompleteScreen.classList.add('hidden');

        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(gameLoop);
    }

    // ─── INPUT HANDLING ──────────────────────────────────
    function getPos(e) {
        if (e.touches) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function canvasPos(e) {
        const rect = canvas.getBoundingClientRect();
        const pos = getPos(e);
        return {
            x: pos.x - rect.left,
            y: pos.y - rect.top
        };
    }

    function onPointerDown(e) {
        if (!gameRunning || levelComplete) return;
        const pos = canvasPos(e);
        const d = dist(pos.x, pos.y, hole.x, hole.y);
        if (d < hole.radius * 3) {
            dragging = true;
            mouseX = pos.x;
            mouseY = pos.y;
        }
    }

    function onPointerMove(e) {
        if (!gameRunning || levelComplete) return;
        const pos = canvasPos(e);
        mouseX = pos.x;
        mouseY = pos.y;

        if (dragging) {
            const dx = mouseX - hole.x;
            const dy = mouseY - hole.y;
            const speed = 0.15;
            hole.x += dx * speed;
            hole.y += dy * speed;
            hole.x = clamp(hole.x, hole.radius, W - hole.radius);
            hole.y = clamp(hole.y, hole.radius, H - hole.radius);
        }
    }

    function onPointerUp() {
        dragging = false;
    }

    // Mouse events
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('mouseleave', onPointerUp);

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onPointerDown(e);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        onPointerMove(e);
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        onPointerUp();
    }, { passive: false });
    canvas.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        onPointerUp();
    }, { passive: false });

    // ─── INIT ─────────────────────────────────────────────
    function init() {
        resize();
        startScreen.classList.remove('hidden');
        gameOverScreen.classList.add('hidden');
        levelCompleteScreen.classList.add('hidden');

        drawBackground();

        const best = parseInt(localStorage.getItem(BEST_KEY) || '0');
        if (bestMenu) {
            bestMenu.textContent = best > 0 ? `🏆 Best: ${best}` : '';
        }

        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', startGame);
        nextLevelBtn.addEventListener('click', nextLevel);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();