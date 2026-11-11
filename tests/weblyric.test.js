/* Web Lyric – phase 1: temporary lyrics are shown in the lyrics screen but never become part of the library. */
const play=async(p,id='s1')=>{await p.evaluate(i=>openSong(songs.find(s=>s.id===i)),id);await p.waitForTimeout(400)};
const temp=async(p,o)=>{const r=await p.evaluate(o=>{const t=openTemp(o);return t&&t.id},o);await p.waitForTimeout(400);return r};
const lib=p=>p.evaluate(()=>({n:songs.length,ids:songs.map(s=>s.id),store:localStorage.getItem('evolyric-v1'),recent:localStorage.getItem('evolyric-recent-v1'),last:localStorage.getItem('evo.lastsong'),queue:[...queue]}));
const LRC='[ar: Nada Band]\r\n[ti: Lagu Uji]\r\n[00:01.20] Baris pertama\r\n[00:04.50]Baris kedua  \r\n\r\n\r\n\r\n[Chorus]\r\n[00:09.00][00:30.00] Reff <00:09.50>berulang\r\n';
module.exports=({test,assert,eq,open})=>{
test('Web Lyric: lyrics text is cleaned (line endings, LRC time stamps and header tags, extra blank lines)',async()=>{
  const t=await open(),p=t.page;
  eq(await p.evaluate(x=>lyrNorm(x),LRC),'Baris pertama\nBaris kedua\n\n[Chorus]\nReff berulang','normalised');
  eq(await p.evaluate(()=>lyrNorm('  \n\n')),'','blank stays blank');
  eq(await p.evaluate(()=>tempSong({lyrics:'[Verse]\nHalo dunia\nBaris dua'}).title),'Halo dunia','title falls back to the first lyric line');
  await t.close()});
test('Web Lyric: a temporary song opens in the lyrics screen without touching the library, Recent or the last-lyric button',async()=>{
  const t=await open(),p=t.page;await play(p,'s2');const before=await lib(p);
  const id=await temp(p,{title:'Lagu Uji',artist:'Nada Band',lyrics:LRC,src:'lrclib'});
  assert(id&&id.startsWith('tmp'),'temporary id');
  eq(await p.evaluate(()=>[$('#ptit').textContent,$('#play').classList.contains('on'),$('#play').classList.contains('tmp'),isTemp(cur)]),['Lagu Uji',true,true,true],'shown as temporary');
  eq(await p.evaluate(()=>[...document.querySelectorAll('#secs .chip')].map(c=>c.textContent)),['Chorus'],'section label in the text still becomes a chip');
  eq(await p.evaluate(()=>playing),false,'opens paused');
  /* speed and zoom changes on a temporary song never write the library */
  await p.evaluate(()=>{$('#sp').value=12;syncSpeed();setFont(cur.font+4)});
  eq(await lib(p),before,'library, Recent, last lyric and queue unchanged');
  eq(await p.evaluate(()=>songs.some(s=>s._temp)),false,'never in songs[]');
  eq(t.errors,[],'no page errors');await t.close()});
test('Web Lyric: Edit and Send are not offered for a temporary song (no way to lose an edit)',async()=>{
  const t=await open(),p=t.page;await temp(p,{title:'Lagu Uji',lyrics:'Satu\nDua'});
  await p.evaluate(()=>menuOpen(true));
  eq(await p.evaluate(()=>[$('#mE').hidden,$('#mS').hidden,$('#mR').hidden]),[true,true,false],'only Restart in the menu');
  await p.evaluate(()=>{menuOpen(false);$('#mE').onclick()});
  eq(await p.evaluate(()=>$('#edit').classList.contains('on')),false,'menu action ignored');
  /* double-tap on the title bar must not open the editor either */
  const b=await p.evaluate(()=>{const r=$('#ptit').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}});
  await p.mouse.click(b.x,b.y);await p.mouse.click(b.x,b.y);await p.waitForTimeout(200);
  eq(await p.evaluate(()=>[$('#edit').classList.contains('on'),$('#play').classList.contains('on')]),[false,true],'still on the lyrics screen');
  /* a library song opened afterwards gets Edit back */
  await play(p,'s1');await p.evaluate(()=>menuOpen(true));
  eq(await p.evaluate(()=>[$('#mE').hidden,$('#play').classList.contains('tmp')]),[false,false],'library song: Edit available');
  await t.close()});
test('Web Lyric: going back to Home drops the temporary song; the L button returns to the last library song',async()=>{
  const t=await open(),p=t.page;await play(p,'s3');await temp(p,{title:'Lagu Uji',lyrics:'Satu\nDua'});
  await p.evaluate(()=>leavePlay());await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[cur,$('#txt').textContent,$('#list').classList.contains('on')]),[null,'',true],'temporary song gone');
  await p.evaluate(()=>$('#lastb').onclick());await p.waitForTimeout(400);
  eq(await p.evaluate(()=>[cur&&cur.id,$('#ptit').textContent]),['s3','Sore di Pelabuhan'],'L opens the last library song');
  eq(t.errors,[],'no page errors');await t.close()});
test('Web Lyric: Next from a temporary song opens the queued library song and the temporary one is gone',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{queue.push('s4');qSave()});
  await temp(p,{title:'Lagu Uji',lyrics:'Satu\nDua'});
  await p.evaluate(()=>qNext());await p.waitForTimeout(900);
  eq(await p.evaluate(()=>[cur.id,isTemp(cur),$('#play').classList.contains('tmp'),[...queue]]),['s4',false,false,[]],'queued song opened, queue consumed');
  eq(await p.evaluate(()=>JSON.parse(localStorage.getItem('evolyric-recent-v1')||'[]')[0]),'s4','Recent gets the library song only');
  await t.close()});
test('Web Lyric: empty lyrics never open the lyrics screen',async()=>{
  const t=await open(),p=t.page;
  eq(await p.evaluate(()=>openTemp({title:'Kosong',lyrics:'  \n [00:01.00] \n'})),null,'nothing opened');
  eq(await p.evaluate(()=>[$('#list').classList.contains('on'),cur]),[true,null],'still on Home');await t.close()});
};
