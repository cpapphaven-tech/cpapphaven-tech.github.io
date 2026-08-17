/**
 * Word Guess Game Logic - PlayMixGames
 */
"use strict";

// A curated list of common 5-letter words
const WORDS = [
    "APPLE","TRAIN","GHOST","PLANT","WATER","SMILE","BRAIN","HEART","LIGHT","HOUSE",
    "CHAIR","TABLE","MONEY","MUSIC","PARTY","NIGHT","DREAM","CLOUD","STORM","RIVER",
    "STONE","EARTH","SPACE","STARS","PLANE","TRACK","TRUCK","WHEEL","FRAME","GLASS",
    "PAPER","PENCIL","BRUSH","PAINT","COLOR","GREEN","BROWN","BLACK","WHITE","SHIRT",
    "PANTS","SHOES","SOCKS","GLOVE","SCARF","WATCH","CLOCK","MONTH","YEARS","EARLY",
    "LATER","NEVER","OFTEN","QUICK","SLOWS","FASTS","SPEED","POWER","FORCE","STRONG",
    "BRAVE","SMART","FUNNY","HAPPY","SADLY","ANGRY","PROUD","SHARP","BLUNT","CLEAR",
    "BLURRY","CLEAN","DIRTY","SWEET","SALTY","SPICY","BITTER","FRESH","STALE","BREAD",
    "TOAST","FRUIT","GRAPE","LEMON","MELON","PEACH","BERRY","JUICE","DRINK","WATER",
    "OCEAN","BEACH","SANDY","ROCKY","MOUNTS","HILLS","TREES","GRASS","LEAFS","ROOTS",
    "MAGIC","SUPER","GRAND","ROYAL","KINGLY","QUEEN","PRINCE","CASTLE","TOWER","GUARD"
];

// Fallback dictionary for validation (in a real app, this is much larger, here we just use WORDS)
const DICTIONARY = new Set(WORDS);

const ROWS = 5;
const COLS = 5;

let grid = [];
let currentRow = 0;
let currentCol = 0;
let targetWord = "";
let isGameOver = false;

let streak = parseInt(localStorage.getItem('pmg_wordguess_streak') || '0', 10);
let bestStreak = parseInt(localStorage.getItem('pmg_wordguess_best') || '0', 10);

const boardEl = document.getElementById('board');
const overlay = document.getElementById('overlay');
const nextBtn = document.getElementById('next-btn');
const streakEl = document.getElementById('streak-display');
const bestEl = document.getElementById('best-display');

// Initialize the grid UI
function initGrid() {
    boardEl.innerHTML = "";
    grid = [];
    for (let r = 0; r < ROWS; r++) {
        let row = [];
        for (let c = 0; c < COLS; c++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.id = `tile-${r}-${c}`;
            boardEl.appendChild(tile);
            row.push('');
        }
        grid.push(row);
    }
}

function getScrambledWord(word) {
    let arr = word.split('');
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const scrambled = arr.join('');
    // Ensure it's actually scrambled
    if (scrambled === word && word.length > 1) {
        return getScrambledWord(word);
    }
    return scrambled;
}

function startNewGame() {
    targetWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    currentRow = 0;
    currentCol = 0;
    isGameOver = false;
    
    // Display Clue
    const clueText = getScrambledWord(targetWord);
    document.getElementById('clue-display').innerText = clueText;
    
    initGrid();
    
    overlay.classList.add('hidden');
    updateStatsUI();
    updateTriesUI();
    
    // Auto focus the hidden input on mobile
    document.getElementById('hidden-input').focus();
}

function updateStatsUI() {
    streakEl.innerText = streak;
    bestEl.innerText = bestStreak;
}

function updateTriesUI() {
    const triesLeft = ROWS - currentRow;
    const triesEl = document.getElementById('tries-display');
    if (triesEl) triesEl.innerText = triesLeft;
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.innerText = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 1500);
}

function handleInput(key) {
    if (isGameOver) return;
    
    if (key === 'Enter') {
        submitGuess();
    } else if (key === 'Backspace') {
        deleteLetter();
    } else if (/^[A-Z]$/.test(key)) {
        addLetter(key);
    }
}

function addLetter(letter) {
    if (currentCol < COLS) {
        grid[currentRow][currentCol] = letter;
        const tile = document.getElementById(`tile-${currentRow}-${currentCol}`);
        tile.innerText = letter;
        tile.setAttribute('data-state', 'active');
        
        // Remove animation class so it can re-trigger if needed
        setTimeout(() => {
            if (tile.getAttribute('data-state') === 'active') {
                tile.removeAttribute('data-state');
            }
        }, 150);
        
        currentCol++;
        
        // Auto-submit when the row is filled
        if (currentCol === COLS) {
            submitGuess();
        }
    }
}

function deleteLetter() {
    if (currentCol > 0) {
        currentCol--;
        grid[currentRow][currentCol] = '';
        const tile = document.getElementById(`tile-${currentRow}-${currentCol}`);
        tile.innerText = '';
        tile.removeAttribute('data-state');
    }
}

function submitGuess() {
    if (currentCol !== COLS) {
        showToast("Not enough letters");
        return;
    }
    
    const guess = grid[currentRow].join('');
    checkGuess(guess);
}

function checkGuess(guess) {
    const targetArr = targetWord.split('');
    const guessArr = guess.split('');
    const statuses = new Array(COLS).fill('absent');
    
    // 1st Pass: Find Correct (Green)
    for (let i = 0; i < COLS; i++) {
        if (guessArr[i] === targetArr[i]) {
            statuses[i] = 'correct';
            targetArr[i] = null; // consume the letter
        }
    }
    
    // 2nd Pass: Find Present (Yellow)
    for (let i = 0; i < COLS; i++) {
        if (statuses[i] === 'correct') continue;
        
        const letterIndex = targetArr.indexOf(guessArr[i]);
        if (letterIndex !== -1) {
            statuses[i] = 'present';
            targetArr[letterIndex] = null; // consume
        }
    }
    
    // Animate and reveal
    revealRow(currentRow, guessArr, statuses);
}

function revealRow(row, guessArr, statuses) {
    isGameOver = true; // disable input during animation
    
    guessArr.forEach((letter, i) => {
        setTimeout(() => {
            const tile = document.getElementById(`tile-${row}-${i}`);
            tile.classList.add('flip');
            
            // Wait for flip to reach 90deg before changing color
            setTimeout(() => {
                tile.setAttribute('data-status', statuses[i]);
            }, 250);
            
        }, i * 300);
    });
    
    // After all tiles revealed
    setTimeout(() => {
        const guessStr = guessArr.join('');
        if (guessStr === targetWord) {
            handleWin();
        } else {
            if (row === ROWS - 1) {
                handleLoss();
            } else {
                currentRow++;
                currentCol = 0;
                isGameOver = false; // re-enable input
                updateTriesUI();
                showToast("Wrong! Try again.");
            }
        }
    }, COLS * 300 + 300);
}

function handleWin() {
    showToast("Splendid!");
    streak++;
    if (streak > bestStreak) {
        bestStreak = streak;
        localStorage.setItem('pmg_wordguess_best', bestStreak);
    }
    localStorage.setItem('pmg_wordguess_streak', streak);
    
    setTimeout(() => {
        showGameOverOverlay("You Won!", true);
    }, 1000);
}

function handleLoss() {
    streak = 0;
    localStorage.setItem('pmg_wordguess_streak', streak);
    
    setTimeout(() => {
        showGameOverOverlay("Game Over", false);
    }, 1000);
}

function showGameOverOverlay(titleText, won) {
    document.getElementById('overlay-title').innerText = titleText;
    
    const titleEl = document.getElementById('overlay-title');
    if(won) {
        titleEl.style.background = 'linear-gradient(to right, #10b981, #3b82f6)';
    } else {
        titleEl.style.background = 'linear-gradient(to right, #ef4444, #f59e0b)';
    }
    titleEl.style.webkitBackgroundClip = 'text';
    
    document.getElementById('answer-word').innerText = targetWord;
    document.getElementById('stat-streak').innerText = streak;
    document.getElementById('stat-best').innerText = bestStreak;
    
    overlay.classList.remove('hidden');
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    // If the mobile hidden input is focused, let its own listeners handle the input
    if (document.activeElement === hiddenInput) return;
    
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    
    if (e.key === 'Backspace') {
        handleInput(e.key);
    } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleInput(e.key.toUpperCase());
    }
});

// Hidden input for mobile keyboard
const hiddenInput = document.getElementById('hidden-input');

// When clicking the board on mobile, summon the keyboard
boardEl.addEventListener('click', () => {
    hiddenInput.focus();
});

hiddenInput.addEventListener('input', (e) => {
    const val = hiddenInput.value.toUpperCase();
    hiddenInput.value = ''; // clear immediately
    
    for (let char of val) {
        if (/^[A-Z]$/.test(char)) {
            handleInput(char);
        }
    }
});

hiddenInput.addEventListener('keydown', (e) => {
    // Some mobile browsers emit Backspace as keydown on input
    if (e.key === 'Backspace' || e.keyCode === 8) {
        handleInput('Backspace');
    }
});

nextBtn.addEventListener('click', startNewGame);

// Start
startNewGame();
