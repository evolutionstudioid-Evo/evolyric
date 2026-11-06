/* Tiny test harness: each test gets a fresh browser context with fictional data. No app code is changed or imported. */
const {chromium,devices}=require('playwright');
const path=require('path');
const http=require('http'),fs=require('fs');
const WWW=path.resolve(__dirname,'../www'),MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
let server,URL; /* the app is served from a local http address (not file://) so that localStorage behaves like in the real app */
const serve=()=>new Promise(r=>{server=http.createServer((q,res)=>{let f=path.join(WWW,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(WWW))f=WWW;if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});res.end(b)})}).listen(0,'127.0.0.1',()=>{URL='http://127.0.0.1:'+server.address().port+'/index.html';r()})});
const LY='[Intro]\n(petik gitar)\n\n[Verse 1]\nLampu panggung mulai menyala\nRuangan hening menunggu kita\n\n[Chorus]\nPulang, pulang ke panggung\nTempat suaraku bertemu rumah\n\n[Vocal 1]\nAku di sini\n\n[Harmony]\nBerdua kita tinggi\n\n[Choir]\nPulang, pulang\n\n[Bridge]\nDan bila lampu padam\n\n[Outro]\nPulang';
const SONGS=[['s1','Pulang ke Panggung','Nada Band','G'],['s2','Langit Malam','Nada Band','C'],['s3','Sore di Pelabuhan','Duo Akustik','D'],['s4','Hujan Reda','Duo Akustik','A'],['s5','Nyala Kecil','Trio Pop','E']];
const seed=(over={})=>({songs:SONGS.map((s,i)=>({id:s[0],title:s[1],artist:s[2],key:s[3],lyrics:LY,speed:5,font:30,cr:1000+i,md:2000+i})),cats:[{id:'c1',name:'Latihan Jumat',ids:['s1','s3','s4']},{id:'c2',name:'Acara Nikahan',ids:['s2','s5']}],...over});
let browser;
async function open(o={}){
  if(!server)await serve();browser=browser||await chromium.launch();
  const ctx=await browser.newContext({serviceWorkers:'block',...(o.device?devices[o.device]:{viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true})});
  const lang=o.lang||'en';
  await ctx.addInitScript(l=>{if(!localStorage.getItem('evo.prefs'))localStorage.setItem('evo.prefs',JSON.stringify({theme:'dark',lang:l,awake:0,dim:0,font:30}))},lang);
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL);await page.waitForTimeout(500);
  const d=seed(o.seed);
  await page.evaluate(d=>{songs.length=0;d.songs.forEach(s=>songs.push(s));cats.length=0;d.cats.forEach(c=>cats.push(c));queue.length=0;save();show('list');lib.v='all';lib.id=null;refresh()},d);
  return {page,ctx,errors,close:()=>ctx.close()};
}
async function closeAll(){if(browser)await browser.close();browser=null;if(server){server.close();server=null}}
const T=[];const test=(name,fn)=>T.push({name,fn});
const assert=(c,m)=>{if(!c)throw new Error('Assertion failed: '+m)};
const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error((m||'Not equal')+'\n   expected: '+JSON.stringify(b)+'\n   actual:   '+JSON.stringify(a))};
async function run(files){
  files.forEach(f=>require(f)({test,assert,eq,open}));
  const only=process.argv[2];let pass=0,fail=0;const t0=Date.now();
  for(const t of T){if(only&&!t.name.toLowerCase().includes(only.toLowerCase()))continue;
    const s=Date.now();
    try{await t.fn();pass++;console.log('  ok   '+t.name+' ('+(Date.now()-s)+' ms)')}
    catch(e){fail++;console.log('  FAIL '+t.name+'\n   '+String(e.message).split('\n').join('\n   '))}}
  await closeAll();
  console.log('\n'+pass+' passed, '+fail+' failed in '+((Date.now()-t0)/1000).toFixed(1)+' s');
  process.exit(fail?1:0)}
module.exports={run,open,seed,SONGS,LY};
