# CHANGELOG

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
