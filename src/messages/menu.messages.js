const { formatMessage } = require('./format');

const menuMessages = {
  main: {
    title: 'Okaerinasai!',
    body: `Selamat Malam, Tuan *{{name}}*...

Ahh, napasku rasanya begitu berat hanya karena dipanggil olehmu. Aku milik Tuan sepenuhnya... Tolong perintahkan aku sepuasnya malam ini.

╭─『 ALBEDO PROFILE 』
│⟢ Name : Albedo System v1.0
│⟢ Role : Guardian Overseer
│⟢ Prefix : [ {{prefix}} ]
│⟢ Status : Active & Devoted
│⟢ Master : Lord {{ownerName}}
╰──────────────────

╭─『 MAIN COMMANDS 』
│
│ 👑 [ \`SUPREME MENU\` ]
│ ⟢ \`\`\`.menu\`\`\`
│ ⟢ \`\`\`.profile\`\`\`
│ ⟢ \`\`\`.afk\`\`\`
│ ⟢ \`\`\`.limit\`\`\`
│ ⟢ \`\`\`.store\`\`\`
│ ⟢ \`\`\`.settings\`\`\`
│ ⟢ \`\`\`.owner\`\`\`
│
│ 👥 [ \`GROUP MANAGEMENT\` ]
│ ⟢ \`\`\`.group\`\`\`
│ ⟢ \`\`\`.antilink\`\`\`
│ ⟢ \`\`\`.antitoxic\`\`\`
│ ⟢ \`\`\`.hidetag\`\`\`
│ ⟢ \`\`\`.kick\`\`\`
│ ⟢ \`\`\`.promote\`\`\`
│ ⟢ \`\`\`.demote\`\`\`
│ ⟢ \`\`\`.groupinfo\`\`\`
│ ⟢ \`\`\`.messagecount\`\`\`
│ ⟢ \`\`\`.pinchat\`\`\`
│
│ ⚔️ [ \`GUARDIAN TOOLS\` ]
│ ⟢ \`\`\`.download\`\`\`
│ ⟢ \`\`\`.play\`\`\`
│ ⟢ \`\`\`.games\`\`\`
│ ⟢ \`\`\`.fun\`\`\`
│ ⟢ \`\`\`.tarot\`\`\`
│ ⟢ \`\`\`.sticker\`\`\`
│ ⟢ \`\`\`.iqc\`\`\`
│
╰──────────────────

> 「すべては、我が主様のために。」`,
    footer: 'ALBEDO',
    channelButton: 'CREATOR',
    selectCategory: 'LIST MENU',
    fallback: 'ALBEDO\n\nMenu interaktif gagal ditampilkan.\nSilakan coba lagi.',
  },
  category: {
    title: 'SELECT COMMAND',
    body: '{{categoryTitle}}\n\nPilih command yang ingin kamu gunakan.',
    channelButton: 'CREATOR',
  },
  selection: {
    unknownCategory: '[MENU] Category tidak ditemukan: {{categoryKey}}',
  },
  converter: {
    body: `Silahkan Tuan perintahkan aku menggunakan menu di bawah ini.

╭─『 PERINTAH 』
│ ⟢ \`\`\` .brat \`\`\`
│ ⟢ \`\`\` .bratvid \`\`\`
│ ⟢ \`\`\` .bratanime \`\`\`
│ ⟢ \`\`\` .sticker \`\`\`
│ ⟢ \`\`\` .s \`\`\`
│ ⟢ \`\`\` .swm \`\`\`
╰──────────────────`,
    viewMenuButton: 'MENU',
  },
  get profile() {
    return require('./profile.messages').profileMessages;
  },
  get editprofile() {
    return require('./profile.messages').profileMessages.editprofile;
  },
  get register() {
    return require('./profile.messages').profileMessages.register;
  },
  format: formatMessage,
};

module.exports = {
  menuMessages,
  formatMessage,
};
