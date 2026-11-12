const V='evolyric-app-167',F='evolyric-fonts';
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
      /* network-first, but never make the stage wait: after 2.5 s fall back to the cached page */
      e.respondWith((async()=>{
        const c=await caches.open(V),cached=await clean(await c.match('./')||await c.match('index.html'));
        const net=fetch(r).then(async x=>{if(x.ok&&x.type==='basic'){x=await clean(x);c.put('./',x.clone());return x}return cached||x});
        if(!cached)return net;
        try{e.waitUntil(net.catch(()=>{}))}catch(_){}
        return Promise.race([net.catch(()=>cached),new Promise(res=>setTimeout(()=>res(cached),2500))]);
      })());return}
    if(u.pathname.endsWith('/config.js')){
      /* runtime config: network-first so a stale cached copy (e.g. the old empty one) can never keep sign-in disabled */
      e.respondWith(fetch(r).then(x=>{if(x.ok&&x.type==='basic'){const y=x.clone();caches.open(V).then(c=>c.put(r,y))}return x}).catch(()=>caches.match(r)));return}
    e.respondWith(caches.match(r).then(m=>m?clean(m):fetch(r)));return}
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(F).then(c=>c.match(r).then(m=>m||fetch(r).then(x=>{c.put(r,x.clone());return x}).catch(()=>Response.error()))))}
});
