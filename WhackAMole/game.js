/**
 * Whack-a-Mole Arcade – PlayMixGames
 * Fast-Paced Mole Smashing Engine with Web Audio Sound FX, Combos & Particle Bursts
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

            if (type === 'whack') {
                // Punchy bonk + squeak
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(380, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'gold') {
                // Sparkle chord
                [587.33, 739.99, 880, 1174.66].forEach(function (f, i) {
                    var oscG = ctx.createOscillator();
                    var gainG = ctx.createGain();
                    oscG.type = 'sine';
                    oscG.frequency.setValueAtTime(f, now + i * 0.05);
                    gainG.gain.setValueAtTime(0.2, now + i * 0.05);
                    gainG.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.25);
                    oscG.connect(gainG);
                    gainG.connect(ctx.destination);
                    oscG.start(now + i * 0.05);
                    oscG.stop(now + i * 0.05 + 0.25);
                });
            } else if (type === 'bomb') {
                // Low explosion rumble
                var oscB = ctx.createOscillator();
                var gainB = ctx.createGain();
                oscB.type = 'sawtooth';
                oscB.frequency.setValueAtTime(140, now);
                oscB.frequency.exponentialRampToValueAtTime(30, now + 0.25);
                gainB.gain.setValueAtTime(0.35, now);
                gainB.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                oscB.connect(gainB);
                gainB.connect(ctx.destination);
                oscB.start(now);
                oscB.stop(now + 0.25);
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
            }
        } catch (e) {
            // Audio ignore
        }
    }

    // --- Game Variables ---
    var score = 0;
    var highScore = parseInt(localStorage.getItem('pmg_whack_high') || '0', 10);
    var combo = 0;
    var maxCombo = 0;
    var totalWhacks = 0;
    var goldWhacks = 0;
    var timeLeft = 60;
    var timerInterval = null;
    var spawnTimeout = null;
    var isPlaying = false;
    var gameMode = 'classic'; // 'classic' (60s), 'blitz' (45s), 'frenzy' (30s)

    var MODE_SETTINGS = {
        classic: { time: 60, minStay: 750, maxStay: 1300, spawnDelay: 550 },
        blitz:   { time: 45, minStay: 550, maxStay: 950,  spawnDelay: 400 },
        frenzy:  { time: 30, minStay: 400, maxStay: 750,  spawnDelay: 280 }
    };

    // --- DOM Elements ---
    var boardContainer = document.getElementById('board-container');
    var moleGridEl = document.getElementById('mole-grid');
    var scoreEl = document.getElementById('score-val');
    var timerEl = document.getElementById('timer-val');
    var highScoreEl = document.getElementById('high-val');
    var comboBannerEl = document.getElementById('combo-banner');
    var winModal = document.getElementById('win-modal');
    var winScoreEl = document.getElementById('win-score');
    var winHighEl = document.getElementById('win-high');
    var winComboEl = document.getElementById('win-combo');
    var playAgainBtn = document.getElementById('play-again-btn');
    var restartBtn = document.getElementById('restart-btn');

    // Update High Score Display
    highScoreEl.textContent = highScore;

    // --- Board Generation ---
    function createHoles() {
        moleGridEl.innerHTML = '';
        for (var i = 0; i < 9; i++) {
            var holeWrapper = document.createElement('div');
            holeWrapper.className = 'hole-wrapper';
            holeWrapper.setAttribute('data-index', i);

            var mole = document.createElement('div');
            mole.className = 'mole normal';
            mole.setAttribute('data-index', i);

            var face = document.createElement('span');
            face.className = 'mole-face';
            face.textContent = '🐹';
            mole.appendChild(face);

            holeWrapper.appendChild(mole);

            (function (m, idx) {
                holeWrapper.addEventListener('click', function (e) {
                    handleHoleTap(m, idx, e);
                });
            })(mole, i);

            moleGridEl.appendChild(holeWrapper);
        }
    }

    // --- Spawn Mechanics ---
    function getRandomHoleIndex(excludeIdx) {
        var idx;
        do {
            idx = Math.floor(Math.random() * 9);
        } while (idx === excludeIdx);
        return idx;
    }

    function popMole() {
        if (!isPlaying) return;

        var cfg = MODE_SETTINGS[gameMode];
        var holeIdx = getRandomHoleIndex(-1);
        var hole = moleGridEl.children[holeIdx];
        var mole = hole.querySelector('.mole');

        if (mole.classList.contains('up')) {
            // Pick another hole if currently busy
            holeIdx = (holeIdx + 1) % 9;
            hole = moleGridEl.children[holeIdx];
            mole = hole.querySelector('.mole');
        }

        // Determine Mole Type
        var rand = Math.random();
        var moleType = 'normal';
        var faceText = '🐹';

        if (rand < 0.18) {
            moleType = 'golden';
            faceText = '🐹';
        } else if (rand < 0.33) {
            moleType = 'bomb';
            faceText = '💣';
        }

        mole.className = 'mole ' + moleType;
        mole.querySelector('.mole-face').textContent = faceText;
        mole.classList.add('up');
        mole.setAttribute('data-active', 'true');

        // Speed adjustment over time
        var speedMod = Math.max(0.65, 1 - (MODE_SETTINGS[gameMode].time - timeLeft) * 0.008);
        var stayTime = Math.floor((Math.random() * (cfg.maxStay - cfg.minStay) + cfg.minStay) * speedMod);

        setTimeout(function () {
            if (mole.getAttribute('data-active') === 'true') {
                mole.classList.remove('up');
                mole.setAttribute('data-active', 'false');
            }
        }, stayTime);

        // Schedule Next Spawn
        var nextDelay = Math.floor(cfg.spawnDelay * speedMod);
        spawnTimeout = setTimeout(popMole, nextDelay);
    }

    // --- Tap / Whack Handling ---
    function handleHoleTap(mole, idx, e) {
        if (!isPlaying) {
            startGame();
        }

        if (mole.getAttribute('data-active') !== 'true') return;

        mole.setAttribute('data-active', 'false');
        mole.classList.add('whacked');

        var rect = mole.getBoundingClientRect();
        var boardRect = boardContainer.getBoundingClientRect();
        var popX = rect.left - boardRect.left + rect.width / 2;
        var popY = rect.top - boardRect.top + 10;

        if (mole.classList.contains('normal')) {
            // Normal Mole Hit
            combo++;
            if (combo > maxCombo) maxCombo = combo;
            totalWhacks++;

            var mult = Math.min(Math.floor(combo / 3) + 1, 4);
            var pts = 10 * mult;
            score += pts;
            scoreEl.textContent = score;

            playSound('whack');
            showParticle('+' + pts + (mult > 1 ? ' (x' + mult + ')' : ''), popX, popY, 'bonus');

            if (combo >= 2) {
                comboBannerEl.textContent = '🔥 ' + combo + 'X COMBO STREAK!';
                comboBannerEl.style.display = 'block';
                comboBannerEl.classList.remove('pop-anim');
                void comboBannerEl.offsetWidth;
                comboBannerEl.classList.add('pop-anim');
            }
        } else if (mole.classList.contains('golden')) {
            // Golden King Mole Hit
            combo += 2;
            if (combo > maxCombo) maxCombo = combo;
            goldWhacks++;
            totalWhacks++;

            var multG = Math.min(Math.floor(combo / 3) + 1, 4);
            var ptsG = 30 * multG;
            score += ptsG;
            scoreEl.textContent = score;

            playSound('gold');
            showParticle('👑 +' + ptsG, popX, popY, 'bonus');

            comboBannerEl.textContent = '👑 GOLDEN COMBO +' + ptsG + '!';
            comboBannerEl.style.display = 'block';
            comboBannerEl.classList.remove('pop-anim');
            void comboBannerEl.offsetWidth;
            comboBannerEl.classList.add('pop-anim');
        } else if (mole.classList.contains('bomb')) {
            // Bomb Hit! Penalty!
            combo = 0;
            comboBannerEl.style.display = 'none';
            score = Math.max(0, score - 20);
            scoreEl.textContent = score;

            playSound('bomb');
            showParticle('💥 -20', popX, popY, 'penalty');
        }

        setTimeout(function () {
            mole.classList.remove('up', 'whacked');
        }, 180);
    }

    // --- Floating Particles ---
    function showParticle(text, x, y, type) {
        var p = document.createElement('div');
        p.className = 'hit-particle ' + type;
        p.textContent = text;
        p.style.left = (x - 25) + 'px';
        p.style.top = y + 'px';
        boardContainer.appendChild(p);

        setTimeout(function () {
            if (p.parentNode) p.parentNode.removeChild(p);
        }, 600);
    }

    // --- Timer & Game Lifecycle ---
    function startGame() {
        if (isPlaying) return;
        isPlaying = true;

        var cfg = MODE_SETTINGS[gameMode];
        timeLeft = cfg.time;
        timerEl.textContent = timeLeft;
        timerEl.style.color = 'var(--gold)';

        score = 0;
        combo = 0;
        maxCombo = 0;
        totalWhacks = 0;
        goldWhacks = 0;
        scoreEl.textContent = '0';
        comboBannerEl.style.display = 'none';
        winModal.classList.remove('active');

        clearInterval(timerInterval);
        clearTimeout(spawnTimeout);

        timerInterval = setInterval(function () {
            timeLeft--;
            timerEl.textContent = timeLeft;
            if (timeLeft <= 10) {
                timerEl.style.color = '#ef4444';
            }
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);

        popMole();
    }

    function endGame() {
        isPlaying = false;
        clearInterval(timerInterval);
        clearTimeout(spawnTimeout);

        // Retract any up moles
        moleGridEl.querySelectorAll('.mole').forEach(function (m) {
            m.classList.remove('up', 'whacked');
            m.setAttribute('data-active', 'false');
        });

        playSound('win');

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('pmg_whack_high', highScore);
            highScoreEl.textContent = highScore;
        }

        winScoreEl.textContent = score;
        winHighEl.textContent = highScore;
        winComboEl.textContent = maxCombo + 'x';

        setTimeout(function () {
            winModal.classList.add('active');
        }, 400);
    }

    function resetGame() {
        isPlaying = false;
        clearInterval(timerInterval);
        clearTimeout(spawnTimeout);

        var cfg = MODE_SETTINGS[gameMode];
        timeLeft = cfg.time;
        timerEl.textContent = timeLeft;
        timerEl.style.color = 'var(--gold)';
        score = 0;
        combo = 0;
        scoreEl.textContent = '0';
        comboBannerEl.style.display = 'none';
        winModal.classList.remove('active');

        createHoles();
    }

    // --- Mode Selectors ---
    document.querySelectorAll('.mode-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.mode-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            gameMode = btn.getAttribute('data-mode');
            resetGame();
        });
    });

    playAgainBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', resetGame);

    // Initial Setup
    createHoles();
    resetGame();
})();
