/**
 * Professional Ad Control System
 * 
 * Controls whether ads load based on:
 * - Localhost detection (development)
 * - Cookie flag (noads=true)
 * - URL parameter (?dev=true)
 * 
 * Usage:
 *   if (shouldLoadAds()) {
 *     // Load ad scripts
 *   }
 * 
 * Disable ads for testing:
 *   1. Via cookie: document.cookie = "noads=true; path=/";
 *   2. Via URL: add ?dev=true to any page
 *   3. On localhost: automatically disabled
 * 
 * Re-enable ads:
 *   document.cookie = "noads=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
 */

// 🔧 DEV MODE FLAG
// 🔧 GLOBAL DEV MODE FLAG
window.DEV_MODE =
    location.protocol === "file:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    new URLSearchParams(location.search).get("dev") === "true" ||
    document.cookie.includes("noads=true");

function isMobileDevice() {
    return /android|iphone|ipad|ipod/i.test(navigator.userAgent)
        || window.innerWidth < 768;
}


function getOSKey() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    if (/Win/i.test(ua)) return "windows";
    if (/Mac/i.test(ua)) return "mac";
    if (/Linux/i.test(ua)) return "linux";
    return "unknown";
}

function shouldLoadAds() {
    if (window.DEV_MODE) {
        console.log("🚧 [ADS] Dev mode ON — ads blocked");
        return false;
    }

    // Check cookie consent (GDPR/LGPD compliance)
    // const consent = localStorage.getItem('play-mix-games-cookie-consent');
    // if (consent) {
    //     const consentData = JSON.parse(consent);
    //     if (consentData.accepted === false) {
    //         console.log("🚫 [ADS] User declined cookie consent — ads blocked");
    //         return false;
    //     }
    // }

    return true;
}


/**
 * Load Social Bar Ad
 * Conditionally loads the effectivegatecpm social bar
 * Tracks both script loading AND actual ad rendering
 */
function loadSocialBarAd() {


    // Only run on mobile screens (max-width 768px)
    if (window.matchMedia("(max-width: 768px)").matches) {

        // Inject ad script (same as <script src=...>)
        const script = document.createElement("script");
        script.src = "https://pl28566875.effectivegatecpm.com/50/ce/d8/50ced8d3053d18abbee81fdcf51b4216.js";
        document.head.appendChild(script);

    }

}


/**
 * Load Banner Ad
 * Conditionally loads the highperformanceformat banner ad
 */
function loadBannerAd() {
    if (!shouldLoadAds()) {
        console.log("🚧 [ADS] Skipping banner ad");
        return;
    }

    // Banner config
    window.atOptions = {
        key: "de617c07128b585ef939154460e6858f",
        format: "iframe",
        height: 50,
        width: 320,
        params: {}
    };

    // Inject banner script
    const bannerScript = document.createElement("script");
    bannerScript.src =
        "https://www.highperformanceformat.com/de617c07128b585ef939154460e6858f/invoke.js";

    document.body.appendChild(bannerScript);

    console.log("✅ [ADS] Banner ad requested");

}


/**
 * Load Smartlink Ad (every 3rd game over)
 * Opens window.open() with Smartlink URL
 */
function loadSmartlinkAd() {
    if (!shouldLoadAds()) {
        console.log('🚧 [ADS] Skipping Smartlink ad');
        return;
    }




    window.open(
        "https://www.effectivegatecpm.com/gp6cvyi4?key=a90897ce62f2dd15a5aab13ad90b2e66",
        "_blank"
    );
    console.log('✅ [ADS] Smartlink ad opened');

}

/**
 * Display Dev Mode Info
 * Shows current ad disable status and how to control it
 */
function displayAdInfo() {
    const info = {
        localhost: location.hostname === "localhost" || location.hostname === "127.0.0.1",
        cookieDisabled: document.cookie.includes("noads=true"),
        urlDevFlag: new URLSearchParams(location.search).get("dev") === "true",
        adsEnabled: shouldLoadAds()
    };

    console.group('📊 Ad Control Status');
    console.log('Localhost:', info.localhost);
    console.log('Cookie Disabled (noads=true):', info.cookieDisabled);
    console.log('URL Dev Flag (?dev=true):', info.urlDevFlag);
    console.log('Ads Enabled:', info.adsEnabled);
    console.log('');
    console.log('To disable ads:');
    console.log('  1. Cookie: document.cookie = "noads=true; path=/";');
    console.log('  2. URL: Add ?dev=true to the current page');
    console.log('  3. Localhost: Automatically disabled');
    console.log('');
    console.log('To re-enable ads:');
    console.log('  document.cookie = "noads=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";');
    console.groupEnd();

    return info;
}

/**
 * Centered Game Scroller for Game Over screens
 */
function renderGameScroller(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const games = [
        { name: "Stack 3D", url: "../Stack3D/index.html", img: "../assets/stack3d.png", color: "#4d79ff" },
        { name: "Football 3D", url: "../Football3D/index.html", img: "../assets/football3d.png", color: "#4caf50" },
        { name: "Basketball 3D", url: "../Basketball3D/index.html", img: "../assets/basketball3d.png", color: "#e65100" },
        { name: "Helix Bounce", url: "../HelixBounce/index.html", img: "../assets/helixbounce.png", color: "#cc00cc" },
        { name: "Sushi Match 3D", url: "../SushiMatch/index.html", img: "../assets/sushimatch3d.png", color: "#ff5722" },
        { name: "Burger Stack 3D", url: "../BurgerStack/index.html", img: "../assets/burgerstack.png", color: "#ff6b35" },
        { name: "Water Sort 3D", url: "../WaterSort3D/index.html", img: "../assets/watersort3d.png", color: "#4facfe" },
        { name: "Bubble Shooter 3D", url: "../BubbleShooter/index.html", img: "../assets/bubble_shooter.png", color: "#2196f3" }
    ];

    // Filter out current game to avoid self-promotion
    const currentGamePath = location.pathname;
    const filteredGames = games.filter(g => !currentGamePath.includes(g.url.split('..')[1]));

    const scrollerHtml = `
        <div class="game-scroller-v">
            <p class="scroller-title">More Games</p>
            <div class="scroller-inner">
                ${filteredGames.map(g => `
                    <a href="${g.url}" class="scroller-item" style="border-left: 4px solid ${g.color}">
                        ${g.img ? `<div class="scroller-img" style="background-image: url('${g.img}')"></div>` : `<div class="scroller-emoji">${g.emoji}</div>`}
                        <div class="scroller-info">
                            <span class="scroller-name">${g.name}</span>
                            <span class="scroller-play">PLAY</span>
                        </div>
                    </a>
                `).join('')}
            </div>
        </div>
    `;

    container.innerHTML = scrollerHtml;

    // Auto-scroll logic
    const inner = container.querySelector('.scroller-inner');
    if (inner) {
        // Duplicate content for seamless loop
        inner.innerHTML += inner.innerHTML;

        let frame = 0;
        const speed = 0.31;
        const limit = inner.scrollHeight / 2;

        function autoScroll() {
            frame++;

            if (frame % 3 === 0) { // scroll every 3 frames
                inner.scrollTop = (inner.scrollTop + speed) % limit;
            }


            requestAnimationFrame(autoScroll);
        }

        setTimeout(() => requestAnimationFrame(autoScroll), 800);
    }
}

// Global styles for the scroller (injected once)
if (!document.getElementById('scroller-styles')) {
    const styles = document.createElement('style');
    styles.id = 'scroller-styles';
    styles.textContent = `
        .game-scroller-v {
            width: 100%;
            max-width: 280px;
            margin: 15px auto;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
            position: relative;
        }
        .scroller-title {
            font-size: 0.7rem;
            text-transform: uppercase;
            opacity: 0.7;
            margin-bottom: 10px;
            letter-spacing: 1.5px;
            font-weight: 900;
            color: #fff;
            text-align: center;
        }
        .scroller-inner {
            height: 150px;
            overflow-y: hidden; /* Hide scrollbar for auto-scroll */
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .scroller-item {
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(255, 255, 255, 0.08);
            padding: 8px;
            border-radius: 10px;
            text-decoration: none;
            color: white;
            transition: all 0.2s;
            border: 1px solid rgba(255, 255, 255, 0.05);
            flex-shrink: 0;
        }
        .scroller-item:hover { 
            background: rgba(255, 255, 255, 0.15);
            transform: scale(1.02);
        }
        
        .scroller-img { width: 40px; height: 40px; border-radius: 8px; background-size: cover; background-position: center; border: 1px solid rgba(255,255,255,0.1); }
        .scroller-emoji { font-size: 1.8rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
        
        .scroller-info { flex-grow: 1; display: flex; flex-direction: column; text-align: left; }
        .scroller-name { font-size: 0.85rem; font-weight: 900; color: #fff; }
        .scroller-play { font-size: 0.65rem; color: #4caf50; font-weight: 900; margin-top: 2px; }

        /* Top-Left Version */
        .scroller-fixed-top {
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 8000; /* Place behind tutorial overlay (9999) */
            width: 250px; /* Matching the game-over scroller width */
            background: rgba(0, 0, 0, 0.6);
            border-radius: 15px;
            padding: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            transform: scale(0.8); /* Scale down slightly so it's not too intrusive */
            transform-origin: top left;
        }
        .scroller-fixed-top .scroller-inner {
            height: 160px; /* Increased height to show at least 2 games */
            overflow: hidden;
        }
        .scroller-fixed-top .scroller-title {
            margin-top: 0;
            font-size: 0.6rem;
        }

        /* Top-Right Version (for in-game display) */
        .scroller-fixed-top-right {
            position: fixed;
            top: 70px; /* Below header */
            right: 180px;
            z-index: 35; /* Below HUD (40) but above game canvas */
            width: 200px; /* Reduced width */
            background: rgba(0, 0, 0, 0.85);
            border-radius: 12px;
            padding: 8px; /* Reduced padding */
            border: 2px solid rgba(255, 107, 53, 0.5);
            backdrop-filter: blur(15px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
            transform: scale(0.9); /* Scale down slightly */
            transform-origin: top right;
        }
        .scroller-fixed-top-right .scroller-inner {
            height: 140px; /* Reduced height */
            overflow: hidden;
            gap: 6px; /* Tighter gap */
        }
        .scroller-fixed-top-right .scroller-title {
            margin-top: 0;
            font-size: 0.55rem; /* Smaller title */
            color: #ff6b35;
            margin-bottom: 6px;
        }
        .scroller-fixed-top-right .scroller-item {
            background: rgba(255, 107, 53, 0.1);
            padding: 6px; /* Smaller item padding */
            border-radius: 8px;
            gap: 8px;
        }
        .scroller-fixed-top-right .scroller-img {
            width: 30px; /* Smaller images */
            height: 30px;
        }
        .scroller-fixed-top-right .scroller-name {
            font-size: 0.7rem; /* Smaller text */
        }
        .scroller-fixed-top-right .scroller-play {
            font-size: 0.55rem;
        }
        .scroller-fixed-top-right .scroller-item {
            background: rgba(255, 107, 53, 0.1);
        }
        .scroller-fixed-top-right .scroller-item:hover {
            background: rgba(255, 107, 53, 0.25);
        }

        /* Hide on mobile */
        @media (max-width: 768px) {
            .scroller-fixed-top-right {
                display: none;
            }
        }

        /* 10+ Games Pill Button */
        .more-games-pill {
            position: fixed;
            bottom: 56px;
            left: 10px;
            z-index: 9999;
            padding: 5px 12px;
            background: linear-gradient(to bottom, #FFB700 0%, #FF8800 50%, #FF7700 100%);
            border-radius: 50px;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.5);
            border: 1.5px solid rgba(255,255,255,0.3);
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            overflow: hidden;
            animation: pill-pulse 2s infinite ease-in-out;
        }
        .more-games-pill:hover {
            transform: scale(1.1) translateY(-3px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.5), inset 0 2px 1px rgba(255,255,255,0.6);
            background: linear-gradient(to bottom, #FFC700 0%, #FF9900 50%, #FF8800 100%);
        }
        .more-games-pill:active {
            transform: scale(0.95);
        }
        .more-games-pill .text {
            color: white;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            font-weight: 900;
            font-size: 11px;
            letter-spacing: 0.3px;
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
            position: relative;
            z-index: 2;
            pointer-events: none;
        }
        .more-games-pill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 50%;
            background: linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%);
            border-radius: 50px 50px 0 0;
            z-index: 1;
        }
        @keyframes pill-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(styles);
}

function renderTopLeftScroller() {
    // 🚫 Skip on mobile
    if (isMobileDevice()) {
        console.log("📱 Mobile detected — scroller hidden");
        return;
    }

    // Create container if not exists
    let container = document.getElementById('top-left-game-scroller');
    if (!container) {
        container = document.createElement('div');
        container.id = 'top-left-game-scroller';
        document.body.appendChild(container);
    }

    renderGameScroller('top-left-game-scroller');
    container.classList.add('scroller-fixed-top');
}

function renderTopRightScroller() {
    // 🚫 Skip on mobile
    if (isMobileDevice()) {
        console.log("📱 Mobile detected — top-right scroller hidden");
        return;
    }

    // Create container if not exists
    let container = document.getElementById('top-right-game-scroller');
    if (!container) {
        container = document.createElement('div');
        container.id = 'top-right-game-scroller';
        document.body.appendChild(container);
    }

    renderGameScroller('top-right-game-scroller');
    container.classList.add('scroller-fixed-top-right');
}

/**
 * Render floating "10+ Games" Pill Button
 */
function renderMoreGamesPill() {
    // 🚫 Don't show on the main landing page
    const path = location.pathname;
    if (path === "/" || path.endsWith("/index.html") || path === "") {
        // If it's the root index.html, we check if it's actually a sub-game or the portal
        // Most games are in subfolders like /Stack3D/index.html
        const parts = path.split('/').filter(p => p !== "");
        if (parts.length === 0 || (parts.length === 1 && parts[0] === "index.html")) {
            return;
        }
    }

    // Create container
    let btn = document.getElementById('more-games-floating-btn');
    if (!btn) {
        btn = document.createElement('a');
        btn.id = 'more-games-floating-btn';
        btn.href = "../index.html";
        btn.innerHTML = '<span class="text">10+ GAMES</span>';
        document.body.appendChild(btn);
    }

    btn.className = 'more-games-pill';

    // Remove any existing legacy more games elements if present
    const legacy = document.querySelectorAll('.bottom-right-more-games, #more-games-btn-old, .more-games-btn-bottom');
    legacy.forEach(el => el.remove());
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderMoreGamesPill);
} else {
    renderMoreGamesPill();
}
