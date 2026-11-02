# Perbaikan dari versi ChatGPT

Dipulihkan (hilang atau rusak)
1. Gestur: tahan = speed 15, tahan + geser kanan = speed 20, lepas = kembali normal; pinch dua jari = ukuran huruf. Tap = play/jeda tetap ada.
2. Judul lagu 60px di atas lirik (hilang) dan Intro tepat di garis baca saat dibuka.
3. Font: Instrument Serif untuk "EvoLyric" tidak pernah dimuat (tidak ada di URL Google Fonts). Font isi dikembalikan ke Atkinson Hyperlegible + Bricolage Grotesque (identitas awal).
4. Editor: sidebar section kembali di kanan lirik; tombol sidebar tidak lagi saling menimpa.
5. Gulir kecepatan rendah memakai akumulator sub-piksel (versi ChatGPT bisa macet di Safari yang membulatkan scrollTop). Skala kecepatan dikembalikan ke 1 (konstanta `SPEED_SCALE`).

Diperbaiki (risiko di iPhone/iPad/Android)
6. Textarea 14px memicu zoom otomatis Safari iPhone: sekarang 16px.
7. Tema dikunci gelap. Sebelumnya tema terang di iPhone mode terang bertabrakan dengan status bar `black-translucent` (teks putih di latar krem).
8. Wake lock diminta ulang saat app kembali ke depan.
9. Penyimpanan: peringatan "Not saved" bila gagal, salinan data rusak disimpan di `evolyric-v1-corrupt`, dan meminta penyimpanan persisten.
10. Service worker: tidak menyimpan respons error sebagai halaman utama, dan jatuh ke salinan tersimpan setelah 2,5 detik bila jaringan lambat. Versi cache `evolyric-app-7`.
11. Highlight: ingat seleksi terakhir agar tidak hilang saat tombol diketuk.
12. CSS fullscreen ganda dibersihkan.

Tidak diubah: fitur +/- pada Speed dan Size (tambahan ChatGPT), tanpa tombol play (sesuai permintaan tap-only).

Pengujian (Chromium headless, emulasi iPhone dan iPad, sentuhan nyata via CDP): 91 pemeriksaan lulus, 0 error JS.
Belum terverifikasi: Safari iOS/iPadOS sungguhan (Add to Home Screen, safe area, fullscreen, wake lock, seleksi teks dengan keyboard tersembunyi, keyboard virtual) dan Android sungguhan.

## Revisi UI (v8)
- Tombol toolbar editor (Paste, Undo, Redo, Keyboard, Highlight, Remove label, Delete section) dan swatch warna diperkecil.
- Kolom Artist/Key lebih pendek (padding dikurangi, font tetap 16px agar Safari tidak zoom).
- Semua nilai speed +3 (SPEED_BONUS); tahan = 18, tahan + geser = 23.
- Pinch: ukuran huruf desimal (0,1px), rentang 12-120, sensitivitas non-linear (rasio^1,35), posisi baca tetap terjaga, scroll browser diblok saat dua jari.
- Cache service worker: evolyric-app-8.

## v9
- Tombol Keyboard: tidak lagi mencuri fokus textarea, status aktif terlihat (tombol oranye), fokus ulang dengan cadangan timer, Paste yang gagal ikut menyalakan mode keyboard; mode keyboard direset ke mati saat membuka editor.
- Scroll lirik: posisi disimpan sebagai angka desimal, bagian pecahan dirender lewat translate3d (sub-pixel) sehingga gerak halus di Safari/Chrome; batas dt 0,1 dtk; sorotan section dibatasi 1x per frame.
- Wordmark EvoLyric: logo + tipografi Bricolage Grotesque, "Lyric" gradien oranye, tagline kecil.
- Cache SW: evolyric-app-9.

## v10 – Categories & Song Organization
- Library: tab **All Songs / My Categories**; kategori dibuat/rename/hapus (validasi nama, tanpa duplikat case-insensitive, maks 30 karakter).
- Model data: lagu tetap satu array `songs` (master). Kategori disimpan di `evolyric-cats-v1` sebagai `{id,name,ids:[songId]}` — hanya referensi, tidak ada salinan lirik. Hapus lagu membersihkan semua kategori; hapus kategori tidak menyentuh lagu.
- Pencarian kontekstual: All Songs = seluruh library; di dalam kategori = hanya lagu kategori itu; di My Categories = nama kategori; popup Add Songs = seluruh Master Library; laci lagu di layar play punya pemilih kategori.
- Popup **Add Songs to X**: multi-select, penghitung, lagu yang sudah ada terkunci/abu-abu, Cancel tidak menyimpan.
- Edit Song: selector Categories multi-pilih (preselect), plus buat kategori baru langsung di dalamnya.
- Tekan-tahan / klik kanan: di kategori → "Remove from X" (tanpa Delete Song); di All Songs → "Delete Song" dengan dialog konfirmasi.
- Bintang favorit lama dimigrasi sekali menjadi kategori biasa "Favorites"; tombol bintang dihapus. Backup kini `EVOLYRIC2` (songs + cats), backup lama tetap bisa dipulihkan.
- Cache SW: evolyric-app-10.

## v11 – Google Sign-In & profil (Supabase Auth)
- Header daftar lagu: tombol **Sign In** (logged out) / avatar Google (logged in) di kanan atas. Dropdown: Profile (Soon), My Library, Account Settings (Soon), Sign Out.
- Modal "Welcome to EvoLyric" + Continue with Google (ikon G resmi), loading, pesan error, catatan privasi, tutup / "keep using the demo". Satu tombol untuk sign-up dan sign-in.
- Supabase Auth: `signInWithOAuth` (PKCE), `getSession`, satu `onAuthStateChange`, `signOut`. SDK di-vendor di `www/vendor/supabase.js` (v2.45.4), dimuat hanya bila `config.js` terisi.
- Guest Demo tetap penuh tanpa login; lagu lokal tidak dihapus/dikonversi saat login atau logout.
- `supabase/001_profiles.sql`: tabel `profiles`, RLS (hanya baris sendiri), trigger pembuat profil, update hanya kolom display_name/avatar_url.
- `SETUP-AUTH.md`: langkah Google Cloud + Supabase. Cache SW: evolyric-app-11.

## v12 – Perbaikan performa gulir (audit Claude)
- Posisi section di-cache (tidak lagi membaca DOM/layout tiap frame); sorotan chip hanya berubah saat section aktif berganti. Pada CPU diperlambat 4x-6x, frame p95 turun dari 33-50 ms ke mendekati 16-33 ms.
- Cache posisi otomatis dihitung ulang saat ukuran huruf, layar/orientasi, atau font web berubah.
- SETUP-AUTH: domain contoh yang salah ketik diganti placeholder; ditambah catatan login di PWA iOS.
- Cache SW: evolyric-app-12.

## v13 – Perbaikan mengetik terbalik
- Bug: dengan keyboard fisik (iPad/Bluetooth/desktop) saat tombol Keyboard mati, caret dipaksa ke awal baris setiap ketikan, sehingga "halo" menjadi "olah" dan panah kiri/kanan terasa terbalik.
- Perbaikan: tombol keyboard fisik atau input teks apa pun otomatis menyalakan mode ketik (tombol Keyboard menyala). Caret hanya menempel di kiri baris untuk ketukan jari saat mode ketik mati.
- Cache SW: evolyric-app-13.
