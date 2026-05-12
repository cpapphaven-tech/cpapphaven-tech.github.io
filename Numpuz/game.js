document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const boardEl = document.getElementById('board');
    const movesEl = document.getElementById('moves-count');
    const timerEl = document.getElementById('timer');
    const diffBtns = document.querySelectorAll('.diff-btn');
    const resetBtn = document.getElementById('reset-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const winModal = document.getElementById('win-modal');
    const winMessage = document.getElementById('win-message');
    const playAgainBtn = document.getElementById('play-again-btn');

    // Game State
    let size = 3;
    let tiles = [];
    let tileElements = {};
    let emptyPos = { r: 0, c: 0 };
    let moves = 0;
    let isPlaying = false;
    let timerInterval = null;
    let secondsElapsed = 0;
    let tileSize = 0;
    let boardSize = 0;

    // Initialize Game
    function init() {
        setupEventListeners();
        calculateSizes();
        startNewGame();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            calculateSizes();
            updateTilePositions();
        });
    }

    function setupEventListeners() {
        diffBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                diffBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                size = parseInt(e.target.dataset.size);
                startNewGame();
            });
        });

        resetBtn.addEventListener('click', resetGame);
        newGameBtn.addEventListener('click', startNewGame);
        playAgainBtn.addEventListener('click', () => {
            winModal.classList.remove('active');
            startNewGame();
        });
    }

    function calculateSizes() {
        const padding = 10;
        const maxBoardWidth = Math.min(window.innerWidth - 40, 500 - 40); // 40 is max-width minus padding
        boardSize = maxBoardWidth;
        tileSize = boardSize / size;
        
        boardEl.style.width = `${boardSize}px`;
        boardEl.style.height = `${boardSize}px`;
    }

    function startNewGame() {
        calculateSizes();
        stopTimer();
        moves = 0;
        secondsElapsed = 0;
        updateUI();
        isPlaying = true;
        
        generateSolvedBoard();
        shuffleBoard();
        renderBoard();
        startTimer();
    }

    function resetGame() {
        if (!isPlaying) return;
        moves = 0;
        secondsElapsed = 0;
        updateUI();
        generateSolvedBoard();
        shuffleBoard();
        renderBoard();
    }

    function generateSolvedBoard() {
        tiles = [];
        let num = 1;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (r === size - 1 && c === size - 1) {
                    tiles.push({ val: 0, r, c }); // 0 represents empty tile
                    emptyPos = { r, c };
                } else {
                    tiles.push({ val: num++, r, c });
                }
            }
        }
    }

    function shuffleBoard() {
        // Simple shuffle doesn't guarantee solvability.
        // Better to make random valid moves from solved state.
        const numShuffles = size * size * 20;
        let lastMove = -1;
        
        for (let i = 0; i < numShuffles; i++) {
            const possibleMoves = [];
            const r = emptyPos.r;
            const c = emptyPos.c;
            
            if (r > 0 && lastMove !== 1) possibleMoves.push(0); // Up
            if (r < size - 1 && lastMove !== 0) possibleMoves.push(1); // Down
            if (c > 0 && lastMove !== 3) possibleMoves.push(2); // Left
            if (c < size - 1 && lastMove !== 2) possibleMoves.push(3); // Right
            
            const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            lastMove = move;
            
            let targetR = r;
            let targetC = c;
            
            if (move === 0) targetR = r - 1;
            else if (move === 1) targetR = r + 1;
            else if (move === 2) targetC = c - 1;
            else if (move === 3) targetC = c + 1;
            
            swapTiles(r, c, targetR, targetC, false);
        }
        
        // If it accidentally ended up solved after shuffling, shuffle again
        if (checkWin(false)) {
            shuffleBoard();
        }
    }

    function getTileByPos(r, c) {
        return tiles.find(t => t.r === r && t.c === c);
    }

    function swapTiles(r1, c1, r2, c2, countMove = true) {
        const t1 = getTileByPos(r1, c1);
        const t2 = getTileByPos(r2, c2);
        
        t1.r = r2;
        t1.c = c2;
        t2.r = r1;
        t2.c = c1;
        
        if (t1.val === 0) {
            emptyPos = { r: t1.r, c: t1.c };
        } else if (t2.val === 0) {
            emptyPos = { r: t2.r, c: t2.c };
        }
        
        if (countMove) {
            moves++;
            updateUI();
        }
    }

    function renderBoard() {
        boardEl.innerHTML = '';
        tileElements = {};
        
        // Tile font size calculation
        const fontSize = Math.max(12, Math.floor(tileSize * 0.4));
        
        tiles.forEach(tile => {
            if (tile.val === 0) return; // Don't render empty tile
            
            const tileEl = document.createElement('div');
            tileEl.className = 'tile';
            tileEl.textContent = tile.val;
            tileEl.style.width = `${tileSize - 2}px`;
            tileEl.style.height = `${tileSize - 2}px`;
            tileEl.style.fontSize = `${fontSize}px`;
            
            setPosition(tileEl, tile.r, tile.c);
            
            // Interaction
            tileEl.addEventListener('click', () => handleTileClick(tile));
            
            // Touch support
            tileEl.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent default scroll
                handleTileClick(tile);
            }, {passive: false});
            
            boardEl.appendChild(tileEl);
            tileElements[tile.val] = tileEl;
        });
    }

    function setPosition(el, r, c) {
        el.style.left = `${c * tileSize + 1}px`;
        el.style.top = `${r * tileSize + 1}px`;
    }

    function updateTilePositions() {
        // Tile font size calculation
        const fontSize = Math.max(12, Math.floor(tileSize * 0.4));
        
        tiles.forEach(tile => {
            if (tile.val === 0) return;
            const el = tileElements[tile.val];
            if (el) {
                el.style.width = `${tileSize - 2}px`;
                el.style.height = `${tileSize - 2}px`;
                el.style.fontSize = `${fontSize}px`;
                setPosition(el, tile.r, tile.c);
            }
        });
    }

    function handleTileClick(tile) {
        if (!isPlaying) return;
        
        // Check if tile is adjacent to empty spot
        const isAdjacent = (Math.abs(tile.r - emptyPos.r) === 1 && tile.c === emptyPos.c) ||
                           (Math.abs(tile.c - emptyPos.c) === 1 && tile.r === emptyPos.r);
                           
        if (isAdjacent) {
            swapTiles(tile.r, tile.c, emptyPos.r, emptyPos.c);
            
            // Animate transition
            setPosition(tileElements[tile.val], tile.r, tile.c);
            
            checkWin();
        }
    }

    function checkWin(showModal = true) {
        let isWin = true;
        let num = 1;
        
        // Sort tiles by position to check order
        const sortedTiles = [...tiles].sort((a, b) => {
            if (a.r !== b.r) return a.r - b.r;
            return a.c - b.c;
        });
        
        for (let i = 0; i < sortedTiles.length - 1; i++) {
            if (sortedTiles[i].val !== num++) {
                isWin = false;
                break;
            }
        }
        
        // The last tile must be 0
        if (isWin && sortedTiles[sortedTiles.length - 1].val === 0) {
            if (showModal) {
                isPlaying = false;
                stopTimer();
                setTimeout(() => {
                    winMessage.textContent = `Solved in ${moves} moves and ${formatTime(secondsElapsed)}!`;
                    winModal.classList.add('active');
                }, 300);
            }
            return true;
        }
        return false;
    }

    function startTimer() {
        stopTimer();
        timerInterval = setInterval(() => {
            secondsElapsed++;
            timerEl.textContent = formatTime(secondsElapsed);
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function updateUI() {
        movesEl.textContent = moves;
        timerEl.textContent = formatTime(secondsElapsed);
    }

    // Start
    init();
});
