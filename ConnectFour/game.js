/**
 * Connect Four (4 in a Row) – PlayMixGames
 * Full Game Engine with Minimax AI, 2-Player Mode, Web Audio FX & Animations
 */
(function () {
    'use strict';

    var ROWS = 6;
    var COLS = 7;
    var EMPTY = 0;
    var RED = 1;      // Human (P1)
    var YELLOW = 2;   // AI / P2

    // --- Web Audio Synthesizer ---
    var audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function playSound(type) {
        try {
            var ctx = getAudioCtx();
            if (!ctx) return;
            var now = ctx.currentTime;

            if (type === 'drop') {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'win') {
                [523.25, 659.25, 783.99, 1046.50].forEach(function (f, i) {
                    var oscW = ctx.createOscillator();
                    var gainW = ctx.createGain();
                    oscW.type = 'triangle';
                    oscW.frequency.setValueAtTime(f, now + i * 0.08);
                    gainW.gain.setValueAtTime(0.22, now + i * 0.08);
                    gainW.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.35);
                    oscW.connect(gainW);
                    gainW.connect(ctx.destination);
                    oscW.start(now + i * 0.08);
                    oscW.stop(now + i * 0.08 + 0.35);
                });
            } else if (type === 'draw') {
                var oscD = ctx.createOscillator();
                var gainD = ctx.createGain();
                oscD.type = 'sawtooth';
                oscD.frequency.setValueAtTime(260, now);
                oscD.frequency.linearRampToValueAtTime(180, now + 0.3);
                gainD.gain.setValueAtTime(0.18, now);
                gainD.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscD.connect(gainD);
                gainD.connect(ctx.destination);
                oscD.start(now);
                oscD.stop(now + 0.3);
            }
        } catch (e) {
            // Audio ignore
        }
    }

    // --- State Variables ---
    var grid = [];
    var currentPlayer = RED;
    var gameMode = 'ai'; // 'ai' or 'pvp'
    var aiDifficulty = 'medium'; // 'easy', 'medium', 'master'
    var isGameOver = false;
    var isThinking = false;
    var moveHistory = [];
    var scores = { red: 0, yellow: 0, draw: 0 };

    // --- DOM Elements ---
    var boardEl = document.getElementById('connect-board');
    var guideRowEl = document.getElementById('drop-guide-row');
    var turnDotEl = document.getElementById('turn-dot');
    var turnTextEl = document.getElementById('turn-text');
    var scoreRedEl = document.getElementById('score-red');
    var scoreYellowEl = document.getElementById('score-yellow');
    var scoreDrawEl = document.getElementById('score-draw');
    var winModal = document.getElementById('win-modal');
    var winTitleEl = document.getElementById('win-title');
    var winDescEl = document.getElementById('win-desc');
    var playAgainBtn = document.getElementById('play-again-btn');
    var undoBtn = document.getElementById('undo-btn');
    var restartBtn = document.getElementById('restart-btn');

    // --- Board Matrix Init ---
    function initGrid() {
        grid = [];
        for (var r = 0; r < ROWS; r++) {
            var row = [];
            for (var c = 0; c < COLS; c++) {
                row.push(EMPTY);
            }
            grid.push(row);
        }
    }

    // --- Render Board DOM ---
    function createBoardDOM() {
        boardEl.innerHTML = '';
        guideRowEl.innerHTML = '';

        // Guide Row
        for (var col = 0; col < COLS; col++) {
            var guideCell = document.createElement('div');
            guideCell.className = 'drop-arrow-cell';
            guideCell.setAttribute('data-col', col);

            var ind = document.createElement('div');
            ind.className = 'drop-indicator-disc red';
            guideCell.appendChild(ind);

            (function (c) {
                guideCell.addEventListener('click', function () { handleColumnDrop(c); });
                guideCell.addEventListener('mouseenter', function () { updateGuideIndicators(c); });
            })(col);

            guideRowEl.appendChild(guideCell);
        }

        // 7x6 Slots
        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
                var slot = document.createElement('div');
                slot.className = 'slot';
                slot.setAttribute('data-row', r);
                slot.setAttribute('data-col', c);

                (function (colIdx) {
                    slot.addEventListener('click', function () { handleColumnDrop(colIdx); });
                    slot.addEventListener('mouseenter', function () { updateGuideIndicators(colIdx); });
                })(c);

                boardEl.appendChild(slot);
            }
        }
    }

    function updateGuideIndicators(hoverCol) {
        var guides = guideRowEl.querySelectorAll('.drop-indicator-disc');
        guides.forEach(function (g, idx) {
            if (idx === hoverCol) {
                g.className = 'drop-indicator-disc ' + (currentPlayer === RED ? 'red' : 'yellow');
                g.style.opacity = '0.9';
                g.style.transform = 'translateY(0)';
            } else {
                g.style.opacity = '0';
                g.style.transform = 'translateY(-8px)';
            }
        });
    }

    function updateTurnHUD() {
        if (currentPlayer === RED) {
            turnDotEl.className = 'turn-dot red';
            turnTextEl.textContent = gameMode === 'ai' ? 'Your Turn' : 'Red Player';
        } else {
            turnDotEl.className = 'turn-dot yellow';
            turnTextEl.textContent = gameMode === 'ai' ? 'AI Thinking...' : 'Yellow Player';
        }
        updateGuideIndicators(-1);
    }

    function getLowestEmptyRow(col) {
        for (var r = ROWS - 1; r >= 0; r--) {
            if (grid[r][col] === EMPTY) return r;
        }
        return -1;
    }

    function handleColumnDrop(col) {
        if (isGameOver || isThinking) return;
        if (gameMode === 'ai' && currentPlayer === YELLOW) return;

        var row = getLowestEmptyRow(col);
        if (row === -1) return; // Column full

        makeMove(row, col, currentPlayer);
    }

    function makeMove(row, col, player) {
        grid[row][col] = player;
        moveHistory.push({ row: row, col: col, player: player });

        playSound('drop');

        // Render Disc in Slot
        var slotIndex = row * COLS + col;
        var slot = boardEl.children[slotIndex];
        var disc = document.createElement('div');
        disc.className = 'disc ' + (player === RED ? 'red' : 'yellow');
        slot.appendChild(disc);

        var winInfo = checkWin(grid);
        if (winInfo) {
            handleGameOver(winInfo.winner, winInfo.winningCells);
            return;
        }

        if (checkDraw(grid)) {
            handleGameOver(0, []);
            return;
        }

        // Switch Turn
        currentPlayer = (currentPlayer === RED) ? YELLOW : RED;
        updateTurnHUD();

        if (!isGameOver && gameMode === 'ai' && currentPlayer === YELLOW) {
            isThinking = true;
            var delay = Math.floor(Math.random() * 200) + 300;
            setTimeout(function () {
                var aiCol = getBestAIMove();
                isThinking = false;
                if (aiCol !== -1) {
                    var aiRow = getLowestEmptyRow(aiCol);
                    if (aiRow !== -1) {
                        makeMove(aiRow, aiCol, YELLOW);
                    }
                }
            }, delay);
        }
    }

    // --- Win Detection ---
    function checkWin(board) {
        // Horizontal
        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS - 3; c++) {
                var p = board[r][c];
                if (p !== EMPTY && p === board[r][c+1] && p === board[r][c+2] && p === board[r][c+3]) {
                    return { winner: p, winningCells: [[r, c], [r, c+1], [r, c+2], [r, c+3]] };
                }
            }
        }

        // Vertical
        for (var c = 0; c < COLS; c++) {
            for (var r = 0; r < ROWS - 3; r++) {
                var p = board[r][c];
                if (p !== EMPTY && p === board[r+1][c] && p === board[r+2][c] && p === board[r+3][c]) {
                    return { winner: p, winningCells: [[r, c], [r+1, c], [r+2, c], [r+3, c]] };
                }
            }
        }

        // Diagonal (Down-Right)
        for (var r = 0; r < ROWS - 3; r++) {
            for (var c = 0; c < COLS - 3; c++) {
                var p = board[r][c];
                if (p !== EMPTY && p === board[r+1][c+1] && p === board[r+2][c+2] && p === board[r+3][c+3]) {
                    return { winner: p, winningCells: [[r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]] };
                }
            }
        }

        // Diagonal (Up-Right)
        for (var r = 3; r < ROWS; r++) {
            for (var c = 0; c < COLS - 3; c++) {
                var p = board[r][c];
                if (p !== EMPTY && p === board[r-1][c+1] && p === board[r-2][c+2] && p === board[r-3][c+3]) {
                    return { winner: p, winningCells: [[r, c], [r-1, c+1], [r-2, c+2], [r-3, c+3]] };
                }
            }
        }

        return null;
    }

    function checkDraw(board) {
        for (var c = 0; c < COLS; c++) {
            if (board[0][c] === EMPTY) return false;
        }
        return true;
    }

    function handleGameOver(winner, winningCells) {
        isGameOver = true;

        if (winner !== 0) {
            playSound('win');
            winningCells.forEach(function (coord) {
                var slotIdx = coord[0] * COLS + coord[1];
                var d = boardEl.children[slotIdx].querySelector('.disc');
                if (d) d.classList.add('winner');
            });

            if (winner === RED) {
                scores.red++;
                scoreRedEl.textContent = scores.red;
                winTitleEl.textContent = '🎉 Red Wins!';
                winDescEl.textContent = gameMode === 'ai' ? 'Outstanding strategy! You defeated the AI.' : 'Red connected 4 in a row!';
            } else {
                scores.yellow++;
                scoreYellowEl.textContent = scores.yellow;
                winTitleEl.textContent = '🤖 Yellow Wins!';
                winDescEl.textContent = gameMode === 'ai' ? 'The AI outplayed you this round. Try again!' : 'Yellow connected 4 in a row!';
            }
        } else {
            playSound('draw');
            scores.draw++;
            scoreDrawEl.textContent = scores.draw;
            winTitleEl.textContent = '🤝 Game Draw!';
            winDescEl.textContent = 'The board is completely full with no winner.';
        }

        setTimeout(function () {
            winModal.classList.add('active');
        }, 600);
    }

    // --- AI Engine (Minimax with Alpha-Beta Pruning) ---
    function getValidColumns(board) {
        var cols = [];
        // Center-out heuristic order: 3, 2, 4, 1, 5, 0, 6
        var order = [3, 2, 4, 1, 5, 0, 6];
        order.forEach(function (c) {
            if (board[0][c] === EMPTY) cols.push(c);
        });
        return cols;
    }

    function evaluateWindow(w, player) {
        var score = 0;
        var opp = (player === RED) ? YELLOW : RED;

        var pCount = 0, eCount = 0, oppCount = 0;
        for (var i = 0; i < 4; i++) {
            if (w[i] === player) pCount++;
            else if (w[i] === EMPTY) eCount++;
            else if (w[i] === opp) oppCount++;
        }

        if (pCount === 4) score += 1000;
        else if (pCount === 3 && eCount === 1) score += 12;
        else if (pCount === 2 && eCount === 2) score += 4;

        if (oppCount === 3 && eCount === 1) score -= 80;

        return score;
    }

    function scoreBoard(board, player) {
        var totalScore = 0;

        // Center Column Weight
        var centerColCount = 0;
        for (var r = 0; r < ROWS; r++) {
            if (board[r][3] === player) centerColCount++;
        }
        totalScore += centerColCount * 6;

        // Horizontal
        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS - 3; c++) {
                var w = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]];
                totalScore += evaluateWindow(w, player);
            }
        }

        // Vertical
        for (var c = 0; c < COLS; c++) {
            for (var r = 0; r < ROWS - 3; r++) {
                var w = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]];
                totalScore += evaluateWindow(w, player);
            }
        }

        // Diagonals
        for (var r = 0; r < ROWS - 3; r++) {
            for (var c = 0; c < COLS - 3; c++) {
                var w = [board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]];
                totalScore += evaluateWindow(w, player);
            }
        }
        for (var r = 3; r < ROWS; r++) {
            for (var c = 0; c < COLS - 3; c++) {
                var w = [board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]];
                totalScore += evaluateWindow(w, player);
            }
        }

        return totalScore;
    }

    function minimax(board, depth, alpha, beta, isMaximizing) {
        var win = checkWin(board);
        if (win) {
            if (win.winner === YELLOW) return { score: 10000 + depth };
            if (win.winner === RED) return { score: -10000 - depth };
        }
        if (checkDraw(board) || depth === 0) {
            return { score: scoreBoard(board, YELLOW) };
        }

        var validCols = getValidColumns(board);

        if (isMaximizing) {
            var maxEval = -Infinity;
            var bestCol = validCols[0];
            for (var i = 0; i < validCols.length; i++) {
                var c = validCols[i];
                var r = getLowestEmptyRowInBoard(board, c);
                board[r][c] = YELLOW;
                var ev = minimax(board, depth - 1, alpha, beta, false).score;
                board[r][c] = EMPTY;
                if (ev > maxEval) {
                    maxEval = ev;
                    bestCol = c;
                }
                alpha = Math.max(alpha, ev);
                if (beta <= alpha) break;
            }
            return { score: maxEval, col: bestCol };
        } else {
            var minEval = Infinity;
            var bestColMin = validCols[0];
            for (var j = 0; j < validCols.length; j++) {
                var c2 = validCols[j];
                var r2 = getLowestEmptyRowInBoard(board, c2);
                board[r2][c2] = RED;
                var ev2 = minimax(board, depth - 1, alpha, beta, true).score;
                board[r2][c2] = EMPTY;
                if (ev2 < minEval) {
                    minEval = ev2;
                    bestColMin = c2;
                }
                beta = Math.min(beta, ev2);
                if (beta <= alpha) break;
            }
            return { score: minEval, col: bestColMin };
        }
    }

    function getLowestEmptyRowInBoard(b, col) {
        for (var r = ROWS - 1; r >= 0; r--) {
            if (b[r][col] === EMPTY) return r;
        }
        return -1;
    }

    function getBestAIMove() {
        var valid = getValidColumns(grid);
        if (valid.length === 0) return -1;

        // 1. Immediate Win check
        for (var i = 0; i < valid.length; i++) {
            var c = valid[i];
            var r = getLowestEmptyRow(c);
            grid[r][c] = YELLOW;
            var w = checkWin(grid);
            grid[r][c] = EMPTY;
            if (w && w.winner === YELLOW) return c;
        }

        // 2. Immediate Block check
        for (var j = 0; j < valid.length; j++) {
            var c2 = valid[j];
            var r2 = getLowestEmptyRow(c2);
            grid[r2][c2] = RED;
            var w2 = checkWin(grid);
            grid[r2][c2] = EMPTY;
            if (w2 && w2.winner === RED) return c2;
        }

        if (aiDifficulty === 'easy') {
            return valid[Math.floor(Math.random() * valid.length)];
        }

        var depth = (aiDifficulty === 'master') ? 5 : 3;
        var res = minimax(grid, depth, -Infinity, Infinity, true);
        return (res.col !== undefined) ? res.col : valid[0];
    }

    // --- Undo Move ---
    function undoMove() {
        if (isGameOver || isThinking || moveHistory.length === 0) return;

        var movesToRevert = (gameMode === 'ai') ? 2 : 1;
        while (movesToRevert > 0 && moveHistory.length > 0) {
            var last = moveHistory.pop();
            grid[last.row][last.col] = EMPTY;
            var slotIdx = last.row * COLS + last.col;
            boardEl.children[slotIdx].innerHTML = '';
            movesToRevert--;
        }

        currentPlayer = RED;
        isGameOver = false;
        updateTurnHUD();
    }

    // --- Restart Game ---
    function resetGame() {
        initGrid();
        createBoardDOM();
        currentPlayer = RED;
        isGameOver = false;
        isThinking = false;
        moveHistory = [];
        winModal.classList.remove('active');
        updateTurnHUD();
    }

    // --- Event Listeners ---
    document.querySelectorAll('.mode-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.mode-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            gameMode = btn.getAttribute('data-mode');
            resetGame();
        });
    });

    document.querySelectorAll('.diff-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.diff-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            aiDifficulty = btn.getAttribute('data-diff');
            resetGame();
        });
    });

    playAgainBtn.addEventListener('click', resetGame);
    restartBtn.addEventListener('click', resetGame);
    undoBtn.addEventListener('click', undoMove);

    // Initial Start
    resetGame();
})();
