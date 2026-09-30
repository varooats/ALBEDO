const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const { sendNativeFlow } = require('../../utils/interactive');
const { getMainMenuSection, getFiturBotSection } = require('../../features/menu/menu.builder');
const { handlePlatformDownload } = require('../../services/downloader/downloader.handler');

async function sendDownloaderMenu(client, message) {
  const jid = message?.key?.remoteJid;
  if (!jid) return false;

  const sections = [
    {
      title: 'DOWNLOADER COMMANDS (LENGKAP)',
      rows: [
        { id: '.download', title: '.download <link>', description: 'Unduh media dari tautan sosial media' },
        { id: '.play', title: '.play <judul/link>', description: 'Putar & unduh musik audio MP3' },
        { id: '.tiktok', title: '.tiktok <link>', description: 'Unduh video TikTok tanpa watermark' },
        { id: '.youtube', title: '.youtube <link>', description: 'Unduh video dari YouTube HD' },
        { id: '.instagram', title: '.instagram <link>', description: 'Unduh Reels / Post feed Instagram' },
        { id: '.facebook', title: '.facebook <link>', description: 'Unduh video Facebook' },
        { id: '.twitter', title: '.twitter <link>', description: 'Unduh video/gambar dari Twitter/X' },
        { id: '.threads', title: '.threads <link>', description: 'Unduh media Threads' },
        { id: '.pinterest', title: '.pinterest <link>', description: 'Unduh pin Pinterest' },
        { id: '.soundcloud', title: '.soundcloud <link>', description: 'Unduh audio SoundCloud' },
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

  try {
    await sendNativeFlow(client, jid, message, {
      title: 'DOWNLOADER CENTER',
      body: messages.downloader.usage,
      sections,
    });
    return true;
  } catch (flowErr) {
    console.warn('[DOWNLOADER] Native flow failed, fallback to text:', flowErr?.message || flowErr);
    await replyText(client, message, messages.downloader.usage);
    return true;
  }
}

module.exports = createCommand({
  name: 'download',
  aliases: ['dl', 'video'],
  description: 'Unduh video/media dari TikTok, IG, YouTube, Facebook, Twitter/X, Pinterest, dll.',
  execute: async (client, message, args = []) => {
    const url = args[0]?.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      await sendDownloaderMenu(client, message);
      return true;
    }

    return handlePlatformDownload(client, message, args, {
      platform: 'Media',
      command: 'download',
      example: 'https://...',
    });
  },
});
