// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics, logEvent, setUserProperties } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAZbf-2WaiNXZqA6t1eLQ2kT1BknB5euiA",
    authDomain: "stack3d-70a5d.firebaseapp.com",
    projectId: "stack3d-70a5d",
    storageBucket: "stack3d-70a5d.firebasestorage.app",
    messagingSenderId: "186332003818",
    appId: "1:186332003818:web:12b7cfca540053fa730693",
    measurementId: "G-CPN66STY2S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

window.FIREBASE_INITIALIZED = true;

console.log("Firebase Analytics Initialized");

// Set User Property
setUserProperties(analytics, { app_version: window.APP_VERSION });

// --- Firebase Cloud Messaging (Push Notifications) ---
const messaging = getMessaging(app);

// Request Permission on user interaction (recommended to call this on a button click, but auto-asking for now per request)
// In a real app, you should have a "Subscribe" button.
async function requestPermission() {
    console.log('Requesting permission...');
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            // Get Token
            const token = await getToken(messaging, {
                vapidKey: 'BIUOxmUqsiKTKdr0dvEpN2ae9AMwtYhrvtGRqfUPR1b7KmisvVFuZzZepSsgDwkhaeINFAFAqUygkSTQ_WImsHs'
            });
            if (token) {
                console.log('FCM Token:', token);
                // Save this token to your server or log it to analytics
                logEvent(analytics, "fcm_token_generated", { token_id: "generated" });
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } else {
            console.log('Unable to get permission to notify.');
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
    }
}

// Handle foreground messages — show a non-blocking toast instead of alert()
onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:12px 20px;border-radius:12px;font-size:0.9rem;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.4);';
    toast.textContent = `📢 ${payload?.notification?.title || ''}: ${payload?.notification?.body || ''}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
});

// Request notification permission ONLY on first meaningful user interaction
// (browsers require a user gesture — auto-requesting is blocked since Chrome 80)
let _notifRequested = false;
function requestPermissionOnInteraction() {
    if (_notifRequested || Notification.permission !== 'default') return;
    _notifRequested = true;
    requestPermission();
    document.removeEventListener('click', requestPermissionOnInteraction);
    document.removeEventListener('scroll', requestPermissionOnInteraction);
    document.removeEventListener('keydown', requestPermissionOnInteraction);
}
document.addEventListener('click',   requestPermissionOnInteraction, { once: true, passive: true });
document.addEventListener('scroll',  requestPermissionOnInteraction, { once: true, passive: true });
document.addEventListener('keydown', requestPermissionOnInteraction, { once: true, passive: true });

// --- End FCM ---

// Expose global tracker for vanilla JS games
window.trackGameEvent = function (eventName, eventParams) {
    try {
        logEvent(analytics, eventName, eventParams);
        console.log("📊 Analytics Event:", eventName, eventParams);
    } catch (e) {
        console.warn("Analytics Error:", e);
    }
};

window.trackAdImpression = function (type) {
    if (!window.trackGameEvent) return;
    window.trackGameEvent(`ad_${type}_impression`, {
        page: location.pathname
    });
};

