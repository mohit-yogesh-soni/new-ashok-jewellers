// =========================================================
// Admin logic: login, upload (with background removal), list, delete
// =========================================================

import { auth, db } from "./firebase-config.js";
import { CLOUDINARY } from "./cloudinary-config.js";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// NOTE: The background-removal library is loaded LATER (only when needed),
// via a dynamic import, so that if it ever fails to load it does NOT crash
// login / upload. See getRemoveBackground() below.
//
// Load the model + wasm files from the unpkg CDN. unpkg serves the full
// @imgly model data (unlike jsdelivr which blocks it for size), so we don't
// need to host the large model files in our GitHub repo at all.
const BG_PUBLIC_PATH = "https://unpkg.com/@imgly/background-removal-data@1.4.5/dist/";

// Lazily load the removeBackground function the first time it's needed.
let _removeBg = null;
async function getRemoveBackground() {
    if (_removeBg) return _removeBg;
    // Use esm.sh (bundles dependencies like lodash correctly, avoiding the
    // jsdelivr "memoize export" error).
    const mod = await import("https://esm.sh/@imgly/background-removal@1.4.5");
    _removeBg = mod.removeBackground;
    return _removeBg;
}

// ---- Grab elements ----
const loginView   = document.getElementById("loginView");
const uploadView  = document.getElementById("uploadView");
const loginForm   = document.getElementById("loginForm");
const loginError  = document.getElementById("loginError");
const userEmail   = document.getElementById("userEmail");
const logoutBtn   = document.getElementById("logoutBtn");

const uploadForm   = document.getElementById("uploadForm");
const jFile        = document.getElementById("jFile");
const preview      = document.getElementById("preview");
const removeBgChk  = document.getElementById("removeBg");
const uploadStatus = document.getElementById("uploadStatus");
const itemsList    = document.getElementById("itemsList");

// =========================================================
// AUTH — show login or upload view depending on sign-in state
// =========================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginView.style.display  = "none";
        uploadView.style.display = "block";
        userEmail.textContent = user.email;
        loadItems();
    } else {
        loginView.style.display  = "block";
        uploadView.style.display = "none";
    }
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const email = document.getElementById("email").value.trim();
    const pass  = document.getElementById("password").value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
        // Show the real Firebase error code so we know exactly what's wrong
        loginError.textContent = "Login failed: " + (err.code || err.message || err);
        console.error("Login error:", err);
    }
});

logoutBtn.addEventListener("click", () => signOut(auth));

// =========================================================
// PREVIEW selected image
// =========================================================
jFile.addEventListener("change", () => {
    preview.innerHTML = "";
    const file = jFile.files[0];
    if (file) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        preview.appendChild(img);
    }
});

// =========================================================
// UPLOAD — (1) remove background, (2) send to Cloudinary, (3) save in Firestore
// =========================================================
uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = jFile.files[0];
    if (!file) return;

    const type = document.getElementById("jType").value;
    const name = document.getElementById("jName").value.trim();

    let toUpload = file;

    // (1) Background removal (in the browser)
    if (removeBgChk.checked) {
        try {
            uploadStatus.textContent = "Removing background… (first time loads the model, ~30s)";
            const removeBackground = await getRemoveBackground();
            // Use our self-hosted model + wasm under ./models/ (no CDN limits/403).
            const blob = await removeBackground(file, {
                publicPath: BG_PUBLIC_PATH,
                model: "medium"   // higher quality model we self-host in ./models/
            });
            toUpload = new File([blob], "cutout.png", { type: "image/png" });
        } catch (err) {
            console.error("Background removal failed:", err);
            uploadStatus.textContent = "✗ Background removal failed: " + (err.message || err);
            return;
        }
    }

    // (2) Upload to Cloudinary (unsigned)
    let secureUrl;
    try {
        uploadStatus.textContent = "Uploading image…";
        const form = new FormData();
        form.append("file", toUpload);
        form.append("upload_preset", CLOUDINARY.uploadPreset);

        const res = await fetch(CLOUDINARY.uploadUrl, { method: "POST", body: form });
        const data = await res.json();
        if (!data.secure_url) {
            const msg = data.error ? data.error.message : "unknown Cloudinary error";
            throw new Error(msg);
        }
        secureUrl = data.secure_url;
    } catch (err) {
        console.error("Cloudinary upload failed:", err);
        uploadStatus.textContent = "✗ Cloudinary upload failed: " + (err.message || err);
        return;
    }

    // (3) Save record in Firestore
    try {
        uploadStatus.textContent = "Saving…";
        await addDoc(collection(db, "jewellery"), {
            type: type,
            name: name || type,
            url: secureUrl,
            createdAt: serverTimestamp()
        });
        uploadStatus.textContent = "✓ Uploaded successfully!";
        uploadForm.reset();
        preview.innerHTML = "";
        loadItems();
    } catch (err) {
        console.error("Firestore save failed:", err);
        uploadStatus.textContent = "✗ Saving failed: " + (err.message || err);
    }
});

// =========================================================
// LIST + DELETE uploaded items
// =========================================================
async function loadItems() {
    itemsList.innerHTML = "<p class='admin-hint'>Loading…</p>";
    try {
        const q = query(collection(db, "jewellery"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        if (snap.empty) {
            itemsList.innerHTML = "<p class='admin-hint'>No items yet.</p>";
            return;
        }
        itemsList.innerHTML = "";
        snap.forEach((docSnap) => {
            const d = docSnap.data();
            const div = document.createElement("div");
            div.className = "admin-item";
            div.innerHTML = `
                <button class="del" title="Delete">✕</button>
                <img src="${d.url}" alt="${d.name}" />
                <span>${d.name} · ${d.type}</span>
            `;
            div.querySelector(".del").addEventListener("click", async () => {
                if (confirm("Delete this item?")) {
                    await deleteDoc(doc(db, "jewellery", docSnap.id));
                    loadItems();
                }
            });
            itemsList.appendChild(div);
        });
    } catch (err) {
        console.error(err);
        itemsList.innerHTML = "<p class='admin-hint'>Could not load items.</p>";
    }
}
