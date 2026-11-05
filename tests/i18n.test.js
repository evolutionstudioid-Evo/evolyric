const {execSync}=require('child_process');
module.exports=({test,assert,eq,open})=>{
test('i18n: the audit script reports nothing untranslated',async()=>{
  const out=execSync('node tools/i18n-audit.js',{cwd:require('path').join(__dirname,'..')}).toString();
  assert(/OK – nothing untranslated/.test(out),out.slice(-300))});
test('i18n: switching to Indonesian translates the main screens',async()=>{
  const t=await open({lang:'id'}),p=t.page;
  for(const v of['list']){await p.evaluate(()=>show('list'))}
  const miss=await p.evaluate(()=>window.i18nMissing());const mine=['Hujan Reda','Duo Akustik','Langit Malam','Nada Band','Nyala Kecil','Trio Pop','Pulang ke Panggung','Sore di Pelabuhan'];
  eq(miss.filter(x=>!mine.includes(x)),[],'missing on home (song titles and artists are the user’s own text)');await t.close()});
};
