// ===== JIGSAW PUZZLE ROYALE GAME LOGIC =====

// Global Game Variables
let gridSize = 3; // 3x3, 4x4, 5x5
let category = 'space'; // space, forest, neon, animals
let imgWidth = 600;
let imgHeight = 600;
let cellW = 0;
let cellH = 0;
let marginX = 0;
let marginY = 0;

let sourceCanvas = null;
let sourceImage = null; // Unsplash Image or Fallback Canvas
let pieces = [];
let activePiece = null;
let hintActive = false;
let hintTimer = null;

// Game State & Stats
let isGameActive = false;
let startTime = 0;
let elapsedTime = 0; // in seconds
let score = 0;
let placedCount = 0;
let totalPieces = 0;
let timerInterval = null;
let particleSystem = [];

// Dragging State
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Web Audio Context & Sound Engine
let audioCtx = null;

// Supabase and Local Storage config
const gamesPlayedKey = "pmg_jigsaw_games_played";

// Initialize Audio Context on user gesture
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Procedural Sound Effects Generator
function playSound(type) {
    try {
        initAudio();
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'select') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554, now + 0.06);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'snap') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'win') {
            const chord = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
            chord.forEach((freq, index) => {
                const oscNode = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                oscNode.connect(gain);
                gain.connect(audioCtx.destination);
                oscNode.type = 'triangle';
                oscNode.frequency.setValueAtTime(freq, now + index * 0.08);
                gain.gain.setValueAtTime(0.2, now + index * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.25);
                oscNode.start(now + index * 0.08);
                oscNode.stop(now + index * 0.08 + 0.25);
            });
        }
    } catch (e) {
        console.warn("Web Audio Playback blocked or failed:", e);
    }
}

// Show standard toast messages
function showToast(message) {
    const toast = document.getElementById('ms-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Particle System
function createParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particleSystem.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 3,
            radius: Math.random() * 4 + 2,
            color: color,
            alpha: 1,
            decay: Math.random() * 0.03 + 0.02
        });
    }
}

function updateAndDrawParticles(ctx) {
    for (let i = particleSystem.length - 1; i >= 0; i--) {
        const p = particleSystem[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
            particleSystem.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
    }
}

// Render procedurally generated category fallbacks on canvas
function renderProceduralCategory(categoryName, canvas, previewMode = false) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();

    if (categoryName === 'space') {
        // Deep Space nebula
        const grad = ctx.createRadialGradient(w/2, h/2, w/8, w/2, h/2, w);
        grad.addColorStop(0, '#120b38');
        grad.addColorStop(0.5, '#0a0620');
        grad.addColorStop(1, '#020108');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Draw soft gas nebulae
        ctx.globalCompositeOperation = 'screen';
        const colors = ['rgba(192, 132, 252, 0.15)', 'rgba(34, 211, 238, 0.15)', 'rgba(244, 63, 94, 0.15)'];
        for (let i = 0; i < 4; i++) {
            const cx = Math.random() * w;
            const cy = Math.random() * h;
            const r = Math.random() * (w/2) + w/4;
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0, colors[i % colors.length]);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw stars
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ffffff';
        const starCount = previewMode ? 30 : 100;
        for (let i = 0; i < starCount; i++) {
            const sx = Math.random() * w;
            const sy = Math.random() * h;
            const r = Math.random() * 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Planet
        const px = w * 0.7;
        const py = h * 0.3;
        const pr = w * 0.12;

        // Ring back
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-Math.PI / 6);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
        ctx.lineWidth = pr * 0.15;
        ctx.beginPath();
        ctx.ellipse(0, 0, pr * 2, pr * 0.35, 0, Math.PI, 0);
        ctx.stroke();
        ctx.restore();

        // Planet Body
        const pGrad = ctx.createRadialGradient(px - pr/3, py - pr/3, pr/10, px, py, pr);
        pGrad.addColorStop(0, '#c084fc');
        pGrad.addColorStop(1, '#6b21a8');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();

        // Ring front
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-Math.PI / 6);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
        ctx.lineWidth = pr * 0.15;
        ctx.beginPath();
        ctx.ellipse(0, 0, pr * 2, pr * 0.35, 0, 0, Math.PI);
        ctx.stroke();
        ctx.restore();

    } else if (categoryName === 'forest') {
        // Magic Forest
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#042f2e'); // Deep teal
        grad.addColorStop(1, '#021c1e'); // Near black
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Giant Moon
        const mx = w * 0.5;
        const my = h * 0.35;
        const mr = w * 0.16;
        const moonGrad = ctx.createRadialGradient(mx, my, mr * 0.1, mx, my, mr);
        moonGrad.addColorStop(0, '#ffffff');
        moonGrad.addColorStop(0.5, '#fef08a');
        moonGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(mx, my, mr * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Layered pine tree silhouettes
        const drawTree = (tx, ty, tSize, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(tx, ty - tSize);
            ctx.lineTo(tx - tSize * 0.45, ty + tSize * 0.3);
            ctx.lineTo(tx - tSize * 0.2, ty + tSize * 0.2);
            ctx.lineTo(tx - tSize * 0.55, ty + tSize * 0.9);
            ctx.lineTo(tx - tSize * 0.25, ty + tSize * 0.8);
            ctx.lineTo(tx - tSize * 0.7, ty + tSize * 1.5);
            ctx.lineTo(tx + tSize * 0.7, ty + tSize * 1.5);
            ctx.lineTo(tx + tSize * 0.25, ty + tSize * 0.8);
            ctx.lineTo(tx + tSize * 0.55, ty + tSize * 0.9);
            ctx.lineTo(tx + tSize * 0.2, ty + tSize * 0.2);
            ctx.lineTo(tx + tSize * 0.45, ty + tSize * 0.3);
            ctx.closePath();
            ctx.fill();
        };

        // Back layer tree line
        const treeCount = previewMode ? 4 : 8;
        for (let i = 0; i <= treeCount; i++) {
            const tx = (w / treeCount) * i + (Math.random() - 0.5) * 20;
            const ty = h * 0.5 + (Math.random() * 20);
            const ts = w * 0.12;
            drawTree(tx, ty, ts, '#0d9488');
        }

        // Front layer tree line
        const frontTreeCount = previewMode ? 3 : 6;
        for (let i = 0; i <= frontTreeCount; i++) {
            const tx = (w / frontTreeCount) * i + (Math.random() - 0.5) * 30;
            const ty = h * 0.6 + (Math.random() * 30);
            const ts = w * 0.16;
            drawTree(tx, ty, ts, '#0f766e');
        }

        // Fireflies
        const ffCount = previewMode ? 8 : 20;
        for (let i = 0; i < ffCount; i++) {
            const fx = Math.random() * w;
            const fy = h * 0.5 + Math.random() * (h * 0.45);
            const fr = Math.random() * 3 + 1;
            const ffGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr * 4);
            ffGrad.addColorStop(0, '#fef08a');
            ffGrad.addColorStop(0.3, 'rgba(254,240,138,0.7)');
            ffGrad.addColorStop(1, 'rgba(254,240,138,0)');
            ctx.fillStyle = ffGrad;
            ctx.beginPath();
            ctx.arc(fx, fy, fr * 4, 0, Math.PI * 2);
            ctx.fill();
        }

    } else if (categoryName === 'neon') {
        // Neon City
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1e1b4b'); // deep purple-blue
        grad.addColorStop(0.6, '#4c0519'); // deep magenta
        grad.addColorStop(1, '#090514');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        const horizon = h * 0.55;

        // Retro striped sun
        const sx = w * 0.5;
        const sy = horizon;
        const sr = w * 0.2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI, true); // draw top half of circle
        const sGrad = ctx.createLinearGradient(0, sy - sr, 0, sy);
        sGrad.addColorStop(0, '#f43f5e'); // rose
        sGrad.addColorStop(1, '#f59e0b'); // yellow
        ctx.fillStyle = sGrad;
        ctx.fill();

        // Draw horizontal blackout stripes in sun
        ctx.fillStyle = '#1e1b4b';
        ctx.globalCompositeOperation = 'destination-out';
        let stripeY = sy - sr + 15;
        let stripeH = 2;
        while (stripeY < sy) {
            ctx.fillRect(sx - sr, stripeY, sr * 2, stripeH);
            stripeY += 12;
            stripeH += 1.5;
        }
        ctx.restore();

        // Building Silhouettes
        ctx.fillStyle = '#090514';
        const bCount = previewMode ? 5 : 9;
        for (let i = 0; i < bCount; i++) {
            const bw = w * 0.12 + Math.random() * (w * 0.08);
            const bh = h * 0.2 + Math.random() * (h * 0.22);
            const bx = (w / bCount) * i - bw/2 + (Math.random() - 0.5) * 15;
            const by = horizon - bh;
            ctx.fillRect(bx, by, bw, bh + 10);

            // Draw quick glow window lights
            if (!previewMode) {
                ctx.fillStyle = Math.random() < 0.5 ? '#22d3ee' : '#f43f5e';
                const cols = 2;
                const rows = Math.floor(bh / 15) - 1;
                for (let r = 0; r < rows; r++) {
                    if (Math.random() < 0.3) continue;
                    for (let c = 0; c < cols; c++) {
                        ctx.fillRect(bx + 6 + c * 10, by + 10 + r * 12, 3, 5);
                    }
                }
                ctx.fillStyle = '#090514'; // Reset
            }
        }

        // Horizon light line
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, horizon);
        ctx.lineTo(w, horizon);
        ctx.stroke();

        // Neon Grid Floor
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1;
        // Perspective lines
        const lines = 12;
        for (let i = 0; i <= lines; i++) {
            ctx.beginPath();
            ctx.moveTo((w / lines) * i, horizon);
            ctx.lineTo((w / 2) + ((w / lines) * i - (w / 2)) * 3.5, h);
            ctx.stroke();
        }
        // Horizontal lines compressing towards horizon
        let gy = horizon;
        let step = 3;
        while (gy < h) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(w, gy);
            ctx.stroke();
            gy += step;
            step *= 1.35;
        }

    } else if (categoryName === 'animals') {
        // Cute Animals
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#fef08a'); // soft yellow
        grad.addColorStop(1, '#fbcfe8'); // soft pink
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        const cx = w * 0.5;
        const cy = h * 0.55;
        const r = w * 0.22;

        // Draw stylized cat face
        // 1. Ears
        ctx.fillStyle = '#4b5563'; // Gray face
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.8, cy - r * 0.3);
        ctx.lineTo(cx - r * 0.85, cy - r * 1.1);
        ctx.lineTo(cx - r * 0.2, cy - r * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + r * 0.8, cy - r * 0.3);
        ctx.lineTo(cx + r * 0.85, cy - r * 1.1);
        ctx.lineTo(cx + r * 0.2, cy - r * 0.8);
        ctx.closePath();
        ctx.fill();

        // Inner ears
        ctx.fillStyle = '#fca5a5'; // soft pink
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.75, cy - r * 0.35);
        ctx.lineTo(cx - r * 0.78, cy - r * 0.95);
        ctx.lineTo(cx - r * 0.3, cy - r * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + r * 0.75, cy - r * 0.35);
        ctx.lineTo(cx + r * 0.78, cy - r * 0.95);
        ctx.lineTo(cx + r * 0.3, cy - r * 0.7);
        ctx.closePath();
        ctx.fill();

        // 2. Head Body
        ctx.fillStyle = '#4b5563';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Snout area (white circle)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.3, r * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // 3. Eyes
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(cx - r * 0.35, cy, r * 0.1, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.35, cy, r * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - r * 0.38, cy - r * 0.03, r * 0.03, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.32, cy - r * 0.03, r * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // 4. Blush cheeks
        ctx.fillStyle = 'rgba(252, 165, 165, 0.7)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.6, cy + r * 0.25, r * 0.12, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.6, cy + r * 0.25, r * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // 5. Nose and Mouth
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        // Nose (triangle)
        ctx.moveTo(cx, cy + r * 0.12);
        ctx.lineTo(cx - r * 0.06, cy + r * 0.06);
        ctx.lineTo(cx + r * 0.06, cy + r * 0.06);
        ctx.closePath();
        ctx.fill();

        // Mouth curves
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = r * 0.04;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx - r * 0.08, cy + r * 0.18, r * 0.08, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + r * 0.08, cy + r * 0.18, r * 0.08, 0, Math.PI);
        ctx.stroke();

        // Whiskers
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        // Left
        ctx.beginPath(); ctx.moveTo(cx - r * 0.8, cy + r * 0.1); ctx.lineTo(cx - r * 1.3, cy + r * 0.05); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - r * 0.8, cy + r * 0.2); ctx.lineTo(cx - r * 1.35, cy + r * 0.2); ctx.stroke();
        // Right
        ctx.beginPath(); ctx.moveTo(cx + r * 0.8, cy + r * 0.1); ctx.lineTo(cx + r * 1.3, cy + r * 0.05); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + r * 0.8, cy + r * 0.2); ctx.lineTo(cx + r * 1.35, cy + r * 0.2); ctx.stroke();
    }

    ctx.restore();
}

// Generate the edge shape generator path
function drawEdge(ctx, x1, y1, x2, y2, type) {
    if (type === 0) {
        ctx.lineTo(x2, y2);
        return;
    }

    const tx = x2 - x1;
    const ty = y2 - y1;
    const nx = -ty; // Normal perpendicular vector
    const ny = tx;

    // Normalizing type so Tab (1) points outwards of piece, Blank (-1) points inwards
    // For Top edge, ny points down (inwards). A negative height pulls it up (outwards).
    const h = -type * 0.18;

    // Control points scaled along tangent and normal vectors
    const p = (a, b) => ({
        x: x1 + a * tx + b * nx,
        y: y1 + a * ty + b * ny
    });

    const p1 = p(0.35, 0);
    const p2 = p(0.38, h * 0.15);
    const p3 = p(0.33, h * 0.6);
    const p4 = p(0.38, h * 0.75);

    const p5 = p(0.40, h * 0.85);
    const p6 = p(0.44, h * 1.1);
    const p7 = p(0.50, h * 1.1);

    const p8 = p(0.56, h * 1.1);
    const p9 = p(0.60, h * 0.85);
    const p10 = p(0.62, h * 0.75);

    const p11 = p(0.67, h * 0.6);
    const p12 = p(0.62, h * 0.15);
    const p13 = p(0.65, 0);

    ctx.lineTo(p1.x, p1.y);
    ctx.bezierCurveTo(p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
    ctx.bezierCurveTo(p5.x, p5.y, p6.x, p6.y, p7.x, p7.y);
    ctx.bezierCurveTo(p8.x, p8.y, p9.x, p9.y, p10.x, p10.y);
    ctx.bezierCurveTo(p11.x, p11.y, p12.x, p12.y, p13.x, p13.y);
    ctx.lineTo(x2, y2);
}

// Slice image into puzzle pieces canvas structures
function createPieceCanvas(img, r, c, w, h, edge) {
    const canvas = document.createElement('canvas');
    canvas.width = w + marginX * 2;
    canvas.height = h + marginY * 2;

    const ctx = canvas.getContext('2d');

    // Clipping path with interlocking edges
    ctx.beginPath();
    ctx.moveTo(marginX, marginY);

    // Top
    drawEdge(ctx, marginX, marginY, marginX + w, marginY, edge.top);
    // Right
    drawEdge(ctx, marginX + w, marginY, marginX + w, marginY + h, edge.right);
    // Bottom
    drawEdge(ctx, marginX + w, marginY + h, marginX, marginY + h, edge.bottom);
    // Left
    drawEdge(ctx, marginX, marginY + h, marginX, marginY, edge.left);

    ctx.closePath();
    ctx.clip();

    // Source coordinates on standardized 500x500 img
    const sx = c * (imgWidth / gridSize);
    const sy = r * (imgHeight / gridSize);
    const sw = imgWidth / gridSize;
    const sh = imgHeight / gridSize;

    ctx.drawImage(img, sx, sy, sw, sh, marginX, marginY, w, h);

    // Subtle gloss highlights & borders for premium aesthetic
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    return canvas;
}

// Load Image - always uses procedural canvas art so preview matches puzzle image exactly
function loadImageAndStart(categoryName, size, callback) {
    const pmgLoader = document.getElementById('pmg-loader');
    if (pmgLoader) {
        pmgLoader.classList.remove('hidden');
        const fill = pmgLoader.querySelector('.pmg-bar-fill');
        if (fill) fill.style.width = '60%';
    }

    // Always generate the same procedural art that was shown in the preview thumbnails.
    // This ensures Deep Space / Neon City / etc. always match what you selected.
    const artCanvas = document.createElement('canvas');
    artCanvas.width = imgWidth;
    artCanvas.height = imgHeight;
    renderProceduralCategory(categoryName, artCanvas, false);

    const loaderFill = document.getElementById('pmg-loader')?.querySelector('.pmg-bar-fill');
    if (loaderFill) loaderFill.style.width = '100%';
    setTimeout(() => {
        document.getElementById('pmg-loader')?.classList.add('hidden');
        callback(artCanvas);
    }, 250);
}

// Generate Edge Grid definitions
function generateEdges(rows, cols) {
    const gridEdges = [];
    for (let r = 0; r < rows; r++) {
        gridEdges[r] = [];
        for (let c = 0; c < cols; c++) {
            gridEdges[r][c] = {
                top: r === 0 ? 0 : -gridEdges[r - 1][c].bottom,
                left: c === 0 ? 0 : -gridEdges[r][c - 1].right,
                bottom: r === rows - 1 ? 0 : (Math.random() < 0.5 ? 1 : -1),
                right: c === cols - 1 ? 0 : (Math.random() < 0.5 ? 1 : -1)
            };
        }
    }
    return gridEdges;
}

// Initialize Gameplay parameters
function initGame(img) {
    sourceImage = img;
    totalPieces = gridSize * gridSize;
    placedCount = 0;
    score = 0;
    elapsedTime = 0;
    pieces = [];
    activePiece = null;
    isDragging = false;
    particleSystem = [];

    // Scale canvas space (internal 600x600 resolution)
    cellW = 600 / gridSize;
    cellH = 600 / gridSize;
    marginX = cellW * 0.2;
    marginY = cellH * 0.2;

    const gridEdges = generateEdges(gridSize, gridSize);

    // Slice source image into piece structures
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const edge = gridEdges[r][c];
            const pCanvas = createPieceCanvas(sourceImage, r, c, cellW, cellH, edge);
            pieces.push({
                id: r * gridSize + c,
                row: r,
                col: c,
                canvas: pCanvas,
                correctX: c * cellW,
                correctY: r * cellH,
                currentX: 300 - cellW / 2, // Spawns centered initially
                currentY: 300 - cellH / 2,
                isPlaced: false
            });
        }
    }

    // Shuffle pile pieces
    const shuffledPieces = [...pieces];
    shuffledPieces.sort(() => Math.random() - 0.5);

    // Populate scrollable Tray
    const tray = document.getElementById('piece-tray');
    tray.innerHTML = '';

    shuffledPieces.forEach(piece => {
        const card = document.createElement('div');
        card.className = 'piece-card';
        card.dataset.id = piece.id;

        // Draw individual card preview canvas
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = cellW + marginX * 2;
        previewCanvas.height = cellH + marginY * 2;
        const pCtx = previewCanvas.getContext('2d');
        pCtx.drawImage(piece.canvas, 0, 0);
        card.appendChild(previewCanvas);

        card.addEventListener('click', () => {
            if (piece.isPlaced) return;
            selectPiece(piece.id);
        });

        tray.appendChild(card);
    });

    // Update Headings and UI
    document.getElementById('difficulty-badge').textContent = 
        gridSize === 3 ? "EASY" : gridSize === 4 ? "MEDIUM" : "HARD";
    document.getElementById('hud-placed').textContent = `0/${totalPieces}`;
    document.getElementById('hud-score').textContent = '0';
    document.getElementById('hud-timer').textContent = '00:00';

    // Start Clock
    clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);

    isGameActive = true;
    
    // Auto-select first piece
    const firstPieceCard = tray.firstElementChild;
    if (firstPieceCard) {
        selectPiece(parseInt(firstPieceCard.dataset.id));
    }

    drawBoard();
}

// Select active piece from tray pile
function selectPiece(id) {
    const piece = pieces.find(p => p.id === id);
    if (!piece || piece.isPlaced) return;

    activePiece = piece;
    playSound('select');

    // Visually toggle active border in tray container
    const trayCards = document.querySelectorAll('.piece-card');
    trayCards.forEach(card => {
        if (parseInt(card.dataset.id) === id) {
            card.classList.add('active');
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            card.classList.remove('active');
        }
    });

    // Reset default center coord if not moved yet
    if (activePiece.currentX === 300 - cellW/2 && activePiece.currentY === 300 - cellH/2) {
        // Place it somewhere around the center with slight offset
        activePiece.currentX = 300 - cellW / 2;
        activePiece.currentY = 300 - cellH / 2;
    }

    drawBoard();
}

// Draw game grid and pieces on Board canvas
function drawBoard() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // 1. Hint template / grid outline background
    if (hintActive && sourceImage) {
        ctx.globalAlpha = 0.22;
        ctx.drawImage(sourceImage, 0, 0, 600, 600);
        ctx.globalAlpha = 1.0;
    }

    // Grid guide lines (subtle borders)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
        // Vertical
        ctx.beginPath();
        ctx.moveTo(i * cellW, 0);
        ctx.lineTo(i * cellW, 600);
        ctx.stroke();

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(0, i * cellH);
        ctx.lineTo(600, i * cellH);
        ctx.stroke();
    }

    // 2. Draw Locked/Snapped Pieces
    pieces.forEach(p => {
        if (p.isPlaced) {
            ctx.drawImage(p.canvas, p.correctX - marginX, p.correctY - marginY);
        }
    });

    // 3. Draw Active floating Piece
    if (activePiece && !activePiece.isPlaced) {
        ctx.save();
        // Drop shadow for 3D realism
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 12;

        ctx.drawImage(activePiece.canvas, activePiece.currentX - marginX, activePiece.currentY - marginY);
        ctx.restore();

        // Glowing cyan outline around active piece bounds
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(activePiece.currentX, activePiece.currentY, cellW, cellH);
    }

    // 4. Update Particle effects
    updateAndDrawParticles(ctx);

    ctx.restore();
}

// Handle Clock HUD updates
function updateTimer() {
    if (!isGameActive) return;
    elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const min = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
    const sec = String(elapsedTime % 60).padStart(2, '0');
    document.getElementById('hud-timer').textContent = `${min}:${sec}`;
}

// Convert Client screen touch coord to canvas coordinates (600x600 space)
function getCanvasCoords(e) {
    const canvas = document.getElementById('game-canvas');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
}

// Coordinate event mappings
function handlePointerDown(e) {
    if (!isGameActive || !activePiece) return;

    const coords = getCanvasCoords(e);

    // Allow grab anywhere within bounds of activePiece
    if (coords.x >= activePiece.currentX && coords.x <= activePiece.currentX + cellW &&
        coords.y >= activePiece.currentY && coords.y <= activePiece.currentY + cellH) {
        
        initAudio();
        isDragging = true;
        dragOffset.x = coords.x - activePiece.currentX;
        dragOffset.y = coords.y - activePiece.currentY;

        // Cancel hint to focus on drag
        if (hintActive) {
            hintActive = false;
            drawBoard();
        }
    }
}

function handlePointerMove(e) {
    if (!isGameActive || !isDragging || !activePiece) return;
    
    // Prevent document scrolling during mobile touches
    if (e.cancelable) e.preventDefault();

    const coords = getCanvasCoords(e);
    activePiece.currentX = coords.x - dragOffset.x;
    activePiece.currentY = coords.y - dragOffset.y;

    // Boundaries containment
    if (activePiece.currentX < -cellW/2) activePiece.currentX = -cellW/2;
    if (activePiece.currentX > 600 - cellW/2) activePiece.currentX = 600 - cellW/2;
    if (activePiece.currentY < -cellH/2) activePiece.currentY = -cellH/2;
    if (activePiece.currentY > 600 - cellH/2) activePiece.currentY = 600 - cellH/2;

    drawBoard();
}

function handlePointerUp() {
    if (!isGameActive || !isDragging || !activePiece) return;
    isDragging = false;

    // Snapping physics validation
    const dx = activePiece.currentX - activePiece.correctX;
    const dy = activePiece.currentY - activePiece.correctY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Tolerance limit is 35px in 600x600 space
    if (distance <= 35) {
        activePiece.currentX = activePiece.correctX;
        activePiece.currentY = activePiece.correctY;
        activePiece.isPlaced = true;

        playSound('snap');

        // Glowing particle effect at target placement
        createParticles(
            activePiece.correctX + cellW / 2,
            activePiece.correctY + cellH / 2,
            category === 'space' ? '#c084fc' : category === 'forest' ? '#34d399' : category === 'neon' ? '#f43f5e' : '#fef08a'
        );

        placedCount++;
        score += 100;
        
        // Remove item from Tray Pile
        const card = document.querySelector(`.piece-card[data-id="${activePiece.id}"]`);
        if (card) {
            card.remove();
        }

        activePiece = null;

        // Update statistics
        document.getElementById('hud-placed').textContent = `${placedCount}/${totalPieces}`;
        document.getElementById('hud-score').textContent = score;

        // Validate Game Win
        if (placedCount === totalPieces) {
            handleGameWin();
        } else {
            // Auto select next available piece in tray
            const nextCard = document.getElementById('piece-tray').firstElementChild;
            if (nextCard) {
                selectPiece(parseInt(nextCard.dataset.id));
            }
        }
    } else {
        playSound('click');
    }

    drawBoard();
}

// Win celebration sequence
function handleGameWin() {
    isGameActive = false;
    clearInterval(timerInterval);
    playSound('win');

    // Add speed bonus points
    const maxBonusTime = totalPieces * 15; // 15s per piece target
    let timeBonus = 0;
    if (elapsedTime < maxBonusTime) {
        timeBonus = (maxBonusTime - elapsedTime) * 10;
        score += timeBonus;
    }

    // Set high-score statistics
    const finalMin = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
    const finalSec = String(elapsedTime % 60).padStart(2, '0');
    
    document.getElementById('lc-time').textContent = `${finalMin}:${finalSec}`;
    document.getElementById('lc-score').textContent = score;

    // Track analytics event
    if (window.trackGameEvent) {
        window.trackGameEvent("game_complete", {
            duration_seconds: elapsedTime,
            grid_size: gridSize,
            category: category,
            score: score
        });
    }

    // Increment local game counter (to trigger Smartlink Popunder)
    let totalPlays = parseInt(localStorage.getItem(gamesPlayedKey) || "0") + 1;
    localStorage.setItem(gamesPlayedKey, totalPlays);

    // Show solved layout
    setTimeout(() => {
        document.getElementById('overlay-complete').classList.remove('hidden');
        
        // Load smartlink every 3 plays
        if (totalPlays % 3 === 0 && typeof window.loadSmartlinkAd === 'function') {
            window.loadSmartlinkAd();
        }
    }, 800);
}

// Particle animation tick loop
function animationTick() {
    if (particleSystem.length > 0) {
        drawBoard();
    }
    requestAnimationFrame(animationTick);
}

// Trigger image hint display overlay
function triggerHint() {
    if (!isGameActive) return;
    initAudio();

    hintActive = true;
    playSound('click');
    drawBoard();

    // Fade out hint after 3 seconds
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
        hintActive = false;
        drawBoard();
    }, 3000);
}

// Set up options & start screens
function setupPreviews() {
    const categories = ['space', 'forest', 'neon', 'animals'];
    categories.forEach(cat => {
        const canv = document.getElementById(`canvas-preview-${cat}`);
        if (canv) {
            canv.width = 150;
            canv.height = 150;
            renderProceduralCategory(cat, canv, true);
        }
    });
}

// UI Event Handlers Setup
function setupUIListeners() {
    // Canvas Listeners
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    // Start Screen Inputs
    const menuOverlay = document.getElementById('overlay-menu');
    const startBtn = document.getElementById('start-btn');

    // Difficulty Size Selectors
    const sizeButtons = document.querySelectorAll('.size-btn');
    sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            sizeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gridSize = parseInt(btn.dataset.size);
        });
    });

    // Category Selectors
    const catCards = document.querySelectorAll('.selector-card');
    catCards.forEach(card => {
        card.addEventListener('click', () => {
            playSound('click');
            catCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            category = card.dataset.category;
        });
    });

    // Start Trigger
    startBtn.addEventListener('click', () => {
        playSound('click');
        menuOverlay.classList.add('hidden');
        loadImageAndStart(category, gridSize, (loadedImg) => {
            initGame(loadedImg);
        });
    });

    // Controls
    document.getElementById('hint-btn').addEventListener('click', triggerHint);
    
    // Pause Overlay Triggers
    const pauseBtn = document.getElementById('pause-btn');
    const pauseOverlay = document.getElementById('overlay-pause');
    
    pauseBtn.addEventListener('click', () => {
        playSound('click');
        if (isGameActive) {
            isGameActive = false;
            clearInterval(timerInterval);
            pauseOverlay.classList.remove('hidden');
        }
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
        playSound('click');
        pauseOverlay.classList.add('hidden');
        isGameActive = true;
        startTime = Date.now() - (elapsedTime * 1000);
        timerInterval = setInterval(updateTimer, 1000);
    });

    document.getElementById('pause-restart-btn').addEventListener('click', () => {
        playSound('click');
        pauseOverlay.classList.add('hidden');
        loadImageAndStart(category, gridSize, (loadedImg) => {
            initGame(loadedImg);
        });
    });

    const resetToMenu = () => {
        playSound('click');
        pauseOverlay.classList.add('hidden');
        document.getElementById('overlay-complete').classList.add('hidden');
        menuOverlay.classList.remove('hidden');
    };

    document.getElementById('pause-menu-btn').addEventListener('click', resetToMenu);
    document.getElementById('menu-btn').addEventListener('click', resetToMenu);

    document.getElementById('next-btn').addEventListener('click', () => {
        playSound('click');
        document.getElementById('overlay-complete').classList.add('hidden');
        loadImageAndStart(category, gridSize, (loadedImg) => {
            initGame(loadedImg);
        });
    });
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    setupPreviews();
    setupUIListeners();
    animationTick();
});
