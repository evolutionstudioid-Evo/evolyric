/* EvoLyric runtime config. Safe to commit: the Supabase URL and the *anon/publishable* key are public by design
   (access is enforced by Row Level Security). NEVER put the service_role key here.
   Leave both empty to run without accounts (Guest Demo only). After editing, bump the cache version in sw.js. */
window.EVO_CONFIG = {
  SUPABASE_URL: "",       // e.g. "https://abcdxyz.supabase.co"
  SUPABASE_ANON_KEY: ""   // Project Settings > API > anon public (or sb_publishable_...)
};
