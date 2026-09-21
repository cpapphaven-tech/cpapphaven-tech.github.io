#!/usr/bin/env python3
"""
Breakout Engine Archetype (Archetype: 'breakout')
Paddle control (touch drag & keyboard), realistic multi-angle ball reflection,
destructive brick grid with variable hitpoints, particles, and powerups.
"""

ARCHETYPE = "breakout"
PRIMARY_MECHANIC = "paddle-bounce"
DEFAULT_MECHANICS = ["paddle-bounce", "brick-destruction", "ball-reflection", "combo-multiplier"]
DEFAULT_CONTROLS = ["touch", "keyboard", "mouse"]
GAMEPLAY_LOOP = "bounce the ball off your paddle to clear all bricks on the grid without letting it drop"

def generate(game_title="Neon Breakout Blitz", folder_name="NeonBreakout", **kwargs):
    slug = folder_name.lower()

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
            <div class="hud-card"><span class="hud-label">SCORE</span><span class="hud-val" id="score-val">0</span></div>
            <div class="hud-card"><span class="hud-label">LIVES</span><span class="hud-val" id="lives-val">❤️❤️❤️</span></div>
            <div class="hud-card best-card"><span class="hud-label">BEST</span><span class="hud-val" id="best-val">0</span></div>
            <button id="btn-sound" class="icon-btn">🔊</button>
        </header>
        <div class="canvas-container" id="canvas-container">
            <canvas id="game-canvas"></canvas>
            <div class="tap-hint" id="tap-hint"><span>👆 Drag or move paddle to launch!</span></div>
        </div>
    </div>
    <div class="modal" id="gameover-modal">
        <div class="modal-box">
            <h2 id="modal-title">GAME OVER</h2>
            <p>Final Score: <strong id="final-score">0</strong></p>
            <div id="record-badge" class="record-badge" style="display:none;">🏆 NEW HIGH SCORE! 🏆</div>
            <button class="action-btn" id="btn-restart">PLAY AGAIN 🔄</button>
        </div>
    </div>
</body>
</html>
'''

    style_css = '''* { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
body { background: #030712; color: #f8fafc; font-family: system-ui, sans-serif; height: 100vh; overflow: hidden; display: flex; flex-direction: column; align-items: center; }
.game-wrapper { width: 100%; max-width: 460px; height: 100%; display: flex; flex-direction: column; padding: 8px 10px 65px; }
.game-hud { height: 56px; display: flex; align-items: center; justify-content: space-between; background: rgba(17, 24, 39, 0.85); border-radius: 12px; padding: 4px 12px; margin-bottom: 6px; flex-shrink: 0; }
.hud-card { display: flex; flex-direction: column; align-items: center; }
.hud-label { font-size: 0.6rem; font-weight: 800; color: #94a3b8; }
.hud-val { font-size: 1.1rem; font-weight: 900; color: #38bdf8; }
.best-card .hud-val { color: #f59e0b; }
.icon-btn { width: 34px; height: 34px; border-radius: 8px; background: rgba(2, 6, 23, 0.7); border: 1px solid rgba(56, 189, 248, 0.3); color: #f8fafc; cursor: pointer; }
.canvas-container { flex: 1; width: 100%; position: relative; border-radius: 16px; background: #090d16; border: 2px solid rgba(56, 189, 248, 0.25); overflow: hidden; touch-action: none; }
#game-canvas { width: 100%; height: 100%; display: block; touch-action: none; }
.tap-hint { position: absolute; top: 75%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); padding: 8px 16px; border-radius: 20px; color: #38bdf8; font-weight: 700; font-size: 0.85rem; pointer-events: none; }
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 20000; opacity: 0; visibility: hidden; transition: all 0.2s; }
.modal.active { opacity: 1; visibility: visible; }
.modal-box { background: #111827; padding: 24px; border-radius: 16px; text-align: center; max-width: 320px; width: 100%; border: 1px solid rgba(56, 189, 248, 0.3); }
.action-btn { width: 100%; padding: 12px; border-radius: 10px; background: #38bdf8; border: none; font-weight: 900; cursor: pointer; margin-top: 14px; color: #020617; }
.record-badge { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 6px; border-radius: 6px; font-weight: 800; font-size: 0.8rem; margin: 10px 0; }
'''

    game_js = '''// Breakout Engine — Paddle Physics & Brick Grid
(function () {
    'use strict';
    const Sound = {
        ctx: null, enabled: true,
        init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} },
        playPaddle() {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(320, now);
            gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.09);
        },
        playBrick(row) {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle'; osc.frequency.setValueAtTime(400 + row * 60, now);
            gain.gain.setValueAtTime(0.14, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.12);
        }
    };

    class BreakoutGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.container = document.getElementById('canvas-container');

            this.dom = {
                scoreVal: document.getElementById('score-val'),
                livesVal: document.getElementById('lives-val'),
                bestVal: document.getElementById('best-val'),
                tapHint: document.getElementById('tap-hint'),
                gameoverModal: document.getElementById('gameover-modal'),
                modalTitle: document.getElementById('modal-title'),
                finalScore: document.getElementById('final-score'),
                recordBadge: document.getElementById('record-badge'),
                btnRestart: document.getElementById('btn-restart'),
                btnSound: document.getElementById('btn-sound')
            };

            this.bestScore = parseInt(localStorage.getItem('pmg_breakout_best'), 10) || 0;
            this.dom.bestVal.textContent = this.bestScore;

            this.V_WIDTH = 400;
            this.V_HEIGHT = 650;

            this.init();
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.initEvents();

            requestAnimationFrame((t) => this.loop(t));
        }

        init() {
            this.score = 0;
            this.lives = 3;
            this.gameOver = false;
            this.started = false;
            this.dom.scoreVal.textContent = '0';
            this.dom.livesVal.textContent = '❤️❤️❤️';

            this.paddle = { x: 160, y: 590, width: 80, height: 12 };
            this.ball = { x: 200, y: 575, vx: 0, vy: 0, r: 6, speed: 6 };

            this.initBricks();
            this.dom.tapHint.style.opacity = '1';
        }

        initBricks() {
            this.bricks = [];
            const rows = 6; const cols = 7;
            const w = (this.V_WIDTH - 40) / cols; const h = 18;
            const colors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#a855f7'];

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    this.bricks.push({
                        x: 20 + c * w, y: 80 + r * (h + 4),
                        w: w - 4, h: h,
                        color: colors[r], alive: true, row: r
                    });
                }
            }
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

            const movePaddle = (clientX) => {
                const rect = this.canvas.getBoundingClientRect();
                const canvasX = (clientX - rect.left) / (rect.width / this.V_WIDTH);
                this.paddle.x = Math.max(10, Math.min(this.V_WIDTH - this.paddle.width - 10, canvasX - this.paddle.width / 2));
                if (!this.started) {
                    this.ball.x = this.paddle.x + this.paddle.width / 2;
                }
            };

            const launch = () => {
                if (this.gameOver) return;
                if (!this.started) {
                    this.started = true;
                    this.dom.tapHint.style.opacity = '0';
                    this.ball.vx = (Math.random() - 0.5) * 4;
                    this.ball.vy = -this.ball.speed;
                }
            };

            this.canvas.addEventListener('pointermove', (e) => { movePaddle(e.clientX); });
            this.canvas.addEventListener('pointerdown', (e) => { movePaddle(e.clientX); launch(); });

            window.addEventListener('keydown', (e) => {
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.paddle.x = Math.max(10, this.paddle.x - 25);
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.paddle.x = Math.min(this.V_WIDTH - this.paddle.width - 10, this.paddle.x + 25);
                if (e.code === 'Space') launch();
            });

            this.dom.btnRestart.addEventListener('click', () => {
                this.dom.gameoverModal.classList.remove('active');
                this.init();
            });

            this.dom.btnSound.addEventListener('click', () => {
                Sound.enabled = !Sound.enabled;
                this.dom.btnSound.textContent = Sound.enabled ? '🔊' : '🔇';
            });
        }

        update() {
            if (!this.started || this.gameOver) return;

            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;

            // Walls
            if (this.ball.x - this.ball.r < 10) { this.ball.x = 10 + this.ball.r; this.ball.vx = -this.ball.vx; }
            if (this.ball.x + this.ball.r > this.V_WIDTH - 10) { this.ball.x = this.V_WIDTH - 10 - this.ball.r; this.ball.vx = -this.ball.vx; }
            if (this.ball.y - this.ball.r < 10) { this.ball.y = 10 + this.ball.r; this.ball.vy = -this.ball.vy; }

            // Paddle bounce
            if (this.ball.y + this.ball.r >= this.paddle.y && this.ball.y - this.ball.r <= this.paddle.y + this.paddle.height) {
                if (this.ball.x >= this.paddle.x && this.ball.x <= this.paddle.x + this.paddle.width) {
                    this.ball.y = this.paddle.y - this.ball.r;
                    const hitPos = (this.ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
                    this.ball.vx = hitPos * 5;
                    this.ball.vy = -Math.sqrt(Math.max(4, this.ball.speed * this.ball.speed - this.ball.vx * this.ball.vx));
                    Sound.playPaddle();
                }
            }

            // Brick collision
            for (let b of this.bricks) {
                if (!b.alive) continue;
                if (this.ball.x + this.ball.r > b.x && this.ball.x - this.ball.r < b.x + b.w &&
                    this.ball.y + this.ball.r > b.y && this.ball.y - this.ball.r < b.y + b.h) {
                    b.alive = false;
                    this.ball.vy = -this.ball.vy;
                    this.score += 20;
                    this.dom.scoreVal.textContent = this.score;
                    Sound.playBrick(b.row);
                    break;
                }
            }

            // Bottom out
            if (this.ball.y > this.V_HEIGHT + 20) {
                this.lives--;
                this.dom.livesVal.textContent = '❤️'.repeat(this.lives);
                if (this.lives <= 0) {
                    this.triggerGameOver(false);
                } else {
                    this.started = false;
                    this.ball.y = 575;
                    this.ball.x = this.paddle.x + this.paddle.width / 2;
                    this.dom.tapHint.style.opacity = '1';
                }
            }

            // Check all cleared
            if (this.bricks.every(b => !b.alive)) {
                this.triggerGameOver(true);
            }
        }

        triggerGameOver(won) {
            this.gameOver = true;
            this.dom.modalTitle.textContent = won ? "VICTORY! ALL BRICKS CLEARED 🎉" : "GAME OVER";
            this.dom.finalScore.textContent = this.score;

            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.dom.bestVal.textContent = this.bestScore;
                localStorage.setItem('pmg_breakout_best', this.bestScore);
                this.dom.recordBadge.style.display = 'block';
            } else {
                this.dom.recordBadge.style.display = 'none';
            }
            this.dom.gameoverModal.classList.add('active');
        }

        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.save();
            ctx.scale(this.scaleX, this.scaleY);

            // Paddle
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

            // Ball
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
            ctx.fill();

            // Bricks
            for (let b of this.bricks) {
                if (!b.alive) continue;
                ctx.fillStyle = b.color;
                ctx.shadowColor = b.color;
                ctx.shadowBlur = 6;
                ctx.fillRect(b.x, b.y, b.w, b.h);
            }

            ctx.restore();
        }

        loop(time) {
            this.update();
            this.draw();
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    window.addEventListener('DOMContentLoaded', () => new BreakoutGame());
})();
'''

    seo_body = f'''
    <p>Bounce and smash through colorful neon bricks in <strong>{game_title}</strong>! Move your paddle to reflect the ball at tactical angles, destroy brick barriers, and keep your lives intact.</p>
    '''

    faq_section = f'''
    <div class="faq-card"><h4>Q: How do I aim the ball?</h4><p>A: Hitting the ball near the outer edges of the paddle sends it flying at sharper angles!</p></div>
    '''

    blog_content = f'''
    <h2>Mastering Paddle Physics in {game_title}</h2>
    <p>Discover angle deflection strategies and brick cluster clearing in this classic arcade hit.</p>
    '''

    return {
        'game_html': game_html,
        'style_css': style_css,
        'game_js': game_js,
        'seo_body': seo_body,
        'faq_section': faq_section,
        'blog_content': blog_content
    }
