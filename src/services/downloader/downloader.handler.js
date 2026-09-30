const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
const { replyText, replyImage } = require('../../core/reply');
const { messages } = require('../../messages');
const { sendNativeFlow } = require('../../utils/interactive');
const { sendTyping, sendReaction, REACTIONS } = require('../../utils/message');
const {
  downloadMedia,
  checkUrlContentLength,
  MAX_VIDEO_SIZE_BYTES,
  MAX_AUDIO_SIZE_BYTES,
} = require('./tioo.service');

// Cache for multi-item media downloads
// key: string (cacheId), value: { meta, media, createdAt }
// ponytail: in-memory cache with 15m TTL sufficient for single-process bot; upgrade to persistent redis if multi-instance clustering added.
const downloadSessionCache = new Map();
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [key, session] of downloadSessionCache.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      downloadSessionCache.delete(key);
    }
  }
}

async function fetchBufferWithHeaders(url, maxTimeoutMs = 40000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), maxTimeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        Accept: '*/*',
        Referer: 'https://www.smdownloader.com/',
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } finally {
    clearTimeout(timer);
  }
}

async function sendMediaItem(client, jid, message, item, meta = {}) {
  const type = String(item.type || 'video').toLowerCase();
  const title = meta.title || 'Media Download';
  const platform = meta.source || meta.platform || 'Downloader';
  const duration = meta.duration || '—';
  const label = item.label || (type === 'video' ? 'HD' : 'MP3');

  // Handle youtubei direct stream download
  if (item.source === 'youtubei' && item.videoId) {
    if (type === 'audio') {
      const { downloadYouTubeAudio } = require('./youtubei.service');
      const res = await downloadYouTubeAudio(item.videoId);
      const buffer = res.buffer;
      if (buffer.length > MAX_AUDIO_SIZE_BYTES) {
        const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
        await replyText(
          client,
          message,
          messages.downloader.sizeExceeded({
            title,
            type: 'Audio',
            sizeMb,
            maxMb: 10,
            downloadUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
          })
        );
        return true;
      }
      const cleanTitle = String(title).replace(/[^\w\s.-]/gi, '').trim() || 'audio';
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
      return true;
    } else {
      const { downloadYouTubeVideo } = require('./youtubei.service');
      const res = await downloadYouTubeVideo(item.videoId, { quality: item.quality || '360p' });
      const buffer = res.buffer;
      if (buffer.length > MAX_VIDEO_SIZE_BYTES) {
        const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
        await replyText(
          client,
          message,
          messages.downloader.sizeExceeded({
            title,
            type: 'Video',
            sizeMb,
            maxMb: 35,
            downloadUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
          })
        );
        return true;
      }
      const caption = messages.downloader.mediaCaption({
        title,
        source: platform,
        duration,
        quality: label,
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
      return true;
    }
  }

  const mediaUrl = item?.url;
  if (!mediaUrl) {
    throw new Error('Tautan media tidak valid.');
  }

  // Check file size limits
  let sizeBytes = item.filesizeBytes || (await checkUrlContentLength(mediaUrl));

  if (type === 'video') {
    if (sizeBytes && sizeBytes > MAX_VIDEO_SIZE_BYTES) {
      const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
      const limitMsg = messages.downloader.sizeExceeded({
        title,
        type: 'Video',
        sizeMb,
        maxMb: 35,
        downloadUrl: mediaUrl,
      });

      if (item.thumbnail || meta.thumbnail) {
        await replyImage(client, message, item.thumbnail || meta.thumbnail, limitMsg);
      } else {
        await replyText(client, message, limitMsg);
      }
      return true;
    }

    const caption = messages.downloader.mediaCaption({
      title,
      source: platform,
      duration,
      quality: label,
    });

    try {
      await client.sendMessage(
        jid,
        {
          video: { url: mediaUrl },
          mimetype: 'video/mp4',
          caption,
        },
        { quoted: message }
      );
      return true;
    } catch (directErr) {
      console.warn('[DOWNLOADER] Direct video URL send failed, trying buffer fetch:', directErr.message);
      try {
        const buffer = await fetchBufferWithHeaders(mediaUrl);
        await client.sendMessage(
          jid,
          {
            video: buffer,
            mimetype: 'video/mp4',
            caption,
          },
          { quoted: message }
        );
        return true;
      } catch (bufErr) {
        console.warn('[DOWNLOADER] Video buffer send failed:', bufErr.message);
        if (item.thumbnail || meta.thumbnail) {
          await replyImage(client, message, item.thumbnail || meta.thumbnail, caption);
        } else {
          await replyText(client, message, caption);
        }
        return true;
      }
    }
  }

  if (type === 'audio') {
    if (sizeBytes && sizeBytes > MAX_AUDIO_SIZE_BYTES) {
      const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
      const limitMsg = messages.downloader.sizeExceeded({
        title,
        type: 'Audio',
        sizeMb,
        maxMb: 10,
        downloadUrl: mediaUrl,
      });
      await replyText(client, message, limitMsg);
      return true;
    }

    const cleanTitle = String(title).replace(/[^\w\s.-]/gi, '').trim() || 'audio';
    const isM4a = item.container === 'm4a' || mediaUrl.includes('.m4a');
    const mime = isM4a ? 'audio/mp4' : 'audio/mpeg';
    const ext = isM4a ? 'm4a' : 'mp3';

    try {
      await client.sendMessage(
        jid,
        {
          audio: { url: mediaUrl },
          mimetype: mime,
          ptt: false,
          fileName: item.filename || `${cleanTitle}.${ext}`,
        },
        { quoted: message }
      );
      return true;
    } catch (audioDirectErr) {
      console.warn('[DOWNLOADER] Direct audio URL send failed, trying buffer fetch:', audioDirectErr.message);
      const buffer = await fetchBufferWithHeaders(mediaUrl);
      await client.sendMessage(
        jid,
        {
          audio: buffer,
          mimetype: mime,
          ptt: false,
          fileName: item.filename || `${cleanTitle}.${ext}`,
        },
        { quoted: message }
      );
      return true;
    }
  }

  if (type === 'image') {
    const caption = [
      '╭─『 📥 GAMBAR UNDUHAN 』',
      '│',
      `│ ⟢ Judul  : *${title}*`,
      `│ ⟢ Sumber : *${platform}*`,
      item.label ? `│ ⟢ Opsi   : *${item.label}*` : null,
      '│',
      '╰──────────────────',
    ].filter(Boolean).join('\n');

    try {
      await client.sendMessage(
        jid,
        {
          image: { url: mediaUrl },
          caption,
        },
        { quoted: message }
      );
      return true;
    } catch (imgDirectErr) {
      console.warn('[DOWNLOADER] Direct image URL send failed, trying buffer fetch:', imgDirectErr.message);
      const buffer = await fetchBufferWithHeaders(mediaUrl);
      await client.sendMessage(
        jid,
        {
          image: buffer,
          caption,
        },
        { quoted: message }
      );
      return true;
    }
  }

  // Fallback generic send
  await replyText(client, message, `Media siap diunduh:\n${mediaUrl}`);
  return true;
}

async function sendMultiMediaOptions(client, jid, message, result) {
  cleanExpiredSessions();

  const cacheId = Math.random().toString(36).substring(2, 8);
  const media = result.media || [];
  const meta = {
    title: result.title || 'Media',
    author: result.author || '',
    platform: result.source || result.platform || 'Downloader',
    sourceUrl: result.sourceUrl || '',
    thumbnail: result.thumbnail,
    duration: result.duration || '—',
  };

  downloadSessionCache.set(cacheId, {
    id: cacheId,
    meta,
    media,
    createdAt: Date.now(),
  });

  const optionsList = media.map((item, idx) => {
    const icon = item.type === 'video' ? '🎬' : item.type === 'audio' ? '🎵' : '🖼️';
    const label = item.label || item.filename || `${(item.type || 'media').toUpperCase()} ${idx + 1}`;
    const size = item.filesizeBytes ? ` · ${(item.filesizeBytes / (1024 * 1024)).toFixed(1)}MB` : '';
    return `│ ${idx + 1}. ${icon} ${label}${size}`;
  });

  const body = [
    '╭─『 📥 PILIH MEDIA UNDUHAN 』',
    '│',
    `│ ⟢ Judul    : *${meta.title}*`,
    meta.author ? `│ ⟢ Pembuat  : *${meta.author}*` : null,
    `│ ⟢ Platform : *${meta.platform}*`,
    `│ ⟢ Total    : \`\`\`${media.length} opsi tersedia\`\`\``,
    '│',
    '│ ⚡ [ DAFTAR OPSI ]',
    ...optionsList,
    '│',
    '╰──────────────────',
    '> Buka menu daftar di bawah atau ketik:',
    `> \`\`\`.dlpick ${cacheId} <nomor>\`\`\``,
  ].filter(Boolean).join('\n');

  // Build single_select section rows (Sections list murni tanpa button)
  const rows = media.map((item, idx) => ({
    id: `dl_pick:${cacheId}:${idx}`,
    title: `${idx + 1}. ${(item.label || item.filename || `${item.type} ${idx + 1}`).slice(0, 24)}`,
    description: `${(item.type || 'media').toUpperCase()}${item.container ? ` · ${item.container.toUpperCase()}` : ''}${
      item.filesizeBytes ? ` · ${(item.filesizeBytes / (1024 * 1024)).toFixed(1)}MB` : ''
    }`,
  }));

  const sections = [
    {
      title: 'PILIH FORMAT & KUALITAS UNDUHAN',
      rows,
    },
  ];

  // Prepare header thumbnail if available
  let headerMedia = null;
  if (meta.thumbnail && typeof client?.waUploadToServer === 'function') {
    try {
      const prepared = await prepareWAMessageMedia(
        { image: { url: meta.thumbnail } },
        { upload: client.waUploadToServer }
      );
      if (prepared?.imageMessage) {
        headerMedia = { imageMessage: prepared.imageMessage };
      }
    } catch (thumbErr) {
      console.warn('[DOWNLOADER] Failed to prepare header thumbnail:', thumbErr.message);
    }
  }

  try {
    await sendNativeFlow(client, jid, message, {
      title: meta.platform || 'DOWNLOADER',
      body,
      sections,
      buttons: [],
      headerMedia,
    });
    return true;
  } catch (flowErr) {
    console.warn('[DOWNLOADER] sendNativeFlow failed, fallback to image/text:', flowErr.message);
    if (meta.thumbnail) {
      await replyImage(client, message, meta.thumbnail, body);
    } else {
      await replyText(client, message, body);
    }
    return true;
  }
}

async function handleDownloadSelection(client, message, cacheId, index) {
  cleanExpiredSessions();

  const jid = message?.key?.remoteJid;
  if (!jid) return false;

  const session = downloadSessionCache.get(cacheId);
  if (!session) {
    await replyText(
      client,
      message,
      '⚠️ *SESI KEDALUWARSA*\n\nPilihan media telah kedaluwarsa. Silakan kirimkan tautan kembali untuk mengunduh.'
    );
    return true;
  }

  const idx = parseInt(index, 10);
  if (isNaN(idx) || idx < 0 || idx >= session.media.length) {
    await replyText(
      client,
      message,
      `⚠️ Pilihan tidak valid. Silakan pilih nomor antara 1 dan ${session.media.length}.`
    );
    return true;
  }

  const selectedItem = session.media[idx];
  await sendTyping(client, jid, 'composing');
  await sendReaction(client, message, REACTIONS.PROCESSING);

  try {
    await sendMediaItem(client, jid, message, selectedItem, session.meta);
    await sendReaction(client, message, REACTIONS.SUCCESS);
    return true;
  } catch (err) {
    console.error('[DOWNLOADER] Error sending selected media:', err);
    await sendReaction(client, message, REACTIONS.FAILED);
    await replyText(client, message, messages.downloader.fetchFailed());
    return false;
  } finally {
    await sendTyping(client, jid, 'paused');
  }
}

async function handlePlatformDownload(client, message, args = [], options = {}) {
  const jid = message?.key?.remoteJid;
  if (!jid) return false;

  const platformName = options.platform || 'Media';
  const exampleUrl = options.example || 'https://...';
  const url = args[0]?.trim();

  if (!url || !/^https?:\/\//i.test(url)) {
    const cmdName = options.command || platformName.toLowerCase().replace(/[^a-z0-9]/g, '');
    await replyText(
      client,
      message,
      `Format: \`\`\`.${cmdName} <link>\`\`\`\nContoh: \`\`\`.${cmdName} ${exampleUrl}\`\`\``
    );
    return true;
  }

  await sendTyping(client, jid, 'composing');
  await sendReaction(client, message, REACTIONS.PROCESSING);

  // 1. YouTube: Selalu tampilkan opsi kualitas & format via youtubei.js
  if (platformName === 'YouTube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    try {
      const { getYouTubeMediaOptions } = require('./youtubei.service');
      const ytOptions = await getYouTubeMediaOptions(url);
      if (ytOptions?.media?.length > 0) {
        await sendMultiMediaOptions(client, jid, message, ytOptions);
        await sendReaction(client, message, REACTIONS.SUCCESS);
        return true;
      }
    } catch (ytErr) {
      console.warn('[DOWNLOADER] youtubei options failed, fallback to standard downloadMedia:', ytErr.message);
    }
  }

  try {
    const result = await downloadMedia(url);
    const media = result.media || [];

    if (media.length === 0) {
      await sendReaction(client, message, REACTIONS.FAILED);
      await replyText(client, message, messages.downloader.notFound);
      return true;
    }

    // Jika hanya ada 1 video, tambahkan opsi audio agar user bisa memilih tipe file
    if (media.length === 1 && media[0].type === 'video') {
      media.push({
        type: 'audio',
        role: 'audio',
        url: media[0].url,
        label: 'Audio (MP3 Audio Track)',
        container: 'mp3',
        thumbnail: result.thumbnail,
      });
    }

    // Tampilkan opsi pilihan kualitas dan tipe file
    if (media.length > 1) {
      await sendMultiMediaOptions(client, jid, message, result);
      await sendReaction(client, message, REACTIONS.SUCCESS);
      return true;
    }

    await sendMediaItem(client, jid, message, media[0], {
      title: result.title,
      source: result.source || platformName,
      duration: result.duration,
      thumbnail: result.thumbnail,
    });
    await sendReaction(client, message, REACTIONS.SUCCESS);
    return true;
  } catch (error) {
    console.error(`[DOWNLOADER] [${platformName}] Error:`, error.message || error);
    await sendReaction(client, message, REACTIONS.FAILED);
    await replyText(client, message, messages.downloader.fetchFailed());
    return false;
  } finally {
    await sendTyping(client, jid, 'paused');
  }
}

module.exports = {
  downloadSessionCache,
  sendMediaItem,
  sendMultiMediaOptions,
  handleDownloadSelection,
  handlePlatformDownload,
};
