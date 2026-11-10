const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('path');

const LYRIC_HOSTS=["genius.com","azlyrics.com","lyrics.com","musixmatch.com","songlyrics.com","metrolyrics.com","lyricstranslate.com"];
const MAX_LYRICS=18000, LOAD_TIMEOUT=15000;
let appWindow=null, importWindow=null;

function allowed(url){
  try{const host=new URL(url).hostname.toLowerCase();return LYRIC_HOSTS.some(x=>host===x||host.endsWith('.'+x))}
  catch(_){return false}
}
function sendStatus(message,error=false){
  if(appWindow&&!appWindow.isDestroyed())appWindow.webContents.send('lyric-import-status',{message,error});
}
function sendResult(data){
  if(appWindow&&!appWindow.isDestroyed())appWindow.webContents.send('lyric-import-result',data);
}
function waitForLoad(win,url){
  return new Promise((resolve,reject)=>{
    let done=false;
    const timer=setTimeout(()=>{if(!done){done=true;reject(new Error('timeout'))}},LOAD_TIMEOUT);
    const finish=()=>{if(done)return;done=true;clearTimeout(timer);resolve()};
    const fail=()=>{if(done)return;done=true;clearTimeout(timer);reject(new Error('load'))};
    win.webContents.once('did-finish-load',finish);
    win.webContents.once('did-fail-load',fail);
    win.loadURL(url).catch(fail);
  });
}
async function extractGoogleLinks(){
  return importWindow.webContents.executeJavaScript(`(()=> {
    const allowed=["genius.com","azlyrics.com","lyrics.com","musixmatch.com","songlyrics.com","metrolyrics.com","lyricstranslate.com"];
    const out=[],seen=new Set();
    for(const a of document.querySelectorAll('a[href]')){
      let href=a.href||a.getAttribute('href')||'';
      try{
        const u=new URL(href,location.href);
        if((u.hostname==='www.google.com'||u.hostname.endsWith('.google.com'))&&u.pathname==='/url')href=u.searchParams.get('q')||'';
      }catch(_){}
      try{
        const u=new URL(href);
        const h=u.hostname.toLowerCase();
        if(!allowed.some(x=>h===x||h.endsWith('.'+x))||seen.has(u.href))continue;
        seen.add(u.href);out.push(u.href);
      }catch(_){}
      if(out.length>=8)break;
    }
    return out;
  })()`);
}
async function extractLyricsFromPage(){
  return importWindow.webContents.executeJavaScript(`(()=> {
    const MAX=18000;
    const clean=value=>String(value||'').replace(/\\u00a0/g,' ').replace(/\\r/g,'').replace(/[ \\t]+\\n/g,'\\n').replace(/\\n{3,}/g,'\\n\\n').trim();
    const candidates=[];
    const selectors=['[data-lyrics-container]','.Lyrics__Container','#lyrics','[class*="lyrics" i]'];
    for(const selector of selectors){
      const nodes=[...document.querySelectorAll(selector)].slice(0,40);
      const parts=nodes.map(n=>clean(n.innerText||n.textContent)).filter(x=>x.length>20);
      const joined=[...new Set(parts)].join('\\n\\n');
      if(joined.length>80)candidates.push(joined);
    }
    for(const script of document.querySelectorAll('script[type="application/ld+json"]')){
      try{
        const stack=[JSON.parse(script.textContent||'')];
        while(stack.length){
          const x=stack.pop();
          if(!x||typeof x!=='object')continue;
          if(typeof x.lyrics==='string'){const t=clean(x.lyrics);if(t.length>80)candidates.push(t)}
          stack.push(...Object.values(x));
        }
      }catch(_){}
    }
    const score=x=>{const lines=x.split('\\n').filter(Boolean),unique=new Set(lines.map(v=>v.toLowerCase()));return x.length+Math.min(lines.length,300)*10+unique.size*2};
    const lyrics=[...new Set(candidates)].sort((a,b)=>score(b)-score(a))[0]||'';
    return lyrics.slice(0,MAX);
  })()`);
}
async function runImport({title,artist}){
  if(importWindow&&!importWindow.isDestroyed())importWindow.focus();
  else importWindow=new BrowserWindow({
    width:1100,height:800,parent:appWindow,show:true,
    webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}
  });
  const query=[title,artist,'lyrics'].filter(Boolean).join(' ');
  try{
    sendStatus('Membuka Google Search…');
    await waitForLoad(importWindow,'https://www.google.com/search?q='+encodeURIComponent(query));
    const links=await extractGoogleLinks();
    sendStatus('Mencari halaman lirik publik…');
    for(const url of links){
      if(!allowed(url))continue;
      try{
        await waitForLoad(importWindow,url);
        sendStatus('Mengekstrak lirik dari halaman sumber…');
        const lyrics=await extractLyricsFromPage();
        if(typeof lyrics==='string'&&lyrics.length>=80){
          sendResult({title,artist,lyrics,source:url});
          sendStatus('Lirik berhasil diambil.');
          importWindow.close();importWindow=null;return;
        }
      }catch(_){}
    }
    sendStatus('Teks lirik lengkap tidak ditemukan.',true);
  }catch(e){
    sendStatus(e&&e.message==='timeout'?'WebView timeout.':'WebView gagal dimuat.',true);
  }
}
ipcMain.handle('lyric-import:start',(_event,data)=>{
  if(!data||typeof data.title!=='string'||!data.title.trim())throw new Error('title');
  runImport({title:data.title.trim().slice(0,120),artist:String(data.artist||'').trim().slice(0,120)});
});
app.whenReady().then(()=>{
  appWindow=new BrowserWindow({
    width:430,height:900,
    webPreferences:{preload:path.join(__dirname,'app-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}
  });
  appWindow.loadFile(path.join(__dirname,'..','www','index.html'));
  appWindow.on('closed',()=>{appWindow=null});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
