/**
 * Subway Runner 3D: Endless Track Surfer – PlayMixGames
 * 3-Lane Railway Tracks, Trains, Barriers, Rolling, Jumping, Coins, and Power-ups
 */
(function () {
    'use strict';

    // --- Web Audio Synthesizer ---
    var audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    var coinNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    var coinStreak = 0;
    var lastCoinTime = 0;

    function playSound(type) {
        try {
            var ctx = getAudioCtx();
            if (!ctx) return;
            var now = ctx.currentTime;

            if (type === 'jump') {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(700, now + 0.16);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.16);
            } else if (type === 'roll') {
                var oscR = ctx.createOscillator();
                var gainR = ctx.createGain();
                oscR.type = 'sine';
                oscR.frequency.setValueAtTime(380, now);
                oscR.frequency.exponentialRampToValueAtTime(140, now + 0.18);
                gainR.gain.setValueAtTime(0.22, now);
                gainR.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                oscR.connect(gainR);
                gainR.connect(ctx.destination);
                oscR.start(now);
                oscR.stop(now + 0.18);
            } else if (type === 'lane') {
                var oscL = ctx.createOscillator();
                var gainL = ctx.createGain();
                oscL.type = 'sine';
                oscL.frequency.setValueAtTime(440, now);
                oscL.frequency.exponentialRampToValueAtTime(330, now + 0.08);
                gainL.gain.setValueAtTime(0.15, now);
                gainL.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                oscL.connect(gainL);
                gainL.connect(ctx.destination);
                oscL.start(now);
                oscL.stop(now + 0.08);
            } else if (type === 'coin') {
                if (now - lastCoinTime > 1.2) coinStreak = 0;
                lastCoinTime = now;
                var note = coinNotes[coinStreak % coinNotes.length];
                coinStreak++;

                var oscC = ctx.createOscillator();
                var gainC = ctx.createGain();
                oscC.type = 'sine';
                oscC.frequency.setValueAtTime(note, now);
                oscC.frequency.exponentialRampToValueAtTime(note * 1.5, now + 0.14);
                gainC.gain.setValueAtTime(0.22, now);
                gainC.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
                oscC.connect(gainC);
                gainC.connect(ctx.destination);
                oscC.start(now);
                oscC.stop(now + 0.14);
            } else if (type === 'powerup') {
                [523.25, 659.25, 783.99, 1046.50].forEach(function (f, i) {
                    var oscP = ctx.createOscillator();
                    var gainP = ctx.createGain();
                    oscP.type = 'triangle';
                    oscP.frequency.setValueAtTime(f, now + i * 0.06);
                    gainP.gain.setValueAtTime(0.25, now + i * 0.06);
                    gainP.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.22);
                    oscP.connect(gainP);
                    gainP.connect(ctx.destination);
                    oscP.start(now + i * 0.06);
                    oscP.stop(now + i * 0.06 + 0.22);
                });
            } else if (type === 'crash') {
                var oscK = ctx.createOscillator();
                var gainK = ctx.createGain();
                oscK.type = 'sawtooth';
                oscK.frequency.setValueAtTime(160, now);
                oscK.frequency.exponentialRampToValueAtTime(30, now + 0.4);
                gainK.gain.setValueAtTime(0.4, now);
                gainK.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                oscK.connect(gainK);
                gainK.connect(ctx.destination);
                oscK.start(now);
                oscK.stop(now + 0.4);
            }
        } catch (e) {}
    }

    // --- State Variables ---
    var canvas = document.getElementById('subway-canvas');
    var container = document.getElementById('canvas-container');
    var isPlaying = false;
    var isGameOver = false;

    var distance = 0;
    var coins = 0;
    var multiplier = 1;
    var highScore = parseInt(localStorage.getItem('pmg_subwayrunner_high') || '0', 10);

    var baseSpeed = 28; // Units/s forward speed
    var currentSpeed = 28;
    var maxSpeed = 65;

    // Lanes: -1 (Left), 0 (Center), 1 (Right)
    var LANE_WIDTH = 2.4;
    var currentLane = 0; // 0 = center
    var targetX = 0;

    // DOM Elements
    var scoreEl = document.getElementById('score-val');
    var coinsEl = document.getElementById('coins-val');
    var multEl = document.getElementById('mult-val');
    var highEl = document.getElementById('high-val');
    var startOverlay = document.getElementById('start-overlay');
    var winModal = document.getElementById('win-modal');
    var winScoreEl = document.getElementById('win-score');
    var winCoinsEl = document.getElementById('win-coins');
    var winHighEl = document.getElementById('win-high');
    var playAgainBtn = document.getElementById('play-again-btn');

    // Powerup DOM Pills
    var pillMagnet = document.getElementById('pill-magnet');
    var pillJumpBoost = document.getElementById('pill-jumpboost');
    var pill2x = document.getElementById('pill-2x');
    var pillShield = document.getElementById('pill-shield');
    var timeMagnet = document.getElementById('time-magnet');
    var timeJumpBoost = document.getElementById('time-jumpboost');
    var time2x = document.getElementById('time-2x');

    highEl.textContent = String(highScore);

    // Power-up States
    var powerups = {
        magnet: 0,    // seconds remaining
        jumpboost: 0,
        mult2x: 0,
        shield: false
    };

    // --- Three.js Setup ---
    var scene, camera, renderer;
    var playerGroup, hoverboardMesh, leftLeg, rightLeg, leftArm, rightArm;
    var tracks = [];
    var obstacles = [];
    var coinMeshes = [];
    var powerupMeshes = [];
    var sceneryProps = [];

    // Player Jump & Roll Physics
    var groundY = 0.5;
    var playerY = groundY;
    var playerVY = 0;
    var isGrounded = true;
    var isRolling = false;
    var rollTimer = 0;
    var normalJumpPower = 15.5;
    var boostJumpPower = 23.5;
    var gravity = -42;

    // Chunks configuration
    var CHUNK_LENGTH = 70;
    var VISIBLE_CHUNKS = 6;
    var nextSpawnZ = -10;

    // --- Initialize Three.js Scene ---
    function initThree() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f172a);
        scene.fog = new THREE.FogExp2(0x0f172a, 0.011);

        camera = new THREE.PerspectiveCamera(62, container.clientWidth / container.clientHeight, 0.1, 400);
        camera.position.set(0, 4.2, 5.8);
        camera.lookAt(0, 1.6, -10);

        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        var hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.65);
        scene.add(hemiLight);

        var dirLight = new THREE.DirectionalLight(0xffedd5, 1.25);
        dirLight.position.set(15, 30, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 120;
        var d = 25;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        scene.add(dirLight);

        // Build Player Character
        buildPlayer();

        // Initial track chunks
        for (var i = 0; i < VISIBLE_CHUNKS; i++) {
            spawnTrackChunk(i === 0);
        }

        window.addEventListener('resize', onWindowResize);
    }

    function onWindowResize() {
        if (!container || !camera || !renderer) return;
        var width = container.clientWidth;
        var height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    // --- Build 3D Runner Character ---
    function buildPlayer() {
        playerGroup = new THREE.Group();

        // Body / Hoodie
        var bodyGeo = new THREE.BoxGeometry(0.7, 0.85, 0.45);
        var bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }); // Electric blue jacket
        var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 0.85;
        bodyMesh.castShadow = true;
        playerGroup.add(bodyMesh);

        // Hoodie stripe
        var stripeGeo = new THREE.BoxGeometry(0.72, 0.15, 0.47);
        var stripeMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3 }); // Gold stripe
        var stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
        stripeMesh.position.y = 0.85;
        playerGroup.add(stripeMesh);

        // Head
        var headGeo = new THREE.BoxGeometry(0.48, 0.48, 0.45);
        var headMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.5 }); // Skin
        var headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.y = 1.52;
        headMesh.castShadow = true;
        playerGroup.add(headMesh);

        // Cap / Hat (Backwards Red Cap)
        var capGeo = new THREE.BoxGeometry(0.52, 0.18, 0.5);
        var capMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
        var capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.set(0, 1.72, 0);
        var brimGeo = new THREE.BoxGeometry(0.46, 0.05, 0.3);
        var brimMesh = new THREE.Mesh(brimGeo, capMat);
        brimMesh.position.set(0, 1.66, 0.32);
        playerGroup.add(capMesh);
        playerGroup.add(brimMesh);

        // Headphones
        var bandGeo = new THREE.TorusGeometry(0.28, 0.04, 8, 16, Math.PI);
        var phoneMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2 });
        var bandMesh = new THREE.Mesh(bandGeo, phoneMat);
        bandMesh.rotation.z = Math.PI;
        bandMesh.position.set(0, 1.68, 0);
        playerGroup.add(bandMesh);

        // Legs (Left & Right)
        var legGeo = new THREE.BoxGeometry(0.22, 0.55, 0.24);
        var pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }); // Dark jeans

        leftLeg = new THREE.Mesh(legGeo, pantsMat);
        leftLeg.position.set(-0.2, 0.28, 0);
        leftLeg.castShadow = true;
        playerGroup.add(leftLeg);

        rightLeg = new THREE.Mesh(legGeo, pantsMat);
        rightLeg.position.set(0.2, 0.28, 0);
        rightLeg.castShadow = true;
        playerGroup.add(rightLeg);

        // Arms (Left & Right)
        var armGeo = new THREE.BoxGeometry(0.18, 0.6, 0.2);
        var armMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });

        leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.46, 0.95, 0);
        playerGroup.add(leftArm);

        rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.46, 0.95, 0);
        playerGroup.add(rightArm);

        // Hoverboard (visible when shield is active)
        var boardGeo = new THREE.BoxGeometry(0.85, 0.1, 1.6);
        var boardMat = new THREE.MeshStandardMaterial({
            color: 0xec4899,
            emissive: 0xec4899,
            emissiveIntensity: 0.5,
            roughness: 0.2
        });
        hoverboardMesh = new THREE.Mesh(boardGeo, boardMat);
        hoverboardMesh.position.set(0, -0.05, 0);
        hoverboardMesh.visible = false;
        playerGroup.add(hoverboardMesh);

        playerGroup.position.set(0, groundY, 0);
        scene.add(playerGroup);
    }

    // --- Procedural 3D Track & Obstacle Generation ---
    function spawnTrackChunk(isFirstChunk) {
        var chunkZ = nextSpawnZ;
        nextSpawnZ -= CHUNK_LENGTH;

        var chunkGroup = new THREE.Group();
        chunkGroup.position.z = chunkZ;

        // Ground gravel ballast
        var groundGeo = new THREE.BoxGeometry(10, 0.5, CHUNK_LENGTH);
        var groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.y = -0.25;
        ground.receiveShadow = true;
        chunkGroup.add(ground);

        // Railway tracks (3 lanes)
        var railGeo = new THREE.BoxGeometry(0.08, 0.12, CHUNK_LENGTH);
        var railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });

        [-LANE_WIDTH, 0, LANE_WIDTH].forEach(function (lx) {
            var leftRail = new THREE.Mesh(railGeo, railMat);
            leftRail.position.set(lx - 0.5, 0.05, 0);
            chunkGroup.add(leftRail);

            var rightRail = new THREE.Mesh(railGeo, railMat);
            rightRail.position.set(lx + 0.5, 0.05, 0);
            chunkGroup.add(rightRail);

            // Sleepers / Wooden Ties
            var tieGeo = new THREE.BoxGeometry(1.4, 0.08, 0.3);
            var tieMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
            for (var tz = -CHUNK_LENGTH / 2; tz < CHUNK_LENGTH / 2; tz += 2.2) {
                var tie = new THREE.Mesh(tieGeo, tieMat);
                tie.position.set(lx, 0.02, tz);
                chunkGroup.add(tie);
            }
        });

        // Overhead Signal Gantries / Arches every half chunk
        var gantry = buildGantry();
        gantry.position.set(0, 0, 0);
        chunkGroup.add(gantry);

        // Surrounding City Skyline Buildings
        for (var bz = -CHUNK_LENGTH / 2; bz < CHUNK_LENGTH / 2; bz += 18) {
            var bLeft = buildBuilding();
            bLeft.position.set(-11 - Math.random() * 4, 0, bz);
            chunkGroup.add(bLeft);

            var bRight = buildBuilding();
            bRight.position.set(11 + Math.random() * 4, 0, bz);
            chunkGroup.add(bRight);
        }

        scene.add(chunkGroup);
        tracks.push({ mesh: chunkGroup, z: chunkZ });

        // Populate obstacles and coins (skip first chunk to allow peaceful start)
        if (!isFirstChunk) {
            populateChunk(chunkZ);
        }
    }

    function buildGantry() {
        var g = new THREE.Group();
        var postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });

        // Left post
        var pLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 8), postMat);
        pLeft.position.set(-5, 3, 0);
        g.add(pLeft);

        // Right post
        var pRight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 8), postMat);
        pRight.position.set(5, 3, 0);
        g.add(pRight);

        // Cross beam
        var beam = new THREE.Mesh(new THREE.BoxGeometry(10.3, 0.25, 0.25), postMat);
        beam.position.set(0, 5.8, 0);
        g.add(beam);

        // Traffic signal lights
        [-LANE_WIDTH, 0, LANE_WIDTH].forEach(function (lx) {
            var lightBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.2), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
            lightBox.position.set(lx, 5.2, 0);
            var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
            bulb.position.set(lx, 5.15, 0.12);
            g.add(lightBox);
            g.add(bulb);
        });

        return g;
    }

    function buildBuilding() {
        var height = 18 + Math.random() * 26;
        var width = 7 + Math.random() * 5;
        var depth = 12 + Math.random() * 6;
        var geo = new THREE.BoxGeometry(width, height, depth);

        var colors = [0x0f172a, 0x1e1b4b, 0x172554, 0x022c22, 0x312e81];
        var col = colors[Math.floor(Math.random() * colors.length)];
        var mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 });

        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = height / 2;
        return mesh;
    }

    // --- Spawn Obstacles & Collectibles inside a chunk ---
    function populateChunk(chunkZ) {
        var zStart = chunkZ + CHUNK_LENGTH / 2 - 8;
        var zEnd = chunkZ - CHUNK_LENGTH / 2 + 8;

        for (var z = zStart; z > zEnd; z -= (16 + Math.random() * 12)) {
            var laneChoice = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
            var obsType = Math.random();

            if (obsType < 0.35) {
                // Subway Train Carriage
                spawnTrain(laneChoice, z);
            } else if (obsType < 0.68) {
                // Low Barrier to Jump Over
                spawnLowBarrier(laneChoice, z);
            } else {
                // High Barrier to Roll / Slide Under
                spawnHighBarrier(laneChoice, z);
            }

            // In other lanes, place coin lines or power-up
            var freeLanes = [-1, 0, 1].filter(function (l) { return l !== laneChoice; });
            var coinLane = freeLanes[Math.floor(Math.random() * freeLanes.length)];

            if (Math.random() < 0.12) {
                spawnPowerup(coinLane, z);
            } else {
                spawnCoinRow(coinLane, z, 4);
            }
        }
    }

    // --- Train Obstacle ---
    function spawnTrain(lane, z) {
        var lx = lane * LANE_WIDTH;
        var length = 16;
        var trainGroup = new THREE.Group();

        // Train Body
        var trainColors = [0xef4444, 0x0284c7, 0x10b981, 0xf59e0b];
        var tColor = trainColors[Math.floor(Math.random() * trainColors.length)];

        var bodyGeo = new THREE.BoxGeometry(2.0, 3.2, length);
        var bodyMat = new THREE.MeshStandardMaterial({ color: tColor, roughness: 0.3, metalness: 0.2 });
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 1.6, 0);
        body.castShadow = true;
        trainGroup.add(body);

        // Roof
        var roofGeo = new THREE.BoxGeometry(2.1, 0.2, length);
        var roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, 3.3, 0);
        trainGroup.add(roof);

        // Windshield
        var winGeo = new THREE.BoxGeometry(1.6, 1.1, 0.15);
        var winMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        var winFront = new THREE.Mesh(winGeo, winMat);
        winFront.position.set(0, 2.1, length / 2 + 0.05);
        trainGroup.add(winFront);

        // Headlights
        [-0.6, 0.6].forEach(function (hx) {
            var hl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
            hl.position.set(hx, 0.9, length / 2 + 0.08);
            trainGroup.add(hl);
        });

        trainGroup.position.set(lx, 0, z);
        scene.add(trainGroup);

        obstacles.push({
            type: 'train',
            mesh: trainGroup,
            lane: lane,
            x: lx,
            z: z,
            w: 1.9,
            h: 3.2,
            d: length,
            canJumpOver: false,
            canRollUnder: false
        });

        // Put coins on train roof occasionally
        if (Math.random() < 0.6) {
            for (var rz = -length / 2 + 2; rz <= length / 2 - 2; rz += 3.5) {
                spawnCoin(lane, z + rz, 3.8);
            }
        }
    }

    // --- Low Barrier (Jump Over) ---
    function spawnLowBarrier(lane, z) {
        var lx = lane * LANE_WIDTH;
        var barGroup = new THREE.Group();

        var hurdleGeo = new THREE.BoxGeometry(1.9, 0.9, 0.25);
        var hurdleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
        var hurdle = new THREE.Mesh(hurdleGeo, hurdleMat);
        hurdle.position.set(0, 0.45, 0);
        hurdle.castShadow = true;
        barGroup.add(hurdle);

        // Hazard stripes
        var stripeGeo = new THREE.BoxGeometry(1.92, 0.2, 0.26);
        var stripeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        var stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(0, 0.45, 0);
        barGroup.add(stripe);

        barGroup.position.set(lx, 0, z);
        scene.add(barGroup);

        obstacles.push({
            type: 'low_barrier',
            mesh: barGroup,
            lane: lane,
            x: lx,
            z: z,
            w: 1.8,
            h: 0.95,
            d: 0.5,
            canJumpOver: true,
            canRollUnder: false
        });
    }

    // --- High Barrier (Roll / Slide Under) ---
    function spawnHighBarrier(lane, z) {
        var lx = lane * LANE_WIDTH;
        var barGroup = new THREE.Group();

        var poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        var leftP = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), poleMat);
        leftP.position.set(-0.9, 1.6, 0);
        barGroup.add(leftP);

        var rightP = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), poleMat);
        rightP.position.set(0.9, 1.6, 0);
        barGroup.add(rightP);

        // Top bar block
        var signGeo = new THREE.BoxGeometry(2.0, 1.4, 0.25);
        var signMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
        var sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 2.4, 0);
        sign.castShadow = true;
        barGroup.add(sign);

        barGroup.position.set(lx, 0, z);
        scene.add(barGroup);

        obstacles.push({
            type: 'high_barrier',
            mesh: barGroup,
            lane: lane,
            x: lx,
            z: z,
            w: 1.8,
            h: 1.4,
            bottomY: 1.7, // Anything above 1.7 hits unless rolling
            d: 0.5,
            canJumpOver: false,
            canRollUnder: true
        });
    }

    // --- Coins ---
    function spawnCoin(lane, z, y) {
        var lx = lane * LANE_WIDTH;
        var coinGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12);
        var coinMat = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0xfbbf24,
            emissiveIntensity: 0.25
        });
        var coin = new THREE.Mesh(coinGeo, coinMat);
        coin.rotation.x = Math.PI / 2;
        coin.position.set(lx, y || 0.9, z);
        scene.add(coin);

        coinMeshes.push({
            mesh: coin,
            lane: lane,
            x: lx,
            y: y || 0.9,
            z: z,
            collected: false
        });
    }

    function spawnCoinRow(lane, centerZ, count) {
        var spacing = 2.4;
        for (var i = 0; i < count; i++) {
            spawnCoin(lane, centerZ - (i * spacing), 0.9);
        }
    }

    // --- Power-ups (Magnet, Sneakers, 2X, Shield) ---
    function spawnPowerup(lane, z) {
        var lx = lane * LANE_WIDTH;
        var types = ['magnet', 'jumpboost', 'mult2x', 'shield'];
        var pType = types[Math.floor(Math.random() * types.length)];

        var colors = {
            magnet: 0xef4444,
            jumpboost: 0x10b981,
            mult2x: 0x38bdf8,
            shield: 0xec4899
        };

        var pGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
        var pMat = new THREE.MeshStandardMaterial({
            color: colors[pType],
            emissive: colors[pType],
            emissiveIntensity: 0.5,
            roughness: 0.2
        });
        var mesh = new THREE.Mesh(pGeo, pMat);
        mesh.position.set(lx, 1.2, z);
        scene.add(mesh);

        powerupMeshes.push({
            type: pType,
            mesh: mesh,
            x: lx,
            z: z,
            collected: false
        });
    }

    // --- Player Movement Controls ---
    function switchLane(dir) {
        if (!isPlaying || isGameOver) return;
        var newLane = currentLane + dir;
        if (newLane >= -1 && newLane <= 1) {
            currentLane = newLane;
            targetX = currentLane * LANE_WIDTH;
            playSound('lane');
        }
    }

    function jump() {
        if (!isPlaying && !isGameOver) {
            startGame();
            return;
        }
        if (isGameOver) return;

        if (isGrounded) {
            var jumpPower = (powerups.jumpboost > 0) ? boostJumpPower : normalJumpPower;
            playerVY = jumpPower;
            isGrounded = false;
            isRolling = false;
            playSound('jump');
        }
    }

    function roll() {
        if (!isPlaying && !isGameOver) {
            startGame();
            return;
        }
        if (isGameOver) return;

        if (!isRolling) {
            isRolling = true;
            rollTimer = 0.65; // Roll duration in seconds
            playSound('roll');

            // Quick fall if in air
            if (!isGrounded) {
                playerVY = -24;
            }
        }
    }

    // --- Main Game Loop ---
    var lastFrameTime = performance.now();

    function gameLoop(now) {
        if (!isPlaying || isGameOver) return;

        var dt = Math.min((now - lastFrameTime) / 1000, 0.1);
        lastFrameTime = now;

        // Accelerate forward speed smoothly
        currentSpeed = Math.min(maxSpeed, baseSpeed + (distance * 0.015));

        // Move Player Forward
        var deltaZ = currentSpeed * dt;
        playerGroup.position.z -= deltaZ;
        distance += deltaZ * 0.8;

        scoreEl.textContent = Math.floor(distance);

        // Smooth Lane Switching (Lerp)
        playerGroup.position.x = THREE.MathUtils.lerp(playerGroup.position.x, targetX, 14 * dt);

        // Jumping & Gravity Physics
        if (!isGrounded) {
            playerVY += gravity * dt;
            playerY += playerVY * dt;

            if (playerY <= groundY) {
                playerY = groundY;
                playerVY = 0;
                isGrounded = true;
            }
        }
        playerGroup.position.y = playerY;

        // Roll / Ducking Timer
        if (isRolling) {
            rollTimer -= dt;
            if (rollTimer <= 0) {
                isRolling = false;
            }
            playerGroup.scale.set(1, 0.5, 1);
        } else {
            playerGroup.scale.set(1, 1, 1);
        }

        // Running Leg & Arm Swing Animation
        if (isGrounded && !isRolling) {
            var runPhase = performance.now() * 0.014 * (currentSpeed / 28);
            leftLeg.rotation.x = Math.sin(runPhase) * 0.65;
            rightLeg.rotation.x = -Math.sin(runPhase) * 0.65;
            leftArm.rotation.x = -Math.sin(runPhase) * 0.65;
            rightArm.rotation.x = Math.sin(runPhase) * 0.65;
        } else if (!isGrounded) {
            leftLeg.rotation.x = -0.3;
            rightLeg.rotation.x = -0.3;
            leftArm.rotation.x = 0.5;
            rightArm.rotation.x = 0.5;
        }

        // Camera Follows Player
        camera.position.z = playerGroup.position.z + 6.2;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerGroup.position.x * 0.45, 10 * dt);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, playerY + 3.8, 8 * dt);
        camera.lookAt(playerGroup.position.x * 0.3, playerY + 1.2, playerGroup.position.z - 12);

        // Update Power-ups
        updatePowerups(dt);

        // Spin Coins & Magnet Pull
        coinMeshes.forEach(function (c) {
            if (c.collected) return;
            c.mesh.rotation.z += 3.5 * dt;

            // Magnet pulling coins
            if (powerups.magnet > 0) {
                var pz = playerGroup.position.z;
                var px = playerGroup.position.x;
                var distToPlayer = Math.hypot(c.mesh.position.x - px, c.mesh.position.z - pz);

                if (distToPlayer < 14) {
                    c.mesh.position.x = THREE.MathUtils.lerp(c.mesh.position.x, px, 16 * dt);
                    c.mesh.position.z = THREE.MathUtils.lerp(c.mesh.position.z, pz, 16 * dt);
                    c.mesh.position.y = THREE.MathUtils.lerp(c.mesh.position.y, playerY + 0.8, 16 * dt);
                }
            }

            // Coin collection hit test
            var dz = Math.abs(c.mesh.position.z - playerGroup.position.z);
            var dx = Math.abs(c.mesh.position.x - playerGroup.position.x);
            var dy = Math.abs(c.mesh.position.y - playerY);

            if (dz < 1.3 && dx < 0.9 && dy < 1.4) {
                c.collected = true;
                scene.remove(c.mesh);
                var coinGain = 1 * multiplier;
                coins += coinGain;
                coinsEl.textContent = '🪙 ' + coins;
                playSound('coin');
            }
        });

        // Spin & Collect Powerup Cubes
        powerupMeshes.forEach(function (p) {
            if (p.collected) return;
            p.mesh.rotation.x += 2 * dt;
            p.mesh.rotation.y += 2.5 * dt;

            var dz = Math.abs(p.mesh.position.z - playerGroup.position.z);
            var dx = Math.abs(p.mesh.position.x - playerGroup.position.x);

            if (dz < 1.4 && dx < 1.0) {
                p.collected = true;
                scene.remove(p.mesh);
                activatePowerup(p.type);
                playSound('powerup');
            }
        });

        // Collision Detection with Obstacles
        for (var i = 0; i < obstacles.length; i++) {
            var obs = obstacles[i];
            if (checkCollision(obs)) {
                if (powerups.shield) {
                    // Shield absorbs crash!
                    powerups.shield = false;
                    hoverboardMesh.visible = false;
                    pillShield.classList.remove('active');
                    playSound('powerup');
                    // Remove obstacle so we can pass
                    scene.remove(obs.mesh);
                    obstacles.splice(i, 1);
                    break;
                } else {
                    handleGameOver();
                    return;
                }
            }
        }

        // Procedural Chunk Spawning / Recycling
        if (playerGroup.position.z < nextSpawnZ + CHUNK_LENGTH * 3) {
            spawnTrackChunk(false);
        }

        // Clean up distant behind tracks & objects
        cleanupBehind(playerGroup.position.z);

        // Render Scene
        renderer.render(scene, camera);

        requestAnimationFrame(gameLoop);
    }

    // --- Power-up Timers & UI ---
    function activatePowerup(type) {
        if (type === 'magnet') {
            powerups.magnet = 10;
            pillMagnet.classList.add('active');
        } else if (type === 'jumpboost') {
            powerups.jumpboost = 10;
            pillJumpBoost.classList.add('active');
        } else if (type === 'mult2x') {
            powerups.mult2x = 10;
            multiplier = 2;
            multEl.textContent = '2x';
            pill2x.classList.add('active');
        } else if (type === 'shield') {
            powerups.shield = true;
            hoverboardMesh.visible = true;
            pillShield.classList.add('active');
        }
    }

    function updatePowerups(dt) {
        if (powerups.magnet > 0) {
            powerups.magnet -= dt;
            timeMagnet.textContent = Math.ceil(powerups.magnet) + 's';
            if (powerups.magnet <= 0) pillMagnet.classList.remove('active');
        }
        if (powerups.jumpboost > 0) {
            powerups.jumpboost -= dt;
            timeJumpBoost.textContent = Math.ceil(powerups.jumpboost) + 's';
            if (powerups.jumpboost <= 0) pillJumpBoost.classList.remove('active');
        }
        if (powerups.mult2x > 0) {
            powerups.mult2x -= dt;
            time2x.textContent = Math.ceil(powerups.mult2x) + 's';
            if (powerups.mult2x <= 0) {
                multiplier = 1;
                multEl.textContent = '1x';
                pill2x.classList.remove('active');
            }
        }
    }

    // --- Collision Detection ---
    function checkCollision(obs) {
        var pz = playerGroup.position.z;
        var px = playerGroup.position.x;
        var py = playerY;

        var inZ = (pz < obs.z + obs.d / 2) && (pz > obs.z - obs.d / 2);
        var inX = Math.abs(px - obs.x) < (obs.w / 2 + 0.35);

        if (!inZ || !inX) return false;

        if (obs.type === 'train') {
            // Train hits unless player is safely running on its roof (py > 3.0)
            return (py < 2.9);
        } else if (obs.type === 'low_barrier') {
            // Low barrier: hits unless jumping above 1.1 units
            return (py < 1.1);
        } else if (obs.type === 'high_barrier') {
            // High barrier: hits unless rolling flat (isRolling === true)
            return !isRolling;
        }

        return false;
    }

    // --- Clean Objects Behind Player ---
    function cleanupBehind(pz) {
        var cullZ = pz + 20;

        // Remove old track chunks
        for (var t = tracks.length - 1; t >= 0; t--) {
            if (tracks[t].z > cullZ + CHUNK_LENGTH) {
                scene.remove(tracks[t].mesh);
                tracks.splice(t, 1);
            }
        }

        // Remove old obstacles
        for (var o = obstacles.length - 1; o >= 0; o--) {
            if (obstacles[o].z > cullZ) {
                scene.remove(obstacles[o].mesh);
                obstacles.splice(o, 1);
            }
        }

        // Remove old coins
        coinMeshes = coinMeshes.filter(function (c) {
            if (c.z > cullZ || c.collected) {
                scene.remove(c.mesh);
                return false;
            }
            return true;
        });

        // Remove old powerups
        powerupMeshes = powerupMeshes.filter(function (p) {
            if (p.z > cullZ || p.collected) {
                scene.remove(p.mesh);
                return false;
            }
            return true;
        });
    }

    // --- Game Over ---
    function handleGameOver() {
        isGameOver = true;
        isPlaying = false;
        playSound('crash');

        var finalScore = Math.floor(distance);
        if (finalScore > highScore) {
            highScore = finalScore;
            localStorage.setItem('pmg_subwayrunner_high', highScore);
            highEl.textContent = String(highScore);
        }

        winScoreEl.textContent = String(finalScore);
        winCoinsEl.textContent = '🪙 ' + coins;
        winHighEl.textContent = String(highScore);

        setTimeout(function () {
            winModal.classList.add('active');
        }, 400);
    }

    // --- Start / Reset Game ---
    function startGame() {
        startOverlay.style.display = 'none';
        winModal.classList.remove('active');

        // Reset variables
        distance = 0;
        coins = 0;
        multiplier = 1;
        currentLane = 0;
        targetX = 0;
        currentSpeed = baseSpeed;
        playerY = groundY;
        playerVY = 0;
        isGrounded = true;
        isRolling = false;

        scoreEl.textContent = '0';
        coinsEl.textContent = '🪙 0';
        multEl.textContent = '1x';

        // Clear powerups
        powerups.magnet = 0;
        powerups.jumpboost = 0;
        powerups.mult2x = 0;
        powerups.shield = false;
        hoverboardMesh.visible = false;
        pillMagnet.classList.remove('active');
        pillJumpBoost.classList.remove('active');
        pill2x.classList.remove('active');
        pillShield.classList.remove('active');

        // Clear existing scene meshes
        tracks.forEach(function (t) { scene.remove(t.mesh); });
        obstacles.forEach(function (o) { scene.remove(o.mesh); });
        coinMeshes.forEach(function (c) { scene.remove(c.mesh); });
        powerupMeshes.forEach(function (p) { scene.remove(p.mesh); });

        tracks = [];
        obstacles = [];
        coinMeshes = [];
        powerupMeshes = [];
        nextSpawnZ = -10;

        // Reset Player position
        playerGroup.position.set(0, groundY, 0);

        // Spawn initial chunks
        for (var i = 0; i < VISIBLE_CHUNKS; i++) {
            spawnTrackChunk(i === 0);
        }

        isGameOver = false;
        isPlaying = true;
        lastFrameTime = performance.now();
        getAudioCtx();

        requestAnimationFrame(gameLoop);
    }

    // --- Keyboard Event Listeners ---
    window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            switchLane(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            switchLane(1);
        } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            jump();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            roll();
        }
    });

    // --- Mobile Touch Buttons ---
    function bindBtn(btnId, action) {
        var btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            btn.classList.add('active');
            action();
        });
        btn.addEventListener('pointerup', function () { btn.classList.remove('active'); });
        btn.addEventListener('pointerleave', function () { btn.classList.remove('active'); });
    }

    bindBtn('btn-left', function () { switchLane(-1); });
    bindBtn('btn-right', function () { switchLane(1); });
    bindBtn('btn-jump', function () { jump(); });
    bindBtn('btn-roll', function () { roll(); });

    // --- Touch Screen Swipes (Left/Right/Up/Down) ---
    var touchStartX = 0;
    var touchStartY = 0;
    var touchStartTime = 0;

    canvas.addEventListener('touchstart', function (e) {
        if (!isPlaying && !isGameOver) {
            startGame();
            return;
        }
        if (e.touches.length > 0) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = performance.now();
        }
    }, { passive: true });

    canvas.addEventListener('touchend', function (e) {
        if (!isPlaying || isGameOver) return;
        if (e.changedTouches.length > 0) {
            var diffX = e.changedTouches[0].clientX - touchStartX;
            var diffY = e.changedTouches[0].clientY - touchStartY;
            var elapsed = performance.now() - touchStartTime;

            if (elapsed < 500) {
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX > 30) switchLane(1);      // Swipe Right
                    else if (diffX < -30) switchLane(-1); // Swipe Left
                } else {
                    if (diffY < -30) jump();            // Swipe Up
                    else if (diffY > 30) roll();        // Swipe Down
                }
            }
        }
    }, { passive: true });

    startOverlay.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', startGame);

    // Initialize 3D Engine
    initThree();
    renderer.render(scene, camera);
})();
