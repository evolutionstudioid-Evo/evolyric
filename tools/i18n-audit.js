/* Lists English text that has no Indonesian translation yet.
   Run:  node tools/i18n-audit.js        (needs: npm i playwright)
   Add every string it prints to ID (exact text) or IDP (text with a name/number) in www/index.html, then run again.
   The list must be empty before a release. */
const {chromium}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await ctx.newPage(),err=[];
p.on('pageerror',e=>err.push(e.message));
await p.addInitScript(()=>localStorage.setItem('evo.prefs',JSON.stringify({theme:'light',lang:'id',awake:1,dim:1,font:32})));
await p.goto('file://'+path.resolve(__dirname,'../www/index.html'));await p.waitForTimeout(900);
await p.evaluate(()=>{user={id:'u',name:'Rani Putri',email:'rani@example.com',username:'rani'};renderAuth()});
const found=new Map(),scan=async n=>{(await p.evaluate(()=>window.i18nMissing())).forEach(t=>{if(!found.has(t))found.set(t,n)})};
const step=async(n,fn)=>{try{await fn();await p.waitForTimeout(300);await scan(n)}catch(e){console.log('! skipped',n,e.message.split('\n')[0])}};
const back=async()=>{await p.keyboard.press('Escape');await p.mouse.click(5,840).catch(()=>{})};
await step('home',async()=>{});
await step('avatar menu',()=>p.click('#avb'));await back();
await step('gear menu',()=>p.click('#gear'));
await step('preferences',()=>p.click('#gmenu .mi:nth-child(1)'));await p.click('#prX');
for(const [i,n] of [[2,'help'],]){await p.click('#gear');await p.click('#gmenu .mi:nth-child(2)');await scan('help');
  for(let r=1;r<=3;r++){await step('help doc '+r,()=>p.click('#helpbody .srow:nth-child('+r+')'));await p.click('#dcX')}await p.click('#hpX')}
await step('account settings',async()=>{await p.click('#avb');await p.click('#amenu .mi:has-text("Pengaturan Akun")')});
await step('subscription',()=>p.click('#acctbody button.srow >> nth=0'));await p.click('#dcX');
await step('backup',()=>p.click('#acctbody button.srow >> nth=1'));await p.click('#dcX');await p.click('#acX');
await step('sort menu',()=>p.click('#sortb'));await back();
await step('+ menu',()=>p.click('#fab'));await step('new song editor',()=>p.click('#fabm button >> nth=0'));
await step('editor',async()=>{});
for(const sel of ['#eX','#edit .tb button >> nth=0']){const open=await p.evaluate(()=>document.querySelector('#edit.on')!==null);if(!open)break;await p.click(sel).catch(()=>{});await p.waitForTimeout(200);const d=await p.$('.dlg button, #dlg button');if(d)await scan('discard dialog')}
await p.evaluate(()=>{if(typeof show==='function')show('list')});
await step('categories tab',()=>p.click('#tabs [data-v=cats]'));
await step('new category',()=>p.click('#act'));await back();
await step('recent tab',()=>p.click('#tabs [data-v=recent]'));
await p.evaluate(()=>{if(typeof show==='function')show('list')});await p.click('#tabs [data-v=all]');
await step('open song',()=>p.click('#items .it >> nth=0'));
await step('player drawer',()=>p.click('#play .hd .ic >> nth=0'));await back();
await step('player menu',()=>p.click('#mn'));await back();
await step('speed',()=>p.click('#spb'));
await step('friends',async()=>{await p.evaluate(()=>{fr.state='ok';frOpen()})});
await step('profile',async()=>{await p.evaluate(()=>profOpen())});
await step('friend menu',async()=>{await p.evaluate(()=>frFriendMenu({username:'budi',display_name:'Budi'}))});
await step('confirm dialog',async()=>{await p.evaluate(()=>ask('Delete category','Only the category is deleted. The songs stay in All Songs and in their other categories.','Delete',()=>{}))});
await step('toasts',async()=>{await p.evaluate(()=>{['Category created','You are offline','Sent to @budi','Maximum 20 songs per group','Removed from Gig A'].forEach(t=>note(t))})});
await step('song context menu',async()=>{await p.evaluate(()=>{show('list');ctxOpen(songs[0],null)})});
await step('send picker',async()=>{await p.evaluate(()=>sendOpen({username:'budi'}))});
console.log(err.length?'JS errors: '+err.join(' | '):'no JS errors');
if(!found.size)console.log('OK – nothing untranslated');else{console.log('UNTRANSLATED ('+found.size+'):');found.forEach((v,k)=>console.log('  ['+v+'] '+k))}
await b.close();process.exit(found.size?1:0)})();
