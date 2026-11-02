# Google Sign-In untuk EvoLyric (Supabase Auth)

Kode sudah terpasang. Login Google baru aktif setelah 4 langkah konfigurasi di bawah (butuh akun Google Cloud dan Supabase milik Anda). Tanpa konfigurasi, app tetap jalan penuh sebagai Guest Demo dan tombol Sign In menampilkan pesan "belum dikonfigurasi".

## 1. Supabase: buat project
1. supabase.com > New project.
2. Project Settings > API: salin **Project URL** dan **anon public key** (JANGAN service_role).
3. SQL Editor: jalankan isi `supabase/001_profiles.sql`.

## 2. Google Cloud Console: OAuth Client
1. console.cloud.google.com > pilih/buat project > **APIs & Services > OAuth consent screen**: tipe External, isi nama app (EvoLyric), email dukungan, dan authorized domain (domain workers.dev/domain Anda). Scope cukup default (email, profile, openid).
2. **Credentials > Create Credentials > OAuth client ID > Web application**.
3. **Authorized JavaScript origins**: `https://<DOMAIN-APP-ANDA>.workers.dev` (salin PERSIS dari alamat bar saat app terbuka; di versi sebelumnya tertulis "evonlyiric5" yang tampaknya salah ketik; dan domain kustom bila ada; untuk uji lokal `http://localhost:8080`).
4. **Authorized redirect URIs**: `https://<PROJECT-REF>.supabase.co/auth/v1/callback` (URL persis ada di Supabase > Authentication > Providers > Google).
5. Salin **Client ID** dan **Client Secret**.

## 3. Supabase: aktifkan Google
1. Authentication > Providers > Google: Enable, tempel Client ID dan Client Secret (rahasia ini hanya disimpan di Supabase, bukan di kode).
2. Authentication > URL Configuration:
   - **Site URL**: `https://<DOMAIN-APP-ANDA>.workers.dev`
   - **Redirect URLs**: tambahkan `https://<DOMAIN-APP-ANDA>.workers.dev/**` (dan `http://localhost:8080/**` untuk uji lokal).

## 4. Isi `www/config.js`
    window.EVO_CONFIG = { SUPABASE_URL: "https://<PROJECT-REF>.supabase.co", SUPABASE_ANON_KEY: "<anon public key>" };
Lalu naikkan versi cache di `sw.js` (naikkan angkanya satu tingkat, misalnya `evolyric-app-12` menjadi `evolyric-app-13`), unggah ulang folder `www`, buka app online, tutup sepenuhnya, dan buka lagi.

## Catatan
- Aplikasi native (Capacitor) memerlukan deep-link redirect tambahan; fase ini hanya untuk web/PWA.
- Lagu masih tersimpan lokal di perangkat. Sign-in belum menyinkronkan library ke cloud (fase berikutnya).

- iPhone/iPad: bila app dipasang di layar utama (standalone), login Google bisa membuka Safari lalu kembali ke tab Safari, bukan ke ikon app. Ini batasan iOS untuk PWA. Uji dulu di perangkat nyata sebelum mengandalkannya; membuka EvoLyric lewat Safari biasa selalu bisa dipakai login.
