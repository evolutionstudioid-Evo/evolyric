/* Web Lyric – phase 1: temporary lyrics are shown in the lyrics screen but never become part of the library. */
const play=async(p,id='s1')=>{await p.evaluate(i=>openSong(songs.find(s=>s.id===i)),id);await p.waitForTimeout(400)};
const temp=async(p,o)=>{const r=await p.evaluate(o=>{const t=openTemp(o);return t&&t.id},o);await p.waitForTimeout(400);return r};
const lib=p=>p.evaluate(()=>({n:songs.length,ids:songs.map(s=>s.id),store:localStorage.getItem('evolyric-v1'),recent:localStorage.getItem('evolyric-recent-v1'),last:localStorage.getItem('evo.lastsong'),queue:[...queue]}));
const LRC='[ar: Nada Band]\r\n[ti: Lagu Uji]\r\n[00:01.20] Baris pertama\r\n[00:04.50]Baris kedua  \r\n\r\n\r\n\r\n[Chorus]\r\n[00:09.00][00:30.00] Reff <00:09.50>berulang\r\n';
module.exports=({test,assert,eq,open})=>{
test('Web Lyric: lyrics text is cleaned (line endings, LRC time stamps and header tags, extra blank lines)',async()=>{
  const t=await open(),p=t.page;
  eq(await p.evaluate(x=>lyrNorm(x),LRC),'Baris pertama\nBaris kedua\n\n[Chorus]\nReff berulang','normalised');
  eq(await p.evaluate(()=>lyrNorm('  \n\n')),'','blank stays blank');
  eq(await p.evaluate(()=>tempSong({lyrics:'[Verse]\nHalo dunia\nBaris dua'}).title),'Halo dunia','title falls back to the first lyric line');
  await t.close()});
test('Web Lyric: a temporary song opens in the lyrics screen without touching the library, Recent or the last-lyric button',async()=>{
  const t=await open(),p=t.page;await play(p,'s2');const before=await lib(p);
  const id=await temp(p,{title:'Lagu Uji',artist:'Nada Band',lyrics:LRC,src:'lrclib'});
  assert(id&&id.startsWith('tmp'),'temporary id');
  eq(await p.evaluate(()=>[$('#ptit').textContent,$('#play').classList.contains('on'),$('#play').classList.contains('tmp'),isTemp(cur)]),['Lagu Uji',true,true,true],'shown as temporary');
  eq(await p.evaluate(()=>[...document.querySelectorAll('#secs .chip')].map(c=>c.textContent)),['Chorus'],'section label in the text still becomes a chip');
  eq(await p.evaluate(()=>playing),false,'opens paused');
  /* speed and zoom changes on a temporary song never write the library */
  await p.evaluate(()=>{$('#sp').value=12;syncSpeed();setFont(cur.font+4)});
  eq(await lib(p),before,'library, Recent, last lyric and queue unchanged');
  eq(await p.evaluate(()=>songs.some(s=>s._temp)),false,'never in songs[]');
  eq(t.errors,[],'no page errors');await t.close()});
test('Web Lyric: Edit and Send are not offered for a temporary song (no way to lose an edit)',async()=>{
  const t=await open(),p=t.page;await temp(p,{title:'Lagu Uji',lyrics:'Satu\nDua'});
  await p.evaluate(()=>menuOpen(true));
  eq(await p.evaluate(()=>[$('#mE').hidden,$('#mS').hidden,$('#mR').hidden]),[true,true,false],'only Restart in the menu');
  await p.evaluate(()=>{menuOpen(false);$('#mE').onclick()});
  eq(await p.evaluate(()=>$('#edit').classList.contains('on')),false,'menu action ignored');
  /* double-tap on the title bar must not open the editor either */
  const b=await p.evaluate(()=>{const r=$('#ptit').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}});
  await p.mouse.click(b.x,b.y);await p.mouse.click(b.x,b.y);await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[$('#edit').classList.contains('on'),$('#play').classList.contains('on')]),[false,true],'still on the lyrics screen');
  /* a library song opened afterwards gets Edit back */
  await play(p,'s1');await p.evaluate(()=>menuOpen(true));
  eq(await p.evaluate(()=>[$('#mE').hidden,$('#play').classList.contains('tmp')]),[false,false],'library song: Edit available');
  await t.close()});
test('Web Lyric: going back to Home drops the temporary song; the L button returns to the last library song',async()=>{
  const t=await open(),p=t.page;await play(p,'s3');await temp(p,{title:'Lagu Uji',lyrics:'Satu\nDua'});
  await p.evaluate(()=>leavePlay());await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[cur,$('#txt').textContent,$('#list').classList.contains('on')]),[null,'',true],'temporary song gone');
  await p.evaluate(()=>$('#lastb').onclick());await p.waitForTimeout(400);
  eq(await p.evaluate(()=>[cur&&cur.id,$('#ptit').textContent]),['s3','Sore di Pelabuhan'],'L opens the last library song');
  eq(t.errors,[],'no page errors');await t.close()});
test('Web Lyric: Next from a temporary song opens the queued library song and the temporary one is gone',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{queue.push('s4');qSave()});
  await temp(p,{title:'Lagu Uji',lyrics:'Satu\nDua'});
  await p.evaluate(()=>qNext());await p.waitForTimeout(900);
  eq(await p.evaluate(()=>[cur.id,isTemp(cur),$('#play').classList.contains('tmp'),[...queue]]),['s4',false,false,[]],'queued song opened, queue consumed');
  eq(await p.evaluate(()=>JSON.parse(localStorage.getItem('evolyric-recent-v1')||'[]')[0]),'s4','Recent gets the library song only');
  await t.close()});
test('Web Lyric: empty lyrics never open the lyrics screen',async()=>{
  const t=await open(),p=t.page;
  eq(await p.evaluate(()=>openTemp({title:'Kosong',lyrics:'  \n [00:01.00] \n'})),null,'nothing opened');
  eq(await p.evaluate(()=>[$('#list').classList.contains('on'),cur]),[true,null],'still on Home');await t.close()});

/* ---------- phase 2: Save to Library + Edit in Editor ---------- */
test('Web Lyric: Save to Library (header button) turns the temporary song into a normal library song, in place',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>songs.push({id:'xl',title:'x',artist:'',lyrics:'',speed:5,font:30}));
  await temp(p,{title:'Lagu Baru',artist:'Band Uji',lyrics:'[Verse]\n'+Array.from({length:60},(_,i)=>'Baris '+i).join('\n'),src:'lrclib'});
  await p.evaluate(()=>{$('#sp').value=9;syncSpeed();$('#lyr').scrollTop=300});
  eq(await p.evaluate(()=>getComputedStyle($('#tsv')).display),'flex','Save button visible for a temporary song');
  const n0=await p.evaluate(()=>songs.length);
  await p.click('#tsv');await p.waitForTimeout(200);
  const r=await p.evaluate(()=>{const s=songs[songs.length-1];return{n:songs.length,title:s.title,artist:s.artist,speed:s.speed,temp:isTemp(cur),same:cur===s,
    stored:JSON.parse(localStorage.getItem('evolyric-v1')).some(x=>x.id===s.id),recent:JSON.parse(localStorage.getItem('evolyric-recent-v1'))[0]===s.id,last:localStorage.getItem('evo.lastsong')===s.id,
    btn:getComputedStyle($('#tsv')).display,top:$('#lyr').scrollTop,flag:'_temp' in s}});
  eq(r,{n:n0+1,title:'Lagu Baru',artist:'Band Uji',speed:9,temp:false,same:true,stored:true,recent:true,last:true,btn:'none',top:300,flag:false},'saved');
  await p.evaluate(()=>menuOpen(true));eq(await p.evaluate(()=>[$('#mE').hidden,$('#mV').hidden,$('#mT').hidden]),[false,true,true],'normal menu again');
  await p.evaluate(()=>{menuOpen(false);leavePlay()});eq(await p.evaluate(()=>songs.length),n0+1,'still in the library after going Home');
  eq(t.errors,[],'no page errors');await t.close()});
test('Web Lyric: saving a title that is already in the Library asks first; Save a copy then adds it',async()=>{
  const t=await open(),p=t.page;await temp(p,{title:'Pulang ke Panggung',artist:'Nada Band',lyrics:'Satu\nDua'});
  await p.evaluate(()=>saveTemp());await p.waitForTimeout(150);
  eq(await p.evaluate(()=>[songs.length,isTemp(cur),$('#ctx').classList.contains('on')]),[5,true,true],'nothing saved yet, question shown');
  await p.click('#ctx button.del');await p.waitForTimeout(150);
  eq(await p.evaluate(()=>[songs.length,isTemp(cur),songs.filter(s=>s.title==='Pulang ke Panggung').length]),[6,false,2],'copy saved after confirming');
  await t.close()});
test('Web Lyric: the ⋮ menu offers Save to Library and Edit in Editor for a temporary song',async()=>{
  const t=await open(),p=t.page;await temp(p,{title:'Lagu Baru',lyrics:'Satu\nDua'});
  await p.evaluate(()=>menuOpen(true));
  eq(await p.evaluate(()=>[$('#mV').hidden,$('#mT').hidden,$('#mE').hidden,$('#mR').hidden]),[false,false,true,false],'menu items');
  await p.evaluate(()=>$('#mV').onclick());eq(await p.evaluate(()=>[songs.length,isTemp(cur)]),[6,false],'menu Save works');await t.close()});
test('Web Lyric: Edit in Editor opens the lyrics in the editor; one tap on close goes back; Save there creates one library song',async()=>{
  const t=await open(),p=t.page;await temp(p,{title:'Lagu Baru',artist:'Band Uji',lyrics:'[Verse]\nSatu\nDua'});
  await p.evaluate(()=>$('#mT').onclick());await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[$('#edit').classList.contains('on'),$('#et').value,$('#ea').value,$('#ta').value]),[true,'Lagu Baru','Band Uji','[Verse]\nSatu\nDua'],'editor filled');
  await p.evaluate(()=>$('#eX').onclick());await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[$('#play').classList.contains('on'),isTemp(cur),cur.title,songs.length]),[true,true,'Lagu Baru',5],'one tap back to the temporary lyrics');
  await p.evaluate(()=>$('#mT').onclick());await p.waitForTimeout(200);
  await p.evaluate(()=>{$('#et').value='Lagu Baru (edit)';$('#eS').onclick()});await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[songs.length,isTemp(cur),cur.title,cur.artist,$('#play').classList.contains('tmp')]),[6,false,'Lagu Baru (edit)','Band Uji',false],'saved from the editor');
  eq(t.errors,[],'no page errors');await t.close()});
test('Web Lyric: the Save button fades with the other floating buttons while auto-scroll runs',async()=>{
  const t=await open(),p=t.page;await temp(p,{title:'Lagu Baru',lyrics:Array.from({length:80},(_,i)=>'Baris '+i).join('\n')});
  await p.evaluate(()=>{setDimPref(true);setPlay(true)});await p.waitForTimeout(300);
  eq(await p.evaluate(()=>getComputedStyle($('#tsv')).opacity),'0.08','dimmed while scrolling');
  await p.evaluate(()=>setPlay(false));await p.waitForTimeout(100);eq(await p.evaluate(()=>getComputedStyle($('#tsv')).opacity),'1','full when paused');await t.close()});
test('Web Lyric: the Save button and menu items are translated in Indonesian',async()=>{
  const t=await open({lang:'id'}),p=t.page;await temp(p,{title:'Lagu Baru',lyrics:'Satu'});await p.evaluate(()=>menuOpen(true));await p.waitForTimeout(150);
  eq(await p.evaluate(()=>[$('#tsv span').textContent,$('#tsv').getAttribute('aria-label'),$('#mV').textContent,$('#mT').textContent]),['Simpan','Simpan ke Library','Simpan ke Library','Edit di Editor'],'ID');await t.close()});

/* ---------- phase 3: LRCLIB engine (LRCLIB is replaced by a stub – the real site is never called) ---------- */
const R=(id,track,artist,plain,o={})=>({id,trackName:track,artistName:artist,albumName:o.album||'Album',duration:o.dur||200,instrumental:!!o.inst,plainLyrics:plain,syncedLyrics:o.synced||null});
const STUB=[R(1,'Kangen','Dewa 19','Kangen\nAku kangen'),R(2,'Kangen (Live)','Dewa 19','Kangen versi live\nTepuk tangan',{album:'Live Konser'}),
  R(3,'Kangen','Dewa 19','Kangen\nAku kangen'),R(4,'Kangen','Dewa 19',null,{inst:true}),R(5,'Rindu','Agnes','Rindu'),R(6,'Kangen','Band Lain',null,{synced:'[00:01.00] Kangen sync\n[00:03.00] Baris dua'})];
async function stub(p,handler){const hits=[];await p.route('https://lrclib.net/**',route=>{hits.push(route.request().url());return handler(route)});return hits}
const json=(route,body,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(body)});
test('LRCLIB: matching versions are listed best-first; duplicates, instrumentals and other songs are left out; synced-only lyrics lose their time stamps',async()=>{
  const t=await open(),p=t.page;const hits=await stub(p,r=>json(r,STUB));
  const res=await p.evaluate(()=>lrcFind('kangen'));
  eq(res.state,'ok','found');eq(res.items.map(i=>i.id),[1,6,2],'exact titles first, duplicate #3, instrumental #4 and Rindu #5 removed');
  eq(res.items.map(i=>[i.variant,i.synced]),[['',false],['',true],['live',false]],'variant and synced flags');
  eq(res.items[1].lyrics,'Kangen sync\nBaris dua','time stamps removed');
  assert(hits.length===1&&hits[0].includes('/api/search?q=kangen'),'one search request: '+hits);
  await t.close()});
test('LRCLIB: no match, server error and offline each give their own state; only real answers are cached',async()=>{
  const t=await open(),p=t.page;let mode='none';
  const hits=await stub(p,r=>mode==='none'?json(r,[R(5,'Rindu','Agnes','Rindu')]):json(r,{error:'x'},500));
  eq((await p.evaluate(()=>lrcFind('lagu tidak ada'))).state,'none','no usable match');
  eq(await p.evaluate(()=>{const r=lrcPeek('Lagu Tidak Ada');return r&&r.state}),'none','cached (case-insensitive)');
  await p.evaluate(()=>lrcFind('lagu tidak ada'));eq(hits.length,1,'second lookup served from cache');
  mode='err';eq((await p.evaluate(()=>lrcFind('lagu error'))).state,'error','server error');
  eq(await p.evaluate(()=>lrcPeek('lagu error')),null,'errors are not cached');
  await t.ctx.setOffline(true);eq((await p.evaluate(()=>lrcFind('lagu offline'))).state,'offline','offline');await t.ctx.setOffline(false);
  eq((await p.evaluate(()=>lrcFind('   '))).state,'empty','empty query');eq(hits.length,2,'offline and empty never call LRCLIB');
  eq(t.errors,[],'no page errors');await t.close()});
test('LRCLIB: prefetch waits for a pause in typing, then the answer is ready instantly',async()=>{
  const t=await open(),p=t.page;const hits=await stub(p,r=>json(r,STUB));
  await p.evaluate(()=>{lrcPrefetch('ka');lrcPrefetch('kang');lrcPrefetch('kangen')});await p.waitForTimeout(1000);
  eq(hits.length,1,'only the last text is looked up');eq(await p.evaluate(()=>lrcPeek('kangen').items[0].id),1,'ready');await t.close()});
test('LRCLIB: typing in the search boxes asks LRCLIB once, after a pause',async()=>{
  const t=await open(),p=t.page;const hits=await stub(p,r=>json(r,STUB));
  await p.type('#q','kangen',{delay:40});await p.waitForTimeout(1000);eq(hits.length,1,'one request after typing stops');await t.close()});

/* ---------- phases 4 + 5: the globe button ---------- */
const ONE=[R(11,'Separuh Nafas','Dewa 19','Aku tak bisa\nLuluhkan hatimu')];
const pages=t=>{const a=[];t.ctx.on('page',pg=>a.push(pg));return a};
const vis=(p,hidden)=>p.evaluate(h=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>h});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>h?'hidden':'visible'});document.dispatchEvent(new Event('visibilitychange'))},hidden);
const sheet=p=>p.evaluate(()=>$('#ctx').classList.contains('on')?[...$('#csheet').children].map(e=>e.textContent):null);
test('Globe: one LRCLIB match opens straight into the lyrics screen as a temporary song (no editor, no Google)',async()=>{
  const t=await open(),p=t.page;const pg=pages(t);await stub(p,r=>json(r,ONE));
  await p.fill('#q','separuh nafas');await p.waitForTimeout(900);await p.click('#goog');await p.waitForTimeout(500);
  eq(await p.evaluate(()=>[$('#play').classList.contains('on'),isTemp(cur),cur.title,cur.artist,cur.src,$('#edit').classList.contains('on'),songs.length]),[true,true,'Separuh Nafas','Dewa 19','lrclib',false,5],'temporary lyrics shown');
  eq(pg.length,0,'Google not opened');eq(t.errors,[],'no page errors');await t.close()});
test('Globe: several versions show a short list to choose from; the chosen one opens',async()=>{
  const t=await open(),p=t.page;await stub(p,r=>json(r,STUB));
  await p.fill('#q','kangen');await p.waitForTimeout(900);await p.click('#goog');await p.waitForTimeout(300);
  const sh=await sheet(p);eq(sh[0],'Choose a version','list title');
  eq(await p.evaluate(()=>[...document.querySelectorAll('#csheet .wlv')].map(b=>b.querySelector('b').textContent+' | '+b.querySelector('small').textContent)),
    ['Kangen | Dewa 19 · Album · 3:20','Kangen | Band Lain · Album · 3:20','Kangen (Live) | Dewa 19 · Live Konser · 3:20live'],'versions with artist, album, length and tag');
  assert(sh[sh.length-1]==='Lyrics from LRCLIB','source credit');
  await p.click('#csheet .wlv >> nth=1');await p.waitForTimeout(400);
  eq(await p.evaluate(()=>[isTemp(cur),cur.artist,cur.lyrics,$('#ctx').classList.contains('on')]),[true,'Band Lain','Kangen sync\nBaris dua',false],'picked version opened');
  await t.close()});
test('Globe: no match opens Google; coming back asks once – Show lyrics turns what was copied into a temporary song',async()=>{
  const t=await open(),p=t.page;const pg=pages(t);await stub(p,r=>json(r,[]));
  await t.ctx.grantPermissions(['clipboard-read','clipboard-write']);await t.ctx.route('https://www.google.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:'google'}));
  await p.fill('#q','lagu langka');await p.waitForTimeout(900);await p.click('#goog');await p.waitForTimeout(600);
  eq(pg.length,1,'Google opened');assert(pg[0].url().includes('google.com/search?q=lagu%20langka%20lyric'),'query: '+pg[0].url());
  eq(await p.evaluate(()=>$('#edit').classList.contains('on')),false,'editor not opened any more');
  await vis(p,true);await p.evaluate(()=>navigator.clipboard.writeText('Baris satu lirik\nBaris dua lirik\n\nBaris tiga'));await vis(p,false);await p.bringToFront();await p.waitForTimeout(500);
  const sh=await sheet(p);eq([sh[0],sh[2],sh[3]],['Copied the lyrics?','Show lyrics','Back'],'question shown');
  await p.click('#csheet .wlok');await p.waitForTimeout(500);
  eq(await p.evaluate(()=>[$('#play').classList.contains('on'),isTemp(cur),cur.title,cur.src,cur.lyrics,songs.length]),[true,true,'lagu langka','google','Baris satu lirik\nBaris dua lirik\n\nBaris tiga',5],'copied lyrics shown as temporary song');
  await vis(p,true);await vis(p,false);await p.waitForTimeout(500);eq(await sheet(p),null,'asked only once');
  await t.close()});
test('Globe: Back after Google leaves everything as it was (Home stays Home, the open song stays open)',async()=>{
  const t=await open(),p=t.page;await stub(p,r=>json(r,[]));
  await p.evaluate(()=>openSong(songs.find(s=>s.id==='s2')));await p.waitForTimeout(300);await p.evaluate(()=>{$('#lyr').scrollTop=120});
  await p.evaluate(()=>{drawer(true)});await p.fill('#dq','lagu langka');await p.waitForTimeout(900);await p.click('#dgoog');await p.waitForTimeout(300);
  await vis(p,true);await vis(p,false);await p.waitForTimeout(500);
  await p.click('#csheet button:has-text("Back")');await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[$('#play').classList.contains('on'),cur.id,isTemp(cur),$('#ctx').classList.contains('on'),$('#edit').classList.contains('on')]),[true,'s2',false,false,false],'same song, nothing changed');
  await t.close()});
test('Globe: nothing usable on the clipboard keeps the question open and says so; a refused clipboard offers a paste box',async()=>{
  const t=await open(),p=t.page;await stub(p,r=>json(r,[]));await t.ctx.grantPermissions(['clipboard-read','clipboard-write']);
  await p.fill('#q','lagu langka');await p.waitForTimeout(900);await p.click('#goog');
  await vis(p,true);await p.evaluate(()=>navigator.clipboard.writeText('https://example.com/lirik'));await vis(p,false);await p.waitForTimeout(500);
  await p.click('#csheet .wlok');await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[$('#note').textContent,$('#note').classList.contains('bad'),$('#ctx').classList.contains('on'),$('#list').classList.contains('on')]),
    ['No lyrics copied yet. Copy the lyrics first, then try again.',true,true,true],'told, question still open, still Home');
  /* clipboard refused -> paste box */
  await p.evaluate(()=>{navigator.clipboard.readText=()=>Promise.reject(new Error('denied'))});
  await p.click('#csheet .wlok');await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[$('#csheet h3').textContent,!!$('#csheet .wlta')]),['Paste the lyrics',true],'paste box');
  await p.fill('#csheet .wlta','Baris satu lirik\nBaris dua lirik');await p.click('#csheet .wlok');await p.waitForTimeout(400);
  eq(await p.evaluate(()=>[isTemp(cur),cur.lyrics]),[true,'Baris satu lirik\nBaris dua lirik'],'pasted lyrics shown');await t.close()});
test('Globe: if the browser blocks the Google tab, one tap on Search Google opens it',async()=>{
  const t=await open(),p=t.page;await stub(p,r=>json(r,[]));
  await p.evaluate(()=>{window.__ws=0;webSearch=()=>{window.__ws++}}); /* simulate a blocked tab: nothing leaves the page */
  await p.fill('#q','lagu langka');await p.waitForTimeout(900);await p.click('#goog');await p.waitForTimeout(2200);
  const sh=await sheet(p);eq([sh[0],sh[1]],['Not found on LRCLIB','Search Google'],'offered');
  await p.click('#csheet button:has-text("Search Google")');eq(await p.evaluate(()=>window.__ws),2,'opened again from the tap');await t.close()});
test('Globe: a tap before LRCLIB has answered waits for it (spinning globe), then opens the lyrics',async()=>{
  const t=await open(),p=t.page;await stub(p,async r=>{await new Promise(z=>setTimeout(z,500));return json(r,ONE)});
  await p.evaluate(()=>{$('#q').value='separuh nafas'});await p.click('#goog');
  eq(await p.evaluate(()=>$('#goog').classList.contains('busy')),true,'busy while waiting');await p.waitForTimeout(900);
  eq(await p.evaluate(()=>[isTemp(cur),$('#goog').classList.contains('busy')]),[true,false],'opened, spinner gone');await t.close()});
test('Globe: offline says so and stays put (no Google, no editor)',async()=>{
  const t=await open(),p=t.page;const pg=pages(t);await stub(p,r=>json(r,ONE));await t.ctx.setOffline(true);
  await p.evaluate(()=>{$('#q').value='separuh nafas'});await p.click('#goog');await p.waitForTimeout(400);
  eq(await p.evaluate(()=>[$('#note').textContent,$('#list').classList.contains('on'),cur]),['You are offline. Lyrics search needs an internet connection.',true,null],'offline note');
  eq(pg.length,0,'no Google');await t.ctx.setOffline(false);await t.close()});
test('Globe: empty search box does nothing',async()=>{
  const t=await open(),p=t.page;const pg=pages(t);const hits=await stub(p,r=>json(r,ONE));
  await p.click('#goog');await p.waitForTimeout(300);eq([hits.length,pg.length,await p.evaluate(()=>$('#list').classList.contains('on'))],[0,0,true],'nothing');await t.close()});
test('Globe: the version list and the return question are translated in Indonesian',async()=>{
  const t=await open({lang:'id'}),p=t.page;await stub(p,r=>json(r,STUB));
  await p.fill('#q','kangen');await p.waitForTimeout(900);await p.click('#goog');await p.waitForTimeout(300);
  const a=await sheet(p);eq([a[0],a[a.length-2],a[a.length-1]],['Pilih versi','Batal','Lirik dari LRCLIB'],'list');
  await p.evaluate(()=>{ctxClose();wlBack('x')});await p.waitForTimeout(200);
  eq(await sheet(p),['Sudah copy liriknya?','Copy lirik di halaman Google, lalu ketuk Tampilkan lirik.','Tampilkan lirik','Kembali'],'question');await t.close()});

/* ---------- v141: versions button in the speed corner ---------- */
const vis2=p=>p.evaluate(()=>({vsb:getComputedStyle($('#vsb')).display,spb:getComputedStyle($('#spb')).display}));
test('Versions: after picking from the LRCLIB list, the speed corner shows a versions button instead of Speed',async()=>{
  const t=await open(),p=t.page;await stub(p,r=>json(r,STUB));
  await p.fill('#q','kangen');await p.waitForTimeout(900);await p.click('#goog');await p.waitForTimeout(300);
  await p.click('#csheet .wlv >> nth=1');await p.waitForTimeout(400);
  eq(await vis2(p),{vsb:'flex',spb:'none'},'versions button replaces speed');
  eq(await p.evaluate(()=>$('#vsbv').textContent),'3','shows how many versions');
  await p.click('#vsb');await p.waitForTimeout(250);
  const r=await p.evaluate(()=>({open:$('#vsp').classList.contains('open'),items:[...document.querySelectorAll('#vsl .wlv')].map(b=>b.querySelector('b').textContent+(b.classList.contains('cur')?' *':''))}));
  eq(r,{open:true,items:['Kangen','Kangen *','Kangen (Live)']},'same list, current marked');
  await p.evaluate(()=>{$('#sp').value=11;syncSpeed();setFont(cur.font+6)});const f0=await p.evaluate(()=>cur.font);
  await p.click('#vsl .wlv >> nth=2');await p.waitForTimeout(400);
  eq(await p.evaluate(()=>[isTemp(cur),cur.title,cur.artist,cur.lyrics,cur.speed,$('#vsp').classList.contains('open'),$('#play').classList.contains('lrc'),songs.length]),
    [true,'Kangen (Live)','Dewa 19','Kangen versi live\nTepuk tangan',11,false,true,5],'switched, speed kept, still temporary, nothing saved');
  eq(await p.evaluate(()=>cur.font),f0,'zoom kept');
  /* after Save the song is a library song: Speed comes back */
  await p.evaluate(()=>saveTemp());await p.waitForTimeout(150);
  eq(await vis2(p),{vsb:'none',spb:'flex'},'speed back after saving');eq(t.errors,[],'no page errors');await t.close()});
test('Versions: shown for every LRCLIB pick (one version too); not for library songs or lyrics pasted from Google',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>openSong(songs[0]));await p.waitForTimeout(300);
  eq(await vis2(p),{vsb:'none',spb:'flex'},'library song');
  await p.evaluate(()=>openTemp({title:'x',lyrics:'Satu\nDua',src:'lrclib',vers:[{id:1,title:'x',lyrics:'Satu\nDua'}],srcId:1}));await p.waitForTimeout(300);
  eq(await vis2(p),{vsb:'flex',spb:'none'},'one LRCLIB version: the panel still offers More version');
  await p.evaluate(()=>openTemp({title:'y',lyrics:'Satu\nDua',src:'google'}));await p.waitForTimeout(300);
  eq(await vis2(p),{vsb:'none',spb:'flex'},'from Google');
  await p.evaluate(()=>vsOpen(true));eq(await p.evaluate(()=>$('#vsp').classList.contains('open')),false,'panel cannot open without versions');await t.close()});
test('Versions: a tap outside or Back closes the panel; going Home clears it; Indonesian labels',async()=>{
  const t=await open({lang:'id'}),p=t.page;
  await p.evaluate(()=>{const v=[{id:1,title:'A',artist:'X',lyrics:'Satu\nDua',dur:200},{id:2,title:'A',artist:'Y',lyrics:'Tiga\nEmpat',dur:210}];wlOpen(v[0],v)});await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[$('#vsb small').textContent,$('#vsb').getAttribute('aria-label')]),['versi','Versi'],'ID');
  await p.click('#vsb');await p.waitForTimeout(200);await p.mouse.click(150,400);await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[$('#vsp').classList.contains('open'),playing]),[false,false],'outside tap closes without starting playback');
  await p.click('#vsb');await p.waitForTimeout(200);await p.evaluate(()=>leavePlay());
  eq(await p.evaluate(()=>[$('#vsp').classList.contains('open'),$('#play').classList.contains('lrc')]),[false,false],'cleared on Home');await t.close()});

/* ---------- v142: More version + Reload app ---------- */
test('Versions: More version opens Google for the title; coming back asks Show lyrics / Back',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>{window.__q=[];webSearch=q=>window.__q.push(q);const v=[{id:1,title:'Lagu Uji',artist:'X',lyrics:'Satu\nDua'}];wlOpen(v[0],v)});await p.waitForTimeout(300);
  await p.click('#vsb');await p.waitForTimeout(200);
  eq(await p.evaluate(()=>$('#vsg').textContent),'More version','button label');
  await p.click('#vsg');await p.waitForTimeout(100);
  eq(await p.evaluate(()=>[window.__q,$('#vsp').classList.contains('open')]),[['Lagu Uji'],false],'Google searched for the title, panel closed');
  await vis(p,true);await vis(p,false);await p.waitForTimeout(500);
  const sh=await sheet(p);eq([sh[0],sh[2],sh[3]],['Copied the lyrics?','Show lyrics','Back'],'return question');
  await p.click('#csheet button:has-text("Back")');await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[isTemp(cur),cur.title,$('#play').classList.contains('on')]),[true,'Lagu Uji',true],'Back keeps the LRCLIB lyrics on screen');
  await t.close()});
test('Reload app: in the gear menu (ID: Muat ulang aplikasi); it reloads the page',async()=>{
  const t=await open({lang:'id'}),p=t.page;
  await p.click('#gear');await p.waitForTimeout(200);
  const items=await p.evaluate(()=>[...document.querySelectorAll('#gmenu .mi')].map(b=>b.textContent));
  eq(items,['Preferensi','Bantuan','Muat ulang aplikasi'],'menu items');
  await p.evaluate(()=>{window.__mark=1});
  await Promise.all([p.waitForNavigation({timeout:15000}),p.click('#gmenu .mi >> nth=2')]);await p.waitForTimeout(300);
  eq(await p.evaluate(()=>window.__mark),undefined,'page was reloaded');await t.close()});
};
