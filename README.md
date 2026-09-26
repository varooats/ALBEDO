<div align="center">

# ALBEDO-BOT

**Advanced WhatsApp Bot dengan Fitur Modular & Interactive**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-varooats%2FBOT--WA-black?style=flat-square&logo=github)](https://github.com/varooats/BOT-WA)
[![Version](https://img.shields.io/badge/Version-1.1.0-orange?style=flat-square)](https://github.com/varooats/BOT-WA/releases)

</div>

---

## [TABLE OF CONTENTS]

- [>> FITUR](#-fitur)
- [>> PERSYARATAN](#-persyaratan)
- [>> INSTALASI](#-instalasi)
- [>> KONFIGURASI](#-konfigurasi)
- [>> STRUKTUR PROYEK](#-struktur-proyek)
- [>> PERINTAH BOT](#-perintah-bot)
- [>> DEVELOPMENT](#-development)

---

## >> FITUR

### | ENTERTAINMENT & GAMES
- 20+ mini games (tebakan, quiz, duel)
- Tarot card reading interaktif
- Fun commands (cek personality)
- Konverter text & media (sticker, video, dll)

### | GROUP MANAGEMENT  
- Proteksi link & kata kasar
- Manajemen member (kick, promote, demote)
- Statistik group & pesan
- Pin chat & hidetag

### | BOT CONTROL
- Limit system per user
- Owner management & authentication
- Settings group & bot
- AFK status dengan notifikasi mention

### | MEDIA DOWNLOADER
- YouTube, TikTok, Instagram, Spotify
- Konversi media & sticker maker
- Download/streaming musik

### | USER FEATURES
- Profile management & editing
- User statistics & score tracking
- Store & item system
- Daily rewards

---

## >> PERSYARATAN

| Requirement | Versi | Keterangan |
|:-----------:|:-----:|-----------|
| **Node.js** | 18+ | Runtime JavaScript |
| **npm** | 8+ | Package manager |
| **WhatsApp** | Aktif | Akun untuk login (QR Scan) |
| **Firebase** | Optional | Untuk Firestore features |

> [!] Firebase diperlukan untuk group settings, user limits, dan owner management

---

## >> INSTALASI

### [1] Clone Repository
```bash
git clone https://github.com/varooats/BOT-WA.git
cd BOT-WA
```

### [2] Install Dependencies
```bash
npm install
```

### [3] Setup Firebase Credentials
Simpan credentials Firebase di file `.env` (Recommended) atau taruh file JSON di `src/database/secrets/`:

```env
# Paste isi service account JSON utuh (atau base64 encoded)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

### [4] Jalankan Bot
Pilih metode login sesi yang diinginkan:

```bash
# Opsi A: Login via Scan QR Code
npm run start:qr
# atau: npm start

# Opsi B: Login via Pairing Code (Tanpa Scan QR)
npm run start:code
# atau atur LOGIN_METHOD=code & PAIRING_NUMBER=628xxx di .env
```

---

## >> KONFIGURASI

### Environment Variables

Buat file `.env` di root project (optional, aplikasi punya default values):

```env
BOT_NAME=ALBEDO
BOT_PREFIX=.
OWNER_NUMBER=6285746345170
OWNER_NAME=varo
OWNER_ROLE=OWNER BOT
DEV_NAME=Varo
DEV_GITHUB=https://github.com/varooats
```

### Konfigurasi Lengkap

| Variable | Default | Deskripsi |
|:---------|:-------:|-----------|
| `LOGIN_METHOD` | `qr` | Metode login WhatsApp (`qr` atau `code`) |
| `PAIRING_NUMBER` | - | Nomor WhatsApp bot jika menggunakan login `code` |
| `FIREBASE_SERVICE_ACCOUNT` | - | Isi JSON Service Account Firebase (string/base64) |
| `BOT_NAME` | `ALBEDO` | Nama yang tampil di bot |
| `BOT_PREFIX` | `.` | Prefix untuk menjalankan command |
| `OWNER_NUMBER` | `6285746345170` | Nomor WhatsApp owner |
| `OWNER_NAME` | `varo` | Nama owner |
| `OWNER_ROLE` | `OWNER BOT` | Role/badge owner |
| `OWNER_CONTACT` | Dari `OWNER_NUMBER` | Kontak alternatif owner |
| `DONATE_INFO` | Default msg | Info donasi |
| `DEV_NAME` | `Varo` | Nama developer |
| `DEV_ROLE` | `Developer` | Role developer |
| `DEV_GITHUB` | Konfigurasi | URL GitHub developer |
| `DEV_WEBSITE` | Konfigurasi | Website developer |

---

## >> STRUKTUR PROYEK

```
ALBEDO-BOT/
├── src/
│   ├── commands/          [+] Command handlers
│   │   ├── general/       Menu, profile, settings, afk
│   │   ├── group/         Group management
│   │   ├── owner/         Owner commands
│   │   ├── games/         Game commands
│   │   ├── fun/           Fun & entertainment
│   │   ├── downloader/    Media downloader
│   │   ├── converter/     Media converter
│   │   ├── ai/            AI features
│   │   ├── support/       Support commands
│   │   └── tarot/         Tarot readings
│   ├── core/              [*] Core system
│   │   ├── command.factory.js
│   │   ├── command.loader.js
│   │   ├── middleware.js
│   │   └── reply.js
│   ├── handlers/          [>>] Message handlers
│   ├── features/          [#] Feature services
│   │   ├── menu/
│   │   ├── profile/
│   │   ├── group/
│   │   ├── afk/
│   │   ├── owner/
│   │   ├── limit/
│   │   ├── welcome/
│   │   └── tarot/
│   ├── database/          [DB] Firebase & repositories
│   ├── config/            [=] Configuration
│   ├── messages/          [<] Message templates
│   ├── services/          [~] External services
│   ├── utils/             [!] Utilities
│   └── data/              [@] JSON data files
├── assets/                [*] Static assets: audio, banner, templates, tarot (Masuk Git)
│   ├── audio/             Voice note audio (.mp3, .ogg)
│   ├── banner/            Video banner menu (.mp4)
│   └── tarot/             Gambar kartu tarot
├── storage/               [!] Dynamic runtime storage (Di-ignore Git)
│   ├── auth/              WhatsApp multi-device session
│   └── temp/              Temporary files
├── test/                  [?] Self-check tests
└── package.json
```

---

## >> PERINTAH BOT

<details>
<summary><strong>[*] GROUP COMMANDS (ADMIN/OWNER)</strong></summary>

### LINK PROTECTION
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Antilink | `.antilink <all\|custom\|off>` | Aktifkan proteksi link |
| Add Link | `.addlink <domain>` | Tambah domain trusted |
| Del Link | `.dellink <domain>` | Hapus domain trusted |
| List Link | `.listlink` | Lihat daftar domain |

### TOXIC PROTECTION
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Antitoxic | `.antitoxic <on\|off>` | Aktifkan filter kata |
| Add Badword | `.addbadword <word>` | Tambah kata kasar |
| Del Badword | `.delbadword <word>` | Hapus kata kasar |
| List Badword | `.listbadword` | Lihat daftar kata |

### MANAGEMENT
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Hidetag | `.hidetag <pesan>` atau `.ta` | Kirim pesan ke semua |
| Group Link | `.grouplink` | Dapat link grup |
| Kick | `.kick @user` | Keluarkan member |
| Promote | `.promote @user` | Jadikan admin |
| Demote | `.demote @user` | Lepas admin |
| Open Group | `.opengroup` | Buka grup |
| Close Group | `.closegroup` | Tutup grup |
| Group Info | `.groupinfo` | Info grup |
| Member Count | `.membercount` | Jumlah member |
| Message Count | `.messagecount <day\|month\|all>` | Statistik pesan |

### CHAT PIN
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Pin Chat | `.pinchat <24h\|7d\|30d>` | Pin pesan |
| Unpin | `.unpinchat` | Unpin pesan |

</details>

<details>
<summary><strong>[*] OWNER COMMANDS</strong></summary>

### LIMIT SYSTEM
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Set Limit | `.setlimit <jumlah> <@user\|all>` | Set limit user |
| Add Limit | `.addlimit <jumlah> <@user\|all>` | Tambah limit |
| Get Limit | `.getlimit <@user>` | Lihat limit user |

### OWNER MANAGEMENT
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| List Owner | `.listowner` | Daftar owner |
| Add Owner | `.addowner <nomor>` | Tambah owner baru |
| Del Owner | `.delowner <nomor>` | Hapus owner |

### BOT CONTROL
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Restart | `.restart` | Restart bot |
| Backup | `.backup` | Backup database |
| Status | `.status` | Status bot |
| Runtime | `.runtime` | Uptime bot |

</details>

<details>
<summary><strong>[*] SETTINGS & GENERAL</strong></summary>

### MAIN COMMANDS
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Menu | `.menu` | Tampilkan menu |
| Profile | `.profile [@user]` | Lihat profil |
| Edit Profile | `.editprofile` | Edit profil sendiri |
| AFK | `.afk <alasan>` | Atur status AFK |
| Limit | `.limit` | Lihat limit command |
| Store | `.store` | Buka toko item |

### SETTINGS
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Settings | `.settings` | Lihat pengaturan |
| Enable | `.enable <fitur>` | Aktifkan fitur |
| Disable | `.disable <fitur>` | Nonaktifkan fitur |

**Group Settings:**
- `welcome` — Pesan sambutan member baru
- `left` — Pesan ucapan selamat tinggal
- `detect` — Deteksi konten
- `antidetect` — Block anti-deteksi
- `autolevelup` — Naikkan level otomatis

**Bot Settings:**
- `public` — Bot bisa digunakan di DM
- `autoread` — Baca pesan otomatis
- `grouponly` — Hanya berlaku di grup
- `anticall` — Block panggilan

</details>

<details>
<summary><strong>[*] GAMES & ENTERTAINMENT</strong></summary>

### GAMES
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Quiz | `.quiz` | Tanya jawab umum |
| Tebak Kata | `.tebakkata` | Tebak kata dari emoji |
| Susun Kata | `.susunkata` | Susun kata berantai |
| Tebak Gambar | `.tebakgambar` | Tebak apa itu |
| Tebak Angka | `.tebakangka` | Tebak angka 1-100 |
| Tebak Bendera | `.tebakbendera` | Tebak bendera negara |
| Tebak Lagu | `.tebaklagu` | Tebak judul lagu |
| Caklontong | `.caklontong` | Tebakan tradisional |
| Siapa Kah Aku | `.siapakahaku` | Tebakan profesi |
| Asa Hotak | `.asahotak` | Akronim bahasa |

### PVP GAMES
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Duel | `.duel @user` | Main duel 1v1 |
| Suit | `.suit @user` | Main suit/gunting kertas |
| Tictactoe | `.tictactoe @user` | Main X & O |
| Coinflip | `.coinflip` | Flip koin |
| Roulette | `.roulette` | Permainan roulette |
| Slot | `.slot` | Main mesin slot |
| Daily | `.daily` | Klaim reward harian |
| Score | `.score` | Lihat score game |

### FUN COMMANDS
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Cek Femboy | `.cekfemboy @user` | Hasil jadi femboy % |
| Cek Beban | `.cekbeban @user` | Hasil jadi beban % |
| Cek Tampan | `.cektampan` | Seberapa tampan? |
| Cek Cantik | `.cekcantik` | Seberapa cantik? |
| Cek Harga Diri | `.cekhargadiri` | Harga diri mu |
| Cek Jodoh | `.cekjodoh [@user]` | Cocok dengan siapa? |
| Cek Cocok | `.cekcocok @user` | Compatibility % |
| Fun | `.fun` | Random fun fact |

### TAROT & CONVERTER
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Tarot | `.tarot` | Tarikan kartu tarot |
| Brat | `.brat <teks>` | Generator sticker brat |
| Brat Video | `.bratvid <teks>` | Brat video dengan teks |
| Brat Anime | `.bratanime <teks>` | Brat anime version |
| Sticker | `.sticker` | Buat stiker dari gambar |
| Swm | `.swm <pack\|author>` | Sticker pack metadata |
| IQC | `.iqc` | Image quality checker |

</details>

<details>
<summary><strong>[*] DOWNLOADER & CONVERTER</strong></summary>

| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Download | `.download <url>` | Download media |
| Play | `.play <judul>` | Streaming musik |
| TikTok | `.tiktok <url>` | Download TikTok |
| YouTube | `.youtube <url>` | Download YouTube |
| Instagram | `.instagram <url>` | Download Instagram |
| Spotify | `.spotify <url>` | Download Spotify |
| Audio Convert | `.mp3`, `.wav`, dll | Konversi format audio |
| Video Convert | `.mp4`, `.webm`, dll | Konversi format video |

</details>

---

## >> DEVELOPMENT

### SELF-CHECK / TESTING
```bash
npm test
```
Menjalankan self-check untuk memverifikasi:
- Semua command terdaftar
- Database connection
- Message formatting
- Error handling

### GIT WORKFLOW
```bash
# Lihat perubahan
git status

# Commit dengan pesan deskriptif
git commit -m "feat: deskripsi fitur"

# Push ke GitHub
git push origin main

# Buat release tag
git tag v1.x.x
git push origin v1.x.x
```

### DEBUGGING
Enable debug mode:
```bash
DEBUG=* npm start
```

---

## STATISTICS & MONITORING

Bot mencatat:
- [OK] Perintah yang dijalankan
- [OK] Statistik group (member, pesan, activity)
- [OK] User limits & usage
- [OK] Error logs
- [OK] Performance metrics

Data tersimpan di Firestore (jika connected) atau JSON cache.

---

## KONTRIBUSI

Kontribusi welcome! Fork repository dan submit pull request.

```bash
git checkout -b feature/new-feature
git commit -m "Add new feature"
git push origin feature/new-feature
```

---

## LISENSI

MIT License - bebas digunakan untuk komersial & non-komersial.

---

<div align="center">

**Made with LOVE by [Varo](https://github.com/varooats)**

[![GitHub Stars](https://img.shields.io/github/stars/varooats/BOT-WA?style=social)](https://github.com/varooats/BOT-WA)
[![GitHub Followers](https://img.shields.io/github/followers/varooats?style=social)](https://github.com/varooats)

</div>
