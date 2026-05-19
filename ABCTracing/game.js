const lettersUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const lettersLower = 'abcdefghijklmnopqrstuvwxyz'.split('');
const numbers = '1234567890'.split('');
const wordsList = [
    // Animals
    'CAT', 'DOG', 'COW', 'PIG', 'LION', 'TIGER', 'BEAR', 'FOX', 'DEER', 'HORSE',
    // Fruits
    'APPLE', 'BANANA', 'MANGO', 'GRAPE', 'PEACH', 'PLUM', 'KIWI', 'PEAR',
    // Family
    'MOM', 'DAD', 'SISTER', 'BROTHER', 'AUNT', 'UNCLE'
];

const associations = {
    'A': 'A is for Apple 🍎', 'B': 'B is for Bear 🐻', 'C': 'C is for Cat 🐱',
    'D': 'D is for Dog 🐶', 'E': 'E is for Elephant 🐘', 'F': 'F is for Frog 🐸',
    'G': 'G is for Giraffe 🦒', 'H': 'H is for Horse 🐴', 'I': 'I is for Ice Cream 🍦',
    'J': 'J is for Jellyfish 🪼', 'K': 'K is for Kangaroo 🦘', 'L': 'L is for Lion 🦁',
    'M': 'M is for Monkey 🐒', 'N': 'N is for Nest 🪹', 'O': 'O is for Owl 🦉',
    'P': 'P is for Pig 🐷', 'Q': 'Q is for Queen 👑', 'R': 'R is for Rabbit 🐰',
    'S': 'S is for Sun ☀️', 'T': 'T is for Tiger 🐯', 'U': 'U is for Umbrella ☔',
    'V': 'V is for Violin 🎻', 'W': 'W is for Whale 🐳', 'X': 'X is for Xylophone 🎼',
    'Y': 'Y is for Yak 🐂', 'Z': 'Z is for Zebra 🦓',
    '1': 'One 🍎', '2': 'Two 🍎🍎', '3': 'Three 🍎🍎🍎', '4': 'Four 🍎🍎🍎🍎',
    '5': 'Five 🍎🍎🍎🍎🍎', '6': 'Six 🍎🍎🍎🍎🍎🍎', '7': 'Seven 🍎🍎🍎🍎🍎🍎🍎',
    '8': 'Eight 🍎🍎🍎🍎🍎🍎🍎🍎', '9': 'Nine 🍎🍎🍎🍎🍎🍎🍎🍎🍎', '0': 'Zero 🫙'
};

let currentItem = 'A';
let currentMode = 'trace'; // only trace mode now
let currentType = 'abc'; // abc, num

// Elements
const screens = document.querySelectorAll('.screen');
const abcGrid = document.getElementById('abc-grid');
const numGrid = document.getElementById('num-grid');
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('guidance-overlay');
const wordAssoc = document.getElementById('word-association');
// Tabs removed

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let drawnPixels = 0;
let requiredPixels = 100;

function init() {
    // Generate Grids
    lettersUpper.forEach(l => {
        let div = document.createElement('div');
        div.className = 'grid-item';
        div.innerText = l;
        div.onclick = () => startGameplay(l, 'abc-upper');
        document.getElementById('abc-upper-grid').appendChild(div);
    });

    lettersLower.forEach(l => {
        let div = document.createElement('div');
        div.className = 'grid-item';
        div.innerText = l;
        div.onclick = () => startGameplay(l, 'abc-lower');
        document.getElementById('abc-lower-grid').appendChild(div);
    });

    numbers.forEach(n => {
        let div = document.createElement('div');
        div.className = 'grid-item';
        div.innerText = n;
        div.onclick = () => startGameplay(n, 'num');
        numGrid.appendChild(div);
    });

    wordsList.forEach(w => {
        let div = document.createElement('div');
        div.className = 'grid-item word-item';
        div.innerText = w;
        div.onclick = () => startGameplay(w, 'word');
        document.getElementById('word-grid').appendChild(div);
    });

    // Navigation
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.onclick = (e) => showScreen(e.target.dataset.target);
    });

    document.querySelectorAll('.back-to-menu').forEach(btn => {
        btn.onclick = () => showScreen('main-menu');
    });

    document.getElementById('back-to-select').onclick = () => {
        if (currentType === 'abc-upper') showScreen('abc-upper-select');
        else if (currentType === 'abc-lower') showScreen('abc-lower-select');
        else if (currentType === 'num') showScreen('num-select');
        else showScreen('word-select');
    };

    // Tabs removed

    // Canvas Events
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseout', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    // Controls
    document.getElementById('clear-btn').onclick = () => renderCanvas();
    document.getElementById('finish-btn').onclick = showSuccess;
    document.getElementById('next-letter-btn').onclick = nextItem;
    document.getElementById('replay-btn').onclick = () => {
        document.getElementById('success-screen').classList.add('hidden');
        setMode('trace');
    };

    // Resize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = document.querySelector('.canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    if (document.getElementById('gameplay-screen').classList.contains('active')) {
        renderCanvas();
    }
}

function showScreen(id) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function startGameplay(item, type) {
    currentItem = item;
    currentType = type;
    document.getElementById('current-letter-display').innerText = item;
    if (type === 'word') {
        wordAssoc.innerText = `Trace the word ${item}!`;
    } else {
        let assocText = associations[item.toUpperCase()] || '';
        if (type === 'abc-lower' && assocText) {
            assocText = item + assocText.slice(1);
        }
        wordAssoc.innerText = assocText;
    }
    
    showScreen('gameplay-screen');
    resizeCanvas();
    setMode('trace');
}

function setMode(mode) {
    currentMode = 'trace';

    // Reset overlay and buttons
    overlay.innerHTML = '';
    document.getElementById('finish-btn').style.animation = '';
    drawnPixels = 0;

    renderCanvas();
}

// nextMode removed

function nextItem() {
    document.getElementById('success-screen').classList.add('hidden');
    let arr = currentType === 'abc-upper' ? lettersUpper : 
              (currentType === 'abc-lower' ? lettersLower : 
              (currentType === 'num' ? numbers : wordsList));
    let idx = arr.indexOf(currentItem);
    if (idx < arr.length - 1) {
        startGameplay(arr[idx + 1], currentType);
    } else {
        showScreen('main-menu');
    }
}

function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw trace guide
    let fontSize = canvas.height * 0.7;
    ctx.font = `bold ${fontSize}px "Comic Sans MS", "Varela Round", sans-serif`;
    
    // Scale down if text is too wide
    let textWidth = ctx.measureText(currentItem).width;
    if (textWidth > canvas.width * 0.9) {
        fontSize = fontSize * ((canvas.width * 0.9) / textWidth);
        ctx.font = `bold ${fontSize}px "Comic Sans MS", "Varela Round", sans-serif`;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Dashed outline
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = currentType === 'word' ? 5 : 10;
    ctx.setLineDash([15, 15]);
    ctx.strokeText(currentItem, canvas.width / 2, canvas.height / 2 + (canvas.height*0.05));
    ctx.setLineDash([]);
}

// setupTapMode removed

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
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
    let pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
}

function draw(e) {
    if (!isDrawing) return;
    if(e.cancelable) e.preventDefault();
    let pos = getPos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e90ff'; // Player draw color
    ctx.lineWidth = currentType === 'word' ? 8 : 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Simple length calculation
    let dist = Math.sqrt(Math.pow(pos.x - lastX, 2) + Math.pow(pos.y - lastY, 2));
    drawnPixels += dist;

    lastX = pos.x;
    lastY = pos.y;

    checkProgress();
}

function endDraw() {
    isDrawing = false;
}

function checkProgress() {
    // If they drew a decent amount, allow next step
    if (drawnPixels > 500) {
        // We could auto-advance, but let's let them draw and click next,
        // or just show a nice checkmark.
        document.getElementById('finish-btn').style.animation = 'pulse-btn 1s infinite alternate';
    }
}

function showSuccess() {
    document.getElementById('success-letter').innerText = currentItem;
    document.getElementById('success-screen').classList.remove('hidden');
}

// Support functions globally for ads/analytics

window.onload = init;
