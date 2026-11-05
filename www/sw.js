const V='evolyric-app-106',F='evolyric-fonts';
const TUTIMG=['account', 'acctmenu', 'addsongs', 'annot', 'annot2', 'backup', 'catmenu', 'catpick', 'cats', 'custom', 'drawer', 'edit', 'fab', 'findfriend', 'friendmenu', 'friends', 'gear', 'help', 'hl', 'home', 'inbox', 'incat', 'light', 'login', 'newcat', 'note', 'play', 'playmenu', 'prefs', 'profile', 'qpop', 'queue', 'recent', 'requests', 'search', 'secbar', 'sendmany', 'sendone', 'side', 'songmenu', 'sort', 'speed', 'stop', 'tools', 'username', 'vocal'].flatMap(n=>['id','en'].map(l=>'man/'+n+'_'+l+'.webp'));
const SHELL=['./','index.html','manifest.webmanifest','config.js','cloud.js','tutorial.js',...TUTIMG,'vendor/supabase.js','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!==F&&x.startsWith('evolyric-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin===location.origin){
    if(r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html')){
      /* network-first, but never make the stage wait: after 2.5 s fall back to the cached page */
      e.respondWith((async()=>{
        const c=await caches.open(V),cached=await c.match('index.html');
        const net=fetch(r).then(x=>{if(x.ok&&x.type==='basic'){c.put('index.html',x.clone());return x}return cached||x});
        if(!cached)return net;
        try{e.waitUntil(net.catch(()=>{}))}catch(_){}
        return Promise.race([net.catch(()=>cached),new Promise(res=>setTimeout(()=>res(cached),2500))]);
      })());return}
    if(u.pathname.endsWith('/config.js')){
      /* runtime config: network-first so a stale cached copy (e.g. the old empty one) can never keep sign-in disabled */
      e.respondWith(fetch(r).then(x=>{if(x.ok&&x.type==='basic'){const y=x.clone();caches.open(V).then(c=>c.put(r,y))}return x}).catch(()=>caches.match(r)));return}
    e.respondWith(caches.match(r).then(m=>m||fetch(r)));return}
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(F).then(c=>c.match(r).then(m=>m||fetch(r).then(x=>{c.put(r,x.clone());return x}).catch(()=>Response.error()))))}
});
