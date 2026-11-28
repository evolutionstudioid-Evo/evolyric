module.exports=({test,assert,eq,open})=>{
const LY='[Verse]\nPulang lagi\nKe rumah';
const setSong=async(p,lyrics,extra)=>{await p.evaluate(([l,x])=>{songs[0].lyrics=l;delete songs[0].chords;delete songs[0].rows;Object.assign(songs[0],x||{});save()},[lyrics,extra||null])};
test('Chords: not shown in EvoLyric and no chord editor',async()=>{
  const t=await open(),p=t.page;await setSong(p,LY,{chords:[{l:1,c:0,n:'Am'}]});
  await p.evaluate(()=>openSong(songs[0]));await p.waitForTimeout(400);
  eq(await p.evaluate(()=>document.querySelectorAll('#txt .chd').length),0,'no chord anchors in the play screen');
  await p.evaluate(()=>openEdit(songs[0]));await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[...$('#ek').options].some(o=>o.value==='__chord')),false,'no Chords option in the Key dropdown');
  eq(await p.evaluate(()=>!!document.querySelector('#chd')),false,'no chord screen');
  eq(t.errors,[],'no page errors');await t.close()});
test('Chords: kept and moved when a line is added above',async()=>{
  const t=await open(),p=t.page;await setSong(p,LY,{chords:[{l:2,c:0,n:'F'}]});
  await p.evaluate(()=>openEdit(songs[0]));await p.waitForTimeout(300);
  await p.evaluate(()=>{ta.value='[Intro]\n'+ta.value;ta.dispatchEvent(new Event('input'))});
  await p.click('#eS');await p.waitForTimeout(400);
  eq(await p.evaluate(()=>songs[0].chords),[{l:3,c:0,n:'F'}],'chord moved with its line');
  eq(t.errors,[],'no page errors');await t.close()});
test('Chords: deleting a word deletes its chord, the others move',async()=>{
  const t=await open(),p=t.page;await setSong(p,'[Verse]\npagi datang perlahan\nKe rumah',{chords:[{l:1,c:0,n:'C'},{l:1,c:6,n:'G'},{l:1,c:12,n:'Am'}]});
  await p.evaluate(()=>openEdit(songs[0]));await p.waitForTimeout(300);
  await p.evaluate(()=>{ta.value=ta.value.replace('pagi datang perlahan','pagi perlahan');ta.dispatchEvent(new Event('input'))});
  await p.click('#eS');await p.waitForTimeout(400);
  eq(await p.evaluate(()=>songs[0].chords),[{l:1,c:0,n:'C'},{l:1,c:4,n:'Am'}],'deleted word chord gone, others moved');
  eq(t.errors,[],'no page errors');await t.close()});
test('Chords: deleting a line deletes its chords; rows move with the lyrics',async()=>{
  const t=await open(),p=t.page;const rows=[{at:2,text:'|• · • · • · • ·|',ch:[{c:0,n:'G'}]}];
  await setSong(p,'satu\ndua\ntiga',{chords:[{l:1,c:0,n:'D'},{l:2,c:0,n:'E'}],rows});
  await p.evaluate(()=>openEdit(songs[0]));await p.waitForTimeout(300);
  await p.evaluate(()=>{ta.value='satu\ntiga';ta.dispatchEvent(new Event('input'))});
  await p.click('#eS');await p.waitForTimeout(400);
  eq(await p.evaluate(()=>songs[0].chords),[{l:1,c:0,n:'E'}],'chords of the deleted line gone, the other moved');
  eq(await p.evaluate(()=>songs[0].rows[0].at),1,'row moved up with the line below it');
  eq(await p.evaluate(()=>[songs[0].rows[0].text,songs[0].rows[0].ch]),[rows[0].text,rows[0].ch],'row text and chords unchanged');
  eq(t.errors,[],'no page errors');await t.close()});
};
