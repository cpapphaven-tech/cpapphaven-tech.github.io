// Word Crossword Engine - Adapted for Playmix Games
(function () {
    "use strict";

    function _s(x) { return document.getElementById(x); }

    const container = _s("container");
    const gameCanvas = _s("gameContainer");
    const ctx = gameCanvas.getContext("2d");
    
    // UI elements
    const levelNum = _s("levelNum");
    const coinElm = _s("coin").querySelector("span");
    const wcnt = _s("wcont");
    const previewTxt = _s("previewTxt");
    const hintBtn = _s("hint");
    const shuffleBtn = _s("shuffle");
    const overScreen = _s("over");
    const nextBtn = _s("nextBtn");
    const starContainer = _s("star");

    const lContainer = _s("lContainer");
    const lt = [_s("l1"), _s("l2"), _s("l3"), _s("l4"), _s("l5")];

    // Supabase
    const SUPA_URL = 'https://bjpgovfzonlmjrruaspp.supabase.co';
    const SUPA_KEY = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
    let _sb = null, _sessionId = null, _sessionStarted = false, _gameStartTime = null, _durationSent = false;
    
    function _getOS() { const u = navigator.userAgent; return /android/i.test(u) ? 'Android' : /iPhone|iPad/i.test(u) ? 'iOS' : /Win/i.test(u) ? 'Windows' : /Mac/i.test(u) ? 'Mac' : 'Other'; }
    function _getBrowser() { const u = navigator.userAgent; return /Edg/i.test(u) ? 'Edge' : /Chrome/i.test(u) ? 'Chrome' : /Safari/i.test(u) ? 'Safari' : /Firefox/i.test(u) ? 'Firefox' : 'Other'; }
    function _placement() { const p = new URLSearchParams(location.search); return p.get('utm_content') || p.get('placementid') || 'unknown'; }
    async function _country() { try { const r = await fetch('https://ipapi.co/json/'); const d = await r.json(); return d.country_name || 'Unknown'; } catch { return 'Unknown'; } }
    
    async function initSupabase() {
        if (!window.supabase) { setTimeout(initSupabase, 600); return; }
        const { createClient } = window.supabase; _sb = createClient(SUPA_URL, SUPA_KEY);
        _sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
        try { await _sb.from('game_sessions').insert([{ session_id: _sessionId, game_slug: 'word_crossword', placement_id: _placement(), user_agent: navigator.userAgent, os: _getOS(), browser: _getBrowser(), country: await _country(), started_game: false, bounced: false }]); } catch (e) { }
    }
    async function _markStarted() { if (!_sb || !_sessionId) return; try { await _sb.from('game_sessions').update({ started_game: true }).eq('session_id', _sessionId); } catch (e) { } }
    async function _updateSess(f) { if (!_sb || !_sessionId) return; try { await _sb.from('game_sessions').update(f).eq('session_id', _sessionId); } catch (e) { } }
    function _sendDuration(reason) {
        if (_gameStartTime && !_durationSent && window.trackGameEvent) {
            const s = Math.round((Date.now() - _gameStartTime) / 1000);
            window.trackGameEvent(`game_duration_word_${s}_${reason}`, { seconds: s, os: _getOS(), placement_id: _placement() });
            _updateSess({ duration_seconds: s, bounced: !_sessionStarted, end_reason: reason }); _durationSent = true;
        }
    }
    window.addEventListener('beforeunload', () => _sendDuration('tab_close'));
    document.addEventListener('visibilitychange', () => { if (document.hidden) _sendDuration('background'); });

    // Audio wrapper
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playTone(freq, type, duration, vol=0.1) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }
    function playSound(type) {
        if (type === 'select') playTone(600, 'sine', 0.1, 0.05);
        if (type === 'right') playTone(800, 'sine', 0.3, 0.08);
        if (type === 'wrong') playTone(200, 'sawtooth', 0.3, 0.1);
        if (type === 'extraWord') { playTone(500, 'sine', 0.1); setTimeout(()=>playTone(700,'sine',0.2), 100); }
        if (type === 'levelComplete') { [440,554,659,880].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.3,0.1),i*100)); }
    }

    // Define levels [main words], [bonus words]
    const levels = [
        [['GIVE','GIVEN'],['GIEN','VEIN','VINE','GEN','GIE','GIN','VEG','VIE']],
        [['ICE','VICE','VOICE'],['COVE','ECO','VIE']],
        [['ME','MY','MERRY'],['ERR','RYE','YER']],
        [['IT','HIT','TICK','THICK'],['CHIK','CHIT','HICK','ITCH','KIT','TIC']],
        [['HE','WE','LIE','WHILE'],['WILE','HEW','HIE','LEI']],
        [['AM','AS','ALL','MALL','SMALL'],['MALLS','ALLS','ALMS','LAMS','SALL','SLAM','LAM']],
        [['SEE','SEEN','SENSE'],['ESES','NESS','SEES','SENE','SEN']],
        [['HIM','HIT','MIGHT'],['GIT','TIM']],
        [['AT','TO','LOT','TOTAL'],['ALTO','TALT','OAT','TAO','TAT','TOT']],
        [['OR','FOR','FOOL','ROOF','FLOOR'],['OF','LOOF','ROLF','FRO','LOO','ROO']],
        [['AM','ARM','MAD','DRAMA'],['DAMAR','DRAM','MAAR','AMA','DAM','MAR','RAD','RAM']],
        [['IN','IT','NUT','UNIT','UNTIL'],['UNLIT','LINT','LITU','LUNT','LIT','NIL','TIL','TIN','TUN']],
        [['DIE','DIG','DUE','GUIDE'],['DUG','GIE']],
        [['AGE','ALL','LEG','LEGAL'],['EGAL','GALE','GALL','LEAL','ALE','GAL','GEL','LAG']],
        [['US','DUST','DUTY','STUDY'],['DUSTY','STUD','STY','USD']],
        [['ALL','ASH','HALL','SHALL'],['HALLS','ALLS','LASH','SALL','HAS']],
        [['IF','IT','FIT','HIT','FIFTH'],[]],
        [['SEE','KNEE','SEEK','KNEES'],['KEENS','SKEEN','SKENE','KEEN','SEEN','SENE','SKEE','EEK','EKE','SEN']],
        [['HE','WE','HER','HERE','WHERE'],['HEWER','EWER','WEER','WERE','WHEE','ERE','EWE','HEW','REE','WEE']],
        [['LET','SET','YES','YET','STYLE'],['LEST','LETS','STEY','STYE','TYES','LES','LEY','LYE','SLY','STY']],
        [['OK','LOCK','CLOCK'],['COL']],
        [['HE','SO','SHE','SHOE','SHOES'],['HOSES','HOES','HOSE','SHES','HOE']],
        [['TIE','QUIT','QUIET','QUITE'],[]],
        [['NOW','OWN','KNOW','KNOWN'],['WONK','NON','WOK','WON']],
        [['ALL','CALL','COAL','LOCAL'],['COLA','OLLA','COL']],
        [['ACE','SEA','CASE','CASES'],['ACES','SACS','SEAS','ASS','SAC','SEC']],
        [['ME','MOVE','MOVIE'],['VIE']],
        [['EYE','EVER','VERY','EVERY'],['VEERY','VEER','ERE','EVE','REE','REV','RYE','YER']],
        [['TO','OUT','TOE','QUOTE'],[]],
        [['IN','BIG','RING','BRING'],['BRIG','GIRN','GRIN','BIN','GIN','NIB','RIB','RIG']],
        [['CAP','PACE','PEACE'],['CAPE','CEPE','ACE','APE','PEA','PEE']]
    ];
    
    let tickCount = 0;
    function trackTick() {
        tickCount++;
        const rate = window.PMG_TICK_RATE || 60;
        if (tickCount % rate === 0 && window.syncPMGLayout) {
            window.syncPMGLayout();
        }
    }

    let currentLevel = 0;
    let totalCoin = 0;
    let wrong = 0;
    let points = [];        // Node centers for circle
    let linePoints = [];    // Sequence of active nodes
    let isDrawing = false;
    let currentWord = "";
    
    let foundMainWords = [];
    let foundBonusWords = [];

    // Layout
    let cw, ch, cl, ct;

    // Custom CROSSWORD LOGIC
    let boardMap = [];
    let boardLayout = []; // Holds absolute grid properties for #wcont contents
    
    class WordObj {
        constructor(string) {
            this.string = string;
            this.char = string.split("");
            this.totalMatches = 0;
            this.effectiveMatches = 0;
            this.successfulMatches = [];
            this.x = 0;
            this.y = 0;
            this.dir = 0; // 0=across, 1=down
        }
    }

    function buildCrossword(wordList) {
        let maxAttempts = 20;
        let isSuccess = false;
        let wordBank = [];
        let wordsActive = [];
        let board = [];
        let Bounds = { top:99, right:0, bottom:0, left:99 };
        
        while(maxAttempts-- > 0 && !isSuccess) {
            wordBank = wordList.map(w => new WordObj(w));
            wordsActive = [];
            board = Array(50).fill(null).map(() => Array(50).fill(null).map(() => ({value: null, char: []})));
            Bounds = { top:99, right:0, bottom:0, left:99 };
            
            // Calculate total matches for heuristic
            for(let i=0; i<wordBank.length; i++) {
                for(let j=0; j<wordBank[i].char.length; j++) {
                    for(let k=0; k<wordBank.length; k++) {
                        if(i === k) continue;
                        for(let l=0; l<wordBank[k].char.length; l++) {
                            if(wordBank[i].char[j] === wordBank[k].char[l]) wordBank[i].totalMatches++;
                        }
                    }
                }
            }

            isSuccess = true;
            for(let i=0; i<wordList.length && isSuccess; i++) {
                // AddWordToBoard
                let curIndex = -1, minMatchDiff = 9999;
                
                if (wordsActive.length === 0) {
                    curIndex = 0;
                    for(let w=0; w<wordBank.length; w++) {
                        if(wordBank[w].totalMatches < wordBank[curIndex].totalMatches) curIndex = w;
                    }
                    wordBank[curIndex].successfulMatches = [{x:25, y:25, dir:0}]; // Start middle
                } else {
                    for(let w=0; w<wordBank.length; w++) {
                        let curWord = wordBank[w];
                        curWord.effectiveMatches = 0;
                        curWord.successfulMatches = [];
                        
                        for(let j=0; j<curWord.char.length; j++) {
                            let curChar = curWord.char[j];
                            for(let k=0; k<wordsActive.length; k++) {
                                let testWord = wordsActive[k];
                                for(let l=0; l<testWord.char.length; l++) {
                                    if(curChar === testWord.char[l]) {
                                        curWord.effectiveMatches++;
                                        let curCross = {x: testWord.x, y: testWord.y, dir: 0};
                                        if (testWord.dir === 0) {
                                            curCross.dir = 1;
                                            curCross.x += l;
                                            curCross.y -= j;
                                        } else {
                                            curCross.dir = 0;
                                            curCross.y += l;
                                            curCross.x -= j;
                                        }
                                        
                                        // Verify constraints
                                        let isMatch = true;
                                        for(let m=-1; m<curWord.char.length+1; m++) {
                                            let crossVal = [];
                                            if (m !== j) {
                                                if(curCross.dir === 0) {
                                                    let xInd = curCross.x + m;
                                                    if(xInd<0 || xInd>=50) { isMatch=false; break; }
                                                    crossVal.push(board[xInd][curCross.y].value);
                                                    crossVal.push(board[xInd][curCross.y+1].value);
                                                    crossVal.push(board[xInd][curCross.y-1].value);
                                                } else {
                                                    let yInd = curCross.y + m;
                                                    if(yInd<0 || yInd>=50) { isMatch=false; break; }
                                                    crossVal.push(board[curCross.x][yInd].value);
                                                    crossVal.push(board[curCross.x+1][yInd].value);
                                                    crossVal.push(board[curCross.x-1][yInd].value);
                                                }
                                                if (m>-1 && m<curWord.char.length) {
                                                    if(crossVal[0] !== curWord.char[m]) {
                                                        if(crossVal[0] !== null || crossVal[1] !== null || crossVal[2] !== null) { isMatch=false; break; }
                                                    }
                                                } else if (crossVal[0] !== null) {
                                                    isMatch = false; break;
                                                }
                                            }
                                        }
                                        if(isMatch) curWord.successfulMatches.push(curCross);
                                    }
                                }
                            }
                        }
                        let curMatchDiff = curWord.totalMatches - curWord.effectiveMatches;
                        if(curMatchDiff < minMatchDiff && curWord.successfulMatches.length > 0) {
                            minMatchDiff = curMatchDiff;
                            curIndex = w;
                        } else if (curMatchDiff <= 0) {
                            isSuccess = false; // Dead branch
                        }
                    }
                }
                
                if (curIndex === -1) { isSuccess = false; break; }
                
                let spliced = wordBank.splice(curIndex, 1)[0];
                wordsActive.push(spliced);
                
                let matchData = spliced.successfulMatches[Math.floor(Math.random()*spliced.successfulMatches.length)];
                spliced.x = matchData.x;
                spliced.y = matchData.y;
                spliced.dir = matchData.dir;
                
                for(let c=0; c<spliced.char.length; c++) {
                    let xInd = matchData.x + (matchData.dir===0 ? c : 0);
                    let yInd = matchData.y + (matchData.dir===1 ? c : 0);
                    
                    board[xInd][yInd].value = spliced.char[c];
                    board[xInd][yInd].char.push({word: spliced.string, charIdx: c}); // bind letter to word map
                    
                    Bounds.top = Math.min(yInd, Bounds.top);
                    Bounds.right = Math.max(xInd, Bounds.right);
                    Bounds.bottom = Math.max(yInd, Bounds.bottom);
                    Bounds.left = Math.min(xInd, Bounds.left);
                }
            }
        }

        // Generate flat array of cells for CSS Grid rendering
        boardLayout = [];
        if (isSuccess) {
            let width = Bounds.right - Bounds.left + 1;
            let height = Bounds.bottom - Bounds.top + 1;
            
            for(let y=Bounds.top; y<=Bounds.bottom; y++) {
                for(let x=Bounds.left; x<=Bounds.right; x++) {
                    if (board[x][y].value !== null) {
                        boardLayout.push({
                            x: x - Bounds.left, 
                            y: y - Bounds.top, 
                            val: board[x][y].value,
                            words: board[x][y].char.map(c => c.word)
                        });
                    }
                }
            }
            return { layout: boardLayout, width: width, height: height, wordsActive: wordsActive };
        }
        
        // Fallback: horizontal list
        boardLayout = [];
        let y = 0;
        let maxWidth = 0;
        for(let i=0; i<wordList.length; i++) {
            let w = wordList[i];
            maxWidth = Math.max(maxWidth, w.length);
            for(let x=0; x<w.length; x++) {
                boardLayout.push({x: x, y: y, val: w[x], words: [w]});
            }
            y += 2;
        }
        return { layout: boardLayout, width: maxWidth, height: y, wordsActive: wordList.map(w=>({string:w})) };
    }

    let currentBoardData = null;

    function renderBoard(boardData) {
        wcnt.innerHTML = "";
        
        // Determine grid sizing
        const gridW = boardData.width;
        const gridH = boardData.height;
        
        // Let's cap cell size at 40px
        // But shrink if container is small
        
        wcnt.style.display = "grid";
        wcnt.style.gridTemplateColumns = `repeat(${gridW}, 1fr)`;
        wcnt.style.gridTemplateRows = `repeat(${gridH}, 1fr)`;
        wcnt.style.gap = "4px";
        
        // We will scale wcnt container directly in `resize()`
        wcnt.style.aspectRatio = `${gridW} / ${gridH}`;

        for(let y=0; y<gridH; y++) {
            for(let x=0; x<gridW; x++) {
                let cell = boardData.layout.find(c => c.x === x && c.y === y);
                let div = document.createElement("div");
                if (cell) {
                    div.className = "wl hidden-cell";
                    div.dataset.val = cell.val;
                    div.dataset.words = cell.words.join(","); // e.g. "ICE,VICE"
                    div.innerHTML = "?"; // Placeholder
                } else {
                    div.className = "empty-cell";
                }
                wcnt.appendChild(div);
            }
        }
    }

    function revealWord(wordStr) {
        let cells = wcnt.querySelectorAll('.wl.hidden-cell');
        cells.forEach(c => {
            let belongsTo = c.dataset.words.split(",");
            if (belongsTo.includes(wordStr)) {
                c.classList.remove('hidden-cell');
                c.classList.add('wld');
                c.innerHTML = c.dataset.val;
            }
        });
    }

    let tutorialTimer = null;
    function checkTutorial() {
        if (tutorialTimer) clearTimeout(tutorialTimer);
        
        if (currentLevel === 0 && foundMainWords.length === 0) {
            _s("tutorialHand").style.display = "block";
            tutorialTimer = setTimeout(() => {
                _s("tutorialHand").style.display = "none";
            }, 2000);
        } else {
            _s("tutorialHand").style.display = "none";
        }
    }

    function resize() {
        if (!gameCanvas) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        gameCanvas.width = w;
        gameCanvas.height = h;

        // "Keep space for 320 x 50 at bottom and 160 x 600 at right side for ad. we display ad from ads.js file."
        // We ensure we do not touch bottom 60px and right 160px on large screens.
        let safeW = w;
        let safeH = h - 60; // 50px ad + 10px buffer
        if (w >= 768) safeW = w - 160;

        // Circle dimensions (shrink to prevent overlap)
        cw = Math.min(safeW * 0.8, 250); 
        ch = cw;
        cl = (safeW - cw) / 2;
        ct = safeH - ch - 20; // Pin to bottom safe zone

        lContainer.style.width = cw + "px";
        lContainer.style.height = ch + "px";
        lContainer.style.left = cl + "px";
        lContainer.style.top = ct + "px";

        // Place buttons beside circle
        shuffleBtn.style.left = Math.max(10, cl - 50) + "px";
        shuffleBtn.style.bottom = ((h - safeH) + 30) + "px";
        hintBtn.style.left = Math.min(safeW - 60, cl + cw) + "px"; // Attach to right side of circle
        hintBtn.style.bottom = ((h - safeH) + 30) + "px";

        // Position letters circularly inside lContainer
        points = [];
        const radius = cw * 0.38; // 38% of container size
        for(let i=0; i<5; i++) {
            const angle = -Math.PI/2 + (Math.PI*2/5) * i;
            const x = cw/2 + radius * Math.cos(angle);
            const y = ch/2 + radius * Math.sin(angle);
            
            // 50px size (so half is 25)
            lt[i].style.left = (x - 25) + "px"; 
            lt[i].style.top = (y - 25) + "px";
            points.push({ x: cl + x, y: ct + y });
        }

        // Adjust crossword grid (wcnt) size
        let topBarRect = _s("topBar").getBoundingClientRect();
        let topBarBottom = topBarRect.bottom || 100; // Account for actual rendering height
        let pad = 20; 
        
        // Exact space before letter circle bounds
        let maxGridH = Math.max(50, ct - topBarBottom - pad); 
        let maxGridW = safeW * 0.95; 
        
        if (currentBoardData && maxGridH > 0 && maxGridW > 0) {
            // Cap cell size to prevent huge grids. Base off of safeH so it feels proportional 
            // but not giant. Max e.g., 55px blocks for a 'medium compact' feel
            let maxCellSize = Math.min(55, Math.floor(safeH * 0.10)); 
            
            // Total explicit width including standard CSS gap of 4px
            let gap = 4;
            let currentWConfig = currentBoardData.width;
            let currentHConfig = currentBoardData.height;
            
            let idealW = (currentWConfig * maxCellSize) + ((currentWConfig - 1) * gap);
            let idealH = (currentHConfig * maxCellSize) + ((currentHConfig - 1) * gap);
            
            let aspect = idealW / idealH;
            
            let finalW = Math.min(idealW, maxGridW);
            let finalH = Math.min(idealH, maxGridH);
            
            // Enforce aspect ratio strictly based on available limits
            if (finalW / aspect <= finalH) {
                finalH = finalW / aspect;
            } else {
                finalW = finalH * aspect;
            }
            
            // Apply dimensions and perfectly fitted font size
            wcnt.style.width = finalW + "px";
            wcnt.style.height = finalH + "px";
            
            let cellSize = (finalH - ((currentHConfig - 1) * gap)) / currentHConfig;
            wcnt.style.fontSize = Math.max(12, Math.floor(cellSize * 0.55)) + "px";
        }
    }

    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function drawLine(endX, endY) {
        ctx.clearRect(0,0, gameCanvas.width, gameCanvas.height);
        if (linePoints.length > 0) {
            ctx.beginPath();
            ctx.moveTo(points[linePoints[0]].x, points[linePoints[0]].y);
            for(let i=1; i<linePoints.length; i++) {
                ctx.lineTo(points[linePoints[i]].x, points[linePoints[i]].y);
            }
            if(endX !== null && endY !== null) {
                ctx.lineTo(endX, endY);
            }
            ctx.stroke();
        }
    }

    function checkWord() {
        const levelsContent = levels[currentLevel][0];
        const levelsBonus = levels[currentLevel][1];
        const wordPos = levelsContent.indexOf(currentWord);

        let color = "rgba(79, 172, 254, 0.8)"; // Blue default
        if (wordPos > -1) {
            // Main word
            color = "#4ade80"; // Green
            previewTxt.style.background = color;
            previewTxt.style.color = "#000";
            
            if (foundMainWords.indexOf(currentWord) < 0) {
                foundMainWords.push(currentWord);
                addCoin(10);
                playSound('right');
                revealWord(currentWord);

                if(foundMainWords.length >= levelsContent.length) {
                    setTimeout(levelComplete, 1000);
                }
            }
        } else if (levelsBonus.indexOf(currentWord) > -1) {
            // Bonus word
            color = "#facc15"; // Yellow
            previewTxt.style.background = color;
            previewTxt.style.color = "#000";

            if (foundBonusWords.indexOf(currentWord) < 0) {
                wrong = Math.max(0, wrong - 1);
                foundBonusWords.push(currentWord);
                addCoin(currentWord.length * 2);
                playSound('extraWord');
            }
        } else {
            // Wrong word
            color = "#f43f5e"; // Red
            previewTxt.style.background = color;
            previewTxt.style.color = "#fff";
            setTimeout(() => playSound('wrong'), 50);
            wrong++;
        }

        ctx.strokeStyle = color;
        drawLine(points[linePoints[linePoints.length-1]].x, points[linePoints[linePoints.length-1]].y);

        // Reset
        linePoints.forEach(idx => lt[idx].classList.remove('active'));
        
        setTimeout(() => {
            ctx.clearRect(0,0, gameCanvas.width, gameCanvas.height);
            ctx.strokeStyle = "rgba(236, 72, 153, 0.7)"; // Reset stroke to pinkish
            previewTxt.style.display = "none";
            previewTxt.textContent = "";
            previewTxt.style.background = "rgba(255,255,255,0.9)";
            previewTxt.style.color = "#111";
        }, 500);

        linePoints = [];
        isDrawing = false;
        currentWord = "";
        
        checkTutorial();
    }

    function getTouchPoint(e) {
        if(e.touches) return {x: e.touches[0].clientX, y: e.touches[0].clientY};
        return {x: e.clientX, y: e.clientY};
    }

    function handleStart(e) {
        if(overScreen.style.display === "flex") return;
        e.preventDefault();
        isDrawing = true;
        const pt = getTouchPoint(e);
        ctx.strokeStyle = "rgba(236, 72, 153, 0.7)";
        checkNodeIntersect(pt.x, pt.y);
        _s("tutorialHand").style.display = "none"; // Hide tip when playing
    }

    function handleMove(e) {
        if(!isDrawing) return;
        e.preventDefault();
        const pt = getTouchPoint(e);
        checkNodeIntersect(pt.x, pt.y);
        drawLine(pt.x, pt.y);
    }

    function handleEnd(e) {
        if(!isDrawing) return;
        e.preventDefault();
        if(linePoints.length > 0) checkWord();
        else isDrawing = false;
    }

    function checkNodeIntersect(x, y) {
        for(let i=0; i<5; i++) {
            const dx = points[i].x - x;
            const dy = points[i].y - y;
            if (dx*dx + dy*dy < 1600 && lt[i].style.display !== "none") { // Radius 40px bounding
                if (linePoints.indexOf(i) === -1) {
                    linePoints.push(i);
                    lt[i].classList.add('active');
                    currentWord += lt[i].textContent;
                    previewTxt.textContent = currentWord;
                    previewTxt.style.display = "inline-block";
                    playSound('select');
                    trackTick();
                }
            }
        }
    }

    // Bind events
    gameCanvas.addEventListener("touchstart", handleStart, {passive: false});
    gameCanvas.addEventListener("touchmove", handleMove, {passive: false});
    gameCanvas.addEventListener("touchend", handleEnd);
    gameCanvas.addEventListener("mousedown", handleStart);
    gameCanvas.addEventListener("mousemove", handleMove);
    gameCanvas.addEventListener("mouseup", handleEnd);
    gameCanvas.addEventListener("mouseleave", handleEnd);

    // Flow
    function startLevel(lvl) {
        if(!_sessionStarted) {
            _sessionStarted = true;
            _gameStartTime = Date.now();
            initSupabase().then(_markStarted);
        }

        currentLevel = lvl % levels.length;
        levelNum.textContent = currentLevel + 1;
        foundMainWords = [];
        foundBonusWords = [];
        wrong = 0;
        
        overScreen.style.display = "none";
        ctx.clearRect(0,0, gameCanvas.width, gameCanvas.height);
        
        // Setup letters
        const levelContent = levels[currentLevel][0];
        let targetWord = levelContent[levelContent.length-1].split("");
        targetWord.sort(() => Math.random() - 0.5); // shuffle
        
        for(let i=0; i<5; i++) {
            if(i < targetWord.length) {
                lt[i].textContent = targetWord[i];
                lt[i].style.display = "flex";
            } else {
                lt[i].style.display = "none";
            }
        }

        // Build crossword board
        currentBoardData = buildCrossword(levelContent);
        renderBoard(currentBoardData);

        resize(); // recalcs positions
        checkTutorial();
    }

    function levelComplete() {
        playSound('levelComplete');
        
        // Stars calculation
        let st = 1;
        if(wrong < 2) st = 3; else if(wrong < 4) st = 2;

        let starHtml = "";
        for(let i=0; i<3; i++) starHtml += i < st ? "<span>⭐</span>" : "";
        starContainer.innerHTML = starHtml;

        setTimeout(() => {
            overScreen.style.display = "flex";
            if(window.syncPMGLayout) window.syncPMGLayout();
        }, 1000);
    }

    function addCoin(val) {
        totalCoin += val;
        coinElm.textContent = totalCoin;
    }

    // Tools
    shuffleBtn.onclick = () => {
        playSound('select');
        const levelContent = levels[currentLevel][0];
        let targetWord = levelContent[levelContent.length-1].split("");
        targetWord.sort(() => Math.random() - 0.5);
        for(let i=0; i<5; i++) if(i < targetWord.length) lt[i].textContent = targetWord[i];
    };

    hintBtn.onclick = () => {
        if (totalCoin >= 20) {
            for(let i=0; i<levels[currentLevel][0].length; i++) {
                const word = levels[currentLevel][0][i];
                if (foundMainWords.indexOf(word) === -1) {
                    addCoin(-20);
                    // Fill word just like player guessed it
                    foundMainWords.push(word);
                    revealWord(word);
                    playSound('right');

                    if(foundMainWords.length >= levels[currentLevel][0].length) {
                        setTimeout(levelComplete, 1000);
                    }
                    break;
                }
            }
        } else {
            playSound('wrong'); // not enough coins
        }
    };

    nextBtn.onclick = () => startLevel(currentLevel + 1);

    window.addEventListener('resize', resize);
    
    // Boot
    setTimeout(() => {
        container.style.display = "block";
        startLevel(0);
    }, 100);

})();
