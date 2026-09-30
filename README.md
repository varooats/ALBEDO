<div align="center">

# ALBEDO-BOT

**Advanced WhatsApp Bot dengan Fitur Modular & Interactive**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-varooats%2FBOT--WA-black?style=flat-square&logo=github)](https://github.com/varooats/BOT-WA)
[![Version](https://img.shields.io/badge/Version-1.1.7-orange?style=flat-square)](https://github.com/varooats/BOT-WA/releases)

</div>

---

## [TABLE OF CONTENTS]

- [>> FITUR](#-fitur)
- [>> PERSYARATAN](#-persyaratan)
- [>> INSTALASI & MULTI-ENV](#-instalasi--multi-env)
- [>> KONFIGURASI](#-konfigurasi)
- [>> STRUKTUR PROYEK](#-struktur-proyek)
- [>> PERINTAH BOT](#-perintah-bot)
- [>> ARSITEKTUR AKSES & PIPELINE](#-arsitektur-akses--pipeline)
- [>> DEVELOPMENT](#-development)

---

## >> FITUR

### | SECURITY & ACCESS CONTROL (UNIFIED PIPELINE)
- **Unified Middleware Pipeline**: `Parser -> Scope Resolver -> Ban Check -> Rate Limit -> Maintenance -> Command/Feature Lock -> Role Gatekeeper -> Cooldown -> Scoped Limit -> Executor`.
- **Role-Based Access Control (RBAC)**: `SUPEROWNER` (100) > `OWNER` (90) > `ADMIN` (70) > `GROUP_ADMIN` / `MODERATOR` (50) > `VIP` (40) > `PREMIUM` (30) > `USER` (20) > `GUEST` (10) > `BANNED` (0).
- **Owner Full Access**: Bebas limit (`∞`), bypass cooldown, bypass maintenance, dan bypass command lock.
- **Granular Ban System**:
  - Global Bot Blacklist (`.banuser`, `.unbanuser`, `.checkban`, `.listban`)
  - Scoped Group Ban (user diban hanya di grup tertentu)
  - Command Ban (user diblokir dari command tertentu)
- **Command Lock / Unlock**: Aktifkan/matikan command individual secara global atau per grup (`.command on|off <cmd>`, `.disablecmd <cmd>`, `.enablecmd <cmd>`).
- **Anti Abuse & Rate Limit**: 5 command / 10 detik per user, 50 command / 10 detik per group, 1000/menit global.
- **Cooldown Engine**: Pengaturan jeda waktu per-command (misal `.play` 15s, `.tiktok` 10s, `.ping` 3s, owner & VIP auto-bypass).
- **Group Whitelist Protection**: Bot proteksi auto-leave / approval saat dimasukkan ke grup baru (`.groupallow`, `.groupblock`, `.grouplist`).
- **Emergency Control**: Shutdown (`.shutdown`, `.shutdown 10m`) & Maintenance Mode (`.maintenance on|off`).
- **Structured Audit Log**: Catatan rapi `[OWNER]`, `[GROUP]`, `[ADMIN]`, `[SECURITY]`, `[SETTINGS]`.

### | MULTI-TENANT USER SCOPE
- Data pengguna dipisahkan per grup (`userId + scopeId`):
  - Limit, Level, EXP, dan Tier terisolasi antar-grup (`628xxx @GroupA` vs `628xxx @GroupB`).
  - Reset kuota limit harian independen per scope.
  - Sesi login WhatsApp terisolasi per environment (`storage/auth` untuk prod, `storage/auth-development` untuk dev).

### | ENTERTAINMENT & GAMES
- 25+ mini games (tebakan, quiz, duel, cak lontong, susun kata, asah otak)
- Tarot card reading interaktif
- Fun commands (cek personality)
- Konverter text & media (sticker maker, Brat generator SVG/video, toimg, iqc)

### | MEDIA DOWNLOADER (SMART RETRY & SECTIONS)
- **Universal Multi-Platform Downloader**: YouTube, TikTok, Instagram, Spotify, SoundCloud, Facebook, Threads, Twitter/X, Pinterest, Bilibili, dll.
- **Interactive Sections List**: Menu pilihan kualitas dan tipe file menggunakan WhatsApp Sections List (bebas tombol bug).
- **Anti Geo-Restriction & Multi-Candidate**: Otomatis fallback ke kandidat video YouTube berikutnya jika video pertama terblokir wilayah/cipher.
- **Auto Audio Pre-fetching**: Mengambil cover art/thumbnail asli Spotify & metadata sebelum mengirim audio.

### | AI & ASSISTANT (HARDENED & SECURE)
- DeepSeek v4 AI terintegrasi via APMIX (`.ai` & `.chat`)
- **Long-Text & Abuse Guard**:
  - Batasan input maksimal 1000 karakter untuk mencegah overload server.
  - Batasan respons maksimal 3000 karakter agar tampilan chat WhatsApp tetap nyaman dan tidak freeze.
  - Filter karakter invisible/zero-width space dan deteksi spam karakter berulang.
- Percakapan multi-turn berkelanjutan dengan memori sesi (`.chat`).
- Forwarding tiket bug/laporan/saran langsung ke WhatsApp Owner (`.report`, `.bug`, `.feedback`, `.request`).

### | USER & INTERACTIVE UI
- WhatsApp Native Flow sections interactive menu
- Voice Note Audio acak saat membuka `.menu`
- Cyberpunk soft terminal logger dengan status environment banner
- Student Identity Card generator (`.profile`) dengan fallback avatar default `assets/profile-picture.jpeg`
- Store & item system pembelian kuota limit dengan EXP (`.store`, `.buy`)
- Daily rewards & level auto-scaling

---

## >> PERSYARATAN

| Requirement | Versi | Keterangan |
|:-----------:|:-----:|-----------|
| **Node.js** | 18+ (Dianjurkan v20+) | Runtime JavaScript |
| **npm** | 8+ | Package manager |
| **WhatsApp** | Aktif | Akun bot (QR Scan atau Pairing Code) |
| **Firebase** | Wajib | Firestore database untuk user, group & settings |

---

## >> INSTALASI & MULTI-ENV

### [1] Clone Repository
```bash
git clone https://github.com/varooats/BOT-WA.git
cd BOT-WA
```

### [2] Install Dependencies
```bash
npm install
```

### [3] Setup Environment File
Salin template konfigurasi:
```bash
cp .env.example .env
```
Edit file `.env` sesuai kredensial Firebase dan identitas bot Anda.

### [4] Menjalankan Bot Sesuai Mode

```bash
# Mode Production (Standar)
npm start          # Sesi QR di storage/auth
npm run start:code # Sesi Pairing Code di storage/auth

# Mode Development (Isolasi sesi di storage/auth-development)
npm run dev        # Sesi QR dev
npm run dev:code   # Sesi Pairing Code dev

# Mode Staging
npm run staging
```

---

## >> KONFIGURASI

Contoh isi file `.env`:

```env
# Mode Environment: 'development' | 'production' | 'staging'
NODE_ENV=production

# Identitas Bot
BOT_NAME=ALBEDO
BOT_PREFIX=.

# Metode Login WhatsApp: 'qr' atau 'code'
LOGIN_METHOD=qr
PAIRING_NUMBER=628xxxxxxx

# Kontak & Informasi Owner
OWNER_NUMBER=6285895263052
OWNER_NAME=varo
OWNER_ROLE=OWNER BOT
OWNER_CONTACT=6285895263052
DONATE_INFO=Hubungi owner untuk detail donasi operasional bot.

# Developer Info
DEV_NAME=Varo
DEV_ROLE=Developer
DEV_GITHUB=https://github.com/varooats
DEV_WEBSITE=https://varooats.xyz
DEV_INSTAGRAM=@varooats

# APMIX AI Configuration (DeepSeek / OpenAI Compatible)
APMIX_BASE_URL=https://api.apmix.ai/v1
APMIX_API_KEY=apx_live_xxxxxx
APMIX_MODEL=deepseek-v4-flash-free

# Log Level: 'debug' | 'info' | 'warn' | 'error'
LOG_LEVEL=info

# Firebase Credentials:
# Opsi 1: Path file JSON
FIREBASE_CREDENTIALS_PATH=./src/database/secrets/firebase-service-account.json
# Opsi 2: Variabel terpisah (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
# Opsi 3: Satu baris JSON string atau Base64 (FIREBASE_SERVICE_ACCOUNT)
```

---

## >> STRUKTUR PROYEK

```
ALBEDO-BOT/
├── src/
│   ├── commands/          [+] Command handlers
│   │   ├── general/       Menu, profile, settings, privacy, afk
│   │   ├── group/         Group moderation & whitelist (.groupallow, .groupblock)
│   │   ├── owner/         Hierarchy, blacklist, audit, command control (.command)
│   │   ├── games/         25+ Game commands & leaderboard
│   │   ├── fun/           Fun & personality tests
│   │   ├── downloader/    Downloader (YT, TT, IG, Spotify, Play, dlpick)
│   │   ├── converter/     Brat, sticker maker, toimg, iqc
│   │   ├── ai/            AI reasoning & hardened chat (.ai, .chat)
│   │   ├── support/       Bug report, feedback, request, FAQ
│   │   └── tarot/         Tarot card readings
│   ├── core/              [*] Core system & Pipeline
│   │   ├── command.factory.js  (Metadata roles, isPublic, limit, cooldown)
│   │   ├── command.loader.js   (Auto recursive walker)
│   │   ├── middleware.js       (Pipeline resolver & security)
│   │   ├── roles.js            (RBAC hierarchy & resolver)
│   │   ├── cooldown.js         (Per-command cooldown manager)
│   │   ├── rate-limit.js       (5 cmd / 10s anti-spam)
│   │   └── reply.js            (Reply helpers)
│   ├── database/          [DB] Firebase & Scoped Repositories
│   │   ├── models/        user.model.js, user-scope.model.js
│   │   └── repositories/  user.repository.js, user-scope.repository.js, group.repository.js
│   ├── handlers/          [>>] Message & command handlers
│   ├── services/          [~] Business logic services
│   │   ├── ai/            AI service with input/output sanitization
│   │   ├── downloader/    Tioo API, youtubei multi-client, invidious, cobalt
│   │   ├── feature/       Global & per-group feature & command lock
│   │   ├── limit/         Daily limit & store engine
│   │   └── security/      Blacklist & ban management
│   └── utils/             [!] Utilities & cyberpunk logger
├── assets/                [*] Static assets: audio, banner, profile-picture.jpeg
├── storage/               [!] Dynamic runtime storage (auth, auth-development, temp)
├── test/                  [?] Self-check test suites (40 test suites)
└── package.json
```

---

## >> PERINTAH BOT

<details>
<summary><strong>[*] OWNER & SYSTEM CONTROL COMMANDS</strong></summary>

### COMMAND ACCESS & LOCK
| Command | Syntax | Izin | Deskripsi |
|:--------|:-------|:----:|-----------|
| Command Control | `.command <on\|off> <cmd> [--group]` | OWNER / ADMIN | Aktifkan/matikan command global atau grup |
| Disable Command | `.disablecmd <cmd>` | OWNER / ADMIN | Matikan command tertentu |
| Enable Command | `.enablecmd <cmd>` | OWNER / ADMIN | Aktifkan kembali command |
| List Disabled | `.command list` | OWNER | Daftar command yang sedang dinonaktifkan |

### GROUP ACCESS & PROTECTION
| Command | Syntax | Izin | Deskripsi |
|:--------|:-------|:----:|-----------|
| Group Allow | `.groupallow [jid]` | OWNER | Setujui grup dan masukkan ke whitelist bot |
| Group Block | `.groupblock [jid]` | OWNER | Blokir grup & keluarkan bot otomatis |
| Group List | `.grouplist` | OWNER | Daftar grup aktif yang disetujui |

### OWNER & ADMIN HIERARCHY
| Command | Syntax | Izin | Deskripsi |
|:--------|:-------|:----:|-----------|
| List Owner | `.listowner` | ADMIN | Daftar hierarki Superowner, Owner, Admin |
| Add Owner | `.addowner <nomor>` | SUPEROWNER | Tambah owner baru |
| Del Owner | `.delowner <nomor>` | SUPEROWNER | Hapus owner terdaftar |
| Add Admin | `.addadmin <nomor>` | OWNER | Tambah bot admin baru |
| Del Admin | `.deladmin <nomor>` | OWNER | Hapus bot admin |

### USER BLACKLIST & BAN
| Command | Syntax | Izin | Deskripsi |
|:--------|:-------|:----:|-----------|
| Ban User | `.banuser @user [alasan]` | ADMIN | Blacklist pengguna dari bot |
| Unban User | `.unbanuser @user` | ADMIN | Buka blacklist pengguna |
| Check Ban | `.checkban @user` | ADMIN | Periksa status blacklist |
| List Ban | `.listban` | ADMIN | Daftar semua user yang diban |

### AUDIT LOG SYSTEM
| Command | Syntax | Izin | Deskripsi |
|:--------|:-------|:----:|-----------|
| Audit | `.audit` | ADMIN | Lihat log audit terbaru |
| Audit Group | `.audit group` | ADMIN | Filter log aktivitas grup |
| Audit User | `.audit user` | ADMIN | Filter log keamanan user |

### SYSTEM CONTROL & MAINTENANCE
| Command | Syntax | Izin | Deskripsi |
|:--------|:-------|:----:|-----------|
| Shutdown | `.shutdown` | SUPEROWNER | Emergency shutdown total |
| Temp Shutdown | `.shutdown <10m\|1h>` | SUPEROWNER | Shutdown sementara dengan timer auto-resume |
| Maintenance | `.maintenance <on\|off>` | OWNER | Toggle mode maintenance bot |
| Restart | `.restart` | SUPEROWNER | Restart proses bot |
| Backup | `.backup` | OWNER | Backup data & konfigurasi bot |

</details>

<details>
<summary><strong>[*] GENERAL & USER COMMANDS</strong></summary>

### MAIN COMMANDS
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Menu | `.menu` | Tampilkan menu utama bot (Public) |
| Ping | `.ping` / `.p` | Cek status & latency bot (Public) |
| Register | `.register [nama]` | Daftar akun baru di ALBEDO (Public) |
| Profile | `.profile [@user]` | Kartu identitas Student Card (Public) |
| Edit Profile | `.editprofile` | Edit profil sendiri (bio, gender, umur, dll) |
| Privacy | `.privacy [field] [public\|private]` | Atur privasi profil, stats, & riwayat |
| Limit | `.limit` | Cek sisa kuota limit di grup/DM saat ini |
| Store | `.store` / `.buy 10` | Beli tambahan limit menggunakan EXP |
| AFK | `.afk <alasan>` | Pasang status AFK dengan deteksi mention |
| AI | `.ai <pertanyaan>` | Tanya jawab pintar dengan DeepSeek AI |
| Chat | `.chat <pesan>` | Obrolan interaktif berkesinambungan dengan AI |
| Reset Chat | `.chat reset` | Hapus riwayat memori obrolan AI |

</details>

<details>
<summary><strong>[*] DOWNLOADER COMMANDS</strong></summary>

| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Download | `.download <link>` | Unduh media universal dari 30+ platform |
| Play Music | `.play <judul/link>` | Putar musik dengan thumbnail otomatis & anti-blokir |
| TikTok | `.tiktok <link>` | Unduh video TikTok tanpa watermark |
| YouTube | `.youtube <link>` | Unduh video YouTube dengan resolusi pilihan |
| Instagram | `.instagram <link>` | Unduh Reels / Post Instagram |
| Pick Media | `.dlpick <id> <no>` | Pilih opsi media dari daftar sections |

</details>

---

## >> ARSITEKTUR AKSES & PIPELINE

Setiap command yang masuk melewati **Unified Pipeline Middleware**:

```text
Incoming Message
       ↓
Message Parser
       ↓
User & Scope Resolver (resolve userId, groupId/scopeId, global user, scoped user)
       ↓
Granular Ban Check (bot ban, group ban, command ban)
       ↓
Anti-Spam Rate Limit (5 command / 10 detik)
       ↓
Maintenance Mode Check (Owner bypass)
       ↓
Command & Feature Lock Check (global & per-grup)
       ↓
Role & Permission Gatekeeper (RBAC)
       ↓
Cooldown Check (per-command, Owner/VIP bypass)
       ↓
Scoped Limit Check (user + group multi-tenant)
       ↓
Command Execution (with rich ctx)
```

---

## >> DEVELOPMENT

### SELF-CHECK TESTING
Jalankan verifikasi integritas sistem (40 test suites mencakup role, scoped limit, cooldown, downloader, dan AI):
```bash
npm test
```

### LOGGING
Sistem menggunakan logger cyberpunk:
- `LOG_LEVEL=info` (Standar untuk production)
- `LOG_LEVEL=debug` (Untuk development dan tracing)

---

## LISENSI

MIT License - bebas digunakan untuk keperluan komersial & non-komersial.

<div align="center">

**Made with LOVE by [Varo](https://github.com/varooats)**

</div>
