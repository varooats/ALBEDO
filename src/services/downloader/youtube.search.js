let yts = null;
try {
  yts = require('yt-search');
} catch (e) {
  yts = null;
}

async function searchYouTubeFallback(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept-Language': 'id,en;q=0.9',
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const idMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
  if (!idMatch) return null;

  const videoId = idMatch[1];
  const titleMatch = html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : query;

  return {
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title,
    duration: '—',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    author: 'YouTube',
  };
}

async function searchYouTube(query) {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return null;

  // 1. Try yt-search package
  if (yts) {
    try {
      const results = await yts(cleanQuery);
      const videos = results?.videos || [];
      if (videos.length > 0) {
        const v = videos[0];
        return {
          url: v.url,
          title: v.title,
          duration: v.timestamp || `${Math.floor(v.seconds / 60)}:${String(v.seconds % 60).padStart(2, '0')}`,
          thumbnail: v.thumbnail || v.image,
          author: v.author?.name || 'YouTube',
          views: v.views,
        };
      }
    } catch (err) {
      console.warn('[YT-SEARCH] Package error, trying fallback:', err.message);
    }
  }

  // 2. Native fallback scraper
  try {
    return await searchYouTubeFallback(cleanQuery);
  } catch (err) {
    console.error('[YT-SEARCH] Fallback error:', err.message);
    return null;
  }
}

module.exports = {
  searchYouTube,
};
