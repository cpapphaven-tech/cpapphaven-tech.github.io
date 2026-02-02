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
    if (!shouldLoadAds()) {
        console.log('🚧 [ADS] Skipping Social Bar ad');
        return;
    }

    let adRendered = false;
    let scriptLoaded = false;
    let renderCheckTimeout = null;
    let observer = null;

    // Function to track ad rendering success
    function trackAdRendered() {
        if (adRendered) return; // Prevent duplicate tracking
        adRendered = true;

        if (window.trackGameEvent) {
            window.trackGameEvent("social_bar_ad_rendered", {
                ad_type: "social_bar",
                page: location.pathname,
                render_time: Date.now() - startTime
            });
        }
        console.log('✅ [ADS] Social Bar ad RENDERED successfully');

        // Cleanup
        if (observer) observer.disconnect();
        if (renderCheckTimeout) clearTimeout(renderCheckTimeout);
    }

    // Function to track ad rendering failure
    function trackAdRenderFailed(reason) {
        if (adRendered) return; // Ad already rendered, ignore

        if (window.trackGameEvent) {
            window.trackGameEvent("social_bar_ad_render_failed", {
                ad_type: "social_bar",
                page: location.pathname,
                error_message: reason,
                script_loaded: scriptLoaded
            });
        }
        console.error('❌ [ADS] Social Bar ad RENDER FAILED:', reason);

        // Cleanup
        if (observer) observer.disconnect();
        if (renderCheckTimeout) clearTimeout(renderCheckTimeout);
    }

    const startTime = Date.now();
    const socialBarScript = document.createElement('script');
    socialBarScript.src = 'https://pl28566875.effectivegatecpm.com/50/ce/d8/50ced8d3053d18abbee81fdcf51b4216.js';

    socialBarScript.onload = () => {
        scriptLoaded = true;
        if (window.trackAdImpression) trackAdImpression("social");

        // Track script load (but not rendering yet)
        if (window.trackGameEvent) {
            window.trackGameEvent("social_bar_ad_script_loaded", {
                ad_type: "social_bar",
                page: location.pathname
            });
        }
        console.log('📥 [ADS] Social Bar ad script loaded (waiting for render...)');

        // Watch for ad elements being added to the DOM
        observer = new MutationObserver((mutations) => {
            // Look for common ad container patterns
            const adSelectors = [
                'iframe[src*="effectivegatecpm"]',
                'iframe[src*="adserver"]',
                'div[id*="ad"]',
                'div[class*="ad"]',
                'ins.adsbygoogle',
                '[data-ad-client]'
            ];

            for (const selector of adSelectors) {
                const adElement = document.querySelector(selector);
                if (adElement && adElement.offsetHeight > 0 && adElement.offsetWidth > 0) {
                    // Ad element found and visible!
                    trackAdRendered();
                    return;
                }
            }
        });

        // Start observing DOM changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Set timeout - if ad doesn't render in 10 seconds, consider it failed
        renderCheckTimeout = setTimeout(() => {
            if (!adRendered) {
                trackAdRenderFailed("Ad did not render within 10 seconds");
            }
        }, 10000);
    };

    socialBarScript.onerror = (error) => {
        scriptLoaded = false;

        // Track script load failure
        if (window.trackGameEvent) {
            window.trackGameEvent("social_bar_ad_script_failed", {
                ad_type: "social_bar",
                page: location.pathname,
                error_message: "Script failed to load"
            });
        }
        console.error('❌ [ADS] Social Bar ad script FAILED to load:', error);
    };

    document.head.appendChild(socialBarScript);
    console.log('📊 [ADS] Social Bar ad script injected');
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
    bannerScript.onload = () => {
        if (window.trackAdImpression) trackAdImpression("banner");
    };
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
