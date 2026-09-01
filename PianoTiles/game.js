/**
 * Piano Tiles (Magic Piano Rhythm) – PlayMixGames
 * Real Acoustic Piano Synthesizer, 4-Lane Scrolling Engine & Masterpiece Melodies
 */
(function () {
    'use strict';

    // --- Musical Note Frequency Map (Hz) ---
    var NOTE_FREQ = {
        'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99,
        'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
        'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99,
        'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'B5': 987.77, 'C6': 1046.50
    };

    // --- Masterpiece Song Sequences ---
    var SONGS = {
        furelise: {
            title: 'Für Elise',
            tempo: 1.0,
            notes: [
                'E5','D#5','E5','D#5','E5','B4','D5','C5','A4',
                'C4','E4','A4','B4','E4','G#4','B4','C5','E4',
                'E5','D#5','E5','D#5','E5','B4','D5','C5','A4',
                'C4','E4','A4','B4','E4','C5','B4','A4',
                'B4','C5','D5','E5','G4','F5','E5','D5',
                'F4','E5','D5','C5','E4','D5','C5','B4',
                'E4','E5','D#5','E5','B4','D5','C5','A4'
            ]
        },
        ode: {
            title: 'Ode to Joy',
            tempo: 1.05,
            notes: [
                'E4','E4','F4','G4','G4','F4','E4','D4',
                'C4','C4','D4','E4','E4','D4','D4',
                'E4','E4','F4','G4','G4','F4','E4','D4',
                'C4','C4','D4','E4','D4','C4','C4',
                'D4','D4','E4','C4','D4','E4','F4','E4','C4',
                'D4','E4','F4','E4','D4','C4','D4','G3',
                'E4','E4','F4','G4','G4','F4','E4','D4',
                'C4','C4','D4','E4','D4','C4','C4'
            ]
        },
        canon: {
            title: 'Canon in D',
            tempo: 0.95,
            notes: [
                'F#4','E4','D4','C#4','B3','A3','B3','C#4',
                'D4','F#4','A4','G4','F#4','D4','F#4','E4',
                'D4','B3','D4','C#4','B3','A3','B3','C#4',
                'D4','F#4','A4','G4','F#4','A4','D5','C#5',
                'B4','D5','C#5','B4','A4','G4','F#4','E4',
                'D4','E4','F#4','G4','A4','B4','C#5','D5'
            ]
        },
        moonlight: {
            title: 'Moonlight Sonata',
            tempo: 0.9,
            notes: [
                'G#3','C#4','E4','G#3','C#4','E4','G#3','C#4','E4',
                'A3','C#4','E4','A3','C#4','E4','A3','D4','F#4',
                'G#3','C#4','E4','G#3','C#4','D#4','G#3','C4','D#4',
                'C#4','E4','G#4','C#5','G#4','E4','C#4','G#3','E3',
                'G#3','C#4','E4','G#3','C#4','E4','G#3','D#4','F#4'
            ]
        }
    };

    // --- Web Audio Acoustic Piano Synthesizer ---
    var audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function playPianoNote(noteName) {
        try {
            var ctx = getAudioCtx();
            if (!ctx) return;
            var freq = NOTE_FREQ[noteName] || 440;
            var now = ctx.currentTime;

            // Fundamental Tone
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            // Harmonic Overtone
            var osc2 = ctx.createOscillator();
            var gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(freq * 2, now);

            // Piano Envelope (Fast attack, natural exponential decay)
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            gain2.gain.setValueAtTime(0.12, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc.start(now);
            osc2.start(now);
            osc.stop(now + 1.2);
            osc2.stop(now + 0.6);
        } catch (e) {
            // Ignore audio errors
        }
    }

    function playErrorBuzz() {
        try {
            var ctx = getAudioCtx();
            if (!ctx) return;
            var now = ctx.currentTime;
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.linearRampToValueAtTime(60, now + 0.3);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        } catch (e) {}
    }

    // --- State Variables ---
    var currentSongKey = 'furelise';
    var isPlaying = false;
    var isGameOver = false;
    var score = 0;
    var combo = 0;
    var maxCombo = 0;
    var nextNoteIndex = 0;
    var currentSpeed = 3.2;
    var activeTiles = [];
    var animationFrameId = null;
    var lastFrameTime = 0;

    // --- DOM Elements ---
    var viewportEl = document.getElementById('piano-viewport');
    var lanes = [
        document.getElementById('lane-0'),
        document.getElementById('lane-1'),
        document.getElementById('lane-2'),
        document.getElementById('lane-3')
    ];
    var scoreEl = document.getElementById('score-val');
    var comboEl = document.getElementById('combo-val');
    var songNameEl = document.getElementById('song-name');
    var progressFillEl = document.getElementById('progress-fill');
    var comboBannerEl = document.getElementById('combo-banner');
    var startOverlay = document.getElementById('start-overlay');
    var winModal = document.getElementById('win-modal');
    var loseModal = document.getElementById('lose-modal');
    var winScoreEl = document.getElementById('win-score');
    var winStarsEl = document.getElementById('win-stars');
    var winAccuracyEl = document.getElementById('win-accuracy');
    var loseScoreEl = document.getElementById('lose-score');
    var playAgainBtn = document.getElementById('play-again-btn');
    var retryBtn = document.getElementById('retry-btn');

    // Tile Sizing
    var tileHeight = 120;

    // --- Tile Spawning ---
    function spawnTile(noteIdx) {
        var song = SONGS[currentSongKey];
        if (noteIdx >= song.notes.length) return null;

        var laneIdx = Math.floor(Math.random() * 4);
        var tile = document.createElement('div');
        tile.className = 'piano-tile';
        tile.style.height = tileHeight + 'px';
        tile.style.top = (-tileHeight) + 'px';
        tile.setAttribute('data-note-idx', noteIdx);
        tile.setAttribute('data-lane', laneIdx);

        lanes[laneIdx].appendChild(tile);

        var tileObj = {
            el: tile,
            lane: laneIdx,
            y: -tileHeight,
            note: song.notes[noteIdx],
            index: noteIdx,
            hit: false
        };

        activeTiles.push(tileObj);
        return tileObj;
    }

    // --- Main Game Loop (60 FPS) ---
    function gameLoop(timestamp) {
        if (!isPlaying || isGameOver) return;

        if (!lastFrameTime) lastFrameTime = timestamp;
        var delta = (timestamp - lastFrameTime) / 16.66;
        lastFrameTime = timestamp;

        var vpHeight = viewportEl.clientHeight;
        var song = SONGS[currentSongKey];

        // Check if we need to spawn next tile
        if (activeTiles.length === 0 || activeTiles[activeTiles.length - 1].y > 20) {
            if (nextNoteIndex < song.notes.length) {
                spawnTile(nextNoteIndex);
                nextNoteIndex++;
            }
        }

        // Move all active tiles
        for (var i = 0; i < activeTiles.length; i++) {
            var t = activeTiles[i];
            t.y += currentSpeed * delta;
            t.el.style.top = t.y + 'px';

            // Missed tile dropped below viewport
            if (t.y > vpHeight && !t.hit) {
                handleMiss(t.lane);
                return;
            }
        }

        // Clean up off-screen hit tiles
        activeTiles = activeTiles.filter(function (t) {
            if (t.y > vpHeight + 20) {
                if (t.el.parentNode) t.el.parentNode.removeChild(t.el);
                return false;
            }
            return true;
        });

        // Check for Song Win Completion
        var totalNotes = song.notes.length;
        var progressPercent = Math.min(100, Math.round((score / (totalNotes * 3)) * 100));
        progressFillEl.style.width = progressPercent + '%';

        if (nextNoteIndex >= totalNotes && activeTiles.length === 0 && !isGameOver) {
            handleSongWin();
            return;
        }

        // Gentle speed escalation
        currentSpeed = Math.min(6.5, 3.2 + (score * 0.015) * song.tempo);

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Hit & Tap Handling ---
    function handleLaneTap(laneIdx) {
        if (!isPlaying && !isGameOver) {
            startSong();
            return;
        }

        if (isGameOver || !isPlaying) return;

        // Find the lowest active unhit tile across all lanes
        var lowestTile = null;
        var lowestY = -Infinity;

        for (var i = 0; i < activeTiles.length; i++) {
            var t = activeTiles[i];
            if (!t.hit && t.y > lowestY) {
                lowestY = t.y;
                lowestTile = t;
            }
        }

        if (lowestTile && lowestTile.lane === laneIdx) {
            // Successful Hit!
            lowestTile.hit = true;
            lowestTile.el.classList.add('hit');
            playPianoNote(lowestTile.note);

            combo++;
            if (combo > maxCombo) maxCombo = combo;

            var pts = 3;
            if (combo >= 5) pts = 4;
            if (combo >= 15) pts = 5;

            score += pts;
            scoreEl.textContent = score;
            comboEl.textContent = combo + 'x';

            if (combo >= 3) {
                comboBannerEl.textContent = '🔥 ' + combo + 'X COMBO!';
                comboBannerEl.style.display = 'block';
                comboBannerEl.classList.remove('pop-anim');
                void comboBannerEl.offsetWidth;
                comboBannerEl.classList.add('pop-anim');
            }
        } else {
            // Missed! Tapped empty lane or wrong tile
            handleMiss(laneIdx);
        }
    }

    function handleMiss(laneIdx) {
        isGameOver = true;
        isPlaying = false;
        cancelAnimationFrame(animationFrameId);

        playErrorBuzz();

        if (laneIdx >= 0 && laneIdx < 4) {
            lanes[laneIdx].classList.add('flash-red');
            setTimeout(function () {
                lanes[laneIdx].classList.remove('flash-red');
            }, 400);
        }

        loseScoreEl.textContent = score;
        setTimeout(function () {
            loseModal.classList.add('active');
        }, 500);
    }

    function handleSongWin() {
        isGameOver = true;
        isPlaying = false;
        cancelAnimationFrame(animationFrameId);

        var song = SONGS[currentSongKey];
        var maxPossible = song.notes.length * 3;
        var stars = 3;
        if (score < maxPossible * 0.8) stars = 2;
        if (score < maxPossible * 0.5) stars = 1;

        winScoreEl.textContent = score;
        winStarsEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        winAccuracyEl.textContent = '100%';

        setTimeout(function () {
            winModal.classList.add('active');
        }, 400);
    }

    function startSong() {
        startOverlay.style.display = 'none';
        winModal.classList.remove('active');
        loseModal.classList.remove('active');

        // Clear existing tiles
        lanes.forEach(function (l) { l.innerHTML = ''; });
        activeTiles = [];

        score = 0;
        combo = 0;
        maxCombo = 0;
        nextNoteIndex = 0;
        currentSpeed = 3.2;
        scoreEl.textContent = '0';
        comboEl.textContent = '0x';
        progressFillEl.style.width = '0%';
        comboBannerEl.style.display = 'none';

        isGameOver = false;
        isPlaying = true;
        lastFrameTime = 0;

        getAudioCtx();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function selectSong(key) {
        currentSongKey = key;
        songNameEl.textContent = SONGS[key].title;
        isPlaying = false;
        isGameOver = false;
        cancelAnimationFrame(animationFrameId);

        lanes.forEach(function (l) { l.innerHTML = ''; });
        activeTiles = [];

        startOverlay.style.display = 'flex';
        winModal.classList.remove('active');
        loseModal.classList.remove('active');
    }

    // --- Event Listeners ---
    lanes.forEach(function (laneEl, idx) {
        laneEl.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            handleLaneTap(idx);
        });
    });

    startOverlay.addEventListener('click', startSong);
    playAgainBtn.addEventListener('click', startSong);
    retryBtn.addEventListener('click', startSong);

    document.querySelectorAll('.song-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.song-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            selectSong(btn.getAttribute('data-song'));
        });
    });

    // Keyboard support (Keys 1, 2, 3, 4 or D, F, J, K)
    window.addEventListener('keydown', function (e) {
        var keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, 'd': 0, 'f': 1, 'j': 2, 'k': 3, 'D': 0, 'F': 1, 'J': 2, 'K': 3 };
        if (keyMap[e.key] !== undefined) {
            handleLaneTap(keyMap[e.key]);
        }
    });

    // Initial setup
    selectSong('furelise');
})();
