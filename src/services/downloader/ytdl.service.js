let ytdl = null;
try {
  ytdl = require('ytdl-core');
} catch (e1) {
  try {
    ytdl = require('@distube/ytdl-core');
  } catch (e2) {
    ytdl = null;
  }
}

async function fetchFromCobalt(youtubeUrl) {
  const cobaltInstances = [
    'https://api.cobalt.tools/api/json',
    'https://cobalt.kwiatekm.com/api/json',
    'https://co.wuk.sh/api/json',
  ];

  for (const instance of cobaltInstances) {
    try {
      console.log(`[COBALT] Trying instance: ${instance}`);
      const res = await fetch(instance, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({
          url: youtubeUrl,
          downloadMode: 'audio',
          audioFormat: 'mp3',
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) continue;
      const data = await res.json();
      console.log(`[COBALT] Response:`, data);

      const downloadUrl = data.url || (data.picker && data.picker[0]?.url);
      if (downloadUrl) {
        console.log(`[COBALT] Found audio stream URL: ${downloadUrl}`);
        const audioRes = await fetch(downloadUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
          },
          signal: AbortSignal.timeout(45000),
        });

        if (audioRes.ok) {
          const buf = Buffer.from(await audioRes.arrayBuffer());
          if (buf.length > 20000 && buf[0] !== 0x7b && buf[0] !== 0x3c) {
            console.log(`[COBALT] Successfully downloaded audio: ${(buf.length / 1024).toFixed(2)} KB`);
            return {
              title: 'YouTube Audio',
              duration: '—',
              source: 'YouTube',
              thumbnail: null,
              buffer: buf,
              audio: {
                url: downloadUrl,
                quality: 'MP3',
                extension: 'mp3',
              },
            };
          }
        }
      }
    } catch (err) {
      console.warn(`[COBALT] Instance ${instance} failed:`, err.message);
    }
  }

  return null;
}

async function fetchAlternativeYtMp3(youtubeUrl) {
  const enc = encodeURIComponent(youtubeUrl);
  const apis = [
    { name: 'siputzx', url: `https://api.siputzx.my.id/api/d/ytmp3?url=${enc}` },
    { name: 'zenkey', url: `https://api.zenkey.my.id/api/download/ytmp3?url=${enc}` },
    { name: 'ryzendesu', url: `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${enc}` },
    { name: 'widipe', url: `https://widipe.com/download/ytdl?url=${enc}` },
    { name: 'vreden', url: `https://api.vreden.web.id/api/ytmp3?url=${enc}` },
  ];

  for (const api of apis) {
    try {
      console.log(`[YTDL-FALLBACK] Trying: ${api.url}`);
      const res = await fetch(api.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(20000),
      });

      console.log(`[YTDL-FALLBACK] [${api.name}] Status: ${res.status}`);
      if (!res.ok) continue;

      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (pErr) {
        console.warn(`[YTDL-FALLBACK] [${api.name}] Returned non-JSON:`, text.slice(0, 80));
        continue;
      }

      console.log(`[YTDL-FALLBACK] [${api.name}] Payload:`, JSON.stringify(data, null, 2).slice(0, 300));

      const downloadUrl =
        data.result?.download?.url ||
        data.result?.url ||
        data.result?.dl ||
        data.result?.audio ||
        data.result?.mp3 ||
        data.data?.download?.url ||
        data.data?.url ||
        data.data?.dl ||
        data.data?.audio ||
        data.data?.mp3 ||
        data.url ||
        data.dl ||
        data.download ||
        data.mp3;

      if (downloadUrl && typeof downloadUrl === 'string' && /^https?:\/\//i.test(downloadUrl)) {
        const title = data.result?.title || data.data?.title || data.title || 'YouTube Audio';
        const thumbnail = data.result?.thumbnail || data.data?.thumbnail || data.thumbnail || null;
        const duration = data.result?.duration || data.data?.duration || data.duration || '—';

        console.log(`[YTDL-FALLBACK] [${api.name}] Found stream URL: ${downloadUrl}`);
        const audioRes = await fetch(downloadUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
          },
          signal: AbortSignal.timeout(45000),
        });

        if (audioRes.ok) {
          const buf = Buffer.from(await audioRes.arrayBuffer());
          if (buf.length > 20000 && buf[0] !== 0x7b && buf[0] !== 0x3c) {
            console.log(`[YTDL-FALLBACK] Successfully downloaded audio: ${(buf.length / 1024).toFixed(2)} KB`);
            return {
              title,
              duration,
              source: 'YouTube',
              thumbnail,
              buffer: buf,
              audio: {
                url: downloadUrl,
                quality: '128kbps',
                extension: 'mp3',
              },
            };
          }
        }
      }
    } catch (e) {
      console.warn(`[YTDL-FALLBACK] API ${api.name} error:`, e.message);
    }
  }

  return null;
}

async function downloadWithYtdlCore(youtubeUrl) {
  let lastErr = null;

  // 1. Try ytdl-core package if available
  if (ytdl) {
    try {
      console.log(`[YTDL-CORE] Fetching video info for: ${youtubeUrl}`);
      const info = await ytdl.getInfo(youtubeUrl);
      const format = ytdl.chooseFormat(info.formats, {
        quality: 'highestaudio',
        filter: 'audioonly',
      });

      if (format && format.url) {
        console.log(
          `[YTDL-CORE] Audio format chosen: bitrate=${format.audioBitrate} container=${format.container} mimeType=${format.mimeType}`
        );

        const stream = ytdl(youtubeUrl, {
          quality: 'highestaudio',
          filter: 'audioonly',
        });

        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        if (buffer.length > 20000 && buffer[0] !== 0x7b && buffer[0] !== 0x3c) {
          console.log(`[YTDL-CORE] Audio buffer ready: ${(buffer.length / 1024).toFixed(2)} KB`);

          const title = info.videoDetails?.title || 'YouTube Audio';
          const duration = info.videoDetails?.lengthSeconds
            ? `${Math.floor(info.videoDetails.lengthSeconds / 60)}:${String(
                info.videoDetails.lengthSeconds % 60
              ).padStart(2, '0')}`
            : '—';
          const thumbnails = info.videoDetails?.thumbnails || [];
          const thumbnail = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : null;

          return {
            title,
            duration,
            source: 'YouTube',
            thumbnail,
            buffer,
            audio: {
              url: format.url,
              quality: format.audioBitrate ? `${format.audioBitrate}kbps` : 'Audio',
              extension: format.container || 'mp3',
            },
            raw: info,
          };
        }
      }
    } catch (e) {
      console.warn('[YTDL-CORE] ytdl execution failed, trying alternative:', e.message);
      lastErr = e;
    }
  }

  // 2. Try Cobalt API instances
  try {
    const cobalt = await fetchFromCobalt(youtubeUrl);
    if (cobalt) return cobalt;
  } catch (cErr) {
    console.warn('[COBALT] All instances failed:', cErr.message);
  }

  // 3. Alternative high-reliability MP3 APIs
  const alt = await fetchAlternativeYtMp3(youtubeUrl);
  if (alt) return alt;

  throw new Error(lastErr?.message || 'Gagal mengunduh audio YouTube via ytdl & alternative API.');
}

module.exports = {
  downloadWithYtdlCore,
  fetchFromCobalt,
  fetchAlternativeYtMp3,
  isYtdlAvailable: () => ytdl !== null,
};
