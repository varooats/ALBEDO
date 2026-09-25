const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { extractMediaBuffer } = require('../../utils/media-helper');
const stickerService = require('../../services/media/sticker.service');
const { sendReaction, REACTIONS } = require('../../utils/message.utils');

module.exports = createCommand({
  name: 'swm',
  aliases: ['wm', 'take'],
  description: 'Konversi media jadi sticker dengan watermark packname & author kustom.',
  execute: async (client, message, args = []) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    const mediaBuffer = await extractMediaBuffer(client, message);
    if (!mediaBuffer) {
      await replyText(client, message, messages.converter.swm.usage);
      return true;
    }

    await sendReaction(client, message, REACTIONS.PROCESSING);

    const input = args.join(' ').trim();
    let packname = 'ALBEDO-BOT';
    let author = message?.pushName || 'Albedo';

    if (input) {
      if (input.includes('|')) {
        const [p, a] = input.split(/\|(.*)/s);
        if (p.trim()) packname = p.trim();
        if (a.trim()) author = a.trim();
      } else {
        packname = input;
      }
    }

    try {
      const stickerBuf = await stickerService.create(mediaBuffer, {
        packname,
        author,
      });

      await client.sendMessage(jid, { sticker: stickerBuf }, { quoted: message });
      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (e) {
      console.error('[SWM] Error creating sticker watermark:', e.message || e);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, messages.converter.swm.error);
      return false;
    }
  },
});
