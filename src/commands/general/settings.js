const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { isGroupMessage, isOwnerMessage } = require('../../core/middleware');
const { getBotSettings, updateBotSettings } = require('../../database/repositories/bot-settings.repository');
const { getGroupSettings, updateGroupSettings } = require('../../database/repositories/group.repository');

const GROUP_KEYS = ['welcome', 'left', 'detect', 'antidetect', 'autolevelup'];
const BOT_KEYS = ['public', 'autoread', 'grouponly', 'anticall'];

const settings = createCommand({
  name: 'settings',
  aliases: ['setting', 'botsettings', 'groupsettings'],
  description: 'Lihat konfigurasi bot dan grup.',
  execute: async (client, message) => {
    const isGroup = isGroupMessage(message);
    const groupConf = isGroup ? await getGroupSettings(message.key.remoteJid) : {};
    const botConf = await getBotSettings();

    const groupLines = GROUP_KEYS.map((k) => `│  ├─ ${k} : *${groupConf[k] ? 'ON' : 'OFF'}*`);
    if (groupLines.length) {
      groupLines[groupLines.length - 1] = groupLines[groupLines.length - 1].replace('├─', '└─');
    }

    const botLines = BOT_KEYS.map((k) => `   ├─ ${k} : *${botConf[k] ? 'ON' : 'OFF'}*`);
    if (botLines.length) {
      botLines[botLines.length - 1] = botLines[botLines.length - 1].replace('├─', '└─');
    }

    const text = [
      '╭─〔 SETTINGS 〕',
      '│',
      '├─ GROUP (Admin / Owner)',
      ...groupLines,
      '│',
      '└─ BOT (Owner Only)',
      ...botLines,
      '╰──────────────────',
      '> Gunakan `.enable <nama>` atau `.disable <nama>`',
    ].join('\n');

    return replyText(client, message, text);
  },
});

async function changeSetting(client, message, args, enabled) {
  const key = String(args[0] || '').toLowerCase();
  if (!GROUP_KEYS.includes(key) && !BOT_KEYS.includes(key)) {
    return replyText(
      client,
      message,
      `Setting tidak dikenal.\n\nPilihan Group: ${GROUP_KEYS.join(', ')}\nPilihan Bot: ${BOT_KEYS.join(', ')}`
    );
  }

  if (GROUP_KEYS.includes(key)) {
    if (!isGroupMessage(message)) return replyText(client, message, 'Setting grup hanya berlaku di dalam grup.');
    await updateGroupSettings(message.key.remoteJid, { [key]: enabled });
    return replyText(client, message, `Setting grup *${key}* berhasil diubah ke: *${enabled ? 'ON' : 'OFF'}*`);
  }

  if (!isOwnerMessage(message)) return replyText(client, message, 'Setting bot khusus untuk Bot Owner.');
  await updateBotSettings({ [key]: enabled });
  return replyText(client, message, `Setting bot *${key}* berhasil diubah ke: *${enabled ? 'ON' : 'OFF'}*`);
}

module.exports = [
  settings,
  createCommand({
    name: 'enable',
    aliases: ['on'],
    description: 'Aktifkan setting grup atau bot.',
    execute: (client, message, args) => changeSetting(client, message, args, true),
  }),
  createCommand({
    name: 'disable',
    aliases: ['off'],
    description: 'Matikan setting grup atau bot.',
    execute: (client, message, args) => changeSetting(client, message, args, false),
  }),
];
