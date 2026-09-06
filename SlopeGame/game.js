/**
 * Slope Game 3D – PlayMixGames
 * Infinite 3D Cyberpunk Slope Runner Engine with Jump / Obstacle Bounce, Three.js & Web Audio
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

    function playSound(type) {
        try {
            var ctx = getAudioCtx();
            if (!ctx) return;
            var now = ctx.currentTime;

            if (type === 'jump') {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(240, now);
                osc.frequency.exponentialRampToValueAtTime(750, now + 0.22);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
            } else if (type === 'crash') {
                var oscC = ctx.createOscillator();
                var gainC = ctx.createGain();
                oscC.type = 'sawtooth';
                oscC.frequency.setValueAtTime(140, now);
                oscC.frequency.exponentialRampToValueAtTime(30, now + 0.35);
                gainC.gain.setValueAtTime(0.4, now);
                gainC.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                oscC.connect(gainC);
                gainC.connect(ctx.destination);
                oscC.start(now);
                oscC.stop(now + 0.35);
            }
        } catch (e) {}
    }

    // --- State Variables ---
    var isPlaying = false;
    var isGameOver = false;
    var score = 0;
    var highScore = parseInt(localStorage.getItem('pmg_slope_high') || '0', 10);
    var speed = 45; // Initial speed
    var maxSpeed = 110;

    // --- Three.js Scene Components ---
    var scene, camera, renderer;
    var ball;
    var platforms = [];
    var obstacles = [];
    var nextPlatformZ = 0;
    var ballRadius = 0.8;
    var ballPos = { x: 0, y: 1.5, z: 0 };
    var ballVel = { x: 0, y: 0, z: 0 };
    var isGrounded = true;
    var keys = { left: false, right: false };

    // --- DOM Elements ---
    var container = document.getElementById('canvas-container');
    var scoreEl = document.getElementById('score-val');
    var highEl = document.getElementById('high-val');
    var speedEl = document.getElementById('speed-val');
    var startOverlay = document.getElementById('start-overlay');
    var winModal = document.getElementById('win-modal');
    var winScoreEl = document.getElementById('win-score');
    var winHighEl = document.getElementById('win-high');
    var playAgainBtn = document.getElementById('play-again-btn');
    var btnLeft = document.getElementById('btn-left');
    var btnRight = document.getElementById('btn-right');
    var btnJump = document.getElementById('btn-jump');

    highEl.textContent = highScore;

    // --- Materials & Colors ---
    var ballMaterial, platformMaterial, wireframeMaterial, obstacleMaterial;

    function initThree() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050811);
        scene.fog = new THREE.FogExp2(0x050811, 0.012);

        var aspect = container.clientWidth / container.clientHeight;
        camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        var dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
        dirLight.position.set(20, 40, 20);
        scene.add(dirLight);

        var greenLight = new THREE.PointLight(0x22c55e, 2, 50);
        greenLight.position.set(0, 5, 0);
        scene.add(greenLight);

        // Materials
        ballMaterial = new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            emissive: 0x15803d,
            roughness: 0.2,
            metalness: 0.8
        });

        platformMaterial = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.6,
            metalness: 0.4
        });

        wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0x06b6d4,
            linewidth: 1
        });

        obstacleMaterial = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0x991b1b,
            roughness: 0.3,
            metalness: 0.6
        });

        // Ball Mesh
        var ballGeom = new THREE.SphereGeometry(ballRadius, 32, 32);
        ball = new THREE.Mesh(ballGeom, ballMaterial);
        scene.add(ball);

        // Background Starfield Particles
        var starGeom = new THREE.BufferGeometry();
        var starCount = 300;
        var starPos = new Float32Array(starCount * 3);
        for (var i = 0; i < starCount * 3; i += 3) {
            starPos[i] = (Math.random() - 0.5) * 200;
            starPos[i+1] = Math.random() * 80 - 20;
            starPos[i+2] = (Math.random() - 0.5) * 400;
        }
        starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        var starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.8 });
        var stars = new THREE.Points(starGeom, starMat);
        scene.add(stars);

        resetGame();
        animate();
    }

    // --- Procedural Platform & Obstacle Generation ---
    function createPlatform(z, length, width, angleY, hasObstacle) {
        var geom = new THREE.BoxGeometry(width, 1, length);
        var mesh = new THREE.Mesh(geom, platformMaterial);

        // Wireframe edges for neon retro look
        var edges = new THREE.EdgesGeometry(geom);
        var wireframe = new THREE.LineSegments(edges, wireframeMaterial);
        mesh.add(wireframe);

        mesh.position.set(0, 0, z - length / 2);
        if (angleY) mesh.rotation.y = angleY;

        scene.add(mesh);

        var platformObj = {
            mesh: mesh,
            zStart: z,
            zEnd: z - length,
            width: width,
            length: length,
            topY: 0.5
        };
        platforms.push(platformObj);

        // Add Obstacles (Height 1.4 - 2.0 so ball can vault over with a good jump)
        if (hasObstacle) {
            var obsCount = Math.random() < 0.5 ? 1 : 2;
            for (var o = 0; o < obsCount; o++) {
                var obsWidth = Math.random() * 1.5 + 1.2;
                var obsHeight = 1.5;
                var obsGeom = new THREE.BoxGeometry(obsWidth, obsHeight, 1.2);
                var obsMesh = new THREE.Mesh(obsGeom, obstacleMaterial);

                var obsX = (Math.random() - 0.5) * (width - obsWidth - 1);
                var obsZ = z - Math.random() * (length - 8) - 4;

                obsMesh.position.set(obsX, 0.5 + obsHeight / 2, obsZ);
                scene.add(obsMesh);

                obstacles.push({
                    mesh: obsMesh,
                    x: obsX,
                    y: 0.5 + obsHeight / 2,
                    z: obsZ,
                    w: obsWidth,
                    h: obsHeight
                });
            }
        }
    }

    function generateInitialTrack() {
        platforms.forEach(function (p) { scene.remove(p.mesh); });
        obstacles.forEach(function (o) { scene.remove(o.mesh); });
        platforms = [];
        obstacles = [];

        nextPlatformZ = 10;

        // Safe starting runway
        createPlatform(nextPlatformZ, 40, 10, 0, false);
        nextPlatformZ -= 40;

        // Generate ahead
        for (var i = 0; i < 15; i++) {
            spawnNextPlatformSection();
        }
    }

    function spawnNextPlatformSection() {
        var length = Math.floor(Math.random() * 20) + 25;
        var width = Math.max(6, 10 - score * 0.003); // Narrower as score grows
        var gap = Math.random() < 0.35 ? (Math.floor(Math.random() * 6) + 4) : 0; // occasional jump gap

        nextPlatformZ -= gap;
        var hasObstacle = (score > 15 && Math.random() < 0.65);
        createPlatform(nextPlatformZ, length, width, 0, hasObstacle);
        nextPlatformZ -= length;
    }

    // --- Jump / Bounce Feature ---
    function triggerJump() {
        if (!isPlaying || isGameOver) return;
        if (isGrounded || (ballPos.y <= 1.8 && ballPos.y >= 0.8)) {
            ballVel.y = 15.5; // Upward jump impulse
            isGrounded = false;
            playSound('jump');
        }
    }

    // --- Physics & Game Loop ---
    var lastTime = 0;
    function animate(time) {
        requestAnimationFrame(animate);

        if (!lastTime) lastTime = time;
        var dt = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;

        if (isPlaying && !isGameOver) {
            updatePhysics(dt);
        }

        // Camera Follow
        if (ball) {
            camera.position.x = ball.position.x * 0.6;
            camera.position.y = ball.position.y + 4.5;
            camera.position.z = ball.position.z + 9;
            camera.lookAt(ball.position.x * 0.4, ball.position.y + 0.5, ball.position.z - 15);
        }

        renderer.render(scene, camera);
    }

    function updatePhysics(dt) {
        // Accelerate forward speed
        speed = Math.min(maxSpeed, 45 + score * 0.08);
        speedEl.textContent = Math.round(speed);

        var forwardMove = speed * dt;
        ballPos.z -= forwardMove;
        score = Math.floor(-ballPos.z);
        scoreEl.textContent = score;

        // Left / Right Steering
        var steerSpeed = 16;
        if (keys.left) ballPos.x -= steerSpeed * dt;
        if (keys.right) ballPos.x += steerSpeed * dt;

        // Gravity
        ballVel.y -= 38 * dt; // Gravity acceleration
        ballPos.y += ballVel.y * dt;

        // Ground collision check
        var currentPlatform = null;
        for (var i = 0; i < platforms.length; i++) {
            var p = platforms[i];
            if (ballPos.z <= p.zStart && ballPos.z >= p.zEnd) {
                currentPlatform = p;
                break;
            }
        }

        if (currentPlatform) {
            var halfW = currentPlatform.width / 2;
            if (Math.abs(ballPos.x) <= halfW + 0.2) {
                // Ball is within platform width
                if (ballPos.y <= currentPlatform.topY + ballRadius && ballVel.y <= 0) {
                    ballPos.y = currentPlatform.topY + ballRadius;
                    ballVel.y = 0;
                    isGrounded = true;
                }
            } else {
                // Ball fell off the side!
                isGrounded = false;
            }
        } else {
            // Ball in air over a gap!
            isGrounded = false;
        }

        // Update Ball Mesh Position & Rotation
        ball.position.set(ballPos.x, ballPos.y, ballPos.z);
        ball.rotation.x -= (forwardMove / ballRadius);

        // Obstacle Collisions (Allows jumping over if ball is above obstacle height)
        for (var j = 0; j < obstacles.length; j++) {
            var obs = obstacles[j];
            if (Math.abs(ballPos.z - obs.z) < (ballRadius + 0.6)) {
                // Check X overlap
                if (Math.abs(ballPos.x - obs.x) < (obs.w / 2 + ballRadius * 0.75)) {
                    // Check Y overlap (if ball is below the top of the obstacle cube, it crashes!)
                    var obsTopY = obs.y + obs.h / 2;
                    if (ballPos.y - ballRadius < obsTopY - 0.1) {
                        // Hit Obstacle!
                        handleGameOver('crash');
                        return;
                    }
                }
            }
        }

        // Fall off bottom check
        if (ballPos.y < -15) {
            handleGameOver('fall');
            return;
        }

        // Clean up old platforms & spawn new ones
        if (platforms.length > 0 && platforms[0].zEnd > ballPos.z + 30) {
            var oldP = platforms.shift();
            scene.remove(oldP.mesh);
            spawnNextPlatformSection();
        }

        // Clean up old obstacles
        obstacles = obstacles.filter(function (o) {
            if (o.z > ballPos.z + 30) {
                scene.remove(o.mesh);
                return false;
            }
            return true;
        });
    }

    function handleGameOver(cause) {
        isGameOver = true;
        isPlaying = false;
        playSound('crash');

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('pmg_slope_high', highScore);
            highEl.textContent = highScore;
        }

        winScoreEl.textContent = score;
        winHighEl.textContent = highScore;

        setTimeout(function () {
            winModal.classList.add('active');
        }, 500);
    }

    function startGame() {
        startOverlay.style.display = 'none';
        winModal.classList.remove('active');

        ballPos = { x: 0, y: 1.5, z: 0 };
        ballVel = { x: 0, y: 0, z: 0 };
        score = 0;
        speed = 45;
        scoreEl.textContent = '0';
        speedEl.textContent = '45';

        generateInitialTrack();

        isGameOver = false;
        isPlaying = true;
        getAudioCtx();
    }

    function resetGame() {
        isPlaying = false;
        isGameOver = false;

        ballPos = { x: 0, y: 1.5, z: 0 };
        ballVel = { x: 0, y: 0, z: 0 };
        if (ball) ball.position.set(0, 1.5, 0);

        generateInitialTrack();

        startOverlay.style.display = 'flex';
        winModal.classList.remove('active');
    }

    // --- Controls Listeners ---
    window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
            e.preventDefault();
            triggerJump();
        }
    });

    window.addEventListener('keyup', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    });

    // Touch Buttons
    btnLeft.addEventListener('pointerdown', function (e) { e.preventDefault(); keys.left = true; btnLeft.classList.add('active'); });
    btnLeft.addEventListener('pointerup', function () { keys.left = false; btnLeft.classList.remove('active'); });
    btnLeft.addEventListener('pointerleave', function () { keys.left = false; btnLeft.classList.remove('active'); });

    btnRight.addEventListener('pointerdown', function (e) { e.preventDefault(); keys.right = true; btnRight.classList.add('active'); });
    btnRight.addEventListener('pointerup', function () { keys.right = false; btnRight.classList.remove('active'); });
    btnRight.addEventListener('pointerleave', function () { keys.right = false; btnRight.classList.remove('active'); });

    btnJump.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        btnJump.classList.add('active');
        triggerJump();
    });
    btnJump.addEventListener('pointerup', function () { btnJump.classList.remove('active'); });
    btnJump.addEventListener('pointerleave', function () { btnJump.classList.remove('active'); });

    // Touch Swipe / Drag on Canvas
    var touchStartX = 0;
    var touchStartY = 0;
    container.addEventListener('touchstart', function (e) {
        if (!isPlaying && !isGameOver) {
            startGame();
            return;
        }
        if (e.touches.length > 0) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });

    container.addEventListener('touchmove', function (e) {
        if (e.touches.length > 0) {
            var diffX = e.touches[0].clientX - touchStartX;
            var diffY = e.touches[0].clientY - touchStartY;

            if (diffX < -15) { keys.left = true; keys.right = false; }
            else if (diffX > 15) { keys.right = true; keys.left = false; }
            else { keys.left = false; keys.right = false; }

            // Swipe Up to Jump
            if (diffY < -25) {
                triggerJump();
            }
        }
    }, { passive: true });

    container.addEventListener('touchend', function () {
        keys.left = false;
        keys.right = false;
    });

    startOverlay.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', startGame);

    // Responsive Resize
    window.addEventListener('resize', function () {
        if (camera && renderer && container) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });

    // Initialize Three.js on Load
    window.addEventListener('load', initThree);
})();
