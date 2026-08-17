// ============================================================
// MATH GENIUS QUIZ – Points-Based Unlimited Level System
// ============================================================

// ─── Settings ───
const TIMER_DURATION = 30;
const POINTS_BASE    = 100; // base pts per correct answer × level multiplier
const CIRCUMFERENCE  = 2 * Math.PI * 44;

// ─── Question Generator ───
// Returns a fresh randomized question at given difficulty level
function generateQuestion(level) {
    const easy = () => {
        const ops   = ['+', '-', '×'];
        const op    = ops[Math.floor(Math.random() * ops.length)];
        let a, b, ans;
        if (op === '+') { a = rnd(1,30); b = rnd(1,30); ans = a+b; }
        if (op === '-') { a = rnd(10,50); b = rnd(1,a); ans = a-b; }
        if (op === '×') { a = rnd(2,9);  b = rnd(2,9);  ans = a*b; }
        return { q:`${a} ${op} ${b} = ?`, ans };
    };
    const medium = () => {
        const type = rnd(0,3);
        let a, b, c, ans, q;
        if (type === 0) { a=rnd(10,50); b=rnd(10,50); ans=a+b; q=`${a} + ${b} = ?`; }
        if (type === 1) { a=rnd(20,90); b=rnd(5,a);   ans=a-b; q=`${a} - ${b} = ?`; }
        if (type === 2) { a=rnd(2,12);  b=rnd(10,20); ans=a*b; q=`${a} × ${b} = ?`; }
        if (type === 3) { b=rnd(2,9); ans=rnd(2,12); a=b*ans; q=`${a} ÷ ${b} = ?`; }
        return { q, ans };
    };
    const hard = () => {
        const type = rnd(0,4);
        let ans, q;
        if (type === 0) { const n=rnd(2,12); ans=n*n;  q=`${n}² = ?`; }
        if (type === 1) { const n=rnd(2,10); ans=n;    q=`√${n*n} = ?`; }
        if (type === 2) { const a=rnd(10,20); const b=rnd(10,20); ans=a*b; q=`${a} × ${b} = ?`; }
        if (type === 3) { const a=rnd(2,5); const b=rnd(2,4); ans=a*b; const c=rnd(1,10); q=`(${a}+${b}) × ${c} = ?`; ans=(a+b)*c; }
        if (type === 4) { const a=rnd(50,200); const b=rnd(2,8); if(a%b===0){ans=a/b; q=`${a} ÷ ${b} = ?`;} else { ans=a*b; q=`${a} × ${b} = ?`; } }
        return { q, ans };
    };

    let gen;
    if (level <= 3)       gen = easy;
    else if (level <= 7)  gen = () => Math.random()<0.5 ? easy() : medium();
    else if (level <= 12) gen = medium;
    else                  gen = () => Math.random()<0.5 ? medium() : hard();

    const { q, ans } = gen();
    return makeOptions(q, ans);
}

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function makeOptions(q, correctAns) {
    const opts = new Set([correctAns]);
    // Generate 3 plausible wrong answers
    while (opts.size < 4) {
        const delta = rnd(-10, 10);
        const wrong = correctAns + delta;
        if (wrong !== correctAns && wrong > 0) opts.add(wrong);
    }
    // Shuffle
    const shuffled = [...opts].sort(() => Math.random() - 0.5);
    const keys     = ['a','b','c','d'];
    const ansKey   = keys[shuffled.indexOf(correctAns)];
    const result = { q };
    keys.forEach((k,i) => result[k] = String(shuffled[i]));
    result.ans = ansKey;
    return result;
}

// ─── State ───
let currentQ    = 0;   // questions answered this level
let level       = 1;
const LEVEL_SIZE = 10; // questions per level
let score       = 0;
let correct     = 0;
let total       = 0;
let timerVal    = TIMER_DURATION;
let timerInterval = null;
let lifelineUsed  = { '5050': false, skip: false, double: false };
let doubleActive  = false;
let gameActive    = false;
let currentQuestion = null;

// ─── Audio ───
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, type, dur, vol=0.3) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = type; o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    o.start(); o.stop(audioCtx.currentTime + dur);
}
function playCorrect(){ beep(600,'sine',0.1); setTimeout(()=>beep(800,'sine',0.15),120); setTimeout(()=>beep(1000,'sine',0.2),280); }
function playWrong()  { beep(200,'sawtooth',0.3); }
function playTick()   { beep(440,'sine',0.05,0.08); }
function playLevelUp(){ [500,700,900,1100,1400].forEach((f,i)=>setTimeout(()=>beep(f,'sine',0.25),i*100)); }

// ─── Timer ───
function startTimer() {
    clearInterval(timerInterval);
    timerVal = TIMER_DURATION;
    renderTimer();
    timerInterval = setInterval(() => {
        timerVal--;
        renderTimer();
        if (timerVal <= 10) playTick();
        if (timerVal <= 0) { clearInterval(timerInterval); handleTimeOut(); }
    }, 1000);
}
function stopTimer() { clearInterval(timerInterval); }
function renderTimer() {
    const arc = document.getElementById('timer-arc');
    const txt = document.getElementById('timer-text');
    arc.style.strokeDashoffset = CIRCUMFERENCE * (1 - timerVal / TIMER_DURATION);
    txt.textContent = timerVal;
    const warn = timerVal <= 10;
    arc.classList.toggle('warning', warn);
    txt.classList.toggle('warning', warn);
}
function handleTimeOut() {
    showToast("⏰ Time's Up!");
    disableOptions();
    document.getElementById(`opt-${currentQuestion.ans.toUpperCase()}`).classList.add('correct');
    setTimeout(() => endGame(), 1800);
}

// ─── Load Question ───
function loadQuestion() {
    const qNum = currentQ + 1;
    document.getElementById('level-display').textContent = `Level ${level}  •  Q${qNum}/${LEVEL_SIZE}`;
    document.getElementById('q-number').textContent = `LEVEL ${level} — Q${qNum}`;

    currentQuestion = generateQuestion(level);
    document.getElementById('question-text').textContent = currentQuestion.q;

    ['A','B','C','D'].forEach((letter,i) => {
        const key  = ['a','b','c','d'][i];
        const btn  = document.getElementById(`opt-${letter}`);
        const span = document.getElementById(`opt-${letter}-text`);
        btn.className = 'option-btn';
        btn.disabled  = false;
        span.textContent = currentQuestion[key];
        btn.querySelector('.opt-label').textContent = letter;
    });

    startTimer();

    const card = document.getElementById('question-card');
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = 'popIn 0.4s ease';
}

// ─── Handle Answer ───
function handleAnswer(chosen) {
    if (!gameActive) return;
    stopTimer();
    disableOptions();

    const selectedBtn = document.getElementById(`opt-${chosen.toUpperCase()}`);
    selectedBtn.classList.add('selected');

    setTimeout(() => {
        if (chosen === currentQuestion.ans) {
            selectedBtn.classList.remove('selected');
            selectedBtn.classList.add('correct');
            playCorrect();

            const flash = document.createElement('div');
            flash.className = 'correct-flash';
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 700);

            const pts = POINTS_BASE * level * (doubleActive ? 2 : 1);
            score  += pts;
            correct++;
            total++;
            doubleActive = false;

            // Show floating score popup
            showScorePopup(`+${pts}`);
            document.getElementById('score-val').textContent = score.toLocaleString();

            currentQ++;

            if (currentQ >= LEVEL_SIZE) {
                // Level Clear!
                currentQ = 0;
                level++;
                // Refresh lifelines every new level
                resetLifelines();
                setTimeout(showLevelUp, 600);
            } else {
                setTimeout(loadQuestion, 1300);
            }
        } else {
            selectedBtn.classList.remove('selected');
            selectedBtn.classList.add('wrong');
            document.getElementById(`opt-${currentQuestion.ans.toUpperCase()}`).classList.add('correct');
            playWrong();
            total++;
            setTimeout(() => endGame(), 2000);
        }
    }, 500);
}

// ─── Level Clear Banner ───
function showLevelUp() {
    playLevelUp();
    showToast(`🎉 Level ${level-1} Complete! → Level ${level}`);
    setTimeout(loadQuestion, 1500);
}

// ─── Score Popup ───
function showScorePopup(text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
        position:fixed; top:30%; left:50%; transform:translateX(-50%);
        font-size:2rem; font-weight:900; color:#4ade80;
        text-shadow:0 0 20px rgba(74,222,128,0.8);
        pointer-events:none; z-index:500;
        animation:scoreFloat 1s ease forwards;
    `;
    document.body.appendChild(el);
    if (!document.getElementById('score-float-style')) {
        const s = document.createElement('style');
        s.id = 'score-float-style';
        s.textContent = `@keyframes scoreFloat{0%{opacity:1;transform:translateX(-50%) translateY(0);}100%{opacity:0;transform:translateX(-50%) translateY(-60px);}}`;
        document.head.appendChild(s);
    }
    setTimeout(() => el.remove(), 1000);
}

// ─── Lifelines ───
function resetLifelines() {
    lifelineUsed = { '5050':false, skip:false, double:false };
    ['ll-5050','ll-skip','ll-double'].forEach(id => document.getElementById(id).disabled = false);
}
function use5050() {
    if (lifelineUsed['5050'] || !gameActive) return;
    lifelineUsed['5050'] = true;
    document.getElementById('ll-5050').disabled = true;
    const wrong = ['a','b','c','d'].filter(k => k !== currentQuestion.ans);
    wrong.sort(() => Math.random()-0.5).slice(0,2).forEach(k => {
        document.getElementById(`opt-${k.toUpperCase()}`).classList.add('faded');
    });
    showToast('✂️ Two wrong answers removed!');
}
function useSkip() {
    if (lifelineUsed['skip'] || !gameActive) return;
    lifelineUsed['skip'] = true;
    document.getElementById('ll-skip').disabled = true;
    stopTimer();
    showToast('⏭️ Question skipped – no penalty!');
    total++;
    setTimeout(loadQuestion, 600);
}
function useDouble() {
    if (lifelineUsed['double'] || !gameActive) return;
    lifelineUsed['double'] = true;
    document.getElementById('ll-double').disabled = true;
    doubleActive = true;
    showToast('⚡ DOUBLE POINTS active for this question!');
}

// ─── Helpers ───
function disableOptions() {
    ['A','B','C','D'].forEach(l => document.getElementById(`opt-${l}`).disabled = true);
}

// ─── End Game ───
function endGame() {
    gameActive = false;
    stopTimer();

    const best = Math.max(score, parseInt(localStorage.getItem('dme_best_score')||0));
    localStorage.setItem('dme_best_score', best);

    document.getElementById('go-icon').textContent  = score > 0 ? '🏆' : '💔';
    document.getElementById('go-title').textContent = score > 0 ? `Level ${level} — Game Over!` : 'Unlucky!';
    document.getElementById('prize-won').textContent = `Final Score: ${score.toLocaleString()}`;
    document.getElementById('go-sub').textContent   = `You reached Level ${level}, answering ${correct} questions correctly.`;
    document.getElementById('fstat-qs').textContent  = total;
    document.getElementById('fstat-acc').textContent = total > 0 ? Math.round(correct/total*100)+'%' : '0%';
    document.getElementById('fstat-best').textContent = best.toLocaleString();

    document.getElementById('game-over-screen').classList.remove('hidden');
}

// ─── Start Game ───
function startGame() {
    currentQ    = 0;
    level       = 1;
    score       = 0;
    correct     = 0;
    total       = 0;
    doubleActive = false;
    gameActive  = true;

    resetLifelines();
    document.getElementById('score-val').textContent = '0';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    loadQuestion();
}

// ─── Toast ───
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 2200);
}

// ─── Init ───
(function init() {
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('retry-btn').addEventListener('click', startGame);
    document.getElementById('opt-A').addEventListener('click', () => handleAnswer('a'));
    document.getElementById('opt-B').addEventListener('click', () => handleAnswer('b'));
    document.getElementById('opt-C').addEventListener('click', () => handleAnswer('c'));
    document.getElementById('opt-D').addEventListener('click', () => handleAnswer('d'));
    document.getElementById('ll-5050').addEventListener('click',  use5050);
    document.getElementById('ll-skip').addEventListener('click',  useSkip);
    document.getElementById('ll-double').addEventListener('click', useDouble);
    document.addEventListener('keydown', e => {
        if (!gameActive) return;
        const map = { 'a':'a','b':'b','c':'c','d':'d','1':'a','2':'b','3':'c','4':'d' };
        const ans = map[e.key.toLowerCase()];
        if (ans) handleAnswer(ans);
    });
})();
