const { createCommand } = require('../../core/command.factory');
const { replyText, replyImage } = require('../../core/reply');
const { messages } = require('../../messages');
const { sendNativeFlow } = require('../../utils/interactive');
const { getMainMenuSection, getFiturBotSection } = require('../../features/menu/menu.builder');
const {
  downloadMedia,
  checkUrlContentLength,
  MAX_VIDEO_SIZE_BYTES,
} = require('../../services/downloader/tioo.service');
const { sendTyping, sendReaction, REACTIONS } = require('../../utils/message.utils');

async function sendDownloaderMenu(client, message) {
  const jid = message?.key?.remoteJid;
  if (!jid) return false;

  const sections = [
    {
      title: 'DOWNLOADER COMMANDS (LENGKAP)',
      rows: [
        { id: '.download', title: '.download <link>', description: 'Unduh video dari tautan media sosial' },
        { id: '.play', title: '.play <judul/link>', description: 'Putar & unduh musik audio MP3' },
        { id: '.tiktok', title: '.tiktok <link>', description: 'Unduh video TikTok tanpa watermark' },
        { id: '.youtube', title: '.youtube <link>', description: 'Unduh video dari YouTube HD' },
        { id: '.instagram', title: '.instagram <link>', description: 'Unduh Reels / Post feed Instagram' },
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
  aliases: ['dl', 'video', 'pinterest', 'pin'],
  description: 'Unduh video dari TikTok, IG, YouTube, Pinterest, dll.',
  execute: async (client, message, args = []) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    const url = args[0]?.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      await sendDownloaderMenu(client, message);
      return true;
    }

    await sendTyping(client, jid, 'composing');
    await sendReaction(client, message, REACTIONS.PROCESSING);

    try {
      const result = await downloadMedia(url);
      const video = result.video;
      const audio = result.audio;

      if (!video?.url && !audio?.url) {
        await sendReaction(client, message, REACTIONS.FAILED);
        await replyText(client, message, messages.downloader.notFound);
        return true;
      }

      // Check max video size limit (35 MB)
      if (video?.url) {
        const sizeBytes = await checkUrlContentLength(video.url);
        if (sizeBytes && sizeBytes > MAX_VIDEO_SIZE_BYTES) {
          await sendReaction(client, message, REACTIONS.FAILED);
          const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
          const limitMsg = messages.downloader.sizeExceeded({
            title: result.title,
            type: 'Video',
            sizeMb,
            maxMb: 35,
            downloadUrl: video.url,
          });

          if (result.thumbnail) {
            await replyImage(client, message, result.thumbnail, limitMsg);
          } else {
            await replyText(client, message, limitMsg);
          }
          return true;
        }
      }

      const caption = messages.downloader.mediaCaption({
        title: result.title,
        source: result.source,
        duration: result.duration,
        quality: video?.quality || video?.label || 'Best',
      });

      // Send video if available
      if (video?.url) {
        try {
          await client.sendMessage(
            jid,
            {
              video: { url: video.url },
              mimetype: 'video/mp4',
              caption,
            },
            { quoted: message }
          );
          await sendReaction(client, message, REACTIONS.SUCCESS);
          return true;
        } catch (videoSendErr) {
          console.warn('[DOWNLOADER] Direct video send failed:', videoSendErr.message);
        }
      }

      // Fallback: send thumbnail with caption
      if (result.thumbnail) {
        await replyImage(client, message, result.thumbnail, caption);
      } else {
        await replyText(client, message, caption);
      }

      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (error) {
      console.error('[DOWNLOADER] Error:', error.message || error);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, messages.downloader.fetchFailed());
      return false;
    }
  },
});
