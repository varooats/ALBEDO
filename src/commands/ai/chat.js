const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { getSenderJid, isGroupMessage, sendReaction, REACTIONS } = require('../../utils/message');
const { chatAi } = require('../../services/ai/ai.service');

module.exports = createCommand({
  name: 'chat',
  category: 'ai',
  permission: 'USER',
  description: 'Percakapan interaktif dengan AI berkesinambungan.',
  execute: async (client, message, args = []) => {
    const text = args.join(' ').trim();
    if (!text) {
      return replyText(
        client,
        message,
        '💬 *ALBEDO AI CHAT*\n\nKirim pesan untuk mengobrol dengan AI.\n\n*Format:*\n`.chat <pesan>`\n`.chat reset` (untuk menghapus riwayat obrolan)\n\n*Contoh:*\n`.chat halo, nama kamu siapa?`'
      );
    }

    const senderJid = getSenderJid(message);
    const isGroup = isGroupMessage(message);
    const sessionKey = isGroup
      ? `${message.key.remoteJid}_${senderJid}`
      : senderJid;

    if (text.toLowerCase() === 'reset' || text.toLowerCase() === 'clear') {
      const resetMsg = await chatAi(sessionKey, 'reset');
      return replyText(client, message, resetMsg);
    }

    await sendReaction(client, message, REACTIONS.PROCESSING);

    try {
      const answer = await chatAi(sessionKey, text);
      await sendReaction(client, message, REACTIONS.SUCCESS);
      return replyText(client, message, `💬 *ALBEDO*\n\n${answer}`);
    } catch (err) {
      await sendReaction(client, message, REACTIONS.FAILED);
      return replyText(client, message, `❌ Gagal memproses obrolan: ${err.message}`);
    }
  },
});
