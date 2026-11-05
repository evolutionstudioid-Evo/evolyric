module.exports=({test,assert,eq,open})=>{
test('Editor: changing title, artist and key and pressing Save updates the song',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>openEdit(songs[0]));await p.waitForTimeout(400);
  await p.fill('#et','Pulang Lagi');await p.fill('#ea','Band Baru');await p.selectOption('#ek','D');
  await p.click('#eS');await p.waitForTimeout(400);
  const s=await p.evaluate(()=>{const x=songs.find(o=>o.id==='s1');return[x.title,x.artist,x.key]});eq(s,['Pulang Lagi','Band Baru','D'],'saved fields');
  await p.evaluate(()=>{show('list');refresh()});
  eq(await p.evaluate(()=>[...document.querySelectorAll('#items .it b')].some(e=>e.textContent.includes('Pulang Lagi'))),true,'list shows new title');await t.close()});
test('Editor: a new song can be created and saved to the library',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>{fabOpen(true)});await p.click('#nw');await p.waitForTimeout(400);
  await p.fill('#et','Lagu Baru');await p.fill('#ta','[Verse]\nSatu dua tiga');await p.click('#eS');await p.waitForTimeout(400);
  eq(await p.evaluate(()=>songs.length),6,'song count');eq(await p.evaluate(()=>songs.find(s=>s.title==='Lagu Baru').lyrics),'[Verse]\nSatu dua tiga','lyrics');await t.close()});
test('Editor: the Section panel has three groups and only one is open at a time',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>openEdit(songs[0]));await p.waitForTimeout(400);
  const g=()=>p.evaluate(()=>[...document.querySelectorAll('#side .scw')].map(w=>[w.querySelector('.sch span').textContent,!w.classList.contains('shut')]));
  eq(await g(),[['Song',true],['Voicing',false],['Performance',false]],'default');
  await p.evaluate(()=>document.querySelectorAll('#side .sch')[1].click());eq(await g(),[['Song',false],['Voicing',true],['Performance',false]],'after opening Voicing');
  const names=await p.evaluate(()=>[...document.querySelectorAll('#side .scw')[1].querySelectorAll('.scg button')].map(b=>b.textContent));
  eq(names,['Vocal 1','Vocal 2','Vocal 3','Vocal 4','Vocal 5','Harmony','Choir'],'Voicing buttons');await t.close()});
test('Editor: the official section list is complete (Song, Voicing, Performance)',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>openEdit(songs[0]));await p.waitForTimeout(300);
  const all=await p.evaluate(()=>SEC_GROUPS.map(g=>[g[0],g[1]]));
  eq(all[0][1],['Intro','Verse','Pre-Chorus','Chorus','Post-Chorus','Interlude','Instrumental','Solo','Bridge','Rap','Drop','Coda','Outro'],'Song');
  eq(all[1][1],['Vocal 1','Vocal 2','Vocal 3','Vocal 4','Vocal 5','Harmony','Choir'],'Voicing');
  eq(all[2][1],['A Cappella','Sing-Along','Call & Response','Ad-Libs','Improvisation','Scat','Whistle','Scream','Whisper','Spoken','Break','Rit.','Rall.'],'Performance');await t.close()});
test('Editor: tapping a section button inserts its label into the lyrics',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>openEdit(songs[0]));await p.waitForTimeout(400);
  const before=await p.evaluate(()=>$('#ta').value);
  await p.evaluate(()=>{$('#ta').focus();$('#ta').setSelectionRange(0,0);[...document.querySelectorAll('#side .scg button')].find(b=>b.textContent==='Pre-Chorus').click()});await p.waitForTimeout(200);
  const after=await p.evaluate(()=>$('#ta').value);assert(after.includes('[Pre-Chorus]')&&after.length>before.length,'label inserted');await t.close()});
test('Editor: older markers (Sing Along, Medley, Rit, Rall) are still treated as standard sections',async()=>{
  const t=await open(),p=t.page;
  const r=await p.evaluate(()=>SEC_OLD.slice());eq(r,['Sing Along','Free Style','Medley','Rit','Rall'],'old markers kept');
  await p.evaluate(()=>{songs[0].lyrics='[Sing Along]\nla la la';save()});await p.evaluate(()=>openSong(songs[0]));await p.waitForTimeout(400);
  eq(await p.evaluate(()=>document.querySelector('#secs .chip').textContent),'Sing Along','old label still a chip');await t.close()});
test('Editor: the Section drawer button hides and shows the panel and is remembered',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>openEdit(songs[0]));await p.waitForTimeout(400);
  const hidden=()=>p.evaluate(()=>$('#edit').classList.contains('noside'));
  await p.click('#eSd');eq(await hidden(),true,'hidden');eq(await p.evaluate(()=>localStorage.getItem('evo.side')),'0','stored');
  await p.click('#eSd');eq(await hidden(),false,'shown');await t.close()});
};
