/**
 * Memory Card Match – PlayMixGames
 * Modern 3D Flip Card Match Engine with Web Audio Sound FX, Streaks & Responsive Grid
 */
(function () {
    'use strict';

    // --- Web Audio Sound FX Engine ---
    var audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playSound(type) {
        try {
            var ctx = getAudioContext();
            if (!ctx) return;
            var now = ctx.currentTime;

            if (type === 'flip') {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'match') {
                [523.25, 659.25, 783.99, 1046.50].forEach(function (freq, i) {
                    var osc = ctx.createOscillator();
                    var gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + i * 0.06);
                    gain.gain.setValueAtTime(0.2, now + i * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.25);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.06);
                    osc.stop(now + i * 0.06 + 0.25);
                });
            } else if (type === 'mismatch') {
                var oscM = ctx.createOscillator();
                var gainM = ctx.createGain();
                oscM.type = 'sawtooth';
                oscM.frequency.setValueAtTime(220, now);
                oscM.frequency.linearRampToValueAtTime(140, now + 0.18);
                gainM.gain.setValueAtTime(0.15, now);
                gainM.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                oscM.connect(gainM);
                gainM.connect(ctx.destination);
                oscM.start(now);
                oscM.stop(now + 0.18);
            } else if (type === 'win') {
                [440, 554.37, 659.25, 880, 1108.73].forEach(function (f, idx) {
                    var oscW = ctx.createOscillator();
                    var gainW = ctx.createGain();
                    oscW.type = 'sine';
                    oscW.frequency.setValueAtTime(f, now + idx * 0.1);
                    gainW.gain.setValueAtTime(0.25, now + idx * 0.1);
                    gainW.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.4);
                    oscW.connect(gainW);
                    gainW.connect(ctx.destination);
                    oscW.start(now + idx * 0.1);
                    oscW.stop(now + idx * 0.1 + 0.4);
                });
            }
        } catch (e) {
            // Audio error gracefully ignored
        }
    }

    // --- Emoji Symbol Themes ---
    var THEMES = {
        animals: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐸','🐵','🦄','🐙','🦋','🐢','🦀','🐳','🦓','🦒','🦘','🦥'],
        fruits:  ['🍎','🍊','🍋','🍇','🍓','🍒','🍑','🥭','🍍','🥝','🍌','🍉','🍈','🍐','🫐','🥑','🍆','🌽','🌶️','🥦','🍄','🥜','🥥','🥞'],
        sports:  ['⚽','🏀','🏈','⚾','🎾','🏐','🎱','🏓','🏸','🥊','🥋','🎯','🎳','🎮','🕹️','🎲','♟️','🎿','🛹','🏹','🚴','🏄','🏊','🏆'],
        nature:  ['🌸','🌺','🌻','🌹','🌷','🌼','💐','🍀','🌿','🌱','🌲','🌳','🌴','🌵','🌾','🍃','🍂','🍁','🌊','⭐','🌙','☀️','🌈','⚡']
    };

    var DIFFICULTIES = {
        easy:   { cols: 4, pairs: 8,  time: 100 },
        medium: { cols: 4, pairs: 10, time: 140 },
        hard:   { cols: 5, pairs: 15, time: 180 },
        expert: { cols: 6, pairs: 18, time: 240 }
    };

    // --- Game Variables ---
    var currentDiff  = 'easy';
    var currentTheme = 'animals';
    var cards        = [];
    var flippedCards = [];
    var matchedCount = 0;
    var moves        = 0;
    var combo        = 0;
    var maxCombo     = 0;
    var timerVal     = 0;
    var timerTimer   = null;
    var isPlaying    = false;
    var isLocked     = false;

    // --- DOM Elements ---
    var boardEl       = document.getElementById('board');
    var movesEl       = document.getElementById('moves-val');
    var timerEl       = document.getElementById('timer-val');
    var pairsEl       = document.getElementById('pairs-val');
    var comboEl       = document.getElementById('combo-banner');
    var winModal      = document.getElementById('win-modal');
    var loseModal     = document.getElementById('lose-modal');
    var winMovesEl    = document.getElementById('win-moves');
    var winTimeEl     = document.getElementById('win-time');
    var winComboEl    = document.getElementById('win-combo');
    var winStarsEl    = document.getElementById('win-stars');

    function shuffle(array) {
        var arr = array.slice();
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return arr;
    }

    function formatTime(sec) {
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function startTimer() {
        clearInterval(timerTimer);
        timerTimer = setInterval(function () {
            if (timerVal > 0) {
                timerVal--;
                timerEl.textContent = formatTime(timerVal);
                if (timerVal <= 10) {
                    timerEl.style.color = '#f87171';
                }
            } else {
                clearInterval(timerTimer);
                handleGameOver(false);
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerTimer);
    }

    function updateBoardDimensions() {
        var cfg = DIFFICULTIES[currentDiff];
        var totalCards = cfg.pairs * 2;
        var cols = cfg.cols;
        var rows = Math.ceil(totalCards / cols);

        var screenW = Math.min(window.innerWidth, 480) - 24;
        var availableH = window.innerHeight - 240; // reserve space for header, toolbar, banner & ad
        var maxBoardH = Math.max(availableH, 300);

        var gap = 8;
        if (cols >= 5) gap = 6;
        if (cols >= 6) gap = 4;

        var cardW = Math.floor((screenW - (cols - 1) * gap) / cols);
        var cardH = Math.floor((maxBoardH - (rows - 1) * gap) / rows);
        
        // Keep cards close to aspect ratio 1:1.15
        var finalSize = Math.min(cardW, Math.round(cardH / 1.15));
        finalSize = Math.max(Math.min(finalSize, 90), 44);

        var finalH = Math.round(finalSize * 1.15);
        var fontSize = Math.max(Math.floor(finalSize * 0.52), 18);

        boardEl.style.gridTemplateColumns = 'repeat(' + cols + ', ' + finalSize + 'px)';
        boardEl.style.gap = gap + 'px';

        var allCards = boardEl.querySelectorAll('.card');
        allCards.forEach(function (c) {
            c.style.width = finalSize + 'px';
            c.style.height = finalH + 'px';
            var em = c.querySelector('.card-back span');
            if (em) em.style.fontSize = fontSize + 'px';
        });
    }

    function initGame() {
        stopTimer();
        winModal.classList.remove('active');
        loseModal.classList.remove('active');

        var cfg = DIFFICULTIES[currentDiff];
        var themeList = THEMES[currentTheme] || THEMES.animals;
        var selectedEmojis = shuffle(themeList).slice(0, cfg.pairs);
        cards = shuffle(selectedEmojis.concat(selectedEmojis));

        flippedCards = [];
        matchedCount = 0;
        moves = 0;
        combo = 0;
        maxCombo = 0;
        isLocked = false;
        isPlaying = false;

        timerVal = cfg.time;
        timerEl.textContent = formatTime(timerVal);
        timerEl.style.color = '#38bdf8';
        movesEl.textContent = '0';
        pairsEl.textContent = '0 / ' + cfg.pairs;
        comboEl.style.display = 'none';

        boardEl.innerHTML = '';
        cards.forEach(function (emoji, index) {
            var card = document.createElement('div');
            card.className = 'card';
            card.setAttribute('data-index', index);
            card.setAttribute('data-emoji', emoji);

            var inner = document.createElement('div');
            inner.className = 'card-inner';

            var front = document.createElement('div');
            front.className = 'card-front';

            var back = document.createElement('div');
            back.className = 'card-back';
            var emSpan = document.createElement('span');
            emSpan.textContent = emoji;
            back.appendChild(emSpan);

            inner.appendChild(front);
            inner.appendChild(back);
            card.appendChild(inner);

            card.addEventListener('click', function () {
                handleCardClick(card, index, emoji);
            });

            boardEl.appendChild(card);
        });

        updateBoardDimensions();
    }

    function handleCardClick(card, index, emoji) {
        if (isLocked) return;
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

        if (!isPlaying) {
            isPlaying = true;
            startTimer();
        }

        playSound('flip');
        card.classList.add('flipped');
        flippedCards.push({ card: card, index: index, emoji: emoji });

        if (flippedCards.length === 2) {
            moves++;
            movesEl.textContent = moves;
            isLocked = true;

            var first = flippedCards[0];
            var second = flippedCards[1];

            if (first.emoji === second.emoji) {
                // Match!
                combo++;
                if (combo > maxCombo) maxCombo = combo;
                matchedCount++;

                var cfg = DIFFICULTIES[currentDiff];
                pairsEl.textContent = matchedCount + ' / ' + cfg.pairs;

                playSound('match');

                setTimeout(function () {
                    first.card.classList.add('matched');
                    second.card.classList.add('matched');
                    flippedCards = [];
                    isLocked = false;

                    if (combo >= 2) {
                        comboEl.textContent = '🔥 ' + combo + 'X COMBO!';
                        comboEl.style.display = 'block';
                        comboEl.classList.remove('pop-anim');
                        void comboEl.offsetWidth;
                        comboEl.classList.add('pop-anim');
                    }

                    if (matchedCount === cfg.pairs) {
                        stopTimer();
                        setTimeout(function () {
                            handleGameOver(true);
                        }, 500);
                    }
                }, 300);
            } else {
                // Mismatch
                combo = 0;
                comboEl.style.display = 'none';
                playSound('mismatch');

                setTimeout(function () {
                    first.card.classList.add('shake');
                    second.card.classList.add('shake');
                }, 400);

                setTimeout(function () {
                    first.card.classList.remove('flipped', 'shake');
                    second.card.classList.remove('flipped', 'shake');
                    flippedCards = [];
                    isLocked = false;
                }, 900);
            }
        }
    }

    function handleGameOver(won) {
        if (won) {
            playSound('win');
            var cfg = DIFFICULTIES[currentDiff];
            var timeSpent = cfg.time - timerVal;

            var stars = 3;
            var maxAllowedMoves = cfg.pairs * 2.2;
            if (moves > maxAllowedMoves * 1.5 || timeSpent > cfg.time * 0.75) {
                stars = 1;
            } else if (moves > maxAllowedMoves || timeSpent > cfg.time * 0.5) {
                stars = 2;
            }

            winMovesEl.textContent = moves;
            winTimeEl.textContent = formatTime(timeSpent);
            winComboEl.textContent = maxCombo + 'x';
            winStarsEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

            winModal.classList.add('active');
        } else {
            playSound('mismatch');
            loseModal.classList.add('active');
        }
    }

    // --- Button Event Listeners ---
    document.querySelectorAll('.diff-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.diff-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentDiff = btn.getAttribute('data-diff');
            initGame();
        });
    });

    document.querySelectorAll('.theme-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.theme-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentTheme = btn.getAttribute('data-theme');
            initGame();
        });
    });

    document.getElementById('new-game-btn').addEventListener('click', initGame);
    document.getElementById('play-again-btn').addEventListener('click', initGame);
    document.getElementById('retry-btn').addEventListener('click', initGame);

    window.addEventListener('resize', function () {
        updateBoardDimensions();
    });

    // Start on load
    initGame();
})();
