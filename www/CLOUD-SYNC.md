# EvoLyric Cloud Sync – deploy & test

## 1. What to deploy
Deploy the **`www/`** folder to Cloudflare (the same folder you deploy today: it contains `index.html`, `sw.js`, `cloud.js`, `config.js`, `vendor/`).
`supabase/`, `*.md`, `package.json` are not part of the website.

**`www/config.js` in this ZIP has empty keys** (same as the previous ZIP). Keep your own filled `config.js` in the repo; do not overwrite it with this one.

## 2. SQL (once, in Supabase > SQL Editor)
1. Open `supabase/002_cloud_sync.sql`, run the read-only queries in STEP 0 and compare with your tables/policies.
2. Run the file. It is additive and re-runnable: it only adds missing columns, a unique index on `(user_id, local_id)`, owner-only policies with new names (`evolyric_*`), and adds the tables to Realtime. It drops/deletes nothing.
   If the duplicate check in STEP 0 returns rows, resolve those first (the index cannot be created otherwise).

## 3. First run
Open the site online, close the app fully and reopen once so the new service worker (v15) takes over.
The first sign-in on each device merges that device's guest songs into your cloud library one time.

## 4. PC <-> phone test (5 minutes)
1. PC: sign in with Google, wait until the profile menu says "Cloud synced".
2. PC: create a song with a category, change its speed/font.
3. Phone: sign in with the same Google account. The same song, category, speed and font appear.
4. Phone: edit the lyrics. PC: switch to another tab and back (or reload): the edit appears.
5. PC: delete the song. Phone: reopen/refocus the app: it is gone, categories remain.
6. Airplane mode on the phone: edit a song, reopen app offline (still there; menu says "Offline · changes waiting"), turn network on: it syncs.
7. Sign out: you see the guest library; sign in again: your cloud library returns.

## 5. Known limits
- Conflicts are last-writer-wins per song: if the same song is edited on two devices before either syncs, the device that syncs last wins for that song. A song edited remotely while deleted locally is kept.
- Realtime only works if STEP 4 of the SQL ran and Realtime is enabled for your project; otherwise updates arrive on focus/reconnect/sign-in.
- Remote changes are applied only while the list screen is showing.
