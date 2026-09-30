const SUPPORTED_PLATFORMS = [
  'Instagram', 'TikTok', 'YouTube', 'Spotify', 'Facebook',
  'Threads', 'Bluesky', 'SoundCloud', 'Douyin',
  'Twitter/X', 'Dailymotion', 'Xiaohongshu', 'Weibo',
  'Kuaishou', 'Reddit', 'Vimeo', 'VK',
  'Twitch', 'Pinterest', 'Rumble', 'Bilibili',
  'Snapchat', 'Streamable', 'Bandcamp', 'CHZZK',
  'Naver TV', 'SOOP', 'Mixcloud', 'TED',
  'Loom', 'Lemon8',
];

const downloaderMessages = {
  SUPPORTED_PLATFORMS,

  usage: [
    '╭─『 📥 DOWNLOADER CENTER 』',
    '│',
    '│ Unduh video (maks 35MB), audio (maks 10MB)',
    '│ & foto kualitas terbaik dari 30+ platform.',
    '│',
    '│ 🌐 [ PLATFORM UTAMA ]',
    '│ ⟢ Instagram, TikTok, YouTube, Facebook',
    '│ ⟢ Threads, Bluesky, SoundCloud, Douyin',
    '│ ⟢ Twitter/X, Dailymotion, Xiaohongshu, Weibo',
    '│ ⟢ Kuaishou, Reddit, Vimeo, VK, Twitch',
    '│ ⟢ Pinterest, Rumble, Bilibili, Snapchat',
    '│ ⟢ Streamable, Bandcamp, CHZZK, Naver TV',
    '│ ⟢ SOOP, Mixcloud, TED, Loom, Lemon8',
    '│',
    '│ ⚡ [ CONTOH PERINTAH ]',
    '│ ⟢ ```.download <link>``` (Universal)',
    '│ ⟢ ```.tiktok <link>```',
    '│ ⟢ ```.instagram <link>```',
    '│ ⟢ ```.youtube <link>```',
    '│ ⟢ ```.facebook <link>```',
    '│ ⟢ ```.twitter <link>```',
    '│ ⟢ ```.threads <link>```',
    '│ ⟢ ```.pinterest <link>```',
    '│ ⟢ ```.play <judul lagu / link>```',
    '│',
    '╰──────────────────',
    '> Contoh: ```.download https://www.instagram.com/reel/...```',
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

  playCaption: ({ title = 'Audio', author = '', duration = '—', source = 'YouTube', quality = 'MP3' }) => [
    '╭─『 🎵 ALBEDO MUSIC PLAY 』',
    '│',
    `│ ⟢ Judul    : *${title}*`,
    author ? `│ ⟢ Artis    : *${author}*` : null,
    `│ ⟢ Durasi   : \`\`\`${duration}\`\`\``,
    `│ ⟢ Sumber   : *${source}*`,
    `│ ⟢ Format   : \`\`\`${quality}\`\`\``,
    '│',
    '╰──────────────────',
    '> Mengunduh dan mengirim audio...',
  ].filter(Boolean).join('\n'),

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
