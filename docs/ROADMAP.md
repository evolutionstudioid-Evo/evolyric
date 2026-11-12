# Rencana berikutnya

Fitur inti EvoLyric sudah lengkap (v150). Daftar ini mencatat pekerjaan yang sengaja ditunda, urut dari yang paling penting.

## Sebelum dibuka untuk umum
1. **Kebijakan Privasi dan Ketentuan Penggunaan** – selesai (v160): `docs/legal/`, di aplikasi (Bantuan) dan publik (`/privacy.html`, `/terms.html`). Sebelum verifikasi login Google: pastikan domain di dokumen (evolyric.com) sudah aktif, lalu isi tautan kedua halaman di Google Cloud → OAuth consent screen.
2. **Aturan fitur Teman di Ketentuan Penggunaan** – selesai (v160, bagian 8–9).
3. **Laporan error.** Saat ini error di perangkat pengguna lain tidak terlihat. Rencana: tabel kecil di Supabase (versi app, perangkat, pesan error, waktu; tanpa isi lirik), diisi dari `window.onerror` / `unhandledrejection`, dibatasi beberapa laporan per sesi, dan bisa dimatikan di Preferensi.

## Ditunda atas permintaan
4. **Web help / FAQ** terpisah dari aplikasi (panduan lengkap, tanya jawab). Bisa sekalian menampung halaman Kebijakan Privasi dan Syarat Layanan.
5. **EvoImport**: sebagian besar sudah masuk ke aplikasi sejak v163 (impor universal, Tempel sebagai lagu baru, Bagikan → EvoLyric). Sisa ide: pembaca Apple Notes lewat Mac, alat untuk Mi Cloud (i.mi.com).
6. ~~**Impor dari Android**~~: selesai di v163 (Google Keep Takeout, Samsung Notes file teks, Bagikan → EvoLyric).

## Catatan kecil
- Pengguna lama yang masuk di perangkat baru bisa melihat tur interaktif sekali bila lagunya belum selesai tersinkron saat Home pertama terbuka. Tidak berbahaya (bisa dilewati).
