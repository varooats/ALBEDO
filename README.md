<div align="center">

# ALBEDO-BOT

**Advanced WhatsApp Bot dengan Fitur Modular & Interactive**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-varooats%2FBOT--WA-black?style=flat-square&logo=github)](https://github.com/varooats/BOT-WA)
[![Version](https://img.shields.io/badge/Version-1.1.5-orange?style=flat-square)](https://github.com/varooats/BOT-WA/releases)

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

### | SECURITY & ACCESS CONTROL
- Anti Abuse & Rate Limit: User (10/10s), Group (50/10s), Global (1000/60s)
- User Blacklist & Ban System (`.banuser`, `.unbanuser`, `.checkban`, `.listban`)
- Bot Owner Hierarchy (`SUPEROWNER` > `OWNER` > `ADMIN` > `GROUP_ADMIN` > `USER`)
- Anti Self-Target / Dangerous Actions block (proteksi bot dan pemilik dari kick/demote)
- Structured Audit Log (`[OWNER]`, `[GROUP]`, `[ADMIN]`, `[SECURITY]`, `[SETTINGS]`)
- Emergency Shutdown (`.shutdown`, `.shutdown 10m`) & Maintenance Mode (`.maintenance on|off`)
- Feature Kill Switch global & per-grup (`.enable <fitur>`, `.disable <fitur>`)
- Invite/Leave Protection dengan approval countdown 5 menit
- User Privacy Mode (`.privacy profile|stats|history`)

### | ENTERTAINMENT & GAMES
- 20+ mini games (tebakan, quiz, duel)
- Tarot card reading interaktif
- Fun commands (cek personality)
- Konverter text & media (sticker, video, dll)

### | GROUP MANAGEMENT  
- Proteksi link & kata kasar
- Manajemen member (kick, promote, demote) dengan verifikasi izin
- Statistik group & pesan
- Pin chat & hidetag
- Approval whitelist grup bot

### | BOT CONTROL
- Limit system per user
- Owner & Bot Admin hierarchy management
- Settings group & bot
- AFK status dengan notifikasi mention

### | MEDIA DOWNLOADER
- YouTube, TikTok, Instagram, Spotify
- Konversi media & sticker maker (Brat text & WebP EXIF)
- Download/streaming musik dengan pencarian YouTube

### | AI & ASSISTANT
- AI Reasoning & Tanya Jawab interaktif
- Chatbot percakapan alami
- Sistem tiket bantuan, laporan bug, & feedback pengguna

### | USER & INTERACTIVE UI
- WhatsApp Native Flow button & carousel interactive menu
- Menu Audio Voice Note (efek suara acak saat membuka menu)
- Cyberpunk soft terminal logger dengan timestamp dan pelacakan event
- Profile management & editing (Student Identity Card generator)
- User statistics & score tracking
- Store & item system pembelian kuota limit dengan EXP
- Daily rewards & level auto-scaling
- Privacy settings (profile, stats, history)

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
│   │   ├── general/       Menu, profile, settings, privacy, afk
│   │   ├── group/         Group management & moderation
│   │   ├── owner/         Hierarchy, blacklist, audit, system control
│   │   ├── games/         25+ Game commands & leaderboard
│   │   ├── fun/           Fun & personality tests
│   │   ├── downloader/    Media downloader (YT, TT, IG, Spotify)
│   │   ├── converter/     Brat, sticker maker, toimg, iqc
│   │   ├── ai/            AI reasoning & chat
│   │   ├── support/       Bug report, feedback, request, FAQ
│   │   └── tarot/         Tarot card readings
│   ├── core/              [*] Core system
│   │   ├── command.factory.js
│   │   ├── command.loader.js
│   │   ├── middleware.js
│   │   ├── rate-limit.js
│   │   └── reply.js
│   ├── handlers/          [>>] Message & command handlers
│   ├── features/          [#] Features & UI logic
│   │   ├── menu/
│   │   ├── profile/
│   │   ├── group/
│   │   ├── welcome/
│   │   ├── games/
│   │   ├── converter/
│   │   └── tarot/
│   ├── database/          [DB] Firebase & repositories
│   ├── config/            [=] Dynamic configuration
│   ├── messages/          [<] Message templates
│   ├── services/          [~] Services & business logic
│   │   ├── afk/           AFK status tracking
│   │   ├── audit/         Structured audit log engine
│   │   ├── downloader/    Tioo API & YTDL streams
│   │   ├── feature/       Global & per-group kill switch
│   │   ├── group/         Approval, stats, settings
│   │   ├── limit/         Daily limit & store engine
│   │   ├── media/         Brat generator & WebP EXIF
│   │   ├── owner/         Owner hierarchy (Superowner/Owner/Admin)
│   │   ├── security/      Blacklist & ban management
│   │   ├── system/        Shutdown & maintenance control
│   │   ├── tarot/         Tarot deck services
│   │   └── user/          Privacy preferences service
│   ├── utils/             [!] Utilities & cyberpunk logger
│   └── data/              [@] JSON data banks
├── assets/                [*] Static assets: audio, banner, tarot (Git tracked)
│   ├── audio/             Voice note audio (.mp3, .ogg)
│   ├── banner/            Video banner menu (.mp4)
│   └── tarot/             Gambar kartu tarot
├── storage/               [!] Dynamic runtime storage (Git ignored)
│   ├── auth/              WhatsApp multi-device session
│   └── temp/              Temporary files
├── test/                  [?] Self-check tests (33 suites)
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
| Hidetag | `.hidetag <pesan>` atau `.ta` | Kirim pesan ke semua member |
| Group Link | `.grouplink` | Dapatkan link invite grup |
| Kick | `.kick @user` | Keluarkan member dari grup |
| Promote | `.promote @user` | Jadikan member sebagai admin |
| Demote | `.demote @user` | Turunkan admin menjadi member |
| Open Group | `.opengroup` | Buka chat grup untuk semua |
| Close Group | `.closegroup` | Tutup grup khusus pesan admin |
| Group Info | `.groupinfo` | Info lengkap detail grup & whitelist |
| Member Count | `.membercount` | Total seluruh member grup |
| Message Count | `.messagecount <day\|month\|all>` | Statistik volume pesan grup |
| Group Menu | `.group` | Buka panel interaktif grup |
| Approve Group | `.approvegroup [id@g.us]` | Setujui grup bot (Owner) |
| Leave Group | `.leavegroup [id@g.us]` | Keluarkan bot dari grup (Owner) |

### CHAT PIN
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Pin Chat | `.pinchat <24h\|7d\|30d>` | Sematkan pesan di grup |
| Unpin | `.unpinchat` | Lepas sematan pin pesan |

</details>

<details>
<summary><strong>[*] OWNER & ADMIN COMMANDS</strong></summary>

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
| Audit | `.audit` | ADMIN | Lihat 15 log audit terbaru |
| Audit Group | `.audit group` | ADMIN | Filter log aktivitas grup |
| Audit User | `.audit user` | ADMIN | Filter log moderasi / keamanan user |

### SYSTEM CONTROL & MAINTENANCE
| Command | Syntax | Izin | Deskripsi |
|:--------|:-------|:----:|-----------|
| Shutdown | `.shutdown` | SUPEROWNER | Emergency shutdown total |
| Temp Shutdown | `.shutdown <10m\|1h>` | SUPEROWNER | Shutdown sementara dengan timer auto-resume |
| Maintenance | `.maintenance <on\|off>` | OWNER | Toggle mode maintenance bot |
| Restart | `.restart` | SUPEROWNER | Restart proses bot |
| Backup | `.backup` | OWNER | Backup data & konfigurasi bot |
| Eval | `.eval <code...>` | SUPEROWNER | Eksekusi kode runtime bot |
| Exec | `.exec <command...>` | SUPEROWNER | Eksekusi shell command bot |
| Broadcast | `.broadcast <pesan>` | OWNER | Broadcast pesan ke semua chat |
| Status | `.status` | ALL | Status server, memori, & uptime |
| Runtime | `.runtime` | ALL | Uptime bot |
| Owner Info | `.owner` / `.ownerinfo` | ALL | Kontak profil pemilik bot |
| Rules | `.rules` | ALL | Aturan penggunaan bot |
| Donate | `.donate` | ALL | Informasi donasi bot |

### LIMIT MANAGEMENT
| Command | Syntax | Izin | Deskripsi |
|:--------|:-------|:----:|-----------|
| Set Limit | `.setlimit <jumlah> <@user\|all>` | OWNER | Set limit user |
| Add Limit | `.addlimit <jumlah> <@user\|all>` | OWNER | Tambah limit user |

</details>

<details>
<summary><strong>[*] SETTINGS & GENERAL</strong></summary>

### MAIN COMMANDS
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Menu | `.menu` | Tampilkan menu utama |
| Register | `.register [nama]` atau `.daftar` | Daftar akun baru di ALBEDO |
| Profile | `.profile [@user]` | Lihat profil identity card |
| Edit Profile | `.editprofile` | Edit profil sendiri |
| Privacy | `.privacy [field] [public\|private]` | Atur privasi profil, stats, & riwayat |
| AFK | `.afk <alasan>` | Atur status AFK |
| Limit | `.limit` | Lihat sisa kuota limit command |
| Store | `.store` | Buka toko pembelian limit |
| Ping | `.ping` atau `.p` | Tes respons bot & status sistem |
| Dev Info | `.dev` | Informasi developer pembuat bot |
| Source Code | `.github` / `.sc` | Link repositori GitHub resmi |
| Portfolio | `.portfolio` | Website portofolio developer |

### SETTINGS & FEATURE CONTROL
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Settings | `.settings` | Lihat pengaturan grup & bot |
| Enable | `.enable <fitur>` | Aktifkan fitur / setting di grup |
| Disable | `.disable <fitur>` | Matikan fitur / setting di grup |
| Global Toggle | `.disable <fitur> global` | Kill switch fitur global (Owner) |

**Pilihan Fitur (Kill Switch & Per-Group Control):**
- `downloader` — YouTube, TikTok, IG, Spotify downloader
- `games` — Kuis, tebak kata/gambar, duel, roulette, slot
- `fun` — Cek femboy, beban, jodoh, harga diri
- `tarot` — Pembacaan kartu tarot
- `ai` — Fitur chat AI
- `converter` — Pembuat stiker & brat generator

**Group Settings:**
- `welcome` — Pesan sambutan member baru
- `left` — Pesan ucapan selamat tinggal
- `detect` — Deteksi konten
- `antidetect` — Block anti-deteksi
- `autolevelup` — Naikkan level otomatis

**Bot Settings (Owner Only):**
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
| Susun Kata | `.susunkata` | Susun kata berantakan |
| Tebak Gambar | `.tebakgambar` | Tebak gambar petunjuk |
| Tebak Angka | `.tebakangka` | Tebak angka tersembunyi 1-100 |
| Tebak Bendera | `.tebakbendera` | Tebak bendera negara dunia |
| Tebak Lagu | `.tebaklagu` | Tebak judul lagu dari lirik |
| Tebak Film | `.tebakfilm` | Tebak judul film dari clue |
| Tebak Game | `.tebakgame` | Tebak judul game populer |
| Tebak Genshin | `.tebakgenshin` | Tebak karakter Genshin Impact |
| Tebak Hewan | `.tebakhewan` | Tebak nama fauna & satwa |
| Tebak Karakter | `.tebakkarakter` | Tebak tokoh fiksi & anime |
| Tebak Logo | `.tebaklogo` | Tebak logo merk & brand |
| Caklontong | `.caklontong` | Tebakan teka-teki logika humor |
| Siapa Kah Aku | `.siapakahaku` | Tebakan benda & profesi |
| Asa Hotak | `.asahotak` | Tes asah otak & logika |
| Kata Bersambung | `.katabersambung` | Permainan rantai kata member |
| Wordle | `.wordle` | Tebak kata 5 huruf (6 kesempatan) |

### PVP & LEADERBOARD
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Duel | `.duel @user` | Tantang duel 1v1 turn-based |
| Suit | `.suit @user` | Main gunting, batu, kertas |
| Tictactoe | `.tictactoe @user` | Papan catur mini X & O |
| Coinflip | `.coinflip <head\|tail>` | Lempar koin keberuntungan |
| Roulette | `.roulette` | Taruhan angka keberuntungan |
| Slot | `.slot` | Putar mesin slot kasino |
| Daily | `.daily` atau `.claim` | Klaim bonus harian XP & limit |
| Score | `.score` / `.rank` / `.level` | Cek XP, level, & ranking user |
| Leaderboard | `.leaderboard` atau `.lb` | Papan peringkat 50 besar pemain |

### FUN COMMANDS
| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Cek Femboy | `.cekfemboy [@user]` | Persentase kadar femboy |
| Cek Beban | `.cekbeban [@user]` | Persentase kadar beban grup |
| Cek Tampan | `.cektampan [@user]` | Persentase ketampanan |
| Cek Cantik | `.cekcantik [@user]` | Persentase kecantikan |
| Cek Harga Diri | `.cekhargadiri` | Estimasi nilai harga diri |
| Cek Jodoh | `.cekjodoh [@user]` | Ramal kecocokan pasangan |
| Cek Cocok | `.cekcocok @user` | Nilai kompatibilitas dua user |
| Fun | `.fun` | Fakta menarik & kata mutiara acak |

</details>

<details>
<summary><strong>[*] TAROT, CONVERTER & STICKER</strong></summary>

| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Tarot | `.tarot` | Pembacaan kartu tarot visual & tafsir |
| Brat | `.brat <teks>` | Generator stiker tren teks brat |
| Brat Video | `.bratvid <teks>` | Stiker animasi video brat |
| Brat Anime | `.bratanime <teks>` | Stiker brat bergaya anime |
| Sticker | `.sticker` atau `.s` (reply media) | Konversi gambar/video jadi stiker WA |
| Swm | `.swm <pack\|author>` | Ganti metadata watermark stiker |
| To Image | `.toimg` (reply sticker) | Ekstrak stiker WebP kembali jadi gambar |
| IQC | `.iqc` (reply foto) | Analisis & verifikasi kualitas gambar |

</details>

<details>
<summary><strong>[*] DOWNLOADER</strong></summary>

| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Download | `.download <url>` | Deteksi otomatis & unduh media |
| Play | `.play <judul lagu>` | Cari di YouTube & kirim audio musik |
| TikTok | `.tiktok <url>` | Unduh video TikTok tanpa watermark |
| YouTube | `.youtube <url>` | Unduh video/audio YouTube |
| Instagram | `.instagram <url>` | Unduh reels, post, & video Instagram |
| Spotify | `.spotify <url>` | Unduh lagu dari link Spotify |

</details>

<details>
<summary><strong>[*] AI & CHATBOT</strong></summary>

| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| AI Reasoning | `.ai <pertanyaan>` | Analisis & jawaban cerdas AI |
| AI Chat | `.chat <pesan>` | Obrolan percakapan interaktif AI |

</details>

<details>
<summary><strong>[*] SUPPORT & FEEDBACK</strong></summary>

| Command | Syntax | Deskripsi |
|:--------|:-------|-----------|
| Report | `.report <masalah>` | Laporkan member atau pelanggaran |
| Bug Report | `.bug <kendala>` | Laporkan bug sistem bot ke tim |
| Feedback | `.feedback <saran>` | Kirim kritik & saran pengembangan |
| Feature Request | `.request <fitur>` | Ajukan ide fitur baru untuk ALBEDO |
| FAQ | `.faq` | Jawaban pertanyaan yang sering diajukan |
| Support | `.support` | Pusat bantuan & saluran resmi bot |

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
