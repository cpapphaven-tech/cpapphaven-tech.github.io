/* ============================================================
   Ball Sort: Color Puzzle – game.js
   Canvas-based game engine with custom Sports Balls
   ============================================================ */

(function () {
    'use strict';

    // ── Canvas Setup ──────────────────────────────────────────
    const canvas = document.getElementById('game-canvas');
    const ctx    = canvas.getContext('2d');

    // ── Game State ────────────────────────────────────────────
    let state = {};
    let animFrame = null;
    let lastTime  = 0;

    // ── Constants ─────────────────────────────────────────────
    const MARBLE_R   = 16;      // ball radius (px)
    const BELT_SLOTS = 12;      // total slots on conveyor
    const BOX_SLOTS  = 3;       // balls per box
    const BELT_SPEED = 0.4;     // belt scroll speed (slots/sec)

    // Colors: [fill, stroke/shadow]
    const COLOR_PALETTE = [
        { id:'red',    fill:'#ffffff', shadow:'#c9184a', label:'⚾' }, // Baseball
        { id:'blue',   fill:'#1d4ed8', shadow:'#0056b3', label:'🔵' }, // Neon Basketball
        { id:'green',  fill:'#a3e635', shadow:'#4d7c0f', label:'🎾' }, // Tennis
        { id:'yellow', fill:'#eab308', shadow:'#854d0e', label:'🟡' }, // Billiard 9-Ball
        { id:'purple', fill:'#7c3aed', shadow:'#4c1d95', label:'🎱' }, // Bowling
        { id:'orange', fill:'#f97316', shadow:'#9a3412', label:'🏀' }, // Basketball
    ];

    // ── Level Definitions ─────────────────────────────────────
    const LEVELS = [
        { colors:['orange','green'],                trays:3, boxTarget:4 },
        { colors:['orange','green','red'],          trays:4, boxTarget:5 },
        { colors:['orange','green','red','yellow'], trays:5, boxTarget:6 },
        { colors:['orange','green','red','yellow','purple'], trays:6, boxTarget:7 },
        { colors:['orange','green','red','yellow','purple','blue'], trays:6, boxTarget:8 },
        { colors:['orange','green','red','yellow','purple','blue'], trays:6, boxTarget:10 },
        { colors:['orange','green','red','yellow','purple'], trays:6, boxTarget:12 },
        { colors:['orange','green','red','yellow','purple','blue'], trays:6, boxTarget:14 },
    ];

    // ── UI Elements ───────────────────────────────────────────
    const overlayStart    = document.getElementById('overlay-start');
    const overlayComplete = document.getElementById('overlay-complete');
    const overlayGameover = document.getElementById('overlay-gameover');
    const hudLevel        = document.getElementById('hud-level');
    const hudScore        = document.getElementById('hud-score');
    const hudBoxes        = document.getElementById('hud-boxes');
    const headerLevel     = document.getElementById('header-level-num');
    const toastEl         = document.getElementById('ms-toast');

    let toastTimer = null;

    function showToast(msg, dur = 1600) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), dur);
    }

    // ── Canvas Sizing ─────────────────────────────────────────
    function resize() {
        const wrap = document.getElementById('game-canvas-wrap');
        const W    = Math.min(wrap.clientWidth, 480);
        canvas.width  = W;
        canvas.height = Math.round(W * 1.52);
        if (state.running) drawFrame();
    }

    window.addEventListener('resize', resize);

    function getColor(id) {
        return COLOR_PALETTE.find(c => c.id === id) || COLOR_PALETTE[0];
    }

    // Load saved game progress
    function loadSavedProgress() {
        try {
            const savedLevel = localStorage.getItem('pmg_ball_sort_level');
            const savedScore = localStorage.getItem('pmg_ball_sort_score');
            return {
                level: savedLevel ? parseInt(savedLevel, 10) : 0,
                score: savedScore ? parseInt(savedScore, 10) : 0
            };
        } catch (e) {
            return { level: 0, score: 0 };
        }
    }

    function saveProgress(level, score) {
        try {
            localStorage.setItem('pmg_ball_sort_level', level);
            localStorage.setItem('pmg_ball_sort_score', score);
        } catch (e) {}
    }

    // ─────────────────────────────────────────────────────────
    //  INIT LEVEL
    // ─────────────────────────────────────────────────────────
    function initLevel(levelIdx) {
        const def = LEVELS[Math.min(levelIdx, LEVELS.length - 1)];

        const trayCount = def.trays;
        const trays = [];
        for (let i = 0; i < trayCount; i++) {
            const marbleCount = 3 + Math.floor(Math.random() * 3);
            const col = def.colors[i % def.colors.length];
            const marbles = [];
            for (let m = 0; m < marbleCount; m++) {
                marbles.push({ color: col, dropping: false, y: 0, vy: 0 });
            }
            trays.push({ marbles, colorHint: col });
        }

        const belt = new Array(BELT_SLOTS).fill(null);

        const boxColors = [...def.colors];
        const boxes = [];
        const boxCount = Math.min(def.colors.length, 5);
        for (let b = 0; b < boxCount; b++) {
            boxes.push({
                color: boxColors[b % boxColors.length],
                slots: [],
                completed: false,
                bounceAnim: 0,
                replenishTimer: 0,
            });
        }

        const fallingMarbles = [];

        state = {
            running: false,
            levelIdx,
            def,
            score: state.score || 0,
            boxesDone: 0,
            trays,
            belt,
            beltOffset: 0,
            boxes,
            fallingMarbles,
            gameOver: false,
            complete: false,
            hintTray: -1,
            hintBox: -1,
            particles: [],
            totalBoxTarget: def.boxTarget,
            beltSpeed: BELT_SPEED + levelIdx * 0.04,
        };

        updateHUD();
    }

    function updateHUD() {
        const lvlDisplay = state.levelIdx + 1;
        hudLevel.textContent  = lvlDisplay;
        hudScore.textContent  = state.score;
        hudBoxes.textContent  = state.boxesDone + '/' + state.totalBoxTarget;
        headerLevel.textContent = lvlDisplay;
    }

    function startLoop() {
        state.running = true;
        lastTime = performance.now();
        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(loop);
    }

    function stopLoop() {
        state.running = false;
        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = null;
    }

    function loop(ts) {
        const dt = Math.min((ts - lastTime) / 1000, 0.1);
        lastTime = ts;
        update(dt);
        drawFrame();
        if (state.running) animFrame = requestAnimationFrame(loop);
    }

    function update(dt) {
        if (state.gameOver || state.complete) return;

        state.beltOffset += state.beltSpeed * dt;
        if (state.beltOffset >= 1) {
            state.beltOffset -= 1;
            const tmp = state.belt[BELT_SLOTS - 1];
            for (let i = BELT_SLOTS - 1; i > 0; i--) {
                state.belt[i] = state.belt[i - 1];
            }
            state.belt[0] = tmp;
        }

        for (let i = state.fallingMarbles.length - 1; i >= 0; i--) {
            const fm = state.fallingMarbles[i];
            fm.vy += 1800 * dt;
            fm.y  += fm.vy * dt;

            if (fm.y >= fm.targetY) {
                fm.y = fm.targetY;
                const slotIdx = findFreeSlot();
                if (slotIdx === -1) {
                    triggerGameOver('Conveyor belt is overloaded!');
                    return;
                }
                state.belt[slotIdx] = { color: fm.color, age: 0 };
                state.fallingMarbles.splice(i, 1);
                checkOverloadedBelt();
            }
        }

        for (let i = state.particles.length - 1; i >= 0; i--) {
            const p = state.particles[i];
            p.x  += p.vx * dt;
            p.y  += p.vy * dt;
            p.vy += 400 * dt;
            p.life -= dt;
            if (p.life <= 0) state.particles.splice(i, 1);
        }

        for (const box of state.boxes) {
            if (box.bounceAnim > 0) box.bounceAnim = Math.max(0, box.bounceAnim - dt * 3);
            if (box.completed) {
                box.replenishTimer -= dt;
            }
        }

        replenishBoxes();

        const pad = 10;
        const bX  = pad;
        const bW  = canvas.width - pad * 2;
        const slotW = bW / BELT_SLOTS;

        for (let i = 0; i < BELT_SLOTS; i++) {
            const slot = state.belt[i];
            if (!slot) continue;
            
            const rawX  = bX + slotW * (i + 0.5) + state.beltOffset * slotW;
            const x = bX + ((rawX - bX) % bW + bW) % bW;
            
            for (let b = 0; b < state.boxes.length; b++) {
                const box = state.boxes[b];
                if (!box.completed && box.slots.length < BOX_SLOTS && box.color === slot.color) {
                    const r = getBoxRect(b);
                    if (Math.abs(x - r.cx) < 5) {
                        packIntoBox(b, i);
                        break;
                    }
                }
            }
        }
        
        refillEmptyTrays();
    }

    function findFreeSlot() {
        for (let i = 0; i < BELT_SLOTS; i++) {
            if (state.belt[i] === null) return i;
        }
        return -1;
    }

    function checkOverloadedBelt() {
        const full = state.belt.every(s => s !== null);
        if (!full) return;
        for (const s of state.belt) {
            if (!s) continue;
            for (const box of state.boxes) {
                if (!box.completed && box.color === s.color && box.slots.length < BOX_SLOTS) return;
            }
        }
        triggerGameOver('No matching boxes — belt jammed!');
    }

    function replenishBoxes() {
        for (let b = 0; b < state.boxes.length; b++) {
            const box = state.boxes[b];
            if (box.completed && box.replenishTimer <= 0) {
                const neededColor = pickNeededColor();
                state.boxes[b] = {
                    color: neededColor,
                    slots: [],
                    completed: false,
                    bounceAnim: 0,
                    replenishTimer: 0,
                };
            }
        }
    }

    function refillEmptyTrays() {
        const def = state.def;
        for (let i = 0; i < state.trays.length; i++) {
            const tray = state.trays[i];
            if (tray.marbles.length === 0 && Math.random() < 0.003) {
                const refillColor = def.colors[Math.floor(Math.random() * def.colors.length)];
                const count = 3 + Math.floor(Math.random() * 2);
                for (let m = 0; m < count; m++) {
                    tray.marbles.push({ color: refillColor });
                }
            }
        }
    }

    function pickNeededColor() {
        const def = state.def;
        const counts = {};
        for (const c of def.colors) counts[c] = 0;
        for (const s of state.belt) {
            if (s && counts[s.color] !== undefined) counts[s.color]++;
        }
        for (const t of state.trays) {
            for (const m of t.marbles) {
                if (counts[m.color] !== undefined) counts[m.color]++;
            }
        }
        let best = def.colors[0], bestCount = -1;
        for (const c of def.colors) {
            if (counts[c] > bestCount) {
                bestCount = counts[c];
                best = c;
            }
        }
        return best;
    }

    function dropFromTray(trayIdx) {
        const tray = state.trays[trayIdx];
        if (!tray || tray.marbles.length === 0) {
            showToast('Tray is empty!');
            return;
        }
        const marble = tray.marbles.shift();
        const trayRect = getTrayRect(trayIdx);
        const beltY    = getBeltY();

        state.fallingMarbles.push({
            color: marble.color,
            x: trayRect.cx,
            y: trayRect.cy,
            vy: 0,
            targetY: beltY,
        });
    }

    function packIntoBox(boxIdx, slotIdx) {
        const box = state.boxes[boxIdx];
        if (!box || box.completed || box.slots.length >= BOX_SLOTS) return;

        if (slotIdx === undefined || slotIdx === -1) return;

        state.belt[slotIdx] = null;
        box.slots.push(box.color);
        box.bounceAnim = 1;

        state.score += 10;
        updateHUD();

        const br = getBoxRect(boxIdx);
        spawnParticles(br.cx, br.cy, getColor(box.color).fill, 10);

        if (box.slots.length === BOX_SLOTS) {
            box.completed = true;
            box.replenishTimer = 1.1;
            state.boxesDone++;
            state.score += 50;
            updateHUD();
            showToast('📦 Box complete! +50');
            spawnParticles(br.cx, br.cy, getColor(box.color).fill, 24);

            if (state.boxesDone >= state.totalBoxTarget) {
                setTimeout(() => triggerComplete(), 700);
            }
        }
    }

    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 200;
            state.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 80,
                color: color === '#ffffff' ? '#e2e8f0' : color,
                r: 3 + Math.random() * 4,
                life: 0.5 + Math.random() * 0.4,
                maxLife: 0.9,
            });
        }
    }

    function triggerGameOver(reason) {
        state.gameOver = true;
        stopLoop();
        document.getElementById('go-score').textContent  = state.score;
        document.getElementById('go-reason').textContent = reason;
        overlayGameover.classList.remove('hidden');
    }

    function triggerComplete() {
        state.complete = true;
        stopLoop();
        document.getElementById('lc-score').textContent = state.score;
        const nextLvl = state.levelIdx + 2;
        document.getElementById('lc-next-badge').textContent = 'NEXT: LEVEL ' + nextLvl;
        overlayComplete.classList.remove('hidden');
        saveProgress(state.levelIdx + 1, state.score);
    }

    function W() { return canvas.width; }
    function H() { return canvas.height; }

    function getTrayAreaH() { return H() * 0.40; }
    function getBeltY()    { return getTrayAreaH() + H() * 0.07; }
    function getBeltH()    { return Math.round(MARBLE_R * 2.6); }
    function getBoxAreaTop() { return getBeltY() + getBeltH() + H() * 0.04; }

    function getTrayRect(idx) {
        const trayCount = state.trays.length;
        const trayW     = W() / trayCount;
        const cx        = trayW * idx + trayW / 2;
        const cy        = getTrayAreaH() * 0.38;
        const w         = trayW - 10;
        const h         = Math.min(getTrayAreaH() * 0.55, 110);
        return { x: cx - w/2, y: cy - h/2, w, h, cx, cy };
    }

    function getBoxRect(idx) {
        const boxCount = state.boxes.length;
        const pad      = 8;
        const totalW   = W() - pad * 2;
        const boxW     = totalW / Math.min(boxCount, 5);
        const boxH     = H() * 0.16;
        const top      = getBoxAreaTop();
        const cx       = pad + boxW * idx + boxW / 2;
        const cy       = top + boxH / 2;
        return { x: pad + boxW * idx, y: top, w: boxW - 6, h: boxH, cx, cy };
    }

    function drawFrame() {
        ctx.clearRect(0, 0, W(), H());
        drawBackground();
        drawTrays();
        drawBelt();
        drawBeltFillBar();
        drawBoxes();
        drawFallingMarbles();
        drawParticles();
    }

    function drawBeltFillBar() {
        const filled = state.belt ? state.belt.filter(s => s !== null).length : 0;
        const ratio  = filled / BELT_SLOTS;
        const bY     = getBeltY() + getBeltH() + 6;
        const bX     = 12;
        const bW     = W() - 24;
        const bH     = 5;

        roundRect(ctx, bX, bY, bW, bH, bH / 2);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fill();

        let fillColor;
        if (ratio < 0.5)       fillColor = `rgba(59,130,246,${0.6 + ratio * 0.4})`;
        else if (ratio < 0.8)  fillColor = `rgba(234,179,8,${0.7 + ratio * 0.3})`;
        else                   fillColor = `rgba(239,68,68,${0.8 + ratio * 0.2})`;

        roundRect(ctx, bX, bY, bW * ratio, bH, bH / 2);
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '9px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('BELT ' + filled + '/' + BELT_SLOTS, bX, bY + 8);
    }

    function drawBackground() {
        const grad = ctx.createLinearGradient(0, 0, 0, H());
        grad.addColorStop(0,   '#080c16');
        grad.addColorStop(0.5, '#0b0f19');
        grad.addColorStop(1,   '#04060b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W(), H());

        ctx.fillStyle = 'rgba(59,130,246,0.04)';
        const step = 28;
        for (let x = 0; x < W(); x += step) {
            for (let y = 0; y < H(); y += step) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const belty = getTrayAreaH();
        ctx.strokeStyle = 'rgba(59,130,246,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, belty);
        ctx.lineTo(W(), belty);
        ctx.stroke();
    }

    function drawTrays() {
        const trayCount = state.trays.length;
        for (let i = 0; i < trayCount; i++) {
            const tray = state.trays[i];
            const r    = getTrayRect(i);
            const isHint = (i === state.hintTray);

            roundRect(ctx, r.x, r.y, r.w, r.h, 14);
            ctx.fillStyle = isHint ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.07)';
            ctx.fill();
            ctx.strokeStyle = isHint ? 'rgba(59,130,246,0.9)' : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = isHint ? 2 : 1;
            ctx.stroke();

            if (tray.marbles.length === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.font = `bold ${Math.round(r.h * 0.22)}px Outfit, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('EMPTY', r.cx, r.cy);
                continue;
            }

            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = `bold ${Math.round(r.h * 0.16)}px Outfit, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('TAP', r.cx, r.y + 6);

            const visibleCount = Math.min(tray.marbles.length, 4);
            const baseY = r.y + r.h - MARBLE_R - 8;
            const topMargin = r.y + 28 + MARBLE_R; 
            const maxStackHeight = Math.max(0, baseY - topMargin);
            const marbleSpacing = Math.min(maxStackHeight / Math.max(1, visibleCount - 1), MARBLE_R * 1.8);

            for (let m = visibleCount - 1; m >= 0; m--) {
                const marble = tray.marbles[m];
                const my     = baseY - m * marbleSpacing;
                const col    = getColor(marble.color);
                drawBall(r.cx, my, MARBLE_R, col);
            }

            if (tray.marbles.length > 4) {
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.beginPath();
                ctx.arc(r.cx, r.y + Math.round(r.h * 0.16) + 16, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 11px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+' + (tray.marbles.length - 4), r.cx, r.y + Math.round(r.h * 0.16) + 16);
            }
        }
    }

    function drawBelt() {
        const bY  = getBeltY();
        const bH  = getBeltH();
        const pad = 10;
        const bX  = pad;
        const bW  = W() - pad * 2;

        roundRect(ctx, bX, bY, bW, bH, bH / 2);
        const beltGrad = ctx.createLinearGradient(0, bY, 0, bY + bH);
        beltGrad.addColorStop(0, '#101625');
        beltGrad.addColorStop(0.5, '#0c101b');
        beltGrad.addColorStop(1, '#101625');
        ctx.fillStyle = beltGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(59,130,246,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        roundRect(ctx, bX + 2, bY + 2, bW - 4, bH - 4, (bH - 4) / 2);
        ctx.clip();
        const lineSpacing = 28;
        const offset = (state.beltOffset * lineSpacing) % lineSpacing;
        ctx.strokeStyle = 'rgba(59,130,246,0.15)';
        ctx.lineWidth = 1;
        for (let lx = bX - lineSpacing + offset; lx < bX + bW + lineSpacing; lx += lineSpacing) {
            ctx.beginPath();
            ctx.moveTo(lx, bY);
            ctx.lineTo(lx, bY + bH);
            ctx.stroke();
        }
        ctx.restore();

        const slotW = bW / BELT_SLOTS;
        const cy    = bY + bH / 2;

        for (let i = 0; i < BELT_SLOTS; i++) {
            const slot = state.belt[i];
            if (!slot) continue;
            const rawX  = bX + slotW * (i + 0.5) + state.beltOffset * slotW;
            const x = bX + ((rawX - bX) % bW + bW) % bW;
            if (x < bX + MARBLE_R || x > bX + bW - MARBLE_R) continue;
            const col = getColor(slot.color);
            drawBall(x, cy, MARBLE_R - 1, col);
        }

        ctx.fillStyle = 'rgba(59,130,246,0.3)';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('→', bX + bW - 6, bY + bH / 2);
    }

    function drawBoxes() {
        const count = state.boxes.length;
        for (let i = 0; i < count; i++) {
            const box = state.boxes[i];
            const r   = getBoxRect(i);
            const col = getColor(box.color);
            const isHint = (i === state.hintBox);
            const bounce = box.bounceAnim > 0 ? Math.sin(box.bounceAnim * Math.PI * 3) * 4 : 0;

            ctx.save();
            ctx.translate(0, -bounce);

            roundRect(ctx, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 14);
            const boxGrad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
            if (box.completed) {
                boxGrad.addColorStop(0, 'rgba(34,197,94,0.25)');
                boxGrad.addColorStop(1, 'rgba(34,197,94,0.10)');
            } else {
                boxGrad.addColorStop(0, `${col.fill === '#ffffff' ? '#94a3b8' : col.fill}22`);
                boxGrad.addColorStop(1, `${col.fill === '#ffffff' ? '#94a3b8' : col.fill}0a`);
            }
            ctx.fillStyle = boxGrad;
            ctx.fill();
            ctx.strokeStyle = isHint
                ? (col.fill === '#ffffff' ? '#94a3b8' : col.fill)
                : (box.completed ? 'rgba(34,197,94,0.7)' : `${col.fill === '#ffffff' ? '#475569' : col.fill}55`);
            ctx.lineWidth = isHint ? 2.5 : 1.5;
            ctx.stroke();

            ctx.fillStyle = col.fill === '#ffffff' ? '#cbd5e1' : col.fill;
            ctx.font = `bold ${Math.round(r.h * 0.17)}px Outfit, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(col.id === 'red' ? 'BASEBALL' : col.id.toUpperCase(), r.cx, r.y + 6);

            if (box.completed) {
                ctx.fillStyle = '#22c55e';
                ctx.font = `${Math.round(r.h * 0.4)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✓', r.cx, r.cy + 4);
            } else {
                const slotR    = Math.min(r.w * 0.11, 12);
                const totalSlotW = BOX_SLOTS * slotR * 2 + (BOX_SLOTS - 1) * 6;
                const startX  = r.cx - totalSlotW / 2;
                const slotY   = r.y + r.h * 0.55;

                for (let s = 0; s < BOX_SLOTS; s++) {
                    const sx = startX + s * (slotR * 2 + 6) + slotR;
                    if (s < box.slots.length) {
                        drawBall(sx, slotY, slotR, col);
                    } else {
                        ctx.beginPath();
                        ctx.arc(sx, slotY, slotR, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(255,255,255,0.07)';
                        ctx.fill();
                        ctx.strokeStyle = `${col.fill === '#ffffff' ? '#475569' : col.fill}44`;
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }
                }
            }

            ctx.restore();
        }
    }

    function drawFallingMarbles() {
        for (const fm of state.fallingMarbles) {
            const col = getColor(fm.color);
            drawBall(fm.x, fm.y, MARBLE_R, col);
        }
    }

    function drawParticles() {
        for (const p of state.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // ── Draw Ball helper (Sports Theme) ──
    function drawBall(x, y, r, col) {
        ctx.save();

        // Base shadow/glow
        ctx.shadowColor = col.shadow;
        ctx.shadowBlur  = 8;

        if (col.id === 'red') {
            // ⚾ Baseball
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            // Stitch lines
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.2;
            
            // Left seam arc
            ctx.beginPath();
            ctx.arc(x - r*0.75, y, r*0.75, -Math.PI*0.35, Math.PI*0.35);
            ctx.stroke();

            // Right seam arc
            ctx.beginPath();
            ctx.arc(x + r*0.75, y, r*0.75, Math.PI*0.65, Math.PI*1.35);
            ctx.stroke();

            // Small red stitches
            ctx.fillStyle = '#ef4444';
            const stitchCount = 4;
            for (let i = 0; i <= stitchCount; i++) {
                const angle = -0.35 * Math.PI + (0.7 * Math.PI) * (i / stitchCount);
                const sx1 = x - r*0.75 + Math.cos(angle) * r*0.75;
                const sy1 = y + Math.sin(angle) * r*0.75;
                ctx.beginPath();
                ctx.arc(sx1, sy1, 1, 0, Math.PI*2);
                ctx.fill();

                const sx2 = x + r*0.75 - Math.cos(angle) * r*0.75;
                const sy2 = y + Math.sin(angle) * r*0.75;
                ctx.beginPath();
                ctx.arc(sx2, sy2, 1, 0, Math.PI*2);
                ctx.fill();
            }

        } else if (col.id === 'blue') {
            // 🔵 Futuristic Neon Basketball
            const g = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.05, x, y, r);
            g.addColorStop(0,   '#38bdf8');
            g.addColorStop(0.3, '#1d4ed8');
            g.addColorStop(1,   '#1e1b4b');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            // Black ribs
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
            ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x - r*0.8, y, r*0.8, -Math.PI*0.38, Math.PI*0.38);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x + r*0.8, y, r*0.8, Math.PI*0.62, Math.PI*1.38);
            ctx.stroke();

        } else if (col.id === 'green') {
            // 🎾 Tennis Ball
            const g = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.05, x, y, r);
            g.addColorStop(0,   '#bef264');
            g.addColorStop(0.4, '#a3e635');
            g.addColorStop(1,   '#3f6212');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            // Fuzzy seam arcs
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.arc(x - r*0.72, y, r*0.72, -Math.PI*0.36, Math.PI*0.36);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x + r*0.72, y, r*0.72, Math.PI*0.64, Math.PI*1.36);
            ctx.stroke();

        } else if (col.id === 'yellow') {
            // 🟡 Billiard 9-Ball
            // Solid outer sphere
            const g = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.05, x, y, r);
            g.addColorStop(0,   '#fde047');
            g.addColorStop(0.5, '#eab308');
            g.addColorStop(1,   '#713f12');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            // Center white patch
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, r*0.5, 0, Math.PI*2);
            ctx.fill();

            // Number '9'
            ctx.fillStyle = '#0f172a';
            ctx.font = `bold ${Math.round(r*0.6)}px Outfit, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('9', x, y + r*0.02);

        } else if (col.id === 'purple') {
            // 🎱 Bowling Ball
            const g = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.05, x, y, r);
            g.addColorStop(0,   '#c084fc');
            g.addColorStop(0.4, '#7c3aed');
            g.addColorStop(1,   '#3b0764');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            // 3 dark finger holes
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0f0728';
            ctx.beginPath();
            ctx.arc(x - r*0.24, y - r*0.3, r*0.12, 0, Math.PI*2);
            ctx.arc(x + r*0.24, y - r*0.3, r*0.12, 0, Math.PI*2);
            ctx.arc(x, y + r*0.1, r*0.12, 0, Math.PI*2);
            ctx.fill();

        } else if (col.id === 'orange') {
            // 🏀 Basketball
            const g = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.05, x, y, r);
            g.addColorStop(0,   '#fdba74');
            g.addColorStop(0.4, '#f97316');
            g.addColorStop(1,   '#7c2d12');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            // Ribs
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#270e04';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
            ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x - r*0.75, y, r*0.75, -Math.PI*0.38, Math.PI*0.38);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x + r*0.75, y, r*0.75, Math.PI*0.62, Math.PI*1.38);
            ctx.stroke();
        }

        // Gloss highlight overlay (universal)
        ctx.shadowBlur = 0;
        const hl = ctx.createRadialGradient(x - r*0.3, y - r*0.35, 0, x - r*0.2, y - r*0.2, r*0.55);
        hl.addColorStop(0,   'rgba(255,255,255,0.4)');
        hl.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        hl.addColorStop(1,   'rgba(255,255,255,0)');
        ctx.fillStyle = hl;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function getCanvasXY(e) {
        const rect = canvas.getBoundingClientRect();
        const src  = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left) * (canvas.width  / rect.width),
            y: (src.clientY - rect.top)  * (canvas.height / rect.height),
        };
    }

    canvas.addEventListener('pointerdown', function (e) {
        if (!state.running || state.gameOver || state.complete) return;
        const { x, y } = getCanvasXY(e);
        handleTap(x, y);
    });

    function handleTap(x, y) {
        state.hintTray = -1;
        state.hintBox  = -1;

        const trayCount = state.trays.length;
        for (let i = 0; i < trayCount; i++) {
            const r = getTrayRect(i);
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                dropFromTray(i);
                return;
            }
        }
    }

    function showHint() {
        state.hintTray = -1;
        state.hintBox  = -1;

        for (let i = 0; i < state.trays.length; i++) {
            const t = state.trays[i];
            if (t.marbles.length === 0) continue;
            const topColor = t.marbles[0].color;
            for (let b = 0; b < state.boxes.length; b++) {
                const box = state.boxes[b];
                if (!box.completed && box.color === topColor && box.slots.length < BOX_SLOTS) {
                    const hasBeltMarble = state.belt.some(s => s && s.color === topColor);
                    if (hasBeltMarble) {
                        state.hintBox  = b;
                        showToast(`Wait for the ${topColor} ball to pass!`);
                        return;
                    } else {
                        state.hintTray = i;
                        showToast(`Drop the ${topColor} ball from the tray!`);
                        return;
                    }
                }
            }
        }

        showToast('Think ahead! Check which colors match boxes.');
    }

    // Buttons
    document.getElementById('start-btn').addEventListener('click', function () {
        overlayStart.classList.add('hidden');
        const progress = loadSavedProgress();
        initLevel(progress.level);
        state.score = progress.score;
        updateHUD();
        resize();
        startLoop();
    });

    document.getElementById('next-level-btn').addEventListener('click', function () {
        overlayComplete.classList.add('hidden');
        initLevel(state.levelIdx + 1);
        resize();
        startLoop();
    });

    document.getElementById('lc-restart-btn').addEventListener('click', function () {
        overlayComplete.classList.add('hidden');
        initLevel(state.levelIdx);
        resize();
        startLoop();
    });

    document.getElementById('retry-btn').addEventListener('click', function () {
        overlayGameover.classList.add('hidden');
        initLevel(state.levelIdx);
        resize();
        startLoop();
    });

    document.getElementById('go-home-btn').addEventListener('click', function () {
        window.location.href = '../index.html';
    });

    document.getElementById('restart-btn').addEventListener('click', function () {
        if (!state.running && !state.gameOver && !state.complete) return;
        stopLoop();
        overlayComplete.classList.add('hidden');
        overlayGameover.classList.add('hidden');
        initLevel(state.levelIdx || 0);
        resize();
        startLoop();
    });

    document.getElementById('hint-btn').addEventListener('click', function () {
        if (!state.running) return;
        showHint();
    });

    resize();
    initLevel(0);
    resize();
    drawFrame();

})();
