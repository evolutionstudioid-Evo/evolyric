/* Find lyrics (LRCLIB). The real lrclib.net is never called: every request is answered by a stub inside the test browser. */
const HIT=[
  {id:1,trackName:'Pulang ke Panggung',artistName:'Nada Band',albumName:'Album Satu',duration:215,instrumental:false,plainLyrics:'Lampu panggung mulai menyala\nRuangan hening menunggu kita\n\nPulang, pulang ke panggung',syncedLyrics:'[00:10.00] Lampu panggung mulai menyala'},
  {id:2,trackName:'Pulang ke Panggung',artistName:'Nada Band',albumName:'Live',duration:230,instrumental:false,plainLyrics:'Versi live\nBaris dua',syncedLyrics:null},
  {id:3,trackName:'Pulang ke Panggung',artistName:'Nada Band',albumName:'Album Satu (Remaster)',duration:215,instrumental:false,plainLyrics:'Lampu panggung mulai menyala\nRuangan hening menunggu kita\n\nPulang, pulang ke panggung',syncedLyrics:null},
  {id:4,trackName:'Pulang ke Panggung',artistName:'Nada Band',albumName:'Instrumental',duration:215,instrumental:true,plainLyrics:null,syncedLyrics:null}];
const stub=async(p,body,status=200)=>{const seen=[];
  await p.route('https://lrclib.net/api/search*',r=>{seen.push(new URL(r.request().url()).searchParams);r.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(typeof body==='function'?body(seen.length):body)})});
  return seen};
const edit=(p,title,artist,txt)=>p.evaluate(([t,a,x])=>{openEdit(null,x||'',t,null,[]);$('#ea').value=a||''},[title,artist,txt]);
const rows=p=>p.evaluate(()=>[...document.querySelectorAll('#csheet .lrr')].map(b=>[...b.children].map(c=>c.textContent)));
module.exports=({test,assert,eq,open})=>{
test('Find lyrics: asks LRCLIB with title and artist and lists each distinct version once',async()=>{
  const t=await open(),p=t.page,seen=await stub(p,HIT);await edit(p,'Pulang ke Panggung','Nada Band');
  await p.click('#eL');await p.waitForSelector('#csheet .lrr');
  eq(seen.length,1,'one request');eq([seen[0].get('track_name'),seen[0].get('artist_name')],['Pulang ke Panggung','Nada Band'],'query');
  const r=await rows(p);eq(r.length,2,'duplicate (same lyrics) and instrumental are dropped');
  eq(r[0],['Pulang ke Panggung','Nada Band · Album Satu · 3:35','Lampu panggung mulai menyala'],'first row: title, artist · album · length, first lyric line');
  assert(await p.evaluate(()=>document.querySelector('#csheet .credit a').href.startsWith('https://lrclib.net')),'credit link');await t.close()});
test('Find lyrics: picking a result fills the text box, keeps typed title and artist, and Undo brings the old text back',async()=>{
  const t=await open(),p=t.page;await stub(p,HIT);await edit(p,'Judul Saya','Artis Saya','teks lama saya');
  await p.click('#eL');await p.waitForSelector('#csheet .lrr');await p.click('#csheet .lrr >> nth=0');await p.waitForTimeout(200);
  eq(await p.evaluate(()=>$('#ta').value),HIT[0].plainLyrics,'lyrics in the text box');
  eq(await p.evaluate(()=>[$('#et').value,$('#ea').value]),['Judul Saya','Artis Saya'],'typed title and artist stay');
  eq(await p.evaluate(()=>ed.dirty),true,'marked as changed');eq(await p.evaluate(()=>$('#ctx').classList.contains('on')),false,'sheet closed');
  await p.evaluate(()=>$('#eU').click());eq(await p.evaluate(()=>$('#ta').value),'teks lama saya','Undo restores the old text');
  await p.evaluate(()=>$('#eR').click());eq(await p.evaluate(()=>$('#ta').value),HIT[0].plainLyrics,'Redo');await t.close()});
test('Find lyrics: an empty artist box is filled from the chosen result, and Save keeps the lyrics',async()=>{
  const t=await open(),p=t.page;await stub(p,HIT);await edit(p,'Pulang ke Panggung','');
  await p.click('#eL');await p.waitForSelector('#csheet .lrr');await p.click('#csheet .lrr >> nth=1');await p.waitForTimeout(200);
  eq(await p.evaluate(()=>$('#ea').value),'Nada Band','artist filled');await p.evaluate(()=>$('#eS').click());await p.waitForTimeout(300);
  eq(await p.evaluate(()=>cur.lyrics),'Versi live\nBaris dua','saved lyrics');eq(await p.evaluate(()=>cur.artist),'Nada Band','saved artist');await t.close()});
test('Find lyrics: with no artist it searches by title only, then widens the search once',async()=>{
  const t=await open(),p=t.page,seen=await stub(p,n=>n===1?[]:HIT);await edit(p,'Pulang','');
  await p.click('#eL');await p.waitForSelector('#csheet .lrr');
  eq(seen.length,2,'two requests');eq([seen[0].has('track_name'),seen[0].has('artist_name')],[true,false],'first: track_name only');
  eq(seen[1].get('q'),'Pulang','second: general search');await t.close()});
test('Find lyrics: no match shows a clear message and changes nothing',async()=>{
  const t=await open(),p=t.page;await stub(p,[]);await edit(p,'Lagu Tak Ada','Siapa Saja','teks saya');
  await p.click('#eL');await p.waitForSelector('#csheet p');
  assert((await p.evaluate(()=>$('#csheet').textContent)).includes('No lyrics found'),'message');
  eq(await p.evaluate(()=>$('#ta').value),'teks saya','text untouched');eq(await p.evaluate(()=>$('#eL').disabled),false,'button usable again');await t.close()});
test('Find lyrics: a server or network error shows a note and the button recovers',async()=>{
  const t=await open(),p=t.page;await stub(p,{message:'boom'},500);await edit(p,'Pulang ke Panggung','Nada Band','teks saya');
  await p.click('#eL');await p.waitForFunction(()=>$('#note').classList.contains('bad'));
  assert((await p.evaluate(()=>$('#note').textContent)).includes('Lyrics search failed'),'failure note');
  eq(await p.evaluate(()=>$('#ta').value),'teks saya','text untouched');eq(await p.evaluate(()=>$('#eL').disabled),false,'button usable again');
  await p.unroute('https://lrclib.net/api/search*');await p.route('https://lrclib.net/api/search*',r=>r.abort());
  await p.click('#eL');await p.waitForFunction(()=>$('#note').textContent.includes('failed')&&!$('#eL').disabled);await t.close()});
test('Find lyrics: without a title it asks for one and sends no request',async()=>{
  const t=await open(),p=t.page,seen=await stub(p,HIT);await edit(p,'','Nada Band');
  await p.click('#eL');await p.waitForTimeout(300);
  assert((await p.evaluate(()=>$('#note').textContent)).includes('Add a song title first'),'asks for a title');eq(seen.length,0,'no request');await t.close()});
test('Find lyrics: offline it says so and sends no request',async()=>{
  const t=await open(),p=t.page,seen=await stub(p,HIT);await edit(p,'Pulang ke Panggung','Nada Band');
  await t.ctx.setOffline(true);await p.click('#eL');await p.waitForTimeout(300);
  assert((await p.evaluate(()=>$('#note').textContent)).includes('offline'),'offline note');eq(seen.length,0,'no request');await t.ctx.setOffline(false);await t.close()});
test('Find lyrics: synced-only tracks lose their time stamps, instrumentals and empty tracks are skipped',async()=>{
  const t=await open(),p=t.page;
  const r=await p.evaluate(()=>({
    a:lrcPlain({plainLyrics:null,syncedLyrics:'[00:12.34] Baris satu\r\n[00:15.00][00:40.10] Baris dua\n[00:20.00]\n\n\n[00:30.00] <00:30.10>Baris <00:30.50>tiga'}),
    b:lrcPlain({plainLyrics:'  polos  ',syncedLyrics:'[00:01.00] lain'}),c:lrcPlain(null),
    n:lrcRank([{instrumental:true,plainLyrics:'x'},{plainLyrics:null,syncedLyrics:null},{trackName:'ok',plainLyrics:'y'},null,'zzz']).map(x=>x.trackName||'?'),
    m:lrcRank(Array.from({length:20},(_,i)=>({trackName:'t'+i,plainLyrics:'baris '+i}))).length}));
  eq(r.a,'Baris satu\nBaris dua\n\nBaris tiga','timestamps stripped, blank lines collapsed');eq(r.b,'polos','plain text wins');eq(r.c,'','null is empty');
  eq(r.n,['ok'],'unusable rows skipped');eq(r.m,8,'at most 8 results');await t.close()});
test('Find lyrics: the picker is scrollable on a small phone and the toolbar button has a label',async()=>{
  const t=await open(),p=t.page;await stub(p,Array.from({length:8},(_,i)=>({trackName:'Lagu '+i,artistName:'A',albumName:'B',duration:100+i,plainLyrics:'Baris '+i+'\nbaris dua'})));
  await edit(p,'Lagu','A');eq(await p.evaluate(()=>$('#eL').getAttribute('aria-label')),'Find lyrics','aria-label');
  await p.click('#eL');await p.waitForSelector('#csheet .lrr');
  const m=await p.evaluate(()=>{const s=$('#csheet').getBoundingClientRect();return{h:s.height,vh:innerHeight,top:s.top>=0,bottom:s.bottom<=innerHeight,ov:getComputedStyle($('#csheet')).overflowY}});
  assert(m.top&&m.bottom,'sheet stays inside the screen: '+JSON.stringify(m));eq(m.ov,'auto','scrolls');
  await p.evaluate(()=>{ctxClose();ctxOpen(songs[0],null)});eq(await p.evaluate(()=>$('#csheet').style.cssText),'','other menus reset the sheet size');await t.close()});
};
