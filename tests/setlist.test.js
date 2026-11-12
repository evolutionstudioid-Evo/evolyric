const rows=p=>p.evaluate(()=>[...document.querySelectorAll('#slBody .arow')].map(b=>b.querySelector('.chk').textContent+'|'+b.querySelector('div').textContent+'|'+(b.disabled?'off':'on')));
const side=p=>p.evaluate(()=>[...document.querySelectorAll('#slSide .slit span')].map(e=>e.textContent));
module.exports=({test,assert,eq,open})=>{
test('Setlist: + menu offers New song, Create setlist, Import from file and Paste as new song',async()=>{
  const t=await open(),p=t.page;await p.click('#fab');await p.waitForTimeout(300);
  const items=await p.evaluate(()=>[...document.querySelectorAll('#fabm button')].map(b=>b.textContent.trim()));
  eq(items,['New song','Create setlist','Import from file','Paste as new song'],'menu');await t.close()});
test('Setlist: starts by choosing All Songs or Categories; the right-hand box is always open',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>slOpen());
  eq(await p.evaluate(()=>[...document.querySelectorAll('.slsrc b')].map(b=>b.textContent)),['All Songs','Categories'],'sources');
  assert(await p.evaluate(()=>getComputedStyle($('#slSide')).display!=='none'),'side box visible');
  await p.evaluate(()=>document.querySelectorAll('.slsrc')[0].click());assert(await p.evaluate(()=>getComputedStyle($('#slSide')).display!=='none'),'side box still visible');
  await p.evaluate(()=>{$('#slX').click();document.querySelectorAll('.slsrc')[1].click()});assert(await p.evaluate(()=>getComputedStyle($('#slSide')).display!=='none'),'visible on categories');await t.close()});
test('Setlist: tapping songs adds them in order, there is no Add button, picked songs cannot be picked twice',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{slOpen();document.querySelectorAll('.slsrc')[0].click()});
  eq(await p.evaluate(()=>[...document.querySelectorAll('#slBody button')].some(b=>b.textContent.trim()==='Add')),false,'no Add button');
  await p.evaluate(()=>{const r=[...document.querySelectorAll('#slBody .arow')];r.find(b=>b.textContent.includes('Sore')).click()});
  await p.evaluate(()=>{const r=[...document.querySelectorAll('#slBody .arow')];r.find(b=>b.textContent.includes('Pulang')).click()});
  eq(await side(p),['1. Sore di Pelabuhan','2. Pulang ke Panggung'],'order in the right box');
  const r=await rows(p);assert(r.some(x=>x.startsWith('1|Sore')&&x.endsWith('off')),'picked row is locked and numbered');await t.close()});
test('Setlist: × removes a song from the setlist without deleting it',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{slOpen();document.querySelectorAll('.slsrc')[0].click();document.querySelectorAll('#slBody .arow')[0].click();document.querySelectorAll('#slBody .arow')[1].click()});
  await p.evaluate(()=>document.querySelector('#slSide .slit button').click());
  eq((await side(p)).length,1,'one left');eq(await p.evaluate(()=>songs.length),5,'library unchanged');await t.close()});
test('Setlist: picking from a category shows that category’s songs, and Back returns to the sources',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{slOpen();document.querySelectorAll('.slsrc')[1].click()});
  eq(await p.evaluate(()=>$('#slT').textContent),'Choose a category','title');
  await p.evaluate(()=>[...document.querySelectorAll('#slBody .arow')].find(b=>b.textContent.includes('Acara Nikahan')).click());
  eq((await rows(p)).map(x=>x.split('|')[1]),['Langit Malam','Nyala Kecil'],'category songs');
  await p.evaluate(()=>$('#slX').click());eq(await p.evaluate(()=>$('#slT').textContent),'Choose a category','back to categories');
  await p.evaluate(()=>$('#slX').click());eq(await p.evaluate(()=>$('#slT').textContent),'Create setlist','back to root');await t.close()});
test('Setlist: Set opens song 1 on the lyrics screen and leaves the rest in the queue, in order',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>{slOpen();document.querySelectorAll('.slsrc')[0].click();for(const n of ['Nyala','Hujan','Langit'])[...document.querySelectorAll('#slBody .arow')].find(b=>b.textContent.includes(n)).click()});
  await p.evaluate(()=>$('#slDone').click());await p.waitForTimeout(500);
  eq(await p.evaluate(()=>cur.id),'s5','first song open');eq(await p.evaluate(()=>Qs()),['s4','s2'],'queue');
  assert(await p.evaluate(()=>$('#play').classList.contains('on')),'lyrics screen visible');await t.close()});
test('Setlist: with songs already in the queue you can replace it or add to the end',async()=>{
  for(const [btn,expect] of [['Replace the queue',['s4','s5']],['Add to the end',['s1','s2','s4','s5']]]){
    const t=await open(),p=t.page;await p.evaluate(()=>{Qs().push('s1','s2');qSave();slOpen();document.querySelectorAll('.slsrc')[0].click();for(const n of ['Sore','Hujan','Nyala'])[...document.querySelectorAll('#slBody .arow')].find(b=>b.textContent.includes(n)).click();$('#slDone').click()});
    await p.waitForTimeout(300);await p.evaluate(b=>[...document.querySelectorAll('#csheet button')].find(x=>x.textContent===b).click(),btn);await p.waitForTimeout(500);
    eq(await p.evaluate(()=>cur.id),'s3','first picked song opens ('+btn+')');eq(await p.evaluate(()=>Qs()),expect,btn);await t.close()}});
test('Setlist: the L button warns when nothing was opened, then returns to the last lyric',async()=>{
  const t=await open(),p=t.page;
  await p.click('#lastb');eq(await p.evaluate(()=>$('#note').textContent),'Select a song first','warning');
  await p.evaluate(()=>{openSong(songs[2]);leavePlay()});await p.click('#lastb');await p.waitForTimeout(400);
  eq(await p.evaluate(()=>cur.id),'s3','back to the last song');assert(await p.evaluate(()=>$('#play').classList.contains('on')),'lyrics visible');await t.close()});
test('Setlist: after the app is closed and reopened, L still opens the last lyric',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{openSong(songs[3]);leavePlay()});
  await p.reload();await p.waitForTimeout(600);
  await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem(LK)||'[]');if(!s.length){songs.length=0;songs.push({id:'s4',title:'Hujan Reda',artist:'x',lyrics:'[Verse]\nx',speed:5,font:30})}show('list')});
  await p.click('#lastb');await p.waitForTimeout(400);eq(await p.evaluate(()=>cur&&cur.id),'s4','reopened last song');await t.close()});
test('Queue: Clear queue is hidden when empty, needs two taps, and empties the whole queue (songs stay in the library)',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{openSong(songs[4]);qRender();qOpen(true)});await p.waitForTimeout(500);
  eq(await p.evaluate(()=>$('#qclr').hidden),true,'hidden when empty');
  await p.evaluate(()=>{qAdd(songs[0]);qAdd(songs[1]);qAdd(songs[2])});await p.waitForTimeout(300);
  eq(await p.evaluate(()=>$('#qclr').hidden),false,'shown with songs');
  await p.evaluate(()=>{qSongs();const q=$('#qp').getBoundingClientRect(),b=$('#qclr').getBoundingClientRect();window.__below=b.bottom<=q.bottom+1&&b.top>=$('#ql').getBoundingClientRect().bottom-1});
  eq(await p.evaluate(()=>__below),true,'button sits at the bottom of the same box');
  await p.click('#qclr');eq(await p.evaluate(()=>Qs().length),3,'first tap only arms');
  eq(await p.evaluate(()=>$('#qclr').textContent),'Tap again','armed label');
  await p.click('#qclr');await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[Qs().length,songs.length,$('#qclr').hidden]),[0,5,true],'cleared, library intact, button hidden');
  await p.evaluate(()=>{qAdd(songs[0])});await p.click('#qclr');await p.waitForTimeout(3300);
  eq(await p.evaluate(()=>[$('#qclr').textContent,Qs().length]),['Clear queue',1],'arming expires after 3 s');await t.close()});
test('Queue: Add to Queue does not add the same song twice, and removing from the queue keeps the song',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{qAdd(songs[1]);qAdd(songs[1]);qAdd(songs[2])});
  eq(await p.evaluate(()=>Qs()),['s2','s3'],'no duplicates');
  await p.evaluate(()=>{Qs().splice(0,1);qSave();qRender()});eq(await p.evaluate(()=>songs.length),5,'library unchanged');await t.close()});
};
