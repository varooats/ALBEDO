<div align="center">

# 🤖 ALBEDO-BOT

**Advanced WhatsApp Bot dengan Fitur Modular & Interactive**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-varooats%2FBOT--WA-black?style=flat-square&logo=github)](https://github.com/varooats/BOT-WA)
[![Version](https://img.shields.io/badge/Version-1.1.0-orange?style=flat-square)](https://github.com/varooats/BOT-WA/releases)

</div>

---

## 📋 Daftar Isi
- [✨ Fitur](#-fitur)
- [📦 Persyaratan](#-persyaratan)
- [🚀 Instalasi](#-instalasi)
- [⚙️ Konfigurasi](#-konfigurasi)
- [🏗️ Struktur Proyek](#-struktur-proyek)
- [📚 Perintah Bot](#-perintah-bot)
- [🛠️ Development](#-development)

---

## ✨ Fitur

### 🎮 Entertainment & Games
- 20+ mini games (tebakan, quiz, duel)
- Tarot card reading interaktif
- Fun commands (cek personality)
- Konverter text & media (sticker, video, dll)

### 👥 Group Management  
- Proteksi link & kata kasar
- Manajemen member (kick, promote, demote)
- Statistik group & pesan
- Pin chat & hidetag

### 🔐 Bot Control
- Limit system per user
- Owner management & authentication
- Settings group & bot
- AFK status dengan notifikasi mention

### 📥 Media Downloader
- YouTube, TikTok, Instagram, Spotify
- Konversi media & sticker maker
- Download/streaming musik

### 📊 User Features
- Profile management & editing
- User statistics & score tracking
- Store & item system
- Daily rewards

---

## 📦 Persyaratan

| Requirement | Versi | Keterangan |
|:-----------:|:-----:|-----------|
| **Node.js** | 18+ | Runtime JavaScript |
| **npm** | 8+ | Package manager |
| **WhatsApp** | Aktif | Akun untuk login (QR Scan) |
| **Firebase** | Optional | Untuk Firestore features |

> ⚠️ **Catatan**: Firebase diperlukan untuk group settings, user limits, dan owner management

---

## 🚀 Instalasi

### 1️⃣ Clone Repository
```bash
git clone https://github.com/varooats/BOT-WA.git
cd BOT-WA
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Setup Firebase (Optional)
Letakkan file `serviceAccountKey.json` di folder `src/database/secrets/`:
```
src/database/secrets/serviceAccountKey.json
```
> 🔒 Folder ini di-ignore oleh Git untuk keamanan kredensial

### 4️⃣ Jalankan Bot
```bash
npm start
```

**Output pertama kali:**
```
[INFO] Scanning QR Code...
[INFO] Session saved to storage/auth/
[INFO] Bot connected ✓
```

Pindai QR dengan WhatsApp. Sesi otomatis tersimpan dan digunakan kembali saat restart.

---

## ⚙️ Konfigurasi

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

## 🏗️ Struktur Proyek

```
ALBEDO-BOT/
├── src/
│   ├── commands/          # ⚡ Command handlers
│   │   ├── general/       # Menu, profile, settings, afk
│   │   ├── group/         # Group management
│   │   ├── owner/         # Owner commands
│   │   ├── games/         # Game commands
│   │   ├── fun/           # Fun & entertainment
│   │   ├── downloader/    # Media downloader
│   │   ├── converter/     # Media converter
│   │   ├── ai/            # AI features
│   │   ├── support/       # Support commands
│   │   └── tarot/         # Tarot readings
│   ├── core/              # 🔧 Core system
│   │   ├── command.factory.js
│   │   ├── command.loader.js
│   │   ├── middleware.js
│   │   └── reply.js
│   ├── handlers/          # 📩 Message handlers
│   ├── features/          # 🎯 Feature services
│   │   ├── menu/
│   │   ├── profile/
│   │   ├── group/
│   │   ├── afk/
│   │   ├── owner/
│   │   ├── limit/
│   │   ├── welcome/
│   │   └── tarot/
│   ├── database/          # 🗄️ Firebase & repositories
│   ├── config/            # ⚙️ Configuration
│   ├── messages/          # 💬 Message templates
│   ├── services/          # 🔌 External services
│   ├── utils/             # 🛠️ Utilities
│   └── data/              # 📊 JSON data files
├── public/
│   └── assets/            # 🖼️ Images, videos, audio
├── storage/
│   ├── auth/              # WhatsApp session
│   ├── media/
│   └── temp/
├── test/                  # 🧪 Self-check tests
└── package.json
```

---

## 📚 Perintah Bot

<details>
<summary><strong>👥 Group Commands (Admin/Owner)</strong></summary>

### 🔗 Link Protection
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Antilink | `.antilink <all\|custom\|off>` | Aktifkan proteksi link |
| Add Link | `.addlink <domain>` | Tambah domain trusted |
| Del Link | `.dellink <domain>` | Hapus domain trusted |
| List Link | `.listlink` | Lihat daftar domain |

### 🚫 Toxic Protection
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Antitoxic | `.antitoxic <on\|off>` | Aktifkan filter kata |
| Add Badword | `.addbadword <word>` | Tambah kata kasar |
| Del Badword | `.delbadword <word>` | Hapus kata kasar |
| List Badword | `.listbadword` | Lihat daftar kata |

### 👤 Management
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

### 📌 Chat Pin
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Pin Chat | `.pinchat <24h\|7d\|30d>` | Pin pesan |
| Unpin | `.unpinchat` | Unpin pesan |

</details>

<details>
<summary><strong>👑 Owner Commands</strong></summary>

### 💰 Limit System
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Set Limit | `.setlimit <jumlah> <@user\|all>` | Set limit user |
| Add Limit | `.addlimit <jumlah> <@user\|all>` | Tambah limit |
| Get Limit | `.getlimit <@user>` | Lihat limit user |

### 👨‍💼 Owner Management
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| List Owner | `.listowner` | Daftar owner |
| Add Owner | `.addowner <nomor>` | Tambah owner baru |
| Del Owner | `.delowner <nomor>` | Hapus owner |

### 🎮 Bot Control
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Restart | `.restart` | Restart bot |
| Backup | `.backup` | Backup database |
| Status | `.status` | Status bot |
| Runtime | `.runtime` | Uptime bot |

</details>

<details>
<summary><strong>⚙️ Settings & General</strong></summary>

### Main Commands
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Menu | `.menu` | Tampilkan menu |
| Profile | `.profile [@user]` | Lihat profil |
| Edit Profile | `.editprofile` | Edit profil sendiri |
| AFK | `.afk <alasan>` | Atur status AFK |
| Limit | `.limit` | Lihat limit command |
| Store | `.store` | Buka toko item |

### Settings
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
<summary><strong>🎮 Games & Entertainment</strong></summary>

### 🎯 Games
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

### ⚔️ PvP Games
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

### 🎭 Fun Commands
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

### 🃏 Tarot & Converter
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
<summary><strong>📥 Downloader & Converter</strong></summary>

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

## 🛠️ Development

### ✅ Self-Check / Testing
```bash
npm test
```
Menjalankan self-check untuk memverifikasi:
- Semua command terdaftar
- Database connection
- Message formatting
- Error handling

### 📝 Git Workflow
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

### 🔍 Debugging
Enable debug mode:
```bash
DEBUG=* npm start
```

---

## 📊 Statistics & Monitoring

Bot mencatat:
- ✅ Perintah yang dijalankan
- ✅ Statistik group (member, pesan, activity)
- ✅ User limits & usage
- ✅ Error logs
- ✅ Performance metrics

Data tersimpan di Firestore (jika connected) atau JSON cache.

---

## 🤝 Kontribusi

Kontribusi welcome! Fork repository dan submit pull request.

```bash
git checkout -b feature/new-feature
git commit -m "Add new feature"
git push origin feature/new-feature
```

---

## 📄 Lisensi

MIT License - bebas digunakan untuk komersial & non-komersial.

---

<div align="center">

**Made with ❤️ by [Varo](https://github.com/varooats)**

[![GitHub Stars](https://img.shields.io/github/stars/varooats/BOT-WA?style=social)](https://github.com/varooats/BOT-WA)
[![GitHub Followers](https://img.shields.io/github/followers/varooats?style=social)](https://github.com/varooats)

</div>
