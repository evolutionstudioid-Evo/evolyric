/* Auto Section (fictional lyrics only). */
const P=(...a)=>a.join('\n\n');
const V1='Lampu kota mulai redup\nLangkahku pelan menuju pulang\nJalan basah sisa hujan\nKu ingat semua tentangmu';
const PRE='Dan bila malam tiba\nAku kembali bertanya';
const CH='Pulanglah, pulanglah padaku\nRumah ini masih menunggu\nLampu teras masih menyala\nUntuk dirimu yang kucinta';
const V2='Kursi kayu di beranda\nSecangkir teh yang mulai dingin\nRadio tua memutar lagu\nYang dulu kita nyanyikan';
const BR='Mungkin waktu tak bisa diulang\nTapi hati tak pernah hilang\nAku di sini';
const CHv='Pulanglah, pulanglah padaku!\nRumah ini s’lalu menunggu\nLampu teras masih menyala\nUntuk dirimu yang kucinta';
const HALF='Lampu teras masih menyala\nUntuk dirimu yang kucinta';
const labels=t=>t.split('\n').filter(l=>/^\[.+\]$/.test(l));
module.exports=({test,assert,eq,open})=>{
test('Auto Section: verse, pre-chorus, chorus (also slightly varied), bridge and a half chorus at the end',async()=>{
  const t=await open(),p=t.page;
  const r=await p.evaluate(x=>autoSec(x),P('(petik gitar)',V1,PRE,CH,V2,PRE,CHv,BR,CH,HALF));
  eq(labels(r),['[Verse 1]','[Pre-Chorus]','[Chorus]','[Verse 2]','[Pre-Chorus]','[Chorus]','[Bridge]','[Chorus]','[Chorus]'],'labels in order');
  assert(r.startsWith('(petik gitar)\n\n[Verse 1]\nLampu kota'),'one-line intro left without a label, text unchanged');
  eq(r.replace(/\[[^\]]+\]\n/g,''),P('(petik gitar)',V1,PRE,CH,V2,PRE,CHv,BR,CH,HALF),'only labels were added');await t.close()});
test('Auto Section: a song that starts with its chorus; lyrics without blank lines are left alone',async()=>{
  const t=await open(),p=t.page;
  eq(labels(await p.evaluate(x=>autoSec(x),P(CH,V1,CH,V2,CH))),['[Chorus]','[Verse 1]','[Chorus]','[Verse 2]','[Chorus]'],'chorus first');
  eq(await p.evaluate(x=>autoSec(x),[V1,CH,V2].join('\n')),null,'one block: nothing to do');await t.close()});
test('Auto Section: LRCLIB and Google lyrics get labels by themselves; lyrics that already have labels are not touched',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(x=>openTemp({title:'Uji',lyrics:x,src:'lrclib',vers:[]}),P(V1,CH,V2,CH));await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#secs .chip')].map(c=>c.textContent)),['Verse 1','Chorus','Verse 2','Chorus'],'chips appear');
  await p.evaluate(x=>openTemp({title:'Uji',lyrics:x,src:'google'}),'[Intro]\n'+P(V1,CH,V2,CH));await p.waitForTimeout(300);
  eq(labels(await p.evaluate(()=>cur.lyrics)),['[Intro]'],'existing labels kept as they are');
  await p.evaluate(x=>openTemp({title:'Uji',lyrics:x,src:'paste'}),P(V1,CH,V2,CH));
  eq(await p.evaluate(()=>/\[/.test(cur.lyrics)),false,'other sources untouched');await t.close()},);
test('Auto Section: library songs only change from the editor button; existing labels are replaced after asking, Undo restores',async()=>{
  const t=await open(),p=t.page;
  await p.evaluate(x=>{songs.push({id:'a1',title:'Uji',artist:'',lyrics:x,speed:5,font:30,cr:1,md:1});openSong(songs.find(s=>s.id==='a1'))},P(V1,CH,V2,CH));await p.waitForTimeout(300);
  eq(await p.evaluate(()=>/\[/.test(cur.lyrics)),false,'opening a library song changes nothing');
  await p.evaluate(()=>openEdit(cur));await p.waitForTimeout(200);
  await p.click('#eA');await p.waitForTimeout(150);
  eq(labels(await p.evaluate(()=>$('#ta').value)),['[Verse 1]','[Chorus]','[Verse 2]','[Chorus]'],'labels inserted, no question when there were none');
  eq(await p.evaluate(()=>songs.find(s=>s.id==='a1').lyrics.includes('[')),false,'not saved until Save');
  await p.evaluate(()=>{$('#ta').value='[Intro]\n'+$('#ta').value.replace(/\[[^\]]+\]\n/g,'');snap()});
  await p.click('#eA');await p.waitForTimeout(150);
  eq(await p.evaluate(()=>[$('#ctx').classList.contains('on'),$('#csheet').textContent.includes('Replace the existing section labels')]),[true,true],'asks first');
  await p.click('#ctx button.del');await p.waitForTimeout(150);
  eq(labels(await p.evaluate(()=>$('#ta').value)),['[Verse 1]','[Chorus]','[Verse 2]','[Chorus]'],'replaced');
  await p.click('#eU');await p.waitForTimeout(100);
  eq(labels(await p.evaluate(()=>$('#ta').value)),['[Intro]'],'Undo restores');
  eq(t.errors,[],'no page errors');await t.close()});

test('Auto Section: verse and chorus written in one paragraph, and lyrics with no blank lines at all',async()=>{
  const t=await open(),p=t.page;
  eq(labels(await p.evaluate(x=>autoSec(x),P(V1+'\n'+CH,V2+'\n'+CH,BR,CH))),['[Verse 1]','[Chorus]','[Verse 2]','[Chorus]','[Bridge]','[Chorus]'],'one paragraph per verse+chorus');
  const r=await p.evaluate(x=>autoSec(x),[V1,CH,V2,CH,CH].join('\n'));
  eq(labels(r),['[Verse 1]','[Chorus]','[Verse 2]','[Chorus]','[Chorus]'],'no blank lines: cut where the chorus repeats (two choruses in a row = two labels)');
  eq(r.replace(/\[[^\]]+\]\n/g,''),[V1,CH,V2,CH,CH].join('\n'),'text unchanged');await t.close()});
test('Auto Section: LRCLIB style short paragraphs – a chorus spread over two paragraphs gets one label',async()=>{
  const t=await open(),p=t.page;
  const A='Dan bila malam tiba\nAku kembali bertanya',C1='Pulanglah, pulanglah padaku\nRumah ini masih menunggu\nSampai kapan pun juga',C2='Lampu teras masih menyala\nUntuk dirimu yang kucinta\nDi ujung jalan itu',V2s='Kursi kayu di beranda\nSecangkir teh yang mulai dingin';
  eq(labels(await p.evaluate(x=>autoSec(x),P(V1,A,C1,C2,V2s,A,C1,C2))),['[Verse 1]','[Pre-Chorus]','[Chorus]','[Verse 2]','[Pre-Chorus]','[Chorus]'],'chorus continuation not labelled twice');await t.close()});

test('Auto Section: chorus repeats with changed or extra lines (like many LRCLIB songs) are still one chorus; a different pre-chorus each time',async()=>{
  const t=await open(),p=t.page;
  const c=['Peluk aku di bawah lampu','Dansa pelan tanpa lagu','Kau dan aku di lantai kayu','Malam ini hanya milikmu','Bintang jatuh di matamu','Langit diam menunggu','Waktu pun berhenti','Kau sempurna malam ini'];
  const VA='Satu dua tiga empat\nLima enam tujuh delapan\nSembilan sepuluh sebelas\nDua belas tiga belas';
  const VB='Hari ini hari minggu\nAku pergi ke kota\nNaik kereta api\nDuduk di dekat jendela';
  const PA='Pre satu\nPre dua\nPre tiga\nPre empat\nPre lima\nPre enam',PB='Lain satu\nLain dua\nLain tiga\nLain empat\nLain lima\nLain enam';
  const C1=c.join('\n'),C2=c.slice(0,4).concat(['Baris baru ditengah','Satu lagi baris baru',c[7]]).join('\n'),C3=c.slice(0,4).concat(['Akhir yang berbeda','Penutup lain','Dan selesai']).join('\n');
  const r=await p.evaluate(x=>autoSec(x),P(VA,PA,C1,VB,PB,C2,'(gitar)',C3,'Satu lagi baris baru\n'+c[7]));
  eq(labels(r),['[Verse 1]','[Pre-Chorus]','[Chorus]','[Verse 2]','[Pre-Chorus]','[Chorus]','[Chorus]','[Chorus]'],'labels');await t.close()});
test('Auto Section: "Reff:" / "Back to reff" style markers from lyric sites become labels',async()=>{
  const t=await open(),p=t.page;
  const r=await p.evaluate(x=>autoSec(x),P(V1,'Reff:\n'+CH,V2,'Back to Reff','Bridge:\n'+BR));
  eq(labels(r),['[Verse 1]','[Chorus]','[Verse 2]','[Chorus]','[Bridge]'],'markers used');
  assert(!/Reff|Back to/.test(r),'marker lines replaced by labels');await t.close()});
};
