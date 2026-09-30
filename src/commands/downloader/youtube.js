const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const { messages } = require('../../messages');
const {
  handlePlatformDownload,
  sendMultiMediaOptions,
} = require('../../services/downloader/downloader.handler');
const {
  downloadYouTubeVideo,
  downloadYouTubeAudio,
  getYouTubeMediaOptions,
  extractVideoId,
} = require('../../services/downloader/youtubei.service');
const { sendTyping, sendReaction, REACTIONS } = require('../../utils/message');
const {
  MAX_VIDEO_SIZE_BYTES,
  MAX_AUDIO_SIZE_BYTES,
} = require('../../services/downloader/tioo.service');

module.exports = createCommand({
  name: 'youtube',
  aliases: ['yt', 'ytdl', 'youtubedl', 'shorts'],
  description: 'Unduh video atau audio dari YouTube dengan pilihan kualitas.',
  execute: async (client, message, args = []) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    const rawInput = args.join(' ').trim();
    if (!rawInput) {
      await replyText(
        client,
        message,
        'Format: ```.yt <link youtube>```\nContoh: ```.yt https://youtube.com/watch?v=...```\nUntuk langsung unduh audio: ```.yt <link> --audio```'
      );
      return true;
    }

    const isAudioOnly = args.some((a) => ['--audio', '-a', '--mp3', '-mp3'].includes(a.toLowerCase()));
    const explicitQuality = args.find((a) => ['--720p', '--480p', '--360p'].includes(a.toLowerCase()))?.replace('--', '');
    const targetUrl = args.find((a) => !a.startsWith('-')) || rawInput;

    const videoId = extractVideoId(targetUrl);
    if (!videoId && !/^https?:\/\//i.test(targetUrl)) {
      await replyText(
        client,
        message,
        'Tautan YouTube tidak valid. Silakan berikan URL video YouTube atau Shorts.'
      );
      return true;
    }

    await sendTyping(client, jid, 'composing');
    await sendReaction(client, message, REACTIONS.PROCESSING);

    // 1. Jika user secara eksplisit memberikan flag audio (--audio / --mp3)
    if (isAudioOnly) {
      try {
        console.log(`[YOUTUBE] Direct audio requested via flag for: ${targetUrl}`);
        const result = await downloadYouTubeAudio(targetUrl);
        const buffer = result.buffer;

        if (buffer.length > MAX_AUDIO_SIZE_BYTES) {
          const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
          await sendReaction(client, message, REACTIONS.FAILED);
          await replyText(
            client,
            message,
            messages.downloader.sizeExceeded({
              title: result.title,
              type: 'Audio',
              sizeMb,
              maxMb: 10,
              downloadUrl: `https://www.youtube.com/watch?v=${result.videoId}`,
            })
          );
          return true;
        }

        const cleanTitle = String(result.title).replace(/[^\w\s.-]/gi, '').trim() || 'audio';
        await client.sendMessage(
          jid,
          {
            audio: buffer,
            mimetype: 'audio/mp4',
            ptt: false,
            fileName: `${cleanTitle}.m4a`,
          },
          { quoted: message }
        );

        await sendReaction(client, message, REACTIONS.SUCCESS);
        return true;
      } catch (err) {
        console.warn('[YOUTUBE] Direct audio download failed, fallback to options:', err.message);
      }
    }

    // 2. Jika user secara eksplisit memberikan flag kualitas video (--720p, --480p, --360p)
    if (explicitQuality) {
      try {
        console.log(`[YOUTUBE] Direct video requested (${explicitQuality}) for: ${targetUrl}`);
        const result = await downloadYouTubeVideo(targetUrl, { quality: explicitQuality });
        const buffer = result.buffer;

        if (buffer.length > MAX_VIDEO_SIZE_BYTES) {
          const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
          await sendReaction(client, message, REACTIONS.FAILED);
          await replyText(
            client,
            message,
            messages.downloader.sizeExceeded({
              title: result.title,
              type: 'Video',
              sizeMb,
              maxMb: 35,
              downloadUrl: `https://www.youtube.com/watch?v=${result.videoId}`,
            })
          );
          return true;
        }

        const caption = messages.downloader.mediaCaption({
          title: result.title,
          source: 'YouTube',
          duration: result.duration,
          quality: `${explicitQuality} (youtubei.js)`,
        });

        await client.sendMessage(
          jid,
          {
            video: buffer,
            mimetype: 'video/mp4',
            caption,
          },
          { quoted: message }
        );

        await sendReaction(client, message, REACTIONS.SUCCESS);
        return true;
      } catch (err) {
        console.warn('[YOUTUBE] Direct quality download failed, fallback to options:', err.message);
      }
    }

    // 3. Default: Tampilkan pilihan kualitas dan tipe file (Video 720p, 480p, 360p, Audio MP3)
    try {
      const optionsResult = await getYouTubeMediaOptions(targetUrl);
      if (optionsResult?.media?.length > 0) {
        await sendMultiMediaOptions(client, jid, message, optionsResult);
        await sendReaction(client, message, REACTIONS.SUCCESS);
        return true;
      }
    } catch (ytErr) {
      console.warn('[YOUTUBE] getYouTubeMediaOptions failed, fallback to multi-tier handler:', ytErr.message);
    }

    // 4. Fallback ke multi-tier platform handler
    return handlePlatformDownload(client, message, args, {
      platform: 'YouTube',
      command: 'youtube',
      example: 'https://youtube.com/watch?v=... atau https://youtube.com/shorts/...',
    });
  },
});
