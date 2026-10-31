# iLike: app.js split into js/ files (no behavior change)

`app.js` (3,295 lines) is now 18 smaller files in a new `js/` folder. The app does the same thing as before; only the file layout changed.

## Do this, in order
1. **Add** the whole `js/` folder (18 files) to your repo.
2. **Replace** `index.html` and `sw.js` (cache version is now `ilike-v43`).
3. **Delete** the old `app.js` from the repo (nothing loads it any more).
4. Add `MAP.md` (a guide for working with AI). `style.css`, `manifest.webmanifest`, `index.ts` and `assets/` stay as they are. No SQL changes.
5. Commit and push as usual.

## Please check
- Open the app, sign in, and click through Home, Discover, Events, Chats, You, Settings.
- Open an event (chat, gallery, comments) and a profile.
- Phones that already have the app: close and reopen it once or twice so the new cache is picked up.
- If anything is blank or stuck, check the browser console for "script failed", which means a file in `js/` is missing from the repo.

## Notes
- One visible text changed: the admin panel now says `INTEREST_CATALOG in js/catalog.js` instead of `app.js`.
- `sw.js` in the repo you uploaded said v42; the old DEPLOY.md said v34. Now it is v43.
