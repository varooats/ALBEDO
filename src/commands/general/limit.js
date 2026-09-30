const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { getUserByJid } = require('../../database/repositories/user.repository');
const { calculateLimitPrice, DEFAULT_LIMIT } = require('../../services/limit/limit.service');
const { sendNativeFlow } = require('../../utils/interactive');
const { getSenderJid, resolveMentionJids } = require('../../utils/message');
const { isOwnerMessage } = require('../../core/middleware');

module.exports = createCommand({
  name: 'limit',
  aliases: ['ceklimit', 'kuota'],
  isFree: true,
  description: 'Cek sisa limit, progress bar penggunaan, dan status user.',
  execute: async (client, message, args = [], ctx = {}) => {
    const mentions = resolveMentionJids(message);
    const targetJid = mentions[0] || ctx?.senderJid || getSenderJid(message);
    if (!targetJid) return false;

    const user = (await getUserByJid(targetJid)) || (targetJid === ctx?.senderJid ? ctx?.globalUser : null);
    if (!user) {
      await replyText(client, message, messages.profile.register.required);
      return true;
    }

    const isOwner = ctx?.isOwner || isOwnerMessage(message);
    const scoped = ctx?.scopedUser;
    const currentLimit = isOwner ? '∞' : (scoped?.limit ?? user.limit ?? DEFAULT_LIMIT);
    const maxLimit = isOwner ? '∞' : Math.max(DEFAULT_LIMIT, scoped?.maxLimit || user.maxLimit || (scoped?.limit ?? user.limit ?? DEFAULT_LIMIT));
    const currentExp = scoped?.exp ?? user.exp ?? 0;
    const p10 = calculateLimitPrice(typeof currentLimit === 'number' ? currentLimit : DEFAULT_LIMIT, 10);

    const bar = isOwner
      ? '▰▰▰▰▰▰▰▰▰▰ 100%'
      : messages.store.renderProgressBar(typeof currentLimit === 'number' ? currentLimit : DEFAULT_LIMIT, typeof maxLimit === 'number' ? maxLimit : DEFAULT_LIMIT, 10);

    const userStatus = isOwner
      ? 'Owner (Unlimited ∞)'
      : (scoped?.tier === 'vip' || user.premium)
        ? 'VIP Premium'
        : 'Free User';

    const body = messages.store.limitStatus({
      name: user.name || 'User',
      limit: isOwner ? '∞' : currentLimit,
      maxLimit: isOwner ? '∞' : maxLimit,
      exp: currentExp,
      bar,
      status: userStatus,
      p10,
    });

    const jid = message?.key?.remoteJid;

    try {
      const sections = [
        {
          title: 'MENU LIMIT',
          rows: [
            { id: 'store:buy_10', title: 'Beli +10 Limit', description: `Biaya: ${p10} XP` },
            { id: 'menu_utama:store', title: 'Buka Store', description: 'Lihat semua paket limit' },
          ],
        },
      ];

      await sendNativeFlow(client, jid, message, {
        title: 'STATUS LIMIT',
        body,
        sections,
      });
      return true;
    } catch (err) {
      console.warn('[LIMIT] sendNativeFlow failed, fallback to text:', err?.message || err);
      await replyText(
        client,
        message,
        body + '\n\nKetik ```.buy 10``` untuk membeli limit atau ```.store``` untuk melihat paket.'
      );
      return true;
    }
  },
});
