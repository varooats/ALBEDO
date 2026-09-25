const SUPPORTED_PLATFORMS = [
  'YouTube', 'TikTok', 'Instagram', 'Spotify',
  'Facebook', 'Twitter/X', 'Pinterest', 'Threads',
  'SoundCloud', 'Twitch', 'Reddit', 'Snapchat',
  'Apple Music', 'Douyin', 'Weibo', 'Xiaohongshu',
  'LinkedIn', 'Telegram', 'Imgur',
];

const downloaderMessages = {
  SUPPORTED_PLATFORMS,

  usage: [
    '╭─『 📥 DOWNLOADER CENTER 』',
    '│',
    '│ Unduh video (maks 35MB) & audio (maks 10MB)',
    '│ dengan kualitas terbaik dari berbagai platform.',
    '│',
    '│ 🌐 [ PLATFORM DIDUKUNG ]',
    '│ ⟢ YouTube, TikTok, Instagram, Spotify',
    '│ ⟢ Facebook, Twitter/X, Pinterest, Threads',
    '│ ⟢ SoundCloud, Twitch, Reddit, Snapchat',
    '│ ⟢ Apple Music, Douyin, Weibo, Xiaohongshu',
    '│',
    '│ ⚡ [ CONTOH PERINTAH ]',
    '│ ⟢ ```.download <link>```',
    '│ ⟢ ```.play <judul/link>```',
    '│ ⟢ ```.tiktok <link>```',
    '│ ⟢ ```.youtube <link>```',
    '│ ⟢ ```.instagram <link>```',
    '│',
    '╰──────────────────',
    '> Contoh: ```.play Alan Walker Faded```',
  ].join('\n'),

  playUsage: [
    '╭─『 🎵 AUDIO & MUSIC PLAYER 』',
    '│',
    '│ Putar dan unduh lagu audio favorit Anda (maks 10MB).',
    '│',
    '│ ⚡ [ FORMAT PENGGUNAAN ]',
    '│ ⟢ ```.play <judul lagu>```',
    '│ ⟢ ```.play <link youtube / spotify>```',
    '│',
    '╰──────────────────',
    '> Contoh: ```.play Blue Bird Naruto```',
  ].join('\n'),

  searching: (query = '') => `🔍 Mencari *${query}* di YouTube...`,

  searchNotFound: (query = '') => `Lagu tidak ditemukan untuk pencarian: *${query}*`,

  processing: 'Memproses media, mohon tunggu sebentar...',

  mediaCaption: ({ title = 'Media', source = 'Unknown', duration = '—', quality = 'Best' }) => [
    '╭─『 📥 DOWNLOADER 』',
    '│',
    `│ ⟢ Judul    : *${title}*`,
    `│ ⟢ Sumber   : *${source}*`,
    `│ ⟢ Durasi   : \`\`\`${duration}\`\`\``,
    `│ ⟢ Kualitas : \`\`\`${quality}\`\`\``,
    '│',
    '╰──────────────────',
    '> Mengirim file...',
  ].join('\n'),

  sizeExceeded: ({ title = 'Media', type = 'Video', sizeMb = 0, maxMb = 35, downloadUrl = '' }) => [
    '╭─『 ⚠️ MELEBIHI BATAS UKURAN 』',
    '│',
    `│ ⟢ Judul  : *${title}*`,
    `│ ⟢ Tipe   : *${type}* (Maks ${maxMb}MB)`,
    `│ ⟢ Ukuran : \`\`\`${sizeMb}MB\`\`\``,
    '│',
    '╰──────────────────',
    `> File terlalu besar untuk dikirim via WhatsApp.`,
    `> Unduh langsung via browser:\n${downloadUrl}`,
  ].join('\n'),

  notFound: 'Tautan tidak didukung, privat, atau media tidak ditemukan.',

  fetchFailed: () =>
    'Gagal memproses unduhan media. Pastikan tautan valid dan berstatus publik.',
};

module.exports = { downloaderMessages, SUPPORTED_PLATFORMS };
