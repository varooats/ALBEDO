let innertubePromise = null;

// ponytail: in-memory singleton innertube instance; upgrade to session caching on disk if persistent auth tokens needed.
async function getInnertube() {
  if (!innertubePromise) {
    innertubePromise = (async () => {
      const { Innertube, UniversalCache } = await import('youtubei.js');
      return Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
      });
    })();
  }
  return innertubePromise;
}

function extractVideoId(urlOrId = '') {
  if (!urlOrId) return null;
  const str = String(urlOrId).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  const match = str.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

async function streamToBuffer(readableStream) {
  const chunks = [];
  const reader = readableStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

async function searchYouTube(query) {
  const clean = String(query || '').trim();
  if (!clean) return null;

  const yt = await getInnertube();
  const searchResult = await yt.search(clean, { type: 'video' });
  const videos = searchResult.videos || searchResult.results || [];
  if (!videos.length) return null;

  const candidates = [];
  for (const item of videos.slice(0, 5)) {
    const videoId = item.id || extractVideoId(item.endpoint?.payload?.videoId);
    if (!videoId) continue;
    candidates.push({
      url: `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
      title: item.title?.text || String(item.title || clean),
      duration: item.duration?.text || formatDuration(item.duration?.seconds),
      thumbnail: item.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      author: item.author?.name || 'YouTube',
      views: item.short_view_count?.text || item.view_count?.text || '—',
    });
  }

  if (!candidates.length) return null;

  return {
    ...candidates[0],
    candidates,
  };
}

async function getYouTubeMediaOptions(urlOrQuery) {
  const yt = await getInnertube();
  let videoId = extractVideoId(urlOrQuery);
  let searchMeta = null;

  if (!videoId) {
    searchMeta = await searchYouTube(urlOrQuery);
    if (!searchMeta?.videoId) {
      throw new Error(`Video YouTube tidak ditemukan untuk query: "${urlOrQuery}"`);
    }
    videoId = searchMeta.videoId;
  }

  const info = await yt.getBasicInfo(videoId);
  const basic = info.basic_info || {};
  const title = searchMeta?.title || basic.title || 'YouTube Video';
  const duration = searchMeta?.duration || formatDuration(basic.duration);
  const thumbnail =
    searchMeta?.thumbnail || basic.thumbnail?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const author = searchMeta?.author || basic.author || 'YouTube';

  const media = [
    {
      type: 'video',
      quality: '720p',
      label: 'Video 720p (HD)',
      container: 'mp4',
      videoId,
      source: 'youtubei',
      url: `https://www.youtube.com/watch?v=${videoId}`,
    },
    {
      type: 'video',
      quality: '480p',
      label: 'Video 480p (Standar)',
      container: 'mp4',
      videoId,
      source: 'youtubei',
      url: `https://www.youtube.com/watch?v=${videoId}`,
    },
    {
      type: 'video',
      quality: '360p',
      label: 'Video 360p (Hemat Kuota)',
      container: 'mp4',
      videoId,
      source: 'youtubei',
      url: `https://www.youtube.com/watch?v=${videoId}`,
    },
    {
      type: 'audio',
      quality: 'best',
      label: 'Audio MP3/M4A (Kualitas Terbaik)',
      container: 'mp3',
      videoId,
      source: 'youtubei',
      url: `https://www.youtube.com/watch?v=${videoId}`,
    },
  ];

  return {
    title,
    author,
    duration,
    thumbnail,
    source: 'YouTube',
    platform: 'YouTube',
    sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
    media,
  };
}

async function downloadYouTubeAudio(urlOrQuery) {
  const yt = await getInnertube();
  let videoId = extractVideoId(urlOrQuery);
  let searchMeta = null;

  if (!videoId) {
    searchMeta = await searchYouTube(urlOrQuery);
    if (!searchMeta?.videoId) {
      throw new Error(`Video YouTube tidak ditemukan untuk query: "${urlOrQuery}"`);
    }
    videoId = searchMeta.videoId;
  }

  let title = searchMeta?.title || 'YouTube Audio';
  let duration = searchMeta?.duration || '—';
  let thumbnail = searchMeta?.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  let author = searchMeta?.author || 'YouTube';

  try {
    const info = await yt.getBasicInfo(videoId);
    const basic = info.basic_info || {};
    title = searchMeta?.title || basic.title || title;
    duration = searchMeta?.duration || formatDuration(basic.duration);
    thumbnail = searchMeta?.thumbnail || basic.thumbnail?.[0]?.url || thumbnail;
    author = searchMeta?.author || basic.author || author;
  } catch (infoErr) {
    console.warn(`[YOUTUBEI] getBasicInfo notice: ${infoErr.message}`);
  }

  console.log(`[YOUTUBEI] Downloading audio for: ${title} (${videoId})`);

  // Client multi-tier: ANDROID & IOS tidak memerlukan web player deciphering,
  // sehingga kebal dari error "No valid URL to decipher" / signature cipher changes.
  const clients = ['ANDROID', 'IOS', 'YTMUSIC', 'TV_EMBEDDED', 'WEB'];
  let stream = null;
  let lastError = null;

  for (const client of clients) {
    try {
      console.log(`[YOUTUBEI] Trying client: ${client}`);
      stream = await yt.download(videoId, {
        type: 'audio',
        quality: 'best',
        format: 'any',
        client,
      });
      if (stream) break;
    } catch (err) {
      lastError = err;
      console.warn(`[YOUTUBEI] Client ${client} failed: ${err.message}`);
    }
  }

  let buffer = null;
  if (stream) {
    try {
      buffer = await streamToBuffer(stream);
    } catch (streamErr) {
      console.warn(`[YOUTUBEI] Stream conversion failed: ${streamErr.message}`);
    }
  }

  // Fallback: jika download stream gagal, ambil langsung URL format audio dari basicInfo
  if (!buffer || buffer.length === 0) {
    for (const client of ['ANDROID', 'IOS', 'YTMUSIC']) {
      try {
        console.log(`[YOUTUBEI] Trying direct format URL extraction via client: ${client}`);
        const info = await yt.getBasicInfo(videoId, { client });
        const format = info.chooseFormat({ type: 'audio', quality: 'best' });
        let directUrl = format?.url;
        if (!directUrl && format?.decipher) {
          directUrl = await format.decipher(yt.session.player);
        }
        if (directUrl && /^https?:\/\//i.test(directUrl)) {
          const fetchRes = await fetch(directUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': '*/*',
            },
            signal: AbortSignal.timeout(30000),
          });
          if (fetchRes.ok) {
            const buf = Buffer.from(await fetchRes.arrayBuffer());
            if (buf && buf.length > 10000) {
              buffer = buf;
              console.log(`[YOUTUBEI] Direct format download succeeded: ${(buffer.length / 1024).toFixed(2)} KB`);
              break;
            }
          }
        }
      } catch (directErr) {
        console.warn(`[YOUTUBEI] Direct format for ${client} failed: ${directErr.message}`);
      }
    }
  }

  if (!buffer || buffer.length === 0) {
    throw lastError || new Error('Gagal mendapatkan buffer audio YouTube yang valid.');
  }

  console.log(`[YOUTUBEI] Audio ready: ${(buffer.length / 1024).toFixed(2)} KB`);

  return {
    videoId,
    title,
    duration,
    thumbnail,
    author,
    source: 'YouTube',
    buffer,
  };
}

async function downloadYouTubeVideo(urlOrQuery, options = {}) {
  const yt = await getInnertube();
  let videoId = extractVideoId(urlOrQuery);
  let searchMeta = null;

  if (!videoId) {
    searchMeta = await searchYouTube(urlOrQuery);
    if (!searchMeta?.videoId) {
      throw new Error(`Video YouTube tidak ditemukan untuk query: "${urlOrQuery}"`);
    }
    videoId = searchMeta.videoId;
  }

  const info = await yt.getBasicInfo(videoId);
  const basic = info.basic_info || {};
  const title = searchMeta?.title || basic.title || 'YouTube Video';
  const duration = searchMeta?.duration || formatDuration(basic.duration);
  const thumbnail =
    searchMeta?.thumbnail || basic.thumbnail?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const author = searchMeta?.author || basic.author || 'YouTube';

  const requestedQuality = options.quality || '360p';
  console.log(`[YOUTUBEI] Downloading video (${requestedQuality}) for: ${title} (${videoId})`);

  let stream = null;
  const clients = ['ANDROID', 'IOS', 'TV_EMBEDDED', 'WEB'];
  for (const client of clients) {
    try {
      stream = await yt.download(videoId, {
        type: 'video+audio',
        quality: requestedQuality,
        format: 'mp4',
        client,
      });
      if (stream) break;
    } catch (err1) {
      try {
        stream = await yt.download(videoId, {
          type: 'video+audio',
          quality: 'best',
          format: 'mp4',
          client,
        });
        if (stream) break;
      } catch (err2) {
        // Continue to next client
      }
    }
  }

  const buffer = await streamToBuffer(stream);
  if (!buffer || buffer.length === 0) {
    throw new Error('Buffer video YouTube kosong.');
  }

  console.log(`[YOUTUBEI] Video ready: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB`);

  return {
    videoId,
    title,
    duration,
    thumbnail,
    author,
    source: 'YouTube',
    buffer,
  };
}

module.exports = {
  getInnertube,
  extractVideoId,
  searchYouTube,
  getYouTubeMediaOptions,
  downloadYouTubeAudio,
  downloadYouTubeVideo,
};
