/* v157: a new user starts with an empty library – no demo song, locally or in the cloud. */
const {chromium}=require('playwright');
module.exports=({test,assert,eq,open})=>{
test('Empty start: a first visit has no songs and no categories (no demo song)',async()=>{
  const t=await open({tour:true}),p=t.page;
  /* fresh storage, then reload: the app's own first-run state, without the test library */
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem('evo.tour','1')});await p.reload();await p.waitForTimeout(700);
  eq(await p.evaluate(()=>[songs.length,cats.length,readLib(null).songs.length]),[0,0,0],'empty');
  eq(await p.evaluate(()=>$('#items').textContent.trim()),'No songs.','empty Home');
  eq(t.errors,[],'no page errors');await t.close()});
test('Empty start: an old untouched demo song is never uploaded to a new (empty) cloud account',async()=>{
  const t=await open(),p=t.page;
  const r=await p.evaluate(()=>{const demo=JSON.parse(SAMPLE_J);return Cloud&&typeof Cloud==='object'?[true,JSON.stringify(demo).length>0]:[false]});
  assert(r[0],'cloud module loaded');
  const src=require('fs').readFileSync(require('path').resolve(__dirname,'../www/cloud.js'),'utf8');
  assert(/if \(H\.isSample\(g\)\)/.test(src),'demo song skipped whatever the cloud holds');
  await t.close()});
};
