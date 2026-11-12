# Rencana berikutnya

Fitur inti EvoLyric sudah lengkap (v150). Daftar ini mencatat pekerjaan yang sengaja ditunda, urut dari yang paling penting.

## Sebelum dibuka untuk umum
1. **Kebijakan Privasi dan Syarat Layanan.** Login Google untuk publik (verifikasi OAuth consent screen) biasanya meminta tautan ke kedua halaman ini. Isi minimal: data apa yang disimpan (lagu, kategori, profil, email untuk login), di mana (perangkat dan Supabase), siapa yang bisa melihatnya (email tidak pernah ditampilkan ke pengguna lain), cara menghapus akun dan data (sudah ada: Pengaturan Akun → Hapus akun, v158), serta catatan bahwa lirik adalah tanggung jawab pengguna. Tautkan dari Bantuan dan dari layar masuk.
2. **Laporan error.** Saat ini error di perangkat pengguna lain tidak terlihat. Rencana: tabel kecil di Supabase (versi app, perangkat, pesan error, waktu; tanpa isi lirik), diisi dari `window.onerror` / `unhandledrejection`, dibatasi beberapa laporan per sesi, dan bisa dimatikan di Preferensi.

## Ditunda atas permintaan
3. **Web help / FAQ** terpisah dari aplikasi (panduan lengkap, tanya jawab). Bisa sekalian menampung halaman Kebijakan Privasi dan Syarat Layanan.
4. **EvoImport**: aplikasi pendamping untuk memindahkan banyak lirik dari aplikasi catatan sekaligus. Desain sudah ada; jalur Shortcut Apple Notes → Impor .txt sudah berjalan di aplikasi.
5. **Impor dari Android**: padanan Shortcut untuk Android (misalnya ekspor Google Keep / share target).

## Catatan kecil
- Pengguna lama yang masuk di perangkat baru bisa melihat tur interaktif sekali bila lagunya belum selesai tersinkron saat Home pertama terbuka. Tidak berbahaya (bisa dilewati).
