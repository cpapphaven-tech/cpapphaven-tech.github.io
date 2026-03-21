/**
 * Neon Snake (Playmix Games)
 * Based on open source Snake by Talha Bin Yousaf (MIT License)
 * Modified to support level progression, Supabase tracking, mouse-hover steering, and swipe controls.
 */

// ===================================
// SUPABASE / ANALYTICS
// ===================================
let gameStartTime = null;
let durationSent = false;
let gameStartedFlag = false;
let gameRecordTime = null;

const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let supabaseClient = null;
let sessionId = null;

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
    return "Unknown";
}

function getPlacementId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('utm_content') || urlParams.get('placementid') || "unknown";
}

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
        } catch (e) {
            return "Unknown";
        }
    }
}

async function startGameSession() {
    if (!supabaseClient) return;
    sessionId = generateSessionId();
    const placementId = getPlacementId();
    try {
        await supabaseClient.from('game_sessions').insert([{
            session_id: sessionId,
            game_slug: "neon_snake",
            placement_id: placementId,
            user_agent: navigator.userAgent,
            os: getOS(),
            browser: getBrowser(),
            country: await getCountry(),
            started_game: false,
            bounced: false
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

function sendDurationOnExit(reason) {
    if (gameStartTime && !durationSent && window.trackGameEvent) {
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);
        const placementId = getPlacementId();
        window.trackGameEvent(`game_duration_neon_snake_${seconds}_${reason}_${getBrowser().toLowerCase()}`, {
            seconds, end_reason: reason, os: getOS(), placement_id: placementId
        });
        updateGameSession({ duration_seconds: seconds, bounced: !gameStartedFlag, end_reason: reason });
        durationSent = true;
    }
}
window.addEventListener("beforeunload", () => {
    sendDurationOnExit("tab_close");
    if (!gameStartedFlag && window.trackGameEvent) {
        updateGameSession({ bounced: true, end_reason: "exit_before_game" });
    }
});
document.addEventListener("visibilitychange", () => { if (document.hidden) sendDurationOnExit("background"); });

// ===================================
// AUDIO ENGINE (Zero dependency)
// ===================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    
    if (type === 'eat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'over') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(554, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.4);
    }
}

// ===================================
// CORE GAME LOGIC (Analog Canvas)
// ===================================
const playBoard = document.getElementById("play-board");
const ctx = playBoard.getContext("2d");

// Internal resolution
const GAME_SIZE = 1000;
playBoard.width = GAME_SIZE;
playBoard.height = GAME_SIZE;

const scoreDisplay = document.getElementById("current-score");
const targetDisplay = document.getElementById("target-score");
const timerDisplay = document.getElementById("time-left");
const levelDisplay = document.getElementById("level-display");
const timerContainer = document.getElementById("timer-container");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const resultTitle = document.getElementById("result-title");
const resultDesc = document.getElementById("result-desc");

// Game State
let isPlaying = false;
let score = 0;
let level = 1;
let targetScore = 15;
let timeLeft = 120;
let lastTime = 0;
let masterTimer;

// Snake properties
let snake = [];
let snakeLength = 10;   // In segments
let currentAngle = 0;   // Radians
let baseSpeed = 100;    // Pixels per second (Slowed down for easier control)
let snakeRadius = 15;
const SEGMENT_SPACING = 12; 

// AI Snake properties
let aiSnake = [];
let aiSnakeLength = 10;
let aiCurrentAngle = 0;
let aiTargetX = GAME_SIZE / 2;
let aiTargetY = GAME_SIZE / 2;

// Food properties
let foods = [];
let foodRadius = 22;
let foodPulse = 0;
let floaters = [];

// Cursor Interaction
let cursorX = GAME_SIZE / 2;
let cursorY = GAME_SIZE / 2 - 200;

// Update Cursor tracking robustly mapping screen -> canvas
const updateCursorSync = (clientX, clientY) => {
    const rect = playBoard.getBoundingClientRect();
    if(rect.width === 0) return;
    const scaleX = playBoard.width / rect.width;
    const scaleY = playBoard.height / rect.height;
    cursorX = (clientX - rect.left) * scaleX;
    cursorY = (clientY - rect.top) * scaleY;
};

document.addEventListener("mousemove", (e) => {
    if (isPlaying) updateCursorSync(e.clientX, e.clientY);
});

playBoard.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isPlaying && e.touches.length > 0) {
        updateCursorSync(e.touches[0].clientX, e.touches[0].clientY);
    }
}, {passive: false});

const spawnFood = () => {
    const margin = foodRadius * 2;
    foods.push({
        x: margin + Math.random() * (GAME_SIZE - margin * 2),
        y: margin + Math.random() * (GAME_SIZE - margin * 2),
        type: ["🍉","🍎","🍓","🍌"][Math.floor(Math.random()*4)]
    });
};

const initFoods = () => {
    foods = [];
    for(let i=0; i<5; i++) spawnFood(); // Keep 5 fruits active on map
};

const triggerAdRefresh = () => {
    const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
    if (seconds > (window.PMG_TICK_RATE || 60)) {
        if (typeof syncPMGLayout === 'function') syncPMGLayout();
        gameRecordTime = Date.now(); 
    }
};

const handleWin = () => {
    isPlaying = false;
    clearInterval(masterTimer);
    playSound('win');
    
    level++;
    score = 0;
    targetScore = targetScore + 5; 
    timeLeft = 120;
    
    resultTitle.innerText = "Level Cleared!";
    resultTitle.style.color = "#4ade80";
    resultDesc.innerHTML = `Great maneuvering! Next target: ${targetScore}`;
    restartBtn.innerText = "NEXT LEVEL";
    
    gameOverScreen.classList.remove("hidden");
    restartBtn.onclick = () => {
        triggerAdRefresh();
        startGame();
    };
};

const handleGameOver = () => {
    isPlaying = false;
    clearInterval(masterTimer);
    playSound('over');
    
    resultTitle.innerText = "Game Over";
    resultTitle.style.color = "#f43f5e";
    resultDesc.innerHTML = `You made it to Level ${level} with a score of ${score}`;
    restartBtn.innerText = "PLAY AGAIN";
    
    level = 1;
    targetScore = 15;
    
    gameOverScreen.classList.remove("hidden");
    restartBtn.onclick = () => {
        triggerAdRefresh();
        startGame();
    };
}

const gameLoop = (timestamp) => {
    if (!isPlaying) return;
    
    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    
    // Physics Step
    // Steer towards cursor
    let dx = cursorX - snake[0].x;
    let dy = cursorY - snake[0].y;
    let targetAngle = Math.atan2(dy, dx);
    
    // Smooth angle interpolation
    let angleDiff = targetAngle - currentAngle;
    // Normalize mapping to -PI...PI
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    
    const turnSpeed = 4.0; // Radians per second
    const maxTurn = turnSpeed * deltaTime;
    
    if (Math.abs(angleDiff) < maxTurn) {
        currentAngle = targetAngle;
    } else {
        currentAngle += (angleDiff > 0 ? maxTurn : -maxTurn);
    }
    
    // Speed progression
    const activeSpeed = Math.min(250, baseSpeed + (level * 10));
    
    // Move Head
    let newHx = snake[0].x + Math.cos(currentAngle) * activeSpeed * deltaTime;
    let newHy = snake[0].y + Math.sin(currentAngle) * activeSpeed * deltaTime;
    
    snake.unshift({ x: newHx, y: newHy });
    
    // Collision: Out of bounds
    if (newHx < snakeRadius || newHx > GAME_SIZE - snakeRadius || 
        newHy < snakeRadius || newHy > GAME_SIZE - snakeRadius) {
        handleGameOver();
        return;
    }
    
    // ==================
    // AI RIVAL SNAKE LOGIC
    // ==================
    // AI Steer towards closest food
    if (foods.length > 0) {
        let closest = foods[0];
        let minDist = Infinity;
        for(let f of foods) {
            let d = Math.hypot(f.x - aiSnake[0].x, f.y - aiSnake[0].y);
            if (d < minDist) { minDist = d; closest = f; }
        }
        aiTargetX = closest.x;
        aiTargetY = closest.y;
    } else {
        aiTargetX = GAME_SIZE / 2;
        aiTargetY = GAME_SIZE / 2;
    }
    
    let aiDx = aiTargetX - aiSnake[0].x;
    let aiDy = aiTargetY - aiSnake[0].y;
    let aiTargetAngle = Math.atan2(aiDy, aiDx);
    let aiAngleDiff = aiTargetAngle - aiCurrentAngle;
    
    while(aiAngleDiff < -Math.PI) aiAngleDiff += Math.PI * 2;
    while(aiAngleDiff > Math.PI) aiAngleDiff -= Math.PI * 2;
    
    const aiTurnSpeed = 2.5; // Steers slightly slower linearly
    const aiMaxTurn = aiTurnSpeed * deltaTime; 
    aiCurrentAngle += (aiAngleDiff > 0 ? aiMaxTurn : -aiMaxTurn);
    
    let aiActiveSpeed = activeSpeed * 0.7; // Moves moderately slower than player
    let aiNewHx = aiSnake[0].x + Math.cos(aiCurrentAngle) * Math.max(80, aiActiveSpeed) * deltaTime;
    let aiNewHy = aiSnake[0].y + Math.sin(aiCurrentAngle) * Math.max(80, aiActiveSpeed) * deltaTime;
    
    // Clamp AI so it doesn't leave bounds if pushed
    aiNewHx = Math.max(snakeRadius, Math.min(GAME_SIZE - snakeRadius, aiNewHx));
    aiNewHy = Math.max(snakeRadius, Math.min(GAME_SIZE - snakeRadius, aiNewHy));
    
    aiSnake.unshift({ x: aiNewHx, y: aiNewHy });
    
    while(aiSnake.length > Math.max(4, aiSnakeLength * (SEGMENT_SPACING / (aiActiveSpeed * 0.01)))) {
        aiSnake.pop(); 
    }
    
    // AI Collision with Food
    for (let i = 0; i < foods.length; i++) {
        if (Math.hypot(foods[i].x - aiNewHx, foods[i].y - aiNewHy) < snakeRadius + foodRadius) {
            foods.splice(i, 1); // AI stole the food!
            spawnFood();
            aiSnakeLength += 1; // AI grows
            break;
        }
    }
    
    // Player Collision with AI Snake (Game Over if player hits AI)
    for (let i = 0; i < aiSnake.length; i += 3) {
        let dist = Math.hypot(aiSnake[i].x - newHx, aiSnake[i].y - newHy);
        if (dist < snakeRadius * 1.5) {
            handleGameOver();
            return;
        }
    }
    
    // Collision: Food (Fruit)
    for (let i = 0; i < foods.length; i++) {
        let distToFood = Math.hypot(foods[i].x - newHx, foods[i].y - newHy);
        if (distToFood < snakeRadius + foodRadius) {
            playSound('eat');
            floaters.push({ x: newHx, y: newHy - 30, age: 0 }); // float positive interaction mapping
            foods.splice(i, 1);
            spawnFood();
            
            snakeLength += 1.5; // Grow small amount
            snakeRadius = Math.min(30, snakeRadius + 0.1); 
            score++;
            scoreDisplay.innerText = score;
            
            if (score >= targetScore) {
                handleWin();
                return;
            }
            break; // one food per frame
        }
    }
    
    // Prune tail
    while (snake.length > snakeLength * (SEGMENT_SPACING / (activeSpeed * 0.01))) {
        snake.pop(); 
    }
    
    // Collision: Self
    // Relaxed hit detection preventing early tight-corner false positives
    const ignoreHeadFrames = Math.floor(4.0 * (snakeRadius / (activeSpeed * deltaTime)));
    for (let i = ignoreHeadFrames; i < snake.length; i += 5) {
        let dist = Math.hypot(snake[i].x - newHx, snake[i].y - newHy);
        if (dist < snakeRadius * 0.9) {
            handleGameOver();
            return;
        }
    }
    
    // Rendering
    ctx.clearRect(0, 0, GAME_SIZE, GAME_SIZE);
    
    // Draw Tracking Laser Guide with a "blinking" twist (oscillating alpha) to avoid making it too easy
    // Math.sin creates a heartbeat wave. Capped at 0 so it stays fully invisible 50% of the time!
    const blinkAlpha = Math.max(0, Math.sin(timestamp / 400) * 0.4); 
    
    ctx.beginPath();
    ctx.moveTo(snake[0].x, snake[0].y);
    ctx.lineTo(cursorX, cursorY);
    ctx.strokeStyle = `rgba(6, 182, 212, ${blinkAlpha})`; 
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 15]); 
    ctx.stroke();
    ctx.setLineDash([]); 
    
    // Draw Cursor Target Reticle with a similar rhythmic fade
    const reticleAlpha = Math.max(0.15, Math.sin(timestamp / 400) * 0.7);
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 10, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(6, 182, 212, ${reticleAlpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(74, 222, 128, ${reticleAlpha + 0.2})`;
    ctx.fill();
    
    // Draw AI Snake
    for (let i = aiSnake.length - 1; i >= 0; i--) {
        if (i % 4 !== 0 && i !== 0) continue; 
        ctx.beginPath();
        let scale = Math.max(0.1, 1.0 - (i / aiSnake.length) * 0.3);
        ctx.arc(aiSnake[i].x, aiSnake[i].y, snakeRadius * scale, 0, Math.PI * 2);
        
        if (i === 0) {
            // AI Head
            ctx.fillStyle = '#f43f5e';
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 15;
            ctx.fill();
            
            // AI Eyes
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#fff";
            const eyeDist = snakeRadius * 0.5;
            // Draw relative to current canvas loop to ensure precision syncing rather than static var referencing
            ctx.beginPath(); ctx.arc(aiSnake[0].x + Math.cos(aiCurrentAngle - 0.7) * eyeDist, aiSnake[0].y + Math.sin(aiCurrentAngle - 0.7) * eyeDist, snakeRadius * 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(aiSnake[0].x + Math.cos(aiCurrentAngle + 0.7) * eyeDist, aiSnake[0].y + Math.sin(aiCurrentAngle + 0.7) * eyeDist, snakeRadius * 0.3, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = '#fb923c';
            ctx.shadowColor = '#fb923c';
            ctx.shadowBlur = 5;
            ctx.fill();
        }
    }
    ctx.shadowBlur = 0;

    // Draw trail / body
    for (let i = snake.length - 1; i >= 0; i--) {
        // Sample every few frames for a smooth but distinct segmented look
        if (i % 4 !== 0 && i !== 0) continue; 
        
        ctx.beginPath();
        let scale = 1.0 - (i / snake.length) * 0.3; // Tail tapers off slightly
        ctx.arc(snake[i].x, snake[i].y, snakeRadius * scale, 0, Math.PI * 2);
        
        if (i === 0) {
            // Head
            ctx.fillStyle = '#06b6d4';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 20;
            ctx.fill();
            
            // Draw analog directional eyes!
            ctx.shadowBlur = 0;
            ctx.fillStyle = "white";
            const eyeDist = snakeRadius * 0.5;
            // Left eye
            ctx.beginPath();
            ctx.arc(newHx + Math.cos(currentAngle - 0.7) * eyeDist, 
                    newHy + Math.sin(currentAngle - 0.7) * eyeDist, 
                    snakeRadius * 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Right eye
            ctx.beginPath();
            ctx.arc(newHx + Math.cos(currentAngle + 0.7) * eyeDist, 
                    newHy + Math.sin(currentAngle + 0.7) * eyeDist, 
                    snakeRadius * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
        } else {
            // Body
            ctx.fillStyle = '#4ade80';
            ctx.shadowColor = '#4ade80';
            ctx.shadowBlur = 10;
            ctx.fill();
        }
    }
    ctx.shadowBlur = 0;
    
    // Draw Food
    foodPulse += deltaTime * 5;
    const pulseScale = 1.0 + Math.sin(foodPulse) * 0.1;
    ctx.font = `${foodRadius * pulseScale * 2}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    foods.forEach(f => {
        ctx.fillText(f.type, f.x, f.y);
    });

    // Draw +1 Floaters directly cleanly onto context!
    for (let i = floaters.length - 1; i >= 0; i--) {
        let f = floaters[i];
        f.age += deltaTime * 1.5;
        f.y -= deltaTime * 80;
        if (f.age > 1) { floaters.splice(i, 1); continue; }
        ctx.globalAlpha = 1 - f.age;
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 50px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText('+1', f.x, f.y);
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }
    
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    scoreDisplay.innerText = score;
    targetDisplay.innerText = targetScore;
    levelDisplay.innerText = level;
    timerDisplay.innerText = timeLeft;
    timerContainer.classList.remove("urgent");
}

function startGame() {
    if(!gameStartedFlag) {
        gameStartTime = Date.now();
        gameRecordTime = Date.now();
        gameStartedFlag = true;
        initSupabase();
    }
    
    isPlaying = true;
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    
    // Reset properties
    if (level === 1) targetScore = 15;
    score = 0;
    timeLeft = 120;
    snakeLength = 15;
    snakeRadius = 15;
    currentAngle = -Math.PI / 2;
    snake = [{ x: GAME_SIZE / 2, y: GAME_SIZE / 2 }];
    
    // AI Init
    aiSnakeLength = 10;
    aiCurrentAngle = Math.PI / 2;
    aiSnake = [{ x: GAME_SIZE / 2, y: GAME_SIZE - 200 }];
    
    cursorX = GAME_SIZE / 2;
    cursorY = GAME_SIZE / 2 - 200; // Force default vector to point straight ahead to avoid snap-neck bounds kills
    floaters = [];
    
    updateUI();
    initFoods();
    
    clearInterval(masterTimer);
    lastTime = 0;
    requestAnimationFrame(gameLoop);
    
    masterTimer = setInterval(() => {
        if(!isPlaying) return;
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if(timeLeft <= 10) timerContainer.classList.add("urgent");
        else timerContainer.classList.remove("urgent");
        
        if (timeLeft <= 0) {
            handleGameOver();
        }
    }, 1000);
}

startBtn.onclick = startGame;
startGame();
