// =========================================================
// Virtual Try-On: requires login (ANY visitor can create an account
// and sign in — not just the admin). Camera + MediaPipe FaceMesh overlay.
// =========================================================

import { auth, db } from "./firebase-config.js";
import {
    signInWithEmailAndPassword, createUserWithEmailAndPassword,
    signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---- login elements ----
const loginView  = document.getElementById("loginView");
const tryonView  = document.getElementById("tryonView");
const authForm   = document.getElementById("authForm");
const authError  = document.getElementById("authError");
const userEmail  = document.getElementById("userEmail");
const logoutBtn  = document.getElementById("logoutBtn");
const toggleMode = document.getElementById("toggleMode");
const authTitle  = document.getElementById("authTitle");
const authSubmit = document.getElementById("authSubmit");

let isSignup = false;   // false = sign in, true = create account

// ---- try-on elements ----
const cam     = document.getElementById("cam");
const overlay = document.getElementById("overlay");
const camHint = document.getElementById("camHint");
const itemRow = document.getElementById("itemRow");
const tabs    = document.querySelectorAll(".picker-tab");

const ctx = overlay.getContext("2d");

// Fine-tune sliders
const adjSize = document.getElementById("adjSize");
const adjY    = document.getElementById("adjY");
const adjX    = document.getElementById("adjX");
const adjRot  = document.getElementById("adjRot");
const spreadWrap = document.getElementById("spreadWrap");

let currentType = "earring";
let selectedImg = null;   // Image object of chosen jewellery
let faceMesh = null;
let camStarted = false;

// =========================================================
// AUTH gate — any logged-in user can use the try-on
// =========================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginView.style.display = "none";
        tryonView.style.display = "block";
        userEmail.textContent = user.email;
        startEverything();
    } else {
        loginView.style.display = "block";
        tryonView.style.display = "none";
    }
});

// Toggle between "Sign In" and "Create account"
toggleMode.addEventListener("click", (e) => {
    e.preventDefault();
    isSignup = !isSignup;
    authTitle.textContent  = isSignup ? "Create Account" : "Sign In to Try";
    authSubmit.textContent = isSignup ? "Create Account" : "Sign In";
    toggleMode.textContent = isSignup ? "Already have an account? Sign in" : "New here? Create an account";
    authError.textContent  = "";
});

authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authError.textContent = "";
    const email = document.getElementById("email").value.trim();
    const pass  = document.getElementById("password").value;
    try {
        if (isSignup) {
            await createUserWithEmailAndPassword(auth, email, pass);
        } else {
            await signInWithEmailAndPassword(auth, email, pass);
        }
    } catch (err) {
        authError.textContent = humanError(err.code) || "Something went wrong.";
        console.error(err);
    }
});

logoutBtn.addEventListener("click", () => signOut(auth));

function humanError(code) {
    switch (code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Wrong email or password.";
        case "auth/email-already-in-use":
            return "This email already has an account. Please sign in.";
        case "auth/weak-password":
            return "Password should be at least 6 characters.";
        case "auth/invalid-email":
            return "Please enter a valid email.";
        default:
            return null;
    }
}

// =========================================================
// Start camera + load jewellery
// =========================================================
async function startEverything() {
    loadItems(currentType);
    if (!camStarted) {
        camStarted = true;
        await startCamera();
        await startFaceMesh();
    }
}

// ---- Tabs ----
tabs.forEach((t) => {
    t.addEventListener("click", () => {
        tabs.forEach((x) => x.classList.remove("active"));
        t.classList.add("active");
        currentType = t.dataset.type;
        selectedImg = null;
        // Reset sliders to sensible defaults for the chosen type
        adjSize.value = 1;
        adjY.value = 0;
        adjX.value = 0;
        adjRot.value = 0;
        // "Spread" only makes sense for earrings
        spreadWrap.style.display = (currentType === "earring") ? "flex" : "none";
        loadItems(currentType);
    });
});

// =========================================================
// Load jewellery of a type from Firestore
// =========================================================
async function loadItems(type) {
    itemRow.innerHTML = "<p class='admin-hint'>Loading jewellery…</p>";
    try {
        const q = query(collection(db, "jewellery"), where("type", "==", type));
        const snap = await getDocs(q);
        itemRow.innerHTML = "";
        if (snap.empty) {
            itemRow.innerHTML = "<div class='item-thumb none'>No items yet</div>";
            return;
        }
        snap.forEach((docSnap) => {
            const d = docSnap.data();
            const div = document.createElement("div");
            div.className = "item-thumb";
            const img = document.createElement("img");
            img.src = d.url;
            img.crossOrigin = "anonymous";
            div.appendChild(img);
            div.addEventListener("click", () => {
                document.querySelectorAll(".item-thumb").forEach((x) => x.classList.remove("selected"));
                div.classList.add("selected");
                const chosen = new Image();
                chosen.crossOrigin = "anonymous";
                chosen.onload = () => { selectedImg = chosen; };
                chosen.src = d.url;
            });
            itemRow.appendChild(div);
        });
    } catch (err) {
        console.error(err);
        itemRow.innerHTML = "<div class='item-thumb none'>Could not load</div>";
    }
}

// =========================================================
// Camera
// =========================================================
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: 720, height: 960 },
            audio: false
        });
        cam.srcObject = stream;
        await cam.play();
        camHint.style.display = "none";
        // size the overlay canvas to match the video
        overlay.width = cam.videoWidth || 720;
        overlay.height = cam.videoHeight || 960;
    } catch (err) {
        console.error("Camera error:", err);
        camHint.textContent = "Could not access camera. Please allow permission and reload.";
    }
}

// =========================================================
// MediaPipe FaceMesh — gives face landmarks (ears, chin, etc.)
// Loaded from CDN as global scripts.
// =========================================================
async function startFaceMesh() {
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");

    // eslint-disable-next-line no-undef
    faceMesh = new FaceMesh({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
    });
    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    faceMesh.onResults(onFaceResults);

    // eslint-disable-next-line no-undef
    const camera = new Camera(cam, {
        onFrame: async () => { await faceMesh.send({ image: cam }); },
        width: 720, height: 960
    });
    camera.start();
}

// =========================================================
// Draw jewellery based on landmarks
// FaceMesh landmark indices used:
//   234 = right ear area, 454 = left ear area
//   152 = chin bottom, 10 = forehead top (for scale)
// =========================================================
function onFaceResults(results) {
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (!selectedImg || !results.multiFaceLandmarks || !results.multiFaceLandmarks.length) return;

    const lm = results.multiFaceLandmarks[0];
    const W = overlay.width, H = overlay.height;

    // face width (ear to ear) for scaling
    const leftEar  = lm[234];
    const rightEar = lm[454];
    const faceW = Math.hypot((rightEar.x - leftEar.x) * W, (rightEar.y - leftEar.y) * H);

    // Head tilt angle (so earrings/necklace rotate with the head)
    const angle = Math.atan2((rightEar.y - leftEar.y) * H, (rightEar.x - leftEar.x) * W);

    // Read slider values
    const sizeMul = parseFloat(adjSize.value);   // 0.5 .. 2
    const offY    = parseFloat(adjY.value);       // -80 .. 80 (px, scaled by face)
    const spread  = parseFloat(adjX.value);       // -60 .. 60 (px, scaled by face)
    const rot     = parseFloat(adjRot.value) * Math.PI / 180;  // manual rotation (radians)
    const scale   = faceW / 180;                  // normalise offsets to face size

    const ratio = selectedImg.height / selectedImg.width || 1;

    if (currentType === "earring") {
        // Ear landmarks: 234 = right ear, 454 = left ear
        const rEar = lm[234];
        const lEar = lm[454];

        const ew = faceW * 0.30 * sizeMul;
        const eh = ew * ratio;

        // Earring hangs from just below the ear point; sliders nudge it.
        const yOff = eh * 0.35 + offY * scale;
        const sp   = spread * scale;

        // Head tilt + manual rotation. For the mirrored (left) ear the manual
        // rotation is flipped so the slider turns both earrings the same way.
        drawJewel(selectedImg, rEar.x * W - sp, rEar.y * H + yOff, ew, eh, angle + rot, false);
        drawJewel(selectedImg, lEar.x * W + sp, lEar.y * H + yOff, ew, eh, angle - rot, true);
    } else if (currentType === "necklace") {
        const chin = lm[152];
        const neckW = faceW * 1.5 * sizeMul;
        const neckH = neckW * (ratio || 0.6);
        const yOff = neckH * 0.55 + offY * scale;
        drawJewel(selectedImg, chin.x * W, chin.y * H + yOff, neckW, neckH, angle + rot, false);
    }
}

// Draw a jewellery image centred at (cx,cy), rotated with the head tilt,
// optionally mirrored (for the opposite ear).
function drawJewel(img, cx, cy, w, h, angle = 0, mirror = false) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    if (mirror) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
}

// =========================================================
// Helper: load an external script and wait for it
// =========================================================
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}
