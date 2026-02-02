# Social Bar Ad Analytics Implementation

## Overview
Added Firebase Analytics tracking for social bar ad success and failure events in both **Helix Ball (Helix Bounce)** and **Stack 3D** games.

## Changes Made

### File Modified: `/Users/gauravpurohit/Documents/GP/PlayMixGames/ads.js`

Enhanced the `loadSocialBarAd()` function to track ad loading outcomes:

#### 1. **Success Event: `social_bar_ad_success`**
- Fires when the social bar ad script loads successfully
- Event parameters:
  - `ad_type`: "social_bar"
  - `page`: Current page pathname (e.g., "/HelixBounce/index.html")

#### 2. **Failure Event: `social_bar_ad_failed`**
- Fires when the social bar ad script fails to load
- Event parameters:
  - `ad_type`: "social_bar"
  - `page`: Current page pathname
  - `error_message`: "Script failed to load"

## How It Works

The implementation uses JavaScript's `script.onload` and `script.onerror` event handlers:

```javascript
socialBarScript.onload = () => {
    // Track success
    window.trackGameEvent("social_bar_ad_success", {
        ad_type: "social_bar",
        page: location.pathname
    });
};

socialBarScript.onerror = (error) => {
    // Track failure
    window.trackGameEvent("social_bar_ad_failed", {
        ad_type: "social_bar",
        page: location.pathname,
        error_message: "Script failed to load"
    });
};
```

## Games Affected

Both games automatically inherit this functionality since they both call `loadSocialBarAd()` in their HTML files:

1. **Helix Bounce** (`/HelixBounce/index.html`)
2. **Stack 3D** (`/Stack3D/index.html`)

## Firebase Analytics Dashboard

You can now track these events in your Firebase Analytics console:

- **Event Name**: `social_bar_ad_success`
- **Event Name**: `social_bar_ad_failed`

### Useful Metrics to Monitor:
- **Success Rate**: (success events / total attempts) × 100
- **Failure Rate**: (failed events / total attempts) × 100
- **Page-specific performance**: Which game has better ad load rates
- **Error patterns**: When and why ads fail to load

## Testing

To test the implementation:

1. **Success Case**: Load the game normally - should fire `social_bar_ad_success`
2. **Failure Case**: Block the ad domain or disconnect internet - should fire `social_bar_ad_failed`
3. **Dev Mode**: Set `?dev=true` in URL - no events fire (ads blocked)

## Console Logging

Enhanced console messages for debugging:
- `📊 [ADS] Social Bar ad script injected` - Script injection started
- `✅ [ADS] Social Bar ad loaded successfully` - Success
- `❌ [ADS] Social Bar ad failed to load` - Failure with error details

## Next Steps

Consider adding similar tracking for:
- Banner ads (`loadBannerAd()`)
- Smartlink ads (`loadSmartlinkAd()`)
- Rewarded ads (bonus button clicks)
