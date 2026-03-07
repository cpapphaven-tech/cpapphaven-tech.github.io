// --- Configuration & Constants ---
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const hdrCanvas = document.getElementById("hdr-canvas");
const hctx = hdrCanvas.getContext("2d");

// UI Elements
const targetRunsUI = document.getElementById("target-runs");
const currentScoreUI = document.getElementById("current-score");
const ballsLeftUI = document.getElementById("balls-left");
const wicketsLeftUI = document.getElementById("wickets-left");
const matchMsg = document.getElementById("match-message");
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const gameOverScreen = document.getElementById("game-over-screen");
const nextMatchBtn = document.getElementById("next-match-btn");
const restartBtn = document.getElementById("restart-btn");
const winnerText = document.getElementById("winner-text");
const statScore = document.getElementById("stat-score");
const statResult = document.getElementById("stat-result");
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");

// Live Banner Elements
const liveScoreUI = document.getElementById("current-score-live");
const liveBallsUI = document.getElementById("balls-left-live");
const liveTargetUI = document.getElementById("target-live");

// Physics Constants
const GRAVITY = 0.25;
const PITCH_LEVEL = 0.82; // Y-coordinate factor for the ground
const BOUNCE_FACTOR = 0.75;

// Game State
let CW, CH;
let gameState = "START";
let score = 0;
let wickets = 0;
let ballsFaced = 0;
let currentLevel = 1;
let matchTarget = 10;
let maxBalls = 30;
let maxWickets = 10;

let ball = null;
let batsman = null;
let particles = [];
let ballTrail = [];

// --- Classes ---

class Ball {
    constructor(x, y, vx, vy) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.radius = 8;
        this.isHit = false;
        this.isDead = false;
        this.isOut = false;
        this.bounces = 0;
        this.scored = false;
    }

    update() {
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        // Bounce on pitch
        if (!this.isHit && this.y + this.radius > CH * PITCH_LEVEL) {
            this.y = CH * PITCH_LEVEL - this.radius;
            this.vy *= -BOUNCE_FACTOR;
            this.bounces++;

            // Add bounce particles
            createSparks(this.x, this.y, "#ffeb3b");
        }

        // Out logic (Stumps hit)
        if (!this.isHit && this.x < CW * 0.18 && this.x > CW * 0.15 && Math.abs(this.y - (CH * PITCH_LEVEL - 30)) < 40) {
            this.triggerOut("BOWLED!");
        }

        // Scoring boundaries (Right side)
        if (this.isHit && !this.scored) {
            if (this.x > CW) {
                this.calculateRuns();
            } else if (this.y > CH * PITCH_LEVEL + 80) { // Keep on field longer
                this.isDead = true;
                this.checkMatchEnd();
            }
        }

        // OOB Cleanup
        if (this.y > CH + 100 || this.x > CW + 100 || this.x < -100) {
            this.isDead = true;
            this.checkMatchEnd();
        }

        // Trail for HDR
        ballTrail.push({ x: this.x, y: this.y, alpha: 1, r: this.radius });
        if (ballTrail.length > 10) ballTrail.shift();
    }

    calculateRuns() {
        this.scored = true;
        this.isDead = true;
        let runs = 1;

        // Scoring based on height at which it exits the screen (Top to Bottom: 6, 5, 4, 3, 2, 1)
        if (this.y < CH * 0.15) runs = 6;
        else if (this.y < CH * 0.3) runs = 5;
        else if (this.y < CH * 0.45) runs = 4;
        else if (this.y < CH * 0.6) runs = 3;
        else if (this.y < CH * 0.75) runs = 2;
        else runs = 1;

        score += runs;
        showMatchMsg(runs + " RUNS!");
        this.checkMatchEnd();
    }

    triggerOut(msg) {
        if (this.isOut) return;
        this.isOut = true;
        this.isDead = true;
        wickets++;
        showMatchMsg(msg);
        this.checkMatchEnd();
    }

    checkMatchEnd() {
        // Logic handled in main loop
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff4444";
        ctx.fillStyle = "#ff4444";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Batsman {
    constructor() {
        this.x = CW * 0.18;
        this.y = CH * PITCH_LEVEL - 80;
        this.swinging = false;
        this.swingAngle = -Math.PI * 0.25;
        this.swingSpeed = 0.3;
        this.originalAngle = -Math.PI * 0.25;
        this.maxSwing = Math.PI * 0.75;
    }

    swing() {
        if (this.swinging) return;
        this.swinging = true;
        this.swingAngle = this.originalAngle;
    }

    update() {
        if (this.swinging) {
            this.swingAngle += this.swingSpeed;

            // Check collision with ball
            if (ball && !ball.isHit) {
                const dist = Math.hypot(this.x - ball.x, this.y + 40 - ball.y);

                if (dist < 60) {
                    ball.isHit = true;
                    // Physics based on timing (swing angle at impact)
                    const hitStrength = 15 + Math.random() * 10;
                    const hitAngle = -0.1 - (Math.random() * 0.6);
                    ball.vx = Math.cos(hitAngle) * hitStrength;
                    ball.vy = Math.sin(hitAngle) * hitStrength;

                    createSparks(ball.x, ball.y, "#fff");
                    showMatchMsg("CRACK!", 500);
                }
            }

            if (this.swingAngle > this.maxSwing) {
                this.swinging = false;
                this.swingAngle = this.originalAngle;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const scale = 0.9;
        ctx.scale(scale, scale);

        // Legs (Pads)
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 1;
        ctx.fillRect(-10, 60, 20, 50);
        ctx.strokeRect(-10, 60, 20, 50);
        ctx.fillRect(8, 60, 20, 50);
        ctx.strokeRect(8, 60, 20, 50);

        // Torso (Jersey)
        ctx.fillStyle = "#1e40af";
        ctx.beginPath();
        ctx.roundRect(-15, 0, 35, 70, 10);
        ctx.fill();

        // ctx.fillText("INDIA", 2, 35); // Removed as requested

        // Arms
        ctx.strokeStyle = "#1e40af";
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(5, 15);
        ctx.lineTo(25, 45);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(25, 45, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffdbac";
        ctx.fillRect(-5, -20, 18, 20);

        ctx.fillStyle = "#1e3a8a";
        ctx.beginPath();
        ctx.arc(5, -25, 20, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-15, -25, 40, 10);

        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10, -15); ctx.lineTo(20, -15);
        ctx.moveTo(-10, -10); ctx.lineTo(20, -10);
        ctx.stroke();

        ctx.save();
        ctx.translate(25, 45);
        ctx.rotate(this.swingAngle);

        ctx.strokeStyle = "#444";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(25, 0);
        ctx.stroke();

        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.roundRect(25, -10, 75, 20, 5);
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }
}

// --- Initialization & Loop ---

function resize() {
    CW = window.innerWidth;
    CH = window.innerHeight;
    canvas.width = CW; canvas.height = CH;
    hdrCanvas.width = CW; hdrCanvas.height = CH;
    initLevel();
}

function initLevel() {
    batsman = new Batsman();
    matchTarget = 10 + (currentLevel - 1) * 5;
}

function spawnBall() {
    if (ballsFaced >= maxBalls || wickets >= maxWickets || gameState !== "PLAY") return;

    const startX = CW * 0.95; // Start inside view for better visibility
    const startY = CH * PITCH_LEVEL - 160;
    const targetX = CW * 0.18 + (Math.random() * 40 - 20); // Center on batsman
    const time = 60 + Math.random() * 20;

    const vx = (targetX - startX) / time;
    const vy = -4; // Slighter higher arc to ensure it bounces well on the pitch

    ball = new Ball(startX, startY, vx, vy);
    ballsFaced++;
}

function update() {
    if (gameState === "PLAY") {
        if (ball) {
            ball.update();
            if (ball.isDead) {
                ball = null;
                setTimeout(spawnBall, 1500);
            }
        }
        batsman.update();

        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            p.alpha -= 0.02;
        });
        particles = particles.filter(p => p.alpha > 0);

        checkGameOver();
    }
    updateHUD();
}

function checkGameOver() {
    if (score >= matchTarget) {
        triggerEnd("VICTORY!", "You chased down the target!");
    } else if (wickets >= maxWickets || (ballsFaced >= maxBalls && !ball)) {
        triggerEnd("MATCH OVER", score < matchTarget ? "Target not achieved." : "Victory!");
    }
}

function triggerEnd(title, result) {
    if (gameState === "OVER") return;
    gameState = "OVER";
    winnerText.innerText = title;
    statScore.innerText = score + " Runs";
    statResult.innerText = result;

    if (score >= matchTarget) {
        nextMatchBtn.classList.remove("hidden");
    } else {
        nextMatchBtn.classList.add("hidden");
    }

    gameOverScreen.classList.remove("hidden");
}

function draw() {
    if (CH === 0 || CW === 0) return; // Wait for resize

    ctx.clearRect(0, 0, CW, CH);
    hctx.clearRect(0, 0, CW, CH);

    drawStadium();

    if (ball) ball.draw(ctx);
    if (batsman) batsman.draw(ctx);

    particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    drawHDR();
    drawScoringArc();
}

function drawStadium() {
    const grad = ctx.createLinearGradient(0, 0, 0, CH);
    grad.addColorStop(0, "#190a05");
    grad.addColorStop(1, "#3d1400");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    // If mobile portrait, show orientation overlay logic
    if (CH > CW) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Orbitron";
        ctx.textAlign = "center";
        ctx.fillText("ROTATE DEVICE FOR STADIUM VIEW", CW / 2, CH / 2);
        return;
    }

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, CH * 0.4, CW, CH * 0.4);

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 800; i++) {
        ctx.fillRect((i * 157) % CW, (CH * 0.45) + (i * 13) % (CH * 0.35), 2, 2);
    }

    ctx.fillStyle = "#4a773c";
    ctx.fillRect(0, CH * PITCH_LEVEL, CW, CH * (1 - PITCH_LEVEL));

    ctx.fillStyle = "#d4b886";
    ctx.fillRect(0, CH * PITCH_LEVEL, CW, CH * 0.1);

    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 4;
    const sx = CW * 0.16;
    const sy = CH * PITCH_LEVEL;
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(sx + i * 10, sy);
        ctx.lineTo(sx + i * 10, sy - 60);
        ctx.stroke();
    }
}

function drawScoringArc() {
    ctx.save();
    ctx.translate(CW, CH * 0.5);

    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 15;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(0, 0, CH * 0.45, Math.PI * 0.6, Math.PI * 1.4);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Orbitron";
    ctx.textAlign = "center";

    const radius = CH * 0.45;
    const labels = ["6", "5", "4", "3", "2", "1"];
    const angles = [Math.PI * 1.35, Math.PI * 1.21, Math.PI * 1.07, Math.PI * 0.93, Math.PI * 0.79, Math.PI * 0.65];

    labels.forEach((label, i) => {
        const x = Math.cos(angles[i]) * (radius + 40);
        const y = Math.sin(angles[i]) * (radius + 40);
        ctx.fillText(label, x, y);
    });

    ctx.restore();
}

function drawHDR() {
    const lights = [CW * 0.2, CW * 0.8];
    lights.forEach(lx => {
        const g = hctx.createRadialGradient(lx, CH * 0.2, 0, lx, CH * 0.2, 300);
        g.addColorStop(0, "rgba(255, 255, 255, 0.15)");
        g.addColorStop(1, "rgba(255, 255, 255, 0)");
        hctx.fillStyle = g;
        hctx.fillRect(lx - 300, 0, 600, CH * 0.5);
    });
}

function updateHUD() {
    const ballsRemaining = maxBalls - ballsFaced;
    const scoreStr = score + "/" + wickets;

    if (targetRunsUI) targetRunsUI.innerText = matchTarget.toString();
    if (ballsLeftUI) ballsLeftUI.innerText = ballsRemaining.toString();
    if (wicketsLeftUI) wicketsLeftUI.innerText = (maxWickets - wickets).toString();
    if (currentScoreUI) currentScoreUI.innerText = scoreStr;

    // Sync Live Banner
    if (liveScoreUI) liveScoreUI.innerText = scoreStr;
    if (liveBallsUI) liveBallsUI.innerText = ballsRemaining.toString();
    if (liveTargetUI) liveTargetUI.innerText = matchTarget.toString();
}

function showMatchMsg(text, duration = 1000) {
    if (!matchMsg) return;
    matchMsg.innerText = text;
    matchMsg.classList.remove("hidden");
    setTimeout(() => { matchMsg.classList.add("hidden"); }, duration);
}

function createSparks(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            alpha: 1,
            color
        });
    }
}

function startGame() {
    score = 0; wickets = 0; ballsFaced = 0;
    gameState = "PLAY";
    if (startScreen) startScreen.classList.add("hidden");
    if (gameOverScreen) gameOverScreen.classList.add("hidden");
    spawnBall();
}

if (btnLeft) btnLeft.onclick = () => { if (gameState === "PLAY") batsman.swing(); };
if (btnRight) btnRight.onclick = () => { if (gameState === "PLAY") batsman.swing(); };

if (startBtn) startBtn.onclick = startGame;
if (restartBtn) restartBtn.onclick = () => { currentLevel = 1; initLevel(); startGame(); };
if (nextMatchBtn) nextMatchBtn.onclick = () => { currentLevel++; initLevel(); startGame(); };

window.addEventListener("resize", resize);
resize();
gameLoop();

function gameLoop() {
    if (window.innerWidth >= window.innerHeight) {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}
