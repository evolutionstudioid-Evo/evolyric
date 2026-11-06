const play=async(p,id='s1')=>{await p.evaluate(i=>openSong(songs.find(s=>s.id===i)),id);await p.waitForTimeout(500)};
module.exports=({test,assert,eq,open})=>{
test('Lyrics: opening a song shows its title and one chip per section',async()=>{
  const t=await open(),p=t.page;await play(p);
  eq(await p.evaluate(()=>$('#ptit').textContent),'Pulang ke Panggung','title');
  const chips=await p.evaluate(()=>[...document.querySelectorAll('#secs .chip')].map(c=>c.textContent));
  eq(chips,['Intro','Verse 1','Chorus','Vocal 1','Harmony','Choir','Bridge','Outro'],'chips');
  assert(await p.evaluate(()=>$('#play').classList.contains('on')),'play screen visible');await t.close()});
test('Lyrics: a song always opens paused, and auto-scroll moves the lyrics once started',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>{songs.push({id:'long',title:'Panjang',artist:'x',lyrics:'[Verse]\n'+Array.from({length:60},(_,i)=>'Baris lirik nomor '+i).join('\n'),speed:30,font:30})});
  await play(p,'long');eq(await p.evaluate(()=>playing),false,'paused at open');
  await p.evaluate(()=>setPlay(true));await p.waitForTimeout(1500);
  const y=await p.evaluate(()=>$('#lyr').scrollTop);assert(y>20,'scrolled, got '+y);
  await p.evaluate(()=>setPlay(false));const y1=await p.evaluate(()=>$('#lyr').scrollTop);await p.waitForTimeout(500);
  eq(await p.evaluate(()=>$('#lyr').scrollTop),y1,'stays still when paused');await t.close()});
test('Lyrics: tapping a section chip jumps to that section and marks the chip active',async()=>{
  const t=await open(),p=t.page;await play(p);
  await p.evaluate(()=>{[...document.querySelectorAll('#secs .chip')].find(c=>c.textContent==='Bridge').click()});await p.waitForTimeout(600);
  assert(await p.evaluate(()=>$('#lyr').scrollTop)>0,'scrolled');
  eq(await p.evaluate(()=>document.querySelector('#secs .chip.on').textContent),'Bridge','active chip');await t.close()});
test('Lyrics: voice sections keep their colours (Harmony green, Choir red, Vocal 1 blue)',async()=>{
  const t=await open(),p=t.page;await play(p);
  const c=await p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#txt .sec,#txt .gtag')].map(e=>[e.textContent,getComputedStyle(e).color])));
  eq(c['Harmony'],'rgb(74, 222, 128)','Harmony');eq(c['Choir'],'rgb(255, 93, 93)','Choir');eq(c['Vocal 1'],'rgb(56, 189, 248)','Vocal 1');await t.close()});
test('Lyrics: Intro pauses the scroll by default and Keep going can be chosen per section',async()=>{
  const t=await open(),p=t.page;await play(p);
  const r=await p.evaluate(()=>({intro:stopOf(cur,'intro'),verse:stopOf(cur,'verse 1'),custom:stopOf({stops:{intro:'k'}},'intro')}));
  eq(r,{intro:true,verse:false,custom:false},'stop rules');await t.close()});
test('Lyrics: annotations are drawn on top of the lyrics and follow the text',async()=>{
  const t=await open(),p=t.page;await play(p);
  await p.evaluate(()=>{const t=document.querySelector('#txt'),le=t._le,em=cur.font,i=le.findIndex(e=>e.textContent.includes('Pulang, pulang ke panggung')),el=le[i],r=chRect(el,0),O=chOrigin(t),a=annAnchor(t,le,em,r.left-O.x,r.bottom-O.y);cur.ann=[{k:'n',...a,a:6,b:0,c:'y',w:.1}];annPlay()});
  eq(await p.evaluate(()=>document.querySelectorAll('#txt .annl svg line,#txt .annl svg path').length>0),true,'underline drawn');
  await p.evaluate(()=>{cur.font=40;$('#txt').style.fontSize='40px';annPlay()});
  eq(await p.evaluate(()=>document.querySelectorAll('#txt .annl svg').length),1,'still drawn after zoom');await t.close()});
test('Lyrics: full screen is on by default and can be turned off in Preferences',async()=>{
  const t=await open(),p=t.page;
  eq(await p.evaluate(()=>PREF.fscr),1,'default on');
  await p.evaluate(()=>{window.__fs=0;document.documentElement.requestFullscreen=()=>{window.__fs++;return Promise.resolve()}});
  await play(p);eq(await p.evaluate(()=>__fs),1,'asks for full screen by default');
  await p.evaluate(()=>{leavePlay();setFscrPref(false)});eq(await p.evaluate(()=>JSON.parse(localStorage.getItem('evo.prefs')).fscr),0,'saved');
  await p.evaluate(()=>{window.__fs=0});await play(p);eq(await p.evaluate(()=>__fs),0,'no request when off');await t.close()});
test('Lyrics: double-tap the title bar opens the editor; three taps on the lyrics, or one tap on the bar, do not',async()=>{
  const t=await open(),p=t.page;await play(p);
  const tap=(sel,dx=0)=>p.evaluate(([s,dx])=>{const el=$(s),r=el.getBoundingClientRect(),o={pointerId:5,bubbles:true,clientX:r.x+r.width/2+dx,clientY:r.y+r.height/2,pointerType:'touch',button:0};el.dispatchEvent(new PointerEvent('pointerdown',o));el.dispatchEvent(new PointerEvent('pointerup',o))},[sel,dx]);
  const view=()=>p.evaluate(()=>document.querySelector('.v.on').id);
  await tap('#lyr');await tap('#lyr');await tap('#lyr');await p.waitForTimeout(300);
  eq(await view(),'play','three taps on the lyrics: no editor');
  await tap('#ptit');await p.waitForTimeout(500);eq(await view(),'play','one tap on the title: nothing');
  await p.waitForTimeout(500);
  await tap('#ptit');await tap('#ptit',30);await p.waitForTimeout(500);
  eq(await view(),'edit','double-tap on the bar opens the editor');eq(await p.evaluate(()=>$('#et').value),'Pulang ke Panggung','editing the open song');
  await p.evaluate(()=>$('#eX').click());await p.waitForTimeout(300);
  await play(p);await tap('#dr');await tap('#dr');await p.waitForTimeout(300);
  eq(await view()==='edit',false,'double-tap on a button is not the shortcut');await t.close()});
test('Lyrics: the ⋮ menu offers Edit song, Restart and Send to friend',async()=>{
  const t=await open(),p=t.page;await play(p);
  await p.evaluate(()=>{menuOpen(true)});await p.waitForTimeout(300);
  const txt=await p.evaluate(()=>[...document.querySelectorAll('#menu button:not([hidden])')].map(b=>b.textContent));
  eq(txt,['Edit song','Restart'],'menu items while signed out (Send to friend needs an account)');await t.close()});
};
