const sharp = require('sharp');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const CARD = {
  width: 1470,
  height: 880,
  leftOffsetY: 70,
  photo: {
    frameX: 85,
    frameY: 97,
    frameW: 312,
    frameH: 352,
    imageX: 95,
    imageY: 108,
    imageW: 292,
    imageH: 330,
  },
  barcode: {
    x: 95,
    y: 502,
    w: 292,
    h: 112,
  },
  seal: {
    cx: 418,
    cy: 508,
    r: 42,
  },
};

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(value = '', maxLength = 28) {
  const text = String(value || '');
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}

function safeText(value = '', maxLength = 28) {
  return escapeXml(truncateText(value, maxLength));
}

function normalizeBarcodeValue(value = 'ALB000001') {
  const normalized = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 18);
  return normalized || 'ALB000001';
}

function buildBarcodeMarkup(value = 'ALB000001') {
  const seed = normalizeBarcodeValue(value);
  const bits = [0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0];

  for (let i = 0; i < seed.length; i += 1) {
    const code = seed.charCodeAt(i);
    for (let bit = 7; bit >= 0; bit -= 1) {
      bits.push((code >> bit) & 1);
    }
    bits.push(0, 0);
  }

  bits.push(1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0);

  const targetWidth = 250;
  const unit = targetWidth / bits.length;
  const bars = [];
  let x = 0;
  let start = null;

  for (let i = 0; i < bits.length; i += 1) {
    const active = bits[i] === 1;
    if (active && start === null) start = x;
    const nextX = x + unit;
    if (!active && start !== null) {
      bars.push(`<rect x="${start.toFixed(2)}" y="0" width="${(x - start).toFixed(2)}" height="58" fill="#403744" />`);
      start = null;
    }
    if (i === bits.length - 1 && start !== null) {
      bars.push(`<rect x="${start.toFixed(2)}" y="0" width="${(nextX - start).toFixed(2)}" height="58" fill="#403744" />`);
    }
    x = nextX;
  }

  return `
    <g>
      ${bars.join('')}
      <text x="${targetWidth / 2}" y="82" text-anchor="middle" font-size="13" font-weight="500" letter-spacing="2.2" font-family="Arial, sans-serif" fill="#66566f">
        ${escapeXml(seed)}
      </text>
    </g>
  `;
}

function buildCornerOrnament(position) {
  const transforms = {
    tl: 'translate(0 0)',
    tr: 'translate(1470 0) scale(-1 1)',
    bl: 'translate(0 880) scale(1 -1)',
    br: 'translate(1470 880) scale(-1 -1)',
  };

  return `
    <g transform="${transforms[position]}" fill="none" stroke="#80698e" stroke-width="2" opacity="0.85">
      <path d="M55 110 C55 70 70 55 110 55" />
      <path d="M55 82 C70 66 84 63 101 55" />
      <path d="M73 108 C73 85 85 73 108 73" />
      <path d="M56 105 C72 92 83 82 94 68" />
      <circle cx="55" cy="110" r="4" fill="#80698e" stroke="none" />
      <circle cx="73" cy="108" r="3" fill="#b8a4c5" stroke="none" />
    </g>
  `;
}

function buildPhotoBlock(avatarDataUri) {
  if (!avatarDataUri) return '';
  const offsetY = CARD.leftOffsetY;
  const frameY = CARD.photo.frameY + offsetY;
  const imageY = CARD.photo.imageY + offsetY;

  return `
    <g>
      <rect x="${CARD.photo.frameX}" y="${frameY}" width="${CARD.photo.frameW}" height="${CARD.photo.frameH}" rx="5" fill="#fbf9fc" stroke="#80698e" stroke-width="3" />
      <rect x="${CARD.photo.frameX + 6}" y="${frameY + 6}" width="${CARD.photo.frameW - 12}" height="${CARD.photo.frameH - 12}" fill="none" stroke="#c6b5cd" stroke-width="2" />
      <image href="${avatarDataUri}" x="${CARD.photo.imageX}" y="${imageY}" width="${CARD.photo.imageW}" height="${CARD.photo.imageH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)" />
      <rect x="${CARD.photo.imageX}" y="${imageY}" width="${CARD.photo.imageW}" height="${CARD.photo.imageH}" fill="url(#photoOverlay)" clip-path="url(#avatarClip)" />
      <rect x="${CARD.photo.imageX}" y="${imageY}" width="${CARD.photo.imageW}" height="${CARD.photo.imageH}" fill="none" stroke="#8d789b" stroke-width="2" />
    </g>
  `;
}

function buildBarcodeBlock(user) {
  const offsetY = CARD.leftOffsetY;
  const x = CARD.barcode.x;
  const y = CARD.barcode.y + offsetY;
  const value = user?.id || user?.username || 'ALB000001';

  return `
    <g>
      <rect x="${x}" y="${y}" width="${CARD.barcode.w}" height="${CARD.barcode.h}" rx="7" fill="#fcfafc" stroke="#8d789b" stroke-width="2" />
      <text x="${x + CARD.barcode.w / 2}" y="${y + 20}" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="3" font-family="Arial, sans-serif" fill="#80698e">
        STUDENT CODE
      </text>
      <g transform="translate(${x + 21}, ${y + 27})">
        ${buildBarcodeMarkup(value)}
      </g>
    </g>
  `;
}

function buildSealBlock() {
  const cx = CARD.seal.cx;
  const cy = CARD.seal.cy + CARD.leftOffsetY;

  return `
    <g transform="translate(${cx}, ${cy})">
      <circle cx="0" cy="0" r="${CARD.seal.r}" fill="#faf7fb" stroke="#80698e" stroke-width="3" />
      <circle cx="0" cy="0" r="${CARD.seal.r - 8}" fill="none" stroke="#c1aec9" stroke-width="2" />
      <path d="M0 -23 L7 -7 L24 -7 L11 4 L16 22 L0 12 L-16 22 L-11 4 L-24 -7 L-7 -7 Z" fill="#80698e" />
      <text x="0" y="32" text-anchor="middle" font-size="8" letter-spacing="2" font-family="Arial, sans-serif" fill="#80698e">
        ALBEDO
      </text>
    </g>
  `;
}

function buildProfileSvg(user, avatarDataUri = null, groupTitle = null) {
  const name = safeText(user?.name || 'User', 25);
  const cardTitle = safeText(groupTitle || 'ALBEDO', 22);
  const groupName = safeText(groupTitle || 'ALBEDO', 24);
  const groupLabel = groupTitle ? 'GROUP' : 'COMMUNITY';
  const username = safeText(user?.username || 'anon', 25);
  const social = safeText(user?.social || 'N/A', 25);
  const studentId = safeText(user?.id || 'ALB-000001', 20);
  const gender = safeText(user?.gender || 'Unknown', 15);
  const age = safeText(String(user?.age || 0), 5);
  const level = safeText(String(user?.level || 1), 8);
  const exp = safeText(String(user?.exp || 0), 12);
  const limit = safeText(String(user?.limit ?? 20), 8);
  const birthDate = safeText(user?.birthDate || user?.birthdate || user?.dateOfBirth || user?.dob || '—', 18);
  const house = safeText(user?.house || user?.role || user?.class || 'House of Albedo', 22);
  const quote = safeText(user?.quote || user?.bio || user?.tagline || 'Knowledge endures when everything else fades.', 180);

  return `
<svg width="${CARD.width}" height="${CARD.height}" viewBox="0 0 ${CARD.width} ${CARD.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f7f3f8" />
    </linearGradient>
    <linearGradient id="purpleLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#cdbdd4" />
      <stop offset="50%" stop-color="#80698e" />
      <stop offset="100%" stop-color="#cdbdd4" />
    </linearGradient>
    <clipPath id="avatarClip">
      <rect x="${CARD.photo.imageX}" y="${CARD.photo.imageY + CARD.leftOffsetY}" width="${CARD.photo.imageW}" height="${CARD.photo.imageH}" />
    </clipPath>
    <pattern id="watermark" width="180" height="180" patternUnits="userSpaceOnUse">
      <circle cx="90" cy="90" r="68" fill="none" stroke="#80698e" stroke-width="1" opacity="0.035" />
      <circle cx="90" cy="90" r="48" fill="none" stroke="#80698e" stroke-width="1" opacity="0.025" />
      <path d="M90 25 L103 72 L153 72 L113 100 L128 150 L90 120 L52 150 L67 100 L27 72 L77 72 Z" fill="none" stroke="#80698e" stroke-width="1" opacity="0.025" />
    </pattern>
    <linearGradient id="photoOverlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.02" />
      <stop offset="100%" stop-color="#80698e" stop-opacity="0.08" />
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="${CARD.width}" height="${CARD.height}" fill="url(#paper)" />
  <rect x="0" y="0" width="${CARD.width}" height="${CARD.height}" fill="url(#watermark)" />
  <rect x="15" y="15" width="1440" height="850" rx="28" fill="none" stroke="#80698e" stroke-width="3" />
  <rect x="28" y="28" width="1414" height="824" rx="23" fill="none" stroke="#c7b4cf" stroke-width="2" />
  <rect x="42" y="42" width="1386" height="796" rx="19" fill="none" stroke="#ded4e2" stroke-width="2" />

  ${buildCornerOrnament('tl')}
  ${buildCornerOrnament('tr')}
  ${buildCornerOrnament('bl')}
  ${buildCornerOrnament('br')}

  ${buildPhotoBlock(avatarDataUri)}
  ${buildBarcodeBlock(user)}
  ${buildSealBlock()}

  <g>
    <g transform="translate(800 73)" fill="#80698e">
      <path d="M0 18 L-9 -5 L8 5 L18 -19 L29 5 L47 -5 L38 18 Z" />
      <rect x="0" y="18" width="38" height="5" rx="2" />
    </g>
    <line x1="535" y1="105" x2="725" y2="105" stroke="#c5b3cc" stroke-width="2" />
    <line x1="875" y1="105" x2="1110" y2="105" stroke="#c5b3cc" stroke-width="2" />
    <text x="820" y="187" text-anchor="middle" font-size="50" letter-spacing="8" font-family="Georgia, Times New Roman, serif" fill="#675472">
      ${cardTitle.toUpperCase()}
    </text>
    <line x1="535" y1="211" x2="1110" y2="211" stroke="url(#purpleLine)" stroke-width="2" />
    <text x="820" y="241" text-anchor="middle" font-size="22" letter-spacing="3" font-family="Georgia, Times New Roman, serif" fill="#75627e">
      GROUP PROFILE
    </text>
    <line x1="560" y1="255" x2="1080" y2="255" stroke="#c7b4cf" stroke-width="1" />
  </g>

  <g font-family="Georgia, Times New Roman, serif">
    <text x="535" y="300" font-size="19" letter-spacing="1.5" fill="#77677e">NAME</text>
    <text x="700" y="300" font-size="21" fill="#403744">: ${name}</text>
    <text x="535" y="342" font-size="19" letter-spacing="1.5" fill="#77677e">NICKNAME</text>
    <text x="700" y="342" font-size="21" fill="#403744">: @${username} (${social})</text>
    <text x="535" y="384" font-size="19" letter-spacing="1.5" fill="#77677e">DATE OF BIRTH</text>
    <text x="700" y="384" font-size="21" fill="#403744">: ${birthDate}</text>
    <text x="535" y="426" font-size="19" letter-spacing="1.5" fill="#77677e">${groupLabel}</text>
    <text x="700" y="426" font-size="21" fill="#403744">: ${groupName}</text>
    <text x="535" y="468" font-size="19" letter-spacing="1.5" fill="#77677e">MEMBER ID</text>
    <text x="700" y="468" font-size="21" fill="#403744">: ${studentId}</text>
    <text x="535" y="510" font-size="19" letter-spacing="1.5" fill="#77677e">LEVEL</text>
    <text x="700" y="510" font-size="21" fill="#403744">: ${level}</text>
    <text x="535" y="552" font-size="19" letter-spacing="1.5" fill="#77677e">HOUSE</text>
    <text x="700" y="552" font-size="21" fill="#403744">: ${house}</text>
  </g>

  <g font-family="Georgia, Times New Roman, serif">
    <line x1="535" y1="585" x2="1110" y2="585" stroke="#d2c5d6" stroke-width="1" />
    <text x="535" y="622" font-size="16" letter-spacing="1" fill="#80698e">GENDER</text>
    <text x="620" y="622" font-size="19" fill="#403744">${gender}</text>
    <text x="770" y="622" font-size="16" letter-spacing="1" fill="#80698e">AGE</text>
    <text x="825" y="622" font-size="19" fill="#403744">${age}</text>
    <text x="900" y="622" font-size="16" letter-spacing="1" fill="#80698e">EXP</text>
    <text x="950" y="622" font-size="19" fill="#403744">${exp}</text>
    <text x="1020" y="622" font-size="16" letter-spacing="1" fill="#80698e">LIMIT</text>
    <text x="1090" y="622" text-anchor="end" font-size="19" fill="#403744">${limit}</text>
  </g>

  <g>
    <path d="M535 672 C560 655 585 655 610 672 C635 689 660 689 685 672" fill="none" stroke="#b7a1c1" stroke-width="2" />
    <path d="M955 672 C980 655 1005 655 1030 672 C1055 689 1080 689 1110 672" fill="none" stroke="#b7a1c1" stroke-width="2" />
    <path d="M820 660 L832 672 L820 684 L808 672 Z" fill="#80698e" />
    <text x="820" y="715" text-anchor="middle" font-size="20" font-style="italic" font-family="Georgia, Times New Roman, serif" fill="#66566f">
      ${quote}
    </text>
  </g>

  <g>
    <line x1="535" y1="757" x2="1110" y2="757" stroke="#c7b4cf" stroke-width="1" />
    <text x="535" y="790" font-size="14" letter-spacing="2" font-family="Arial, sans-serif" fill="#8a7890">
      ${groupName}
    </text>
    <text x="1110" y="790" text-anchor="end" font-size="14" font-family="Arial, sans-serif" fill="#8a7890">
      LV.${level} · ${studentId}
    </text>
  </g>

  <g fill="#80698e">
    <path d="M22 400 L27 412 L39 417 L27 422 L22 434 L17 422 L5 417 L17 412 Z" />
    <path d="M1448 400 L1453 412 L1465 417 L1453 422 M1448 434 L1443 422 L1431 417 L1443 412 Z" />
  </g>
</svg>
  `.replace(/<!--[\s\S]*?-->/g, '').trim();
}

async function getDefaultAvatarDataUri() {
  try {
    const defaultAvatarPath = path.resolve(__dirname, '../../../assets/profile-picture.jpeg');
    const imageBuffer = await fs.readFile(defaultAvatarPath);
    if (Buffer.isBuffer(imageBuffer) && imageBuffer.length > 0) {
      return 'data:image/jpeg;base64,' + imageBuffer.toString('base64');
    }
  } catch (err) {
    console.warn('[PROFILE] Failed to read default avatar from assets:', err?.message || err);
  }
  return null;
}

async function getProfilePictureDataUri(client, jid) {
  if (!client || !jid) return await getDefaultAvatarDataUri();
  try {
    const imageUrl = await client.profilePictureUrl(jid, 'image');
    if (!imageUrl) {
      return await getDefaultAvatarDataUri();
    }

    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      return await getDefaultAvatarDataUri();
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,` + imageBuffer.toString('base64');
  } catch (error) {
    console.warn('[PROFILE] Profile picture unavailable, using default asset:', error?.message || error);
    return await getDefaultAvatarDataUri();
  }
}

async function getGroupTitle(client, message) {
  const remoteJid = message?.key?.remoteJid;
  if (!remoteJid || !String(remoteJid).endsWith('@g.us')) return null;

  try {
    const metadata = await client.groupMetadata(remoteJid);
    return metadata?.subject || metadata?.name || null;
  } catch (error) {
    console.warn('[PROFILE] Failed to load group title:', error?.message || error);
    return null;
  }
}

async function generateProfileImage(user, avatarDataUri = null, groupTitle = null) {
  const svg = buildProfileSvg(user, avatarDataUri, groupTitle);
  return sharp(Buffer.from(svg, 'utf8'))
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function createTempImageFile(imageBuffer) {
  const filename = `albedo-profile-${Date.now()}-${crypto.randomUUID()}.png`;
  const filePath = path.join(os.tmpdir(), filename);
  await fs.writeFile(filePath, imageBuffer);
  return filePath;
}

async function removeTempFile(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('[PROFILE] Failed to remove temp file:', error?.message || error);
    }
  }
}

module.exports = {
  buildProfileSvg,
  getProfilePictureDataUri,
  getDefaultAvatarDataUri,
  getGroupTitle,
  generateProfileImage,
  createTempImageFile,
  removeTempFile,
};
