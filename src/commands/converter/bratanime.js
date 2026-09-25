const path = require('node:path');
const sharp = require('sharp');
const { createCommand } = require('../../core/command.factory');
const { replyText } = require('../../core/reply');
const stickerService = require('../../services/media/sticker.service');
const { messages } = require('../../messages');

const TEMPLATE_PATH = path.join(process.cwd(), 'public/assets/bratanime.jpg');
const ORIGINAL_TEMPLATE = { width: 1289, height: 1536 };
const ORIGINAL_PAPER = { left: 645, top: 805, right: 1070, bottom: 1195 };

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text, maxChars) {
  const paragraphs = text.split(/\r?\n/);
  const lines = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }

    const words = paragraph.trim().split(/\s+/);
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (test.length <= maxChars) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

function getPaper(templateWidth, templateHeight) {
  const scaleX = templateWidth / ORIGINAL_TEMPLATE.width;
  const scaleY = templateHeight / ORIGINAL_TEMPLATE.height;

  const left = Math.round(ORIGINAL_PAPER.left * scaleX);
  const top = Math.round(ORIGINAL_PAPER.top * scaleY);
  const right = Math.round(ORIGINAL_PAPER.right * scaleX);
  const bottom = Math.round(ORIGINAL_PAPER.bottom * scaleY);

  return { left, top, width: right - left, height: bottom - top };
}

function createTextSvg(text, width, height) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = text.length;

  let fontSize = 27;
  if (wordCount === 1) fontSize = 64;
  else if (wordCount === 2) fontSize = 58;
  else if (wordCount <= 4) fontSize = 55;
  else if (wordCount <= 6) fontSize = 45;
  else if (wordCount <= 10) fontSize = 32;

  if (charCount > 25) fontSize = Math.min(fontSize, 34);
  if (charCount > 35) fontSize = Math.min(fontSize, 30);
  if (charCount > 50) fontSize = Math.min(fontSize, 26);

  const horizontalPadding = 20;
  const maxWidth = width - horizontalPadding * 2;
  let maxChars = Math.max(8, Math.floor(maxWidth / (fontSize * 0.52)));
  let lines = wrapText(text, maxChars);
  let lineHeight = Math.round(fontSize * 1.2);

  while (lines.length * lineHeight > height - 30 && fontSize > 18) {
    fontSize -= 2;
    maxChars = Math.max(8, Math.floor(maxWidth / (fontSize * 0.52)));
    lines = wrapText(text, maxChars);
    lineHeight = Math.round(fontSize * 1.2);
  }

  const totalHeight = lines.length * lineHeight;
  let y = (height - totalHeight) / 2 + fontSize;

  const textElements = lines
    .map((line) => {
      const el = `<text x="${width / 2}" y="${y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}px" font-weight="500" fill="#000000">${escapeXml(line)}</text>`;
      y += lineHeight;
      return el;
    })
    .join('');

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${textElements}
    </svg>
  `);
}

async function createBratanime(text) {
  const meta = await sharp(TEMPLATE_PATH).metadata();
  if (!meta.width || !meta.height) throw new Error('Ukuran template tidak dapat dibaca.');

  const paper = getPaper(meta.width, meta.height);
  const textSvg = createTextSvg(text, paper.width, paper.height);
  const textBuffer = await sharp(textSvg).png().toBuffer();

  return sharp(TEMPLATE_PATH)
    .composite([{ input: textBuffer, left: paper.left, top: paper.top }])
    .png()
    .toBuffer();
}

module.exports = createCommand({
  name: 'bratanime',
  description: 'Buat sticker anime dengan tulisan.',
  execute: async (client, message, args = []) => {
    const jid = message?.key?.remoteJid;
    if (!jid) return false;

    const text = Array.isArray(args) ? args.join(' ').trim() : String(args || '').trim();
    if (!text) {
      await replyText(client, message, messages.converter.bratanime.usage);
      return false;
    }

    try {
      const imageBuffer = await createBratanime(text);
      const stickerBuffer = await stickerService.create(imageBuffer);
      await client.sendMessage(jid, { sticker: stickerBuffer }, { quoted: message });
      return true;
    } catch (error) {
      console.error('[BRATANIME] Error:', error?.message || error);
      await replyText(client, message, messages.converter.bratanime.error(error?.message));
      return false;
    }
  },
});
