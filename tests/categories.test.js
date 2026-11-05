const names=p=>p.evaluate(()=>[...document.querySelectorAll('#items button')].map(b=>b.textContent.replace(/\d+ songs?$|\d+ lagu$/,'').replace(/^📌|^\s+/,'').trim()));
module.exports=({test,assert,eq,open})=>{
test('Categories: the tab lists categories with their song counts',async()=>{
  const t=await open(),p=t.page;await p.click('#tabs [data-v=cats]');
  const r=await p.evaluate(()=>[...document.querySelectorAll('#items button')].map(b=>b.textContent.trim()));
  assert(r.length===2&&r[0].includes('Acara Nikahan')&&r[0].includes('2')&&r[1].includes('Latihan Jumat')&&r[1].includes('3'),'rows: '+JSON.stringify(r));await t.close()});
test('Categories: pin to top moves a category above the others, Unpin returns it',async()=>{
  const t=await open(),p=t.page;await p.click('#tabs [data-v=cats]');
  await p.evaluate(()=>{ctxCat(cats.find(c=>c.id==='c1'))});
  await p.evaluate(()=>[...document.querySelectorAll('#csheet button')].find(b=>/Pin to top/.test(b.textContent)).click());await p.waitForTimeout(300);
  eq((await names(p))[0],'Latihan Jumat','pinned first');
  await p.evaluate(()=>{ctxCat(cats.find(c=>c.id==='c1'))});
  await p.evaluate(()=>[...document.querySelectorAll('#csheet button')].find(b=>/Unpin/.test(b.textContent)).click());await p.waitForTimeout(300);
  eq((await names(p))[0],'Acara Nikahan','back to alphabetical');await t.close()});
test('Categories: sorting by newest and oldest changes the order, pinned stays first',async()=>{
  const t=await open({seed:{cats:[{id:'c'+'000100abc',name:'Aaa',ids:['s1']},{id:'c'+'000300abc',name:'Bbb',ids:['s1']},{id:'c'+'000200abc',name:'Ccc',ids:['s1'],pin:5}]}}),p=t.page;
  await p.click('#tabs [data-v=cats]');await p.evaluate(()=>{catSortBy='new';refresh()});
  const n=(await names(p)).map(x=>x.slice(0,3));eq(n[0],'Ccc','pinned first');eq(n.slice(1),['Bbb','Aaa'],'newest first');
  await p.evaluate(()=>{catSortBy='old';refresh()});eq((await names(p)).map(x=>x.slice(0,3)).slice(1),['Aaa','Bbb'],'oldest first');await t.close()});
test('Categories: opening a category shows only its songs, in the library order',async()=>{
  const t=await open(),p=t.page;await p.evaluate(()=>{lib.v='cat';lib.id='c1';refresh()});
  const r=await p.evaluate(()=>[...document.querySelectorAll('#items .it b')].map(e=>e.textContent.replace(/\s*[A-G][b#]?$/,'').trim()));
  eq(r.sort(),['Hujan Reda','Pulang ke Panggung','Sore di Pelabuhan'],'songs in Latihan Jumat');await t.close()});
test('Categories: deleting a category keeps its songs in the library',async()=>{
  const t=await open(),p=t.page;await p.click('#tabs [data-v=cats]');await p.evaluate(()=>ctxCat(cats.find(c=>c.id==='c1')));
  await p.evaluate(()=>[...document.querySelectorAll('#csheet button')].find(b=>/Delete category/.test(b.textContent)).click());await p.waitForTimeout(300);
  await p.evaluate(()=>[...document.querySelectorAll('#csheet button')].find(b=>/Delete category/.test(b.textContent)).click());await p.waitForTimeout(300);
  eq(await p.evaluate(()=>cats.map(c=>c.id)),['c2'],'category removed');eq(await p.evaluate(()=>songs.length),5,'songs kept');await t.close()});
test('Categories: one song can belong to several categories as a single copy',async()=>{
  const t=await open(),p=t.page;
  const r=await p.evaluate(()=>{cats[1].ids.push('s1');save();return[cats.filter(c=>c.ids.includes('s1')).length,songs.filter(s=>s.id==='s1').length]});eq(r,[2,1],'two categories, one copy');
  await p.evaluate(()=>{songs.find(s=>s.id==='s1').title='Judul Baru';save();lib.v='cat';lib.id='c2';refresh()});
  assert(await p.evaluate(()=>[...document.querySelectorAll('#items .it b')].some(e=>e.textContent.includes('Judul Baru'))),'edit visible in the other category');await t.close()});
};
