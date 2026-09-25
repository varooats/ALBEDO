const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { generateBratVideo } = require('../../services/media/brat.service');
const { addExif } = require('../../services/media/sticker.service');
const { sendTyping, sendReaction, REACTIONS } = require('../../utils/message.utils');

module.exports = createCommand({
  name: 'bratvid',
  aliases: ['bratvideo', 'bratgif'],
  description: 'Buat stiker animasi teks kata per kata ala brat meme.',
  execute: async (client, message, args = []) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    let text = args.join(' ').trim();
    if (!text) {
      await replyText(client, message, messages.converter.bratvid.usage);
      return true;
    }

    let theme = 'white';
    if (text.includes('--green')) {
      theme = 'green';
      text = text.replace('--green', '').trim();
    } else if (text.includes('--black')) {
      theme = 'black';
      text = text.replace('--black', '').trim();
    }

    if (!text) {
      await replyText(client, message, messages.converter.bratvid.usage);
      return true;
    }

    await sendTyping(client, jid, 'composing');
    await sendReaction(client, message, REACTIONS.PROCESSING);

    try {
      const result = await generateBratVideo({
        text,
        theme,
        format: 'webp',
        frameDuration: 0.35,
        holdDuration: 1.2,
      });

      // Inject WA Sticker EXIF metadata so WhatsApp renders it as native animated sticker
      const stickerBuffer = addExif(result.buffer, 'Albedo Brat', 'Albedo Bot');

      await client.sendMessage(
        jid,
        { sticker: stickerBuffer },
        { quoted: message }
      );

      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (error) {
      console.error('[BRATVID] Error:', error.message || error);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, messages.converter.bratvid.error());
      return false;
    }
  },
});
