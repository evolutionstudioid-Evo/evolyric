const V='evolyric-app-179',F='evolyric-fonts';
const TUTIMG=['g_home','g_add','g_edit2','g_play','g_queue','g_temp','g_prefs','g_gear'].flatMap(n=>['id','en'].map(l=>'man/'+n+'_'+l+'.webp'));
const SHELL=['./','manifest.webmanifest','config.js','cloud.js','legal.js','import.js','tutorial.js',...TUTIMG,'vendor/supabase.js','icon-192.png','icon-512.png','apple-touch-icon.png'];
/* v167: Safari refuses a page the service worker answers with a redirected response ("Response served by service worker has
   redirections"). The host redirects /index.html to /, so the shell is cached as ./ only, and any redirected response is rebuilt. */
const clean=async x=>x&&x.redirected?new Response(await x.blob(),{status:x.status,statusText:x.statusText,headers:x.headers}):x;
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!==F&&x.startsWith('evolyric-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin===location.origin){
    const shell=u.pathname.endsWith('/')||u.pathname.endsWith('/index.html');
    if(r.mode==='navigate'&&!shell){ /* other pages (privacy.html, terms.html): network, cached copy offline; never stored as the app shell */
      e.respondWith(fetch(r).catch(()=>caches.match(r).then(clean)));return}
    if(shell){
      /* v177: offline-first. A weak signal (network reachable but crawling) used to keep the app from opening at all: the page and
         config.js waited on the network. Now the saved page opens at once. New versions arrive with a new service worker, which
         pre-caches the whole app in the background; the next launch (or Reload app) shows them. Network only when nothing is saved yet. */
      e.respondWith(caches.open(V).then(c=>c.match('./')).then(async m=>m?clean(m):
        fetch(r).then(async x=>{if(x.ok&&x.type==='basic'){x=await clean(x);const y=x.clone();caches.open(V).then(c=>c.put('./',y))}return x})));return}
    if(u.pathname.endsWith('/config.js')){
      /* runtime config: from this version's cache (refreshed by every new service worker), network only if missing */
      e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok&&x.type==='basic'){const y=x.clone();caches.open(V).then(c=>c.put(r,y))}return x})));return}
    e.respondWith(caches.match(r).then(m=>m?clean(m):fetch(r)));return}
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    /* fonts: saved copy first. Never saved yet + weak signal: give up after 3 s (the font stylesheet blocks the first paint),
       the app then shows system fonts until the fonts arrive another time */
    const css=u.hostname==='fonts.googleapis.com',give=()=>css?new Response('',{headers:{'content-type':'text/css'}}):Response.error();
    e.respondWith(caches.open(F).then(c=>c.match(r).then(m=>m||Promise.race([
      fetch(r).then(x=>{if(x.ok||x.type==='opaque')c.put(r,x.clone());return x}).catch(give),
      new Promise(res=>setTimeout(()=>res(give()),3000))]))))}
});


