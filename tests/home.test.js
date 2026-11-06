module.exports=({test,assert,eq,open})=>{
test('Home: starts without JavaScript errors and lists the songs',async()=>{
  const t=await open();const n=await t.page.evaluate(()=>document.querySelectorAll('#items .it').length);
  eq(n,5,'song rows');eq(t.errors,[],'page errors');await t.close()});
test('Home: search filters by title and by artist, and clearing restores the list',async()=>{
  const t=await open(),p=t.page,rows=()=>p.evaluate(()=>[...document.querySelectorAll('#items .it b')].map(e=>e.textContent.replace(/\s*[A-G][b#]?$/,'')));
  await p.fill('#q','hujan');eq((await rows()).length,1,'title match');
  await p.fill('#q','duo akustik');eq((await rows()).length,2,'artist match');
  await p.fill('#q','');eq((await rows()).length,5,'cleared');await t.close()});
test('Home: sorting A–Z, newest and oldest changes the order',async()=>{
  const t=await open(),p=t.page,first=()=>p.evaluate(()=>document.querySelector('#items .it b').textContent);
  await p.evaluate(()=>{sortBy='az';refresh()});const az=await first();
  await p.evaluate(()=>{sortBy='new';refresh()});const nw=await first();
  await p.evaluate(()=>{sortBy='old';refresh()});const old=await first();
  assert(/Hujan|Langit/.test(az),'A–Z starts with H or L, got '+az);assert(nw!==old,'newest and oldest differ');await t.close()});
test('Home: compact list toggles, is remembered after a reload',async()=>{
  const t=await open(),p=t.page;
  await p.click('#hView');assert(await p.evaluate(()=>$('#items').classList.contains('cmp')),'compact on');
  const stored=await p.evaluate(()=>localStorage.getItem('evolyric-homeview'));eq(stored,'compact','stored');
  await p.reload();await p.waitForFunction(()=>typeof songs!=='undefined');await p.waitForTimeout(900);await p.evaluate(()=>{show('list');refresh()});
  const dbg=await p.evaluate(()=>[$('#items').className,localStorage.getItem('evolyric-homeview'),location.href]);assert(dbg[0].includes('cmp'),'compact remembered '+JSON.stringify(dbg));
  await p.click('#hView');assert(!(await p.evaluate(()=>$('#items').classList.contains('cmp'))),'wide again');await t.close()});
test('Home: the Categories tab hides the compact button, All Songs shows it',async()=>{
  const t=await open(),p=t.page;
  await p.click('#tabs [data-v=cats]');assert(await p.evaluate(()=>$('#hView').hidden),'hidden on Categories');
  await p.click('#tabs [data-v=all]');assert(!(await p.evaluate(()=>$('#hView').hidden)),'visible on All Songs');await t.close()});
test('Home: Recent lists songs in the order they were opened',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>{openSong(songs[1]);leavePlay();openSong(songs[3]);leavePlay()});
  await p.click('#tabs [data-v=recent]');
  const r=await p.evaluate(()=>[...document.querySelectorAll('#items .it b')].map(e=>e.textContent.replace(/\s*[A-G][b#]?$/,'').trim()));
  eq(r,['Hujan Reda','Langit Malam'],'recent order');await t.close()});
test('Home: search puts titles that start with the letters first, not alphabetical matches from the artist',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>{songs.push({id:'z1',title:'Aku Takut',artist:'Lala Band',lyrics:'x',speed:5,font:30},{id:'z2',title:'Laut Kidul',artist:'Zed',lyrics:'x',speed:5,font:30},{id:'z3',title:'Di Tepi Laut',artist:'Budi',lyrics:'x',speed:5,font:30});refresh()});
  await p.fill('#q','l');await p.waitForTimeout(250);
  const r=await p.evaluate(()=>[...document.querySelectorAll('#items .it b')].map(e=>e.textContent.replace(/\s*[A-G][b#]?$/,'').trim()));
  eq(r.slice(0,4),['Langit Malam','Laut Kidul','Di Tepi Laut','Aku Takut'],'ranking: '+r.join(' | '));await t.close()});
test('Home: quiet confirmations stay hidden, errors still show',async()=>{
  const t=await open(),p=t.page,vis=()=>p.evaluate(()=>$('#note').classList.contains('on')&&$('#note').textContent);
  await p.evaluate(()=>note('Added to queue'));eq(await vis(),false,'routine note hidden');
  await p.evaluate(()=>note('Library is empty',true));eq(await vis(),'Library is empty','error visible');await t.close()});
test('Home: a swipe over a song never opens its menu; holding still does',async()=>{
  const t=await open({device:'Pixel 5'}),p=t.page;
  await p.evaluate(()=>{for(let i=6;i<=40;i++)songs.push({id:'x'+i,title:'Lagu '+i,artist:'A',lyrics:'x',speed:5,font:30});refresh()});
  const cdp=await t.ctx.newCDPSession(p),open_=()=>p.evaluate(()=>$('#ctx').classList.contains('on'));
  const r=await p.evaluate(()=>{const e=document.querySelectorAll('#items .it')[3].getBoundingClientRect();return[e.x+80,e.y+e.height/2]});
  let seen=false;const tch=async(pts,hold)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pts[0]]});for(const q of pts.slice(1)){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[q]});await p.waitForTimeout(40)}await p.waitForTimeout(hold);seen=await open_();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})};
  await tch([{x:r[0],y:r[1]},{x:r[0],y:r[1]-40},{x:r[0],y:r[1]-120},{x:r[0],y:r[1]-200}],900);eq(seen,false,'menu after swipe');
  await p.waitForTimeout(1200);const r2=await p.evaluate(()=>{const e=document.querySelectorAll('#items .it')[3].getBoundingClientRect();return[e.x+80,e.y+e.height/2]});
  await tch([{x:r2[0],y:r2[1]}],900);eq(seen,true,'menu after long press');await t.close()});
};
