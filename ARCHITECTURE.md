# EvoLyric — Arsitektur

Dokumen ini menjelaskan struktur EvoLyric seperti yang ada sekarang. Dokumen ini hanya mencatat kondisi nyata, tidak mengubah kode. Aturan kontribusi (terjemahan, cache, changelog) ada di [CONTRIBUTING.md](CONTRIBUTING.md).

## Gambaran umum

EvoLyric adalah Progressive Web App untuk menampilkan lirik saat tampil langsung. Aplikasi ini juga dibungkus Capacitor untuk Android dan iOS. Ada tiga bagian yang berjalan terpisah:

| Bagian | Lokasi | Peran |
|---|---|---|
| Aplikasi web (statis) | `www/` | Seluruh antarmuka, penyimpanan lokal, service worker |
| Edge worker | `worker.js` (Cloudflare Worker) | Hanya menangani `/api/*`; file statis dilayani dari `www/` lewat binding `ASSETS` |
| Backend | `supabase/` | Skema, RLS, dan fungsi untuk akun, sinkron, teman, dan laporan |

Konfigurasi deploy ada di `wrangler.jsonc`. Route `evolyric.com` dan `www.evolyric.com` diarahkan ke worker ini. Rute `/api/*`, `/index.html`, `/privacy.html`, dan `/terms.html` dijalankan lewat worker terlebih dahulu.

Capacitor membaca `www/` sebagai `webDir` (`capacitor.config.json`, appId `id.evolyric.app`).

## Isi `www/`

| Berkas | Isi |
|---|---|
| `index.html` | Seluruh antarmuka dan logika aplikasi (lihat bagian "Kondisi saat ini") |
| `config.js` | Konfigurasi klien (URL dan kunci publik Supabase) |
| `cloud.js` | Sinkron akun dan data ke Supabase |
| `legal.js` | Teks syarat dan privasi |
| `import.js` | Impor lagu dari berbagai format file, diproses sepenuhnya di perangkat |
| `tutorial.js` | Tur interaktif dan panduan singkat |
| `sw.js` | Service worker. Daftar `SHELL` dan nama cache ada di sini |
| `vendor/supabase.js` | Klien Supabase pihak ketiga |
| `002_cloud_sync.sql` | Salinan skema sinkron untuk referensi |
| `man/`, `*.png`, `manifest.webmanifest`, `_headers` | Aset, ikon, dan header |
| `privacy.html`, `terms.html` | Halaman hukum |

## Isi `supabase/`

Berkas SQL bernomor berurutan, `001_profiles.sql` sampai `013_song_trash.sql`. Setiap berkas memuat satu perubahan: profil, username, teman, kategori lagu, keamanan dan pelaporan, penghapusan akun, dan tempat sampah lagu.

## Kondisi saat ini

- `www/index.html` berisi sekitar 2.350 baris JavaScript inline dan satu blok CSS. Bagian-bagian di dalamnya sudah diberi penanda, tetapi belum dipisah menjadi berkas tersendiri. Bagian yang sudah diberi penanda: Daftar, Play, Queue, Edit, Anotasi, Akun Google, Teman, Sinkron, Selamat datang, dan Tur.
- Berkas yang sudah terpisah (`cloud.js`, `import.js`, `legal.js`, `config.js`, `tutorial.js`) adalah contoh pola yang sudah berjalan.
- Test ada di `tests/` (26 berkas, dijalankan dengan `npm test`, yaitu `node tests/run.js`). Ada test untuk impor, lirik, kategori, setlist, akun, teman, dan i18n.
- `tools/i18n-audit.js` memastikan semua teks sudah diterjemahkan.

## Aturan kerja untuk perubahan

1. Setiap perubahan yang terlihat oleh pengguna harus diterjemahkan (Inggris dan Indonesia), lalu `node tools/i18n-audit.js` harus lolos.
2. Teks milik pengguna (lirik, judul, nama artis, nama kategori) tidak diterjemahkan.
3. Setiap perubahan pada file yang di-cache menaikkan versi cache di `www/sw.js` dan menambahkan entri `CHANGELOG.md`.
4. Jika berkas baru ditambahkan ke `www/` dan dibutuhkan saat offline, tambahkan juga ke daftar `SHELL` di `sw.js`.
5. Jalankan `npm test` sebelum merge.

## Rencana pemecahan (belum dikerjakan)

Pemecahan `index.html` belum dimulai. Langkah yang direncanakan dibahas dulu sebelum dikerjakan, dan setiap langkah harus tidak mengubah perilaku.
