const {open}=require('./tests/harness.js');
(async()=>{for(const lang of['en','id']){const t=await open({lang}),p=t.page;
await p.evaluate(()=>{openSong(songs[4]);for(const s of songs.slice(0,4))qAdd(s);qOpen(true)});await p.waitForTimeout(900);
await p.screenshot({path:'/tmp/claude-0/q_'+lang+'.png'});
if(lang==='id'){await p.click('#qclr');await p.waitForTimeout(300);await p.screenshot({path:'/tmp/claude-0/q_id_arm.png'})}
await t.close()}})()
