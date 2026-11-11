/* Import of the Apple Notes shortcut file: notes separated by ===EVONOTE=== become separate songs. Fictional lyrics only. */
const FILE='Lagu Satu\r\n[Intro]\r\n\r\n[Verse 1]\r\nBaris satu  \r\nBaris dua===EVONOTE===Lagu Dua\n[Chorus]\nReff lagu dua\n\n[Coda]\nAkhir===EVONOTE===\n\n===EVONOTE===Lagu Tiga\nTanpa label section\nBaris terakhir\n';
const up=(p,name,text)=>p.setInputFiles('#file',{name,mimeType:'text/plain',buffer:Buffer.from(text)});
const newSongs=p=>p.evaluate(()=>songs.slice(5).map(s=>({title:s.title,lyrics:s.lyrics})));
module.exports=({test,assert,eq,open})=>{
test('EVONOTE import: one shortcut file becomes one song per note, title from the first line, lyrics unchanged, file order kept',async()=>{
  const t=await open(),p=t.page;await up(p,'notes-tes.txt',FILE);await p.waitForTimeout(400);
  eq(await newSongs(p),[
    {title:'Lagu Satu',lyrics:'[Intro]\n\n[Verse 1]\nBaris satu\nBaris dua'},
    {title:'Lagu Dua',lyrics:'[Chorus]\nReff lagu dua\n\n[Coda]\nAkhir'},
    {title:'Lagu Tiga',lyrics:'Tanpa label section\nBaris terakhir'}],'three songs, empty parts ignored');
  eq(await p.evaluate(()=>{const a=songs.slice(5);return a[0].cr<a[1].cr&&a[1].cr<a[2].cr}),true,'order kept');
  eq(await p.evaluate(()=>JSON.parse(localStorage.getItem('evolyric-v1')).length),8,'saved');
  eq(await p.evaluate(()=>$('#note').textContent),'3 songs imported','result shown');
  eq(t.errors,[],'no page errors');await t.close()});
test('EVONOTE import: running the shortcut again skips songs already in the Library word for word',async()=>{
  const t=await open(),p=t.page;await up(p,'a.txt',FILE);await p.waitForTimeout(300);
  await up(p,'b.txt',FILE.replace('Akhir','Akhir baru'));await p.waitForTimeout(300);
  eq(await p.evaluate(()=>songs.length),9,'only the changed note was added again');
  eq(await p.evaluate(()=>$('#note').textContent),'1 song imported, 2 already in your Library','told what was skipped');await t.close()});
test('EVONOTE import: inside a category the songs go into that category; a plain .txt still imports as one song',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{lib.v='cat';lib.id='c1';refresh()});
  await up(p,'notes.txt',FILE);await p.waitForTimeout(300);
  eq(await p.evaluate(()=>cats.find(c=>c.id==='c1').ids.length),6,'3 added to the category');
  await up(p,'Biasa.txt','Satu baris\nDua baris');await p.waitForTimeout(300);
  eq(await p.evaluate(()=>{const s=songs[songs.length-1];return[s.title,s.lyrics]}),['Biasa','Satu baris\nDua baris'],'old behaviour kept');await t.close()});
test('EVONOTE import: pasting shortcut text on Home imports the songs instead of opening the editor; Indonesian message',async()=>{
  const t=await open({lang:'id'}),p=t.page;
  await p.evaluate(x=>{const e=new Event('paste',{bubbles:true});e.clipboardData={getData:()=>x};document.body.dispatchEvent(e)},FILE);await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[songs.length,$('#edit').classList.contains('on'),$('#note').textContent]),[8,false,'3 lagu diimpor'],'imported, no editor');await t.close()});
};
