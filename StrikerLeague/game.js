// Striker League Soccer - Game Logic (v3 Refined)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let dpr = window.devicePixelRatio || 1;

// ==================== GAME OBJECT ====================
const Game = {
    width: window.innerWidth,
    height: window.innerHeight,
    state: 'menu',
    matchTime: 0,
    matchDuration: 120, // 2 minutes
    homeScore: 0,
    awayScore: 0,
    formation: '442',

    shots: 0,
    passes: 0,
    homeTouches: 0,
    awayTouches: 0,
    saves: 0,

    ball: null,
    homePlayers: [],
    awayPlayers: [],
    particles: [],

    dragging: false,
    dragStart: null,
    dragCurrent: null,
    selectedPlayer: null,
    power: 0,

    shake: 0,
    kickoffDelay: 0,
    goalScored: false,
    lastTime: 0,

    init() {
        console.log('⚽ Striker League: Initializing...');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInput();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    },

    resize() {
        dpr = window.devicePixelRatio || 1;
        this.width = canvas.clientWidth;
        this.height = canvas.clientHeight;
        
        canvas.width = this.width * dpr;
        canvas.height = this.height * dpr;
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    },

    setupInput() {
        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left),
                y: (clientY - rect.top)
            };
        };

        const startDrag = (e) => {
            if (this.state !== 'playing' || this.kickoffDelay > 0 || this.goalScored) return;

            const pos = getPos(e);
            
            // Allow drag if ball is slow
            const ballSpeed = Math.sqrt(this.ball.vx**2 + this.ball.vy**2);
            if (ballSpeed > 8) return;

            let closest = null;
            let minDist = 70;
            this.homePlayers.forEach(p => {
                const dx = pos.x - p.x;
                const dy = pos.y - p.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < minDist) {
                    minDist = dist;
                    closest = p;
                }
            });

            if (closest) {
                this.dragging = true;
                this.dragStart = { x: closest.x, y: closest.y };
                this.dragCurrent = pos;
                this.selectedPlayer = closest;
                const pBar = document.getElementById('power-bar-container');
                if (pBar) pBar.style.display = 'block';
            }
        };

        const moveDrag = (e) => {
            if (!this.dragging) return;
            this.dragCurrent = getPos(e);
            const dx = this.dragStart.x - this.dragCurrent.x;
            const dy = this.dragStart.y - this.dragCurrent.y;
            this.power = Math.min(Math.sqrt(dx*dx + dy*dy) / 150, 1);
            const pBarFill = document.getElementById('power-bar');
            if (pBarFill) pBarFill.style.width = (this.power * 100) + '%';
        };

        const endDrag = () => {
            if (!this.dragging || !this.selectedPlayer) return;

            const dx = this.dragStart.x - this.dragCurrent.x;
            const dy = this.dragStart.y - this.dragCurrent.y;
            const powerLevel = Math.min(Math.sqrt(dx*dx + dy*dy) / 100, 1.5);

            if (powerLevel > 0.1) {
                const angle = Math.atan2(dy, dx);
                const force = powerLevel * 14;

                this.ball.vx = Math.cos(angle) * force;
                this.ball.vy = Math.sin(angle) * force;
                this.ball.owner = null;

                const goalX = this.width - 40;
                const goalY = this.height / 2;
                const distToGoal = Math.sqrt((goalX - this.ball.x)**2 + (goalY - this.ball.y)**2);

                if (distToGoal < 300 && Math.abs(angle) < 1.0) {
                    this.shots++;
                } else {
                    this.passes++;
                }
            }

            this.dragging = false;
            this.selectedPlayer = null;
            const pBar = document.getElementById('power-bar-container');
            const pBarFill = document.getElementById('power-bar');
            if (pBar) pBar.style.display = 'none';
            if (pBarFill) pBarFill.style.width = '0%';
        };

        canvas.addEventListener('mousedown', startDrag);
        canvas.addEventListener('mousemove', moveDrag);
        document.addEventListener('mouseup', endDrag);

        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrag(e); }, {passive: false});
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); moveDrag(e); }, {passive: false});
        document.addEventListener('touchend', endDrag);

        document.getElementById('start-btn').addEventListener('click', () => this.startMatch());
        document.getElementById('rematch-btn').addEventListener('click', () => this.startMatch());
        document.getElementById('menu-btn').addEventListener('click', () => this.showMenu());
        document.getElementById('howto-btn').addEventListener('click', () => {
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('howto-screen').classList.remove('hidden');
        });
        document.getElementById('howto-back-btn').addEventListener('click', () => {
            document.getElementById('howto-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
        });

        document.querySelectorAll('.formation-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.formation-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.formation = btn.dataset.form;
            });
        });
    },

    showMenu() {
        this.state = 'menu';
        document.getElementById('matchover-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('hud').style.display = 'none';
    },

    startMatch() {
        console.log('⚽ Match Started');
        this.state = 'playing';
        this.matchTime = 0;
        this.homeScore = 0;
        this.awayScore = 0;
        this.shots = 0;
        this.passes = 0;
        this.homeTouches = 0;
        this.awayTouches = 0;
        this.saves = 0;
        this.kickoffDelay = 120; // 2 seconds
        this.goalScored = false;
        this.goalHeight = 180;

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 12,
            vx: 0,
            vy: 0,
            owner: null,
            trail: []
        };

        this.setupPlayers();
        this.particles = [];

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('matchover-screen').classList.add('hidden');
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('score-home').textContent = '0';
        document.getElementById('score-away').textContent = '0';

        this.showEvent('KICK OFF!', '#ffcc00');
    },

    setupPlayers() {
        this.homePlayers = [];
        this.awayPlayers = [];

        const w = this.width;
        const h = this.height;

        const formations = {
            '442': {
                home: [[0.08, 0.5], [0.25, 0.2], [0.25, 0.4], [0.25, 0.6], [0.25, 0.8],
                       [0.45, 0.2], [0.45, 0.4], [0.45, 0.6], [0.45, 0.8],
                       [0.65, 0.35], [0.65, 0.65]],
                away: [[0.92, 0.5], [0.75, 0.2], [0.75, 0.4], [0.75, 0.6], [0.75, 0.8],
                       [0.55, 0.2], [0.55, 0.4], [0.55, 0.6], [0.55, 0.8],
                       [0.35, 0.35], [0.35, 0.65]]
            },
            '433': {
                home: [[0.08, 0.5], [0.25, 0.2], [0.25, 0.4], [0.25, 0.6], [0.25, 0.8],
                       [0.45, 0.25], [0.45, 0.5], [0.45, 0.75],
                       [0.7, 0.2], [0.7, 0.5], [0.7, 0.8]],
                away: [[0.92, 0.5], [0.75, 0.2], [0.75, 0.4], [0.75, 0.6], [0.75, 0.8],
                       [0.55, 0.25], [0.55, 0.5], [0.55, 0.75],
                       [0.3, 0.2], [0.3, 0.5], [0.3, 0.8]]
            },
            '352': {
                home: [[0.08, 0.5], [0.25, 0.3], [0.25, 0.5], [0.25, 0.7],
                       [0.45, 0.15], [0.45, 0.35], [0.45, 0.55], [0.45, 0.75], [0.45, 0.9],
                       [0.7, 0.35], [0.7, 0.65]],
                away: [[0.92, 0.5], [0.75, 0.3], [0.75, 0.5], [0.75, 0.7],
                       [0.55, 0.15], [0.55, 0.35], [0.55, 0.55], [0.55, 0.75], [0.55, 0.9],
                       [0.3, 0.35], [0.3, 0.65]]
            }
        };

        const form = formations[this.formation] || formations['442'];

        form.home.forEach((pos, i) => {
            this.homePlayers.push({
                x: pos[0] * w,
                y: pos[1] * h,
                radius: 18,
                homeX: pos[0] * w,
                homeY: pos[1] * h,
                speed: i === 0 ? 2.5 : 3.5,
                role: i === 0 ? 'gk' : (i > 8 ? 'fwd' : (i > 4 ? 'mid' : 'def')),
                color: '#00ff44',
                number: i + 1
            });
        });

        form.away.forEach((pos, i) => {
            this.awayPlayers.push({
                x: pos[0] * w,
                y: pos[1] * h,
                radius: 18,
                homeX: pos[0] * w,
                homeY: pos[1] * h,
                speed: i === 0 ? 2.5 : 3.5,
                role: i === 0 ? 'gk' : (i > 8 ? 'fwd' : (i > 4 ? 'mid' : 'def')),
                color: '#ff4444',
                number: i + 1,
                aiTimer: Math.random() * 60
            });
        });
    },

    update(dt) {
        if (this.state !== 'playing') return;

        if (this.kickoffDelay > 0) {
            this.kickoffDelay -= dt;
            return;
        }

        if (this.goalScored) {
            this.goalScored = false;
            this.kickoffDelay = 90;
            return;
        }

        this.matchTime += dt / 60;
        if (this.matchTime >= this.matchDuration) {
            this.endMatch();
            return;
        }

        const mins = Math.floor(this.matchTime / 60);
        const secs = Math.floor(this.matchTime % 60);
        const timerEl = document.getElementById('match-timer');
        if (timerEl) timerEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

        // Ball physics
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        this.ball.vx *= 0.98;
        this.ball.vy *= 0.98;

        if (Math.abs(this.ball.vx) < 0.05) this.ball.vx = 0;
        if (Math.abs(this.ball.vy) < 0.05) this.ball.vy = 0;

        // Ball trail
        if (Math.abs(this.ball.vx) > 0.5 || Math.abs(this.ball.vy) > 0.5) {
            this.ball.trail.push({ x: this.ball.x, y: this.ball.y, alpha: 1 });
        }
        if (this.ball.trail.length > 10) this.ball.trail.shift();
        this.ball.trail.forEach(t => t.alpha -= 0.1);

        // Boundaries
        const goalTop = this.height / 2 - this.goalHeight / 2;
        const goalBottom = this.height / 2 + this.goalHeight / 2;

        if (this.ball.y - this.ball.radius < 0) {
            this.ball.y = this.ball.radius;
            this.ball.vy *= -0.6;
        }
        if (this.ball.y + this.ball.radius > this.height) {
            this.ball.y = this.height - this.ball.radius;
            this.ball.vy *= -0.6;
        }

        if (this.ball.x - this.ball.radius < 0) {
            this.ball.x = this.ball.radius;
            this.ball.vx *= -0.6;
        }
        if (this.ball.x + this.ball.radius > this.width) {
            this.ball.x = this.width - this.ball.radius;
            this.ball.vx *= -0.6;
        }

        // Goal detection
        if (this.ball.x < 25 && this.ball.y > goalTop && this.ball.y < goalBottom && this.ball.vx < 0) {
            this.awayScore++;
            this.showEvent('GOAL! CPU SCORES', '#ff4444');
            this.onGoal('#ff4444');
        }
        if (this.ball.x > this.width - 25 && this.ball.y > goalTop && this.ball.y < goalBottom && this.ball.vx > 0) {
            this.homeScore++;
            this.showEvent('GOAL! YOU SCORE', '#00ff44');
            this.onGoal('#00ff44');
        }

        // Ball-player collision with stuck prevention
        [...this.homePlayers, ...this.awayPlayers].forEach(p => {
            const dx = this.ball.x - p.x;
            const dy = this.ball.y - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const minDist = p.radius + this.ball.radius + 2;

            if (dist < minDist && dist > 0) {
                const angle = Math.atan2(dy, dx);
                this.ball.x = p.x + Math.cos(angle) * minDist;
                this.ball.y = p.y + Math.sin(angle) * minDist;

                let force = 2.5;
                
                // Anti-stuck: If near boundaries, increase force to "pop" the ball out
                if (this.ball.x < 50 || this.ball.x > this.width - 50 || 
                    this.ball.y < 50 || this.ball.y > this.height - 50) {
                    force = 5.0; // Stronger kick near corners/walls
                }

                this.ball.vx += Math.cos(angle) * force;
                this.ball.vy += Math.sin(angle) * force;
                this.ball.owner = p;

                if (this.homePlayers.includes(p)) this.homeTouches++;
                else this.awayTouches++;
            }
        });

        // Player movement
        this.updatePlayerMovement(dt, goalTop, goalBottom);
        this.updateAI(dt, goalTop, goalBottom);

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.life -= 0.015;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        if (this.shake > 0) this.shake *= 0.9;
        if (this.shake < 0.3) this.shake = 0;
    },

    onGoal(color) {
        this.goalScored = true;
        this.shake = 12;
        this.spawnGoalParticles(this.ball.x, this.ball.y, color);
        document.getElementById('score-home').textContent = this.homeScore;
        document.getElementById('score-away').textContent = this.awayScore;
        
        // Reset positions after a delay
        setTimeout(() => {
            this.ball.x = this.width / 2;
            this.ball.y = this.height / 2;
            this.ball.vx = 0;
            this.ball.vy = 0;
            this.setupPlayers();
        }, 1200);
    },

    updatePlayerMovement(dt, goalTop, goalBottom) {
        this.homePlayers.forEach((p, i) => {
            if (i === 0) { // GK
                const targetY = Math.max(goalTop + 25, Math.min(goalBottom - 25, this.ball.y));
                p.y += (targetY - p.y) * 0.04;
                p.x += (p.homeX - p.x) * 0.02;
            } else {
                const dx = this.ball.x - p.x;
                const dy = this.ball.y - p.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 220) {
                    p.x += dx * 0.012 * p.speed;
                    p.y += dy * 0.012 * p.speed;
                } else {
                    p.x += (p.homeX - p.x) * 0.018;
                    p.y += (p.homeY - p.y) * 0.018;
                }
            }
            p.x = Math.max(p.radius, Math.min(this.width - p.radius, p.x));
            p.y = Math.max(p.radius, Math.min(this.height - p.radius, p.y));
        });
    },

    updateAI(dt, goalTop, goalBottom) {
        this.awayPlayers.forEach((p, i) => {
            p.aiTimer += dt;
            if (i === 0) { // GK
                const targetY = Math.max(goalTop + 25, Math.min(goalBottom - 25, this.ball.y));
                p.y += (targetY - p.y) * 0.05;
                p.x += (p.homeX - p.x) * 0.02;
            } else {
                const dx = this.ball.x - p.x;
                const dy = this.ball.y - p.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // Shoot logic
                if (dist < 200 && this.ball.x < this.width * 0.35 && p.aiTimer > 90) {
                    const goalX = 30;
                    const goalY = this.height / 2 + (Math.random() - 0.5) * 60;
                    const angle = Math.atan2(goalY - this.ball.y, goalX - this.ball.x);
                    this.ball.vx = Math.cos(angle) * (6 + Math.random() * 3);
                    this.ball.vy = Math.sin(angle) * (6 + Math.random() * 3);
                    p.aiTimer = 0;
                }

                if (dist < 250) {
                    p.x += dx * 0.011 * p.speed;
                    p.y += dy * 0.011 * p.speed;
                } else {
                    p.x += (p.homeX - p.x) * 0.014;
                    p.y += (p.homeY - p.y) * 0.014;
                }
            }
            p.x = Math.max(p.radius, Math.min(this.width - p.radius, p.x));
            p.y = Math.max(p.radius, Math.min(this.height - p.radius, p.y));
        });
    },

    spawnGoalParticles(x, y, color) {
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            const speed = 3 + Math.random() * 8;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                life: 1.5 + Math.random(),
                size: Math.random() * 5 + 2,
                color
            });
        }
    },

    showEvent(text, color) {
        const container = document.getElementById('match-events');
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'event-pop';
        el.textContent = text;
        el.style.color = color;
        container.appendChild(el);
        setTimeout(() => el.remove(), 2000);
    },

    endMatch() {
        this.state = 'matchover';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('matchover-screen').classList.remove('hidden');
        document.getElementById('final-home').textContent = this.homeScore;
        document.getElementById('final-away').textContent = this.awayScore;
        
        const result = document.getElementById('match-result');
        if (this.homeScore > this.awayScore) result.textContent = '🏆 VICTORY!';
        else if (this.homeScore < this.awayScore) result.textContent = 'DEFEAT';
        else result.textContent = 'DRAW';

        const totalTouches = this.homeTouches + this.awayTouches;
        const possession = totalTouches > 0 ? Math.round((this.homeTouches / totalTouches) * 100) : 50;

        document.getElementById('stat-shots').textContent = this.shots;
        document.getElementById('stat-passes').textContent = this.passes;
        document.getElementById('stat-possession').textContent = possession + '%';
        document.getElementById('stat-saves').textContent = this.saves;
    },

    draw() {
        const w = this.width;
        const h = this.height;

        // Field
        ctx.fillStyle = '#0d5c1d';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);

        // Grass stripes
        ctx.fillStyle = '#0a4a17';
        const stripeWidth = w / 10;
        for (let i = 0; i < 10; i += 2) ctx.fillRect(i * stripeWidth, 0, stripeWidth, h);

        // Field lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
        ctx.beginPath(); ctx.arc(w / 2, h / 2, 60, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; ctx.fill();

        // Goals
        const goalH = this.goalHeight || 120;
        const goalY = h / 2 - goalH / 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, goalY, 20, goalH); ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'; ctx.fillRect(0, goalY, 20, goalH);
        ctx.strokeRect(w - 20, goalY, 20, goalH); ctx.fillRect(w - 20, goalY, 20, goalH);

        // Penalty boxes
        ctx.strokeRect(0, h / 2 - (this.goalHeight || 120) * 0.8, 80, (this.goalHeight || 120) * 1.6);
        ctx.strokeRect(w - 80, h / 2 - (this.goalHeight || 120) * 0.8, 80, (this.goalHeight || 120) * 1.6);

        if (this.state === 'playing' && this.ball) {
            // Drag line
            if (this.dragging && this.selectedPlayer) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(this.dragStart.x, this.dragStart.y);
                ctx.lineTo(this.dragCurrent.x, this.dragCurrent.y);
                ctx.stroke();
                ctx.setLineDash([]);

                const dx = this.dragStart.x - this.dragCurrent.x;
                const dy = this.dragStart.y - this.dragCurrent.y;
                const angle = Math.atan2(dy, dx);
                const power = Math.min(Math.sqrt(dx*dx + dy*dy) / 100, 1.5);
                ctx.strokeStyle = `rgba(0, 255, 68, ${0.3 + power * 0.5})`;
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(this.ball.x, this.ball.y);
                ctx.lineTo(this.ball.x + Math.cos(angle) * power * 80, this.ball.y + Math.sin(angle) * power * 80);
                ctx.stroke();
            }

            // Ball trail
            this.ball.trail.forEach(t => {
                if (t.alpha > 0) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${t.alpha * 0.3})`;
                    ctx.beginPath(); ctx.arc(t.x, t.y, this.ball.radius * 0.6, 0, Math.PI * 2); ctx.fill();
                }
            });

            // Ball - VERY VISIBLE
            ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2); ctx.stroke();
            
            // Ball pattern
            ctx.fillStyle = '#222';
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                ctx.beginPath(); ctx.arc(this.ball.x + Math.cos(angle) * 5, this.ball.y + Math.sin(angle) * 5, 3, 0, Math.PI * 2); ctx.fill();
            }

            // Players
            [...this.awayPlayers, ...this.homePlayers].forEach(p => {
                ctx.shadowBlur = 15; ctx.shadowColor = p.color;
                ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.stroke();
                
                if (this.homePlayers.includes(p)) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.beginPath(); ctx.arc(p.x - 4, p.y - 4, p.radius * 0.35, 0, Math.PI * 2); ctx.fill();
                }

                ctx.fillStyle = this.homePlayers.includes(p) ? '#000' : '#fff';
                ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(p.number, p.x, p.y + (this.homePlayers.includes(p) ? 1 : 0));

                if (this.selectedPlayer === p) {
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 8, 0, Math.PI * 2); ctx.stroke();
                }
            });

            // Particles
            this.particles.forEach(p => {
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            });
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    },

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 16.67, 3);
        this.lastTime = timestamp;

        if (this.width !== canvas.clientWidth || this.height !== canvas.clientHeight) {
            this.resize();
        }

        this.update(dt || 1);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }
};

Game.init();
