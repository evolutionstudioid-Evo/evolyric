/* v159: block, report, daily limits, suspension and the Support page (server rules: supabase/011_safety.sql, checked separately in Postgres). */
const FR=[{id:'f1',other_id:'u2',username:'budi',display_name:'Budi',status:'accepted',incoming:false},{id:'f2',other_id:'u3',username:'sari',display_name:'Sari',status:'pending',incoming:true}];
const IN=[{id:'d1',sender_id:'u2',username:'budi',title:'Pesan',song_count:1}];
const mock=(p,o={})=>p.evaluate(o=>{user={id:'u1',name:'Rani Putri',email:'rani@example.com'};uname.v='rani';uname.state='ok';renderAuth();window.__rpc=[];
  const st=o.status||{suspended:false};
  sb={rpc:async(n,a)=>{window.__rpc.push([n,a||null]);if(o.fail&&o.fail[n])return{data:null,error:o.fail[n]};
      const d={list_friends:o.fr||[],list_inbox:o.inbox||[],list_blocked:o.blocked||[],my_status:[st]}[n];return{data:d===undefined?null:d,error:null}},
    auth:{signOut:async()=>({error:null})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})}},o);
const calls=(p,n)=>p.evaluate(n=>window.__rpc.filter(x=>x[0]===n).map(x=>x[1]),n);
module.exports=({test,assert,eq,open})=>{
test('Safety: a friend can be blocked (with a clear warning) and reported with a reason',async()=>{
  const t=await open(),p=t.page;await mock(p,{fr:FR});await p.evaluate(()=>frOpen());await p.waitForTimeout(400);
  await p.click('#frbody .fr.tap');await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#csheet button')].map(b=>b.textContent)),['Send songs','Unfriend','Report','Block','Cancel'],'friend menu');
  await p.click('#csheet button:has-text("Report")');await p.waitForTimeout(150);
  eq(await p.$eval('#csheet .fgo',b=>b.disabled),true,'send locked until a reason is picked');
  await p.click('#csheet .rr >> nth=0');await p.fill('#csheet .rpt','keeps sending chat messages');await p.click('#csheet .rpb');await p.click('#csheet .fgo');await p.waitForTimeout(300);
  eq(await calls(p,'report_user'),[{p_user:'u2',p_reason:'spam',p_details:'keeps sending chat messages',p_delivery:null}],'report sent');
  eq(await calls(p,'block_user'),[{p_user:'u2'}],'also blocked');
  await p.click('#frbody .fr.tap');await p.click('#csheet button.del:has-text("Block")');await p.waitForTimeout(150);
  assert(/cannot find you/.test(await p.evaluate(()=>$('#csheet').textContent)),'warning explains what block does');
  await t.close()});
test('Safety: requests and deliveries have ⋯ → Report / Block; a delivery report includes which delivery',async()=>{
  const t=await open(),p=t.page;await mock(p,{fr:FR,inbox:IN});await p.evaluate(()=>frOpen());await p.waitForTimeout(400);
  eq(await p.evaluate(()=>document.querySelectorAll('#frbody .frm').length),2,'one on the delivery, one on the request');
  await p.click('#frbody .frm >> nth=0');await p.click('#csheet button:has-text("Report")');await p.click('#csheet .rr >> nth=1');await p.click('#csheet .fgo');await p.waitForTimeout(300);
  eq(await calls(p,'report_user'),[{p_user:'u2',p_reason:'inappropriate',p_details:null,p_delivery:'d1'}],'delivery report');
  await t.close()});
test('Safety: Blocked people are listed in Friends and can be unblocked',async()=>{
  const t=await open(),p=t.page;await mock(p,{fr:[],blocked:[{id:'u9',username:'spammer',display_name:'Spam'}]});await p.evaluate(()=>frOpen());await p.waitForTimeout(400);
  assert(/Blocked/.test(await p.evaluate(()=>$('#frbody').textContent)),'Blocked section');
  await p.click('#frbody button:has-text("Unblock")');await p.waitForTimeout(300);eq(await calls(p,'unblock_user'),[{p_user:'u9'}],'unblocked');await t.close()});
test('Safety: server limits are explained (suspended, blocked, daily limit)',async()=>{
  for(const [code,msg] of [['EV001','Your account is suspended. Sending and friend requests are off.'],['EV002','You cannot do this with this person.'],['EV003','Daily limit reached. Try again tomorrow.']]){
    const t=await open(),p=t.page;await mock(p,{fr:FR,fail:{send_friend_request:{code,message:'x'}}});
    await p.evaluate(()=>frCall('send_friend_request',{p_user:'u5'},null));await p.waitForTimeout(150);
    eq(await p.evaluate(()=>$('#note').textContent),msg,code);
    eq(await p.evaluate(c=>sendErr({code:c},{username:'budi'}),code),msg,code+' when sending songs');await t.close()}});
test('Safety: a suspended account sees a notice in Friends; a fully suspended account is locked with Contact support / Sign out',async()=>{
  const t=await open(),p=t.page;await mock(p,{status:{suspended:true,mode:'social',until:'2026-12-01T00:00:00Z',reason:'spam'}});
  await p.evaluate(()=>frOpen());await p.waitForTimeout(500);
  assert(/Your account is suspended/.test(await p.evaluate(()=>$('#frbody .susb').textContent)),'notice in Friends');
  eq(await p.$('#susp'),null,'social: app not locked');
  await mock(p,{status:{suspended:true,mode:'full',until:null,reason:'abuse'}});await p.evaluate(()=>susCheck());await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[!!$('#susp'),$('#susp a').href.startsWith('mailto:evolution.studio.id@gmail.com'),/Until further notice/.test($('#susp').textContent)]),[true,true,true],'locked');
  await p.click('#susp button');await p.waitForTimeout(300);eq(await p.evaluate(()=>[!!$('#susp'),user]),[false,null],'sign out unlocks');
  eq(t.errors,[],'no page errors');await t.close()});
test('Support: Help → Contact support opens a page with an email button to evolution.studio.id@gmail.com',async()=>{
  const t=await open({lang:'id'}),p=t.page;await p.evaluate(()=>helpOpen());await p.waitForTimeout(200);
  assert((await p.evaluate(()=>$('#helpbody').textContent)).includes('evolution.studio.id@gmail.com'),'email shown in Help');
  await p.click('#helpbody .srow:has-text("Hubungi dukungan")');await p.waitForTimeout(300);
  const h=await p.$eval('#docbody a.dbtn',a=>[a.textContent,a.getAttribute('href')]);
  eq(h[0],'Kirim email ke dukungan','button');assert(h[1].startsWith('mailto:evolution.studio.id@gmail.com?subject=EvoLyric%20support&body='),'mailto: '+h[1].slice(0,80));
  assert(decodeURIComponent(h[1]).includes('EvoLyric 1.0'),'version included');await t.close()});
};
