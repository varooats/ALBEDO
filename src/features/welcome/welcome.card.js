const sharp = require('sharp');

function escapeXml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(text = '', max = 26) {
  const s = String(text || '');
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

/**
 * Generates an ultra-stylish landscape banner card (1280x640)
 * Type: 'welcome' | 'goodbye'
 */
async function generateWelcomeCard({
  type = 'welcome',
  name = 'Pengembara',
  groupName = 'Albedo Sanctuary',
  avatarDataUri = null,
  memberCount = null,
}) {
  const width = 1280;
  const height = 640;

  const isWelcome = type === 'welcome';
  const headerTag = isWelcome ? 'WELCOME TO THE SANCTUARY' : 'FAREWELL, TRAVELER';
  const actionTitle = isWelcome ? 'SELAMAT DATANG' : 'SELAMAT TINGGAL';
  const actionSub = isWelcome
    ? 'Kehadiranmu membawa warna baru dalam persekutuan.'
    : 'Terima kasih atas jejak langkah dan kenangan yang terukir.';

  const primaryAccent = isWelcome ? '#c084fc' : '#f472b6';
  const glowAccent = isWelcome ? '#9333ea' : '#e11d48';
  const tagBg = isWelcome ? '#1e1035' : '#2d0c1e';
  const tagBorder = isWelcome ? '#a855f7' : '#f43f5e';

  const safeName = escapeXml(truncate(name, 22));
  const safeGroupName = escapeXml(truncate(groupName, 28));
  const safeMemberCount = memberCount ? `${memberCount} ANGGOTA` : 'MEMBERS OF ALBEDO';

  // Avatar coordinates (circle of radius 110 at cx=240, cy=320)
  const avatarCx = 240;
  const avatarCy = 320;
  const avatarR = 105;

  const avatarMarkup = avatarDataUri
    ? `
      <g>
        <clipPath id="avatarClip">
          <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" />
        </clipPath>
        <image href="${avatarDataUri}" x="${avatarCx - avatarR}" y="${avatarCy - avatarR}" width="${avatarR * 2}" height="${avatarR * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)" />
        <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="none" stroke="${primaryAccent}" stroke-width="4" />
        <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR + 10}" fill="none" stroke="${glowAccent}" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.8" />
      </g>
    `
    : `
      <g>
        <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="#1a102f" stroke="${primaryAccent}" stroke-width="4" />
        <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR + 10}" fill="none" stroke="${glowAccent}" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.8" />
        <text x="${avatarCx}" y="${avatarCy + 25}" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-weight="bold" font-size="80" fill="${primaryAccent}">
          ${escapeXml(safeName.charAt(0).toUpperCase() || 'A')}
        </text>
      </g>
    `;

  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Cosmic Gradient -->
    <radialGradient id="bgGlow" cx="20%" cy="50%" r="80%">
      <stop offset="0%" stop-color="${isWelcome ? '#241042' : '#330b24'}" />
      <stop offset="50%" stop-color="#0e071c" />
      <stop offset="100%" stop-color="#06030c" />
    </radialGradient>

    <!-- Side Light Beam -->
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${glowAccent}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </linearGradient>

    <!-- Gold Foil Accent Gradient -->
    <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#fde047" />
    </linearGradient>
  </defs>

  <!-- Deep Canvas Background -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGlow)" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#beam)" />

  <!-- Outer Arcane Border Frame -->
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="24" fill="none" stroke="${primaryAccent}" stroke-width="2.5" opacity="0.65" />
  <rect x="30" y="30" width="${width - 60}" height="${height - 60}" rx="18" fill="none" stroke="${glowAccent}" stroke-width="1.2" opacity="0.4" stroke-dasharray="14 8" />

  <!-- Corner Runes -->
  <g stroke="${primaryAccent}" stroke-width="2" opacity="0.75" fill="none">
    <path d="M45 75 L75 45 M45 45 L75 75" />
    <path d="M${width - 75} 45 L${width - 45} 75 M${width - 45} 45 L${width - 75} 75" />
    <path d="M45 ${height - 75} L75 ${height - 45} M45 ${height - 45} L75 ${height - 75}" />
    <path d="M${width - 75} ${height - 45} L${width - 45} ${height - 75} M${width - 45} ${height - 45} L${width - 75} ${height - 75}" />
  </g>

  <!-- Background Celestial Circles behind avatar -->
  <g transform="translate(${avatarCx}, ${avatarCy})" stroke="${glowAccent}" stroke-width="1.2" opacity="0.22" fill="none">
    <circle r="190" />
    <circle r="150" stroke-dasharray="10 8" />
    <polygon points="0,-190 164,95 -164,95" />
    <polygon points="0,190 164,-95 -164,-95" />
  </g>

  <!-- Avatar Section -->
  ${avatarMarkup}

  <!-- Content Section (Right Side) -->
  <g transform="translate(440, 160)">
    <!-- Header Pill Badge -->
    <rect x="0" y="0" width="310" height="34" rx="17" fill="${tagBg}" stroke="${tagBorder}" stroke-width="1.5" />
    <text x="155" y="22" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-weight="bold" font-size="12" letter-spacing="3" fill="${primaryAccent}">
      ✦ ${headerTag} ✦
    </text>

    <!-- Main Title -->
    <text x="0" y="95" font-family="'Cinzel', Georgia, 'Times New Roman', serif" font-weight="bold" font-size="52" letter-spacing="4" fill="url(#goldGradient)">
      ${actionTitle}
    </text>

    <!-- Target User Name -->
    <text x="0" y="152" font-family="'Cinzel', Arial, sans-serif" font-weight="bold" font-size="34" letter-spacing="1.5" fill="#fdf4ff">
      ${safeName}
    </text>

    <!-- Divider Bar with Diamond -->
    <line x1="0" y1="180" x2="680" y2="180" stroke="${primaryAccent}" stroke-width="2" opacity="0.6" />
    <polygon points="340,174 346,180 340,186 334,180" fill="${primaryAccent}" />

    <!-- Subtitle Description -->
    <text x="0" y="218" font-family="'Georgia', serif" font-style="italic" font-size="20" fill="#d8b4fe">
      ${escapeXml(actionSub)}
    </text>

    <!-- Room / Community Pill Info -->
    <g transform="translate(0, 260)">
      <rect x="0" y="0" width="380" height="42" rx="8" fill="#140a24" stroke="#4c1d95" stroke-width="1.5" />
      <text x="18" y="26" font-family="Arial, sans-serif" font-weight="bold" font-size="14" letter-spacing="1" fill="#c084fc">
        🏰 ${safeGroupName.toUpperCase()}
      </text>
      <text x="362" y="26" text-anchor="end" font-family="Arial, sans-serif" font-size="12" letter-spacing="1" fill="#a855f7">
        ${escapeXml(safeMemberCount)}
      </text>
    </g>
  </g>

  <!-- Bottom Brand Watermark -->
  <g transform="translate(${width / 2}, ${height - 40})">
    <text x="0" y="0" text-anchor="middle" font-family="'Cinzel', Arial, sans-serif" font-size="11" letter-spacing="5" fill="${primaryAccent}" opacity="0.75">
      — ALBEDO GUARDIAN OVERSEER ARCHIVE —
    </text>
  </g>
</svg>
  `.trim();

  return await sharp(Buffer.from(svg, 'utf8'))
    .png({ compressionLevel: 8 })
    .toBuffer();
}

module.exports = {
  generateWelcomeCard,
};
