// --- CONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#70c5ce',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// --- GAME VARIABLES ---
let bird;
let pipes;
let particles;
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let gameSpeed = 2.5;
let isGameOver = false;
let isGameStarted = false;
let pipeTimer;

// DOM Elements
const scoreEl = document.getElementById('score-display');
const highScoreEl = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over-screen');
const startScreen = document.getElementById('start-screen');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const startBtn = document.getElementById('start-btn');

// Update High Score Display
highScoreEl.innerText = `BEST: ${highScore}`;

const game = new Phaser.Game(config);

// --- PRELOAD ---
function preload() {
    // 1. Generate Bird Texture (Yellow circle with eye)
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffd700, 1); // Gold
    g.fillCircle(16, 16, 16);
    g.fillStyle(0xffffff, 1); // Eye
    g.fillCircle(22, 10, 5);
    g.fillStyle(0x000000, 1); // Pupil
    g.fillCircle(24, 10, 2);
    g.fillStyle(0xffa500, 1); // Beak
    g.fillTriangle(24, 16, 32, 20, 24, 24);
    g.generateTexture('bird', 32, 32);

    // 2. Generate Pipe Texture (Green with border)
    const pg = this.make.graphics({ x: 0, y: 0, add: false });
    pg.fillStyle(0x73bf2e, 1);
    pg.fillRect(0, 0, 50, 400);
    pg.lineStyle(4, 0x558c22, 1);
    pg.strokeRect(0, 0, 50, 400);
    pg.generateTexture('pipe', 50, 400);

    // 3. Generate Particle Texture (White square)
    const partG = this.make.graphics({ x: 0, y: 0, add: false });
    partG.fillStyle(0xffffff, 0.8);
    partG.fillRect(0, 0, 4, 4);
    partG.generateTexture('particle', 4, 4);
}

// --- CREATE ---
function create() {
    isGameStarted = false;
    isGameOver = false;
    
    // Reset UI
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');

    // Create Bird
    bird = this.physics.add.sprite(100, 300, 'bird');
    bird.setCollideWorldBounds(true);
    bird.body.allowGravity = false;
    bird.visible = false;

    // Input
    this.input.on('pointerdown', jump, this);
    this.input.keyboard.on('keydown-SPACE', jump, this);

    // Pipes Group
    pipes = this.physics.add.group();

    // Particle Emitter (Trail)
    particles = this.add.particles(0, 0, 'particle', {
        speed: 50,
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: 300
    });
    particles.startFollow(bird);
    particles.stop();

    // Colliders
    this.physics.add.collider(bird, pipes, () => gameOver.call(this), null, this);
}

// --- START GAME ---
function startGame() {
    isGameStarted = true;
    isGameOver = false;
    score = 0;
    gameSpeed = 2.5;
    scoreEl.innerText = '0';
    startScreen.classList.add('hidden');
    
    bird.visible = true;
    bird.setPosition(100, 300);
    bird.setVelocity(0, 0);
    bird.rotation = 0;
    bird.setTint(0xffffff);
    particles.start();

    // We need to access the scene to create the timer
    const scene = game.scene.scenes[0];
    scene.physics.resume();

    // Pipe Spawning Timer
    if (pipeTimer) pipeTimer.remove();
    pipeTimer = scene.time.addEvent({
        delay: 1500,
        callback: spawnPipe,
        callbackScope: scene,
        loop: true
    });
}

// --- JUMP LOGIC ---
function jump() {
    if (isGameOver || !isGameStarted) return;

    bird.setVelocityY(-300);
    bird.setRotation(-0.3);

    if (bird.rotationTween) bird.rotationTween.remove();

    bird.rotationTween = game.scene.scenes[0].tweens.add({
        targets: bird,
        rotation: 0.5,
        duration: 500,
        ease: 'Linear'
    });
}

// --- SPAWN PIPES ---
function spawnPipe() {
    if (isGameOver || !isGameStarted) return;

    const gap = 160;
    const minHeight = 50;
    const maxPosition = 600 - gap - minHeight;
    const position = Phaser.Math.Between(minHeight, maxPosition);

    // Top Pipe
    const topPipe = pipes.create(450, position - 200, 'pipe');
    topPipe.setVelocityX(-gameSpeed * 100);
    topPipe.body.allowGravity = false;
    topPipe.setOrigin(0.5, 1);
    topPipe.setFlipY(true);

    // Bottom Pipe
    const bottomPipe = pipes.create(450, position + gap, 'pipe');
    bottomPipe.setVelocityX(-gameSpeed * 100);
    bottomPipe.body.allowGravity = false;
    bottomPipe.setOrigin(0.5, 0);
}

// --- UPDATE ---
function update(time, delta) {
    if (isGameOver || !isGameStarted) return;

    // 1. Custom Gravity
    if (bird.body.velocity.y < 300) {
        bird.body.velocity.y += 10;
    }

    // 2. Ground/Ceiling Collision
    if (bird.y > 600 || bird.y < 0) {
        gameOver.call(this);
    }

    // 3. Pipe Cleanup & Scoring
    pipes.children.iterate((pipe) => {
        if (pipe) {
            if (pipe.x < 100 && !pipe.passed) {
                pipe.passed = true;
                score += 0.5;
                const displayScore = Math.floor(score);
                scoreEl.innerText = displayScore;
                
                if (displayScore > 0 && displayScore % 5 === 0 && pipe.passedOnce !== displayScore) {
                    gameSpeed += 0.1;
                    pipe.passedOnce = displayScore;
                }
            }
            if (pipe.x < -60) {
                pipe.destroy();
            }
        }
    });
}

// --- GAME OVER ---
function gameOver() {
    if (isGameOver) return;
    isGameOver = true;
    this.physics.pause();
    bird.setTint(0xff0000);
    particles.stop();

    if (pipeTimer) pipeTimer.remove();

    const finalScore = Math.floor(score);
    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem('flappyHighScore', highScore);
        highScoreEl.innerText = `BEST: ${highScore}`;
    }

    finalScoreEl.innerText = finalScore;
    gameOverScreen.classList.remove('hidden');
}

// --- EVENT LISTENERS ---
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    game.scene.scenes[0].scene.restart();
});
