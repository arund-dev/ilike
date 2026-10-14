# iLike — Session 2 deployment bundle

Replace these four files next to the existing `manifest.webmanifest` and `assets/` folder, then commit and push as usual:

- `index.html`
- `app.js`
- `style.css`
- `sw.js` (cache version is now `ilike-v33`)

No SQL changes. Ticket prices, ticket buttons and the reservation handler are untouched. The README is unchanged for now.

## Requested fixes
- **Mobile Add button** is now a perfect circle.
- **Desktop sidebar (collapsed)** shows icons only; labels (including the "Add" label) appear only when the sidebar expands.
- **Comment icon** on posts is a new rounded speech-bubble with text lines.
- **Event view** (desktop and tablets) is a wider centred panel (up to 1040 px) over a blurred backdrop. Clicking the backdrop closes it, like the other pop-ups. On phones it stays full screen.

## Session 2: Settings and Edit profile
- **Settings** has a fixed header with a close button and a scrolling body. Groups: Appearance, Notifications, Privacy & safety, Account (email, change password, log out, delete account), Help & about, Moderation (moderators only).
- Change password opens inline when tapped and closes after a successful update.
- **Edit profile** has Cancel / Save in a fixed header. Save stays disabled until something changes and shows "Saving...". Name and username get inline errors, and the username is checked for availability when you leave the field. Cancel, the backdrop, Back or Esc ask before discarding unsaved edits. Photo and banner still save immediately, and a note says so.
- **Shared behavior:** the field you are typing in scrolls into view when the keyboard opens, in every pop-up sheet.

## Bug fixed along the way
- `.set-action{display:flex!important}` overrode the `hidden` attribute, so "Install iLike" and "Moderation tools" could show to everyone. Hidden rows now stay hidden.

## Please test on real devices
- Edit profile: change a field, then try Cancel, backdrop tap and Back (all should ask first); save with an empty name and with a taken username.
- Settings: keyboard open while changing the password; the panel should stay scrollable.
- Event view on a laptop and a tablet: backdrop blur and click-to-close.
