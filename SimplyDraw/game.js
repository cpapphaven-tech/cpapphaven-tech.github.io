const drawingData = {
    basics: [
        { id: 'circle', name: 'Circle', icon: '⭕', paths: ['M 50,10 A 40,40 0 1,1 49.9,10'] },
        { id: 'square', name: 'Square', icon: '🟦', paths: ['M 10,10 L 90,10 L 90,90 L 10,90 Z'] },
        { id: 'triangle', name: 'Triangle', icon: '🔺', paths: ['M 50,10 L 90,90 L 10,90 Z'] },
        { id: 'star', name: 'Star', icon: '⭐', paths: ['M 50,10 L 61,39 L 92,39 L 67,58 L 76,88 L 50,70 L 24,88 L 33,58 L 8,39 L 39,39 Z'] },
        { id: 'hexagon', name: 'Hexagon', icon: '⬡', paths: ['M 50,10 L 85,30 L 85,70 L 50,90 L 15,70 L 15,30 Z'] },
        { id: 'pentagon', name: 'Pentagon', icon: '⬠', paths: ['M 50,10 L 90,40 L 75,90 L 25,90 L 10,40 Z'] },
        { id: 'diamond', name: 'Diamond', icon: '♦️', paths: ['M 50,10 L 90,50 L 50,90 L 10,50 Z'] },
        { id: 'oval', name: 'Oval', icon: '0️⃣', paths: ['M 50,20 A 30,40 0 1,1 49.9,20'] },
        { id: 'rectangle', name: 'Rectangle', icon: '▬', paths: ['M 20,30 L 80,30 L 80,70 L 20,70 Z'] },
        { id: 'heart', name: 'Heart', icon: '❤️', paths: ['M 50,30 C 50,30 20,-10 10,20 C 0,50 50,90 50,90 C 50,90 100,50 90,20 C 80,-10 50,30 50,30 Z'] },
        { id: 'cross', name: 'Cross', icon: '➕', paths: ['M 40,10 L 60,10 L 60,40 L 90,40 L 90,60 L 60,60 L 60,90 L 40,90 L 40,60 L 10,60 L 10,40 L 40,40 Z'] },
        { id: 'moon', name: 'Moon', icon: '🌙', paths: ['M 50,10 A 40,40 0 1,0 90,50 A 30,30 0 1,1 50,10 Z'] },
        { id: 'arrow', name: 'Arrow', icon: '➡️', paths: ['M 30,40 L 60,40 L 60,20 L 90,50 L 60,80 L 60,60 L 30,60 Z'] }
    ],
    objects: [
        { id: 'cup', name: 'Coffee Cup', icon: '☕', paths: ['M 20,30 L 70,30 C 70,30 70,70 45,70 C 20,70 20,30 20,30 Z', 'M 70,35 C 90,35 90,60 70,60'] },
        { id: 'house', name: 'House', icon: '🏠', paths: ['M 10,50 L 50,10 L 90,50', 'M 20,50 L 20,90 L 80,90 L 80,50', 'M 40,90 L 40,60 L 60,60 L 60,90'] },
        { id: 'car', name: 'Car', icon: '🚗', paths: ['M 20,60 L 80,60 C 90,60 90,80 80,80 L 20,80 C 10,80 10,60 20,60 Z', 'M 30,60 L 40,30 L 60,30 L 70,60', 'M 25,80 A 10,10 0 1,1 25.1,80', 'M 75,80 A 10,10 0 1,1 75.1,80'] },
        { id: 'chair', name: 'Chair', icon: '🪑', paths: ['M 30,20 L 30,90', 'M 70,50 L 70,90', 'M 30,50 L 70,50'] },
        { id: 'table', name: 'Table', icon: '🪚', paths: ['M 20,40 L 80,40 L 80,50 L 20,50 Z', 'M 30,50 L 30,90', 'M 70,50 L 70,90'] },
        { id: 'book', name: 'Book', icon: '📖', paths: ['M 20,20 L 80,20 C 80,20 80,80 80,80 C 50,90 20,80 20,80 Z', 'M 50,20 L 50,85'] },
        { id: 'lamp', name: 'Lamp', icon: '💡', paths: ['M 30,50 C 30,20 70,20 70,50 Z', 'M 50,50 L 50,80', 'M 30,80 L 70,80 L 70,90 L 30,90 Z'] },
        { id: 'phone', name: 'Phone', icon: '📱', paths: ['M 30,20 C 30,10 70,10 70,20 L 70,80 C 70,90 30,90 30,80 Z', 'M 35,30 L 65,30 L 65,70 L 35,70 Z', 'M 50,75 A 5,5 0 1,1 50.1,75'] },
        { id: 'clock', name: 'Clock', icon: '⌚', paths: ['M 50,10 A 40,40 0 1,1 49.9,10', 'M 50,50 L 50,25', 'M 50,50 L 65,50'] },
        { id: 'key', name: 'Key', icon: '🔑', paths: ['M 30,50 A 15,15 0 1,1 29.9,50', 'M 45,50 L 90,50', 'M 75,50 L 75,65', 'M 85,50 L 85,65'] },
        { id: 'glasses', name: 'Glasses', icon: '👓', paths: ['M 20,40 C 10,40 10,60 20,60 C 40,60 40,40 20,40 Z', 'M 80,40 C 60,40 60,60 80,60 C 90,60 90,40 80,40 Z', 'M 40,50 C 40,40 60,40 60,50'] },
        { id: 'pencil', name: 'Pencil', icon: '✏️', paths: ['M 20,80 L 80,20 L 90,30 L 30,90 Z', 'M 20,80 L 10,90 L 30,90 Z', 'M 80,20 L 85,15 C 90,10 95,15 90,20 L 90,30'] },
        { id: 'scissors', name: 'Scissors', icon: '✂️', paths: ['M 30,30 C 20,20 20,40 30,40 C 40,40 40,30 30,30 Z', 'M 30,70 C 20,60 20,80 30,80 C 40,80 40,70 30,70 Z', 'M 38,38 L 80,80', 'M 38,72 L 80,20'] },
        { id: 'umbrella', name: 'Umbrella', icon: '☂️', paths: ['M 20,50 C 20,10 80,10 80,50 Z', 'M 50,50 L 50,80 C 50,90 40,90 40,80'] },
        { id: 'ball', name: 'Ball', icon: '⚽', paths: ['M 50,10 A 40,40 0 1,1 49.9,10', 'M 20,30 C 40,50 60,50 80,30', 'M 20,70 C 40,50 60,50 80,70', 'M 30,20 C 50,40 50,60 30,80', 'M 70,20 C 50,40 50,60 70,80'] }
    ],
    animals: [
        { id: 'catface', name: 'Cat Face', icon: '🐱', paths: ['M 20,40 L 30,10 L 45,30 C 60,25 75,30 90,10 L 80,40 C 95,60 85,90 50,90 C 15,90 5,60 20,40 Z', 'M 35,50 A 5,5 0 1,1 34.9,50', 'M 65,50 A 5,5 0 1,1 64.9,50', 'M 50,65 L 45,75 L 55,75 Z'] },
        { id: 'fish', name: 'Fish', icon: '🐟', paths: ['M 20,50 C 30,10 70,10 80,50 C 70,90 30,90 20,50 Z', 'M 80,50 L 95,30 L 95,70 Z', 'M 40,45 A 5,5 0 1,1 39.9,45'] },
        { id: 'dogface', name: 'Dog Face', icon: '🐶', paths: ['M 30,50 C 30,20 70,20 70,50 C 70,80 30,80 30,50 Z', 'M 25,35 C 10,40 10,70 30,65', 'M 75,35 C 90,40 90,70 70,65', 'M 40,45 A 4,4 0 1,1 39.9,45', 'M 60,45 A 4,4 0 1,1 59.9,45', 'M 50,60 L 45,65 L 55,65 Z'] },
        { id: 'bird', name: 'Bird', icon: '🐦', paths: ['M 30,50 C 40,20 70,30 70,50 C 70,70 40,80 30,50 Z', 'M 70,45 L 85,50 L 70,55', 'M 35,50 C 20,40 10,60 30,60', 'M 50,40 A 3,3 0 1,1 49.9,40'] },
        { id: 'mouse', name: 'Mouse', icon: '🐭', paths: ['M 40,50 C 40,30 80,30 80,50 C 80,70 40,70 40,50 Z', 'M 80,50 L 95,50', 'M 50,40 A 10,10 0 1,1 49.9,40', 'M 70,40 A 10,10 0 1,1 69.9,40', 'M 45,50 A 3,3 0 1,1 44.9,50'] },
        { id: 'elephant', name: 'Elephant', icon: '🐘', paths: ['M 40,40 C 40,20 80,20 80,40 C 80,60 40,60 40,40 Z', 'M 40,50 C 30,70 30,90 40,90 C 50,90 45,70 45,50', 'M 60,40 A 15,15 0 1,1 59.9,40', 'M 50,45 A 3,3 0 1,1 49.9,45'] },
        { id: 'lion', name: 'Lion', icon: '🦁', paths: ['M 50,50 A 25,25 0 1,1 49.9,50', 'M 50,50 A 40,40 0 1,1 49.9,50', 'M 40,45 A 4,4 0 1,1 39.9,45', 'M 60,45 A 4,4 0 1,1 59.9,45', 'M 50,55 L 45,60 L 55,60 Z'] },
        { id: 'snake', name: 'Snake', icon: '🐍', paths: ['M 20,80 C 40,90 40,70 60,70 C 80,70 80,50 60,50 C 40,50 40,30 60,30 C 80,30 80,10 60,10', 'M 60,10 C 55,10 50,15 50,20 C 50,25 55,30 60,30', 'M 55,20 L 50,20'] },
        { id: 'frog', name: 'Frog', icon: '🐸', paths: ['M 50,50 A 30,20 0 1,1 49.9,50', 'M 30,30 A 10,10 0 1,1 29.9,30', 'M 70,30 A 10,10 0 1,1 69.9,30', 'M 35,55 C 45,65 55,65 65,55'] },
        { id: 'turtle', name: 'Turtle', icon: '🐢', paths: ['M 50,50 A 30,20 0 1,1 49.9,50', 'M 80,50 A 10,10 0 1,1 79.9,50', 'M 30,70 L 20,80 L 35,80 Z', 'M 70,70 L 80,80 L 65,80 Z'] },
        { id: 'bear', name: 'Bear', icon: '🐻', paths: ['M 50,50 A 30,30 0 1,1 49.9,50', 'M 25,25 A 15,15 0 1,1 24.9,25', 'M 75,25 A 15,15 0 1,1 74.9,25', 'M 40,45 A 4,4 0 1,1 39.9,45', 'M 60,45 A 4,4 0 1,1 59.9,45', 'M 50,60 A 10,5 0 1,1 49.9,60'] },
        { id: 'rabbit', name: 'Rabbit', icon: '🐰', paths: ['M 50,60 A 25,25 0 1,1 49.9,60', 'M 40,35 C 30,10 40,0 50,35', 'M 60,35 C 70,10 60,0 50,35', 'M 40,55 A 3,3 0 1,1 39.9,55', 'M 60,55 A 3,3 0 1,1 59.9,55'] },
        { id: 'pig', name: 'Pig', icon: '🐷', paths: ['M 50,50 A 30,30 0 1,1 49.9,50', 'M 25,25 L 40,30 L 30,40 Z', 'M 75,25 L 60,30 L 70,40 Z', 'M 50,60 A 10,10 0 1,1 49.9,60', 'M 45,60 A 2,2 0 1,1 44.9,60', 'M 55,60 A 2,2 0 1,1 54.9,60'] },
        { id: 'cow', name: 'Cow', icon: '🐮', paths: ['M 50,50 A 30,30 0 1,1 49.9,50', 'M 20,30 L 35,40 L 25,50 Z', 'M 80,30 L 65,40 L 75,50 Z', 'M 30,20 L 40,30 L 35,40 Z', 'M 70,20 L 60,30 L 65,40 Z', 'M 50,70 A 15,10 0 1,1 49.9,70'] },
        { id: 'monkey', name: 'Monkey', icon: '🐒', paths: ['M 50,50 A 30,30 0 1,1 49.9,50', 'M 50,55 A 25,20 0 1,1 49.9,55', 'M 20,50 A 10,15 0 1,1 19.9,50', 'M 80,50 A 10,15 0 1,1 79.9,50', 'M 40,45 A 4,4 0 1,1 39.9,45', 'M 60,45 A 4,4 0 1,1 59.9,45'] }
    ],
    nature: [
        { id: 'tree', name: 'Tree', icon: '🌳', paths: ['M 45,90 L 45,60 C 20,60 20,20 50,20 C 80,20 80,60 55,60 L 55,90 Z'] },
        { id: 'flower', name: 'Flower', icon: '🌸', paths: ['M 50,50 A 10,10 0 1,1 49.9,50', 'M 50,40 C 30,20 70,20 50,40', 'M 50,60 C 30,80 70,80 50,60', 'M 40,50 C 20,30 20,70 40,50', 'M 60,50 C 80,30 80,70 60,50', 'M 50,60 L 50,90'] },
        { id: 'sun', name: 'Sun', icon: '☀️', paths: ['M 50,50 A 20,20 0 1,1 49.9,50', 'M 50,20 L 50,10', 'M 50,80 L 50,90', 'M 20,50 L 10,50', 'M 80,50 L 90,50', 'M 30,30 L 20,20', 'M 70,70 L 80,80', 'M 70,30 L 80,20', 'M 30,70 L 20,80'] },
        { id: 'cloud', name: 'Cloud', icon: '☁️', paths: ['M 30,60 C 20,60 20,40 35,40 C 40,20 60,20 65,40 C 80,40 80,60 70,60 Z'] },
        { id: 'mountain', name: 'Mountain', icon: '⛰️', paths: ['M 10,80 L 40,20 L 70,80 Z', 'M 40,80 L 70,30 L 90,80 Z', 'M 40,20 L 35,35 L 45,35 Z'] },
        { id: 'river', name: 'River', icon: '🏞️', paths: ['M 20,80 C 40,60 60,80 80,50', 'M 20,90 C 40,70 60,90 80,60'] },
        { id: 'leaf', name: 'Leaf', icon: '🍃', paths: ['M 50,90 C 10,70 10,30 50,10 C 90,30 90,70 50,90 Z', 'M 50,90 L 50,10', 'M 50,70 L 40,60', 'M 50,50 L 60,40'] },
        { id: 'starfish', name: 'Starfish', icon: '⭐', paths: ['M 50,20 C 55,40 60,40 80,50 C 60,60 55,60 60,80 C 50,70 50,70 40,80 C 45,60 40,60 20,50 C 40,40 45,40 50,20 Z'] },
        { id: 'shell', name: 'Shell', icon: '🐚', paths: ['M 50,80 C 20,80 20,30 50,30 C 80,30 80,80 50,80 Z', 'M 50,80 L 50,30', 'M 40,80 L 40,35', 'M 60,80 L 60,35'] },
        { id: 'mushroom', name: 'Mushroom', icon: '🍄', paths: ['M 20,60 C 20,20 80,20 80,60 Z', 'M 40,60 L 40,90 L 60,90 L 60,60', 'M 40,40 A 5,5 0 1,1 39.9,40', 'M 60,50 A 5,5 0 1,1 59.9,50'] },
        { id: 'cactus', name: 'Cactus', icon: '🌵', paths: ['M 40,90 L 40,30 C 40,10 60,10 60,30 L 60,90', 'M 40,60 L 30,60 C 20,60 20,40 30,40', 'M 60,50 L 70,50 C 80,50 80,30 70,30'] },
        { id: 'pinecone', name: 'Pinecone', icon: '🌲', paths: ['M 50,20 L 30,50 L 50,80 L 70,50 Z', 'M 40,40 L 60,40', 'M 35,50 L 65,50', 'M 40,60 L 60,60'] },
        { id: 'raindrop', name: 'Raindrop', icon: '💧', paths: ['M 50,10 C 20,50 20,90 50,90 C 80,90 80,50 50,10 Z'] },
        { id: 'lightning', name: 'Lightning', icon: '⚡', paths: ['M 60,10 L 30,50 L 50,50 L 40,90 L 70,40 L 50,40 Z'] },
        { id: 'snowflake', name: 'Snowflake', icon: '❄️', paths: ['M 50,20 L 50,80', 'M 20,50 L 80,50', 'M 30,30 L 70,70', 'M 30,70 L 70,30'] }
    ]
};

let currentCategory = '';
let currentDrawing = null;
let drawColor = '#333333';
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let drawnPixels = 0;

// Elements
const screens = document.querySelectorAll('.screen');
const drawingGrid = document.getElementById('drawing-grid');
const drawingCanvas = document.getElementById('drawing-canvas');
const tracingCanvas = document.getElementById('tracing-canvas');
const resultCanvas = document.getElementById('result-canvas');
const ctxDraw = drawingCanvas.getContext('2d');
const ctxTrace = tracingCanvas.getContext('2d');
const ctxResult = resultCanvas.getContext('2d');

function init() {
    // Navigation
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.onclick = (e) => {
            const btnEl = e.currentTarget;
            currentCategory = btnEl.dataset.category;
            showCategory(currentCategory);
        };
    });

    document.querySelectorAll('.back-to-menu, #home-btn').forEach(btn => {
        btn.onclick = () => showScreen('main-menu');
    });

    document.getElementById('back-to-select').onclick = () => showScreen('category-select');

    // Tools
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            drawColor = e.target.dataset.color;
        };
    });

    document.getElementById('clear-btn').onclick = () => {
        ctxDraw.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawnPixels = 0;
    };

    document.getElementById('hint-btn').onclick = () => {
        const hint = document.getElementById('drawing-hint');
        hint.classList.remove('hidden');
        setTimeout(() => hint.classList.add('hidden'), 3000);
    };

    document.getElementById('finish-btn').onclick = showSuccess;
    document.getElementById('replay-btn').onclick = () => startGameplay(currentDrawing);
    
    document.getElementById('next-drawing-btn').onclick = () => {
        const catArr = drawingData[currentCategory];
        const idx = catArr.findIndex(d => d.id === currentDrawing.id);
        if (idx < catArr.length - 1) {
            startGameplay(catArr[idx + 1]);
        } else {
            showScreen('category-select');
        }
    };

    // Canvas Events
    drawingCanvas.addEventListener('mousedown', startDraw);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', endDraw);
    drawingCanvas.addEventListener('mouseout', endDraw);
    drawingCanvas.addEventListener('touchstart', startDraw, { passive: false });
    drawingCanvas.addEventListener('touchmove', draw, { passive: false });
    drawingCanvas.addEventListener('touchend', endDraw);

    // Resize canvas
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = document.querySelector('.canvas-container');
    if (!container) return;
    
    drawingCanvas.width = container.clientWidth;
    drawingCanvas.height = container.clientHeight;
    tracingCanvas.width = container.clientWidth;
    tracingCanvas.height = container.clientHeight;
    
    if (document.getElementById('gameplay-screen').classList.contains('active') && currentDrawing) {
        renderTrace();
    }
}

function showScreen(id) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('success-screen').classList.add('hidden');
    
    if (id === 'gameplay-screen') {
        setTimeout(resizeCanvas, 50);
    }
}

function showCategory(cat) {
    const categoryNames = { basics: 'Basic Shapes', objects: 'Everyday Objects', animals: 'Animals', nature: 'Nature' };
    document.getElementById('category-title').innerText = categoryNames[cat];
    
    drawingGrid.innerHTML = '';
    const drawings = drawingData[cat];
    
    drawings.forEach(d => {
        const div = document.createElement('div');
        div.className = 'grid-item';
        div.innerHTML = `<div class="grid-item-icon">${d.icon}</div><div class="grid-item-name">${d.name}</div>`;
        div.onclick = () => startGameplay(d);
        drawingGrid.appendChild(div);
    });
    
    showScreen('category-select');
}

function startGameplay(drawing) {
    currentDrawing = drawing;
    document.getElementById('current-drawing-display').innerText = drawing.name;
    
    ctxDraw.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    drawnPixels = 0;
    
    showScreen('gameplay-screen');
    renderTrace();
    
    // Show hint briefly
    const hint = document.getElementById('drawing-hint');
    hint.classList.remove('hidden');
    setTimeout(() => hint.classList.add('hidden'), 3000);
}

function renderTrace() {
    ctxTrace.clearRect(0, 0, tracingCanvas.width, tracingCanvas.height);

    if (!currentDrawing || !currentDrawing.paths) return;

    const w = tracingCanvas.width;
    const h = tracingCanvas.height;

    // Scale and center the 100x100 SVG coordinate space
    const size = Math.min(w, h) * 0.8;
    const offsetX = (w - size) / 2;
    const offsetY = (h - size) / 2;

    ctxTrace.save();
    ctxTrace.translate(offsetX, offsetY);
    ctxTrace.scale(size / 100, size / 100);

    ctxTrace.strokeStyle = 'rgba(180, 150, 255, 0.6)';
    ctxTrace.lineWidth = 5;
    ctxTrace.setLineDash([12, 8]);
    ctxTrace.lineCap = 'round';
    ctxTrace.lineJoin = 'round';

    currentDrawing.paths.forEach(p => {
        try {
            const path = new Path2D(p);
            ctxTrace.stroke(path);
        } catch(e) {
            console.warn('Path2D error:', p, e);
        }
    });

    ctxTrace.restore();
}

function getPos(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function startDraw(e) {
    if(e.cancelable) e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    
    // Draw a single dot
    ctxDraw.beginPath();
    ctxDraw.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctxDraw.fillStyle = drawColor;
    ctxDraw.fill();
}

function draw(e) {
    if (!isDrawing) return;
    if(e.cancelable) e.preventDefault();
    
    const pos = getPos(e);
    
    ctxDraw.beginPath();
    ctxDraw.moveTo(lastX, lastY);
    ctxDraw.lineTo(pos.x, pos.y);
    ctxDraw.strokeStyle = drawColor;
    ctxDraw.lineWidth = 8;
    ctxDraw.lineCap = 'round';
    ctxDraw.lineJoin = 'round';
    ctxDraw.stroke();

    const dist = Math.sqrt(Math.pow(pos.x - lastX, 2) + Math.pow(pos.y - lastY, 2));
    drawnPixels += dist;

    lastX = pos.x;
    lastY = pos.y;
}

function endDraw(e) {
    isDrawing = false;
}

function showSuccess() {
    if (drawnPixels < 100) {
        alert("Please draw something before submitting!");
        return;
    }
    
    document.getElementById('success-drawing-name').innerText = currentDrawing.name;
    
    // Copy drawing to result canvas
    resultCanvas.width = drawingCanvas.width;
    resultCanvas.height = drawingCanvas.height;
    
    // Draw white background
    ctxResult.fillStyle = '#ffffff';
    ctxResult.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
    
    // Draw user's artwork
    ctxResult.drawImage(drawingCanvas, 0, 0);
    
    document.getElementById('success-screen').classList.remove('hidden');
}

window.onload = init;
