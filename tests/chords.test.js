module.exports=({test,assert,eq,open})=>{
const LY='[Verse]\nPulang lagi\nKe rumah';
const prep=async p=>{await p.evaluate(l=>{songs[0].lyrics=l;delete songs[0].chords;save();CHORD_ON=true;chordUi()},LY)};
const key=(p,k)=>p.click('#chkb [data-k="'+k+'"]'),act=(p,a)=>p.click('#chkb [data-a="'+a+'"]');
test('Chords: the chord button is hidden until the secret is turned on',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>openEdit(songs[0]));await p.waitForTimeout(300);
  eq(await p.evaluate(()=>$('#eCh').hidden),true,'hidden by default');
  await p.evaluate(()=>{CHORD_ON=true;chordUi()});eq(await p.evaluate(()=>$('#eCh').hidden),false,'shown when on');
  eq(t.errors,[],'no page errors');await t.close()});
test('Chords: one box per 2 characters, typed with the chord keyboard, saved on the song',async()=>{
  const t=await open(),p=t.page;await prep(p);await p.evaluate(()=>openEdit(songs[0]));await p.waitForTimeout(300);
  await p.click('#eCh');await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#chtx .chrow')].map(r=>r.querySelectorAll('.chc').length)),[6,4],'boxes per line');
  await p.click('#chtx .chc >> nth=0');
  eq(await p.evaluate(()=>$('#chkb [data-k="#"]').disabled),true,'# needs a root first');
  await key(p,'C');await key(p,'#');await key(p,'m');await key(p,'7');
  eq(await p.evaluate(()=>document.querySelectorAll('#chtx .chn')[0].textContent),'C#m7','first box');
  eq(await p.evaluate(()=>$('#chkb [data-k="m"]').disabled),true,'m only right after the root');
  await act(p,'next');await key(p,'G');await key(p,'/');await key(p,'B');
  await act(p,'bs');await key(p,'D');
  await p.click('#chOK');await p.waitForTimeout(200);await p.click('#eS');await p.waitForTimeout(400);
  eq(await p.evaluate(()=>songs.find(s=>s.id==='s1').chords),[{l:1,c:0,n:'C#m7'},{l:1,c:2,n:'G/D'}],'saved chords');
  eq(t.errors,[],'no page errors');await t.close()});
test('Chords: shown above the lyrics in the play screen without changing the text',async()=>{
  const t=await open(),p=t.page;await prep(p);
  await p.evaluate(()=>{songs[0].chords=[{l:1,c:0,n:'Am'},{l:2,c:4,n:'F'}];save();openSong(songs[0])});await p.waitForTimeout(500);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#txt .chd')].map(e=>e.dataset.c)),['Am','F'],'anchors');
  eq(await p.evaluate(()=>[...document.querySelectorAll('#txt .ln.hasch')].map(e=>e.textContent)),['Pulang lagi','Ke rumah'],'text unchanged');
  await p.evaluate(()=>{CHORD_ON=false;render()});eq(await p.evaluate(()=>document.querySelectorAll('#txt .chd').length),0,'hidden when the secret is off');
  eq(t.errors,[],'no page errors');await t.close()});
test('Chords: stay on their line when lines are added above, and Cancel asks before losing changes',async()=>{
  const t=await open(),p=t.page;await prep(p);
  await p.evaluate(()=>{songs[0].chords=[{l:2,c:0,n:'F'}];save();openEdit(songs[0])});await p.waitForTimeout(300);
  await p.evaluate(()=>{ta.value='[Intro]\n'+ta.value;ta.dispatchEvent(new Event('input'))});
  await p.click('#eCh');await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#chtx .chn')].filter(e=>e.textContent).map(e=>e.textContent)),['F'],'chord kept');
  await p.click('#chtx .chc >> nth=0');await key(p,'E');await p.click('#chX');await p.waitForTimeout(200);
  eq(await p.evaluate(()=>$('#chd').classList.contains('on')),true,'still open: a confirm is shown');
  await t.close()});
};
