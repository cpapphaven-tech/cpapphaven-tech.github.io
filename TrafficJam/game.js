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
            { x: 2, z: 2, len: 2, ori: 'V', color: 0x33ff33, isPlayer: false },
            { x: 4, z: 1, len: 3, ori: 'V', color: 0xff9900, isPlayer: false },
            { x: 2, z: 4, len: 2, ori: 'H', color: 0xff33cc, isPlayer: false },
            { x: 0, z: 0, len: 3, ori: 'H', color: 0x00ccff, isPlayer: false },
            { x: 5, z: 3, len: 2, ori: 'V', color: 0x999999, isPlayer: false }
        ]
    },
    {
        // Level 5: Grid Lock Intro
        cars: [
            { x: 2, z: 2, len: 2, ori: 'H', color: 0xff4d4d, isPlayer: true },
            { x: 1, z: 1, len: 3, ori: 'V', color: 0x4d79ff, isPlayer: false },
            { x: 4, z: 2, len: 3, ori: 'V', color: 0x4dff4d, isPlayer: false },
            { x: 0, z: 4, len: 2, ori: 'H', color: 0xffcc00, isPlayer: false },
            { x: 3, z: 0, len: 2, ori: 'H', color: 0xff00ff, isPlayer: false }
        ]
    },
    {
        // Level 6: The Barrier
        cars: [
            { x: 0, z: 2, len: 2, ori: 'H', color: 0xff4d4d, isPlayer: true },
            { x: 2, z: 0, len: 3, ori: 'V', color: 0x4444ff, isPlayer: false },
            { x: 3, z: 1, len: 2, ori: 'H', color: 0x44ff44, isPlayer: false },
            { x: 5, z: 0, len: 3, ori: 'V', color: 0x888888, isPlayer: false }, // Shortened truck to creating gap
            { x: 5, z: 4, len: 2, ori: 'V', color: 0x555555, isPlayer: false }, // Added lower blocker
            { x: 0, z: 4, len: 2, ori: 'V', color: 0xff9999, isPlayer: false },
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
            { x: 2, z: 2, len: 2, ori: 'V', color: 0xaaaaaa, isPlayer: false },
            { x: 3, z: 0, len: 3, ori: 'V', color: 0x555555, isPlayer: false },
            { x: 4, z: 0, len: 2, ori: 'H', color: 0xffaa00, isPlayer: false },
            { x: 4, z: 4, len: 2, ori: 'V', color: 0x00aaff, isPlayer: false },
            { x: 1, z: 0, len: 2, ori: 'V', color: 0x00ffaa, isPlayer: false },
            { x: 0, z: 5, len: 3, ori: 'H', color: 0xaa00ff, isPlayer: false }
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
            { x: 3, z: 1, len: 2, ori: 'H', color: 0x222222, isPlayer: false },
            { x: 4, z: 2, len: 2, ori: 'V', color: 0x333333, isPlayer: false },
            { x: 0, z: 4, len: 2, ori: 'H', color: 0x444444, isPlayer: false },
            { x: 3, z: 3, len: 3, ori: 'V', color: 0x555555, isPlayer: false },
            { x: 1, z: 0, len: 2, ori: 'V', color: 0x666666, isPlayer: false },
            { x: 5, z: 0, len: 2, ori: 'V', color: 0x777777, isPlayer: false },
            { x: 0, z: 5, len: 5, ori: 'H', color: 0x888888, isPlayer: false }
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

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshPhongMaterial({ color: c.color })
    );
    body.position.y = h / 2;
    group.add(body);

    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.7, h * 0.4, d * 0.7),
        new THREE.MeshPhongMaterial({ color: 0x111111, transparent: true, opacity: 0.8 })
    );
    cabin.position.y = h + 0.1;
    group.add(cabin);

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
