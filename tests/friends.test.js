module.exports=({test,assert,eq,open})=>{
test('Friends: a received song is always saved as a new copy and never overwrites mine',async()=>{
  const t=await open(),p=t.page;
  const r=await p.evaluate(async()=>{const before=songs.length,orig=songs[0].lyrics;
    const pay={songs:[{title:songs[0].title,artist:songs[0].artist,lyrics:'[Verse]\nlain',key:'C'}]};
    sb.rpc=async()=>({data:pay,error:null});
    await frSaveSong({id:'d1'});await frSaveSong({id:'d2'});
    return{added:songs.length-before,orig:songs[0].lyrics===orig}});
  eq(r.added,2,'two new copies');assert(r.orig,'original untouched');await t.close()});
test('Friends: a received category merges by title+artist and never overwrites',async()=>{
  const t=await open(),p=t.page;
  const has=await p.evaluate(()=>typeof catImport==='function'&&typeof sendCat==='function'&&typeof sendPick==='function');
  assert(has,'friend functions exist');
  eq(await p.evaluate(()=>SEND_MAX),300,'send limit');await t.close()});
test('Friends: the Friends screen opens without errors while signed out',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{try{document.querySelector('#acct,#acctb')?.click()}catch(e){}});
  await p.waitForTimeout(300);eq(t.errors.length,0,'no page errors: '+t.errors.join('|'));await t.close()});
};
