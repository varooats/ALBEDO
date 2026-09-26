/**
 * ALBEDO CYBERPUNK SOFT LOGGER
 * Palette: Cyan (accent), Violet (headers), Emerald (success/ok),
 * Coral/Rose (error soft), Amber (warning soft), Slate (dim/timestamp).
 */

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Cyberpunk soft colors
  cyan: '\x1b[38;2;69;222;230m',       // #45DEE6 - Neon Cyan soft
  lavender: '\x1b[38;2;192;132;252m',   // #C084FC - Soft Violet / Purple
  emerald: '\x1b[38;2;52;211;153m',    // #34D399 - Soft Emerald / Neon Mint
  rose: '\x1b[38;2;244;114;182m',      // #F472B6 - Soft Neon Rose / Pink
  coral: '\x1b[38;2;251;113;133m',     // #FB7185 - Soft Coral Red (No aggressive red)
  amber: '\x1b[38;2;251;191;36m',      // #FBBF24 - Soft Amber Yellow
  blue: '\x1b[38;2;96;165;250m',       // #60A5FA - Soft Electric Blue
  muted: '\x1b[38;2;148;163;184m',     // #94A3B8 - Slate
  darkGray: '\x1b[38;2;71;85;105m',    // #475569 - Darker Slate
};

function timestamp() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${ANSI.darkGray}[${h}:${m}:${s}]${ANSI.reset}`;
}

function tag(name, color = ANSI.cyan, pad = 10) {
  return `${color}${ANSI.bold}${name.padEnd(pad)}${ANSI.reset}`;
}

const logger = {
  banner() {
    console.log(`
${ANSI.lavender}▄█████  ██▓    ▄▄▄▄    ▓█████  ▓█████▄  ▒█████
   ▓█   ▀ ▓██▒   ▓█████▄  ▓█   ▀  ▒██▀ ██▌▒██▒  ██▒
   ▒███   ▒██░   ▒██▒ ▄██ ▒███    ░██   █▌▒██░  ██▒
   ▒▓█  ▄ ▒██░   ▒██░█▀   ▒▓█  ▄  ░▓█▄   ▌▒██   ██░
   ░▒████▒░██████▒▓█  ▀█▓ ░▒████▒ ░▒████▓ ░ ████▓▒░
   ░░ ▒░ ░░ ▒░▓  ░▒▓███▀▒ ░░ ▒░ ░  ▒▒▓  ▒ ░ ▒░▒░▒░
    ░ ░  ░░ ░ ▒  ░▒░▒   ░  ░ ░  ░  ░ ▒  ▒   ░ ▒ ▒░
      ░    ░ ░    ░    ░    ░     ░ ░  ░ ░ ░ ▒
             ░  ░ ░         ░  ░    ░      ░ ░ ░ ▒ ${ANSI.reset}

${ANSI.darkGray}──────────────────────────────────────────────────────────────${ANSI.reset}
 ${ANSI.cyan}${ANSI.bold}ALBEDO BOT${ANSI.reset} ${ANSI.darkGray}//${ANSI.reset} ${ANSI.lavender}CORE INITIALIZATION${ANSI.reset}
${ANSI.darkGray}──────────────────────────────────────────────────────────────${ANSI.reset}
`);
  },

  initStep(label) {
    const padded = label.padEnd(31, '.');
    console.log(`${ANSI.cyan}[+]${ANSI.reset} ${ANSI.muted}${padded}${ANSI.reset} ${ANSI.emerald}${ANSI.bold}OK${ANSI.reset}`);
  },

  systemReady() {
    console.log(`\n${ANSI.cyan}[ALBEDO]${ANSI.reset} ${ANSI.emerald}System ready.${ANSI.reset}`);
    console.log(`${ANSI.cyan}[ALBEDO]${ANSI.reset} ${ANSI.muted}Listening for incoming messages...${ANSI.reset}\n`);
  },

  msg(sender, content) {
    console.log(`${timestamp()}  ${tag('MSG', ANSI.cyan)} ${ANSI.lavender}${sender}${ANSI.reset} ${ANSI.darkGray}→${ANSI.reset} ${ANSI.bold}${content}${ANSI.reset}`);
  },

  cmd(name) {
    console.log(`${timestamp()}  ${tag('CMD', ANSI.lavender)} ${ANSI.muted}${name} executed${ANSI.reset}`);
  },

  resp(label, ms = null) {
    const duration = ms ? ` ${ANSI.darkGray}in${ANSI.reset} ${ANSI.emerald}${ms}ms${ANSI.reset}` : '';
    console.log(`${timestamp()}  ${tag('RESP', ANSI.emerald)} ${ANSI.muted}${label} sent${duration}${ANSI.reset}`);
  },

  media(label, ms = null) {
    const duration = ms ? ` ${ANSI.darkGray}(${ms}ms)${ANSI.reset}` : '';
    console.log(`${timestamp()}  ${tag('MEDIA', ANSI.rose)} ${ANSI.muted}${label}${duration}${ANSI.reset}`);
  },

  group(text) {
    console.log(`${timestamp()}  ${tag('GROUP', ANSI.blue)} ${ANSI.muted}${text}${ANSI.reset}`);
  },

  security(text) {
    console.log(`${timestamp()}  ${tag('SECURITY', ANSI.lavender)} ${ANSI.muted}${text}${ANSI.reset}`);
  },

  warn(message, details = null) {
    console.log(`${timestamp()}  ${tag('WARN', ANSI.amber)} ${ANSI.amber}${message}${ANSI.reset}`);
    if (details && typeof details === 'object') {
      const keys = Object.keys(details);
      keys.forEach((key, index) => {
        const isLast = index === keys.length - 1;
        const branch = isLast ? '└─' : '├─';
        const paddedKey = key.padEnd(8);
        console.log(`                     ${ANSI.darkGray}${branch}${ANSI.reset} ${ANSI.muted}${paddedKey}${ANSI.reset} : ${ANSI.amber}${details[key]}${ANSI.reset}`);
      });
    }
  },

  error(message, details = null) {
    console.log(`${timestamp()}  ${tag('ERROR', ANSI.coral)} ${ANSI.coral}${message}${ANSI.reset}`);
    if (details && typeof details === 'object') {
      const keys = Object.keys(details);
      keys.forEach((key, index) => {
        const isLast = index === keys.length - 1;
        const branch = isLast ? '└─' : '├─';
        const paddedKey = key.padEnd(8);
        console.log(`                     ${ANSI.darkGray}${branch}${ANSI.reset} ${ANSI.muted}${paddedKey}${ANSI.reset} : ${ANSI.coral}${details[key]}${ANSI.reset}`);
      });
    }
  },

  pairingCode(code) {
    console.log(`
${ANSI.lavender}┌──────────────────────────────────────────────┐${ANSI.reset}
${ANSI.lavender}│${ANSI.reset}  ${ANSI.cyan}${ANSI.bold}ALBEDO WHATSAPP PAIRING CODE${ANSI.reset}                ${ANSI.lavender}│${ANSI.reset}
${ANSI.lavender}│${ANSI.reset}  Code : ${ANSI.emerald}${ANSI.bold}${code}${ANSI.reset}                        ${ANSI.lavender}│${ANSI.reset}
${ANSI.lavender}└──────────────────────────────────────────────┘${ANSI.reset}
${ANSI.muted}Buka WhatsApp ${ANSI.darkGray}→${ANSI.muted} Perangkat Tertaut ${ANSI.darkGray}→${ANSI.muted} Tautkan dengan nomor telepon.${ANSI.reset}
`);
  },

  qrHeader() {
    console.log(`
${ANSI.lavender}┌──────────────────────────────────────────────┐${ANSI.reset}
${ANSI.lavender}│${ANSI.reset}  ${ANSI.cyan}${ANSI.bold}SCAN QR CODE UNTUK LOGIN WHATSAPP${ANSI.reset}           ${ANSI.lavender}│${ANSI.reset}
${ANSI.lavender}└──────────────────────────────────────────────┘${ANSI.reset}`);
  },
};

module.exports = {
  logger,
  ANSI,
};
