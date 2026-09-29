const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { isGroupMessage, isOwnerMessage, isGroupAdmin, isOwnerAsync } = require('../../core/middleware');
const { getBotSettings, updateBotSettings } = require('../../database/repositories/bot-settings.repository');
const { getGroupSettings, updateGroupSettings } = require('../../database/repositories/group.repository');
const {
  KNOWN_FEATURES,
  resolveFeature,
  setGlobalFeature,
  setGroupFeature,
  getGlobalDisabledList,
} = require('../../services/feature/feature-control.service');

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

    const globalDisabled = getGlobalDisabledList();
    const groupDisabled = Array.isArray(groupConf?.disabledFeatures) ? groupConf.disabledFeatures : [];

    const text = [
      '╭─〔 SETTINGS 〕',
      '│',
      '├─ GROUP (Admin / Owner)',
      ...groupLines,
      `│  ├─ Disabled Features: *${groupDisabled.length ? groupDisabled.join(', ') : 'None'}*`,
      '│',
      '└─ BOT (Owner Only)',
      ...botLines,
      `   ├─ Disabled Features: *${globalDisabled.length ? globalDisabled.join(', ') : 'None'}*`,
      '╰──────────────────',
      '> Gunakan `.enable <nama>` atau `.disable <nama>`',
      '> Fitur: ' + KNOWN_FEATURES.join(', '),
    ].join('\n');

    return replyText(client, message, text);
  },
});

async function changeSetting(client, message, args, enabled) {
  let key = String(args[0] || '').toLowerCase().trim();
  const isGlobalFlag = args.some((a) => String(a).toLowerCase() === 'global');
  if (key === 'global') {
    key = String(args[1] || '').toLowerCase().trim();
  }

  const isOwner = await isOwnerAsync(message);
  const isGroup = isGroupMessage(message);
  const resolvedFeat = resolveFeature(key);

  // 1. Feature Kill Switch (Global or Per-Group)
  if (resolvedFeat || KNOWN_FEATURES.includes(key)) {
    const feat = resolvedFeat || key;

    // Global kill switch (by Owner)
    if (isGlobalFlag || (!isGroup && isOwner)) {
      if (!isOwner) return replyText(client, message, 'Khusus Bot Owner untuk mengubah fitur global.');
      await setGlobalFeature(feat, enabled);
      return replyText(
        client,
        message,
        `⚠️ Fitur global *${feat.toUpperCase()}* berhasil *${enabled ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}*.`
      );
    }

    // Per-Group feature control
    if (isGroup) {
      const isGrpAdmin = isOwner || (await isGroupAdmin(client, message));
      if (!isGrpAdmin) return replyText(client, message, 'Khusus admin grup atau owner bot.');
      await setGroupFeature(message.key.remoteJid, feat, enabled);
      return replyText(
        client,
        message,
        `Fitur *${feat.toUpperCase()}* di grup ini berhasil *${enabled ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}*.`
      );
    }

    if (isOwner) {
      await setGlobalFeature(feat, enabled);
      return replyText(
        client,
        message,
        `⚠️ Fitur global *${feat.toUpperCase()}* berhasil *${enabled ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}*.`
      );
    }
  }

  // 2. Standard settings keys (welcome, left, etc.)
  if (!GROUP_KEYS.includes(key) && !BOT_KEYS.includes(key)) {
    return replyText(
      client,
      message,
      `Setting / fitur tidak dikenal.\n\nPilihan Fitur: ${KNOWN_FEATURES.join(', ')}\nPilihan Group: ${GROUP_KEYS.join(', ')}\nPilihan Bot: ${BOT_KEYS.join(', ')}`
    );
  }

  if (GROUP_KEYS.includes(key)) {
    if (!isGroup) return replyText(client, message, 'Setting grup hanya berlaku di dalam grup.');
    const isGrpAdmin = isOwner || (await isGroupAdmin(client, message));
    if (!isGrpAdmin) return replyText(client, message, 'Khusus admin grup atau owner bot.');
    await updateGroupSettings(message.key.remoteJid, { [key]: enabled });
    return replyText(client, message, `Setting grup *${key}* berhasil diubah ke: *${enabled ? 'ON' : 'OFF'}*`);
  }

  if (!isOwner) return replyText(client, message, 'Setting bot khusus untuk Bot Owner.');
  await updateBotSettings({ [key]: enabled });
  return replyText(client, message, `Setting bot *${key}* berhasil diubah ke: *${enabled ? 'ON' : 'OFF'}*`);
}

module.exports = [
  settings,
  createCommand({
    name: 'enable',
    aliases: ['on'],
    description: 'Aktifkan setting grup, bot, atau fitur.',
    execute: (client, message, args) => changeSetting(client, message, args, true),
  }),
  createCommand({
    name: 'disable',
    aliases: ['off'],
    description: 'Matikan setting grup, bot, atau fitur.',
    execute: (client, message, args) => changeSetting(client, message, args, false),
  }),
];
