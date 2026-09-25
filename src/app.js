const path = require('node:path');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
} = require('@whiskeysockets/baileys');

const { loadCommands } = require('./core/command.loader');
const config = require('./config/bot.config');
const { handleMessage } = require('./handlers/message.handler');
const { handleGroupParticipantsUpdate } = require('./features/welcome/welcome.handler');
const { connect: connectDatabase } = require('./database');

async function bootstrap() {
  await connectDatabase();

  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '../storage/auth'));
  const { version } = await fetchLatestBaileysVersion();

  const commandMap = new Map();
  for (const command of loadCommands(path.join(__dirname, 'commands'))) {
    commandMap.set(command.name, command);
    for (const alias of command.aliases || []) {
      commandMap.set(alias, command);
    }
  }

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    browser: Browsers.windows(config.name || 'ALBEDO-BOT'),
    auth: state,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('Scan QR code berikut dengan WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);

      if (shouldReconnect) {
        bootstrap();
      }
    }

    if (connection === 'open') {
      console.log('Bot connected successfully.');
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
      console.error('[EVENT] group-participants.update error:', err);
    }
  });

  return sock;
}

bootstrap().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});

module.exports = { bootstrap };
