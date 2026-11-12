/* EvoLyric cloud sync (Supabase). One module, no second Supabase client: it receives the app's client through hooks.
 *
 * Model
 *  - Local library (songs[] / cats[]) stays the source of the UI and is always cached in localStorage.
 *    Guest   -> evolyric-v1 / evolyric-cats-v1 (untouched while signed in, never deleted).
 *    Account -> evolyric-v1:u:<uid> / evolyric-cats-v1:u:<uid>   (one cache per Google account).
 *  - Cloud rows: songs / categories / song_categories. App id <-> Supabase UUID through local_id; everything else
 *    (speed, font, key, colors, fav, ...) lives in app_data (JSONB).
 *  - "base" = what this device last knew to be in the cloud (persisted). Pending changes are simply
 *    diff(local, base), so an interrupted push/migration is retried automatically and safely (all writes are idempotent).
 *  - Sync cycle (serialised): push local changes, then pull + 3-way merge (local / base / cloud).
 *    Nothing is ever deleted from the cloud unless the user deleted it locally. Guest data is merged only once per account
 *    per device and only additively.
 */
(function () {
  'use strict';
  var SK = 'evolyric-sync-v1:', MK = 'evolyric-mig-v1:';
  var H = null, uid = null, S = null, run = null, rerun = false, tmr = null, retryT = null, rtTries = 0, deferred = false;
  var SB = null, chan = null, lastRun = 0, st = 'guest', stMsg = '', lastOk = 0, toasted = '', listening = false, rtTimer = null, pending = false;

  /* ---------- helpers ---------- */
  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  function sj(o) { /* stable JSON (sorted keys) so equal objects compare equal */
    return JSON.stringify(o, function (k, v) {
      if (v && typeof v === 'object' && !Array.isArray(v)) { var r = {}; Object.keys(v).sort().forEach(function (x) { r[x] = v[x]; }); return r; }
      return v;
    });
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function chunk(a, n) { var r = []; for (var i = 0; i < a.length; i += n) r.push(a.slice(i, i + n)); return r; }
  var RS = ['id', 'title', 'artist', 'lyrics'], RC = ['id', 'name', 'ids'];
  function rest(o, res) { var r = {}; for (var k in o) if (res.indexOf(k) < 0 && o[k] !== undefined) r[k] = o[k]; return r; }
  function sRec(s) { return sj({ t: s.title || '', a: s.artist || '', l: s.lyrics || '', d: rest(s, RS) }); }
  function cRec(c) { return sj({ n: c.name || '', d: rest(c, RC) }); }
  function sig(s) { return String(s.title || '').trim().toLowerCase() + '|' + String(s.artist || '').trim().toLowerCase() + '|' + String(s.lyrics || '').trim(); }
  function isNet(e) { var m = String((e && e.message) || e || ''); return !navigator.onLine || e instanceof TypeError || /failed to fetch|networkerror|network request|load failed|fetch/i.test(m); }

  function loadS() { try { var r = LS.get(SK + uid); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function saveS() { if (S && uid) LS.set(SK + uid, JSON.stringify(S)); }

  /* ---------- local snapshot / diff ---------- */
  function snap(lib) {
    var s = {}, c = {}, r = {};
    lib.songs.forEach(function (x) { if (x && x.id) s[x.id] = sRec(x); });
    lib.cats.forEach(function (x) {
      if (x && x.id) { c[x.id] = cRec(x); r[x.id] = Array.from(new Set(x.ids || [])).filter(function (i) { return s[i] !== undefined; }).sort(); }
    });
    return { s: s, c: c, r: r };
  }
  function diff(L, B) {
    var d = { sUp: [], sDel: [], cUp: [], cDel: [], rAdd: {}, rDel: {} }, k;
    for (k in L.s) if (L.s[k] !== B.s[k]) d.sUp.push(k);
    for (k in B.s) if (!(k in L.s)) d.sDel.push(k);
    for (k in L.c) if (L.c[k] !== B.c[k]) d.cUp.push(k);
    for (k in B.c) if (!(k in L.c)) d.cDel.push(k);
    for (k in L.c) {
      var b = new Set(B.r[k] || []), l = new Set(L.r[k] || []);
      var add = Array.from(l).filter(function (x) { return !b.has(x); });
      var del = Array.from(b).filter(function (x) { return !l.has(x) && (x in L.s); });
      if (add.length) d.rAdd[k] = add;
      if (del.length) d.rDel[k] = del;
    }
    return d;
  }
  function isEmptyDiff(d) { return !d.sUp.length && !d.sDel.length && !d.cUp.length && !d.cDel.length && !Object.keys(d.rAdd).length && !Object.keys(d.rDel).length; }
  function hasPending() { if (!S || !H) return false; try { return !isEmptyDiff(diff(snap(H.get()), S.base)); } catch (e) { return false; } }

  /* ---------- reading the cloud (always scoped to the signed-in user; RLS enforces it again server side) ---------- */
  async function page(sb, table, cols, scoped, orders) {
    var out = [];
    for (var f = 0; ; f += 1000) {
      var q = sb.from(table).select(cols);
      if (scoped) q = q.eq('user_id', uid);
      orders.forEach(function (o) { q = q.order(o, { ascending: true }); });
      var r = await q.range(f, f + 999);
      if (r.error) throw r.error;
      Array.prototype.push.apply(out, r.data || []);
      if (!r.data || r.data.length < 1000) break;
    }
    return out;
  }
  async function readCloud(sb) {
    var res = await Promise.all([
      page(sb, 'songs', 'id,local_id,title,artist,lyrics,app_data,created_at', true, ['created_at', 'id']),
      page(sb, 'categories', 'id,local_id,name,app_data,created_at', true, ['created_at', 'id']),
      page(sb, 'song_categories', 'song_id,category_id', false, ['song_id', 'category_id'])
    ]);
    var C = { s: {}, c: {}, r: {}, os: [], oc: [] }, u2s = {}, u2c = {}, seenS = {}, seenC = {};
    res[0].forEach(function (row) {
      var lid = row.local_id || ('r' + String(row.id).replace(/-/g, '').slice(0, 12));
      if (seenS[lid]) lid = lid + '~' + String(row.id).slice(0, 8);
      seenS[lid] = 1; u2s[row.id] = lid;
      var obj = Object.assign({}, row.app_data || {}, { id: lid, title: row.title || '', artist: row.artist || '', lyrics: row.lyrics || '' });
      C.s[lid] = { uuid: row.id, obj: obj, json: sRec(obj) }; C.os.push(lid);
    });
    res[1].forEach(function (row) {
      var lid = row.local_id || ('rc' + String(row.id).replace(/-/g, '').slice(0, 12));
      if (seenC[lid]) lid = lid + '~' + String(row.id).slice(0, 8);
      seenC[lid] = 1; u2c[row.id] = lid;
      var obj = Object.assign({}, row.app_data || {}, { id: lid, name: row.name || '', ids: [] });
      C.c[lid] = { uuid: row.id, obj: obj, json: cRec(obj) }; C.oc.push(lid); C.r[lid] = [];
    });
    res[2].forEach(function (p) {
      var sl = u2s[p.song_id], cl = u2c[p.category_id];
      if (sl && cl && C.r[cl].indexOf(sl) < 0) C.r[cl].push(sl);
    });
    return C;
  }
  function baseFromCloud(C) {
    var B = { s: {}, c: {}, r: {} };
    Object.keys(C.s).forEach(function (k) { B.s[k] = C.s[k].json; });
    Object.keys(C.c).forEach(function (k) { B.c[k] = C.c[k].json; B.r[k] = C.r[k].slice().sort(); });
    return B;
  }
  function mapFromCloud(C, M) {
    Object.keys(C.s).forEach(function (k) { M.s[k] = C.s[k].uuid; });
    Object.keys(C.c).forEach(function (k) { M.c[k] = C.c[k].uuid; });
  }

  /* ---------- push (local -> cloud). Idempotent: upsert by primary key, delete-then-insert for relations ---------- */
  async function push(sb) {
    var L = snap(H.get()), B = S.base, d = diff(L, B);
    if (isEmptyDiff(d)) return false;
    var M = S.map, now = new Date().toISOString(), lib = H.get(), k;
    var sById = {}, cById = {};
    lib.songs.forEach(function (x) { sById[x.id] = x; });
    lib.cats.forEach(function (x) { cById[x.id] = x; });
    d.sUp.forEach(function (x) { if (!M.s[x]) M.s[x] = uuid(); });
    d.cUp.forEach(function (x) { if (!M.c[x]) M.c[x] = uuid(); });
    saveS(); /* remember generated ids so a retry reuses them (no duplicates) */
    function ck(r) { if (r && r.error) throw r.error; }

    /* 1. relations that must go */
    var delSongU = d.sDel.map(function (x) { return M.s[x]; }).filter(Boolean);
    var delCatU = d.cDel.map(function (x) { return M.c[x]; }).filter(Boolean);
    for (var a of chunk(delSongU, 100)) ck(await sb.from('song_categories').delete().in('song_id', a));
    for (a of chunk(delCatU, 100)) ck(await sb.from('song_categories').delete().in('category_id', a));
    for (k in d.rDel) {
      var cu = M.c[k], su = d.rDel[k].map(function (x) { return M.s[x]; }).filter(Boolean);
      if (cu && su.length) ck(await sb.from('song_categories').delete().eq('category_id', cu).in('song_id', su));
    }
    /* 2. rows */
    var sRows = d.sUp.map(function (x) {
      var s = sById[x];
      return { id: M.s[x], user_id: uid, local_id: x, title: s.title || '', artist: s.artist || '', lyrics: s.lyrics || '', app_data: rest(s, RS), updated_at: now };
    });
    for (a of chunk(sRows, 200)) ck(await sb.from('songs').upsert(a, { onConflict: 'id' }));
    var cRows = d.cUp.map(function (x) {
      var c = cById[x];
      return { id: M.c[x], user_id: uid, local_id: x, name: c.name || '', app_data: rest(c, RC), updated_at: now };
    });
    for (a of chunk(cRows, 200)) ck(await sb.from('categories').upsert(a, { onConflict: 'id' }));
    /* 3. relations to add (delete the same pairs first so a retry can never duplicate them) */
    for (k in d.rAdd) {
      var cu2 = M.c[k], su2 = d.rAdd[k].map(function (x) { return M.s[x]; }).filter(Boolean);
      if (!cu2 || !su2.length) continue;
      for (a of chunk(su2, 100)) {
        ck(await sb.from('song_categories').delete().eq('category_id', cu2).in('song_id', a));
        ck(await sb.from('song_categories').insert(a.map(function (s) { return { song_id: s, category_id: cu2 }; })));
      }
    }
    /* 4. finally remove rows the user deleted */
    for (a of chunk(delSongU, 100)) ck(await sb.from('songs').delete().eq('user_id', uid).in('id', a));
    for (a of chunk(delCatU, 100)) ck(await sb.from('categories').delete().eq('user_id', uid).in('id', a));
    d.sDel.forEach(function (x) { delete M.s[x]; });
    d.cDel.forEach(function (x) { delete M.c[x]; });
    S.base = L; saveS();
    return true;
  }

  /* ---------- pull + 3-way merge (cloud -> local) ---------- */
  function decide(l, b, c) { /* l/b/c = record JSON or undefined */
    if (l === b) return c === undefined ? 'drop' : 'cloud';        /* untouched locally: mirror the cloud */
    if (l === undefined) return (c !== undefined && c !== b) ? 'cloud' : 'drop'; /* deleted locally; keep it only if edited remotely */
    return 'local';                                                /* changed locally: local wins, pushed next */
  }
  function fillInPlace(o, n) { Object.keys(o).forEach(function (k) { delete o[k]; }); Object.assign(o, n); return o; }

  async function pull(sb) {
    var C = await readCloud(sb);
    if (H.busy()) { deferred = true; return; }
    deferred = false;
    var lib = H.get(), L = snap(lib), B = S.base, M = S.map, k;
    var Cs = {}, Cc = {};
    Object.keys(C.s).forEach(function (x) { Cs[x] = C.s[x].json; });
    Object.keys(C.c).forEach(function (x) { Cc[x] = C.c[x].json; });
    var nb = { s: {}, c: {}, r: {} };
    var sDec = {}, cDec = {};
    function all(a, b, c) { var u = {}; [a, b, c].forEach(function (o) { Object.keys(o).forEach(function (x) { u[x] = 1; }); }); return Object.keys(u); }
    all(L.s, B.s, Cs).forEach(function (x) {
      var dc = sDec[x] = decide(L.s[x], B.s[x], Cs[x]);
      if (dc === 'cloud') nb.s[x] = Cs[x]; else if (dc === 'drop' && Cs[x] !== undefined) nb.s[x] = B.s[x]; else if (dc === 'local' && B.s[x] !== undefined) nb.s[x] = B.s[x];
    });
    all(L.c, B.c, Cc).forEach(function (x) {
      var dc = cDec[x] = decide(L.c[x], B.c[x], Cc[x]);
      if (dc === 'cloud') nb.c[x] = Cc[x]; else if (dc === 'drop' && Cc[x] !== undefined) nb.c[x] = B.c[x]; else if (dc === 'local' && B.c[x] !== undefined) nb.c[x] = B.c[x];
    });
    /* songs */
    var curS = {}; lib.songs.forEach(function (x) { curS[x.id] = x; });
    var songs = [];
    lib.songs.forEach(function (x) {
      var d = sDec[x.id];
      if (d === 'local') songs.push(x);
      else if (d === 'cloud') songs.push(L.s[x.id] === Cs[x.id] ? x : fillInPlace(x, clone(C.s[x.id].obj)));
    });
    C.os.forEach(function (x) { if (!curS[x] && sDec[x] === 'cloud') songs.push(clone(C.s[x].obj)); });
    var alive = {}; songs.forEach(function (x) { alive[x.id] = 1; });
    /* categories + relations */
    var curC = {}; lib.cats.forEach(function (x) { curC[x.id] = x; });
    function relIds(k, localCat) {
      var Lset = new Set(L.r[k] || []), Bset = new Set(B.r[k] || []), Cset = new Set(C.r[k] || []);
      var cloudHas = Cc[k] !== undefined, ids;
      if (!localCat) ids = Array.from(Cset);
      else if (!cloudHas) { ids = Array.from(Lset); Bset = new Set(); }
      else {
        var u = new Set([].concat(Array.from(Lset), Array.from(Bset), Array.from(Cset))), keep = [];
        u.forEach(function (x) {
          var l = Lset.has(x), b = Bset.has(x), c = Cset.has(x), r = (l === b) ? c : l;
          if (sDec[x] === 'local' && !C.s[x]) r = l; /* song re-created from local after a remote delete */
          if (r) keep.push(x);
        });
        var order = []; (localCat.ids || []).forEach(function (x) { if (keep.indexOf(x) >= 0) order.push(x); });
        keep.forEach(function (x) { if (order.indexOf(x) < 0) order.push(x); }); ids = order;
      }
      return ids.filter(function (x) { return alive[x]; });
    }
    var cats = [];
    lib.cats.forEach(function (x) {
      var d = cDec[x.id];
      if (d === 'drop') return;
      var ids = relIds(x.id, x);
      if (d === 'cloud' && L.c[x.id] !== Cc[x.id]) fillInPlace(x, clone(C.c[x.id].obj));
      x.ids = ids; cats.push(x);
      if (Cc[x.id] !== undefined) nb.r[x.id] = (C.r[x.id] || []).slice().sort();
    });
    C.oc.forEach(function (x) {
      if (!curC[x] && cDec[x] === 'cloud') { var o = clone(C.c[x].obj); o.ids = relIds(x, null); cats.push(o); nb.r[x] = (C.r[x] || []).slice().sort(); }
    });
    Object.keys(cDec).forEach(function (x) { if (cDec[x] === 'drop' && Cc[x] !== undefined && B.r[x]) nb.r[x] = B.r[x]; });

    mapFromCloud(C, M);
    Object.keys(sDec).forEach(function (x) { if (sDec[x] === 'drop' && Cs[x] === undefined) delete M.s[x]; });
    Object.keys(cDec).forEach(function (x) { if (cDec[x] === 'drop' && Cc[x] === undefined) delete M.c[x]; });
    S.base = nb; saveS();

    var changed = sj({ s: lib.songs, c: lib.cats }) !== sj({ s: songs, c: cats });
    if (changed) { H.put(songs, cats); H.saveLocal(); H.render(); }
    if (!isEmptyDiff(diff(snap(H.get()), S.base))) rerun = true; /* local-wins items still to push */
  }

  /* ---------- first sign-in on this device: build library = cloud + (once) guest data, then push the difference ---------- */
  async function bootstrap(sb) {
    var C = await readCloud(sb);
    if (H.busy()) { deferred = true; return false; }
    var migrated = LS.get(MK + uid) === '1';
    var nonEmpty = C.os.length || C.oc.length;
    var songs = C.os.map(function (k) { return clone(C.s[k].obj); });
    var cats = C.oc.map(function (k) { var o = clone(C.c[k].obj); o.ids = (C.r[k] || []).slice(); return o; });
    if (!migrated) {
      var G = H.readLib(null), idMap = {}, sigC = {}, byId = {}, taken = {};
      songs.forEach(function (s) { sigC[sig(s)] = s.id; byId[s.id] = s; taken[s.id] = 1; });
      G.songs.forEach(function (g) {
        if (!g || !g.id) return;
        if (H.isSample(g)) { idMap[g.id] = byId[g.id] ? g.id : null; return; } /* v157: the old demo song is never uploaded, also not into an empty account */
        if (taken[g.id]) {
          if (sig(g) === sig(byId[g.id])) { idMap[g.id] = g.id; return; }
          var o = clone(g); o.id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); songs.push(o); taken[o.id] = 1; idMap[g.id] = o.id; return;
        }
        if (sigC[sig(g)]) { idMap[g.id] = sigC[sig(g)]; return; }
        songs.push(clone(g)); taken[g.id] = 1; sigC[sig(g)] = g.id; idMap[g.id] = g.id;
      });
      G.cats.forEach(function (gc) {
        if (!gc || !gc.id || !gc.name) return;
        var t = null;
        cats.forEach(function (c) { if (!t && (c.id === gc.id || String(c.name).toLowerCase() === String(gc.name).toLowerCase())) t = c; });
        if (!t) {
          var o = clone(gc); o.ids = [];
          if (cats.some(function (c) { return c.id === o.id; })) o.id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
          cats.push(o); t = o;
        }
        (gc.ids || []).forEach(function (i) { var m = idMap[i]; if (m && t.ids.indexOf(m) < 0) t.ids.push(m); });
      });
    }
    S = { map: { s: {}, c: {} }, base: baseFromCloud(C) };
    mapFromCloud(C, S.map);
    H.useKeys(uid); H.put(songs, cats); H.saveLocal(); saveS(); LS.set(MK + uid, '1'); H.render();
    return true;
  }

  /* ---------- sync cycle (serialised) ---------- */
  function setSt(s, m) { st = s; stMsg = m || ''; if (H && H.onStatus) { try { H.onStatus(); } catch (e) {} } }
  function toastOnce(key, msg, bad) { if (toasted === key) return; toasted = key; H.notify(msg, bad); }
  function sync(force) {
    if (!uid || !H) return Promise.resolve();
    clearTimeout(tmr); tmr = null;
    if (run) { rerun = true; return run; }
    run = (async function () {
      var n = 0;
      try { do { rerun = false; await cycle(); } while (rerun && ++n < 3); }
      finally { run = null; }
    })();
    return run;
  }
  async function cycle() {
    if (!uid) return;
    if (!navigator.onLine) { setSt('offline'); toastOnce('off', 'Offline. Changes are saved on this device and will sync later.', false); return; }
    setSt('syncing');
    try {
      var sb = await H.client(), boot = false;
      SB = sb;
      if (!S) S = loadS();
      if (!S) { if (!(await bootstrap(sb))) { setSt(hasPending() ? 'pending' : 'ok'); return; } boot = true; }
      await push(sb);
      if (!boot) await pull(sb);
      toasted = ''; rtTries = 0; lastOk = Date.now(); lastRun = lastOk;
      setSt('ok');
      startRealtime(sb);
    } catch (e) {
      lastRun = Date.now();
      if (isNet(e)) { setSt('offline'); toastOnce('off', 'Offline. Changes are saved on this device and will sync later.', false); }
      else { var m = (e && e.message) ? e.message : 'Unknown error'; setSt('error', m); toastOnce('err', 'Saved on this device, but cloud sync failed: ' + m, true); console.warn('EvoLyric sync:', e); }
      scheduleRetry();
    }
  }
  function scheduleRetry() { clearTimeout(retryT); var ms = Math.min(15000 * Math.pow(2, rtTries++), 300000); retryT = setTimeout(function () { sync(); }, ms); }

  /* ---------- Realtime (best effort; ordinary refresh triggers below keep working without it) ---------- */
  function startRealtime(sb) {
    if (chan || !sb || !sb.channel) return;
    try {
      var ping = function () { clearTimeout(rtTimer); rtTimer = setTimeout(function () { sync(); }, 800); };
      chan = sb.channel('evolyric-sync-' + uid);
      chan.on('postgres_changes', { event: '*', schema: 'public', table: 'songs', filter: 'user_id=eq.' + uid }, ping);
      chan.on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: 'user_id=eq.' + uid }, ping);
      chan.on('postgres_changes', { event: '*', schema: 'public', table: 'song_categories' }, ping);
      var me = chan;
      chan.subscribe(function (s) { if ((s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') && chan === me) stopRealtime(sb, true); });
    } catch (e) { chan = null; }
  }
  function stopRealtime(sb, keepOff) {
    clearTimeout(rtTimer);
    var c = chan; chan = null;
    if (c) { try { (sb || SB).removeChannel(c); } catch (e) {} }
  }
  function trigger() { if (uid && !run && Date.now() - lastRun > 4000) sync(); }
  function listen() {
    if (listening) return; listening = true;
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') trigger(); });
    window.addEventListener('focus', trigger);
    window.addEventListener('pageshow', function (e) { if (e.persisted) trigger(); });
    window.addEventListener('online', function () { toasted = ''; if (uid) sync(); });
    window.addEventListener('offline', function () { if (uid) setSt('offline'); });
  }

  /* ---------- public API ---------- */
  var Cloud = {
    init: function (hooks) { H = hooks; listen(); },
    /* called by the app after every local save: schedule a push (diff based, so frequent calls are cheap) */
    touch: function () { if (!uid || !H) return; pending = true; clearTimeout(tmr); tmr = setTimeout(function () { sync(); }, 1200); setSt(navigator.onLine ? 'pending' : 'offline'); },
    signedIn: function (u) {
      if (!H || !u || !u.id) return;
      if (uid === u.id) { sync(); return; }
      if (uid && uid !== u.id) Cloud.signedOut();
      uid = u.id; S = loadS(); rtTries = 0; toasted = '';
      if (S) {
        if (H.activeUid() !== uid) {           /* returning user, user cache exists on this device but guest view is showing */
          var lib = H.readLib(uid);
          if (lib.exists) { H.useKeys(uid); H.put(lib.songs, lib.cats); H.render(); } else S = null;
        }
      }
      sync();
    },
    signedOut: function () {
      if (!H) return;
      var had = uid || H.activeUid();
      if (!had) return;
      stopRealtime(); clearTimeout(tmr); clearTimeout(retryT);
      uid = had; if (!S) S = loadS();
      var keep = hasPending();               /* unsynced edits? then keep this account's cache on the device */
      if (!keep) { LS.del(SK + had); H.dropUser(had); }
      uid = null; S = null; deferred = false; pending = false;
      H.useKeys(null); var g = H.readLib(null); H.put(g.songs, g.cats); H.render(); setSt('guest');
    },
    /* push whatever is pending (used before sign-out) */
    flush: function (ms) {
      if (!uid) return Promise.resolve();
      return Promise.race([sync(), new Promise(function (r) { setTimeout(r, ms || 4000); })]);
    },
    /* the app calls this whenever the list view becomes visible again */
    idle: function () { if (uid && deferred) sync(); },
    status: function () { return { state: st, message: stMsg, lastOk: lastOk, pending: hasPending() }; },
    statusText: function () {
      if (!uid) return '';
      var p = hasPending();
      if (st === 'syncing') return 'Syncing…';
      if (st === 'offline') return 'Offline' + (p ? ' · changes waiting to sync' : ' · saved on this device');
      if (st === 'error') return 'Sync problem' + (p ? ' · changes waiting' : '') + (stMsg ? ': ' + stMsg.slice(0, 60) : '');
      if (p || st === 'pending') return 'Changes waiting to sync';
      return lastOk ? 'Cloud synced' : 'Connecting…';
    }
  };
  window.Cloud = Cloud;
})();
