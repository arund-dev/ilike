# iLike

iLike is an installable social app for finding people who share your interests. Users build a profile, follow people, share posts, and join interest circles.

## Features

- Email sign-up, sign-in, password recovery, and account settings.
- First-run interest selection to personalize the feed.
- Profile editing with a name, username, bio, city, avatar, and banner.
- Choose or remove developer-curated interests from category groups in the profile's **Interests** section.
- Add artists separately from interests.
- A feed with interest tags, photo posts, reactions, replies, and drafts.
- Discover people, interest circles, and featured interests.
- Following, direct messages, notifications, and event planning.
- Theme, colour, and font preferences.
- Progressive Web App installation and offline app-shell caching.

## Project files

- `index.html` contains the app screens and dialogs.
- `style.css` contains responsive layout, themes, and component styles.
- `js/` contains the interface behavior and Supabase data access, split into plain script files (see `MAP.md` for what each file does and the load order).
- `manifest.webmanifest` defines the installable app metadata and icons.
- `sw.js` (in the repo root, not in `js/`) caches the app shell and selected external libraries.
- `index.ts` is the push Edge Function for Supabase.
- `assets/` contains the app icons.

## Run the app

Serve this folder from a local or hosted web server. The service worker requires HTTP or HTTPS; opening `index.html` directly from the file system does not enable PWA installation or offline caching.

The app connects to Supabase through the URL and publishable key configured near the top of `js/core.js`. The Supabase project must provide the tables used by the app, including `profiles`, `interests`, `user_interests`, `posts`, `post_interests`, `post_images`, `sames`, `replies`, `follows`, `messages`, `notifications`, `events`, `event_goers`, `circle_messages`, `achievements`, and `user_achievements`. Authentication, row-level security policies, and storage buckets must also be configured for the operations used by the app.

## Event tab

The **Events** tab lists upcoming community events as cards, and **Show past events** at the bottom loads the last 20 on demand. Opening a card shows its full description and a comment section for member opinions. Only admins, moderators, and members in `event_authorizations` may publish events; anyone signed in may read and comment (banned or muted members cannot). Hosts can edit, cancel or delete their own events; admins and moderators can cancel any event. Comment authors can delete their own comments, and admins and moderators can delete anyone's.

Before deploying this version, run [`event-tab.sql`](event-tab.sql) in the Supabase SQL Editor. It is safe to run again, so run it again whenever the file changes. Admins and moderators can then approve or remove event publishers in **Settings → Moderation tools → Event publishers**. The permissions are enforced by a database trigger and row-level security policies as well as the interface.

**Moderation tools tabs:** every moderator sees Reports, Users and Event publishers. Lists, Invites, Feedback and Stats are admin-only, so they appear only when `profiles.role` is `admin`. To make an account an admin, run `update public.profiles set role = 'admin' where id = '<user id>';` in the SQL Editor, then reload the app.

For local development, any static web server can serve the folder. For example, with Node.js installed:

```sh
npx serve .
```

## Desktop profile layout

On screens 1024 px wide and up, **You** is split into two panes. The left pane (photo, name, bio, Interests, Artists, Achievements) and the right pane (the My posts / Liked / Photos tabs and the list under them) scroll on their own, with no visible scrollbars, and the tab bar stays in place. The banner keeps its 3:1 shape (never taller than 46% of the window). When either pane is scrolled, the banner shrinks smoothly into a slim bar while the profile photo and name float up into it, and they grow back when both panes return to the top. The behavior lives in `meLayout()`, `mePaint()` and `meSync()` in `js/profile.js` and the `.me-hero`, `.col-l` and `#mine` rules in the desktop block of `style.css`; the animation speed is `--mv` on `#me`. Phones keep the original single-column layout. If a pane has too little content to scroll, the header stays expanded.

## Event chat and gallery (shared, live)

Run [`event-live.sql`](event-live.sql) in the Supabase SQL Editor (after `event-tab.sql`; safe to run again). It creates `event_messages` (Live Chat) and `event_photos` (Gallery) and turns on live updates for both. Chat is open to the event host, people who tapped **I'm in**, admins and moderators; everyone else sees a short "join to chat" note. Messages and photos appear on every phone while the event is open, and the app catches up when it returns from the background. Members can delete their own messages and admins and moderators can delete any. Only the host, admins and moderators add or remove gallery photos. Muted members cannot send chat messages, and everyone is limited to 30 messages a minute (admins and moderators are exempt). Older chat and gallery items that were saved only on a single phone are not carried over.

## Profile page

Tapping a person opens their profile as a full-screen page (a centred panel on desktop) with Posts and Photos tabs. Opening a profile from inside another profile and pressing Back returns to the previous one, step by step. On phones the top bar turns into a slim banner strip with the small photo and name once the header scrolls away, both here and on **You**. Settings shows the installed app version at the bottom, and a newly deployed version reloads the app by itself when nothing is open or being typed.

## Maintaining the interest menu

Edit `INTEREST_CATALOG` in `js/catalog.js` to add a category or interest. Each category has a display colour and an `items` list of name and emoji pairs. When a user signs in, the app creates missing catalog rows in Supabase and updates the category, colour, and emoji of matching rows without changing their IDs. Keep existing interest names stable when possible because user selections refer to their database IDs.

Users open **You** → **Interests** → **＋ Add** to search and select entries from the categorized list. Selecting an entry already on the profile lets the user remove it from their own list. Users do not create catalog categories or interest entries through the app.

## Progressive Web App

The web manifest and service worker are registered by the app when served over HTTP or HTTPS. The service worker caches the HTML, CSS, JavaScript, manifest, and icons for offline app-shell loading. Change the cache version in `sw.js` when changing files that should replace an installed copy's cached shell.

## Invite codes and legal pages (Batch 4a)

Signups require an invite code. The check runs inside the database (a trigger on `auth.users` created by `batch4a.sql`), so it cannot be bypassed from the browser. Admins create, copy and switch off codes in **Settings → Moderation tools → Invites**. A code's link (`…/#invite=CODE`) opens the signup form with the code filled in. Terms, privacy and contact text lives in `LEGAL` in `js/legal.js`; the contact address is `CONTACT_EMAIL` in `js/core.js`.

## First-run onboarding (Batch 4b)

New accounts go through four skippable steps: interests (3 or more), photo and bio, follow a few people (the iLike team and people with shared interests are listed first), and a first post. Completion is stored in `profiles.onboarded_at` (set by the `finish_onboarding()` function from `batch4b.sql`); accounts that existed before that column was added count as onboarded. `seed.sql` adds friendly starter posts from the admin account.

## Profile and circle polish (Batch 5)

On **You**, Edit profile and Settings sit together in the top bar. Choosing a profile photo or banner (in Edit profile, and during onboarding) opens a crop editor: drag to move, pinch or use the slider to zoom, and the avatar shows the circle that will appear on the profile. Profile tabs: **My posts**, **Liked** (posts you said Same to; private to you) and **Photos**. In a circle chat, the strip under the header shows the member count (tap for the list) and a Join or Leave button. A circle is an interest, so leaving a circle also removes that interest from the profile.

## Reliability (Batch 7a)

A failed post, reply or chat message stays in its input and shows a **Retry** button; retrying first checks whether the message already reached the server, so it is never posted twice. A global error handler (inline script in `index.html`) shows a "Something went wrong, tap to reload" bar instead of a blank screen, including when the Supabase library fails to load. Replies load 30 at a time with **Show more replies**; people lists (Same, members, followers, going) show 30 at a time; the feed, Same and people queries page past Supabase's 1000-row limit through `fetchAll`. `batch7a.sql` adds a database rate limit (posts 10/min, replies 20/min, messages 30/min, mods and admins exempt) and limits the `post-images` and `avatars` buckets to 5 MB JPEG. `sw.js` now falls back to the cached copy if the network takes more than 3 seconds.

## Content cleanup (Batch 7b)

Adding an artist now ignores case, accents, spaces and punctuation (`nameKey` in `js/moderation.js`, `norm_name()` in `batch7b.sql`), and shows a **Did you mean...?** sheet for look-alikes (typos, extra words) with a "No, add as new" choice. In **Moderation tools > Lists**, **Find duplicates** scans the artist list and merges a pair in one tap. `batch7b.sql` also adds a unique index on the normalised artist name once no duplicates remain. Hosts and moderators can **Cancel event**: it stays listed as Cancelled (no I'm in button) until it passes. **Show past events** at the bottom of Meet loads the last 20 events on demand. Cancel uses the `cancel_event()` function from `batch7b.sql` and the new `events.cancelled_at` column.

## Admin stats (Batch 7c)

**Moderation tools > Stats** (admins only) shows people, active today / 7 / 30 days, a bar chart of signups, posts, replies or messages for the last 7, 14 or 30 days, and the top interests and artists. It calls the `admin_stats()` function from `batch7c.sql`, which returns only counts (no names, no per-person data) and refuses anyone who is not an admin. No tracking script is involved, so the privacy text needs no change. Real-device testing steps are in `DEVICE-CHECKLIST.md`.

## Push notifications (Batch 7c)

Optional. Setup steps are in `PUSH-SETUP.md`. Until `VAPID_PUBLIC` in `js/core.js` is filled in, the Settings > Notifications section stays hidden and nothing changes. Each phone opts in separately (Settings > Notifications) and chooses what to hear about (messages, Same, replies, new followers). The Edge Function `supabase/functions/send-push` is triggered by two database webhooks (new `notifications` row, new `messages` row), skips people who blocked the sender, and removes dead subscriptions. Tapping a push opens the post (`#post=ID`) or the chat (`#dm=ID`). On iPhone, push only works after Add to Home Screen (iOS 16.4+).
