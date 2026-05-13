const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height, cx, cy;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    cx = width / 2;
    // Perfectly center it to use the compact space while leaving room for top HUD and bottom ads
    cy = height / 2; 
}
window.addEventListener('resize', resize);
resize();

let level = 1;
let gameState = 'start'; 
let tapsLeft = 0;
let maxTaps = 10;

let ball = {
    x: cx, y: cy,
    vx: 0, vy: 0,
    r: 6
};

let rings = [];
let particles = [];
let floatingTexts = [];
const R_core = 20;
const gravity = 0.15;
const drag = 0.995;
const jumpPower = 8;

function initLevel() {
    rings = [];
    let numRings = 3 + level; // Add more layers
    for(let i=0; i<numRings; i++) {
        // Space them out slightly to be compact on mobile screens
        let radius = 60 + i * 35;
        let numSegments = 3 + i * 2;
        let segments = [];
        let baseHue = (level * 40 + i * 20) % 360;
        for(let s=0; s<numSegments; s++) {
            segments.push({
                active: true,
                color: `hsl(${baseHue + s*15}, 80%, 60%)`
            });
        }
        rings.push({
            radius: radius,
            thickness: 15,
            segments: segments,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (i % 2 === 0 ? 1 : -1) * (0.005 + Math.random()*0.005 + level*0.001)
        });
    }
    
    ball.x = cx;
    ball.y = cy - R_core - ball.r - 5;
    ball.vx = 0;
    ball.vy = 0;
    
    // Allow 10 taps in first level, increase slightly in later levels
    maxTaps = 9 + level; 
    tapsLeft = maxTaps; 
    
    gameState = 'playing';
    updateUI();
}

function createParticles(x, y, color, count=5) {
    for(let i=0; i<count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random()-0.5)*8,
            vy: (Math.random()-0.5)*8,
            life: 1,
            color: color
        });
    }
}

function createFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x, y: y,
        text: text,
        color: color,
        life: 1,
        vy: -2
    });
}

function tap() {
    if (gameState === 'start') {
        document.getElementById('start-screen').classList.add('hidden');
        initLevel();
        return;
    }
    if (gameState !== 'playing') return;
    if (tapsLeft <= 0) return;
    
    tapsLeft--;
    updateUI();
    
    createFloatingText(ball.x, ball.y - 15, "-1 TAP", "#ef4444");
    
    let dx = ball.x - cx;
    let dy = ball.y - cy;
    let dist = Math.hypot(dx, dy) || 1;
    let outX = dx / dist;
    let outY = dy / dist;
    ball.vx += outX * jumpPower * 0.4;
    ball.vy += outY * jumpPower * 0.4;
    createParticles(ball.x, ball.y, '#fff', 2);
}

document.getElementById('start-btn').addEventListener('click', tap);

document.getElementById('game-container').addEventListener('pointerdown', (e) => {
    if(e.target.closest('#hud-top')) return;
    tap();
});

function updateUI() {
    document.getElementById('level-display').textContent = level;
    if(document.getElementById('taps-display')) {
        document.getElementById('taps-display').textContent = tapsLeft;
    }
}

function update() {
    if (gameState === 'playing') {
        let dx = cx - ball.x;
        let dy = cy - ball.y;
        let dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            let nx = dx / dist;
            let ny = dy / dist;
            ball.vx += nx * gravity;
            ball.vy += ny * gravity;
        }
        
        ball.vx *= drag;
        ball.vy *= drag;
        
        ball.x += ball.vx;
        ball.y += ball.vy;
        
        dx = cx - ball.x;
        dy = cy - ball.y;
        dist = Math.hypot(dx, dy);
        
        if (dist < R_core + ball.r) {
            if (tapsLeft <= 0) {
                gameState = 'transition';
                let scr = document.getElementById('level-screen');
                scr.querySelector('.title-primary').textContent = 'OUT OF TAPS';
                scr.querySelector('.title-primary').style.color = '#ef4444';
                scr.querySelector('.subtitle').textContent = 'TRY AGAIN';
                scr.classList.remove('hidden');
                setTimeout(() => {
                    scr.classList.add('hidden');
                    scr.querySelector('.title-primary').textContent = 'LEVEL CLEARED';
                    scr.querySelector('.title-primary').style.color = '#4ade80';
                    scr.querySelector('.subtitle').textContent = 'NEXT MAZE READY';
                    initLevel(); 
                }, 1500);
                return;
            }

            let nx = dx / dist; 
            let ny = dy / dist;
            let dot = ball.vx * nx + ball.vy * ny;
            
            if (dot > 0) { 
                let surfNX = -nx;
                let surfNY = -ny;
                let bDot = ball.vx * surfNX + ball.vy * surfNY;
                ball.vx = ball.vx - 2 * bDot * surfNX;
                ball.vy = ball.vy - 2 * bDot * surfNY;
            }
            
            let outX = -nx;
            let outY = -ny;
            let outwardSpeed = ball.vx * outX + ball.vy * outY;
            
            let targetIdle = jumpPower * 0.6;
            if (outwardSpeed < targetIdle) {
                ball.vx += outX * (targetIdle - outwardSpeed);
                ball.vy += outY * (targetIdle - outwardSpeed);
            }
            
            let push = (R_core + ball.r) - dist;
            ball.x += outX * push;
            ball.y += outY * push;
            createParticles(ball.x, ball.y, '#4ade80', 2);
        }
        
        let ballAngle = Math.atan2(ball.y - cy, ball.x - cx);
        let maxRadius = R_core;
        let hitRing = false;
        
        for(let i=0; i<rings.length; i++) {
            let r = rings[i];
            r.rotation += r.rotationSpeed;
            
            let activeAny = r.segments.some(s => s.active);
            if(activeAny && r.radius > maxRadius) {
                maxRadius = r.radius;
            }
            
            let r_inner = r.radius - r.thickness/2;
            let r_outer = r.radius + r.thickness/2;
            
            if (dist + ball.r > r_inner && dist - ball.r < r_outer && !hitRing) {
                let relAngle = ballAngle - r.rotation;
                relAngle = (relAngle % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
                let segIndex = Math.floor(relAngle / (2*Math.PI / r.segments.length));
                let seg = r.segments[segIndex];
                
                if (seg.active) {
                    let distToInner = Math.abs((dist + ball.r) - r_inner);
                    let distToOuter = Math.abs(r_outer - (dist - ball.r));
                    
                    let ringNormalX = Math.cos(ballAngle); 
                    let ringNormalY = Math.sin(ballAngle);
                    
                    if (distToInner < distToOuter) { 
                        let nx = -ringNormalX;
                        let ny = -ringNormalY;
                        let dot = ball.vx * nx + ball.vy * ny;
                        if (dot < 0) {
                            ball.vx = ball.vx - 2 * dot * nx;
                            ball.vy = ball.vy - 2 * dot * ny;
                        }
                        ball.x += nx * distToInner;
                        ball.y += ny * distToInner;
                    } else { 
                        let nx = ringNormalX;
                        let ny = ringNormalY;
                        let dot = ball.vx * nx + ball.vy * ny;
                        if (dot < 0) {
                            ball.vx = ball.vx - 2 * dot * nx;
                            ball.vy = ball.vy - 2 * dot * ny;
                        }
                        ball.x += nx * distToOuter;
                        ball.y += ny * distToOuter;
                    }
                    
                    hitRing = true;
                    seg.active = false;
                    createParticles(ball.x, ball.y, seg.color, 15);
                    
                    dx = cx - ball.x;
                    dy = cy - ball.y;
                    dist = Math.hypot(dx, dy);
                }
            }
        }
        
        // Once ball moves slightly up from top outer ring, game is completed
        if (dist > maxRadius + 20) {
            gameState = 'transition';
            document.getElementById('level-screen').classList.remove('hidden');
            setTimeout(() => {
                level++;
                document.getElementById('level-screen').classList.add('hidden');
                initLevel();
            }, 1500);
        }
    }
    
    for(let i=particles.length-1; i>=0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        if(p.life <= 0) particles.splice(i, 1);
    }
    
    for(let i=floatingTexts.length-1; i>=0; i--) {
        let ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.life -= 0.02;
        if(ft.life <= 0) floatingTexts.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);
    
    ctx.beginPath();
    ctx.arc(cx, cy, R_core, 0, Math.PI*2);
    ctx.fillStyle = '#0b0f19';
    ctx.fill();
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    for(let i=0; i<rings.length; i++) {
        let r = rings[i];
        ctx.lineWidth = r.thickness - 2;
        ctx.lineCap = "round";
        for(let s=0; s<r.segments.length; s++) {
            let seg = r.segments[s];
            if (!seg.active) continue;
            
            let startA = r.rotation + s * (2*Math.PI / r.segments.length) + 0.08;
            let endA = r.rotation + (s+1) * (2*Math.PI / r.segments.length) - 0.08;
            
            if (startA >= endA) continue; 
            
            ctx.beginPath();
            ctx.arc(cx, cy, r.radius, startA, endA);
            ctx.strokeStyle = seg.color;
            ctx.globalAlpha = 1.0; 
            ctx.shadowBlur = 10;
            ctx.shadowColor = seg.color;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
    
    if (gameState !== 'start') {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fff';
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    for(let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5 + p.life*2, 0, Math.PI*2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
    
    ctx.font = "bold 20px 'Outfit'";
    ctx.textAlign = "center";
    for(let ft of floatingTexts) {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life;
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
updateUI();
