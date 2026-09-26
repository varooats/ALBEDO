const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages, formatMessage } = require('../../messages');
const { sendNativeFlow } = require('../../utils/interactive');
const { getMainMenuSection, getFiturBotSection } = require('../../features/menu/menu.builder');
const { extractMediaBuffer } = require('../../utils/media-helper');
const stickerService = require('../../services/media/sticker.service');
const { sendReaction, REACTIONS } = require('../../utils/message');

async function sendStickerMenuReply(client, message, text) {
  const jid = message?.key?.remoteJid;
  if (!jid) return false;

  const sections = [
    {
      title: 'STICKER & CONVERTER (LENGKAP)',
      rows: [
        { id: '.brat', title: '.brat', description: 'Buat stiker teks brat meme' },
        { id: '.bratvid', title: '.bratvid', description: 'Buat stiker animasi teks kata per kata' },
        { id: '.bratanime', title: '.bratanime', description: 'Buat stiker anime memegang papan' },
        { id: '.sticker', title: '.sticker', description: 'Konversi gambar/video ke stiker WA' },
        { id: '.s', title: '.s', description: 'Alias singkat pembuat stiker' },
        { id: '.swm', title: '.swm', description: 'Beri watermark custom pada stiker' },
      ],
    },
  ];

  const mainMenuSection = getMainMenuSection();
  if (mainMenuSection) {
    sections.push(mainMenuSection);
  }

  const fiturBotSection = getFiturBotSection();
  if (fiturBotSection) {
    sections.push(fiturBotSection);
  }

  return sendNativeFlow(client, jid, message, {
    title: 'STICKER TOOLS',
    body: text,
    sections,
  });
}

module.exports = createCommand({
  name: 'sticker',
  aliases: ['s'],
  description: 'Konversi gambar/video menjadi sticker.',
  execute: async (client, message, args = []) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    const mediaBuffer = await extractMediaBuffer(client, message);

    if (!mediaBuffer) {
      const rawText = (
        message?.message?.conversation ||
        message?.message?.extendedTextMessage?.text ||
        ''
      ).trim();

      if (/^\.s(?:\s|$)/.test(rawText)) {
        return false;
      }

      const body = formatMessage(messages.menu.converter.body || '', {});
      return sendStickerMenuReply(client, message, body);
    }

    await sendReaction(client, message, REACTIONS.PROCESSING);

    try {
      const stickerBuf = await stickerService.create(mediaBuffer);
      await client.sendMessage(jid, { sticker: stickerBuf }, { quoted: message });
      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (e) {
      console.error('[STICKER] Error creating sticker:', e);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, messages.converter.sticker.error);
      return false;
    }
  },
});
