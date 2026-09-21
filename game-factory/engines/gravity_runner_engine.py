#!/usr/bin/env python3
"""
Gravity Flip Runner Engine (Archetype: 'gravity_runner')
A fast-paced neon runner where tapping inverts gravity between floor and ceiling.
Distinct mechanics: gravity-inversion-tap, ceiling/floor running, hazard avoidance.
"""

ARCHETYPE = "gravity_runner"
PRIMARY_MECHANIC = "gravity-inversion-tap"
DEFAULT_MECHANICS = ["gravity-inversion-tap", "hazard-avoidance", "ceiling-floor-switch", "speed-scaling"]
DEFAULT_CONTROLS = ["touch", "mouse", "space"]
GAMEPLAY_LOOP = "tap to invert gravity between floor and ceiling dodging spikes and barriers at high speed"

def generate(game_title="Gravity Flip Neon", folder_name="GravityFlipNeon", **kwargs):
    slug = folder_name.lower()

    # 1. game.html (STRICTLY NO ads.js and NO #bottom-ad!)
    game_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>{game_title} | PlayMixGames</title>
    <link rel="stylesheet" href="style.css">
    <script type="module" src="../analytics.js"></script>
    <script defer src="game.js"></script>
</head>
<body>
    <div class="game-wrapper">
        <header class="game-hud">
            <div class="hud-card">
                <span class="hud-label">DISTANCE</span>
                <span class="hud-val" id="dist-val">0m</span>
            </div>
            <div class="hud-card">
                <span class="hud-label">ORBS</span>
                <span class="hud-val" id="orb-val">0</span>
            </div>
            <div class="hud-card best-card">
                <span class="hud-label">BEST</span>
                <span class="hud-val" id="best-val">0m</span>
            </div>
            <button class="icon-btn" id="btn-sound" aria-label="Toggle Sound">🔊</button>
        </header>

        <div class="canvas-container" id="canvas-container">
            <canvas id="game-canvas"></canvas>
            <div class="tap-hint" id="tap-hint">
                <span>👆 Tap, Click, or Space to Flip Gravity!</span>
            </div>
        </div>
    </div>

    <!-- Game Over Modal -->
    <div class="modal" id="gameover-modal">
        <div class="modal-box">
            <h2 class="modal-title gameover-title">RUN TERMINATED 💥</h2>
            <div class="modal-stat">Distance: <span id="final-dist" class="highlight-val">0m</span></div>
            <div class="modal-stat">Orbs Gathered: <span id="final-orbs">0</span></div>
            <div id="record-badge" class="record-badge" style="display:none;">🏆 NEW RECORD!</div>
            <button class="action-btn" id="btn-restart">RUN AGAIN ⚡</button>
        </div>
    </div>
</body>
</html>
'''

    # 2. style.css (includes 65px bottom padding for ad clearance)
    style_css = '''* { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
body {
    background: #030712;
    color: #f8fafc;
    font-family: system-ui, -apple-system, sans-serif;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.game-wrapper {
    width: 100%;
    max-width: 480px;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 8px 10px 65px; /* 65px ensures bottom ad never covers canvas */
}
.game-hud {
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(17, 24, 39, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 12px;
    padding: 4px 12px;
    margin-bottom: 8px;
    flex-shrink: 0;
}
.hud-card { display: flex; flex-direction: column; align-items: center; }
.hud-label { font-size: 0.62rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px; }
.hud-val { font-size: 1.15rem; font-weight: 900; color: #38bdf8; }
.best-card .hud-val { color: #f59e0b; }
.icon-btn {
    width: 34px; height: 34px; border-radius: 8px;
    background: rgba(2, 6, 23, 0.7); border: 1px solid rgba(56, 189, 248, 0.3);
    color: #f8fafc; font-size: 1rem; cursor: pointer;
}
.canvas-container {
    flex: 1;
    position: relative;
    width: 100%;
    border-radius: 16px;
    overflow: hidden;
    border: 2px solid rgba(56, 189, 248, 0.3);
    background: #020617;
}
#game-canvas {
    width: 100%;
    height: 100%;
    display: block;
}
.tap-hint {
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
.tap-hint.hidden {
    animation: none;
    opacity: 0 !important;
    visibility: hidden;
    pointer-events: none;
}
.modal {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 20000; opacity: 0; visibility: hidden; transition: all 0.2s;
}
.modal.active { opacity: 1; visibility: visible; }
.modal-box {
    background: #0f172a; border: 2px solid rgba(56, 189, 248, 0.35);
    border-radius: 16px; padding: 24px; text-align: center;
    max-width: 320px; width: 90%;
}
.gameover-title { color: #f43f5e; font-size: 1.4rem; font-weight: 900; margin-bottom: 12px; }
.modal-stat { font-size: 1rem; color: #cbd5e1; margin-bottom: 8px; }
.highlight-val { color: #38bdf8; font-weight: 800; }
.record-badge {
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    color: white; padding: 6px; border-radius: 6px;
    font-weight: 800; font-size: 0.8rem; margin: 10px 0;
}
.action-btn {
    width: 100%; padding: 12px; border-radius: 10px;
    background: #38bdf8; border: none; font-weight: 900;
    cursor: pointer; margin-top: 14px; color: #020617; font-size: 1rem;
}
'''

    # 3. game.js (Full Canvas Gravity Inversion Runner Engine)
    game_js = '''// Gravity Flip Neon Engine — Fast-Paced Canvas Runner
(function () {
    'use strict';

    const Sound = {
        ctx: null, enabled: true,
        init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} },
        playFlip() {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);
            gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.12);
        },
        playOrb() {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle'; osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
            gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.15);
        },
        playCrash() {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
            gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.32);
        }
    };

    class GravityRunner {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.container = document.getElementById('canvas-container');

            this.dom = {
                distVal: document.getElementById('dist-val'),
                orbVal: document.getElementById('orb-val'),
                bestVal: document.getElementById('best-val'),
                tapHint: document.getElementById('tap-hint'),
                gameoverModal: document.getElementById('gameover-modal'),
                finalDist: document.getElementById('final-dist'),
                finalOrbs: document.getElementById('final-orbs'),
                recordBadge: document.getElementById('record-badge'),
                btnRestart: document.getElementById('btn-restart'),
                btnSound: document.getElementById('btn-sound')
            };

            this.bestDist = parseInt(localStorage.getItem('pmg_gravity_best'), 10) || 0;
            this.dom.bestVal.textContent = this.bestDist + 'm';

            this.resize();
            window.addEventListener('resize', () => this.resize());

            this.initEvents();
            this.reset();
            this.loop(0);
        }

        resize() {
            const rect = this.container.getBoundingClientRect();
            this.width = rect.width;
            this.height = rect.height;
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            this.ctx.scale(dpr, dpr);

            this.floorY = this.height - 24;
            this.ceilY = 24;
        }

        reset() {
            this.distance = 0;
            this.orbs = 0;
            this.gameOver = false;
            this.speed = 3.5;
            this.gravityDir = 1; // 1 = floor, -1 = ceiling

            this.player = {
                x: 60,
                y: this.floorY - 18,
                size: 18,
                vy: 0,
                onGround: true,
                trail: []
            };

            this.obstacles = [];
            this.collectibles = [];
            this.particles = [];
            this.nextSpawn = 60;

            this.dom.distVal.textContent = '0m';
            this.dom.orbVal.textContent = '0';
        }

        initEvents() {
            Sound.init();

            const handleFlip = () => {
                if (this.gameOver) return;
                this.dom.tapHint.classList.add('hidden');

                // Only flip if on a surface or near it
                this.gravityDir = -this.gravityDir;
                this.player.onGround = false;
                this.player.vy = this.gravityDir * 4;
                Sound.playFlip();

                // Flip burst particles
                for (let i = 0; i < 6; i++) {
                    this.particles.push({
                        x: this.player.x + 9,
                        y: this.player.y + 9,
                        vx: (Math.random() - 0.5) * 3,
                        vy: -this.gravityDir * (Math.random() * 2 + 1),
                        size: 3,
                        color: '#38bdf8',
                        life: 18
                    });
                }
            };

            window.addEventListener('pointerdown', (e) => {
                if (e.target.closest('.modal') || e.target.closest('#btn-sound')) return;
                handleFlip();
            });

            window.addEventListener('keydown', (e) => {
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                    e.preventDefault();
                    handleFlip();
                }
            });

            this.dom.btnSound.addEventListener('click', () => {
                Sound.enabled = !Sound.enabled;
                this.dom.btnSound.textContent = Sound.enabled ? '🔊' : '🔇';
            });

            this.dom.btnRestart.addEventListener('click', () => {
                this.dom.gameoverModal.classList.remove('active');
                this.reset();
            });
        }

        spawnObjects() {
            this.nextSpawn--;
            if (this.nextSpawn <= 0) {
                const isCeil = Math.random() > 0.5;
                const obsHeight = 22 + Math.random() * 16;
                const obsY = isCeil ? this.ceilY : this.floorY - obsHeight;

                this.obstacles.push({
                    x: this.width + 20,
                    y: obsY,
                    w: 16,
                    h: obsHeight,
                    isCeil: isCeil
                });

                // Spawn floating energy orb
                if (Math.random() > 0.35) {
                    this.collectibles.push({
                        x: this.width + 60,
                        y: (this.ceilY + this.floorY) / 2 + (Math.random() - 0.5) * 40,
                        radius: 6,
                        pulse: 0
                    });
                }

                this.nextSpawn = Math.max(38, Math.floor(80 - (this.distance / 40)));
            }
        }

        update() {
            if (this.gameOver) return;

            this.distance += 0.2;
            this.speed = Math.min(8.0, 3.8 + (this.distance / 250));
            this.dom.distVal.textContent = Math.floor(this.distance) + 'm';

            // Gravity physics
            const g = 0.55 * this.gravityDir;
            this.player.vy += g;
            this.player.y += this.player.vy;

            // Floor & Ceiling collision
            if (this.gravityDir === 1) {
                if (this.player.y >= this.floorY - this.player.size) {
                    this.player.y = this.floorY - this.player.size;
                    this.player.vy = 0;
                    this.player.onGround = true;
                }
            } else {
                if (this.player.y <= this.ceilY) {
                    this.player.y = this.ceilY;
                    this.player.vy = 0;
                    this.player.onGround = true;
                }
            }

            // Player trail
            if (Math.random() > 0.2) {
                this.player.trail.push({
                    x: this.player.x,
                    y: this.player.y,
                    alpha: 0.6
                });
            }
            this.player.trail.forEach(t => t.alpha -= 0.05);
            this.player.trail = this.player.trail.filter(t => t.alpha > 0);

            // Spawn obstacles
            this.spawnObjects();

            // Move obstacles & collision check
            const px = this.player.x;
            const py = this.player.y;
            const ps = this.player.size;

            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obs = this.obstacles[i];
                obs.x -= this.speed;

                // AABB collision
                if (px + ps > obs.x + 3 && px < obs.x + obs.w - 3 &&
                    py + ps > obs.y + 2 && py < obs.y + obs.h - 2) {
                    this.endGame();
                    return;
                }

                if (obs.x + obs.w < -20) this.obstacles.splice(i, 1);
            }

            // Collectibles
            for (let i = this.collectibles.length - 1; i >= 0; i--) {
                const orb = this.collectibles[i];
                orb.x -= this.speed;
                orb.pulse += 0.1;

                const dx = (px + ps / 2) - orb.x;
                const dy = (py + ps / 2) - orb.y;
                if (Math.sqrt(dx * dx + dy * dy) < ps / 2 + orb.radius + 4) {
                    this.orbs++;
                    this.dom.orbVal.textContent = this.orbs;
                    Sound.playOrb();

                    for (let p = 0; p < 8; p++) {
                        this.particles.push({
                            x: orb.x, y: orb.y,
                            vx: (Math.random() - 0.5) * 4,
                            vy: (Math.random() - 0.5) * 4,
                            size: 3, color: '#f59e0b', life: 20
                        });
                    }
                    this.collectibles.splice(i, 1);
                } else if (orb.x < -20) {
                    this.collectibles.splice(i, 1);
                }
            }

            // Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx; p.y += p.vy;
                p.life--;
                if (p.life <= 0) this.particles.splice(i, 1);
            }
        }

        render() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            // Draw Neon Floor & Ceiling
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, this.width, this.ceilY);
            ctx.fillRect(0, this.floorY, this.width, this.height - this.floorY);

            // Glowing Boundary Lines
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, this.ceilY); ctx.lineTo(this.width, this.ceilY);
            ctx.moveTo(0, this.floorY); ctx.lineTo(this.width, this.floorY);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Trail
            this.player.trail.forEach(t => {
                ctx.fillStyle = `rgba(56, 189, 248, ${t.alpha * 0.4})`;
                ctx.fillRect(t.x, t.y, this.player.size, this.player.size);
            });

            // Player Neon Cube
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 14;
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(this.player.x, this.player.y, this.player.size, this.player.size);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(this.player.x, this.player.y, this.player.size, this.player.size);
            ctx.shadowBlur = 0;

            // Obstacles (Neon Hazards)
            this.obstacles.forEach(obs => {
                ctx.shadowColor = '#f43f5e';
                ctx.shadowBlur = 8;
                ctx.fillStyle = '#f43f5e';
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                ctx.shadowBlur = 0;
            });

            // Energy Orbs
            this.collectibles.forEach(orb => {
                const r = orb.radius + Math.sin(orb.pulse) * 1.5;
                ctx.shadowColor = '#f59e0b';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            // Particles
            this.particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        endGame() {
            this.gameOver = true;
            Sound.playCrash();

            const finalMeters = Math.floor(this.distance);
            this.dom.finalDist.textContent = finalMeters + 'm';
            this.dom.finalOrbs.textContent = this.orbs;

            if (finalMeters > this.bestDist) {
                this.bestDist = finalMeters;
                localStorage.setItem('pmg_gravity_best', this.bestDist);
                this.dom.bestVal.textContent = this.bestDist + 'm';
                this.dom.recordBadge.style.display = 'inline-block';
            } else {
                this.dom.recordBadge.style.display = 'none';
            }

            this.dom.gameoverModal.classList.add('active');
        }

        loop(time) {
            this.update();
            this.render();
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        new GravityRunner();
    });
})();
'''

    return {
        'game_html': game_html,
        'style_css': style_css,
        'game_js': game_js
    }
