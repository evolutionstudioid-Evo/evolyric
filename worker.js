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
const SOURCE_PRIORITY={genius.com:100,azlyrics.com:90,lyrics.com:80,songlyrics.com:75,musixmatch.com:60,metrolyrics.com:55,lyricstranslate.com:50};
const NOISE_LINES=/^(read more|how to format lyrics:?|type out all lyrics.*|lyrics should be broken down.*|use section headers.*|use italics.*|if you don't understand.*|to learn more about adding songs.*|visit the transcribers forum|cancel)$/i;
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
function stripExcluded(html){
  return String(html||'').replace(/<[^>]*data-exclude-from-selection=["'][^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi,'')
    .replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<noscript[\s\S]*?<\/noscript>/gi,'');
}
function cleanLyrics(s){
  const lines=decode(String(s||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:div|p|li|h[1-6]|pre|section)\s*>/gi,'\n')
    .replace(/<[^>]*>/g,'').replace(/\u00a0/g,' ').replace(/\r/g,''))
    .split('\n').map(x=>x.replace(/[ \t]+/g,' ').trim()).filter(x=>x&&!NOISE_LINES.test(x));
  const out=[];for(const line of lines){if(line===out[out.length-1])continue;out.push(line)}
  return out.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
function lyricScore(text){
  const lines=text.split('\n').map(x=>x.trim()).filter(Boolean),unique=new Set(lines.map(x=>x.toLowerCase()));
  const sections=lines.filter(x=>/^\[[^\]]+\]$/.test(x)).length;
  return text.length+Math.min(lines.length,400)*10+unique.size*2+sections*20;
}
function extractBalancedDivs(html,startRe){
  const out=[];let m;
  startRe.lastIndex=0;
  while((m=startRe.exec(html))&&out.length<60){
    const openEnd=html.indexOf('>',m.index)+1;if(openEnd<=0)break;
    const tokens=/<\/?div\b[^>]*>/gi;tokens.lastIndex=openEnd;let depth=1,t;
    while((t=tokens.exec(html))){
      if(/^<div\b/i.test(t[0]))depth++;
      else depth--;
      if(depth===0){out.push(html.slice(openEnd,t.index));startRe.lastIndex=t.index+t[0].length;break}
    }
  }
  return out;
}
function extractTag(html,tag,re){
  const out=[];let m;re.lastIndex=0;
  while((m=re.exec(html))&&out.length<20){
    const close=new RegExp('</'+tag+'\\s*>','ig');close.lastIndex=m.index+m[0].length;const c=close.exec(html);
    if(c)out.push(html.slice(m.index+m[0].length,c.index));
  }
  return out;
}
function candidate(parts){
  const text=[...new Set(parts.map(cleanLyrics).filter(x=>x.length>20))].join('\n\n');
  return text.length>80?text:'';
}
function domainOf(url){try{return new URL(url).hostname.toLowerCase().replace(/^www\./,'')}catch(e){return''}}
function extractBySource(html,url){
  const host=domainOf(url),source=stripExcluded(html),candidates=[],counts=[];
  const add=(parts,selector)=>{const text=candidate(parts);if(text){candidates.push(text);counts.push({selector,count:parts.length})}};
  if(host==='genius.com'){
    add(extractBalancedDivs(source,/<div[^>]*data-lyrics-container=["']true["'][^>]*>/gi),'div[data-lyrics-container="true"]');
  }else if(host==='azlyrics.com'){
    add(extractBalancedDivs(source,/<div[^>]*class=["'][^"']*col-xs-12[^"']*col-lg-8[^"']*text-center[^"']*["'][^>]*>/gi),'AZLyrics .col-xs-12.col-lg-8.text-center');
    add(extractBalancedDivs(source,/<div[^>]*class=["'][^"']*lyrics[^"']*["'][^>]*>/gi),'AZLyrics .lyrics');
  }else if(host==='lyrics.com'){
    add(extractTag(source,'pre',/<pre[^>]*id=["']lyric-body-text["'][^>]*>/gi),'Lyrics.com #lyric-body-text');
    add(extractBalancedDivs(source,/<div[^>]*class=["'][^"']*lyric-body[^"']*["'][^>]*>/gi),'Lyrics.com .lyric-body');
  }else if(host==='songlyrics.com'){
    add(extractBalancedDivs(source,/<div[^>]*id=["']songLyricsDiv["'][^>]*>/gi),'SongLyrics #songLyricsDiv');
  }else if(host==='musixmatch.com'){
    add(extractBalancedDivs(source,/<div[^>]*(?:data-testid=["'][^"']*lyrics[^"']*["']|class=["'][^"']*Lyrics__Container[^"']*["'])[^>]*>/gi),'Musixmatch lyrics container');
    add(extractTag(source,'span',/<span[^>]*class=["'][^"']*lyrics[^"']*["'][^>]*>/gi),'Musixmatch lyrics spans');
  }else{
    add(extractBalancedDivs(source,/<div[^>]*data-lyrics-container=["'][^"']*["'][^>]*>/gi),'generic data-lyrics-container');
    add(extractBalancedDivs(source,/<div[^>]*id=["']lyrics["'][^>]*>/gi),'generic #lyrics');
  }
  const json=/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;let m;
  while((m=json.exec(String(html||'')))){
    try{const d=JSON.parse(m[1]),stack=[d];while(stack.length){const x=stack.pop();if(!x||typeof x!=='object')continue;if(typeof x.lyrics==='string'){const t=cleanLyrics(x.lyrics);if(t.length>80){candidates.push(t);counts.push({selector:'JSON-LD lyrics',count:1})}}stack.push(...Object.values(x))}}catch(e){}
  }
  const unique=[...new Set(candidates)].sort((a,b)=>lyricScore(b)-lyricScore(a));
  const text=unique[0]||'';
  return {text,containerCount:counts.reduce((n,x)=>n+x.count,0),selectors:counts.map(x=>x.selector)};
}
function hostAllowed(u){const h=domainOf(u);return !!h&&Object.keys(SOURCE_PRIORITY).some(x=>h===x||h.endsWith('.'+x))}
const LYRIC_FETCH_TIMEOUT=8000;
function fetchWithTimeout(url,init={}){
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),LYRIC_FETCH_TIMEOUT);
  return fetch(url,{...init,signal:c.signal}).finally(()=>clearTimeout(timer));
}
function lyricLinks(html,base){
  const links=[],re=/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
  while((m=re.exec(html))&&links.length<40){
    let href=decode(m[1]);
    try{const u=new URL(href,base);if(u.hostname.endsWith('google.com')&&u.pathname==='/url')href=u.searchParams.get('q')||'';else if(u.hostname.endsWith('duckduckgo.com')&&u.pathname==='/l/')href=u.searchParams.get('uddg')||''}catch(e){href=''}
    if(!hostAllowed(href))continue;
    try{const u=new URL(href);const canonical=u.origin+u.pathname;if(links.some(x=>x.url===canonical))continue;links.push({url:canonical,label:cleanLyrics(m[2]).slice(0,120)})}catch(e){}
  }
  return links;
}
function linkScore(link,title,artist){
  const hay=(link.url+' '+link.label).toLowerCase(),tokens=[title,artist].join(' ').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);
  const matches=tokens.filter(x=>hay.includes(x)).length,host=domainOf(link.url);
  return matches*30+(SOURCE_PRIORITY[host]||0)-(hay.includes('translation')?25:0)-(hay.includes('meaning')?20:0);
}
async function searchLyrics(query,title,artist){
  const providers=[
    ['https://www.google.com/search?'+new URLSearchParams({q:query,gbv:'1',num:'8'}),'https://www.google.com'],
    ['https://www.google.co.id/search?'+new URLSearchParams({q:query,gbv:'1',num:'8'}),'https://www.google.co.id'],
    ['https://html.duckduckgo.com/html/?'+new URLSearchParams({q:query}),'https://html.duckduckgo.com']
  ];
  let busy=false;
  for(const [url,base] of providers){for(let attempt=0;attempt<2;attempt++){try{const r=await fetchWithTimeout(url,{headers:{'user-agent':'Mozilla/5.0 (compatible; EvoLyric/1.0)','accept':'text/html'}});if(r.status===429){busy=true;if(attempt===0)await new Promise(ok=>setTimeout(ok,350));continue}if(!r.ok)break;const links=lyricLinks(await r.text(),base);if(links.length)return links.sort((a,b)=>linkScore(b,title,artist)-linkScore(a,title,artist));break}catch(e){if(attempt===1)break}}}
  return busy?null:[];
}
async function lyrics(req){
  if(req.method!=='GET')return J({error:'method'},405);
  const q=new URL(req.url).searchParams,title=(q.get('title')||'').trim().slice(0,120),artist=(q.get('artist')||'').trim().slice(0,120);
  if(!title)return J({error:'title'},400);
  const links=await searchLyrics([title,artist,'lyrics'].filter(Boolean).join(' '),title,artist);
  if(links===null)return J({error:'search_busy'},502);
  let best=null,bestScore=0;
  for(const item of links.slice(0,8)){try{const r=await fetchWithTimeout(item.url,{headers:{'user-agent':'Mozilla/5.0 (compatible; EvoLyric/1.0)','accept':'text/html'}});if(!r.ok)continue;const parsed=extractBySource(await r.text(),item.url),score=parsed.text.length>120?lyricScore(parsed.text):0;if(score>bestScore){best={...parsed,source:item.url};bestScore=score}}catch(e){}}
  if(best)return J({title,artist,lyrics:best.text,source:best.source,containerCount:best.containerCount,selectors:best.selectors});
  return J({error:links.length?'lyrics_not_extractable':'no_results',results:links.slice(0,5).map(x=>({url:x.url,title:x.label}))},404);
}

export default{async fetch(req,env,ctx){
  const p=new URL(req.url).pathname;
  if(p==='/api/tempo')return tempo(req,env,ctx);
  if(p==='/api/lyrics')return lyrics(req);
  if(p.startsWith('/api/'))return J({error:'not_found'},404);
  return env.ASSETS.fetch(req)}};
