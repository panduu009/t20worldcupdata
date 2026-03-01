// Firebase Configuration and Initialization
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyASUGGdc-TgkBEgRoJye1fNrYv8nf78uM0",
    authDomain: "t20-world-cup-data-analytics.firebaseapp.com",
    projectId: "t20-world-cup-data-analytics",
    storageBucket: "t20-world-cup-data-analytics.firebasestorage.app",
    messagingSenderId: "1086463352938",
    appId: "1:1086463352938:web:92ad17ea2456a82bf4ea13",
    measurementId: "G-M88Q37JTWE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };
