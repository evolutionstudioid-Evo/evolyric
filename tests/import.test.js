/* v163 universal import: zip (Google Keep Takeout, Simplenote), Word, RTF, Evernote, Pages hint, Paste as new song, Android share target.
   Fictional lyrics only. Files are built here in memory. */
const zlib=require('zlib'),path=require('path'),fs=require('fs');
function zip(entries){const parts=[],cd=[];let off=0;
  for(const [name,data,deflate] of entries){const raw=Buffer.from(data),body=deflate?zlib.deflateRawSync(raw):raw,nm=Buffer.from(name),crc=zlib.crc32(raw);
    const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50,0);h.writeUInt16LE(20,4);h.writeUInt16LE(0x0800,6);h.writeUInt16LE(deflate?8:0,8);h.writeUInt32LE(crc,14);h.writeUInt32LE(body.length,18);h.writeUInt32LE(raw.length,22);h.writeUInt16LE(nm.length,26);
    parts.push(h,nm,body);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x0800,8);c.writeUInt16LE(deflate?8:0,10);c.writeUInt32LE(crc,16);c.writeUInt32LE(body.length,20);c.writeUInt32LE(raw.length,24);c.writeUInt16LE(nm.length,28);c.writeUInt32LE(off,42);
    cd.push(c,nm);off+=30+nm.length+body.length}
  const cdb=Buffer.concat(cd),e=Buffer.alloc(22);e.writeUInt32LE(0x06054b50,0);e.writeUInt16LE(entries.length,8);e.writeUInt16LE(entries.length,10);e.writeUInt32LE(cdb.length,12);e.writeUInt32LE(off,16);
  return Buffer.concat([...parts,cdb,e])}
const W='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const para=runs=>'<w:p>'+runs.map(r=>typeof r==='string'?'<w:r><w:t xml:space="preserve">'+r+'</w:t></w:r>':'<w:r><w:rPr>'+r[1]+'</w:rPr><w:t xml:space="preserve">'+r[0]+'</w:t></w:r>').join('')+'</w:p>';
const docx=paras=>zip([['[Content_Types].xml','<Types/>',true],['word/document.xml','<?xml version="1.0"?><w:document '+W+'><w:body>'+paras.map(para).join('')+'</w:body></w:document>',true]]);
/* a ColorNote backup as the Android app writes it: 28-byte header + AES-128-CBC (OpenSSL MD5 key derivation, fixed salt) */
const crypto=require('crypto');
function colornote(objs,pw){const P=Buffer.from(pw),S=Buffer.from('ColorNote Fixed Salt'),md5=b=>crypto.createHash('md5').update(b).digest();
  const key=md5(Buffer.concat([P,S])),iv=md5(Buffer.concat([key,P,S])),c=crypto.createCipheriv('aes-128-cbc',key,iv);
  const plain=Buffer.concat([Buffer.from([0,0,0,3,1,2,3]),...objs.map(o=>{const j=Buffer.from(JSON.stringify(o)),l=Buffer.alloc(4);l.writeUInt32BE(j.length);return Buffer.concat([l,j])})]);
  const head=Buffer.alloc(28);Buffer.from([0,78,0,79,0,84,0,69]).copy(head);head.writeUInt32BE(8,8);head.writeUInt32BE(2,12);head.writeUInt32BE(objs.length,24);return Buffer.concat([head,c.update(plain),c.final()])}
const CN=[{_id:1,title:'Pulang Malam',note:'Lampu jalan redup\nAku pulang sendiri',note_ext:JSON.stringify({format_list:[{format:'bg_color',start:6,end:11,attribute:'highlight_purple'}]}),type:0,encrypted:0,active_state:0,created_date:1,modified_date:2},
  {title:'Sampah',note:'dibuang',type:0,encrypted:0,active_state:16,created_date:1,modified_date:2},{title:'Folder',note:'{}',type:128,encrypted:0,active_state:0},
  {title:'Rahasia',note:'xxx',type:0,encrypted:1,active_state:0},{title:'Daftar',note:'[ ] Gitar\n[V] Kabel',type:16,encrypted:0,active_state:0,created_date:1,modified_date:2}];
const up=(p,files)=>p.setInputFiles('#file',files.map(([name,buffer])=>({name,mimeType:'application/octet-stream',buffer:Buffer.from(buffer)})));
const added=p=>p.evaluate(()=>songs.slice(5).map(s=>[s.title,s.lyrics]));
module.exports=({test,assert,eq,open})=>{
test('Import: Google Keep Takeout .zip – preview lists the notes (trash and html copies left out); untick a non-lyric note',async()=>{
  const t=await open(),p=t.page;
  const z=zip([['Takeout/Keep/Lampu Kota.json',JSON.stringify({title:'Lampu Kota',textContent:'Jalan basah sehabis hujan\nLampu kota mulai menyala',isTrashed:false}),true],
    ['Takeout/Keep/Lampu Kota.html','<html><body><div class="title">Lampu Kota</div><div class="content">dup</div></body></html>',true],
    ['Takeout/Keep/Belanja.json',JSON.stringify({title:'Belanja',listContent:[{text:'Gula'},{text:'Kopi'}],isTrashed:false}),false],
    ['Takeout/Keep/Lama.json',JSON.stringify({title:'Lama',textContent:'dibuang',isTrashed:true}),true],['Takeout/archive_browser.html','<p>x</p>',false]]);
  await up(p,[['takeout-keep.zip',z]]);await p.waitForTimeout(500);
  eq(await p.evaluate(()=>$('#ipbox').classList.contains('on')),true,'preview open');
  eq(await p.evaluate(()=>[...document.querySelectorAll('#ipItems .arow b')].map(b=>b.textContent)),['Lampu Kota','Belanja'],'two notes, no trash, no html duplicate');
  await p.click('#ipItems .arow >> nth=1');eq(await p.evaluate(()=>$('#ipC').textContent),'1 song','count');
  await p.click('#ipOK');await p.waitForTimeout(300);
  eq(await added(p),[['Lampu Kota','Jalan basah sehabis hujan\nLampu kota mulai menyala']],'only the ticked note');
  eq(await p.evaluate(()=>$('#note').textContent),'1 song imported','message');eq(t.errors,[],'no page errors');await t.close()});
test('Import: Simplenote .zip (notes.json) with one note imports straight away; title = first line',async()=>{
  const t=await open(),p=t.page;
  await up(p,[['notes.zip',zip([['source/notes.json',JSON.stringify({activeNotes:[{content:'Senja Kecil\n\n[Verse]\nOmbak datang perlahan'}],trashedNotes:[{content:'x'}]}),true],['Senja Kecil.txt','Senja Kecil\n\n[Verse]\nOmbak datang perlahan',false]])]]);
  await p.waitForTimeout(500);eq(await p.evaluate(()=>$('#ipbox').classList.contains('on')),false,'no preview for one note');
  eq(await added(p),[['Senja Kecil','[Verse]\nOmbak datang perlahan']],'imported');await t.close()});
test('Import: Word .docx keeps highlights and coloured text as EvoLyric highlights; title from the file name',async()=>{
  const t=await open(),p=t.page;
  await up(p,[['Lampu Kota.docx',docx([['Lampu Kota'],['Jalan ',['basah','<w:highlight w:val="yellow"/>'],' sehabis hujan'],[['Reff','<w:color w:val="FF0000"/>'],' di sini'],[['abu','<w:color w:val="808080"/>']]])]]);
  await p.waitForTimeout(500);
  eq(await added(p),[['Lampu Kota','Jalan {y:basah} sehabis hujan\n{r:Reff} di sini\nabu']],'marks; grey text stays plain');await t.close()});
test('Import: one Word file with many songs can be split at two blank lines in the preview; Auto Section option',async()=>{
  const t=await open({lang:'id'}),p=t.page;
  await up(p,[['Setlist.docx',docx([['Lagu Satu'],['Baris a'],['Baris b'],[''],[''],['Lagu Dua'],['Baris c']])]]);await p.waitForTimeout(500);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#ipOpt .ipo')].map(b=>b.textContent.replace(/✓/,''))),['Pilih semua','Satu file berisi banyak lagu (pisah di 2 baris kosong)','Auto Section untuk lirik tanpa label'],'options in Indonesian');
  await p.click('#ipOpt .ipo >> nth=1');
  eq(await p.evaluate(()=>[...document.querySelectorAll('#ipItems .arow b')].map(b=>b.textContent)),['Lagu Satu','Lagu Dua'],'split');
  await p.click('#ipOK');await p.waitForTimeout(300);
  eq(await added(p),[['Lagu Satu','Baris a\nBaris b'],['Lagu Dua','Baris c']],'two songs');eq(await p.evaluate(()=>$('#note').textContent),'2 lagu diimpor','message');await t.close()});
test('Import: RTF highlights, Evernote .enex notes, and a .pages file gets a hint instead',async()=>{
  const t=await open(),p=t.page;
  const rtf='{\\rtf1\\ansi{\\fonttbl{\\f0 Helvetica;}}{\\colortbl;\\red255\\green255\\blue0;\\red0\\green0\\blue255;}\\f0 Biru Laut\\par Ombak \\highlight1 tenang\\highlight0  malam\\par \\cf2 Reff\\cf0  biru\\par Caf\\\'e9}';
  const enex='<?xml version="1.0"?><en-export><note><title>Kopi Pagi</title><content><![CDATA[<?xml version="1.0"?><en-note><div>Kopi Pagi</div><div>Hangat di <span style="--en-highlight:yellow;background-color: rgb(255, 250, 165);">meja</span></div><div>kita</div></en-note>]]></content></note><note><title>Rindu</title><content><![CDATA[<en-note><div>Rumah jauh</div></en-note>]]></content></note></en-export>';
  await up(p,[['Biru Laut.rtf',rtf],['catatan.enex',enex],['Lagu.pages','PK..']]);await p.waitForTimeout(600);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#ipItems .arow b')].map(b=>b.textContent)),['Biru Laut','Kopi Pagi','Rindu'],'three notes');
  assert(/Lagu\.pages: open it in Pages/.test(await p.evaluate(()=>$('#ipOpt .iperr').textContent)),'pages hint');
  await p.click('#ipOK');await p.waitForTimeout(300);
  eq(await added(p),[['Biru Laut','Ombak {y:tenang} malam\n{b:Reff} biru\nCafé'],['Kopi Pagi','Hangat di {y:meja}\nkita'],['Rindu','Rumah jauh']],'contents');await t.close()});
test('Import: songs already in the Library are shown but not ticked; an unsupported file alone just shows a message',async()=>{
  const t=await open(),p=t.page;const z=zip([['a/Lagu A.txt','Lagu A\nSatu',false],['a/Lagu B.md','# Lagu B\nDua ==kuning==',false]]);
  await up(p,[['x.zip',z]]);await p.waitForTimeout(400);await p.click('#ipOK');await p.waitForTimeout(200);
  eq(await added(p),[['Lagu A','Satu'],['Lagu B','Dua {y:kuning}']],'first import');
  await up(p,[['x.zip',z]]);await p.waitForTimeout(400);
  eq(await p.evaluate(()=>[$('#ipC').textContent,$('#ipOK').disabled,[...document.querySelectorAll('#ipItems em')].length]),['0 songs',true,2],'duplicates unticked');
  await p.click('#ipX');await up(p,[['x.pages','PK']]);await p.waitForTimeout(300);
  assert(/open it in Pages/.test(await p.evaluate(()=>$('#note').textContent)),'message');eq(await p.evaluate(()=>songs.length),7,'nothing added');await t.close()});
test('Import: ColorNote backup (default password 0000) – trashed, encrypted and folder entries left out, highlight kept',async()=>{
  const t=await open(),p=t.page;await up(p,[['colornote-backup.backup',colornote(CN,'0000')]]);await p.waitForTimeout(600);
  eq(await p.evaluate(()=>[...document.querySelectorAll('#ipItems .arow b')].map(b=>b.textContent)),['Pulang Malam','Daftar'],'notes');
  await p.click('#ipOK');await p.waitForTimeout(300);
  eq(await added(p),[['Pulang Malam','Lampu {v:jalan} redup\nAku pulang sendiri'],['Daftar','Gitar\nKabel']],'contents');eq(t.errors,[],'no page errors');await t.close()});
test('Import: a ColorNote backup with its own password asks for it; a wrong password is reported',async()=>{
  const t=await open(),p=t.page;const asks=[];p.on('dialog',d=>{asks.push(d.message());d.accept(asks.length===1?'salah':'rahasia')});
  await up(p,[['cn.backup',colornote(CN.slice(0,1),'rahasia')]]);await p.waitForTimeout(800);
  eq(asks,['This ColorNote backup has a password. Enter it:','Wrong password. Enter the ColorNote backup password:'],'asked twice');
  eq(await added(p),[['Pulang Malam','Lampu {v:jalan} redup\nAku pulang sendiri']],'imported');
  p.removeAllListeners('dialog');p.on('dialog',d=>d.dismiss());await up(p,[['lain.backup',colornote(CN.slice(0,1),'beda')]]);await p.waitForTimeout(600);
  assert(/lain\.backup: wrong backup password/.test(await p.evaluate(()=>$('#note').textContent)),'reported');await t.close()});
test('Import: a ColorNote backup without importable notes says why (version, record counts) instead of a bare message',async()=>{
  const t=await open(),p=t.page;await up(p,[['colornote-x.backup',colornote([{_id:1,title:'Kunci',note:'zz',encrypted:1,type:0},{_id:2,title:'Baru',body:'{a}',type:0},{_id:3,title:'syncable_settings',note:'{}',type:256}],'0000')]]);await p.waitForTimeout(600);
  const m=await p.evaluate(()=>$('#note').textContent);for(const x of['colornote-x.backup: no notes found (ColorNote v8.2','3 rec','sys 1','locked 1','other 1','keys _id,title,body,type'])assert(m.includes(x),x+' in '+m);await t.close()});
test('Paste as new song: the clipboard note opens in the editor with its first line as the title',async()=>{
  const t=await open(),p=t.page;await t.ctx.grantPermissions(['clipboard-read','clipboard-write']);
  await p.evaluate(()=>navigator.clipboard.writeText('Hujan Reda Lagi\n[Verse]\nRintik turun pelan'));
  await p.click('#fab');eq(await p.evaluate(()=>[...document.querySelectorAll('#fabm button')].map(b=>b.textContent.trim())),['New song','Create setlist','Import from file','Paste as new song'],'menu');
  await p.click('#pst');await p.waitForTimeout(300);
  eq(await p.evaluate(()=>[$('#edit').classList.contains('on'),$('#et').value,$('#ta').value]),[true,'Hujan Reda Lagi','[Verse]\nRintik turun pelan'],'editor');await t.close()});
test('Share target: the manifest declares it, and …/?title=&text= opens the shared note in the editor, then the address is cleaned',async()=>{
  const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../www/manifest.webmanifest'),'utf8'));
  eq(m.share_target,{action:'./',method:'GET',enctype:'application/x-www-form-urlencoded',params:{title:'title',text:'text',url:'url'}},'manifest');
  const t=await open(),p=t.page;const u=new URL(p.url());u.search='?title='+encodeURIComponent('Pelabuhan Sore')+'&text='+encodeURIComponent('Pelabuhan Sore\nKapal kecil pulang\nLampu menyala');
  await p.evaluate(()=>localStorage.setItem('evolyric-guest','1'));await p.goto(u.toString());await p.waitForTimeout(1500);
  eq(await p.evaluate(()=>[$('#edit').classList.contains('on'),$('#et').value,$('#ta').value,location.search]),[true,'Pelabuhan Sore','Kapal kecil pulang\nLampu menyala',''],'editor, clean URL');
  eq(t.errors,[],'no page errors');await t.close()});
test('Share target: on the first screen the shared note waits until the person continues as guest',async()=>{
  const t=await open(),p=t.page;const u=new URL(p.url());u.search='?text='+encodeURIComponent('Nyala Kecil Lagi\nBaris satu');
  await p.goto(u.toString());await p.waitForTimeout(900);eq(await p.evaluate(()=>[$('#welcome').classList.contains('on'),$('#edit').classList.contains('on')]),[true,false],'waits on the welcome screen');
  await p.evaluate(()=>guestGo());await p.waitForTimeout(900);eq(await p.evaluate(()=>[$('#edit').classList.contains('on'),$('#et').value]),[true,'Nyala Kecil Lagi'],'then opens');await t.close()});
};
