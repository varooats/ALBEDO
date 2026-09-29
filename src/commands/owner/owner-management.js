const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { resolveMentionJids } = require('../../utils/message');
const {
  getSuperOwners,
  getOwners,
  getBotAdmins,
  addOwner,
  delOwner,
  addBotAdmin,
  delBotAdmin,
} = require('../../services/owner/owner.service');
const { logAudit } = require('../../services/audit/audit.service');

function extractTargetNumber(message, args = []) {
  const mentioned = resolveMentionJids(message);
  if (mentioned.length) {
    return String(mentioned[0]).replace(/\D/g, '');
  }
  const clean = String(args[0] || '').replace(/\D/g, '');
  return clean || null;
}

module.exports = [
  createCommand({
    name: 'addowner',
    permission: 'SUPEROWNER',
    category: 'owner',
    description: 'Tambah owner baru (khusus Superowner).',
    execute: async (client, message, args) => {
      const num = extractTargetNumber(message, args);
      if (!num) return replyText(client, message, 'Gunakan: `.addowner <nomor/tag>`');
      try {
        await addOwner(num);
        await logAudit('OWNER', `Added owner: ${num}`);
        return replyText(client, message, `✅ Berhasil menambahkan owner: +${num}`);
      } catch (err) {
        return replyText(client, message, `Gagal: ${err.message}`);
      }
    },
  }),

  createCommand({
    name: 'delowner',
    aliases: ['deleteowner'],
    permission: 'SUPEROWNER',
    category: 'owner',
    description: 'Hapus owner terdaftar (khusus Superowner).',
    execute: async (client, message, args) => {
      const num = extractTargetNumber(message, args);
      if (!num) return replyText(client, message, 'Gunakan: `.delowner <nomor/tag>`');
      try {
        await delOwner(num);
        await logAudit('OWNER', `Deleted owner: ${num}`);
        return replyText(client, message, `✅ Berhasil menghapus owner: +${num}`);
      } catch (err) {
        return replyText(client, message, `Gagal: ${err.message}`);
      }
    },
  }),

  createCommand({
    name: 'listowner',
    permission: 'ADMIN',
    category: 'owner',
    description: 'Lihat daftar hierarki owner bot.',
    execute: async (client, message) => {
      const superList = await getSuperOwners();
      const ownerList = await getOwners();
      const adminList = await getBotAdmins();

      const superLines = superList.map((n) => `  👑 +${n}`);
      const secondaryOwners = ownerList.filter((n) => !superList.includes(n));
      const ownerLines = secondaryOwners.map((n) => `  ⭐ +${n}`);
      const adminLines = adminList.map((n) => `  🛡️ +${n}`);

      const text = [
        '╭─〔 👥 HIERARKI BOT OWNER 〕',
        '│',
        '├─ SUPEROWNER',
        superLines.length ? superLines.join('\n') : '  (none)',
        '│',
        '├─ OWNER',
        ownerLines.length ? ownerLines.join('\n') : '  (none)',
        '│',
        '└─ BOT ADMIN',
        adminLines.length ? adminLines.join('\n') : '  (none)',
        '╰──────────────────────────',
      ].join('\n');

      return replyText(client, message, text);
    },
  }),

  createCommand({
    name: 'addadmin',
    aliases: ['addbotadmin'],
    permission: 'OWNER',
    category: 'owner',
    description: 'Tambah admin bot.',
    execute: async (client, message, args) => {
      const num = extractTargetNumber(message, args);
      if (!num) return replyText(client, message, 'Gunakan: `.addadmin <nomor/tag>`');
      try {
        await addBotAdmin(num);
        await logAudit('OWNER', `Added bot admin: ${num}`);
        return replyText(client, message, `✅ Berhasil menambahkan bot admin: +${num}`);
      } catch (err) {
        return replyText(client, message, `Gagal: ${err.message}`);
      }
    },
  }),

  createCommand({
    name: 'deladmin',
    aliases: ['delbotadmin', 'deletebotadmin'],
    permission: 'OWNER',
    category: 'owner',
    description: 'Hapus admin bot.',
    execute: async (client, message, args) => {
      const num = extractTargetNumber(message, args);
      if (!num) return replyText(client, message, 'Gunakan: `.deladmin <nomor/tag>`');
      try {
        await delBotAdmin(num);
        await logAudit('OWNER', `Deleted bot admin: ${num}`);
        return replyText(client, message, `✅ Berhasil menghapus bot admin: +${num}`);
      } catch (err) {
        return replyText(client, message, `Gagal: ${err.message}`);
      }
    },
  }),
];
