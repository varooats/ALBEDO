const config = require('../../config/bot.config');

const pfx = config.prefix || '.';

const MENU_CATEGORIES = {
  menu_utama: {
    title: 'MENU UTAMA',
    rows: [
      { title: 'PROFILE', rowId: 'menu_utama:profile', description: 'menampilkan detail identity card' },
      { title: 'PRIVACY', rowId: 'menu_utama:privacy', description: 'pengaturan privasi profil dan data akun' },
      { title: 'AFK', rowId: 'menu_utama:afk', description: 'atur status afk mode' },
      { title: 'SETTINGS', rowId: 'menu_utama:settings', description: 'pengaturan fitur grup dan bot' },
      { title: 'GROUP MENU', rowId: 'category:group_menu', description: 'menu administrasi dan proteksi grup' },
      { title: 'STORE', rowId: 'menu_utama:store', description: 'daftar produk dan pembelian kuota limit' },
      { title: 'OWNER MENU', rowId: 'category:owner_menu', description: 'menu kendali khusus bot owner' },
      { title: 'SUPPORT', rowId: 'menu_utama:support', description: 'bantuan, faq, dan laporan kendala' },
      { title: 'CONTACT DEV', rowId: 'menu_utama:contactdev', description: 'profil dan kontak developer' },
    ],
  },

  fitur_bot: {
    title: 'FITUR BOT',
    rows: [
      { title: 'FUN & JOKES', rowId: 'fitur:fun', description: 'cek femboy, beban, jodoh, harga diri' },
      { title: 'GAMES', rowId: 'fitur:games', description: 'kuis, tebak kata/gambar/angka, duel, tictactoe' },
      { title: 'TAROT', rowId: 'fitur:tarot', description: 'ramal nasib dan pembacaan kartu tarot' },
      { title: 'STICKER & MEDIA', rowId: 'fitur:sticker', description: 'konversi sticker, brat, bratanime, swm' },
      { title: 'DOWNLOADER', rowId: 'fitur:download', description: 'unduh tiktok, youtube, spotify, instagram' },
    ],
  },

  group_menu: {
    title: 'GROUP MENU',
    rows: [
      { title: 'ANTILINK', rowId: 'group:antilink', description: 'proteksi link (.antilink all/custom/off)' },
      { title: 'ANTITOXIC', rowId: 'group:antitoxic', description: 'filter kata terlarang (.antitoxic on/off)' },
      { title: 'HIDETAG', rowId: 'group:hidetag', description: 'tag seluruh anggota grup (.ta)' },
      { title: 'GROUPLINK', rowId: 'group:grouplink', description: 'ambil link invite grup' },
      { title: 'KICK MEMBER', rowId: 'group:kick', description: 'keluarkan anggota dari grup' },
      { title: 'PROMOTE ADMIN', rowId: 'group:promote', description: 'jadikan anggota sebagai admin' },
      { title: 'DEMOTE ADMIN', rowId: 'group:demote', description: 'turunkan admin menjadi member' },
      { title: 'OPEN / CLOSE', rowId: 'group:opengroup', description: 'buka atau tutup izin chat grup' },
      { title: 'GROUP INFO', rowId: 'group:groupinfo', description: 'informasi lengkap detail grup' },
      { title: 'MEMBER COUNT', rowId: 'group:membercount', description: 'total seluruh anggota grup' },
      { title: 'MESSAGE COUNT', rowId: 'group:messagecount', description: 'statistik total pesan grup' },
      { title: 'PIN CHAT', rowId: 'group:pinchat', description: 'pin chat 24h, 7d, atau 30d' },
      { title: 'UNPIN CHAT', rowId: 'group:unpinchat', description: 'lepaskan sematan pin chat' },
    ],
  },

  owner_menu: {
    title: 'OWNER MENU',
    rows: [
      { title: 'OWNER INFO', rowId: 'owner:ownerinfo', description: 'informasi profil pemilik bot' },
      { title: 'SET LIMIT', rowId: 'owner:setlimit', description: 'set kuota limit pengguna' },
      { title: 'ADD LIMIT', rowId: 'owner:addlimit', description: 'tambah kuota limit pengguna' },
      { title: 'LIST OWNER', rowId: 'owner:listowner', description: 'daftar owner bot terdaftar' },
      { title: 'ADD OWNER', rowId: 'owner:addowner', description: 'tambah nomor owner baru' },
      { title: 'DEL OWNER', rowId: 'owner:delowner', description: 'hapus nomor owner terdaftar' },
      { title: 'BAN USER', rowId: 'owner:listban', description: 'kelola blacklist pengguna bot' },
      { title: 'AUDIT LOG', rowId: 'owner:audit', description: 'riwayat audit log aktivitas sensitif' },
      { title: 'MAINTENANCE', rowId: 'owner:maintenance', description: 'atur mode maintenance bot' },
      { title: 'BACKUP', rowId: 'owner:backup', description: 'ekspor cadangan data bot' },
      { title: 'RESTART', rowId: 'owner:restart', description: 'restart proses bot' },
      { title: 'SHUTDOWN', rowId: 'owner:shutdown', description: 'emergency shutdown bot' },
      { title: 'STATUS', rowId: 'owner:status', description: 'status server, memori, dan uptime' },
    ],
  },
};

const CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb8eLCNEAKWHTXxPez2U';

module.exports = {
  MENU_CATEGORIES,
  CHANNEL_URL,
};
