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
let baseSpeed = 140;    // Pixels per second (Slowed down for easier control)
let snakeRadius = 15;
const SEGMENT_SPACING = 12; 

// Food properties
let foodX, foodY;
let foodRadius = 22;
let foodPulse = 0;

// Cursor Interaction
let cursorX = GAME_SIZE / 2;
let cursorY = GAME_SIZE / 2;

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

const updateFoodPosition = () => {
    const margin = foodRadius * 2;
    foodX = margin + Math.random() * (GAME_SIZE - margin * 2);
    foodY = margin + Math.random() * (GAME_SIZE - margin * 2);
}

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
    const activeSpeed = Math.min(350, baseSpeed + (level * 15));
    
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
    
    // Collision: Food (Fruit)
    let distToFood = Math.hypot(foodX - newHx, foodY - newHy);
    if (distToFood < snakeRadius + foodRadius) {
        playSound('eat');
        updateFoodPosition();
        snakeLength += 3; // Grow!
        snakeRadius = Math.min(30, snakeRadius + 0.2); // Slowly scale up physical snake size!
        score++;
        scoreDisplay.innerText = score;
        
        if (score >= targetScore) {
            handleWin();
            return;
        }
    }
    
    // Prune tail
    while (snake.length > snakeLength * (SEGMENT_SPACING / (activeSpeed * 0.01))) {
        snake.pop(); // Not strictly length, based on history array padding!
    }
    
    // Collision: Self
    // Check nodes further back in history array
    const ignoreHeadFrames = Math.floor(2.5 * (snakeRadius / (activeSpeed * deltaTime)));
    for (let i = ignoreHeadFrames; i < snake.length; i += 5) {
        let dist = Math.hypot(snake[i].x - newHx, snake[i].y - newHy);
        if (dist < snakeRadius * 1.5) {
            handleGameOver();
            return;
        }
    }
    
    // Rendering
    ctx.clearRect(0, 0, GAME_SIZE, GAME_SIZE);
    
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
    
    // Draw Food (Fruit 🍉)
    foodPulse += deltaTime * 5;
    const pulseScale = 1.0 + Math.sin(foodPulse) * 0.1;
    ctx.font = `${foodRadius * pulseScale * 2}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🍉", foodX, foodY);
    
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
    
    updateUI();
    updateFoodPosition();
    
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
