# iLike — Session 2 hotfix: profile photo missing in the circle

Replace only these two files, then commit and push as usual:

- `app.js`
- `sw.js` (cache version is now `ilike-v34`)

`index.html` and `style.css` from the Session 2 bundle stay as they are. No SQL changes.

## What was wrong
On **You**, the profile circle's photo is stored as an inline style on the avatar element. `meClear()` (the desktop scroll-header reset that also runs on narrower screens) removed the whole inline style, so the photo disappeared. The photo link kept working, which is why tapping the circle still opened the image.

## What changed
`meClear()` now removes only the scroll animation's `transform` from the avatar, so the photo stays. Nothing else about the profile header changed.

## Please check
- Open **You** on your phone: the photo should show inside the circle, also after rotating the phone or switching tabs and back.
- On desktop, scroll the profile: the photo should still shrink into the compact bar and grow back.
