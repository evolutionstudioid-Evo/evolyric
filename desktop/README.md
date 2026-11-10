# Windows WebView proof-of-concept

This desktop shell loads the existing EvoLyric PWA and adds a real Chromium WebView for Import Lyric.

## Run on Windows

From the repository root:

```bash
npm install
npm run desktop
```

Import Lyric opens Google Search in the WebView, follows public lyric-result links, extracts lyric DOM content, sanitizes it, and sends it to the existing editor through Electron's isolated preload bridge.

The globe button remains the existing browser Google-search action. The PWA/browser path remains available when the desktop bridge is absent.

This is a Windows proof-of-concept only. It does not change Supabase, user data, Cloudflare deployment, Android, or iOS.
