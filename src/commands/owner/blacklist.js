const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { resolveMentionJids } = require('../../utils/message');
const { banUser, unbanUser, getBanInfo, listBannedUsers } = require('../../services/security/blacklist.service');
const { logAudit } = require('../../services/audit/audit.service');
const { validateActionTarget } = require('../../core/middleware');

function getTargetJid(message, args = []) {
  const mentions = resolveMentionJids(message);
  if (mentions.length) return mentions[0];
  const num = String(args[0] || '').replace(/[^\d]/g, '');
  return num ? `${num}@s.whatsapp.net` : null;
}

module.exports = [
  createCommand({
    name: 'banuser',
    permission: 'ADMIN',
    category: 'owner',
    description: 'Blacklist pengguna dari bot.',
    execute: async (client, message, args) => {
      const target = getTargetJid(message, args);
      if (!target) return replyText(client, message, 'Gunakan: `.banuser @user [alasan]`');

      // Anti self-target / dangerous action validation
      const validation = await validateActionTarget(client, message, target);
      if (!validation.allowed) {
        return replyText(client, message, validation.message);
      }

      const reason = args.slice(1).join(' ') || 'Melanggar aturan ALBEDO';
      const sender = message?.key?.participant || message?.key?.remoteJid || 'owner';
      await banUser(target, reason, sender);
      await logAudit('SECURITY', `User blocked: ${String(target).split('@')[0]} (${reason})`, { target, reason });

      return replyText(
        client,
        message,
        `✅ User @${String(target).split('@')[0]} berhasil diblacklist.\nAlasan: ${reason}`,
        { mentions: [target] }
      );
    },
  }),

  createCommand({
    name: 'unbanuser',
    permission: 'ADMIN',
    category: 'owner',
    description: 'Buka blacklist pengguna.',
    execute: async (client, message, args) => {
      const target = getTargetJid(message, args);
      if (!target) return replyText(client, message, 'Gunakan: `.unbanuser @user`');

      await unbanUser(target);
      await logAudit('SECURITY', `User unblocked: ${String(target).split('@')[0]}`, { target });

      return replyText(
        client,
        message,
        `✅ User @${String(target).split('@')[0]} berhasil dihapus dari blacklist.`,
        { mentions: [target] }
      );
    },
  }),

  createCommand({
    name: 'checkban',
    permission: 'ADMIN',
    category: 'owner',
    description: 'Periksa status blacklist pengguna.',
    execute: async (client, message, args) => {
      const target = getTargetJid(message, args);
      if (!target) return replyText(client, message, 'Gunakan: `.checkban @user`');

      const info = await getBanInfo(target);
      if (!info) {
        return replyText(client, message, `User @${String(target).split('@')[0]} *TIDAK* diblacklist.`, { mentions: [target] });
      }

      const dateStr = info.bannedAt ? new Date(info.bannedAt).toLocaleString() : '—';
      return replyText(
        client,
        message,
        `🚫 *STATUS BLACKLIST*\n\nUser: @${String(target).split('@')[0]}\nAlasan: ${info.reason}\nWaktu: ${dateStr}\nOleh: ${info.bannedBy}`,
        { mentions: [target] }
      );
    },
  }),

  createCommand({
    name: 'listban',
    permission: 'ADMIN',
    category: 'owner',
    description: 'Daftar semua pengguna yang diblacklist.',
    execute: async (client, message) => {
      const list = await listBannedUsers();
      if (!list.length) return replyText(client, message, 'Daftar blacklist kosong.');

      const lines = list.map((item, i) => `${i + 1}. +${String(item.jid).split('@')[0]} — _${item.reason}_`);
      return replyText(
        client,
        message,
        `╭─〔 🚫 DAFTAR BLACKLIST 〕\n│\n${lines.map((l) => `│ ${l}`).join('\n')}\n│\n╰──────────────────`
      );
    },
  }),
];
