const config = require('../../config/bot.config');

const pfx = config.prefix || '.';

const MENU_CATEGORIES = {
  menu_utama: {
    title: 'MENU UTAMA',
    rows: [
      { title: 'PROFILE', rowId: 'menu_utama:profile', description: `menampilkan detail profile` },
      { title: 'STORE', rowId: 'menu_utama:store', description: `daftar produk dan layanan` },
      { title: 'OWNER', rowId: 'menu_utama:owner', description: `menu khusus owner` },
      { title: 'SUPPORT', rowId: 'menu_utama:support', description: `meminta bantuan atau keluhan` },
      { title: 'CONTACT DEV', rowId: 'menu_utama:contactdev', description: `info kontak developer` },
    ],
  },

  fitur_bot: {
    title: 'FITUR BOT',
    rows: [
      { title: 'FUN', rowId: 'fitur:fun', description: `buat lelucon asik` },
      { title: 'GAMES', rowId: 'fitur:games', description: `permainan seru untuk mengatasi boring` },
      { title: 'TAROT', rowId: 'fitur:tarot', description: `ramal nasib` },
      { title: 'STICKER', rowId: 'fitur:sticker', description: `buat dan cari sticker` },
      { title: 'DOWNLOAD', rowId: 'fitur:download', description: `unduh video, music, dan lainnya` },
    ],
  },
};

const CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb8eLCNEAKWHTXxPez2U';

module.exports = {
  MENU_CATEGORIES,
  CHANNEL_URL,
};
