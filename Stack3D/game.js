/**
 * Stack 3D - Three.js Implementation
 * Ported from Swift/SceneKit
 */



let playerName = localStorage.getItem("playerName") || "";

// --- Constants & Config ---
const BLOCK_HEIGHT = 0.9;
const INITIAL_BLOCK_SIZE = 5;
const CAMERA_OFFSET = 20;

// --- State Variables ---
let scene, camera, renderer;
let stack = []; // Array of meshes
let currentBlock = null;
let direction = 'x'; // 'x' or 'z'
let gameState = 'MENU';
let score = 0;
let bestScore = localStorage.getItem('stackBestScore') || 0;
let moveSpeed = 2; // Units per second
let baseHue = Math.random();

// --- DOM Elements ---
const scoreEl = document.getElementById('score');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');
const restartBtn = document.getElementById('restart-btn');

let bonusBtn;
let gameStartedFlag = false;
let gameStartTime = null;
let durationSent = false;

// let supabase = null;
// Replace with your actual Supabase URL and Anon key
const supabaseUrl = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const supabaseKey = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);


// Wait for Supabase to load safely
function initSupabase() {
    if (!supabaseClient) {
        console.warn("⏳ Supabase script not loaded yet, retrying...");
        setTimeout(initSupabase, 500);

        return;
    }

    const { createClient } = window.supabase;
    supabaseClient = createClient(
        "https://bjpgovfzonlmjrruaspp.supabase.co",
        "sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM"
    );

    ole.log("✅ Supabase ready");
}






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







// --- Initialization ---
function init() {



    const nameDialog = document.getElementById("name-dialog");
    const startBtn = document.getElementById("start-btn");
    const nameInput = document.getElementById("player-name");

    // Show dialog if no name saved
    if (!playerName) {
        nameDialog.classList.remove("hidden");
        // Focus with delay for mobile keyboard trigger
        setTimeout(() => {
            nameInput.focus();
            nameInput.click(); // Some browsers need a click simulation
        }, 500);
    }

    // Allow pressing "Enter" to start
    nameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            startBtn.click();
        }
    });

    startBtn.addEventListener("click", () => {
        playerName = nameInput.value || "Guest";
        localStorage.setItem("playerName", playerName);
        nameDialog.classList.add("hidden");
        startGame();
    });


    bonusBtn = document.getElementById("bonus-btn");
    if (bonusBtn) {
        bonusBtn.addEventListener("click", () => {
            window.open(
                "https://www.effectivegatecpm.com/gp6cvyi4?key=a90897ce62f2dd15a5aab13ad90b2e66",
                "_blank"
            );
            revivePlayer();
        });
    }



    // More Games button
    const homeBtn = document.getElementById("home-btn");
    if (homeBtn) {
        homeBtn.addEventListener("click", () => {
            window.location.href = "../index.html"; // your main games page
        });
    }

    const tgBtn = document.getElementById("tg-btn");
    if (tgBtn) {
        tgBtn.addEventListener("click", () => {
            if (window.trackGameEvent) {
                window.trackGameEvent("stack_community_click", {
                    game: "stack_3d"
                });
            }
        });
    }


    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera (Orthographic for Isometric look)
    const aspect = window.innerWidth / window.innerHeight;
    const size = aspect < 1 ? 12 : 10; // Zoom out slightly on portrait
    camera = new THREE.OrthographicCamera(-size * aspect, size * aspect, size, -size, 1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true,
        preserveDrawingBuffer: true   // 👈 REQUIRED
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 5. Initial setup
    resetGame();
    animate();

    // Event Listeners
    window.addEventListener('pointerdown', handleInteraction, { passive: false });
    restartBtn.addEventListener('click', () => {
        restartGame();
        setTimeout(startGame, 300); // auto start in 0.5s
    });

    window.addEventListener('resize', onWindowResize);

    initSupabase(); // 🔥 add this line


    // 🔥 AUTO START after 1.2s
    // setTimeout(() => {
    //     if (gameState === "MENU") {
    //        startGame();
    //     }
    // }, 300);

}

function revivePlayer() {
    gameOverMenu.classList.add("hidden");
    isGameOver = false;
    gameState = "PLAYING";
    spawnBlock();
}


function handleInteraction(e) {


    if (e.target.tagName === 'BUTTON') return;

    // Prevent double-triggering on some mobile browsers
    if (e.pointerType === 'touch') e.preventDefault();

    if (gameState === 'MENU') {
        if (playerName) {
            startGame();
        }
    } else if (gameState === 'PLAYING') {
        placeBlock();
    }
}

function resetGame() {
    // Clear old blocks from stack
    stack.forEach(mesh => {
        scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
    });
    stack = [];

    // Clear current moving block
    if (currentBlock) {
        scene.remove(currentBlock);
        if (currentBlock.geometry) currentBlock.geometry.dispose();
        if (currentBlock.material) currentBlock.material.dispose();
    }
    currentBlock = null;

    // Clear any loose physics rubble or remaining blocks in the scene
    const toRemove = [];
    scene.traverse(obj => {
        if (obj.isPhysics || obj.isBlock) {
            toRemove.push(obj);
        }
    });
    toRemove.forEach(obj => {
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });

    score = 0;
    scoreEl.innerText = score;
    gameState = 'MENU';
    direction = 'x';
    moveSpeed = 2;
    baseHue = Math.random();

    // Create Base Block
    const base = createBlock(INITIAL_BLOCK_SIZE, INITIAL_BLOCK_SIZE, -BLOCK_HEIGHT, 0);
    scene.add(base);
    stack.push(base);

    updateBackground();
    resetCamera();

    const sideLB = document.getElementById("side-leaderboard");
    if (sideLB) sideLB.style.opacity = "0.25";
}

function startGame() {
    gameStartedFlag = true; // mark started
    gameStartTime = Date.now();   // ⏱ start timer
    durationSent = false;

    gameState = 'PLAYING';
    mainMenu.classList.add('hidden');
    spawnBlock();

    // Show leaderboard briefly at start, then dim for gameplay
    const sideLB = document.getElementById("side-leaderboard");
    if (sideLB) {
        sideLB.style.opacity = "0.8"; // Highlight briefly
        loadLeaderboard();
        setTimeout(() => {
            if (gameState === 'PLAYING') {
                sideLB.style.opacity = "0.25"; // Back to background
            }
        }, 3000);
    }

    if (window.trackGameEvent) {
        const osKey = getOSKey();
        window.trackGameEvent(`game_start_${osKey}`, {
            game_name: "Stack 3D",
            os: getOS()
        });
    }
}

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        window.trackGameEvent(`exit_before_game_${osKey}`, {
            os: getOS()
        });
    }
});



function spawnBlock() {
    const prev = stack[stack.length - 1];
    const y = prev.position.y + BLOCK_HEIGHT;

    // Switch direction
    direction = (stack.length % 2 === 0) ? 'x' : 'z';

    const width = prev.geometry.parameters.width;
    const depth = prev.geometry.parameters.depth;

    const offset = 6;
    const x = direction === 'x' ? -offset : prev.position.x;
    const z = direction === 'z' ? -offset : prev.position.z;

    currentBlock = createBlock(width, depth, y, stack.length);
    currentBlock.position.set(x, y, z);
    scene.add(currentBlock);
}

function placeBlock() {
    const prev = stack[stack.length - 1];
    const prevPos = prev.position;
    const currentPos = currentBlock.position;

    const width = currentBlock.geometry.parameters.width;
    const depth = currentBlock.geometry.parameters.depth;

    let diff = 0;
    let isSmashed = false;

    if (direction === 'x') {
        diff = currentPos.x - prevPos.x;
        if (Math.abs(diff) >= width) isSmashed = true;
    } else {
        diff = currentPos.z - prevPos.z;
        if (Math.abs(diff) >= depth) isSmashed = true;
    }

    if (isSmashed) {
        gameOver();
        addPhysics(currentBlock);
        return;
    }

    // Success! Prepare new sizes
    let newWidth = width;
    let newDepth = depth;
    let newX = currentPos.x;
    let newZ = currentPos.z;

    if (direction === 'x') {
        newWidth = width - Math.abs(diff);
        newX = prevPos.x + (diff / 2);
    } else {
        newDepth = depth - Math.abs(diff);
        newZ = prevPos.z + (diff / 2);
    }

    // Snap to perfect
    if (Math.abs(diff) < 0.2) {
        newX = prevPos.x;
        newZ = prevPos.z;
        newWidth = width;
        newDepth = depth;
    }

    // 1. Remove current moving block
    scene.remove(currentBlock);

    // 2. Add solid part
    const solid = createBlock(newWidth, newDepth, currentPos.y, stack.length);
    solid.position.set(newX, currentPos.y, newZ);
    scene.add(solid);
    stack.push(solid);

    // 3. Create Rubble (Simplified)
    createRubble(diff, width, depth, currentPos, prevPos);

    score++;
    scoreEl.innerText = score;
    moveSpeed += 0.05;

    moveCameraUp();
    spawnBlock();
}

function createRubble(diff, width, depth, currentPos, prevPos) {
    if (Math.abs(diff) < 0.2) return; // No rubble for perfect hits

    let rWidth = width;
    let rDepth = depth;
    let rX = currentPos.x;
    let rZ = currentPos.z;

    const sign = diff > 0 ? 1 : -1;

    if (direction === 'x') {
        rWidth = Math.abs(diff);
        const overlapWidth = width - rWidth;
        rX = prevPos.x + (overlapWidth / 2 + rWidth / 2) * sign;
    } else {
        rDepth = Math.abs(diff);
        const overlapDepth = depth - rDepth;
        rZ = prevPos.z + (overlapDepth / 2 + rDepth / 2) * sign;
    }

    const rubble = createBlock(rWidth, rDepth, currentPos.y, stack.length - 1);
    rubble.position.set(rX, currentPos.y, rZ);
    scene.add(rubble);
    addPhysics(rubble);
}

function createBlock(w, d, y, index) {
    const geometry = new THREE.BoxGeometry(w, BLOCK_HEIGHT, d);

    // Color logic
    const hue = (baseHue + index * 0.015) % 1;
    const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(hue, 0.65, 0.5),
        shininess: 100
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.isBlock = true;
    return mesh;
}

function addPhysics(mesh) {
    mesh.velocity = new THREE.Vector3(0, -0.2, 0); // Simple gravity
    mesh.isPhysics = true;
}

function moveCameraUp() {
    const targetY = camera.position.y + BLOCK_HEIGHT;
    // Smoother movement could use GSAP, but simple lerp/step works
    camera.position.y = targetY;
}

function resetCamera() {
    camera.position.set(20, 20, 20);
}

let isGameOver = false; // Global variable to track game over state

function gameOver() {
    if (isGameOver) return;
    isGameOver = true;

    gameState = 'GAMEOVER'; // Keep original game state update
    if (score > bestScore) { // Keep original best score logic
        bestScore = score;
        localStorage.setItem('stackBestScore', bestScore);
    }

    finalScoreEl.innerText = score;
    bestScoreEl.innerText = bestScore; // Keep original best score display
    gameOverMenu.classList.remove('hidden');

    const sideLB = document.getElementById("side-leaderboard");
    if (sideLB) sideLB.style.opacity = "0.8";

    if (window.trackGameEvent) {
        const osKey = getOSKey();
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);


        window.trackGameEvent(`game_over_${osKey}_${seconds}`, {
            game_name: "Stack 3D",
            final_score: score,
            duration_seconds: seconds
        });
    }

    submitScore(score);
}

async function submitScore(scoreVal) {
    if (!supabaseClient) return;
    const country = await getCountry();

    try {
        const { error } = await supabaseClient.from("stack3d_scores").insert([
            {
                username: playerName || "Guest",
                score: scoreVal,
                country: country
            }
        ]);
        if (error) throw error;
        console.log("🏆 Score submitted!");
        loadLeaderboard();
    } catch (err) {
        console.error("Score submission failed:", err);
    }
}


// Smartlink Interstitial Ad & Popunder (Every 3rd Game Over)


function restartGame() {
    isGameOver = false;
    resetGame();
    gameOverMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
}

function updateBackground() {
    scene.background = new THREE.Color().setHSL(baseHue, 0.4, 0.1);
}

function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'PLAYING' && currentBlock) {
        const time = Date.now() * 0.001;
        const limits = 6;
        const pos = Math.sin(time * moveSpeed) * limits;

        if (direction === 'x') {
            currentBlock.position.x = stack[stack.length - 1].position.x + pos;
        } else {
            currentBlock.position.z = stack[stack.length - 1].position.z + pos;
        }
    }

    // Physics Update
    scene.traverse(obj => {
        if (obj.isPhysics) {
            obj.position.add(obj.velocity);
            obj.velocity.y -= 0.01; // Gravity constant
            if (obj.position.y < -20) {
                scene.remove(obj);
            }
        }
    });

    renderer.render(scene, camera);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const size = aspect < 1 ? 12 : 10;
    camera.left = -size * aspect;
    camera.right = size * aspect;
    camera.top = size;
    camera.bottom = -size;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Telegram Share on Game Over ---

function captureTower() {
    renderer.render(scene, camera);
    const gameCanvas = document.getElementById("game-canvas");

    // Create a combined canvas
    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.width = gameCanvas.width;
    mergedCanvas.height = gameCanvas.height;
    const ctx = mergedCanvas.getContext("2d");

    // 1. Draw 3D Game
    ctx.drawImage(gameCanvas, 0, 0);

    // 2. Draw Score
    // Restore styling matching #score in CSS
    const scoreVal = score.toString();
    // Using roughly 15-20% of screen width for font size to match '6rem' feel
    const fontSize = Math.floor(mergedCanvas.width * 0.2);

    ctx.font = `900 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

    // Position: ~14% down from top (matches CSS 14vh margin)
    const yPos = mergedCanvas.height * 0.14;

    ctx.fillText(scoreVal, mergedCanvas.width / 2, yPos);

    return mergedCanvas.toDataURL("image/png");
}

document.addEventListener("DOMContentLoaded", () => {
    const shareBtn = document.getElementById("share-tg-btn");

    if (!shareBtn) return;

    shareBtn.addEventListener("click", async () => {
        if (window.trackGameEvent) {
            window.trackGameEvent("stack_share_click", {
                game: "stack_3d",
                score: score
            });
        }

        const dataUrl = captureTower();
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "stack-score.png", { type: "image/png" });

        try {
            if (navigator.share) {
                await navigator.share({
                    title: "My Stack 3D Score",
                    text: `I scored ${score || 0}!`,
                    files: [file]
                });
            } else {
                const tgLink = `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(
                    `I scored ${score || 0} in Stack 3D! Can you beat me?`
                )}`;
                window.open(tgLink, "_blank");
            }
        } catch (e) {
            console.log("Share cancelled", e);
        }
    });

    const joinTgBtn = document.getElementById("join-tg-btn");
    if (joinTgBtn) {
        joinTgBtn.addEventListener("click", () => {
            if (window.trackGameEvent) {
                window.trackGameEvent("stack_gameover_join_tg_click", {
                    game: "stack_3d",
                    score: score
                });
            }
            window.open("https://t.me/playmixgamesstack3dtower", "_blank");
        });
    }
});


function sendDurationOnExit(reason) {
    if (gameStartTime && !durationSent && window.trackGameEvent) {
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);

        window.trackGameEvent(`game_duration_${seconds}_${reason}_${getOS()}`, {
            seconds,
            end_reason: reason,
            os: getOS()
        });

        durationSent = true;
    }
}



document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        sendDurationOnExit("background");
    }
});

async function loadLeaderboard() {
    const sideList = document.getElementById("side-lb-list");
    const fullList = document.getElementById("full-lb-list");

    // Background list (Always Top 5)
    if (sideList) {
        try {
            if (!supabaseClient) initSupabase();
            const { data, error } = await supabaseClient
                .from("stack3d_scores")
                .select("*")
                .order("score", { ascending: false })
                .limit(5);

            if (error) throw error;

            sideList.innerHTML = data && data.length > 0 ? data.map((p, i) => `
                <div class="lb-row">
                    <span class="lb-rank">${["🥇", "🥈", "🥉", "4", "5"][i] || (i + 1)}</span>
                    <span class="lb-user">${p.username} <small>(${p.country || '??'})</small></span>
                    <span class="lb-score">${p.score}</span>
                </div>
            `).join('') : "<li>-</li>";
        } catch (e) {
            console.error(e);
        }
    }

    // Full screen list (Top 20)
    if (fullList && !document.getElementById("full-leaderboard").classList.contains("hidden")) {
        fullList.innerHTML = "<li>Loading Global Rankings...</li>";
        try {
            const { data, error } = await supabaseClient
                .from("stack3d_scores")
                .select("*")
                .order("score", { ascending: false })
                .limit(20);

            if (error) throw error;

            fullList.innerHTML = data && data.length > 0 ? data.map((p, i) => `
                <div class="lb-row">
                    <span class="lb-rank">${i + 1}</span>
                    <span class="lb-user">${p.username} <small>at ${p.country || 'Unknown'}</small></span>
                    <span class="lb-score">${p.score}</span>
                </div>
            `).join('') : "<li>No global data yet!</li>";
        } catch (e) {
            fullList.innerHTML = "<li>Network Error</li>";
        }
    }
}

window.openFullLeaderboard = function () {
    document.getElementById("full-leaderboard").classList.remove("hidden");
    loadLeaderboard();
};

window.closeFullLeaderboard = function () {
    document.getElementById("full-leaderboard").classList.add("hidden");
};

// Initial setup after DOM loaded
document.addEventListener("DOMContentLoaded", () => {
    // Show Full Leaderboard when clicking background panel
    const viewFull = document.getElementById("view-full-lb");
    if (viewFull) viewFull.addEventListener("click", openFullLeaderboard);

    // Auto-load leaderboard for side panel
    setTimeout(loadLeaderboard, 1000);

    // Also load on side panel hover
    const sideLB = document.getElementById("side-leaderboard");
    if (sideLB) {
        sideLB.addEventListener("mouseenter", loadLeaderboard);
    }

    init();
});

