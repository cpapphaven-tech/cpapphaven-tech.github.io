// ===== Game Configuration =====
const CONFIG = {
    ingredients: [
        { name: 'Bun', emoji: '🍞', color: 0xf4a460 },
        { name: 'Patty', emoji: '🥩', color: 0x8b4513 },
        { name: 'Cheese', emoji: '🧀', color: 0xffd700 },
        { name: 'Lettuce', emoji: '🥬', color: 0x90ee90 },
        { name: 'Tomato', emoji: '🍅', color: 0xff6347 },
        { name: 'Bacon', emoji: '🥓', color: 0xd2691e }
    ],
    baseSize: 3,
    baseHeight: 0.4,
    moveSpeed: 0.03,
    perfectThreshold: 0.15,
    cameraFollowSpeed: 0.1
};

// ===== Game State =====
let gameState = {
    score: 0,
    height: 0,
    perfectCount: 0,
    combo: 0,
    isPlaying: false,
    currentSize: CONFIG.baseSize,
    stack: [],
    movingPiece: null,
    direction: 1,
    gamesPlayed: 0
};

// ===== Three.js Setup =====
let scene, camera, renderer, raycaster, mouse;
let stackGroup, movingGroup;

let gameStartTime = null;
let durationSent = false;

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

function sendDurationOnExit(reason) {
    if (gameStartTime && !durationSent && window.trackGameEvent) {
        const seconds = Math.round((Date.now() - gameStartTime) / 1000);

        window.trackGameEvent(`game_duration_burgerstack_${seconds}_${reason}_${getBrowser()}`, {
            seconds,
            end_reason: reason,
            os: getOS()
        });

        durationSent = true;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {

        
        sendDurationOnExit("background_burgerstack");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_burgerstack");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        window.trackGameEvent(`exit_before_game_burgerstack_${osKey}`, {
            os: getOS()
        });
    }
});

function initThreeJS() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0f0a);
    scene.fog = new THREE.Fog(0x1a0f0a, 10, 50);

    // Camera
    const canvas = document.getElementById('game-canvas');
    camera = new THREE.PerspectiveCamera(
        45,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 15, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xff6b35, 1, 30);
    pointLight1.position.set(-8, 8, 8);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffd700, 1, 30);
    pointLight2.position.set(8, 8, -8);
    scene.add(pointLight2);

    // Groups
    stackGroup = new THREE.Group();
    scene.add(stackGroup);

    movingGroup = new THREE.Group();
    scene.add(movingGroup);

    // Add base platform
    addBasePlatform();

    // Event Listeners
    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('touchstart', onCanvasClick);
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();

    gameStartTime = Date.now();   // ⏱ start timer
    durationSent = false;
}

// ===== Base Platform =====
function addBasePlatform() {
    const platformGeometry = new THREE.CylinderGeometry(8, 8, 0.5, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.4,
        metalness: 0.2
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -1;
    platform.receiveShadow = true;
    scene.add(platform);

    // Add decorative plate
    const plateGeometry = new THREE.CylinderGeometry(4, 4.5, 0.3, 32);
    const plateMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.5
    });
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.position.y = -0.65;
    plate.receiveShadow = true;
    plate.castShadow = true;
    scene.add(plate);
}

// ===== Create Ingredient Piece =====
function createIngredientPiece(ingredientIndex, width, depth, y) {
    const ingredient = CONFIG.ingredients[ingredientIndex];
    const group = new THREE.Group();

    // Main piece
    const geometry = new THREE.BoxGeometry(width, CONFIG.baseHeight, depth);
    const material = new THREE.MeshStandardMaterial({
        color: ingredient.color,
        roughness: 0.5,
        metalness: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Emoji label
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ingredient.emoji, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.8, 0.8, 1);
    sprite.position.y = CONFIG.baseHeight / 2 + 0.5;
    group.add(sprite);

    group.position.y = y;
    return group;
}

// ===== Game Flow =====
function startGame() {
    gameState.score = 0;
    gameState.height = 0;
    gameState.perfectCount = 0;
    gameState.combo = 0;
    gameState.isPlaying = true;
    gameState.currentSize = CONFIG.baseSize;
    gameState.stack = [];
    gameState.direction = 1;
    gameState.gamesPlayed++;

    // Clear existing pieces
    while (stackGroup.children.length > 0) {
        stackGroup.remove(stackGroup.children[0]);
    }
    while (movingGroup.children.length > 0) {
        movingGroup.remove(movingGroup.children[0]);
    }

    updateScoreDisplay();
    updateHeightDisplay();
    updatePerfectDisplay();
    updateComboDisplay();
    showElement('game-hud');

    // Add first piece (base bun)
    const firstPiece = createIngredientPiece(0, CONFIG.baseSize, CONFIG.baseSize, 0);
    stackGroup.add(firstPiece);
    gameState.stack.push({
        width: CONFIG.baseSize,
        depth: CONFIG.baseSize,
        x: 0,
        z: 0
    });

    // Start first moving piece
    spawnNextPiece();

    // Log analytics
    if (window.logAnalyticsEvent) {
        window.logAnalyticsEvent(window.analytics, 'game_start', {
            game: 'burger_stack'
        });
    }
}

function spawnNextPiece() {
    if (!gameState.isPlaying) return;

    const lastPiece = gameState.stack[gameState.stack.length - 1];
    const ingredientIndex = gameState.height % CONFIG.ingredients.length;
    const y = gameState.height * CONFIG.baseHeight + CONFIG.baseHeight;

    // Alternate direction
    gameState.direction = gameState.height % 2 === 0 ? 1 : -1;

    const piece = createIngredientPiece(
        ingredientIndex,
        gameState.currentSize,
        gameState.currentSize,
        y
    );

    // Start position (off to the side)
    if (gameState.height % 2 === 0) {
        piece.position.x = -10;
        piece.position.z = lastPiece.z;
    } else {
        piece.position.x = lastPiece.x;
        piece.position.z = -10;
    }

    movingGroup.add(piece);
    gameState.movingPiece = {
        mesh: piece,
        axis: gameState.height % 2 === 0 ? 'x' : 'z',
        direction: gameState.direction,
        targetPos: gameState.height % 2 === 0 ? lastPiece.x : lastPiece.z
    };
}

function onCanvasClick(event) {
    if (!gameState.isPlaying || !gameState.movingPiece) return;

    event.preventDefault();
    dropPiece();
}

function dropPiece() {
    const moving = gameState.movingPiece;
    const lastPiece = gameState.stack[gameState.stack.length - 1];

    // Calculate overlap
    let overlap, overhang;
    if (moving.axis === 'x') {
        overlap = Math.min(
            lastPiece.x + lastPiece.width / 2,
            moving.mesh.position.x + gameState.currentSize / 2
        ) - Math.max(
            lastPiece.x - lastPiece.width / 2,
            moving.mesh.position.x - gameState.currentSize / 2
        );
        overhang = moving.mesh.position.x - lastPiece.x;
    } else {
        overlap = Math.min(
            lastPiece.z + lastPiece.depth / 2,
            moving.mesh.position.z + gameState.currentSize / 2
        ) - Math.max(
            lastPiece.z - lastPiece.depth / 2,
            moving.mesh.position.z - gameState.currentSize / 2
        );
        overhang = moving.mesh.position.z - lastPiece.z;
    }

    // Check if piece missed completely
    if (overlap <= 0) {
        gameOver();
        return;
    }

    // Check for perfect placement
    const isPerfect = Math.abs(overhang) < CONFIG.perfectThreshold;

    if (isPerfect) {
        // Perfect placement - no size reduction
        gameState.perfectCount++;
        gameState.combo++;
        gameState.score += 50 + (gameState.combo * 10);
        showPerfectNotification();
        createConfetti(moving.mesh.position);
    } else {
        // Imperfect placement - reduce size
        gameState.currentSize = overlap;
        gameState.combo = 0;
        gameState.score += 10;

        // Trim the piece
        if (moving.axis === 'x') {
            moving.mesh.scale.x = overlap / CONFIG.baseSize;
            moving.mesh.position.x = lastPiece.x + overhang / 2;
        } else {
            moving.mesh.scale.z = overlap / CONFIG.baseSize;
            moving.mesh.position.z = lastPiece.z + overhang / 2;
        }

        // Create falling piece for the cut-off part
        createFallingPiece(moving, overhang, overlap);
    }

    // Move piece to stack
    stackGroup.add(moving.mesh);
    movingGroup.remove(moving.mesh);

    // Add to stack
    gameState.stack.push({
        width: moving.axis === 'x' ? overlap : gameState.currentSize,
        depth: moving.axis === 'z' ? overlap : gameState.currentSize,
        x: moving.mesh.position.x,
        z: moving.mesh.position.z
    });

    gameState.height++;
    gameState.movingPiece = null;

    // Update displays
    updateScoreDisplay();
    updateHeightDisplay();
    updatePerfectDisplay();
    updateComboDisplay();

    // Update camera
    updateCamera();

    // Check if piece is too small
    if (gameState.currentSize < 0.5) {
        gameOver();
        return;
    }

    // Spawn next piece
    setTimeout(() => spawnNextPiece(), 300);

    // Log analytics
    if (window.logAnalyticsEvent && gameState.height % 10 === 0) {
        window.logAnalyticsEvent(window.analytics, 'burger_height', {
            height: gameState.height,
            score: gameState.score
        });
    }
}

function createFallingPiece(moving, overhang, overlap) {
    const ingredientIndex = gameState.height % CONFIG.ingredients.length;
    const ingredient = CONFIG.ingredients[ingredientIndex];

    let width, depth, x, z;
    if (moving.axis === 'x') {
        width = gameState.currentSize - overlap;
        depth = gameState.currentSize;
        x = moving.mesh.position.x + (overhang > 0 ? 1 : -1) * (overlap / 2 + width / 2);
        z = moving.mesh.position.z;
    } else {
        width = gameState.currentSize;
        depth = gameState.currentSize - overlap;
        x = moving.mesh.position.x;
        z = moving.mesh.position.z + (overhang > 0 ? 1 : -1) * (overlap / 2 + depth / 2);
    }

    const geometry = new THREE.BoxGeometry(width, CONFIG.baseHeight, depth);
    const material = new THREE.MeshStandardMaterial({
        color: ingredient.color,
        roughness: 0.5,
        metalness: 0.2
    });
    const fallingPiece = new THREE.Mesh(geometry, material);
    fallingPiece.position.set(x, moving.mesh.position.y, z);
    fallingPiece.castShadow = true;
    scene.add(fallingPiece);

    // Animate falling
    const fallSpeed = 0.2;
    const rotationSpeed = 0.1;
    function fall() {
        fallingPiece.position.y -= fallSpeed;
        fallingPiece.rotation.x += rotationSpeed;
        fallingPiece.rotation.z += rotationSpeed;

        if (fallingPiece.position.y > -10) {
            requestAnimationFrame(fall);
        } else {
            scene.remove(fallingPiece);
        }
    }
    fall();
}

function updateCamera() {
    const targetY = gameState.height * CONFIG.baseHeight + 5;
    camera.position.y += (targetY - camera.position.y) * CONFIG.cameraFollowSpeed;
    camera.lookAt(0, gameState.height * CONFIG.baseHeight, 0);
}

function gameOver() {
    gameState.isPlaying = false;

    // Remove moving piece
    if (gameState.movingPiece) {
        movingGroup.remove(gameState.movingPiece.mesh);
        gameState.movingPiece = null;
    }

    // Update final stats
    document.getElementById('final-height').textContent = gameState.height;
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-perfects').textContent = gameState.perfectCount;

    // Show game over screen
    showScreen('gameover-screen');
    hideElement('game-hud');

    // Log analytics
    if (window.logAnalyticsEvent) {
        window.logAnalyticsEvent(window.analytics, 'game_over', {
            height: gameState.height,
            score: gameState.score,
            perfects: gameState.perfectCount
        });
    }

    // Check for ad display
    if (gameState.gamesPlayed % 3 === 0 && typeof showRewardedAd === 'function') {
        showRewardedAd();
    }
}

function restartGame() {
    hideScreen('gameover-screen');

    // Reset camera
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    startGame();
}

function goHome() {
    window.location.href = '../index.html';
}

// ===== UI Updates =====
function updateScoreDisplay() {
    document.getElementById('score').textContent = gameState.score;
}

function updateHeightDisplay() {
    document.getElementById('height').textContent = gameState.height;
}

function updatePerfectDisplay() {
    document.getElementById('perfect-count').textContent = gameState.perfectCount;
}

function updateComboDisplay() {
    document.getElementById('combo').textContent = gameState.combo;
}

function showPerfectNotification() {
    const notification = document.getElementById('perfect-notification');
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 1000);
}

function showScreen(screenId) {
    document.getElementById(screenId).classList.remove('hidden');
}

function hideScreen(screenId) {
    document.getElementById(screenId).classList.add('hidden');
}

function showElement(elementId) {
    document.getElementById(elementId).classList.remove('hidden');
}

function hideElement(elementId) {
    document.getElementById(elementId).classList.add('hidden');
}

// ===== Confetti Effect =====
function createConfetti(position) {
    const particleCount = 30;
    const colors = [0xffd700, 0xff6b35, 0xff6347, 0x90ee90];

    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)]
        });
        const particle = new THREE.Mesh(geometry, material);

        particle.position.set(
            position.x + (Math.random() - 0.5) * 2,
            position.y + (Math.random() - 0.5) * 2,
            position.z + (Math.random() - 0.5) * 2
        );

        const velocity = {
            x: (Math.random() - 0.5) * 0.2,
            y: Math.random() * 0.3,
            z: (Math.random() - 0.5) * 0.2
        };

        scene.add(particle);

        function animateParticle() {
            particle.position.x += velocity.x;
            particle.position.y += velocity.y;
            particle.position.z += velocity.z;
            velocity.y -= 0.01; // Gravity

            if (particle.position.y > -10) {
                requestAnimationFrame(animateParticle);
            } else {
                scene.remove(particle);
            }
        }

        animateParticle();
    }
}

// ===== Animation Loop =====
function animate() {
    requestAnimationFrame(animate);

    // Move the current piece
    if (gameState.movingPiece && gameState.isPlaying) {
        const moving = gameState.movingPiece;
        if (moving.axis === 'x') {
            moving.mesh.position.x += CONFIG.moveSpeed * moving.direction;
            if (Math.abs(moving.mesh.position.x) > 10) {
                moving.direction *= -1;
            }
        } else {
            moving.mesh.position.z += CONFIG.moveSpeed * moving.direction;
            if (Math.abs(moving.mesh.position.z) > 10) {
                moving.direction *= -1;
            }
        }

        // Rotate for visual effect
        moving.mesh.rotation.y += 0.02;
    }

    // Slight rotation of stack for visual appeal
    stackGroup.rotation.y += 0.001;

    renderer.render(scene, camera);
}

// ===== Window Resize =====
function onWindowResize() {
    const canvas = document.getElementById('game-canvas');
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

function loadAdsterraBanner() {
    // Desktop only check (using User Agent and Screen Width for safety)
    const osKey = getOSKey();
    if (osKey === "android" || osKey === "ios" || window.innerWidth < 1024) {
        return;
    }

     console.log("continue Adsterra Banner...");
    const container = document.getElementById("adsterra-banner");
    if (!container) return;

    setTimeout(() => {
        console.log("Loading Adsterra Banner...");

        // Create an iframe to safely isolate the ad execution
        const iframe = document.createElement('iframe');
        iframe.style.width = "160px";
        iframe.style.height = "600px";
        iframe.style.border = "none";
        iframe.style.overflow = "hidden";
        iframe.scrolling = "no";

        container.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
            <body style="margin:0;padding:0;background:transparent;">
                <script>
                    atOptions = {
                        'key' : '34488dc997487ff336bf5de366c86553',
                        'format' : 'iframe',
                        'height' : 600,
                        'width' : 160,
                        'params' : {}
                    };
                </script>
                <script src="https://www.highperformanceformat.com/34488dc997487ff336bf5de366c86553/invoke.js"></script>
            </body>
            </html>
        `);
        doc.close();



    }, 2000);
}

// ===== Event Listeners =====
document.getElementById('restart-btn').addEventListener('click', restartGame);
document.getElementById('home-btn').addEventListener('click', goHome);

// ===== Initialize =====
window.addEventListener('DOMContentLoaded', () => {
    initThreeJS();

    // Auto-start the game after a brief delay
    setTimeout(() => {
        startGame();
    }, 500);

    // Load banner ad if available
    if (typeof loadBannerAd === 'function') {
        loadBannerAd('banner-ad');
    }

   if (!window.DEV_MODE) {
                  loadAdsterraBanner();
       }
});
