# New Ashok Jewellers — Website

A simple, elegant, frontend-only website for **New Ashok Jewellers, Kalol**.
Built with plain HTML, CSS and JavaScript — no backend, no build step. Perfect for free hosting on GitHub Pages.

## Folder structure

```
new-ashok-jewellers/
├── index.html      # The full page
├── css/style.css   # Gold & silver luxury theme + animations
├── js/script.js    # Navbar, mobile menu, scroll animations
└── README.md       # This file
```

## Run it locally

Just open `index.html` in any browser. That's it.

Or, for a local server (optional):

```
# From inside the new-ashok-jewellers folder
python3 -m http.server 8000
# then open http://localhost:8000
```

## Host it free on GitHub Pages

1. Create a new repository on GitHub, e.g. `new-ashok-jewellers`.
2. Upload the contents of this folder (so `index.html` is at the repo root).
3. Go to **Settings → Pages**.
4. Under **Source**, choose branch `main` and folder `/ (root)`, then **Save**.
5. After a minute your site will be live at:
   `https://<your-username>.github.io/new-ashok-jewellers/`

## Replace placeholder photos with your own

Right now the images come from free, royalty-free stock photos (Unsplash).
To use your own shop/ornament photos:

1. Create an `images/` folder inside this project.
2. Put your photos there (e.g. `necklace.jpg`, `rings.jpg`).
3. In `index.html`, replace the `src="https://images.unsplash.com/..."` links
   with your local paths, e.g. `src="images/necklace.jpg"`.

Tip: keep images under ~300 KB each for fast loading.

## Things you can update later

- **Exact shop address** — currently shown as "Kalol, Gujarat". Update it in the
  "Visit Our Store" section of `index.html` and in the Google Maps link.
- **Owner / story text** — in the "About" section.
- **Phone / WhatsApp** — currently `+91 98259 54963` (search for `9825954963` in `index.html`).

## Contact details used on the site

- Shop: New Ashok Jewellers, Kalol
- Owner: Yogesh Pannalal Soni
- Phone / WhatsApp: +91 98259 54963
- Timings: Open daily 10 AM – 8 PM (closed Tuesdays)
