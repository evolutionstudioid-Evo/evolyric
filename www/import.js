/* v163 EvoLyric universal import.
   Turns whatever a notes app can export into songs: .txt .md .html .rtf .docx .enex .json and .zip
   (Google Keep Takeout, Simplenote export, a folder of lyric files). Nothing leaves the device.
   Highlights and coloured text become EvoLyric highlights {r|o|y|g|b|i|v:text}; other formatting is dropped.
   API: EvoImport.read(files) -> Promise<{items:[{title,lyrics,src,doc}], errors:[{name,why}]}>
        EvoImport.fromText(text, name?) -> {title, lyrics}
        EvoImport.splitDoc(lyrics) -> [{title, lyrics}]   (one document holding many songs, split at 2+ blank lines) */
(function(){
'use strict';
var SEP=/\s*===EVONOTE===\s*/;
var MAXFILE=60*1024*1024;

/* ---------- small helpers ---------- */
function clean(s){return String(s==null?'':s).replace(/\r\n?/g,'\n').replace(/[\u200b\ufeff]/g,'').replace(/\u00a0/g,' ')}
function trimLines(ls){ls=ls.map(function(l){return l.replace(/[ \t]+$/,'')});while(ls.length&&!ls[0].trim())ls.shift();while(ls.length&&!ls[ls.length-1].trim())ls.pop();
  var o=[],blank=0;ls.forEach(function(l){if(!l.trim()){if(++blank>2)return}else blank=0;o.push(l)});return o}
function baseName(n){n=String(n||'').split('/').pop();return n.replace(/\.[A-Za-z0-9]{1,6}$/,'')}
function ext(n){var m=/\.([A-Za-z0-9]{1,6})$/.exec(String(n||''));return m?m[1].toLowerCase():''}
function norm(s){return String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'')}
function isLabel(l){return /^\[.+\]$/.test(String(l).trim())}
/* a note: the first line is its title (as in Apple Notes, Mi Notes, Keep…), unless it is a section label */
function fromText(text,name){var ls=trimLines(clean(text).split('\n'));if(!ls.length)return{title:name?baseName(name):'',lyrics:''};
  var first=ls[0].trim(),title,body;
  if(name&&norm(first)===norm(baseName(name))){title=first.replace(/^#+\s*/,'');body=ls.slice(1)}
  else if(name&&!autoName(baseName(name))&&ls.length>1){title=baseName(name);body=ls}
  else if(isLabel(first)){title='';body=ls}
  else{title=first.replace(/^#+\s*/,'');body=ls.slice(1)}
  while(body.length&&!body[0].trim())body.shift();
  return{title:title.slice(0,120),lyrics:body.join('\n')}}
function autoName(b){return !b||/^(note|notes|untitled|new note|catatan|catatan baru|document|dokumen|memo|text|teks|samsung notes?)([ _\-.\d()]|$)/i.test(b)||/^[\d _\-.:()]+$/.test(b)||isUuid(b)}
function isUuid(s){return /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(s)}
function splitEvo(text){return clean(text).split(SEP).map(function(p){var ls=trimLines(p.split('\n'));if(!ls.length)return null;var f=ls[0].trim(),lab=isLabel(f);
  var b=lab?ls:ls.slice(1);while(b.length&&!b[0].trim())b.shift();return{title:lab?'':f.slice(0,120),lyrics:b.join('\n')}}).filter(Boolean)}
/* one document with many songs: a new song starts after two or more blank lines */
function splitDoc(lyrics){var parts=clean(lyrics).split(/\n[ \t]*\n[ \t]*\n+/);
  return parts.map(function(p){return fromText(p)}).filter(function(x){return x.lyrics.trim()||x.title})}

/* ---------- colour -> EvoLyric highlight ---------- */
var NAMED={yellow:'#ffff00',green:'#00ff00',lime:'#00ff00',cyan:'#00ffff',aqua:'#00ffff',blue:'#0000ff',magenta:'#ff00ff',fuchsia:'#ff00ff',red:'#ff0000',orange:'#ffa500',purple:'#800080',violet:'#ee82ee',pink:'#ffc0cb',gold:'#ffd700',darkblue:'#00008b',darkcyan:'#008b8b',darkgreen:'#006400',darkmagenta:'#8b008b',darkred:'#8b0000',darkyellow:'#808000',teal:'#008080',navy:'#000080',indigo:'#4b0082'};
function rgb(c){c=String(c||'').trim().toLowerCase();if(!c||c==='auto'||c==='none'||c==='transparent'||c==='inherit')return null;if(NAMED[c])c=NAMED[c];
  var m=/^#?([0-9a-f]{6})$/.exec(c);if(m){var n=parseInt(m[1],16);return[n>>16&255,n>>8&255,n&255]}
  m=/^#([0-9a-f]{3})$/.exec(c);if(m)return m[1].split('').map(function(h){return parseInt(h+h,16)});
  m=/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?\s*\)$/.exec(c);if(m){if(m[4]!=null&&parseFloat(m[4])===0)return null;return[+m[1],+m[2],+m[3]]}
  return null}
function hue(c,minSat){var p=rgb(c);if(!p)return '';var r=p[0]/255,g=p[1]/255,b=p[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;
  if(d<0.0001)return '';var s=l>0.5?d/(2-mx-mn):d/(mx+mn);if(s<(minSat||0.3)||l<0.12||l>0.94)return '';
  var h;if(mx===r)h=((g-b)/d+(g<b?6:0));else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;
  return h<15||h>=345?'r':h<40?'o':h<70?'y':h<170?'g':h<250?'b':h<275?'i':'v'}
var WORDHL={yellow:'y',green:'g',darkgreen:'g',cyan:'b',darkcyan:'b',blue:'b',darkblue:'i',magenta:'v',darkmagenta:'v',red:'r',darkred:'r',darkyellow:'o'};
/* runs [{t,c}] for one line -> text with {c:…} marks; braces in the text keep it plain */
function marks(runs){var out='',cur='',buf='';function flush(){if(!buf)return;if(cur&&!/[{}]/.test(buf)&&buf.trim())out+='{'+cur+':'+buf+'}';else out+=buf;buf=''}
  runs.forEach(function(r){var c=r.c||'';if(c!==cur){flush();cur=c}buf+=r.t});flush();return out}
/* runs with '\n' inside -> lines */
function runsToText(runs){var lines=[[]];runs.forEach(function(r){var ps=r.t.split('\n');ps.forEach(function(p,i){if(i>0)lines.push([]);if(p)lines[lines.length-1].push({t:p,c:r.c})})});
  return lines.map(marks).join('\n')}

/* ---------- HTML / ENML / Keep ---------- */
var BLOCK=/^(p|div|li|h[1-6]|tr|blockquote|pre|en-todo|section|article|ul|ol|table|title)$/i;
function htmlRuns(root){var runs=[];function nl(){if(runs.length&&!/\n$/.test(runs[runs.length-1].t))runs.push({t:'\n',c:''})}
  function walk(n,c){if(n.nodeType===3){var t=n.nodeValue.replace(/[ \t\r\n]+/g,' ');if(t)runs.push({t:t,c:c});return}
    if(n.nodeType!==1)return;var tag=n.tagName.toLowerCase();if(tag==='script'||tag==='style'||tag==='head')return;
    if(tag==='br'){runs.push({t:'\n',c:''});return}
    var cc=c,st=n.getAttribute&&n.getAttribute('style')||'',m;
    if(tag==='mark')cc='y';
    if((m=/(?:^|;)\s*(?:background-color|background|--en-highlight)\s*:\s*([^;]+)/i.exec(st))){var h=hue(m[1],0.2);if(h)cc=h}
    else if((m=/(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(st))){var h2=hue(m[1],0.45);if(h2)cc=h2}
    if(tag==='font'&&n.getAttribute('color')){var h3=hue(n.getAttribute('color'),0.45);if(h3)cc=h3}
    var blk=BLOCK.test(tag);if(blk)nl();for(var k=n.firstChild;k;k=k.nextSibling)walk(k,cc);if(blk)nl()}
  walk(root,'');return runs}
function htmlToText(html){var d=new DOMParser().parseFromString(String(html),'text/html');return clean(runsToText(htmlRuns(d.body||d.documentElement))).split('\n').map(function(l){return l.replace(/^ +| +$/g,'')}).join('\n')}
function fromHtml(html,name){var d=new DOMParser().parseFromString(String(html),'text/html');
  var kt=d.querySelector('.title'),kc=d.querySelector('.content'); /* Google Keep note */
  if(kc){return{title:(kt?kt.textContent.trim():'')||baseName(name),lyrics:trimLines(htmlToText(kc.innerHTML).split('\n')).join('\n')}}
  var t=htmlToText(d.body?d.body.innerHTML:html);var r=fromText(t,(d.title||'').trim()?d.title.trim()+'.html':name);if(d.title&&d.title.trim())r.title=d.title.trim().slice(0,120);return r}
function fromEnex(xml){var d=new DOMParser().parseFromString(String(xml),'application/xml'),out=[];
  Array.prototype.forEach.call(d.getElementsByTagName('note'),function(n){var t=n.getElementsByTagName('title')[0],c=n.getElementsByTagName('content')[0];
    var body=c?htmlToText(c.textContent.replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>/g,'').replace(/<(\/?)en-note/g,'<$1div')):'';
    var ls=trimLines(body.split('\n'));var title=t?t.textContent.trim():'';if(ls.length&&norm(ls[0])===norm(title))ls.shift();
    out.push({title:title.slice(0,120),lyrics:trimLines(ls).join('\n'),src:'Evernote'})});return out}

/* ---------- RTF ---------- */
var CP1252={128:8364,130:8218,131:402,132:8222,133:8230,134:8224,135:8225,136:710,137:8240,138:352,139:8249,140:338,142:381,145:8216,146:8217,147:8220,148:8221,149:8226,150:8211,151:8212,152:732,153:8482,154:353,155:8250,156:339,158:382,159:376};
function rtfToText(s){s=String(s);var i=0,n=s.length,runs=[],colors=[],stack=[],st={skip:false,hl:'',fg:'',uc:1},skipN=0;
  var DEST=/^(fonttbl|colortbl|stylesheet|info|pict|object|header|footer|headerl|headerr|footerl|footerr|listtable|listoverridetable|rsidtbl|generator|xmlnstbl|themedata|colorschememapping|latentstyles|datastore|fldinst|filetbl|revtbl|pgdsctbl)$/;
  function put(t){if(skipN>0){var k=Math.min(skipN,t.length);skipN-=k;t=t.slice(k);if(!t)return}if(!st.skip)runs.push({t:t,c:st.hl||st.fg})}
  var inColTbl=false,cur=[null,null,null],colDepth=-1;
  while(i<n){var ch=s[i];
    if(ch==='{'){stack.push({skip:st.skip,hl:st.hl,fg:st.fg,uc:st.uc});i++;continue}
    if(ch==='}'){var p=stack.pop();if(p){st.skip=p.skip;st.hl=p.hl;st.fg=p.fg;st.uc=p.uc}if(inColTbl&&stack.length<colDepth)inColTbl=false;i++;continue}
    if(ch==='\\'){var nx=s[i+1];
      if(nx==='\\'||nx==='{'||nx==='}'){put(nx);i+=2;continue}
      if(nx==='\''){var code=parseInt(s.substr(i+2,2),16);put(String.fromCharCode(CP1252[code]||code));i+=4;continue}
      if(nx==='*'){st.skip=true;i+=2;continue}
      if(nx==='~'){put(' ');i+=2;continue}
      if(nx==='-'||nx==='_'){i+=2;continue}
      if(nx==='\n'||nx==='\r'){put('\n');i+=2;continue}
      var m=/^\\([a-zA-Z]+)(-?\d+)? ?/.exec(s.slice(i,i+40));if(!m){i++;continue}
      var w=m[1],v=m[2]!=null?+m[2]:null;i+=m[0].length;
      if(DEST.test(w)){if(w==='colortbl'){inColTbl=true;colDepth=stack.length;colors=[];cur=[0,0,0]}else st.skip=true;continue}
      if(inColTbl){if(w==='red')cur[0]=v;else if(w==='green')cur[1]=v;else if(w==='blue')cur[2]=v;continue}
      if(w==='par'||w==='line'||w==='sect'||w==='page'){put('\n');continue}
      if(w==='tab'){put('\t');continue}
      if(w==='u'){var cc2=v<0?v+65536:v;put(String.fromCharCode(cc2));skipN=st.uc;continue}
      if(w==='uc'){st.uc=v||0;continue}
      if(w==='highlight'||w==='cb'||w==='chcbpat'){var c1=v?colors[v]:null;st.hl=c1?hue('rgb('+c1.join(',')+')',0.2):'';continue}
      if(w==='cf'){var c2=v?colors[v]:null;st.fg=c2?hue('rgb('+c2.join(',')+')',0.45):'';continue}
      if(w==='plain'){st.hl='';st.fg='';continue}
      continue}
    if(inColTbl){if(ch===';'){colors.push(cur);cur=[0,0,0]}i++;continue}
    if(ch==='\r'||ch==='\n'){i++;continue}
    var j=i;while(j<n&&s[j]!=='\\'&&s[j]!=='{'&&s[j]!=='}'&&s[j]!=='\r'&&s[j]!=='\n')j++;put(s.slice(i,j));i=j}
  return clean(runsToText(runs))}

/* ---------- ZIP (stored + deflate, via DecompressionStream) ---------- */
function u16(b,o){return b[o]|b[o+1]<<8}function u32(b,o){return(b[o]|b[o+1]<<8|b[o+2]<<16|b[o+3]<<24)>>>0}
function canZip(){return typeof DecompressionStream==='function'}
function inflate(data){if(!canZip())return Promise.reject(new Error('nozip'));var ds=new DecompressionStream('deflate-raw');
  var w=new Blob([data]).stream().pipeThrough(ds);return new Response(w).arrayBuffer().then(function(a){return new Uint8Array(a)})}
function unzip(buf){var b=new Uint8Array(buf),e=-1;for(var i=b.length-22;i>=Math.max(0,b.length-66000);i--){if(u32(b,i)===0x06054b50){e=i;break}}
  if(e<0)throw new Error('badzip');var cnt=u16(b,e+10),off=u32(b,e+16),out=[],utf=new TextDecoder('utf-8');
  for(var k=0;k<cnt;k++){if(u32(b,off)!==0x02014b50)break;var meth=u16(b,off+10),csz=u32(b,off+20),nl=u16(b,off+28),xl=u16(b,off+30),cl=u16(b,off+32),lo=u32(b,off+42);
    var name=utf.decode(b.subarray(off+46,off+46+nl));off+=46+nl+xl+cl;
    (function(name,meth,csz,lo){if(/\/$/.test(name))return;out.push({name:name,read:function(){var ds=lo+30+u16(b,lo+26)+u16(b,lo+28),raw=b.subarray(ds,ds+csz);
      if(meth===0)return Promise.resolve(raw);if(meth===8)return inflate(raw);return Promise.reject(new Error('method'))}})})(name,meth,csz,lo)}
  return out}

/* ---------- DOCX ---------- */
function docxText(xml){var d=new DOMParser().parseFromString(xml,'application/xml'),W='http://schemas.openxmlformats.org/wordprocessingml/2006/main',runs=[];
  function attr(el,a){return el?(el.getAttributeNS(W,a)||el.getAttribute('w:'+a)):null}
  function first(el,tag){var l=el.getElementsByTagNameNS(W,tag);return l.length?l[0]:null}
  var body=first(d,'body')||d.documentElement;
  Array.prototype.forEach.call(body.getElementsByTagNameNS(W,'p'),function(p){
    Array.prototype.forEach.call(p.getElementsByTagNameNS(W,'r'),function(r){var pr=first(r,'rPr'),c='';
      if(pr){var hl=first(pr,'highlight'),sh=first(pr,'shd'),col=first(pr,'color');
        if(hl&&attr(hl,'val'))c=WORDHL[String(attr(hl,'val')).toLowerCase()]||'';
        if(!c&&sh&&attr(sh,'fill'))c=hue('#'+attr(sh,'fill'),0.2);
        if(!c&&col&&attr(col,'val'))c=hue('#'+attr(col,'val'),0.45)}
      for(var k=r.firstChild;k;k=k.nextSibling){var ln=k.localName;if(ln==='t')runs.push({t:k.textContent,c:c});else if(ln==='tab')runs.push({t:'\t',c:''});else if(ln==='br'||ln==='cr')runs.push({t:'\n',c:''})}});
    runs.push({t:'\n',c:''})});
  return clean(runsToText(runs))}

/* ---------- text decoding ---------- */
function decode(u8){if(u8[0]===0xff&&u8[1]===0xfe)return new TextDecoder('utf-16le').decode(u8);if(u8[0]===0xfe&&u8[1]===0xff)return new TextDecoder('utf-16be').decode(u8);
  try{return new TextDecoder('utf-8',{fatal:true}).decode(u8)}catch(e){return new TextDecoder('windows-1252').decode(u8)}}

/* ---------- JSON: Google Keep note, Simplenote export ---------- */
function fromJson(text,name){var j;try{j=JSON.parse(text)}catch(e){return null}
  if(j&&Array.isArray(j.activeNotes))return j.activeNotes.map(function(x){var r=fromText(x.content||'');r.src='Simplenote';return r}).filter(function(x){return x.title||x.lyrics});
  if(j&&(typeof j.textContent==='string'||Array.isArray(j.listContent))){if(j.isTrashed)return[];
    var body=typeof j.textContent==='string'?j.textContent:j.listContent.map(function(x){return x.text}).join('\n');
    var ls=trimLines(clean(body).split('\n'));var title=(j.title||'').trim();if(!title&&ls.length&&!isLabel(ls[0])){title=ls.shift().trim()}
    return[{title:title.slice(0,120),lyrics:trimLines(ls).join('\n'),src:'Google Keep'}]}
  return null}

/* ---------- ColorNote backup (Android): AES-128-CBC, key/iv = OpenSSL MD5 key derivation of the password with
   the fixed salt "ColorNote Fixed Salt", 28-byte header; default password 0000. Inside: JSON note objects. ---------- */
function md5(bytes){var K=[],S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  for(var i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296)>>>0;
  var n=bytes.length,len=((n+8>>6)+1)*64,m=new Uint8Array(len);m.set(bytes);m[n]=0x80;var bits=n*8;for(i=0;i<8;i++)m[len-8+i]=Math.floor(bits/Math.pow(2,8*i))&255;
  var a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  for(var o=0;o<len;o+=64){var M=[];for(i=0;i<16;i++)M[i]=m[o+i*4]|m[o+i*4+1]<<8|m[o+i*4+2]<<16|m[o+i*4+3]<<24;
    var A=a0,B=b0,C=c0,D=d0;for(i=0;i<64;i++){var F,g;if(i<16){F=(B&C)|(~B&D);g=i}else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16}else if(i<48){F=B^C^D;g=(3*i+5)%16}else{F=C^(B|~D);g=(7*i)%16}
      F=(F+A+K[i]+M[g])>>>0;A=D;D=C;C=B;B=(B+((F<<S[i])|(F>>>(32-S[i]))))>>>0}
    a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+C)>>>0;d0=(d0+D)>>>0}
  var out=new Uint8Array(16);[a0,b0,c0,d0].forEach(function(v,j){for(var k=0;k<4;k++)out[j*4+k]=v>>>(8*k)&255});return out}
function cat(){var l=0,i;for(i=0;i<arguments.length;i++)l+=arguments[i].length;var o=new Uint8Array(l),p=0;for(i=0;i<arguments.length;i++){o.set(arguments[i],p);p+=arguments[i].length}return o}
function cnDecrypt(u8,pw){if(!(window.crypto&&crypto.subtle))return Promise.reject(new Error('nocrypto'));if(u8.length<44)return Promise.reject(new Error('bad'));
  var P=new TextEncoder().encode(pw),Sl=new TextEncoder().encode('ColorNote Fixed Salt'),key=md5(cat(P,Sl)),iv=md5(cat(key,P,Sl));
  return crypto.subtle.importKey('raw',key,{name:'AES-CBC'},false,['decrypt']).then(function(k){return crypto.subtle.decrypt({name:'AES-CBC',iv:iv},k,u8.subarray(28))})
    .then(function(b){return new TextDecoder('utf-8').decode(b)},function(){throw new Error('cnpw')})}
function jsonObjects(t){var out=[],i=0,n=t.length;while(i<n){var s0=t.indexOf('{',i);if(s0<0)break;var bal=0,q=false,esc=false,e=-1;
    for(var j=s0;j<n;j++){var c=t[j];if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c==='"'){q=!q;continue}if(q)continue;if(c==='{')bal++;else if(c==='}'&&--bal===0){e=j;break}}
    if(e<0){i=s0+1;continue}try{out.push(JSON.parse(t.slice(s0,e+1)));i=e+1}catch(x){i=s0+1}}return out}
function cnNotes(text){return jsonObjects(text).filter(function(o){return o&&typeof o.note==='string'&&o.type!==128&&o.type!==256&&!o.encrypted&&o.active_state!==16&&o.active_state!==32}).map(function(o){
  var t=clean(o.note),c=new Array(t.length).fill('');
  try{var ext=o.note_ext?JSON.parse(o.note_ext):null;(ext&&ext.format_list||[]).forEach(function(f){if(f.format!=='bg_color'||!f.attribute)return;var h=hue(String(f.attribute).replace(/^highlight_/,''),0.2);if(!h)return;for(var k=Math.max(0,f.start);k<Math.min(t.length,f.end);k++)c[k]=h})}catch(x){}
  var runs=[];for(var k=0;k<t.length;k++){if(runs.length&&runs[runs.length-1].c===c[k])runs[runs.length-1].t+=t[k];else runs.push({t:t[k],c:c[k]})}
  var body=runsToText(runs);if(o.type===16)body=body.split('\n').map(function(l){return l.replace(/^\s*\[[ vVxX]?\]\s*/,'')}).join('\n');
  var ls=trimLines(body.split('\n')),title=String(o.title||'').trim();if(!title&&ls.length&&!isLabel(ls[0]))title=ls.shift().trim();else if(ls.length&&norm(ls[0])===norm(title))ls.shift();
  return{title:title.slice(0,120),lyrics:trimLines(ls).join('\n'),src:'ColorNote'}})}
function isColorNote(name,u8){var x=ext(name);if(/^(backup|dat|db)$/.test(x))return true;if(/colornote/i.test(name))return true;return x==='doc'&&!(u8[0]===0xd0&&u8[1]===0xcf)}
/* ---------- one file ---------- */
var SKIP=/(^|\/)(__MACOSX|\.[^/]*)(\/|$)|(^|\/)(desktop\.ini|thumbs\.db)$/i;
function readEntry(name,u8,depth,res){var x=ext(name);
  if(x==='zip'){if(depth>2)return Promise.resolve();var es;try{es=unzip(u8)}catch(e){res.errors.push({name:name,why:'badzip'});return Promise.resolve()}
    es=es.filter(function(e){return !SKIP.test(e.name)});
    var sn=es.filter(function(e){return /(^|\/)notes\.json$/i.test(e.name)}); /* Simplenote: its notes.json already holds every active note */
    var keepJson={},anyJson=false;es.forEach(function(e){if(/\.json$/i.test(e.name)){anyJson=true;keepJson[e.name.replace(/\.json$/i,'').toLowerCase()]=1}});
    var use=sn.length?sn:es.filter(function(e){var b=e.name.replace(/\.[^.\/]+$/,'').toLowerCase();return !(/\.html?$/i.test(e.name)&&(keepJson[b]||anyJson||/archive_browser/i.test(e.name)))&&/\.(txt|md|markdown|text|html?|rtf|docx|enex|json|zip)$/i.test(e.name)});
    return use.reduce(function(p,e){return p.then(function(){return e.read().then(function(d){return readEntry(e.name,d,depth+1,res)},function(err){res.errors.push({name:e.name,why:err&&err.message==='nozip'?'nozip':'bad'})})})},Promise.resolve())}
  if(x==='docx'){var es2;try{es2=unzip(u8)}catch(e){res.errors.push({name:name,why:'bad'});return Promise.resolve()}
    var doc=es2.filter(function(e){return e.name==='word/document.xml'})[0];if(!doc){res.errors.push({name:name,why:'bad'});return Promise.resolve()}
    return doc.read().then(function(d){add(res,docText(docxText(decode(d)),name,'Word'))},function(err){res.errors.push({name:name,why:err&&err.message==='nozip'?'nozip':'bad'})})}
  if(isColorNote(name,u8)&&depth===0){var tryPw=function(pw,left){return cnDecrypt(u8,pw).then(function(t){var ns=cnNotes(t);if(!ns.length)throw new Error('empty');add(res,ns)},function(err){
      if(err&&err.message==='cnpw'&&left>0&&res.ask)return Promise.resolve(res.ask(name,pw!=='0000')).then(function(p2){if(p2==null||p2==='')throw new Error('cnpw');return tryPw(String(p2),left-1)});throw err})};
    return tryPw('0000',3).catch(function(err){res.errors.push({name:name,why:err&&/^(cnpw|empty)$/.test(err.message)?err.message:err&&err.message==='nocrypto'?'nozip':'bad'})})}
  if(/^(pages|key|numbers)$/.test(x)){res.errors.push({name:name,why:'pages'});return Promise.resolve()}
  if(x==='doc'){res.errors.push({name:name,why:'doc'});return Promise.resolve()}
  var t=decode(u8);
  if(x==='enex'){fromEnex(t).forEach(function(n){add(res,[n])});return Promise.resolve()}
  if(x==='json'){var j=fromJson(t,name);if(j)add(res,j);else if(depth===0)res.errors.push({name:name,why:'unknown'});return Promise.resolve()}
  if(x==='rtf'||/^\{\\rtf/.test(t)){add(res,docText(rtfToText(t),name,'RTF'));return Promise.resolve()}
  if(x==='html'||x==='htm'){var h=fromHtml(t,name);h.src='HTML';add(res,[h]);return Promise.resolve()}
  if(x&&!/^(txt|text|md|markdown|csv|lrc)$/.test(x)&&/[\x00-\x08\x0e-\x1a]/.test(t.slice(0,2000))){res.errors.push({name:name,why:'unknown'});return Promise.resolve()}
  add(res,docText(x==='md'||x==='markdown'?t.replace(/==([^=\n{}]+)==/g,'{y:$1}'):t,name,x?x.toUpperCase():'Text'));return Promise.resolve()}
/* a whole document: ===EVONOTE=== splits it; otherwise one song (the preview can split it further) */
function docText(t,name,src){if(SEP.test(t))return splitEvo(t).map(function(p){p.src=src;return p});var r=fromText(t,name);r.src=src;r.doc=true;return[r]}
function add(res,list){list.forEach(function(it){if(!it)return;it.title=String(it.title||'').trim();it.lyrics=String(it.lyrics||'');if(!it.title&&!it.lyrics.trim())return;res.items.push(it)})}
function read(files,opt){var res={items:[],errors:[],ask:opt&&opt.password};files=Array.prototype.slice.call(files||[]);
  return files.reduce(function(p,f){return p.then(function(){if(f.size>MAXFILE){res.errors.push({name:f.name,why:'big'});return}
    return f.arrayBuffer().then(function(a){return readEntry(f.name,new Uint8Array(a),0,res)}).catch(function(){res.errors.push({name:f.name,why:'bad'})})})},Promise.resolve()).then(function(){delete res.ask;return res})}
window.EvoImport={read:read,fromText:fromText,splitDoc:splitDoc,canZip:canZip,_t:{rtfToText:rtfToText,htmlToText:htmlToText,hue:hue,unzip:unzip}};
})();
