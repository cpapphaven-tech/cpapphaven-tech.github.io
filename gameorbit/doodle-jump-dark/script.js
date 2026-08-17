(function () {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  if (!ctx.roundRect) {
    ctx.roundRect = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
    };
  }
  const scoreEl = document.getElementById("scoreEl");
  const highScoreEl = document.getElementById("highScoreEl");
  const startOverlay = document.getElementById("startOverlay");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const finalScoreEl = document.getElementById("finalScoreEl");
  const btnLeft = document.getElementById("btnLeft");
  const btnRight = document.getElementById("btnRight");

  const CANVAS_WIDTH = 480;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.45;
  const JUMP_FORCE = -12;
  const MOVE_SPEED = 5;
  const PLATFORM_MIN_WIDTH = 60;
  const PLATFORM_MAX_WIDTH = 120;
  const PLATFORM_HEIGHT = 14;
  const PLATFORM_GAP_MIN = 50;
  const PLATFORM_GAP_MAX = 120;
  const PLAYER_WIDTH = 36;
  const PLAYER_HEIGHT = 40;
  const CAMERA_LEAD = 0.4;

  let animationId = null;
  let player = null;
  let platforms = [];
  let cameraY = 0;
  let startCameraY = 0;
  let score = 0;
  let highScore = parseInt(localStorage.getItem("neon-bounce-highscore") || "0", 10);
  let gameRunning = false;
  let keys = { left: false, right: false };
  let time = 0;

  // --- PLAYMIX GAMES ANALYTICS & ADS SETUP ---
  let gameRecordTime = Date.now();
  let gameStartTime = Date.now();
  let durationSent = false;
  let gameStartedFlag = false;
  const SUPABASE_URL = "https://bjpgovfzonlmjrruaspp.supabase.co";
  const SUPABASE_KEY = "sb_publishable_XeggJuFyPHVixAsnuI6Udw_rv2Wa4KM";
  let supabaseClient = null;
  let sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 8);

  async function initPlaymix() {
    if (!window.supabase) { setTimeout(initPlaymix, 500); return; }
    if (!supabaseClient) supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    try {
        let country = "Unknown";
        try { let r = await fetch("https://ipapi.co/json/"); let d = await r.json(); country = d.country_name || d.country || "Unknown"; } catch(e){}
        const ua = navigator.userAgent; let os = "Unknown", browser = "Unknown";
        if (/android/i.test(ua)) os = "Android"; else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS"; else if (/Win/i.test(ua)) os = "Windows"; else if (/Mac/i.test(ua)) os = "Mac";
        if (/Edg/i.test(ua)) browser = "Edge"; else if (/Chrome/i.test(ua)) browser = "Chrome"; else if (/Safari/i.test(ua)) browser = "Safari"; else if (/Firefox/i.test(ua)) browser = "Firefox";
        const params = new URLSearchParams(window.location.search);
        await supabaseClient.from("game_sessions").insert([{ session_id: sessionId, game_slug: "doodlejump", placement_id: params.get("utm_content") || params.get("placementid") || "unknown", user_agent: ua, os, browser, country, started_game: false, bounced: true }]);
    } catch(e){}
  }
  
  function playmixMarkStarted() {
      if (!supabaseClient || gameStartedFlag) return;
      gameStartedFlag = true;
      try { supabaseClient.from('game_sessions').update({ started_game: true, bounced: false }).eq('session_id', sessionId).then(()=>{}); } catch(e){}
  }

  window.addEventListener("beforeunload", () => {
      if (!durationSent && supabaseClient) {
          try { supabaseClient.from("game_sessions").update({ duration_seconds: Math.round((Date.now() - gameStartTime) / 1000), bounced: !gameStartedFlag, end_reason: "tab_close_doodle" }).eq("session_id", sessionId).then(()=>{}); } catch(e){}
          durationSent = true;
      }
  });
  initPlaymix();
  // -------------------------------------------

  function setPixelRatio() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.scale(dpr, dpr);
  }

  function createPlatform(x, y, width, type) {
    return {
      x,
      y,
      width,
      height: PLATFORM_HEIGHT,
      type: type || "normal",
      moveDir: type === "moving" ? (Math.random() > 0.5 ? 1 : -1) : 0,
      moveRange: type === "moving" ? 40 + Math.random() * 40 : 0,
      startX: x,
      star: Math.random() > 0.3, // 70% chance to spawn a star on this platform
      starX: x + width / 2,
      starY: y - 25
    };
  }

  function initPlatforms() {
    platforms = [];
    let y = CANVAS_HEIGHT - 80;
    for (let i = 0; i < 10; i++) {
      const width =
        PLATFORM_MIN_WIDTH + Math.random() * (PLATFORM_MAX_WIDTH - PLATFORM_MIN_WIDTH);
      let x = Math.random() * (CANVAS_WIDTH - width);
      let type = "normal";
      if (i === 0) {
        x = (CANVAS_WIDTH - width) / 2;
      } else {
        const typeRand = Math.random();
        if (typeRand < 0.15) type = "break";
        else if (typeRand < 0.35) type = "moving";
      }
      platforms.push(createPlatform(x, y, width, type));
      y -= PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
    }
  }

  function addPlatformsAbove(topY) {
    let lastY = platforms.length ? Math.min(...platforms.map((p) => p.y)) : topY;
    while (lastY > topY - CANVAS_HEIGHT - 200) {
      lastY -= PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
      const width =
        PLATFORM_MIN_WIDTH + Math.random() * (PLATFORM_MAX_WIDTH - PLATFORM_MIN_WIDTH);
      const x = Math.random() * (CANVAS_WIDTH - width);
      const typeRand = Math.random();
      let type = "normal";
      if (typeRand < 0.12) type = "break";
      else if (typeRand < 0.32) type = "moving";
      platforms.push(createPlatform(x, lastY, width, type));
    }
  }

  function resetGame() {
    cameraY = 0;
    score = 0;
    time = 0;
    keys.left = false;
    keys.right = false;
    if (btnLeft) btnLeft.classList.remove("active");
    if (btnRight) btnRight.classList.remove("active");
    initPlatforms();
    const firstPlatform = platforms[0];
    player = {
      x: (CANVAS_WIDTH - PLAYER_WIDTH) / 2,
      y: firstPlatform.y - PLAYER_HEIGHT - 2,
      vx: 0,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      doubleJumpUsed: false
    };
    startCameraY = player.y - CANVAS_HEIGHT * CAMERA_LEAD;
    gameRunning = true;
    scoreEl.textContent = "0";
    highScoreEl.textContent = highScore;
  }

  function drawPlayer(screenY) {
    const x = player.x;
    const y = player.y - cameraY;
    if (y < -PLAYER_HEIGHT - 20 || y > CANVAS_HEIGHT + 20) return;

    ctx.save();
    
    // Character center coordinates
    const cx = x + PLAYER_WIDTH / 2;
    const cy = y + PLAYER_HEIGHT / 2;

    // Emoji Body (Yellow Circle)
    ctx.fillStyle = "#ffeb3b"; // Always yellow
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff9800";
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(PLAYER_WIDTH, PLAYER_HEIGHT) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eyes on front
    const eyeOffsetX = 7;
    const eyeY = cy - 4;
    
    // Whites of eyes
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx - eyeOffsetX, eyeY, 6, 0, Math.PI * 2);
    ctx.arc(cx + eyeOffsetX, eyeY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (move left or right based on movement)
    let pupilDir = 0; 
    if (keys.left) pupilDir = -2.5;
    else if (keys.right) pupilDir = 2.5;

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(cx - eyeOffsetX + pupilDir, eyeY, 3, 0, Math.PI * 2);
    ctx.arc(cx + eyeOffsetX + pupilDir, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Emoji Smile
    ctx.strokeStyle = "#8d6e63"; // Soft brown outline for the face
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Centered smile beneath the eyes
    ctx.arc(cx, cy + 4, 8, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  function drawPlatform(p) {
    const y = p.y - cameraY;
    if (y < -PLATFORM_HEIGHT - 20 || y > CANVAS_HEIGHT + 50) return;

    const x = p.x;
    const w = p.width;
    const h = p.height;

    if (p.type === "normal") {
      ctx.fillStyle = "rgba(102, 252, 241, 0.8)";
      ctx.strokeStyle = "#45a29e";
    } else if (p.type === "break") {
      ctx.fillStyle = "rgba(255, 51, 102, 0.8)";
      ctx.strokeStyle = "#ff003c";
    } else {
      ctx.fillStyle = "rgba(0, 242, 254, 0.8)";
      ctx.strokeStyle = "#00b4db";
    }

    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw Star Collectible
    if (p.star) {
        let sy = p.starY - cameraY;
        let sx = p.starX;
        
        // If it's a moving platform, the star needs to move with it
        if (p.type === "moving") sx = x + w / 2;
        
        sy += Math.sin(time * 0.1) * 3; // Float animation

        ctx.fillStyle = "#FFD700"; // Gold color
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FFD700";
        ctx.beginPath();
        
        for (let j = 0; j < 5; j++) {
            ctx.lineTo(sx + Math.cos( (18 + j * 72) / 180 * Math.PI) * 12,
                       sy - Math.sin( (18 + j * 72) / 180 * Math.PI) * 12);
            ctx.lineTo(sx + Math.cos( (54 + j * 72) / 180 * Math.PI) * 5,
                       sy - Math.sin( (54 + j * 72) / 180 * Math.PI) * 5);
        }
        ctx.closePath();
        ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function gameOver() {
    gameRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
    finalScoreEl.textContent = score;
    gameOverOverlay.classList.remove("hidden");
  }

  function gameLoop() {
    if (!gameRunning) return;

    time++;
    const dt = 1;

    if (keys.left) player.vx = -MOVE_SPEED;
    else if (keys.right) player.vx = MOVE_SPEED;
    else player.vx *= 0.85;
    player.x += player.vx;
    player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));
    player.vy += GRAVITY;
    player.y += player.vy;

    for (let i = platforms.length - 1; i >= 0; i--) {
      const p = platforms[i];
      if (p.type === "moving") {
        p.x = p.startX + Math.sin((time + p.startX) * 0.03) * p.moveRange * p.moveDir;
        p.x = Math.max(0, Math.min(CANVAS_WIDTH - p.width, p.x));
      }

      const py = p.y - cameraY;
      if (py > CANVAS_HEIGHT + 100) {
        platforms.splice(i, 1);
        continue;
      }

      // Check Star Collision
      if (p.star) {
          let sx = p.type === "moving" ? p.x + p.width / 2 : p.starX;
          const pcx = player.x + player.width / 2;
          const pcy = player.y + player.height / 2;
          const dist = Math.hypot(pcx - sx, pcy - p.starY);
          if (dist < 32) { // Collection radius
              p.star = false; 
              score += 1;
              scoreEl.textContent = score;
              if (score > highScore) {
                  highScore = score;
                  highScoreEl.textContent = highScore;
                  localStorage.setItem("neon-bounce-highscore", String(highScore));
              }
          }
      }

      const playerBottom = player.y + player.height;
      const platformTop = p.y;
      const overlapX =
        player.x + player.width > p.x && player.x < p.x + p.width;
      if (
        overlapX &&
        playerBottom >= platformTop - 2 &&
        playerBottom <= platformTop + 12 &&
        player.vy >= 0
      ) {
        player.vy = JUMP_FORCE;
        player.y = platformTop - player.height - 1;
        player.doubleJumpUsed = false; // Reset double jump
        if (p.type === "break") platforms.splice(i, 1);
      }
    }

    const targetCameraY = player.y - CANVAS_HEIGHT * CAMERA_LEAD;
    if (targetCameraY < cameraY) {
      cameraY = targetCameraY;
      // We removed height-based scoring completely here!
      addPlatformsAbove(cameraY);
    }

    if (player.y - cameraY > CANVAS_HEIGHT + 50) {
      gameOver();
      return;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    platforms.forEach(drawPlatform);
    drawPlayer();

    animationId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    startOverlay.classList.add("hidden");
    gameOverOverlay.classList.add("hidden");
    resetGame();
    playmixMarkStarted();
   
    gameLoop();
  }

  startBtn.addEventListener("click", function() {
     
      startGame();
  });
  
  restartBtn.addEventListener("click", function() {
      if(typeof syncPMGLayout === 'function') syncPMGLayout();
      startGame();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        if (gameRunning && !player.doubleJumpUsed) {
            player.vy = JUMP_FORCE * 1.2;
            player.doubleJumpUsed = true;
        }
        e.preventDefault();
    }
  });

  document.addEventListener("keyup", function (e) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
  });

  function setKeyLeft(value) {
    keys.left = value;
    if (btnLeft) btnLeft.classList.toggle("active", value);
  }
  function setKeyRight(value) {
    keys.right = value;
    if (btnRight) btnRight.classList.toggle("active", value);
  }
  if (btnLeft) {
    btnLeft.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      setKeyLeft(true);
    });
    btnLeft.addEventListener("pointerup", function () { setKeyLeft(false); });
    btnLeft.addEventListener("pointerleave", function () { setKeyLeft(false); });
  }
  if (btnRight) {
    btnRight.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      setKeyRight(true);
    });
    btnRight.addEventListener("pointerup", function () { setKeyRight(false); });
    btnRight.addEventListener("pointerleave", function () { setKeyRight(false); });
  }

  canvas.addEventListener("click", function () {
    if (!gameRunning) {
        if (!startOverlay.classList.contains("hidden")) startGame();
    } else {
        // DOUBLE JUMP MECHANIC
        if (!player.doubleJumpUsed) {
            player.vy = JUMP_FORCE * 1.2; // Extra strong double jump
            player.doubleJumpUsed = true;
        }
    }
  });

  window.addEventListener("resize", setPixelRatio);
  setPixelRatio();
  highScoreEl.textContent = highScore;
})();
