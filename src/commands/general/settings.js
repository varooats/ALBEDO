const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { isGroupMessage, isOwnerMessage } = require('../../core/middleware');
const { getBotSettings, updateBotSettings } = require('../../database/repositories/bot-settings.repository');
const { getGroupSettings, updateGroupSettings } = require('../../database/repositories/group.repository');

const GROUP_KEYS = new Set(['welcome', 'left', 'detect', 'antidetect', 'autolevelup']);
const BOT_KEYS = new Set(['public', 'autoread', 'grouponly', 'anticall']);
const labels = { welcome: 'welcome', left: 'left', detect: 'detect', antidetect: 'antidetect', autolevelup: 'autolevelup', public: 'public', autoread: 'autoread', grouponly: 'grouponly', anticall: 'anticall' };

const settings = createCommand({
  name: 'settings', aliases: ['setting'], description: 'Lihat konfigurasi.',
  execute: async (client, message) => {
    const config = isGroupMessage(message)
      ? await getGroupSettings(message.key.remoteJid)
      : await getBotSettings();
    return replyText(client, message, Object.entries(labels).map(([key, label]) => `${label}: ${config[key] ?? false}`).join('\n'));
  },
});

async function changeSetting(client, message, args, enabled) {
  const key = String(args[0] || '').toLowerCase();
  if (!GROUP_KEYS.has(key) && !BOT_KEYS.has(key)) return replyText(client, message, 'Setting tidak dikenal. Gunakan .settings.');
  if (GROUP_KEYS.has(key)) {
    if (!isGroupMessage(message)) return replyText(client, message, 'Setting ini hanya berlaku di grup.');
    await updateGroupSettings(message.key.remoteJid, { [key]: enabled });
  } else {
    if (!isOwnerMessage(message)) return replyText(client, message, 'Khusus owner bot.');
    await updateBotSettings({ [key]: enabled });
  }
  return replyText(client, message, `${key}: ${enabled ? 'on' : 'off'}`);
}

module.exports = [settings,
  createCommand({ name: 'enable', description: 'Aktifkan setting.', execute: (client, message, args) => changeSetting(client, message, args, true) }),
  createCommand({ name: 'disable', description: 'Matikan setting.', execute: (client, message, args) => changeSetting(client, message, args, false) }),
];
