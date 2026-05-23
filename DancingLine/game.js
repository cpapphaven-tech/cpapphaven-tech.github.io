/**
 * Dancing Line - Music Game
 */
(function () {
    'use strict';

    var BEST_KEY = 'dancingLine_best';

    var canvas = document.getElementById('game-canvas');
    var ctx = canvas.getContext('2d');
    var playArea = document.getElementById('play-area');
    var startScr = document.getElementById('start-screen');
    var lvlCompScr = document.getElementById('level-complete-screen');
    var gameOverScr = document.getElementById('game-over-screen');
    var startBtn = document.getElementById('start-btn');
    var restartBtn = document.getElementById('restart-btn');
    var nextLvlBtn = document.getElementById('next-level-btn');
    var hdrLevel = document.getElementById('hdr-level');
    var hdrScore = document.getElementById('hdr-score');
    var bestMenu = document.getElementById('best-menu');
    var completedLvl = document.getElementById('completed-level');
    var lvlScore = document.getElementById('level-score');
    var finalScore = document.getElementById('final-score');
    var bestScore = document.getElementById('best-score');
    var goTitle = document.getElementById('game-over-title');

    var W = 300, H = 400;
    var CELL = 50;
    var running = false, completed = false;
    var gameLoopId = null;
    var score = 0, level = 0;
    var line = { x: 5, y: 5, dir: 0, prog: 0, trail: [] };
    var cells = {};
    var totalGems = 0, collectedGems = 0;
    var lastTurn = 0;

    function resize() {
        var headerH = 54;
        W = Math.min(window.innerWidth, 500);
        H = window.innerHeight - headerH;
        canvas.width = W;
        canvas.height = H;
    }

    function k(x, y) { return x + ',' + y; }

    function genWorld() {
        cells = {}; totalGems = 0; collectedGems = 0;
        var cx = 5, cy = 5, dir = 0;
        for (var i = 0; i < 80; i++) {
            if (!cells[k(cx, cy)]) cells[k(cx, cy)] = { t: 1, gem: false };
            
            // Frequent turns for interesting serpentine paths
            if (i > 2 && i < 70) {
                if (Math.random() < 0.5) {  // 50% chance to turn
                    var opts = [];
                    for (var d = 0; d < 4; d++) if (d !== (dir + 2) % 4) opts.push(d);
                    if (opts.length) dir = opts[Math.floor(Math.random() * opts.length)];
                }
            }
            
            cx += (dir === 0 ? 1 : dir === 2 ? -1 : 0);
            cy += (dir === 1 ? 1 : dir === 3 ? -1 : 0);
            
            // Add obstacles alongside the path
            if (i > 3 && i < 70 && Math.random() < 0.2) {
                var ox = cx + (dir === 0 ? 1 : dir === 2 ? -1 : 0);
                var oy = cy + (dir === 1 ? 1 : dir === 3 ? -1 : 0);
                cells[k(ox, oy)] = { t: 2 };
            }
            
            // Add gems frequently - every 3-4 cells on the main path
            if (i > 0 && i < 70 && Math.random() < 0.35) {
                if (!cells[k(cx, cy)]) cells[k(cx, cy)] = { t: 1, gem: false };
                cells[k(cx, cy)].gem = true;
                totalGems++;
            }
        }
        line.x = 5; line.y = 5; line.dir = 0; line.prog = 0;
        line.trail = [];
    }

    function draw() {
        ctx.fillStyle = '#0d0d2a';
        ctx.fillRect(0, 0, W, H);

        var dx = line.dir === 0 ? 1 : line.dir === 2 ? -1 : 0;
        var dy = line.dir === 1 ? 1 : line.dir === 3 ? -1 : 0;
        var sx = W / 2 - (line.x * CELL + dx * line.prog * CELL);
        var sy = H / 2 - (line.y * CELL + dy * line.prog * CELL);

        var gs = Math.floor(-sx / CELL) - 2;
        var ge = gs + Math.ceil(W / CELL) + 4;
        var gs2 = Math.floor(-sy / CELL) - 2;
        var ge2 = gs2 + Math.ceil(H / CELL) + 4;

        for (var gx = gs; gx <= ge; gx++) {
            for (var gy = gs2; gy <= ge2; gy++) {
                var c = cells[k(gx, gy)];
                var px = gx * CELL + sx;
                var py = gy * CELL + sy;

                ctx.fillStyle = '#151530'; ctx.fillRect(px, py, CELL, CELL);
                ctx.strokeStyle = 'rgba(255,255,255,0.04)';
                ctx.strokeRect(px, py, CELL, CELL);

                if (!c) continue;

                if (c.t === 1) {
                    ctx.fillStyle = '#2a2a5a'; ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
                    if (c.gem) {
                        ctx.fillStyle = '#00f2fe';
                        ctx.beginPath();
                        ctx.arc(px + CELL / 2, py + CELL / 2, 8, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#fff';
                        ctx.beginPath();
                        ctx.arc(px + CELL / 2, py + CELL / 2, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                if (c.t === 2) {
                    ctx.fillStyle = '#ff3366';
                    ctx.fillRect(px + 5, py + 5, CELL - 10, CELL - 10);
                    ctx.fillStyle = '#ff6688';
                    ctx.fillRect(px + 8, py + 8, CELL - 16, 3);
                }
            }
        }

        // Trail
        for (var i = 0; i < line.trail.length; i++) {
            var t = line.trail[i];
            var tx = t.x * CELL + sx, ty = t.y * CELL + sy;
            var a = 0.2 + (i / line.trail.length) * 0.4;
            var sz = 3 + (i / line.trail.length) * 6;
            ctx.globalAlpha = a; ctx.fillStyle = '#00f2fe';
            ctx.beginPath(); ctx.arc(tx + CELL / 2, ty + CELL / 2, sz, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Head
        var hx = (line.x * CELL + dx * line.prog * CELL) + sx;
        var hy = (line.y * CELL + dy * line.prog * CELL) + sy;
        ctx.fillStyle = '#00f2fe';
        ctx.beginPath(); ctx.arc(hx + CELL / 2, hy + CELL / 2, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(hx + CELL / 2, hy + CELL / 2, 5, 0, Math.PI * 2); ctx.fill();

        // Progress
        var pct = totalGems > 0 ? collectedGems / totalGems : 0;
        var barW = Math.min(160, W - 20);
        var barX = (W - barW) / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(barX, 8, barW, 12);
        ctx.fillStyle = '#00f2fe'; ctx.fillRect(barX + 1, 9, Math.max(0, (barW - 2) * pct), 10);
        ctx.font = '8px sans-serif'; ctx.fillStyle = '#fff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('✦ ' + collectedGems + '/' + totalGems, barX + barW / 2, 14);
    }

    function update() {
        line.prog += 0.04;
        if (line.prog >= 1) {
            line.prog -= 1;
            var dx = line.dir === 0 ? 1 : line.dir === 2 ? -1 : 0;
            var dy = line.dir === 1 ? 1 : line.dir === 3 ? -1 : 0;
            line.x += dx; line.y += dy;
            line.trail.push({ x: line.x, y: line.y });
            if (line.trail.length > 15) line.trail.shift();

            var c = cells[k(line.x, line.y)];
            if (c && c.t === 2) { endGame(); return; }
            if (c && c.gem) {
                c.gem = false; collectedGems++; score += 10;
                hdrScore.textContent = '✦ ' + score;
                if (collectedGems >= Math.ceil(totalGems * 0.6)) { levelClear(); return; }
            }
        }
    }

    function levelClear() {
        running = false; completed = true;
        completedLvl.textContent = level + 1;
        lvlScore.textContent = score;
        var stars = lvlCompScr.querySelectorAll('.star');
        stars.forEach(function(s, i) { s.classList.toggle('active', i === 2); });
        lvlCompScr.classList.remove('hidden');
    }

    function endGame() {
        running = false;
        var best = parseInt(localStorage.getItem(BEST_KEY) || '0');
        if (score > best) localStorage.setItem(BEST_KEY, score.toString());
        finalScore.textContent = score;
        bestScore.textContent = Math.max(score, best);
        goTitle.textContent = '💥 CRASH!';
        goTitle.style.color = '#ff3366';
        gameOverScr.classList.remove('hidden');
    }

    function doTurn() {
        if (!running || completed) return;
        var now = Date.now();
        if (now - lastTurn < 200) return;
        lastTurn = now;
        line.dir = (line.dir + 1) % 4;
    }

    function gameLoop() {
        if (!running) return;
        update();
        draw();
        if (running) gameLoopId = setTimeout(gameLoop, 16);
    }

    function startGame() {
        score = 0; level = 0; running = true; completed = false;
        startScr.classList.add('hidden');
        gameOverScr.classList.add('hidden');
        lvlCompScr.classList.add('hidden');
        genWorld();
        hdrLevel.textContent = 'Dawn';
        hdrScore.textContent = '✦ 0';
        draw();
        if (gameLoopId) clearTimeout(gameLoopId);
        gameLoopId = setTimeout(gameLoop, 16);
    }

    function nextLevel() {
        level++;
        if (level >= 5) { endGame(); return; }
        running = true; completed = false;
        genWorld();
        lvlCompScr.classList.add('hidden');
        draw();
        if (gameLoopId) clearTimeout(gameLoopId);
        gameLoopId = setTimeout(gameLoop, 16);
    }

    // INPUT: map tap position to a cardinal direction
    function getTapDirection(clientX, clientY) {
        var rect = canvas.getBoundingClientRect();
        var mx = clientX - rect.left;
        var my = clientY - rect.top;
        // compute head screen position (canvas center in this camera)
        var headX = rect.width / 2;
        var headY = rect.height / 2;
        var dx = mx - headX;
        var dy = my - headY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        // if tap is very close to head, indicate a clockwise turn by returning null
        if (dist < 24) return null;
        var ang = Math.atan2(dy, dx) * 180 / Math.PI; // -180..180
        // Right: -45..45, Down: 45..135, Left: >=135 or <=-135, Up: -135..-45
        if (ang >= -45 && ang <= 45) return 0; // right
        if (ang > 45 && ang < 135) return 1; // down
        if (ang >= 135 || ang <= -135) return 2; // left
        return 3; // up
    }

    function handleTapAt(clientX, clientY) {
        if (!running || completed) return;
        var now = Date.now();
        if (now - lastTurn < 200) return; // throttle turns
        var desired = getTapDirection(clientX, clientY);
        if (desired === null) {
            // tap close to head -> rotate clockwise one step
            line.dir = (line.dir + 1) % 4;
            lastTurn = now;
            return;
        }
        // prevent immediate 180-degree reversal
        if (desired === (line.dir + 2) % 4) return;
        line.dir = desired;
        lastTurn = now;
    }

    // Replace global click/touch listeners with directional taps
    document.addEventListener('click', function(e) {
        var target = e.target;
        if (target === canvas || target.closest && (target.closest('#play-area') || target.closest('#game-container'))) {
            handleTapAt(e.clientX, e.clientY);
        }
    });

    document.addEventListener('touchstart', function(e) {
        if (!e.touches || e.touches.length === 0) return;
        var t = e.touches[0];
        var target = e.target;
        if (target === canvas || target.closest && (target.closest('#play-area') || target.closest('#game-container'))) {
            e.preventDefault();
            handleTapAt(t.clientX, t.clientY);
        }
    }, { passive: false });

    document.addEventListener('keydown', function(e) {
        if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowRight') && running && !completed) {
            e.preventDefault(); doTurn();
        }
    });

    // Button handlers
    startBtn.addEventListener('click', function(e) {
        startGame();
    });
    restartBtn.addEventListener('click', function(e) {
        startGame();
    });
    nextLvlBtn.addEventListener('click', function(e) {
        nextLevel();
    });

    // Resize
    window.addEventListener('resize', resize);

    // Init
    resize();
    startScr.classList.remove('hidden');
    gameOverScr.classList.add('hidden');
    lvlCompScr.classList.add('hidden');
    genWorld();
    var best = parseInt(localStorage.getItem(BEST_KEY) || '0');
    if (bestMenu) bestMenu.textContent = best > 0 ? '🏆 Best: ' + best : '';
    hdrLevel.textContent = 'Dawn';
    hdrScore.textContent = '✦ 0';
    draw();
})();