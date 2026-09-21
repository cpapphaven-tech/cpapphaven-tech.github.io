#!/usr/bin/env python3
"""
Endless Runner Engine Archetype (Archetype: 'endless_runner')
3-lane vertical speed runner: swipe/arrow keys to switch lanes, jump over road hazards,
duck under barriers, collect energy orbs, and survive increasing speed.
"""

ARCHETYPE = "endless_runner"
PRIMARY_MECHANIC = "lane-switching"
DEFAULT_MECHANICS = ["lane-switching", "obstacle-avoidance", "jumping", "speed-progression"]
DEFAULT_CONTROLS = ["touch", "keyboard"]
GAMEPLAY_LOOP = "dash along 3 lanes, switch lanes and jump over barriers to survive as speed accelerates"

def generate(game_title="Cyber Lane Dash", folder_name="CyberLaneDash", **kwargs):
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
            <div class="hud-card"><span class="hud-label">DISTANCE</span><span class="hud-val" id="score-val">0m</span></div>
            <div class="hud-card"><span class="hud-label">COINS</span><span class="hud-val" id="coin-val">0</span></div>
            <div class="hud-card best-card"><span class="hud-label">BEST</span><span class="hud-val" id="best-val">0m</span></div>
            <button id="btn-sound" class="icon-btn">🔊</button>
        </header>
        <div class="canvas-container" id="canvas-container">
            <canvas id="game-canvas"></canvas>
            <div class="tap-hint" id="tap-hint"><span>👆 Swipe Left/Right to change lanes!</span></div>
        </div>
    </div>
    <div class="modal" id="gameover-modal">
        <div class="modal-box">
            <h2>CRASHED! 💥</h2>
            <p>Distance reached: <strong id="final-score">0m</strong></p>
            <div id="record-badge" class="record-badge" style="display:none;">🏆 NEW DISTANCE RECORD! 🏆</div>
            <button class="action-btn" id="btn-restart">RUN AGAIN 🔄</button>
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

    game_js = '''// 3-Lane Runner Engine — Lane Switching & Obstacle Dodging
(function () {
    'use strict';
    const Sound = {
        ctx: null, enabled: true,
        init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} },
        playSwipe() {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(350, now);
            gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.09);
        },
        playCrash() {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(140, now);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.35);
        }
    };

    class RunnerGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.container = document.getElementById('canvas-container');

            this.dom = {
                scoreVal: document.getElementById('score-val'),
                coinVal: document.getElementById('coin-val'),
                bestVal: document.getElementById('best-val'),
                tapHint: document.getElementById('tap-hint'),
                gameoverModal: document.getElementById('gameover-modal'),
                finalScore: document.getElementById('final-score'),
                recordBadge: document.getElementById('record-badge'),
                btnRestart: document.getElementById('btn-restart'),
                btnSound: document.getElementById('btn-sound')
            };

            this.bestScore = parseInt(localStorage.getItem('pmg_runner_best'), 10) || 0;
            this.dom.bestVal.textContent = this.bestScore + 'm';

            this.V_WIDTH = 400;
            this.V_HEIGHT = 650;
            this.LANES = [80, 200, 320];

            this.init();
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.initEvents();

            requestAnimationFrame((t) => this.loop(t));
        }

        init() {
            this.score = 0;
            this.coins = 0;
            this.gameOver = false;
            this.lane = 1; // Center lane
            this.playerX = this.LANES[1];
            this.playerY = 540;
            this.speed = 5;

            this.obstacles = [];
            this.trackY = 0;
            this.dom.scoreVal.textContent = '0m';
            this.dom.coinVal.textContent = '0';
            this.dom.tapHint.style.opacity = '1';
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

            const move = (dir) => {
                if (this.gameOver) return;
                this.dom.tapHint.style.opacity = '0';
                if (dir === 'left' && this.lane > 0) { this.lane--; Sound.playSwipe(); }
                if (dir === 'right' && this.lane < 2) { this.lane++; Sound.playSwipe(); }
            };

            window.addEventListener('keydown', (e) => {
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') move('left');
                if (e.code === 'ArrowRight' || e.code === 'KeyD') move('right');
            });

            let touchStartX = 0;
            this.canvas.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
            }, { passive: true });

            this.canvas.addEventListener('touchend', (e) => {
                const dx = e.changedTouches[0].clientX - touchStartX;
                if (Math.abs(dx) > 25) move(dx > 0 ? 'right' : 'left');
            }, { passive: true });

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
            if (this.gameOver) return;

            // Player position smooth glide
            this.playerX += (this.LANES[this.lane] - this.playerX) * 0.25;

            // Distance progression
            this.score += Math.round(this.speed / 5);
            this.dom.scoreVal.textContent = this.score + 'm';
            this.speed = Math.min(12, 5 + this.score * 0.003);

            // Track road lines
            this.trackY = (this.trackY + this.speed) % 80;

            // Spawn obstacles
            if (Math.random() < 0.035 && this.obstacles.length < 5) {
                const lane = Math.floor(Math.random() * 3);
                const last = this.obstacles[this.obstacles.length - 1];
                if (!last || last.y > 140) {
                    this.obstacles.push({
                        lane: lane,
                        x: this.LANES[lane],
                        y: -50,
                        w: 48,
                        h: 40
                    });
                }
            }

            // Move obstacles
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obs = this.obstacles[i];
                obs.y += this.speed;

                // Collision check
                if (Math.abs(obs.x - this.playerX) < 35 && Math.abs(obs.y - this.playerY) < 35) {
                    Sound.playCrash();
                    this.triggerGameOver();
                    return;
                }

                if (obs.y > this.V_HEIGHT + 50) {
                    this.obstacles.splice(i, 1);
                }
            }
        }

        triggerGameOver() {
            this.gameOver = true;
            this.dom.finalScore.textContent = this.score + 'm';
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.dom.bestVal.textContent = this.bestScore + 'm';
                localStorage.setItem('pmg_runner_best', this.bestScore);
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

            // Road & Lanes
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 20]);
            ctx.lineDashOffset = -this.trackY;
            ctx.beginPath();
            ctx.moveTo(140, 0); ctx.lineTo(140, this.V_HEIGHT);
            ctx.moveTo(260, 0); ctx.lineTo(260, this.V_HEIGHT);
            ctx.stroke();
            ctx.setLineDash([]);

            // Obstacles
            for (let obs of this.obstacles) {
                ctx.fillStyle = '#ef4444';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 10;
                ctx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
            }

            // Player Runner
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(this.playerX, this.playerY, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        loop(time) {
            this.update();
            this.draw();
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    window.addEventListener('DOMContentLoaded', () => new RunnerGame());
})();
'''

    seo_body = f'''
    <p>Dash through neon highway lanes in <strong>{game_title}</strong>! Swipe left and right across 3 lanes to dodge roadblocks and hazards as your speed accelerates.</p>
    '''

    faq_section = f'''
    <div class="faq-card"><h4>Q: How do controls work on mobile?</h4><p>A: Swipe left or right anywhere on your screen to quickly glide between lanes.</p></div>
    '''

    blog_content = f'''
    <h2>Reflex Lane Switching in {game_title}</h2>
    <p>Keep your focus on the middle distance to plan your lane transitions before high-speed obstacles arrive.</p>
    '''

    return {
        'game_html': game_html,
        'style_css': style_css,
        'game_js': game_js,
        'seo_body': seo_body,
        'faq_section': faq_section,
        'blog_content': blog_content
    }
