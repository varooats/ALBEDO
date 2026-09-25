const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { getUserByJid } = require('../../database/repositories/user.repository');
const { calculateLimitPrice, buyLimit } = require('../../features/limit/limit.service');
const { sendNativeFlow } = require('../../utils/interactive');
const { getSenderJid } = require('../../utils/message.utils');

async function sendStoreMenu(client, message, senderJid) {
  const user = await getUserByJid(senderJid);
  if (!user) {
    await replyText(client, message, messages.profile.register.required);
    return true;
  }

  const currentLimit = user.limit ?? 20;
  const currentExp = user.exp || 0;

  const p10 = calculateLimitPrice(currentLimit, 10);
  const p20 = calculateLimitPrice(currentLimit, 20);
  const p50 = calculateLimitPrice(currentLimit, 50);

  const body = messages.store.storeMenu({
    limit: currentLimit,
    exp: currentExp,
    p10,
    p20,
    p50,
  });

  const jid = message?.key?.remoteJid;

  try {
    const sections = [
      {
        title: 'BELI PAKET LIMIT',
        rows: [
          { id: 'store:buy_10', title: '+10 Limit', description: `Biaya: ${p10} XP` },
          { id: 'store:buy_20', title: '+20 Limit', description: `Biaya: ${p20} XP` },
          { id: 'store:buy_50', title: '+50 Limit', description: `Biaya: ${p50} XP` },
        ],
      },
    ];

    await sendNativeFlow(client, jid, message, {
      title: 'PILIH PAKET LIMIT',
      body,
      sections,
    });
    return true;
  } catch (err) {
    console.warn('[STORE] sendNativeFlow failed, fallback to text:', err?.message || err);
    await replyText(
      client,
      message,
      body + '\n\nKetik ```.buy 10```, ```.buy 20```, atau ```.buy 50``` untuk membeli.'
    );
    return true;
  }
}

module.exports = createCommand({
  name: 'store',
  aliases: ['buy', 'toko', 'belilimit'],
  isFree: true,
  description: 'Toko Albedo untuk membeli limit menggunakan EXP.',
  execute: async (client, message, args = []) => {
    const sender = getSenderJid(message);
    if (!sender) return false;

    const user = await getUserByJid(sender);
    if (!user) {
      await replyText(client, message, messages.profile.register.required);
      return true;
    }

    // Direct purchase command: e.g. .buy 10 or .store 20
    const requestedAmount = parseInt(args[0], 10);
    if (!isNaN(requestedAmount) && requestedAmount > 0) {
      const amount = [10, 20, 50].includes(requestedAmount) ? requestedAmount : 10;
      const result = await buyLimit(sender, amount);

      if (!result.success) {
        await replyText(
          client,
          message,
          messages.store.insufficientExp({
            price: result.price,
            currentExp: result.currentExp,
            missingExp: result.missingExp,
          })
        );
        return true;
      }

      await replyText(
        client,
        message,
        messages.store.buySuccess({
          amount: result.amount,
          price: result.price,
          newLimit: result.newLimit,
          remainingExp: result.remainingExp,
        })
      );
      return true;
    }

    return await sendStoreMenu(client, message, sender);
  },
});
