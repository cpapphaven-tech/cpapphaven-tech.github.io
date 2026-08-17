/**
 * PlayMix Games - Candy Match 3
 * 
 * Based on source code by Talha Bin Yousaf.
 * MIT License
 * 
 * Copyright (c) 2024 Talha Bin Yousaf
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// ===================================
// SUPABASE / ANALYTICS
// ===================================
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
    const os = getOS();
    const browser = getBrowser();
    const userAgent = navigator.userAgent;
    const gameSlug = "fruit_splash";
    const country = await getCountry();
    try {
        await supabaseClient.from('game_sessions').insert([{
            session_id: sessionId,
            game_slug: gameSlug,
            placement_id: placementId,
            user_agent: userAgent,
            os: os,
            browser: browser,
            country: country,
            started_game: false,
            bounced: false
        }]);
    } catch (e) { }
}

async function markSessionStarted() {
    if (!supabaseClient || !sessionId) return;
    try {
        await supabaseClient.from('game_sessions').update({ started_game: true }).eq('session_id', sessionId);
    } catch (e) { }
}

async function updateGameSession(fields) {
    if (!supabaseClient || !sessionId) return;
    try {
        await supabaseClient.from('game_sessions').update(fields).eq('session_id', sessionId);
    } catch (e) { }
}

function sendDurationOnExit(reason) {
    if (gameStartTime && !durationSent && window.trackGameEvent) {
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);
        const placementId = getPlacementId();
        window.trackGameEvent(`game_duration_fruit_splash_${seconds}_${reason}_${getBrowser()}`, {
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
    if (document.hidden) sendDurationOnExit("background");
});

window.addEventListener("beforeunload", () => {
    sendDurationOnExit("tab_close");
    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOS().toLowerCase();
        const placementId = getPlacementId();
        window.trackGameEvent(`exit_before_game_fruit_splash_${osKey}`, {
            os: getOS(),
            placement_id: placementId
        });
        updateGameSession({ bounced: true, placement_id: placementId, end_reason: "exit_before_game" });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    initCandyMatch();
});

function initCandyMatch() {
    const grid = document.getElementById("game-grid");
    const scoreDisplay = document.getElementById("current-score");
    const targetDisplay = document.getElementById("target-score");
    const timerDisplay = document.getElementById("time-left");
    const levelDisplay = document.getElementById("level-display");
    
    const startScreen = document.getElementById("start-screen");
    const gameOverScreen = document.getElementById("game-over-screen");
    const startBtn = document.getElementById("start-btn");
    const restartBtn = document.getElementById("restart-btn");
    const resultTitle = document.getElementById("result-title");
    const resultDesc = document.getElementById("result-desc");

    const width = 8;
    const squares = [];
    let score = 0;
    let target = 100;
    let level = 1;
    let timeLeft = 90;
    let gameInterval = null;
    let timerInterval = null;
    let isPlaying = false;

    // Minimal Synthesizer for UI Sounds
    let audioCtx = null;
    function playSound(type) {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        if (type === 'swap') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(500, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'pop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600 + Math.random() * 200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'win') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
            osc.frequency.setValueAtTime(554, audioCtx.currentTime + 0.1);
            osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.5);
        }
    }

    function createFloatingScore(element, amount) {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        const floater = document.createElement('div');
        floater.innerText = `+${amount}`;
        floater.style.position = 'fixed';
        floater.style.left = `${x}px`;
        floater.style.top = `${y}px`;
        floater.style.color = '#fff';
        floater.style.fontWeight = '900';
        floater.style.fontSize = '2.5rem';
        floater.style.pointerEvents = 'none';
        floater.style.textShadow = `0 0 15px #4facfe, 0 4px 8px rgba(0,0,0,0.8)`;
        floater.style.transform = 'translate(-50%, -50%) scale(0.5)';
        floater.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s linear';
        floater.style.zIndex = '1000';
        floater.style.opacity = '1';
        
        document.body.appendChild(floater);
        
        void floater.offsetWidth; // Force CSS flush
        
        floater.style.transform = 'translate(-50%, -100px) scale(1.2)';
        floater.style.opacity = '0';
        
        setTimeout(() => {
            if (floater.parentNode) floater.parentNode.removeChild(floater);
        }, 600);
    }

    // We use CSS classes and emojis instead of background images
    const fruitTypes = [
        { type: "red", emoji: "🍓" },
        { type: "purple", emoji: "🍇" },
        { type: "orange", emoji: "🍊" },
        { type: "yellow", emoji: "🍍" },
        { type: "green", emoji: "🥝" },
        { type: "blue", emoji: "🫐" }
    ];

    function createBoard() {
        grid.innerHTML = "";
        squares.length = 0;
        for (let i = 0; i < width * width; i++) {
            const square = document.createElement("div");
            square.classList.add("candy-square");
            square.setAttribute("id", i);
        let randomFruit = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
        square.dataset.type = randomFruit.type;
        square.innerText = randomFruit.emoji;
            grid.appendChild(square);
            squares.push(square);

            // Pointer Events for mobile and desktop support
            square.addEventListener("pointerdown", pointerDown);
            square.addEventListener("pointerenter", pointerEnter);
        }
        
        // Remove pre-existing matches on board generation
        let preMatch = true;
        while(preMatch) {
            let matched = false;
            for (let i = 0; i < 64; i++) {
                if (checkInitialMatches(i)) {
                    let randomFruit = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
                    squares[i].dataset.type = randomFruit.type;
                    squares[i].innerText = randomFruit.emoji;
                    matched = true;
                }
            }
            if(!matched) preMatch = false;
        }
        
        document.addEventListener("pointerup", pointerUp);
    }

    function checkInitialMatches(i) {
        let type = squares[i].dataset.type;
        if (!type || type === "blank") return false;
        // Check horizontal
        if (i % width >= 2 && squares[i-1].dataset.type === type && squares[i-2].dataset.type === type) return true;
        // Check vertical
        if (i >= 16 && squares[i-width].dataset.type === type && squares[i-width*2].dataset.type === type) return true;
        return false;
    }

    let squareIdBeingDragged = null;
    let squareIdBeingReplaced = null;
    let isDragging = false;
    let isAnimating = false;

    function pointerDown(e) {
        if (!isPlaying || isAnimating) return;
        let clickedId = parseInt(this.id);
        
        // If a fruit is already highlighted (parked tap)
        if (squareIdBeingDragged !== null && !isDragging) {
            // Did they tap the same one to cancel?
            if (squareIdBeingDragged === clickedId) {
                squares[squareIdBeingDragged].classList.remove("dragging");
                squareIdBeingDragged = null;
                return;
            }
            
            // They tapped another fruit, treat it as a swap attempt
            squareIdBeingReplaced = clickedId;
            attemptSwap();
            return;
        }

        // Fresh interaction (could be start of a drag, or a tap)
        isDragging = true;
        squareIdBeingDragged = clickedId;
        this.classList.add("dragging");
    }

    function pointerEnter(e) {
        if (!isDragging || !isPlaying || isAnimating) return;
        squareIdBeingReplaced = parseInt(this.id);
    }

    function pointerUp(e) {
        if (!isPlaying || isAnimating) return;
        
        // If they dragged onto another valid element
        if (isDragging && squareIdBeingReplaced !== null) {
            isDragging = false;
            attemptSwap();
        } else if (isDragging && squareIdBeingReplaced === null) {
            // They tapped without moving to another square. Keep it highlighted!
            isDragging = false;
        }
    }

    function attemptSwap() {
        if (squareIdBeingDragged !== null && squareIdBeingReplaced !== null) {
            let validMoves = [
                squareIdBeingDragged - 1,
                squareIdBeingDragged - width,
                squareIdBeingDragged + 1,
                squareIdBeingDragged + width
            ];
            // Fix boundary wrapping
            if (squareIdBeingDragged % width === 0) validMoves = validMoves.filter(v => v !== squareIdBeingDragged - 1);
            if (squareIdBeingDragged % width === width - 1) validMoves = validMoves.filter(v => v !== squareIdBeingDragged + 1);

            let validMove = validMoves.includes(squareIdBeingReplaced);
            
            let draggedId = squareIdBeingDragged;
            let replacedId = squareIdBeingReplaced;

            if (validMove) {
                isAnimating = true;
                playSound('swap');
                swapSquares(squares[draggedId], squares[replacedId]);
                
                // Check if swap creates match. If not, swap back.
                setTimeout(() => {
                    if (!checkBoardForMatches(true)) {
                        swapSquares(squares[draggedId], squares[replacedId]); // swap back
                    }
                    isAnimating = false;
                }, 200);
            }
        }
        
        // Always reset states and remove dragging highlight after attempt
        if(squareIdBeingDragged !== null) squares[squareIdBeingDragged].classList.remove("dragging");
        if(squareIdBeingReplaced !== null) squares[squareIdBeingReplaced].classList.remove("dragging");
        
        squareIdBeingDragged = null;
        squareIdBeingReplaced = null;
        isDragging = false;
    }

    function swapSquares(sq1, sq2) {
        let tempType = sq1.dataset.type;
        let tempEmoji = sq1.innerText;
        sq1.dataset.type = sq2.dataset.type;
        sq1.innerText = sq2.innerText;
        sq2.dataset.type = tempType;
        sq2.innerText = tempEmoji;
    }


    function moveIntoSquareBelow() {
        for (let i = 0; i < width * (width - 1); i++) {
            if (squares[i + width].dataset.type === "blank") {
                squares[i + width].dataset.type = squares[i].dataset.type;
                squares[i + width].innerText = squares[i].innerText;
                squares[i].dataset.type = "blank";
                squares[i].innerText = "";
            }
        }
        
        for (let i = 0; i < width; i++) {
            if (squares[i].dataset.type === "blank") {
                let randomFruit = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
                squares[i].dataset.type = randomFruit.type;
                squares[i].innerText = randomFruit.emoji;
            }
        }
    }

    function createFloatingScore(element, amount) {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        const floater = document.createElement('div');
        floater.innerText = `+${amount}`;
        floater.style.position = 'fixed';
        floater.style.left = `${x}px`;
        floater.style.top = `${y}px`;
        floater.style.color = '#fff';
        floater.style.fontWeight = '900';
        floater.style.fontSize = '2.5rem';
        floater.style.pointerEvents = 'none';
        floater.style.textShadow = `0 0 15px #4facfe, 0 4px 8px rgba(0,0,0,0.8)`;
        floater.style.transform = 'translate(-50%, -50%) scale(0.5)';
        floater.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s linear';
        floater.style.zIndex = '1000';
        floater.style.opacity = '1';
        
        document.body.appendChild(floater);
        
        void floater.offsetWidth; // Force CSS flush
        
        floater.style.transform = 'translate(-50%, -100px) scale(1.2)';
        floater.style.opacity = '0';
        
        setTimeout(() => {
            if (floater.parentNode) floater.parentNode.removeChild(floater);
        }, 600);
    }

    function checkRowForFive() {
        let matched = false;
        for (let i = 0; i < 60; i++) {
            if (i % width >= width - 4) continue;
            let rowOfFive = [i, i + 1, i + 2, i + 3, i + 4];
            let decidedType = squares[i].dataset.type;
            const isBlank = decidedType === "blank";
            if (rowOfFive.every(index => squares[index].dataset.type === decidedType && !isBlank)) {
                score += 40; // Mega bonus!
                scoreDisplay.innerHTML = score;
                playSound('pop');
                createFloatingScore(squares[rowOfFive[2]], 40);
                rowOfFive.forEach(index => {
                    squares[index].dataset.type = "blank";
                    squares[index].innerText = "";
                });
                matched = true;
            }
        }
        return matched;
    }

    function checkColumnForFive() {
        let matched = false;
        for (let i = 0; i < 32; i++) {
            let columnOfFive = [i, i + width, i + 2 * width, i + 3 * width, i + 4 * width];
            let decidedType = squares[i].dataset.type;
            const isBlank = decidedType === "blank";
            if (columnOfFive.every(index => squares[index].dataset.type === decidedType && !isBlank)) {
                score += 40; // Mega bonus!
                scoreDisplay.innerHTML = score;
                playSound('pop');
                createFloatingScore(squares[columnOfFive[2]], 40);
                columnOfFive.forEach(index => {
                    squares[index].dataset.type = "blank";
                    squares[index].innerText = "";
                });
                matched = true;
            }
        }
        return matched;
    }

    function checkRowForFour() {
        let matched = false;
        for (let i = 0; i < 60; i++) {
            if (i % width >= width - 3) continue;
            let rowOfFour = [i, i + 1, i + 2, i + 3];
            let decidedType = squares[i].dataset.type;
            const isBlank = decidedType === "blank";
            if (rowOfFour.every(index => squares[index].dataset.type === decidedType && !isBlank)) {
                score += 20; // Bonus points!
                scoreDisplay.innerHTML = score;
                playSound('pop');
                createFloatingScore(squares[rowOfFour[1]], 20);
                rowOfFour.forEach(index => {
                    squares[index].dataset.type = "blank";
                    squares[index].innerText = "";
                });
                matched = true;
            }
        }
        return matched;
    }

    function checkColumnForFour() {
        let matched = false;
        for (let i = 0; i < 40; i++) {
            let columnOfFour = [i, i + width, i + 2 * width, i + 3 * width];
            let decidedType = squares[i].dataset.type;
            const isBlank = decidedType === "blank";
            if (columnOfFour.every(index => squares[index].dataset.type === decidedType && !isBlank)) {
                score += 20; // Bonus points!
                scoreDisplay.innerHTML = score;
                playSound('pop');
                createFloatingScore(squares[columnOfFour[1]], 20);
                columnOfFour.forEach(index => {
                    squares[index].dataset.type = "blank";
                    squares[index].innerText = "";
                });
                matched = true;
            }
        }
        return matched;
    }

    function checkRowForThree() {
        let matched = false;
        for (let i = 0; i < 62; i++) {
            if (i % width >= width - 2) continue;
            let rowOfThree = [i, i + 1, i + 2];
            let decidedType = squares[i].dataset.type;
            const isBlank = decidedType === "blank";
            if (rowOfThree.every(index => squares[index].dataset.type === decidedType && !isBlank)) {
                score += 10;
                scoreDisplay.innerHTML = score;
                playSound('pop');
                createFloatingScore(squares[rowOfThree[1]], 10);
                rowOfThree.forEach(index => {
                    squares[index].dataset.type = "blank";
                    squares[index].innerText = "";
                });
                matched = true;
            }
        }
        return matched;
    }

    function checkColumnForThree() {
        let matched = false;
        for (let i = 0; i < 48; i++) {
            let columnOfThree = [i, i + width, i + 2 * width];
            let decidedType = squares[i].dataset.type;
            const isBlank = decidedType === "blank";
            if (columnOfThree.every(index => squares[index].dataset.type === decidedType && !isBlank)) {
                score += 10;
                scoreDisplay.innerHTML = score;
                playSound('pop');
                createFloatingScore(squares[columnOfThree[1]], 10);
                columnOfThree.forEach(index => {
                    squares[index].dataset.type = "blank";
                    squares[index].innerText = "";
                });
                matched = true;
            }
        }
        return matched;
    }
    
    function checkBoardForMatches(dryRun = false) {
        if(dryRun) {
            // Check if any match exists without modifying board
            let hasMatch = false;
            for (let i = 0; i < 64; i++) {
                let type = squares[i].dataset.type;
                if (!type || type === "blank") continue;
                if (i % width < width - 2 && squares[i+1].dataset.type === type && squares[i+2].dataset.type === type) hasMatch = true;
                if (i < 48 && squares[i+width].dataset.type === type && squares[i+width*2].dataset.type === type) hasMatch = true;
            }
            return hasMatch;
        } else {
            let r5 = checkRowForFive();
            let c5 = checkColumnForFive();
            let r4 = checkRowForFour();
            let c4 = checkColumnForFour();
            let r3 = checkRowForThree();
            let c3 = checkColumnForThree();
            return r5 || c5 || r4 || c4 || r3 || c3;
        }
    }

    function gameLoop() {
        if (!isPlaying || isAnimating) return;
        checkBoardForMatches(false);
        moveIntoSquareBelow();
        
        if (score >= target) {
            levelComplete();
        }
    }

    function startGame() {
        if(!gameStartedFlag) {
            gameStartTime = Date.now();
            gameRecordTime = Date.now();
            gameStartedFlag = true;
            initSupabase();
        }

        startScreen.classList.add("hidden");
        gameOverScreen.classList.add("hidden");
        
        score = 0;
        level = 1;
        target = 100;
        timeLeft = 90;
        
        updateUI();
        createBoard();
        
        isPlaying = true;
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        gameInterval = setInterval(gameLoop, 150);
        
        timerInterval = setInterval(() => {
            if (!isPlaying) return;
            timeLeft--;
            timerDisplay.innerHTML = timeLeft;
            if (timeLeft <= 0) {
                endGame(false);
            }
        }, 1000);
    }
    
    function levelComplete() {
        isPlaying = false;
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        playSound('win');
        
        level++;
        score = 0;
        target = 100 + (level * 25); // simpler scaling: +25 each level
        timeLeft = 90 + (level * 10); // extra time for higher levels
        
        resultTitle.innerText = "Congratulations!";
        resultTitle.style.color = "#4ade80";
        resultDesc.innerHTML = `Great job! Preparing Level ${level}.`;
        restartBtn.innerText = "NEXT LEVEL";
        
        gameOverScreen.classList.remove("hidden");
        
        restartBtn.onclick = () => {
            const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
            if (seconds > (window.PMG_TICK_RATE || 60)) {
                if (typeof syncPMGLayout === 'function') syncPMGLayout();
                gameRecordTime = Date.now(); 
            }
            
            gameOverScreen.classList.add("hidden");
            updateUI();
            createBoard();
            isPlaying = true;
            clearInterval(gameInterval);
            clearInterval(timerInterval);
            gameInterval = setInterval(gameLoop, 150);
            timerInterval = setInterval(() => {
                if (!isPlaying) return;
                timeLeft--;
                timerDisplay.innerHTML = timeLeft;
                if (timeLeft <= 0) {
                    endGame(false);
                }
            }, 1000);
        };
    }

    function endGame(victory = false) {
        isPlaying = false;
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        
        gameOverScreen.classList.remove("hidden");
        resultTitle.innerText = "TIME'S UP!";
        resultTitle.style.color = "#f43f5e";
        resultDesc.innerHTML = `You reached Level ${level} with a score of ${score}.`;
        restartBtn.innerText = "PLAY AGAIN";
        
        restartBtn.onclick = () => {
            const seconds = Math.round((Date.now() - gameRecordTime) / 1000);
            if (seconds > (window.PMG_TICK_RATE || 60)) {
                if (typeof syncPMGLayout === 'function') syncPMGLayout();
                gameRecordTime = Date.now(); 
            }
            startGame();
        };
    }
    
    function updateUI() {
        scoreDisplay.innerHTML = score;
        targetDisplay.innerHTML = target;
        levelDisplay.innerHTML = level;
        timerDisplay.innerHTML = timeLeft;
    }

    startBtn.onclick = startGame;
    
    // Auto-start game to skip splash screen
    startGame();
}
