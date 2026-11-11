# Web Lyric – Laporan Audit (Fase 0)

Dasar audit: `main` @ v135 (commit `48dab02`, “aurora glow”). Titik rollback: branch `checkpoint-v135`.
Semua temuan di bawah diambil dari kode yang benar-benar ada, bukan dari asumsi atau branch lama.

## 1. Struktur & arsitektur

| Bagian | Isi |
|---|---|
| `www/index.html` | Seluruh aplikasi (UI, CSS, logika) dalam satu file, ±2.390 baris. Tiap layar adalah `<section class="v">`: `list` (Home), `play` (Lyric Mode), `edit`, `ann` (anotasi), `friends`, `profile`, `prefs`, `help`, `acct`, `doc`, `welcome`. Pindah layar lewat `show(id)`. |
| `www/cloud.js` | Sinkron Library ↔ Supabase. Hanya melihat `songs` dan `cats` lewat `Cloud.init({get, put, …})`. |
| `www/sw.js` | Service worker: shell di-cache, `index.html` network-first (batas 2,5 detik). |
| `worker.js` | Cloudflare Worker: file statis + `/api/tempo` (tempo, saat ini disembunyikan). |
| `tests/` | 58 tes otomatis Playwright (data fiktif). |
| Deploy | Cloudflare Workers Builds: merge ke `main` → `npx wrangler deploy` (diperbaiki 11 Nov). Branch lain → preview. |

## 2. Fitur yang sudah berjalan (ringkas)
Login Google wajib · Library (All Songs / Categories / Recent, sort, pin, compact/wide) · Editor (section, warna, highlight, catatan, anotasi, undo, Paste) · Lyric Mode (fullscreen, auto-scroll + speed, boost, pinch zoom, section chips, aurora) · Queue + tombol Next · Setlist · Teman (kirim lagu/kategori) · Backup & Restore · Preferences · Help/tutorial · ID/EN · PWA offline.

## 3. Alur yang relevan

**Lyric Mode** – `openSong(s)` adalah satu-satunya pintu masuk. Isinya:
1. `recAdd(s.id)` → menulis ke **Recent** (`evolyric-recent-v1`).
2. `localStorage['evo.lastsong']=s.id` → dipakai tombol **L** di Home.
3. `cur=s`, render lirik, masuk fullscreen, selalu mulai dalam keadaan pause.

Keluar dari Lyric Mode hanya lewat `leavePlay()` (tombol/gesture Back) → Home. Membuka lagu lain dari sidebar/Queue memanggil `openSong` lagi.

**Editor** – `openEdit(s, txt, title, base, pre)`. Tombol Simpan (`#eS`): kalau `ed.s` ada → objek itu diubah di tempat; kalau tidak → lagu baru dibuat dan `songs.push(...)`. Lalu `save()` dan `openSong(cur)`.

**Library / “Song Creator”** – lagu baru dibuat lewat tombol + → New song, Import .txt, atau tempel di Home (semuanya membuka Editor). Tidak ada modul “Song Creator” terpisah; fungsinya ada di Editor.

**Tombol globe sekarang** – `#goog` (Home) dan `#dgoog` (sidebar Lyric Mode): mengambil teks kolom pencarian → `webSearch(q)` membuka Google “<judul> lyric” di tab baru → **sekaligus membuka Editor kosong** berjudul q.

## 4. Penyimpanan

| Data | Tempat | Catatan |
|---|---|---|
| Library | `songs[]` → `localStorage` (`evolyric-v1`, per akun) + Supabase lewat `cloud.js` | `save()` = simpan lokal + tandai sinkron |
| Kategori | `cats[]` → `evolyric-cats-v1` | |
| Recent | `evolyric-recent-v1` | diisi `openSong` |
| Lagu terakhir | `evo.lastsong` | diisi `openSong` |
| Queue | `queue[]` (id lagu) | hanya berisi lagu Library |
| Sementara | **belum ada** | `cur` hanya variabel di memori |

Kesimpulan: tidak ada konsep lagu sementara. Pengaman utamanya sudah ada secara alami: apa pun yang **tidak** masuk `songs[]` tidak pernah disimpan, di-backup, atau disinkron.

## 5. Komponen yang bisa dipakai ulang
- `openSong` + seluruh Lyric Mode (render, section, auto-scroll, aurora, zoom) — lagu sementara cukup berupa objek lagu biasa yang tidak dimasukkan ke `songs[]`.
- Menu ⋮ Lyric Mode (`#menu`) — tempat **Edit in Editor**.
- `openEdit(null, lirik, judul, …)` + tombol Simpan Editor — jalur “buat lagu baru”, cocok untuk Save/Edit lirik sementara.
- `webSearch()` — pembuka Google yang sudah terbukti aman di PWA iOS/Android.
- Logika Paste Editor (baca clipboard) — dasar “Tampilkan lirik” dari Google.
- Pola tombol melayang yang meredup saat scroll (Next/Queue) — dasar tombol Save to Library.

## 6. Integrasi LRCLIB (rancangan)
- Dipanggil langsung dari browser (LRCLIB gratis, tanpa key, mengizinkan CORS) — Worker tidak perlu diubah.
- `GET /api/search?track_name=…&artist_name=…` (atau `q=` bila artis kosong), batas waktu ±6 detik, header `Lrclib-Client: EvoLyric`.
- Validasi: buang instrumental & hasil tanpa teks; cocokkan judul (normalisasi huruf/aksen/tanda baca, abaikan “(Live)”, “- Remastered”); artis bila diisi. Pilih `plainLyrics`; kalau hanya `syncedLyrics`, timestamp dibuang.
- Pengecekan diam-diam saat mengetik (debounce) supaya saat globe ditekan hasilnya sudah ada → Google bisa dibuka tanpa diblokir Safari.

## 7. Alur Web Lyric (sesuai keputusan 11 Nov)
1. Tap globe (Home atau sidebar) → cari di LRCLIB.
2. **Ketemu** → langsung tampil di Lyric Mode sebagai **lirik sementara** + tombol **Save to Library**; ⋮ → **Edit in Editor**.
3. **Tidak ketemu** → otomatis buka Google.
4. Kembali dari Google → pilihan **Tampilkan lirik** (baca clipboard → lirik sementara) / **Kembali** (tetap di halaman terakhir, tidak ada perubahan). Muncul sekali saja.
5. Lirik sementara dibuang saat kembali ke Home atau membuka lagu lain; tidak pernah masuk Recent, Queue, backup, atau cloud kecuali disimpan.

## 8. Risiko & potensi konflik
| Risiko | Penanganan |
|---|---|
| `openSong` menulis Recent & lagu terakhir | Lewati keduanya untuk lirik sementara (**Fase 1**) |
| ⋮ → Edit song & ketuk-dua-kali judul membuka Editor dengan objek yang tidak ada di Library → simpan “hilang” | Dinonaktifkan untuk lirik sementara di Fase 1; diganti Edit in Editor yang benar di Fase 2 |
| Send to friend untuk lirik sementara | Disembunyikan sampai disimpan |
| Tombol L di Home menampilkan layar lirik lama | Lirik sementara dibersihkan saat keluar; L kembali ke lagu Library terakhir |
| Ubah speed/zoom memicu sinkron tanpa perubahan | Lewati `save()` untuk lirik sementara |
| Safari memblokir buka Google setelah menunggu LRCLIB | Pre-check saat mengetik (Fase 3) |
| iOS tidak mengizinkan baca clipboard tanpa tap | Tombol “Tampilkan lirik” + gelembung Paste iOS (Fase 5) |
| Ketersediaan lirik di LRCLIB untuk lagu Indonesia | Fallback Google; perlu daftar lagu repertoar untuk diukur |
| Tombol globe berubah fungsi | Keputusan pemilik (menggantikan isi surat); tetap membuka Google sebagai fallback |

## 9. Rencana bertahap
| Fase | Isi | Terlihat pengguna? |
|---|---|---|
| 0 | Audit ini + `checkpoint-v135` | – |
| 1 | Fondasi lirik sementara (v136) | Tidak |
| 2 | Save to Library + Edit in Editor | Tidak (belum ada pintu masuk) |
| 3 | Mesin LRCLIB + validasi + pre-check | Tidak |
| 4 | Alur baru tombol globe | **Ya** |
| 5 | Kembali dari Google: Tampilkan lirik / Kembali | Ya |
| 6 | i18n, Help/tutorial, uji iPhone/iPad/Android, rilis | Ya |

Setiap fase: PR sendiri, tes otomatis, nomor versi sendiri, dicoba pemilik sebelum fase berikutnya.

**Keputusan yang masih terbuka (sebelum Fase 4):** (a) bila LRCLIB menemukan beberapa versi lagu — pilih otomatis atau tampilkan daftar singkat; (b) globe mencari dari kolom pencarian yang ada, atau perlu kolom judul + artis terpisah.
