# QuantView — Web App (PWA)

Static, installable web app for Colombo Stock Exchange charts and side-by-side
symbol comparison. No build step — just static files.

## Files
- `index.html` — the app
- `cse-symbols.js` — CSE symbol directory
- `manifest.webmanifest` — PWA manifest (install metadata)
- `sw.js` — service worker (offline app shell + caching)
- `icons/` — app icons

## Run locally
A service worker only works over `http(s)` or `localhost` — opening `index.html`
directly from the file system (`file://`) will load the app but **not** install/offline.

From this folder:

    python3 -m http.server 8000

Then open http://localhost:8000

## Deploy
Upload the whole folder to any static host. It works as-is on:
- GitHub Pages
- Netlify (drag-and-drop the folder)
- Cloudflare Pages
- Vercel (framework preset: "Other")
- Any nginx/Apache static directory

Requirements: serve over **HTTPS** (all the hosts above do automatically) so the
service worker can register and the app becomes installable ("Add to Home Screen" /
the install icon in the desktop address bar).

## Updating
After changing any file, bump `CACHE_VERSION` in `sw.js` (e.g. `quantview-v2` ->
`quantview-v3`) and redeploy. Clients will pick up the new version on next load.

## Notes
- Live charts/quotes come from TradingView and require a network connection; the
  service worker intentionally does not cache them. Offline mode serves the app
  shell and the symbol list.
- Sharing a symbol link (`?tvwidgetsymbol=CSELK:JKH.N0000`) opens straight into that
  chart; `?tab=compare` and `?tab=market` open those sections.
