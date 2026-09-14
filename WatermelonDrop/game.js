// Watermelon Drop (Suika Fruit Merge) — 60 FPS Physics & Juicy Animation Engine
(function () {
    'use strict';

    // --- SOUND SYNTHESIZER ---
    const Sound = {
        ctx: null,
        enabled: true,

        init() {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            } catch (e) {
                console.warn('AudioContext not available');
            }
        },

        resume() {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        },

        playPop(tier) {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Ascending pentatonic pitches by tier
            const baseFreqs = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3, 784.0, 880.0, 1046.5];
            const freq = baseFreqs[Math.min(tier, baseFreqs.length - 1)];

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * 0.8, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.08);

            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.17);
        },

        playDrop() {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        },

        playBounce(intensity) {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.06);

            const vol = Math.min(0.15, Math.max(0.02, intensity * 0.04));
            gain.gain.setValueAtTime(vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        },

        playWatermelonFanfare() {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            const chords = [523.25, 659.25, 783.99, 1046.5];
            chords.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gain.gain.setValueAtTime(0.2, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.45);
            });
        },

        playGameOver() {
            if (!this.enabled || !this.ctx) return;
            this.resume();
            const now = this.ctx.currentTime;
            const notes = [349.23, 311.13, 261.63, 220.0];
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + idx * 0.15);
                gain.gain.setValueAtTime(0.15, now + idx * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.15);
                osc.stop(now + idx * 0.15 + 0.28);
            });
        }
    };

    // --- FRUIT DEFINITIONS (11 TIERS) ---
    const FRUITS = [
        { name: 'Cherry',      r: 16,  pts: 1,   color: '#dc2626', highlight: '#f87171', emoji: '🍒', stem: true },
        { name: 'Strawberry',  r: 22,  pts: 3,   color: '#e11d48', highlight: '#fb7185', emoji: '🍓', seeds: true },
        { name: 'Grape',       r: 30,  pts: 6,   color: '#7c3aed', highlight: '#a78bfa', emoji: '🍇', leaf: true },
        { name: 'Orange',      r: 40,  pts: 10,  color: '#ea580c', highlight: '#fb923c', emoji: '🍊', dimples: true },
        { name: 'Apple',       r: 50,  pts: 15,  color: '#b91c1c', highlight: '#ef4444', emoji: '🍎', stem: true },
        { name: 'Pear',        r: 62,  pts: 21,  color: '#84cc16', highlight: '#bef264', emoji: '🍐', stem: true },
        { name: 'Peach',       r: 74,  pts: 28,  color: '#f43f5e', highlight: '#fbcfe8', emoji: '🍑', cleft: true },
        { name: 'Pineapple',   r: 88,  pts: 36,  color: '#eab308', highlight: '#fef08a', emoji: '🍍', crown: true },
        { name: 'Melon',       r: 104, pts: 45,  color: '#10b981', highlight: '#6ee7b7', emoji: '🍈', grid: true },
        { name: 'Watermelon',  r: 124, pts: 100, color: '#15803d', highlight: '#4ade80', emoji: '🍉', stripes: true }
    ];

    // --- PARTICLE CLASS ---
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed - 1.5;
            this.r = 3 + Math.random() * 5;
            this.color = color;
            this.alpha = 1;
            this.decay = 0.02 + Math.random() * 0.03;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.2; // gravity
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

    // --- FLOATING TEXT CLASS ---
    class FloatingText {
        constructor(x, y, text, color) {
            this.x = x;
            this.y = y;
            this.text = text;
            this.color = color || '#fef08a';
            this.alpha = 1;
            this.vy = -1.8;
        }

        update() {
            this.y += this.vy;
            this.alpha -= 0.022;
        }

        draw(ctx) {
            if (this.alpha <= 0) return;
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = this.color;
            ctx.font = 'bold 20px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }

    // --- FRUIT RIGID BODY ---
    class FruitBody {
        constructor(x, y, tier) {
            this.x = x;
            this.y = y;
            this.vx = 0;
            this.vy = 0;
            this.tier = tier;
            const def = FRUITS[tier];
            this.r = def.r;
            this.mass = this.r * this.r;
            this.merged = false;
            this.scale = 0.2; // spawn pop scale
            this.targetScale = 1.0;
            this.squishX = 1;
            this.squishY = 1;
            this.blinkTimer = Math.floor(Math.random() * 200) + 60;
            this.isBlinking = false;
            this.stableTimer = 0;
        }

        update(gravity, friction) {
            // Spring scale up
            if (this.scale < this.targetScale) {
                this.scale += (this.targetScale - this.scale) * 0.3;
                if (Math.abs(this.targetScale - this.scale) < 0.01) this.scale = this.targetScale;
            }

            // Spring squish recovery
            this.squishX += (1 - this.squishX) * 0.2;
            this.squishY += (1 - this.squishY) * 0.2;

            // Physics velocity integration
            this.vy += gravity;
            this.vx *= friction;
            this.vy *= friction;

            this.x += this.vx;
            this.y += this.vy;

            // Blinking timer
            this.blinkTimer--;
            if (this.blinkTimer <= 0) {
                this.isBlinking = !this.isBlinking;
                this.blinkTimer = this.isBlinking ? 12 : Math.floor(Math.random() * 250) + 100;
            }
        }

        draw(ctx) {
            const def = FRUITS[this.tier];
            const currentR = this.r * this.scale;
            if (currentR <= 0) return;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.squishX, this.squishY);

            // Outer Fruit Glow
            ctx.shadowColor = def.color;
            ctx.shadowBlur = 10;

            // Fruit Body Gradient
            const grad = ctx.createRadialGradient(-currentR * 0.25, -currentR * 0.25, currentR * 0.1, 0, 0, currentR);
            grad.addColorStop(0, def.highlight);
            grad.addColorStop(0.7, def.color);
            grad.addColorStop(1, '#00000033');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, currentR, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // reset shadow

            // Watermelon Stripes
            if (def.stripes) {
                ctx.save();
                ctx.clip(); // clip to circle
                ctx.strokeStyle = '#064e3b';
                ctx.lineWidth = currentR * 0.14;
                ctx.beginPath();
                for (let a = -3; a <= 3; a++) {
                    const offset = a * (currentR * 0.32);
                    ctx.moveTo(offset, -currentR);
                    ctx.bezierCurveTo(offset + 15, 0, offset - 15, currentR * 0.5, offset, currentR);
                }
                ctx.stroke();
                ctx.restore();
            }

            // Melon Grid Pattern
            if (def.grid) {
                ctx.save();
                ctx.clip();
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = -currentR; i < currentR; i += 18) {
                    ctx.moveTo(i, -currentR);
                    ctx.lineTo(i + currentR, currentR);
                    ctx.moveTo(i, currentR);
                    ctx.lineTo(i + currentR, -currentR);
                }
                ctx.stroke();
                ctx.restore();
            }

            // Pineapple Crown
            if (def.crown) {
                ctx.fillStyle = '#16a34a';
                ctx.beginPath();
                ctx.moveTo(-16, -currentR + 4);
                ctx.lineTo(-6, -currentR - 18);
                ctx.lineTo(0, -currentR + 2);
                ctx.lineTo(6, -currentR - 18);
                ctx.lineTo(16, -currentR + 4);
                ctx.closePath();
                ctx.fill();
            }

            // Strawberry seeds
            if (def.seeds) {
                ctx.fillStyle = '#fef08a';
                const seedCoords = [[-6, -6], [6, -6], [0, 4], [-8, 8], [8, 8]];
                seedCoords.forEach(([sx, sy]) => {
                    ctx.beginPath();
                    ctx.ellipse(sx, sy, 1.5, 2.5, Math.PI / 6, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            // Peach Cleft
            if (def.cleft) {
                ctx.strokeStyle = 'rgba(190, 18, 60, 0.4)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(0, -currentR + 2);
                ctx.quadraticCurveTo(-4, 0, 0, currentR - 6);
                ctx.stroke();
            }

            // Top specular shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.beginPath();
            ctx.ellipse(-currentR * 0.35, -currentR * 0.35, currentR * 0.25, currentR * 0.16, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

            // Kawaii Animated Face
            this.drawFace(ctx, currentR);

            ctx.restore();
        }

        drawFace(ctx, r) {
            const eyeSpacing = r * 0.32;
            const eyeY = r * 0.05;
            const eyeSize = Math.max(2, r * 0.1);

            // Cheeks
            ctx.fillStyle = 'rgba(251, 113, 133, 0.55)';
            ctx.beginPath();
            ctx.arc(-eyeSpacing - 3, eyeY + 6, eyeSize * 1.1, 0, Math.PI * 2);
            ctx.arc(eyeSpacing + 3, eyeY + 6, eyeSize * 1.1, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#1e293b';
            if (this.isBlinking) {
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-eyeSpacing - eyeSize, eyeY);
                ctx.lineTo(-eyeSpacing + eyeSize, eyeY);
                ctx.moveTo(eyeSpacing - eyeSize, eyeY);
                ctx.lineTo(eyeSpacing + eyeSize, eyeY);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(-eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
                ctx.arc(eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
                ctx.fill();

                // Eye highlights
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-eyeSpacing - eyeSize * 0.3, eyeY - eyeSize * 0.3, eyeSize * 0.35, 0, Math.PI * 2);
                ctx.arc(eyeSpacing - eyeSize * 0.3, eyeY - eyeSize * 0.3, eyeSize * 0.35, 0, Math.PI * 2);
                ctx.fill();
            }

            // Smile
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = Math.max(1.5, r * 0.05);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, eyeY + 4, r * 0.14, 0.1 * Math.PI, 0.9 * Math.PI, false);
            ctx.stroke();
        }
    }

    // --- MAIN GAME CONTROLLER ---
    class WatermelonGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.box = document.getElementById('canvas-box');

            // Virtual Dimensions (fixed coordinate space for consistent physics)
            this.V_WIDTH = 450;
            this.V_HEIGHT = 700;

            // Play Boundary
            this.WALL_LEFT = 18;
            this.WALL_RIGHT = this.V_WIDTH - 18;
            this.FLOOR_Y = this.V_HEIGHT - 20;
            this.DROP_Y = 65;
            this.DANGER_Y = 135;

            // Physics params
            this.GRAVITY = 0.36;
            this.RESTITUTION = 0.22;
            this.FRICTION = 0.985;
            this.SUBSTEPS = 8;

            // State
            this.fruits = [];
            this.particles = [];
            this.floatingTexts = [];
            this.score = 0;
            this.bestScore = parseInt(localStorage.getItem('pmg_watermelon_best'), 10) || 0;
            this.gameOver = false;
            this.canDrop = true;
            this.dropCooldownTimer = 0;
            this.nudgeCooldown = 0;
            this.dangerTimer = 0;
            this.hasDroppedOnce = false;

            // Cloud Dropper Position
            this.dropperX = this.V_WIDTH / 2;
            this.currentTier = this.getRandomSpawnTier();
            this.nextTier = this.getRandomSpawnTier();

            // DOM elements
            this.dom = {
                scoreVal: document.getElementById('score-val'),
                bestVal: document.getElementById('best-val'),
                nextEmoji: document.getElementById('next-emoji'),
                btnSound: document.getElementById('btn-sound'),
                btnGuide: document.getElementById('btn-guide'),
                btnNudge: document.getElementById('btn-nudge'),
                btnRestart: document.getElementById('btn-restart'),
                dangerWarning: document.getElementById('danger-warning'),
                dangerTimerText: document.getElementById('danger-timer'),
                tapHint: document.getElementById('tap-hint'),
                guideModal: document.getElementById('guide-modal'),
                btnCloseGuide: document.getElementById('btn-close-guide'),
                btnGotIt: document.getElementById('btn-got-it'),
                gameoverModal: document.getElementById('gameover-modal'),
                finalScore: document.getElementById('final-score'),
                finalBest: document.getElementById('final-best'),
                newHighBadge: document.getElementById('new-high-badge'),
                btnPlayAgain: document.getElementById('btn-play-again')
            };

            this.dom.bestVal.textContent = this.bestScore;
            this.updateNextPreview();

            // Setup
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            this.initEvents();

            // Game Loop
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.loop(time));
        }

        getRandomSpawnTier() {
            // Only spawn small fruits (cherry, strawberry, grape, orange)
            const weights = [0.4, 0.3, 0.2, 0.1];
            const rand = Math.random();
            let cum = 0;
            for (let i = 0; i < weights.length; i++) {
                cum += weights[i];
                if (rand <= cum) return i;
            }
            return 0;
        }

        updateNextPreview() {
            this.dom.nextEmoji.textContent = FRUITS[this.nextTier].emoji;
        }

        resizeCanvas() {
            const rect = this.box.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            this.scaleX = this.canvas.width / this.V_WIDTH;
            this.scaleY = this.canvas.height / this.V_HEIGHT;
        }

        // --- GAME CONTROLS & INPUT ---
        initEvents() {
            Sound.init();

            // Pointer Aim and Drop
            let isPointerDown = false;

            const handlePointerMove = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const canvasX = (clientX - rect.left) / (rect.width / this.V_WIDTH);
                
                const curRadius = FRUITS[this.currentTier].r;
                this.dropperX = Math.max(this.WALL_LEFT + curRadius, Math.min(this.WALL_RIGHT - curRadius, canvasX));
            };

            this.canvas.addEventListener('pointerdown', (e) => {
                isPointerDown = true;
                handlePointerMove(e);
            });

            this.canvas.addEventListener('pointermove', (e) => {
                if (isPointerDown) handlePointerMove(e);
            });

            this.canvas.addEventListener('pointerup', (e) => {
                if (isPointerDown) {
                    isPointerDown = false;
                    this.dropCurrentFruit();
                }
            });

            this.canvas.addEventListener('pointercancel', () => {
                isPointerDown = false;
            });

            // Top Buttons
            this.dom.btnSound.addEventListener('click', () => {
                Sound.enabled = !Sound.enabled;
                this.dom.btnSound.textContent = Sound.enabled ? '🔊' : '🔇';
            });

            this.dom.btnGuide.addEventListener('click', () => {
                this.dom.guideModal.classList.add('active');
            });

            this.dom.btnCloseGuide.addEventListener('click', () => {
                this.dom.guideModal.classList.remove('active');
            });

            this.dom.btnGotIt.addEventListener('click', () => {
                this.dom.guideModal.classList.remove('active');
            });

            this.dom.btnNudge.addEventListener('click', () => {
                this.nudgeContainer();
            });

            this.dom.btnRestart.addEventListener('click', () => {
                this.restartGame();
            });

            this.dom.btnPlayAgain.addEventListener('click', () => {
                this.dom.gameoverModal.classList.remove('active');
                this.restartGame();
            });

            // Close modals when clicking background
            window.addEventListener('click', (e) => {
                if (e.target === this.dom.guideModal) this.dom.guideModal.classList.remove('active');
            });
        }

        dropCurrentFruit() {
            if (!this.canDrop || this.gameOver) return;

            if (!this.hasDroppedOnce) {
                this.hasDroppedOnce = true;
                this.dom.tapHint.style.opacity = '0';
            }

            const fruit = new FruitBody(this.dropperX, this.DROP_Y, this.currentTier);
            fruit.vy = 1.0;
            this.fruits.push(fruit);

            Sound.playDrop();

            this.canDrop = false;
            this.dropCooldownTimer = 35; // ~0.55s cooldown

            // Cycle next
            this.currentTier = this.nextTier;
            this.nextTier = this.getRandomSpawnTier();
            this.updateNextPreview();

            // Clamp dropperX to new fruit's radius
            const newRadius = FRUITS[this.currentTier].r;
            this.dropperX = Math.max(this.WALL_LEFT + newRadius, Math.min(this.WALL_RIGHT - newRadius, this.dropperX));
        }

        nudgeContainer() {
            if (this.nudgeCooldown > 0 || this.gameOver) return;
            this.nudgeCooldown = 240; // 4 seconds cooldown
            Sound.playBounce(3);

            this.fruits.forEach(f => {
                f.vx += (Math.random() - 0.5) * 4.5;
                f.vy -= (1.5 + Math.random() * 2.5);
                f.squishX = 0.85;
                f.squishY = 1.15;
            });

            this.spawnFloatingText(this.V_WIDTH / 2, this.V_HEIGHT / 2, '🫨 SHAKE!', '#38bdf8');
        }

        restartGame() {
            this.fruits = [];
            this.particles = [];
            this.floatingTexts = [];
            this.score = 0;
            this.dom.scoreVal.textContent = '0';
            this.gameOver = false;
            this.canDrop = true;
            this.dangerTimer = 0;
            this.dom.dangerWarning.style.display = 'none';
            this.currentTier = this.getRandomSpawnTier();
            this.nextTier = this.getRandomSpawnTier();
            this.updateNextPreview();
        }

        // --- PHYSICS & COLLISION RESOLUTION ---
        updatePhysics() {
            const stepGravity = this.GRAVITY / this.SUBSTEPS;

            for (let step = 0; step < this.SUBSTEPS; step++) {
                // Move bodies
                for (let i = 0; i < this.fruits.length; i++) {
                    const f = this.fruits[i];
                    f.update(stepGravity, this.FRICTION);

                    // Boundary collision (Left, Right, Bottom)
                    if (f.x - f.r < this.WALL_LEFT) {
                        f.x = this.WALL_LEFT + f.r;
                        f.vx = -f.vx * this.RESTITUTION;
                    } else if (f.x + f.r > this.WALL_RIGHT) {
                        f.x = this.WALL_RIGHT - f.r;
                        f.vx = -f.vx * this.RESTITUTION;
                    }

                    if (f.y + f.r > this.FLOOR_Y) {
                        f.y = this.FLOOR_Y - f.r;
                        f.vy = -f.vy * this.RESTITUTION;
                        f.vx *= 0.95; // floor friction
                    }
                }

                // Circle - Circle Collisions & Merging
                for (let i = 0; i < this.fruits.length; i++) {
                    for (let j = i + 1; j < this.fruits.length; j++) {
                        const a = this.fruits[i];
                        const b = this.fruits[j];

                        if (a.merged || b.merged) continue;

                        const dx = b.x - a.x;
                        const dy = b.y - a.y;
                        const distSq = dx * dx + dy * dy;
                        const minDist = a.r + b.r;

                        if (distSq < minDist * minDist) {
                            const dist = Math.sqrt(distSq) || 0.001;
                            const overlap = minDist - dist;
                            const nx = dx / dist;
                            const ny = dy / dist;

                            // CHECK MERGE CONDITION
                            if (a.tier === b.tier && a.tier < FRUITS.length - 1) {
                                a.merged = true;
                                b.merged = true;
                                this.handleMerge(a, b);
                                continue;
                            }

                            // Positional Correction (separate based on mass)
                            const totalMass = a.mass + b.mass;
                            const mRatioA = b.mass / totalMass;
                            const mRatioB = a.mass / totalMass;

                            a.x -= nx * overlap * mRatioA;
                            a.y -= ny * overlap * mRatioA;
                            b.x += nx * overlap * mRatioB;
                            b.y += ny * overlap * mRatioB;

                            // Velocity Impulse along collision normal
                            const rvx = b.vx - a.vx;
                            const rvy = b.vy - a.vy;
                            const velAlongNormal = rvx * nx + rvy * ny;

                            if (velAlongNormal < 0) {
                                const impulseMag = -(1 + this.RESTITUTION) * velAlongNormal / (1 / a.mass + 1 / b.mass);
                                const impX = nx * impulseMag;
                                const impY = ny * impulseMag;

                                a.vx -= impX / a.mass;
                                a.vy -= impY / a.mass;
                                b.vx += impX / b.mass;
                                b.vy += impY / b.mass;

                                // Squish deformation based on impact velocity
                                const impactSpeed = Math.abs(velAlongNormal);
                                if (impactSpeed > 1.2) {
                                    Sound.playBounce(impactSpeed);
                                    a.squishX = 1 + Math.min(0.3, impactSpeed * 0.05);
                                    a.squishY = 1 - Math.min(0.3, impactSpeed * 0.05);
                                    b.squishX = 1 + Math.min(0.3, impactSpeed * 0.05);
                                    b.squishY = 1 - Math.min(0.3, impactSpeed * 0.05);
                                }
                            }
                        }
                    }
                }
            }

            // Remove merged fruits and compact array
            this.fruits = this.fruits.filter(f => !f.merged);
        }

        handleMerge(a, b) {
            const nextTier = a.tier + 1;
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;

            // Spawn new evolved fruit
            const evolved = new FruitBody(midX, midY, nextTier);
            evolved.vy = -1.2; // slight upward pop
            this.fruits.push(evolved);

            // Audio & Juice Particles
            Sound.playPop(nextTier);
            const def = FRUITS[nextTier];

            for (let p = 0; p < 16; p++) {
                this.particles.push(new Particle(midX, midY, def.color));
            }

            // Points calculation
            const pts = def.pts;
            this.score += pts;
            this.dom.scoreVal.textContent = this.score;

            this.spawnFloatingText(midX, midY - 10, '+' + pts, def.highlight);

            // Special Fanfare for Watermelon Creation
            if (nextTier === FRUITS.length - 1) {
                Sound.playWatermelonFanfare();
                this.spawnFloatingText(midX, midY - 40, '🍉 WATERMELON! 🍉', '#4ade80');
                for (let p = 0; p < 40; p++) {
                    this.particles.push(new Particle(midX, midY, '#22c55e'));
                    this.particles.push(new Particle(midX, midY, '#ef4444'));
                }
            }

            // High Score Check
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.dom.bestVal.textContent = this.bestScore;
                localStorage.setItem('pmg_watermelon_best', this.bestScore);
            }
        }

        spawnFloatingText(x, y, text, color) {
            this.floatingTexts.push(new FloatingText(x, y, text, color));
        }

        // --- DANGER LINE & GAME OVER CHECK ---
        checkDangerLine() {
            if (this.gameOver) return;

            let fruitOverDanger = false;
            for (let i = 0; i < this.fruits.length; i++) {
                const f = this.fruits[i];
                // Fruit must be resting or slowly moving to count towards overflow
                if (f.y - f.r < this.DANGER_Y && Math.abs(f.vy) < 0.8 && f.scale >= 0.9) {
                    fruitOverDanger = true;
                    break;
                }
            }

            if (fruitOverDanger) {
                this.dangerTimer += 1 / 60;
                this.dom.dangerWarning.style.display = 'block';
                const remaining = Math.max(0, (3 - this.dangerTimer)).toFixed(1);
                this.dom.dangerTimerText.textContent = remaining;

                if (this.dangerTimer >= 3.0) {
                    this.triggerGameOver();
                }
            } else {
                this.dangerTimer = Math.max(0, this.dangerTimer - 2 / 60);
                if (this.dangerTimer === 0) {
                    this.dom.dangerWarning.style.display = 'none';
                }
            }
        }

        triggerGameOver() {
            this.gameOver = true;
            Sound.playGameOver();

            this.dom.finalScore.textContent = this.score;
            this.dom.finalBest.textContent = this.bestScore;

            if (this.score >= this.bestScore && this.score > 0) {
                this.dom.newHighBadge.style.display = 'block';
            } else {
                this.dom.newHighBadge.style.display = 'none';
            }

            this.dom.gameoverModal.classList.add('active');
        }

        // --- RENDER CYCLE ---
        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.save();
            ctx.scale(this.scaleX, this.scaleY);

            // 1. Container Glass Background
            ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
            ctx.fillRect(this.WALL_LEFT, this.DROP_Y - 20, this.WALL_RIGHT - this.WALL_LEFT, this.FLOOR_Y - this.DROP_Y + 20);

            // 2. Danger Dashed Line
            ctx.strokeStyle = this.dangerTimer > 0 ? '#ef4444' : 'rgba(239, 68, 68, 0.35)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(this.WALL_LEFT, this.DANGER_Y);
            ctx.lineTo(this.WALL_RIGHT, this.DANGER_Y);
            ctx.stroke();
            ctx.setLineDash([]); // reset

            // 3. Aim Dotted Guide Line
            if (this.canDrop && !this.gameOver) {
                ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 6]);
                ctx.beginPath();
                ctx.moveTo(this.dropperX, this.DROP_Y);
                ctx.lineTo(this.dropperX, this.FLOOR_Y);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // 4. Draw All Fruit Bodies
            for (let i = 0; i < this.fruits.length; i++) {
                this.fruits[i].draw(ctx);
            }

            // 5. Draw Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.update();
                p.draw(ctx);
                if (p.alpha <= 0) this.particles.splice(i, 1);
            }

            // 6. Draw Floating Texts
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                const ft = this.floatingTexts[i];
                ft.update();
                ft.draw(ctx);
                if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
            }

            // 7. Ready-to-Drop Fruit at Dropper Cloud
            if (this.canDrop && !this.gameOver) {
                const readyDef = FRUITS[this.currentTier];
                ctx.save();
                ctx.translate(this.dropperX, this.DROP_Y);

                // Cute Cloud Dropper
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.beginPath();
                ctx.arc(-14, -readyDef.r - 8, 12, 0, Math.PI * 2);
                ctx.arc(0, -readyDef.r - 12, 15, 0, Math.PI * 2);
                ctx.arc(14, -readyDef.r - 8, 12, 0, Math.PI * 2);
                ctx.fill();

                // Ready fruit
                const tempFruit = new FruitBody(0, 0, this.currentTier);
                tempFruit.scale = 1.0;
                tempFruit.draw(ctx);

                ctx.restore();
            }

            // 8. Container Glass Walls & Floor
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#0284c7';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(this.WALL_LEFT, this.DROP_Y);
            ctx.lineTo(this.WALL_LEFT, this.FLOOR_Y);
            ctx.lineTo(this.WALL_RIGHT, this.FLOOR_Y);
            ctx.lineTo(this.WALL_RIGHT, this.DROP_Y);
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.restore();
        }

        // --- MAIN ANIMATION LOOP ---
        loop(time) {
            const dt = (time - this.lastTime) / 1000;
            this.lastTime = time;

            if (!this.gameOver) {
                this.updatePhysics();
                this.checkDangerLine();

                if (!this.canDrop) {
                    this.dropCooldownTimer--;
                    if (this.dropCooldownTimer <= 0) {
                        this.canDrop = true;
                    }
                }

                if (this.nudgeCooldown > 0) {
                    this.nudgeCooldown--;
                }
            }

            this.draw();
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    // Launch game when DOM is ready
    window.addEventListener('DOMContentLoaded', () => {
        new WatermelonGame();
    });
})();
