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
