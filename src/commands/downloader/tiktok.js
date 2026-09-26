const { createCommand } = require('../../core/command.factory');
const { replyText, replyImage } = require('../../core/reply');
const { messages } = require('../../messages');
const {
  downloadMedia,
  checkUrlContentLength,
  MAX_VIDEO_SIZE_BYTES,
} = require('../../services/downloader/tioo.service');
const { sendTyping, sendReaction, REACTIONS } = require('../../utils/message');

module.exports = createCommand({
  name: 'tiktok',
  aliases: ['tt', 'ttdl', 'tiktokdl'],
  description: 'Unduh video TikTok tanpa watermark.',
  execute: async (client, message, args = []) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    const url = args[0]?.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      await replyText(
        client,
        message,
        'Format: ```.tiktok <link tiktok>```\nContoh: ```.tiktok https://vt.tiktok.com/...```'
      );
      return true;
    }

    await sendTyping(client, jid, 'composing');
    await sendReaction(client, message, REACTIONS.PROCESSING);

    try {
      const result = await downloadMedia(url);
      const video = result.video;

      if (!video?.url) {
        await sendReaction(client, message, REACTIONS.FAILED);
        await replyText(client, message, messages.downloader.notFound);
        return true;
      }

      // Check max video size limit (35 MB)
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

      const caption = messages.downloader.mediaCaption({
        title: result.title,
        source: 'TikTok',
        duration: result.duration,
        quality: video?.quality || 'HD',
      });

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
      } catch (sendErr) {
        if (result.thumbnail) {
          await replyImage(client, message, result.thumbnail, caption);
        } else {
          await replyText(client, message, caption);
        }
        await sendReaction(client, message, REACTIONS.SUCCESS);
        return true;
      }
    } catch (error) {
      console.error('[TIKTOK] Error:', error.message || error);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, messages.downloader.fetchFailed(error.message));
      return false;
    }
  },
});
