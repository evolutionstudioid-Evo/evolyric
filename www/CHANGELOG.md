# CHANGELOG

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
