(function() {
    'use strict';

    // ===== Web Audio Sound Synthesizer =====
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new AudioCtx();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSound(type) {
        try {
            initAudio();
            if (!audioCtx) return;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            const now = audioCtx.currentTime;

            if (type === 'success') {
                // Happy high-pitched double chirp
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.setValueAtTime(880, now + 0.08); // A5
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'error') {
                // Low buzz
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(130.81, now); // C3
                osc.frequency.linearRampToValueAtTime(80, now + 0.25);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'hint') {
                // Shimmer chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1046.50, now); // C6
                osc.frequency.exponentialRampToValueAtTime(2093.00, now + 0.4); // C7
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (type === 'clear') {
                // Fanfare: C4 - E4 - G4 - C5
                const notes = [261.63, 329.63, 392.00, 523.25];
                notes.forEach((freq, idx) => {
                    const o = audioCtx.createOscillator();
                    const g = audioCtx.createGain();
                    o.connect(g);
                    g.connect(audioCtx.destination);
                    o.type = 'triangle';
                    o.frequency.setValueAtTime(freq, now + idx * 0.1);
                    g.gain.setValueAtTime(0.15, now + idx * 0.1);
                    g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.4);
                    o.start(now + idx * 0.1);
                    o.stop(now + idx * 0.1 + 0.45);
                });
            } else if (type === 'gameover') {
                // Melancholy descending slide
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now); // A3
                osc.frequency.linearRampToValueAtTime(110, now + 0.6); // A2
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
                osc.start(now);
                osc.stop(now + 0.7);
            }
        } catch (e) {
            console.warn('Audio play failed', e);
        }
    }

    // ===== Levels Configuration using reference assets =====
    const LEVELS = [
        {
            name: "Level 1: Vintage Parlor",
            bg: "assets/images/bg_ho.png",
            cover: "assets/images/bg_cover.png",
            items: [
                { id: "playing_card", name: "Playing Card", src: "assets/images/playing_card.png", x: 80.00, y: 55.56, w: 4.00, h: 10.00, rot: -45 },
                { id: "purse", name: "Purse", src: "assets/images/purse.png", x: 26.32, y: 59.88, w: 6.67, h: 10.00, rot: 10 },
                { id: "glass_bird", name: "Glass Bird", src: "assets/images/glass_bird.png", x: 25.00, y: 25.00, w: 6.25, h: 8.33, rot: 0 },
                { id: "apple", name: "Apple", src: "assets/images/apple.png", x: 59.52, y: 51.02, w: 3.33, h: 5.88, rot: 0 }
            ]
        },
        {
            name: "Level 2: The Dressing Table",
            bg: "assets/images/bg_ho.png",
            cover: "assets/images/bg_cover.png",
            items: [
                { id: "mirror", name: "Mirror", src: "assets/images/mirror.png", x: 18.18, y: 33.33, w: 6.25, h: 14.29, rot: 0 },
                { id: "balerina", name: "Ballet Dancer", src: "assets/images/balerina.png", x: 50.00, y: 37.74, w: 7.69, h: 20.00, rot: 0 },
                { id: "parfume", name: "Perfume", src: "assets/images/parfume.png", x: 27.03, y: 62.50, w: 5.00, h: 7.69, rot: 25 },
                { id: "comb", name: "Comb", src: "assets/images/comb.png", x: 86.96, y: 46.51, w: 3.33, h: 5.00, rot: 25 }
            ]
        },
        {
            name: "Level 3: Antique Dresser",
            bg: "assets/images/bg_ho.png",
            cover: "assets/images/bg_cover.png",
            items: [
                { id: "book", name: "Book", src: "assets/images/book.png", x: 66.67, y: 56.18, w: 6.67, h: 6.67, rot: -10 },
                { id: "basket", name: "Basket", src: "assets/images/basket.png", x: 48.78, y: 46.51, w: 7.14, h: 11.11, rot: 0 },
                { id: "fan", name: "Fan", src: "assets/images/fan.png", x: 31.25, y: 45.45, w: 10.00, h: 12.50, rot: -140 },
                { id: "shoe", name: "Shoe", src: "assets/images/shoe.png", x: 55.56, y: 78.13, w: 6.25, h: 8.33, rot: 0 }
            ]
        }
    ];

    // ===== Game Variables =====
    let currentLevelIdx = 0;
    let score = 0;
    let timeRemaining = 90; // 1.5 minutes per level for more tension
    let gameInterval = null;
    let hintsRemaining = 3;
    let levelFoundCount = 0;
    let isGameOver = false;

    // DOM Elements
    const gameBoard = document.getElementById('game-board');
    const targetList = document.getElementById('target-list');
    const levelNumText = document.getElementById('level-num');
    const timerValText = document.getElementById('timer-val');
    const scoreValText = document.getElementById('score-val');
    const hintBtn = document.getElementById('hint-btn');
    const hintCountText = document.getElementById('hint-count');

    // Screens
    const startScreen = document.getElementById('start-screen');
    const levelCompleteScreen = document.getElementById('level-complete-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const gameWinScreen = document.getElementById('game-win-screen');

    // Buttons
    const startBtn = document.getElementById('start-btn');
    const nextLvlBtn = document.getElementById('next-lvl-btn');
    const restartBtn = document.getElementById('restart-btn');
    const winRestartBtn = document.getElementById('win-restart-btn');

    // ===== Init Listeners =====
    startBtn.addEventListener('click', () => {
        initAudio();
        startScreen.classList.add('hidden');
        startGame();
    });

    nextLvlBtn.addEventListener('click', () => {
        levelCompleteScreen.classList.add('hidden');
        loadLevel(currentLevelIdx + 1);
        startGameTimer();
    });

    restartBtn.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        loadLevel(0);
        score = 0;
        hintsRemaining = 3;
        updateUI();
        startGameTimer();
    });

    winRestartBtn.addEventListener('click', () => {
        gameWinScreen.classList.add('hidden');
        loadLevel(0);
        score = 0;
        hintsRemaining = 3;
        updateUI();
        startGameTimer();
    });

    hintBtn.addEventListener('click', useHint);

    // ===== Game Functions =====
    function loadLevel(idx) {
        currentLevelIdx = idx;
        const lvl = LEVELS[currentLevelIdx];
        levelFoundCount = 0;
        timeRemaining = 90; // reset timer

        levelNumText.textContent = `${currentLevelIdx + 1}/${LEVELS.length}`;
        gameBoard.style.backgroundImage = `url(${lvl.bg})`;
        gameBoard.innerHTML = ''; // clear items
        targetList.innerHTML = ''; // clear list

        // Inject items onto board
        lvl.items.forEach(item => {
            item.found = false;
            
            const div = document.createElement('div');
            div.id = `item-${item.id}`;
            div.className = 'hidden-item';
            div.style.left = `${item.x}%`;
            div.style.top = `${item.y}%`;
            div.style.width = `${item.w}%`;
            div.style.height = `${item.h}%`;
            div.style.transform = `rotate(${item.rot}deg)`;
            
            // Image object
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.name;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.display = 'block';
            div.appendChild(img);

            // Handle tap/click
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                findItem(item);
            });

            gameBoard.appendChild(div);

            // Inject target card in footer
            const card = document.createElement('div');
            card.id = `target-${item.id}`;
            card.className = 'target-card';
            card.innerHTML = `<img src="${item.src}"> <span>${item.name}</span>`;
            targetList.appendChild(card);
        });

        // Inject Foreground Cover Layer
        if (lvl.cover) {
            const coverDiv = document.createElement('div');
            coverDiv.style.position = 'absolute';
            coverDiv.style.inset = '0';
            coverDiv.style.backgroundImage = `url(${lvl.cover})`;
            coverDiv.style.backgroundSize = '100% 100%';
            coverDiv.style.pointerEvents = 'none'; // pass clicks through
            coverDiv.style.zIndex = '20'; // overlay on top of items
            gameBoard.appendChild(coverDiv);
        }

        // Set board background click for penalization
        gameBoard.onclick = (e) => {
            triggerWrongClick(e.clientX, e.clientY);
        };
    }

    function startGame() {
        loadLevel(0);
        updateUI();
        startGameTimer();
    }

    function startGameTimer() {
        isGameOver = false;
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();

            if (timeRemaining <= 0) {
                endGame(false);
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timeRemaining / 60);
        const secs = timeRemaining % 60;
        const minStr = mins.toString().padStart(2, '0');
        const secStr = secs.toString().padStart(2, '0');
        timerValText.textContent = `${minStr}:${secStr}`;

        if (timeRemaining <= 15) {
            timerValText.parentElement.classList.add('low-time');
        } else {
            timerValText.parentElement.classList.remove('low-time');
        }
    }

    function updateUI() {
        scoreValText.textContent = score;
        hintCountText.textContent = hintsRemaining;
        hintBtn.disabled = hintsRemaining <= 0;
        updateTimerDisplay();
    }

    function findItem(item) {
        if (item.found || isGameOver) return;
        
        item.found = true;
        levelFoundCount++;
        score += 100;
        updateUI();

        playSound('success');

        // Found effects
        const el = document.getElementById(`item-${item.id}`);
        el.classList.add('found');

        const card = document.getElementById(`target-${item.id}`);
        if (card) card.classList.add('found');

        // Trigger found circle pulse
        const rect = el.getBoundingClientRect();
        const boardRect = gameBoard.getBoundingClientRect();
        const x = rect.left - boardRect.left + (rect.width / 2);
        const y = rect.top - boardRect.top + (rect.height / 2);
        triggerFoundClickEffect(x, y);

        // Check if all found
        const lvl = LEVELS[currentLevelIdx];
        if (levelFoundCount >= lvl.items.length) {
            clearLevel();
        }
    }

    function triggerWrongClick(clientX, clientY) {
        if (isGameOver) return;
        
        timeRemaining = Math.max(0, timeRemaining - 5);
        updateTimerDisplay();
        playSound('error');

        // Spawn visual flash at click coordinates
        const rect = gameBoard.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const flash = document.createElement('div');
        flash.className = 'wrong-click-effect';
        flash.style.left = `${x}px`;
        flash.style.top = `${y}px`;
        gameBoard.appendChild(flash);
        setTimeout(() => flash.remove(), 400);
    }

    function triggerFoundClickEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'found-click-effect';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        gameBoard.appendChild(effect);
        setTimeout(() => effect.remove(), 600);
    }

    function clearLevel() {
        clearInterval(gameInterval);
        isGameOver = true;
        playSound('clear');

        // Time bonus: 10 points per remaining second
        const timeBonus = timeRemaining * 10;
        score += timeBonus;
        updateUI();

        // Stars award based on remaining time
        let stars = 1;
        if (timeRemaining > 45) stars = 3;
        else if (timeRemaining > 20) stars = 2;

        setTimeout(() => {
            if (currentLevelIdx === LEVELS.length - 1) {
                // Game completely clear!
                document.getElementById('win-score-val').textContent = score;
                gameWinScreen.classList.remove('hidden');
                
                // Track win event using analytics if loaded
                if (typeof window.collectHit === 'function') {
                    window.collectHit('game-win');
                }
                
                // Trigger PMG sync if available
                if (typeof syncPMGLayout === 'function') syncPMGLayout();
            } else {
                // Level clear overlay
                document.getElementById('time-bonus-val').textContent = `+${timeBonus}`;
                document.getElementById('level-score-val').textContent = score;
                
                const starsContainer = document.getElementById('stars-container');
                starsContainer.innerHTML = '';
                for (let i = 0; i < 3; i++) {
                    const star = document.createElement('i');
                    star.className = `fa-solid fa-star star ${i < stars ? 'active' : ''}`;
                    starsContainer.appendChild(star);
                }

                levelCompleteScreen.classList.remove('hidden');
                // Trigger PMG sync if available
                if (typeof syncPMGLayout === 'function') syncPMGLayout();
            }
        }, 800);
    }

    function endGame(victory) {
        clearInterval(gameInterval);
        isGameOver = true;
        playSound('gameover');

        setTimeout(() => {
            document.getElementById('fail-score-val').textContent = score;
            gameOverScreen.classList.remove('hidden');
        }, 500);
    }

    function useHint() {
        if (hintsRemaining <= 0 || isGameOver) return;

        const lvl = LEVELS[currentLevelIdx];
        // Find first item not found yet
        const target = lvl.items.find(item => !item.found);
        
        if (target) {
            hintsRemaining--;
            updateUI();
            playSound('hint');

            const el = document.getElementById(`item-${target.id}`);
            if (el) {
                el.classList.add('hint-flash');
                setTimeout(() => {
                    el.classList.remove('hint-flash');
                }, 3000); // flash for 3s
            }
        }
    }

})();
