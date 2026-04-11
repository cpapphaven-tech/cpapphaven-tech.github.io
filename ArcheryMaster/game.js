/**
 * Archery Master – game.js  v4 (Balloon Shooter)
 * Flat 2D, colored balloons to pop, 60-second timer, in-game scoreboard.
 */

/* ==========================================================
   CONSTANTS & CONFIG
========================================================== */
const GAME_W  = 480;
const GAME_H  = 640;
const GRAVITY = 0.12;
const MAX_PULL = 100;
const ARC_DOTS = 24;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration, vol = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}
const sounds = {
    pop1: () => playSound(600, 'sine', 0.1, 0.1),
    pop5: () => playSound(800, 'triangle', 0.15, 0.15),
    pop10: () => { playSound(1000, 'square', 0.2, 0.2); playSound(1200, 'sine', 0.2, 0.1); },
    gameOver: () => playSound(150, 'sawtooth', 0.8, 0.2),
    win: () => { playSound(523.25, 'sine', 0.1); setTimeout(() => playSound(659.25, 'sine', 0.15), 100); setTimeout(() => playSound(783.99, 'triangle', 0.3), 200); },
    drop: () => playSound(200, 'sawtooth', 0.2, 0.05),
    shoot: () => playSound(300, 'sine', 0.1, 0.05)
};

function getLevelConfig(level) {
    const required     = 40 + (level - 1) * 35;  // Easier curve
    const spawnDelay   = Math.max(1200 - level * 40, 400); // ms between balloons
    const floatSpeed   = 60 + level * 5; // slower start
    return { required, spawnDelay, floatSpeed };
}

/* ==========================================================
   STATE
========================================================== */
const State = {
    score: 0,
    bestScore: +( localStorage.getItem('archery_best_score') || 0 ),
    bestLevel: +( localStorage.getItem('archery_best_level') || 1 ),
    level: 1,
    time: 60,
    gameRunning: false,
    _levelScore: 0,
    save() {
        if (this.score > this.bestScore) { this.bestScore = this.score; localStorage.setItem('archery_best_score', this.bestScore); }
        if (this.level > this.bestLevel) { this.bestLevel = this.level; localStorage.setItem('archery_best_level', this.bestLevel); }
    }
};

/* ==========================================================
   DOM HELPERS
========================================================== */
const $ = id => document.getElementById(id);

/* ==========================================================
   BOOT SCENE
========================================================== */
class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }

    preload() {
        this._makeBg();
        this._makeArrow();
        this._makeBow();
        this._makeBalloon();
    }

    _makeBg() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        // Dark blue space sky
        g.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e293b, 0x1e293b, 1);
        g.fillRect(0, 0, GAME_W, GAME_H);
        
        // Stars scattered (little squares)
        g.fillStyle(0xffffff, 0.4);
        for (let i = 0; i < 35; i++) {
            g.fillRect(Phaser.Math.Between(0, GAME_W), Phaser.Math.Between(0, GAME_H), 2, 2);
        }

        g.generateTexture('bg', GAME_W, GAME_H);
        g.destroy();
    }

    _makeBalloon() {
        const w = 80;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        
        // Draw perfectly round balloon sphere matching NumberBalloonShooter with a radial-like gradient
        const cx = w/2, cy = w/2;
        const rMax = w/2 - 2;
        
        for (let r = rMax; r > 0; r--) {
            // Factor from 0 (center) to 1 (edge)
            const t = r / rMax;
            // Interpolate color from White (center/highlight) to Dark Gray (edge)
            // Color shifts light top-left to dark bottom-right
            const ox = cx - (1 - t) * 12;
            const oy = cy - (1 - t) * 12;
            
            // Edge becomes dark (brightness 90), center is white (brightness 255)
            const brightness = Math.floor(90 + (1 - t) * 165);
            g.fillStyle(Phaser.Display.Color.GetColor(brightness, brightness, brightness), 1);
            g.fillCircle(ox, oy, r);
        }
        
        g.generateTexture('balloon', w, w);
        g.destroy();
    }

    _makeArrow() {
        const w = 100, h = 10;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x8b5a2b); g.fillRect(10, h/2 - 2, w - 30, 4); // Wooden shaft
        g.fillStyle(0xcccccc); g.fillTriangle(w-20, 0, w, h/2, w-20, h); // Head
        g.fillStyle(0xff2222); g.fillTriangle(10, 0, 25, h/2-1, 12, h); // Fletching
        g.generateTexture('arrow', w, h);
        g.destroy();
    }

    _makeBow() {
        const w = 60, h = 80;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.lineStyle(10, 0x6b4f10, 1);
        // Slingshot fork
        g.lineBetween(w/2, h, w/2 - 25, 20);
        g.lineBetween(w/2, h, w/2 + 25, 20);
        g.lineBetween(w/2, h, w/2, h - 30);
        g.generateTexture('sling', w, h);
        g.destroy();
    }

    create() { this.scene.start('Game'); }
}

/* ==========================================================
   GAME SCENE
========================================================== */
class GameScene extends Phaser.Scene {
    constructor() { super('Game'); }

    create() {
        this.cfg = getLevelConfig(State.level);
        State._levelScore = 0;
        State.time = 60;
        this._inFlight = false;
        this.balloons = this.physics.add.group(); // Physical group for collision
        this.arrows = this.physics.add.group();

        // Slingshot drag state
        this._dragging = false;
        this._pullX = 0; this._pullY = 0;
        this._slingCX = GAME_W / 2;
        this._slingCY = GAME_H - 110;

        this._setupBg();
        this._setupHUD();
        this._setupSling();
        this._setupInput();
        
        // Collision
        this.physics.add.overlap(this.arrows, this.balloons, this._hitBalloon, null, this);

        // Menu wiring
        ['start-btn', 'next-level-btn', 'retry-btn'].forEach(id => {
            const el = $(id);
            if (el) el.onclick = () => this['_on' + id.split('-')[0].charAt(0).toUpperCase() + id.split('-')[0].slice(1)]();
        });

        // Initialize HUDs
        const sb = $('start-best');  if (sb) sb.textContent = State.bestScore;
        const sl = $('start-level'); if (sl) sl.textContent = State.bestLevel;

        this._arcGraphics = this.add.graphics().setDepth(55);

        // Timer
        this.timeEvent = this.time.addEvent({ delay: 1000, callback: this._tickTime, callbackScope: this, loop: true });
        
        // Spawner
        this.spawnEvent = this.time.addEvent({ delay: this.cfg.spawnDelay, callback: this._spawnBalloon, callbackScope: this, loop: true });
        
        if (!State.gameRunning) {
            this.timeEvent.paused = true;
            this.spawnEvent.paused = true;
        }
    }

    /* ---------- BACKGROUND ---------- */
    _setupBg() {
        this.add.image(GAME_W/2, GAME_H/2, 'bg').setDisplaySize(GAME_W, GAME_H).setDepth(0);
    }

    /* ---------- HUD (Canvas-based) ---------- */
    _setupHUD() {
        const g = this.add.graphics().setDepth(90);
        g.fillStyle(0x000000, 0.4);
        g.fillRect(0, 0, GAME_W, 60);

        this.txtLevel = this.add.text(15, 8, 'LEVEL ' + State.level, { fontSize: '18px', fontFamily: "'Outfit',sans-serif", fontStyle: 'bold', color: '#fff' }).setDepth(100);
        this.txtTarget = this.add.text(15, 30, 'Goal: ' + State._levelScore + ' / ' + this.cfg.required, { fontSize: '16px', fontFamily: "'Outfit',sans-serif", color: '#fbbf24' }).setDepth(100);

        this.txtTime = this.add.text(GAME_W/2, 30, '60s', { fontSize: '28px', fontFamily: "'Outfit',sans-serif", fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(100);

        this.txtScore = this.add.text(GAME_W - 15, 8, 'TOT SCORE: ' + State.score, { fontSize: '16px', fontFamily: "'Outfit',sans-serif", color: '#fff' }).setOrigin(1, 0).setDepth(100);
        this.txtBest = this.add.text(GAME_W - 15, 30, 'BEST: ' + State.bestScore, { fontSize: '14px', fontFamily: "'Outfit',sans-serif", color: '#a3a3a3' }).setOrigin(1, 0).setDepth(100);
    }

    _updateHUD() {
        this.txtTime.setText(State.time + 's');
        if (State.time <= 10) this.txtTime.setColor('#f43f5e');
        this.txtTarget.setText('Goal: ' + State._levelScore + ' / ' + this.cfg.required);
        this.txtTarget.setColor(State._levelScore >= this.cfg.required ? '#4ade80' : '#fbbf24');
        this.txtScore.setText('TOT SCORE: ' + State.score);
    }

    /* ---------- BALLOON SPAWNING ---------- */
    _spawnBalloon() {
        if (!State.gameRunning) return;
        
        const x = Phaser.Math.Between(40, GAME_W - 40);
        const y = GAME_H + 50;
        
        const b = this.balloons.create(x, y, 'balloon').setDepth(10).setScale(0.85);
        b.body.setCircle(36, 4, 4); // pure spherical hitbox 
        
        const colorList = ['#94a3b8', '#fb923c', '#facc15', '#a3e635', '#4ade80', '#2dd4bf', '#38bdf8', '#60a5fa', '#818cf8', '#a855f7'];
        let val = Phaser.Math.Between(5, 50);
        let isNegative = Math.random() < 0.25;
        if (isNegative) val = -Math.max(1, Math.floor(val / 2));
        
        let colorStr = colorList[(Math.abs(val) - 1) % 10];
        let colorHex = Phaser.Display.Color.HexStringToColor(colorStr).color;
        
        b.setTint(colorHex);
        b._pts = val;
        b._colorHex = colorHex;
        
        const txt = this.add.text(x, y, val > 0 ? val.toString() : val.toString(), {
            fontFamily: 'Arial, sans-serif',
            fontSize: '36px', fontStyle: 'bold', 
            color: '#ffffff',
            shadow: { offsetX: 0, offsetY: 3, color: '#000000', blur: 4, stroke: false, fill: true }
        }).setOrigin(0.5).setDepth(11);
        b._txt = txt;
        
        // Wobble float effect
        const speed = this.cfg.floatSpeed * (isNegative ? 1.3 : 1.0 + Math.random()*0.4);
        b.setVelocityY(-speed);
        
        this.tweens.add({
            targets: b, x: x + Phaser.Math.Between(-30, 30),
            duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.InOut'
        });
    }

    /* ---------- SLINGSHOT ---------- */
    _setupSling() {
        const cx = this._slingCX, cy = this._slingCY;
        this.sling = this.add.image(cx, cy, 'sling').setDepth(20).setOrigin(0.5, 1);
        this.arrowIdle = this.add.image(cx, cy - 30, 'arrow').setDepth(18).setScale(0.8).setAngle(-90).setAlpha(1);
        this.bandGraphics = this.add.graphics().setDepth(19);
        this._forkL = { x: cx - 25, y: cy - 60 };
        this._forkR = { x: cx + 25, y: cy - 60 };
    }

    /* ---------- INPUT ---------- */
    _setupInput() {
        this.input.on('pointerdown', (p) => {
            if (!State.gameRunning) return;
            if (p.y < GAME_H * 0.4) return;
            this._dragging = true;
        });

        this.input.on('pointermove', (p) => {
            if (!this._dragging) return;
            let dx = p.x - this._slingCX;
            let dy = p.y - this._slingCY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > MAX_PULL) { dx = dx/dist*MAX_PULL; dy = dy/dist*MAX_PULL; }
            if (dy < 0) dy = 0; // only drag down
            this._pullX = dx; this._pullY = dy;
        });

        this.input.on('pointerup', () => this._releaseSling());
        this.input.on('pointerupoutside', () => this._releaseSling());
    }

    _releaseSling() {
        if (!this._dragging) return;
        this._dragging = false;
        const pull = Math.sqrt(this._pullX*this._pullX + this._pullY*this._pullY);
        if (pull > 15) {
            this._fireArrow(-this._pullX, -this._pullY, pull / MAX_PULL);
        }
        this._pullX = 0; this._pullY = 0;
    }

    _fireArrow(vx, vy, power) {
        sounds.shoot();
        this.arrowIdle.setAlpha(0);
        const speed = 4 + power * 8; // SLOW ARROW!
        const len   = Math.sqrt(vx*vx + vy*vy);
        const avx   = (vx / len) * speed;
        const avy   = (vy / len) * speed;

        const arrow = this.arrows.create(this._slingCX, this._slingCY - 30, 'arrow').setDepth(20).setScale(0.85); // Physics body
        arrow.body.setSize(90, 10);
        
        // Physics update per frame manually for rotation
        arrow._avx = avx;
        arrow._avy = avy;
        
        // Reload arrow visually
        this.time.delayedCall(400, () => {
            if(State.gameRunning) this.arrowIdle.setAlpha(1);
        });
    }

    /* ---------- COLLISION ---------- */
    _hitBalloon(arrow, balloon) {
        // Pop balloon!
        const pts = balloon._pts;
        if(pts < 0) sounds.drop();
        else if(pts <= 15) sounds.pop1();
        else if(pts <= 25) sounds.pop5();
        else sounds.pop10();

        State.score += pts;
        State._levelScore += pts;
        this._updateHUD();

        // Particles
        this._bubbleBurst(balloon.x, balloon.y, balloon._colorHex);
        
        // floating score text
        this._popText(balloon.x, balloon.y, pts > 0 ? '+' + pts : pts.toString(), pts > 0 ? '#ffffff' : '#ff4444');

        if (balloon._txt) balloon._txt.destroy();
        balloon.destroy(); // remove balloon

        // Win check (same as NumberBalloonShooter)
        if (State._levelScore >= this.cfg.required && State.gameRunning) {
            this._endRound();
        }
        // arrow continues flying!
    }

    _bubbleBurst(cx, cy, color) {
        for (let i=0; i<10; i++) {
            const p = this.add.circle(cx, cy, Phaser.Math.Between(4,8), color, 1).setDepth(45);
            const a = Math.random() * Math.PI*2;
            const v = Phaser.Math.Between(40, 90);
            this.tweens.add({ targets: p, x: cx+Math.cos(a)*v, y: cy+Math.sin(a)*v, alpha: 0, duration: 400, ease: 'Quad.Out', onComplete: ()=>p.destroy() });
        }
    }

    _popText(x, y, text, color) {
        const t = this.add.text(x, y, text, { fontSize: '26px', fontStyle: 'bold', color: color || '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: t, y: y-40, alpha: 0, duration: 800, ease: 'Cubic.Out', onComplete: ()=>t.destroy() });
    }

    /* ---------- GAME LOOP ---------- */
    _tickTime() {
        if (!State.gameRunning) return;
        State.time--;
        this._updateHUD();
        if (State.time <= 0) this._endRound();
    }

    _endRound() {
        if (!State.gameRunning) return;
        State.gameRunning = false;
        State.save();
        this.timeEvent.paused = true;
        this.spawnEvent.paused = true;

        if (State._levelScore >= this.cfg.required) {
            // WIN
            sounds.win();
            const t  = $('level-clear-title'); if (t)  t.textContent  = '⭐ LEVEL ' + State.level + ' CLEAR!';
            const su = $('level-clear-sub');   if (su) su.textContent = 'Awesome accuracy!';
            const sc = $('lc-score');          if (sc) sc.textContent = State._levelScore;
            $('lc-acc').parentElement.style.display = 'none'; // hide accuracy
            this.time.delayedCall(500, () => { const s = $('level-clear-screen'); if (s) s.classList.remove('hidden'); });
        } else {
            // LOSE
            sounds.gameOver();
            const fi  = $('final-score-display');  if (fi)  fi.textContent  = State.score;
            const fl  = $('final-level-display');  if (fl)  fl.textContent  = 'Level ' + State.level;
            const gb  = $('go-best');              if (gb)  gb.textContent  = State.bestScore;
            const gbl = $('go-best-level');        if (gbl) gbl.textContent = State.bestLevel;
            this.time.delayedCall(500, () => { const s = $('game-over-screen'); if (s) s.classList.remove('hidden'); });
        }
    }

    /* ---- MENUS ---- */
    _onStart() {
        const ss = $('start-screen'); if (ss) ss.classList.add('hidden');
        State.score = 0; State.level = 1; State.gameRunning = true;
        this.scene.restart();
    }
    _onNext() {
        const s = $('level-clear-screen'); if (s) s.classList.add('hidden');
        State.level++; State.gameRunning = true;
        State.score = 0; State._levelScore = 0; // RESET
        this.scene.restart();
    }
    _onRetry() {
        const s = $('game-over-screen'); if (s) s.classList.add('hidden');
        State.score = 0; State.level = 1; State.gameRunning = true;
        this.scene.restart();
    }

    update(time, delta) {
        // Move live arrows
        this.arrows.getChildren().forEach(arrow => {
            arrow._avy += GRAVITY;
            arrow.x += arrow._avx;
            arrow.y += arrow._avy;
            arrow.setRotation(Math.atan2(arrow._avy, arrow._avx));
            if (arrow.y > GAME_H + 50 || arrow.x < -100 || arrow.x > GAME_W + 100) arrow.destroy();
        });

        // Kill un-popped balloons that float off top
        this.balloons.getChildren().forEach(b => {
            if (b._txt && b._txt.active) b._txt.setPosition(b.x, b.y);
            if (b.y < -50) { if (b._txt) b._txt.destroy(); b.destroy(); }
        });

        const cx = this._slingCX, cy = this._slingCY;
        
        // Idle arrow follow sling
        if (this.arrowIdle.alpha > 0) {
            this.arrowIdle.setPosition(cx + this._pullX * 0.85, cy - 30 + this._pullY * 0.85);
            this.arrowIdle.setRotation(this._dragging ? Math.atan2(-this._pullY, -this._pullX) : -Math.PI / 2);
        }

        // Draw rubber bands
        this.bandGraphics.clear();
        const px = cx + this._pullX * 0.85, py = cy - 30 + this._pullY * 0.85;
        if (this._dragging || (Math.abs(this._pullX)+Math.abs(this._pullY)>2)) {
            this.bandGraphics.lineStyle(3, 0x333333, 0.8);
            this.bandGraphics.lineBetween(this._forkL.x, this._forkL.y, px, py);
            this.bandGraphics.lineBetween(this._forkR.x, this._forkR.y, px, py);
        } else {
            this.bandGraphics.lineStyle(2.5, 0x333333, 0.5);
            this.bandGraphics.lineBetween(this._forkL.x, this._forkL.y, cx, cy - 30);
            this.bandGraphics.lineBetween(this._forkR.x, this._forkR.y, cx, cy - 30);
        }

        // Arc Prediction
        this._arcGraphics.clear();
        if (this._dragging && (Math.abs(this._pullX)+Math.abs(this._pullY))>10) {
            const pull = Math.sqrt(this._pullX*this._pullX+this._pullY*this._pullY);
            const pwr = pull / MAX_PULL;
            const spd = 4 + pwr * 8;
            let pvx = (-this._pullX / pull) * spd, pvy = (-this._pullY / pull) * spd;
            let sx = px, sy = py, svy = pvy, svx = pvx;
            
            for (let i=0; i<ARC_DOTS; i++) {
                for (let f=0; f<5; f++) { svy += GRAVITY; sx+=svx; sy+=svy; }
                if (sy > GAME_H+20 || sx < 0 || sx > GAME_W) break;
                if (sy < -20) continue;
                const t = i/ARC_DOTS;
                this._arcGraphics.fillStyle(0xffffff, Math.max(0.1, 1-t));
                this._arcGraphics.fillCircle(sx, sy, Math.max(2, (1-t)*5+1));
            }
        }
    }
}

const config = {
    type: Phaser.AUTO, parent: 'phaser-container', backgroundColor: '#0f172a',  // Game sky
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: GAME_W, height: GAME_H },
    scene: [BootScene, GameScene],
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } }, // we simulate gravity manually on arrows
    render: { antialias: true }
};

window.addEventListener('DOMContentLoaded', () => { setTimeout(()=>new Phaser.Game(config), 100); });
