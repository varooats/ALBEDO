# ALBEDO-BOT

Bot WhatsApp berbasis Baileys dengan command modular. Fitur mencakup menu dan profil, game, tarot, downloader, konversi media, serta pesan sambutan grup.

## Persyaratan

- Node.js dan npm
- Akun WhatsApp untuk memindai QR
- Firebase service account JSON untuk fitur yang memakai Firestore

## Instalasi dan menjalankan

```bash
npm install
npm start
```

Saat pertama berjalan, pindai QR yang tampil di terminal dengan WhatsApp. Sesi tersimpan di `storage/auth/` dan digunakan kembali pada koneksi berikutnya.

Untuk mengaktifkan Firestore, letakkan service account JSON di `src/database/secrets/`. Folder ini diabaikan Git; jangan commit kredensial. Tanpa kredensial, koneksi database gagal dan bot mencatat peringatan.

## Konfigurasi

Aplikasi membaca konfigurasi dari environment process. `dotenv` belum dipanggil oleh kode, jadi file `.env` tidak dimuat otomatis.

| Variabel | Default | Kegunaan |
| --- | --- | --- |
| `BOT_NAME` | `ALBEDO` | Nama bot |
| `BOT_PREFIX` | `.` | Prefix command |
| `OWNER_NUMBER` | `6285746345170` | Nomor owner |
| `OWNER_NAME` | `varo` | Nama owner |
| `OWNER_ROLE` | `OWNER BOT` | Label peran owner |
| `OWNER_CONTACT` | `OWNER_NUMBER` atau `6285111411152` | Kontak owner |
| `DONATE_INFO` | `Hubungi owner untuk detail donasi operasional bot.` | Informasi donasi |
| `DEV_NAME` | `Varo` | Nama developer |
| `DEV_ROLE` | `Developer` | Peran developer |
| `DEV_GITHUB` | URL GitHub developer di konfigurasi | Tautan GitHub developer |
| `DEV_WEBSITE` | URL situs developer di konfigurasi | Tautan situs developer |

Nilai `DATABASE_URL` dan `DB_DIALECT` di `.env.example` belum mengatur koneksi database; aplikasi memakai Firebase Admin dan Firestore.

## Pengembangan

```bash
npm test
```

Perintah ini menjalankan self-check command bot.

## Struktur proyek

- `src/commands/` — command bot, dikelompokkan berdasarkan fitur
- `src/handlers/` — handler pesan
- `src/features/` — logika fitur, termasuk welcome, tarot, menu, dan profil
- `src/core/` — pemuatan command, middleware, dan reply
- `src/config/` — konfigurasi bot dan database
- `src/database/` — integrasi Firebase/Firestore
- `src/data/` — data JSON fitur
- `src/messages/` — pesan bot
- `public/` — aset gambar dan video
- `storage/` — sesi WhatsApp dan file runtime lokal
- `test/` — self-check