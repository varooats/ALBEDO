const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { sendReaction, REACTIONS } = require('../../utils/message');
const { askAi } = require('../../services/ai/ai.service');

module.exports = createCommand({
  name: 'ai',
  category: 'ai',
  permission: 'USER',
  description: 'Tanya jawab cerdas dengan AI (DeepSeek v4 via APMIX).',
  execute: async (client, message, args = []) => {
    const prompt = args.join(' ').trim();
    if (!prompt) {
      return replyText(
        client,
        message,
        '💡 *ALBEDO AI ASSISTANT*\n\nMasukkan pertanyaan atau perintah kamu.\n\n*Contoh:*\n`.ai Jelaskan apa itu black hole secara singkat`\n`.ai Buatkan resep nasi goreng spesial`'
      );
    }

    await sendReaction(client, message, REACTIONS.PROCESSING);

    try {
      const answer = await askAi(prompt);
      await sendReaction(client, message, REACTIONS.SUCCESS);
      return replyText(client, message, `🤖 *ALBEDO AI*\n\n${answer}`);
    } catch (err) {
      await sendReaction(client, message, REACTIONS.FAILED);
      return replyText(client, message, `❌ Gagal memproses AI: ${err.message}`);
    }
  },
});
