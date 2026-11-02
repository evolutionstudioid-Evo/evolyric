# CHANGELOG

## v18 – Revisions
- Every opened song (drawer Open, Next Song) restarts at the top; the auto-scroll position accumulator is reset so a stale position can no longer carry over. Speed and font size stay saved per song.
- Lyric title (play view and fullscreen) is left-aligned; size unchanged (60px).
- Sidebar: Wide (default) / Compact toggle in the drawer header, remembered on the device (`evolyric-sbview`). Compact shows title + key only, hides artist, tighter row spacing.
- Sidebar panel is now low-opacity tinted liquid glass: backdrop blur (22px) + saturation, subtle edge highlight; lyrics behind it are blurred. Lighter scrim so the blur stays visible. Falls back to a solid panel if backdrop-filter is unsupported.
- `www/sw.js`: cache `evolyric-app-18`.

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
