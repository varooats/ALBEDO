require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
} = require('@whiskeysockets/baileys');

const { logger, ANSI } = require('./utils/logger');
const { loadCommands } = require('./core/command.loader');
const config = require('./config/bot.config');
const { handleMessage } = require('./handlers/message.handler');
const { handleGroupParticipantsUpdate } = require('./features/welcome/welcome.handler');
const { connect: connectDatabase } = require('./database');

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function clearSessionFolder(authDir) {
  try {
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
  } catch (err) {
    logger.warn('Gagal membersihkan sesi kedaluwarsa', { reason: err?.message || err });
  }
}

let attemptCount = 0;

async function bootstrap() {
  if (attemptCount === 0) {
    logger.banner();
    logger.initStep('Loading environment');
  }

  // 1. Database
  await connectDatabase();
  const { initSystemState } = require('./services/system/system-control.service');
  await initSystemState();
  if (attemptCount === 0) {
    logger.initStep('Loading database');
  }

  // 2. Command registry
  const commandMap = new Map();
  for (const command of loadCommands(path.join(__dirname, 'commands'))) {
    commandMap.set(command.name, command);
    for (const alias of command.aliases || []) {
      commandMap.set(alias, command);
    }
  }
  if (attemptCount === 0) {
    logger.initStep('Loading command registry');
    logger.initStep('Loading middleware');
  }

  // 3. Auth & Session
  const authDir = path.join(__dirname, '../storage/auth');
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();
  if (attemptCount === 0) {
    logger.initStep('Loading WhatsApp session');
    logger.initStep('Establishing secure channel');
    logger.initStep('Synchronizing state');
  }

  // Determine login method: 'qr' or 'code' (pairing code)
  const isCliCode = process.argv.includes('--code') || process.argv.includes('--pairing');
  const isCliQr = process.argv.includes('--qr');
  const envMethod = String(process.env.LOGIN_METHOD || 'qr').toLowerCase();
  const usePairingCode = (isCliCode || envMethod === 'code' || envMethod === 'pairing') && !isCliQr;

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    browser: Browsers.windows(config.name || 'ALBEDO-BOT'),
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  // Pairing code registration if session is not yet registered
  if (usePairingCode && !sock.authState.creds.registered) {
    let phoneNumber = process.env.PAIRING_NUMBER || '';
    if (!phoneNumber) {
      console.log(`\n${ANSI.lavender}┌──────────────────────────────────────────────┐${ANSI.reset}`);
      console.log(`${ANSI.lavender}│${ANSI.reset}  ${ANSI.cyan}${ANSI.bold}ALBEDO WHATSAPP PAIRING CODE${ANSI.reset}                ${ANSI.lavender}│${ANSI.reset}`);
      console.log(`${ANSI.lavender}└──────────────────────────────────────────────┘${ANSI.reset}`);
      phoneNumber = await askQuestion(`${ANSI.cyan}?${ANSI.reset} Masukkan nomor WhatsApp bot (contoh: 628123456789): `);
    }

    const cleanNumber = String(phoneNumber).replace(/[^0-9]/g, '');
    if (cleanNumber) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(cleanNumber);
          const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
          logger.pairingCode(formatted);
        } catch (err) {
          logger.error('Gagal meminta pairing code', {
            module: 'auth.pairing',
            reason: err?.message || 'Timeout / Invalid number',
          });
        }
      }, 3000);
    } else {
      logger.warn('Nomor pairing tidak valid, fallback ke scan QR');
    }
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Show QR only if not using pairing code or if specifically requested
    if (qr && !usePairingCode) {
      logger.qrHeader();
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      attemptCount++;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      if (isLoggedOut) {
        logger.warn('WhatsApp session logged out / invalid', {
          state: 'logged_out',
          reason: 'Session expired or removed from phone',
          action: 'Resetting session for new QR/Pairing...',
        });

        // Bersihkan folder sesi lama yang sudah kedaluwarsa agar bot bisa meminta QR/Pairing baru
        clearSessionFolder(authDir);
        setTimeout(bootstrap, 2000);
        return;
      }

      logger.warn('WhatsApp connection unstable', {
        state: 'reconnecting',
        attempt: attemptCount,
        delay: '3000ms',
      });

      setTimeout(bootstrap, 3000);
    }

    if (connection === 'open') {
      attemptCount = 0;
      logger.systemReady();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
      if (!message.message || message.key?.fromMe) continue;
      await handleMessage(sock, message, commandMap);
    }
  });

  // Listen for group participant events (member join / leave)
  sock.ev.on('group-participants.update', async (update) => {
    try {
      await handleGroupParticipantsUpdate(sock, update);
    } catch (err) {
      logger.error('Error handling group-participants.update', {
        module: 'welcome.handler',
        reason: err?.message || 'Unknown error',
      });
    }
  });

  return sock;
}

bootstrap().catch((error) => {
  logger.error('Failed to start ALBEDO BOT', {
    module: 'bootstrap',
    reason: error?.message || error,
  });
  process.exit(1);
});

module.exports = { bootstrap };
