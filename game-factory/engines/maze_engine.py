#!/usr/bin/env python3
"""
Maze Engine Archetype (Archetype: 'maze')
Procedural labyrinth generator (Recursive Backtracker), fog-of-war dynamic lighting,
player navigation with swipe/buttons/keyboard, crystal collection, and exit portal escape.
"""

ARCHETYPE = "maze"
PRIMARY_MECHANIC = "maze-pathfinding"
DEFAULT_MECHANICS = ["maze-pathfinding", "fog-of-war", "crystal-collection", "timer-countdown", "exit-portal"]
DEFAULT_CONTROLS = ["touch", "keyboard", "mouse"]
GAMEPLAY_LOOP = "navigate procedural neon labyrinth, collect power crystals, and reach the exit portal before battery depletes"

def generate(game_title="Neon Maze Escape", folder_name="NeonMaze", **kwargs):
    slug = folder_name.lower()

    # 1. game.html (STRICTLY NO ads.js and NO #bottom-ad!)
    game_html = f'''<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>{game_title} | PlayMixGames</title>
    <meta name="description" content="Navigate procedural neon mazes, collect power crystals, and find the escape portal before battery runs out!">
    
    <link rel="stylesheet" href="style.css">
    <script type="module" src="../analytics.js"></script>
    <script defer src="game.js"></script>
</head>

<body>
    <div class="game-wrapper">
        <!-- Top HUD -->
        <header class="game-hud">
            <div class="hud-card">
                <span class="hud-label">STAGE</span>
                <span class="hud-val" id="stage-val">1</span>
            </div>
            <div class="hud-card">
                <span class="hud-label">CRYSTALS</span>
                <span class="hud-val" id="crystal-val">0/5</span>
            </div>
            <div class="hud-card timer-card">
                <span class="hud-label">BATTERY</span>
                <span class="hud-val" id="timer-val">45s</span>
            </div>
            <div class="hud-card best-card">
                <span class="hud-label">SCORE</span>
                <span class="hud-val" id="score-val">0</span>
            </div>
            <div class="hud-controls">
                <button id="btn-sound" class="icon-btn" aria-label="Sound" title="Sound">🔊</button>
            </div>
        </header>

        <!-- Canvas Play Area -->
        <div class="canvas-container" id="canvas-container">
            <canvas id="game-canvas"></canvas>
            
            <!-- Mobile Virtual D-Pad Touch Controls -->
            <div class="virtual-dpad" id="virtual-dpad">
                <button class="dpad-btn up" data-dir="up">▲</button>
                <div class="dpad-middle">
                    <button class="dpad-btn left" data-dir="left">◀</button>
                    <div class="dpad-center">●</div>
                    <button class="dpad-btn right" data-dir="right">▶</button>
                </div>
                <button class="dpad-btn down" data-dir="down">▼</button>
            </div>

            <!-- Swipe / Tap Hint -->
            <div class="swipe-hint" id="swipe-hint">
                <span>👆 Swipe or use D-Pad to move!</span>
            </div>
        </div>
    </div>

    <!-- Stage Complete Modal -->
    <div class="modal" id="stage-modal">
        <div class="modal-box">
            <h2 class="modal-title win-title">PORTAL ESCAPED! 🌀</h2>
            <p class="modal-text">Stage clear! Power restored to cyber core.</p>
            <div class="score-summary">
                <div>Bonus: <strong id="stage-bonus">+500</strong></div>
                <div>Total Score: <strong id="stage-total">0</strong></div>
            </div>
            <button class="action-btn" id="btn-next-stage">NEXT MAZE ➔</button>
        </div>
    </div>

    <!-- Game Over Modal -->
    <div class="modal" id="gameover-modal">
        <div class="modal-box">
            <h2 class="modal-title lose-title">BATTERY DEPLETED! ⚡</h2>
            <p class="modal-text">The labyrinth darkness overtook your core.</p>
            <div class="score-summary">
                <div>Final Score: <strong id="final-score">0</strong></div>
                <div>Best Score: <strong id="final-best">0</strong></div>
            </div>
            <div class="record-badge" id="record-badge" style="display: none;">🏆 NEW HIGH SCORE! 🏆</div>
            <button class="action-btn" id="btn-restart">RETRY MAZE 🔄</button>
        </div>
    </div>
</body>

</html>
'''

    # 2. style.css (with 65px bottom padding for ad clearance)
    style_css = '''/* Neon Maze Escape — Cyber Labyrinth Styling & Mobile Layout */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
}

body {
    background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
}

/* Container wrapper with bottom clearance for outer bottom ad */
.game-wrapper {
    width: 100%;
    max-width: 480px;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 8px 10px 65px; /* 65px ensures bottom ad never covers controls */
}

/* Top HUD */
.game-hud {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 4px 8px;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 14px;
    margin-bottom: 6px;
    flex-shrink: 0;
}

.hud-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(2, 6, 23, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 2px 8px;
    min-width: 54px;
}

.hud-label {
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.6px;
    color: #94a3b8;
}

.hud-val {
    font-size: 1.05rem;
    font-weight: 900;
    color: #38bdf8;
    line-height: 1.2;
}

.timer-card .hud-val {
    color: #f59e0b;
}

.best-card .hud-val {
    color: #10b981;
}

.hud-controls {
    display: flex;
    gap: 4px;
}

.icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(2, 6, 23, 0.7);
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #f8fafc;
    font-size: 0.95rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.icon-btn:hover {
    background: rgba(56, 189, 248, 0.2);
}

/* Canvas Area */
.canvas-container {
    flex: 1;
    width: 100%;
    position: relative;
    border-radius: 16px;
    background: #020617;
    border: 2px solid rgba(56, 189, 248, 0.3);
    box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.8), 0 8px 32px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    touch-action: none;
}

#game-canvas {
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
}

/* Virtual D-Pad for Mobile Touch */
.virtual-dpad {
    position: absolute;
    bottom: 12px;
    right: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    z-index: 20;
    opacity: 0.75;
    transition: opacity 0.2s;
}

.virtual-dpad:hover,
.virtual-dpad:active {
    opacity: 1;
}

.dpad-middle {
    display: flex;
    align-items: center;
    gap: 3px;
}

.dpad-center {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(56, 189, 248, 0.5);
    font-size: 0.8rem;
}

.dpad-btn {
    width: 44px;
    height: 44px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 10px;
    color: #38bdf8;
    font-size: 1.1rem;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
    transition: transform 0.1s, background 0.1s;
}

.dpad-btn:active {
    transform: scale(0.92);
    background: rgba(56, 189, 248, 0.35);
    color: white;
}

/* Swipe Hint */
.swipe-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.4);
    padding: 8px 16px;
    border-radius: 20px;
    color: #38bdf8;
    font-weight: 700;
    font-size: 0.85rem;
    pointer-events: none;
    transition: opacity 0.4s;
    animation: pulse-hint 1.5s infinite;
}

@keyframes pulse-hint {
    0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(0.98); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.02); }
}

.swipe-hint.hidden {
    animation: none;
    opacity: 0 !important;
    pointer-events: none;
    visibility: hidden;
}

/* Modals */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.25s ease;
    padding: 16px;
}

.modal.active {
    opacity: 1;
    visibility: visible;
}

.modal-box {
    background: #0f172a;
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 18px;
    width: 100%;
    max-width: 330px;
    padding: 24px;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
    transform: scale(0.92);
    transition: transform 0.25s ease;
}

.modal.active .modal-box {
    transform: scale(1);
}

.modal-title {
    font-size: 1.4rem;
    font-weight: 900;
    margin-bottom: 8px;
}

.win-title { color: #10b981; }
.lose-title { color: #ef4444; }

.modal-text {
    color: #94a3b8;
    font-size: 0.9rem;
    margin-bottom: 16px;
}

.score-summary {
    background: #020617;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-around;
    font-size: 0.95rem;
    color: #cbd5e1;
}

.score-summary strong {
    color: #38bdf8;
    font-size: 1.15rem;
}

.record-badge {
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    color: white;
    font-weight: 900;
    font-size: 0.82rem;
    padding: 6px;
    border-radius: 8px;
    margin-bottom: 14px;
}

.action-btn {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    background: linear-gradient(135deg, #0ea5e9, #38bdf8);
    border: none;
    color: #020617;
    font-weight: 900;
    font-size: 1rem;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(56, 189, 248, 0.35);
    transition: transform 0.2s;
}

.action-btn:hover {
    transform: translateY(-2px);
}
'''

    # 3. game.js (Complete procedural maze generation, fog of war, audio synth)
    game_js = '''// Neon Maze Escape — Procedural Recursive Backtracker Engine & Fog of War
(function () {
    'use strict';

    // Sound Synthesizer via Web Audio API
    const Sound = {
        ctx: null,
        enabled: true,

        init() {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            } catch (e) {
                console.warn('AudioContext not supported');
            }
        },

        resume() {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        },

        playMove() {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.07);
        },

        playCrystal() {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            [880, 1174.66, 1396.91].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                gain.gain.setValueAtTime(0.14, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.22);
            });
        },

        playPortal() {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            const chords = [523.25, 659.25, 783.99, 1046.5];
            chords.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gain.gain.setValueAtTime(0.15, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.38);
            });
        },

        playGameOver() {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.48);
        }
    };

    // Particle
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.r = 2 + Math.random() * 3;
            this.color = color;
            this.alpha = 1;
            this.decay = 0.03 + Math.random() * 0.03;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }

        draw(ctx) {
            if (this.alpha <= 0) return;
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Procedural Maze Generator (Recursive Backtracker)
    class MazeGrid {
        constructor(cols, rows) {
            this.cols = cols;
            this.rows = rows;
            // Cell bitmask: Top=1, Right=2, Bottom=4, Left=8
            this.walls = new Array(cols * rows).fill(15);
            this.visited = new Array(cols * rows).fill(false);
            this.generate();
        }

        idx(c, r) {
            if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return -1;
            return r * this.cols + c;
        }

        generate() {
            const stack = [];
            let current = 0;
            this.visited[current] = true;

            while (true) {
                const c = current % this.cols;
                const r = Math.floor(current / this.cols);
                const neighbors = [];

                // Top (1), Right (2), Bottom (4), Left (8)
                if (r > 0 && !this.visited[this.idx(c, r - 1)]) neighbors.push({ dir: 'top', idx: this.idx(c, r - 1), bit: 1, opp: 4 });
                if (c < this.cols - 1 && !this.visited[this.idx(c + 1, r)]) neighbors.push({ dir: 'right', idx: this.idx(c + 1, r), bit: 2, opp: 8 });
                if (r < this.rows - 1 && !this.visited[this.idx(c, r + 1)]) neighbors.push({ dir: 'bottom', idx: this.idx(c, r + 1), bit: 4, opp: 1 });
                if (c > 0 && !this.visited[this.idx(c - 1, r)]) neighbors.push({ dir: 'left', idx: this.idx(c - 1, r), bit: 8, opp: 2 });

                if (neighbors.length > 0) {
                    const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                    this.walls[current] &= ~chosen.bit;
                    this.walls[chosen.idx] &= ~chosen.opp;
                    this.visited[chosen.idx] = true;
                    stack.push(current);
                    current = chosen.idx;
                } else if (stack.length > 0) {
                    current = stack.pop();
                } else {
                    break;
                }
            }
        }
    }

    // Main Game Controller
    class NeonMazeGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.container = document.getElementById('canvas-container');

            this.stage = 1;
            this.score = 0;
            this.bestScore = parseInt(localStorage.getItem('pmg_neon_maze_best'), 10) || 0;
            this.timeLeft = 45;
            this.gameOver = false;
            this.stageClear = false;

            this.dom = {
                stageVal: document.getElementById('stage-val'),
                crystalVal: document.getElementById('crystal-val'),
                timerVal: document.getElementById('timer-val'),
                scoreVal: document.getElementById('score-val'),
                btnSound: document.getElementById('btn-sound'),
                swipeHint: document.getElementById('swipe-hint'),
                stageModal: document.getElementById('stage-modal'),
                stageBonus: document.getElementById('stage-bonus'),
                stageTotal: document.getElementById('stage-total'),
                btnNextStage: document.getElementById('btn-next-stage'),
                gameoverModal: document.getElementById('gameover-modal'),
                finalScore: document.getElementById('final-score'),
                finalBest: document.getElementById('final-best'),
                recordBadge: document.getElementById('record-badge'),
                btnRestart: document.getElementById('btn-restart')
            };

            this.dom.finalBest.textContent = this.bestScore;
            this.particles = [];

            this.initStage(1);
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.initControls();

            // Loop
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.loop(t));

            // Timer ticker
            setInterval(() => {
                if (!this.gameOver && !this.stageClear && this.timeLeft > 0) {
                    this.timeLeft--;
                    this.dom.timerVal.textContent = this.timeLeft + 's';
                    if (this.timeLeft <= 0) {
                        this.triggerGameOver();
                    }
                }
            }, 1000);
        }

        initStage(stageNum) {
            this.stage = stageNum;
            this.stageClear = false;
            this.gameOver = false;
            this.timeLeft = Math.max(30, 50 - (stageNum * 3));
            this.dom.stageVal.textContent = this.stage;
            this.dom.timerVal.textContent = this.timeLeft + 's';

            // Maze grid dimensions escalate
            const cols = Math.min(19, 11 + (stageNum * 2));
            const rows = Math.min(27, 15 + (stageNum * 2));
            this.maze = new MazeGrid(cols, rows);

            // Player starts at top-left (0,0)
            this.player = {
                c: 0,
                r: 0,
                x: 0,
                y: 0,
                targetX: 0,
                targetY: 0,
                radius: 7,
                lightRadius: 110,
                auraPulse: 0
            };

            // Exit portal at bottom-right
            this.portal = {
                c: cols - 1,
                r: rows - 1,
                pulse: 0
            };

            // Spawn power crystals in dead-ends or spread evenly
            this.crystals = [];
            const crystalCount = 4 + stageNum;
            for (let i = 0; i < crystalCount; i++) {
                let cc, cr;
                do {
                    cc = Math.floor(Math.random() * cols);
                    cr = Math.floor(Math.random() * rows);
                } while ((cc === 0 && cr === 0) || (cc === this.portal.c && cr === this.portal.r));
                this.crystals.push({ c: cc, r: cr, collected: false, pulse: Math.random() * Math.PI });
            }

            this.totalCrystals = this.crystals.length;
            this.collectedCrystals = 0;
            this.updateCrystalHUD();

            this.cameraX = 0;
            this.cameraY = 0;
        }

        updateCrystalHUD() {
            this.dom.crystalVal.textContent = `${this.collectedCrystals}/${this.totalCrystals}`;
        }

        resize() {
            const rect = this.container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            this.cellSize = Math.max(26, Math.min(38, (rect.width * dpr) / 13));
        }

        initControls() {
            Sound.init();

            const move = (dir) => {
                if (this.gameOver || this.stageClear) return;
                this.dom.swipeHint.classList.add('hidden');

                const c = this.player.c;
                const r = this.player.r;
                const cellWalls = this.maze.walls[this.maze.idx(c, r)];

                let moved = false;
                if (dir === 'up' && !(cellWalls & 1)) { this.player.r--; moved = true; }
                else if (dir === 'right' && !(cellWalls & 2)) { this.player.c++; moved = true; }
                else if (dir === 'down' && !(cellWalls & 4)) { this.player.r++; moved = true; }
                else if (dir === 'left' && !(cellWalls & 8)) { this.player.c--; moved = true; }

                if (moved) {
                    Sound.playMove();
                    this.checkPickups();
                }
            };

            // Keyboard
            window.addEventListener('keydown', (e) => {
                if (e.code === 'ArrowUp' || e.code === 'KeyW') move('up');
                if (e.code === 'ArrowRight' || e.code === 'KeyD') move('right');
                if (e.code === 'ArrowDown' || e.code === 'KeyS') move('down');
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') move('left');
            });

            // Virtual D-Pad buttons
            document.querySelectorAll('.dpad-btn').forEach(btn => {
                btn.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    move(btn.getAttribute('data-dir'));
                });
            });

            // Touch Swipes on Canvas
            let touchStartX = 0, touchStartY = 0;
            this.canvas.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                this.dom.swipeHint.classList.add('hidden');
            }, { passive: true });

            this.canvas.addEventListener('touchend', (e) => {
                const dx = e.changedTouches[0].clientX - touchStartX;
                const dy = e.changedTouches[0].clientY - touchStartY;
                if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                        move(dx > 0 ? 'right' : 'left');
                    } else {
                        move(dy > 0 ? 'down' : 'up');
                    }
                }
            }, { passive: true });

            // UI Actions
            this.dom.btnSound.addEventListener('click', () => {
                Sound.enabled = !Sound.enabled;
                this.dom.btnSound.textContent = Sound.enabled ? '🔊' : '🔇';
            });

            this.dom.btnNextStage.addEventListener('click', () => {
                this.dom.stageModal.classList.remove('active');
                this.initStage(this.stage + 1);
            });

            this.dom.btnRestart.addEventListener('click', () => {
                this.dom.gameoverModal.classList.remove('active');
                this.score = 0;
                this.dom.scoreVal.textContent = '0';
                this.initStage(1);
            });
        }

        checkPickups() {
            const pc = this.player.c;
            const pr = this.player.r;

            // Crystals
            for (let cr of this.crystals) {
                if (!cr.collected && cr.c === pc && cr.r === pr) {
                    cr.collected = true;
                    this.collectedCrystals++;
                    this.score += 100;
                    this.dom.scoreVal.textContent = this.score;
                    this.updateCrystalHUD();
                    Sound.playCrystal();

                    // Sparkles
                    const px = (pc + 0.5) * this.cellSize;
                    const py = (pr + 0.5) * this.cellSize;
                    for (let i = 0; i < 15; i++) {
                        this.particles.push(new Particle(px, py, '#38bdf8'));
                    }
                }
            }

            // Exit Portal
            if (pc === this.portal.c && pr === this.portal.r) {
                this.triggerStageClear();
            }
        }

        triggerStageClear() {
            if (this.stageClear) return;
            this.stageClear = true;
            Sound.playPortal();

            const timeBonus = this.timeLeft * 20;
            const crystalBonus = this.collectedCrystals * 50;
            const totalStageBonus = 300 + timeBonus + crystalBonus;
            this.score += totalStageBonus;
            this.dom.scoreVal.textContent = this.score;

            this.dom.stageBonus.textContent = `+${totalStageBonus}`;
            this.dom.stageTotal.textContent = this.score;
            this.dom.stageModal.classList.add('active');
        }

        triggerGameOver() {
            if (this.gameOver) return;
            this.gameOver = true;
            Sound.playGameOver();

            this.dom.finalScore.textContent = this.score;
            this.dom.finalBest.textContent = this.bestScore;

            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.dom.finalBest.textContent = this.bestScore;
                localStorage.setItem('pmg_neon_maze_best', this.bestScore);
                this.dom.recordBadge.style.display = 'block';
            } else {
                this.dom.recordBadge.style.display = 'none';
            }

            this.dom.gameoverModal.classList.add('active');
        }

        update() {
            // Smooth player position interpolation
            const targetX = (this.player.c + 0.5) * this.cellSize;
            const targetY = (this.player.r + 0.5) * this.cellSize;
            this.player.x += (targetX - this.player.x) * 0.35;
            this.player.y += (targetY - this.player.y) * 0.35;

            this.player.auraPulse += 0.05;
            this.portal.pulse += 0.08;

            // Camera smoothly centers player
            const viewW = this.canvas.width;
            const viewH = this.canvas.height;
            const targetCamX = viewW / 2 - this.player.x;
            const targetCamY = viewH / 2 - this.player.y;
            this.cameraX += (targetCamX - this.cameraX) * 0.15;
            this.cameraY += (targetCamY - this.cameraY) * 0.15;

            // Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.update();
                if (p.alpha <= 0) this.particles.splice(i, 1);
            }
        }

        draw() {
            const ctx = this.ctx;
            const cs = this.cellSize;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.save();
            ctx.translate(this.cameraX, this.cameraY);

            // 1. Draw Maze Floor & Walls
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#0ea5e9';
            ctx.shadowBlur = 8;
            ctx.lineCap = 'round';

            for (let r = 0; r < this.maze.rows; r++) {
                for (let c = 0; c < this.maze.cols; c++) {
                    const x = c * cs;
                    const y = r * cs;
                    const w = this.maze.walls[this.maze.idx(c, r)];

                    ctx.beginPath();
                    if (w & 1) { ctx.moveTo(x, y); ctx.lineTo(x + cs, y); } // Top
                    if (w & 2) { ctx.moveTo(x + cs, y); ctx.lineTo(x + cs, y + cs); } // Right
                    if (w & 4) { ctx.moveTo(x, y + cs); ctx.lineTo(x + cs, y + cs); } // Bottom
                    if (w & 8) { ctx.moveTo(x, y); ctx.lineTo(x, y + cs); } // Left
                    ctx.stroke();
                }
            }
            ctx.shadowBlur = 0;

            // 2. Draw Crystals
            for (let cr of this.crystals) {
                if (cr.collected) continue;
                cr.pulse += 0.05;
                const cx = (cr.c + 0.5) * cs;
                const cy = (cr.r + 0.5) * cs;
                const r = 5 + Math.sin(cr.pulse) * 1.5;

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#38bdf8';
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(0, -r);
                ctx.lineTo(r, 0);
                ctx.lineTo(0, r);
                ctx.lineTo(-r, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            // 3. Draw Exit Portal
            const pX = (this.portal.c + 0.5) * cs;
            const pY = (this.portal.r + 0.5) * cs;
            ctx.save();
            ctx.translate(pX, pY);
            ctx.strokeStyle = '#10b981';
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 15;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, cs * 0.38 + Math.sin(this.portal.pulse) * 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.fill();
            ctx.restore();

            // 4. Draw Player Orb
            ctx.save();
            ctx.translate(this.player.x, this.player.y);
            ctx.fillStyle = '#f43f5e';
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
            ctx.fill();

            // Inner core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.player.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 5. Draw Particles
            for (let p of this.particles) p.draw(ctx);

            ctx.restore(); // end camera

            // 6. Fog of War Dynamic Darkness Mask
            // Gradient darkens everything outside player's light radius
            const screenPX = this.player.x + this.cameraX;
            const screenPY = this.player.y + this.cameraY;
            const lightRad = this.player.lightRadius + Math.sin(this.player.auraPulse) * 8;

            const fog = ctx.createRadialGradient(screenPX, screenPY, lightRad * 0.4, screenPX, screenPY, lightRad * 1.3);
            fog.addColorStop(0, 'rgba(2, 6, 23, 0)');
            fog.addColorStop(0.7, 'rgba(2, 6, 23, 0.7)');
            fog.addColorStop(1, 'rgba(2, 6, 23, 0.96)');

            ctx.fillStyle = fog;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        loop(time) {
            this.update();
            this.draw();
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        new NeonMazeGame();
    });
})();
'''

    # Rich SEO and Strategy Content
    seo_body = f'''
    <p>Welcome to <strong>{game_title}</strong>, a procedural cyber labyrinth puzzle game! Trapped within an expanding digital maze, you must guide your glowing cyber core through darkened corridors, locate power crystals to boost your score, and find the escape portal before your battery depletes.</p>
    <div class="highlight-box">
        <strong>✨ Game Highlights:</strong> Infinite procedural mazes via Recursive Backtracking, dynamic fog-of-war lighting, intuitive mobile swipe and virtual D-Pad controls, battery countdown pressure, and stage progression!
    </div>
    <h2>🎮 How to Play {game_title}</h2>
    <ol>
        <li><strong>Navigate the Corridors:</strong> Swipe in any of the 4 cardinal directions, use the on-screen virtual D-Pad, or press WASD/Arrow keys on desktop.</li>
        <li><strong>Overcome the Fog of War:</strong> Your cyber orb only illuminates a small radius. Explore carefully to map out pathways and dead ends.</li>
        <li><strong>Collect Power Crystals:</strong> Blue data crystals are scattered in secluded corners. Each crystal awards +100 bonus points!</li>
        <li><strong>Reach the Escape Portal:</strong> Find the shimmering green portal at the far end of the maze to clear the stage and recharge your battery.</li>
    </ol>
    '''

    faq_section = f'''
    <div class="faq-card">
        <h4>Q: Are the mazes random every game?</h4>
        <p>A: Yes! Every single stage is procedurally generated using an algorithm that guarantees a unique labyrinth with solvable pathways every time.</p>
    </div>
    <div class="faq-card">
        <h4>Q: How do mobile touch controls work?</h4>
        <p>A: You can either swipe anywhere on the game screen to glide around corners, or tap the responsive on-screen virtual D-Pad buttons.</p>
    </div>
    '''

    blog_content = f'''
    <h2>The Thrill of the Procedural Labyrinth</h2>
    <p>{game_title} brings the timeless satisfaction of labyrinth exploration into a sleek, neon cyber aesthetic. With dynamic fog-of-war lighting and procedural generation, no two runs are ever alike.</p>
    <h2>Top 4 Maze Exploration Strategies</h2>
    <h3>1. Use the Right-Hand Wall Rule</h3>
    <p>A classic labyrinth algorithm: if you follow the right-hand wall continuously without taking your hand off the wall, you are mathematically guaranteed to reach the exit of any simply-connected maze!</p>
    <h3>2. Keep an Eye on the Battery Timer</h3>
    <p>Don't linger too long searching for every single crystal if the timer drops below 15 seconds. Prioritize spotting the green light aura of the exit portal.</p>
    <h3>3. Look for Glowing Wall Reflections</h3>
    <p>Even inside the fog of war, crystals and the exit portal emit a soft ambient glow on nearby walls, giving you hints about which corridor to take.</p>
    <h3>4. Master Quick Turns</h3>
    <p>Queuing up your next turn just as you approach an intersection lets you corner fluidly without slowing down.</p>
    '''

    return {
        'game_html': game_html,
        'style_css': style_css,
        'game_js': game_js,
        'seo_body': seo_body,
        'faq_section': faq_section,
        'blog_content': blog_content
    }
