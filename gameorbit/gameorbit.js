/**
 * GameOrbit Shared Utilities - PlayMixGames
 * Shared by all 88 GameOrbit games
 */
(function () {
  'use strict';

  /* ── Local Storage Helpers ── */
  window.GO = window.GO || {};

  GO.save = function (key, val) {
    try { localStorage.setItem('go_' + key, JSON.stringify(val)); } catch (e) {}
  };
  GO.load = function (key, def) {
    try { var v = localStorage.getItem('go_' + key); return v !== null ? JSON.parse(v) : def; } catch (e) { return def; }
  };

  /* ── Toast ── */
  GO.toast = function (msg, duration) {
    var wrap = document.querySelector('.go-toast-wrap');
    if (!wrap) return;
    var t = document.createElement('div');
    t.className = 'go-toast';
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(function () {
      t.classList.add('fade');
      setTimeout(function () { t.remove(); }, 350);
    }, duration || 1400);
  };

  /* ── Overlay ── */
  GO.showOverlay = function (opts) {
    // opts: { title, msg, score, best, streak, btnLabel, onBtn, win }
    var ov = document.getElementById('go-overlay');
    if (!ov) return;
    var titleEl = ov.querySelector('.go-overlay-title');
    var msgEl = ov.querySelector('.go-overlay-msg');
    var scoreEl = ov.querySelector('.go-stat-score');
    var bestEl = ov.querySelector('.go-stat-best');
    var streakEl = ov.querySelector('.go-stat-streak');
    var btn = ov.querySelector('#go-overlay-btn');

    if (titleEl) {
      titleEl.textContent = opts.title || 'Game Over';
      titleEl.style.background = opts.win
        ? 'linear-gradient(to right,#10b981,#3b82f6)'
        : 'linear-gradient(to right,#ef4444,#f59e0b)';
      titleEl.style.webkitBackgroundClip = 'text';
      titleEl.style.webkitTextFillColor = 'transparent';
    }
    if (msgEl && opts.msg) msgEl.textContent = opts.msg;
    if (scoreEl && opts.score !== undefined) scoreEl.textContent = opts.score;
    if (bestEl && opts.best !== undefined) bestEl.textContent = opts.best;
    if (streakEl && opts.streak !== undefined) streakEl.textContent = opts.streak;
    if (btn) {
      btn.textContent = opts.btnLabel || 'Play Again';
      btn.onclick = opts.onBtn || function () {};
    }
    ov.classList.remove('hidden');
  };

  GO.hideOverlay = function () {
    var ov = document.getElementById('go-overlay');
    if (ov) ov.classList.add('hidden');
  };

  /* ── Analytics ── */
  GO.track = function (gameId, event) {
    try {
      if (window.gtag) {
        window.gtag('event', event, { game_id: gameId, section: 'gameorbit' });
      }
    } catch (e) {}
  };

  /* ── Sidebar / Nav buttons ── */
  document.addEventListener('DOMContentLoaded', function () {
    var menuBtn = document.getElementById('go-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        window.location.href = '../index.html';
      });
    }
  });

})();
