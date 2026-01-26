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

function shouldLoadAds() {
    // Disable on localhost/127.0.0.1 (development environment)
    if (
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1"
    ) {
        console.log('🚧 [ADS] Disabled on localhost');
        return false;
    }

    // Disable if developer cookie exists
    if (document.cookie.includes("noads=true")) {
        console.log('🚧 [ADS] Disabled via cookie (noads=true)');
        return false;
    }

    // Disable if URL flag exists (?dev=true)
    const params = new URLSearchParams(location.search);
    if (params.get("dev") === "true") {
        console.log('🚧 [ADS] Disabled via URL parameter (?dev=true)');
        return false;
    }

    // Ads are enabled
    console.log('✅ [ADS] Ads enabled - loading ad scripts');
    return true;
}

/**
 * Load Social Bar Ad
 * Conditionally loads the effectivegatecpm social bar
 */
function loadSocialBarAd() {
    if (!shouldLoadAds()) {
        console.log('🚧 [ADS] Skipping Social Bar ad');
        return;
    }

    const socialBarScript = document.createElement('script');
    socialBarScript.src = 'https://pl28566875.effectivegatecpm.com/50/ce/d8/50ced8d3053d18abbee81fdcf51b4216.js';
    document.head.appendChild(socialBarScript);
    console.log('✅ [ADS] Social Bar ad loaded');
}

/**
 * Load Banner Ad
 * Conditionally loads the highperformanceformat banner ad
 */
function loadBannerAd() {
    if (!shouldLoadAds()) {
        console.log('🚧 [ADS] Skipping banner ad');
        return;
    }

    // Set atOptions configuration
    window.atOptions = {
        'key': 'de617c07128b585ef939154460e6858f',
        'format': 'iframe',
        'height': 50,
        'width': 320,
        'params': {}
    };

    // Load banner ad script
    const bannerScript = document.createElement('script');
    bannerScript.src = 'https://www.highperformanceformat.com/de617c07128b585ef939154460e6858f/invoke.js';
    document.body.appendChild(bannerScript);
    console.log('✅ [ADS] Banner ad loaded');
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
