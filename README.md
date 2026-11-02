# EvoLyric (versi perbaikan)

Isi paket
- `www/`: aplikasi web (index.html, manifest, sw.js, ikon, _headers). Folder inilah yang di-publish.
- `package.json`, `capacitor.config.json`: kerangka untuk membungkus jadi app native (Capacitor) nanti.
- `CHANGES.md`: daftar perbaikan dan hasil pengujian.

## Publish (Cloudflare Workers, seperti evolyric4)
1. Unggah ulang isi folder `www` dengan cara yang sama seperti saat Anda memasang evolyric4.
2. Buka alamat workers.dev di Safari/Chrome. Halaman utama dicek ke internet lebih dulu, tapi kalau koneksi lambat (lebih dari 2,5 detik) app langsung memakai salinan tersimpan, jadi aman dipakai di panggung.
3. Pasang di layar utama:
   - iPhone/iPad: Safari, Share, Add to Home Screen.
   - Android: Chrome, menu titik tiga, Install app.
4. Buka sekali saat online. Setelah itu app jalan tanpa internet.

Update berikutnya: unggah ulang `www`, lalu tutup app sepenuhnya dan buka lagi (saat online). Kalau mengubah ikon atau manifest, naikkan angka versi di `sw.js` (angka di `sw.js`).

## Pindah data dari SETLY
Di SETLY: Salin cadangan. Di EvoLyric: tempel di halaman daftar lagu. Awalan `GULIRLIRIK1` dan `EVOLYRIC1` dikenali.

## Pengaturan yang perlu diketahui
- `SPEED_SCALE` di `index.html` (default 1) mengatur kecepatan dasar gulir. Versi ChatGPT memakai 3 kali lebih cepat. Kalau terasa lambat, ubah ke 2 atau 3.
- Data tersimpan di localStorage per perangkat (iPhone dan iPad tidak sinkron). Kalau penyimpanan gagal, muncul tulisan merah "Not saved" di header daftar.

## Jadi app native (nanti)
Prasyarat: Node.js.

    npm install
    npx cap add android     # butuh Android Studio
    npx cap add ios         # butuh Mac + Xcode
    npx cap sync

- iOS: wajib Mac dengan Xcode. TestFlight/App Store butuh Apple Developer ($99/tahun). Tanpa itu hanya sideload dengan Apple ID gratis (7 hari).
- `appId` (`id.evolyric.app`) masih usulan. Ganti sebelum `cap add`.
- Sebelum rilis native: cerminkan data ke plugin Preferences, tanam font di dalam app, dan pakai plugin Browser untuk tombol Google.
- Lirik berhak cipta: aman untuk pemakaian pribadi atau grup; jangan jadikan database lirik publik.
