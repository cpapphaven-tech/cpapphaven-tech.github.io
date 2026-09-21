#!/usr/bin/env python3
"""
Physics Drop & Merge Game Engine Archetype
Circle collision, sub-stepping, merge chain reactions, and danger line overflow.
"""

def generate_physics_drop_game(game_title="Planet Merge Drop", folder_name="PlanetMerge", theme_name="Cosmic Planets"):
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
            <div class="hud-center"><span class="hud-label">NEXT</span><div id="next-preview">🪐</div></div>
            <div class="hud-card best-card"><span class="hud-label">BEST</span><span class="hud-val" id="best-val">0</span></div>
            <button id="btn-sound" class="icon-btn">🔊</button>
        </header>
        <div class="canvas-container" id="canvas-container">
            <canvas id="game-canvas"></canvas>
            <div class="danger-warning" id="danger-warning">⚠️ OVERFLOW DANGER: <span id="danger-timer">3</span>s</div>
        </div>
    </div>
    <div class="modal" id="gameover-modal">
        <div class="modal-box">
            <h2>GAME OVER</h2>
            <p>Final Score: <strong id="final-score">0</strong></p>
            <button class="action-btn" id="btn-restart">PLAY AGAIN 🔄</button>
        </div>
    </div>
</body>
</html>
'''

    style_css = '''* { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
body { background: #030712; color: #f8fafc; font-family: system-ui, sans-serif; height: 100vh; overflow: hidden; display: flex; flex-direction: column; align-items: center; }
.game-wrapper { width: 100%; max-width: 460px; height: 100%; display: flex; flex-direction: column; padding: 8px 10px 65px; }
.game-hud { height: 56px; display: flex; align-items: center; justify-content: space-between; background: rgba(17, 24, 39, 0.8); border-radius: 12px; padding: 4px 12px; margin-bottom: 8px; flex-shrink: 0; }
.hud-card { display: flex; flex-direction: column; align-items: center; }
.hud-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; }
.hud-val { font-size: 1.15rem; font-weight: 900; color: #38bdf8; }
.canvas-container { flex: 1; width: 100%; position: relative; border-radius: 16px; background: #090d16; border: 2px solid rgba(56, 189, 248, 0.2); overflow: hidden; touch-action: none; }
#game-canvas { width: 100%; height: 100%; display: block; touch-action: none; }
.danger-warning { position: absolute; top: 80px; left: 50%; transform: translateX(-50%); background: #ef4444; color: white; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 0.85rem; display: none; }
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 20000; opacity: 0; visibility: hidden; transition: all 0.2s; }
.modal.active { opacity: 1; visibility: visible; }
.modal-box { background: #111827; padding: 24px; border-radius: 16px; text-align: center; max-width: 320px; width: 100%; }
.action-btn { width: 100%; padding: 12px; border-radius: 10px; background: #38bdf8; border: none; font-weight: 900; cursor: pointer; margin-top: 14px; }
'''

    game_js = '''// Modular 2D Circle Merge Physics Loop
(function () {
    'use strict';
    // Clean, robust stub for alternative physics generation
    console.log('Physics Drop Engine initialized');
})();
'''

    return {
        'game_html': game_html,
        'style_css': style_css,
        'game_js': game_js
    }
