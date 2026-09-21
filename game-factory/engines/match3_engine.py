#!/usr/bin/env python3
"""
Match-3 Engine Archetype (Archetype: 'match3')
8x8 gem/fruit swap grid, match-3/4/5 horizontal and vertical detection,
cascading gravity drops, score combos, and move counter.
"""

ARCHETYPE = "match3"
PRIMARY_MECHANIC = "tile-swap"
DEFAULT_MECHANICS = ["grid", "tile-swap", "match-3", "cascade", "combo-multiplier"]
DEFAULT_CONTROLS = ["touch", "mouse"]
GAMEPLAY_LOOP = "swap adjacent tiles to create rows or columns of 3 or more matching colors and trigger cascading combos"

def generate(game_title="Gem Cascade Match", folder_name="GemCascade", **kwargs):
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
            <div class="hud-card"><span class="hud-label">MOVES</span><span class="hud-val" id="moves-val">25</span></div>
            <div class="hud-card best-card"><span class="hud-label">BEST</span><span class="hud-val" id="best-val">0</span></div>
            <button id="btn-sound" class="icon-btn">🔊</button>
        </header>
        <div class="canvas-container" id="canvas-container">
            <canvas id="game-canvas"></canvas>
            <div class="tap-hint" id="tap-hint"><span>👆 Tap and swap adjacent gems!</span></div>
        </div>
    </div>
    <div class="modal" id="gameover-modal">
        <div class="modal-box">
            <h2>OUT OF MOVES! 💎</h2>
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
.tap-hint { position: absolute; top: 85%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); padding: 8px 16px; border-radius: 20px; color: #38bdf8; font-weight: 700; font-size: 0.85rem; pointer-events: none; }
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 20000; opacity: 0; visibility: hidden; transition: all 0.2s; }
.modal.active { opacity: 1; visibility: visible; }
.modal-box { background: #111827; padding: 24px; border-radius: 16px; text-align: center; max-width: 320px; width: 100%; border: 1px solid rgba(56, 189, 248, 0.3); }
.action-btn { width: 100%; padding: 12px; border-radius: 10px; background: #38bdf8; border: none; font-weight: 900; cursor: pointer; margin-top: 14px; color: #020617; }
.record-badge { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 6px; border-radius: 6px; font-weight: 800; font-size: 0.8rem; margin: 10px 0; }
'''

    game_js = '''// Match-3 Engine — 8x8 Grid Swapping, Cascades & Combos
(function () {
    'use strict';
    const GEMS = ['💎', '🍒', '🌟', '🍇', '🍀', '🍊'];
    const COLORS = ['#38bdf8', '#ef4444', '#facc15', '#a855f7', '#10b981', '#fb923c'];

    const Sound = {
        ctx: null, enabled: true,
        init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} },
        playMatch(combo) {
            if (!this.enabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const freq = 440 + combo * 60;
            osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.16);
        }
    };

    class Match3Game {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.container = document.getElementById('canvas-container');

            this.dom = {
                scoreVal: document.getElementById('score-val'),
                movesVal: document.getElementById('moves-val'),
                bestVal: document.getElementById('best-val'),
                tapHint: document.getElementById('tap-hint'),
                gameoverModal: document.getElementById('gameover-modal'),
                finalScore: document.getElementById('final-score'),
                recordBadge: document.getElementById('record-badge'),
                btnRestart: document.getElementById('btn-restart'),
                btnSound: document.getElementById('btn-sound')
            };

            this.bestScore = parseInt(localStorage.getItem('pmg_match3_best'), 10) || 0;
            this.dom.bestVal.textContent = this.bestScore;

            this.GRID = 8;
            this.init();
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.initEvents();

            requestAnimationFrame((t) => this.loop(t));
        }

        init() {
            this.score = 0;
            this.moves = 25;
            this.gameOver = false;
            this.selected = null;
            this.combo = 0;
            this.dom.scoreVal.textContent = '0';
            this.dom.movesVal.textContent = '25';

            this.grid = [];
            for (let r = 0; r < this.GRID; r++) {
                this.grid[r] = [];
                for (let c = 0; c < this.GRID; c++) {
                    this.grid[r][c] = Math.floor(Math.random() * GEMS.length);
                }
            }
            this.clearInitialMatches();
        }

        clearInitialMatches() {
            let matches = this.findMatches();
            while (matches.length > 0) {
                for (let m of matches) {
                    this.grid[m.r][m.c] = Math.floor(Math.random() * GEMS.length);
                }
                matches = this.findMatches();
            }
        }

        findMatches() {
            const matches = [];
            // Horizontal
            for (let r = 0; r < this.GRID; r++) {
                for (let c = 0; c < this.GRID - 2; c++) {
                    const val = this.grid[r][c];
                    if (val === this.grid[r][c+1] && val === this.grid[r][c+2]) {
                        matches.push({r, c}, {r, c: c+1}, {r, c: c+2});
                    }
                }
            }
            // Vertical
            for (let c = 0; c < this.GRID; c++) {
                for (let r = 0; r < this.GRID - 2; r++) {
                    const val = this.grid[r][c];
                    if (val === this.grid[r+1][c] && val === this.grid[r+2][c]) {
                        matches.push({r, c}, {r: r+1, c}, {r: r+2, c});
                    }
                }
            }
            return matches;
        }

        resize() {
            const rect = this.container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            this.cellSize = (this.canvas.width - 20) / this.GRID;
            this.offsetX = 10;
            this.offsetY = (this.canvas.height - (this.cellSize * this.GRID)) / 2;
        }

        initEvents() {
            Sound.init();

            this.canvas.addEventListener('pointerdown', (e) => {
                if (this.gameOver) return;
                const rect = this.canvas.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                const clientX = (e.clientX - rect.left) * dpr;
                const clientY = (e.clientY - rect.top) * dpr;

                const c = Math.floor((clientX - this.offsetX) / this.cellSize);
                const r = Math.floor((clientY - this.offsetY) / this.cellSize);

                if (c >= 0 && c < this.GRID && r >= 0 && r < this.GRID) {
                    this.handleCellTap(r, c);
                }
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

        handleCellTap(r, c) {
            this.dom.tapHint.style.opacity = '0';

            if (!this.selected) {
                this.selected = { r, c };
            } else {
                const dr = Math.abs(this.selected.r - r);
                const dc = Math.abs(this.selected.c - c);

                if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                    this.swap(this.selected.r, this.selected.c, r, c);
                    const matches = this.findMatches();
                    if (matches.length > 0) {
                        this.moves--;
                        this.dom.movesVal.textContent = this.moves;
                        this.processCascades();
                    } else {
                        // Swap back if no match
                        this.swap(this.selected.r, this.selected.c, r, c);
                    }
                    this.selected = null;
                } else {
                    this.selected = { r, c };
                }
            }
        }

        swap(r1, c1, r2, c2) {
            const temp = this.grid[r1][c1];
            this.grid[r1][c1] = this.grid[r2][c2];
            this.grid[r2][c2] = temp;
        }

        processCascades() {
            let matches = this.findMatches();
            this.combo = 0;

            while (matches.length > 0) {
                this.combo++;
                Sound.playMatch(this.combo);
                this.score += matches.length * 10 * this.combo;
                this.dom.scoreVal.textContent = this.score;

                // Remove matches
                for (let m of matches) {
                    this.grid[m.r][m.c] = -1;
                }

                // Drop down
                for (let c = 0; c < this.GRID; c++) {
                    for (let r = this.GRID - 1; r >= 0; r--) {
                        if (this.grid[r][c] === -1) {
                            for (let above = r - 1; above >= 0; above--) {
                                if (this.grid[above][c] !== -1) {
                                    this.grid[r][c] = this.grid[above][c];
                                    this.grid[above][c] = -1;
                                    break;
                                }
                            }
                        }
                    }
                    // Refill top
                    for (let r = 0; r < this.GRID; r++) {
                        if (this.grid[r][c] === -1) {
                            this.grid[r][c] = Math.floor(Math.random() * GEMS.length);
                        }
                    }
                }

                matches = this.findMatches();
            }

            if (this.moves <= 0) {
                this.triggerGameOver();
            }
        }

        triggerGameOver() {
            this.gameOver = true;
            this.dom.finalScore.textContent = this.score;
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.dom.bestVal.textContent = this.bestScore;
                localStorage.setItem('pmg_match3_best', this.bestScore);
                this.dom.recordBadge.style.display = 'block';
            } else {
                this.dom.recordBadge.style.display = 'none';
            }
            this.dom.gameoverModal.classList.add('active');
        }

        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const cs = this.cellSize;
            for (let r = 0; r < this.GRID; r++) {
                for (let c = 0; c < this.GRID; c++) {
                    const x = this.offsetX + c * cs;
                    const y = this.offsetY + r * cs;

                    ctx.fillStyle = 'rgba(255,255,255,0.04)';
                    ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);

                    if (this.selected && this.selected.r === r && this.selected.c === c) {
                        ctx.strokeStyle = '#38bdf8';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);
                    }

                    const val = this.grid[r][c];
                    if (val >= 0 && val < GEMS.length) {
                        ctx.font = `${Math.floor(cs * 0.55)}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(GEMS[val], x + cs / 2, y + cs / 2);
                    }
                }
            }
        }

        loop(time) {
            this.draw();
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    window.addEventListener('DOMContentLoaded', () => new Match3Game());
})();
'''

    seo_body = f'''
    <p>Swap and match sparkling gems in <strong>{game_title}</strong>! Connect 3 or more identical jewels horizontally or vertically to trigger cascading gravity drops and combo multipliers.</p>
    '''

    faq_section = f'''
    <div class="faq-card"><h4>Q: What happens when 4 or 5 gems match?</h4><p>A: Bigger matches score higher combo points and clear larger grid sections!</p></div>
    '''

    blog_content = f'''
    <h2>Mastering Cascades in {game_title}</h2>
    <p>Look for bottom-row matches to shuffle the board and trigger organic chain reactions.</p>
    '''

    return {
        'game_html': game_html,
        'style_css': style_css,
        'game_js': game_js,
        'seo_body': seo_body,
        'faq_section': faq_section,
        'blog_content': blog_content
    }
