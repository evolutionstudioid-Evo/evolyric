/* v172 logo surprise: Home only, animations restore the title, rare golden one guaranteed by 80, tips cycle, 5 quick taps = stage lights */
module.exports=({test,assert,eq,open})=>{
test('Logo surprise: a tap on Home animates or shows a tip; nothing in the lyrics view; the title is always restored',async()=>{
  const t=await open({lang:'id'}),p=t.page;const html=await p.evaluate(()=>$('#list .hd h1').innerHTML);
  await p.click('#list .hd h1');await p.waitForTimeout(150);
  eq(await p.evaluate(()=>JSON.parse(localStorage.getItem('evo.egg')).a),1,'first tap is an animation');
  await p.waitForTimeout(2600);
  for(const k of ['collapse','wave','eq','spin','hop','stretch','fly','jelly','flip'])await p.evaluate(k=>Promise.resolve(EGG_ANIM[k]($('#list .hd svg.lg'))),k);
  eq(await p.evaluate(()=>$('#list .hd h1').innerHTML),html,'title and logo restored after every animation');
  await p.evaluate(()=>{localStorage.setItem('evo.egg',JSON.stringify({n:5,a:5,since:79}));Math.random=()=>.99});
  await p.click('#list .hd h1');await p.waitForTimeout(200);
  const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('evo.egg')));eq([st.since,st.gold],[0,1],'golden one guaranteed at the 80th animation');
  assert(/Langka/.test(await p.evaluate(()=>$('.eggtip').textContent)),'golden message');await p.waitForTimeout(3200);
  eq(await p.evaluate(()=>$('#list .hd h1').innerHTML),html,'restored after the golden one');
  await p.evaluate(()=>openSong(songs[0]));await p.waitForTimeout(300);const n0=await p.evaluate(()=>JSON.parse(localStorage.getItem('evo.egg')).n);
  await p.evaluate(()=>eggTap());eq(await p.evaluate(()=>JSON.parse(localStorage.getItem('evo.egg')).n),n0,'ignored outside Home');eq(t.errors,[],'no page errors');await t.close()});
test('Logo surprise: tips are real Indonesian/English sentences and do not repeat until all were shown; five quick taps sweep the stage lights',async()=>{
  const t=await open({lang:'id'}),p=t.page;
  const seen=await p.evaluate(()=>{const s=[];for(let i=0;i<EGG_TIPS.length;i++)s.push(L(...eggNextTip()));return s});
  eq(new Set(seen).size,seen.length,'no repeats in one round');assert(seen.every(x=>!/[A-Z][a-z]+ the /.test(x)),'Indonesian text');
  await p.evaluate(()=>{eggTip(L(...eggNextTip()))});assert(/Tahu nggak\?/.test(await p.evaluate(()=>$('.eggtip').textContent)),'tip bubble');
  await p.evaluate(()=>document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));await p.waitForTimeout(300);eq(await p.evaluate(()=>!!document.querySelector('.eggtip')),false,'a tap elsewhere closes it');
  for(let i=0;i<5;i++)await p.click('#list .hd h1');await p.waitForTimeout(200);eq(await p.evaluate(()=>!!document.querySelector('.eggbeams')),true,'stage lights');
  await p.waitForTimeout(2100);eq(await p.evaluate(()=>!!document.querySelector('.eggbeams')),false,'gone afterwards');await t.close()});
};
