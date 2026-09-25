const MAX_VIDEO_SIZE_BYTES = 35 * 1024 * 1024; // 35 MB
const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const BASE_URL = 'https://backend1.tioo.eu.org/api/downloader';

function cleanMediaUrl(inputUrl = '') {
  let url = String(inputUrl || '').trim();
  try {
    const u = new URL(url);
    // For Instagram: strip all query parameters like ?stkn=..., ?igsh=...
    if (u.hostname.includes('instagram.com')) {
      return `${u.origin}${u.pathname}`;
    }
    // For TikTok: clean tracking params
    if (u.hostname.includes('tiktok.com') && !u.hostname.includes('vt.tiktok.com')) {
      u.searchParams.delete('is_from_webapp');
      u.searchParams.delete('sender_device');
      u.searchParams.delete('_r');
      return u.toString();
    }
    // For YouTube: keep only ?v=
    if (u.hostname.includes('youtube.com') && u.searchParams.has('v')) {
      return `https://www.youtube.com/watch?v=${u.searchParams.get('v')}`;
    }
    // For Spotify: strip ?si=...
    if (u.hostname.includes('spotify.com')) {
      return `${u.origin}${u.pathname}`;
    }
  } catch (e) {}
  return url;
}

function detectPlatform(url = '') {
  const lowered = String(url || '').toLowerCase();
  if (lowered.includes('youtube.com') || lowered.includes('youtu.be')) return 'YouTube';
  if (lowered.includes('tiktok.com')) return 'TikTok';
  if (lowered.includes('douyin.com')) return 'Douyin';
  if (lowered.includes('instagram.com')) return 'Instagram';
  if (lowered.includes('spotify.com')) return 'Spotify';
  if (lowered.includes('pinterest.') || lowered.includes('pin.it')) return 'Pinterest';
  if (lowered.includes('twitter.com') || lowered.includes('x.com')) return 'Twitter/X';
  if (lowered.includes('facebook.com') || lowered.includes('fb.watch') || lowered.includes('fb.com')) return 'Facebook';
  if (lowered.includes('reddit.com')) return 'Reddit';
  if (lowered.includes('t.me') || lowered.includes('telegram.')) return 'Telegram';
  if (lowered.includes('twitch.tv')) return 'Twitch';
  if (lowered.includes('snapchat.com')) return 'Snapchat';
  if (lowered.includes('threads.net')) return 'Threads';
  if (lowered.includes('music.apple.com')) return 'Apple Music';
  if (lowered.includes('imgur.com')) return 'Imgur';
  if (lowered.includes('linkedin.com')) return 'LinkedIn';
  if (lowered.includes('xiaohongshu.com') || lowered.includes('xhslink.com')) return 'Xiaohongshu';
  if (lowered.includes('weibo.com') || lowered.includes('weibo.cn')) return 'Weibo';
  if (lowered.includes('soundcloud.com')) return 'SoundCloud';
  return 'Web';
}

function resolveEndpoints(url = '') {
  const lowered = String(url).toLowerCase();
  if (lowered.includes('youtube.com') || lowered.includes('youtu.be')) {
    return ['youtube'];
  }
  if (lowered.includes('tiktok.com') || lowered.includes('douyin.com')) {
    return ['ttdl', 'tiktok'];
  }
  if (lowered.includes('spotify.com')) {
    return ['spotify'];
  }
  if (lowered.includes('instagram.com')) {
    return ['igdl'];
  }
  if (lowered.includes('facebook.com') || lowered.includes('fb.watch') || lowered.includes('fb.com')) {
    return ['fbdl', 'facebook'];
  }
  if (lowered.includes('pin.it') || lowered.includes('pinterest.')) {
    return ['pindl', 'pinterest'];
  }
  if (lowered.includes('twitter.com') || lowered.includes('x.com')) {
    return ['twitter', 'xdl'];
  }
  return ['youtube', 'ttdl', 'igdl'];
}

async function checkUrlContentLength(mediaUrl) {
  if (!mediaUrl) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(mediaUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const len = res.headers.get('content-length');
    if (len) {
      const parsed = parseInt(len, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (err) {}
  return null;
}

function detectAudioFormat(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return { mime: 'audio/mpeg', ext: 'mp3' };
  }

  // ID3 tag (MP3)
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return { mime: 'audio/mpeg', ext: 'mp3' };
  }

  // MPEG audio sync word (MP3 raw frames 0xFF 0xFB, 0xFF 0xF3, etc.)
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return { mime: 'audio/mpeg', ext: 'mp3' };
  }

  // MP4 / M4A (ISO base media ftyp box)
  if (buffer.subarray(4, 8).toString() === 'ftyp') {
    return { mime: 'audio/mp4', ext: 'm4a' };
  }

  // Ogg audio container (OggS)
  if (buffer.subarray(0, 4).toString() === 'OggS') {
    return { mime: 'audio/ogg', ext: 'ogg' };
  }

  // WAV audio (RIFF ... WAVE)
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WAVE') {
    return { mime: 'audio/wav', ext: 'wav' };
  }

  return { mime: 'audio/mpeg', ext: 'mp3' };
}

function isValidAudioBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 15000) {
    return false;
  }
  // Reject if buffer starts with JSON or HTML text
  if (buffer[0] === 0x7b || buffer[0] === 0x3c) { // '{' or '<'
    return false;
  }
  // Check magic bytes
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true; // ID3 (MP3)
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return true; // MP3 frame sync
  if (buffer.subarray(4, 8).toString() === 'ftyp') return true; // M4A / MP4
  if (buffer.subarray(0, 4).toString() === 'OggS') return true; // OGG
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WAVE') return true; // WAV
  return true;
}

async function fetchAudioBuffer(initialAudioUrl, maxPollAttempts = 4) {
  let currentUrl = initialAudioUrl;

  const headerStrategies = [
    // 1. Clean browser headers with NO referer (prevents 403 hotlinking block)
    () => ({
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': '*/*',
    }),
    // 2. Same-origin Referer
    () => {
      try {
        const u = new URL(currentUrl);
        return {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Referer': `${u.protocol}//${u.host}/`,
          'Origin': `${u.protocol}//${u.host}`,
        };
      } catch {
        return null;
      }
    },
    // 3. Backend Referer
    () => ({
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Referer': 'https://backend1.tioo.eu.org/',
    }),
  ];

  for (let attempt = 1; attempt <= maxPollAttempts; attempt++) {
    console.log(`[DOWNLOADER] [Audio Stream] Fetching from: ${currentUrl} (Attempt ${attempt}/${maxPollAttempts})`);

    let lastError = null;

    for (let sIdx = 0; sIdx < headerStrategies.length; sIdx++) {
      const getHeaders = headerStrategies[sIdx];
      const headers = getHeaders();
      if (!headers) continue;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 35000);

      try {
        const res = await fetch(currentUrl, {
          headers,
          signal: controller.signal,
        });

        console.log(`[DOWNLOADER] [Audio Stream Strategy #${sIdx + 1}] Status: ${res.status} ${res.statusText}`);

        if (res.status === 403) {
          console.warn(`[DOWNLOADER] Got 403 with header strategy #${sIdx + 1}, trying next strategy...`);
          lastError = new Error('HTTP 403 Forbidden');
          continue;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const contentType = res.headers.get('content-type') || '';
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[DOWNLOADER] [Audio Buffer] Loaded ${(buffer.length / 1024).toFixed(2)} KB (Content-Type: ${contentType})`);

        // Check if server returned a JSON response (like ymcdn polling / progress API)
        if (contentType.includes('application/json') || buffer[0] === 0x7b) {
          try {
            const json = JSON.parse(buffer.toString('utf8'));
            console.log('[DOWNLOADER] Audio endpoint returned JSON:', json);

            const realUrl = json.url || json.download_url || json.link || json.download;
            if (realUrl && typeof realUrl === 'string' && realUrl !== currentUrl) {
              console.log(`[DOWNLOADER] Following resolved audio download URL: ${realUrl}`);
              currentUrl = realUrl;
              break;
            }

            if (json.status === 'processing' || json.status === 'in_progress' || json.progress) {
              console.log('[DOWNLOADER] Audio conversion in progress, waiting 2.5s...');
              await new Promise((r) => setTimeout(r, 2500));
              break;
            }
          } catch (parseErr) {
            console.warn('[DOWNLOADER] JSON parse error in audio stream:', parseErr.message);
          }
          throw new Error('Server mengembalikan response JSON bukan stream audio.');
        }

        // Check if buffer is an HTML error page
        if (buffer[0] === 0x3c) { // '<'
          const head = buffer.subarray(0, 100).toString('utf8').toLowerCase();
          if (head.startsWith('<!doctype') || head.startsWith('<html')) {
            console.error('[DOWNLOADER] [Audio Error]: Endpoint returned HTML page instead of audio bytes.');
            throw new Error('Tautan audio kedaluwarsa atau server memblokir akses.');
          }
        }

        if (!isValidAudioBuffer(buffer)) {
          console.warn(`[DOWNLOADER] Invalid audio buffer format or size (${buffer.length} bytes).`);
          throw new Error('File yang diunduh bukan format audio yang valid.');
        }

        return buffer;
      } catch (err) {
        lastError = err;
      } finally {
        clearTimeout(timeout);
      }
    }

    if (lastError && attempt === maxPollAttempts) {
      throw lastError;
    }
  }

  throw new Error('Waktu tunggu konversi audio habis.');
}

function normalizeTiooResponse(data, originalUrl) {
  if (!data) return null;

  // 1. Extract video URL
  let videoUrl = null;
  if (typeof data.mp4 === 'string' && data.mp4) {
    videoUrl = data.mp4;
  } else if (Array.isArray(data.video) && data.video[0]) {
    videoUrl = data.video[0];
  } else if (typeof data.video === 'string' && data.video) {
    videoUrl = data.video;
  } else if (Array.isArray(data.url) && data.url[0]) {
    videoUrl = data.url[0];
  } else if (typeof data.url === 'string' && data.url && !data.url.endsWith('.mp3')) {
    videoUrl = data.url;
  } else if (Array.isArray(data.media) && data.media[0]?.url) {
    videoUrl = data.media[0].url;
  }

  // 2. Extract audio URL
  let audioUrl = null;
  if (typeof data.mp3 === 'string' && data.mp3) {
    audioUrl = data.mp3;
  } else if (Array.isArray(data.audio) && data.audio[0]) {
    audioUrl = data.audio[0];
  } else if (typeof data.audio === 'string' && data.audio) {
    audioUrl = data.audio;
  } else if (typeof data.download === 'string' && data.download) {
    audioUrl = data.download;
  } else if (typeof data.url === 'string' && data.url && (data.url.includes('.mp3') || data.url.includes('audio'))) {
    audioUrl = data.url;
  }

  // If only video available, it can also serve as audio stream
  if (!audioUrl && videoUrl) {
    audioUrl = videoUrl;
  }

  // 3. Extract thumbnail
  const thumbnail =
    data.thumbnail ||
    data.thumb ||
    data.picture ||
    data.cover ||
    data.image ||
    null;

  // 4. Extract title
  const title =
    data.title ||
    data.title_audio ||
    data.name ||
    data.author ||
    data.creator ||
    'Media Download';

  const source = detectPlatform(originalUrl);

  return {
    title,
    duration: data.duration || '—',
    source,
    thumbnail,
    video: videoUrl ? { url: videoUrl, quality: 'HD', extension: 'mp4' } : null,
    audio: audioUrl ? { url: audioUrl, quality: 'MP3', extension: 'mp3' } : null,
    raw: data,
  };
}

async function fetchFromTioo(endpoint, targetUrl) {
  const apiUrl = `${BASE_URL}/${endpoint}?url=${encodeURIComponent(targetUrl)}`;
  const controller = new AbortController();
  // 50 seconds timeout to prevent premature abort
  const timeout = setTimeout(() => controller.abort(), 50000);

  console.log(`[DOWNLOADER] [API Request] ${apiUrl}`);

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      },
      signal: controller.signal,
    });

    console.log(`[DOWNLOADER] [API Response] Status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`[DOWNLOADER] [API Response Error Body]:`, errBody.slice(0, 300));
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log(`[DOWNLOADER] [API Payload]:`, JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error(`[DOWNLOADER] [API Error] Endpoint ${endpoint}:`, err.message);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function fallbackInstagram(url) {
  const enc = encodeURIComponent(url);
  const apis = [
    { name: 'siputzx', url: `https://api.siputzx.my.id/api/d/igdl?url=${enc}` },
    { name: 'ryzendesu', url: `https://api.ryzendesu.vip/api/downloader/igdl?url=${enc}` },
    { name: 'widipe', url: `https://widipe.com/download/ig?url=${enc}` },
  ];

  for (const api of apis) {
    try {
      console.log(`[INSTAGRAM-FALLBACK] Trying: ${api.url}`);
      const res = await fetch(api.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(20000),
      });

      console.log(`[INSTAGRAM-FALLBACK] [${api.name}] Status: ${res.status}`);
      if (!res.ok) continue;

      const data = await res.json();
      console.log(`[INSTAGRAM-FALLBACK] [${api.name}] Payload:`, JSON.stringify(data, null, 2).slice(0, 300));

      let videoUrl = null;
      if (Array.isArray(data.data)) {
        videoUrl = data.data[0]?.url || data.data[0];
      } else if (Array.isArray(data.result)) {
        videoUrl = data.result[0]?.url || data.result[0]?.video || data.result[0];
      } else if (data.data?.url) {
        videoUrl = data.data.url;
      } else if (data.result?.url) {
        videoUrl = data.result.url;
      } else if (data.url) {
        videoUrl = data.url;
      }

      if (videoUrl && typeof videoUrl === 'string' && /^https?:\/\//i.test(videoUrl)) {
        console.log(`[INSTAGRAM-FALLBACK] [${api.name}] Found video stream: ${videoUrl}`);
        return {
          title: data.title || 'Instagram Reel',
          source: 'Instagram',
          duration: '—',
          thumbnail: data.thumbnail || data.result?.[0]?.thumbnail || null,
          video: { url: videoUrl, quality: 'HD', extension: 'mp4' },
          raw: data,
        };
      }
    } catch (e) {
      console.warn(`[INSTAGRAM-FALLBACK] API ${api.name} error:`, e.message);
    }
  }

  return null;
}

async function downloadMedia(targetUrl, options = {}) {
  const rawUrl = String(targetUrl || '').trim();
  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    throw new Error('URL tidak valid.');
  }

  // Clean tracking query parameters
  const url = cleanMediaUrl(rawUrl);
  const platform = detectPlatform(url);
  console.log(`[DOWNLOADER] Processing URL: ${url} (Platform: ${platform})`);

  const endpoints = resolveEndpoints(url);
  let lastError = null;

  for (const ep of endpoints) {
    try {
      console.log(`[DOWNLOADER] Trying endpoint: ${ep}`);
      const rawData = await fetchFromTioo(ep, url);
      if (rawData && (rawData.status === true || rawData.mp4 || rawData.mp3 || rawData.video || rawData.audio || rawData.url)) {
        const normalized = normalizeTiooResponse(rawData, url);
        if (normalized && (normalized.video || normalized.audio)) {
          console.log(`[DOWNLOADER] Successfully parsed media: "${normalized.title}" (Video: ${Boolean(normalized.video)}, Audio: ${Boolean(normalized.audio)})`);
          return normalized;
        }
      }
      if (rawData?.error || rawData?.message) {
        lastError = new Error(rawData.error || rawData.message);
      }
    } catch (err) {
      lastError = err;
    }
  }

  // 1. Fallback for Instagram if API 1 fails
  if (platform === 'Instagram') {
    console.log('[DOWNLOADER] API 1 failed for Instagram. Trying Instagram fallback APIs...');
    const igResult = await fallbackInstagram(url);
    if (igResult) return igResult;
  }

  // 2. Fallback for YouTube if API 1 fails
  if (platform === 'YouTube') {
    console.log('[DOWNLOADER] API 1 failed for YouTube. Switching to fallback ytdl service...');
    try {
      const { downloadWithYtdlCore } = require('./ytdl.service');
      const ytdlResult = await downloadWithYtdlCore(url);
      if (ytdlResult) return ytdlResult;
    } catch (ytdlErr) {
      console.warn('[DOWNLOADER] ytdl fallback failed:', ytdlErr.message);
      lastError = ytdlErr;
    }
  }

  console.error(`[DOWNLOADER] All endpoints and fallbacks failed for URL: ${url}`);
  throw new Error(lastError?.message || 'Gagal mengambil data media dari server downloader.');
}

module.exports = {
  MAX_VIDEO_SIZE_BYTES,
  MAX_AUDIO_SIZE_BYTES,
  detectPlatform,
  cleanMediaUrl,
  checkUrlContentLength,
  detectAudioFormat,
  isValidAudioBuffer,
  fetchAudioBuffer,
  downloadMedia,
  fetchFromTioo,
  fallbackInstagram,
};
