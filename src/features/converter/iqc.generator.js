const sharp = require('sharp');

function escapeXml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapWords(text = '', maxChars = 28) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines = [];
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
  return lines;
}

/**
 * Generates an authentic iPhone Lock Screen / Notification Banner mockup
 * perfectly matching the reference image:
 * - Dynamic Island / Notch at top
 * - Status Bar: Time (Left), Carrier, Signal, Wifi, Battery % and Icon (Right)
 * - Notification Card: WhatsApp icon, "WHATSAPP", time ("now" or "10m ago"), Sender Name in bold, and Message text.
 * - Options:
 *    - text: message content
 *    - senderName: sender's name
 *    - avatarDataUri: profile picture (optional)
 *    - timeStr: clock time on status bar (e.g. "19:24")
 *    - batteryPercent: battery level (e.g. 50, 75, 100)
 *    - carrier: telecom provider (e.g. "Indosat Ooredoo", "Telkomsel", "XL")
 *    - notifTime: timestamp text on notification (e.g. "now", "2m ago")
 */
async function generateIphoneNotificationCard({
  text = 'Halo albedo',
  senderName = 'Albedo',
  avatarDataUri = null,
  timeStr = '19:24',
  batteryPercent = 50,
  carrier = 'Indosat Ooredoo',
  notifTime = 'now',
}) {
  const width = 800;

  // Wrap message lines
  const lines = wrapWords(text, 36);
  const lineCount = Math.max(1, lines.length);
  const lineHeight = 32;
  const notifBaseHeight = 110;
  const notifHeight = notifBaseHeight + (lineCount - 1) * lineHeight;

  const totalHeight = 360 + notifHeight;

  // Sanitize values
  const safeTime = escapeXml(timeStr);
  const safeCarrier = escapeXml(carrier);
  const safeSender = escapeXml(senderName);
  const safeNotifTime = escapeXml(notifTime);
  const batLevel = Math.max(1, Math.min(100, parseInt(batteryPercent, 10) || 50));
  const batWidth = Math.round((batLevel / 100) * 22);

  // Notification coordinates
  const cardX = 36;
  const cardY = 160;
  const cardW = width - cardX * 2; // 728px

  // Message lines text markup
  let messageLinesMarkup = '';
  lines.forEach((line, idx) => {
    const y = cardY + 98 + idx * lineHeight;
    messageLinesMarkup += `
      <text x="${cardX + 76}" y="${y}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-size="23" fill="#e5e5ea">
        ${escapeXml(line)}
      </text>
    `;
  });

  // Avatar or WhatsApp Green App Icon
  const iconX = cardX + 22;
  const iconY = cardY + 20;
  const iconSize = 42;

  const iconMarkup = avatarDataUri
    ? `
      <clipPath id="avatarNotifClip">
        <rect x="${iconX}" y="${iconY + 14}" width="${iconSize}" height="${iconSize}" rx="10" />
      </clipPath>
      <image href="${avatarDataUri}" x="${iconX}" y="${iconY + 14}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarNotifClip)" />
      <!-- WhatsApp small corner badge -->
      <circle cx="${iconX + iconSize - 2}" cy="${iconY + iconSize + 12}" r="9" fill="#25D366" stroke="#1c1c1e" stroke-width="1.5" />
      <path d="M${iconX + iconSize - 6} ${iconY + iconSize + 13} L${iconX + iconSize - 3} ${iconY + iconSize + 15} L${iconX + iconSize + 3} ${iconY + iconSize + 9}" stroke="#ffffff" stroke-width="1.8" fill="none" stroke-linecap="round" />
    `
    : `
      <!-- WhatsApp Official Green Icon -->
      <rect x="${iconX}" y="${iconY + 14}" width="${iconSize}" height="${iconSize}" rx="10" fill="#25D366" />
      <g transform="translate(${iconX + 8}, ${iconY + 22}) scale(0.65)" fill="#ffffff">
        <path d="M19.05 4.91A10 10 0 0 0 1.5 15.65L0 21l5.5-1.44A10 10 0 0 0 20 10a10 10 0 0 0-.95-5.09zM10 18.25a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.32A8.25 8.25 0 1 1 18.25 10 8.27 8.27 0 0 1 10 18.25zm4.52-6.17c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.57.12-.17.25-.66.8-.8.97-.15.17-.3.2-.55.07a7 7 0 0 1-2.06-1.27 7.7 7.7 0 0 1-1.43-1.78c-.15-.25 0-.39.1-.51.1-.12.25-.3.37-.44.13-.15.17-.25.25-.42.09-.17.04-.32-.02-.44-.06-.13-.57-1.37-.78-1.87-.2-.5-.41-.43-.57-.44h-.49c-.17 0-.44.06-.67.32-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z"/>
      </g>
    `;

  const svg = `
<svg width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Dark blurred lock screen background -->
    <linearGradient id="lockBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0a0c" />
      <stop offset="60%" stop-color="#121216" />
      <stop offset="100%" stop-color="#18181f" />
    </linearGradient>

    <!-- Notification Frosted Glass Effect -->
    <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2c2c2e" stop-opacity="0.88" />
      <stop offset="100%" stop-color="#1c1c1e" stop-opacity="0.94" />
    </linearGradient>

    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.55" />
    </filter>
  </defs>

  <!-- Wallpaper Background -->
  <rect width="${width}" height="${totalHeight}" fill="url(#lockBg)" />

  <!-- Dynamic Island Pill (iPhone 14/15/16 Pro style) -->
  <rect x="${width / 2 - 85}" y="20" width="170" height="42" rx="21" fill="#000000" stroke="#1c1c1e" stroke-width="1.5" />
  <circle cx="${width / 2 + 50}" cy="41" r="6" fill="#0b172a" />

  <!-- iOS Status Bar Left: Clock -->
  <text x="64" y="52" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', Arial, sans-serif" font-weight="600" font-size="28" fill="#ffffff">
    ${safeTime}
  </text>

  <!-- iOS Status Bar Right: Carrier, Signal, Wifi, Battery -->
  <g transform="translate(480, 28)">
    <!-- Provider / Carrier Name -->
    <text x="140" y="24" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-weight="500" font-size="16" fill="#ffffff">
      ${safeCarrier}
    </text>

    <!-- 4G/LTE or 5G -->
    <text x="175" y="24" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-weight="600" font-size="15" fill="#ffffff">
      LTE
    </text>

    <!-- Signal Bars (4 bars) -->
    <g transform="translate(186, 10)" fill="#ffffff">
      <rect x="0" y="10" width="3.5" height="5" rx="1" />
      <rect x="5.5" y="7" width="3.5" height="8" rx="1" />
      <rect x="11" y="4" width="3.5" height="11" rx="1" />
      <rect x="16.5" y="1" width="3.5" height="14" rx="1" />
    </g>

    <!-- Wifi Icon -->
    <g transform="translate(214, 8)">
      <path d="M0 4 C5 0 15 0 20 4 M3 8 C7 4 13 4 17 8 M7 12 C9 10 11 10 13 12 M10 15 A1.5 1.5 0 1 1 10 15.01" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" fill="none" />
    </g>

    <!-- Battery Percentage -->
    <text x="246" y="24" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-weight="500" font-size="17" fill="#ffffff">
      ${batLevel}%
    </text>

    <!-- Battery Frame & Liquid Level -->
    <g transform="translate(290, 8)">
      <rect x="0" y="2" width="28" height="15" rx="4" fill="none" stroke="#ffffff" stroke-width="2" />
      <!-- Battery Fill -->
      <rect x="3" y="5" width="${batWidth}" height="9" rx="2" fill="${batLevel <= 20 ? '#ff3b30' : '#ffffff'}" />
      <!-- Battery Cap/Nipple -->
      <path d="M30 6.5 C31 7 31 12 30 12.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    </g>
  </g>

  <!-- ================= NOTIFICATION CARD ================= -->
  <g filter="url(#cardShadow)">
    <!-- Card Frame (Frosted Glass iOS 16/17/18) -->
    <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${notifHeight}" rx="28" fill="url(#cardBg)" stroke="#3a3a3c" stroke-width="1.2" />

    <!-- App Icon (WhatsApp / Avatar) -->
    ${iconMarkup}

    <!-- Header App Title: WHATSAPP -->
    <text x="${cardX + 76}" y="${cardY + 37}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-weight="600" font-size="16" letter-spacing="1" fill="#8e8e93">
      WHATSAPP
    </text>

    <!-- Notification Time Ago ("now", "5m ago") -->
    <text x="${cardX + cardW - 28}" y="${cardY + 37}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-size="16" fill="#8e8e93">
      ${safeNotifTime}
    </text>

    <!-- Sender Name (Bold) -->
    <text x="${cardX + 76}" y="${cardY + 68}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-weight="700" font-size="25" fill="#ffffff">
      ${safeSender}
    </text>

    <!-- Message Lines -->
    ${messageLinesMarkup}
  </g>
</svg>
  `.trim();

  return await sharp(Buffer.from(svg, 'utf8'))
    .png({ compressionLevel: 8 })
    .toBuffer();
}

module.exports = {
  generateIphoneNotificationCard,
};
