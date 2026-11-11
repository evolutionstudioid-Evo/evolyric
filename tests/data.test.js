module.exports=({test,assert,eq,open})=>{
test('Data: songs and categories survive a reload',async()=>{
  const t=await open(),p=t.page;await p.reload();await p.waitForTimeout(600);
  eq(await p.evaluate(()=>[songs.length,cats.length]),[5,2],'counts');await t.close()});
test('Data: backup text round-trips; restoring skips songs that already exist',async()=>{
  const t=await open(),p=t.page;
  const r=await p.evaluate(()=>{const b=backupText();const ok=b.startsWith('EVOLYRIC2');const n=songs.length;restoreBackup(b);return[ok,songs.length===n]});
  eq(r,[true,true],'format + no duplicates');await t.close()});
test('Data: restore brings back songs that were deleted',async()=>{
  const t=await open(),p=t.page;
  const n=await p.evaluate(()=>{const b=backupText();songs.splice(0,2);save();restoreBackup(b);return songs.length});
  eq(n,5,'restored');await t.close()});
test('Data: legacy GULIRLIRIK1 and EVOLYRIC1 backups are recognised',async()=>{
  const t=await open(),p=t.page;
  const r=await p.evaluate(()=>{const o=[];for(const pre of['GULIRLIRIK1','EVOLYRIC1']){const n=songs.length;restoreBackup(pre+JSON.stringify([{id:'old'+pre,title:'Lama '+pre,artist:'x',lyrics:'[Verse]\na'}]));o.push(songs.length-n)}return o});
  eq(r,[1,1],'one imported each');await t.close()});
test('Data: Backup screen has just Backup, Restore and Export .txt; Backup downloads one .evolyric file that Restore reads back',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>docOpen('acct','Backup & restore',docBackup));await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#docbody .dbtn')].map(b=>b.textContent)),['Backup','Restore','Export .txt'],'buttons');
  eq(await p.evaluate(()=>!!document.querySelector('#docbody textarea')),false,'no paste box any more');
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#docbody .dbtn >> nth=0')]);
  assert(/^evolyric-backup-\d{8}\.evolyric$/.test(dl.suggestedFilename()),'file name: '+dl.suggestedFilename());
  const fs=require('fs'),path=await dl.path(),txt=fs.readFileSync(path,'utf8');
  assert(txt.startsWith('EVOLYRIC2'),'backup format');
  await p.evaluate(()=>{songs.length=0;cats.length=0;save();refresh()});
  await p.setInputFiles('#docbody input[type=file]',path);await p.waitForTimeout(400);
  eq(await p.evaluate(()=>[songs.length,cats.length,cats.map(c=>c.ids.length)]),[5,2,[3,2]],'songs and categories restored from the file');
  eq(t.errors,[],'no page errors');await t.close()});
test('Data: Export .txt writes every song in the Shortcut format; Import .txt (or Restore) brings them back',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(()=>docOpen('acct','Backup & restore',docBackup));await p.waitForTimeout(300);
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#docbody .dbtn >> nth=2')]);
  assert(/^evolyric-lyrics-\d{8}\.txt$/.test(dl.suggestedFilename()),'file name: '+dl.suggestedFilename());
  const txt=require('fs').readFileSync(await dl.path(),'utf8');
  eq(txt.split('===EVONOTE===').length,5,'five songs, separated like the Shortcut file');
  const r=await p.evaluate(x=>{const want=songs.map(s=>[s.title,s.lyrics]);const parts=evoParts(x).map(o=>[o.title,o.lyrics]);
    const n0=songs.length;const again=restoreFile(x);return{same:JSON.stringify(parts)===JSON.stringify(want),again,dup:songs.length-n0}},txt);
  eq(r,{same:true,again:true,dup:0},'titles and lyrics come back exactly; songs already there are skipped');
  eq(await p.evaluate(()=>restoreFile('just some text')),false,'anything else is refused');
  await t.close()});
};
