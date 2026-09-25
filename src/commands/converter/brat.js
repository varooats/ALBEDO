const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const stickerService = require('../../services/media/sticker.service');
const { createBratImage } = require('../../services/media/brat.service');
const { messages } = require('../../messages');
const { sendTyping, sendReaction, REACTIONS } = require('../../utils/message.utils');

module.exports = createCommand({
  name: 'brat',
  description: 'Buat sticker teks gaya brat meme.',
  execute: async (client, message, args = []) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    let text = args.join(' ').trim();
    if (!text) {
      await replyText(client, message, messages.converter.brat.usage);
      return false;
    }

    let theme = 'white';
    if (text.includes('--green')) {
      theme = 'green';
      text = text.replace('--green', '').trim();
    } else if (text.includes('--black')) {
      theme = 'black';
      text = text.replace('--black', '').trim();
    }

    await sendTyping(client, jid, 'composing');
    await sendReaction(client, message, REACTIONS.PROCESSING);

    try {
      const pngBuffer = await createBratImage(text, { theme });
      const stickerBuf = await stickerService.create(pngBuffer, {
        packname: 'BRAT MEME',
        author: 'ALBEDO-BOT',
      });

      await client.sendMessage(jid, { sticker: stickerBuf }, { quoted: message });
      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (e) {
      console.error('[BRAT] Error:', e.message || e);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, messages.converter.brat.error);
      return false;
    }
  },
});
