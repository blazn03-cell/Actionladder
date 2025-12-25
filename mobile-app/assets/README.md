ActionLadder Mobile App - Assets

This folder contains placeholder scalable assets for the mobile app. Replace these with final PNGs exported by your designer.

Files included (placeholders):
- `icon.svg` — 1024x1024 recommended app icon
- `splash.svg` — 1284x2778 recommended splash image
- `favicon.svg` — 48x48 small favicon

Suggested conversion commands (ImageMagick):

---bash
# Convert to PNG (1024x1024) for `icon.png`
magick convert icon.svg -resize 1024x1024 -background none icon.png

# Convert to PNG (1284x2778) for splash
magick convert splash.svg -resize 1284x2778 -background none splash.png

# Convert favicon
magick convert favicon.svg -resize 48x48 favicon.png
---

Or use Inkscape on Windows/macOS/Linux:

---bash
inkscape icon.svg --export-type=png --export-filename=icon.png --export-width=1024 --export-height=1024
inkscape splash.svg --export-type=png --export-filename=splash.png --export-width=1284 --export-height=2778
inkscape favicon.svg --export-type=png --export-filename=favicon.png --export-width=48 --export-height=48
---

Where to place generated files:
- `mobile-app/assets/icon.png`
- `mobile-app/assets/splash.png`
- `mobile-app/assets/favicon.png`

Update mobile app configuration if you change filenames:
- `mobile-app/App.js` — check `APP_URL` constant for backend URL
- `mobile-app/app.json` — update `extra.actionLadder.apiUrl` and any icon/splash references

Notes:
- These SVGs are placeholders and intentionally simple so designers can easily replace them.
- For Play/App Store builds, prefer PNGs at exact sizes the `eas` profile expects — check `mobile-app/BUILD.md`.
