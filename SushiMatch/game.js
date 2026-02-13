// ===== Game Configuration =====
const CONFIG = {
    sushiTypes: ['🍣', '🍱', '🍙', '🍘', '🍢', '🍡', '🥟', '🍤'],
    colors: [
        0xff6b6b, // Red
        0x4ecdc4, // Teal
        0xffe66d, // Yellow
        0xa8e6cf, // Mint
        0xff8b94, // Pink
        0xc7ceea, // Lavender
        0xffd3b6, // Peach
        0xffaaa5  // Coral
    ],
    baseTime: 60,
    timePerLevel: 5,
    basePairs: 6,
    pairsIncrement: 2,
    maxPairs: 20
};

// ===== Game State =====
let gameState = {
    level: 1,
    score: 0,
    timeRemaining: CONFIG.baseTime,
    isPlaying: false,
    selectedSushi: null,
    sushiObjects: [],
    matchedCount: 0,
    totalPairs: 0,
    timerInterval: null,
    gamesPlayed: 0
};

// ===== Three.js Setup =====
let scene, camera, renderer, raycaster, mouse;
let sushiGroup;

function initThreeJS() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0a0a);
    scene.fog = new THREE.Fog(0x1a0a0a, 10, 50);

    // Camera
    const canvas = document.getElementById('game-canvas');
    camera = new THREE.PerspectiveCamera(
        60,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 8, 15);
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

    // Raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xff6b6b, 1, 20);
    pointLight1.position.set(-5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffd700, 1, 20);
    pointLight2.position.set(5, 5, -5);
    scene.add(pointLight2);

    // Sushi Group
    sushiGroup = new THREE.Group();
    scene.add(sushiGroup);

    // Add decorative elements
    addJapaneseDecor();

    // Event Listeners
    canvas.addEventListener('click', onCanvasClick);
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

// ===== Japanese Decorative Elements =====
function addJapaneseDecor() {
    // Platform
    const platformGeometry = new THREE.CylinderGeometry(12, 12, 0.5, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b0000,
        roughness: 0.3,
        metalness: 0.2
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -2;
    platform.receiveShadow = true;
    scene.add(platform);

    // Torii Gate (simplified)
    const toriiMaterial = new THREE.MeshStandardMaterial({
        color: 0xc8102e,
        roughness: 0.4
    });

    // Vertical posts
    const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 16);
    const post1 = new THREE.Mesh(postGeometry, toriiMaterial);
    post1.position.set(-8, 1, -5);
    scene.add(post1);

    const post2 = new THREE.Mesh(postGeometry, toriiMaterial);
    post2.position.set(8, 1, -5);
    scene.add(post2);

    // Horizontal beam
    const beamGeometry = new THREE.BoxGeometry(17, 0.4, 0.4);
    const beam = new THREE.Mesh(beamGeometry, toriiMaterial);
    beam.position.set(0, 4.5, -5);
    scene.add(beam);
}

// ===== Create Sushi Objects =====
function createSushiLevel(level) {
    // Clear existing sushi
    while (sushiGroup.children.length > 0) {
        sushiGroup.remove(sushiGroup.children[0]);
    }
    gameState.sushiObjects = [];

    // Calculate number of pairs
    const pairCount = Math.min(
        CONFIG.basePairs + (level - 1) * CONFIG.pairsIncrement,
        CONFIG.maxPairs
    );
    gameState.totalPairs = pairCount;
    gameState.matchedCount = 0;

    // Create pairs
    const sushiPairs = [];
    for (let i = 0; i < pairCount; i++) {
        const sushiIndex = i % CONFIG.sushiTypes.length;
        const colorIndex = i % CONFIG.colors.length;
        sushiPairs.push({ type: sushiIndex, color: colorIndex });
        sushiPairs.push({ type: sushiIndex, color: colorIndex });
    }

    // Shuffle
    shuffleArray(sushiPairs);

    // Arrange in 3D space
    const gridSize = Math.ceil(Math.sqrt(sushiPairs.length));
    const spacing = 2.5;
    const offset = (gridSize - 1) * spacing / 2;

    sushiPairs.forEach((sushi, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const x = col * spacing - offset;
        const z = row * spacing - offset;
        const y = Math.random() * 0.5; // Slight height variation

        const sushiObj = createSushiObject(sushi.type, sushi.color, x, y, z);
        sushiObj.userData = {
            type: sushi.type,
            color: sushi.color,
            matched: false,
            selected: false
        };
        sushiGroup.add(sushiObj);
        gameState.sushiObjects.push(sushiObj);
    });

    updateRemainingDisplay();
}

function createSushiObject(typeIndex, colorIndex, x, y, z) {
    const group = new THREE.Group();

    // Base (plate)
    const plateGeometry = new THREE.CylinderGeometry(0.8, 0.9, 0.2, 32);
    const plateMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1
    });
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.castShadow = true;
    plate.receiveShadow = true;
    group.add(plate);

    // Sushi piece (colored sphere)
    const sushiGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const sushiMaterial = new THREE.MeshStandardMaterial({
        color: CONFIG.colors[colorIndex],
        roughness: 0.4,
        metalness: 0.3,
        emissive: CONFIG.colors[colorIndex],
        emissiveIntensity: 0.2
    });
    const sushi = new THREE.Mesh(sushiGeometry, sushiMaterial);
    sushi.position.y = 0.5;
    sushi.castShadow = true;
    group.add(sushi);

    // Add emoji as sprite (visual indicator)
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(CONFIG.sushiTypes[typeIndex], 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.2, 1.2, 1);
    sprite.position.y = 1.5;
    group.add(sprite);

    group.position.set(x, y, z);
    return group;
}

// ===== Mouse Interaction =====
function onCanvasClick(event) {
    if (!gameState.isPlaying) return;

    const canvas = document.getElementById('game-canvas');
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(sushiGroup.children, true);

    if (intersects.length > 0) {
        let clickedSushi = intersects[0].object;
        while (clickedSushi.parent !== sushiGroup) {
            clickedSushi = clickedSushi.parent;
        }

        if (!clickedSushi.userData.matched) {
            handleSushiClick(clickedSushi);
        }
    }
}

function handleSushiClick(sushiObj) {
    // If already selected, deselect
    if (sushiObj.userData.selected) {
        deselectSushi(sushiObj);
        return;
    }

    // If no sushi selected, select this one
    if (!gameState.selectedSushi) {
        selectSushi(sushiObj);
        return;
    }

    // If another sushi is selected, check for match
    if (gameState.selectedSushi !== sushiObj) {
        checkMatch(gameState.selectedSushi, sushiObj);
    }
}

function selectSushi(sushiObj) {
    sushiObj.userData.selected = true;
    gameState.selectedSushi = sushiObj;

    // Visual feedback
    sushiObj.children[1].material.emissiveIntensity = 0.6;
    sushiObj.position.y += 0.5;

    // Play sound effect (if implemented)
    playSound('select');
}

function deselectSushi(sushiObj) {
    sushiObj.userData.selected = false;
    gameState.selectedSushi = null;

    // Reset visual
    sushiObj.children[1].material.emissiveIntensity = 0.2;
    sushiObj.position.y -= 0.5;
}

function checkMatch(sushi1, sushi2) {
    const match = sushi1.userData.type === sushi2.userData.type &&
        sushi1.userData.color === sushi2.userData.color;

    if (match) {
        // Match found!
        handleMatch(sushi1, sushi2);
    } else {
        // No match
        handleMismatch(sushi1, sushi2);
    }
}

function handleMatch(sushi1, sushi2) {
    sushi1.userData.matched = true;
    sushi2.userData.matched = true;
    gameState.matchedCount++;

    // Visual feedback - fade out
    fadeOutSushi(sushi1);
    fadeOutSushi(sushi2);

    // Update score
    const points = 100 * gameState.level;
    gameState.score += points;
    updateScoreDisplay();
    updateRemainingDisplay();

    // Reset selection
    gameState.selectedSushi = null;

    // Play sound
    playSound('match');

    // Create particle effect
    createMatchParticles(sushi1.position);
    createMatchParticles(sushi2.position);

    // Check if level complete
    if (gameState.matchedCount === gameState.totalPairs) {
        setTimeout(() => levelComplete(), 500);
    }

    // Log analytics
    if (window.logAnalyticsEvent) {
        window.logAnalyticsEvent(window.analytics, 'sushi_match', {
            level: gameState.level,
            score: gameState.score
        });
    }
}

function handleMismatch(sushi1, sushi2) {
    // Shake animation
    shakeSushi(sushi1);
    shakeSushi(sushi2);

    // Deselect after delay
    setTimeout(() => {
        deselectSushi(sushi1);
    }, 500);

    // Play sound
    playSound('mismatch');
}

function fadeOutSushi(sushi) {
    const duration = 500;
    const startTime = Date.now();
    const initialY = sushi.position.y;

    function fade() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        sushi.position.y = initialY + progress * 2;
        sushi.scale.setScalar(1 - progress);
        sushi.children.forEach(child => {
            if (child.material) {
                child.material.opacity = 1 - progress;
                child.material.transparent = true;
            }
        });

        if (progress < 1) {
            requestAnimationFrame(fade);
        } else {
            sushiGroup.remove(sushi);
        }
    }

    fade();
}

function shakeSushi(sushi) {
    const originalX = sushi.position.x;
    const shakeAmount = 0.2;
    const duration = 400;
    const startTime = Date.now();

    function shake() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;

        if (progress < 1) {
            sushi.position.x = originalX + Math.sin(progress * Math.PI * 8) * shakeAmount * (1 - progress);
            requestAnimationFrame(shake);
        } else {
            sushi.position.x = originalX;
        }
    }

    shake();
}

// ===== Particle Effects =====
function createMatchParticles(position) {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    for (let i = 0; i < particleCount; i++) {
        positions.push(
            position.x + (Math.random() - 0.5) * 2,
            position.y + (Math.random() - 0.5) * 2,
            position.z + (Math.random() - 0.5) * 2
        );
        colors.push(Math.random(), Math.random(), Math.random());
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 1
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Animate particles
    const duration = 1000;
    const startTime = Date.now();

    function animateParticles() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;

        if (progress < 1) {
            material.opacity = 1 - progress;
            particles.position.y += 0.05;
            requestAnimationFrame(animateParticles);
        } else {
            scene.remove(particles);
        }
    }

    animateParticles();
}

// ===== Game Flow =====
function startGame() {
    gameState.level = 1;
    gameState.score = 0;
    gameState.isPlaying = true;
    gameState.gamesPlayed++;

    updateScoreDisplay();
    showElement('game-hud');

    startLevel();

    // Log analytics
    if (window.logAnalyticsEvent) {
        window.logAnalyticsEvent(window.analytics, 'game_start', {
            game: 'sushi_match'
        });
    }
}

function startLevel() {
    gameState.timeRemaining = CONFIG.baseTime + (gameState.level - 1) * CONFIG.timePerLevel;
    createSushiLevel(gameState.level);
    updateLevelDisplay();
    startTimer();

    // Camera animation
    animateCamera();
}

function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        updateTimerDisplay();

        if (gameState.timeRemaining <= 0) {
            gameOver();
        }
    }, 1000);
}

function levelComplete() {
    clearInterval(gameState.timerInterval);
    gameState.isPlaying = false;

    // Calculate time bonus
    const timeBonus = gameState.timeRemaining * 10;
    gameState.score += timeBonus;

    // Update displays
    document.getElementById('time-bonus').textContent = `+${timeBonus}`;
    updateScoreDisplay();

    // Show level complete screen
    showScreen('levelcomplete-screen');

    // Log analytics
    if (window.logAnalyticsEvent) {
        window.logAnalyticsEvent(window.analytics, 'level_complete', {
            level: gameState.level,
            score: gameState.score,
            time_remaining: gameState.timeRemaining
        });
    }

    // Check for ad display (every 3rd game)
    if (gameState.gamesPlayed % 3 === 0 && typeof showRewardedAd === 'function') {
        showRewardedAd();
    }
}

function nextLevel() {
    gameState.level++;
    gameState.isPlaying = true;
    hideScreen('levelcomplete-screen');
    startLevel();
}

function gameOver() {
    clearInterval(gameState.timerInterval);
    gameState.isPlaying = false;

    // Update final stats
    document.getElementById('final-level').textContent = gameState.level;
    document.getElementById('final-score').textContent = gameState.score;

    // Show game over screen
    showScreen('gameover-screen');
    hideElement('game-hud');

    // Log analytics
    if (window.logAnalyticsEvent) {
        window.logAnalyticsEvent(window.analytics, 'game_over', {
            level: gameState.level,
            score: gameState.score
        });
    }

    // Check for ad display
    if (gameState.gamesPlayed % 3 === 0 && typeof showRewardedAd === 'function') {
        showRewardedAd();
    }
}

function restartGame() {
    hideScreen('gameover-screen');
    startGame();
}

function goHome() {
    window.location.href = '../index.html';
}

// ===== UI Updates =====
function updateScoreDisplay() {
    document.getElementById('score').textContent = gameState.score;
}

function updateLevelDisplay() {
    document.getElementById('level').textContent = gameState.level;
}

function updateTimerDisplay() {
    document.getElementById('timer').textContent = gameState.timeRemaining;
}

function updateRemainingDisplay() {
    const remaining = gameState.totalPairs - gameState.matchedCount;
    document.getElementById('remaining').textContent = remaining;
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

// ===== Camera Animation =====
function animateCamera() {
    const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    const targetPos = { x: 0, y: 8, z: 15 };
    const duration = 1000;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        camera.position.x = startPos.x + (targetPos.x - startPos.x) * eased;
        camera.position.y = startPos.y + (targetPos.y - startPos.y) * eased;
        camera.position.z = startPos.z + (targetPos.z - startPos.z) * eased;
        camera.lookAt(0, 0, 0);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// ===== Animation Loop =====
function animate() {
    requestAnimationFrame(animate);

    // Rotate sushi group slowly
    if (sushiGroup) {
        sushiGroup.rotation.y += 0.001;
    }

    // Animate individual sushi
    gameState.sushiObjects.forEach((sushi, index) => {
        if (!sushi.userData.matched) {
            sushi.rotation.y += 0.01;
            sushi.position.y += Math.sin(Date.now() * 0.001 + index) * 0.001;
        }
    });

    renderer.render(scene, camera);
}

// ===== Window Resize =====
function onWindowResize() {
    const canvas = document.getElementById('game-canvas');
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

// ===== Utility Functions =====
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function playSound(type) {
    // Placeholder for sound effects
    // Can be implemented with Web Audio API or HTML5 Audio
}

// ===== Cherry Blossom Particles =====
function createSakuraParticles() {
    const container = document.getElementById('sakura-container');
    const petalCount = 20;

    for (let i = 0; i < petalCount; i++) {
        const petal = document.createElement('div');
        petal.className = 'sakura-petal';
        petal.style.left = Math.random() * 100 + '%';
        petal.style.animationDuration = (Math.random() * 10 + 10) + 's';
        petal.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(petal);
    }
}

// ===== Event Listeners =====
document.getElementById('restart-btn').addEventListener('click', restartGame);
document.getElementById('next-level-btn').addEventListener('click', nextLevel);
document.getElementById('home-btn').addEventListener('click', goHome);

// ===== Initialize =====
window.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    createSakuraParticles();

    // Auto-start the game after a brief delay
    setTimeout(() => {
        startGame();
    }, 500);

    // Load banner ad if available
    if (typeof loadBannerAd === 'function') {
        loadBannerAd('banner-ad');
    }
});
