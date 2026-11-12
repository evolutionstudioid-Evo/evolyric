/* v161: evolyric.com – the old workers.dev address shows how to move; the new one does not. */
module.exports=({test,assert,eq,open})=>{
test('Domain: no move notice on the new address',async()=>{
  const t=await open(),p=t.page;await p.waitForTimeout(800);eq(await p.$('#moved'),null,'not shown');await t.close()});
test('Domain: on the old address a guest gets Open evolyric.com + Backup; a signed-in user is told to sign in there',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>{window.__evoOldHost=true;movedRefresh()});
  eq(await p.evaluate(()=>[$('#moved b').textContent,$('#moved a').href,[...document.querySelectorAll('#moved button')].map(b=>b.textContent)]),['EvoLyric has moved to evolyric.com','https://evolyric.com/',['Backup']],'guest');
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#moved button')]);assert(/\.evolyric$/.test(dl.suggestedFilename()),'backup file');
  await p.evaluate(()=>{applyUser({id:'u1',email:'r@e.x',user_metadata:{full_name:'Rani'}})});
  eq(await p.evaluate(()=>[/same Google account/.test($('#moved').textContent),document.querySelectorAll('#moved button').length]),[true,0],'signed in: no backup needed');
  await t.close()});
test('Domain: wrangler keeps evolyric.com, www and the old workers.dev address',async()=>{
  const w=require('fs').readFileSync(require('path').resolve(__dirname,'../wrangler.jsonc'),'utf8');
  assert(/"workers_dev": true/.test(w)&&/"pattern": "evolyric.com", "custom_domain": true/.test(w)&&/"pattern": "www.evolyric.com"/.test(w),'routes')});
};
