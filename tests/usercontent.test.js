/* v162: strict rule – in Indonesian, the user's own text (lyrics, section names, titles, artists, category names) is never translated,
   even when it is exactly an interface word such as "Close", "Back" or "Done". */
const LYR='[Verse 1]\nBack\nDone\nRemove the pain\nHold on\n\n[Next]\nClose\nSave\n\n[Lyrics]\nSettings\nHelp';
const seedEn={songs:[{id:'e1',title:'Close',artist:'Settings',key:'C',lyrics:LYR,speed:5,font:30,cr:1,md:1},{id:'e2',title:'',artist:'Done',key:'D',lyrics:LYR,speed:5,font:30,cr:2,md:2}],cats:[{id:'cb',name:'Back',ids:['e1','e2']}]};
module.exports=({test,assert,eq,open})=>{
const texts=(p,sel)=>p.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.textContent.trim()),sel);
test('user content: lyrics, sections, titles and categories stay as written in Indonesian',async()=>{
  const t=await open({lang:'id',seed:seedEn}),p=t.page;await p.evaluate(()=>i18nRun());await p.waitForTimeout(200);
  const list=await texts(p,'#items .it b span');assert(list.includes('Close'),'title in list: '+list);assert(list.includes('Tanpa judul'),'an empty title still shows the Indonesian fallback: '+list);
  const art=await texts(p,'#items .it small');assert(art.includes('Settings')&&art.includes('Done'),'artists: '+art);
  await p.evaluate(()=>{lib.v='cats';refresh()});await p.waitForTimeout(200);assert((await texts(p,'#items .it b span')).includes('Back'),'category name');
  await p.evaluate(()=>{lib.v='cat';lib.id='cb';refresh()});await p.waitForTimeout(200);eq((await texts(p,'#cName'))[0],'Back','category header');
  await p.evaluate(()=>{ctxOpen(songs.find(s=>s.id==='e1'))});await p.waitForTimeout(200);eq((await texts(p,'#csheet h3'))[0],'Close','song menu title');
  await p.evaluate(()=>{ctxClose();openSong(songs.find(s=>s.id==='e1'))});await p.waitForTimeout(400);
  eq((await texts(p,'#ptit'))[0],'Close','title above the lyrics');
  eq(await texts(p,'#secs .chip'),['Verse 1','Next','Lyrics'],'section buttons');
  const ln=await texts(p,'#txt .ln');for(const x of['Back','Done','Remove the pain','Close','Save','Settings','Help'])assert(ln.includes(x),'lyric line '+x+': '+ln);
  await p.evaluate(()=>{queue.length=0;queue.push('e1');qSave&&qSave();qRender();qOpen(true)});await p.waitForTimeout(300);assert((await texts(p,'#ql .qt span')).includes('Close'),'queue title');
  await p.evaluate(()=>{qOpen(false);leavePlay();openEdit(songs.find(s=>s.id==='e1'));openAnn()});await p.waitForTimeout(400);
  const an=await texts(p,'#antx .ln');for(const x of['Back','Done','Close','Help'])assert(an.includes(x),'annotation lyric line '+x+': '+an);
  /* the interface itself is still Indonesian */
  assert(/Kategori/.test((await texts(p,'#cBack'))[0]||''),'interface text is still translated');
  await t.close()});
};
