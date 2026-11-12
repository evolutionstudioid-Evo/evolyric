/* v158: Delete account – strong warning, type a word to unlock, nothing happens until the server confirms. */
const signIn=(p,rpc)=>p.evaluate(r=>{user={id:'u1',name:'Rani Putri',email:'rani@example.com',username:'rani'};renderAuth();
  window.__rpc=[];sb={rpc:async n=>{window.__rpc.push(n);return r==='ok'?{error:null}:r==='missing'?{error:{code:'PGRST202',message:'Could not find the function public.delete_my_account'}}:{error:{code:'500',message:'boom'}}},auth:{signOut:async()=>({error:null})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})}},rpc);
module.exports=({test,assert,eq,open})=>{
test('Delete account: Account Settings has it in a Danger zone; the button stays locked until the word is typed',async()=>{
  const t=await open(),p=t.page;await signIn(p,'ok');await p.evaluate(()=>acctOpen());await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#acctbody .sgrp')].map(e=>e.textContent)),['Account','Data','Danger zone'],'groups');
  await p.click('#acctbody .srow.danger');await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[$('#doctitle').textContent,!!document.querySelector('#docbody .dzw'),$('#docbody .dzword').textContent]),['Delete account',true,'DELETE'],'warning screen');
  const btn='#docbody .dbtn.danger';eq(await p.$eval(btn,b=>b.disabled),true,'locked');
  await p.fill('#docbody .dzin','delet');eq(await p.$eval(btn,b=>b.disabled),true,'still locked');
  await p.fill('#docbody .dzin','delete');eq(await p.$eval(btn,b=>b.disabled),false,'unlocked');
  eq(await p.evaluate(()=>window.__rpc.length),0,'nothing sent yet');await t.close()});
test('Delete account: after the server confirms, the account is signed out and the library is gone from this device',async()=>{
  const t=await open(),p=t.page;await signIn(p,'ok');
  await p.evaluate(()=>{localStorage.setItem('evolyric-v1:u:u1',JSON.stringify(songs));localStorage.setItem('evo.lastsong','s1');save()});
  await p.evaluate(()=>docOpen('acct','Delete account',docDelete));await p.fill('#docbody .dzin','DELETE');await p.click('#docbody .dbtn.danger');await p.waitForTimeout(500);
  eq(await p.evaluate(()=>window.__rpc),['delete_my_account'],'server asked once');
  eq(await p.evaluate(()=>[user,songs.length,cats.length,queue.length]),[null,0,0,0],'signed out, empty');
  eq(await p.evaluate(()=>Object.keys(localStorage).filter(k=>/^evolyric-(v1|cats-v1|recent)|^evo\.lastsong$/.test(k))),[],'device copy removed');
  eq(await p.evaluate(()=>[!!localStorage.getItem('evo.prefs'),$('#note').textContent]),[true,'Your account has been deleted.'],'preferences kept, told');
  eq(t.errors,[],'no page errors');await t.close()});
test('Delete account: if the server cannot do it, nothing is deleted and you are told why',async()=>{
  for(const [mode,msg] of [['missing','Account deletion is not switched on on the server yet. Nothing was deleted.'],['fail','Your account could not be deleted. Check your connection and try again. Nothing was deleted.']]){
    const t=await open(),p=t.page;await signIn(p,mode);
    await p.evaluate(()=>docOpen('acct','Delete account',docDelete));await p.fill('#docbody .dzin','delete');await p.click('#docbody .dbtn.danger');await p.waitForTimeout(400);
    eq(await p.evaluate(()=>[!!user,songs.length,$('#note').textContent,$('#docbody .dbtn.danger').disabled]),[true,5,msg,false],mode);await t.close()}});
test('Delete account: Indonesian asks for HAPUS',async()=>{
  const t=await open({lang:'id'}),p=t.page;await signIn(p,'ok');await p.evaluate(()=>docOpen('acct',L('Delete account','Hapus akun'),docDelete));await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[$('#docbody .dzword').textContent,$('#docbody .dbtn.danger').textContent]),['HAPUS','Hapus akun saya permanen'],'word and button');
  await p.fill('#docbody .dzin','delete');eq(await p.$eval('#docbody .dbtn.danger',b=>b.disabled),true,'English word does not unlock');
  await p.fill('#docbody .dzin','hapus');eq(await p.$eval('#docbody .dbtn.danger',b=>b.disabled),false,'HAPUS unlocks');await t.close()});
};
