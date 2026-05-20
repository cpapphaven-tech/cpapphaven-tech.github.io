/* ================================================================
   Kids Balloon Pop - Game Engine
   PlayMixGames · 2026
   ================================================================ */

// ── LANGUAGE DATA ────────────────────────────────────────────────
const LANG_DATA = {
  en: {
    alphabet: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
    numbers:  ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'],
    colors:   ['Red','Orange','Yellow','Green','Blue','Purple','Pink','White'],
    shapes:   ['Circle','Square','Triangle','Star','Heart','Diamond','Oval','Pentagon'],
    modeNames:{ abc:'A – Z', numbers:'1 – 20', colors:'Colors', shapes:'Shapes' },
  },
  es: {
    alphabet: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','Ñ','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
    numbers:  ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'],
    colors:   ['Rojo','Naranja','Amarillo','Verde','Azul','Morado','Rosa','Blanco'],
    shapes:   ['Círculo','Cuadrado','Triángulo','Estrella','Corazón','Rombo','Óvalo','Pentágono'],
    modeNames:{ abc:'A – Z', numbers:'1 – 20', colors:'Colores', shapes:'Formas' },
  },
  fr: {
    alphabet: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
    numbers:  ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'],
    colors:   ['Rouge','Orange','Jaune','Vert','Bleu','Violet','Rose','Blanc'],
    shapes:   ['Cercle','Carré','Triangle','Étoile','Cœur','Losange','Ovale','Pentagone'],
    modeNames:{ abc:'A – Z', numbers:'1 – 20', colors:'Couleurs', shapes:'Formes' },
  },
  de: {
    alphabet: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
    numbers:  ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'],
    colors:   ['Rot','Orange','Gelb','Grün','Blau','Lila','Pink','Weiß'],
    shapes:   ['Kreis','Quadrat','Dreieck','Stern','Herz','Raute','Oval','Fünfeck'],
    modeNames:{ abc:'A – Z', numbers:'1 – 20', colors:'Farben', shapes:'Formen' },
  },
  ja: {
    alphabet: ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','は'],
    numbers:  ['１','２','３','４','５','६','૭','૮','૯','૧૦','૧૧','૧૨','૧૩','૧૪','૧૫','૧૬','૧၇','૧૮','૧૯','૨૦'],
    colors:   ['あか','だいだい','きいろ','みどり','あお','むらさき','ピンク','しろ'],
    shapes:   ['まる','しかく','さんかく','ほし','ハート','ひし形','だえん','ごかく'],
    modeNames:{ abc:'ひらがな', numbers:'すうじ', colors:'いろ', shapes:'かたち' },
  },
  hi: {
    alphabet: ['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ','क','ख','ग','घ','च','छ','ज','झ','ट','ठ','ड','ढ','त','थ','द','ध'],
    numbers:  ['१','२','३','४','५','६','७','८','९','१०','११','१२','१३','१४','१५','१६','१७','१८','१९','२०'],
    colors:   ['लाल','नारंगी','पीला','हरा','नीला','बैंगनी','गुलाबी','सफेद'],
    shapes:   ['गोला','वर्ग','त्रिकोण','तारा','दिल','हीरा','अंडाकार','पंचकोण'],
    modeNames:{ abc:'वर्णमाला', numbers:'गिनती', colors:'रंग', shapes:'आकार' },
  },
  ta: {
    alphabet: ['அ','ஆ','இ','ஈ','உ','ஊ','எ','ஏ','ஐ','ஒ','ஓ','ஔ','க','ங','ச','ஞ','ட','ண','த','ந','ப','ம','ய','ர','ல','வ'],
    numbers:  ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'],
    colors:   ['சிவப்பு','ஆரஞ்சு','மஞ்சள்','பச்சை','நீலம்','ஊதா','இளஞ்சிவப்பு','வெள்ளை'],
    shapes:   ['வட்டம்','சதுரம்','முக்கோணம்','நட்சத்திரம்','இதயம்','வைரம்','முட்டை','ஐங்கோணம்'],
    modeNames:{ abc:'நெடுங்கணக்கு', numbers:'எண்கள்', colors:'வண்ணங்கள்', shapes:'வடிவங்கள்' },
  },
  gu: {
    alphabet: ['અ','આ','ઇ','ઈ','ઉ','ઊ','એ','ઐ','ઓ','ઔ','ક','ખ','ગ','ઘ','ચ','છ','જ','ઝ','ટ','ઠ','ડ','ઢ','ત','થ','દ','ધ'],
    numbers:  ['૧','૨','૩','૪','૫','૬','૭','૮','૯','૧૦','૧૧','૧૨','૧૩','૧૪','૧૫','૧૬','૧૭','૧૮','૧૯','૨૦'],
    colors:   ['લાલ','કેસરી','પીળો','લીલો','વાદળી','જાંબલી','गुલાબી','સફેદ'],
    shapes:   ['ગોળ','ચોરસ','ત્રિકોણ','તારો','દિલ','હીરો','લંબગોળ','પંચકોણ'],
    modeNames:{ abc:'કક્કો', numbers:'એકડા', colors:'રંગો', shapes:'આકારો' },
  },
  te: {
    alphabet: ['అ','ఆ','ఇ','ఈ','ఉ','ఊ','ఋ','ఎ','ఏ','ఐ','ఒ','ఓ','ఔ','క','ఖ','గ','ఘ','చ','ఛ','జ','ఝ','ట','ఠ','డ','ఢ','త'],
    numbers:  ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'],
    colors:   ['ఎరుపు','నారింజ','పసుపు','ఆకుపచ్చ','నీలం','నేరేడు','గులాబీ','తెలుపు'],
    shapes:   ['వృత్తం','చతురస్రం','త్రిభుజం','నక్షత్రం','గుండె','వజ్రం','అండాకారం','పంటగాన్'],
    modeNames:{ abc:'అక్షరమాల', numbers:'అంకెలు', colors:'రంగులు', shapes:'ఆకారాలు' },
  },
  mr: {
    alphabet: ['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ','क','ख','ग','घ','च','छ','ज','झ','ट','ठ','ड','ढ','त','थ','द','ध'],
    numbers:  ['१','२','३','४','५','६','७','८','९','१०','११','१२','१३','१४','१५','१६','१७','१८','१९','२०'],
    colors:   ['लाल','नारंगी','पिवळा','हिरवा','निळा','जांभळा','गुलाबी','पांढरा'],
    shapes:   ['वर्तुळ','चौकोन','त्रिकोण','चांदणी','हार्ट','डायमंड','लंबवर्तुळ','पंचकोण'],
    modeNames:{ abc:'मराठी मुळाक्षरे', numbers:'संख्या', colors:'रंग', shapes:'आकार' },
  },
  kn: {
    alphabet: ['ಅ','ಆ','ಇ','ಈ','ಉ','ಊ','ಋ','ಎ','ಏ','ಐ','ಒ','ಓ','ಔ','ಕ','ಖ','ಗ','ಘ','ಚ','ಛ','ಜ','ಝ','ಟ','ಠ','ಡ','ಢ','ತ'],
    numbers:  ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'],
    colors:   ['ಕೆಂಪು','ಕಿತ್ತಳೆ','ಹಳದಿ','ಹಸಿರು','ನೀಲಿ','ನೇರಳೆ','ಗುಲಾಬಿ','ಬಿಳಿ'],
    shapes:   ['ವೃತ್ತ','ಚೌಕ','ತ್ರಿಕೋನ','ನಕ್ಷತ್ರ','ಹೃದಯ','ವಜ್ರ','ಅಂಡಾಕಾರ','ಪಂಚಕೋನ'],
    modeNames:{ abc:'ಅಕ್ಷರಮಾಲೆ', numbers:'ಸಂಖ್ಯೆಗಳು', colors:'ಬಣ್ಣಗಳು', shapes:'ಆಕಾರಗಳು' },
  },
  ml: {
    alphabet: ['അ','ആ','ഇ','ഈ','ഉ','ഊ','ഋ','എ','ഏ','ഐ','ഒ','ഓ','ഔ','ക','ഖ','ഗ','ഘ','ങ','ച','ഛ','ജ','ഝ','ഞ','ട','ഠ','ഡ'],
    numbers:  ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'],
    colors:   ['ചുവപ്പ്','ഓറഞ്ച്','മഞ്ഞ','പച്ച','നീല','വയലറ്റ്','പിങ്ക്','വെള്ള'],
    shapes:   ['വട്ടം','ചതുരം','മുക്കോണം','നക്ഷത്രം','ഹൃദയം','വൈരക്കല്ല്','അണ്ഡാകൃതി','പঞ্চഭുജം'],
    modeNames:{ abc:'അക്ഷരമാല', numbers:'അക്കങ്ങൾ', colors:'നിറങ്ങൾ', shapes:'രൂപങ്ങൾ' },
  },
};

const COLOR_MAP = {
  en: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#e91e8c','#ecf0f1'],
  es: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#e91e8c','#ecf0f1'],
  fr: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#e91e8c','#ecf0f1'],
  de: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#e91e8c','#ecf0f1'],
  ja: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#e91e8c','#ecf0f1'],
  hi: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#e91e8c','#ecf0f1'],
  ta: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#e91e8c','#ecf0f1'],
  gu: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#e91e8c','#ecf0f1'],
  te: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#e91e8c','#ecf0f1'],
  mr: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#e91e8c','#ecf0f1'],
  kn: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#e91e8c','#ecf0f1'],
  ml: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#e91e8c','#ecf0f1'],
};

const BALLOON_COLORS = [
  '#ff4d6d','#ff9a3c','#ffd166','#06d6a0','#4895ef','#b388ff','#f72585','#90e0ef',
  '#ff6b9d','#a8dadc','#52b788','#e76f51','#9ef01a','#48cae4','#f77f00','#d62828',
];

const SHAPE_DRAW = {
  Circle:   (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); },
  Square:   (ctx, x, y, r) => { ctx.fillRect(x-r, y-r, r*2, r*2); },
  Triangle: (ctx, x, y, r) => { ctx.beginPath(); ctx.moveTo(x, y-r); ctx.lineTo(x+r, y+r); ctx.lineTo(x-r, y+r); ctx.closePath(); ctx.fill(); },
  Star:     (ctx, x, y, r) => { drawStar(ctx, x, y, 5, r, r*0.45); },
  Heart:    (ctx, x, y, r) => { drawHeart(ctx, x, y, r); },
  Diamond:  (ctx, x, y, r) => { ctx.beginPath(); ctx.moveTo(x, y-r); ctx.lineTo(x+r*0.7, y); ctx.lineTo(x, y+r); ctx.lineTo(x-r*0.7, y); ctx.closePath(); ctx.fill(); },
  Oval:     (ctx, x, y, r) => { ctx.beginPath(); ctx.ellipse(x, y, r*0.65, r, 0, 0, Math.PI*2); ctx.fill(); },
  Pentagon: (ctx, x, y, r) => { drawPolygon(ctx, x, y, r, 5); },
};

function drawStar(ctx, cx, cy, pts, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < pts*2; i++) {
    const angle = (i * Math.PI / pts) - Math.PI/2;
    const rad = i % 2 === 0 ? outer : inner;
    i === 0 ? ctx.moveTo(cx + rad*Math.cos(angle), cy + rad*Math.sin(angle))
            : ctx.lineTo(cx + rad*Math.cos(angle), cy + rad*Math.sin(angle));
  }
  ctx.closePath(); ctx.fill();
}

function drawHeart(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r*0.3);
  ctx.bezierCurveTo(cx - r*1.1, cy - r*0.5, cx - r*1.1, cy - r*1.1, cx, cy - r*0.4);
  ctx.bezierCurveTo(cx + r*1.1, cy - r*1.1, cx + r*1.1, cy - r*0.5, cx, cy + r*0.3);
  ctx.closePath(); ctx.fill();
}

function drawPolygon(ctx, cx, cy, r, sides) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI / sides) - Math.PI/2;
    i === 0 ? ctx.moveTo(cx + r*Math.cos(angle), cy + r*Math.sin(angle))
            : ctx.lineTo(cx + r*Math.cos(angle), cy + r*Math.sin(angle));
  }
  ctx.closePath(); ctx.fill();
}

// ── STATE ────────────────────────────────────────────────────────
let lang     = 'en';
let mode     = 'abc';
let score    = 0;
let running  = false;
let soundOn  = true;
let balloons = [];
let spawnTimer = 0;
let seqIndex = 0;
let animId   = null;
let lastTime = 0;

// ── DOM REFS ─────────────────────────────────────────────────────
const canvas     = document.getElementById('game-canvas');
const ctx        = canvas.getContext('2d');
const canvasWrap = document.getElementById('canvas-wrap');
const hudScore   = document.getElementById('hud-score');
const hudMode    = document.getElementById('hud-mode');
const startOverlay   = document.getElementById('start-overlay');
const gameoverOverlay= document.getElementById('gameover-overlay');
const langModal      = document.getElementById('lang-modal');

// ── AUDIO (Web Audio API - no files needed) ──────────────────────
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playPop() {
  if (!soundOn) return;
  try {
    const ac = getAudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 + Math.random()*400, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.18);
    gain.gain.setValueAtTime(0.35, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
    osc.start(); osc.stop(ac.currentTime + 0.2);
  } catch(e) {}
}

function playCelebrate() {
  if (!soundOn) return;
  try {
    const ac = getAudioCtx();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = 'triangle';
      const t = ac.currentTime + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t); osc.stop(t + 0.25);
    });
  } catch(e) {}
}

// ── CANVAS SIZING ────────────────────────────────────────────────
function resizeCanvas() {
  const w = canvasWrap.clientWidth;
  const h = Math.max(window.innerHeight - 220, 300);
  canvasWrap.style.height = h + 'px';
  canvas.width  = w;
  canvas.height = h;
}

// ── BALLOON FACTORY ──────────────────────────────────────────────
function getLabel() {
  const d = LANG_DATA[lang];
  if (mode === 'abc')     return d.alphabet[seqIndex % d.alphabet.length];
  if (mode === 'numbers') return d.numbers[seqIndex % d.numbers.length];
  if (mode === 'colors')  return d.colors[seqIndex % d.colors.length];
  if (mode === 'shapes')  return d.shapes[seqIndex % d.shapes.length];
  return '';
}

function getLabelColor() {
  if (mode === 'colors') return COLOR_MAP[lang][seqIndex % COLOR_MAP[lang].length];
  return BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
}

function spawnBalloon() {
  const r = 34 + Math.random() * 22;
  const x = r + Math.random() * (canvas.width - r * 2);
  const speed = 55 + Math.random() * 55;
  const color = getLabelColor();
  const label = getLabel();
  const shapeKeys = Object.keys(SHAPE_DRAW);
  const shapeType = mode === 'shapes'
    ? LANG_DATA['en'].shapes[seqIndex % shapeKeys.length]
    : null;

  balloons.push({
    x, y: canvas.height + r + 10,
    r, speed, color, label, shapeType,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 1.2 + Math.random() * 1.5,
    alpha: 1,
    popping: false,
    popTime: 0,
  });
  seqIndex++;
}

// ── DRAW BALLOON ─────────────────────────────────────────────────
function drawBalloon(b) {
  ctx.save();
  ctx.globalAlpha = b.alpha;
  const wx = Math.sin(b.wobble) * 6;

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;

  if (b.shapeType && SHAPE_DRAW[b.shapeType]) {
    ctx.fillStyle = b.color;
    SHAPE_DRAW[b.shapeType](ctx, b.x + wx, b.y, b.r);
  } else {
    // Balloon body
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.ellipse(b.x + wx, b.y, b.r * 0.82, b.r, 0, 0, Math.PI * 2);
    ctx.fill();

    // Balloon tip
    ctx.beginPath();
    ctx.moveTo(b.x + wx - 4, b.y + b.r);
    ctx.lineTo(b.x + wx,     b.y + b.r + 8);
    ctx.lineTo(b.x + wx + 4, b.y + b.r);
    ctx.closePath();
    ctx.fill();

    // String
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.x + wx, b.y + b.r + 8);
    ctx.lineTo(b.x + wx, b.y + b.r + 38);
    ctx.stroke();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(b.x + wx - b.r * 0.28, b.y - b.r * 0.28, b.r * 0.22, b.r * 0.14, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowColor = 'transparent';

  // Label text
  if (b.label) {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fs = b.r > 44 ? 1.1 : (b.r > 36 ? 0.95 : 0.82);
    const labelLen = b.label.length;
    const fontSize = labelLen > 4 ? Math.floor(b.r * fs * 0.65) : Math.floor(b.r * fs);
    ctx.font = `900 ${fontSize}px 'Nunito', sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.fillText(b.label, b.x + wx, b.y - b.r * 0.08);
    ctx.shadowColor = 'transparent';
  }

  ctx.restore();
}

// ── POP VISUAL EFFECT ────────────────────────────────────────────
function showPopEffect(x, y, color, label) {
  // CSS burst overlay
  const burst = document.createElement('div');
  burst.className = 'pop-burst';
  burst.style.left = x + 'px';
  burst.style.top  = y + 'px';
  burst.style.background = color;
  canvasWrap.appendChild(burst);
  setTimeout(() => burst.remove(), 500);

  // Text
  if (label) {
    const txt = document.createElement('div');
    txt.className = 'pop-text';
    txt.style.left = x + 'px';
    txt.style.top  = y + 'px';
    txt.textContent = label;
    canvasWrap.appendChild(txt);
    setTimeout(() => txt.remove(), 900);
  }
}

// ── HIT TEST ─────────────────────────────────────────────────────
function hitBalloon(px, py) {
  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    if (b.popping) continue;
    const wx = Math.sin(b.wobble) * 6;
    const dx = px - (b.x + wx);
    const dy = py - b.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < b.r * 1.1) {
      b.popping = true;
      score++;
      hudScore.textContent = score;
      playPop();
      showPopEffect(b.x + wx, b.y, b.color, b.label);
      if (score > 0 && score % 10 === 0) playCelebrate();
      balloons.splice(i, 1);
      return true;
    }
  }
  return false;
}

// ── GAME LOOP ────────────────────────────────────────────────────
const SPAWN_INTERVAL = 1600; // ms between spawns

function gameLoop(ts) {
  if (!running) return;
  const dt = Math.min((ts - lastTime) / 1000, 0.1);
  lastTime = ts;

  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#87ceeb');
  grad.addColorStop(1, '#e0f7ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Spawn
  spawnTimer += dt * 1000;
  if (spawnTimer >= SPAWN_INTERVAL) {
    spawnTimer = 0;
    spawnBalloon();
    if (Math.random() < 0.3) spawnBalloon(); // occasional double
  }

  // Update & draw balloons
  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    b.y -= b.speed * dt;
    b.wobble += b.wobbleSpeed * dt;
    if (b.y + b.r < -20) { balloons.splice(i, 1); continue; }
    drawBalloon(b);
  }

  animId = requestAnimationFrame(gameLoop);
}

// ── START / STOP ─────────────────────────────────────────────────
function startGame() {
  balloons  = [];
  score     = 0;
  seqIndex  = 0;
  spawnTimer= SPAWN_INTERVAL * 0.8; // spawn first balloon quickly
  hudScore.textContent = '0';
  updateHudMode();
  startOverlay.classList.add('hidden');
  gameoverOverlay.classList.add('hidden');
  running = true;
  lastTime = performance.now();
  animId = requestAnimationFrame(gameLoop);
}

function endGame() {
  running = false;
  cancelAnimationFrame(animId);
  document.getElementById('go-count').textContent = score;
  const title = score >= 20 ? '🌟 Amazing!' : score >= 10 ? '😊 Great Job!' : '🎈 Keep Going!';
  document.getElementById('go-title').textContent = title;
  const stars = score >= 20 ? '⭐⭐⭐' : score >= 10 ? '⭐⭐' : '⭐';
  document.getElementById('go-stars').textContent = stars;
  gameoverOverlay.classList.remove('hidden');
  playCelebrate();
}

function updateHudMode() {
  hudMode.textContent = LANG_DATA[lang].modeNames[mode] || mode;
}

// ── EVENT LISTENERS ───────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

document.getElementById('sound-btn').addEventListener('click', () => {
  soundOn = !soundOn;
  document.getElementById('sound-btn').textContent = soundOn ? '🔊' : '🔇';
});

document.getElementById('lang-btn').addEventListener('click', () => {
  langModal.classList.remove('hidden');
});

document.getElementById('lang-close').addEventListener('click', () => {
  langModal.classList.add('hidden');
  if (running) { balloons = []; seqIndex = 0; }
  updateHudMode();
  updateStartDesc();
});

document.querySelectorAll('.lang-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    lang = btn.dataset.lang;
  });
});

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;
    seqIndex = 0;
    balloons = [];
    updateHudMode();
    if (!running) return;
  });
});

// Canvas tap/click
function onCanvasInteract(e) {
  e.preventDefault();
  if (!running) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  let cx, cy;
  if (e.touches) {
    cx = (e.touches[0].clientX - rect.left) * scaleX;
    cy = (e.touches[0].clientY - rect.top)  * scaleY;
  } else {
    cx = (e.clientX - rect.left) * scaleX;
    cy = (e.clientY - rect.top)  * scaleY;
  }
  hitBalloon(cx, cy);
}

canvas.addEventListener('click',      onCanvasInteract);
canvas.addEventListener('touchstart', onCanvasInteract, { passive: false });

// ── START DESC (localised) ────────────────────────────────────────
const START_DESCS = {
  en: 'Pop colorful balloons and learn your ABCs, numbers, colors & shapes! Perfect for little learners aged 2–5. 🌟',
  es: '¡Revienta globos de colores y aprende el abecedario, números, colores y formas! Perfecto para niños de 2 a 5 años. 🌟',
  fr: 'Éclate des ballons colorés et apprends l\'alphabet, les chiffres, les couleurs et les formes ! Pour les enfants de 2 à 5 ans. 🌟',
  de: 'Platze bunte Luftballons und lerne das Alphabet, Zahlen, Farben und Formen! Perfekt für Kinder von 2–5 Jahren. 🌟',
  ja: 'カラフルな風船をポップして、ひらがな・すうじ・いろ・かたちを楽しく学ぼう！2〜5歳向け知育ゲーム。🌟',
  hi: 'रंगीन गुब्बारे फोड़ें और अपनी वर्णमाला, गिनती, रंग और आकार सीखें! 2-5 साल के बच्चों के लिए बिल्कुल सही। 🌟',
  ta: 'வண்ணமயமான பலൂன்களை உடைத்து நெடுங்கணக்கு, எண்கள், வண்ணங்கள் மற்றும் வடிவങ്ങളെ கற்றுக்கொள்ளுங்கள்! 2-5 வயதுடைய குழந்தைகளுக்கு ஏற்றது. 🌟',
  gu: 'રંગીન ફુગ્ગા ફોડો અને કક્કો, એકડા, રંગો અને આકારો શીખો! 2-5 વર્ષના બાળકો માટે શ્રેષ્ઠ. 🌟',
  te: 'రంగురంగుల బెలూన్లను పగలగొట్టండి మరియు అక్షరమాల, అంకెలు, రంగులు & ఆకారాలను నేర్చుకోండి! 2-5 సంవత్సరాల పిల్లలకు అనువైనది. 🌟',
  mr: 'रंगीबेरंगी फुगे फोडा आणि मराठी मुळाक्षरे, संख्या, रंग आणि आकार शिका! २ ते ५ वर्षांच्या मुलांसाठी उत्तम. 🌟',
  kn: 'ಬಣ್ಣ ಬಣ್ಣದ ಬಲೂನ್‌ಗಳನ್ನು ಒಡೆದು ಅಕ್ಷರಮಾಲೆ, ಸಂಖ್ಯೆಗಳು, ಬಣ್ಣಗಳು ಮತ್ತು ಆಕಾರಗಳನ್ನು কಲಿಯಿರಿ! ೨-೫ ವರ್ಷದ ಮಕ್ಕಳಿಗೆ ಸೂಕ್ತ. 🌟',
  ml: 'വർണ്ണാഭമായ ബലൂണുകൾ പൊട്ടിച്ച് അക്ഷരമാല, അക്കങ്ങൾ, നിറങ്ങൾ, രൂപങ്ങൾ എന്നിവ പഠിക്കൂ! 2-5 വയസ്സുള്ള കുട്ടികൾക്കായി. 🌟',
};

function updateStartDesc() {
  document.getElementById('start-desc').textContent = START_DESCS[lang] || START_DESCS.en;
}

// ── INIT ──────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  resizeCanvas();
  if (!running) {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#87ceeb');
    grad.addColorStop(1, '#e0f7ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
});

resizeCanvas();
updateHudMode();
updateStartDesc();

// Draw idle sky on start
(function drawIdleSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#87ceeb');
  grad.addColorStop(1, '#e0f7ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw a few decorative balloons
  const deco = [
    { x: canvas.width*0.2, y: canvas.height*0.4, r: 38, color: '#ff6b9d', label: '🎈' },
    { x: canvas.width*0.5, y: canvas.height*0.55, r: 44, color: '#4895ef', label: '🎈' },
    { x: canvas.width*0.78, y: canvas.height*0.35, r: 34, color: '#06d6a0', label: '🎈' },
  ];
  deco.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.r*0.82, b.r, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
})();
