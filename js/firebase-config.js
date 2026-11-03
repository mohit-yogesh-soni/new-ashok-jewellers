// =========================================================
// Firebase configuration for New Ashok Jewellers
// This uses the browser (CDN) version of Firebase — no build step needed,
// so it works directly on GitHub Pages.
//
// NOTE: These values are NOT secret. Firebase web apps are designed to
// expose this config in the browser. Security is enforced by Firebase
// "Security Rules" (which we set up separately), not by hiding these keys.
// =========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBo52y_A1EzEBCPHazPNmwBrxKGDA3EMbY",
    authDomain: "new-ashok-jewellers.firebaseapp.com",
    projectId: "new-ashok-jewellers",
    storageBucket: "new-ashok-jewellers.firebasestorage.app",
    messagingSenderId: "230672352718",
    appId: "1:230672352718:web:7db8d37ea24f85f495979f"
};

// Initialize Firebase and the services we'll use
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
