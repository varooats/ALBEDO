const converterMessages = {
  brat: {
    usage: [
      '╭─『 PERINTAH 』',
      '│ ⟢ ```.brat <teks>```',
      '│ ⟢ ```.brat <teks> --green```',
      '│ ⟢ ```.brat <teks> --black```',
      '╰──────────────────',
      '',
      '> Contoh: ```.brat halo albedo```',
    ].join('\n'),
    error: 'Gagal membuat sticker brat. Silakan coba beberapa saat lagi.',
  },

  bratvid: {
    usage: [
      '╭─『 PERINTAH 』',
      '│ ⟢ ```.bratvid <teks>```',
      '│ ⟢ ```.bratvid <teks> --green```',
      '│ ⟢ ```.bratvid <teks> --black```',
      '╰──────────────────',
      '',
      '> Contoh: ```.bratvid albedo sangat setia```',
    ].join('\n'),
    processing: 'Sedang merender stiker animasi brat, mohon tunggu sebentar...',
    error: () => 'Gagal membuat stiker animasi brat. Silakan coba beberapa saat lagi.',
  },

  bratanime: {
    usage: [
      '╭─『 PERINTAH 』',
      '│ ⟢ ```.bratanime <teks>```',
      '╰──────────────────',
      '',
      '> Contoh: ```.bratanime semangat ya```',
    ].join('\n'),
    error: () => 'Gagal membuat stiker bratanime. Silakan coba beberapa saat lagi.',
  },

  sticker: {
    usage: [
      '╭─『 PERINTAH 』',
      '│ ⟢ Kirim gambar/video dengan caption: ```.sticker``` atau ```.s```',
      '│ ⟢ Balas media dengan caption: ```.sticker``` atau ```.s```',
      '╰──────────────────',
    ].join('\n'),
    error: 'Gagal mengonversi media menjadi sticker. Pastikan format didukung oleh WhatsApp.',
  },

  swm: {
    usage: [
      '╭─『 PERINTAH 』',
      '│ ⟢ Balas media: ```.swm <packname>|<author>```',
      '│ ⟢ Balas media: ```.swm <packname>```',
      '╰──────────────────',
      '',
      '> Contoh: ```.swm Albedo Pack|Lord Ainz```',
    ].join('\n'),
    error: 'Gagal membuat sticker watermark. Pastikan media valid.',
  },
};

module.exports = { converterMessages };
