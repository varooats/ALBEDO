const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { resolveMentionJids } = require('../../utils/message.utils');
const {
  getGroupSettings,
  updateGroupSettings,
  approveGroup,
  setGroupStatus,
  getGroup,
} = require('../../database/repositories/group.repository');
const GroupService = require('../../features/group/group.service');
const MessageStatsService = require('../../features/group/message-stats.service');

const groupAdmin = { access: 'group-admin' };
const botAdmin = { access: 'bot-admin' };
const ownerOnly = { access: 'owner' };

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

function formatDate(timestamp) {
  if (!timestamp) return '—';
  try {
    const d = new Date(timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return '—';
  }
}

const commands = [
  // 1. APPROVE & LEAVE GROUP (Owner/Admin Approval)
  createCommand({
    name: 'approvegroup',
    aliases: ['accgroup', 'acgc'],
    ...ownerOnly,
    description: 'Setujui grup agar ALBEDO aktif digunakan.',
    execute: async (client, message, args) => {
      let targetJid = groupJid(message);
      if (args[0] && String(args[0]).endsWith('@g.us')) {
        targetJid = args[0].trim();
      }

      if (!targetJid || !targetJid.endsWith('@g.us')) {
        return replyText(client, message, 'Gunakan di dalam grup atau: `.approvegroup <id@g.us>`');
      }

      let groupName = '';
      try {
        const meta = await client.groupMetadata(targetJid);
        groupName = meta?.subject || '';
      } catch {}

      await approveGroup(targetJid, groupName, 'owner');
      await replyText(client, message, `✅ Grup *${groupName || targetJid}* berhasil disetujui (STATUS: ACTIVE).`);

      // Send welcoming message inside the approved group
      try {
        await client.sendMessage(targetJid, {
          text: '✨ *ALBEDO BERHASIL DIAKTIFKAN*\n\nGrup ini telah disetujui oleh Owner. Semua fitur ALBEDO sekarang dapat digunakan.',
        });
      } catch {}
      return true;
    },
  }),

  createCommand({
    name: 'leavegroup',
    aliases: ['outgroup', 'keluargrup'],
    ...ownerOnly,
    description: 'Keluarkan bot dari grup.',
    execute: async (client, message, args) => {
      let targetJid = groupJid(message);
      if (args[0] && String(args[0]).endsWith('@g.us')) {
        targetJid = args[0].trim();
      }

      if (!targetJid || !targetJid.endsWith('@g.us')) {
        return replyText(client, message, 'Gunakan di dalam grup atau: `.leavegroup <id@g.us>`');
      }

      try {
        await setGroupStatus(targetJid, 'blocked');
        await client.sendMessage(targetJid, {
          text: '👋 *ALBEDO MENINGGALKAN GRUP*\n\nBot diperintahkan oleh Owner untuk keluar.',
        });
        await client.groupLeave(targetJid);
        if (targetJid !== groupJid(message)) {
          await replyText(client, message, `Berhasil keluar dari grup ${targetJid}`);
        }
      } catch (err) {
        await replyText(client, message, `Gagal keluar grup: ${err?.message || err}`);
      }
      return true;
    },
  }),

  // 2. LINK PROTECTION
  createCommand({
    name: 'antilink',
    ...groupAdmin,
    description: 'Atur perlindungan link.',
    execute: async (client, message, args) => {
      const mode = String(args[0] || '').toLowerCase();
      if (!['all', 'custom', 'off'].includes(mode)) return replyText(client, message, 'Gunakan .antilink all|custom|off.');
      await updateGroupSettings(groupJid(message), { antilink: mode });
      return replyText(client, message, `Anti-link: ${mode}`);
    },
  }),
  createCommand({
    name: 'addlink',
    ...groupAdmin,
    description: 'Tambah domain blacklist.',
    execute: async (client, message, args) => {
      const domain = String(args[0] || '').toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
      if (!domain || !domain.includes('.')) return replyText(client, message, 'Gunakan .addlink <domain>.');
      const settings = await getGroupSettings(groupJid(message));
      if (!settings.links.includes(domain)) settings.links.push(domain);
      await updateGroupSettings(groupJid(message), { links: settings.links });
      return replyText(client, message, `Domain ditambahkan: ${domain}`);
    },
  }),
  createCommand({
    name: 'dellink',
    ...groupAdmin,
    description: 'Hapus domain blacklist.',
    execute: async (client, message, args) => {
      const domain = String(args[0] || '').toLowerCase();
      const settings = await getGroupSettings(groupJid(message));
      await updateGroupSettings(groupJid(message), { links: settings.links.filter((item) => item !== domain) });
      return replyText(client, message, `Domain dihapus: ${domain}`);
    },
  }),
  createCommand({
    name: 'listlink',
    ...groupAdmin,
    description: 'Lihat domain blacklist.',
    execute: async (client, message) => {
      const settings = await getGroupSettings(groupJid(message));
      return replyText(client, message, settings.links.length ? settings.links.join('\n') : 'Blacklist domain kosong.');
    },
  }),

  // 3. TOXIC PROTECTION
  createCommand({
    name: 'antitoxic',
    ...groupAdmin,
    description: 'Atur filter kata.',
    execute: async (client, message, args) => setSetting(client, message, args, 'antitoxic', true),
  }),
  createCommand({
    name: 'addbadword',
    ...groupAdmin,
    description: 'Tambah kata filter.',
    execute: async (client, message, args) => {
      const word = String(args.join(' ') || '').trim().toLowerCase();
      if (!word) return replyText(client, message, 'Gunakan .addbadword <word>.');
      const settings = await getGroupSettings(groupJid(message));
      if (!settings.badwords.includes(word)) settings.badwords.push(word);
      await updateGroupSettings(groupJid(message), { badwords: settings.badwords });
      return replyText(client, message, `Kata ditambahkan: ${word}`);
    },
  }),
  createCommand({
    name: 'delbadword',
    ...groupAdmin,
    description: 'Hapus kata filter.',
    execute: async (client, message, args) => {
      const word = String(args.join(' ') || '').trim().toLowerCase();
      const settings = await getGroupSettings(groupJid(message));
      await updateGroupSettings(groupJid(message), { badwords: settings.badwords.filter((item) => item !== word) });
      return replyText(client, message, `Kata dihapus: ${word}`);
    },
  }),
  createCommand({
    name: 'listbadword',
    ...groupAdmin,
    description: 'Lihat kata filter.',
    execute: async (client, message) => {
      const settings = await getGroupSettings(groupJid(message));
      return replyText(client, message, settings.badwords.length ? settings.badwords.join('\n') : 'Daftar badword kosong.');
    },
  }),

  // 4. GROUP MANAGEMENT (Admin verification: kick, promote, demote, opengroup, closegroup require bot-admin)
  createCommand({
    name: 'hidetag',
    aliases: ['ta'],
    ...groupAdmin,
    description: 'Mention semua anggota.',
    execute: async (client, message, args) => {
      const data = await metadata(client, message);
      const mentions = (data.participants || []).map((item) => item.id).filter(Boolean);
      return client.sendMessage(groupJid(message), { text: args.join(' ') || ' ', mentions });
    },
  }),
  createCommand({
    name: 'grouplink',
    ...botAdmin, // needs bot to be admin to get invite link
    description: 'Ambil link grup.',
    execute: async (client, message) =>
      replyText(client, message, await client.groupInviteCode(groupJid(message)).then((code) => `https://chat.whatsapp.com/${code}`)),
  }),
  createCommand({
    name: 'kick',
    ...botAdmin,
    description: 'Keluarkan anggota.',
    execute: async (client, message, args) => {
      const targets = targetJids(message, args);
      if (!targets.length) return replyText(client, message, 'Tag user yang ingin dikeluarkan.');
      await client.groupParticipantsUpdate(groupJid(message), targets, 'remove');
      return replyText(client, message, 'Anggota berhasil dikeluarkan.');
    },
  }),
  createCommand({
    name: 'promote',
    ...botAdmin,
    description: 'Jadikan admin.',
    execute: async (client, message, args) => {
      const targets = targetJids(message, args);
      if (!targets.length) return replyText(client, message, 'Tag user yang ingin dijadikan admin.');
      await client.groupParticipantsUpdate(groupJid(message), targets, 'promote');
      return replyText(client, message, 'Admin berhasil ditambahkan.');
    },
  }),
  createCommand({
    name: 'demote',
    ...botAdmin,
    description: 'Cabut admin.',
    execute: async (client, message, args) => {
      const targets = targetJids(message, args);
      if (!targets.length) return replyText(client, message, 'Tag admin yang ingin diturunkan.');
      await client.groupParticipantsUpdate(groupJid(message), targets, 'demote');
      return replyText(client, message, 'Admin berhasil dicabut.');
    },
  }),
  createCommand({
    name: 'opengroup',
    ...botAdmin,
    description: 'Buka grup.',
    execute: async (client, message) => {
      await client.groupSettingUpdate(groupJid(message), 'not_announcement');
      return replyText(client, message, 'Grup berhasil dibuka.');
    },
  }),
  createCommand({
    name: 'closegroup',
    ...botAdmin,
    description: 'Tutup grup.',
    execute: async (client, message) => {
      await client.groupSettingUpdate(groupJid(message), 'announcement');
      return replyText(client, message, 'Grup berhasil ditutup.');
    },
  }),

  // 5. GROUP INFORMATION (Standardized Format sesuai Permintaan)
  createCommand({
    name: 'groupinfo',
    ...groupAdmin,
    description: 'Info lengkap grup dan status whitelist ALBEDO.',
    execute: async (client, message) => {
      const jid = groupJid(message);
      const data = await metadata(client, message);
      const settings = await getGroup(jid);

      const status = (settings?.status || 'PENDING').toUpperCase();
      const approvedDate = formatDate(settings?.approvedAt);
      const memberCount = (data?.participants || []).length;
      const groupName = data?.subject || settings?.name || 'ALBEDO COMMUNITY';

      const antilinkOn = settings?.antilink && settings.antilink !== 'off';
      const antitoxicOn = !!settings?.antitoxic;
      const welcomeOn = settings?.welcome !== false;
      const autoLevelOn = settings?.autolevelup !== false;

      const text = [
        '╭─〔 GROUP INFO 〕',
        '│',
        `│ Name     : ${groupName}`,
        `│ ID       : ${jid}`,
        `│ Status   : ${status}`,
        `│ Members  : ${memberCount}`,
        `│ Approved : ${approvedDate}`,
        '│',
        '│  Features',
        `│ ├─ Welcome     ${welcomeOn ? 'ON' : 'OFF'}`,
        `│ ├─ Anti Link   ${antilinkOn ? 'ON' : 'OFF'}`,
        `│ ├─ Anti Toxic  ${antitoxicOn ? 'ON' : 'OFF'}`,
        `│ └─ Auto Level  ${autoLevelOn ? 'ON' : 'OFF'}`,
        '╰────────────────',
      ].join('\n');

      return replyText(client, message, text);
    },
  }),

  createCommand({
    name: 'membercount',
    ...groupAdmin,
    description: 'Jumlah anggota.',
    execute: async (client, message) => {
      const data = await metadata(client, message);
      return replyText(client, message, `Jumlah anggota: ${(data.participants || []).length}`);
    },
  }),
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

  // 6. CHAT PIN
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
        '├─ GROUP APPROVAL',
        '│  ├─ .approvegroup [id@g.us]',
        '│  └─ .leavegroup [id@g.us]',
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
