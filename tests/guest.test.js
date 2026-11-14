/* v160: guest mode (no sign-in needed) and the Privacy Policy / Terms of Service pages. */
const {execFileSync}=require('child_process'),path=require('path');
module.exports=({test,assert,eq,open})=>{
test('Guest: the first screen offers Continue as guest; the app then works without signing in and remembers it',async()=>{
  const t=await open({tour:true}),p=t.page;
  await p.evaluate(()=>{localStorage.removeItem('evolyric-guest');localStorage.setItem('evo.tour','1');showWelcome(1)});await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[$('#welcome').classList.contains('on'),$('#wguest').textContent,!!$('#wstep1 .lg-t'),!!$('#wstep1 .lg-p')]),[true,'Continue as guest',true,true],'welcome: guest button + Terms / Privacy links');
  await p.click('#wguest');await p.waitForTimeout(100);eq(await p.evaluate(()=>$('#pwabox').classList.contains('on')),true,'install choice appears before guest mode');
  await p.click('#pwaNo');await p.waitForTimeout(300);
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
test('PWA install: the welcome choices wait for YES or NO; dismissal is remembered but manual install stays available',async()=>{
  const t=await open({tour:true}),p=t.page;
  /* config.js carries the real Supabase keys, so stub the OAuth call: the test must never leave the page */
  await p.evaluate(()=>{window.__oauth=0;ensureClient=async()=>{};sb={auth:{signInWithOAuth:async()=>{window.__oauth++;return{error:null}}}};localStorage.removeItem('evolyric-pwa-install-declined');localStorage.removeItem('evolyric-guest');showWelcome(1)});
  await p.click('#wgbtn');await p.waitForTimeout(100);
  eq(await p.evaluate(()=>[$('#pwabox').classList.contains('on'),$('#wstep1').hidden,$('#werr').textContent]),[true,false,''],'Google has not started while the install choice is open');
  await p.click('#pwaNo');await p.waitForTimeout(100);
  eq(await p.evaluate(()=>[+localStorage.getItem('evolyric-pwa-install-declined')>1,$('#pwabox').classList.contains('on'),window.__oauth,$('#werr').textContent]),[true,false,1,''],'NO resumes the original Google path and remembers the choice');
  await p.evaluate(()=>{localStorage.setItem('evolyric-pwa-install-declined',String(Date.now()-15*864e5));pwaNext=null});
  eq(await p.evaluate(()=>pwaDeclined()),false,'the choice expires after 14 days');
  await p.evaluate(()=>{localStorage.setItem('evolyric-pwa-install-declined',String(Date.now()));$('#werr').textContent='';showWelcome(1)});await p.click('#wguest');await p.waitForTimeout(120);
  eq(await p.evaluate(()=>[$('#pwabox').classList.contains('on'),isGuest()]),[false,true],'remembered NO never blocks a later guest choice');
  await p.evaluate(()=>{show('list');prefOpen()});await p.waitForTimeout(100);
  assert(await p.evaluate(()=>[...document.querySelectorAll('#prefbody .srow')].some(r=>/Install EvoLyric/.test(r.textContent))),'Preferences keeps a manual install path');
  await t.close()});
test('PWA install: iOS instructions and a native browser prompt both resume the pending action',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>{localStorage.removeItem('evolyric-pwa-install-declined');Object.defineProperty(navigator,'userAgent',{configurable:true,value:'iPhone'});window.__pwaNext=0;pwaOffer(()=>window.__pwaNext++)});
  await p.click('#pwaYes');await p.waitForTimeout(80);
  eq(await p.evaluate(()=>[$('#pwaSteps').hidden,$('#pwaSteps').textContent.includes('Add to Home Screen'),window.__pwaNext]),[false,true,0],'iOS shows Add to Home Screen steps before continuing');
  await p.click('#pwaYes');await p.waitForTimeout(80);
  eq(await p.evaluate(()=>[$('#pwabox').classList.contains('on'),window.__pwaNext]),[false,1],'iOS guide continues without blocking');
  await p.evaluate(()=>{Object.defineProperty(navigator,'userAgent',{configurable:true,value:'Android'});const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=()=>{window.__prompted=(window.__prompted||0)+1;return Promise.resolve()};e.userChoice=Promise.resolve({outcome:'dismissed'});dispatchEvent(e);window.__pwaNext=0;pwaOffer(()=>window.__pwaNext++)});
  await p.click('#pwaYes');await p.waitForTimeout(80);
  eq(await p.evaluate(()=>[window.__prompted,window.__pwaNext,$('#pwabox').classList.contains('on')]),[1,1,false],'native prompt is used when the browser provides it');
  await t.close()});
test('PWA install: a signed-in person on Home is offered the install once, quietly; never while declined or already installed',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>{localStorage.removeItem('evolyric-pwa-install-declined');Object.defineProperty(navigator,'userAgent',{configurable:true,value:'iPhone'});show('list');pwaAutoDone=false;pwaAutoN=0});
  await p.evaluate(()=>pwaAuto());await p.waitForTimeout(80);
  eq(await p.evaluate(()=>$('#pwabox').classList.contains('on')),true,'offered on Home');
  await p.click('#pwaNo');await p.waitForTimeout(80);
  await p.evaluate(()=>{pwaAutoDone=false;pwaAutoN=0;pwaAuto()});await p.waitForTimeout(80);
  eq(await p.evaluate(()=>$('#pwabox').classList.contains('on')),false,'not offered again right after Not now');
  await t.close()});
test('Cloud: a mass delete is never sent to the cloud without an explicit yes',async()=>{
  const t=await open(),p=t.page;
  const r=await p.evaluate(async()=>{
    const run=async yes=>{
      const calls=[],tbl=n=>({delete:()=>({in:async()=>{calls.push(n+':delete');return{}},eq:()=>({in:async()=>{calls.push(n+':delete');return{}}})}),upsert:async()=>({}),insert:async()=>({})});
            const base={s:{},c:{},r:{}},map={s:{},c:{}};
      for(let i=0;i<6;i++){base.s['s'+i]='rec'+i;map.s['s'+i]='uuid-'+i}
      const state={base,map};
      const H={get:()=>({songs:[],cats:[]}),confirmMass:async()=>yes,notify:()=>{},onStatus:()=>{}};
      const out=await Cloud.__test.push({from:tbl},'u1',state,H);
      return{calls,kept:Object.keys(out.S.base.s).length}};
    return{no:await run(false),yes:await run(true)}});
  eq(r.no.calls,[],'without a yes nothing is deleted in the cloud');
  eq(r.no.kept,0,'the local deletion is forgotten so the next pull restores the songs');
  assert(r.yes.calls.includes('songs:delete'),'an explicit yes sends the delete');
  await t.close()});
test('Guest: signing in ends guest mode; Backup & restore is in Preferences for guests',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{setGuest(true);prefOpen()});await p.waitForTimeout(200);
  assert(await p.evaluate(()=>[...document.querySelectorAll('#prefbody .srow')].some(r=>/Backup & restore/.test(r.textContent))),'guest sees Backup & restore in Preferences');
  await p.evaluate(()=>{applyUser({id:'u1',email:'r@e.x',user_metadata:{full_name:'Rani'}})});
  eq(await p.evaluate(()=>isGuest()),false,'guest flag cleared on sign-in');
  await p.evaluate(()=>prefRender());eq(await p.evaluate(()=>[...document.querySelectorAll('#prefbody .srow')].some(r=>/Backup & restore/.test(r.textContent))),false,'signed in: it lives in Account Settings');
  await t.close()});
test('Legal: small links at the bottom of Help open Privacy Policy and Terms of Service, in the app language',async()=>{
  for(const [lang,pp,tos,h2] of [['en','Privacy Policy','Terms of Service','1. Introduction'],['id','Kebijakan Privasi','Ketentuan Penggunaan','1. Pendahuluan']]){
    const t=await open({lang}),p=t.page;await p.evaluate(()=>helpOpen());await p.waitForTimeout(200);
    eq(await p.evaluate(()=>[...document.querySelectorAll('#helpbody .sgrp')].map(g=>g.textContent).includes('Legal')),false,'no Legal group');
    await p.click('#helpbody .hfoot button:has-text("'+pp+'")');await p.waitForTimeout(300);
    eq(await p.evaluate(()=>[$('#doctitle').textContent,$('#docbody h2').textContent]),[pp,h2],lang+' privacy');
    assert(/Tokyo/.test(await p.evaluate(()=>$('#docbody').textContent)),'mentions the Supabase region');
    await p.click('#dcX');await p.waitForTimeout(200);await p.click('#helpbody .hfoot button:has-text("'+tos+'")');await p.waitForTimeout(300);
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


