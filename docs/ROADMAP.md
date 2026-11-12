# Rencana berikutnya

Fitur inti EvoLyric sudah lengkap (v150). Daftar ini mencatat pekerjaan yang sengaja ditunda, urut dari yang paling penting.

## Sebelum dibuka untuk umum
1. **Kebijakan Privasi dan Ketentuan Penggunaan** – selesai (v160): `docs/legal/`, di aplikasi (Bantuan) dan publik (`/privacy.html`, `/terms.html`). Sebelum verifikasi login Google: pastikan domain di dokumen (evolyric.com) sudah aktif, lalu isi tautan kedua halaman di Google Cloud → OAuth consent screen.
2. **Aturan fitur Teman di Ketentuan Penggunaan** – selesai (v160, bagian 8–9).
3. **Laporan error.** Saat ini error di perangkat pengguna lain tidak terlihat. Rencana: tabel kecil di Supabase (versi app, perangkat, pesan error, waktu; tanpa isi lirik), diisi dari `window.onerror` / `unhandledrejection`, dibatasi beberapa laporan per sesi, dan bisa dimatikan di Preferensi.

## Ditunda atas permintaan
4. **Web help / FAQ** terpisah dari aplikasi (panduan lengkap, tanya jawab). Bisa sekalian menampung halaman Kebijakan Privasi dan Syarat Layanan.
5. **EvoImport**: aplikasi pendamping untuk memindahkan banyak lirik dari aplikasi catatan sekaligus. Desain sudah ada; jalur Shortcut Apple Notes → Impor .txt sudah berjalan di aplikasi.
6. **Impor dari Android**: padanan Shortcut untuk Android (misalnya ekspor Google Keep / share target).

## Catatan kecil
- Pengguna lama yang masuk di perangkat baru bisa melihat tur interaktif sekali bila lagunya belum selesai tersinkron saat Home pertama terbuka. Tidak berbahaya (bisa dilewati).
