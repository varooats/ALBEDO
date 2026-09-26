const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { resolveMentionJids } = require('../../utils/message.utils');
const { getGroupSettings, updateGroupSettings } = require('../../database/repositories/group.repository');
const GroupService = require('../../features/group/group.service');
const MessageStatsService = require('../../features/group/message-stats.service');

const groupAdmin = { access: 'group-admin' };

function groupJid(message) {
  return message?.key?.remoteJid;
}

function targetJids(message, args = []) {
  const mentioned = resolveMentionJids(message);
  if (mentioned.length) return mentioned;
  const number = String(args[0] || '').replace(/\D/g, '');
  return number ? [`${number}@s.whatsapp.net`] : [];
}

async function metadata(client, message) {
  return client.groupMetadata(groupJid(message));
}

async function setSetting(client, message, args, key, value) {
  const jid = groupJid(message);
  const next = String(args[0] || '').toLowerCase();
  if (!['on', 'off'].includes(next)) {
    await replyText(client, message, `Gunakan .${key} on atau .${key} off.`);
    return false;
  }
  await updateGroupSettings(jid, { [key]: value ? next === 'on' : next });
  await replyText(client, message, `${key}: ${next}`);
  return true;
}

const commands = [
  createCommand({ name: 'antilink', ...groupAdmin, description: 'Atur perlindungan link.', execute: async (client, message, args) => {
    const mode = String(args[0] || '').toLowerCase();
    if (!['all', 'custom', 'off'].includes(mode)) return replyText(client, message, 'Gunakan .antilink all|custom|off.');
    await updateGroupSettings(client ? groupJid(message) : '', { antilink: mode });
    return replyText(client, message, `Anti-link: ${mode}`);
  }}),
  createCommand({ name: 'addlink', ...groupAdmin, description: 'Tambah domain blacklist.', execute: async (client, message, args) => {
    const domain = String(args[0] || '').toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!domain || !domain.includes('.')) return replyText(client, message, 'Gunakan .addlink <domain>.');
    const settings = await getGroupSettings(groupJid(message));
    if (!settings.links.includes(domain)) settings.links.push(domain);
    await updateGroupSettings(groupJid(message), { links: settings.links });
    return replyText(client, message, `Domain ditambahkan: ${domain}`);
  }}),
  createCommand({ name: 'dellink', ...groupAdmin, description: 'Hapus domain blacklist.', execute: async (client, message, args) => {
    const domain = String(args[0] || '').toLowerCase();
    const settings = await getGroupSettings(groupJid(message));
    await updateGroupSettings(groupJid(message), { links: settings.links.filter((item) => item !== domain) });
    return replyText(client, message, `Domain dihapus: ${domain}`);
  }}),
  createCommand({ name: 'listlink', ...groupAdmin, description: 'Lihat domain blacklist.', execute: async (client, message) => {
    const settings = await getGroupSettings(groupJid(message));
    return replyText(client, message, settings.links.length ? settings.links.join('\n') : 'Blacklist domain kosong.');
  }}),
  createCommand({ name: 'antitoxic', ...groupAdmin, description: 'Atur filter kata.', execute: async (client, message, args) => setSetting(client, message, args, 'antitoxic', true) }),
  createCommand({ name: 'addbadword', ...groupAdmin, description: 'Tambah kata filter.', execute: async (client, message, args) => {
    const word = String(args.join(' ') || '').trim().toLowerCase();
    if (!word) return replyText(client, message, 'Gunakan .addbadword <word>.');
    const settings = await getGroupSettings(groupJid(message));
    if (!settings.badwords.includes(word)) settings.badwords.push(word);
    await updateGroupSettings(groupJid(message), { badwords: settings.badwords });
    return replyText(client, message, `Kata ditambahkan: ${word}`);
  }}),
  createCommand({ name: 'delbadword', ...groupAdmin, description: 'Hapus kata filter.', execute: async (client, message, args) => {
    const word = String(args.join(' ') || '').trim().toLowerCase();
    const settings = await getGroupSettings(groupJid(message));
    await updateGroupSettings(groupJid(message), { badwords: settings.badwords.filter((item) => item !== word) });
    return replyText(client, message, `Kata dihapus: ${word}`);
  }}),
  createCommand({ name: 'listbadword', ...groupAdmin, description: 'Lihat kata filter.', execute: async (client, message) => {
    const settings = await getGroupSettings(groupJid(message));
    return replyText(client, message, settings.badwords.length ? settings.badwords.join('\n') : 'Daftar badword kosong.');
  }}),
  createCommand({ name: 'hidetag', aliases: ['ta'], ...groupAdmin, description: 'Mention semua anggota.', execute: async (client, message, args) => {
    const data = await metadata(client, message);
    const mentions = (data.participants || []).map((item) => item.id).filter(Boolean);
    return client.sendMessage(groupJid(message), { text: args.join(' ') || ' ', mentions });
  }}),
  createCommand({ name: 'grouplink', ...groupAdmin, description: 'Ambil link grup.', execute: async (client, message) => replyText(client, message, await client.groupInviteCode(groupJid(message)).then((code) => `https://chat.whatsapp.com/${code}`)) }),
  createCommand({ name: 'kick', ...groupAdmin, description: 'Keluarkan anggota.', execute: async (client, message, args) => {
    const targets = targetJids(message, args); if (!targets.length) return replyText(client, message, 'Tag user.');
    await client.groupParticipantsUpdate(groupJid(message), targets, 'remove'); return replyText(client, message, 'Anggota dikeluarkan.');
  }}),
  createCommand({ name: 'promote', ...groupAdmin, description: 'Jadikan admin.', execute: async (client, message, args) => {
    const targets = targetJids(message, args); if (!targets.length) return replyText(client, message, 'Tag user.');
    await client.groupParticipantsUpdate(groupJid(message), targets, 'promote'); return replyText(client, message, 'Admin ditambahkan.');
  }}),
  createCommand({ name: 'demote', ...groupAdmin, description: 'Cabut admin.', execute: async (client, message, args) => {
    const targets = targetJids(message, args); if (!targets.length) return replyText(client, message, 'Tag user.');
    await client.groupParticipantsUpdate(groupJid(message), targets, 'demote'); return replyText(client, message, 'Admin dicabut.');
  }}),
  createCommand({ name: 'opengroup', ...groupAdmin, description: 'Buka grup.', execute: async (client, message) => { await client.groupSettingUpdate(groupJid(message), 'not_announcement'); return replyText(client, message, 'Grup dibuka.'); }}),
  createCommand({ name: 'closegroup', ...groupAdmin, description: 'Tutup grup.', execute: async (client, message) => { await client.groupSettingUpdate(groupJid(message), 'announcement'); return replyText(client, message, 'Grup ditutup.'); }}),
  createCommand({ name: 'groupinfo', ...groupAdmin, description: 'Info grup.', execute: async (client, message) => { const data = await metadata(client, message); return replyText(client, message, `${data.subject || 'Grup'}\nAnggota: ${(data.participants || []).length}`); }}),
  createCommand({ name: 'membercount', ...groupAdmin, description: 'Jumlah anggota.', execute: async (client, message) => { const data = await metadata(client, message); return replyText(client, message, `Jumlah anggota: ${(data.participants || []).length}`); }}),
  createCommand({
    name: 'messagecount',
    ...groupAdmin,
    description: 'Jumlah pesan grup (day/month/all).',
    execute: async (client, message, args) => {
      const period = String(args[0] || 'all').toLowerCase();
      const stats = await MessageStatsService.getStats(groupJid(message), period);
      return replyText(client, message, `Total Pesan (${stats.period}): ${stats.count}`);
    },
  }),
  createCommand({
    name: 'pinchat',
    ...groupAdmin,
    description: 'Pin chat grup (24h/7d/30d).',
    execute: async (client, message, args) => {
      const duration = String(args[0] || '24h').toLowerCase();
      if (!['24h', '7d', '30d'].includes(duration)) {
        return replyText(client, message, 'Pilihan durasi: 24h, 7d, 30d. Contoh: .pinchat 7d');
      }
      try {
        await GroupService.pinChat(client, groupJid(message), duration);
        return replyText(client, message, `Chat berhasil di-pin selama ${duration}.`);
      } catch (err) {
        return replyText(client, message, `Gagal mem-pin chat: ${err.message}`);
      }
    },
  }),
  createCommand({
    name: 'unpinchat',
    ...groupAdmin,
    description: 'Unpin chat grup.',
    execute: async (client, message) => {
      try {
        await GroupService.unpinChat(client, groupJid(message));
        return replyText(client, message, 'Chat berhasil di-unpin.');
      } catch (err) {
        return replyText(client, message, `Gagal meng-unpin chat: ${err.message}`);
      }
    },
  }),
  createCommand({
    name: 'group',
    aliases: ['groupmenu', 'gcmenu'],
    ...groupAdmin,
    description: 'Tampilkan menu administrasi grup.',
    execute: async (client, message) => {
      const text = [
        '╭─〔 GROUP MENU 〕',
        '│',
        '├─ LINK PROTECTION',
        '│  ├─ .antilink <all|custom|off>',
        '│  ├─ .addlink <domain>',
        '│  ├─ .dellink <domain>',
        '│  └─ .listlink',
        '│',
        '├─ TOXIC PROTECTION',
        '│  ├─ .antitoxic <on|off>',
        '│  ├─ .addbadword <word>',
        '│  ├─ .delbadword <word>',
        '│  └─ .listbadword',
        '│',
        '├─ GROUP MANAGEMENT',
        '│  ├─ .hidetag <pesan>',
        '│  ├─ .grouplink',
        '│  ├─ .kick @user',
        '│  ├─ .promote @user',
        '│  ├─ .demote @user',
        '│  ├─ .opengroup',
        '│  └─ .closegroup',
        '│',
        '├─ GROUP INFORMATION',
        '│  ├─ .groupinfo',
        '│  ├─ .membercount',
        '│  └─ .messagecount <day|month|all>',
        '│',
        '└─ CHAT PIN',
        '   ├─ .pinchat <24h|7d|30d>',
        '   └─ .unpinchat',
        '╰──────────────────',
        '> 「Khusus Admin Grup & Bot Owner」',
      ].join('\n');
      return replyText(client, message, text);
    },
  }),
];

module.exports = commands;
