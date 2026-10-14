# iLike — Session 1 deployment bundle

Replace these files in the same directory as the existing `manifest.webmanifest` and `assets/` folder:

- `index.html`
- `app.js`
- `style.css`
- `sw.js`

Keep the existing `assets/` directory, Supabase configuration, SQL, and all other repository files unchanged. Commit and push the four replacements through your normal GitHub deployment workflow.

The service-worker cache version is bumped to `ilike-v32` so installed PWAs can pick up the updated shell after deployment.

Ticket prices, ticket buttons, and the existing reservation handler are unchanged. The repeated ticket/admission card was removed from the event About section; the existing ticket entry point remains.

## Included changes

- Updated navigation icons and consistent line-style action icons.
- Reduced visual glow and idle animation; improved mobile touch targets and safe-area/keyboard sizing.
- Browser/system Back closes the topmost open sheet or overlay first; Back from another main tab returns to Home.
- Tapping the selected Home tab scrolls the feed to the top.
- Settings actions use the refreshed icon and row treatment.
- The reduced-motion preference now covers all app animations and transitions.

## Checks performed

- JavaScript and service-worker syntax checks passed.
- HTML parsing passed; all 200 element IDs are unique.
- A focused smoke test confirmed Back closes the top sheet without closing the event view underneath.
- Ticket price constants, ticket button, and reservation handler were checked for preservation.

Please test the deployed build on an actual iPhone and Android device, especially keyboard resizing, browser Back, and returning to Home. A PWA cannot intercept the operating system's Home button.
