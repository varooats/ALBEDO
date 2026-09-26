const { createCommand } = require('../../core/command.factory');
const { replyText, replyImage } = require('../../core/reply');
const { messages } = require('../../messages');
const {
  downloadMedia,
  detectAudioFormat,
  fetchAudioBuffer,
  MAX_AUDIO_SIZE_BYTES,
  detectPlatform,
} = require('../../services/downloader/tioo.service');
const { searchYouTube } = require('../../services/downloader/youtube.search');
const { sendTyping, sendReaction, REACTIONS } = require('../../utils/message');

function parseDurationToSeconds(duration) {
  if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
    return Math.round(duration);
  }
  const str = String(duration || '').trim();
  const parts = str.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return undefined;
}

module.exports = createCommand({
  name: 'play',
  aliases: ['music', 'song', 'audio', 'mp3', 'spotify'],
  description: 'Unduh atau putar musik berdasarkan judul lagu atau link.',
  execute: async (client, message, args = []) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    const input = args.join(' ').trim();
    if (!input) {
      await replyText(client, message, messages.downloader.playUsage);
      return true;
    }

    console.log(`[PLAY] User requested: "${input}" (JID: ${jid})`);
    await sendTyping(client, jid, 'composing');

    let targetUrl = input;
    let searchMeta = null;

    // 1. If input is not a direct URL, search on YouTube
    if (!/^https?:\/\//i.test(input)) {
      console.log(`[PLAY] Searching YouTube for query: "${input}"`);
      await sendReaction(client, message, REACTIONS.SEARCHING);
      searchMeta = await searchYouTube(input);

      if (!searchMeta?.url) {
        console.warn(`[PLAY] YouTube search found no results for: "${input}"`);
        await sendReaction(client, message, REACTIONS.FAILED);
        await replyText(client, message, messages.downloader.searchNotFound(input));
        return true;
      }

      console.log(`[PLAY] YouTube search found: "${searchMeta.title}" (${searchMeta.url})`);
      targetUrl = searchMeta.url;
    }

    // 2. Prepare metadata and immediately send info card message so user sees results while waiting
    const title = searchMeta?.title || input;
    const duration = searchMeta?.duration || '—';
    const source = searchMeta ? 'YouTube' : detectPlatform(targetUrl);
    const thumbnail = searchMeta?.thumbnail || null;

    const caption = messages.downloader.mediaCaption({
      title,
      source,
      duration,
      quality: 'Audio MP3',
    });

    console.log(`[PLAY] Sending info card message...`);
    let infoMessage = null;
    if (thumbnail) {
      infoMessage = await replyImage(client, message, thumbnail, caption).catch((err) => {
        console.warn('[PLAY] Failed to send thumbnail preview:', err.message);
        return null;
      });
    }

    if (!infoMessage || typeof infoMessage === 'boolean') {
      infoMessage = await replyText(client, message, caption).catch((err) => {
        console.warn('[PLAY] Failed to send info text message:', err.message);
        return null;
      });
    }

    // Determine the target message to quote (the sent info card or original message fallback)
    const quoteTarget = (infoMessage && typeof infoMessage === 'object' && infoMessage.key)
      ? infoMessage
      : message;

    console.log(`[PLAY] Info card sent (ID: ${quoteTarget?.key?.id}). Now downloading audio stream...`);
    await sendReaction(client, message, REACTIONS.PROCESSING);

    // 3. Download media details and audio buffer with multi-tier fallback
    try {
      let result = null;
      let audioBuffer = null;

      try {
        result = await downloadMedia(targetUrl);
        const audio = result.audio || result.video;
        if (!audio?.url) throw new Error('No audio URL in API 1 response');

        if (result.buffer) {
          audioBuffer = result.buffer;
        } else {
          console.log(`[PLAY] Downloading audio stream from API 1: ${audio.url}`);
          try {
            audioBuffer = await fetchAudioBuffer(audio.url);
          } catch (audioStreamErr) {
            console.warn(`[PLAY] Primary audio stream failed (${audioStreamErr.message}), trying video stream as audio fallback...`);
            if (result.video?.url && result.video.url !== audio.url) {
              console.log(`[PLAY] Trying video stream: ${result.video.url}`);
              audioBuffer = await fetchAudioBuffer(result.video.url);
            } else {
              throw audioStreamErr;
            }
          }
        }
      } catch (api1Error) {
        console.warn('[PLAY] API 1 failed:', api1Error.message);

        // Fallback to ytdl service if target is YouTube
        if (detectPlatform(targetUrl) === 'YouTube') {
          console.log('[PLAY] Switching to YouTube fallback (ytdl-core / alternative APIs)...');
          const { downloadWithYtdlCore } = require('../../services/downloader/ytdl.service');
          result = await downloadWithYtdlCore(targetUrl);
          if (result?.buffer) {
            audioBuffer = result.buffer;
          } else if (result?.audio?.url) {
            audioBuffer = await fetchAudioBuffer(result.audio.url);
          }
        } else {
          throw api1Error;
        }
      }

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Gagal mendapatkan buffer audio yang valid.');
      }

      const finalTitle = result.title || title;
      const cleanTitle = String(finalTitle).replace(/[^\w\s.-]/gi, '').trim() || 'audio';
      const durationSec = parseDurationToSeconds(duration !== '—' ? duration : result.duration);

      // Check max audio size limit (10 MB)
      if (audioBuffer.length > MAX_AUDIO_SIZE_BYTES) {
        console.warn(`[PLAY] Audio buffer size ${(audioBuffer.length / (1024 * 1024)).toFixed(2)} MB exceeds 10 MB limit.`);
        await sendReaction(client, message, REACTIONS.FAILED);
        const sizeMb = (audioBuffer.length / (1024 * 1024)).toFixed(1);
        const limitMsg = messages.downloader.sizeExceeded({
          title: finalTitle,
          type: 'Audio',
          sizeMb,
          maxMb: 10,
          downloadUrl: result?.audio?.url || targetUrl,
        });
        await replyText(client, quoteTarget, limitMsg);
        return true;
      }

      const { mime, ext } = detectAudioFormat(audioBuffer);
      console.log(`[PLAY] Audio verified: format=${mime} ext=${ext} size=${(audioBuffer.length / 1024).toFixed(2)} KB (Duration: ${durationSec}s)`);

      // 4. Send audio file quoting the info card message
      console.log(`[PLAY] Sending audio file quoting info message ${quoteTarget?.key?.id}...`);
      await client.sendMessage(
        jid,
        {
          audio: audioBuffer,
          mimetype: mime,
          ptt: false,
          ...(durationSec ? { seconds: durationSec } : {}),
          fileName: `${cleanTitle}.${ext}`,
        },
        { quoted: quoteTarget }
      );

      console.log('[PLAY] Audio sent successfully!');
      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    } catch (error) {
      console.error('[PLAY] Execution Error:', error.stack || error.message || error);
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, quoteTarget, messages.downloader.fetchFailed(error.message));
      return false;
    }
  },
});
