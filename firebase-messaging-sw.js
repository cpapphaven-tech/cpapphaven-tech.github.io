importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAZbf-2WaiNXZqA6t1eLQ2kT1BknB5euiA",
    authDomain: "stack3d-70a5d.firebaseapp.com",
    projectId: "stack3d-70a5d",
    storageBucket: "stack3d-70a5d.firebasestorage.app",
    messagingSenderId: "186332003818",
    appId: "1:186332003818:web:12b7cfca540053fa730693",
    measurementId: "G-CPN66STY2S"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png' // Make sure this path exists or use a generic one
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
