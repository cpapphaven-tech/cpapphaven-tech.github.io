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
const matchMsg = document.getElementById("match-message");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const winnerText = document.getElementById("winner-text");
const finalScore = document.getElementById("final-score");

document.getElementById("start-btn").addEventListener("click", resetMatch);
document.getElementById("restart-btn").addEventListener("click", resetMatch);

// Auto-start bypass
setTimeout(resetMatch, 200);

// State
let score1 = 0;
let score2 = 0;
let currentRound = 0;
let playerPoints = Array(10).fill(null);
let aiPoints = Array(10).fill(null);
let gameState = "MENU"; // MENU, PLAY, POINT, OVER

function updateScoreboard() {
    const pFrames = document.getElementById("player-frames");
    const aFrames = document.getElementById("ai-frames");
    if (!pFrames || !aFrames) return;
    
    let pHTML = '';
    let aHTML = '';
    
    for (let i = 0; i < 10; i++) {
        pHTML += `<div class="frame-box ${i === currentRound ? 'active-frame' : ''}">
            <div class="frame-number">${i+1}</div>
            <div class="frame-bottom">${playerPoints[i] !== null ? playerPoints[i] : ''}</div>
        </div>`;
        aHTML += `<div class="frame-box ${i === currentRound ? 'active-frame' : ''}">
            <div class="frame-number">${i+1}</div>
            <div class="frame-bottom">${aiPoints[i] !== null ? aiPoints[i] : ''}</div>
        </div>`;
    }
    
    pFrames.innerHTML = pHTML;
    aFrames.innerHTML = aHTML;
    
    const pTot = document.getElementById("player-total");
    const aTot = document.getElementById("ai-total");
    if(pTot) pTot.innerText = score1;
    if(aTot) aTot.innerText = score2;
}

// Difficulty scaling
let matchCount = parseInt(localStorage.getItem('volleyball_matches') || '0');
let difficulty = 0.5; // Default multiplier

function updateDifficulty() {
    difficulty = Math.min(1.0, 0.5 + (matchCount * 0.12));
    console.log(`Current Match: ${matchCount}, AI Difficulty: ${difficulty}`);
}
updateDifficulty();

// Physics Config
const GRAVITY = 0.45;
const FRICTION = 0.992;
const AIR_FRICTION = 0.997;
const BOUNCE = 0.85;

// Input
const keys = { Left: false, Right: false, Jump: false, Kick: false };

let mouseX = window.innerWidth * 0.25;
let mouseY = window.innerHeight * 0.85;

window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});
window.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    mouseX = touch.clientX;
    mouseY = touch.clientY;
}, {passive: true});

let gameStartTime = null;
let durationSent = false;
let gameStartedFlag = false;
let gameRecordTime = null;

// --- Supabase Config ---
const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;

let sessionId = null;
let sessionRowId = null;

async function initSupabase() {
    if (!window.supabase) {
        setTimeout(initSupabase, 500);
        return;
    }
    if (!supabaseClient) {
        const { createClient } = window.supabase;
        supabaseClient = createClient(supabaseUrl, supabaseKey);
    }
    await startGameSession();
    await markSessionStarted();
}

function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
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
    return urlParams.get('utm_content') || urlParams.get('placementid') || "unknown";
}

function sendDurationOnExit(reason) {
    if (gameStartTime && !durationSent && window.trackGameEvent) {
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);
        const placementId = getPlacementId();
        window.trackGameEvent(`game_duration_volleyballarena_${seconds}_${reason}_${getBrowser()}`, {
            seconds,
            end_reason: reason,
            os: getOS(),
            placement_id: placementId
        });
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
    if (document.hidden) sendDurationOnExit("background_volleyballarena");
});

window.addEventListener("beforeunload", () => {
    sendDurationOnExit("tab_close_volleyballarena");
    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        const placementId = getPlacementId();
        window.trackGameEvent(`exit_before_game_volleyballarena_${osKey}`, {
            os: getOS(),
            placement_id: placementId
        });
        updateGameSession({ bounced: true, placement_id: placementId, end_reason: "exit_before_game" });
    }
});

async function getCountry() {
    try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        return data.country_name || data.country || "Unknown";
    } catch (error) {
        try {
            const cfResp = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
            const cfText = await cfResp.text();
            const locLine = cfText.split("\n").find(line => line.startsWith("loc="));
            return locLine ? locLine.split("=")[1] : "Unknown";
        } catch (e) { return "Unknown"; }
    }
}

async function startGameSession() {
    if (!supabaseClient) return;
    sessionId = generateSessionId();
    const placementId = getPlacementId();
    const os = getOS();
    const browser = getBrowser();
    const userAgent = navigator.userAgent;
    const gameSlug = "volleyballarena";
    const country = await getCountry();
    try {
        await supabaseClient.from('game_sessions').insert([{
            session_id: sessionId, game_slug: gameSlug, placement_id: placementId,
            user_agent: userAgent, os: os, browser: browser, country: country,
            started_game: false, bounced: false
        }]);
    } catch (e) { }
}

async function markSessionStarted() {
    if (!supabaseClient || !sessionId) return;
    try { await supabaseClient.from('game_sessions').update({ started_game: true }).eq('session_id', sessionId); } catch (e) { }
}

async function updateGameSession(fields) {
    if (!supabaseClient || !sessionId) return;
    try { await supabaseClient.from('game_sessions').update(fields).eq('session_id', sessionId); } catch (e) { }
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

// Allow mouse click on screen to hit (same as Space)
window.addEventListener("mousedown", (e) => {
    // Only hit if they aren't clicking the UI buttons
    if (e.target.tagName !== 'BUTTON' && !e.target.closest('#mobile-controls') && !e.target.closest('a')) {
        keys.Kick = true;
    }
});
window.addEventListener("mouseup", () => {
    keys.Kick = false;
});
window.addEventListener("touchstart", (e) => {
    if (e.target.tagName !== 'BUTTON' && !e.target.closest('#mobile-controls') && !e.target.closest('a')) {
        keys.Kick = true;
    }
}, {passive: true});
window.addEventListener("touchend", (e) => {
    if (e.target.tagName !== 'BUTTON' && !e.target.closest('#mobile-controls') && !e.target.closest('a')) {
        keys.Kick = false;
    }
}, {passive: true});

function setupTouch(id, key) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const onStart = (e) => { e.preventDefault(); keys[key] = true; if (navigator.vibrate) navigator.vibrate(10); };
    const onEnd = (e) => { e.preventDefault(); keys[key] = false; };
    btn.addEventListener("touchstart", onStart, { passive: false });
    btn.addEventListener("touchend", onEnd, { passive: false });
    btn.addEventListener("touchcancel", onEnd, { passive: false });
    btn.addEventListener("mousedown", onStart);
    btn.addEventListener("mouseup", onEnd);
    btn.addEventListener("mouseleave", onEnd);
}
setupTouch("btn-left", "Left");
setupTouch("btn-right", "Right");
setupTouch("btn-jump", "Jump");
setupTouch("btn-hit", "Kick");

window.addEventListener("orientationchange", () => setTimeout(resize, 200));

class Ball {
    constructor(x, y) {
        this.baseRadius = 25;
        this.r = this.baseRadius;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.mass = 1;
        this.rotation = 0;
    }

    update() {
        this.vy += GRAVITY * 0.2; // Extra slow gravity
        this.vx *= AIR_FRICTION * 0.98; // Extra drag
        this.vy *= AIR_FRICTION * 0.98;

        this.x += this.vx;
        this.y += this.vy;

        this.rotation += this.vx * 0.05;

        const groundY = CH - CH * 0.15;
        if (this.y + this.r > groundY) {
            this.y = groundY - this.r;
        }

        if (this.y - this.r < 0) {
            this.y = this.r;
            this.vy *= -BOUNCE;
        }

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

        ctx.beginPath();
        ctx.moveTo(0, -this.r); ctx.bezierCurveTo(this.r/2, -this.r/2, this.r/2, this.r/2, 0, this.r);
        ctx.moveTo(0, -this.r); ctx.bezierCurveTo(-this.r/2, -this.r/2, -this.r/2, this.r/2, 0, this.r);
        ctx.moveTo(-this.r, 0); ctx.bezierCurveTo(-this.r/2, this.r/2, this.r/2, this.r/2, this.r, 0);
        ctx.stroke();
        
        ctx.restore();
    }
}

class Player {
    constructor(isAI, color, isRightSide) {
        this.isAI = isAI;
        this.color = color;
        this.isRightSide = isRightSide;

        this.baseR = 40;
        this.r = this.baseR;
        this.x = isRightSide ? CW * 0.75 : CW * 0.25;
        this.y = CH - CH * 0.15 - this.r;
        this.vx = 0;
        this.vy = 0;

        this.speed = 7;
        this.jumpPower = -14;
        this.mass = 2;

        this.kickTimer = 0;
        this.handRot = 0;
    }

    update() {
        const groundY = CH - CH * 0.15;

        // AI Logic vs User Mouse Logic
        if (this.isAI) {
            this.vy += GRAVITY;
            this.y += this.vy;

            if (this.y + this.r > groundY) {
                this.y = groundY - this.r;
                this.vy = 0;
            }

            this.runAI();
            this.x += this.vx;

            let minX = CW / 2 + 10 + this.r;
            let maxX = CW - this.r;
            if (this.x < minX) this.x = minX;
            if (this.x > maxX) this.x = maxX;
            
            if (this.kickTimer > 0) {
                this.kickTimer--;
                this.handRot = Math.sin((20 - this.kickTimer) * 0.3) * (this.isRightSide ? 1 : -1) * 1.5;
            } else {
                this.handRot = 0;
            }
        } else {
            // Player tracks directly to pointer
            let targetX = mouseX;
            let targetY = mouseY;
            
            let netWidth = 20;
            let minX = this.r;
            let maxX = CW / 2 - netWidth/2 - this.r;
            
            if (targetX < minX) targetX = minX;
            if (targetX > maxX) targetX = maxX;

            let maxY = groundY - this.r;
            const netHeight = Math.max(CH * 0.35, 180);
            let minY = groundY - netHeight; // Player cannot move higher than the net
            
            if (targetY > maxY) targetY = maxY;
            if (targetY < minY) targetY = minY;

            // Interpolate position smoothly to enable velocity for physics interaction
            let oldX = this.x;
            let oldY = this.y;

            this.x += (targetX - this.x) * 0.35;
            this.y += (targetY - this.y) * 0.35;

            // Give it vx and vy based on delta to strongly launch ball
            this.vx = this.x - oldX;
            this.vy = this.y - oldY;
            
            // Automatically reset pointer kicks
            if (keys.Kick && this.kickTimer <= 0) {
                this.kickTimer = 20;
            }
            if (this.kickTimer > 0) {
                this.kickTimer--;
                this.handRot = Math.sin((20 - this.kickTimer) * 0.3) * -1.5;
            } else {
                this.handRot = 0;
            }
        }
    }

    runAI() {
        const bx = ball.x;
        const by = ball.y;

        const aiSpeed = this.speed * 0.8 * difficulty;
        const jumpProb = 0.1 * difficulty;
        const punchProb = 0.2 * difficulty;

        if (bx > CW/2) { 
            let targetX = bx + 35; // Stay to the right so it bumps the ball left (over net)
            if (this.x < targetX) this.vx = aiSpeed;
            else if (this.x > targetX + 15) this.vx = -aiSpeed;
            else this.vx *= 0.8;

            if (by < this.y - 40 && ball.vy > 0 && Math.abs(this.x - bx) < 120) {
                if (this.y >= CH - CH * 0.15 - this.r - 2 && Math.random() < jumpProb) {
                    this.vy = this.jumpPower;
                }
            }

            if (Math.abs(this.x - bx) < 90 && Math.abs(this.y - by) < 100) {
                if (this.kickTimer <= 0 && Math.random() < punchProb) {
                    this.kickTimer = 20;
                }
            }
        } else {
            let defX = CW * (0.75 - (0.1 * difficulty));
            if (this.x < defX) this.vx = aiSpeed * 0.6;
            else if (this.x > defX + 20) this.vx = -aiSpeed * 0.6;
            else this.vx *= 0.8;
            
            if(ball.vx > 5 && by < this.y) {
               this.vx = -aiSpeed; 
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#000";
        ctx.stroke();

        ctx.fillStyle = "#fff";
        let eyeOffset = this.isRightSide ? -12 : 12;
        ctx.beginPath();
        ctx.arc(eyeOffset, -10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(eyeOffset + (this.isRightSide ? -4 : 4), -10, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(this.isRightSide ? -15 : 15, this.r * 0.2);
        ctx.rotate(this.handRot);
        ctx.beginPath();
        ctx.arc(this.isRightSide ? -20 : 20, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = "#fdd835";
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
}

let ball, p1, p2;

function checkCollisions() {
    [p1, p2].forEach(p => {
        let dx = ball.x - p.x;
        let dy = ball.y - p.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let minDist = ball.r + p.r;

        if (dist < minDist) {
            let overlap = minDist - dist;
            let dirX = dx / dist;
            let dirY = dy / dist;

            ball.x += dirX * overlap * 0.5;
            ball.y += dirY * overlap * 0.5;

            let relVx = ball.vx - p.vx;
            let relVy = ball.vy - p.vy;
            let speed = relVx * dirX + relVy * dirY;
            
            if (speed < 0) {
                let current_restitution = 0.9; 
                let impulse = -(1 + current_restitution) * speed;

                if (p.kickTimer > 0) {
                    impulse += 10;
                    ball.vy -= 7;
                }

                ball.vx += dirX * impulse;
                ball.vy += dirY * impulse;
            }
        }
    });

    const groundY = CH - CH * 0.15;
    const netHeight = Math.max(CH * 0.35, 180);
    const netWidth = 20;
    const netX = CW / 2;

    let nTopY = groundY - netHeight;
    let dx = ball.x - netX;
    let dy = ball.y - nTopY;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if(dist < ball.r + netWidth/2) {
       let overlap = (ball.r + netWidth/2) - dist;
       let dirX = dx/dist; let dirY = dy/dist;
       ball.x += dirX * overlap;
       ball.y += dirY * overlap;
       
       let speed = ball.vx * dirX + ball.vy * dirY;
       if(speed < 0) {
          ball.vx -= (1 + BOUNCE) * speed * dirX;
          ball.vy -= (1 + BOUNCE) * speed * dirY;
       }
    }

    if (ball.y > nTopY) {
        if (ball.x + ball.r > netX - netWidth/2 && ball.x - ball.r < netX + netWidth/2) {
            if (ball.x < netX) {
                ball.x = netX - netWidth/2 - ball.r;
                ball.vx *= -BOUNCE;
            } else {
                ball.x = netX + netWidth/2 + ball.r;
                ball.vx *= -BOUNCE;
            }
        }
    }

    if (gameState === "PLAY") {
        if (ball.y >= groundY - ball.r) {
            if (ball.x < CW / 2) {
                handleGoal(2);
            } else {
                handleGoal(1);
            }
        }
    }
}

function handleGoal(scorer) {
    gameState = "POINT";

    if (scorer === 1) {
        playerPoints[currentRound] = 1;
        aiPoints[currentRound] = 0;
        score1++;
    } else {
        playerPoints[currentRound] = 0;
        aiPoints[currentRound] = 1;
        score2++;
    }
    
    updateScoreboard();

    matchMsg.innerText = "POINT!";
    matchMsg.classList.remove("hidden");

    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

    currentRound++;

    if (currentRound >= 10) {
        setTimeout(() => {
            endMatch(score1 >= score2 ? 1 : 2);
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

    matchCount++;
    localStorage.setItem('volleyball_matches', matchCount);
    updateDifficulty();

    const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
    if (seconds > (window.PMG_TICK_RATE || 60)) {
            syncPMGLayout();
            gameRecordTime = Date.now(); 
    }
}

function resetMatch() {
    initSupabase();
    
    gameStartTime = Date.now();   
    gameRecordTime = Date.now();
    
    score1 = 0;
    score2 = 0;
    currentRound = 0;
    playerPoints = Array(10).fill(null);
    aiPoints = Array(10).fill(null);
    updateScoreboard();

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    resetRound();
}

function resetRound() {
    matchMsg.classList.add("hidden");

    const bR = Math.min(CW, CH) * 0.03 + 8;
    const pR = Math.min(CW, CH) * 0.05 + 10;

    let p1Serves = (currentRound % 2 !== 0); // AI always serves on round 0 (even), player on odd

    ball = new Ball(p1Serves ? CW * 0.25 : CW * 0.75, CH * 0.3);
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

    ctx.fillStyle = "#f4a460";
    ctx.fillRect(0, groundY, CW, CH * 0.15);

    ctx.fillStyle = "#e6944b";
    for (let i = 0; i < CW; i += 80) {
        if ((i / 80) % 2 === 0) ctx.fillRect(i, groundY, 80, CH * 0.15);
    }

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(CW, groundY);
    ctx.stroke();

    const netHeight = Math.max(CH * 0.35, 180);
    const netWidth = 16;
    const poleWidth = 8;
    
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(CW/2 - poleWidth/2, groundY - netHeight, poleWidth, netHeight);
    
    ctx.fillStyle = "#fff";
    ctx.fillRect(CW/2 - netWidth/2, groundY - netHeight, netWidth, netHeight * 0.6);
    
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < netHeight * 0.6; i+=10) {
        ctx.moveTo(CW/2 - netWidth/2, groundY - netHeight + i);
        ctx.lineTo(CW/2 + netWidth/2, groundY - netHeight + i);
    }
    for(let j = 0; j<netWidth; j+=5) {
        ctx.moveTo(CW/2 - netWidth/2 + j, groundY - netHeight);
        ctx.lineTo(CW/2 - netWidth/2 + j, groundY - netHeight * 0.4); 
    }
    ctx.stroke();

}

function gameLoop() {
    requestAnimationFrame(gameLoop);

    let grad = ctx.createLinearGradient(0, 0, 0, CH);
    grad.addColorStop(0, "#ff7e5f");
    grad.addColorStop(1, "#feb47b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    if (gameState === "PLAY" || gameState === "POINT") {
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
