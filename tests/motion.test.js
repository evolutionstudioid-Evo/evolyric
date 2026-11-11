/* v153: motion – page transitions by direction, L flash, only the active section chip in full colour. */
module.exports=({test,assert,eq,open})=>{
test('Motion: Home → Lyrics rises, Lyrics → Editor slides forward, back slides from the left',async()=>{
  const t=await open(),p=t.page;const tr=id=>p.evaluate(i=>[document.getElementById(i).dataset.tr,getComputedStyle(document.getElementById(i)).animationName],id);
  await p.evaluate(()=>openSong(songs[0]));eq(await tr('play'),['up','vUp'],'lyrics rise');
  await p.evaluate(()=>openEdit(cur));eq(await tr('edit'),['fwd','vFwd'],'editor forward');
  await p.evaluate(()=>{$('#eX').onclick()});eq(await tr('play'),['back','vBack'],'back to lyrics');
  await p.evaluate(()=>leavePlay());eq(await tr('list'),['back','vBack'],'back to Home');
  await p.evaluate(()=>prefOpen());eq(await tr('prefs'),['fwd','vFwd'],'settings forward');
  await p.waitForTimeout(300);eq(t.errors,[],'no page errors');await t.close()});
test('Motion: the L button flashes while it opens the last lyrics; nothing flashes when there is no song',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>openSong(songs[1]));await p.waitForTimeout(300);await p.evaluate(()=>leavePlay());await p.waitForTimeout(300);
  await p.click('#lastb');
  eq(await p.evaluate(()=>[!!document.querySelector('.lfx'),$('#lastb').classList.contains('fl'),$('#play').classList.contains('on'),cur.id]),[true,true,true,'s2'],'burst + lyrics open');
  await p.waitForTimeout(700);eq(await p.evaluate(()=>!!document.querySelector('.lfx')),false,'burst cleaned up');
  await t.close()});
test('Motion: only the active section chip is in full colour, the others are dimmed',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>openSong(songs[0]));await p.waitForTimeout(600);
  const c=await p.evaluate(()=>[...document.querySelectorAll('#secs .chip')].map(e=>[e.classList.contains('on'),+getComputedStyle(e).opacity]));
  eq(c.filter(x=>x[0]).length,1,'one active');assert(c.every(([on,o])=>on?o===1:o<.5),'others dimmed: '+JSON.stringify(c));
  await p.click('#secs .chip >> nth=2');await p.waitForTimeout(500);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#secs .chip')].findIndex(e=>e.classList.contains('on'))),2,'tapped chip becomes the bright one');
  await t.close()});
};
