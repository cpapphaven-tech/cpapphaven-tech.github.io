// Neon Maze Escape — Procedural Recursive Backtracker Engine & Fog of War
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
