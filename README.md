# EvoLyric

**Lirikmu, selalu siap.** EvoLyric adalah pemutar lirik dan alat tampil langsung untuk penyanyi, musisi, dan band. Lirik bergulir otomatis di atas panggung sehingga tangan bebas dan pandangan tetap tertuju pada penonton.

EvoLyric berupa *Progressive Web App* (PWA): berjalan di peramban, dapat dipasang ke layar utama iPhone, iPad, dan Android, serta tetap berfungsi tanpa internet setelah dibuka sekali saat online.

Aplikasi dikembangkan oleh **Evolution Digital Studio**. Versi saat ini: **1.0** (build v156).

- Aplikasi: <https://evolyric.com> (alamat lama <https://evolyric.evolution-studio-id.workers.dev/> masih jalan sementara dan menampilkan petunjuk pindah)
- Panduan pengguna: di dalam aplikasi, **⚙ → Bantuan → Tur interaktif** (tur dengan animasi tangan) dan **Panduan singkat** (10 slide), Indonesia dan Inggris
- Rencana berikutnya: [`docs/ROADMAP.md`](docs/ROADMAP.md)
- Riwayat perubahan: [`CHANGELOG.md`](CHANGELOG.md)

## Fitur

**Menampilkan lirik**
- Auto-scroll dengan kecepatan yang diatur langsung di layar, lalu ketuk untuk memutar atau menjeda.
- Gestur: geser kiri/kanan untuk kecepatan, tahan untuk maju cepat, cubit untuk ukuran huruf. Ketuk dua kali pada judul untuk membuka editor (atau menu ⋮ → Edit lagu).
- Layar penuh untuk panggung, tema terang dan gelap (juga di layar lirik), serta opsi menjaga layar tetap menyala.
- Tampilan: slider **Warna** (geser ke kiri untuk monokrom), **Kecerahan latar**, dan **Kontras**, plus **Efek visual saat menggulir** (cahaya lembut di tepi layar, bisa dimatikan).

**Section, voicing, dan anotasi**
- Penanda bagian lagu dalam tiga kelompok yang dapat dibuka dan ditutup: **Song** (Intro, Verse, Chorus, Bridge, dan lainnya), **Voicing** (Vocal 1–5, Harmony, Choir) dan **Performance** (A Cappella, Sing-Along, Call & Response, dan lainnya).
- **Auto Section** di editor memberi label otomatis: bagian yang berulang menjadi Chorus, bagian berbaris ganjil menjadi Bridge, paragraf awal Verse, dan Pre-Chorus dikenali. Lirik dari internet langsung diberi label.
- Setiap section berwarna dan menjadi tombol loncat di atas layar lirik. Intro dan Interlude dapat berhenti otomatis (*Pause here*) atau terus berjalan (*Keep going*).
- Anotasi di atas lirik: pena, teks, bentuk, pemindah, penghapus, dan enam warna. Tanda menempel pada hurufnya sehingga ikut bergerak saat lirik di-zoom atau diedit.

**Setlist, antrean, dan kategori**
- **Buat setlist**: pilih lagu dari Semua Lagu atau dari kategori, lihat urutannya di panel kanan, lalu tekan **Set**. Lagu pertama terbuka, sisanya menunggu di antrean *Next song*.
- Tombol **L** di Home membawa kembali ke lirik terakhir yang dibuka.
- Kategori untuk mengelompokkan lagu (misalnya satu per acara), dengan sematkan di atas dan pengurutan. Satu lagu dapat berada di banyak kategori.
- Daftar lagu dengan tampilan lebar atau ringkas, pencarian yang tahan salah ketik 1–2 huruf, pengurutan, dan tab Terbaru.
- **Impor dari file**: satu atau banyak file. File dari Shortcut Apple Notes (lagu dipisah `===EVONOTE===`) langsung menjadi banyak lagu.
- **Impor universal** (`www/import.js`, semua diproses di perangkat): `.txt` `.md` `.html` `.rtf` `.docx` `.enex` `.json`, `.zip` (Google Keep Takeout, ekspor Simplenote, folder berisi file lirik), dan backup ColorNote (`.backup`, didekripsi di perangkat; kata sandi bawaan 0000). Stabilo dan teks berwarna menjadi stabilo EvoLyric. Bila ada pilihan (banyak catatan, dokumen berisi banyak lagu, file yang dilewati), muncul pratinjau untuk mencentang lagu, memecah dokumen di 2 baris kosong, dan Auto Section. File Pages/.doc mendapat petunjuk cara ekspor. Lagu yang sudah ada tidak ditambahkan dua kali.
- **Tempel sebagai lagu baru** (menu +): salin catatan di aplikasi apa pun, lalu satu ketukan; baris pertama menjadi judul.
- **Bagikan → EvoLyric** (Android, EvoLyric dipasang lewat Chrome → Instal aplikasi): `share_target` di manifest membuka editor berisi catatan yang dibagikan.
- **Bantuan → Pindah dari aplikasi catatan lain**: langkah untuk Apple Notes, Samsung Notes, Xiaomi/Oppo/Vivo/Realme, Google Keep, Simplenote, Evernote, Pages/Word.

**Web Lyric (cari lirik di internet)**
- Ketik judul di kolom cari (Home atau panel samping). Kalau tidak ada di Library, muncul kartu **Cari di internet** yang mencari di [LRCLIB](https://lrclib.net): satu hasil langsung tampil di layar lirik; beberapa versi muncul sebagai daftar singkat untuk dipilih (dengan tombol **Lebih banyak** ke Google); tidak ada hasil membuka Google. Pencarian juga tahan salah ketik.
- Tahan sebuah lagu di Home → **Cari di internet** untuk mencari versi lain atau penyanyi lain dengan judul yang sama.
- Di layar lirik, pojok kecepatan berganti menjadi tombol **Versi** untuk berpindah ke versi lain atau ke Google (**Lebih banyak**).
- Kembali dari Google: **Tampilkan lirik** memakai lirik yang kamu copy, **Kembali** tidak mengubah apa pun.
- Lirik dari internet bersifat **sementara**: tidak masuk Library, Terbaru, cadangan, atau sinkron cloud, dan hilang saat kembali ke Home. Tombol **Simpan** (atau ⋮ → Simpan ke Library / Edit di Editor) untuk menyimpannya. Rincian teknis: [`docs/WEB_LYRIC_AUDIT.md`](docs/WEB_LYRIC_AUDIT.md).

**Teman dan berbagi**
- Cari teman lewat username, kirim dan terima permintaan pertemanan.
- **Keamanan:** Blokir dan Laporkan (menu teman, dan ⋯ pada permintaan atau kiriman), batas harian (20 permintaan pertemanan, 30 kiriman), dan suspend akun oleh admin. Panduan admin: [`docs/ADMIN.md`](docs/ADMIN.md). Butuh `supabase/011_safety.sql`.
- Kirim lagu atau satu kategori utuh (hingga 300 lagu sekali kirim). Saat menerima kategori, setiap lagu ditandai baru atau sudah ada, dan kamu memilih per lagu: simpan salinan, pakai milikku, atau lewati. Tidak ada lagu yang ditimpa.

**Akun dan data**
- **Tanpa login (tamu):** layar pertama punya **Lanjut sebagai tamu**. Semua fitur dasar jalan dan lagu tersimpan di perangkat itu saja. **Masuk** dengan Google (tombol di kanan atas) untuk sinkron cloud dan fitur Teman; lagu tamu di perangkat itu digabungkan ke akun sekali saat pertama masuk.
- Masuk dengan Google (Supabase Auth). Lagu dan kategori tersimpan ke cloud selama kamu masuk, sehingga muncul di perangkat lain dengan akun yang sama.
- **Backup & restore** (Akun → Pengaturan Akun): **Backup** menyimpan semua lagu dan kategori dalam satu file `.evolyric`; **Restore** membacanya kembali tanpa menimpa lagu yang sudah ada. **Ekspor .txt** menyimpan semua lirik dalam format Shortcut Apple Notes. Cadangan lama (SETLY `GULIRLIRIK1`, `EVOLYRIC1/2` dalam `.txt`) tetap dikenali.
- **Hapus akun** (Pengaturan Akun → Zona berbahaya): peringatan keras, tombol Backup dulu, lalu ketik **HAPUS** (EN: **DELETE**) untuk membuka tombol hapus. Menghapus akun, lagu dan kategori di cloud, profil, teman, dan lagu kiriman, serta salinan library di perangkat itu. Butuh `supabase/010_delete_account.sql`.
- **Bantuan → Kebijakan Privasi / Ketentuan Penggunaan** (juga ditautkan di layar masuk). Sumber teks: `docs/legal/*.md` (ID dan EN); jalankan `node tools/legal-build.js` setelah mengubahnya. Halaman publik: `/privacy.html` dan `/terms.html`.
- **Bantuan → Hubungi dukungan**: email ke evolution.studio.id@gmail.com (versi aplikasi dan perangkat otomatis disertakan).
- Menu akun: Teman, **Pengaturan Profil**, Pengaturan Akun, Keluar. Menu ⚙: Preferensi, Bantuan, **Muat ulang aplikasi** (mengambil versi terbaru setelah data disimpan).
- Antarmuka dua bahasa, Indonesia dan Inggris, yang berganti seketika.

## Teknologi

| Lapisan | Pilihan |
| --- | --- |
| Aplikasi | HTML, CSS, dan JavaScript murni dalam satu berkas (`www/index.html`), tanpa framework |
| Offline | Service worker (`www/sw.js`) dengan cache versi |
| Backend | Supabase (Auth, Postgres, RPC) |
| Hosting | Cloudflare Workers (aset statis dari `www/`, `worker.js` untuk `/api/*`), domain `evolyric.com` (+ `www` dialihkan ke `evolyric.com`) |
| Native (opsional) | Capacitor (Android dan iOS) |

## Struktur repositori

```
www/                 Aplikasi yang dipublikasikan
  index.html         Seluruh aplikasi
  sw.js              Service worker dan versi cache
  cloud.js           Sinkronisasi cloud
  tutorial.js, man/  Panduan singkat dalam aplikasi (dihasilkan) dan tangkapan layarnya
supabase/            Skrip SQL, dijalankan berurutan (001 sampai 012)
worker.js            Worker tepi: /api/tempo (data tempo, khusus pengguna yang masuk)
wrangler.jsonc       Konfigurasi Cloudflare Workers
tools/i18n-audit.js  Pemeriksa terjemahan
CHANGELOG.md         Riwayat perubahan per versi
docs/ROADMAP.md      Rencana berikutnya
docs/ADMIN.md        Moderasi: laporan, suspend, batas
docs/WEB_LYRIC_AUDIT.md  Rincian teknis Web Lyric
CONTRIBUTING.md      Aturan pengembangan
SETUP-AUTH.md        Langkah mengaktifkan Google Sign-In
```

## Menjalankan dan memasang

### 1. Supabase
1. Buat project di Supabase, salin **Project URL** dan **anon public key** (jangan memakai `service_role`).
2. Di SQL Editor, jalankan berkas `supabase/001_…` sampai `supabase/012_…` **secara berurutan**. Setiap berkas dijalankan satu kali.
3. Aktifkan login Google mengikuti [`SETUP-AUTH.md`](SETUP-AUTH.md).
4. Isi `www/config.js` dengan URL dan anon key tersebut.

### 2. Cloudflare Workers
- Aset statis diambil dari `www/` dan dikonfigurasi di `wrangler.jsonc`.
- Fitur tempo membutuhkan secret `FREQBLOG_KEY` di Cloudflare. Kunci ini tidak pernah dikirim ke peramban. Tanpa kunci tersebut, fitur tempo nonaktif dan fitur lain tetap berjalan.

### 3. Pasang di perangkat
- iPhone/iPad: Safari → Bagikan → *Add to Home Screen*.
- Android: Chrome → menu titik tiga → *Install app*.
- Buka sekali saat online. Setelah itu aplikasi berjalan tanpa internet.

### Memperbarui aplikasi
Publikasikan ulang `www/`, lalu tutup aplikasi sepenuhnya dan buka lagi saat online. Naikkan angka cache di `www/sw.js` setiap kali berkas aplikasi berubah.

## Pengembangan

Setiap fitur atau layar baru **wajib punya terjemahan Indonesia dan Inggris**. Ringkasnya:

1. Tulis teks yang terlihat dalam bahasa Inggris di kode.
2. Tambahkan padanan Indonesia ke `ID` (teks persis) atau `IDP` (teks yang memuat nama atau angka) di `www/index.html`.
3. **Aturan ketat:** teks milik pengguna (lirik, nama section, judul, artis, nama kategori, catatan, nama orang) tidak boleh ikut diterjemahkan. Tampilkan dengan `UE(tag, kelas, teks, cadangan)` atau beri atribut `data-nt` pada wadahnya. Diuji oleh `tests/usercontent.test.js`.
4. Jalankan `node tools/i18n-audit.js`. Hasilnya harus `OK – nothing untranslated`.
5. Naikkan cache di `www/sw.js` dan tambahkan entri di `CHANGELOG.md`.

Detail ada di [`CONTRIBUTING.md`](CONTRIBUTING.md). Pemeriksa terjemahan memerlukan Playwright (`npm i playwright`).

## Tes otomatis

Folder `tests/` berisi lebih dari 100 tes Playwright untuk alur inti: layar utama dan menu, layar lirik, Web Lyric, impor Shortcut, Auto Section, warna dan kontras, tur interaktif, editor, setlist dan tombol L, kategori, teman (penerimaan lagu), data (backup, restore, ekspor), PWA dan terjemahan. Tes membuka `www/index.html` di Chromium dengan data contoh, tanpa Supabase dan tanpa mengubah kode aplikasi.

```bash
npm install
npx playwright install chromium
npm test              # semua tes
node tests/run.js Setlist   # hanya tes yang namanya memuat "Setlist"
```

Jalankan sebelum membuka pull request. Tes ini berjalan di browser desktop/emulasi; pengujian di perangkat nyata tetap diperlukan.

## Aplikasi native (opsional)

Kerangka Capacitor sudah tersedia. Prasyarat: Node.js.

```
npm install
npx cap add android     # butuh Android Studio
npx cap add ios         # butuh Mac dan Xcode
npx cap sync
```

- iOS memerlukan Mac dengan Xcode. TestFlight dan App Store memerlukan Apple Developer Program; tanpa itu hanya bisa sideload dengan Apple ID gratis.
- `appId` (`id.evolyric.app`) masih usulan; ganti sebelum `cap add`.
- Sebelum rilis native: cerminkan data ke plugin Preferences, tanam font di dalam aplikasi, dan gunakan plugin Browser untuk tombol Google.

## Catatan

- Langganan belum tersedia dan tidak ada pembayaran di aplikasi ini.
- Lirik dari Cari di internet berasal dari [LRCLIB](https://lrclib.net) (database lirik terbuka) atau dari yang kamu salin sendiri di Google.
- Lirik umumnya dilindungi hak cipta. EvoLyric dirancang untuk pemakaian pribadi atau kelompok; jangan menjadikannya basis data lirik publik.
- Data tersimpan di perangkat dan, saat masuk, di akun cloud milikmu. Alamat email tidak ditampilkan kepada pengguna lain.
