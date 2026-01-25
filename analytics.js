// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

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

console.log("Firebase Analytics Initialized");
