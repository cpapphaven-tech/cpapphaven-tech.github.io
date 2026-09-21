#!/usr/bin/env python3
"""
Reaction Game Engine Archetype (Archetype: 'reaction')
Rapid-fire reflex test: visual cues (colors, arrows, symbols) flash on screen with
diminishing reaction windows (under 1 second). Mistake penalty, combo streaks, and millisecond reaction tracking.
"""

ARCHETYPE = "reaction"
PRIMARY_MECHANIC = "reaction-tap"
DEFAULT_MECHANICS = ["reaction-tap", "quick-time-event", "reflex-timer", "combo-multiplier"]
DEFAULT_CONTROLS = ["touch", "keyboard", "mouse"]
GAMEPLAY_LOOP = "tap the matching directional prompt within milliseconds before the timer bar expires"

def generate(game_title="Cyber Reflex Sprint", folder_name="CyberReflex", **kwargs):
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
            <div class="hud-card"><span class="hud-label">STREAK</span><span class="hud-val" id="score-val">0</span></div>
            <div class="hud-card"><span class="hud-label">AVG TIME</span><span class="hud-val" id="avg-val">0ms</span></div>
            <div class="hud-card best-card"><span class="hud-label">BEST</span><span class="hud-val" id="best-val">0</span></div>
            <button id="btn-sound" class="icon-btn">🔊</button>
        </header>

        <div class="reflex-arena">
            <div class="timer-bar-track"><div class="timer-bar-fill" id="timer-fill"></div></div>
            <div class="cue-display" id="cue-display">
                <div class="cue-arrow" id="cue-arrow">⚡</div>
                <div class="cue-label" id="cue-label">READY</div>
            </div>

            <div class="response-grid">
                <button class="resp-btn" data-dir="left">◀ LEFT</button>
                <button class="resp-btn" data-dir="up">▲ UP</button>
                <button class="resp-btn" data-dir="down">▼ DOWN</button>
                <button class="resp-btn" data-dir="right">▶ RIGHT</button>
            </div>
        </div>
    </div>

    <div class="modal" id="gameover-modal">
        <div class="modal-box">
            <h2>REFLEX OVERLOAD! ⚡</h2>
            <p>Your streak reached <strong id="final-score">0</strong>.</p>
            <p>Average reaction: <strong id="final-avg">0ms</strong></p>
            <div id="record-badge" class="record-badge" style="display:none;">🏆 NEW RECORD! 🏆</div>
            <button class="action-btn" id="btn-restart">TRY AGAIN 🔄</button>
        </div>
    </div>
</body>
</html>
'''

    style_css = '''* { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
body { background: #030712; color: #f8fafc; font-family: system-ui, sans-serif; height: 100vh; overflow: hidden; display: flex; flex-direction: column; align-items: center; }
.game-wrapper { width: 100%; max-width: 460px; height: 100%; display: flex; flex-direction: column; padding: 8px 10px 65px; }
.game-hud { height: 56px; display: flex; align-items: center; justify-content: space-between; background: rgba(17, 24, 39, 0.85); border-radius: 12px; padding: 4px 12px; margin-bottom: 8px; flex-shrink: 0; }
.hud-card { display: flex; flex-direction: column; align-items: center; }
.hud-label { font-size: 0.6rem; font-weight: 800; color: #94a3b8; }
.hud-val { font-size: 1.1rem; font-weight: 900; color: #38bdf8; }
.best-card .hud-val { color: #f59e0b; }
.icon-btn { width: 34px; height: 34px; border-radius: 8px; background: rgba(2, 6, 23, 0.7); border: 1px solid rgba(56, 189, 248, 0.3); color: #f8fafc; cursor: pointer; }
.reflex-arena { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; background: #090d16; border: 2px solid rgba(56, 189, 248, 0.25); border-radius: 16px; padding: 16px; }
.timer-bar-track { width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
.timer-bar-fill { width: 100%; height: 100%; background: #38bdf8; transform-origin: left; }
.cue-display { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cue-arrow { font-size: 4.5rem; text-shadow: 0 0 25px currentColor; margin-bottom: 10px; }
.cue-label { font-size: 1.2rem; font-weight: 900; letter-spacing: 2px; }
.response-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; margin-top: 10px; }
.resp-btn { padding: 18px 10px; border-radius: 12px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 1rem; font-weight: 900; cursor: pointer; }
.resp-btn:active { background: #38bdf8; color: #020617; transform: scale(0.96); }
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 20000; opacity: 0; visibility: hidden; transition: all 0.2s; }
.modal.active { opacity: 1; visibility: visible; }
.modal-box { background: #111827; padding: 24px; border-radius: 16px; text-align: center; max-width: 320px; width: 100%; border: 1px solid rgba(56, 189, 248, 0.3); }
.action-btn { width: 100%; padding: 12px; border-radius: 10px; background: #38bdf8; border: none; font-weight: 900; cursor: pointer; margin-top: 14px; color: #020617; }
.record-badge { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 6px; border-radius: 6px; font-weight: 800; font-size: 0.8rem; margin: 10px 0; }
'''

    game_js = '''// Cyber Reflex Engine — Quick Time Reflex & Response Time Tracker
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
'''

    seo_body = f'''
    <p>Test your reaction speed in <strong>{game_title}</strong>! Rapid directional prompts flash across your screen. Respond within milliseconds before the timer drains.</p>
    '''

    faq_section = f'''
    <div class="faq-card"><h4>Q: What is a good reaction time?</h4><p>A: Most players average 250ms–350ms. Competitive players can sustain under 200ms!</p></div>
    '''

    blog_content = f'''
    <h2>Enhancing Visual Reflexes with {game_title}</h2>
    <p>Discover pro gaming techniques for faster sensory reaction and sustained focus under time pressure.</p>
    '''

    return {
        'game_html': game_html,
        'style_css': style_css,
        'game_js': game_js,
        'seo_body': seo_body,
        'faq_section': faq_section,
        'blog_content': blog_content
    }
