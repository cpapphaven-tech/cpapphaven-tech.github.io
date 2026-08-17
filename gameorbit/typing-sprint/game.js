const GAME_W = 600;
const GAME_H = 800;

// ==========================================
// DICTIONARY
// ==========================================
const dictEASY = ["cat","dog","run","box","sun","car","hat","top","red","bot","log","cup","sky","bug","pen"];
const dictMED = ["time","play","fast","game","jump","word","code","blue","base","star","hero","type","rock","moon"];
const dictHARD = ["speed","space","laser","planet","aster","combo","super","action","pixel","light","hyper"];
const dictPRO = ["galaxy","defense","monster","keyboard","accuracy","arcade","master","system","dynamic"];

// ==========================================
// STATE
// ==========================================
const State = {
    gameRunning: false,
    score: 0,
    lives: 3,
    level: 1,
    time: 60, // 60 seconds per level
    
    // WPM Tracking
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    wordsTyped: 0,
    
    bestWPM: parseInt(localStorage.getItem('typing_best_wpm')) || 0,

    reset() {
        this.gameRunning = true;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.time = 60;
        this.totalKeystrokes = 0;
        this.correctKeystrokes = 0;
        this.wordsTyped = 0;
    },
    save() {
        const wpm = this.getWPM();
        if (wpm > this.bestWPM) {
            this.bestWPM = wpm;
            localStorage.setItem('typing_best_wpm', wpm);
        }
    },
    getWPM() {
        // Standard WPM: (Correct Keystrokes / 5) / TimeInMinutes
        // Our time is 60s max, but if they die early we calculate based on actual time elapsed
        const elapsedS = Math.max(1, 60 - this.time);
        const minutes = elapsedS / 60;
        const wpm = (this.correctKeystrokes / 5) / minutes;
        return Math.floor(wpm) || 0;
    },
    getAccuracy() {
        if (this.totalKeystrokes === 0) return 0;
        return Math.floor((this.correctKeystrokes / this.totalKeystrokes) * 100);
    }
};

// ==========================================
// AUDIO SYSTEM (Procedural Synthesis)
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    
    if (type === 'type') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'destroy') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'damage') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}
const sounds = { type: ()=>playSound('type'), error: ()=>playSound('error'), destroy: ()=>playSound('destroy'), damage: ()=>playSound('damage'), win: ()=>playSound('win') };

// ==========================================
// SCENES
// ==========================================
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }
    preload() {
        // Procedural Textures
        const g = this.make.graphics({x:0, y:0, add:false});
        
        // Base turret
        g.fillStyle(0x4ade80, 1);
        g.fillRoundedRect(0, 20, 60, 40, 8);
        g.fillStyle(0x22c55e, 1);
        g.fillRect(20, 0, 20, 25);
        g.generateTexture('base', 60, 60);
        g.clear();

        // Laser
        g.fillStyle(0x4ade80, 1);
        g.fillRect(0, 0, 8, 40);
        g.generateTexture('laser', 8, 40);
        
        // Target Box
        g.lineStyle(2, 0x4ade80, 1);
        g.strokeRect(0, 0, 100, 40);
        g.generateTexture('target_box', 100, 40);
    }
    create() {
        this.scene.start('GameScene');
    }
}

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }
    
    create() {
        // Background Grid
        this.add.grid(GAME_W/2, GAME_H/2, GAME_W, GAME_H, 40, 40, 0x0d0f1a, 1, 0xffffff, 0.03);

        this.fallingWords = []; // Array of word objects { text, typedChars, graphics, y, speed }
        this.lockedWord = null; // Currently targeted word

        // Player Base
        this.playerBase = this.add.image(GAME_W/2, GAME_H - 40, 'base').setDepth(10);
        this.lasers = this.add.group();

        // HUD
        this.hudTime = this.add.text(20, 20, 'Time: 60', { fontSize: '24px', fontStyle: 'bold', color: '#fff' }).setDepth(20);
        this.hudWPM = this.add.text(GAME_W - 20, 20, 'WPM: 0', { fontSize: '24px', fontStyle: 'bold', color: '#4ade80' }).setOrigin(1,0).setDepth(20);
        this.hudAcc = this.add.text(GAME_W - 20, 50, 'Acc: 0%', { fontSize: '18px', fontStyle: 'bold', color: '#a0a0c0' }).setOrigin(1,0).setDepth(20);
        this.hudLives = this.add.text(20, 50, 'Lives: 3', { fontSize: '18px', fontStyle: 'bold', color: '#ef4444' }).setDepth(20);

        // Input Handlers
        this.setupKeyboard();
        this.setupMobileInput();

        // Timers
        this.time.addEvent({ delay: 1000, callback: this._tickTime, callbackScope: this, loop: true });
        this.spawnTimer = this.time.addEvent({ delay: 2000, callback: this._spawnWord, callbackScope: this, loop: true });
    }

    /* ---------- INPUT HANDLING ---------- */
    setupKeyboard() {
        this.input.keyboard.on('keydown', (event) => {
            if (!State.gameRunning) return;
            
            // Only accept alphabetical letters
            if (event.keyCode >= 65 && event.keyCode <= 90) {
                this.processKeystroke(event.key.toLowerCase());
            }
            // Backspace/Escape escapes lock
            if (event.keyCode === 8 || event.keyCode === 27) {
                this.unlockWord();
            }
        });
    }

    setupMobileInput() {
        const hiddenInput = document.getElementById('mobile-keyboard-input');
        const overlay = document.getElementById('mobile-focus-overlay');
        
        // Show overlay to capture taps securely
        overlay.style.display = 'block';
        
        overlay.addEventListener('touchstart', (e) => {
            if(State.gameRunning) {
                hiddenInput.focus();
                // move overlay off so it doesn't block gameplay
                overlay.style.pointerEvents = 'none';
            }
        });

        // Listen to hidden input
        hiddenInput.addEventListener('input', (e) => {
            if (!State.gameRunning) return;
            const val = hiddenInput.value;
            if (val.length > 0) {
                const char = val.charAt(val.length - 1).toLowerCase();
                if (/[a-z]/.test(char)) {
                    this.processKeystroke(char);
                }
                // clear input immediately so it's always ready
                hiddenInput.value = '';
            }
        });

        // if keyboard closes, put overlay back to catch the next tap
        hiddenInput.addEventListener('blur', () => {
            if(State.gameRunning) overlay.style.pointerEvents = 'auto';
        });
    }

    /* ---------- CORE LOGIC ---------- */
    processKeystroke(char) {
        State.totalKeystrokes++;

        if (!this.lockedWord) {
            // Find a word starting with this letter (lowest one gets priority)
            let possibleWords = this.fallingWords.filter(w => w.str.charAt(0) === char);
            if (possibleWords.length > 0) {
                // Sort by Y (highest Y = lowest on screen)
                possibleWords.sort((a, b) => b.container.y - a.container.y);
                this.lockedWord = possibleWords[0];
                this.correctType();
            } else {
                this.errorType();
            }
        } else {
            // We are locked on. Does it match the next char?
            const expectedChar = this.lockedWord.str.charAt(this.lockedWord.typed);
            if (char === expectedChar) {
                this.correctType();
            } else {
                this.errorType();
            }
        }
        
        this.updateHUD();
    }

    correctType() {
        State.correctKeystrokes++;
        sounds.type();
        
        this.lockedWord.typed++;
        this.renderWord(this.lockedWord);

        // Turn turret towards word
        const angle = Phaser.Math.Angle.Between(this.playerBase.x, this.playerBase.y, this.lockedWord.container.x, this.lockedWord.container.y);
        this.playerBase.setRotation(angle + Math.PI/2);

        if (this.lockedWord.typed === this.lockedWord.str.length) {
            // Destroy word!
            this.shootLaser(this.lockedWord);
            State.wordsTyped++;
            
            // Remove from array
            this.fallingWords = this.fallingWords.filter(w => w !== this.lockedWord);
            this.lockedWord = null;
        }
    }

    errorType() {
        sounds.error();
        // Visual shake
        this.cameras.main.shake(100, 0.005);
        if(this.lockedWord) {
            this.lockedWord.bg.setStrokeStyle(2, 0xef4444);
            this.time.delayedCall(200, () => {
                if(this.lockedWord) this.lockedWord.bg.setStrokeStyle(2, 0x4ade80);
            });
        }
    }

    unlockWord() {
        if(this.lockedWord) {
            this.lockedWord.typed = 0;
            this.renderWord(this.lockedWord);
            this.lockedWord = null;
        }
    }

    /* ---------- VISUALS ---------- */
    _spawnWord() {
        if (!State.gameRunning) return;

        // Determine dictionary mix based on level
        let dict = dictEASY;
        const r = Math.random();
        if (State.level > 1 && r > 0.4) dict = dictMED;
        if (State.level > 2 && r > 0.7) dict = dictHARD;
        if (State.level > 4 && r > 0.85) dict = dictPRO;

        const str = Phaser.Math.RND.pick(dict);
        const x = Phaser.Math.Between(80, GAME_W - 80);
        const y = -50;
        const speed = 40 + (State.level * 15) + Phaser.Math.Between(-10, 10);

        const container = this.add.container(x, y).setDepth(15);
        
        // Background box
        const bg = this.add.rectangle(0, 0, str.length * 18 + 20, 36, 0x12141e, 0.8).setStrokeStyle(2, 0x22c55e);
        
        // Rich text (using phaser text logic)
        const txtUntyped = this.add.text(0, 0, str, { fontFamily: 'Courier Prime, monospace', fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        const txtTyped = this.add.text(0, 0, '', { fontFamily: 'Courier Prime, monospace', fontSize: '24px', color: '#4ade80', fontStyle: 'bold' }).setOrigin(0.5);

        container.add([bg, txtUntyped, txtTyped]);

        const wordObj = { str, typed: 0, container, bg, txtUntyped, txtTyped, speed };
        this.renderWord(wordObj);
        this.fallingWords.push(wordObj);
    }

    renderWord(w) {
        if (!w || !w.container.active) return;
        
        const typedStr = w.str.substring(0, w.typed);
        const untypedStr = w.str.substring(w.typed);

        // Calculate precise widths to align Courier Prime monospace properly
        // In monospace, every char is same width. But we can just use setX offsets if we want, or padding.
        // A simpler way: 'typed' is green, 'untyped' is grey. We append spaces to align perfectly.
        
        const spaceFill = " ".repeat(w.typed);
        w.txtUntyped.setText(spaceFill + untypedStr);
        
        const spaceFillEnd = " ".repeat(untypedStr.length);
        w.txtTyped.setText(typedStr + spaceFillEnd);

        if (w.typed > 0) w.bg.setStrokeStyle(3, 0x4ade80);
        else w.bg.setStrokeStyle(1, 0x666666);
    }

    shootLaser(targetWord) {
        sounds.destroy();
        const tx = targetWord.container.x;
        const ty = targetWord.container.y;
        
        // Create laser entity moving up
        const laser = this.add.image(this.playerBase.x, this.playerBase.y, 'laser').setDepth(9);
        const angle = Phaser.Math.Angle.Between(this.playerBase.x, this.playerBase.y, tx, ty);
        laser.setRotation(angle + Math.PI/2);

        this.tweens.add({
            targets: laser,
            x: tx, y: ty,
            duration: 100,
            onComplete: () => {
                laser.destroy();
                this._explode(tx, ty);
                targetWord.container.destroy();
            }
        });
    }

    _explode(x, y) {
        for (let i=0; i<15; i++) {
            const p = this.add.rectangle(x, y, 6, 6, Math.random() > 0.5 ? 0x4ade80 : 0xffffff).setDepth(20);
            const a = Math.random() * Math.PI*2;
            const v = Phaser.Math.Between(50, 150);
            this.tweens.add({ targets: p, x: x+Math.cos(a)*v, y: y+Math.sin(a)*v, alpha: 0, duration: 500, ease: 'Quad.Out', onComplete: ()=>p.destroy() });
        }
    }

    /* ---------- GAME LOOP ---------- */
    update(time, delta) {
        if (!State.gameRunning) return;

        const dt = delta / 1000;

        for (let i = this.fallingWords.length - 1; i >= 0; i--) {
            const w = this.fallingWords[i];
            w.container.y += w.speed * dt;

            // Check ground collision
            if (w.container.y > GAME_H - 10) {
                this.damagePlayer(w);
                this.fallingWords.splice(i, 1);
            }
        }
    }

    _tickTime() {
        if (!State.gameRunning) return;
        State.time--;
        this.updateHUD();

        if (State.time <= 0) {
            // WIN LEVEL
            sounds.win();
            State.level++;
            State.time = 60;
            // Spawn timer gets faster
            this.spawnTimer.delay = Math.max(600, 2000 - (State.level * 200));
            this._cleanupRound();
        }
    }

    damagePlayer(wordObj) {
        sounds.damage();
        this.cameras.main.shake(200, 0.01);
        
        if (this.lockedWord === wordObj) this.lockedWord = null;
        wordObj.container.destroy();
        
        this._explode(wordObj.container.x, wordObj.container.y);
        
        State.lives--;
        this.updateHUD();
        
        if (State.lives <= 0) {
            this._gameOver();
        }
    }

    _cleanupRound() {
        this.fallingWords.forEach(w => w.container.destroy());
        this.fallingWords = [];
        this.lockedWord = null;
        this.playerBase.setRotation(0);
        this.updateHUD();
    }

    updateHUD() {
        this.hudTime.setText(`Time: ${State.time}`);
        this.hudLives.setText(`Lives: ${State.lives}`);
        this.hudWPM.setText(`WPM: ${State.getWPM()}`);
        this.hudAcc.setText(`Acc: ${State.getAccuracy()}%`);
    }

    _gameOver() {
        State.gameRunning = false;
        State.save();
        this.physics?.pause();
        this._cleanupRound();
        
        // Show UI
        const gs = document.getElementById('game-over-screen');
        if (gs) {
            document.getElementById('go-val-wpm').innerText = State.getWPM();
            document.getElementById('go-val-acc').innerText = State.getAccuracy();
            document.getElementById('go-val-bestwpm').innerText = State.bestWPM;
            document.getElementById('go-val-keys').innerText = State.totalKeystrokes;
            
            // Push Analytics to Supabase if available
            pushScoreAnalytics(State.getWPM(), State.getAccuracy());
            
            gs.classList.remove('hidden');
        }
    }
}

// ==========================================
// CONFIG
// ==========================================
const config = {
    type: Phaser.AUTO, parent: 'phaser-container', backgroundColor: '#0d0f1a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: GAME_W, height: GAME_H },
    scene: [BootScene, GameScene]
};
const game = new Phaser.Game(config);

// ==========================================
// DOM UI BINDINGS
// ==========================================
document.getElementById('start-btn')?.addEventListener('click', () => {
    document.getElementById('start-screen').classList.add('hidden');
    // Ensure mobile keyboard focus on start via a timeout to ensure display transitions finish
    setTimeout(() => { document.getElementById('mobile-keyboard-input')?.focus(); }, 100);
    State.reset();
});

document.getElementById('retry-btn')?.addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.add('hidden');
    setTimeout(() => { document.getElementById('mobile-keyboard-input')?.focus(); }, 100);
    State.reset();
});

// ==========================================
// SUPABASE ANALYTICS
// ==========================================
function pushScoreAnalytics(wpm, accuracy) {
    if (typeof window.supabase === 'undefined' || window.DEV_MODE) return;
    
    // We log to the custom hits table if user setup a system for game endings
    // A simplified tracker for WPM score.
    const urlParams = new URLSearchParams(window.location.search);
    const placementId = urlParams.get('utm_content') || urlParams.get('placementid');

    window.supabase.from('game_events').insert([{
        game_name: 'TypingSpeedTest',
        score: wpm,
        metadata: { accuracy: accuracy, placement: placementId },
        timestamp: new Date().toISOString()
    }]).then(res => { console.log('Score synced', res); })
       .catch(err => { console.warn('Supabase inert error', err); });
}
