// Game Configuration
const CONFIG = {
    TUBE_RADIUS: 0.45, // Wider
    TUBE_HEIGHT: 2.6,  // Shorter
    TUBE_SEGMENTS: 32,
    LIQUID_HEIGHT: 0.62, // Adjusted for new height
    MAX_UNITS: 4,
    COLORS: [
        0xFF3333, 0x33FF33, 0x3333FF, 0xFFFF33,
        0xFF33FF, 0x33FFFF, 0xFFA500, 0x800080,
        0xA52A2A, 0xFFC0CB, 0x808080, 0xFFFFFF
    ],
    TUBE_GAP: 1.4, // Increased gap for wider bottles
    ROW_GAP: 3.8   // Adjusted row gap
};

// State
let state = {
    level: 1,
    moves: 0,
    tubes: [], // Array of Tube objects
    selectedTube: null, // Currently selected tube index
    isAnimating: false,
    history: [], // For Undo
    score: 0
};

// Three.js Globals
let scene, camera, renderer, raycaster, mouse;
let tubesContainer;

let gameStartTime = null;
let durationSent = false;

// UI Elements
const ui = {
    level: document.getElementById('current-level'),
    restartBtn: document.getElementById('restart-btn'),
    undoBtn: document.getElementById('undo-btn'),
    addTubeBtn: document.getElementById('add-tube-btn'),
    levelComplete: document.getElementById('level-complete-screen'),
    nextLevelBtn: document.getElementById('next-level-btn')
};

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

        window.trackGameEvent(`game_duration_watersort_${seconds}_${reason}_${getBrowser()}`, {
            seconds,
            end_reason: reason,
            os: getOS()
        });

        durationSent = true;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {


        sendDurationOnExit("background_watersort");
    }
});

window.addEventListener("beforeunload", () => {

    sendDurationOnExit("tab_close_watersort");

    if (!gameStartedFlag && window.trackGameEvent) {
        const osKey = getOSKey();
        window.trackGameEvent(`exit_before_game_watersort_${osKey}`, {
            os: getOS()
        });
    }
});

function loadAdsterraBanner() {
    // Desktop only check (using User Agent and Screen Width for safety)
    const osKey = getOSKey();
    if (osKey === "android" || osKey === "ios" || window.innerWidth < 1024) {
        return;
    }

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

// --- Initialization ---
function init() {
    // Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1020);
    // Fog for depth
    scene.fog = new THREE.FogExp2(0x0f1020, 0.03);

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 0, 0);

    // Renderer
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    canvas.addEventListener('pointerdown', onPointerDown);

    ui.restartBtn.addEventListener('click', restartLevel);
    ui.undoBtn.addEventListener('click', requestUndo);
    ui.nextLevelBtn.addEventListener('click', nextLevel);

    // Undo Modal Listeners
    document.getElementById('cancel-undo-btn').addEventListener('click', closeUndoModal);
    document.getElementById('confirm-undo-btn').addEventListener('click', watchAdAndUndo);

    // Start Game
    startLevel(1);
    animate();

    if (!window.DEV_MODE) {
        loadAdsterraBanner();
    }

    gameStartTime = Date.now();   // ⏱ start timer
    durationSent = false;
}

function startLevel(levelNum) {
    state.level = levelNum;
    state.moves = 0;
    state.history = [];
    state.selectedTube = null;
    state.isAnimating = false;
    ui.level.textContent = levelNum;

    // Hide overlays
    ui.levelComplete.classList.remove('visible');
    ui.levelComplete.classList.add('hidden'); // Ensure hidden class is added

    // Clear existing tubes
    if (tubesContainer) scene.remove(tubesContainer);
    tubesContainer = new THREE.Group();
    scene.add(tubesContainer);

    // Generate Level Data
    const levelData = generateLevel(levelNum);
    createTubes(levelData);

    // Log Analytics
    if (window.logAnalyticsEvent) {
        window.logAnalyticsEvent(window.analytics, 'level_start', { level: levelNum });
    }
}

// --- Level Generation ---
function generateLevel(level) {
    // Difficulty logic: Harder start
    let numColors = Math.min(4 + Math.floor(level / 2), 12); // Start with 4, max 12
    let emptyTubes = 2;
    let totalTubes = numColors + emptyTubes;

    // 1. Create sorted tubes
    let tubesData = [];
    for (let c = 0; c < numColors; c++) {
        let colorId = c % CONFIG.COLORS.length;
        tubesData.push([colorId, colorId, colorId, colorId]);
    }
    // Add empty tubes
    for (let i = 0; i < emptyTubes; i++) {
        tubesData.push([]);
    }

    // 2. Shuffle: Increased moves
    let shuffleMoves = 40 + (level * 5);
    let currentData = JSON.parse(JSON.stringify(tubesData));

    let lastFrom = -1;
    for (let m = 0; m < shuffleMoves; m++) {
        let from = Math.floor(Math.random() * totalTubes);
        let to = Math.floor(Math.random() * totalTubes);

        // SHUFFLE: Allow mixing ANY color (ignore matching rule)
        // Check only for capacity
        const fromTube = currentData[from];
        const toTube = currentData[to];

        if (from !== to && from !== lastFrom && fromTube.length > 0 && toTube.length < CONFIG.MAX_UNITS) {
            let color = currentData[from].pop();
            currentData[to].push(color);
            lastFrom = to;
        } else {
            // Retry more aggressively to ensure good shuffle
            if (Math.random() > 0.3) m--;
        }
    }
    return currentData;
}

function isValidMove(data, fromIdx, toIdx) {
    const fromTube = data[fromIdx];
    const toTube = data[toIdx];

    if (fromTube.length === 0) return false; // Source empty
    if (toTube.length >= CONFIG.MAX_UNITS) return false; // Target full

    const colorToMove = fromTube[fromTube.length - 1];

    if (toTube.length === 0) return true;
    const targetTopColor = toTube[toTube.length - 1];

    return colorToMove === targetTopColor;
}

// --- 3D Object Creation ---
function createTubes(levelData) {
    state.tubes = [];

    const radius = CONFIG.TUBE_RADIUS;
    const height = CONFIG.TUBE_HEIGHT;
    const segments = 32;

    // Improved Real Glass Material
    const glassMaterialFront = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.95,
        transparent: true,
        opacity: 0.4,
        side: THREE.FrontSide,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05
    });

    const glassMaterialBack = new THREE.MeshPhysicalMaterial({
        color: 0x5599ff,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.8,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.9
    });

    const cylinderGeo = new THREE.CylinderGeometry(radius, radius, height, segments, 1, true);
    const bottomGeo = new THREE.SphereGeometry(radius, segments, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);

    // Thinner Rim: Radius 0.02
    const rimGeo = new THREE.TorusGeometry(radius, 0.02, 16, 48);

    const totalTubes = levelData.length;
    const rows = totalTubes > 5 ? 2 : 1;
    const tubesPerRow = Math.ceil(totalTubes / rows);

    levelData.forEach((colors, index) => {
        const tubeGroup = new THREE.Group();

        const tubeBack = new THREE.Mesh(cylinderGeo, glassMaterialBack);
        tubeBack.renderOrder = 1;
        tubeGroup.add(tubeBack);

        const tubeFront = new THREE.Mesh(cylinderGeo, glassMaterialFront);
        tubeFront.renderOrder = 3;
        tubeGroup.add(tubeFront);

        const bottomBack = new THREE.Mesh(bottomGeo, glassMaterialBack);
        bottomBack.position.y = -height / 2;
        bottomBack.renderOrder = 1;
        tubeGroup.add(bottomBack);

        const bottomFront = new THREE.Mesh(bottomGeo, glassMaterialFront);
        bottomFront.position.y = -height / 2;
        bottomFront.renderOrder = 3;
        tubeGroup.add(bottomFront);

        const tubeRim = new THREE.Mesh(rimGeo, rimMaterial);
        tubeRim.position.y = height / 2;
        tubeRim.rotation.x = Math.PI / 2;
        tubeGroup.add(tubeRim);

        const liquids = [];
        colors.forEach((colorId, i) => {
            const liquid = createLiquidUnit(colorId, i);
            tubeGroup.add(liquid);
            liquids.push({ mesh: liquid, colorId: colorId });
        });

        // Positioning
        const row = Math.floor(index / tubesPerRow);
        const col = index % tubesPerRow;
        const rowWidth = (tubesPerRow - 1) * CONFIG.TUBE_GAP;
        const xPos = (col * CONFIG.TUBE_GAP) - (rowWidth / 2);

        let yPos = 0;
        if (rows > 1) {
            yPos = (row === 0) ? CONFIG.ROW_GAP / 2 : -CONFIG.ROW_GAP / 2;
        }

        tubeGroup.position.set(xPos, yPos, 0);

        tubeGroup.userData = {
            id: index,
            originalX: xPos,
            originalY: yPos,
            originalZ: 0
        };

        tubesContainer.add(tubeGroup);
        state.tubes.push({ group: tubeGroup, liquids: liquids });
    });

    adjustCamera(rows);
}

function createLiquidUnit(colorId, unitIndex) {
    const height = CONFIG.LIQUID_HEIGHT;
    const geometry = new THREE.CylinderGeometry(CONFIG.TUBE_RADIUS - 0.05, CONFIG.TUBE_RADIUS - 0.05, height, 32);
    const material = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS[colorId] });

    const yPos = (-CONFIG.TUBE_HEIGHT / 2) + (height * unitIndex) + (height / 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = yPos;
    mesh.renderOrder = 2; // Between back and front glass

    return mesh;
}

function adjustCamera(rows) {
    const aspect = window.innerWidth / window.innerHeight;
    let targetZ = 14;
    let targetY = 0;

    if (aspect < 1) {
        // Mobile Portrait: Zoom out significantly
        targetZ = 20 + (rows * 5);
        // Shift bottles down for better mobile view
        targetY = -3.5;
    } else {
        targetZ = rows > 1 ? 16 : 14;
        targetY = 0;
    }

    gsap.to(camera.position, { z: targetZ, duration: 1 });
    if (tubesContainer) {
        gsap.to(tubesContainer.position, { y: targetY, duration: 1 });
    }
}

// --- Interaction ---
function onPointerDown(event) {
    if (state.isAnimating) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(tubesContainer.children, true);

    if (intersects.length > 0) {
        let target = intersects[0].object;
        while (target.parent !== tubesContainer) {
            target = target.parent;
            if (!target) return;
        }

        const tubeIndex = target.userData.id;
        handleTubeClick(tubeIndex);
    } else {
        deselectTube();
    }
}

function handleTubeClick(index) {
    if (state.selectedTube === index) {
        deselectTube();
        return;
    }

    if (state.selectedTube === null) {
        const tube = state.tubes[index];
        if (tube.liquids.length === 0) return;
        selectTube(index);
    } else {
        attemptMove(state.selectedTube, index);
    }
}

function selectTube(index) {
    state.selectedTube = index;
    const group = state.tubes[index].group;
    // Lift animation relative to original Y
    const liftHeight = 0.5;
    gsap.to(group.position, { y: group.userData.originalY + liftHeight, duration: 0.2 });
}

function deselectTube() {
    if (state.selectedTube !== null) {
        const index = state.selectedTube;
        const group = state.tubes[index].group;

        // Return to original position (X and Y)
        gsap.to(group.position, {
            x: group.userData.originalX,
            y: group.userData.originalY,
            z: group.userData.originalZ,
            duration: 0.3,
            ease: "power2.out"
        });

        state.selectedTube = null;
    }
}

function attemptMove(fromIdx, toIdx) {
    const fromTube = state.tubes[fromIdx];
    const toTube = state.tubes[toIdx];

    if (toTube.liquids.length >= CONFIG.MAX_UNITS) {
        // Target full
        shakeTube(fromIdx);
        return;
    }

    const colorToMove = fromTube.liquids[fromTube.liquids.length - 1].colorId;

    let canPour = false;
    if (toTube.liquids.length === 0) {
        canPour = true;
    } else {
        const topColor = toTube.liquids[toTube.liquids.length - 1].colorId;
        if (topColor === colorToMove) canPour = true;
    }

    if (!canPour) {
        deselectTube();
        return;
    }

    // Determine how many units to move
    let unitsToMove = 0;
    for (let i = fromTube.liquids.length - 1; i >= 0; i--) {
        if (fromTube.liquids[i].colorId === colorToMove) {
            unitsToMove++;
        } else {
            break;
        }
    }

    const spaceAvailable = CONFIG.MAX_UNITS - toTube.liquids.length;
    const actualMoveCount = Math.min(unitsToMove, spaceAvailable);

    performPourAnimation(fromIdx, toIdx, actualMoveCount, colorToMove);
}

function performPourAnimation(fromIdx, toIdx, count, colorId) {
    state.isAnimating = true;
    state.moves++;

    state.history.push({
        from: fromIdx,
        to: toIdx,
        count: count,
        colorId: colorId
    });

    const fromGroup = state.tubes[fromIdx].group;
    const toGroup = state.tubes[toIdx].group;

    const targetPos = toGroup.position.clone();
    targetPos.y += 2.5;
    targetPos.x -= 1.2;

    const tl = gsap.timeline({
        onComplete: () => {
            deselectTube();
            state.isAnimating = false;
            checkWinCondition();
        }
    });

    tl.to(fromGroup.position, { x: targetPos.x, y: targetPos.y, duration: 0.5, ease: "power2.out" });
    tl.to(fromGroup.rotation, { z: -Math.PI / 4, duration: 0.3 }, "-=0.2");

    const fromTube = state.tubes[fromIdx];
    const toTube = state.tubes[toIdx];
    const movedLiquids = fromTube.liquids.splice(fromTube.liquids.length - count, count);

    tl.add(() => {
        movedLiquids.forEach(l => fromGroup.remove(l.mesh));

        const startIdx = toTube.liquids.length;
        for (let i = 0; i < count; i++) {
            const newLiquid = createLiquidUnit(colorId, startIdx + i);
            newLiquid.scale.set(0, 0, 0);
            toGroup.add(newLiquid);
            gsap.to(newLiquid.scale, { x: 1, y: 1, z: 1, duration: 0.2, delay: i * 0.1 });
            toTube.liquids.push({ mesh: newLiquid, colorId: colorId });
        }
    }, "-=0.1");

    tl.to({}, { duration: 0.4 });
    tl.to(fromGroup.rotation, { z: 0, duration: 0.3 });
}

function shakeTube(index) {
    const group = state.tubes[index].group;
    const originalX = group.userData.originalX;
    gsap.to(group.position, { x: originalX + 0.1, duration: 0.05, yoyo: true, repeat: 3 });
}

// --- Undo Logic ---
function requestUndo() {
    if (state.history.length === 0 || state.isAnimating) return;
    const modal = document.getElementById('undo-modal');
    modal.classList.remove('hidden');
    modal.classList.add('visible');
}

function closeUndoModal() {
    const modal = document.getElementById('undo-modal');
    modal.classList.remove('visible');
    modal.classList.add('hidden');
}

function watchAdAndUndo() {
    closeUndoModal();
    if (window.shouldLoadAds && window.shouldLoadAds()) {
        if (typeof loadSmartlinkAd === 'function') {
            loadSmartlinkAd();
            setTimeout(performUndo, 1000);
        } else {
            performUndo();
        }
    } else {
        performUndo();
    }
}

function performUndo() {
    if (state.history.length === 0) return;

    const lastMove = state.history.pop();
    const { from, to, count, colorId } = lastMove;

    state.isAnimating = true;

    const fromTube = state.tubes[from];
    const toTube = state.tubes[to];

    const movedLiquids = toTube.liquids.splice(toTube.liquids.length - count, count);
    movedLiquids.forEach(l => toTube.group.remove(l.mesh));

    const startIdx = fromTube.liquids.length;
    for (let i = 0; i < count; i++) {
        const newLiquid = createLiquidUnit(colorId, startIdx + i);
        fromTube.group.add(newLiquid);
        fromTube.liquids.push({ mesh: newLiquid, colorId: colorId });
    }

    state.isAnimating = false;
}

// --- Win Condition ---
function checkWinCondition() {
    let won = true;
    for (const tube of state.tubes) {
        if (tube.liquids.length === 0) continue;
        if (tube.liquids.length !== CONFIG.MAX_UNITS) {
            won = false;
            break;
        }
        const firstColor = tube.liquids[0].colorId;
        const allSame = tube.liquids.every(l => l.colorId === firstColor);
        if (!allSame) {
            won = false;
            break;
        }
    }
    if (won) {
        setTimeout(levelComplete, 500);
    }
}

function levelComplete() {
    ui.levelComplete.classList.remove('hidden');
    ui.levelComplete.classList.add('visible');
    if (window.logAnalyticsEvent) {
        window.logAnalyticsEvent(window.analytics, 'level_complete', { level: state.level });
    }
}

function nextLevel() {
    startLevel(state.level + 1);
}

function restartLevel() {
    startLevel(state.level);
}

// --- Utils ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (state.tubes.length > 0) {
        const rows = state.tubes.length > 5 ? 2 : 1;
        adjustCamera(rows);
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Start
window.onload = init;
