/**
 * Hangman Game Logic - PlayMixGames
 */
"use strict";

const WORDS = [
    // Animals
    { word: "ELEPHANT",  clue: "I am the largest land animal on Earth, known for my long trunk and big ears." },
    { word: "GIRAFFE",   clue: "I am the tallest animal alive, with a very long neck to reach treetops." },
    { word: "KANGAROO",  clue: "I carry my baby in a pouch and hop on my powerful hind legs." },
    { word: "DOLPHIN",   clue: "I am a highly intelligent marine mammal that loves to leap out of the ocean." },
    { word: "PENGUIN",   clue: "I am a flightless bird that waddles on ice and swims brilliantly." },
    { word: "CHEETAH",   clue: "I am the fastest land animal on Earth, reaching 120 km/h in seconds." },
    { word: "GORILLA",   clue: "I am the largest living primate, known for my great strength and intelligence." },
    { word: "OSTRICH",   clue: "I am the world's largest bird and I cannot fly, but I run very fast." },
    { word: "PANTHER",   clue: "I am a sleek big cat with a jet-black coat, known for my stealth in the jungle." },
    { word: "FLAMINGO",  clue: "I am a tall pink bird that often stands on one leg near shallow lakes." },
    // Countries
    { word: "BRAZIL",    clue: "I am the largest country in South America, famous for the Amazon rainforest." },
    { word: "CANADA",    clue: "I am the second largest country in the world, located north of the USA." },
    { word: "JAPAN",     clue: "I am an island nation in East Asia, famous for sushi, anime, and cherry blossoms." },
    { word: "FRANCE",    clue: "I am a European country famous for the Eiffel Tower and fine cuisine." },
    { word: "MEXICO",    clue: "I am a North American country famous for tacos, pyramids, and mariachi music." },
    { word: "EGYPT",     clue: "I am a country in North Africa, home to the ancient Pyramids and the Sphinx." },
    { word: "SPAIN",     clue: "I am a European country famous for flamenco dancing, bullfighting, and paella." },
    { word: "GREECE",    clue: "I am the birthplace of democracy and the Olympic Games, located in Europe." },
    { word: "NORWAY",    clue: "I am a Scandinavian country known for fjords, the Northern Lights, and Vikings." },
    { word: "TURKEY",    clue: "I am a country that sits on two continents — Europe and Asia." },
    // Sports
    { word: "BASKETBALL", clue: "In this sport, players dribble a ball and score by throwing it through a hoop." },
    { word: "FOOTBALL",  clue: "The world's most popular sport, played with a round ball between two teams of eleven." },
    { word: "TENNIS",    clue: "Players use a racket to hit a ball back and forth across a net." },
    { word: "CRICKET",   clue: "A bat-and-ball game very popular in India, England, and Australia." },
    { word: "VOLLEYBALL", clue: "Teams hit a ball over a high net without letting it touch the ground on their side." },
    { word: "SWIMMING",  clue: "An Olympic sport where athletes race through water using different strokes." },
    { word: "BOXING",    clue: "Two athletes fight wearing padded gloves inside a roped square ring." },
    { word: "ARCHERY",   clue: "A sport where players aim and shoot arrows at a bullseye target." },
    { word: "GOLF",      clue: "Players use clubs to hit a small white ball into a series of holes on a course." },
    { word: "RUGBY",     clue: "A tough team sport where players carry an oval ball and tackle opponents." },
    // Technology
    { word: "COMPUTER",  clue: "An electronic device used to process data, browse the internet, and run programs." },
    { word: "INTERNET",  clue: "A global network that connects millions of computers and devices worldwide." },
    { word: "KEYBOARD",  clue: "An input device with keys for letters, numbers, and symbols used to type." },
    { word: "MONITOR",   clue: "The screen that displays the visual output of a computer." },
    { word: "BROWSER",   clue: "A software application you use to surf the World Wide Web (e.g., Chrome)." },
    { word: "NETWORK",   clue: "A group of computers and devices connected to share resources and data." },
    { word: "DATABASE",  clue: "An organized collection of data stored and accessed electronically." },
    { word: "SOFTWARE",  clue: "Programs and operating information used by a computer to run applications." },
    { word: "ROBOT",     clue: "A machine programmed to carry out tasks automatically, often mimicking humans." },
    { word: "SATELLITE", clue: "An object launched into orbit around Earth to relay signals and gather data." },
    // Space
    { word: "PLANET",    clue: "A large spherical body that orbits a star, like Earth orbits the Sun." },
    { word: "GALAXY",    clue: "A massive system of millions of stars, gas, and dust held together by gravity." },
    { word: "ASTEROID",  clue: "A rocky object that orbits the Sun, smaller than a planet, found in a belt between Mars and Jupiter." },
    { word: "GRAVITY",   clue: "The invisible force that pulls objects toward each other and keeps us on the ground." },
    { word: "ASTRONAUT", clue: "A person trained to travel and work in outer space." },
    { word: "TELESCOPE", clue: "An optical instrument that makes distant stars and planets appear closer and larger." },
    { word: "UNIVERSE",  clue: "Everything that exists — all matter, energy, space, and time — is contained in me." },
    { word: "ECLIPSE",   clue: "An event when the Moon passes between Earth and the Sun, blocking sunlight." },
    { word: "ROCKET",    clue: "A vehicle propelled by burning fuel, used to launch spacecraft into orbit." },
    { word: "COMET",     clue: "An icy body that travels through space and grows a glowing tail when near the Sun." },
];

let currentClue = "";
let targetWord = "";
let guessedLetters = new Set();
let mistakes = 0;
const MAX_MISTAKES = 6;
let isGameOver = false;

let streak = parseInt(localStorage.getItem('pmg_hangman_streak') || '0', 10);
let bestStreak = parseInt(localStorage.getItem('pmg_hangman_best') || '0', 10);

// DOM Elements
const canvas = document.getElementById('hangman-canvas');
const ctx = canvas.getContext('2d');
const wordContainer = document.getElementById('word-container');
const keyboardContainer = null; // no on-screen keyboard
const overlay = document.getElementById('overlay');
const nextBtn = document.getElementById('next-btn');
const mistakesEl = document.getElementById('mistakes-display');
const streakEl = document.getElementById('streak-display');
const bestEl = document.getElementById('best-display');
const categoryText = document.getElementById('category-text');

// Initialize Game
function startNewGame() {
    // Pick random word + clue
    const entry = WORDS[Math.floor(Math.random() * WORDS.length)];
    targetWord = entry.word;
    currentClue = entry.clue;
    
    guessedLetters.clear();
    mistakes = 0;
    isGameOver = false;
    
    categoryText.innerText = currentClue;
    
    initUI();
    drawHangman();
    updateStatsUI();
}

function initUI() {
    overlay.classList.add('hidden');
    mistakesEl.innerText = `${mistakes} / ${MAX_MISTAKES}`;
    
    // Generate Word Reveal Boxes
    wordContainer.innerHTML = '';
    for (let i = 0; i < targetWord.length; i++) {
        const box = document.createElement('div');
        box.classList.add('letter-box');
        box.id = `letter-${i}`;
        wordContainer.appendChild(box);
    }
    
    // Auto-focus hidden input for mobile
    document.getElementById('hidden-input').focus();
}

function updateStatsUI() {
    streakEl.innerText = streak;
    bestEl.innerText = bestStreak;
}

function handleGuess(letter) {
    if (isGameOver || guessedLetters.has(letter)) return;
    
    guessedLetters.add(letter);
    
    if (targetWord.includes(letter)) {
        
        // Reveal letters
        let wordComplete = true;
        for (let i = 0; i < targetWord.length; i++) {
            if (targetWord[i] === letter) {
                document.getElementById(`letter-${i}`).innerText = letter;
            }
            if (!guessedLetters.has(targetWord[i])) {
                wordComplete = false;
            }
        }
        
        if (wordComplete) {
            handleWin();
        }
    } else {
        // Incorrect
        mistakes++;
        mistakesEl.innerText = `${mistakes} / ${MAX_MISTAKES}`;
        drawHangman();
        
        if (mistakes >= MAX_MISTAKES) {
            handleLoss();
        }
    }
}

// Canvas Drawing Logic
function drawHangman() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Neon Style
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#3b82f6';
    
    // Always draw base structure
    // Base
    ctx.beginPath(); ctx.moveTo(20, 180); ctx.lineTo(120, 180); ctx.stroke();
    // Pole
    ctx.beginPath(); ctx.moveTo(70, 180); ctx.lineTo(70, 20); ctx.stroke();
    // Top
    ctx.beginPath(); ctx.moveTo(70, 20); ctx.lineTo(140, 20); ctx.stroke();
    // Rope
    ctx.beginPath(); ctx.moveTo(140, 20); ctx.lineTo(140, 40); ctx.stroke();
    
    // Draw mistakes
    ctx.strokeStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    
    if (mistakes >= 1) { // Head
        ctx.beginPath(); ctx.arc(140, 55, 15, 0, Math.PI * 2); ctx.stroke();
    }
    if (mistakes >= 2) { // Body
        ctx.beginPath(); ctx.moveTo(140, 70); ctx.lineTo(140, 120); ctx.stroke();
    }
    if (mistakes >= 3) { // Left Arm
        ctx.beginPath(); ctx.moveTo(140, 80); ctx.lineTo(120, 100); ctx.stroke();
    }
    if (mistakes >= 4) { // Right Arm
        ctx.beginPath(); ctx.moveTo(140, 80); ctx.lineTo(160, 100); ctx.stroke();
    }
    if (mistakes >= 5) { // Left Leg
        ctx.beginPath(); ctx.moveTo(140, 120); ctx.lineTo(120, 150); ctx.stroke();
    }
    if (mistakes >= 6) { // Right Leg
        ctx.beginPath(); ctx.moveTo(140, 120); ctx.lineTo(160, 150); ctx.stroke();
        
        // Eyes (X X)
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(133, 50); ctx.lineTo(137, 54); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(137, 50); ctx.lineTo(133, 54); ctx.stroke();
        
        ctx.beginPath(); ctx.moveTo(143, 50); ctx.lineTo(147, 54); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(147, 50); ctx.lineTo(143, 54); ctx.stroke();
    }
}

function handleWin() {
    isGameOver = true;
    streak++;
    if (streak > bestStreak) {
        bestStreak = streak;
        localStorage.setItem('pmg_hangman_best', bestStreak);
    }
    localStorage.setItem('pmg_hangman_streak', streak);
    
    setTimeout(() => showGameOverOverlay("You Won!", true), 500);
}

function handleLoss() {
    isGameOver = true;
    streak = 0;
    localStorage.setItem('pmg_hangman_streak', streak);
    
    // Reveal missing letters in red
    for (let i = 0; i < targetWord.length; i++) {
        if (!guessedLetters.has(targetWord[i])) {
            const box = document.getElementById(`letter-${i}`);
            box.innerText = targetWord[i];
            box.style.color = '#ef4444';
            box.style.borderBottomColor = '#ef4444';
        }
    }
    
    setTimeout(() => showGameOverOverlay("Game Over", false), 1500);
}

function showGameOverOverlay(titleText, won) {
    const titleEl = document.getElementById('overlay-title');
    titleEl.innerText = titleText;
    
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

// Global Keyboard Listener for Desktop
const hiddenInput = document.getElementById('hidden-input');

document.addEventListener('keydown', (e) => {
    if (isGameOver) return;
    if (document.activeElement === hiddenInput) return; // handled by hiddenInput listener
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    
    if (/^[a-zA-Z]$/.test(e.key)) {
        handleGuess(e.key.toUpperCase());
    }
});

// Mobile: tap canvas or hint to open keyboard
document.getElementById('canvas-container').addEventListener('click', () => hiddenInput.focus());
document.getElementById('tap-to-type').addEventListener('click', () => hiddenInput.focus());

hiddenInput.addEventListener('input', (e) => {
    const val = hiddenInput.value.toUpperCase();
    hiddenInput.value = '';
    for (let char of val) {
        if (/^[A-Z]$/.test(char)) handleGuess(char);
    }
});

hiddenInput.addEventListener('keydown', (e) => {
    if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleGuess(e.key.toUpperCase());
    }
});

nextBtn.addEventListener('click', startNewGame);

// Start
startNewGame();
