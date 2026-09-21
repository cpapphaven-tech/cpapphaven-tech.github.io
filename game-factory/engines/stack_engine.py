#!/usr/bin/env python3
"""
Stack Engine Archetype (Archetype: 'stack')
Precision block-slicing tower builder. Moving blocks slide horizontally across the tower;
tapping slices off overhanging portions with physics falloff. Perfect alignment triggers combo chimes.
"""

ARCHETYPE = "stack"
PRIMARY_MECHANIC = "block-slicing"
DEFAULT_MECHANICS = ["block-slicing", "tower-stacking", "precision-timing", "combo-multiplier"]
DEFAULT_CONTROLS = ["touch", "keyboard", "mouse"]
GAMEPLAY_LOOP = "tap to drop and slice moving blocks on a tower, trimming overhangs until precision runs out"

def generate(game_title="Tower Stack Blitz", folder_name="TowerStack", **kwargs):
    slug = folder_name.lower()

    game_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>{game_title} | PlayMixGames</title>
    <meta name="description" content="Stack the blocks as high as you can! Trim overhangs with precision timing.">
    <link rel="stylesheet" href="style.css">
    <script type="module" src="../analytics.js"></script>
    <script defer src="game.js"></script>
</head>
<body>
    <div class="game-wrapper">
        <header class="game-hud">
            <div class="hud-card"><span class="hud-label">FLOORS</span><span class="hud-val" id="score-val">0</span></div>
            <div class="hud-card"><span class="hud-label">COMBO</span><span class="hud-val" id="combo-val">0x</span></div>
            <div class="hud-card best-card"><span class="hud-label">BEST</span><span class="hud-val" id="best-val">0</span></div>
            <button id="btn-sound" class="icon-btn">🔊</button>
        </header>
        <div class="canvas-container" id="canvas-container">
            <canvas id="game-canvas"></canvas>
            <div class="tap-hint" id="tap-hint"><span>👆 Tap to place block!</span></div>
        </div>
    </div>
    <div class="modal" id="gameover-modal">
        <div class="modal-box">
            <h2>TOWER TOPPLED! 🏗️</h2>
            <p>You stacked <strong id="final-score">0</strong> floors high.</p>
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

    game_js = '''// Tower Stack Engine — 60 FPS Block Overhang Slicing & Rising Camera
(function () {
    'use strict';

    const Sound = {
        ctx: null, enabled: true,
        init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} },
        playSlice(combo) {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const freq = 260 + (combo * 40);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.16);
        },
        playFall() {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.32);
        }
    };

    class StackGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.container = document.getElementById('canvas-container');

            this.dom = {
                scoreVal: document.getElementById('score-val'),
                comboVal: document.getElementById('combo-val'),
                bestVal: document.getElementById('best-val'),
                tapHint: document.getElementById('tap-hint'),
                gameoverModal: document.getElementById('gameover-modal'),
                finalScore: document.getElementById('final-score'),
                recordBadge: document.getElementById('record-badge'),
                btnRestart: document.getElementById('btn-restart'),
                btnSound: document.getElementById('btn-sound')
            };

            this.bestScore = parseInt(localStorage.getItem('pmg_stack_best'), 10) || 0;
            this.dom.bestVal.textContent = this.bestScore;

            this.init();
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.initEvents();

            requestAnimationFrame((t) => this.loop(t));
        }

        init() {
            this.score = 0;
            this.combo = 0;
            this.gameOver = false;
            this.dom.scoreVal.textContent = '0';
            this.dom.comboVal.textContent = '0x';

            this.V_WIDTH = 400;
            this.V_HEIGHT = 600;
            this.BLOCK_HEIGHT = 28;

            this.blocks = [];
            this.fallingSlices = [];

            // Base block
            this.blocks.push({
                x: 80,
                y: this.V_HEIGHT - 80,
                width: 240,
                color: this.getColor(0)
            });

            this.currentX = 0;
            this.speed = 3.5;
            this.dir = 1;
            this.cameraY = 0;

            this.dom.tapHint.style.opacity = '1';
        }

        getColor(idx) {
            const hues = [200, 220, 260, 300, 340, 20, 50, 140, 170];
            const h = hues[idx % hues.length];
            return `hsl(${h}, 85%, 55%)`;
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
            const place = () => {
                if (this.gameOver) return;
                this.dom.tapHint.style.opacity = '0';
                this.placeBlock();
            };

            this.canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); place(); });
            window.addEventListener('keydown', (e) => { if (e.code === 'Space') place(); });
            this.dom.btnRestart.addEventListener('click', () => {
                this.dom.gameoverModal.classList.remove('active');
                this.init();
            });
            this.dom.btnSound.addEventListener('click', () => {
                Sound.enabled = !Sound.enabled;
                this.dom.btnSound.textContent = Sound.enabled ? '🔊' : '🔇';
            });
        }

        placeBlock() {
            const top = this.blocks[this.blocks.length - 1];
            const curWidth = top.width;
            const diff = this.currentX - top.x;

            if (Math.abs(diff) >= curWidth) {
                // Complete miss
                Sound.playFall();
                this.triggerGameOver();
                return;
            }

            let newWidth = curWidth - Math.abs(diff);
            let newX = diff > 0 ? this.currentX : top.x;

            // Perfect alignment check (<= 3px)
            if (Math.abs(diff) <= 3) {
                newWidth = curWidth;
                newX = top.x;
                this.combo++;
            } else {
                this.combo = 0;
                // Add falling sliced piece
                const sliceWidth = Math.abs(diff);
                const sliceX = diff > 0 ? top.x + curWidth : this.currentX;
                this.fallingSlices.push({
                    x: sliceX,
                    y: top.y - this.BLOCK_HEIGHT,
                    width: sliceWidth,
                    vy: 0,
                    color: this.getColor(this.blocks.length)
                });
            }

            Sound.playSlice(this.combo);
            this.score++;
            this.dom.scoreVal.textContent = this.score;
            this.dom.comboVal.textContent = this.combo + 'x';

            this.blocks.push({
                x: newX,
                y: top.y - this.BLOCK_HEIGHT,
                width: newWidth,
                color: this.getColor(this.blocks.length)
            });

            this.currentX = this.dir > 0 ? 0 : this.V_WIDTH - newWidth;
            this.speed = Math.min(7, 3.5 + this.score * 0.1);
        }

        triggerGameOver() {
            this.gameOver = true;
            this.dom.finalScore.textContent = this.score;
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.dom.bestVal.textContent = this.bestScore;
                localStorage.setItem('pmg_stack_best', this.bestScore);
                this.dom.recordBadge.style.display = 'block';
            } else {
                this.dom.recordBadge.style.display = 'none';
            }
            setTimeout(() => this.dom.gameoverModal.classList.add('active'), 500);
        }

        update() {
            if (this.gameOver) return;
            const top = this.blocks[this.blocks.length - 1];

            // Moving current block
            this.currentX += this.speed * this.dir;
            if (this.currentX < 0) {
                this.currentX = 0;
                this.dir = 1;
            } else if (this.currentX + top.width > this.V_WIDTH) {
                this.currentX = this.V_WIDTH - top.width;
                this.dir = -1;
            }

            // Camera follow
            const targetCamY = Math.max(0, (this.blocks.length - 8) * this.BLOCK_HEIGHT);
            this.cameraY += (targetCamY - this.cameraY) * 0.1;

            // Falling slices
            for (let i = this.fallingSlices.length - 1; i >= 0; i--) {
                const s = this.fallingSlices[i];
                s.vy += 0.5;
                s.y += s.vy;
                if (s.y > this.V_HEIGHT + this.cameraY + 50) this.fallingSlices.splice(i, 1);
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.save();
            ctx.scale(this.scaleX, this.scaleY);
            ctx.save();
            ctx.translate(0, this.cameraY);

            // Draw stacked blocks
            for (let b of this.blocks) {
                ctx.fillStyle = b.color;
                ctx.shadowColor = b.color;
                ctx.shadowBlur = 6;
                ctx.fillRect(b.x, b.y, b.width, this.BLOCK_HEIGHT - 2);
            }

            // Draw falling slices
            for (let s of this.fallingSlices) {
                ctx.fillStyle = s.color;
                ctx.fillRect(s.x, s.y, s.width, this.BLOCK_HEIGHT - 2);
            }

            // Draw current active block
            if (!this.gameOver) {
                const top = this.blocks[this.blocks.length - 1];
                ctx.fillStyle = this.getColor(this.blocks.length);
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 10;
                ctx.fillRect(this.currentX, top.y - this.BLOCK_HEIGHT, top.width, this.BLOCK_HEIGHT - 2);
            }

            ctx.restore();
            ctx.restore();
        }

        loop(time) {
            this.update();
            this.draw();
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    window.addEventListener('DOMContentLoaded', () => new StackGame());
})();
'''

    seo_body = f'''
    <p>Stack blocks to build the tallest skyscraper in <strong>{game_title}</strong>! Moving blocks slide horizontally across the tower. Time your taps with razor-sharp precision to trim overhangs and trigger perfect combos.</p>
    '''

    faq_section = f'''
    <div class="faq-card"><h4>Q: What is a perfect combo?</h4><p>A: When you line up a block within 3 pixels of the block below, zero mass is sliced and your combo counter increases!</p></div>
    '''

    blog_content = f'''
    <h2>Mastering Tower Height in {game_title}</h2>
    <p>Precision block stacking requires rhythm and visual anticipation. Learn when to tap early and how to maintain block width.</p>
    '''

    return {
        'game_html': game_html,
        'style_css': style_css,
        'game_js': game_js,
        'seo_body': seo_body,
        'faq_section': faq_section,
        'blog_content': blog_content
    }
