/* EvoLyric edge worker. Static files are served from ./www (ASSETS); only /api/* runs this code.
   GET /api/tempo?title=..&artist=..  ->  { bpm, alt, conf, key }  (signed-in users only)
   The FreqBlog key lives in the Cloudflare secret FREQBLOG_KEY and never reaches the browser. */
const J=(o,s=200,h={})=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json','cache-control':'no-store',...h}});
async function who(req,env){
  const m=/^Bearer (.+)$/.exec(req.headers.get('authorization')||'');if(!m)return null;
  try{const r=await fetch(env.SUPABASE_URL+'/auth/v1/user',{headers:{apikey:env.SUPABASE_ANON_KEY,authorization:'Bearer '+m[1]}});
    if(!r.ok)return null;const u=await r.json();return u&&u.id?u:null}catch(e){return null}}
async function tempo(req,env,ctx){
  if(req.method!=='GET')return J({error:'method'},405);
  if(!env.FREQBLOG_KEY)return J({error:'not_configured'},503);
  if(!await who(req,env))return J({error:'auth'},401);
  const q=new URL(req.url).searchParams,title=(q.get('title')||'').trim().slice(0,120),artist=(q.get('artist')||'').trim().slice(0,120);
  if(!title)return J({error:'title'},400);
  const ck=new Request('https://tempo.cache/'+encodeURIComponent(title.toLowerCase())+'/'+encodeURIComponent(artist.toLowerCase())),cache=caches.default;
  const hit=await cache.match(ck);if(hit)return new Response(hit.body,{status:200,headers:{'content-type':'application/json','cache-control':'no-store','x-cache':'hit'}});
  let r;
  try{r=await fetch('https://api.freqblog.com/lookup?'+new URLSearchParams({track:title,...(artist?{artist}:{}),wait:'20'}),{headers:{'x-api-key':env.FREQBLOG_KEY}})}
  catch(e){return J({error:'upstream'},502)}
  if(r.status===404)return J({error:'not_found'},404);
  if(r.status===429)return J({error:'busy'},429);
  if(r.status===202)return J({error:'pending'},202);
  if(!r.ok)return J({error:'upstream',status:r.status},502);
  let d;try{d=await r.json()}catch(e){return J({error:'upstream'},502)}
  const t=d&&(d.data||d),bpm=Math.round(+(t&&t.bpm));
  if(!(bpm>=30&&bpm<=300))return J({error:'not_found'},404);
  const out=JSON.stringify({bpm,alt:t.bpm_alt?Math.round(+t.bpm_alt)||null:null,conf:typeof t.bpm_confidence==='number'?t.bpm_confidence:null,key:t.key||null,title:t.title||null,artist:t.artist||null});
  ctx.waitUntil(cache.put(ck,new Response(out,{headers:{'content-type':'application/json','cache-control':'public, max-age=2592000'}})));
  return new Response(out,{headers:{'content-type':'application/json','cache-control':'no-store'}})}
export default{async fetch(req,env,ctx){
  const p=new URL(req.url).pathname;
  if(p==='/api/tempo')return tempo(req,env,ctx);
  if(p.startsWith('/api/'))return J({error:'not_found'},404);
  /* v168: the asset host redirects /index.html → / and /x.html → /x. Older service workers cached that redirected answer and
     Safari refuses it ("Response served by service worker has redirections"). Serve these pages directly, no redirect. */
  if(/^\/(index|privacy|terms)\.html$/.test(p)){const u=new URL(req.url);u.pathname=p==='/index.html'?'/':p.slice(0,-5);
    const r=await env.ASSETS.fetch(new Request(u.toString(),{method:req.method,headers:req.headers}));
    if(r.status>=300&&r.status<400)return env.ASSETS.fetch(req);return new Response(r.body,{status:r.status,headers:r.headers})}
  return env.ASSETS.fetch(req)}};
