/**
 * Pocket Golf 3D - TV Broadcast Edition
 * Features: Compact TV HUD, Distinct Ball Colors, Reverted Vertical Camera
 */

class GolfGame3D {
    constructor() {
        console.log("Initializing TV Style Golf Championship...");
        try {

            // ==============================
        // SESSION / ANALYTICS
        // ==============================

        this.gameStartTime = Date.now();
        this.gameRecordTime = Date.now();
        this.durationSent = false;
        this.gameStartedFlag = true;

        // Supabase config
        this.supabaseUrl = "https://bjpgovfzonlmjrruaspp.supabase.co";
        this.supabaseKey = "sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM";
        this.supabaseClient = null;

        // Session ID
        this.sessionId = null;

        this.initSupabase();

        // exit listeners
        window.addEventListener("beforeunload", () => {
            this.sendDurationOnExit("tab_close_pocketgolf");
        });

     

            this.initPhysics();
            this.initScene();
            this.initLights();
            this.initSounds();
            
            this.state = 'PLAYER_TURN';
            this.currentSet = 1;
            this.currentHole = 1;
            this.aiIsThinking = false;
            
            this.ball = {
                player: { mesh: null, body: null, strokes: 0, score: 0, setsWon: 0, inHole: false, color: 0x00f2fe, labelId: 'label-player', frameData: Array(15).fill('-') },
                ai: { mesh: null, body: null, strokes: 0, score: 0, setsWon: 0, inHole: false, color: 0xfcc419, labelId: 'label-ai', frameData: Array(15).fill('-') }
            };
            
            this.hole = { x: 0, z: 0, radius: 0.8 };
            this.walls = [];
            
            this.levelPool = [
                { obstacles: [] }, // Level 1: Open Green
                { obstacles: [{x:0,z:0,w:18,d:1.5}] }, // Level 2: Center Bridge
                { obstacles: [{x:-10,z:5,w:12,d:1},{x:10,z:-5,w:12,d:1}] }, // Level 3: Dual Gates
                { obstacles: [{x:0,z:0,w:2,d:16}] }, // Level 4: Vertical Divider
                { obstacles: [{x:-8,z:3,w:8,d:1},{x:8,z:-3,w:8,d:1},{x:0,z:8,w:1,d:6}] }, // Level 5: The Z-Trap
                { obstacles: [{x:-12,z:0,w:2,d:10},{x:12,z:0,w:2,d:10},{x:0,z:10,w:12,d:2}] }, // Level 6: Side Pillars
                { obstacles: [{x:0,z:0,w:10,d:10}] }, // Level 7: Central Bunker
                { obstacles: [{x:0,z:0,w:3,d:3},{x:-10,z:10,w:3,d:3},{x:10,z:-10,w:3,d:3},{x:-10,z:-10,w:3,d:3},{x:10,z:10,w:3,d:3}] }, // Level 8: Five Dots
                { obstacles: [{x:0,z:-8,w:22,d:1.2},{x:0,z:-4,w:22,d:1.2}] }, // Level 9: Double Barricade
                { obstacles: [{x:-8,z:0,w:1,d:20},{x:8,z:0,w:1,d:20},{x:0,z:6,w:16,d:1.5}] }, // Level 10: The Big H
                { obstacles: [{x:-10,z:-8,w:6,d:6},{x:10,z:-8,w:6,d:6},{x:0,z:0,w:8,d:2}] }, // Level 11: The Triangle
                { obstacles: [{x:0,z:0,w:26,d:1},{x:-13,z:0,w:1,d:8},{x:13,z:0,w:1,d:8}] }, // Level 12: U-Bracket
                { obstacles: [{x:-10,z:-10,w:12,d:1.5},{x:10,z:10,w:12,d:1.5},{x:0,z:0,w:1.5,d:12}] }, // Level 13: Staggered Corners
                { obstacles: [{x:0,z:-9,w:6,d:6},{x:0,z:9,w:6,d:6}] }, // Level 14: Entry & Exit Pins
                { obstacles: [{x:-6,z:0,w:1,d:18},{x:6,z:0,w:1,d:18},{x:0,z:0,w:12,d:1}] } // Level 15: The Cross
            ];

            this.initBalls();
            this.setupControls();
            this.loadLevel();
            
            const tut = document.getElementById('tutorial-overlay');
            if (tut) {
                tut.classList.remove('hidden');
                this.tutTimeout = setTimeout(() => tut.classList.add('hidden'), 5000);
            }

            this.animate();
        } catch (err) {
            console.error("Game Init Failed:", err);
            document.body.innerHTML += `<div style="position:fixed;inset:0;background:red;color:white;z-index:99999;padding:20px;">Error starting game. Please refresh.</div>`;
        }
    }


// =====================================
    // SUPABASE INITIALIZATION
    // =====================================

    async initSupabase() {

        if (!window.supabase) {
            setTimeout(() => this.initSupabase(), 500);
            return;
        }

        if (!this.supabaseClient) {
            const { createClient } = window.supabase;
            this.supabaseClient = createClient(this.supabaseUrl, this.supabaseKey);
            console.log("✅ Supabase ready");
        }

        await this.startGameSession();
    }

    // =====================================
    // SESSION FUNCTIONS
    // =====================================

    generateSessionId() {
        return (
            Date.now().toString(36) +
            Math.random().toString(36).substr(2, 8)
        );

        
    }

    async getCountry() {
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


    async startGameSession() {

        if (!this.supabaseClient) return;

        this.sessionId = this.generateSessionId();
        const country = await this.getCountry();

        try {
            await this.supabaseClient
                .from("game_sessions")
                .insert([{
                    session_id: this.sessionId,
                    game_slug: "pocketgolf",
                    placement_id: this.getPlacementId(),
                    user_agent: navigator.userAgent,
                    os: this.getOS(),
                    browser: this.getBrowser(),
                    country: country,
                    started_game: true,
                    bounced: false
                }]);

        } catch (e) {
            console.warn("Session start failed", e);
        }
    }

    async updateGameSession(fields) {

        if (!this.supabaseClient || !this.sessionId) return;

        try {
            await this.supabaseClient
                .from("game_sessions")
                .update(fields)
                .eq("session_id", this.sessionId);

        } catch (e) {}
    }

    sendDurationOnExit(reason) {

        if (!this.gameStartTime || this.durationSent) return;

        const seconds = Math.round((Date.now() - this.gameStartTime) / 1000);

        this.updateGameSession({
            duration_seconds: seconds,
            bounced: !this.gameStartedFlag,
            end_reason: reason
        });

        this.durationSent = true;
    }

    // =====================================
    // DEVICE INFO
    // =====================================

    getPlacementId() {
        const params = new URLSearchParams(window.location.search);
        return params.get("utm_content") || params.get("placementid") || "unknown";
    }

    getOS() {

        const ua = navigator.userAgent;

        if (/android/i.test(ua)) return "Android";
        if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
        if (/Win/i.test(ua)) return "Windows";
        if (/Mac/i.test(ua)) return "Mac";
        if (/Linux/i.test(ua)) return "Linux";

        return "Unknown";
    }

    getBrowser() {

        const ua = navigator.userAgent;

        if (/Edg/i.test(ua)) return "Edge";
        if (/OPR|Opera/i.test(ua)) return "Opera";
        if (/Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)) return "Chrome";
        if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
        if (/Firefox/i.test(ua)) return "Firefox";

        return "Unknown";
    }



    initPhysics() {
        if (typeof CANNON === 'undefined') throw new Error("Cannon.js not loaded");
        this.world = new CANNON.World();
        this.world.gravity.set(0, -20, 0);
        const groundMat = new CANNON.Material("ground");
        const ballMat = new CANNON.Material("ball");
        const wallMat = new CANNON.Material("wall");
        
        // Ball vs Ground: Moderate bounce and friction for control
        this.world.addContactMaterial(new CANNON.ContactMaterial(groundMat, ballMat, { friction: 0.15, restitution: 0.5 }));
        
        // Ball vs Wall: High bounce, low friction (Pool-like specular reflection)
        this.world.addContactMaterial(new CANNON.ContactMaterial(wallMat, ballMat, { friction: 0.05, restitution: 0.9 }));
        
        this.ballMat = ballMat;
        this.wallMat = wallMat;
    }

    initScene() {
        if (typeof THREE === 'undefined') throw new Error("Three.js not loaded");
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05060a);
        
        // REVERTED COMPACT VERTICAL CAMERA (Top-Down Vertical)
        this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / (window.innerHeight - 100), 0.1, 1000);
        this.camera.position.set(0, 52, 28); 
        this.camera.lookAt(0, 0, -3);
        
        const canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight - 100);
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.8;

        const size = 512;
        const canv = document.createElement('canvas');
        canv.width = size; canv.height = size;
        const ctx = canv.getContext('2d');
        ctx.fillStyle = '#1e5d22'; ctx.fillRect(0,0,size,size);
        for(let i=0; i<15000; i++) {
            ctx.fillStyle = `rgba(46, 125, 50, ${Math.random()*0.15})`;
            ctx.fillRect(Math.random()*size, Math.random()*size, 2, 2);
        }
        const tex = new THREE.CanvasTexture(canv);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 5);

        // WIDER GROUND: 30 units Wide, 30 units Deep
        this.groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
        this.groundMesh.rotation.x = -Math.PI / 2; 
        this.groundMesh.receiveShadow = true;
        this.scene.add(this.groundMesh);

        const gBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
        gBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
        this.world.addBody(gBody);

        // EXTRA PREMIUM BRANDING ON GROUND (Enhanced Visibility)
        const brandCanv = document.createElement('canvas');
        brandCanv.width = 512; brandCanv.height = 256;
        const bctx = brandCanv.getContext('2d');
        bctx.clearRect(0, 0, 512, 256);
        bctx.font = '900 120px sans-serif'; // Bold fallback
        bctx.textAlign = 'center';
        bctx.textBaseline = 'middle';
        
        // Add a subtle glow/outline for visibility
        bctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        bctx.lineWidth = 4;
        bctx.strokeText('GOLF', 256, 128);
        
        bctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; // Increased opacity
        bctx.fillText('GOLF', 256, 128);
        
        const btex = new THREE.CanvasTexture(brandCanv);
        const brandMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(22, 11), // Slightly larger
            new THREE.MeshBasicMaterial({ map: btex, transparent: true, depthWrite: false, opacity: 1.0 })
        );
        brandMesh.rotation.x = -Math.PI / 2;
        brandMesh.position.set(0, 0.1, 0); // Raised slightly to prevent z-fighting
        this.scene.add(brandMesh);
    }

    initLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(20, 60, 20);
        sun.castShadow = true;
        this.scene.add(sun);
    }

    initSounds() {
        this.sounds = {
            hit: new Audio('../assets/ball_kick.mp3'),
            sink: new Audio('../assets/stack_place.wav'),
            wall: new Audio('../assets/stack_place.wav')
        };
        Object.values(this.sounds).forEach(s => s.volume = 0.4);
    }

    playSound(name) {
        if (!this.sounds[name]) return;
        const s = this.sounds[name].cloneNode();
        s.volume = 0.4;
        s.play().catch(() => {});
    }

    initBalls() {
        const createGolfBall = (baseColor) => {
            const size = 512;
const canv = document.createElement('canvas');
canv.width = canv.height = size;
const ctx = canv.getContext('2d');

// base color
ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, size, size);

// golf ball dimples
const spacing = 28;
const radius = 6;

for (let y = 0; y < size; y += spacing) {
    for (let x = 0; x < size; x += spacing) {

        const offset = (Math.floor(y / spacing) % 2) * (spacing / 2);

        const cx = x + offset;
        const cy = y;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, "#e8e8e8");
        grad.addColorStop(1, "#bdbdbd");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx % size, cy % size, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

const colorTexture = new THREE.CanvasTexture(canv);
colorTexture.wrapS = colorTexture.wrapT = THREE.RepeatWrapping;

            ctx.fillStyle = '#8080ff';
            ctx.fillRect(0, 0, size, size);
            for(let y=0; y<=size; y += 16) {
                for(let x=0; x<=size; x += 16) {
                    const ox = (Math.floor(y/16) % 2) * 8;
                    const grad = ctx.createRadialGradient(x+ox, y, 0, x+ox, y, 7);
                    grad.addColorStop(0, '#7070ff');
                    grad.addColorStop(1, '#8080ff');
                    ctx.fillStyle = grad;
                    ctx.beginPath(); ctx.arc((x+ox)%size, y%size, 6, 0, Math.PI*2); ctx.fill();
                }
            }
            
            const normalMap = new THREE.CanvasTexture(canv);
            normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;

            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.7, 64, 64), 
                new THREE.MeshStandardMaterial({
    map: colorTexture,
    color: baseColor,
    roughness: 0.35,
    metalness: 0.05
})

            );
            mesh.castShadow = true; 
            this.scene.add(mesh);
            const body = new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(0.7), material: this.ballMat });
            body.linearDamping = 0.45; body.angularDamping = 0.45; // Reverted to realistic damping
            this.world.addBody(body);
            return { mesh, body };
        };
        
        // Distinct Colors: Player (Cyan), AI (Gold)
        let p = createGolfBall(0x00f2fe);
        this.ball.player.mesh = p.mesh;
        this.ball.player.body = p.body;
        
        let a = createGolfBall(0xfcc419);
        this.ball.ai.mesh = a.mesh;
        this.ball.ai.body = a.body;

        this.ball.player.body.addEventListener('collide', (e) => this.onCollide(e));
        this.ball.ai.body.addEventListener('collide', (e) => this.onCollide(e));
    }

    onCollide(e) {
        if (Math.abs(e.contact.getImpactVelocityAlongNormal()) > 1.5) {
            this.playSound('wall');
        }
    }

    loadLevel() {
        // Dynamic Walls based on 30 width
        const variant = this.levelPool[(this.currentHole - 1) % this.levelPool.length];
        const baseWalls = [
            {x:0, z:-15, w:30, d:1}, {x:0, z:15, w:30, d:1}, // Top/Bottom
            {x:-15, z:0, w:1, d:31}, {x:15, z:0, w:1, d:31}  // Left/Right
        ];

        this.resetBall(this.ball.player, { x: -4, z: 8 }); // Moved "ahead" from border
        this.resetBall(this.ball.ai, { x: 4, z: 8 });     // Moved "ahead" from border
        this.hole.x = (Math.random() - 0.5) * 12; // Wider randomization
        this.hole.z = -12 + (Math.random() * 2); 
        this.updateHoleVisual();
        
        this.walls.forEach(w => { this.scene.remove(w.mesh); this.world.remove(w.body); });
        
        // Merge boundary walls with level-specific obstacles
        const allWalls = [...baseWalls, ...(variant.obstacles || [])];
        this.walls = allWalls.map(w => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, 4, w.d), new THREE.MeshStandardMaterial({ color: 0x111620 }));
            mesh.position.set(w.x, 2, w.z); mesh.castShadow = mesh.receiveShadow = true;
            this.scene.add(mesh);
            const body = new CANNON.Body({ 
                mass: 0, 
                shape: new CANNON.Box(new CANNON.Vec3(w.w/2, 2, w.d/2)),
                material: this.wallMat // Apply specific wall material
            });
            body.position.set(w.x, 2, w.z); this.world.addBody(body);
            return { mesh, body };
        });

        document.getElementById('level-label').innerText = `HOLE ${this.currentHole}/15`;
        this.state = 'PLAYER_TURN';
        this.updateHUD();
    }

    resetBall(b, pos) {
        if (!b.body || !b.mesh) return;
        b.body.position.set(pos.x, 0.7, pos.z);
        b.body.velocity.set(0,0,0); b.body.angularVelocity.set(0,0,0);
        b.strokes = 0; b.inHole = false; b.mesh.visible = true; b.mesh.scale.set(1,1,1);
    }

    updateHoleVisual() {
        if (this.holeMesh) this.scene.remove(this.holeMesh);
        this.holeMesh = new THREE.Mesh(new THREE.CircleGeometry(this.hole.radius, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
        this.holeMesh.rotation.x = -Math.PI/2; this.holeMesh.position.set(this.hole.x, 0.05, this.hole.z);
        this.scene.add(this.holeMesh);
        this.createAnimatedFlag();
    }

    createAnimatedFlag() {
        if (this.flagGroup) this.scene.remove(this.flagGroup);
        this.flagGroup = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 7), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
        pole.position.y = 3.5; this.flagGroup.add(pole);
        const clothGeo = new THREE.PlaneGeometry(2, 1.2, 10, 10);
        const clothMat = new THREE.MeshStandardMaterial({ color: 0xee3333, side: THREE.DoubleSide });
        this.cloth = new THREE.Mesh(clothGeo, clothMat);
        this.cloth.position.set(1, 6, 0);
        this.flagGroup.add(this.cloth);
        this.flagGroup.position.set(this.hole.x, 0, this.hole.z);
        this.scene.add(this.flagGroup);
    }

    setupControls() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        const down = (e) => {
            if (this.state !== 'PLAYER_TURN' || this.isMoving(this.ball.player)) return;
            const x = e.clientX || (e.touches && e.touches[0].clientX); 
            const y = e.clientY || (e.touches && e.touches[0].clientY);
            // this.mouse.x = (x / window.innerWidth) * 2 - 1;
            // this.mouse.y = -(y / (window.innerHeight - 100)) * 2 + 1;

            const rect = this.renderer.domElement.getBoundingClientRect();

this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const hits = this.raycaster.intersectObject(this.groundMesh);
            if (hits.length > 0) {
                this.isDragging = true;
                this.dragOrigin = this.ball.player.mesh.position.clone();
                this.dragCurrent = hits[0].point.clone();
                document.getElementById('power-meter').style.display = 'block';
                const tut = document.getElementById('tutorial-overlay');
                if (tut) tut.classList.add('hidden');
            }
        };

        const move = (e) => {
            if (!this.isDragging) return;
            const x = e.clientX || (e.touches && e.touches[0].clientX); 
            const y = e.clientY || (e.touches && e.touches[0].clientY);
            // this.mouse.x = (x / window.innerWidth) * 2 - 1;
            // this.mouse.y = -(y / (window.innerHeight - 100)) * 2 + 1;

            const rect = this.renderer.domElement.getBoundingClientRect();

this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const hits = this.raycaster.intersectObject(this.groundMesh);
            if (hits.length) {
                this.dragCurrent = hits[0].point.clone();
                const dist = Math.min(this.dragOrigin.distanceTo(this.dragCurrent), 14);
                document.getElementById('power-fill').style.width = (dist * 7.1) + '%';
                this.updateAimLine();
            }
        };

        const up = () => { 
            if (!this.isDragging) return; 
            this.isDragging = false; 
            document.getElementById('power-meter').style.display = 'none';
            this.removeAimLine(); 
            this.shoot('player'); 
        };

        window.addEventListener('mousedown', down);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        window.addEventListener('touchstart', (e) => { e.preventDefault(); down(e); }, {passive:false});
        window.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); }, {passive:false});
        window.addEventListener('touchend', (e) => { e.preventDefault(); up(); }, {passive:false});
        
        document.getElementById('restart-btn').onclick = () => location.reload();
    }

    updateAimLine() {
        if (this.aimGroup) this.scene.remove(this.aimGroup);
        this.aimGroup = new THREE.Group();

        const dir = new THREE.Vector3().subVectors(this.dragOrigin, this.dragCurrent);
        const rawLen = dir.length();
        const len = Math.min(rawLen * 2, 14);
        if (len < 0.5) return;

        dir.normalize();

        // Arrow Body
        const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, len, 12);
        const bodyMat = new THREE.MeshBasicMaterial({ 
            color: 0x00f2fe, 
            transparent: true, 
            opacity: 0.7 
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        
        // Arrow Head
        const headGeo = new THREE.ConeGeometry(0.4, 0.8, 12);
        const head = new THREE.Mesh(headGeo, bodyMat);
        
        body.position.set(0, len/2, 0);
        head.position.set(0, len, 0);
        
        this.aimGroup.add(body);
        this.aimGroup.add(head);

        // Align group with direction
        this.aimGroup.position.copy(this.ball.player.mesh.position);
        this.aimGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        
        this.scene.add(this.aimGroup);
    }

    removeAimLine() { if (this.aimGroup) { this.scene.remove(this.aimGroup); this.aimGroup = null; } }

    shoot(who) {
        const b = this.ball[who];
        if (who === 'player') {
            const dir = new THREE.Vector3().subVectors(this.dragOrigin, this.dragCurrent);
            const pwr = Math.min(dir.length() * 8.5, 75); // Increased Player Power
            dir.normalize();
            b.body.velocity.set(dir.x * pwr, 0, dir.z * pwr);
            b.strokes++; 
            this.playSound('hit');
            this.updateHUD();

             const seconds = Math.round((Date.now() - this.gameRecordTime) / 1000);
        if (seconds > 60) {
            initBottomAndSideAds();
            this.gameRecordTime = Date.now(); 
        }
        
        } else {
            if (this.aiIsThinking) return; this.aiIsThinking = true;
            setTimeout(() => {
                const pos = b.body.position;
                const targetPos = new THREE.Vector3(this.hole.x, 0, this.hole.z);
                const rayDir = new THREE.Vector3().subVectors(targetPos, new THREE.Vector3(pos.x, 0, pos.z)).normalize();
                
                // SMARTER AI: Obstacle Detection via Raycasting
                this.raycaster.set(new THREE.Vector3(pos.x, 0.5, pos.z), rayDir);
                const intersectWalls = this.walls.map(w => w.mesh);
                const hits = this.raycaster.intersectObjects(intersectWalls);
                const distToHole = pos.distanceTo(new CANNON.Vec3(this.hole.x, 0.7, this.hole.z));
                
                let shootDir = rayDir.clone();
                let isBlocked = false;
                
                if (hits.length > 0 && hits[0].distance < distToHole) {
                    isBlocked = true;
                    // Attempt to find a clear path by checking alternative angles
                    const angles = [0.4, -0.4, 0.8, -0.8, 1.2, -1.2]; // Radians to check left/right
                    for (let angle of angles) {
                        const altDir = rayDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                        this.raycaster.set(new THREE.Vector3(pos.x, 0.5, pos.z), altDir);
                        const altHits = this.raycaster.intersectObjects(intersectWalls);
                        if (altHits.length === 0 || altHits[0].distance > 10) {
                            shootDir = altDir;
                            isBlocked = false;
                            break;
                        }
                    }
                }

                // Final Shoot Direction with Pro Accuracy
                const errorFactor = 0.008 - (this.currentHole * 0.0004);
                shootDir.x += (Math.random()-0.5) * errorFactor;
                shootDir.z += (Math.random()-0.5) * errorFactor;
                
                const pwr = isBlocked ? Math.min(distToHole * 2.5, 55) : Math.min(distToHole * 2.0, 45); 
                b.body.velocity.set(shootDir.x * pwr, 0, shootDir.z * pwr);
                
                b.strokes++; 
                this.playSound('hit');
                this.updateHUD(); this.aiIsThinking = false;
            }, 800);
        }
    }

   updateLabels() {
    const balls = [this.ball.player, this.ball.ai];

    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();

    balls.forEach(b => {
        const label = document.getElementById(b.labelId);
        if (!label) return;

        if (!b.mesh.visible || b.inHole) {
            label.style.display = 'none';
            return;
        }

        label.style.display = 'block';

        const pos = b.mesh.position.clone();
        pos.y += 2.0;   // height above ball
        pos.project(this.camera);

        const x = (pos.x * 0.5 + 0.5) * rect.width + rect.left;
        const y = (pos.y * -0.5 + 0.5) * rect.height + rect.top;

        label.style.left = `${x}px`;
        label.style.top = `${y}px`;
    });
}

   


    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.world) this.world.step(1/60);
        this.sync(this.ball.player); this.sync(this.ball.ai);
        this.check(this.ball.player); this.check(this.ball.ai);
        this.updateLabels();
        
        if (this.cloth) {
            const time = Date.now() * 0.005;
            const pos = this.cloth.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                if (x > 0) pos.setZ(i, Math.sin(x * 2 + time) * 0.3);
            }
            pos.needsUpdate = true;
        }

        const target = this.state === 'AI_TURN' ? this.ball.ai.mesh.position : this.ball.player.mesh.position;
        if (this.camera && target) {
            // REVERTED to smooth vertical tracking
            this.camera.position.lerp(new THREE.Vector3(target.x * 0.3, 52, target.z + 28), 0.1);
            this.camera.lookAt(target.x, 0, target.z - 3);
        }
        
        this.logic();
        if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
    }

    sync(b) { if (b && !b.inHole && b.mesh && b.body) { b.mesh.position.copy(b.body.position); b.mesh.quaternion.copy(b.body.quaternion); } }
    isMoving(b) { return b && b.body && b.body.velocity.norm() > 0.4; }

    check(b) {
        if (!b || b.inHole) return;
        const d = Math.hypot(b.body.position.x - this.hole.x, b.body.position.z - this.hole.z);
        if (d < this.hole.radius && b.body.velocity.norm() < 12) {
            b.inHole = true; b.body.velocity.set(0,0,0);
            this.playSound('sink');
            this.showMessage(b === this.ball.player ? "SINK!" : "AI PERFECT!");
            const anim = () => { 
                if (b.mesh.scale.x > 0.1) { b.mesh.scale.multiplyScalar(0.7); b.mesh.position.y -=0.25; requestAnimationFrame(anim); }
                else b.mesh.visible = false;
            }; anim();
        }
    }

    logic() {
        if (this.state === 'PLAYER_TURN' && !this.isMoving(this.ball.player) && !this.isDragging) {
            if (this.ball.player.inHole || this.ball.player.strokes >= 3) {
                // IMMEDIATE SCORE UPDATE FOR PLAYER
                const pPoints = this.calculatePointsValue(this.ball.player);
                this.ball.player.frameData[this.currentHole - 1] = pPoints;
                this.updateHUD(); // Show player points immediately

                this.state = 'AI_TURN'; 
                const ti = document.getElementById('turn-indicator');
                if (ti) { ti.innerText = 'AI TURN'; ti.style.background = '#fcc419'; }
            }
        } else if (this.state === 'AI_TURN' && !this.isMoving(this.ball.ai) && !this.aiIsThinking) {
            if (this.ball.ai.inHole || this.ball.ai.strokes >= 3) {
                this.state = 'TRANSITION'; setTimeout(() => this.resolveHole(), 1000);
            } else this.shoot('ai');
        }
    }

    calculatePointsValue(b) {
        if (!b.inHole) return 0;
        if (b.strokes === 1) return 3;
        if (b.strokes === 2) return 2;
        if (b.strokes === 3) return 1;
        return 0;
    }

    resolveHole() {
        // AI already finished, calculate its points
        const aPoints = this.calculatePointsValue(this.ball.ai);
        const pPoints = this.ball.player.frameData[this.currentHole - 1]; // Already set in logic()
        
        this.ball.ai.frameData[this.currentHole - 1] = aPoints;
        
        // Finalize totals for the hole
        this.ball.player.score += (typeof pPoints === 'number' ? pPoints : 0);
        this.ball.ai.score += aPoints;
        
        this.currentHole++;
        
        if (this.currentHole > 15) {
            // End of Set - Determine Winner
            if (this.ball.player.score > this.ball.ai.score) this.ball.player.setsWon++;
            else if (this.ball.ai.score > this.ball.player.score) this.ball.ai.setsWon++;
            
            // For now, show result after every set (15 holes)
            this.showGameOver();
        } else {
            this.loadLevel();
        }
        this.updateHUD();
    }

    updateHUD() {
        const sp = document.getElementById('score-p'); if (sp) sp.innerText = this.ball.player.score;
        const sa = document.getElementById('score-a'); if (sa) sa.innerText = this.ball.ai.score;
        
        const sc = document.getElementById('strokes-count');
        const s = this.state === 'AI_TURN' ? this.ball.ai.strokes : this.ball.player.strokes;
        if (sc) sc.innerText = `${s}/3`;

        const updateFrames = (id, data) => {
            const container = document.getElementById(id); if (!container) return;
            const spans = container.querySelectorAll('span');
            spans.forEach((span, i) => {
                if (data[i] !== undefined) {
                    span.innerText = data[i];
                    span.classList.toggle('active', data[i] !== '-');
                }
            });
        };
        updateFrames('frames-p', this.ball.player.frameData);
        updateFrames('frames-a', this.ball.ai.frameData);

        const ti = document.getElementById('turn-indicator');
        if (ti) {
            if (this.state === 'PLAYER_TURN') { ti.innerText = 'YOUR TURN'; ti.style.background = '#ff3366'; } 
            else if (this.state === 'AI_TURN') { ti.innerText = 'AI TURN'; ti.style.background = '#fcc419'; }
        }
    }

    showMessage(t) {
        const m = document.getElementById('match-msg');
        if (m) { m.innerText = t; m.classList.remove('hidden'); setTimeout(() => m.classList.add('hidden'), 1500); }
    }

    showGameOver() {
        const pScore = this.ball.player.score;
        const aScore = this.ball.ai.score;
        
        const titleEl = document.getElementById('result-title');
        const subEl = document.getElementById('result-sub');
        const iconEl = document.getElementById('result-icon');
        
        if (pScore > aScore) {
            if (titleEl) titleEl.innerText = "CHAMPION!";
            if (subEl) subEl.innerText = "You dominated the 15-hole championship!";
            if (iconEl) iconEl.innerText = "🏆";
        } else if (aScore > pScore) {
            if (titleEl) titleEl.innerText = "DEFEAT!";
            if (subEl) subEl.innerText = "The AI outplayed you this time.";
            if (iconEl) iconEl.innerText = "💀";
        } else {
            if (titleEl) titleEl.innerText = "DRAW!";
            if (subEl) subEl.innerText = "An evenly matched performance!";
            if (iconEl) iconEl.innerText = "🤝";
        }

        const fsd = document.getElementById('final-score-display');
        if (fsd) fsd.innerHTML = `<h2>FINAL SET SCORE</h2><h3>YOU: ${pScore} | AI: ${aScore}</h3>`;
        
        const gos = document.getElementById('game-over-screen');
        if (gos) gos.classList.remove('hidden');
    }

    onResize() {
        const h = window.innerHeight - 100;
        if (this.camera) {
            this.camera.aspect = window.innerWidth / h;
            this.camera.updateProjectionMatrix();
        }
        if (this.renderer) this.renderer.setSize(window.innerWidth, h);
    }
}

window.onload = () => new GolfGame3D();
