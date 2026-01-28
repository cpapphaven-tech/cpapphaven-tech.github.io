/**
 * Traffic Jam - Three.js Implementation
 * Ported from Swift/SceneKit
 */

// --- Constants ---
const GRID_SIZE = 6;
const CELL_SIZE = 1;

// --- Level Data ---
const levels = [
    {
        // Level 1: Intro (Solved in ~2 moves)
        cars: [
            { x: 0, z: 2, len: 2, ori: 'H', color: 0xff4d4d, isPlayer: true },
            { x: 2, z: 0, len: 3, ori: 'V', color: 0x4d79ff, isPlayer: false },
            { x: 4, z: 4, len: 2, ori: 'H', color: 0x4dff4d, isPlayer: false }
        ]
    },
    {
        // Level 2: Simple Vertical Block
        cars: [
            { x: 1, z: 2, len: 2, ori: 'H', color: 0xff4d4d, isPlayer: true },
            { x: 3, z: 1, len: 3, ori: 'V', color: 0xffa500, isPlayer: false },
            { x: 0, z: 0, len: 2, ori: 'V', color: 0x800080, isPlayer: false },
            { x: 4, z: 4, len: 2, ori: 'H', color: 0x00ffff, isPlayer: false }
        ]
    },
    {
        // Level 3: The Double Gate
        cars: [
            { x: 0, z: 2, len: 2, ori: 'H', color: 0xff4d4d, isPlayer: true },
            { x: 2, z: 1, len: 2, ori: 'V', color: 0xffff00, isPlayer: false },
            { x: 3, z: 2, len: 3, ori: 'V', color: 0xff00ff, isPlayer: false },
            { x: 4, z: 0, len: 2, ori: 'V', color: 0xcccccc, isPlayer: false },
            { x: 0, z: 4, len: 3, ori: 'H', color: 0x6699ff, isPlayer: false }
        ]
    },
    {
        // Level 4: Narrow Path
        cars: [
            { x: 0, z: 2, len: 2, ori: 'H', color: 0xff4d4d, isPlayer: true },
            { x: 2, z: 1, len: 2, ori: 'V', color: 0x33ff33, isPlayer: false },
            { x: 2, z: 4, len: 2, ori: 'V', color: 0xff9900, isPlayer: false },
            { x: 3, z: 3, len: 2, ori: 'H', color: 0xff33cc, isPlayer: false },
            { x: 0, z: 0, len: 3, ori: 'H', color: 0x00ccff, isPlayer: false },
            { x: 5, z: 3, len: 2, ori: 'V', color: 0x999999, isPlayer: false }
        ]
    },
    {
        // Level 5: Grid Lock Intro
        cars: [
            { x: 2, z: 2, len: 2, ori: 'H', color: 0xff4d4d, isPlayer: true },
            { x: 1, z: 0, len: 2, ori: 'V', color: 0x4d79ff, isPlayer: false },
            { x: 0, z: 1, len: 2, ori: 'H', color: 0x4dff4d, isPlayer: false },
            { x: 0, z: 4, len: 2, ori: 'H', color: 0xffcc00, isPlayer: false },
            { x: 5, z: 1, len: 2, ori: 'V', color: 0xff00ff, isPlayer: false }
        ]
    },
    {
        // Level 6: The Barrier
        cars: [
            { x: 0, z: 2, len: 2, ori: 'H', color: 0xff4d4d, isPlayer: true },
            { x: 2, z: 1, len: 2, ori: 'V', color: 0x4444ff, isPlayer: false },
            { x: 2, z: 3, len: 2, ori: 'V', color: 0x44ff44, isPlayer: false },
            { x: 4, z: 0, len: 2, ori: 'V', color: 0x888888, isPlayer: false },
            { x: 4, z: 4, len: 2, ori: 'V', color: 0x555555, isPlayer: false },
            { x: 0, z: 4, len: 2, ori: 'H', color: 0xff9999, isPlayer: false },
            { x: 1, z: 5, len: 3, ori: 'H', color: 0x99ff99, isPlayer: false }
        ]
    },
    {
        // Level 7: Tight Maneuvers
        cars: [
            { x: 1, z: 2, len: 2, ori: 'H', color: 0xff4d4d, isPlayer: true },
            { x: 0, z: 1, len: 2, ori: 'V', color: 0xffcc33, isPlayer: false },
            { x: 3, z: 1, len: 2, ori: 'V', color: 0x33ccff, isPlayer: false },
            { x: 4, z: 2, len: 2, ori: 'V', color: 0xcc33ff, isPlayer: false },
            { x: 2, z: 3, len: 2, ori: 'H', color: 0xff3366, isPlayer: false },
            { x: 0, z: 4, len: 3, ori: 'H', color: 0x66ff33, isPlayer: false },
            { x: 4, z: 4, len: 2, ori: 'H', color: 0x3366ff, isPlayer: false }
        ]
    },
    {
        // Level 8: Cornered
        cars: [
            { x: 0, z: 2, len: 2, ori: 'H', color: 0xff4d4d, isPlayer: true },
            { x: 2, z: 1, len: 2, ori: 'V', color: 0xaaaaaa, isPlayer: false },
            { x: 3, z: 0, len: 3, ori: 'V', color: 0x555555, isPlayer: false },
            { x: 2, z: 4, len: 2, ori: 'H', color: 0xffaa00, isPlayer: false },
            { x: 4, z: 4, len: 2, ori: 'V', color: 0x00aaff, isPlayer: false },
            { x: 1, z: 0, len: 2, ori: 'V', color: 0x00ffaa, isPlayer: false },
            { x: 5, z: 3, len: 2, ori: 'V', color: 0xaa00ff, isPlayer: false }
        ]
    },
    {
        // Level 9: Heavy Traffic
        cars: [
            { x: 1, z: 2, len: 2, ori: 'H', color: 0xff4d4d, isPlayer: true },
            { x: 3, z: 2, len: 2, ori: 'V', color: 0xffffff, isPlayer: false },
            { x: 0, z: 0, len: 2, ori: 'H', color: 0x333333, isPlayer: false },
            { x: 4, z: 0, len: 2, ori: 'V', color: 0x444444, isPlayer: false },
            { x: 0, z: 3, len: 2, ori: 'V', color: 0x555555, isPlayer: false },
            { x: 2, z: 4, len: 2, ori: 'H', color: 0x666666, isPlayer: false },
            { x: 5, z: 2, len: 3, ori: 'V', color: 0x777777, isPlayer: false },
            { x: 1, z: 5, len: 3, ori: 'H', color: 0x888888, isPlayer: false }
        ]
    },
    {
        // Level 10: Grand Finale
        cars: [
            { x: 0, z: 2, len: 2, ori: 'H', color: 0xff4d4d, isPlayer: true },
            { x: 2, z: 0, len: 3, ori: 'V', color: 0x111111, isPlayer: false },
            { x: 2, z: 3, len: 2, ori: 'H', color: 0x222222, isPlayer: false },
            { x: 3, z: 1, len: 2, ori: 'V', color: 0x333333, isPlayer: false },
            { x: 0, z: 4, len: 2, ori: 'H', color: 0x444444, isPlayer: false },
            { x: 5, z: 1, len: 3, ori: 'V', color: 0x555555, isPlayer: false },
            { x: 1, z: 4, len: 2, ori: 'V', color: 0x666666, isPlayer: false },
            { x: 3, z: 4, len: 2, ori: 'V', color: 0x777777, isPlayer: false },
            { x: 1, z: 5, len: 3, ori: 'H', color: 0x888888, isPlayer: false }
        ]
    }
];

// --- State ---
let scene, camera, renderer, carsGroup;
let currentLevelIdx = 0;
let gameState = 'MENU';
let cars = []; // { id, x, z, len, ori, node }
let selectedCar = null;
let offset = new THREE.Vector3();
let planeIntersection = new THREE.Vector3();
let dragPlane = new THREE.Plane();
let startGridX, startGridZ;

// DOM
const levelEl = document.getElementById('level-indicator');
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const container = document.getElementById('game-ui');
    const width = container.clientWidth;
    const height = container.clientHeight;

    const aspect = 400 / 480; // Keep logical aspect ratio
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(2.5, 10, 8);
    camera.lookAt(2.5, 0, 2.5);

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Light
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    // Floor
    const floorGeom = new THREE.BoxGeometry(GRID_SIZE, 0.2, GRID_SIZE);
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.set(2.5, -0.1, 2.5);
    scene.add(floor);

    // Grid Lines
    const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x444444, 0x333333);
    gridHelper.position.set(2.5, 0.05, 2.5);
    scene.add(gridHelper);

    // Walls & Exit
    createWalls();

    // Start
    loadLevel(0);
    animate();

    // Events
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    startBtn.addEventListener('click', () => {
        gameState = 'PLAYING';
        mainMenu.classList.add('hidden');
        if (window.trackGameEvent) {
            window.trackGameEvent("game_start", {
                game_name: "Traffic Jam",
                level: 1
            });
        }
    });
    nextBtn.addEventListener('click', () => {
        currentLevelIdx = (currentLevelIdx + 1) % levels.length;
        loadLevel(currentLevelIdx);
        gameOverMenu.classList.add('hidden');
        gameState = 'PLAYING';
    });
}

function createWalls() {
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const gateMat = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

    // Exit Gate (Right side, z=2)
    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 1), gateMat);
    gate.position.set(5.5, 0.1, 2.5);
    scene.add(gate);
}

function loadLevel(idx) {
    if (carsGroup) scene.remove(carsGroup);
    carsGroup = new THREE.Group();
    scene.add(carsGroup);
    cars = [];

    const data = levels[idx];
    data.cars.forEach((c, i) => {
        const car = createCarMesh(c);
        car.userData = { index: i, ...c };
        carsGroup.add(car);
        cars.push({ ...c, node: car });
    });

    levelEl.innerText = `Level ${idx + 1}`;
}

function createCarMesh(c) {
    const h = 0.6;
    const w = c.ori === 'H' ? c.len * 0.95 : 0.9;
    const d = c.ori === 'V' ? c.len * 0.95 : 0.9;

    const group = new THREE.Group();
    const carBody = new THREE.Group();

    // Different appearance for player vs other cars
    if (c.isPlayer) {
        // Player car - GOLD/YELLOW color with extreme glow
        const playerBodyMat = new THREE.MeshPhongMaterial({
            color: 0xFFD700,  // Gold color
            emissive: 0xFFFF00,
            emissiveIntensity: 0.6,
            shininess: 120
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), playerBodyMat);
        body.position.y = h / 2;
        carBody.add(body);

        // Bright gold window
        const windowMat = new THREE.MeshPhongMaterial({
            color: 0xFFAA00,
            emissive: 0xFFFF00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7,
            shininess: 100
        });
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.75, h * 0.35, d * 0.65),
            windowMat
        );
        cabin.position.y = h + 0.08;
        carBody.add(cabin);

        // Large bright headlights
        const lightGeom = new THREE.SphereGeometry(0.15, 12, 12);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

        const light1 = new THREE.Mesh(lightGeom, lightMat);
        light1.position.set(-w * 0.32, h * 0.65, -d * 0.48);
        carBody.add(light1);

        const light2 = new THREE.Mesh(lightGeom, lightMat);
        light2.position.set(w * 0.32, h * 0.65, -d * 0.48);
        carBody.add(light2);

        // Bright red tail lights
        const tailGeom = new THREE.SphereGeometry(0.13, 12, 12);
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });

        const tail1 = new THREE.Mesh(tailGeom, tailMat);
        tail1.position.set(-w * 0.32, h * 0.55, d * 0.48);
        carBody.add(tail1);

        const tail2 = new THREE.Mesh(tailGeom, tailMat);
        tail2.position.set(w * 0.32, h * 0.55, d * 0.48);
        carBody.add(tail2);

        // Add large emergency beacon light on top (police car style)
        const beaconGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 16);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
        const beacon = new THREE.Mesh(beaconGeom, beaconMat);
        beacon.position.y = h + 0.5;
        carBody.add(beacon);

        // Beacon glow ring
        const glowGeom = new THREE.TorusGeometry(0.2, 0.05, 8, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            emissive: 0xFFFF00
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.y = h + 0.5;
        glow.rotation.x = Math.PI / 2;
        carBody.add(glow);

        carBody.userData.beacon = beacon;
        carBody.userData.glow = glow;

        // Add stripe down the middle for extra distinctiveness
        const stripeGeom = new THREE.BoxGeometry(0.08, h * 0.95, d * 0.9);
        const stripeMat = new THREE.MeshPhongMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 0.4
        });
        const stripe = new THREE.Mesh(stripeGeom, stripeMat);
        stripe.position.y = h / 2;
        carBody.add(stripe);

    } else {
        // Regular cars - gray/colored, less shiny
        const bodyMat = new THREE.MeshPhongMaterial({
            color: c.color,
            shininess: 30
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
        body.position.y = h / 2;
        carBody.add(body);

        // Dark tinted windows for regular cars
        const windowMat = new THREE.MeshPhongMaterial({
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.5,
            shininess: 50
        });
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.75, h * 0.35, d * 0.65),
            windowMat
        );
        cabin.position.y = h + 0.08;
        carBody.add(cabin);

        // Dim headlights for other cars
        const lightGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xCCCCCC });

        const light1 = new THREE.Mesh(lightGeom, lightMat);
        light1.position.set(-w * 0.3, h * 0.6, -d * 0.45);
        carBody.add(light1);

        const light2 = new THREE.Mesh(lightGeom, lightMat);
        light2.position.set(w * 0.3, h * 0.6, -d * 0.45);
        carBody.add(light2);
    }

    // Add wheels (same for all cars)
    const wheelRadius = 0.25;
    const wheelThickness = 0.15;
    const wheelGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 16);
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x222222 });

    const wheelPositions = [
        [-w * 0.35, wheelRadius, -d * 0.35],
        [w * 0.35, wheelRadius, -d * 0.35],
        [-w * 0.35, wheelRadius, d * 0.35],
        [w * 0.35, wheelRadius, d * 0.35]
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos[0], pos[1], pos[2]);
        carBody.add(wheel);
    });

    // Wheel rims (center caps)
    const rimGeom = new THREE.CylinderGeometry(wheelRadius * 0.5, wheelRadius * 0.5, 0.05, 16);
    const rimMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 80 });

    wheelPositions.forEach(pos => {
        const rim = new THREE.Mesh(rimGeom, rimMat);
        rim.rotation.z = Math.PI / 2;
        rim.position.set(pos[0], pos[1], pos[2]);
        carBody.add(rim);
    });

    group.add(carBody);

    // Add glowing outline for player car only
    if (c.isPlayer) {
        const outlineGeom = new THREE.BoxGeometry(w + 0.15, h + 0.15, d + 0.15);
        const outlineMat = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.7,
            wireframe: false
        });
        const outline = new THREE.Mesh(outlineGeom, outlineMat);
        outline.position.y = h / 2;
        group.add(outline);

        group.userData.isPlayer = true;
        group.userData.outline = outline;
        group.userData.carBody = carBody;
    }

    // Position in grid
    const cx = c.x + (c.ori === 'H' ? c.len / 2 - 0.5 : 0);
    const cz = c.z + (c.ori === 'V' ? c.len / 2 - 0.5 : 0);
    group.position.set(cx, 0, cz);

    return group;
}

function onPointerDown(event) {
    if (gameState !== 'PLAYING') return;

    const coords = getMouseCoords(event);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(coords, camera);

    const intersects = raycaster.intersectObjects(carsGroup.children, true);
    if (intersects.length > 0) {
        let node = intersects[0].object;
        while (node.parent !== carsGroup) node = node.parent;
        selectedCar = node;

        // Setup drag plane
        dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0));
        raycaster.ray.intersectPlane(dragPlane, planeIntersection);
        offset.copy(selectedCar.position).sub(planeIntersection);

        startGridX = selectedCar.userData.x;
        startGridZ = selectedCar.userData.z;
    }
}

function onPointerMove(event) {
    if (!selectedCar) return;

    const coords = getMouseCoords(event);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(coords, camera);
    raycaster.ray.intersectPlane(dragPlane, planeIntersection);

    const targetPos = planeIntersection.add(offset);
    const c = selectedCar.userData;

    if (c.ori === 'H') {
        const newX = Math.round(targetPos.x - (c.len / 2 - 0.5));
        if (newX !== c.x && canMoveTo(newX, c.z, c)) {
            c.x = newX;
            updateCarPos(selectedCar);
            checkWin();
        }
    } else {
        const newZ = Math.round(targetPos.z - (c.len / 2 - 0.5));
        if (newZ !== c.z && canMoveTo(c.x, newZ, c)) {
            c.z = newZ;
            updateCarPos(selectedCar);
        }
    }
}

function canMoveTo(nx, nz, car) {
    if (nx < 0 || nz < 0) return false;
    if (car.ori === 'H' && nx + car.len > GRID_SIZE) return false;
    if (car.ori === 'V' && nz + car.len > GRID_SIZE) return false;

    // Check collisions
    for (let other of cars) {
        if (other.node === selectedCar) continue;
        if (intersect(nx, nz, car.len, car.ori, other.x, other.z, other.len, other.ori)) return false;
    }
    return true;
}

function intersect(x1, z1, l1, o1, x2, z2, l2, o2) {
    const r1 = {
        minX: x1, maxX: x1 + (o1 === 'H' ? l1 - 1 : 0),
        minZ: z1, maxZ: z1 + (o1 === 'V' ? l1 - 1 : 0)
    };
    const r2 = {
        minX: x2, maxX: x2 + (o2 === 'H' ? l2 - 1 : 0),
        minZ: z2, maxZ: z2 + (o2 === 'V' ? l2 - 1 : 0)
    };
    return r1.maxX >= r2.minX && r1.minX <= r2.maxX && r1.maxZ >= r2.minZ && r1.minZ <= r2.maxZ;
}

function updateCarPos(node) {
    const c = node.userData;
    const cx = c.x + (c.ori === 'H' ? c.len / 2 - 0.5 : 0);
    const cz = c.z + (c.ori === 'V' ? c.len / 2 - 0.5 : 0);
    node.position.set(cx, 0, cz);

    // Update reference
    const ref = cars.find(cr => cr.node === node);
    ref.x = c.x;
    ref.z = c.z;
}

function checkWin() {
    const c = selectedCar.userData;
    if (c.isPlayer && c.x === 4) {
        gameState = 'GAMEOVER';
        gameOverMenu.classList.remove('hidden');

        if (window.trackGameEvent) {
            window.trackGameEvent("level_coomplete", {
                game_name: "Traffic Jam",
                level_completed: currentLevelIdx + 1
            });
        }

        // Show interstitial ad on level complete
        showInterstitialAd();
    }
}

// Smartlink Interstitial Ad & Popunder (Every 3rd Game Over)
function showInterstitialAd() {
    const adsDisabled = document.cookie.includes("noads=true");
    if (adsDisabled) {
        console.log('🚧 Ads disabled via cookie');
        return;
    }

    let gameOverCount = parseInt(localStorage.getItem('trafficJamGameOverCount') || '0');
    gameOverCount++;
    localStorage.setItem('trafficJamGameOverCount', gameOverCount.toString());

    if (gameOverCount % 3 === 0) {
        loadSmartlinkAd();
        console.log(`📊 Level Complete #${gameOverCount} - Ads shown`);
    } else {
        console.log(`📊 Level Complete #${gameOverCount} - Next ads at #${Math.ceil(gameOverCount / 3) * 3}`);
    }
}

function onPointerUp() {
    selectedCar = null;
}

function getMouseCoords(event) {
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1
    };
}

function animate() {
    requestAnimationFrame(animate);

    // Animate player car effects
    if (carsGroup) {
        const time = Date.now() * 0.001;
        carsGroup.children.forEach(carGroup => {
            if (carGroup.userData.isPlayer && carGroup.userData.outline) {
                // Pulse the outline opacity
                const pulse = 0.5 + Math.sin(time * 3) * 0.3;
                carGroup.userData.outline.material.opacity = pulse;

                // Pulse the beacon light
                const carBody = carGroup.userData.carBody;
                if (carBody && carBody.userData.beacon) {
                    const beaconPulse = 0.6 + Math.sin(time * 5) * 0.4;
                    carBody.userData.beacon.material.opacity = beaconPulse;
                    carBody.userData.glow.material.opacity = beaconPulse * 0.8;
                }
            }
        });
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('game-ui');
    if (!container || !camera || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

init();
