/* v179: Lite mode – a Preferences switch that turns off blur, shadows and CSS animations for low-end phones. */
module.exports=({test,assert,eq,open})=>{
test('Lite mode: off by default; the Preferences switch turns it on and off and remembers it',async()=>{
  const t=await open(),p=t.page;
  eq(await p.evaluate(()=>document.documentElement.dataset.lite||''),'','off by default');
  await p.evaluate(()=>prefOpen());await p.waitForTimeout(200);
  const row=await p.evaluateHandle(()=>[...document.querySelectorAll('#prefbody .srow')].find(r=>/Lite mode/.test(r.textContent)));
  assert(row.asElement(),'row exists');
  await row.asElement().$eval('.swt',b=>b.click());await p.waitForTimeout(100);
  eq(await p.evaluate(()=>document.documentElement.dataset.lite),'1','on');
  eq(await p.evaluate(()=>JSON.parse(localStorage.getItem('evo.prefs')).lite),1,'saved');
  await p.reload();await p.waitForTimeout(400);
  eq(await p.evaluate(()=>document.documentElement.dataset.lite),'1','still on after reload');
  eq(await p.evaluate(()=>getComputedStyle($('#drawer')).backdropFilter),'none','no blur on the side panel');
  await p.evaluate(()=>prefOpen());await p.waitForTimeout(200);
  const row2=await p.evaluateHandle(()=>[...document.querySelectorAll('#prefbody .srow')].find(r=>/Lite mode/.test(r.textContent)));
  await row2.asElement().$eval('.swt',b=>b.click());await p.waitForTimeout(100);
  eq(await p.evaluate(()=>document.documentElement.dataset.lite||''),'','off again');
  eq(t.errors,[],'no page errors');await t.close()});
test('Lite mode: the switch is translated in Indonesian',async()=>{
  const t=await open({lang:'id'}),p=t.page;await p.evaluate(()=>prefOpen());await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#prefbody .srow .lbl')].some(l=>/^Mode hemat/.test(l.textContent))),true,'Mode hemat');await t.close()});
};
