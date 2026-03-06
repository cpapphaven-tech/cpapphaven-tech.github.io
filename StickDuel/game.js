/**
 * Stick Duel Battle - Game Logic
 * Professional Physics-based stickman combat
 */

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const hdrCanvas = document.getElementById("hdr-canvas");
const hctx = hdrCanvas.getContext("2d");

// --- Game Settings ---
const GRAVITY = 0; // Zero-G Flight
const FRICTION = 0.94; // Stable flight braking
const AIR_RESISTANCE = 0.94;
const MAX_HEALTH = 100;
const AMMO_CAPACITY = 20;

const PLAYER_SPEED = 0.4; // Thrust power
const MAX_SPEED = 5; // Flight speed cap
const BULLET_SPEED = 12; // Adjusted for flight speed
const MIN_DISTANCE = 300; // Minimum distance between duelists

// --- State ---
let CW, CH;
let gameState = "MENU"; // MENU, PLAY, OVER
let score1 = 0, score2 = 0;
let currentLevel = 1;
const MAX_LEVELS = 5;
let matchStartTime;
let particles = [];
let projectiles = [];
let platforms = [];
let keys = { Left: false, Right: false, Up: false, Down: false, Fire: false };

// --- Player & AI ---
let p1, p2;

let gameStartTime = null;
let durationSent = false;
let gameStartedFlag = false;

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
        window.trackGameEvent(`game_duration_stickmanneon_${seconds}_${reason}_${getBrowser()}`, {
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


        sendDurationOnExit("background_stickmanneon");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_headfootball");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        const placementId = getPlacementId();
        window.trackGameEvent(`exit_before_game_stickmanneon_${osKey}`, {
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
    const gameSlug = "stackmanNeon";
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


function resize() {
    CW = window.innerWidth;
    CH = window.innerHeight;
    canvas.width = hdrCanvas.width = CW;
    canvas.height = hdrCanvas.height = CH;
    initPlatforms();
}
window.addEventListener("resize", resize);
resize();

// --- HUD Elements ---
const hpP1 = document.getElementById("hp-p1");
const hpP2 = document.getElementById("hp-p2");
const ammoP1 = document.getElementById("ammo-p1");
const matchTimer = document.getElementById("match-timer");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const winnerText = document.getElementById("winner-text");
const matchMsg = document.getElementById("match-message");

// --- Physics Classes ---

// --- Physics Classes ---

class Entity {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.color = color;
        this.hp = MAX_HEALTH;
        this.width = 30;
        this.height = 60;
        this.onGround = false;
        this.dir = 1; // 1 for right, -1 for left
        this.jumpPower = -10; // SLOWER jump
        this.speed = PLAYER_SPEED;
        this.maxSpeed = MAX_SPEED;
        this.angle = 0; // Arm angle
        this.ammo = AMMO_CAPACITY;
        this.reloadTimer = 0;
        this.fireCooldown = 0;
    }

    update() {
        // Flight Physics
        this.vx *= FRICTION;
        this.vy *= FRICTION;
        this.x += this.vx;
        this.y += this.vy;

        // Platform & Wall Collisions
        this.onGround = false;
        platforms.forEach(plat => {
            // Horizontal Wall Collision
            if (plat.isWall) {
                if (this.y + this.height / 2 > plat.y + 5 && this.y - this.height / 2 < plat.y + plat.h - 5) {
                    if (this.vx > 0 && this.x + this.width / 4 > plat.x && this.x < plat.x) {
                        this.x = plat.x - this.width / 4;
                        this.vx = 0;
                    } else if (this.vx < 0 && this.x - this.width / 4 < plat.x + plat.w && this.x > plat.x + plat.w) {
                        this.x = plat.x + plat.w + this.width / 4;
                        this.vx = 0;
                    }
                }
            }

            // Floor/Top Collision
            if (this.x + this.width / 4 > plat.x && this.x - this.width / 4 < plat.x + plat.w) {
                if (this.vy >= 0 &&
                    this.y + this.height / 2 >= plat.y &&
                    this.y + this.height / 2 - this.vy <= plat.y + 15) {

                    this.y = plat.y - this.height / 2;
                    this.vy = 0;
                    this.onGround = true;
                }
            }
        });

        // OOB Check (Keep on screen)
        if (this.y > CH - this.height) {
            this.y = CH - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        // Screen Bounds
        if (this.x < 0) this.x = 0, this.vx *= -0.5;
        if (this.x > CW) this.x = CW, this.vx *= -0.5;
        if (this.y < 0) this.y = 0, this.vy *= -0.5;
        if (this.y > CH) this.y = CH, this.vy *= -0.5;

        // Repulsion logic to maintain distance between P1 and P2
        if (p1 && p2) {
            const other = (this === p1) ? p2 : p1;
            const dx = this.x - other.x;
            const dist = Math.abs(dx);

            if (dist < MIN_DISTANCE && dist > 0) {
                // Apply a gentle push away from the other player
                const force = (MIN_DISTANCE - dist) * 0.02;
                this.vx += (dx > 0 ? force : -force);
            }
        }

        // Timers
        if (this.fireCooldown > 0) this.fireCooldown--;
        if (this.ammo <= 0 && this.reloadTimer <= 0) this.reloadTimer = 120;
        if (this.reloadTimer > 0) {
            this.reloadTimer--;
            if (this.reloadTimer === 0) this.ammo = AMMO_CAPACITY;
        }
    }

    takeDamage(amt) {
        this.hp -= amt;
        if (this.hp <= 0) {
            this.hp = 0;
            triggerDeath(this);
        }
        createSpark(this.x, this.y, this.color);
    }

    fire() {
        if (this.fireCooldown > 0 || this.ammo <= 0) return;

        const shootX = this.x + Math.cos(this.angle) * 30;
        const shootY = this.y + Math.sin(this.angle) * 30;

        projectiles.push({
            x: shootX,
            y: shootY,
            vx: Math.cos(this.angle) * BULLET_SPEED,
            vy: Math.sin(this.angle) * BULLET_SPEED,
            owner: this,
            color: this.color
        });

        this.fireCooldown = 15;
        this.ammo--;

        if (navigator.vibrate) navigator.vibrate(15);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Stickman proportions
        const headR = 10;
        const bodyLen = 25;
        const legLen = 15;

        // Head
        ctx.beginPath();
        ctx.arc(0, -bodyLen - headR, headR, 0, Math.PI * 2);
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.moveTo(0, -bodyLen);
        ctx.lineTo(0, 5);
        ctx.stroke();

        // Legs
        const legWalk = Math.sin(Date.now() * 0.01 * Math.abs(this.vx)) * 10;
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(-10 + legWalk, 25);
        ctx.moveTo(0, 5);
        ctx.lineTo(10 - legWalk, 25);
        ctx.stroke();

        // Arm/Weapon
        ctx.save();
        ctx.translate(0, -15);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(25, 0);
        ctx.stroke();

        // Gun Muzzle
        ctx.fillStyle = "#fff";
        ctx.fillRect(20, -5, 12, 10);
        ctx.restore();

        // Hoverboard
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-20, 30);
        ctx.lineTo(20, 30);
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.stroke();

        ctx.restore();
    }
}

class Player extends Entity {
    update() {
        if (keys.Left) this.vx -= this.speed;
        if (keys.Right) this.vx += this.speed;
        if (keys.Up) this.vy -= this.speed;
        if (keys.Down) this.vy += this.speed;

        // Cap speed
        const mag = Math.hypot(this.vx, this.vy);
        if (mag > this.maxSpeed) {
            this.vx = (this.vx / mag) * this.maxSpeed;
            this.vy = (this.vy / mag) * this.maxSpeed;
        }

        // Aim towards target (AI)
        const dx = p2.x - this.x;
        const dy = p2.y - this.y;
        this.angle = Math.atan2(dy, dx);

        if (keys.Fire) this.fire();

        super.update();
    }
}

class AI extends Entity {
    constructor(x, y, color) {
        super(x, y, color);
        this.thinkTimer = 0;
        this.targetX = x;
        this.ammo = Infinity; // AI has infinite ammo but same cooldown
    }

    update() {
        this.thinkTimer--;
        if (this.thinkTimer <= 0) {
            this.thinkTimer = 30 + Math.random() * 60;
            // Target loosely around player, but try to stay at MIN_DISTANCE
            const side = p1.x < CW / 2 ? 1 : -1;
            this.targetX = p1.x + (side * MIN_DISTANCE) + (Math.random() - 0.5) * 100;
            this.targetY = p1.y + (Math.random() - 0.5) * 200;
        }

        if (this.x < this.targetX - 20) this.vx += this.speed * 0.8;
        else if (this.x > this.targetX + 20) this.vx -= this.speed * 0.8;

        if (this.y < this.targetY - 20) this.vy += this.speed * 0.8;
        else if (this.y > this.targetY + 20) this.vy -= this.speed * 0.8;

        // Aim at player
        const dx = p1.x - this.x;
        const dy = p1.y - this.y;
        this.angle = Math.atan2(dy, dx);

        // Fire if has line of sight
        if (Math.random() < 0.05) this.fire();

        super.update();
    }
}

// --- Initialization ---

function initPlatforms() {
    // Base floor for all levels (No more falling)
    const baseFloor = { x: 0, y: CH - 30, w: CW, h: 30, isBase: true };

    const layouts = [
        // Level 1: Standard with Central Shield
        [
            { x: CW * 0.1, y: CH * 0.75, w: CW * 0.8, h: 20 },
            { x: CW * 0.45, y: CH * 0.45, w: 40, h: 150, isWall: true }, // Shield Pillar
            { x: CW * 0.2, y: CH * 0.55, w: 150, h: 15 },
            { x: CW * 0.7, y: CH * 0.55, w: 150, h: 15 }
        ],
        // Level 2: Double Shields
        [
            { x: CW * 0.4, y: CH * 0.7, w: CW * 0.2, h: 20 },
            { x: CW * 0.25, y: CH * 0.4, w: 30, h: 120, isWall: true },
            { x: CW * 0.7, y: CH * 0.4, w: 30, h: 120, isWall: true },
            { x: CW * 0.05, y: CH * 0.6, w: 150, h: 20 }
        ],
        // Level 3: Bunker Layout
        [
            { x: CW * 0.1, y: CH * 0.8, w: 200, h: 20 },
            { x: CW * 0.7, y: CH * 0.8, w: 200, h: 20 },
            { x: CW * 0.4, y: CH * 0.5, w: 200, h: 20 },
            { x: CW * 0.35, y: CH * 0.3, w: 15, h: 100, isWall: true },
            { x: CW * 0.65, y: CH * 0.3, w: 15, h: 100, isWall: true }
        ],
        // Level 4: The Fortress
        [
            { x: CW * 0.4, y: CH * 0.3, w: 200, h: 20 },
            { x: CW * 0.4, y: CH * 0.3, w: 15, h: 250, isWall: true },
            { x: CW * 0.58, y: CH * 0.3, w: 15, h: 250, isWall: true }
        ],
        // Level 5: Open Battle with Cover
        [
            { x: CW * 0.2, y: CH * 0.7, w: 100, h: 20 },
            { x: CW * 0.5, y: CH * 0.6, w: 30, h: 200, isWall: true },
            { x: CW * 0.7, y: CH * 0.7, w: 100, h: 20 }
        ]
    ];

    platforms = [...layouts[(currentLevel - 1) % layouts.length], baseFloor];
}

function resetMatch() {
    console.log("Rebooting Match Level: " + currentLevel);

    initSupabase();

    if (gameStartTime == null) {
        gameStartTime = Date.now();   // ⏱ start timer
    }

    // Scaling difficulty based on level
    const lvScale = 1 + (currentLevel - 1) * 0.15;

    p1 = new Player(CW * 0.25, CH * 0.5, "#00f2fe");
    p2 = new AI(CW * 0.75, CH * 0.5, "#ec4899");

    // Scale AI speed/jumppower with level
    p2.speed *= lvScale;
    p2.maxSpeed *= lvScale;
    p2.jumpPower *= (1 + (currentLevel - 1) * 0.05);

    // Reset HUD
    hpP1.style.width = "100%";
    hpP2.style.width = "100%";
    document.getElementById("current-level-display").innerText = currentLevel;
    document.getElementById("stat-level").innerText = currentLevel;

    projectiles = [];
    particles = [];
    matchStartTime = Date.now();
    gameState = "PLAY";

    // Hide all overlays
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    matchMsg.classList.add("hidden");

    // Reset match messages to ensure clean state
    matchMsg.innerText = "KNOCKOUT!";

    // Update level layouts
    initPlatforms();
}

function nextLevel() {
    currentLevel++;
    if (currentLevel > MAX_LEVELS) currentLevel = 1;
    resetMatch();
}

// --- Game Loop Helpers ---

function createSpark(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            alpha: 1,
            color
        });
    }
}

function updateHUD() {
    hpP1.style.width = p1.hp + "%";
    hpP2.style.width = p2.hp + "%";
    ammoP1.innerText = p1.reloadTimer > 0 ? "RELOADING" : p1.ammo;

    const elapsed = Math.floor((Date.now() - matchStartTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    matchTimer.innerText = `${m}:${s}`;
}

function triggerDeath(entity) {
    if (gameState === "OVER") return; // Prevent multiple calls
    gameState = "OVER";

    matchMsg.innerText = entity === p1 ? "DEFEATED!" : "VICTORY!";
    matchMsg.classList.remove("hidden");

    // Show or Hide next level button based on result
    const nextBtn = document.getElementById("next-level-btn");
    if (entity === p2) {
        nextBtn.classList.remove("hidden");
        winnerText.innerText = "MISSION ACCOMPLISHED";
    } else {
        nextBtn.classList.add("hidden");
        winnerText.innerText = "MISSION FAILED";
    }

    setTimeout(() => {
        gameOverScreen.classList.remove("hidden");
    }, 2000);
}

// --- Render Functions ---

function drawBackground() {
    // Large dark mountain in far back
    hctx.clearRect(0, 0, CW, CH);
    hctx.fillStyle = "#0c0c1e";
    hctx.beginPath();
    hctx.moveTo(CW * 0.2, CH);
    hctx.lineTo(CW * 0.5, CH * 0.3);
    hctx.lineTo(CW * 0.8, CH);
    hctx.fill();

    // Star particles
    hctx.fillStyle = "#fff";
    for (let i = 0; i < 100; i++) {
        const x = (i * 137.5) % CW;
        const y = (i * 137.5) % (CH * 0.8);
        hctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.001 + i) * 0.5;
        hctx.fillRect(x, y, 2, 2);
    }
    hctx.globalAlpha = 1;

    // Glowing trees/bushes (Purple from image)
    const treePos = [CW * 0.15, CW * 0.85];
    treePos.forEach(x => {
        hctx.fillStyle = "#a855f7";
        hctx.shadowBlur = 30;
        hctx.shadowColor = "#a855f7";
        hctx.beginPath();
        hctx.arc(x, CH * 0.6, 40, 0, Math.PI * 2);
        hctx.fill();
        hctx.shadowBlur = 0;
        // Trunk
        hctx.fillStyle = "#222";
        hctx.fillRect(x - 5, CH * 0.6 + 30, 10, 100);
    });

    // Lava (Bottom)
    const lavaGrad = hctx.createLinearGradient(0, CH - 50, 0, CH);
    lavaGrad.addColorStop(0, "#f59e0b");
    lavaGrad.addColorStop(1, "#dc2626");
    hctx.fillStyle = lavaGrad;
    hctx.fillRect(0, CH - 50, CW, 50);
}

function drawLoop() {
    drawBackground();

    ctx.clearRect(0, 0, CW, CH);

    // Platforms
    ctx.fillStyle = "#111";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#a855f7";
    platforms.forEach(p => {
        // Neon edge or wall effect
        if (p.isWall) {
            ctx.fillStyle = "rgba(168, 85, 247, 0.6)";
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.strokeStyle = "#a855f7";
            ctx.lineWidth = 1;
            ctx.strokeRect(p.x, p.y, p.w, p.h);
        } else {
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.fillStyle = "rgba(168, 85, 247, 0.4)";
            ctx.fillRect(p.x, p.y, p.w, 4);
        }
    });
    ctx.fillStyle = "#111";
    ctx.shadowBlur = 0;

    if (gameState === "PLAY" || gameState === "OVER") {
        p1.update();
        p2.update();
        p1.draw(ctx);
        p2.draw(ctx);
        updateHUD();
    }

    // Projectiles
    projectiles = projectiles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Draw
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx, p.y - p.vy);
        ctx.stroke();

        // Hit Check
        const victims = [p1, p2].filter(v => v !== p.owner);
        let hit = false;
        victims.forEach(v => {
            const dist = Math.hypot(p.x - v.x, p.y - v.y);
            if (dist < 30) {
                v.takeDamage(10);
                hit = true;
            }
        });

        // Platform hit
        platforms.forEach(plat => {
            if (p.x > plat.x && p.x < plat.x + plat.w && p.y > plat.y && p.y < plat.y + plat.h) hit = true;
        });

        return !hit && p.x > 0 && p.x < CW && p.y > 0 && p.y < CH;
    });

    // Particles
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1;
        return p.alpha > 0;
    });

    requestAnimationFrame(drawLoop);
}

// --- Controls ---

document.addEventListener("keydown", (e) => {
    // Prevent scrolling for game keys
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
    }

    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.Left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.Right = true;
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.Up = true;
    if (e.code === "ArrowDown" || e.code === "KeyS") keys.Down = true;
    if (e.code === "Space" || e.code === "KeyF" || e.code === "ShiftLeft" || e.code === "ShiftRight") keys.Fire = true;
});

document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.Left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.Right = false;
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.Up = false;
    if (e.code === "ArrowDown" || e.code === "KeyS") keys.Down = false;
    if (e.code === "Space" || e.code === "KeyF" || e.code === "ShiftLeft" || e.code === "ShiftRight") keys.Fire = false;
});

function setupTouch(id, key) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const start = (e) => { e.preventDefault(); keys[key] = true; };
    const end = (e) => { e.preventDefault(); keys[key] = false; };
    btn.addEventListener("touchstart", start);
    btn.addEventListener("touchend", end);
    btn.addEventListener("mousedown", start);
    btn.addEventListener("mouseup", end);
}

setupTouch("btn-left", "Left");
setupTouch("btn-right", "Right");
setupTouch("btn-jump", "Up");
setupTouch("btn-fire", "Fire");

function bindBtn(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    const trigger = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fn();
    };
    el.addEventListener("click", trigger);
    el.addEventListener("touchstart", trigger, { passive: false });
}

bindBtn("start-btn", resetMatch);
bindBtn("restart-btn", resetMatch);
bindBtn("next-level-btn", nextLevel);

drawLoop();
