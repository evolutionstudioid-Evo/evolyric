# EvoLyric

**Lirikmu, selalu siap.** EvoLyric adalah pemutar lirik dan alat tampil langsung untuk penyanyi, musisi, dan band. Lirik bergulir otomatis di atas panggung sehingga tangan bebas dan pandangan tetap tertuju pada penonton.

EvoLyric berupa *Progressive Web App* (PWA): berjalan di peramban, dapat dipasang ke layar utama iPhone, iPad, dan Android, serta tetap berfungsi tanpa internet setelah dibuka sekali saat online.

Aplikasi dikembangkan oleh **Evolution Digital Studio** dan saat ini masih dalam tahap pengembangan.

- Aplikasi: <https://evolyric.evolution-studio-id.workers.dev/>
- Panduan pengguna: di dalam aplikasi, **Pengaturan → Bantuan → Tutorial** (Indonesia dan Inggris)
- Riwayat perubahan: [`CHANGELOG.md`](CHANGELOG.md)

## Fitur

**Menampilkan lirik**
- Auto-scroll dengan kecepatan yang diatur langsung di layar, lalu ketuk untuk memutar atau menjeda.
- Gestur: geser kiri/kanan untuk kecepatan, tahan untuk maju cepat, cubit untuk ukuran huruf. Editor dibuka dari menu ⋮ → Edit lagu.
- Layar penuh untuk panggung, tema terang dan gelap (layar lirik selalu gelap), serta opsi menjaga layar tetap menyala.

**Section, voicing, dan anotasi**
- Penanda bagian lagu dalam tiga kelompok yang dapat dibuka dan ditutup: **Song** (Intro, Verse, Chorus, Bridge, dan lainnya), **Voicing** (Vocal 1–5, Harmony, Choir) dan **Performance** (A Cappella, Sing-Along, Call & Response, dan lainnya).
- Setiap section berwarna dan menjadi tombol loncat di atas layar lirik. Intro dan Interlude dapat berhenti otomatis (*Pause here*) atau terus berjalan (*Keep going*).
- Anotasi di atas lirik: pena, teks, bentuk, pemindah, penghapus, dan enam warna. Tanda menempel pada hurufnya sehingga ikut bergerak saat lirik di-zoom atau diedit.

**Setlist, antrean, dan kategori**
- **Buat setlist**: pilih lagu dari Semua Lagu atau dari kategori, lihat urutannya di panel kanan, lalu tekan **Set**. Lagu pertama terbuka, sisanya menunggu di antrean *Next song*.
- Tombol **L** di Home membawa kembali ke lirik terakhir yang dibuka.
- Kategori untuk mengelompokkan lagu (misalnya satu per acara), dengan sematkan di atas dan pengurutan. Satu lagu dapat berada di banyak kategori.
- Daftar lagu dengan tampilan lebar atau ringkas, pencarian, pengurutan, tab Terbaru, dan impor `.txt`.

**Teman dan berbagi**
- Cari teman lewat username, kirim dan terima permintaan pertemanan.
- Kirim lagu atau satu kategori utuh (hingga 300 lagu sekali kirim). Saat menerima kategori, setiap lagu ditandai baru atau sudah ada, dan kamu memilih per lagu: simpan salinan, pakai milikku, atau lewati. Tidak ada lagu yang ditimpa.

**Akun dan data**
- Masuk dengan Google (Supabase Auth). Lagu dan kategori tersimpan ke cloud selama kamu masuk, sehingga muncul di perangkat lain dengan akun yang sama.
- Cadangan manual (salin, unduh file, pulihkan dari file atau teks). Format cadangan SETLY (`GULIRLIRIK1`) dan EvoLyric dikenali.
- Antarmuka dua bahasa, Indonesia dan Inggris, yang berganti seketika.

## Teknologi

| Lapisan | Pilihan |
| --- | --- |
| Aplikasi | HTML, CSS, dan JavaScript murni dalam satu berkas (`www/index.html`), tanpa framework |
| Offline | Service worker (`www/sw.js`) dengan cache versi |
| Backend | Supabase (Auth, Postgres, RPC) |
| Hosting | Cloudflare Workers (aset statis dari `www/`, `worker.js` untuk `/api/*`) |
| Native (opsional) | Capacitor (Android dan iOS) |

## Struktur repositori

```
www/                 Aplikasi yang dipublikasikan
  index.html         Seluruh aplikasi
  sw.js              Service worker dan versi cache
  cloud.js           Sinkronisasi cloud
  tutorial.js, man/  Tutorial dalam aplikasi (dihasilkan) dan tangkapan layarnya
supabase/            Skrip SQL, dijalankan berurutan (001 sampai 009)
worker.js            Worker tepi: /api/tempo (data tempo, khusus pengguna yang masuk)
wrangler.jsonc       Konfigurasi Cloudflare Workers
tools/i18n-audit.js  Pemeriksa terjemahan
CHANGELOG.md         Riwayat perubahan per versi
CONTRIBUTING.md      Aturan pengembangan
SETUP-AUTH.md        Langkah mengaktifkan Google Sign-In
```

## Menjalankan dan memasang

### 1. Supabase
1. Buat project di Supabase, salin **Project URL** dan **anon public key** (jangan memakai `service_role`).
2. Di SQL Editor, jalankan berkas `supabase/001_…` sampai `supabase/009_…` **secara berurutan**. Setiap berkas dijalankan satu kali.
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
3. Jalankan `node tools/i18n-audit.js`. Hasilnya harus `OK – nothing untranslated`.
4. Naikkan cache di `www/sw.js` dan tambahkan entri di `CHANGELOG.md`.

Detail ada di [`CONTRIBUTING.md`](CONTRIBUTING.md). Pemeriksa terjemahan memerlukan Playwright (`npm i playwright`).

## Tes otomatis

Folder `tests/` berisi 47 tes Playwright untuk alur inti: layar utama, layar lirik, editor, setlist dan tombol L, kategori, teman (penerimaan lagu), data (cadangan/pemulihan) dan terjemahan. Tes membuka `www/index.html` di Chromium dengan data contoh, tanpa Supabase dan tanpa mengubah kode aplikasi.

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
- Lirik umumnya dilindungi hak cipta. EvoLyric dirancang untuk pemakaian pribadi atau kelompok; jangan menjadikannya basis data lirik publik.
- Data tersimpan di perangkat dan, saat masuk, di akun cloud milikmu. Alamat email tidak ditampilkan kepada pengguna lain.
