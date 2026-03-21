/**
 * Galaxy Assault 3D — Playmix Games
 *
 * Adapted from open-source Space Invaders by Jawad Khan
 * (javascript-games-main, MIT License)
 *
 * Modifications by Playmix Games:
 *  - Neon highway road perspective background
 *  - One miss = instant Game Over (no lives)
 *  - Kill-quota wave system (no score, just survive)
 *  - Remaining count floaters instead of score floaters
 *  - Big glowing enemies with auras
 *  - Particle explosions, shockwave rings
 *  - Supabase session tracking & ad sync
 */

// ─── SUPABASE ────────────────────────────────────────────────────
const SUPA_URL = 'https://bjpgovfzonlmjrruaspp.supabase.co';
const SUPA_KEY = 'sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM';
let _sb = null, _sessionId = null, _sessionStarted = false, _gameStartTime = null, _durationSent = false;
function _getOS() { const u=navigator.userAgent; return /android/i.test(u)?'Android':/iPhone|iPad/i.test(u)?'iOS':/Win/i.test(u)?'Windows':/Mac/i.test(u)?'Mac':'Other'; }
function _getBrowser() { const u=navigator.userAgent; return /Edg/i.test(u)?'Edge':/Chrome/i.test(u)?'Chrome':/Safari/i.test(u)?'Safari':/Firefox/i.test(u)?'Firefox':'Other'; }
function _placement() { const p=new URLSearchParams(location.search); return p.get('utm_content')||p.get('placementid')||'unknown'; }
async function _country() { try{const r=await fetch('https://ipapi.co/json/');const d=await r.json();return d.country_name||'Unknown';}catch{return 'Unknown';} }
async function initSupabase() {
    if (!window.supabase) { setTimeout(initSupabase,600); return; }
    const {createClient}=window.supabase; _sb=createClient(SUPA_URL,SUPA_KEY);
    _sessionId=Date.now().toString(36)+Math.random().toString(36).substr(2,8);
    try { await _sb.from('game_sessions').insert([{ session_id:_sessionId, game_slug:'galaxy_assault', placement_id:_placement(), user_agent:navigator.userAgent, os:_getOS(), browser:_getBrowser(), country:await _country(), started_game:false, bounced:false }]); } catch(e){}
}
async function _markStarted() { if(!_sb||!_sessionId)return; try{await _sb.from('game_sessions').update({started_game:true}).eq('session_id',_sessionId);}catch(e){} }
async function _updateSess(f) { if(!_sb||!_sessionId)return; try{await _sb.from('game_sessions').update(f).eq('session_id',_sessionId);}catch(e){} }
function _sendDuration(reason) {
    if(_gameStartTime&&!_durationSent&&window.trackGameEvent){
        const s=Math.round((Date.now()-_gameStartTime)/1000);
        window.trackGameEvent(`game_duration_galaxy_assault_${s}_${reason}`,{seconds:s,os:_getOS(),placement_id:_placement()});
        _updateSess({duration_seconds:s,bounced:!_sessionStarted,end_reason:reason}); _durationSent=true;
    }
}
window.addEventListener('beforeunload',()=>_sendDuration('tab_close'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)_sendDuration('background');});

// ─── AUDIO ───────────────────────────────────────────────────────
const _ac = new (window.AudioContext||window.webkitAudioContext)();
function _beep(freq,dur,type='sine',vol=0.08){
    if(_ac.state==='suspended')_ac.resume();
    const o=_ac.createOscillator(),g=_ac.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,_ac.currentTime);
    g.gain.setValueAtTime(vol,_ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+dur);
    o.connect(g); g.connect(_ac.destination); o.start(); o.stop(_ac.currentTime+dur);
}
function sfxShoot()   { _beep(900,0.07,'sawtooth',0.05); }
function sfxBoom()    { _beep(90,0.5,'sawtooth',0.2); setTimeout(()=>_beep(50,0.6,'square',0.12),60); }
function sfxMiss()    { _beep(160,0.9,'sawtooth',0.25); _beep(100,1.2,'square',0.15); }
function sfxWin()     { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>_beep(f,0.2,'sine',0.12),i*120)); }

// ─── CANVAS ──────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
function resize() {
    canvas.width  = Math.min(window.innerWidth, 600);
    // Reserve: ~56px top HUD + 60px bottom ad (50px ad + 10px gap)
    canvas.height = Math.min(window.innerHeight - 56 - 60, 700);
    canvas.style.width  = canvas.width  + 'px';
    canvas.style.height = canvas.height + 'px';
}
window.addEventListener('resize', resize); resize();
const W  = () => canvas.width;
const H  = () => canvas.height;
const VY = () => H() * 0.22;  // vanishing point Y
const AY = () => H() - 90;    // arrival line Y

// ─── GAME STATE ──────────────────────────────────────────────────
let isPlaying = false, wave = 1;
let totalWaveEnemies = 0, enemiesKilled = 0, enemiesRemaining = 0;
let spawnedCount = 0;
const waveQuota = w => 10 + w * 5;

// ─── HUD ─────────────────────────────────────────────────────────
const elWave    = document.getElementById('wave-display');
const elRemain  = document.getElementById('enemies-remaining');
const elBar     = document.getElementById('enemy-progress-bar');
const elPill    = document.getElementById('enemies-pill');
const startScreen = document.getElementById('start-screen');
const overScreen  = document.getElementById('game-over-screen');
const resultTitle = document.getElementById('result-title');
const resultDesc  = document.getElementById('result-desc');
const restartBtn  = document.getElementById('restart-btn');
const nextWaveBtn = document.getElementById('next-wave-btn');
document.getElementById('start-btn').onclick = startGame;

function updateHUD() {
    const rem = Math.max(0, enemiesRemaining);
    elWave.textContent   = wave;
    elRemain.textContent = rem;
    const pct = totalWaveEnemies > 0 ? (enemiesKilled / totalWaveEnemies) * 100 : 0;
    if (elBar) elBar.style.width = pct + '%';
    if (elPill) {
        if (rem <= 5 && rem > 0) elPill.classList.add('urgent');
        else elPill.classList.remove('urgent');
    }
}

// ─── INPUT ───────────────────────────────────────────────────────
let mouseX = W()/2, mouseY = AY(), firing = false;
function mapInput(cx, cy) {
    const r  = canvas.getBoundingClientRect();
    mouseX   = (cx - r.left) * (canvas.width  / r.width);
    mouseY   = (cy - r.top)  * (canvas.height / r.height);
}
canvas.addEventListener('mousemove',  e => { if(isPlaying) mapInput(e.clientX, e.clientY); });
canvas.addEventListener('mousedown',  e => { firing=true;  mapInput(e.clientX, e.clientY); });
canvas.addEventListener('mouseup',    () => firing=false);
canvas.addEventListener('touchmove',  e => { e.preventDefault(); mapInput(e.touches[0].clientX,e.touches[0].clientY); }, {passive:false});
canvas.addEventListener('touchstart', e => { firing=true;  mapInput(e.touches[0].clientX,e.touches[0].clientY); },{passive:true});
canvas.addEventListener('touchend',   () => firing=false);

// ─── STARS ───────────────────────────────────────────────────────
let stars = [];
function initStars() {
    stars = [];
    for (let i=0; i<120; i++) stars.push({ x:Math.random()*W(), y:Math.random()*VY()*0.9, r:Math.random()*1.5+0.3, sp:Math.random()*0.4+0.1, b:Math.random() });
}
function drawStars() {
    stars.forEach(s => {
        s.y += s.sp; if(s.y>VY()*0.95){s.y=0; s.x=Math.random()*W();}
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(200,220,255,${0.3+s.b*0.7})`; ctx.fill();
    });
}

// ─── PLAYER ──────────────────────────────────────────────────────
let player = { x:0, y:0, thr:0 };
function initPlayer() { player.x=W()/2; player.y=AY()+10; mouseX=W()/2; mouseY=AY()+10; }
function movePlayer() {
    player.x += (mouseX - player.x) * 0.14;
    player.x  = Math.max(36, Math.min(W()-36, player.x));
    player.thr = (player.thr + 0.25) % (Math.PI*2);
}
function drawPlayer() {
    const px=player.x, py=player.y;
    // Thruster
    const fl = 16 + Math.sin(player.thr)*8;
    const fg = ctx.createLinearGradient(px,py+18,px,py+18+fl);
    fg.addColorStop(0,'rgba(0,220,255,0.95)'); fg.addColorStop(0.6,'rgba(80,80,255,0.4)'); fg.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.ellipse(px,py+22,5,fl*0.55,0,0,Math.PI*2); ctx.fillStyle=fg; ctx.fill();

    ctx.save(); ctx.translate(px,py);
    ctx.shadowColor='#3b82f6'; ctx.shadowBlur=18;
    // Body
    ctx.beginPath(); ctx.moveTo(0,-30); ctx.lineTo(16,14); ctx.lineTo(9,23); ctx.lineTo(-9,23); ctx.lineTo(-16,14); ctx.closePath();
    ctx.fillStyle='#1e3a8a'; ctx.fill(); ctx.strokeStyle='#93c5fd'; ctx.lineWidth=1.5; ctx.stroke();
    // Wings
    ctx.beginPath(); ctx.moveTo(-16,8); ctx.lineTo(-34,24); ctx.lineTo(-16,21); ctx.closePath(); ctx.fillStyle='#1d4ed8'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(16,8);  ctx.lineTo(34,24);  ctx.lineTo(16,21);  ctx.closePath(); ctx.fillStyle='#1d4ed8'; ctx.fill();
    // Cockpit
    ctx.beginPath(); ctx.ellipse(0,-7,6,9,0,0,Math.PI*2);
    ctx.fillStyle='#7dd3fc'; ctx.shadowColor='#bae6fd'; ctx.shadowBlur=10; ctx.fill();
    ctx.shadowBlur=0; ctx.restore();
}

// ─── BULLETS ─────────────────────────────────────────────────────
let bullets=[], shootCD=0;
function tryShoot() {
    if(shootCD>0||bullets.length>=12) return;
    sfxShoot();
    bullets.push({x:player.x, y:player.y-28, vy:-15});
    shootCD=7;
}
function updateBullets() {
    shootCD=Math.max(0,shootCD-1);
    for(let i=bullets.length-1;i>=0;i--){ bullets[i].y+=bullets[i].vy; if(bullets[i].y<-30) bullets.splice(i,1); }
}
function drawBullets() {
    bullets.forEach(b=>{
        const g=ctx.createLinearGradient(b.x,b.y,b.x,b.y+30);
        g.addColorStop(0,'#00e5ff'); g.addColorStop(0.5,'#38bdf8'); g.addColorStop(1,'transparent');
        ctx.save(); ctx.shadowColor='#00e5ff'; ctx.shadowBlur=14;
        ctx.fillStyle=g; ctx.beginPath();
        ctx.rect(b.x-3,b.y,6,30); ctx.fill();
        ctx.shadowBlur=0; ctx.restore();
    });
}

// ─── ENEMIES ─────────────────────────────────────────────────────
const ETYPES = [
    { label:'GRUNT',  emoji:'👾', hp:1, speed:0.4,  color:'#a855f7', sz:54 },
    { label:'SAUCER', emoji:'🛸', hp:2, speed:0.32, color:'#f97316', sz:62 },
    { label:'COMET',  emoji:'☄️', hp:1, speed:0.65, color:'#ef4444', sz:50 },
    { label:'MECH',   emoji:'🤖', hp:3, speed:0.25, color:'#10b981', sz:60 },
    { label:'DEMON',  emoji:'👹', hp:4, speed:0.22, color:'#f43f5e', sz:66 },
];

let enemies=[], spawnTimer=0;
function getET(w) { return ETYPES[Math.floor(Math.random()*Math.min(ETYPES.length, 2+Math.floor(w/2)))]; }
function spawnEnemy() {
    if(spawnedCount>=totalWaveEnemies) return;
    const t=getET(wave);
    enemies.push({...t, maxHp:t.hp, x:0.15+Math.random()*0.7, progress:0, hit:0, gp:Math.random()*Math.PI*2});
    spawnedCount++;
}
function getEPos(e) {
    const sy = VY() + (AY() - VY()) * e.progress;
    const sx = W()/2 + (e.x - 0.5) * W() * (0.18 + e.progress * 0.82);
    const sc = 0.1  + e.progress * 0.9;
    return {sx, sy, sc};
}
function updateEnemies() {
    const si = Math.max(22, 90 - wave*4);
    spawnTimer++;
    if(spawnTimer>=si){ spawnEnemy(); spawnTimer=0; }
    for(let i=enemies.length-1;i>=0;i--){
        const e=enemies[i];
        e.progress += e.speed * (0.0015 + wave * 0.0002);
        e.gp += 0.09;
        if(e.hit>0) e.hit--;
        if(e.progress>=1.02){
            enemies.splice(i,1);
            // ONE MISS = INSTANT GAME OVER
            handleGameOver('miss');
            return;
        }
    }
}
function drawEnemies() {
    [...enemies].sort((a,b)=>a.progress-b.progress).forEach(e=>{
        const {sx,sy,sc}=getEPos(e);
        const ds=e.sz*sc;
        ctx.save(); ctx.translate(sx,sy);
        // Aura glow
        const ar=ds*1.0, ag=0.35+Math.sin(e.gp)*0.18;
        const aura=ctx.createRadialGradient(0,0,0,0,0,ar);
        aura.addColorStop(0, e.color+Math.floor(ag*180).toString(16).padStart(2,'0'));
        aura.addColorStop(1, e.color+'00');
        ctx.fillStyle=aura; ctx.beginPath(); ctx.arc(0,0,ar,0,Math.PI*2); ctx.fill();
        if(e.hit>0) ctx.filter='brightness(4) saturate(0)';
        // HP bar
        if(sc>0.28){
            const bw=ds*1.5, bh=Math.max(4,7*sc), by=-ds*0.65-bh-3;
            ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(-bw/2,by,bw,bh);
            const hpC=e.hp/e.maxHp>0.6?'#4ade80':e.hp/e.maxHp>0.3?'#facc15':'#f43f5e';
            ctx.fillStyle=hpC; ctx.shadowColor=hpC; ctx.shadowBlur=5;
            ctx.fillRect(-bw/2,by,bw*(e.hp/e.maxHp),bh); ctx.shadowBlur=0;
        }
        // Emoji
        ctx.font=`${ds*1.45}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.shadowColor=e.color; ctx.shadowBlur=22*sc;
        ctx.fillText(e.emoji,0,0); ctx.shadowBlur=0;
        // Label
        if(sc>0.5){
            ctx.fillStyle='rgba(255,255,255,0.8)';
            ctx.font=`bold ${Math.round(11*sc)}px Outfit,sans-serif`;
            ctx.fillText(e.label,0,ds*0.72);
        }
        ctx.filter='none'; ctx.restore();
    });
}

// ─── PARTICLES ───────────────────────────────────────────────────
let particles=[], floaters=[];
function explode(x,y,color){
    for(let i=0;i<24;i++){
        const a=(Math.PI*2/24)*i, sp=Math.random()*5+2;
        particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.5,life:1,color,r:Math.random()*5+2});
    }
    particles.push({x,y,vx:0,vy:0,life:0.7,color:'#fff',r:10,ring:true,gr:7});
}
function updateParticles(){
    for(let i=particles.length-1;i>=0;i--){
        const p=particles[i];
        if(p.ring){p.r+=p.gr;p.life-=0.055;}
        else{p.x+=p.vx;p.y+=p.vy;p.vy+=0.09;p.life-=0.026;}
        if(p.life<=0) particles.splice(i,1);
    }
}
function drawParticles(){
    particles.forEach(p=>{
        ctx.save(); ctx.globalAlpha=Math.max(0,p.life);
        if(p.ring){ctx.strokeStyle=p.color;ctx.lineWidth=3;ctx.shadowColor=p.color;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.stroke();}
        else{ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);ctx.fill();}
        ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
    });
}

// Remaining count floater: shows "X left!" after each kill
function spawnFloater(x,y,rem){
    floaters.push({x,y,rem,age:0});
}
function updateFloaters(){
    for(let i=floaters.length-1;i>=0;i--){ floaters[i].age+=0.022; floaters[i].y-=1.4; if(floaters[i].age>=1) floaters.splice(i,1); }
}
function drawFloaters(){
    floaters.forEach(f=>{
        ctx.save(); ctx.globalAlpha=Math.max(0,1-f.age);
        const isLast = f.rem===0;
        ctx.fillStyle  = isLast ? '#4ade80' : '#facc15';
        ctx.shadowColor= isLast ? '#4ade80' : '#facc15';
        ctx.shadowBlur =12;
        ctx.font=`bold 22px Outfit,Arial`; ctx.textAlign='center';
        ctx.fillText(isLast ? '★ ALL CLEAR!' : `${f.rem} left!`, f.x, f.y);
        ctx.shadowBlur=0; ctx.globalAlpha=1; ctx.restore();
    });
}

// ─── COLLISION ───────────────────────────────────────────────────
function checkHits(){
    for(let bi=bullets.length-1;bi>=0;bi--){
        const b=bullets[bi];
        for(let ei=enemies.length-1;ei>=0;ei--){
            const e=enemies[ei]; const {sx,sy,sc}=getEPos(e);
            const hr=(e.sz*0.55)*sc, dx=b.x-sx, dy=b.y-sy;
            if(dx*dx+dy*dy<hr*hr){
                e.hp--; e.hit=8; bullets.splice(bi,1);
                if(e.hp<=0){
                    sfxBoom(); explode(sx,sy,e.color);
                    enemies.splice(ei,1);
                    enemiesKilled++;
                    enemiesRemaining=Math.max(0,totalWaveEnemies-enemiesKilled);
                    // Floater shows how many still remain
                    spawnFloater(sx,sy-35,enemiesRemaining);
                    updateHUD();
                    if(enemiesKilled>=totalWaveEnemies&&enemies.length===0){ handleWin(); return; }
                }
                break;
            }
        }
    }
}

// ─── SHAKE ───────────────────────────────────────────────────────
let shakeMag=0;
function shake(m){ shakeMag=m; }

// ─── MISS FLASH ──────────────────────────────────────────────────
let missFlash = 0;  // red screen flash on miss

// ─── GAME FLOW ───────────────────────────────────────────────────
function handleWin(){
    isPlaying=false; sfxWin();
    wave++;
    resultTitle.innerText='🏆 Wave Cleared!';
    resultTitle.style.color='#4ade80';
    resultDesc.innerHTML=`All ${totalWaveEnemies} enemies destroyed!<br>Wave ${wave} incoming — they're meaner now.`;
    nextWaveBtn.classList.remove('hidden');
    restartBtn.classList.add('hidden');
    overScreen.classList.remove('hidden');
    nextWaveBtn.onclick=()=>{ if(typeof syncPMGLayout==='function') syncPMGLayout(); overScreen.classList.add('hidden'); startRound(); };
}

function handleGameOver(reason='miss'){
    isPlaying=false; sfxMiss(); shake(22); missFlash=30;
    const why = reason==='miss' ? '💀 One escaped — Mission Failed!' : '💀 Mission Failed!';
    resultTitle.innerText=why;
    resultTitle.style.color='#f43f5e';
    resultDesc.innerHTML=`Wave ${wave} · Killed: ${enemiesKilled} / ${totalWaveEnemies}`;
    nextWaveBtn.classList.add('hidden');
    restartBtn.classList.remove('hidden');
    overScreen.classList.remove('hidden');
    wave=1;
    restartBtn.onclick=()=>{ if(typeof syncPMGLayout==='function') syncPMGLayout(); startGame(); };
}

function initScene(){
    initStars(); initPlayer();
    enemies=[]; bullets=[]; particles=[]; floaters=[];
    spawnTimer=0; shootCD=0; spawnedCount=0;
    totalWaveEnemies=waveQuota(wave);
    enemiesKilled=0; enemiesRemaining=totalWaveEnemies;
}

function startRound(){ isPlaying=true; initScene(); updateHUD(); }

function startGame(){
    if(!_sessionStarted){ _gameStartTime=Date.now(); _sessionStarted=true; initSupabase().then(_markStarted); }
    wave=1; startScreen.classList.add('hidden'); overScreen.classList.add('hidden'); startRound();
}

// ─── BACKGROUND: NEON HIGHWAY ─────────────────────────────────────
function drawRoad(){
    const vx=W()/2, vy=VY(), ay=H();
    // Sky gradient above horizon
    const sky=ctx.createLinearGradient(0,0,0,vy);
    sky.addColorStop(0,'#010209');
    sky.addColorStop(1,'#0a0f2e');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W(),vy);

    // Stars only above horizon
    drawStars();

    // Road surface below horizon
    const road=ctx.createLinearGradient(0,vy,0,ay);
    road.addColorStop(0,'#0d0d1a');
    road.addColorStop(0.5,'#111128');
    road.addColorStop(1,'#0a0a18');
    ctx.fillStyle=road;
    ctx.beginPath(); ctx.moveTo(0,vy); ctx.lineTo(W(),vy); ctx.lineTo(W(),ay); ctx.lineTo(0,ay); ctx.closePath();
    ctx.fill();

    // Road edges (perspective trapezoid)
    const roadL_top = vx - W()*0.08, roadR_top = vx + W()*0.08;
    const roadL_bot = vx - W()*0.48, roadR_bot = vx + W()*0.48;

    // Road fill polygon
    const roadFill=ctx.createLinearGradient(0,vy,0,ay);
    roadFill.addColorStop(0,'#12121f');
    roadFill.addColorStop(1,'#1a1a2e');
    ctx.fillStyle=roadFill;
    ctx.beginPath(); ctx.moveTo(roadL_top,vy); ctx.lineTo(roadR_top,vy); ctx.lineTo(roadR_bot,ay); ctx.lineTo(roadL_bot,ay); ctx.closePath();
    ctx.fill();

    // Road border glow lines
    ctx.save();
    ctx.shadowColor='#3b82f6'; ctx.shadowBlur=12; ctx.strokeStyle='#3b82f6'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(roadL_top,vy); ctx.lineTo(roadL_bot,ay); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(roadR_top,vy); ctx.lineTo(roadR_bot,ay); ctx.stroke();
    ctx.restore();

    // Dashed centre line (perspective)
    const dashCount = 10;
    for(let d=0;d<dashCount;d++){
        const t0 = d/dashCount, t1 = (d+0.45)/dashCount;
        const y0 = vy+(ay-vy)*t0, y1 = vy+(ay-vy)*t1;
        const x0 = vx, x1 = vx;
        const wd = 1.5 + t0*3;
        const alpha = 0.3 + t0*0.5;
        ctx.strokeStyle=`rgba(250,204,21,${alpha})`; ctx.lineWidth=wd;
        ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
    }

    // Lane lines left & right of centre
    [-0.35, 0.35].forEach(offset=>{
        for(let d=0;d<dashCount;d++){
            const t0=d/dashCount, t1=(d+0.45)/dashCount;
            const y0=vy+(ay-vy)*t0, y1=vy+(ay-vy)*t1;
            const laneW = W()*Math.abs(offset)*0.8;
            const x0=vx+offset*(W()*0.08*2 + laneW*(t0)), x1=vx+offset*(W()*0.08*2 + laneW*(t1));
            const alpha=0.15+t0*0.35;
            ctx.strokeStyle=`rgba(100,150,255,${alpha})`; ctx.lineWidth=1+t0*2;
            ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
        }
    });

    // Horizon glow
    const hg=ctx.createRadialGradient(vx,vy,0,vx,vy,W()*0.55);
    hg.addColorStop(0,'rgba(59,130,246,0.22)'); hg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=hg; ctx.fillRect(0,0,W(),H());

    // Danger line at arrival
    ctx.save();
    ctx.shadowColor='rgba(239,68,68,0.6)'; ctx.shadowBlur=8;
    ctx.strokeStyle='rgba(239,68,68,0.45)'; ctx.lineWidth=1.5;
    ctx.setLineDash([8,8]); ctx.beginPath(); ctx.moveTo(0,AY()); ctx.lineTo(W(),AY()); ctx.stroke();
    ctx.setLineDash([]); ctx.shadowBlur=0; ctx.restore();

    // "ARRIVAL ZONE" text
    ctx.save(); ctx.fillStyle='rgba(239,68,68,0.45)';
    ctx.font='bold 11px Outfit,Arial'; ctx.textAlign='right';
    ctx.fillText('⚠ ARRIVAL ZONE', W()-8, AY()-4);
    ctx.restore();
}

// ─── KILL PROGRESS BAR (bottom of canvas) ────────────────────────
function drawKillBar(){
    const rem=Math.max(0,enemiesRemaining);
    const pct=totalWaveEnemies>0?(enemiesKilled/totalWaveEnemies):0;
    const bh=28, by=H()-bh;
    // BG
    ctx.fillStyle='rgba(0,0,0,0.72)'; ctx.fillRect(0,by,W(),bh);
    // Fill
    const fc=pct>0.8?'#4ade80':pct>0.4?'#facc15':'#f43f5e';
    ctx.fillStyle=fc; ctx.shadowColor=fc; ctx.shadowBlur=8;
    ctx.fillRect(0,by,W()*pct,bh);
    ctx.shadowBlur=0;
    // Text
    ctx.fillStyle='#fff'; ctx.font='bold 13px Outfit,Arial';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const msg=rem>0?`☠ ${rem} enemies remaining — DESTROY THEM ALL!`:'🏆 ALL ENEMIES DEAD!';
    ctx.fillText(msg, W()/2, by+bh/2);
}

// ─── MAIN LOOP ───────────────────────────────────────────────────
function loop(){
    requestAnimationFrame(loop);

    // Miss flash
    if(missFlash>0){
        ctx.fillStyle=`rgba(239,68,68,${(missFlash/30)*0.45})`;
        ctx.fillRect(0,0,W(),H());
        missFlash--;
    }

    if(!isPlaying) return;
    if(firing) tryShoot();

    // Shake
    let shook=false;
    if(shakeMag>0){
        const ox=(Math.random()-0.5)*shakeMag, oy=(Math.random()-0.5)*shakeMag;
        shakeMag=Math.max(0,shakeMag-1.5);
        ctx.save(); ctx.translate(ox,oy); shook=true;
    }

    drawRoad();
    updateBullets();   drawBullets();
    updateEnemies();   drawEnemies();
    checkHits();
    updateParticles(); drawParticles();
    updateFloaters();  drawFloaters();
    movePlayer();      drawPlayer();
    drawKillBar();

    if(shook) ctx.restore();
}

// ─── BOOT ────────────────────────────────────────────────────────
initScene(); loop();
startScreen.classList.add('hidden');   // skip start screen
overScreen.classList.add('hidden');
startGame();                           // auto-start immediately
