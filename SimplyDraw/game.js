const drawingData = {
    basics: [
        { id: 'circle', name: 'Circle', icon: '⭕', paths: [ [ [0.5,0.1], [0.8,0.2], [0.9,0.5], [0.8,0.8], [0.5,0.9], [0.2,0.8], [0.1,0.5], [0.2,0.2], [0.5,0.1] ] ] },
        { id: 'square', name: 'Square', icon: '🟦', paths: [ [ [0.2,0.2], [0.8,0.2], [0.8,0.8], [0.2,0.8], [0.2,0.2] ] ] },
        { id: 'triangle', name: 'Triangle', icon: '🔺', paths: [ [ [0.5,0.2], [0.8,0.8], [0.2,0.8], [0.5,0.2] ] ] },
        { id: 'star', name: 'Star', icon: '⭐', paths: [ [ [0.5,0.1], [0.6,0.4], [0.9,0.4], [0.65,0.6], [0.75,0.9], [0.5,0.7], [0.25,0.9], [0.35,0.6], [0.1,0.4], [0.4,0.4], [0.5,0.1] ] ] },
        { id: 'hexagon', name: 'Hexagon', icon: '⬡', paths: [ [ [0.5,0.1], [0.85,0.3], [0.85,0.7], [0.5,0.9], [0.15,0.7], [0.15,0.3], [0.5,0.1] ] ] },
        { id: 'pentagon', name: 'Pentagon', icon: '⬠', paths: [ [ [0.5,0.1], [0.9,0.4], [0.75,0.9], [0.25,0.9], [0.1,0.4], [0.5,0.1] ] ] },
        { id: 'diamond', name: 'Diamond', icon: '♦️', paths: [ [ [0.5,0.1], [0.9,0.5], [0.5,0.9], [0.1,0.5], [0.5,0.1] ] ] },
        { id: 'oval', name: 'Oval', icon: '0️⃣', paths: [ [ [0.5,0.2], [0.7,0.3], [0.8,0.5], [0.7,0.7], [0.5,0.8], [0.3,0.7], [0.2,0.5], [0.3,0.3], [0.5,0.2] ] ] },
        { id: 'rectangle', name: 'Rectangle', icon: '▬', paths: [ [ [0.2,0.3], [0.8,0.3], [0.8,0.7], [0.2,0.7], [0.2,0.3] ] ] },
        { id: 'heart', name: 'Heart', icon: '❤️', paths: [ [ [0.5,0.3], [0.7,0.1], [0.9,0.3], [0.5,0.9], [0.1,0.3], [0.3,0.1], [0.5,0.3] ] ] },
        { id: 'cross', name: 'Cross', icon: '➕', paths: [ [ [0.4,0.2], [0.6,0.2], [0.6,0.4], [0.8,0.4], [0.8,0.6], [0.6,0.6], [0.6,0.8], [0.4,0.8], [0.4,0.6], [0.2,0.6], [0.2,0.4], [0.4,0.4], [0.4,0.2] ] ] },
        { id: 'moon', name: 'Moon', icon: '🌙', paths: [ [ [0.5,0.1], [0.3,0.3], [0.3,0.7], [0.5,0.9], [0.7,0.7], [0.6,0.5], [0.7,0.3], [0.5,0.1] ] ] },
        { id: 'arrow', name: 'Arrow', icon: '➡️', paths: [ [ [0.2,0.4], [0.6,0.4], [0.6,0.2], [0.9,0.5], [0.6,0.8], [0.6,0.6], [0.2,0.6], [0.2,0.4] ] ] }
    ],
    objects: [
        { id: 'cup', name: 'Coffee Cup', icon: '☕', paths: [ [ [0.3,0.3], [0.7,0.3], [0.65,0.7], [0.35,0.7], [0.3,0.3] ], [ [0.7,0.4], [0.8,0.4], [0.8,0.6], [0.68,0.6] ] ] },
        { id: 'house', name: 'House', icon: '🏠', paths: [ [ [0.2,0.5], [0.5,0.2], [0.8,0.5] ], [ [0.3,0.5], [0.7,0.5], [0.7,0.9], [0.3,0.9], [0.3,0.5] ], [ [0.45,0.9], [0.45,0.7], [0.55,0.7], [0.55,0.9] ] ] },
        { id: 'car', name: 'Car', icon: '🚗', paths: [ [ [0.2,0.6], [0.8,0.6], [0.8,0.8], [0.2,0.8], [0.2,0.6] ], [ [0.3,0.6], [0.4,0.4], [0.6,0.4], [0.7,0.6] ], [ [0.3,0.8], [0.3,0.9] ], [ [0.7,0.8], [0.7,0.9] ] ] },
        { id: 'chair', name: 'Chair', icon: '🪑', paths: [ [ [0.3,0.2], [0.3,0.6], [0.7,0.6], [0.7,0.9] ], [ [0.3,0.6], [0.3,0.9] ], [ [0.3,0.4], [0.7,0.4] ] ] },
        { id: 'table', name: 'Table', icon: '🪚', paths: [ [ [0.2,0.4], [0.8,0.4], [0.8,0.5], [0.2,0.5], [0.2,0.4] ], [ [0.3,0.5], [0.3,0.9] ], [ [0.7,0.5], [0.7,0.9] ] ] },
        { id: 'book', name: 'Book', icon: '📖', paths: [ [ [0.2,0.3], [0.8,0.3], [0.8,0.8], [0.2,0.8], [0.2,0.3] ], [ [0.5,0.3], [0.5,0.8] ] ] },
        { id: 'lamp', name: 'Lamp', icon: '💡', paths: [ [ [0.4,0.2], [0.6,0.2], [0.7,0.5], [0.3,0.5], [0.4,0.2] ], [ [0.5,0.5], [0.5,0.8] ], [ [0.3,0.8], [0.7,0.8], [0.7,0.9], [0.3,0.9], [0.3,0.8] ] ] },
        { id: 'phone', name: 'Phone', icon: '📱', paths: [ [ [0.3,0.2], [0.7,0.2], [0.7,0.8], [0.3,0.8], [0.3,0.2] ], [ [0.4,0.3], [0.6,0.3], [0.6,0.6], [0.4,0.6], [0.4,0.3] ], [ [0.5,0.7], [0.5,0.7] ] ] },
        { id: 'clock', name: 'Clock', icon: '⌚', paths: [ [ [0.5,0.2], [0.8,0.5], [0.5,0.8], [0.2,0.5], [0.5,0.2] ], [ [0.5,0.5], [0.5,0.3] ], [ [0.5,0.5], [0.7,0.5] ] ] },
        { id: 'key', name: 'Key', icon: '🔑', paths: [ [ [0.3,0.5], [0.5,0.3], [0.7,0.5], [0.5,0.7], [0.3,0.5] ], [ [0.7,0.5], [0.9,0.5] ], [ [0.8,0.5], [0.8,0.6] ], [ [0.9,0.5], [0.9,0.6] ] ] },
        { id: 'glasses', name: 'Glasses', icon: '👓', paths: [ [ [0.2,0.4], [0.4,0.4], [0.4,0.6], [0.2,0.6], [0.2,0.4] ], [ [0.6,0.4], [0.8,0.4], [0.8,0.6], [0.6,0.6], [0.6,0.4] ], [ [0.4,0.5], [0.6,0.5] ] ] },
        { id: 'pencil', name: 'Pencil', icon: '✏️', paths: [ [ [0.2,0.2], [0.3,0.3], [0.8,0.8], [0.7,0.9], [0.2,0.2] ], [ [0.7,0.9], [0.9,0.9], [0.8,0.8] ] ] },
        { id: 'scissors', name: 'Scissors', icon: '✂️', paths: [ [ [0.3,0.3], [0.7,0.7] ], [ [0.3,0.7], [0.7,0.3] ], [ [0.2,0.2], [0.3,0.3] ], [ [0.2,0.8], [0.3,0.7] ] ] },
        { id: 'umbrella', name: 'Umbrella', icon: '☂️', paths: [ [ [0.2,0.5], [0.5,0.2], [0.8,0.5], [0.2,0.5] ], [ [0.5,0.5], [0.5,0.8], [0.4,0.9] ] ] },
        { id: 'ball', name: 'Ball', icon: '⚽', paths: [ [ [0.5,0.2], [0.8,0.5], [0.5,0.8], [0.2,0.5], [0.5,0.2] ], [ [0.2,0.5], [0.5,0.4], [0.8,0.5] ], [ [0.5,0.2], [0.4,0.5], [0.5,0.8] ] ] }
    ],
    animals: [
        { id: 'catface', name: 'Cat Face', icon: '🐱', paths: [ [ [0.2,0.4], [0.3,0.2], [0.4,0.4] ], [ [0.8,0.4], [0.7,0.2], [0.6,0.4] ], [ [0.2,0.4], [0.5,0.9], [0.8,0.4] ], [ [0.35,0.5], [0.4,0.5] ], [ [0.65,0.5], [0.6,0.5] ], [ [0.5,0.65], [0.4,0.7], [0.5,0.75], [0.6,0.7] ] ] },
        { id: 'fish', name: 'Fish', icon: '🐟', paths: [ [ [0.2,0.5], [0.5,0.3], [0.8,0.5], [0.5,0.7], [0.2,0.5] ], [ [0.8,0.5], [0.9,0.3], [0.9,0.7], [0.8,0.5] ], [ [0.4,0.45], [0.45,0.45] ] ] },
        { id: 'dogface', name: 'Dog Face', icon: '🐶', paths: [ [ [0.3,0.5], [0.2,0.7], [0.4,0.6] ], [ [0.7,0.5], [0.8,0.7], [0.6,0.6] ], [ [0.3,0.5], [0.5,0.2], [0.7,0.5], [0.7,0.8], [0.3,0.8], [0.3,0.5] ], [ [0.4,0.4], [0.45,0.4] ], [ [0.6,0.4], [0.55,0.4] ], [ [0.5,0.6], [0.5,0.7] ] ] },
        { id: 'bird', name: 'Bird', icon: '🐦', paths: [ [ [0.3,0.5], [0.5,0.3], [0.7,0.5], [0.5,0.7], [0.3,0.5] ], [ [0.7,0.5], [0.8,0.4], [0.7,0.6] ], [ [0.2,0.5], [0.3,0.4], [0.3,0.6], [0.2,0.5] ], [ [0.4,0.4], [0.45,0.4] ] ] },
        { id: 'mouse', name: 'Mouse', icon: '🐭', paths: [ [ [0.3,0.3], [0.4,0.5] ], [ [0.7,0.3], [0.6,0.5] ], [ [0.3,0.7], [0.5,0.4], [0.7,0.7], [0.5,0.9], [0.3,0.7] ], [ [0.45,0.5], [0.5,0.5] ], [ [0.55,0.5], [0.5,0.5] ] ] },
        { id: 'elephant', name: 'Elephant', icon: '🐘', paths: [ [ [0.3,0.3], [0.2,0.6], [0.4,0.5] ], [ [0.7,0.3], [0.8,0.6], [0.6,0.5] ], [ [0.4,0.5], [0.6,0.5], [0.6,0.7], [0.5,0.9], [0.4,0.7], [0.4,0.5] ], [ [0.45,0.6], [0.45,0.6] ], [ [0.55,0.6], [0.55,0.6] ] ] },
        { id: 'lion', name: 'Lion', icon: '🦁', paths: [ [ [0.5,0.2], [0.7,0.3], [0.8,0.5], [0.7,0.8], [0.3,0.8], [0.2,0.5], [0.3,0.3], [0.5,0.2] ], [ [0.4,0.4], [0.6,0.4], [0.6,0.6], [0.4,0.6], [0.4,0.4] ], [ [0.5,0.5], [0.5,0.5] ] ] },
        { id: 'snake', name: 'Snake', icon: '🐍', paths: [ [ [0.2,0.8], [0.4,0.6], [0.6,0.8], [0.8,0.6], [0.8,0.4], [0.6,0.2], [0.4,0.2], [0.4,0.4], [0.5,0.5] ], [ [0.4,0.3], [0.45,0.3] ] ] },
        { id: 'frog', name: 'Frog', icon: '🐸', paths: [ [ [0.3,0.4], [0.4,0.4] ], [ [0.6,0.4], [0.7,0.4] ], [ [0.2,0.6], [0.8,0.6], [0.7,0.8], [0.3,0.8], [0.2,0.6] ], [ [0.4,0.7], [0.6,0.7] ] ] },
        { id: 'turtle', name: 'Turtle', icon: '🐢', paths: [ [ [0.3,0.5], [0.7,0.5], [0.6,0.3], [0.4,0.3], [0.3,0.5] ], [ [0.7,0.5], [0.8,0.6], [0.7,0.6] ], [ [0.3,0.5], [0.2,0.6], [0.3,0.6] ], [ [0.4,0.5], [0.4,0.6] ], [ [0.6,0.5], [0.6,0.6] ] ] },
        { id: 'bear', name: 'Bear', icon: '🐻', paths: [ [ [0.3,0.3], [0.4,0.4] ], [ [0.7,0.3], [0.6,0.4] ], [ [0.3,0.4], [0.7,0.4], [0.7,0.8], [0.3,0.8], [0.3,0.4] ], [ [0.4,0.5], [0.45,0.5] ], [ [0.6,0.5], [0.55,0.5] ], [ [0.5,0.6], [0.5,0.7] ] ] },
        { id: 'rabbit', name: 'Rabbit', icon: '🐰', paths: [ [ [0.4,0.5], [0.3,0.2], [0.45,0.4] ], [ [0.6,0.5], [0.7,0.2], [0.55,0.4] ], [ [0.4,0.5], [0.6,0.5], [0.6,0.8], [0.4,0.8], [0.4,0.5] ], [ [0.45,0.6], [0.45,0.6] ], [ [0.55,0.6], [0.55,0.6] ], [ [0.5,0.7], [0.5,0.7] ] ] },
        { id: 'pig', name: 'Pig', icon: '🐷', paths: [ [ [0.3,0.3], [0.4,0.4] ], [ [0.7,0.3], [0.6,0.4] ], [ [0.3,0.4], [0.7,0.4], [0.7,0.8], [0.3,0.8], [0.3,0.4] ], [ [0.4,0.5], [0.45,0.5] ], [ [0.6,0.5], [0.55,0.5] ], [ [0.45,0.6], [0.55,0.6], [0.55,0.7], [0.45,0.7], [0.45,0.6] ] ] },
        { id: 'cow', name: 'Cow', icon: '🐮', paths: [ [ [0.2,0.4], [0.3,0.5] ], [ [0.8,0.4], [0.7,0.5] ], [ [0.3,0.3], [0.4,0.4] ], [ [0.7,0.3], [0.6,0.4] ], [ [0.3,0.4], [0.7,0.4], [0.7,0.8], [0.3,0.8], [0.3,0.4] ], [ [0.4,0.5], [0.45,0.5] ], [ [0.6,0.5], [0.55,0.5] ], [ [0.4,0.6], [0.6,0.6], [0.6,0.8], [0.4,0.8], [0.4,0.6] ] ] },
        { id: 'monkey', name: 'Monkey', icon: '🐒', paths: [ [ [0.2,0.5], [0.3,0.4], [0.3,0.6], [0.2,0.5] ], [ [0.8,0.5], [0.7,0.4], [0.7,0.6], [0.8,0.5] ], [ [0.3,0.4], [0.7,0.4], [0.7,0.8], [0.3,0.8], [0.3,0.4] ], [ [0.4,0.5], [0.45,0.5] ], [ [0.6,0.5], [0.55,0.5] ], [ [0.4,0.7], [0.6,0.7] ] ] }
    ],
    nature: [
        { id: 'tree', name: 'Tree', icon: '🌳', paths: [ [ [0.45,0.9], [0.45,0.6], [0.55,0.6], [0.55,0.9] ], [ [0.3,0.6], [0.5,0.2], [0.7,0.6], [0.3,0.6] ] ] },
        { id: 'flower', name: 'Flower', icon: '🌸', paths: [ [ [0.5,0.5], [0.5,0.9] ], [ [0.5,0.5], [0.3,0.3], [0.5,0.2], [0.7,0.3], [0.5,0.5] ], [ [0.5,0.5], [0.3,0.7], [0.2,0.5], [0.5,0.5] ], [ [0.5,0.5], [0.7,0.7], [0.8,0.5], [0.5,0.5] ] ] },
        { id: 'sun', name: 'Sun', icon: '☀️', paths: [ [ [0.5,0.3], [0.7,0.5], [0.5,0.7], [0.3,0.5], [0.5,0.3] ], [ [0.5,0.1], [0.5,0.2] ], [ [0.5,0.8], [0.5,0.9] ], [ [0.1,0.5], [0.2,0.5] ], [ [0.8,0.5], [0.9,0.5] ], [ [0.2,0.2], [0.3,0.3] ], [ [0.8,0.8], [0.7,0.7] ], [ [0.8,0.2], [0.7,0.3] ], [ [0.2,0.8], [0.3,0.7] ] ] },
        { id: 'cloud', name: 'Cloud', icon: '☁️', paths: [ [ [0.3,0.6], [0.2,0.5], [0.3,0.4], [0.4,0.4], [0.5,0.3], [0.7,0.3], [0.8,0.4], [0.8,0.6], [0.3,0.6] ] ] },
        { id: 'mountain', name: 'Mountain', icon: '⛰️', paths: [ [ [0.1,0.8], [0.4,0.2], [0.7,0.8] ], [ [0.4,0.8], [0.7,0.3], [0.9,0.8] ], [ [0.3,0.4], [0.4,0.5], [0.5,0.4] ] ] },
        { id: 'river', name: 'River', icon: '🏞️', paths: [ [ [0.2,0.8], [0.4,0.6], [0.6,0.7], [0.8,0.5] ], [ [0.2,0.9], [0.4,0.7], [0.6,0.8], [0.8,0.6] ] ] },
        { id: 'leaf', name: 'Leaf', icon: '🍃', paths: [ [ [0.5,0.9], [0.5,0.2] ], [ [0.5,0.9], [0.3,0.6], [0.5,0.2] ], [ [0.5,0.9], [0.7,0.6], [0.5,0.2] ], [ [0.5,0.7], [0.4,0.6] ], [ [0.5,0.5], [0.6,0.4] ] ] },
        { id: 'starfish', name: 'Starfish', icon: '⭐', paths: [ [ [0.5,0.2], [0.6,0.4], [0.8,0.5], [0.6,0.6], [0.7,0.8], [0.5,0.7], [0.3,0.8], [0.4,0.6], [0.2,0.5], [0.4,0.4], [0.5,0.2] ] ] },
        { id: 'shell', name: 'Shell', icon: '🐚', paths: [ [ [0.3,0.7], [0.5,0.3], [0.7,0.7], [0.3,0.7] ], [ [0.5,0.3], [0.4,0.7] ], [ [0.5,0.3], [0.6,0.7] ], [ [0.4,0.7], [0.4,0.8], [0.6,0.8], [0.6,0.7] ] ] },
        { id: 'mushroom', name: 'Mushroom', icon: '🍄', paths: [ [ [0.4,0.9], [0.4,0.6], [0.6,0.6], [0.6,0.9] ], [ [0.2,0.6], [0.5,0.2], [0.8,0.6], [0.2,0.6] ], [ [0.4,0.4], [0.45,0.45] ], [ [0.6,0.5], [0.65,0.55] ] ] },
        { id: 'cactus', name: 'Cactus', icon: '🌵', paths: [ [ [0.4,0.9], [0.4,0.3], [0.6,0.3], [0.6,0.9] ], [ [0.4,0.6], [0.3,0.6], [0.3,0.4], [0.35,0.4] ], [ [0.6,0.5], [0.7,0.5], [0.7,0.3], [0.65,0.3] ] ] },
        { id: 'pinecone', name: 'Pinecone', icon: '🌲', paths: [ [ [0.5,0.2], [0.3,0.5], [0.5,0.8], [0.7,0.5], [0.5,0.2] ], [ [0.4,0.4], [0.6,0.4] ], [ [0.35,0.5], [0.65,0.5] ], [ [0.4,0.6], [0.6,0.6] ] ] },
        { id: 'raindrop', name: 'Raindrop', icon: '💧', paths: [ [ [0.5,0.2], [0.3,0.6], [0.5,0.8], [0.7,0.6], [0.5,0.2] ] ] },
        { id: 'lightning', name: 'Lightning', icon: '⚡', paths: [ [ [0.6,0.2], [0.3,0.5], [0.5,0.5], [0.4,0.8], [0.7,0.4], [0.5,0.4], [0.6,0.2] ] ] },
        { id: 'snowflake', name: 'Snowflake', icon: '❄️', paths: [ [ [0.5,0.2], [0.5,0.8] ], [ [0.2,0.5], [0.8,0.5] ], [ [0.3,0.3], [0.7,0.7] ], [ [0.3,0.7], [0.7,0.3] ] ] }
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
    
    ctxTrace.strokeStyle = '#cccccc';
    ctxTrace.lineWidth = 4;
    ctxTrace.setLineDash([10, 10]);
    ctxTrace.lineCap = 'round';
    ctxTrace.lineJoin = 'round';
    
    const w = tracingCanvas.width;
    const h = tracingCanvas.height;
    
    currentDrawing.paths.forEach(path => {
        if (path.length === 0) return;
        ctxTrace.beginPath();
        // Scale to 80% and center
        const scaleX = x => w * 0.1 + (x * w * 0.8);
        const scaleY = y => h * 0.1 + (y * h * 0.8);
        
        ctxTrace.moveTo(scaleX(path[0][0]), scaleY(path[0][1]));
        for (let i = 1; i < path.length; i++) {
            ctxTrace.lineTo(scaleX(path[i][0]), scaleY(path[i][1]));
        }
        ctxTrace.stroke();
    });
    ctxTrace.setLineDash([]);
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
