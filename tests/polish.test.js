/* v152: final polish – fixes found in the UI audit and small additions. */
module.exports=({test,assert,eq,open})=>{
test('Polish: text box hints and labels are translated in Indonesian (they were skipped before)',async()=>{
  const t=await open({lang:'id'}),p=t.page;
  eq(await p.evaluate(()=>[$('#nbtx').placeholder,$('#nbtx').getAttribute('aria-label'),$('#ta').getAttribute('aria-label')]),['mis. Drum berhenti di sini','Teks catatan','Lirik'],'note box and lyrics box');
  /* what is typed in a text box is never translated */
  await p.evaluate(()=>{$('#nbtx').value='Note text';$('#nbtx').textContent='Note text'});await p.waitForTimeout(100);
  eq(await p.evaluate(()=>$('#nbtx').value),'Note text','typed text untouched');await t.close()});
test('Polish: the setlist search box looks like the other search boxes',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>slOpen());await p.click('#slBody button >> nth=0');await p.waitForTimeout(300);
  const a=await p.evaluate(()=>{const c=getComputedStyle(document.querySelector('.slbar input')),h=getComputedStyle($('#q'));return[c.borderRadius===h.borderRadius,c.backgroundColor===h.backgroundColor,c.paddingTop]});
  eq(a,[true,true,'12px'],'same radius, background and padding');await t.close()});
test('Polish: no tempo credit on the sign-in card while tempo is not in use',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>openAuth());await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#authbox p')].some(e=>e.offsetParent&&/GetSongBPM/.test(e.textContent))),false,'hidden');await t.close()});
test('Polish: no Library match offers “Search the internet”, which runs the globe search for what was typed',async()=>{
  const t=await open(),p=t.page;
  await p.fill('#q','pulang');await p.waitForTimeout(200);eq(await p.$('#items .ewb'),null,'not shown when songs match');
  await p.fill('#q','lagu baru sekali');await p.waitForTimeout(200);
  eq(await p.$eval('#items .ewb',e=>[e.querySelector('b').textContent,e.querySelector('small').textContent]),['Search the internet','lagu baru sekali'],'offered with the query');
  await p.evaluate(()=>{window.__wl=null;const o=wlGo;wlGo=(q,b)=>{window.__wl=q}});await p.click('#items .ewb');
  eq(await p.evaluate(()=>window.__wl),'lagu baru sekali','globe search started');
  await p.evaluate(()=>{lib.v='cats';refresh()});eq(await p.$('#items .ewb'),null,'only in All Songs');await t.close()});
test('Polish: switching tab plays the list entrance once; switches have a name for screen readers',async()=>{
  const t=await open(),p=t.page;await p.click('#tabs [data-v=cats]');
  eq(await p.evaluate(()=>$('#items').classList.contains('lin')),true,'entrance on');await p.waitForTimeout(1000);
  eq(await p.evaluate(()=>$('#items').classList.contains('lin')),false,'and off again');
  await p.evaluate(()=>prefOpen());await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#prefbody .swt')].every(b=>b.getAttribute('aria-label'))),true,'every switch labelled');
  eq(t.errors,[],'no page errors');await t.close()});
};
