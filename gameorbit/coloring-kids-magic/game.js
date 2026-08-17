/* ============================================================
   Coloring for Kids – game.js
   PlayMixGames · 2026
   ============================================================ */

'use strict';

// ── COLOUR PALETTE ─────────────────────────────────────────
const PALETTE = [
  { hex: '#FF4444', name: 'Red' },
  { hex: '#FF8C00', name: 'Orange' },
  { hex: '#FFD700', name: 'Yellow' },
  { hex: '#FF69B4', name: 'Pink' },
  { hex: '#FF1493', name: 'Hot Pink' },
  { hex: '#9B59B6', name: 'Purple' },
  { hex: '#3498DB', name: 'Blue' },
  { hex: '#00BFFF', name: 'Sky Blue' },
  { hex: '#2ECC71', name: 'Green' },
  { hex: '#27AE60', name: 'Dark Green' },
  { hex: '#1ABC9C', name: 'Teal' },
  { hex: '#E74C3C', name: 'Crimson' },
  { hex: '#F39C12', name: 'Amber' },
  { hex: '#E67E22', name: 'Pumpkin' },
  { hex: '#8E44AD', name: 'Violet' },
  { hex: '#2980B9', name: 'Ocean' },
  { hex: '#16A085', name: 'Emerald' },
  { hex: '#D35400', name: 'Burnt' },
  { hex: '#7F8C8D', name: 'Grey' },
  { hex: '#34495E', name: 'Dark' },
  { hex: '#ECF0F1', name: 'Light', white: true },
  { hex: '#FFFFFF', name: 'White', white: true },
  { hex: '#000000', name: 'Black' },
  { hex: '#8B4513', name: 'Brown' },
  { hex: '#F5CBA7', name: 'Skin' },
  { hex: '#FFDAB9', name: 'Peach' },
];

// ── PICTURE LIBRARY (picture-templates.js — 100×100, same as SimplyDraw) ──
const PICTURES = window.PMG_COLORING_PICTURES;
const VIEW_SIZE = 100;

function getViewTransform(W, H) {
  const size = Math.min(W, H) * 0.82;
  return {
    scale: size / VIEW_SIZE,
    ox: (W - size) / 2,
    oy: (H - size) / 2,
    size,
  };
}

// ── AUDIO ──────────────────────────────────────────────────
let audioCtx = null;
let soundOn = true;

function getAC() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, dur, type = 'sine', vol = 0.3) {
  if (!soundOn) return;
  try {
    const ac = getAC();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ac.currentTime + dur);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.start(); osc.stop(ac.currentTime + dur);
  } catch(e) {}
}

function playPaint() { playTone(440 + Math.random() * 300, 0.15, 'sine', 0.2); }

function playCelebrate() {
  if (!soundOn) return;
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3, 'triangle', 0.25), i * 120);
  });
}

function playClick() { playTone(600, 0.08, 'square', 0.15); }

// ── STATE ──────────────────────────────────────────────────
let currentMode    = 'color';   // color | free
let currentCat     = 'animals';
let currentPic     = null;
let currentColor   = '#FF4444';
let currentTool    = 'brush';   // brush | fill | eraser
let brushSize      = 12;
let isDrawing      = false;
let lastX = 0, lastY = 0;

// Free draw tool
let freeColor   = '#FF4444';
let freeTool    = 'brush';
let freeBrSize  = 14;
let freeIsDrawing = false;
let freeLastX = 0, freeLastY = 0;
let freeHistory = [];

// Coloring history (for undo)
let colorHistory = [];

// ── DOM REFS ────────────────────────────────────────────────
const screenHome   = document.getElementById('screen-home');
const screenCanvas = document.getElementById('screen-canvas');
const screenFree   = document.getElementById('screen-free');

const pictureGrid  = document.getElementById('picture-grid');
const canvasTitle  = document.getElementById('canvas-title');
const freeTitle    = document.getElementById('free-title');

const bgCanvas     = document.getElementById('bg-canvas');
const colorCanvas  = document.getElementById('color-canvas');
const bgCtx        = bgCanvas.getContext('2d');
const colorCtx     = colorCanvas.getContext('2d');

const freeCanvasEl = document.getElementById('free-canvas');
const freeCtx      = freeCanvasEl.getContext('2d');

const colorSwatches  = document.getElementById('color-swatches');
const freeSwatches   = document.getElementById('free-color-swatches');
const successOverlay = document.getElementById('success-overlay');
const confettiCont   = document.getElementById('confetti-container');
const headerMode     = document.getElementById('header-mode');

function updateHeaderMode() {
  if (headerMode) headerMode.textContent = modeLabel(currentMode);
}

function updateModeUI() {
  const isFree = currentMode === 'free';
  const catRow = document.querySelector('.category-row');
  if (catRow) catRow.style.display = isFree ? 'none' : 'flex';
  if (pictureGrid) pictureGrid.style.display = isFree ? 'none' : 'grid';
}

// ── SHOW SCREEN ─────────────────────────────────────────────
function showScreen(id) {
  [screenHome, screenCanvas, screenFree].forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  requestAnimationFrame(() => {
    if (id === 'screen-canvas') resizeColorCanvas();
    if (id === 'screen-free') resizeFreeCanvas();
  });
}

// ── BUILD PALETTE ────────────────────────────────────────────
function buildPalette(container, onSelect) {
  container.innerHTML = '';
  PALETTE.forEach((c, i) => {
    const s = document.createElement('button');
    s.className = 'swatch' + (c.white ? ' white-swatch' : '');
    s.style.background = c.hex;
    s.title = c.name;
    s.dataset.hex = c.hex;
    if (i === 0) s.classList.add('active');
    s.addEventListener('click', () => {
      container.querySelectorAll('.swatch').forEach(sw => sw.classList.remove('active'));
      s.classList.add('active');
      onSelect(c.hex);
      playClick();
    });
    container.appendChild(s);
  });
}

// ── THUMBNAIL (SimplyDraw-style line preview) ────────────────
function drawPicThumbnail(pic, canvas) {
  const S = 88;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, S, S);
  const scale = (S * 0.88) / VIEW_SIZE;
  const ox = (S - VIEW_SIZE * scale) / 2;
  const oy = (S - VIEW_SIZE * scale) / 2;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2.8 / scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  pic.paths.forEach(p => {
    if (p.isStroke) return;
    try { ctx.stroke(new Path2D(p.d)); } catch (e) {}
  });
  pic.paths.filter(p => p.isStroke).forEach(p => {
    ctx.lineWidth = (p.sw || 2) / scale;
    try { ctx.stroke(new Path2D(p.d)); } catch (e) {}
  });
  ctx.restore();
}

// ── BUILD PICTURE GRID ───────────────────────────────────────
function buildGrid(cat) {
  pictureGrid.innerHTML = '';
  const pics = PICTURES[cat] || [];
  pics.forEach(pic => {
    const card = document.createElement('div');
    card.className = 'pic-card';
    const thumb = document.createElement('canvas');
    thumb.className = 'pic-thumb';
    thumb.setAttribute('aria-hidden', 'true');
    drawPicThumbnail(pic, thumb);
    const name = document.createElement('div');
    name.className = 'pic-name';
    name.textContent = pic.name;
    card.appendChild(thumb);
    card.appendChild(name);
    card.addEventListener('click', () => {
      playClick();
      openPicture(pic);
    });
    pictureGrid.appendChild(card);
  });
}

// ── OPEN PICTURE FOR COLORING ────────────────────────────────
function openPicture(pic) {
  currentPic = pic;
  canvasTitle.textContent = pic.name;
  colorHistory = [];

  if (currentMode === 'free') {
    startFreeDraw();
  } else {
    showScreen('screen-canvas');
    resizeColorCanvas();
    renderPicture(pic);
  }
}

function modeLabel(m) {
  return { free: 'Free Draw', color: 'Color' }[m] || m;
}

function startFreeDraw() {
  currentPic = null;
  freeTitle.textContent = 'Free Draw';
  showScreen('screen-free');
  resizeFreeCanvas();
  freeHistory = [];
}

// ── RENDER PICTURE ON BG CANVAS ─────────────────────────────
function renderPicture(pic) {
  const W = bgCanvas.width, H = bgCanvas.height;
  bgCtx.clearRect(0, 0, W, H);
  colorCtx.clearRect(0, 0, W, H);

  // White background
  bgCtx.fillStyle = '#FFFFFF';
  bgCtx.fillRect(0, 0, W, H);

  const { scale, ox, oy } = getViewTransform(W, H);

  // Fills first, then line details (SimplyDraw-style layered shapes)
  const fills = pic.paths.filter(p => !p.isStroke);
  const strokes = pic.paths.filter(p => p.isStroke);

  fills.forEach(path => {
    bgCtx.save();
    bgCtx.translate(ox, oy);
    bgCtx.scale(scale, scale);
    bgCtx.fillStyle = '#FFFFFF';
    try { bgCtx.fill(new Path2D(path.d)); } catch (e) {}
    bgCtx.restore();
  });

  strokes.forEach(path => {
    bgCtx.save();
    bgCtx.translate(ox, oy);
    bgCtx.scale(scale, scale);
    bgCtx.strokeStyle = '#000000';
    bgCtx.lineWidth   = path.sw || 2.5;
    bgCtx.lineCap     = 'round';
    bgCtx.lineJoin    = 'round';
    try { bgCtx.stroke(new Path2D(path.d)); } catch (e) {}
    bgCtx.restore();
  });

  drawOutlines(pic, bgCtx, scale, ox, oy);
}

function drawOutlines(pic, ctx, scale, ox, oy) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth   = 3.8 / scale;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.setLineDash([]);
  pic.paths.forEach(path => {
    if (path.isStroke) return;
    try { ctx.stroke(new Path2D(path.d)); } catch(e) {}
  });
  ctx.restore();
}

// ── FLOOD FILL ────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, 255];
}

function colorsMatch(a, b, tol = 32) {
  return Math.abs(a[0]-b[0]) <= tol && Math.abs(a[1]-b[1]) <= tol && Math.abs(a[2]-b[2]) <= tol;
}

function floodFill(x, y, fillColor) {
  // Merge bg + color canvases into an offscreen canvas for sampling
  const W = bgCanvas.width, H = bgCanvas.height;
  const offscreen = document.createElement('canvas');
  offscreen.width = W; offscreen.height = H;
  const offCtx = offscreen.getContext('2d');
  offCtx.drawImage(bgCanvas, 0, 0);
  offCtx.drawImage(colorCanvas, 0, 0);

  const imageData = offCtx.getImageData(0, 0, W, H);
  const data = imageData.data;

  const px = Math.floor(x), py = Math.floor(y);
  if (px < 0 || py < 0 || px >= W || py >= H) return;

  const idx0 = (py * W + px) * 4;
  const targetColor = [data[idx0], data[idx0+1], data[idx0+2], data[idx0+3]];
  const fillRgb = hexToRgb(fillColor);

  if (colorsMatch(targetColor, fillRgb, 5)) return; // already that color

  // BFS flood fill on the merged image, write to colorCtx
  const colorData = colorCtx.getImageData(0, 0, W, H);
  const cd = colorData.data;

  const stack = [px + py * W];
  const visited = new Uint8Array(W * H);
  visited[px + py * W] = 1;

  while (stack.length) {
    const pos = stack.pop();
    const cx = pos % W, cy = Math.floor(pos / W);
    const i = pos * 4;

    // Check in merged image
    const mc = [data[i], data[i+1], data[i+2], data[i+3]];
    if (!colorsMatch(mc, targetColor, 28)) continue;

    // Paint on colorCtx data
    cd[i]   = fillRgb[0];
    cd[i+1] = fillRgb[1];
    cd[i+2] = fillRgb[2];
    cd[i+3] = 255;

    // Also update merged so neighboring checks work
    data[i]   = fillRgb[0];
    data[i+1] = fillRgb[1];
    data[i+2] = fillRgb[2];
    data[i+3] = 255;

    const neighbours = [pos-1, pos+1, pos-W, pos+W];
    for (const n of neighbours) {
      if (n >= 0 && n < W*H && !visited[n]) {
        const nx = n % W, ny = Math.floor(n / W);
        if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
          visited[n] = 1;
          stack.push(n);
        }
      }
    }
  }
  colorCtx.putImageData(colorData, 0, 0);
  // Redraw outlines on top of color layer
  if (currentPic) {
    const t = getViewTransform(bgCanvas.width, bgCanvas.height);
    drawOutlines(currentPic, colorCtx, t.scale, t.ox, t.oy);
  }
}

// ── CANVAS RESIZE ────────────────────────────────────────────
function resizeColorCanvas() {
  const wrap = document.getElementById('canvas-wrap');
  const W = wrap.clientWidth;
  const H = wrap.clientHeight;
  bgCanvas.width    = W; bgCanvas.height    = H;
  colorCanvas.width = W; colorCanvas.height = H;
  if (currentPic) renderPicture(currentPic);
}

function resizeFreeCanvas() {
  const wrap = document.getElementById('free-canvas-wrap');
  freeCanvasEl.width  = wrap.clientWidth;
  freeCanvasEl.height = wrap.clientHeight;
  // White bg
  freeCtx.fillStyle = '#fff';
  freeCtx.fillRect(0, 0, freeCanvasEl.width, freeCanvasEl.height);
}

// ── DRAWING ON colorCanvas ───────────────────────────────────
function getCanvasPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  return {
    x: (touch.clientX - rect.left) * (canvas.width / rect.width),
    y: (touch.clientY - rect.top)  * (canvas.height / rect.height),
  };
}

function saveColorSnap() {
  const snap = colorCtx.getImageData(0, 0, colorCanvas.width, colorCanvas.height);
  colorHistory.push(snap);
  if (colorHistory.length > 20) colorHistory.shift();
}

function onColorDown(e) {
  e.preventDefault();
  if (!currentPic) return;
  const { x, y } = getCanvasPos(e, colorCanvas);
  if (currentTool === 'fill') {
    saveColorSnap();
    floodFill(x, y, currentColor);
    playPaint();
    return;
  }
  isDrawing = true;
  lastX = x; lastY = y;
  saveColorSnap();
}

function onColorMove(e) {
  e.preventDefault();
  if (!isDrawing) return;
  const { x, y } = getCanvasPos(e, colorCanvas);
  colorCtx.beginPath();
  colorCtx.moveTo(lastX, lastY);
  colorCtx.lineTo(x, y);
  if (currentTool === 'eraser') {
    colorCtx.globalCompositeOperation = 'destination-out';
    colorCtx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    colorCtx.globalCompositeOperation = 'source-over';
    colorCtx.strokeStyle = currentColor;
  }
  colorCtx.lineWidth = brushSize;
  colorCtx.lineCap   = 'round';
  colorCtx.lineJoin  = 'round';
  colorCtx.stroke();
  colorCtx.globalCompositeOperation = 'source-over';
  lastX = x; lastY = y;
}

function onColorUp(e) {
  if (isDrawing) playPaint();
  isDrawing = false;
  // Redraw outlines on color layer
  if (currentPic) {
    const t = getViewTransform(bgCanvas.width, bgCanvas.height);
    drawOutlines(currentPic, colorCtx, t.scale, t.ox, t.oy);
  }
}

// ── FREE DRAW ENGINE ─────────────────────────────────────────
function saveFreeSnap() {
  const snap = freeCtx.getImageData(0, 0, freeCanvasEl.width, freeCanvasEl.height);
  freeHistory.push(snap);
  if (freeHistory.length > 25) freeHistory.shift();
}

function onFreeDown(e) {
  e.preventDefault();
  const { x, y } = getCanvasPos(e, freeCanvasEl);
  freeIsDrawing = true;
  freeLastX = x; freeLastY = y;
  saveFreeSnap();
}

function onFreeMove(e) {
  e.preventDefault();
  if (!freeIsDrawing) return;
  const { x, y } = getCanvasPos(e, freeCanvasEl);

  freeCtx.beginPath();
  freeCtx.moveTo(freeLastX, freeLastY);
  freeCtx.lineTo(x, y);
  if (freeTool === 'eraser') {
    freeCtx.globalCompositeOperation = 'destination-out';
    freeCtx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    freeCtx.globalCompositeOperation = 'source-over';
    freeCtx.strokeStyle = freeColor;
  }
  freeCtx.lineWidth = freeBrSize;
  freeCtx.lineCap  = 'round';
  freeCtx.lineJoin = 'round';
  freeCtx.stroke();
  freeCtx.globalCompositeOperation = 'source-over';

  freeLastX = x; freeLastY = y;
  playPaint();
}

function onFreeUp() {
  freeIsDrawing = false;
}

// ── CONFETTI ─────────────────────────────────────────────────
const CONFETTI_COLORS = ['#FF4444','#FFD700','#FF69B4','#4CAF50','#00BCD4','#9C27B0','#FF9800','#2196F3'];

function launchConfetti() {
  confettiCont.innerHTML = '';
  for (let i = 0; i < 55; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left        = (Math.random() * 100) + '%';
    piece.style.background  = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.width       = (Math.random() * 10 + 6) + 'px';
    piece.style.height      = (Math.random() * 10 + 6) + 'px';
    piece.style.borderRadius= Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration  = (Math.random() * 2 + 1.5) + 's';
    piece.style.animationDelay     = (Math.random() * 0.6) + 's';
    confettiCont.appendChild(piece);
  }
  setTimeout(() => { confettiCont.innerHTML = ''; }, 3500);
}

// ── SUCCESS SCREEN ────────────────────────────────────────────
const EMOJIS  = ['🌟','🎉','🏆','🎨','🦋','🌈','🎊','🥳','💖','🌸'];
const MSGS    = [
  'You colored it beautifully!',
  'What a masterpiece! 🖼️',
  'Wow, amazing colors!',
  'You\'re a true artist! 🎨',
  'Fantastic job! Keep it up!',
  'So pretty! Great work!',
];

function showSuccess() {
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const msg   = MSGS[Math.floor(Math.random() * MSGS.length)];
  document.getElementById('success-emoji').textContent = emoji;
  document.getElementById('success-msg').textContent   = msg;
  successOverlay.classList.remove('hidden');
  launchConfetti();
  playCelebrate();
}

// ── UNDO ──────────────────────────────────────────────────────
document.getElementById('btn-undo').addEventListener('click', () => {
  if (colorHistory.length) {
    colorCtx.putImageData(colorHistory.pop(), 0, 0);
    playClick();
  }
});

document.getElementById('btn-free-undo').addEventListener('click', () => {
  if (freeHistory.length) {
    freeCtx.putImageData(freeHistory.pop(), 0, 0);
    playClick();
  }
});

document.getElementById('btn-clear').addEventListener('click', () => {
  saveColorSnap();
  colorCtx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
  playClick();
});

document.getElementById('btn-free-clear').addEventListener('click', () => {
  saveFreeSnap();
  freeCtx.fillStyle = '#fff';
  freeCtx.fillRect(0, 0, freeCanvasEl.width, freeCanvasEl.height);
  playClick();
});

// ── DONE BUTTONS ──────────────────────────────────────────────
document.getElementById('btn-done').addEventListener('click', showSuccess);
document.getElementById('btn-free-done').addEventListener('click', showSuccess);

// ── SUCCESS OVERLAY BUTTONS ───────────────────────────────────
document.getElementById('btn-next-pic').addEventListener('click', () => {
  successOverlay.classList.add('hidden');
  if (!currentPic || currentMode === 'free') {
    startFreeDraw();
  } else {
    const pics = PICTURES[currentCat] || [];
    const idx  = pics.findIndex(p => p.id === currentPic.id);
    const next = pics[(idx + 1) % pics.length];
    openPicture(next);
  }
  playClick();
});

document.getElementById('btn-color-again').addEventListener('click', () => {
  successOverlay.classList.add('hidden');
  if (currentMode === 'free') {
    startFreeDraw();
  } else if (currentPic) {
    openPicture(currentPic);
  }
  playClick();
});

// ── BACK BUTTONS ──────────────────────────────────────────────
document.getElementById('btn-back-home').addEventListener('click', () => {
  successOverlay.classList.add('hidden');
  showScreen('screen-home');
  playClick();
});

document.getElementById('btn-free-back').addEventListener('click', () => {
  successOverlay.classList.add('hidden');
  showScreen('screen-home');
  playClick();
});

// ── SOUND BUTTONS ─────────────────────────────────────────────
function toggleSound(btn) {
  soundOn = !soundOn;
  btn.textContent = soundOn ? '🔊' : '🔇';
}
document.getElementById('btn-sound-home').addEventListener('click', (e) => toggleSound(e.currentTarget));
document.getElementById('btn-sound-canvas').addEventListener('click', (e) => toggleSound(e.currentTarget));

// ── MODE PILLS ────────────────────────────────────────────────
document.querySelectorAll('.mode-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    playClick();
    updateHeaderMode();
    updateModeUI();
    if (currentMode === 'free') {
      startFreeDraw();
    } else {
      successOverlay.classList.add('hidden');
      showScreen('screen-home');
      buildGrid(currentCat);
    }
  });
});

// ── CATEGORY CHIPS ────────────────────────────────────────────
document.querySelectorAll('.cat-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCat = btn.dataset.cat;
    buildGrid(currentCat);
    playClick();
  });
});

// ── TOOL BUTTONS ──────────────────────────────────────────────
document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.dataset.tool;
    colorCanvas.style.cursor = currentTool === 'fill' ? 'cell' : 'crosshair';
    playClick();
  });
});

document.querySelectorAll('.tool-btn[data-ftool]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn[data-ftool]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    freeTool = btn.dataset.ftool;
    playClick();
  });
});

// ── BRUSH SIZE ────────────────────────────────────────────────
document.getElementById('brush-size').addEventListener('input', (e) => {
  brushSize = parseInt(e.target.value);
});
document.getElementById('free-brush-size').addEventListener('input', (e) => {
  freeBrSize = parseInt(e.target.value);
});

// ── COLOR CANVAS EVENTS ───────────────────────────────────────
colorCanvas.addEventListener('mousedown',  onColorDown);
colorCanvas.addEventListener('mousemove',  onColorMove);
colorCanvas.addEventListener('mouseup',    onColorUp);
colorCanvas.addEventListener('mouseleave', onColorUp);
colorCanvas.addEventListener('touchstart', onColorDown, { passive: false });
colorCanvas.addEventListener('touchmove',  onColorMove, { passive: false });
colorCanvas.addEventListener('touchend',   onColorUp);

// ── FREE CANVAS EVENTS ────────────────────────────────────────
freeCanvasEl.addEventListener('mousedown',  onFreeDown);
freeCanvasEl.addEventListener('mousemove',  onFreeMove);
freeCanvasEl.addEventListener('mouseup',    onFreeUp);
freeCanvasEl.addEventListener('mouseleave', onFreeUp);
freeCanvasEl.addEventListener('touchstart', onFreeDown, { passive: false });
freeCanvasEl.addEventListener('touchmove',  onFreeMove, { passive: false });
freeCanvasEl.addEventListener('touchend',   onFreeUp);

// ── RESIZE ────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  if (screenCanvas.classList.contains('active')) resizeColorCanvas();
  if (screenFree.classList.contains('active'))   resizeFreeCanvas();
});

// ── INIT ──────────────────────────────────────────────────────
buildPalette(colorSwatches, hex => { currentColor = hex; });
buildPalette(freeSwatches,  hex => { freeColor    = hex; });
buildGrid('animals');
updateHeaderMode();
updateModeUI();
