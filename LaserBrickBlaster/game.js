// Breakout Engine — Paddle Physics & Brick Grid
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
