function renderProgressBar(current, max = 20, barLength = 10) {
  const safeMax = Math.max(1, max);
  const ratio = Math.max(0, Math.min(1, current / safeMax));
  const filled = Math.round(ratio * barLength);
  const empty = barLength - filled;
  const percent = Math.round(ratio * 100);
  const bar = '▰'.repeat(filled) + '▱'.repeat(empty);
  return `${bar} ${percent}%`;
}

const storeMessages = {
  renderProgressBar,

  limitStatus: ({
    name = 'User',
    limit = 20,
    maxLimit = 20,
    exp = 0,
    bar = '▰▰▰▰▰▰▰▰▰▰ 100%',
    status = 'Free User',
    p10 = 500,
  }) => [
    '╭─『 ⚡ STATUS LIMIT 』',
    '│',
    `│ ⟢ user   : *${name}*`,
    `│ ⟢ EXP    : \`\`\`${exp} XP\`\`\``,
    `│ ⟢ status : *${status}*`,
    '│ ⟢ reset  : *setiap hari (00:00)*',
    '│',
    '╰──────────────────',
    `${bar} [\`\`\`${limit}/${maxLimit}\`\`\`]`,
    '',
    `> Beli +10 Limit seharga ${p10} XP via tombol di bawah.`,
  ].join('\n'),

  storeMenu: ({ limit = 20, exp = 0, p10 = 500, p20 = 1000, p50 = 2500 }) => [
    '╭─『 🛒 ALBEDO STORE 』',
    '│',
    `│ ⟢ Limit Kamu : *${limit}*`,
    `│ ⟢ EXP Kamu   : \`\`\`${exp} XP\`\`\``,
    '│',
    '│ 📦 [ `PAKET LIMIT` ]',
    `│ ⟢ +10 Limit : \`\`\`${p10} XP\`\`\``,
    `│ ⟢ +20 Limit : \`\`\`${p20} XP\`\`\``,
    `│ ⟢ +50 Limit : \`\`\`${p50} XP\`\`\``,
    '│',
    '╰──────────────────',
    '> Beli paket limit menggunakan tombol interaktif di bawah.',
  ].join('\n'),

  limitExhausted: ({ remaining = 0, required = 1, p10 = 500 }) => [
    '╭─『 ⚠️ LIMIT HABIS 』',
    '│',
    `│ ⟢ Sisa Limit : *${remaining}* (Butuh ${required})`,
    '│ ⟢ Reset      : Setiap hari (20 Limit)',
    `│ ⟢ Beli Limit : \`\`\`${p10} XP\`\`\` (+10 Limit)`,
    '│',
    '╰──────────────────',
    '> Tekan tombol di bawah untuk membeli limit atau tunggu reset harian.',
  ].join('\n'),

  buySuccess: ({ amount = 10, price = 500, newLimit = 20, remainingExp = 0 }) => [
    '╭─『 ✅ PEMBELIAN SUKSES 』',
    '│',
    `│ ⟢ Tambahan   : *+${amount} Limit*`,
    `│ ⟢ Biaya      : \`\`\`${price} XP\`\`\``,
    `│ ⟢ Limit Baru : *${newLimit}*`,
    `│ ⟢ Sisa EXP   : \`\`\`${remainingExp} XP\`\`\``,
    '│',
    '╰──────────────────',
    '> 「Terima kasih atas dedikasi dan transaksi Anda, Tuan.」',
  ].join('\n'),

  insufficientExp: ({ price = 500, currentExp = 0, missingExp = 500 }) => [
    '╭─『 ❌ EXP TIDAK CUKUP 』',
    '│',
    `│ ⟢ Harga Paket : \`\`\`${price} XP\`\`\``,
    `│ ⟢ EXP Kamu    : \`\`\`${currentExp} XP\`\`\``,
    `│ ⟢ Kekurangan  : *${missingExp} XP*`,
    '│',
    '╰──────────────────',
    '> Mainkan game untuk mengumpulkan EXP terlebih dahulu.',
  ].join('\n'),
};

module.exports = { storeMessages };
