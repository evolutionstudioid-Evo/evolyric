const fs=require('fs'),path=require('path'),ROOT=path.join(__dirname,'..');
module.exports=({test,assert,eq,open})=>{
test('PWA: sw.js is a real service worker whose cache version matches the app version',async()=>{
  const sw=fs.readFileSync(path.join(ROOT,'www/sw.js'),'utf8'),html=fs.readFileSync(path.join(ROOT,'www/index.html'),'utf8');
  assert(sw.length>500,'sw.js is empty or truncated ('+sw.length+' bytes)');
  assert(/addEventListener\('fetch'/.test(sw)&&/addEventListener\('install'/.test(sw),'sw.js has install and fetch handlers');
  const v=(sw.match(/evolyric-app-(\d+)/)||[])[1],a=(html.match(/const APP_VER='(\d+)'/)||[])[1];
  eq(v,a,'cache version = APP_VER');new Function(sw)});
test('PWA: Safari-safe shell – index.html (redirected to / by the host) is not pre-cached, redirected responses are rebuilt, other pages never replace the shell',async()=>{
  const sw=fs.readFileSync(path.join(ROOT,'www/sw.js'),'utf8'),shell=(sw.match(/const SHELL=\[([^\]]*)\]/)||[])[1];
  assert(!/'index\.html'/.test(shell),'index.html not in SHELL');assert(/'\.\/'/.test(shell),'./ in SHELL');
  assert(/const clean=async x=>x&&x\.redirected\?new Response/.test(sw),'clean() rebuilds redirected responses');
  assert(/r\.mode==='navigate'&&!shell/.test(sw),'privacy/terms pages are not stored as the shell')});
test('PWA: every file the service worker pre-caches exists',async()=>{
  const sw=fs.readFileSync(path.join(ROOT,'www/sw.js'),'utf8');
  const tut=JSON.parse((sw.match(/const TUTIMG=(\[[^\]]*\])/)||[])[1].replace(/'/g,'"'));
  const shell=['index.html','manifest.webmanifest','config.js','cloud.js','tutorial.js','vendor/supabase.js','icon-192.png','icon-512.png','apple-touch-icon.png'];
  const missing=shell.filter(f=>!fs.existsSync(path.join(ROOT,'www',f)));
  eq(missing,[],'shell files');assert(tut.length>0,'tutorial image list');
  const tm=tut.flatMap(n=>['id','en'].map(l=>'man/'+n+'_'+l+'.webp')).filter(f=>!fs.existsSync(path.join(ROOT,'www',f)));
  eq(tm,[],'tutorial images listed in sw.js')});
test('PWA: after the first visit the app opens with no internet',async()=>{
  const t=await open({sw:true}),p=t.page;
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:15000}).catch(()=>{});
  if(!await p.evaluate(()=>!!navigator.serviceWorker.controller)){await p.reload();await p.waitForTimeout(800)}
  await t.ctx.setOffline(true);await p.reload();await p.waitForTimeout(1200);
  eq(await p.evaluate(()=>typeof songs!=='undefined'&&!!document.querySelector('#items')),true,'app shell loaded offline');
  await t.ctx.setOffline(false);await t.close()});
test('Repo: no stray debug scripts in the project root',async()=>{
  eq(fs.readdirSync(ROOT).filter(f=>/^_.*\.js$/.test(f)),[],'root')});
};
