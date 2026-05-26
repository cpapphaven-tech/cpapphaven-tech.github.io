/* ============================================================
   Marble Sort: Color Puzzle – game.js
   Canvas-based game engine
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
    const MARBLE_R   = 16;      // marble radius (px)
    const BELT_SLOTS = 12;      // total slots on conveyor
    const BOX_SLOTS  = 3;       // marbles per box
    const BELT_SPEED = 0.4;     // belt scroll speed (slots/sec)

    // Colors: [fill, stroke/shadow]
    const COLOR_PALETTE = [
        { id:'red',    fill:'#ff4d6d', shadow:'#c9184a', label:'🔴' },
        { id:'blue',   fill:'#4cc9f0', shadow:'#0096c7', label:'🔵' },
        { id:'green',  fill:'#80ed99', shadow:'#2dc653', label:'🟢' },
        { id:'yellow', fill:'#ffd60a', shadow:'#e09800', label:'🟡' },
        { id:'purple', fill:'#c77dff', shadow:'#7b2d8b', label:'🟣' },
        { id:'orange', fill:'#ff9f1c', shadow:'#e07800', label:'🟠' },
    ];

    // ── Level Definitions ─────────────────────────────────────
    // Each level: colors used, tray count, boxes to fill to win
    const LEVELS = [
        { colors:['red','blue'],                    trays:3, boxTarget:4 },
        { colors:['red','blue','green'],             trays:4, boxTarget:5 },
        { colors:['red','blue','green','yellow'],    trays:5, boxTarget:6 },
        { colors:['red','blue','green','yellow','purple'], trays:6, boxTarget:7 },
        { colors:['red','blue','green','yellow','purple','orange'], trays:6, boxTarget:8 },
        { colors:['red','blue','green','yellow','purple','orange'], trays:6, boxTarget:10 },
        { colors:['red','blue','green','yellow','purple'], trays:6, boxTarget:12 },
        { colors:['red','blue','green','yellow','purple','orange'], trays:6, boxTarget:14 },
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
        canvas.height = Math.round(W * 1.52);    // ~portrait ratio
        if (state.running) drawFrame();
    }

    window.addEventListener('resize', resize);

    // ── Helper: get color def by id ───────────────────────────
    function getColor(id) {
        return COLOR_PALETTE.find(c => c.id === id) || COLOR_PALETTE[0];
    }

    function randColor(colors) {
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // ─────────────────────────────────────────────────────────
    //  INIT LEVEL
    // ─────────────────────────────────────────────────────────
    function initLevel(levelIdx) {
        const def = LEVELS[Math.min(levelIdx, LEVELS.length - 1)];

        // Build trays (top area): each tray has a queue of marbles
        const trayCount = def.trays;
        const trays = [];
        for (let i = 0; i < trayCount; i++) {
            // Each tray starts with 3-5 marbles of a chosen color
            const marbleCount = 3 + Math.floor(Math.random() * 3);
            const col = def.colors[i % def.colors.length];
            const marbles = [];
            for (let m = 0; m < marbleCount; m++) {
                marbles.push({ color: col, dropping: false, y: 0, vy: 0 });
            }
            trays.push({ marbles, colorHint: col });
        }

        // Belt: circular array of slots (null = empty, else {color, beltX, phase})
        const belt = new Array(BELT_SLOTS).fill(null);

        // Boxes (bottom): each box has a color and collected slots
        const boxColors = [...def.colors];
        // We create enough boxes, cycling colors
        const boxes = [];
        const boxCount = Math.min(def.colors.length, 5); // max 5 visible boxes
        for (let b = 0; b < boxCount; b++) {
            boxes.push({
                color: boxColors[b % boxColors.length],
                slots: [],       // array of color ids that have been packed
                completed: false,
                bounceAnim: 0,   // 0-1 completion animation
                replenishTimer: 0, // seconds until this box is replaced
            });
        }

        // Falling marble animation queue
        const fallingMarbles = [];

        state = {
            running: false,
            levelIdx,
            def,
            score: 0,
            boxesDone: 0,
            trays,
            belt,
            beltOffset: 0,      // fractional slot offset (0..1)
            boxes,
            fallingMarbles,
            gameOver: false,
            complete: false,
            hintTray: -1,       // highlighted tray index
            hintBox: -1,        // highlighted box index
            particles: [],       // burst particles
            totalBoxTarget: def.boxTarget,
            beltSpeed: BELT_SPEED + levelIdx * 0.04,
        };

        updateHUD();
    }

    // ─────────────────────────────────────────────────────────
    //  HUD
    // ─────────────────────────────────────────────────────────
    function updateHUD() {
        const lvlDisplay = state.levelIdx + 1;
        hudLevel.textContent  = lvlDisplay;
        hudScore.textContent  = state.score;
        hudBoxes.textContent  = state.boxesDone + '/' + state.totalBoxTarget;
        headerLevel.textContent = lvlDisplay;
    }

    // ─────────────────────────────────────────────────────────
    //  GAME LOOP
    // ─────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────
    //  UPDATE
    // ─────────────────────────────────────────────────────────
    function update(dt) {
        if (state.gameOver || state.complete) return;

        // ── Advance belt offset ──
        state.beltOffset += state.beltSpeed * dt;
        if (state.beltOffset >= 1) {
            state.beltOffset -= 1;
            // Shift belt slots: slot 0 is rightmost, shift left
            const tmp = state.belt[BELT_SLOTS - 1];
            for (let i = BELT_SLOTS - 1; i > 0; i--) {
                state.belt[i] = state.belt[i - 1];
            }
            state.belt[0] = tmp;
        }

        // ── Update falling marbles ──
        for (let i = state.fallingMarbles.length - 1; i >= 0; i--) {
            const fm = state.fallingMarbles[i];
            fm.vy += 1800 * dt;
            fm.y  += fm.vy * dt;

            if (fm.y >= fm.targetY) {
                // Land on belt
                fm.y = fm.targetY;
                const slotIdx = findFreeSlot();
                if (slotIdx === -1) {
                    // Belt is completely full
                    triggerGameOver('The conveyor belt is overloaded!');
                    return;
                }
                state.belt[slotIdx] = { color: fm.color, age: 0 };
                state.fallingMarbles.splice(i, 1);

                // Check game-over condition right after landing
                checkOverloadedBelt();
            }
        }

        // ── Update particles ──
        for (let i = state.particles.length - 1; i >= 0; i--) {
            const p = state.particles[i];
            p.x  += p.vx * dt;
            p.y  += p.vy * dt;
            p.vy += 400 * dt;
            p.life -= dt;
            if (p.life <= 0) state.particles.splice(i, 1);
        }

        // ── Box bounce decay & replenish timer ──
        for (const box of state.boxes) {
            if (box.bounceAnim > 0) box.bounceAnim = Math.max(0, box.bounceAnim - dt * 3);
            if (box.completed) {
                box.replenishTimer -= dt;
            }
        }

        // ── Replenish boxes when completed (after brief delay) ──
        replenishBoxes();

        // ── Refill trays that ran out ──
        refillEmptyTrays();
    }

    function findFreeSlot() {
        // Look for a null slot starting from entry point (slot 0)
        for (let i = 0; i < BELT_SLOTS; i++) {
            if (state.belt[i] === null) return i;
        }
        return -1;
    }

    function checkOverloadedBelt() {
        const full = state.belt.every(s => s !== null);
        if (!full) return;
        // Check if any marble on belt matches any non-full box
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
                // Replace with new box of a needed color
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
                // Refill with 3-4 marbles of a random level color
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
        // Count how many of each color are on belt + in trays
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
        // Pick color with most marbles available
        let best = def.colors[0], bestCount = -1;
        for (const c of def.colors) {
            if (counts[c] > bestCount) { bestCount = counts[c]; best = c; }
        }
        return best;
    }

    // ─────────────────────────────────────────────────────────
    //  DROP MARBLE from tray
    // ─────────────────────────────────────────────────────────
    function dropFromTray(trayIdx) {
        const tray = state.trays[trayIdx];
        if (!tray || tray.marbles.length === 0) {
            showToast('Tray is empty!');
            return;
        }
        const marble = tray.marbles.shift();
        const trayRect = getTrayRect(trayIdx);
        const beltY    = getBeltY();

        // Create falling marble animation
        state.fallingMarbles.push({
            color: marble.color,
            x: trayRect.cx,
            y: trayRect.cy,
            vy: 0,
            targetY: beltY,
        });
    }

    // ─────────────────────────────────────────────────────────
    //  PACK into box
    // ─────────────────────────────────────────────────────────
    function packIntoBox(boxIdx) {
        const box = state.boxes[boxIdx];
        if (!box || box.completed || box.slots.length >= BOX_SLOTS) return;

        // Find nearest matching marble on belt (by position, favour rightmost which is about to fall off)
        let foundSlot = -1;
        for (let i = BELT_SLOTS - 1; i >= 0; i--) {
            if (state.belt[i] && state.belt[i].color === box.color) {
                foundSlot = i;
                break;
            }
        }

        if (foundSlot === -1) {
            showToast('No ' + box.color + ' marble on belt!');
            return;
        }

        // Pack it
        state.belt[foundSlot] = null;
        box.slots.push(box.color);
        box.bounceAnim = 1;

        state.score += 10;
        updateHUD();

        // Emit particles at box position
        const br = getBoxRect(boxIdx);
        spawnParticles(br.cx, br.cy, getColor(box.color).fill, 10);

        if (box.slots.length === BOX_SLOTS) {
            // Box completed!
            box.completed = true;
            box.replenishTimer = 1.1;  // show ✓ for 1.1s before replacing
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

    // ─────────────────────────────────────────────────────────
    //  PARTICLES
    // ─────────────────────────────────────────────────────────
    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 200;
            state.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 80,
                color,
                r: 3 + Math.random() * 4,
                life: 0.5 + Math.random() * 0.4,
                maxLife: 0.9,
            });
        }
    }

    // ─────────────────────────────────────────────────────────
    //  TRIGGER GAME OVER / COMPLETE
    // ─────────────────────────────────────────────────────────
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
    }

    // ─────────────────────────────────────────────────────────
    //  LAYOUT HELPERS (relative to canvas)
    // ─────────────────────────────────────────────────────────
    function W() { return canvas.width; }
    function H() { return canvas.height; }

    // Tray area occupies top 40% of canvas
    function getTrayAreaH() { return H() * 0.40; }
    // Belt area is a horizontal strip in the middle
    function getBeltY()    { return getTrayAreaH() + H() * 0.07; }
    function getBeltH()    { return Math.round(MARBLE_R * 2.6); }
    // Box area is bottom 38%
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

    // ─────────────────────────────────────────────────────────
    //  DRAW
    // ─────────────────────────────────────────────────────────
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

    // ── Belt Fill Bar (danger indicator) ──
    function drawBeltFillBar() {
        const filled = state.belt ? state.belt.filter(s => s !== null).length : 0;
        const ratio  = filled / BELT_SLOTS;
        const bY     = getBeltY() + getBeltH() + 6;
        const bX     = 12;
        const bW     = W() - 24;
        const bH     = 5;

        // Track
        roundRect(ctx, bX, bY, bW, bH, bH / 2);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fill();

        // Fill colour: green → yellow → red
        let fillColor;
        if (ratio < 0.5)       fillColor = `rgba(74,222,128,${0.6 + ratio * 0.4})`;
        else if (ratio < 0.8)  fillColor = `rgba(251,191,36,${0.7 + ratio * 0.3})`;
        else                   fillColor = `rgba(248,113,113,${0.8 + ratio * 0.2})`;

        roundRect(ctx, bX, bY, bW * ratio, bH, bH / 2);
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '9px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('BELT ' + filled + '/' + BELT_SLOTS, bX, bY + 8);
    }

    // ── Background ──
    function drawBackground() {
        const grad = ctx.createLinearGradient(0, 0, 0, H());
        grad.addColorStop(0,   '#130826');
        grad.addColorStop(0.5, '#1a0a2e');
        grad.addColorStop(1,   '#0d0520');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W(), H());

        // Subtle grid dots
        ctx.fillStyle = 'rgba(168,85,247,0.05)';
        const step = 28;
        for (let x = 0; x < W(); x += step) {
            for (let y = 0; y < H(); y += step) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Divider between tray area and belt
        const belty = getTrayAreaH();
        ctx.strokeStyle = 'rgba(168,85,247,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, belty);
        ctx.lineTo(W(), belty);
        ctx.stroke();
    }

    // ── Trays ──
    function drawTrays() {
        const trayCount = state.trays.length;
        for (let i = 0; i < trayCount; i++) {
            const tray = state.trays[i];
            const r    = getTrayRect(i);
            const isHint = (i === state.hintTray);

            // Tray body (rounded rectangle)
            roundRect(ctx, r.x, r.y, r.w, r.h, 14);
            ctx.fillStyle = isHint
                ? 'rgba(168,85,247,0.35)'
                : 'rgba(255,255,255,0.07)';
            ctx.fill();
            ctx.strokeStyle = isHint
                ? 'rgba(168,85,247,0.9)'
                : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = isHint ? 2 : 1;
            ctx.stroke();

            if (tray.marbles.length === 0) {
                // Empty label
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.font = `bold ${Math.round(r.h * 0.22)}px Outfit, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('EMPTY', r.cx, r.cy);
                continue;
            }

            // Draw stacked marbles (max 4 visible)
            const visibleCount = Math.min(tray.marbles.length, 4);
            const marbleSpacing = Math.min((r.h - MARBLE_R * 2) / (visibleCount), MARBLE_R * 2.1);
            const baseY = r.y + r.h - MARBLE_R - 8;

            for (let m = 0; m < visibleCount; m++) {
                const marble = tray.marbles[m];
                const my     = baseY - m * marbleSpacing;
                const col    = getColor(marble.color);
                drawMarble(r.cx, my, MARBLE_R, col);
            }

            // Count badge if more marbles
            if (tray.marbles.length > 4) {
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.beginPath();
                ctx.arc(r.cx, r.y + 14, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 11px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+' + (tray.marbles.length - 4), r.cx, r.y + 14);
            }

            // Tap indicator
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = `bold ${Math.round(r.h * 0.16)}px Outfit, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('TAP', r.cx, r.y + 5);
        }
    }

    // ── Belt ──
    function drawBelt() {
        const bY  = getBeltY();
        const bH  = getBeltH();
        const pad = 10;
        const bX  = pad;
        const bW  = W() - pad * 2;

        // Belt track
        roundRect(ctx, bX, bY, bW, bH, bH / 2);
        const beltGrad = ctx.createLinearGradient(0, bY, 0, bY + bH);
        beltGrad.addColorStop(0, '#2a1052');
        beltGrad.addColorStop(0.5, '#1c0840');
        beltGrad.addColorStop(1, '#2a1052');
        ctx.fillStyle = beltGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(168,85,247,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Belt lines (moving animation)
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, bX + 2, bY + 2, bW - 4, bH - 4, (bH - 4) / 2);
        ctx.clip();
        const lineSpacing = 28;
        const offset = (state.beltOffset * lineSpacing) % lineSpacing;
        ctx.strokeStyle = 'rgba(168,85,247,0.15)';
        ctx.lineWidth = 1;
        for (let lx = bX - lineSpacing + offset; lx < bX + bW + lineSpacing; lx += lineSpacing) {
            ctx.beginPath();
            ctx.moveTo(lx, bY);
            ctx.lineTo(lx, bY + bH);
            ctx.stroke();
        }
        ctx.restore();

        // Draw marbles on belt
        const slotW = bW / BELT_SLOTS;
        const cy    = bY + bH / 2;

        for (let i = 0; i < BELT_SLOTS; i++) {
            const slot = state.belt[i];
            if (!slot) continue;
            // Position with belt scroll
            const rawX  = bX + slotW * (i + 0.5) + state.beltOffset * slotW;
            // Wrap within belt
            const x = bX + ((rawX - bX) % bW + bW) % bW;
            if (x < bX + MARBLE_R || x > bX + bW - MARBLE_R) continue; // clip ends
            const col = getColor(slot.color);
            drawMarble(x, cy, MARBLE_R - 1, col);
        }

        // Arrow hint (direction)
        ctx.fillStyle = 'rgba(168,85,247,0.3)';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('→', bX + bW - 6, bY + bH / 2);
    }

    // ── Boxes ──
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

            // Box body
            roundRect(ctx, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 14);
            const boxGrad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
            if (box.completed) {
                boxGrad.addColorStop(0, 'rgba(80,220,100,0.25)');
                boxGrad.addColorStop(1, 'rgba(80,220,100,0.10)');
            } else {
                boxGrad.addColorStop(0, `${col.fill}22`);
                boxGrad.addColorStop(1, `${col.fill}0a`);
            }
            ctx.fillStyle = boxGrad;
            ctx.fill();
            ctx.strokeStyle = isHint
                ? col.fill
                : (box.completed ? 'rgba(80,220,100,0.7)' : `${col.fill}55`);
            ctx.lineWidth = isHint ? 2.5 : 1.5;
            ctx.stroke();

            // Color label on top
            ctx.fillStyle = col.fill;
            ctx.font = `bold ${Math.round(r.h * 0.17)}px Outfit, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(col.id.toUpperCase(), r.cx, r.y + 6);

            if (box.completed) {
                // Completed tick
                ctx.fillStyle = '#4ade80';
                ctx.font = `${Math.round(r.h * 0.4)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✓', r.cx, r.cy + 4);
            } else {
                // Draw slot indicators
                const slotR    = Math.min(r.w * 0.11, 12);
                const totalSlotW = BOX_SLOTS * slotR * 2 + (BOX_SLOTS - 1) * 6;
                const startX  = r.cx - totalSlotW / 2;
                const slotY   = r.y + r.h * 0.55;

                for (let s = 0; s < BOX_SLOTS; s++) {
                    const sx = startX + s * (slotR * 2 + 6) + slotR;
                    if (s < box.slots.length) {
                        // Filled slot – draw marble
                        drawMarble(sx, slotY, slotR, col);
                    } else {
                        // Empty slot
                        ctx.beginPath();
                        ctx.arc(sx, slotY, slotR, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(255,255,255,0.07)';
                        ctx.fill();
                        ctx.strokeStyle = `${col.fill}44`;
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }
                }

                // TAP hint
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.font = `${Math.round(r.h * 0.13)}px Outfit, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText('TAP TO PACK', r.cx, r.y + r.h - 4);
            }

            ctx.restore();
        }
    }

    // ── Falling Marbles ──
    function drawFallingMarbles() {
        for (const fm of state.fallingMarbles) {
            const col = getColor(fm.color);
            drawMarble(fm.x, fm.y, MARBLE_R, col);
        }
    }

    // ── Particles ──
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

    // ── Draw Marble helper ──
    function drawMarble(x, y, r, col) {
        // Shadow glow
        ctx.shadowColor = col.shadow;
        ctx.shadowBlur  = 10;

        // Main sphere gradient
        const g = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.05, x, y, r);
        g.addColorStop(0,   '#ffffff');
        g.addColorStop(0.2, col.fill);
        g.addColorStop(0.7, col.fill);
        g.addColorStop(1,   col.shadow);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // Highlight
        ctx.shadowBlur = 0;
        const hl = ctx.createRadialGradient(x - r*0.3, y - r*0.35, 0, x - r*0.2, y - r*0.2, r*0.55);
        hl.addColorStop(0,   'rgba(255,255,255,0.7)');
        hl.addColorStop(0.5, 'rgba(255,255,255,0.15)');
        hl.addColorStop(1,   'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = hl;
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    // ── Rounded Rect helper ──
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

    // ─────────────────────────────────────────────────────────
    //  INPUT: Tap / Click
    // ─────────────────────────────────────────────────────────
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

        // Check trays (top portion)
        const trayCount = state.trays.length;
        for (let i = 0; i < trayCount; i++) {
            const r = getTrayRect(i);
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                dropFromTray(i);
                return;
            }
        }

        // Check boxes (bottom portion)
        for (let b = 0; b < state.boxes.length; b++) {
            const r = getBoxRect(b);
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                packIntoBox(b);
                return;
            }
        }
    }

    // ─────────────────────────────────────────────────────────
    //  HINT
    // ─────────────────────────────────────────────────────────
    function showHint() {
        state.hintTray = -1;
        state.hintBox  = -1;

        // Find a tray whose color matches an unfilled box
        for (let i = 0; i < state.trays.length; i++) {
            const t = state.trays[i];
            if (t.marbles.length === 0) continue;
            const topColor = t.marbles[0].color;
            // Check if this color is on belt and matches a box
            for (let b = 0; b < state.boxes.length; b++) {
                const box = state.boxes[b];
                if (!box.completed && box.color === topColor && box.slots.length < BOX_SLOTS) {
                    const hasBeltMarble = state.belt.some(s => s && s.color === topColor);
                    if (hasBeltMarble) {
                        state.hintBox  = b;
                        showToast(`Pack ${topColor} marble into box!`);
                        return;
                    } else {
                        state.hintTray = i;
                        showToast(`Drop ${topColor} marble from tray!`);
                        return;
                    }
                }
            }
        }

        showToast('Think ahead! Check which colors match boxes.');
    }

    // ─────────────────────────────────────────────────────────
    //  BUTTON EVENTS
    // ─────────────────────────────────────────────────────────
    document.getElementById('start-btn').addEventListener('click', function () {
        overlayStart.classList.add('hidden');
        initLevel(0);
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

    // ─────────────────────────────────────────────────────────
    //  INIT
    // ─────────────────────────────────────────────────────────
    resize();
    // Pre-init so canvas looks right before starting
    initLevel(0);
    resize();
    // Draw a static first frame
    drawFrame();

})();
