const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { getUserByJid, saveUser } = require('../../database/repositories/user.repository');
const { resolveMentionJids, getSenderJid } = require('../../utils/message');
const { isGroupMessage } = require('../../core/middleware');
const { logAudit } = require('../../services/audit/audit.service');
const config = require('../../config/bot.config');

// ponytail: owner list stored in Firestore; for now stored in config overrides only
function getOwnerNumber() {
  return config.owner || '';
}

async function setLimit(client, message, args, mode) {
  const amount = parseInt(args[0], 10);
  if (!Number.isFinite(amount) || amount < 0) return replyText(client, message, 'Masukkan jumlah limit yang valid.');

  const mentioned = resolveMentionJids(message);
  const isAll = String(args[1] || args[0] || '').toLowerCase() === 'all' && !mentioned.length;
  const target = mentioned[0] || null;

  if (!target && !isAll) return replyText(client, message, 'Tag user, atau gunakan "all".');

  if (isAll) {
    return replyText(client, message, `⚠️ Operasi "all" memerlukan konfirmasi. Ketik .${mode}confirm ${amount} untuk melanjutkan.`);
  }

  const user = await getUserByJid(target);
  if (!user) return replyText(client, message, 'User tidak ditemukan.');

  if (mode === 'set') {
    user.limit = amount;
    user.maxLimit = amount;
  } else {
    user.limit = (user.limit || 0) + amount;
    user.maxLimit = Math.max(user.maxLimit || 0, user.limit);
  }
  user.updatedAt = new Date().toISOString();
  await saveUser(user);
  return replyText(client, message, `Limit ${mode === 'set' ? 'diset ke' : 'ditambah'} ${amount} untuk @${String(target).split('@')[0]}.`);
}

module.exports = [
  createCommand({
    name: 'setlimit',
    aliases: ['changelimit'],
    permission: 'OWNER',
    category: 'owner',
    description: 'Set limit user.',
    execute: async (client, message, args) => setLimit(client, message, args, 'set'),
  }),
  createCommand({
    name: 'addlimit',
    permission: 'OWNER',
    category: 'owner',
    description: 'Tambah limit user.',
    execute: async (client, message, args) => setLimit(client, message, args, 'add'),
  }),
  createCommand({
    name: 'restart',
    permission: 'SUPEROWNER',
    category: 'owner',
    description: 'Restart bot.',
    isFree: true,
    execute: async (client, message) => {
      await logAudit('OWNER', 'Bot restart initiated');
      await replyText(client, message, 'Memulai ulang...');
      setTimeout(() => process.exit(0), 500);
    },
  }),
  createCommand({
    name: 'backup',
    permission: 'OWNER',
    category: 'owner',
    description: 'Backup data bot.',
    isFree: true,
    execute: async (client, message) => {
      await logAudit('OWNER', 'Bot backup exported');
      const payload = JSON.stringify({ config: { name: config.name, prefix: config.prefix }, timestamp: new Date().toISOString() }, null, 2);
      return client.sendMessage(message.key.remoteJid, { document: Buffer.from(payload), mimetype: 'application/json', fileName: `albedo-backup-${Date.now()}.json` });
    },
  }),
];
