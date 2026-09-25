const sharp = require('sharp');

function detectImageFormat(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return 'UNKNOWN';
  }

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'PNG';
  }

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'JPEG';
  }

  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'GIF';
  }

  // WebP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'WebP';
  }

  return 'UNKNOWN';
}

function parseWebPChunks(buffer) {
  if (
    !Buffer.isBuffer(buffer) ||
    buffer.length < 12 ||
    buffer.subarray(0, 4).toString() !== 'RIFF' ||
    buffer.subarray(8, 12).toString() !== 'WEBP'
  ) {
    return null;
  }

  const chunks = [];
  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const tag = buffer.subarray(offset, offset + 4).toString();
    const size = buffer.readUInt32LE(offset + 4);
    const payloadStart = offset + 8;
    const payloadEnd = payloadStart + size;
    const paddedEnd = payloadEnd + (size % 2 !== 0 ? 1 : 0);

    if (payloadEnd > buffer.length) break;

    chunks.push({
      tag,
      size,
      payload: buffer.subarray(payloadStart, payloadEnd),
      raw: buffer.subarray(offset, Math.min(paddedEnd, buffer.length)),
    });

    offset = paddedEnd;
  }

  return chunks;
}

function buildWhatsAppExifChunk(packname = 'ALBEDO-BOT', author = 'Albedo') {
  const json = {
    'sticker-pack-id': `albedo-${Date.now()}`,
    'sticker-pack-name': String(packname || 'ALBEDO-BOT'),
    'sticker-pack-publisher': String(author || 'Albedo'),
    'emojis': ['✨'],
  };
  const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');

  // WhatsApp Exif format: Little-endian TIFF header with tag 0x5741 (WA)
  const exifHeader = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, // II* (Little-endian TIFF)
    0x08, 0x00, 0x00, 0x00, // Offset to first IFD (8)
    0x01, 0x00,             // Number of directory entries (1)
    0x41, 0x57,             // Tag: 0x5741 (WA)
    0x07, 0x00,             // Type: 7 (UNDEFINED)
    0x00, 0x00, 0x00, 0x00, // Count (JSON length, written at offset 14)
    0x16, 0x00, 0x00, 0x00, // Offset to value: 22 bytes from start of TIFF (0x16)
  ]);
  exifHeader.writeUInt32LE(jsonBuf.length, 14);

  const exifPayload = Buffer.concat([exifHeader, jsonBuf]);

  const chunkHeader = Buffer.from('EXIF');
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(exifPayload.length, 0);

  const padding = exifPayload.length % 2 !== 0 ? Buffer.from([0x00]) : Buffer.alloc(0);
  return Buffer.concat([chunkHeader, sizeBuf, exifPayload, padding]);
}

function addExifMetadata(webpBuffer, packname, author) {
  if (!packname && !author) return webpBuffer;

  const parsed = parseWebPChunks(webpBuffer);
  if (!parsed || parsed.length === 0) return webpBuffer;

  const exifChunk = buildWhatsAppExifChunk(packname, author);

  // Find existing VP8X chunk if present
  let vp8xChunk = parsed.find((c) => c.tag === 'VP8X');
  // Filter out existing EXIF chunks and VP8X from data list
  const dataChunks = parsed.filter((c) => c.tag !== 'EXIF' && c.tag !== 'VP8X');

  if (vp8xChunk) {
    const payload = Buffer.from(vp8xChunk.payload);
    payload[0] |= 0x08; // Enable EXIF bit in flags
    const sizeBuf = Buffer.alloc(4);
    sizeBuf.writeUInt32LE(payload.length, 0);
    const pad = payload.length % 2 !== 0 ? Buffer.from([0x00]) : Buffer.alloc(0);
    vp8xChunk = Buffer.concat([Buffer.from('VP8X'), sizeBuf, payload, pad]);
  } else {
    // Construct new VP8X chunk (10 bytes payload)
    const payload = Buffer.alloc(10);
    payload[0] = 0x08; // EXIF flag
    const hasAlpha = dataChunks.some((c) => c.tag === 'ALPH' || c.tag === 'VP8L');
    if (hasAlpha) payload[0] |= 0x10; // Alpha flag

    // Default 512x512 canvas size (511 in 24-bit uint)
    const w = 511;
    const h = 511;
    payload[4] = w & 0xff;
    payload[5] = (w >> 8) & 0xff;
    payload[6] = (w >> 16) & 0xff;
    payload[7] = h & 0xff;
    payload[8] = (h >> 8) & 0xff;
    payload[9] = (h >> 16) & 0xff;

    const sizeBuf = Buffer.alloc(4);
    sizeBuf.writeUInt32LE(10, 0);
    vp8xChunk = Buffer.concat([Buffer.from('VP8X'), sizeBuf, payload]);
  }

  // Proper WebP chunk order: RIFF header -> VP8X -> Image Data (VP8/VP8L) -> EXIF at the end
  const body = Buffer.concat([
    vp8xChunk,
    ...dataChunks.map((c) => c.raw),
    exifChunk,
  ]);

  const riffHeader = Buffer.from('RIFF');
  const totalSizeBuf = Buffer.alloc(4);
  totalSizeBuf.writeUInt32LE(4 + body.length, 0); // 'WEBP' (4) + body
  const webpHeader = Buffer.from('WEBP');

  return Buffer.concat([riffHeader, totalSizeBuf, webpHeader, body]);
}

async function toWebpBuffer(inputBuffer, options = {}) {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 85,
    packname = null,
    author = null,
  } = options;

  if (!Buffer.isBuffer(inputBuffer) || inputBuffer.length === 0) {
    throw new Error('[sticker.service] Empty image buffer');
  }

  const format = detectImageFormat(inputBuffer);

  // If already a valid WebP and only updating EXIF metadata
  if (format === 'WebP' && (packname || author)) {
    return addExifMetadata(inputBuffer, packname, author);
  }

  let result = await sharp(inputBuffer, { failOn: 'none' })
    .rotate()
    .resize(maxWidth, maxHeight, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality })
    .toBuffer();

  if (packname || author) {
    result = addExifMetadata(result, packname, author);
  }

  return result;
}

module.exports = {
  create: async (buffer, options = {}) => toWebpBuffer(buffer, options),
  convert: async (buffer, options = {}) => toWebpBuffer(buffer, options),
  addExif: addExifMetadata,
  detectFormat: detectImageFormat,
};
