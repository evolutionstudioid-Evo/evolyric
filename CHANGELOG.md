# CHANGELOG

## v89 – Highlight colour ring
- The active highlight colour is marked with an orange ring (the swatch keeps its own colour instead of turning into an orange block), like the annotate and note colour pickers.

## v88 – Highlights: 7 colours, easy change and remove
- Seven highlight colours: red, orange, yellow, green, blue, indigo, violet.
- Tap inside a highlight and the colour bar opens by itself with its colour marked. Pick another colour to change it, or tap the same colour / Remove to take it off. No text selection needed.
- With no selection, a colour applies to the whole line the cursor is on. Selecting just a few words inside an existing highlight changes only those words.

## v87 – Annotate drawing no longer locks up
- Fixed: the pen, shapes and text only worked the first time Annotate was opened. Each visit rebuilt the drawing layer but its touch handlers stayed on the old one, so from the second visit nothing could be drawn (it looked fixed after leaving the editor or reloading). The handlers are now attached to every new layer.
- A stroke whose finger-lift was never received (for example when a dialog or another touch interrupted it) can no longer block the next stroke.

## v86 – Orange web-search globe
- The globe button next to search now uses the theme\u2019s orange accent (darker orange on the light theme) instead of blue.

## v85 – Blue web-search globe
- The globe button next to search (search the web for lyrics) is now Google blue.

## v84 – Sign-in required
- Guest mode is gone: without a signed-in Google account the app stays on the Welcome page. Anyone who had chosen guest earlier is asked to sign in.

## v83 – Welcome screen, username step, stay signed in
- First launch (not signed in) now opens a Welcome page: Continue with Google, or a small "Continue as guest (Demo)" link. No password – Google sign-in only.
- After the first Google sign-in, a Choose-a-username step is required (same rules as the profile; taken names are reported).
- The login is kept after the app is force-closed. If the server cannot be reached at start, the saved login is kept instead of signing you out, and the browser is asked to keep the saved data. Only Sign Out returns to the Welcome page.

## v82 – Back diagnostics
- A small log of Back-guard events (kept even if the app closes). Open About and tap the version number five times to read it.

## v81 – Back guard re-arms on finger lift
- v80 re-armed the Back guard on touch start, but Chrome only counts a touch as user activation when the finger lifts. It now re-arms on touch end / click, so the guard entry is not skipped by an edge swipe.

## v80 – Safer Back / edge swipe on Android
- The Back guard is re-armed on the next real touch after every Back press (Chrome ignores history entries added without a touch, which let a second edge swipe leave the app).
- Exit EvoLyric now leaves the app reliably even when extra guard entries exist.

## v79 – Credits names, fixed header
- Fixed: the About scroll area was taller than the screen, so the bottom of the credits could be cut off.
- About credits now list who came up with the idea, who designed and built it, and the testers.
- The EvoLyric logo and title still rise from the bottom, but once they reach the top they stay pinned while the text keeps scrolling under them.

## v78 – About as rolling credits
- The About page is centred and scrolls by itself like game end credits. Touching or scrolling pauses it for a moment, then it carries on; it stops at the end. Not animated if the device asks for reduced motion.

## v77 – About page
- Fixed the missing logo on the About page.
- About now shows the Evolution Digital Studio text (About Us, Vision, Mission, Ecosystem, Philosophy), in Indonesian and English.

## v76 – Language: English / Indonesia
- Preferences → Language now switches the whole app (menus, dialogs, messages, help pages) instantly, with no restart. Song titles, lyrics, names and musical terms (Intro, Verse, Chorus…) stay as written.
- Translation is automatic for anything added later: new text only needs an entry in the dictionary. `tools/i18n-audit.js` lists any untranslated text; see CONTRIBUTING.md.

## v75 – Settings, Help and light theme
- New gear menu on Home: **Preferences** (theme Auto/Light/Dark, language selector, keep-screen-awake, fade buttons, default text size for new songs) and **Help** (Tutorial, About, Credit).
- Account Settings now opens a page with Email, Subscription (info only, nothing charged) and Data backup & restore (copy, download, restore from file or text).
- Light theme applied to every screen; label, note and annotation colours are darkened automatically on light backgrounds for readable contrast.

## v74 – Annotations anchored to the lyric characters
- Every annotation is now tied to a specific character of the lyrics (line + character, with an offset in text units). Its position is read from the real text layout, so when you zoom and a line re-wraps, a circle around a word stays on that word. Older annotations are converted automatically the first time they are shown.

## v73 – Annotations survive lyric edits
- Annotations are tied to lyric lines by index, so inserting, deleting or changing lines in the editor made every annotation jump to the wrong line. Saving (and re-opening the annotate view) now re-aligns them with the edited lyrics.

## v72 – Tempo UI hidden
- The BPM / Tap / Find row in the editor is hidden for now (code and the /api/tempo worker are kept; set TEMPO_UI=true in index.html to bring it back). Saving a song no longer touches speed because of tempo.

## v71 – Tempo (BPM) drives scroll speed
- Editor has a BPM field with beats-per-line, Tap tempo and an online Find (FreqBlog, via a Cloudflare Worker at /api/tempo; signed-in users only). Saving a song with a BPM sets the scroll speed from it; manual speed still works.
- Adds wrangler.jsonc + worker.js (static files still served from www). Needs the Cloudflare secret FREQBLOG_KEY.

## v70 – GetSongBPM credit
- Added a small "Tempo data by GetSongBPM.com" link (required by their free API terms) in the account menu and the sign-in card.

## v69 – Annotations truly anchored to the lyrics
- Annotations are now anchored to their lyric line vertically and to the centre of the lyrics horizontally, measured in text units. They keep their exact place on the words and scale with the lyric size. Older annotations are converted automatically.

## v68 – Annotations follow lyric zoom
- Pen strokes, shapes and note text now stay anchored to their lyric line and scale with the text when you pinch to zoom the lyrics (they used to stay frozen in place).

## v67 – No Back-guard on iPhone/iPad
- The Android Back-button handling is now Android/desktop only. On iPhone and iPad, swiping from the left edge no longer reveals an extra page; the app behaves like any other iOS app (swipe up to leave).

## v66 – ⋮ menu toggles
- Tapping the ⋮ button again now closes its menu (tapping outside still closes it too).

## v65 – Modern speed fader
- The speed slider cap is now a clean, modern white pill with a small orange mark; the gain bar is orange to match the app.
- The pop-up box is far more transparent with a stronger blur behind it.

## v64 – Fader-style speed slider
- The floating speed slider now looks like a mixing-console fader: a recessed slot with scale ticks, a glowing level and a ridged metal cap with an orange index line.

## v63 – Send a song to several friends
- In the Send a song sheet you can tick multiple friends and send to all of them at once. The result lists any friend who couldn't receive it.

## v62 – Simpler friend picker when sending a song
- Choosing a friend to send a song to now shows only their photo (from their Google account) and @username in one clean row each. Long friend lists scroll.

## v61 – Pro tag
- A small "Pro" tag sits at the bottom right of the EvoLyric title. It is the full-version / subscriber label; a "Demo" variant exists for non-subscribers but is not used yet.

## v60 – Home redesign, Recent, sidebar back-to-top, colour swatches
- Home: tabs are All Songs / Categories / Recent with the sort button at the right end; the search field is longer with a magnifier inside it; web search is a globe button.
- New **Recent** tab: the last 15 songs you opened, newest first. Opening a 16th removes the oldest. Kept on this device.
- Sidebar: a back-to-top button appears when you scroll down, and the panel is more transparent.
- Annotate and note colour pickers: the selected colour is shown by an orange ring only; the colour itself is no longer filled with orange.
- The Image tool is hidden for now (the code is kept).

## v59 – Editor tweaks
- Categories are a wide box again showing the category names; the key selector is narrower.
- The section buttons are back in a permanent column at the right of the lyrics for quick editing (the popover from v58 is gone).

## v58 – Tidier editor
- Artist, key and categories now share one row; categories are a folder icon with a count.
- The tools are one row of icons: undo, redo, paste, keyboard, insert section, highlighter, and a pen (notes and drawing).
- The section picker moved from a permanent side column into a popover (the section button), so the lyrics use the full width.
- The Highlight button stays lit while its colour bar is open; the pause toggle label is shorter.

## v57 – Choose whether auto-scroll pauses at a section
- In the editor, put the cursor in an Intro, Interlude or custom section and a new button lets you choose per section: auto-scroll pauses there, or keeps going. Intro and Interlude pause by default, custom sections keep scrolling. A short intro can now be set to keep scrolling.

## v56 – Smoother section strip
- Swiping the section strip is smoother: the edge-fade mask and the per-frame glow animation (both forced constant repainting) were removed, and the strip is scrolled on its own compositing layer. The active glow is now steady.
- When the active section changes during auto-scroll, the strip glides to it with an eased animation instead of jumping, and it does not move while you are swiping it yourself.

## v55 – Section selector fixes
- The section strip can be swiped sideways again (v48 had accidentally disabled scrolling it by touch).
- Every section chip now responds to a tap. Chips for sections near the top used to do nothing because they were already above the reading line; the reading line now sits near the top of the lyrics and the tapped chip always becomes the active one.
- Auto-scroll pause points (Intro/Interlude) now trigger at the same reading line.

## v54 – Light flash on small buttons
- Small buttons (menu, song list, queue, speed, compact view, close, step and clear buttons) now flash with a warm light when pressed. Large buttons such as Home, Find and Google are unchanged.

## v53 – Lyrics start at the top
- A song now opens with the lyrics right under the section selector instead of far down the screen, with a thin divider line above the first line that matches the one at the end of the lyrics.

## v52 – Song title pinned above the section selector
- The song title moved out of the scrolling lyrics into the header, centred above the section selector. It stays in place while the lyrics scroll and shrinks to fit the available width.

## v51 – Hold boost: 1 second, speed 30
- Hold-to-fast-forward now starts after 1 second and runs at speed 30.

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
