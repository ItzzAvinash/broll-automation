# Brand Fonts

## Gotham Italic

Gotham is a commercial typeface from Hoefler & Co. We can't ship it in the repo, so the app currently uses **Montserrat Italic** (loaded via Google Fonts) as a graceful fallback. The `@font-face` declaration in `src/index.css` already points to:

- `/fonts/Gotham-BookItalic.woff2`
- `/fonts/Gotham-BookItalic.woff`

To activate the real Gotham:

1. Obtain a licensed `Gotham-BookItalic.woff2` (and ideally `.woff`) file.
2. Drop it into this folder (`/app/frontend/public/fonts/`).
3. Hard-refresh — the CSS `font-family: 'Gotham'` will pick it up automatically.

No code changes required.
