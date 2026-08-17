// ==========================================================
// DOM + UTILITY
// ==========================================================
var Dom = {
    get: function(id) { return ((id instanceof HTMLElement) || (id === document) || (id === window)) ? id : document.getElementById(id); },
    set: function(id, html) { Dom.get(id).innerHTML = html; },
    on: function(ele, type, fn, capture) { Dom.get(ele).addEventListener(type, fn, capture); },
    show: function(ele, type) { Dom.get(ele).style.display = (type || 'block'); },
    storage: window.localStorage || {}
};

var Util = {
    timestamp:       function() { return performance.now(); },
    toInt:           function(obj, def) { if (obj !== null) { var x = parseInt(obj, 10); if (!isNaN(x)) return x; } return Util.toInt(def, 0); },
    toFloat:         function(obj, def) { if (obj !== null) { var x = parseFloat(obj); if (!isNaN(x)) return x; } return Util.toFloat(def, 0.0); },
    limit:           function(value, min, max) { return Math.max(min, Math.min(value, max)); },
    randomInt:       function(min, max) { return Math.round(Util.interpolate(min, max, Math.random())); },
    randomChoice:    function(options) { return options[Util.randomInt(0, options.length-1)]; },
    percentRemaining:function(n, total) { return (n % total) / total; },
    accelerate:      function(v, accel, dt) { return v + (accel * dt); },
    interpolate:     function(a, b, percent) { return a + (b-a)*percent; },
    easeIn:          function(a, b, percent) { return a + (b-a)*Math.pow(percent,2); },
    easeOut:         function(a, b, percent) { return a + (b-a)*(1-Math.pow(1-percent,2)); },
    easeInOut:       function(a, b, percent) { return a + (b-a)*((-Math.cos(percent*Math.PI)/2)+0.5); },
    exponentialFog:  function(distance, density) { return 1 - (1/(Math.pow(Math.E, (distance*distance*density)))); },
    increase:        function(start, increment, max) {
        var result = start + increment;
        while (result >= max) result -= max;
        while (result < 0)    result += max;
        return result;
    },
    project: function(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
        p.camera.x  = (p.world.x || 0) - cameraX;
        p.camera.y  = (p.world.y || 0) - cameraY;
        p.camera.z  = (p.world.z || 0) - cameraZ;
        p.screen.scale = cameraDepth / p.camera.z;
        p.screen.x  = Math.round((width/2)  + (p.screen.scale * p.camera.x * width/2));
        p.screen.y  = Math.round((height/2) - (p.screen.scale * p.camera.y * height/2));
        p.screen.w  = Math.round(              (p.screen.scale * roadWidth  * width/2));
    },
    overlap: function(x1, w1, x2, w2, percent) {
        var half = (percent||1)/2;
        var min1 = x1 - w1*half, max1 = x1 + w1*half;
        var min2 = x2 - w2*half, max2 = x2 + w2*half;
        return !((max1 < min2) || (min1 > max2));
    }
};

// ==========================================================
// GAME ENGINE
// ==========================================================
var Game = {
    run: function(options) {
        Game.setKeyListener(options.keys);
        var canvas = options.canvas, update = options.update, render = options.render, step = options.step, last = Util.timestamp(), now;
        function loop() { now = Util.timestamp(); var dt = Math.min(1, (now - last) / 1000); while(dt > step) { dt -= step; update(step); } render(); last = now; requestAnimationFrame(loop); }
        loop();
    },
    setKeyListener: function(keys) {
        window.addEventListener('keydown', function(ev) {
            for(var n=0; n<keys.length; n++) {
                var k = keys[n];
                if(k.mode === 'down' && (k.keys.indexOf(ev.keyCode) !== -1 || k.keys.indexOf(ev.key) !== -1)) {
                    k.action();
                    return ev.preventDefault();
                }
            }
        }, false);
        window.addEventListener('keyup', function(ev) {
            for(var n=0; n<keys.length; n++) {
                var k = keys[n];
                if(k.mode === 'up' && (k.keys.indexOf(ev.keyCode) !== -1 || k.keys.indexOf(ev.key) !== -1)) {
                    k.action();
                    return ev.preventDefault();
                }
            }
        }, false);
    }
};

// ==========================================================
// GRAPHICS + COLORS
// ==========================================================
var COLORS = {
    SKY:    '#87CEEB',
    TREE:   '#27ae60',
    FOG:    '#d0eef8',
    LIGHT:  { road: '#444444', grass: '#1DB954', rumble: '#E83030', lane: '#FFFFFF' },
    DARK:   { road: '#333333', grass: '#17934A', rumble: '#BBBBBB' },
    START:  { road: '#FFFFFF', grass: '#FFFFFF', rumble: '#FFFFFF' },
    FINISH: { road: '#111111', grass: '#111111', rumble: '#111111' }
};

var SPRITES = {
    PALM_TREE:              { w:  100, h: 300, type: 'tree',   c1: '#2ecc71', c2: '#795548' },
    TREE1:                  { w:  150, h: 250, type: 'tree',   c1: '#27ae60', c2: '#5d4037' },
    TREE2:                  { w:  140, h: 280, type: 'tree',   c1: '#2ecc71', c2: '#4e342e' },
    ROCK:                   { w:   90, h:  60, type: 'rock',   c1: '#666',    isObstacle: true },
    BARREL:                 { w:   50, h:  80, type: 'barrel', c1: '#c0392b', c2: '#222', isObstacle: true },
    CONE:                   { w:   40, h:  80, type: 'cone',   c1: '#e67e22', c2: '#fff', isObstacle: true },
    PLAYER_STRAIGHT:        { w:   80, h:  41, type: 'player', c1: '#e74c3c' },
    PLAYER_LEFT:            { w:   80, h:  41, type: 'player', c1: '#e74c3c' },
    PLAYER_RIGHT:           { w:   80, h:  41, type: 'player', c1: '#e74c3c' }
};
SPRITES.SCALE = 0.3 * (1/80);
SPRITES.PLANTS = [SPRITES.TREE1, SPRITES.TREE2, SPRITES.PALM_TREE];

var Render = {
    polygon: function(ctx, x1,y1, x2,y2, x3,y3, x4,y4, color) { ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.lineTo(x4,y4); ctx.fill(); },
    segment: function(ctx, width, lanes, x1,y1,w1, x2,y2,w2, fog, color) {
        var r1 = w1/10, r2 = w2/10, l1 = w1/40, l2 = w2/40;
        ctx.fillStyle = color.grass; ctx.fillRect(0, y2, width, y1 - y2);
        Render.polygon(ctx, x1-w1-r1, y1, x1-w1, y1, x2-w2, y2, x2-w2-r2, y2, color.rumble);
        Render.polygon(ctx, x1+w1+r1, y1, x1+w1, y1, x2+w2, y2, x2+w2+r2, y2, color.rumble);
        Render.polygon(ctx, x1-w1, y1, x1+w1, y1, x2+w2, y2, x2-w2, y2, color.road);
        if (color.lane) {
            var lw1 = w1*2/lanes, lw2 = w2*2/lanes;
            var lx1 = x1-w1+lw1, lx2 = x2-w2+lw2;
            for(var l=1; l<lanes; lx1+=lw1, lx2+=lw2, l++) Render.polygon(ctx, lx1-l1/2, y1, lx1+l1/2, y1, lx2+l2/2, y2, lx2-l2/2, y2, color.lane);
        }
        if (fog > 0) { ctx.globalAlpha = fog; ctx.fillStyle = COLORS.FOG; ctx.fillRect(0, y2, width, y1 - y2); ctx.globalAlpha = 1; }
    },
    sprite: function(ctx, width, height, resolution, roadWidth, sprite, scale, destX, destY, offsetX, offsetY, clipY) {
        var destW = (sprite.w * scale * width/2) * (SPRITES.SCALE * roadWidth);
        var destH = (sprite.h * scale * width/2) * (SPRITES.SCALE * roadWidth);
        destX += (destW * (offsetX || 0)); destY += (destH * (offsetY || 0));
        var clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
        if (clipH >= destH) return;
        ctx.save(); ctx.beginPath(); ctx.rect(destX, destY, destW, destH - clipH); ctx.clip();
        if (sprite.type === 'tree') {
            ctx.fillStyle = sprite.c2; ctx.fillRect(destX + destW*0.42, destY + destH*0.55, destW*0.16, destH*0.45);
            ctx.fillStyle = sprite.c1; for(var t=0; t<3; t++){ var ty=t*destH*0.18; ctx.beginPath(); ctx.moveTo(destX+destW/2, destY+ty); ctx.lineTo(destX, destY+destH*0.35+ty); ctx.lineTo(destX+destW, destY+destH*0.35+ty); ctx.fill(); }
        } else if (sprite.type === 'barrel') {
            ctx.fillStyle = sprite.c1; ctx.beginPath(); ctx.ellipse(destX+destW/2, destY+destH*0.1, destW*0.45, destH*0.12, 0, 0, Math.PI*2); ctx.fill(); ctx.fillRect(destX+destW*0.08, destY+destH*0.1, destW*0.84, destH*0.8);
            ctx.fillStyle = sprite.c2; ctx.fillRect(destX+destW*0.08, destY+destH*0.28, destW*0.84, destH*0.1);
        } else if (sprite.type === 'cone') {
            ctx.fillStyle = sprite.c1; ctx.beginPath(); ctx.moveTo(destX+destW/2, destY); ctx.lineTo(destX+destW*0.05, destY+destH*0.85); ctx.lineTo(destX+destW*0.95, destY+destH*0.85); ctx.fill();
            ctx.fillStyle = '#333'; ctx.fillRect(destX, destY+destH*0.85, destW, destH*0.15);
        } else if (sprite.type === 'rock') {
            ctx.fillStyle = sprite.c1; ctx.beginPath(); ctx.ellipse(destX + destW/2, destY + destH, destW/2, destH*0.75, 0, Math.PI, 0); ctx.fill();
        } else if (sprite.type === 'player') {
            ctx.fillStyle = sprite.c1; ctx.fillRect(destX + destW*0.08, destY + destH*0.42, destW*0.84, destH*0.5);
            ctx.fillStyle = '#fff5f5'; ctx.fillRect(destX + destW*0.22, destY + destH*0.1, destW*0.56, destH*0.36);
            ctx.fillStyle = '#111'; ctx.fillRect(destX + destW*0.01, destY + destH*0.68, destW*0.25, destH*0.3); ctx.fillRect(destX + destW*0.74, destY + destH*0.68, destW*0.25, destH*0.3);
        }
        ctx.restore();
    }
};

// ==========================================================
// GAME STATE
// ==========================================================
var fps = 60, step = 1/fps, width = 800, height = 600, centrifugal = 0.3, offRoadLimit = 2000, skyOffset = 0, segments = [], canvas = Dom.get('canvas'), ctx = canvas.getContext('2d');
var roadWidth = 2000, segmentLength = 200, rumbleLength = 3, trackLength = 0, lanes = 3, fieldOfView = 100, cameraHeight = 1000, cameraDepth = null, drawDistance = 300;
var playerX = 0, playerZ = null, fogDensity = 2, position = 0, speed = 0, maxSpeed = 12000, accel = maxSpeed/5, breaking = -maxSpeed, decel = -maxSpeed/5;
var currentLevel = Util.toInt(Dom.storage['CarRace_Level'], 1);
if (currentLevel > 15) { currentLevel = 1; Dom.storage['CarRace_Level'] = '1'; } // Reset if glitched
var currentLapTime = 0, raceFinished = false, TIME_LIMIT = 90, timeRemaining = TIME_LIMIT, hitCooldown = 0;
var gameRecordTime = Date.now();
var keyLeft = false, keyRight = false, keyFaster = false, keySlower = false;
var hudElements = {};

function updateHud(id, value) { if(!hudElements[id]) hudElements[id]=Dom.get(id); var el=hudElements[id]; if(el && el.innerText!==String(value)) el.innerText=value; }
function formatTime(dt) { var m=Math.floor(dt/60), s=Math.floor(dt%60), t=Math.floor(10*(dt-Math.floor(dt))); return (m>0?m+'.':'')+(s<10?'0':'')+s+'.'+t; }

function resetRoad() {
    segments = [];
    var addSeg = function(c,y){ var n=segments.length; segments.push({index:n, p1:{world:{y:n?segments[n-1].p2.world.y:0, z:n*segmentLength}, camera:{}, screen:{}}, p2:{world:{y:y, z:(n+1)*segmentLength}, camera:{}, screen:{}}, curve:c, sprites:[], color:Math.floor(n/rumbleLength)%2?COLORS.DARK:COLORS.LIGHT}); };
    var addRoad = function(en,h,le,c,y){ var sY=segments.length?segments[segments.length-1].p2.world.y:0, eY=sY+(y*segmentLength), t=en+h+le; for(var n=0;n<en;n++) addSeg(Util.easeIn(0,c,n/en), Util.easeInOut(sY,eY,n/t)); for(var n=0;n<h;n++) addSeg(c, Util.easeInOut(sY,eY,(en+n)/t)); for(var n=0;n<le;n++) addSeg(Util.easeInOut(c,0,n/le), Util.easeInOut(sY,eY,(en+h+n)/t)); };
    
    // Level scaling: 1-10 easy, > 10 harder
    var numCurves = Math.max(3, Math.floor(currentLevel / 3) + 3);
    addRoad(100,100,100,0,0);
    for (var i = 0; i < numCurves; i++) {
        var isHardCurve = currentLevel > 10 && Math.random() > 0.5;
        var curveForce = isHardCurve ? Util.randomChoice([-5,-4,4,5]) : Util.randomChoice([-3,-2,-1,1,2,3]);
        var hillForce = isHardCurve ? Util.randomInt(-50, 50) : Util.randomInt(-20, 20);
        addRoad(100, Util.randomInt(100, 200), 100, curveForce, hillForce);
    }
    addRoad(100,100,100,0,0);
    
    var obsList = [SPRITES.ROCK, SPRITES.BARREL, SPRITES.CONE];
    for(var n=10; n<segments.length; n+=5) segments[n].sprites.push({source:Util.randomChoice(SPRITES.PLANTS), offset:Util.randomChoice([1.5,-1.5, 2.0, -2.0])});
    
    var obsFreq = currentLevel <= 10 ? Util.randomInt(40, 70) : Math.max(15, 40 - Math.floor((currentLevel - 10) * 1.5));
    for(var n=150; n<segments.length-50; n+=Util.randomInt(Math.floor(obsFreq*0.7), obsFreq)) {
        segments[n].sprites.push({source:Util.randomChoice(obsList), offset:Util.randomChoice([-0.5, 0, 0.5])});
    }

    for(var i=0; i<3; i++) segments[i+2].color = COLORS.START;
    for(var i=0; i<rumbleLength; i++) segments[segments.length-1-i].color = COLORS.FINISH;
    trackLength = segments.length * segmentLength;
    timeRemaining = TIME_LIMIT = Math.floor((trackLength / maxSpeed) * step * 100) + 15;
}

function update(dt) {
    if (window.gamePaused || raceFinished) return;
    
    var secondsPlayed = Math.round((Date.now() - gameRecordTime) / 1000);
    if (secondsPlayed > (window.PMG_TICK_RATE || 60)) {
        if(typeof syncPMGLayout === 'function') syncPMGLayout();
        gameRecordTime = Date.now();
    }

    var playerSeg = segments[Math.floor((position+playerZ)/segmentLength)%segments.length];
    var speedPct = speed/maxSpeed, dx = dt*2*speedPct;
    position = Util.increase(position, dt*speed, trackLength);
    skyOffset = Util.increase(skyOffset, 0.001 * playerSeg.curve * speedPct, 1);
    if(keyLeft) playerX -= dx; if(keyRight) playerX += dx;
    playerX -= (dx * speedPct * playerSeg.curve * centrifugal);
    if(keyFaster) speed = Util.accelerate(speed, accel, dt); else if(keySlower) speed = Util.accelerate(speed, breaking, dt); else speed = Util.accelerate(speed, decel, dt);
    if(Math.floor(position)%60===0) console.log('Update Loop:', {keyFaster, speed, windowGamePaused:window.gamePaused});
    if((playerX<-1 || playerX>1) && speed > maxSpeed/4) speed = Util.accelerate(speed, -maxSpeed/2, dt);
    if(hitCooldown > 0) hitCooldown -= dt;
    else {
        for(var n=0; n<playerSeg.sprites.length; n++) {
            var s = playerSeg.sprites[n]; if(!s.source.isObstacle) continue;
            // Shrunk hitbox logic (w1: 0.2, w2: 0.2, percent: 0.6) for fairer near-misses
            if(Util.overlap(playerX, 0.2, s.offset, 0.2, 0.6)) {
                timeRemaining-=8; speed=maxSpeed/6; position=Util.increase(position, -playerZ*2, trackLength); hitCooldown=1.5;
                if(hudElements['hud']) { hudElements['hud'].classList.add('hud-hit'); setTimeout(function(){hudElements['hud'].classList.remove('hud-hit');},400); }
                break;
            }
        }
    }
    playerX = Util.limit(playerX, -3, 3); 
    speed = Util.limit(speed, 0, maxSpeed); 
    currentLapTime += dt; 
    timeRemaining -= dt;

    if(timeRemaining <= 0) { 
        timeRemaining=0; raceFinished=true; window.gamePaused=true; 
        Dom.get('menu-title').innerHTML='⏰ TIME\'S UP!'; 
        Dom.get('start-btn').innerText = 'RETRY LEVEL';
        Dom.get('main-menu').classList.remove('hidden'); 
    }
    updateHud('speed_value', Math.round(speedPct*100)); updateHud('timer_value', Math.max(0, Math.ceil(timeRemaining))); updateHud('current_lap_time_value', formatTime(currentLapTime)); updateHud('distance_value', Math.max(0, (trackLength-position)/5000).toFixed(2));
    updateHud('level_value', currentLevel);
    
    // Safety guard > 5000 prevents false positive immediately after reset
    if(position > 5000 && position >= trackLength-segmentLength*5) { 
        raceFinished=true; window.gamePaused=true; 
        currentLevel++;
        Dom.storage['CarRace_Level'] = currentLevel.toString();
        Dom.get('menu-title').innerHTML='🎖️ LEVEL COMPLETED!'; 
        Dom.get('start-btn').innerText = 'NEXT LEVEL';
        Dom.get('main-menu').classList.remove('hidden'); 
    }
}

function render() {
    var baseSeg = segments[Math.floor(position/segmentLength)%segments.length];
    var basePct = Util.percentRemaining(position, segmentLength), playerSeg = segments[Math.floor((position+playerZ)/segmentLength)%segments.length];
    var pPct=Util.percentRemaining(position+playerZ, segmentLength), pY=Util.interpolate(playerSeg.p1.world.y, playerSeg.p2.world.y, pPct);
    var maxy = height, x=0, dx=-(baseSeg.curve*basePct); ctx.clearRect(0,0,width,height);
    ctx.fillStyle=COLORS.SKY; ctx.fillRect(0,0,width,height/2);
    ctx.fillStyle='#5D9E5A'; ctx.beginPath(); ctx.moveTo(0, height/2); for(var i=0;i<=width;i+=50) ctx.lineTo(i, height/2-80+Math.sin((i+skyOffset*200)*0.008)*60); ctx.lineTo(width,height/2); ctx.fill();
    for(var n=0; n<drawDistance; n++) {
        var seg = segments[(baseSeg.index+n)%segments.length]; 
        seg.looped = seg.index < baseSeg.index; 
        seg.fog = 0; // Temporarily disable fog for visibility
        seg.clip = maxy;
        Util.project(seg.p1, (playerX*roadWidth)-x, pY+cameraHeight, position-(seg.looped?trackLength:0), cameraDepth, width, height, roadWidth);
        Util.project(seg.p2, (playerX*roadWidth)-x-dx, pY+cameraHeight, position-(seg.looped?trackLength:0), cameraDepth, width, height, roadWidth);
        x+=dx; dx+=seg.curve;
        if(seg.p1.camera.z <= cameraDepth || seg.p2.screen.y >= seg.p1.screen.y || seg.p2.screen.y >= maxy) continue;
        Render.segment(ctx, width, lanes, seg.p1.screen.x, seg.p1.screen.y, seg.p1.screen.w, seg.p2.screen.x, seg.p2.screen.y, seg.p2.screen.w, 0, seg.color);
        maxy = seg.p1.screen.y;
    }
    for(var n=drawDistance-1; n>=0; n--) {
        var seg = segments[(baseSeg.index+n)%segments.length];
        for(var i=0; i<seg.sprites.length; i++) { var s=seg.sprites[i], ss=seg.p1.screen.scale, sx=seg.p1.screen.x+(ss*s.offset*roadWidth*width/2), sy=seg.p1.screen.y; Render.sprite(ctx, width, height, 1, roadWidth, s.source, ss, sx, sy, (s.offset<0?-1:0), -1, seg.clip); }
        if(seg === playerSeg) Render.sprite(ctx, width, height, 1, roadWidth, SPRITES.PLAYER_STRAIGHT, cameraDepth/playerZ, width/2, (height/2)-(cameraDepth/playerZ * Util.interpolate(playerSeg.p1.camera.y, playerSeg.p2.camera.y, pPct) * height/2), -0.5, -1, seg.clip);
    }
    // Progress Bar (Top)
    var pct = Math.min(position/trackLength, 1), bX=width/4, bY=55, bW=width/2, bH=8, f=Math.floor(pct*bW);
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bX-5, bY-15, bW+10, bH+20);
    ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(bX, bY, bW, bH);
    ctx.fillStyle=pct<0.85?'#2ecc71':'#e74c3c'; ctx.fillRect(bX, bY, f, bH);
    // Player dot
    ctx.fillStyle='#e74c3c'; ctx.beginPath(); ctx.arc(bX+f, bY+bH/2, 4, 0, Math.PI*2); ctx.fill();
    // Labels
    ctx.fillStyle='#fff'; ctx.font='bold 8px Arial'; 
    ctx.textAlign='left'; ctx.fillText('START', bX, bY-5); 
    ctx.textAlign='right'; ctx.fillText('FINISH', bX+bW, bY-5); 
    ctx.textAlign='left';
}

Dom.on('start-btn', 'click', function(){ 
   
    Dom.get('main-menu').classList.add('hidden'); 
    window.gamePaused=false; 
    window.focus(); 
    reset(); 
});
function setupTouch(id, k) { 
    var el=Dom.get(id); if(!el) return; 
    var setKey = function(val){ 
        if(k==='keyLeft') keyLeft=val; 
        if(k==='keyRight') keyRight=val; 
        if(k==='keyFaster') keyFaster=val; 
        if(k==='keySlower') keySlower=val; 
    };
    el.onmousedown=function(e){e.preventDefault(); setKey(true);}; 
    el.onmouseup=function(e){e.preventDefault(); setKey(false);}; 
    el.ontouchstart=function(e){e.preventDefault(); setKey(true);}; 
    el.ontouchend=function(e){e.preventDefault(); setKey(false);}; 
}
setupTouch('btn-left','keyLeft'); setupTouch('btn-right','keyRight'); setupTouch('btn-gas','keyFaster'); setupTouch('btn-brake','keySlower');

var KEY = { 
    LEFT: [37, 'ArrowLeft', 'a', 'A'], 
    UP: [38, 'ArrowUp', 'w', 'W'], 
    RIGHT: [39, 'ArrowRight', 'd', 'D'], 
    DOWN: [40, 'ArrowDown', 's', 'S'] 
};
Game.setKeyListener([
    { keys: KEY.LEFT,  mode: 'down', action: function() { keyLeft   = true;  } },
    { keys: KEY.RIGHT, mode: 'down', action: function() { keyRight  = true;  } },
    { keys: KEY.UP,    mode: 'down', action: function() { keyFaster = true;  } },
    { keys: KEY.DOWN,  mode: 'down', action: function() { keySlower = true;  } },
    { keys: KEY.LEFT,  mode: 'up',   action: function() { keyLeft   = false; } },
    { keys: KEY.RIGHT, mode: 'up',   action: function() { keyRight  = false; } },
    { keys: KEY.UP,    mode: 'up',   action: function() { keyFaster = false; } },
    { keys: KEY.DOWN,  mode: 'up',   action: function() { keySlower = false; } }
]);

console.log('Game Script Starting...');
function reset() { 
    canvas.width=width; canvas.height=height; 
    cameraDepth=1/Math.tan((fieldOfView/2)*Math.PI/180); 
    playerZ=(cameraHeight*cameraDepth); 
    position=0; playerX=0; speed=0; 
    raceFinished=false; currentLapTime=0; 
    hitCooldown=0; 
    
    // Always regenerate road to apply new level difficulty or reset obstacles
    resetRoad(); 
    updateHud('level_value', currentLevel);
}

var last = Util.timestamp();
function loop() { 
    var n = Util.timestamp(); 
    var dt = Math.min(1, (n - last) / 1000); 
    while(dt > step) { dt -= step; update(step); } 
    render(); 
    last = n; 
    requestAnimationFrame(loop); 
}

window.gamePaused = true; 
reset(); 
loop();
