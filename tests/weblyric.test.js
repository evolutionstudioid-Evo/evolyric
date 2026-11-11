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
test('LRCLIB: typing in the search boxes does not contact LRCLIB yet (phase 3 is not wired to any button)',async()=>{
  const t=await open(),p=t.page;const hits=await stub(p,r=>json(r,STUB));
  await p.fill('#q','kangen');await p.waitForTimeout(1000);eq(hits.length,0,'no request');await t.close()});
};
