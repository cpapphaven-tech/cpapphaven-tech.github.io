'use strict';

// ─── Question Bank ───────────────────────────────────────────
// Each question: food name, emoji, category, correct nutrition, 3 wrong options
// Nutrients shown: carbs (g), protein (g), fat (g), calories (kcal) per 100g
const QUESTIONS = [
  // FRUITS
  { food:'Banana (100g)', emoji:'🍌', cat:'Fruits 🍓',
    correct:{ label:'23g Carbs · 1g Protein · 0.3g Fat · 89 kcal', key:'C' },
    wrong:['5g Carbs · 0g Protein · 0g Fat · 25 kcal','50g Carbs · 5g Protein · 2g Fat · 220 kcal','12g Carbs · 3g Protein · 8g Fat · 140 kcal']
  },
  { food:'Apple (100g)', emoji:'🍎', cat:'Fruits 🍓',
    correct:{ label:'14g Carbs · 0.3g Protein · 0.2g Fat · 52 kcal', key:'C' },
    wrong:['30g Carbs · 1g Protein · 0g Fat · 110 kcal','8g Carbs · 2g Protein · 1g Fat · 45 kcal','20g Carbs · 0g Protein · 5g Fat · 120 kcal']
  },
  { food:'Orange (100g)', emoji:'🍊', cat:'Fruits 🍓',
    correct:{ label:'12g Carbs · 0.9g Protein · 0.1g Fat · 47 kcal', key:'C' },
    wrong:['25g Carbs · 2g Protein · 1g Fat · 100 kcal','5g Carbs · 0g Protein · 3g Fat · 60 kcal','18g Carbs · 3g Protein · 0g Fat · 80 kcal']
  },
  { food:'Mango (100g)', emoji:'🥭', cat:'Fruits 🍓',
    correct:{ label:'15g Carbs · 0.8g Protein · 0.4g Fat · 60 kcal', key:'C' },
    wrong:['5g Carbs · 3g Protein · 0g Fat · 30 kcal','30g Carbs · 1g Protein · 2g Fat · 130 kcal','20g Carbs · 5g Protein · 5g Fat · 180 kcal']
  },
  { food:'Grapes (100g)', emoji:'🍇', cat:'Fruits 🍓',
    correct:{ label:'18g Carbs · 0.6g Protein · 0.2g Fat · 69 kcal', key:'C' },
    wrong:['5g Carbs · 2g Protein · 0g Fat · 30 kcal','35g Carbs · 1g Protein · 0g Fat · 140 kcal','10g Carbs · 5g Protein · 3g Fat · 95 kcal']
  },
  { food:'Watermelon (100g)', emoji:'🍉', cat:'Fruits 🍓',
    correct:{ label:'8g Carbs · 0.6g Protein · 0.2g Fat · 30 kcal', key:'C' },
    wrong:['20g Carbs · 1g Protein · 0g Fat · 80 kcal','3g Carbs · 0g Protein · 1g Fat · 18 kcal','15g Carbs · 3g Protein · 2g Fat · 90 kcal']
  },
  { food:'Strawberry (100g)', emoji:'🍓', cat:'Fruits 🍓',
    correct:{ label:'8g Carbs · 0.7g Protein · 0.3g Fat · 33 kcal', key:'C' },
    wrong:['20g Carbs · 2g Protein · 1g Fat · 90 kcal','2g Carbs · 0g Protein · 0g Fat · 15 kcal','14g Carbs · 4g Protein · 5g Fat · 120 kcal']
  },
  { food:'Pineapple (100g)', emoji:'🍍', cat:'Fruits 🍓',
    correct:{ label:'13g Carbs · 0.5g Protein · 0.1g Fat · 50 kcal', key:'C' },
    wrong:['25g Carbs · 2g Protein · 0g Fat · 100 kcal','5g Carbs · 1g Protein · 3g Fat · 55 kcal','18g Carbs · 3g Protein · 2g Fat · 100 kcal']
  },
  { food:'Avocado (100g)', emoji:'🥑', cat:'Fruits 🍓',
    correct:{ label:'9g Carbs · 2g Protein · 15g Fat · 160 kcal', key:'C' },
    wrong:['20g Carbs · 1g Protein · 2g Fat · 100 kcal','5g Carbs · 5g Protein · 30g Fat · 320 kcal','2g Carbs · 0g Protein · 1g Fat · 25 kcal']
  },
  { food:'Lemon (100g)', emoji:'🍋', cat:'Fruits 🍓',
    correct:{ label:'9g Carbs · 1.1g Protein · 0.3g Fat · 29 kcal', key:'C' },
    wrong:['20g Carbs · 0g Protein · 0g Fat · 70 kcal','3g Carbs · 3g Protein · 5g Fat · 70 kcal','15g Carbs · 2g Protein · 1g Fat · 70 kcal']
  },
  // VEGETABLES
  { food:'Broccoli (100g)', emoji:'🥦', cat:'Vegetables 🥬',
    correct:{ label:'7g Carbs · 2.8g Protein · 0.4g Fat · 34 kcal', key:'C' },
    wrong:['20g Carbs · 1g Protein · 0g Fat · 85 kcal','3g Carbs · 8g Protein · 5g Fat · 90 kcal','15g Carbs · 5g Protein · 2g Fat · 130 kcal']
  },
  { food:'Carrot (100g)', emoji:'🥕', cat:'Vegetables 🥬',
    correct:{ label:'10g Carbs · 0.9g Protein · 0.2g Fat · 41 kcal', key:'C' },
    wrong:['25g Carbs · 3g Protein · 1g Fat · 120 kcal','3g Carbs · 0g Protein · 0g Fat · 15 kcal','18g Carbs · 5g Protein · 3g Fat · 115 kcal']
  },
  { food:'Spinach (100g)', emoji:'🌿', cat:'Vegetables 🥬',
    correct:{ label:'3.6g Carbs · 2.9g Protein · 0.4g Fat · 23 kcal', key:'C' },
    wrong:['15g Carbs · 1g Protein · 0g Fat · 65 kcal','8g Carbs · 8g Protein · 3g Fat · 90 kcal','1g Carbs · 0g Protein · 0g Fat · 5 kcal']
  },
  { food:'Tomato (100g)', emoji:'🍅', cat:'Vegetables 🥬',
    correct:{ label:'4g Carbs · 0.9g Protein · 0.2g Fat · 18 kcal', key:'C' },
    wrong:['12g Carbs · 2g Protein · 1g Fat · 65 kcal','1g Carbs · 0g Protein · 0g Fat · 8 kcal','20g Carbs · 5g Protein · 3g Fat · 130 kcal']
  },
  { food:'Potato (100g)', emoji:'🥔', cat:'Vegetables 🥬',
    correct:{ label:'17g Carbs · 2g Protein · 0.1g Fat · 77 kcal', key:'C' },
    wrong:['5g Carbs · 5g Protein · 8g Fat · 110 kcal','30g Carbs · 4g Protein · 2g Fat · 155 kcal','8g Carbs · 1g Protein · 0g Fat · 38 kcal']
  },
  { food:'Cucumber (100g)', emoji:'🥒', cat:'Vegetables 🥬',
    correct:{ label:'3.6g Carbs · 0.7g Protein · 0.1g Fat · 16 kcal', key:'C' },
    wrong:['12g Carbs · 2g Protein · 1g Fat · 60 kcal','8g Carbs · 0g Protein · 3g Fat · 60 kcal','20g Carbs · 5g Protein · 0g Fat · 100 kcal']
  },
  { food:'Onion (100g)', emoji:'🧅', cat:'Vegetables 🥬',
    correct:{ label:'9g Carbs · 1.1g Protein · 0.1g Fat · 40 kcal', key:'C' },
    wrong:['20g Carbs · 3g Protein · 2g Fat · 110 kcal','3g Carbs · 0g Protein · 0g Fat · 15 kcal','15g Carbs · 5g Protein · 5g Fat · 130 kcal']
  },
  { food:'Garlic (100g)', emoji:'🧄', cat:'Vegetables 🥬',
    correct:{ label:'33g Carbs · 6.4g Protein · 0.5g Fat · 149 kcal', key:'C' },
    wrong:['10g Carbs · 1g Protein · 0g Fat · 45 kcal','50g Carbs · 10g Protein · 5g Fat · 280 kcal','5g Carbs · 2g Protein · 8g Fat · 100 kcal']
  },
  { food:'Bell Pepper (100g)', emoji:'🫑', cat:'Vegetables 🥬',
    correct:{ label:'6g Carbs · 1g Protein · 0.3g Fat · 31 kcal', key:'C' },
    wrong:['15g Carbs · 3g Protein · 2g Fat · 90 kcal','2g Carbs · 0g Protein · 0g Fat · 10 kcal','20g Carbs · 5g Protein · 1g Fat · 105 kcal']
  },
  { food:'Sweet Potato (100g)', emoji:'🍠', cat:'Vegetables 🥬',
    correct:{ label:'20g Carbs · 1.6g Protein · 0.1g Fat · 86 kcal', key:'C' },
    wrong:['8g Carbs · 4g Protein · 5g Fat · 95 kcal','35g Carbs · 3g Protein · 1g Fat · 160 kcal','5g Carbs · 0g Protein · 0g Fat · 22 kcal']
  },
  // GRAINS & LEGUMES
  { food:'White Rice (100g)', emoji:'🍚', cat:'Grains 🌾',
    correct:{ label:'28g Carbs · 2.7g Protein · 0.3g Fat · 130 kcal', key:'C' },
    wrong:['50g Carbs · 5g Protein · 2g Fat · 230 kcal','10g Carbs · 8g Protein · 3g Fat · 100 kcal','40g Carbs · 1g Protein · 8g Fat · 230 kcal']
  },
  { food:'Whole Wheat Bread (100g)', emoji:'🍞', cat:'Grains 🌾',
    correct:{ label:'43g Carbs · 9g Protein · 3.4g Fat · 247 kcal', key:'C' },
    wrong:['20g Carbs · 3g Protein · 1g Fat · 110 kcal','60g Carbs · 15g Protein · 8g Fat · 370 kcal','30g Carbs · 5g Protein · 15g Fat · 280 kcal']
  },
  { food:'Oats (100g)', emoji:'🌾', cat:'Grains 🌾',
    correct:{ label:'67g Carbs · 17g Protein · 7g Fat · 389 kcal', key:'C' },
    wrong:['30g Carbs · 5g Protein · 1g Fat · 150 kcal','80g Carbs · 10g Protein · 15g Fat · 460 kcal','20g Carbs · 3g Protein · 2g Fat · 110 kcal']
  },
  { food:'Lentils (100g, cooked)', emoji:'🫘', cat:'Grains 🌾',
    correct:{ label:'20g Carbs · 9g Protein · 0.4g Fat · 116 kcal', key:'C' },
    wrong:['5g Carbs · 3g Protein · 5g Fat · 80 kcal','40g Carbs · 15g Protein · 3g Fat · 245 kcal','10g Carbs · 1g Protein · 8g Fat · 120 kcal']
  },
  { food:'Chickpeas (100g, cooked)', emoji:'🫘', cat:'Grains 🌾',
    correct:{ label:'27g Carbs · 9g Protein · 2.6g Fat · 164 kcal', key:'C' },
    wrong:['10g Carbs · 3g Protein · 0g Fat · 55 kcal','50g Carbs · 20g Protein · 8g Fat · 350 kcal','15g Carbs · 5g Protein · 10g Fat · 180 kcal']
  },
  // PROTEINS
  { food:'Chicken Breast (100g)', emoji:'🍗', cat:'Proteins 🥩',
    correct:{ label:'0g Carbs · 31g Protein · 3.6g Fat · 165 kcal', key:'C' },
    wrong:['10g Carbs · 15g Protein · 10g Fat · 200 kcal','0g Carbs · 10g Protein · 20g Fat · 220 kcal','5g Carbs · 50g Protein · 1g Fat · 230 kcal']
  },
  { food:'Egg (100g / ~2 eggs)', emoji:'🥚', cat:'Proteins 🥩',
    correct:{ label:'1.1g Carbs · 13g Protein · 10g Fat · 143 kcal', key:'C' },
    wrong:['10g Carbs · 6g Protein · 2g Fat · 80 kcal','0g Carbs · 25g Protein · 20g Fat · 280 kcal','5g Carbs · 8g Protein · 30g Fat · 325 kcal']
  },
  { food:'Salmon (100g)', emoji:'🐟', cat:'Proteins 🥩',
    correct:{ label:'0g Carbs · 20g Protein · 13g Fat · 208 kcal', key:'C' },
    wrong:['5g Carbs · 10g Protein · 5g Fat · 105 kcal','0g Carbs · 30g Protein · 30g Fat · 390 kcal','10g Carbs · 15g Protein · 2g Fat · 120 kcal']
  },
  { food:'Almonds (100g)', emoji:'🌰', cat:'Proteins 🥩',
    correct:{ label:'22g Carbs · 21g Protein · 50g Fat · 579 kcal', key:'C' },
    wrong:['5g Carbs · 5g Protein · 10g Fat · 130 kcal','50g Carbs · 10g Protein · 20g Fat · 400 kcal','10g Carbs · 30g Protein · 5g Fat · 210 kcal']
  },
  { food:'Full Fat Milk (100ml)', emoji:'🥛', cat:'Proteins 🥩',
    correct:{ label:'5g Carbs · 3.4g Protein · 3.7g Fat · 61 kcal', key:'C' },
    wrong:['15g Carbs · 8g Protein · 10g Fat · 180 kcal','1g Carbs · 1g Protein · 0g Fat · 12 kcal','10g Carbs · 5g Protein · 8g Fat · 130 kcal']
  },
  { food:'Greek Yogurt (100g)', emoji:'🫙', cat:'Proteins 🥩',
    correct:{ label:'4g Carbs · 10g Protein · 0.7g Fat · 59 kcal', key:'C' },
    wrong:['15g Carbs · 3g Protein · 5g Fat · 120 kcal','1g Carbs · 20g Protein · 3g Fat · 110 kcal','25g Carbs · 8g Protein · 10g Fat · 220 kcal']
  },
  { food:'Paneer (100g)', emoji:'🧀', cat:'Proteins 🥩',
    correct:{ label:'3g Carbs · 18g Protein · 20g Fat · 265 kcal', key:'C' },
    wrong:['10g Carbs · 8g Protein · 5g Fat · 120 kcal','1g Carbs · 30g Protein · 40g Fat · 480 kcal','20g Carbs · 5g Protein · 2g Fat · 120 kcal']
  },
  { food:'Tofu (100g)', emoji:'🫙', cat:'Proteins 🥩',
    correct:{ label:'2g Carbs · 8g Protein · 4.8g Fat · 76 kcal', key:'C' },
    wrong:['15g Carbs · 3g Protein · 1g Fat · 80 kcal','0g Carbs · 20g Protein · 15g Fat · 215 kcal','10g Carbs · 5g Protein · 10g Fat · 150 kcal']
  },
  { food:'Walnuts (100g)', emoji:'🥜', cat:'Proteins 🥩',
    correct:{ label:'14g Carbs · 15g Protein · 65g Fat · 654 kcal', key:'C' },
    wrong:['30g Carbs · 10g Protein · 20g Fat · 350 kcal','5g Carbs · 5g Protein · 40g Fat · 400 kcal','25g Carbs · 25g Protein · 10g Fat · 280 kcal']
  },
  { food:'Blueberries (100g)', emoji:'🫐', cat:'Fruits 🍓',
    correct:{ label:'14g Carbs · 0.7g Protein · 0.3g Fat · 57 kcal', key:'C' },
    wrong:['5g Carbs · 2g Protein · 0g Fat · 30 kcal','30g Carbs · 1g Protein · 1g Fat · 130 kcal','10g Carbs · 5g Protein · 3g Fat · 90 kcal']
  },
  { food:'Cauliflower (100g)', emoji:'🥦', cat:'Vegetables 🥬',
    correct:{ label:'5g Carbs · 1.9g Protein · 0.3g Fat · 25 kcal', key:'C' },
    wrong:['15g Carbs · 5g Protein · 2g Fat · 100 kcal','2g Carbs · 0g Protein · 0g Fat · 10 kcal','12g Carbs · 8g Protein · 5g Fat · 120 kcal']
  },
  { food:'Quinoa (100g, cooked)', emoji:'🥣', cat:'Grains 🌾',
    correct:{ label:'21g Carbs · 4.4g Protein · 1.9g Fat · 120 kcal', key:'C' },
    wrong:['40g Carbs · 10g Protein · 5g Fat · 240 kcal','10g Carbs · 2g Protein · 1g Fat · 60 kcal','50g Carbs · 1g Protein · 8g Fat · 280 kcal']
  },
  { food:'Peanut Butter (100g)', emoji:'🥜', cat:'Proteins 🥩',
    correct:{ label:'20g Carbs · 25g Protein · 50g Fat · 588 kcal', key:'C' },
    wrong:['10g Carbs · 10g Protein · 20g Fat · 260 kcal','40g Carbs · 15g Protein · 10g Fat · 310 kcal','5g Carbs · 5g Protein · 5g Fat · 85 kcal']
  },
  { food:'Brown Rice (100g, cooked)', emoji:'🍚', cat:'Grains 🌾',
    correct:{ label:'23g Carbs · 2.6g Protein · 0.9g Fat · 112 kcal', key:'C' },
    wrong:['40g Carbs · 5g Protein · 3g Fat · 210 kcal','10g Carbs · 1g Protein · 0g Fat · 45 kcal','15g Carbs · 8g Protein · 5g Fat · 140 kcal']
  },
  { food:'Kidney Beans (100g, cooked)', emoji:'🫘', cat:'Grains 🌾',
    correct:{ label:'23g Carbs · 8.7g Protein · 0.5g Fat · 127 kcal', key:'C' },
    wrong:['10g Carbs · 3g Protein · 5g Fat · 100 kcal','45g Carbs · 15g Protein · 2g Fat · 260 kcal','5g Carbs · 2g Protein · 0g Fat · 30 kcal']
  },
  { food:'Mozzarella (100g)', emoji:'🧀', cat:'Proteins 🥩',
    correct:{ label:'3.1g Carbs · 28g Protein · 17g Fat · 280 kcal', key:'C' },
    wrong:['10g Carbs · 15g Protein · 10g Fat · 190 kcal','1g Carbs · 10g Protein · 40g Fat · 400 kcal','20g Carbs · 5g Protein · 5g Fat · 145 kcal']
  },
  { food:'Tuna (100g, in water)', emoji:'🐟', cat:'Proteins 🥩',
    correct:{ label:'0g Carbs · 26g Protein · 1.3g Fat · 116 kcal', key:'C' },
    wrong:['5g Carbs · 15g Protein · 10g Fat · 170 kcal','0g Carbs · 10g Protein · 20g Fat · 220 kcal','10g Carbs · 5g Protein · 5g Fat · 110 kcal']
  },
  { food:'Pumpkin Seeds (100g)', emoji:'🎃', cat:'Proteins 🥩',
    correct:{ label:'11g Carbs · 30g Protein · 49g Fat · 559 kcal', key:'C' },
    wrong:['30g Carbs · 10g Protein · 20g Fat · 340 kcal','5g Carbs · 5g Protein · 10g Fat · 130 kcal','50g Carbs · 20g Protein · 5g Fat · 325 kcal']
  },
  { food:'Dark Chocolate (100g)', emoji:'🍫', cat:'Snacks 🍫',
    correct:{ label:'46g Carbs · 8g Protein · 43g Fat · 598 kcal', key:'C' },
    wrong:['80g Carbs · 2g Protein · 10g Fat · 420 kcal','20g Carbs · 5g Protein · 60g Fat · 640 kcal','10g Carbs · 1g Protein · 0g Fat · 45 kcal']
  },
  { food:'Honey (100g)', emoji:'🍯', cat:'Snacks 🍫',
    correct:{ label:'82g Carbs · 0.3g Protein · 0g Fat · 304 kcal', key:'C' },
    wrong:['50g Carbs · 5g Protein · 2g Fat · 240 kcal','100g Carbs · 0g Protein · 0g Fat · 400 kcal','30g Carbs · 2g Protein · 5g Fat · 170 kcal']
  },
];

// ─── Game State ───────────────────────────────────────────────
const TIMER_MAX   = 30;
const CORRECT_PTS = 100;
const CIRCUMFERENCE = 276.5;

let queue     = [];
let qIdx      = 0;
let level     = 1;
let score     = 0;
let answered  = 0;
let correct   = 0;
let timerVal  = TIMER_MAX;
let timerID   = null;
let bestScore = parseInt(localStorage.getItem('nq_best') || '0');
let ll5050    = true;
let llSkip    = true;
let llDouble  = true;
let doubleOn  = false;
let gameActive= false;

// ─── DOM ─────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const scoreValEl = $('score-val');
const levelDisp  = $('level-display');
const topicBadge = $('topic-badge');
const foodDisp   = $('food-display');
const qNumber    = $('q-number');
const qText      = $('question-text');
const timerText  = $('timer-text');
const timerArc   = $('timer-arc');
const optBtns    = ['A','B','C','D'].map(l => $('opt-'+l));
const optTexts   = ['A','B','C','D'].map(l => $('opt-'+l+'-text'));
const startScreen= $('start-screen');
const goScreen   = $('game-over-screen');

// ─── Helpers ─────────────────────────────────────────────────
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]; } return a; }

function showToast(msg){
  const t=$('toast'); t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2000);
}

function flashCorrect(){
  const d=document.createElement('div');
  d.className='correct-flash'; document.body.appendChild(d);
  setTimeout(()=>d.remove(),700);
}

function showExplanation(msg){
  document.querySelectorAll('.explanation-box').forEach(e=>e.remove());
  const b=document.createElement('div');
  b.className='explanation-box'; b.textContent=msg;
  document.body.appendChild(b);
  setTimeout(()=>b.remove(),3000);
}

// ─── Timer ───────────────────────────────────────────────────
function startTimer(){
  clearInterval(timerID);
  timerVal=TIMER_MAX;
  updateTimerUI();
  timerID=setInterval(()=>{
    timerVal--;
    updateTimerUI();
    if(timerVal<=0){ clearInterval(timerID); timeUp(); }
  },1000);
}
function updateTimerUI(){
  const pct=timerVal/TIMER_MAX;
  timerArc.style.strokeDashoffset=CIRCUMFERENCE*(1-pct);
  timerText.textContent=timerVal;
  const warn=timerVal<=10;
  timerArc.classList.toggle('warning',warn);
  timerText.classList.toggle('warning',warn);
}
function timeUp(){
  if(!gameActive)return;
  lockOptions();
  showToast('⏰ Time\'s up!');
  setTimeout(endGame,1200);
}

// ─── Build queue ─────────────────────────────────────────────
function buildQueue(){
  queue=shuffle([...QUESTIONS]);
  qIdx=0;
}

// ─── Load question ────────────────────────────────────────────
function loadQuestion(){
  if(qIdx>=queue.length) buildQueue(); // infinite loop
  const q=queue[qIdx];

  // Build 4 options: correct + 3 wrong, shuffled
  const opts=[
    { text:q.correct.label, correct:true },
    ...q.wrong.map(w=>({ text:w, correct:false }))
  ];
  shuffle(opts);

  // Attach to DOM
  foodDisp.textContent=q.emoji;
  topicBadge.textContent=q.cat;
  qNumber.textContent=`LEVEL ${level} · Q${answered+1}`;
  qText.textContent=`What are the approx. macros for ${q.food}?`;
  levelDisp.textContent=`Level ${level} · Q${answered+1}`;

  optBtns.forEach((btn,i)=>{
    btn.className='option-btn';
    btn.disabled=false;
    const label=btn.querySelector('.opt-label');
    if (label) label.textContent = ['A', 'B', 'C', 'D'][i];
    optTexts[i].innerHTML = opts[i].text.split(' · ').join('<br>');
    btn._correct = opts[i].correct;
  });

  startTimer();
}

// ─── Answer ───────────────────────────────────────────────────
function lockOptions(){ optBtns.forEach(b=>{ b.disabled=true; }); }

function handleAnswer(btn){
  if(!gameActive)return;
  clearInterval(timerID);
  lockOptions();
  answered++;

  if(btn._correct){
    btn.classList.add('correct');
    const pts=(doubleOn?2:1)*CORRECT_PTS*level;
    score+=pts;
    correct++;
    doubleOn=false;
    scoreValEl.textContent=score;
    if(score>bestScore){ bestScore=score; localStorage.setItem('nq_best',bestScore); }
    flashCorrect();
    showExplanation('✅ Correct! +'+pts+' pts');

    // Level up every 8 correct
    if(correct>0 && correct%8===0){ level++; showToast('⬆️ Level '+level+'!'); }

    setTimeout(()=>{ qIdx++; loadQuestion(); },1400);
  } else {
    btn.classList.add('wrong');
    // Reveal correct
    optBtns.forEach(b=>{ if(b._correct) b.classList.add('correct'); });
    showExplanation('❌ Wrong! Study the correct values.');
    setTimeout(endGame,1800);
  }
}

// ─── Lifelines ────────────────────────────────────────────────
function use5050(){
  if(!ll5050)return;
  ll5050=false; $('ll-5050').disabled=true;
  const wrongs=optBtns.filter(b=>!b._correct&&!b.disabled);
  shuffle(wrongs).slice(0,2).forEach(b=>{ b.classList.add('faded'); b.disabled=true; });
  showToast('✂️ 50:50 used!');
}
function useSkip(){
  if(!llSkip)return;
  llSkip=false; $('ll-skip').disabled=true;
  clearInterval(timerID);
  showToast('⏭️ Question skipped!');
  qIdx++;
  setTimeout(loadQuestion,400);
}
function useDouble(){
  if(!llDouble)return;
  llDouble=false; $('ll-double').disabled=true;
  doubleOn=true;
  showToast('⚡ Next correct = 2× points!');
}

// ─── Start / End ──────────────────────────────────────────────
function startGame(){
  startScreen.classList.add('hidden');
  goScreen.classList.add('hidden');
  score=0; answered=0; correct=0; level=1;
  ll5050=true; llSkip=true; llDouble=true; doubleOn=false;
  $('ll-5050').disabled=false; $('ll-skip').disabled=false; $('ll-double').disabled=false;
  scoreValEl.textContent='0';
  gameActive=true;
  buildQueue();
  loadQuestion();
}

function endGame(){
  gameActive=false;
  clearInterval(timerID);
  const acc=answered>0?Math.round((correct/answered)*100):0;
  $('go-icon').textContent= acc>=70?'🏆':'🥗';
  $('go-title').textContent= acc>=70?'Great Job!':'Game Over!';
  $('prize-won').textContent='Score: '+score;
  $('go-sub').textContent= acc>=70?'You know your nutrition!':'Keep learning about nutrition!';
  $('fstat-qs').textContent=answered;
  $('fstat-acc').textContent=acc+'%';
  $('fstat-best').textContent=bestScore;
  goScreen.classList.remove('hidden');
}

// ─── Events ───────────────────────────────────────────────────
$('start-btn').addEventListener('click',startGame);
$('retry-btn').addEventListener('click',startGame);
optBtns.forEach(btn=>btn.addEventListener('click',()=>handleAnswer(btn)));
$('ll-5050').addEventListener('click',use5050);
$('ll-skip').addEventListener('click',useSkip);
$('ll-double').addEventListener('click',useDouble);
