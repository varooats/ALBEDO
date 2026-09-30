const BASE_URL = 'https://www.smdownloader.com';
const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';

// ponytail: in-memory session token refresh on 401; upgrade to persistent cookie store if cloudflare challenge enforced.
class SMDownloader {
  constructor() {
    this.session = null;
  }

  async getSession() {
    const response = await fetch(`${BASE_URL}/api/session`, {
      headers: {
        Accept: '*/*',
        Referer: `${BASE_URL}/`,
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Session HTTP ${response.status}`);
    }

    this.session = data;
    return data;
  }

  async extract(url) {
    if (!this.session) {
      await this.getSession();
    }

    let response = await fetch(`${BASE_URL}/api/extract`, {
      method: 'POST',
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json',
        Origin: BASE_URL,
        Referer: `${BASE_URL}/`,
        'User-Agent': USER_AGENT,
        'x-sd-session': this.session?.token,
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(30000),
    });

    // Session expired -> ambil session baru dan coba sekali lagi
    if (response.status === 401) {
      await this.getSession();
      response = await fetch(`${BASE_URL}/api/extract`, {
        method: 'POST',
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/json',
          Origin: BASE_URL,
          Referer: `${BASE_URL}/`,
          'User-Agent': USER_AGENT,
          'x-sd-session': this.session?.token,
        },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(30000),
      });
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Extract HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    return data;
  }
}

function normalizeSmResponse(smResult, targetUrl = '') {
  if (!smResult?.ok || !smResult?.data) return null;
  const d = smResult.data;
  const rawMedia = Array.isArray(d.media) ? d.media : [];
  if (rawMedia.length === 0) return null;

  // Resolve relative URLs
  const mediaList = rawMedia.map((m) => {
    const item = { ...m };
    if (typeof item.url === 'string' && item.url.startsWith('/')) {
      item.url = `${BASE_URL}${item.url}`;
    }
    if (typeof item.previewUrl === 'string' && item.previewUrl.startsWith('/')) {
      item.previewUrl = `${BASE_URL}${item.previewUrl}`;
    }
    if (typeof item.thumbnail === 'string' && item.thumbnail.startsWith('/')) {
      item.thumbnail = `${BASE_URL}${item.thumbnail}`;
    }
    return item;
  });

  const thumbnail =
    mediaList.find((m) => m.thumbnail)?.thumbnail ||
    mediaList.find((m) => m.type === 'image' && m.url)?.url ||
    null;

  const primaryVideo = mediaList.find((m) => m.type === 'video');
  const primaryAudio = mediaList.find((m) => m.type === 'audio');

  let duration = '—';
  if (primaryVideo?.durationMs) {
    const sec = Math.round(primaryVideo.durationMs / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    duration = `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  return {
    title: d.title || 'Media Download',
    author: d.author || '',
    description: d.description || '',
    source: d.platformName || d.platform || 'Downloader',
    platform: d.platform || '',
    sourceUrl: d.sourceUrl || targetUrl,
    duration,
    thumbnail,
    video: primaryVideo
      ? {
          url: primaryVideo.url,
          quality: primaryVideo.label || 'HD',
          extension: primaryVideo.container || 'mp4',
          filesizeBytes: primaryVideo.filesizeBytes,
        }
      : null,
    audio: primaryAudio
      ? {
          url: primaryAudio.url,
          quality: primaryAudio.label || 'MP3',
          extension: primaryAudio.container || 'mp3',
          filesizeBytes: primaryAudio.filesizeBytes,
        }
      : null,
    media: mediaList,
    provider: 'smdownloader',
    raw: smResult,
  };
}

const smDownloader = new SMDownloader();

module.exports = {
  BASE_URL,
  SMDownloader,
  smDownloader,
  normalizeSmResponse,
};
