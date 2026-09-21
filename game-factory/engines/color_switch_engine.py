ARCHETYPE = "color_switch"
PRIMARY_MECHANIC = "color-matching"
DEFAULT_MECHANICS = ["reaction-tap", "rhythm-timing", "color-matching", "obstacle-timing"]
DEFAULT_CONTROLS = ["touch", "keyboard", "mouse"]
GAMEPLAY_LOOP = "tap to bounce a colored ball upward through rotating multi-colored obstacles matching its current color"

def generate(game_title="Color Bounce Switch", folder_name="ColorBounce", primary_color="#38bdf8", **kwargs):
    return generate_color_switch_game(game_title=game_title, folder_name=folder_name, primary_color=primary_color)

def generate_color_switch_game(game_title="Color Bounce Switch", folder_name="ColorBounce", primary_color="#38bdf8"):
    slug = folder_name.lower()
    
    # 1. game.html (NO ads.js, NO #bottom-ad!)
    game_html = f'''<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>{game_title} | PlayMixGames</title>
    <meta name="description" content="Tap to bounce upward through rotating colored obstacles! Match colors to survive.">
    
    <link rel="stylesheet" href="style.css">
    <script type="module" src="../analytics.js"></script>
    <script defer src="game.js"></script>
</head>

<body>
    <div class="game-wrapper">
        <!-- Top HUD Header -->
        <header class="game-hud">
            <div class="hud-card">
                <span class="hud-label">SCORE</span>
                <span class="hud-val" id="score-val">0</span>
            </div>
            
            <div class="hud-center">
                <div class="active-color-indicator" id="color-indicator" title="Current Ball Color"></div>
            </div>

            <div class="hud-card best-card">
                <span class="hud-label">BEST</span>
                <span class="hud-val" id="best-val">0</span>
            </div>

            <div class="hud-controls">
                <button id="btn-sound" class="icon-btn" aria-label="Toggle Sound" title="Sound">🔊</button>
                <button id="btn-pause" class="icon-btn" aria-label="Pause Game" title="Pause">⏸️</button>
            </div>
        </header>

        <!-- Canvas Container -->
        <div class="canvas-container" id="canvas-container">
            <canvas id="game-canvas"></canvas>
            
            <!-- Tap to Start / Jump Overlay Hint -->
            <div class="tap-hint" id="tap-hint">
                <div class="tap-hand">👆</div>
                <div class="tap-text">TAP OR CLICK TO JUMP</div>
            </div>
        </div>
    </div>

    <!-- Game Over Modal -->
    <div class="modal" id="gameover-modal">
        <div class="modal-box">
            <h2 class="modal-title">GAME OVER</h2>
            <div class="modal-scores">
                <div class="score-row">
                    <span>Stars Collected:</span>
                    <strong id="final-score">0</strong>
                </div>
                <div class="score-row">
                    <span>All-Time Best:</span>
                    <strong id="final-best">0</strong>
                </div>
            </div>
            <div class="new-record-badge" id="new-record-badge" style="display: none;">
                🏆 NEW HIGH SCORE! 🏆
            </div>
            <button class="action-btn" id="btn-restart">PLAY AGAIN 🔄</button>
        </div>
    </div>

    <!-- Pause Modal -->
    <div class="modal" id="pause-modal">
        <div class="modal-box">
            <h2 class="modal-title">GAME PAUSED</h2>
            <p class="modal-text">Take a breath and tap below to jump back in!</p>
            <button class="action-btn" id="btn-resume">RESUME ▶️</button>
        </div>
    </div>
</body>

</html>
'''

    # 2. style.css (Mobile responsive with bottom-ad clearance padding)
    style_css = '''/* Color Bounce Switch — Neon Arcade Styling & Responsive Layout */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
}

body {
    background: radial-gradient(circle at center, #111827 0%, #030712 100%);
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

/* Container wrapper with bottom clearance for the fixed outer bottom ad */
.game-wrapper {
    width: 100%;
    max-width: 460px;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 8px 10px 65px; /* 65px clearance so bottom ad never covers game */
}

/* Top HUD */
.game-hud {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 10px;
    background: rgba(17, 24, 39, 0.85);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    margin-bottom: 8px;
    flex-shrink: 0;
}

.hud-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(3, 7, 18, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 2px 10px;
    min-width: 60px;
}

.hud-card.best-card {
    border-color: rgba(245, 158, 11, 0.3);
}

.hud-label {
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.6px;
    color: #94a3b8;
}

.hud-val {
    font-size: 1.15rem;
    font-weight: 900;
    color: #38bdf8;
    line-height: 1.2;
}

.best-card .hud-val {
    color: #fbbf24;
}

.active-color-indicator {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 12px currentColor;
    transition: background 0.3s, border-color 0.3s;
}

.hud-controls {
    display: flex;
    gap: 4px;
}

.icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(3, 7, 18, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
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
    border-color: #38bdf8;
}

/* Canvas Area */
.canvas-container {
    flex: 1;
    width: 100%;
    position: relative;
    border-radius: 16px;
    background: #030712;
    border: 2px solid rgba(56, 189, 248, 0.25);
    box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.7), 0 8px 32px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    touch-action: none;
}

#game-canvas {
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
}

/* Tap Hint */
.tap-hint {
    position: absolute;
    top: 68%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    pointer-events: none;
    transition: opacity 0.3s;
    animation: bounce-pulse 1.4s infinite ease-in-out;
}

.tap-hand {
    font-size: 2.4rem;
    margin-bottom: 6px;
}

.tap-text {
    font-size: 0.85rem;
    font-weight: 800;
    color: #38bdf8;
    background: rgba(3, 7, 18, 0.8);
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid rgba(56, 189, 248, 0.4);
    letter-spacing: 0.5px;
}

@keyframes bounce-pulse {
    0%, 100% { transform: translate(-50%, -50%) translateY(0); }
    50% { transform: translate(-50%, -50%) translateY(-10px); }
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
    background: #111827;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 18px;
    width: 100%;
    max-width: 340px;
    padding: 24px;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    transform: scale(0.92);
    transition: transform 0.25s ease;
}

.modal.active .modal-box {
    transform: scale(1);
}

.modal-title {
    font-size: 1.5rem;
    font-weight: 900;
    color: #f43f5e;
    margin-bottom: 16px;
}

.modal-text {
    color: #94a3b8;
    font-size: 0.95rem;
    margin-bottom: 20px;
}

.modal-scores {
    background: #030712;
    border: 1px solid #1f2937;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 18px;
}

.score-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.95rem;
    color: #94a3b8;
    margin: 6px 0;
}

.score-row strong {
    color: #38bdf8;
    font-size: 1.15rem;
}

.new-record-badge {
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    color: white;
    font-weight: 900;
    font-size: 0.85rem;
    padding: 8px;
    border-radius: 8px;
    margin-bottom: 16px;
    animation: bounce-pulse 1s infinite alternate;
}

.action-btn {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    border: none;
    color: #0f172a;
    font-weight: 900;
    font-size: 1rem;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(56, 189, 248, 0.35);
    transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(56, 189, 248, 0.5);
}
'''

    # 3. game.js (Complete modular 60 FPS engine)
    game_js = '''// Color Bounce Switch — High-Performance 60 FPS HTML5 Canvas Engine
(function () {
    'use strict';

    // 4 Neon Colors
    const COLORS = ['#38bdf8', '#f43f5e', '#facc15', '#a855f7']; // Cyan, Pink, Yellow, Purple

    // Sound Synthesizer via Web Audio API (zero external audio files)
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

        playJump() {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        },

        playStar() {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                gain.gain.setValueAtTime(0.15, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.22);
            });
        },

        playColorSwitch() {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        },

        playCrash() {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, now);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
        }
    };

    // Particle
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.r = 3 + Math.random() * 4;
            this.color = color;
            this.alpha = 1;
            this.decay = 0.02 + Math.random() * 0.03;
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

    // Rotating Ring Obstacle
    class RingObstacle {
        constructor(y, radius = 80, speed = 0.02) {
            this.type = 'ring';
            this.y = y;
            this.radius = radius;
            this.thickness = 16;
            this.angle = Math.random() * Math.PI * 2;
            this.speed = (Math.random() > 0.5 ? 1 : -1) * speed;
            this.passed = false;
        }

        update() {
            this.angle += this.speed;
        }

        draw(ctx, cx) {
            const segAngle = (Math.PI * 2) / 4;
            for (let i = 0; i < 4; i++) {
                const start = this.angle + i * segAngle;
                const end = start + segAngle;
                ctx.strokeStyle = COLORS[i];
                ctx.lineWidth = this.thickness;
                ctx.lineCap = 'butt';
                ctx.beginPath();
                ctx.arc(cx, this.y, this.radius, start, end);
                ctx.stroke();
            }
        }

        // Returns index of intersecting color segment, or -1 if no collision
        checkCollision(ball, cx) {
            const dy = ball.y - this.y;
            const dx = ball.x - cx;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Ball touches ring arc
            if (Math.abs(dist - this.radius) < (this.thickness / 2 + ball.radius - 2)) {
                let hitAngle = Math.atan2(dy, dx) - this.angle;
                hitAngle = (hitAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                const segIdx = Math.floor(hitAngle / (Math.PI / 2)) % 4;
                return segIdx;
            }
            return -1;
        }
    }

    // Rotating Cross Obstacle
    class CrossObstacle {
        constructor(y, armLength = 70, speed = 0.022) {
            this.type = 'cross';
            this.y = y;
            this.armLength = armLength;
            this.thickness = 16;
            this.angle = Math.random() * Math.PI * 2;
            this.speed = (Math.random() > 0.5 ? 1 : -1) * speed;
            this.passed = false;
        }

        update() {
            this.angle += this.speed;
        }

        draw(ctx, cx) {
            ctx.lineWidth = this.thickness;
            ctx.lineCap = 'round';
            for (let i = 0; i < 4; i++) {
                const a = this.angle + i * (Math.PI / 2);
                const ex = cx + Math.cos(a) * this.armLength;
                const ey = this.y + Math.sin(a) * this.armLength;
                ctx.strokeStyle = COLORS[i];
                ctx.beginPath();
                ctx.moveTo(cx, this.y);
                ctx.lineTo(ex, ey);
                ctx.stroke();
            }
        }

        checkCollision(ball, cx) {
            for (let i = 0; i < 4; i++) {
                const a = this.angle + i * (Math.PI / 2);
                const ex = cx + Math.cos(a) * this.armLength;
                const ey = this.y + Math.sin(a) * this.armLength;

                // Point-to-segment distance
                const dx = ex - cx;
                const dy = ey - this.y;
                const lenSq = dx * dx + dy * dy;
                let t = ((ball.x - cx) * dx + (ball.y - this.y) * dy) / lenSq;
                t = Math.max(0, Math.min(1, t));
                const projX = cx + t * dx;
                const projY = this.y + t * dy;
                const distSq = (ball.x - projX) ** 2 + (ball.y - projY) ** 2;

                if (distSq < (this.thickness / 2 + ball.radius - 2) ** 2) {
                    return i;
                }
            }
            return -1;
        }
    }

    // Color Switcher Orb
    class ColorSwitcher {
        constructor(y) {
            this.y = y;
            this.radius = 16;
            this.collected = false;
            this.angle = 0;
        }

        update() {
            this.angle += 0.04;
        }

        draw(ctx, cx) {
            if (this.collected) return;
            const seg = (Math.PI * 2) / 4;
            for (let i = 0; i < 4; i++) {
                const start = this.angle + i * seg;
                const end = start + seg;
                ctx.fillStyle = COLORS[i];
                ctx.beginPath();
                ctx.moveTo(cx, this.y);
                ctx.arc(cx, this.y, this.radius, start, end);
                ctx.closePath();
                ctx.fill();
            }
            // Center core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, this.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        checkCollected(ball, cx) {
            if (this.collected) return false;
            const dx = ball.x - cx;
            const dy = ball.y - this.y;
            return Math.sqrt(dx * dx + dy * dy) < (this.radius + ball.radius);
        }
    }

    // Star Collectible
    class StarItem {
        constructor(y) {
            this.y = y;
            this.radius = 14;
            this.collected = false;
            this.pulse = 0;
        }

        update() {
            this.pulse += 0.06;
        }

        draw(ctx, cx) {
            if (this.collected) return;
            const r = this.radius + Math.sin(this.pulse) * 2;
            ctx.save();
            ctx.translate(cx, this.y);
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r, -Math.sin((18 + i * 72) * Math.PI / 180) * r);
                ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (r / 2), -Math.sin((54 + i * 72) * Math.PI / 180) * (r / 2));
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        checkCollected(ball, cx) {
            if (this.collected) return false;
            const dx = ball.x - cx;
            const dy = ball.y - this.y;
            return Math.sqrt(dx * dx + dy * dy) < (this.radius + ball.radius);
        }
    }

    // Main Game Class
    class ColorBounceGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.container = document.getElementById('canvas-container');

            this.V_WIDTH = 400;
            this.V_HEIGHT = 650;
            this.GRAVITY = 0.42;
            this.JUMP_FORCE = -8.2;

            this.dom = {
                scoreVal: document.getElementById('score-val'),
                bestVal: document.getElementById('best-val'),
                colorIndicator: document.getElementById('color-indicator'),
                btnSound: document.getElementById('btn-sound'),
                btnPause: document.getElementById('btn-pause'),
                tapHint: document.getElementById('tap-hint'),
                gameoverModal: document.getElementById('gameover-modal'),
                finalScore: document.getElementById('final-score'),
                finalBest: document.getElementById('final-best'),
                newRecordBadge: document.getElementById('new-record-badge'),
                btnRestart: document.getElementById('btn-restart'),
                pauseModal: document.getElementById('pause-modal'),
                btnResume: document.getElementById('btn-resume')
            };

            this.bestScore = parseInt(localStorage.getItem('pmg_color_bounce_best'), 10) || 0;
            this.dom.bestVal.textContent = this.bestScore;

            this.initGame();
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.initEvents();

            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.loop(t));
        }

        initGame() {
            this.started = false;
            this.paused = false;
            this.gameOver = false;
            this.score = 0;
            this.dom.scoreVal.textContent = '0';

            this.ball = {
                x: this.V_WIDTH / 2,
                y: this.V_HEIGHT - 120,
                vy: 0,
                radius: 12,
                colorIdx: Math.floor(Math.random() * 4)
            };

            this.cameraY = 0;
            this.obstacles = [];
            this.switchers = [];
            this.stars = [];
            this.particles = [];

            // Spawn first sequence of obstacles
            let curY = this.V_HEIGHT - 280;
            for (let i = 0; i < 6; i++) {
                this.spawnObstaclePair(curY);
                curY -= 260;
            }
            this.highestY = curY;

            this.updateColorIndicator();
            this.dom.tapHint.style.opacity = '1';
        }

        spawnObstaclePair(y) {
            // Randomly pick Ring or Cross
            if (Math.random() > 0.4) {
                this.obstacles.push(new RingObstacle(y, 82, 0.02 + Math.random() * 0.01));
            } else {
                this.obstacles.push(new CrossObstacle(y, 75, 0.022 + Math.random() * 0.01));
            }

            // Star in center of obstacle
            this.stars.push(new StarItem(y));

            // Color switcher between obstacles
            this.switchers.push(new ColorSwitcher(y - 130));
        }

        updateColorIndicator() {
            const color = COLORS[this.ball.colorIdx];
            this.dom.colorIndicator.style.background = color;
            this.dom.colorIndicator.style.color = color;
        }

        resize() {
            const rect = this.container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            this.scaleX = this.canvas.width / this.V_WIDTH;
            this.scaleY = this.canvas.height / this.V_HEIGHT;
        }

        initEvents() {
            Sound.init();

            const handleTap = (e) => {
                e.preventDefault();
                if (this.paused || this.gameOver) return;

                if (!this.started) {
                    this.started = true;
                    this.dom.tapHint.style.opacity = '0';
                }

                this.ball.vy = this.JUMP_FORCE;
                Sound.playJump();

                // Small jump particle puff
                for (let i = 0; i < 5; i++) {
                    this.particles.push(new Particle(this.ball.x, this.ball.y + this.ball.radius, COLORS[this.ball.colorIdx]));
                }
            };

            this.canvas.addEventListener('pointerdown', handleTap);
            window.addEventListener('keydown', (e) => {
                if (e.code === 'Space' || e.code === 'ArrowUp') handleTap(e);
            });

            this.dom.btnSound.addEventListener('click', () => {
                Sound.enabled = !Sound.enabled;
                this.dom.btnSound.textContent = Sound.enabled ? '🔊' : '🔇';
            });

            this.dom.btnPause.addEventListener('click', () => {
                if (!this.gameOver && this.started) {
                    this.paused = true;
                    this.dom.pauseModal.classList.add('active');
                }
            });

            this.dom.btnResume.addEventListener('click', () => {
                this.paused = false;
                this.dom.pauseModal.classList.remove('active');
            });

            this.dom.btnRestart.addEventListener('click', () => {
                this.dom.gameoverModal.classList.remove('active');
                this.initGame();
            });
        }

        triggerGameOver() {
            if (this.gameOver) return;
            this.gameOver = true;
            Sound.playCrash();

            // Burst explosion of ball
            for (let i = 0; i < 30; i++) {
                this.particles.push(new Particle(this.ball.x, this.ball.y, COLORS[this.ball.colorIdx]));
                this.particles.push(new Particle(this.ball.x, this.ball.y, '#ffffff'));
            }

            this.dom.finalScore.textContent = this.score;
            this.dom.finalBest.textContent = this.bestScore;

            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.dom.bestVal.textContent = this.bestScore;
                localStorage.setItem('pmg_color_bounce_best', this.bestScore);
                this.dom.newRecordBadge.style.display = 'block';
            } else {
                this.dom.newRecordBadge.style.display = 'none';
            }

            setTimeout(() => {
                this.dom.gameoverModal.classList.add('active');
            }, 600);
        }

        update() {
            if (!this.started || this.paused || this.gameOver) return;

            // Ball Physics
            this.ball.vy += this.GRAVITY;
            this.ball.y += this.ball.vy;

            // Smooth Camera tracking (tracks upward)
            const targetCamY = (this.V_HEIGHT / 2) - this.ball.y;
            if (targetCamY > this.cameraY) {
                this.cameraY += (targetCamY - this.cameraY) * 0.15;
            }

            // Bottom Boundary Kill (fell below camera)
            if (this.ball.y + this.cameraY > this.V_HEIGHT + 20) {
                this.triggerGameOver();
                return;
            }

            const cx = this.V_WIDTH / 2;

            // Check Obstacles
            for (let obs of this.obstacles) {
                obs.update();
                const hitColorIdx = obs.checkCollision(this.ball, cx);
                if (hitColorIdx !== -1) {
                    if (hitColorIdx !== this.ball.colorIdx) {
                        this.triggerGameOver();
                        return;
                    }
                }
            }

            // Check Stars
            for (let star of this.stars) {
                star.update();
                if (star.checkCollected(this.ball, cx)) {
                    star.collected = true;
                    this.score++;
                    this.dom.scoreVal.textContent = this.score;
                    Sound.playStar();
                    for (let p = 0; p < 12; p++) {
                        this.particles.push(new Particle(cx, star.y, '#fbbf24'));
                    }
                }
            }

            // Check Color Switchers
            for (let sw of this.switchers) {
                sw.update();
                if (sw.checkCollected(this.ball, cx)) {
                    sw.collected = true;
                    // Switch to a DIFFERENT color
                    let newIdx;
                    do {
                        newIdx = Math.floor(Math.random() * 4);
                    } while (newIdx === this.ball.colorIdx);
                    this.ball.colorIdx = newIdx;
                    this.updateColorIndicator();
                    Sound.playColorSwitch();
                    for (let p = 0; p < 14; p++) {
                        this.particles.push(new Particle(cx, sw.y, COLORS[newIdx]));
                    }
                }
            }

            // Infinite Obstacle Generation
            if (this.ball.y - this.highestY < 800) {
                for (let i = 0; i < 3; i++) {
                    this.spawnObstaclePair(this.highestY);
                    this.highestY -= 260;
                }
            }

            // Clean up off-screen objects far below
            const cleanupY = -this.cameraY + this.V_HEIGHT + 300;
            this.obstacles = this.obstacles.filter(o => o.y < cleanupY);
            this.stars = this.stars.filter(s => s.y < cleanupY);
            this.switchers = this.switchers.filter(sw => sw.y < cleanupY);
        }

        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.save();
            ctx.scale(this.scaleX, this.scaleY);

            // Camera translation
            ctx.save();
            ctx.translate(0, this.cameraY);

            const cx = this.V_WIDTH / 2;

            // Draw Stars
            for (let star of this.stars) star.draw(ctx, cx);

            // Draw Switchers
            for (let sw of this.switchers) sw.draw(ctx, cx);

            // Draw Obstacles
            for (let obs of this.obstacles) obs.draw(ctx, cx);

            // Draw Ball
            if (!this.gameOver) {
                ctx.save();
                ctx.fillStyle = COLORS[this.ball.colorIdx];
                ctx.shadowColor = COLORS[this.ball.colorIdx];
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
                ctx.fill();

                // Ball glossy highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(this.ball.x - 3, this.ball.y - 3, this.ball.radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Draw Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.update();
                p.draw(ctx);
                if (p.alpha <= 0) this.particles.splice(i, 1);
            }

            ctx.restore(); // end camera
            ctx.restore(); // end scale
        }

        loop(time) {
            this.update();
            this.draw();
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        new ColorBounceGame();
    });
})();
'''

    return {
        'game_html': game_html,
        'style_css': style_css,
        'game_js': game_js
    }
