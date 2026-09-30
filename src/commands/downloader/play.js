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

async function tryDownloadAudioForUrl(url, initialResult = null) {
  let result = initialResult;
  let audioBuffer = null;

  // Tier 0: youtubei.js for YouTube
  if (detectPlatform(url) === 'YouTube') {
    try {
      console.log(`[PLAY] Downloading audio via youtubei.js for: ${url}`);
      const { downloadYouTubeAudio } = require('../../services/downloader/youtubei.service');
      const ytResult = await downloadYouTubeAudio(url);
      if (ytResult?.buffer && ytResult.buffer.length > 0) {
        result = ytResult;
        audioBuffer = ytResult.buffer;
        console.log(`[PLAY] youtubei.js download successful (${(audioBuffer.length / 1024).toFixed(2)} KB)`);
      }
    } catch (ytError) {
      console.warn('[PLAY] youtubei.js failed, falling back to API 1:', ytError.message);
    }
  }

  if (!audioBuffer) {
    try {
      if (!result || (!result.audio && !result.video)) {
        result = await downloadMedia(url);
      }
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
      if (detectPlatform(url) === 'YouTube') {
        console.log('[PLAY] Switching to YouTube fallback (ytdl-core / Invidious / Cobalt)...');
        const { downloadWithYtdlCore } = require('../../services/downloader/ytdl.service');
        result = await downloadWithYtdlCore(url);
        if (result?.buffer) {
          audioBuffer = result.buffer;
        } else if (result?.audio?.url) {
          audioBuffer = await fetchAudioBuffer(result.audio.url);
        }
      } else {
        throw api1Error;
      }
    }
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Gagal mendapatkan buffer audio yang valid.');
  }

  return { result, audioBuffer };
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
    let preFetchedMedia = null;

    // 1. Resolve metadata & targetUrl
    if (!/^https?:\/\//i.test(input)) {
      // Tambahkan teks 'lagu' jika belum ada kata penanda musik agar pencarian lebih akurat
      let query = input;
      if (!/\b(lagu|song|music|audio|track|lirik|lyrics)\b/i.test(query)) {
        query = `${query} lagu`;
      }

      console.log(`[PLAY] Searching YouTube for query: "${query}" (Original: "${input}")`);
      await sendReaction(client, message, REACTIONS.SEARCHING);
      searchMeta = await searchYouTube(query);

      // Fallback: jika dengan 'lagu' tidak ketemu, coba query original
      if (!searchMeta?.url && query !== input) {
        console.log(`[PLAY] Retrying search with original query: "${input}"`);
        searchMeta = await searchYouTube(input);
      }

      if (!searchMeta?.url) {
        console.warn(`[PLAY] YouTube search found no results for: "${input}"`);
        await sendReaction(client, message, REACTIONS.FAILED);
        await replyText(client, message, messages.downloader.searchNotFound(input));
        return true;
      }

      console.log(`[PLAY] YouTube search found: "${searchMeta.title}" (${searchMeta.url})`);
      targetUrl = searchMeta.url;
    } else if (detectPlatform(input) === 'YouTube') {
      // Jika input adalah link YouTube langsung, ambil metadata judul & thumbnail asli
      try {
        const { getInnertube, extractVideoId } = require('../../services/downloader/youtubei.service');
        const videoId = extractVideoId(input);
        if (videoId) {
          const yt = await getInnertube();
          const info = await yt.getBasicInfo(videoId);
          const basic = info.basic_info || {};
          searchMeta = {
            url: input,
            title: basic.title || 'YouTube Audio',
            author: basic.author || 'YouTube',
            duration: basic.duration ? `${Math.floor(basic.duration / 60)}:${String(basic.duration % 60).padStart(2, '0')}` : '—',
            thumbnail: basic.thumbnail?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          };
        }
      } catch (metaErr) {
        console.warn('[PLAY] Failed to fetch basic metadata for YouTube link:', metaErr.message);
      }
    } else {
      // Link platform lain (Spotify, SoundCloud, dll): fetch metadata downloader terlebih dahulu agar cover/thumbnail asli didapatkan
      await sendReaction(client, message, REACTIONS.SEARCHING);
      try {
        console.log(`[PLAY] Pre-fetching metadata for audio URL: ${input}`);
        preFetchedMedia = await downloadMedia(input);
        if (preFetchedMedia) {
          searchMeta = {
            url: input,
            title: preFetchedMedia.title || `${detectPlatform(input)} Audio`,
            author: preFetchedMedia.author || detectPlatform(input),
            duration: preFetchedMedia.duration || '—',
            thumbnail: preFetchedMedia.thumbnail || null,
          };
        }
      } catch (preErr) {
        console.warn('[PLAY] Pre-fetch metadata warning:', preErr.message);
      }
    }

    // 2. Prepare metadata and send info card message with thumbnail
    const title = searchMeta?.title || (detectPlatform(targetUrl) !== 'Unknown' ? `${detectPlatform(targetUrl)} Audio Track` : input);
    const author = searchMeta?.author || '';
    const duration = searchMeta?.duration || '—';
    const source = searchMeta ? (detectPlatform(targetUrl) || 'YouTube') : detectPlatform(targetUrl);
    const thumbnail = searchMeta?.thumbnail || null;

    const caption = messages.downloader.playCaption({
      title,
      author,
      source,
      duration,
      quality: 'Audio MP3 / M4A',
    });

    console.log(`[PLAY] Sending info card message (Thumbnail: ${Boolean(thumbnail)})...`);
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

    // 3. Download media details and audio buffer with multi-candidate & multi-tier fallback
    try {
      const candidates = (searchMeta?.candidates && searchMeta.candidates.length > 0)
        ? searchMeta.candidates
        : [{ url: targetUrl, title, author, duration, thumbnail }];

      let downloaded = null;
      let lastDownloadError = null;

      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const isAlternate = i > 0;
        if (isAlternate) {
          console.log(`[PLAY] Trying alternate candidate #${i + 1}: "${candidate.title}" (${candidate.url})`);
        }

        try {
          downloaded = await tryDownloadAudioForUrl(
            candidate.url,
            isAlternate ? null : preFetchedMedia
          );
          if (downloaded?.audioBuffer) {
            if (isAlternate) {
              console.log(`[PLAY] Alternate candidate #${i + 1} succeeded: "${candidate.title}"`);
            }
            break;
          }
        } catch (candErr) {
          lastDownloadError = candErr;
          console.warn(`[PLAY] Candidate #${i + 1} (${candidate.url}) failed: ${candErr.message}. Trying next candidate...`);
        }
      }

      if (!downloaded?.audioBuffer) {
        throw lastDownloadError || new Error('Semua opsi tautan audio gagal diunduh.');
      }

      const result = downloaded.result;
      const audioBuffer = downloaded.audioBuffer;
      const finalTitle = result?.title || title;
      const cleanTitle = String(finalTitle).replace(/[^\w\s.-]/gi, '').trim() || 'audio';
      const durationSec = parseDurationToSeconds(duration !== '—' ? duration : result?.duration);

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
