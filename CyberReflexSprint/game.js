// Cyber Reflex Engine — Quick Time Reflex & Response Time Tracker
(function () {
    'use strict';

    const DIRS = ['up', 'right', 'down', 'left'];
    const ICONS = { up: '▲', right: '▶', down: '▼', left: '◀' };
    const COLORS = { up: '#38bdf8', right: '#10b981', down: '#f59e0b', left: '#f43f5e' };

    const Sound = {
        ctx: null, enabled: true,
        init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} },
        playHit() {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle'; osc.frequency.setValueAtTime(587.3, now);
            gain.gain.setValueAtTime(0.14, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.12);
        },
        playMiss() {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(160, now);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.28);
        }
    };

    class ReflexGame {
        constructor() {
            this.dom = {
                scoreVal: document.getElementById('score-val'),
                avgVal: document.getElementById('avg-val'),
                bestVal: document.getElementById('best-val'),
                cueArrow: document.getElementById('cue-arrow'),
                cueLabel: document.getElementById('cue-label'),
                timerFill: document.getElementById('timer-fill'),
                gameoverModal: document.getElementById('gameover-modal'),
                finalScore: document.getElementById('final-score'),
                finalAvg: document.getElementById('final-avg'),
                recordBadge: document.getElementById('record-badge'),
                btnRestart: document.getElementById('btn-restart'),
                btnSound: document.getElementById('btn-sound')
            };

            this.bestScore = parseInt(localStorage.getItem('pmg_reflex_best'), 10) || 0;
            this.dom.bestVal.textContent = this.bestScore;

            this.init();
            this.initEvents();
        }

        init() {
            this.score = 0;
            this.gameOver = false;
            this.reactionTimes = [];
            this.dom.scoreVal.textContent = '0';
            this.dom.avgVal.textContent = '0ms';

            this.timeAllowed = 1200; // ms
            this.nextCue();
        }

        nextCue() {
            this.currentDir = DIRS[Math.floor(Math.random() * DIRS.length)];
            const color = COLORS[this.currentDir];

            this.dom.cueArrow.textContent = ICONS[this.currentDir];
            this.dom.cueArrow.style.color = color;
            this.dom.cueLabel.textContent = this.currentDir.toUpperCase();
            this.dom.cueLabel.style.color = color;

            this.cueStartTime = performance.now();
            this.timeAllowed = Math.max(380, 1200 - (this.score * 25));

            this.startTimerBar();
        }

        startTimerBar() {
            if (this.timerRaf) cancelAnimationFrame(this.timerRaf);
            const start = performance.now();

            const update = () => {
                if (this.gameOver) return;
                const elapsed = performance.now() - start;
                const pct = Math.max(0, 1 - (elapsed / this.timeAllowed));
                this.dom.timerFill.style.transform = `scaleX(${pct})`;

                if (elapsed >= this.timeAllowed) {
                    this.handleInput('timeout');
                } else {
                    this.timerRaf = requestAnimationFrame(update);
                }
            };
            this.timerRaf = requestAnimationFrame(update);
        }

        handleInput(dir) {
            if (this.gameOver) return;

            if (dir === this.currentDir) {
                const rt = Math.round(performance.now() - this.cueStartTime);
                this.reactionTimes.push(rt);
                this.score++;
                this.dom.scoreVal.textContent = this.score;

                const avg = Math.round(this.reactionTimes.reduce((a,b)=>a+b, 0) / this.reactionTimes.length);
                this.dom.avgVal.textContent = avg + 'ms';

                Sound.playHit();
                this.nextCue();
            } else {
                Sound.playMiss();
                this.triggerGameOver();
            }
        }

        triggerGameOver() {
            this.gameOver = true;
            if (this.timerRaf) cancelAnimationFrame(this.timerRaf);

            const avg = this.reactionTimes.length > 0 ? Math.round(this.reactionTimes.reduce((a,b)=>a+b, 0) / this.reactionTimes.length) : 0;
            this.dom.finalScore.textContent = this.score;
            this.dom.finalAvg.textContent = avg + 'ms';

            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.dom.bestVal.textContent = this.bestScore;
                localStorage.setItem('pmg_reflex_best', this.bestScore);
                this.dom.recordBadge.style.display = 'block';
            } else {
                this.dom.recordBadge.style.display = 'none';
            }

            this.dom.gameoverModal.classList.add('active');
        }

        initEvents() {
            Sound.init();

            document.querySelectorAll('.resp-btn').forEach(btn => {
                btn.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    this.handleInput(btn.getAttribute('data-dir'));
                });
            });

            window.addEventListener('keydown', (e) => {
                if (e.code === 'ArrowUp' || e.code === 'KeyW') this.handleInput('up');
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.handleInput('right');
                if (e.code === 'ArrowDown' || e.code === 'KeyS') this.handleInput('down');
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.handleInput('left');
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
    }

    window.addEventListener('DOMContentLoaded', () => new ReflexGame());
})();
