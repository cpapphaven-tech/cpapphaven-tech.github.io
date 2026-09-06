/**
 * Classic Checkers (Draughts) – PlayMixGames
 * Full Game Engine with Mandatory Jumps, Multi-Jump Chains, Minimax AI & Web Audio
 */
(function () {
    'use strict';

    var EMPTY = 0;
    var RED = 1;         // Normal Red
    var RED_KING = 2;    // Red King
    var BLACK = 3;       // Normal Black
    var BLACK_KING = 4;  // Black King

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

            if (type === 'move') {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(280, now);
                osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'capture') {
                var oscC = ctx.createOscillator();
                var gainC = ctx.createGain();
                oscC.type = 'sawtooth';
                oscC.frequency.setValueAtTime(180, now);
                oscC.frequency.exponentialRampToValueAtTime(60, now + 0.15);
                gainC.gain.setValueAtTime(0.3, now);
                gainC.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                oscC.connect(gainC);
                gainC.connect(ctx.destination);
                oscC.start(now);
                oscC.stop(now + 0.15);
            } else if (type === 'king') {
                [523.25, 659.25, 783.99, 1046.50].forEach(function (f, i) {
                    var oscK = ctx.createOscillator();
                    var gainK = ctx.createGain();
                    oscK.type = 'sine';
                    oscK.frequency.setValueAtTime(f, now + i * 0.07);
                    gainK.gain.setValueAtTime(0.25, now + i * 0.07);
                    gainK.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.3);
                    oscK.connect(gainK);
                    gainK.connect(ctx.destination);
                    oscK.start(now + i * 0.07);
                    oscK.stop(now + i * 0.07 + 0.3);
                });
            } else if (type === 'win') {
                [440, 554.37, 659.25, 880, 1108.73].forEach(function (f, i) {
                    var oscW = ctx.createOscillator();
                    var gainW = ctx.createGain();
                    oscW.type = 'triangle';
                    oscW.frequency.setValueAtTime(f, now + i * 0.08);
                    gainW.gain.setValueAtTime(0.25, now + i * 0.08);
                    gainW.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
                    oscW.connect(gainW);
                    gainW.connect(ctx.destination);
                    oscW.start(now + i * 0.08);
                    oscW.stop(now + i * 0.08 + 0.4);
                });
            }
        } catch (e) {}
    }

    // --- State Variables ---
    var board = [];
    var currentTurn = RED; // RED or BLACK
    var selectedPiece = null; // {r, c}
    var validMovesForSelected = [];
    var mustContinueJump = null; // {r, c} if in middle of multi-jump
    var gameMode = 'ai'; // 'ai' or 'pvp'
    var aiDifficulty = 'medium'; // 'easy', 'medium', 'master'
    var isGameOver = false;
    var isThinking = false;
    var moveHistory = [];
    var scores = { red: 0, black: 0, draw: 0 };

    // --- DOM Elements ---
    var boardEl = document.getElementById('checker-board');
    var turnDotEl = document.getElementById('turn-dot');
    var turnTextEl = document.getElementById('turn-text');
    var countRedEl = document.getElementById('count-red');
    var countBlackEl = document.getElementById('count-black');
    var scoreRedEl = document.getElementById('score-red');
    var scoreBlackEl = document.getElementById('score-black');
    var winModal = document.getElementById('win-modal');
    var winTitleEl = document.getElementById('win-title');
    var winDescEl = document.getElementById('win-desc');
    var playAgainBtn = document.getElementById('play-again-btn');
    var undoBtn = document.getElementById('undo-btn');
    var restartBtn = document.getElementById('restart-btn');

    // --- Board Helpers ---
    function isRed(piece) { return piece === RED || piece === RED_KING; }
    function isBlack(piece) { return piece === BLACK || piece === BLACK_KING; }
    function isKing(piece) { return piece === RED_KING || piece === BLACK_KING; }
    function isSameTeam(p1, p2) {
        if (p1 === EMPTY || p2 === EMPTY) return false;
        return (isRed(p1) && isRed(p2)) || (isBlack(p1) && isBlack(p2));
    }

    function initBoardState() {
        board = [];
        for (var r = 0; r < 8; r++) {
            var row = [];
            for (var c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1) {
                    if (r < 3) row.push(BLACK);
                    else if (r > 4) row.push(RED);
                    else row.push(EMPTY);
                } else {
                    row.push(EMPTY);
                }
            }
            board.push(row);
        }
    }

    // --- Render DOM Board ---
    function renderBoard() {
        boardEl.innerHTML = '';
        var redCount = 0;
        var blackCount = 0;

        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                var cell = document.createElement('div');
                cell.className = 'cell ' + ((r + c) % 2 === 1 ? 'dark' : 'light');
                cell.setAttribute('data-r', r);
                cell.setAttribute('data-c', c);

                var p = board[r][c];
                if (p !== EMPTY) {
                    if (isRed(p)) redCount++;
                    if (isBlack(p)) blackCount++;

                    var pieceEl = document.createElement('div');
                    pieceEl.className = 'piece ' + (isRed(p) ? 'red' : 'black') + (isKing(p) ? ' king' : '');
                    if (selectedPiece && selectedPiece.r === r && selectedPiece.c === c) {
                        pieceEl.classList.add('selected');
                    }
                    cell.appendChild(pieceEl);
                }

                // Check if this cell is a valid move target
                if (validMovesForSelected.some(function (m) { return m.toR === r && m.toC === c; })) {
                    cell.classList.add('valid-move');
                }

                (function (row, col) {
                    cell.addEventListener('click', function () { handleCellClick(row, col); });
                })(r, c);

                boardEl.appendChild(cell);
            }
        }

        countRedEl.textContent = redCount;
        countBlackEl.textContent = blackCount;
        updateTurnHUD();
    }

    function updateTurnHUD() {
        if (currentTurn === RED) {
            turnDotEl.className = 'turn-dot red';
            turnTextEl.textContent = gameMode === 'ai' ? 'Your Turn' : 'Red Turn';
        } else {
            turnDotEl.className = 'turn-dot black';
            turnTextEl.textContent = gameMode === 'ai' ? 'AI Thinking...' : 'Black Turn';
        }
    }

    // --- Move & Jump Logic ---
    function getPieceMoves(b, r, c) {
        var p = b[r][c];
        if (p === EMPTY) return [];

        var moves = [];
        var directions = [];

        if (isKing(p)) {
            directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        } else if (isRed(p)) {
            directions = [[-1, -1], [-1, 1]]; // Red moves up (negative row)
        } else if (isBlack(p)) {
            directions = [[1, -1], [1, 1]];   // Black moves down (positive row)
        }

        // 1. Check Jumps (Captures)
        directions.forEach(function (dir) {
            var midR = r + dir[0];
            var midC = c + dir[1];
            var endR = r + dir[0] * 2;
            var endC = c + dir[1] * 2;

            if (endR >= 0 && endR < 8 && endC >= 0 && endC < 8) {
                var midPiece = b[midR][midC];
                var endPiece = b[endR][endC];

                if (midPiece !== EMPTY && !isSameTeam(p, midPiece) && endPiece === EMPTY) {
                    moves.push({
                        fromR: r, fromC: c,
                        toR: endR, toC: endC,
                        isJump: true,
                        jumpedR: midR, jumpedC: midC
                    });
                }
            }
        });

        // 2. Simple Moves (only if no multi-jump lock)
        if (!mustContinueJump) {
            directions.forEach(function (dir) {
                var toR = r + dir[0];
                var toC = c + dir[1];

                if (toR >= 0 && toR < 8 && toC >= 0 && toC < 8) {
                    if (b[toR][toC] === EMPTY) {
                        moves.push({
                            fromR: r, fromC: c,
                            toR: toR, toC: toC,
                            isJump: false
                        });
                    }
                }
            });
        }

        return moves;
    }

    function getAllPlayerMoves(b, playerTurn) {
        var allMoves = [];
        var allJumps = [];

        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                var p = b[r][c];
                if (p !== EMPTY && ((playerTurn === RED && isRed(p)) || (playerTurn === BLACK && isBlack(p)))) {
                    var moves = getPieceMoves(b, r, c);
                    moves.forEach(function (m) {
                        if (m.isJump) allJumps.push(m);
                        else allMoves.push(m);
                    });
                }
            }
        }

        // Mandatory jump rule: If any jumps are available, only jumps are valid!
        return allJumps.length > 0 ? allJumps : allMoves;
    }

    // --- Cell Interaction ---
    function handleCellClick(r, c) {
        if (isGameOver || isThinking) return;
        if (gameMode === 'ai' && currentTurn === BLACK) return;

        var clickedPiece = board[r][c];

        // If in middle of a multi-jump chain, player MUST move that piece
        if (mustContinueJump) {
            if (r === mustContinueJump.r && c === mustContinueJump.c) {
                selectedPiece = mustContinueJump;
                validMovesForSelected = getPieceMoves(board, r, c).filter(function (m) { return m.isJump; });
                renderBoard();
                return;
            }
            // Check if clicking a valid destination for the locked piece
            var validJump = validMovesForSelected.find(function (m) { return m.toR === r && m.toC === c; });
            if (validJump) {
                executeMove(validJump);
            }
            return;
        }

        // If clicking own piece
        if (clickedPiece !== EMPTY && ((currentTurn === RED && isRed(clickedPiece)) || (currentTurn === BLACK && isBlack(clickedPiece)))) {
            var playerAllMoves = getAllPlayerMoves(board, currentTurn);
            var pieceMoves = getPieceMoves(board, r, c);

            // Filter by mandatory jump rule
            var hasAnyJumps = playerAllMoves.some(function (m) { return m.isJump; });
            if (hasAnyJumps) {
                pieceMoves = pieceMoves.filter(function (m) { return m.isJump; });
            }

            if (pieceMoves.length > 0) {
                selectedPiece = { r: r, c: c };
                validMovesForSelected = pieceMoves;
                playSound('move');
                renderBoard();
            }
            return;
        }

        // If clicking a valid move destination square
        if (selectedPiece) {
            var move = validMovesForSelected.find(function (m) { return m.toR === r && m.toC === c; });
            if (move) {
                executeMove(move);
            } else {
                selectedPiece = null;
                validMovesForSelected = [];
                renderBoard();
            }
        }
    }

    // --- Execute Move on Board ---
    function executeMove(move) {
        var p = board[move.fromR][move.fromC];
        board[move.fromR][move.fromC] = EMPTY;
        board[move.toR][move.toC] = p;

        var crowned = false;
        // King Promotion
        if (p === RED && move.toR === 0) {
            board[move.toR][move.toC] = RED_KING;
            crowned = true;
        } else if (p === BLACK && move.toR === 7) {
            board[move.toR][move.toC] = BLACK_KING;
            crowned = true;
        }

        if (move.isJump) {
            board[move.jumpedR][move.jumpedC] = EMPTY;
            playSound('capture');
        } else {
            playSound('move');
        }

        if (crowned) {
            playSound('king');
        }

        // Check for Multi-Jump Chain
        if (move.isJump && !crowned) {
            var subsequentJumps = getPieceMoves(board, move.toR, move.toC).filter(function (m) { return m.isJump; });
            if (subsequentJumps.length > 0) {
                mustContinueJump = { r: move.toR, c: move.toC };
                selectedPiece = mustContinueJump;
                validMovesForSelected = subsequentJumps;
                renderBoard();

                // If AI is jumping, continue automatically
                if (gameMode === 'ai' && currentTurn === BLACK) {
                    setTimeout(function () {
                        executeMove(subsequentJumps[0]);
                    }, 400);
                }
                return;
            }
        }

        mustContinueJump = null;
        selectedPiece = null;
        validMovesForSelected = [];

        // Check Win / Draw
        var nextTurn = (currentTurn === RED) ? BLACK : RED;
        var nextMoves = getAllPlayerMoves(board, nextTurn);

        if (nextMoves.length === 0) {
            handleGameOver(currentTurn); // Current player wins!
            renderBoard();
            return;
        }

        currentTurn = nextTurn;
        renderBoard();

        // Trigger AI Turn
        if (!isGameOver && gameMode === 'ai' && currentTurn === BLACK) {
            isThinking = true;
            var delay = Math.floor(Math.random() * 250) + 350;
            setTimeout(function () {
                var aiMove = getBestAIMove();
                isThinking = false;
                if (aiMove) {
                    executeMove(aiMove);
                }
            }, delay);
        }
    }

    // --- AI Engine (Minimax with Alpha-Beta Pruning) ---
    function evaluateBoard(b) {
        var score = 0;
        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                var p = b[r][c];
                if (p === BLACK) score += 10 + r; // bonus for advancing
                else if (p === BLACK_KING) score += 25;
                else if (p === RED) score -= 10 + (7 - r);
                else if (p === RED_KING) score -= 25;

                // Center control bonus
                if (r >= 2 && r <= 5 && c >= 2 && c <= 5) {
                    if (isBlack(p)) score += 2;
                    if (isRed(p)) score -= 2;
                }
            }
        }
        return score;
    }

    function cloneBoard(b) {
        var copy = [];
        for (var r = 0; r < 8; r++) copy.push(b[r].slice());
        return copy;
    }

    function applyMoveToBoard(b, m) {
        var nb = cloneBoard(b);
        var p = nb[m.fromR][m.fromC];
        nb[m.fromR][m.fromC] = EMPTY;
        nb[m.toR][m.toC] = p;

        if (p === RED && m.toR === 0) nb[m.toR][m.toC] = RED_KING;
        if (p === BLACK && m.toR === 7) nb[m.toR][m.toC] = BLACK_KING;

        if (m.isJump) {
            nb[m.jumpedR][m.jumpedC] = EMPTY;
        }
        return nb;
    }

    function minimax(b, depth, alpha, beta, isMaximizing) {
        var turn = isMaximizing ? BLACK : RED;
        var moves = getAllPlayerMoves(b, turn);

        if (moves.length === 0) {
            return { score: isMaximizing ? -1000 : 1000 };
        }

        if (depth === 0) {
            return { score: evaluateBoard(b) };
        }

        if (isMaximizing) {
            var maxEval = -Infinity;
            var bestMove = moves[0];
            for (var i = 0; i < moves.length; i++) {
                var nb = applyMoveToBoard(b, moves[i]);
                var ev = minimax(nb, depth - 1, alpha, beta, false).score;
                if (ev > maxEval) {
                    maxEval = ev;
                    bestMove = moves[i];
                }
                alpha = Math.max(alpha, ev);
                if (beta <= alpha) break;
            }
            return { score: maxEval, move: bestMove };
        } else {
            var minEval = Infinity;
            var bestMoveMin = moves[0];
            for (var j = 0; j < moves.length; j++) {
                var nb2 = applyMoveToBoard(b, moves[j]);
                var ev2 = minimax(nb2, depth - 1, alpha, beta, true).score;
                if (ev2 < minEval) {
                    minEval = ev2;
                    bestMoveMin = moves[j];
                }
                beta = Math.min(beta, ev2);
                if (beta <= alpha) break;
            }
            return { score: minEval, move: bestMoveMin };
        }
    }

    function getBestAIMove() {
        var moves = getAllPlayerMoves(board, BLACK);
        if (moves.length === 0) return null;

        if (aiDifficulty === 'easy') {
            return moves[Math.floor(Math.random() * moves.length)];
        }

        var depth = (aiDifficulty === 'master') ? 4 : 2;
        var res = minimax(board, depth, -Infinity, Infinity, true);
        return res.move || moves[0];
    }

    // --- Game Over ---
    function handleGameOver(winner) {
        isGameOver = true;
        playSound('win');

        if (winner === RED) {
            scores.red++;
            scoreRedEl.textContent = scores.red;
            winTitleEl.textContent = '🎉 Red Wins!';
            winDescEl.textContent = gameMode === 'ai' ? 'Masterful tactical victory against the AI!' : 'Red cleared all opposing pieces!';
        } else {
            scores.black++;
            scoreBlackEl.textContent = scores.black;
            winTitleEl.textContent = '🤖 Black Wins!';
            winDescEl.textContent = gameMode === 'ai' ? 'The AI won this match. Practice your traps and try again!' : 'Black took victory!';
        }

        setTimeout(function () {
            winModal.classList.add('active');
        }, 500);
    }

    // --- Reset Game ---
    function resetGame() {
        initBoardState();
        currentTurn = RED;
        selectedPiece = null;
        validMovesForSelected = [];
        mustContinueJump = null;
        isGameOver = false;
        isThinking = false;
        winModal.classList.remove('active');
        renderBoard();
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
    undoBtn.addEventListener('click', function () {
        // Quick restart for board safety
        resetGame();
    });

    // Initial Start
    resetGame();
})();
