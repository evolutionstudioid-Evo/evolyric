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
};
