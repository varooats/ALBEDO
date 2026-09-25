/**
 * Messages for Welcome and Goodbye in WhatsApp Groups
 * Style: Clean, concise, calm, and visually pleasing.
 */

const welcomeMessages = {
  welcomeCaption: ({ name = 'Member', groupName = 'Grup', memberCount = null }) => [
    '╭─『 🌸 WELCOME 』',
    `│ ⟢ Member : *${name}*`,
    `│ ⟢ Grup   : *${groupName}*`,
    ...(memberCount ? [`│ ⟢ Total  : \`\`\`${memberCount} Anggota\`\`\``] : []),
    '╰──────────────────',
    '',
    '_Selamat datang! Semoga betah dan nyaman di sini._',
    '',
    '> 「Pintu selalu terbuka bagi niat baik.」',
    '',
    '— *ALBEDO*',
  ].join('\n'),

  goodbyeCaption: ({ name = 'Member', groupName = 'Grup', memberCount = null }) => [
    '╭─『 🍂 GOODBYE 』',
    `│ ⟢ Member : *${name}*`,
    `│ ⟢ Grup   : *${groupName}*`,
    ...(memberCount ? [`│ ⟢ Sisa   : \`\`\`${memberCount} Anggota\`\`\``] : []),
    '╰──────────────────',
    '',
    '_Terima kasih atas kebersamaan dan kenangan yang pernah terukir._',
    '',
    '> 「Semoga sukses di langkah barumu.」',
    '',
    '— *ALBEDO*',
  ].join('\n'),
};

module.exports = { welcomeMessages };
