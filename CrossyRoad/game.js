const ui = {
    score: document.getElementById('current-score'),
    target: document.getElementById('target-score'),
    time: document.getElementById('time-left'),
    level: document.getElementById('level-display'),
    timerContainer: document.getElementById('timer-container'),
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    resultTitle: document.getElementById('result-title'),
    resultDesc: document.getElementById('result-desc')
};

const canvasContainer = document.getElementById("canvas-container");
const wrapper = document.getElementById('game-wrapper');
let CW = wrapper ? wrapper.clientWidth : window.innerWidth;
let CH = wrapper ? wrapper.clientHeight : window.innerHeight;

// ─── SUPABASE ────────────────────────────────────────────────────
const SUPA_URL = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const SUPA_KEY = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let _sb = null, _sessionId = null, _sessionStarted = false, _gameStartTime = null, _durationSent = false;
let _gameRecordTime = null; // for PMG_TICK_RATE ad refresh

function _getOS() { const u=navigator.userAgent; return /android/i.test(u)?'Android':/iPhone|iPad/i.test(u)?'iOS':/Win/i.test(u)?'Windows':/Mac/i.test(u)?'Mac':'Other'; }
function _getBrowser() { const u=navigator.userAgent; return /Edg/i.test(u)?'Edge':/Chrome/i.test(u)?'Chrome':/Safari/i.test(u)?'Safari':/Firefox/i.test(u)?'Firefox':'Other'; }
function _placement() { const p=new URLSearchParams(location.search); return p.get('utm_content')||p.get('placementid')||'unknown'; }
async function _country() { try{const r=await fetch('https://ipapi.co/json/');const d=await r.json();return d.country_name||'Unknown';}catch{return 'Unknown';} }
async function initSupabase() {
    if (!window.supabase) { setTimeout(initSupabase,600); return; }
    const {createClient}=window.supabase; _sb=createClient(SUPA_URL,SUPA_KEY);
    _sessionId=Date.now().toString(36)+Math.random().toString(36).substr(2,8);
    try { await _sb.from('game_sessions').insert([{ session_id:_sessionId, game_slug:'crossy_road_neon', placement_id:_placement(), user_agent:navigator.userAgent, os:_getOS(), browser:_getBrowser(), country:await _country(), started_game:false, bounced:false }]); } catch(e){}
}
async function _markStarted() { if(!_sb||!_sessionId)return; try{await _sb.from('game_sessions').update({started_game:true}).eq('session_id',_sessionId);}catch(e){} }
async function _updateSess(f) { if(!_sb||!_sessionId)return; try{await _sb.from('game_sessions').update(f).eq('session_id',_sessionId);}catch(e){} }
function _sendDuration(reason) {
    if(_gameStartTime&&!_durationSent&&window.trackGameEvent){
        const s=Math.round((Date.now()-_gameStartTime)/1000);
        window.trackGameEvent(`game_duration_crossy_road_${s}_${reason}`,{seconds:s,os:_getOS(),placement_id:_placement()});
        _updateSess({duration_seconds:s,bounced:!_sessionStarted,end_reason:reason}); _durationSent=true;
    }
}
window.addEventListener('beforeunload',()=>_sendDuration('tab_close'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)_sendDuration('background');});

// --- Sound System ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration, vol = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sounds = {
    popPositive: () => playSound(800, 'triangle', 0.15, 0.15),
    popNegative: () => playSound(200, 'sawtooth', 0.2, 0.1),
    gameOver: () => playSound(150, 'sawtooth', 0.8, 0.2),
    win: () => {
        playSound(523.25, 'sine', 0.1);
        setTimeout(() => playSound(659.25, 'sine', 0.15), 100);
        setTimeout(() => playSound(783.99, 'triangle', 0.3), 200);
    },
    move: () => playSound(350, 'sine', 0.05, 0.03) // very subtle move blip
};

// --- Game State Tracking ---
let score = 0;
let level = 1;
let targetScore = 50;
let timeLeft = 60;
let gameState = 'MENU'; // MENU, PLAY, OVER
let lastFrameTime = 0;

// Moved tracking to top level Supabase logic

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Daylight sky
scene.fog = new THREE.Fog(0x87CEEB, 300, 1500);

const distance = 500;
const camera = new THREE.OrthographicCamera(
  CW / -2,
  CW / 2,
  CH / 2,
  CH / -2,
  0.1,
  10000
);

camera.rotation.x = (50 * Math.PI) / 180;
camera.rotation.y = (20 * Math.PI) / 180;
camera.rotation.z = (10 * Math.PI) / 180;

const initialCameraPositionY = -Math.tan(camera.rotation.x) * distance;
const initialCameraPositionX =
  Math.tan(camera.rotation.y) *
  Math.sqrt(distance ** 2 + initialCameraPositionY ** 2);
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;

const zoom = 2;
const chickenSize = 15;
const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth * columns;
const stepTime = 180; 

let lanes;
let currentLane;
let currentColumn;

let previousTimestamp;
let startMoving;
let moves;
let stepStartTimestamp;

let activeBalloons = []; // Track balloons on the board

// Helper Textures
function Texture(width, height, rects, baseColor = "#333340", windowColor = "rgba(100, 200, 255, 0.5)") {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = baseColor;
  context.fillRect(0, 0, width, height);
  context.fillStyle = windowColor;
  rects.forEach((rect) => {
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
  });
  return new THREE.CanvasTexture(canvas);
}

function createJustTextTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,256,256);
    ctx.fillStyle = "white";
    ctx.font = "600 130px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 8;
    ctx.fillText(text, 128, 128); 
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
}

const carFrontTexture = new Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = new Texture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = new Texture(110, 40, [{ x: 10, y: 0, w: 50, h: 30 }, { x: 70, y: 0, w: 30, h: 30 }]);
const carLeftSideTexture = new Texture(110, 40, [{ x: 10, y: 10, w: 50, h: 30 }, { x: 70, y: 10, w: 30, h: 30 }]);

const truckFrontTexture = new Texture(30, 30, [{ x: 15, y: 0, w: 10, h: 30 }]);
const truckRightSideTexture = new Texture(25, 30, [{ x: 0, y: 15, w: 10, h: 10 }]);
const truckLeftSideTexture = new Texture(25, 30, [{ x: 0, y: 5, w: 10, h: 10 }]);

const generateLanes = () =>
  [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((index) => {
      const lane = new Lane(index);
      lane.mesh.position.y = index * positionWidth * zoom;
      scene.add(lane.mesh);
      return lane;
    }).filter((lane) => lane.index >= 0);

const addLane = () => {
  const index = lanes.length;
  const lane = new Lane(index);
  lane.mesh.position.y = index * positionWidth * zoom;
  scene.add(lane.mesh);
  lanes.push(lane);
};

const chicken = new Chicken();
scene.add(chicken);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.7);
scene.add(hemiLight);

const initialDirLightPositionX = -100;
const initialDirLightPositionY = -100;
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);
dirLight.castShadow = true;
dirLight.target = chicken;
scene.add(dirLight);

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
var d = 500;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

const laneTypes = ["car", "truck", "forest", "field"];
const laneSpeeds = [2.0, 2.5, 3];
const vechicleColors = [0xa52523, 0x1144ff, 0xff8800, 0x55cc33, 0xffffff, 0x333333];
const threeHeights = [20, 35, 50, 40];

const initaliseValues = () => {
  if (lanes) lanes.forEach((lane) => scene.remove(lane.mesh));
  activeBalloons.forEach(b => scene.remove(b.mesh));
  activeBalloons = [];

  lanes = generateLanes();

  currentLane = 0;
  currentColumn = Math.floor(columns / 2);

  previousTimestamp = null;
  startMoving = false;
  moves = [];
  stepStartTimestamp = null;

  chicken.position.x = 0;
  chicken.position.y = 0;
  chicken.position.z = 0;

  camera.position.y = initialCameraPositionY;
  camera.position.x = initialCameraPositionX;

  dirLight.position.x = initialDirLightPositionX;
  dirLight.position.y = initialDirLightPositionY;
  
  score = 0;
  timeLeft = 60 + Math.min(60, (level - 1) * 20);
  targetScore = 50 + (level - 1) * 30;
  
  updateHUD();
};

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(CW, CH);
canvasContainer.appendChild(renderer.domElement);

function Wheel() {
  const wheel = new THREE.Mesh(
    new THREE.BoxBufferGeometry(12 * zoom, 33 * zoom, 12 * zoom),
    new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true })
  );
  wheel.position.z = 6 * zoom;
  return wheel;
}

function Car() {
  const car = new THREE.Group();
  const color = vechicleColors[Math.floor(Math.random() * vechicleColors.length)];

  const main = new THREE.Mesh(
    new THREE.BoxBufferGeometry(60 * zoom, 30 * zoom, 15 * zoom),
    new THREE.MeshPhongMaterial({ color, flatShading: true })
  );
  main.position.z = 12 * zoom;
  main.castShadow = true;
  main.receiveShadow = true;
  car.add(main);

  const cabin = new THREE.Mesh(
    new THREE.BoxBufferGeometry(33 * zoom, 24 * zoom, 12 * zoom),
    [
      new THREE.MeshPhongMaterial({ color: 0xdddddd, flatShading: true, map: carBackTexture }),
      new THREE.MeshPhongMaterial({ color: 0xdddddd, flatShading: true, map: carFrontTexture }),
      new THREE.MeshPhongMaterial({ color: 0xdddddd, flatShading: true, map: carRightSideTexture }),
      new THREE.MeshPhongMaterial({ color: 0xdddddd, flatShading: true, map: carLeftSideTexture }),
      new THREE.MeshPhongMaterial({ color: 0xdddddd, flatShading: true }),
      new THREE.MeshPhongMaterial({ color: 0xdddddd, flatShading: true }),
    ]
  );
  cabin.position.x = 6 * zoom;
  cabin.position.z = 25.5 * zoom;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add(cabin);

  car.add(Wheel().translateY(-18 * zoom));
  const frontWheel = new Wheel();
  frontWheel.position.x = -18 * zoom;
  car.add(frontWheel);
  const backWheel = new Wheel();
  backWheel.position.x = 18 * zoom;
  car.add(backWheel);

  return car;
}

function Truck() {
  const truck = new THREE.Group();
  const color = vechicleColors[Math.floor(Math.random() * vechicleColors.length)];

  const base = new THREE.Mesh(
    new THREE.BoxBufferGeometry(100 * zoom, 25 * zoom, 5 * zoom),
    new THREE.MeshLambertMaterial({ color: 0x444444, flatShading: true })
  );
  base.position.z = 10 * zoom;
  truck.add(base);

  const cargoColor = Math.random() > 0.5 ? 0xffffff : 0xaaaaaa;
  const cargo = new THREE.Mesh(
    new THREE.BoxBufferGeometry(75 * zoom, 35 * zoom, 40 * zoom),
    new THREE.MeshPhongMaterial({ color: cargoColor, flatShading: true })
  );
  cargo.position.x = 15 * zoom;
  cargo.position.z = 30 * zoom;
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  truck.add(cargo);

  const cabin = new THREE.Mesh(
    new THREE.BoxBufferGeometry(25 * zoom, 30 * zoom, 30 * zoom),
    [
      new THREE.MeshPhongMaterial({ color, flatShading: true }),
      new THREE.MeshPhongMaterial({ color, flatShading: true, map: truckFrontTexture }),
      new THREE.MeshPhongMaterial({ color, flatShading: true, map: truckRightSideTexture }),
      new THREE.MeshPhongMaterial({ color, flatShading: true, map: truckLeftSideTexture }),
      new THREE.MeshPhongMaterial({ color, flatShading: true }),
      new THREE.MeshPhongMaterial({ color, flatShading: true }),
    ]
  );
  cabin.position.x = -40 * zoom;
  cabin.position.z = 20 * zoom;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  truck.add(cabin);

  const frontWheel = new Wheel();
  frontWheel.position.x = -38 * zoom;
  truck.add(frontWheel);
  const middleWheel = new Wheel();
  middleWheel.position.x = -10 * zoom;
  truck.add(middleWheel);
  const backWheel = new Wheel();
  backWheel.position.x = 30 * zoom;
  truck.add(backWheel);

  return truck;
}

function Three() {
  const three = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.BoxBufferGeometry(15 * zoom, 15 * zoom, 20 * zoom),
    new THREE.MeshPhongMaterial({ color: 0x664433, flatShading: true }) // Brown trunk
  );
  trunk.position.z = 10 * zoom;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  three.add(trunk);

  const height = threeHeights[Math.floor(Math.random() * threeHeights.length)];
  const crown = new THREE.Mesh(
    new THREE.BoxBufferGeometry(30 * zoom, 30 * zoom, height * zoom),
    new THREE.MeshLambertMaterial({ color: 0x44aa22, flatShading: true }) // Daylight green trees
  );
  crown.position.z = (height / 2 + 20) * zoom;
  crown.castShadow = true;
  crown.receiveShadow = false;
  three.add(crown);

  return three;
}

function Chicken() {
  const chicken = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxBufferGeometry(chickenSize * zoom, chickenSize * zoom, 20 * zoom),
    new THREE.MeshPhongMaterial({ color: 0xf4f4f4, flatShading: true }) // White chicken different from yellow
  );
  body.position.z = 10 * zoom;
  body.castShadow = true;
  body.receiveShadow = true;
  chicken.add(body);

  const rowel = new THREE.Mesh(
    new THREE.BoxBufferGeometry(2 * zoom, 4 * zoom, 2 * zoom),
    new THREE.MeshLambertMaterial({ color: 0xdd2222, flatShading: true }) // Deep red rowel
  );
  rowel.position.z = 21 * zoom;
  rowel.castShadow = true;
  rowel.receiveShadow = false;
  chicken.add(rowel);

  return chicken;
}

function Road() {
  const road = new THREE.Group();
  const createSection = (color) =>
    new THREE.Mesh(
      new THREE.PlaneBufferGeometry(boardWidth * zoom, positionWidth * zoom),
      new THREE.MeshPhongMaterial({ color })
    );

  const middle = createSection(0x666a77); // Light gray road
  middle.receiveShadow = true;
  road.add(middle);

  const left = createSection(0x595d69);
  left.position.x = -boardWidth * zoom;
  road.add(left);

  const right = createSection(0x595d69);
  right.position.x = boardWidth * zoom;
  road.add(right);

  return road;
}

function Grass() {
  const grass = new THREE.Group();
  const createSection = (color) =>
    new THREE.Mesh(
      new THREE.BoxBufferGeometry(boardWidth * zoom, positionWidth * zoom, 3 * zoom),
      new THREE.MeshPhongMaterial({ color })
    );

  const middle = createSection(0xbaf455); // Daylight vibrant grass
  middle.receiveShadow = true;
  grass.add(middle);

  const left = createSection(0x99c846);
  left.position.x = -boardWidth * zoom;
  grass.add(left);

  const right = createSection(0x99c846);
  right.position.x = boardWidth * zoom;
  grass.add(right);

  grass.position.z = 1.5 * zoom;
  return grass;
}

// Removed duplicate spawnBalloonObject

function Lane(index) {
  this.index = index;
  this.type = index <= 0 ? "field" : laneTypes[Math.floor(Math.random() * laneTypes.length)];
  this.occupiedPositions = new Set();
  
  if (this.type === "field") {
      this.mesh = new Grass();
  } else if (this.type === "forest") {
      this.mesh = new Grass();
      const numTrees = Math.floor(Math.random() * 4) + 1; // 1 to 4 trees
      this.threes = [];
      for(let i=0; i<numTrees; i++) {
        const three = new Three();
        let position;
        let attempts = 0;
        do {
          position = Math.floor(Math.random() * columns);
          attempts++;
        } while (this.occupiedPositions.has(position) && attempts < 15);
        this.occupiedPositions.add(position);
        three.position.x = (position * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
        this.mesh.add(three);
        this.threes.push(three);
      }
  } else if (this.type === "car" || this.type === "truck") {
      this.mesh = new Road();
      this.direction = Math.random() >= 0.5;
      const numVehicles = this.type === 'car' ? (Math.floor(Math.random()*2)+1) : (Math.floor(Math.random()*1)+1);
      
      this.vechicles = [];
      for(let i=0; i<numVehicles; i++) {
        const vechicle = this.type === 'car' ? new Car() : new Truck();
        let position;
        do {
          position = Math.floor((Math.random() * columns) / 2);
        } while (this.occupiedPositions.has(position));
        this.occupiedPositions.add(position);
        vechicle.position.x = (position * positionWidth * 2 + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
        if (!this.direction) vechicle.rotation.z = Math.PI;
        this.mesh.add(vechicle);
        this.vechicles.push(vechicle);
      }
      this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
  }

  // Spawn balloons in empty space
  // We only spawn on lanes ahead of 0 index
  if (index > 0) {
      for (let c = 0; c < columns; c++) {
          // 15% chance to spawn balloon
          if (!this.occupiedPositions.has(c) && Math.random() < 0.15) {
              const balloonGroup = spawnBalloonObject(index, c);
              scene.add(balloonGroup);
          }
      }
  }
}

// lowered spawn location
function spawnBalloonObject(laneIndex, colIndex) {
    const colorList = ['#94a3b8', '#fb923c', '#facc15', '#a3e635', '#4ade80', '#2dd4bf', '#38bdf8', '#60a5fa', '#818cf8', '#a855f7'];
    let maxVal = Math.min(50, 10 + Math.floor((level - 1) * 2));
    let val = Math.floor(Math.random() * maxVal) + 1; 
    let isNegative = Math.random() < 0.25; 
    
    if (isNegative) val = -Math.max(1, Math.floor(val / 2));
    
    let colorStr = colorList[(Math.abs(val) - 1) % 10];
    
    const balloonGroup = new THREE.Group();
    
    // Solid inflated balloon
    const geo = new THREE.SphereGeometry(7 * zoom, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: colorStr, roughness: 0.2, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    balloonGroup.add(mesh);
    
    // Super sharp Sprite text floating ABOVE the balloon
    const tex = createJustTextTexture(val.toString());
    const spriteMat = new THREE.SpriteMaterial({ map: tex });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(16 * zoom, 16 * zoom, 1);
    sprite.position.set(0, 0, 17 * zoom); // Floats beautifully above the balloon body
    balloonGroup.add(sprite);
    
    const knotGeo = new THREE.ConeGeometry(2 * zoom, 4 * zoom, 8);
    const knotMat = new THREE.MeshStandardMaterial({ color: colorStr });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    knot.position.z = -7 * zoom;
    knot.rotation.x = -Math.PI / 2;
    balloonGroup.add(knot);

    balloonGroup.position.x = (colIndex * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
    balloonGroup.position.y = laneIndex * positionWidth * zoom;
    
    // LANDED: Floating just barely off the ground instead of high in the sky
    const baseZ = 9 * zoom; 
    balloonGroup.position.z = baseZ;

    activeBalloons.push({
        mesh: balloonGroup,
        val,
        laneIndex,
        colIndex,
        timeAlive: Math.random() * 10,
        baseZ,
        colorStr,
        dead: false
    });
    return balloonGroup;
}

function createBurstParticles(pos, colorStr, value) {
    const color = new THREE.Color(colorStr);
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 20; 
    const pPos = new Float32Array(particleCount * 3);
    const pVel = [];

    for(let i=0; i<particleCount; i++) {
        pPos[i*3] = pos.x;
        pPos[i*3+1] = pos.y;
        pPos[i*3+2] = pos.z;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 5 + Math.random() * 15;
        pVel.push({
            x: Math.sin(phi) * Math.cos(theta) * speed,
            y: Math.sin(phi) * Math.sin(theta) * speed,
            z: Math.cos(phi) * speed
        });
    }

    particleGeo.addAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: color, size: 4, transparent: true });
    const particleSystem = new THREE.Points(particleGeo, pMat);
    scene.add(particleSystem);

    let life = 1.0;
    const animateParticles = () => {
        life -= 0.05;
        if(life <= 0) {
            scene.remove(particleSystem);
            particleGeo.dispose();
            pMat.dispose();
            return;
        }
        const attrs = particleSystem.geometry.attributes.position.array;
        for(let i=0; i<particleCount; i++) {
            attrs[i*3] += pVel[i].x ;
            attrs[i*3+1] += pVel[i].y ;
            attrs[i*3+2] += pVel[i].z ;
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
        particleSystem.material.opacity = life;
        requestAnimationFrame(animateParticles);
    };
    animateParticles();
    
    // HTML Pop UI
    const vector = new THREE.Vector3(pos.x, pos.y, pos.z);
    vector.project(camera);
    
    const wrapper = document.getElementById('game-wrapper');
    if(!wrapper) return;
    const px = (vector.x * 0.5 + 0.5) * CW;
    const py = (-(vector.y * 0.5) + 0.5) * CH;
    
    const floater = document.createElement('div');
    floater.innerText = value > 0 ? `+${value}` : `${value}`;
    floater.style.position = 'absolute';
    floater.style.left = `${px}px`;
    floater.style.top = `${py}px`;
    floater.style.color = value > 0 ? '#fff' : '#ef4444';
    floater.style.fontWeight = '900';
    floater.style.fontSize = '3.5rem';
    floater.style.pointerEvents = 'none';
    floater.style.textShadow = value > 0 ? `0 0 20px ${colorStr}, 0 4px 8px rgba(0,0,0,0.8)` : `0 0 20px #dc2626, 0 4px 8px rgba(0,0,0,0.8)`;
    floater.style.transform = 'translate(-50%, -50%) scale(0.3)';
    floater.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s linear';
    floater.style.zIndex = '100';
    floater.style.opacity = '1';
    
    wrapper.appendChild(floater);
    void floater.offsetWidth;
    floater.style.transform = 'translate(-50%, -150px) scale(1.5)';
    floater.style.opacity = '0';
    setTimeout(() => { if(floater.parentNode) floater.parentNode.removeChild(floater); }, 600);
}

function updateHUD() {
    ui.score.innerText = score;
    ui.target.innerText = targetScore;
    ui.time.innerText = Math.max(0, Math.ceil(timeLeft));
    ui.level.innerText = level;

    if (timeLeft <= 10) {
        ui.timerContainer.classList.add('urgent');
    } else {
        ui.timerContainer.classList.remove('urgent');
    }
}

function startGame() {
    if(!_sessionStarted) {
        _gameStartTime = Date.now();
        _gameRecordTime = Date.now();
        _sessionStarted = true;
        _markStarted();
    }
    ui.startScreen.classList.add('hidden');
    ui.gameOverScreen.classList.add('hidden');
    document.getElementById('next-level-btn').classList.add('hidden');
    document.getElementById('restart-btn').classList.remove('hidden');
    
    initaliseValues();
    gameState = 'PLAY';
    lastFrameTime = performance.now();
}

function nextLevel() {
    level++;
    startGame();
}

function gameOver(reason) {
    gameState = 'OVER';
    if(reason === "TIME") {
        sounds.gameOver();
        ui.resultTitle.innerText = "TIME'S UP!";
        ui.resultTitle.style.color = "#f43f5e";
        ui.resultDesc.innerHTML = `You reached <span style="color:#00e5ff">${score}</span>, but needed <span style="color:#ffeb3b">${targetScore}</span>!`;
        document.getElementById('restart-btn').classList.remove('hidden');
        document.getElementById('next-level-btn').classList.add('hidden');
    } else if (reason === "SQUASHED") {
        sounds.gameOver();
        ui.resultTitle.innerText = "SQUASHED!";
        ui.resultTitle.style.color = "#ef4444";
        ui.resultDesc.innerHTML = `You got hit by traffic! Score: <span style="color:#00e5ff">${score}</span>`;
        document.getElementById('restart-btn').classList.remove('hidden');
        document.getElementById('next-level-btn').classList.add('hidden');
    } else if (reason === "WIN") {
        sounds.win();
        ui.resultTitle.innerText = "LEVEL CLEAR! 🎉";
        ui.resultTitle.style.color = "#00e5ff";
        ui.resultDesc.innerHTML = `You crushed the target score of <span style="color:#ffeb3b">${targetScore}</span>!`;
        document.getElementById('next-level-btn').classList.remove('hidden');
        document.getElementById('restart-btn').classList.add('hidden');
        
        // syncPMGLayout called at bottom of function for all results
    }
    
    ui.gameOverScreen.classList.remove('hidden');
    if (typeof syncPMGLayout === 'function') syncPMGLayout();
    _updateSess({ bounced: false }); // mark as non-bounced session
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;
document.getElementById('next-level-btn').onclick = nextLevel;

document.getElementById("forward").addEventListener("click", () => move("forward"));
document.getElementById("backward").addEventListener("click", () => move("backward"));
document.getElementById("left").addEventListener("click", () => move("left"));
document.getElementById("right").addEventListener("click", () => move("right"));

window.addEventListener("keydown", (event) => {
  if (gameState !== 'PLAY') return;
  if (event.keyCode == "38") move("forward"); // up
  else if (event.keyCode == "40") move("backward"); // down
  else if (event.keyCode == "37") move("left"); // left
  else if (event.keyCode == "39") move("right"); // right
});

// Gesture recognition for mobile
let touchStartX = 0;
let touchStartY = 0;
window.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: true});

window.addEventListener('touchend', e => {
    if (gameState !== 'PLAY') return;
    
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    let dx = touchEndX - touchStartX;
    let dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) move("right");
            else move("left");
        } else {
            if (dy > 0) move("backward");
            else move("forward");
        }
    } else {
        if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'svg' && e.target.tagName !== 'path') {
            move("forward");
        }
    }
}, {passive: true});

function move(direction) {
  if (gameState !== 'PLAY') return;

  const finalPositions = moves.reduce(
    (position, move) => {
      if (move === "forward") return { lane: position.lane + 1, column: position.column };
      if (move === "backward") return { lane: position.lane - 1, column: position.column };
      if (move === "left") return { lane: position.lane, column: position.column - 1 };
      if (move === "right") return { lane: position.lane, column: position.column + 1 };
    },
    { lane: currentLane, column: currentColumn }
  );

  if (direction === "forward") {
    if (lanes[finalPositions.lane + 1].type === "forest" && lanes[finalPositions.lane + 1].occupiedPositions.has(finalPositions.column)) return;
    if (!stepStartTimestamp) startMoving = true;
    addLane();
  } else if (direction === "backward") {
    if (finalPositions.lane === 0) return;
    if (lanes[finalPositions.lane - 1].type === "forest" && lanes[finalPositions.lane - 1].occupiedPositions.has(finalPositions.column)) return;
    if (!stepStartTimestamp) startMoving = true;
  } else if (direction === "left") {
    if (finalPositions.column === 0) return;
    if (lanes[finalPositions.lane].type === "forest" && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column - 1)) return;
    if (!stepStartTimestamp) startMoving = true;
  } else if (direction === "right") {
    if (finalPositions.column === columns - 1) return;
    if (lanes[finalPositions.lane].type === "forest" && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column + 1)) return;
    if (!stepStartTimestamp) startMoving = true;
  }
  sounds.move();
  
  // Ad refresh logic
  if (_gameRecordTime) {
      const s = Math.round((Date.now() - _gameRecordTime) / 1000);
      if (s > (window.PMG_TICK_RATE || 60)) {
          if (typeof syncPMGLayout === 'function') syncPMGLayout();
          _gameRecordTime = Date.now();
      }
  }

  moves.push(direction);
}

// Removed discrete cell-based checkBalloonCollection

function animate(timestamp) {
  requestAnimationFrame(animate);

  const now = performance.now();
  const dt = (now - (lastFrameTime || now)) / 1000;
  lastFrameTime = now;

  // Animate Balloons bobbing slightly
  activeBalloons.forEach(b => {
      if(!b.dead) {
          b.timeAlive += dt;
          b.mesh.position.z = b.baseZ + Math.sin(b.timeAlive * 3) * 2; // subtle bob logic
          // Remove continuous rotation since we have sharp sprite text attached
          // The Sprite automatically faces the camera
      }
  });

  if (gameState === 'PLAY') {
      timeLeft -= dt;
      updateHUD();
      if(timeLeft <= 0 && score < targetScore) {
          gameOver("TIME");
      }
  }

  // Vehicles Animation
  const delta = dt * 1000;
  lanes.forEach((lane) => {
    if (lane.type === "car" || lane.type === "truck") {
      const aBitBeforeTheBeginingOfLane = (-boardWidth * zoom) / 2 - positionWidth * 2 * zoom;
      const aBitAfterTheEndOFLane = (boardWidth * zoom) / 2 + positionWidth * 2 * zoom;
      lane.vechicles.forEach((vechicle) => {
        if (lane.direction) {
          vechicle.position.x = vechicle.position.x < aBitBeforeTheBeginingOfLane
              ? aBitAfterTheEndOFLane
              : (vechicle.position.x -= (lane.speed / 16) * delta);
        } else {
          vechicle.position.x = vechicle.position.x > aBitAfterTheEndOFLane
              ? aBitBeforeTheBeginingOfLane
              : (vechicle.position.x += (lane.speed / 16) * delta);
        }
      });
    }
  });

  if (startMoving) {
    stepStartTimestamp = timestamp;
    startMoving = false;
  }

  if (stepStartTimestamp && gameState === 'PLAY') {
    const moveDeltaTime = timestamp - stepStartTimestamp;
    const moveDeltaDistance = Math.min(moveDeltaTime / stepTime, 1) * positionWidth * zoom;
    const jumpDeltaDistance = Math.sin(Math.min(moveDeltaTime / stepTime, 1) * Math.PI) * 12 * zoom;
    
    switch (moves[0]) {
      case "forward": {
        const positionY = currentLane * positionWidth * zoom + moveDeltaDistance;
        camera.position.y = initialCameraPositionY + positionY;
        dirLight.position.y = initialDirLightPositionY + positionY;
        chicken.position.y = positionY;
        chicken.position.z = jumpDeltaDistance;
        break;
      }
      case "backward": {
        const positionY = currentLane * positionWidth * zoom - moveDeltaDistance;
        camera.position.y = initialCameraPositionY + positionY;
        dirLight.position.y = initialDirLightPositionY + positionY;
        chicken.position.y = positionY;
        chicken.position.z = jumpDeltaDistance;
        break;
      }
      case "left": {
        const positionX = (currentColumn * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2 - moveDeltaDistance;
        camera.position.x = initialCameraPositionX + positionX;
        dirLight.position.x = initialDirLightPositionX + positionX;
        chicken.position.x = positionX;
        chicken.position.z = jumpDeltaDistance;
        break;
      }
      case "right": {
        const positionX = (currentColumn * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2 + moveDeltaDistance;
        camera.position.x = initialCameraPositionX + positionX;
        dirLight.position.x = initialDirLightPositionX + positionX;
        chicken.position.x = positionX;
        chicken.position.z = jumpDeltaDistance;
        break;
      }
    }
    
    if (moveDeltaTime > stepTime) {
      switch (moves[0]) {
        case "forward": currentLane++; break;
        case "backward": currentLane--; break;
        case "left": currentColumn--; break;
        case "right": currentColumn++; break;
      }
      
      // Remove the old discrete cell-based hit test
      moves.shift();
      stepStartTimestamp = moves.length === 0 ? null : timestamp;
    }
  }

  // Hit test with Balloons (Real-time proximity)
  if (gameState === 'PLAY') {
      activeBalloons.forEach(b => {
          if(!b.dead) {
              // Calculate 2D distance ignoring Z to allow mid-air collection
              const dx = chicken.position.x - b.mesh.position.x;
              const dy = chicken.position.y - b.mesh.position.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              
              // 15 * zoom is about half the lane width, perfect for "touching"
              if (dist < 18 * zoom) {
                  b.dead = true;
                  if (b.val > 0) sounds.popPositive();
                  else sounds.popNegative();
                  
                  createBurstParticles(b.mesh.position, b.colorStr, b.val);
                  scene.remove(b.mesh);
                  score += b.val;
                  updateHUD();
                  
                  if (score >= targetScore && timeLeft > 0) {
                      gameOver("WIN");
                  }
              }
          }
      });
  }

  // Hit test with cars
  if (gameState === 'PLAY' && lanes && lanes[currentLane]) {
      if (lanes[currentLane].type === "car" || lanes[currentLane].type === "truck") {
        const chickenMinX = chicken.position.x - (chickenSize * zoom) / 2;
        const chickenMaxX = chicken.position.x + (chickenSize * zoom) / 2;
        const vechicleLength = { car: 60, truck: 105 }[lanes[currentLane].type];
        lanes[currentLane].vechicles.forEach((vechicle) => {
          const carMinX = vechicle.position.x - (vechicleLength * zoom) / 2;
          const carMaxX = vechicle.position.x + (vechicleLength * zoom) / 2;
          if (chickenMaxX > carMinX && chickenMinX < carMaxX) {
            gameOver("SQUASHED");
          }
        });
      }
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// Window resize handling
window.addEventListener('resize', () => {
    const wrapper = document.getElementById('game-wrapper');
    CW = wrapper ? wrapper.clientWidth : window.innerWidth;
    CH = wrapper ? wrapper.clientHeight : window.innerHeight;
    camera.left = CW / -2;
    camera.right = CW / 2;
    camera.top = CH / 2;
    camera.bottom = CH / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(CW, CH);
});

initSupabase();

// Auto-start the game immediately
startGame();
