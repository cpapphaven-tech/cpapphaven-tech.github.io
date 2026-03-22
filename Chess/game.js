/**
 * Chess Master — PlayMix Games
 *
 * Chess engine adapted from open-source Chess Game by Talha (he-is-talha)
 * Original: https://github.com/he-is-talha
 * License: MIT
 *
 * Modifications by PlayMix Games:
 *  - Neon dark board theme with glow effects and animated highlights
 *  - Captured piece display (material tracking)
 *  - Move history panel with algebraic notation
 *  - Rank/file board labels
 *  - Piece animation on move
 *  - Premove highlight + last-move trail
 *  - AI difficulty indicator
 *  - Full Supabase session tracking & Playmix ad sync
 *  - Mobile-first responsive layout
 */

(function () {
    "use strict";

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
        try { await _sb.from('game_sessions').insert([{ session_id:_sessionId, game_slug:'chess_master', placement_id:_placement(), user_agent:navigator.userAgent, os:_getOS(), browser:_getBrowser(), country:await _country(), started_game:false, bounced:false }]); } catch(e){}
    }
    async function _markStarted() { if(!_sb||!_sessionId)return; try{await _sb.from('game_sessions').update({started_game:true}).eq('session_id',_sessionId);}catch(e){} }
    async function _updateSess(f) { if(!_sb||!_sessionId)return; try{await _sb.from('game_sessions').update(f).eq('session_id',_sessionId);}catch(e){} }
    function _sendDuration(reason) {
        if(_gameStartTime&&!_durationSent&&window.trackGameEvent){
            const s=Math.round((Date.now()-_gameStartTime)/1000);
            window.trackGameEvent(`game_duration_chess_master_${s}_${reason}`,{seconds:s,os:_getOS(),placement_id:_placement()});
            _updateSess({duration_seconds:s,bounced:!_sessionStarted,end_reason:reason}); _durationSent=true;
        }
    }
    window.addEventListener('beforeunload',()=>_sendDuration('tab_close'));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)_sendDuration('background');});

    // ─── AUDIO ───────────────────────────────────────────────────────
    const _ac = new (window.AudioContext||window.webkitAudioContext)();
    function _beep(freq,dur,type='sine',vol=0.08){
        try {
            if(_ac.state==='suspended')_ac.resume();
            const o=_ac.createOscillator(),g=_ac.createGain();
            o.type=type; o.frequency.setValueAtTime(freq,_ac.currentTime);
            g.gain.setValueAtTime(vol,_ac.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+dur);
            o.connect(g); g.connect(_ac.destination); o.start(); o.stop(_ac.currentTime+dur);
        } catch(e){}
    }
    function sfxMove()    { _beep(600, 0.1, 'sine', 0.05); }
    function sfxCapture() { _beep(300, 0.15, 'triangle', 0.08); }
    function sfxCheck()   { _beep(800, 0.2, 'sine', 0.1); setTimeout(()=>_beep(800, 0.2, 'sine', 0.1), 100); }
    function sfxGameOver(){ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>_beep(f,0.25,'sine',0.12),i*120)); }

    // ─── PIECE DATA ─────────────────────────────────────────────────
    // Unicode chess symbols — white pieces use filled, black use hollow for neon contrast
    const PIECES = {
        K: { w: "♔", b: "♚" },
        Q: { w: "♕", b: "♛" },
        R: { w: "♖", b: "♜" },
        B: { w: "♗", b: "♝" },
        N: { w: "♘", b: "♞" },
        P: { w: "♙", b: "♟" },
    };

    const PIECE_VALUES = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
    const PIECE_NAMES  = { P: "Pawn", N: "Knight", B: "Bishop", R: "Rook", Q: "Queen", K: "King" };
    const FILE_NAMES   = ["a","b","c","d","e","f","g","h"];

    // ─── STATE ──────────────────────────────────────────────────────
    let board = [], turn = "w", selected = null, validMoves = [];
    let mode  = "ai";
    let aiDepth = 1; // Easy=1, Medium=2, Hard=3
    let kingMoved  = { w: false, b: false };
    let rookMoved  = { w: [false, false], b: [false, false] };
    let lastMove = null, lastMoveFrom = null;
    let pendingPromotion = null, gameOver = false;
    let capturedByWhite = [], capturedByBlack = [];
    let moveHistory = [];
    let aiThinking = false;

    // ─── DOM ────────────────────────────────────────────────────────
    const boardEl          = document.getElementById("board");
    const modeScreen       = document.getElementById("modeScreen");
    const gameScreen       = document.getElementById("gameScreen");
    const turnLabel        = document.getElementById("turnLabel");
    const modeBadge        = document.getElementById("modeBadge");
    const promotionOverlay = document.getElementById("promotionOverlay");
    const promotionPiecesEl= document.getElementById("promotionPieces");
    const gameOverOverlay  = document.getElementById("gameOverOverlay");
    const gameOverTitle    = document.getElementById("gameOverTitle");
    const gameOverMessage  = document.getElementById("gameOverMessage");
    const gameOverIcon     = document.getElementById("gameOverIcon");
    const capWhitePieces   = document.getElementById("capWhitePieces");
    const capBlackPieces   = document.getElementById("capBlackPieces");
    const moveHistoryEl    = document.getElementById("moveHistory");

    // ─── BOARD LOGIC (adapted from Talha's original engine) ─────────

    function initBoard() {
        board = [
            [{ type:"R",color:"b"},{ type:"N",color:"b"},{ type:"B",color:"b"},{ type:"Q",color:"b"},{ type:"K",color:"b"},{ type:"B",color:"b"},{ type:"N",color:"b"},{ type:"R",color:"b"}],
            Array(8).fill(null).map(() => ({ type:"P", color:"b" })),
            ...Array(4).fill(null).map(() => Array(8).fill(null)),
            Array(8).fill(null).map(() => ({ type:"P", color:"w" })),
            [{ type:"R",color:"w"},{ type:"N",color:"w"},{ type:"B",color:"w"},{ type:"Q",color:"w"},{ type:"K",color:"w"},{ type:"B",color:"w"},{ type:"N",color:"w"},{ type:"R",color:"w"}],
        ];
        turn = "w"; selected = null; validMoves = [];
        kingMoved = { w:false, b:false };
        rookMoved = { w:[false,false], b:[false,false] };
        lastMove = null; lastMoveFrom = null; pendingPromotion = null; gameOver = false;
        capturedByWhite = []; capturedByBlack = [];
        moveHistory = []; aiThinking = false;
    }

    function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
    function getPiece(r, c) { return inBounds(r,c) ? board[r][c] : null; }

    function isSquareAttacked(r, c, byColor) {
        for (let ri=0; ri<8; ri++)
            for (let ci=0; ci<8; ci++) {
                const p = getPiece(ri,ci);
                if (!p || p.color !== byColor) continue;
                if (getRawMoves(ri,ci,true).some(m => m[0]===r && m[1]===c)) return true;
            }
        return false;
    }

    function getKingPos(color) {
        for (let r=0; r<8; r++)
            for (let c=0; c<8; c++) {
                const p = getPiece(r,c);
                if (p && p.type==="K" && p.color===color) return [r,c];
            }
        return null;
    }

    function getRawMoves(r, c, forAttack) {
        const piece = getPiece(r,c);
        if (!piece) return [];
        const { type, color } = piece;
        const moves = [];
        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
        const kDirs = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];

        const add = (r1,c1) => {
            if (!inBounds(r1,c1)) return;
            const t = getPiece(r1,c1);
            if (!t || t.color !== color) moves.push([r1,c1]);
        };
        const slide = (dr,dc) => {
            let r1=r+dr, c1=c+dc;
            while (inBounds(r1,c1)) {
                const t = getPiece(r1,c1);
                if (!t) { moves.push([r1,c1]); r1+=dr; c1+=dc; continue; }
                if (t.color !== color) moves.push([r1,c1]);
                break;
            }
        };

        if (type==="R") { slide(-1,0);slide(1,0);slide(0,-1);slide(0,1); }
        else if (type==="B") { slide(-1,-1);slide(-1,1);slide(1,-1);slide(1,1); }
        else if (type==="Q") { dirs.forEach(([dr,dc])=>slide(dr,dc)); }
        else if (type==="N") { kDirs.forEach(([dr,dc])=>add(r+dr,c+dc)); }
        else if (type==="K") {
            dirs.forEach(([dr,dc])=>add(r+dr,c+dc));
            if (!forAttack) {
                if (color==="w"&&!kingMoved.w&&!rookMoved.w[0]&&!getPiece(7,1)&&!getPiece(7,2)&&!getPiece(7,3)&&!isSquareAttacked(7,4,"b")&&!isSquareAttacked(7,3,"b")&&!isSquareAttacked(7,2,"b")) moves.push([7,2]);
                if (color==="w"&&!kingMoved.w&&!rookMoved.w[1]&&!getPiece(7,5)&&!getPiece(7,6)&&!isSquareAttacked(7,4,"b")&&!isSquareAttacked(7,5,"b")&&!isSquareAttacked(7,6,"b")) moves.push([7,6]);
                if (color==="b"&&!kingMoved.b&&!rookMoved.b[0]&&!getPiece(0,1)&&!getPiece(0,2)&&!getPiece(0,3)&&!isSquareAttacked(0,4,"w")&&!isSquareAttacked(0,3,"w")&&!isSquareAttacked(0,2,"w")) moves.push([0,2]);
                if (color==="b"&&!kingMoved.b&&!rookMoved.b[1]&&!getPiece(0,5)&&!getPiece(0,6)&&!isSquareAttacked(0,4,"w")&&!isSquareAttacked(0,5,"w")&&!isSquareAttacked(0,6,"w")) moves.push([0,6]);
            }
        } else if (type==="P") {
            const fwd = color==="w"?-1:1, startRow = color==="w"?6:1;
            if (!forAttack) {
                if (!getPiece(r+fwd,c)) {
                    moves.push([r+fwd,c]);
                    if (r===startRow&&!getPiece(r+2*fwd,c)) moves.push([r+2*fwd,c]);
                }
            }
            [[r+fwd,c-1],[r+fwd,c+1]].forEach(([r1,c1]) => {
                if (!inBounds(r1,c1)) return;
                const t = getPiece(r1,c1);
                if (t && t.color!==color) moves.push([r1,c1]);
                if (!forAttack&&lastMove&&lastMove.piece==="P"&&lastMove.toR===r&&lastMove.fromR===r+2*fwd&&lastMove.toC===c1)
                    moves.push([r1,c1]);
            });
        }
        return moves;
    }

    function getLegalMoves(r, c) {
        const piece = getPiece(r,c);
        if (!piece||piece.color!==turn) return [];
        const raw = getRawMoves(r,c,false);
        const legal = [], kp = getKingPos(turn);
        const kr = piece.type==="K"?r:kp[0], kc = piece.type==="K"?r:kp[1];
        for (const [toR,toC] of raw) {
            const cap=board[toR][toC], fp=board[r][c];
            board[toR][toC]=fp; board[r][c]=null;
            let epR=null;
            if (piece.type==="P"&&lastMove&&lastMove.piece==="P"&&lastMove.toR===r&&lastMove.fromR===r+(turn==="w"?-2:2)&&lastMove.toC===toC) {
                epR=[lastMove.toR,lastMove.toC]; board[epR[0]][epR[1]]=null;
            }
            let castR=null;
            if (piece.type==="K"&&Math.abs(toC-c)===2) {
                const rc=toC===2?0:7, nc=toC===2?3:5;
                castR={from:[r,rc],to:[r,nc],p:board[r][rc]};
                board[r][nc]=board[r][rc]; board[r][rc]=null;
            }
            const kingR=piece.type==="K"?toR:kr, kingC=piece.type==="K"?toC:kc;
            const inChk=isSquareAttacked(kingR,kingC,turn==="w"?"b":"w");
            board[r][c]=fp; board[toR][toC]=cap;
            if (epR) board[epR[0]][epR[1]]={type:"P",color:turn==="w"?"b":"w"};
            if (castR){board[castR.from[0]][castR.from[1]]=castR.p;board[castR.to[0]][castR.to[1]]=null;}
            if (!inChk) legal.push([toR,toC]);
        }
        return legal;
    }

    function getAllMoves(color) {
        const moves=[];
        for (let r=0;r<8;r++)
            for (let c=0;c<8;c++) {
                const p=getPiece(r,c);
                if (p&&p.color===color) getLegalMoves(r,c).forEach(([toR,toC])=>moves.push({from:[r,c],to:[toR,toC]}));
            }
        return moves;
    }

    function isCheck(color) { const k=getKingPos(color); return k&&isSquareAttacked(k[0],k[1],color==="w"?"b":"w"); }
    function isCheckmate(color) { return isCheck(color)&&getAllMoves(color).length===0; }
    function isStalemate(color) { return !isCheck(color)&&getAllMoves(color).length===0; }

    function toAlgebraic(r,c) { return FILE_NAMES[c]+(8-r); }

    function makeMove(fromR, fromC, toR, toC, promotionType, isSimulation = false) {
        const piece = board[fromR][fromC];
        if (!piece) return false;
        const legal = getLegalMoves(fromR,fromC);
        if (!legal.some(([r,c])=>r===toR&&c===c)) return false;

        const captured = board[toR][toC];
        if (!isSimulation) {
            lastMoveFrom = [fromR,fromC];
            // Track captures for material display
            if (captured) {
                if (piece.color==="w") capturedByWhite.push(captured);
                else capturedByBlack.push(captured);
            }
        }
        lastMove = { piece:piece.type, fromR,fromC,toR,toC };

        // Castling
        if (piece.type==="K"){
            piece.color==="w"?kingMoved.w=true:kingMoved.b=true;
            if (Math.abs(toC-fromC)===2){
                const rc=toC===2?0:7, nc=toC===2?3:5;
                board[fromR][nc]=board[fromR][rc]; board[fromR][rc]=null;
            }
        }
        if (piece.type==="R"){
            if (piece.color==="w"){ if(fromC===0)rookMoved.w[0]=true; if(fromC===7)rookMoved.w[1]=true; }
            else { if(fromC===0)rookMoved.b[0]=true; if(fromC===7)rookMoved.b[1]=true; }
        }
        // En-passant capture
        if (piece.type==="P"&&lastMove&&Math.abs(fromC-toC)===1&&!captured){
            const epRow=toR+(piece.color==="w"?1:-1);
            const epCap=board[epRow][toC];
            if (epCap && !isSimulation) { (piece.color==="w"?capturedByWhite:capturedByBlack).push(epCap); }
            board[epRow][toC]=null;
        }

        let promo=promotionType;
        if (piece.type==="P"&&(toR===0||toR===7)) promo=promo||"Q";
        board[toR][toC]=promo?{type:promo,color:piece.color}:piece;
        board[fromR][fromC]=null;

        if (!isSimulation) {
            // Friendly piece names — no positions, just left/right context
            const side = fromC < 4 ? "Left" : "Right";
            const FRIENDLY = {
                K: "King", Q: "Queen",
                R: side + " Tower", B: side + " Bishop",
                N: side + " Horse", P: "Pawn",
            };
            const isCastleMove = piece.type === "K" && Math.abs(toC - fromC) === 2;
            let desc;
            if (isCastleMove) {
                desc = toC === 6 ? "King castled to the right" : "King castled to the left";
            } else if (captured) {
                const capFriendly = { K:"King", Q:"Queen", R:"Tower", B:"Bishop", N:"Horse", P:"Pawn" };
                desc = `${FRIENDLY[piece.type]} took the ${capFriendly[captured.type]}`;
            } else if (promo) {
                const promoFriendly = { Q:"Queen", R:"Tower", B:"Bishop", N:"Horse" };
                desc = `Pawn became a ${promoFriendly[promo] || promo}!`;
            } else if (piece.type === "P" && Math.abs(fromR - toR) === 2) {
                desc = "Pawn moved forward (2 steps)";
            } else {
                desc = `${FRIENDLY[piece.type]} moved`;
            }
            moveHistory.push({ color: piece.color, desc });

            // Sound Effects (only for real moves)
            if (captured) sfxCapture();
            else sfxMove();
            
            // Ad refresh logic
            if (_gameRecordTime) {
                const s = Math.round((Date.now() - _gameRecordTime) / 1000);
                if (s > (window.PMG_TICK_RATE || 60)) {
                    if (typeof syncPMGLayout === 'function') syncPMGLayout();
                    _gameRecordTime = Date.now();
                }
            }
        }

        turn=turn==="w"?"b":"w";
        return true;
    }

    // ─── AI (minimax + alpha-beta, adapted) ─────────────────────────
    function copyBoard() { return board.map(row=>row.map(c=>c?{...c}:null)); }
    function copyFlags() { return { kingMoved:{...kingMoved}, rookMoved:{w:[...rookMoved.w],b:[...rookMoved.b]} }; }
    function restoreBoard(b,flags,t,lm) {
        board=b.map(row=>row.map(c=>c?{...c}:null));
        kingMoved=flags.kingMoved; rookMoved={w:[...flags.rookMoved.w],b:[...flags.rookMoved.b]};
        turn=t; lastMove=lm;
    }

    // Piece-square tables for better AI positional play
    const PST = {
        P: [[0,0,0,0,0,0,0,0],[5,10,10,-20,-20,10,10,5],[5,-5,-10,0,0,-10,-5,5],[0,0,0,20,20,0,0,0],[5,5,10,25,25,10,5,5],[10,10,20,30,30,20,10,10],[50,50,50,50,50,50,50,50],[0,0,0,0,0,0,0,0]],
        N: [[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,5,5,0,-20,-40],[-30,5,10,15,15,10,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,10,15,15,10,0,-30],[-40,-20,0,0,0,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
        B: [[-20,-10,-10,-10,-10,-10,-10,-20],[-10,5,0,0,0,0,5,-10],[-10,10,10,10,10,10,10,-10],[-10,0,10,10,10,10,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,5,10,10,5,0,-10],[-10,0,0,0,0,0,0,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],
        R: [[0,0,0,5,5,0,0,0],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[5,10,10,10,10,10,10,5],[0,0,0,0,0,0,0,0]],
        Q: [[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,5,0,0,0,0,-10],[-10,5,5,5,5,5,0,-10],[0,0,5,5,5,5,0,-5],[-5,0,5,5,5,5,0,-5],[-10,0,5,5,5,5,0,-10],[-10,0,0,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],
        K: [[20,30,10,0,0,10,30,20],[20,20,0,0,0,0,20,20],[-10,-20,-20,-20,-20,-20,-20,-10],[-20,-30,-30,-40,-40,-30,-30,-20],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30]],
    };

    function evaluate() {
        let score=0;
        for (let r=0;r<8;r++)
            for (let c=0;c<8;c++) {
                const p=getPiece(r,c); if(!p) continue;
                const pstRow = p.color==="w"?r:7-r;
                const val = PIECE_VALUES[p.type] + (PST[p.type]?PST[p.type][pstRow][c]:0);
                score += p.color==="w"?val:-val;
            }
        return score;
    }

    function minimax(depth,alpha,beta,isMax) {
        if (depth===0) return evaluate();
        const color=isMax?"b":"w";
        const moves=getAllMoves(color);
        if (moves.length===0) return isCheck(color)?(isMax?-20000:20000):0;
        const b0=copyBoard(),f0=copyFlags(),t0=turn,lm0=lastMove?{...lastMove}:null;
        if (isMax) {
            let max=-Infinity;
            for (const m of moves) {
                makeMove(m.from[0],m.from[1],m.to[0],m.to[1], undefined, true);
                const v=minimax(depth-1,alpha,beta,false);
                restoreBoard(b0,f0,t0,lm0); max=Math.max(max,v); alpha=Math.max(alpha,v);
                if (beta<=alpha) break;
            }
            return max;
        } else {
            let min=Infinity;
            for (const m of moves) {
                makeMove(m.from[0],m.from[1],m.to[0],m.to[1], undefined, true);
                const v=minimax(depth-1,alpha,beta,true);
                restoreBoard(b0,f0,t0,lm0); min=Math.min(min,v); beta=Math.min(beta,v);
                if (beta<=alpha) break;
            }
            return min;
        }
    }

    function getBestMove(depth) {
        const moves=getAllMoves("b"); if(!moves.length) return null;
        const b0=copyBoard(),f0=copyFlags(),t0=turn,lm0=lastMove?{...lastMove}:null;
        // Sort moves: captures first (move ordering for better pruning)
        moves.sort((a,b)=>{
            const capA=board[a.to[0]][a.to[1]]?PIECE_VALUES[board[a.to[0]][a.to[1]].type]:0;
            const capB=board[b.to[0]][b.to[1]]?PIECE_VALUES[board[b.to[0]][b.to[1]].type]:0;
            return capB-capA;
        });
        let best=-Infinity, bm=moves[0];
        for (const m of moves) {
            makeMove(m.from[0],m.from[1],m.to[0],m.to[1], undefined, true);
            const v=-minimax(depth-1,-Infinity,Infinity,false);
            restoreBoard(b0,f0,t0,lm0);
            if (v>best){best=v;bm=m;}
        }
        return bm;
    }

    // ─── RENDER ─────────────────────────────────────────────────────
    function render() {
        boardEl.innerHTML="";
        const kingPos=getKingPos(turn);
        const inChk=kingPos&&isSquareAttacked(kingPos[0],kingPos[1],turn==="w"?"b":"w");

        for (let r=0;r<8;r++) {
            for (let c=0;c<8;c++) {
                const sq=document.createElement("div");
                sq.className="square";
                sq.classList.add((r+c)%2===0?"light":"dark");
                sq.dataset.row=r; sq.dataset.col=c;
                sq.setAttribute("role","gridcell");
                sq.setAttribute("aria-label",toAlgebraic(r,c));

                const piece=getPiece(r,c);
                if (piece) {
                    const span=document.createElement("span");
                    span.className="piece";
                    span.textContent=PIECES[piece.type][piece.color];
                    span.classList.add(piece.color==="w"?"piece-w":"piece-b");
                    sq.appendChild(span);
                }

                if (selected&&selected[0]===r&&selected[1]===c) sq.classList.add("selected");
                if (validMoves.some(([a,b])=>a===r&&b===c)) {
                    sq.classList.add(getPiece(r,c)?"move-capture":"move-target");
                }
                if (kingPos&&r===kingPos[0]&&c===kingPos[1]&&inChk) sq.classList.add("in-check");
                if ((lastMoveFrom&&r===lastMoveFrom[0]&&c===lastMoveFrom[1])||(lastMove&&r===lastMove.toR&&c===lastMove.toC)) sq.classList.add("last-move");

                boardEl.appendChild(sq);
            }
        }

        // Rank labels
        const rl=document.getElementById("ranksLeft"), rr=document.getElementById("ranksRight");
        if (rl) { rl.innerHTML=""; for(let r=0;r<8;r++){const s=document.createElement("span");s.textContent=8-r;rl.appendChild(s);} }
        if (rr) { rr.innerHTML=""; for(let r=0;r<8;r++){const s=document.createElement("span");s.textContent=8-r;rr.appendChild(s);} }

        updateCaptured();
        updateMoveHistory();
        updateTurnLabel();
    }

    function updateTurnLabel() {
        if (gameOver) return;
        const chk=isCheck(turn);
        const who=turn==="w"?"⬜ White":"⬛ Black";
        turnLabel.textContent=chk?`${who} — CHECK!`:`${who} to move`;
        turnLabel.className="turn-label"+(chk?" in-check-label":"");
        if (aiThinking) turnLabel.textContent="🤖 AI is thinking...";
    }

    function updateCaptured() {
        const fmt=(arr)=>arr.map(p=>PIECES[p.type][p.color]).join("");
        capWhitePieces.textContent=fmt(capturedByWhite)||"—";
        capBlackPieces.textContent=fmt(capturedByBlack)||"—";
    }

    function updateMoveHistory() {
        moveHistoryEl.innerHTML="";
        moveHistory.forEach((m, i) => {
            const card = document.createElement("div");
            card.className = "mh-card " + (m.color==="w" ? "mh-card-w" : "mh-card-b");

            const badge = document.createElement("span");
            badge.className = "mh-badge";
            badge.textContent = m.color==="w" ? "⬜ White" : "⬛ Black";

            const text = document.createElement("span");
            text.className = "mh-text";
            text.textContent = m.desc;

            const num = document.createElement("span");
            num.className = "mh-idx";
            num.textContent = Math.ceil((i+1)/2);

            card.appendChild(num);
            card.appendChild(badge);
            card.appendChild(text);
            moveHistoryEl.appendChild(card);
        });
        moveHistoryEl.scrollTop = moveHistoryEl.scrollHeight;
    }

    // ─── PROMOTION ───────────────────────────────────────────────────
    function showPromotion(fromR,fromC,toR,toC) {
        pendingPromotion={fromR,fromC,toR,toC};
        promotionOverlay.classList.remove("hidden");
        const color=board[fromR][fromC].color;
        promotionPiecesEl.innerHTML="";
        ["Q","R","B","N"].forEach(type=>{
            const btn=document.createElement("button");
            btn.type="button"; btn.className="promo-btn";
            const span=document.createElement("span"); span.className=color==="w"?"piece-w":"piece-b";
            span.textContent=PIECES[type][color]; btn.appendChild(span);
            const label=document.createElement("small"); label.textContent=PIECE_NAMES[type]; btn.appendChild(label);
            btn.dataset.type=type;
            btn.addEventListener("click",()=>{
                makeMove(fromR,fromC,toR,toC,type);
                promotionOverlay.classList.add("hidden");
                pendingPromotion=null;
                render(); afterMove();
            });
            promotionPiecesEl.appendChild(btn);
        });
    }

    // ─── GAME FLOW ───────────────────────────────────────────────────
    function afterMove() {
        if (isCheckmate("w")) { sfxGameOver(); endGame("Checkmate!","Black wins! ♚","♛"); return; }
        if (isCheckmate("b")) { sfxGameOver(); endGame("Checkmate!","White wins! ♔","♕"); return; }
        if (isStalemate(turn))  { sfxGameOver(); endGame("Stalemate","It's a draw!","⚖"); return; }
        
        if (isCheck(turn)) sfxCheck();
        
        render();
        if (mode==="ai"&&turn==="b"&&!gameOver) triggerAI();
    }

    function endGame(title,msg,icon) {
        gameOver=true; render();
        gameOverTitle.textContent=title;
        gameOverMessage.textContent=msg;
        gameOverIcon.textContent=icon;
        setTimeout(()=>gameOverOverlay.classList.remove("hidden"),400);
        if (typeof syncPMGLayout==="function") syncPMGLayout();
    }

    function triggerAI() {
        aiThinking=true; updateTurnLabel();
        const delay = aiDepth >= 3 ? 500 : 300;
        setTimeout(()=>{
            const move=getBestMove(aiDepth);
            if (move) {
                const p=board[move.from[0]][move.from[1]];
                const isPromo=p.type==="P"&&(move.to[0]===0||move.to[0]===7);
                makeMove(move.from[0],move.from[1],move.to[0],move.to[1],isPromo?"Q":undefined);
            }
            aiThinking=false;
            render(); afterMove();
        },delay);
    }

    // ─── INPUT ───────────────────────────────────────────────────────
    function onSquareClick(r,c) {
        if (gameOver||pendingPromotion) return;
        if (mode==="ai"&&turn==="b") return;
        if (aiThinking) return;

        const piece=getPiece(r,c);
        if (selected) {
            const [sr,sc]=selected;
            if (validMoves.some(([tr,tc])=>tr===r&&tc===c)) {
                const mp=board[sr][sc];
                const isPromo=mp.type==="P"&&(r===0||r===7);
                if (isPromo) { showPromotion(sr,sc,r,c); return; }
                makeMove(sr,sc,r,c);
                selected=null; validMoves=[];
                render(); afterMove(); return;
            }
            selected=null; validMoves=[];
        }
        if (piece&&piece.color===turn) {
            selected=[r,c];
            validMoves=getLegalMoves(r,c);
        }
        render();
    }

    function bindBoard() {
        boardEl.addEventListener("click",e=>{
            const sq=e.target.closest(".square"); if(!sq) return;
            onSquareClick(parseInt(sq.dataset.row,10),parseInt(sq.dataset.col,10));
        });
    }

    // ─── MODE / GAME START ───────────────────────────────────────────
    function setDifficulty(d) {
        aiDepth = d;
        const labels = { 1:'🟢 Easy', 2:'🟡 Medium', 3:'🔴 Hard' };
        const el = document.getElementById("diffLabel");
        if (el) el.textContent = labels[d];
        document.querySelectorAll('.diff-btn').forEach(b => {
            b.classList.toggle('diff-active', parseInt(b.dataset.depth)===d);
        });
    }

    function showGame(m) {
        mode=m;
        if (!_sessionStarted) {
            _gameStartTime = Date.now();
            _gameRecordTime = Date.now();
            _sessionStarted = true;
            _markStarted();
        }
        modeScreen.classList.add("hidden");
        gameScreen.classList.remove("hidden");
        modeBadge.textContent=m==="ai"?"🤖 Vs AI":"👥 Vs Friend";
        const diffRow = document.getElementById("diffRow");
        if (diffRow) diffRow.style.display = m==="ai" ? "flex" : "none";
        setDifficulty(aiDepth);
        initBoard(); render(); bindBoard();
        if (typeof syncPMGLayout==="function") syncPMGLayout();
    }

    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => setDifficulty(parseInt(btn.dataset.depth)));
    });

    document.getElementById("vsFriendBtn").addEventListener("click",()=>showGame("friend"));
    document.getElementById("vsAiBtn").addEventListener("click",()=>showGame("ai"));

    document.getElementById("newGameBtn").addEventListener("click",()=>{
        initBoard(); render();
        gameOverOverlay.classList.add("hidden");
    });

    document.getElementById("changeModeBtn").addEventListener("click",()=>{
        modeScreen.classList.remove("hidden");
        gameScreen.classList.add("hidden");
        gameOverOverlay.classList.add("hidden");
    });

    document.getElementById("playAgainBtn").addEventListener("click",()=>{
        modeScreen.classList.remove("hidden");
        gameScreen.classList.add("hidden");
        gameOverOverlay.classList.add("hidden");
    });

    initSupabase();

})();
