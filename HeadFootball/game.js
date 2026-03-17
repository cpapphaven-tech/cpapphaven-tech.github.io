const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// Responsive Canvas
let CW, CH;
function resize() {
    CW = window.innerWidth;
    CH = window.innerHeight;
    canvas.width = CW;
    canvas.height = CH;
}
window.addEventListener("resize", resize);
resize();

// UI Elements
const p1ScoreEl = document.getElementById("score-p1");
const p2ScoreEl = document.getElementById("score-p2");
const matchMsg = document.getElementById("match-message");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const winnerText = document.getElementById("winner-text");
const finalScore = document.getElementById("final-score");

document.getElementById("start-btn").addEventListener("click", resetMatch);
document.getElementById("restart-btn").addEventListener("click", resetMatch);

// State
let score1 = 0;
let score2 = 0;
let gameState = "MENU"; // MENU, PLAY, GOAL, OVER
const MAX_SCORE = 5;

// Difficulty scaling
let matchCount = parseInt(localStorage.getItem('headfootball_matches') || '0');
let difficulty = 0.5; // Default multiplier

function updateDifficulty() {
    // 0.5 for match 0, up to 1.0 at match 5+
    difficulty = Math.min(1.0, 0.5 + (matchCount * 0.12));
    console.log(`Current Match: ${matchCount}, AI Difficulty: ${difficulty}`);
}
updateDifficulty();

// Physics Config
const GRAVITY = 0.45;
const FRICTION = 0.992; // Less ground friction
const AIR_FRICTION = 0.997; // Better glide
const BOUNCE = 0.85; // Higher bounce

// Input
const keys = { Left: false, Right: false, Jump: false, Kick: false };

let gameStartTime = null;
let durationSent = false;
let gameStartedFlag = false;
let gameRecordTime = null;

// --- Supabase Config ---
const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;

// --- Session Tracking ---
let sessionId = null;
let sessionRowId = null;


// Start session on load
async function initSupabase() {
    if (!window.supabase) {
        setTimeout(initSupabase, 500);
        return;
    }

    if (!supabaseClient) {
        const { createClient } = window.supabase;
        supabaseClient = createClient(supabaseUrl, supabaseKey);
        console.log("✅ Supabase ready");
    }


    await startGameSession();
    await markSessionStarted();
}




function generateSessionId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).substr(2, 8)
    );
}

function getOSKey() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    if (/Win/i.test(ua)) return "windows";
    if (/Mac/i.test(ua)) return "mac";
    if (/Linux/i.test(ua)) return "linux";
    return "unknown";
}

function getOS() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    if (/Win/i.test(ua)) return "Windows";
    if (/Mac/i.test(ua)) return "Mac";
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown";
}

function getBrowser() {
    const ua = navigator.userAgent;

    if (/Edg/i.test(ua)) return "Edge";
    if (/OPR|Opera/i.test(ua)) return "Opera";
    if (/Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)) return "Chrome";
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
    if (/Firefox/i.test(ua)) return "Firefox";
    if (/MSIE|Trident/i.test(ua)) return "Internet Explorer";

    return "Unknown";
}


function getPlacementId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('utm_content') ||
        urlParams.get('placementid') ||
        "unknown";
}

function sendDurationOnExit(reason) {
    if (gameStartTime && !durationSent && window.trackGameEvent) {
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);
        const placementId = getPlacementId();
        window.trackGameEvent(`game_duration_headfootball_${seconds}_${reason}_${getBrowser()}`, {
            seconds,
            end_reason: reason,
            os: getOS(),
            placement_id: placementId
        });
        // Update session in Supabase
        updateGameSession({
            duration_seconds: seconds,
            bounced: !gameStartedFlag,
            placement_id: placementId,
            end_reason: reason
        });
        durationSent = true;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {


        sendDurationOnExit("background_headfootball");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_headfootball");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        const placementId = getPlacementId();
        window.trackGameEvent(`exit_before_game_headfootball_${osKey}`, {
            os: getOS(),
            placement_id: placementId
        });
        // Update session as bounced
        updateGameSession({
            bounced: true,
            placement_id: placementId,
            end_reason: "exit_before_game"
        });
    }
});

async function getCountry() {
    try {
        // Direct fetch to ipapi.co which is CORS friendly
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        return data.country_name || data.country || "Unknown";
    } catch (error) {
        console.warn("Primary country detection failed, trying fallback...", error);
        try {
            // Fallback to Cloudflare's trace which is extremely reliable
            const cfResp = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
            const cfText = await cfResp.text();
            const locLine = cfText.split("\n").find(line => line.startsWith("loc="));
            return locLine ? locLine.split("=")[1] : "Unknown";
        } catch (e) {
            return "Unknown";
        }
    }
}

// --- Supabase Session Tracking Functions ---
async function startGameSession() {
    if (!supabaseClient) return;

    console.log("✅ startGameSession");

    sessionId = generateSessionId();
    const placementId = getPlacementId();
    const os = getOS();
    const browser = getBrowser();
    const userAgent = navigator.userAgent;
    const gameSlug = "headfootball";
    const country = await getCountry();
    // Country detection can be added if needed
    try {
        await supabaseClient
            .from('game_sessions')
            .insert([
                {
                    session_id: sessionId,
                    game_slug: gameSlug,
                    placement_id: placementId,
                    user_agent: userAgent,
                    os: os,
                    browser: browser,
                    country: country,
                    started_game: false,
                    bounced: false
                }
            ]);
    } catch (e) { }
}

async function markSessionStarted() {
    if (!supabaseClient || !sessionId) return;
    try {
        await supabaseClient
            .from('game_sessions')
            .update({ started_game: true })
            .eq('session_id', sessionId);
    } catch (e) { }
}

async function updateGameSession(fields) {
    if (!supabaseClient || !sessionId) return;
    try {
        await supabaseClient
            .from('game_sessions')
            .update(fields)
            .eq('session_id', sessionId);
    } catch (e) { }
}



window.addEventListener("keydown", e => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.Left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.Right = true;
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.Jump = true;
    if (e.code === "Space") keys.Kick = true;
});

window.addEventListener("keyup", e => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.Left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.Right = false;
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.Jump = false;
    if (e.code === "Space") keys.Kick = false;
});

// Mobile Controls - Improved with full touch handling
function setupTouch(id, key) {
    const btn = document.getElementById(id);
    if (!btn) return;

    // Use both touch and mouse for testing but prevent default to avoid ghost clicks
    const onStart = (e) => {
        e.preventDefault();
        keys[key] = true;
        if (navigator.vibrate) navigator.vibrate(10); // Subtle haptic feedback
    };

    const onEnd = (e) => {
        e.preventDefault();
        keys[key] = false;
    };

    btn.addEventListener("touchstart", onStart, { passive: false });
    btn.addEventListener("touchend", onEnd, { passive: false });
    btn.addEventListener("touchcancel", onEnd, { passive: false });

    // Fallback for mouse if needed (though on mobile touch takes precedence)
    btn.addEventListener("mousedown", onStart);
    btn.addEventListener("mouseup", onEnd);
    btn.addEventListener("mouseleave", onEnd);
}
setupTouch("btn-left", "Left");
setupTouch("btn-right", "Right");
setupTouch("btn-jump", "Jump");
setupTouch("btn-kick", "Kick");

// Orientation Support
window.addEventListener("orientationchange", () => {
    setTimeout(resize, 200);
});

// --- GAME OBJECTS ---

class Ball {
    constructor(x, y) {
        this.baseRadius = 25; // Base size for 1080p
        this.r = this.baseRadius;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.mass = 1;
        this.rotation = 0;
    }

    update() {
        this.vy += GRAVITY;
        this.vx *= AIR_FRICTION;
        this.vy *= AIR_FRICTION;

        this.x += this.vx;
        this.y += this.vy;

        // Rotation based on movement
        this.rotation += this.vx * 0.05;

        // Ground collision (dynamic based on CH)
        const groundY = CH - CH * 0.15;
        if (this.y + this.r > groundY) {
            this.y = groundY - this.r;

            // If it hits hard enough, bounce. If very slow, keep a tiny jitter/roll
            if (Math.abs(this.vy) > 2) {
                this.vy *= -BOUNCE;
            } else {
                // Minimum bounce to keep it moving/bouncy instead of flat-freezing
                this.vy = -Math.abs(this.vy) * BOUNCE - (Math.random() * 0.5);
            }
            this.vx *= FRICTION;
        }

        // Ceiling
        if (this.y - this.r < 0) {
            this.y = this.r;
            this.vy *= -BOUNCE;
        }

        // Limits (Walls)
        if (this.x - this.r < 0) {
            this.x = this.r;
            this.vx *= -BOUNCE;
        } else if (this.x + this.r > CW) {
            this.x = CW - this.r;
            this.vx *= -BOUNCE;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000";
        ctx.stroke();

        // Draw simple hexagon pattern for soccer ball look
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            let angle = i * Math.PI / 3;
            let px = Math.cos(angle) * (this.r * 0.5);
            let py = Math.sin(angle) * (this.r * 0.5);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = "#222";
        ctx.fill();

        ctx.restore();
    }
}

class Player {
    constructor(isAI, color, isRightSide) {
        this.isAI = isAI;
        this.color = color;
        this.isRightSide = isRightSide;

        this.baseR = 40;
        this.r = this.baseR; // head radius
        this.x = isRightSide ? CW * 0.75 : CW * 0.25;
        this.y = CH - CH * 0.15 - this.r;
        this.vx = 0;
        this.vy = 0;

        this.speed = 6;
        this.jumpPower = -12;
        this.mass = 2;

        this.kickTimer = 0;
        this.shoeRot = 0;
    }

    update() {
        // Gravity
        this.vy += GRAVITY;
        this.y += this.vy;

        // Ground constraint
        const groundY = CH - CH * 0.15;
        if (this.y + this.r > groundY) {
            this.y = groundY - this.r;
            this.vy = 0;
        }

        // AI Logic
        if (this.isAI) {
            this.runAI();
        } else {
            // Human Input
            if (keys.Left) this.vx = -this.speed;
            else if (keys.Right) this.vx = this.speed;
            else this.vx *= 0.8;

            if (keys.Jump && this.y >= groundY - this.r - 2) {
                this.vy = this.jumpPower;
            }

            if (keys.Kick && this.kickTimer <= 0) {
                this.kickTimer = 20; // Handle kick animation/hitbox
            }
        }

        this.x += this.vx;

        // Bounds constraints (Keep AI in right half, Player in left half typically, but let them cross slightly)
        // Actually, head football allows full court crossing, but let's restrict to slightly over the net
        let minX = this.r;
        let maxX = CW - this.r;

        if (this.x < minX) this.x = minX;
        if (this.x > maxX) this.x = maxX;

        // Kick logic
        if (this.kickTimer > 0) {
            this.kickTimer--;
            this.shoeRot = Math.sin((20 - this.kickTimer) * 0.3) * (this.isRightSide ? 1 : -1);
        } else {
            this.shoeRot = 0;
        }
    }

    runAI() {
        const bx = ball.x;
        const by = ball.y;

        // Difficulty-based speed and reaction
        const aiSpeed = this.speed * 0.8 * difficulty;
        const jumpProb = 0.08 * difficulty;
        const kickProb = 0.15 * difficulty;

        // Attack threshold (harder AI is more aggressive)
        const attackLine = CW * (1 - 0.8 * difficulty);

        // Very basic AI that follows the ball
        if (bx > attackLine) { // Only attack if in bounds
            let targetX = bx + 20; // Try to stay slightly behind to hit it left

            if (this.x < targetX) this.vx = aiSpeed;
            else if (this.x > targetX + 50) this.vx = -aiSpeed;
            else this.vx *= 0.8;

            // Jump if ball is high
            if (by < this.y - 50 && ball.vy > 0 && Math.abs(this.x - bx) < 100) {
                if (this.y >= CH - CH * 0.15 - this.r - 2 && Math.random() < jumpProb) {
                    this.vy = this.jumpPower;
                }
            }

            // Kick if close
            if (Math.abs(this.x - bx) < 80 && Math.abs(this.y - by) < 80) {
                if (this.kickTimer <= 0 && Math.random() < kickProb) {
                    this.kickTimer = 20;
                }
            }
        } else {
            // Defend goal
            let defX = CW * (0.95 - (0.1 * difficulty));
            if (this.x < defX) this.vx = aiSpeed * 0.6;
            else if (this.x > defX + 20) this.vx = -aiSpeed * 0.6;
            else this.vx *= 0.8;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Body (Ellipse)
        ctx.beginPath();
        // ctx.ellipse(0, 0, this.r, this.r * 1.2, 0, 0, Math.PI * 2);
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#000";
        ctx.stroke();

        // Eyes
        ctx.fillStyle = "#fff";
        let eyeOffset = this.isRightSide ? -10 : 10;
        ctx.beginPath();
        ctx.arc(eyeOffset, -10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(eyeOffset + (this.isRightSide ? -3 : 3), -10, 4, 0, Math.PI * 2);
        ctx.fill();

        // Shoe
        ctx.save();
        ctx.translate(this.isRightSide ? -10 : 10, this.r * 0.8);
        ctx.rotate(this.shoeRot);
        ctx.fillStyle = "#444";
        ctx.fillRect(this.isRightSide ? -30 : 0, -10, 30, 20);
        ctx.strokeRect(this.isRightSide ? -30 : 0, -10, 30, 20);
        ctx.restore();

        ctx.restore();
    }
}

// Global Entities
let ball, p1, p2;
let goalWidth = 100;
let goalHeight = 200;

function checkCollisions() {
    // 1. Ball vs Players (Circle to Circle)
    [p1, p2].forEach(p => {
        let dx = ball.x - p.x;
        let dy = ball.y - p.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let minDist = ball.r + p.r;

        if (dist < minDist) {
            // Push out
            let overlap = minDist - dist;
            let dirX = dx / dist;
            let dirY = dy / dist;

            ball.x += dirX * overlap * 0.5;
            ball.y += dirY * overlap * 0.5;

            // Simple restitution
            let relVx = ball.vx - p.vx;
            let relVy = ball.vy - p.vy;
            let speed = relVx * dirX + relVy * dirY;
            if (speed < 0) {
                let current_restitution = 0.8;
                let impulse = -(1 + current_restitution) * speed;

                // Add shoe hit boost if kicking and hitting correct side of body
                if (p.kickTimer > 0) {
                    if ((p.isRightSide && dx < 0) || (!p.isRightSide && dx > 0)) {
                        impulse += 12; // INCREASED KICK BOOST!
                    }
                }

                ball.vx += dirX * impulse;
                ball.vy += dirY * impulse;
                // Add some spin/upward force to kicks
                if (p.kickTimer > 0) {
                    ball.vy -= 5;
                }
            }
        }
    });

    // 2. Goal Collisions
    const groundY = CH - CH * 0.15;
    goalWidth = Math.max(CW * 0.08, 60);
    goalHeight = Math.max(CH * 0.25, 120);

    // Left Goal Structure Hitbox (Top crossbar)
    if (ball.x < goalWidth + ball.r && ball.y > groundY - goalHeight - ball.r && ball.y < groundY - goalHeight + ball.r) {
        if (ball.vy > 0) ball.y = groundY - goalHeight - ball.r, ball.vy *= -BOUNCE;
        else if (ball.vx < 0 && ball.x > goalWidth) ball.x = goalWidth + ball.r, ball.vx *= -BOUNCE;
    }

    // Right Goal Structure Hitbox
    if (ball.x > CW - goalWidth - ball.r && ball.y > groundY - goalHeight - ball.r && ball.y < groundY - goalHeight + ball.r) {
        if (ball.vy > 0) ball.y = groundY - goalHeight - ball.r, ball.vy *= -BOUNCE;
        else if (ball.vx > 0 && ball.x < CW - goalWidth) ball.x = CW - goalWidth - ball.r, ball.vx *= -BOUNCE;
    }

    // 3. Goal Scoring Check
    if (gameState === "PLAY") {
        if (ball.y > groundY - goalHeight + 10) { // Inside goal vertically
            if (ball.x < goalWidth) {
                handleGoal(2); // P2 SCORES
            } else if (ball.x > CW - goalWidth) {
                handleGoal(1); // P1 SCORES
            }
        }
    }
}

function handleGoal(scorer) {
    gameState = "GOAL";
    if (scorer === 1) score1++;
    if (scorer === 2) score2++;

    p1ScoreEl.innerText = score1;
    p2ScoreEl.innerText = score2;

    matchMsg.innerText = "GOAL!";
    matchMsg.classList.remove("hidden");

    if (navigator.vibrate) navigator.vibrate([50, 30, 50]); // Enthusiastic goal vibration

    if (score1 >= MAX_SCORE || score2 >= MAX_SCORE) {
        setTimeout(() => {
            endMatch(score1 >= MAX_SCORE ? 1 : 2);
        }, 1500);
    } else {
        setTimeout(resetRound, 2000);
    }
}

function endMatch(winner) {
    gameState = "OVER";
    matchMsg.classList.add("hidden");

    winnerText.innerText = winner === 1 ? "YOU WON!" : "AI WON!";
    finalScore.innerText = `${score1} - ${score2}`;
    gameOverScreen.classList.remove("hidden");

    // Increment Match Count for difficulty scaling
    matchCount++;
    localStorage.setItem('headfootball_matches', matchCount);
    updateDifficulty();

    const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
    if (seconds > (window.PMG_TICK_RATE || 60)) {
            syncPMGLayout();
            gameRecordTime = Date.now(); 
    }
}

function resetMatch() {

    console.log("✅ resetMatch");

    initSupabase();

    
    gameStartTime = Date.now();   // ⏱ start timer
    gameRecordTime = Date.now();
    

    score1 = 0;
    score2 = 0;
    p1ScoreEl.innerText = score1;
    p2ScoreEl.innerText = score2;
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    resetRound();
}

function resetRound() {
    matchMsg.classList.add("hidden");

    // Scale objects relatively
    const bR = Math.min(CW, CH) * 0.03 + 8; // Dynamic ball size
    const pR = Math.min(CW, CH) * 0.05 + 10; // Dynamic player size

    ball = new Ball(CW / 2, CH * 0.3);
    ball.r = bR;

    p1 = new Player(false, "#fe5b5b", false);
    p2 = new Player(true, "#4facfe", true);

    p1.r = p2.r = pR;
    p1.x = CW * 0.25;
    p2.x = CW * 0.75;
    p1.y = CH - CH * 0.15 - pR;
    p2.y = CH - CH * 0.15 - pR;

    gameState = "PLAY";
}

function drawCourt() {
    const groundY = CH - CH * 0.15;

    // Pitch background
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(0, groundY, CW, CH * 0.15);

    // Dark grass stripes
    ctx.fillStyle = "#27ae60";
    for (let i = 0; i < CW; i += 60) {
        if ((i / 60) % 2 === 0) ctx.fillRect(i, groundY, 60, CH * 0.15);
    }

    // Court Lines (White)
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(CW, groundY);
    ctx.stroke();

    // Center line & circle
    ctx.beginPath();
    ctx.moveTo(CW / 2, groundY);
    ctx.lineTo(CW / 2, groundY + CH);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(CW / 2, groundY, Math.min(CW * 0.1, 100), 0, Math.PI);
    ctx.stroke();

    // Goals (Nets)
    goalWidth = Math.max(CW * 0.08, 60);
    goalHeight = Math.max(CH * 0.25, 120);

    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 10;

    // Left Goal
    ctx.beginPath();
    ctx.moveTo(0, groundY - goalHeight);
    ctx.lineTo(goalWidth, groundY - goalHeight);
    ctx.lineTo(goalWidth, groundY);
    ctx.stroke();

    // Right Goal
    ctx.beginPath();
    ctx.moveTo(CW, groundY - goalHeight);
    ctx.lineTo(CW - goalWidth, groundY - goalHeight);
    ctx.lineTo(CW - goalWidth, groundY);
    ctx.stroke();

    // Net pattern (Simple)
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    for (let i = 0; i < goalHeight; i += 15) {
        ctx.beginPath(); ctx.moveTo(0, groundY - i); ctx.lineTo(goalWidth, groundY - i); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(CW, groundY - i); ctx.lineTo(CW - goalWidth, groundY - i); ctx.stroke();
    }
    for (let i = 0; i < goalWidth; i += 15) {
        ctx.beginPath(); ctx.moveTo(i, groundY - goalHeight); ctx.lineTo(i, groundY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(CW - i, groundY - goalHeight); ctx.lineTo(CW - i, groundY); ctx.stroke();
    }
}



// MAIN LOOP
function gameLoop() {
    requestAnimationFrame(gameLoop);


    // Clear Screen
    // Gradient Sky
    let grad = ctx.createLinearGradient(0, 0, 0, CH);
    grad.addColorStop(0, "#192a56"); // Night sky
    grad.addColorStop(1, "#273c75");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    if (gameState === "PLAY" || gameState === "GOAL") {
        p1.update();
        p2.update();
        ball.update();
        checkCollisions();
    }

    drawCourt();

    if (gameState !== "MENU") {
        p1.draw(ctx);
        p2.draw(ctx);
        ball.draw(ctx);
    }
}

gameLoop();
