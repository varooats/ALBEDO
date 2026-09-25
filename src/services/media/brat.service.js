const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, spawnSync } = require('child_process');
const { promisify } = require('util');
const sharp = require('sharp');

const execFileAsync = promisify(execFile);

function getFfmpegPath() {
  try {
    const staticFfmpeg = require('ffmpeg-static');
    if (staticFfmpeg && fs.existsSync(staticFfmpeg)) {
      return staticFfmpeg;
    }
  } catch (e) {}

  const standardPaths = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg'];
  for (const p of standardPaths) {
    if (fs.existsSync(p)) return p;
  }

  try {
    const res = spawnSync('ffmpeg', ['-version'], { timeout: 1000 });
    if (res.status === 0) return 'ffmpeg';
  } catch (e) {}

  return null;
}

const THEMES = {
  white: { bg: '#ffffff', text: '#000000' },
  green: { bg: '#8ace00', text: '#000000' },
  black: { bg: '#000000', text: '#ffffff' },
};

function escapeXml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapWords(text, maxCharsPerLine) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length <= maxCharsPerLine) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  return lines;
}

function calculateBratLayout(text, size = 512, padding = 40) {
  const rawWords = String(text || '').trim().split(/\s+/).filter(Boolean);
  const totalChars = text.length;
  const wordCount = rawWords.length;

  const maxWidth = size - padding * 2;
  const maxHeight = size - padding * 2;

  // Authentic Brat typography: very large bold font filling the square
  let fontSize;
  if (wordCount <= 1) {
    if (totalChars <= 4) fontSize = 145;
    else if (totalChars <= 7) fontSize = 115;
    else if (totalChars <= 10) fontSize = 85;
    else fontSize = 65;
  } else if (wordCount <= 2) {
    fontSize = totalChars <= 8 ? 105 : 85;
  } else if (wordCount <= 4) {
    fontSize = totalChars <= 16 ? 75 : 62;
  } else if (wordCount <= 8) {
    fontSize = 54;
  } else if (wordCount <= 14) {
    fontSize = 42;
  } else {
    fontSize = 32;
  }

  const charRatio = 0.52;
  let maxChars = Math.max(3, Math.floor(maxWidth / (fontSize * charRatio)));
  let lines = wrapWords(text, maxChars);
  let lineHeight = Math.round(fontSize * 1.12);

  while (lines.length * lineHeight > maxHeight && fontSize > 18) {
    fontSize -= 3;
    maxChars = Math.max(3, Math.floor(maxWidth / (fontSize * charRatio)));
    lines = wrapWords(text, maxChars);
    lineHeight = Math.round(fontSize * 1.12);
  }

  return { fontSize, lines, lineHeight };
}

function generateBratSvg(text, options = {}) {
  const {
    theme = 'white',
    size = 512,
    blur = 0.5, // slight low-fi blur matching authentic brat style
  } = options;

  const selectedTheme = THEMES[theme] || THEMES.white;
  const padding = 40;
  const { fontSize, lines, lineHeight } = calculateBratLayout(text, size, padding);

  const totalTextHeight = lines.length * lineHeight;
  const startY = Math.round((size - totalTextHeight) / 2) + Math.round(fontSize * 0.84);

  const filterDef = blur > 0
    ? `<defs><filter id="bratBlur"><feGaussianBlur stdDeviation="${blur}" /></filter></defs>`
    : '';

  const filterAttr = blur > 0 ? 'filter="url(#bratBlur)"' : '';

  // Brat meme format: centered or left-aligned with solid bold Arial
  let tspans = '';
  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    tspans += `<text x="${size / 2}" y="${y}" text-anchor="middle" font-family="Arial, 'Arial Narrow', sans-serif" font-weight="700" font-size="${fontSize}px" letter-spacing="-1.5px" fill="${selectedTheme.text}" ${filterAttr}>${escapeXml(line)}</text>\n`;
  });

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${filterDef}
  <rect width="${size}" height="${size}" fill="${selectedTheme.bg}" />
  ${tspans}
</svg>
  `.trim();
}

async function createBratImage(text, options = {}) {
  const svg = generateBratSvg(text, options);
  return await sharp(Buffer.from(svg, 'utf8'))
    .png()
    .toBuffer();
}

async function fetchAnimatedBratFromApis(text) {
  const enc = encodeURIComponent(text);
  const apis = [
    `https://aqul-brat.hf.space/api/brat/animated?text=${enc}`,
    `https://api.vreden.web.id/api/brat/animated?text=${enc}`,
    `https://api.siputzx.my.id/api/m/brat?text=${enc}`,
  ];

  for (const url of apis) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf && buf.length > 500) {
          const isMp4 = buf.subarray(4, 8).toString() === 'ftyp';
          return {
            buffer: buf,
            type: isMp4 ? 'mp4' : 'webp',
          };
        }
      }
    } catch (e) {
      console.warn(`[BRATVID] API ${url} failed:`, e.message);
    }
  }

  return null;
}

async function generateBratVideo({
  text = 'brat',
  theme = 'white',
  format = 'webp',
  frameDuration = 0.35,
  holdDuration = 1.2,
  blur = 0.5,
} = {}) {
  const tokens = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) throw new Error('Teks tidak boleh kosong.');

  const ffmpegPath = getFfmpegPath();

  // If ffmpeg is not available on system, use online animated generator
  if (!ffmpegPath) {
    console.log('[BRATVID] Local ffmpeg not found, using animated sticker API...');
    const apiResult = await fetchAnimatedBratFromApis(text);
    if (apiResult) {
      return apiResult;
    }
    throw new Error('FFmpeg tidak tersedia di server untuk merender animasi brat.');
  }

  // Progressive token layers (Word by Word matching BRAT.md)
  const partialTexts = [];
  for (let i = 1; i <= tokens.length; i++) {
    partialTexts.push(tokens.slice(0, i).join(' '));
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'albedo-brat-'));
  const framePaths = [];

  try {
    for (let i = 0; i < partialTexts.length; i++) {
      const frameBuffer = await createBratImage(partialTexts[i], { theme, size: 512, blur });
      const framePath = path.join(tmpDir, `frame-${String(i + 1).padStart(4, '0')}.png`);
      fs.writeFileSync(framePath, frameBuffer);
      framePaths.push(framePath);
    }

    const durations = framePaths.map((_, i) =>
      i === framePaths.length - 1 ? holdDuration : frameDuration
    );

    const manifestLines = [];
    for (let i = 0; i < framePaths.length; i++) {
      manifestLines.push(`file '${framePaths[i].replace(/'/g, "'\\''")}'`);
      manifestLines.push(`duration ${durations[i]}`);
    }
    manifestLines.push(`file '${framePaths[framePaths.length - 1].replace(/'/g, "'\\''")}'`);

    const concatPath = path.join(tmpDir, 'concat.txt');
    fs.writeFileSync(concatPath, manifestLines.join('\n'));

    const isWebp = format === 'webp';
    const isGif = format === 'gif';
    const ext = isWebp ? 'webp' : isGif ? 'gif' : 'mp4';
    const outPath = path.join(tmpDir, `brat-${Date.now()}.${ext}`);

    if (isWebp) {
      await execFileAsync(ffmpegPath, [
        '-y',
        '-f', 'concat', '-safe', '0', '-i', concatPath,
        '-vcodec', 'libwebp',
        '-filter:v', 'scale=512:512:flags=lanczos,fps=12',
        '-lossless', '0',
        '-compression_level', '4',
        '-q:v', '60',
        '-loop', '0',
        '-an',
        '-vsync', '0',
        outPath,
      ]);
    } else if (isGif) {
      await execFileAsync(ffmpegPath, [
        '-y',
        '-f', 'concat', '-safe', '0', '-i', concatPath,
        '-vf', 'fps=10,scale=512:512:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=64[p];[s1][p]paletteuse=dither=bayer',
        '-loop', '0',
        outPath,
      ]);
    } else {
      await execFileAsync(ffmpegPath, [
        '-y',
        '-f', 'concat', '-safe', '0', '-i', concatPath,
        '-vf', 'scale=512:512',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '20',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        outPath,
      ]);
    }

    const outputBuffer = fs.readFileSync(outPath);
    return { buffer: outputBuffer, type: ext, filePath: outPath };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

module.exports = {
  THEMES,
  generateBratSvg,
  createBratImage,
  generateBratVideo,
  getFfmpegPath,
};
