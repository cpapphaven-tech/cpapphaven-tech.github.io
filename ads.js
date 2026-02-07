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
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    new URLSearchParams(location.search).get("dev") === "true" ||
    document.cookie.includes("noads=true");

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
    return true;
}


/**
 * Load Social Bar Ad
 * Conditionally loads the effectivegatecpm social bar
 * Tracks both script loading AND actual ad rendering
 */
function loadSocialBarAd() {
    if (!shouldLoadAds()) return;

    // Inject ad script (same as <script src=...>)
    const script = document.createElement("script");
    script.src = "https://pl28566875.effectivegatecpm.com/50/ce/d8/50ced8d3053d18abbee81fdcf51b4216.js";
    document.head.appendChild(script);

    // Fire 1 tracking event
    if (window.trackGameEvent) {
        const osKey = getOSKey();

        window.trackGameEvent(`social_bar_requested_${osKey}`, {
            ad_type: "social_bar",
            page: location.pathname
        });
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

    // Track event (same style as social bar)
    if (window.trackGameEvent) {
        const osKey = getOSKey();

        window.trackGameEvent(`banner_ad_requested_${osKey}`, {
            ad_type: "banner",
            page: location.pathname
        });
    }
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


    if (window.trackAdImpression) trackAdImpression("reward");

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
        { name: "Basketball 3D", url: "../Basketball3D/index.html", emoji: "🏀", color: "#e65100" },
        { name: "Helix Bounce", url: "../HelixBounce/index.html", img: "../assets/helixbounce.png", color: "#cc00cc" }
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

        const speed = 0.5; // Pixels per frame
        function autoScroll() {
            if (!inner) return;
            inner.scrollTop += speed;
            if (inner.scrollTop >= inner.scrollHeight / 2) {
                inner.scrollTop = 0;
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
            z-index: 9999;
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
            height: 110px; /* Height for exactly 2 games with text */
            overflow: hidden;
        }
        .scroller-fixed-top .scroller-title {
            margin-top: 0;
            font-size: 0.6rem;
        }
    `;
    document.head.appendChild(styles);
}

function renderTopLeftScroller() {
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
