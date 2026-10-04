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
- `app.js` contains the interface behavior and Supabase data access.
- `manifest.webmanifest` defines the installable app metadata and icons.
- `sw.js` caches the app shell and selected external libraries.
- `assets/` contains the app icons.

## Run the app

Serve this folder from a local or hosted web server. The service worker requires HTTP or HTTPS; opening `index.html` directly from the file system does not enable PWA installation or offline caching.

The app connects to Supabase through the URL and publishable key configured near the top of `app.js`. The Supabase project must provide the tables used by the app, including `profiles`, `interests`, `user_interests`, `posts`, `post_interests`, `post_images`, `sames`, `replies`, `follows`, `messages`, `notifications`, `events`, `event_goers`, `circle_messages`, `achievements`, and `user_achievements`. Authentication, row-level security policies, and storage buckets must also be configured for the operations used by the app.

For local development, any static web server can serve the folder. For example, with Node.js installed:

```sh
npx serve .
```

## Maintaining the interest menu

Edit `INTEREST_CATALOG` near the top of `app.js` to add a category or interest. Each category has a display colour and an `items` list of name and emoji pairs. When a user signs in, the app creates missing catalog rows in Supabase and updates the category, colour, and emoji of matching rows without changing their IDs. Keep existing interest names stable when possible because user selections refer to their database IDs.

Users open **You** → **Interests** → **＋ Add** to search and select entries from the categorized list. Selecting an entry already on the profile lets the user remove it from their own list. Users do not create catalog categories or interest entries through the app.

## Progressive Web App

The web manifest and service worker are registered by the app when served over HTTP or HTTPS. The service worker caches the HTML, CSS, JavaScript, manifest, and icons for offline app-shell loading. Change the cache version in `sw.js` when changing files that should replace an installed copy's cached shell.

## Invite codes and legal pages (Batch 4a)

Signups require an invite code. The check runs inside the database (a trigger on `auth.users` created by `batch4a.sql`), so it cannot be bypassed from the browser. Admins create, copy and switch off codes in **Settings → Moderation tools → Invites**. A code's link (`…/#invite=CODE`) opens the signup form with the code filled in. Terms, privacy and contact text lives in `LEGAL` in `app.js`; the contact address is `CONTACT_EMAIL`.

## First-run onboarding (Batch 4b)

New accounts go through four skippable steps: interests (3 or more), photo and bio, follow a few people (the iLike team and people with shared interests are listed first), and a first post. Completion is stored in `profiles.onboarded_at` (set by the `finish_onboarding()` function from `batch4b.sql`); accounts that existed before that column was added count as onboarded. `seed.sql` adds friendly starter posts from the admin account.

## Profile and circle polish (Batch 5)

On **You**, tap the avatar or banner to view, change or remove it; Edit profile and Settings sit together in the top bar. Profile tabs: **My posts**, **Liked** (posts you said Same to; private to you) and **Photos**. In a circle chat, the strip under the header shows the member count (tap for the list) and a Join or Leave button. A circle is an interest, so leaving a circle also removes that interest from the profile.
