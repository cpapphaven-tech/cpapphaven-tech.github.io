// ===================================================================
//  ODD ONE OUT — Game Logic
//  PlayMixGames © 2026
// ===================================================================

(function () {
  'use strict';

  /* ── DOM refs ─────────────────────────────────────── */
  const tileGrid      = document.getElementById('tile-grid');
  const scoreEl       = document.getElementById('score-value');
  const timerEl       = document.getElementById('timer-value');
  const levelNumEl    = document.getElementById('level-num');
  const progressFill  = document.getElementById('progress-bar-fill');
  const categoryHint  = document.getElementById('category-hint');
  const streakBar     = document.getElementById('streak-bar');

  const mainMenu      = document.getElementById('main-menu');
  const gameOverEl    = document.getElementById('game-over');
  const levelUpEl     = document.getElementById('level-up-screen');

  const startBtn      = document.getElementById('start-btn');
  const restartBtn    = document.getElementById('restart-btn');
  const nextLvlBtn    = document.getElementById('next-level-btn');
  const finalScoreEl  = document.getElementById('final-score');
  const finalLevelEl  = document.getElementById('final-level');
  const feedbackToast = document.getElementById('feedback-toast');

  /* ── Game state ───────────────────────────────────── */
  let score     = 0;
  let level     = 1;
  let timeLeft  = 60;
  let timerId   = null;
  let streak    = 0;
  let oddIndex  = -1;
  let answered  = false;
  let bestScore = parseInt(localStorage.getItem('ooo-best') || '0', 10);

  /* ── Difficulty config ────────────────────────────── */
  const LEVEL_CONFIG = [
    // { gridSize, timeSec, category }
    { grid: 4,  time: 60, cat: 'emoji'  },   // 1
    { grid: 6,  time: 55, cat: 'emoji'  },   // 2
    { grid: 6,  time: 50, cat: 'color'  },   // 3
    { grid: 9,  time: 50, cat: 'emoji'  },   // 4
    { grid: 9,  time: 45, cat: 'color'  },   // 5
    { grid: 9,  time: 45, cat: 'shape'  },   // 6
    { grid: 12, time: 40, cat: 'emoji'  },   // 7
    { grid: 12, time: 38, cat: 'color'  },   // 8
    { grid: 16, time: 35, cat: 'shape'  },   // 9
    { grid: 16, time: 32, cat: 'emoji'  },   // 10
    { grid: 20, time: 30, cat: 'color'  },   // 11
    { grid: 25, time: 28, cat: 'shape'  },   // 12
  ];

  /* ── Puzzle banks ─────────────────────────────────── */

  // Each group: [common items pool, possible odd-ones]
  const EMOJI_GROUPS = [
    { pool: ['🐶','🐱','🐰','🐭','🐹','🐻','🦊','🐼','🐨','🐯'], odd: ['🦁','🐸','🐙','🦀','🐠'] },
    { pool: ['🍎','🍊','🍋','🍇','🍓','🍑','🍒','🍍','🥭','🍈'], odd: ['🥕','🥦','🌽','🥔','🍆'] },
    { pool: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🥏','🎱','🏓'], odd: ['🎮','🎯','🎲','🎸','🎺'] },
    { pool: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐'], odd: ['✈️','🚀','🛸','⛵','🚁'] },
    { pool: ['🌹','🌸','🌺','🌻','🌼','💐','🌷','🏵️','🌿','🍀'], odd: ['🌵','🎋','🍁','🍂','🍃'] },
    { pool: ['🎵','🎶','🎼','🎹','🥁','🎸','🎺','🎷','🪕','🎻'], odd: ['🎨','🖼️','🖌️','🎭','🎪'] },
    { pool: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇'], odd: ['😱','😡','😭','🤒','😴'] },
    { pool: ['🍕','🍔','🌮','🌯','🥪','🍜','🍣','🍱','🍛','🥘'], odd: ['🍰','🎂','🧁','🍩','🍪'] },
    { pool: ['⭐','🌟','✨','💫','🌠','🌌','🔮','🌙','🌛','⛅'], odd: ['🌊','🌋','⛰️','🏔️','🌈'] },
    { pool: ['💎','👑','🏆','🥇','🎖️','🏅','🎗️','🎀','🎁','🎊'], odd: ['🔑','🗝️','🔒','⚙️','🔧'] },
  ];

  const COLORS_GROUPS = [
    // shades of one hue vs a pop of different hue
    { pool: ['hsl(230,80%,62%)','hsl(235,78%,58%)','hsl(228,82%,65%)','hsl(232,75%,60%)','hsl(240,70%,62%)','hsl(225,85%,63%)','hsl(230,78%,55%)','hsl(238,76%,64%)','hsl(226,80%,61%)','hsl(242,74%,60%)'], odd: ['hsl(10,85%,60%)','hsl(340,80%,58%)','hsl(160,75%,45%)','hsl(50,90%,55%)','hsl(285,78%,58%)'] },
    { pool: ['hsl(0,78%,62%)','hsl(5,80%,60%)','hsl(355,76%,64%)','hsl(2,82%,58%)','hsl(8,75%,62%)','hsl(358,78%,60%)','hsl(4,80%,63%)','hsl(6,77%,61%)','hsl(1,79%,59%)','hsl(3,81%,62%)'], odd: ['hsl(220,80%,60%)','hsl(130,75%,45%)','hsl(45,90%,55%)','hsl(280,78%,58%)','hsl(180,70%,48%)'] },
    { pool: ['hsl(120,68%,50%)','hsl(128,70%,48%)','hsl(115,65%,52%)','hsl(125,72%,47%)','hsl(130,66%,50%)','hsl(118,69%,49%)','hsl(123,71%,51%)','hsl(126,67%,48%)','hsl(121,70%,50%)','hsl(127,68%,49%)'], odd: ['hsl(0,80%,60%)','hsl(220,78%,58%)','hsl(45,88%,54%)','hsl(300,70%,55%)','hsl(190,72%,48%)'] },
    { pool: ['hsl(50,92%,58%)','hsl(45,90%,60%)','hsl(55,88%,56%)','hsl(48,91%,59%)','hsl(52,89%,57%)','hsl(47,93%,61%)','hsl(53,90%,58%)','hsl(49,91%,57%)','hsl(51,92%,59%)','hsl(46,89%,58%)'], odd: ['hsl(210,80%,58%)','hsl(0,78%,60%)','hsl(300,72%,56%)','hsl(170,70%,46%)','hsl(30,82%,55%)'] },
    { pool: ['hsl(270,72%,58%)','hsl(275,70%,56%)','hsl(265,74%,60%)','hsl(272,71%,57%)','hsl(268,73%,59%)','hsl(278,69%,55%)','hsl(263,75%,61%)','hsl(273,72%,58%)','hsl(267,71%,57%)','hsl(276,70%,56%)'], odd: ['hsl(20,82%,58%)','hsl(130,72%,46%)','hsl(200,78%,52%)','hsl(55,88%,55%)','hsl(350,80%,58%)'] },
  ];

  const SHAPE_GROUPS = [
    { mainShape: 'circle',    oddShapes: ['star','diamond','triangle','cross','heart'] },
    { mainShape: 'square',    oddShapes: ['circle','star','triangle','heart','diamond'] },
    { mainShape: 'triangle',  oddShapes: ['circle','square','star','cross','heart'] },
    { mainShape: 'star',      oddShapes: ['circle','square','triangle','diamond','cross'] },
    { mainShape: 'hexagon',   oddShapes: ['circle','square','triangle','star','cross'] },
    { mainShape: 'diamond',   oddShapes: ['circle','square','triangle','star','heart'] },
    { mainShape: 'heart',     oddShapes: ['circle','square','triangle','star','diamond'] },
    { mainShape: 'cross',     oddShapes: ['circle','square','triangle','star','heart'] },
    { mainShape: 'pentagon',  oddShapes: ['circle','square','star','diamond','cross'] },
    { mainShape: 'octagon',   oddShapes: ['circle','square','triangle','star','heart'] },
  ];

  const SHAPE_SVGS = {
    circle:   (c) => `<svg viewBox="0 0 100 100" fill="${c}"><circle cx="50" cy="50" r="46"/></svg>`,
    square:   (c) => `<svg viewBox="0 0 100 100" fill="${c}"><rect x="8" y="8" width="84" height="84" rx="10"/></svg>`,
    triangle: (c) => `<svg viewBox="0 0 100 100" fill="${c}"><polygon points="50,6 96,94 4,94"/></svg>`,
    star:     (c) => `<svg viewBox="0 0 100 100" fill="${c}"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"/></svg>`,
    hexagon:  (c) => `<svg viewBox="0 0 100 100" fill="${c}"><polygon points="50,4 93,27 93,73 50,96 7,73 7,27"/></svg>`,
    diamond:  (c) => `<svg viewBox="0 0 100 100" fill="${c}"><polygon points="50,4 96,50 50,96 4,50"/></svg>`,
    heart:    (c) => `<svg viewBox="0 0 100 100" fill="${c}"><path d="M50,88 C50,88 8,58 8,30 C8,14 22,4 35,4 C43,4 50,9 50,9 C50,9 57,4 65,4 C78,4 92,14 92,30 C92,58 50,88 50,88 Z"/></svg>`,
    cross:    (c) => `<svg viewBox="0 0 100 100" fill="${c}"><rect x="38" y="8" width="24" height="84" rx="6"/><rect x="8" y="38" width="84" height="24" rx="6"/></svg>`,
    pentagon: (c) => `<svg viewBox="0 0 100 100" fill="${c}"><polygon points="50,4 96,36 78,90 22,90 4,36"/></svg>`,
    octagon:  (c) => `<svg viewBox="0 0 100 100" fill="${c}"><polygon points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30"/></svg>`,
  };

  /* ── Utilities ─────────────────────────────────────── */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ── Puzzle generators ────────────────────────────── */
  function genEmojiPuzzle(count) {
    const group = pick(EMOJI_GROUPS);
    const pool  = shuffle(group.pool);
    const oddItem = pick(group.odd);
    const common = pool.slice(0, count - 1);
    const items  = shuffle([...common, oddItem]);
    const oIdx   = items.indexOf(oddItem);
    return {
      items,
      oddIndex: oIdx,
      hint: 'Find the one that does NOT belong',
      type: 'emoji',
    };
  }

  function genColorPuzzle(count) {
    const group     = pick(COLORS_GROUPS);
    const pool      = shuffle(group.pool);
    const oddColor  = pick(group.odd);
    const common    = pool.slice(0, count - 1);
    const items     = shuffle([...common, oddColor]);
    const oIdx      = items.indexOf(oddColor);
    return {
      items,
      oddIndex: oIdx,
      hint: 'Find the different color',
      type: 'color',
    };
  }

  function genShapePuzzle(count) {
    const group  = pick(SHAPE_GROUPS);
    const colors = ['#a78bfa','#f472b6','#38bdf8','#4ade80','#fb923c','#facc15','#e879f9'];
    const mainColor = pick(colors);
    const oddColor  = pick(colors.filter(c => c !== mainColor));

    // Even harder: same shape, different color becomes wrong — or truly different shape
    // We do different shape for clarity
    const oddShape = pick(group.oddShapes);
    const items    = [];
    for (let i = 0; i < count - 1; i++) items.push({ shape: group.mainShape, color: mainColor });
    items.push({ shape: oddShape, color: pick(colors) });
    const shuffled = shuffle(items);
    const oIdx = shuffled.findIndex(t => t.shape === oddShape);
    return {
      items: shuffled,
      oddIndex: oIdx,
      hint: 'Find the different shape',
      type: 'shape',
    };
  }

  /* ── Build a puzzle ───────────────────────────────── */
  function buildPuzzle() {
    const cfg = LEVEL_CONFIG[clamp(level - 1, 0, LEVEL_CONFIG.length - 1)];
    let puz;
    if      (cfg.cat === 'emoji') puz = genEmojiPuzzle(cfg.grid);
    else if (cfg.cat === 'color') puz = genColorPuzzle(cfg.grid);
    else                          puz = genShapePuzzle(cfg.grid);
    return { puz, cfg };
  }

  /* ── Render grid ─────────────────────────────────── */
  function renderGrid(puz, cfg) {
    oddIndex = puz.oddIndex;
    answered = false;

    // Remove old grid classes
    tileGrid.className = '';
    tileGrid.classList.add(`grid-${cfg.grid}`);
    tileGrid.innerHTML = '';

    categoryHint.textContent = puz.hint;

    puz.items.forEach((item, i) => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.index = i;

      const inner = document.createElement('div');
      inner.className = 'tile-inner';

      if (puz.type === 'emoji') {
        inner.textContent = item;

      } else if (puz.type === 'color') {
        tile.classList.add('color-tile');
        inner.style.background = item;
        inner.style.borderRadius = '50%';

      } else { // shape
        tile.classList.add('shape-tile');
        inner.innerHTML = SHAPE_SVGS[item.shape](item.color);
      }

      tile.appendChild(inner);
      tile.addEventListener('click', () => handleTap(tile, i));
      tileGrid.appendChild(tile);
    });

    // Fade in
    tileGrid.style.opacity = '0';
    requestAnimationFrame(() => {
      tileGrid.style.transition = 'opacity 0.3s ease';
      tileGrid.style.opacity    = '1';
    });
  }

  /* ── Handle tap ────────────────────────────────────── */
  function handleTap(tile, index) {
    if (answered) return;
    answered = true;

    const isCorrect = (index === oddIndex);

    // Show all tiles briefly
    const allTiles = tileGrid.querySelectorAll('.tile');
    allTiles.forEach((t, i) => {
      if (i === oddIndex) t.classList.add('reveal-correct');
    });

    if (isCorrect) {
      tile.classList.add('correct');
      streak = Math.min(streak + 1, 5);
      const pts = 10 + (streak - 1) * 5;
      score += pts;
      scoreEl.textContent = score;
      showScorePop(tile, `+${pts}`);
      showToast(streak >= 3 ? `🔥 x${streak} Streak! +${pts}` : `✓ Correct! +${pts}`, false);
      updateStreak();

      // Level up after correct answer
      setTimeout(() => {
        level++;
        levelNumEl.textContent = level;
        showLevelUp();
      }, 800);

    } else {
      tile.classList.add('wrong');
      streak = 0;
      score  = Math.max(0, score - 5);
      scoreEl.textContent = score;
      showToast('✗ Wrong! -5', true);
      updateStreak();

      // Small penalty time
      timeLeft = Math.max(0, timeLeft - 5);
      timerEl.textContent = timeLeft;
      if (timeLeft === 0) { endGame(); return; }

      setTimeout(() => loadNextPuzzle(), 900);
    }
  }

  /* ── Level up screen ───────────────────────────────── */
  function showLevelUp() {
    clearInterval(timerId);
    document.getElementById('lu-level').textContent = level;
    levelUpEl.classList.remove('hidden');
  }

  /* ── Toast ─────────────────────────────────────────── */
  function showToast(msg, isWrong) {
    feedbackToast.textContent = msg;
    feedbackToast.className   = isWrong ? 'wrong-toast show' : 'show';
    clearTimeout(feedbackToast._t);
    feedbackToast._t = setTimeout(() => {
      feedbackToast.className = isWrong ? 'wrong-toast' : '';
    }, 1600);
  }

  /* ── Score popup ───────────────────────────────────── */
  function showScorePop(tile, text) {
    const rect = tile.getBoundingClientRect();
    const el   = document.createElement('div');
    el.className  = `score-pop positive`;
    el.textContent = text;
    el.style.left = rect.left + rect.width / 2 - 30 + 'px';
    el.style.top  = rect.top - 10 + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  /* ── Streak dots ───────────────────────────────────── */
  function updateStreak() {
    const dots = streakBar.querySelectorAll('.streak-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('filled', i < streak);
    });
  }

  /* ── Timer ─────────────────────────────────────────── */
  function startTimer(seconds) {
    clearInterval(timerId);
    timeLeft = seconds;
    timerEl.textContent = timeLeft;

    const total = seconds;
    progressFill.style.transition = 'none';
    progressFill.style.width = '100%';

    timerId = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;
      const pct = (timeLeft / total) * 100;
      progressFill.style.transition = 'width 1s linear';
      progressFill.style.width = pct + '%';

      // Color warning
      if (timeLeft <= 10) {
        progressFill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
        timerEl.style.color = '#f87171';
      } else {
        progressFill.style.background = 'linear-gradient(90deg, #7c3aed, #ec4899)';
        timerEl.style.color = '#f472b6';
      }

      if (timeLeft <= 0) endGame();
    }, 1000);
  }

  /* ── Load next puzzle ──────────────────────────────── */
  function loadNextPuzzle() {
    const { puz, cfg } = buildPuzzle();
    renderGrid(puz, cfg);
    levelNumEl.textContent = level;
    startTimer(cfg.time);
  }

  /* ── Game flow ─────────────────────────────────────── */
  function startGame() {
    score  = 0;
    level  = 1;
    streak = 0;
    scoreEl.textContent = '0';
    timerEl.textContent = '60';
    levelNumEl.textContent = '1';
    updateStreak();
    mainMenu.classList.add('hidden');
    gameOverEl.classList.add('hidden');
    levelUpEl.classList.add('hidden');
    loadNextPuzzle();
  }

  function endGame() {
    clearInterval(timerId);
    finalScoreEl.textContent = score;
    finalLevelEl.textContent = level;

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('ooo-best', bestScore);
      document.getElementById('best-score-val').textContent = bestScore;
      document.getElementById('new-best-badge').classList.remove('hidden');
    } else {
      document.getElementById('best-score-val').textContent = bestScore;
      document.getElementById('new-best-badge').classList.add('hidden');
    }

    gameOverEl.classList.remove('hidden');
  }

  /* ── Event listeners ───────────────────────────────── */
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  nextLvlBtn.addEventListener('click', () => {
    levelUpEl.classList.add('hidden');
    loadNextPuzzle();
  });

  /* ── Init ──────────────────────────────────────────── */
  // Show best score on main menu
  document.getElementById('menu-best').textContent = bestScore;

  // Build 5 streak dots
  for (let i = 0; i < 5; i++) {
    const dot = document.createElement('div');
    dot.className = 'streak-dot';
    streakBar.appendChild(dot);
  }

})();
