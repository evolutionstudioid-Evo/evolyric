/* v146: colour tone – saturation (0 = monochrome), background brightness, contrast. */
const grey=c=>{const m=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);return !!m&&m[1]===m[2]&&m[2]===m[3]};
module.exports=({test,assert,eq,open})=>{
test('Tone: by default nothing changes (no override sheet)',async()=>{
  const t=await open(),p=t.page;
  eq(await p.evaluate(()=>[TN.id,$('#tone').textContent,tone('#f0a04b')]),[true,'','#f0a04b'],'identity');await t.close()});
test('Tone: saturation 0 makes the whole UI monochrome – accent buttons, section chips, aurora; highlights keep colour unless switched off',async()=>{
  const t=await open(),p=t.page;
  const ms=await p.evaluate(()=>{const t0=performance.now();PREF.sat=0;toneApply();return performance.now()-t0});
  assert(ms<300,'recalculation is quick: '+Math.round(ms)+' ms');
  const r=await p.evaluate(()=>({acct:getComputedStyle(document.documentElement).getPropertyValue('--acct').trim(),bg:getComputedStyle(document.body).backgroundColor,fab:getComputedStyle($('#fab')).backgroundColor}));
  assert(grey(r.fab)&&grey(r.bg),'grey: '+JSON.stringify(r));
  await p.evaluate(()=>{songs[0].lyrics='[Verse 1]\nSatu {r:merah} dua\n\n[Chorus]\nTiga';openSong(songs[0])});await p.waitForTimeout(300);
  const c=await p.evaluate(()=>({chip:getComputedStyle($('#secs .chip')).color,mark:$('#txt mark').style.background,aura:getComputedStyle($('#aura i')).getPropertyValue('--c').trim()}));
  assert(grey(c.chip),'chip grey: '+c.chip);assert(!grey(c.mark),'highlight keeps its colour: '+c.mark);
  assert(/^(\d+),\1,\1$/.test(c.aura.replace(/\s/g,'')),'aurora white/grey: '+c.aura);
  await p.evaluate(()=>{PREF.hlc=0;toneApply()});
  assert(grey(await p.evaluate(()=>$('#txt mark').style.background)),'highlight grey when switched off');
  eq(t.errors,[],'no page errors');await t.close()});
test('Tone: brightness and contrast move the background and text; Reset brings the original colours back; choices survive a reload',async()=>{
  const t=await open(),p=t.page;const bg=()=>p.evaluate(()=>getComputedStyle(document.body).backgroundColor);
  const b0=await bg();await p.evaluate(()=>{PREF.bri=100;prefSave();toneApply()});const b1=await bg();
  const lum=c=>c.match(/\d+/g).slice(0,3).reduce((a,v)=>a+ +v,0);assert(lum(b1)>lum(b0),'brighter background: '+b0+' -> '+b1);
  await p.reload();await p.waitForTimeout(800);eq(await bg(),b1,'kept after reload');
  await p.evaluate(()=>{prefOpen&&prefOpen()});await p.evaluate(()=>{show('prefs');prefRender()});
  await p.click('#prefbody .srow:has-text("Reset colours")');await p.waitForTimeout(150);
  eq([await bg(),await p.evaluate(()=>$('#tone').textContent)],[b0,''],'reset');await t.close()});
test('Tone: Preferences → Appearance shows the sliders (Indonesian)',async()=>{
  const t=await open({lang:'id'}),p=t.page;await p.evaluate(()=>{show('prefs');prefRender()});
  eq(await p.evaluate(()=>[...document.querySelectorAll('#prefbody .srng .lbl')].map(l=>l.firstChild.textContent)),['Warna','Kecerahan latar','Kontras'],'sliders');
  await p.evaluate(()=>{const i=$('#prefbody .srng input');i.value=0;i.dispatchEvent(new Event('input'));i.dispatchEvent(new Event('change'))});await p.waitForTimeout(100);
  eq(await p.evaluate(()=>[JSON.parse(localStorage.getItem('evo.prefs')).sat,TN.sat]),[0,0],'saved and applied');await t.close()});
};
