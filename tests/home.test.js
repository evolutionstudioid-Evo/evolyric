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
test('Home: search priority is title word 1, 2, 3+, then artist word 1, 2, 3+, then the middle of a word',async()=>{
  const t=await open(),p=t.page,S=(id,ti,ar)=>({id,title:ti,artist:ar,lyrics:'x',speed:5,font:30});
  await p.evaluate(a=>{songs.length=0;a.forEach(x=>songs.push(x));cats.length=0;refresh()},[
    S('a1','Zebra Kuning Lagu','Q'),S('a2','Zebra Lagu','Q'),S('a3','Lagu Zebra','Q'),S('a4','Kc','Lara'),S('a5','Kb','Budi Lani'),S('a6','Ka','Ani Budi Lola'),S('a7','Pulau','Sal'),S('a8','Aku Takut','Cinta')]);
  await p.fill('#q','l');await p.waitForTimeout(250);
  const ids=await p.evaluate(()=>[...document.querySelectorAll('#items .it')].map(b=>b.querySelector('b span,b').textContent.trim()));
  eq(ids.slice(0,3),['Lagu Zebra','Zebra Lagu','Zebra Kuning Lagu'],'title: word 1, 2, 3+: '+ids.join(' | '));
  eq(ids.slice(3,6),['Kc','Kb','Ka'],'artist: word 1, 2, 3+ (titles are in reverse A–Z): '+ids.join(' | '));
  eq(ids.includes('Aku Takut'),false,'no L at all in Aku Takut / Cinta');
  eq(ids[6]==='Pulau',true,'middle-of-word match is last');await t.close()});
test('Stability: redrawing the list never adds scroll listeners, and scrolling stays cheap',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>{window.__n=0;const o=window.addEventListener;window.addEventListener=function(a,...r){if(a==='scroll')__n++;return o.call(this,a,...r)};for(let i=6;i<=100;i++)songs.push({id:'x'+i,title:'Lagu '+i,artist:'A',lyrics:'x',speed:5,font:30})});
  await p.evaluate(()=>{for(let i=0;i<200;i++)refresh()});
  eq(await p.evaluate(()=>__n),0,'scroll listeners added by 200 redraws');
  const ms=await p.evaluate(()=>{const t0=performance.now();for(let i=0;i<50;i++)document.dispatchEvent(new Event('scroll'));return(performance.now()-t0)/50});
  assert(ms<2,'a scroll event took '+ms.toFixed(2)+' ms');await t.close()});
test('Stability: a touch left half-finished is forgotten when the app is hidden or a song is opened',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>{PT.set(77,{x:1,y:1});G={x:1,y:1,t:0,mv:0};spDown=1;const f=document.createElement('div');f.className='qfly';document.body.append(f);document.dispatchEvent(new Event('visibilitychange'))});
  eq(await p.evaluate(()=>[PT.size,G,spDown,document.querySelectorAll('.qfly').length]),[0,null,0,0],'after hide/show');
  await p.evaluate(()=>{PT.set(78,{x:1,y:1});openSong(songs[0])});await p.waitForTimeout(400);
  eq(await p.evaluate(()=>PT.size),0,'after opening a song');await t.close()});
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
