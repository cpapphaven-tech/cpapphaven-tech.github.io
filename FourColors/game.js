/**
 * Four Colors: Classic Color Card Game – PlayMixGames
 * 108 Card Deck, 2-4 Players, Action Cards (Skip, Reverse, Draw 2, Wild, Wild +4), Smart AI & 1-Card Alert
 */
(function () {
    'use strict';

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

            if (type === 'card') {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(360, now);
                osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'draw') {
                var oscD = ctx.createOscillator();
                var gainD = ctx.createGain();
                oscD.type = 'sine';
                oscD.frequency.setValueAtTime(420, now);
                oscD.frequency.exponentialRampToValueAtTime(240, now + 0.1);
                gainD.gain.setValueAtTime(0.2, now);
                gainD.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscD.connect(gainD);
                gainD.connect(ctx.destination);
                oscD.start(now);
                oscD.stop(now + 0.1);
            } else if (type === 'action') {
                [440, 659.25, 880].forEach(function (f, i) {
                    var oscA = ctx.createOscillator();
                    var gainA = ctx.createGain();
                    oscA.type = 'sine';
                    oscA.frequency.setValueAtTime(f, now + i * 0.05);
                    gainA.gain.setValueAtTime(0.25, now + i * 0.05);
                    gainA.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.18);
                    oscA.connect(gainA);
                    gainA.connect(ctx.destination);
                    oscA.start(now + i * 0.05);
                    oscA.stop(now + i * 0.05 + 0.18);
                });
            } else if (type === 'wild') {
                [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach(function (f, i) {
                    var oscW = ctx.createOscillator();
                    var gainW = ctx.createGain();
                    oscW.type = 'triangle';
                    oscW.frequency.setValueAtTime(f, now + i * 0.04);
                    gainW.gain.setValueAtTime(0.28, now + i * 0.04);
                    gainW.gain.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.22);
                    oscW.connect(gainW);
                    gainW.connect(ctx.destination);
                    oscW.start(now + i * 0.04);
                    oscW.stop(now + i * 0.04 + 0.22);
                });
            } else if (type === 'onecard') {
                [880, 1174.66].forEach(function (f, i) {
                    var oscO = ctx.createOscillator();
                    var gainO = ctx.createGain();
                    oscO.type = 'square';
                    oscO.frequency.setValueAtTime(f, now + i * 0.08);
                    gainO.gain.setValueAtTime(0.2, now + i * 0.08);
                    gainO.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.25);
                    oscO.connect(gainO);
                    gainO.connect(ctx.destination);
                    oscO.start(now + i * 0.08);
                    oscO.stop(now + i * 0.08 + 0.25);
                });
            } else if (type === 'win') {
                [523.25, 659.25, 783.99, 1046.50].forEach(function (f, i) {
                    var oscWin = ctx.createOscillator();
                    var gainWin = ctx.createGain();
                    oscWin.type = 'sine';
                    oscWin.frequency.setValueAtTime(f, now + i * 0.1);
                    gainWin.gain.setValueAtTime(0.3, now + i * 0.1);
                    gainWin.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
                    oscWin.connect(gainWin);
                    gainWin.connect(ctx.destination);
                    oscWin.start(now + i * 0.1);
                    oscWin.stop(now + i * 0.1 + 0.4);
                });
            } else if (type === 'penalty') {
                var oscP = ctx.createOscillator();
                var gainP = ctx.createGain();
                oscP.type = 'sawtooth';
                oscP.frequency.setValueAtTime(220, now);
                oscP.frequency.exponentialRampToValueAtTime(80, now + 0.3);
                gainP.gain.setValueAtTime(0.3, now);
                gainP.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscP.connect(gainP);
                gainP.connect(ctx.destination);
                oscP.start(now);
                oscP.stop(now + 0.3);
            }
        } catch (e) {}
    }

    // --- State Variables ---
    var COLORS = ['red', 'green', 'blue', 'yellow'];
    var numPlayers = 2; // Default: 2 players
    var players = [];   // Array of card arrays: players[0] = Human, players[1..N-1] = Bots
    var drawDeck = [];
    var discardPile = [];
    var activePlayer = 0;
    var direction = 1; // 1 = Clockwise, -1 = Counter-Clockwise
    var activeColor = null;
    var activeValue = null;
    var isGameOver = false;
    var awaitingWildColor = false;
    var oneCardAlertActive = false;
    var oneCardPenaltyTimeout = null;

    // DOM Elements
    var turnDot = document.getElementById('turn-dot');
    var turnText = document.getElementById('turn-text');
    var dirText = document.getElementById('dir-text');
    var drawDeckSlot = document.getElementById('draw-deck');
    var discardSlot = document.getElementById('discard-card-wrap');
    var activeColorLabel = document.getElementById('active-color-label');
    var playerCardsTray = document.getElementById('player-cards-tray');
    var playerCardCountEl = document.getElementById('player-card-count');
    var hintText = document.getElementById('hint-text');
    var btnOneCard = document.getElementById('btn-one-card');
    var wildModal = document.getElementById('wild-modal');
    var winModal = document.getElementById('win-modal');
    var winTitle = document.getElementById('win-title');
    var winMsg = document.getElementById('win-msg');
    var playAgainBtn = document.getElementById('play-again-btn');

    var badgeBots = [
        document.getElementById('badge-bot1'),
        document.getElementById('badge-bot2'),
        document.getElementById('badge-bot3')
    ];
    var countBots = [
        document.getElementById('count-bot1'),
        document.getElementById('count-bot2'),
        document.getElementById('count-bot3')
    ];

    // --- Build Full 108 Card Deck ---
    function buildDeck() {
        var deck = [];
        var id = 1;

        COLORS.forEach(function (color) {
            // 1 x '0' card
            deck.push({ id: id++, color: color, value: '0', symbol: '0' });

            // 2 of each '1' through '9'
            for (var n = 1; n <= 9; n++) {
                deck.push({ id: id++, color: color, value: String(n), symbol: String(n) });
                deck.push({ id: id++, color: color, value: String(n), symbol: String(n) });
            }

            // 2 x Action Cards per color
            for (var a = 0; a < 2; a++) {
                deck.push({ id: id++, color: color, value: 'skip', symbol: '🚫' });
                deck.push({ id: id++, color: color, value: 'reverse', symbol: '🔄' });
                deck.push({ id: id++, color: color, value: 'draw2', symbol: '+2' });
            }
        });

        // 4 x Wild Cards & 4 x Wild Draw 4
        for (var w = 0; w < 4; w++) {
            deck.push({ id: id++, color: 'wild', value: 'wild', symbol: '🌈' });
            deck.push({ id: id++, color: 'wild', value: 'wild4', symbol: '+4' });
        }

        // Shuffle deck (Fisher-Yates)
        for (var i = deck.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = deck[i];
            deck[i] = deck[j];
            deck[j] = temp;
        }

        return deck;
    }

    // --- Start / Reset Game ---
    function initGame() {
        isGameOver = false;
        awaitingWildColor = false;
        oneCardAlertActive = false;
        if (oneCardPenaltyTimeout) clearTimeout(oneCardPenaltyTimeout);
        btnOneCard.classList.remove('visible');
        wildModal.classList.remove('active');
        winModal.classList.remove('active');

        drawDeck = buildDeck();
        discardPile = [];
        players = [];
        direction = 1;
        activePlayer = 0; // Human starts

        // Setup players & deal 7 cards
        for (var p = 0; p < numPlayers; p++) {
            players.push([]);
            for (var c = 0; c < 7; c++) {
                players[p].push(drawDeck.pop());
            }
        }

        // Flip starting discard card (must be a number card)
        var startCard = drawDeck.pop();
        while (startCard.color === 'wild' || startCard.value === 'skip' || startCard.value === 'reverse' || startCard.value === 'draw2') {
            drawDeck.unshift(startCard);
            startCard = drawDeck.pop();
        }
        discardPile.push(startCard);
        activeColor = startCard.color;
        activeValue = startCard.value;

        updateBotBadgesVisibility();
        updateUI();
        playSound('card');
    }

    function updateBotBadgesVisibility() {
        badgeBots.forEach(function (badge, idx) {
            if (idx + 1 < numPlayers) {
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    // --- Draw Card Helper ---
    function drawCardForPlayer(playerIdx, count) {
        count = count || 1;
        for (var i = 0; i < count; i++) {
            if (drawDeck.length === 0) {
                reshuffleDeck();
            }
            if (drawDeck.length > 0) {
                players[playerIdx].push(drawDeck.pop());
            }
        }
    }

    function reshuffleDeck() {
        if (discardPile.length <= 1) return;
        var topCard = discardPile.pop();
        drawDeck = discardPile;
        discardPile = [topCard];

        for (var i = drawDeck.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = drawDeck[i];
            drawDeck[i] = drawDeck[j];
            drawDeck[j] = t;
        }
    }

    // --- Is Card Playable? ---
    function isCardPlayable(card) {
        if (card.color === 'wild') return true;
        if (card.color === activeColor) return true;
        if (card.value === activeValue) return true;
        return false;
    }

    // --- Play a Card ---
    function playCard(playerIdx, cardIndex, chosenWildColor) {
        if (isGameOver) return;
        var card = players[playerIdx].splice(cardIndex, 1)[0];
        discardPile.push(card);

        // Check 1-Card Alert Condition
        if (players[playerIdx].length === 1) {
            if (playerIdx === 0) {
                oneCardAlertActive = true;
                btnOneCard.classList.add('visible');
                playSound('onecard');

                oneCardPenaltyTimeout = setTimeout(function () {
                    if (oneCardAlertActive) {
                        oneCardAlertActive = false;
                        btnOneCard.classList.remove('visible');
                        drawCardForPlayer(0, 2);
                        playSound('penalty');
                        hintText.textContent = '⚠️ Missed 1-CARD! +2 penalty cards added!';
                        updateUI();
                    }
                }, 3000);
            } else {
                playSound('onecard');
            }
        }

        // Win Condition Check
        if (players[playerIdx].length === 0) {
            handleWin(playerIdx);
            return;
        }

        // Handle Card Action Effects
        if (card.color === 'wild') {
            playSound('wild');
            activeValue = card.value;

            if (playerIdx === 0 && !chosenWildColor) {
                awaitingWildColor = { card: card, playerIdx: playerIdx };
                wildModal.classList.add('active');
                return;
            } else {
                activeColor = chosenWildColor || chooseBotWildColor(playerIdx);
                if (card.value === 'wild4') {
                    var victim = getNextPlayerIndex();
                    drawCardForPlayer(victim, 4);
                    activePlayer = victim;
                }
            }
        } else {
            playSound('card');
            activeColor = card.color;
            activeValue = card.value;

            if (card.value === 'skip') {
                playSound('action');
                var skippedPlayer = getNextPlayerIndex();
                activePlayer = skippedPlayer;
            } else if (card.value === 'reverse') {
                playSound('action');
                if (numPlayers === 2) {
                    activePlayer = getNextPlayerIndex();
                } else {
                    direction *= -1;
                }
            } else if (card.value === 'draw2') {
                playSound('action');
                var dVictim = getNextPlayerIndex();
                drawCardForPlayer(dVictim, 2);
                activePlayer = dVictim;
            }
        }

        advanceTurn();
    }

    function getNextPlayerIndex() {
        var next = (activePlayer + direction) % numPlayers;
        if (next < 0) next += numPlayers;
        return next;
    }

    function advanceTurn() {
        activePlayer = getNextPlayerIndex();
        updateUI();

        if (activePlayer !== 0 && !isGameOver) {
            setTimeout(botTurn, 750 + Math.random() * 450);
        }
    }

    // --- Smart AI Bot Turn ---
    function botTurn() {
        if (isGameOver || activePlayer === 0) return;
        var botHand = players[activePlayer];

        var validIndices = [];
        for (var i = 0; i < botHand.length; i++) {
            if (isCardPlayable(botHand[i])) {
                validIndices.push(i);
            }
        }

        if (validIndices.length > 0) {
            var chosenIndex = validIndices[0];
            for (var v = 0; v < validIndices.length; v++) {
                var c = botHand[validIndices[v]];
                if (c.value === 'draw2' || c.value === 'skip' || c.value === 'reverse') {
                    chosenIndex = validIndices[v];
                    break;
                }
            }

            var chosenCard = botHand[chosenIndex];
            if (chosenCard.color === 'wild') {
                var chosenColor = chooseBotWildColor(activePlayer);
                playCard(activePlayer, chosenIndex, chosenColor);
            } else {
                playCard(activePlayer, chosenIndex);
            }
        } else {
            drawCardForPlayer(activePlayer, 1);
            playSound('draw');

            var drawnCard = botHand[botHand.length - 1];
            if (isCardPlayable(drawnCard)) {
                setTimeout(function () {
                    if (drawnCard.color === 'wild') {
                        playCard(activePlayer, botHand.length - 1, chooseBotWildColor(activePlayer));
                    } else {
                        playCard(activePlayer, botHand.length - 1);
                    }
                }, 400);
            } else {
                advanceTurn();
            }
        }
    }

    function chooseBotWildColor(playerIdx) {
        var counts = { red: 0, green: 0, blue: 0, yellow: 0 };
        players[playerIdx].forEach(function (card) {
            if (counts[card.color] !== undefined) counts[card.color]++;
        });
        var bestColor = 'red';
        var maxCount = -1;
        COLORS.forEach(function (col) {
            if (counts[col] > maxCount) {
                maxCount = counts[col];
                bestColor = col;
            }
        });
        return bestColor;
    }

    // --- Human Player Interaction ---
    function onPlayerCardClick(cardIndex) {
        if (isGameOver || activePlayer !== 0 || awaitingWildColor) return;
        var card = players[0][cardIndex];

        if (isCardPlayable(card)) {
            playCard(0, cardIndex);
        } else {
            playSound('penalty');
            hintText.textContent = '❌ That card does not match active color or number!';
            setTimeout(function () {
                hintText.textContent = 'Tap any glowing card to play';
            }, 1800);
        }
    }

    drawDeckSlot.addEventListener('click', function () {
        if (isGameOver || activePlayer !== 0 || awaitingWildColor) return;

        drawCardForPlayer(0, 1);
        playSound('draw');
        updateUI();

        var drawnCard = players[0][players[0].length - 1];
        if (isCardPlayable(drawnCard)) {
            hintText.textContent = '✨ Drawn card is playable! Tap it to play or pass turn.';
        } else {
            advanceTurn();
        }
    });

    btnOneCard.addEventListener('click', function () {
        if (oneCardAlertActive) {
            oneCardAlertActive = false;
            if (oneCardPenaltyTimeout) clearTimeout(oneCardPenaltyTimeout);
            btnOneCard.classList.remove('visible');
            playSound('onecard');
            hintText.textContent = '⚡ 1-CARD successfully called! Run to victory!';
        }
    });

    document.querySelectorAll('.color-choice-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (!awaitingWildColor) return;
            var chosenCol = btn.getAttribute('data-color');
            wildModal.classList.remove('active');
            activeColor = chosenCol;

            var card = awaitingWildColor.card;
            awaitingWildColor = false;

            if (card.value === 'wild4') {
                var victim = getNextPlayerIndex();
                drawCardForPlayer(victim, 4);
                activePlayer = victim;
            }

            advanceTurn();
        });
    });

    // --- UI Update & Card Rendering ---
    function updateUI() {
        if (activePlayer === 0) {
            turnDot.style.background = '#10b981';
            turnDot.style.boxShadow = '0 0 8px #10b981';
            turnText.textContent = 'Your Turn';
            hintText.textContent = 'Tap any glowing card to play';
        } else {
            turnDot.style.background = '#f59e0b';
            turnDot.style.boxShadow = '0 0 8px #f59e0b';
            turnText.textContent = 'Bot ' + activePlayer + ' is Thinking...';
            hintText.textContent = 'Waiting for opponent move...';
        }

        dirText.textContent = (direction === 1) ? '↻ Clockwise' : '↺ Counter-Clockwise';

        badgeBots.forEach(function (badge, idx) {
            var botIdx = idx + 1;
            if (botIdx < numPlayers) {
                countBots[idx].textContent = players[botIdx].length + ' Cards';
                if (activePlayer === botIdx) {
                    badge.classList.add('active-turn');
                } else {
                    badge.classList.remove('active-turn');
                }
            }
        });

        var topCard = discardPile[discardPile.length - 1];
        if (topCard) {
            discardSlot.innerHTML = renderCardHTML(topCard, activeColor);
            activeColorLabel.textContent = 'Active: ' + (activeColor ? activeColor.toUpperCase() : 'WILD');
            activeColorLabel.style.color = getColorHex(activeColor);
        }

        playerCardCountEl.textContent = players[0].length;
        playerCardsTray.innerHTML = '';

        var hasPlayable = false;
        players[0].forEach(function (card, index) {
            var playable = (activePlayer === 0) && isCardPlayable(card);
            if (playable) hasPlayable = true;

            var cardEl = document.createElement('div');
            cardEl.className = 'card-item ' + card.color + (playable ? ' playable' : '');
            cardEl.innerHTML = '<div class="card-corner-top">' + card.symbol + '</div>' +
                               '<div class="card-center-oval">' + card.symbol + '</div>' +
                               '<div class="card-corner-bottom">' + card.symbol + '</div>';
            cardEl.addEventListener('click', function () {
                onPlayerCardClick(index);
            });
            playerCardsTray.appendChild(cardEl);
        });

        if (activePlayer === 0 && !hasPlayable) {
            drawDeckSlot.classList.add('must-draw');
            hintText.textContent = 'No playable cards! Tap the Draw Deck to draw.';
        } else {
            drawDeckSlot.classList.remove('must-draw');
        }
    }

    function renderCardHTML(card, overrideColor) {
        var col = overrideColor || card.color;
        return '<div class="card-item ' + col + '">' +
               '<div class="card-corner-top">' + card.symbol + '</div>' +
               '<div class="card-center-oval">' + card.symbol + '</div>' +
               '<div class="card-corner-bottom">' + card.symbol + '</div>' +
               '</div>';
    }

    function getColorHex(col) {
        if (col === 'red') return '#ef4444';
        if (col === 'green') return '#10b981';
        if (col === 'blue') return '#3b82f6';
        if (col === 'yellow') return '#facc15';
        return '#8b5cf6';
    }

    function handleWin(winnerIdx) {
        isGameOver = true;
        btnOneCard.classList.remove('visible');

        if (winnerIdx === 0) {
            playSound('win');
            winTitle.textContent = '🎉 YOU WON!';
            winTitle.style.color = '#10b981';
            winMsg.textContent = 'Outstanding card strategy! You emptied your hand before all opponents.';
        } else {
            playSound('penalty');
            winTitle.textContent = '💥 BOT ' + winnerIdx + ' WON!';
            winTitle.style.color = '#ef4444';
            winMsg.textContent = 'Bot ' + winnerIdx + ' emptied their hand first! Practice your action card timing to win the next match.';
        }

        setTimeout(function () {
            winModal.classList.add('active');
        }, 500);
    }

    document.querySelectorAll('.mode-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.mode-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            numPlayers = parseInt(btn.getAttribute('data-players'), 10);
            initGame();
        });
    });

    playAgainBtn.addEventListener('click', initGame);

    initGame();
})();
