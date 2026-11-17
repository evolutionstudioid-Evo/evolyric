/* v177 (beta): Tempo mode – the clock drives the highlight and the scroll (fictional lyrics only).
   240 BPM and 1 beat per line = 250 ms per line, so the tests stay short. */
const LYR=['[Verse 1]','Lampu kota mulai redup','Langkahku pelan menuju pulang','Jalan basah sisa hujan','Ku ingat semua tentangmu','','[Interlude]','(solo gitar)','','[Chorus]','Pulanglah, pulanglah padaku','Rumah ini masih menunggu','Lampu teras masih menyala','Untuk dirimu yang kucinta'].join('\n');
module.exports=({test,assert,eq,open})=>{
const song=async(p,extra)=>{await p.evaluate(([x,e])=>{songs.push(Object.assign({id:'tm1',title:'Uji Tempo',artist:'',lyrics:x,speed:5,font:30,cr:1,md:1,bpm:240,bpl:1},e));openSong(songs.find(s=>s.id==='tm1'))},[LYR,extra||{}]);await p.waitForTimeout(400)};
const tapLine=async(p,txt)=>{const r=await p.evaluate(t=>{const el=[...document.querySelectorAll('#txt .ln')].find(d=>d.textContent===t);el.scrollIntoView({block:'center'});const b=el.getBoundingClientRect();return{x:b.left+Math.min(40,b.width/2),y:b.top+b.height/2}},txt);await p.mouse.click(r.x,r.y)};
const now=p=>p.evaluate(()=>{const e=document.querySelector('#txt .tnow');return e?e.textContent:null});
const run=p=>p.evaluate(()=>document.querySelector('#play').classList.contains('run'));

test('Tempo: tap the first line starts the clock, lines follow the BPM, interlude bars pause and go on by themselves',async()=>{
  const t=await open(),p=t.page;await song(p,{tsec:{interlude:{bars:1}}});
  eq(await p.evaluate(()=>tmOn()),true,'tempo mode is on for a song with a BPM');
  eq(await run(p),false,'nothing runs before the tap');
  await tapLine(p,'Lampu kota mulai redup');await p.waitForTimeout(120);
  eq(await run(p),true,'tap on the first line starts');eq(await now(p),'Lampu kota mulai redup','first line is lit');
  await p.waitForTimeout(400);
  eq(await now(p),'Jalan basah sisa hujan','two lines later after ~500 ms');
  eq(await p.evaluate(()=>[...document.querySelectorAll('#txt .ln.tdone')].map(e=>e.textContent)),['Lampu kota mulai redup','Langkahku pelan menuju pulang'],'finished lines are marked');
  await p.waitForTimeout(700);
  eq(await p.evaluate(()=>{const s=document.querySelector('#txt .sec.tpause');return s&&s.dataset.k}),'interlude','interlude is pausing');
  eq(await run(p),true,'still running during the bars (aurora stays on)');
  eq(await now(p),null,'no lyric line lit during the bars');
  await p.waitForTimeout(1000);
  eq(await now(p),'Pulanglah, pulanglah padaku','after 1 bar (4 beats) the chorus goes on by itself');
  eq(t.errors,[],'no page errors');await t.close()});

test('Tempo: tap any line re-syncs; tap beside the lyrics pauses and goes on; a section without bars waits for a tap',async()=>{
  const t=await open(),p=t.page;await song(p);
  await tapLine(p,'Lampu kota mulai redup');await p.waitForTimeout(300);
  await tapLine(p,'Rumah ini masih menunggu');await p.waitForTimeout(100);
  eq(await now(p),'Rumah ini masih menunggu','re-synced to the tapped line');
  eq(await p.evaluate(()=>document.querySelector('#txt .ln.tdone')&&[...document.querySelectorAll('#txt .ln.tdone')].map(e=>e.textContent).includes('Lampu kota mulai redup')),true,'lines before it count as sung');
  const sec=await p.evaluate(()=>{const b=document.querySelector('#txt .sec[data-k="chorus"]').getBoundingClientRect();return{x:b.left+5,y:b.top+b.height/2}});
  await p.mouse.click(sec.x,sec.y);await p.waitForTimeout(100);
  eq(await run(p),false,'tap beside the lyrics pauses');
  await p.waitForTimeout(400);
  await p.mouse.click(sec.x,sec.y);await p.waitForTimeout(80);
  eq(await run(p),true,'tap again goes on');eq(await now(p),'Rumah ini masih menunggu','from the same line');
  /* interlude without bars: waits */
  await tapLine(p,'Ku ingat semua tentangmu');await p.waitForTimeout(500);
  eq(await run(p),false,'stops at the interlude that has no bars');
  eq(await p.evaluate(()=>waiting),true,'waiting for a tap');
  await p.mouse.click(sec.x,sec.y);await p.waitForTimeout(80);
  eq(await now(p),'Pulanglah, pulanglah padaku','the tap starts the next section');
  eq(t.errors,[],'no page errors');await t.close()});

test('Tempo: word-by-word highlight and per-section beats per line',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>{PREF.thl='w'});await song(p,{tsec:{chorus:{bpl:4}}});
  eq(await p.evaluate(()=>document.querySelector('#txt').dataset.thl),'w','word mode');
  await tapLine(p,'Pulanglah, pulanglah padaku');await p.waitForTimeout(60);
  const a=await p.evaluate(()=>document.querySelectorAll('#txt .ln.tnow .tw.lit').length);
  await p.waitForTimeout(600);
  const b=await p.evaluate(()=>document.querySelectorAll('#txt .ln.tnow .tw.lit').length);
  eq(await now(p),'Pulanglah, pulanglah padaku','chorus lines last 4 beats (1 s): still on the first line');
  assert(a>=1&&b>a,'more words lit as the line goes on ('+a+' → '+b+')');
  eq(await p.evaluate(()=>document.querySelector('#txt .ln.tnow').textContent),'Pulanglah, pulanglah padaku','text unchanged by the word spans');
  eq(t.errors,[],'no page errors');await t.close()});

test('Tempo: the editor keeps BPM, time signature, bars and section beats; a song without a BPM scrolls as before',async()=>{
  const t=await open(),p=t.page;await song(p);
  await p.evaluate(()=>openEdit(cur));await p.waitForTimeout(200);
  eq(await p.evaluate(()=>!$('#etm').hidden),true,'tempo row is visible');
  await p.evaluate(()=>{$('#ets').value='3/4';const i=$('#ta').value.indexOf('[Interlude]')+3;$('#ta').setSelectionRange(i,i);secInfo()});
  eq(await p.evaluate(()=>!$('#sbarsw').hidden&&$('#sbpl').hidden),true,'pausing section shows bars');
  await p.evaluate(()=>{$('#sbars').value='8';$('#sbars').dispatchEvent(new Event('input'))});
  await p.evaluate(()=>{const i=$('#ta').value.indexOf('[Chorus]')+3;$('#ta').setSelectionRange(i,i);secInfo()});
  eq(await p.evaluate(()=>$('#sbarsw').hidden&&!$('#sbpl').hidden),true,'other section shows beats per line');
  await p.evaluate(()=>{$('#sbpl').value='2';$('#sbpl').dispatchEvent(new Event('change'))});
  await p.click('#eS');await p.waitForTimeout(200);
  eq(await p.evaluate(()=>{const s=songs.find(x=>x.id==='tm1');return[s.bpm,s.ts,s.tsec]}),[240,'3/4',{interlude:{bars:8},chorus:{bpl:2}}],'saved on the song');
  eq(await p.evaluate(()=>TM.bpb),3,'3/4 = 3 beats per bar');
  await p.evaluate(()=>{songs.push({id:'tm2',title:'Tanpa BPM',artist:'',lyrics:'[Verse]\nsatu\ndua',speed:5,font:30,cr:1,md:1});openSong(songs.find(s=>s.id==='tm2'))});await p.waitForTimeout(200);
  eq(await p.evaluate(()=>tmOn()),false,'no BPM: tempo mode is off');
  eq(t.errors,[],'no page errors');await t.close()});
};
