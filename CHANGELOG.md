# CHANGELOG

## v50 – Hold to fast-forward
- While auto-scroll is running, pressing and holding still on the lyrics for 2 seconds scrolls at speed 25 until you let go, then the saved speed resumes. No popup. The boost eases in and out. Moving your finger (to change speed) cancels it.

## v49 – No text selection except in editable fields
- Buttons, icons, titles, numbers and labels can no longer be selected or highlighted by long-press. Text selection and the long-press menu now work only inside editable fields (lyrics editor, title/artist, search, rename, new category, bio).

## v48 – Section glow fixed
- The active section glow is now soft and round: the chip strip has enough room around the chips so the glow is no longer cut off into a box. The glow is also slightly smaller and smoother.

## v47 – Section chips redesigned
- Section chips are now liquid-glass pills tinted with a soft gradient of each section's colour, with a light highlight on top.
- The active section glows and gently breathes; the strip fades at its edges.

## v46 – Smoother speed HUD animation
- The speed slider now eases in with a soft overshoot and fades out in stages: a small glass swell, a light sweep across the glass, then it rises, shrinks and dissolves with blur.

## v45 – Floating speed HUD, tap outside closes panels
- Dragging to change speed now shows a floating glass-style slider at the top centre of the lyrics (white track, light-blue fill, value). It fades in and out and disappears when you lift your finger. The corner speed panel is unchanged.
- Tapping anywhere outside an open menu, sidebar, queue, speed panel or popup closes them all, and that tap no longer starts or stops playback.

## v44 – Speed by dragging, triple tap to edit
- Touch the lyrics and drag left or right to change the scroll speed; the speed panel opens and shows the value. The corner speed button still works.
- This replaces the old hold-to-boost gesture.
- Three quick taps on the lyrics open the song in the editor.

## v43 – Annotate page (pen, text, shapes, images)
- The editor **Note** button now opens a full page showing the lyrics like play mode, where you can draw with a pen, add styled text, shapes (rectangle, ellipse, triangle, line) and images, then move, recolour, erase, undo and redo.
- Annotations are anchored to lyric lines, saved with the song (synced), and shown over the lyrics in the player.
- Android Back from a song to Home no longer asks for confirmation; the confirmation remains only for exiting the app.

## v42 – Notes in the editor
- New **Note** button in the editor: add a personal cue (e.g. "Drums stop") with its own size, weight, font, colour, alignment, italic and box.
- Notes are lines inside the lyrics, so they show in the player, sync and are included when sending songs.
- **Move** tool: drag a note by its handle to any position among the lines.

## v41 – Android Back button asks before closing
Changed `www/index.html`, `www/sw.js` (cache `evolyric-app-41`); no SQL, cloud.js or config.js changes.
- A stray Back press no longer closes the app. Back now works like this: it first closes whatever is open (dialog, popup, "+" menu, ⋮ menu, queue, speed panel, side panel); then it goes up one screen (Friends / Profile / category -> Home).
- On Home it shows "Exit EvoLyric?" with Cancel / Exit. Exit really closes the app.
- Open song: Back asks "Leave this song?" (so an accidental press never drops the lyrics during a performance). Editor with unsaved changes: Back asks "Discard changes?".
- Only active in the installed app (Home Screen / standalone) or on Android, so desktop browsers keep their normal Back button.
- Implementation: a history entry is kept under the app and re-armed after each Back press. Known limit: when signing in with Google the browser history contains Google pages behind the app, so the very last Back after confirming Exit may land on one of them instead of closing.

## v40 – Profile page with username and bio
Added `supabase/008_bio.sql`; changed `www/index.html`, `www/sw.js` (cache `evolyric-app-40`). cloud.js / config.js untouched.
- The header of the account menu (profile picture, name, email) is now tappable (with a "›") and opens a new Profile page. The old "Username" menu row is gone.
- Profile page: picture, name and email (only you see the email), an editable username and a new Bio box (up to 300 characters, with a counter) for anything you want to say about yourself, such as your work, band or instrument. One Save button; it is only enabled when something changed. A taken or invalid username is explained under the field.
- Bio is visible to your friends (in the Friends list) and to someone who finds you by your exact username (in the search result). Emails are still never returned.
- 008 adds `profiles.bio` (max 300) and returns it from `find_user` and `list_friends`. Until it is run, the bio box is disabled with a short note and the username still works.
- The Friends screen's "Set username" prompt now opens the Profile page.

## v39 – Username can be changed again
Added `supabase/007_username_unlock.sql`; changed `www/index.html`, `www/sw.js` (cache `evolyric-app-39`).
- The Username row in the account menu is editable again ("Change your username"). The permanent-name warning is gone.
- 007 removes the database lock from v35/004. Uniqueness and the format check stay: a name that is taken is still refused ("That username is already taken. Try another one."), so two people never share a username.
- Friends and shared songs are linked by internal id, so renaming does not break friendships or waiting deliveries; friends simply see the new name.
- If 007 has not been run yet, saving a change shows a short hint to run it.

## v38 – In-app notifications for friend requests and received songs
Changed `www/index.html`, `www/sw.js` (cache `evolyric-app-38`). No SQL, cloud.js or config.js changes.
- A banner slides in at the top when someone sends you a friend request or songs ("@budi.s sent you a friend request", "@budi.s sent you 3 songs", or a summary such as "2 friend requests · 1 song delivery"). Tap it to open Friends. It hides itself after 7 seconds and is never repeated for the same item.
- Live safety: no banner appears while a song is open in the performance view. It waits and appears once you are back on Home.
- The app checks every 25 seconds while it is open and visible (and when you return to the app). The Friends screen only redraws when something actually changed, so typing in the search box is never interrupted.
- The red dot on the profile picture and the menu counter stay as before; the app icon badge (Badging API) is also set to the number of waiting items where the device supports it.
- Limit: these work while the app is open. A notification that arrives while the app is fully closed needs Web Push, which requires a server-side function (not part of this version).

## v37 – Send a group of songs to a friend
Added `supabase/006_song_groups.sql`; changed `www/index.html`, `www/sw.js` (cache `evolyric-app-37`). cloud.js / config.js untouched.
- Friends screen: tap a friend to open a small menu with **Send songs** and **Unfriend** (the old Remove button is replaced by this menu).
- Send songs opens the multi-select song picker (search, tick as many as you like, up to 50) and sends them as ONE delivery.
- The friend sees a single item in "Songs from friends" ("10 songs", with the first titles as a preview). **Save all** puts every song into their own library in one tap (default speed/font, their own dates); Dismiss deletes the whole delivery. Single-song sends from the song menu still work and are stored the same way; older v36 deliveries can still be saved.
- Database: new `send_songs` (friends only, 1-50 songs, max 20 waiting deliveries per pair, whitelisted fields, 1 MB cap), a lightweight `list_inbox` (no lyrics) and `get_inbox_item` (lyrics are fetched only on Save).
- Until 006 is run, sending shows an error toast and everything else keeps working.

## v36 – Send songs to friends (step 3)
Added `supabase/005_share_songs.sql`; changed `www/index.html`, `www/sw.js` (cache `evolyric-app-36`). cloud.js / config.js untouched.
- "Send to friend": in the long-press menu of a song on Home and in the player's ⋮ menu (signed-in users only). Pick a friend and the song is sent as a COPY: title, artist, lyrics (with your edits, section labels and highlights), key and section colours. Speed, font size, pin, categories and dates stay personal and are NOT sent.
- Inbox: Friends screen > "Songs from friends". Save puts a copy in your own library (new song, default speed/font); Dismiss deletes it. The red dot / counter now covers friend requests and waiting songs. Later edits on either side never affect the other copy.
- Safety is enforced in the database: only accepted friends can send, at most 20 waiting songs per pair, 200 KB size limit, whitelisted fields only, nobody can read anyone else's inbox, no emails exposed. Removing a friend also deletes songs still waiting between the two.
- Fix: dialogs and toasts now sit above the fullscreen player (they could be hidden behind it).
- Until 005 is run the send picker shows a short note; nothing else changes.

## v35 – Username is permanent
Added `supabase/004_username_lock.sql`; changed `www/index.html`, `www/sw.js` (cache `evolyric-app-35`).
- Once a username is set it cannot be changed by the user. The menu row becomes a locked, read-only "@name"; the first-time dialog now warns that it is permanent.
- Enforced in the database (trigger `lock_username`), so it holds even if someone bypasses the app. The project owner can still fix a name by hand in the Supabase Table Editor / SQL Editor.
- A name that is already used is refused with "That username is already taken. Try another one." (uniqueness comes from the unique index added in 002, so two people can never share a name).
- A timed change (for example once every few months) can be added later by relaxing the trigger.

## v34 – Friends (step 2) + richer usernames
Added `supabase/003_friends.sql`; changed `www/index.html`, `www/sw.js` (cache `evolyric-app-34`). cloud.js / config.js untouched.
- Usernames may now also contain `.` `_` `-` (3-20 chars, start with a letter/number, no two dots in a row, lowercase). Needs 003 to be run, because the server enforces the format.
- New Friends screen (account menu > Friends): find a person by EXACT username, Add friend, Accept / Decline incoming requests, Cancel sent requests, Remove a friend. A red dot on the profile picture and a counter in the menu show pending requests; the list refreshes on sign-in, when the app is reopened, and after every action.
- Privacy and safety are enforced in the database, not the app: no table is writable by clients, everything goes through functions (`find_user`, `send_friend_request`, `respond_friend_request`, `remove_friendship`, `list_friends`). There is no prefix search (nobody can list users) and emails are never returned. If the other person already asked you, sending a request accepts it.
- Until 003 is run, the Friends screen shows a short "not enabled yet" note and nothing else changes.
- Not included yet: sending a song to a friend (step 3).

## v33 – Username (step 1 of Friends)
Added `supabase/002_username.sql`; changed `www/index.html`, `www/sw.js` (cache `evolyric-app-33`). cloud.js / config.js untouched.
- Account menu: the old disabled "Profile" row is now "Username". Tap it to set a unique username (3-20 chars: a-z, 0-9, _; stored lowercase; a few names are reserved). It shows as @username in the menu header.
- Needs a one-time SQL run: paste `supabase/002_username.sql` into Supabase > SQL Editor. Until then the row shows "Soon" and the rest of the app is unaffected.
- Server side: new nullable `profiles.username` column with a format check and a unique index; clients may update only their own row (existing RLS) and only display_name / avatar_url / username.
- Category name dialog was generalised (validator / async save / hint) and still behaves the same for categories.

## v32 – Pin songs, sort the list
Changed (`www/index.html`, `www/sw.js` cache `evolyric-app-32`; no changes to cloud.js / Supabase)
- Pin: long-press a song on Home > "Pin to top" (or "Unpin"). Pinned songs sit in a "Pinned" group above the rest (All Songs, categories and the side panel) and show a small pin icon. The pin is a normal song field, so it syncs with the account.
- Sort: new sort button next to the search box (song lists only). Options: A-Z (default, with letter headers), Newest added, Oldest added, Recently modified. The choice is remembered on the device. Pinned songs stay on top whatever the sort.
- Songs now record `cr` (created) and `md` (modified, updated only when saved in the editor). Older songs have no dates, so "added" falls back to the time inside their id (very old ones sort as oldest) and "modified" falls back to "added".
- Search placeholder shortened to "Search songs…" so the field stays readable next to the sort button.

## v31 – Search clear button, Home resets the search
Changed (`www/index.html`, `www/sw.js` cache `evolyric-app-31`; UI only)
- A clear (x) button now sits inside the search boxes (Home, the song-list side panel and the Add Songs popup). It only shows while the box has text, clears it, refreshes the list and keeps the cursor/keyboard in the box.
- Search on Home is emptied when you come back with the Home button after opening a song, so Home shows the full list again (the selected tab/category is kept).

## v30 – Home "+" button, Copy backup removed from Home
Changed (`www/index.html`, `www/sw.js` cache `evolyric-app-30`; UI only)
- The v29 bottom dock is gone. New song and Import .txt now live behind a single round "+" button at the bottom-right of Home; tapping it opens a small popup with the two choices (tap outside or Esc closes it). The "+" turns into an "x" while open. The song list has extra bottom padding so the last song is never hidden behind the button.
- "Copy backup" is no longer shown on Home. The code is kept as `copyBackup()` for a future Account > Backup & restore screen; paste-to-restore on Home is unchanged.
- The "+" and its popup shrink slightly on short (landscape) screens.

## v29 – Home dock for New song / Import / Backup
Changed (`www/index.html`, `www/sw.js` cache `evolyric-app-29`; UI only, same handlers and data)
- The three underlined text links at the bottom of Home are replaced by one dock: **New song** (primary, filled), **Import .txt** (secondary) and a small icon button for **Copy backup**.
- Copy backup is kept (it is the only manual backup/restore: it copies all songs + categories; pasting that text on Home restores them). It now confirms with a toast and a brief highlight instead of changing its label.
- The dock slims down automatically on short (landscape) screens so the song list keeps its space.

## v28 – Remove the "Lyric Teleprompter" tagline
Changed (`www/index.html`, `www/sw.js` cache `evolyric-app-28`; UI only)
- Removed the "LYRIC TELEPROMPTER" text under the EvoLyric wordmark on Home. Logo, font and gradient are unchanged.
- Wordmark resized (27px -> 31px) and centred on the logo now that it is a single line.
- Hidden metadata (page description, manifest description) still mentions "teleprompter"; it is not shown in the app.

## v27 – Solid status bar (no blur strip at the top)
Changed (`www/index.html`, `www/sw.js` cache `evolyric-app-27`; no data/cloud/auth changes)
- `apple-mobile-web-app-status-bar-style`: `black-translucent` -> `black`. In the Home Screen app the status bar is now solid black and the page starts right below it, so iOS no longer draws a blurred strip over the top of the header (above the hamburger/three-dots and above the profile photo/logo on Home).
- To undo, set the meta back to `black-translucent`.
- Note: iOS may only apply this after fully closing and reopening the app; if it does not, the Home Screen icon must be re-added (library data is kept in the cloud only for signed-in accounts, so back up first).

## v26 – Restore the top fade
Changed (`www/index.html`, `www/sw.js` cache `evolyric-app-26`; UI only)
- Restored the soft fade at the top edge of the lyric area (the blur-like fade above the text) exactly as in v24. This reverts the v25 change.

## v25 – Remove top fade
Changed (`www/index.html`, `www/sw.js` cache `evolyric-app-25`; UI only)
- Removed the gradient fade at the top edge of the lyric area (the area under the header). Lyrics now stay fully opaque up to the header. The soft fade at the bottom edge is kept.

## v24 – Floating buttons fade while scrolling
Changed (`www/index.html`, `www/sw.js` cache `evolyric-app-24`; UI only, no database / cloud / auth changes)
- Three-dots, Queue and Speed buttons fade to ~8% opacity while auto-scroll is running (nearly gone but still visible and tappable) and return to 100% as soon as scrolling pauses or stops (including at the end of a song).
- They are fully opaque while pressed or focused, while their menu/panel is open (menu, queue panel, speed panel), then fade back.
- The hamburger (song list) and the Next Song button are unchanged.

## v23 – Single fullscreen view, three-dots menu, side panel clearance
Changed (`www/index.html`, `www/sw.js` cache `evolyric-app-23`; no database / cloud / auth changes)
- The old non-fullscreen "settings" play view is gone: no title bar, no fullscreen button, no separate three-dots there. Opening a song always shows the fullscreen view; the layout stays even if the browser leaves fullscreen with Esc.
- The top-right button that used to be the X is now the three-dots menu (Edit song, Restart). The top-left stays the song list.
- Bug fixed: the three-dots menu can now be closed by tapping anywhere outside it (or Esc, or opening the side panel). The outside tap only closes the menu; it never toggles play/pause.
- Bug fixed: the side panel now always clears the status bar / notch (top padding = max(safe-area, 28px) + 8px), so Home, the list-size toggle and the close button are no longer covered.
- Layout/size pass: header buttons 40x40 with 10px side margins; menu, queue panel and Next Song share the same right edge/centre line; side-panel buttons 42px tall; Edit leaves the performance view first.

## v22 – Compact Speed controller, tap-only play/pause, screen always on
Changed (`www/index.html`, `www/sw.js` cache `evolyric-app-22`; no database / cloud / auth changes)
- Speed controller made much smaller and moved into the bottom-right corner (4px from the right edge, ~3px from the bottom): closed = 40px button; open = a 196x71px translucent panel that replaces the button in the corner (value, -/slider/+, min/max, collapse chevron). It still collapses by itself after ~3 s idle.
- Play/Pause button removed. Play/pause is only by tapping the lyric area (unchanged gesture).
- Queue panel height rule adjusted to the smaller Speed panel.

Added
- Screen always on while the app is open, no matter whether auto-scroll is playing or paused (the old code only held the lock while playing and released it on pause):
  - Screen Wake Lock API is requested on load and re-acquired whenever the browser drops it (tab returns, fullscreen change, touch, every 15 s check).
  - Fallback for iOS/PWA builds where the API is missing or refused: a 1.6 KB silent looping video (NoSleep technique), started from the first touch. It has no audio track.
  - The lock is automatically released by the OS when the app goes to the background or the device is locked manually; it is taken again on return.

## v21 – Direct Fullscreen performance mode
Changed (all in `www/index.html`; no database, cloud-sync, auth, Supabase or Cloudflare changes)
- Selecting a song (library, sidebar Open, Next Song) opens it straight in fullscreen lyrics mode: starts at the top, auto-scroll always PAUSED (even if the previous song was playing). Speed and font stay saved per song.
- Font size: the Size slider is removed. Pinch on the lyric area (out = bigger, in = smaller, limits 12-120, saved with the song). Existing two-finger pinch handler, no global touch blocking.
- Speed: the old Speed/Size bar is replaced by a floating Speed controller at bottom right: compact button showing the value; tap opens a panel with value, slider (1-25), -/+ buttons and min/max labels. The slider enlarges while touched and the panel collapses by itself after ~3.5 s idle. Changes apply live while scrolling.
- Play/Pause button next to the Speed button (tap on the lyrics still toggles too). Pausing keeps the position; Play resumes from it.
- Speed calibration: `SPEED_SCALE` 1 -> 0.8. Actual speed px/s = (speed+3) x 0.8 x font x 0.12, i.e. exactly 20% slower at every setting (hold-to-boost speeds included). Stored speed values are untouched, so no migration is needed or run. The slider max was raised 20 -> 25 so the top speed stays about as fast as before.
- Queue panel height now leaves room for the Speed controller so they never overlap.
- `www/sw.js`: cache `evolyric-app-21`.

## v18 – Revisions
- Every opened song (drawer Open, Next Song) restarts at the top; the auto-scroll position accumulator is reset so a stale position can no longer carry over. Speed and font size stay saved per song.
- Lyric title stays centered (left-align was tried and reverted); size unchanged (60px).
- Sidebar: Wide (default) / Compact toggle in the drawer header, remembered on the device (`evolyric-sbview`). Compact shows title + key only, hides artist, tighter row spacing.
- Sidebar panel is now low-opacity tinted liquid glass: backdrop blur (22px) + saturation, subtle edge highlight; lyrics behind it are blurred. Lighter scrim so the blur stays visible. Falls back to a solid panel if backdrop-filter is unsupported.
- `www/sw.js`: cache `evolyric-app-19`.

## v17 – Song Queue, Next Song, zoom lock, motion polish
Added (all in `www/index.html`; no database / cloud-sync / config changes)
- Player sidebar: single tap on a song now shows a compact popup (Add to Queue / Open). It no longer opens the song directly. Tap outside closes it.
- Queue (device-local, key `evolyric-queue-v1`, separate per guest/account; never mixed with the library). Stores song ids only, no duplicates, restored after refresh.
- Compact right-side queue panel (toggle with count badge): drag handle (drag starts only from the handle, touch + mouse, keyboard arrows), truncated title, remove button, empty state.
- Next Song button: thin 0.75px white circle + thin chevron, no text, right side aligned with the reading line. Shown only while the existing `.end` line is inside the lyric viewport (IntersectionObserver rooted on `#lyr`) AND the queue has a song. Works for lyrics without sections, manual scroll and auto-scroll.
- Next Song: opens the first queued song, removes it from the queue only after it is active, ignores repeat taps during the transition.
- Double-tap / pinch page zoom lock: viewport `maximum-scale=1,user-scalable=no`, `touch-action: pan-x pan-y` (lyric canvas keeps `pan-y` and its own pinch-to-resize-text), `gesturestart` blocked for Safari. Text inputs unaffected.
- Motion polish: smoother drawer/scrim easing, staggered song-list entrance, spring popups/sheets, view fade, toast spring, button press feedback, song-change fade, queue add/remove/reorder animations. All respect `prefers-reduced-motion`.

Changed
- `www/sw.js`: cache `evolyric-app-17`.

## v16 – Cloud sync (Supabase)
Added
- `www/cloud.js`: cloud-sync module (uses the app's existing Supabase client; no second client).
- `supabase/002_cloud_sync.sql`: additive SQL (columns if missing, unique index on (user_id, local_id), owner-only RLS policies, optional Realtime). Not executed by the app. Read STEP 0 in the file first.
- `CLOUD-SYNC.md`: deploy folder, SQL steps, PC-to-phone test, known limits.

Changed
- `www/index.html`: small hooks only (no UI/CSS/layout change): per-account local cache keys, `save()` now also schedules a cloud push, sign-in/sign-out hooks, one extra line in the profile menu showing sync status, list-view "idle" hook.
- `www/sw.js`: cache `evolyric-app-15`, `cloud.js` added to the offline shell.

Behaviour
- Signed in: library = your cloud library, cached per account on the device (`evolyric-v1:u:<uid>`). Guest data (`evolyric-v1`, `evolyric-cats-v1`) is never modified or deleted while signed in.
- First sign-in per account per device: guest songs/categories are merged into the cloud library once, additively (dedupe by id and by title+artist+lyrics; same-named categories are merged; the untouched demo song is not re-added to a non-empty cloud library). Nothing in the cloud is overwritten or deleted.
- Edits are saved locally at once and pushed in the background; pending changes survive offline/restart and are retried. Failures show a message and the profile menu status; they are never reported as success.
- Sync runs on sign-in, tab/app focus, reconnect and (if enabled) Realtime. Remote changes are held back while the editor or player is open and applied when you return to the list.
- Sign-out switches back to the guest library; the account cache is removed unless it still has unsynced changes.

Unchanged: Google login, Guest Demo, editor, playback, auto-scroll, categories UI, import/export/backup, PWA, Cloudflare config.
