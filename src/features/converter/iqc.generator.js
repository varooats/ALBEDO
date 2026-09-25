const sharp = require('sharp');

function escapeXml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapWords(text = '', maxChars = 34) {
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
 * Generates an authentic iPhone Lock Screen Notification Mockup
 * Matches the reference image 100%:
 * - Pure pitch black OLED background
 * - Top Status Bar:
 *   - Left: Digital Clock (e.g. "19.24")
 *   - Right: Provider name, Signal bars, LTE badge, Wifi icon, Battery % number, and Battery frame
 * - Single floating Notification Card:
 *   - Dark rounded pill / rectangle (#242426)
 *   - Left: WhatsApp rounded app icon (green with phone icon) or user avatar
 *   - Top line: 'WHATSAPP' in grey caps (left) | timestamp (e.g. 'now', '1m ago') in grey (right)
 *   - Second line: Sender Contact Name in Bold White
 *   - Message lines: Clean white text
 */
async function generateIphoneNotificationCard({
  text = 'Halo albedo',
  senderName = 'Albedo',
  avatarDataUri = null,
  timeStr = '19.24',
  batteryPercent = 85,
  carrier = 'Indosat Ooredoo',
  notifTime = 'now',
}) {
  const width = 820;

  // Format time (support 19:24 or 19.24)
  const displayTime = String(timeStr || '19.24').replace(':', '.');

  // Wrap message lines
  const lines = wrapWords(text, 38);
  const lineCount = Math.max(1, lines.length);
  const lineHeight = 32;

  // Card heights and dynamic canvas
  const cardX = 30;
  const cardY = 95;
  const cardW = width - cardX * 2; // 760px
  const cardBaseH = 115;
  const cardH = cardBaseH + (lineCount - 1) * lineHeight;

  const totalHeight = cardY + cardH + 45;

  const safeCarrier = escapeXml(carrier || 'Indosat Ooredoo');
  const safeSender = escapeXml(senderName || 'Albedo');
  const safeNotifTime = escapeXml(notifTime || 'now');
  const batLevel = Math.max(1, Math.min(100, parseInt(batteryPercent, 10) || 85));
  const batWidth = Math.max(2, Math.round((batLevel / 100) * 22));

  // Build message lines SVG
  let messageLinesSvg = '';
  lines.forEach((line, idx) => {
    const y = cardY + 98 + idx * lineHeight;
    messageLinesSvg += `
      <text x="${cardX + 78}" y="${y}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif" font-size="22" fill="#f2f2f7">
        ${escapeXml(line)}
      </text>
    `;
  });

  // Icon / Avatar markup
  const iconX = cardX + 22;
  const iconY = cardY + 22;
  const iconSize = 42;

  const iconMarkup = avatarDataUri
    ? `
      <clipPath id="avatarNotifClip">
        <rect x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" rx="10" />
      </clipPath>
      <image href="${avatarDataUri}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarNotifClip)" />
      <!-- WhatsApp small corner badge -->
      <circle cx="${iconX + iconSize - 2}" cy="${iconY + iconSize - 2}" r="8" fill="#25D366" stroke="#242426" stroke-width="1.5" />
      <path d="M${iconX + iconSize - 5} ${iconY + iconSize - 1} L${iconX + iconSize - 3} ${iconY + iconSize + 1} L${iconX + iconSize + 2} ${iconY + iconSize - 4}" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-linecap="round" />
    `
    : `
      <!-- WhatsApp Official Green Rounded Icon -->
      <rect x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" rx="10" fill="#25D366" />
      <g transform="translate(${iconX + 8}, ${iconY + 8}) scale(0.65)" fill="#ffffff">
        <path d="M19.05 4.91A10 10 0 0 0 1.5 15.65L0 21l5.5-1.44A10 10 0 0 0 20 10a10 10 0 0 0-.95-5.09zM10 18.25a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.32A8.25 8.25 0 1 1 18.25 10 8.27 8.27 0 0 1 10 18.25zm4.52-6.17c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.57.12-.17.25-.66.8-.8.97-.15.17-.3.2-.55.07a7 7 0 0 1-2.06-1.27 7.7 7.7 0 0 1-1.43-1.78c-.15-.25 0-.39.1-.51.1-.12.25-.3.37-.44.13-.15.17-.25.25-.42.09-.17.04-.32-.02-.44-.06-.13-.57-1.37-.78-1.87-.2-.5-.41-.43-.57-.44h-.49c-.17 0-.44.06-.67.32-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z"/>
      </g>
    `;

  const svg = `
<svg width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <!-- Solid Black iPhone Lockscreen Background -->
  <rect width="${width}" height="${totalHeight}" fill="#000000" />

  <!-- ================= STATUS BAR ================= -->
  <!-- Left: Time (e.g. 19.24) -->
  <text x="40" y="52" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', Arial, sans-serif" font-weight="600" font-size="28" fill="#ffffff">
    ${escapeXml(displayTime)}
  </text>

  <!-- Right Status Elements: Provider, Signal, LTE, Wifi, Battery % and Icon -->
  <g transform="translate(${width - 40}, 33)" text-anchor="end">
    <!-- Carrier / Provider -->
    <text x="-215" y="19" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-weight="400" font-size="17" fill="#ffffff">
      ${safeCarrier}
    </text>

    <!-- Signal Bars (4 bars) -->
    <g transform="translate(-205, 5)" fill="#ffffff">
      <rect x="0" y="10" width="3.5" height="5" rx="1" />
      <rect x="5.5" y="7" width="3.5" height="8" rx="1" />
      <rect x="11" y="4" width="3.5" height="11" rx="1" />
      <rect x="16.5" y="1" width="3.5" height="14" rx="1" />
    </g>

    <!-- LTE -->
    <text x="-142" y="19" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-weight="600" font-size="16" fill="#ffffff">
      LTE
    </text>

    <!-- Wifi Icon -->
    <g transform="translate(-130, 2)">
      <path d="M0 4 C5 0 15 0 20 4 M3 8 C7 4 13 4 17 8 M7 12 C9 10 11 10 13 12 M10 15 A1.5 1.5 0 1 1 10 15.01" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" fill="none" />
    </g>

    <!-- Battery Percentage Number -->
    <text x="-42" y="19" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-weight="400" font-size="18" fill="#ffffff">
      ${batLevel}%
    </text>

    <!-- Battery Horizontal Icon -->
    <g transform="translate(-32, 2)">
      <!-- Outline -->
      <rect x="0" y="2" width="28" height="15" rx="4" fill="none" stroke="#ffffff" stroke-width="2" />
      <!-- Fill Level -->
      <rect x="3" y="5" width="${batWidth}" height="9" rx="2" fill="${batLevel <= 20 ? '#ff3b30' : '#ffffff'}" />
      <!-- Cap/Nipple -->
      <path d="M30 6.5 C31 7 31 12 30 12.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    </g>
  </g>

  <!-- ================= NOTIFICATION CARD ================= -->
  <!-- Card Container (Matches #242426 iOS Dark Card) -->
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="26" fill="#242426" />

  <!-- App Icon -->
  ${iconMarkup}

  <!-- App Title: WHATSAPP -->
  <text x="${cardX + 78}" y="${cardY + 39}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-weight="600" font-size="16" letter-spacing="1" fill="#8e8e93">
    WHATSAPP
  </text>

  <!-- Time Ago: now -->
  <text x="${cardX + cardW - 24}" y="${cardY + 39}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-size="16" fill="#8e8e93">
    ${safeNotifTime}
  </text>

  <!-- Sender Name (Bold) -->
  <text x="${cardX + 78}" y="${cardY + 68}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif" font-weight="700" font-size="24" fill="#ffffff">
    ${safeSender}
  </text>

  <!-- Message Lines -->
  ${messageLinesSvg}
</svg>
  `.trim();

  return await sharp(Buffer.from(svg, 'utf8'))
    .png({ compressionLevel: 8 })
    .toBuffer();
}

module.exports = {
  generateIphoneNotificationCard,
};
