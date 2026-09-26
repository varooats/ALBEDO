const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { resolveMentionJids } = require('../../utils/message');
const { getOwners, addOwner, delOwner } = require('../../services/owner/owner.service');

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
    access: 'owner',
    description: 'Tambah owner baru.',
    execute: async (client, message, args) => {
      const num = extractTargetNumber(message, args);
      if (!num) return replyText(client, message, 'Gunakan: .addowner <nomor/tag>');
      try {
        await addOwner(num);
        return replyText(client, message, `Berhasil menambahkan owner: ${num}`);
      } catch (err) {
        return replyText(client, message, `Gagal: ${err.message}`);
      }
    },
  }),
  createCommand({
    name: 'delowner',
    aliases: ['deleteowner'],
    access: 'owner',
    description: 'Hapus owner terdaftar.',
    execute: async (client, message, args) => {
      const num = extractTargetNumber(message, args);
      if (!num) return replyText(client, message, 'Gunakan: .delowner <nomor/tag>');
      try {
        await delOwner(num);
        return replyText(client, message, `Berhasil menghapus owner: ${num}`);
      } catch (err) {
        return replyText(client, message, `Gagal: ${err.message}`);
      }
    },
  }),
  createCommand({
    name: 'listowner',
    access: 'owner',
    description: 'Lihat daftar owner.',
    execute: async (client, message) => {
      const list = await getOwners();
      const body = list.map((num, i) => `${i + 1}. +${num}`).join('\n');
      return replyText(client, message, `╭─『 DAFTAR OWNER 』\n│\n${body || 'Tidak ada owner terdaftar.'}\n╰────────────`);
    },
  }),
];
