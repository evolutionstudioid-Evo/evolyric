/* v160: guest mode (no sign-in needed) and the Privacy Policy / Terms of Service pages. */
const {execFileSync}=require('child_process'),path=require('path');
module.exports=({test,assert,eq,open})=>{
test('Guest: the first screen offers Continue as guest; the app then works without signing in and remembers it',async()=>{
  const t=await open({tour:true}),p=t.page;
  await p.evaluate(()=>{localStorage.removeItem('evolyric-guest');localStorage.setItem('evo.tour','1');showWelcome(1)});await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[$('#welcome').classList.contains('on'),$('#wguest').textContent,!!$('#wstep1 .lg-t'),!!$('#wstep1 .lg-p')]),[true,'Continue as guest',true,true],'welcome: guest button + Terms / Privacy links');
  await p.click('#wguest');await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[$('#list').classList.contains('on'),isGuest(),user,$('#auth').textContent]),[true,true,null,'Sign In'],'Home as guest, Sign In stays at the top');
  /* gate does not send a guest back to the welcome screen */
  await p.evaluate(()=>gateCheck());await p.waitForTimeout(100);eq(await p.evaluate(()=>$('#list').classList.contains('on')),true,'stays on Home');
  /* a guest can still save songs (on this device) */
  await p.evaluate(()=>{songs.push({id:'g1',title:'Lagu Tamu',artist:'',lyrics:'a',speed:5,font:30,cr:1,md:1});save()});
  eq(await p.evaluate(()=>JSON.parse(localStorage.getItem('evolyric-v1')).some(x=>x.id==='g1')),true,'saved on the device');
  /* reload: still a guest, no welcome screen */
  await p.reload();await p.waitForTimeout(900);
  eq(await p.evaluate(()=>[isGuest(),$('#welcome').classList.contains('on')]),[true,false],'remembered after reload');
  eq(t.errors,[],'no page errors');await t.close()});
test('Guest: signing in ends guest mode; Backup & restore is in Preferences for guests',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{setGuest(true);prefOpen()});await p.waitForTimeout(200);
  assert(await p.evaluate(()=>[...document.querySelectorAll('#prefbody .srow')].some(r=>/Backup & restore/.test(r.textContent))),'guest sees Backup & restore in Preferences');
  await p.evaluate(()=>{applyUser({id:'u1',email:'r@e.x',user_metadata:{full_name:'Rani'}})});
  eq(await p.evaluate(()=>isGuest()),false,'guest flag cleared on sign-in');
  await p.evaluate(()=>prefRender());eq(await p.evaluate(()=>[...document.querySelectorAll('#prefbody .srow')].some(r=>/Backup & restore/.test(r.textContent))),false,'signed in: it lives in Account Settings');
  await t.close()});
test('Legal: Help has Privacy Policy and Terms of Service, in the app language',async()=>{
  for(const [lang,pp,tos,h2] of [['en','Privacy Policy','Terms of Service','1. Introduction'],['id','Kebijakan Privasi','Ketentuan Penggunaan','1. Pendahuluan']]){
    const t=await open({lang}),p=t.page;await p.evaluate(()=>helpOpen());await p.waitForTimeout(200);
    await p.click('#helpbody .srow:has-text("'+pp+'")');await p.waitForTimeout(300);
    eq(await p.evaluate(()=>[$('#doctitle').textContent,$('#docbody h2').textContent]),[pp,h2],lang+' privacy');
    assert(/Tokyo/.test(await p.evaluate(()=>$('#docbody').textContent)),'mentions the Supabase region');
    await p.click('#dcX');await p.waitForTimeout(200);await p.click('#helpbody .srow:has-text("'+tos+'")');await p.waitForTimeout(300);
    eq(await p.evaluate(()=>$('#doctitle').textContent),tos,lang+' terms');
    assert(/20/.test(await p.evaluate(()=>$('#docbody').textContent)),'daily limits written down');await t.close()}});
test('Legal: the links under Continue with Google open the documents and come back',async()=>{
  const t=await open({tour:true}),p=t.page;await p.evaluate(()=>showWelcome(1));await p.waitForTimeout(150);
  await p.click('#wstep1 .lg-p');await p.waitForTimeout(250);eq(await p.evaluate(()=>[$('#doc').classList.contains('on'),$('#doctitle').textContent]),[true,'Privacy Policy'],'opened');
  await p.click('#dcX');await p.waitForTimeout(200);eq(await p.evaluate(()=>$('#welcome').classList.contains('on')),true,'back to the welcome screen');
  await p.evaluate(()=>openAuth());await p.click('#authbox .lg-t');await p.waitForTimeout(250);
  eq(await p.evaluate(()=>[$('#doctitle').textContent,$('#authbox').classList.contains('on')]),['Terms of Service',false],'from the sign-in card');await t.close()});
test('Legal: www/legal.js, privacy.html and terms.html are up to date with docs/legal/*.md',async()=>{
  const out=execFileSync('node',[path.resolve(__dirname,'../tools/legal-build.js'),'--check'],{encoding:'utf8'});assert(/up to date/.test(out),out)});
};
