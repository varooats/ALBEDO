const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Locate the local JPEG image file for a given Tarot card
 */
function getCardImagePath(card) {
  if (!card) return null;

  if (card.arcana === 'major') {
    const num = String(card.number).padStart(2, '0');
    const dir = path.resolve(__dirname, '../../../public/assets/tarot/major-arcana');
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir).filter((f) => f.startsWith(`RWS_Tarot_${num}`) && f.endsWith('.jpg'));
    return files[0] ? path.join(dir, files[0]) : null;
  } else {
    const suitDirMap = {
      wands: { dir: 'wands', prefix: 'Wands' },
      cups: { dir: 'cups', prefix: 'Cups' },
      swords: { dir: 'swords', prefix: 'Swords' },
      pentacles: { dir: 'pentacles', prefix: 'Pents' },
    };
    const conf = suitDirMap[card.suit];
    if (!conf) return null;
    const num = String(card.number).padStart(2, '0');
    const filename = `${conf.prefix}${num}.jpg`;
    const full = path.resolve(__dirname, '../../../public/assets/tarot', conf.dir, filename);
    return fs.existsSync(full) ? full : null;
  }
}

/**
 * Prepares and renders a card texture as Base64 Data URI
 * Handles upright and reversed rotation (180 deg if REVERSED)
 */
async function getCardImageDataUri(card, targetW = 280, targetH = 480) {
  const imgPath = getCardImagePath(card);
  if (!imgPath || !fs.existsSync(imgPath)) {
    return null;
  }

  let pipeline = sharp(imgPath).resize(targetW, targetH, {
    fit: 'cover',
    position: 'center',
  });

  if (card.position === 'REVERSED') {
    pipeline = pipeline.rotate(180);
  }

  const buffer = await pipeline.png().toBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

function escapeXml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds SVG markup for Magic Card Frame with runes, glowing borders, and nameplates
 */
function buildMagicCardSlot({ x, y, width, height, card, dataUri, label = null }) {
  const cardName = escapeXml(card.name.toUpperCase());
  const position = card.position || 'UPRIGHT';
  const isReversed = position === 'REVERSED';
  const tagColor = isReversed ? '#ff6688' : '#66e6ff';
  const glowColor = isReversed ? 'rgba(255, 60, 100, 0.45)' : 'rgba(80, 200, 255, 0.45)';

  const pad = 12;
  const innerX = x + pad;
  const innerY = y + pad + (label ? 28 : 10);
  const innerW = width - pad * 2;
  const innerH = height - pad * 2 - (label ? 80 : 60);

  const labelSection = label
    ? `
      <g transform="translate(${x + width / 2}, ${y + 24})">
        <rect x="-70" y="-14" width="140" height="24" rx="12" fill="#130924" stroke="#a78bfa" stroke-width="1.5" />
        <text x="0" y="2" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-weight="bold" font-size="12" letter-spacing="2" fill="#f3e8ff">
          ${escapeXml(label)}
        </text>
      </g>
    `
    : '';

  return `
    <!-- Magic Slot Container -->
    <g>
      <!-- Outer Card Outer Border & Shadow -->
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="#0d0818" stroke="#4c1d95" stroke-width="2" />
      <rect x="${x + 4}" y="${y + 4}" width="${width - 8}" height="${height - 8}" rx="14" fill="#150d2a" stroke="#8b5cf6" stroke-width="1.5" opacity="0.8" />

      <!-- Corner Magic Runes -->
      <path d="M${x + 8} ${y + 24} L${x + 24} ${y + 8} M${x + 8} ${y + 8} L${x + 24} ${y + 24}" stroke="#c084fc" stroke-width="1.5" opacity="0.7" />
      <path d="M${x + width - 24} ${y + 8} L${x + width - 8} ${y + 24} M${x + width - 8} ${y + 8} L${x + width - 24} ${y + 24}" stroke="#c084fc" stroke-width="1.5" opacity="0.7" />
      <path d="M${x + 8} ${y + height - 24} L${x + 24} ${y + height - 8} M${x + 8} ${y + height - 8} L${x + 24} ${y + height - 24}" stroke="#c084fc" stroke-width="1.5" opacity="0.7" />
      <path d="M${x + width - 24} ${y + height - 8} L${x + width - 8} ${y + height - 24} M${x + width - 8} ${y + height - 8} L${x + width - 24} ${y + height - 24}" stroke="#c084fc" stroke-width="1.5" opacity="0.7" />

      ${labelSection}

      <!-- Tarot Image with Golden Inset Border -->
      <g>
        <clipPath id="clip-${x}-${y}">
          <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="10" />
        </clipPath>
        ${
          dataUri
            ? `<image href="${dataUri}" x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-${x}-${y})" />`
            : `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" fill="#2e1065" clip-path="url(#clip-${x}-${y})" />`
        }
        <!-- Glass Sheen Overlay -->
        <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="10" fill="url(#cardGlint)" opacity="0.35" />
        <!-- Inset Border -->
        <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="10" fill="none" stroke="#fbbf24" stroke-width="1.5" opacity="0.75" />
      </g>

      <!-- Card Nameplate at Bottom -->
      <g transform="translate(${x + width / 2}, ${y + height - 38})">
        <rect x="-${width / 2 - 14}" y="-16" width="${width - 28}" height="42" rx="8" fill="#090514" stroke="#a855f7" stroke-width="1.5" />
        <text x="0" y="2" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-weight="bold" font-size="13" letter-spacing="1" fill="#fdf4ff">
          ${cardName}
        </text>
        <text x="0" y="18" text-anchor="middle" font-family="'Cinzel', Arial, sans-serif" font-weight="700" font-size="10" letter-spacing="2" fill="${tagColor}">
          ✦ ${position} ✦
        </text>
      </g>
    </g>
  `;
}

/**
 * Generate Magic Tarot Composite Graphic
 * Supports 1 Card or 3 Cards (e.g. Past, Present, Future)
 */
async function generateTarotCompositeImage(cards = [], options = {}) {
  const cardList = Array.isArray(cards) ? cards : [cards];
  const count = Math.min(Math.max(cardList.length, 1), 3);
  const title = options.title || 'ALBEDO TAROT REFLECTION';

  let canvasW, canvasH, cardW, cardH;

  if (count === 1) {
    canvasW = 600;
    canvasH = 820;
    cardW = 340;
    cardH = 590;
  } else {
    // 3 Cards spread or 2 cards
    canvasW = 1100;
    canvasH = 760;
    cardW = 300;
    cardH = 540;
  }

  // Preload and convert card textures
  const dataUris = [];
  for (const c of cardList) {
    const uri = await getCardImageDataUri(c, cardW, cardH);
    dataUris.push(uri);
  }

  const slotMarkups = [];
  if (count === 1) {
    const startX = (canvasW - cardW) / 2;
    const startY = 140;
    slotMarkups.push(
      buildMagicCardSlot({
        x: startX,
        y: startY,
        width: cardW,
        height: cardH,
        card: cardList[0],
        dataUri: dataUris[0],
        label: options.label || 'ORACLE',
      })
    );
  } else {
    const gap = 24;
    const totalW = count * cardW + (count - 1) * gap;
    const startX = (canvasW - totalW) / 2;
    const startY = 135;
    const labels = options.labels || ['PAST', 'PRESENT', 'FUTURE'];

    for (let i = 0; i < count; i++) {
      const x = startX + i * (cardW + gap);
      slotMarkups.push(
        buildMagicCardSlot({
          x,
          y: startY,
          width: cardW,
          height: cardH,
          card: cardList[i],
          dataUri: dataUris[i],
          label: labels[i] || `CARD ${i + 1}`,
        })
      );
    }
  }

  const svg = `
<svg width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Magic Dark Galaxy Gradient -->
    <radialGradient id="magicBg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#1e113a" />
      <stop offset="45%" stop-color="#110924" />
      <stop offset="100%" stop-color="#070310" />
    </radialGradient>

    <!-- Glowing Stars Pattern -->
    <radialGradient id="coreAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#9333ea" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#9333ea" stop-opacity="0" />
    </radialGradient>

    <!-- Glass Glint for Cards -->
    <linearGradient id="cardGlint" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3" />
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#3b0764" stop-opacity="0.2" />
    </linearGradient>

    <!-- Gold Accent Gradient -->
    <linearGradient id="goldText" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="50%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>
  </defs>

  <!-- Deep Cosmic Canvas Background -->
  <rect x="0" y="0" width="${canvasW}" height="${canvasH}" fill="url(#magicBg)" />

  <!-- Magic Aura Core in Center -->
  <circle cx="${canvasW / 2}" cy="${canvasH / 2}" r="${canvasW * 0.45}" fill="url(#coreAura)" />

  <!-- Outer Arcane Border Frame -->
  <rect x="15" y="15" width="${canvasW - 30}" height="${canvasH - 30}" rx="20" fill="none" stroke="#6b21a8" stroke-width="2" opacity="0.6" />
  <rect x="22" y="22" width="${canvasW - 44}" height="${canvasH - 44}" rx="16" fill="none" stroke="#9333ea" stroke-width="1.2" opacity="0.4" />

  <!-- Geometric Arcane Circle in Background -->
  <g transform="translate(${canvasW / 2}, ${canvasH / 2})" stroke="#8b5cf6" stroke-width="1" opacity="0.12" fill="none">
    <circle r="280" />
    <circle r="220" stroke-dasharray="8 6" />
    <polygon points="0,-280 242,140 -242,140" />
    <polygon points="0,280 242,-140 -242,-140" />
  </g>

  <!-- Header Header Bar & Title -->
  <g transform="translate(${canvasW / 2}, 55)">
    <!-- Decorative Center Emblem -->
    <path d="M0 -22 L6 -8 L20 -8 L9 2 L13 16 L0 7 L-13 16 L-9 2 L-20 -8 L-6 -8 Z" fill="#c084fc" opacity="0.85" />
    <text x="0" y="32" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-weight="bold" font-size="24" letter-spacing="6" fill="url(#goldText)">
      ${escapeXml(title)}
    </text>
    <line x1="-160" y1="45" x2="160" y2="45" stroke="#a855f7" stroke-width="1.5" opacity="0.6" />
    <text x="0" y="62" text-anchor="middle" font-family="'Cinzel', Arial, sans-serif" font-size="11" letter-spacing="3" fill="#e9d5ff" opacity="0.75">
      MYSTICAL REFLECTION &amp; WISDOM
    </text>
  </g>

  <!-- Slots -->
  ${slotMarkups.join('\n')}

  <!-- Footer Watermark -->
  <g transform="translate(${canvasW / 2}, ${canvasH - 24})">
    <text x="0" y="0" text-anchor="middle" font-family="'Cinzel', Arial, sans-serif" font-size="10" letter-spacing="4" fill="#a855f7" opacity="0.65">
      — ALBEDO ARCANA ARCHIVE —
    </text>
  </g>
</svg>
  `.trim();

  return await sharp(Buffer.from(svg, 'utf8'))
    .png({ compressionLevel: 8 })
    .toBuffer();
}

module.exports = {
  getCardImagePath,
  getCardImageDataUri,
  generateTarotCompositeImage,
};
