const cells = [];
const boardElement = document.getElementById('board');
const statusText = document.getElementById('status-text');
const btnPvp = document.getElementById('btn-pvp');
const btnPva = document.getElementById('btn-pva');
const btnRestart = document.getElementById('btn-restart');
const scoreX = document.getElementById('score-x');
const scoreO = document.getElementById('score-o');
const scoreDraw = document.getElementById('score-draw');

let board = Array(9).fill(null);
let currentPlayer = 'X';
let gameActive = true;
let mode = 'pvp'; // 'pvp' or 'pva'
let scores = { X: 0, O: 0, Draw: 0 };

const winConditions = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // cols
    [0,4,8], [2,4,6]           // diagonals
];

// Initialize Board
for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    cell.addEventListener('click', handleCellClick);
    boardElement.appendChild(cell);
    cells.push(cell);
}

function handleCellClick(e) {
    if (!gameActive) return;
    const index = e.target.dataset.index;
    if (board[index] !== null) return;
    
    // In PvA mode, ignore clicks if it's O's turn
    if (mode === 'pva' && currentPlayer === 'O') return;

    makeMove(index, currentPlayer);

    if (gameActive && mode === 'pva' && currentPlayer === 'O') {
        statusText.textContent = "AI is thinking...";
        statusText.style.color = '#888';
        setTimeout(makeAIMove, 400); // Small delay for realism
    }
}

function makeMove(index, player) {
    board[index] = player;
    cells[index].textContent = player;
    cells[index].classList.add(player.toLowerCase());

    if (checkWin(board, player)) {
        gameActive = false;
        statusText.textContent = `Player ${player} Wins!`;
        statusText.style.color = player === 'X' ? '#ef4444' : '#3b82f6';
        scores[player]++;
        updateScoreBoard();
        highlightWin(player);
        return;
    }

    if (board.every(cell => cell !== null)) {
        gameActive = false;
        statusText.textContent = "It's a Draw!";
        statusText.style.color = '#fff';
        scores.Draw++;
        updateScoreBoard();
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatusText();
}

function updateStatusText() {
    statusText.textContent = `Player ${currentPlayer}'s Turn`;
    statusText.style.color = currentPlayer === 'X' ? '#ef4444' : '#3b82f6';
}

function updateScoreBoard() {
    scoreX.textContent = scores.X;
    scoreO.textContent = scores.O;
    scoreDraw.textContent = scores.Draw;
}

function checkWin(b, player) {
    return winConditions.some(combo => {
        return combo.every(idx => b[idx] === player);
    });
}

function highlightWin(player) {
    const combo = winConditions.find(c => c.every(idx => board[idx] === player));
    if (!combo) return;

    combo.forEach(idx => {
        cells[idx].classList.add(`win-hl-${player.toLowerCase()}`);
    });
}

// AI Logic (Minimax)
function makeAIMove() {
    if (!gameActive) return;
    
    // First move optimization (if AI plays first, not currently possible unless AI is X, but let's handle anyway)
    if (board.every(c => c === null)) {
        makeMove(Math.floor(Math.random() * 9), 'O');
        return;
    }

    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = null;
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    // Fallback if minimax fails
    if (bestMove === null) {
        bestMove = board.findIndex(c => c === null);
    }
    
    makeMove(bestMove, 'O');
}

let scoresMap = {
    'O': 10,
    'X': -10,
    'tie': 0
};

function checkWinnerForMinimax(b) {
    for (let combo of winConditions) {
        if (b[combo[0]] !== null && b[combo[0]] === b[combo[1]] && b[combo[1]] === b[combo[2]]) {
            return b[combo[0]];
        }
    }
    if (b.every(c => c !== null)) return 'tie';
    return null;
}

function minimax(b, depth, isMaximizing) {
    let result = checkWinnerForMinimax(b);
    if (result !== null) {
        // adjust score by depth to prefer faster wins / slower losses
        return scoresMap[result] - depth * (isMaximizing ? 1 : -1); 
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] === null) {
                b[i] = 'O';
                let score = minimax(b, depth + 1, false);
                b[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] === null) {
                b[i] = 'X';
                let score = minimax(b, depth + 1, true);
                b[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// Controls
btnPvp.addEventListener('click', () => {
    if (mode === 'pvp') return;
    mode = 'pvp';
    btnPvp.classList.add('active');
    btnPva.classList.remove('active');
    restartGame(true);
});

btnPva.addEventListener('click', () => {
    if (mode === 'pva') return;
    mode = 'pva';
    btnPva.classList.add('active');
    btnPvp.classList.remove('active');
    restartGame(true);
});

btnRestart.addEventListener('click', () => restartGame(false));

function restartGame(resetScores) {
    board.fill(null);
    gameActive = true;
    currentPlayer = 'X';
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });
    updateStatusText();
    
    if (resetScores) {
        scores = { X: 0, O: 0, Draw: 0 };
        updateScoreBoard();
    }
}
