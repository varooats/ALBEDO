const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { getUserByJid, ensureUser } = require('../../database/repositories/user.repository');
const { messages, formatMessage } = require('../../messages');
const { resolveJid } = require('../../utils/message');

module.exports = createCommand({
  name: 'register',
  aliases: ['daftar'],
  description: 'Daftarkan user ke database Firebase untuk profile card.',
  isPublic: true,
  isFree: true,
  limit: 0,
  cooldown: 3,
  execute: async (client, message, args = [], ctx = {}) => {
    const jid = resolveJid(message) || ctx?.senderJid;
    if (!jid) return false;

    const rawName = (args.join(' ') || message?.pushName || 'User').trim();
    if (!rawName) {
      const help = formatMessage(messages.profile.register.required, { name: 'User' });
      await replyText(client, message, help);
      return true;
    }

    try {
      const existingUser = (await getUserByJid(jid)) || ctx?.globalUser || (ctx?.senderNumber ? await getUserByJid(ctx.senderNumber) : null);
      if (existingUser) {
        const alreadyRegistered = formatMessage(messages.profile.register.alreadyRegistered, {
          name: existingUser.name || 'User',
          id: existingUser.id || 'ALB-000001',
        });
        await replyText(client, message, alreadyRegistered);
        return true;
      }

      const user = await ensureUser({ jid, name: rawName });
      const success = formatMessage(messages.profile.register.success, {
        name: user.name,
        id: user.id,
        jid: user.jid,
      });

      await replyText(client, message, success);
      return true;
    } catch (error) {
      console.error('[REGISTER] Error:', error);
      await replyText(client, message, messages.profile.register.error);
      return false;
    }
  },
});
