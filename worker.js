/* EvoLyric edge worker. Static files are served from ./www (ASSETS); /api/* runs here.
   Tempo lookup uses FreqBlog. Lyrics lookup uses public Google results and public lyric pages;
   it does not require a Google API key and never bypasses a login, paywall, or access control. */
const J=(o,s=200,h={})=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...h}});
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
const LYRIC_HOSTS=['genius.com','azlyrics.com','lyrics.com','musixmatch.com','songlyrics.com','metrolyrics.com','lyricstranslate.com'];
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
function cleanLyrics(s){
  return decode(String(s||'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,''))
    .replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:div|p|li|h[1-6])\s*>/gi,'\n')
    .replace(/<[^>]*>/g,'').replace(/\u00a0/g,' ').replace(/\r/g,'')
    .replace(/[\t ]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
function lyricScore(text){
  const lines=text.split('\n').map(x=>x.trim()).filter(Boolean),unique=new Set(lines.map(x=>x.toLowerCase()));
  return text.length+Math.min(lines.length,300)*10+unique.size*2;
}
function lyricFromHtml(html){
  const candidates=[],patterns=[
    /<div[^>]*data-lyrics-container=["'][^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class=["'][^"']*Lyrics__Container[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*id=["']lyrics["'][^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class=["'][^"']*lyrics[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi
  ];
  for(const re of patterns){
    let m,parts=[];
    while((m=re.exec(html))&&parts.length<40){
      const t=cleanLyrics(m[1]);
      if(t.length>20)parts.push(t);
    }
    const joined=[...new Set(parts)].join('\n\n');
    if(joined.length>80)candidates.push(joined);
  }
  const json=/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;let m;
  while((m=json.exec(html))){
    try{
      const d=JSON.parse(m[1]),stack=[d];
      while(stack.length){
        const x=stack.pop();if(!x||typeof x!=='object')continue;
        if(typeof x.lyrics==='string'){
          const t=cleanLyrics(x.lyrics);if(t.length>80)candidates.push(t);
        }
        stack.push(...Object.values(x));
      }
    }catch(e){}
  }
  const unique=[...new Set(candidates)];
  return unique.sort((a,b)=>lyricScore(b)-lyricScore(a))[0]||'';
}
function hostAllowed(u){try{const h=new URL(u).hostname.toLowerCase();return LYRIC_HOSTS.some(x=>h===x||h.endsWith('.'+x))}catch(e){return false}}
const LYRIC_FETCH_TIMEOUT=8000;
function fetchWithTimeout(url,init={}){
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),LYRIC_FETCH_TIMEOUT);
  return fetch(url,{...init,signal:c.signal}).finally(()=>clearTimeout(timer));
}
function lyricLinks(html,base){
  const links=[],re=/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
  while((m=re.exec(html))&&links.length<40){
    let href=decode(m[1]);
    try{
      const u=new URL(href,base);
      if(u.hostname.endsWith('google.com')&&u.pathname==='/url')href=u.searchParams.get('q')||'';
      else if(u.hostname.endsWith('duckduckgo.com')&&u.pathname==='/l/')href=u.searchParams.get('uddg')||'';
    }catch(e){href=''}
    if(!hostAllowed(href)||links.some(x=>x.url===href))continue;
    links.push({url:href,label:cleanLyrics(m[2]).slice(0,120)});
  }
  return links;
}
async function searchLyrics(query){
  const providers=[
    ['https://www.google.com/search?'+new URLSearchParams({q:query,gbv:'1',num:'8'}),'https://www.google.com'],
    ['https://www.google.co.id/search?'+new URLSearchParams({q:query,gbv:'1',num:'8'}),'https://www.google.co.id'],
    ['https://html.duckduckgo.com/html/?'+new URLSearchParams({q:query}),'https://html.duckduckgo.com']
  ];
  let busy=false;
  for(const [url,base] of providers){
    for(let attempt=0;attempt<2;attempt++){
      try{
        const r=await fetchWithTimeout(url,{headers:{'user-agent':'Mozilla/5.0 (compatible; EvoLyric/1.0)','accept':'text/html'}});
        if(r.status===429){busy=true;if(attempt===0)await new Promise(ok=>setTimeout(ok,350));continue}
        if(!r.ok)break;
        const links=lyricLinks(await r.text(),base);
        if(links.length)return links;
        break;
      }catch(e){if(attempt===1)break}
    }
  }
  return busy?null:[];
}
async function lyrics(req){
  if(req.method!=='GET')return J({error:'method'},405);
  const q=new URL(req.url).searchParams,title=(q.get('title')||'').trim().slice(0,120),artist=(q.get('artist')||'').trim().slice(0,120);
  if(!title)return J({error:'title'},400);
  const links=await searchLyrics([title,artist,'lyrics'].filter(Boolean).join(' '));
  if(links===null)return J({error:'search_busy'},502);
  let best='',bestScore=0,bestSource='';
  for(const item of links.slice(0,6)){
    try{const r=await fetchWithTimeout(item.url,{headers:{'user-agent':'Mozilla/5.0 (compatible; EvoLyric/1.0)','accept':'text/html'}});if(!r.ok)continue;
      const text=lyricFromHtml(await r.text()),score=text.length>120?lyricScore(text):0;
      if(score>bestScore){best=text;bestScore=score;bestSource=item.url}}catch(e){}
  }
  if(best)return J({title,artist,lyrics:best,source:bestSource});
  return J({error:links.length?'lyrics_not_extractable':'no_results',results:links.slice(0,5).map(x=>({url:x.url,title:x.label}))},404);
}
export default{async fetch(req,env,ctx){
  const p=new URL(req.url).pathname;
  if(p==='/api/tempo')return tempo(req,env,ctx);
  if(p==='/api/lyrics')return lyrics(req);
  if(p.startsWith('/api/'))return J({error:'not_found'},404);
  return env.ASSETS.fetch(req)}};
