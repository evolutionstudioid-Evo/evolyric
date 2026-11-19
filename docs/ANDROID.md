# EvoLyric untuk Android (Play Store) — TWA

APK/AAB dibungkus dari https://evolyric.com dengan Trusted Web Activity (Bubblewrap). Kode aplikasi (`www/`) tidak berubah.

## Build
1. Buat upload keystore (sekali saja, simpan cadangannya; jangan di-commit):
   `keytool -genkeypair -v -keystore android.keystore -alias evolyric -keyalg RSA -keysize 2048 -validity 10000`
2. Secrets repo: `ANDROID_KEYSTORE_B64` (`base64 -w0 android.keystore`) dan `ANDROID_KEYSTORE_PASSWORD` (storepass = keypass).
3. Actions → "Build Android AAB (TWA)" → Run workflow → unduh artifact `evolyric-android`.

## Play Console
- Akun developer (biaya sekali bayar + verifikasi identitas). Akun pribadi baru wajib closed testing dengan 12 penguji selama 14 hari sebelum Production.
- Buat app, aktifkan Play App Signing, unggah `.aab`.
- Privacy policy URL: https://evolyric.com/privacy.html ; isi Data safety (Google login, Supabase), content rating, screenshot.

## Digital Asset Links (wajib agar tanpa address bar)
Setelah unggah pertama, ambil SHA-256 *App signing key* di Play Console → App integrity, lalu sajikan
`https://evolyric.com/.well-known/assetlinks.json` (dari `www/.well-known/`, perlu persetujuan deploy):
`[{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"android_app","package_name":"id.evolyric.app","sha256_cert_fingerprints":["<SHA256>"]}}]`
Pastikan worker.js tidak menimpa path `/.well-known/*`.

## iOS
App Store: coming soon (belum dikerjakan).
