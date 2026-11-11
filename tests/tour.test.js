/* v148: interactive tour – first run for new users, from Help any time, never changes the library. */
const signIn=p=>p.evaluate(()=>{user={id:'u',name:'Rani Putri',email:'rani@example.com',username:'rani'};renderAuth();localStorage.removeItem('evo.tour');show('list')});
const libState=p=>p.evaluate(()=>({songs:JSON.stringify(songs),cats:JSON.stringify(cats),store:localStorage.getItem('evolyric-v1'),recent:localStorage.getItem('evolyric-recent-v1'),last:localStorage.getItem('evo.lastsong'),queue:[...queue]}));
const view=p=>p.evaluate(()=>(document.querySelector('.v.on')||{}).id);
module.exports=({test,assert,eq,open})=>{
test('Tour: starts by itself once for a new user (empty library) and walks Home → Editor → Lyrics → Home without saving anything',async()=>{
  const t=await open({tour:true,seed:{songs:[],cats:[]}}),p=t.page;await signIn(p);await p.waitForTimeout(1700);
  assert(await p.$('#tour'),'tour opened on its own');
  eq(await p.evaluate(()=>localStorage.getItem('evo.tour')),'1','marked as seen at once');
  const before=await libState(p),seen=[];
  for(let k=0;k<16;k++){await p.waitForTimeout(480);
    seen.push([await view(p),await p.$eval('#tour h4',e=>e.textContent),await p.$eval('#tour .tsp',e=>!e.classList.contains('none'))]);
    await p.click('#tour .tnx')}
  await p.waitForTimeout(500);
  eq(seen.map(s=>s[0]),['list','list','list','edit','edit','edit','edit','play','play','play','play','play','play','play','play','list'],'screens in order');
  assert(seen.slice(1).every(s=>s[2]),'every step after the welcome card has a spotlight');
  eq(seen[1][1],'Add a song','English text');
  eq(await p.evaluate(()=>[!!document.querySelector('#tour'),document.body.classList.contains('touring'),cur]),[false,false,null],'closed, nothing open');
  eq(await libState(p),before,'library, Recent, last lyric and queue unchanged');
  /* it does not come back by itself */
  await p.evaluate(()=>show('list'));await p.waitForTimeout(1500);
  eq(await p.$('#tour'),null,'shown once');
  eq(t.errors,[],'no page errors');await t.close()});
test('Tour: Auto Section labels the demo song in the editor, and the lyrics screen shows those sections',async()=>{
  const t=await open({tour:true}),p=t.page;await p.evaluate(()=>tourStart());
  for(let k=0;k<6;k++){await p.waitForTimeout(450);await p.click('#tour .tnx')}
  await p.waitForTimeout(500);
  assert(await p.evaluate(()=>/^\[Chorus\]$/m.test(ta.value)&&/^\[Bridge\]$/m.test(ta.value)),'labels added in the editor');
  await p.click('#tour .tnx');await p.waitForTimeout(700);
  eq(await p.evaluate(()=>[isTemp(cur),$('#tsv').offsetParent===null]),[true,true],'temporary demo song, Save button hidden during the tour');
  assert((await p.evaluate(()=>[...document.querySelectorAll('#secs .chip')].map(c=>c.textContent))).includes('Bridge'),'section chips');
  eq(t.errors,[],'no page errors');await t.close()});
test('Tour: an existing user with songs is not interrupted',async()=>{
  const t=await open({tour:true}),p=t.page;await signIn(p);await p.waitForTimeout(1700);
  eq(await p.$('#tour'),null,'no tour');eq(await p.evaluate(()=>localStorage.getItem('evo.tour')),'0','remembered');await t.close()});
test('Tour: Help → Interactive tour; Skip in the editor or Back across screens leaves the library untouched',async()=>{
  const t=await open({tour:true,lang:'id'}),p=t.page;const before=await libState(p);
  await p.evaluate(()=>helpOpen());await p.waitForTimeout(300);
  const row=await p.evaluateHandle(()=>[...document.querySelectorAll('#helpbody .srow')].find(r=>/Tur interaktif/.test(r.textContent)));
  assert(row.asElement(),'Help has the tour row');await row.asElement().click();await p.waitForTimeout(600);
  eq([await view(p),await p.$eval('#tour h4',e=>e.textContent)],['list','Selamat datang di EvoLyric'],'starts on Home, in Indonesian');
  for(let k=0;k<8;k++){await p.waitForTimeout(450);await p.click('#tour .tnx')}
  await p.waitForTimeout(600);eq(await view(p),'play','on the lyrics screen');
  await p.click('#tour .tbk');await p.waitForTimeout(700);eq(await view(p),'play','back inside the lyrics part');
  await p.click('#tour .tbk');await p.waitForTimeout(700);eq(await view(p),'edit','back to the editor');
  assert(await p.evaluate(()=>/^\[Chorus\]$/m.test(ta.value)),'labels kept when going back');
  await p.click('#tour .tsk');await p.waitForTimeout(500);
  eq([await view(p),await p.$('#tour'),await p.evaluate(()=>cur)],['list',null,null],'Skip closes the editor without asking');
  eq(await libState(p),before,'library unchanged');
  eq(t.errors,[],'no page errors');await t.close()});
};
